#!/usr/bin/env node
// 0.78-D — national geo-pack integrity gate. Implements the program-doc
// gates for the LOD0 bake: full-index coverage, pack shape/budgets, size
// budget, and boundary-area sanity against the official TIGER land+water
// areas stored in each pack. On success writes data/geo-packs/_manifest.json
// (slug -> sha256/bytes) so future re-bakes can diff against the certified
// set without a network determinism run.
//
//   node scripts/verify-county-geo-packs.mjs [--json-only]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { US_COUNTY_INDEX } from "../packages/core/dist/index.js";

const PACK_DIR = "data/geo-packs";
// 0.78-D2 density budgets (3x the seed values; supersedes the WIRE <12KB
// seed target — the density decision trades pack bytes for silhouette
// fidelity while staying trivially cheap on the wire).
const SIZE_WARN_BYTES = 28_672;
const SIZE_FAIL_BYTES = 57_344;
const VERTEX_BUDGET = 1440;
const WATER_VERTEX_BUDGET = 840;
const WATER_MAX_RINGS = 18;
const LAND_MAX_RINGS = 10;
// Simplification keeps only the largest rings and rounds vertices, so the
// polygon area drifts from the official figure. This is an order-of-magnitude
// corruption guard, not a survey check.
const AREA_RATIO_FAIL = [0.25, 2.0];
const AREA_RATIO_WARN = [0.55, 1.5];
const WATER_SPOT_COUNTIES = ["miami-dade-fl", "honolulu-hi", "kalawao-hi", "district-of-columbia-dc", "aleutians-east-borough-ak"];

const jsonOnly = process.argv.includes("--json-only");
const checks = [];
const warnings = [];
function check(passed, message) {
  checks.push({ passed, message });
  if (!jsonOnly) console.log(`${passed ? "PASS" : "FAIL"} ${message}`);
}
function warn(message) {
  warnings.push(message);
  if (!jsonOnly) console.log(`WARN ${message}`);
}

function ringAreaSquareMeters(ring, latRef) {
  const mPerDegLat = 111_320;
  const mPerDegLon = 111_320 * Math.cos((latRef * Math.PI) / 180);
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * mPerDegLon * (y2 * mPerDegLat) - x2 * mPerDegLon * (y1 * mPerDegLat);
  }
  return Math.abs(area / 2);
}

const indexSlugs = new Set(US_COUNTY_INDEX.map((entry) => entry.countySlug));
const packFiles = existsSync(PACK_DIR)
  ? readdirSync(PACK_DIR).filter((name) => name.endsWith(".json") && !name.startsWith("_"))
  : [];
const packSlugs = new Set(packFiles.map((name) => name.replace(/\.json$/, "")));

// Coverage
const missing = [...indexSlugs].filter((slug) => !packSlugs.has(slug));
const orphans = [...packSlugs].filter((slug) => !indexSlugs.has(slug));
check(missing.length === 0, `coverage: ${packSlugs.size}/${indexSlugs.size} counties have packs${missing.length ? ` (missing ${missing.length}: ${missing.slice(0, 5).join(", ")}...)` : ""}`);
check(orphans.length === 0, `no orphan packs${orphans.length ? ` (found ${orphans.slice(0, 5).join(", ")})` : ""}`);

// Failures manifest must be clean
const failuresPath = `${PACK_DIR}/_failures.json`;
let bakeFailures = [];
if (existsSync(failuresPath)) {
  try { bakeFailures = JSON.parse(readFileSync(failuresPath, "utf8")); } catch { bakeFailures = [{ slug: "_failures.json", message: "unparseable" }]; }
}
check(bakeFailures.length === 0, `bake failure manifest is empty${bakeFailures.length ? ` (${bakeFailures.length} recorded)` : ""}`);

// Per-pack shape, budgets, size, area sanity
let shapeBad = 0;
let budgetBad = 0;
let sizeFailCount = 0;
let sizeWarnCount = 0;
let areaFailCount = 0;
let areaWarnCount = 0;
let totalBytes = 0;
let maxBytes = 0;
let maxBytesSlug = "";
const histogram = { "<=8KB": 0, "8-12KB": 0, "12-16KB": 0, "16-24KB": 0, ">24KB": 0 };
const manifest = {};
const spotWater = {};

for (const file of packFiles) {
  const slug = file.replace(/\.json$/, "");
  const raw = readFileSync(`${PACK_DIR}/${file}`);
  totalBytes += raw.length;
  if (raw.length > maxBytes) { maxBytes = raw.length; maxBytesSlug = slug; }
  if (raw.length <= 8_192) histogram["<=8KB"] += 1;
  else if (raw.length <= 12_288) histogram["8-12KB"] += 1;
  else if (raw.length <= 16_384) histogram["12-16KB"] += 1;
  else if (raw.length <= SIZE_FAIL_BYTES) histogram["16-24KB"] += 1;
  else histogram[">24KB"] += 1;
  if (raw.length > SIZE_FAIL_BYTES) { sizeFailCount += 1; continue; }
  if (raw.length > SIZE_WARN_BYTES) sizeWarnCount += 1;

  let pack;
  try { pack = JSON.parse(raw.toString("utf8")); } catch { shapeBad += 1; continue; }
  const rings = pack?.lod0?.boundaryRings;
  const okShape =
    pack?.packVersion === 2 &&
    typeof pack?.geoid === "string" &&
    pack?.countySlug === slug &&
    typeof pack?.areaLand === "number" &&
    typeof pack?.areaWater === "number" &&
    Array.isArray(rings) &&
    rings.length > 0 &&
    rings.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every((pt) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1])));
  if (!okShape) { shapeBad += 1; continue; }

  const vertexCount = rings.reduce((sum, ring) => sum + ring.length, 0);
  const waterRings = pack.lod0.waterRings ?? [];
  const waterVertexCount = waterRings.reduce((sum, ring) => sum + ring.length, 0);
  const okBudget =
    rings.length <= LAND_MAX_RINGS &&
    vertexCount <= VERTEX_BUDGET &&
    waterRings.length <= WATER_MAX_RINGS &&
    waterVertexCount <= WATER_VERTEX_BUDGET;
  if (!okBudget) { budgetBad += 1; continue; }

  const officialArea = pack.areaLand + pack.areaWater;
  if (officialArea > 0) {
    const latRef = rings[0][0][1];
    const ringArea = rings.reduce((sum, ring) => sum + ringAreaSquareMeters(ring, latRef), 0);
    const ratio = ringArea / officialArea;
    if (ratio < AREA_RATIO_FAIL[0] || ratio > AREA_RATIO_FAIL[1]) {
      areaFailCount += 1;
      if (areaFailCount <= 5) warn(`area ratio ${ratio.toFixed(2)} for ${slug} (ring ${Math.round(ringArea / 1e6)}km2 vs official ${Math.round(officialArea / 1e6)}km2)`);
      continue;
    }
    if (ratio < AREA_RATIO_WARN[0] || ratio > AREA_RATIO_WARN[1]) areaWarnCount += 1;
  }

  if (WATER_SPOT_COUNTIES.includes(slug)) spotWater[slug] = waterRings.length;
  manifest[slug] = { sha256: createHash("sha256").update(raw).digest("hex"), bytes: raw.length };
}

check(shapeBad === 0, `pack shape: ${packFiles.length - shapeBad}/${packFiles.length} valid (packVersion 2 + areas + rings)`);
check(budgetBad === 0, `vertex budgets: land<=${VERTEX_BUDGET}/${LAND_MAX_RINGS} rings, water<=${WATER_VERTEX_BUDGET}/${WATER_MAX_RINGS} rings (${budgetBad} over)`);
check(sizeFailCount === 0, `size budget: 0 packs over ${SIZE_FAIL_BYTES} bytes (max ${maxBytes} ${maxBytesSlug}); ${sizeWarnCount} over the ${SIZE_WARN_BYTES} warn line`);
check(areaFailCount === 0, `boundary area sanity: ${areaFailCount} packs outside [${AREA_RATIO_FAIL}] ratio (${areaWarnCount} soft-warn outside [${AREA_RATIO_WARN}])`);
for (const slug of WATER_SPOT_COUNTIES) {
  if (packSlugs.has(slug)) check((spotWater[slug] ?? 0) > 0, `${slug} keeps water rings (${spotWater[slug] ?? 0})`);
}

const ok = checks.every((c) => c.passed);
if (ok) {
  writeFileSync(`${PACK_DIR}/_manifest.json`, JSON.stringify({ generatedAt: null, packCount: Object.keys(manifest).length, totalBytes, packs: manifest }, null, 1));
}
const summary = {
  ok,
  update: "0.78-d-national-geo-pack-integrity",
  packCount: packSlugs.size,
  indexCount: indexSlugs.size,
  totalBytes,
  histogram,
  checks,
  warnings: warnings.slice(0, 20),
};
console.log(JSON.stringify(jsonOnly ? summary : { ok, packCount: packSlugs.size, totalBytes, histogram }, null, 2));
if (!ok) process.exitCode = 1;
