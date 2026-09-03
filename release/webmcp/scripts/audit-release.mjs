import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = process.cwd();
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const forbiddenPaths = [/(^|\/)node_modules(\/|$)/, /(^|\/)dist(\/|$)/, /(^|\/)\.evals(\/|$)/, /(^|\/)\.env($|\.)/, /(^|\/)artifacts(\/|$)/, /(^|\/)packages(\/|$)/, /(^|\/)apps(\/|$)/];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bsk-[A-Za-z0-9_-]{24,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /C:\\Users\\/i,
  /\/Users\/[A-Za-z0-9._-]+\//,
];
const runtimeRetiredPatterns = [/hosted.?clawd/i, /atlas.?commons/i, /auth0/i, /stripe/i, /scout/i, /campaign/i, /checkout/i, /billing/i];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist" || entry.name === ".evals") continue;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function isText(path) {
  return /\.(?:c?m?[jt]sx?|json|md|css|html|toml|yaml|yml|txt|lock|gitignore)$/i.test(path) || /(?:^|\/)LICENSE$/.test(path);
}

const discoveredFiles = await walk(root);
const discoveredRelative = discoveredFiles.map((path) => relative(root, path).replace(/\\/g, "/"));
let trackedRelative = [];
try {
  trackedRelative = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] })
    .split("\0")
    .filter(Boolean)
    .map((path) => path.replace(/\\/g, "/"));
} catch {
  // A just-assembled directory may not be a repository yet.
}
const relativeFiles = [...new Set([...discoveredRelative, ...trackedRelative])].sort();
const files = relativeFiles.map((path) => resolve(root, path));
const failures = [];
const oversized = [];

for (const path of relativeFiles) {
  if (forbiddenPaths.some((pattern) => pattern.test(path))) failures.push(`Forbidden tracked path: ${path}`);
  const info = await stat(resolve(root, path));
  if (info.size > MAX_FILE_BYTES) oversized.push({ path, bytes: info.size });
  if (!isText(path)) continue;
  const body = await readFile(resolve(root, path), "utf8");
  if (secretPatterns.some((pattern) => pattern.test(body))) failures.push(`Secret or private-path pattern in ${path}`);
  if ((path.startsWith("server/") || path.startsWith("web/")) && runtimeRetiredPatterns.some((pattern) => pattern.test(body))) {
    failures.push(`Retired runtime scope in ${path}`);
  }
}

for (const required of [".gitattributes", "LICENSE", "ATTRIBUTION.md", "README.md", "CHALLENGE_DELTA.md", "docs/CHATGPT_ACCEPTANCE.md", "docs/CHATGPT_E2E.md", "docs/HCI_OPERATING_MANUAL.md", "docs/OFFICIAL_COMPATIBILITY.md", "docs/assets/trail-overview.png", "docs/evidence/39d1e141/manifest.json", "docs/evidence/39d1e141/browser-smoke.json", "evals/atlas-chatgpt.transcript.template.json", "scripts/prepare-chatgpt-session.mjs", "scripts/run-chatgpt-e2e.mjs", "scripts/verify-chatgpt-live.mjs", "scripts/verify-chatgpt-transcript.mjs", "pnpm-lock.yaml", "railway.toml", "data/census/us-county-town-anchors.json", "data/atlas-plates/nation.json"]) {
  if (!relativeFiles.includes(required)) failures.push(`Missing required release file: ${required}`);
}

const evidenceRoot = resolve(root, "docs/evidence/39d1e141");
try {
  const manifest = JSON.parse(await readFile(resolve(evidenceRoot, "manifest.json"), "utf8"));
  if (!Array.isArray(manifest.images) || manifest.images.length !== 8) failures.push("Release evidence manifest must list eight reviewed images.");
  for (const image of manifest.images ?? []) {
    const imageBytes = await readFile(resolve(evidenceRoot, image.file));
    const imageHash = createHash("sha256").update(imageBytes).digest("hex");
    if (imageHash !== image.sha256) failures.push(`Release evidence hash mismatch: ${image.file}`);
    if (!imageBytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) failures.push(`Release evidence is not a PNG: ${image.file}`);
  }
  const report = JSON.parse(await readFile(resolve(evidenceRoot, manifest.webmcpBrowser.report.file), "utf8"));
  const canonicalReport = `${JSON.stringify(report, null, 2)}\n`;
  const reportHash = createHash("sha256").update(canonicalReport, "utf8").digest("hex");
  if (manifest.webmcpBrowser.report.hashMode !== "canonical-json-utf8-lf" || reportHash !== manifest.webmcpBrowser.report.sha256) {
    failures.push("Release WebMCP report canonical hash mismatch.");
  }
} catch (error) {
  failures.push(`Release evidence verification failed: ${error instanceof Error ? error.message : String(error)}`);
}

if (relativeFiles.includes("railway.toml")) {
  const railwayConfig = await readFile(resolve(root, "railway.toml"), "utf8");
  if (!railwayConfig.startsWith('"$schema" = "https://railway.com/railway.schema.json"')) failures.push("Railway schema key must be quoted valid TOML.");
  if (!railwayConfig.includes('buildCommand = "corepack enable && pnpm install --frozen-lockfile && pnpm build"') || !railwayConfig.includes('startCommand = "pnpm start"') || !railwayConfig.includes('healthcheckPath = "/ready"')) {
    failures.push("Railway build, start, or readiness contract drifted.");
  }
}

const geoPacks = relativeFiles.filter((path) => path.startsWith("data/geo-packs/") && path.endsWith(".json")).length;
const statePlates = relativeFiles.filter((path) => path.startsWith("data/atlas-plates/state/") && path.endsWith(".json")).length;
if (geoPacks < 3_200) failures.push(`Expected nationwide county data; found ${geoPacks} geo packs.`);
if (statePlates < 50) failures.push(`Expected nationwide state plates; found ${statePlates}.`);
if (oversized.length > 0) failures.push(`${oversized.length} file(s) exceed ${MAX_FILE_BYTES} bytes.`);

let commitCount = null;
let gitStatus = null;
try {
  commitCount = Number.parseInt(execFileSync("git", ["rev-list", "--count", "HEAD"], { cwd: root, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }).trim(), 10);
  gitStatus = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }).trim();
  if (gitStatus) failures.push("Git worktree is not clean.");
} catch {
  // The same audit can run before the local repository is initialized.
}

const report = {
  ok: failures.length === 0,
  files: relativeFiles.length,
  bytes: (await Promise.all(files.map(async (path) => (await stat(path)).size))).reduce((sum, bytes) => sum + bytes, 0),
  geoPacks,
  statePlates,
  oversized,
  commitCount,
  gitStatus,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
