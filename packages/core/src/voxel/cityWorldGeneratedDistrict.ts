import type { CityWorldCoverage } from "./cityWorldTypes.js";
import { generateParametricCityWorldScene, type CityWorldParametricSpec } from "./cityWorldParametricGenerator.js";
import {
  generatedHeightGrid,
  generatedRoadSeeds,
  generatedZones,
  selectGeneratedDistrictArchetype,
} from "./cityWorldGeneratedDistrictArchetypes.js";
import { deterministicGeneratedDistrictSeedForCounty } from "./cityWorldGeneratedDistrictSeed.js";
import {
  DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
  type DeterministicGeneratedDistrictInput,
  type DeterministicGeneratedDistrictSceneResult,
  type DeterministicGeneratedDistrictSpec,
} from "./cityWorldGeneratedDistrictTypes.js";
import { REGIONAL_PALETTES } from "./cityWorldRegionalPalettes.js";

export {
  DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
  type DeterministicGeneratedDistrictInput,
  type DeterministicGeneratedDistrictSceneResult,
  type DeterministicGeneratedDistrictSpec,
  type GeneratedDistrictArchetype,
} from "./cityWorldGeneratedDistrictTypes.js";
export { deterministicGeneratedDistrictSeedForCounty } from "./cityWorldGeneratedDistrictSeed.js";
export { selectGeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictArchetypes.js";

export function createDeterministicGeneratedDistrictSpec(
  input: DeterministicGeneratedDistrictInput,
): DeterministicGeneratedDistrictSpec {
  const districtSlug = normalizeDistrictSlug(input.districtSlug ?? `${input.county.countySlug}-generated-district`);
  const districtLabel = input.districtLabel ?? `${input.county.name} Generated District`;
  const seed = deterministicGeneratedDistrictSeedForCounty(input);
  const archetype = selectGeneratedDistrictArchetype(input.county, seed);
  const spec: CityWorldParametricSpec = {
    id: `generated-${districtSlug}`,
    label: districtLabel,
    region: {
      country: "United States",
      state: input.county.stateCode,
      county: input.county.name,
      district: districtLabel,
    },
    size: { width: 44, height: 32 },
    heightGrid: generatedHeightGrid(archetype, seed),
    zones: generatedZones(archetype, seed),
    roadSeeds: generatedRoadSeeds(archetype, seed),
    regionalPalette: REGIONAL_PALETTES[archetype],
    seed,
  };

  return {
    type: "deterministicGeneratedDistrictSpec",
    update: DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
    sourceBasis: "census_identity_only",
    providerGeometry: false,
    publicPlayable: false,
    promotionBlocked: true,
    promotionBlockers: [
      "provider-normalized local anchors are not approved",
      "desktop and 390x844 public-quality screenshots are not accepted",
      "owner acceptance is not recorded",
    ],
    countySlug: input.county.countySlug,
    stateCode: input.county.stateCode,
    geoid: input.county.geoid,
    districtSlug,
    districtLabel,
    seed,
    archetype,
    spec,
  };
}

export function createDeterministicGeneratedDistrictScene(
  input: DeterministicGeneratedDistrictInput,
): DeterministicGeneratedDistrictSceneResult {
  const generated = createDeterministicGeneratedDistrictSpec(input);
  const result = generateParametricCityWorldScene(generated.spec);
  const coverage: CityWorldCoverage = {
    countySlug: generated.countySlug,
    coverageTier: "L1_COUNTY_SHELL",
    coverageLabel: "Generated draft",
    coverageMessage: "Provider-free generated district draft. Not public playable coverage.",
    playable: false,
  };

  return {
    generated,
    result: {
      ...result,
      scene: {
        ...result.scene,
        coverage,
      },
    },
  };
}

function normalizeDistrictSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "generated-district";
}
