#!/usr/bin/env node
// Certify pass automation: pin the release range to a new head. Replaces the
// hand-run ritual of measuring the path count, editing releaseCandidate in
// artifacts/current-update.json, editing the drift verifier constants, and
// re-running the governance gates — three manual passes of SHA bookkeeping
// happened on 2026-07-17/18 alone before this script existed.
//
//   node scripts/certify-release-range.mjs            # pin to git HEAD
//   node scripts/certify-release-range.mjs --head <sha> [--dry-run]
//
// The base SHA is read from the committed releaseCandidate (it only moves in
// a post-deploy record pass). After writing, this runs the source-of-truth
// drift verifier, the loop-readiness verifier, and the strict split guard
// over the full range — all three must be green or the script exits nonzero.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const UPDATE_PATH = "artifacts/current-update.json";
const DRIFT_PATH = "scripts/verify-atlas-source-of-truth-drift.mjs";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).trim();
}

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const headIdx = argv.indexOf("--head");
const head = git(["rev-parse", headIdx >= 0 ? argv[headIdx + 1] : "HEAD"]);

const update = JSON.parse(readFileSync(UPDATE_PATH, "utf8"));
const base = update.releaseCandidate?.baseSha;
if (!/^[0-9a-f]{40}$/.test(base ?? "")) throw new Error("releaseCandidate.baseSha missing or malformed");
if (!/^[0-9a-f]{40}$/.test(head)) throw new Error(`resolved head is not a full sha: ${head}`);

const pathCount = git(["diff", "--name-only", `${base}..${head}`]).split("\n").filter(Boolean).length;
console.log(`base ${base.slice(0, 7)} -> head ${head.slice(0, 7)}: ${pathCount} paths`);

if (dryRun) {
  console.log("dry run: no files written, gates not run");
  process.exit(0);
}

// 1. current-update.json
update.releaseCandidate.headSha = head;
update.releaseCandidate.pathCount = pathCount;
writeFileSync(UPDATE_PATH, `${JSON.stringify(update, null, 2)}\n`);

// 2. drift verifier constants (anchored to the exact const declarations)
let drift = readFileSync(DRIFT_PATH, "utf8");
const headPattern = /(const TOWN_ANCHOR_RELEASE_HEAD_SHA = ")[0-9a-f]{40}(")/;
const countPattern = /(const TOWN_ANCHOR_RELEASE_PATH_COUNT = )\d+(;)/;
if (!headPattern.test(drift) || !countPattern.test(drift)) {
  throw new Error("drift verifier constants not found — update the patterns in certify-release-range.mjs");
}
drift = drift.replace(headPattern, `$1${head}$2`).replace(countPattern, `$1${pathCount}$2`);
writeFileSync(DRIFT_PATH, drift);
console.log("wrote releaseCandidate + drift constants");

// 3. gates — one exit code each
const gates = [
  ["drift", ["scripts/verify-atlas-source-of-truth-drift.mjs"]],
  ["loop-readiness", ["scripts/verify-atlas-loop-readiness.mjs"]],
  ["range-guard", ["scripts/verify-alpha-rc-split.mjs", "--git-range", `${base}..${head}`, "--strict-selected-rc", "--rc-mode", "national-generation-contract", "--json-only"]],
];
let failed = false;
for (const [name, args] of gates) {
  try {
    execFileSync("node", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024,
    });
    console.log(`PASS ${name}`);
  } catch (error) {
    failed = true;
    console.log(`FAIL ${name}`);
    console.log(String(error.stdout ?? "").slice(-800));
  }
}
if (failed) process.exitCode = 1;
else console.log(`certified: stage ${UPDATE_PATH} + ${DRIFT_PATH} and commit as the certify pass`);
