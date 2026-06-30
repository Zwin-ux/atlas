# Google Maps Adapter Spec

## Principle

Google Maps Platform provides real-world signals. Atlas converts those signals into a stylized voxel scene.

Google should not render the main Atlas world.

## Adapter interface

```ts
export interface GeoDataAdapter {
  geocode(input: GeocodeInput): Promise<ResolvedLocation>;
  nearbySearch(input: NearbySearchInput): Promise<NearbyPlaceSignal[]>;
  aggregatePlaces(input: PlacesAggregateInput): Promise<PlaceAggregateSignal[]>;
  route(input: RouteInput): Promise<RouteHint[]>;
}
```

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

## Data safety

- Do not store full Google payloads unless policy allows it.
- Store derived signals with source notes and TTL.
- Use minimal field masks for Places calls.
- Add attribution and comply with Google Maps Platform policies before public launch.
- Do not build creepy individual-level targeting.
