/** Narrow compatibility contracts transcribed from TidaLuna master 19b8337.
 * These enable an offline build, NOT verification against a running client.
 * Keep runtime integration behind adapter.ts. */
declare module '@luna/core' {
  export type LunaUnload = () => unknown;
}
declare module '@luna/lib' {
  export interface QueueElement {
    uid: string; mediaItemId: string | number;
    context: { type: string; id?: string | number | null };
  }
  export interface TidalState {
    session: { userId: number; countryCode: string };
    activePlayer: { activePlayer: string };
    remotePlayback: { isConnected: boolean };
    settings: { explicitContentEnabled: boolean };
    favorites: { tracks: (string | number)[] };
    playQueue: {
      sourceEntityType: string; sourceEntityId: string;
      currentIndex: number; elements: QueueElement[]; originalSource: QueueElement[];
      repeatMode: number;
    };
    playbackControls: {
      playbackState: string;
      mediaProduct: { productType: string };
      playbackContext?: { actualProductId: string; playbackSessionId: string };
    };
  }
  export const redux: {
    store: { getState(): TidalState; subscribe(listener: () => void): () => void };
    actions: Record<string, (payload?: unknown) => unknown>;
    intercept(type: string, unloads: Set<() => unknown> | null, listener: (payload: unknown) => unknown): () => void;
  };
  export const PlayState: { playNext(id: string | number): void };
  export const TidalApi: { getAuthHeaders(): Promise<Record<string, string>> };
}
