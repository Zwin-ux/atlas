#!/usr/bin/env node
import { spawn } from "node:child_process";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const gates = [];
const blockers = [];

for (const testCase of [
  { name: "save_surface_on_emits_hosted_clawd_meta", flag: "on", expectedHostedClawd: true },
  { name: "save_surface_off_omits_hosted_clawd_meta", flag: "off", expectedHostedClawd: false },
]) {
  await gate(testCase.name, async () => {
    const port = Number(process.env.ATLAS_SAVE_SURFACE_VERIFY_PORT ?? 19_787 + Math.floor(Math.random() * 1000));
    const baseUrl = `http://127.0.0.1:${port}`;
    const server = startServer({ port, baseUrl, saveSurface: testCase.flag });

    try {
      await waitForServer(server, port);
      const result = await callSelectCounty(`${baseUrl}/mcp`);
      const hasHostedClawd = hasOwn(result?._meta, "hostedClawd");
      assert(
        hasHostedClawd === testCase.expectedHostedClawd,
        `ATLAS_SAVE_SURFACE=${testCase.flag} expected hostedClawd meta ${testCase.expectedHostedClawd}, got ${hasHostedClawd}.`,
      );
    } finally {
      await stopServer(server);
    }
  });
}

const summary = {
  ok: blockers.length === 0,
  update: "w15-save-surface-flag",
  gates,
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exitCode = 1;

async function callSelectCounty(mcpUrl) {
  const client = new Client({ name: "atlas-save-surface-flag-verifier", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  try {
    await client.connect(transport);
    return await client.callTool({
      name: "select_county",
      arguments: { countySlug: "riverside-ca" },
    });
  } finally {
    await client.close();
  }
}

function startServer({ port, baseUrl, saveSurface }) {
  const child = process.platform === "win32"
    ? spawn("pnpm exec tsx server/src/index.ts", [], spawnOptions({ shell: true, port, baseUrl, saveSurface }))
    : spawn("pnpm", ["exec", "tsx", "server/src/index.ts"], spawnOptions({ shell: false, port, baseUrl, saveSurface }));
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

function spawnOptions({ shell, port, baseUrl, saveSurface }) {
  return {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "test",
      APP_BASE_URL: baseUrl,
      ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_MONEY_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED: "false",
      ATLAS_SAVE_SURFACE: saveSurface,
      ATLAS_SCENE_PACKET_CACHE_BACKEND: "memory",
    },
    shell,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  };
}

async function waitForServer(server, port) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early with ${server.exitCode}\n${server.stdoutText}\n${server.stderrText}`);
    }
    try {
      const response = await request({ port, method: "GET", path: "/health" });
      if (response.status === 200) return;
    } catch {
      // Keep polling until the local server is listening.
    }
    await delay(250);
  }
  throw new Error(`server did not become ready\n${server.stdoutText}\n${server.stderrText}`);
}

function request({ port, method, path, headers = {}, body }) {
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

function hasOwn(value, key) {
  return Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key));
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
