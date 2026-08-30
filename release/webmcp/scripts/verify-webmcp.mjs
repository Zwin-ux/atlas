import { readFile } from "node:fs/promises";

const expected = ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cssRule(source, selector, startAt = 0) {
  const selectorIndex = source.indexOf(selector, startAt);
  if (selectorIndex === -1) return "";
  const blockStart = source.indexOf("{", selectorIndex);
  const blockEnd = source.indexOf("}", blockStart);
  return blockStart === -1 || blockEnd === -1 ? "" : source.slice(blockStart + 1, blockEnd);
}

const [toolsSource, registrySource, evalSchemaSource, mainSource, finderSource, appSource, plateSource, geometrySource, cssSource, serverSource, packageSource, modelEvalsSource, smokeEvalsSource, evalRunnerSource, chatgptRunnerSource, livePreflightSource, transcriptVerifierSource, transcriptTemplateSource, grokRunnerSource] = await Promise.all([
  readFile("web/src/atlas/webmcpTools.ts", "utf8"),
  readFile("web/src/atlas/webmcpRegistry.ts", "utf8"),
  readFile("web/src/atlas/webmcpEvalSchema.ts", "utf8"),
  readFile("web/src/main.tsx", "utf8"),
  readFile("web/src/atlas/AtlasPlaceFinder.tsx", "utf8"),
  readFile("web/src/atlas/AtlasApp.tsx", "utf8"),
  readFile("web/src/atlas/AtlasPlate.tsx", "utf8"),
  readFile("web/src/atlas/plateGeometry.ts", "utf8"),
  readFile("web/src/atlas/atlas.css", "utf8"),
  readFile("server/src/index.ts", "utf8"),
  readFile("package.json", "utf8"),
  readFile("evals/atlas-webmcp.evals.json", "utf8"),
  readFile("evals/atlas-webmcp.smoke.json", "utf8"),
  readFile("scripts/run-webmcp-evals.mjs", "utf8"),
  readFile("scripts/run-chatgpt-e2e.mjs", "utf8"),
  readFile("scripts/verify-chatgpt-live.mjs", "utf8"),
  readFile("scripts/verify-chatgpt-transcript.mjs", "utf8"),
  readFile("evals/atlas-chatgpt.transcript.template.json", "utf8"),
  readFile("scripts/run-grok-webmcp-evals.mjs", "utf8"),
]);

const packageJson = JSON.parse(packageSource);
const modelEvals = JSON.parse(modelEvalsSource);
const smokeEvals = JSON.parse(smokeEvalsSource);
const transcriptTemplate = JSON.parse(transcriptTemplateSource);
const registeredNames = [...toolsSource.matchAll(/\n\s+name: "([a-z_]+)",/g)].map((match) => match[1]);
assert(modelEvals.length === 12, "The judge-facing agent-understanding claim requires the exact 12-case model suite.");

function functionNames(value, names = []) {
  if (Array.isArray(value)) {
    for (const item of value) functionNames(item, names);
  } else if (value && typeof value === "object") {
    if (typeof value.functionName === "string") names.push(value.functionName);
    for (const child of Object.values(value)) functionNames(child, names);
  }
  return names;
}

assert(JSON.stringify(registeredNames) === JSON.stringify(expected), `Expected exactly ${expected.join(", ")}; found ${registeredNames.join(", ")}.`);
assert(!/select_county|scout|campaign|hosted_clawd/i.test(registeredNames.join(" ")), "A retired tool leaked into the public cut.");
assert((toolsSource.match(/additionalProperties: false/g) ?? []).length >= 6, "Tool schemas must reject extra root and nested properties.");
assert((toolsSource.match(/context\?\.signal/g) ?? []).length === 4, "Async tools must accept Chrome's optional invocation context.");
assert(registrySource.includes("Promise.all(") && registrySource.includes("lifecycle.abort()"), "Registration must be all-or-none with rollback.");
assert(evalSchemaSource.includes("createAtlasWebMcpTools(controller)"), "Eval schemas must come from runtime descriptors.");
assert(mainSource.includes("<ChallengeAtlas />") && mainSource.includes("mountAtlasWebMcp(controller)"), "The top-level page must mount the WebMCP registry.");
assert(!mainSource.includes("LegacyAtlasWidget") && !mainSource.includes("useToolPlate"), "The standalone challenge entry must not include the historical widget writer.");
assert(finderSource.includes("controller.openPlace(") && finderSource.includes("controller.openCandidate("), "Human place actions must use the shared controller.");
assert(appSource.includes("onOpenTrailStop={openTrailStop}"), "Trail markers and the rail must share the controller path.");
assert(appSource.includes("Map ready · Site tools not detected"), "Normal-browser fallback must read as a usable map state.");
assert(appSource.includes("Research trail") && appSource.includes("session only"), "The trail rail must expose its purpose and session boundary.");
assert(appSource.includes('aria-current={active ? "step" : undefined}') && appSource.includes("atlas-app__trail-current"), "The active trail stop requires semantic and visible non-color cues.");
assert(plateSource.includes("geometry.countyCenters") && geometrySource.includes("countyCenters"), "The national trail overlay requires projected county centers.");
assert(plateSource.includes('atlas-plate${trailStops.length > 0 ? " has-trail" : ""}') && cssSource.includes(".atlas-plate.has-trail"), "Trail mode must reduce label competition deliberately.");
const mobileCssStart = cssSource.indexOf("@media (max-width: 720px)");
assert(
  cssRule(cssSource, ".atlas-app__trail-title").includes("min-height: 32px")
    && cssRule(cssSource, ".atlas-app__trail-place").includes("min-height: 32px")
    && cssRule(cssSource, ".atlas-app__trail li input").includes("min-height: 32px")
    && cssRule(cssSource, ".atlas-app__remove").includes("width: 32px")
    && cssRule(cssSource, ".atlas-app__remove").includes("height: 32px")
    && cssRule(cssSource, ".atlas-app__trail-title,", mobileCssStart).includes("min-height: 44px")
    && cssRule(cssSource, ".atlas-app__remove", mobileCssStart).includes("width: 44px")
    && cssRule(cssSource, ".atlas-app__remove", mobileCssStart).includes("height: 44px"),
  "Research controls must keep 32px desktop and 44px mobile target floors.",
);
assert(!toolsSource.includes("countyCenters"), "Raw/internal trail geometry must not enter tool output.");
assert(serverSource.includes('"origin-agent-cluster": "?1"') && serverSource.includes('"permissions-policy": "tools=(self)"'), "Judge routes require WebMCP-compatible response headers.");
assert(!/@atlas\//.test(serverSource), "The standalone server must not depend on the historical workspace packages.");
assert(packageJson.devDependencies?.["webmcp-evals"] === "0.0.4", "webmcp-evals must stay pinned to 0.0.4.");
assert(Object.keys(packageJson.dependencies ?? {}).sort().join(",") === "react,react-dom", "Runtime dependencies must stay at the two-package public cut.");
assert(["eval:webmcp:static", "eval:webmcp:browser", "eval:webmcp:smoke", "eval:webmcp:grok", "e2e:chatgpt:preflight", "e2e:chatgpt:transcript", "e2e:chatgpt"].every((script) => packageJson.scripts?.[script]), "Static, browser, smoke, Grok, and ChatGPT end-to-end commands are required.");
assert(evalRunnerSource.includes("Math.max(3, requestedRuns)") && evalRunnerSource.includes("Math.max(0.90, requestedThreshold)"), "Model thresholds must stay at three runs and 90% minimum.");
assert(evalRunnerSource.includes('model.startsWith("xai:")') && evalRunnerSource.includes("XAI_API_KEY") && evalRunnerSource.includes("https://api.x.ai/v1"), "The xAI model lane must use the explicit Grok adapter and environment credential.");
assert(grokRunnerSource.includes('xai:grok-4.6') && !grokRunnerSource.includes("OPENAI_API_KEY"), "The focused Grok runner must select grok-4.6 without copying credentials into source.");
assert(chatgptRunnerSource.includes("verify-chatgpt-live.mjs") && chatgptRunnerSource.includes('run-webmcp-evals.mjs", ["smoke"]') && chatgptRunnerSource.includes("verify-chatgpt-transcript.mjs"), "The ChatGPT runner must compose live preflight, protocol smoke, and transcript proof.");
assert(chatgptRunnerSource.includes("releaseReady") && chatgptRunnerSource.includes("realChatGpt") && chatgptRunnerSource.includes("modelThreshold"), "The ChatGPT report must distinguish automated success from complete release evidence.");
assert(livePreflightSource.includes("tools=(self)") && livePreflightSource.includes("Springfield") && livePreflightSource.includes("Riverside"), "The live preflight must cover WebMCP headers and ambiguity/resolution contracts.");
assert(transcriptVerifierSource.includes("status captured") && transcriptVerifierSource.includes("mapChanged === false") && transcriptVerifierSource.includes("trailChanged === false") && transcriptVerifierSource.includes('countySlug === "miami-dade-fl"') && transcriptVerifierSource.includes('createHash("sha256")'), "The transcript verifier must reject placeholders, bind the human handoff to stop 2, hash evidence, and verify mutation-safe failures.");
assert(transcriptTemplate.status === "template" && transcriptTemplate.siteTools.length === expected.length, "The real ChatGPT transcript template must preserve the exact-five cut.");
assert(JSON.stringify(transcriptTemplate.siteTools.map(({ name }) => name)) === JSON.stringify(expected), "The ChatGPT transcript template tool order drifted.");
assert(JSON.stringify(transcriptTemplate.steps.map(({ id }) => id)) === JSON.stringify(["initial_state", "ambiguous_search", "open_resolved_place", "add_visible_note", "create_visible_trail", "manual_stop_state", "ambiguous_open_unchanged", "failed_trail_unchanged"]), "The ChatGPT transcript template must cover the complete shared-map acceptance journey.");

for (const suite of [modelEvals, smokeEvals]) {
  const names = functionNames(suite);
  assert(names.every((name) => expected.includes(name)), "An eval references a tool outside the exact-five cut.");
  assert(expected.every((name) => names.includes(name)), "An eval suite does not cover all five tools.");
}

assert(modelEvals.some((entry) => entry.name.startsWith("[follow-up]") && entry.messages.length >= 3), "Model evals must cover conversational place clarification.");
assert(modelEvals.some((entry) => entry.name.startsWith("[human-action]")), "Model evals must cover reading state after a person changes the shared map.");
assert(toolsSource.includes("mapChanged: false") && toolsSource.includes("visible: true") && toolsSource.includes("stopNumber"), "Write results must expose visible success and bounded recovery state to ChatGPT.");

console.log(JSON.stringify({ ok: true, tools: expected, entry: "standalone top-level", dependencies: ["react", "react-dom"] }, null, 2));
