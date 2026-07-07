-- 0.62H Stripe Test Billing.
-- Test-mode billing state for Hosted Clawd only. Browser return URLs do not
-- grant access; paid writes derive from verified Stripe webhook state.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique
  ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS hosted_clawd_subscriptions (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_end TIMESTAMPTZ,
  last_invoice_id TEXT,
  last_payment_status TEXT,
  updated_from_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hosted_clawd_subscriptions_owner_id_unique UNIQUE (owner_user_id, id),
  CONSTRAINT hosted_clawd_subscriptions_status_check CHECK (
    status IN (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  )
);

CREATE INDEX IF NOT EXISTS hosted_clawd_subscriptions_owner_user_id_idx
  ON hosted_clawd_subscriptions(owner_user_id);

CREATE INDEX IF NOT EXISTS hosted_clawd_subscriptions_stripe_customer_id_idx
  ON hosted_clawd_subscriptions(stripe_customer_id);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT false,
  processing_status TEXT NOT NULL,
  error_summary TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stripe_webhook_events_processing_status_check CHECK (
    processing_status IN ('processing', 'processed', 'failed')
  )
);
