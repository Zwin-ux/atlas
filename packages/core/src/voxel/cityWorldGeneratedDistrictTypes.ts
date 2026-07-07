import type { NationalCountyIndexEntry } from "../world/types.js";
import type { CityWorldParametricResult, CityWorldParametricSpec } from "./cityWorldParametricGenerator.js";

export const DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID = "postalpha-0.70h-deterministic-generated-district-specs";

export type GeneratedDistrictArchetype =
  | "metro_grid"
  | "coastal_grid"
  | "desert_basin"
  | "mountain_valley"
  | "prairie_town"
  | "river_town";

export type DeterministicGeneratedDistrictInput = {
  county: Pick<NationalCountyIndexEntry, "geoid" | "stateCode" | "name" | "countySlug" | "centroid">;
  districtSlug?: string;
  districtLabel?: string;
  seedSalt?: string;
};

export type DeterministicGeneratedDistrictSpec = {
  type: "deterministicGeneratedDistrictSpec";
  update: typeof DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID;
  sourceBasis: "census_identity_only";
  providerGeometry: false;
  publicPlayable: false;
  promotionBlocked: true;
  promotionBlockers: string[];
  countySlug: string;
  stateCode: string;
  geoid: string;
  districtSlug: string;
  districtLabel: string;
  seed: number;
  archetype: GeneratedDistrictArchetype;
  spec: CityWorldParametricSpec;
};

export type DeterministicGeneratedDistrictSceneResult = {
  generated: DeterministicGeneratedDistrictSpec;
  result: CityWorldParametricResult;
};
