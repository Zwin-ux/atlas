import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const url = option("--url", process.env.ATLAS_WEBMCP_URL);
const chromeChannel = option("--chrome-channel", process.env.ATLAS_WEBMCP_CHROME_CHANNEL ?? "chrome");
if (!url) throw new Error("verify-webmcp-browser-smoke requires --url or ATLAS_WEBMCP_URL.");

const evalPackageRoot = await realpath(resolve(process.cwd(), "node_modules/webmcp-evals"));
const requireFromEvals = createRequire(join(evalPackageRoot, "package.json"));
const puppeteerEntry = requireFromEvals.resolve("puppeteer-core");
const { default: puppeteer } = await import(pathToFileURL(puppeteerEntry).href);

const executablePath = process.env.ATLAS_WEBMCP_CHROME_PATH;
const browser = await puppeteer.launch({
  browser: "chrome",
  ...(executablePath ? { executablePath } : { channel: chromeChannel }),
  headless: true,
  args: ["--enable-features=WebMCP", "--no-sandbox", "--disable-setuid-sandbox"],
});

const report = {
  browser: await browser.version(),
  url,
  tools: [],
  toolTitles: [],
  checks: [],
  consoleErrors: [],
};

function parseOutput(output) {
  if (typeof output !== "string") return output;
  try {
    return JSON.parse(output);
  } catch {
    return output;
  }
}

async function waitForTools(page, expectedCount = 5) {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    const tools = page.webmcp.tools() ?? [];
    if (tools.length === expectedCount) return tools;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Timed out waiting for ${expectedCount} WebMCP tools.`);
}

async function invoke(page, name, input = {}) {
  const tool = (await waitForTools(page)).find((candidate) => candidate.name === name);
  assert.ok(tool, `Expected registered tool ${name}.`);
  const result = await tool.execute(input);
  const failureDetail = result.errorText || result.exception?.description || result.status;
  assert.equal(
    result.status,
    "Completed",
    `${name} should complete through Chrome WebMCP: ${failureDetail}; console=${JSON.stringify(report.consoleErrors)}`,
  );
  const output = parseOutput(result.output);
  report.checks.push({ name, input, output });
  return output;
}

function stableState(output) {
  return {
    revision: output.revision,
    visibleRevision: output.visibleRevision,
    current: output.current,
    selectedPlace: output.selectedPlace,
    noteCount: output.noteCount,
    recentNotes: output.recentNotes,
    trail: output.trail,
  };
}

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
page.on("console", (entry) => {
  if (entry.type() === "error") report.consoleErrors.push({ kind: "console", message: entry.text() });
});
page.on("pageerror", (error) => report.consoleErrors.push({ kind: "pageerror", message: error.message }));

try {
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  const tools = await waitForTools(page);
  report.tools = tools.map((tool) => tool.name);
  report.toolTitles = await page.evaluate(async () => {
    if (typeof document.modelContext?.getTools !== "function") return [];
    return (await document.modelContext.getTools()).map((tool) => ({ name: tool.name, title: tool.title }));
  });
  assert.deepEqual(report.tools, ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"]);
  assert.deepEqual(Object.fromEntries(report.toolTitles.map((tool) => [tool.name, tool.title])), {
    add_map_note: "Add a place note",
    create_map_trail: "Build a research trail",
    get_map_state: "What's on the Atlas map",
    open_place: "Show a place on Atlas",
    search_places: "Find U.S. places",
  });

  const initial = await invoke(page, "get_map_state");
  assert.equal(initial.ok, true);
  assert.equal(initial.current.level, "nation");

  const search = await invoke(page, "search_places", { query: "Riverside County, CA" });
  assert.equal(search.ok, true);
  assert.ok(search.candidates.some((candidate) => candidate.countySlug === "riverside-ca"));

  const opened = await invoke(page, "open_place", { place: "Riverside County, CA" });
  assert.equal(opened.ok, true);
  assert.equal(opened.place.countySlug, "riverside-ca");
  assert.equal(opened.mapChanged, true);
  assert.equal(opened.visible, true);
  assert.deepEqual(opened.view, { level: "county", name: "Riverside County", state: "ca" });

  const note = await invoke(page, "add_map_note", {
    place: "Miami-Dade County, FL",
    body: "Compare transit access around county offices.",
  });
  assert.equal(note.ok, true);
  assert.equal(note.noteAdded, true);
  assert.equal(note.mapChanged, true);
  assert.equal(note.visible, true);
  assert.equal(await page.$$eval(".atlas-app__notes textarea", (nodes) => nodes.length), 1);

  const validTrailInput = {
    title: "County access check",
    stops: [
      { place: "Riverside County, CA", prompt: "Study public records" },
      { place: "Miami-Dade County, FL", prompt: "Compare transit access" },
      { place: "Travis County, TX", prompt: "Review meeting notices" },
    ],
  };
  const trail = await invoke(page, "create_map_trail", validTrailInput);
  assert.equal(trail.ok, true);
  assert.equal(trail.stopCount, 3);
  assert.equal(trail.trailChanged, true);
  assert.equal(trail.mapChanged, true);
  assert.equal(trail.visible, true);
  assert.deepEqual(trail.view, { level: "nation", overlay: "research_trail" });
  assert.equal(await page.$$eval(".atlas-plate__trail-marker", (nodes) => nodes.length), 3);
  assert.equal(await page.$$eval(".atlas-plate__trail-route", (nodes) => nodes.length), 1);
  const screenshotPath = resolve(process.cwd(), process.env.ATLAS_WEBMCP_SMOKE_SCREENSHOT ?? ".evals/browser-smoke-trail.png");
  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, type: "png" });
  report.screenshot = screenshotPath;

  await page.$eval('.atlas-plate__trail-marker[aria-label^="Stop 2:"]', (marker) => marker.focus());
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => (
    [...document.querySelectorAll('.atlas-app__crumb[aria-current="page"]')]
      .some((crumb) => crumb.textContent?.includes("Miami-Dade"))
  ));
  const afterHumanOpen = await invoke(page, "get_map_state");
  assert.equal(afterHumanOpen.current.countySlug, "miami-dade-fl");
  assert.equal(afterHumanOpen.trail.activeIndex, 1);

  await invoke(page, "create_map_trail", validTrailInput);
  const beforeFailedTrail = stableState(await invoke(page, "get_map_state"));
  const failedTrail = await invoke(page, "create_map_trail", {
    title: "Unknown-stop check",
    stops: [
      { place: "Riverside County, CA", prompt: "Study records" },
      { place: "Atlantis-by-the-Pacific", prompt: "Review permits" },
    ],
  });
  assert.equal(failedTrail.ok, false);
  assert.equal(failedTrail.mapChanged, false);
  assert.equal(failedTrail.trailChanged, false);
  assert.equal(failedTrail.stopNumber, 2);
  assert.deepEqual(stableState(await invoke(page, "get_map_state")), beforeFailedTrail);

  const beforeAmbiguousOpen = stableState(await invoke(page, "get_map_state"));
  const ambiguous = await invoke(page, "open_place", { place: "Springfield" });
  assert.equal(ambiguous.ok, false);
  assert.equal(ambiguous.mapChanged, false);
  assert.ok(Array.isArray(ambiguous.error.candidates) && ambiguous.error.candidates.length > 1);
  assert.deepEqual(stableState(await invoke(page, "get_map_state")), beforeAmbiguousOpen);

  await page.reload({ waitUntil: "networkidle2" });
  assert.equal((await waitForTools(page)).length, 5, "Refresh must not duplicate registrations.");
  await page.goto(new URL("/", url).href, { waitUntil: "networkidle2" });
  assert.equal((await waitForTools(page)).length, 5, "The top-level route must register exactly five tools.");
  await page.goto(new URL("/explore", url).href, { waitUntil: "networkidle2" });
  assert.equal((await waitForTools(page)).length, 5, "Route navigation must keep the exact-five cut.");

  assert.deepEqual(report.consoleErrors, [], "The WebMCP browser journey must not log console or page errors.");
  const reportPath = resolve(process.cwd(), process.env.ATLAS_WEBMCP_SMOKE_REPORT ?? ".evals/browser-smoke.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    ok: true,
    browser: report.browser,
    registeredTools: report.tools.length,
    toolExecutions: report.checks.length,
    report: reportPath,
    screenshot: report.screenshot,
  }, null, 2));
} finally {
  await page.close();
  await browser.close();
}
