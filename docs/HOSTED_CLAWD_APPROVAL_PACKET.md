# Hosted Clawd Approval Packet

Current quest:
E9.1 Hosted Clawd Approval And Storage Choice.

Current maturity:
M1 Curated Alpha. Atlas has a deployed map-first ChatGPT app with session-only
Clawd behavior and docs-only Hosted Clawd contracts.

Target maturity:
M3 Persisted Beta, after human approval.

Human approval gates:
- `HUMAN_APPROVAL_BEFORE_PERSISTENCE`
- `HUMAN_APPROVAL_BEFORE_MONEY`

## Approval Question

Should Atlas begin implementing Hosted Clawd persistence and account ownership?

Answering yes does not automatically approve Stripe checkout, evidence uploads,
or XP. Those still need their own narrower implementation gates.

## Recommended Path

Use a managed Postgres database with row ownership enforced in the service layer
first, then add database-native policies if the selected provider supports them
cleanly.

Recommended implementation order:
1. Authenticated user identity.
2. User-owned Clawd row.
3. Business profile row.
4. Saved Scout Drop row.
5. Saved campaign row.
6. Usage events and plan-limit checks.
7. Stripe webhook-synced subscription state.
8. Quest, evidence, and XP ledger after persistence is proven.

Reasoning:
- The first valuable paid behavior is remembering a business and saved campaign
  context, not XP fireworks.
- Ownership tests must exist before the product has anything worth stealing.
- Billing is only useful after Atlas can attach access to a real user and Clawd.
- Evidence and XP are the highest integrity risk, so they should come after the
  simpler persistence path is boring.

## Decisions Needed From The Human

### Storage Provider

Decision needed:
Choose the first Beta storage provider.

Recommended default:
Managed Postgres.

Acceptable providers:
- Supabase Postgres if we want dashboard, auth-adjacent tooling, and row-level
  security as an option.
- Railway Postgres if we want to stay close to the existing Railway deploy lane.
- Neon Postgres if branching databases are valuable for review apps.

Reject for Beta:
- Browser/local storage for Hosted Clawd.
- A document database without a clear ownership and migration story.
- Provider data saved directly from Google without a source policy.

Acceptance:
- Connection string is server-only.
- Migrations are committed and repeatable.
- Local/test database path exists.
- Rollback or restore approach is written before real users.

### Auth Model

Decision needed:
Choose the first account identity model.

Recommended default:
Email-based account identity with one user owning one or more Clawds.

Beta scope:
Single-user ownership only. No teams, agencies, shared workspaces, staff seats,
or organization roles until single-user access control is boring.

Required shape:
- Every persisted row has an `owner_user_id` or inherits one through a parent.
- Server services require authenticated context before writes.
- A free/session Clawd id can never be treated as a persisted Clawd id.
- Admin/manual support access, if added later, must be audited.
- ChatGPT model text is not identity. The server must validate a real session or
  account token before loading or writing Hosted Clawd state.

Acceptance:
- User A cannot read or write User B's Clawd, business profile, Scout Drop,
  campaign, quest, evidence, XP, subscription, or usage rows.
- Unauthenticated requests cannot create saved Hosted Clawd state.
- Auth state is never inferred from ChatGPT model text.
- Email uniqueness rules are documented before implementation.
- Account linking inside ChatGPT/App SDK is specified before public Beta.

### Subscription Timing

Decision needed:
Decide whether persistence starts as invite-only unpaid Beta or Stripe-gated
test-mode Beta.

Recommended default:
Build persistence behind an internal invite/admin flag first, then attach Stripe
after ownership and usage gates pass.

Reasoning:
It lets Atlas prove the saved-state path before money enters the debugging loop.
Stripe should gate access once the saved-state path has real ownership tests.

Acceptance:
- Free Alpha remains session-only.
- Invite/internal Beta can be disabled without data loss.
- Paid Beta can only start after `HUMAN_APPROVAL_BEFORE_MONEY`.

### First Persisted Capability

Decision needed:
Choose the first user-visible saved feature.

Recommended default:
Save business profile plus one saved campaign preview from an existing Scout
Drop.

Why not XP first:
XP needs evidence, idempotency, review state, abuse controls, and user trust.

Why not weekly reports first:
Reports depend on saved campaign and activity history.

Acceptance:
- The saved item is visibly different from session-only preview state.
- The user can reload and see it again.
- Deleting or disabling Hosted Clawd access has a written product behavior.

### Session Promotion Rule

Decision needed:
Define what can move from a free session into Hosted Clawd.

Recommended rule:
Promote only user-confirmed business context and generated preview artifacts.
Never silently promote the whole session.

Can be promoted after explicit confirmation:
- business name/type/service area
- selected county and place context
- current Scout Drop preview summary
- current campaign preview draft
- user-written session notes if the user opts in

Must be regenerated or kept separate:
- demo/session XP
- transient sticker placement unless the user saves it as a note or campaign
  marker
- raw live-provider lookup payloads
- unsupported business claims

Acceptance:
- The UI shows exactly what will be saved before saving.
- Demo XP is discarded or shown as demo-only, never merged into the real XP
  ledger.
- Saved artifacts pin the county pack version and source notes.
- User confirmation is required before converting any preview into saved state.

### Usage Limits

Decision needed:
Approve whether current pricing limits become Beta hard limits.

Recommended default for first Beta:
- Free: 3 Scout Drops per week, 1 temporary business profile, 1 active map
  session, campaign preview only.
- Hosted: 25 Scout Drops per month, 5 active campaigns, 3 business profiles, 3
  active counties, 100 campaign quests, 100 saved assets.

Open decision:
Whether limits are hard blocks, soft prompts, or support-overridable during
invite Beta.

Acceptance:
- Reset windows are documented.
- Over-limit tool responses are standardized.
- Usage checks happen server-side before paid tools write state.

## Go / No-Go Checklist

Approve E9.1 implementation only if all are true:
- Storage provider chosen.
- Auth model chosen.
- First persisted capability chosen.
- Migration tool chosen.
- Local/test database plan written.
- Ownership/access tests are the first implementation task.
- Usage-limit tests are included before paid gating.
- Stripe remains docs-only unless `HUMAN_APPROVAL_BEFORE_MONEY` is explicitly
  approved.
- Evidence and XP remain out of scope for the first persistence patch.

## Required Tests Before Merge

Minimum first implementation tests:
- unauthenticated writes are denied
- User A cannot read User B's Clawd
- User A cannot save to User B's business profile
- same client request id does not duplicate a saved Scout Drop or campaign
- free/session Clawd id cannot be loaded as persisted Clawd
- free and hosted usage limits are evaluated server-side
- database migration can run on an empty database
- session-to-hosted promotion saves only explicitly confirmed fields

Later tests before evidence/XP:
- evidence submission idempotency
- XP event idempotency
- XP total can only be derived from ledger events
- evidence review state transitions are explicit

## Anti-Scope

Do not implement in E9.1 approval prep:
- database migrations
- auth provider setup
- Stripe Products, Prices, Checkout Sessions, Customer Portal Sessions, or
  webhooks
- evidence upload/storage
- XP grants
- weekly report generation
- exports
- automated posting, DMs, ads, scraping, or scheduled outreach

## Pass/Fail Criteria For Human Approval

Ready to approve persistence only when the human has explicitly chosen:
- storage provider
- migration tool
- local/test database path
- production database path
- auth provider or account identity approach
- single-user vs team ownership scope
- first persisted capability
- session promotion behavior
- usage-limit behavior

Not ready if any of those are still implied, guessed, or left for a coding agent
to decide while implementing.

## Implementation Prompt After Approval

Use this only after `HUMAN_APPROVAL_BEFORE_PERSISTENCE` is approved.

```md
Current quest:
Implement the first Hosted Clawd persistence slice.

Read first:
- AGENTS.md
- docs/HOSTED_CLAWD_APPROVAL_PACKET.md
- docs/HOSTED_CLAWD_ONBOARDING_SPEC.md
- docs/DATABASE_SCHEMA_BETA.md
- docs/PRODUCTION_EVOLUTION_GATES.md
- docs/TOOL_CONTRACTS.md

Task:
Implement only authenticated ownership foundation plus the approved first saved
capability. Start with tests for ownership, unauthenticated denial, and
idempotency. Do not implement Stripe, evidence, XP, weekly reports, exports, or
automation.

Acceptance:
- Authenticated context is required for every saved write.
- Every saved row has owner enforcement.
- First saved capability survives reload.
- Free Alpha remains session-only.
- Focused tests pass.
```
