# Atlas Loop Run Log

## 2026-07-03 - Loop setup

- Pattern adapted from `cobusgreyling/loop-engineering`.
- Added Atlas-owned loop contract, state, budget, constraints, full project loop
  spec, and readiness verifier.
- Level chosen: L2 assisted, not L3 unattended.
- Reason: Atlas is close to release, but deploys, money, persistence, and public
  second-district promotion still need human gates.
- Current active work remains 0.26E public Engine Beta quality. Anaheim remains
  hidden with cutline `BLOCK_PROMOTION`.

## 2026-07-03 - Captain notes adaptation

- Read the updated RC product docs, loop docs, Captain Light and Full Power
  thread prompts, and the latest small chunks from Mira, Forge, and Lumen.
- Confirmed the active automations already point at
  `C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc`.
- Confirmed current Axiom session has the real thread bridge; future wakeups
  must still retry small thread reads before using fallback local artifacts.
- Updated the loop contract to name real crew threads and forbid local
  Mira/Forge/Lumen clones.
- Updated the strict split guard to allow Atlas loop files and
  `scripts/verify-atlas-loop-readiness.mjs`.
- Updated the existing Codex automations through the app automation tool:
  `atlas-captain-light-reorg-wakeup` now reads the loop contract before its
  memo, and `atlas-captain-full-power-mobilization` now runs loop readiness
  before dispatching artifact work.
