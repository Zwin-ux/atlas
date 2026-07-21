import assert from "node:assert/strict";
import pg from "pg";
import {
  ATLAS_COMMONS_READ_SCOPE,
  ATLAS_COMMONS_WRITE_SCOPE,
  AtlasCommonsService,
  createPostgresAtlasCommonsRepository,
  type AtlasCommonsAuthContext,
} from "../src/atlasCommons/index.js";
import { runHostedClawdMigrations } from "../src/hostedClawd/migrations.js";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.log(JSON.stringify({ ok: true, ran: false, reason: "DATABASE_URL is not configured." }));
  process.exit(0);
}

const schema = `atlas_commons_smoke_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`SET search_path TO ${schema}`);
  const migrations = await runHostedClawdMigrations(client);
  assert.ok(migrations.applied.includes("003_atlas_commons_public_notes.sql"));

  const repository = createPostgresAtlasCommonsRepository(client);
  const service = new AtlasCommonsService({
    config: {
      enabled: true,
      pseudonymSecret: "postgres-smoke-pseudonym-secret",
      reportThreshold: 2,
      writeLimitPerHour: 100,
    },
    repository,
    resolveAnchor: (countySlug, placeId) =>
      countySlug === "riverside-ca" && placeId === "eastvale"
        ? { countySlug, placeId, placeLabel: "Eastvale" }
        : undefined,
  });

  const auth = (subject: string): AtlasCommonsAuthContext => ({
    subject,
    scopes: [ATLAS_COMMONS_READ_SCOPE, ATLAS_COMMONS_WRITE_SCOPE],
  });
  const owner = auth("smoke|owner");
  const reader = auth("smoke|reader");
  const third = auth("smoke|third");

  const first = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "untrusted label",
    body: "The morning line moves quickly.",
    clientRequestId: "postgres-smoke-post",
  }, owner);
  const retry = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "untrusted label",
    body: "This retry cannot overwrite the original.",
    clientRequestId: "postgres-smoke-post",
  }, owner);
  assert.equal(retry.note.id, first.note.id);
  assert.equal(retry.note.body, first.note.body);
  assert.equal((await service.list({})).notes.length, 0);

  await service.moderate(first.note.id, "approve", "postgres-smoke");
  assert.equal((await service.list({ countySlug: "riverside-ca" })).notes.length, 1);

  const reacted = await service.react(first.note.id, true, reader);
  assert.equal(reacted.note.reactionCount, 1);
  assert.equal(reacted.note.viewerHasReacted, true);
  const duplicateReaction = await service.react(first.note.id, true, reader);
  assert.equal(duplicateReaction.status, "unchanged");
  assert.equal(duplicateReaction.note.reactionCount, 1);

  await service.report(first.note.id, "misleading", reader);
  const hidden = await service.report(first.note.id, "privacy", third);
  assert.equal(hidden.note.status, "removed");
  assert.equal((await service.list({})).notes.length, 0);

  const mine = await service.list({ mode: "mine" }, owner);
  assert.equal(mine.notes.length, 0, "Removed notes must not return in mine reads.");

  console.log(JSON.stringify({
    ok: true,
    ran: true,
    migrationCount: migrations.applied.length,
    idempotentNoteId: first.note.id,
    reactionCount: duplicateReaction.note.reactionCount,
    reportAutoHide: hidden.note.status === "removed",
  }));
} finally {
  await client.query("SET search_path TO public");
  await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await client.end();
}
