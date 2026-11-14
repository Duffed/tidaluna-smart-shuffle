# Validation

## Automated coverage

46 tests pass, along with TypeScript checking and the plugin build. Tests use simulated state and response data; no live account credentials are used in automated tests.

Validation commands: `node node_modules/typescript/bin/tsc --noEmit`, `node scripts/test.mjs`, and `node scripts/build.mjs`. These execute the package-script tools directly because the host's pnpm shim attempted an unnecessary network install. esbuild required execution outside the filesystem sandbox to resolve ancestor directories.

- Distributed and rotating queue seeds, short/empty queues, duplicate seeds, owned entries, and current-track mode.
- Reciprocal rank fusion, per-radio duplicate suppression, deterministic tie-breaking, at most two concurrent radios, and partial failures.
- Manual insertion with automation disabled and playback paused, repeated-click protection, and manual ownership preservation when automation is disabled.
- Manual success resets progress; manual failure preserves it. Complete collection lookup failure prevents insertion.
- Injected-clock checks for the 30-second threshold, pause/resume, rapid skipping, duplicate/seek updates, and temporary incoherent playback snapshots.
- Queue mutations and explicit-setting changes invalidate requests; collection exclusions are refreshed immediately before insertion.
- Already-played recommendations retained in queue history do not block future suggestions or get removed during cleanup.
- New preference persistence/migration and separation of status notifications from engine configuration.

- Interval counting, skips, duplicate events, pause/resume, and exclusion of plugin recommendations from the counter.
- Cancellation after track/source changes, deactivation, and unload, including late results from transports that ignore abort.
- Filtering against full collection membership, queue entries, streaming/explicit flags, and recent history.
- At most one pending recommendation; queue ownership checks include source, UID, and track ID.
- Track/mix response correlation, synchronous cached responses, abort, timeout, and listener cleanup.
- Live-observed wrapped radio results (`{ item, type }`) and flat result compatibility.
- Full playlist and album pagination; fail closed on incomplete or inaccessible membership.
- Favorites source recognition without a playlist ID, complete favorite-ID filtering, and immediate membership updates.
- A single global switch preserves enabled/interval preferences and ignores legacy album opt-in. Albums and generic sources are eligible while remote/video/Repeat One restrictions remain.
- Source identity separates playlists, favorites, albums, and accounts.
- Exact live favorites source `my_items` with original context `MY_TRACKS`; other contexts can also play music; eligibility follows the current media product.

## Live check in 0.4.0 — November 13, 2026

Tidal Desktop 2.48.0, existing TidaLuna installation, local 0.4.0 build served from `http://127.0.0.1:3000/local.smart-shuffle`, My Mix 1 playback:

1. Installed the development build in place of the existing public 0.3.0 instance. The original enabled state and interval 3 were retained; the new source defaulted to Queue.
2. Confirmed English settings, source/counting selectors, Suggest now, and the adjacent player + / star controls.
3. With automation disabled and playback paused, Suggest now inserted one recommendation next. Playback stayed paused and both manual controls became unavailable while a suggestion was waiting.
4. Next played the inserted recommendation, which was identified as a recommendation with progress still 0/3.
5. Selected After 30 seconds of playback and enabled automation. Seeking near the recommendation's end and letting it end naturally returned to the original mix queue. The recommendation did not count.
6. The following regular track showed 0/3 at 16 seconds and 1/3 at 44 seconds, confirming delayed counting rather than counting at track start.
7. Paused playback and restored On playback start, enabled automation, interval 3, and Queue mode.
8. Reloaded the final build and verified that the player + button still inserted exactly one suggestion while paused. Reloading again removed the pending test suggestion and left the original upcoming queue intact; one + and one star remained visible.

The local development build remains installed; the public GitHub distribution was not changed. The loopback development server is needed to fetch rebuilt files on reload. Existing TidaLuna caching can retain the installed code, but this is not a published release. The settings panel was collapsed during the reload check; a separate lyrics plugin overlapped its header at the bottom of the window. Maximized and restored large-window controls were inspected, but narrower/mini-player layouts were not verified.

These checks establish the basic workflow, not subjective recommendation quality. Listening comparisons between homogeneous and mixed queues remain a human acceptance check.

## Previously checked in the desktop client (earlier versions)

Tidal Desktop 2.47.0, playlist playback, normal shuffle enabled, interval 3, transitions triggered with Next:

1. Counter advanced through three regular tracks.
2. A radio recommendation was inserted next without replacing the playlist.
3. The inserted track was played and did not advance the regular-track counter.
4. Playback returned to the original playlist with progress at 1/3.
5. A small teal star appeared immediately left of Shuffle; the quality badge stayed separate.

## Favorites live check in 0.2.1

On November 8, 2026, the failure in 0.2.0 was reproduced: the client reported source `my_items` and original context `MY_TRACKS`, which the old classifier did not recognize. After the targeted fix, the favorites flow was checked in Tidal Desktop 2.47.0, with interval 3 and manual Next transitions:

1. The first and second regular favorite tracks advanced progress to 1/3 and 2/3.
2. The third regular track triggered radio loading and one recommendation was inserted.
3. Next played the recommendation; the engine recognized its owned queue entry without counting it as a regular track.
4. Next resumed the original favorites queue and restarted progress at 1/3.
5. Playback was paused again after the test. Existing preferences were preserved.

## Live checks still required

- Albums, search, radio, artist, and individual-track playback: enable the star, verify insertion and return to the original queue. Turn off with a recommendation pending and verify only the owned entry is removed.
- Switch between album, favorites, and playlist while a radio request is in flight; no insertion into the new context.
- Multiple complete automatic cycles without manually skipping (one recommendation-to-regular natural transition was checked in 0.4.0 after seeking near the end).
- Remote playback, Repeat One/All, long collections, network failures, restart/persistence, and full-screen/compact player layouts.
- Two manually queued copies of the same track remain intact when a plugin entry is removed.
- Repeated reload stress testing and direct listener-count inspection (basic reload cleanup and single visible controls were checked).

Album behavior remains unverified in a live client. The earlier favorites checks used manual Next transitions; the 0.4.0 live check used a mix source. Full compact/mini-player layout coverage and subjective comparison listening are still outstanding.
