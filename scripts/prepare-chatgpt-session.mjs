import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_URL = "https://atlas-webmcp-production.up.railway.app/explore";
const SUPPORTED_MODELS = new Set(["GPT-5.6 Sol", "GPT-5.6 Terra"]);

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function sessionStamp(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function assertTargetUrl(value) {
  const url = new URL(value);
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) {
    throw new Error("A ChatGPT acceptance session must use HTTPS unless the target is loopback.");
  }
  if (url.pathname !== "/explore") throw new Error("A ChatGPT acceptance session must target the /explore route.");
  return url.toString();
}

async function assertMissing(path) {
  const info = await stat(path).catch(() => undefined);
  if (info) throw new Error(`Refusing to overwrite an existing ChatGPT acceptance session: ${path}`);
}

function runbook({ url, model, transcriptPath }) {
  return `# Atlas real ChatGPT acceptance session

Target: ${url}

Model: ${model}

This folder is ignored release evidence. Do not commit it, account screenshots, tokens, or browser-session data.

## Before the conversation

1. Use the latest ChatGPT desktop app in a non-Enterprise, non-Edu workspace.
2. Select ${model}. GPT-5.6 Luna does not support Site Tools.
3. Open the target in the built-in browser.
4. In the address bar, open **Site tools → Available site tools**.
5. Confirm exactly five Atlas tools and save the screenshot as \`evidence/available-site-tools.png\`.

## Conversation

Run these prompts in order and copy the observed arguments/results into \`transcript.json\`:

1. **State:** “What am I looking at in Atlas right now?”
2. **Ambiguity:** “I'd like to look at Springfield, but I'm not sure which state. Show me the choices first.”
3. **Open:** “Take me to Riverside County, California.”
4. **Note:** “At Miami-Dade County, Florida, leave this note for me: Compare transit access around county offices.”
5. **Trail:** “Set up a research trail called County access check: first Riverside County, CA for public records, then Miami-Dade County, FL for transit access, then Travis County, TX for meeting notices.”
6. Click marker 2 yourself, then ask: “What am I looking at now?”
7. **Ambiguous write:** “Open Springfield.”
8. **Atomic failure:** “Build a trail from Riverside County to Atlantis-by-the-Pacific.”

Save the completed trail as \`evidence/trail.png\`. Open **Recently used** / Sources and save \`evidence/recently-used.png\`. Record the app version and any console/QA notes in \`evidence/console-or-notes.txt\`.

## Validate

Set \`status\` to \`captured\`, replace every \`RECORD_ME\` value, replace the sample arguments/results with the real calls, and set \`observed\` to \`true\` on every completed step. Then run from the Atlas repository:

\`\`\`powershell
$env:ATLAS_CHATGPT_TRANSCRIPT = "${transcriptPath}"
pnpm e2e:chatgpt:transcript
$env:ATLAS_CHATGPT_URL = "${url}"
pnpm e2e:chatgpt
\`\`\`

The validator resolves evidence paths relative to this transcript, hashes every file, rejects extra tools, and fails if a write reported success before becoming visible or if an ambiguous/failed write mutated the map.
`;
}

export async function prepareChatGptSession({
  url = DEFAULT_URL,
  model = "GPT-5.6 Sol",
  output,
  now = new Date(),
  root = scriptRoot,
} = {}) {
  const targetUrl = assertTargetUrl(url);
  if (!SUPPORTED_MODELS.has(model)) throw new Error("Use GPT-5.6 Sol or GPT-5.6 Terra for a Site Tools acceptance session.");

  const directory = resolve(output ?? resolve(root, ".evals/chatgpt-e2e/sessions", sessionStamp(now)));
  await assertMissing(directory);

  const transcriptPath = resolve(directory, "transcript.json");
  const evidenceDirectory = resolve(directory, "evidence");
  const runbookPath = resolve(directory, "RUNBOOK.md");
  const template = JSON.parse(await readFile(resolve(root, "evals/atlas-chatgpt.transcript.template.json"), "utf8"));
  const transcript = {
    ...template,
    capturedAt: now.toISOString(),
    url: targetUrl,
    client: { ...template.client, model },
    evidence: {
      availableSiteToolsScreenshot: "evidence/available-site-tools.png",
      recentlyUsedScreenshot: "evidence/recently-used.png",
      trailScreenshot: "evidence/trail.png",
      consoleOrNotes: "evidence/console-or-notes.txt",
    },
  };

  await mkdir(evidenceDirectory, { recursive: true });
  await writeFile(transcriptPath, `${JSON.stringify(transcript, null, 2)}\n`, "utf8");
  await writeFile(runbookPath, runbook({ url: targetUrl, model, transcriptPath }), "utf8");

  return { directory, transcriptPath, runbookPath, evidenceDirectory, url: targetUrl, model };
}

async function main() {
  const args = process.argv.slice(2);
  const result = await prepareChatGptSession({
    url: option(args, "--url") ?? process.env.ATLAS_CHATGPT_URL ?? DEFAULT_URL,
    model: option(args, "--model") ?? process.env.ATLAS_CHATGPT_MODEL ?? "GPT-5.6 Sol",
    output: option(args, "--output") ?? process.env.ATLAS_CHATGPT_SESSION_DIR,
  });
  console.log(JSON.stringify({
    ok: true,
    ...result,
    nextAction: "Open RUNBOOK.md, perform the real ChatGPT desktop journey, fill transcript.json, then run pnpm e2e:chatgpt:transcript.",
  }, null, 2));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
