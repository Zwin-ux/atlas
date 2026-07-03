import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const files = {
  types: join(root, "packages/core/src/voxel/cityWorldTypes.ts"),
  compiler: join(root, "packages/core/src/voxel/cityWorldCompiler.ts"),
  renderer: join(root, "web/src/CityWorldRenderer.tsx"),
  tests: join(root, "packages/core/test/city-world-compiler.test.ts"),
  switcher: join(root, "web/src/CountySwitcher.tsx"),
  coverageView: join(root, "web/src/CountyCoverageView.tsx"),
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]));
const blockers = [];

function requireText(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) blockers.push(message);
}

function rejectText(fileKey, needle, message) {
  if (source[fileKey].includes(needle)) blockers.push(message);
}

for (const token of [
  "CityWorldTerrainElevationProfile",
  "CityWorldParcelElevationProfile",
  "CityWorldChunkEdgeProfile",
  "terrainElevation?:",
  "parcelElevation?:",
  "chunkEdge?:",
]) {
  requireText("types", token, `CityWorld types must expose elevation/chunk token ${token}.`);
}

for (const profile of [
  "flat_field",
  "raised_parcel_shelf",
  "civic_plinth_shelf",
  "commercial_slab_field",
  "park_basin_shelf",
  "water_edge_cut",
  "shell_flat",
  "hidden_draft_shelf",
]) {
  requireText("types", profile, `Terrain elevation profile ${profile} must be typed.`);
  requireText("compiler", profile, `Compiler must assign terrain elevation profile ${profile}.`);
}

for (const profile of [
  "none",
  "world_edge",
  "parcel_cluster_edge",
  "waterfront_bank_edge",
  "park_basin_edge",
  "hidden_draft_boundary",
]) {
  requireText("types", profile, `Chunk edge profile ${profile} must be typed.`);
  requireText("compiler", profile, `Compiler must assign chunk edge profile ${profile}.`);
}

for (const profile of [
  "thin_pad_lip",
  "raised_home_shelf",
  "commercial_slab_lip",
  "civic_plinth_stack",
  "apartment_court_lip",
  "park_basin_lip",
  "waterfront_bank_cut",
  "hidden_anchor_shelf",
]) {
  requireText("types", profile, `Parcel elevation profile ${profile} must be typed.`);
  requireText("compiler", profile, `Compiler must assign parcel elevation profile ${profile}.`);
}

for (const helper of ["terrainElevationProfile", "terrainChunkEdgeProfile", "parcelElevationProfile", "isOnBounds"]) {
  requireText("compiler", helper, `Compiler must keep ${helper} as the 0.5E elevation/chunk assignment seam.`);
}

for (const rendererHook of ["drawTerrainElevationChunkFace", "terrainElevationDepth", "drawParcelElevationShelf"]) {
  requireText("renderer", rendererHook, `Renderer must consume 0.5E elevation/chunk grammar through ${rendererHook}.`);
}

for (const testNeedle of [
  "attaches terrain elevation and chunk-edge grammar without exposing hidden drafts",
  "civic_plinth_shelf",
  "waterfront_bank_edge",
  "civic_plinth_stack",
  "hidden_anchor_shelf",
]) {
  requireText("tests", testNeedle, `Core tests must protect terrain elevation/chunk behavior: ${testNeedle}.`);
}

for (const providerNeedle of ["google.maps", "@atlas/geo", "GoogleMaps", "GeoDataAdapter"]) {
  rejectText("renderer", providerNeedle, `Renderer must not import or reference provider boundary ${providerNeedle}.`);
}

for (const publicPromotionNeedle of ["anaheim-candidate", "ontario-candidate", "Anaheim / Playable", "Ontario / Playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose hidden candidate ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose hidden candidate ${publicPromotionNeedle}.`);
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.5e-terrain-elevation-chunk-language",
  checkedFiles: files,
  blockers,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
