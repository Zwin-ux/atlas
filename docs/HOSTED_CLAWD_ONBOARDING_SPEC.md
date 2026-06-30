# Hosted Clawd Onboarding Spec

Current quest:
E9.2 Hosted Clawd Onboarding Spec.

Current maturity:
M1 Curated Alpha planning only. The UI can discuss Hosted Clawd as planned Beta,
but it must not imply saved state or payment is live.

Target maturity:
M3 Persisted Beta once persistence and money gates are approved.

Human approval gates:
- `HUMAN_APPROVAL_BEFORE_PERSISTENCE`
- `HUMAN_APPROVAL_BEFORE_MONEY`
- `HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM`

## Product Goal

Turn an interesting Scout Drop into a clear hosted-memory decision:

Host Clawd for this business so Atlas can remember the business, save campaigns,
create quests, track evidence, and build progress over time.

The upgrade moment should feel like preserving momentum, not buying a generic
subscription.

## Entry Points

### Map Tray

When:
User has selected a place, dropped a sticker, or saved a session note.

Alpha copy:
`Session-only`

Alpha action:
`Join Hosted Clawd waitlist`

Beta action after approval:
`Host Clawd here`

### Scout Drop Preview

When:
Scout Drop has produced signals and a route.

Alpha copy:
`This scout report is temporary. Hosted Clawd will save it for this business.`

Beta action after approval:
`Save with Hosted Clawd`

### Campaign Preview

When:
Campaign Engine produces a seven-day plan.

Alpha copy:
`Preview only. Hosted Clawd will turn this into saved quests after Beta opens.`

Beta action after approval:
`Create campaign quests`

### Upgrade Tool Response

When:
User asks what Hosted Clawd unlocks or hits a save/evidence/XP boundary.

Alpha response:
Explain free limits, planned Hosted Clawd behavior, and the current waitlist or
approval status. Do not offer checkout.

## Onboarding Flow After Approval

### Step 1: Confirm Business

Purpose:
Anchor Hosted Clawd to one business context.

Fields:
- business name
- business type
- service area
- primary goal
- offer notes

Rules:
- Suggested fields can come from the current preview.
- User must confirm before saving.
- Unsupported business types can be saved as draft-only if approved.
- The confirmation screen must label the current session as temporary until the
  save completes.

### Step 2: Confirm Location Context

Purpose:
Preserve the county and place context without pretending live provider data has
become persistent truth.

Fields:
- county slug
- selected node or place label
- county pack version
- source notes

Rules:
- Curated county pack version is pinned.
- Live provider lookup results are not saved unless a source policy allows it.
- Raw provider payloads are never saved.

### Step 3: Create Hosted Clawd

Purpose:
Create or attach a persistent Clawd daemon to the business.

Fields:
- display name
- status
- owner user id
- linked business profile id

Rules:
- Free/session Clawd id is not reused as persisted id.
- Demo XP starts over or remains visibly separate from real XP.
- The UI must say when progress becomes saved.
- If account creation is canceled, the user returns to the same session-only map
  context when possible.

### Step 4: Save First Artifact

Recommended first artifact:
Saved campaign preview from the current Scout Drop.

Why:
It proves the paid value quickly while avoiding evidence/XP complexity.

Rules:
- Saving is idempotent by client request id.
- Saved campaign references owned business profile and Scout Drop.
- Campaign assets are drafts only.
- No posting, DMs, ads, or form submission.

### Step 5: Billing

Purpose:
Attach paid access after persistence works.

Rules:
- Starts only after `HUMAN_APPROVAL_BEFORE_MONEY`.
- Uses Stripe-hosted Checkout.
- Success URL never grants access alone.
- Webhook-synced subscription state enables Hosted Clawd writes.
- Failed or canceled checkout returns the user to the saved/in-progress
  onboarding context with clear unpaid status.
- If checkout succeeds before webhook sync is visible, show `Activating Hosted
  Clawd` and keep paid writes disabled until the server confirms active access.

### Step 6: Return To Map

Purpose:
Make the app feel continuous.

Visible state:
- map still opens first
- Hosted Clawd status is visible without a dashboard shell
- saved business/profile context appears in a compact HUD/tray
- saved campaign is reachable from the current place/business context

## States

### Alpha Free

State:
Session-only.

User can:
- explore
- ask county questions
- run Scout Drop previews
- generate campaign previews
- place local stickers and notes

User cannot:
- save business memory
- save campaigns
- create real quests
- submit evidence
- earn real XP
- pay

### Beta Invite

State:
Persisted for approved testers, unpaid or manually enabled.

User can:
- create account
- create Hosted Clawd
- save business profile
- save Scout Drops and campaign previews

User cannot:
- use live checkout unless money gate is approved
- submit evidence or earn real XP unless later gate is approved

### Beta Paid

State:
Persisted and Stripe-gated.

User can:
- manage billing through Stripe Customer Portal
- use Hosted Clawd access while subscription is active
- save campaigns within plan limits

User cannot:
- automate outreach
- bypass ownership or plan checks
- keep paid writes after inactive/canceled/unpaid subscription state

## Screen States

### Waitlist

Used before gates are approved.

Primary copy:
`Hosted Clawd is not live yet. Join the waitlist to save this business when Beta opens.`

Action:
`Join Hosted Clawd waitlist`

### Confirm Save

Used after persistence approval.

Primary copy:
`Save this business, scout report, and campaign draft to Hosted Clawd.`

Secondary copy:
`Session stickers and demo XP stay temporary unless you choose what to save.`

Action:
`Create Hosted Clawd`

### Checkout Pending

Used after money approval when billing is required.

Primary copy:
`Hosted Clawd needs an active subscription before it can save new campaign work.`

Action:
`Continue to Stripe`

### Activating

Used after Checkout redirect while waiting on server-confirmed subscription
state.

Primary copy:
`Activating Hosted Clawd. Saved writes unlock after billing is confirmed.`

Action:
`Refresh status`

### Active

Used when persistence and subscription checks pass.

Primary copy:
`Hosted Clawd is saving this business.`

Action:
`Open saved campaign`

### Inactive Or Payment Failed

Used when subscription state is inactive, unpaid, canceled, incomplete, or past
due.

Primary copy:
`Hosted Clawd is read-only until billing is fixed.`

Action:
`Open billing portal`

## Mobile Expectations

- Upgrade UI must fit inside the existing map-first overlay model.
- No full pricing page takes over the first viewport.
- Primary action stays reachable with one thumb on `390x844`.
- Long explanations collapse behind small detail rows.
- Session-only and saved-state labels remain visible without horizontal scroll.

## Copy Rules

Use:
- `Host Clawd for this business`
- `Save this scout report`
- `Turn this campaign into quests`
- `Session-only until Hosted Clawd is live`
- `Payment is not live in Alpha`

Avoid:
- `unlimited`
- `autopilot`
- `guaranteed leads`
- `AI employee`
- `hands-free marketing`
- `seamless`
- `revolutionary`

## UI Shape

Keep Atlas map-first.

Do:
- use a compact upgrade tray or modal from the map/campaign context
- keep copy direct and specific
- show what will be saved before asking for account/payment
- make session-only vs saved state visually obvious

Do not:
- build a generic pricing homepage
- add dashboard cards as the first screen
- bury the map behind account setup
- show checkout before business context is confirmed

## Session Promotion Rules

The user must confirm every item that becomes persistent.

Promotable:
- confirmed business profile fields
- selected county/place context
- Scout Drop preview summary and route
- Campaign Preview draft
- user-written notes selected for saving

Not promoted automatically:
- demo/session XP
- raw provider payloads
- transient sticker placement
- unsupported claims or inferred private details
- unconfirmed generated copy

## Acceptance Criteria

Before implementation:
- onboarding entry points are documented
- session-only, invite Beta, and paid Beta states are distinct
- first saved artifact is chosen
- copy avoids payment/saved-state claims before gates
- Stripe is positioned after persistence
- evidence and XP stay later

Before Beta launch:
- user can see what will be saved
- user can cancel before account creation
- user can recover from failed checkout without losing the preview context
- user can return to the map after onboarding
- user can tell whether Hosted Clawd is active, inactive, or session-only

## Anti-Scope

- no generic SaaS landing page
- no public pricing launch copy without approval
- no checkout implementation
- no auth implementation
- no persistence implementation
- no evidence upload
- no XP grant
- no automation
