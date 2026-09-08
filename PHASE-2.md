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
