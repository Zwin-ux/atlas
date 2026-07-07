#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const UPDATE_ID = "postalpha-0.72b-redis-scene-packet-cache-job-spine";
const ARTIFACT_PATH = "artifacts/national-generation/0.72b/production-backend-spine.json";

const blockers = [];
const warnings = [];
const checkedFiles = [];

const packageSource = read("package.json");
const envExample = read(".env.example");
const adapterSource = read("server/src/scenePacketMemoryAdapter.ts");
const workerSource = read("server/src/scenePacketWorker.ts");
const serverSource = read("server/src/index.ts");

for (const token of [
  "\"redis\"",
  "\"start:scene-packet-worker\"",
]) {
  requireToken(packageSource, token, "package.json production backend spine wiring");
}

for (const token of [
  "ATLAS_SCENE_PACKET_CACHE_BACKEND=memory",
  "ATLAS_REDIS_URL=",
  "ATLAS_SCENE_PACKET_WORKER_ENABLED=false",
  "ATLAS_SCENE_PACKET_LOCK_TTL_SECONDS=30",
]) {
  requireToken(envExample, token, ".env.example 0.72B env contract");
}

for (const token of [
  "ScenePacketCacheStore",
  "ScenePacketCompileLock",
  "ScenePacketJobQueue",
  "createRedisScenePacketCacheStore",
  "createRedisScenePacketCompileLock",
  "createRedisScenePacketJobQueue",
  "SET NX EX",
  "readScenePacketRuntimeConfig",
  "generationStatus: \"queued\"",
]) {
  requireToken(adapterSource, token, "scene packet Redis spine adapter");
}

for (const token of [
  "runScenePacketWorkerOnce",
  "claimGeneratedDraftJob",
  "createDeterministicGeneratedDistrictScene",
  "completeGeneratedDraftJob",
  "failGeneratedDraftJob",
]) {
  requireToken(workerSource, token, "scene packet worker entrypoint");
}

for (const token of [
  "/ready",
  "requestIdFor",
  "logBackendEvent",
  "enforceRateLimit",
  "provider_lookup_cache_hit",
  "generated_draft_packet_result",
  "stripe_webhook_decision",
  "hosted_clawd_write_result",
  "cache: await scenePacketMemory.status()",
]) {
  requireToken(serverSource, token, "server production hardening");
}

if (/\/api\/engine\/scene-packets\/generated/i.test(serverSource)) {
  blockers.push("0.72B must not add a browser HTTP generated scene route.");
}

const publicToolNames = [...serverSource.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)].map((match) => match[1]);
const allowedTools = [
  "select_county",
  "ask_county_question",
  "render_voxel_county",
  "lookup_world_places",
  "preview_scout_drop",
  "preview_campaign_engine",
  "get_upgrade_options",
];
const unexpectedTools = publicToolNames.filter((name) => !allowedTools.includes(name));
if (unexpectedTools.length > 0) {
  blockers.push(`0.72B must not add public MCP tools; found ${unexpectedTools.join(", ")}.`);
}

let runtime = null;
try {
  if (!existsSync(resolve("server/dist/scenePacketMemoryAdapter.js"))) {
    throw new Error("server/dist/scenePacketMemoryAdapter.js is missing.");
  }
  if (!existsSync(resolve("packages/core/dist/index.js"))) {
    throw new Error("packages/core/dist/index.js is missing.");
  }
  runtime = await runRuntimeChecks();
} catch (error) {
  blockers.push(`Could not verify built 0.72B backend spine runtime. Run pnpm build:server first. ${error instanceof Error ? error.message : String(error)}`);
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

async function runRuntimeChecks() {
  const adapterModule = await import("../server/dist/scenePacketMemoryAdapter.js");
  const core = await import("../packages/core/dist/index.js");
  let now = Date.parse("2026-07-06T12:00:00.000Z");
  let sceneBuilds = 0;
  const adapter = adapterModule.createScenePacketMemoryAdapter({
    maxEntries: 4,
    nowMs: () => now,
    lockWaitMs: 0,
  });
  const input = {
    stateCode: "TX",
    countySlug: "travis-tx",
    districtSlug: "travis-tx-generated-district",
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
        id: "generated-travis-tx-generated-district",
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
  assert(first.summary.cacheHit === false, "First generated draft packet request must miss.");
  assert(second.summary.cacheHit === true, "Second generated draft packet request must hit.");
  assert(sceneBuilds === 1, `Generated draft should compile once; got ${sceneBuilds}.`);
  assert(second.payload?.id === "generated-travis-tx-generated-district", "Cache hit must return payload.");

  now += 1_800_001;
  const expired = await adapter.getOrCreateGeneratedDraftScenePacket(input);
  assert(expired.summary.cacheHit === false, "Generated draft TTL expiry must refresh the cache.");

  const lock = adapterModule.createMemoryScenePacketCompileLock();
  const queue = adapterModule.createMemoryScenePacketJobQueue();
  const plan = core.createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "TX",
    countySlug: "harris-tx",
    districtSlug: "harris-tx-generated-district",
    cameraPresetId: "generated-draft",
    windowHash: "generated-initial-window",
    sceneSchemaVersion: "city-world-v1",
    engineUpdateId: "postalpha-0.70h-deterministic-generated-district-specs",
    readiness: "generated_draft",
    generationMode: "deterministic_generated_draft",
  });
  const heldLock = await lock.acquire(plan.key.key, 30);
  const contended = adapterModule.createScenePacketMemoryAdapter({
    maxEntries: 4,
    nowMs: () => now,
    lockWaitMs: 0,
    compileLock: lock,
    jobQueue: queue,
  });
  const queued = await contended.getOrCreateGeneratedDraftScenePacket({
    ...input,
    countySlug: "harris-tx",
    districtSlug: "harris-tx-generated-district",
    job: {
      id: "harris-tx:test-job",
      kind: "generated_draft_scene",
      enqueuedAtMs: now,
      stateCode: "TX",
      countySlug: "harris-tx",
      districtSlug: "harris-tx-generated-district",
      cameraPresetId: "generated-draft",
      windowHash: "generated-initial-window",
      sceneSchemaVersion: "city-world-v1",
      engineUpdateId: "postalpha-0.70h-deterministic-generated-district-specs",
      sourceNotes: input.sourceNotes,
    },
  });
  const queuedStatus = await contended.status();
  await heldLock.release();
  assert(!queued.payload, "Lock contention must not return a generated scene payload.");
  assert(queued.summary.generationStatus === "queued", "Lock contention must return queued-safe generatedDraftPacket metadata.");
  assert(queuedStatus.queueDepth === 1, `Lock contention should enqueue one job; got ${queuedStatus.queueDepth}.`);

  const devFallback = adapterModule.readScenePacketRuntimeConfig({});
  const prodBlocked = adapterModule.readScenePacketRuntimeConfig({
    NODE_ENV: "production",
    ATLAS_SCENE_PACKET_CACHE_BACKEND: "memory",
  });
  const redisConfig = adapterModule.readScenePacketRuntimeConfig({
    NODE_ENV: "production",
    ATLAS_SCENE_PACKET_CACHE_BACKEND: "redis",
    ATLAS_REDIS_URL: "redis://localhost:6379",
  });
  assert(devFallback.effectiveBackend === "memory" && devFallback.blockers.length === 0, "Dev without Redis should fall back to memory.");
  assert(prodBlocked.blockers.length > 0, "Production without Redis backend/url must be blocked.");
  assert(redisConfig.effectiveBackend === "redis" && redisConfig.blockers.length === 0, "Production Redis config should be accepted.");

  const statusJson = JSON.stringify(await adapter.status());
  for (const forbidden of ["\"payload\":", "terrainTiles", "roadSegments", "buildings", "places", "generatedDraftScene"]) {
    assert(!statusJson.includes(forbidden), `Scene packet status must not leak ${forbidden}.`);
  }

  return {
    updateId: adapterModule.SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
    sceneBuilds,
    cacheHitAfterFirst: second.summary.cacheHit,
    expiredCacheHit: expired.summary.cacheHit,
    queuedGenerationStatus: queued.summary.generationStatus,
    queuedStatus,
    devFallback,
    prodBlockerCount: prodBlocked.blockers.length,
    redisEffectiveBackend: redisConfig.effectiveBackend,
  };
}

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
