import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const files = {
  types: join(root, "packages/core/src/voxel/cityWorldTypes.ts"),
  compiler: join(root, "packages/core/src/voxel/cityWorldCompiler.ts"),
  renderer: join(root, "web/src/CityWorldRenderer.tsx"),
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]));
const blockers = [];

function requireText(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) blockers.push(message);
}

function rejectText(fileKey, needle, message) {
  if (source[fileKey].includes(needle)) blockers.push(message);
}

requireText("types", "CityWorldVisualGrammar", "CityWorld scene types must expose CityWorldVisualGrammar.");
requireText("types", "CityWorldRoadProfile", "CityWorld scene types must expose road profile names.");
requireText("types", "CityWorldRoofMaterialProfile", "CityWorld scene types must expose roof material profile names.");
requireText("types", "visualGrammar?: CityWorldVisualGrammar", "CityWorld objects must carry optional visualGrammar metadata.");

requireText("compiler", "terrainVisualGrammar", "Compiler must assign terrain visual grammar.");
requireText("compiler", "roadVisualGrammar", "Compiler must assign road visual grammar.");
requireText("compiler", "lotVisualGrammar", "Compiler must assign lot visual grammar.");
requireText("compiler", "buildingVisualGrammar", "Compiler must assign building visual grammar.");
requireText("compiler", "embedded_asphalt_slab", "Road grammar must include embedded asphalt slab profile.");
requireText("compiler", "driveway_cut", "Road grammar must include driveway cut profile.");
requireText("compiler", "paver_crosswalk", "Road grammar must include paver crosswalk profile.");
requireText("compiler", "terracotta_barrel_tile", "Roof grammar must include terracotta barrel tile profile.");
requireText("compiler", "flat_parapet_cap", "Roof grammar must include flat parapet cap profile.");
requireText("compiler", "parcel_pad_shadow", "Building/lot grammar must include parcel contact shadow.");

requireText("renderer", "drawRoadSegmentModule", "Renderer must keep module-based road drawing.");
requireText("renderer", "drawRoofMaterial", "Renderer must keep roof material drawing.");
requireText("renderer", "drawHomeLotDetails", "Renderer must keep home lot/detail grounding.");

rejectText("compiler", "#e05d45", "Production compiler must not use the old loud red gym roof.");
rejectText("compiler", "#73a7d6", "Production compiler must not use the old loud blue strip-store roof.");
rejectText("renderer", "google.maps", "Renderer must not import or reference Google Maps internals.");

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.2e-roads-roofs-scene-compiler",
  checkedFiles: files,
  blockers,
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
