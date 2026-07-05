# FABLE LAUNCH — 0.53E Hero Silhouette (finish run)

**Spend your Fable session on THIS.** Everything is prepped so Fable executes, not
sets up. Pure hard SWE, inside invariants (`feedback_fable_allocation`).

## 1. Select the model

Pick **Fable** for the session (not Opus/Sonnet). This finish run is exactly the
hard-SWE super-move Fable is for.

## 2. Set up a clean, isolated worktree (do this first — non-negotiable)

A concurrent process on the main tree killed the dev server repeatedly and once
`git reset` the branch mid-work. Run Fable in its OWN worktree:

```powershell
cd C:\Users\mzwin\Documents\Atlas
git fetch origin
git worktree add ..\atlas-53e-fable fable/0.53e-hero-silhouette
cd ..\atlas-53e-fable
# corepack pnpm shim (pnpm is not on PATH):
if (-not (Test-Path C:\tmp\pnpmshim)) { New-Item -ItemType Directory -Force C:\tmp\pnpmshim }
Set-Content C:\tmp\pnpmshim\pnpm.cmd "@echo off`r`ncorepack pnpm %*"
$env:PATH = "C:\tmp\pnpmshim;$env:PATH"
corepack pnpm install    # worktree needs its own node_modules
```

One agent, one worktree. Do not run a second agent against either checkout.

## 3. The prompt to hand Fable

Point Fable at **`docs/design/fable-prompts/BUILDING_FIDELITY_SUPERPASS.md`** and
say: *"Execute the ⚡ COMPLETION PLAN at the top. The pass is mid-flight — finish
items A(remainder)→E in one batched run, verify once, screenshot desktop +
mobile, land at ≥8 or a named plateau."*

## 4. Exact current state (do NOT redo these)

Branch `fable/0.53e-hero-silhouette` @ `d18374f`. Landed + verified (89 tests):
- ✅ `drawParapetCap` — walled parapet roofs (commerce/civic/lowrise).
- ✅ `drawStorefrontBase` — glazed ground storey + canopy.
- ✅ `drawTieredMassing` — setback tier for tall anchors (occluded on Eastvale
  Core — see plan item C to make it read).
- ✅ item A **partial** — per-home mirror + scale jitter + tint spread
  (`drawSpriteBuilding:~2385`). **Remaining of A:** `drawHomeRoofAccent`
  (ridge/dormer/chimney by hash) + `drawHomeStoop` (front entry pad/path).
- Current honest rating: **~7.5/10**. Target **≥8**.

## 5. Remaining work (from the completion plan — in order)

- **A-finish:** home roof accent + entry stoop (sprite/shell path).
- **B:** roof + material legibility (`drawRoofMaterial:3582`,
  `drawAuthoredRoofProfile:3514`).
- **C:** make Eastvale Core read as a landmark (raise the tier above the marker +
  richer civic entry).
- **D:** roof light finish (`sunlitColor("top")` + roof rim/fall) — restrained,
  NOT the 0.54E whole-canvas grade.
- **E:** verify + mobile + honest /10.

## 6. Verify recipe (run at the end, in the worktree)

```powershell
$env:PATH = "C:\tmp\pnpmshim;$env:PATH"
corepack pnpm typecheck:starter
corepack pnpm build:web
corepack pnpm test:core            # must stay green (89+)
corepack pnpm dev                  # serves :8787/preview
# browse.exe: C:\Users\mzwin\.claude\skills\browse\dist\browse.exe
#   screenshot Riverside desktop 1280x720 + mobile 390x844 (light+dark),
#   dark = stamp data-theme="dark" on documentElement
node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview --screenshots artifacts/0.53e-hero/verify
node scripts/verify-alpha-rc-split.mjs      # 0 blockers / 0 unknowns
git diff --check
```

## 7. Definition of done

Residential reads varied; commerce/civic/anchor read as articulated architecture
with legible materials + lit roofs; **≥8/10** desktop AND mobile (or a named
plateau); all verifiers green; invariants + palette cohesion + 0.52E contact
grammar intact; bisectable commits with the `Co-Authored-By: Claude Opus 4.8
(1M context)` trailer; BUILD_LOG + STATE updated. Then merge to `main` + redeploy
as a post-launch update **through the human deploy gate only** (production is live
and current — don't break it).

## 8. Hard invariants (unchanged)

2D Pixi vector canvas — no 3D/PBR/meshes/LOD-geometry/new deps; no crutch props;
map-first; session-only honesty; provider boundary; palette registry + effective-
color diagnostics survive; the ~95 draw fns + variety system survive; Anaheim/
Ontario hidden; shells honest; zero overflow / console errors; no deploy without
the human gate.
