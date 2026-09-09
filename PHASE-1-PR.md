# Phase 1: free local setup, source health, cameras and live weather views

This change makes the public-data globe easier to run locally without paid
services and adds city, hazard and weather views. Users can start with npm ci
and npm start, then optionally supply their own ship, fire and traffic keys.

It adds source-health diagnostics, expanded camera coverage and HLS playback,
saved city favorites, Boston transit, GDACS hazard reports, worldwide weather,
temperature units and precipitation radar. Free-only startup blocks Google and
OpenAI services. Original authorship and MIT licensing are retained.

Validation before submission must include the exact upstream comparison and
final staged-file secret review. Earlier local builds and focused tests passed;
four known grounded-aircraft/model regression checks remain unresolved.
Provider coverage is incomplete and public-feed availability is not guaranteed.
