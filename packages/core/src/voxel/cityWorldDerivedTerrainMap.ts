import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldLot,
  CityWorldPin,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldTerrainKind,
  CityWorldTerrainTile,
} from "./cityWorldTypes.js";
import {
  cityWorldClamp,
  cityWorldPointDistanceToSegment,
  cityWorldPointInsideFootprint,
  cityWorldPointInsideFrame,
  cityWorldSegmentLength,
  cityWorldSegmentTouchesFrame,
  cityWorldViewportFrameForCameraPreset,
  type CityWorldViewportFrame,
} from "./cityWorldBasis.js";

export type CityWorldDerivedTerrainCell = {
  index: number;
  x: number;
  y: number;
  height: number;
  colorKey: string;
  colorHex: string;
  terrainKind: CityWorldTerrainKind | "empty";
  terrainTileId?: string;
  lotIds: string[];
  roadIds: string[];
  buildingIds: string[];
};

export type CityWorldDerivedTerrainMap = {
  type: "cityWorldDerivedTerrainMap";
  sceneId: string;
  source: "CityWorldScene";
  width: number;
  depth: number;
  origin: { x: number; y: number };
  heightMap: number[];
  colorMap: string[];
  cells: CityWorldDerivedTerrainCell[];
  distributions: {
    colorKeys: Record<string, number>;
    terrainKinds: Record<string, number>;
  };
  metrics: {
    cellCount: number;
    terrainCellCount: number;
    emptyCellCount: number;
    objectOccupiedCellCount: number;
    heightMin: number;
    heightMax: number;
    heightRange: number;
    nonFlatCellRatio: number;
    occupiedCellRatio: number;
    colorKeyCount: number;
    waterEdgeCutRatio: number;
  };
};

export type CityWorldMobileOcclusionReport = {
  type: "cityWorldMobileOcclusion";
  sceneId: string;
  cameraPresetId: string;
  frame: CityWorldViewportFrame;
  counts: {
    terrainTiles: number;
    lots: number;
    roadSegments: number;
    buildings: number;
    props: number;
    pins: number;
    actors: number;
  };
  metrics: {
    objectFootprintCoverageRatio: number;
    verticalStackPressureRatio: number;
    interactiveMarkerPressureRatio: number;
    traySafeBandPressureRatio: number;
    mobileOcclusionRiskScore: number;
    mobileReadabilityScore: number;
  };
};

export type CityWorldMobileLodBudgetProfileId =
  | "playable_mobile"
  | "residential_detail_probe"
  | "shell_mobile_empty_state"
  | "hidden_draft_mobile_probe";

type CityWorldMobileOcclusionMetricName = keyof CityWorldMobileOcclusionReport["metrics"];
type CityWorldMobileOcclusionCountName = keyof CityWorldMobileOcclusionReport["counts"];

export type CityWorldMobileLodBudget = {
  profileId: CityWorldMobileLodBudgetProfileId;
  label: string;
  maximumMetrics?: Partial<Record<CityWorldMobileOcclusionMetricName, number>>;
  minimumMetrics?: Partial<Record<CityWorldMobileOcclusionMetricName, number>>;
  maximumCounts?: Partial<Record<CityWorldMobileOcclusionCountName, number>>;
  minimumCounts?: Partial<Record<CityWorldMobileOcclusionCountName, number>>;
  requireNonPlayable?: boolean;
};

export type CityWorldMobileLodBudgetResult = {
  type: "cityWorldMobileLodBudgetResult";
  profileId: CityWorldMobileLodBudgetProfileId;
  label: string;
  sceneId: string;
  cameraPresetId: string;
  passed: boolean;
  blockers: string[];
  counts: CityWorldMobileOcclusionReport["counts"];
  metrics: CityWorldMobileOcclusionReport["metrics"];
};

export const CITY_WORLD_MOBILE_LOD_BUDGETS: Record<CityWorldMobileLodBudgetProfileId, CityWorldMobileLodBudget> = {
  playable_mobile: {
    profileId: "playable_mobile",
    label: "Playable county mobile budget",
    maximumMetrics: {
      mobileOcclusionRiskScore: 0.34,
      traySafeBandPressureRatio: 0.36,
      interactiveMarkerPressureRatio: 0.42,
      verticalStackPressureRatio: 0.14,
    },
    minimumMetrics: {
      mobileReadabilityScore: 0.7,
    },
    minimumCounts: {
      buildings: 8,
      actors: 1,
    },
  },
  residential_detail_probe: {
    profileId: "residential_detail_probe",
    label: "Dense residential proof-crop budget",
    maximumMetrics: {
      mobileOcclusionRiskScore: 0.62,
      traySafeBandPressureRatio: 1,
      interactiveMarkerPressureRatio: 0.1,
      verticalStackPressureRatio: 0.18,
    },
    minimumMetrics: {
      mobileReadabilityScore: 0.38,
    },
    minimumCounts: {
      buildings: 6,
    },
  },
  shell_mobile_empty_state: {
    profileId: "shell_mobile_empty_state",
    label: "Shell county empty-state mobile budget",
    maximumMetrics: {
      mobileOcclusionRiskScore: 0.02,
      traySafeBandPressureRatio: 0.02,
    },
    minimumMetrics: {
      mobileReadabilityScore: 0.98,
    },
    maximumCounts: {
      buildings: 0,
      pins: 0,
      actors: 0,
    },
    requireNonPlayable: true,
  },
  hidden_draft_mobile_probe: {
    profileId: "hidden_draft_mobile_probe",
    label: "Hidden draft mobile proof budget",
    maximumMetrics: {
      mobileOcclusionRiskScore: 0.58,
      traySafeBandPressureRatio: 0.58,
    },
    minimumMetrics: {
      mobileReadabilityScore: 0.42,
    },
    maximumCounts: {
      pins: 0,
      actors: 0,
    },
    requireNonPlayable: true,
  },
};

const TERRAIN_COLOR_HEX: Record<CityWorldTerrainKind | "empty", string> = {
  grass: "#77a96a",
  park: "#87b86e",
  plaza: "#c8baa1",
  water: "#5e9fc5",
  sidewalk: "#b9b7aa",
  empty: "#1f2937",
};

const TERRAIN_BASE_HEIGHT: Record<CityWorldTerrainKind | "empty", number> = {
  grass: 0,
  park: 0.08,
  plaza: 0.12,
  water: -0.35,
  sidewalk: 0.06,
  empty: 0,
};

const TERRAIN_ELEVATION_HEIGHT: Record<string, number> = {
  flat_field: 0,
  raised_parcel_shelf: 0.42,
  civic_plinth_shelf: 0.72,
  commercial_slab_field: 0.48,
  park_basin_shelf: 0.22,
  water_edge_cut: -0.28,
  shell_flat: 0,
  hidden_draft_shelf: 0.46,
};

const TERRAIN_MASSING_HEIGHT: Record<string, number> = {
  none: 0,
  outer_world_edge_mass: 0.72,
  civic_plinth_mass: 0.86,
  residential_shelf_mass: 0.48,
  commercial_slab_mass: 0.52,
  park_basin_cut_mass: -0.16,
  waterfront_bank_cut_mass: -0.22,
  shell_boundary_mass: 0.18,
  hidden_draft_mass: 0.5,
};

const CHUNK_EDGE_HEIGHT: Record<string, number> = {
  none: 0,
  world_edge: 0.2,
  parcel_cluster_edge: 0.16,
  waterfront_bank_edge: -0.12,
  park_basin_edge: -0.08,
  hidden_draft_boundary: 0.14,
};

export function deriveCityWorldTerrainMap(scene: CityWorldScene): CityWorldDerivedTerrainMap {
  const minX = Math.floor(scene.bounds.minX);
  const maxX = Math.ceil(scene.bounds.maxX);
  const minY = Math.floor(scene.bounds.minY);
  const maxY = Math.ceil(scene.bounds.maxY);
  const width = maxX - minX + 1;
  const depth = maxY - minY + 1;
  const terrainByCell = indexTerrainTiles(scene.terrainTiles);
  const heightMap: number[] = [];
  const colorMap: string[] = [];
  const cells: CityWorldDerivedTerrainCell[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const index = cells.length;
      const key = cellKey(x, y);
      const terrainTile = terrainByCell.get(key);
      const lotIds = scene.lots.filter((lot) => pointInsideLotCell({ x, y, z: 0 }, lot)).map((lot) => lot.id);
      const roadIds = scene.roadSegments.filter((road) => pointTouchesRoadCell({ x, y, z: 0 }, road)).map((road) => road.id);
      const buildingIds = scene.buildings.filter((building) => pointInsideBuildingCell({ x, y, z: 0 }, building)).map((building) => building.id);
      const height = deriveCellHeight(terrainTile, lotIds.length, roadIds.length, buildingIds.length);
      const colorKey = deriveCellColorKey(terrainTile, lotIds.length, roadIds.length, buildingIds.length);
      const colorHex = terrainTile ? TERRAIN_COLOR_HEX[terrainTile.kind] : TERRAIN_COLOR_HEX.empty;
      heightMap.push(height);
      colorMap.push(colorKey);
      cells.push({
        index,
        x,
        y,
        height,
        colorKey,
        colorHex,
        terrainKind: terrainTile?.kind ?? "empty",
        ...(terrainTile ? { terrainTileId: terrainTile.id } : {}),
        lotIds,
        roadIds,
        buildingIds,
      });
    }
  }

  const terrainCellCount = cells.filter((cell) => cell.terrainKind !== "empty").length;
  const emptyCellCount = cells.length - terrainCellCount;
  const objectOccupiedCellCount = cells.filter((cell) => cell.lotIds.length > 0 || cell.roadIds.length > 0 || cell.buildingIds.length > 0).length;
  const nonZeroHeights = heightMap.filter((height) => Math.abs(height) > 0.001);
  const waterCells = cells.filter((cell) => cell.terrainKind === "water");
  const waterEdgeCutCells = waterCells.filter((cell) => cell.height <= TERRAIN_BASE_HEIGHT.water - 0.1);
  const heightMin = Math.min(...heightMap);
  const heightMax = Math.max(...heightMap);
  const colorKeys = countBy(cells, (cell) => cell.colorKey);
  const terrainKinds = countBy(cells, (cell) => cell.terrainKind);

  return {
    type: "cityWorldDerivedTerrainMap",
    sceneId: scene.id,
    source: "CityWorldScene",
    width,
    depth,
    origin: { x: minX, y: minY },
    heightMap,
    colorMap,
    cells,
    distributions: {
      colorKeys,
      terrainKinds,
    },
    metrics: {
      cellCount: cells.length,
      terrainCellCount,
      emptyCellCount,
      objectOccupiedCellCount,
      heightMin: roundTerrainMetric(heightMin),
      heightMax: roundTerrainMetric(heightMax),
      heightRange: roundTerrainMetric(heightMax - heightMin),
      nonFlatCellRatio: roundTerrainMetric(nonZeroHeights.length / Math.max(1, cells.length)),
      occupiedCellRatio: roundTerrainMetric(objectOccupiedCellCount / Math.max(1, cells.length)),
      colorKeyCount: Object.keys(colorKeys).length,
      waterEdgeCutRatio: waterCells.length === 0 ? 1 : roundTerrainMetric(waterEdgeCutCells.length / waterCells.length),
    },
  };
}

export function deriveCityWorldMobileOcclusion(scene: CityWorldScene, cameraPresetId = "mobile"): CityWorldMobileOcclusionReport {
  const preset = scene.cameraPresets.find((candidate) => candidate.id === cameraPresetId) ?? scene.cameraPresets[0];
  if (!preset) {
    throw new Error(`Scene ${scene.id} has no camera presets.`);
  }

  const frame = cityWorldViewportFrameForCameraPreset(preset);
  const terrainTiles = scene.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
  const lots = scene.lots.filter((lot) => cityWorldPointInsideFrame(lot.position, frame));
  const roads = scene.roadSegments.filter((road) => cityWorldSegmentTouchesFrame(road.from, road.to, frame));
  const buildings = scene.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));
  const props = scene.props.filter((prop) => cityWorldPointInsideFrame(prop.position, frame));
  const pins = scene.pins.filter((pin) => cityWorldPointInsideFrame(pin.anchor, frame));
  const actors = scene.actors.filter((actor) => cityWorldPointInsideFrame(actor.position, frame));
  const frameArea = Math.max(1, (frame.maxX - frame.minX) * (frame.maxY - frame.minY));
  const lotArea = lots.reduce((sum, lot) => sum + lot.width * lot.depth, 0);
  const roadArea = roads.reduce((sum, road) => sum + cityWorldSegmentLength(road.from, road.to) * road.width, 0);
  const buildingFootprintArea = buildings.reduce((sum, building) => sum + building.width * building.depth, 0);
  const buildingVolume = buildings.reduce((sum, building) => sum + building.width * building.depth * building.height, 0);
  const traySafeBandPressureRatio = deriveTraySafeBandPressure(frame, lots, roads, buildings, props, pins, actors);
  const objectFootprintCoverageRatio = cityWorldClamp((lotArea * 0.28 + roadArea * 0.45 + buildingFootprintArea) / frameArea, 0, 1);
  const verticalStackPressureRatio = cityWorldClamp(buildingVolume / (frameArea * 2.8), 0, 1);
  const interactiveMarkerPressureRatio = cityWorldClamp((pins.length + actors.length * 1.5) / 8, 0, 1);
  const mobileOcclusionRiskScore = roundTerrainMetric(
    objectFootprintCoverageRatio * 0.36 +
      verticalStackPressureRatio * 0.28 +
      interactiveMarkerPressureRatio * 0.16 +
      traySafeBandPressureRatio * 0.2,
  );

  return {
    type: "cityWorldMobileOcclusion",
    sceneId: scene.id,
    cameraPresetId: preset.id,
    frame,
    counts: {
      terrainTiles: terrainTiles.length,
      lots: lots.length,
      roadSegments: roads.length,
      buildings: buildings.length,
      props: props.length,
      pins: pins.length,
      actors: actors.length,
    },
    metrics: {
      objectFootprintCoverageRatio: roundTerrainMetric(objectFootprintCoverageRatio),
      verticalStackPressureRatio: roundTerrainMetric(verticalStackPressureRatio),
      interactiveMarkerPressureRatio: roundTerrainMetric(interactiveMarkerPressureRatio),
      traySafeBandPressureRatio: roundTerrainMetric(traySafeBandPressureRatio),
      mobileOcclusionRiskScore,
      mobileReadabilityScore: roundTerrainMetric(1 - mobileOcclusionRiskScore),
    },
  };
}

export function evaluateCityWorldMobileLodBudget(
  report: CityWorldMobileOcclusionReport,
  budgetOrProfileId: CityWorldMobileLodBudget | CityWorldMobileLodBudgetProfileId,
  scene?: CityWorldScene,
): CityWorldMobileLodBudgetResult {
  const budget = typeof budgetOrProfileId === "string" ? CITY_WORLD_MOBILE_LOD_BUDGETS[budgetOrProfileId] : budgetOrProfileId;
  const blockers: string[] = [];

  for (const [metricName, maximum] of Object.entries(budget.maximumMetrics ?? {}) as [CityWorldMobileOcclusionMetricName, number][]) {
    const actual = report.metrics[metricName];
    if (actual > maximum) {
      blockers.push(`${metricName} ${actual} exceeds ${maximum}.`);
    }
  }

  for (const [metricName, minimum] of Object.entries(budget.minimumMetrics ?? {}) as [CityWorldMobileOcclusionMetricName, number][]) {
    const actual = report.metrics[metricName];
    if (actual < minimum) {
      blockers.push(`${metricName} ${actual} is below ${minimum}.`);
    }
  }

  for (const [countName, maximum] of Object.entries(budget.maximumCounts ?? {}) as [CityWorldMobileOcclusionCountName, number][]) {
    const actual = report.counts[countName];
    if (actual > maximum) {
      blockers.push(`${countName} count ${actual} exceeds ${maximum}.`);
    }
  }

  for (const [countName, minimum] of Object.entries(budget.minimumCounts ?? {}) as [CityWorldMobileOcclusionCountName, number][]) {
    const actual = report.counts[countName];
    if (actual < minimum) {
      blockers.push(`${countName} count ${actual} is below ${minimum}.`);
    }
  }

  if (budget.requireNonPlayable && scene?.coverage?.playable) {
    blockers.push("scene coverage is playable but budget requires a non-playable scene.");
  }

  return {
    type: "cityWorldMobileLodBudgetResult",
    profileId: budget.profileId,
    label: budget.label,
    sceneId: report.sceneId,
    cameraPresetId: report.cameraPresetId,
    passed: blockers.length === 0,
    blockers,
    counts: report.counts,
    metrics: report.metrics,
  };
}

function indexTerrainTiles(tiles: readonly CityWorldTerrainTile[]): Map<string, CityWorldTerrainTile> {
  const map = new Map<string, CityWorldTerrainTile>();
  for (const tile of tiles) {
    const x = Math.round(tile.position.x);
    const y = Math.round(tile.position.y);
    map.set(cellKey(x, y), tile);
  }
  return map;
}

function deriveCellHeight(tile: CityWorldTerrainTile | undefined, lotCount: number, roadCount: number, buildingCount: number): number {
  const kind = tile?.kind ?? "empty";
  const grammar = tile?.visualGrammar;
  const terrainHeight = TERRAIN_BASE_HEIGHT[kind] +
    lookupHeight(TERRAIN_ELEVATION_HEIGHT, grammar?.terrainElevation) +
    lookupHeight(TERRAIN_MASSING_HEIGHT, grammar?.terrainChunkMassing) +
    lookupHeight(CHUNK_EDGE_HEIGHT, grammar?.chunkEdge);
  const occupancyHeight = Math.min(0.55, lotCount * 0.08 + roadCount * 0.04 + buildingCount * 0.22);
  return roundTerrainMetric(cityWorldClamp(terrainHeight + occupancyHeight, -1, 3));
}

function deriveCellColorKey(tile: CityWorldTerrainTile | undefined, lotCount: number, roadCount: number, buildingCount: number): string {
  const kind = tile?.kind ?? "empty";
  const grammar = tile?.visualGrammar;
  const occupancy = buildingCount > 0 ? "building" : lotCount > 0 ? "lot" : roadCount > 0 ? "road" : "open";
  return [
    kind,
    grammar?.terrainComposition ?? "none",
    grammar?.terrainElevation ?? "none",
    grammar?.terrainChunkMassing ?? "none",
    occupancy,
  ].join(".");
}

function lookupHeight(table: Record<string, number>, key: string | undefined): number {
  if (!key) return 0;
  return table[key] ?? 0;
}

function pointInsideLotCell(point: CityWorldPoint, lot: CityWorldLot): boolean {
  return cityWorldPointInsideFootprint(point, lot.position, lot.width + 0.2, lot.depth + 0.2);
}

function pointInsideBuildingCell(point: CityWorldPoint, building: CityWorldBuilding): boolean {
  return cityWorldPointInsideFootprint(point, building.position, building.width + 0.2, building.depth + 0.2);
}

function pointTouchesRoadCell(point: CityWorldPoint, road: CityWorldRoadSegment): boolean {
  return cityWorldPointDistanceToSegment(point, road.from, road.to) <= road.width + 0.35;
}

function deriveTraySafeBandPressure(
  frame: CityWorldViewportFrame,
  lots: readonly CityWorldLot[],
  roads: readonly CityWorldRoadSegment[],
  buildings: readonly CityWorldBuilding[],
  props: readonly CityWorldProp[],
  pins: readonly CityWorldPin[],
  actors: readonly CityWorldActor[],
): number {
  const bandMinY = frame.minY + (frame.maxY - frame.minY) * 0.68;
  const bandArea = Math.max(1, (frame.maxX - frame.minX) * (frame.maxY - bandMinY));
  const lotArea = lots.filter((lot) => lot.position.y >= bandMinY).reduce((sum, lot) => sum + lot.width * lot.depth, 0);
  const roadArea = roads
    .filter((road) => road.from.y >= bandMinY || road.to.y >= bandMinY)
    .reduce((sum, road) => sum + cityWorldSegmentLength(road.from, road.to) * road.width, 0);
  const buildingArea = buildings.filter((building) => building.position.y >= bandMinY).reduce((sum, building) => sum + building.width * building.depth, 0);
  const markerPressure = props.filter((prop) => prop.position.y >= bandMinY).length * 0.16 +
    pins.filter((pin) => pin.anchor.y >= bandMinY).length * 0.5 +
    actors.filter((actor) => actor.position.y >= bandMinY).length * 0.65;
  return cityWorldClamp((lotArea * 0.2 + roadArea * 0.32 + buildingArea + markerPressure) / bandArea, 0, 1);
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

function countBy<T>(items: readonly T[], keyOf: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])));
}

function roundTerrainMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
