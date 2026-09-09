# Community 0.2.0 release verification

Release target: a downloadable application running on the user's own computer, on localhost. Desktop Chrome on macOS is the directly verified configuration. Windows/Linux startup jobs are included in GitHub Actions but have not been executed for this unpublished revision. Public multi-user hosting is not supported by this release.

## Completed checks

- Clean dependency installation from the source archive, with no .env, provider keys, installed dependencies or cached feeds carried across.
- Dependency security audit: zero known advisories at verification time.
- Unit regression: 2,740 passed, one intentionally skipped, zero failures. Allocation regression results accompany the release handoff.
- Final Radio browser regression: 106/106 passed, including cockpit/panel transitions, compact layout, and playback controls. These regression audio fixtures do not certify every real broadcaster.
- Nearby-radio tests cover distance ordering, empty areas, worldwide restoration and category word boundaries. A live directory check found two stations near Austin and none near Boston, retained the chosen area when the camera moved, and restored all 750 worldwide stations without autoplay.
- Packaging regression verifies that a copied credential aborts packaging without printing the credential; .env and compiled bundles are excluded, and .env.example and package-lock.json are included.
- Free-only startup retains Cesium ion terrain access without requesting Google photorealistic assets.
- Keyless first-run browser layout at 390, 780, 1268, 1440 and 1920 pixels. Title/navigation and panel/dock separation verified.
- Broad keyless walkthrough exercised briefing, opening-city persistence, layers, cameras, weather, radar, units, source health and responsive layouts. No uncaught browser errors. Its first panel loop attempted a hidden control; a neutral-layout follow-up passed all six panel expand/collapse checks, and the final Radio regression covers panel transitions.
- Previously completed 14-layer, two-minute endurance run and bounded timeout/recovery checks are described in STABILITY-REPORT.md.
- Actual personal scanner listening verified through the broadcaster's SF Fire/EMS/Police player: media ready state 4, unpaused, audio time advancing for over a minute, no media error. Two directory stream attempts inside the app failed; the Station Site option remains the fallback. Transmission silence and broadcaster outages are expected possibilities.

## Distribution

`npm run release:package` produces the source archive plus a SHA-256 checksum under output/. An internal RELEASE-MANIFEST.json identifies every packaged source file. Personal tokens and compiled assets are not distributed; recipients install locked dependencies and use their own optional accounts. This local preparation has not published a GitHub tag or merged an upstream pull request.

## Product limits

Free-source delays, rate limits, limited geographic coverage and offline cameras remain visible product constraints. “General release” describes the supported local application, not guaranteed uptime of third-party feeds, verified intelligence, an emergency dispatch system, or certification of every browser/device. Build size warnings remain; use a hardware-accelerated desktop browser.

ElevenLabs was evaluated but not integrated or called. It can synthesize narration, not provide live scanner traffic. It would add credentials, usage credits and provider-specific licensing to spoken briefings, so it is not required for this release.

## Camera location follow-up

The camera browser now opens on the nearest camera within 75 km of the map center, rather than the first alphabetical city. Live browser checks selected London and Austin correctly and showed an explicit coverage gap for Boston. Two focused regression tests and the production build passed.

## EarthCam directory addition

Added a separate EarthCam section alongside existing camera playback. Five
curated official viewing links support search, nearest-first ordering, optional
map markers, and map focus. Browser verification passed card search, London
ordering, five map pins, clear-all, external-link attributes, and mobile width.
No EarthCam media is embedded and browsing the directory sent zero EarthCam
requests. Four focused directory/camera tests and the production build passed.

## Publication checks — September 9, 2026

Final unit regression: 2,740 passed, one skipped, zero failures; isolated allocation groups: 1 and 13 passed. Production build passed. Source packaging excludes macOS metadata as well as private configuration and HAR captures.
