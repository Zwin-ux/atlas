# CODEX RESULT 0.80-1

## Scope

- Quest: `0.80-1 Global grade + lighting`.
- Edited only `web/src/CityWorldRenderer.tsx`.
- Added no renderer objects, no per-building pass, no core/compiler/server changes, no staged files.

## Grade Params

- S-curve mix: `0.46 -> 0.38`.
- Highlight rolloff: `mix(1.0, 0.87, smoothstep(0.68, 1.0, luma)) -> mix(1.0, 0.93, smoothstep(0.76, 1.0, luma))`.
- Saturation retention: `0.96 -> 1.06`.
- Warm split tone: `vec3(1.055, 1.005, 0.915) -> vec3(1.07, 1.015, 0.895)`.
- Cool split tone: `vec3(0.925, 0.975, 1.065) -> vec3(0.905, 0.968, 1.09)`.
- Split-tone ramp: `smoothstep(0.16, 0.86, luma) -> smoothstep(0.12, 0.88, luma)`.
- Vignette and dither: unchanged.
- Edge haze: `vec3(0.955, 0.93, 0.83) * 0.07 -> vec3(0.965, 0.935, 0.79) * 0.045`.

## Lighting Spread

- `sunlitColor(top)`: `scale 1.22 + warm 0.15 -> scale 1.26 + warm 0.17`.
- `sunlitColor(sun)`: `scale 1.12 + warm 0.12 -> scale 1.18 + warm 0.15`.
- `sunlitColor(shade)`: `scale 0.40 + cool 0.32 -> scale 0.36 + cool 0.24 + warm 0.06`.
- `buildingFaceColor(top)`: `scale 1.12 + warm 0.08 -> scale 1.17 + warm 0.08`.
- `buildingFaceColor(sun)`: `scale 1.04 + warm 0.09 -> scale 1.11 + warm 0.09`.
- `buildingFaceColor(shade)`: `scale 0.52 + cool 0.24 -> scale 0.46 + cool 0.16 + warm 0.04`.

## Design Intent

The grade now preserves more pigment and bright-surface energy so the board reads sunlit instead of milky. The split tone is a little stronger, but the reduced haze and softer S-curve keep the result vivid rather than garish. Box faces now have a clearer top/sun/shade step, with building faces keeping more local color than terrain.

## Perf Safety

- No ground AO pass was added.
- Existing footprint/contact-shadow and cast-shadow paths remain unchanged.
- The grade remains one full-screen filter pass.
- Lighting changes are recoloring existing passes only.

## Gates

- `pnpm typecheck:starter`: passed.
  - tail: `tsc -p server/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit`
- `pnpm test:core`: passed.
  - tail: `Test Files 24 passed (24); Tests 156 passed (156); Duration 13.05s`

## Skipped

- Browser audit/perf: reviewer-run per packet.
- Crop-test screenshots: reviewer-run acceptance gate.

## Risks

- Final approval is visual: light/dark screenshots may still need a small saturation or shade warmth trim after eyes-on crop review.
