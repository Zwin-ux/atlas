# Google Maps Adapter Spec

**Program:** `docs/USA_ACCURACY_PROGRAM.md` (owner 2026-07-29) reopens Google
Maps Platform for **national place accuracy** under the hybrid spine rules below.

## Principle

Google Maps Platform provides real-world signals. Atlas converts those signals into a stylized voxel scene.

Google should not render the main Atlas world (no Map Tiles / photoreal primary
surface). Google **may** drive:

1. **Lookup / geocode** — resolve free text to lon/lat and county.
2. **Overlay pins** — real nearby places as Atlas-owned pin geometry (distinct
   glyph from Census towns), with required attribution.
3. **Aggregates** — optional density signals for study-mode grammar bias only.

Google **must not**:

- Become the Mode B geometry spine (boundary/water/roads bake stay Census/TIGER).
- Be bulk-downloaded into national packs.
- Count as county readiness or “verified buildings.”

## Adapter interface

```ts
export interface GeoDataAdapter {
  geocode(input: GeocodeInput): Promise<ResolvedLocation>;
  resolveCounty(input: CountyLookupInput): Promise<ResolvedCounty>;
  resolveDistrict(input: DistrictLookupInput): Promise<ResolvedDistrict>;
  nearbySearch(input: NearbySearchInput): Promise<NearbyPlaceSignal[]>;
  aggregatePlaces(input: PlacesAggregateInput): Promise<PlaceAggregateSignal[]>;
  route(input: RouteInput): Promise<RouteHint[]>;
}
```

The expanded methods are E8.0 planning targets. Do not wire them into the renderer directly.

## Alpha

Use `MockGeoDataAdapter` as the fallback, but support `GoogleMapsAdapter` when
`GEO_DATA_ADAPTER=google` and `GOOGLE_MAPS_API_KEY` are set.

## Live backend

The first live backend path uses the APIs already selected for the key:

- Geocoding API
- Places API (New)
- Places Aggregate API

Routes stay disabled until Routes API is explicitly enabled.

## Pipeline

```txt
Google/Mock data
  ↓
GeoDataAdapter
  ↓
SignalExtractor
  ↓
CountyGraphBuilder
  ↓
VoxelSemanticMapper
  ↓
VoxelSceneCompiler
  ↓
PixiJS Renderer
```

## E8.1 lookup route

`GET /api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500`

The route resolves the query through the active `GeoDataAdapter`, searches nearby places, normalizes provider types into Atlas-owned place categories, and returns a `worldPlaceLookup` response with source notes and cache policy.

The route does not compile a live city scene. Pixi and React continue to consume Atlas renderer contracts only.

Lookup responses include a small runtime cache block:

- `cacheHit`
- `cachedAt`
- `expiresAt`

The cache is in-memory per server process, bounded, and used only for successful normalized lookup responses. It is a quota and latency guard, not user persistence.

Atlas place categories:

- `home_area`
- `food_drink`
- `shop`
- `service`
- `park`
- `school`
- `civic`
- `health`
- `fitness`
- `entertainment`
- `transit`
- `landmark`
- `unknown`

## Data safety

## USA-scale rule

Use Google data to resolve and enrich one requested county or district at a time. Atlas should not fetch or render the whole United States in one request. The backend should normalize provider data into country/state/county/district/place identifiers, cache derived signals with TTL, and compile a bounded scene for the current viewport.

- Do not store full Google payloads unless policy allows it.
- Store derived signals with source notes and TTL.
- **place_id** may be stored indefinitely (Maps terms); lat/lng and place
  content follow service-specific TTL limits.
- Use minimal field masks for Places calls.
- Add attribution and comply with Google Maps Platform policies before public launch.
- Do not build creepy individual-level targeting.
- Cap enrich responses (default 24, max 40 pins; radius max 5000 m).
- Fail open: quota/key errors → Census board still works; places layer unavailable.

## Overlay pin law (Phase B)

| Flag | Google | Meaning |
|------|--------|---------|
| `mayRenderAsOverlayPins` | true | Atlas pins on Mode B at NEAR/lookup |
| `mayBecomeSceneSpine` | false | Never boundary/water/road mesh from Google |
| `mayCacheTtl` | true | Short TTL content cache + durable place_id |
| `mayUseForReadiness` | false | Board readiness is Census-only |

Wire target: `GET /api/world/places-near` (packet B2) + widget pin layer (B3).
See `docs/USA_ACCURACY_PROGRAM.md` Phase B for packet order and kill criteria.

## Banned at national scale

- Pre-fetch / bulk index of Places or Roads for all 3,222 counties
- Google Map Tiles or Street View as the ChatGPT primary map
- Treating Google content as permanent offline Atlas geometry
