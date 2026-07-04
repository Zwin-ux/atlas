# Atlas Loop Operating Contract

Atlas uses a loop-engineering pattern adapted from
`cobusgreyling/loop-engineering`: state file, constraints, budget, run log,
verifier, and scheduled Codex wakeups. This repo does not vendor that project and
does not add its npm packages. Atlas owns the loop.

## Repository Harness (post-2026-07-04 reorg)

One canonical working tree: `C:/Users/mzwin/Documents/Atlas` on
**`fable/0.51e-voxel-art`**. The old multi-worktree sprawl is retired. **Local is
the working boss; GitHub (`Zwin-ux/atlas-alpha-engine-beta-checkpoint`) is backup
and big-update handoff.** All prior lines of work are preserved as branches and
pushed to origin (see the branch map in `STATE.md`). Do not recreate sibling
worktree folders for parallel branches — check out branches in place, or push to
origin and let a cloud/Codex session pick them up.

## Active Loops

## Real Crew Threads

When the Codex thread bridge is available, Axiom must read current real-thread
handoffs before claiming worker state:

- Forge: `019f1be1-9914-7aa2-94b1-c5e920dadec1`.
- Lumen: `019f1a00-39c1-7330-a256-79564ba0cdb1`.
- Mira: `019f1a01-72d8-7122-9087-c071313f4ee3`.

If a read is truncated, retry with a smaller turn limit. If the bridge is not
available, record that as a blocker and continue only from verified local
artifacts. Do not create local Mira, Forge, or Lumen clones.

### Atlas Engine Captain Loop

- Level: L2 assisted.
- Cadence: every few hours during the release push.
- Owner: Axiom.
- State: `STATE.md`.
- Constraints: `loop-constraints.md`.
- Budget: `loop-budget.md`.
- Run log: `loop-run-log.md`.
- Read first:
  - `docs/PRODUCT_NORTH_STAR.md`
  - `docs/ENGINEERING_ROUTE.md`
  - `docs/PHASE_PLAN.md`
  - `docs/TOOL_CONTRACTS.md`
  - `docs/NEXT_QUESTS.md`
  - `docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md`

Loop steps:

1. Read `loop-constraints.md`, `STATE.md`, and `docs/NEXT_QUESTS.md`.
2. Read the latest small chunk from Forge, Lumen, and Mira if thread tools are
   available.
3. Run `node scripts/verify-atlas-loop-readiness.mjs --json-only`.
4. Pick exactly one next slice from `STATE.md`.
5. State the current quest, likely files, and anti-scope before edits.
6. Implement one bounded artifact.
7. Run focused verification plus the split guard.
8. Update `STATE.md`, `loop-run-log.md`, `docs/BUILD_LOG.md`, and `docs/NEXT_QUESTS.md`.
9. Stop with a clear PASS/BLOCK and next quest.

Allowed work:

- Public Engine Beta quality slices on Riverside/Eastvale.
- Hidden Anaheim/Ontario readiness artifacts that remain non-public.
- Product comprehension fixes that keep the app map-first.
- Verifier, diagnostic, and split-safety improvements.
- Full release specs that make the next code slice executable.

Hard stops:

- Deploying without explicit release gate.
- Public Anaheim/Ontario playable state unless the cutline changes to
  `APPROVE_CONTROLLED_PUBLIC_SPIKE`.
- Stripe, Hosted Clawd, persistence, XP, evidence, OAuth, automation product
  features, reports, or exports.
- Provider or Google geometry inside compiled `CityWorldScene`.
- Generic dashboard, landing page, or SaaS panel drift.

### Atlas Release Proof Loop

- Level: L1 report until Axiom explicitly calls deploy.
- Cadence: at most twice daily during the release push.
- Job: prove that local/public state still matches the accepted Alpha/Engine
  Beta boundary.

Required proof when called:

- `pnpm --dir packages/core test`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `pnpm verify:mcp`
- `pnpm verify:submission`
- `node scripts/verify-engine-beta-coverage.mjs`
- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

### Atlas Second-District Readiness Loop

- Level: L1/L2 hidden-only.
- Job: move Anaheim/Ontario readiness through data, visual, product, and release
  gates without exposing them publicly.
- Cutline source:
  `artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json`.

This loop may prepare hidden packets, verifier outputs, and source-art proofs. It
may not add public switcher states, pins, actors, selected-place trays, or
playable claims for Anaheim/Ontario.

## Multi-Loop Priority

1. Release safety and public app regressions.
2. Public Riverside/Eastvale Engine Beta quality.
3. Hidden second-district readiness.
4. Backend/provider contracts that protect future scale.
5. Paid or persistence scope only after explicit human reopening.

## Human Gate

Human approval is required for:

- deploy;
- public second playable district;
- money, persistence, DB, OAuth, Hosted Clawd, XP, evidence, reports, exports;
- package/lock/env changes;
- broad UI direction change;
- any third failed attempt on the same blocker.
