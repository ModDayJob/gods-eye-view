# Phase 2 — upstream integration and Situation Desk

## Creator shout-outs
God's Eye View was created by Bilawal Sidhu and is maintained with Sameh Khamis
at Halfpixel. This community edition exists because of their open-source work.
The original license, data attribution and author metadata remain intact.
ModDayJob's additions were developed with AI assistance.

## Upstream integration
Integrated upstream v0.1.1 through 759652207fd1279ece97f0f19af566feb9a82146.
Retains the newer keyless Esri/terrain startup, ion map-loading path, first-run
experience, provider settings, setup doctor, Pinokio files, Overpass recovery
and other fixes. Keeps Phase 1 camera, weather, favorites and health features.
npm start continues to block metered Google/OpenAI services and bind localhost.

## Situation Desk
Open Situation at the top of the globe.
- Up to 60 source-linked headlines, refreshing every five minutes while open.
- Eight regional selections; conflict/diplomacy, humanitarian, disaster and general topics.
- Six-, 24- and 48-hour windows; headline text filtering and duplicate-title removal.
- Saved region watchlist and up to 100 saved stories, stored in this browser.
- Deterministic briefing from the loaded sample, publisher counts, keywords and export.
- Private scenario notes and text export; notes are hypotheses, not predictions.
- Worldwide country-mention markers. Country centers are context, not event locations.
- Explicit stale/error states; bounded requests, cache and coalescing.
- Prominent original-creator credit in the app and README.

## Conflictly comparison
Public and signed-in dashboards were inspected. Conflictly inspired the feed,
filtering and briefing workflow; no proprietary code, branding, assets or paid
feed content were copied. No affiliation is implied. Its paid daily briefings
were not accessed. Our briefings summarize openly retrieved headline metadata.
This edition does not reproduce community voting, a proprietary tension index,
prediction probabilities, market feeds, mobile push or paid historical archives.
Those need separate data, methodology or service work; no synthetic scores are
presented as measured facts.

## Data interpretation
Google News RSS supplies publisher headlines/links fetched at runtime. Articles
remain on publisher sites and retain their own terms. A report is not independent
verification. Keyword frequency and publisher counts are descriptive statistics,
not confidence, escalation or incident counts. Regional search and country-name
matching are incomplete. Existing provider terms and coverage limits still apply.

## Validation and preview status
- Clean dependency installation and production build passed.
- Automated suites: 2,721 checks (one skipped), allocation check and 13 focused checks; zero failures.
- Dependency audit reported zero known vulnerabilities at verification time.
- Live news endpoint returned 60 headlines; browser feed, saved stories and briefing checked.
- Full browser flight regression: 96 passed, 12 failed. Eight failures involved
  incomplete render-frame windows, two involved tracked ground/zoom behavior,
  and two recorded terrain-service HTTP 502 responses. These remain unresolved;
  passing unit tests do not establish graphics or provider reliability.
- Phase 2 is a preview, not a claim that every external feed is available.

## Local-only briefing-room iteration
The local preview now opens a Briefing Room overview on an unshared fresh URL,
with a first-view launcher entry and a prominent top button. It adds watched
region cards, source-linked evidence search, a map-layer control surface,
clickable country context, and manual browser snapshots (30 collections maximum).
History replays the news overlay only; other feeds remain live. Comparisons use
matching region/topic/window scopes and describe additions/absences in collected
headlines, not confirmed changes in events. Briefing export includes limitations
and user-authored assessment notes. Evidence questions perform local headline
retrieval; they do not use a language model or read full articles. No historical
archive before the first capture is implied. These changes have not been pushed.

### Local performance and opening preferences
View controls now offer Balanced (30 fps, 0.85 rendering scale), Detailed
(60 fps, full rendering scale) and Light (20 fps, 0.7 rendering scale).
Balanced is the new default; feed polling schedules are unchanged. The app can
offer or restore the last untracked local camera view, or start at the world.
The remembered view is browser-local, with coordinate validation; shared links
keep priority. Plane icon dimensions are unchanged in this iteration.

### Startup recovery fix
The startup cover previously waited indefinitely for every shared-view layer.
It now releases after eight seconds, with a nonblocking pending-source notice.
Restoration continues; startup-location overrides still wait for restoration.
Startup gate and launcher checks: 35 passed; production build passed. The original
all-layers tab also crashed during reload; a lighter Austin recovery view was
verified visible and interactive. This does not establish an all-layers crash fix.

### Country and local news coverage
The overview now exposes country/region selection directly, including United
States, Russia, the European Union and dozens of other countries. City/town
lookup uses the existing free Photon geocoder and asks the user to confirm the
matched location. Local general-news searches omit the worldwide topic filter.
Up to 30 searched places persist locally, with up to 20 watched places. Location
markers are context only; news coverage depends on indexed publisher reports.
Country/town scopes remain distinct in request caches and historical comparisons.
Compact navigation is raised above overlapping map panels so it stays clickable.

### Compact opening layout repair
At narrow browser widths, collapsed map panels now remain compact side controls
instead of stretching across the entire map. Expanded rails retain scrolling,
with space between navigation, panel controls and attribution. Verified in the
existing local browser pane, including expanding Data Layers.

### Consistent opening location
Retired automatic last-view recording and the return-to-last-place prompt.
Fresh visits use the original Austin view, or one of 28 major cities saved in
View → My chosen city. Chosen cities open directly at a north-up city overview,
without a competing Austin fly-in. Explicit map URLs retain their own view.
Aircraft proxy verification returned 162 unique reports from adsb.lol's 250 nm
regional fallback; movement between source updates remains estimated.

### Functional walkthrough and error handling
See QA-REPORT.md for tested workflows, remaining provider/control issues, and
verification scope. Repaired the compact attribution clearance, handled an
expected background-flight cancellation when clearing layers, and surfaced
road-network fetch failures in traffic status. The final build and 77 focused
checks passed; both runtime repairs were also verified with browser fixtures.

### Local stability follow-up
Added bounded installation and road requests, individual source retries, limited
bulk-refresh concurrency, progressive local dataset processing, and truthful
traffic zoom guidance. Installation refresh failures retain visibly stale data;
teardown clears it. Manual street-traffic retry works without moving the map.
The full Radio regression now passes 106/106. See STABILITY-REPORT.md for the
full automated results, 14-layer endurance check, and public-camera limitations.
