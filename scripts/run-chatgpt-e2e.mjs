import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const url = process.env.ATLAS_CHATGPT_URL ?? process.argv[2] ?? "http://127.0.0.1:8787/explore";
const reportPath = resolve(process.env.ATLAS_CHATGPT_E2E_REPORT ?? ".evals/chatgpt-e2e/report.json");
const preflightPath = resolve(".evals/chatgpt-e2e/preflight.json");
const transcriptPath = process.env.ATLAS_CHATGPT_TRANSCRIPT;
const runGrok = process.env.ATLAS_CHATGPT_RUN_GROK === "1";

function runNode(script, args = [], env = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(root, script), ...args], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited ${code ?? signal}.`));
    });
  });
}

const startedAt = new Date().toISOString();
const stages = [];

try {
  await runNode("scripts/verify-chatgpt-live.mjs", [url], { ATLAS_CHATGPT_PREFLIGHT_REPORT: preflightPath });
  stages.push({ name: "deployment_preflight", status: "pass" });

  await runNode("scripts/run-webmcp-evals.mjs", ["smoke"], { ATLAS_WEBMCP_URL: url });
  stages.push({ name: "chrome_webmcp_smoke", status: "pass" });

  if (transcriptPath) {
    await runNode("scripts/verify-chatgpt-transcript.mjs", [transcriptPath]);
    stages.push({ name: "chatgpt_transcript", status: "pass", path: resolve(transcriptPath) });
  } else {
    stages.push({ name: "chatgpt_transcript", status: "manual_gate", reason: "ATLAS_CHATGPT_TRANSCRIPT is not set." });
  }

  if (runGrok) {
    if (!process.env.XAI_API_KEY) throw new Error("ATLAS_CHATGPT_RUN_GROK=1 requires XAI_API_KEY.");
    await runNode("scripts/run-webmcp-evals.mjs", ["browser"], {
      ATLAS_WEBMCP_URL: url,
      ATLAS_WEBMCP_EVAL_BACKEND: "vercel",
      ATLAS_WEBMCP_EVAL_MODEL: "xai:grok-4.6",
    });
    stages.push({ name: "grok_4_6_adversarial_eval", status: "pass", runsPerCase: 3, threshold: 0.9 });
  } else {
    stages.push({ name: "grok_4_6_adversarial_eval", status: "credential_gate", reason: "Set ATLAS_CHATGPT_RUN_GROK=1 and XAI_API_KEY to run the paid model evaluation." });
  }
} catch (error) {
  stages.push({ name: "e2e_run", status: "fail", error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
} finally {
  const automationPassed = process.exitCode !== 1;
  const transcriptPassed = stages.some((stage) => stage.name === "chatgpt_transcript" && stage.status === "pass");
  const modelPassed = stages.some((stage) => stage.name === "grok_4_6_adversarial_eval" && stage.status === "pass");
  const report = {
    ok: automationPassed,
    releaseReady: automationPassed && transcriptPassed && modelPassed,
    startedAt,
    finishedAt: new Date().toISOString(),
    url,
    architecture: "ChatGPT Site Tools / page-native WebMCP",
    publicTools: ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"],
    stages,
    evidence: {
      automatedPageAndProtocol: automationPassed ? "pass" : "fail",
      realChatGpt: transcriptPassed ? "pass" : "missing",
      modelThreshold: modelPassed ? "pass" : "missing",
    },
    boundary: "ok means the automated page/protocol run completed. releaseReady additionally requires a captured ChatGPT transcript and a passing model-threshold run. A remote MCP plugin is not part of this candidate because it would not control the same open browser-page controller.",
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...report, report: reportPath }, null, 2));
}
