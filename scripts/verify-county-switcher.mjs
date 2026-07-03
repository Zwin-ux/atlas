import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "mobile-390x844", width: 390, height: 844 },
];

function parseArgs(argv) {
  const args = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    screenshotDir: process.env.ATLAS_COUNTY_SWITCHER_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
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
        args.screenshotDir = join(tmpdir(), "atlas-county-switcher");
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
  return 9900 + Math.floor(Math.random() * 400);
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

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
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
  const path = join(absoluteDir, `county-switcher-${label}.png`);
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
      if (event.method === "Runtime.exceptionThrown") return event.params?.exceptionDetails?.text ?? "Runtime exception";
      if (event.method === "Log.entryAdded") return event.params?.entry?.text ?? "";
      return (event.params?.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" ").trim();
    })
    .filter(Boolean);
}

async function clickCounty(client, countySlug) {
  await evaluate(
    client,
    `(() => {
      const button = document.querySelector("[data-qa='county-switch-${countySlug}']");
      if (!button) throw new Error("Missing county switch ${countySlug}");
      button.click();
      return true;
    })()`,
  );
}

async function clickProductPath(client, action) {
  await evaluate(
    client,
    `(() => {
      const button = document.querySelector("[data-qa='public-product-path-${action}']");
      if (!button) throw new Error("Missing public product path action ${action}");
      button.click();
      return true;
    })()`,
  );
}

async function readState(client) {
  return evaluate(
    client,
    `(() => {
      const activeButton = document.querySelector("[data-qa='county-switcher'] button.is-active");
      const summary = document.querySelector("[data-qa='county-switcher-summary']");
      const productPath = document.querySelector("[data-qa='public-product-path']");
      const recovery = document.querySelector("[data-qa='coverage-recovery-action']");
      const tray = document.querySelector("[data-qa='coverage-status-tray']") || document.querySelector("[data-qa='selected-place-tray']");
      const coverageTray = document.querySelector("[data-qa='coverage-status-tray']");
      const productPathRect = productPath?.getBoundingClientRect();
      const recoveryRect = recovery?.getBoundingClientRect();
      const trayRect = coverageTray?.getBoundingClientRect();
      const bottomTrayRect = tray?.getBoundingClientRect();
      return {
        activeCountySlug: activeButton?.getAttribute("data-qa-county-slug") || "",
        activeCountyLabel: activeButton?.querySelector("span")?.textContent?.trim() || "",
        switcherSummary: summary?.textContent?.trim() || "",
        productPathText: productPath?.getAttribute("aria-label") || productPath?.textContent?.replace(/\\s+/g, " ").trim() || "",
        productPathChipCount: document.querySelectorAll("[data-qa='public-product-path'] > button").length,
        productPathActions: Array.from(document.querySelectorAll("[data-qa='public-product-path'] > button"))
          .map((button) => button.getAttribute("data-qa-public-path-action") || "")
          .filter(Boolean),
        productPathFirstViewportVisible: Boolean(
          productPath &&
          productPathRect &&
          productPathRect.top >= 0 &&
          productPathRect.left >= 0 &&
          productPathRect.right <= document.documentElement.clientWidth &&
          productPathRect.bottom <= window.innerHeight
        ),
        productPathHeight: productPathRect ? Math.round(productPathRect.height) : 0,
        productPathBottom: productPathRect ? Math.round(productPathRect.bottom) : 0,
        productPathAboveTray: Boolean(productPathRect && bottomTrayRect && productPathRect.bottom < bottomTrayRect.top),
        alphaVisible: Boolean(document.querySelector("[data-qa='alpha-city-world']")),
        coverageVisible: Boolean(document.querySelector("[data-qa='county-coverage-shell']")),
        coverageTier: document.querySelector("[data-qa='county-coverage-shell']")?.getAttribute("data-qa-coverage-tier") || "",
        coverageCountySlug: document.querySelector("[data-qa='county-coverage-shell']")?.getAttribute("data-qa-county-slug") || "",
        selectedPlaceTrayVisible: Boolean(document.querySelector("[data-qa='selected-place-tray']")),
        stickerToolsVisible: Boolean(document.querySelector("[data-qa='sticker-tools']")),
        noteInputVisible: Boolean(document.querySelector("[data-qa='note-input']")),
        recoveryVisible: Boolean(recovery),
        recoveryText: recovery?.textContent?.trim() || "",
        recoveryFirstViewportVisible: Boolean(
          recovery &&
          tray &&
          recoveryRect &&
          trayRect &&
          recoveryRect.top >= trayRect.top &&
          recoveryRect.bottom <= trayRect.bottom + 1 &&
          recoveryRect.top >= 0 &&
          recoveryRect.bottom <= window.innerHeight
        ),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        canvasCount: document.querySelectorAll("canvas").length,
      };
    })()`,
  );
}

function assertState(label, state, expected) {
  const failures = [];
  if (state.activeCountySlug !== expected.activeCountySlug) failures.push(`active county ${state.activeCountySlug}`);
  if (expected.activeCountyLabel && state.activeCountyLabel !== expected.activeCountyLabel) {
    failures.push(`active county label ${state.activeCountyLabel}`);
  }
  if (
    !state.switcherSummary.includes("Play Riverside now") ||
    !state.switcherSummary.includes("Browse CA shells") ||
    !state.switcherSummary.includes("Lookup without saving")
  ) {
    failures.push("coverage summary missing");
  }
  if (
    !state.productPathText.includes("Play") ||
    !state.productPathText.includes("Riverside") ||
    !state.productPathText.includes("Browse") ||
    (!state.productPathText.includes("CA shells") && !state.productPathText.includes("California shells")) ||
    !state.productPathText.includes("Lookup") ||
    !state.productPathText.includes("not saved") ||
    !state.productPathText.includes("not coverage proof")
  ) {
    failures.push(`public product path missing: ${state.productPathText}`);
  }
  if (state.productPathChipCount !== 3) failures.push(`public product path chip count ${state.productPathChipCount}`);
  for (const action of ["play", "browse", "lookup"]) {
    if (!state.productPathActions.includes(action)) failures.push(`public product path missing ${action} action`);
  }
  if (!state.productPathFirstViewportVisible) failures.push("public product path is not fully visible in first viewport");
  if (state.productPathHeight > 58) failures.push(`public product path too tall: ${state.productPathHeight}px`);
  if (!state.productPathAboveTray) failures.push("public product path overlaps or crowds the bottom tray");
  if (state.horizontalOverflow) failures.push("horizontal overflow");
  if (expected.mode === "playable") {
    if (!state.alphaVisible) failures.push("playable map missing");
    if (!state.selectedPlaceTrayVisible) failures.push("selected-place tray missing");
    if (!state.stickerToolsVisible) failures.push("sticker tools missing");
    if (!state.noteInputVisible) failures.push("note input missing");
    if (state.canvasCount !== 1) failures.push(`expected one playable canvas, got ${state.canvasCount}`);
  } else {
    if (!state.coverageVisible) failures.push("coverage shell missing");
    if (state.coverageTier !== expected.coverageTier) failures.push(`coverage tier ${state.coverageTier}`);
    if (state.coverageCountySlug !== expected.coverageCountySlug) failures.push(`coverage slug ${state.coverageCountySlug}`);
    if (state.selectedPlaceTrayVisible) failures.push("selected-place tray should be hidden");
    if (state.stickerToolsVisible) failures.push("sticker tools should be hidden");
    if (state.noteInputVisible) failures.push("note input should be hidden");
    if (!state.recoveryVisible) failures.push("recovery action missing");
    if (!state.recoveryText.includes("Riverside/Eastvale")) failures.push("recovery action text missing Riverside/Eastvale");
    if (!state.recoveryFirstViewportVisible) failures.push("recovery action below first viewport");
    if (expected.coverageTier === "L1_COUNTY_SHELL" && state.canvasCount !== 1) failures.push(`expected shell canvas, got ${state.canvasCount}`);
    if (expected.coverageTier === "L0_UNSUPPORTED" && state.canvasCount !== 0) failures.push(`unsupported should not render canvas, got ${state.canvasCount}`);
  }
  if (failures.length > 0) {
    throw new Error(`${label} failed: ${failures.join("; ")}`);
  }
}

async function runViewport({ previewUrl, viewport, screenshotDir, port }) {
  const target = await createTarget(port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  const screenshots = [];

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
    await waitFor(client, `Boolean(document.querySelector("[data-qa='county-switcher']"))`, 10_000);

    const initialState = await readState(client);
    assertState(`${viewport.label} initial Riverside`, initialState, {
      mode: "playable",
      activeCountySlug: "riverside-ca",
      activeCountyLabel: "Riverside",
    });

    await clickProductPath(client, "lookup");
    await delay(150);
    const lookupState = await readState(client);
    assertState(`${viewport.label} lookup action boundary`, lookupState, {
      mode: "playable",
      activeCountySlug: "riverside-ca",
      activeCountyLabel: "Riverside",
    });
    screenshots.push(await captureScreenshot(client, screenshotDir, `riverside-${viewport.label}`));

    await clickProductPath(client, "browse");
    await waitFor(client, `document.querySelector("[data-qa='county-coverage-shell']")?.getAttribute("data-qa-coverage-tier") === "L1_COUNTY_SHELL"`, 10_000);
    const orangeState = await readState(client);
    assertState(`${viewport.label} Orange shell`, orangeState, {
      mode: "coverage",
      activeCountySlug: "orange-ca",
      activeCountyLabel: "Orange",
      coverageTier: "L1_COUNTY_SHELL",
      coverageCountySlug: "orange-ca",
    });
    screenshots.push(await captureScreenshot(client, screenshotDir, `orange-${viewport.label}`));

    await clickCounty(client, "made-up-ca");
    await waitFor(client, `document.querySelector("[data-qa='county-coverage-shell']")?.getAttribute("data-qa-coverage-tier") === "L0_UNSUPPORTED"`, 10_000);
    const unsupportedState = await readState(client);
    assertState(`${viewport.label} unsupported`, unsupportedState, {
      mode: "coverage",
      activeCountySlug: "made-up-ca",
      activeCountyLabel: "Unknown",
      coverageTier: "L0_UNSUPPORTED",
      coverageCountySlug: "made-up-ca",
    });
    screenshots.push(await captureScreenshot(client, screenshotDir, `unsupported-${viewport.label}`));

    await clickProductPath(client, "play");
    await waitFor(client, `Boolean(document.querySelector("[data-qa='alpha-city-world']")) && document.querySelector("[data-qa='county-switcher'] button.is-active")?.getAttribute("data-qa-county-slug") === "riverside-ca"`, 10_000);
    const restoredState = await readState(client);
    assertState(`${viewport.label} restored Riverside`, restoredState, {
      mode: "playable",
      activeCountySlug: "riverside-ca",
      activeCountyLabel: "Riverside",
    });

    const errors = browserErrors(client);
    if (errors.length > 0) throw new Error(`${viewport.label} console errors: ${errors.join(" | ")}`);

    return {
      label: viewport.label,
      ok: true,
      screenshots: screenshots.filter(Boolean),
      states: { initialState, lookupState, orangeState, unsupportedState, restoredState },
    };
  } finally {
    client.close();
  }
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-county-switcher-chrome-"));
  const port = chooseDebugPort();
  const child = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "ignore"] });

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
    } catch {
      if (attempt === 4) return;
      await delay(250);
    }
  }
}

const args = parseArgs(process.argv.slice(2));
const chromePath = findChrome(args.chromePath);
if (!chromePath) {
  throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to run the county switcher verifier.");
}

const chrome = await launchChrome(chromePath);
const results = [];
try {
  for (const viewport of VIEWPORTS) {
    results.push(await runViewport({ previewUrl: args.previewUrl, viewport, screenshotDir: args.screenshotDir, port: chrome.port }));
  }
} finally {
  await stopChrome(chrome);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      previewUrl: args.previewUrl,
      screenshotsEnabled: Boolean(args.screenshotDir),
      results,
    },
    null,
    2,
  ),
);
