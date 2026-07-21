import { randomUUID } from "node:crypto";
import type {
  AtlasCommonsCreateNoteInput,
  AtlasCommonsListQuery,
  AtlasCommonsRepository,
  AtlasCommonsUserRecord,
} from "./repository.js";
import type { AtlasCommonsNoteRecord, AtlasCommonsNoteStatus } from "./types.js";

type QueryRow = Record<string, unknown>;
type PoolLike = {
  query(sql: string, params?: unknown[]): Promise<{ rows: QueryRow[] }>;
};

const NOTE_COLUMNS = `
  n.id, n.owner_user_id, n.author_handle, n.county_slug, n.place_id, n.place_label,
  n.body, n.moderation_status, n.client_request_id, n.created_at, n.published_at, n.removed_at,
  (SELECT count(*)::int FROM atlas_note_reactions r WHERE r.note_id = n.id) AS reaction_count,
  (SELECT count(*)::int FROM atlas_note_reports p WHERE p.note_id = n.id) AS report_count`;

export function createPostgresAtlasCommonsRepository(pool: PoolLike): AtlasCommonsRepository {
  return {
    async health() {
      const { rows } = await pool.query("SELECT to_regclass('public.atlas_public_notes') IS NOT NULL AS ready");
      return rows[0]?.ready === true;
    },

    async upsertUserByOidcSubject(oidcSubject, email) {
      const { rows } = await pool.query(
        `INSERT INTO users (id, oidc_subject, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (oidc_subject)
         DO UPDATE SET email = COALESCE(EXCLUDED.email, users.email), updated_at = now()
         RETURNING id, oidc_subject, email`,
        [randomUUID(), oidcSubject, email ?? null],
      );
      return userFromRow(requireRow(rows[0], "users"));
    },

    async findUserByOidcSubject(oidcSubject) {
      const { rows } = await pool.query("SELECT id, oidc_subject, email FROM users WHERE oidc_subject = $1", [oidcSubject]);
      return rows[0] ? userFromRow(rows[0]) : null;
    },

    async countRecentActions(ownerUserId, since) {
      const { rows } = await pool.query(
        "SELECT count(*)::int AS action_count FROM atlas_commons_actions WHERE owner_user_id = $1 AND created_at >= $2::timestamptz",
        [ownerUserId, since],
      );
      return Number(rows[0]?.action_count ?? 0);
    },

    async createNote(input) {
      const noteId = randomUUID();
      const { rows } = await pool.query(
        `WITH inserted AS (
           INSERT INTO atlas_public_notes (
             id, owner_user_id, author_handle, county_slug, place_id, place_label, body, client_request_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (owner_user_id, client_request_id) DO NOTHING
           RETURNING *
         ), logged AS (
           INSERT INTO atlas_commons_actions (id, owner_user_id, action_kind)
           SELECT $9, owner_user_id, 'post' FROM inserted
         ), selected AS (
           SELECT * FROM inserted
           UNION ALL
           SELECT * FROM atlas_public_notes
           WHERE owner_user_id = $2 AND client_request_id = $8 AND NOT EXISTS (SELECT 1 FROM inserted)
           LIMIT 1
         )
         SELECT ${NOTE_COLUMNS.replaceAll("n.", "s.")},
                EXISTS (SELECT 1 FROM inserted) AS inserted,
                false AS viewer_has_reacted
         FROM selected s`,
        [noteId, input.ownerUserId, input.authorHandle, input.countySlug, input.placeId, input.placeLabel, input.body, input.clientRequestId, randomUUID()],
      );
      const row = requireRow(rows[0], "atlas_public_notes");
      return { note: noteFromRow(row), reused: row.inserted !== true };
    },

    async listNotes(input) {
      return input.mode === "mine" ? listMine(pool, input) : listPublic(pool, input);
    },

    async getNoteForViewer(noteId, viewerUserId) {
      const { rows } = await pool.query(
        `SELECT ${NOTE_COLUMNS},
                CASE WHEN $2::text IS NULL THEN NULL
                     ELSE EXISTS (SELECT 1 FROM atlas_note_reactions vr WHERE vr.note_id = n.id AND vr.owner_user_id = $2)
                END AS viewer_has_reacted
         FROM atlas_public_notes n
         WHERE n.id = $1 AND (n.moderation_status = 'visible' OR n.owner_user_id = $2)`,
        [noteId, viewerUserId ?? null],
      );
      return rows[0] ? noteFromRow(rows[0]) : null;
    },

    async setReaction(noteId, ownerUserId, active) {
      const mutation = active
        ? `INSERT INTO atlas_note_reactions (note_id, owner_user_id)
           SELECT id, $2 FROM target ON CONFLICT DO NOTHING RETURNING note_id`
        : `DELETE FROM atlas_note_reactions
           WHERE note_id IN (SELECT id FROM target) AND owner_user_id = $2 RETURNING note_id`;
      const { rows } = await pool.query(
        `WITH target AS (
           SELECT id FROM atlas_public_notes WHERE id = $1 AND moderation_status = 'visible'
         ), changed AS (
           ${mutation}
         ), logged AS (
           INSERT INTO atlas_commons_actions (id, owner_user_id, action_kind)
           SELECT $3, $2, $4 FROM changed
         )
         SELECT EXISTS (SELECT 1 FROM target) AS found,
                EXISTS (SELECT 1 FROM changed) AS changed`,
        [noteId, ownerUserId, randomUUID(), active ? "react" : "unreact"],
      );
      const result = requireRow(rows[0], "atlas_public_notes");
      if (result.found !== true) throw new Error("NOTE_NOT_FOUND:atlas_public_notes");
      const note = await selectNoteById(pool, noteId, ownerUserId);
      return { note, changed: result.changed === true };
    },

    async reportNote(noteId, reporterUserId, reason, threshold) {
      const { rows } = await pool.query(
        `WITH target AS (
           SELECT id FROM atlas_public_notes
           WHERE id = $1 AND moderation_status = 'visible' AND owner_user_id <> $2
         ), inserted AS (
           INSERT INTO atlas_note_reports (note_id, reporter_user_id, reason)
           SELECT id, $2, $3 FROM target
           ON CONFLICT DO NOTHING
           RETURNING note_id
         ), logged AS (
           INSERT INTO atlas_commons_actions (id, owner_user_id, action_kind)
           SELECT $5, $2, 'report' FROM inserted
         ), report_total AS (
           SELECT (
             (SELECT count(*) FROM atlas_note_reports WHERE note_id IN (SELECT id FROM target))
             + (SELECT count(*) FROM inserted)
           )::int AS value
         ), hidden AS (
           UPDATE atlas_public_notes
           SET moderation_status = 'removed', removed_at = now(), removal_reason = 'report_threshold'
           WHERE id IN (SELECT id FROM target)
             AND (SELECT value FROM report_total) >= $4
           RETURNING id
         )
         SELECT EXISTS (SELECT 1 FROM target) AS found,
                EXISTS (SELECT 1 FROM inserted) AS changed,
                EXISTS (SELECT 1 FROM hidden) AS threshold_reached`,
        [noteId, reporterUserId, reason, threshold, randomUUID()],
      );
      const result = requireRow(rows[0], "atlas_public_notes");
      if (result.found !== true) throw new Error("NOTE_NOT_FOUND:atlas_public_notes");
      const note = await selectNoteById(pool, noteId, reporterUserId);
      return { note, changed: result.changed === true, thresholdReached: result.threshold_reached === true };
    },

    async moderateNote(noteId, status, operatorLabel) {
      const { rows } = await pool.query(
        `WITH prior AS (
           SELECT moderation_status FROM atlas_public_notes WHERE id = $1
         ), updated AS (
           UPDATE atlas_public_notes
           SET moderation_status = $2,
               published_at = CASE WHEN $2 = 'visible' THEN COALESCE(published_at, now()) ELSE published_at END,
               removed_at = CASE WHEN $2 = 'removed' THEN now() ELSE NULL END,
               removal_reason = CASE WHEN $2 = 'removed' THEN 'operator' ELSE NULL END
           WHERE id = $1
           RETURNING *
         ), audited AS (
           INSERT INTO atlas_note_moderation_events (id, note_id, previous_status, next_status, operator_label)
           SELECT $4, $1, prior.moderation_status, $2, $3 FROM prior, updated
         )
         SELECT ${NOTE_COLUMNS.replaceAll("n.", "u.")},
                prior.moderation_status AS previous_status,
                false AS viewer_has_reacted
         FROM updated u, prior`,
        [noteId, status, operatorLabel, randomUUID()],
      );
      const row = requireRow(rows[0], "atlas_public_notes");
      return { note: noteFromRow(row), previousStatus: String(row.previous_status) as AtlasCommonsNoteStatus };
    },
  };
}

async function selectNoteById(pool: PoolLike, noteId: string, viewerUserId?: string): Promise<AtlasCommonsNoteRecord> {
  const { rows } = await pool.query(
    `SELECT ${NOTE_COLUMNS},
            CASE WHEN $2::text IS NULL THEN NULL
                 ELSE EXISTS (SELECT 1 FROM atlas_note_reactions vr WHERE vr.note_id = n.id AND vr.owner_user_id = $2)
            END AS viewer_has_reacted
     FROM atlas_public_notes n WHERE n.id = $1`,
    [noteId, viewerUserId ?? null],
  );
  return noteFromRow(requireRow(rows[0], "atlas_public_notes"));
}

async function listPublic(pool: PoolLike, input: AtlasCommonsListQuery): Promise<AtlasCommonsNoteRecord[]> {
  const asOf = input.cursor?.asOf ?? new Date().toISOString();
  const params: unknown[] = [input.viewerUserId ?? null, asOf, input.countySlug ?? null, input.placeId ?? null];
  let cursorWhere = "";
  if (input.cursor) {
    if (input.sort === "hot") {
      params.push(input.cursor.score, input.cursor.timestamp, input.cursor.id);
      cursorWhere = `AND (score < $5 OR (score = $5 AND (published_at < $6::timestamptz OR (published_at = $6::timestamptz AND id < $7))))`;
    } else {
      params.push(input.cursor.timestamp, input.cursor.id);
      cursorWhere = `AND (published_at < $5::timestamptz OR (published_at = $5::timestamptz AND id < $6))`;
    }
  }
  params.push(input.limit);
  const limitParam = `$${params.length}`;
  const order = input.sort === "hot" ? "score DESC, published_at DESC, id DESC" : "published_at DESC, id DESC";
  const { rows } = await pool.query(
    `WITH ranked AS (
       SELECT ${NOTE_COLUMNS},
              CASE WHEN $1::text IS NULL THEN NULL
                   ELSE EXISTS (SELECT 1 FROM atlas_note_reactions vr WHERE vr.note_id = n.id AND vr.owner_user_id = $1)
              END AS viewer_has_reacted,
              ((SELECT count(*) FROM atlas_note_reactions r WHERE r.note_id = n.id) * 4
                - (SELECT count(*) FROM atlas_note_reports p WHERE p.note_id = n.id) * 8
                - GREATEST(0, EXTRACT(EPOCH FROM ($2::timestamptz - n.published_at)) / 3600) / 12)::float8 AS score
       FROM atlas_public_notes n
       WHERE n.moderation_status = 'visible'
         AND ($3::text IS NULL OR n.county_slug = $3)
         AND ($4::text IS NULL OR n.place_id = $4)
     )
     SELECT * FROM ranked WHERE true ${cursorWhere}
     ORDER BY ${order} LIMIT ${limitParam}`,
    params,
  );
  return rows.map(noteFromRow);
}

async function listMine(pool: PoolLike, input: AtlasCommonsListQuery): Promise<AtlasCommonsNoteRecord[]> {
  const params: unknown[] = [input.ownerUserId, input.countySlug ?? null, input.placeId ?? null];
  let cursorWhere = "";
  if (input.cursor) {
    params.push(input.cursor.timestamp, input.cursor.id);
    cursorWhere = `AND (n.created_at < $4::timestamptz OR (n.created_at = $4::timestamptz AND n.id < $5))`;
  }
  params.push(input.limit);
  const limitParam = `$${params.length}`;
  const { rows } = await pool.query(
    `SELECT ${NOTE_COLUMNS},
            EXISTS (SELECT 1 FROM atlas_note_reactions vr WHERE vr.note_id = n.id AND vr.owner_user_id = $1) AS viewer_has_reacted
     FROM atlas_public_notes n
     WHERE n.owner_user_id = $1 AND n.moderation_status <> 'removed'
       AND ($2::text IS NULL OR n.county_slug = $2)
       AND ($3::text IS NULL OR n.place_id = $3)
       ${cursorWhere}
     ORDER BY n.created_at DESC, n.id DESC LIMIT ${limitParam}`,
    params,
  );
  return rows.map(noteFromRow);
}

function userFromRow(row: QueryRow): AtlasCommonsUserRecord {
  return {
    id: String(row.id),
    oidcSubject: String(row.oidc_subject),
    ...(typeof row.email === "string" ? { email: row.email } : {}),
  };
}

function noteFromRow(row: QueryRow): AtlasCommonsNoteRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    authorHandle: String(row.author_handle),
    countySlug: String(row.county_slug),
    placeId: String(row.place_id),
    placeLabel: String(row.place_label),
    body: String(row.body),
    status: String(row.moderation_status) as AtlasCommonsNoteStatus,
    clientRequestId: String(row.client_request_id),
    reactionCount: Number(row.reaction_count ?? 0),
    reportCount: Number(row.report_count ?? 0),
    createdAt: iso(row.created_at),
    ...(row.published_at ? { publishedAt: iso(row.published_at) } : {}),
    ...(row.removed_at ? { removedAt: iso(row.removed_at) } : {}),
    ...(typeof row.viewer_has_reacted === "boolean" ? { viewerHasReacted: row.viewer_has_reacted } : {}),
  };
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function requireRow(row: QueryRow | undefined, table: string): QueryRow {
  if (!row) throw new Error(`NOTE_NOT_FOUND:${table}`);
  return row;
}
