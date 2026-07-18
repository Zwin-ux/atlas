import { dirname, resolve } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import {
  createDeterministicGeneratedDistrictScene,
  createDeterministicGeneratedDistrictSpec,
  type CityWorldScene,
} from "@atlas/core";
import {
  createScenePacketMemoryAdapter,
  readScenePacketRuntimeConfig,
  type ScenePacketMemoryAdapter,
  type ScenePacketGeneratedDraftJob,
} from "./scenePacketMemoryAdapter.js";
import { loadCountyTownAnchorIndex, townAnchorsForCounty } from "./countyTownAnchorIndex.js";

type WorkerResult =
  | {
      status: "idle";
    }
  | {
      status: "compiled";
      jobId: string;
      countySlug: string;
      districtSlug: string;
      sceneId: string;
      cacheHit: boolean;
    }
  | {
      status: "deferred";
      jobId: string;
      countySlug: string;
      districtSlug: string;
      reason: string;
    };

const scenePacketRuntimeConfig = readScenePacketRuntimeConfig(process.env);
const workerRootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const countyTownAnchorIndex = loadCountyTownAnchorIndex(
  resolve(workerRootDir, "data", "census", "us-county-town-anchors.json"),
);
const workerAdapter = createScenePacketMemoryAdapter<CityWorldScene>({
  cacheBackend: "redis",
  redisUrl: scenePacketRuntimeConfig.redisUrl,
  lockTtlSeconds: scenePacketRuntimeConfig.lockTtlSeconds,
  lockWaitMs: scenePacketRuntimeConfig.lockWaitMs,
});

export type ScenePacketWorkerHealth = {
  redisReady: boolean;
  lastSuccessfulPollAt: string | null;
  lastError: string | null;
};

type WorkerLoopOptions = {
  idleWaitMs?: number;
  maxIterations?: number;
  health?: ScenePacketWorkerHealth;
};

export async function runScenePacketWorkerOnce(
  adapter: ScenePacketMemoryAdapter<CityWorldScene> = workerAdapter,
): Promise<WorkerResult> {
  if (scenePacketRuntimeConfig.blockers.length > 0) {
    throw new Error(`Atlas scene packet worker config is invalid: ${scenePacketRuntimeConfig.blockers.join("; ")}`);
  }
  if (scenePacketRuntimeConfig.effectiveBackend !== "redis") {
    throw new Error("Atlas scene packet worker requires ATLAS_SCENE_PACKET_CACHE_BACKEND=redis and ATLAS_REDIS_URL.");
  }

  const job = await adapter.claimGeneratedDraftJob();
  if (!job) return { status: "idle" };

  try {
    const result = await compileGeneratedDraftJob(job, adapter);
    await adapter.completeGeneratedDraftJob(job.id);
    logWorkerEvent("scene_packet_worker_compiled", result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await adapter.failGeneratedDraftJob(job.id, message);
    logWorkerEvent("scene_packet_worker_failed", {
      jobId: job.id,
      countySlug: job.countySlug,
      districtSlug: job.districtSlug,
      reason: message,
    });
    throw error;
  }
}

export async function compileGeneratedDraftJob(
  job: ScenePacketGeneratedDraftJob,
  adapter = workerAdapter,
): Promise<Extract<WorkerResult, { status: "compiled" | "deferred" }>> {
  const county = {
    geoid: job.geoid ?? job.countySlug,
    stateCode: job.stateCode,
    name: job.countyName ?? job.countySlug,
    countySlug: job.countySlug,
    ...(job.centroid ? { centroid: job.centroid } : {}),
  };
  const townAnchors = townAnchorsForCounty(countyTownAnchorIndex, county.countySlug);
  const generated = createDeterministicGeneratedDistrictSpec({ county, townAnchors });
  const packet = await adapter.getOrCreateGeneratedDraftScenePacket({
    countryCode: job.countryCode,
    stateCode: job.stateCode,
    countySlug: job.countySlug,
    districtSlug: generated.districtSlug || job.districtSlug,
    cameraPresetId: job.cameraPresetId,
    windowHash: job.windowHash,
    sceneSchemaVersion: job.sceneSchemaVersion,
    engineUpdateId: job.engineUpdateId,
    sourceNotes: job.sourceNotes,
    createScene: () => createDeterministicGeneratedDistrictScene({ county, townAnchors }).result.scene,
    sceneIdForPayload: (scene) => scene.id,
    enqueueOnLockContention: false,
  });

  if (!packet.payload) {
    return {
      status: "deferred",
      jobId: job.id,
      countySlug: job.countySlug,
      districtSlug: generated.districtSlug || job.districtSlug,
      reason: packet.summary.generationStatus,
    };
  }

  return {
    status: "compiled",
    jobId: job.id,
    countySlug: job.countySlug,
    districtSlug: generated.districtSlug || job.districtSlug,
    sceneId: packet.payload.id,
    cacheHit: packet.summary.cacheHit,
  };
}

async function runWorkerLoop(): Promise<void> {
  if (!scenePacketRuntimeConfig.workerEnabled) {
    logWorkerEvent("scene_packet_worker_disabled", { workerEnabled: false });
    return;
  }

  const health: ScenePacketWorkerHealth = {
    redisReady: false,
    lastSuccessfulPollAt: null,
    lastError: null,
  };
  startWorkerHealthServer(health);
  logWorkerEvent("scene_packet_worker_started", {
    cacheBackend: scenePacketRuntimeConfig.effectiveBackend,
    lockTtlSeconds: scenePacketRuntimeConfig.lockTtlSeconds,
  });

  await runScenePacketWorkerLoop(workerAdapter, { health });
}

export async function runScenePacketWorkerLoop(
  adapter: ScenePacketMemoryAdapter<CityWorldScene>,
  options: WorkerLoopOptions = {},
): Promise<void> {
  const idleWaitMs = Math.max(0, options.idleWaitMs ?? 1_000);
  const maxIterations = options.maxIterations ?? Number.POSITIVE_INFINITY;
  const health = options.health;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let shouldWait = false;
    try {
      const result = await runScenePacketWorkerOnce(adapter);
      if (health) {
        health.redisReady = true;
        health.lastSuccessfulPollAt = new Date().toISOString();
        health.lastError = null;
      }
      shouldWait = result.status === "idle";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (health) {
        health.redisReady = false;
        health.lastError = message;
      }
      logWorkerEvent("scene_packet_worker_poll_failed", { reason: message });
      shouldWait = true;
    }

    if (shouldWait && idleWaitMs > 0) {
      await new Promise((resolveIdle) => setTimeout(resolveIdle, idleWaitMs));
    }
  }
}

function startWorkerHealthServer(health: ScenePacketWorkerHealth): void {
  const port = Number(process.env.PORT ?? 0);
  if (!Number.isFinite(port) || port <= 0) return;

  const server = createServer((req, res) => {
    const path = req.url?.split("?")[0];
    if (path === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, worker: "scene-packet" }));
      return;
    }
    if (path === "/ready") {
      res.writeHead(health.redisReady ? 200 : 503, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: health.redisReady,
          worker: "scene-packet",
          redisReady: health.redisReady,
          lastSuccessfulPollAt: health.lastSuccessfulPollAt,
          ...(health.lastError ? { lastError: health.lastError.slice(0, 160) } : {}),
        }),
      );
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false }));
  });
  server.listen(port, () => {
    logWorkerEvent("scene_packet_worker_health_started", { port });
  });
}

function logWorkerEvent(event: string, fields: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      event,
      ...fields,
    }),
  );
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : "";
if (entrypoint && resolve(fileURLToPath(import.meta.url)) === entrypoint) {
  runWorkerLoop().catch((error) => {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        event: "scene_packet_worker_crashed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  });
}
