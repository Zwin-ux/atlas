import type { CityWorldParametricSpec, CityWorldRoadSeed, CityWorldZoneSpec } from "./cityWorldParametricGenerator.js";
import { unitFromSeed } from "./cityWorldGeneratedDistrictSeed.js";
import type { DeterministicGeneratedDistrictInput, GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";

export function selectGeneratedDistrictArchetype(
  county: DeterministicGeneratedDistrictInput["county"],
  seed: number,
): GeneratedDistrictArchetype {
  const stateCode = county.stateCode.toUpperCase();
  const longitude = county.centroid?.longitude;
  const latitude = county.centroid?.latitude;

  if (["AZ", "NM", "NV"].includes(stateCode) || (longitude !== undefined && latitude !== undefined && longitude < -108 && latitude < 38)) {
    return "desert_basin";
  }
  if (
    ["CA", "FL", "HI", "LA", "ME", "MA", "MD", "NJ", "NY", "OR", "RI", "SC", "VA", "WA"].includes(stateCode) ||
    (longitude !== undefined && (longitude < -122 || longitude > -72))
  ) {
    return "coastal_grid";
  }
  if (["CO", "ID", "MT", "UT", "WY", "WV", "VT"].includes(stateCode) || (longitude !== undefined && latitude !== undefined && longitude < -104 && latitude >= 38)) {
    return "mountain_valley";
  }
  if (["IA", "KS", "MO", "ND", "NE", "OK", "SD"].includes(stateCode)) {
    return "prairie_town";
  }
  if (seed % 7 === 0) {
    return "river_town";
  }
  return "metro_grid";
}

export function generatedZones(archetype: GeneratedDistrictArchetype, seed: number): CityWorldZoneSpec[] {
  const xShift = (seed % 3) - 1;
  const yShift = (Math.floor(seed / 3) % 3) - 1;
  const civicRect = { minX: 18 + xShift, minY: 9 + yShift, maxX: 24 + xShift, maxY: 15 + yShift };
  const zones: CityWorldZoneSpec[] = [
    { id: "west-neighborhood", kind: "residential", rect: { minX: 3, minY: 4, maxX: 16, maxY: 18 }, density: 0.72 },
    { id: "east-neighborhood", kind: "residential", rect: { minX: 31, minY: 5, maxX: 41, maxY: 18 }, density: 0.7 },
    { id: "south-court", kind: "residential", rect: { minX: 4, minY: 21, maxX: 14, maxY: 29 }, density: 0.68 },
    { id: "civic-core", kind: "civic", rect: civicRect, label: "Civic core", elevationBoost: archetype === "mountain_valley" ? 0.35 : 0.18 },
    { id: "main-street", kind: "commercial", rect: { minX: 25, minY: 8, maxX: 36, maxY: 16 }, label: "Main street", density: 0.78 },
    { id: "apartment-edge", kind: "apartments", rect: { minX: 25, minY: 18, maxX: 35, maxY: 25 }, label: "Apartment edge", density: 0.66 },
    { id: "service-yard", kind: "gym", rect: { minX: 16, minY: 18, maxX: 22, maxY: 24 }, label: "Service yard" },
    { id: "community-green", kind: "park", rect: { minX: 8, minY: 20, maxX: 16, maxY: 29 }, label: "Community green" },
    { id: "south-commerce", kind: "commercial", rect: { minX: 21, minY: 25, maxX: 31, maxY: 29 }, label: "South shops", density: 0.62 },
  ];

  if (archetype === "coastal_grid" || archetype === "river_town") {
    zones.push({ id: "water-edge", kind: "water", rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 }, label: archetype === "coastal_grid" ? "Coastal edge" : "River edge" });
  } else if (archetype === "desert_basin") {
    zones.push({ id: "desert-plaza", kind: "plaza", rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 }, label: "Dry plaza" });
  } else if (archetype === "mountain_valley") {
    zones.push({ id: "ridge-commons", kind: "park", rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 }, label: "Ridge commons", elevationBoost: 0.25 });
  } else {
    zones.push({ id: "east-commons", kind: "commercial", rect: { minX: 35, minY: 21, maxX: 41, maxY: 29 }, label: "East commons", density: 0.58 });
  }

  return zones;
}

export function generatedRoadSeeds(archetype: GeneratedDistrictArchetype, seed: number): CityWorldRoadSeed[] {
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

  if (archetype === "river_town" || archetype === "coastal_grid") {
    roadSeeds.push({ id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } });
  } else if (archetype === "prairie_town") {
    roadSeeds.push({ id: "gen-road-grid-north", kind: "street", from: { x: 4, y: 8 }, to: { x: 38, y: 8 } });
  } else {
    roadSeeds.push({ id: "gen-road-service-loop", kind: "driveway", from: { x: 15, y: 21 }, to: { x: 24, y: 21 } });
  }

  return roadSeeds;
}

export function generatedHeightGrid(
  archetype: GeneratedDistrictArchetype,
  seed: number,
): NonNullable<CityWorldParametricSpec["heightGrid"]> {
  return {
    cellSize: 8,
    values: BASE_HEIGHT_GRIDS[archetype].map((row, rowIndex) =>
      row.map((value, columnIndex) => roundUnit(clamp01(value + (unitFromSeed(seed, `h-${rowIndex}-${columnIndex}`) - 0.5) * 0.08))),
    ),
  };
}

const BASE_HEIGHT_GRIDS: Record<GeneratedDistrictArchetype, number[][]> = {
  metro_grid: [
    [0.18, 0.24, 0.26, 0.24, 0.2, 0.18],
    [0.2, 0.28, 0.32, 0.3, 0.24, 0.2],
    [0.22, 0.3, 0.34, 0.32, 0.26, 0.22],
    [0.18, 0.24, 0.28, 0.26, 0.22, 0.18],
  ],
  coastal_grid: [
    [0.28, 0.3, 0.3, 0.24, 0.14, 0.06],
    [0.3, 0.34, 0.32, 0.24, 0.12, 0.04],
    [0.26, 0.3, 0.28, 0.2, 0.1, 0.02],
    [0.22, 0.24, 0.22, 0.16, 0.08, 0],
  ],
  desert_basin: [
    [0.44, 0.34, 0.26, 0.24, 0.3, 0.42],
    [0.38, 0.26, 0.18, 0.16, 0.24, 0.36],
    [0.34, 0.22, 0.14, 0.12, 0.2, 0.32],
    [0.42, 0.3, 0.22, 0.2, 0.28, 0.4],
  ],
  mountain_valley: [
    [0.76, 0.58, 0.36, 0.32, 0.5, 0.72],
    [0.68, 0.48, 0.28, 0.24, 0.42, 0.66],
    [0.62, 0.42, 0.24, 0.22, 0.38, 0.6],
    [0.72, 0.54, 0.34, 0.32, 0.48, 0.7],
  ],
  prairie_town: [
    [0.12, 0.14, 0.16, 0.16, 0.14, 0.12],
    [0.14, 0.16, 0.18, 0.18, 0.16, 0.14],
    [0.12, 0.15, 0.17, 0.17, 0.15, 0.12],
    [0.1, 0.12, 0.14, 0.14, 0.12, 0.1],
  ],
  river_town: [
    [0.32, 0.3, 0.26, 0.2, 0.14, 0.1],
    [0.34, 0.32, 0.28, 0.2, 0.12, 0.06],
    [0.3, 0.28, 0.24, 0.18, 0.1, 0.04],
    [0.28, 0.24, 0.22, 0.16, 0.08, 0.02],
  ],
};

function roundUnit(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
