#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
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
import { innerCanvasCenter, touchPan, touchPinch, touchTap } from "./lib/touch.mjs";
import { US_COUNTY_INDEX, createDeterministicGeneratedDistrictSpec } from "../packages/core/dist/index.js";

const WORLD_GRAPHICS_CEILING = 1600;
const HOST_PAYLOAD_REPORT_CEILING = 900_000;
const REPORT_DIR = "artifacts/emulator/audit";
const REPORT_JSON_PATH = `${REPORT_DIR}/report.json`;
const REPORT_MD_PATH = `${REPORT_DIR}/REPORT.md`;

const VIEWPORTS = {
  desktop: { width: 1280, height: 720, mobile: false, deviceScaleFactor: 1 },
  // dsf 2, not the iPhone-real 3: headless SwiftShader rasterizes the whole
  // surface in software and at dsf3 the renderer starves (captures and even
  // evaluates time out). Layout, touch semantics, and breakpoints are
  // identical at dsf2 — only screenshot pixel density differs. Real-device
  // GPUs render dsf3 trivially; this is a harness artifact, not product.
  mobile: { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 },
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
  const report = emptyReport(safeDefaultBase(), [
    { county: "audit", viewport: "n/a", theme: "n/a", check: "harness", detail: errorMessage(error) },
  ]);
  await writeReports(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);
  const cellsToRun = resolveAuditCells(args);

  const preflightFailure = await preflightEmulator(base);
  if (preflightFailure) {
    const report = emptyReport(base, [
      { county: "preflight", viewport: "n/a", theme: "n/a", check: "emulator", detail: preflightFailure },
    ]);
    await writeAndPrint(report);
    return;
  }

  const chromePath = findChrome(args.chromePath);
  if (!chromePath) {
    const report = emptyReport(base, [
      {
        county: "preflight",
        viewport: "n/a",
        theme: "n/a",
        check: "chrome",
        detail: "Could not find Chrome or Edge. Set CHROME_PATH or pass --chrome-path.",
      },
    ]);
    await writeAndPrint(report);
    return;
  }

  let chrome;
  try {
    chrome = await launchChrome(chromePath);
  } catch (error) {
    const report = emptyReport(base, [
      { county: "preflight", viewport: "n/a", theme: "n/a", check: "chrome", detail: errorMessage(error) },
    ]);
    await writeAndPrint(report);
    return;
  }

  let cells = [];
  try {
    for (const cellSpec of cellsToRun) {
      cells.push(await runCell({ chrome, base, cellSpec }));
    }
  } finally {
    await stopChrome(chrome);
  }

  await writeAndPrint(buildReport({ base, cells }));
}

function parseArgs(argv) {
  const args = {
    base: defaultBase(),
    chromePath: process.env.CHROME_PATH ?? "",
    counties: [],
    viewport: "both",
    theme: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--url" || value === "--base") args.base = requireArgValue(argv, ++index, value);
    else if (value === "--chrome-path") args.chromePath = requireArgValue(argv, ++index, value);
    else if (value === "--county") args.counties.push(requireArgValue(argv, ++index, value));
    else if (value === "--viewport") args.viewport = requireArgValue(argv, ++index, value);
    else if (value === "--theme") args.theme = requireArgValue(argv, ++index, value);
    else if (value === "--json-only") { /* retained for parity with perf harness */ }
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

function resolveAuditCells(args) {
  const countyPlan = args.counties.length > 0 ? resolveRequestedCounties(args.counties) : [...resolveGeneratedMatrix(), riversideCounty()];
  const viewportKeys = resolveViewportKeys(args.viewport);
  const explicitThemeKeys = args.theme ? resolveThemeKeys(args.theme) : null;
  const cells = [];

  for (const county of countyPlan) {
    for (const viewport of viewportKeys) {
      const themes = explicitThemeKeys ?? defaultThemesForCounty(county);
      for (const theme of themes) {
        cells.push({ ...county, viewport, theme, checksCta: false });
      }
    }
  }

  if (shouldIncludeCtaCell(args)) {
    cells.push({ county: "orange-ca", archetype: "shell", draft: false, viewport: "desktop", theme: "light", checksCta: true });
  }

  return cells;
}

function resolveViewportKeys(value) {
  if (value === "both") return ["desktop", "mobile"];
  if (value === "desktop" || value === "mobile") return [value];
  throw new Error(`--viewport must be desktop, mobile, or both; got ${value}`);
}

function resolveThemeKeys(value) {
  if (value === "both") return ["light", "dark"];
  if (value === "light" || value === "dark") return [value];
  throw new Error(`--theme must be light, dark, or both; got ${value}`);
}

function defaultThemesForCounty(county) {
  if (county.county === "riverside-ca" || county.archetype === "metro_grid") return ["light", "dark"];
  return ["light"];
}

function shouldIncludeCtaCell(args) {
  const viewportKeys = resolveViewportKeys(args.viewport);
  const themeKeys = args.theme ? resolveThemeKeys(args.theme) : ["light", "dark"];
  const countyAllows = args.counties.length === 0 || args.counties.includes("orange-ca");
  return countyAllows && viewportKeys.includes("desktop") && themeKeys.includes("light");
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
  if (countySlug === "riverside-ca") return riversideCounty();
  const county = US_COUNTY_INDEX.find((entry) => entry.countySlug === countySlug);
  if (!county) throw new Error(`County is not indexed: ${countySlug}`);
  const generated = createDeterministicGeneratedDistrictSpec({ county });
  return { county: countySlug, archetype: generated.archetype, draft: true };
}

function riversideCounty() {
  return { county: "riverside-ca", archetype: "curated", draft: false };
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

async function runCell({ chrome, base, cellSpec }) {
  const cell = {
    county: cellSpec.county,
    archetype: cellSpec.archetype,
    draft: cellSpec.draft,
    viewport: cellSpec.viewport,
    theme: cellSpec.theme,
    checks: [],
    screenshot: null,
  };

  let client;
  try {
    const target = await createTarget(chrome.port);
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Inspector.enable"); // surface renderer crashes as events
    await setViewport(client, cellSpec.viewport);
    await client.send("Page.navigate", { url: emulatorUrl(base, cellSpec) });
    await waitFor(client, `document.readyState === "complete"`, 20_000);

    const settled = await waitForEmulatorSettled(client, 45_000);
    addDeliveredCheck(cell, settled);
    if (settled?.state === "delivered") {
      await waitForInnerDocument(client);
      await delay(500);
      await runStructuralChecks(client, cell, cellSpec);
      if (cellSpec.viewport === "mobile") {
        await runMobileChecks(client, cell, cellSpec);
      }
      if (cellSpec.checksCta) {
        await runCtaRoundtripCheck(client, cell);
      }
      await runPayloadChecks(client, cell);
    }
  } catch (error) {
    addCheck(cell, "cell_runtime", "fail", errorMessage(error));
  } finally {
    if (client) {
      addConsoleCheck(client, cell);
      await captureCellScreenshot(client, cell).catch((error) => {
        addCheck(cell, "screenshot", "warn", `screenshot capture failed: ${errorMessage(error)}`);
      });
      try {
        await client.send("Page.close");
      } catch {
        /* target may already be closed */
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

function emulatorUrl(base, cellSpec) {
  const url = new URL("/emulator", base);
  url.searchParams.set("county", cellSpec.county);
  url.searchParams.set("draft", cellSpec.draft ? "1" : "0");
  url.searchParams.set("viewport", cellSpec.viewport);
  url.searchParams.set("theme", cellSpec.theme);
  return url.toString();
}

async function waitForEmulatorSettled(client, timeoutMs) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    last = await emulatorSnapshot(client).catch(() => null);
    if (last?.state === "delivered" || last?.state === "error") return last;
    await delay(200);
  }
  return last ?? { state: "missing", errors: ["Timed out waiting for __ATLAS_EMULATOR__.state === delivered"] };
}

async function waitForInnerDocument(client) {
  await waitFor(
    client,
    `Boolean(document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document?.body)`,
    15_000,
  );
}

function addDeliveredCheck(cell, handle) {
  if (!handle) {
    addCheck(cell, "delivered", "fail", "missing __ATLAS_EMULATOR__ handle");
    return;
  }
  const errors = Array.isArray(handle.errors) ? handle.errors : [];
  if (handle.state !== "delivered") {
    addCheck(cell, "delivered", "fail", `state=${handle.state}; errors=${errors.join(" | ") || "none"}`);
    return;
  }
  if (errors.length > 0) {
    addCheck(cell, "delivered", "fail", `state=delivered but errors=${errors.join(" | ")}`);
    return;
  }
  addCheck(cell, "delivered", "pass", "state=delivered; errors=0");
}

async function runStructuralChecks(client, cell, cellSpec) {
  await addAsyncCheck(cell, "no_horizontal_overflow", async () => {
    const overflow = await innerDocumentMetrics(client);
    if (overflow.scrollWidth <= overflow.clientWidth + 1) {
      return { level: "pass", detail: `scrollWidth=${overflow.scrollWidth}; clientWidth=${overflow.clientWidth}` };
    }
    return { level: "fail", detail: `scrollWidth=${overflow.scrollWidth}; clientWidth=${overflow.clientWidth}` };
  });

  if (cellSpec.draft) {
    await addAsyncCheck(cell, "honesty_banner", async () => {
      const banner = await generatedBoundaryText(client);
      if (!banner.present) return { level: "fail", detail: "missing [data-qa='generated-boundary']" };
      const text = banner.text ?? "";
      if (/generated/i.test(text) && /not real coverage/i.test(text) && /stays in this chat/i.test(text)) {
        return { level: "pass", detail: compactText(text) };
      }
      return { level: "fail", detail: `unexpected copy: ${compactText(text)}` };
    });
  }

  await addAsyncCheck(cell, "canvas_single", async () => {
    const count = await innerCanvasCount(client);
    if (count === 1) return { level: "pass", detail: "canvas count=1" };
    return { level: "fail", detail: `canvas count=${count}` };
  });

  await addAsyncCheck(cell, "graphics_ceiling", async () => {
    const count = await graphicsCount(client);
    if (count <= WORLD_GRAPHICS_CEILING) {
      return { level: "pass", detail: `graphics=${count}; ceiling=${WORLD_GRAPHICS_CEILING}` };
    }
    return { level: "fail", detail: `graphics=${count}; ceiling=${WORLD_GRAPHICS_CEILING}` };
  });
}

async function runMobileChecks(client, cell, cellSpec) {
  await runTouchTargetChecks(client, cell);
  if (cellSpec.county === "riverside-ca") {
    await runTouchTapSelectCheck(client, cell);
  }
  await runTouchPanCheck(client, cell);
  await runTouchPinchCheck(client, cell);
}

async function runTouchPanCheck(client, cell) {
  await addAsyncCheck(cell, "touch_pan", async () => {
    const before = await qaTransformSnapshot(client);
    const center = await innerCanvasCenter(client);
    await touchPan(client, {
      from: { x: center.cx, y: center.cy },
      to: { x: center.cx - 160, y: center.cy - 90 },
    });
    // Contract: streaming rebuilds during a pan (and its inertia coast) must
    // be RATE-BOUNDED, not unbounded — the renderer throttles to one per
    // 250ms (GESTURE_WINDOW_REFRESH_INTERVAL_MS) and defers the rest. The
    // CDP-driven pan spans several intervals, so the assertable truths are:
    // (a) the world moved, (b) the settled total stays bounded, and (c) when
    // more than one rebuild happened, the throttle demonstrably engaged
    // (streamingRefreshDeferred > 0). The pre-throttle storm here measured
    // 3-5 rebuilds with zero deferrals.
    await delay(1600);
    const settled = await qaTransformSnapshot(client);
    const totalDelta = settled.sceneRebuilds - before.sceneRebuilds;
    const firedDelta = settled.streamingRefreshFired - before.streamingRefreshFired;
    const deferredDelta = settled.streamingRefreshDeferred - before.streamingRefreshDeferred;
    const moved = Math.abs(settled.worldX - before.worldX) > 0.5 || Math.abs(settled.worldY - before.worldY) > 0.5;
    if (!moved) {
      return { level: "fail", detail: `world did not move; before=(${before.worldX},${before.worldY}) after=(${settled.worldX},${settled.worldY})` };
    }
    if (totalDelta > 6) {
      return { level: "fail", detail: `settled rebuilds=${totalDelta}; expected <=6 incl. throttled inertia coast` };
    }
    // The invariant is the RATE: the renderer throttles streaming rebuilds to
    // one per 250ms during gestures (4/s), so anything meaningfully above
    // that over the sampled span means the throttle is not engaging. CDP-slow
    // pans legitimately space refreshes >250ms apart with zero deferrals.
    const elapsedSeconds = Math.max(0.001, (settled.t - before.t) / 1000);
    const rebuildRate = totalDelta / elapsedSeconds;
    if (totalDelta > 2 && rebuildRate > 4.5) {
      return { level: "fail", detail: `rebuild rate ${rebuildRate.toFixed(1)}/s over ${elapsedSeconds.toFixed(1)}s (limit 4.5/s) — gesture throttle not engaging (fired=${firedDelta}, deferred=${deferredDelta})` };
    }
    return {
      level: "pass",
      detail: `world moved (${round(before.worldX)},${round(before.worldY)}) -> (${round(settled.worldX)},${round(settled.worldY)}); rebuilds=${totalDelta} @ ${rebuildRate.toFixed(1)}/s, fired=${firedDelta}, deferred=${deferredDelta}`,
    };
  });
}

async function runTouchPinchCheck(client, cell) {
  await addAsyncCheck(cell, "touch_pinch", async () => {
    const before = await qaTransformSnapshot(client);
    const center = await innerCanvasCenter(client);
    await touchPinch(client, { center: { x: center.cx, y: center.cy }, scale: 1.8 });
    await delay(600);
    const after = await qaTransformSnapshot(client);
    if (Math.abs(after.worldScaleX - before.worldScaleX) <= 0.001) {
      return { level: "fail", detail: `world scale unchanged at ${round(after.worldScaleX)}` };
    }
    return { level: "pass", detail: `world scale ${round(before.worldScaleX)} -> ${round(after.worldScaleX)}` };
  });
}

async function runTouchTapSelectCheck(client, cell) {
  await addAsyncCheck(cell, "touch_tap_select", async () => {
    const before = await selectedPlaceLabel(client);
    const candidates = await markerTapCandidates(client);
    if (candidates.length === 0) {
      return { level: "warn", detail: "no visible marker hit target in view" };
    }
    for (const candidate of candidates.slice(0, 8)) {
      await touchTap(client, { x: candidate.x, y: candidate.y });
      await delay(450);
      const after = await selectedPlaceLabel(client);
      if (after && after !== before) {
        return { level: "pass", detail: `selected label changed: ${before || "(empty)"} -> ${after}` };
      }
    }
    return { level: "fail", detail: `selected label did not change after ${Math.min(candidates.length, 8)} marker taps; before=${before || "(empty)"}` };
  });
}

async function runTouchTargetChecks(client, cell) {
  const offenders = await touchTargetOffenders(client);
  if (offenders.length === 0) {
    addCheck(cell, "touch_targets_44", "pass", "all visible [data-qa] buttons are at least 40x40 CSS px");
    return;
  }
  for (const offender of offenders) {
    addCheck(cell, "touch_targets_44", "warn", `${offender.qa} is ${round(offender.width)}x${round(offender.height)} CSS px`);
  }
}

async function runCtaRoundtripCheck(client, cell) {
  await addAsyncCheck(cell, "cta_roundtrip", async () => {
    await evaluate(client, `(() => {
      const frame = document.querySelector("[data-qa='emulator-frame']");
      const doc = frame?.contentWindow?.document;
      const button = doc?.querySelector("[data-qa='coverage-recovery-action']");
      if (!button) throw new Error("missing [data-qa='coverage-recovery-action']");
      button.click();
      return true;
    })()`);
    await waitFor(
      client,
      `(() => {
        const h = window.__ATLAS_EMULATOR__;
        const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
        const label = doc?.querySelector("[data-qa='current-city-map']")?.textContent ?? "";
        return h?.deliveries?.length >= 2 && /riverside/i.test(label);
      })()`,
      20_000,
    );
    const state = await evaluate(client, `(() => {
      const h = window.__ATLAS_EMULATOR__;
      const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
      return {
        deliveries: h?.deliveries?.length ?? 0,
        label: doc?.querySelector("[data-qa='current-city-map']")?.textContent?.replace(/\\s+/g, " ").trim() ?? "",
      };
    })()`);
    return { level: "pass", detail: `deliveries=${state.deliveries}; current-city-map=${state.label}` };
  });
}

async function runPayloadChecks(client, cell) {
  const handle = await emulatorSnapshot(client);
  const deliveries = Array.isArray(handle?.deliveries) ? handle.deliveries : [];
  const offenders = deliveries.filter((delivery) => delivery.generatedDraftSceneChars > HOST_PAYLOAD_REPORT_CEILING);
  if (offenders.length === 0) {
    const max = deliveries.reduce((value, delivery) => Math.max(value, delivery.generatedDraftSceneChars || 0), 0);
    addCheck(cell, "payload_report", "pass", `max generatedDraftSceneChars=${max}; ceiling=${HOST_PAYLOAD_REPORT_CEILING}`);
    return;
  }
  for (const delivery of offenders) {
    addCheck(
      cell,
      "payload_report",
      "warn",
      `${delivery.tool} generatedDraftSceneChars=${delivery.generatedDraftSceneChars}; ceiling=${HOST_PAYLOAD_REPORT_CEILING}`,
    );
  }
}

function addConsoleCheck(client, cell) {
  if (!cell) return;
  const errors = consoleErrorEntries(client);
  if (errors.length === 0) {
    addCheck(cell, "console_errors", "pass", "console error entries=0");
    return;
  }
  addCheck(cell, "console_errors", "fail", errors.slice(0, 3).join(" | "));
}

async function addAsyncCheck(cell, id, fn) {
  try {
    const result = await fn();
    addCheck(cell, id, result.level, result.detail);
  } catch (error) {
    addCheck(cell, id, "fail", errorMessage(error));
  }
}

function addCheck(cell, id, level, detail) {
  cell.checks.push({ id, level, detail });
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
        truncated: delivery.truncated,
      })) : [],
      messages: Array.isArray(h.messages) ? [...h.messages] : [],
      errors: Array.isArray(h.errors) ? [...h.errors] : [],
    };
  })()`);
}

function innerDocumentMetrics(client) {
  return evaluate(client, `(() => {
    const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
    if (!doc) throw new Error("missing inner document");
    const scrolling = doc.scrollingElement || doc.documentElement;
    return { scrollWidth: scrolling.scrollWidth, clientWidth: scrolling.clientWidth };
  })()`);
}

function generatedBoundaryText(client) {
  return evaluate(client, `(() => {
    const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
    const banner = doc?.querySelector("[data-qa='generated-boundary']");
    return { present: Boolean(banner), text: banner?.textContent?.replace(/\\s+/g, " ").trim() ?? "" };
  })()`);
}

function innerCanvasCount(client) {
  return evaluate(client, `(() => {
    const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
    if (!doc) throw new Error("missing inner document");
    return doc.querySelectorAll("canvas").length;
  })()`);
}

function graphicsCount(client) {
  return evaluate(client, `(() => {
    const qa = window.__ATLAS_EMULATOR__?.qa?.();
    const count = qa?.perf?.graphicsCount?.();
    if (typeof count !== "number") throw new Error("missing qa().perf.graphicsCount()");
    return count;
  })()`);
}

function qaTransformSnapshot(client) {
  return evaluate(client, `(() => {
    const qa = window.__ATLAS_EMULATOR__?.qa?.();
    const world = qa?.world;
    const perf = qa?.perf;
    if (!world || !perf) throw new Error("missing qa world/perf");
    return {
      t: performance.now(),
      worldX: Number(world.x ?? world.position?.x ?? 0),
      worldY: Number(world.y ?? world.position?.y ?? 0),
      worldScaleX: Number(world.scale?.x ?? 0),
      sceneRebuilds: Number(perf.sceneRebuilds ?? 0),
      streamingRefreshFired: Number(perf.streamingRefreshFired ?? 0),
      streamingRefreshDeferred: Number(perf.streamingRefreshDeferred ?? 0),
    };
  })()`);
}

function selectedPlaceLabel(client) {
  return evaluate(client, `(() => {
    const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
    return doc?.querySelector("[data-qa='selected-place-label']")?.textContent?.replace(/\\s+/g, " ").trim() ?? "";
  })()`);
}

function markerTapCandidates(client) {
  return evaluate(client, `(() => {
    const frame = document.querySelector("[data-qa='emulator-frame']");
    const inner = frame?.contentWindow;
    const doc = inner?.document;
    const canvas = doc?.querySelector("canvas");
    const qa = window.__ATLAS_EMULATOR__?.qa?.();
    const markerLayer = qa?.world?.children?.find((child) => child.label === "markerLayer");
    if (!frame || !canvas || !markerLayer) return [];
    const frameRect = frame.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const boundsNumber = (bounds, key, fallback) => {
      const value = Number(bounds?.[key]);
      return Number.isFinite(value) ? value : fallback;
    };
    return markerLayer.children
      .filter((child) => child && child.eventMode === "static" && child.visible !== false)
      .map((child, index) => {
        const bounds = child.getBounds();
        const x = boundsNumber(bounds, "x", boundsNumber(bounds, "minX", 0));
        const y = boundsNumber(bounds, "y", boundsNumber(bounds, "minY", 0));
        const width = boundsNumber(bounds, "width", boundsNumber(bounds, "maxX", x) - x);
        const height = boundsNumber(bounds, "height", boundsNumber(bounds, "maxY", y) - y);
        const innerX = x + width / 2;
        const innerY = y + height / 2;
        return {
          index,
          x: frameRect.left + canvasRect.left + innerX,
          y: frameRect.top + canvasRect.top + innerY,
          innerX,
          innerY,
          width,
          height,
        };
      })
      .filter((item) =>
        Number.isFinite(item.x) &&
        Number.isFinite(item.y) &&
        item.width > 0 &&
        item.height > 0 &&
        item.innerX >= 0 &&
        item.innerY >= 0 &&
        item.innerX <= canvasRect.width &&
        item.innerY <= canvasRect.height
      )
      .sort((a, b) => Math.abs(a.innerX - canvasRect.width / 2) + Math.abs(a.innerY - canvasRect.height / 2) - (Math.abs(b.innerX - canvasRect.width / 2) + Math.abs(b.innerY - canvasRect.height / 2)));
  })()`);
}

function touchTargetOffenders(client) {
  return evaluate(client, `(() => {
    const doc = document.querySelector("[data-qa='emulator-frame']")?.contentWindow?.document;
    if (!doc) throw new Error("missing inner document");
    const visible = (element, rect) => {
      const style = element.ownerDocument.defaultView.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0;
    };
    return Array.from(doc.querySelectorAll("[data-qa]"))
      .filter((element) => element.tagName === "BUTTON" || element.getAttribute("role") === "button")
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { qa: element.getAttribute("data-qa") || element.tagName.toLowerCase(), width: rect.width, height: rect.height, visible: visible(element, rect) };
      })
      .filter((item) => item.visible && (item.width < 40 || item.height < 40))
      .map(({ qa, width, height }) => ({ qa, width, height }));
  })()`);
}

function consoleErrorEntries(client) {
  return client.events
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
}

async function captureCellScreenshot(client, cell) {
  // UNCLIPPED on purpose: captureScreenshot with a clip forces a re-raster of
  // the WebGL surface, which starves for 30s+ under headless software GL on
  // the mobile cells (measured; unclipped returns the composited frame in
  // <1s). The full page also carries the emulator header (county/viewport/
  // theme) — useful provenance in the evidence.
  const result = await client.send("Page.captureScreenshot", { format: "png" });
  await mkdir(REPORT_DIR, { recursive: true });
  const filename = `${cell.county}-${cell.viewport}-${cell.theme}.png`;
  const path = `${REPORT_DIR}/${filename}`;
  await writeFile(path, Buffer.from(result.data, "base64"));
  cell.screenshot = path;
}

function buildReport({ base, cells }) {
  const findings = cells.flatMap((cell) =>
    cell.checks
      .filter((check) => check.level === "fail")
      .map((check) => ({ county: cell.county, viewport: cell.viewport, theme: cell.theme, check: check.id, detail: check.detail })),
  );
  const summary = summarizeChecks(cells);
  return {
    ok: summary.fail === 0,
    ranAt: new Date(Date.now()).toISOString(),
    base,
    cells,
    summary,
    failures: findings,
  };
}

function emptyReport(base, failures) {
  return {
    ok: false,
    ranAt: new Date(Date.now()).toISOString(),
    base,
    cells: [],
    summary: { pass: 0, warn: 0, fail: failures.length },
    failures,
  };
}

function summarizeChecks(cells) {
  const summary = { pass: 0, warn: 0, fail: 0 };
  for (const cell of cells) {
    for (const check of cell.checks) {
      summary[check.level] += 1;
    }
  }
  return summary;
}

async function writeAndPrint(report) {
  await writeReports(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

async function writeReports(report) {
  await mkdir(dirname(resolve(REPORT_JSON_PATH)), { recursive: true });
  await writeFile(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(REPORT_MD_PATH, renderMarkdownReport(report));
}

function renderMarkdownReport(report) {
  const findings = report.cells.flatMap((cell) =>
    cell.checks
      .filter((check) => check.level === "fail" || check.level === "warn")
      .map((check) => ({ cell, check })),
  );
  if (findings.length === 0 && report.failures.length > 0) {
    for (const failure of report.failures) {
      findings.push({
        cell: { county: failure.county ?? "audit", viewport: failure.viewport ?? "n/a", theme: failure.theme ?? "n/a" },
        check: { id: failure.check ?? "harness", level: "fail", detail: failure.detail ?? String(failure) },
      });
    }
  }
  findings.sort((a, b) => severityRank(a.check.level) - severityRank(b.check.level));

  const lines = [
    "# Atlas Emulator Audit Report",
    "",
    `Ran: ${report.ranAt}`,
    `Base: ${report.base}`,
    `Result: ${report.ok ? "OK" : "FAIL"} (${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail)`,
    "",
    "## Findings",
    "",
  ];

  if (findings.length === 0) {
    lines.push("No fail or warn findings.", "");
  } else {
    lines.push("| Level | County | Viewport | Theme | Check | Detail |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const { cell, check } of findings) {
      lines.push(
        `| ${check.level.toUpperCase()} | ${md(cell.county)} | ${md(cell.viewport)} | ${md(cell.theme)} | ${md(check.id)} | ${md(check.detail)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Matrix");
  lines.push("");
  lines.push("| County | Draft | Archetype | Viewport | Theme | Delivered | Graphics | Payload | Console |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const cell of report.cells) {
    lines.push(
      `| ${md(cell.county)} | ${cell.draft ? "1" : "0"} | ${md(cell.archetype)} | ${md(cell.viewport)} | ${md(cell.theme)} | ${matrixCheck(cell, "delivered")} | ${matrixCheck(cell, "graphics_ceiling")} | ${matrixCheck(cell, "payload_report")} | ${matrixCheck(cell, "console_errors")} |`,
    );
  }
  lines.push("");
  lines.push("## Screenshots");
  lines.push("");
  for (const cell of report.cells) {
    lines.push(`- ${cell.county} ${cell.viewport} ${cell.theme}: ${cell.screenshot ?? "(not captured)"}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function severityRank(level) {
  if (level === "fail") return 0;
  if (level === "warn") return 1;
  return 2;
}

function matrixCheck(cell, id) {
  const checks = cell.checks.filter((check) => check.id === id);
  if (checks.length === 0) return "n/a";
  const worst = checks.some((check) => check.level === "fail") ? "fail" : checks.some((check) => check.level === "warn") ? "warn" : "pass";
  const detail = checks.map((check) => check.detail).join("; ");
  return md(`${worst}: ${detail}`);
}

function md(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
