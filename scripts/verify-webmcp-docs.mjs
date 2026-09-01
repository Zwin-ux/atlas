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
const chatgptAcceptance = await readFile("docs/webmcp/CHATGPT_ACCEPTANCE.md", "utf8");
const chatgptE2e = await readFile("docs/webmcp/CHATGPT_E2E.md", "utf8");
const ralphLoop = await readFile("docs/webmcp/RALPH_RELEASE_LOOP.md", "utf8");
const releaseDesignAudit = await readFile("docs/webmcp/RELEASE_PRODUCT_DESIGN_AUDIT.md", "utf8");
const hciManual = await readFile("docs/webmcp/HCI_OPERATING_MANUAL.md", "utf8");
const officialCompatibility = await readFile("docs/webmcp/OFFICIAL_COMPATIBILITY.md", "utf8");

for (const name of toolNames) {
  assert(readme.includes(`\`${name}\``), `README is missing the ${name} tool.`);
  assert(submission.includes(`\`${name}\``), `Submission copy is missing the ${name} tool.`);
}

for (const [path, content] of story) {
  for (const pattern of forbiddenStoryPatterns) {
    assert(!pattern.test(content), `${path} leaks retired challenge scope through ${pattern}.`);
  }
}

assert((submission.match(/\[OWNER REQUIRED:/g) ?? []).length === 2, "Submission copy must keep the two remaining source/video owner placeholders.");
assert(readme.includes("https://atlas-webmcp-production.up.railway.app/explore") && submission.includes("https://atlas-webmcp-production.up.railway.app/explore"), "README and submission copy must link the verified live deployment.");
assert(submission.includes("Apache-2.0"), "Submission copy must identify the owner-selected Apache-2.0 license.");
assert(video.includes("Target runtime: **2:45**") && video.includes("Hard maximum: **2:55**"), "Video script must keep its under-three-minute budget.");
assert(readme.includes("docs/webmcp/SUBMISSION.md") && readme.includes("docs/webmcp/VIDEO_SCRIPT.md") && readme.includes("docs/webmcp/RELEASE_PACKET.md"), "README must link the release documents.");
assert(readme.includes("docs/webmcp/CHATGPT_ACCEPTANCE.md"), "README must link the ChatGPT Site Tools acceptance script.");
assert(readme.includes("docs/webmcp/CHATGPT_E2E.md"), "README must link the live ChatGPT end-to-end environment.");
assert(chatgptAcceptance.includes("GPT-5.6 Sol") && chatgptAcceptance.includes("GPT-5.6 Terra") && chatgptAcceptance.includes("GPT-5.6 Luna"), "ChatGPT acceptance must record the current supported-model boundary.");
assert(chatgptAcceptance.includes("mapChanged: false") && chatgptAcceptance.includes("stopNumber") && chatgptAcceptance.includes("Recently used"), "ChatGPT acceptance must cover ambiguity, trail recovery, and browser evidence.");
assert(chatgptE2e.includes("releaseReady") && chatgptE2e.includes("pnpm e2e:chatgpt:session") && chatgptE2e.includes("pnpm e2e:chatgpt") && chatgptE2e.includes("pnpm eval:webmcp:grok"), "ChatGPT E2E docs must include session preparation, distinguish complete evidence, and record the Grok lane.");
assert(chatgptE2e.includes("evidence/available-site-tools.png") && chatgptE2e.includes("relative evidence paths"), "ChatGPT E2E docs must define the portable acceptance evidence folder.");
assert(chatgptE2e.includes("page-native WebMCP") && chatgptE2e.includes("should not expose a second `/mcp` mutation path"), "ChatGPT E2E docs must preserve the shared-page architecture boundary.");
assert(ralphLoop.includes("one bounded Ralph iteration") && ralphLoop.includes("must not") && ralphLoop.includes("releaseReady: true"), "The Ralph loop must stay single-item, evidence-driven, and bounded by hard stops.");
assert(releaseDesignAudit.includes("390 × 844") && releaseDesignAudit.includes("three-county WebMCP trail") && releaseDesignAudit.includes("No high- or medium-severity"), "The live Product Design audit must cover mobile, the visible trail, and its release verdict.");
assert(hciManual.includes("ASD-STE100") && hciManual.includes("does not claim ASD-STE100 conformance") && hciManual.includes("W3C Cognitive Accessibility"), "The HCI manual must explain its cognitive-accessibility and plain-language standards boundary.");
assert(officialCompatibility.includes("41d12f057167ccf5954dbcf49d99502cb6c84491") && officialCompatibility.includes("https://github.com/webmachinelearning/webmcp/commit/41d12f057167ccf5954dbcf49d99502cb6c84491"), "The compatibility record must pin the reviewed WebMCP source revision.");
assert(officialCompatibility.includes("https://learn.chatgpt.com/docs/webmcp") && officialCompatibility.includes("top-level") && officialCompatibility.includes("document.modelContext.registerTool"), "The compatibility record must cover ChatGPT's current top-level imperative Site Tools subset.");
assert(officialCompatibility.includes("AbortSignal") && officialCompatibility.includes("untrustedContentHint") && officialCompatibility.includes("not add a remote `/mcp` mutation path"), "The compatibility record must cover lifecycle cancellation, untrusted output, and the shared-page architecture boundary.");
assert(release.includes("not safe to publish") && release.includes("## Owner gates"), "Release packet must preserve the public-safety stop gate.");

console.log(JSON.stringify({
  ok: true,
  judgeStoryFiles,
  tools: toolNames,
  ownerPlaceholders: 2,
  license: "Apache-2.0",
  videoTarget: "2:45",
  retiredScope: "absent",
}, null, 2));
