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
  "CityWorldTerrainCompositionProfile",
  "CityWorldParcelCompositionProfile",
  "terrainComposition?:",
  "parcelComposition?:",
]) {
  requireText("types", token, `CityWorld types must expose terrain/parcel composition token ${token}.`);
}

for (const profile of [
  "quiet_field",
  "neighborhood_yard_fabric",
  "civic_focus_field",
  "commercial_apron_field",
  "park_basin",
  "waterfront_edge_strata",
  "shell_boundary",
  "hidden_draft_field",
]) {
  requireText("types", profile, `Terrain composition profile ${profile} must be typed.`);
  requireText("compiler", profile, `Compiler must assign terrain composition profile ${profile}.`);
}

for (const profile of [
  "home_yard_grid",
  "commercial_apron",
  "civic_landmark_plinth",
  "apartment_court_grid",
  "park_path_basin",
  "waterfront_bank",
  "hidden_draft_anchor_pad",
]) {
  requireText("types", profile, `Parcel composition profile ${profile} must be typed.`);
  requireText("compiler", profile, `Compiler must assign parcel composition profile ${profile}.`);
}

for (const helper of ["terrainCompositionProfile", "parcelCompositionProfile", "publicTerrainVisualGrammar"]) {
  requireText("compiler", helper, `Compiler must keep ${helper} as the 0.4E composition assignment seam.`);
}

for (const rendererHook of ["drawTerrainParcelComposition", "drawParcelCompositionDetails"]) {
  requireText("renderer", rendererHook, `Renderer must consume 0.4E composition grammar through ${rendererHook}.`);
}

for (const testNeedle of [
  "attaches terrain and parcel composition grammar without changing playable boundaries",
  "neighborhood_yard_fabric",
  "civic_landmark_plinth",
  "hidden_draft_anchor_pad",
]) {
  requireText("tests", testNeedle, `Core tests must protect terrain/parcel composition behavior: ${testNeedle}.`);
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
  update: "prealpha-0.4e-terrain-parcel-composition",
  checkedFiles: files,
  blockers,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
