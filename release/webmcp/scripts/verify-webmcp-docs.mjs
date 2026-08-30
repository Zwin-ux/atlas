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

for (const toolName of toolNames) {
  assert(readme.includes(`\`${toolName}\``), `README is missing ${toolName}.`);
  assert(submission.includes(`\`${toolName}\``), `Submission copy is missing ${toolName}.`);
}
for (const [path, body] of content) {
  for (const pattern of forbidden) assert(!pattern.test(body), `${path} leaks retired scope through ${pattern}.`);
}

assert((submission.match(/\[OWNER REQUIRED:/g) ?? []).length === 3, "Submission copy must retain exactly three external owner placeholders.");
assert(submission.includes("Apache-2.0"), "Submission copy must identify the owner-selected Apache-2.0 license.");
assert(video.includes("Target runtime: **2:45**") && video.includes("Hard maximum: **2:55**"), "The video must remain under three minutes.");
assert(readme.includes("docs/SUBMISSION.md") && readme.includes("docs/VIDEO_SCRIPT.md") && readme.includes("docs/EVALS.md"), "README must link the public challenge documents.");
assert(!submission.includes("WEBMCP_STATE.md") && !submission.includes("artifacts/webmcp-proof"), "Submission evidence must resolve inside the sanitized repository.");
assert(license.includes("Apache License") && license.includes("Version 2.0, January 2004"), "Apache-2.0 license text is missing.");

console.log(JSON.stringify({ ok: true, judgeFiles, ownerPlaceholders: 3, license: "Apache-2.0", retiredScope: "absent" }, null, 2));
