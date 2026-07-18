import type { CityWorldCoverage } from "./cityWorldTypes.js";
import { COUNTY_TOWN_ANCHOR_UPDATE_ID, type CountyTownAnchor } from "../world/countyTownAnchors.js";
import { generateParametricCityWorldScene, type CityWorldParametricSpec } from "./cityWorldParametricGenerator.js";
import {
  generatedHeightGrid,
  generatedRoadSeeds,
  generatedZones,
  selectGeneratedDistrictArchetype,
} from "./cityWorldGeneratedDistrictArchetypes.js";
import { resolveCountyParameters } from "./cityWorldCountyParameters.js";
import { deterministicGeneratedDistrictSeedForCounty } from "./cityWorldGeneratedDistrictSeed.js";
import {
  DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
  type DeterministicGeneratedDistrictInput,
  type DeterministicGeneratedDistrictSceneResult,
  type DeterministicGeneratedDistrictSpec,
} from "./cityWorldGeneratedDistrictTypes.js";

export {
  DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
  type DeterministicGeneratedDistrictInput,
  type DeterministicGeneratedDistrictSceneResult,
  type DeterministicGeneratedDistrictSpec,
  type GeneratedDistrictArchetype,
} from "./cityWorldGeneratedDistrictTypes.js";
export { deterministicGeneratedDistrictSeedForCounty } from "./cityWorldGeneratedDistrictSeed.js";
export { selectGeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictArchetypes.js";
export { resolveCountyParameters } from "./cityWorldCountyParameters.js";

export function createDeterministicGeneratedDistrictSpec(
  input: DeterministicGeneratedDistrictInput,
): DeterministicGeneratedDistrictSpec {
  const districtSlug = normalizeDistrictSlug(input.districtSlug ?? `${input.county.countySlug}-generated-district`);
  const districtLabel = input.districtLabel ?? `${input.county.name} Generated District`;
  const seed = deterministicGeneratedDistrictSeedForCounty(input);
  const parameters = resolveCountyParameters(input.county, seed);
  const townAnchors = normalizeTownAnchors(input.townAnchors);
  const archetype = parameters.archetype;
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
    heightGrid: generatedHeightGrid(parameters, seed),
    zones: generatedZones(parameters, seed),
    roadSeeds: generatedRoadSeeds(parameters, seed),
    regionalPalette: parameters.palette,
    countyParameters: parameters,
    ...(townAnchors.length > 0 ? { townAnchors } : {}),
    seed,
  };

  return {
    type: "deterministicGeneratedDistrictSpec",
    update: DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
    sourceBasis: townAnchors.length > 0 ? "census_identity_and_town_anchors" : "census_identity_only",
    ...(townAnchors.length > 0
      ? { townAnchorUpdate: COUNTY_TOWN_ANCHOR_UPDATE_ID, townAnchors }
      : {}),
    providerGeometry: false,
    publicPlayable: false,
    promotionBlocked: true,
    promotionBlockers: [
      ...(townAnchors.length > 0
        ? ["Census town anchors do not prove street, business, or building coverage"]
        : ["real local anchors are not attached"]),
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
  input: DeterministicGeneratedDistrictInput | DeterministicGeneratedDistrictSpec,
): DeterministicGeneratedDistrictSceneResult {
  const generated = isDeterministicGeneratedDistrictSpec(input) ? input : createDeterministicGeneratedDistrictSpec(input);
  const result = generateParametricCityWorldScene(generated.spec);
  const coverage: CityWorldCoverage = {
    countySlug: generated.countySlug,
    coverageTier: "L1_COUNTY_SHELL",
    coverageLabel: "Generated draft",
    coverageMessage:
      generated.townAnchors && generated.townAnchors.length > 0
        ? "Real Census town names on a generated preview layout. Not public playable coverage."
        : "Provider-free generated district draft. Not public playable coverage.",
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

function normalizeTownAnchors(anchors: CountyTownAnchor[] | undefined): CountyTownAnchor[] {
  if (!anchors) return [];
  const seen = new Set<string>();
  return anchors
    .filter(
      (anchor) =>
        Boolean(anchor.censusPlaceGeoid && anchor.label.trim()) &&
        Number.isFinite(anchor.latitude) &&
        Number.isFinite(anchor.longitude),
    )
    .filter((anchor) => {
      if (seen.has(anchor.censusPlaceGeoid)) return false;
      seen.add(anchor.censusPlaceGeoid);
      return true;
    })
    .slice(0, 6)
    .map((anchor) => ({ ...anchor, label: anchor.label.trim() }));
}

function isDeterministicGeneratedDistrictSpec(
  input: DeterministicGeneratedDistrictInput | DeterministicGeneratedDistrictSpec,
): input is DeterministicGeneratedDistrictSpec {
  return "type" in input && input.type === "deterministicGeneratedDistrictSpec";
}

function normalizeDistrictSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "generated-district";
}
