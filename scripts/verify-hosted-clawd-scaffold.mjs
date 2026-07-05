import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const UPDATE_ID = "postalpha-0.58h-hosted-clawd-scaffold";

const requiredFiles = [
  "docs/BETA_HOSTED_CLAWD_SPEC.md",
  "docs/HOSTED_CLAWD_PRD.md",
  "server/src/hostedClawd/gates.ts",
  "server/src/hostedClawd/index.ts",
  "server/src/hostedClawd/service.ts",
  "server/src/hostedClawd/types.ts",
  "web/src/HostedClawdTray.tsx",
];

const expectedTools = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
].sort();

const forbiddenRuntimeCopy = [
  "unlimited",
  "autopilot",
  "guaranteed leads",
  "ai employee",
  "hands-free",
  "seamless",
  "revolutionary",
];

const forbiddenDeps = [
  "stripe",
  "@stripe/stripe-js",
  "pg",
  "postgres",
  "@supabase/supabase-js",
  "prisma",
  "@prisma/client",
  "drizzle-orm",
  "auth0",
  "next-auth",
];

const blockers = [];

for (const file of requiredFiles) {
  if (!exists(file)) {
    blockers.push(`Missing required Hosted Clawd scaffold file: ${file}`);
  }
}

const server = read("server/src/index.ts");
const service = read("server/src/hostedClawd/service.ts");
const gates = read("server/src/hostedClawd/gates.ts");
const types = read("server/src/hostedClawd/types.ts");
const tray = read("web/src/HostedClawdTray.tsx");
const app = read("web/src/App.tsx");
const cityWorldView = read("web/src/CityWorldView.tsx");
const styles = read("web/src/styles.css");
const packageJson = parseJson("package.json");
const currentUpdate = parseJson("artifacts/current-update.json");

const actualTools = [...server.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)].map((match) => match[1]).sort();
if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) {
  blockers.push(`Public MCP tool surface changed. Expected ${expectedTools.join(", ")}, found ${actualTools.join(", ")}.`);
}

for (const route of [
  "/api/hosted-clawd/state",
  "/api/hosted-clawd/create-or-attach",
  "/api/hosted-clawd/promote-session",
  "/api/hosted-clawd/saved-artifacts/campaigns",
  "/api/hosted-clawd/checkout",
  "/api/hosted-clawd/billing-portal",
]) {
  assertIncludes(server, route, `Missing Hosted Clawd HTTP route scaffold: ${route}`);
}

for (const token of [
  "ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED",
  "ATLAS_HOSTED_CLAWD_MONEY_ENABLED",
  "ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED",
  "HUMAN_APPROVAL_BEFORE_PERSISTENCE",
  "HUMAN_APPROVAL_BEFORE_MONEY",
  "HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM",
]) {
  assertIncludes(gates, token, `Hosted Clawd gates missing ${token}.`);
  assertIncludes(service + types + server, token, `Hosted Clawd runtime contract missing ${token}.`);
}

assertIncludes(service, "readHostedClawdFeatureFlags(process.env)", "Hosted Clawd service must read feature flags from server env.");
assertIncludes(service, "if (!value) return false", "Hosted Clawd feature flags must be false when unset.");
assertIncludes(service, "canPersist: this.flags.persistenceEnabled && Boolean(this.persistence)", "Persistence must require both the flag and an adapter.");
assertIncludes(service, "canStartCheckout: this.flags.moneyEnabled && Boolean(this.billing)", "Checkout must require both the money flag and a billing adapter.");
assertIncludes(service, "Payment is not live in Alpha", "Money-closed response must tell the user payment is not live.");
assertIncludes(service, "Hosted Clawd is not live yet", "Persistence-closed response must stay in waitlist state.");
assertIncludes(server, "hostedClawd: hostedClawdContextForScene", "Playable map metadata must expose widget-only Hosted Clawd context.");
assertIncludes(server, "hostedClawd: hostedClawdContextForScout", "Scout metadata must expose widget-only Hosted Clawd context.");
assertIncludes(server, "hostedClawd: hostedClawdContextForCampaign", "Campaign metadata must expose widget-only Hosted Clawd context.");
assertIncludes(server, "hostedClawdContextSchema", "Upgrade tool output schema must validate Hosted Clawd context.");
assertIncludes(tray, 'data-qa="hosted-clawd-tray"', "Hosted Clawd tray needs a stable QA hook.");
assertIncludes(tray, 'data-qa="hosted-clawd-setup-rail"', "Hosted Clawd setup UI needs a stable setup rail hook.");
assertIncludes(tray, 'data-qa-setup-console="grey"', "Hosted Clawd setup UI must preserve the grey setup console QA marker.");
assertIncludes(tray, "city-world-hosted-clawd-windowbar", "Hosted Clawd setup UI must include the grey setup window bar.");
assertIncludes(tray, "city-world-hosted-clawd-stage-buttons", "Hosted Clawd setup UI must include compact stage slabs.");
assertIncludes(tray, "city-world-hosted-clawd-recovery", "Hosted Clawd setup UI must include the recovery/status card.");
assertIncludes(tray, "setupStepsForContext", "Hosted Clawd setup UI must derive setup steps from the existing context.");
assertIncludes(tray, "activeSetupStepId", "Hosted Clawd setup UI must compute the active setup step from readiness.");
assertIncludes(tray, "closedGateCount > 0 ? \"Locked\" : \"Ready\"", "Hosted Clawd setup UI must show the gate as locked while approvals are closed.");
assertNotIncludes(tray, "city-world-hosted-clawd-step-list", "Hosted Clawd setup UI must not render a duplicate wizard-like step list.");
assertIncludes(cityWorldView, "Host Clawd", "Map tray must expose the Hosted Clawd entry point.");
assertIncludes(styles, ".city-world-hosted-clawd", "Hosted Clawd tray styles are missing.");
assertIncludes(styles, ".city-world-hosted-clawd-setup", "Hosted Clawd setup rail styles are missing.");
assertIncludes(styles, "--hosted-setup-shell", "Hosted Clawd setup UI must define grey setup console tokens.");
assertIncludes(styles, ".city-world-hosted-clawd-stage-button", "Hosted Clawd setup stage slab styles are missing.");
assertIncludes(styles, ".city-world-hosted-clawd-recovery", "Hosted Clawd recovery card styles are missing.");
assertNotIncludes(styles, ".city-world-hosted-clawd-step-list", "Hosted Clawd setup styles must not keep dead duplicate step-list CSS.");
if (/\.city-world-hosted-clawd\s*\{[^}]*backdrop-filter/s.test(styles)) {
  blockers.push("Hosted Clawd setup shell must not pay for an invisible backdrop filter.");
}

const setupSteps = currentUpdate?.metricResult?.hostedClawdSetupUi?.steps;
const expectedSetupSteps = ["Wake", "Target", "Scout", "Campaign", "Gate", "Proof"];
if (currentUpdate?.id === "postalpha-0.58j-hosted-clawd-setup-ui-port" && JSON.stringify(setupSteps) !== JSON.stringify(expectedSetupSteps)) {
  blockers.push(`0.58J setup artifact steps drifted. Expected ${expectedSetupSteps.join(", ")}, got ${Array.isArray(setupSteps) ? setupSteps.join(", ") : "missing"}.`);
}

const sourceForForbiddenCalls = `${server}\n${service}\n${types}`;
for (const pattern of [
  /from\s+["']stripe["']/i,
  /require\(["']stripe["']\)/i,
  /new\s+Stripe\b/i,
  /stripe\.checkout/i,
  /createCheckoutSession/i,
  /from\s+["']pg["']/i,
  /from\s+["']postgres["']/i,
  /from\s+["']@supabase\/supabase-js["']/i,
  /from\s+["']@prisma\/client["']/i,
  /from\s+["']drizzle-orm["']/i,
  /oauth/i,
]) {
  if (pattern.test(sourceForForbiddenCalls)) {
    blockers.push(`Hosted Clawd scaffold contains forbidden live integration pattern: ${pattern}`);
  }
}

for (const dependencyName of forbiddenDeps) {
  if (hasDependency(packageJson, dependencyName)) {
    blockers.push(`Hosted Clawd scaffold must not add live dependency yet: ${dependencyName}`);
  }
}

const runtimeCopy = `${service}\n${tray}\n${app}\n${cityWorldView}`.toLowerCase();
for (const phrase of forbiddenRuntimeCopy) {
  if (runtimeCopy.includes(phrase)) {
    blockers.push(`Runtime Hosted Clawd copy contains banned phrase: ${phrase}`);
  }
}

if (!/No live Stripe key, checkout call, auth provider, database client, applied\s+migration, evidence write, XP grant, report export, or new MCP tool is added\./m.test(read("docs/BETA_HOSTED_CLAWD_SPEC.md"))) {
  blockers.push("Beta Hosted Clawd spec must keep the scaffold anti-scope explicit.");
}

const summary = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  publicToolCount: actualTools.length,
  publicTools: actualTools,
  requiredFiles,
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  process.exitCode = 1;
}

function assertIncludes(source, token, message) {
  if (!source.includes(token)) {
    blockers.push(message);
  }
}

function assertNotIncludes(source, token, message) {
  if (source.includes(token)) {
    blockers.push(message);
  }
}

function hasDependency(packageJsonValue, name) {
  return Boolean(packageJsonValue?.dependencies?.[name] || packageJsonValue?.devDependencies?.[name]);
}

function parseJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    blockers.push(`Could not parse JSON file: ${file}`);
    return {};
  }
}

function read(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}
