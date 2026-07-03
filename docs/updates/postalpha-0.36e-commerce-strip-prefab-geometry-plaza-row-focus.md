# Post-Alpha 0.36E - Commerce Strip Prefab Geometry / Plaza Row Focus

## Status

Local green.

## Player-Facing Promise

Riverside keeps the public Alpha loop unchanged while Plaza Row moves from
generic commerce-strip styling toward a stronger storefront module: more bays,
deeper apron, stronger glass recesses, thicker parapet, and clearer non-text
sign-mount rhythm.

## Engineering Promise

The object-kit contract now includes typed `commerceGeometry` for
`commerce_strip` buildings. Plaza Row gets a focused `plaza_row` geometry
profile, and `CityWorldRenderer` consumes those values instead of hard-coded
generic commerce counts.

## Geometry Profile

`building-plaza-strip`:
- `prefabFamily`: `commerce_strip`.
- `bayCount`: `6`.
- `signMountCount`: `4`.
- `apronDepth`: `0.34`.
- `glassRecessDepth`: `0.34`.
- `parapetWeight`: `1`.
- `focusTarget`: `plaza_row`.
- Signature tags include `plaza-row-focus`, `deep-storefront-apron`, and
  `continuous-parapet`.

## Metrics

- Public prefab coverage: `1.0`.
- Palette cohesion: `1.0`.
- Roof/body separation: `1.0`.
- Clone pressure: `0.133`.
- Landmark signature: `1.0`.
- Terrain massing: `0.899`.
- Empty-board ratio: `0.056`.
- First-viewport composition: `0.775`.
- Strict split guard: `0 blockers`, `0 unknowns`.

## Screenshot Packet

`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-036e-commerce-strip-prefab-geometry-local`

Includes:
- Riverside desktop product loop.
- Riverside mobile `390x844`.
- Residential-detail desktop and mobile.
- Orange shell desktop/mobile.
- Unknown/L0 desktop/mobile.
- County switcher desktop/mobile states.

Note: the standard Riverside screenshot packet still catches Plaza Row near the
edge of the frame. The code path and geometry contract are proven; if the next
slice needs stronger human visual review, add a focused Plaza Row capture path
instead of widening art scope.

## Verification

- `pnpm --dir packages/core test` passed, `19 files`, `85 tests`.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only` passed.
- `node scripts\verify-object-kit-renderer-consumption.mjs --json-only` passed.
- `node scripts\verify-commerce-strip-prefab-geometry.mjs --json-only` passed.
- `node scripts\verify-scene-packet-db-persistence-plan.mjs --json-only` passed.
- `node scripts\verify-scene-packet-memory-adapter.mjs --json-only` passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only` passed.
- `pnpm verify:preview:http` passed against local `http://127.0.0.1:8787/preview`.
- `node scripts\verify-engine-beta-coverage.mjs` passed against local `http://127.0.0.1:8787`.

## Skipped

No backend, DB, migrations, provider geometry, package/env drift, MCP tool-list
change, public Anaheim/Ontario exposure, Hosted Clawd, Stripe, XP, evidence,
OAuth, automation, reports, exports, cars, humans, decorative props, labels,
panels, glows, or dashboard UI.

## Next

If public commerce review remains weak, run `0.37E Plaza Row Focused Capture /
Commerce Read Proof`: add a focused proof path for Plaza Row or make one more
commerce-strip prefab geometry pass. Do not broaden to every object family.
