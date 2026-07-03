# Atlas Loop Constraints

pause: false

## Always Read First

- `AGENTS.md` if present.
- `LOOP.md`
- `STATE.md`
- `docs/NEXT_QUESTS.md`
- `docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md`
- `artifacts/current-update.json`

## Product Constraints

- Atlas is a ChatGPT app that opens map-first.
- Do not create a generic SaaS homepage or dashboard shell.
- Keep `structuredContent` concise and large scenes in `_meta`.
- Public state remains session-only until Hosted Clawd is reopened.
- Riverside/Eastvale remains the only public playable district unless the
  second-district cutline explicitly changes.

## Forbidden Scope

The loop must not edit or introduce:

- `.env`, `.env.*`, secrets, credentials, token files;
- DB migrations or Hosted Clawd persistence;
- Stripe, billing, OAuth, XP, evidence, reports, exports;
- automated posting, DMs, scraping private people, or spam automation;
- package/lock/env changes without explicit human approval;
- public Anaheim/Ontario switcher, route, pins, actors, selected-place tray, or
  playable claim while cutline is `BLOCK_PROMOTION`;
- Google/provider geometry in compiled scenes;
- Three.js, Rapier, Open3D, Python runtime, GameBlocks/VoxCity dependency
  imports, or image-to-voxel runtime gimmicks.

## Required Gates For Code Changes

- State the quest, likely files, and anti-scope before edits.
- Run at least one focused verifier.
- Update `docs/BUILD_LOG.md` and `docs/NEXT_QUESTS.md`.
- Run strict split guard before any release/deploy claim.

## Human Escalation

Escalate instead of mutating when blocked by:

- Railway login/env/service changes;
- OpenAI app submission/account setup;
- payment or persistence direction;
- public second-district release decision;
- credentials or provider keys;
- repeated verifier failure on the same root cause.
