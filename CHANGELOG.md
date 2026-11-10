# 0.3.0

- Use one global Smart Shuffle switch for all local music sources, including albums, search, and radio.
- Remove album opt-in and retain existing global switch/interval preferences.
- For sources without collection endpoints, exclude loaded source tracks, queued tracks, and recent history.
- Show the global enabled state consistently on the player star.

# Changelog

## 0.2.1

- Fix favorites detection for the live client source `my_items` with original context `MY_TRACKS`.
- Keep the favorites source stable while an inserted recommendation has context `UNKNOWN`; do not enable videos or other `my_items` contexts.
- Add regression coverage for the exact client source and complete favorites exclusion.
- Verify three regular favorites, recommendation insertion/playback, and return to the favorites queue with progress at 1/3 in Tidal Desktop 2.47.0.

## 0.2.0

- Support favorites under My Collection → Tracks, including full favorite-ID exclusion without a playlist ID.
- Add a saved Apply to albums option, off by default, with complete album membership filtering.
- Gray out the star when the current playback source is ineligible, even while the global switch is on.
- Translate the interface, statuses, tooltips, diagnostics, and documentation into English.
- Add source-aware collection identity and coverage for favorites, album opt-in, and preference migration.
- Prepare a public GitHub install URL and store manifest.

## 0.1.2

- Move the small star button immediately left of native Shuffle.
- Keep the quality badge clear and native playback controls centered.

## 0.1.1

- Handle the wrapped radio result format observed in the live client.
- Show counting, loading, recommendation, and pause status.
- Verify insertion, recommendation playback, and return to a playlist in the desktop client.

## 0.1.0

- Initial playlist-only implementation and simulated tests.
