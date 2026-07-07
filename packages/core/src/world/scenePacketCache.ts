import type { WorldSourceNote } from "./types.js";

export const SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID =
  "postalpha-0.31e-server-scene-packet-cache-contract" as const;

export type ScenePacketCacheStorageMode = "runtime_memory" | "future_persistent" | "none";

export type ScenePacketGenerationMode =
  | "curated_static"
  | "deterministic_generated_draft"
  | "provider_normalized_future"
  | "background_generation_future";

export type ScenePacketGenerationJobStatus = "not_queued" | "blocked" | "queued" | "running" | "succeeded" | "failed";

export type ScenePacketReadiness =
  | "public_playable"
  | "shell_only"
  | "generated_draft"
  | "hidden_draft"
  | "unsupported"
  | "blocked";

export type ScenePacketViewportFrame = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type ScenePacketCacheKeyInput = {
  countryCode: string;
  stateCode: string;
  countySlug: string;
  districtSlug?: string;
  cameraPresetId: string;
  windowHash?: string;
  viewportFrame?: ScenePacketViewportFrame;
  sceneSchemaVersion?: string;
  engineUpdateId?: string;
};

export type ScenePacketCacheKeyParts = {
  countryCode: string;
  stateCode: string;
  countySlug: string;
  districtSlug: string;
  cameraPresetId: string;
  windowHash: string;
  sceneSchemaVersion: string;
  engineUpdateId: string;
};

export type ScenePacketCacheKey = {
  type: "scenePacketCacheKey";
  key: string;
  parts: ScenePacketCacheKeyParts;
};

export type ScenePacketCachePolicy = {
  storageMode: ScenePacketCacheStorageMode;
  ttlSeconds: number;
  staleWhileRevalidateSeconds: number;
  canPersist: false;
  providerGeometryAllowed: false;
  liveProviderAllowed: false;
  reason: string;
};

export type ScenePacketGenerationJob = {
  status: ScenePacketGenerationJobStatus;
  mode: ScenePacketGenerationMode;
  jobKey: string;
  blockers: string[];
};

export type ScenePacketPayloadBoundary = {
  sceneId: string | null;
  containsScene: boolean;
  playable: boolean;
  publicRouteAllowed: boolean;
  containsProviderGeometry: false;
  structuredContentSafe: true;
  metaOnlyScene: boolean;
};

export type ScenePacketCachePlan = {
  type: "scenePacketCachePlan";
  update: typeof SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID;
  readiness: ScenePacketReadiness;
  key: ScenePacketCacheKey;
  policy: ScenePacketCachePolicy;
  generation: ScenePacketGenerationJob;
  sourceNotes: WorldSourceNote[];
  packet: ScenePacketPayloadBoundary;
};

export type ScenePacketCachePlanInput = ScenePacketCacheKeyInput & {
  readiness: ScenePacketReadiness;
  sourceNotes?: WorldSourceNote[];
  generationMode?: ScenePacketGenerationMode;
  sceneId?: string | null;
};

export type ScenePacketCacheSafetyResult = {
  passed: boolean;
  blockers: string[];
};

export function createScenePacketCacheKey(input: ScenePacketCacheKeyInput): ScenePacketCacheKey {
  const parts: ScenePacketCacheKeyParts = {
    countryCode: normalizeKeyPart(input.countryCode || "us"),
    stateCode: normalizeKeyPart(input.stateCode),
    countySlug: normalizeKeyPart(input.countySlug),
    districtSlug: normalizeKeyPart(input.districtSlug || "county"),
    cameraPresetId: normalizeKeyPart(input.cameraPresetId),
    windowHash: normalizeKeyPart(input.windowHash || hashScenePacketViewportFrame(input.viewportFrame)),
    sceneSchemaVersion: normalizeKeyPart(input.sceneSchemaVersion || "city-world-v1"),
    engineUpdateId: normalizeKeyPart(input.engineUpdateId || SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID),
  };

  return {
    type: "scenePacketCacheKey",
    key: [
      "atlas",
      "scene-packet",
      "v1",
      parts.countryCode,
      parts.stateCode,
      parts.countySlug,
      parts.districtSlug,
      parts.cameraPresetId,
      parts.windowHash,
      parts.sceneSchemaVersion,
      parts.engineUpdateId,
    ].join(":"),
    parts,
  };
}

export function hashScenePacketViewportFrame(frame?: ScenePacketViewportFrame): string {
  if (!frame) return "window-all";
  const values = [frame.minX, frame.maxX, frame.minY, frame.maxY].map((value) => Math.round(value * 100));
  let hash = 2166136261;
  for (const value of values) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return `window-${(hash >>> 0).toString(36)}`;
}

export function scenePacketCachePolicyForReadiness(readiness: ScenePacketReadiness): ScenePacketCachePolicy {
  switch (readiness) {
    case "public_playable":
      return {
        storageMode: "runtime_memory",
        ttlSeconds: 3600,
        staleWhileRevalidateSeconds: 300,
        canPersist: false,
        providerGeometryAllowed: false,
        liveProviderAllowed: false,
        reason: "Playable scene packets can be cached in process, but DB persistence and live provider geometry remain gated.",
      };
    case "shell_only":
      return {
        storageMode: "runtime_memory",
        ttlSeconds: 86400,
        staleWhileRevalidateSeconds: 3600,
        canPersist: false,
        providerGeometryAllowed: false,
        liveProviderAllowed: false,
        reason: "Shell counties may cache coverage metadata only; they cannot cache playable scene geometry.",
      };
    case "hidden_draft":
      return {
        storageMode: "runtime_memory",
        ttlSeconds: 1800,
        staleWhileRevalidateSeconds: 0,
        canPersist: false,
        providerGeometryAllowed: false,
        liveProviderAllowed: false,
        reason: "Hidden draft packets are internal proof artifacts and must not become public routes.",
      };
    case "generated_draft":
      return {
        storageMode: "runtime_memory",
        ttlSeconds: 1800,
        staleWhileRevalidateSeconds: 0,
        canPersist: false,
        providerGeometryAllowed: false,
        liveProviderAllowed: false,
        reason: "Generated draft packets may cache deterministic server-compiled scenes in process, but remain non-public and non-playable.",
      };
    case "unsupported":
      return {
        storageMode: "none",
        ttlSeconds: 0,
        staleWhileRevalidateSeconds: 0,
        canPersist: false,
        providerGeometryAllowed: false,
        liveProviderAllowed: false,
        reason: "Unsupported counties do not have scene packets.",
      };
    case "blocked":
      return {
        storageMode: "none",
        ttlSeconds: 0,
        staleWhileRevalidateSeconds: 0,
        canPersist: false,
        providerGeometryAllowed: false,
        liveProviderAllowed: false,
        reason: "Blocked packets are not generated, cached, persisted, or exposed.",
      };
  }
}

export function createScenePacketCachePlan(input: ScenePacketCachePlanInput): ScenePacketCachePlan {
  const key = createScenePacketCacheKey(input);
  const generationMode = input.generationMode || "curated_static";
  const generationBlockers = generationBlockersForMode(generationMode);
  const readinessBlockers = generationBlockersForReadiness(input.readiness);
  const generation = {
    status: generationBlockers.length > 0 || readinessBlockers.length > 0 ? "blocked" : "not_queued",
    mode: generationMode,
    jobKey: `${key.key}:job:${generationMode}`,
    blockers: [...generationBlockers, ...readinessBlockers],
  } satisfies ScenePacketGenerationJob;

  return {
    type: "scenePacketCachePlan",
    update: SCENE_PACKET_CACHE_CONTRACT_UPDATE_ID,
    readiness: input.readiness,
    key,
    policy: scenePacketCachePolicyForReadiness(input.readiness),
    generation,
    sourceNotes: input.sourceNotes ? [...input.sourceNotes] : [],
    packet: packetBoundaryForReadiness(input.readiness, input.sceneId || null),
  };
}

export function assertScenePacketCachePlanSafe(plan: ScenePacketCachePlan): ScenePacketCacheSafetyResult {
  const blockers: string[] = [];

  if (plan.policy.canPersist !== false) blockers.push("Scene packet persistence is gated; canPersist must stay false.");
  if (plan.policy.providerGeometryAllowed !== false) blockers.push("Provider geometry must not be allowed in scene packets.");
  if (plan.policy.liveProviderAllowed !== false) blockers.push("Live provider calls must not be allowed by scene packet cache policy.");
  if (plan.packet.containsProviderGeometry !== false) blockers.push("Scene packet boundary must not contain provider geometry.");
  if (plan.packet.structuredContentSafe !== true) blockers.push("Scene packet boundary must keep large scene data out of structuredContent.");
  if (plan.sourceNotes.some((note) => note.source === "google")) {
    blockers.push("Google/provider source notes cannot feed scene packet cache plans before provider normalization gates reopen.");
  }

  if (plan.readiness === "public_playable") {
    if (!plan.packet.containsScene) blockers.push("Public playable packets must contain a bounded scene.");
    if (!plan.packet.playable) blockers.push("Public playable packets must be marked playable.");
    if (!plan.packet.publicRouteAllowed) blockers.push("Public playable packets must be route-allowed.");
  }

  if (plan.readiness === "shell_only") {
    if (plan.packet.containsScene) blockers.push("Shell-only packets must not contain scene geometry.");
    if (plan.packet.playable) blockers.push("Shell-only packets must not be playable.");
  }

  if (plan.readiness === "hidden_draft") {
    if (plan.packet.playable) blockers.push("Hidden draft packets must not be playable.");
    if (plan.packet.publicRouteAllowed) blockers.push("Hidden draft packets must not be public routes.");
    if (!plan.packet.metaOnlyScene) blockers.push("Hidden draft scene packets must stay in meta/evidence channels.");
  }

  if (plan.readiness === "generated_draft") {
    if (!plan.packet.containsScene) blockers.push("Generated draft packets must contain a bounded scene.");
    if (plan.packet.playable) blockers.push("Generated draft packets must not be playable.");
    if (plan.packet.publicRouteAllowed) blockers.push("Generated draft packets must not be public routes.");
    if (!plan.packet.metaOnlyScene) blockers.push("Generated draft scene packets must stay in meta channels.");
  }

  if (plan.readiness === "unsupported") {
    if (plan.packet.containsScene) blockers.push("Unsupported counties must not receive scene packets.");
    if (plan.packet.publicRouteAllowed) blockers.push("Unsupported packets must not be route-allowed as scenes.");
  }

  if (!["curated_static", "deterministic_generated_draft"].includes(plan.generation.mode) && plan.generation.status !== "blocked") {
    blockers.push("Future provider/background generation modes must stay blocked until live generation gates reopen.");
  }

  return {
    passed: blockers.length === 0,
    blockers,
  };
}

function packetBoundaryForReadiness(readiness: ScenePacketReadiness, sceneId: string | null): ScenePacketPayloadBoundary {
  switch (readiness) {
    case "public_playable":
      return {
        sceneId: sceneId || "scene:riverside-ca:eastvale",
        containsScene: true,
        playable: true,
        publicRouteAllowed: true,
        containsProviderGeometry: false,
        structuredContentSafe: true,
        metaOnlyScene: true,
      };
    case "shell_only":
      return {
        sceneId: null,
        containsScene: false,
        playable: false,
        publicRouteAllowed: true,
        containsProviderGeometry: false,
        structuredContentSafe: true,
        metaOnlyScene: false,
      };
    case "hidden_draft":
      return {
        sceneId: sceneId || "scene:hidden-draft",
        containsScene: true,
        playable: false,
        publicRouteAllowed: false,
        containsProviderGeometry: false,
        structuredContentSafe: true,
        metaOnlyScene: true,
      };
    case "generated_draft":
      return {
        sceneId: sceneId || "scene:generated-draft",
        containsScene: true,
        playable: false,
        publicRouteAllowed: false,
        containsProviderGeometry: false,
        structuredContentSafe: true,
        metaOnlyScene: true,
      };
    case "unsupported":
    case "blocked":
      return {
        sceneId: null,
        containsScene: false,
        playable: false,
        publicRouteAllowed: false,
        containsProviderGeometry: false,
        structuredContentSafe: true,
        metaOnlyScene: false,
      };
  }
}

function generationBlockersForMode(mode: ScenePacketGenerationMode): string[] {
  if (mode === "curated_static") return [];
  if (mode === "deterministic_generated_draft") return [];
  if (mode === "provider_normalized_future") {
    return [
      "provider_normalization_not_enabled",
      "provider_geometry_not_allowed",
      "live_provider_generation_not_enabled",
    ];
  }
  return [
    "background_generation_not_enabled",
    "persistent_scene_packet_storage_not_enabled",
  ];
}

function generationBlockersForReadiness(readiness: ScenePacketReadiness): string[] {
  if (readiness === "unsupported") return ["unsupported_county_has_no_scene_packet"];
  if (readiness === "blocked") return ["scene_packet_blocked_by_release_gate"];
  return [];
}

function normalizeKeyPart(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "unknown";
}
