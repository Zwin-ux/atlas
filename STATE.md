# Atlas Loop State

Last run: 2026-07-04 — repository reharness (worktree consolidation) + Fable super-move loaded
Loop level: L2 assisted
Kill switch: active only if `loop-constraints.md` says `pause: true`

## Repository Harness (post-2026-07-04 reorg)

Atlas now lives in **one canonical working tree**: `C:/Users/mzwin/Documents/Atlas`,
checked out on **`fable/0.51e-voxel-art`** (the quality line: 0.48P design pass +
0.51E voxel-art). The old 5-worktree / 6-folder sprawl is gone. **Local is the
working boss; GitHub (`Zwin-ux/atlas-alpha-engine-beta-checkpoint`) is backup /
big-update handoff.** Every line of work below is preserved as a branch and pushed
to origin — nothing was discarded.

### Branch map (all on origin)

- **`fable/0.51e-voxel-art`** ✅ CANONICAL — checked out here. 0.48P design + 0.51E
  voxel-art. Render-command / viewport pipeline.
- `fable/0.48p-design-ultra-pass` — the design ultra-pass checkpoint (ancestor).
- `codex/e6-apps-sdk-readiness` — PARKED. Divergent line: leaner **module-atlas
  renderer** + **Hosted Clawd backend** + spec kit. Checkpoint `97b6bbc`.
- `codex/g5-road-lot-terrain-contact` — PARKED. G5/G6 **contact-grammar** proof,
  branched off base without the Fable work. `c2cd8c2`.
- `codex/g4-reference-asset-intake` — reference/spec-kit source (ported onto canonical).
- `codex/g3-world-identity-hardening`, `codex/f2-clean-product-code-rc`,
  `codex/alpha-path-b-rc`, `codex/fable-product-submission-experiment`,
  `codex/engine-beta-cleanup` — parked checkpoints of earlier codex slices.
- Tag `checkpoint/alpha-engine-beta-2026-07-03` on origin.

## High Priority

-2. **COMPLETE: "Generated-District Parity" pass (0.57E) — landed 2026-07-05.**
   - All five scouting findings closed (BUILD_LOG **Entry 087**, resolution in
     `DECAL_DISCIPLINE_SUPERPASS.md`): strip-row commerce (no more toy-box
     grid), landmark-first selection (no more whole-neighborhood ring storm),
     frame-fill density + spec-first parcels, gym sawtooth strokes clamped to
     the roof diamond, apartment windows seated on the wall face.
   - Verified on the merged tree (includes sibling 0.58E `0c4c350`): 89/89,
     product-loop ok desktop+mobile zero console errors, rc-split passed,
     mcp-flow ok, verify-parametric-generator OK. Evidence:
     `artifacts/0.57e-parity/` (iter1 before / final-generated after).
   - NOTE: a sibling session committed the pending 0.57E generator diff as
     `77524a2` and 0.58E prop-cleanup as `0c4c350` on
     `fable/0.58e-prop-cleanup` while this pass ran; the 0.57E completion
     commit stacks on that branch to keep the line linear.

-1. **COMPLETE: "Decal Discipline" pass (0.55E) — `fable/0.55e-decal-discipline`.**
   - Landed 2026-07-05 (`2a1815f` civic, `d8011c1` residential+commerce) —
     BUILD_LOG **Entry 085**. Per-surface decal ownership per family; the
     civic wall wash (7 stacked generations) is gone at the source. All
     verifiers green (89/89, product-loop, rc-split, mcp-flow).
   - 0.54E (grade contrast + Apps SDK tool discovery) landed on
     `fable/0.54e-grade-contrast` (`43e560c`, `0e32a45`) — Entry 084.
   - Branch stack awaiting the human gate: 0.53E → 0.54E → 0.55E (each
     bisectable). **NEXT Fable-class passes queued** (spec:
     `DECAL_DISCIPLINE_SUPERPASS.md` tail): 0.56E label/marker layout,
     0.57E generated-district parity. Owner directive: primary audience is
     the ChatGPT app; spend Fable on big hard engine work first.

0. **COMPLETE: "The Hero Silhouette" pass (0.53E) — `fable/0.53e-hero-silhouette`.**
   - Finish run executed 2026-07-05 (Fable, isolated worktree). Items A-finish →
     E all landed, bisectable: `9bf1a94` (home roof accents + stoops, sprite AND
     shell paths), `e0a8b46` (roof material families one notch apart), `762450c`
     (Eastvale Core tiered landmark + legacy roof-decal fog retired), `8bbaa5e`
     (roof light finish). Full record: BUILD_LOG **Entry 083**.
   - Verified: typecheck/build/test (89/89) green; product-loop `ok: true`
     desktop+mobile, zero console errors; rc-split 0/0; screenshots (light+dark,
     desktop 1280x720 + mobile 390x844) in `artifacts/0.53e-hero/final-*.png`.
   - **Self-rating vs north star: desktop 8/10, mobile 7.9/10.** Named plateau:
     marker/label band sits on the hero crown zone (marker system, not building
     draw); golden-hour grade wash is now the biggest remaining gap (0.54E,
     design-gated).
   - **AWAITING HUMAN GATE:** review screenshots + /10, then merge to release
     line + redeploy as a post-launch update. Production stays live on `main`
     until then. Ops note: `pnpm dev` caches the inlined bundle at process start
     — every visual iteration needs `build:web` + server RESTART.

1. **"The Diorama Engine" pass: RUN (2026-07-04, `fable/0.52e-diorama-engine`).**
   - Spec: `docs/design/fable-prompts/DIORAMA_ENGINE_SUPERPASS.md`. Result:
     BUILD_LOG Entry 082.
   - Engine ratified on canonical (render-command pipeline); `codex/e6` module-atlas
     and `codex/g5` contact proof are FORMALLY SUPERSEDED as engine bases (history
     only — do not reopen).
   - Ground contact system unified: compiler-authored typed road/lot/terrain
     contact grammar, renderer consumes it uniformly (no draw-time id/kind
     sniffing). Curb cuts, terrain seams, water bank strands landed.
   - Verified: typecheck/build/test (89) green, product-loop verifier `ok: true`,
     before/after screenshots in `artifacts/0.52e-diorama/`. Self-rating vs
     north-star: 6.5/10 — plateau is grade/washout + forbidden-prop density, not
     ground. Next funded engine move: grade/contrast tuning pass with design
     sign-off.
   - **Human review gate:** inspect screenshots before merging to canonical or
     deploying.

2. **0.51E voxel-art is in-tree but NOT deployed.**
   - Live URL still serves the pre-0.51E build.
   - Next action: deploy is a hard human gate — do not ship without explicit approval.

3. **Keep Anaheim/Ontario hidden.**
   - Cutline `BLOCK_PROMOTION`. Do not public-spike unless it changes to
     `APPROVE_CONTROLLED_PUBLIC_SPIKE`.

## Watch List

- Mobile `390x844` product comprehension.
- Provider boundaries: lookup can inform context but cannot create map geometry.
- Dirty tree size: strict split guard must stay `0 blockers / 0 unknowns`.
- Public URL baseline: `https://atlas-backend-production-e6fc.up.railway.app/preview`.

## Done Recently

- 2026-07-04 **Repository reharness**: consolidated 1 repo + 5 worktrees → single
  canonical tree on `fable/0.51e-voxel-art`; checkpointed all loose work; pushed
  all 10 branches + tag to origin; reclaimed ~5 duplicate node_modules.
- 2026-07-04 Ported voxel visual spec kit + north-star reference onto canonical line.
- 0.48P Fable design ultra-pass ("Instrument" direction) — proven.
- 0.51E voxel-art variety pass — local green, in-tree.
