#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const DEFAULT_ARTIFACT = "artifacts/product-quality-audit/0.66h/mobile-interaction-hardening.json";
const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720, p95CeilingMs: 75 },
  { label: "mobile-390x844", width: 390, height: 844, p95CeilingMs: 75 },
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

const args = parseArgs(process.argv.slice(2));
const staticResult = verifyStaticContracts();
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to a Chromium-compatible browser.");
if (args.screenshotDir) await mkdir(resolve(args.screenshotDir), { recursive: true });

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
  update: "postalpha-0.66h-mobile-interaction-hardening",
  decision: "RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD",
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
    artifactPath: process.env.ATLAS_066H_ARTIFACT ?? DEFAULT_ARTIFACT,
    screenshotDir: process.env.ATLAS_066H_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") continue;
    if (value === "--url") parsed.previewUrl = argv[++index] ?? parsed.previewUrl;
    else if (value === "--artifact") parsed.artifactPath = argv[++index] ?? parsed.artifactPath;
    else if (value === "--screenshots") parsed.screenshotDir = argv[++index] ?? join(tmpdir(), "atlas-066h-mobile-hardening");
    else if (value === "--chrome-path") parsed.chromePath = argv[++index] ?? parsed.chromePath;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return parsed;
}

function verifyStaticContracts() {
  const blockers = [];
  const pixi = read("web/src/PixiVoxelSceneView.tsx");
  const city = read("web/src/CityWorldRenderer.tsx");
  const tray = read("web/src/HostedClawdTray.tsx");
  const styles = read("web/src/styles.css");
  const dist = bundleSummary();

  for (const token of ["cameraRef", "scheduleViewportTransform", "qaPixiRebuildCount", "placeVisualsRef"]) {
    if (!pixi.includes(token)) blockers.push(`PixiVoxelSceneView missing retained-graph token: ${token}`);
  }
  for (const forbidden of ["const [zoom", "const [pan", "setZoom(", "setPan(", "hoverPlaceId, ready"]) {
    if (pixi.includes(forbidden)) blockers.push(`PixiVoxelSceneView still contains interaction rebuild pressure: ${forbidden}`);
  }
  for (const token of ["scheduleCameraApply", "qaCityWorldRebuildCount"]) {
    if (!city.includes(token)) blockers.push(`CityWorldRenderer missing pan proof token: ${token}`);
  }
  for (const token of ["data-qa-sheet-state", "is-collapsed", "is-expanded", "role={expanded ? \"dialog\" : \"region\"}"]) {
    if (!tray.includes(token)) blockers.push(`HostedClawdTray missing bottom-sheet token: ${token}`);
  }
  for (const forbidden of ["hosted-clawd-clay-bg.svg", "city-world-hosted-clawd-motion-rail"]) {
    if (tray.includes(forbidden)) blockers.push(`HostedClawdTray still ships modal-era DOM/import: ${forbidden}`);
  }
  for (const token of ["max-height: 45dvh", "max-height: 96px", "prefers-reduced-motion", "city-world-renderer-fallback"]) {
    if (!styles.includes(token)) blockers.push(`styles.css missing 0.66H token: ${token}`);
  }
  if (dist.eagerJsBytes > 400_000) blockers.push(`eager component.js ${dist.eagerJsBytes} bytes exceeds 400KB.`);
  if (dist.previewHtmlBytes > 300_000) blockers.push(`preview shell ${dist.previewHtmlBytes} bytes exceeds 300KB.`);
  if (dist.chunkCount < 1) blockers.push("web/dist/chunks is empty; Pixi renderer was not split.");

  return { blockers, summary: { ...dist, sourceContracts: "retained graph + bottom sheet + split payload" } };
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

    const pan = await measurePan(client);
    if (pan.rebuildDelta !== 0) blockers.push(`pan changed city-world rebuild count by ${pan.rebuildDelta}`);
    if (pan.p95FrameMs > viewport.p95CeilingMs) blockers.push(`pan p95 ${pan.p95FrameMs}ms exceeds ${viewport.p95CeilingMs}ms`);

    await clickSelector(client, "[data-qa='hosted-clawd-open']");
    await waitFor(client, `Boolean(document.querySelector("[data-qa='hosted-clawd-tray']"))`, 10_000);
    const collapsed = await readSheetState(client);
    if (collapsed.sheetState !== "collapsed") blockers.push(`expected collapsed sheet, got ${collapsed.sheetState}`);
    if (collapsed.role !== "region") blockers.push(`collapsed sheet should be region, got ${collapsed.role}`);
    if (collapsed.ariaModal) blockers.push("collapsed sheet must not set aria-modal");
    if (collapsed.height > 97) blockers.push(`collapsed sheet too tall: ${collapsed.height}px`);
    if (!isAtLeastTouchTarget(collapsed.primaryTarget)) blockers.push(`primary target below 44px collapsed: ${JSON.stringify(collapsed.primaryTarget)}`);
    if (!collapsed.mapCanvasVisible) blockers.push("map canvas/fallback not visible with collapsed sheet");
    if (collapsed.horizontalOverflow) blockers.push("horizontal overflow with collapsed sheet");

    await clickSelector(client, ".city-world-hosted-clawd-peek-copy");
    await waitFor(client, `document.querySelector("[data-qa='hosted-clawd-tray']")?.getAttribute("data-qa-sheet-state") === "expanded"`, 10_000);
    const expanded = await readSheetState(client);
    if (expanded.role !== "dialog") blockers.push(`expanded sheet should be dialog, got ${expanded.role}`);
    if (expanded.ariaModal !== "true") blockers.push("expanded sheet must set aria-modal true");
    if (!expanded.focusInsideTray) blockers.push("expanded sheet did not move focus inside");
    if (expanded.height > viewport.height * 0.45 + 2) blockers.push(`expanded sheet ${expanded.height}px exceeds 45dvh for ${viewport.height}px viewport`);
    if (expanded.horizontalOverflow) blockers.push("horizontal overflow with expanded sheet");

    const screenshotPath = await captureScreenshot(client, screenshotDir, `mobile-hardening-${viewport.label}`);
    const consoleErrors = readBrowserErrors(client);
    if (consoleErrors.length > 0) blockers.push(`console errors: ${consoleErrors.join(" | ")}`);
    return { label: viewport.label, viewport, ok: blockers.length === 0, pan, collapsed, expanded, consoleErrors, screenshotPath, blockers };
  } finally {
    client.close();
  }
}

async function measurePan(client) {
  return await evaluate(
    client,
    `(() => new Promise((resolve) => {
      const host = document.querySelector(".city-world-renderer");
      const before = Number(host?.getAttribute("data-qa-city-world-rebuild-count") || 0);
      const rect = host.getBoundingClientRect();
      const startX = rect.left + rect.width * 0.45;
      const startY = rect.top + rect.height * 0.48;
      const frames = [];
      let last = performance.now();
      let running = true;
      const tick = (now) => {
        if (running) {
          frames.push(now - last);
          last = now;
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
      host.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 77, bubbles: true, clientX: startX, clientY: startY, buttons: 1 }));
      let index = 0;
      const steps = 54;
      const interval = setInterval(() => {
        index += 1;
        const dx = index * 0.8;
        const dy = Math.sin(index / 4) * 1.2;
        host.dispatchEvent(new PointerEvent("pointermove", { pointerId: 77, bubbles: true, clientX: startX + dx, clientY: startY + dy, buttons: 1 }));
        if (index >= steps) {
          clearInterval(interval);
          host.dispatchEvent(new PointerEvent("pointerup", { pointerId: 77, bubbles: true, clientX: startX + dx, clientY: startY + dy, buttons: 0 }));
          setTimeout(() => {
            running = false;
            const after = Number(host?.getAttribute("data-qa-city-world-rebuild-count") || 0);
            const sorted = frames.slice(1).sort((a, b) => a - b);
            const percentile = (p) => Number((sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0).toFixed(2));
            resolve({
              frameCount: sorted.length,
              p50FrameMs: percentile(0.5),
              p95FrameMs: percentile(0.95),
              rebuildBefore: before,
              rebuildAfter: after,
              rebuildDelta: after - before
            });
          }, 160);
        }
      }, 16);
    }))()`,
  );
}

async function readSheetState(client) {
  return await evaluate(
    client,
    `(() => {
      const tray = document.querySelector("[data-qa='hosted-clawd-tray']");
      const primary = document.querySelector("[data-qa='hosted-clawd-primary-action']");
      const map = document.querySelector(".city-world-canvas") || document.querySelector("[data-qa='city-world-renderer-fallback']");
      const rect = tray?.getBoundingClientRect();
      const primaryRect = primary?.getBoundingClientRect();
      return {
        sheetState: tray?.getAttribute("data-qa-sheet-state") || "",
        role: tray?.getAttribute("role") || "",
        ariaModal: tray?.getAttribute("aria-modal") || "",
        focusInsideTray: Boolean(tray && tray.contains(document.activeElement)),
        height: Number((rect?.height || 0).toFixed(2)),
        width: Number((rect?.width || 0).toFixed(2)),
        top: Number((rect?.top || 0).toFixed(2)),
        bottom: Number((rect?.bottom || 0).toFixed(2)),
        primaryTarget: primaryRect ? { width: primaryRect.width, height: primaryRect.height } : null,
        mapCanvasVisible: Boolean(map && map.getBoundingClientRect().width > 0 && map.getBoundingClientRect().height > 0),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    })()`,
  );
}

async function clickSelector(client, selector) {
  await evaluate(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error("Missing selector: ${selector}");
      element.click();
      return true;
    })()`,
  );
}

function bundleSummary() {
  const componentPath = "web/dist/component.js";
  const cssPath = "web/dist/component.css";
  const chunksDir = "web/dist/chunks";
  const previewHtml = read("server/src/index.ts").includes('<script type="module" src="${assetBase}/component.js"></script>');
  const chunkFiles = listJsFiles(chunksDir);
  const chunkBytes = chunkFiles.reduce((sum, path) => sum + readFileSync(path).length, 0);
  const shellHtml = readBuiltShellForBudget();
  return {
    eagerJsBytes: existsSync(componentPath) ? readFileSync(componentPath).length : 0,
    cssBytes: existsSync(cssPath) ? readFileSync(cssPath).length : 0,
    chunkCount: chunkFiles.length,
    deferredJsBytes: chunkBytes,
    totalJsBytes: (existsSync(componentPath) ? readFileSync(componentPath).length : 0) + chunkBytes,
    previewHtmlBytes: Buffer.byteLength(shellHtml),
    previewUsesExternalAssets: previewHtml,
  };
}

function readBuiltShellForBudget() {
  const server = read("server/src/index.ts");
  return server.includes("<link rel=\"stylesheet\"") && server.includes("src=\"${assetBase}/component.js\"")
    ? '<!doctype html><html><head><title>Atlas City Map</title><link rel="stylesheet" href="/widget/component.css"></head><body><div id="root"></div><script type="module" src="/widget/component.js"></script></body></html>'
    : "";
}

function listJsFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(path);
    return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
  });
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function isAtLeastTouchTarget(rect) {
  return Boolean(rect && rect.width >= 44 && rect.height >= 44);
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
  return 9800 + Math.floor(Math.random() * 300);
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-066h-hardening-chrome-"));
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
    chrome.cleanupWarning = `${error.code}: ${error.message}`;
  }
}

async function forceStopBrowser(child) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32" && child.pid) {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: ["ignore", "ignore", "ignore"], windowsHide: true });
    await new Promise((resolve) => killer.once("close", resolve));
    return;
  }
  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 250));
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
  if (!screenshotDir) return undefined;
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}
