# Work Packet 0.76-P — County Parameter Model Spine

Implementation driver on the Atlas voxel engine (read
`docs/codex/CODEX_DRIVER_ADAPTER.md` boot sequence + `docs/0.76_BACKEND_ARCHITECTURE.md`
first — this packet builds section 3's layered parameter model). Implement
completely, verify what you can, leave the tree UNCOMMITTED. Do not commit, do
not push. **Prerequisite: 0.76-1 (regional palettes) landed and reviewer-verified.**

**North star:** NS-6. This is the **substrate** — levers 2/3/4 (landmarks,
massing, terrain) plug into it and become region-aware instead of bucket-flat.

## Repo
- Canonical: `C:\Users\mzwin\Documents\Atlas`, branch
  `codex/integrate-hosted-clawd-fable-058e`.
- Selection + generators: `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`.
- Spec assembly: `packages/core/src/voxel/cityWorldGeneratedDistrict.ts`
  (`createDeterministicGeneratedDistrictSpec` composes heightGrid/zones/roadSeeds).
- County input: `packages/core/src/world/usCountyIndex.ts` +
  `world/types.ts` (`NationalCountyIndexEntry` = geoid, stateCode, name,
  countySlug, centroid{lat,lng}). `US_STATE_LABEL_BY_CODE` exists there.
- Regional palettes (from 0.76-1): `cityWorldRegionalPalettes.ts` /
  `REGIONAL_PALETTES` — this packet makes them the palette layer of the model.
- HARD CONSTRAINTS: honest input only (geoid/stateCode/name/centroid + seed) —
  **no provider geometry, no new deps, no persistence, no new MCP tools**. Do
  NOT touch `riversideDemoScene.ts` / curated props. No scene compiler contract
  changes to the *renderer* seam (compiler may author richer grammar; renderer
  keeps consuming compiled output only — 0.73F facade contract).

## Problem
Generated identity today = `archetype bucket (6) + seed jitter`. Two counties
in the same archetype are byte-similar regardless of region, climate, or name.
There is no model — just six hardcoded functions. NS-6 needs 3,222
distinct-yet-coherent identities derived deterministically from census identity.

## Goal
Introduce a **layered parameter model** the generator interprets:

```
CountyGenerationParameters = {
  archetype:  GeneratedDistrictArchetype           // existing 6, keep
  region:     CensusDivision                        // NEW — stateCode → division
  climate:    { latitudeBand, aridity }             // NEW — from centroid + region
  nameSignal: NameSignal[]                           // NEW — lexical, from county name
  palette:    RegionalPalette                        // 0.76-1, now model-driven
  seed:       number
}
resolveCountyParameters(county, seed) -> CountyGenerationParameters
```

Config-driven (section 4 of the architecture doc): profiles are typed **data
tables**, not control flow — `ARCHETYPE_PROFILES`, `REGION_PROFILES` (keyed by
the 9 Census divisions, with a static honest `STATE_TO_DIVISION` map), and
`NAME_SIGNAL_TOKENS` (River/Port/Lake/Mesa/Springs/Fort/Falls/Harbor/Valley…).

## Approach — TWO PHASES, land both but keep them reviewable separately

**Phase A — spine plumbing, behavior-preserving.**
Introduce the `CountyGenerationParameters` type + `resolveCountyParameters` and
route `createDeterministicGeneratedDistrictSpec` THROUGH it, but have the
profiles reproduce today's per-archetype output (region/climate/name resolved
but not yet modulating geometry beyond the 0.76-1 palette). Goal: the parity
verifier + `verify-archetype-identity-sweep.mjs` results are **unchanged** vs
post-0.76-1. This proves the refactor is safe before any visual change.

**Phase B — activate the layers, region-true.**

> **Required fix surfaced by 0.76-1 review (do this in Phase B):** the current
> `selectGeneratedDistrictArchetype` checks the desert rule
> `longitude < -108 && latitude < 38` FIRST, and its box is so broad it swallows
> coastal Southern California — `orange-ca` (centroid 33.68, -117.78) resolves
> `desert_basin`, and **28 of 58 California counties (48%) misroute to desert**,
> including San Diego/LA/Orange/Ventura/Santa Barbara. Fix archetype resolution
> so state intent + coastal proximity win over the coarse aridity box (a real
> coastal county like `bay-fl` already resolves correctly — the bug is
> specifically the desert box overriding coastal CA). Add a regression test:
> `orange-ca` and other coastal-CA counties must resolve `coastal_grid`, and the
> CA→desert count must drop to only genuinely arid inland CA counties.

Let region/climate/name modulate the parameters within a bounded envelope:
- region → palette bias, roof/facade vernacular weights, vegetation
- climate: latitudeBand → roof pitch / snow tint / vegetation; aridity →
  ground tone, vegetation density
- nameSignal → targeted features (Lake/Port → water edge; Mesa → dry plateau;
  Falls → relief) — honest, from the county's own name
Envelope constraints (section 6): clamp incoherent combos (aridity suppressed
near coast; snow-roof gated by latitudeBand). Everything seed-threaded and
deterministic — no `Date.now`/`Math.random`.

## Gates — design against these explicitly
1. **Determinism (NEW assertion):** `resolveCountyParameters(county, seed)` is a
   pure function — add a test asserting identical output for identical input
   across repeated calls, for a sample spanning all divisions.
2. **Phase-A no-regression:** parity verifier + sweep produce the same tails as
   post-0.76-1 (palette distinctness stays green, composition/contact/roof
   unchanged). Report the before/after equality explicitly.
3. **Phase-B identity lift:** the sweep's distinctness should *improve or hold*
   (worst-pair Jaccard ≤ its post-0.76-1 value); add a **within-archetype
   diversity** assertion — two counties of the same archetype but different
   region/climate/name resolve measurably different parameters (kills
   bucket+noise). This gate must exist and pass.
4. **Graphics ≤ 1,600 worst-window** (reviewer-run): Phase B adds no geometry by
   itself (it modulates existing params) — state that expectation; if any layer
   adds massing, cost it.
5. **Envelope coherence (NEW):** add a test that no sampled county produces a
   forbidden combo (e.g. coastal_grid with high aridity, subtropical snow roof).
6. `pnpm test:core` — add the determinism, diversity, and envelope tests; never
   loosen an assertion.

## Verification you CAN run (do it)
- `pnpm typecheck:starter`, `pnpm test:core`
- `node scripts/verify-generated-district-parity.mjs`
- `node scripts/verify-archetype-identity-sweep.mjs` (report worst-pair Jaccard
  for Phase A and Phase B separately)

## Verification you CANNOT run (reviewer-run — list them)
- `pnpm build:web`, `verify-generated-district-widget.mjs`,
  `verify-widget-performance.mjs`, browser/screenshot verifiers. Reviewer
  screenshots same-archetype counties from different regions and judges that
  they now read distinct.

## Deliverable
- Implementation, uncommitted. Keep Phase A and Phase B as clearly separated
  changes in the result note (ideally reviewable independently).
- `artifacts/0.76-P-parameter-spine/CODEX_RESULT.md`: the `CountyGenerationParameters`
  contract, `STATE_TO_DIVISION` + `REGION_PROFILES` + `NAME_SIGNAL_TOKENS` as
  implemented, Phase-A equality proof, Phase-B distinctness + within-archetype
  diversity numbers, envelope constraints, files touched, CAN-run verify
  evidence, reviewer-run list, curated-Riverside byte-identical confirmation,
  known risks, honest NS-6 before/after read.
- Update `docs/BUILD_LOG.md`, `docs/NEXT_QUESTS.md`, and `docs/DECISIONS.md`
  (the shift to a config-driven parameter model is a durable architecture
  choice). Promote 0.76-2 (now region-aware landmarks) to READY.
