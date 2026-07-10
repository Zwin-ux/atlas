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
  const context = layoutContext(profile, modulation, seed);
  const bonusZone = cloneZone(bonusZoneFor(parameters, profile.zones.bonusZone), context.densityScale);

  if (profile.archetype === "metro_grid") return metroGridZones(context, bonusZone);
  if (profile.archetype === "desert_basin") return desertBasinZones(context, bonusZone);
  if (profile.archetype === "coastal_grid") return coastalGridZones(context, bonusZone);
  if (profile.archetype === "mountain_valley") return mountainValleyZones(context, bonusZone);
  if (profile.archetype === "prairie_town") return prairieTownZones(context, bonusZone);
  return riverTownZones(context, bonusZone);
}

export function generatedRoadSeeds(parameters: GeneratedDistrictArchetype | CountyGenerationParameters, seed: number): CityWorldRoadSeed[] {
  const profile = profileFor(parameters);
  const modulation = modulationFor(parameters);
  const context = layoutContext(profile, modulation, seed);
  const bonusRoad = cloneRoad(bonusRoadFor(parameters, profile.zones.bonusRoad));

  if (profile.archetype === "metro_grid") return withBonusRoad(metroGridRoads(context), bonusRoad);
  if (profile.archetype === "desert_basin") return withBonusRoad(desertBasinRoads(context), bonusRoad);
  if (profile.archetype === "coastal_grid") return withBonusRoad(coastalGridRoads(context), bonusRoad);
  if (profile.archetype === "mountain_valley") return withBonusRoad(mountainValleyRoads(context), bonusRoad);
  if (profile.archetype === "prairie_town") return withBonusRoad(prairieTownRoads(context), bonusRoad);
  return withBonusRoad(riverTownRoads(context), bonusRoad);
}

type LayoutContext = {
  profile: ArchetypeProfile;
  modulation: CountyGenerationModulation | undefined;
  densityScale: number;
  greenGap: number;
  xShift: number;
  yShift: number;
  civicElevationBoost: number;
  reliefTerraceBoost: number;
  waterAffinity: number;
};

function layoutContext(profile: ArchetypeProfile, modulation: CountyGenerationModulation | undefined, seed: number): LayoutContext {
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
    civicElevationBoost: modulation?.civicElevationBoost ?? profile.zones.civicElevationBoost,
    reliefTerraceBoost: ((modulation?.reliefScale ?? 1) - 1) * 0.38,
    waterAffinity: modulation?.waterAffinity ?? 0,
  };
}

function metroGridZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  const civicRect = { minX: 18 + context.xShift, minY: 10 + context.yShift, maxX: 24 + context.xShift, maxY: 15 + context.yShift };
  return [
    zone("metro-west-block", "residential", { minX: 3, minY: 4, maxX: 12, maxY: 8 }, context, 0.92, "West row blocks"),
    zone("metro-south-rowhomes", "residential", { minX: 3, minY: 18, maxX: 14, maxY: 28 }, context, 0.94, "South rowhomes"),
    zone("metro-civic-core", "civic", civicRect, context, undefined, "Civic tower core", context.civicElevationBoost + 0.05),
    zone("metro-main-street", "commercial", { minX: 15, minY: 5, maxX: 25, maxY: 8 }, context, 0.92, "Tight main street"),
    zone("metro-downtown-strip", "commercial", { minX: 27, minY: 10, maxX: 34, maxY: 14 }, context, 0.9, "Downtown strip"),
    zone("metro-apartment-core", "apartments", { minX: 15, minY: 17, maxX: 25, maxY: 24 }, context, 0.91, "Apartment core"),
    zone("metro-apartment-east", "apartments", { minX: 27, minY: 17, maxX: 34, maxY: 24 }, context, 0.88, "Apartment edge"),
    zone("metro-service-yard", "gym", { minX: 16, minY: 25, maxX: 23, maxY: 29 }, context, undefined, "Service yard"),
    zone("metro-pocket-plaza", "plaza", { minX: 6, minY: 10, maxX: 12, maxY: 15 }, context, undefined, "Pocket plaza"),
    bonusZone,
  ];
}

function desertBasinZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  return [
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
    zone("coastal-back-homes", "residential", { minX: 4, minY: 5, maxX: 18, maxY: 14 }, context, 0.74, "Back-shore homes"),
    zone("coastal-stepback-homes", "residential", { minX: 5, minY: 19, maxX: 20, maxY: 29 }, context, 0.72, "Stepback homes"),
    zone("coastal-civic", "civic", { minX: 21, minY: 8, maxX: 28, maxY: 14 }, context, undefined, "Coastal civic", context.civicElevationBoost),
    zone("coastal-waterfront-strip", "commercial", { minX: 27, minY: 18, maxX: 35, maxY: 27 }, context, 0.86, "Waterfront strip"),
    zone("coastal-main-street", "commercial", { minX: 22, minY: 5, maxX: 34, maxY: 8 }, context, 0.76, "Shore main street"),
    zone("coastal-apartments", "apartments", { minX: 22, minY: 16, maxX: 27, maxY: 26 }, context, 0.72, "Shore apartments"),
    zone("coastal-service", "gym", { minX: 15, minY: 16, maxX: 21, maxY: 21 }, context, undefined, "Marina service"),
    zone("coastal-green", "park", { minX: 8, minY: 15, maxX: 15, maxY: 19 }, context, undefined, "Shore green"),
    normalizeBonusZone(bonusZone, { minX: 37, minY: 17, maxX: 43, maxY: 31 }, context.waterAffinity >= 0.75 ? "Coastal edge" : "Water edge"),
  ];
}

function mountainValleyZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
  return [
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
  return [
    zone("river-west-homes", "residential", { minX: 5, minY: 5, maxX: 18, maxY: 14 }, context, 0.74, "West bank homes"),
    zone("river-south-homes", "residential", { minX: 6, minY: 20, maxX: 21, maxY: 29 }, context, 0.72, "South bank homes"),
    zone("river-ferry-market", "commercial", { minX: 25, minY: 3, maxX: 33, maxY: 9 }, context, 0.86, "Ferry market"),
    zone("river-main-north", "commercial", { minX: 25, minY: 11, maxX: 33, maxY: 17 }, context, 0.86, "River main north"),
    zone("river-main-south", "commercial", { minX: 25, minY: 19, maxX: 33, maxY: 25 }, context, 0.86, "River main south"),
    zone("river-dock-district", "commercial", { minX: 30, minY: 27, maxX: 36, maxY: 30 }, context, 0.82, "Dock district"),
    zone("river-civic", "civic", { minX: 20, minY: 10, maxX: 26, maxY: 16 }, context, undefined, "River civic", context.civicElevationBoost),
    zone("river-apartments", "apartments", { minX: 20, minY: 19, maxX: 27, maxY: 28 }, context, 0.72, "River flats"),
    zone("river-plaza", "plaza", { minX: 10, minY: 15, maxX: 19, maxY: 19 }, context, undefined, "River plaza"),
    normalizeBonusZone(bonusZone, { minX: 37, minY: 5, maxX: 43, maxY: 31 }, "River edge"),
  ];
}

function metroGridRoads(context: LayoutContext): CityWorldRoadSeed[] {
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
  const shoreX = 35 + Math.round(context.waterAffinity);
  return [
    road("gen-road-coastal-shoreline", "avenue", shoreX, 5, shoreX, 30),
    road("gen-road-coastal-north", "street", 4, 9 + context.yShift, shoreX, 9 + context.yShift),
    road("gen-road-coastal-mid", "avenue", 5, 16, shoreX, 16),
    road("gen-road-coastal-south", "street", 5, 25, shoreX, 25),
    road("gen-road-coastal-back", "street", 21 + context.xShift, 5, 21 + context.xShift, 29),
    road("gen-cross-coastal-pier", "crosswalk", shoreX - 2, 25, shoreX + 2, 25),
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
  return [
    road("gen-road-river-main", "avenue", 34, 5, 34, 30),
    road("gen-road-river-west", "street", 22 + context.xShift, 5, 22 + context.xShift, 29),
    road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 36, 10 + context.yShift),
    road("gen-road-river-mid-cross", "avenue", 6, 18, 36, 18),
    road("gen-road-river-dock-cross", "street", 6, 26, 37, 26),
    road("gen-cross-river-bridge", "crosswalk", 34, 18, 38, 18),
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
            value * reliefScale +
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

function profileFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters): ArchetypeProfile {
  return typeof parameters === "string" ? ARCHETYPE_PROFILES[parameters] : parameters.archetypeProfile;
}

function modulationFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters): CountyGenerationModulation | undefined {
  return typeof parameters === "string" ? undefined : parameters.modulation;
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
      rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 },
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
    rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 },
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
    return { id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } };
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
