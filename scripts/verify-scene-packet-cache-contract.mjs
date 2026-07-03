#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const warnings = [];

const update = "postalpha-0.31e-server-scene-packet-cache-contract";

const files = {
  contract: "packages/core/src/world/scenePacketCache.ts",
  worldIndex: "packages/core/src/world/index.ts",
  coreIndex: "packages/core/src/index.ts",
  tests: "packages/core/test/scene-packet-cache.test.ts",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(join(root, file), "utf8")]));

requireText("contract", "ScenePacketCachePlan", "Core contract must define a ScenePacketCachePlan.");
requireText("contract", "createScenePacketCacheKey", "Core contract must create deterministic scene packet cache keys.");
requireText("contract", "assertScenePacketCachePlanSafe", "Core contract must expose a safety checker.");
requireText("contract", update, "Core contract must carry the 0.31E update id.");
requireText("worldIndex", "createScenePacketCachePlan", "World index must export the scene packet cache plan helper.");
requireText("coreIndex", "createScenePacketCachePlan", "Root core index must export the scene packet cache plan helper.");
requireText("tests", "provider_normalized_future", "Tests must protect future provider generation from being enabled accidentally.");
requireText("tests", "hidden draft", "Tests must protect hidden draft non-public behavior.");
requireText("splitGuard", "scripts/verify-scene-packet-cache-contract.mjs", "Strict split guard must allow this verifier.");

for (const [key, text] of Object.entries(source)) {
  rejectText(key, /from ["']@atlas\/geo|GeoDataAdapter|GoogleMaps|google\.maps|maps\.googleapis|places\.googleapis/i, `${files[key]} must not import provider internals.`);
  rejectText(key, /DATABASE_URL|POSTGRES|from ["'](?:pg|postgres|prisma|@prisma|supabase|@supabase)/i, `${files[key]} must not add DB persistence.`);
  rejectText(key, /from ["'](?:stripe|@stripe|three|@react-three|rapier|@dimforge)/i, `${files[key]} must not add paid or renderer runtime dependencies.`);
}

let runtimeSummary = null;

try {
  const {
    assertScenePacketCachePlanSafe,
    createScenePacketCacheKey,
    createScenePacketCachePlan,
    hashScenePacketViewportFrame,
    SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID,
  } = await import("../packages/core/dist/index.js");

  if (SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID !== update) {
    blockers.push(`Built core update id mismatch: ${SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID}`);
  }

  const riverside = createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "CA",
    countySlug: "riverside-ca",
    districtSlug: "eastvale",
    cameraPresetId: "mobile",
    windowHash: "window-eastvale-core",
    readiness: "public_playable",
  });
  const orange = createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "CA",
    countySlug: "orange-ca",
    cameraPresetId: "mobile",
    readiness: "shell_only",
  });
  const anaheim = createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "CA",
    countySlug: "orange-ca",
    districtSlug: "anaheim-candidate",
    cameraPresetId: "residential_detail",
    readiness: "hidden_draft",
    sceneId: "city-world-draft-orange-ca-anaheim-candidate",
  });
  const providerFuture = createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "CA",
    countySlug: "orange-ca",
    districtSlug: "anaheim-candidate",
    cameraPresetId: "mobile",
    readiness: "hidden_draft",
    generationMode: "provider_normalized_future",
  });
  const backgroundFuture = createScenePacketCachePlan({
    countryCode: "US",
    stateCode: "CA",
    countySlug: "riverside-ca",
    districtSlug: "eastvale",
    cameraPresetId: "desktop",
    readiness: "public_playable",
    generationMode: "background_generation_future",
  });

  const viewportHash = hashScenePacketViewportFrame({
    minX: -2,
    maxX: 10,
    minY: 1.25,
    maxY: 8.75,
  });
  const normalizedKey = createScenePacketCacheKey({
    countryCode: "US",
    stateCode: "CA",
    countySlug: "Riverside CA",
    districtSlug: "Eastvale",
    cameraPresetId: "Desktop Core",
    viewportFrame: {
      minX: -2,
      maxX: 10,
      minY: 1.25,
      maxY: 8.75,
    },
  });

  for (const [label, plan] of [
    ["riverside", riverside],
    ["orange", orange],
    ["anaheim", anaheim],
  ]) {
    const safety = assertScenePacketCachePlanSafe(plan);
    if (!safety.passed) blockers.push(`${label} cache plan failed safety: ${safety.blockers.join("; ")}`);
  }

  if (riverside.packet.playable !== true || riverside.packet.containsScene !== true) {
    blockers.push("Riverside packet must remain the only public playable scene packet shape.");
  }
  if (orange.packet.containsScene !== false || orange.packet.playable !== false) {
    blockers.push("Orange shell packet must stay metadata-only and non-playable.");
  }
  if (anaheim.packet.publicRouteAllowed !== false || anaheim.packet.playable !== false) {
    blockers.push("Anaheim hidden draft packet must stay non-public and non-playable.");
  }
  if (providerFuture.generation.status !== "blocked") {
    blockers.push("Provider-normalized future generation must stay blocked.");
  }
  if (backgroundFuture.generation.status !== "blocked") {
    blockers.push("Background scene generation must stay blocked until server storage gates reopen.");
  }
  if (riverside.policy.canPersist !== false || riverside.policy.liveProviderAllowed !== false) {
    blockers.push("Public playable policy must not enable persistence or live provider use.");
  }

  runtimeSummary = {
    update,
    normalizedKey: normalizedKey.key,
    viewportHash,
    plans: {
      riverside: summarizePlan(riverside, assertScenePacketCachePlanSafe(riverside)),
      orange: summarizePlan(orange, assertScenePacketCachePlanSafe(orange)),
      anaheim: summarizePlan(anaheim, assertScenePacketCachePlanSafe(anaheim)),
      providerFuture: summarizePlan(providerFuture, assertScenePacketCachePlanSafe(providerFuture)),
      backgroundFuture: summarizePlan(backgroundFuture, assertScenePacketCachePlanSafe(backgroundFuture)),
    },
  };
} catch (error) {
  blockers.push(`Unable to evaluate built scene packet cache contract. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update,
  checkedFiles: files,
  blockerCount: blockers.length,
  blockers,
  warnings,
  runtimeSummary,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function summarizePlan(plan, safety) {
  return {
    readiness: plan.readiness,
    key: plan.key.key,
    storageMode: plan.policy.storageMode,
    ttlSeconds: plan.policy.ttlSeconds,
    canPersist: plan.policy.canPersist,
    liveProviderAllowed: plan.policy.liveProviderAllowed,
    providerGeometryAllowed: plan.policy.providerGeometryAllowed,
    generationStatus: plan.generation.status,
    generationMode: plan.generation.mode,
    generationBlockers: plan.generation.blockers,
    packet: plan.packet,
    safetyPassed: safety.passed,
    safetyBlockers: safety.blockers,
  };
}

function requireText(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) blockers.push(message);
}

function rejectText(fileKey, pattern, message) {
  if (pattern.test(source[fileKey])) blockers.push(message);
}
