import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { TidalState } from '@luna/lib';

const listeners = new Map<string, Set<(payload: unknown) => void>>();
const dispatched: string[] = [];
const state: TidalState = {
  session: { userId: 1, countryCode: 'DE' }, activePlayer: { activePlayer: 'PLAYER_SDK' },
  remotePlayback: { isConnected: false }, settings: { explicitContentEnabled: false },
  favorites: { tracks: [1, 'favorite-not-loaded-in-queue'] },
  playQueue: {
    sourceEntityType: 'playlist', sourceEntityId: 'playlist-id', currentIndex: 0,
    repeatMode: 0, elements: [{ uid: 'original', mediaItemId: 1, context: { type: 'playlist' } }],
    originalSource: [{ uid: 'original', mediaItemId: 1, context: { type: 'playlist' } }],
  },
  playbackControls: {
    playbackState: 'PLAYING', mediaProduct: { productType: 'track' },
    playbackContext: { actualProductId: '1', playbackSessionId: 'session-1' },
  },
};
const emit = (type: string, payload: unknown) => [...listeners.get(type) ?? []].forEach(fn => fn(payload));
const actions: Record<string, (payload: unknown) => void> = {
  'mix/LOAD_TRACK_MIX_ID': () => {
    dispatched.push('mix-id');
    emit('mix/LOAD_TRACK_MIX_ID_SUCCESS', { trackId: 'other', mixId: 'wrong' });
    emit('mix/LOAD_TRACK_MIX_ID_SUCCESS', { trackId: 1, mixId: 'correct' });
  },
  'mix/LOAD_TRACK_LIST_FOR_MIX_ID': payload => {
    assert.equal((payload as { mixId: string }).mixId, 'correct');
    dispatched.push('mix-tracks');
    emit('mix/LOAD_ALL_MIX_MEDIA_ITEMS_SUCCESS', { mixId: 'wrong', mediaItems: [{ id: 'wrong' }] });
    emit('mix/LOAD_ALL_MIX_MEDIA_ITEMS_SUCCESS', { mixId: 'correct', mediaItems: [
      { id: 2, contentType: 'track', allowStreaming: true, streamReady: true },
      { id: 3, contentType: 'track', allowStreaming: false, streamReady: true },
      { id: 4, contentType: 'track', allowStreaming: true, streamReady: true, explicit: true },
      { id: 5, contentType: 'video', allowStreaming: true, streamReady: true },
    ] });
  },
  'playQueue/REMOVE_ELEMENT': payload => {
    const uid = (payload as { uid: string }).uid;
    state.playQueue.elements = state.playQueue.elements.filter(item => item.uid !== uid);
  },
};
(globalThis as typeof globalThis & { __smartShuffleTestLib: unknown }).__smartShuffleTestLib = {
  redux: {
    store: { getState: () => state }, actions,
    intercept(type: string, _unloads: unknown, callback: (payload: unknown) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(callback);
      return () => { listeners.get(type)!.delete(callback); };
    },
  },
  PlayState: { playNext(trackId: string) {
    state.playQueue.elements.push({ uid: 'inserted-uid', mediaItemId: trackId, context: { type: 'UNKNOWN' } });
  } },
  TidalApi: { getAuthHeaders: async () => ({ Authorization: 'Bearer test-only' }) },
};
// Dynamic import ensures mock modules are initialized after the fixture above.
const { snapshot, makePorts } = await import('../plugins/SmartShuffle/src/adapter');

test('adapter normalizes IDs, detects transitions, and gates playlist/local/repeat/video playback', () => {
  assert.equal(snapshot().eligible, true); assert.equal(snapshot().currentId, '1');
  assert.equal(snapshot().transition, 'original:session-1');
  state.playbackControls.playbackContext!.actualProductId = 'old'; assert.equal(snapshot().transition, '');
  state.playbackControls.playbackContext!.actualProductId = '1';
  state.remotePlayback.isConnected = true; assert.equal(snapshot().eligible, false); state.remotePlayback.isConnected = false;
  state.playQueue.repeatMode = 2; assert.equal(snapshot().eligible, false); state.playQueue.repeatMode = 0;
  state.playQueue.sourceEntityType = 'album'; assert.equal(snapshot().eligible, true); state.playQueue.sourceEntityType = 'playlist';
  state.playbackControls.mediaProduct.productType = 'video'; assert.equal(snapshot().eligible, false);
  state.playbackControls.mediaProduct.productType = 'track';
  state.activePlayer.activePlayer = 'EXTERNAL_PLAYER'; assert.equal(snapshot().eligible, false);
  state.activePlayer.activePlayer = 'PLAYER_SDK';
});
test('favorites work without a playlist ID and exclude the full live favorite-ID list without network requests', async () => {
  const previousType = state.playQueue.sourceEntityType, previousId = state.playQueue.sourceEntityId;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Favorites must use the local complete ID list'); };
  try {
    const ports = makePorts(() => {});
    for (const type of ['favoriteTracks', 'MY_TRACKS']) {
      state.playQueue.sourceEntityType = type; state.playQueue.sourceEntityId = '';
      assert.equal(snapshot().eligible, true);
      assert.deepEqual(await ports.collectionIds(snapshot().source, new AbortController().signal), ['1', 'favorite-not-loaded-in-queue']);
    }
    state.favorites.tracks.push(99);
    assert.ok((await ports.collectionIds(snapshot().source, new AbortController().signal)).includes('99'));
    state.favorites.tracks.pop();
    const previousFavorites = state.favorites.tracks;
    state.favorites.tracks = [];
    await assert.rejects(ports.collectionIds(snapshot().source, new AbortController().signal), /favorites list/);
    state.favorites.tracks = previousFavorites;
  } finally {
    state.playQueue.sourceEntityType = previousType; state.playQueue.sourceEntityId = previousId;
    globalThis.fetch = previousFetch;
  }
});
test('MY_TRACKS original context identifies favorites for a generic trackList source, including during recommendations', () => {
  const previousType = state.playQueue.sourceEntityType;
  const originalContext = state.playQueue.originalSource[0].context;
  const currentContext = state.playQueue.elements[0].context;
  try {
    state.playQueue.sourceEntityType = 'trackList';
    state.playQueue.originalSource[0].context = { type: 'MY_TRACKS' };
    state.playQueue.elements[0].context = { type: 'UNKNOWN' };
    assert.equal(snapshot().eligible, true);
    assert.equal(JSON.parse(snapshot().source)[2], 'favorites');
    state.playQueue.sourceEntityType = 'mix';
    assert.equal(snapshot().eligible, true);
  } finally {
    state.playQueue.sourceEntityType = previousType;
    state.playQueue.originalSource[0].context = originalContext;
    state.playQueue.elements[0].context = currentContext;
  }
});
test('live favorites source my_items requires MY_TRACKS and stays recognized during an inserted recommendation', async () => {
  const previousType = state.playQueue.sourceEntityType, previousId = state.playQueue.sourceEntityId;
  const originalContext = state.playQueue.originalSource[0].context;
  const currentContext = state.playQueue.elements[0].context;
  try {
    state.playQueue.sourceEntityType = 'my_items';
    state.playQueue.sourceEntityId = '';
    state.playQueue.originalSource[0].context = { type: 'MY_TRACKS' };
    const source = snapshot().source;
    assert.equal(snapshot().eligible, true);
    assert.equal(JSON.parse(source)[2], 'favorites');
    assert.deepEqual(await makePorts(() => {}).collectionIds(source, new AbortController().signal), ['1', 'favorite-not-loaded-in-queue']);
    state.playQueue.elements[0].context = { type: 'UNKNOWN' };
    assert.equal(snapshot().source, source);
    assert.equal(snapshot().eligible, true);
    state.playQueue.originalSource[0].context = { type: 'MY_VIDEOS' };
    assert.equal(snapshot().eligible, true);
    state.playQueue.originalSource[0].context = { type: 'UNKNOWN' };
    assert.equal(snapshot().eligible, true);
  } finally {
    state.playQueue.sourceEntityType = previousType; state.playQueue.sourceEntityId = previousId;
    state.playQueue.originalSource[0].context = originalContext;
    state.playQueue.elements[0].context = currentContext;
  }
});
test('albums work globally; remote playback, repeat one and videos remain suspended', () => {
  const previousType = state.playQueue.sourceEntityType;
  try {
    state.playQueue.sourceEntityType = 'album';
    assert.equal(makePorts(() => {}).snapshot().eligible, true);
    state.remotePlayback.isConnected = true; assert.equal(snapshot().eligible, false);
    state.remotePlayback.isConnected = false;
    state.playQueue.repeatMode = 2; assert.equal(snapshot().eligible, false);
    state.playQueue.repeatMode = 0;
    state.playbackControls.mediaProduct.productType = 'video'; assert.equal(snapshot().eligible, false);
  } finally {
    state.playQueue.sourceEntityType = previousType;
    state.remotePlayback.isConnected = false; state.playQueue.repeatMode = 0;
    state.playbackControls.mediaProduct.productType = 'track';
  }
});
test('collection identity separates playlist, favorites and album contexts even if source IDs match', () => {
  const previousType = state.playQueue.sourceEntityType;
  try {
    const sources = ['playlist', 'favoriteTracks', 'album'].map(type => {
      state.playQueue.sourceEntityType = type; return snapshot().source;
    });
    assert.equal(new Set(sources).size, 3);
  } finally { state.playQueue.sourceEntityType = previousType; }
});
test('album membership uses the album endpoint and reads all pages', async () => {
  const previousType = state.playQueue.sourceEntityType, previousId = state.playQueue.sourceEntityId;
  const originalFetch = globalThis.fetch; const urls: string[] = [];
  try {
    state.playQueue.sourceEntityType = 'album'; state.playQueue.sourceEntityId = 'album-id';
    globalThis.fetch = async url => {
      urls.push(String(url));
      return new Response(JSON.stringify({ totalNumberOfItems: 2, items: [{ id: urls.length }] }));
    };
    assert.deepEqual(await makePorts(() => {}).collectionIds(snapshot().source, new AbortController().signal), ['1', '2']);
    assert.match(urls[0], /\/albums\/album-id\/items/); assert.match(urls[1], /offset=1/);
  } finally {
    state.playQueue.sourceEntityType = previousType; state.playQueue.sourceEntityId = previousId;
    globalThis.fetch = originalFetch;
  }
});
test('adapter loads radio without PLAY_MIX, correlates IDs, filters streaming and explicit flags', async () => {
  const tracks = await makePorts(() => {}).radio('1', new AbortController().signal);
  assert.deepEqual(dispatched, ['mix-id', 'mix-tracks']);
  assert.deepEqual(tracks, [
    { id: '2', playable: true }, { id: '3', playable: false },
    { id: '4', playable: false }, { id: '5', playable: false },
  ]);
  assert.equal([...listeners.values()].reduce((n, s) => n + s.size, 0), 0);
});
test('live radio payload wraps tracks in item/type; streaming, video and explicit filters remain enforced', async () => {
  const previous = actions['mix/LOAD_TRACK_LIST_FOR_MIX_ID'];
  actions['mix/LOAD_TRACK_LIST_FOR_MIX_ID'] = () => {
    emit('mix/LOAD_ALL_MIX_MEDIA_ITEMS_SUCCESS', { mixId: 'correct', mediaItems: [
      { type: 'track', item: { id: 6, title: 'Live radio result', contentType: 'track', allowStreaming: true, streamReady: true } },
      { type: 'track', item: { id: 7, allowStreaming: true, streamReady: true } },
      { type: 'video', item: { id: 8, contentType: 'track', allowStreaming: true, streamReady: true } },
      { type: 'track', item: { id: 9, contentType: 'track', allowStreaming: false, streamReady: true } },
      { type: 'track', item: { id: 10, contentType: 'track', allowStreaming: true, streamReady: true, explicit: true } },
    ] });
  };
  try {
    const diagnostics: string[] = [];
    const tracks = await makePorts(() => {}, message => diagnostics.push(message)).radio('1', new AbortController().signal);
    assert.deepEqual(tracks, [
      { id: '6', title: 'Live radio result', playable: true }, { id: '7', playable: true },
      { id: '8', playable: false }, { id: '9', playable: false }, { id: '10', playable: false },
    ]);
    assert.match(diagnostics[0], /5 tracks, 2 playable/);
  } finally { actions['mix/LOAD_TRACK_LIST_FOR_MIX_ID'] = previous; }
});
test('playlist adapter paginates, caches full membership and preserves request auth/country', async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (url, options) => {
    urls.push(String(url));
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer test-only');
    return new Response(JSON.stringify({ totalNumberOfItems: 2, items: [{ item: { id: urls.length } }] }));
  };
  try {
    const ports = makePorts(() => {}); const signal = new AbortController().signal;
    assert.deepEqual(await ports.collectionIds(snapshot().source, signal), ['1', '2']);
    assert.deepEqual(await ports.collectionIds(snapshot().source, signal), ['1', '2']);
    assert.equal(urls.length, 2); assert.match(urls[0], /countryCode=DE/); assert.match(urls[1], /offset=1/);
  } finally { globalThis.fetch = originalFetch; }
});
test('incomplete or inaccessible playlists fail instead of accepting unfiltered recommendations', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ totalNumberOfItems: 2, items: [] }));
    await assert.rejects(makePorts(() => {}).collectionIds(snapshot().source, new AbortController().signal), /Incomplete/);
    globalThis.fetch = async () => new Response('', { status: 403 });
    await assert.rejects(makePorts(() => {}).collectionIds(snapshot().source, new AbortController().signal), /403/);
  } finally { globalThis.fetch = originalFetch; }
});
test('queue insertion identifies its UID and removal leaves a manual item with the same ID intact', () => {
  const ports = makePorts(() => {});
  state.playQueue.elements.push({ uid: 'manual-uid', mediaItemId: '2', context: { type: 'UNKNOWN' } });
  const uid = ports.insert('2'); assert.equal(uid, 'inserted-uid'); ports.remove(uid);
  assert.ok(state.playQueue.elements.some(item => item.uid === 'manual-uid'));
});

test('all music sources work without collection IDs or collection API requests', async () => {
  const previousType = state.playQueue.sourceEntityType, previousId = state.playQueue.sourceEntityId;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('No collection API for generic sources'); };
  try {
    const ports = makePorts(() => {});
    for (const type of ['search', 'mix', 'radio', 'artist', 'track', 'trackList', '', 'future-source', 'album', 'playlist']) {
      state.playQueue.sourceEntityType = type; state.playQueue.sourceEntityId = '';
      assert.equal(ports.snapshot().eligible, true, type);
      assert.deepEqual(await ports.collectionIds(snapshot().source, new AbortController().signal), []);
      assert.deepEqual(snapshot().sourceIds, ['1']);
    }
  } finally {
    state.playQueue.sourceEntityType = previousType; state.playQueue.sourceEntityId = previousId;
    globalThis.fetch = previousFetch;
  }
});
