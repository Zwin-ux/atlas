# Atlas Loop Budget

The loop is allowed to run often, but not blindly. Budget exists to prevent
token burn, repeated failed attempts, and unsafe scope creep.

## Daily Caps

| Loop | Max runs/day | Max heavy runs/day | Max local worker/subagent effort |
| --- | ---: | ---: | ---: |
| Atlas Engine Captain Loop | 8 | 2 | 3 bounded artifacts |
| Atlas Release Proof Loop | 2 | 2 | 0 implementation artifacts |
| Atlas Second-District Readiness Loop | 3 | 1 | 2 hidden-only artifacts |

## Run Budget Rules

- Empty watchlist: update `STATE.md` and exit quickly.
- One bounded code artifact per run unless the user explicitly says full power.
- Maximum 2 implementation attempts on the same metric before blocking and
  escalating.
- Maximum 1 deploy attempt per run.
- No package/lock/env changes without explicit human approval.

## Kill Switch

Pause all loops if any of these happen:

- strict split guard reports blockers or unknowns;
- public MCP tool count changes;
- public shell/unsupported states expose fake playable controls;
- Anaheim/Ontario becomes public without the owner-gate cutline;
- any paid/persistence/Hosted Clawd/Stripe/XP/evidence/OAuth scope appears;
- the same blocker repeats for 3 runs.

## On Budget Exceed

1. Stop implementation.
2. Append a block entry to `loop-run-log.md`.
3. Update `STATE.md` with the exact blocker.
4. Ask the human only if the next action needs credentials, deploy approval, or
   product direction.

