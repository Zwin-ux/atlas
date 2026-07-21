# Atlas Commons 0.81D Test Report

Status: implementation green; staging disabled; OAuth owner gate pending

Date: 2026-07-21

## Result

The map-native public-note implementation, security boundaries, concurrency
controls, real Postgres paths, and desktop/mobile UX are green. The isolated
staging database and disabled seven-tool staging surface are proven. No
production mutation was made.

## Automated evidence

| Gate | Result |
| --- | --- |
| `pnpm test:atlas-commons` | 19/19 pass |
| `pnpm test:core` | 31 files, 271/271 pass |
| Hosted Clawd isolation regressions | 33/33 pass |
| `pnpm typecheck:starter` | pass after latest cursor and smoke changes |
| `pnpm build` | full starter/workspace build pass |
| `pnpm verify:atlas-commons` | pass; 7 tools off, 9 on, isolated readiness, `081d` widget URI |
| live staging Postgres smoke | pass; three migrations, pooled transactions, concurrency and pagination |
| disabled staging verifier | pass; healthy map, exactly 7 tools, moderation route hidden |
| strict Commons RC split | pass after cleanup; 46 files, zero unexpected paths |
| `pnpm verify:atlas-commons:browser` | pass; outer and inner viewports asserted, zero browser errors |
| `design-qa.md` | pass after two visible correction cycles |
| `pnpm ship:check:local` | 8/8 pass against the current disabled local server |
| `pnpm audit --prod --audit-level=high` | no known vulnerabilities |

## Service and database coverage

- anonymous output allowlisting and pending/removed isolation;
- exact read/write scope challenges and no Hosted Clawd scope leakage;
- explicit post confirmation and idempotent retry;
- canonical map anchors, plain-text bounds, link rejection, and pseudonyms;
- bounded per-identity write quota serialized with advisory transaction locks;
- unique reactions/reports and concurrent report-threshold auto-hide;
- operator-safe pending/removed queues and irreversible moderation transitions;
- signed, scope-bound cursors;
- one service-owned `asOf` instant per list request;
- millisecond-normalized MINE, NEW, and HOT pagination with ID tie-breaks;
- matching nine-decimal HOT scores in memory, service, and Postgres;
- same-millisecond and late-approval Postgres smoke cases;
- Commons failures isolated from healthy map readiness.

## Browser and design proof

Desktop uses an outer 1360x900 harness containing a measured 1280x720 Atlas
emulator. Mobile uses an outer 430x1000 harness containing a measured 390x844
emulator. The verifier now asserts both inner dimensions instead of implying
that the outer screenshot itself has the inner size.

Both surfaces prove:

- one selected public note and no feed list;
- HOT/NEW and ALL/NEARBY/MINE behavior;
- place-level activity beacons instead of overlapping note cards;
- explicit Review public post -> Post publicly confirmation;
- zero horizontal overflow;
- at least 44x44 mobile actions;
- about 79.5% visible mobile map area with the Commons strip collapsed;
- zero application console errors.

Evidence is under `artifacts/emulator/atlas-commons-*`; `design-qa.md` records
the reference comparison and the caption/mobile-map corrections.

## Remaining release gates

- commit and push the verified 0.81D bundle;
- deploy that commit to staging with Commons disabled;
- complete the owner-authenticated Auth0/OIDC and connector refresh;
- run enabled OAuth, moderation, 9->7->9 rollback, desktop/mobile connector,
  and production-isolation proof;
- leave production unchanged/off.
