import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import {
  compileDistrictPlaceAnchorDraftCityWorldScene,
  parseDistrictPlaceAnchorPack,
} from "../packages/core/dist/index.js";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
const DEFAULT_ANCHOR_PACK = "data/district_place_anchor_packs/anaheim-anchors.json";
const VIEWPORTS = [
  { label: "desktop-1280x720", width: 1280, height: 720, cameraPreset: "desktop" },
  { label: "mobile-390x844", width: 390, height: 844, cameraPreset: "mobile" },
  { label: "residential-detail-1280x720", width: 1280, height: 720, cameraPreset: "residential_detail" },
  { label: "residential-detail-mobile-390x844", width: 390, height: 844, cameraPreset: "residential_detail" },
];

function parseArgs(argv) {
  const args = {
    previewUrl: process.env.ATLAS_PREVIEW_URL ?? DEFAULT_PREVIEW_URL,
    anchorPackPath: process.env.ATLAS_ANAHEIM_ANCHOR_PACK ?? DEFAULT_ANCHOR_PACK,
    screenshotDir: process.env.ATLAS_ANAHEIM_DRAFT_SCREENSHOTS ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
    noLabelCrops: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") {
      args.previewUrl = argv[++index];
    } else if (value === "--anchor-pack") {
      args.anchorPackPath = argv[++index];
    } else if (value === "--screenshots") {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        args.screenshotDir = next;
        index += 1;
      } else {
        args.screenshotDir = join(tmpdir(), "atlas-anaheim-draft-scene");
      }
    } else if (value === "--chrome-path") {
      args.chromePath = argv[++index];
    } else if (value === "--no-label-crops") {
      args.noLabelCrops = true;
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
  return 9500 + Math.floor(Math.random() * 500);
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

async function captureScreenshot(client, screenshotDir, label, clip) {
  if (!screenshotDir) return null;
  const absoluteDir = resolve(screenshotDir);
  await mkdir(absoluteDir, { recursive: true });
  const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true, ...(clip ? { clip } : {}) });
  const path = join(absoluteDir, `anaheim-draft-${label}.png`);
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

async function loadDraftToolResult(anchorPackPath) {
  const raw = await readFile(resolve(anchorPackPath), "utf8");
  const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(raw));
  const scene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });
  const sourceNotes = anchorPack.sourceNotes.map((note) => ({
    source: note.source,
    label: note.label,
    attribution: note.attribution,
    ttlSeconds: 60 * 60 * 24 * 365,
  }));

  return {
    structuredContent: {
      type: "countyCoverageSummary",
      countySlug: anchorPack.countySlug,
      countyLabel: "Orange County",
      supported: true,
      coverageTier: "L1_COUNTY_SHELL",
      coverageLabel: "Anaheim preview",
      message: "Anaheim is being prepared as a future playable district. It is not open yet.",
      stateCode: anchorPack.stateCode,
      geoid: anchorPack.countyGeoid,
      playableDistrictCount: 0,
      placeCount: 0,
      districts: [
        {
          label: "Anaheim candidate",
          districtSlug: anchorPack.districtSlug,
          playable: false,
          geoid: anchorPack.districtGeoid,
          coverageTier: "L1_COUNTY_SHELL",
        },
      ],
      sourceNotes,
      limitations: [
        "Draft scenes are internal compiler evidence only.",
        "Anaheim is not playable, provider-normalized, saved, XP-enabled, or automated.",
      ],
      suggestedNextCountySlug: "riverside-ca",
    },
    content: [],
    _meta: {
      coverageShellScene: scene,
      draftScene: {
        visibility: "non_public",
        playable: false,
        countySlug: anchorPack.countySlug,
        districtSlug: anchorPack.districtSlug,
      },
    },
  };
}

async function runViewport({ previewUrl, viewport, toolResult, screenshotDir, port, noLabelCrops }) {
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

    const url = new URL(previewUrl);
    url.searchParams.set("atlasCamera", viewport.cameraPreset);
    await client.send("Page.navigate", { url: url.toString() });
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
    await waitFor(client, `Boolean(document.querySelector("[data-qa='county-coverage-shell']"))`, 15_000);
    await waitFor(client, `document.querySelectorAll("canvas").length === 1`, 15_000);

    const state = await evaluate(
      client,
      `(() => {
        const shell = document.querySelector("[data-qa='county-coverage-shell']");
        const canvas = document.querySelector("canvas");
        const selectedTray = document.querySelector("[data-qa='selected-place-tray']");
        const recoveryAction = document.querySelector("[data-qa='coverage-recovery-action']");
        const boundary = document.querySelector("[data-qa='coverage-boundary']");
        const sourceNote = document.querySelector("[data-qa='coverage-source-note']");
        const tray = document.querySelector("[data-qa='coverage-status-tray']");
        const inFirstViewport = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
        };
        return {
          countySlug: shell?.getAttribute("data-qa-county-slug") || "",
          coverageTier: shell?.getAttribute("data-qa-coverage-tier") || "",
          cameraPreset: shell?.getAttribute("data-qa-camera-preset") || "",
          playableDistrictCount: Number(shell?.getAttribute("data-qa-playable-district-count") || 0),
          placeCount: Number(shell?.getAttribute("data-qa-place-count") || 0),
          statusLabel: document.querySelector("[data-qa='coverage-status-label']")?.textContent?.trim() || "",
          coverageText: document.querySelector("[data-qa='coverage-status-tray']")?.textContent?.trim() || "",
          selectedPlaceTrayVisible: Boolean(selectedTray),
          stickerToolsVisible: Boolean(document.querySelector("[data-qa='sticker-tools']")),
          noteInputVisible: Boolean(document.querySelector("[data-qa='note-input']")),
          recoveryActionVisible: Boolean(recoveryAction),
          recoveryActionInFirstViewport: inFirstViewport(recoveryAction),
          recoveryActionText: recoveryAction?.textContent?.trim() || "",
          boundaryText: boundary?.textContent?.trim() || "",
          boundaryInFirstViewport: inFirstViewport(boundary),
          sourceNoteVisible: Boolean(sourceNote),
          sourceNoteInFirstViewport: inFirstViewport(sourceNote),
          trayHeight: tray?.getBoundingClientRect().height || 0,
          canvasCount: document.querySelectorAll("canvas").length,
          canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          noLabelMode: new URLSearchParams(window.location.search).get("atlasNoLabels") === "1",
        };
      })()`,
    );

    const errors = browserErrors(client);
    const screenshotPath = await captureScreenshot(client, screenshotDir, viewport.label);
    const screenshotBytes = screenshotPath ? (await stat(screenshotPath)).size : 0;
    const cropResults = [];
    if (noLabelCrops) {
      if (!state.noLabelMode) {
        throw new Error(`${viewport.label} requested no-label crops, but atlasNoLabels=1 is not active.`);
      }
      for (const crop of noLabelCropSpecs(viewport.label, viewport.width, viewport.height)) {
        const cropPath = await captureScreenshot(client, screenshotDir, crop.label, crop.clip);
        cropResults.push({
          label: crop.label,
          anchor: crop.anchor,
          screenshotPath: cropPath,
          screenshotBytes: cropPath ? (await stat(cropPath)).size : 0,
        });
      }
    }
    assertDraftState(viewport.label, state, errors, screenshotBytes, viewport.cameraPreset);

    return {
      label: viewport.label,
      ok: true,
      viewport: { width: viewport.width, height: viewport.height },
      cameraPreset: viewport.cameraPreset,
      state,
      consoleErrors: errors,
      screenshotBytes,
      screenshotPath,
      noLabelCrops: cropResults,
    };
  } finally {
    client.close();
  }
}

function noLabelCropSpecs(label, viewportWidth, viewportHeight) {
  const scale = 1;
  if (label === "mobile-390x844") {
    return [
      {
        label: "no-label-anchor-1-mobile-390x844",
        anchor: "Anaheim Convention Center",
        clip: { x: 35, y: 310, width: 330, height: 155, scale },
      },
      {
        label: "no-label-anchor-2-mobile-390x844",
        anchor: "ARTIC / Angel Stadium area",
        clip: { x: 10, y: 410, width: 370, height: 190, scale },
      },
    ];
  }
  if (label === "residential-detail-mobile-390x844") {
    return [
      {
        label: "no-label-anchor-1-detail-mobile-390x844",
        anchor: "Anaheim Convention Center",
        clip: { x: 4, y: 372, width: Math.min(382, viewportWidth - 8), height: 178, scale },
      },
      {
        label: "no-label-anchor-2-detail-mobile-390x844",
        anchor: "ARTIC / Angel Stadium area",
        clip: { x: 4, y: 372, width: Math.min(382, viewportWidth - 8), height: 228, scale },
      },
    ];
  }
  if (label === "residential-detail-1280x720") {
    return [
      {
        label: "no-label-anchor-1",
        anchor: "Anaheim Convention Center",
        clip: { x: 430, y: 315, width: 440, height: 215, scale },
      },
      {
        label: "no-label-anchor-2",
        anchor: "ARTIC / Angel Stadium area",
        clip: { x: 300, y: 415, width: 555, height: 255, scale },
      },
    ];
  }
  return [
    {
      label: "no-label-anchor-1-desktop-1280x720",
      anchor: "Anaheim Convention Center",
      clip: { x: Math.max(0, viewportWidth * 0.36), y: 250, width: 420, height: 190, scale },
    },
    {
      label: "no-label-anchor-2-desktop-1280x720",
      anchor: "ARTIC / Angel Stadium area",
      clip: { x: Math.max(0, viewportWidth * 0.24), y: 375, width: 555, height: 275, scale },
    },
  ];
}

function assertDraftState(label, state, errors, screenshotBytes, expectedCameraPreset) {
  const failures = [];
  if (state.countySlug !== "orange-ca") failures.push(`wrong county slug: ${state.countySlug}`);
  if (state.coverageTier !== "L1_COUNTY_SHELL") failures.push(`wrong tier: ${state.coverageTier}`);
  if (state.cameraPreset !== expectedCameraPreset) failures.push(`wrong camera preset: ${state.cameraPreset || "(none)"}`);
  if (state.playableDistrictCount !== 0) failures.push(`draft claims playable districts: ${state.playableDistrictCount}`);
  if (state.placeCount !== 0) failures.push(`draft claims public places: ${state.placeCount}`);
  if (!state.statusLabel.includes("Anaheim preview")) failures.push(`wrong status label: ${state.statusLabel}`);
  if (!state.coverageText.includes("not open yet")) failures.push("non-public boundary copy is missing");
  if (state.selectedPlaceTrayVisible) failures.push("selected-place tray should not show for draft scenes");
  if (state.stickerToolsVisible) failures.push("sticker tools should not show for draft scenes");
  if (state.noteInputVisible) failures.push("note input should not show for draft scenes");
  if (!state.recoveryActionVisible || !state.recoveryActionText.includes("Riverside/Eastvale")) {
    failures.push("recovery action is missing or does not point to Riverside/Eastvale");
  }
  if (label.includes("mobile") && !state.recoveryActionInFirstViewport) {
    failures.push("mobile recovery action is not visible in the first viewport");
  }
  const hasBoundaryCopy = state.boundaryText.includes("no live local data") || state.boundaryText.includes("No saves");
  if (label.includes("mobile") && (!hasBoundaryCopy || !state.boundaryInFirstViewport)) {
    failures.push("mobile boundary copy is not visible in the first viewport");
  }
  if (label.includes("mobile") && (!state.sourceNoteVisible || !state.sourceNoteInFirstViewport)) {
    failures.push("mobile source note is not visible in the first viewport");
  }
  if (state.canvasCount !== 1) failures.push(`expected one draft canvas, got ${state.canvasCount}`);
  if (state.canvasSize?.width <= 0 || state.canvasSize?.height <= 0) failures.push("draft canvas has invalid dimensions");
  if (screenshotBytes > 0 && screenshotBytes < 2_000) failures.push(`draft screenshot is unexpectedly small: ${screenshotBytes} bytes`);
  if (state.horizontalOverflow) failures.push("horizontal overflow detected");
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);

  if (failures.length > 0) {
    throw new Error(`${label} failed: ${failures.join("; ")}`);
  }
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-anaheim-draft-scene-chrome-"));
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
    } catch {
      await delay(250);
    }
  }
}

const args = parseArgs(process.argv.slice(2));
const chromePath = findChrome(args.chromePath);

if (!chromePath) {
  throw new Error("Could not find Chrome or Edge. Set CHROME_PATH to run the Anaheim draft scene verifier.");
}

const toolResult = await loadDraftToolResult(args.anchorPackPath);
const chrome = await launchChrome(chromePath);
const results = [];

try {
  for (const viewport of VIEWPORTS) {
    results.push(
      await runViewport({
        previewUrl: args.previewUrl,
        viewport,
        toolResult,
        screenshotDir: args.screenshotDir,
        port: chrome.port,
        noLabelCrops: args.noLabelCrops,
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
      anchorPackPath: args.anchorPackPath,
      countySlug: toolResult.structuredContent.countySlug,
      districtSlug: toolResult.structuredContent.districts[0]?.districtSlug,
      coverageTier: toolResult.structuredContent.coverageTier,
      playableDistrictCount: toolResult.structuredContent.playableDistrictCount,
      placeCount: toolResult.structuredContent.placeCount,
      screenshotsEnabled: Boolean(args.screenshotDir),
      results,
    },
    null,
    2,
  ),
);
