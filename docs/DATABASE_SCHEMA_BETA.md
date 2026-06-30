# Atlas Beta Database Schema

Current maturity:
M0/M1 planning contract only. No database, auth, Stripe, evidence, or XP code has
been implemented.

Target maturity:
M3 Persisted Beta after human approval.

Human approval gate:
`HUMAN_APPROVAL_BEFORE_PERSISTENCE` and `HUMAN_APPROVAL_BEFORE_MONEY`.

## Core Invariants

- Free Clawd is session/demo state.
- Hosted Clawd is persistent account state.
- Demo XP and real XP must not mix.
- Every persisted row belongs to a user or organization.
- Paid tools check Hosted Clawd access server-side.
- Evidence and XP writes are idempotent.
- Provider-derived place data is not saved unless a source policy explicitly
  allows it.

## Minimum Entities

### users

Purpose:
Account owner for Hosted Clawd state.

Fields:
- `id`
- `email`
- `display_name`
- `created_at`
- `updated_at`

Tests:
- User can access only their own hosted state.

### clawds

Purpose:
Persistent Clawd daemon per user or business context.

Fields:
- `id`
- `owner_user_id`
- `display_name`
- `level`
- `xp_total`
- `status`
- `created_at`
- `updated_at`

Tests:
- Free/session Clawd IDs never resolve as persisted Clawd IDs.
- XP total changes only through `xp_events`.

### business_profiles

Purpose:
Saved business context for Scout Drops and campaigns.

Fields:
- `id`
- `owner_user_id`
- `clawd_id`
- `business_name`
- `business_type`
- `service_area`
- `offer_notes`
- `created_at`
- `updated_at`

Tests:
- User cannot read or update another user's business profile.
- Unsupported business lanes are refused or marked draft-only.

### county_packs

Purpose:
Versioned curated county data used by persisted campaign references.

Fields:
- `id`
- `slug`
- `version`
- `source_kind`
- `source_notes_json`
- `published_at`

Tests:
- Persisted Scout Drops keep the county pack version they were generated from.

### scout_drops

Purpose:
Saved Scout Drop result for a business profile and county slice.

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
- `created_at`

Tests:
- Saving the same client-generated id twice returns the original row.
- User cannot save a Scout Drop for another user's business profile.

### scout_signals

Purpose:
Normalized signals attached to a saved Scout Drop.

Fields:
- `id`
- `scout_drop_id`
- `label`
- `detail`
- `score`
- `tone`
- `source_node_ids_json`

Tests:
- Signals inherit access through their Scout Drop.

### campaigns

Purpose:
Saved manual campaign plan generated from a Scout Drop.

Fields:
- `id`
- `owner_user_id`
- `scout_drop_id`
- `business_profile_id`
- `status`
- `offer`
- `summary`
- `created_at`
- `updated_at`

Tests:
- Campaign must reference a Scout Drop owned by the same user.
- Campaign preview cannot be treated as saved campaign.

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

Tests:
- Campaign day writes are idempotent per campaign/day number.

### campaign_assets

Purpose:
Saved campaign copy/checklists/placeholders.

Fields:
- `id`
- `campaign_id`
- `channel`
- `format`
- `copy_intent`
- `body`
- `created_at`

Tests:
- Assets are drafts only; no automatic publishing.

### quests

Purpose:
Track manual user actions derived from campaign days.

Fields:
- `id`
- `campaign_id`
- `owner_user_id`
- `title`
- `status`
- `proof_required`
- `due_at`
- `completed_at`

Tests:
- Completing a quest twice does not double-award XP.

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
- `submitted_at`

Tests:
- Evidence belongs to the quest owner.
- Evidence submission is idempotent with a client request id.
- Evidence does not auto-verify sensitive or regulated actions.

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

Tests:
- Unique `idempotency_key`.
- XP cannot be updated in place.
- XP cannot be awarded without owned quest/evidence context.

### subscriptions

Purpose:
Hosted Clawd access status.

Fields:
- `id`
- `owner_user_id`
- `provider`
- `provider_customer_id`
- `status`
- `current_period_end`

Tests:
- Paid tools deny access when subscription is inactive.
- Webhook replay does not duplicate subscription state.

### usage_events

Purpose:
Plan limits and abuse controls.

Fields:
- `id`
- `owner_user_id`
- `event_type`
- `subject_id`
- `created_at`

Tests:
- Free and paid Scout Drop limits are enforced server-side.

### app_events

Purpose:
Audit trail for important user-visible actions.

Fields:
- `id`
- `owner_user_id`
- `event_type`
- `metadata_json`
- `created_at`

Tests:
- No secrets or raw provider payloads in metadata.

## Required Test Gates Before Implementation

- Ownership/access control for every persisted entity.
- Usage limits for free vs Hosted Clawd.
- Idempotency for Scout Drop save, campaign save, quest completion, evidence
  submission, XP grant, and subscription webhook replay.
- County pack parsing/version pinning.
- Map state schema validity.

## Out Of Scope Until Approved

- Stripe checkout.
- OAuth/account linking.
- Database migrations.
- XP grants.
- Evidence upload/storage.
- Automated posting, DMs, ads, or outreach.
