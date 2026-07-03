import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import {
  analyzeCityWorldScene,
  cityWorldDiamondPoints,
  cityWorldViewportFrameForPreset,
  compileCityWorldScene,
  projectCityWorldPoint,
  riversideDemoVoxelScene,
  sampleCityWorldViewportForCameraPreset,
} from "@atlas/core/voxel";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const files = {
  basis: join(root, "packages/core/src/voxel/cityWorldBasis.ts"),
  sampler: join(root, "packages/core/src/voxel/cityWorldTerrainSampler.ts"),
  diagnostics: join(root, "packages/core/src/voxel/cityWorldDiagnostics.ts"),
  renderer: join(root, "web/src/CityWorldRenderer.tsx"),
  tests: join(root, "packages/core/test/city-world-basis.test.ts"),
  packageJson: join(root, "package.json"),
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
  "CITY_WORLD_TILE_BASIS",
  "projectCityWorldPoint",
  "cityWorldDiamondPoints",
  "cityWorldViewportFrameForPreset",
  "cityWorldPointInsideFootprint",
  "cityWorldPointDistanceToSegment",
]) {
  requireText("basis", token, `CityWorld basis must expose ${token}.`);
}

for (const token of [
  "sampleCityWorldViewport",
  "sampleCityWorldViewportForCameraPreset",
  "isAuthoredCityWorldTerrainTile",
  "isEmptyCityWorldBoardTerrainTile",
  "cityWorldBuildingTouchesLot",
  "cityWorldLotTouchesRoad",
]) {
  requireText("sampler", token, `Terrain sampler must expose ${token}.`);
}

for (const token of ["sampleCityWorldViewportForCameraPreset", "cityWorldBuildingTouchesLot", "cityWorldLotTouchesRoad"]) {
  requireText("diagnostics", token, `Diagnostics must consume shared sampler helper ${token}.`);
}

for (const oldPrivateHelper of [
  "function viewportFrameForPreset",
  "function pointInsideFrame",
  "function lineIntersectsFrame",
  "function pointInsideFootprint",
  "function pointDistanceToSegment",
  "function segmentLength",
]) {
  rejectText("diagnostics", oldPrivateHelper, `Diagnostics must not keep private duplicate math helper ${oldPrivateHelper}.`);
}

for (const token of ["CITY_WORLD_TILE_BASIS", "projectCityWorldPoint", "cityWorldDiamondPoints"]) {
  requireText("renderer", token, `Renderer must import shared basis helper ${token}.`);
}

for (const rawProjectionNeedle of ["(point.x - point.y)", "(point.x + point.y)", "center.x, center.y - height / 2"]) {
  rejectText("renderer", rawProjectionNeedle, `Renderer must not keep raw duplicate projection/diamond formula ${rawProjectionNeedle}.`);
}

for (const forbiddenRuntimeNeedle of ["xt4d/GameBlocks", "from \"three\"", "from 'three'", "rapier", "@dimforge"]) {
  rejectText("basis", forbiddenRuntimeNeedle, `Basis must not import forbidden runtime reference ${forbiddenRuntimeNeedle}.`);
  rejectText("sampler", forbiddenRuntimeNeedle, `Sampler must not import forbidden runtime reference ${forbiddenRuntimeNeedle}.`);
  rejectText("renderer", forbiddenRuntimeNeedle, `Renderer must not import forbidden runtime reference ${forbiddenRuntimeNeedle}.`);
  rejectText("packageJson", forbiddenRuntimeNeedle, `Package manifest must not add forbidden dependency ${forbiddenRuntimeNeedle}.`);
}

for (const providerNeedle of ["google.maps", "GoogleMapsAdapter", "GeoDataAdapter", "maps.googleapis.com", "places.googleapis.com"]) {
  rejectText("basis", providerNeedle, `Basis must not reference provider boundary ${providerNeedle}.`);
  rejectText("sampler", providerNeedle, `Sampler must not reference provider boundary ${providerNeedle}.`);
}

requireText("tests", "projects board points", "Core tests must cover deterministic projection.");
requireText("tests", "samples the same viewport terrain counts", "Core tests must cover sampler/diagnostics parity.");

const projection = projectCityWorldPoint({ x: 3, y: 1, z: 2 });
if (projection.x !== 44 || projection.y !== 12) blockers.push(`Shared projection returned ${JSON.stringify(projection)}; expected {x:44,y:12}.`);

const diamond = cityWorldDiamondPoints({ x: 0, y: 0 }, 44, 24).join(",");
if (diamond !== "0,-12,22,0,0,12,-22,0") blockers.push(`Shared diamond points returned ${diamond}.`);

const desktopFrame = cityWorldViewportFrameForPreset("desktop", { x: 10, y: 5, z: 0 }, 1);
if (JSON.stringify(desktopFrame) !== JSON.stringify({ minX: -5, maxX: 25, minY: -5, maxY: 15 })) {
  blockers.push(`Desktop viewport frame changed unexpectedly: ${JSON.stringify(desktopFrame)}.`);
}

const city = compileCityWorldScene(riversideDemoVoxelScene);
const diagnostics = analyzeCityWorldScene(city);
const viewportParity = {};
for (const preset of city.cameraPresets) {
  const sample = sampleCityWorldViewportForCameraPreset(city, preset);
  const metric = diagnostics.metrics.viewportComposition[preset.id];
  viewportParity[preset.id] = {
    sampledTerrainTiles: sample.terrainTiles.length,
    diagnosticTerrainTiles: metric?.terrainTilesInFrame ?? null,
    sampledMassingCount: sample.terrainMassingCount,
  };
  if (metric?.terrainTilesInFrame !== sample.terrainTiles.length) {
    blockers.push(`${preset.id} sampler terrain count ${sample.terrainTiles.length} does not match diagnostics ${metric?.terrainTilesInFrame}.`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.9e-worldbasis-terrain-sampler-adapter-discipline",
  files,
  projection,
  desktopFrame,
  viewportParity,
  blockers,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
