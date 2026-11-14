import { defaults, normalizeOptions, type Options, type EngineState } from './engine';
export { defaults } from './engine';
export type Preferences = Options;
const key = '@local/smart-shuffle/preferences/v1';
let value: Preferences = { ...defaults };
let status = 'Ready';
let details = 'No track radio request yet.';
let state: EngineState = {
  loading: false, canSuggest: false, unavailableReason: 'Waiting for playback.',
  pending: false, count: 0, timerNeeded: false, message: status,
};
const listeners = new Set<() => void>();
const preferenceListeners = new Set<() => void>();
export const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const subscribePreferences = (listener: () => void) => {
  preferenceListeners.add(listener); return () => { preferenceListeners.delete(listener); };
};
const notify = () => listeners.forEach(listener => listener());
export const getPreferences = () => value;
export const getStatus = () => status;
export const getDetails = () => details;
export const getEngineState = () => state;
export function setEngineState(next: EngineState): void {
  if (JSON.stringify(next) === JSON.stringify(state)) return;
  state = next;
  notify();
}
export function setDetails(message: string): void { details = message; notify(); }
export function setStatus(message: string): void { status = message; notify(); }
export function loadPreferences(): void {
  value = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (saved && typeof saved === 'object') value = normalizeOptions(saved);
  } catch { status = 'Could not load preferences; using defaults.'; }
}
export function updatePreferences(patch: Partial<Preferences>): void {
  const next = normalizeOptions({ ...value, ...patch });
  if (JSON.stringify(next) === JSON.stringify(value)) return;
  value = next;
  let saveFailed = false;
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { saveFailed = true; }
  preferenceListeners.forEach(listener => listener());
  if (saveFailed) status = 'Preferences apply to this session; saving failed.';
  notify();
}
