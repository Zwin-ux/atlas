# Atlas Packet 0.76-T - Ship Params, Not Scenes

## Wire Contract

`select_county` and `render_voxel_county` now emit generated drafts as:

- `_meta.generatedDraftSpec`: deterministic generated district spec, provider-free, non-playable, session-only.
- `_meta.generatedDraftPacket`: existing packet/cache status metadata, unchanged.

The server no longer attaches `_meta.generatedDraftScene`. The widget validates `generatedDraftSpec`, compiles it client-side through `createDeterministicGeneratedDistrictScene(spec)`, memoizes that compile, and feeds the resulting scene through the existing `generatedScene` path. Legacy read compatibility remains: if an old result still carries `_meta.generatedDraftScene`, App.tsx can consume it.

Malformed specs degrade to the existing coverage shell path; no generated draft crash path was added.

## Payload Measurements

Verifier ceiling: 10,000 chars for `generatedDraftSpec + generatedDraftPacket`.

| Archetype | Anchor county | Spec chars | Draft meta chars | Compile ms |
|---|---:|---:|---:|---:|
| metro_grid | autauga-al | 5,816 | 6,782 | 31.211 |
| coastal_grid | aleutians-east-borough-ak | 5,582 | 6,593 | 22.519 |
| desert_basin | apache-az | 5,372 | 6,335 | 24.101 |
| mountain_valley | adams-co | 5,716 | 6,676 | 16.922 |
| prairie_town | adair-ia | 5,516 | 6,476 | 20.008 |
| river_town | butler-al | 5,672 | 6,635 | 27.726 |

Worst measured draft meta: 6,782 chars.

Extra MCP probe on `butler-al`:

- `_meta.generatedDraftScene`: absent
- `_meta.generatedDraftSpec`: present
- `generatedDraftSpec + generatedDraftPacket`: 6,635 chars
- full `_meta`: 139,859 chars because the pre-existing `coverageShellScene` is still attached for shell fallback

## Cache And Worker Decision

Kept the compiled scene packet cache and worker semantics intact. The server still compiles/caches generated draft scenes internally so the existing Redis/memory readiness stats, compile locks, queue behavior, worker entrypoint, and `/ready` cache stats remain stable.

Only the MCP wire changed: when the packet is ready, the server ships the compact deterministic spec instead of the cached scene payload. Queued states still return status-only packet metadata.

## Files Changed

- `server/src/index.ts`
- `web/src/App.tsx`
- `packages/core/src/voxel/cityWorldGeneratedDistrict.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-generated-draft-scene-packet.mjs`
- `scripts/verify-emulator-perf.mjs`
- `artifacts/council/CODEX_RESULT_076T.md`

No emulator source files were changed. Confirmed `web/src/emulator/*` remains a verbatim `_meta` host path; `scripts/verify-emulator-perf.mjs` now reports `generatedDraftSpecChars` while preserving `generatedDraftSceneChars`.

## Gate Tails

`pnpm typecheck:starter`

```text
$ pnpm build:core && pnpm build:geo && tsc -p server/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
$ pnpm --dir packages/geo build
$ tsc -p tsconfig.json
```

`pnpm test:core`

```text
Test Files 22 passed (22)
Tests 134 passed (134)
city-world-generated-district.test.ts (23 tests)
compiles a JSON-round-tripped deterministic spec to the identical scene
leaves curated Riverside compile output byte-identical while generated attachments are active
```

`node scripts/verify-generated-draft-scene-packet.mjs`

```text
"ok": true
"update": "postalpha-0.76t-ship-params-not-scenes"
"maxGeneratedDraftSpecChars": 5816
"maxGeneratedDraftWireMetaChars": 6782
"representativeCompileMs": 27.726
"blockerCount": 0
```

`node scripts/verify-tool-result-shape.mjs`

```text
"ok": true
"update": "postalpha-0.32e-runtime-scene-packet-memory-adapter"
"blockerCount": 0
```

`node scripts/verify-mcp-flow.mjs`

```text
"ok": true
"mcpUrl": "http://127.0.0.1:8798/mcp"
"lookupPlaceCount": 5
"cachedLookup": true
"shellCountyTier": "L1_COUNTY_SHELL"
"hostedClawdStatus": "planned_beta"
```

Run mode: self-hosted local server on port 8798 with `GEO_DATA_ADAPTER=mock`, then stopped.

## Risks

- Compile cost is above the expected 5-15ms band in Node measurements: `butler-al` measured 27.726ms. The widget memoizes per spec, so this is a one-time cost per tool result, not per render.
- Full `_meta` is not under 10KB while `coverageShellScene` remains attached. This slice removed the generated draft scene payload; a separate shell-payload slice is needed if total `_meta` must also fall under 10KB.
- Older non-required scripts still contain `generatedDraftScene` language, but they were outside the hard fence. The required packet verifier and emulator perf accounting were retargeted.
