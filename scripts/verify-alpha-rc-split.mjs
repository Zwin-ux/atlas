import { execFileSync } from "node:child_process";

const CLASSIFICATIONS = [
  "functional-rc-docs",
  "product-code-rc-candidate",
  "visual-parked",
  "hosted-clawd-parked",
  "renderer-parked",
  "shared-doc-review",
  "unknown",
];

const RC_MODES = new Set(["functional-alpha", "mira-tray-hardening"]);

const SAFE_FUNCTIONAL_RC_DOCS = new Set([
  "docs/ALPHA_COMMAND_CENTER.md",
  "docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md",
  "docs/F2_CLEAN_ALPHA_RC_SPLIT.md",
  "scripts/verify-alpha-product-loop.mjs",
  "scripts/verify-alpha-public-sanity.mjs",
  "scripts/verify-alpha-rc-split.mjs",
]);

const MIRA_TRAY_HARDENING_FILES = new Set(["web/src/CityWorldView.tsx", "web/src/styles.css"]);

const EXACT_RULES = [
  ["hosted-clawd-parked", ".env.example", "DB and invite-token env placeholders are not part of public Alpha RC."],
  ["hosted-clawd-parked", "package.json", "Hosted Clawd DB scripts/dependencies must stay out of F2 Alpha RC."],
  ["hosted-clawd-parked", "pnpm-lock.yaml", "Hosted Clawd DB dependency lockfile changes must stay parked."],
  ["hosted-clawd-parked", "server/src/index.ts", "Path-level check cannot exclude Hosted Clawd route hunks from server entrypoint."],
  ["hosted-clawd-parked", "docs/HOSTED_CLAWD_ONBOARDING_SPEC.md", "Hosted Clawd onboarding is parked from public Alpha RC."],
  ["visual-parked", "scripts/build-web.mjs", "PNG loader is tied to the parked bitmap/module-atlas lane."],
  ["visual-parked", "scripts/verify-city-world-module-atlas.mjs", "Module atlas verification belongs to the parked visual lane."],
  ["visual-parked", "web/src/assets.d.ts", "PNG asset declaration is tied to parked bitmap/module-atlas work."],
  ["visual-parked", "web/src/cityWorldAtlasResolver.ts", "Atlas resolver changes are tied to parked visual/module-atlas work."],
  ["visual-parked", "web/src/cityWorldModuleAtlas.ts", "Generated module atlas sources are parked visual work."],
  ["renderer-parked", "packages/core/src/index.ts", "Core public exports are coupled to parked renderer/schema changes."],
  ["shared-doc-review", "docs/BUILD_LOG.md", "Build log contains mixed F2, visual, deploy, and Hosted Clawd history; hunk review required."],
  ["shared-doc-review", "docs/NEXT_QUESTS.md", "Next quests contains mixed F2, visual, and Hosted Clawd state; hunk review required."],
  ["shared-doc-review", "docs/DECISIONS.md", "Decisions doc mixes backend persistence, visual lab, and scope decisions; hunk review required."],
  ["shared-doc-review", "docs/MIRA_ALPHA_READINESS_PACKET.md", "Readiness packet is release evidence and requires review before RC staging."],
];

const PREFIX_RULES = [
  ["hosted-clawd-parked", "server/src/hostedClawd/", "Hosted Clawd server implementation is parked from Functional Alpha RC."],
  ["hosted-clawd-parked", "migrations/", "Database migrations are parked from Functional Alpha RC."],
  ["hosted-clawd-parked", "scripts/smoke-hosted-clawd-", "Hosted Clawd smoke scripts are parked from Functional Alpha RC."],
  ["hosted-clawd-parked", "scripts/verify-hosted-clawd-", "Hosted Clawd verification scripts are parked from Functional Alpha RC."],
  ["visual-parked", "assets/reference/", "Visual references are not functional RC files."],
  ["visual-parked", "experiments/", "Visual lab experiments are parked from Functional Alpha RC."],
  ["visual-parked", "packages/assets/city-world/", "City-world atlas assets and manifests are parked unless a renderer RC is opened."],
  ["visual-parked", "docs/brain/VOXEL_", "Voxel visual grammar docs are parked from Functional Alpha RC staging."],
  ["visual-parked", "docs/brain/THREE_ASSET_", "Visual-engine asset spec is parked from Functional Alpha RC staging."],
  ["renderer-parked", "packages/core/src/voxel/", "Voxel schema/compiler changes are parked unless a renderer RC is opened."],
  ["renderer-parked", "packages/core/test/city-world-", "City-world tests are coupled to parked renderer/schema changes."],
  ["renderer-parked", "web/src/CityWorld", "CityWorld renderer/view changes are parked unless a renderer RC is opened."],
  ["renderer-parked", "web/src/styles.css", "Preview style changes are parked unless a renderer RC is opened."],
  ["shared-doc-review", "docs/COMMUNICATIONS/", "Communications docs require release hunk review."],
  ["shared-doc-review", "docs/COMMUNICATIONS_HUB.md", "Communications hub requires release hunk review."],
  ["shared-doc-review", "docs/agent-prompts/", "Worker prompt docs require release hunk review."],
  ["shared-doc-review", "docs/brain/", "Brain docs require release hunk review unless explicitly classified visual parked."],
];

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage: node scripts/verify-alpha-rc-split.mjs [--working-tree] [--json-only] [--strict-selected-rc] [--rc-mode <mode>]

Default mode inspects staged files with:
  git diff --cached --name-only

--working-tree inspects dirty working-tree paths with:
  git status --short

--json-only suppresses human-readable blocker output and prints only the JSON
summary. The exit code still fails when blockers are present.

--strict-selected-rc requires every inspected path to be in the exact allowlist
for the selected RC mode. Use this before staging/deploy claims.

--rc-mode selects the release-candidate path policy. Supported modes:
  functional-alpha       Default conservative docs-only Functional Alpha policy.
  mira-tray-hardening    Allows only Mira tray-hardening product-code paths in
                         addition to functional RC support docs.

The check is conservative. Parked runtime/backend/visual paths, shared docs
that require hunk review, and unknown paths block a Functional Alpha RC.`);
  process.exit(0);
}

const rcMode = getOptionValue(rawArgs, "--rc-mode") ?? "functional-alpha";

if (!RC_MODES.has(rcMode)) {
  throw new Error(`Unknown --rc-mode: ${rcMode}`);
}

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  if (arg === "--rc-mode") {
    index += 1;
    continue;
  }
  if (!["--working-tree", "--json-only", "--strict-selected-rc"].includes(arg)) {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const mode = args.has("--working-tree") ? "working-tree" : "staged";
const jsonOnly = args.has("--json-only");
const strictSelectedRc = args.has("--strict-selected-rc");
const sourceCommand = mode === "working-tree" ? "git status --short" : "git diff --cached --name-only";
const selectedRcAllowedPaths = getSelectedRcAllowedPaths(rcMode);
const paths = mode === "working-tree" ? getWorkingTreePaths() : getStagedPaths();
const results = paths.map((path) => ({ path, ...classifyPath(path) }));
const filesByClassification = Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, []]));

for (const result of results) {
  filesByClassification[result.classification].push(result.path);
}

const blockers = results
  .filter((result) => (strictSelectedRc ? !selectedRcAllowedPaths.has(result.path) : !isAllowedClassification(result.classification)))
  .map((result) => ({
    path: result.path,
    classification: result.classification,
    reason: strictSelectedRc && !selectedRcAllowedPaths.has(result.path) ? "Path is not in the strict selected-RC allowlist." : result.reason,
  }));

const summary = {
  ok: blockers.length === 0,
  mode,
  rcMode,
  strictSelectedRc,
  sourceCommand,
  fileCount: paths.length,
  blockerCount: blockers.length,
  counts: Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, filesByClassification[classification].length])),
  safeToStageForFunctionalRc: filesByClassification["functional-rc-docs"],
  safeToStageForSelectedRc: CLASSIFICATIONS.filter(isAllowedClassification).flatMap((classification) => filesByClassification[classification]),
  strictSelectedRcAllowlist: [...selectedRcAllowedPaths],
  strictUnexpectedPaths: blockers.map((blocker) => blocker.path),
  filesByClassification,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  if (!jsonOnly) {
    console.error("");
    console.error(
      strictSelectedRc
        ? `Alpha RC strict selected-candidate check blocked ${blockers.length} file(s):`
        : `Alpha RC split check blocked ${blockers.length} file(s):`,
    );
    for (const blocker of blockers) {
      console.error(`- ${blocker.path} [${blocker.classification}]: ${blocker.reason}`);
    }
  }
  process.exitCode = 1;
} else if (!jsonOnly) {
  console.log("");
  console.log(`Alpha RC split check passed in ${mode} mode.`);
}

function getStagedPaths() {
  return runGit(["diff", "--cached", "--name-only"])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function getWorkingTreePaths() {
  return runGit(["status", "--short"])
    .split(/\r?\n/)
    .map(parseStatusPath)
    .filter(Boolean)
    .map(normalizePath);
}

function parseStatusPath(line) {
  if (!line.trim()) {
    return "";
  }
  const rawPath = line.slice(3).trim();
  if (rawPath.includes(" -> ")) {
    return rawPath.split(" -> ").at(-1).trim();
  }
  return rawPath;
}

function classifyPath(path) {
  if (SAFE_FUNCTIONAL_RC_DOCS.has(path)) {
    return { classification: "functional-rc-docs", reason: "Allowed F2 release-hygiene artifact." };
  }

  if (rcMode === "mira-tray-hardening" && MIRA_TRAY_HARDENING_FILES.has(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Mira tray-hardening product-code RC mode.",
    };
  }

  for (const [classification, exactPath, reason] of EXACT_RULES) {
    if (path === exactPath) {
      return { classification, reason };
    }
  }

  for (const [classification, prefix, reason] of PREFIX_RULES) {
    if (path.startsWith(prefix)) {
      return { classification, reason };
    }
  }

  return {
    classification: "unknown",
    reason: "Path is not classified for the Functional Alpha RC split; review before staging.",
  };
}

function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^"|"$/g, "");
}

function isAllowedClassification(classification) {
  return classification === "functional-rc-docs" || classification === "product-code-rc-candidate";
}

function getSelectedRcAllowedPaths(modeName) {
  const paths = new Set(SAFE_FUNCTIONAL_RC_DOCS);
  if (modeName === "mira-tray-hardening") {
    for (const path of MIRA_TRAY_HARDENING_FILES) {
      paths.add(path);
    }
  }
  return paths;
}

function getOptionValue(values, name) {
  const index = values.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  const value = values[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
