import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export class CdpClient {
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

export function findChrome(explicit) {
  return [explicit, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((c) => existsSync(c));
}
export function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
export async function waitForJson(url, timeoutMs = 12_000) {
  const start = Date.now(); let last;
  while (Date.now() - start < timeoutMs) { try { const r = await fetch(url); if (r.ok) return await r.json(); last = new Error(`HTTP ${r.status}`); } catch (e) { last = e; } await delay(150); }
  throw last ?? new Error(`Timed out: ${url}`);
}
export async function createTarget(port) {
  const u = `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`;
  let r = await fetch(u, { method: "PUT" }); if (!r.ok) r = await fetch(u);
  if (!r.ok) throw new Error(`Could not create Chrome target: HTTP ${r.status}`);
  const t = await r.json(); if (!t.webSocketDebuggerUrl) throw new Error("No websocket debugger URL."); return t;
}
export async function evaluate(client, expression) {
  const r = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "eval failed");
  return r.result?.value;
}
export async function waitFor(client, expression, timeoutMs = 10_000) {
  const start = Date.now(); let v;
  while (Date.now() - start < timeoutMs) { v = await evaluate(client, expression); if (v) return v; await delay(100); }
  throw new Error(`Timed out waiting: ${expression}`);
}
export async function launchChrome(chromePath) {
  const userDataDir = await mkdtemp(join(tmpdir(), "atlas-widget-perf-chrome-"));
  const port = 9500 + Math.floor(Math.random() * 400);
  const child = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, "about:blank"], { stdio: ["ignore", "ignore", "ignore"], windowsHide: true });
  try { await waitForJson(`http://127.0.0.1:${port}/json/version`); return { child, port, userDataDir }; }
  catch (e) { child.kill(); await rm(userDataDir, { recursive: true, force: true }); throw e; }
}
export async function stopChrome(chrome) {
  chrome.child.kill();
  await new Promise((res) => { chrome.child.once("exit", res); setTimeout(res, 1500); });
  try { await rm(chrome.userDataDir, { recursive: true, force: true }); } catch { /* windows may hold locks */ }
}
