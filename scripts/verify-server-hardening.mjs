#!/usr/bin/env node
import { spawn } from "node:child_process";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.ATLAS_SERVER_HARDENING_PORT ?? 18_787 + Math.floor(Math.random() * 1000));
const baseUrl = `http://127.0.0.1:${port}`;
const allowedOrigin = "https://allowed.atlas.test";
const hostileOrigin = "https://evil.example";
const gates = [];
const blockers = [];

const server = startServer();

try {
  await waitForServer();

  await gate("mcp_hostile_origin_403", async () => {
    const response = await request({
      method: "POST",
      path: "/mcp",
      headers: {
        Origin: hostileOrigin,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: mcpInitializeBody(),
    });
    assert(response.status === 403, `/mcp hostile Origin expected 403, got ${response.status}.`);
  });

  await gate("mcp_no_origin_200_family", async () => {
    const response = await request({
      method: "POST",
      path: "/mcp",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: mcpInitializeBody(),
    });
    assert(response.status >= 200 && response.status < 300, `/mcp no-Origin expected 2xx, got ${response.status}: ${response.body}`);
  });

  await gate("hostile_host_rejected", async () => {
    const response = await request({
      method: "GET",
      path: "/api/geo/status",
      headers: {
        Host: "evil.example",
      },
    });
    assert([400, 403].includes(response.status), `hostile Host expected 400/403, got ${response.status}.`);
  });

  await gate("health_probes_bypass_host_admission", async () => {
    for (const path of ["/health", "/ready"]) {
      const response = await request({
        method: "GET",
        path,
        headers: {
          Host: "railway-internal-probe.local",
        },
      });
      assert(
        response.status === 200 || (path === "/ready" && response.status === 503),
        `${path} probe with internal Host expected 200 (or 503 not-ready), got ${response.status}.`,
      );
    }
  });

  await gate("hosted_clawd_write_404_without_persistence", async () => {
    const response = await request({
      method: "POST",
      path: "/api/hosted-clawd/create-or-attach",
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert(response.status === 404, `hosted-clawd write expected router 404, got ${response.status}: ${response.body}`);
  });

  await gate("mcp_preflight_cors_reflection", async () => {
    const allowed = await request({
      method: "OPTIONS",
      path: "/mcp",
      headers: {
        Origin: allowedOrigin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type, mcp-session-id",
      },
    });
    assert(allowed.status === 204, `allowed preflight expected 204, got ${allowed.status}.`);
    assert(header(allowed, "access-control-allow-origin") === allowedOrigin, "allowed preflight did not reflect ACAO.");

    const hostile = await request({
      method: "OPTIONS",
      path: "/mcp",
      headers: {
        Origin: hostileOrigin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    assert(!header(hostile, "access-control-allow-origin"), "hostile preflight must not return ACAO.");
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  blockers.push(`startup: ${message}`);
  gates.push({ name: "server_startup", ok: false, message });
} finally {
  await stopServer(server);
}

const summary = {
  ok: blockers.length === 0,
  update: "w1-server-hardening",
  baseUrl,
  gates,
  blockerCount: blockers.length,
  blockers,
  serverLogTail: {
    stdout: tail(server.stdoutText),
    stderr: tail(server.stderrText),
  },
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exitCode = 1;

function startServer() {
  const child = process.platform === "win32" ? spawn("pnpm exec tsx server/src/index.ts", [], spawnOptions(true)) : spawn("pnpm", ["exec", "tsx", "server/src/index.ts"], spawnOptions(false));
  child.stdoutText = "";
  child.stderrText = "";
  child.stdout.on("data", (chunk) => {
    child.stdoutText += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    child.stderrText += chunk.toString();
  });
  return child;
}

function spawnOptions(shell) {
  return {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "test",
      APP_BASE_URL: baseUrl,
      ATLAS_ALLOWED_ORIGINS: allowedOrigin,
      ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_MONEY_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED: "false",
      ATLAS_SCENE_PACKET_CACHE_BACKEND: "memory",
    },
    shell,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  };
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early with ${server.exitCode}\n${server.stdoutText}\n${server.stderrText}`);
    }
    try {
      const response = await request({ method: "GET", path: "/health" });
      if (response.status === 200) return;
    } catch {
      // Keep polling until the local server is listening.
    }
    await delay(250);
  }
  throw new Error(`server did not become ready\n${server.stdoutText}\n${server.stderrText}`);
}

async function gate(name, fn) {
  try {
    await fn();
    gates.push({ name, ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    gates.push({ name, ok: false, message });
    blockers.push(`${name}: ${message}`);
  }
}

function request({ method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          text += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: text,
          });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function mcpInitializeBody() {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "atlas-server-hardening-verifier",
        version: "0.1.0",
      },
    },
  });
}

function header(response, name) {
  const value = response.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function stopServer(child) {
  if (!child) return;
  if (child.exitCode !== null) {
    child.stdout?.destroy();
    child.stderr?.destroy();
    child.unref();
    return;
  }

  if (process.platform === "win32" && child.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: ["ignore", "ignore", "ignore"],
        windowsHide: true,
      });
      killer.on("close", resolve);
      killer.on("error", resolve);
    });
    await Promise.race([
      new Promise((resolve) => child.on("close", resolve)),
      delay(2_000),
    ]);
    child.stdout?.destroy();
    child.stderr?.destroy();
    child.unref();
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.on("close", resolve)),
    delay(2_000),
  ]);
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.unref();
}

function tail(value) {
  return value.trim().split(/\r?\n/).slice(-12);
}
