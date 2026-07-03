import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const DEFAULT_URL = "http://127.0.0.1:8787";
const baseUrl = (process.env.ATLAS_BASE_URL ?? DEFAULT_URL).replace(/\/$/, "");
const screenshotRoot = process.env.ATLAS_ENGINE_BETA_COVERAGE_SCREENSHOTS ?? "";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const spawnCommand = process.platform === "win32" ? windowsCommandLine(command, args) : resolveCommand(command);
    const spawnArgs = process.platform === "win32" ? [] : args;
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: process.cwd(),
      env: { ...process.env, ...(options.env ?? {}) },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${code}\n${stdout}\n${stderr}`));
    });
  });
}

function resolveCommand(command) {
  if (command === "node") return process.execPath;
  if (process.platform === "win32" && command === "pnpm") return "pnpm.cmd";
  return command;
}

function windowsCommandLine(command, args) {
  return [resolveCommand(command), ...args].map(windowsQuoteArg).join(" ");
}

function windowsQuoteArg(value) {
  const text = String(value);
  if (!/[\s"]/u.test(text)) return text;
  return `"${text.replaceAll('"', '\\"')}"`;
}

function parseJson(stdout, label) {
  const firstJson = stdout.indexOf("{");
  if (firstJson === -1) {
    throw new Error(`${label} did not print JSON.`);
  }
  return JSON.parse(stdout.slice(firstJson));
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  return { status: response.status, body };
}

const health = await fetchJson("/health");
if (health.status !== 200 || health.body.ok !== true) {
  throw new Error(`Health failed: ${JSON.stringify(health)}`);
}

const coverageDirectory = await fetchJson("/api/world/us/coverage");
if (coverageDirectory.status !== 200 || coverageDirectory.body.type !== "usWorldCoverageDirectory") {
  throw new Error(`Coverage directory failed: HTTP ${coverageDirectory.status} ${JSON.stringify(coverageDirectory.body)}`);
}
if (coverageDirectory.body.totals?.indexedCountyCount !== 58) {
  throw new Error(`Coverage directory expected 58 indexed counties; got ${coverageDirectory.body.totals?.indexedCountyCount}`);
}
if (coverageDirectory.body.totals?.playableCountyCount !== 1 || coverageDirectory.body.playableCounties?.[0]?.countySlug !== "riverside-ca") {
  throw new Error(`Coverage directory must expose Riverside as the only playable county: ${JSON.stringify(coverageDirectory.body.playableCounties)}`);
}
if (coverageDirectory.body.totals?.shellCountyCount !== 57) {
  throw new Error(`Coverage directory expected 57 shell counties; got ${coverageDirectory.body.totals?.shellCountyCount}`);
}
if (coverageDirectory.body.totals?.providerNormalizedCountyCount !== 0 || coverageDirectory.body.totals?.publicQualityCountyCount !== 0) {
  throw new Error("Coverage directory must not claim provider-normalized or public-quality counties in E10.");
}

const counties = await fetchJson("/api/world/us/states/CA/counties");
if (counties.status !== 200) {
  throw new Error(`California county list failed: HTTP ${counties.status}`);
}
if (!Array.isArray(counties.body.counties) || counties.body.counties.length !== 58) {
  throw new Error(`Expected 58 California counties; got ${counties.body.counties?.length}`);
}

const riverside = await fetchJson("/api/world/counties/riverside-ca");
if (riverside.status !== 200 || riverside.body.county?.coverageTier !== "L2_CURATED_DISTRICT") {
  throw new Error(`Riverside must be playable L2: ${JSON.stringify(riverside.body)}`);
}
if (riverside.body.county?.geoid !== "06065") {
  throw new Error(`Riverside GEOID mismatch: ${riverside.body.county?.geoid}`);
}

const orange = await fetchJson("/api/world/counties/orange-ca");
if (orange.status !== 200 || orange.body.county?.coverageTier !== "L1_COUNTY_SHELL") {
  throw new Error(`Orange must be L1 shell: ${JSON.stringify(orange.body)}`);
}
if ((orange.body.districts ?? []).some((district) => district.playable)) {
  throw new Error("Orange shell must not have playable districts.");
}

const unknown = await fetchJson("/api/world/counties/made-up-ca");
if (unknown.status !== 404 || unknown.body.coverage?.coverageTier !== "L0_UNSUPPORTED") {
  throw new Error(`Unknown county must be L0 unsupported 404: ${JSON.stringify(unknown.body)}`);
}

const preview = parseJson((await run("pnpm", ["verify:preview:http"], { env: { ATLAS_PREVIEW_URL: `${baseUrl}/preview` } })).stdout, "preview");
const mcp = parseJson((await run("pnpm", ["verify:mcp"], { env: { ATLAS_MCP_URL: `${baseUrl}/mcp` } })).stdout, "mcp");
const submission = parseJson((await run("pnpm", ["verify:submission"], { env: { ATLAS_MCP_URL: `${baseUrl}/mcp` } })).stdout, "submission");

const riversideScreenshots = screenshotRoot ? join(screenshotRoot, "riverside") : "";
const residentialDetailScreenshots = screenshotRoot ? join(screenshotRoot, "residential-detail") : "";
const orangeScreenshots = screenshotRoot ? join(screenshotRoot, "orange-shell") : "";
const unsupportedScreenshots = screenshotRoot ? join(screenshotRoot, "unsupported") : "";
const switcherScreenshots = screenshotRoot ? join(screenshotRoot, "county-switcher") : "";

const riversideLoopArgs = ["scripts/verify-alpha-product-loop.mjs", "--url", `${baseUrl}/preview`];
if (riversideScreenshots) riversideLoopArgs.push("--screenshots", riversideScreenshots);
const riversideLoop = parseJson((await run("node", riversideLoopArgs)).stdout, "riverside product loop");

const residentialDetailArgs = [
  "scripts/verify-alpha-product-loop.mjs",
  "--url",
  `${baseUrl}/preview`,
  "--camera-preset",
  "residential_detail",
  "--proof-only",
];
if (residentialDetailScreenshots) residentialDetailArgs.push("--screenshots", residentialDetailScreenshots);
const residentialDetail = parseJson((await run("node", residentialDetailArgs)).stdout, "residential detail camera proof");

const orangeArgs = [
  "scripts/verify-shell-county-widget.mjs",
  "--url",
  `${baseUrl}/preview`,
  "--mcp-url",
  `${baseUrl}/mcp`,
  "--county",
  "orange-ca",
  "--expected-tier",
  "L1_COUNTY_SHELL",
];
if (orangeScreenshots) orangeArgs.push("--screenshots", orangeScreenshots);
const orangeWidget = parseJson((await run("node", orangeArgs)).stdout, "orange shell widget");

const unsupportedArgs = [
  "scripts/verify-shell-county-widget.mjs",
  "--url",
  `${baseUrl}/preview`,
  "--mcp-url",
  `${baseUrl}/mcp`,
  "--county",
  "made-up-ca",
  "--expected-tier",
  "L0_UNSUPPORTED",
];
if (unsupportedScreenshots) unsupportedArgs.push("--screenshots", unsupportedScreenshots);
const unsupportedWidget = parseJson((await run("node", unsupportedArgs)).stdout, "unsupported widget");

const switcherArgs = [
  "scripts/verify-county-switcher.mjs",
  "--url",
  `${baseUrl}/preview`,
];
if (switcherScreenshots) switcherArgs.push("--screenshots", switcherScreenshots);
const countySwitcher = parseJson((await run("node", switcherArgs)).stdout, "county switcher");

if (screenshotRoot) {
  const expectedScreenshots = [
    join(riversideScreenshots, "alpha-product-loop-desktop-1280x720.png"),
    join(riversideScreenshots, "alpha-product-loop-mobile-390x844.png"),
    join(residentialDetailScreenshots, "alpha-product-loop-desktop-1280x720.png"),
    join(residentialDetailScreenshots, "alpha-product-loop-mobile-390x844.png"),
    join(orangeScreenshots, "shell-county-widget-desktop-1280x720.png"),
    join(orangeScreenshots, "shell-county-widget-mobile-390x844.png"),
    join(unsupportedScreenshots, "shell-county-widget-desktop-1280x720.png"),
    join(unsupportedScreenshots, "shell-county-widget-mobile-390x844.png"),
    join(switcherScreenshots, "county-switcher-riverside-desktop-1280x720.png"),
    join(switcherScreenshots, "county-switcher-orange-desktop-1280x720.png"),
    join(switcherScreenshots, "county-switcher-unsupported-desktop-1280x720.png"),
    join(switcherScreenshots, "county-switcher-riverside-mobile-390x844.png"),
    join(switcherScreenshots, "county-switcher-orange-mobile-390x844.png"),
    join(switcherScreenshots, "county-switcher-unsupported-mobile-390x844.png"),
  ];
  for (const path of expectedScreenshots) {
    await access(path);
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      coverageDirectory: {
        indexedCountyCount: coverageDirectory.body.totals.indexedCountyCount,
        playableCountyCount: coverageDirectory.body.totals.playableCountyCount,
        shellCountyCount: coverageDirectory.body.totals.shellCountyCount,
        suggestedNextCountySlug: coverageDirectory.body.suggestedNextCountySlug,
      },
      californiaCountyCount: counties.body.counties.length,
      riversideTier: riverside.body.county.coverageTier,
      orangeTier: orange.body.county.coverageTier,
      unknownTier: unknown.body.coverage.coverageTier,
      preview: { ok: preview.ok, bytes: preview.bytes },
      mcp: { ok: mcp.ok, tools: mcp.tools, shellCountyTier: mcp.shellCountyTier },
      submission: { ok: submission.ok, tools: submission.tools },
      riversideLoop: {
        ok: riversideLoop.ok,
        screenshots: riversideLoop.results?.map((result) => result.screenshotPath).filter(Boolean) ?? [],
      },
      residentialDetail: {
        ok: residentialDetail.ok,
        screenshots: residentialDetail.results?.map((result) => result.screenshotPath).filter(Boolean) ?? [],
      },
      orangeWidget: {
        ok: orangeWidget.ok,
        screenshots: orangeWidget.results?.map((result) => result.screenshotPath).filter(Boolean) ?? [],
      },
      unsupportedWidget: {
        ok: unsupportedWidget.ok,
        screenshots: unsupportedWidget.results?.map((result) => result.screenshotPath).filter(Boolean) ?? [],
      },
      countySwitcher: {
        ok: countySwitcher.ok,
        screenshots: countySwitcher.results?.flatMap((result) => result.screenshots).filter(Boolean) ?? [],
      },
    },
    null,
    2,
  ),
);
