import assert from "node:assert/strict";
import test from "node:test";
import type { CityWorldScene } from "@atlas/core";
import type { ScenePacketMemoryAdapter } from "../src/scenePacketMemoryAdapter.js";

process.env.NODE_ENV = "development";
process.env.ATLAS_SCENE_PACKET_CACHE_BACKEND = "redis";
process.env.ATLAS_REDIS_URL = "redis://127.0.0.1:1";
process.env.ATLAS_SCENE_PACKET_WORKER_ENABLED = "true";

const { runScenePacketWorkerLoop } = await import("../src/scenePacketWorker.js");

function idleAdapter(claim: () => Promise<undefined>): ScenePacketMemoryAdapter<CityWorldScene> {
  return {
    claimGeneratedDraftJob: claim,
  } as unknown as ScenePacketMemoryAdapter<CityWorldScene>;
}

test("worker loop reuses one injected adapter across idle polls", async () => {
  let claims = 0;
  const adapter = idleAdapter(async () => {
    claims += 1;
    return undefined;
  });
  const health = { redisReady: false, lastSuccessfulPollAt: null, lastError: null };

  await runScenePacketWorkerLoop(adapter, { idleWaitMs: 0, maxIterations: 3, health });

  assert.equal(claims, 3);
  assert.equal(health.redisReady, true);
  assert.ok(health.lastSuccessfulPollAt);
  assert.equal(health.lastError, null);
});

test("worker loop survives a transient Redis poll failure and becomes ready again", async () => {
  let claims = 0;
  const adapter = idleAdapter(async () => {
    claims += 1;
    if (claims === 1) throw new Error("temporary Redis outage");
    return undefined;
  });
  const health = { redisReady: false, lastSuccessfulPollAt: null, lastError: null };

  await runScenePacketWorkerLoop(adapter, { idleWaitMs: 0, maxIterations: 2, health });

  assert.equal(claims, 2);
  assert.equal(health.redisReady, true);
  assert.ok(health.lastSuccessfulPollAt);
  assert.equal(health.lastError, null);
});
