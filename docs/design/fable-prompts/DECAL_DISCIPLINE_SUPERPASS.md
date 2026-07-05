# Fable Super-Move — "Decal Discipline" Pass (0.55E)

> One elite engineering pass. After it, every building surface (facade, base,
> roof) has exactly ONE owner per visual job, and the milky wash that survives
> the 0.54E grade fix is gone at the source. This is the systemic version of
> the 0.53E item-C roof fix, applied to the whole draw stack.

## ⚡ COMPLETION PLAN

### The disease (proven, not vibes)

0.53E item C root-caused Eastvale Core's flat read: FIVE legacy civic
functions each floated a pale roof decal over the same plane and averaged
into fog (`hasHeroTieredCrown` now gates them). The same stacking exists on
WALLS and BASES across families — e.g. the civic front wall receives bars
from `drawObjectKitCivicLandmarkRead` (entry bays), `drawCivicDetails`
(columns + entry block + band), `drawAuthoredCivicLandmarkMass` (facade
beats), `drawPublicCivicLandmarkSilhouette` (pilasters), and
`drawEastvaleCoreLandmarkDetails` (wing bays + entry glass) — five
generations of pale translucent bars on one surface. Commerce and residential
have parallel stacks (authorship base + rhythm + public silhouette + kit read
+ details). Each layer is individually subtle; the SUM is the wash.

### The fix (surface ownership, not deletion)

For each object family, assign ONE owner per surface zone:
- **facade rhythm** (bars/windows/piers on the front walls)
- **base/entry** (pads, aprons, stoops, plinths)
- **roof decals** (already solved for the hero; extend the principle)

The newest, most-authored generation owns the zone; older generations either
stand down for that family (gate, like `hasHeroTieredCrown`) or get their
alpha budget folded into the owner. Do NOT delete functions wholesale — the
~95-draw-fn variety system is an invariant; retire LAYERS inside functions,
keep silhouettes and unique reads.

### Execution order (bisectable, commit per family)

1. **Audit table first** (30 min): for civic_landmark, commerce_strip,
   residential_kit, service_gym — list every function drawing into each zone,
   with fills/alphas. The call graph runs through `drawBuilding` →
   `drawBuildingShell`/sprite path → `draw*Details` →
   `drawObjectAuthorshipDetails` → `drawPublicRiversideObjectAuthorshipPass`
   → object-kit reads. Write the table into the BUILD_LOG entry.
2. **Civic walls/base** (the worst case, hero visible): pick owners, gate the
   rest. Screenshot-diff Eastvale Core.
3. **Commerce strip** (Plaza Row): same.
4. **Residential** (lightest — 0.53E already consolidated much): same.
5. **Verify once**: typecheck + build:web + test:core + product-loop +
   rc-split + mcp-flow; measure near-blown % and per-clip pixel contrast
   before/after; screenshots desktop 1280x720 + mobile 390x844 (light+dark).

### Measurement (no vibes)

- Near-blown pixel % on the default desktop frame (script: System.Drawing
  sampler used in 0.54E — R>232,G>226,B>205; sampled every 3rd px).
- Clip diffs on Eastvale Core / Plaza Row / homes band before vs after.
- All existing diagnostics + verifiers must hold (they are compiler-side, so
  renderer consolidation cannot silently game them).

### Hard invariants (unchanged from 0.53E + the prod SLA)

2D Pixi vector canvas; no props/deps/3D; map-first; session-only honesty;
palette registry + effective-color diagnostics + ~95 draw fns + 0.52E contact
grammar survive; Anaheim/Ontario hidden; shells honest; zero overflow/console
errors; NO deploy, NO merge — human gate only. The 0.52E terrain plinth
massing is contact grammar, NOT decal fog — leave it alone.

### Ops (hard-won, do not rediscover)

- `pnpm dev` inlines the bundle ONCE at process start — every visual
  iteration = `build:web` + server RESTART + reload.
- pnpm via corepack shim `C:\tmp\pnpmshim`; browse.exe at
  `~/.claude/skills/browse/dist/browse.exe`; dark = `data-theme="dark"` on
  documentElement; :8787/preview.
- Primary audience is the ChatGPT app: weight 390x844 reads; keep
  verify-submission + verify-mcp-flow green.

### After 0.55E (queued Fable-class passes, hardest-first)

- **0.56E Label/marker layout** — lift place labels off landmark crowns
  (collision-aware anchor: try above-crown, then side-step). Unblocks the
  0.53E mobile plateau.
- **0.57E Generated-district parity** — the parametric "Turn to a new
  district" scenes must hit the same visual bar + diagnostics as curated
  Eastvale; that is what makes Atlas a SERVICE engine, not a hand-tuned demo.

---

## 0.57E Generated-District Parity — scouting findings (2026-07-05)

Sprite-footprint fit landed renderer-side (`drawSpriteBuilding`: sprites now
scale to the building footprint, clamped 0.72–1.45; curated Plaza Row finally
fills its authored 6.1-tile lot). The REMAINING parity gaps are all
**compiler-side in `cityWorldParametricGenerator.ts`** (evidence:
`artifacts/0.57e-parity/generated-district-*.png`, deterministic layout):

1. **"Commercial row" toy-box massing** — generator authors low tan slabs with
   small saturated blocks on top that read as toys, not storefronts. Route
   them through the same commerce_strip family grammar Eastvale uses
   (storefront base + parapet + kit read), not bespoke stacked masses.
2. **Empty lot rings** — foundation pads/selection ovals with NO building
   (top-left cluster). Either place a building or don't emit the pad.
3. **Density** — bottom half of the district is empty field; Eastvale's
   residential fabric fills its frame. Raise parcel fill or shrink the tile
   window.
4. **Red-roof misregistration** — the center building's roof plane bleeds past
   its eaves (authored roof polygon vs footprint mismatch).
5. Apartment court window columns float off wall edges at some widths.

Acceptance: a generated district passes the same eyeball bar + diagnostics as
curated Eastvale; the honesty banner stays; verifiers stay green. This is a
core-package pass (compiler + tests), sized like 0.53E.
