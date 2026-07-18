import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldCameraPreset,
  CityWorldChunkEpoch,
  CityWorldLodBand,
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
  type CityWorldRenderCommandBuffer,
  type CityWorldRenderCommandBufferOptions,
  type CityWorldRenderCommandKind,
  type CityWorldRenderLayerId,
} from "./cityWorldRenderCommands.js";

/**
 * Id-indexed lookup maps for every scene item collection. Frame culling and
 * chunk anchoring resolve command sourceIds through this index in O(1) —
 * the previous per-command `items.find` linear scans made every window
 * compile O(commands × items).
 */
export type CityWorldSceneItemIndex = {
  terrainTiles: Map<string, CityWorldTerrainTile>;
  roadSegments: Map<string, CityWorldRoadSegment>;
  lots: Map<string, CityWorldLot>;
  buildings: Map<string, CityWorldBuilding>;
  props: Map<string, CityWorldProp>;
  actors: Map<string, CityWorldActor>;
  places: Map<string, CityWorldPlace>;
  pins: Map<string, CityWorldPin>;
};

export function buildCityWorldSceneItemIndex(scene: CityWorldScene): CityWorldSceneItemIndex {
  return {
    terrainTiles: byId(scene.terrainTiles),
    roadSegments: byId(scene.roadSegments),
    lots: byId(scene.lots),
    buildings: byId(scene.buildings),
    props: byId(scene.props),
    actors: byId(scene.actors),
    places: byId(scene.places),
    pins: byId(scene.pins),
  };
}

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export type CityWorldSceneWindowBudgetProfileId =
  | "public_playable_window"
  | "shell_empty_window"
  | "hidden_draft_window"
  | "generated_draft_window";

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
  /**
   * The band this window was filtered for (0.78-R). Present only when the caller
   * supplied a `committedBand`; absent means no band filter was applied (legacy
   * behavior — every command that touches the frame is visible).
   */
  committedBand?: CityWorldLodBand;
  /**
   * The pinned chunk manifest epoch (0.78-R2), passed through verbatim from the
   * options so the renderer can reject stale commits. Present only when supplied.
   */
  chunkEpoch?: CityWorldChunkEpoch;
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
  /**
   * Committed zoom band (0.78-R) from the band controller. When set, only
   * commands at or below this band render (a band shows its own layer plus
   * everything beneath it; untagged commands are FAR and always render). When
   * omitted, no band filter is applied — byte-identical to legacy behavior.
   */
  committedBand?: CityWorldLodBand;
  /** Pinned chunk manifest epoch (0.78-R2), threaded to the result verbatim. */
  chunkEpoch?: CityWorldChunkEpoch;
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
    // 0.74F: the curated prop kit is public; density is capped instead of
    // banned per kind.
    maxPropCommands: 90,
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
  generated_draft_window: {
    profileId: "generated_draft_window",
    maxVisibleCommandRatio: 0.82,
    maxVisibleBudgetWeight: 1200,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxActorCommands: 0,
    // E2b: raised 20 -> 36 (the public window's own prop allowance) so the E2
    // vegetation grammar is visible instead of window-clipped. Evidence at the
    // raise: worst visible budget weight 715/1200 and worst REAL Pixi Graphics
    // 938/1600 (emulator perf matrix) — 16 more visible props ≈ +32 Graphics,
    // comfortably inside both ceilings. History: 0.75R observed 13-16.
    maxPropCommands: 36,
    minTerrainCommands: 50,
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
  return compileChunkIndexFromBuffer(
    scene,
    buildCityWorldRenderCommandBuffer(scene, options),
    buildCityWorldSceneItemIndex(scene),
    options.chunkSize ?? CITY_WORLD_SCENE_WINDOW_DEFAULT_CHUNK_SIZE,
  );
}

function compileChunkIndexFromBuffer(
  scene: CityWorldScene,
  commandBuffer: CityWorldRenderCommandBuffer,
  itemIndex: CityWorldSceneItemIndex,
  chunkSize: number,
): CityWorldSceneChunkIndex {
  const chunkMap = new Map<string, CityWorldSceneChunk>();
  // Per-chunk membership Sets during the build; the public array shape is
  // serialized at the end (Array.includes per insert was O(n²) per chunk).
  const memberSets = new Map<string, Set<string>>();

  for (const command of commandBuffer.commands) {
    for (const point of commandAnchorPoints(itemIndex, scene, command)) {
      const id = chunkIdForPoint(scene, point, chunkSize);
      const chunk = getOrCreateChunk(chunkMap, scene, id, point, chunkSize);
      let members = memberSets.get(id);
      if (!members) {
        members = new Set();
        memberSets.set(id, members);
      }
      if (!members.has(command.id)) {
        members.add(command.id);
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
  // One-shot path: build the shared artifacts once and compile. Callers that
  // recompile the same scene repeatedly (viewport streaming) should hold a
  // createCityWorldSceneWindowCompiler instead.
  const chunkSize = options.chunkSize ?? CITY_WORLD_SCENE_WINDOW_DEFAULT_CHUNK_SIZE;
  const commandBuffer = buildCityWorldRenderCommandBuffer(scene, options);
  const itemIndex = buildCityWorldSceneItemIndex(scene);
  const chunkIndex = compileChunkIndexFromBuffer(scene, commandBuffer, itemIndex, chunkSize);
  return compileWindowFromArtifacts(scene, cameraPresetOrId, options, { commandBuffer, itemIndex, chunkIndex, chunkSize });
}

type SceneWindowArtifacts = {
  commandBuffer: CityWorldRenderCommandBuffer;
  itemIndex: CityWorldSceneItemIndex;
  chunkIndex: CityWorldSceneChunkIndex;
  chunkSize: number;
};

/**
 * Frame-independent compile artifacts (command buffer, item index, chunk
 * index) are memoized per scene; `windowFor` only re-runs the frame filter.
 * This is what makes streaming-window pan refreshes cheap.
 */
export function createCityWorldSceneWindowCompiler(
  scene: CityWorldScene,
  options: CityWorldSceneWindowOptions = {},
): {
  windowFor: (
    cameraPresetOrId: CityWorldCameraPreset | CityWorldCameraPreset["id"],
    viewportFrame?: CityWorldViewportFrame,
    bandOptions?: CityWorldSceneWindowBandOptions,
  ) => CityWorldSceneWindow;
  itemIndex: CityWorldSceneItemIndex;
} {
  const chunkSize = options.chunkSize ?? CITY_WORLD_SCENE_WINDOW_DEFAULT_CHUNK_SIZE;
  const commandBuffer = buildCityWorldRenderCommandBuffer(scene, options);
  const itemIndex = buildCityWorldSceneItemIndex(scene);
  const chunkIndex = compileChunkIndexFromBuffer(scene, commandBuffer, itemIndex, chunkSize);
  const artifacts: SceneWindowArtifacts = { commandBuffer, itemIndex, chunkIndex, chunkSize };
  // The command buffer + chunk index are band-INDEPENDENT (each command carries
  // its own lodBand tag), so memoizing them is correct: the committed band is a
  // per-call filter applied downstream in compileWindowFromArtifacts. Passing a
  // different band on a later call re-runs the filter over the same artifacts —
  // there is no window-result cache to go stale across bands.
  return {
    windowFor: (cameraPresetOrId, viewportFrame, bandOptions) =>
      compileWindowFromArtifacts(
        scene,
        cameraPresetOrId,
        mergeSceneWindowBandOptions(options, viewportFrame, bandOptions),
        artifacts,
      ),
    itemIndex,
  };
}

/** Per-call band inputs for a memoized compiler's `windowFor` (0.78-R). */
export type CityWorldSceneWindowBandOptions = {
  committedBand?: CityWorldLodBand;
  chunkEpoch?: CityWorldChunkEpoch;
};

function mergeSceneWindowBandOptions(
  base: CityWorldSceneWindowOptions,
  viewportFrame: CityWorldViewportFrame | undefined,
  bandOptions: CityWorldSceneWindowBandOptions | undefined,
): CityWorldSceneWindowOptions {
  // Per-call inputs override the compiler-level defaults; nothing is written as
  // `undefined` (exactOptionalPropertyTypes) so an omitted band stays omitted.
  const merged: CityWorldSceneWindowOptions = { ...base };
  if (viewportFrame !== undefined) merged.viewportFrame = viewportFrame;
  if (bandOptions?.committedBand !== undefined) merged.committedBand = bandOptions.committedBand;
  if (bandOptions?.chunkEpoch !== undefined) merged.chunkEpoch = bandOptions.chunkEpoch;
  return merged;
}

function compileWindowFromArtifacts(
  scene: CityWorldScene,
  cameraPresetOrId: CityWorldCameraPreset | CityWorldCameraPreset["id"],
  options: CityWorldSceneWindowOptions,
  artifacts: SceneWindowArtifacts,
): CityWorldSceneWindow {
  const { commandBuffer, itemIndex, chunkIndex, chunkSize } = artifacts;
  const preset = typeof cameraPresetOrId === "string"
    ? scene.cameraPresets.find((item) => item.id === cameraPresetOrId)
    : cameraPresetOrId;
  if (!preset) {
    throw new Error(`Unknown CityWorld camera preset: ${String(cameraPresetOrId)}`);
  }

  const frame = options.viewportFrame ?? cityWorldViewportFrameForCameraPreset(preset);
  const committedBand = options.committedBand;
  // Band filter (0.78-R): a command survives if it touches the frame AND its band
  // is at or below the committed band. When committedBand is undefined the band
  // predicate is a constant true, so the visible set is exactly the legacy
  // frame-culled set — byte-identical to before this feature.
  const visibleCommands = commandBuffer.commands.filter(
    (command) => commandTouchesFrame(itemIndex, command, frame) && commandWithinBand(command, committedBand),
  );
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
    ...(committedBand !== undefined ? { committedBand } : {}),
    ...(options.chunkEpoch !== undefined ? { chunkEpoch: options.chunkEpoch } : {}),
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

function commandTouchesFrame(index: CityWorldSceneItemIndex, command: CityWorldRenderCommand, frame: CityWorldViewportFrame): boolean {
  switch (command.kind) {
    case "terrain_tile": {
      const item = index.terrainTiles.get(command.sourceId);
      return item ? cityWorldPointInsideFrame(item.position, frame) : false;
    }
    case "road_segment": {
      const item = index.roadSegments.get(command.sourceId);
      return item ? cityWorldSegmentTouchesFrame(item.from, item.to, frame) : false;
    }
    case "lot": {
      const item = index.lots.get(command.sourceId);
      return item ? footprintTouchesFrame(item.position, item.width, item.depth, frame) : false;
    }
    case "building": {
      const item = index.buildings.get(command.sourceId);
      return item ? footprintTouchesFrame(item.position, item.width, item.depth, frame) : false;
    }
    case "prop": {
      const item = index.props.get(command.sourceId);
      return item ? cityWorldPointInsideFrame(item.position, frame) : false;
    }
    case "actor": {
      const item = index.actors.get(command.sourceId);
      return item ? cityWorldPointInsideFrame(item.position, frame) || item.path.some((point) => cityWorldPointInsideFrame(point, frame)) : false;
    }
    case "place_marker":
    case "place_label": {
      const item = index.places.get(command.sourceId);
      return item ? cityWorldPointInsideFrame(item.anchor, frame) : false;
    }
    case "pin": {
      const item = index.pins.get(command.sourceId);
      return item ? cityWorldPointInsideFrame(item.anchor, frame) : false;
    }
    case "engine_debug_overlay":
      return true;
  }
}

function commandAnchorPoints(index: CityWorldSceneItemIndex, scene: CityWorldScene, command: CityWorldRenderCommand): CityWorldPoint[] {
  switch (command.kind) {
    case "terrain_tile": {
      const item = index.terrainTiles.get(command.sourceId);
      return item ? [item.position] : [];
    }
    case "road_segment": {
      const item = index.roadSegments.get(command.sourceId);
      return item ? [item.from, item.to] : [];
    }
    case "lot": {
      const item = index.lots.get(command.sourceId);
      return item ? [item.position] : [];
    }
    case "building": {
      const item = index.buildings.get(command.sourceId);
      return item ? [item.position] : [];
    }
    case "prop": {
      const item = index.props.get(command.sourceId);
      return item ? [item.position] : [];
    }
    case "actor": {
      const item = index.actors.get(command.sourceId);
      return item ? [item.position, ...item.path] : [];
    }
    case "place_marker":
    case "place_label": {
      const item = index.places.get(command.sourceId);
      return item ? [item.anchor] : [];
    }
    case "pin": {
      const item = index.pins.get(command.sourceId);
      return item ? [item.anchor] : [];
    }
    case "engine_debug_overlay":
      return [{ x: scene.bounds.minX, y: scene.bounds.minY, z: 0 }, { x: scene.bounds.maxX, y: scene.bounds.maxY, z: 0 }];
  }
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

/**
 * Band ordinal: far=0, mid=1, near=2. Untagged content (undefined) ranks as FAR,
 * so it always survives the band filter — legacy scenes never disappear.
 */
export function cityWorldLodBandRank(band: CityWorldLodBand | undefined): number {
  return band === "near" ? 2 : band === "mid" ? 1 : 0;
}

/**
 * Does a command render at the committed band? A committed band shows its own
 * layer plus everything below it, so a command survives when its band rank is at
 * or below the committed rank. `committedBand === undefined` disables the filter.
 */
function commandWithinBand(command: CityWorldRenderCommand, committedBand: CityWorldLodBand | undefined): boolean {
  if (committedBand === undefined) return true;
  return cityWorldLodBandRank(command.lodBand) <= cityWorldLodBandRank(committedBand);
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
