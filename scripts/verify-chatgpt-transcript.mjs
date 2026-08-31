import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

const EXPECTED_TOOLS = [
  ["get_map_state", "What's on the Atlas map"],
  ["search_places", "Find U.S. places"],
  ["open_place", "Show a place on Atlas"],
  ["add_map_note", "Add a place note"],
  ["create_map_trail", "Build a research trail"],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function step(transcript, id) {
  const match = transcript.steps.find((candidate) => candidate?.id === id);
  assert(match, `The transcript is missing ${id}.`);
  return match;
}

const args = process.argv.slice(2);
const allowTemplate = args.includes("--allow-template");
const pathArg = args.find((arg) => !arg.startsWith("--")) ?? process.env.ATLAS_CHATGPT_TRANSCRIPT;
assert(pathArg, "Usage: node scripts/verify-chatgpt-transcript.mjs <transcript.json>");

const transcriptPath = resolve(pathArg);
const transcriptDirectory = dirname(transcriptPath);
const transcript = JSON.parse(await readFile(transcriptPath, "utf8"));
assert(transcript.schemaVersion === 1, "The ChatGPT transcript schemaVersion must be 1.");
assert(transcript.status === "captured" || (allowTemplate && transcript.status === "template"), "A release transcript must have status captured.");

const url = new URL(transcript.url);
if (transcript.status === "captured") {
  assert(url.protocol === "https:" && url.pathname === "/explore", "A captured transcript must target the deployed HTTPS /explore route.");
  assert(!/replace-with|example/i.test(url.hostname), "A captured transcript cannot use a placeholder host.");
  assert(Number.isFinite(Date.parse(transcript.capturedAt)), "A captured transcript needs a valid capturedAt timestamp.");
}

assert(transcript.client?.name === "ChatGPT desktop", "The acceptance client must be ChatGPT desktop.");
assert(["GPT-5.6 Sol", "GPT-5.6 Terra"].includes(transcript.client?.model), "Site Tools acceptance must use GPT-5.6 Sol or GPT-5.6 Terra.");
if (transcript.status === "captured") {
  assert(typeof transcript.client.version === "string" && !/record_me/i.test(transcript.client.version), "Record the ChatGPT desktop version.");
}

assert(Array.isArray(transcript.siteTools) && transcript.siteTools.length === EXPECTED_TOOLS.length, "The transcript must record exactly five Site Tools.");
assert(
  JSON.stringify(transcript.siteTools.map(({ name, title }) => [name, title])) === JSON.stringify(EXPECTED_TOOLS),
  "The recorded Site Tools names or titles do not match the Atlas exact-five contract.",
);

assert(Array.isArray(transcript.steps), "The transcript steps must be an array.");
if (transcript.status === "captured") {
  assert(transcript.steps.every((candidate) => candidate?.observed === true), "Every captured step must be marked observed after copying the real ChatGPT call.");
}
const usedTools = new Set(transcript.steps.map((candidate) => candidate?.tool));
for (const [name] of EXPECTED_TOOLS) assert(usedTools.has(name), `The transcript never called ${name}.`);
assert([...usedTools].every((name) => EXPECTED_TOOLS.some(([expected]) => expected === name)), "The transcript contains a tool outside the exact-five cut.");

const initial = step(transcript, "initial_state");
assert(initial.tool === "get_map_state" && initial.result?.ok === true, "The initial state read is invalid.");

const ambiguousSearch = step(transcript, "ambiguous_search");
assert(ambiguousSearch.tool === "search_places", "The Springfield discovery step must use search_places.");
assert(ambiguousSearch.result?.ok === true && ambiguousSearch.result?.candidates?.length > 1, "Springfield search must return multiple candidates.");

const opened = step(transcript, "open_resolved_place");
assert(opened.tool === "open_place", "Resolved navigation must use open_place.");
assert(opened.result?.ok === true && opened.result?.mapChanged === true && opened.result?.visible === true, "open_place must report a visible map change.");
assert(opened.result?.view?.level === "county", "open_place must finish on the county view.");

const note = step(transcript, "add_visible_note");
assert(note.tool === "add_map_note", "The note step must use add_map_note.");
assert(note.result?.ok === true && note.result?.mapChanged === true && note.result?.noteAdded === true && note.result?.visible === true, "The note must be visible before success.");

const trail = step(transcript, "create_visible_trail");
assert(trail.tool === "create_map_trail", "The trail step must use create_map_trail.");
assert(trail.result?.ok === true && trail.result?.mapChanged === true && trail.result?.trailChanged === true && trail.result?.visible === true, "The trail must be visible before success.");
assert(trail.result?.view?.level === "nation" && trail.result?.view?.overlay === "research_trail", "Trail creation must finish on the national overlay.");
assert(trail.result?.stopCount === 3, "The acceptance trail must contain three stops.");

const humanState = step(transcript, "manual_stop_state");
assert(humanState.tool === "get_map_state" && typeof humanState.humanAction === "string", "The manual marker action must be followed by get_map_state.");
assert(humanState.result?.ok === true && humanState.result?.current?.level === "county", "The agent did not read the county opened by the person.");
assert(humanState.result?.current?.countySlug === "miami-dade-fl", "The manual stop handoff must read Miami-Dade County from marker 2.");
assert(humanState.result?.trail?.activeIndex === 1, "The manual stop handoff must preserve one-based stop 2 as zero-based activeIndex 1.");

const ambiguousOpen = step(transcript, "ambiguous_open_unchanged");
assert(ambiguousOpen.tool === "open_place", "The ambiguous write check must use open_place.");
assert(ambiguousOpen.result?.ok === false && ambiguousOpen.result?.mapChanged === false, "Ambiguous open_place must report that the map stayed unchanged.");
assert(ambiguousOpen.result?.error?.candidates?.length > 1, "Ambiguous open_place must return candidates.");

const failedTrail = step(transcript, "failed_trail_unchanged");
assert(failedTrail.tool === "create_map_trail", "The atomic failure check must use create_map_trail.");
assert(failedTrail.result?.ok === false && failedTrail.result?.mapChanged === false && failedTrail.result?.trailChanged === false, "A failed trail must report no map or trail change.");
assert(failedTrail.result?.stopNumber === 2, "The failed trail must identify its one-based failing stop.");

const evidenceManifest = {};
if (transcript.status === "captured") {
  const evidence = transcript.evidence ?? {};
  for (const key of ["availableSiteToolsScreenshot", "recentlyUsedScreenshot", "trailScreenshot", "consoleOrNotes"]) {
    assert(typeof evidence[key] === "string" && evidence[key].trim() && !/record_me/i.test(evidence[key]), `Record ${key} evidence.`);
    const evidencePath = isAbsolute(evidence[key]) ? resolve(evidence[key]) : resolve(transcriptDirectory, evidence[key]);
    const info = await stat(evidencePath).catch(() => undefined);
    assert(info?.isFile() && info.size > 0, `${key} must point to a non-empty local evidence file.`);
    const body = await readFile(evidencePath);
    evidenceManifest[key] = {
      path: evidencePath,
      bytes: body.byteLength,
      sha256: createHash("sha256").update(body).digest("hex"),
    };
  }
}

console.log(JSON.stringify({
  ok: true,
  status: transcript.status,
  url: transcript.url,
  model: transcript.client.model,
  tools: EXPECTED_TOOLS.map(([name]) => name),
  steps: transcript.steps.length,
  writesVisible: 3,
  failuresUnchanged: 2,
  evidence: evidenceManifest,
}, null, 2));
