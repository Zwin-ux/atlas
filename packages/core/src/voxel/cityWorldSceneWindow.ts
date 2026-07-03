import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldCameraPreset,
  CityWorldLot,
  CityWorldPin,
  CityWorldPlace,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldTerrainTile,
} from "./cityWorldTypes.js";
import {
  cityWorldPointInsideFrame,
  cityWorldSegmentTouchesFrame,
  cityWorldViewportFrameForCameraPreset,
  type CityWorldViewportFrame,
} from "./cityWorldBasis.js";
import {
  buildCityWorldRenderCommandBuffer,
  type CityWorldRenderCommand,
  type CityWorldRenderCommandBufferOptions,
  type CityWorldRenderCommandKind,
  type CityWorldRenderLayerId,
} from "./cityWorldRenderCommands.js";

export type CityWorldSceneWindowBudgetProfileId = "public_playable_window" | "shell_empty_window" | "hidden_draft_window";

export type CityWorldSceneChunk = {
  id: string;
  bounds: CityWorldViewportFrame;
  commandIds: string[];
  layerCommandCounts: Record<CityWorldRenderLayerId, number>;
  budgetWeight: number;
};

export type CityWorldSceneChunkIndex = {
  type: "cityWorldSceneChunkIndex";
  update: "prealpha-0.28e-tile-chunk-scene-window-compiler";
  sceneId: string;
  chunkSize: number;
  chunkCount: number;
  totalCommandCount: number;
  chunks: CityWorldSceneChunk[];
};

export type CityWorldSceneWindow = {
  type: "cityWorldSceneWindow";
  update: "prealpha-0.28e-tile-chunk-scene-window-compiler";
  sceneId: string;
  cameraPresetId: CityWorldCameraPreset["id"];
  frame: CityWorldViewportFrame;
  chunkSize: number;
  chunkIds: string[];
  visibleCommands: CityWorldRenderCommand[];
  layerCommandCounts: Record<CityWorldRenderLayerId, number>;
  metrics: {
    totalSceneCommandCount: number;
    visibleCommandCount: number;
    visibleBudgetWeight: number;
    commandVisibilityRatio: number;
    terrainCommandCount: number;
    roadCommandCount: number;
    lotCommandCount: number;
    buildingCommandCount: number;
    markerCommandCount: number;
    actorCommandCount: number;
    propCommandCount: number;
    debugCommandCount: number;
    publicClutterCommandCount: number;
    chunkCoverageRatio: number;
  };
};

export type CityWorldSceneWindowBudget = {
  profileId: CityWorldSceneWindowBudgetProfileId;
  maxVisibleCommandRatio: number;
  maxVisibleBudgetWeight: number;
  maxPublicClutterCommands: number;
  maxDebugCommands: number;
  maxActorCommands?: number;
  maxPropCommands?: number;
  minTerrainCommands: number;
  minRoadCommands: number;
  minLotCommands: number;
  minBuildingCommands: number;
  minMarkerCommands: number;
  requireNonPlayable?: boolean;
  forbidPins?: boolean;
  forbidActors?: boolean;
};

export type CityWorldSceneWindowBudgetResult = {
  type: "cityWorldSceneWindowBudgetResult";
  profileId: CityWorldSceneWindowBudgetProfileId;
  passed: boolean;
  blockers: string[];
  metrics: CityWorldSceneWindow["metrics"];
};

export type CityWorldSceneWindowOptions = CityWorldRenderCommandBufferOptions & {
  chunkSize?: number;
  viewportFrame?: CityWorldViewportFrame;
};

export const CITY_WORLD_SCENE_WINDOW_DEFAULT_CHUNK_SIZE = 8;

export const CITY_WORLD_SCENE_WINDOW_BUDGETS: Record<CityWorldSceneWindowBudgetProfileId, CityWorldSceneWindowBudget> = {
  public_playable_window: {
    profileId: "public_playable_window",
    maxVisibleCommandRatio: 0.72,
    maxVisibleBudgetWeight: 1300,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxActorCommands: 1,
    minTerrainCommands: 70,
    minRoadCommands: 1,
    minLotCommands: 1,
    minBuildingCommands: 1,
    minMarkerCommands: 1,
  },
  shell_empty_window: {
    profileId: "shell_empty_window",
    maxVisibleCommandRatio: 1,
    maxVisibleBudgetWeight: 500,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxActorCommands: 0,
    maxPropCommands: 0,
    minTerrainCommands: 24,
    minRoadCommands: 0,
    minLotCommands: 0,
    minBuildingCommands: 0,
    minMarkerCommands: 0,
    requireNonPlayable: true,
    forbidPins: true,
    forbidActors: true,
  },
  hidden_draft_window: {
    profileId: "hidden_draft_window",
    maxVisibleCommandRatio: 0.82,
    maxVisibleBudgetWeight: 900,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxActorCommands: 0,
    maxPropCommands: 0,
    minTerrainCommands: 40,
    minRoadCommands: 1,
    minLotCommands: 1,
    minBuildingCommands: 1,
    minMarkerCommands: 0,
    requireNonPlayable: true,
    forbidPins: true,
    forbidActors: true,
  },
};

export function compileCityWorldSceneChunkIndex(
  scene: CityWorldScene,
  options: CityWorldSceneWindowOptions = {},
): CityWorldSceneChunkIndex {
  const chunkSize = options.chunkSize ?? CITY_WORLD_SCENE_WINDOW_DEFAULT_CHUNK_SIZE;
  const commandBuffer = buildCityWorldRenderCommandBuffer(scene, options);
  const chunkMap = new Map<string, CityWorldSceneChunk>();

  for (const command of commandBuffer.commands) {
    for (const point of commandAnchorPoints(scene, command)) {
      const id = chunkIdForPoint(scene, point, chunkSize);
      const chunk = getOrCreateChunk(chunkMap, scene, id, point, chunkSize);
      if (!chunk.commandIds.includes(command.id)) {
        chunk.commandIds.push(command.id);
        chunk.layerCommandCounts[command.layerId] += 1;
        chunk.budgetWeight += command.budgetWeight;
      }
    }
  }

  const chunks = [...chunkMap.values()].sort((first, second) => first.id.localeCompare(second.id));
  return {
    type: "cityWorldSceneChunkIndex",
    update: "prealpha-0.28e-tile-chunk-scene-window-compiler",
    sceneId: scene.id,
    chunkSize,
    chunkCount: chunks.length,
    totalCommandCount: commandBuffer.commands.length,
    chunks,
  };
}

export function compileCityWorldSceneWindow(
  scene: CityWorldScene,
  cameraPresetOrId: CityWorldCameraPreset | CityWorldCameraPreset["id"],
  options: CityWorldSceneWindowOptions = {},
): CityWorldSceneWindow {
  const chunkSize = options.chunkSize ?? CITY_WORLD_SCENE_WINDOW_DEFAULT_CHUNK_SIZE;
  const preset = typeof cameraPresetOrId === "string"
    ? scene.cameraPresets.find((item) => item.id === cameraPresetOrId)
    : cameraPresetOrId;
  if (!preset) {
    throw new Error(`Unknown CityWorld camera preset: ${String(cameraPresetOrId)}`);
  }

  const commandBuffer = buildCityWorldRenderCommandBuffer(scene, options);
  const chunkIndex = compileCityWorldSceneChunkIndex(scene, options);
  const frame = options.viewportFrame ?? cityWorldViewportFrameForCameraPreset(preset);
  const visibleCommands = commandBuffer.commands.filter((command) => commandTouchesFrame(scene, command, frame));
  const layerCommandCounts = emptyLayerCounts();
  let visibleBudgetWeight = 0;
  for (const command of visibleCommands) {
    layerCommandCounts[command.layerId] += 1;
    visibleBudgetWeight += command.budgetWeight;
  }

  const chunkIds = chunkIndex.chunks
    .filter((chunk) => framesTouch(chunk.bounds, frame))
    .map((chunk) => chunk.id);

  return {
    type: "cityWorldSceneWindow",
    update: "prealpha-0.28e-tile-chunk-scene-window-compiler",
    sceneId: scene.id,
    cameraPresetId: preset.id,
    frame,
    chunkSize,
    chunkIds,
    visibleCommands,
    layerCommandCounts,
    metrics: {
      totalSceneCommandCount: commandBuffer.commands.length,
      visibleCommandCount: visibleCommands.length,
      visibleBudgetWeight,
      commandVisibilityRatio: roundMetric(visibleCommands.length / Math.max(1, commandBuffer.commands.length)),
      terrainCommandCount: layerCommandCounts.terrain,
      roadCommandCount: layerCommandCounts.roads,
      lotCommandCount: layerCommandCounts.lots,
      buildingCommandCount: layerCommandCounts.buildings,
      markerCommandCount: layerCommandCounts.markers,
      actorCommandCount: layerCommandCounts.actors,
      propCommandCount: layerCommandCounts.props,
      debugCommandCount: layerCommandCounts.debug,
      publicClutterCommandCount: visibleCommands.filter((command) => command.publicClutterRisk).length,
      chunkCoverageRatio: roundMetric(chunkIds.length / Math.max(1, chunkIndex.chunkCount)),
    },
  };
}

export function evaluateCityWorldSceneWindowBudget(
  window: CityWorldSceneWindow,
  budgetOrProfileId: CityWorldSceneWindowBudget | CityWorldSceneWindowBudgetProfileId,
  scene?: CityWorldScene,
): CityWorldSceneWindowBudgetResult {
  const budget = typeof budgetOrProfileId === "string" ? CITY_WORLD_SCENE_WINDOW_BUDGETS[budgetOrProfileId] : budgetOrProfileId;
  const blockers: string[] = [];
  const { metrics } = window;

  requireAtMost(blockers, metrics.commandVisibilityRatio, budget.maxVisibleCommandRatio, "commandVisibilityRatio");
  requireAtMost(blockers, metrics.visibleBudgetWeight, budget.maxVisibleBudgetWeight, "visibleBudgetWeight");
  requireAtMost(blockers, metrics.publicClutterCommandCount, budget.maxPublicClutterCommands, "publicClutterCommandCount");
  requireAtMost(blockers, metrics.debugCommandCount, budget.maxDebugCommands, "debugCommandCount");
  if (budget.maxActorCommands !== undefined) requireAtMost(blockers, metrics.actorCommandCount, budget.maxActorCommands, "actorCommandCount");
  if (budget.maxPropCommands !== undefined) requireAtMost(blockers, metrics.propCommandCount, budget.maxPropCommands, "propCommandCount");
  requireAtLeast(blockers, metrics.terrainCommandCount, budget.minTerrainCommands, "terrainCommandCount");
  requireAtLeast(blockers, metrics.roadCommandCount, budget.minRoadCommands, "roadCommandCount");
  requireAtLeast(blockers, metrics.lotCommandCount, budget.minLotCommands, "lotCommandCount");
  requireAtLeast(blockers, metrics.buildingCommandCount, budget.minBuildingCommands, "buildingCommandCount");
  requireAtLeast(blockers, metrics.markerCommandCount, budget.minMarkerCommands, "markerCommandCount");

  if (scene) {
    if (budget.requireNonPlayable && scene.coverage?.playable === true) {
      blockers.push(`${budget.profileId} requires a non-playable scene.`);
    }
    if (budget.forbidPins && scene.pins.length > 0) {
      blockers.push(`${budget.profileId} forbids scene pins; got ${scene.pins.length}.`);
    }
    if (budget.forbidActors && scene.actors.length > 0) {
      blockers.push(`${budget.profileId} forbids scene actors; got ${scene.actors.length}.`);
    }
  }

  return {
    type: "cityWorldSceneWindowBudgetResult",
    profileId: budget.profileId,
    passed: blockers.length === 0,
    blockers,
    metrics,
  };
}

function commandTouchesFrame(scene: CityWorldScene, command: CityWorldRenderCommand, frame: CityWorldViewportFrame): boolean {
  switch (command.kind) {
    case "terrain_tile":
      return pointSource(scene.terrainTiles, command.sourceId, (item) => cityWorldPointInsideFrame(item.position, frame));
    case "road_segment":
      return pointSource(scene.roadSegments, command.sourceId, (item) => cityWorldSegmentTouchesFrame(item.from, item.to, frame));
    case "lot":
      return pointSource(scene.lots, command.sourceId, (item) => footprintTouchesFrame(item.position, item.width, item.depth, frame));
    case "building":
      return pointSource(scene.buildings, command.sourceId, (item) => footprintTouchesFrame(item.position, item.width, item.depth, frame));
    case "prop":
      return pointSource(scene.props, command.sourceId, (item) => cityWorldPointInsideFrame(item.position, frame));
    case "actor":
      return pointSource(scene.actors, command.sourceId, (item) => cityWorldPointInsideFrame(item.position, frame) || item.path.some((point) => cityWorldPointInsideFrame(point, frame)));
    case "place_marker":
    case "place_label":
      return pointSource(scene.places, command.sourceId, (item) => cityWorldPointInsideFrame(item.anchor, frame));
    case "pin":
      return pointSource(scene.pins, command.sourceId, (item) => cityWorldPointInsideFrame(item.anchor, frame));
    case "engine_debug_overlay":
      return true;
  }
}

function commandAnchorPoints(scene: CityWorldScene, command: CityWorldRenderCommand): CityWorldPoint[] {
  switch (command.kind) {
    case "terrain_tile":
      return sourcePoints(scene.terrainTiles, command.sourceId, (item) => [item.position]);
    case "road_segment":
      return sourcePoints(scene.roadSegments, command.sourceId, (item) => [item.from, item.to]);
    case "lot":
      return sourcePoints(scene.lots, command.sourceId, (item) => [item.position]);
    case "building":
      return sourcePoints(scene.buildings, command.sourceId, (item) => [item.position]);
    case "prop":
      return sourcePoints(scene.props, command.sourceId, (item) => [item.position]);
    case "actor":
      return sourcePoints(scene.actors, command.sourceId, (item) => [item.position, ...item.path]);
    case "place_marker":
    case "place_label":
      return sourcePoints(scene.places, command.sourceId, (item) => [item.anchor]);
    case "pin":
      return sourcePoints(scene.pins, command.sourceId, (item) => [item.anchor]);
    case "engine_debug_overlay":
      return [{ x: scene.bounds.minX, y: scene.bounds.minY, z: 0 }, { x: scene.bounds.maxX, y: scene.bounds.maxY, z: 0 }];
  }
}

function pointSource<T extends { id: string }>(items: T[], id: string, predicate: (item: T) => boolean): boolean {
  const item = items.find((candidate) => candidate.id === id);
  return item ? predicate(item) : false;
}

function sourcePoints<T extends { id: string }>(items: T[], id: string, mapper: (item: T) => CityWorldPoint[]): CityWorldPoint[] {
  const item = items.find((candidate) => candidate.id === id);
  return item ? mapper(item) : [];
}

function footprintTouchesFrame(center: CityWorldPoint, width: number, depth: number, frame: CityWorldViewportFrame): boolean {
  return center.x + width / 2 >= frame.minX &&
    center.x - width / 2 <= frame.maxX &&
    center.y + depth / 2 >= frame.minY &&
    center.y - depth / 2 <= frame.maxY;
}

function getOrCreateChunk(
  chunkMap: Map<string, CityWorldSceneChunk>,
  scene: CityWorldScene,
  id: string,
  point: CityWorldPoint,
  chunkSize: number,
): CityWorldSceneChunk {
  const existing = chunkMap.get(id);
  if (existing) return existing;
  const minX = scene.bounds.minX + Math.floor((point.x - scene.bounds.minX) / chunkSize) * chunkSize;
  const minY = scene.bounds.minY + Math.floor((point.y - scene.bounds.minY) / chunkSize) * chunkSize;
  const chunk = {
    id,
    bounds: {
      minX,
      maxX: minX + chunkSize,
      minY,
      maxY: minY + chunkSize,
    },
    commandIds: [],
    layerCommandCounts: emptyLayerCounts(),
    budgetWeight: 0,
  };
  chunkMap.set(id, chunk);
  return chunk;
}

function chunkIdForPoint(scene: CityWorldScene, point: CityWorldPoint, chunkSize: number): string {
  const chunkX = Math.floor((point.x - scene.bounds.minX) / chunkSize);
  const chunkY = Math.floor((point.y - scene.bounds.minY) / chunkSize);
  return `chunk-${chunkX}-${chunkY}`;
}

function emptyLayerCounts(): Record<CityWorldRenderLayerId, number> {
  return {
    terrain: 0,
    roads: 0,
    lots: 0,
    buildings: 0,
    props: 0,
    actors: 0,
    markers: 0,
    labels: 0,
    debug: 0,
  };
}

function framesTouch(first: CityWorldViewportFrame, second: CityWorldViewportFrame): boolean {
  return first.maxX >= second.minX && first.minX <= second.maxX && first.maxY >= second.minY && first.minY <= second.maxY;
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function requireAtMost(blockers: string[], value: number, ceiling: number, label: string) {
  if (value > ceiling) blockers.push(`${label} must be <= ${ceiling}; got ${value}.`);
}

function requireAtLeast(blockers: string[], value: number, floor: number, label: string) {
  if (value < floor) blockers.push(`${label} must be >= ${floor}; got ${value}.`);
}
