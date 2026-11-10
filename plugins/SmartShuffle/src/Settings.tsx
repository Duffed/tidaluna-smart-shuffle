import React from 'react';
import { getPreferences, getStatus, getDetails, subscribe, updatePreferences } from './preferences';

export function Settings() {
  const prefs = React.useSyncExternalStore(subscribe, getPreferences);
  const status = React.useSyncExternalStore(subscribe, getStatus);
  const details = React.useSyncExternalStore(subscribe, getDetails);
  return <section style={{ padding: 16, display: 'grid', gap: 16 }}>
    <h2>Smart Shuffle</h2>
    <label><input type="checkbox" checked={prefs.enabled}
      onChange={event => updatePreferences({ enabled: event.target.checked })} /> Enable Smart Shuffle</label>
    <label>Recommend a track after every <input type="number" min={1} max={20} step={1}
      value={prefs.interval} onChange={event => {
        const number = event.target.valueAsNumber;
        if (Number.isFinite(number)) updatePreferences({ interval: number });
      }} /> regular tracks</label>
    <p>One switch for all music sources: albums, playlists, favorites, search, and radio.
      Skipped tracks count; recommendations do not. You can also use Tidal's regular shuffle.</p>
    <p>The star is teal when enabled and gray when off. The status explains temporary pauses.</p>
    <p role="status">{status}</p>
    <details><summary>Last radio request diagnostics</summary><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{details}</pre></details>
    <small>Version 0.2.1 · Playlist and favorites playback tested in the desktop client. Album live verification pending.</small>
  </section>;
}
