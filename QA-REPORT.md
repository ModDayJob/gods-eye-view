# Functional walkthrough — September 8, 2026

The main workflows were exercised locally using real public feeds, an isolated browser walkthrough, direct inspection of the existing in-app browser, and the existing automated suites. This is not a certification of every camera, provider, device, or combination of settings. Changes remain local; nothing was pushed to GitHub.

## Repairs made during this review

- Compact side panels now reserve enough space for map attribution across the modeled viewport heights.
- A background aircraft refresh triggered when the military layer turns off now handles expected cancellation. Clearing layers had produced an uncaught `AbortError` in the combined test.
- Failed road-network requests now appear as an error in traffic status, instead of retaining a misleading LIVE/zero-coverage presentation. Successful road rendering clears the error.
- Updated attribution and Radio test expectations for the compact layout. Updated Radio setup to use Explore map before exercising controls.
- Local QA evidence and downloaded test exports are excluded from Git publication.

## Automated results

| Check | Result |
| --- | --- |
| Full unit suite | 2,728 passed, 1 skipped, 0 failed; separate allocation check passed |
| Focused checks after the aircraft/traffic repairs | 77 passed |
| Aircraft tracking browser regression | 108 passed, 0 failed; uses synthetic fixtures |
| Map-source browser regression | Passed, including responsive trays and unavailable-provider fallbacks |
| Radio browser regression | 105 of 106 passed on the final run; see remaining issues |
| Deliberate road-provider failure | Passed: browser status exposed the failure |
| Deliberate aircraft-refresh cancellation | Passed: no uncaught rejection |
| Final production build | Passed; large-bundle advisory remains |

The full suite preceded the final two small runtime repairs. Their focused tests and browser failure/cancellation checks ran afterward. Fixtures used in isolated test browsers were never substituted into the user's app.

## Workflow coverage

| Feature | Evidence and limits |
| --- | --- |
| Opening location | Boston saved, then verified after opening the base address. Austin restored as default. Explicit map links retain their view. |
| Rendering preferences | Light, Detailed and Balanced applied the expected 20/60/30 fps caps. These are settings, not a performance guarantee. |
| Controls | Data Layers, Scenes, Display, CCTV, Context and Visual Presets opened/closed. Scope toggled both ways. Scene playback started/stopped; a complete cinematic export/import round trip was not exercised. |
| Map imagery | Free Esri and OSM switching verified. Google/Bing availability and fallback controls verified; unavailable keyed imagery was not claimed to work. |
| Civil/military flights | Real source responses loaded; one sample contained 471 civil contacts through the regional adsb.lol fallback and 157 military contacts. Tracking, switching, ground models, stale removal and share restoration covered by the 108-check fixture suite. |
| Satellites / space missions | Satellite catalogue and 25 launch records loaded. Satellite positions are propagated from orbital elements. Space Missions uses a dedicated layer mode and intentionally replaces incompatible Earth layers. |
| Earthquakes | 40 reports loaded in one USGS sample. |
| Ships | AISStream reported a live transport and 12,000 accepted rows at the configured cap. This is not complete worldwide coverage. |
| Cameras | 900 catalogue entries across 24 city/area groups. One Austin snapshot loaded; one California HLS stream reached playing state and advanced through approximately seven seconds. Individual health of all 900 cameras was not checked. |
| Radio | Real catalogue returned 750 stations. Interaction regression uses fixtures and mocked media playback; actual listening across station streams was not verified. |
| Bikeshare | 86 stations loaded around Austin. |
| Infrastructure | Datacenters, dams and submarine cables loaded, with sample counts of 4,362, 716 and 2,629. These are reference datasets, not live observations. |
| Fire reports | NASA FIRMS returned 159,740 records in one sample. Large counts do not establish acceptable combined-layer rendering performance. |
| City Pulse | Boston returned 200 vehicle reports. City selection, favorite saving and place search worked. Transit outside Boston remains unsupported by this connection. |
| Weather / radar | Conditions and forecasts loaded for 18 world cities; Portland local weather loaded separately. Celsius/Fahrenheit switching worked. Radar supplied 13 recent frames; frame selection, opacity and off controls worked. Weather is model-based; radar coverage varies. |
| Storm Watch | 300 GDACS hazard reports loaded. These are published report locations, not precise affected-area boundaries. |
| Briefing Room | Overview, Reports, Briefing, Ask, History, Map layers, Saved and Notes exercised. Country selection, story saving, cited headline search, snapshot capture/replay and return to live worked. |
| Town news | Portland, Maine geocoded and returned four headlines. Place-query matches may include syndicated or tangential stories; results are not a verified local incident list. |
| Notes / downloads | Notes retained across tab changes. Notes and briefing files downloaded in the isolated browser. |
| Source health / credits | Health dialog and refresh action opened; creator attribution verified. |

## Remaining issues and unverified areas

1. **Mapped installations:** a nearby Overpass search reported a provider timeout. Enabling it during the combined Earth-layer test exceeded the 40-second test limit. This remains unresolved.
2. **Heavy combined-layer behavior:** the combined test did not pass. Later Display/CCTV/Context selector checks timed out, although their ordinary standalone/manual checks passed. No all-layer stability or performance claim is justified.
3. **Street traffic:** only activates below 8 km. Empty results from the 18 km combined test are not proof of a provider failure. A closer live check was still loading when sampled; end-to-end live road-flow success was not established. The deliberately failed-provider test did verify the repaired error presentation. Traffic animation is not individual-car GPS tracking.
4. **Cockpit control timing:** the final Radio suite's cockpit datacenter-toggle check observed no state change after its short layout wait. It passed in the preceding run. Treat this as an unresolved asynchronous/test-timing concern, not a confirmed permanent failure or a clean pass.
5. **Not exercised:** paid voice/AI calls, microphone conversation, private cameras, every public camera/radio stream, full scene import/export, every annotation/editing combination, and a prolonged production soak test. No paid service was activated.

Raw evidence is stored locally under `qa-results/walkthrough/`; existing browser suites also wrote screenshots under `qa-shots/`. Earlier failed harness attempts remain in the evidence: corrected camera selectors, correct city-weather navigation, and entering map mode were verified in follow-up checks. Do not interpret raw harness step labels alone as proof of provider health.
