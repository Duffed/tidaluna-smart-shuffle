import type { LunaUnload } from '@luna/core';
import { redux } from '@luna/lib';
import { SmartShuffle } from './engine';
import { makePorts } from './adapter';
import { mountPlayerSwitch } from './player';
import { getPreferences, loadPreferences, setStatus, setDetails, subscribe } from './preferences';

export { Settings } from './Settings';
export const unloads = new Set<LunaUnload>();

loadPreferences();
const engine = new SmartShuffle(makePorts(message => {
  setStatus(message);
  console.info('[SmartShuffle]', message);
}, message => {
  setDetails(message);
  console.info('[SmartShuffle radio-format]', message);
}, () => getPreferences().includeAlbums));
const configure = () => {
  const prefs = getPreferences();
  engine.configure(prefs.enabled, prefs.interval);
  // Album opt-in can change eligibility without changing global activation/interval.
  engine.tick();
};
let stopped = false;
let scheduled = false;
const schedule = () => {
  if (stopped || scheduled) return;
  scheduled = true;
  // Interceptors run before reducers; read the settled state after dispatch completes.
  queueMicrotask(() => {
    scheduled = false;
    if (!stopped) {
      try { engine.tick(); }
      catch (error) { setStatus(`Client interface unavailable: ${String(error)}`); }
    }
  });
};
const unsubscribeStore = redux.store.subscribe(schedule);
const unsubscribeSettings = subscribe(configure);
const removeButton = mountPlayerSwitch();
configure();
schedule();
unloads.add(() => {
  stopped = true;
  unsubscribeStore();
  unsubscribeSettings();
  removeButton();
  engine.dispose();
});
