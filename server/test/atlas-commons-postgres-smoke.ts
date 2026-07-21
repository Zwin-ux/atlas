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

// Railway CLI runs on the caller host, where the private *.railway.internal
// address is intentionally not resolvable. Prefer its injected public proxy
// for operator-run smoke checks; CI/local Postgres continues to use DATABASE_URL.
const databaseUrl = process.env.DATABASE_PUBLIC_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.log(JSON.stringify({ ok: true, ran: false, reason: "DATABASE_URL is not configured." }));
  process.exit(0);
}

const schema = `atlas_commons_smoke_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
const client = new pg.Client({ connectionString: databaseUrl });
let schemaPool: pg.Pool | undefined;
await client.connect();

try {
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`SET search_path TO ${schema}`);
  const migrations = await runHostedClawdMigrations(client);
  assert.ok(migrations.applied.includes("003_atlas_commons_public_notes.sql"));

  schemaPool = new pg.Pool({
    connectionString: databaseUrl,
    max: 6,
    options: `-c search_path=${schema}`,
  });
  assert.equal((await schemaPool.query("SHOW search_path")).rows[0]?.search_path, schema);
  const repository = createPostgresAtlasCommonsRepository(schemaPool);
  const createService = (serviceRepository: ReturnType<typeof createPostgresAtlasCommonsRepository>, writeLimitPerHour = 100) => new AtlasCommonsService({
    config: {
      enabled: true,
      pseudonymSecret: "postgres-smoke-pseudonym-secret",
      operatorToken: "postgres-smoke-operator-token",
      reportThreshold: 2,
      writeLimitPerHour,
    },
    repository: serviceRepository,
    authConfigured: true,
    resolveAnchor: (countySlug, placeId) =>
      countySlug === "riverside-ca" && placeId === "eastvale"
        ? { countySlug, placeId, placeLabel: "Eastvale" }
        : undefined,
  });
  const service = createService(repository);

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

  const reporterServices = [createService(repository), createService(repository)];
  const quotaAuth = auth("smoke|quota");
  const limitedServices = [createService(repository, 1), createService(repository, 1)];
  const concurrentPosts = await Promise.allSettled([
    limitedServices[0]!.post({ countySlug: "riverside-ca", placeId: "eastvale", body: "Concurrent quota post one.", clientRequestId: "quota-one" }, quotaAuth),
    limitedServices[1]!.post({ countySlug: "riverside-ca", placeId: "eastvale", body: "Concurrent quota post two.", clientRequestId: "quota-two" }, quotaAuth),
  ]);
  assert.equal(concurrentPosts.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(concurrentPosts.filter((result) => result.status === "rejected" && result.reason?.code === "RATE_LIMITED").length, 1);
  const concurrentReports = await Promise.all([
    reporterServices[0]!.report(first.note.id, "misleading", reader),
    reporterServices[1]!.report(first.note.id, "privacy", third),
  ]);
  assert.equal(concurrentReports.some((result) => result.note.status === "removed"), true);
  assert.equal((await service.list({})).notes.length, 0);

  const removedQueue = await service.listModerationQueue("removed", 10);
  assert.equal(removedQueue.notes.some((note) => note.id === first.note.id), true);
  await assert.rejects(() => service.moderate(first.note.id, "approve", "postgres-smoke"), /That moderation transition is not allowed/);

  const mine = await service.list({ mode: "mine" }, owner);
  assert.equal(mine.notes.length, 0, "Removed notes must not return in mine reads.");

  const olderMine = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "Eastvale",
    body: "Older mine pagination note.",
    clientRequestId: "postgres-smoke-mine-older",
  }, owner);
  await schemaPool.query("SELECT pg_sleep(0.01)");
  const newerMine = await service.post({
    countySlug: "riverside-ca",
    placeId: "eastvale",
    placeLabel: "Eastvale",
    body: "Newer mine pagination note.",
    clientRequestId: "postgres-smoke-mine-newer",
  }, owner);
  await schemaPool.query("SELECT pg_sleep(0.01)");
  await service.moderate(olderMine.note.id, "approve", "postgres-smoke");
  const minePageOne = await service.list({ mode: "mine", limit: 1 }, owner);
  assert.equal(minePageOne.notes[0]?.id, newerMine.note.id);
  assert.ok(minePageOne.nextCursor);
  const minePageTwo = await service.list({ mode: "mine", limit: 1, cursor: minePageOne.nextCursor }, owner);
  assert.equal(minePageTwo.notes[0]?.id, olderMine.note.id);

  await schemaPool.query(
    "UPDATE atlas_public_notes SET created_at = date_trunc('milliseconds', now()) WHERE id = ANY($1::text[])",
    [[olderMine.note.id, newerMine.note.id]],
  );
  const sameMillisecondMineOne = await service.list({ mode: "mine", limit: 1 }, owner);
  assert.ok(sameMillisecondMineOne.nextCursor);
  const sameMillisecondMineTwo = await service.list({ mode: "mine", limit: 1, cursor: sameMillisecondMineOne.nextCursor }, owner);
  assert.deepEqual(
    new Set([sameMillisecondMineOne.notes[0]?.id, sameMillisecondMineTwo.notes[0]?.id]),
    new Set([olderMine.note.id, newerMine.note.id]),
  );

  await service.moderate(newerMine.note.id, "approve", "postgres-smoke");
  await schemaPool.query(
    "UPDATE atlas_public_notes SET published_at = date_trunc('milliseconds', now()) WHERE id = ANY($1::text[])",
    [[olderMine.note.id, newerMine.note.id]],
  );
  await service.react(olderMine.note.id, true, owner);
  const newPageOne = await service.list({ sort: "new", limit: 1 });
  assert.ok(newPageOne.nextCursor);
  const newPageTwo = await service.list({ sort: "new", limit: 1, cursor: newPageOne.nextCursor });
  assert.deepEqual(
    new Set([newPageOne.notes[0]?.id, newPageTwo.notes[0]?.id]),
    new Set([olderMine.note.id, newerMine.note.id]),
  );
  const hotPageOne = await service.list({ sort: "hot", limit: 1 });
  assert.equal(hotPageOne.notes[0]?.id, olderMine.note.id);
  assert.ok(hotPageOne.nextCursor);
  const hotPageTwo = await service.list({ sort: "hot", limit: 1, cursor: hotPageOne.nextCursor });
  assert.equal(hotPageTwo.notes[0]?.id, newerMine.note.id);

  console.log(JSON.stringify({
    ok: true,
    ran: true,
    migrationCount: migrations.applied.length,
    idempotentNoteId: first.note.id,
    reactionCount: duplicateReaction.note.reactionCount,
    reportAutoHide: concurrentReports.some((result) => result.note.status === "removed"),
  }));
} finally {
  await schemaPool?.end();
  await client.query("SET search_path TO public");
  await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await client.end();
}
