#!/usr/bin/env node
/**
 * Rebuild data/road-chunks/_coverage.json from baked county trees.
 * Cheap national index: which slugs have NEAR roads published locally.
 *
 * Usage: node scripts/build-road-coverage.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "data", "road-chunks");
const OUT = join(ROOT, "_coverage.json");

const counties = [];
for (const name of readdirSync(ROOT).sort()) {
  if (name.startsWith("_")) continue;
  const dir = join(ROOT, name);
  if (!statSync(dir).isDirectory()) continue;
  const catalogPath = join(dir, "catalog.json");
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    let baked = {};
    try {
      baked = JSON.parse(readFileSync(join(dir, "_baked.json"), "utf8"));
    } catch {
      /* optional */
    }
    counties.push({
      slug: name,
      packHash: catalog.packHash ?? null,
      schemaVersion: catalog.schemaVersion ?? null,
      chunkCount: baked.chunkCount ?? null,
      band: baked.band ?? "near",
      bakedAt: baked.bakedAt ?? catalog.updatedAt ?? null,
    });
  } catch {
    // skip incomplete dirs
  }
}

const coverage = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: counties.length,
  counties,
  note: "NEAR-band TIGER packs present under data/road-chunks. Absent slug → catalog 404 / honesty unavailable.",
};

writeFileSync(OUT, `${JSON.stringify(coverage, null, 2)}\n`);
console.log(`wrote ${OUT} (${coverage.count} counties)`);
