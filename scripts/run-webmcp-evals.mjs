import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";

const root = process.cwd();
const mode = process.argv[2];
const allowedModes = new Set(["local", "browser", "smoke"]);
if (!allowedModes.has(mode)) {
  console.error("Usage: node scripts/run-webmcp-evals.mjs <local|browser|smoke>");
  process.exit(2);
}

const cliPath = resolve(root, "node_modules/webmcp-evals/dist/bin/webmcp-evals.js");
const tsxPath = resolve(root, "node_modules/tsx/dist/cli.mjs");
const toolSchemaPath = resolve(root, ".evals/atlas-tools.json");
const modelSuitePath = resolve(root, "evals/atlas-webmcp.evals.json");
const smokeSuitePath = resolve(root, "evals/atlas-webmcp.smoke.json");
const requestedRuns = Number.parseInt(process.env.ATLAS_WEBMCP_EVAL_RUNS ?? "3", 10);
const requestedThreshold = Number.parseFloat(process.env.ATLAS_WEBMCP_EVAL_THRESHOLD ?? "0.90");
if (!Number.isFinite(requestedRuns) || !Number.isFinite(requestedThreshold) || requestedThreshold > 1) {
  throw new Error("ATLAS_WEBMCP_EVAL_RUNS and ATLAS_WEBMCP_EVAL_THRESHOLD must be finite; threshold cannot exceed 1.");
}
const runs = Math.max(3, requestedRuns);
const threshold = Math.max(0.90, requestedThreshold);
const chromeChannel = process.env.ATLAS_WEBMCP_CHROME_CHANNEL ?? "chrome";

function runNode(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${args[0]} exited ${code ?? signal}`));
    });
  });
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : undefined;
  await new Promise((resolvePromise) => server.close(resolvePromise));
  if (!port) throw new Error("Could not reserve a local port for the Atlas eval server.");
  return port;
}

async function waitForReady(url, child) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < 20_000) {
    if (child.exitCode !== null) throw new Error(`Atlas eval server exited with code ${child.exitCode}.`);
    try {
      const response = await fetch(new URL("/ready", url));
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}.`);
}

async function startLocalServer() {
  const port = await reservePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [resolve(root, "server/dist/index.js")], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  try {
    await waitForReady(origin, child);
  } catch (error) {
    child.kill();
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${output}`);
  }
  return {
    child,
    url: `${origin}/explore`,
    async stop() {
      child.kill();
      await new Promise((resolvePromise) => {
        if (child.exitCode !== null) return resolvePromise();
        child.once("exit", resolvePromise);
        setTimeout(resolvePromise, 1500);
      });
    },
  };
}

function requireModelConfiguration() {
  const backend = process.env.ATLAS_WEBMCP_EVAL_BACKEND ?? "vercel";
  const model = process.env.ATLAS_WEBMCP_EVAL_MODEL;
  if (!model) {
    throw new Error(
      "Model evals require ATLAS_WEBMCP_EVAL_MODEL (for example, openai:gpt-5-mini, google:gemini-3-flash-preview, or ollama:qwen3).",
    );
  }
  if (model.startsWith("openai:") && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for the selected OpenAI eval model.");
  }
  if (model.startsWith("anthropic:") && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for the selected Anthropic eval model.");
  }
  if (model.startsWith("google:") && !(process.env.GOOGLE_AI || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)) {
    throw new Error("GOOGLE_AI, GEMINI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY is required for the selected Google eval model.");
  }
  if (model.startsWith("ollama:") && process.env.OLLAMA_HOST) {
    const host = new URL(process.env.OLLAMA_HOST);
    if (host.pathname === "/") host.pathname = "/v1";
    process.env.OLLAMA_HOST = host.href.replace(/\/$/, "");
  }
  return { backend, model };
}

async function latestJsonReport(outputDir) {
  const entries = (await readdir(outputDir)).filter((entry) => /^report-\d+\.json$/.test(entry)).sort();
  if (entries.length === 0) throw new Error(`No JSON evaluation report was written to ${outputDir}.`);
  return JSON.parse(await readFile(resolve(outputDir, entries.at(-1)), "utf8"));
}

function enforceModelThreshold(report) {
  const results = report?.results;
  const total = Array.isArray(results?.results) ? results.results.length : 0;
  const passed = Number(results?.passCount ?? 0);
  if (total === 0) throw new Error("The model evaluation report contained no scored steps.");
  const passRate = passed / total;
  const criticalFailures = results.results.filter((result) => {
    const name = result?.test?.name ?? "";
    return name.startsWith("[critical]") && result.outcome !== "pass";
  });
  console.log(`Atlas model-eval threshold: ${passed}/${total} (${(passRate * 100).toFixed(1)}%), required ${(threshold * 100).toFixed(1)}%.`);
  if (criticalFailures.length > 0) {
    throw new Error(`${criticalFailures.length} critical write-selection or atomicity trajectory step(s) failed.`);
  }
  if (passRate < threshold) {
    throw new Error(`Model evaluation pass rate ${(passRate * 100).toFixed(1)}% is below ${(threshold * 100).toFixed(1)}%.`);
  }
}

let localServer;
try {
  await runNode([tsxPath, resolve(root, "scripts/write-webmcp-eval-tools.ts")]);

  if (mode === "smoke") {
    localServer = process.env.ATLAS_WEBMCP_URL ? undefined : await startLocalServer();
    const url = process.env.ATLAS_WEBMCP_URL ?? localServer.url;
    await runNode([
      cliPath,
      "--chrome-channel", chromeChannel,
      "smoke",
      "-u", url,
      "-e", smokeSuitePath,
      "--timeout", process.env.ATLAS_WEBMCP_SMOKE_TIMEOUT ?? "30000",
      "--verbose",
    ]);
    await runNode([resolve(root, "scripts/verify-webmcp-browser-smoke.mjs"), "--url", url, "--chrome-channel", chromeChannel]);
  } else {
    const { backend, model } = requireModelConfiguration();
    const outputDir = resolve(root, ".evals", `${mode}-${Date.now()}`);
    if (mode === "browser") {
      localServer = process.env.ATLAS_WEBMCP_URL ? undefined : await startLocalServer();
    }
    const url = process.env.ATLAS_WEBMCP_URL ?? localServer?.url;
    const commandArgs = [
      cliPath,
      "--backend", backend,
      "--model", model,
      "--runs", String(runs),
      "--max-steps", process.env.ATLAS_WEBMCP_EVAL_MAX_STEPS ?? "5",
      "--reporter", "console", "json",
      "--output-dir", outputDir,
      "--chrome-channel", chromeChannel,
      mode,
    ];
    if (mode === "local") commandArgs.push("-t", toolSchemaPath);
    else commandArgs.push("-u", url);
    commandArgs.push("-e", modelSuitePath);
    await runNode(commandArgs);
    enforceModelThreshold(await latestJsonReport(outputDir));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await localServer?.stop();
}
