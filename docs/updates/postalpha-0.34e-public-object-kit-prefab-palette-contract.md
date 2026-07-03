# Post-Alpha 0.34E - Public Object Kit Prefab + Palette Contract

Status: local green.

0.34E returns to engine quality after the 0.33E DB persistence plan. It does
not implement persistence, change public UI, change MCP tools, or expose
Anaheim/Ontario.

## What Changed

- Added `CityWorldObjectKitPrefabFamily`, `CityWorldObjectKitPaletteRole`, and
  `CityWorldObjectKitMetadata`.
- Added `CityWorldBuilding.objectKit`.
- Added `packages/core/src/voxel/cityWorldObjectKit.ts`.
- The compiler assigns object-kit metadata through `withBuildingMetadata`.
- Added `analyzeCityWorldObjectKit(...)`.
- Added `scripts/verify-public-object-kit-prefab-palette.mjs`.

## Metrics

- `prefabCoverageRatio`: `1.0`.
- `paletteCohesionRatio`: `1.0`.
- `roofBodySeparationRatio`: `1.0`.
- `clonePressureRatio`: `0.133`.
- `landmarkSignatureScore`: `1.0`.
- Weakest prefab family: `commerce_strip`.
- Anaheim playable: `false`.

## Guardrails

- No DB implementation.
- No `DATABASE_URL`, migration, package/env drift, or server DB code.
- No public Anaheim/Ontario promotion.
- No provider geometry.
- No new MCP tools.
- No cars, humans, decorative props, labels, or panels as visual compensation.

## Next

0.35E should either consume object-kit metadata in the renderer for a visible
public differentiation pass, or improve the weakest prefab family:
`commerce_strip`.
