import { existsSync, readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const UPDATE_ID = "postalpha-0.60h-hosted-clawd-persistence-foundation";
const ARTIFACT_PATH = "artifacts/hosted-clawd/postalpha-0.60h-persistence-foundation.json";
const MIGRATION_PATH = "migrations/hosted-clawd/001_persistence_foundation.sql";

const blockers = [];

const packageJson = parseJson("package.json");
const currentUpdate = parseJson("artifacts/current-update.json");
const artifact = parseJson(ARTIFACT_PATH);
const serverIndex = read("server/src/index.ts");
const auth = read("server/src/hostedClawd/auth.ts");
const service = read("server/src/hostedClawd/service.ts");
const repository = read("server/src/hostedClawd/repository.ts");
const postgres = read("server/src/hostedClawd/postgres.ts");
const migrations = read("server/src/hostedClawd/migrations.ts");
const types = read("server/src/hostedClawd/types.ts");
const sql = read(MIGRATION_PATH);
const tests = read("server/test/hosted-clawd-persistence-foundation.test.ts");
const smoke = read("server/test/hosted-clawd-postgres-smoke.ts");
const envExample = read(".env.example");
const nextQuests = read("docs/NEXT_QUESTS.md");
const decisions = read("docs/DECISIONS.md");
const buildLog = read("docs/BUILD_LOG.md");
const productSpec = read("docs/PRODUCT_SPEC_AND_GATES.md");
const state = read("STATE.md");
const agents = read("AGENTS.md");

for (const path of [
  ARTIFACT_PATH,
  MIGRATION_PATH,
  "server/src/hostedClawd/auth.ts",
  "server/src/hostedClawd/repository.ts",
  "server/src/hostedClawd/postgres.ts",
  "server/src/hostedClawd/migrations.ts",
  "server/test/hosted-clawd-persistence-foundation.test.ts",
  "server/test/hosted-clawd-postgres-smoke.ts",
]) {
  if (!existsSync(path)) blockers.push(`Missing required 0.60H file: ${path}`);
}

if (currentUpdate?.id !== UPDATE_ID) {
  blockers.push(`artifacts/current-update.json id must be ${UPDATE_ID}; got ${currentUpdate?.id ?? "missing"}.`);
}
if (currentUpdate?.selectedAxis !== "hosted_clawd_persistence_foundation") {
  blockers.push(`0.60H selectedAxis must be hosted_clawd_persistence_foundation; got ${currentUpdate?.selectedAxis ?? "missing"}.`);
}
if (currentUpdate?.recommendedNextQuest !== "0.61H Invite Beta Save UX") {
  blockers.push(`0.60H recommendedNextQuest must be 0.61H Invite Beta Save UX; got ${currentUpdate?.recommendedNextQuest ?? "missing"}.`);
}
if (currentUpdate?.decision !== "PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED") {
  blockers.push(`0.60H decision must be PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED; got ${currentUpdate?.decision ?? "missing"}.`);
}

const foundation = currentUpdate?.metricResult?.hostedClawdPersistenceFoundation;
const scope = currentUpdate?.metricResult?.scope;
if (foundation?.storageProvider !== "Railway Postgres") blockers.push("0.60H must keep Railway Postgres as the storage provider.");
if (foundation?.authModel !== "OAuth/OIDC account linking for protected Hosted Clawd writes") {
  blockers.push("0.60H must record OAuth/OIDC account linking for protected Hosted Clawd writes.");
}
if (foundation?.publicToolCount !== 7 || foundation?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
  blockers.push("0.60H must keep exactly seven public MCP tools and zero new MCP tools.");
}
if (scope?.dbMigrations !== 1 || scope?.persistedWrites !== true || scope?.liveCheckout !== false) {
  blockers.push("0.60H must record one migration, protected persisted writes, and no live checkout.");
}
if (scope?.stripeDepsAdded !== 0 || scope?.stripeTablesAdded !== 0 || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false) {
  blockers.push("0.60H must record no Stripe deps/tables, no public Anaheim/Ontario, and no provider geometry.");
}

assertIncludes(artifactText(), "PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED", "0.60H artifact must record the persistence decision.");
if (artifact?.stripe?.status !== "closed" || artifact?.stripe?.earliestSlice !== "0.62H Stripe Test Billing") {
  blockers.push("0.60H artifact must keep Stripe closed until 0.62H.");
}
if (artifact?.firstPersistenceSlice?.publicToolCount !== 7 || artifact?.firstPersistenceSlice?.newMcpTools !== 0) {
  blockers.push("0.60H artifact must keep the public MCP surface stable.");
}

const scripts = packageJson?.scripts ?? {};
if (scripts["test:hosted-clawd"] !== "tsx --test server/test/hosted-clawd-persistence-foundation.test.ts") {
  blockers.push("package.json must define test:hosted-clawd for the focused 0.60H tests.");
}
if (scripts["verify:hosted-clawd-persistence"] !== "node scripts/verify-hosted-clawd-persistence-foundation.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-persistence.");
}
if (scripts["smoke:hosted-clawd:postgres"] !== "tsx server/test/hosted-clawd-postgres-smoke.ts") {
  blockers.push("package.json must define smoke:hosted-clawd:postgres.");
}
if (scripts["migrate:hosted-clawd"] !== "tsx server/src/hostedClawd/migrations.ts") {
  blockers.push("package.json must define migrate:hosted-clawd.");
}

const dependencies = {
  ...(packageJson?.dependencies ?? {}),
  ...(packageJson?.devDependencies ?? {}),
};
for (const dep of ["pg", "jose", "@types/pg"]) {
  if (!Object.prototype.hasOwnProperty.call(dependencies, dep)) blockers.push(`0.60H requires dependency: ${dep}.`);
}
for (const dep of ["stripe", "@stripe/stripe-js", "@supabase/supabase-js", "prisma", "@prisma/client", "drizzle-orm", "auth0", "next-auth"]) {
  if (Object.prototype.hasOwnProperty.call(dependencies, dep)) blockers.push(`0.60H must not add blocked dependency: ${dep}.`);
}

const expectedTools = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
].sort();
const actualTools = [...serverIndex.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)].map((match) => match[1]).sort();
if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) {
  blockers.push(`Public MCP tool surface changed. Expected ${expectedTools.join(", ")}, found ${actualTools.join(", ")}.`);
}

for (const token of [
  "ATLAS_OIDC_ISSUER",
  "ATLAS_OIDC_AUDIENCE",
  "ATLAS_OIDC_JWKS_URL",
  "DATABASE_URL",
  "ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED=false",
  "ATLAS_HOSTED_CLAWD_MONEY_ENABLED=false",
  "ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED=false",
]) {
  assertIncludes(envExample, token, `.env.example missing ${token}.`);
}

for (const token of [
  "createRemoteJWKSet",
  "jwtVerify",
  "atlas:hosted_clawd.write",
  "resource_metadata",
  "authorization_servers",
  "bearer_methods_supported",
]) {
  assertIncludes(auth, token, `Hosted Clawd auth module missing ${token}.`);
}

for (const token of [
  "auth_required",
  "write_scope_required",
  "hasWriteScope",
  "acceptedResponse",
  "this.persistence.createOrAttachClawd(auth",
  "this.persistence.promoteSession(auth",
  "this.persistence.saveCampaignArtifact(auth",
]) {
  assertIncludes(service, token, `Hosted Clawd service missing protected write contract: ${token}.`);
}

for (const token of [
  "upsertUserByOidcSubject",
  "getOwnedClawd",
  "findIdempotentRecords",
  "saveIdempotentRecords",
  "isSessionOnlyId",
  "recordUsageEvent",
]) {
  assertIncludes(repository, token, `Repository contract missing ${token}.`);
}

for (const token of [
  "new pg.Pool",
  "ON CONFLICT (oidc_subject)",
  "ON CONFLICT (owner_user_id, clawd_id)",
  "ON CONFLICT (owner_user_id, scout_preview_id)",
  "ON CONFLICT (owner_user_id, campaign_preview_id)",
  "idempotency_keys",
]) {
  assertIncludes(postgres, token, `Postgres repository missing ${token}.`);
}

for (const token of [
  "runHostedClawdMigrations",
  "hosted_clawd_migrations",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
]) {
  assertIncludes(migrations, token, `Migration runner missing ${token}.`);
}

for (const table of [
  "users",
  "clawds",
  "business_profiles",
  "county_packs",
  "scout_drops",
  "scout_signals",
  "campaigns",
  "campaign_days",
  "usage_events",
  "idempotency_keys",
  "app_events",
]) {
  assertIncludes(sql, `CREATE TABLE IF NOT EXISTS ${table}`, `Migration missing table ${table}.`);
}

for (const token of [
  "owner_user_id TEXT NOT NULL",
  "oidc_subject TEXT NOT NULL UNIQUE",
  "clawds_owner_user_id_unique",
  "clawds_owner_id_unique",
  "business_profiles_owner_clawd_fk",
  "scout_drops_owner_clawd_fk",
  "campaigns_owner_clawd_fk",
  "saved_records JSONB NOT NULL",
  "client_request_id",
]) {
  assertIncludes(sql, token, `Migration missing ownership/idempotency token: ${token}.`);
}

for (const forbidden of [
  "subscriptions",
  "stripe_webhook_events",
  "stripe_customer_id",
  "stripe_subscription_id",
  "raw_provider_payload",
  "google_place_id",
  "provider_payload",
]) {
  assertNotIncludes(sql, forbidden, `Migration must not include ${forbidden}.`);
}

for (const token of [
  "valid bearer token verifies subject",
  "unauthenticated write is denied",
  "token without the write scope is denied",
  "wrong audience is denied",
  "expired token is denied",
  "user A cannot read or write user B's rows",
  "session Clawd ids never resolve as persisted Clawds",
  "create-or-attach is idempotent",
  "saving the same Scout Drop request twice returns one row",
  "saving the same campaign preview twice returns one owned row",
]) {
  assertIncludes(tests, token, `0.60H focused tests missing case: ${token}.`);
}

assertIncludes(smoke, "DATABASE_URL is not configured; smoke skipped", "Postgres smoke must skip cleanly without DATABASE_URL.");
assertIncludes(smoke, "runHostedClawdMigrations", "Postgres smoke must run migrations when DATABASE_URL is present.");

for (const [path, text, snippets] of [
  ["docs/NEXT_QUESTS.md", nextQuests, ["Current persistence foundation slice", "0.60H Persistence Foundation", "0.61H Invite Beta Save UX", "map/chat app", "paid neighborhood operator"]],
  ["docs/DECISIONS.md", decisions, ["Decision 084", "Persist Hosted Clawd ownership before billing", "0.61H Invite Beta Save UX"]],
  ["docs/BUILD_LOG.md", buildLog, ["Entry 199", "0.60H Persistence Foundation", "Stripe stays closed"]],
  ["docs/PRODUCT_SPEC_AND_GATES.md", productSpec, ["Current persistence note", "0.60H Persistence Foundation", "paid neighborhood operator"]],
  ["STATE.md", state, ["0.60H Hosted Clawd persistence foundation", "PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED"]],
  ["AGENTS.md", agents, ["Current human-directed local-green slice is `0.60H Persistence Foundation`", "DB/Auth persistence is now local-green"]],
]) {
  for (const snippet of snippets) {
    assertIncludes(text, snippet, `${path} missing 0.60H wording: ${snippet}`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  publicToolCount: actualTools.length,
  publicTools: actualTools,
  migrationFiles: listMigrationFiles(),
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
if (blockers.length > 0) process.exitCode = 1;

function assertIncludes(source, token, message) {
  if (!source.includes(token)) blockers.push(message);
}

function assertNotIncludes(source, token, message) {
  if (source.includes(token)) blockers.push(message);
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function parseJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function artifactText() {
  return read(ARTIFACT_PATH);
}

function listMigrationFiles() {
  try {
    return readdirSync("migrations/hosted-clawd")
      .filter((entry) => entry.endsWith(".sql"))
      .map((entry) => join("migrations/hosted-clawd", entry).replaceAll("\\", "/"));
  } catch {
    return [];
  }
}
