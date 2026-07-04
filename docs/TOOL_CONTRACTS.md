# Atlas Apps SDK / MCP Tool Contracts

## Exposed Alpha tools

The current MCP server exposes only the tools below. Future free Clawd state and
saved Hosted Clawd tools remain out of scope until their service layers exist.

### select_county
Use when the user opens Atlas for a supported county.

Inputs:
- countySlug optional, Alpha supports `riverside-ca`

Model-visible output:
- compact scene summary
- selected node id, currently Eastvale for the Riverside demo
- selected district id and active scale
- district/place/sticker/note counts
- route node ids
- flow state

Widget-only `_meta`:
- full compiled `VoxelScene`

Rules:
- Compiles from the curated county pack.
- Does not expose raw Google or provider payloads.
- Does not save state.

### ask_county_question
Use when the user asks a basic Riverside/Eastvale county or business question
that can be answered from the curated Alpha pack.

Inputs:
- question
- countySlug optional, Alpha supports `riverside-ca`
- businessType optional, supported score lanes are mobile detailing, cleaning,
  and local event

Output:
- direct closed-world answer
- supported/refused flag
- topic
- source-labeled facts
- curated source notes
- Alpha limitations
- suggested next Atlas tool when useful

Rules:
- Uses curated Riverside pack facts and source notes only.
- Does not call Google or live providers.
- Narrows or refuses unsupported counties and unsupported business claims.
- Does not save state, grant XP, create campaigns, or claim live market truth.

### render_voxel_county
Use when the user wants to see the voxel map.

Inputs:
- countySlug
- selectedNodeId optional

Model-visible output:
- compact scene summary
- selected node id
- selected district id when available
- active map scale when available
- district/place/sticker/note counts when available
- route node ids
- flow state

Widget-only `_meta`:
- full `VoxelScene`

### lookup_world_places
Use when the user asks to look up real nearby places or place categories for a location.

Inputs:
- query
- radiusMeters optional, defaults to 3500

Output:
- resolved location summary
- normalized Atlas place summaries
- provider-independent place categories
- cache policy and source notes
- runtime cache status for the lookup response

Apps SDK shape:
- `structuredContent` contains normalized Atlas data only.
- Does not expose raw provider fields such as Google `primaryType`, `types`, or `placeId`.
- Place summary ids are Atlas-owned `lookup-*` ids, not Google/provider ids.
- Marked `openWorldHint: true` because it can call Google Maps Platform.
- Does not save places, compile a live city scene, or modify external systems.
- Uses a bounded in-memory server cache for successful lookups; this is not user persistence.

### preview_scout_drop
Use when free user drops Clawd into a location.

Inputs:
- countySlug
- nodeId or locationLabel
- businessType
- goal

Output:
- ScoutPreviewState
- signals
- route
- limitations
- upgrade prompt if relevant

Apps SDK shape:
- `structuredContent` stays concise and excludes the full renderer scene.
- `_meta.scoutPreview` carries the widget-only scene and report panel data.

### preview_campaign_engine
Use when user wants a basic campaign preview from a scout report.

Inputs:
- scoutPreviewId from `preview_scout_drop`
- countySlug optional
- nodeId or locationLabel optional
- businessType optional
- goal optional
- budget optional
- serviceRadius optional

Output:
- campaign preview
- 7-day plan preview
- asset previews
- route priorities
- manual guardrails

### get_upgrade_options
Use when user asks about hosting Clawd or hits persistence/action limits.

Inputs:
- trigger optional

Output:
- free Alpha limits
- planned Hosted Clawd Beta capabilities
- unavailable Alpha actions
- next step

## Future paid/hosted tools

### start_hosted_clawd_checkout
Creates a Stripe-hosted Checkout Session for Hosted Clawd.

Maturity:
M3 Persisted Beta only after `HUMAN_APPROVAL_BEFORE_MONEY`.

Requires:
- authenticated user
- explicit user intent to upgrade
- server-owned Stripe Price id or lookup key
- no client-trusted price amount

Returns:
- Stripe-hosted checkout URL

Must not:
- start checkout silently from a free tool call
- grant access from the success URL alone
- expose Stripe secrets
- create persisted Clawd state without webhook-backed subscription sync

### open_billing_portal
Creates a Stripe Customer Portal Session for an existing Hosted Clawd subscriber.

Maturity:
M3 Persisted Beta only after `HUMAN_APPROVAL_BEFORE_MONEY`.

Requires:
- authenticated user
- stored Stripe customer id owned by that user
- existing subscription or billing history

Returns:
- Stripe-hosted portal URL

Must not:
- accept arbitrary customer ids from the client
- mutate Atlas plan state without webhook confirmation

### host_clawd
Creates or activates Hosted Clawd Daemon.

Maturity:
M3 Persisted Beta only.

Requires:
- authenticated user
- active subscription state synced from Stripe webhooks
- server-side plan check

Must not:
- start checkout silently
- create a persistent Clawd from a free/session Clawd without user confirmation
- mix demo XP with real XP

### get_hosted_clawd_state
Loads persistent Clawd state.

Requires:
- authenticated user
- owner access to the Clawd id

Returns:
- Clawd level and XP total
- linked business profiles
- saved Scout Drop and campaign summaries
- no raw provider payloads

### create_business_profile
Saves business context.

Requires:
- Hosted Clawd access
- ownership of target Clawd
- supported business type or explicit draft-only status

Idempotency:
- client request id should prevent duplicate profiles

### drop_scout
Creates saved Scout Drop.

Requires:
- Hosted Clawd access
- business profile owned by the user
- county pack version pinned to the saved result

Idempotency:
- repeated save of the same preview/request id returns the original Scout Drop

### generate_local_campaign
Creates full campaign from scout report.

Requires:
- saved Scout Drop owned by the user
- manual-action guardrails preserved

Must not:
- post, DM, buy ads, submit forms, or execute outreach

### save_campaign
Persists campaign.

Requires:
- Hosted Clawd access
- owned Scout Drop
- idempotency key

### create_campaign_quests
Turns campaign into quests.

Requires:
- owned campaign
- quest limit check

Must not:
- grant XP when quests are created

### submit_campaign_evidence
Submits proof of campaign work.

Requires:
- owned quest
- idempotency key
- evidence review status

Must not:
- auto-verify regulated actions
- expose private individuals or sensitive traits

### verify_campaign_progress
Verifies evidence and grants XP.

Requires:
- owned quest/evidence
- idempotent XP event
- clear review status transition

Must not:
- update XP totals directly outside the XP ledger
- award XP twice for the same evidence

### export_campaign
Exports campaign to Markdown/PDF/CSV.

Requires:
- owned campaign
- export format allowlist

Must not:
- include secrets, raw provider payloads, or private contact data

## Tool design rules

- Tools should return concise structuredContent.
- Widget-only display data goes into metadata/state, but never secrets.
- Alpha tools do not auto-post, auto-DM, execute advertising, create accounts, run checkout, save evidence, grant XP, or persist campaigns.
- Paid tools must check plan server-side.
- Free tools must not pretend temporary state is permanent.

## Future hosted failure shapes

Future Hosted Clawd tools should use consistent refusal/error payloads so the
model, widget, and user see the same boundary.

### unauthenticated

Use when:
The request has no valid account session.

Response shape:
- `status: "blocked"`
- `reason: "unauthenticated"`
- `message`: explain that Hosted Clawd requires sign-in
- `nextAction`: `sign_in`

### persistence_not_enabled

Use when:
The feature is still Alpha/session-only or the human persistence gate has not
been crossed.

Response shape:
- `status: "blocked"`
- `reason: "persistence_not_enabled"`
- `message`: explain that saving is not live yet
- `nextAction`: `join_waitlist` or `continue_session`

### subscription_inactive

Use when:
The user is authenticated but does not have webhook-confirmed active Hosted
Clawd access.

Response shape:
- `status: "blocked"`
- `reason: "subscription_inactive"`
- `message`: explain that paid writes require active Hosted Clawd
- `nextAction`: `start_checkout` or `open_billing_portal`

### wrong_owner

Use when:
The user tries to read or write another user's persisted object.

Response shape:
- `status: "blocked"`
- `reason: "wrong_owner"`
- `message`: avoid leaking whether the target object exists
- `nextAction`: `select_owned_resource`

### limit_exceeded

Use when:
The plan limit is reached.

Response shape:
- `status: "blocked"`
- `reason: "limit_exceeded"`
- `limitName`
- `resetAt` when applicable
- `nextAction`: `upgrade`, `manage_plan`, or `wait_for_reset`

### idempotency_conflict

Use when:
The client request id was already used for a different payload.

Response shape:
- `status: "blocked"`
- `reason: "idempotency_conflict"`
- `message`: ask the client to retry with a new request id
- `nextAction`: `retry_with_new_request_id`
