import { resolve } from "node:path";
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
  type ScenePacketGeneratedDraftJob,
} from "./scenePacketMemoryAdapter.js";

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

export async function runScenePacketWorkerOnce(): Promise<WorkerResult> {
  if (scenePacketRuntimeConfig.blockers.length > 0) {
    throw new Error(`Atlas scene packet worker config is invalid: ${scenePacketRuntimeConfig.blockers.join("; ")}`);
  }
  if (scenePacketRuntimeConfig.effectiveBackend !== "redis") {
    throw new Error("Atlas scene packet worker requires ATLAS_SCENE_PACKET_CACHE_BACKEND=redis and ATLAS_REDIS_URL.");
  }

  const adapter = createScenePacketMemoryAdapter<CityWorldScene>({
    cacheBackend: "redis",
    redisUrl: scenePacketRuntimeConfig.redisUrl,
    lockTtlSeconds: scenePacketRuntimeConfig.lockTtlSeconds,
    lockWaitMs: scenePacketRuntimeConfig.lockWaitMs,
  });
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
  adapter = createScenePacketMemoryAdapter<CityWorldScene>({
    cacheBackend: "redis",
    redisUrl: scenePacketRuntimeConfig.redisUrl,
    lockTtlSeconds: scenePacketRuntimeConfig.lockTtlSeconds,
    lockWaitMs: scenePacketRuntimeConfig.lockWaitMs,
  }),
): Promise<Extract<WorkerResult, { status: "compiled" | "deferred" }>> {
  const county = {
    geoid: job.geoid ?? job.countySlug,
    stateCode: job.stateCode,
    name: job.countyName ?? job.countySlug,
    countySlug: job.countySlug,
    ...(job.centroid ? { centroid: job.centroid } : {}),
  };
  const generated = createDeterministicGeneratedDistrictSpec({ county });
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
    createScene: () => createDeterministicGeneratedDistrictScene({ county }).result.scene,
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

  startWorkerHealthServer();
  logWorkerEvent("scene_packet_worker_started", {
    cacheBackend: scenePacketRuntimeConfig.effectiveBackend,
    lockTtlSeconds: scenePacketRuntimeConfig.lockTtlSeconds,
  });

  while (true) {
    const result = await runScenePacketWorkerOnce();
    if (result.status === "idle") {
      await new Promise((resolveIdle) => setTimeout(resolveIdle, 1_000));
    }
  }
}

function startWorkerHealthServer(): void {
  const port = Number(process.env.PORT ?? 0);
  if (!Number.isFinite(port) || port <= 0) return;

  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, worker: "scene-packet" }));
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
    process.exitCode = 1;
  });
}
