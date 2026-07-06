import { existsSync, readFileSync } from "node:fs";

const UPDATE_ID = "postalpha-0.61h-hosted-clawd-invite-beta-save-ux";
const ARTIFACT_PATH = "artifacts/hosted-clawd/postalpha-0.61h-save-ux.json";

const blockers = [];

const packageJson = parseJson("package.json");
const currentUpdate = parseJson("artifacts/current-update.json");
const artifact = parseJson(ARTIFACT_PATH);
const tray = read("web/src/HostedClawdTray.tsx");
const styles = read("web/src/styles.css");
const cityWorldView = read("web/src/CityWorldView.tsx");
const app = read("web/src/App.tsx");
const serverIndex = read("server/src/index.ts");
const nextQuests = read("docs/NEXT_QUESTS.md");
const decisions = read("docs/DECISIONS.md");
const buildLog = read("docs/BUILD_LOG.md");
const productSpec = read("docs/PRODUCT_SPEC_AND_GATES.md");
const releaseLadder = read("docs/updates/ATLAS_RELEASE_LADDER.md");
const state = read("STATE.md");
const agents = read("AGENTS.md");

for (const path of [
  ARTIFACT_PATH,
  "web/src/HostedClawdTray.tsx",
  "web/src/styles.css",
  "scripts/verify-hosted-clawd-save-ux-browser.mjs",
]) {
  if (!existsSync(path)) blockers.push(`Missing required 0.61H file: ${path}`);
}

if (currentUpdate?.id !== UPDATE_ID) {
  blockers.push(`artifacts/current-update.json id must be ${UPDATE_ID}; got ${currentUpdate?.id ?? "missing"}.`);
}
if (currentUpdate?.selectedAxis !== "hosted_clawd_invite_beta_save_ux") {
  blockers.push(`0.61H selectedAxis must be hosted_clawd_invite_beta_save_ux; got ${currentUpdate?.selectedAxis ?? "missing"}.`);
}
if (currentUpdate?.recommendedNextQuest !== "0.62H Stripe Test Billing") {
  blockers.push(`0.61H recommendedNextQuest must be 0.62H Stripe Test Billing; got ${currentUpdate?.recommendedNextQuest ?? "missing"}.`);
}
if (currentUpdate?.decision !== "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED") {
  blockers.push(`0.61H decision must be MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED; got ${currentUpdate?.decision ?? "missing"}.`);
}

const saveUx = currentUpdate?.metricResult?.hostedClawdSaveUx;
const scope = currentUpdate?.metricResult?.scope;
if (saveUx?.visualSource !== "Superior grey setup console plus claymation save slots") {
  blockers.push("0.61H must record the Superior grey setup console plus claymation save slots visual source.");
}
if (saveUx?.publicToolCount !== 7 || saveUx?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
  blockers.push("0.61H must keep exactly seven public MCP tools and zero new MCP tools.");
}
if (scope?.uiSurfaceChanges !== true || scope?.rendererGeometryChanges !== false || scope?.liveCheckout !== false) {
  blockers.push("0.61H must record UI-only save UX, no renderer geometry, and no live checkout.");
}
if (scope?.stripeDepsAdded !== 0 || scope?.stripeTablesAdded !== 0 || scope?.providerGeometry !== false) {
  blockers.push("0.61H must record no Stripe deps/tables and no provider geometry.");
}

const scripts = packageJson?.scripts ?? {};
if (scripts["verify:hosted-clawd-save-ux"] !== "node scripts/verify-hosted-clawd-save-ux.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-save-ux.");
}
if (scripts["verify:hosted-clawd-save-ux:browser"] !== "node scripts/verify-hosted-clawd-save-ux-browser.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-save-ux:browser.");
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

for (const token of [
  "saveReadinessForContext",
  "city-world-hosted-clawd-save-strip",
  'data-qa="hosted-clawd-save-strip"',
  "data-qa-save-readiness",
  "data-qa-save-ready-count",
  "city-world-hosted-clawd-local",
  'data-qa="hosted-clawd-local-view"',
  "city-world-hosted-clawd-save-slots",
  "hosted-clawd-save-slot-",
  "city-world-hosted-clawd-motion-rail",
  "Clawdbot can read this setup later",
]) {
  assertIncludes(tray, token, `Hosted Clawd tray missing 0.61H save UX token: ${token}`);
}

for (const token of [
  ".city-world-hosted-clawd-save-strip",
  ".city-world-hosted-clawd-local",
  ".city-world-hosted-clawd-save-slots",
  ".city-world-hosted-clawd-motion-rail",
  "city-world-hosted-clawd-clay-settle",
  "city-world-hosted-clawd-slot-pop",
  "city-world-hosted-clawd-rail-tick",
  "grid-template-columns: minmax(0, 1fr);",
]) {
  assertIncludes(styles, token, `Hosted Clawd styles missing 0.61H save UX token: ${token}`);
}

assertIncludes(cityWorldView, 'data-qa="hosted-clawd-open"', "Selected place tray must keep the Hosted Clawd entry point.");
assertIncludes(app, "selectedNoteCount: notes.length", "Hosted Clawd context must reflect selected local notes.");

for (const forbidden of [
  /pricing page/i,
  /plan comparison/i,
  /dashboard shell/i,
  /Stripe Checkout is live/i,
  /subscribe now/i,
]) {
  if (forbidden.test(`${tray}\n${styles}`)) {
    blockers.push(`0.61H runtime UI contains blocked save UX wording/pattern: ${forbidden}`);
  }
}

if (artifact?.decision !== "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED") {
  blockers.push("0.61H artifact must record MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED.");
}
if (artifact?.stripe?.status !== "closed" || artifact?.stripe?.earliestSlice !== "0.62H Stripe Test Billing") {
  blockers.push("0.61H artifact must keep Stripe closed until 0.62H.");
}

for (const [path, text, snippets] of [
  ["docs/NEXT_QUESTS.md", nextQuests, ["Current save UX slice", "0.61H Invite Beta Save UX", "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED", "0.62H Stripe Test Billing"]],
  ["docs/DECISIONS.md", decisions, ["Decision 085", "Keep saved state in the map, not a dashboard", "0.62H Stripe Test Billing"]],
  ["docs/BUILD_LOG.md", buildLog, ["Entry 200", "0.61H Invite Beta Save UX", "claymation save slots", "Stripe stays closed"]],
  ["docs/PRODUCT_SPEC_AND_GATES.md", productSpec, ["Current save UX note (2026-07-05)", "0.61H Invite Beta Save UX", "Clawdbot", "Stripe/money"]],
  ["docs/updates/ATLAS_RELEASE_LADDER.md", releaseLadder, ["Post-Alpha 0.61H - Invite Beta Save UX", "0.62H Stripe Test Billing"]],
  ["STATE.md", state, ["0.61H Hosted Clawd invite beta save UX", "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED"]],
  ["AGENTS.md", agents, ["Current human-directed local-green slice is `0.61H Invite Beta Save UX`", "Use `hosted-clawd-save-ux` for strict split checks on the 0.61H save UX branch"]],
]) {
  for (const snippet of snippets) {
    assertIncludes(text, snippet, `${path} missing 0.61H wording: ${snippet}`);
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
