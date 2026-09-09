# Local stability pass — September 8, 2026

This follow-up supersedes the installation timeout and intermittent cockpit-toggle findings in QA-REPORT.md. Changes remain local; nothing was published or pushed.

## Improvements

- Installation requests have a 12-second network deadline. Failed refreshes retain existing records and mark them stale; teardown clears old records correctly.
- Street-road requests have a 15-second deadline and a 30-second retry backoff. Manual retry reloads the current location without requiring camera movement. Above 8 km, status explains that street traffic requires zooming in.
- Source Status provides individual retry buttons with per-source cooldowns. Bulk manual refresh runs at most two sources concurrently. Background provider polling remains independently scheduled.
- Large local datasets yield during parsing and entity processing to allow the interface to respond between batches.
- The cockpit regression test waits for the actual asynchronous layer transition before checking it.
- Automatic last-view restoration stays retired. The original Austin opening and optional saved major-city choice remain available.

## Verification

| Check | Result |
| --- | --- |
| Main automated suite | 2,732 passed, 1 skipped, 0 failed |
| Additional test group | 1 passed |
| Allocation/performance regression group | 13 passed |
| Radio browser regression | 106/106 passed |
| Deliberate timeout and recovery browser checks | 4/4 passed |
| Production build | Passed; existing large-chunk warning remains |
| Combined Earth-map endurance test | 14 compatible layers, two minutes, no uncaught browser errors; clear-all succeeded |

Short city, country and world frame samples measured approximately 29–30 fps on this machine. These are bounded samples, not a hardware-independent performance guarantee. The exclusive Space Missions mode was excluded from the combined Earth-layer run.

Installation failures and recovery used isolated browser fixtures. The original combined harness sampled too early after a camera-triggered restart; the corrected recovery harness waited for the settled timeout and passed at approximately 13 seconds. Other feeds in the combined run used their real endpoints. Austin traffic reported 76% road coverage matched to TomTom flow. Rendered cars are animated representations, not individually tracked vehicles.

Evidence: qa-results/stability/results.json, qa-results/stability/recovery/results.json, and the city/country/world screenshots. Generated evidence is excluded from Git publication.

## Remaining limits

Some public cameras successfully return an image containing “Image Unavailable.” Transport success does not prove that a camera is operational. The combined screenshots also show that enabling every compatible layer produces a crowded map; this is a stress configuration, not a recommended opening view. Free provider outages, rate limits and geographic coverage gaps remain possible.
