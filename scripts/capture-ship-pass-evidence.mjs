#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { previewCampaignFromScout, previewScoutDrop } from "../packages/core/dist/index.js";

const DEFAULT_PREVIEW_URL = process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787/preview";
const DEFAULT_OUT_DIR = "artifacts/0.75s-ship-passes";
const GENERATED_COUNTY_SLUG = process.env.ATLAS_GENERATED_COUNTY ?? "orange-ca";

const VIEWPORTS = {
  desktop: { label: "desktop-1280x720", width: 1280, height: 720 },
  mobile: { label: "mobile-390x844", width: 390, height: 844 },
};

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.id = 0;
    this.pending = new Map();
    this.socket = null;
  }

  async connect() {
    if (typeof WebSocket !== "function") {
      throw new Error("Node runtime with global WebSocket support is required.");
    }
    this.socket = new WebSocket(this.webSocketUrl);
    this.socket.addEventListener("message", (event) => this.handleMessage(event.data));
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", rejectOpen, { once: true });
    });
  }

  handleMessage(rawMessage) {
    const message = JSON.parse(rawMessage);
    if (message.id && this.pending.has(message.id)) {
      const { resolve: resolvePending, reject: rejectPending } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) rejectPending(new Error(message.error.message));
      else resolvePending(message.result);
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend });
    });
  }

  close() {
    this.socket?.close();
  }
}

function parseArgs(argv) {
  const args = {
    previewUrl: DEFAULT_PREVIEW_URL,
    mcpUrl: process.env.ATLAS_MCP_URL,
    outDir: DEFAULT_OUT_DIR,
    chromePath: process.env.CHROME_PATH ?? "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") args.previewUrl = argv[++index];
    else if (value === "--mcp") args.mcpUrl = argv[++index];
    else if (value === "--out") args.outDir = argv[++index];
    else if (value === "--chrome-path") args.chromePath = argv[++index];
    else throw new Error(`Unknown argument: ${value}`);
  }

  return args;
}

function findChrome(explicitPath) {
  return [
    explicitPath,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean).find((candidate) => existsSync(candidate));
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function chooseDebugPort() {
  return 9600 + Math.floor(Math.random() * 300);
}

async function waitForJson(url, timeoutMs = 12_000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(150);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function createTarget(port) {
  const targetUrl = `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`;
  let response = await fetch(targetUrl, { method: "PUT" });
  if (!response.ok) response = await fetch(targetUrl);
  if (!response.ok) throw new Error(`Could not create Chrome target: HTTP ${response.status}`);
  const target = await response.json();
  if (!target.webSocketDebuggerUrl) throw new Error("Chrome target did not return a websocket debugger URL.");
  return target;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed.");
  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await evaluate(client, expression);
    if (value) return value;
    await delay(100);
  }
  throw new Error(`Timed out waiting for browser condition: ${expression}`);
}

async function clickSelector(client, selector) {
  await evaluate(
    client,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error("Missing selector: ${selector}");
      el.click();
      return true;
    })()`,
  );
}

function jsValue(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

async function captureScreenshot(client, outDir, filename) {
  const absoluteDir = resolve(outDir);
  await mkdir(absoluteDir, { recursive: true });
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = join(absoluteDir, filename);
  await writeFile(path, Buffer.from(screenshot.data, "base64"));
  console.log(path);
  return path;
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-ship-pass-chrome-"));
  const port = chooseDebugPort();
  const child = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"], windowsHide: true },
  );

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    return { child, userDataDir, port };
  } catch (error) {
    child.kill();
    await rm(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

async function stopChrome(chrome) {
  chrome.child.kill();
  await new Promise((resolveExit) => {
    if (chrome.child.exitCode !== null) {
      resolveExit(undefined);
      return;
    }
    const timer = setTimeout(resolveExit, 1500);
    chrome.child.once("exit", () => {
      clearTimeout(timer);
      resolveExit(undefined);
    });
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(chrome.userDataDir, { recursive: true, force: true });
      return;
    } catch {
      await delay(250);
    }
  }
}

async function openPreviewPage({ chrome, previewUrl, viewport, waitForCanvas = true }) {
  const target = await createTarget(chrome.port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Log.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 480,
  });
  await client.send("Page.navigate", { url: previewUrl });
  await waitFor(client, `document.readyState === "complete"`, 20_000);
  await waitFor(client, `Boolean(document.querySelector("[data-qa='alpha-city-world'], [data-qa='county-coverage-shell']"))`, 20_000);
  if (waitForCanvas) await waitForCanvasReady(client);
  return client;
}

async function waitForCanvasReady(client) {
  await waitFor(client, `document.querySelectorAll("canvas").length >= 1`, 20_000);
  await delay(250);
}

async function waitForToolBridge(client) {
  await waitFor(client, `window.__atlasToolResultBridgeReady === true`, 10_000);
  await waitFor(client, `window.__atlasToolResultSubscriberCount > 0`, 10_000);
}

async function injectToolResult(client, toolResult) {
  await evaluate(
    client,
    `(() => {
      window.dispatchEvent(new CustomEvent("atlas:test-tool-result", { detail: ${jsValue(toolResult)} }));
      return true;
    })()`,
  );
}

async function getGeneratedDraftToolResult(mcpUrl, countySlug) {
  const client = new Client({ name: "atlas-ship-pass-capture", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  await client.connect(transport);
  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const result = await client.callTool({
        name: "render_voxel_county",
        arguments: { countySlug, includeGeneratedDraft: true },
      });
      if (result?._meta?.generatedDraftScene) {
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

function createPreviewToolResults() {
  const scout = previewScoutDrop({
    countySlug: "riverside-ca",
    nodeId: "eastvale",
    businessType: "mobile detailing",
    goal: "get more weekend bookings",
  });
  const campaign = previewCampaignFromScout(scout);
  return {
    scout: {
      structuredContent: { ...withoutScene(scout), sceneId: scout.scene.id, flow: scout.scene.flow },
      content: [],
      _meta: { scoutPreview: scout, scene: scout.scene },
    },
    campaign: {
      structuredContent: { ...withoutScene(campaign), sceneId: campaign.scene.id, flow: campaign.scene.flow },
      content: [],
      _meta: { campaignPreview: campaign, scene: campaign.scene },
    },
  };
}

function withoutScene(value) {
  const { scene, ...rest } = value;
  return rest;
}

async function captureGeneratedDistrict({ chrome, previewUrl, outDir, generatedToolResult, viewport }) {
  const client = await openPreviewPage({ chrome, previewUrl, viewport });
  try {
    await waitFor(client, `Boolean(document.querySelector("[data-qa='generate-district-button']"))`, 10_000);
    await clickSelector(client, "[data-qa='generate-district-button']");
    await waitForToolBridge(client);
    await injectToolResult(client, generatedToolResult);
    await waitFor(client, `document.querySelector("[data-qa='alpha-city-world']")?.getAttribute("data-qa-generated") === "true"`, 10_000);
    await waitFor(client, `Boolean(document.querySelector("[data-qa='generated-boundary']"))`, 10_000);
    await waitForCanvasReady(client);
    return await captureScreenshot(client, outDir, `generated-district-${viewport.label}.png`);
  } finally {
    client.close();
  }
}

async function capturePreviewPanel({ chrome, previewUrl, outDir, scenario, toolResult, viewport }) {
  const client = await openPreviewPage({ chrome, previewUrl, viewport });
  try {
    await waitForToolBridge(client);
    await injectToolResult(client, toolResult);
    await waitFor(client, `document.querySelector("[data-qa='preview-panel']")?.getAttribute("data-qa-preview-kind") === ${JSON.stringify(scenario)}`, 15_000);
    await waitForCanvasReady(client);
    return await captureScreenshot(client, outDir, `preview-${scenario}-${viewport.label}.png`);
  } finally {
    client.close();
  }
}

async function captureCoverage({ chrome, previewUrl, outDir, countySlug, filename, waitForCanvas }) {
  const client = await openPreviewPage({ chrome, previewUrl, viewport: VIEWPORTS.desktop });
  try {
    await clickSelector(client, `[data-qa='county-switch-${countySlug}']`);
    await waitFor(client, `document.querySelector("[data-qa='county-coverage-shell']")?.getAttribute("data-qa-county-slug") === ${JSON.stringify(countySlug)}`, 10_000);
    if (waitForCanvas) await waitForCanvasReady(client);
    else await delay(250);
    return await captureScreenshot(client, outDir, filename);
  } finally {
    client.close();
  }
}

async function capturePlaceNoteTyped({ chrome, previewUrl, outDir }) {
  const client = await openPreviewPage({ chrome, previewUrl, viewport: VIEWPORTS.desktop });
  try {
    await waitFor(client, `Boolean(document.querySelector("[data-qa='selected-place-tray']"))`, 10_000);
    await evaluate(
      client,
      `(() => {
        const input = document.querySelector("[data-qa='note-input']");
        if (!input) throw new Error("Missing note input.");
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(input, "Weekend route idea for first Scout Drop.");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return input.value;
      })()`,
    );
    await waitFor(client, `document.querySelector("[data-qa='note-input']")?.value === "Weekend route idea for first Scout Drop."`, 5_000);
    return await captureScreenshot(client, outDir, `place-selected-note-typed-${VIEWPORTS.desktop.label}.png`);
  } finally {
    client.close();
  }
}

const args = parseArgs(process.argv.slice(2));
const mcpUrl = args.mcpUrl ?? new URL("/mcp", args.previewUrl).toString();
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome or Edge. Set CHROME_PATH or pass --chrome-path.");

await mkdir(resolve(args.outDir), { recursive: true });
const generatedToolResult = await getGeneratedDraftToolResult(mcpUrl, GENERATED_COUNTY_SLUG);
const previewToolResults = createPreviewToolResults();
const chrome = await launchChrome(chromePath);

try {
  await captureGeneratedDistrict({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, generatedToolResult, viewport: VIEWPORTS.desktop });
  await captureGeneratedDistrict({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, generatedToolResult, viewport: VIEWPORTS.mobile });
  await capturePreviewPanel({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, scenario: "scout", toolResult: previewToolResults.scout, viewport: VIEWPORTS.desktop });
  await capturePreviewPanel({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, scenario: "scout", toolResult: previewToolResults.scout, viewport: VIEWPORTS.mobile });
  await capturePreviewPanel({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, scenario: "campaign", toolResult: previewToolResults.campaign, viewport: VIEWPORTS.desktop });
  await capturePreviewPanel({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, scenario: "campaign", toolResult: previewToolResults.campaign, viewport: VIEWPORTS.mobile });
  await captureCoverage({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, countySlug: "orange-ca", filename: `coverage-orange-${VIEWPORTS.desktop.label}.png`, waitForCanvas: true });
  await captureCoverage({ chrome, previewUrl: args.previewUrl, outDir: args.outDir, countySlug: "made-up-ca", filename: `coverage-unknown-${VIEWPORTS.desktop.label}.png`, waitForCanvas: false });
  await capturePlaceNoteTyped({ chrome, previewUrl: args.previewUrl, outDir: args.outDir });
} finally {
  await stopChrome(chrome);
}
