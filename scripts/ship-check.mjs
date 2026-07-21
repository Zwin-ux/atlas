#!/usr/bin/env node
/**
 * North Face ship suite — minimal gates for the ChatGPT plugin surface.
 * Heavy slice verifiers live elsewhere; this is the default "is the product shippable?" path.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

const jsonOnly = process.argv.includes("--json-only");
const skipLive = process.argv.includes("--skip-live");

function resolveInvocation(step) {
  if (process.platform !== "win32" || step.command !== "pnpm") {
    return { command: step.command, args: step.args };
  }

  const commandParts = [step.command, ...step.args];
  for (const part of commandParts) {
    if (!/^[A-Za-z0-9_./:@=-]+$/.test(part)) {
      throw new Error(`Unsafe Windows ship-check command argument: ${part}`);
    }
  }

  return {
    command: process.env.ComSpec || "cmd.exe",
    args: ["/d", "/s", "/c", commandParts.join(" ")],
  };
}

const steps = [
  { id: "core-test", command: "pnpm", args: ["--dir", "packages/core", "test"] },
  { id: "typecheck-starter", command: "pnpm", args: ["typecheck:starter"] },
  { id: "build-starter", command: "pnpm", args: ["build:starter"] },
  { id: "parametric-generator", command: "node", args: ["scripts/verify-parametric-generator.mjs", "--json-only"] },
  { id: "generated-district-parity", command: "node", args: ["scripts/verify-generated-district-parity.mjs", "--json-only"] },
  { id: "provider-boundaries", command: "node", args: ["scripts/verify-provider-boundaries.mjs", "--json-only"] },
  { id: "tool-result-shape", command: "node", args: ["scripts/verify-tool-result-shape.mjs", "--json-only"] },
  {
    id: "submission",
    command: "pnpm",
    args: ["verify:submission"],
    // Prefer live Railway unless a local MCP is explicitly provided.
    env: {
      ATLAS_MCP_URL:
        process.env.ATLAS_MCP_URL ||
        `${(process.env.ATLAS_BASE_URL || "https://atlas-backend-production-e6fc.up.railway.app").replace(/\/$/, "")}/mcp`,
    },
  },
];

if (!skipLive) {
  steps.push({
    id: "live-ready",
    command: "node",
    args: [
      "-e",
      `const r=await fetch(process.env.ATLAS_BASE_URL||"https://atlas-backend-production-e6fc.up.railway.app"+"/ready");if(!r.ok)process.exit(1);const j=await r.json();if(!j.ok)process.exit(1);console.log(JSON.stringify({ok:true,ready:j}));`,
    ],
  });
}

const results = [];
let failed = false;

for (const step of steps) {
  const started = Date.now();
  const invocation = resolveInvocation(step);
  const run = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...(step.env || {}) },
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true,
  });
  const ok = run.status === 0;
  if (!ok) failed = true;
  const entry = {
    id: step.id,
    ok,
    status: run.status,
    ms: Date.now() - started,
    error: run.error
      ? { code: run.error.code || null, message: run.error.message }
      : null,
    stderr: (run.stderr || "").slice(-400),
    stdoutTail: (run.stdout || "").slice(-400),
  };
  results.push(entry);
  if (!jsonOnly) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${step.id}  (${entry.ms}ms)`);
    if (!ok && entry.error) console.log(entry.error.message);
    if (!ok && entry.stderr) console.log(entry.stderr);
  }
}

const report = {
  ok: !failed,
  suite: "north-face-ship-check",
  skipLive,
  results,
};

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(failed ? "\nship:check FAILED" : "\nship:check OK");
}

process.exit(failed ? 1 : 0);
