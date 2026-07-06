import { randomUUID } from "node:crypto";
import pg from "pg";
import {
  isSessionOnlyId,
  type HostedClawdBusinessProfileRecord,
  type HostedClawdCampaignRecord,
  type HostedClawdClawdRecord,
  type HostedClawdRepository,
  type HostedClawdScoutDropRecord,
  type HostedClawdUserRecord,
} from "./repository.js";
import type { HostedClawdSavedRecord } from "./types.js";

type QueryRow = Record<string, unknown>;

type PoolLike = {
  query(sql: string, params?: unknown[]): Promise<{ rows: QueryRow[] }>;
};

export function createHostedClawdPool(databaseUrl: string): pg.Pool {
  return new pg.Pool({ connectionString: databaseUrl });
}

export function createPostgresHostedClawdRepository(pool: PoolLike): HostedClawdRepository {
  return {
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

    async findClawdForOwner(ownerUserId) {
      const { rows } = await pool.query(
        `SELECT id, owner_user_id, name, status FROM clawds
         WHERE owner_user_id = $1
         ORDER BY created_at ASC
         LIMIT 1`,
        [ownerUserId],
      );
      return rows[0] ? clawdFromRow(rows[0]) : null;
    },

    async getOwnedClawd(ownerUserId, clawdId) {
      if (isSessionOnlyId(clawdId)) return null;
      const { rows } = await pool.query(
        `SELECT id, owner_user_id, name, status FROM clawds
         WHERE id = $1 AND owner_user_id = $2`,
        [clawdId, ownerUserId],
      );
      return rows[0] ? clawdFromRow(rows[0]) : null;
    },

    async createClawd(ownerUserId, name) {
      const { rows } = await pool.query(
        `INSERT INTO clawds (id, owner_user_id, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (owner_user_id)
         DO UPDATE SET name = clawds.name
         RETURNING id, owner_user_id, name, status`,
        [randomUUID(), ownerUserId, name],
      );
      return clawdFromRow(requireRow(rows[0], "clawds"));
    },

    async saveBusinessProfile(input) {
      const existing = await pool.query(
        `SELECT id FROM business_profiles WHERE owner_user_id = $1 AND clawd_id = $2`,
        [input.ownerUserId, input.clawdId],
      );
      const reused = existing.rows.length > 0;
      const { rows } = await pool.query(
        `INSERT INTO business_profiles (
           id, owner_user_id, clawd_id, business_name, business_type, service_area,
           primary_goal, offer_notes, county_slug, county_label, place_label
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (owner_user_id, clawd_id)
         DO UPDATE SET
           business_name = EXCLUDED.business_name,
           business_type = EXCLUDED.business_type,
           service_area = EXCLUDED.service_area,
           primary_goal = EXCLUDED.primary_goal,
           offer_notes = EXCLUDED.offer_notes,
           county_slug = EXCLUDED.county_slug,
           county_label = EXCLUDED.county_label,
           place_label = EXCLUDED.place_label,
           updated_at = now()
         RETURNING id, owner_user_id, clawd_id, business_name, business_type, service_area,
                   primary_goal, offer_notes, county_slug, county_label, place_label`,
        [
          randomUUID(),
          input.ownerUserId,
          input.clawdId,
          input.businessName,
          input.businessType ?? null,
          input.serviceArea ?? null,
          input.primaryGoal ?? null,
          input.offerNotes ?? null,
          input.countySlug,
          input.countyLabel ?? null,
          input.placeLabel ?? null,
        ],
      );
      return { record: businessProfileFromRow(requireRow(rows[0], "business_profiles")), reused };
    },

    async findBusinessProfile(ownerUserId, clawdId) {
      const { rows } = await pool.query(
        `SELECT id, owner_user_id, clawd_id, business_name, business_type, service_area,
                primary_goal, offer_notes, county_slug, county_label, place_label
         FROM business_profiles
         WHERE owner_user_id = $1 AND clawd_id = $2`,
        [ownerUserId, clawdId],
      );
      return rows[0] ? businessProfileFromRow(rows[0]) : null;
    },

    async saveScoutDrop(input) {
      const existing = await pool.query(
        `SELECT id, owner_user_id, clawd_id, business_profile_id, scout_preview_id, county_slug, source_note
         FROM scout_drops
         WHERE owner_user_id = $1 AND scout_preview_id = $2`,
        [input.ownerUserId, input.scoutPreviewId],
      );
      if (existing.rows[0]) {
        return { record: scoutDropFromRow(existing.rows[0]), reused: true };
      }
      const { rows } = await pool.query(
        `INSERT INTO scout_drops (
           id, owner_user_id, clawd_id, business_profile_id, scout_preview_id, county_slug, source_note
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (owner_user_id, scout_preview_id) DO NOTHING
         RETURNING id, owner_user_id, clawd_id, business_profile_id, scout_preview_id, county_slug, source_note`,
        [
          randomUUID(),
          input.ownerUserId,
          input.clawdId,
          input.businessProfileId ?? null,
          input.scoutPreviewId,
          input.countySlug,
          input.sourceNote,
        ],
      );
      if (rows[0]) return { record: scoutDropFromRow(rows[0]), reused: false };
      // Lost a concurrent insert race; the original row wins.
      const raced = await pool.query(
        `SELECT id, owner_user_id, clawd_id, business_profile_id, scout_preview_id, county_slug, source_note
         FROM scout_drops
         WHERE owner_user_id = $1 AND scout_preview_id = $2`,
        [input.ownerUserId, input.scoutPreviewId],
      );
      return { record: scoutDropFromRow(requireRow(raced.rows[0], "scout_drops")), reused: true };
    },

    async findScoutDropByPreviewId(ownerUserId, scoutPreviewId) {
      const { rows } = await pool.query(
        `SELECT id, owner_user_id, clawd_id, business_profile_id, scout_preview_id, county_slug, source_note
         FROM scout_drops
         WHERE owner_user_id = $1 AND scout_preview_id = $2`,
        [ownerUserId, scoutPreviewId],
      );
      return rows[0] ? scoutDropFromRow(rows[0]) : null;
    },

    async saveCampaignDraft(input) {
      const existing = await pool.query(
        `SELECT id, owner_user_id, clawd_id, business_profile_id, scout_drop_id, campaign_preview_id, summary, status
         FROM campaigns
         WHERE owner_user_id = $1 AND campaign_preview_id = $2`,
        [input.ownerUserId, input.campaignPreviewId],
      );
      if (existing.rows[0]) {
        return { record: campaignFromRow(existing.rows[0]), reused: true };
      }
      const { rows } = await pool.query(
        `INSERT INTO campaigns (
           id, owner_user_id, clawd_id, business_profile_id, scout_drop_id, campaign_preview_id, summary
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (owner_user_id, campaign_preview_id) DO NOTHING
         RETURNING id, owner_user_id, clawd_id, business_profile_id, scout_drop_id, campaign_preview_id, summary, status`,
        [
          randomUUID(),
          input.ownerUserId,
          input.clawdId,
          input.businessProfileId,
          input.scoutDropId ?? null,
          input.campaignPreviewId,
          input.summary ?? null,
        ],
      );
      if (rows[0]) return { record: campaignFromRow(rows[0]), reused: false };
      const raced = await pool.query(
        `SELECT id, owner_user_id, clawd_id, business_profile_id, scout_drop_id, campaign_preview_id, summary, status
         FROM campaigns
         WHERE owner_user_id = $1 AND campaign_preview_id = $2`,
        [input.ownerUserId, input.campaignPreviewId],
      );
      return { record: campaignFromRow(requireRow(raced.rows[0], "campaigns")), reused: true };
    },

    async recordUsageEvent(ownerUserId, eventType, detail) {
      await pool.query(
        `INSERT INTO usage_events (id, owner_user_id, event_type, detail) VALUES ($1, $2, $3, $4)`,
        [randomUUID(), ownerUserId, eventType, detail ?? null],
      );
    },

    async findIdempotentRecords(ownerUserId, operation, clientRequestId) {
      const { rows } = await pool.query(
        `SELECT saved_records FROM idempotency_keys
         WHERE owner_user_id = $1 AND operation = $2 AND client_request_id = $3`,
        [ownerUserId, operation, clientRequestId],
      );
      if (!rows[0]) return null;
      const savedRecords = rows[0].saved_records;
      if (Array.isArray(savedRecords)) return savedRecords as HostedClawdSavedRecord[];
      if (typeof savedRecords === "string") return JSON.parse(savedRecords) as HostedClawdSavedRecord[];
      return JSON.parse(JSON.stringify(savedRecords)) as HostedClawdSavedRecord[];
    },

    async saveIdempotentRecords(ownerUserId, operation, clientRequestId, records) {
      await pool.query(
        `INSERT INTO idempotency_keys (owner_user_id, operation, client_request_id, saved_records)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (owner_user_id, operation, client_request_id) DO NOTHING`,
        [ownerUserId, operation, clientRequestId, JSON.stringify(records)],
      );
    },
  };
}

function userFromRow(row: QueryRow): HostedClawdUserRecord {
  return {
    id: String(row.id),
    oidcSubject: String(row.oidc_subject),
    email: row.email == null ? undefined : String(row.email),
  };
}

function clawdFromRow(row: QueryRow): HostedClawdClawdRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    name: String(row.name),
    status: "active",
  };
}

function businessProfileFromRow(row: QueryRow): HostedClawdBusinessProfileRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    clawdId: String(row.clawd_id),
    businessName: String(row.business_name),
    businessType: optionalString(row.business_type),
    serviceArea: optionalString(row.service_area),
    primaryGoal: optionalString(row.primary_goal),
    offerNotes: optionalString(row.offer_notes),
    countySlug: String(row.county_slug),
    countyLabel: optionalString(row.county_label),
    placeLabel: optionalString(row.place_label),
  };
}

function scoutDropFromRow(row: QueryRow): HostedClawdScoutDropRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    clawdId: String(row.clawd_id),
    businessProfileId: optionalString(row.business_profile_id),
    scoutPreviewId: String(row.scout_preview_id),
    countySlug: String(row.county_slug),
    sourceNote: String(row.source_note),
  };
}

function campaignFromRow(row: QueryRow): HostedClawdCampaignRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    clawdId: String(row.clawd_id),
    businessProfileId: String(row.business_profile_id),
    scoutDropId: optionalString(row.scout_drop_id),
    campaignPreviewId: String(row.campaign_preview_id),
    summary: optionalString(row.summary),
    status: "draft",
  };
}

function optionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function requireRow(row: QueryRow | undefined, label: string): QueryRow {
  if (!row) throw new Error(`Expected a ${label} row from Postgres.`);
  return row;
}
