# Smart Shuffle for TidaLuna

Discover similar music while listening to your own collection.

**3 regular tracks → 1 radio recommendation → back to your collection.**

Supports playlists and favorite tracks under **My Collection → Tracks**. Albums are supported through the optional **Apply to albums** setting, which is off by default. Your saved playlists, favorites, and albums are never edited.

## Install

You need the [Tidal desktop app](https://tidal.com/download) and [TidaLuna](https://github.com/Inrixia/TidaLuna).

1. Open **Luna Settings → Plugin Store → Install from URL**.
2. Paste this plugin URL:

   ```text
   https://raw.githubusercontent.com/Duffed/tidaluna-smart-shuffle/main/dist/local.smart-shuffle
   ```

3. Enable the plugin, open its settings, and check **Enable Smart Shuffle**.
4. Start a playlist or your favorite tracks. Optionally enable **Apply to albums**.

You can alternatively add the store:

```text
https://raw.githubusercontent.com/Duffed/tidaluna-smart-shuffle/main/dist/store.json
```

The public URLs serve the committed build from this repository. Other users do not need Node.js, pnpm, or a local server. TidaLuna appends `.json` and `.mjs` to the plugin URL; keep both files available together. The plugin ID remains `@local/smart-shuffle` for compatibility with the initial builds.

## Controls

- A small **star button left of Shuffle** toggles the global switch.
- **Teal:** Smart Shuffle is enabled and available for this source.
- **Gray:** globally off, or unavailable here, including an album while **Apply to albums** is off. The global switch stays enabled while a source is temporarily ineligible.
- Hover over the star to see progress, the pending recommendation, or the reason it is unavailable.
- The interval is adjustable from 1 to 20 tracks; the default is 3.
- **Apply to albums** is a separate saved preference, off by default.

## Behavior

Every started regular track counts, including skipped tracks. Pause/resume, seeking, and duplicate playback updates do not count again. Plugin recommendations do not count toward the next interval. Enabling the feature during a track counts that track as the first one.

When the interval is reached, the plugin loads radio recommendations for the current regular track and queues the first suitable result to play next. It excludes the current collection, queued tracks, the seed track, and the last 50 tracks heard while Smart Shuffle was active. Playlist and album membership are read in full and cached for one minute. Favorites use Tidal's complete in-memory favorite-ID list and reflect changes immediately.

Unavailable tracks, videos, and explicit tracks when explicit content is disabled are excluded. Recommendations use Tidal's radio ordering; there is no separate similarity service or extra API key.

Only one plugin recommendation can wait in the queue. Turning Smart Shuffle off removes a waiting recommendation if its queue ID, track ID, and source still match. A recommendation already playing is allowed to finish. Manually queued entries are preserved.

Changing collection or account resets progress. Remote playback and Repeat One temporarily suspend Smart Shuffle. Normal Tidal shuffle remains available. Turning **Apply to albums** off during album playback suspends insertion and removes a still-pending plugin recommendation. Radio, search results, videos, and other unsupported sources stay ineligible.

If radio or collection loading fails, the current queue keeps playing. That recommendation slot is skipped, and another attempt is made after the next full interval. Late responses are ignored after a track/source change or deactivation.

## Updating

Use **Reload plugin** in Luna Settings to fetch an updated build. The repository includes matching code, metadata, and source maps. If an already-open settings panel still shows an old component after hot reload, hide/show the settings or restart Tidal. The player tooltip reports the active engine's state.

If you installed an initial development build from `http://127.0.0.1:3000`, that URL still points to your local server. Use the public URL above for a server-independent installation and keep only one enabled instance of the plugin.

## Development

Requires Node.js 22+ and pnpm 11.25.0.

```sh
git clone https://github.com/Duffed/tidaluna-smart-shuffle.git
cd tidaluna-smart-shuffle
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm serve
```

Local plugin URL: `http://127.0.0.1:3000/local.smart-shuffle`.

The server binds only to `127.0.0.1:3000` and serves the four build files, with CORS enabled. Stop it with Ctrl+C. Running the included build only requires Node.js: `node scripts/serve.mjs`.

Rebuild with `pnpm build` after source changes, then reload the plugin. There is no automatic watch process. Commit the regenerated `dist/` files when publishing an update, since the public install URL reads them directly.

## Compatibility and testing

The playlist flow has been tested in Tidal Desktop 2.47.0 using manual Next transitions: radio loading, insertion, recommendation playback, and return to the original playlist. The star placement was also checked in the client.

Version 0.2.0 adds favorites, album opt-in, context-sensitive icon color, and an English interface. These additions have automated simulated coverage; their live client check is pending. Natural track-end transitions, remote devices, Repeat modes, and full-screen/compact layouts need broader testing. See [VALIDATION.md](VALIDATION.md).

`types/luna.d.ts` contains narrow compatibility contracts based on TidaLuna commit `19b83373cacd55caddaa656e2481283d4ce06fd1`. Type checking uses these local contracts, not an installed full SDK. Internal Tidal APIs and UI selectors can change.

The core engine is in `plugins/SmartShuffle/src/engine.ts`; TidaLuna access is isolated in `adapter.ts`. Radio is loaded with `mix/LOAD_TRACK_MIX_ID` and `mix/LOAD_TRACK_LIST_FOR_MIX_ID`, without `mix/PLAY_MIX`. Temporary insertion uses `PlayState.playNext`, and removal uses the owned entry's UID.

## Troubleshooting

First check **Enable Smart Shuffle**, the current source, and the star tooltip. For albums, also check **Apply to albums**. The settings panel contains diagnostics for the latest radio request. If the favorites list has not loaded yet, recommendations are skipped until it becomes available.

Console messages start with `[SmartShuffle]`. When reporting a problem, include plugin/Tidal/TidaLuna versions, playback source, interval, whether albums are enabled, and the relevant status. Do not include credentials or full account dumps.

## License and credits

[Microsoft Public License (MS-PL)](LICENSE). See [NOTICE.md](NOTICE.md) for upstream attribution. Built for [TidaLuna](https://github.com/Inrixia/TidaLuna), following its plugin build and lifecycle conventions. This is an independent plugin and is not affiliated with Tidal.
