import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPreferences, loadPreferences, updatePreferences } from '../plugins/SmartShuffle/src/preferences';

test('old preferences migrate with albums disabled; album opt-in persists without changing the global switch', () => {
  const entries = new Map<string, string>();
  const key = '@local/smart-shuffle/preferences/v1';
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
  } });
  try {
    entries.set(key, JSON.stringify({ enabled: true, interval: 3 }));
    loadPreferences(); assert.deepEqual(getPreferences(), { enabled: true, interval: 3, includeAlbums: false });
    updatePreferences({ includeAlbums: true }); loadPreferences();
    assert.deepEqual(getPreferences(), { enabled: true, interval: 3, includeAlbums: true });
    updatePreferences({ includeAlbums: false });
    assert.equal(getPreferences().enabled, true);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
