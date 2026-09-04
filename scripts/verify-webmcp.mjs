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

const [toolsSource, registrySource, evalSchemaSource, mainSource, finderSource, appSource, plateSource, geometrySource, cssSource, serverSource, packageSource, modelEvalsSource, smokeEvalsSource, evalRunnerSource, chatgptSessionSource, chatgptRunnerSource, livePreflightSource, transcriptVerifierSource, transcriptTemplateSource, grokRunnerSource, railwayConfigSource, hciManualSource, demoAssemblerSource, releaseAssemblerSource] = await Promise.all([
  readFile(new URL("../web/src/atlas/webmcpTools.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/webmcpRegistry.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/webmcpEvalSchema.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/main.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasPlaceFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasApp.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasPlate.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/plateGeometry.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/atlas.css", import.meta.url), "utf8"),
  readFile(new URL("../server/src/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../evals/atlas-webmcp.evals.json", import.meta.url), "utf8"),
  readFile(new URL("../evals/atlas-webmcp.smoke.json", import.meta.url), "utf8"),
  readFile(new URL("./run-webmcp-evals.mjs", import.meta.url), "utf8"),
  readFile(new URL("./prepare-chatgpt-session.mjs", import.meta.url), "utf8"),
  readFile(new URL("./run-chatgpt-e2e.mjs", import.meta.url), "utf8"),
  readFile(new URL("./verify-chatgpt-live.mjs", import.meta.url), "utf8"),
  readFile(new URL("./verify-chatgpt-transcript.mjs", import.meta.url), "utf8"),
  readFile(new URL("../evals/atlas-chatgpt.transcript.template.json", import.meta.url), "utf8"),
  readFile(new URL("./run-grok-webmcp-evals.mjs", import.meta.url), "utf8"),
  readFile(new URL("../release/webmcp/railway.toml", import.meta.url), "utf8"),
  readFile(new URL("../docs/webmcp/HCI_OPERATING_MANUAL.md", import.meta.url), "utf8"),
  readFile(new URL("./assemble-webmcp-demo.mjs", import.meta.url), "utf8"),
  readFile(new URL("./assemble-webmcp-release.mjs", import.meta.url), "utf8"),
]);

const packageJson = JSON.parse(packageSource);
const modelEvals = JSON.parse(modelEvalsSource);
const smokeEvals = JSON.parse(smokeEvalsSource);
const transcriptTemplate = JSON.parse(transcriptTemplateSource);

function collectFunctionNames(value, names = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectFunctionNames(item, names);
  } else if (value && typeof value === "object") {
    if (typeof value.functionName === "string") names.push(value.functionName);
    for (const child of Object.values(value)) collectFunctionNames(child, names);
  }
  return names;
}

const registeredNames = [...toolsSource.matchAll(/\n\s+name: "([a-z_]+)",/g)].map((match) => match[1]);
assert(JSON.stringify(registeredNames) === JSON.stringify(expected), `Expected exactly ${expected.join(", ")}; found ${registeredNames.join(", ")}`);
assert(!/select_county|scout|campaign|hosted_clawd/.test(registeredNames.join(" ")), "Retired tools leaked into the WebMCP cut.");
assert((toolsSource.match(/additionalProperties: false/g) ?? []).length >= 6, "Root and nested schemas must reject extra properties.");
assert(registrySource.includes("Promise.all("), "Tool registration must be all-or-none.");
assert(registrySource.includes("lifecycle.abort()"), "Partial registration must roll back through one lifecycle signal.");
assert(registrySource.includes("if (lifecycle.signal.aborted) return;"), "Normal AbortSignal cleanup must not be reported as a Site Tools registration failure.");
assert((toolsSource.match(/context\?\.signal/g) ?? []).length === 4, "Async descriptors must support Chrome's one-argument invocation while preserving optional abort signals.");
assert(evalSchemaSource.includes("createAtlasWebMcpTools(controller)"), "Eval schemas must be projected from the real runtime descriptors.");
assert(packageJson.devDependencies?.["webmcp-evals"] === "0.0.4", "webmcp-evals must stay pinned to 0.0.4.");
assert(["eval:webmcp:static", "eval:webmcp:browser", "eval:webmcp:smoke", "eval:webmcp:grok", "e2e:chatgpt:preflight", "e2e:chatgpt:session", "e2e:chatgpt:transcript", "e2e:chatgpt"].every((script) => packageJson.scripts?.[script]), "Static, browser, smoke, Grok, and ChatGPT end-to-end commands are required.");
assert(packageJson.scripts?.["demo:webmcp:assemble"] === "node scripts/assemble-webmcp-demo.mjs", "The release demo must retain its reproducible assembly command.");
assert(demoAssemblerSource.includes("proofManifest.candidateSha") && demoAssemblerSource.includes("proof-manifest hash") && demoAssemblerSource.includes("docs/evidence/39d1e141") && demoAssemblerSource.includes("durationSeconds < 180"), "The demo assembler must bind frames to the proof candidate, work in the sanitized tree, and enforce the time limit.");
assert(releaseAssemblerSource.includes('"scripts/assemble-webmcp-demo.mjs"') && releaseAssemblerSource.includes('"docs/webmcp/VIDEO_PRODUCTION.md"') && releaseAssemblerSource.includes('artifacts/product-design-audit/judge-presentation-20260903/03-trail-after-curved.png') && releaseAssemblerSource.includes('replaceAll("artifacts/webmcp-release-proof/39d1e141-20260902/", "docs/evidence/39d1e141/")'), "The sanitized release must include the demo assembler, current curved-trail hero, production truth boundary, and portable proof paths.");
assert(evalRunnerSource.includes("Math.max(3, requestedRuns)"), "Model evals must not run fewer than three trajectories per case.");
assert(evalRunnerSource.includes("Math.max(0.90, requestedThreshold)"), "Model evals must not weaken the 90% release threshold.");
assert(evalRunnerSource.includes('model.startsWith("xai:")') && evalRunnerSource.includes("XAI_API_KEY") && evalRunnerSource.includes("https://api.x.ai/v1"), "The xAI model lane must use the explicit Grok adapter and environment credential.");
assert(grokRunnerSource.includes('xai:grok-4.6') && !grokRunnerSource.includes("OPENAI_API_KEY"), "The focused Grok runner must select grok-4.6 without copying credentials into source.");
assert(railwayConfigSource.startsWith('"$schema" = "https://railway.com/railway.schema.json"'), "Railway's schema key must be quoted so the deployment config is valid TOML.");
assert(railwayConfigSource.includes('buildCommand = "corepack enable && pnpm install --frozen-lockfile && pnpm build"') && railwayConfigSource.includes('startCommand = "pnpm start"') && railwayConfigSource.includes('healthcheckPath = "/ready"'), "Railway must install reproducibly, build, start, and health-check the standalone challenge service.");
assert(chatgptRunnerSource.includes("verify-chatgpt-live.mjs") && chatgptRunnerSource.includes('run-webmcp-evals.mjs", ["smoke"]') && chatgptRunnerSource.includes("verify-chatgpt-transcript.mjs"), "The ChatGPT runner must compose live preflight, protocol smoke, and transcript proof.");
assert(chatgptRunnerSource.includes("releaseReady") && chatgptRunnerSource.includes("realChatGpt") && chatgptRunnerSource.includes("modelThreshold"), "The ChatGPT report must distinguish automated success from complete release evidence.");
assert(chatgptSessionSource.includes("Refusing to overwrite") && chatgptSessionSource.includes("must not include URL credentials") && chatgptSessionSource.includes("powershellLiteral") && chatgptSessionSource.includes("evidence/available-site-tools.png") && chatgptSessionSource.includes("evidence/springfield-candidates.png") && chatgptSessionSource.includes("GPT-5.6 Luna does not support Site Tools"), "ChatGPT session preparation must be isolated, evidence-ready, shell-safe, and model-aware.");
assert(livePreflightSource.includes("tools=(self)") && livePreflightSource.includes("Springfield") && livePreflightSource.includes("Riverside"), "The live preflight must cover WebMCP headers and ambiguity/resolution contracts.");
assert(transcriptVerifierSource.includes("status captured") && transcriptVerifierSource.includes("observed === true") && transcriptVerifierSource.includes("observedAt timestamp") && transcriptVerifierSource.includes("callId must be unique") && transcriptVerifierSource.includes("mapChanged === false") && transcriptVerifierSource.includes("trailChanged === false") && transcriptVerifierSource.includes('countySlug === "miami-dade-fl"') && transcriptVerifierSource.includes('createHash("sha256")'), "The transcript verifier must reject copied samples and placeholders, bind the human handoff to stop 2, hash evidence, and verify mutation-safe failures.");
assert(transcriptVerifierSource.includes("ambiguous_open_state") && transcriptVerifierSource.includes("failed_trail_state") && transcriptVerifierSource.includes("exactly match the prior visible workspace"), "Real ChatGPT proof must use post-failure state reads instead of trusting write self-reports alone.");
assert(transcriptVerifierSource.includes("dirname(transcriptPath)") && transcriptVerifierSource.includes("must stay inside the session evidence folder") && transcriptVerifierSource.includes("10_000_000") && transcriptVerifierSource.includes("PNG screenshot"), "ChatGPT evidence must remain portable, contained, bounded, and image-validated.");
assert(transcriptTemplate.status === "template" && transcriptTemplate.siteTools.length === expected.length, "The real ChatGPT transcript template must preserve the exact-five cut.");
assert(transcriptTemplate.steps.every((step) => step.observed === false), "Every ChatGPT template step must remain explicitly unobserved until a real client call is recorded.");
assert(JSON.stringify(transcriptTemplate.siteTools.map(({ name }) => name)) === JSON.stringify(expected), "The ChatGPT transcript template tool order drifted.");
assert(JSON.stringify(transcriptTemplate.steps.map(({ id }) => id)) === JSON.stringify(["initial_state", "ambiguous_search", "open_resolved_place", "add_visible_note", "create_visible_trail", "manual_stop_state", "ambiguous_open_unchanged", "ambiguous_open_state", "failed_trail_unchanged", "failed_trail_state"]), "The ChatGPT transcript template must cover the complete shared-map acceptance journey and verify failure state reads.");
assert(typeof transcriptTemplate.evidence?.springfieldCandidatesScreenshot === "string", "The ChatGPT evidence pack must include Springfield candidate proof.");
const modelEvalNames = collectFunctionNames(modelEvals);
const smokeEvalNames = collectFunctionNames(smokeEvals);
assert(modelEvals.length === 12, "The judge-facing agent-understanding claim requires the exact 12-case model suite.");
assert(modelEvalNames.every((name) => expected.includes(name)), "Model evals reference a tool outside the exact-five cut.");
assert(smokeEvalNames.every((name) => expected.includes(name)), "Smoke evals reference a tool outside the exact-five cut.");
assert(expected.every((name) => modelEvalNames.includes(name) && smokeEvalNames.includes(name)), "Both eval suites must exercise all five tools.");
assert(modelEvals.some((entry) => entry.expectedCall === null), "Model evals must include a no-tool request.");
assert(modelEvals.filter((entry) => entry.name.startsWith("[critical]")).length >= 3, "Model evals must identify critical write/atomicity trajectories.");
assert(modelEvals.some((entry) => entry.name.startsWith("[follow-up]") && entry.messages.length >= 3), "Model evals must cover conversational place clarification.");
assert(modelEvals.some((entry) => entry.name.startsWith("[human-action]")), "Model evals must cover reading state after a person changes the shared map.");
assert(toolsSource.includes("mapChanged: false") && toolsSource.includes("visible: true") && toolsSource.includes("stopNumber"), "Write results must expose visible success and bounded recovery state to ChatGPT.");
assert(mainSource.includes("<ChallengeAtlas />") && mainSource.includes("<LegacyAtlasWidget />"), "Challenge and legacy widget writers must stay fenced.");
assert(finderSource.includes("controller.openPlace(") && finderSource.includes("controller.openCandidate("), "The human place finder must use the shared map controller.");
assert(appSource.includes("onOpenTrailStop={openTrailStop}"), "Trail markers and the rail must use the shared openTrailStop controller path.");
assert(appSource.includes("Map ready · Site tools not detected"), "Normal-browser fallback must read as a usable map state, not a broken product state.");
assert(appSource.includes("Map ready · Agent tools off") && appSource.includes("Map ready · Agent tools on"), "Mobile status must distinguish agent tools from the map's human controls.");
assert(!appSource.includes("atlas-app__activity-prompt") && !cssSource.includes("atlas-app__activity-prompt"), "The ready state must remain quiet instead of adding unsolicited coaching beside the map.");
assert(appSource.includes("Research trail") && appSource.includes("session only"), "The trail rail must explain its purpose, count, and session boundary.");
assert(appSource.includes('aria-current={active ? "step" : undefined}') && appSource.includes("atlas-app__trail-current"), "The active trail stop must use semantic and visible non-color cues.");
assert(appSource.includes("<strong>Agent</strong>") && !appSource.includes("<strong>{map.lastActivity.tool}</strong>"), "Visible site-tool activity must use human language while keeping raw diagnostics out of the primary flow.");
assert(finderSource.includes('busy ? "Searching" : "Open"') && finderSource.includes("Searching Atlas…"), "Place-search progress must say what Atlas is doing instead of asking the person to wait.");
assert(finderSource.includes("Map unchanged.") && toolsSource.includes("Trail and map unchanged."), "Ambiguity and failed trails must visibly state that no partial mutation occurred.");
assert(plateSource.includes("geometry.countyCenters") && plateSource.includes("atlas-plate__trail-marker"), "The national plate must render trail markers from projected county centers.");
assert(plateSource.includes('atlas-plate${trailStops.length > 0 ? " has-trail" : ""}') && cssSource.includes(".atlas-plate.has-trail"), "Trail mode must deliberately reduce label competition on the map.");
const mobileCssStart = cssSource.indexOf("@media (max-width: 720px)");
assert(
  cssRule(cssSource, ".atlas-app__trail-title").includes("min-height: 32px")
    && cssRule(cssSource, ".atlas-app__trail-place").includes("min-height: 32px")
    && cssRule(cssSource, ".atlas-app__trail li input").includes("min-height: 32px")
    && cssRule(cssSource, ".atlas-app__remove {").includes("width: 32px")
    && cssRule(cssSource, ".atlas-app__remove {").includes("height: 32px")
    && cssRule(cssSource, ".atlas-app__trail-title,", mobileCssStart).includes("min-height: 44px")
    && cssRule(cssSource, ".atlas-app__remove {", mobileCssStart).includes("width: 44px")
    && cssRule(cssSource, ".atlas-app__remove {", mobileCssStart).includes("height: 44px"),
  "Research controls must keep 32px desktop and 44px mobile target floors.",
);
assert(geometrySource.includes("countyCenters") && !toolsSource.includes("countyCenters"), "Projected county centers must remain internal geometry, not WebMCP output.");
assert(plateSource.includes("atlas-plate__trail-route-base") && plateSource.includes("pathLength={1}") && cssSource.includes("atlas-trail-route-reveal") && cssSource.includes("prefers-reduced-motion: reduce"), "Trail continuity motion must preserve an immediate complete route, stay short, and remain removable.");
assert(cssSource.includes("from { opacity: 0.64; }") && cssRule(cssSource, ".atlas-plate__trail-route-base {").includes("opacity: 0.32"), "Trail motion must keep every marker and the complete route visible before tool success returns.");
assert(cssSource.includes("atlas-trail-pin-arrive 220ms cubic-bezier(0.22, 1, 0.36, 1) backwards"), "Trail arrival motion must release the pin transform so press feedback remains visible.");
assert(cssSource.includes("var(--atlas-page-fg) 72%, transparent"), "Inactive mobile prompt context must keep normal-text contrast.");
assert(cssSource.includes(".atlas-app__trail li:not(.is-active) .atlas-app__trail-prompt") && cssSource.includes(".atlas-app__trail-prompt-preview"), "Mobile trail editing must keep inactive stops compact without removing their research context.");
assert(hciManualSource.includes("ASD-STE100") && hciManualSource.includes("does not claim ASD-STE100 conformance") && hciManualSource.includes("W3C Cognitive Accessibility") && hciManualSource.includes("prefers-reduced-motion"), "The local HCI manual must preserve the standards boundary, cognitive-accessibility source, and motion rule.");
assert(serverSource.includes('"origin-agent-cluster": "?1"'), "Judge routes must request an origin-keyed agent cluster.");
assert(serverSource.includes('"permissions-policy": "tools=(self)"'), "Judge routes must allow same-origin WebMCP tools.");

console.log(JSON.stringify({ ok: true, tools: expected, registration: "top-level all-or-none", fallback: "feature-detected" }, null, 2));
