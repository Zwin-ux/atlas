import { existsSync, readFileSync } from "node:fs";

const UPDATE_ID = "postalpha-0.63h-hosted-clawd-protected-tool-gate";
const ARTIFACT_PATH = "artifacts/hosted-clawd/postalpha-0.63h-protected-tool-gate.json";

const blockers = [];

const packageJson = parseJson("package.json");
const currentUpdate = parseJson("artifacts/current-update.json");
const artifact = parseJson(ARTIFACT_PATH);
const service = read("server/src/hostedClawd/service.ts");
const repository = read("server/src/hostedClawd/repository.ts");
const types = read("server/src/hostedClawd/types.ts");
const serverIndex = read("server/src/index.ts");
const tests = read("server/test/hosted-clawd-protected-tool-gate.test.ts");
const nextQuests = read("docs/NEXT_QUESTS.md");
const decisions = read("docs/DECISIONS.md");
const buildLog = read("docs/BUILD_LOG.md");
const productSpec = read("docs/PRODUCT_SPEC_AND_GATES.md");
const releaseLadder = read("docs/updates/ATLAS_RELEASE_LADDER.md");
const state = read("STATE.md");
const agents = read("AGENTS.md");
const toolContracts = read("docs/TOOL_CONTRACTS.md");

for (const path of [
  ARTIFACT_PATH,
  "scripts/verify-hosted-clawd-protected-tool-gate.mjs",
  "server/test/hosted-clawd-protected-tool-gate.test.ts",
]) {
  if (!existsSync(path)) blockers.push(`Missing required 0.63H file: ${path}`);
}

if (currentUpdate?.id !== UPDATE_ID) {
  blockers.push(`artifacts/current-update.json id must be ${UPDATE_ID}; got ${currentUpdate?.id ?? "missing"}.`);
}
if (currentUpdate?.selectedAxis !== "hosted_clawd_protected_tool_gate") {
  blockers.push(`0.63H selectedAxis must be hosted_clawd_protected_tool_gate; got ${currentUpdate?.selectedAxis ?? "missing"}.`);
}
if (currentUpdate?.decision !== "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION") {
  blockers.push(`0.63H decision must be PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION; got ${currentUpdate?.decision ?? "missing"}.`);
}
if (currentUpdate?.recommendedNextQuest !== "0.64H Saved Hosted Clawd Read Surface") {
  blockers.push(`0.63H recommendedNextQuest must be 0.64H Saved Hosted Clawd Read Surface; got ${currentUpdate?.recommendedNextQuest ?? "missing"}.`);
}

const gateMetric = currentUpdate?.metricResult?.hostedClawdProtectedToolGate;
const scope = currentUpdate?.metricResult?.scope;
if (gateMetric?.subscriptionTruth !== "repository_webhook_state" || gateMetric?.clientSubscriptionStatusTrusted !== false) {
  blockers.push("0.63H metric must record repository webhook state and reject client subscription trust.");
}
if (gateMetric?.publicToolCount !== 7 || gateMetric?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
  blockers.push("0.63H must keep the seven-tool public MCP surface and zero new MCP tools.");
}
if (scope?.paidWriteRequiresActiveSubscription !== true || scope?.clientStatusTrusted !== false || scope?.protectedWritesOnly !== true) {
  blockers.push("0.63H scope must record active-subscription paid-write gate, client status untrusted, and protected writes only.");
}
if (scope?.publicPaidClaim !== false || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false || scope?.rendererGeometryChanges !== false) {
  blockers.push("0.63H must record no public paid claim, no public Anaheim/Ontario, no provider geometry, and no renderer geometry.");
}

const scripts = packageJson?.scripts ?? {};
if (scripts["test:hosted-clawd-protected-tool-gate"] !== "tsx --test server/test/hosted-clawd-protected-tool-gate.test.ts") {
  blockers.push("package.json must define test:hosted-clawd-protected-tool-gate.");
}
if (scripts["verify:hosted-clawd-protected-tool-gate"] !== "node scripts/verify-hosted-clawd-protected-tool-gate.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-protected-tool-gate.");
}

for (const token of [
  "protectedPaidWriteGate",
  "this.persistence.getSubscriptionStatus",
  'subscriptionStatus === "active"',
  "Paid writes require webhook-confirmed Hosted Clawd billing",
  "Return URLs and client state do not unlock saved Scout or Campaign writes",
  "nextActionForProtectedPaidWrite",
]) {
  assertIncludes(service, token, `Hosted Clawd service missing protected tool gate token: ${token}`);
}
for (const token of [
  "HostedClawdSubscriptionAccessStatus",
  "getSubscriptionStatus(auth: HostedClawdAuthContext)",
  'reason:',
  '"billing_subscription_not_active"',
]) {
  assertIncludes(types, token, `Hosted Clawd types missing 0.63H token: ${token}`);
}
for (const token of [
  "getSubscriptionStatus(auth)",
  "findSubscriptionForOwner(user.id)",
  "hostedClawdSubscriptionAccessStatus(subscription)",
]) {
  assertIncludes(repository, token, `Hosted Clawd repository missing subscription truth token: ${token}`);
}
for (const token of [
  "client-supplied active status does not unlock protected Scout writes",
  "checkout return or incomplete subscription keeps paid writes read-only",
  "webhook-confirmed active subscription opens protected Scout and Campaign writes",
  "payment failure pauses new protected paid writes",
]) {
  assertIncludes(tests, token, `0.63H tests missing case: ${token}`);
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
for (const futureTool of ["host_clawd", "get_hosted_clawd_state", "create_business_profile", "drop_scout", "generate_local_campaign"]) {
  if (serverIndex.includes(`registerAppTool(server, "${futureTool}"`)) {
    blockers.push(`0.63H must not register future public MCP tool: ${futureTool}`);
  }
}

if (artifact?.decision !== "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION") {
  blockers.push("0.63H artifact must record PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION.");
}
if (artifact?.protectedGate?.subscriptionTruth !== "repository_webhook_state" || artifact?.protectedGate?.clientSubscriptionStatusTrusted !== false) {
  blockers.push("0.63H artifact must record repository webhook state and client status untrusted.");
}

for (const [path, text, snippets] of [
  ["docs/NEXT_QUESTS.md", nextQuests, ["Current protected tool gate slice", "0.63H Protected Hosted Clawd Tool Gate", "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION", "0.64H Saved Hosted Clawd Read Surface"]],
  ["docs/DECISIONS.md", decisions, ["Decision 087", "Protected paid writes require stored subscription state", "0.64H Saved Hosted Clawd Read Surface"]],
  ["docs/BUILD_LOG.md", buildLog, ["Entry 202", "0.63H Protected Hosted Clawd Tool Gate", "client-supplied subscriptionStatus is not trusted"]],
  ["docs/PRODUCT_SPEC_AND_GATES.md", productSpec, ["Current protected tool gate note (2026-07-05)", "0.63H Protected Hosted Clawd Tool Gate", "repository webhook state"]],
  ["docs/updates/ATLAS_RELEASE_LADDER.md", releaseLadder, ["Post-Alpha 0.63H - Protected Hosted Clawd Tool Gate", "0.64H Saved Hosted Clawd Read Surface"]],
  ["STATE.md", state, ["0.63H Hosted Clawd protected tool gate", "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION"]],
  ["AGENTS.md", agents, ["Current human-directed local-green slice is `0.63H Protected Hosted Clawd Tool Gate`", "Use `hosted-clawd-protected-tool-gate` for strict split checks"]],
  ["docs/TOOL_CONTRACTS.md", toolContracts, ["0.63H protected gate", "No new public MCP tools", "client-supplied subscriptionStatus is not trusted"]],
]) {
  for (const snippet of snippets) {
    assertIncludes(text, snippet, `${path} missing 0.63H wording: ${snippet}`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  publicToolCount: actualTools.length,
  publicTools: actualTools,
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(result, null, 2));
if (blockers.length > 0) process.exitCode = 1;

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
