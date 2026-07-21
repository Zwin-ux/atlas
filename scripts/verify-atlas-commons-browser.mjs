import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  CdpClient,
  createTarget,
  delay,
  evaluate,
  findChrome,
  launchChrome,
  stopChrome,
  waitFor,
} from "./lib/cdp.mjs";

const UPDATE_ID = "postalpha-0.81d-atlas-commons-map-radar";
const VIEWPORTS = [
  { label: "desktop-outer-1360x900-inner-1280x720", emulator: "desktop", outerWidth: 1360, outerHeight: 900, innerWidth: 1280, innerHeight: 720 },
  { label: "mobile-outer-430x1000-inner-390x844", emulator: "mobile", outerWidth: 430, outerHeight: 1000, innerWidth: 390, innerHeight: 844 },
];

const args = parseArgs(process.argv.slice(2));
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome. Set CHROME_PATH to a Chromium-compatible browser.");
if (args.screenshotDir) await mkdir(resolve(args.screenshotDir), { recursive: true });

let chrome;
const results = [];
try {
  chrome = await launchChrome(chromePath);
  for (const viewport of VIEWPORTS) {
    const target = await createTarget(chrome.port);
    results.push(await verifyViewport(target, viewport));
  }
} finally {
  if (chrome) await stopChrome(chrome);
}

const ok = results.every((result) => result.ok);
console.log(JSON.stringify({ ok, update: UPDATE_ID, url: safeUrl(args.baseUrl), results }, null, 2));
if (!ok) process.exitCode = 1;

async function verifyViewport(target, viewport) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.outerWidth,
      height: viewport.outerHeight,
      deviceScaleFactor: 1,
      mobile: viewport.emulator === "mobile",
    });
    await client.send("Page.navigate", { url: emulatorUrl(args.baseUrl, viewport.emulator) });
    await waitFor(client, `document.readyState === "complete"`, 20_000);
    await waitFor(client, innerExpression(`Boolean(doc.querySelector('[data-qa="public-note-selected"]'))`), 25_000);
    await delay(250);

    const initial = await readState(client);
    const beforeNext = initial.selectedNoteText;
    await evaluate(client, innerExpression(`(() => {
      const next = doc.querySelector('[data-qa="public-note-next"]');
      if (!next) return false;
      next.click();
      return true;
    })()`));
    await waitFor(client, innerExpression(`doc.querySelector('[data-qa="public-note-selected"]')?.textContent !== ${JSON.stringify(beforeNext)}`), 5_000);
    const cycled = await readState(client);

    await evaluate(client, innerExpression(`(() => {
      const open = doc.querySelector('[data-qa="open-public-note-composer"]');
      if (!open) return false;
      open.click();
      return true;
    })()`));
    await waitFor(client, innerExpression(`Boolean(doc.querySelector('[data-qa="public-note-input"]'))`), 5_000);
    await evaluate(client, innerExpression(`(() => {
      const input = doc.querySelector('[data-qa="public-note-input"]');
      if (!input) return false;
      const view = doc.defaultView;
      const setter = view && Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, "value")?.set;
      if (!view || !setter) return false;
      setter.call(input, "Shade reaches the west benches first after three.");
      input.dispatchEvent(new view.Event("input", { bubbles: true }));
      return true;
    })()`));
    await waitFor(client, innerExpression(`doc.querySelector('[data-qa="review-public-note"]')?.disabled === false`), 5_000);
    await evaluate(client, innerExpression(`(() => {
      const review = doc.querySelector('[data-qa="review-public-note"]');
      if (!review) return false;
      review.click();
      return true;
    })()`));
    await waitFor(client, innerExpression(`Boolean(doc.querySelector('[data-qa="post-public-note"]'))`), 5_000);
    const reviewed = await readState(client);

    const errors = browserErrors(client);
    const blockers = assertions(viewport, initial, cycled, reviewed, errors);
    const screenshotPath = args.screenshotDir ? await capture(client, viewport.label) : undefined;
    return { label: viewport.label, ok: blockers.length === 0, blockers, initial, cycledNoteChanged: cycled.selectedNoteText !== beforeNext, reviewed, errors, screenshotPath };
  } catch (error) {
    return { label: viewport.label, ok: false, blockers: [error instanceof Error ? error.message : String(error)] };
  } finally {
    client.close();
  }
}

async function readState(client) {
  return evaluate(client, innerExpression(`(() => {
    const root = doc.documentElement;
    const map = doc.querySelector('.city-world-map-surface')?.getBoundingClientRect();
    const tray = doc.querySelector('[data-qa="selected-place-tray"]')?.getBoundingClientRect();
    const actionButtons = Array.from(doc.querySelectorAll(
      '.city-world-commons-controls button, .city-world-tray.is-commons-strip button, .city-world-place-navigator-toggle'
    )).map((button) => {
      const rect = button.getBoundingClientRect();
      return { label: button.textContent?.trim() ?? '', width: rect.width, height: rect.height };
    });
    return {
      clientWidth: root.clientWidth,
      clientHeight: root.clientHeight,
      scrollWidth: root.scrollWidth,
      selectedNoteCount: doc.querySelectorAll('[data-qa="public-note-selected"]').length,
      publicFeedCount: doc.querySelectorAll('[data-qa="public-note-list"]').length,
      selectedNoteText: doc.querySelector('[data-qa="public-note-selected"]')?.textContent ?? '',
      composerOpen: Boolean(doc.querySelector('[data-qa="public-note-input"]')),
      confirmationVisible: Boolean(doc.querySelector('[data-qa="post-public-note"]')),
      hotPressed: doc.querySelector('[data-qa="commons-sort-hot"]')?.getAttribute('aria-pressed'),
      newPresent: Boolean(doc.querySelector('[data-qa="commons-sort-new"]')),
      noteCount: Number(doc.querySelector('[data-qa="alpha-city-world"]')?.getAttribute('data-qa-note-count') ?? 0),
      trayHeight: tray?.height ?? 0,
      visibleMapRatio: tray && map ? 1 - (tray.width * tray.height) / (map.width * map.height) : 0,
      actionsAtLeast44: actionButtons.every((button) => button.width >= 44 && button.height >= 44),
    };
  })()`));
}

function assertions(viewport, initial, cycled, reviewed, errors) {
  const blockers = [];
  if (initial.selectedNoteCount !== 1) blockers.push(`Expected one selected public note; got ${initial.selectedNoteCount}.`);
  if (initial.publicFeedCount !== 0) blockers.push("Public mode rendered a feed list instead of one selected note.");
  if (initial.noteCount < 2) blockers.push("Public demo notes did not reach the map presentation.");
  if (initial.hotPressed !== "true" || !initial.newPresent) blockers.push("HOT/NEW sort controls are not ready on first paint.");
  if (cycled.selectedNoteText === initial.selectedNoteText) blockers.push("Next did not cycle the selected public note.");
  if (!reviewed.composerOpen || !reviewed.confirmationVisible) blockers.push("Explicit public-post review did not reach confirmation.");
  if (initial.scrollWidth > initial.clientWidth) blockers.push(`Horizontal overflow: ${initial.scrollWidth}px > ${initial.clientWidth}px.`);
  if (initial.clientWidth !== viewport.innerWidth || initial.clientHeight !== viewport.innerHeight) {
    blockers.push(`Inner emulator viewport ${initial.clientWidth}x${initial.clientHeight} did not match ${viewport.innerWidth}x${viewport.innerHeight}.`);
  }
  if (viewport.emulator === "mobile") {
    if (initial.visibleMapRatio < 0.78) blockers.push(`Visible mobile map ratio ${initial.visibleMapRatio.toFixed(3)} is below 0.78.`);
    if (!initial.actionsAtLeast44) blockers.push("One or more mobile note actions are smaller than 44x44.");
  }
  if (errors.length > 0) blockers.push(`Browser errors: ${errors.join(" | ")}`);
  return blockers;
}

function innerExpression(expression) {
  return `(() => {
    const frame = document.querySelector('[data-qa="emulator-frame"]');
    const doc = frame?.contentDocument;
    if (!doc) return false;
    return ${expression};
  })()`;
}

function browserErrors(client) {
  return client.events
    .filter((event) => event.method === "Runtime.exceptionThrown" || (event.method === "Log.entryAdded" && event.params?.entry?.level === "error"))
    .map((event) => event.params?.exceptionDetails?.text ?? event.params?.entry?.text ?? "browser error")
    .slice(0, 20);
}

async function capture(client, label) {
  const result = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const path = resolve(args.screenshotDir, `atlas-commons-${label}.png`);
  await writeFile(path, Buffer.from(result.data, "base64"));
  return path;
}

function emulatorUrl(baseUrl, viewport) {
  const url = new URL("/emulator", baseUrl);
  url.searchParams.set("county", "riverside-ca");
  url.searchParams.set("viewport", viewport);
  url.searchParams.set("theme", "light");
  url.searchParams.set("commons", "demo");
  return url.toString();
}

function parseArgs(argv) {
  const parsed = {
    baseUrl: process.env.ATLAS_COMMONS_BROWSER_BASE_URL ?? "http://127.0.0.1:8787",
    chromePath: process.env.CHROME_PATH ?? "",
    screenshotDir: process.env.ATLAS_COMMONS_BROWSER_SCREENSHOT_DIR ?? "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") continue;
    if (value === "--base") parsed.baseUrl = argv[++index] ?? parsed.baseUrl;
    else if (value === "--chrome-path") parsed.chromePath = argv[++index] ?? parsed.chromePath;
    else if (value === "--screenshots") parsed.screenshotDir = argv[++index] ?? "artifacts/emulator/atlas-commons-browser";
    else throw new Error(`Unknown argument: ${value}`);
  }
  return parsed;
}

function safeUrl(value) {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  return url.toString();
}
