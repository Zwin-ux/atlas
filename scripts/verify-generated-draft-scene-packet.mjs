#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const UPDATE_ID = "postalpha-0.71h-scene-packet-service-boundary";
const ARTIFACT_PATH = "artifacts/national-generation/0.71h/generated-draft-scene-packet.json";

const blockers = [];
const warnings = [];
const checkedFiles = [];

const coreSource = read("packages/core/src/world/scenePacketCache.ts");
const coreTestSource = read("packages/core/test/scene-packet-cache.test.ts");
const adapterSource = read("server/src/scenePacketMemoryAdapter.ts");
const serverSource = read("server/src/index.ts");
const appSource = read("web/src/App.tsx");
const packageSource = read("package.json");

for (const token of [
  "\"generated_draft\"",
  "\"deterministic_generated_draft\"",
  "publicRouteAllowed: false",
  "playable: false",
  "metaOnlyScene: true",
]) {
  requireToken(coreSource, token, "core scene packet cache contract");
}

for (const token of [
  "getOrCreateGeneratedDraftScenePacket",
  "\"generated_draft_scene\"",
  "readiness: \"generated_draft\"",
  "generationMode: \"deterministic_generated_draft\"",
]) {
  requireToken(adapterSource, token, "server scene packet memory adapter");
}

for (const forbidden of ["DATABASE_URL", "createPostgres", "Stripe", "INSERT ", "SELECT ", "UPDATE "]) {
  if (adapterSource.includes(forbidden)) {
    blockers.push(`Scene packet memory adapter must stay runtime-memory only; found forbidden token ${forbidden}.`);
  }
}

for (const token of [
  "includeGeneratedDraft",
  "generatedDraftScene",
  "generatedDraftPacket",
  "createDeterministicGeneratedDistrictScene",
  "createDeterministicGeneratedDistrictSpec",
]) {
  requireToken(serverSource, token, "server MCP generated draft delivery");
}

if (/structuredContent\s*:\s*[^,\n]*generatedDraft/i.test(serverSource)) {
  blockers.push("Generated draft data must not be returned in structuredContent.");
}
if (/structuredContent\s*:\s*\{[\s\S]{0,600}generatedDraft/i.test(serverSource)) {
  blockers.push("Generated draft fields must stay out of structuredContent object literals.");
}
if (/app\.(get|post|put|delete)\s*\([^)]*generated/i.test(serverSource) || /\/api\/engine\/scene-packets\/generated/i.test(serverSource)) {
  blockers.push("0.71H must not add a browser HTTP generated scene route.");
}

for (const forbidden of ["exampleParametricDistrictSpec", "generateParametricCityWorldScene"]) {
  if (appSource.includes(forbidden)) {
    blockers.push(`Widget must not compile generated district previews locally; remove ${forbidden}.`);
  }
}
for (const token of ["generatedDraftScene", "activeGeneratedScene", "includeGeneratedDraft true", "sendUserMessage"]) {
  requireToken(appSource, token, "widget generated draft meta consumption");
}

for (const token of ["generated draft packets runtime-only", "separates generated draft cache keys"]) {
  requireToken(coreTestSource, token, "core generated draft scene packet tests");
}

if (!packageSource.includes("\"verify:generated-draft-scene-packet\"")) {
  blockers.push("package.json must expose verify:generated-draft-scene-packet.");
}

let runtime = null;
try {
  if (!existsSync(resolve("server/dist/scenePacketMemoryAdapter.js"))) {
    throw new Error("server/dist/scenePacketMemoryAdapter.js is missing.");
  }
  if (!existsSync(resolve("packages/core/dist/index.js"))) {
    throw new Error("packages/core/dist/index.js is missing.");
  }
  const adapterModule = await import("../server/dist/scenePacketMemoryAdapter.js");
  const core = await import("../packages/core/dist/index.js");
  const adapter = adapterModule.createScenePacketMemoryAdapter({
    maxEntries: 4,
    nowMs: () => Date.parse("2026-07-06T09:00:00.000Z"),
  });
  let sceneBuilds = 0;
  const input = {
    stateCode: "IL",
    countySlug: "cook-il",
    districtSlug: "cook-il-generated-district",
    cameraPresetId: "generated-draft",
    windowHash: "generated-initial-window",
    sceneSchemaVersion: "city-world-v1",
    engineUpdateId: "postalpha-0.70h-deterministic-generated-district-specs",
    sourceNotes: [
      {
        source: "census",
        label: "2024 Census county identity",
        attribution: "U.S. Census Bureau Gazetteer Files",
        ttlSeconds: 31536000,
      },
    ],
    createScene: () => {
      sceneBuilds += 1;
      return {
        type: "cityWorldScene",
        id: "generated-cook-il-generated-district",
        terrainTiles: [],
        roadSegments: [],
        lots: [],
        buildings: [],
        props: [],
        places: [],
        pins: [],
        actors: [],
      };
    },
    sceneIdForPayload: (scene) => scene.id,
  };

  const first = await adapter.getOrCreateGeneratedDraftScenePacket(input);
  const second = await adapter.getOrCreateGeneratedDraftScenePacket(input);
  const status = await adapter.status();
  const generatedPlan = core.createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "IL",
    countySlug: "cook-il",
    districtSlug: "cook-il-generated-district",
    cameraPresetId: "generated-draft",
    windowHash: "generated-initial-window",
    sceneSchemaVersion: "city-world-v1",
    engineUpdateId: "postalpha-0.70h-deterministic-generated-district-specs",
    readiness: "generated_draft",
    generationMode: "deterministic_generated_draft",
    sceneId: "generated-cook-il-generated-district",
  });
  const safety = core.assertScenePacketCachePlanSafe(generatedPlan);

  assert(first.summary.cacheHit === false, "First generated draft packet request must be a cache miss.");
  assert(second.summary.cacheHit === true, "Second generated draft packet request must be a cache hit.");
  assert(sceneBuilds === 1, `Generated draft scene should compile once across miss/hit; got ${sceneBuilds}.`);
  assert(second.payload?.id === "generated-cook-il-generated-district", "Cache hit must return the generated draft payload.");
  assert(second.summary.readiness === "generated_draft", "Generated draft summary readiness mismatch.");
  assert(second.summary.payloadKind === "generated_draft_scene", "Generated draft payload kind mismatch.");
  assert(second.summary.generationMode === "deterministic_generated_draft", "Generated draft generation mode mismatch.");
  assert(second.summary.packet.containsScene === true, "Generated draft packet must contain a scene.");
  assert(second.summary.packet.playable === false, "Generated draft packet must be non-playable.");
  assert(second.summary.packet.publicRouteAllowed === false, "Generated draft packet must not be public-route allowed.");
  assert(second.summary.packet.metaOnlyScene === true, "Generated draft packet must be meta-only.");
  assert(second.summary.policy.storageMode === "runtime_memory", "Generated draft cache must be runtime memory only.");
  assert(second.summary.policy.canPersist === false, "Generated draft cache must not persist.");
  assert(second.summary.policy.providerGeometryAllowed === false, "Generated draft cache must not allow provider geometry.");
  assert(second.summary.policy.liveProviderAllowed === false, "Generated draft cache must not allow live provider calls.");
  assert(safety.passed === true, `Generated draft cache plan should be safe: ${safety.blockers.join("; ")}`);
  assert(status.entryCount === 1, `Status should expose one summary entry; got ${status.entryCount}.`);

  const statusJson = JSON.stringify(status);
  for (const forbidden of ["\"payload\":", "terrainTiles", "roadSegments", "buildings", "generatedDraftScene", "generatedDraftPacket"]) {
    assert(!statusJson.includes(forbidden), `Scene packet status must not leak ${forbidden}.`);
  }

  runtime = {
    firstSummary: first.summary,
    secondSummary: second.summary,
    sceneBuilds,
    status,
    safety,
  };
} catch (error) {
  blockers.push(`Could not verify built generated draft scene packet runtime. Run pnpm build:starter first. ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  artifactPath: ARTIFACT_PATH,
  checkedFiles,
  runtime,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

await mkdir(dirname(resolve(ARTIFACT_PATH)), { recursive: true });
await writeFile(resolve(ARTIFACT_PATH), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function read(path) {
  checkedFiles.push(path);
  return readFileSync(resolve(path), "utf8");
}

function requireToken(source, token, label) {
  if (!source.includes(token)) {
    blockers.push(`${label} is missing token: ${token}`);
  }
}

function assert(condition, message) {
  if (!condition) blockers.push(message);
}
