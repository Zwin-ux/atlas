# Post-Alpha 0.39E - Public Object Identity / Civic-Service Read Pass

Status: local green.

## Purpose

0.39E implements the selector result from 0.38E/0.38F: improve public Riverside
object identity without moving into commerce repeat, terrain, mobile density,
hidden Anaheim/Ontario, provider, DB, paid, persistence, or broad UI scope.

## Implementation

- Added `CityWorldCivicLandmarkPrefabGeometry` and
  `CityWorldServiceGymPrefabGeometry`.
- Assigned typed geometry through `assignCityWorldObjectKit`.
- Added Eastvale Core stress-cell tags and geometry:
  `eastvale_core`, plinth tiers, entry bays, facade piers, glass bands, roof cap.
- Added Gym/service stress-cell tags and geometry:
  `eastvale_gym`, service bays, sawtooth count, recessed entry, utility apron,
  roof monitor.
- Updated `CityWorldRenderer` to consume `building.objectKit` for civic and
  service/gym helpers in both sprite-backed and primitive paths.
- Added `scripts/verify-public-object-identity-civic-service.mjs`.

## Evidence

- `node scripts\verify-public-object-identity-civic-service.mjs --json-only`
  passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only`
  passed.
- Public coverage packet passed with Riverside, Orange shell, Unknown L0, MCP,
  and submission checks.
- No-label Riverside proof passed for default and `residential_detail` camera.

Screenshot roots:

- `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\coverage`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\no-label`
- `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-039e-civic-service-local\no-label-residential-detail`

## Metrics

- `prefabCoverageRatio`: `1`
- `clonePressureRatio`: `0.133`
- `landmarkSignatureScore`: `1`
- `civicObjectKitScore`: `0.955`
- `terrainMassingCoverageRatio`: `0.899`
- `emptyBoardRatio`: `0.056`
- `firstViewportCompositionScore`: `0.775`
- `buildingLotContactRatio`: `1`
- `lotRoadContactRatio`: `0.805`

## Anti-Scope Held

No commerce repeat, terrain pass, mobile-density pass, Anaheim/Ontario public
promotion, DB implementation, provider geometry, new MCP tools, public UI
redesign, Hosted Clawd, Stripe, OAuth, XP, evidence, automation, reports,
exports, cars, humans, props, panels, glows, or label crutches.

## Next

Run `0.40E Engine Quality Axis Review / Next Target Selection`. Do not keep
polishing civic/service unless a verifier or human screenshot review names one
exact blocker.
