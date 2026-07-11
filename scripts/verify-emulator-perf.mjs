#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
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
import { US_COUNTY_INDEX, createDeterministicGeneratedDistrictSpec } from "../packages/core/dist/index.js";

const REBUILD_MS_CEILING = 350;
const WORLD_GRAPHICS_CEILING = 1600;
// Reporting threshold mirrors HOST_PAYLOAD_REPORT_CEILING in web/src/emulator/constants.ts.
const HOST_PAYLOAD_REPORT_CEILING = 900_000;
const GENERATED_DRAFT_SPEC_REPORT_CEILING = 10_000;
const REPORT_PATH = "artifacts/emulator/perf-report.json";

const VIEWPORTS = {
  desktop: { width: 1280, height: 720, mobile: false, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, mobile: true, deviceScaleFactor: 3 },
};

const GENERATED_ARCHETYPES = [
  "metro_grid",
  "coastal_grid",
  "desert_basin",
  "mountain_valley",
  "prairie_town",
  "river_town",
];

await main().catch(async (error) => {
  const report = {
    ok: false,
    base: safeDefaultBase(),
    cells: [],
    failures: [errorMessage(error)],
  };
  await writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);
  const countyPlan = resolveCountyPlan(args.counties);
  const viewportKeys = resolveViewportKeys(args.viewport);

  const preflightFailure = await preflightEmulator(base);
  if (preflightFailure) {
    const report = { ok: false, base, cells: [], failures: [preflightFailure] };
    await writeAndPrint(report);
    return;
  }

  const chromePath = findChrome(args.chromePath);
  if (!chromePath) {
    const report = {
      ok: false,
      base,
      cells: [],
      failures: ["Could not find Chrome or Edge. Set CHROME_PATH or pass --chrome-path."],
    };
    await writeAndPrint(report);
    return;
  }

  let chrome;
  try {
    chrome = await launchChrome(chromePath);
  } catch (error) {
    const report = { ok: false, base, cells: [], failures: [errorMessage(error)] };
    await writeAndPrint(report);
    return;
  }

  let cells = [];
  try {
    for (const county of countyPlan) {
      for (const viewport of viewportKeys) {
        cells.push(await runCell({ chrome, base, county, viewport }));
      }
    }
  } finally {
    await stopChrome(chrome);
  }

  const failures = cells.flatMap((cell) => cell.failures.map((failure) => `${cell.county} ${cell.viewport}: ${failure}`));
  await writeAndPrint({ ok: failures.length === 0, base, cells, failures });
}

function parseArgs(argv) {
  const args = {
    base: defaultBase(),
    chromePath: process.env.CHROME_PATH ?? "",
    counties: [],
    viewport: "both",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url") args.base = requireArgValue(argv, ++index, value);
    else if (value === "--chrome-path") args.chromePath = requireArgValue(argv, ++index, value);
    else if (value === "--json-only") { /* json is the only output */ }
    else if (value === "--county") args.counties.push(requireArgValue(argv, ++index, value));
    else if (value === "--viewport") args.viewport = requireArgValue(argv, ++index, value);
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

function requireArgValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function defaultBase() {
  const previewUrl = process.env.ATLAS_PREVIEW_URL;
  if (!previewUrl) return "http://127.0.0.1:8787";
  return new URL(previewUrl).origin;
}

function safeDefaultBase() {
  try {
    return defaultBase();
  } catch {
    return "http://127.0.0.1:8787";
  }
}

function normalizeBase(value) {
  return new URL(value).origin;
}

function resolveViewportKeys(value) {
  if (value === "both") return ["desktop", "mobile"];
  if (value === "desktop" || value === "mobile") return [value];
  throw new Error(`--viewport must be desktop, mobile, or both; got ${value}`);
}

function resolveCountyPlan(countySlugs) {
  const counties = countySlugs.length > 0 ? resolveRequestedCounties(countySlugs) : resolveGeneratedMatrix();
  if (!counties.some((county) => county.county === "riverside-ca")) {
    counties.push({ county: "riverside-ca", archetype: "curated", draft: false });
  }
  return counties;
}

function resolveRequestedCounties(countySlugs) {
  const seen = new Set();
  const counties = [];
  for (const countySlug of countySlugs) {
    if (seen.has(countySlug)) continue;
    seen.add(countySlug);
    counties.push(resolveCountyForSlug(countySlug));
  }
  return counties;
}

function resolveCountyForSlug(countySlug) {
  if (countySlug === "riverside-ca") return { county: countySlug, archetype: "curated", draft: false };
  const county = US_COUNTY_INDEX.find((entry) => entry.countySlug === countySlug);
  if (!county) throw new Error(`County is not indexed: ${countySlug}`);
  const generated = createDeterministicGeneratedDistrictSpec({ county });
  return { county: countySlug, archetype: generated.archetype, draft: true };
}

function resolveGeneratedMatrix() {
  const found = new Map();
  for (const county of US_COUNTY_INDEX) {
    const generated = createDeterministicGeneratedDistrictSpec({ county });
    if (!found.has(generated.archetype)) {
      found.set(generated.archetype, { county: county.countySlug, archetype: generated.archetype, draft: true });
      if (found.size === GENERATED_ARCHETYPES.length) break;
    }
  }
  const missing = GENERATED_ARCHETYPES.filter((archetype) => !found.has(archetype));
  if (missing.length) throw new Error(`Generated county matrix cannot reach archetypes: ${missing.join(", ")}`);
  return GENERATED_ARCHETYPES.map((archetype) => found.get(archetype));
}

async function preflightEmulator(base) {
  const url = new URL("/emulator", base).toString();
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (response.ok) return null;
    return `server not running / bundle missing: GET ${url} returned HTTP ${response.status}`;
  } catch (error) {
    return `server not running / bundle missing: GET ${url} failed: ${errorMessage(error)}`;
  }
}

async function runCell({ chrome, base, county, viewport }) {
  const cell = {
    county: county.county,
    archetype: county.archetype,
    viewport,
    graphics: null,
    rebuildMs: null,
    rebuilds: 0,
    deliveries: [],
    warnings: [],
    failures: [],
  };

  let client;
  try {
    const target = await createTarget(chrome.port);
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await setViewport(client, viewport);
    await client.send("Page.navigate", { url: emulatorUrl(base, county, viewport) });
    await waitFor(client, `document.readyState === "complete"`, 20_000);
    await waitForEmulatorDelivered(client, 60_000);
    await waitForInnerQa(client);
    await delay(800);

    if (county.county === "riverside-ca" && viewport === "desktop") {
      cell.failures.push(...await hoverDoesNotRebuild(client));
    }

    const baseline = await perfSnapshot(client);
    await bigPan(client, 8, 1);
    await delay(900);
    const afterFirstBigPan = await perfSnapshot(client);
    await bigPan(client, 9, -1);
    await delay(900);
    const afterSecondBigPan = await perfSnapshot(client);

    const rebuilds = afterSecondBigPan.rebuilds - baseline.rebuilds;
    const rebuildMsSamples = [];
    if (afterFirstBigPan.rebuilds > baseline.rebuilds) rebuildMsSamples.push(afterFirstBigPan.ms);
    if (afterSecondBigPan.rebuilds > afterFirstBigPan.rebuilds) rebuildMsSamples.push(afterSecondBigPan.ms);
    if (rebuilds > 0 && rebuildMsSamples.length === 0) rebuildMsSamples.push(afterFirstBigPan.ms, afterSecondBigPan.ms);

    cell.graphics = Math.max(afterFirstBigPan.graphics, afterSecondBigPan.graphics);
    cell.rebuilds = rebuilds;
    cell.rebuildMs = rebuilds > 0 ? Math.min(...rebuildMsSamples) : null;

    const handle = await emulatorSnapshot(client);
    cell.deliveries = deliveryPayloads(handle?.deliveries ?? [], county);
    cell.warnings.push(...payloadWarnings(cell.deliveries));

    if (!handle || handle.state !== "delivered") cell.failures.push(`emulator state is ${handle?.state ?? "missing"}, expected delivered`);
    if (handle?.errors?.length) cell.failures.push(`emulator errors: ${handle.errors.join(" | ")}`);
    if (cell.graphics > WORLD_GRAPHICS_CEILING) {
      cell.failures.push(`world holds ${cell.graphics} Graphics (ceiling ${WORLD_GRAPHICS_CEILING})`);
    }
    if (cell.rebuildMs !== null && cell.rebuildMs > REBUILD_MS_CEILING) {
      cell.failures.push(`window rebuild took ${cell.rebuildMs}ms (ceiling ${REBUILD_MS_CEILING}ms)`);
    }
  } catch (error) {
    cell.failures.push(errorMessage(error));
    if (client) {
      try {
        const handle = await emulatorSnapshot(client);
        cell.deliveries = deliveryPayloads(handle?.deliveries ?? [], county);
        cell.warnings.push(...payloadWarnings(cell.deliveries));
        if (handle?.errors?.length) cell.failures.push(`emulator errors: ${handle.errors.join(" | ")}`);
      } catch {
        /* the page may be gone after a CDP or navigation failure */
      }
    }
  } finally {
    // Reviewer patch: dispose the tab, not just the CDP socket — otherwise
    // every cell leaves a live Pixi app running and later cells measure a
    // machine throttled by a pile of background tabs.
    if (client) {
      try {
        await client.send("Page.close");
      } catch {
        /* target may already be gone */
      }
      client.close();
    }
  }

  return cell;
}

async function setViewport(client, viewportKey) {
  const viewport = VIEWPORTS[viewportKey];
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width + 160,
    height: viewport.height + 160,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile,
  });
}

function emulatorUrl(base, county, viewport) {
  const url = new URL("/emulator", base);
  url.searchParams.set("county", county.county);
  url.searchParams.set("draft", county.draft ? "1" : "0");
  url.searchParams.set("viewport", viewport);
  url.searchParams.set("theme", "light");
  return url.toString();
}

async function waitForEmulatorDelivered(client, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const handle = await emulatorSnapshot(client);
    if (handle?.state === "error") {
      throw new Error(`emulator error: ${(handle.errors ?? []).join(" | ") || "unknown error"}`);
    }
    if (handle?.state === "delivered") return handle;
    await delay(200);
  }
  throw new Error("Timed out waiting for __ATLAS_EMULATOR__.state === delivered");
}

async function waitForInnerQa(client) {
  await waitFor(
    client,
    `Boolean(window.__ATLAS_EMULATOR__?.qa?.()?.perf && document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document?.querySelector("canvas"))`,
    20_000,
  );
}

function emulatorSnapshot(client) {
  return evaluate(client, `(() => {
    const h = window.__ATLAS_EMULATOR__;
    if (!h) return null;
    return {
      state: h.state,
      county: h.county,
      viewport: h.viewport,
      theme: h.theme,
      displayMode: h.displayMode,
      deliveries: Array.isArray(h.deliveries) ? h.deliveries.map((delivery) => ({
        tool: delivery.tool,
        resultChars: delivery.resultChars,
        metaChars: delivery.metaChars,
        generatedDraftSceneChars: delivery.generatedDraftSceneChars,
        generatedDraftSpecChars: delivery.generatedDraftSpecChars,
        metaKeys: Array.isArray(delivery.metaKeys) ? [...delivery.metaKeys] : [],
        truncated: delivery.truncated,
      })) : [],
      errors: Array.isArray(h.errors) ? [...h.errors] : [],
    };
  })()`);
}

function perfSnapshot(client) {
  return evaluate(client, `(() => {
    const qa = window.__ATLAS_EMULATOR__?.qa?.();
    if (!qa?.perf) throw new Error("missing inner __ATLAS_QA__.perf");
    const p = qa.perf;
    return {
      rebuilds: p.sceneRebuilds,
      overlays: p.overlayRedraws,
      frames: p.renderedFrames,
      ms: p.lastRebuildMs,
      anim: p.animatedTargetCount(),
      parked: p.loopParked(),
      graphics: p.graphicsCount(),
    };
  })()`);
}

function bigPan(client, id, sign) {
  return evaluate(client, `(() => {
    const frame = document.querySelector("[data-qa='emulator-frame']");
    const inner = frame?.contentWindow;
    const canvas = inner?.document?.querySelector("canvas");
    if (!inner || !canvas) throw new Error("missing inner emulator canvas");
    const Pointer = inner.PointerEvent;
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    canvas.dispatchEvent(new Pointer("pointerdown", { clientX: cx, clientY: cy, bubbles: true, pointerId: ${id} }));
    for (let step = 1; step <= 10; step += 1) {
      canvas.dispatchEvent(new Pointer("pointermove", { clientX: cx - step * 60 * ${sign}, clientY: cy - step * 24 * ${sign}, bubbles: true, pointerId: ${id} }));
    }
    canvas.dispatchEvent(new Pointer("pointerup", { clientX: cx - 600 * ${sign}, clientY: cy - 240 * ${sign}, bubbles: true, pointerId: ${id} }));
    return true;
  })()`);
}

async function hoverDoesNotRebuild(client) {
  const failures = [];
  const beforeHover = await perfSnapshot(client);
  await evaluate(client, `(() => {
    const qa = window.__ATLAS_EMULATOR__?.qa?.();
    const marker = qa?.world?.children?.find((child) => child.label === "markerLayer");
    const hits = marker ? marker.children.filter((child) => child.eventMode === "static") : [];
    if (hits.length < 2) throw new Error("expected interactive place hit targets");
    hits[1].emit("pointerover");
    return hits.length;
  })()`);
  await delay(400);
  await evaluate(client, `(() => {
    const qa = window.__ATLAS_EMULATOR__?.qa?.();
    const marker = qa?.world?.children?.find((child) => child.label === "markerLayer");
    const hits = marker ? marker.children.filter((child) => child.eventMode === "static") : [];
    if (hits.length < 2) throw new Error("expected interactive place hit targets");
    hits[hits.length - 1].emit("pointerover");
    return true;
  })()`);
  await delay(400);
  const afterHover = await perfSnapshot(client);
  if (afterHover.rebuilds !== beforeHover.rebuilds) {
    failures.push(`hover rebuilt the scene: ${beforeHover.rebuilds} -> ${afterHover.rebuilds}`);
  }
  if (afterHover.overlays <= beforeHover.overlays) failures.push("hover did not redraw the focus overlay");
  return failures;
}

function deliveryPayloads(deliveries, county) {
  const expectedSpecChars = county.draft ? generatedDraftSpecCharsForCounty(county.county) : 0;
  return deliveries.map((delivery) => ({
    tool: delivery.tool,
    resultChars: delivery.resultChars,
    metaChars: delivery.metaChars,
    generatedDraftSceneChars: delivery.generatedDraftSceneChars ?? 0,
    generatedDraftSpecChars: delivery.generatedDraftSpecChars ?? (delivery.metaKeys?.includes("generatedDraftSpec") ? expectedSpecChars : 0),
    metaKeys: Array.isArray(delivery.metaKeys) ? delivery.metaKeys : [],
    truncated: Boolean(delivery.truncated),
  }));
}

function payloadWarnings(deliveries) {
  const sceneWarnings = deliveries
    .filter((delivery) => delivery.generatedDraftSceneChars > HOST_PAYLOAD_REPORT_CEILING)
    .map((delivery) => `${delivery.tool} generatedDraftSceneChars ${delivery.generatedDraftSceneChars} exceeds report ceiling ${HOST_PAYLOAD_REPORT_CEILING}`);
  const specWarnings = deliveries
    .filter((delivery) => delivery.generatedDraftSpecChars > GENERATED_DRAFT_SPEC_REPORT_CEILING)
    .map((delivery) => `${delivery.tool} generatedDraftSpecChars ${delivery.generatedDraftSpecChars} exceeds report ceiling ${GENERATED_DRAFT_SPEC_REPORT_CEILING}`);
  return [...sceneWarnings, ...specWarnings];
}

function generatedDraftSpecCharsForCounty(countySlug) {
  const county = US_COUNTY_INDEX.find((entry) => entry.countySlug === countySlug);
  if (!county) return 0;
  return JSON.stringify(createDeterministicGeneratedDistrictSpec({ county })).length;
}

async function writeAndPrint(report) {
  await writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

async function writeReport(report) {
  await mkdir("artifacts/emulator", { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
