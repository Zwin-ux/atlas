#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { previewCampaignFromScout, previewScoutDrop } from "../packages/core/dist/index.js";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "mobile-390x844", width: 390, height: 844 },
];
const SCENARIOS = ["scout", "campaign"];

function parseArgs(argv) {
  const args = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    screenshotDir: process.env.ATLAS_SCOUT_CAMPAIGN_PANEL_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
    jsonOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") {
      args.previewUrl = argv[++index];
    } else if (value === "--screenshots") {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        args.screenshotDir = next;
        index += 1;
      } else {
        args.screenshotDir = join(tmpdir(), "atlas-scout-campaign-panel");
      }
    } else if (value === "--chrome-path") {
      args.chromePath = argv[++index];
    } else if (value === "--json-only") {
      args.jsonOnly = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return args;
}

function findChrome(explicitPath) {
  const candidates = [
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
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chooseDebugPort() {
  return 9400 + Math.floor(Math.random() * 500);
}

async function waitForJson(url, timeoutMs = 10_000) {
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

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.socket = null;
  }

  async connect() {
    if (typeof WebSocket !== "function") {
      throw new Error("This verifier requires a Node runtime with global WebSocket support.");
    }

    this.socket = new WebSocket(this.webSocketUrl);
    this.socket.addEventListener("message", (event) => this.handleMessage(event.data));

    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }

  handleMessage(rawMessage) {
    const message = JSON.parse(rawMessage);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    this.events.push(message);
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.socket?.close();
  }
}

async function evaluate(client, expression, options = {}) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    ...options,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed.");
  }

  return result.result?.value;
}

async function waitFor(client, expression, timeoutMs = 10_000) {
  const startedAt = Date.now();
  let lastValue;

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(client, expression);
    if (lastValue) return lastValue;
    await delay(100);
  }

  throw new Error(`Timed out waiting for browser condition: ${expression}`);
}

async function captureScreenshot(client, screenshotDir, label) {
  if (!screenshotDir) return null;
  const absoluteDir = resolve(screenshotDir);
  await mkdir(absoluteDir, { recursive: true });
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = join(absoluteDir, `${label}.png`);
  await writeFile(path, Buffer.from(screenshot.data, "base64"));
  return path;
}

function browserErrors(client) {
  return client.events
    .filter((event) => {
      if (event.method === "Runtime.exceptionThrown") return true;
      if (event.method === "Log.entryAdded") return ["error", "warning"].includes(event.params?.entry?.level);
      if (event.method === "Runtime.consoleAPICalled") return ["error", "warning"].includes(event.params?.type);
      return false;
    })
    .map((event) => {
      if (event.method === "Runtime.exceptionThrown") {
        return event.params?.exceptionDetails?.text ?? "Runtime exception";
      }
      if (event.method === "Log.entryAdded") {
        return event.params?.entry?.text ?? "";
      }
      return (event.params?.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" ").trim();
    })
    .filter(Boolean);
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
    scout: buildScoutToolResult(scout),
    campaign: buildCampaignToolResult(campaign),
  };
}

function buildScoutToolResult(scout) {
  const { scene, ...rest } = scout;
  const result = { structuredContent: { ...rest, sceneId: scene.id, flow: scene.flow }, content: [], _meta: { scoutPreview: scout, scene } };
  return result;
}

function buildCampaignToolResult(campaign) {
  const { scene, ...rest } = campaign;
  const result = { structuredContent: { ...rest, sceneId: scene.id, flow: scene.flow }, content: [], _meta: { campaignPreview: campaign, scene } };
  return result;
}

async function runViewport({ previewUrl, viewport, scenario, toolResult, screenshotDir, port }) {
  const target = await createTarget(port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  try {
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
    await waitFor(client, `Boolean(document.querySelector("[data-qa='alpha-city-world']"))`, 20_000);
    // Pixi appends its canvas after an async app.init(); wait for it before
    // any state read asserts canvasCount.
    await waitFor(client, `document.querySelectorAll("canvas").length >= 1`, 20_000);
    await waitFor(client, `window.__atlasToolResultBridgeReady === true`, 10_000);
    await waitFor(client, `window.__atlasToolResultSubscriberCount > 0`, 10_000);

    await evaluate(
      client,
      `(() => {
        window.dispatchEvent(new CustomEvent("atlas:test-tool-result", { detail: ${JSON.stringify(toolResult)} }));
        return true;
      })();`,
    );
    await waitFor(client, `window.__atlasTestToolResultCount > 0`, 5_000);
    const injectedType = await evaluate(client, `window.__atlasLastTestToolResultType || ""`);
    if (injectedType !== `${scenario}Preview`) {
      throw new Error(`Preview panel injection reached the bridge with wrong type: ${injectedType}`);
    }
    try {
      await waitFor(client, `Boolean(document.querySelector("[data-qa='preview-panel']"))`, 15_000);
    } catch (error) {
      const diagnostics = await evaluate(
        client,
        `(() => ({
          bridgeReady: window.__atlasToolResultBridgeReady === true,
          subscriberCount: window.__atlasToolResultSubscriberCount || 0,
          injectedCount: window.__atlasTestToolResultCount || 0,
          injectedType: window.__atlasLastTestToolResultType || "",
          alphaShellVisible: Boolean(document.querySelector("[data-qa='alpha-city-world']")),
          previewPanelVisible: Boolean(document.querySelector("[data-qa='preview-panel']")),
          previewKind: document.querySelector("[data-qa='preview-panel']")?.getAttribute("data-qa-preview-kind") || "",
          bodyText: document.body.textContent?.trim().slice(0, 500) || ""
        }))()`,
      );
      throw new Error(`${error.message}. Diagnostics: ${JSON.stringify({ ...diagnostics, browserErrors: browserErrors(client) })}`);
    }

    const state = await evaluate(
      client,
      `(() => {
        const panel = document.querySelector("[data-qa='preview-panel']");
        const rect = panel?.getBoundingClientRect();
        return {
          panelPresent: Boolean(panel),
          previewKind: panel?.getAttribute("data-qa-preview-kind") || "",
          titleText: document.querySelector("[data-qa='preview-title']")?.textContent?.trim() || "",
          boundaryText: document.querySelector("[data-qa='preview-session-boundary']")?.textContent?.trim() || "",
          canvasCount: document.querySelectorAll("canvas").length,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          selectedPlaceTrayVisible: Boolean(document.querySelector("[data-qa='selected-place-tray']")),
          stickerToolsVisible: Boolean(document.querySelector("[data-qa='sticker-tools']")),
          viewport: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        };
      })()`,
    );
    const screenshotPath = await captureScreenshot(client, screenshotDir, `preview-${scenario}-${viewport.label}`);
    const errors = browserErrors(client);
    assertPanelState(viewport.label, scenario, state, errors);

    return {
      scenario,
      label: viewport.label,
      ok: true,
      viewport: { width: viewport.width, height: viewport.height },
      state,
      consoleErrors: errors,
      screenshotPath,
    };
  } finally {
    client.close();
  }
}

function assertPanelState(label, scenario, state, errors) {
  const failures = [];
  if (!state.panelPresent) failures.push("preview panel is missing");
  if (state.previewKind !== scenario) failures.push(`wrong preview kind: ${state.previewKind}`);
  if (!state.boundaryText.includes("saved")) failures.push("session boundary copy does not mention saved state");
  if (state.canvasCount !== 1) failures.push(`expected one canvas, got ${state.canvasCount}`);
  if (state.horizontalOverflow) failures.push(`horizontal overflow detected: ${state.scrollWidth} > ${state.clientWidth}`);
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);

  if (failures.length > 0) {
    throw new Error(`${scenario} ${label} failed: ${failures.join("; ")}`);
  }
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-shell-county-widget-chrome-"));
  const port = chooseDebugPort();
  const child = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], {
    stdio: ["ignore", "ignore", "ignore"],
  });

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`, 12_000);
    return { child, userDataDir, port };
  } catch (error) {
    child.kill();
    await rm(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

async function stopChrome(chrome) {
  chrome.child.kill();
  await new Promise((resolve) => {
    if (chrome.child.exitCode !== null) {
      resolve(undefined);
      return;
    }
    const timer = setTimeout(resolve, 1500);
    chrome.child.once("exit", () => {
      clearTimeout(timer);
      resolve(undefined);
    });
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(chrome.userDataDir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 4) {
        return;
      }
      await delay(250);
    }
  }
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function printSummary(summary, jsonOnly) {
  console.log(JSON.stringify(summary, null, jsonOnly ? 0 : 2));
}

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  printSummary(
    {
      ok: false,
      previewUrl: DEFAULT_PREVIEW_URL,
      screenshotsEnabled: false,
      results: [],
      failures: [formatError(error)],
    },
    false,
  );
  process.exit(1);
}

const chromePath = findChrome(args.chromePath);
const results = [];
const failures = [];
let chrome = null;

if (!chromePath) {
  failures.push("Could not find Chrome or Edge. Set CHROME_PATH to run the scout/campaign panel verifier.");
} else {
  try {
    const toolResults = createPreviewToolResults();
    chrome = await launchChrome(chromePath);

    for (const scenario of SCENARIOS) {
      for (const viewport of VIEWPORTS) {
        try {
          results.push(
            await runViewport({
              previewUrl: args.previewUrl,
              viewport,
              scenario,
              toolResult: toolResults[scenario],
              screenshotDir: args.screenshotDir,
              port: chrome.port,
            }),
          );
        } catch (error) {
          const failure = formatError(error);
          failures.push(failure);
          results.push({
            scenario,
            label: viewport.label,
            ok: false,
            viewport: { width: viewport.width, height: viewport.height },
            error: failure,
          });
        }
      }
    }
  } catch (error) {
    failures.push(formatError(error));
  } finally {
    if (chrome) {
      await stopChrome(chrome);
    }
  }
}

const summary = {
  ok: failures.length === 0,
  previewUrl: args.previewUrl,
  screenshotsEnabled: Boolean(args.screenshotDir),
  scenarios: SCENARIOS,
  results,
  failures,
};

printSummary(summary, args.jsonOnly);

if (!summary.ok) {
  process.exit(1);
}
