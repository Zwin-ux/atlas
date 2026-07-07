# Hosted Clawd Stub Audit - 0.64H

Date: 2026-07-05
Branch audited: `codex/integrate-hosted-clawd-fable-058e`
Auditor: Claude Code Fable read-only PRD/stub pass, followed by Codex cleanup.

Purpose:
Find PRD-sized stub work, stale claims, and fake surfaces in the Hosted Clawd
saved-read slice. Each finding is either fixed in 0.64H, logged for a named
future slice, or marked intentional.

Scope read:
- `docs/NEXT_QUESTS.md`
- `docs/PRODUCT_SPEC_AND_GATES.md`
- `docs/TOOL_CONTRACTS.md`
- `docs/APPS_SDK_MCP_SPEC.md`
- `AGENTS.md`
- `STATE.md`
- `artifacts/current-update.json`
- `server/src/index.ts`
- `server/src/hostedClawd/{auth,service,types,repository}.ts`
- `web/src/{App.tsx,HostedClawdTray.tsx,types.ts,styles.css}`
- Keyword sweeps for TODO, stub, placeholder, fake, planned, not live,
  scaffold, dashboard, pricing, report, evidence, XP, export, automation,
  Anaheim, Ontario, `get_hosted_clawd_state`, `open_saved_campaign`, and
  saved-artifact routes.

## Verified Good

- `/api/hosted-clawd/saved` is GET-only, requires read or write scope, and
  does not trust client `subscriptionStatus`.
- Saved reads use `findUserByOidcSubject`, not user upsert. Reads create no
  owner rows and record no usage.
- Ownership is derived from verified OIDC subject only.
- Payment-failed owners can still read saved history while paid writes stay
  paused.
- The tray shelf is an in-map surface with `data-qa="hosted-clawd-saved-shelf"`.
  There is no dashboard shell, pricing page, report, export, XP, evidence, or
  automation surface.
- No Anaheim or Ontario public surface was introduced by the Hosted Clawd work.
- The public MCP surface remains the same seven tools.

## FIX_NOW_0.64H

### F1. `refresh_status` was wired as a write action

Status: fixed in 0.64H.

Before:
`refresh_status` mapped to POST `/api/hosted-clawd/create-or-attach`, which can
upsert the owner, create a Clawd row, and record usage.

After:
`refresh_status` uses the same GET read path as `open_saved_campaign`:
`/api/hosted-clawd/saved`. It refreshes context and saved state without a write.

Files:
- `web/src/App.tsx`
- `scripts/verify-hosted-clawd-saved-read-surface.mjs`

### F2. `get_upgrade_options` contradicted the gated Hosted Clawd stack

Status: fixed in 0.64H.

Before:
The tool always told the model that checkout and persistence were unavailable,
even when the owner-gated persistence/money flags and adapters were active.

After:
The copy is derived from `HostedClawdService.getContext()`. Closed Alpha keeps
the old closed-gate copy. Owner-gated test mode says that owner-scoped saves
and test-mode Stripe Checkout are behind account linking and webhook
confirmation, while public paid access remains closed.

Files:
- `server/src/index.ts`
- `scripts/verify-hosted-clawd-saved-read-surface.mjs`

### F3. Widget bearer-token path is still a 0.65H decision

Status: logged for 0.65H.

The saved route correctly requires an OIDC bearer token with
`atlas:hosted_clawd.read` or write scope. The current widget fetch path has no
final bearer-token bridge decision, so browser proof must explicitly verify the
blocked unauthenticated path and then choose the real account-link/token path.

Required 0.65H decision:
Use one of these, then test it in browser proof:
- ChatGPT Apps SDK auth passthrough to widget HTTP reads.
- Short-lived widget read token minted into tool `_meta`.
- Move saved reads back through an authenticated MCP channel while keeping the
  public tool surface stable.

Files to revisit:
- `web/src/App.tsx`
- `web/src/bridge.ts`
- `server/src/index.ts`
- `docs/NEXT_QUESTS.md`

## LOG_NEXT

### L1. Waitlist button does not join a real waitlist

Current state:
When gates are closed, the waitlist action returns honest blocked copy, but no
waitlist table or capture endpoint exists.

Future action:
Either capture a real waitlist intent in a named slice or soften the copy so it
does not imply a record was created.

### L2. Demo XP copy references parked scope

Current state:
Some Hosted Clawd copy mentions demo XP, but XP remains explicitly parked.

Future action:
Change "Session stickers and demo XP stay temporary..." to "Session stickers
and notes stay temporary..." in a copy-only cleanup slice.

### L3. Client fallback context duplicates server gate copy

Current state:
`web/src/App.tsx` can fabricate a fallback Hosted Clawd context for display.
The server does not trust it, but the duplicate copy can drift.

Future action:
Replace fallback copy with a GET to `/api/hosted-clawd/state` so server context
is the single display source.

### L4. `open_saved_campaign` name over-promises a campaign view

Current state:
The action opens a saved-state shelf, not a full campaign document.

Future action:
Rename or relabel it to "Open saved state" once the action naming contract is
allowed to move.

### L5. Historical prompt-pack docs are stale

Current state:
`prompt-pack/docs/*` and `engineering-prompt-pack/docs/*` describe older tool
names and checkout placeholder language.

Future action:
Add a banner that they are historical and superseded by
`docs/TOOL_CONTRACTS.md` and `docs/APPS_SDK_MCP_SPEC.md`.

### L6. Submission build needs explicit hosted flag state

Current state:
Submission gates still say session-only, which is true only when Hosted Clawd
persistence and money flags are off in the submitted deployment.

Future action:
Add explicit flag-state proof to the submission gate packet.

## IGNORE_OK

- Scaffold responses are intentional when adapters are missing.
- Closed-gate copy is intentional when persistence or money flags are off.
- Future paid/hosted tools in `docs/TOOL_CONTRACTS.md` are clearly marked as
  future and are not registered in `server/src/index.ts`.
- `assets/generated/placeholders/svg/hosted-clawd-clay-bg.svg` follows the repo
  generated-asset path convention and is not a product placeholder.
