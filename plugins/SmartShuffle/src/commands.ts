// A reload-safe bridge shared by the settings panel and the native player controls.
let suggest: (() => void) | undefined;
export function bindSuggestNow(handler: () => void): () => void {
  suggest = handler;
  return () => { if (suggest === handler) suggest = undefined; };
}
export function suggestNow(): void { suggest?.(); }
