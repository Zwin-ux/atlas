# Sprite Atlas Readiness Brain

Date: 2026-06-30

Status: E7.2 planning brain. This is the next visual-quality implementation lane
after the E8.4 review-readiness pass.

## Product Target

Atlas should feel like a high-quality ChatGPT app because the first screen is a
playable city map, not because it has more panels. The map should keep opening
directly into the full-screen Pixi Eastvale city slice with tiny React HUD
overlays only.

E7.2 is about making the renderer ready for real tile and sprite art without
breaking the Alpha baseline. It should improve the production lane, not change
the product shape.

The desired first read:

- Full-screen colorful isometric city.
- Strong silhouettes for homes, shops, gym, apartments, civic, park, roads,
  cars, trees, water, labels, pins, and Clawd.
- Map objects feel collectible and inspectable.
- HUD stays small: location tag, zoom controls, selected-place tray, sticker/drop
  button, note entry.
- No dashboard, report, campaign, tactical, or card-page framing returns.

## Non-Negotiables

- Pixi owns all map objects and map animation.
- React owns only HUD overlays and local interaction state.
- `CityWorldScene` remains the renderer contract.
- Backend/provider data stays server-side and normalized before it can influence
  any render contract.
- Code-generated primitives must remain a fallback.
- No Three.js.
- No Lottie for map objects.
- No Rive until a later Clawd-specific state-machine pass.
- No persistence, auth, database, Stripe, XP, campaign execution, or new
  provider expansion in E7.2.

## Why E7.2 Exists

E7.1 made the code-generated city look acceptable for Alpha. The weak point now
is that art decisions live inside drawing code. That makes future visual upgrades
too brittle.

E7.2 should create the bridge:

```text
CityWorldScene metadata
  -> atlas manifest validation
  -> Pixi texture resolver
  -> sprite if available
  -> primitive fallback if missing
```

The map must keep working even with no final art. The win is that every repeated
object now has a stable art key, validation, and a predictable replacement path.

## Manifest Contract

Add a typed manifest contract in core before renderer-specific loading code.

Recommended files:

- `packages/core/src/voxel/cityWorldAtlas.ts`
- `packages/core/test/city-world-atlas.test.ts`
- `packages/assets/city-world/atlas.manifest.json`
- `packages/assets/city-world/README.md`

Recommended public types:

```ts
export type CityWorldAtlasManifest = {
  type: "cityWorldAtlas";
  version: 1;
  id: string;
  label: string;
  textureUrl?: string;
  imageUrl?: string;
  tileSize: { width: number; height: number };
  palettes: Record<string, CityWorldAtlasPalette>;
  sprites: Record<string, CityWorldAtlasSprite>;
  tiles: Record<string, CityWorldAtlasTile>;
};
```

```ts
export type CityWorldAtlasSprite = {
  key: string;
  kind:
    | "terrain"
    | "road"
    | "building"
    | "prop"
    | "actor"
    | "marker"
    | "label";
  frame?: { x: number; y: number; width: number; height: number };
  anchor: { x: number; y: number };
  scale?: number;
  tags?: string[];
  fallback:
    | "terrain"
    | "road"
    | "building"
    | "prop"
    | "actor"
    | "marker";
};
```

```ts
export type CityWorldAtlasTile = {
  key: string;
  kind: "grass" | "park" | "plaza" | "water" | "sidewalk" | "road";
  variant: number;
  frame?: { x: number; y: number; width: number; height: number };
  anchor: { x: number; y: number };
  tags?: string[];
};
```

```ts
export type CityWorldAtlasPalette = {
  key: string;
  colors: {
    base: string;
    shade: string;
    highlight: string;
    accent?: string;
    roof?: string;
    trim?: string;
  };
};
```

Validation result:

```ts
export type CityWorldAtlasValidationResult = {
  ok: boolean;
  missingSpriteKeys: string[];
  missingPaletteKeys: string[];
  missingTileKeys: string[];
  warnings: string[];
};
```

## Key Naming

Keys must be deterministic and human-readable. Avoid UUID-like asset keys.

Required key style:

- `terrain.grass.0`
- `terrain.park.1`
- `terrain.plaza.0`
- `terrain.water.fill`
- `terrain.water.edge`
- `terrain.sidewalk.0`
- `road.street.straight`
- `road.street.intersection`
- `road.avenue.straight`
- `road.driveway.0`
- `road.crosswalk.0`
- `building.home.suburban.0`
- `building.shop.storefront.0`
- `building.gym.fitness.0`
- `building.apartment.midrise.0`
- `building.civic.tower.0`
- `prop.tree.round.0`
- `prop.tree.tall.0`
- `prop.bush.0`
- `prop.bench.0`
- `prop.streetlight.0`
- `prop.sign.shop.0`
- `prop.parked_car.0`
- `prop.water_shimmer.0`
- `actor.car.0`
- `actor.walker.0`
- `actor.clawd.placeholder`
- `marker.pin.default`
- `marker.sticker.star`
- `marker.hover_glow`
- `marker.selected_ring`
- `marker.note`

## Required Coverage For E7.2

E7.2 does not need final production art for every category. It must prove the
pipeline with meaningful coverage.

Minimum manifest coverage:

- All existing `CityWorldScene` `spriteKey` values are present in the manifest,
  or they are explicitly allowed as primitive-only fallbacks.
- All existing `paletteKey` values are present in the manifest.
- At least one sprite-backed or manifest-backed entry exists for:
  - home
  - shop
  - tree
  - car
  - pin/sticker
  - road detail
  - water detail

Minimum renderer coverage:

- Buildings can resolve sprite metadata before falling back to Graphics.
- Props can resolve sprite metadata before falling back to Graphics.
- Actors can resolve sprite metadata before falling back to Graphics.
- Markers can resolve sprite metadata before falling back to Graphics.
- Missing atlas entries never blank the map.

## Renderer Integration

Add a small resolver in the renderer layer. Do not let rendering code scatter
string lookups everywhere.

Recommended files:

- `web/src/cityWorldAtlasResolver.ts`
- `apps/widget/src/cityWorldAtlasResolver.ts`
- shared copy only if the app structure already supports it cleanly

Resolver responsibilities:

- Load or receive the atlas manifest.
- Validate keys against the scene in development/test paths.
- Resolve `spriteKey` to a Pixi texture when a loaded texture exists.
- Resolve `paletteKey` to fallback colors when no texture exists.
- Return a typed fallback instruction instead of `undefined`.

Pseudo-contract:

```ts
type ResolvedCityWorldAsset =
  | { mode: "sprite"; texture: Texture; anchor: PointData; scale: number }
  | { mode: "primitive"; fallback: string; palette: CityWorldAtlasPalette };
```

Drawing helpers should call the resolver first, then use the current primitive
art when `mode === "primitive"`.

## Asset Folder Shape

Use a folder that can grow into real art without moving files again:

```text
packages/assets/city-world/
  README.md
  atlas.manifest.json
  textures/
    atlas-placeholder.png        # optional in E7.2
  source/
    notes.md                     # art direction and export notes
```

If E7.2 ships without a real PNG spritesheet, the manifest should still exist and
mark entries as fallback-ready. A tiny placeholder PNG is useful only if it
proves the Pixi texture path without compromising time.

## Visual Direction

The style should be polished, cute, and readable without feeling childish.

Rules:

- Strong roof silhouettes.
- Clear category shapes: homes low and warm, shops sign-forward, gym bolder,
  apartments taller, civic more landmark-like.
- Roads should feel authored with curbs, lanes, crosswalks, and driveway cuts.
- Terrain should have enough variation to avoid blank slabs.
- Palette should not collapse into one hue family.
- Labels stay sparse and map-native.
- Pins/stickers should feel like collectible map marks, not enterprise icons.

Avoid:

- Generic SaaS gradients.
- Tactical/campaign color language.
- Huge HUD panels.
- Dark dashboard chrome.
- Random decorative effects that do not belong to the city.

## Implementation Order

1. Add the manifest contract and validation helpers in `@atlas/core`.
2. Add the first `packages/assets/city-world/atlas.manifest.json`.
3. Add tests that validate current Eastvale `CityWorldScene` metadata against the
   manifest.
4. Add renderer-side atlas resolver with primitive fallback.
5. Route buildings through the resolver.
6. Route props through the resolver.
7. Route actors and markers through the resolver.
8. Run type/build checks.
9. Run browser QA on local `/preview`.
10. Only then consider adding a tiny PNG texture proof if the resolver path needs
    visual confirmation.

## QA Gates

Commands:

```powershell
pnpm test:core
pnpm --dir packages/core typecheck
pnpm typecheck:starter
pnpm build:web
pnpm --dir apps/widget typecheck
pnpm verify:preview:http
```

Browser checks:

- `/preview` shows one full-screen Pixi canvas.
- First frame is dense and nonblank on desktop.
- Mobile viewport has no horizontal overflow.
- Drag changes camera position.
- Wheel zoom works.
- Place click works for Gym, Park, Apartments, and Civic.
- Sticker drop appears in-world.
- Note save remains session-only and visible through the tray.
- No visible old language: `campaign`, `report`, `signal`, `risk`, `tactical`,
  `dashboard`, `board`.

## Done Means

E7.2 is done when future art can be swapped in by editing a manifest and adding
textures, while the current Alpha still renders well without those textures.

The user-visible app should look like the same full-screen city map, just with a
cleaner internal art pipeline and at least a small visible quality improvement.
