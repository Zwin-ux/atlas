# Atlas Commons 0.81D Test Report

Status: technical staging acceptance complete; production remains off

Date: 2026-07-21

## Result

The map-native public-note implementation, security boundaries, concurrency
controls, real Postgres paths, desktop/mobile UX, OAuth connector, moderation
lifecycle, and flag rollback are green in isolated staging. Staging is enabled
with nine tools. Production was not mutated and remains Commons-absent with its
original seven tools.

## Automated evidence

| Gate | Result |
| --- | --- |
| `pnpm test:atlas-commons` | 19/19 pass |
| `pnpm test:core` | 31 files, 271/271 pass |
| Hosted Clawd isolation regressions | 33/33 pass |
| `pnpm typecheck` | pass after latest OAuth policy and verifier changes |
| `pnpm build` | full starter/workspace build pass |
| `pnpm verify:atlas-commons` | pass; 7 tools off, 9 on, isolated readiness, `081d` widget URI |
| live staging Postgres smoke | pass; three migrations, pooled transactions, concurrency and pagination |
| disabled staging verifier | pass; healthy map, exactly 7 tools, moderation route hidden |
| enabled staging verifier | pass; healthy map, exactly 9 tools, `081d`, exact OAuth policies and relink challenges |
| Auth0/OIDC discovery | pass; CIMD registration, issuer/audience/JWKS, exact read/write scopes |
| ChatGPT `Atlas Staging` connector | pass; OAuth connected, 9 actions, `081d`, exact action scopes |
| live two-user moderation lifecycle | pass; pending -> approved -> reported -> removed with cleanup |
| flag rollback | pass; 9 -> 7 -> 9 across isolated staging redeploys |
| final production isolation | pass; same deployment/digest, healthy, no Commons field, 7 tools, `0781v` |
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

## Live staging acceptance

- final staging deployment:
  `fa23c787-0208-4dbc-87be-94c72c83aedf`;
- final staging digest:
  `sha256:9fcb350bf048cb3ce00ebc287783b54bcb849c26381431dcb565f02709f866f5`;
- rollback-off deployment:
  `06d79cea-0cad-4080-80ce-5a541df25884`;
- production deployment, unchanged:
  `1913ad33-8abd-48a8-a36f-193a08f0d5ce`;
- production digest, unchanged:
  `sha256:a4d7e4b86db47b02dd465e90c08b634aa2cba40d5f68ce0abdb67943eafa3bbd`.

The proof used two distinct short-lived staging users and an independent
operator credential. Tokens, provider subjects, emails, note bodies, and
report reasons are intentionally excluded from release artifacts.

## Remaining public-launch gates

- name and staff moderation ownership;
- approve retention and deletion policy;
- approve abuse-response and escalation procedure;
- approve public-facing legal and community copy;
- schedule a separate owner-approved production window. Production remains
  unchanged/off until that decision.

## Product-source alignment

The map-first cutline and production freeze were cross-checked against:

- Atlas Release Command Center:
  `https://app.notion.com/p/3a39316183be8128bda0cdbf9cddf3c9`;
- Fish Plan / Ocean First:
  `https://app.notion.com/p/3709316183be81d789f8ecca1f59b105`.
