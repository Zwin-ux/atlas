# Google Maps Adapter Spec

## Principle

Google Maps Platform provides real-world signals. Atlas converts those signals into a stylized voxel scene.

Google should not render the main Atlas world.

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
- Use minimal field masks for Places calls.
- Add attribution and comply with Google Maps Platform policies before public launch.
- Do not build creepy individual-level targeting.
