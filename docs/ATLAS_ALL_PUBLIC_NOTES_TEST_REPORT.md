# Atlas ALL Public Notes Test Report

Status: local green, no deploy performed

Slice: `postalpha-0.81c-atlas-all-public-notes-foundation`

Date: 2026-07-20

## Result

The default-off public-notes foundation passes its focused service, migration,
Postgres, MCP registration, compatibility, build, and desktop/mobile map gates.
No production database, connector, OAuth tenant, Railway environment, or public
server was changed.

## Automated evidence

| Gate | Result |
| --- | --- |
| `pnpm test:atlas-commons` | 13/13 pass |
| Node test coverage | `service.ts` 93.96% line, 81.25% branch; `repository.ts` 96.63% line |
| `pnpm smoke:atlas-commons:postgres` | 3 migrations, idempotent post, unique reaction, report auto-hide: pass |
| `pnpm verify:atlas-commons` | default-off seven tools; enabled nine tools; no-DB narrow failure: pass |
| `pnpm test:core` | 271/271 pass |
| Hosted Clawd regression tests | 33/33 pass across persistence, billing, protected writes, and saved reads |
| `pnpm audit --prod --audit-level=high` | no known vulnerabilities |
| `pnpm typecheck:starter` | pass |
| `pnpm build:web` | pass |
| `pnpm typecheck` | full starter and workspace typecheck: pass |
| `pnpm build` | full starter and workspace production build: pass |
| `pnpm verify:mcp` | default-off seven-tool connector flow and explicit generated-study contract: pass |
| `pnpm ship:check:local` | all 8 local release gates: pass |
| strict selected-RC split | `atlas-commons-foundation`, zero unexpected paths: pass |

The Postgres smoke used a throwaway local cluster and also passed when rerun
against the isolated browser-QA database. The migration runner applied all
three migrations and skipped already-applied migrations on repeat execution.

## Service and security coverage

Covered behavior includes:

- anonymous approved-note reads and public-field allowlisting;
- pending-note isolation across users;
- read/write scope enforcement;
- explicit authenticated posting;
- idempotent retries;
- canonical anchor rejection;
- 240-character acceptance and 241-character rejection;
- link and injection-shaped anchor rejection;
- markup/XSS-shaped bodies preserved as plain text;
- stable per-identity pseudonyms;
- reaction uniqueness and removal;
- report uniqueness, self-report blocking, and threshold auto-hide;
- moderation state transitions;
- rate limiting;
- stable pagination and cursor tamper rejection;
- disabled and unavailable failure boundaries.

## Browser proof

The required gstack `/browse` workflow exercised the live local MCP server with
an isolated Postgres database and one approved Eastvale note.

Desktop, 1280 x 720:

- the full map remains the dominant surface;
- `ALL / NEARBY / MINE` renders as one compact control;
- the approved note renders as a restrained map pin and contextual note;
- all three mode targets are 44 CSS pixels high;
- horizontal overflow is 0;
- `Review public post` opens a distinct `Post publicly` confirmation;
- the confirmation was cancelled, so no test post was written;
- `NEARBY` retained the selected-place note;
- anonymous `MINE` returned direct identity recovery copy and kept the private
  note input available.

Mobile, 390 x 844:

- horizontal overflow is 0;
- mode targets are 75 x 44 CSS pixels;
- `Useful` is 47 x 44, `Report` is 50 x 44, and the review action is 340 x 44;
- the tray scrolls vertically from 0 to 96 pixels to reveal composition while
  preserving the map behind it;
- no permanent rail, dashboard, or generic card grid appears.

Evidence:

- `artifacts/emulator/atlas-commons-desktop.png`
- `artifacts/emulator/atlas-commons-mobile.png`
- `artifacts/emulator/atlas-commons-mobile-compose.png`

The only console messages were the emulator's known sandbox warning and
headless WebGL readback warnings. No application exception remained.

## Defects found and closed

Browser QA found that Riverside could choose an attached Census geo scene even
though Riverside is the authored full-map county. An approved Eastvale note
then referenced a place absent from that scene and crashed map compilation.

The fix keeps Riverside on the authored full map and independently filters
public map pins to place IDs present in the active scene. Cross-scene or stale
data can no longer take down the map.

Release QA also found that the legacy MCP flow verifier contradicted the live
tool contract by expecting generated county layouts without the explicit
`includeGeneratedDraft` opt-in and by querying obsolete generated place labels.
The verifier now proves that Census boards and town anchors are the default,
while generated layout studies appear only when requested.

## Intentionally unproven

- staging and production deployment;
- a real staging OAuth login and end-to-end token exchange;
- production moderator staffing and legal/retention policy;
- public enablement and live traffic behavior.

Those are owner-gated launch tasks, not implementation gaps to hide inside this
default-off foundation.
