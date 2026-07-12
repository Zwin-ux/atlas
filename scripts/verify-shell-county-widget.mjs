import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const DEFAULT_MCP_URL = "http://127.0.0.1:8787/mcp";
const DEFAULT_COUNTY_SLUG = "orange-ca";
const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "mobile-390x844", width: 390, height: 844 },
];

function parseArgs(argv) {
  const args = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    mcpUrl: process.env.ATLAS_MCP_URL ?? DEFAULT_MCP_URL,
    countySlug: process.env.ATLAS_VERIFY_SHELL_COUNTY ?? DEFAULT_COUNTY_SLUG,
    expectedTier: process.env.ATLAS_VERIFY_SHELL_TIER ?? "L1_COUNTY_SHELL",
    screenshotDir: process.env.ATLAS_SHELL_WIDGET_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") {
      args.previewUrl = argv[++index];
    } else if (value === "--mcp-url") {
      args.mcpUrl = argv[++index];
    } else if (value === "--county") {
      args.countySlug = argv[++index];
    } else if (value === "--expected-tier") {
      args.expectedTier = argv[++index];
    } else if (value === "--screenshots") {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        args.screenshotDir = next;
        index += 1;
      } else {
        args.screenshotDir = join(tmpdir(), "atlas-shell-county-widget");
      }
    } else if (value === "--chrome-path") {
      args.chromePath = argv[++index];
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
  const path = join(absoluteDir, `shell-county-widget-${label}.png`);
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

async function getShellToolResult(mcpUrl, countySlug, expectedTier) {
  const client = new Client({ name: "atlas-shell-county-widget-verifier", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  await client.connect(transport);
  try {
    const result = await client.callTool({
      name: "select_county",
      arguments: { countySlug },
    });
    if (result?.structuredContent?.type !== "countyCoverageSummary") {
      throw new Error(`Expected countyCoverageSummary for ${countySlug}.`);
    }
    if (result.structuredContent.coverageTier !== expectedTier) {
      throw new Error(`Expected ${expectedTier} for ${countySlug}; got ${result.structuredContent.coverageTier}.`);
    }
    if (result._meta?.scene) {
      throw new Error("Coverage county result must not include _meta.scene.");
    }
    if (expectedTier === "L1_COUNTY_SHELL" && typeof result.structuredContent.stateCode !== "string") {
      throw new Error("Shell county result must include stateCode for client-side shell compile.");
    }
    if (result._meta?.coverageShellScene) {
      throw new Error("Coverage county result must not include _meta.coverageShellScene.");
    }
    return {
      structuredContent: result.structuredContent,
      content: result.content ?? [],
      _meta: result._meta ?? {},
    };
  } finally {
    await transport.close();
    await client.close();
  }
}

async function runViewport({ previewUrl, viewport, toolResult, expectedTier, screenshotDir, port }) {
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
    if (injectedType !== "countyCoverageSummary") {
      throw new Error(`Shell verifier injection reached the bridge with wrong type: ${injectedType}`);
    }
    try {
      await waitFor(client, `Boolean(document.querySelector("[data-qa='county-coverage-shell']"))`, 15_000);
    } catch (error) {
      const diagnostics = await evaluate(
        client,
        `(() => ({
          bridgeReady: window.__atlasToolResultBridgeReady === true,
          subscriberCount: window.__atlasToolResultSubscriberCount || 0,
          injectedCount: window.__atlasTestToolResultCount || 0,
          injectedType: window.__atlasLastTestToolResultType || "",
          alphaShellVisible: Boolean(document.querySelector("[data-qa='alpha-city-world']")),
          coverageShellVisible: Boolean(document.querySelector("[data-qa='county-coverage-shell']")),
          currentMapText: document.querySelector("[data-qa='current-city-map']")?.textContent?.trim() || "",
          coverageText: document.querySelector("[data-qa='current-county-coverage']")?.textContent?.trim() || "",
          bodyText: document.body.textContent?.trim().slice(0, 500) || ""
        }))()`,
      );
      throw new Error(`${error.message}. Diagnostics: ${JSON.stringify({ ...diagnostics, browserErrors: browserErrors(client) })}`);
    }
    if (expectedTier === "L1_COUNTY_SHELL") {
      await waitFor(client, `document.querySelectorAll("canvas").length === 1`, 15_000);
    }

    const state = await evaluate(
      client,
      `(() => {
        const shell = document.querySelector("[data-qa='county-coverage-shell']");
        if (!shell) throw new Error("Missing county coverage shell.");
        const rect = shell.getBoundingClientRect();
        const tray = document.querySelector("[data-qa='coverage-status-tray']");
        const recoveryAction = document.querySelector("[data-qa='coverage-recovery-action']");
        const trayRect = tray?.getBoundingClientRect();
        const recoveryRect = recoveryAction?.getBoundingClientRect();
        const recoveryActionFirstViewportVisible = Boolean(
          trayRect &&
          recoveryRect &&
          recoveryRect.top >= trayRect.top &&
          recoveryRect.bottom <= trayRect.bottom + 1 &&
          recoveryRect.top >= 0 &&
          recoveryRect.bottom <= window.innerHeight
        );
        return {
          countySlug: shell.getAttribute("data-qa-county-slug"),
          supported: shell.getAttribute("data-qa-supported"),
          coverageTier: shell.getAttribute("data-qa-coverage-tier"),
          playableDistrictCount: Number(shell.getAttribute("data-qa-playable-district-count") || 0),
          placeCount: Number(shell.getAttribute("data-qa-place-count") || 0),
          selectedPlaceTrayVisible: Boolean(document.querySelector("[data-qa='selected-place-tray']")),
          stickerToolsVisible: Boolean(document.querySelector("[data-qa='sticker-tools']")),
          noteInputVisible: Boolean(document.querySelector("[data-qa='note-input']")),
          recoveryActionVisible: Boolean(recoveryAction),
          recoveryActionFirstViewportVisible,
          recoveryActionText: recoveryAction?.textContent?.trim() || "",
          coverageTrayVisible: Boolean(document.querySelector("[data-qa='coverage-status-tray']")),
          boundaryText: document.querySelector("[data-qa='coverage-boundary']")?.textContent?.trim() || "",
          sourceText: document.querySelector("[data-qa='coverage-source-note']")?.textContent?.trim() || "",
          statusLabel: document.querySelector("[data-qa='coverage-status-label']")?.textContent?.trim() || "",
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          canvasCount: document.querySelectorAll("canvas").length,
          viewport: { width: Math.round(rect.width), height: Math.round(rect.height) },
        };
      })()`,
    );
    const screenshotPath = await captureScreenshot(client, screenshotDir, viewport.label);
    const errors = browserErrors(client);
    assertShellState(viewport.label, state, expectedTier, errors);

    return {
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

function assertShellState(label, state, expectedTier, errors) {
  const failures = [];
  if (state.coverageTier !== expectedTier) failures.push(`wrong tier: ${state.coverageTier}`);
  if (expectedTier === "L0_UNSUPPORTED" && state.supported !== "false") failures.push("unsupported shell should set supported=false");
  if (state.playableDistrictCount !== 0) failures.push(`shell claims playable districts: ${state.playableDistrictCount}`);
  if (state.placeCount !== 0) failures.push(`shell claims places: ${state.placeCount}`);
  if (!state.coverageTrayVisible) failures.push("coverage tray is missing");
  if (state.selectedPlaceTrayVisible) failures.push("selected-place tray should not be visible for shell counties");
  if (state.stickerToolsVisible) failures.push("sticker tools should not be visible for shell counties");
  if (state.noteInputVisible) failures.push("note input should not be visible for shell counties");
  if (!state.recoveryActionVisible) failures.push("recovery action is missing");
  if (!state.recoveryActionFirstViewportVisible) failures.push("recovery action is not visible in the first viewport");
  if (!state.recoveryActionText.includes("Riverside")) failures.push("recovery action does not point to Riverside");
  if (expectedTier === "L1_COUNTY_SHELL" && state.canvasCount !== 1) failures.push(`expected one canvas, got ${state.canvasCount}`);
  if (expectedTier === "L0_UNSUPPORTED" && state.canvasCount !== 0) failures.push(`unsupported counties should not render a shell canvas, got ${state.canvasCount}`);
  if (state.horizontalOverflow) failures.push("horizontal overflow detected");
  if (
    expectedTier === "L1_COUNTY_SHELL" &&
    !state.boundaryText.includes("Preview only")
  ) {
    failures.push("preview boundary copy is missing");
  }
  if (
    expectedTier === "L0_UNSUPPORTED" &&
    !state.boundaryText.includes("Not available yet")
  ) {
    failures.push("unsupported boundary copy is missing");
  }
  // Boundary copy is kept in plain voice ("Stays in this chat.") in the
  // hosted-clawd pass; the XP/automation enumeration lives in the tool-layer
  // honesty verifiers. Assert the chat boundary in the current voice.
  if (!/stays in this chat/i.test(state.boundaryText)) {
    failures.push("chat boundary copy is missing");
  }
  if (!state.sourceText.includes("Riverside/Eastvale")) failures.push("playable county guidance is missing");
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);

  if (failures.length > 0) {
    throw new Error(`${label} failed: ${failures.join("; ")}`);
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

const args = parseArgs(process.argv.slice(2));
const chromePath = findChrome(args.chromePath);

if (!chromePath) {
  throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to run the shell county widget verifier.");
}

const toolResult = await getShellToolResult(args.mcpUrl, args.countySlug, args.expectedTier);
const chrome = await launchChrome(chromePath);
const results = [];

try {
  for (const viewport of VIEWPORTS) {
    results.push(
      await runViewport({
        previewUrl: args.previewUrl,
        viewport,
        toolResult,
        expectedTier: args.expectedTier,
        screenshotDir: args.screenshotDir,
        port: chrome.port,
      }),
    );
  }
} finally {
  await stopChrome(chrome);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      previewUrl: args.previewUrl,
      mcpUrl: args.mcpUrl,
      countySlug: args.countySlug,
      expectedTier: args.expectedTier,
      screenshotsEnabled: Boolean(args.screenshotDir),
      results,
    },
    null,
    2,
  ),
);
