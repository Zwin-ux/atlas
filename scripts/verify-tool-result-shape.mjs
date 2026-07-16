import { readFileSync } from "node:fs";

const server = readFileSync("server/src/index.ts", "utf8");
const blockers = [];

const voxelSummary = sliceBetween(server, "type VoxelSceneStructuredContent", "type CountyCoverageStructuredContent");
for (const forbidden of ["tiles:", "objects:", "markers:", "world:"]) {
  if (voxelSummary.includes(forbidden)) {
    blockers.push(`VoxelSceneStructuredContent must stay summary-only and not include ${forbidden}`);
  }
}

if (/structuredContent:\s*scene\b/.test(server)) {
  blockers.push("Tool handlers must not place full scene objects directly in structuredContent.");
}

if (!/structuredContent:\s*voxelSceneStructuredContent\(scene(?:,\s*[\w?.]+)?\)/.test(server)) {
  blockers.push("Playable map tools should return a compact voxelSceneStructuredContent summary.");
}

if (!/_meta:\s*{\s*scene,/s.test(server)) {
  blockers.push("Playable map tools must keep full scenes in _meta.scene.");
}

if (!/_meta:\s*{\s*scene,\s*scenePacket,/s.test(server)) {
  blockers.push("Playable map tools must attach safe scene packet metadata in _meta.scenePacket.");
}

if (/structuredContent:\s*scenePacket\b/.test(server)) {
  blockers.push("Scene packet metadata must stay in _meta and not structuredContent.");
}

if (!/structuredContent:\s*publicLookup/.test(server)) {
  blockers.push("lookup_world_places must return the minimized public lookup projection.");
}

const lookupOutputSchema = sliceBetween(server, "const worldPlaceLookupOutputSchema", "const countyQuestionAnswerOutputSchema");
for (const forbidden of [
  "query:",
  "mode:",
  "coordinates:",
  "cache:",
  "providerReadiness:",
  "runtime:",
  "ttlSeconds:",
  "cachedAt:",
  "expiresAt:",
  "placeId:",
  "primaryType:",
  "types:",
  "photos:",
  "phone:",
  "website:",
  "rating:",
  "reviews:",
  "priceLevel:",
  "openingHours:",
]) {
  if (lookupOutputSchema.includes(forbidden)) {
    blockers.push(`lookup_world_places output schema must not expose internal or raw provider field ${forbidden}`);
  }
}

if (!server.includes("function publicWorldPlaceLookup")) {
  blockers.push("lookup_world_places must project internal lookup data into a minimized public response.");
}

if (!/inputSchema:\s*{[\s\S]*?countySlug:[\s\S]*?placeId:[\s\S]*?radiusMeters:/.test(server)) {
  blockers.push("lookup_world_places must use Atlas-owned county/place ids instead of a raw location query.");
}

if (!server.includes("atlasLookupPlaceId")) {
  blockers.push("lookup_world_places must create Atlas-owned lookup ids instead of provider ids.");
}

for (const token of ["lookup-only", "not saved to an Atlas account or map", "up to 24 hours", "not coverage proof", "does not unlock a full county map"]) {
  if (!server.includes(token)) {
    blockers.push(`lookup_world_places content copy missing "${token}".`);
  }
}

const summary = {
  ok: blockers.length === 0,
  update: "postalpha-0.32e-runtime-scene-packet-memory-adapter",
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  process.exitCode = 1;
}

function sliceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    blockers.push(`Could not locate ${start} block.`);
    return "";
  }
  return source.slice(startIndex, endIndex);
}
