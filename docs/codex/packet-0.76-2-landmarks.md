# Work Packet 0.76-2 — Region-True Landmarks

Implementation driver on the Atlas voxel engine (read
`docs/codex/CODEX_DRIVER_ADAPTER.md` boot sequence first). Implement
completely, verify what you can, leave the working tree UNCOMMITTED. Do not
commit. Do not push. **Prerequisite: 0.76-P (parameter spine) is committed
(HEAD `2e2e521`) and reviewer-verified. Build on the spine.**

**North star:** NS-6. **Lever 3 of 4.**

## Input from the spine (0.76-P)
Landmark selection MUST read the `CountyGenerationParameters` produced by
`resolveCountyParameters` (`packages/core/src/voxel/cityWorldCountyParameters.ts`),
not re-derive from the archetype alone. Key the landmark off:
- `archetype` — the primary signature (table below).
- `nameSignal` — a cheap, honest amplifier: `port`/`harbor` strengthens a
  working-waterfront landmark, `lake`/`bay`/`beach` favors the water landmark,
  `mount`/`mountain` the ridge lodge, `mesa` the desert tower, `falls`/`river`
  the dock. Where a name signal is present, prefer its landmark within the
  archetype's family.
- `regionProfile` / `climate` — may bias landmark massing (e.g. steeper lodge
  roof in high-latitude/snow-allowed regions) but stay inside the envelope.
Keep it deterministic and seed-threaded; no renderer seam change.

## Repo
- Canonical: `C:\Users\mzwin\Documents\Atlas`, branch
  `codex/integrate-hosted-clawd-fable-058e`.
- Landmark code: `packages/core/src/voxel/cityWorldParametricGenerator.ts`
  ~L229–245 — today: "one water tower on the highest non-water block corner",
  identical for every archetype. Water-edge props (dock/boat) at ~L849.
- Prop vocabulary (FIXED — do not add kinds): `cityWorldTypes.ts` L364
  `CityWorldPropKind` = tree, bush, bench, streetlight, fountain, sign,
  water_shimmer, dock, boat, water_tower (+ forbidden parked_car, cloud).
- HARD CONSTRAINTS: no new dependencies, no new prop kinds, no Three.js, do NOT
  touch `riversideDemoScene.ts` / curated props, forbidden set stays
  {parked_car, cloud}, `maxPropCommands` 90 stays, no scene compiler contract
  changes, no MCP tool changes.

## Problem
Every generated archetype gets the same water-tower landmark. A coastal town, a
mountain valley, and a prairie town read with the same single silhouette — no
region-true focal point. NS-6 wants each archetype to have a signature landmark
that says where you are.

## Goal
Each archetype resolves a **distinct signature landmark** — a
**landmark building** (massing/roofShape/height, per AGENTS.md "identity
through silhouettes, geometry, massing") on the archetype-appropriate host
cell, optionally accented with EXISTING props — so the focal point reads its
region. No new prop kinds; landmark identity is geometry, not new assets.

## Per-archetype landmark (massing-first; props only from the fixed set)
| Archetype | Landmark building | Host cell | Existing-prop accent |
|---|---|---|---|
| coastal_grid | low pier-hall / long-hipped shed fronting the water | on the water edge | dock + boat (exists) |
| river_town | boathouse / bridge-abutment massing at the bank | water edge | dock + boat |
| desert_basin | tall slab water-tower massing on the mesa | highest block corner | water_tower (keep) |
| mountain_valley | steep-gabled lodge silhouette on the ridge | highest block (ridge) | tree cluster |
| prairie_town | grain-elevator tower (tall narrow slab) in the ag block | tallest ag-district block | water_tower as elevator drum |
| metro_grid | civic tower (existing `roofShape:"tower"`, taller) | civic core | — |

Reuse the civic building's `roofShape: "tower"` / `facadeStyle: "civic"`
vocabulary and height scaling for the tower forms; use hipped/gabled roof
shapes already supported for the low forms. Keep the landmark selected by
default (the existing `selectedPlaceId` → landmark behavior at ~L272–275).

## Gates — design against these explicitly
1. **Landmark-presence per archetype (NEW — you add this):** extend
   `scripts/verify-archetype-identity-sweep.mjs` (or add an assertion to the
   parity verifier) so each archetype resolves its expected signature landmark
   kind/massing, and any two archetypes' landmark silhouettes differ. This gate
   must exist and pass by end of packet.
2. **Graphics ≤ 1,600 worst-window** (`verify-widget-performance.mjs`,
   reviewer-run): a landmark building adds geometry — estimate the per-landmark
   Graphics cost and confirm worst-window stays well under ceiling (current
   844). Report the estimate.
3. **Prop budget:** `maxPropCommands` 90 stays; forbidden set unchanged. Report
   prop count per archetype.
4. Parity: composition ≥0.60, contact ≥0.95, roof safety — run, report tails.
5. `pnpm test:core` — add a deterministic landmark-per-archetype test; never
   loosen an assertion.

## Verification you CAN run (do it)
- `pnpm typecheck:starter`, `pnpm test:core`
- `node scripts/verify-generated-district-parity.mjs`
- `node scripts/verify-archetype-identity-sweep.mjs`

## Verification you CANNOT run (reviewer-run — list them)
- `pnpm build:web`, `verify-generated-district-widget.mjs`,
  `verify-widget-performance.mjs`, all browser/screenshot verifiers. Reviewer
  screenshots one county per archetype and judges the landmark read.

## Deliverable
- Implementation, uncommitted.
- `artifacts/0.76-2-landmarks/CODEX_RESULT.md`: landmark massing per archetype +
  why, host-cell logic, Graphics cost estimate, prop counts, parity tails,
  files touched, CAN-run verify evidence, reviewer-run list, curated-Riverside
  byte-identical confirmation, known risks, honest NS-6 before/after read.
- Update `docs/BUILD_LOG.md`, `docs/NEXT_QUESTS.md` (promote 0.76-3 to READY).
