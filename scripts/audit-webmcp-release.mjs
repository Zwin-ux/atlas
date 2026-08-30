import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  .split(/\r?\n/)
  .filter(Boolean);

const historicalRiskPatterns = [
  /^artifacts\/council\//,
  /^chatgpt-app-submission\.json$/,
  /^docs\/SESSION_HANDOFF_/,
  /^docs\/codex\//,
  /^docs\/updates\//,
  /^engineering-prompt-pack\//,
  /^loop-run-log\.md$/,
  /^prompt-pack\//,
  /^prompts\//,
];

const historicalRiskFiles = trackedFiles.filter((path) => historicalRiskPatterns.some((pattern) => pattern.test(path)));
const hasLicense = ["LICENSE", "LICENSE.md", "LICENSE.txt"].some((path) => existsSync(path));
const pathInventoryReady = historicalRiskFiles.length === 0 && hasLicense;

const result = {
  ok: true,
  verdict: pathInventoryReady ? "PATH_INVENTORY_READY_FOR_DEEP_SCAN" : "DO_NOT_PUBLISH_CURRENT_REPOSITORY",
  trackedFiles: trackedFiles.length,
  historicalRiskFiles: historicalRiskFiles.length,
  historicalRiskExamples: historicalRiskFiles.slice(0, 12),
  licensePresent: hasLicense,
  pathInventoryReady,
  currentRepositoryPublishable: false,
  coverage: "Tracked-path inventory only. This is not a secret, entropy, history, dependency, data, or asset-provenance clearance.",
  requiredBoundary: "Create a new empty sanitized challenge repository from a reviewed allowlist, then run clean-clone and full-history release scans.",
};

if (trackedFiles.length < 1) throw new Error("Release audit could not read tracked files.");

console.log(JSON.stringify(result, null, 2));
