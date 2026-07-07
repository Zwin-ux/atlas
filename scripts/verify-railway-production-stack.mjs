#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_BASE_URL = "https://atlas-backend-production-e6fc.up.railway.app";
const ARTIFACT_PATH = "artifacts/ops/production-railway-stack.json";
const BACKEND_SERVICE_ID = process.env.ATLAS_RAILWAY_BACKEND_SERVICE_ID || "d5aee313-8558-47e6-9b41-a517b871a6b8";
const baseUrl = (process.env.ATLAS_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
const blockers = [];
const warnings = [];

const backendVars = railwayJson([
  "variable",
  "list",
  "--service",
  BACKEND_SERVICE_ID,
  "--environment",
  "production",
  "--json",
]);
const envConfig = railwayJson(["environment", "config", "--environment", "production", "--json"]);
const services = Object.entries(envConfig.services || {}).map(([id, service]) => ({
  id,
  sourceKeys: service.source ? Object.keys(service.source) : [],
  variableNames: Object.keys(service.variables || {}).sort(),
  startCommand: service.deploy?.startCommand ?? null,
  healthcheckPath: service.deploy?.healthcheckPath ?? null,
}));

for (const name of [
  "ATLAS_SCENE_PACKET_CACHE_BACKEND",
  "ATLAS_REDIS_URL",
  "ATLAS_SCENE_PACKET_WORKER_ENABLED",
  "DATABASE_URL",
  "ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED",
  "ATLAS_HOSTED_CLAWD_MONEY_ENABLED",
  "ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED",
  "APP_BASE_URL",
  "NODE_ENV",
]) {
  requireVar(backendVars, name);
}

if (backendVars.ATLAS_SCENE_PACKET_CACHE_BACKEND !== "redis") {
  blockers.push("atlas-backend must use ATLAS_SCENE_PACKET_CACHE_BACKEND=redis in production.");
}
if (!String(backendVars.ATLAS_REDIS_URL || "").startsWith("redis://")) {
  blockers.push("atlas-backend ATLAS_REDIS_URL must resolve to a Redis URL.");
}
if (backendVars.ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED !== "false") {
  blockers.push("Public paid claim must stay false until persistence, Auth, Stripe, and smoke gates pass.");
}

const worker = services.find((service) => service.variableNames.includes("ATLAS_SCENE_PACKET_WORKER_ENABLED"));
if (!worker) {
  blockers.push("Production is missing the atlas-scene-packet-worker service shell.");
}

const redisService = services.find((service) => service.variableNames.includes("REDIS_URL"));
if (!redisService) {
  blockers.push("Production is missing a Redis service with REDIS_URL.");
}

const postgresServices = services.filter((service) => service.variableNames.includes("DATABASE_URL"));
if (postgresServices.length === 0) {
  blockers.push("Production is missing a Postgres service with DATABASE_URL.");
}
if (postgresServices.length > 1) {
  warnings.push("Production has multiple Postgres DATABASE_URL services; confirm atlas-backend points at the intended prod DB.");
}

const ready = await fetchJson(`${baseUrl}/ready`);
const scenePacketStatus = await fetchJson(`${baseUrl}/api/engine/scene-packets/status`);

if (!ready.ok) blockers.push("/ready did not return ok:true.");
if (ready.scenePacketCache?.cacheBackend !== "redis") {
  blockers.push("/ready must report scenePacketCache.cacheBackend=redis.");
}
if (ready.scenePacketCache?.redisReachable !== true) {
  blockers.push("/ready must report scenePacketCache.redisReachable=true.");
}
if (ready.configBlockerCount !== 0) {
  blockers.push(`/ready reports ${ready.configBlockerCount} config blockers.`);
}
if (scenePacketStatus.cache?.redisReachable !== true) {
  blockers.push("scene packet status must report redisReachable=true.");
}
const statusJson = JSON.stringify(scenePacketStatus);
for (const forbidden of ["terrainTiles", "roadSegments", "buildings", "places", "generatedDraftScene"]) {
  if (statusJson.includes(forbidden)) {
    blockers.push(`scene packet status leaks ${forbidden}.`);
  }
}

const stripeConfigured = Boolean(
  backendVars.STRIPE_SECRET_KEY &&
  backendVars.STRIPE_WEBHOOK_SECRET &&
  backendVars.STRIPE_HOSTED_CLAWD_PRICE_ID,
);
const authConfigured = Boolean(
  backendVars.ATLAS_OIDC_ISSUER &&
  backendVars.ATLAS_OIDC_AUDIENCE &&
  backendVars.ATLAS_OIDC_JWKS_URL,
);

const result = {
  ok: blockers.length === 0,
  baseUrl,
  checkedAt: new Date().toISOString(),
  railway: {
    serviceCount: services.length,
    hasRedisService: Boolean(redisService),
    postgresServiceCount: postgresServices.length,
    hasScenePacketWorker: Boolean(worker),
    backendVarNames: Object.keys(backendVars).sort(),
  },
  liveReady: {
    ok: ready.ok,
    cacheBackend: ready.scenePacketCache?.cacheBackend,
    redisConfigured: ready.scenePacketCache?.redisConfigured,
    redisReachable: ready.scenePacketCache?.redisReachable,
    databaseConfigured: ready.hostedClawd?.databaseConfigured,
    databaseReachable: ready.hostedClawd?.databaseReachable,
    persistenceEnabled: ready.hostedClawd?.persistenceEnabled,
    authConfigured: ready.hostedClawd?.authConfigured,
    moneyEnabled: ready.hostedClawd?.moneyEnabled,
    stripeConfigured: ready.hostedClawd?.stripeConfigured,
    configBlockerCount: ready.configBlockerCount,
  },
  liveScenePacketStatus: {
    cacheBackend: scenePacketStatus.cache?.cacheBackend,
    redisConfigured: scenePacketStatus.cache?.redisConfigured,
    redisReachable: scenePacketStatus.cache?.redisReachable,
    queueDepth: scenePacketStatus.cache?.queueDepth,
    statusSafe: !statusJson.match(/terrainTiles|roadSegments|buildings|places|generatedDraftScene/),
  },
  launchReadiness: {
    authConfigured,
    stripeConfigured,
    publicPaidClaimEnabled: backendVars.ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED === "true",
  },
  blockerCount: blockers.length,
  blockers,
  warnings,
};

await mkdir(dirname(resolve(ARTIFACT_PATH)), { recursive: true });
await writeFile(resolve(ARTIFACT_PATH), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function railwayJson(args) {
  try {
    const output = process.platform === "win32"
      ? execFileSync("powershell", ["-NoProfile", "-Command", `railway ${args.join(" ")}`], { encoding: "utf8" })
      : execFileSync("railway", args, { encoding: "utf8" });
    return JSON.parse(output);
  } catch (error) {
    blockers.push(`Railway command failed: railway ${args.join(" ")}`);
    return {};
  }
}

function requireVar(vars, name) {
  if (!Object.hasOwn(vars, name) || String(vars[name] || "") === "") {
    blockers.push(`atlas-backend production variable is missing: ${name}`);
  }
}

async function fetchJson(url) {
  try {
    const response = await fetch(url);
    const body = await response.text();
    let payload = {};
    if (body.trim()) {
      try {
        payload = JSON.parse(body);
      } catch {
        payload = { body };
      }
    }
    if (!response.ok) {
      blockers.push(`${url} returned HTTP ${response.status}.`);
      return payload;
    }
    return payload;
  } catch (error) {
    blockers.push(`${url} request failed: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}
