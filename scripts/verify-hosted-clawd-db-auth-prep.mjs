import { existsSync, readFileSync } from "node:fs";

const UPDATE_ID = "postalpha-0.59h-hosted-clawd-storage-auth-decision";
const DECISION_DOC = "docs/HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md";

const blockers = [];

const decision = read(DECISION_DOC);
const fullStackSpec = read("docs/ATLAS_FULL_STACK_PRODUCT_SPEC.md");
const nextQuests = read("docs/NEXT_QUESTS.md");
const decisions = read("docs/DECISIONS.md");
const buildLog = read("docs/BUILD_LOG.md");
const currentUpdate = parseJson("artifacts/current-update.json");
const packageJson = parseJson("package.json");
const serverIndex = read("server/src/index.ts");
const hostedService = read("server/src/hostedClawd/service.ts");
const hostedTypes = read("server/src/hostedClawd/types.ts");

for (const path of [
  DECISION_DOC,
  "docs/ATLAS_FULL_STACK_PRODUCT_SPEC.md",
  "docs/NEXT_QUESTS.md",
  "docs/DECISIONS.md",
  "docs/BUILD_LOG.md",
  "artifacts/current-update.json",
]) {
  if (!existsSync(path)) blockers.push(`Missing required 0.59H file: ${path}`);
}

assertIncludes(decision, "Railway Postgres", "0.59H must choose Railway Postgres for the first production DB path.");
assertIncludes(decision, "committed SQL migrations plus a small Node runner", "0.59H must choose a migration strategy.");
assertIncludes(decision, "OAuth/OIDC account linking", "0.59H must choose OAuth/OIDC account linking for protected Hosted Clawd actions.");
assertIncludes(decision, "MCP auth challenge", "0.59H must require MCP auth challenges instead of silent session writes.");
assertIncludes(decision, "Auth0-compatible OIDC provider", "0.59H must name the first OIDC provider shape.");
assertIncludes(decision, "First persisted capability", "0.59H must choose the first persisted capability.");
assertIncludes(decision, "Do not start Stripe in the same slice", "0.59H must keep Stripe out of DB/Auth implementation.");
assertIncludes(decision, "Fable constraint", "0.59H must preserve the Fable/map-first visual contract.");
assertIncludes(decision, "The public MCP surface remains the existing seven Alpha tools", "0.59H must keep public MCP tools stable.");

assertIncludes(fullStackSpec, "0.59H Storage/Auth Decision Packet", "Full-stack spec must include the 0.59H release ladder step.");
assertIncludes(nextQuests, "0.59H Hosted Clawd Storage/Auth Decision Packet", "Next quests must include the active 0.59H slice.");
assertIncludes(nextQuests, "0.60H Persistence Foundation", "Next quests must point to 0.60H after DB/Auth prep.");
assertIncludes(decisions, "Decision 083", "Decisions doc must record the 0.59H storage/auth decision.");
assertIncludes(buildLog, "Entry 198", "Build log must record the 0.59H slice.");

if (currentUpdate?.id !== UPDATE_ID) {
  blockers.push(`artifacts/current-update.json id must be ${UPDATE_ID}; got ${currentUpdate?.id ?? "missing"}.`);
}
if (currentUpdate?.selectedAxis !== "hosted_clawd_storage_auth") {
  blockers.push(`0.59H selectedAxis must be hosted_clawd_storage_auth; got ${currentUpdate?.selectedAxis ?? "missing"}.`);
}
if (currentUpdate?.recommendedNextQuest !== "0.60H Persistence Foundation") {
  blockers.push(`0.59H recommendedNextQuest must be 0.60H Persistence Foundation; got ${currentUpdate?.recommendedNextQuest ?? "missing"}.`);
}
if (currentUpdate?.decision !== "DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED") {
  blockers.push(`0.59H decision must be DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED; got ${currentUpdate?.decision ?? "missing"}.`);
}

const prep = currentUpdate?.metricResult?.hostedClawdStorageAuth;
const scope = currentUpdate?.metricResult?.scope;
if (prep?.storageProvider !== "Railway Postgres") blockers.push("0.59H artifact must record Railway Postgres.");
if (prep?.authModel !== "OAuth/OIDC account linking for protected MCP Hosted Clawd actions") {
  blockers.push("0.59H artifact must record OAuth/OIDC MCP auth model.");
}
if (prep?.stripeTiming !== "0.62H after 0.60H ownership and idempotency pass") {
  blockers.push("0.59H artifact must keep Stripe timing after 0.60H.");
}
if (prep?.publicToolCount !== 7 || prep?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
  blockers.push("0.59H must keep exactly seven public MCP tools and zero new MCP tools.");
}
if (scope?.docsOnly !== true || scope?.dbMigrations !== 0 || scope?.persistedWrites !== false || scope?.liveCheckout !== false) {
  blockers.push("0.59H must be docs/verifier prep only: no migrations, persisted writes, or live checkout.");
}
if (scope?.authProviderMutation !== false || scope?.packageDepsAdded !== 0) {
  blockers.push("0.59H must not mutate auth provider config or add package dependencies.");
}

const actualTools = [...serverIndex.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)].map((match) => match[1]).sort();
const expectedTools = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
].sort();
if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) {
  blockers.push(`Public MCP tool surface changed. Expected ${expectedTools.join(", ")}, found ${actualTools.join(", ")}.`);
}

const dependencies = {
  ...(packageJson?.dependencies ?? {}),
  ...(packageJson?.devDependencies ?? {}),
};
for (const dep of ["stripe", "@stripe/stripe-js", "pg", "postgres", "@supabase/supabase-js", "prisma", "@prisma/client", "drizzle-orm", "auth0", "jose"]) {
  if (Object.prototype.hasOwnProperty.call(dependencies, dep)) {
    blockers.push(`0.59H prep must not add implementation dependency yet: ${dep}.`);
  }
}

for (const pattern of [
  /from\s+["']stripe["']/i,
  /new\s+Stripe\b/i,
  /stripe\.checkout/i,
  /from\s+["']pg["']/i,
  /from\s+["']postgres["']/i,
  /from\s+["']@supabase\/supabase-js["']/i,
  /from\s+["']jose["']/i,
]) {
  if (pattern.test(`${serverIndex}\n${hostedService}\n${hostedTypes}`)) {
    blockers.push(`0.59H prep contains implementation import/call too early: ${pattern}.`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
if (blockers.length) process.exitCode = 1;

function assertIncludes(source, token, message) {
  if (!source.includes(token)) blockers.push(message);
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
