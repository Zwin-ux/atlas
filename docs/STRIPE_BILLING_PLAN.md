# Stripe Billing Plan For Hosted Clawd

Current maturity:
M1 Curated Alpha planning only. Stripe is connected for planning, but Atlas has
not created products, prices, checkout sessions, customers, webhook endpoints, or
subscription-gated code.

Target maturity:
M3 Persisted Beta after human approval.

Human approval gates:
- `HUMAN_APPROVAL_BEFORE_MONEY`
- `HUMAN_APPROVAL_BEFORE_PERSISTENCE`

Connected Stripe account:
- Account id: `acct_1RTDWJKHzChTixtj`
- Display name: `ColdCopy`

Do not treat the connected account as approval to charge users. It only means
the integration can be planned against the real Stripe workspace.

## Product Shape

Hosted Clawd is a SaaS subscription, not a one-time purchase.

Recommended Stripe products:
- Stripe Billing for subscriptions, invoices, recurring payments, and lifecycle
  events.
- Stripe-hosted Checkout Sessions with `mode: subscription`.
- Stripe Products and Prices for the Hosted Clawd catalog.
- Stripe Customer Portal for self-service payment method updates, cancellation,
  and invoices.
- Stripe webhooks as the source for granting, updating, and removing paid access.

Do not use raw PaymentIntents for the subscription signup flow. Do not build a
custom card form for Beta unless the hosted Checkout path fails a real product
requirement.

## Planned Catalog

Product:
`Hosted Clawd Daemon`

Price:
`$20/month`, monthly recurring, USD.

Lookup key:
`hosted_clawd_monthly`

Internal environment placeholder:
`STRIPE_HOSTED_CLAWD_PRICE_ID`

The lookup key keeps docs and code stable if the actual test/live Price id
changes. The Price id still lives server-side.

## Planned Environment

Server-only:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_HOSTED_CLAWD_PRICE_ID`
- `STRIPE_API_VERSION=2026-02-25.clover`

Shared public app base:
- `APP_BASE_URL`

Client/browser code must not receive `STRIPE_SECRET_KEY`, webhook secrets, raw
webhook payloads, or trusted subscription state.

## Future Server Routes

These routes are planned only. Do not implement before the gates are approved.

### `POST /api/billing/checkout`

Creates a Stripe Checkout Session for Hosted Clawd.

Requires:
- authenticated user
- server-side requested plan allowlist
- no active paid subscription for the same Hosted Clawd context
- human-approved pricing copy

Stripe call:
- Checkout Session
- `mode: subscription`
- line item uses server-owned Hosted Clawd Price id or lookup-key-resolved Price
- success/cancel URLs point back to Atlas

Returns:
- Stripe-hosted checkout URL

Must not:
- trust a client-submitted price amount
- grant access from the success URL alone
- create persistent Clawd state until webhook-backed subscription state is stored

### `POST /api/billing/portal`

Creates a Stripe Customer Portal Session.

Requires:
- authenticated user
- stored Stripe customer id owned by that user

Returns:
- Stripe-hosted portal URL

Must not:
- expose another user's customer id
- change plan state without webhook confirmation

### `POST /api/stripe/webhook`

Receives Stripe webhook events and syncs subscription state.

Requires:
- raw request body signature verification
- idempotent event handling
- event id replay protection

Minimum events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Access rule:
Atlas paid access is derived from stored subscription state updated by verified
webhooks, not by the browser redirect.

## Data Model Additions

Add these fields when persistence is approved.

### `users`

Add:
- `stripe_customer_id`

Rules:
- unique when present
- never exposed to another user

### `subscriptions`

Add or refine:
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_price_id`
- `stripe_product_id`
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

Rules:
- unique `stripe_subscription_id`
- paid Hosted Clawd access requires an allowed active-like status
- inactive, canceled, incomplete, unpaid, or disputed states deny paid writes
- plan limits are derived server-side from the stored subscription row

### `stripe_webhook_events`

Purpose:
Replay guard and audit trail for subscription sync.

Fields:
- `id`
- `stripe_event_id`
- `event_type`
- `processed_at`
- `processing_status`
- `error_summary`

Rules:
- unique `stripe_event_id`
- no raw payment method data stored

## Tool Contract Impact

Future paid tools must check Hosted Clawd access through server-owned state:
- authenticated user
- owned Hosted Clawd context
- subscription status synced from Stripe webhook events
- plan limits from the server catalog

The model can ask to start checkout only after the user explicitly chooses the
paid path. Atlas must never start checkout silently from a free tool call.

## Test Gates Before Code

Required before merging billing implementation:
- Checkout Session uses server-owned Price id or lookup key.
- Success URL alone never grants access.
- Webhook signature verification rejects unsigned or modified payloads.
- Webhook replay is idempotent by Stripe event id.
- Subscription status changes update the stored row exactly once.
- Paid tools deny access for missing, inactive, canceled, unpaid, incomplete, or
  expired subscription states.
- Customer Portal route denies access when the customer id is not owned by the
  authenticated user.
- Test-mode cancellation removes paid writes while preserving readable account
  history as product policy allows.

## Build Order After Approval

1. Create test-mode Stripe Product and Price for `Hosted Clawd Daemon`.
2. Add server env validation for Stripe keys and Price id.
3. Add database tables and ownership tests.
4. Add webhook route with signature verification and idempotency.
5. Add checkout route that creates hosted subscription sessions.
6. Add Customer Portal route.
7. Gate Hosted Clawd tools from stored subscription state.
8. Run test-mode checkout, failed payment, cancellation, and portal QA.
9. Ask for live-money approval before copying catalog/settings to live mode.

## Anti-Scope

- No live checkout in Alpha.
- No Payment Links as the primary product flow.
- No client-side price trust.
- No custom card handling.
- No storage of raw card or bank data.
- No persistence, evidence, XP, or paid access until the human gates are cleared.
