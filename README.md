# Smart Shuffle for TidaLuna

Discover similar music while listening to your own collection.

**3 regular tracks → 1 radio recommendation → back to your collection.**

Supports all local music sources, including playlists, favorites, albums, search, and radio. Your saved playlists, favorites, and albums are never edited. All plugin controls and messages are in English.

## Install

You need the [Tidal desktop app](https://tidal.com/download) and [TidaLuna](https://github.com/Inrixia/TidaLuna).

1. Open **Luna Settings → Plugin Store → Install from URL**.
2. Paste this plugin URL:

   ```text
   https://raw.githubusercontent.com/Duffed/tidaluna-smart-shuffle/main/dist/local.smart-shuffle
   ```

3. Enable the plugin, open its settings, and check **Enable automatic recommendations**, or use **Suggest now** for one recommendation.
4. Start music from any source and toggle the star in the player.

You can alternatively add the store:

```text
https://raw.githubusercontent.com/Duffed/tidaluna-smart-shuffle/main/dist/store.json
```

The public URLs serve the committed build from this repository. Other users do not need Node.js, pnpm, or a local server. TidaLuna appends `.json` and `.mjs` to the plugin URL; keep both files available together. The plugin ID remains `@local/smart-shuffle` for compatibility with the initial builds.

## Controls

- The **star button left of Shuffle** toggles automatic recommendations. Teal means enabled; gray means off.
- The adjacent **+ button (Suggest now)** adds one recommendation to play next. It also works with automation off and while paused, without starting playback. The same button is available in settings.
- Suggest now is disabled while loading, while a plugin recommendation is waiting, or when playback is ineligible. It never replaces a pending suggestion.
- **Recommendation source:** Queue (default) or Current track.
- **Recommend after every … regular tracks:** 1–20, default 3.
- **Count tracks:** On playback start (default) or After 30 seconds of playback.
- Hover over the star for progress, selection source, counting mode, and status.
- Existing enabled/interval preferences are retained. New options default to Queue and On playback start. The legacy album preference is ignored; there is no separate album setting.

## Behavior

On playback start counts every started regular track, including skips. After 30 seconds of playback accumulates actual playing time per playback session; pauses and seeking add no time. A track skipped before 30 seconds does not count, including a track shorter than 30 seconds. Enabling or changing counting settings starts fresh for the current track. Pause/resume and duplicate updates never count a playback twice. Plugin recommendations do not count. The automatic counter waits while a recommendation is pending.

Queue mode selects the current regular track plus up to four distinct tracks spread across the loaded remaining queue. Each subsequent attempt rotates the selection within those queue regions. When a plugin recommendation is playing, up to five upcoming regular tracks are used instead. Previously played entries and plugin-owned recommendations do not become seeds; manually queued tracks do. Short queues use every distinct available track, and a lone current track works on its own. Current track mode uses only the current regular track.

At most two track radios load concurrently. Results are merged by track ID and scored by the sum of `1 / (60 + rank)` across radios (rank starts at 1). Shared results and high radio positions are preferred; ties use best individual rank, then track ID. A failed radio does not discard other successful results. No extra API key or similarity service is needed. This is a ranking heuristic, not an audio-analysis model.

The highest-ranked suitable result is queued next. The active collection, queue, seed tracks, and last 50 tracks heard during eligible playback with the plugin loaded are excluded. Playlist and album membership are read in full and cached for one minute. Favorites use Tidal's complete in-memory favorite-ID list, rechecked before insertion. Other sources without collection endpoints use the loaded original source, live queue, and recent history; unloaded tracks from those sources may still be recommended.

Unavailable tracks, videos, and explicit tracks when explicit content is disabled are excluded. Changes to the explicit-content setting invalidate an in-flight request.

Only one request can run and one plugin recommendation can wait in the queue. Disabling automatic recommendations removes a waiting automatic suggestion only when its UID, track ID, and source still match. Suggestions requested with Suggest now remain queued. A recommendation already playing is allowed to finish; unrelated manually queued entries are preserved. Successful manual suggestions restart the automatic interval; failed manual requests preserve progress. Unloading the plugin removes its still-pending suggestions.

Changing collection or account resets progress. Remote playback and Repeat One temporarily suspend Smart Shuffle. Normal Tidal shuffle remains available. Albums, radio, search results, and other music sources require no additional opt-in. Videos remain ineligible.

If all radios fail, collection loading fails, or no eligible candidate exists, the queue keeps playing. Automatic attempts retry after the next full interval; Suggest now can be retried manually. Late responses are ignored after changes to the track, source, account, queue, relevant preferences, or availability. An empty or incoherent playback context disables Suggest now until a regular seed is available.

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

Playlist and favorites flows have been tested in Tidal Desktop 2.47.0 using manual Next transitions: radio loading, insertion, recommendation playback, and return to the original collection with the counter restarting at 1/3. The star placement was also checked in the client.

Version 0.4.0 adds queue-based ranking, manual suggestions, and playback-time counting. Automated tests use simulated Tidal state; see [VALIDATION.md](VALIDATION.md) for current results and live verification limits. Historical checks on earlier versions do not establish live compatibility of 0.4.0.

`types/luna.d.ts` contains narrow compatibility contracts based on TidaLuna commit `19b83373cacd55caddaa656e2481283d4ce06fd1`. Type checking uses these local contracts, not an installed full SDK. Internal Tidal APIs and UI selectors can change.

The core engine is in `plugins/SmartShuffle/src/engine.ts`; TidaLuna access is isolated in `adapter.ts`. Radio is loaded with `mix/LOAD_TRACK_MIX_ID` and `mix/LOAD_TRACK_LIST_FOR_MIX_ID`, without `mix/PLAY_MIX`. Temporary insertion uses `PlayState.playNext`, and removal uses the owned entry's UID.

## Troubleshooting

First check **Enable automatic recommendations**, the current source, and the star tooltip. For manual use, check the reason shown beside Suggest now. The settings panel contains diagnostics for the latest individual radio request. If the favorites list has not loaded yet, recommendations are skipped until it becomes available.

Console messages start with `[SmartShuffle]`. When reporting a problem, include plugin/Tidal/TidaLuna versions, playback source, interval, and the relevant status. Do not include credentials or full account dumps.

## License and credits

[Microsoft Public License (MS-PL)](LICENSE). See [NOTICE.md](NOTICE.md) for upstream attribution. Built for [TidaLuna](https://github.com/Inrixia/TidaLuna), following its plugin build and lifecycle conventions. This is an independent plugin and is not affiliated with Tidal.
