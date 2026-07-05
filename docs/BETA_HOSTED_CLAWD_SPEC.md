# Beta Hosted Clawd Spec

Status:
Technical contract and scaffold spec. This slice may add service interfaces and
OFF-by-default UI scaffolding, but it does not approve live persistence, auth,
checkout, paid access, evidence, XP, reports, or exports.

Current maturity:
M1 Curated Alpha with session-only Clawd.

Target maturity:
M3 Persisted Beta after human approval.

Human approval gates:
- `HUMAN_APPROVAL_BEFORE_PERSISTENCE`
- `HUMAN_APPROVAL_BEFORE_MONEY`
- `HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM`

## Product Contract

Hosted Clawd is the paid Beta path for preserving a business owner's Atlas
momentum inside the ChatGPT app. Free Alpha remains session-only: users can
explore Riverside/Eastvale, ask bounded county questions, run Scout Drop
previews, draft campaign previews, place pins, and write notes in the current
chat.

The upgrade promise is not a generic subscription. The promise is:

Host Clawd for this business so Atlas can remember the business, save scout
reports and campaign drafts, create manual quests, track evidence, and build
progress over time.

## State Model

### Alpha Free

Availability:
Default state until persistence and money gates are opened.

User can:
- explore the map
- ask county questions
- run temporary Scout Drop previews
- draft manual campaign previews
- place session pins and notes

User cannot:
- save business memory
- save Scout Drops or campaigns
- create real quests
- submit evidence
- earn real XP
- pay

UI label:
`Session-only until Hosted Clawd is live`

Primary action:
`Join Hosted Clawd waitlist`

### Beta Invite

Availability:
Only after `HUMAN_APPROVAL_BEFORE_PERSISTENCE`.

User can:
- create or attach a persisted Hosted Clawd
- save a confirmed business profile
- save a Scout Drop summary
- save a campaign preview draft

User cannot:
- use live Stripe checkout unless `HUMAN_APPROVAL_BEFORE_MONEY` is approved
- submit evidence or earn real XP unless later evidence/XP gates are approved
- automate outreach

UI label:
`Invite Beta`

Primary action:
`Create Hosted Clawd`

### Beta Paid

Availability:
Only after both `HUMAN_APPROVAL_BEFORE_PERSISTENCE` and
`HUMAN_APPROVAL_BEFORE_MONEY`.

User can:
- use Hosted Clawd while subscription state is active
- manage billing through Stripe Customer Portal
- save campaigns within plan limits

User cannot:
- bypass ownership checks
- grant access from a success URL alone
- keep paid writes after inactive, canceled, unpaid, incomplete, or past-due
  subscription state
- automate posting, DMs, ads, scraping, or outreach

UI labels:
- `Hosted Clawd is saving this business`
- `Hosted Clawd is read-only until billing is fixed`

## Gate Map

| Capability | Minimum gate | Default behavior while closed |
| --- | --- | --- |
| Waitlist surface | `NO_APPROVAL_NEEDED` if copy stays Alpha-labeled | Show waitlist copy only; no persisted write |
| Account identity | `HUMAN_APPROVAL_BEFORE_PERSISTENCE` | Return Alpha/waitlist state |
| Business profile persistence | `HUMAN_APPROVAL_BEFORE_PERSISTENCE` | Return Alpha/waitlist state |
| Session-to-hosted promotion | `HUMAN_APPROVAL_BEFORE_PERSISTENCE` | Show what would be saved; do not write |
| Saved Scout Drop | `HUMAN_APPROVAL_BEFORE_PERSISTENCE` | Keep preview session-only |
| Saved campaign draft | `HUMAN_APPROVAL_BEFORE_PERSISTENCE` | Keep preview session-only |
| Stripe Checkout | `HUMAN_APPROVAL_BEFORE_MONEY` and persistence ready | Say payment is not live in Alpha |
| Billing Portal | `HUMAN_APPROVAL_BEFORE_MONEY` | Do not create portal sessions |
| Subscription-gated writes | `HUMAN_APPROVAL_BEFORE_MONEY` | Disable paid writes |
| Evidence submission | Later evidence gate plus persistence | Do not accept evidence |
| XP ledger | Later XP gate plus persistence | Keep demo XP separate |
| Weekly report | Persistence plus activity history | Show planned only |
| Public pricing claim | `HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM` and money gate | Keep price as internal placeholder |

## Auth And Account Model

Recommended Beta model:
Email-based user account, single-user ownership first.

Rules:
- ChatGPT model text is not identity.
- Every persisted write requires authenticated server context.
- Every persisted row has `owner_user_id` directly or through a parent row.
- A free/session Clawd id can never be treated as a persisted Clawd id.
- Admin or support access, if added later, must be audited.
- Team, agency, shared workspace, staff seat, and organization roles are out of
  first paid Beta.

First implementation tests after approval:
- unauthenticated writes are denied
- User A cannot read or write User B's Clawd
- User A cannot save to User B's business profile
- session Clawd ids do not resolve as persisted ids

## Database Schema

Provider recommendation:
Managed Postgres. Supabase Postgres, Railway Postgres, or Neon Postgres are
acceptable after the human chooses the provider and migration path.

No migration is applied by this scaffold slice.

Minimum tables:

### users

Purpose:
Account owner for Hosted Clawd state.

Fields:
- `id`
- `email`
- `display_name`
- `stripe_customer_id`
- `created_at`
- `updated_at`

### clawds

Purpose:
Persistent Clawd daemon.

Fields:
- `id`
- `owner_user_id`
- `display_name`
- `level`
- `xp_total`
- `status`
- `created_at`
- `updated_at`

Rules:
- `xp_total` is derived from `xp_events`.
- Demo/session XP never merges into real XP.

### business_profiles

Purpose:
Saved business context.

Fields:
- `id`
- `owner_user_id`
- `clawd_id`
- `business_name`
- `business_type`
- `service_area`
- `primary_goal`
- `offer_notes`
- `created_at`
- `updated_at`

### county_packs

Purpose:
Versioned curated county source used by persisted artifacts.

Fields:
- `id`
- `slug`
- `version`
- `source_kind`
- `source_notes_json`
- `published_at`

### scout_drops

Purpose:
Saved Scout Drop result.

Fields:
- `id`
- `owner_user_id`
- `business_profile_id`
- `county_pack_id`
- `county_slug`
- `node_id`
- `business_type`
- `goal`
- `summary`
- `route_json`
- `client_request_id`
- `created_at`

Rules:
- `client_request_id` makes saving idempotent.
- Raw provider payloads are not stored.

### scout_signals

Purpose:
Normalized signals attached to a Scout Drop.

Fields:
- `id`
- `scout_drop_id`
- `label`
- `detail`
- `score`
- `tone`
- `source_node_ids_json`

### campaigns

Purpose:
Saved manual campaign draft.

Fields:
- `id`
- `owner_user_id`
- `scout_drop_id`
- `business_profile_id`
- `status`
- `offer`
- `summary`
- `client_request_id`
- `created_at`
- `updated_at`

Rules:
- Campaign drafts do not post, DM, buy ads, or submit forms.
- A campaign must reference an owned Scout Drop and business profile.

### campaign_days

Purpose:
Seven-day manual plan rows.

Fields:
- `id`
- `campaign_id`
- `day_number`
- `label`
- `channel`
- `steps_json`
- `proof_prompt`

### campaign_assets

Purpose:
Saved draft copy, checklists, and placeholders.

Fields:
- `id`
- `campaign_id`
- `channel`
- `format`
- `copy_intent`
- `body`
- `created_at`

### quests

Purpose:
Manual user actions derived from campaign days.

Fields:
- `id`
- `campaign_id`
- `owner_user_id`
- `title`
- `status`
- `proof_required`
- `due_at`
- `completed_at`

### evidence

Purpose:
User-submitted proof for a quest.

Fields:
- `id`
- `quest_id`
- `owner_user_id`
- `evidence_type`
- `uri_or_text`
- `review_status`
- `client_request_id`
- `submitted_at`

Rules:
- Evidence does not auto-verify regulated actions.
- Evidence does not expose private individuals or sensitive traits.

### xp_events

Purpose:
Immutable XP ledger.

Fields:
- `id`
- `owner_user_id`
- `clawd_id`
- `quest_id`
- `evidence_id`
- `amount`
- `reason`
- `idempotency_key`
- `created_at`

Rules:
- XP cannot be updated in place.
- XP cannot be awarded twice for the same evidence.

### subscriptions

Purpose:
Hosted Clawd access status.

Fields:
- `id`
- `owner_user_id`
- `provider`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_product_id`
- `stripe_price_id`
- `status`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `trial_end`
- `last_invoice_id`
- `last_payment_status`
- `updated_from_event_id`
- `created_at`
- `updated_at`

### stripe_webhook_events

Purpose:
Webhook replay protection and audit.

Fields:
- `id`
- `stripe_event_id`
- `event_type`
- `processing_status`
- `processed_at`
- `error_summary`

### usage_events

Purpose:
Plan limits and abuse controls.

Fields:
- `id`
- `owner_user_id`
- `event_type`
- `subject_id`
- `created_at`

### weekly_reports

Purpose:
Weekly business progress summary after campaigns, quests, and evidence exist.

Fields:
- `id`
- `owner_user_id`
- `clawd_id`
- `business_profile_id`
- `period_start`
- `period_end`
- `summary`
- `campaign_highlights_json`
- `open_quests_json`
- `source_event_ids_json`
- `created_at`

Rules:
- A weekly report is generated from owned saved state only.
- No report is generated in Alpha Free.

## Stripe External Checkout

Planned provider:
Stripe Billing with Stripe-hosted Checkout Sessions.

Planning catalog:
- Product: `Hosted Clawd Daemon`
- Internal lookup key: `hosted_clawd_monthly`
- Internal price placeholder: `$20/month`
- Server env placeholder: `STRIPE_HOSTED_CLAWD_PRICE_ID`

Rules:
- Stripe Checkout starts only after business context is confirmed.
- The client never submits a trusted price.
- The browser success URL never grants access.
- Webhook-synced subscription state is the only source for paid access.
- Customer Portal access requires the stored Stripe customer id to belong to the
  authenticated user.
- No raw card, bank, or payment method data is stored.

Future routes after approval:
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/stripe/webhook`

This scaffold may define interfaces for those calls. It must not call Stripe.

## Saved Campaign Contract

First paid Beta save target:
Business profile plus one campaign preview from an existing Scout Drop.

Promotion steps:
1. Confirm business fields.
2. Confirm county/place context and county pack version.
3. Create or attach Hosted Clawd.
4. Save Scout Drop summary and route.
5. Save campaign draft.
6. Return to the map with saved status visible.

Promotable after explicit confirmation:
- business name
- business type
- service area
- primary goal
- offer notes
- selected county and place context
- Scout Drop summary, route, and normalized signals
- Campaign Preview draft
- selected user-written notes

Never promoted automatically:
- demo/session XP
- raw provider payloads
- transient stickers
- unsupported claims
- inferred private details
- generated copy the user has not confirmed

## Evidence And XP

Evidence and XP are planned, not first-slice implementation.

Evidence rules:
- user submits proof manually
- every submission has an owner and idempotency key
- review state is explicit
- regulated or sensitive claims are not auto-verified

XP rules:
- XP is an immutable ledger
- XP totals derive from ledger events
- XP requires owned quest/evidence context
- repeated events do not double-award XP
- demo XP stays visibly separate from real XP

## Weekly Report

The weekly report is a later persisted Beta feature. It should summarize saved
business progress from owned campaigns, quests, evidence, and usage history.

Minimum content:
- saved business profile
- campaign work completed this week
- open quests
- evidence waiting for review
- next manual actions
- plan-limit status when useful

Anti-scope:
- no automated outreach
- no scraping
- no ROI guarantee
- no private-person targeting

## Usage Limits

Suggested Alpha Free limits:
- 3 Scout Drops per week
- 1 temporary business profile
- 1 active map session
- campaign preview only

Suggested Hosted limits:
- 25 Scout Drops per month
- 5 active campaigns
- 3 business profiles
- 3 active counties
- 100 campaign quests
- 100 saved assets
- evidence history saved for 12 months

Rules:
- Usage checks happen server-side before writes.
- Limit responses use the standard `limit_exceeded` shape.
- Invite Beta may use support-overridable limits if the human approves that
  policy before launch.

## Tool And Widget Boundaries

Current public MCP tools stay unchanged:
- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

No new public MCP tool is added by this scaffold. The existing upgrade tool may
return richer Hosted Clawd status, and existing map/scout/campaign tool metadata
may include widget-only Hosted Clawd state.

Widget rules:
- map remains first
- upgrade UI is a compact tray or modal from map, Scout Drop, or Campaign
  context
- session-only and saved-state labels are always visible
- checkout never appears before business context is confirmed
- mobile `390x844` must not horizontally scroll

## OFF-By-Default Scaffold Flags

Server flags:
- `ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED`
- `ATLAS_HOSTED_CLAWD_MONEY_ENABLED`
- `ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED`

Default:
All false.

Required behavior while false:
- persistence endpoints return Alpha/waitlist state, not a server error
- billing calls return payment-not-live state, not a checkout URL
- public copy avoids saved-state, paid-access, or pricing launch claims

## Acceptance For This Scaffold

- `docs/BETA_HOSTED_CLAWD_SPEC.md` exists and consolidates the scattered Hosted
  Clawd contracts.
- `docs/HOSTED_CLAWD_PRD.md` exists.
- Server has a Hosted Clawd service module with typed contracts for create or
  attach, session promotion, and saved campaign artifact writes.
- Persistence, billing, and public-claim behavior are behind OFF feature flags.
- When flags are off, routes and tool metadata return Alpha/waitlist behavior.
- Widget has a map-first Hosted Clawd upgrade tray with every screen state
  implemented.
- No live Stripe key, checkout call, auth provider, database client, applied
  migration, evidence write, XP grant, report export, or new MCP tool is added.
