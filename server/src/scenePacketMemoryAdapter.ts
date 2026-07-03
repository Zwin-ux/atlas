import {
  assertScenePacketCachePlanSafe,
  createScenePacketCachePlan,
  type ScenePacketCachePlan,
  type ScenePacketCacheSafetyResult,
  type ScenePacketReadiness,
  type WorldSourceNote,
} from "@atlas/core";

export const SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID =
  "postalpha-0.32e-runtime-scene-packet-memory-adapter" as const;

export type ScenePacketMemoryPayloadKind =
  | "voxel_scene"
  | "coverage_shell_metadata"
  | "unsupported_status";

export type ScenePacketMemorySummary = {
  update: typeof SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID;
  key: string;
  readiness: ScenePacketReadiness;
  payloadKind: ScenePacketMemoryPayloadKind;
  sceneId: string | null;
  cacheHit: boolean;
  hitCount: number;
  createdAt: string;
  expiresAt: string | null;
  lastAccessedAt: string;
  ttlSeconds: number;
  generationStatus: ScenePacketCachePlan["generation"]["status"];
  generationMode: ScenePacketCachePlan["generation"]["mode"];
  generationBlockers: string[];
  packet: Pick<
    ScenePacketCachePlan["packet"],
    "containsScene" | "playable" | "publicRouteAllowed" | "metaOnlyScene"
  >;
  policy: Pick<
    ScenePacketCachePlan["policy"],
    "storageMode" | "canPersist" | "providerGeometryAllowed" | "liveProviderAllowed"
  >;
  safety: {
    passed: boolean;
    blockerCount: number;
    blockers: string[];
  };
};

export type ScenePacketMemoryStatus = {
  update: typeof SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID;
  maxEntries: number;
  entryCount: number;
  entries: ScenePacketMemorySummary[];
};

export type PlayableScenePacketInput<TScene> = {
  countryCode?: string;
  stateCode: string;
  countySlug: string;
  districtSlug: string;
  selectedNodeId: string;
  cameraPresetId?: string;
  sceneSchemaVersion?: string;
  engineUpdateId?: string;
  sourceNotes?: WorldSourceNote[];
  createScene: () => TScene;
  sceneIdForPayload: (scene: TScene) => string;
};

export type ScenePacketCoverageStatusInput = {
  countryCode?: string;
  stateCode: string;
  countySlug: string;
  coverageTier: string;
  sourceNotes?: WorldSourceNote[];
};

type ScenePacketMemoryEntry<TScene> = {
  plan: ScenePacketCachePlan;
  payload: TScene;
  payloadKind: ScenePacketMemoryPayloadKind;
  createdAtMs: number;
  expiresAtMs: number | null;
  lastAccessedAtMs: number;
  hitCount: number;
  safety: ScenePacketCacheSafetyResult;
};

export type ScenePacketMemoryResult<TScene> = {
  payload?: TScene;
  summary: ScenePacketMemorySummary;
};

export type ScenePacketMemoryAdapterOptions = {
  maxEntries?: number;
  nowMs?: () => number;
};

export type ScenePacketMemoryAdapter<TScene> = {
  getOrCreatePlayableScenePacket(input: PlayableScenePacketInput<TScene>): ScenePacketMemoryResult<TScene>;
  describeCoverageStatus(input: ScenePacketCoverageStatusInput): ScenePacketMemorySummary;
  status(): ScenePacketMemoryStatus;
  clearExpired(): number;
  size(): number;
};

const DEFAULT_MAX_ENTRIES = 32;
const PLAYABLE_RUNTIME_TTL_MS = 60 * 60 * 1000;

export function createScenePacketMemoryAdapter<TScene>(
  options: ScenePacketMemoryAdapterOptions = {},
): ScenePacketMemoryAdapter<TScene> {
  const maxEntries = Math.max(1, Math.floor(options.maxEntries ?? DEFAULT_MAX_ENTRIES));
  const nowMs = options.nowMs ?? Date.now;
  const entries = new Map<string, ScenePacketMemoryEntry<TScene>>();

  function getOrCreatePlayableScenePacket(input: PlayableScenePacketInput<TScene>): ScenePacketMemoryResult<TScene> {
    const now = nowMs();
    clearExpired();
    const planInput = {
      countryCode: input.countryCode ?? "US",
      stateCode: input.stateCode,
      countySlug: input.countySlug,
      districtSlug: input.districtSlug,
      cameraPresetId: input.cameraPresetId ?? "mcp-default",
      windowHash: `selected-${input.selectedNodeId}`,
      sceneSchemaVersion: input.sceneSchemaVersion,
      engineUpdateId: input.engineUpdateId,
      readiness: "public_playable" as const,
      sourceNotes: input.sourceNotes,
      generationMode: "curated_static" as const,
      sceneId: null,
    };
    const preliminaryPlan = createScenePacketCachePlan(planInput);
    const cached = entries.get(preliminaryPlan.key.key);

    if (cached && !isExpired(cached, now)) {
      cached.hitCount += 1;
      cached.lastAccessedAtMs = now;
      return {
        payload: cached.payload,
        summary: summarizeEntry(cached, true),
      };
    }

    if (cached) {
      entries.delete(preliminaryPlan.key.key);
    }

    const payload = input.createScene();
    const sceneId = input.sceneIdForPayload(payload);
    const plan = createScenePacketCachePlan({
      ...planInput,
      sceneId,
    });
    const safety = assertScenePacketCachePlanSafe(plan);
    if (!safety.passed) {
      throw new Error(`Unsafe scene packet cache plan: ${safety.blockers.join("; ")}`);
    }

    evictIfNeeded(now);
    const entry: ScenePacketMemoryEntry<TScene> = {
      plan,
      payload,
      payloadKind: "voxel_scene",
      createdAtMs: now,
      expiresAtMs: now + Math.max(0, plan.policy.ttlSeconds) * 1000 || now + PLAYABLE_RUNTIME_TTL_MS,
      lastAccessedAtMs: now,
      hitCount: 1,
      safety,
    };
    entries.set(plan.key.key, entry);

    return {
      payload,
      summary: summarizeEntry(entry, false),
    };
  }

  function describeCoverageStatus(input: ScenePacketCoverageStatusInput): ScenePacketMemorySummary {
    const readiness = readinessForCoverageTier(input.coverageTier);
    const plan = createScenePacketCachePlan({
      countryCode: input.countryCode ?? "US",
      stateCode: input.stateCode,
      countySlug: input.countySlug,
      cameraPresetId: "coverage-status",
      windowHash: readiness === "shell_only" ? "shell-metadata" : "unsupported-status",
      readiness,
      sourceNotes: input.sourceNotes,
      generationMode: "curated_static",
    });
    const safety = assertScenePacketCachePlanSafe(plan);
    const now = nowMs();
    return summarizePlan(plan, {
      payloadKind: readiness === "shell_only" ? "coverage_shell_metadata" : "unsupported_status",
      cacheHit: false,
      createdAtMs: now,
      expiresAtMs: plan.policy.ttlSeconds > 0 ? now + plan.policy.ttlSeconds * 1000 : null,
      lastAccessedAtMs: now,
      hitCount: 0,
      safety,
    });
  }

  function status(): ScenePacketMemoryStatus {
    clearExpired();
    return {
      update: SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
      maxEntries,
      entryCount: entries.size,
      entries: [...entries.values()].map((entry) => summarizeEntry(entry, false)),
    };
  }

  function clearExpired(): number {
    const now = nowMs();
    let removed = 0;
    for (const [key, entry] of entries) {
      if (isExpired(entry, now)) {
        entries.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  function size(): number {
    clearExpired();
    return entries.size;
  }

  function evictIfNeeded(now: number): void {
    if (entries.size < maxEntries) return;
    let oldestKey: string | undefined;
    let oldestAccess = Number.POSITIVE_INFINITY;
    for (const [key, entry] of entries) {
      if (isExpired(entry, now)) {
        entries.delete(key);
        return;
      }
      if (entry.lastAccessedAtMs < oldestAccess) {
        oldestAccess = entry.lastAccessedAtMs;
        oldestKey = key;
      }
    }
    if (oldestKey) entries.delete(oldestKey);
  }

  return {
    getOrCreatePlayableScenePacket,
    describeCoverageStatus,
    status,
    clearExpired,
    size,
  };
}

function summarizeEntry<TScene>(entry: ScenePacketMemoryEntry<TScene>, cacheHit: boolean): ScenePacketMemorySummary {
  return summarizePlan(entry.plan, {
    payloadKind: entry.payloadKind,
    cacheHit,
    createdAtMs: entry.createdAtMs,
    expiresAtMs: entry.expiresAtMs,
    lastAccessedAtMs: entry.lastAccessedAtMs,
    hitCount: entry.hitCount,
    safety: entry.safety,
  });
}

function summarizePlan(
  plan: ScenePacketCachePlan,
  input: {
    payloadKind: ScenePacketMemoryPayloadKind;
    cacheHit: boolean;
    createdAtMs: number;
    expiresAtMs: number | null;
    lastAccessedAtMs: number;
    hitCount: number;
    safety: ScenePacketCacheSafetyResult;
  },
): ScenePacketMemorySummary {
  return {
    update: SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
    key: plan.key.key,
    readiness: plan.readiness,
    payloadKind: input.payloadKind,
    sceneId: plan.packet.sceneId,
    cacheHit: input.cacheHit,
    hitCount: input.hitCount,
    createdAt: toIso(input.createdAtMs),
    expiresAt: input.expiresAtMs === null ? null : toIso(input.expiresAtMs),
    lastAccessedAt: toIso(input.lastAccessedAtMs),
    ttlSeconds: plan.policy.ttlSeconds,
    generationStatus: plan.generation.status,
    generationMode: plan.generation.mode,
    generationBlockers: [...plan.generation.blockers],
    packet: {
      containsScene: plan.packet.containsScene,
      playable: plan.packet.playable,
      publicRouteAllowed: plan.packet.publicRouteAllowed,
      metaOnlyScene: plan.packet.metaOnlyScene,
    },
    policy: {
      storageMode: plan.policy.storageMode,
      canPersist: plan.policy.canPersist,
      providerGeometryAllowed: plan.policy.providerGeometryAllowed,
      liveProviderAllowed: plan.policy.liveProviderAllowed,
    },
    safety: {
      passed: input.safety.passed,
      blockerCount: input.safety.blockers.length,
      blockers: [...input.safety.blockers],
    },
  };
}

function readinessForCoverageTier(coverageTier: string): ScenePacketReadiness {
  if (coverageTier === "L1_COUNTY_SHELL") return "shell_only";
  if (coverageTier === "L0_UNSUPPORTED") return "unsupported";
  return "blocked";
}

function isExpired<TScene>(entry: ScenePacketMemoryEntry<TScene>, now: number): boolean {
  return entry.expiresAtMs !== null && entry.expiresAtMs <= now;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}
