import { readFile } from "node:fs/promises";

const toolNames = ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"];
const judgeFiles = ["README.md", "docs/SUBMISSION.md", "docs/VIDEO_SCRIPT.md"];
const forbidden = [
  /\bScout\b/i,
  /Hosted Clawd/i,
  /\bAuth0\b/i,
  /Atlas Commons/i,
  /\bbilling\b/i,
  /\bpricing\b/i,
  /\bcheckout\b/i,
  /\bsubscriptions?\b/i,
  /campaign planning/i,
  /Apps SDK/i,
  /plugin submission/i,
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const content = new Map(await Promise.all(judgeFiles.map(async (path) => [path, await readFile(path, "utf8")])));
const readme = content.get("README.md") ?? "";
const submission = content.get("docs/SUBMISSION.md") ?? "";
const video = content.get("docs/VIDEO_SCRIPT.md") ?? "";
const license = await readFile("LICENSE", "utf8");
const chatgptAcceptance = await readFile("docs/CHATGPT_ACCEPTANCE.md", "utf8");
const chatgptE2e = await readFile("docs/CHATGPT_E2E.md", "utf8");

for (const toolName of toolNames) {
  assert(readme.includes(`\`${toolName}\``), `README is missing ${toolName}.`);
  assert(submission.includes(`\`${toolName}\``), `Submission copy is missing ${toolName}.`);
}
for (const [path, body] of content) {
  for (const pattern of forbidden) assert(!pattern.test(body), `${path} leaks retired scope through ${pattern}.`);
}

assert((submission.match(/\[OWNER REQUIRED:/g) ?? []).length === 2, "Submission copy must retain exactly the two source/video owner placeholders.");
assert(readme.includes("https://atlas-webmcp-production.up.railway.app/explore") && submission.includes("https://atlas-webmcp-production.up.railway.app/explore"), "README and submission copy must link the verified live deployment.");
assert(submission.includes("Apache-2.0"), "Submission copy must identify the owner-selected Apache-2.0 license.");
assert(video.includes("Target runtime: **2:45**") && video.includes("Hard maximum: **2:55**"), "The video must remain under three minutes.");
assert(readme.includes("docs/SUBMISSION.md") && readme.includes("docs/VIDEO_SCRIPT.md") && readme.includes("docs/EVALS.md"), "README must link the public challenge documents.");
assert(readme.includes("docs/CHATGPT_ACCEPTANCE.md"), "README must link the ChatGPT Site Tools acceptance script.");
assert(readme.includes("docs/CHATGPT_E2E.md"), "README must link the live ChatGPT end-to-end environment.");
assert(chatgptAcceptance.includes("GPT-5.6 Sol") && chatgptAcceptance.includes("GPT-5.6 Terra") && chatgptAcceptance.includes("GPT-5.6 Luna"), "ChatGPT acceptance must record the current supported-model boundary.");
assert(chatgptAcceptance.includes("mapChanged: false") && chatgptAcceptance.includes("stopNumber") && chatgptAcceptance.includes("Recently used"), "ChatGPT acceptance must cover ambiguity, trail recovery, and browser evidence.");
assert(chatgptE2e.includes("releaseReady") && chatgptE2e.includes("pnpm e2e:chatgpt") && chatgptE2e.includes("pnpm eval:webmcp:grok"), "ChatGPT E2E docs must distinguish complete evidence and record the Grok lane.");
assert(chatgptE2e.includes("page-native WebMCP") && chatgptE2e.includes("should not expose a second `/mcp` mutation path"), "ChatGPT E2E docs must preserve the shared-page architecture boundary.");
assert(!submission.includes("WEBMCP_STATE.md") && !submission.includes("artifacts/webmcp-proof"), "Submission evidence must resolve inside the sanitized repository.");
assert(license.includes("Apache License") && license.includes("Version 2.0, January 2004"), "Apache-2.0 license text is missing.");

console.log(JSON.stringify({ ok: true, judgeFiles, ownerPlaceholders: 2, license: "Apache-2.0", retiredScope: "absent" }, null, 2));
