#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ARTIFACT_PATH = "artifacts/national-generation/0.69h/production-contract.json";

const blockers = [];
const warnings = [];
const checkedFiles = [];

const contract = read("packages/core/src/world/nationalGenerationProduction.ts");
const usIndex = read("packages/core/src/world/usCountyIndex.ts");
const worldIndex = read("packages/core/src/world/index.ts");
const coreIndex = read("packages/core/src/index.ts");
const test = read("packages/core/test/national-generation-production.test.ts");
const doc = read("docs/NATIONAL_ENGINE_PRODUCTION_CONTRACT.md");
const generator = read("packages/core/src/voxel/cityWorldParametricGenerator.ts");
const countyIndexVerifier = read("scripts/verify-county-index-source.mjs");
const server = read("server/src/index.ts");

for (const token of [
  "P0_US_COUNTY_IDENTITY",
  "P1_HONEST_COUNTY_SHELLS",
  "P2_DETERMINISTIC_GENERATED_DISTRICTS",
  "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS",
  "P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES",
  "evaluateNationalGenerationProductionReadiness",
  "MINIMUM_NATIONWIDE_STATE_COUNT = 50",
  "MINIMUM_NATIONWIDE_COUNTY_EQUIVALENTS = 3_000",
]) {
  requireToken(contract, token, "national generation production contract source");
}

for (const token of [
  "NATIONAL_GENERATION_PRODUCTION_STAGES",
  "evaluateNationalGenerationProductionReadiness",
  "US_COUNTY_INDEX",
  "usCountyIndexSourceNotes",
]) {
  requireToken(worldIndex, token, "world index exports");
  requireToken(coreIndex, token, "core index exports");
}

for (const token of [
  "US_COUNTY_INDEX_SOURCE_YEAR = 2024",
  "US_COUNTY_INDEX_ROWS",
  "CALIFORNIA_OVERRIDES_BY_GEOID",
  "cook-il",
  "miami-dade-fl",
  "maricopa-az",
]) {
  requireToken(usIndex, token, "US county index source");
}

for (const token of [
  "US county identity is not nationwide",
  "P2_DETERMINISTIC_GENERATED_DISTRICTS",
  "Provider lookup is not coverage readiness and cannot create renderer geometry.",
]) {
  requireToken(test, token, "national generation production tests");
}

for (const token of [
  "Atlas cannot be called production-ready for \"anywhere in the US\"",
  "P0 - Sourced US County Identity",
  "P1 - Honest County Shells Everywhere",
  "P2 - Deterministic Generated Districts",
  "P3 - Provider-Normalized Local Anchors",
  "P4 - Public-Quality Playable Counties",
  "0.69H US County Index Import / Nationwide Shells",
]) {
  requireToken(doc, token, "national engine production contract doc");
}

for (const token of [
  "generateParametricCityWorldScene",
  "provider-free spec",
  "roadSeeds",
  "zones",
  "withBuildingMetadata",
]) {
  requireToken(generator, token, "parametric generator seam");
}

for (const token of [
  "2024_Gaz_counties_national.zip",
  "COUNTY_GAZETTEER_URL",
  "Expected 57 L1 shell counties and 1 L2 county",
]) {
  requireToken(countyIndexVerifier, token, "county source verifier");
}

if (!server.includes("createNationalWorldService([riversideDemoVoxelScene])")) {
  blockers.push("server must still instantiate the public world service with Riverside as the only playable scene until the national index slice lands.");
}
if (server.includes("all US counties are playable") || server.includes("nationwide playable")) {
  blockers.push("server copy must not claim all US counties are playable.");
}
if (/from\s+["']@atlas\/geo["']/.test(contract) || /GoogleMaps|GeoDataAdapter|provider/i.test(contract.replace(/providerGeometryBlocked/g, ""))) {
  warnings.push("nationalGenerationProduction.ts mentions provider boundaries; verify it did not import provider geometry.");
}

let readiness = null;
try {
  const core = await import("../packages/core/dist/index.js");
  const service = core.createNationalWorldService([core.riversideDemoVoxelScene]);
  readiness = core.evaluateNationalGenerationProductionReadiness({
    coverageDirectory: service.listCoverageDirectory(),
    nationalCountyIndexSource: "census_gazetteer",
    shellSceneCompiler: true,
    deterministicDistrictGenerator: false,
    providerGeometryBlocked: true,
    providerNormalizedLocalAnchors: false,
    rendererWindowing: true,
    desktopMobileProofRequired: true,
  });
  if (readiness.productionReady !== false) {
    blockers.push("nationwide shell coverage must not evaluate as production-ready playable generation.");
  }
  if (readiness.currentStage !== "P2_DETERMINISTIC_GENERATED_DISTRICTS") {
    blockers.push(`current readiness stage must be P2_DETERMINISTIC_GENERATED_DISTRICTS; got ${readiness.currentStage}.`);
  }
  if (readiness.counts.stateCount !== 52 || readiness.counts.indexedCountyCount !== 3222) {
    blockers.push(`current readiness counts must reflect the national Census index (52 state/territory codes, 3222 counties/equivalents); got ${JSON.stringify(readiness.counts)}.`);
  }
} catch (error) {
  blockers.push(`Could not evaluate built national generation readiness. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.69h-us-county-index-nationwide-shells",
  artifactPath: ARTIFACT_PATH,
  checkedFiles,
  readiness,
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
