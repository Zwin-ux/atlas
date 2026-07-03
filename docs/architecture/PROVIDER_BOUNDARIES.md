# Provider Boundaries

Atlas is not Google Maps with a voxel skin.

## Allowed Provider Roles

- Resolve a typed place or address query.
- Return temporary lookup context for a tray/tool response.
- Provide source notes and TTL for normalized lookup results.
- Support future readiness contracts only after explicit promotion gates.

## Forbidden Provider Roles

- Renderer imports or direct web/widget provider calls.
- Permanent voxel roads, buildings, landmarks, or terrain from Google results.
- Public playable readiness from lookup results.
- Anaheim/Ontario public promotion from provider data or metadata flips.
- Raw provider fields in user-facing tool output.

## Required Usage Policy

Every `@atlas/geo` result must carry:

```ts
usagePolicy: {
  mayRenderOnAtlasMap: boolean;
  mayCache: boolean;
  mayUseForReadiness: boolean;
  reason: string;
  sourceConfidence: "mock_verified" | "provider_mapped";
  expiresAt?: string;
}
```

Google defaults in Pre-Alpha 0.1E:

- `mayRenderOnAtlasMap: false`
- `mayCache: false`
- `mayUseForReadiness: false`

Mock lookup may be cached for local smoke checks, but it is still not readiness
proof or permanent Atlas map geometry.
