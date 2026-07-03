import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const UPDATE = "postalpha-0.33e-db-scene-packet-persistence-plan";
const PLAN_PATH = "artifacts/scene-packet-persistence/0.33e-db-scene-packet-persistence-plan.json";
const DOC_PATH = "docs/SCENE_PACKET_DB_PERSISTENCE_PLAN.md";
const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const warnings = [];
const checks = [];

function addCheck(id, passed, blocker, extra = {}) {
  checks.push({ id, passed, ...extra, ...(passed ? {} : { blocker }) });
  if (!passed) blockers.push(blocker);
}

const planText = existsSync(PLAN_PATH) ? readFileSync(PLAN_PATH, "utf8") : "";
const docText = existsSync(DOC_PATH) ? readFileSync(DOC_PATH, "utf8") : "";

addCheck("plan-artifact-exists", Boolean(planText), `Missing ${PLAN_PATH}.`);
addCheck("human-doc-exists", Boolean(docText), `Missing ${DOC_PATH}.`);

let plan = {};
if (planText) {
  try {
    plan = JSON.parse(planText);
  } catch (error) {
    blockers.push(`${PLAN_PATH} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

addCheck("planning-only", plan.status === "planning_only" && plan.implementationAllowed === false, "0.33E must remain planning_only with implementationAllowed false.");
addCheck("human-approval-required", plan.humanApprovalRequiredBeforeImplementation === true, "0.33E must require human approval before DB implementation.");
addCheck("basis-links-031-032", plan.basis?.contractUpdate === "postalpha-0.31e-server-scene-packet-cache-contract" && plan.basis?.runtimeAdapterUpdate === "postalpha-0.32e-runtime-scene-packet-memory-adapter", "Plan must build on 0.31E contract and 0.32E runtime adapter.");
addCheck("schema-has-required-tables", hasTables(plan, ["scene_packet_cache_entries", "scene_packet_generation_jobs", "scene_packet_audit_events"]), "Plan must define cache entries, generation jobs, and audit event tables.");
addCheck("ttl-plan-covers-readiness", ["public_playable", "shell_only", "hidden_draft", "unsupported"].every((key) => plan.ttlPlan?.[key]), "Plan must define TTL behavior for public, shell, hidden, and unsupported readiness.");
addCheck("rollback-has-runtime-memory-fallback", Array.isArray(plan.migrationReviewPlan?.rollbackPlan) && plan.migrationReviewPlan.rollbackPlan.some((step) => /runtime_memory/i.test(step)), "Rollback plan must explicitly fall back to runtime_memory.");
addCheck("feature-flag-is-future-only", plan.featureFlagPlan?.futureEnvName === "ATLAS_SCENE_PACKET_STORAGE" && plan.featureFlagPlan?.defaultValue === "runtime_memory", "Plan must name future storage flag with runtime_memory as default.");
addCheck("blocked-until-approval", containsAll(plan.blockedUntilApproval, ["adding DATABASE_URL or database secrets", "creating migrations", "adding DB package dependencies"]), "Plan must block env, migrations, and DB dependencies until approval.");
addCheck("forbidden-fields-listed", containsAll(plan.dataBoundaries?.forbiddenStoredFields, ["raw Google provider payload", "Google placeId", "Stripe customer id", "OAuth token", "XP ledger", "evidence payload"]), "Plan must explicitly forbid provider, payment, OAuth, XP, and evidence fields.");
addCheck("doc-names-no-implementation", /Status: planning only/i.test(docText) && /This slice does not add the env var/i.test(docText), "Human doc must state planning-only and no env implementation.");

const pkg = readJsonIfExists("package.json");
const dbPackageNames = ["pg", "postgres", "prisma", "@prisma/client", "drizzle-orm", "knex", "typeorm", "sequelize", "@supabase/supabase-js"];
const activeDependencyNames = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
];
const dbDeps = activeDependencyNames.filter((name) => dbPackageNames.includes(name));
addCheck("no-db-dependencies", dbDeps.length === 0, `0.33E must not add DB package dependencies: ${dbDeps.join(", ")}.`, { dbDeps });

addCheck("no-migrations-directory", !existsSync("migrations"), "0.33E must not create migrations/.");

const envFiles = [".env", ".env.local", ".env.example"].filter((path) => existsSync(path));
const envDbTokens = envFiles.flatMap((path) => {
  const text = readFileSync(path, "utf8");
  return /DATABASE_URL|POSTGRES|SUPABASE|PRISMA/i.test(text) ? [path] : [];
});
addCheck("no-db-env-drift", envDbTokens.length === 0, `0.33E must not add DB env tokens: ${envDbTokens.join(", ")}.`, { envFilesWithDbTokens: envDbTokens });

const serverFiles = listTrackedAndUntracked("server/src");
const forbiddenServerTokens = [];
for (const path of serverFiles) {
  const text = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (/from ["'](?:pg|postgres|prisma|@prisma|@supabase|knex|typeorm|sequelize)/i.test(text)) forbiddenServerTokens.push(`${path}:db-import`);
  if (/DATABASE_URL|createPool|new PrismaClient|drizzle\(|supabase\.from/i.test(text)) forbiddenServerTokens.push(`${path}:db-runtime`);
}
addCheck("no-server-db-runtime", forbiddenServerTokens.length === 0, `Server code must not contain DB runtime implementation: ${forbiddenServerTokens.join(", ")}.`, { forbiddenServerTokens });

const splitGuard = existsSync("scripts/verify-alpha-rc-split.mjs") ? readFileSync("scripts/verify-alpha-rc-split.mjs", "utf8") : "";
addCheck("split-guard-allows-plan-verifier", splitGuard.includes("scripts/verify-scene-packet-db-persistence-plan.mjs") && splitGuard.includes("docs/SCENE_PACKET_DB_PERSISTENCE_PLAN.md"), "Split guard must allow the 0.33E plan doc and verifier.");

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  planPath: PLAN_PATH,
  docPath: DOC_PATH,
  blockerCount: blockers.length,
  blockers,
  warnings,
  checks,
  schemaTables: Array.isArray(plan.schema?.tables) ? plan.schema.tables.map((table) => table.name) : [],
  reviewGateStatuses: Array.isArray(plan.reviewGates)
    ? Object.fromEntries(plan.reviewGates.map((gate) => [gate.id, gate.status]))
    : {},
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function hasTables(candidate, names) {
  const actual = new Set((candidate.schema?.tables ?? []).map((table) => table.name));
  return names.every((name) => actual.has(name));
}

function containsAll(candidate, needles) {
  const haystack = Array.isArray(candidate) ? candidate.join("\n") : "";
  return needles.every((needle) => haystack.includes(needle));
}

function readJsonIfExists(path) {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8"));
}

function listTrackedAndUntracked(prefix) {
  const paths = new Set();
  try {
    const tracked = execFileSync("git", ["ls-files", prefix], { encoding: "utf8" });
    for (const line of tracked.split(/\r?\n/)) if (line) paths.add(line);
  } catch (error) {
    warnings.push(`Unable to list tracked ${prefix}: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", prefix], { encoding: "utf8" });
    for (const line of untracked.split(/\r?\n/)) if (line) paths.add(line);
  } catch (error) {
    warnings.push(`Unable to list untracked ${prefix}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return [...paths];
}
