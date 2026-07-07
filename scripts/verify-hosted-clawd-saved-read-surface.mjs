import { existsSync, readFileSync } from "node:fs";

const UPDATE_ID = "postalpha-0.64h-hosted-clawd-saved-read-surface";
const ARTIFACT_PATH = "artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface.json";

const blockers = [];

const packageJson = parseJson("package.json");
const currentUpdate = parseJson("artifacts/current-update.json");
const artifact = parseJson(ARTIFACT_PATH);
const auth = read("server/src/hostedClawd/auth.ts");
const service = read("server/src/hostedClawd/service.ts");
const repository = read("server/src/hostedClawd/repository.ts");
const postgres = read("server/src/hostedClawd/postgres.ts");
const types = read("server/src/hostedClawd/types.ts");
const serverIndex = read("server/src/index.ts");
const app = read("web/src/App.tsx");
const tray = read("web/src/HostedClawdTray.tsx");
const webTypes = read("web/src/types.ts");
const styles = read("web/src/styles.css");
const tests = read("server/test/hosted-clawd-saved-read-surface.test.ts");
const browserVerifier = read("scripts/verify-hosted-clawd-saved-read-browser.mjs");
const nextQuests = read("docs/NEXT_QUESTS.md");
const decisions = read("docs/DECISIONS.md");
const buildLog = read("docs/BUILD_LOG.md");
const productSpec = read("docs/PRODUCT_SPEC_AND_GATES.md");
const releaseLadder = read("docs/updates/ATLAS_RELEASE_LADDER.md");
const state = read("STATE.md");
const agents = read("AGENTS.md");
const toolContracts = read("docs/TOOL_CONTRACTS.md");
const stubAudit = read("docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md");

for (const path of [
  ARTIFACT_PATH,
  "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md",
  "scripts/verify-hosted-clawd-saved-read-browser.mjs",
  "scripts/verify-hosted-clawd-saved-read-surface.mjs",
  "server/test/hosted-clawd-saved-read-surface.test.ts",
]) {
  if (!existsSync(path)) blockers.push(`Missing required 0.64H file: ${path}`);
}

if (currentUpdate?.id !== UPDATE_ID) {
  blockers.push(`artifacts/current-update.json id must be ${UPDATE_ID}; got ${currentUpdate?.id ?? "missing"}.`);
}
if (currentUpdate?.selectedAxis !== "hosted_clawd_saved_read_surface") {
  blockers.push(`0.64H selectedAxis must be hosted_clawd_saved_read_surface; got ${currentUpdate?.selectedAxis ?? "missing"}.`);
}
if (currentUpdate?.decision !== "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS") {
  blockers.push(`0.64H decision must be SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS; got ${currentUpdate?.decision ?? "missing"}.`);
}
if (currentUpdate?.recommendedNextQuest !== "0.65H Hosted Clawd Browser Proof") {
  blockers.push(`0.64H recommendedNextQuest must be 0.65H Hosted Clawd Browser Proof; got ${currentUpdate?.recommendedNextQuest ?? "missing"}.`);
}

const readMetric = currentUpdate?.metricResult?.hostedClawdSavedReadSurface;
const scope = currentUpdate?.metricResult?.scope;
if (
  readMetric?.ownerScopedReads !== true ||
  readMetric?.readRequiresAuth !== true ||
  readMetric?.refreshStatusReadOnly !== true ||
  readMetric?.readRequiresActiveSubscription !== false ||
  readMetric?.readsCreateRows !== false
) {
  blockers.push("0.64H metric must record owner-scoped auth reads, read-only refresh status, no active-subscription read requirement, and no row creation on read.");
}
if (readMetric?.stubAuditPath !== "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md") {
  blockers.push("0.64H metric must record the stub audit path.");
}
if (readMetric?.publicToolCount !== 7 || readMetric?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
  blockers.push("0.64H must keep the seven-tool public MCP surface and zero new MCP tools.");
}
if (
  scope?.readOnlySurface !== true ||
  scope?.persistedWritesAdded !== false ||
  scope?.readRequiresActiveSubscription !== false ||
  scope?.uiSurfaceChanges !== true
) {
  blockers.push("0.64H scope must record one read-only UI surface with no new persisted write expansion.");
}
if (
  scope?.publicPaidClaim !== false ||
  scope?.publicAnaheimPromotion !== false ||
  scope?.providerGeometry !== false ||
  scope?.rendererGeometryChanges !== false
) {
  blockers.push("0.64H must record no public paid claim, no public Anaheim/Ontario, no provider geometry, and no renderer geometry.");
}

const scripts = packageJson?.scripts ?? {};
if (scripts["test:hosted-clawd-saved-read-surface"] !== "tsx --test server/test/hosted-clawd-saved-read-surface.test.ts") {
  blockers.push("package.json must define test:hosted-clawd-saved-read-surface.");
}
if (scripts["verify:hosted-clawd-saved-read-surface"] !== "node scripts/verify-hosted-clawd-saved-read-surface.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-saved-read-surface.");
}
if (scripts["verify:hosted-clawd-saved-read-surface:browser"] !== "node scripts/verify-hosted-clawd-saved-read-browser.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-saved-read-surface:browser.");
}

for (const token of ["hasReadScope", "HOSTED_CLAWD_READ_SCOPE", "hasWriteScope(auth)"]) {
  assertIncludes(auth, token, `Hosted Clawd auth missing saved read token: ${token}`);
}
for (const token of [
  "HostedClawdSavedStateSummary",
  "readSavedState(auth: HostedClawdAuthContext)",
  '"read_saved_state"',
  '"read_scope_required"',
]) {
  assertIncludes(types, token, `Hosted Clawd types missing saved read token: ${token}`);
}
for (const token of [
  "readSavedState(",
  "this.persistence.readSavedState",
  "readAuthDenial",
  "hasReadScope(auth)",
  "savedStateMessage",
]) {
  assertIncludes(service, token, `Hosted Clawd service missing saved read token: ${token}`);
}
for (const token of [
  "findUserByOidcSubject",
  "listScoutDropsForClawd",
  "listCampaignDraftsForClawd",
  "emptySavedState",
  "readOnlyReasonForSavedState",
]) {
  assertIncludes(repository, token, `Hosted Clawd repository missing owner-scoped read token: ${token}`);
}
for (const token of [
  "SELECT id, oidc_subject, email, stripe_customer_id FROM users WHERE oidc_subject = $1",
  "WHERE owner_user_id = $1 AND clawd_id = $2",
  "listScoutDropsForClawd",
  "listCampaignDraftsForClawd",
]) {
  assertIncludes(postgres, token, `Hosted Clawd Postgres repository missing saved read token: ${token}`);
}
for (const token of [
  "/api/hosted-clawd/saved",
  "handleHostedClawdSavedState",
  "HOSTED_CLAWD_READ_SCOPE",
  "hostedClawdSavedStateSchema",
  "ownerGatedTest",
  "Public paid access is not live.",
  "Returning from Checkout does not turn on saving by itself.",
]) {
  assertIncludes(serverIndex, token, `server/src/index.ts missing saved read route/schema token: ${token}`);
}
for (const token of [
  "savedStateEndpointForHostedClawd",
  "/api/hosted-clawd/saved",
  "hostedClawdContext: nextContext",
  "open_saved_campaign",
  'hostedClawdContext.primaryAction.kind === "open_saved_campaign" || hostedClawdContext.primaryAction.kind === "refresh_status"',
  'case "refresh_status":',
]) {
  assertIncludes(app, token, `web/src/App.tsx missing saved read wiring token: ${token}`);
}
for (const token of [
  "hosted-clawd-saved-shelf",
  "data-qa-saved-read-only",
  "data-qa-saved-record-count",
  "Saved items",
  "savedShelfForContext",
]) {
  assertIncludes(tray, token, `web/src/HostedClawdTray.tsx missing saved shelf token: ${token}`);
}
for (const token of ["hostedClawdSavedState", "savedState?:", "readOnlyReason"]) {
  assertIncludes(webTypes, token, `web/src/types.ts missing saved state type token: ${token}`);
}
for (const token of [
  ".city-world-hosted-clawd-saved-shelf",
  ".city-world-hosted-clawd-saved-list",
  "@media (max-width: 720px)",
]) {
  assertIncludes(styles, token, `web/src/styles.css missing saved shelf style token: ${token}`);
}
for (const token of [
  "saved read requires a linked account",
  "empty saved read does not create owner rows",
  "owner scoped read does not expose another owner saved state",
  "payment failure keeps saved history readable",
]) {
  assertIncludes(tests, token, `0.64H tests missing case: ${token}`);
}
for (const token of [
  "postalpha-0.64h-hosted-clawd-saved-read-browser-proof",
  "openai:set_globals",
  "hosted-clawd-saved-shelf",
  "mobile-390x844",
  "noPricingPage",
  "dashboardShell",
  "horizontalOverflow",
]) {
  assertIncludes(browserVerifier, token, `0.64H browser verifier missing token: ${token}`);
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
    blockers.push(`0.64H must not register future public MCP tool: ${futureTool}`);
  }
}

if (artifact?.decision !== "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS") {
  blockers.push("0.64H artifact must record SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS.");
}
if (
  artifact?.savedReadSurface?.ownerScopedReads !== true ||
  artifact?.savedReadSurface?.readsCreateRows !== false ||
  artifact?.savedReadSurface?.publicToolCount !== 7
) {
  blockers.push("0.64H artifact must record owner-scoped read-only saved state and seven public tools.");
}
if (artifact?.proof?.stubAudit !== "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md") {
  blockers.push("0.64H artifact must point to the Hosted Clawd stub audit.");
}
if (
  !Array.isArray(artifact?.proof?.browserScreenshots) ||
  !artifact.proof.browserScreenshots.includes("artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface/hosted-clawd-saved-read-desktop-1280x720.png") ||
  !artifact.proof.browserScreenshots.includes("artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface/hosted-clawd-saved-read-mobile-390x844.png")
) {
  blockers.push("0.64H artifact must record desktop and mobile saved-read browser screenshots.");
}

for (const token of [
  "FIX_NOW_0.64H",
  "LOG_NEXT",
  "IGNORE_OK",
  "`refresh_status` was wired as a write action",
  "`get_upgrade_options` contradicted the gated Hosted Clawd stack",
  "Widget bearer-token path is still a 0.65H decision",
]) {
  assertIncludes(stubAudit, token, `docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md missing audit token: ${token}`);
}

for (const [path, text, snippets] of [
  ["docs/NEXT_QUESTS.md", nextQuests, ["Current saved read surface slice", "0.64H Saved Hosted Clawd Read Surface", "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS", "0.65H Hosted Clawd Browser Proof"]],
  ["docs/DECISIONS.md", decisions, ["Decision 088", "Saved reads stay owner-scoped and HTTP-only", "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS"]],
  ["docs/BUILD_LOG.md", buildLog, ["Entry 203", "0.64H Saved Hosted Clawd Read Surface", "read-only saved shelf"]],
  ["docs/PRODUCT_SPEC_AND_GATES.md", productSpec, ["Current saved read surface note (2026-07-05)", "0.64H Saved Hosted Clawd Read Surface", "owner-scoped saved state"]],
  ["docs/updates/ATLAS_RELEASE_LADDER.md", releaseLadder, ["Post-Alpha 0.64H - Saved Hosted Clawd Read Surface", "0.65H Hosted Clawd Browser Proof"]],
  ["STATE.md", state, ["0.64H Hosted Clawd saved read surface", "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS"]],
  ["AGENTS.md", agents, ["Current human-directed local-green slice is `0.64H Saved Hosted Clawd Read Surface`", "Use `hosted-clawd-saved-read-surface` for strict split checks"]],
  ["docs/TOOL_CONTRACTS.md", toolContracts, ["0.64H saved read surface", "HTTP-only", "No new public MCP tools"]],
]) {
  for (const snippet of snippets) {
    assertIncludes(text, snippet, `${path} missing 0.64H wording: ${snippet}`);
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
