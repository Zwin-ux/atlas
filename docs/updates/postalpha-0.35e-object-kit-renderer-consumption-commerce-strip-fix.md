# Post-Alpha 0.35E - Object Kit Renderer Consumption / Commerce Strip Fix

## Status

Local green.

## Player-Facing Promise

Riverside keeps the public Alpha loop unchanged while the commerce-strip read
gets stronger: storefront apron, bay rhythm, glass recesses, parapet/eave, and
grounded foundation contact.

## Engineering Promise

`CityWorldRenderer` now consumes `CityWorldBuilding.objectKit` directly for the
`commerce_strip` prefab family. One focused helper,
`drawObjectKitCommerceStripRead(...)`, runs in both sprite-backed and primitive
commerce paths.

## Metrics

- Public prefab coverage: `1.0`.
- Palette cohesion: `1.0`.
- Roof/body separation: `1.0`.
- Clone pressure: `0.133`.
- Landmark signature: `1.0`.
- Weakest prefab family remains `commerce_strip`.
- Commerce-strip renderer helper calls: `2`.
- Strict split guard: `0 blockers`, `0 unknowns`.

## Screenshot Packet

`C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-035e-object-kit-renderer-consumption-local`

Includes:
- Riverside desktop product loop.
- Riverside mobile `390x844`.
- Residential-detail desktop and mobile.
- Orange shell desktop/mobile.
- Unknown/L0 desktop/mobile.
- County switcher desktop/mobile states.

## Verification

- `pnpm --dir packages/core test` passed, `19 files`, `85 tests`.
- `pnpm typecheck:starter` passed.
- `pnpm build:starter` passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs --json-only` passed.
- `node scripts\verify-object-kit-renderer-consumption.mjs --json-only` passed.
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

If more public visual lift is needed, run `0.36E Commerce Strip Prefab Geometry
/ Plaza Row Focus`: improve the underlying commerce strip prefab geometry or
capture path directly instead of widening to every object family.
