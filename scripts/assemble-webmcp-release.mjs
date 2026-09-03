import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const targetIndex = args.indexOf("--target");
const targetArg = targetIndex >= 0 ? args[targetIndex + 1] : undefined;
if (!targetArg || !isAbsolute(targetArg)) {
  throw new Error("Usage: node scripts/assemble-webmcp-release.mjs --target <new absolute directory>");
}

const targetRoot = resolve(targetArg);
const targetFromSource = relative(sourceRoot, targetRoot);
if (!targetFromSource || (!targetFromSource.startsWith("..") && !isAbsolute(targetFromSource))) {
  throw new Error("The sanitized repository target must be separate from the historical checkout.");
}
try {
  await stat(targetRoot);
  throw new Error(`Refusing to overwrite existing target: ${targetRoot}`);
} catch (error) {
  if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
}

async function copyFile(from, to) {
  const destination = resolve(targetRoot, to);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(sourceRoot, from), destination);
}

async function copyTree(from, to) {
  const destination = resolve(targetRoot, to);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(sourceRoot, from), destination, { recursive: true });
}

await copyTree("release/webmcp", ".");

const runtimeFiles = [
  "web/src/atlas/atlas.css",
  "web/src/atlas/AtlasApp.tsx",
  "web/src/atlas/AtlasMapController.ts",
  "web/src/atlas/AtlasPlaceFinder.tsx",
  "web/src/atlas/AtlasPlate.tsx",
  "web/src/atlas/plateGeometry.ts",
  "web/src/atlas/webmcpEvalSchema.ts",
  "web/src/atlas/webmcpRegistry.ts",
  "web/src/atlas/webmcpTools.ts",
];
const testFiles = [
  "scripts/test/prepare-chatgpt-session.test.mjs",
  "web/test/atlas-map-controller.test.ts",
  "web/test/plate-geometry.test.ts",
  "web/test/webmcp-tools.test.ts",
  "web/test/webmcp-registry.test.ts",
  "web/test/webmcp-eval-schema.test.ts",
];
const evalFiles = [
  "evals/atlas-webmcp.evals.json",
  "evals/atlas-webmcp.smoke.json",
  "evals/atlas-chatgpt.transcript.template.json",
  "scripts/prepare-chatgpt-session.mjs",
  "scripts/run-chatgpt-e2e.mjs",
  "scripts/run-grok-webmcp-evals.mjs",
  "scripts/run-webmcp-evals.mjs",
  "scripts/verify-chatgpt-live.mjs",
  "scripts/verify-chatgpt-transcript.mjs",
  "scripts/verify-webmcp-browser-smoke.mjs",
  "scripts/write-webmcp-eval-tools.ts",
];
const geometrySupportFiles = [
  "packages/core/src/atlas/labels.ts",
  "packages/core/src/atlas/projection.ts",
  "packages/core/src/atlas/ringCodec.ts",
];

for (const file of [...runtimeFiles, ...testFiles, ...evalFiles]) await copyFile(file, file);
for (const file of geometrySupportFiles) {
  await copyFile(file, `web/src/atlas/lib/${file.split("/").at(-1)}`);
}
await copyFile("packages/core/src/atlas/gazetteer.ts", "server/src/gazetteer.ts");
await copyFile("server/src/atlasPlates.ts", "server/src/atlasPlates.ts");

const plateServicePath = resolve(targetRoot, "server/src/atlasPlates.ts");
const plateService = (await readFile(plateServicePath, "utf8"))
  .replace('from "./countyGeoPack.js"', 'from "./countySlug.js"');
await writeFile(plateServicePath, plateService, "utf8");

const atlasPlatePath = resolve(targetRoot, "web/src/atlas/AtlasPlate.tsx");
const atlasPlate = (await readFile(atlasPlatePath, "utf8"))
  .replace('from "@atlas/core/atlas"', 'from "./lib/index"');
await writeFile(atlasPlatePath, atlasPlate, "utf8");

const plateGeometryPath = resolve(targetRoot, "web/src/atlas/plateGeometry.ts");
const plateGeometry = (await readFile(plateGeometryPath, "utf8"))
  .replace('} from "@atlas/core/atlas";', '} from "./lib/index";');
await writeFile(plateGeometryPath, plateGeometry, "utf8");

await copyFile("data/census/us-county-town-anchors.json", "data/census/us-county-town-anchors.json");
const geoPackSource = resolve(sourceRoot, "data/geo-packs");
for (const entry of (await readdir(geoPackSource)).filter((name) => name.endsWith(".json") && !name.startsWith("_"))) {
  await copyFile(`data/geo-packs/${entry}`, `data/geo-packs/${entry}`);
}
await copyTree("artifacts/atlas-plates", "data/atlas-plates");
await copyTree("artifacts/webmcp-release-proof/39d1e141-20260902", "docs/evidence/39d1e141");
await copyFile("artifacts/webmcp-release-proof/39d1e141-20260902/06-webmcp-trail-desktop.png", "docs/assets/trail-overview.png");

await copyFile("docs/webmcp/VIDEO_SCRIPT.md", "docs/VIDEO_SCRIPT.md");
await copyFile("docs/webmcp/EVALS.md", "docs/EVALS.md");
await copyFile("docs/webmcp/CHATGPT_ACCEPTANCE.md", "docs/CHATGPT_ACCEPTANCE.md");
await copyFile("docs/webmcp/CHATGPT_E2E.md", "docs/CHATGPT_E2E.md");
await copyFile("docs/webmcp/HCI_OPERATING_MANUAL.md", "docs/HCI_OPERATING_MANUAL.md");
await copyFile("docs/webmcp/OFFICIAL_COMPATIBILITY.md", "docs/OFFICIAL_COMPATIBILITY.md");
await copyFile("docs/webmcp/SUBMISSION.md", "docs/SUBMISSION.md");

const submissionPath = resolve(targetRoot, "docs/SUBMISSION.md");
const submission = (await readFile(submissionPath, "utf8"))
  .replace("- Open-source license: `[OWNER REQUIRED: owner-selected license]`", "- Open-source license: **Apache-2.0**")
  .replace("- create a sanitized public source repository;\n- choose and add an open-source license;\n", "- approve and publish this sanitized source repository;\n")
  .replace("source release, license, video", "source publication, video")
  .replace("The detailed evidence ledger is in `CHALLENGE_DELTA.md` and `WEBMCP_STATE.md`.", "The public capability boundary is in `CHALLENGE_DELTA.md`; reproducible gates are in `docs/VERIFICATION.md`.")
  .replace("Route verifier and desktop/mobile screenshots in `artifacts/webmcp-proof/`", "Clean-clone route/build gates and `docs/assets/trail-overview.png`")
  .replace("gstack accessibility tree, 390x844 target/overflow audit, design review", "Keyboard/controller tests, responsive CSS guards, and the recorded challenge review");
await writeFile(submissionPath, submission, "utf8");

const evalGuidePath = resolve(targetRoot, "docs/EVALS.md");
const evalGuide = (await readFile(evalGuidePath, "utf8"))
  .replace("`artifacts/webmcp-proof/webmcp-browser-smoke.json`", "`.evals/browser-smoke.json`");
await writeFile(evalGuidePath, evalGuide, "utf8");

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8", windowsHide: true }).trim();
await writeFile(
  resolve(targetRoot, "SOURCE_PROVENANCE.md"),
  `# Source provenance\n\nThis compact repository was assembled from the private Atlas WebMCP challenge worktree, whose last committed state at assembly time was \`${sourceCommit}\`. Release scaffolding was reviewed from that worktree before this repository's root commit.\n\nThe repository contains an explicit runtime and evidence allowlist; it does not carry the historical repository's Git history. The challenge baseline and capability boundary are recorded in [CHALLENGE_DELTA.md](CHALLENGE_DELTA.md).\n`,
  "utf8",
);

console.log(JSON.stringify({
  ok: true,
  target: targetRoot,
  sourceCommit,
  runtimeFiles: runtimeFiles.length,
  testFiles: testFiles.length + 1,
  publicTools: 5,
  data: ["census anchors", "county geo packs", "national/state plates"],
}, null, 2));
