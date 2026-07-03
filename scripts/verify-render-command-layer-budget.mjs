#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const warnings = [];

const sourceFiles = {
  renderCommands: "packages/core/src/voxel/cityWorldRenderCommands.ts",
  sceneWindow: "packages/core/src/voxel/cityWorldSceneWindow.ts",
  voxelIndex: "packages/core/src/voxel/index.ts",
  coreIndex: "packages/core/src/index.ts",
  renderer: "web/src/CityWorldRenderer.tsx",
  tests: "packages/core/test/city-world-render-commands.test.ts",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
};

const source = Object.fromEntries(Object.entries(sourceFiles).map(([key, relativePath]) => [key, readFileSync(join(root, relativePath), "utf8")]));

requireText("renderCommands", "CityWorldRenderCommandBuffer", "Core render command buffer type is missing.");
requireText("renderCommands", "CITY_WORLD_RENDER_LAYER_BUDGETS", "Render layer budget profiles are missing.");
requireText("renderCommands", "engine_beta_public", "Public render budget profile is missing.");
requireText("renderCommands", "shell_empty_state", "Shell empty-state render budget profile is missing.");
requireText("renderCommands", "hidden_draft_probe", "Hidden draft render budget profile is missing.");
requireText("sceneWindow", "buildCityWorldRenderCommandBuffer", "Scene windows must stay backed by render commands.");
requireText("voxelIndex", "./cityWorldRenderCommands.js", "Voxel index must export render commands.");
requireText("coreIndex", "buildCityWorldRenderCommandBuffer", "Core index must export render command builder.");
requireText("coreIndex", "evaluateCityWorldRenderLayerBudget", "Core index must export render layer budget evaluator.");
requireText("renderer", "compileCityWorldSceneWindow", "CityWorldRenderer must consume render commands through scene windows.");
requireText("renderer", "sceneWindow.visibleCommands", "CityWorldRenderer must draw scene-window render commands.");
requireText("renderer", "orderedSceneItems", "CityWorldRenderer must draw ordered scene items from render commands.");
requireText("tests", "blocks public clutter commands", "Core tests must prove public clutter blocks.");
requireText("splitGuard", "scripts/verify-render-command-layer-budget.mjs", "Strict split guard must allow the render command verifier.");

for (const [key, text] of Object.entries(source)) {
  rejectText(key, text, /@atlas\/geo|GeoDataAdapter|GoogleMaps|google\.maps|maps\.googleapis|places\.googleapis/i, `${sourceFiles[key]} must not import or reference provider internals.`);
  rejectText(key, text, /from ["'](?:three|@react-three|rapier|@dimforge|@googlemaps)/i, `${sourceFiles[key]} must not add runtime engine dependencies.`);
}

let metricSummary = null;

try {
  const {
    buildCityWorldRenderCommandBuffer,
    compileCityWorldScene,
    compileCountyShellCityWorldScene,
    compileDistrictPlaceAnchorDraftCityWorldScene,
    evaluateCityWorldRenderLayerBudget,
    parseDistrictPlaceAnchorPack,
    riversideDemoVoxelScene,
  } = await import("../packages/core/dist/index.js");

  const riverside = compileCityWorldScene(riversideDemoVoxelScene);
  const orangeShell = compileCountyShellCityWorldScene({
    countySlug: "orange-ca",
    countyName: "Orange County",
    stateCode: "CA",
    coverage: {
      countySlug: "orange-ca",
      coverageTier: "L1_COUNTY_SHELL",
      coverageLabel: "County shell",
      coverageMessage: "Orange County is indexed, but not playable yet.",
      playable: false,
    },
  });
  const anaheimPack = parseDistrictPlaceAnchorPack(
    JSON.parse(readFileSync(join(root, "data/district_place_anchor_packs/anaheim-anchors.json"), "utf8")),
    "data/district_place_anchor_packs/anaheim-anchors.json",
  );
  const ontarioPack = parseDistrictPlaceAnchorPack(
    JSON.parse(readFileSync(join(root, "data/district_place_anchor_packs/ontario-anchors.json"), "utf8")),
    "data/district_place_anchor_packs/ontario-anchors.json",
  );
  const anaheimDraft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimPack });
  const ontarioDraft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: ontarioPack });

  const evaluations = [
    ["riverside", "engine_beta_public", riverside, { includeLabels: true }],
    ["orangeShell", "shell_empty_state", orangeShell, { includeLabels: false }],
    ["anaheimDraft", "hidden_draft_probe", anaheimDraft, { includeLabels: false }],
    ["ontarioDraft", "hidden_draft_probe", ontarioDraft, { includeLabels: false }],
  ].map(([id, profileId, scene, options]) => {
    const buffer = buildCityWorldRenderCommandBuffer(scene, options);
    const budget = evaluateCityWorldRenderLayerBudget(buffer, profileId, scene);
    if (!budget.passed) {
      blockers.push(`${id} ${profileId} render budget failed: ${budget.blockers.join("; ")}`);
    }
    return {
      id,
      profileId,
      passed: budget.passed,
      blockers: budget.blockers,
      metrics: budget.metrics,
      layerSummaries: budget.layerSummaries,
      playable: scene.coverage?.playable ?? null,
    };
  });

  const riversideEvaluation = evaluations.find((item) => item.id === "riverside");
  if (riversideEvaluation?.metrics.publicClutterCommandCount !== 0) {
    blockers.push(`Riverside public clutter command count must be 0; got ${riversideEvaluation?.metrics.publicClutterCommandCount}.`);
  }

  const hiddenPublicLeaks = evaluations.filter((item) => item.id.endsWith("Draft") && item.playable !== false);
  for (const leak of hiddenPublicLeaks) {
    blockers.push(`${leak.id} must remain non-playable in render command proof.`);
  }

  metricSummary = {
    update: "prealpha-0.27e-render-command-pipeline-layer-budget",
    evaluations,
  };
} catch (error) {
  blockers.push(`Unable to evaluate built render command budgets: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.27e-render-command-pipeline-layer-budget",
  checkedFiles: sourceFiles,
  blockerCount: blockers.length,
  blockers,
  warnings,
  metricSummary,
};

if (jsonOnly) {
  console.log(JSON.stringify(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (!result.ok) {
  process.exitCode = 1;
}

function requireText(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) blockers.push(message);
}

function rejectText(fileKey, text, pattern, message) {
  if (pattern.test(text)) blockers.push(message);
}
