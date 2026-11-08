export interface ResponseBus {
  listen(type: string, listener: (payload: unknown) => void): () => void;
  dispatch(type: string, payload: unknown): void;
}

/** Listen BEFORE dispatch; unrelated user radio requests must never resolve our request. */
export function request<T>(bus: ResponseBus, options: {
  action: string; payload: unknown; success: string; failure?: string;
  matches(payload: unknown): boolean; signal: AbortSignal; timeoutMs?: number;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (options.signal.aborted) return reject(new Error('Aborted'));
    const disposers: (() => void)[] = [];
    const finish = (error?: unknown, value?: unknown) => {
      clearTimeout(timer);
      options.signal.removeEventListener('abort', abort);
      disposers.forEach(dispose => dispose());
      if (error) reject(error); else resolve(value as T);
    };
    const abort = () => finish(new Error('Aborted'));
    const timer = setTimeout(() => finish(new Error(`Timed out: ${options.action}`)), options.timeoutMs ?? 8000);
    options.signal.addEventListener('abort', abort, { once: true });
    disposers.push(bus.listen(options.success, payload => {
      if (options.matches(payload)) finish(undefined, payload);
    }));
    if (options.failure) disposers.push(bus.listen(options.failure, payload => {
      if (options.matches(payload)) finish(new Error(`Radio request failed: ${options.action}`));
    }));
    try { bus.dispatch(options.action, options.payload); } catch (error) { finish(error); }
  });
}
