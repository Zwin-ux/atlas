import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  assertScenePacketCachePlanSafe,
  createScenePacketCachePlan,
  createScenePacketMemoryJobQueue as createCoreScenePacketMemoryJobQueue,
  type ScenePacketClaimedJob,
  type ScenePacketCachePlan,
  type ScenePacketCacheSafetyResult,
  type ScenePacketJobQueueStatus,
  type ScenePacketReadiness,
  type WorldSourceNote,
} from "@atlas/core";

export const SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID =
  "postalpha-0.72b-redis-scene-packet-cache-job-spine" as const;

export type ScenePacketCacheBackend = "memory" | "redis";

export type ScenePacketMemoryPayloadKind =
  | "voxel_scene"
  | "generated_draft_scene"
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
  cacheBackend: ScenePacketCacheBackend;
  maxEntries: number;
  entryCount: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  queueDepth: number;
  claimedCount: number;
  oldestQueuedMs: number | null;
  oldestClaimedMs: number | null;
  lockTtlSeconds: number;
  redisConfigured: boolean;
  redisReachable: boolean | null;
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

export type ScenePacketGeneratedDraftJob = {
  id: string;
  kind: "generated_draft_scene";
  enqueuedAtMs: number;
  countryCode?: string;
  stateCode: string;
  countySlug: string;
  countyName?: string;
  geoid?: string;
  centroid?: {
    latitude: number;
    longitude: number;
  };
  districtSlug: string;
  cameraPresetId: string;
  windowHash: string;
  sceneSchemaVersion: string;
  engineUpdateId: string;
  sourceNotes?: WorldSourceNote[];
};

export type GeneratedDraftScenePacketInput<TScene> = {
  countryCode?: string;
  stateCode: string;
  countySlug: string;
  districtSlug: string;
  cameraPresetId?: string;
  windowHash?: string;
  sceneSchemaVersion?: string;
  engineUpdateId?: string;
  sourceNotes?: WorldSourceNote[];
  createScene: () => TScene;
  sceneIdForPayload: (scene: TScene) => string;
  job?: ScenePacketGeneratedDraftJob;
  enqueueOnLockContention?: boolean;
};

export type ScenePacketCoverageStatusInput = {
  countryCode?: string;
  stateCode: string;
  countySlug: string;
  coverageTier: string;
  sourceNotes?: WorldSourceNote[];
};

export type ScenePacketCacheStoreEntry<TScene> = {
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

export type ScenePacketCacheStoreStatus = {
  backend: ScenePacketCacheBackend;
  maxEntries: number;
  entryCount: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  redisConfigured: boolean;
  redisReachable: boolean | null;
};

export type ScenePacketCacheStore<TScene> = {
  backend: ScenePacketCacheBackend;
  get(key: string, nowMs: number): Promise<ScenePacketCacheStoreEntry<TScene> | undefined>;
  set(key: string, entry: ScenePacketCacheStoreEntry<TScene>, nowMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  values(nowMs: number): Promise<ScenePacketCacheStoreEntry<TScene>[]>;
  clearExpired(nowMs: number): Promise<number>;
  size(nowMs: number): Promise<number>;
  status(nowMs: number): Promise<ScenePacketCacheStoreStatus>;
};

export type ScenePacketCompileLock = {
  acquire(
    key: string,
    ttlSeconds: number,
  ): Promise<{
    acquired: boolean;
    token: string;
    release: () => Promise<void>;
  }>;
};

export type ScenePacketJobQueue<TJob extends { id: string; enqueuedAtMs: number }> = {
  enqueue(job: TJob): Promise<void>;
  claim(nowMs: number): Promise<ScenePacketClaimedJob<TJob> | undefined>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
  status(nowMs: number): Promise<ScenePacketJobQueueStatus>;
};

export type ScenePacketRuntimeConfig = {
  requestedBackend: ScenePacketCacheBackend;
  effectiveBackend: ScenePacketCacheBackend;
  redisUrl?: string;
  redisRequired: boolean;
  workerEnabled: boolean;
  lockTtlSeconds: number;
  lockWaitMs: number;
  production: boolean;
  blockers: string[];
};

export type ScenePacketMemoryAdapterOptions<TScene = unknown> = {
  maxEntries?: number;
  nowMs?: () => number;
  cacheBackend?: ScenePacketCacheBackend;
  redisUrl?: string;
  lockTtlSeconds?: number;
  lockWaitMs?: number;
  store?: ScenePacketCacheStore<TScene>;
  compileLock?: ScenePacketCompileLock;
  jobQueue?: ScenePacketJobQueue<ScenePacketGeneratedDraftJob>;
};

export type ScenePacketMemoryAdapter<TScene> = {
  getOrCreatePlayableScenePacket(input: PlayableScenePacketInput<TScene>): Promise<ScenePacketMemoryResult<TScene>>;
  getOrCreateGeneratedDraftScenePacket(
    input: GeneratedDraftScenePacketInput<TScene>,
  ): Promise<ScenePacketMemoryResult<TScene>>;
  describeCoverageStatus(input: ScenePacketCoverageStatusInput): Promise<ScenePacketMemorySummary>;
  status(): Promise<ScenePacketMemoryStatus>;
  clearExpired(): Promise<number>;
  size(): Promise<number>;
  claimGeneratedDraftJob(): Promise<ScenePacketGeneratedDraftJob | undefined>;
  completeGeneratedDraftJob(jobId: string): Promise<void>;
  failGeneratedDraftJob(jobId: string, error: string): Promise<void>;
};

const DEFAULT_MAX_ENTRIES = 32;
const DEFAULT_LOCK_TTL_SECONDS = 30;
const DEFAULT_LOCK_WAIT_MS = 2_000;
const PLAYABLE_RUNTIME_TTL_MS = 60 * 60 * 1000;
const REDIS_CACHE_PREFIX = "atlas:scene-packet-cache:";
const REDIS_LOCK_PREFIX = "atlas:scene-packet-lock:";
// v2 namespace: the pre-W6 deployment stored the queue under
// atlas:scene-packet-jobs:* with different value types; reusing those key
// names on a live Redis returned WRONGTYPE replies (crashed the first W6
// deploy). Fresh names sidestep any legacy-typed keys; the old ones expire
// or sit unused (queue work is transient).
const REDIS_JOB_QUEUE_KEY = "atlas:scene-packet-jobs:v2:pending";
const REDIS_JOB_CLAIMED_KEY = "atlas:scene-packet-jobs:v2:claimed";
const REDIS_JOB_DONE_PREFIX = "atlas:scene-packet-jobs:v2:done:";
const REDIS_JOB_FAILED_PREFIX = "atlas:scene-packet-jobs:v2:failed:";
const DEFAULT_JOB_CLAIM_TTL_MS = DEFAULT_LOCK_TTL_SECONDS * 1000;

export function readScenePacketRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): ScenePacketRuntimeConfig {
  const requestedBackend =
    normalizeBackend(env.ATLAS_SCENE_PACKET_CACHE_BACKEND) ?? "memory";
  const redisUrl = env.ATLAS_REDIS_URL?.trim() || undefined;
  const production =
    env.NODE_ENV === "production" ||
    env.RAILWAY_ENVIRONMENT === "production" ||
    env.RAILWAY_ENVIRONMENT_NAME === "production";
  const workerEnabled = parseBooleanEnv(env.ATLAS_SCENE_PACKET_WORKER_ENABLED, false);
  const lockTtlSeconds = parsePositiveIntegerEnv(
    env.ATLAS_SCENE_PACKET_LOCK_TTL_SECONDS,
    DEFAULT_LOCK_TTL_SECONDS,
  );
  const lockWaitMs = parsePositiveIntegerEnv(env.ATLAS_SCENE_PACKET_LOCK_WAIT_MS, DEFAULT_LOCK_WAIT_MS);
  const redisRequired = production || requestedBackend === "redis" || workerEnabled;
  const effectiveBackend = requestedBackend === "redis" && redisUrl ? "redis" : "memory";
  const blockers: string[] = [];

  if (redisRequired && !redisUrl) {
    blockers.push("ATLAS_REDIS_URL is required for production, Redis cache mode, or the scene packet worker.");
  }
  if (production && requestedBackend !== "redis") {
    blockers.push("Production scene packet cache must set ATLAS_SCENE_PACKET_CACHE_BACKEND=redis.");
  }

  return {
    requestedBackend,
    effectiveBackend,
    ...(redisUrl ? { redisUrl } : {}),
    redisRequired,
    workerEnabled,
    lockTtlSeconds,
    lockWaitMs,
    production,
    blockers,
  };
}

export function createScenePacketMemoryAdapter<TScene>(
  options: ScenePacketMemoryAdapterOptions<TScene> = {},
): ScenePacketMemoryAdapter<TScene> {
  const maxEntries = Math.max(1, Math.floor(options.maxEntries ?? DEFAULT_MAX_ENTRIES));
  const nowMs = options.nowMs ?? Date.now;
  const lockTtlSeconds = Math.max(1, Math.floor(options.lockTtlSeconds ?? DEFAULT_LOCK_TTL_SECONDS));
  const lockWaitMs = Math.max(0, Math.floor(options.lockWaitMs ?? DEFAULT_LOCK_WAIT_MS));
  const jobClaimTtlMs = lockTtlSeconds * 1000;
  const cacheBackend = options.cacheBackend === "redis" && options.redisUrl ? "redis" : "memory";
  const redisConnector =
    cacheBackend === "redis" && options.redisUrl ? createLazyRedisConnector(options.redisUrl) : undefined;
  const store =
    options.store ??
    (redisConnector
      ? createRedisScenePacketCacheStore<TScene>({ connector: redisConnector, maxEntries })
      : createMemoryScenePacketCacheStore<TScene>({ maxEntries }));
  const compileLock =
    options.compileLock ??
    (redisConnector ? createRedisScenePacketCompileLock(redisConnector) : createMemoryScenePacketCompileLock());
  const jobQueue =
    options.jobQueue ??
    (redisConnector
      ? createRedisScenePacketJobQueue<ScenePacketGeneratedDraftJob>(redisConnector, {
          claimTtlMs: jobClaimTtlMs,
        })
      : createMemoryScenePacketJobQueue<ScenePacketGeneratedDraftJob>({
          claimTtlMs: jobClaimTtlMs,
        }));

  async function getOrCreatePlayableScenePacket(
    input: PlayableScenePacketInput<TScene>,
  ): Promise<ScenePacketMemoryResult<TScene>> {
    const now = nowMs();
    await store.clearExpired(now);
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
    const cached = await store.get(preliminaryPlan.key.key, now);

    if (cached) {
      return {
        payload: cached.payload,
        summary: summarizeEntry(cached, true),
      };
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

    const entry: ScenePacketCacheStoreEntry<TScene> = {
      plan,
      payload,
      payloadKind: "voxel_scene",
      createdAtMs: now,
      expiresAtMs: now + Math.max(0, plan.policy.ttlSeconds) * 1000 || now + PLAYABLE_RUNTIME_TTL_MS,
      lastAccessedAtMs: now,
      hitCount: 1,
      safety,
    };
    await store.set(plan.key.key, entry, now);

    return {
      payload,
      summary: summarizeEntry(entry, false),
    };
  }

  async function getOrCreateGeneratedDraftScenePacket(
    input: GeneratedDraftScenePacketInput<TScene>,
  ): Promise<ScenePacketMemoryResult<TScene>> {
    const now = nowMs();
    await store.clearExpired(now);
    const planInput = {
      countryCode: input.countryCode ?? "US",
      stateCode: input.stateCode,
      countySlug: input.countySlug,
      districtSlug: input.districtSlug,
      cameraPresetId: input.cameraPresetId ?? "generated-draft",
      windowHash: input.windowHash ?? "generated-initial-window",
      sceneSchemaVersion: input.sceneSchemaVersion ?? "city-world-v1",
      engineUpdateId: input.engineUpdateId,
      readiness: "generated_draft" as const,
      sourceNotes: input.sourceNotes,
      generationMode: "deterministic_generated_draft" as const,
      sceneId: null,
    };
    const preliminaryPlan = createScenePacketCachePlan(planInput);
    const cached = await store.get(preliminaryPlan.key.key, now);

    if (cached) {
      return {
        payload: cached.payload,
        summary: summarizeEntry(cached, true),
      };
    }

    const lock = await compileLock.acquire(preliminaryPlan.key.key, lockTtlSeconds);
    if (!lock.acquired) {
      if (input.enqueueOnLockContention !== false && input.job) {
        await jobQueue.enqueue(input.job);
      }
      const waited = await waitForCachedPacket(preliminaryPlan.key.key);
      if (waited) {
        return {
          payload: waited.payload,
          summary: summarizeEntry(waited, true),
        };
      }
      const safety = assertScenePacketCachePlanSafe(preliminaryPlan);
      return {
        summary: summarizePlan(preliminaryPlan, {
          payloadKind: "generated_draft_scene",
          cacheHit: false,
          createdAtMs: now,
          expiresAtMs: preliminaryPlan.policy.ttlSeconds > 0 ? now + preliminaryPlan.policy.ttlSeconds * 1000 : null,
          lastAccessedAtMs: now,
          hitCount: 0,
          safety,
          generationStatus: "queued",
        }),
      };
    }

    try {
      const lockCached = await store.get(preliminaryPlan.key.key, nowMs());
      if (lockCached) {
        return {
          payload: lockCached.payload,
          summary: summarizeEntry(lockCached, true),
        };
      }

      const payload = input.createScene();
      const sceneId = input.sceneIdForPayload(payload);
      const plan = createScenePacketCachePlan({
        ...planInput,
        sceneId,
      });
      const safety = assertScenePacketCachePlanSafe(plan);
      if (!safety.passed) {
        throw new Error(`Unsafe generated draft scene packet cache plan: ${safety.blockers.join("; ")}`);
      }

      const compileNow = nowMs();
      const entry: ScenePacketCacheStoreEntry<TScene> = {
        plan,
        payload,
        payloadKind: "generated_draft_scene",
        createdAtMs: compileNow,
        expiresAtMs: plan.policy.ttlSeconds > 0 ? compileNow + plan.policy.ttlSeconds * 1000 : null,
        lastAccessedAtMs: compileNow,
        hitCount: 1,
        safety,
      };
      await store.set(plan.key.key, entry, compileNow);

      return {
        payload,
        summary: summarizeEntry(entry, false),
      };
    } finally {
      await lock.release();
    }
  }

  async function waitForCachedPacket(key: string): Promise<ScenePacketCacheStoreEntry<TScene> | undefined> {
    if (lockWaitMs <= 0) return undefined;
    const startedAt = nowMs();
    while (nowMs() - startedAt < lockWaitMs) {
      await delay(100);
      const cached = await store.get(key, nowMs());
      if (cached) return cached;
    }
    return undefined;
  }

  async function describeCoverageStatus(input: ScenePacketCoverageStatusInput): Promise<ScenePacketMemorySummary> {
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

  async function status(): Promise<ScenePacketMemoryStatus> {
    const now = nowMs();
    await store.clearExpired(now);
    const [cacheStatus, queueStatus, entries] = await Promise.all([
      store.status(now),
      jobQueue.status(now),
      store.values(now),
    ]);
    return {
      update: SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
      cacheBackend: cacheStatus.backend,
      maxEntries: cacheStatus.maxEntries,
      entryCount: cacheStatus.entryCount,
      hitCount: cacheStatus.hitCount,
      missCount: cacheStatus.missCount,
      hitRate: cacheStatus.hitRate,
      queueDepth: queueStatus.queueDepth,
      claimedCount: queueStatus.claimedCount,
      oldestQueuedMs: queueStatus.oldestQueuedMs,
      oldestClaimedMs: queueStatus.oldestClaimedMs,
      lockTtlSeconds,
      redisConfigured: cacheStatus.redisConfigured,
      redisReachable: cacheStatus.redisReachable,
      entries: entries.map((entry) => summarizeEntry(entry, false)),
    };
  }

  async function clearExpired(): Promise<number> {
    return store.clearExpired(nowMs());
  }

  async function size(): Promise<number> {
    return store.size(nowMs());
  }

  return {
    getOrCreatePlayableScenePacket,
    getOrCreateGeneratedDraftScenePacket,
    describeCoverageStatus,
    status,
    clearExpired,
    size,
    claimGeneratedDraftJob: () => jobQueue.claim(nowMs()),
    completeGeneratedDraftJob: (jobId: string) => jobQueue.complete(jobId),
    failGeneratedDraftJob: (jobId: string, error: string) => jobQueue.fail(jobId, error),
  };
}

export function createMemoryScenePacketCacheStore<TScene>(options: {
  maxEntries?: number;
} = {}): ScenePacketCacheStore<TScene> {
  const maxEntries = Math.max(1, Math.floor(options.maxEntries ?? DEFAULT_MAX_ENTRIES));
  const entries = new Map<string, ScenePacketCacheStoreEntry<TScene>>();
  let hitCount = 0;
  let missCount = 0;

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
    backend: "memory",
    async get(key, now) {
      const entry = entries.get(key);
      if (!entry) {
        missCount += 1;
        return undefined;
      }
      if (isExpired(entry, now)) {
        entries.delete(key);
        missCount += 1;
        return undefined;
      }
      hitCount += 1;
      entry.hitCount += 1;
      entry.lastAccessedAtMs = now;
      return entry;
    },
    async set(key, entry, now) {
      evictIfNeeded(now);
      entries.set(key, entry);
    },
    async delete(key) {
      entries.delete(key);
    },
    async values(now) {
      await this.clearExpired(now);
      return [...entries.values()];
    },
    async clearExpired(now) {
      let removed = 0;
      for (const [key, entry] of entries) {
        if (isExpired(entry, now)) {
          entries.delete(key);
          removed += 1;
        }
      }
      return removed;
    },
    async size(now) {
      await this.clearExpired(now);
      return entries.size;
    },
    async status(now) {
      await this.clearExpired(now);
      return {
        backend: "memory",
        maxEntries,
        entryCount: entries.size,
        hitCount,
        missCount,
        hitRate: hitRate(hitCount, missCount),
        redisConfigured: false,
        redisReachable: null,
      };
    },
  };
}

export function createMemoryScenePacketCompileLock(): ScenePacketCompileLock {
  const locks = new Map<string, { token: string; expiresAtMs: number }>();

  return {
    async acquire(key, ttlSeconds) {
      const now = Date.now();
      const existing = locks.get(key);
      if (existing && existing.expiresAtMs > now) {
        return {
          acquired: false,
          token: randomUUID(),
          release: async () => undefined,
        };
      }
      if (existing) locks.delete(key);
      const token = randomUUID();
      locks.set(key, { token, expiresAtMs: now + ttlSeconds * 1000 });
      return {
        acquired: true,
        token,
        release: async () => {
          const current = locks.get(key);
          if (current?.token === token) locks.delete(key);
        },
      };
    },
  };
}

export function createMemoryScenePacketJobQueue<TJob extends { id: string; enqueuedAtMs: number }>(options: {
  ownerId?: string;
  claimTtlMs?: number;
} = {}): ScenePacketJobQueue<TJob> {
  return createCoreScenePacketMemoryJobQueue<TJob>(options);
}

export function createRedisScenePacketCacheStore<TScene>(options: {
  connector: LazyRedisConnector;
  maxEntries?: number;
}): ScenePacketCacheStore<TScene> {
  const maxEntries = Math.max(1, Math.floor(options.maxEntries ?? DEFAULT_MAX_ENTRIES));
  let hitCount = 0;
  let missCount = 0;

  return {
    backend: "redis",
    async get(key, now) {
      const client = await options.connector.client();
      const redisKey = REDIS_CACHE_PREFIX + key;
      const raw = await client.get(redisKey);
      if (!raw) {
        missCount += 1;
        return undefined;
      }
      const entry = parseJson<ScenePacketCacheStoreEntry<TScene>>(raw);
      if (!entry || isExpired(entry, now)) {
        await client.del(redisKey);
        missCount += 1;
        return undefined;
      }
      hitCount += 1;
      entry.hitCount += 1;
      entry.lastAccessedAtMs = now;
      await writeRedisEntry(client, redisKey, entry, now);
      return entry;
    },
    async set(key, entry, now) {
      const client = await options.connector.client();
      await writeRedisEntry(client, REDIS_CACHE_PREFIX + key, entry, now);
    },
    async delete(key) {
      const client = await options.connector.client();
      await client.del(REDIS_CACHE_PREFIX + key);
    },
    async values(now) {
      const client = await options.connector.client();
      const keys = await listRedisKeys(client, `${REDIS_CACHE_PREFIX}*`);
      const entries: ScenePacketCacheStoreEntry<TScene>[] = [];
      for (const key of keys.slice(0, maxEntries)) {
        const raw = await client.get(key);
        const entry = raw ? parseJson<ScenePacketCacheStoreEntry<TScene>>(raw) : undefined;
        if (!entry) continue;
        if (isExpired(entry, now)) {
          await client.del(key);
          continue;
        }
        entries.push(entry);
      }
      return entries;
    },
    async clearExpired(now) {
      const client = await options.connector.client();
      const keys = await listRedisKeys(client, `${REDIS_CACHE_PREFIX}*`);
      let removed = 0;
      for (const key of keys) {
        const raw = await client.get(key);
        const entry = raw ? parseJson<ScenePacketCacheStoreEntry<TScene>>(raw) : undefined;
        if (!entry || isExpired(entry, now)) {
          await client.del(key);
          removed += 1;
        }
      }
      return removed;
    },
    async size() {
      const client = await options.connector.client();
      return (await listRedisKeys(client, `${REDIS_CACHE_PREFIX}*`)).length;
    },
    async status(now) {
      const redisReachable = await options.connector.ping();
      const entryCount = redisReachable ? await this.size(now) : 0;
      return {
        backend: "redis",
        maxEntries,
        entryCount,
        hitCount,
        missCount,
        hitRate: hitRate(hitCount, missCount),
        redisConfigured: true,
        redisReachable,
      };
    },
  };
}

export function createRedisScenePacketCompileLock(connector: LazyRedisConnector): ScenePacketCompileLock {
  return {
    async acquire(key, ttlSeconds) {
      const client = await connector.client();
      const token = randomUUID();
      const redisKey = REDIS_LOCK_PREFIX + key;
      // Redis SET NX EX keeps duplicate compiles from racing across Railway instances.
      const result = await client.set(redisKey, token, { NX: true, EX: ttlSeconds });
      const acquired = result === "OK";
      return {
        acquired,
        token,
        release: async () => {
          if (!acquired) return;
          await client.eval(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            {
              keys: [redisKey],
              arguments: [token],
            },
          );
        },
      };
    },
  };
}

export function createRedisScenePacketJobQueue<TJob extends { id: string; enqueuedAtMs: number }>(
  connector: LazyRedisConnector,
  options: {
    ownerId?: string;
    claimTtlMs?: number;
  } = {},
): ScenePacketJobQueue<TJob> {
  const ownerId = options.ownerId ?? `scene-packet-worker:${process.pid}:${randomUUID()}`;
  const claimTtlMs = Math.max(1, Math.floor(options.claimTtlMs ?? DEFAULT_JOB_CLAIM_TTL_MS));

  return {
    async enqueue(job) {
      const client = await connector.client();
      if (await client.get(`${REDIS_JOB_DONE_PREFIX}${job.id}`)) return;
      if (await redisJobExistsInZset(client, REDIS_JOB_CLAIMED_KEY, job.id, "claim")) return;
      await removeRedisJobsById(client, REDIS_JOB_QUEUE_KEY, job.id, "job");
      await client.zAdd(REDIS_JOB_QUEUE_KEY, {
        score: job.enqueuedAtMs,
        value: JSON.stringify(job),
      });
    },
    async claim(now) {
      const client = await connector.client();
      const raw = await client.eval(REDIS_JOB_CLAIM_SCRIPT, {
        keys: [REDIS_JOB_QUEUE_KEY, REDIS_JOB_CLAIMED_KEY],
        arguments: [String(now), String(claimTtlMs), ownerId],
      });
      if (typeof raw !== "string") return undefined;
      const claimed = parseJson<RedisClaimedJobEnvelope<TJob>>(raw);
      if (!claimed?.job || !claimed.claim) return undefined;
      return {
        ...claimed.job,
        claim: claimed.claim,
      };
    },
    async complete(jobId) {
      const client = await connector.client();
      const trackedJob =
        (await redisJobById<TJob>(client, REDIS_JOB_CLAIMED_KEY, jobId, "claim")) ??
        (await redisJobById<TJob>(client, REDIS_JOB_QUEUE_KEY, jobId, "job"));
      if (trackedJob) {
        const durableCacheKey = redisDurableCacheKeyForJob(trackedJob);
        if (durableCacheKey && !(await client.get(REDIS_CACHE_PREFIX + durableCacheKey))) {
          return;
        }
      }
      await removeRedisJobsById(client, REDIS_JOB_QUEUE_KEY, jobId, "job");
      await removeRedisJobsById(client, REDIS_JOB_CLAIMED_KEY, jobId, "claim");
      await client.set(`${REDIS_JOB_DONE_PREFIX}${jobId}`, "1", { EX: 3_600 });
    },
    async fail(jobId, error) {
      const client = await connector.client();
      await removeRedisJobsById(client, REDIS_JOB_QUEUE_KEY, jobId, "job");
      await removeRedisJobsById(client, REDIS_JOB_CLAIMED_KEY, jobId, "claim");
      await client.set(`${REDIS_JOB_FAILED_PREFIX}${jobId}`, JSON.stringify({ error, failedAt: new Date().toISOString() }), {
        EX: 86_400,
      });
    },
    async status(now) {
      // Readiness must never fail because queue introspection hit a Redis
      // reply error — degrade to safe zeros and log (fail-open, W6 contract).
      try {
        const client = await connector.client();
        await requeueExpiredRedisClaims(client, now);
        const queueDepth = await client.zCard(REDIS_JOB_QUEUE_KEY);
        const claimedCount = await client.zCard(REDIS_JOB_CLAIMED_KEY);
        const values = await client.zRange(REDIS_JOB_QUEUE_KEY, 0, 0);
        const oldest = values[0] ? parseJson<TJob>(values[0]) : undefined;
        const claimedValues = await client.zRange(REDIS_JOB_CLAIMED_KEY, 0, 0);
        const oldestClaimed = claimedValues[0] ? parseJson<RedisClaimedJobEnvelope<TJob>>(claimedValues[0]) : undefined;
        return {
          queueDepth,
          claimedCount,
          oldestQueuedMs: oldest ? Math.max(0, now - oldest.enqueuedAtMs) : null,
          oldestClaimedMs: oldestClaimed?.claim ? Math.max(0, now - oldestClaimed.claim.claimedAtMs) : null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", event: "scene_packet_queue_status_fail_open", message }));
        return { queueDepth: 0, claimedCount: 0, oldestQueuedMs: null, oldestClaimedMs: null };
      }
    },
  };
}

const REDIS_JOB_CLAIM_SCRIPT = `
local pending_key = KEYS[1]
local claimed_key = KEYS[2]
local now = tonumber(ARGV[1])
local claim_ttl_ms = tonumber(ARGV[2])
local owner_id = ARGV[3]

local expired = redis.call('zrangebyscore', claimed_key, '-inf', now)
for _, raw_envelope in ipairs(expired) do
  local decoded_ok, envelope = pcall(cjson.decode, raw_envelope)
  if decoded_ok and envelope and envelope.job and envelope.job.id and not redis.call('get', 'atlas:scene-packet-jobs:v2:done:' .. envelope.job.id) then
    redis.call('zadd', pending_key, envelope.job.enqueuedAtMs or now, cjson.encode(envelope.job))
  end
  redis.call('zrem', claimed_key, raw_envelope)
end

local values = redis.call('zrange', pending_key, 0, 0)
local raw_job = values[1]
if not raw_job then
  return nil
end

if redis.call('zrem', pending_key, raw_job) == 0 then
  return nil
end

local job_ok, job = pcall(cjson.decode, raw_job)
if not job_ok or not job or not job.id then
  return nil
end

local claim = {
  ownerId = owner_id,
  claimedAtMs = now,
  claimExpiresAtMs = now + claim_ttl_ms
}
local result = {
  job = job,
  claim = claim
}
redis.call('zadd', claimed_key, claim.claimExpiresAtMs, cjson.encode(result))
return cjson.encode(result)
`;

const REDIS_JOB_REQUEUE_EXPIRED_SCRIPT = `
local pending_key = KEYS[1]
local claimed_key = KEYS[2]
local now = tonumber(ARGV[1])
local expired = redis.call('zrangebyscore', claimed_key, '-inf', now)
for _, raw_envelope in ipairs(expired) do
  local decoded_ok, envelope = pcall(cjson.decode, raw_envelope)
  if decoded_ok and envelope and envelope.job and envelope.job.id and not redis.call('get', 'atlas:scene-packet-jobs:v2:done:' .. envelope.job.id) then
    redis.call('zadd', pending_key, envelope.job.enqueuedAtMs or now, cjson.encode(envelope.job))
  end
  redis.call('zrem', claimed_key, raw_envelope)
end
return #expired
`;

type RedisClaimedJobEnvelope<TJob extends { id: string; enqueuedAtMs: number }> = {
  job: TJob;
  claim: ScenePacketClaimedJob<TJob>["claim"];
};

async function requeueExpiredRedisClaims(client: LazyRedisClient, now: number): Promise<void> {
  await client.eval(REDIS_JOB_REQUEUE_EXPIRED_SCRIPT, {
    keys: [REDIS_JOB_QUEUE_KEY, REDIS_JOB_CLAIMED_KEY],
    arguments: [String(now)],
  });
}

async function redisJobExistsInZset(
  client: LazyRedisClient,
  key: string,
  jobId: string,
  valueKind: "job" | "claim",
): Promise<boolean> {
  const values = await client.zRange(key, 0, -1);
  return values.some((value) => redisJobIdFromValue(value, valueKind) === jobId);
}

async function redisJobById<TJob extends { id: string; enqueuedAtMs: number }>(
  client: LazyRedisClient,
  key: string,
  jobId: string,
  valueKind: "job" | "claim",
): Promise<TJob | undefined> {
  const values = await client.zRange(key, 0, -1);
  for (const value of values) {
    if (valueKind === "job") {
      const job = parseJson<TJob>(value);
      if (job?.id === jobId) return job;
      continue;
    }
    const envelope = parseJson<RedisClaimedJobEnvelope<TJob>>(value);
    if (envelope?.job?.id === jobId) return envelope.job;
  }
  return undefined;
}

async function removeRedisJobsById(
  client: LazyRedisClient,
  key: string,
  jobId: string,
  valueKind: "job" | "claim",
): Promise<number> {
  const values = await client.zRange(key, 0, -1);
  let removed = 0;
  for (const value of values) {
    if (redisJobIdFromValue(value, valueKind) !== jobId) continue;
    removed += await client.zRem(key, value);
  }
  return removed;
}

function redisJobIdFromValue(value: string, valueKind: "job" | "claim"): string | undefined {
  if (valueKind === "job") {
    return parseJson<{ id: string }>(value)?.id;
  }
  return parseJson<RedisClaimedJobEnvelope<{ id: string; enqueuedAtMs: number }>>(value)?.job?.id;
}

function redisDurableCacheKeyForJob(job: { id: string; enqueuedAtMs: number }): string | undefined {
  const value = job as Partial<ScenePacketGeneratedDraftJob>;
  if (value.kind !== "generated_draft_scene") return undefined;
  if (
    !value.stateCode ||
    !value.countySlug ||
    !value.districtSlug ||
    !value.cameraPresetId ||
    !value.windowHash ||
    !value.sceneSchemaVersion ||
    !value.engineUpdateId
  ) {
    return undefined;
  }
  return createScenePacketCachePlan({
    countryCode: value.countryCode ?? "US",
    stateCode: value.stateCode,
    countySlug: value.countySlug,
    districtSlug: value.districtSlug,
    cameraPresetId: value.cameraPresetId,
    windowHash: value.windowHash,
    sceneSchemaVersion: value.sceneSchemaVersion,
    engineUpdateId: value.engineUpdateId,
    readiness: "generated_draft",
    generationMode: "deterministic_generated_draft",
  }).key.key;
}

export type LazyRedisClient = {
  isOpen?: boolean;
  isReady?: boolean;
  connect(): Promise<unknown>;
  destroy?(): void;
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: Record<string, unknown>): Promise<string | null>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  scanIterator?(options: { MATCH: string; COUNT: number }): AsyncIterable<string>;
  eval(script: string, options: { keys: string[]; arguments: string[] }): Promise<unknown>;
  zAdd(key: string, value: { score: number; value: string }): Promise<number>;
  zRange(key: string, start: number, stop: number): Promise<string[]>;
  zRem(key: string, value: string): Promise<number>;
  zCard(key: string): Promise<number>;
};

export type LazyRedisConnector = {
  client(): Promise<LazyRedisClient>;
  ping(): Promise<boolean>;
};

export function createLazyRedisConnector(url: string): LazyRedisConnector {
  let client: LazyRedisClient | undefined;
  let connectPromise: Promise<void> | undefined;

  async function getClient(): Promise<LazyRedisClient> {
    if (!client) {
      const redis = await import("redis");
      const created = redis.createClient({
        url,
        // RESP3 in node-redis 6.1 masks pre-handshake Redis errors (including
        // maxclients) with an internal commands-queue TypeError. RESP2 keeps
        // the real server error attached to connect(), where this connector
        // can fail closed and retry with a fresh client.
        RESP: 2,
        socket: {
          // No connectTimeout: node-redis v6 implements it with an abort
          // timer that THROWS UNCAUGHT when a slow (cold-container) connect
          // exceeds it — killed the second production deploy. Bounded
          // retries below still make connect() reject promptly on an
          // unreachable Redis (fail-open depends on that).
          reconnectStrategy: (retries: number, cause: Error) =>
            retries >= 2 ? cause : Math.min(200 * (retries + 1), 600),
        },
      });
      // node-redis turns any socket/protocol error into a process-killing
      // unhandled 'error' event unless a listener exists (crashed the first
      // W6 production deploy). In-flight commands still reject; callers
      // fail open.
      created.on("error", (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", event: "redis_client_error", message }));
      });
      client = created as unknown as LazyRedisClient;
    }
    if (client.isOpen && client.isReady === false) {
      throw new Error("Redis client is reconnecting and not ready for commands.");
    }
    if (!client.isOpen) {
      // Reset on failure so a later call can retry a fresh connect instead
      // of awaiting a permanently rejected cached promise.
      const connectingClient = client;
      connectPromise ??= connectingClient.connect().then(
        () => undefined,
        (error) => {
          connectPromise = undefined;
          if (client === connectingClient) client = undefined;
          try {
            connectingClient.destroy?.();
          } catch {
            // The socket may already be closed. The important invariant is
            // that a failed client is never reused by a later readiness hit.
          }
          throw error;
        },
      );
      await connectPromise;
    }
    return client;
  }

  return {
    client: getClient,
    async ping() {
      try {
        const redisClient = await getClient();
        return (await redisClient.ping()) === "PONG";
      } catch {
        return false;
      }
    },
  };
}

function summarizeEntry<TScene>(entry: ScenePacketCacheStoreEntry<TScene>, cacheHit: boolean): ScenePacketMemorySummary {
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
    generationStatus?: ScenePacketCachePlan["generation"]["status"];
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
    generationStatus: input.generationStatus ?? plan.generation.status,
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

async function writeRedisEntry<TScene>(
  client: LazyRedisClient,
  key: string,
  entry: ScenePacketCacheStoreEntry<TScene>,
  now: number,
): Promise<void> {
  const serialized = JSON.stringify(entry);
  if (entry.expiresAtMs !== null) {
    const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAtMs - now) / 1000));
    await client.set(key, serialized, { EX: ttlSeconds });
    return;
  }
  await client.set(key, serialized);
}

async function listRedisKeys(client: LazyRedisClient, pattern: string): Promise<string[]> {
  if (client.scanIterator) {
    const keys: string[] = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(String(key));
    }
    return keys;
  }
  return client.keys(pattern);
}

function readinessForCoverageTier(coverageTier: string): ScenePacketReadiness {
  if (coverageTier === "L1_COUNTY_SHELL") return "shell_only";
  if (coverageTier === "L0_UNSUPPORTED") return "unsupported";
  return "blocked";
}

function isExpired<TScene>(entry: ScenePacketCacheStoreEntry<TScene>, now: number): boolean {
  return entry.expiresAtMs !== null && entry.expiresAtMs <= now;
}

function hitRate(hitCount: number, missCount: number): number {
  const total = hitCount + missCount;
  if (total === 0) return 0;
  return Number((hitCount / total).toFixed(4));
}

function normalizeBackend(value: string | undefined): ScenePacketCacheBackend | undefined {
  if (!value) return undefined;
  return value.trim().toLowerCase() === "redis" ? "redis" : "memory";
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePositiveIntegerEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseJson<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}
