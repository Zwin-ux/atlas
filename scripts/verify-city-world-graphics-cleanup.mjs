#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const DEFAULT_ARTIFACT = "artifacts/product-quality-audit/0.67h/graphics-cleanup.json";
const DEFAULT_SCREENSHOT_DIR = "artifacts/product-quality-audit/0.67h/screens";
const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "mobile-390x844", width: 390, height: 844 },
];

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.socket = null;
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);
    this.socket.addEventListener("message", (event) => this.handleMessage(event.data));
    await new Promise((resolvePromise, reject) => {
      this.socket.addEventListener("open", resolvePromise, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }

  handleMessage(rawMessage) {
    const message = JSON.parse(rawMessage);
    if (message.id && this.pending.has(message.id)) {
      const { resolve: resolvePromise, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolvePromise(message.result);
      return;
    }
    this.events.push(message);
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
    });
  }

  close() {
    this.socket?.close();
  }
}

const args = parseArgs(process.argv.slice(2));
await mkdir(resolve(args.screenshotDir), { recursive: true });

const staticResult = verifyStaticContracts();
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to a Chromium-compatible browser.");

let chrome;
const browserResults = [];
try {
  chrome = await launchChrome(chromePath);
  for (const viewport of VIEWPORTS) {
    const target = await createTarget(chrome.port);
    browserResults.push(await runViewport({ target, viewport, previewUrl: args.previewUrl, screenshotDir: args.screenshotDir }));
  }
} finally {
  if (chrome) await closeChrome(chrome);
}

const blockers = [
  ...staticResult.blockers,
  ...browserResults.flatMap((result) => result.blockers.map((blocker) => `${result.label}: ${blocker}`)),
];

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.67h-product-feel-cleanup",
  decision: "GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST",
  previewUrl: sanitizeUrl(args.previewUrl),
  chromePath,
  static: staticResult.summary,
  browser: browserResults,
  blockerCount: blockers.length,
  blockers,
};

await mkdir(dirname(resolve(args.artifactPath)), { recursive: true });
await writeFile(resolve(args.artifactPath), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function parseArgs(argv) {
  const parsed = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    artifactPath: process.env.ATLAS_067H_ARTIFACT ?? DEFAULT_ARTIFACT,
    screenshotDir: process.env.ATLAS_067H_SCREENSHOT_DIR ?? DEFAULT_SCREENSHOT_DIR,
    chromePath: process.env.CHROME_PATH ?? "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") continue;
    if (value === "--url") parsed.previewUrl = argv[++index] ?? parsed.previewUrl;
    else if (value === "--artifact") parsed.artifactPath = argv[++index] ?? parsed.artifactPath;
    else if (value === "--screenshots") parsed.screenshotDir = argv[++index] ?? parsed.screenshotDir;
    else if (value === "--chrome-path") parsed.chromePath = argv[++index] ?? parsed.chromePath;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return parsed;
}

function verifyStaticContracts() {
  const blockers = [];
  const city = read("web/src/CityWorldRenderer.tsx");

  const requiredTokens = [
    "ambientLabelAllowance(scene, cameraPresetId)",
    "if (cameraPresetId === \"mobile\") return new Set();",
    ".slice(0, 2)",
    // 0.75R: the fable focus-overlay architecture keeps the base scene
    // focus-agnostic (hover/selection never rebuilds it), so the 0.67H
    // conditional literals collapsed: the focal anchor pins to the HUD
    // default place, non-focused places draw no ring at all, and emphasis
    // strokes live in the focus overlay.
    "focalPlaceAnchor(scene, scene.hudDefaults.selectedPlaceId)",
    "focalCalm(prop.position, focalAnchor)",
    "focalCalm(actor.position, focalAnchor)",
    "baseAlpha: 0.32",
    "const radius = selected ? (landmarkFocus ? 18 : 22) : 20",
    "sprite.scale.set(asset.scale * (focalPin ? 0.8 : 1))",
    "return { x: point.x + 30, y: point.y + 14 };",
    "activeStrokeAlpha: 0.38",
    "glassRecesses",
    "serviceBays",
  ];
  for (const token of requiredTokens) {
    if (!city.includes(token)) blockers.push(`CityWorldRenderer missing 0.67H graphics cleanup token: ${token}`);
  }

  const forbiddenTokens = [
    "outline: selected ? 0xffffff",
    "fill({ color: selected ? 0x76f8d7",
    "baseAlpha: selected || hovered ? 0.78",
  ];
  for (const token of forbiddenTokens) {
    if (city.includes(token)) blockers.push(`CityWorldRenderer still contains loud pre-cleanup token: ${token}`);
  }

  return {
    blockers,
    summary: {
      sourceContracts:
        "mobile selected-only labels, desktop ambient label cap, quiet focus rings, off-facade pins, focal calm for props/actors, reduced commerce/gym detail",
      rendererPath: "web/src/CityWorldRenderer.tsx",
    },
  };
}

async function runViewport({ target, viewport, previewUrl, screenshotDir }) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  const blockers = [];
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
    await waitFor(client, `Boolean(document.querySelector("[data-qa='city-world-renderer-fallback']")) || Boolean(document.querySelector(".city-world-canvas"))`, 20_000);
    await waitFor(client, `Number(document.querySelector(".city-world-renderer")?.getAttribute("data-qa-city-world-rebuild-count") || 0) > 0`, 20_000);
    await delay(900);

    const viewportState = await evaluate(
      client,
      `(() => {
        const host = document.querySelector(".city-world-renderer");
        const canvas = document.querySelector(".city-world-canvas canvas") || document.querySelector(".city-world-canvas");
        const fallback = document.querySelector("[data-qa='city-world-renderer-fallback']");
        const hostRect = host?.getBoundingClientRect();
        const canvasRect = canvas?.getBoundingClientRect();
        return {
          hostVisible: Boolean(hostRect && hostRect.width > 0 && hostRect.height > 0),
          canvasVisible: Boolean(canvasRect && canvasRect.width > 0 && canvasRect.height > 0),
          fallbackVisible: Boolean(fallback && fallback.getBoundingClientRect().width > 0),
          rebuildCount: Number(host?.getAttribute("data-qa-city-world-rebuild-count") || 0),
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          bodyText: document.body.innerText.slice(0, 240)
        };
      })()`,
    );
    if (!viewportState.hostVisible) blockers.push("city-world renderer host is not visible");
    if (!viewportState.canvasVisible && !viewportState.fallbackVisible) blockers.push("neither Pixi canvas nor fallback is visible");
    if (viewportState.rebuildCount <= 0) blockers.push("city-world renderer did not build a scene");
    if (viewportState.horizontalOverflow) blockers.push("horizontal overflow");

    const screenshotPath = await captureScreenshot(client, screenshotDir, `graphics-cleanup-${viewport.label}`);
    const consoleErrors = readBrowserErrors(client);
    if (consoleErrors.length > 0) blockers.push(`console errors: ${consoleErrors.join(" | ")}`);
    return { label: viewport.label, viewport, ok: blockers.length === 0, viewportState, consoleErrors, screenshotPath, blockers };
  } finally {
    client.close();
  }
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
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

function chooseDebugPort() {
  return 9900 + Math.floor(Math.random() * 200);
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-067h-graphics-chrome-"));
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
    return { child, port, userDataDir };
  } catch (error) {
    child.kill();
    await rm(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

async function closeChrome(chrome) {
  await forceStopBrowser(chrome.child);
  try {
    await rm(chrome.userDataDir, { recursive: true, force: true });
  } catch (error) {
    if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error?.code)) throw error;
  }
}

async function forceStopBrowser(child) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32" && child.pid) {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: ["ignore", "ignore", "ignore"], windowsHide: true });
    await new Promise((resolvePromise) => killer.once("close", resolvePromise));
    return;
  }
  child.kill("SIGTERM");
  await delay(250);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function createTarget(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Could not create Chrome target: HTTP ${response.status}`);
  return await response.json();
}

async function waitForJson(url, timeoutMs = 10_000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

async function waitFor(client, expression, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (await evaluate(client, expression)) return;
    } catch {
      // Page is still settling.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result?.value;
}

function readBrowserErrors(client) {
  return client.events
    .filter((event) => {
      if (event.method === "Runtime.exceptionThrown") return true;
      if (event.method !== "Log.entryAdded") return false;
      return event.params?.entry?.level === "error";
    })
    .map((event) => event.params?.entry?.text ?? event.params?.exceptionDetails?.text ?? event.method)
    .filter(Boolean);
}

async function captureScreenshot(client, screenshotDir, name) {
  const result = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const path = resolve(screenshotDir, `${name}.png`);
  await writeFile(path, Buffer.from(result.data, "base64"));
  return path;
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    url.search = url.search ? "?..." : "";
    return url.toString();
  } catch {
    return value;
  }
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
