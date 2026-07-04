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

1. **Unify the renderer.** Judge the module-atlas approach (`e6`) against the
   0.51E render-command / viewport pipeline (this branch). Pick the stronger
   foundation and port the other's wins onto it. **Non-negotiable: 0.51E's palette
   registry, effective-color diagnostics, and building silhouette variety must
   survive.** Output: one renderer, one compiler path
   (`packages/core/src/voxel/cityWorldCompiler.ts`, `web/src/CityWorldRenderer.tsx`)
   — no dead second pipeline left behind.
2. **Solve the ground contact-grammar** per `ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`:
   roads embedded with curb thickness (fit the 2:1 iso grid); sidewalks/aprons/lot
   pads as physical slabs with restrained contact shadows; curb-cut / driveway joins;
   terrain face/material variation that supports the focal area without becoming
   noisy. Re-apply the useful ideas from the `g5` proof onto the unified engine so
   that line isn't wasted — but re-implement to the elite bar, don't graft the
   checkpoint.
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
