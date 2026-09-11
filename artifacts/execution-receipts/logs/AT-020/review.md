# Independent review / AT-020

Task and candidate revision: AT-020 uncommitted working tree vs `767a8a8f` (AT-007).
Reviewer identity/session: grok-explore-01a08f8b-5da9-7133-a791-2aa021dfaae7 (source) and grok-build-01a08f98-f8dd-7240-883c-fc9b62ea4c10 (commands). Neither implemented the slice.
Implementation author/session: grok-build-lead-20260911
Environment: local `C:\Users\mzwin\Documents\Atlas`. Not ChatGPT host proof.
Verdict: PASS

## What I inspected

Diff vs `767a8a8f` (seven files): `viewContract.ts`, `index.ts`, `atlas-view-contract.test.ts`, `useToolPlate.ts`, `AtlasApp.tsx`, `main.tsx`, `atlas.css`.

AtlasApp trail init is `initialRef ? [initialRef] : []`. The former `initialRef ?? { level: "nation" }` is gone. Empty host output is `idle`, not `opened` and not `unresolved`. `resolveWidgetPlate` applies explicit refusal before leftover `level` or `_meta` plates. `main.tsx` passes `viewStatus` and candidates.

## Checks actually run

| Check | Exit | Observation |
|---|---|---|
| Source read of 7-file diff | n/a | Nation default gone; refusal wins over stale metadata |
| `pnpm --dir packages/core test` | 0 | 376/376. New resolveWidgetPlate cases cover ID-09, STATE-01, STATE-02 |
| `node scripts/verify-atlas-source-of-truth-drift.mjs` | 0 | expectedToolCount 2 |
| Grep `web/src` for `?? { level: "nation" }` | n/a | no matches |

Executor local `/preview` notes in `browser.txt` are not independent host proof.

## Attempts to disprove

- Ambiguous Springfield with `level: nation` and leftover nation `_meta` does not become an opened plate (STATE-01).
- Later refusal after Riverside keeps displayed county, omits `requested`, does not open the nation (STATE-02).
- Missing payload is idle, not unresolved (AC2).
- `/preview?nation=1` still opens the national plate only as an explicit query.

## Findings

None at blocker severity. Residual: leftover `_meta` without a structured refusal can still open a legacy plate (AC1 needs an explicit refusal). `shouldFetchDisplayedPlate` is tested but unused in AtlasApp; empty trail is the fetch gate.

## Not verified

ChatGPT host remount order. Live Railway. Gazetteer ID-09 live run (AT-010).

## Integration note

Covers the AT-020 working tree against `767a8a8f`. Lead must land only these files and not reuse this review after unrelated edits.
