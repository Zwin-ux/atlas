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

if (!/structuredContent:\s*voxelSceneStructuredContent\(scene\)/.test(server)) {
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

if (!/structuredContent:\s*lookup/.test(server)) {
  blockers.push("lookup_world_places must return normalized lookup structuredContent.");
}

const lookupOutputSchema = sliceBetween(server, "const worldPlaceLookupOutputSchema", "const countyQuestionAnswerOutputSchema");
for (const forbidden of ["placeId:", "primaryType:", "types:", "photos:", "phone:", "website:", "rating:", "reviews:", "priceLevel:", "openingHours:"]) {
  if (lookupOutputSchema.includes(forbidden)) {
    blockers.push(`lookup_world_places output schema must not expose raw provider field ${forbidden}`);
  }
}

if (!lookupOutputSchema.includes("structuredContentPolicy: z.literal(\"atlas_normalized_only\")")) {
  blockers.push("lookup_world_places output schema must state Atlas-normalized structuredContent policy.");
}

if (!server.includes("atlasLookupPlaceId")) {
  blockers.push("lookup_world_places must create Atlas-owned lookup ids instead of provider ids.");
}

for (const token of ["lookup-only", "not saved", "not coverage proof", "does not unlock a playable county map"]) {
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
