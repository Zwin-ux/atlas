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
const expectedCurrentUpdateId = "postalpha-0.33e-db-scene-packet-persistence-plan";

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
requireText("STATE.md", "High Priority", "STATE.md must contain a High Priority queue.");
requireText("STATE.md", "BLOCK_PROMOTION", "STATE.md must preserve the current Anaheim block.");
requireText("loop-budget.md", "Kill Switch", "loop-budget.md must define a kill switch.");
requireText("loop-constraints.md", "Forbidden Scope", "loop-constraints.md must define forbidden scope.");
requireText("loop-constraints.md", "package/lock/env", "loop-constraints.md must block package/lock/env drift.");
requireText("docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md", "country -> state -> county -> district -> place", "Full project loop spec must preserve the USA-scale hierarchy.");
requireText("docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md", "Atlas is currently L2 assisted", "Full project loop spec must state the current loop level.");
requireText("docs/NEXT_QUESTS.md", "0.33E DB Scene Packet Persistence Plan", "NEXT_QUESTS must point at the current 0.33E pass.");
requireText("scripts/verify-alpha-rc-split.mjs", "scripts/verify-atlas-loop-readiness.mjs", "Split guard must allow the Atlas loop readiness verifier.");
requireText("scripts/verify-alpha-rc-split.mjs", "LOOP.md", "Split guard must allow LOOP.md.");

warnIfMissing("loop-run-log.md", "Loop setup", "loop-run-log.md should include the initial setup entry.");

let currentUpdate = {};
try {
  currentUpdate = JSON.parse(files["artifacts/current-update.json"] || "{}");
} catch (error) {
  blockers.push(`artifacts/current-update.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

if (currentUpdate.id !== expectedCurrentUpdateId) {
  warnings.push(`Current update is ${currentUpdate.id ?? "missing"}, expected ${expectedCurrentUpdateId}.`);
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
try {
  dirtyForbiddenPaths = execFileSync("git", ["status", "--short", "--untracked-files=all"], { encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .filter((path) => {
      return (
        path === "package.json" ||
        path === "pnpm-lock.yaml" ||
        path.startsWith(".env") ||
        path.startsWith("migrations/") ||
        path.startsWith("server/src/hostedClawd/") ||
        path.toLowerCase().includes("stripe") ||
        path.toLowerCase().includes("oauth")
      );
    });
  if (dirtyForbiddenPaths.length > 0) {
    blockers.push(`Forbidden dirty paths present: ${dirtyForbiddenPaths.join(", ")}`);
  }
} catch (error) {
  warnings.push(`Unable to inspect git status: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-loop-engineering-setup",
  readinessLevel: blockers.length === 0 ? "L2_ASSISTED" : "L0_BLOCKED",
  reference: "https://github.com/cobusgreyling/loop-engineering",
  currentUpdateId: currentUpdate.id ?? null,
  requiredFiles,
  dirtyForbiddenPaths,
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
