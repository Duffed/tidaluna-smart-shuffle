import React from 'react';
import { getPreferences, getStatus, getDetails, getEngineState, subscribe, updatePreferences } from './preferences';
import { suggestNow } from './commands';

export function Settings() {
  const prefs = React.useSyncExternalStore(subscribe, getPreferences);
  const status = React.useSyncExternalStore(subscribe, getStatus);
  const details = React.useSyncExternalStore(subscribe, getDetails);
  const state = React.useSyncExternalStore(subscribe, getEngineState);
  return <section style={{ padding: 16, display: 'grid', gap: 16 }}>
    <h2>Smart Shuffle</h2>
    <label><input type="checkbox" checked={prefs.enabled}
      onChange={event => updatePreferences({ enabled: event.target.checked })} /> Enable automatic recommendations</label>
    <label>Recommendation source: <select value={prefs.recommendationSource}
      onChange={event => updatePreferences({ recommendationSource: event.target.value === 'current' ? 'current' : 'queue' })}>
      <option value="queue">Queue</option><option value="current">Current track</option>
    </select></label>
    <label>Recommend after every <input type="number" min={1} max={20} step={1}
      value={prefs.interval} onChange={event => {
        const number = event.target.valueAsNumber;
        if (Number.isFinite(number)) updatePreferences({ interval: number });
      }} /> regular tracks</label>
    <label>Count tracks: <select value={prefs.countMode}
      onChange={event => updatePreferences({ countMode: event.target.value === '30-seconds' ? '30-seconds' : 'start' })}>
      <option value="start">On playback start</option>
      <option value="30-seconds">After 30 seconds of playback</option>
    </select></label>
    <div><button type="button" disabled={!state.canSuggest} onClick={suggestNow}
      style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid currentColor',
        color: 'inherit', background: 'rgba(255,255,255,.08)', opacity: state.canSuggest ? 1 : .5,
        cursor: state.canSuggest ? 'pointer' : 'default' }}
      title={state.unavailableReason || 'Add one recommendation to play next without starting playback.'}>
      {state.loading ? 'Loading recommendations…' : 'Suggest now'}
    </button>{!state.canSuggest && <p>{state.unavailableReason}</p>}</div>
    <p>Queue uses up to five tracks spread across your loaded remaining queue. Current track uses one track radio.
      Recommendations never count toward the interval.</p>
    <p>On playback start includes skipped tracks. After 30 seconds counts actual playback time; pauses and seeking do not add time.
      Suggest now also works with automatic recommendations off.</p>
    <p>Works with all local music sources. Remote playback, Repeat One, and videos temporarily suspend recommendations.</p>
    <p role="status">{status} · Progress: {state.count}/{prefs.interval} · Source: {prefs.recommendationSource === 'queue' ? 'Queue' : 'Current track'}</p>
    <details><summary>Last radio request diagnostics</summary><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{details}</pre></details>
    <small>Version 0.4.1</small>
  </section>;
}
