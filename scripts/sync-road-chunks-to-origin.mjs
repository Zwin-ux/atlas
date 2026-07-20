#!/usr/bin/env node
/**
 * Sync local data/road-chunks → S3-compatible origin (Railway bucket / R2 / S3).
 *
 * Layout on origin MUST match the filesystem store:
 *   <origin>/<slug>/catalog.json
 *   <origin>/<slug>/roadchunk/1/<packHash>/manifest.json[.br|.gz]
 *   <origin>/<slug>/roadchunk/1/<packHash>/near/<chunkId>.json[.br|.gz]
 *
 * Env:
 *   ATLAS_ROAD_SYNC_URI   e.g. s3://my-bucket/road-chunks
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION (or S3-compatible endpoint)
 *   AWS_ENDPOINT_URL      optional (Railway / R2)
 *
 * Usage:
 *   ATLAS_ROAD_SYNC_URI=s3://atlas-road-chunks/ node scripts/sync-road-chunks-to-origin.mjs
 *   ATLAS_ROAD_SYNC_URI=s3://… node scripts/sync-road-chunks-to-origin.mjs --dry-run
 *
 * Requires AWS CLI v2 (`aws`) on PATH.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const dryRun = process.argv.includes("--dry-run");
const uri = (process.env.ATLAS_ROAD_SYNC_URI ?? "").trim().replace(/\/+$/, "");
const src = resolve(process.cwd(), "data", "road-chunks");

if (!uri) {
  console.error("Set ATLAS_ROAD_SYNC_URI=s3://bucket[/prefix]");
  process.exit(2);
}
if (!uri.startsWith("s3://")) {
  console.error("ATLAS_ROAD_SYNC_URI must start with s3://");
  process.exit(2);
}

const args = ["s3", "sync", src, uri, "--only-show-errors"];
if (dryRun) args.push("--dryrun");

// Exclude bake failure logs from public origin if desired — still upload coverage.
// (Nothing excluded by default so catalog + chunks + _coverage.json all land.)

console.log(`sync ${src} → ${uri}${dryRun ? " (dry-run)" : ""}`);
const result = spawnSync("aws", args, { stdio: "inherit", env: process.env });
if (result.error) {
  console.error(result.error.message);
  console.error("Install AWS CLI v2 and configure credentials for the bucket.");
  process.exit(1);
}
process.exit(result.status ?? 1);
