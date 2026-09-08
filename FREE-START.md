# Gods Eye — free local setup

Install Node.js 22.12+ (or a newer supported LTS). In this folder, run `npm ci`,
then `npm start`, and visit http://localhost:4173.

On macOS, **Start Gods Eye.command** is an optional launcher; a downloaded copy
may require executable permission first.
Keep the launcher window open while using the app. Press Control-C to stop it.
If Gods Eye is already running, use the existing browser page instead of starting a second copy.

This launcher selects a compatible Node runtime and enables `GEV_FREE_ONLY=1`.
Google and OpenAI credentials are blocked; optional free-account keys in `.env`
are allowed. No subscription or paid API account is configured.

Try the Locations buttons or search for a city, landmark, or address and press
Enter. Bundled places work locally; other places use Photon / OpenStreetMap
through a bounded, cached proxy. The public Photon service permits moderate
project use and has no availability guarantee: https://github.com/komoot/photon.
Set `GEV_PHOTON_URL` to use your own compatible service if needed.
Turn on Earthquakes, Flights, Satellites, or the bundled infrastructure layers.
Public feeds need internet access and can be delayed, rate-limited, or unavailable.
Traffic without a TomTom key is a labeled simulation.

Use the **◉ Source Status** button at the top to inspect connections and receipt
ages, and to refresh enabled sources. Enabling Space Missions temporarily stages
its own layers; disabling it restores the previous view. It does not mean the
other feeds stopped working.

## Free-account connections

Add your own keys to `.env`, keep `GEV_FREE_ONLY=1`, and restart the launcher.
Do not paste keys into chat or save them in browser URLs.

| Feature | Variable | Account / key |
| --- | --- | --- |
| Live ships | `AISSTREAM_API_KEY` | https://aisstream.io/ |
| Fire detections | `FIRMS_MAP_KEY` | https://firms.modaps.eosdis.nasa.gov/api/map_key/ |
| Real traffic flow | `TOMTOM_API_KEY` | https://docs.tomtom.com/pricing |

TomTom lists a free vector-traffic tile allowance. Use an account with no paid
overage enabled. This setup limits requests to 5,000 tiles/day; that local counter
cannot account for other apps sharing your provider quota. Check your account's
allowance before adding a key. Without it, traffic remains explicitly simulated.

Google photorealistic buildings and OpenAI voice/AI commands are disabled under
the no-paid-services constraint. The free map is mapped imagery and terrain,
not live satellite video. Satellites are propagated from orbital elements;
CCTV is provider snapshots or streams with limited coverage; fire detections
and aircraft reports have inherent source delays. Buildings, cables, dams,
and datacenters are reference data rather than live activity.

For a manually configured launch, use a supported Node version, run `npm ci`,
then `npm run dev -- --host localhost --port 4173`. That command uses `.env`.
The free launcher keeps Google and OpenAI disabled even if `.env` later changes.

## Verification of this setup

- Production build passed using Node 24.19.0.
- All 2,607 unit and allocation tests passed after the free-source changes.
- Browser checks confirmed OpenStreetMap rendering, live aircraft tracking,
  a keyless Tokyo search, 36 earthquakes, and 834 satellites. Feed counts vary.
- The retry verified free place search for Reykjavik, 5,537 aircraft in the
  server snapshot, 50 military aircraft, 25 space missions, 800 camera directory
  entries, and live weather. An Austin CCTV snapshot displayed `SNAPSHOT · OK`.
  Directory entries do not guarantee every camera is working. The station-only
  satellite endpoint returned 21 objects; the UI's four catalogs totalled 834.
- The added AISStream, NASA FIRMS, and TomTom keys were verified against real
  payloads: a live ship stream, 183,552 fire detections from three sources with
  `stale: false`, and a traffic tile decoded into 870 road segments. Counts vary.
- Fixed the mapped-installations proxy to try another public mirror after
  upstream access rejections. The previously failing request now returns HTTP
  200 with six mapped objects in the Austin test area. Free-mode HUD summaries
  now use local metrics without repeatedly calling the disabled OpenAI service.
- The 21 targeted proxy/HUD tests and production build passed after these fixes.
- Fresh browser checks showed ships and fires ON, TomTom traffic ON with 96%
  coverage, CCTV and mapped layers finishing loading, and no console errors.
  Visual inspection still found a provider's "Image Unavailable" camera picture
  delivered with HTTP 200. The badge now says RECEIVED instead of OK and explains
  that delivery does not prove camera availability. Individual cameras remain
  provider-dependent; a successful directory request is not a camera health test.
- Ship client refresh is now 10 seconds (previously 60), reading the server's
  existing live stream cache; no extra upstream AIS subscription was added.
- Additional UI checks loaded 750 radio directory entries, about 4,400
  datacenters, 716 dams, and about 2,600 cable reference objects. Radio playback
  itself was not tested. Bikeshare returned no stations at the current view;
  mapped installations requested a closer view. These are not verified live feeds.
- During the retry, OpenSky switched to the existing adsb.lol regional fallback.
  That preserves nearby aircraft but is not global coverage. The Source Status
  panel now carries the same fallback/stale labels as the layer controls.
- Before the latest proxy fix, the broader tracking harness finished with 96 passes and 4 failures:
  three checks reported one HTTP 503 from the military-installations endpoint;
  one ground-model sampling-count assertion also failed. The endpoint now passes
  the live payload check; this does not establish that every tracking assertion passes.
- A later full tracking-harness run was interrupted by a development-page reload
  (execution context destroyed) during the camera-label change, so it is not a
  completed regression result. The final production build passed.
- Dependency hardening on September 6 updated compatible packages plus Puppeteer
  and Sharp to patched releases. The install audit reported zero known
  vulnerabilities. This is not a security certification or a public deployment review.

## City Pulse, Storm Watch, and worldwide weather

Open **◈ City Pulse, Storm Watch & World Weather** at the top of the map.
The panel adds its own map markers; selecting a result flies to its location.
**Focus map** temporarily hides other enabled layers; **Restore other layers**
or **Stop & close** brings them back. Closing stops these feeds and clears their markers.

- **City Pulse:** Boston transit positions from MBTA (up to 200 vehicles,
  refreshed every 30 seconds). Other cities retain access to the existing traffic,
  camera and bikeshare controls where those providers have coverage. Transit is
  not worldwide. Use **Enable city layers** and **Browse cameras** as needed.
- **Storm Watch:** global GDACS cyclone, flood, drought, wildfire and volcano
  reports, refreshed every six minutes. Up to 300 reports are mapped; cyclone,
  flood, drought and volcano reports take priority over wildfire overflow.
  These are published event reports, not radar, comprehensive local warnings,
  or river-gauge measurements. Each record shows its report date and severity.
- **Weather around the world:** an 18-city global overview plus weather search
  for other places. Open-Meteo provides model-based current conditions and
  three-day forecasts, labeled separately from direct station observations.
  Temperature offers Fahrenheit/Celsius, wind km/h, precipitation mm, and weather times UTC.
  Refresh interval is ten minutes; source model updates can be less frequent.

Server caches coalesce simultaneous requests. On provider failure, cached data
less than an hour old may be returned explicitly marked STALE; older server
cache is not returned as current. Client-retained data also gets a stale label
if refresh fails. The Open-Meteo public endpoint is intended for noncommercial
use within its free limits; no paid service or new key was configured.

Sources: https://api-v3.mbta.com/ · https://www.gdacs.org/ · https://open-meteo.com/

Verified: 18 overview weather locations, 200 Boston vehicle records, and 300
hazard reports (including 7 cyclone and 15 flood reports in the test snapshot).
Browser checks covered all three views, focused mapping, and weather search for
Reykjavik. Five targeted tests and the production build passed. Existing unrelated
grounded-aircraft regression failures have not been changed by this addition.

## More camera cities and live video

Use the **▣ Browse camera cities and live video** button at the top of the map.
Choose a city/region and camera. Entries marked **VIDEO** expose an official
Caltrans HLS stream; press **Play live video** to start it. Return to snapshot,
change cameras, or close the dialog to release the stream. Playback is on demand
and limited to one stream in this browser panel. Traffic layers can remain enabled.

The expanded catalog loads all 12 Caltrans districts and adds 300 WSDOT cameras
across 10 Washington areas. The current 900-camera cap is shared across sources
to retain geographic variety. On verification it contained 216 live-video links;
individual stream availability varies. Los Angeles video played successfully in
the browser. Washington and London are labeled snapshots, not continuous video.
Washington source documentation: https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0

No additional account or paid service is required for these additions. Set
`CCTV_WSDOT_ENABLED=0` to omit Washington; `CCTV_CALTRANS_DISTRICTS` can restrict
districts. Catalogs remain cached for 15 minutes. Selected snapshot requests run
every 30 seconds; provider image-update intervals may be longer. The live player
uses free HLS.js when the browser lacks native HLS playback. New York and Singapore
have not been connected in this change.

## Source health without extra API usage

The top **◉** control now shows how many enabled sources report a fault, stale
data, or a fallback. It checks the existing layer metadata every five seconds;
it does not make extra provider requests or consume API allowance. Selected
snapshot feeds also have conservative receipt deadlines to catch stalled updates.
Reference catalogs and predicted satellite positions are explicitly distinguished.

Open the control and choose **Download health report** to save a JSON report of
current states and the latest 200 state changes observed during this page session.
The report excludes raw errors, URLs, credentials, and coordinates. It is a
diagnostic journal, not a recording of observations, and resets on page reload.
Receipt age cannot establish observation freshness. Individual camera availability
still requires inspection; a provider can successfully return a placeholder image.

Validation after dependency and health changes: all 2,611 unit and allocation
checks passed, including simulated stalled receipts and recovery, bounded journal
retention, and exclusion of raw sensitive fields. The production build passed.
The completed browser tracking run passed 87 checks and failed four: grounded
models becoming ready, tracked model zoom transitions, retained hidden-model
flooring, and shown-but-not-ready fleet-model flooring. These remain unresolved.
The same full run recorded no console errors and no HTTP 5xx responses.

### Live view preferences and radar (September 6)
City Pulse now supports place search and up to 50 favorite cities saved in this
browser. Favorites appear first in the city selector and can be removed. Weather
offers remembered Fahrenheit/Celsius units for map labels, current conditions and
daily forecasts. New preferences default to Fahrenheit.
Storm Watch uses hazard symbols, severity colors and a category filter; labels
appear closer to the ground. These are report locations, not hazard footprints.
Storm Watch and World Weather include optional RainViewer precipitation radar,
a frame selector for the past two hours and opacity control. Metadata refreshes
every five minutes while open; tiles use the documented maximum zoom of 7.
Coverage is incomplete and frame generation times differ from observation times.
This is reflectivity, not Doppler velocity. No new API key is required.
Verification: 8 focused tests passed; production build passed; world weather,
custom city search/save and radar metadata loaded in the browser; a public radar
tile returned HTTP 200 image/png. This does not certify every external feed.
