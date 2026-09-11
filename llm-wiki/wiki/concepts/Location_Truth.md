---
title: Location Truth
type: concept
created: 2026-09-10
updated: 2026-09-10
sources: [agents-md]
tags: [gazetteer, honesty]
---

# Location Truth

A location query resolves to the right place, or it refuses. Those are the
only two acceptable outcomes.

- `ambiguous` returns the candidate places so the person can choose.
- `unresolved` says Atlas does not carry the name.
- Atlas is never confidently wrong. One wrong county stated as fact costs more
  than every refusal.

Implementation: `packages/core/src/atlas/gazetteer.ts`.
Gate: `pnpm verify:location-truth` (`scripts/verify-location-truth.mjs`).
The gate samples exact names, casing, punctuation, misspellings, dropped
diacritics, shared names, and nonsense. It fails on a single confidently
wrong answer.

`docs/STATUS.md` last recorded this gate green on 2026-08-01 and **not
re-run** in the 2026-08-22 pass. Re-run before any release claim.

## Related

- [[Current_Product]]
- [[US_Census]]
