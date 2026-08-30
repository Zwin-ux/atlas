import { readFile } from "node:fs/promises";

const toolNames = ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"];
const judgeStoryFiles = ["README.md", "docs/webmcp/SUBMISSION.md", "docs/webmcp/VIDEO_SCRIPT.md"];
const forbiddenStoryPatterns = [
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

const entries = await Promise.all(judgeStoryFiles.map(async (path) => [path, await readFile(path, "utf8")]));
const story = new Map(entries);
const readme = story.get("README.md") ?? "";
const submission = story.get("docs/webmcp/SUBMISSION.md") ?? "";
const video = story.get("docs/webmcp/VIDEO_SCRIPT.md") ?? "";
const release = await readFile("docs/webmcp/RELEASE_PACKET.md", "utf8");

for (const name of toolNames) {
  assert(readme.includes(`\`${name}\``), `README is missing the ${name} tool.`);
  assert(submission.includes(`\`${name}\``), `Submission copy is missing the ${name} tool.`);
}

for (const [path, content] of story) {
  for (const pattern of forbiddenStoryPatterns) {
    assert(!pattern.test(content), `${path} leaks retired challenge scope through ${pattern}.`);
  }
}

assert((submission.match(/\[OWNER REQUIRED:/g) ?? []).length === 4, "Submission copy must keep four explicit owner placeholders.");
assert(video.includes("Target runtime: **2:45**") && video.includes("Hard maximum: **2:55**"), "Video script must keep its under-three-minute budget.");
assert(readme.includes("docs/webmcp/SUBMISSION.md") && readme.includes("docs/webmcp/VIDEO_SCRIPT.md") && readme.includes("docs/webmcp/RELEASE_PACKET.md"), "README must link the release documents.");
assert(release.includes("not safe to publish") && release.includes("## Owner gates"), "Release packet must preserve the public-safety stop gate.");

console.log(JSON.stringify({
  ok: true,
  judgeStoryFiles,
  tools: toolNames,
  ownerPlaceholders: 4,
  videoTarget: "2:45",
  retiredScope: "absent",
}, null, 2));
