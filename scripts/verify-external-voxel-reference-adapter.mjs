#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const args = parseArgs(process.argv.slice(2));

const requiredFiles = [
  "docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md",
  "docs/AXIOM_ENGINE_REFERENCE_STACK.md",
  "docs/NEXT_QUESTS.md",
  "docs/DECISIONS.md",
  "docs/BUILD_LOG.md",
  "packages/core/src/voxel/cityWorldDerivedTerrainMap.ts",
  "packages/core/test/city-world-derived-terrain-map.test.ts",
  "scripts/verify-cityworld-derived-terrain-maps.mjs",
  "scripts/verify-cityworld-mobile-occlusion.mjs",
];

const requiredDocPatterns = [
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /VoxCity/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /VoxelSpace/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Pixels2Voxels/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /compute_grid_geometry/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /GridProjector/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Orientation at boundaries only/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /_CELL_INTERSECTION_THRESHOLD|overlap thresholds/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /effectiveSource/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /fallbackReason/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Voxelizer/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Memory caps/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /allocation failures/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /visible blockers/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /surface metadata/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /No floating windows/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Surface-aware downsampling/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Debug payload caps/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /height map/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /color map/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /hiddeny|occlusion buffer/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Do not copy VoxelSpace/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /RGB|channel/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /verify-cityworld-derived-terrain-maps/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /verify-cityworld-mobile-occlusion/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /verify-cityworld-source-art-contrast/],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /reference, not dependencies/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /No Earth Engine/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /No Open3D runtime/i],
  ["docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md", /Do not vendor VoxCity, VoxelSpace, or Pixels2Voxels/i],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /External Voxel Reference Adapter/],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /VoxCity/],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /VoxelSpace/],
  ["docs/AXIOM_ENGINE_REFERENCE_STACK.md", /Pixels2Voxels/],
  ["docs/NEXT_QUESTS.md", /External Voxel Reference Adapter/],
  ["docs/DECISIONS.md", /External voxel references are research adapters/],
  ["docs/BUILD_LOG.md", /External Voxel Reference Adapter/],
];

const forbiddenDependencyPatterns = [
  /(?:^|\n)\s*["']?(?:voxcity|open3d|three|@react-three\/[^"'\s:]+|@dimforge\/rapier[^"'\s:]*|rapier)["']?\s*:/i,
  /\/(?:voxcity|open3d|three|@react-three\+[^@\s]+|@dimforge\+rapier[^@\s]*|rapier)@/i,
];

const dependencyManifestFiles = [
  ...listPackageManifests("."),
  ...(existsSync("pnpm-lock.yaml") ? ["pnpm-lock.yaml"] : []),
];
const runtimeScanRoots = ["apps", "packages", "server", "web"];
const forbiddenRuntimeImportPatterns = [
  /\bfrom\s+["'][^"']*voxcity[^"']*["']/i,
  /\bimport\s+[^;]*["'][^"']*voxcity[^"']*["']/i,
  /\brequire\(\s*["'][^"']*voxcity[^"']*["']\s*\)/i,
  /\bimport\(\s*["'][^"']*voxcity[^"']*["']\s*\)/i,
  /\bfrom\s+["'][^"']*open3d[^"']*["']/i,
  /\bimport\s+[^;]*["'][^"']*open3d[^"']*["']/i,
  /\brequire\(\s*["'][^"']*open3d[^"']*["']\s*\)/i,
  /\bimport\(\s*["'][^"']*open3d[^"']*["']\s*\)/i,
  /\bfrom\s+["'](?:three|@react-three\/[^"']+)["']/i,
  /\bimport\s+[^;]*["'](?:three|@react-three\/[^"']+)["']/i,
  /\brequire\(\s*["'](?:three|@react-three\/[^"']+)["']\s*\)/i,
  /\bimport\(\s*["'](?:three|@react-three\/[^"']+)["']\s*\)/i,
  /\bfrom\s+["'][^"']*(?:@dimforge\/rapier|rapier)[^"']*["']/i,
  /\bimport\s+[^;]*["'][^"']*(?:@dimforge\/rapier|rapier)[^"']*["']/i,
  /\brequire\(\s*["'][^"']*(?:@dimforge\/rapier|rapier)[^"']*["']\s*\)/i,
  /\bimport\(\s*["'][^"']*(?:@dimforge\/rapier|rapier)[^"']*["']\s*\)/i,
  /\bfrom\s+["'][^"']*VoxelSpace[^"']*["']/i,
  /\bfrom\s+["'][^"']*Pixels2Voxels[^"']*["']/i,
];

const blockers = [];
const warnings = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    blockers.push(`Missing required file: ${file}`);
  }
}

for (const [file, pattern] of requiredDocPatterns) {
  if (!existsSync(file)) {
    blockers.push(`Missing file for pattern check: ${file}`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  if (!pattern.test(text)) {
    blockers.push(`${file} does not match ${pattern}.`);
  }
}

for (const manifest of dependencyManifestFiles) {
  const manifestText = readFileSync(manifest, "utf8");
  for (const pattern of forbiddenDependencyPatterns) {
    if (pattern.test(manifestText)) {
      blockers.push(`${manifest} contains forbidden reference dependency pattern ${pattern}.`);
    }
  }
}

for (const root of runtimeScanRoots) {
  if (!existsSync(root)) {
    warnings.push(`Runtime scan root not present: ${root}`);
    continue;
  }
  for (const file of listSourceFiles(root)) {
    const text = readFileSync(file, "utf8");
    for (const pattern of forbiddenRuntimeImportPatterns) {
      if (pattern.test(text)) {
        blockers.push(`${file} imports a forbidden external voxel reference runtime: ${pattern}.`);
      }
    }
  }
}

const summary = {
  ok: blockers.length === 0,
  checkedFiles: requiredFiles,
  dependencyManifestFiles,
  runtimeScanRoots,
  blockers,
  warnings,
};

if (args.jsonOnly) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`External voxel reference adapter: ${summary.ok ? "ok" : "blocked"}`);
  for (const blocker of blockers) {
    console.log(`- blocker: ${blocker}`);
  }
  for (const warning of warnings) {
    console.log(`- warning: ${warning}`);
  }
}

if (!summary.ok) {
  process.exitCode = 1;
}

function listSourceFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = safeReadDir(current);
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", "dist", "build", ".git"].includes(entry.name)) {
          stack.push(path);
        }
        continue;
      }
      if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
        files.push(path);
      }
    }
  }
  return files;
}

function listPackageManifests(root) {
  const manifests = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = safeReadDir(current);
    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!["node_modules", "dist", "build", ".git"].includes(entry.name)) {
          stack.push(path);
        }
        continue;
      }
      if (entry.name === "package.json") {
        manifests.push(path === "package.json" ? path : path.replace(/^\.[/\\]/, ""));
      }
    }
  }
  return manifests;
}

function safeReadDir(path) {
  try {
    return readdirSync(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

function parseArgs(argv) {
  const parsed = {
    jsonOnly: false,
  };

  for (const arg of argv) {
    if (arg === "--json-only") {
      parsed.jsonOnly = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}
