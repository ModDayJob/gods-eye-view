# God's Eye View Community 0.2.0

A downloadable, local-first release built on Bilawal Sidhu and Sameh Khamis / Halfpixel's God's Eye View. Original MIT license and credits are preserved. Community additions by ModDayJob.

## Supported use

Run the app on your own computer with Node 24.14+ within 24.x or Node 26, using `npm ci` then `npm start`. The server binds to localhost. Desktop Chrome is the primary verified browser. Compact layouts are available, but mobile-only installation and a public multi-user hosted service are outside this release's supported scope.

No shared API keys are supplied. Maps, public radio, weather and other keyless feeds work without accounts; optional providers use each user's own credentials. Free mode keeps metered Google and OpenAI integrations off. Each provider's coverage, account eligibility and quotas still apply.

## First five minutes

1. Extract the download, install dependencies with `npm ci`, and run `npm start`.
2. Choose Explore map if the welcome screen appears. Use View to choose a starting city.
3. Enable one or two Data Layers. Source Status explains outages, stale records and retry timing.
4. Open City Pulse / Storm Watch / World Weather from the top navigation. Save favorite cities and choose temperature units.
5. Open Context → Radio → Enable. Select a station tag, then Play or Next. Worldwide stays the default; choose Near map to browse within 200 km of the current map center, nearest first. Use current map area updates that fixed area after you move elsewhere. Stop ends playback. If a stream fails, try another station or its Station Site link.
6. Add optional credentials through Power Up and Save Keys. Never share your .env or a build created with your personal browser-side tokens.

## What is included

Regional briefings and headline maps; saved stories and watchlists; city weather, radar and hazard reports; flights, ships, satellites, public cameras and radio; mapped infrastructure; source health and bounded retries; a simpler opening-city preference and compact panels.

Briefings use public reports and source links. They are not verified intelligence or a complete historical archive. Aircraft movement between reports and rendered traffic dots are estimates/visualizations. Radar is precipitation imagery with provider delays, not a worldwide Doppler-velocity product. Radio tags come from a community directory, describe the station rather than current programming, and may include music/scanner mixes. Nearby mode only searches the available catalogue; some cities have no matching stations. Encrypted/private radio is not available.

## Packaging and updates

Maintainers run `npm run release:package`. This writes a source archive and SHA-256 checksum under output/. The archive includes the dependency lockfile and .env.example, excludes private configuration, caches, installed dependencies and compiled bundles, and checks packaged bytes against locally configured credential values. A per-file manifest is included.

To update, extract into a new folder, run npm ci, copy only your own .env if desired, and start the new copy. Keep the old folder until verified. Browser favorites belong to the browser origin; exporting saved briefings before changing devices is recommended.

## Reporting problems

Include release version, browser/OS, steps, expected/actual result, and the relevant Source Status text. Do not include tokens or .env. Report community issues to ModDayJob/gods-eye-view. Report exploitable security issues privately to the maintainer.

## Release evidence

See RELEASE-VERIFICATION.md for results and remaining validation limits. Release preparation does not publish a GitHub tag or merge an upstream pull request automatically.
