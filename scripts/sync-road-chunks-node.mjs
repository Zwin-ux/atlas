#!/usr/bin/env node
/**
 * Node S3 sync for data/road-chunks → Railway / S3-compatible bucket.
 * No AWS CLI required. Uses @aws-sdk/client-s3 (downloaded on first run via pnpm dlx pattern).
 *
 * Env (or auto from `railway bucket credentials -b atlas-road-chunks --json`):
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   AWS_ENDPOINT_URL (default https://t3.storageapi.dev)
 *   ATLAS_ROAD_SYNC_BUCKET (bucket name)
 *   ATLAS_ROAD_SYNC_PREFIX (optional key prefix, no leading slash)
 *
 * Usage:
 *   node scripts/sync-road-chunks-node.mjs
 *   node scripts/sync-road-chunks-node.mjs --dry-run
 *   node scripts/sync-road-chunks-node.mjs --only miami-dade-fl,cook-il
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg
  ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean))
  : null;

const SRC = resolve(process.cwd(), "data", "road-chunks");

function loadRailwayCreds() {
  const r = spawnSync("railway", ["bucket", "credentials", "-b", "atlas-road-chunks", "--json"], {
    encoding: "utf8",
  });
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

const railway = loadRailwayCreds();
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || railway?.accessKeyId;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || railway?.secretAccessKey;
const endpoint = (process.env.AWS_ENDPOINT_URL || railway?.endpoint || "https://t3.storageapi.dev").replace(/\/+$/, "");
const bucket = process.env.ATLAS_ROAD_SYNC_BUCKET || railway?.bucketName;
const region = process.env.AWS_DEFAULT_REGION || railway?.region || "auto";
const prefix = (process.env.ATLAS_ROAD_SYNC_PREFIX || "").replace(/^\/+|\/+$/g, "");

if (!accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing credentials/bucket. Set AWS_* or run with railway linked + bucket atlas-road-chunks.");
  process.exit(2);
}

// Resolve @aws-sdk/client-s3 from pnpm store or install into .tmp-aws-sdk
async function loadS3() {
  try {
    return await import("@aws-sdk/client-s3");
  } catch {
    const installDir = resolve(process.cwd(), ".tmp-aws-sdk");
    console.log("Installing @aws-sdk/client-s3 into .tmp-aws-sdk …");
    const r = spawnSync(
      "npm",
      ["install", "--prefix", installDir, "--no-save", "--no-package-lock", "@aws-sdk/client-s3@3"],
      { stdio: "inherit" },
    );
    if (r.status !== 0) {
      console.error("npm install of @aws-sdk/client-s3 failed");
      process.exit(1);
    }
    const modPath = join(installDir, "node_modules", "@aws-sdk", "client-s3", "dist-es", "index.js");
    // Prefer package exports via createRequire-style path
    return await import(pathToFileURL(join(installDir, "node_modules", "@aws-sdk", "client-s3", "dist-cjs", "index.js")).href).catch(
      async () => import(pathToFileURL(join(installDir, "node_modules", "@aws-sdk", "client-s3")).href),
    );
  }
}

function walkFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "_failures.json") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (only && dir === SRC && !only.has(name) && !name.startsWith("_")) continue;
      if (only && dir === SRC && name.startsWith("_")) {
        // always include _coverage.json / _priority at root
      }
      walkFiles(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function contentType(path) {
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".br")) return "application/json";
  if (path.endsWith(".gz")) return "application/json";
  return "application/octet-stream";
}

function cacheControl(path) {
  if (path.endsWith("catalog.json") || path.includes("_coverage")) return "public, max-age=60";
  return "public, max-age=31536000, immutable";
}

const { S3Client, PutObjectCommand, HeadObjectCommand } = await loadS3();

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials: { accessKeyId, secretAccessKey },
});

const files = walkFiles(SRC);
// If --only, still include coverage index
const coverage = join(SRC, "_coverage.json");
if (only && !files.includes(coverage)) {
  try {
    statSync(coverage);
    files.push(coverage);
  } catch {
    /* skip */
  }
}

console.log(`sync ${files.length} files → s3://${bucket}/${prefix || ""}  endpoint=${endpoint}${dryRun ? " (dry-run)" : ""}`);

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const file of files) {
  const rel = relative(SRC, file).split("\\").join("/");
  if (only) {
    const top = rel.split("/")[0];
    if (top !== "_coverage.json" && top !== "_priority-metros.json" && !only.has(top) && !top.startsWith("_")) {
      continue;
    }
  }
  const key = prefix ? `${prefix}/${rel}` : rel;
  const body = readFileSync(file);
  const etagLocal = `"${createHash("md5").update(body).digest("hex")}"`;

  if (!dryRun) {
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if (head.ETag && head.ETag.replace(/-.*$/, "") === etagLocal) {
        skipped += 1;
        continue;
      }
    } catch {
      // missing — upload
    }
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType(rel),
          CacheControl: cacheControl(rel),
          // ACL if supported — many Railway buckets ignore; public policy is separate
        }),
      );
      uploaded += 1;
      if (uploaded % 200 === 0) console.log(`  uploaded ${uploaded}…`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${key}: ${err instanceof Error ? err.message : err}`);
    }
  } else {
    uploaded += 1;
  }
}

const publicBase = process.env.ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN
  || `https://${bucket}.t3.storageapi.dev`;

console.log(JSON.stringify({ uploaded, skipped, failed, dryRun, bucket, endpoint, publicBaseProbe: `${publicBase}/miami-dade-fl/catalog.json` }, null, 2));
if (failed > 0) process.exit(1);
