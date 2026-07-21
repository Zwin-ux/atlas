import { randomUUID } from "node:crypto";
import type {
  AtlasCommonsCreateNoteInput,
  AtlasCommonsListQuery,
  AtlasCommonsRepository,
  AtlasCommonsUserRecord,
} from "./repository.js";
import type { AtlasCommonsModerationQueueStatus, AtlasCommonsNoteRecord, AtlasCommonsNoteStatus } from "./types.js";

type QueryRow = Record<string, unknown>;
type Queryable = {
  query(sql: string, params?: unknown[]): Promise<{ rows: QueryRow[] }>;
};
type PoolClientLike = Queryable & { release(): void };
type PoolLike = Queryable & { connect?: () => Promise<PoolClientLike> };

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

    async findNoteByRequest(ownerUserId, clientRequestId) {
      const { rows } = await pool.query(
        `SELECT ${NOTE_COLUMNS}, false AS viewer_has_reacted
         FROM atlas_public_notes n
         WHERE n.owner_user_id = $1 AND n.client_request_id = $2`,
        [ownerUserId, clientRequestId],
      );
      return rows[0] ? noteFromRow(rows[0]) : null;
    },

    async createNote(input, quota) {
      const client = pool.connect ? await pool.connect() : undefined;
      const database: Queryable = client ?? pool;
      try {
        await database.query("BEGIN");
        await lockWriteQuota(database, input.ownerUserId);
        const { rows: existingRows } = await database.query(
          `SELECT ${NOTE_COLUMNS}, false AS viewer_has_reacted
           FROM atlas_public_notes n
           WHERE n.owner_user_id = $1 AND n.client_request_id = $2`,
          [input.ownerUserId, input.clientRequestId],
        );
        if (existingRows[0]) {
          await database.query("COMMIT");
          return { note: noteFromRow(existingRows[0]), reused: true };
        }
        await assertWriteQuotaAvailable(database, input.ownerUserId, quota.since, quota.limit);
        const { rows } = await database.query(
          `WITH inserted AS (
             INSERT INTO atlas_public_notes (
               id, owner_user_id, author_handle, county_slug, place_id, place_label, body, client_request_id
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *
           ), logged AS (
             INSERT INTO atlas_commons_actions (id, owner_user_id, action_kind)
             SELECT $9, owner_user_id, 'post' FROM inserted
           )
           SELECT ${NOTE_COLUMNS.replaceAll("n.", "i.")}, true AS inserted, false AS viewer_has_reacted
           FROM inserted i`,
          [randomUUID(), input.ownerUserId, input.authorHandle, input.countySlug, input.placeId, input.placeLabel, input.body, input.clientRequestId, randomUUID()],
        );
        const row = requireRow(rows[0], "atlas_public_notes");
        await database.query("COMMIT");
        return { note: noteFromRow(row), reused: false };
      } catch (error) {
        try { await database.query("ROLLBACK"); } catch { /* preserve original */ }
        throw error;
      } finally {
        client?.release();
      }
    },

    async listNotes(input) {
      return input.mode === "mine" ? listMine(pool, input) : listPublic(pool, input);
    },

    async listModerationQueue(status: AtlasCommonsModerationQueueStatus, limit: number) {
      const { rows } = await pool.query(
        `SELECT ${NOTE_COLUMNS}, false AS viewer_has_reacted
         FROM atlas_public_notes n
         WHERE n.moderation_status = $1
         ORDER BY n.created_at ASC, n.id ASC
         LIMIT $2`,
        [status, limit],
      );
      return rows.map(noteFromRow);
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

    async setReaction(noteId, ownerUserId, active, quota) {
      const client = pool.connect ? await pool.connect() : undefined;
      const database: Queryable = client ?? pool;
      try {
        await database.query("BEGIN");
        await lockWriteQuota(database, ownerUserId);
        const { rows: targetRows } = await database.query(
          `SELECT n.id,
                  EXISTS (SELECT 1 FROM atlas_note_reactions r WHERE r.note_id = n.id AND r.owner_user_id = $2) AS active
           FROM atlas_public_notes n
           WHERE n.id = $1 AND n.moderation_status = 'visible'
           FOR UPDATE`,
          [noteId, ownerUserId],
        );
        const target = requireRow(targetRows[0], "atlas_public_notes");
        const had = target.active === true;
        if (had === active) {
          const note = await selectNoteById(database, noteId, ownerUserId);
          await database.query("COMMIT");
          return { note, changed: false };
        }
        await assertWriteQuotaAvailable(database, ownerUserId, quota.since, quota.limit);
        if (active) {
          await database.query(
            "INSERT INTO atlas_note_reactions (note_id, owner_user_id) VALUES ($1, $2)",
            [noteId, ownerUserId],
          );
        } else {
          await database.query(
            "DELETE FROM atlas_note_reactions WHERE note_id = $1 AND owner_user_id = $2",
            [noteId, ownerUserId],
          );
        }
        await database.query(
          "INSERT INTO atlas_commons_actions (id, owner_user_id, action_kind) VALUES ($1, $2, $3)",
          [randomUUID(), ownerUserId, active ? "react" : "unreact"],
        );
        const note = await selectNoteById(database, noteId, ownerUserId);
        await database.query("COMMIT");
        return { note, changed: true };
      } catch (error) {
        try { await database.query("ROLLBACK"); } catch { /* preserve original */ }
        throw error;
      } finally {
        client?.release();
      }
    },

    async reportNote(noteId, reporterUserId, reason, threshold, quota) {
      const client = pool.connect ? await pool.connect() : undefined;
      const database: Queryable = client ?? pool;
      try {
        await database.query("BEGIN");
        await lockWriteQuota(database, reporterUserId);
        const { rows: targetRows } = await database.query(
          `SELECT id FROM atlas_public_notes
           WHERE id = $1 AND moderation_status = 'visible' AND owner_user_id <> $2
           FOR UPDATE`,
          [noteId, reporterUserId],
        );
        if (!targetRows[0]) throw new Error("NOTE_NOT_FOUND:atlas_public_notes");

        const { rows: existingReportRows } = await database.query(
          "SELECT 1 AS found FROM atlas_note_reports WHERE note_id = $1 AND reporter_user_id = $2",
          [noteId, reporterUserId],
        );
        const changed = !existingReportRows[0];
        if (changed) {
          await assertWriteQuotaAvailable(database, reporterUserId, quota.since, quota.limit);
          await database.query(
            "INSERT INTO atlas_note_reports (note_id, reporter_user_id, reason) VALUES ($1, $2, $3)",
            [noteId, reporterUserId, reason],
          );
          await database.query(
            "INSERT INTO atlas_commons_actions (id, owner_user_id, action_kind) VALUES ($1, $2, 'report')",
            [randomUUID(), reporterUserId],
          );
        }

        const { rows: countRows } = await database.query(
          "SELECT count(*)::int AS report_count FROM atlas_note_reports WHERE note_id = $1",
          [noteId],
        );
        const thresholdReached = Number(countRows[0]?.report_count ?? 0) >= threshold;
        if (thresholdReached) {
          const { rows: hiddenRows } = await database.query(
            `UPDATE atlas_public_notes
             SET moderation_status = 'removed', removed_at = now(), removal_reason = 'report_threshold'
             WHERE id = $1 AND moderation_status = 'visible'
             RETURNING id`,
            [noteId],
          );
          if (hiddenRows[0]) {
            await database.query(
              `INSERT INTO atlas_note_moderation_events
                 (id, note_id, previous_status, next_status, operator_label)
               VALUES ($1, $2, 'visible', 'removed', 'system:report-threshold')`,
              [randomUUID(), noteId],
            );
          }
        }
        const note = await selectNoteById(database, noteId, reporterUserId);
        await database.query("COMMIT");
        return { note, changed, thresholdReached };
      } catch (error) {
        try {
          await database.query("ROLLBACK");
        } catch {
          // Preserve the original error; readiness will catch a broken connection.
        }
        throw error;
      } finally {
        client?.release();
      }
    },

    async moderateNote(noteId, status, operatorLabel) {
      const { rows: priorRows } = await pool.query(
        "SELECT moderation_status FROM atlas_public_notes WHERE id = $1",
        [noteId],
      );
      const previousStatus = String(requireRow(priorRows[0], "atlas_public_notes").moderation_status) as AtlasCommonsNoteStatus;
      const transitionAllowed =
        (previousStatus === "pending" && (status === "visible" || status === "removed")) ||
        (previousStatus === "visible" && status === "removed");
      if (!transitionAllowed) throw new Error("INVALID_TRANSITION:atlas_public_notes");
      const { rows } = await pool.query(
        `WITH prior AS (
           SELECT moderation_status FROM atlas_public_notes WHERE id = $1
         ), updated AS (
           UPDATE atlas_public_notes
           SET moderation_status = $2,
               published_at = CASE WHEN $2 = 'visible' THEN COALESCE(published_at, now()) ELSE published_at END,
               removed_at = CASE WHEN $2 = 'removed' THEN now() ELSE NULL END,
               removal_reason = CASE WHEN $2 = 'removed' THEN 'operator' ELSE NULL END
           WHERE id = $1 AND moderation_status = $5
           RETURNING *
         ), audited AS (
           INSERT INTO atlas_note_moderation_events (id, note_id, previous_status, next_status, operator_label)
           SELECT $4, $1, prior.moderation_status, $2, $3 FROM prior, updated
         )
         SELECT ${NOTE_COLUMNS.replaceAll("n.", "u.")},
                prior.moderation_status AS previous_status,
                false AS viewer_has_reacted
         FROM updated u, prior`,
        [noteId, status, operatorLabel, randomUUID(), previousStatus],
      );
      if (!rows[0]) throw new Error("INVALID_TRANSITION:atlas_public_notes");
      const row = rows[0];
      return { note: noteFromRow(row), previousStatus: String(row.previous_status) as AtlasCommonsNoteStatus };
    },
  };
}

async function lockWriteQuota(database: Queryable, ownerUserId: string): Promise<void> {
  await database.query(
    "SELECT pg_advisory_xact_lock(hashtext('atlas_commons_write_quota'), hashtext($1))",
    [ownerUserId],
  );
}

async function assertWriteQuotaAvailable(
  database: Queryable,
  ownerUserId: string,
  since: string,
  limit: number,
): Promise<void> {
  const { rows } = await database.query(
    "SELECT count(*)::int AS action_count FROM atlas_commons_actions WHERE owner_user_id = $1 AND created_at >= $2::timestamptz",
    [ownerUserId, since],
  );
  if (Number(rows[0]?.action_count ?? 0) >= limit) throw new Error("RATE_LIMITED:atlas_commons_actions");
}

async function selectNoteById(pool: Queryable, noteId: string, viewerUserId?: string): Promise<AtlasCommonsNoteRecord> {
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
  const asOf = input.asOf;
  const params: unknown[] = [input.viewerUserId ?? null, asOf, input.countySlug ?? null, input.placeId ?? null];
  let cursorWhere = "";
  if (input.cursor) {
    if (input.sort === "hot") {
      params.push(input.cursor.score, input.cursor.timestamp, input.cursor.id);
      cursorWhere = `AND (score < $5 OR (score = $5 AND (cursor_timestamp < $6::timestamptz OR (cursor_timestamp = $6::timestamptz AND id < $7))))`;
    } else {
      params.push(input.cursor.timestamp, input.cursor.id);
      cursorWhere = `AND (cursor_timestamp < $5::timestamptz OR (cursor_timestamp = $5::timestamptz AND id < $6))`;
    }
  }
  params.push(input.limit);
  const limitParam = `$${params.length}`;
  const order = input.sort === "hot" ? "score DESC, cursor_timestamp DESC, id DESC" : "cursor_timestamp DESC, id DESC";
  const { rows } = await pool.query(
    `WITH ranked AS (
       SELECT ${NOTE_COLUMNS},
              CASE WHEN $1::text IS NULL THEN NULL
                   ELSE EXISTS (SELECT 1 FROM atlas_note_reactions vr WHERE vr.note_id = n.id AND vr.owner_user_id = $1)
              END AS viewer_has_reacted,
              date_trunc('milliseconds', COALESCE(n.published_at, n.created_at)) AS cursor_timestamp,
              round(((SELECT count(*) FROM atlas_note_reactions r WHERE r.note_id = n.id) * 4
                - (SELECT count(*) FROM atlas_note_reports p WHERE p.note_id = n.id) * 8
                - GREATEST(0, EXTRACT(EPOCH FROM ($2::timestamptz - date_trunc('milliseconds', COALESCE(n.published_at, n.created_at))))) / 43200)::numeric, 9)::float8 AS score
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
    cursorWhere = `AND (date_trunc('milliseconds', n.created_at) < $4::timestamptz OR (date_trunc('milliseconds', n.created_at) = $4::timestamptz AND n.id < $5))`;
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
     ORDER BY date_trunc('milliseconds', n.created_at) DESC, n.id DESC LIMIT ${limitParam}`,
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
