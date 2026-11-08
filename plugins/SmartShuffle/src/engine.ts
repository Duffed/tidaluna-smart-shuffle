export interface Track {
  id: string;
  playable: boolean;
  title?: string;
}
export interface Snapshot {
  source: string;
  eligible: boolean;
  reason?: string;
  playing: boolean;
  transition: string;
  currentId: string;
  currentUid: string;
  queueIds: string[];
  queueUids: string[];
  sourceIds: string[];
}
export interface Ports {
  snapshot(): Snapshot;
  radio(seed: string, signal: AbortSignal): Promise<Track[]>;
  collectionIds(source: string, signal: AbortSignal): Promise<string[]>;
  insert(id: string): string;
  remove(uid: string): void;
  report(message: string): void;
}

/** Pure orchestration; no Tidal, browser, credentials, or wall-clock dependencies. */
export class SmartShuffle {
  private enabled = false;
  private interval = 3;
  private count = 0;
  private source = '';
  private lastTransition = '';
  private suspended = true;
  private recent: string[] = [];
  private owned = new Map<string, { id: string; source: string }>();
  private request?: AbortController;
  private disposed = false;
  private lastMessage = '';

  constructor(private readonly ports: Ports) {}

  private report(message: string): void {
    if (message === this.lastMessage) return;
    this.lastMessage = message;
    this.ports.report(message);
  }

  configure(enabled: boolean, interval: number): void {
    interval = Number.isFinite(interval) ? Math.max(1, Math.min(20, Math.trunc(interval))) : 3;
    if (enabled === this.enabled && interval === this.interval) return;
    this.enabled = enabled;
    this.interval = interval;
    this.reset();
    this.tick();
  }

  private cancel(): void {
    this.request?.abort();
    this.request = undefined;
  }

  private cleanup(): void {
    const s = this.ports.snapshot();
    // Never stop the currently playing recommendation or touch another queue entry.
    for (const [uid, entry] of this.owned) {
      const index = s.queueUids.indexOf(uid);
      if (entry.source === s.source && index >= 0 && s.queueIds[index] === entry.id && uid !== s.currentUid)
        this.ports.remove(uid);
    }
    const current = this.owned.get(s.currentUid);
    this.owned = current?.source === s.source && current.id === s.currentId
      ? new Map([[s.currentUid, current]]) : new Map();
  }

  private reset(): void {
    this.cancel();
    this.count = 0;
    this.lastTransition = '';
    this.suspended = true;
    this.cleanup();
  }

  tick(): void {
    if (this.disposed) return;
    const s = this.ports.snapshot();
    if (s.source !== this.source) {
      this.source = s.source;
      this.reset();
    }
    if (!this.enabled || !s.eligible) {
      if (!this.suspended || this.request) this.reset();
      this.report(!this.enabled ? 'Smart Shuffle is off.' : s.reason ?? 'Paused for this playback source.');
      return;
    }
    this.suspended = false;
    // A changed queue/current context invalidates an in-flight request even while paused.
    if (s.transition !== this.lastTransition) this.cancel();
    if (!s.playing) { this.report(`Playback paused · ${this.count}/${this.interval} regular tracks.`); return; }
    if (!s.transition || s.transition === this.lastTransition) return;
    this.lastTransition = s.transition;
    this.recent.push(s.currentId);
    this.recent = this.recent.slice(-50);
    for (const [uid, entry] of this.owned) {
      const index = s.queueUids.indexOf(uid);
      if (entry.source !== s.source || index < 0 || s.queueIds[index] !== entry.id) this.owned.delete(uid);
    }
    if (this.owned.has(s.currentUid)) { this.report('Playing a recommendation · your collection resumes next.'); return; }
    // One outstanding recommendation at most, including when users move it in the queue.
    if ([...this.owned.keys()].some(uid => s.queueUids.includes(uid))) {
      this.report('A recommendation is already waiting in the queue.'); return;
    }
    this.count++;
    if (this.count < this.interval) { this.report(`Active · ${this.count}/${this.interval} regular tracks toward the next recommendation.`); return; }
    this.count = 0;
    this.report('Loading track radio…');
    const controller = this.request = new AbortController();
    void this.recommend(s, controller);
  }

  private async recommend(start: Snapshot, controller: AbortController): Promise<void> {
    try {
      const [tracks, collectionIds] = await Promise.all([
        this.ports.radio(start.currentId, controller.signal),
        this.ports.collectionIds(start.source, controller.signal),
      ]);
      const now = this.ports.snapshot();
      if (controller.signal.aborted || this.disposed || !this.enabled || !now.eligible ||
          now.source !== start.source || now.transition !== start.transition) return;
      const excluded = new Set([...collectionIds, ...now.sourceIds, ...now.queueIds, ...this.recent, start.currentId]);
      const candidate = tracks.find(track => track.playable && !excluded.has(track.id));
      if (!candidate) {
        this.report(`No new recommendation: ${tracks.length} radio tracks, ${tracks.filter(track => track.playable).length} playable; remaining tracks are already in your collection, queue, or recent history.`);
        return;
      }
      const uid = this.ports.insert(candidate.id);
      this.owned.set(uid, { id: candidate.id, source: start.source });
      this.report(candidate.title ? `Queued recommendation: ${candidate.title}.` : 'Recommendation queued to play next.');
    } catch (error) {
      if (!controller.signal.aborted) this.report(`Recommendation skipped: ${String(error)}`);
    } finally {
      if (this.request === controller) this.request = undefined;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.reset();
  }
}
