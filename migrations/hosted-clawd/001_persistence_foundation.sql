-- 0.60H Persistence Foundation.
-- Owner-protected Hosted Clawd rows only. Billing, evidence, XP, reports,
-- exports, and quest tables are deliberately not part of this migration.
-- Every saved row has a direct or inherited owner, and repeated
-- client_request_id writes must resolve to the original saved object.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  oidc_subject TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clawds (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clawds_owner_user_id_unique UNIQUE (owner_user_id),
  CONSTRAINT clawds_owner_id_unique UNIQUE (owner_user_id, id)
);

CREATE INDEX IF NOT EXISTS clawds_owner_user_id_idx ON clawds(owner_user_id);

CREATE TABLE IF NOT EXISTS business_profiles (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clawd_id TEXT NOT NULL REFERENCES clawds(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  service_area TEXT,
  primary_goal TEXT,
  offer_notes TEXT,
  county_slug TEXT NOT NULL,
  county_label TEXT,
  place_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_profiles_owner_id_unique UNIQUE (owner_user_id, id),
  CONSTRAINT business_profiles_owner_clawd_unique UNIQUE (owner_user_id, clawd_id),
  CONSTRAINT business_profiles_owner_clawd_fk FOREIGN KEY (owner_user_id, clawd_id)
    REFERENCES clawds(owner_user_id, id) ON DELETE CASCADE
);

-- Curated county pack references. Saved rows pin county slug and
-- source/version notes; raw provider payloads are never stored.
CREATE TABLE IF NOT EXISTS county_packs (
  id TEXT PRIMARY KEY,
  county_slug TEXT NOT NULL UNIQUE,
  county_label TEXT NOT NULL,
  source_note TEXT NOT NULL,
  pack_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scout_drops (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clawd_id TEXT NOT NULL REFERENCES clawds(id) ON DELETE CASCADE,
  business_profile_id TEXT REFERENCES business_profiles(id) ON DELETE SET NULL,
  scout_preview_id TEXT NOT NULL,
  county_slug TEXT NOT NULL,
  source_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scout_drops_owner_id_unique UNIQUE (owner_user_id, id),
  CONSTRAINT scout_drops_owner_preview_unique UNIQUE (owner_user_id, scout_preview_id),
  CONSTRAINT scout_drops_owner_clawd_fk FOREIGN KEY (owner_user_id, clawd_id)
    REFERENCES clawds(owner_user_id, id) ON DELETE CASCADE,
  CONSTRAINT scout_drops_owner_profile_fk FOREIGN KEY (owner_user_id, business_profile_id)
    REFERENCES business_profiles(owner_user_id, id)
);

CREATE TABLE IF NOT EXISTS scout_signals (
  id TEXT PRIMARY KEY,
  scout_drop_id TEXT NOT NULL REFERENCES scout_drops(id) ON DELETE CASCADE,
  signal_label TEXT NOT NULL,
  signal_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scout_signals_scout_drop_id_idx ON scout_signals(scout_drop_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clawd_id TEXT NOT NULL REFERENCES clawds(id) ON DELETE CASCADE,
  business_profile_id TEXT NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  scout_drop_id TEXT REFERENCES scout_drops(id) ON DELETE SET NULL,
  campaign_preview_id TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_owner_id_unique UNIQUE (owner_user_id, id),
  CONSTRAINT campaigns_owner_preview_unique UNIQUE (owner_user_id, campaign_preview_id),
  CONSTRAINT campaigns_owner_clawd_fk FOREIGN KEY (owner_user_id, clawd_id)
    REFERENCES clawds(owner_user_id, id) ON DELETE CASCADE,
  CONSTRAINT campaigns_owner_profile_fk FOREIGN KEY (owner_user_id, business_profile_id)
    REFERENCES business_profiles(owner_user_id, id) ON DELETE CASCADE,
  CONSTRAINT campaigns_owner_scout_drop_fk FOREIGN KEY (owner_user_id, scout_drop_id)
    REFERENCES scout_drops(owner_user_id, id)
);

CREATE TABLE IF NOT EXISTS campaign_days (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_days_campaign_day_unique UNIQUE (campaign_id, day_number)
);

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_owner_user_id_idx ON usage_events(owner_user_id);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  client_request_id TEXT NOT NULL,
  saved_records JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT idempotency_keys_pkey PRIMARY KEY (owner_user_id, operation, client_request_id)
);

CREATE TABLE IF NOT EXISTS app_events (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
