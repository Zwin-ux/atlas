# 0.75C-4 CODEX RESULT - NS-3 Presentation Fixes

Date: 2026-07-08
Branch: `fable/0.58e-prop-cleanup`
Audit: `artifacts/0.75c-presentation-audit/FABLE_AUDIT.md`

## Scope

Implemented Fable audit findings F1-F6 in scoped presentation files. No renderer
scene-graph, generator, compiler, dependency, MCP, provider-geometry,
persistence, paid, Hosted Clawd, Anaheim/Ontario, or build-web work.

## Per-Finding Result

### F1 - dark map veil

Changed both dark map filter rules from `brightness(0.82) saturate(0.9)` to
`brightness(0.94) saturate(1)`.

- `web/src/styles.css:141`
- `web/src/styles.css:147`

### F2 - generate district dark parity

Added dark-theme styles for `city-world-generate-district` after the shared
primary-action recipe, so explicit `data-theme="dark"` and the
`prefers-color-scheme` fallback both use the same dark panel treatment as the
other chrome cards instead of a white card.

- `web/src/styles.css:1397`
- `web/src/styles.css:1413`

### F3 - copy and honesty guardrail

Changed the coverage explainer to the exact required string:
`Riverside is fully explorable. Other counties preview as outlines. Nothing saves between chats.`

- `web/src/CountySwitcher.tsx:55`

Removed the visible `LOOKUP not saved` product-path chip/element from the county
switcher.

- `web/src/CountySwitcher.tsx:1`
- `web/src/CountySwitcher.tsx:18`

Changed the district button label to `Generate a district` and kept the honesty
subline as `generated · session-only`.

- `web/src/App.tsx:413`

Generated-scene honesty banner untouched. Existing widget verifier still asserts
synthetic / not-real / session honesty.

- `web/src/CityWorldView.tsx:134`
- `scripts/verify-generated-district-widget.mjs:79`

Copy assertion update:

- `scripts/verify-county-switcher.mjs:251` now asserts the new explainer exactly.
- `scripts/verify-county-switcher.mjs:254` now fails if a lookup-not-saved chip returns.

### F4 - mobile coverage collapse

Added minimal state to the county switcher and CSS so `<=480px` renders the
coverage card as a one-line chip by default. Tapping the chip expands/collapses
the county rows. Desktop layout remains full.

- `web/src/CountySwitcher.tsx:20`
- `web/src/CountySwitcher.tsx:49`
- `web/src/styles.css:393`
- `web/src/styles.css:1430`

### F5 - bottom toolbar button grammar

Restyled the bottom sticker icon buttons to match the top-right zoom stack's
rounded-square size/radius/border/background grammar. Icons unchanged.

- `web/src/styles.css:531`
- `web/src/styles.css:611`
- `web/src/styles.css:1520`

### F6 - "76% active" decision

Kept the dot and relabeled it plainly as `76% of places active`, with matching
`title` and `aria-label`.

Why: the value maps to real curated scene data, not a random placeholder. The
Riverside demo scene stores curated per-place `activity` values, and the scene
compiler derives place activity from curated county node scores.

Evidence:

- `packages/core/src/voxel/riversideDemoScene.ts:197`
- `packages/core/src/voxel/VoxelSceneCompiler.ts:203`
- `packages/core/src/voxel/VoxelSceneCompiler.ts:272`

Implementation:

- `web/src/CityWorldView.tsx:88`
- `web/src/CityWorldView.tsx:205`

## Verification

Passed:

- `pnpm typecheck:starter`
- `pnpm test:core` - 20 files, 99 tests passed
- `node scripts/verify-tool-result-shape.mjs`
- `node scripts/verify-provider-boundaries.mjs`
- Copy grep over changed widget/verifier files found no old presentation strings:
  `% active`, `Play Riverside now`, `Browse CA shells`, `Lookup without saving`,
  `Turn to a new district`, `LOOKUP not saved`, `public-product-path`
- `git diff --check`

Attempted:

- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Result: blocked by this sandbox/worktree Git index permission issue. The guard
reports unchanged `web/src/VoxelSceneView.tsx` as modified; `git hash-object
web/src/VoxelSceneView.tsx` matches HEAD blob
`ebe2ab11ad38222f3069aea04eea54f8ef641805`, but Git cannot refresh or restore
the parent worktree index:
`Permission denied` on `C:/Users/mzwin/Documents/Atlas/.git/...`.

Not run per packet instruction:

- `pnpm build:web`
- `node scripts/verify-generated-district-widget.mjs`
- `node scripts/verify-widget-performance.mjs`
- both-theme screenshots

## Risks

- Browser bundle and screenshots still need reviewer replay because this sandbox
  was instructed not to run the esbuild/browser gates.
- `web/src/VoxelSceneView.tsx` appears in `git status` as modified due the Git
  index permission/line-ending artifact above, despite matching HEAD content.
