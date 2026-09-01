import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { prepareChatGptSession } from "../prepare-chatgpt-session.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const execFileAsync = promisify(execFile);
const onePixelPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

test("prepares an isolated, validator-ready ChatGPT acceptance session", async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "atlas-chatgpt-session-"));
  const output = resolve(temporaryRoot, "session");
  const now = new Date("2026-08-30T20:00:00.000Z");
  const result = await prepareChatGptSession({ output, now, root: repositoryRoot });
  const transcript = JSON.parse(await readFile(result.transcriptPath, "utf8"));
  const runbook = await readFile(result.runbookPath, "utf8");

  assert.equal(transcript.status, "template");
  assert.equal(transcript.url, "https://atlas-webmcp-production.up.railway.app/explore");
  assert.equal(transcript.capturedAt, now.toISOString());
  assert.equal(transcript.siteTools.length, 5);
  assert.equal(transcript.evidence.trailScreenshot, "evidence/trail.png");
  assert.match(runbook, /Site tools → Available site tools/);
  assert.match(runbook, /pnpm e2e:chatgpt:transcript/);

  transcript.status = "captured";
  transcript.client.version = "2026.830.1";
  for (const [key, relativePath] of Object.entries(transcript.evidence)) {
    await writeFile(resolve(output, relativePath), key === "consoleOrNotes" ? "No application errors observed.\n" : onePixelPng);
  }
  await writeFile(result.transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  await assert.rejects(
    () => execFileAsync(process.execPath, [resolve(repositoryRoot, "scripts/verify-chatgpt-transcript.mjs"), result.transcriptPath], {
      cwd: temporaryRoot,
      windowsHide: true,
    }),
    /Every captured step must be marked observed/,
  );

  transcript.steps = transcript.steps.map((step) => ({ ...step, observed: true }));
  await writeFile(result.transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  await assert.rejects(
    () => execFileAsync(process.execPath, [resolve(repositoryRoot, "scripts/verify-chatgpt-transcript.mjs"), result.transcriptPath], {
      cwd: temporaryRoot,
      windowsHide: true,
    }),
    /observedAt timestamp/,
  );

  transcript.steps = transcript.steps.map((step, index) => ({
    ...step,
    observedAt: new Date(now.getTime() + index * 1000).toISOString(),
    callId: `chatgpt-site-tool-${index + 1}`,
  }));
  const outsideEvidence = resolve(temporaryRoot, "outside.png");
  await writeFile(outsideEvidence, onePixelPng);
  transcript.evidence.trailScreenshot = "../outside.png";
  await writeFile(result.transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  await assert.rejects(
    () => execFileAsync(process.execPath, [resolve(repositoryRoot, "scripts/verify-chatgpt-transcript.mjs"), result.transcriptPath], {
      cwd: temporaryRoot,
      windowsHide: true,
    }),
    /stay inside the session evidence folder/,
  );

  transcript.evidence.trailScreenshot = "evidence/trail.png";
  await writeFile(result.transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  const verification = await execFileAsync(process.execPath, [resolve(repositoryRoot, "scripts/verify-chatgpt-transcript.mjs"), result.transcriptPath], {
    cwd: temporaryRoot,
    windowsHide: true,
  });
  const report = JSON.parse(verification.stdout);
  assert.equal(report.ok, true);
  assert.equal(report.evidence.trailScreenshot.path, "evidence/trail.png");
});

test("refuses to overwrite a previous acceptance session", async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "atlas-chatgpt-session-"));
  const output = resolve(temporaryRoot, "session");
  await prepareChatGptSession({ output, root: repositoryRoot });
  await assert.rejects(() => prepareChatGptSession({ output, root: repositoryRoot }), /Refusing to overwrite/);
});

test("quotes generated PowerShell values as inert literals", async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "atlas-chatgpt-session-"));
  const output = resolve(temporaryRoot, "session'$(Get-ChildItem)");
  const result = await prepareChatGptSession({ output, root: repositoryRoot });
  const runbook = await readFile(result.runbookPath, "utf8");
  const escapedTranscriptPath = result.transcriptPath.replaceAll("'", "''");
  assert.ok(runbook.includes(`$env:ATLAS_CHATGPT_TRANSCRIPT = '${escapedTranscriptPath}'`));
  assert.ok(!runbook.includes(`$env:ATLAS_CHATGPT_TRANSCRIPT = "${result.transcriptPath}"`));
});

test("rejects an insecure non-loopback target or unsupported model", async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "atlas-chatgpt-session-"));
  await assert.rejects(
    () => prepareChatGptSession({ url: "http://example.com/explore", output: resolve(temporaryRoot, "insecure"), root: repositoryRoot }),
    /must use HTTPS/,
  );
  await assert.rejects(
    () => prepareChatGptSession({ url: "https://user:secret@example.com/explore", output: resolve(temporaryRoot, "credentialed"), root: repositoryRoot }),
    /must not include URL credentials/,
  );
  await assert.rejects(
    () => prepareChatGptSession({ url: "https://example.com/explore?value=$(Get-Item%20env:PATH)", output: resolve(temporaryRoot, "query"), root: repositoryRoot }),
    /must not include a query or fragment/,
  );
  await assert.rejects(
    () => prepareChatGptSession({ model: "GPT-5.6 Luna", output: resolve(temporaryRoot, "luna"), root: repositoryRoot }),
    /GPT-5.6 Sol or GPT-5.6 Terra/,
  );
});
