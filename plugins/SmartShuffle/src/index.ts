import type { LunaUnload } from '@luna/core';
import { redux } from '@luna/lib';
import { SmartShuffle } from './engine';
import { makePorts } from './adapter';
import { mountPlayerSwitch } from './player';
import { getPreferences, loadPreferences, setStatus, setDetails, setEngineState, subscribePreferences } from './preferences';
import { bindSuggestNow } from './commands';

export { Settings } from './Settings';
export const unloads = new Set<LunaUnload>();

loadPreferences();
let timer: ReturnType<typeof setInterval> | undefined;
const ports = makePorts(message => {
  setStatus(message);
  console.info('[SmartShuffle]', message);
}, message => {
  setDetails(message);
  console.info('[SmartShuffle radio-format]', message);
});
ports.publish = state => {
  setEngineState(state);
  if (state.timerNeeded && !timer) timer = setInterval(schedule, 250);
  if (!state.timerNeeded && timer) { clearInterval(timer); timer = undefined; }
};
const engine = new SmartShuffle(ports);
const configure = () => {
  engine.configure(getPreferences());
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
const unsubscribeSettings = subscribePreferences(configure);
const unbindSuggest = bindSuggestNow(() => {
  try { engine.requestNow(); }
  catch (error) { setStatus(`Client interface unavailable: ${String(error)}`); }
});
const removeButton = mountPlayerSwitch();
configure();
schedule();
unloads.add(() => {
  stopped = true;
  unsubscribeStore();
  unsubscribeSettings();
  unbindSuggest();
  if (timer) { clearInterval(timer); timer = undefined; }
  removeButton();
  engine.dispose();
});
