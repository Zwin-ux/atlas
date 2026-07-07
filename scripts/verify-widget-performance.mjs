import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

// 0.74F widget performance gate. Uses the __ATLAS_QA__.perf probe to prove
// the renderer's perf architecture holds:
//   1. Hover emphasizes via the focus overlay ONLY — sceneRebuilds must not
//      move while overlayRedraws does.
//   2. Render-on-demand: once ambient animation settles, the rAF loop parks
//      and renderedFrames stops growing (near-zero idle GPU cost).
//   3. A streaming-window rebuild stays under the latency ceiling.
//   4. A small pan is transform-only (zero rebuilds).

class CdpClient {
  constructor(url) { this.url = url; this.id = 0; this.pending = new Map(); this.events = []; this.socket = null; }
  async connect() {
    if (typeof WebSocket !== "function") throw new Error("Node runtime with global WebSocket required.");
    this.socket = new WebSocket(this.url);
    this.socket.addEventListener("message", (e) => this.handle(e.data));
    await new Promise((res, rej) => { this.socket.addEventListener("open", res, { once: true }); this.socket.addEventListener("error", rej, { once: true }); });
  }
  handle(raw) { const m = JSON.parse(raw); if (m.id && this.pending.has(m.id)) { const { resolve: rs, reject: rj } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rj(new Error(m.error.message)) : rs(m.result); return; } this.events.push(m); }
  send(method, params = {}) { const id = ++this.id; this.socket.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej })); }
  close() { this.socket?.close(); }
}

// Wall-time is hostage to host load (this gate runs beside dev servers and a
// user browser), so the rebuild-latency ceiling is deliberately generous and
// paired with a DETERMINISTIC architecture gate: the world Graphics count.
// A regression that undoes the merged-Graphics architecture (5,400+ objects
// pre-0.74F) trips the object ceiling regardless of machine load.
const REBUILD_MS_CEILING = 350;
const WORLD_GRAPHICS_CEILING = 1600;

const args = parseArgs(process.argv.slice(2));
const PREVIEW_URL = process.env.ATLAS_PREVIEW_URL ?? "http://127.0.0.1:8787/preview";
const chromePath = findChrome(args.chromePath);
if (!chromePath) throw new Error("Could not find Chrome or Edge. Set CHROME_PATH.");

const chrome = await launchChrome(chromePath);
let result;
try {
  result = await runGate(chrome);
} finally {
  await stopChrome(chrome);
}
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

async function runGate(activeChrome) {
  const target = await createTarget(activeChrome.port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  const failures = [];
  const checks = {};
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await client.send("Page.navigate", { url: PREVIEW_URL });
    await waitFor(client, `document.readyState === "complete"`, 20_000);
    await waitFor(client, `Boolean(window.__ATLAS_QA__ && window.__ATLAS_QA__.perf)`, 20_000);
    await waitFor(client, `document.querySelectorAll("canvas").length === 1`, 15_000);
    await delay(600);

    const perfSnapshot = () =>
      evaluate(client, `(() => { const p = window.__ATLAS_QA__.perf; return { rebuilds: p.sceneRebuilds, overlays: p.overlayRedraws, frames: p.renderedFrames, ms: p.lastRebuildMs, anim: p.animatedTargetCount(), parked: p.loopParked(), graphics: p.graphicsCount() }; })()`);

    // ---- Gate 1: hover never rebuilds the scene --------------------------
    const beforeHover = await perfSnapshot();
    await evaluate(client, `(() => {
      const marker = window.__ATLAS_QA__.world.children.find((c) => c.label === "markerLayer");
      const hits = marker ? marker.children.filter((c) => c.eventMode === "static") : [];
      if (hits.length < 2) throw new Error("expected interactive place hit targets");
      hits[1].emit("pointerover");
      return hits.length;
    })()`);
    await delay(400);
    await evaluate(client, `(() => {
      const marker = window.__ATLAS_QA__.world.children.find((c) => c.label === "markerLayer");
      const hits = marker.children.filter((c) => c.eventMode === "static");
      hits[hits.length - 1].emit("pointerover");
      return true;
    })()`);
    await delay(400);
    const afterHover = await perfSnapshot();
    checks.hover = { rebuildsBefore: beforeHover.rebuilds, rebuildsAfter: afterHover.rebuilds, overlaysBefore: beforeHover.overlays, overlaysAfter: afterHover.overlays };
    if (afterHover.rebuilds !== beforeHover.rebuilds) failures.push(`hover rebuilt the scene: ${beforeHover.rebuilds} -> ${afterHover.rebuilds}`);
    if (afterHover.overlays <= beforeHover.overlays) failures.push("hover did not redraw the focus overlay");

    // ---- Gate 2: idle parks ---------------------------------------------
    // Wait out the 4s focus-pulse window, then sample renderedFrames for 2s.
    await delay(4600);
    const idleStart = await perfSnapshot();
    await delay(2000);
    const idleEnd = await perfSnapshot();
    const idleFrames = idleEnd.frames - idleStart.frames;
    checks.idle = { idleFrames, animatedTargets: idleEnd.anim, parked: idleEnd.parked };
    if (idleEnd.anim === 0) {
      if (idleFrames > 4) failures.push(`idle with no animations rendered ${idleFrames} frames in 2s (expected <= 4, parked)`);
    } else if (idleFrames > 70) {
      failures.push(`ambient animation rendered ${idleFrames} frames in 2s (expected <= 70 at the 30fps cap)`);
    }

    // ---- Gate 3: small pan is transform-only ----------------------------
    const beforePan = await perfSnapshot();
    await evaluate(client, `(() => {
      const canvas = document.querySelector("canvas");
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
      canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, pointerId: 7 }));
      canvas.dispatchEvent(new PointerEvent("pointermove", { clientX: cx + 24, clientY: cy + 12, bubbles: true, pointerId: 7 }));
      canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: cx + 24, clientY: cy + 12, bubbles: true, pointerId: 7 }));
      return true;
    })()`);
    await delay(500);
    const afterSmallPan = await perfSnapshot();
    checks.smallPan = { rebuildsBefore: beforePan.rebuilds, rebuildsAfter: afterSmallPan.rebuilds };
    if (afterSmallPan.rebuilds !== beforePan.rebuilds) failures.push(`small pan triggered a rebuild: ${beforePan.rebuilds} -> ${afterSmallPan.rebuilds}`);

    // ---- Gate 4: streaming rebuild latency -------------------------------
    // Drag far past the 3-tile streaming margin to force a window refresh.
    // Sampled TWICE and gated on the MIN: the minimum is the intrinsic
    // rebuild cost; the max is host scheduler noise (parallel verifier runs,
    // CI load) and would make the gate flaky.
    const bigPan = (id, sign) =>
      evaluate(client, `(() => {
        const canvas = document.querySelector("canvas");
        const r = canvas.getBoundingClientRect();
        const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
        canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: cx, clientY: cy, bubbles: true, pointerId: ${id} }));
        for (let step = 1; step <= 10; step += 1) {
          canvas.dispatchEvent(new PointerEvent("pointermove", { clientX: cx - step * 60 * ${sign}, clientY: cy - step * 24 * ${sign}, bubbles: true, pointerId: ${id} }));
        }
        canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: cx - 600 * ${sign}, clientY: cy - 240 * ${sign}, bubbles: true, pointerId: ${id} }));
        return true;
      })()`);
    await bigPan(8, 1);
    await delay(900);
    const afterFirstBigPan = await perfSnapshot();
    await bigPan(9, -1);
    await delay(900);
    const afterSecondBigPan = await perfSnapshot();
    const rebuildMs = Math.min(afterFirstBigPan.ms, afterSecondBigPan.ms);
    checks.streamingRebuild = {
      rebuilds: afterSecondBigPan.rebuilds - afterSmallPan.rebuilds,
      rebuildMsSamples: [afterFirstBigPan.ms, afterSecondBigPan.ms],
      rebuildMs,
      graphics: afterSecondBigPan.graphics,
    };
    if (afterFirstBigPan.rebuilds <= afterSmallPan.rebuilds) failures.push("edge pan did not trigger a streaming window rebuild");
    if (rebuildMs > REBUILD_MS_CEILING) failures.push(`window rebuild took ${rebuildMs}ms (ceiling ${REBUILD_MS_CEILING}ms)`);
    const worstGraphics = Math.max(afterFirstBigPan.graphics, afterSecondBigPan.graphics);
    if (worstGraphics > WORLD_GRAPHICS_CEILING) failures.push(`world holds ${worstGraphics} Graphics (ceiling ${WORLD_GRAPHICS_CEILING} — merged-Graphics architecture regressed)`);
  } finally {
    client.close();
  }
  return { ok: failures.length === 0, previewUrl: PREVIEW_URL, rebuildMsCeiling: REBUILD_MS_CEILING, checks, failures };
}

// ---- CDP + chrome boilerplate (mirrors scripts/verify-generated-district-widget.mjs) ----
function parseArgs(argv) {
  const a = { chromePath: process.env.CHROME_PATH ?? "" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--chrome-path") a.chromePath = argv[++i];
    else if (argv[i] === "--url") { process.env.ATLAS_PREVIEW_URL = argv[++i]; }
    else if (argv[i] === "--json-only") { /* json is the only output */ }
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return a;
}
function findChrome(explicit) {
  return [explicit, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((c) => existsSync(c));
}
function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function waitForJson(url, timeoutMs = 12_000) {
  const start = Date.now(); let last;
  while (Date.now() - start < timeoutMs) { try { const r = await fetch(url); if (r.ok) return await r.json(); last = new Error(`HTTP ${r.status}`); } catch (e) { last = e; } await delay(150); }
  throw last ?? new Error(`Timed out: ${url}`);
}
async function createTarget(port) {
  const u = `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`;
  let r = await fetch(u, { method: "PUT" }); if (!r.ok) r = await fetch(u);
  if (!r.ok) throw new Error(`Could not create Chrome target: HTTP ${r.status}`);
  const t = await r.json(); if (!t.webSocketDebuggerUrl) throw new Error("No websocket debugger URL."); return t;
}
async function evaluate(client, expression) {
  const r = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "eval failed");
  return r.result?.value;
}
async function waitFor(client, expression, timeoutMs = 10_000) {
  const start = Date.now(); let v;
  while (Date.now() - start < timeoutMs) { v = await evaluate(client, expression); if (v) return v; await delay(100); }
  throw new Error(`Timed out waiting: ${expression}`);
}
async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-widget-perf-chrome-"));
  const port = 9500 + Math.floor(Math.random() * 400);
  const child = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "about:blank"], { stdio: ["ignore", "ignore", "ignore"], windowsHide: true });
  try { await waitForJson(`http://127.0.0.1:${port}/json/version`); return { child, port, userDataDir }; }
  catch (e) { child.kill(); await rm(userDataDir, { recursive: true, force: true }); throw e; }
}
async function stopChrome(chrome) {
  chrome.child.kill();
  await new Promise((res) => { chrome.child.once("exit", res); setTimeout(res, 1500); });
  try { await rm(chrome.userDataDir, { recursive: true, force: true }); } catch { /* windows may hold locks */ }
}
