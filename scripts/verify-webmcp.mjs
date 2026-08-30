import { readFile } from "node:fs/promises";

const expected = ["get_map_state", "search_places", "open_place", "add_map_note", "create_map_trail"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [toolsSource, registrySource, mainSource, finderSource, appSource, plateSource, geometrySource, serverSource] = await Promise.all([
  readFile(new URL("../web/src/atlas/webmcpTools.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/webmcpRegistry.ts", import.meta.url), "utf8"),
  readFile(new URL("../web/src/main.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasPlaceFinder.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasApp.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/AtlasPlate.tsx", import.meta.url), "utf8"),
  readFile(new URL("../web/src/atlas/plateGeometry.ts", import.meta.url), "utf8"),
  readFile(new URL("../server/src/index.ts", import.meta.url), "utf8"),
]);

const registeredNames = [...toolsSource.matchAll(/\n\s+name: "([a-z_]+)",/g)].map((match) => match[1]);
assert(JSON.stringify(registeredNames) === JSON.stringify(expected), `Expected exactly ${expected.join(", ")}; found ${registeredNames.join(", ")}`);
assert(!/select_county|scout|campaign|hosted_clawd/.test(registeredNames.join(" ")), "Retired tools leaked into the WebMCP cut.");
assert((toolsSource.match(/additionalProperties: false/g) ?? []).length >= 6, "Root and nested schemas must reject extra properties.");
assert(registrySource.includes("Promise.all("), "Tool registration must be all-or-none.");
assert(registrySource.includes("lifecycle.abort()"), "Partial registration must roll back through one lifecycle signal.");
assert(mainSource.includes("<ChallengeAtlas />") && mainSource.includes("<LegacyAtlasWidget />"), "Challenge and legacy widget writers must stay fenced.");
assert(finderSource.includes("controller.openPlace(") && finderSource.includes("controller.openCandidate("), "The human place finder must use the shared map controller.");
assert(appSource.includes("onOpenTrailStop={openTrailStop}"), "Trail markers and the rail must use the shared openTrailStop controller path.");
assert(plateSource.includes("geometry.countyCenters") && plateSource.includes("atlas-plate__trail-marker"), "The national plate must render trail markers from projected county centers.");
assert(geometrySource.includes("countyCenters") && !toolsSource.includes("countyCenters"), "Projected county centers must remain internal geometry, not WebMCP output.");
assert(serverSource.includes('"origin-agent-cluster": "?1"'), "Judge routes must request an origin-keyed agent cluster.");
assert(serverSource.includes('"permissions-policy": "tools=(self)"'), "Judge routes must allow same-origin WebMCP tools.");

console.log(JSON.stringify({ ok: true, tools: expected, registration: "top-level all-or-none", fallback: "feature-detected" }, null, 2));
