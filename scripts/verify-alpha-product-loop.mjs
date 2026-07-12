import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const DEFAULT_VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720 },
  { label: "mobile-390x844", width: 390, height: 844 },
];

function parseArgs(argv) {
  const args = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    screenshotDir: process.env.ATLAS_PRODUCT_LOOP_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
    cameraPreset: "",
    proofOnly: false,
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
        args.screenshotDir = join(tmpdir(), "atlas-alpha-product-loop");
      }
    } else if (value === "--chrome-path") {
      args.chromePath = argv[++index];
    } else if (value === "--camera-preset") {
      args.cameraPreset = argv[++index];
    } else if (value === "--proof-only") {
      args.proofOnly = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return args;
}

function withCameraPreset(url, cameraPreset) {
  if (!cameraPreset) return url;
  const nextUrl = new URL(url);
  nextUrl.searchParams.set("atlasCamera", cameraPreset);
  return nextUrl.toString();
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/token|key|secret|password|signature|auth/i.test(key)) {
        url.searchParams.set(key, "[redacted]");
      }
    }
    return url.toString();
  } catch {
    return "[invalid-url]";
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chooseDebugPort() {
  return 9300 + Math.floor(Math.random() * 500);
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

async function fillInput(client, selector, value) {
  const box = await evaluate(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error("Missing selector: ${selector}");
      const rect = element.getBoundingClientRect();
      element.focus();
      element.select();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    })()`,
  );
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    button: "left",
    clickCount: 1,
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    button: "left",
    clickCount: 1,
  });
  await evaluate(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error("Missing selector: ${selector}");
      element.focus();
      element.select();
      return true;
    })()`,
  );
  await client.send("Input.insertText", { text: value });
  await waitFor(client, `document.querySelector(${JSON.stringify(selector)})?.value === ${JSON.stringify(value)}`, 5_000);
}

async function dragCanvas(client) {
  const box = await evaluate(
    client,
    `(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    })()`,
  );

  if (!box) throw new Error("No canvas found for pan/drag smoke.");

  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;
  const endX = box.x + box.width * 0.58;
  const endY = box.y + box.height * 0.58;

  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: startX, y: startY });
  await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: startX, y: startY, button: "left", clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) {
    await client.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: startX + ((endX - startX) * step) / 6,
      y: startY + ((endY - startY) * step) / 6,
      button: "left",
    });
  }
  await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: endX, y: endY, button: "left", clickCount: 1 });
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

async function captureScreenshot(client, screenshotDir, label) {
  if (!screenshotDir) return null;
  const absoluteDir = resolve(screenshotDir);
  await mkdtemp(join(tmpdir(), "atlas-ignore-")).then((dir) => rm(dir, { recursive: true, force: true }));
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = join(absoluteDir, `alpha-product-loop-${label}.png`);
  await writeFile(path, Buffer.from(screenshot.data, "base64"));
  return path;
}

async function runViewport({ previewUrl, viewport, screenshotDir, chrome, cameraPreset, proofOnly }) {
  const client = new CdpClient(chrome.target.webSocketDebuggerUrl);
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

    await client.send("Page.navigate", { url: withCameraPreset(previewUrl, cameraPreset) });
    await waitFor(client, `document.readyState === "complete"`, 20_000);
    await waitFor(client, `Boolean(document.querySelector("[data-qa='alpha-city-world']"))`, 20_000);
    await waitFor(client, `Boolean(document.querySelector("[data-qa='selected-place-tray']"))`, 10_000);
    // Pixi appends its canvas after an async app.init(); the pan/zoom smoke
    // and canvas assertions need it mounted.
    await waitFor(client, `document.querySelectorAll("canvas").length >= 1`, 20_000);

    const initial = await readState(client);
    if (proofOnly) {
      await delay(500);
      const errors = readBrowserErrors(client);
      const screenshotPath = await captureScreenshot(client, screenshotDir, viewport.label);
      assertCameraProofResult(viewport.label, initial, errors, cameraPreset);

      return {
        label: viewport.label,
        viewport: { width: viewport.width, height: viewport.height },
        ok: true,
        proofOnly: true,
        state: initial,
        consoleErrors: errors,
        screenshotPath,
      };
    }

    await clickSelector(client, "[data-qa='zoom-in-button']");
    await clickSelector(client, "[data-qa='zoom-out-button']");
    await dragCanvas(client);
    await clickSelector(client, "[data-qa='sticker-mode-idea']");
    await clickSelector(client, "[data-qa='drop-sticker-button']");

    const noteText = `QA ${viewport.label} chat note`;
    await fillInput(client, "[data-qa='note-input']", noteText);
    await waitFor(client, `document.querySelector("[data-qa='save-note-button']")?.disabled === false`, 5_000);
    await clickSelector(client, "[data-qa='save-note-button']");
    await waitFor(
      client,
      `document.querySelector("[data-qa='alpha-city-world']")?.getAttribute("data-qa-latest-note") === ${JSON.stringify(noteText)} &&
       document.querySelector("[data-qa='latest-note']")?.textContent?.includes(${JSON.stringify(noteText)})`,
      10_000,
    );

    const finalState = await readState(client);
    const errors = readBrowserErrors(client);
    const screenshotPath = await captureScreenshot(client, screenshotDir, viewport.label);

    assertViewportResult(viewport.label, initial, finalState, errors);

    return {
      label: viewport.label,
      viewport: { width: viewport.width, height: viewport.height },
      ok: true,
      initial,
      finalState,
      consoleErrors: errors,
      screenshotPath,
    };
  } finally {
    client.close();
  }
}

async function readState(client) {
  return await evaluate(
    client,
    `(() => {
      const shell = document.querySelector("[data-qa='alpha-city-world']");
      if (!shell) throw new Error("Missing alpha city-world shell.");
      const latestNote = document.querySelector("[data-qa='latest-note']");
      const latestRect = latestNote?.getBoundingClientRect();
      const latestNoteInViewport = Boolean(
        latestRect &&
          latestRect.width > 0 &&
          latestRect.height > 0 &&
          latestRect.top >= 0 &&
          latestRect.left >= 0 &&
          latestRect.bottom <= window.innerHeight &&
          latestRect.right <= window.innerWidth
      );
      return {
        selectedPlace: shell.getAttribute("data-qa-selected-place"),
        pinCount: Number(shell.getAttribute("data-qa-pin-count") || 0),
        noteCount: Number(shell.getAttribute("data-qa-note-count") || 0),
        latestNote: shell.getAttribute("data-qa-latest-note") || "",
        boundary: shell.getAttribute("data-qa-session-boundary"),
        cameraPreset: shell.getAttribute("data-qa-camera-preset") || "",
        boundaryText: document.querySelector("[data-qa='session-only-boundary']")?.textContent?.trim() || "",
        selectedPlaceLabel: document.querySelector("[data-qa='selected-place-label']")?.textContent?.trim() || "",
        trayVisible: Boolean(document.querySelector("[data-qa='selected-place-tray']")),
        latestNoteVisible: latestNote?.textContent?.trim() || "",
        latestNoteInViewport,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        canvasCount: document.querySelectorAll("canvas").length,
      };
    })()`,
  );
}

function assertCameraProofResult(label, state, errors, expectedCameraPreset) {
  const failures = [];
  if (!state.trayVisible) failures.push("selected place tray is not visible");
  if (state.canvasCount !== 1) failures.push(`expected one canvas, got ${state.canvasCount}`);
  if (state.horizontalOverflow) failures.push("horizontal overflow detected");
  if (state.boundary !== "session-only") failures.push("chat boundary data hook is wrong");
  if (!state.boundaryText.includes("Pins and notes stay in this chat.")) failures.push("chat boundary copy is missing");
  if (expectedCameraPreset && state.cameraPreset !== expectedCameraPreset) failures.push(`camera preset ${state.cameraPreset || "(none)"}`);
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);

  if (failures.length > 0) {
    throw new Error(`${label} camera proof failed: ${failures.join("; ")}`);
  }
}

function assertViewportResult(label, initial, finalState, errors) {
  const failures = [];
  if (!finalState.trayVisible) failures.push("selected place tray is not visible");
  if (finalState.canvasCount !== 1) failures.push(`expected one canvas, got ${finalState.canvasCount}`);
  if (finalState.horizontalOverflow) failures.push("horizontal overflow detected");
  if (finalState.pinCount <= initial.pinCount) failures.push(`pin count did not increase (${initial.pinCount} -> ${finalState.pinCount})`);
  if (finalState.noteCount <= initial.noteCount) failures.push(`note count did not increase (${initial.noteCount} -> ${finalState.noteCount})`);
  if (!finalState.latestNote) failures.push("latest note data hook is empty");
  if (!finalState.latestNoteVisible.includes(finalState.latestNote)) failures.push("latest note is not visible in the tray");
  if (!finalState.latestNoteInViewport) failures.push("latest note is not visible in the viewport");
  if (finalState.boundary !== "session-only") failures.push("chat boundary data hook is wrong");
  if (!finalState.boundaryText.includes("Pins and notes stay in this chat.")) failures.push("chat boundary copy is missing");
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);

  if (failures.length > 0) {
    throw new Error(`${label} failed: ${failures.join("; ")}`);
  }
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-alpha-product-loop-chrome-"));
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
    windowsHide: true,
  });

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const target = await createTarget(port);
    return { child, port, userDataDir, target };
  } catch (error) {
    child.kill();
    await rm(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

async function closeChrome(chrome) {
  chrome.child.kill();
  await new Promise((resolve) => {
    chrome.child.once("exit", resolve);
    setTimeout(resolve, 1000);
  });
  try {
    await rm(chrome.userDataDir, { recursive: true, force: true });
  } catch (error) {
    if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error?.code)) {
      throw error;
    }
    chrome.cleanupWarning = `${error.code}: ${error.message}`;
  }
}

const startedAt = Date.now();
const args = parseArgs(process.argv.slice(2));
const chromePath = findChrome(args.chromePath);

if (!chromePath) {
  throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to a Chromium-compatible browser executable.");
}

if (args.screenshotDir) {
  await import("node:fs/promises").then(({ mkdir }) => mkdir(resolve(args.screenshotDir), { recursive: true }));
}

let chrome;
const results = [];

try {
  chrome = await launchChrome(chromePath);
  for (const viewport of DEFAULT_VIEWPORTS) {
    const target = await createTarget(chrome.port);
    chrome.target = target;
    results.push(
      await runViewport({
        previewUrl: args.previewUrl,
        viewport,
        screenshotDir: args.screenshotDir,
        chrome,
        cameraPreset: args.cameraPreset,
        proofOnly: args.proofOnly,
      }),
    );
  }
} finally {
  if (chrome) await closeChrome(chrome);
}

const ok = results.every((result) => result.ok);
console.log(
  JSON.stringify(
    {
      ok,
      previewUrl: sanitizeUrl(args.previewUrl),
      chromePath,
      durationMs: Date.now() - startedAt,
      screenshotsEnabled: Boolean(args.screenshotDir),
      cleanupWarning: chrome?.cleanupWarning,
      results,
    },
    null,
    2,
  ),
);

if (!ok) {
  process.exitCode = 1;
}
