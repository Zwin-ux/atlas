import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Public "Generated District Preview" gate (0.48P, contract updated 0.75R):
// generation is host-driven now — the widget's generate-district control sends
// a user message asking the model to call render_voxel_county with
// includeGeneratedDraft, and the draft scene arrives as a tool result
// (_meta.generatedDraftScene). This verifier replicates that round-trip: it
// calls the real MCP tool, injects the actual response through the bridge test
// hook (like verify-shell-county-widget.mjs), then asserts the widget's
// synthetic/session-only honesty banner renders, place labels are suppressed,
// the map still draws, and there's no overflow / console error. Honest by
// construction: this feature must never claim a generated scene is a real
// place — the banner copy is asserted here.

class CdpClient {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.events = []; this.socket = null; }
  async connect() {
    if (typeof WebSocket !== "function") throw new Error("Node runtime with global WebSocket required.");
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("message", (e) => this.handle(e.data));
    await new Promise((res, rej) => { this.socket.addEventListener("open", res, { once: true }); this.socket.addEventListener("error", rej, { once: true }); });
  }
  handle(raw) { const m = JSON.parse(raw); if (m.id && this.pending.has(m.id)) { const { resolve: rs, reject: rj } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rj(new Error(m.error.message)) : rs(m.result); return; } this.events.push(m); }
  send(method, params = {}) { const id = ++this.id; this.socket.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej })); }
  close() { this.socket?.close(); }
}

const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "mobile-390x844", width: 390, height: 844 },
];

const args = parseArgs(process.argv.slice(2));
// Resolved AFTER parseArgs so --url (which writes ATLAS_PREVIEW_URL) is
// honored — resolving it earlier silently pointed proof runs at whatever
// server already owned the default port.
const DEFAULT_PREVIEW_URL = process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787/preview";
const DEFAULT_MCP_URL = process.env.ATLAS_MCP_URL ?? new URL("/mcp", DEFAULT_PREVIEW_URL).toString();
const GENERATED_COUNTY_SLUG = process.env.ATLAS_GENERATED_COUNTY ?? "orange-ca";
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome or Edge. Set CHROME_PATH.");
if (args.screenshotDir) await mkdir(resolve(args.screenshotDir), { recursive: true });

const toolResult = await getGeneratedDraftToolResult(args.mcpUrl ?? DEFAULT_MCP_URL, GENERATED_COUNTY_SLUG);
const chrome = await launchChrome(chromePath);
const results = [];
try {
  for (const viewport of VIEWPORTS) results.push(await runViewport({ viewport, chrome, toolResult }));
} finally {
  await stopChrome(chrome);
}
const ok = results.every((r) => r.ok);
console.log(JSON.stringify({ ok, previewUrl: DEFAULT_PREVIEW_URL, mcpUrl: args.mcpUrl ?? DEFAULT_MCP_URL, countySlug: GENERATED_COUNTY_SLUG, results }, null, 2));
if (!ok) process.exitCode = 1;

// The widget asks the model for the draft via render_voxel_county; the packet
// cache may still be warming on the first call, so retry until the scene lands.
async function getGeneratedDraftToolResult(mcpUrl, countySlug) {
  const client = new Client({ name: "atlas-generated-district-widget-verifier", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  await client.connect(transport);
  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const result = await client.callTool({
        name: "render_voxel_county",
        arguments: { countySlug, includeGeneratedDraft: true },
      });
      if (result?.structuredContent?.type !== "countyCoverageSummary") {
        throw new Error(`Expected countyCoverageSummary for ${countySlug}; got ${result?.structuredContent?.type}.`);
      }
      const scene = result._meta?.generatedDraftScene;
      if (scene) {
        if (scene.type !== "cityWorldScene") throw new Error(`generatedDraftScene has wrong type: ${scene.type}`);
        if (scene.coverage?.playable !== false) throw new Error("generatedDraftScene must be non-playable.");
        return { structuredContent: result.structuredContent, content: result.content ?? [], _meta: result._meta ?? {} };
      }
      await delay(500);
    }
    throw new Error(`Generated draft packet never became ready for ${countySlug}.`);
  } finally {
    await transport.close();
    await client.close();
  }
}

async function runViewport({ viewport, chrome, toolResult }) {
  const target = await createTarget(chrome.port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width <= 480,
    });
    await client.send("Page.navigate", { url: DEFAULT_PREVIEW_URL });
    await waitFor(client, `document.readyState === "complete"`, 20_000);
    await waitFor(client, `Boolean(document.querySelector("[data-qa='alpha-city-world']"))`, 20_000);
    // The control must exist and be clickable; locally the host bridge is a
    // no-op, so the click proves the affordance while the injected tool result
    // below stands in for the model's render_voxel_county response.
    await waitFor(client, `Boolean(document.querySelector("[data-qa='generate-district-button']"))`, 10_000);
    await clickSelector(client, "[data-qa='generate-district-button']");
    await waitFor(client, `window.__atlasToolResultBridgeReady === true`, 10_000);
    await waitFor(client, `window.__atlasToolResultSubscriberCount > 0`, 10_000);
    await evaluate(client, `(() => {
      window.dispatchEvent(new CustomEvent("atlas:test-tool-result", { detail: ${JSON.stringify(toolResult).replaceAll("<", "\\u003c")} }));
      return true;
    })()`);
    await waitFor(client, `document.querySelector("[data-qa='alpha-city-world']")?.getAttribute("data-qa-generated") === "true"`, 10_000);
    await waitFor(client, `Boolean(document.querySelector("[data-qa='generated-boundary']"))`, 10_000);
    await waitFor(client, `document.querySelectorAll("canvas").length === 1`, 15_000);

    const state = await evaluate(client, `(() => {
      const shell = document.querySelector("[data-qa='alpha-city-world']");
      const banner = document.querySelector("[data-qa='generated-boundary']");
      const text = (banner?.textContent || "").toLowerCase();
      return {
        generated: shell?.getAttribute("data-qa-generated") === "true",
        bannerText: banner?.textContent?.trim() || "",
        // 0.75R: banner copy moved to the directive product voice ("Generated
        // district. Not real coverage. Nothing is saved."). Honesty contract
        // unchanged: labeled generated + disclaims coverage + disclaims saves.
        honest: text.includes("generated") && (text.includes("not a real place") || text.includes("not real coverage")) && (text.includes("nothing is saved") || text.includes("session")),
        exitPresent: Boolean(document.querySelector("[data-qa='exit-generated']")),
        collectionHidden: !document.querySelector("[data-qa='sticker-tools']") && !document.querySelector("[data-qa='selected-place-tray']"),
        placeLabels: document.querySelector(".city-world-renderer")?.getAttribute("data-qa-place-labels") || "",
        canvasCount: document.querySelectorAll("canvas").length,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`);

    const screenshotPath = await captureScreenshot(client, args.screenshotDir, viewport.label);
    const errors = browserErrors(client);
    const failures = [];
    if (!state.generated) failures.push("generated mode not active");
    if (!state.honest) failures.push(`banner not honest: "${state.bannerText}"`);
    if (!state.exitPresent) failures.push("exit-generated control missing");
    if (!state.collectionHidden) failures.push("place-collection UI not suppressed");
    if (state.placeLabels !== "suppressed") failures.push(`generated place labels not suppressed: ${state.placeLabels || "missing"}`);
    if (state.canvasCount !== 1) failures.push(`expected 1 canvas, got ${state.canvasCount}`);
    if (state.horizontalOverflow) failures.push("horizontal overflow");
    if (errors.length) failures.push(`console errors: ${errors.join(" | ")}`);
    return { label: viewport.label, ok: failures.length === 0, state, failures, screenshotPath };
  } finally {
    client.close();
  }
}

// ---- CDP + chrome boilerplate (mirrors scripts/verify-shell-county-widget.mjs) ----
function parseArgs(argv) {
  const a = { chromePath: process.env.CHROME_PATH ?? "", screenshotDir: "" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--screenshots") { const n = argv[i + 1]; if (n && !n.startsWith("--")) { a.screenshotDir = n; i += 1; } else a.screenshotDir = join(tmpdir(), "atlas-generated-district"); }
    else if (argv[i] === "--chrome-path") a.chromePath = argv[++i];
    else if (argv[i] === "--url") { process.env.ATLAS_PREVIEW_URL = argv[++i]; }
    else if (argv[i] === "--mcp-url") a.mcpUrl = argv[++i];
    else if (argv[i] === "--json-only") { /* json is the only output */ }
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return a;
}
function findChrome(explicit) {
  return [explicit, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((c) => existsSync(c));
}
function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function waitForJson(url, timeoutMs = 12_000) {
  const start = Date.now(); let last;
  while (Date.now() - start < timeoutMs) { try { const r = await fetch(url); if (r.ok) return await r.json(); last = new Error(`HTTP ${r.status}`); } catch (e) { last = e; } await delay(150); }
  throw last ?? new Error(`Timed out: ${url}`);
}
async function createTarget(port) {
  const u = `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`;
  let r = await fetch(u, { method: "PUT" }); if (!r.ok) r = await fetch(u);
  if (!r.ok) throw new Error(`Could not create Chrome target: HTTP ${r.status}`);
  const t = await r.json(); if (!t.webSocketDebuggerUrl) throw new Error("No websocket debugger URL."); return t;
}
// CdpClient is declared near the top of this file (class declarations are not hoisted).
async function evaluate(client, expression) {
  const r = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "eval failed");
  return r.result?.value;
}
async function waitFor(client, expression, timeoutMs = 10_000) {
  const start = Date.now(); let v;
  while (Date.now() - start < timeoutMs) { v = await evaluate(client, expression); if (v) return v; await delay(100); }
  throw new Error(`Timed out waiting: ${expression}`);
}
async function clickSelector(client, selector) {
  await evaluate(client, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error("missing ${selector}"); el.click(); return true; })()`);
}
function browserErrors(client) {
  return client.events.filter((e) => e.method === "Runtime.exceptionThrown" || (e.method === "Runtime.consoleAPICalled" && e.params?.type === "error") || (e.method === "Log.entryAdded" && e.params?.entry?.level === "error"))
    .map((e) => e.method === "Runtime.exceptionThrown" ? (e.params?.exceptionDetails?.text ?? "exception") : e.method === "Log.entryAdded" ? (e.params?.entry?.text ?? "") : (e.params?.args ?? []).map((a) => a.value ?? a.description ?? "").join(" ").trim()).filter(Boolean);
}
async function captureScreenshot(client, dir, label) {
  if (!dir) return null;
  const abs = resolve(dir); await mkdir(abs, { recursive: true });
  const s = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const p = join(abs, `generated-district-${label}.png`); await writeFile(p, Buffer.from(s.data, "base64")); return p;
}
async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-generated-district-chrome-"));
  const port = 9500 + Math.floor(Math.random() * 400);
  const child = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "about:blank"], { stdio: ["ignore", "ignore", "ignore"], windowsHide: true });
  try { await waitForJson(`http://127.0.0.1:${port}/json/version`); return { child, port, userDataDir }; }
  catch (e) { child.kill(); await rm(userDataDir, { recursive: true, force: true }); throw e; }
}
async function stopChrome(chrome) {
  chrome.child.kill();
  await new Promise((res) => { chrome.child.once("exit", res); setTimeout(res, 1500); });
  try { await rm(chrome.userDataDir, { recursive: true, force: true }); } catch { /* windows may hold locks */ }
}
