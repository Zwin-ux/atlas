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

for (const token of ["CityWorldTerrainChunkMassingProfile", "terrainChunkMassing?:"]) {
  requireText("types", token, `CityWorld types must expose 0.6E terrain massing token ${token}.`);
}

for (const profile of [
  "none",
  "outer_world_edge_mass",
  "civic_plinth_mass",
  "residential_shelf_mass",
  "commercial_slab_mass",
  "park_basin_cut_mass",
  "waterfront_bank_cut_mass",
  "shell_boundary_mass",
  "hidden_draft_mass",
]) {
  requireText("types", profile, `Terrain chunk massing profile ${profile} must be typed.`);
  requireText("compiler", profile, `Compiler must assign terrain chunk massing profile ${profile}.`);
  requireText("tests", profile, `Core tests must protect terrain chunk massing profile ${profile}.`);
}

for (const helper of ["terrainChunkMassingProfile", "terrainChunkMassing", "terrainChunkEdgeProfile", "terrainElevationProfile"]) {
  requireText("compiler", helper, `Compiler must keep ${helper} as a terrain/chunk assignment seam.`);
}

for (const rendererHook of ["drawTerrainChunkMassing", "terrainChunkMassingStyle", "drawTerrainElevationChunkFace"]) {
  requireText("renderer", rendererHook, `Renderer must consume 0.6E terrain chunk massing through ${rendererHook}.`);
}

for (const visualProofNeedle of ["widthScale", "heightScale", "strataAlpha", "outer_world_edge_mass", "civic_plinth_mass"]) {
  requireText("renderer", visualProofNeedle, `Renderer must use structural 0.6E massing value ${visualProofNeedle}.`);
}

for (const diagnosticsNeedle of ["chunkEdgeReadabilityScore", "chunkEdgeRatio", "terrainElevationVisibleRatio", "chunkEdgeReadabilityFloorScore"]) {
  requireText("tests", diagnosticsNeedle, `Core tests must protect 0.10E terrain readability metric ${diagnosticsNeedle}.`);
}

for (const providerNeedle of ["google.maps", "@atlas/geo", "GoogleMaps", "GeoDataAdapter"]) {
  rejectText("renderer", providerNeedle, `Renderer must not import or reference provider boundary ${providerNeedle}.`);
}

for (const publicPromotionNeedle of ["anaheim-candidate", "ontario-candidate", "Anaheim / Playable", "Ontario / Playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose hidden candidate ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose hidden candidate ${publicPromotionNeedle}.`);
}

try {
  const {
    analyzeCityWorldScene,
    compileCityWorldScene,
    riversideDemoVoxelScene,
  } = await import("../packages/core/dist/index.js");
  const report = analyzeCityWorldScene(compileCityWorldScene(riversideDemoVoxelScene), "playable");
  const viewports = report.metrics.viewportComposition;
  const floorChecks = [
    ["terrainMassingCoverageRatio", report.metrics.terrainMassingCoverageRatio, 0.88],
    ["emptyBoardRatio", 1 - report.metrics.emptyBoardRatio, 0.93],
    ["firstViewportCompositionScore", report.metrics.firstViewportCompositionScore, 0.77],
    ["desktopChunkEdgeReadabilityScore", viewports.desktop?.chunkEdgeReadabilityScore ?? 0, 0.7],
    ["mobileChunkEdgeReadabilityScore", viewports.mobile?.chunkEdgeReadabilityScore ?? 0, 0.76],
    ["residentialDetailChunkEdgeReadabilityScore", viewports.residential_detail?.chunkEdgeReadabilityScore ?? 0, 0.74],
    ["buildingLotContactRatio", report.metrics.buildingLotContactRatio, 0.98],
    ["lotRoadContactRatio", report.metrics.lotRoadContactRatio, 0.78],
  ];
  for (const [metric, value, floor] of floorChecks) {
    if (value < floor) blockers.push(`${metric} ${value} is below required floor ${floor}.`);
  }
  if (report.hardBlockers.length > 0) blockers.push(`CityWorld diagnostics reported hard blockers: ${report.hardBlockers.map((blocker) => blocker.code).join(", ")}.`);
} catch (error) {
  blockers.push(`Unable to evaluate 0.10E terrain metric floors from packages/core/dist: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.10e-terrain-world-edge-measured-correction",
  postAlphaQualityFloor: "postalpha-0.26e-public-engine-beta-quality-pass",
  checkedFiles: files,
  blockers,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
