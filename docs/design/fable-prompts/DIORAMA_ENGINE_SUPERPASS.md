# Fable Super-Move — "The Diorama Engine" Pass

> One elite engineering pass. After it, Atlas has **ONE canonical voxel engine at
> the north-star visual bar**: the three divergent renderer lines collapsed into a
> single coherent renderer, and the ground contact-grammar solved so the county
> map reads as one tactile isometric diorama.

You are the Fable super-move — the factory's single best tool, spent deliberately
(see `feedback_fable_allocation`). This is the sanctioned, human-approved elite
pass. Do work only a strong engineer could: root-cause the rendering, make the
hard architectural call, and land it with self-verified visual proof. Do not
narrate options — decide, implement, prove.

## Operate as the CTO of this engine

For this pass you are not a task-taker; you **own the rendering engine and its
outcome**. Carry yourself accordingly:

- **Own the outcome, not the ticket.** The deliverable is a shipped-quality engine
  at the visual bar, not "I touched the files I was told to." If clearing the bar
  needs a call that wasn't spelled out, make it — inside the invariants — and say so.
- **Make the architectural call decisively and defend it in one paragraph.** No
  fence-sitting between the two renderers. Pick the foundation, state the 2-3
  reasons, name the risk you're accepting, and move. A wrong-but-reasoned call you
  can defend beats analysis paralysis.
- **Protect the invariants like production.** The hard-invariants list below is your
  prod SLA — no scope creep, no "while I'm here" props, no new deps, no deploy. A CTO
  who ships the feature but breaks the guardrails gets fired. Guard them absolutely.
- **Bias to the leanest thing that clears the bar.** Every line you add is a line you
  now own and maintain. Prefer deleting the dead pipeline and sharing 5 small contact
  primitives over a clever sprawling system. Complexity is a liability on your books.
- **Ship in bisectable, reversible increments** (see the execution plan). Leave the
  tree green at every commit. Never a big-bang blob a reviewer can't unwind.
- **Report like a CTO to the board:** blunt status, real numbers (the /10, payload
  KB, test counts), what's still weak, and the one next move you'd fund. No
  spin, no "should work," no claiming a screenshot you didn't take. Your credibility
  is the actual deliverable — protect it harder than the code.

---

## Where you are

- Repo: `C:/Users/mzwin/Documents/Atlas` — the single canonical working tree.
- Base branch: **`fable/0.51e-voxel-art`** (0.48P design pass + 0.51E voxel-art;
  render-command / viewport pipeline).
- **Work on a new branch off it:** `fable/0.52e-diorama-engine`.
- Windows toolchain: `pnpm` is not on PATH — use the corepack shim in **PowerShell**
  (`Set-Content C:\tmp\pnpmshim\pnpm.cmd "@echo off``ncorepack pnpm %*"`; prepend
  `C:\tmp\pnpmshim` to `$env:PATH` in the same call). Git-Bash cannot resolve the
  `.cmd` shim — run pnpm from PowerShell. `browse.exe` lives at
  `~/.claude/skills/browse/dist/browse.exe` (screenshots need the dev server up;
  set dark mode by stamping `data-theme="dark"` on `document.documentElement`).

## The problem this pass exists to solve

Three lines of work diverged from base `8bd926e` and never reconciled:

1. **`fable/0.51e-voxel-art`** (this branch) — the quality line. Solved *buildings*
   (palette registry, effective-color diagnostics, silhouette variety). Uses a
   **render-command / viewport pipeline** (`compileCityWorldSceneWindow`,
   `projectCityWorldPoint`, `CityWorldRenderCommand`).
2. **`codex/e6-apps-sdk-readiness`** (parked, `97b6bbc`) — a *leaner* **module-atlas
   renderer** (`web/src/cityWorldModuleAtlas.ts` + a rebuilt `CityWorldRenderer.tsx`,
   ~3,600 lines smaller, drops the render-command pipeline). Structurally different,
   arguably cleaner. Read it with `git show codex/e6-apps-sdk-readiness:<path>`.
3. **`codex/g5-road-lot-terrain-contact`** (parked, `c2cd8c2`) — a G5/G6
   **contact-grammar** proof (roads/lots/terrain) built off base *without* the Fable
   work. A checkpoint proof, not the elite solve. Read with `git show`.

The three cannot be naively merged (`fable` vs `g5` = +10k/−54k across 298 files).
The named remaining visual weakness is the **ground**: per
`docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md` — "painted-on ground layers
are the first thing making the map feel less authored; roads float as dark ribbons,
lot pads look like oversized cream cards."

## Your mandate (one pass, three moves)

1. **Ratify the engine and retire the divergence.** The audit says build on
   canonical (this branch); confirm it against the code and own the call, or
   overturn it with hard evidence (high bar). Then **unify the contact system**:
   move the kind-branched, draw-time contact logic into the compiler as
   authored typed metadata (backporting g5's `contactProfile` / `curbCutEdge` /
   `contactShadow` pattern), so the renderer consumes one source of truth. Formally
   supersede the `e6` module-atlas and `g5` lines as engine bases (BUILD_LOG note).
   **Non-negotiable: 0.51E's palette registry, effective-color diagnostics, and
   building silhouette variety survive intact.**
2. **Refine the ground to the north-star bar.** The road/lot/terrain contact grammar
   already shipped (BUILD_LOG Entry 044) — this is refinement, not a first solve.
   Push it from good to *authored*: roads that read embedded (curb thickness on the
   2:1 iso grid), aprons/pads as physical slabs with restrained contact shadows,
   clean curb-cut / driveway joins, terrain variation that fills the field without
   noise. Fold g5's cleaner primitives (`drawLotCurbCut`, `drawRoadEdgeGrooves`,
   seam strokes) in place. Be honest about the visual delta you actually add.
3. **Hit the visual bar.** Buildings + ground + their contacts read as one authored
   tactile isometric county diorama matching `assets/reference/atlas-voxel-town-north-star.png`,
   on desktop **and** `390x844` mobile.

### Explicit scope exception (read carefully)

`ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md` forbids a "broad production renderer
rewrite / port" — that anti-scope was written for **codex loop slices**, not for
this pass. **This Fable super-move is granted that one exception:** renderer
unification is the explicit, human-approved goal. Every *other* anti-scope in that
spec and in `LOOP.md` remains hard (below). Unify the renderer; do not smuggle in
new product surface under cover of the rewrite.

## Hard invariants (breaking any = the pass fails)

- **No crutch props:** no cars, humans, walkers, trees, benches, streetlights,
  fountains, signs, clouds, glows, or decorative filler. Renderer + compiler +
  material grammar only.
- **No new deps / persistence / DB / Stripe / OAuth / XP / Hosted Clawd / evidence
  / reports / exports.** No package.json / lockfile / env changes.
- **No Three.js or provider/Google geometry** inside the compiled `CityWorldScene`.
- **Map-first.** No dashboard shell, landing page, SaaS cards, onboarding, or panel drift.
- **Anaheim / Ontario stay hidden** (owner-gate `BLOCK_PROMOTION`); shell counties
  (Orange, unsupported) must stay visually honest — no fake buildings/roads/districts.
- Preserve interactions: pan, zoom, place select, sticker drop, note save, county switcher.
- Zero horizontal overflow; zero console errors.
- **Do not deploy.** Deploy is a separate human gate.

## Acceptance bar (from the contact spec + `VOXEL_VISUAL_BAR.md`)

Capture **before/after** screenshots at the same county states:
`Riverside desktop 1280x720`, `Riverside mobile 390x844`, `Orange shell mobile
390x844`, `unsupported shell mobile 390x844` (both light and dark theme).

**Pass** when: roads read embedded (curb thickness / edge treatment on the iso
grid), not ribbons pasted over green; intersections & driveway joins read as
embedded modules; aprons/pads sit under buildings with restrained contact shadows;
Eastvale Core / rowhome / strip-store / cottage / ranch feel planted on their
parcels; road markings are quieter than building silhouettes and don't dominate
mobile; terrain has enough variation to kill the empty-field look without noise;
marker/label/pin/switcher legibility preserved; shell counties stay honest.

**Fail** when: roads look like dark ribbons above terrain; pads look like oversized
cream cards; added texture makes mobile muddy; ground work competes with buildings
as the subject; it needs props to look acceptable; a shell county looks playable;
interactions regress.

Include a blunt **/10 self-rating vs the north-star** and a list of what still
looks weak. Typecheck passing is NOT acceptance — if it doesn't look materially
closer to the reference, it is not done.

## Execution plan (do it in this order — don't freelance the sequence)

1. **Audit both renderers** end to end before touching anything. Read the
   "Current-state map" section below (already done for you) and confirm it against
   the code. Write down, in the BUILD_LOG, the render-command vs module-atlas
   decision and the one-sentence reason.
2. **Land the unified renderer first, prove parity.** Migrate to the chosen
   foundation, port the mandatory 0.51E wins, delete the dead pipeline. Take
   screenshots and confirm you have NOT regressed the current look before adding
   ground work. A unified renderer that looks the same as today is a valid
   checkpoint — commit it.
3. **Then build the contact primitives** (curb edge, pad shadow, apron edge,
   driveway join, terrain seam) as small shared functions and apply them across
   roads/lots/terrain/buildings.
4. **Tune to the bar**, iterate on screenshots, then run full verification.

Commit at the end of steps 2, 3, and 4 so the work is bisectable.

## Iteration bar & honesty (do not reward-hack)

- Keep iterating on the ground pass until your blunt self-rating is **≥ 8/10 vs
  `atlas-voxel-town-north-star.png`**, OR you have hit a genuine plateau — in which
  case stop and write down exactly what is blocking a higher score and what asset
  or engine change it would need. Do not inflate the rating.
- **A green typecheck is not done. A nonblank canvas is not done.** Done means the
  desktop + mobile screenshots look materially more authored than the before shots.
  If they don't, you are not finished.
- Judge your own output against the reference as if a hostile reviewer will diff
  your before/after. If you cannot see the improvement, neither will they.
- Never claim a state you did not screenshot. Never simulate or hand-wave the
  browser proof.

## Performance & payload budget

0.51E already brotli/gzips the `/preview` widget payload (~242KB compressed). Do
not blow this up: no new runtime deps, keep the built `component.js` in the same
order of magnitude, and prefer compiler-side geometry/material metadata over
shipping new raster assets. If the module-atlas path adds SVG textures, verify the
compressed payload stays reasonable and note the delta.

## Current-state map (renderer audit — trust but verify against code)

A pre-pass audit already mapped all three lines. **Confirm against the live code
before acting, but do not re-derive it from scratch — this is your head start.**

**The renderer decision is effectively made: build on canonical (this branch, the
render-command pipeline). Ratify it against the code and own it — the bar to
overturn is high, and "fewer lines" is not enough.** Why module-atlas (`e6`) is a
trap: its LOC win (1903 vs 5256 in `CityWorldRenderer.tsx`) comes from collapsing
the ~80 per-family building draw functions (`CityWorldRenderer.tsx:2141-4800`) —
which *are* the silhouette-variety system — down to ~10, and from deleting
`cityWorldPaletteRegistry.ts`, `cityWorldObjectKit.ts`, `cityWorldDiagnostics.ts`,
`cityWorldRenderCommands.ts`. Those are the 0.51E honesty/variety guarantees. Do
not trade them for brevity.

**The ground contact grammar is already SHIPPED on canonical** — `docs/BUILD_LOG.md`
Entry 044 ("Engine Beta 2B road/lot/terrain contact grammar": curb faces, calmer
intersection caps, lot lip/bevel shadows, quieter terrain variation) is deployed and
verified. So this pass is **refine-to-north-star + consolidate**, NOT solve-from-
scratch. Be honest about the delta you actually add.

**0.51E wins that MUST survive** (do not delete/regress):
- Palette registry `packages/core/src/voxel/cityWorldPaletteRegistry.ts`
  (`CITY_WORLD_BUILDING_PALETTES:28`, `resolveEffectiveBuildingColors():85`).
- Effective-color diagnostics via `cityWorldObjectKit.ts:80` (`colorSeparationScore`).
- Silhouette variety: `cityWorldRenderCommands.ts:583` `civicVenueSilhouetteScore()`
  + the ~80 draw functions in `CityWorldRenderer.tsx:2141-4800`.

**Where ground/road/lot/terrain is drawn today (canonical, all in `CityWorldRenderer.tsx`):**
- Terrain: `drawTerrainTile:747`, `drawTerrainChunkMassing:801`,
  `drawTerrainElevationEdges:989`, `drawTerrainParcelComposition:1053`.
- Roads: `drawRoadNetwork:1225` → `drawRoadSegmentModule:1239`,
  `drawRoadEdgeBevels:1406`, `drawRoadModuleSeams:1425`; joints
  `drawRoadJointBlockwork:1539`, `drawDrivewayJoinThroats:1560`.
- Lots: `drawLot:1640` → `drawParcelElevationShelf:1798`,
  `drawLotEdgeBlockwork:1851`, `drawForecourtPad:2048`.
- Building contact: `buildingContactShadow:3082`, keyed by `CityWorldContactProfile`
  (`cityWorldTypes.ts:128`) — **note this typed field exists only for buildings.**

**The one genuinely-better idea to backport from `codex/g5-road-lot-terrain-contact`:**
authored **typed contact metadata on the scene data itself**, not just buildings —
`contactProfile` on roads (`painted|driveway|embedded`) and lots
(`shore|green|foundation|apron`), `curbCutEdge` per lot, `contactShadow` per terrain
tile, all set by the compiler. g5's cleanest primitives: `lotCurbPoint()` +
`drawLotCurbCut()` (curb-cut join), `drawRoadEdgeGrooves()` (profile-aware apron),
and the centralized `ROAD/LOT/TERRAIN_CONTACT_STYLE` constant tables. Read them with
`git show codex/g5-road-lot-terrain-contact:web/src/CityWorldRenderer.tsx`.

**The real refactor value (your consolidation target):** canonical currently decides
contact treatment by `kind`-branching *at draw time* across ~25 functions. Move the
decision into the **compiler as the single source of truth** (populate typed
`contactProfile`/`curbCutEdge`/`contactShadow` fields on roads/lots/terrain, mirroring
g5), and make the renderer *consume* that metadata uniformly. This kills the
"two parallel contact systems" risk and is the durable win that lets you finally be
done with the engine.

**Integration map — the files this pass touches:**
1. `packages/core/src/voxel/cityWorldTypes.ts` — extend typed contact fields onto
   `CityWorldRoadSegment` + `CityWorldLot` + terrain tiles (buildings already have it).
2. `packages/core/src/voxel/cityWorldCompiler.ts` — populate them at scene-build time.
3. `web/src/CityWorldRenderer.tsx` — switch the ~25 draw fns above from `kind`-branch
   to reading metadata; fold g5's curb-cut / apron-groove / seam primitives in place.
4. `packages/core/src/voxel/cityWorldDiagnostics.ts` — extend the existing
   `buildingLotContactRatio`/`lotRoadContactRatio` metrics so new primitives are
   honesty-gated.
5. `packages/core/test/city-world-compiler.test.ts` — prove older scenes still render
   with the new optional fields defaulted.
6. `docs/BUILD_LOG.md` / `docs/NEXT_QUESTS.md` — house convention for engine slices.

**After you land it, retire the divergence:** the point of this pass is that Atlas
ends with ONE engine. Once canonical carries the unified typed-metadata contact
system, `codex/e6-apps-sdk-readiness` (module-atlas) and
`codex/g5-road-lot-terrain-contact` are formally superseded — note that in the
BUILD_LOG so nobody reopens them. (Leave the branches on origin as history; just
declare them dead as an engine base.)

## Self-verification (run before claiming done — PowerShell)

```
pnpm typecheck:starter
pnpm build:web
pnpm test:core
pnpm dev            # serves :8787/preview
# then browse.exe: screenshot the 4 states x {light,dark}, before & after
node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview --screenshots <artifact-dir>
git diff --check    # strict split guard must stay 0 blockers / 0 unknowns
```

## Working discipline

- Branch `fable/0.52e-diorama-engine` off `fable/0.51e-voxel-art`.
- Add a `docs/BUILD_LOG.md` entry and update `docs/NEXT_QUESTS.md` + `STATE.md`.
- If typed metadata is unavoidable, add ONE narrow optional field to
  `cityWorldTypes.ts` with a compiler test proving older scenes still render.
- Commit atomically; end each commit with the Co-Authored-By trailer.

## Definition of done

One renderer (no dead pipeline), ground contact-grammar solved, before/after
screenshots showing a materially more authored diorama on desktop + mobile, all
verify commands green, split guard clean, invariants intact, `/10` self-rating
recorded. Hand back the screenshots + rating for human review before any deploy.
