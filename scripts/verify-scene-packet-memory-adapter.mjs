import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const UPDATE = "postalpha-0.32e-runtime-scene-packet-memory-adapter";
const args = new Set(process.argv.slice(2));
const jsonOnly = args.has("--json-only");
const url = readArg("--url");
const blockers = [];
const checks = [];

function addCheck(id, passed, details = {}) {
  const { blocker, ...rest } = details;
  checks.push({ id, passed, ...rest, ...(passed || !blocker ? {} : { blocker }) });
  if (!passed && blocker) blockers.push(blocker);
}

const adapterPath = resolve("server/src/scenePacketMemoryAdapter.ts");
const serverPath = resolve("server/src/index.ts");
const splitGuardPath = resolve("scripts/verify-alpha-rc-split.mjs");

const adapter = existsSync(adapterPath) ? readFileSync(adapterPath, "utf8") : "";
const server = existsSync(serverPath) ? readFileSync(serverPath, "utf8") : "";
const splitGuard = existsSync(splitGuardPath) ? readFileSync(splitGuardPath, "utf8") : "";

addCheck("adapter-file-exists", Boolean(adapter), { blocker: "Missing server/src/scenePacketMemoryAdapter.ts." });
addCheck("adapter-uses-031-contract", /createScenePacketCachePlan/.test(adapter) && /assertScenePacketCachePlanSafe/.test(adapter), {
  blocker: "Memory adapter must use the 0.31E scene packet cache contract and safety checker.",
});
addCheck("adapter-bounded-map", /new Map</.test(adapter) && /maxEntries/.test(adapter) && /evictIfNeeded/.test(adapter), {
  blocker: "Memory adapter must use a bounded Map with explicit eviction.",
});
addCheck("adapter-runtime-metadata", /createdAtMs/.test(adapter) && /expiresAtMs/.test(adapter) && /lastAccessedAtMs/.test(adapter) && /hitCount/.test(adapter), {
  blocker: "Memory adapter must expose created/expires/last-access/hit-count runtime metadata.",
});
addCheck("adapter-no-forbidden-service-scope", !/@atlas\/geo|GeoDataAdapter|GoogleMaps|maps\.googleapis|DATABASE_URL|POSTGRES|prisma|supabase|stripe|oauth|hostedClawd/i.test(adapter), {
  blocker: "Memory adapter imported or referenced forbidden provider, DB, paid, or Hosted Clawd scope.",
});
addCheck("server-wires-playable-tools", /getOrCreatePlayableScenePacket/.test(server) && /scenePacketMemory/.test(server), {
  blocker: "Server must route playable scene tools through the memory adapter.",
});
addCheck("server-meta-scene-packet", /scenePacket/.test(server) && /_meta:\s*{[^}]*scene[^}]*scenePacket/s.test(server), {
  blocker: "Playable MCP tool responses must include _meta.scene and safe _meta.scenePacket metadata.",
});
addCheck("server-status-route", /\/api\/engine\/scene-packets\/status/.test(server), {
  blocker: "Missing GET /api/engine/scene-packets/status diagnostic route.",
});
addCheck("split-guard-allows-032", /server\/src\/scenePacketMemoryAdapter\.ts/.test(splitGuard) && /scripts\/verify-scene-packet-memory-adapter\.mjs/.test(splitGuard), {
  blocker: "Strict split guard must allow the 0.32E server adapter and verifier.",
});

let runtimeSummary = null;
if (blockers.length === 0) {
  runtimeSummary = await runBuiltAdapterChecks();
}

let routeSummary = null;
if (url) {
  routeSummary = await runUrlChecks(url);
}

const summary = {
  ok: blockers.length === 0,
  update: UPDATE,
  blockerCount: blockers.length,
  blockers,
  checks,
  runtimeSummary,
  routeSummary,
};

if (!jsonOnly) {
  console.log(`Atlas ${UPDATE}`);
}
console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  process.exitCode = 1;
}

async function runBuiltAdapterChecks() {
  const distPath = resolve("server/dist/scenePacketMemoryAdapter.js");
  if (!existsSync(distPath)) {
    blockers.push("Built adapter missing. Run pnpm build:server before runtime verification.");
    return null;
  }

  const {
    createScenePacketMemoryAdapter,
    SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
  } = await import(toFileUrl(distPath));
  addCheck("runtime-update-id", SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID === UPDATE, {
    blocker: "Built adapter exposes the wrong 0.32E update id.",
  });

  let now = 1_000;
  let sceneBuilds = 0;
  const memory = createScenePacketMemoryAdapter({ maxEntries: 2, nowMs: () => now });
  const first = memory.getOrCreatePlayableScenePacket({
    stateCode: "CA",
    countySlug: "riverside-ca",
    districtSlug: "eastvale",
    selectedNodeId: "eastvale",
    createScene: () => {
      sceneBuilds += 1;
      return { id: `scene-${sceneBuilds}` };
    },
    sceneIdForPayload: (scene) => scene.id,
  });
  const second = memory.getOrCreatePlayableScenePacket({
    stateCode: "CA",
    countySlug: "riverside-ca",
    districtSlug: "eastvale",
    selectedNodeId: "eastvale",
    createScene: () => {
      sceneBuilds += 1;
      return { id: `scene-${sceneBuilds}` };
    },
    sceneIdForPayload: (scene) => scene.id,
  });
  addCheck("runtime-cache-miss-then-hit", first.summary.cacheHit === false && second.summary.cacheHit === true && sceneBuilds === 1, {
    blocker: "Memory adapter must miss once, hit on the same deterministic key, and avoid recompilation.",
  });
  addCheck("runtime-playable-summary-safe", second.summary.packet.containsScene === true && second.summary.policy.canPersist === false && second.summary.policy.liveProviderAllowed === false, {
    blocker: "Playable scene packet summary must remain runtime-only and provider-safe.",
  });

  const alternate = memory.getOrCreatePlayableScenePacket({
    stateCode: "CA",
    countySlug: "riverside-ca",
    districtSlug: "eastvale",
    selectedNodeId: "eastvale-core",
    createScene: () => {
      sceneBuilds += 1;
      return { id: `scene-${sceneBuilds}` };
    },
    sceneIdForPayload: (scene) => scene.id,
  });
  addCheck("runtime-selected-node-key-separation", alternate.summary.key !== second.summary.key, {
    blocker: "Selected-node changes must produce distinct scene packet cache keys.",
  });

  now += 3_600_001;
  const expired = memory.getOrCreatePlayableScenePacket({
    stateCode: "CA",
    countySlug: "riverside-ca",
    districtSlug: "eastvale",
    selectedNodeId: "eastvale",
    createScene: () => {
      sceneBuilds += 1;
      return { id: `scene-${sceneBuilds}` };
    },
    sceneIdForPayload: (scene) => scene.id,
  });
  addCheck("runtime-expiry-refreshes", expired.summary.cacheHit === false && expired.payload?.id !== second.payload?.id, {
    blocker: "Expired scene packets must refresh instead of returning stale payloads.",
  });

  const evicting = createScenePacketMemoryAdapter({ maxEntries: 2, nowMs: () => now });
  for (const selectedNodeId of ["a", "b", "c"]) {
    evicting.getOrCreatePlayableScenePacket({
      stateCode: "CA",
      countySlug: "riverside-ca",
      districtSlug: "eastvale",
      selectedNodeId,
      createScene: () => ({ id: `scene-${selectedNodeId}` }),
      sceneIdForPayload: (scene) => scene.id,
    });
    now += 10;
  }
  const evictingStatus = evicting.status();
  addCheck("runtime-max-entry-eviction", evictingStatus.entryCount === 2 && !evictingStatus.entries.some((entry) => entry.key.includes("selected-a")), {
    blocker: "Memory adapter must evict older entries when maxEntries is reached.",
  });

  const shell = memory.describeCoverageStatus({
    stateCode: "CA",
    countySlug: "orange-ca",
    coverageTier: "L1_COUNTY_SHELL",
    sourceNotes: [{ source: "census", label: "Census county gazetteer", attribution: "US Census", ttlSeconds: 31_536_000 }],
  });
  const unsupported = memory.describeCoverageStatus({
    stateCode: "CA",
    countySlug: "made-up-ca",
    coverageTier: "L0_UNSUPPORTED",
  });
  addCheck("runtime-shell-unsupported-no-scene", shell.readiness === "shell_only" && shell.packet.containsScene === false && unsupported.readiness === "unsupported" && unsupported.packet.containsScene === false, {
    blocker: "Shell and unsupported packet statuses must not contain scene payload boundaries.",
  });

  return {
    firstCacheHit: first.summary.cacheHit,
    secondCacheHit: second.summary.cacheHit,
    expiredCacheHit: expired.summary.cacheHit,
    sceneBuilds,
    maxEntryStatus: evictingStatus.entryCount,
    shellReadiness: shell.readiness,
    unsupportedReadiness: unsupported.readiness,
  };
}

async function runUrlChecks(rawUrl) {
  const statusUrl = new URL("/api/engine/scene-packets/status", rawUrl);
  const response = await fetch(statusUrl);
  if (!response.ok) {
    blockers.push(`Scene packet status route returned HTTP ${response.status}.`);
    return { statusUrl: statusUrl.toString(), ok: false };
  }
  const body = await response.json();
  const bodyText = JSON.stringify(body);
  addCheck("route-status-shape", body.ok === true && body.update === UPDATE && body.cache?.update === UPDATE && Array.isArray(body.cache?.entries), {
    blocker: "Scene packet status route must return safe cache summary shape.",
  });
  addCheck("route-no-payload-leak", !/"payload"|"world"|"tiles"|"objects"|"providerPayload"|"google"/i.test(bodyText), {
    blocker: "Scene packet status route leaked payload, scene, object, provider, or Google data.",
  });
  return {
    statusUrl: statusUrl.toString(),
    ok: response.ok,
    entryCount: body.cache?.entryCount ?? null,
  };
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function toFileUrl(path) {
  return `file:///${path.replace(/\\/g, "/")}`;
}
