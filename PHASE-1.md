# Phase 1 — public release candidate

This community edition extends Bilawal Sidhu's MIT-licensed God's Eye View.
Release status: community preview on ModDayJob/gods-eye-view, branch codex/phase-1.
Based on upstream ac927de; integration with newer upstream changes is pending.

## Included
- Free-only launcher, OpenStreetMap and keyless place search.
- Optional AISStream, NASA FIRMS and TomTom connections; faster ship refresh.
- Source-health indicators, stale/fallback labels and downloadable diagnostics.
- Expanded Caltrans and Washington cameras, region browsing and HLS video.
- City Pulse with Boston transit, place search and 50 saved favorite cities.
- Global GDACS hazard reports, category filters and severity symbols.
- Worldwide weather, three-day forecasts and saved Fahrenheit/Celsius units.
- RainViewer precipitation radar with recent-frame selection and opacity.
- Dependency updates, public setup instructions and automated test workflow.

## Validation and limitations
Earlier local checks passed 2,611 unit/allocation tests; the latest weather change
passed eight focused checks and a production build. A prior browser regression
run passed 87 checks and failed four grounded-aircraft/model checks. Those remain
open. See FREE-START.md for specific live checks; historical counts are not a
promise of current coverage. GitHub Actions has not run yet.

Transit is Boston-only. Radar is reflectivity, not Doppler velocity. Satellites
are predicted from orbital data. Camera availability varies. Third-party data,
maps, video and models remain subject to their source terms; the code's MIT
license does not grant blanket redistribution rights for provider content.

## Publication route
Fork the original repository under the chosen GitHub account. Clone that fork
to a separate folder to preserve upstream history, then apply this edition's
changes on a codex/phase-1 branch. Compare against upstream before committing;
do not replace upstream changes blindly. Exclude private configuration, caches,
generated builds and logs. Review the exact staged files for secrets and review
bundled data/model attribution before pushing. Do not upload this entire working
folder as a ZIP with local files included.

Open a draft pull request describing Phase 1 and its known limitations.
Publish a Phase 1 release/tag after review and passing checks. Users download
the source and run npm ci followed by npm start; each supplies their own optional
keys. A shared hosted service needs a separate deployment and quota design.
