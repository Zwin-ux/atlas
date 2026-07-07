#!/usr/bin/env node
import { spawn } from "node:child_process";

const workerEnabled = ["1", "true", "yes", "on"].includes(
  String(process.env.ATLAS_SCENE_PACKET_WORKER_ENABLED ?? "").trim().toLowerCase(),
);
const serviceName = String(process.env.RAILWAY_SERVICE_NAME ?? "");
const shouldRunWorker = workerEnabled || serviceName.includes("scene-packet-worker");
const entrypoint = shouldRunWorker ? "server/dist/scenePacketWorker.js" : "server/dist/index.js";

const child = spawn(process.execPath, [entrypoint], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      event: "railway_start_dispatch_failed",
      entrypoint,
      error: error.message,
    }),
  );
  process.exit(1);
});
