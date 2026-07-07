#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const UPDATE_ID = "postalpha-0.69h-us-county-index-nationwide-shells";
const ARTIFACT_PATH = "artifacts/national-generation/0.69h/nationwide-shells.json";
const EXPECTED_STATE_COUNT = 52;
const EXPECTED_COUNTY_COUNT = 3222;
const EXPECTED_SHELL_COUNT = 3221;
const EXPECTED_PLAYABLE_COUNT = 1;
const SAMPLE_SHELL_COUNTIES = [
  { slug: "cook-il", geoid: "17031", stateCode: "IL", label: "Cook County" },
  { slug: "miami-dade-fl", geoid: "12086", stateCode: "FL", label: "Miami-Dade County" },
  { slug: "maricopa-az", geoid: "04013", stateCode: "AZ", label: "Maricopa County" },
];

const blockers = [];
const warnings = [];
const checkedFiles = [];

const usIndexSource = read("packages/core/src/world/usCountyIndex.ts");
const serviceSource = read("packages/core/src/world/NationalWorldService.ts");
const coreIndexSource = read("packages/core/src/index.ts");
const worldIndexSource = read("packages/core/src/world/index.ts");
const testsSource = read("packages/core/test/national-world-service.test.ts");
const contractTestsSource = read("packages/core/test/national-generation-production.test.ts");
const serverSource = read("server/src/index.ts");
const packageSource = read("package.json");

for (const token of [
  "US_COUNTY_INDEX_SOURCE_YEAR = 2024",
  "US_COUNTY_INDEX_SOURCE_URL",
  "US_COUNTY_INDEX_ROWS",
  "CALIFORNIA_OVERRIDES_BY_GEOID",
  "cook-il",
  "miami-dade-fl",
  "maricopa-az",
]) {
  requireToken(usIndexSource, token, "US county index source");
}

for (const token of ["US_COUNTY_INDEX", "US_STATE_LABEL_BY_CODE", "usCountyIndexSourceNotes"]) {
  requireToken(worldIndexSource, token, "world exports");
  requireToken(coreIndexSource, token, "core exports");
}

for (const token of [
  "US_COUNTY_INDEX",
  "US_STATE_LABEL_BY_CODE",
  "Non-Riverside counties are browse-only shells",
  "stateLabel(stateCode)",
]) {
  requireToken(serviceSource, token, "NationalWorldService");
}

for (const token of [
  "returns national shell counties without Riverside data bleed",
  "US_COUNTY_INDEX).toHaveLength(3222)",
  "P2_DETERMINISTIC_GENERATED_DISTRICTS",
]) {
  requireToken(`${testsSource}\n${contractTestsSource}`, token, "core tests");
}

for (const token of [
  "switch to a US county",
  "browse-only shells for indexed US counties",
  "other indexed US slugs return honest coverage shells",
]) {
  requireToken(serverSource, token, "server tool copy");
}

if (!packageSource.includes("\"verify:national-shells\"")) {
  blockers.push("package.json must expose verify:national-shells.");
}

let runtime = null;
try {
  const core = await import("../packages/core/dist/index.js");
  const service = core.createNationalWorldService([core.riversideDemoVoxelScene]);
  const directory = service.listCoverageDirectory();
  const samples = SAMPLE_SHELL_COUNTIES.map((sample) => ({
    sample,
    county: service.getCounty(sample.slug),
    shellScene: core.compileCountyShellCityWorldScene({
      countySlug: sample.slug,
      countyName: sample.label,
      stateCode: sample.stateCode,
      coverage: {
        countySlug: sample.slug,
        coverageTier: "L1_COUNTY_SHELL",
        coverageLabel: "County shell",
        coverageMessage: `${sample.label} is indexed from Census county identity data, but Atlas has not built a playable local scene for it yet.`,
        playable: false,
      },
    }),
  }));
  const readiness = core.evaluateNationalGenerationProductionReadiness({
    coverageDirectory: directory,
    nationalCountyIndexSource: "census_gazetteer",
    shellSceneCompiler: true,
    deterministicDistrictGenerator: false,
    providerGeometryBlocked: true,
    providerNormalizedLocalAnchors: false,
    rendererWindowing: true,
    desktopMobileProofRequired: true,
  });

  assert(directory.totals.stateCount === EXPECTED_STATE_COUNT, `Expected ${EXPECTED_STATE_COUNT} state/territory codes; got ${directory.totals.stateCount}.`);
  assert(directory.totals.indexedCountyCount === EXPECTED_COUNTY_COUNT, `Expected ${EXPECTED_COUNTY_COUNT} indexed county/equivalent rows; got ${directory.totals.indexedCountyCount}.`);
  assert(directory.totals.shellCountyCount === EXPECTED_SHELL_COUNT, `Expected ${EXPECTED_SHELL_COUNT} shell counties; got ${directory.totals.shellCountyCount}.`);
  assert(directory.totals.playableCountyCount === EXPECTED_PLAYABLE_COUNT, `Expected ${EXPECTED_PLAYABLE_COUNT} playable county; got ${directory.totals.playableCountyCount}.`);
  assert(directory.playableCounties.map((county) => county.countySlug).join(",") === "riverside-ca", "Riverside must remain the only playable county.");

  for (const { sample, county, shellScene } of samples) {
    assert(county.county.countySlug === sample.slug, `${sample.slug} did not round-trip through NationalWorldService.`);
    assert(county.county.geoid === sample.geoid, `${sample.slug} GEOID mismatch: ${county.county.geoid} vs ${sample.geoid}.`);
    assert(county.county.stateCode === sample.stateCode, `${sample.slug} state mismatch: ${county.county.stateCode} vs ${sample.stateCode}.`);
    assert(county.county.coverageTier === "L1_COUNTY_SHELL", `${sample.slug} must be L1_COUNTY_SHELL.`);
    assert(county.county.playableDistrictCount === 0, `${sample.slug} must not expose playable districts.`);
    assert(county.county.placeCount === 0, `${sample.slug} must not expose places.`);
    assert(county.districts.length === 0, `${sample.slug} shell must not invent districts.`);
    assert(shellScene.places.length === 0, `${sample.slug} shell scene must not invent places.`);
    assert(shellScene.buildings.length === 0, `${sample.slug} shell scene must not invent buildings.`);
    assert(shellScene.lots.length === 0, `${sample.slug} shell scene must not invent lots.`);
    assert(shellScene.pins.length === 0, `${sample.slug} shell scene must not invent pins.`);
    assert(shellScene.actors.length === 0, `${sample.slug} shell scene must not invent actors.`);
  }

  assert(readiness.productionReady === false, "Nationwide shells must not evaluate as production-ready.");
  assert(readiness.currentStage === "P2_DETERMINISTIC_GENERATED_DISTRICTS", `Readiness must now block at P2; got ${readiness.currentStage}.`);
  assert(
    readiness.blockers.includes("A production US engine needs a deterministic generated-district compiler for counties without curated packs."),
    "Readiness blockers must name deterministic generated districts as the next production gap.",
  );

  runtime = {
    directoryTotals: directory.totals,
    playableCountySlugs: directory.playableCounties.map((county) => county.countySlug),
    sampleShells: samples.map(({ sample, county, shellScene }) => ({
      slug: sample.slug,
      geoid: county.county.geoid,
      stateCode: county.county.stateCode,
      coverageTier: county.county.coverageTier,
      districtCount: county.districts.length,
      placeCount: county.county.placeCount,
      shellSceneCounts: {
        terrainTiles: shellScene.terrainTiles.length,
        roads: shellScene.roadSegments.length,
        lots: shellScene.lots.length,
        buildings: shellScene.buildings.length,
        places: shellScene.places.length,
        pins: shellScene.pins.length,
        actors: shellScene.actors.length,
      },
    })),
    readiness,
  };
} catch (error) {
  blockers.push(`Could not evaluate built national shell runtime. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
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
