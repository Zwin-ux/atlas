#!/usr/bin/env node
// Captures Atlas marketing screenshots from the local production emulator.
// Default base: http://127.0.0.1:8787. Start the server first with:
//   PORT=8787 node node_modules/tsx/dist/cli.mjs server/src/index.ts
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import {
  delay,
  evaluate,
  findChrome,
  waitForJson,
  waitFor,
} from "./lib/cdp.mjs";

const OUTPUT_DIR = "site/assets";
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, mobile: true, deviceScaleFactor: 1 },
};

const CAPTURES = [
  capture("riverside-ca", "desktop", "light", false),
  capture("riverside-ca", "desktop", "dark", false),
  capture("riverside-ca", "mobile", "light", false),
  capture("riverside-ca", "mobile", "dark", false),
  capture("miami-dade-fl", "desktop", "light", true),
  capture("miami-dade-fl", "mobile", "light", true),
  capture("summit-co", "desktop", "light", true),
  capture("summit-co", "mobile", "light", true),
  capture("loving-tx", "desktop", "light", true),
  capture("loving-tx", "mobile", "light", true),
  capture("apache-az", "desktop", "light", true),
  capture("apache-az", "mobile", "light", true),
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);
  await preflightEmulator(base);

  const chromePath = findChrome(args.chromePath);
  if (!chromePath) {
    throw new Error("Could not find Chrome or Edge. Set CHROME_PATH or pass --chrome-path.");
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = [];
  let source = "live-cdp";
  let warning = null;
  let chrome;
  try {
    try {
      chrome = await launchMarketingChrome(chromePath);
      for (const spec of CAPTURES) {
        files.push(await captureShot({ chrome, base, spec }));
      }
    } finally {
      if (chrome) await stopMarketingChrome(chrome);
    }
  } catch (error) {
    warning = `Live CDP capture failed; copied existing emulator audit captures instead. Detail: ${errorMessage(error)}`;
    source = "audit-fallback";
    files.length = 0;
    for (const spec of CAPTURES) {
      files.push(await copyAuditFallback(spec));
    }
  }

  const report = {
    ok: true,
    base,
    source,
    ...(warning ? { warning } : {}),
    outputDir: OUTPUT_DIR,
    files,
  };
  console.log(JSON.stringify(report, null, 2));
}

async function copyAuditFallback(spec) {
  const sourcePath = `artifacts/emulator/audit/${spec.filename}`;
  const outputPath = `${OUTPUT_DIR}/${spec.filename}`;
  normalizePngWithFfmpeg(sourcePath, outputPath, spec.expected);
  const file = await assertNonEmpty(outputPath);
  const bytes = await readFileBytes(outputPath);
  const image = readPngSize(bytes);
  return {
    file: outputPath,
    bytes: file.size,
    width: image.width,
    height: image.height,
    county: spec.county,
    viewport: spec.viewport,
    theme: spec.theme,
    draft: spec.draft,
    source: sourcePath,
  };
}

function normalizePngWithFfmpeg(sourcePath, outputPath, expected) {
  const filter = `scale=${expected.width}:${expected.height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${expected.width}:${expected.height}:(ow-iw)/2:(oh-ih)/2:color=0x11110f`;
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-hide_banner", "-loglevel", "error", "-i", sourcePath, "-vf", filter, "-frames:v", "1", outputPath],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.error?.message || `exit ${result.status}`;
    throw new Error(`ffmpeg could not normalize ${sourcePath}: ${detail}`);
  }
}

function parseArgs(argv) {
  const args = {
    base: process.env.ATLAS_MARKETING_CAPTURE_BASE ?? process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787",
    chromePath: process.env.CHROME_PATH ?? "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url" || value === "--base") args.base = requireArgValue(argv, ++index, value);
    else if (value === "--chrome-path") args.chromePath = requireArgValue(argv, ++index, value);
    else if (value === "--json-only") {
      // Kept for parity with the verifier harnesses.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return args;
}

function requireArgValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function normalizeBase(value) {
  return new URL(value).origin;
}

function capture(county, viewport, theme, draft) {
  return {
    county,
    viewport,
    theme,
    draft,
    filename: `${county}-${viewport}-${theme}.png`,
    expected: {
      width: VIEWPORTS[viewport].width,
      height: VIEWPORTS[viewport].height,
    },
  };
}

async function preflightEmulator(base) {
  const url = new URL("/emulator", base).toString();
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (response.ok) return;
    throw new Error(`GET ${url} returned HTTP ${response.status}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Atlas emulator is not reachable at ${url}. Start the local server on :8787 first, or pass --base to a running fallback port. Detail: ${detail}`,
    );
  }
}

async function captureShot({ chrome, base, spec }) {
  let client;
  let stage = "creating target";
  try {
    client = await createMarketingTarget(chrome.port);
    stage = "enabling CDP domains";
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Inspector.enable");
    stage = "setting viewport";
    await setViewport(client, spec.viewport);
    stage = "navigating emulator";
    await client.send("Page.navigate", { url: emulatorUrl(base, spec) });
    stage = "waiting for document";
    await waitFor(client, `document.readyState === "complete"`, 20_000);
    stage = "waiting for emulator delivery";
    await waitForEmulatorDelivered(client, 60_000);
    stage = "waiting for widget document";
    await waitForInnerDocument(client);
    stage = "waiting for fullscreen frame";
    await waitFor(client, `document.querySelector("#frame-box")?.classList.contains("fullscreen")`, 20_000);
    await delay(900);

    stage = "capturing screenshot";
    const result = await client.send("Page.captureScreenshot", { format: "png" }, 120_000);
    const buffer = Buffer.from(result.data, "base64");
    const image = readPngSize(buffer);
    if (image.width !== spec.expected.width || image.height !== spec.expected.height) {
      throw new Error(
        `${spec.filename} expected ${spec.expected.width}x${spec.expected.height}, got ${image.width}x${image.height}`,
      );
    }

    const path = `${OUTPUT_DIR}/${spec.filename}`;
    await writeFile(path, buffer);
    const file = await assertNonEmpty(path);
    await assertNoConsoleErrors(client, spec);
    return {
      file: path,
      bytes: file.size,
      width: image.width,
      height: image.height,
      county: spec.county,
      viewport: spec.viewport,
      theme: spec.theme,
      draft: spec.draft,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${spec.filename} failed while ${stage}: ${message}`);
  } finally {
    if (client) {
      try {
        await client.closeTarget();
      } catch {
        // Target may already be gone after a renderer failure.
      }
      client.close();
    }
  }
}

async function launchMarketingChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-marketing-chrome-"));
  const port = 9500 + Math.floor(Math.random() * 400);
  const child = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--in-process-gpu",
      "--remote-allow-origins=*",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"], windowsHide: true },
  );
  try {
    await waitForJson(`http://localhost:${port}/json/version`, 15_000);
    return { child, port, userDataDir };
  } catch (error) {
    child.kill();
    await rm(userDataDir, { recursive: true, force: true });
    throw error;
  }
}

async function stopMarketingChrome(chrome) {
  chrome.child.kill();
  await new Promise((resolveExit) => {
    chrome.child.once("exit", resolveExit);
    setTimeout(resolveExit, 1500);
  });
  try {
    await rm(chrome.userDataDir, { recursive: true, force: true });
  } catch {
    // Windows may hold temp profile locks briefly.
  }
}

async function createMarketingTarget(port) {
  const version = await waitForJson(`http://localhost:${port}/json/version`, 10_000);
  const browserUrl = String(version.webSocketDebuggerUrl ?? "").replace("127.0.0.1", "localhost");
  if (!browserUrl) throw new Error("Chrome did not expose a browser websocket URL.");

  const browser = new BrowserCdpClient(browserUrl);
  await browser.connect();
  const target = await browser.send("Target.createTarget", { url: "about:blank" });
  const attached = await browser.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  if (!attached.sessionId) throw new Error("Chrome did not return a target session id.");
  return new TargetCdpClient(browser, attached.sessionId, target.targetId);
}

class BrowserCdpClient {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.socket = null;
  }

  async connect() {
    if (typeof WebSocket !== "function") throw new Error("Node runtime with global WebSocket required.");
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("message", (event) => this.handle(event.data));
    this.socket.addEventListener("close", () => this.failAllPending(new Error("CDP socket closed")));
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", rejectOpen, { once: true });
    });
  }

  send(method, params = {}, timeoutMs = 30_000, sessionId = undefined) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return new Promise((resolveSend, rejectSend) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rejectSend(new Error(`CDP request timed out after ${timeoutMs}ms: ${method}`));
        }
      }, timeoutMs);
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend, timer });
    });
  }

  handle(raw) {
    const message = JSON.parse(raw);
    if (message.id && this.pending.has(message.id)) {
      const { resolve: resolveSend, reject: rejectSend, timer } = this.pending.get(message.id);
      clearTimeout(timer);
      this.pending.delete(message.id);
      message.error ? rejectSend(new Error(message.error.message)) : resolveSend(message.result);
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

  close() {
    this.failAllPending(new Error("CDP client closed"));
    this.socket?.close();
  }
}

class TargetCdpClient {
  constructor(browser, sessionId, targetId) {
    this.browser = browser;
    this.sessionId = sessionId;
    this.targetId = targetId;
  }

  get events() {
    return this.browser.events.filter((event) => event.sessionId === this.sessionId);
  }

  send(method, params = {}, timeoutMs = 30_000) {
    return this.browser.send(method, params, timeoutMs, this.sessionId);
  }

  async closeTarget() {
    await this.browser.send("Target.closeTarget", { targetId: this.targetId }).catch(() => {});
  }

  close() {
    this.browser.close();
  }
}

async function setViewport(client, viewportKey) {
  const viewport = VIEWPORTS[viewportKey];
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
}

function emulatorUrl(base, spec) {
  const url = new URL("/emulator", base);
  url.searchParams.set("county", spec.county);
  url.searchParams.set("draft", spec.draft ? "1" : "0");
  url.searchParams.set("viewport", spec.viewport);
  url.searchParams.set("theme", spec.theme);
  return url.toString();
}

async function waitForEmulatorDelivered(client, timeoutMs) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    last = await emulatorSnapshot(client).catch(() => null);
    if (last?.state === "delivered" && Array.isArray(last.errors) && last.errors.length === 0) return last;
    if (last?.state === "error") break;
    await delay(200);
  }
  const errors = Array.isArray(last?.errors) ? last.errors.join(" | ") : "none";
  throw new Error(`Timed out waiting for emulator delivery; state=${last?.state ?? "missing"}; errors=${errors}`);
}

function emulatorSnapshot(client) {
  return evaluate(client, `(() => {
    const h = window.__ATLAS_EMULATOR__;
    if (!h) return null;
    return { state: h.state, errors: Array.isArray(h.errors) ? [...h.errors] : [] };
  })()`);
}

async function waitForInnerDocument(client) {
  await waitFor(
    client,
    `Boolean(document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document?.body)`,
    15_000,
  );
}

async function assertNonEmpty(path) {
  const file = await stat(path);
  if (file.size <= 0) throw new Error(`${path} is empty.`);
  return file;
}

function readFileBytes(path) {
  return readFile(path);
}

async function assertNoConsoleErrors(client, spec) {
  const errors = client.events
    .filter((event) => {
      if (event.method === "Runtime.consoleAPICalled") return event.params?.type === "error";
      if (event.method === "Log.entryAdded") return event.params?.entry?.level === "error";
      return false;
    })
    .map((event) => {
      if (event.method === "Runtime.consoleAPICalled") {
        return (event.params?.args ?? [])
          .map((arg) => arg.value ?? arg.unserializableValue ?? arg.description ?? arg.type)
          .filter(Boolean)
          .join(" ");
      }
      return event.params?.entry?.text ?? event.params?.entry?.url ?? "Log.entryAdded error";
    })
    .filter(Boolean);
  if (errors.length > 0) {
    throw new Error(`${spec.filename} console errors: ${errors.slice(0, 3).join(" | ")}`);
  }
}

function readPngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Screenshot is not a PNG.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
