import type { CityWorldParametricSpec, CityWorldRoadSeed, CityWorldZoneKind, CityWorldZoneSpec } from "./cityWorldParametricGenerator.js";
import { unitFromSeed } from "./cityWorldGeneratedDistrictSeed.js";
import type { DeterministicGeneratedDistrictInput, GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";
import {
  ARCHETYPE_PROFILES,
  isWaterDependentGeneratedDistrictArchetype,
  resolveCountyParameters,
  type ArchetypeProfile,
  type CountyGenerationParameters,
  type CountyGenerationModulation,
} from "./cityWorldCountyParameters.js";

export function selectGeneratedDistrictArchetype(
  county: DeterministicGeneratedDistrictInput["county"],
  seed: number,
): GeneratedDistrictArchetype {
  return resolveCountyParameters(county, seed).archetype;
}

export function generatedZones(parameters: GeneratedDistrictArchetype | CountyGenerationParameters, seed: number): CityWorldZoneSpec[] {
  const profile = profileFor(parameters);
  const modulation = modulationFor(parameters);
  const context = layoutContext(profile, modulation, seed, urbanizationTierFor(parameters));
  const bonusZone = cloneZone(bonusZoneFor(parameters, profile.zones.bonusZone), context.densityScale);

  const zones =
    profile.archetype === "metro_grid"
      ? metroGridZones(context, bonusZone)
      : profile.archetype === "desert_basin"
        ? desertBasinZones(context, bonusZone)
        : profile.archetype === "coastal_grid"
          ? coastalGridZones(context, bonusZone)
          : profile.archetype === "mountain_valley"
            ? mountainValleyZones(context, bonusZone)
            : profile.archetype === "prairie_town"
              ? prairieTownZones(context, bonusZone)
              : riverTownZones(context, bonusZone);
  return zonesForUrbanizationTier(zones, context);
}

export function generatedRoadSeeds(parameters: GeneratedDistrictArchetype | CountyGenerationParameters, seed: number): CityWorldRoadSeed[] {
  const profile = profileFor(parameters);
  const modulation = modulationFor(parameters);
  const context = layoutContext(profile, modulation, seed, urbanizationTierFor(parameters));
  const bonusRoad = cloneRoad(bonusRoadFor(parameters, profile.zones.bonusRoad));

  const roads =
    profile.archetype === "metro_grid"
      ? withBonusRoad(metroGridRoads(context), bonusRoad)
      : profile.archetype === "desert_basin"
        ? withBonusRoad(desertBasinRoads(context), bonusRoad)
        : profile.archetype === "coastal_grid"
          ? withBonusRoad(coastalGridRoads(context), bonusRoad)
          : profile.archetype === "mountain_valley"
            ? withBonusRoad(mountainValleyRoads(context), bonusRoad)
            : profile.archetype === "prairie_town"
              ? withBonusRoad(prairieTownRoads(context), bonusRoad)
              : riverTownRoads(context);
  return roadsForUrbanizationTier(roads, context);
}

type LayoutContext = {
  profile: ArchetypeProfile;
  modulation: CountyGenerationModulation | undefined;
  densityScale: number;
  greenGap: number;
  xShift: number;
  yShift: number;
  riverAxis: "horizontal" | "vertical";
  civicElevationBoost: number;
  reliefTerraceBoost: number;
  waterAffinity: number;
  urbanizationTier: CountyGenerationParameters["urbanizationTier"] | "urban_core";
};

function layoutContext(
  profile: ArchetypeProfile,
  modulation: CountyGenerationModulation | undefined,
  seed: number,
  urbanizationTier: LayoutContext["urbanizationTier"],
): LayoutContext {
  const xShift = (seed % 3) - 1;
  const yShift = (Math.floor(seed / 3) % 3) - 1;
  const densityScale = modulation?.densityScale ?? 1;
  const vegetationDensity = modulation?.vegetationDensity ?? 0.5;
  return {
    profile,
    modulation,
    densityScale,
    greenGap: (vegetationDensity - 0.5) * 0.06,
    xShift,
    yShift,
    riverAxis: seed % 2 === 0 ? "horizontal" : "vertical",
    civicElevationBoost: modulation?.civicElevationBoost ?? profile.zones.civicElevationBoost,
    reliefTerraceBoost: ((modulation?.reliefScale ?? 1) - 1) * 0.38,
    waterAffinity: modulation?.waterAffinity ?? 0,
    urbanizationTier,
  };
}

function metroGridZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  const waterBonus = bonusZone.kind === "water";
  const civicRect = waterBonus
    ? { minX: 22 + context.xShift, minY: 10 + context.yShift, maxX: 28 + context.xShift, maxY: 15 + context.yShift }
    : { minX: 18 + context.xShift, minY: 10 + context.yShift, maxX: 24 + context.xShift, maxY: 15 + context.yShift };
  return [
    zone("metro-block-paving-fill", "plaza_paving", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "Metro block paving"),
    ...(waterBonus
      ? [
          zone("metro-coastal-shore-bank-fill", "shore_bank", { minX: 32, minY: 0, maxX: 34, maxY: 32 }, context, undefined, "Metro shore bank"),
          zone("metro-coastal-green-buffer", "green_common", { minX: 28, minY: 15, maxX: 33, maxY: 24 }, context, undefined, "Metro shore green"),
        ]
      : []),
    zone("metro-civic-forecourt-fill", "civic_forecourt", { minX: 15, minY: 9, maxX: 25, maxY: 16 }, context, undefined, "Civic forecourt"),
    zone("metro-east-plaza-fill", "plaza_paving", waterBonus ? { minX: 29, minY: 10, maxX: 33, maxY: 24 } : { minX: 36, minY: 10, maxX: 41, maxY: 24 }, context, undefined, "East plaza paving"),
    zone("metro-pocket-paving-fill", "plaza_paving", waterBonus ? { minX: 14, minY: 10, maxX: 21, maxY: 15 } : { minX: 5, minY: 10, maxX: 13, maxY: 15 }, context, undefined, "Pocket paving"),
    zone("metro-west-block", "residential", waterBonus ? { minX: 14, minY: 4, maxX: 24, maxY: 8 } : { minX: 3, minY: 4, maxX: 12, maxY: 8 }, context, 0.92, "West row blocks"),
    zone("metro-south-rowhomes", "residential", waterBonus ? { minX: 15, minY: 18, maxX: 27, maxY: 28 } : { minX: 3, minY: 18, maxX: 14, maxY: 28 }, context, 0.94, "South rowhomes"),
    zone("metro-civic-core", "civic", civicRect, context, undefined, "Civic tower core", context.civicElevationBoost + 0.05),
    zone("metro-main-street", "commercial", waterBonus ? { minX: 22, minY: 5, maxX: 32, maxY: 8 } : { minX: 15, minY: 5, maxX: 25, maxY: 8 }, context, 0.92, "Tight main street"),
    zone("metro-downtown-strip", "commercial", waterBonus ? { minX: 26, minY: 10, maxX: 33, maxY: 14 } : { minX: 27, minY: 10, maxX: 34, maxY: 14 }, context, 0.9, "Downtown strip"),
    zone("metro-apartment-core", "apartments", waterBonus ? { minX: 21, minY: 17, maxX: 29, maxY: 24 } : { minX: 15, minY: 17, maxX: 25, maxY: 24 }, context, 0.91, "Apartment core"),
    zone("metro-apartment-east", "apartments", waterBonus ? { minX: 29, minY: 17, maxX: 33, maxY: 24 } : { minX: 27, minY: 17, maxX: 34, maxY: 24 }, context, 0.9, "Apartment edge"),
    zone("metro-service-yard", "gym", waterBonus ? { minX: 25, minY: 26, maxX: 32, maxY: 30 } : { minX: 16, minY: 25, maxX: 23, maxY: 29 }, context, undefined, "Service yard"),
    zone("metro-pocket-plaza", "plaza", waterBonus ? { minX: 15, minY: 10, maxX: 21, maxY: 15 } : { minX: 6, minY: 10, maxX: 12, maxY: 15 }, context, undefined, "Pocket plaza"),
    bonusZone,
  ];
}

function desertBasinZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  return [
    zone("desert-basin-wash-fill", "dry_wash", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "Basin dry wash"),
    zone("desert-north-wash-fill", "dry_wash", { minX: 3, minY: 15, maxX: 18, maxY: 21 }, context, undefined, "North dry wash"),
    zone("desert-east-wash-fill", "dry_wash", { minX: 32, minY: 5, maxX: 42, maxY: 13 }, context, undefined, "East dry wash"),
    zone("desert-south-wash-fill", "dry_wash", { minX: 22, minY: 21, maxX: 42, maxY: 30 }, context, undefined, "South dry wash"),
    zone("desert-west-sprawl", "residential", { minX: 3, minY: 5, maxX: 18, maxY: 14 }, context, 0.56, "Low west sprawl"),
    zone("desert-south-sprawl", "residential", { minX: 5, minY: 22, maxX: 21, maxY: 29 }, context, 0.52, "South sprawl"),
    zone("desert-main-frontage", "commercial", { minX: 20, minY: 7, maxX: 33, maxY: 12 }, context, 0.58, "Wide frontage"),
    zone("desert-civic-mesa", "civic", { minX: 21, minY: 15, maxX: 27, maxY: 21 }, context, undefined, "Mesa civic", context.civicElevationBoost + context.reliefTerraceBoost + 0.05),
    zone("desert-service-yard", "gym", { minX: 29, minY: 15, maxX: 37, maxY: 20 }, context, undefined, "Service yard"),
    zone("desert-scrub-plaza", "plaza", { minX: 8, minY: 16, maxX: 17, maxY: 20 }, context, undefined, "Scrub plaza"),
    zone("desert-east-sprawl", "residential", { minX: 23, minY: 23, maxX: 31, maxY: 30 }, context, 0.5, "East sprawl"),
    normalizeBonusZone(bonusZone, { minX: 32, minY: 21, maxX: 42, maxY: 30 }, "Dry plaza"),
  ];
}

function coastalGridZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  return [
    zone("coastal-land-common-fill", "green_common", { minX: 0, minY: 0, maxX: 33, maxY: 32 }, context, undefined, "Coastal commons"),
    zone("coastal-shore-bank-fill", "shore_bank", { minX: 32, minY: 0, maxX: 34, maxY: 32 }, context, undefined, "Beach bank"),
    zone("coastal-common-fill", "green_common", { minX: 21, minY: 15, maxX: 31, maxY: 21 }, context, undefined, "Shore commons"),
    zone("coastal-north-common-fill", "green_common", { minX: 20, minY: 0, maxX: 32, maxY: 4 }, context, undefined, "Dune commons"),
    zone("coastal-back-homes", "residential", { minX: 17, minY: 5, maxX: 31, maxY: 14 }, context, 0.78, "Back-shore homes"),
    zone("coastal-stepback-homes", "residential", { minX: 18, minY: 19, maxX: 32, maxY: 29 }, context, 0.76, "Stepback homes"),
    zone("coastal-civic", "civic", { minX: 23, minY: 8, maxX: 30, maxY: 14 }, context, undefined, "Coastal civic", context.civicElevationBoost),
    zone("coastal-waterfront-strip", "commercial", { minX: 27, minY: 18, maxX: 33, maxY: 27 }, context, 0.9, "Waterfront strip"),
    zone("coastal-main-street", "commercial", { minX: 21, minY: 5, maxX: 33, maxY: 8 }, context, 0.8, "Shore main street"),
    zone("coastal-apartments", "apartments", { minX: 23, minY: 16, maxX: 31, maxY: 26 }, context, 0.76, "Shore apartments"),
    zone("coastal-service", "gym", { minX: 16, minY: 16, maxX: 22, maxY: 21 }, context, undefined, "Marina service"),
    zone("coastal-green", "park", { minX: 24, minY: 15, maxX: 31, maxY: 20 }, context, undefined, "Shore green"),
    normalizeBonusZone(bonusZone, { minX: 34, minY: 0, maxX: 44, maxY: 32 }, context.waterAffinity >= 0.75 ? "Coastal edge" : "Water edge"),
  ];
}

function mountainValleyZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  return [
    zone("mountain-valley-meadow-fill", "meadow", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "Valley meadow floor"),
    zone("mountain-upper-scree-fill", "scree", { minX: 0, minY: 0, maxX: 15, maxY: 4 }, context, undefined, "Upper scree"),
    zone("mountain-ridge-scree-fill", "scree", { minX: 24, minY: 0, maxX: 44, maxY: 16 }, context, undefined, "Ridge scree"),
    zone("mountain-meadow-fill", "meadow", { minX: 25, minY: 19, maxX: 42, maxY: 22 }, context, undefined, "Valley meadow"),
    zone("mountain-lower-meadow-fill", "meadow", { minX: 4, minY: 24, maxX: 14, maxY: 29 }, context, undefined, "Lower meadow"),
    zone("mountain-upper-homes", "residential", { minX: 4, minY: 5, maxX: 14, maxY: 12 }, context, 0.62, "Upper terrace homes"),
    zone("mountain-mid-homes", "residential", { minX: 10, minY: 16, maxX: 23, maxY: 23 }, context, 0.64, "Mid-terrace homes"),
    zone("mountain-lower-homes", "residential", { minX: 25, minY: 23, maxX: 38, maxY: 29 }, context, 0.58, "Valley homes"),
    zone("mountain-ridge-civic", "civic", { minX: 17, minY: 5, maxX: 24, maxY: 11 }, context, undefined, "Ridge civic", context.civicElevationBoost + context.reliefTerraceBoost + 0.08),
    zone("mountain-valley-main", "commercial", { minX: 24, minY: 13, maxX: 36, maxY: 18 }, context, 0.66, "Valley main"),
    zone("mountain-inn-court", "apartments", { minX: 30, minY: 5, maxX: 39, maxY: 12 }, context, 0.58, "Terrace lodge court"),
    zone("mountain-service", "gym", { minX: 15, minY: 24, maxX: 22, maxY: 29 }, context, undefined, "Trail service"),
    normalizeBonusZone(bonusZone, { minX: 33, minY: 20, maxX: 41, maxY: 29 }, "Ridge commons"),
  ];
}

function prairieTownZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  return [
    zone("prairie-northwest-field-fill", "farm_field", { minX: 0, minY: 0, maxX: 21, maxY: 17 }, context, undefined, "Northwest crop rows"),
    zone("prairie-northeast-field-fill", "farm_field", { minX: 23, minY: 0, maxX: 44, maxY: 17 }, context, undefined, "Northeast crop rows"),
    zone("prairie-southwest-field-fill", "farm_field", { minX: 0, minY: 19, maxX: 21, maxY: 32 }, context, undefined, "Southwest crop rows"),
    zone("prairie-southeast-field-fill", "farm_field", { minX: 23, minY: 19, maxX: 44, maxY: 32 }, context, undefined, "Southeast crop rows"),
    zone("prairie-west-grid", "residential", { minX: 4, minY: 5, maxX: 20, maxY: 15 }, context, 0.58, "West town grid"),
    zone("prairie-south-grid", "residential", { minX: 5, minY: 21, maxX: 21, maxY: 29 }, context, 0.54, "South town grid"),
    zone("prairie-main-street", "commercial", { minX: 23, minY: 6, maxX: 35, maxY: 12 }, context, 0.62, "Straight main street"),
    zone("prairie-civic", "civic", { minX: 24, minY: 15, maxX: 30, maxY: 20 }, context, undefined, "Prairie civic", context.civicElevationBoost),
    zone("prairie-service-yard", "gym", { minX: 32, minY: 15, maxX: 40, maxY: 20 }, context, undefined, "Machine shed"),
    zone("prairie-low-court", "apartments", { minX: 23, minY: 23, maxX: 34, maxY: 29 }, context, 0.48, "Low court"),
    zone("prairie-ag-grid", "park", { minX: 35, minY: 22, maxX: 42, maxY: 30 }, context, undefined, "Ag grid"),
    normalizeBonusZone(bonusZone, { minX: 36, minY: 6, maxX: 42, maxY: 13 }, "East commons"),
  ];
}

function riverTownZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  if (context.riverAxis === "vertical") {
    return [
      zone("river-common-fill", "green_common", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "River commons"),
      zone("river-west-bank-fill", "shore_bank", { minX: 19, minY: 0, maxX: 20, maxY: 32 }, context, undefined, "West bank"),
      zone("river-east-bank-fill", "shore_bank", { minX: 26, minY: 0, maxX: 27, maxY: 32 }, context, undefined, "East bank"),
      zone("river-west-common-fill", "green_common", { minX: 4, minY: 16, maxX: 18, maxY: 21 }, context, undefined, "West bank commons"),
      zone("river-west-homes", "residential", { minX: 4, minY: 5, maxX: 15, maxY: 14 }, context, 0.74, "West bank homes"),
      zone("river-south-homes", "residential", { minX: 5, minY: 22, maxX: 17, maxY: 30 }, context, 0.72, "South bank homes"),
      zone("river-ferry-market", "commercial", { minX: 27, minY: 4, maxX: 36, maxY: 9 }, context, 0.86, "Ferry market"),
      zone("river-main-north", "commercial", { minX: 27, minY: 11, maxX: 36, maxY: 16 }, context, 0.86, "River main north"),
      zone("river-main-south", "commercial", { minX: 27, minY: 20, maxX: 36, maxY: 26 }, context, 0.86, "River main south"),
      zone("river-dock-district", "commercial", { minX: 16, minY: 22, maxX: 20, maxY: 30 }, context, 0.82, "Dock district"),
      zone("river-civic", "civic", { minX: 13, minY: 9, maxX: 19, maxY: 15 }, context, undefined, "River civic", context.civicElevationBoost),
      zone("river-apartments", "apartments", { minX: 28, minY: 20, maxX: 36, maxY: 30 }, context, 0.72, "River flats"),
      zone("river-plaza", "plaza", { minX: 9, minY: 16, maxX: 18, maxY: 20 }, context, undefined, "River plaza"),
      normalizeBonusZone(bonusZone, { minX: 21, minY: 0, maxX: 25, maxY: 32 }, "River edge"),
    ];
  }

  return [
    zone("river-common-base-fill", "green_common", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "River commons"),
    zone("river-north-bank-fill", "shore_bank", { minX: 0, minY: 13, maxX: 44, maxY: 14 }, context, undefined, "North bank"),
    zone("river-south-bank-fill", "shore_bank", { minX: 0, minY: 21, maxX: 44, maxY: 22 }, context, undefined, "South bank"),
    zone("river-common-fill", "green_common", { minX: 5, minY: 11, maxX: 21, maxY: 14 }, context, undefined, "River commons"),
    zone("river-west-homes", "residential", { minX: 5, minY: 5, maxX: 18, maxY: 14 }, context, 0.74, "West bank homes"),
    zone("river-south-homes", "residential", { minX: 6, minY: 23, maxX: 21, maxY: 30 }, context, 0.72, "South bank homes"),
    zone("river-ferry-market", "commercial", { minX: 25, minY: 4, maxX: 34, maxY: 9 }, context, 0.86, "Ferry market"),
    zone("river-main-north", "commercial", { minX: 25, minY: 10, maxX: 34, maxY: 13 }, context, 0.86, "River main north"),
    zone("river-main-south", "commercial", { minX: 25, minY: 22, maxX: 34, maxY: 27 }, context, 0.86, "River main south"),
    zone("river-dock-district", "commercial", { minX: 29, minY: 21, maxX: 34, maxY: 24 }, context, 0.82, "Dock district"),
    zone("river-east-market", "commercial", { minX: 36, minY: 22, maxX: 43, maxY: 30 }, context, 1.08, "East bank market"),
    zone("river-civic", "civic", { minX: 13, minY: 8, maxX: 19, maxY: 13 }, context, undefined, "River civic", context.civicElevationBoost),
    zone("river-apartments", "apartments", { minX: 23, minY: 23, maxX: 31, maxY: 30 }, context, 0.72, "River flats"),
    zone("river-plaza", "plaza", { minX: 10, minY: 21, maxX: 19, maxY: 24 }, context, undefined, "River plaza"),
    normalizeBonusZone(bonusZone, { minX: 0, minY: 15, maxX: 44, maxY: 20 }, "River edge"),
  ];
}

function metroGridRoads(context: LayoutContext): CityWorldRoadSeed[] {
  if (context.waterAffinity >= 0.75) {
    return [
      road("gen-road-metro-coastal-north", "avenue", 10, 9 + context.yShift, 33, 9 + context.yShift),
      road("gen-road-metro-coastal-main", "avenue", 10, 16, 33, 16),
      road("gen-road-metro-coastal-south", "street", 10, 25, 33, 25),
      road("gen-road-metro-coastal-west", "street", 18 + context.xShift, 4, 18 + context.xShift, 29),
      road("gen-road-metro-coastal-shore", "street", 33, 5, 33, 29),
      road("gen-cross-metro-coastal-pier", "crosswalk", 31, 16, 36, 16),
    ];
  }
  return [
    road("gen-road-metro-north", "avenue", 3, 9 + context.yShift, 41, 9 + context.yShift),
    road("gen-road-metro-main", "avenue", 3, 16, 41, 16),
    road("gen-road-metro-south", "street", 3, 25, 41, 25),
    road("gen-road-metro-west", "street", 14 + context.xShift, 4, 14 + context.xShift, 29),
    road("gen-road-metro-core", "avenue", 26, 4, 26, 29),
    road("gen-road-metro-east", "street", 35, 5, 35, 29),
    road("gen-cross-metro-core", "crosswalk", 23, 16, 28, 16),
  ];
}

function desertBasinRoads(context: LayoutContext): CityWorldRoadSeed[] {
  return [
    road("gen-road-desert-frontage", "avenue", 3, 14 + context.yShift, 42, 14 + context.yShift),
    road("gen-road-desert-south", "street", 5, 22, 42, 22),
    road("gen-road-desert-arterial", "avenue", 19 + context.xShift, 5, 19 + context.xShift, 29),
    road("gen-road-desert-plaza", "driveway", 31, 26, 42, 26),
    road("gen-cross-desert-civic", "crosswalk", 20, 14 + context.yShift, 25, 14 + context.yShift),
  ];
}

function coastalGridRoads(context: LayoutContext): CityWorldRoadSeed[] {
  const shoreX = 33;
  return [
    road("gen-road-coastal-shoreline", "avenue", shoreX, 5, shoreX, 30),
    road("gen-road-coastal-north", "street", 4, 9 + context.yShift, shoreX, 9 + context.yShift),
    road("gen-road-coastal-mid", "avenue", 5, 16, shoreX, 16),
    road("gen-road-coastal-south", "street", 5, 25, shoreX, 25),
    road("gen-road-coastal-back", "street", 21 + context.xShift, 5, 21 + context.xShift, 29),
    road("gen-cross-coastal-pier", "crosswalk", shoreX - 2, 25, shoreX + 3, 25),
  ];
}

function mountainValleyRoads(context: LayoutContext): CityWorldRoadSeed[] {
  return [
    road("gen-road-mountain-upper-contour", "street", 4, 13 + context.yShift, 24, 13 + context.yShift),
    road("gen-road-mountain-mid-contour", "avenue", 10, 23, 38, 23),
    road("gen-road-mountain-lower-contour", "street", 18, 30, 41, 30),
    road("gen-road-mountain-switchback", "street", 24 + context.xShift, 8, 24 + context.xShift, 27),
    road("gen-road-mountain-ridge", "driveway", 16, 8, 25, 8),
    road("gen-cross-mountain-main", "crosswalk", 22, 20, 26, 20),
  ];
}

function prairieTownRoads(context: LayoutContext): CityWorldRoadSeed[] {
  return [
    road("gen-road-prairie-north", "avenue", 3, 4 + context.yShift, 42, 4 + context.yShift),
    road("gen-road-prairie-main", "avenue", 3, 18, 42, 18),
    road("gen-road-prairie-south", "street", 3, 30, 42, 30),
    road("gen-road-prairie-section", "street", 22 + context.xShift, 4, 22 + context.xShift, 30),
    road("gen-road-prairie-east-section", "street", 36, 4, 36, 30),
    road("gen-cross-prairie-civic", "crosswalk", 22, 18, 27, 18),
  ];
}

function riverTownRoads(context: LayoutContext): CityWorldRoadSeed[] {
  if (context.riverAxis === "vertical") {
    return [
      road("gen-road-river-west-bank", "avenue", 18, 5, 18, 30),
      road("gen-road-river-east-bank", "avenue", 28, 5, 28, 30),
      road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 39, 10 + context.yShift),
      road("gen-road-river-mid-cross", "avenue", 6, 18, 39, 18),
      road("gen-road-river-dock-cross", "street", 6, 26, 39, 26),
      road("gen-cross-river-bridge", "crosswalk", 20, 18, 26, 18),
    ];
  }

  return [
    road("gen-road-river-main", "avenue", 34, 5, 34, 30),
    road("gen-road-river-west", "street", 22 + context.xShift, 5, 22 + context.xShift, 29),
    road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 36, 10 + context.yShift),
    road("gen-road-river-mid-cross", "avenue", 6, 18, 36, 18),
    road("gen-road-river-dock-cross", "street", 6, 31, 37, 31),
    road("gen-cross-river-bridge", "crosswalk", 34, 14, 34, 21),
  ];
}

export function generatedHeightGrid(
  parameters: GeneratedDistrictArchetype | CountyGenerationParameters,
  seed: number,
): NonNullable<CityWorldParametricSpec["heightGrid"]> {
  const profile = profileFor(parameters);
  const modulation = typeof parameters === "string" ? undefined : parameters.modulation;
  const reliefScale = modulation?.reliefScale ?? 1;
  const heightBias = modulation?.heightBias ?? 0;
  return {
    cellSize: 8,
    values: profile.heightGrid.map((row, rowIndex) =>
      row.map((value, columnIndex) =>
        roundUnit(
          clamp01(
            archetypeReliefValue(profile.archetype, value, rowIndex, columnIndex, profile.heightGrid.length, row.length) * reliefScale +
              heightBias +
              edgeReliefBoost(parameters, rowIndex, columnIndex, profile.heightGrid.length, row.length) +
              (unitFromSeed(seed, `h-${rowIndex}-${columnIndex}`) - 0.5) * 0.08,
          ),
        ),
      ),
    ),
  };
}

function roundUnit(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function archetypeReliefValue(
  archetype: GeneratedDistrictArchetype,
  value: number,
  rowIndex: number,
  columnIndex: number,
  rowCount: number,
  columnCount: number,
): number {
  const edgeX = columnIndex === 0 || columnIndex === columnCount - 1;
  const edgeY = rowIndex === 0 || rowIndex === rowCount - 1;
  const corner = edgeX && edgeY;

  if (archetype === "mountain_valley") {
    const ridgeBoost = (edgeX ? 0.12 : 0) + (edgeY ? 0.09 : 0) + (corner ? 0.06 : 0);
    return clamp01((value - 0.22) * 1.55 + 0.18 + ridgeBoost);
  }

  if (archetype === "desert_basin") {
    const rimBoost = (edgeX ? 0.09 : 0) + (edgeY ? 0.07 : 0) + (corner ? 0.1 : 0);
    return clamp01((value - 0.16) * 1.6 + 0.12 + rimBoost);
  }

  if (archetype === "river_town") {
    const bankTerraceBoost = edgeY ? 0.04 : 0;
    return clamp01(value * 1.45 + 0.16 + bankTerraceBoost);
  }

  return value;
}

function profileFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters): ArchetypeProfile {
  return typeof parameters === "string" ? ARCHETYPE_PROFILES[parameters] : parameters.archetypeProfile;
}

function modulationFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters): CountyGenerationModulation | undefined {
  return typeof parameters === "string" ? undefined : parameters.modulation;
}

function urbanizationTierFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters): LayoutContext["urbanizationTier"] {
  return typeof parameters === "string" ? "urban_core" : parameters.urbanizationTier;
}

function zonesForUrbanizationTier(zones: CityWorldZoneSpec[], context: LayoutContext): CityWorldZoneSpec[] {
  if (context.urbanizationTier === "urban_core" || context.urbanizationTier === "suburban" || context.urbanizationTier === "town") return zones;

  const maxResidential = context.urbanizationTier === "frontier" ? 2 : 3;
  const maxCommercial = context.urbanizationTier === "frontier" ? 1 : 2;
  let residential = 0;
  let commercial = 0;

  return zones.filter((zone) => {
    if (zone.kind === "apartments") return false;
    if (context.urbanizationTier === "frontier" && zone.kind === "gym") return false;
    if (zone.kind === "residential") {
      residential += 1;
      return residential <= maxResidential;
    }
    if (zone.kind === "commercial") {
      commercial += 1;
      return commercial <= maxCommercial;
    }
    return true;
  });
}

function roadsForUrbanizationTier(roads: CityWorldRoadSeed[], context: LayoutContext): CityWorldRoadSeed[] {
  if (context.urbanizationTier !== "frontier") return roads;
  return roads.map((roadSeed) =>
    roadSeed.kind === "avenue"
      ? {
          ...roadSeed,
          kind: "street",
        }
      : roadSeed,
  );
}

function zone(
  id: string,
  kind: CityWorldZoneKind,
  rect: CityWorldZoneSpec["rect"],
  context: LayoutContext,
  baseDensity?: number,
  label?: string,
  elevationBoost?: number,
): CityWorldZoneSpec {
  return {
    id,
    kind,
    rect,
    ...(label ? { label } : {}),
    ...(baseDensity !== undefined ? { density: layoutDensity(baseDensity, context) } : {}),
    ...(elevationBoost !== undefined ? { elevationBoost: roundUnit(elevationBoost) } : {}),
  };
}

function road(
  id: string,
  kind: CityWorldRoadSeed["kind"],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): CityWorldRoadSeed {
  return { id, kind, from: { x: fromX, y: fromY }, to: { x: toX, y: toY } };
}

function layoutDensity(base: number, context: LayoutContext): number {
  return roundUnit(clamp01(base * context.densityScale - context.greenGap));
}

function normalizeBonusZone(bonusZone: CityWorldZoneSpec, rect: CityWorldZoneSpec["rect"], label: string): CityWorldZoneSpec {
  return {
    ...bonusZone,
    rect,
    label,
  };
}

function withBonusRoad(roads: CityWorldRoadSeed[], bonusRoad: CityWorldRoadSeed): CityWorldRoadSeed[] {
  return roads.some((roadSeed) => roadSeed.id === bonusRoad.id) ? roads : [...roads, bonusRoad];
}

function cloneZone(zone: CityWorldZoneSpec, densityScale: number): CityWorldZoneSpec {
  return {
    ...zone,
    rect: { ...zone.rect },
    ...(zone.density !== undefined ? { density: scaledDensity(zone.density, densityScale) } : {}),
  };
}

function cloneRoad(road: CityWorldRoadSeed): CityWorldRoadSeed {
  return {
    ...road,
    from: { ...road.from },
    to: { ...road.to },
  };
}

function scaledDensity(value: number, scale: number): number {
  return Math.round(clamp01(value * scale) * 1_000) / 1_000;
}

function bonusZoneFor(
  parameters: GeneratedDistrictArchetype | CountyGenerationParameters,
  fallback: CityWorldZoneSpec,
): CityWorldZoneSpec {
  if (typeof parameters === "string") return fallback;
  if (isWaterDependentGeneratedDistrictArchetype(parameters.archetype)) {
    if (parameters.climate.aridity === "arid") {
      throw new Error(`Water-dependent archetype ${parameters.archetype} cannot strip water for arid county parameters`);
    }
    return fallback.kind === "water" ? fallback : waterEdgeBonusZone(parameters.archetype);
  }
  if (parameters.modulation.waterAffinity >= 0.75 && parameters.climate.aridity !== "arid" && parameters.archetype !== "desert_basin") {
    return {
      id: "water-edge",
      kind: "water",
      rect: { minX: 34, minY: 0, maxX: 44, maxY: 32 },
      label: parameters.archetype === "river_town" ? "River edge" : parameters.archetype === "coastal_grid" ? "Coastal edge" : "Water edge",
    };
  }
  if (parameters.climate.aridity === "arid" || parameters.nameSignal.includes("mesa") || parameters.nameSignal.includes("desert")) {
    return {
      id: "desert-plaza",
      kind: "plaza",
      rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 },
      label: "Dry plaza",
      elevationBoost: parameters.modulation.dryReliefBoost,
    };
  }
  return fallback;
}

function waterEdgeBonusZone(archetype: GeneratedDistrictArchetype): CityWorldZoneSpec {
  return {
    id: "water-edge",
    kind: "water",
    rect: { minX: 34, minY: 0, maxX: 44, maxY: 32 },
    label: archetype === "river_town" ? "River edge" : archetype === "coastal_grid" ? "Coastal edge" : "Water edge",
  };
}

function bonusRoadFor(
  parameters: GeneratedDistrictArchetype | CountyGenerationParameters,
  fallback: CityWorldRoadSeed,
): CityWorldRoadSeed {
  if (typeof parameters === "string") return fallback;
  const bonusZone = bonusZoneFor(parameters, parameters.archetypeProfile.zones.bonusZone);
  if (bonusZone.kind === "water") {
    return { id: "gen-road-water-edge", kind: "driveway", from: { x: 32, y: 24 }, to: { x: 41, y: 24 } };
  }
  return fallback;
}

function edgeReliefBoost(
  parameters: GeneratedDistrictArchetype | CountyGenerationParameters,
  rowIndex: number,
  columnIndex: number,
  rowCount: number,
  columnCount: number,
): number {
  if (typeof parameters === "string") return 0;
  const edge = rowIndex === 0 || columnIndex === 0 || rowIndex === rowCount - 1 || columnIndex === columnCount - 1;
  return edge ? parameters.modulation.dryReliefBoost : 0;
}
