# Prompt 08 — Google Maps adapter scaffold

Add Google Maps adapter behind GeoDataAdapter.

Files:
- packages/geo/src/GeoDataAdapter.ts
- packages/geo/src/MockGeoDataAdapter.ts
- packages/geo/src/GoogleMapsAdapter.ts
- packages/geo/src/SignalExtractor.ts

Do not require real API key to run.
Google adapter should throw clear error if env vars missing.
Mock adapter remains default.

Methods:
- geocode
- nearbySearch
- aggregatePlaces
- route

Acceptance:
- mock adapter works
- real adapter compiles but is not required
- docs explain env vars
- BUILD_LOG.md updated
