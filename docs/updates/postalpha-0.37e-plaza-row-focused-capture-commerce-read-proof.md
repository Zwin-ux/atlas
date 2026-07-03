# Post-Alpha 0.37E - Plaza Row Focused Capture / Commerce Read Proof

## Status

Local green.

## Player-Facing Promise

Riverside keeps the public Alpha loop unchanged while Plaza Row becomes a more
reviewable storefront module: larger footprint, seven storefront bays, five
non-text sign mounts, deeper apron/recesses, heavier parapet, and a focused
commerce-detail proof camera.

## Engineering Promise

The public `CityWorldScene` exposes a deterministic `commerce_detail` camera.
`WorldBasis` frames it. Plaza Row carries stronger `commerceGeometry`, and
`CityWorldRenderer` consumes that geometry through
`drawObjectKitCommerceStripRead(...)`. The slice is proven by
`scripts/verify-plaza-row-focused-capture.mjs`.

## Geometry Profile

`building-plaza-strip`:
- `prefabFamily`: `commerce_strip`.
- `width`: `6.1`.
- `depth`: `2.05`.
- `height`: `1.78`.
- `bayCount`: `7`.
- `signMountCount`: `5`.
- `apronDepth`: `0.4`.
- `glassRecessDepth`: `0.42`.
- `parapetWeight`: `1.18`.
- `focusTarget`: `plaza_row`.

Renderer addition:
- `storefrontThresholds` draws bay-level threshold slabs under the glass
  rhythm.

## Focused Capture

`commerce_detail`:
- center: `{ x: 29.2, y: 12.1, z: 0 }`.
- zoom: `1.62`.
- camera distance from Plaza Row: `0.403`.
- scene-window visible commands: `85`.
- building command groups: `3`.
- command visibility ratio: `0.059`.
- public clutter commands: `0`.

## Metrics

- Clone pressure: `0.133`.
- Terrain massing: `0.899`.
- Empty-board ratio: `0.056`.
- First-viewport composition: `0.775`.
- Building/lot contact: `1.0`.
- Lot/road contact: `0.805`.
- Strict split guard: `0 blockers`, `0 unknowns`.

## Screenshot Packet

- Coverage:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-037e-plaza-row-focused-capture-local\coverage`
- Commerce detail:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-037e-plaza-row-focused-capture-local\commerce-detail`

Note: the commerce-detail proof still uses the public default selected-place
state, so Eastvale Core overlays appear in the screenshot. That is acceptable
for storefront geometry proof; it is not a no-label art approval packet.

## Verification

- `pnpm --dir packages/core test -- city-world-compiler city-world-scene-window city-world-basis` passed, `19 files`, `85 tests`.
- `pnpm build:core` passed.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only` passed.
- `node scripts\verify-object-kit-renderer-consumption.mjs --json-only` passed.
- `node scripts\verify-commerce-strip-prefab-geometry.mjs --json-only` passed.
- `node scripts\verify-plaza-row-focused-capture.mjs --json-only` passed.
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only` passed.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only` passed.
- `pnpm verify:preview:http` passed against local `http://127.0.0.1:8787/preview`.
- `ATLAS_BASE_URL=http://127.0.0.1:8787 node scripts\verify-engine-beta-coverage.mjs` passed.
- `node scripts\verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview --camera-preset commerce_detail --proof-only --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-037e-plaza-row-focused-capture-local\commerce-detail` passed.

## Skipped

No backend, DB, migrations, provider geometry, package/env drift, MCP tool-list
change, public Anaheim/Ontario exposure, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, cars, humans, decorative props, labels,
panels, glows, or dashboard UI.

## Next

Run `0.38E Engine Quality Axis Review / Next Target Selection`. Do not run
another commerce pass unless the 0.37E focused screenshot is rejected with one
exact Plaza Row blocker.
