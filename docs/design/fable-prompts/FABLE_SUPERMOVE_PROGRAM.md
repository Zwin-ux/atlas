# Fable Super-Move Program — the engine strides

Owner: acting CTO. Cut 2026-07-05, post-ship. This is the sequenced program of
Fable super-moves that takes Atlas from "shipped, engine ~7/10" to the north-star
and then to the product thesis (voxel the US). Each entry is a genuine elite
hard-SWE pass — the rare Fable model spent where quality compounds
(`feedback_fable_allocation`), never on ops or decision-blocked work.

## Operating rules for every pass

- **Ship is already done.** Atlas is live on Railway (G1–G5 + G7 green). Every pass
  below is a **post-launch update**, not a blocker. Never let engine perfectionism
  hold the store submission.
- **One pass = one branch off `main`**, e.g. `fable/0.5xe-<name>`. Land bisectable,
  screenshot-proven, then merge to `main` and redeploy as an update.
- **⚠️ One agent per working tree.** The 0.52E ship hit a concurrent-agent
  `git reset` that nearly lost work and deployed stale code. Run each Fable pass in
  its OWN `git worktree` or clone. Never two agents on one directory.
- **Invariants are the prod SLA (never relax):** 2D Pixi vector canvas — no
  3D/PBR/meshes/normal-maps/LOD-geometry/new deps; no crutch props (cars, humans,
  trees, benches, glows, filler); map-first; session-only honesty; provider
  boundary; palette-registry cohesion + effective-color diagnostics survive;
  Anaheim/Ontario hidden; shells honest; zero overflow / console errors; no deploy
  without a human gate.
- **Honesty bar:** blunt /10 vs `assets/reference/atlas-voxel-town-north-star.png`,
  desktop + 390×844 mobile before/after, or a named plateau. Green typecheck is
  not done.

## The arc (why this order)

```
PERFECT THE HERO CELL                    SCALE THE CELL (product thesis)
────────────────────────────            ──────────────────────────────────
0.53E Hero Silhouette   ~7 → 8      →    0.56E The Scaling Engine   (any county @ quality)
0.54E Golden Hour       8 → 8.5    →    0.57E Scale Continuity     (parcel→region diorama)
0.55E Living Density    8.5 → 9
```

First make one county cell undeniably beautiful (53–55), then make that quality
**reproducible for any county automatically** (56) and **coherent across zoom
scales** (57 — the county→state→country→Earth path). 53–55 are taste/fidelity
moves; 56–57 are the strategic unlock that turns one map into the platform.

---

## 0.53E — Hero Silhouette  ✅ SPEC WRITTEN · NEXT

- **Prompt:** `docs/design/fable-prompts/BUILDING_FIDELITY_SUPERPASS.md` (full).
- **Branch:** `fable/0.53e-hero-silhouette` (created, off deployed HEAD).
- **Goal:** buildings read as authored architecture, not boxes — silhouette
  variety (parapets, entry bays, setback tiers, roof forms), material legibility
  (stucco/glass/tile/metal separate at a glance), and a finished light model on
  roofs + hero glass.
- **Hard problem:** enrich the ~95-fn building draw layer via the typed grammar
  with SHARED primitives, without collapsing the variety/palette guarantees.
- **Bar:** ~7 → **≥8**. Eastvale Core, Plaza Row, Gym, residential kit each read
  distinct on desktop + mobile.

## 0.54E — Golden Hour (light & grade mastery)

- **Goal:** the whole-canvas golden-hour grade + unified light model become the
  thing that makes Atlas look *photographed*, not flat. This is the contrast/mood
  ceiling my own 0.52E plateau and the external critique both named.
- **Why now:** after 0.53E gives buildings form, the grade is what sells the
  diorama feel — or washes it. It gates the jump from good to premium.
- **Hard problem (Fable-worthy):** color science in one fragment shader
  (`GRADE_FRAGMENT_SHADER`) + per-face sun consistency (`sunlitColor`, cast
  shadows) tuned together so directional shading survives the post pass, shadows
  read directional, and the muted-SoCal palette stays calm (no cartoon bloom, no
  AI-slop saturation — see `feedback_design_taste`). Optional: a single authored
  time-of-day constant (midday vs golden hour) driving light + grade coherently.
- **Scope:** `web/src/CityWorldRenderer.tsx` grade shader + `sunlitColor` +
  `CAST_SHADOW_*` + shell-lighting. No new deps; compiler untouched.
- **Gate:** **design sign-off** (this touches the 0.48P design decision). Fable
  proposes, human ratifies the look.
- **Bar:** map reads like a golden-hour diorama photo; **≥8.5**; mobile not muddy.

## 0.55E — Living Density (kill the empty field, no props)

- **Goal:** eliminate the "too much empty green plane" — the #1 item in
  `VOXEL_VISUAL_BAR.md` — so the county reads packed and lived-in, using ONLY
  buildings + ground + material grammar (no props, ever).
- **Why now:** with buildings (53) and light (54) at bar, emptiness is the last
  thing between "nice map" and "alive town."
- **Hard problem (Fable-worthy):** authored density without noise or dishonesty —
  more parcels/back-lot fabric, block interiors, rooftop equipment/detail,
  hedge/fence/yard as terrain-material (not prop objects), denser road fabric —
  tuned to stay legible at 390×844 and to never fake playable detail in shells.
  This is a compiler + renderer pass: the parcel/road/terrain layout grammar
  gets denser and the draw layer supports it.
- **Scope:** `cityWorldCompiler.ts` (denser authored layout), `CityWorldRenderer`
  (fabric/rooftop/material primitives), diagnostics (a density-vs-honesty metric).
- **Bar:** first-3-second read = "a real town"; **≥9** on the hero cell; shells
  stay honest; mobile stays clean.

## 0.56E — The Scaling Engine (any county at hero quality)  ★ strategic unlock

- **Goal:** `generateParametricCityWorldScene` produces districts **visually
  indistinguishable in quality from hand-authored Eastvale** — so any curated
  county pack becomes a beautiful voxel city automatically. This is the product
  thesis: voxel the US, not voxel one town.
- **Why now:** once the hero cell is at ≥9 (53–55), the highest-value stride is
  making that quality *reproducible*. Today Eastvale is hand-authored; the
  parametric path exists but is plainer. This turns a demo into a platform.
- **Hard problem (Fable-worthy):** backport the hand-authored silhouette /
  material / contact / density grammar (0.51E–0.55E) into the parametric
  generator as procedural authoring — zone→parcel→building→material selection
  that hits the same bar from a compact provider-free spec, deterministically,
  without provider→geometry leakage.
- **Scope:** `cityWorldParametricGenerator.ts` (the generation seam) + shared
  grammar it calls; `verify-parametric-generator.mjs` extended to gate quality.
- **Invariant care:** provider boundary is CRITICAL here — generated geometry
  comes from the curated spec, never live provider data.
- **Bar:** a generated California district screenshots at hero-cell quality;
  side-by-side with Eastvale, a hostile reviewer can't call which is authored.

## 0.57E — Scale Continuity (parcel → district → county → region)

- **Goal:** zoom and pan across scales stay one coherent diorama — the concrete
  step toward the county→state→country→Earth north-star vision.
- **Why now:** with quality reproducible (56), the frontier is *scale*: showing
  more than one district without the frame turning to mush or the perf dying.
- **Hard problem (Fable-worthy):** view-dependent authoring in the existing
  render-command / scene-window streaming pipeline (`compileCityWorldSceneWindow`,
  layer budgets) — far zoom shows authored massing silhouettes, near zoom shows
  full detail, transitions are smooth, payload/perf budgets hold. This is
  detail-management done in 2D vector space (not 3D LOD), which is the honest hard
  version of the critique's "no LOD" point.
- **Scope:** scene-window compiler + render-command budgets + a detail-tier field.
- **Bar:** pan/zoom from a single parcel out to a multi-district region reads as a
  continuous tactile diorama; mobile holds; no console errors; payload in budget.

---

## Parallel (not Fable — Codex/CTO track)

Keep these off the Fable budget; they run in parallel via Codex + CTO proofs:
- **Store submission** (G6 sign-off + directory form) — the only thing between
  "live" and "listed."
- **Scout/Campaign result-surface depth** — product polish on the in-widget panels.
- **Icon + brand** — final app icon to replace the placeholder.

## Scheduling

Run passes strictly in order (each depends on the prior's bar). Promote each
one-page spec above into a full super-prompt (CTO charter + audit head-start with
file:line + self-verify recipe) the way `DIORAMA_ENGINE_SUPERPASS.md` and
`BUILDING_FIDELITY_SUPERPASS.md` were — when it becomes that pass's turn. Next up:
**0.53E is fully specced and branched — run it.**
