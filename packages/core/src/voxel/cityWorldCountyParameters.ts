import type { CityWorldParametricSpec, CityWorldRoadSeed, CityWorldZoneSpec } from "./cityWorldParametricGenerator.js";
import type { DeterministicGeneratedDistrictInput, GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";
import { REGIONAL_PALETTES, type RegionalPalette } from "./cityWorldRegionalPalettes.js";

export type CensusDivision =
  | "new_england"
  | "middle_atlantic"
  | "east_north_central"
  | "west_north_central"
  | "south_atlantic"
  | "east_south_central"
  | "west_south_central"
  | "mountain"
  | "pacific";

export type LatitudeBand = "tropical" | "subtropical" | "warm_temperate" | "cool_temperate" | "northern" | "arctic";
export type AridityBand = "humid" | "balanced" | "dry" | "arid";

export type NameSignal =
  | "bay"
  | "beach"
  | "cape"
  | "creek"
  | "desert"
  | "falls"
  | "fort"
  | "harbor"
  | "island"
  | "lake"
  | "mesa"
  | "mount"
  | "mountain"
  | "port"
  | "river"
  | "springs"
  | "valley";

export type RegionProfile = {
  division: CensusDivision;
  label: string;
  paletteVariantOffset: 0 | 1 | 2;
  aridityBias: number;
  vegetationBias: number;
  roofPitchBias: number;
  coastalStateBias: boolean;
};

export type CountyGenerationClimate = {
  latitudeBand: LatitudeBand;
  aridity: AridityBand;
  aridityScore: number;
  coastalProximity: "coastal" | "near_coastal" | "inland";
  inlandAridProxy: boolean;
  snowRoofAllowed: boolean;
};

export type CountyGenerationModulation = {
  paletteVariantOffset: 0 | 1 | 2;
  densityScale: number;
  reliefScale: number;
  heightBias: number;
  civicElevationBoost: number;
  dryReliefBoost: number;
  vegetationDensity: number;
  waterAffinity: number;
};

export type CountyGenerationEnvelope = {
  coastalAriditySuppressed: boolean;
  snowRoofSuppressed: boolean;
  forbidsCoastalDesert: boolean;
  forbidsSubtropicalSnowRoof: boolean;
};

export type ArchetypeZoneProfile = {
  civicElevationBoost: number;
  bonusZone: CityWorldZoneSpec;
  bonusRoad: CityWorldRoadSeed;
};

export type ArchetypeProfile = {
  archetype: GeneratedDistrictArchetype;
  palette: RegionalPalette;
  heightGrid: number[][];
  zones: ArchetypeZoneProfile;
  paletteVariantOffsetByAridity?: Partial<Record<AridityBand, 0 | 1 | 2>>;
};

export type GeneratedTreeSpecies = "round_canopy" | "conifer" | "palm";

export type GeneratedRoadArtProfile = {
  roadTone: "metro_asphalt" | "coastal_light" | "desert_pale" | "mountain_gravel" | "prairie_pale" | "river_light";
  arterialWidth: number;
  residentialLaneWidth: number;
  drivewayWidth: number;
  treeSpecies: readonly GeneratedTreeSpecies[];
};

export const GENERATED_ART_PROFILES: Record<GeneratedDistrictArchetype, GeneratedRoadArtProfile> = {
  metro_grid: {
    roadTone: "metro_asphalt",
    arterialWidth: 1.9,
    residentialLaneWidth: 1.18,
    drivewayWidth: 0.66,
    treeSpecies: ["round_canopy", "round_canopy", "palm"],
  },
  coastal_grid: {
    roadTone: "coastal_light",
    arterialWidth: 1.74,
    residentialLaneWidth: 1.06,
    drivewayWidth: 0.62,
    treeSpecies: ["palm", "round_canopy", "palm"],
  },
  desert_basin: {
    roadTone: "desert_pale",
    arterialWidth: 1.62,
    residentialLaneWidth: 0.98,
    drivewayWidth: 0.58,
    treeSpecies: ["palm", "round_canopy"],
  },
  mountain_valley: {
    roadTone: "mountain_gravel",
    arterialWidth: 1.58,
    residentialLaneWidth: 0.94,
    drivewayWidth: 0.56,
    treeSpecies: ["conifer", "conifer", "round_canopy"],
  },
  prairie_town: {
    roadTone: "prairie_pale",
    arterialWidth: 1.54,
    residentialLaneWidth: 0.92,
    drivewayWidth: 0.55,
    treeSpecies: ["round_canopy", "conifer"],
  },
  river_town: {
    roadTone: "river_light",
    arterialWidth: 1.66,
    residentialLaneWidth: 1.02,
    drivewayWidth: 0.6,
    treeSpecies: ["round_canopy", "conifer", "palm"],
  },
};

const GENERATED_DEFAULT_ART_PROFILE: GeneratedRoadArtProfile = {
  roadTone: "river_light",
  arterialWidth: 1.66,
  residentialLaneWidth: 1.02,
  drivewayWidth: 0.6,
  treeSpecies: ["round_canopy"],
};

const GENERATED_ART_ID_TOKENS: ReadonlyArray<readonly [GeneratedDistrictArchetype, readonly string[]]> = [
  ["metro_grid", ["metro"]],
  ["coastal_grid", ["coastal", "water-edge"]],
  ["desert_basin", ["desert"]],
  ["mountain_valley", ["mountain"]],
  ["prairie_town", ["prairie"]],
  ["river_town", ["river"]],
];

const TREE_SPECIES_VARIANT_OFFSET: Record<GeneratedTreeSpecies, number> = {
  round_canopy: 0,
  conifer: 20,
  palm: 40,
};

export function generatedArchetypeForArtId(id: string): GeneratedDistrictArchetype | undefined {
  if (!id.startsWith("gen-")) return undefined;
  const normalized = id.toLowerCase();
  return GENERATED_ART_ID_TOKENS.find(([, tokens]) => tokens.some((token) => normalized.includes(token)))?.[0];
}

export function generatedArtProfileForId(id: string): GeneratedRoadArtProfile | undefined {
  if (!id.startsWith("gen-")) return undefined;
  const archetype = generatedArchetypeForArtId(id);
  return archetype ? GENERATED_ART_PROFILES[archetype] : GENERATED_DEFAULT_ART_PROFILE;
}

export function generatedTreeSpeciesForProp(id: string, kind: "tree" | "bush", variant: number): GeneratedTreeSpecies | undefined {
  if (kind !== "tree") return undefined;
  const profile = generatedArtProfileForId(id);
  if (!profile) return undefined;
  return profile.treeSpecies[positiveModulo(variant, profile.treeSpecies.length)];
}

export function generatedVegetationVariantForProp(id: string, kind: "tree" | "bush", variant: number): number {
  const species = generatedTreeSpeciesForProp(id, kind, variant);
  if (!species) return variant;
  return TREE_SPECIES_VARIANT_OFFSET[species] + positiveModulo(variant, 20);
}

type CountyParameterInput = DeterministicGeneratedDistrictInput["county"];

type ArchetypeSelectionRule = {
  archetype: GeneratedDistrictArchetype;
  states?: readonly string[];
  coordinate?: {
    longitudeLessThan?: number;
    longitudeGreaterThan?: number;
    latitudeLessThan?: number;
    latitudeGreaterThanOrEqual?: number;
  };
  coastalIntent?: true;
  inlandAridProxy?: true;
  excludeCoastalIntent?: true;
  seedModulo?: { divisor: number; remainder: number };
  fallback?: true;
};

export type CountyGenerationParameters = {
  archetype: GeneratedDistrictArchetype;
  archetypeProfile: ArchetypeProfile;
  artProfile: GeneratedRoadArtProfile;
  region: CensusDivision;
  regionProfile: RegionProfile;
  climate: CountyGenerationClimate;
  nameSignal: NameSignal[];
  palette: RegionalPalette;
  seed: number;
  modulation: CountyGenerationModulation;
  envelope: CountyGenerationEnvelope;
};

export const STATE_TO_DIVISION: Record<string, CensusDivision> = {
  CT: "new_england",
  ME: "new_england",
  MA: "new_england",
  NH: "new_england",
  RI: "new_england",
  VT: "new_england",
  NJ: "middle_atlantic",
  NY: "middle_atlantic",
  PA: "middle_atlantic",
  IL: "east_north_central",
  IN: "east_north_central",
  MI: "east_north_central",
  OH: "east_north_central",
  WI: "east_north_central",
  IA: "west_north_central",
  KS: "west_north_central",
  MN: "west_north_central",
  MO: "west_north_central",
  ND: "west_north_central",
  NE: "west_north_central",
  SD: "west_north_central",
  DE: "south_atlantic",
  DC: "south_atlantic",
  FL: "south_atlantic",
  GA: "south_atlantic",
  MD: "south_atlantic",
  NC: "south_atlantic",
  PR: "south_atlantic",
  SC: "south_atlantic",
  VA: "south_atlantic",
  WV: "south_atlantic",
  AL: "east_south_central",
  KY: "east_south_central",
  MS: "east_south_central",
  TN: "east_south_central",
  AR: "west_south_central",
  LA: "west_south_central",
  OK: "west_south_central",
  TX: "west_south_central",
  AZ: "mountain",
  CO: "mountain",
  ID: "mountain",
  MT: "mountain",
  NM: "mountain",
  NV: "mountain",
  UT: "mountain",
  WY: "mountain",
  AK: "pacific",
  CA: "pacific",
  HI: "pacific",
  OR: "pacific",
  WA: "pacific",
};

export const REGION_PROFILES: Record<CensusDivision, RegionProfile> = {
  new_england: {
    division: "new_england",
    label: "New England",
    paletteVariantOffset: 1,
    aridityBias: -0.24,
    vegetationBias: 0.22,
    roofPitchBias: 0.18,
    coastalStateBias: true,
  },
  middle_atlantic: {
    division: "middle_atlantic",
    label: "Middle Atlantic",
    paletteVariantOffset: 2,
    aridityBias: -0.16,
    vegetationBias: 0.14,
    roofPitchBias: 0.1,
    coastalStateBias: true,
  },
  east_north_central: {
    division: "east_north_central",
    label: "East North Central",
    paletteVariantOffset: 0,
    aridityBias: -0.1,
    vegetationBias: 0.12,
    roofPitchBias: 0.08,
    coastalStateBias: false,
  },
  west_north_central: {
    division: "west_north_central",
    label: "West North Central",
    paletteVariantOffset: 1,
    aridityBias: 0.04,
    vegetationBias: 0.02,
    roofPitchBias: 0.04,
    coastalStateBias: false,
  },
  south_atlantic: {
    division: "south_atlantic",
    label: "South Atlantic",
    paletteVariantOffset: 2,
    aridityBias: -0.02,
    vegetationBias: 0.08,
    roofPitchBias: -0.08,
    coastalStateBias: true,
  },
  east_south_central: {
    division: "east_south_central",
    label: "East South Central",
    paletteVariantOffset: 0,
    aridityBias: 0.02,
    vegetationBias: 0.08,
    roofPitchBias: -0.04,
    coastalStateBias: false,
  },
  west_south_central: {
    division: "west_south_central",
    label: "West South Central",
    paletteVariantOffset: 1,
    aridityBias: 0.14,
    vegetationBias: -0.04,
    roofPitchBias: -0.08,
    coastalStateBias: true,
  },
  mountain: {
    division: "mountain",
    label: "Mountain",
    paletteVariantOffset: 2,
    aridityBias: 0.24,
    vegetationBias: -0.12,
    roofPitchBias: 0.16,
    coastalStateBias: false,
  },
  pacific: {
    division: "pacific",
    label: "Pacific",
    paletteVariantOffset: 0,
    aridityBias: 0.04,
    vegetationBias: 0.1,
    roofPitchBias: 0.02,
    coastalStateBias: true,
  },
};

export const NAME_SIGNAL_TOKENS: Record<NameSignal, readonly string[]> = {
  bay: ["bay"],
  beach: ["beach", "shore"],
  cape: ["cape"],
  creek: ["creek"],
  desert: ["desert", "dunes"],
  falls: ["falls"],
  fort: ["fort", "ft"],
  harbor: ["harbor", "harbour"],
  island: ["island", "isle"],
  lake: ["lake", "lakes"],
  mesa: ["mesa"],
  mount: ["mount", "mt"],
  mountain: ["mountain", "mountains"],
  port: ["port"],
  river: ["river", "rivers", "rio"],
  springs: ["spring", "springs"],
  valley: ["valley"],
};

const COASTAL_INTENT_STATES = ["CA", "FL", "HI", "LA", "ME", "MA", "MD", "NJ", "NY", "OR", "RI", "SC", "VA", "WA"] as const;
const WATER_DEPENDENT_ARCHETYPES = ["coastal_grid", "river_town"] as const;

export function isWaterDependentGeneratedDistrictArchetype(archetype: GeneratedDistrictArchetype): boolean {
  return (WATER_DEPENDENT_ARCHETYPES as readonly GeneratedDistrictArchetype[]).includes(archetype);
}

const ARCHETYPE_SELECTION_RULES: readonly ArchetypeSelectionRule[] = [
  {
    archetype: "coastal_grid",
    coastalIntent: true,
  },
  {
    archetype: "desert_basin",
    states: ["AZ", "NM", "NV"],
  },
  {
    archetype: "desert_basin",
    inlandAridProxy: true,
  },
  {
    archetype: "desert_basin",
    coordinate: { longitudeLessThan: -108, latitudeLessThan: 38 },
    excludeCoastalIntent: true,
  },
  {
    archetype: "coastal_grid",
    coordinate: { longitudeLessThan: -122 },
  },
  {
    archetype: "coastal_grid",
    coordinate: { longitudeGreaterThan: -72 },
  },
  {
    archetype: "mountain_valley",
    states: ["CO", "ID", "MT", "UT", "WY", "WV", "VT"],
    coordinate: { longitudeLessThan: -104, latitudeGreaterThanOrEqual: 38 },
  },
  {
    archetype: "prairie_town",
    states: ["IA", "KS", "MO", "ND", "NE", "OK", "SD"],
  },
  {
    archetype: "river_town",
    seedModulo: { divisor: 7, remainder: 0 },
  },
  {
    archetype: "metro_grid",
    fallback: true,
  },
];

export const ARCHETYPE_PROFILES: Record<GeneratedDistrictArchetype, ArchetypeProfile> = {
  metro_grid: {
    archetype: "metro_grid",
    palette: REGIONAL_PALETTES.metro_grid,
    zones: {
      civicElevationBoost: 0.18,
      bonusZone: { id: "east-commons", kind: "commercial", rect: { minX: 35, minY: 21, maxX: 41, maxY: 29 }, label: "East commons", density: 0.58 },
      bonusRoad: { id: "gen-road-metro-service-loop", kind: "driveway", from: { x: 15, y: 21 }, to: { x: 24, y: 21 } },
    },
    heightGrid: [
      [0.18, 0.24, 0.26, 0.24, 0.2, 0.18],
      [0.2, 0.28, 0.32, 0.3, 0.24, 0.2],
      [0.22, 0.3, 0.34, 0.32, 0.26, 0.22],
      [0.18, 0.24, 0.28, 0.26, 0.22, 0.18],
    ],
  },
  coastal_grid: {
    archetype: "coastal_grid",
    palette: REGIONAL_PALETTES.coastal_grid,
    zones: {
      civicElevationBoost: 0.18,
      bonusZone: { id: "water-edge", kind: "water", rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 }, label: "Coastal edge" },
      bonusRoad: { id: "gen-road-coastal-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } },
    },
    heightGrid: [
      [0.28, 0.3, 0.3, 0.24, 0.14, 0.06],
      [0.3, 0.34, 0.32, 0.24, 0.12, 0.04],
      [0.26, 0.3, 0.28, 0.2, 0.1, 0.02],
      [0.22, 0.24, 0.22, 0.16, 0.08, 0],
    ],
  },
  desert_basin: {
    archetype: "desert_basin",
    palette: REGIONAL_PALETTES.desert_basin,
    paletteVariantOffsetByAridity: { arid: 1 },
    zones: {
      civicElevationBoost: 0.18,
      bonusZone: { id: "desert-plaza", kind: "plaza", rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 }, label: "Dry plaza" },
      bonusRoad: { id: "gen-road-desert-service-loop", kind: "driveway", from: { x: 15, y: 21 }, to: { x: 24, y: 21 } },
    },
    heightGrid: [
      [0.44, 0.34, 0.26, 0.24, 0.3, 0.42],
      [0.38, 0.26, 0.18, 0.16, 0.24, 0.36],
      [0.34, 0.22, 0.14, 0.12, 0.2, 0.32],
      [0.42, 0.3, 0.22, 0.2, 0.28, 0.4],
    ],
  },
  mountain_valley: {
    archetype: "mountain_valley",
    palette: REGIONAL_PALETTES.mountain_valley,
    paletteVariantOffsetByAridity: { humid: 0, balanced: 0, dry: 0, arid: 0 },
    zones: {
      civicElevationBoost: 0.35,
      bonusZone: { id: "ridge-commons", kind: "park", rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 }, label: "Ridge commons", elevationBoost: 0.25 },
      bonusRoad: { id: "gen-road-mountain-service-loop", kind: "driveway", from: { x: 15, y: 21 }, to: { x: 24, y: 21 } },
    },
    heightGrid: [
      [0.76, 0.58, 0.36, 0.32, 0.5, 0.72],
      [0.68, 0.48, 0.28, 0.24, 0.42, 0.66],
      [0.62, 0.42, 0.24, 0.22, 0.38, 0.6],
      [0.72, 0.54, 0.34, 0.32, 0.48, 0.7],
    ],
  },
  prairie_town: {
    archetype: "prairie_town",
    palette: REGIONAL_PALETTES.prairie_town,
    zones: {
      civicElevationBoost: 0.18,
      bonusZone: { id: "east-commons", kind: "commercial", rect: { minX: 35, minY: 21, maxX: 41, maxY: 29 }, label: "East commons", density: 0.58 },
      bonusRoad: { id: "gen-road-prairie-grid-north", kind: "street", from: { x: 4, y: 8 }, to: { x: 38, y: 8 } },
    },
    heightGrid: [
      [0.12, 0.14, 0.16, 0.16, 0.14, 0.12],
      [0.14, 0.16, 0.18, 0.18, 0.16, 0.14],
      [0.12, 0.15, 0.17, 0.17, 0.15, 0.12],
      [0.1, 0.12, 0.14, 0.14, 0.12, 0.1],
    ],
  },
  river_town: {
    archetype: "river_town",
    palette: REGIONAL_PALETTES.river_town,
    zones: {
      civicElevationBoost: 0.18,
      bonusZone: { id: "water-edge", kind: "water", rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 }, label: "River edge" },
      bonusRoad: { id: "gen-road-river-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } },
    },
    heightGrid: [
      [0.32, 0.3, 0.26, 0.2, 0.14, 0.1],
      [0.34, 0.32, 0.28, 0.2, 0.12, 0.06],
      [0.3, 0.28, 0.24, 0.18, 0.1, 0.04],
      [0.28, 0.24, 0.22, 0.16, 0.08, 0.02],
    ],
  },
};

export function resolveCountyParameters(county: CountyParameterInput, seed: number): CountyGenerationParameters {
  const stateCode = county.stateCode.toUpperCase();
  const region = STATE_TO_DIVISION[stateCode] ?? "south_atlantic";
  const regionProfile = REGION_PROFILES[region];
  const nameSignal = resolveNameSignals(county.name);
  const climate = resolveClimate(county, regionProfile, nameSignal);
  const archetype = resolveArchetype(county, seed, climate);
  const archetypeProfile = ARCHETYPE_PROFILES[archetype];
  const modulation = resolveModulation(archetypeProfile, regionProfile, climate, nameSignal, seed);
  const palette = resolveCountyPalette(archetypeProfile.palette, modulation.paletteVariantOffset);

  return {
    archetype,
    archetypeProfile,
    artProfile: GENERATED_ART_PROFILES[archetype],
    region,
    regionProfile,
    climate,
    nameSignal,
    palette,
    seed,
    modulation,
    envelope: {
      coastalAriditySuppressed: climate.coastalProximity !== "inland" && !climate.inlandAridProxy,
      snowRoofSuppressed: !climate.snowRoofAllowed,
      forbidsCoastalDesert: true,
      forbidsSubtropicalSnowRoof: true,
    },
  };
}

function resolveArchetype(county: CountyParameterInput, seed: number, climate: CountyGenerationClimate): GeneratedDistrictArchetype {
  const stateCode = county.stateCode.toUpperCase();
  const longitude = county.centroid?.longitude;
  const latitude = county.centroid?.latitude;
  const coastalIntent = hasCoastalIntent(stateCode, climate);
  for (const rule of ARCHETYPE_SELECTION_RULES) {
    if (rule.fallback) return supportedArchetype(rule.archetype, climate) ?? rule.archetype;
    if (rule.excludeCoastalIntent && coastalIntent) continue;
    if (rule.coastalIntent && coastalIntent) return supportedArchetype(rule.archetype, climate) ?? "metro_grid";
    if (rule.inlandAridProxy && climate.inlandAridProxy) return supportedArchetype(rule.archetype, climate) ?? "metro_grid";
    if (rule.states?.includes(stateCode)) return supportedArchetype(rule.archetype, climate) ?? "metro_grid";
    if (rule.coordinate && longitude !== undefined && latitude !== undefined && coordinateMatches(rule.coordinate, longitude, latitude)) {
      return supportedArchetype(rule.archetype, climate) ?? "metro_grid";
    }
    if (rule.seedModulo && seed % rule.seedModulo.divisor === rule.seedModulo.remainder) {
      const archetype = supportedArchetype(rule.archetype, climate);
      if (archetype) return archetype;
    }
  }
  return "metro_grid";
}

function supportedArchetype(
  archetype: GeneratedDistrictArchetype,
  climate: CountyGenerationClimate,
): GeneratedDistrictArchetype | null {
  if (!isWaterDependentGeneratedDistrictArchetype(archetype)) return archetype;
  if (climate.aridity !== "arid") return archetype;
  return "desert_basin";
}

function hasCoastalIntent(stateCode: string, climate: CountyGenerationClimate): boolean {
  if (!(COASTAL_INTENT_STATES as readonly string[]).includes(stateCode)) return false;
  if (stateCode === "CA") return !climate.inlandAridProxy;
  return true;
}

function coordinateMatches(
  rule: NonNullable<ArchetypeSelectionRule["coordinate"]>,
  longitude: number,
  latitude: number,
): boolean {
  if (rule.longitudeLessThan !== undefined && !(longitude < rule.longitudeLessThan)) return false;
  if (rule.longitudeGreaterThan !== undefined && !(longitude > rule.longitudeGreaterThan)) return false;
  if (rule.latitudeLessThan !== undefined && !(latitude < rule.latitudeLessThan)) return false;
  if (rule.latitudeGreaterThanOrEqual !== undefined && !(latitude >= rule.latitudeGreaterThanOrEqual)) return false;
  return true;
}

function resolveClimate(
  county: CountyParameterInput,
  regionProfile: RegionProfile,
  nameSignal: readonly NameSignal[],
): CountyGenerationClimate {
  const latitude = county.centroid?.latitude ?? 39;
  const longitude = county.centroid?.longitude ?? -98;
  const stateCode = county.stateCode.toUpperCase();
  const latitudeBand = resolveLatitudeBand(latitude);
  const inlandAridProxy = isCaliforniaInlandAridProxy(stateCode, latitude, longitude);
  const coastalProximity = resolveCoastalProximity(stateCode, latitude, longitude, inlandAridProxy);
  const waterSignal = waterNameSignalWeight(nameSignal);
  let aridityScore = clamp01(
    0.42 +
      regionProfile.aridityBias +
      (longitude < -100 ? 0.1 : 0) +
      (longitude < -108 && latitude < 38 ? 0.18 : 0) +
      (latitude < 34 ? 0.06 : 0) +
      (nameSignal.some((signal) => signal === "desert" || signal === "mesa") ? 0.08 : 0) -
      waterSignal * 0.12,
  );
  if (inlandAridProxy) aridityScore = Math.max(aridityScore, 0.74);
  if (coastalProximity !== "inland" && !inlandAridProxy) aridityScore = Math.min(aridityScore, 0.5);
  const aridity = aridityBand(aridityScore);
  const snowRoofAllowed =
    (latitudeBand === "cool_temperate" || latitudeBand === "northern" || latitudeBand === "arctic") && aridity !== "arid";
  return {
    latitudeBand,
    aridity,
    aridityScore,
    coastalProximity,
    inlandAridProxy,
    snowRoofAllowed,
  };
}

function resolveLatitudeBand(latitude: number): LatitudeBand {
  if (latitude < 24) return "tropical";
  if (latitude < 34) return "subtropical";
  if (latitude < 39) return "warm_temperate";
  if (latitude < 45) return "cool_temperate";
  if (latitude < 58) return "northern";
  return "arctic";
}

function resolveCoastalProximity(
  stateCode: string,
  latitude: number,
  longitude: number,
  inlandAridProxy: boolean,
): CountyGenerationClimate["coastalProximity"] {
  if (stateCode === "CA") {
    if (inlandAridProxy) return "inland";
    return californiaCoastDistanceDegrees(latitude, longitude) <= 0.85 ? "coastal" : "near_coastal";
  }
  if ((COASTAL_INTENT_STATES as readonly string[]).includes(stateCode)) {
    return "near_coastal";
  }
  if (longitude < -122 || longitude > -72) return "near_coastal";
  return "inland";
}

function isCaliforniaInlandAridProxy(stateCode: string, latitude: number, longitude: number): boolean {
  if (stateCode !== "CA") return false;
  if (californiaCoastDistanceDegrees(latitude, longitude) <= 1.15) return false;
  return latitude < 37.1 && (longitude > -117.8 || (latitude < 36 && longitude > -118.9));
}

function californiaCoastDistanceDegrees(latitude: number, longitude: number): number {
  const coastLongitude = californiaCoastLongitudeAtLatitude(latitude);
  return Math.abs(longitude - coastLongitude);
}

function californiaCoastLongitudeAtLatitude(latitude: number): number {
  const anchors = [
    { latitude: 32.5, longitude: -117.1 },
    { latitude: 34, longitude: -118.4 },
    { latitude: 35, longitude: -120 },
    { latitude: 36, longitude: -121.3 },
    { latitude: 38, longitude: -122.7 },
    { latitude: 40.5, longitude: -124 },
    { latitude: 42, longitude: -124.2 },
  ] as const;
  if (latitude <= anchors[0].latitude) return anchors[0].longitude;
  for (let index = 0; index < anchors.length - 1; index += 1) {
    const first = anchors[index]!;
    const second = anchors[index + 1]!;
    if (latitude <= second.latitude) {
      const ratio = (latitude - first.latitude) / (second.latitude - first.latitude);
      return first.longitude + (second.longitude - first.longitude) * ratio;
    }
  }
  return anchors[anchors.length - 1]!.longitude;
}

function aridityBand(score: number): AridityBand {
  if (score >= 0.68) return "arid";
  if (score >= 0.54) return "dry";
  if (score >= 0.36) return "balanced";
  return "humid";
}

function resolveNameSignals(name: string): NameSignal[] {
  const normalized = ` ${name.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  return (Object.entries(NAME_SIGNAL_TOKENS) as Array<[NameSignal, readonly string[]]>)
    .filter(([, tokens]) => tokens.some((token) => normalized.includes(` ${token} `)))
    .map(([signal]) => signal);
}

function waterNameSignalWeight(signals: readonly NameSignal[]): number {
  return signals.some((signal) => ["bay", "beach", "creek", "falls", "harbor", "island", "lake", "port", "river"].includes(signal))
    ? 1
    : 0;
}

function resolveModulation(
  archetypeProfile: ArchetypeProfile,
  regionProfile: RegionProfile,
  climate: CountyGenerationClimate,
  nameSignal: readonly NameSignal[],
  seed: number,
): CountyGenerationModulation {
  const aridityLift = climate.aridity === "arid" ? 0.1 : climate.aridity === "dry" ? 0.05 : climate.aridity === "humid" ? -0.03 : 0;
  const seedMicroVariation = (((seed >>> 5) % 5) - 2) * 0.001;
  const waterAffinity = clamp01(
    waterNameSignalWeight(nameSignal) +
      (climate.coastalProximity === "coastal" ? 0.45 : climate.coastalProximity === "near_coastal" ? 0.25 : 0) -
      (climate.aridity === "arid" ? 0.55 : 0),
  );
  const dryReliefBoost = climate.aridity === "arid" || nameSignal.includes("mesa") || nameSignal.includes("desert") ? 0.035 : 0;
  const computedPaletteVariantOffset = ((regionProfile.paletteVariantOffset +
    (climate.aridity === "arid" ? 2 : 0) +
    (waterAffinity >= 0.75 ? 1 : 0)) %
    3) as 0 | 1 | 2;
  const paletteVariantOffset = archetypeProfile.paletteVariantOffsetByAridity?.[climate.aridity] ?? computedPaletteVariantOffset;

  return {
    paletteVariantOffset,
    densityScale: roundModulator(clamp(1 + regionProfile.vegetationBias * 0.16 - aridityLift + waterAffinity * 0.025 + seedMicroVariation, 0.94, 1.06)),
    reliefScale: roundModulator(
      clamp(
        1 +
          (archetypeProfile.archetype === "mountain_valley" ? 0.04 : 0) +
          (climate.aridity === "arid" ? 0.08 : climate.aridity === "dry" ? 0.04 : 0) +
          (nameSignal.includes("falls") ? 0.045 : 0) +
          (nameSignal.includes("mesa") ? 0.05 : 0) -
          waterAffinity * 0.025,
        0.94,
        1.12,
      ),
    ),
    heightBias: roundModulator(clamp(aridityLift * 0.08 + (nameSignal.includes("valley") ? -0.015 : 0), -0.025, 0.035)),
    civicElevationBoost: roundModulator(
      clamp(archetypeProfile.zones.civicElevationBoost + regionProfile.roofPitchBias * 0.08 + (climate.snowRoofAllowed ? 0.01 : 0), 0.14, 0.4),
    ),
    dryReliefBoost,
    vegetationDensity: roundModulator(clamp01(0.5 + regionProfile.vegetationBias - aridityLift + waterAffinity * 0.08)),
    waterAffinity,
  };
}

function resolveCountyPalette(base: RegionalPalette, paletteVariantOffset: 0 | 1 | 2): RegionalPalette {
  if (paletteVariantOffset === 0) return base;
  return { ...base, variantOffset: paletteVariantOffset };
}

function roundModulator(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
