import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const DEFAULT_VIEWPORTS = [
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
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to a Chromium-compatible browser.");
if (args.screenshotDir) await mkdir(resolve(args.screenshotDir), { recursive: true });

let chrome;
const results = [];
try {
  chrome = await launchChrome(chromePath);
  for (const viewport of DEFAULT_VIEWPORTS) {
    const target = await createTarget(chrome.port);
    results.push(await runViewport({ target, viewport, previewUrl: args.previewUrl, screenshotDir: args.screenshotDir }));
  }
} finally {
  if (chrome) await closeChrome(chrome);
}

const ok = results.every((result) => result.ok);
console.log(
  JSON.stringify(
    {
      ok,
      update: "postalpha-0.61h-hosted-clawd-save-ux-browser-proof",
      previewUrl: sanitizeUrl(args.previewUrl),
      chromePath,
      screenshotsEnabled: Boolean(args.screenshotDir),
      cleanupWarning: chrome?.cleanupWarning,
      results,
    },
    null,
    2,
  ),
);
if (!ok) process.exitCode = 1;

function parseArgs(argv) {
  const parsed = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    screenshotDir: process.env.ATLAS_HOSTED_CLAWD_SAVE_UX_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") parsed.previewUrl = argv[++index] ?? parsed.previewUrl;
    else if (value === "--screenshots") parsed.screenshotDir = argv[++index] ?? join(tmpdir(), "atlas-hosted-clawd-save-ux");
    else if (value === "--chrome-path") parsed.chromePath = argv[++index] ?? parsed.chromePath;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return parsed;
}

async function runViewport({ target, viewport, previewUrl, screenshotDir }) {
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
    await waitFor(client, `Boolean(document.querySelector("[data-qa='hosted-clawd-open']"))`, 10_000);
    await clickSelector(client, "[data-qa='hosted-clawd-open']");
    await waitFor(client, `Boolean(document.querySelector("[data-qa='hosted-clawd-save-strip']"))`, 10_000);
    await delay(650);
    const state = await readState(client);
    const consoleErrors = readBrowserErrors(client);
    const screenshotPath = await captureScreenshot(client, screenshotDir, `hosted-clawd-save-ux-${viewport.label}`);
    assertState(viewport.label, state, consoleErrors);
    return { label: viewport.label, viewport, ok: true, state, consoleErrors, screenshotPath };
  } finally {
    client.close();
  }
}

async function readState(client) {
  return await evaluate(
    client,
    `(() => {
      const shell = document.querySelector("[data-qa='alpha-city-world']");
      const tray = document.querySelector("[data-qa='hosted-clawd-tray']");
      const strip = document.querySelector("[data-qa='hosted-clawd-save-strip']");
      const local = document.querySelector("[data-qa='hosted-clawd-local-view']");
      const slots = [...document.querySelectorAll("[data-qa^='hosted-clawd-save-slot-']")];
      const rail = document.querySelector(".city-world-hosted-clawd-motion-rail");
      const trayRect = tray?.getBoundingClientRect();
      const stripRect = strip?.getBoundingClientRect();
      const railStyle = rail ? getComputedStyle(rail.querySelector("span") ?? rail) : null;
      return {
        shell: Boolean(shell),
        tray: Boolean(tray),
        saveStrip: Boolean(strip),
        localView: Boolean(local),
        readiness: strip?.getAttribute("data-qa-save-readiness") || "",
        readyCount: Number(strip?.getAttribute("data-qa-save-ready-count") || 0),
        slotCount: slots.length,
        slotStatuses: slots.map((slot) => slot.getAttribute("data-status") || ""),
        text: strip?.textContent?.replace(/\\s+/g, " ").trim() || "",
        clayAnimation: railStyle?.animationName || "",
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        trayWithinViewport: Boolean(
          trayRect &&
            trayRect.width > 0 &&
            trayRect.height > 0 &&
            trayRect.left >= 0 &&
            trayRect.right <= window.innerWidth + 1 &&
            trayRect.top >= 0 &&
            trayRect.bottom <= window.innerHeight + 1
        ),
        stripWithinTray: Boolean(
          trayRect &&
            stripRect &&
            stripRect.left >= trayRect.left &&
            stripRect.right <= trayRect.right + 1 &&
            stripRect.top >= trayRect.top &&
            stripRect.bottom <= trayRect.bottom + 1
        ),
        primaryText: document.querySelector("[data-qa='hosted-clawd-primary-action']")?.textContent?.trim() || "",
      };
    })()`,
  );
}

function assertState(label, state, errors) {
  const failures = [];
  if (!state.shell) failures.push("city-world shell missing");
  if (!state.tray) failures.push("Hosted Clawd tray missing");
  if (!state.saveStrip) failures.push("save strip missing");
  if (!state.localView) failures.push("local view missing");
  if (state.slotCount < 4) failures.push(`expected at least 4 save slots, got ${state.slotCount}`);
  if (state.readyCount < 1) failures.push("expected at least one ready save slot");
  if (!state.text.includes("Local view") && !state.text.includes("Saved setup")) failures.push("local/setup label missing");
  if (!state.text.includes("This chat is temporary") && !state.text.includes("Save with Clawd")) failures.push("temporary-save copy missing");
  if (!state.clayAnimation.includes("city-world-hosted-clawd-rail-tick")) failures.push(`clay animation missing: ${state.clayAnimation}`);
  if (state.horizontalOverflow) failures.push("horizontal overflow detected");
  if (!state.trayWithinViewport) failures.push("tray is not fully inside viewport");
  if (!state.stripWithinTray) failures.push("save strip is not inside tray bounds");
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);
  if (failures.length > 0) throw new Error(`${label} Hosted Clawd save UX failed: ${failures.join("; ")}`);
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
  return 9400 + Math.floor(Math.random() * 400);
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-hosted-clawd-save-ux-chrome-"));
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
  if (process.platform === "win32" && child.pid) {
    await runProcess("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"]);
    return;
  }
  child.kill("SIGKILL");
  await new Promise((resolve) => {
    child.once("exit", resolve);
    setTimeout(resolve, 1000);
  });
}

function runProcess(file, args) {
  return new Promise((resolve) => {
    const child = spawn(file, args, { stdio: ["ignore", "ignore", "ignore"], windowsHide: true });
    child.once("exit", resolve);
    child.once("error", resolve);
  });
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
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error("Missing selector: ${selector}");
      element.click();
      return true;
    })()`,
  );
}

async function captureScreenshot(client, screenshotDir, label) {
  if (!screenshotDir) return null;
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = join(resolve(screenshotDir), `${label}.png`);
  await writeFile(path, Buffer.from(screenshot.data, "base64"));
  return path;
}

function readBrowserErrors(client) {
  return client.events
    .filter((event) => {
      if (event.method === "Runtime.exceptionThrown") return true;
      if (event.method === "Runtime.consoleAPICalled") return event.params?.type === "error";
      return false;
    })
    .map((event) => {
      if (event.method === "Runtime.exceptionThrown") return event.params?.exceptionDetails?.text ?? "Runtime exception.";
      return (event.params?.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" ").trim();
    })
    .filter(Boolean);
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
