import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults, getPreferences, loadPreferences, updatePreferences, subscribePreferences, setStatus, setDetails } from '../plugins/SmartShuffle/src/preferences';

test('legacy album preference is ignored while global switch and interval persist', () => {
  const entries = new Map<string, string>();
  const key = '@local/smart-shuffle/preferences/v1';
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
  } });
  try {
    entries.set(key, JSON.stringify({ enabled: true, interval: 3, includeAlbums: false }));
    loadPreferences(); assert.deepEqual(getPreferences(), { ...defaults, enabled: true, interval: 3 });
    updatePreferences({ enabled: false }); loadPreferences();
    assert.deepEqual(getPreferences(), { ...defaults, enabled: false, interval: 3 });
    assert.equal(JSON.parse(entries.get(key)!).includeAlbums, undefined);
    updatePreferences({ enabled: true });
    assert.equal(getPreferences().enabled, true);
    updatePreferences({ recommendationSource: 'current', countMode: '30-seconds', interval: 7 });
    loadPreferences();
    assert.deepEqual(getPreferences(), { enabled: true, recommendationSource: 'current', countMode: '30-seconds', interval: 7 });
    entries.set(key, JSON.stringify({ enabled: true, interval: 99, recommendationSource: 'invalid', countMode: 'invalid' }));
    loadPreferences();
    assert.deepEqual(getPreferences(), { ...defaults, enabled: true, interval: 20 });
    entries.set(key, '{broken');
    loadPreferences();
    assert.deepEqual(getPreferences(), defaults);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('status and diagnostics never reconfigure the engine', () => {
  let calls = 0;
  const unsubscribe = subscribePreferences(() => calls++);
  setStatus('Loading recommendations…'); setDetails('Radio diagnostic');
  assert.equal(calls, 0);
  unsubscribe();
});
