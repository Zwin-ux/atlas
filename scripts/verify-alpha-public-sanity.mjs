import { spawn } from "node:child_process";
import process from "node:process";

const DEFAULT_PUBLIC_BASE_URL = "https://atlas-backend-production-e6fc.up.railway.app";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function withPath(baseUrl, path) {
  return new URL(path, `${trimTrailingSlash(baseUrl)}/`).toString();
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/token|key|secret|password|signature|auth/i.test(key)) {
        url.searchParams.set(key, "[redacted]");
      }
    }
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}

function parseJsonOutput(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.lastIndexOf("\n{");
    if (start >= 0) {
      return JSON.parse(trimmed.slice(start + 1));
    }
    throw new Error("Verifier did not emit parseable JSON.");
  }
}

function sanitizeText(text) {
  return text
    .replace(/(token|key|secret|password|signature|auth)=([^&\s]+)/gi, "$1=[redacted]")
    .trim();
}

function tail(text, maxLength = 1200) {
  const cleaned = sanitizeText(text);
  return cleaned.length > maxLength ? cleaned.slice(-maxLength) : cleaned;
}

async function runCheck({ name, script, env }) {
  const startedAt = Date.now();

  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      resolve({
        name,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: sanitizeText(error.message),
      });
    });

    child.on("close", (code) => {
      const durationMs = Date.now() - startedAt;
      let parsed = null;
      let parseError = null;

      if (code === 0) {
        try {
          parsed = parseJsonOutput(stdout);
        } catch (error) {
          parseError = sanitizeText(error.message);
        }
      }

      resolve({
        name,
        ok: code === 0 && Boolean(parsed) && parsed.ok === true,
        exitCode: code,
        durationMs,
        parsed,
        error: parseError ?? (code === 0 ? undefined : tail(stderr || stdout)),
      });
    });
  });
}

function summarizeCheck(result) {
  const parsed = result.parsed ?? {};
  const summary = {
    name: result.name,
    ok: result.ok,
    durationMs: result.durationMs,
  };

  if (typeof result.exitCode === "number") {
    summary.exitCode = result.exitCode;
  }

  if (Array.isArray(parsed.tools)) {
    summary.toolCount = parsed.tools.length;
  }

  if (typeof parsed.lookupPlaceCount === "number") {
    summary.lookupPlaceCount = parsed.lookupPlaceCount;
  }

  if (typeof parsed.bytes === "number") {
    summary.previewBytes = parsed.bytes;
  }

  if (typeof parsed.hasCityWorldMarkup === "boolean") {
    summary.hasCityWorldMarkup = parsed.hasCityWorldMarkup;
  }

  if (typeof parsed.cachedLookup === "boolean") {
    summary.cachedLookup = parsed.cachedLookup;
  }

  if (result.error) {
    summary.error = result.error;
  }

  return summary;
}

const publicBaseUrl = trimTrailingSlash(process.env.ATLAS_PUBLIC_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL);
const mcpUrl = process.env.ATLAS_MCP_URL ?? withPath(publicBaseUrl, "mcp");
const previewUrl = process.env.ATLAS_PREVIEW_URL ?? withPath(publicBaseUrl, "preview");

const checks = [];
checks.push(
  await runCheck({
    name: "public_mcp_flow",
    script: "scripts/verify-mcp-flow.mjs",
    env: { ATLAS_MCP_URL: mcpUrl },
  }),
);
checks.push(
  await runCheck({
    name: "public_submission_contract",
    script: "scripts/verify-submission.mjs",
    env: { ATLAS_MCP_URL: mcpUrl },
  }),
);
checks.push(
  await runCheck({
    name: "public_preview_http",
    script: "scripts/verify-preview-http.mjs",
    env: { ATLAS_PREVIEW_URL: previewUrl },
  }),
);

const summarizedChecks = checks.map(summarizeCheck);
const ok = summarizedChecks.every((check) => check.ok);
const firstToolCount = summarizedChecks.find((check) => typeof check.toolCount === "number")?.toolCount ?? null;
const previewBytes = summarizedChecks.find((check) => typeof check.previewBytes === "number")?.previewBytes ?? null;

console.log(
  JSON.stringify(
    {
      ok,
      publicBaseUrl: sanitizeUrl(publicBaseUrl),
      mcpUrl: sanitizeUrl(mcpUrl),
      previewUrl: sanitizeUrl(previewUrl),
      toolCount: firstToolCount,
      previewBytes,
      checks: summarizedChecks,
      nextBrowserEvidenceReminder:
        "Still capture desktop and 390x844 mobile screenshots after place select, tray, sticker/pin, pan/zoom, note input, and session note save.",
    },
    null,
    2,
  ),
);

if (!ok) {
  process.exitCode = 1;
}
