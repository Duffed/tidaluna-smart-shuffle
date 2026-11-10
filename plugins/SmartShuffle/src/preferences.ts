export interface Preferences { enabled: boolean; interval: number }
export const defaults: Preferences = { enabled: false, interval: 3 };
const key = '@local/smart-shuffle/preferences/v1';
let value: Preferences = { ...defaults };
let status = 'Ready';
let details = 'No track radio request yet.';
const listeners = new Set<() => void>();
export const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const notify = () => listeners.forEach(listener => listener());
export const getPreferences = () => value;
export const getStatus = () => status;
export const getDetails = () => details;
export function setDetails(message: string): void { details = message; notify(); }
export function setStatus(message: string): void { status = message; notify(); }
export function loadPreferences(): void {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (saved) value = {
      enabled: saved.enabled === true,
      interval: Number.isFinite(saved.interval) ? Math.max(1, Math.min(20, Math.trunc(saved.interval))) : 3,
    };
  } catch { status = 'Could not load preferences; using defaults.'; }
}
export function updatePreferences(patch: Partial<Preferences>): void {
  const next = { ...value, ...patch };
  next.interval = Number.isFinite(next.interval) ? Math.max(1, Math.min(20, Math.trunc(next.interval))) : 3;
  value = next;
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { status = 'Preferences apply to this session; saving failed.'; }
  notify();
}
