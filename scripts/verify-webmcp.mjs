import { readFile } from "node:fs/promises";

const expected = ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [toolsSource, registrySource, evalSchemaSource, mainSource, finderSource, appSource, plateSource, geometrySource, serverSource, packageSource, modelEvalsSource, smokeEvalsSource, evalRunnerSource] = await Promise.all([
  readFile(new URL("../web/src/atlas/webmcpTools.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/webmcpRegistry.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/webmcpEvalSchema.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/main.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasPlaceFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasApp.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasPlate.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/plateGeometry.ts", import.meta.url), "utf8"),
  readFile(new URL("../server/src/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../evals/atlas-webmcp.evals.json", import.meta.url), "utf8"),
  readFile(new URL("../evals/atlas-webmcp.smoke.json", import.meta.url), "utf8"),
  readFile(new URL("./run-webmcp-evals.mjs", import.meta.url), "utf8"),
]);

const packageJson = JSON.parse(packageSource);
const modelEvals = JSON.parse(modelEvalsSource);
const smokeEvals = JSON.parse(smokeEvalsSource);

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
assert((toolsSource.match(/context\?\.signal/g) ?? []).length === 4, "Async descriptors must support Chrome's one-argument invocation while preserving optional abort signals.");
assert(evalSchemaSource.includes("createAtlasWebMcpTools(controller)"), "Eval schemas must be projected from the real runtime descriptors.");
assert(packageJson.devDependencies?.["webmcp-evals"] === "0.0.4", "webmcp-evals must stay pinned to 0.0.4.");
assert(["eval:webmcp:static", "eval:webmcp:browser", "eval:webmcp:smoke"].every((script) => packageJson.scripts?.[script]), "Static, live-browser, and deterministic smoke eval commands are required.");
assert(evalRunnerSource.includes("Math.max(3, requestedRuns)"), "Model evals must not run fewer than three trajectories per case.");
assert(evalRunnerSource.includes("Math.max(0.90, requestedThreshold)"), "Model evals must not weaken the 90% release threshold.");
const modelEvalNames = collectFunctionNames(modelEvals);
const smokeEvalNames = collectFunctionNames(smokeEvals);
assert(modelEvalNames.every((name) => expected.includes(name)), "Model evals reference a tool outside the exact-five cut.");
assert(smokeEvalNames.every((name) => expected.includes(name)), "Smoke evals reference a tool outside the exact-five cut.");
assert(expected.every((name) => modelEvalNames.includes(name) && smokeEvalNames.includes(name)), "Both eval suites must exercise all five tools.");
assert(modelEvals.some((entry) => entry.expectedCall === null), "Model evals must include a no-tool request.");
assert(modelEvals.filter((entry) => entry.name.startsWith("[critical]")).length >= 3, "Model evals must identify critical write/atomicity trajectories.");
assert(mainSource.includes("<ChallengeAtlas />") && mainSource.includes("<LegacyAtlasWidget />"), "Challenge and legacy widget writers must stay fenced.");
assert(finderSource.includes("controller.openPlace(") && finderSource.includes("controller.openCandidate("), "The human place finder must use the shared map controller.");
assert(appSource.includes("onOpenTrailStop={openTrailStop}"), "Trail markers and the rail must use the shared openTrailStop controller path.");
assert(plateSource.includes("geometry.countyCenters") && plateSource.includes("atlas-plate__trail-marker"), "The national plate must render trail markers from projected county centers.");
assert(geometrySource.includes("countyCenters") && !toolsSource.includes("countyCenters"), "Projected county centers must remain internal geometry, not WebMCP output.");
assert(serverSource.includes('"origin-agent-cluster": "?1"'), "Judge routes must request an origin-keyed agent cluster.");
assert(serverSource.includes('"permissions-policy": "tools=(self)"'), "Judge routes must allow same-origin WebMCP tools.");

console.log(JSON.stringify({ ok: true, tools: expected, registration: "top-level all-or-none", fallback: "feature-detected" }, null, 2));
