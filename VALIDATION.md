# Validation

## Automated coverage

30 tests pass, along with TypeScript checking and the plugin build. Tests use simulated state and response data; no live account credentials are used.

- Interval counting, skips, duplicate events, pause/resume, and exclusion of plugin recommendations from the counter.
- Cancellation after track/source changes, deactivation, and unload, including late results from transports that ignore abort.
- Filtering against full collection membership, queue entries, streaming/explicit flags, and recent history.
- At most one pending recommendation; queue ownership checks include source, UID, and track ID.
- Track/mix response correlation, synchronous cached responses, abort, timeout, and listener cleanup.
- Live-observed wrapped radio results (`{ item, type }`) and flat result compatibility.
- Full playlist and album pagination; fail closed on incomplete or inaccessible membership.
- Favorites source recognition without a playlist ID, complete favorite-ID filtering, and immediate membership updates.
- Album opt-in defaults off, persists independently, and changes eligibility while preserving remote/video/Repeat One restrictions.
- Source identity separates playlists, favorites, albums, and accounts.

## Previously checked in the desktop client

Tidal Desktop 2.47.0, playlist playback, normal shuffle enabled, interval 3, transitions triggered with Next:

1. Counter advanced through three regular tracks.
2. A radio recommendation was inserted next without replacing the playlist.
3. The inserted track was played and did not advance the regular-track counter.
4. Playback returned to the original playlist with progress at 1/3.
5. A small teal star appeared immediately left of Shuffle; the quality badge stayed separate.

## Live checks still required for 0.2.0

- Favorites: three regular tracks, one recommendation absent from favorites, then return to the favorites queue.
- Album option off: no insertion, gray star, clear unavailable reason, global switch still enabled.
- Album option on: teal star, radio recommendation, then return to the album. Disable the option with a recommendation pending and verify only that owned pending entry is removed.
- Switch between album, favorites, and playlist while a radio request is in flight; no insertion into the new context.
- Natural song-end transitions and multiple complete cycles without manually skipping.
- Remote playback, Repeat One/All, long collections, network failures, restart/persistence, and full-screen/compact player layouts.
- Two manually queued copies of the same track remain intact when a plugin entry is removed.
- Re-rendering/reloading leaves exactly one star and one set of listeners.

The latest computer-use session was stopped before live validation of the new favorites/album features. No live success is claimed for those additions.
