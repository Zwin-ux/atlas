import type { CityWorldParametricSpec, CityWorldRoadSeed, CityWorldZoneSpec } from "./cityWorldParametricGenerator.js";
import { unitFromSeed } from "./cityWorldGeneratedDistrictSeed.js";
import type { DeterministicGeneratedDistrictInput, GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";
import {
  ARCHETYPE_PROFILES,
  resolveCountyParameters,
  type CountyGenerationParameters,
} from "./cityWorldCountyParameters.js";

export function selectGeneratedDistrictArchetype(
  county: DeterministicGeneratedDistrictInput["county"],
  seed: number,
): GeneratedDistrictArchetype {
  return resolveCountyParameters(county, seed).archetype;
}

export function generatedZones(parameters: GeneratedDistrictArchetype | CountyGenerationParameters, seed: number): CityWorldZoneSpec[] {
  const profile = profileFor(parameters);
  const modulation = typeof parameters === "string" ? undefined : parameters.modulation;
  const xShift = (seed % 3) - 1;
  const yShift = (Math.floor(seed / 3) % 3) - 1;
  const civicRect = { minX: 18 + xShift, minY: 9 + yShift, maxX: 24 + xShift, maxY: 15 + yShift };
  const densityScale = modulation?.densityScale ?? 1;
  const zones: CityWorldZoneSpec[] = [
    { id: "west-neighborhood", kind: "residential", rect: { minX: 3, minY: 4, maxX: 16, maxY: 18 }, density: scaledDensity(0.72, densityScale) },
    { id: "east-neighborhood", kind: "residential", rect: { minX: 31, minY: 5, maxX: 41, maxY: 18 }, density: scaledDensity(0.7, densityScale) },
    { id: "south-court", kind: "residential", rect: { minX: 4, minY: 21, maxX: 14, maxY: 29 }, density: scaledDensity(0.68, densityScale) },
    { id: "civic-core", kind: "civic", rect: civicRect, label: "Civic core", elevationBoost: modulation?.civicElevationBoost ?? profile.zones.civicElevationBoost },
    { id: "main-street", kind: "commercial", rect: { minX: 25, minY: 8, maxX: 36, maxY: 16 }, label: "Main street", density: scaledDensity(0.78, densityScale) },
    { id: "apartment-edge", kind: "apartments", rect: { minX: 25, minY: 18, maxX: 35, maxY: 25 }, label: "Apartment edge", density: scaledDensity(0.66, densityScale) },
    { id: "service-yard", kind: "gym", rect: { minX: 16, minY: 18, maxX: 22, maxY: 24 }, label: "Service yard" },
    { id: "community-green", kind: "park", rect: { minX: 8, minY: 20, maxX: 16, maxY: 29 }, label: "Community green" },
    { id: "south-commerce", kind: "commercial", rect: { minX: 21, minY: 25, maxX: 31, maxY: 29 }, label: "South shops", density: scaledDensity(0.62, densityScale) },
  ];

  zones.push(cloneZone(bonusZoneFor(parameters, profile.zones.bonusZone), densityScale));

  return zones;
}

export function generatedRoadSeeds(parameters: GeneratedDistrictArchetype | CountyGenerationParameters, seed: number): CityWorldRoadSeed[] {
  const profile = profileFor(parameters);
  const y = 14 + ((seed >>> 4) % 3) - 1;
  const x = 21 + ((seed >>> 7) % 3) - 1;
  const roadSeeds: CityWorldRoadSeed[] = [
    { id: "gen-road-main", kind: "avenue", from: { x: 3, y }, to: { x: 41, y } },
    { id: "gen-road-cross", kind: "avenue", from: { x, y: 4 }, to: { x, y: 29 } },
    { id: "gen-road-neighborhood-west", kind: "street", from: { x: 10, y: 4 }, to: { x: 10, y: 29 } },
    { id: "gen-road-commercial", kind: "street", from: { x: 30, y: 6 }, to: { x: 30, y: 27 } },
    { id: "gen-road-south", kind: "street", from: { x: 4, y: 24 }, to: { x: 36, y: 24 } },
    { id: "gen-cross-civic", kind: "crosswalk", from: { x: x - 2, y }, to: { x: x + 2, y } },
  ];

  roadSeeds.push(cloneRoad(bonusRoadFor(parameters, profile.zones.bonusRoad)));

  return roadSeeds;
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

function profileFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters) {
  return typeof parameters === "string" ? ARCHETYPE_PROFILES[parameters] : parameters.archetypeProfile;
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
