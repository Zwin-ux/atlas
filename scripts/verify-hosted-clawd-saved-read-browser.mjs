import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DEFAULT_PREVIEW_URL = "http://127.0.0.1:8787/preview";
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
  for (const viewport of VIEWPORTS) {
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
      update: "postalpha-0.64h-hosted-clawd-saved-read-browser-proof",
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
    screenshotDir: process.env.ATLAS_HOSTED_CLAWD_SAVED_READ_SCREENSHOT_DIR ?? "",
    chromePath: process.env.CHROME_PATH ?? "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") parsed.previewUrl = argv[++index] ?? parsed.previewUrl;
    else if (value === "--screenshots") parsed.screenshotDir = argv[++index] ?? join(tmpdir(), "atlas-hosted-clawd-saved-read");
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
    await injectSavedWidgetState(client);
    await waitFor(client, `Boolean(document.querySelector("[data-qa='hosted-clawd-saved-shelf']"))`, 10_000);
    await delay(450);
    const state = await readState(client);
    const consoleErrors = readBrowserErrors(client);
    const screenshotPath = await captureScreenshot(client, screenshotDir, `hosted-clawd-saved-read-${viewport.label}`);
    assertState(viewport.label, state, consoleErrors);
    return { label: viewport.label, viewport, ok: true, state, consoleErrors, screenshotPath };
  } finally {
    client.close();
  }
}

async function injectSavedWidgetState(client) {
  const stateJson = JSON.stringify(savedWidgetState()).replaceAll("<", "\\u003c");
  await evaluate(
    client,
    `(() => {
      window.dispatchEvent(new CustomEvent("openai:set_globals", {
        detail: { globals: { widgetState: ${stateJson} } }
      }));
      return true;
    })()`,
  );
}

function savedWidgetState() {
  return {
    selectedNodeId: "eastvale",
    selectedDistrictId: "eastvale-district",
    selectedPlaceId: "place-eastvale-core",
    compact: false,
    activeSceneId: "voxel-riverside-eastvale-alpha",
    activeStepId: "county",
    stickerMode: "favorite",
    stickers: [],
    notes: [],
    noteDraft: "",
    hostedClawdOpen: true,
    hostedClawdContext: {
      type: "hostedClawdContext",
      mode: "beta_paid",
      screenState: "active",
      trigger: "map_tray",
      statusLabel: "Active",
      contextLabel: "family dental at Eastvale Core",
      primaryCopy: "Saved items are loaded for this setup.",
      secondaryCopy: "Saved items are linked to this account. New saves follow billing status.",
      sessionBoundary: "Saved-state mode.",
      paymentCopy: "Atlas checks billing before saving.",
      billing: {
        state: "webhook_confirmed",
        subscriptionStatus: "active",
        confirmationSource: "webhook",
        returnUrlGrantsAccess: false,
        paidWrites: "enabled",
        title: "Confirmed",
        detail: "Saving is on for this Clawd.",
        checkoutLabel: "Checkout complete",
        webhookLabel: "Confirmed",
        returnLabel: "Checked",
        portalLabel: "Portal checked",
      },
      primaryAction: {
        kind: "open_saved_campaign",
        label: "Open saved state",
        enabled: true,
      },
      savePreview: [
        { label: "Business", value: "family dental", status: "ready" },
        { label: "Location", value: "Eastvale Core", status: "ready" },
        { label: "Scout report", value: "Save this scout report", status: "ready" },
        { label: "Campaign draft", value: "Save campaign preview draft", status: "ready" },
      ],
      savedState: {
        type: "hostedClawdSavedState",
        clawd: { id: "clawd-eastvale-owner", name: "Eastvale Clawd", status: "active" },
        businessProfile: {
          id: "business-eastvale-dental",
          name: "Eastvale Family Dental",
          businessType: "family dental",
          countySlug: "riverside-ca",
          countyLabel: "Riverside County",
          placeLabel: "Eastvale Core",
        },
        scoutDrops: [
          { id: "scout-2", scoutPreviewId: "scout-preview-2", countySlug: "riverside-ca" },
          { id: "scout-1", scoutPreviewId: "scout-preview-1", countySlug: "riverside-ca" },
        ],
        campaignDrafts: [
          {
            id: "campaign-1",
            campaignPreviewId: "campaign-preview-1",
            summary: "July neighborhood opener",
            status: "draft",
          },
        ],
        subscriptionStatus: "active",
        paidWrites: "enabled",
        readOnlyReason: "none",
      },
      flags: {
        persistenceEnabled: true,
        moneyEnabled: true,
        publicClaimEnabled: false,
      },
      gates: [
        {
          gate: "HUMAN_APPROVAL_BEFORE_PERSISTENCE",
          flag: "ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED",
          approved: true,
          requiredFor: "owner-scoped saved state",
        },
        {
          gate: "HUMAN_APPROVAL_BEFORE_MONEY",
          flag: "ATLAS_HOSTED_CLAWD_MONEY_ENABLED",
          approved: true,
          requiredFor: "test-mode Checkout and saved-state billing",
        },
        {
          gate: "HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM",
          flag: "ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED",
          approved: false,
          requiredFor: "public paid claims",
        },
      ],
      canPersist: true,
      canStartCheckout: false,
      canUsePaidWrites: true,
    },
  };
}

async function readState(client) {
  return await evaluate(
    client,
    `(() => {
      const tray = document.querySelector("[data-qa='hosted-clawd-tray']");
      const shelf = document.querySelector("[data-qa='hosted-clawd-saved-shelf']");
      const shell = document.querySelector("[data-qa='alpha-city-world']");
      const trayRect = tray?.getBoundingClientRect();
      const shelfRect = shelf?.getBoundingClientRect();
      return {
        shell: Boolean(shell),
        tray: Boolean(tray),
        shelf: Boolean(shelf),
        text: shelf?.textContent?.replace(/\\s+/g, " ").trim() || "",
        recordCount: Number(shelf?.getAttribute("data-qa-saved-record-count") || 0),
        readOnly: shelf?.getAttribute("data-qa-saved-read-only") || "",
        hostedState: tray?.getAttribute("data-qa-hosted-state") || "",
        paidWrites: tray?.getAttribute("data-qa-paid-writes") || "",
        noPricingPage: tray?.getAttribute("data-qa-no-pricing-page") || "",
        dashboardShell: tray?.getAttribute("data-qa-dashboard-shell") || "",
        primaryText: document.querySelector("[data-qa='hosted-clawd-primary-action']")?.textContent?.trim() || "",
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
        shelfWithinTray: Boolean(
          trayRect &&
            shelfRect &&
            shelfRect.left >= trayRect.left &&
            shelfRect.right <= trayRect.right + 1 &&
            shelfRect.top >= trayRect.top &&
            shelfRect.bottom <= trayRect.bottom + 1
        ),
      };
    })()`,
  );
}

function assertState(label, state, errors) {
  const failures = [];
  if (!state.shell) failures.push("city-world shell missing");
  if (!state.tray) failures.push("Hosted Clawd tray missing");
  if (!state.shelf) failures.push("saved shelf missing");
  if (state.recordCount < 5) failures.push(`expected at least 5 saved records, got ${state.recordCount}`);
  if (state.readOnly !== "false") failures.push(`expected paid-write readable shelf, got readOnly=${state.readOnly}`);
  if (state.hostedState !== "active") failures.push(`expected active hosted state, got ${state.hostedState}`);
  if (state.paidWrites !== "enabled") failures.push(`expected saving enabled marker, got ${state.paidWrites}`);
  if (state.noPricingPage !== "true") failures.push("pricing-page guard missing");
  if (state.dashboardShell !== "false") failures.push("dashboard-shell guard missing");
  if (!state.text.includes("Saved items")) failures.push("Saved items heading missing");
  if (!state.text.includes("Eastvale Family Dental")) failures.push("business row missing");
  if (!state.text.includes("2 saved Scout Drops")) failures.push("scout summary row missing");
  if (!state.text.includes("1 campaign draft")) failures.push("campaign row missing");
  if (!state.primaryText.includes("Open saved state")) failures.push(`primary action mismatch: ${state.primaryText}`);
  if (state.horizontalOverflow) failures.push("horizontal overflow detected");
  if (!state.trayWithinViewport) failures.push("tray is not fully inside viewport");
  if (!state.shelfWithinTray) failures.push("saved shelf is not inside tray bounds");
  if (errors.length > 0) failures.push(`console errors: ${errors.join(" | ")}`);
  if (failures.length > 0) throw new Error(`${label} Hosted Clawd saved read proof failed: ${failures.join("; ")}`);
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
  return 9600 + Math.floor(Math.random() * 300);
}

async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-hosted-clawd-saved-read-chrome-"));
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
      // Keep polling while the page is still settling.
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
