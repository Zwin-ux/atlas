import { spawn } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTarget, findChrome, stopChrome, waitForJson } from "./lib/cdp.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourcePath = resolve(repoRoot, "assets/brand/atlas-icon.svg");
const outputSizes = [512, 256, 128, 64, 32];
const pngSignature = "89504e470d0a1a0a";
const cdpSendTimeoutMs = 30_000;

class BrandCdpClient {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.socket = null;
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("message", (event) => {
      this.handle(event.data).catch((error) => this.failAllPending(error));
    });
    this.socket.addEventListener("close", () => this.failAllPending(new Error("CDP socket closed")));
    await new Promise((resolvePromise, reject) => {
      this.socket.addEventListener("open", resolvePromise, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
  }

  async handle(raw) {
    const message = JSON.parse(await messageText(raw));
    if (message.id && this.pending.has(message.id)) {
      const { resolve: resolvePromise, reject, timer } = this.pending.get(message.id);
      clearTimeout(timer);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolvePromise(message.result);
      return;
    }
    this.events.push(message);
  }

  failAllPending(error) {
    for (const [id, entry] of this.pending) {
      clearTimeout(entry.timer);
      this.pending.delete(id);
      entry.reject(error);
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`CDP request timed out after ${cdpSendTimeoutMs}ms: ${method}`));
      }, cdpSendTimeoutMs);
      this.pending.set(id, { resolve: resolvePromise, reject, timer });
    });
  }

  close() {
    this.failAllPending(new Error("CDP client closed"));
    this.socket?.close();
  }
}

async function messageText(raw) {
  if (typeof raw === "string") return raw;
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");
  if (ArrayBuffer.isView(raw)) return Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8");
  if (typeof raw?.text === "function") return await raw.text();
  return String(raw);
}

function htmlFor(svg, size) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {
      width: ${size}px;
      height: ${size}px;
      margin: 0;
      overflow: hidden;
      background: transparent;
    }
    svg {
      display: block;
      width: ${size}px;
      height: ${size}px;
    }
  </style>
</head>
<body>${svg}</body>
</html>`;
}

function dataUrlFor(html) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function readPngDimensions(buffer) {
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("Rendered output is not a PNG.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function captureIconPng(client, svg, size) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: size,
    height: size,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: size,
    screenHeight: size,
  });
  await client.send("Emulation.setDefaultBackgroundColorOverride", {
    color: { r: 0, g: 0, b: 0, a: 0 },
  });
  await client.send("Page.navigate", { url: dataUrlFor(htmlFor(svg, size)) });
  await client.send("Runtime.evaluate", {
    expression:
      "document.fonts?.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))) ?? true",
    awaitPromise: true,
    returnByValue: true,
  });
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    omitBackground: true,
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
  });
  return Buffer.from(screenshot.data, "base64");
}

const chromePath = findChrome(process.env.CHROME_PATH);
if (!chromePath) {
  throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to a Chromium executable.");
}

const svg = await readFile(sourcePath, "utf8");
const chrome = await launchBrandChrome(chromePath);
console.log(`spawnedChromePid=${chrome.child.pid}`);

let client;
try {
  const target = await createTarget(chrome.port);
  client = new BrandCdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");

  for (const size of outputSizes) {
    const outputPath = resolve(repoRoot, `assets/brand/atlas-icon-${size}.png`);
    const png = await captureIconPng(client, svg, size);
    const dimensions = readPngDimensions(png);
    if (dimensions.width !== size || dimensions.height !== size) {
      throw new Error(`Expected ${size}x${size}, got ${dimensions.width}x${dimensions.height}.`);
    }
    await writeFile(outputPath, png);
    const written = await stat(outputPath);
    if (written.size <= 0) {
      throw new Error(`${relative(repoRoot, outputPath)} was written empty.`);
    }
    console.log(`${relative(repoRoot, outputPath)} ${dimensions.width}x${dimensions.height} ${written.size} bytes`);
  }
} finally {
  client?.close();
  await stopChrome(chrome);
}

async function launchBrandChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-brand-chrome-"));
  const port = 9500 + Math.floor(Math.random() * 400);
  const child = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-allow-origins=*",
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
