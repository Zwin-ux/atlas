# 0.75C-1 Prop / Building Depth Interleave - Codex Result

## Approach

Implemented the recommended shared painter-order approach.

- Added exported core depth helpers:
  - buildings: `x + y + max(width, depth) * 0.001`
  - props: `x + y`
  - equal-depth tie: building before prop
- Updated `web/src/CityWorldRenderer.tsx` so building and prop visual groups
  parent into one `buildingPropDepthLayer`.
- Each building/prop group gets `zIndex = depthKey`; the shared container sorts
  once at scene rebuild end.
- Preserved the QA bisection contract by keeping `buildingLayer` and
  `propLayer` as `world.children` labels. They are now visibility proxies that
  hide/show their matching depth-sorted groups independently.
- Left pads and cast shadows in their existing lower layers.

No deviation from the packet approach, except that the legacy QA labels are
proxy handles rather than visual parents. That is required because nested
building/prop subgroups cannot interleave across parent containers in Pixi.

## Files Touched

- `web/src/CityWorldRenderer.tsx`
- `packages/core/src/voxel/cityWorldRenderCommands.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-render-commands.test.ts`
- `scripts/verify-widget-performance.mjs`
- `docs/BUILD_LOG.md`
- `docs/DECISIONS.md`
- `docs/NEXT_QUESTS.md`
- `artifacts/current-update.json`
- `artifacts/0.75c-depth-interleave/CODEX_RESULT.md`

## Verify Evidence

`pnpm typecheck:starter` - passed.

Tail:
```text
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
$ pnpm --dir packages/geo build
$ tsc -p tsconfig.json
```

`pnpm test:core` - passed.

Tail:
```text
Test Files  20 passed (20)
Tests  98 passed (98)
Duration  2.71s
```

`pnpm build:web` - blocked in sandbox.

Tail:
```text
error: Cannot read directory "../..": Access is denied.
error: Could not resolve "C:\Users\mzwin\Documents\atlas-53e-fable\web\src\main.tsx"
Node.js v24.16.0
```

Direct file checks confirmed `web/src/main.tsx` exists and can be read by Node
and PowerShell in this workspace, so this appears to be the esbuild native child
process hitting the sandbox while resolving paths.

`node scripts\verify-generated-district-parity.mjs` - passed.

Tail:
```text
PASS  first-viewport composition >= 0.60 (0.671)
PASS  empty board ratio <= 0.10 (0)
PASS  home clone pressure <= 0.30 (0.1)
PASS  building/lot contact >= 0.95 (1)
PASS  no scene hard blockers
curated Riverside reference: pad fill mean 0.993, desktop lower frame 0.194
```

`node scripts\verify-render-command-layer-budget.mjs` - passed.

Tail:
```text
"ok": true,
"update": "prealpha-0.27e-render-command-pipeline-layer-budget",
"blockerCount": 0,
"blockers": [],
```

`node scripts\verify-fable-prop-cleanup.mjs` - passed.

Tail:
```text
"ok": true,
"update": "postalpha-0.58e-fable-prop-cleanup",
"blockerCount": 0,
"blockers": [],
```

`node scripts\verify-cityworld-mobile-occlusion.mjs` - passed.

Tail:
```text
"blockerGroups": {
  "productMobile": [],
  "shellEmptyState": [],
  "hiddenDraftSafety": [],
  "providerBoundary": []
},
"blockers": []
```

`node scripts\verify-provider-boundaries.mjs` - passed.

Tail:
```text
"ok": true,
"update": "prealpha-0.1e-provider-boundary",
"blockerCount": 0,
"blockers": []
```

`node scripts\verify-tool-result-shape.mjs` - passed.

Tail:
```text
"ok": true,
"update": "postalpha-0.32e-runtime-scene-packet-memory-adapter",
"blockerCount": 0,
"blockers": []
```

`node scripts\verify-no-google-in-renderer.mjs` - passed.

Tail:
```text
"ok": true,
"roots": [
  "web/src",
  "apps/widget/src"
],
"blockerCount": 0,
"blockers": []
```

`node scripts\verify-object-kit-renderer-consumption.mjs` - passed.

Tail:
```text
"ok": true,
"update": "prealpha-0.74f-wall-plane-facade-consumption",
"blockerCount": 0,
"blockers": [],
"warnings": []
```

`node scripts\verify-object-authorship-scene-grammar.mjs` - passed.

Tail:
```text
"ok": true,
"update": "prealpha-0.11e-public-object-authorship",
"blockers": []
```

`node scripts\verify-public-object-kit-prefab-palette.mjs` - passed.

Tail:
```text
"ok": true,
"update": "postalpha-0.34e-public-object-kit-prefab-palette-contract",
"blockerCount": 0,
"blockers": [],
"warnings": []
```

`node scripts\verify-roads-roofs-scene-grammar.mjs` - passed.

Tail:
```text
"ok": true,
"update": "prealpha-0.2e-roads-roofs-scene-compiler",
"blockers": []
```

`node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only` - passed.

Tail:
```text
"strictUnexpectedPaths": [],
"blockers": []
```

## Not Run

- `node scripts\verify-generated-district-widget.mjs`
- `node scripts\verify-widget-performance.mjs`

Reason: both require a fresh served web bundle. `pnpm build:web` is blocked in
this sandbox by the esbuild access-denied failure above.

## Known Risks / Limitations

- Browser proof for the new QA visibility proxy is implemented in
  `verify-widget-performance.mjs` but not executed here due to the build block.
- The added per-building/per-prop group containers increase display-object
  count. The performance gate still enforces the 1,600 ceiling, but it needs
  replay after `build:web` succeeds.
- No scene compiler, generator, prop-kind, or cap contracts were changed.
