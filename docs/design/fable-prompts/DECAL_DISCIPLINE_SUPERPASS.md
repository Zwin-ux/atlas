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
