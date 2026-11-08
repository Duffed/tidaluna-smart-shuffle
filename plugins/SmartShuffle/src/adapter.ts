import { PlayState, redux, TidalApi } from '@luna/lib';
import type { Ports, Snapshot, Track } from './engine';
import { request, type ResponseBus } from './responses';

const id = (value: unknown) => value == null ? '' : String(value);
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};

export const bus: ResponseBus = {
  listen: (type, callback) => redux.intercept(type, null, payload => { callback(payload); }),
  dispatch: (type, payload) => {
    const action = redux.actions[type];
    if (!action) throw new Error(`TidaLuna action is unavailable: ${type}`);
    action(payload);
  },
};

export function snapshot(includeAlbums = false): Snapshot {
  const state = redux.store.getState();
  const queue = state.playQueue;
  const current = queue.elements[queue.currentIndex];
  const playback = state.playbackControls;
  const context = playback.playbackContext;
  const currentId = id(current?.mediaItemId);
  const coherent = currentId !== '' && currentId === id(context?.actualProductId);
  const entityType = queue.sourceEntityType?.toLowerCase() ?? '';
  const kind = entityType === 'playlist' ? 'playlist'
    : entityType === 'favoritetracks' || entityType === 'my_tracks' ||
      ((!entityType || entityType === 'tracklist') && queue.originalSource[0]?.context.type === 'MY_TRACKS') ? 'favorites'
    : entityType === 'album' ? 'album' : entityType;
  const reason = !['playlist', 'favorites', 'album'].includes(kind) ? 'Available for playlists, favorites, and optionally albums.'
    : kind === 'album' && !includeAlbums ? 'Disabled for albums. Enable albums in the plugin settings.'
    : kind !== 'favorites' && !queue.sourceEntityId ? 'Waiting for the music collection to load.'
    : state.remotePlayback?.isConnected || state.activePlayer?.activePlayer === 'EXTERNAL_PLAYER' ? 'Paused during remote playback.'
    : queue.repeatMode === 2 ? 'Paused while Repeat One is enabled.'
    : playback.mediaProduct?.productType !== 'track' ? 'Available for music tracks only.' : undefined;
  return {
    // Include user + country to invalidate sessions/caches when the account changes.
    source: JSON.stringify([state.session.userId, state.session.countryCode, kind, kind === 'favorites' ? 'favorites' : queue.sourceEntityId]),
    eligible: reason === undefined,
    reason,
    playing: playback.playbackState === 'PLAYING',
    transition: coherent ? `${current?.uid}:${context?.playbackSessionId ?? ''}` : '',
    currentId, currentUid: current?.uid ?? '',
    queueIds: queue.elements.map(item => id(item.mediaItemId)),
    queueUids: queue.elements.map(item => item.uid),
    sourceIds: queue.originalSource.map(item => id(item.mediaItemId)),
  };
}

export function makePorts(report: (message: string) => void, diagnose: (message: string) => void = () => {}, includeAlbums: () => boolean = () => false): Ports {
  let collectionCache: { source: string; ids: string[]; expires: number } | undefined;
  let lastSource = '';
  return {
    snapshot() {
      const result = snapshot(includeAlbums());
      if (result.source !== lastSource) {
        lastSource = result.source;
        const state = redux.store.getState();
        diagnose(`Playback source: ${state.playQueue.sourceEntityType || '(empty)'}; context: ${state.playQueue.originalSource[0]?.context.type ?? '(empty)'}.`);
      }
      return result;
    },
    report,
    async radio(seed, signal) {
      const mix = await request<{ mixId: string | number; trackId: string | number }>(bus, {
        action: 'mix/LOAD_TRACK_MIX_ID', payload: { id: seed },
        success: 'mix/LOAD_TRACK_MIX_ID_SUCCESS', failure: 'mix/LOAD_TRACK_MIX_ID_FAIL',
        matches: payload => id(record(payload).trackId) === seed, signal,
      });
      if (!id(mix.mixId)) throw new Error('Track radio did not return a mix ID');
      const response = await request<{ mediaItems: unknown[] }>(bus, {
        action: 'mix/LOAD_TRACK_LIST_FOR_MIX_ID', payload: { mixId: mix.mixId, reset: true, failSilently: true },
        success: 'mix/LOAD_ALL_MIX_MEDIA_ITEMS_SUCCESS',
        matches: payload => id(record(payload).mixId) === id(mix.mixId), signal,
      });
      if (!Array.isArray(response.mediaItems)) throw new Error('Unexpected track radio response format');
      const allowExplicit = redux.store.getState().settings.explicitContentEnabled;
      const tracks = response.mediaItems.map(value => {
        // The live client returns { item: Track, type: 'track' }. Older/flat
        // responses are also accepted; wrapper type must not permit a video.
        const wrapper = record(value);
        const track = wrapper.item !== undefined ? record(wrapper.item) : wrapper;
        const type = wrapper.type ?? track.contentType;
        return {
          id: id(track.id),
          ...(typeof track.title === 'string' ? { title: track.title } : {}),
          playable: Boolean(id(track.id)) && type === 'track' && track.contentType !== 'video' &&
            track.allowStreaming === true && track.streamReady === true &&
            (allowExplicit || track.explicit !== true),
        } satisfies Track;
      });
      diagnose(`Radio: ${tracks.length} tracks, ${tracks.filter(track => track.playable).length} playable. Current collection, queue, and last 50 played tracks are also excluded.`);
      return tracks;
    },
    async collectionIds(source, signal) {
      signal.throwIfAborted();
      const [, countryCode, kind, collectionId] = JSON.parse(source) as [number, string, string, string];
      // The client keeps the complete favorite-ID list independently of paged UI rows.
      // Read it fresh, so adding/removing a favorite invalidates exclusions immediately.
      if (kind === 'favorites') {
        const favorites = redux.store.getState().favorites?.tracks;
        if (!Array.isArray(favorites) || favorites.length === 0) throw new Error('Waiting for the favorites list to load');
        return favorites.map(id);
      }
      if (kind !== 'playlist' && kind !== 'album') throw new Error('Unsupported music collection');
      if (collectionCache?.source === source && collectionCache.expires > Date.now()) return collectionCache.ids;
      const headers = await TidalApi.getAuthHeaders();
      const ids: string[] = [];
      // Fetch every page: queue.originalSource may contain only the first loaded page.
      for (let offset = 0; ; ) {
        const query = new URLSearchParams({ countryCode, deviceType: 'DESKTOP', limit: '100', offset: String(offset) });
        const timeout = AbortSignal.timeout(10000);
        const response = await fetch(`https://desktop.tidal.com/v1/${kind === 'album' ? 'albums' : 'playlists'}/${encodeURIComponent(collectionId)}/items?${query}`, {
          headers, signal: AbortSignal.any([signal, timeout]),
        });
        if (!response.ok) throw new Error(`Could not read the complete music collection (${response.status})`);
        const page = record(await response.json());
        if (!Array.isArray(page.items) || !Number.isInteger(page.totalNumberOfItems))
          throw new Error('Unexpected music collection response format');
        for (const value of page.items) {
          const wrapper = record(value);
          const trackId = id(record(wrapper.item).id ?? wrapper.id);
          if (trackId) ids.push(trackId);
        }
        offset += page.items.length;
        if (offset >= Number(page.totalNumberOfItems)) break;
        if (!page.items.length) throw new Error('Incomplete music collection; recommendation skipped');
      }
      signal.throwIfAborted();
      collectionCache = { source, ids, expires: Date.now() + 60000 };
      return ids;
    },
    insert(trackId) {
      const before = new Set(redux.store.getState().playQueue.elements.map(item => item.uid));
      PlayState.playNext(trackId);
      const added = redux.store.getState().playQueue.elements.filter(item => !before.has(item.uid) && id(item.mediaItemId) === trackId);
      if (added.length !== 1) throw new Error('Could not uniquely identify the inserted queue entry');
      return added[0].uid;
    },
    remove(uid) { bus.dispatch('playQueue/REMOVE_ELEMENT', { uid }); },
  };
}
