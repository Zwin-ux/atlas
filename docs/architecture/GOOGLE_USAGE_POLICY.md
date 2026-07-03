# Google Usage Policy

Google Maps Platform may be used only behind Atlas provider boundaries.

## Allowed

- Server-side geocoding.
- Server-side Places lookup.
- Temporary lookup tray summaries.
- Source notes that identify Google Maps Platform as the provider.

## Not Allowed

- Google SDKs or API endpoints in renderer/web/widget code.
- Google map tiles, satellite, 3D, or street imagery as Atlas voxel source art.
- Cached Google content as permanent Atlas source packs.
- Lookup results as county readiness, scene eligibility, or public-quality proof.
- Secrets in `_meta`, `structuredContent`, widget state, logs, screenshots, or docs.

## Current Repo Boundary

The current RC uses `packages/geo` as the provider adapter package. A later
server-only `GeoGateway` may wrap it, but 0.1E should not add a disconnected
parallel provider stack.
