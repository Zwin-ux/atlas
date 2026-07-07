import { existsSync, readFileSync } from "node:fs";

const UPDATE_ID = "postalpha-0.62h-hosted-clawd-stripe-test-billing";
const ARTIFACT_PATH = "artifacts/hosted-clawd/postalpha-0.62h-stripe-test-billing.json";
const MIGRATION_PATH = "migrations/hosted-clawd/002_stripe_test_billing.sql";
const CLAY_BG_PATH = "assets/generated/placeholders/svg/hosted-clawd-clay-bg.svg";

const blockers = [];

const packageJson = parseJson("package.json");
const currentUpdate = parseJson("artifacts/current-update.json");
const serverIndex = read("server/src/index.ts");
const billing = read("server/src/hostedClawd/billing.ts");
const service = read("server/src/hostedClawd/service.ts");
const repository = read("server/src/hostedClawd/repository.ts");
const postgres = read("server/src/hostedClawd/postgres.ts");
const types = read("server/src/hostedClawd/types.ts");
const migration = read(MIGRATION_PATH);
const tray = read("web/src/HostedClawdTray.tsx");
const styles = read("web/src/styles.css");
const app = read("web/src/App.tsx");
const webTypes = read("web/src/types.ts");
const envExample = read(".env.example");
const tests = read("server/test/hosted-clawd-stripe-test-billing.test.ts");
const nextQuests = read("docs/NEXT_QUESTS.md");
const decisions = read("docs/DECISIONS.md");
const buildLog = read("docs/BUILD_LOG.md");
const productSpec = read("docs/PRODUCT_SPEC_AND_GATES.md");
const releaseLadder = read("docs/updates/ATLAS_RELEASE_LADDER.md");
const state = read("STATE.md");
const agents = read("AGENTS.md");
const artifact = parseJson(ARTIFACT_PATH);

for (const path of [
  ARTIFACT_PATH,
  MIGRATION_PATH,
  CLAY_BG_PATH,
  "server/src/hostedClawd/billing.ts",
  "server/test/hosted-clawd-stripe-test-billing.test.ts",
]) {
  if (!existsSync(path)) blockers.push(`Missing required 0.62H file: ${path}`);
}

if (currentUpdate?.id !== UPDATE_ID) {
  blockers.push(`artifacts/current-update.json id must be ${UPDATE_ID}; got ${currentUpdate?.id ?? "missing"}.`);
}
if (currentUpdate?.selectedAxis !== "hosted_clawd_stripe_test_billing") {
  blockers.push(`0.62H selectedAxis must be hosted_clawd_stripe_test_billing; got ${currentUpdate?.selectedAxis ?? "missing"}.`);
}
if (currentUpdate?.decision !== "STRIPE_TEST_BILLING_WEBHOOK_GATED") {
  blockers.push(`0.62H decision must be STRIPE_TEST_BILLING_WEBHOOK_GATED; got ${currentUpdate?.decision ?? "missing"}.`);
}
if (currentUpdate?.recommendedNextQuest !== "0.63H Protected Hosted Clawd Tool Gate") {
  blockers.push(`0.62H recommendedNextQuest must be 0.63H Protected Hosted Clawd Tool Gate; got ${currentUpdate?.recommendedNextQuest ?? "missing"}.`);
}
const billingMetric = currentUpdate?.metricResult?.hostedClawdStripeTestBilling;
const scope = currentUpdate?.metricResult?.scope;
if (billingMetric?.confirmationSource !== "stripe_webhook" || billingMetric?.returnUrlGrantsAccess !== false) {
  blockers.push("0.62H metric must record webhook-only confirmation and returnUrlGrantsAccess false.");
}
if (scope?.stripeDepsAdded !== 1 || scope?.stripeTablesAdded !== 2 || scope?.dbMigrations !== 2 || scope?.newMcpTools !== 0) {
  blockers.push("0.62H scope must record one Stripe dep, two Stripe tables, two total Hosted Clawd migrations, and zero new MCP tools.");
}
if (scope?.publicPaidClaim !== false || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false || scope?.rendererGeometryChanges !== false) {
  blockers.push("0.62H scope must keep public paid claims, public Anaheim/Ontario, provider geometry, and renderer geometry closed.");
}

const dependencies = { ...(packageJson?.dependencies ?? {}), ...(packageJson?.devDependencies ?? {}) };
if (!Object.prototype.hasOwnProperty.call(dependencies, "stripe")) blockers.push("0.62H requires server-side stripe dependency.");
for (const dep of ["@stripe/stripe-js", "@supabase/supabase-js", "prisma", "@prisma/client", "drizzle-orm", "auth0", "next-auth"]) {
  if (Object.prototype.hasOwnProperty.call(dependencies, dep)) blockers.push(`0.62H must not add blocked dependency: ${dep}.`);
}

const scripts = packageJson?.scripts ?? {};
if (scripts["test:hosted-clawd-billing"] !== "tsx --test server/test/hosted-clawd-stripe-test-billing.test.ts") {
  blockers.push("package.json must define test:hosted-clawd-billing.");
}
if (scripts["verify:hosted-clawd-stripe-billing"] !== "node scripts/verify-hosted-clawd-stripe-billing.mjs") {
  blockers.push("package.json must define verify:hosted-clawd-stripe-billing.");
}

for (const token of [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_HOSTED_CLAWD_PRICE_ID",
  "STRIPE_API_VERSION=2026-02-25.clover",
  "APP_BASE_URL=http://localhost:8787",
]) {
  assertIncludes(envExample, token, `.env.example missing ${token}.`);
}

for (const token of [
  "stripe_customer_id",
  "hosted_clawd_subscriptions",
  "stripe_webhook_events",
  "stripe_subscription_id TEXT NOT NULL UNIQUE",
  "stripe_event_id TEXT NOT NULL UNIQUE",
  "processing_status IN ('processing', 'processed', 'failed')",
]) {
  assertIncludes(migration, token, `0.62H migration missing ${token}.`);
}

for (const token of [
  "readHostedClawdBillingConfig",
  "sk_live_",
  "createStripeHostedClawdClient",
  "stripe.checkout.sessions.create",
  'mode: "subscription"',
  "line_items: [{ price: config.priceId, quantity: 1 }]",
  "success_url",
  "{CHECKOUT_SESSION_ID}",
  "returnUrlGrantsAccess: false",
  "stripe.billingPortal.sessions.create",
  "constructHostedClawdStripeEvent",
  "stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)",
  "recordStripeWebhookEventStarted",
  "customer.subscription.updated",
  "invoice.payment_failed",
]) {
  assertIncludes(billing, token, `billing adapter missing ${token}.`);
}

for (const token of [
  "startCheckout(input, verified.auth)",
  "openBillingPortal(input, verified.auth)",
  "/api/stripe/webhook",
  "readRawBody",
  "stripe-signature",
  "handleHostedClawdStripeWebhookRoute",
]) {
  assertIncludes(serverIndex, token, `server route missing ${token}.`);
}

assertIncludes(service, "Stripe return is not access. Webhooks decide paid writes.", "service must expose return-not-access copy.");
assertIncludes(service, "Return received. Waiting for Stripe webhook.", "service must expose return pending copy.");
assertIncludes(types, "HostedClawdBillingSummary", "types must expose billing summary.");
assertIncludes(repository, "hostedClawdSubscriptionAccessStatus", "repository must expose subscription access status mapper.");
assertIncludes(postgres, "recordStripeWebhookEventStarted", "Postgres repository must implement webhook replay guard.");

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
  "hosted-clawd-clay-bg.svg",
  'data-qa-no-pricing-page="true"',
  'data-qa-dashboard-shell="false"',
  'data-qa-save-surface-count="1"',
  'data-qa="hosted-clawd-billing-rail"',
  "data-qa-checkout-confirmation-source",
  'data-qa="hosted-clawd-billing-webhook"',
  'data-qa="hosted-clawd-billing-return"',
  'data-access-granted="false"',
  'data-qa="hosted-clawd-billing-readonly"',
  "billingCheckoutStatus",
]) {
  assertIncludes(tray, token, `Hosted Clawd tray missing 0.62H billing UI token: ${token}`);
}
if (tray.includes('className="city-world-hosted-clawd-save"')) {
  blockers.push("Hosted Clawd tray must not render the old duplicate save preview surface.");
}
for (const token of [
  "--hosted-setup-maroon",
  "var(--hosted-clay-bg)",
  ".city-world-hosted-clawd-billing",
  ".city-world-hosted-clawd-billing-steps",
  "grid-template-columns: repeat(5, minmax(0, 1fr));",
  "grid-template-columns: repeat(2, minmax(0, 1fr));",
]) {
  assertIncludes(styles, token, `Hosted Clawd styles missing 0.62H billing/clay token: ${token}`);
}
assertIncludes(webTypes, "returnUrlGrantsAccess: false", "web types must carry returnUrlGrantsAccess false.");
assertIncludes(app, "window.open(body.result.redirectUrl", "widget must open server-returned Stripe URL.");

const uiAndEnvText = `${tray}\n${styles}\n${app}\n${envExample}`;
for (const forbidden of [
  /pricing page/i,
  /plan comparison/i,
  /dashboard shell/i,
  /subscribe now/i,
  /sk_live_[A-Za-z0-9]{8,}/,
]) {
  if (forbidden.test(uiAndEnvText)) {
    blockers.push(`0.62H contains blocked UI/live-key wording or pattern: ${forbidden}`);
  }
}

for (const token of [
  "checkout creates subscription session with server-owned price and no access grant",
  "portal requires owner-attached Stripe customer",
  "webhook replay is idempotent",
  "webhook signature uses raw body",
  "billing config rejects live secret keys",
]) {
  assertIncludes(tests, token, `0.62H tests missing case: ${token}.`);
}

if (artifact?.decision !== "STRIPE_TEST_BILLING_WEBHOOK_GATED") {
  blockers.push("0.62H artifact must record STRIPE_TEST_BILLING_WEBHOOK_GATED.");
}
if (artifact?.billing?.returnUrlGrantsAccess !== false || artifact?.billing?.confirmationSource !== "stripe_webhook") {
  blockers.push("0.62H artifact must record webhook confirmation and return URL no-access.");
}

for (const [path, text, snippets] of [
  ["docs/NEXT_QUESTS.md", nextQuests, ["Current Stripe test billing slice", "0.62H Stripe Test Billing", "STRIPE_TEST_BILLING_WEBHOOK_GATED", "0.63H Protected Hosted Clawd Tool Gate"]],
  ["docs/DECISIONS.md", decisions, ["Decision 086", "Stripe return is not access", "0.63H Protected Hosted Clawd Tool Gate"]],
  ["docs/BUILD_LOG.md", buildLog, ["Entry 201", "0.62H Stripe Test Billing", "webhook replay guard", "dark maroon clay"]],
  ["docs/PRODUCT_SPEC_AND_GATES.md", productSpec, ["Current Stripe test billing note (2026-07-05)", "0.62H Stripe Test Billing", "Stripe webhook", "public paid claims remain closed"]],
  ["docs/updates/ATLAS_RELEASE_LADDER.md", releaseLadder, ["Post-Alpha 0.62H - Stripe Test Billing", "0.63H Protected Hosted Clawd Tool Gate"]],
  ["STATE.md", state, ["0.62H Hosted Clawd Stripe test billing", "STRIPE_TEST_BILLING_WEBHOOK_GATED"]],
  ["AGENTS.md", agents, ["Current human-directed local-green slice is `0.62H Stripe Test Billing`", "Use `hosted-clawd-stripe-billing` for strict split checks"]],
]) {
  for (const snippet of snippets) {
    assertIncludes(text, snippet, `${path} missing 0.62H wording: ${snippet}`);
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

function artifactText() {
  return read(ARTIFACT_PATH);
}
