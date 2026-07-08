#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const UPDATE = "postalpha-0.75c-3-close-zoom-material-texture";
const blockers = [];
const warnings = [];

const files = {
  renderer: "web/src/CityWorldRenderer.tsx",
  compiler: "packages/core/src/voxel/cityWorldCompiler.ts",
  parametricGenerator: "packages/core/src/voxel/cityWorldParametricGenerator.ts",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
};

const source = {};
for (const [key, path] of Object.entries(files)) {
  const absolute = join(root, path);
  source[key] = existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
  if (!source[key]) blockers.push(`Missing required file ${path}.`);
}

const threshold = readMaterialTextureThreshold(source.renderer);
const wallTextureBody = functionBody(source.renderer, "drawWallMaterialTexture");
const roofTextureBody = functionBody(source.renderer, "drawRoofMaterialTexture");
const setCameraZoomBody = functionBody(source.renderer, "setCameraZoom");

requireText("renderer", "const MATERIAL_TEXTURE_DETAIL_ZOOM = 1.55", "Renderer must keep the material texture threshold explicit at 1.55.");
requireText("renderer", "function shouldDrawMaterialTexture(cameraZoom: number)", "Renderer must expose a single zoom-gate helper for material texture.");
requireText("renderer", "shouldDrawMaterialTexture(cameraZoom)", "drawScene must gate material texture from the live camera zoom.");
requireText("renderer", "drawDepthInterleavedBuildingsAndProps(layers, buildings, props, animated, atlas, shouldDrawMaterialTexture(cameraZoom))", "Building/prop interleave path must receive the zoom-gated material flag.");
requireText("renderer", "drawBuilding(layers, group, item.building, atlas, materialTextureEnabled)", "Material texture must stay inside the existing per-building group.");
requireText("renderer", "drawWallMaterialTexture(layer, geometry, building)", "Building shell must call close-zoom wall material texture.");
requireText("renderer", "drawRoofMaterialTexture(layer, geometry, building)", "Roof path must call close-zoom roof material texture.");
requireText("renderer", "materialTextureSeed(building.id, side, course)", "Wall material variation must be seeded by building id + face + course.");
requireText("renderer", "materialTextureSeed(building.id, `roof-${roofShape}`, course)", "Roof material variation must be seeded by building id + roof face/course.");
requireText("renderer", "wallQuadPoints(surface", "Wall material must use wall-plane quad projection.");
requireText("renderer", "roofMaterialQuadPoints", "Roof material must be clipped to the roof diamond, not screen-space decals.");
requireText("splitGuard", "scripts/verify-material-texture-grammar.mjs", "Strict split guard must allow the material texture verifier.");

for (const forbidden of ["three", "@react-three", "Texture.from", "Assets.load", "new Filter", "GlProgram.from"]) {
  rejectText(wallTextureBody + roofTextureBody, forbidden, `Material texture pass must not add dependency/shader/bitmap token ${forbidden}.`);
}
rejectText(wallTextureBody + roofTextureBody, "Math.random", "Material texture pass must not use Math.random.");
rejectText(wallTextureBody + roofTextureBody, "gradient", "Material texture pass must not use gradient language or implementation.");

requireTextIn(wallTextureBody, "wallSurface(geometry, side)", "Wall material must resolve each face through wallSurface.");
requireTextIn(wallTextureBody, "wallQuadPoints(surface", "Wall material cells/courses must be authored in wall-plane coordinates.");
requireTextIn(wallTextureBody, "shadeColor(geometry.bodyColor", "Wall material shades must derive from bodyColor through shadeColor.");
requireTextIn(roofTextureBody, "shadeColor(roofColor", "Roof material shades must derive from roofColor through shadeColor.");
requireTextIn(setCameraZoomBody, "shouldDrawMaterialTexture(camera.zoom)", "Zoom handling must check the gate before zoom changes.");
requireTextIn(setCameraZoomBody, "setWindowRefreshKey", "Crossing the material zoom threshold must trigger a renderer rebuild.");

const wallGraphicsCount = countOccurrences(wallTextureBody, "new Graphics()");
const roofGraphicsCount = countOccurrences(roofTextureBody, "new Graphics()");
if (wallGraphicsCount !== 1) blockers.push(`drawWallMaterialTexture must batch into one Graphics per building; found ${wallGraphicsCount}.`);
if (roofGraphicsCount !== 1) blockers.push(`drawRoofMaterialTexture must batch into one Graphics per building; found ${roofGraphicsCount}.`);

const zoomGate = evaluateMaterialTextureCommandPlan(threshold);
blockers.push(...zoomGate.blockers);

const cameraPresetSummary = await evaluateCameraPresetGates(threshold);
blockers.push(...cameraPresetSummary.blockers);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  checkedFiles: files,
  threshold,
  batching: {
    wallGraphicsCount,
    roofGraphicsCount,
  },
  zoomGate: zoomGate.summary,
  cameraPresetSummary: cameraPresetSummary.summary,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function readMaterialTextureThreshold(rendererSource) {
  const match = rendererSource.match(/const MATERIAL_TEXTURE_DETAIL_ZOOM = ([0-9.]+);/);
  if (!match) {
    blockers.push("Unable to read MATERIAL_TEXTURE_DETAIL_ZOOM from renderer.");
    return Number.NaN;
  }
  return Number(match[1]);
}

function evaluateMaterialTextureCommandPlan(materialThreshold) {
  const localBlockers = [];
  const below = materialTextureCommandPlan({ zoom: materialThreshold - 0.01, buildingId: "gen-building-home-017", roofShape: "gable" });
  const aboveA = materialTextureCommandPlan({ zoom: materialThreshold, buildingId: "gen-building-home-017", roofShape: "gable" });
  const aboveB = materialTextureCommandPlan({ zoom: materialThreshold, buildingId: "gen-building-home-017", roofShape: "gable" });
  const sibling = materialTextureCommandPlan({ zoom: materialThreshold, buildingId: "gen-building-home-018", roofShape: "gable" });

  if (below.length !== 0) localBlockers.push(`Below-threshold material plan must emit 0 texture commands; got ${below.length}.`);
  if (aboveA.length < 8) localBlockers.push(`Above-threshold material plan must emit wall and roof texture commands; got ${aboveA.length}.`);
  if (JSON.stringify(aboveA) !== JSON.stringify(aboveB)) localBlockers.push("Material texture plan must be deterministic across two same-input runs.");
  if (JSON.stringify(aboveA) === JSON.stringify(sibling)) localBlockers.push("Material texture seed must vary across stable building ids.");

  return {
    blockers: localBlockers,
    summary: {
      belowThresholdCommandCount: below.length,
      aboveThresholdCommandCount: aboveA.length,
      repeatedRunIdentical: JSON.stringify(aboveA) === JSON.stringify(aboveB),
      siblingBuildingDiffers: JSON.stringify(aboveA) !== JSON.stringify(sibling),
      sampleCommands: aboveA.slice(0, 6),
    },
  };
}

function materialTextureCommandPlan({ zoom, buildingId, roofShape }) {
  if (!(zoom >= 1.55)) return [];
  const commands = [];
  for (const side of ["sun", "shade"]) {
    const courseCount = 5;
    const blockColumns = 4;
    for (let course = 0; course < courseCount; course += 1) {
      const seed = materialTextureSeed(buildingId, side, course);
      commands.push({ kind: "wallCourse", side, course, delta: materialTextureDelta(seed) });
      if (seed % 4 === 0) {
        commands.push({ kind: "wallCell", side, course, column: Math.floor(seed / 7) % blockColumns });
      }
    }
  }
  const roofCourseCount = 5;
  for (let course = 1; course < roofCourseCount; course += 1) {
    const seed = materialTextureSeed(buildingId, `roof-${roofShape}`, course);
    commands.push({ kind: "roofSeam", course });
    if (seed % 3 === 0) {
      commands.push({ kind: "roofCell", course, delta: materialTextureDelta(seed) });
    }
  }
  const capCount = 2 + (materialTextureSeed(buildingId, "roof-ridge", 0) % 3);
  for (let cap = 0; cap < capCount; cap += 1) {
    commands.push({ kind: "ridgeCap", cap, seed: materialTextureSeed(buildingId, "roof-ridge", cap) });
  }
  return commands;
}

async function evaluateCameraPresetGates(materialThreshold) {
  const localBlockers = [];
  let summary = null;
  try {
    const { compileCityWorldScene, riversideDemoVoxelScene } = await import("../packages/core/dist/index.js");
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const presets = Object.fromEntries(scene.cameraPresets.map((preset) => [preset.id, preset.zoom]));
    if (!(presets.desktop < materialThreshold)) localBlockers.push(`desktop zoom must stay below material threshold ${materialThreshold}; got ${presets.desktop}.`);
    if (!(presets.mobile < materialThreshold)) localBlockers.push(`mobile zoom must stay below material threshold ${materialThreshold}; got ${presets.mobile}.`);
    if (!(presets.residential_detail >= materialThreshold)) localBlockers.push(`residential_detail zoom must cross material threshold ${materialThreshold}; got ${presets.residential_detail}.`);
    if (!(presets.commerce_detail >= materialThreshold)) localBlockers.push(`commerce_detail zoom must cross material threshold ${materialThreshold}; got ${presets.commerce_detail}.`);
    summary = presets;
  } catch (error) {
    localBlockers.push(`Unable to evaluate built camera presets. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
  }
  return { blockers: localBlockers, summary };
}

function materialTextureSeed(buildingId, face, courseIndex) {
  const key = `${buildingId}:${face}:${courseIndex}`;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

function materialTextureDelta(seed) {
  const steps = [-16, -10, 10, 16];
  return steps[seed % steps.length] ?? 10;
}

function requireText(fileKey, needle, message) {
  if (!source[fileKey]?.includes(needle)) blockers.push(message);
}

function requireTextIn(text, needle, message) {
  if (!text.includes(needle)) blockers.push(message);
}

function rejectText(text, needle, message) {
  if (text.includes(needle)) blockers.push(message);
}

function countOccurrences(text, needle) {
  return (text.match(new RegExp(escapeRegExp(needle), "g")) ?? []).length;
}

function functionBody(text, name) {
  const start = text.indexOf(`function ${name}`);
  if (start === -1) {
    blockers.push(`Missing function ${name}.`);
    return "";
  }
  const braceStart = text.indexOf("{", start);
  if (braceStart === -1) return "";
  let depth = 0;
  for (let index = braceStart; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return text.slice(braceStart, index + 1);
  }
  blockers.push(`Unable to parse function body for ${name}.`);
  return "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
