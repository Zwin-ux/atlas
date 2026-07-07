#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, statSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const OUT_DIR = resolve("artifacts/product-quality-audit/0.66h");
const SCREEN_DIR = join(OUT_DIR, "screens");
const PREVIEW_URL = process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787/preview";
const VIEWPORTS = [
  { label: "desktop-1280x720-rest", width: 1280, height: 720, mobile: false },
  { label: "mobile-390x844-rest", width: 390, height: 844, mobile: true },
];

class CdpClient {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.id = 0;
    this.pending = new Map();
  }

  async ready() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
      this.socket.addEventListener("message", (event) => this.handleMessage(event.data));
    });
  }

  handleMessage(raw) {
    const message = JSON.parse(raw);
    if (!message.id || !this.pending.has(message.id)) return;
    const pending = this.pending.get(message.id);
    this.pending.delete(message.id);
    clearTimeout(pending.timer);
    if (message.error) pending.reject(new Error(message.error.message));
    else pending.resolve(message.result);
  }

  send(method, params = {}, timeoutMs = 8000) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
    });
  }

  close() {
    this.socket.close();
  }
}

await mkdir(SCREEN_DIR, { recursive: true });

const chromePath = findChrome();
if (!chromePath) throw new Error("No Chrome/Edge executable found.");

const metrics = {
  generatedAt: new Date().toISOString(),
  previewUrl: PREVIEW_URL,
  chromePath,
  payload: await payloadMetrics(),
  sourcePressure: sourcePressureMetrics(),
  viewports: [],
};

let chrome;
try {
  chrome = await launchChrome(chromePath);
  for (const viewport of VIEWPORTS) {
    metrics.viewports.push(await measureViewport(chrome.port, viewport));
  }
} finally {
  if (chrome) await closeChrome(chrome);
}

await writeFile(join(OUT_DIR, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
console.log(JSON.stringify(metrics, null, 2));

async function measureViewport(port, viewport) {
  const target = await createTarget(port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.ready();
  const startedAt = Date.now();
  const result = { label: viewport.label, viewport, errors: [] };
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });
    await client.send("Page.navigate", { url: PREVIEW_URL });
    result.readyStateMs = await waitFor(client, `document.readyState === "complete"`, 15_000, startedAt);
    result.mapShellMs = await waitFor(client, `Boolean(document.querySelector("[data-qa='alpha-city-world']"))`, 15_000, startedAt);
    await delay(500);
    result.page = await evaluateJson(client, pageProbeSource(), 8000);
    result.panFrameTiming = await evaluateJson(client, panProbeSource(), 9000).catch((error) => ({
      status: "unknown",
      reason: String(error.message ?? error),
    }));
    const screenshot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, 10_000);
    const screenshotPath = join(SCREEN_DIR, `${viewport.label}.png`);
    await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
    result.screenshotPath = screenshotPath;
  } catch (error) {
    result.errors.push(String(error.message ?? error));
  } finally {
    client.close();
  }
  return result;
}

function pageProbeSource() {
  return `(() => {
    const canvas = document.querySelector("canvas");
    const nav = performance.getEntriesByType("navigation")[0];
    const styleSheets = [...document.styleSheets].map((sheet) => {
      try { return sheet.cssRules ? sheet.cssRules.length : 0; } catch { return 0; }
    });
    return JSON.stringify({
      nowMs: Math.round(performance.now()),
      domNodes: document.querySelectorAll("*").length,
      canvasCount: document.querySelectorAll("canvas").length,
      canvasRect: canvas ? (() => {
        const rect = canvas.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height), left: Math.round(rect.left), top: Math.round(rect.top) };
      })() : null,
      shell: Boolean(document.querySelector("[data-qa='alpha-city-world']")),
      leftRail: Boolean(document.querySelector(".city-world-left-rail")),
      tray: Boolean(document.querySelector(".city-world-tray")),
      hostedClawdOpenButton: Boolean(document.querySelector("[data-qa='hosted-clawd-open']")),
      navigation: nav ? {
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
        loadEventEndMs: Math.round(nav.loadEventEnd),
        transferSize: nav.transferSize,
        encodedBodySize: nav.encodedBodySize,
        decodedBodySize: nav.decodedBodySize
      } : null,
      cssRuleCount: styleSheets.reduce((sum, count) => sum + count, 0),
      pixiHandleExposed: Boolean(window.__PIXI_APP__ || window.__PIXI__ || window.__PIXI_DEVTOOLS__),
      devicePixelRatio: window.devicePixelRatio,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    });
  })()`;
}

function panProbeSource() {
  return `(async () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return JSON.stringify({ status: "unknown", reason: "no canvas" });
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const frames = [];
    let active = true;
    let last = performance.now();
    function tick(t) {
      frames.push(t - last);
      last = t;
      if (active) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    function fire(type, x, y) {
      canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "touch",
        clientX: x,
        clientY: y,
        buttons: type === "pointerup" ? 0 : 1,
        isPrimary: true
      }));
    }
    fire("pointerdown", cx, cy);
    for (let i = 0; i < 60; i++) {
      fire("pointermove", cx - i * 2, cy + Math.sin(i / 7) * 40);
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
    fire("pointerup", cx - 120, cy);
    await new Promise((resolve) => setTimeout(resolve, 150));
    active = false;
    const samples = frames.slice(2);
    const sorted = samples.slice().sort((a, b) => a - b);
    const avg = samples.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1);
    return JSON.stringify({
      status: "measured",
      frames: samples.length,
      avgMs: Number(avg.toFixed(1)),
      p95Ms: Number((sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(1)),
      maxMs: Number((sorted[sorted.length - 1] ?? 0).toFixed(1)),
      over16_8: samples.filter((value) => value > 16.8).length,
      over33_4: samples.filter((value) => value > 33.4).length
    });
  })()`;
}

async function evaluateJson(client, expression, timeoutMs) {
  const response = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, timeoutMs);
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Runtime exception");
  const value = response.result?.value;
  return typeof value === "string" ? JSON.parse(value) : value;
}

async function waitFor(client, expression, timeoutMs, startedAt) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await client.send("Runtime.evaluate", { expression, returnByValue: true }, 3000);
    if (value.result?.value) return Date.now() - startedAt;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

async function payloadMetrics() {
  const response = await fetch(PREVIEW_URL);
  const text = await response.text();
  const headers = Object.fromEntries(response.headers.entries());
  return {
    previewHtmlBytes: Buffer.byteLength(text),
    responseHeaderContentLength: headers["content-length"] ? Number(headers["content-length"]) : null,
    componentJsBytes: fileSize("web/dist/component.js"),
    componentCssBytes: fileSize("web/dist/component.css"),
  };
}

function sourcePressureMetrics() {
  const css = readIfExists("web/src/styles.css");
  const renderer = readIfExists("web/src/CityWorldRenderer.tsx");
  return {
    stylesCssBytes: Buffer.byteLength(css),
    stylesCssLines: css.split(/\r?\n/).length,
    hostedClawdRuleMentions: count(css, /city-world-hosted-clawd/g),
    backdropFilterMentions: count(css, /backdrop-filter/g),
    boxShadowMentions: count(css, /box-shadow/g),
    gradientMentions: count(css, /gradient\(/g),
    rendererBytes: Buffer.byteLength(renderer),
    rendererLines: renderer.split(/\r?\n/).length,
    requestAnimationFrameMentions: count(renderer, /requestAnimationFrame/g),
    pointerMoveMentions: count(renderer, /pointermove|PointerMove/g),
    pixiFilterMentions: count(renderer, /filters?|Filter/g),
  };
}

function count(value, regex) {
  return (value.match(regex) ?? []).length;
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function fileSize(path) {
  return existsSync(path) ? statSync(path).size : null;
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-quality-measure-chrome-"));
  const port = 9333 + Math.floor(Math.random() * 300);
  const child = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: "ignore" });
  await waitForChrome(port);
  return { child, port, userDataDir };
}

async function closeChrome(chrome) {
  chrome.child.kill();
  await delay(400);
  await rm(chrome.userDataDir, { recursive: true, force: true }).catch(() => {});
}

async function createTarget(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!response.ok) throw new Error(`Chrome target failed: ${response.status}`);
  return response.json();
}

async function waitForChrome(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Chrome did not open its debugging port.");
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
