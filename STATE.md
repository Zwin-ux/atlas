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
