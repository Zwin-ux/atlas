# Atlas Full-Stack Product Spec

Status:
Planning source for the next big product leap after `0.58J Hosted Clawd Setup
UI Port`. This is a CTO-level expansion spec, not approval to implement
persistence, auth, Stripe, evidence, XP, reports, exports, automation, or public
Anaheim/Ontario.

Current estimate:
Atlas is about 60% of the way to a strong v1 ChatGPT app candidate and about
45-55% of the way to the full commercial Hosted Clawd product.

Current active gate:
`0.58K Human Visual Gate / Deploy Readiness Decision`.

## 1. Product Thesis

Atlas is a map-first ChatGPT app where a user explores a county-scale voxel
world, asks grounded local questions, drops Clawd on a business context, previews
a Scout Drop and seven-day campaign, then optionally hosts Clawd for that
business so the work becomes durable.

The product is not a dashboard, CRM, SaaS homepage, marketing autopilot, ad
tool, scraper, or generic AI employee.

The durable product promise is:
Host Clawd for this business so Atlas can remember the business, save Scout
Drops and campaign drafts, create manual quests, track proof later, and help the
owner continue from the same map context.

## 2. Completion Definition

### V1 ChatGPT App Candidate

Atlas reaches v1 app-candidate quality when:
- Riverside/Eastvale opens as the first real playable district.
- County shell and unsupported states are honest.
- All seven public MCP tools work live.
- Map, Scout Drop, Campaign Preview, and Hosted Clawd setup tray are usable on
  desktop and 390x844 mobile.
- Submission assets, privacy/terms, icon, live URL, and verifier evidence are
  complete.
- Free Alpha copy stays session-only and does not imply saved state or payment.
- Hosted Clawd remains clearly planned unless persistence/money gates open.

### Full Hosted Clawd Product

Atlas reaches full first commercial product quality when:
- A user can authenticate.
- A user can create or attach a Hosted Clawd.
- A user can save a business profile and first campaign preview from an existing
  Scout Drop.
- Saved state survives reload and is owner-protected.
- Usage limits are server-enforced.
- Stripe subscription state is webhook-synced before paid writes unlock.
- Payment-failed and inactive states become read-only, not broken.
- Evidence, XP, weekly reports, and exports are either deliberately absent or
  implemented behind separate integrity gates.

## 3. Product Pillars

### Map-First World

Current role:
Primary surface and identity.

V1 requirement:
- Full-screen Pixi city map.
- Tiny HUD overlays only.
- Riverside/Eastvale public playable.
- County shells honest and non-playable.
- Anaheim/Ontario hidden until owner gate changes.
- No dashboard shell.

Quality bar:
The first screen should make the user understand that Atlas is a living county
engine, not a business app template.

### Grounded Local Context

Current role:
Read-only county questions and lookup.

V1 requirement:
- `ask_county_question` answers from curated/normalized context.
- `lookup_world_places` stays provider-normalized and never creates geometry.
- Source notes and limitations remain visible.
- Unsupported claims are narrowed or refused.

Quality bar:
The app should feel useful without pretending it has live omniscient local truth.

### Scout Drop

Current role:
Turns a business idea and map context into a local route, signals, risks, and
next actions.

V1 requirement:
- Preview renders in the widget, not just transcript text.
- Signals are business-oriented and non-sensitive.
- Route/places are tied to existing curated or normalized context.
- The result is session-only unless Hosted Clawd persistence is approved.

Future hosted requirement:
- Saved Scout Drop row.
- Idempotent save.
- Owned business/profile link.
- County pack version pinned.
- No raw provider payload storage.

### Campaign Preview

Current role:
Turns Scout Drop into a seven-day manual campaign preview.

V1 requirement:
- Campaign preview is visible inside the widget.
- It is a manual action plan, not automation.
- It does not auto-post, DM, buy ads, scrape, or guarantee ROI.
- It can feed the Hosted Clawd setup tray as "what would be saved."

Future hosted requirement:
- Saved campaign draft.
- Campaign days and assets.
- Later manual quests.
- Explicit proof prompts without automatic verification.

### Hosted Clawd Setup

Current role:
Explains the paid path without opening paid state.

V1 requirement:
- Compact grey setup console.
- Map-first tray, not a pricing page.
- Shows Wake, Target, Scout, Campaign, Gate, Proof.
- Shows what is session-only and what would be saved.
- No persistence, auth, DB, Stripe, or public paid claims while gates are closed.

Future hosted requirement:
- Confirm business.
- Confirm location/county pack.
- Create Hosted Clawd.
- Save first artifact.
- Return to map with saved status.

## 4. Public Tool Surface

The public MCP tool surface stays seven tools until a named verifier and product
decision approve otherwise:

- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Rules:
- `structuredContent` remains concise.
- Large scene data stays in `_meta`.
- Widget-only Hosted Clawd state can ride existing tool metadata.
- No new public MCP tool is added for auth, save, checkout, evidence, XP,
  reports, or exports without an explicit gate.

## 5. Full-Stack Architecture

### Frontend

Surfaces:
- City map renderer.
- Left rail/county shell controls.
- Selected place tray.
- Scout/Campaign preview panels.
- Hosted Clawd setup console.
- Future saved-state status strip.

Rules:
- Map first.
- No SaaS homepage.
- No nested card sprawl.
- No generic pricing screen.
- Mobile proof at 390x844 for any surface change.
- Primary action must be reachable on mobile.

### Server

Current responsibilities:
- Register seven MCP tools.
- Serve preview/widget bundle.
- Compile scenes and tool results.
- Keep provider lookup behind adapters.
- Expose Hosted Clawd scaffold routes with gates off.

Future responsibilities:
- Authenticate user context.
- Enforce owner checks.
- Persist business, Clawd, Scout Drop, campaign, usage, and subscription state.
- Process Stripe webhooks.
- Return read-only or payment-needed states safely.

### Core Packages

Current responsibilities:
- County/world contracts.
- CityWorldScene compiler.
- Render command/window contracts.
- Provider normalization and policy boundaries.

Future responsibilities:
- Versioned county pack references for saved artifacts.
- Stable source-note snapshotting.
- More reusable world/query contracts without leaking provider payloads.

### Data Layer

Recommended first provider:
Managed Postgres.

Provider options:
- Railway Postgres for operational simplicity near current deploy.
- Supabase Postgres if auth-adjacent tooling and RLS are desirable.
- Neon Postgres if branchable review databases matter.

Non-negotiables:
- Migrations committed and repeatable.
- Local/test database path exists.
- Every saved row has direct or inherited owner.
- No raw provider payloads.
- No success-URL access grants.

## 6. First Persistence Contract

The first persistence implementation should be boring and narrow.

In:
- authenticated user context
- persistent Clawd row
- business profile row
- saved Scout Drop summary and route
- saved campaign preview draft
- usage event rows
- ownership and idempotency tests

Out:
- Stripe
- evidence
- XP
- weekly reports
- exports
- automation
- teams/agencies
- provider-created geometry

First saved path:
Current map or Scout/Campaign preview -> Hosted Clawd setup -> Confirm Business
-> Confirm Location -> Create Hosted Clawd -> Save campaign preview -> Return to
map.

Required tests:
- unauthenticated write denied
- User A cannot read User B's Clawd
- User A cannot write User B's business profile
- repeated `client_request_id` does not duplicate Scout Drop or campaign
- session Clawd id cannot be loaded as persisted Clawd
- saved campaign references owned business profile and Scout Drop
- migration runs against empty database

## 7. Auth Model

Recommended v1:
Email-based single-user account ownership.

Rules:
- ChatGPT model text is never identity.
- Server validates authenticated session/account context before writes.
- Single-user ownership only for first Beta.
- No team, agency, staff, support impersonation, or organization model yet.
- If support access is added later, it must be audited.

Open implementation decision:
Pick auth provider/session strategy before writing persistence code.

## 8. Billing Model

Billing starts only after persistence works.

Recommended sequence:
1. Invite/internal persisted Beta with no live checkout.
2. Stripe test-mode subscription.
3. Webhook-synced subscription state.
4. Read-only inactive/payment-failed behavior.
5. Public paid claim only after human approval.

Stripe rules:
- Product/Price are server-owned.
- Client never submits trusted price.
- Success URL never grants access.
- Webhook state is the source of truth.
- Customer Portal requires owned stored Stripe customer id.
- No card data stored.

Internal planning price:
`$20/month`.

Public claim gate:
Do not show public pricing until `HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM` and money
gate are approved.

## 9. Evidence, XP, Reports, Exports

These are product multipliers, not first persistence work.

### Evidence

Purpose:
User-submitted proof for manual quests.

Requirements before implementation:
- owned quest context
- idempotency key
- review status
- allowed evidence types
- privacy/sensitive-content policy

No automatic regulated-action verification.

### XP

Purpose:
Progress feedback for completed manual work.

Requirements before implementation:
- immutable XP ledger
- totals derived from events
- duplicate prevention
- no merge from demo/session XP

### Weekly Reports

Purpose:
Summarize saved business progress.

Requirements before implementation:
- saved campaigns
- quest history
- evidence state
- owned source event ids
- no ROI guarantee

### Exports

Purpose:
Optional later portability.

Requirements before implementation:
- account export policy
- ownership checks
- rate limits
- privacy/legal review

## 10. Safety And Policy Boundaries

Atlas must not:
- auto-post
- auto-DM
- scrape private individuals
- target sensitive traits
- guarantee ROI
- silently persist state
- imply paid access before it exists
- create provider-derived geometry
- expose Anaheim/Ontario publicly before owner gate approval

Marketing outputs stay:
- public
- business-oriented
- manual
- clearly reviewable by the user

## 11. Observability And Operations

Minimum before persisted Beta:
- structured server logs for save attempts
- error codes for gate-closed, unauthenticated, forbidden, limit-exceeded,
  payment-needed, and validation failures
- webhook replay audit table before Stripe
- migration runbook
- rollback/restore note
- production env checklist
- no secrets in client bundles or verifier output

Minimum before paid Beta:
- subscription state audit
- payment failed state proof
- checkout abandoned recovery copy
- support/debug route policy
- uptime and smoke monitor for `/mcp` and `/preview`

## 12. QA Matrix

### Always Run For Product Surface Changes

- `pnpm typecheck`
- `pnpm build:web`
- focused verifier for changed surface
- desktop screenshot
- 390x844 screenshot
- console-error check
- horizontal overflow check

### Always Run For Server/Tool Changes

- `pnpm typecheck`
- `pnpm test:core`
- `pnpm verify:mcp`
- `node scripts/verify-tool-result-shape.mjs --json-only`
- provider boundary guard
- strict split guard

### Always Run For Persistence Changes

- migration check on empty DB
- unauthenticated denial test
- cross-owner denial test
- idempotency test
- usage-limit test
- no raw provider payload test
- free Alpha session-only regression test

### Always Run For Billing Changes

- Stripe test webhook replay
- subscription active unlock
- subscription inactive locks writes
- Customer Portal ownership check
- success URL does not grant access
- no public price claim unless gate open

## 13. Release Ladder

### 0.58K Human Visual Gate / Deploy Readiness Decision

Purpose:
Accept or reject the integrated visual/product branch.

Output:
`APPROVE_CANONICAL_DEPLOY` or named visual blockers.

### 0.58L Canonical Deploy And Live Verification

Purpose:
Deploy the integrated branch and prove it live.

Acceptance:
- Railway deploy succeeds.
- Public `/preview` works.
- Public `/mcp` lists seven tools.
- Public MCP flow passes.
- Public provider boundary/tool shape pass.
- Desktop/mobile browser proof exists from live URL.
- No DB/auth/Stripe/persistence opened.

### 0.58M Submission Packet Finalization

Purpose:
Make the ChatGPT app review packet complete.

Acceptance:
- submission JSON clean
- icon assets ready
- privacy/terms hosted
- screenshots updated
- app description honest
- Alpha/session-only limits explicit
- Hosted Clawd described as planned, not live paid access

### 0.59H Storage/Auth Decision Packet

Purpose:
Choose the real persistence foundation before code.

Acceptance:
- storage provider selected
- migration tool selected
- auth/session model selected
- first persisted capability selected
- local/test DB plan selected
- production DB path selected
- usage-limit behavior selected
- ownership/idempotency tests listed

### 0.60H Persistence Foundation

Purpose:
Implement first saved-state path without Stripe.

Acceptance:
- authenticated user context
- Clawd row
- business profile row
- saved Scout Drop
- saved campaign preview
- ownership/idempotency/limit tests
- map returns to saved status
- Alpha remains session-only when unauthenticated

### 0.61H Invite Beta Save UX

Purpose:
Make persistence understandable in the map-first UI.

Acceptance:
- confirm business
- confirm location
- save first artifact
- return to map
- inactive/no-auth states clear
- mobile proof

### 0.62H Stripe Test Billing

Purpose:
Attach money to proven persistence.

Acceptance:
- test product/price
- checkout session
- portal session
- webhook replay protection
- active subscription unlocks writes
- inactive subscription read-only
- success URL alone grants nothing

### 0.63H Paid Beta Launch Gate

Purpose:
Decide whether public paid claims can open.

Acceptance:
- human approves money and public-claim gates
- pricing copy approved
- support/runbook exists
- production smoke and rollback path exist
- no evidence/XP/report/export claim unless implemented

## 14. Feature Inventory

Done or local-green:
- map-first Riverside/Eastvale world
- county shell/unsupported honesty
- seven-tool MCP surface
- county question
- provider lookup behind adapter
- Scout Drop preview
- Campaign Preview
- Hosted Clawd setup console
- strict split/source-of-truth guards
- local browser proof for 0.58J

Needs deploy/submission proof:
- integrated branch live on production
- live desktop/mobile screenshots
- final submission assets
- privacy/terms/icon packet
- ChatGPT widget review proof

Needs decision before implementation:
- storage provider
- migration tool
- auth provider/session model
- first persisted capability exact fields
- usage-limit behavior
- Stripe timing

Needs implementation after approval:
- user identity
- owner-enforced persistence
- saved business profile
- saved Scout Drop
- saved campaign draft
- usage limits
- Stripe billing
- inactive/read-only paid states

Later:
- quests
- evidence
- XP
- weekly reports
- exports
- second playable district
- broader county coverage
- provider-to-readiness expansion

## 15. CTO Decision

The next big leap is not more visible features. It is converting the current
high-quality local proof into a live, reviewable app candidate, then opening
saved-state carefully.

Priority order:
1. Human visual/deploy decision.
2. Production deploy and live proof.
3. Submission packet.
4. Storage/auth decision.
5. First persistence foundation.
6. Billing only after persistence is boring.

This sequence protects what makes Atlas good: the map is the product, Clawd is
anchored to place, and paid value arrives as durable business memory rather than
a generic subscription page.
