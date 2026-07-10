#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const UPDATE_ID = "postalpha-0.70h-deterministic-generated-district-specs";
const ARTIFACT_PATH = "artifacts/national-generation/0.70h/generated-district-specs.json";
const SAMPLE_COUNTIES = ["cook-il", "miami-dade-fl", "maricopa-az", "riverside-ca"];

const blockers = [];
const warnings = [];
const checkedFiles = [];

const orchestratorSource = read("packages/core/src/voxel/cityWorldGeneratedDistrict.ts");
const typeSource = read("packages/core/src/voxel/cityWorldGeneratedDistrictTypes.ts");
const seedSource = read("packages/core/src/voxel/cityWorldGeneratedDistrictSeed.ts");
const archetypeSource = read("packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts");
const windowSource = read("packages/core/src/voxel/cityWorldSceneWindow.ts");
const productionSource = read("packages/core/src/world/nationalGenerationProduction.ts");
const coreIndexSource = read("packages/core/src/index.ts");
const voxelIndexSource = read("packages/core/src/voxel/index.ts");
const testSource = read("packages/core/test/city-world-generated-district.test.ts");
const packageSource = read("package.json");

for (const token of [
  "createDeterministicGeneratedDistrictSpec",
  "createDeterministicGeneratedDistrictScene",
  "providerGeometry: false",
  "publicPlayable: false",
  "coverageTier: \"L1_COUNTY_SHELL\"",
]) {
  requireToken(orchestratorSource, token, "generated district orchestrator");
}

for (const token of [
  "DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID",
  "sourceBasis: \"census_identity_only\"",
  "promotionBlockers",
]) {
  requireToken(typeSource, token, "generated district types");
}

for (const token of ["fnv1a32", "atlas-generated-district-v1", "roundCoordinate"]) {
  requireToken(seedSource, token, "generated district seed");
}

for (const token of ["selectGeneratedDistrictArchetype", "generatedZones", "generatedRoadSeeds", "generatedHeightGrid"]) {
  requireToken(archetypeSource, token, "generated district archetypes");
}

for (const token of ["generated_draft_window", "maxPropCommands: 36", "requireNonPlayable: true"]) {
  requireToken(windowSource, token, "generated draft window budget");
}

for (const token of ["providerNormalizedLocalAnchors", "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS"]) {
  requireToken(productionSource, token, "national generation production ladder");
}

for (const token of [
  "createDeterministicGeneratedDistrictSpec",
  "createDeterministicGeneratedDistrictScene",
  "deterministicGeneratedDistrictSeedForCounty",
]) {
  requireToken(coreIndexSource, token, "core index exports");
  requireToken(voxelIndexSource, token, "voxel index exports");
}

for (const token of ["cook-il", "miami-dade-fl", "maricopa-az", "generated_draft_window"]) {
  requireToken(testSource, token, "generated district tests");
}

if (!packageSource.includes("\"verify:deterministic-generated-districts\"")) {
  blockers.push("package.json must expose verify:deterministic-generated-districts.");
}

let runtime = null;
try {
  const core = await import("../packages/core/dist/index.js");
  const service = core.createNationalWorldService([core.riversideDemoVoxelScene]);
  const directory = service.listCoverageDirectory();
  const samples = SAMPLE_COUNTIES.map((countySlug) => sampleGeneratedDistrict(core, countySlug));
  const readiness = core.evaluateNationalGenerationProductionReadiness({
    coverageDirectory: directory,
    nationalCountyIndexSource: "census_gazetteer",
    shellSceneCompiler: true,
    deterministicDistrictGenerator: true,
    providerGeometryBlocked: true,
    providerNormalizedLocalAnchors: false,
    rendererWindowing: true,
    desktopMobileProofRequired: true,
  });

  assert(readiness.productionReady === false, "Generated districts must not mark the national engine production-ready.");
  assert(
    readiness.currentStage === "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS",
    `Generated district readiness must advance only to P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS; got ${readiness.currentStage}.`,
  );
  assert(
    readiness.blockers.includes("Provider-normalized local anchors need category, attribution, cache, and policy gates before generated districts can be promoted."),
    "Readiness must name provider-normalized local anchors as the next blocker.",
  );

  runtime = {
    directoryTotals: directory.totals,
    samples,
    readiness,
  };
} catch (error) {
  blockers.push(`Could not evaluate built deterministic generated district runtime. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  artifactPath: ARTIFACT_PATH,
  checkedFiles,
  runtime,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

await mkdir(dirname(resolve(ARTIFACT_PATH)), { recursive: true });
await writeFile(resolve(ARTIFACT_PATH), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function sampleGeneratedDistrict(core, countySlug) {
  const county = core.US_COUNTY_INDEX.find((entry) => entry.countySlug === countySlug);
  assert(Boolean(county), `Missing sample county ${countySlug}.`);

  const firstSpec = core.createDeterministicGeneratedDistrictSpec({ county });
  const secondSpec = core.createDeterministicGeneratedDistrictSpec({ county });
  assert(JSON.stringify(firstSpec) === JSON.stringify(secondSpec), `${countySlug} generated district spec is not deterministic.`);
  assert(firstSpec.sourceBasis === "census_identity_only", `${countySlug} must be generated from Census identity only.`);
  assert(firstSpec.providerGeometry === false, `${countySlug} generated spec must not use provider geometry.`);
  assert(firstSpec.publicPlayable === false, `${countySlug} generated spec must not be public playable.`);
  assert(firstSpec.promotionBlocked === true, `${countySlug} generated spec must be promotion-blocked.`);

  const { generated, result } = core.createDeterministicGeneratedDistrictScene({ county });
  const { scene } = result;
  assert(generated.seed === firstSpec.seed, `${countySlug} scene wrapper changed the deterministic seed.`);
  assert(scene.coverage?.playable === false, `${countySlug} scene must be non-playable.`);
  assert(scene.coverage?.coverageTier === "L1_COUNTY_SHELL", `${countySlug} scene must remain L1 shell coverage.`);
  assert(scene.terrainTiles.length > 1_200, `${countySlug} generated scene terrain is too small.`);
  assert(scene.roadSegments.length >= 6, `${countySlug} generated scene needs at least 6 roads.`);
  // 0.75R: floors rebased on the fable parametric generator, which composes
  // fewer, larger authored-mass lots (observed 18-21 lots / 17-19 buildings /
  // 6-7 places across the sample counties) than the pre-merge generator.
  assert(scene.lots.length > 15, `${countySlug} generated scene needs more lot mass.`);
  assert(scene.buildings.length > 15, `${countySlug} generated scene needs more building mass.`);
  assert(scene.places.length >= 6, `${countySlug} generated scene needs usable place anchors.`);
  assert(scene.pins.length === 0, `${countySlug} generated scene must not expose pins.`);
  assert(scene.actors.length === 0, `${countySlug} generated scene must not expose actors.`);

  const windows = ["desktop", "mobile"].map((cameraId) => {
    const window = core.compileCityWorldSceneWindow(scene, cameraId);
    const budget = core.evaluateCityWorldSceneWindowBudget(window, "generated_draft_window", scene);
    assert(budget.passed === true, `${countySlug} ${cameraId} generated draft window failed: ${budget.blockers.join("; ")}`);
    return {
      cameraId,
      visibleCommandCount: window.metrics.visibleCommandCount,
      visibleBudgetWeight: window.metrics.visibleBudgetWeight,
      chunkCoverageRatio: window.metrics.chunkCoverageRatio,
    };
  });

  return {
    countySlug,
    geoid: generated.geoid,
    stateCode: generated.stateCode,
    seed: generated.seed,
    archetype: generated.archetype,
    zones: generated.spec.zones.length,
    roads: generated.spec.roadSeeds.length,
    sceneCounts: {
      terrainTiles: scene.terrainTiles.length,
      roads: scene.roadSegments.length,
      lots: scene.lots.length,
      buildings: scene.buildings.length,
      props: scene.props.length,
      places: scene.places.length,
      pins: scene.pins.length,
      actors: scene.actors.length,
    },
    windows,
  };
}

function read(path) {
  checkedFiles.push(path);
  if (!existsSync(resolve(path))) {
    blockers.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(resolve(path), "utf8");
}

function requireToken(source, token, label) {
  if (!source.includes(token)) {
    blockers.push(`${label} missing token: ${token}`);
  }
}

function assert(condition, message) {
  if (!condition) blockers.push(message);
}
