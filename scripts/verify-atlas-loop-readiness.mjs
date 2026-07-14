import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import process from "node:process";

const jsonOnly = process.argv.includes("--json-only");

const requiredFiles = [
  "LOOP.md",
  "STATE.md",
  "loop-budget.md",
  "loop-run-log.md",
  "loop-constraints.md",
  "docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md",
  "docs/NEXT_QUESTS.md",
  "docs/BUILD_LOG.md",
  "docs/DECISIONS.md",
  "artifacts/current-update.json",
  "scripts/verify-alpha-rc-split.mjs",
];

const blockers = [];
const warnings = [];
const expectedCurrentUpdateId = "postalpha-0.78-1v-census-county-board-certification";
const expectedDecision = "CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE";
const expectedSelectedAxis = "real_geography_promotion_readiness";
const expectedApprovalEvidence = "artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md";

function read(path) {
  if (!existsSync(path)) {
    blockers.push(`Missing required loop file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const files = Object.fromEntries(requiredFiles.map((path) => [path, read(path)]));

function requireText(path, needle, message) {
  if (!files[path]?.includes(needle)) blockers.push(message);
}

function warnIfMissing(path, needle, message) {
  if (!files[path]?.includes(needle)) warnings.push(message);
}

requireText("LOOP.md", "L2 assisted", "LOOP.md must declare Atlas as L2 assisted, not unattended.");
requireText("LOOP.md", "APPROVE_CONTROLLED_PUBLIC_SPIKE", "LOOP.md must name the public Anaheim cutline.");
requireText("STATE.md", "Current Slice", "STATE.md must contain the current loop slice.");
requireText("STATE.md", "Keep Anaheim/Ontario hidden and non-public", "STATE.md must preserve the current Anaheim/Ontario block.");
requireText("loop-budget.md", "Kill Switch", "loop-budget.md must define a kill switch.");
requireText("loop-constraints.md", "Forbidden Scope", "loop-constraints.md must define forbidden scope.");
requireText("loop-constraints.md", "package/lock/env", "loop-constraints.md must block package/lock/env drift.");
requireText("docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md", "country -> state -> county -> district -> place", "Full project loop spec must preserve the USA-scale hierarchy.");
requireText("docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md", "Atlas is currently L2 assisted", "Full project loop spec must state the current loop level.");
requireText("docs/NEXT_QUESTS.md", "0.78-1V Census County Board Product + Certification Gate", "NEXT_QUESTS must point at the current 0.78-1V Census board gate.");
requireText("docs/NEXT_QUESTS.md", "0.78-2 Real Town Anchors", "NEXT_QUESTS must preserve the owner-gated 0.78-2 continuation.");
requireText("scripts/verify-alpha-rc-split.mjs", "scripts/verify-atlas-loop-readiness.mjs", "Split guard must allow the Atlas loop readiness verifier.");
requireText("scripts/verify-alpha-rc-split.mjs", "LOOP.md", "Split guard must allow LOOP.md.");

warnIfMissing("loop-run-log.md", "Loop setup", "loop-run-log.md should include the initial setup entry.");

let currentUpdate = {};
try {
  currentUpdate = JSON.parse(files["artifacts/current-update.json"] || "{}");
} catch (error) {
  blockers.push(`artifacts/current-update.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

if (currentUpdate.id !== expectedCurrentUpdateId) blockers.push(`Current update is ${currentUpdate.id ?? "missing"}, expected ${expectedCurrentUpdateId}.`);
if (currentUpdate.status !== "local_green_owner_approved_release_authorized") blockers.push(`Current update status must be local_green_owner_approved_release_authorized; got ${currentUpdate.status ?? "missing"}.`);
if (currentUpdate.decision !== expectedDecision) blockers.push(`Current update decision must be ${expectedDecision}; got ${currentUpdate.decision ?? "missing"}.`);
if (currentUpdate.selectedAxis !== expectedSelectedAxis) blockers.push(`Current update selectedAxis must be ${expectedSelectedAxis}; got ${currentUpdate.selectedAxis ?? "missing"}.`);
if (currentUpdate.metricResult?.defaultEnabled !== false) blockers.push("The Census board must remain flag-dark by default.");
if (currentUpdate.metricResult?.newMcpTools !== 0) blockers.push("0.78-1V must keep the seven-tool MCP surface unchanged.");
const currentGates = Array.isArray(currentUpdate.gates) ? currentUpdate.gates : [];
const ownerGate = currentGates.find((gate) => gate?.id === "owner-screenshot-review");
const deployGate = currentGates.find((gate) => gate?.id === "production-deploy");
const realHostGate = currentGates.find((gate) => gate?.id === "real-host-g8");
if (ownerGate?.required !== true || ownerGate?.status !== "passed" || ownerGate?.evidence !== expectedApprovalEvidence) {
  blockers.push("Owner screenshot review must be passed with the recorded 0.78-1V approval artifact.");
}
if (deployGate?.required !== true || deployGate?.status !== "pending" || deployGate?.authorization !== "approved") {
  blockers.push("Production deploy must remain pending but explicitly owner-authorized.");
}
if (realHostGate?.required !== true || realHostGate?.status !== "pending") {
  blockers.push("Real-host G8 must remain pending until the deployed build is exercised in ChatGPT.");
}

const cutlinePath = "artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json";
if (existsSync(cutlinePath)) {
  try {
    const cutline = JSON.parse(readFileSync(cutlinePath, "utf8"));
    const outcome = cutline.outcome ?? cutline.cutline ?? cutline.status;
    if (outcome === "APPROVE_CONTROLLED_PUBLIC_SPIKE") {
      warnings.push("Anaheim cutline approves a controlled public spike; require human release review before public UI work.");
    } else if (outcome !== "BLOCK_PROMOTION") {
      warnings.push(`Anaheim cutline outcome is ${outcome ?? "unknown"}; review before choosing second-district work.`);
    }
  } catch (error) {
    blockers.push(`Unable to parse ${cutlinePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
} else {
  warnings.push(`Missing ${cutlinePath}; second-district loop must stay hidden until this is restored.`);
}

let dirtyForbiddenPaths = [];
let splitGuard = null;
try {
  const splitGuardOutput = execFileSync(
    "node",
    [
      "scripts/verify-alpha-rc-split.mjs",
      "--strict-selected-rc",
      "--rc-mode",
      "national-generation-contract",
      "--json-only",
    ],
    { encoding: "utf8" },
  );
  splitGuard = JSON.parse(splitGuardOutput);
  dirtyForbiddenPaths = splitGuard.strictUnexpectedPaths ?? [];
  if (splitGuard.ok !== true || splitGuard.blockerCount !== 0 || dirtyForbiddenPaths.length > 0) {
    blockers.push(
      `staged national-generation-contract split guard must pass with 0 blockers / 0 unknowns; got blockers=${splitGuard.blockerCount ?? "unknown"}, unknown=${dirtyForbiddenPaths.length}.`,
    );
  }
} catch (error) {
  blockers.push(`Unable to run national-generation-contract split guard: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.78-1v-loop-readiness",
  readinessLevel: blockers.length === 0 ? "L2_ASSISTED" : "L0_BLOCKED",
  reference: "https://github.com/cobusgreyling/loop-engineering",
  currentUpdateId: currentUpdate.id ?? null,
  requiredFiles,
  dirtyForbiddenPaths,
  splitGuard,
  blockers,
  warnings,
  nextLoopAction:
    blockers.length === 0
      ? "Run the Atlas Engine Captain Loop: read STATE.md, choose one bounded Engine Beta artifact, verify it, update state and run log."
      : "Fix blockers before scheduling or executing the loop.",
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
