-- postalpha-0.81c Atlas ALL public-notes foundation.
-- Additive, default-off storage for moderated public place notes.

CREATE TABLE IF NOT EXISTS atlas_public_notes (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_handle TEXT NOT NULL,
  county_slug TEXT NOT NULL,
  place_id TEXT NOT NULL,
  place_label TEXT NOT NULL,
  body TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  client_request_id TEXT NOT NULL,
  removal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  CONSTRAINT atlas_public_notes_owner_request_unique UNIQUE (owner_user_id, client_request_id),
  CONSTRAINT atlas_public_notes_body_length CHECK (char_length(body) BETWEEN 1 AND 240),
  CONSTRAINT atlas_public_notes_status_check CHECK (moderation_status IN ('pending', 'visible', 'removed'))
);

CREATE INDEX IF NOT EXISTS atlas_public_notes_public_scope_idx
  ON atlas_public_notes(moderation_status, county_slug, place_id, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS atlas_public_notes_owner_idx
  ON atlas_public_notes(owner_user_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS atlas_note_reactions (
  note_id TEXT NOT NULL REFERENCES atlas_public_notes(id) ON DELETE CASCADE,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT atlas_note_reactions_pkey PRIMARY KEY (note_id, owner_user_id)
);

CREATE INDEX IF NOT EXISTS atlas_note_reactions_owner_idx ON atlas_note_reactions(owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_note_reports (
  note_id TEXT NOT NULL REFERENCES atlas_public_notes(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT atlas_note_reports_pkey PRIMARY KEY (note_id, reporter_user_id),
  CONSTRAINT atlas_note_reports_reason_check CHECK (reason IN ('spam', 'harassment', 'privacy', 'misleading', 'other'))
);

CREATE INDEX IF NOT EXISTS atlas_note_reports_reporter_idx ON atlas_note_reports(reporter_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_note_moderation_events (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES atlas_public_notes(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  next_status TEXT NOT NULL,
  operator_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT atlas_note_moderation_previous_status_check CHECK (previous_status IN ('pending', 'visible', 'removed')),
  CONSTRAINT atlas_note_moderation_next_status_check CHECK (next_status IN ('visible', 'removed'))
);

CREATE INDEX IF NOT EXISTS atlas_note_moderation_events_note_idx
  ON atlas_note_moderation_events(note_id, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_commons_actions (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT atlas_commons_actions_kind_check CHECK (action_kind IN ('post', 'react', 'unreact', 'report'))
);

CREATE INDEX IF NOT EXISTS atlas_commons_actions_owner_time_idx
  ON atlas_commons_actions(owner_user_id, created_at DESC);
