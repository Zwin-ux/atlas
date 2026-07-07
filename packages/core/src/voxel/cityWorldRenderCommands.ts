import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldCameraPreset,
  CityWorldLot,
  CityWorldPin,
  CityWorldPlace,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldTerrainTile,
} from "./cityWorldTypes.js";

export type CityWorldRenderLayerId =
  | "terrain"
  | "roads"
  | "lots"
  | "buildings"
  | "props"
  | "actors"
  | "markers"
  | "labels"
  | "debug";

export type CityWorldRenderCommandKind =
  | "terrain_tile"
  | "road_segment"
  | "lot"
  | "building"
  | "prop"
  | "actor"
  | "place_marker"
  | "pin"
  | "place_label"
  | "engine_debug_overlay";

export type CityWorldRenderBudgetProfileId = "engine_beta_public" | "shell_empty_state" | "hidden_draft_probe";

export type CityWorldRenderCommand = {
  id: string;
  layerId: CityWorldRenderLayerId;
  kind: CityWorldRenderCommandKind;
  sourceId: string;
  zOrder: number;
  budgetWeight: number;
  interactive: boolean;
  animated: boolean;
  spriteBacked: boolean;
  publicClutterRisk: boolean;
};

export type CityWorldRenderLayerSummary = {
  layerId: CityWorldRenderLayerId;
  commandCount: number;
  budgetWeight: number;
  interactiveCommandCount: number;
  animatedCommandCount: number;
  spriteBackedCommandCount: number;
  publicClutterCommandCount: number;
};

export type CityWorldRenderCommandBuffer = {
  type: "cityWorldRenderCommandBuffer";
  update: "prealpha-0.27e-render-command-pipeline-layer-budget";
  sceneId: string;
  layerOrder: CityWorldRenderLayerId[];
  commands: CityWorldRenderCommand[];
  layers: Record<CityWorldRenderLayerId, CityWorldRenderLayerSummary>;
  metrics: {
    totalCommands: number;
    totalBudgetWeight: number;
    publicClutterCommandCount: number;
    interactiveCommandCount: number;
    animatedCommandCount: number;
    spriteBackedCommandCount: number;
    terrainCommandCount: number;
    roadCommandCount: number;
    lotCommandCount: number;
    buildingCommandCount: number;
    propCommandCount: number;
    actorCommandCount: number;
    markerCommandCount: number;
    labelCommandCount: number;
    debugCommandCount: number;
    orderedLayerCount: number;
  };
};

export type CityWorldRenderCommandBufferOptions = {
  includeLabels?: boolean;
  includeDebug?: boolean;
};

export type CityWorldRenderLayerBudget = {
  profileId: CityWorldRenderBudgetProfileId;
  maxTotalBudgetWeight: number;
  maxPublicClutterCommands: number;
  maxDebugCommands: number;
  maxLabelCommands: number;
  maxPropCommands: number;
  maxActorCommands: number;
  maxMarkerCommands: number;
  minTerrainCommands: number;
  minRoadCommands: number;
  minLotCommands: number;
  minBuildingCommands: number;
  minMarkerCommands: number;
  requiredPlayable?: boolean;
  forbidPins?: boolean;
  forbidActors?: boolean;
};

export type CityWorldRenderLayerBudgetResult = {
  type: "cityWorldRenderLayerBudgetResult";
  profileId: CityWorldRenderBudgetProfileId;
  passed: boolean;
  blockers: string[];
  warnings: string[];
  metrics: CityWorldRenderCommandBuffer["metrics"];
  layerSummaries: CityWorldRenderLayerSummary[];
};

export const CITY_WORLD_RENDER_LAYER_ORDER = [
  "terrain",
  "roads",
  "lots",
  "buildings",
  "props",
  "actors",
  "markers",
  "labels",
  "debug",
] as const satisfies readonly CityWorldRenderLayerId[];

export const CITY_WORLD_RENDER_LAYER_BUDGETS: Record<CityWorldRenderBudgetProfileId, CityWorldRenderLayerBudget> = {
  engine_beta_public: {
    profileId: "engine_beta_public",
    maxTotalBudgetWeight: 5200,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxLabelCommands: 24,
    maxPropCommands: 36,
    maxActorCommands: 1,
    maxMarkerCommands: 36,
    minTerrainCommands: 200,
    minRoadCommands: 8,
    minLotCommands: 8,
    minBuildingCommands: 16,
    minMarkerCommands: 1,
    requiredPlayable: true,
  },
  shell_empty_state: {
    profileId: "shell_empty_state",
    maxTotalBudgetWeight: 1400,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxLabelCommands: 0,
    maxPropCommands: 0,
    maxActorCommands: 0,
    maxMarkerCommands: 0,
    minTerrainCommands: 24,
    minRoadCommands: 0,
    minLotCommands: 0,
    minBuildingCommands: 0,
    minMarkerCommands: 0,
    requiredPlayable: false,
    forbidPins: true,
    forbidActors: true,
  },
  hidden_draft_probe: {
    profileId: "hidden_draft_probe",
    maxTotalBudgetWeight: 3600,
    maxPublicClutterCommands: 0,
    maxDebugCommands: 0,
    maxLabelCommands: 12,
    maxPropCommands: 0,
    maxActorCommands: 0,
    maxMarkerCommands: 12,
    minTerrainCommands: 80,
    minRoadCommands: 4,
    minLotCommands: 4,
    minBuildingCommands: 4,
    minMarkerCommands: 0,
    requiredPlayable: false,
    forbidPins: true,
    forbidActors: true,
  },
};

export function buildCityWorldRenderCommandBuffer(
  scene: CityWorldScene,
  options: CityWorldRenderCommandBufferOptions = {},
): CityWorldRenderCommandBuffer {
  const includeLabels = options.includeLabels ?? true;
  const includeDebug = options.includeDebug ?? false;
  const commands: CityWorldRenderCommand[] = [];

  for (const tile of scene.terrainTiles) {
    commands.push(renderCommand("terrain", "terrain_tile", tile, 0, 1));
  }

  for (const road of scene.roadSegments) {
    commands.push(renderCommand("roads", "road_segment", road, 0, road.kind === "avenue" ? 3 : 2));
  }

  for (const lot of scene.lots) {
    commands.push(renderCommand("lots", "lot", lot, 0, 2, { spriteBacked: Boolean(lot.spriteKey) }));
  }

  for (const building of scene.buildings) {
    commands.push(renderCommand("buildings", "building", building, footprintZOrder(building), building.detailLevel === "high" ? 5 : 4, { spriteBacked: Boolean(building.spriteKey) }));
  }

  for (const prop of scene.props) {
    commands.push(renderCommand("props", "prop", prop, pointZOrder(prop.position), 1, {
      animated: prop.kind === "cloud" || prop.kind === "water_shimmer",
      publicClutterRisk: forbiddenPublicPropKinds.has(prop.kind),
      spriteBacked: Boolean(prop.spriteKey),
    }));
  }

  for (const actor of scene.actors) {
    commands.push(renderCommand("actors", "actor", actor, pointZOrder(actor.position), actor.kind === "clawd" ? 3 : 2, {
      animated: actor.kind !== "clawd",
      publicClutterRisk: actor.kind === "car" || actor.kind === "walker",
      spriteBacked: Boolean(actor.spriteKey),
    }));
  }

  for (const place of scene.places) {
    commands.push(renderCommand("markers", "place_marker", place, 0, 2, { interactive: true }));
  }

  for (const pin of scene.pins) {
    commands.push(renderCommand("markers", "pin", pin, 0, 1, { spriteBacked: Boolean(pin.spriteKey) }));
  }

  if (includeLabels) {
    for (const place of scene.places) {
      commands.push(renderCommand("labels", "place_label", place, 0, 1));
    }
  }

  if (includeDebug) {
    commands.push({
      id: `debug:${scene.id}:engine-overlay`,
      layerId: "debug",
      kind: "engine_debug_overlay",
      sourceId: scene.id,
      zOrder: Number.MAX_SAFE_INTEGER,
      budgetWeight: 1,
      interactive: false,
      animated: false,
      spriteBacked: false,
      publicClutterRisk: false,
    });
  }

  const orderedCommands = commands.sort((first, second) => {
    const layerDelta = layerRank(first.layerId) - layerRank(second.layerId);
    if (layerDelta !== 0) return layerDelta;
    const zDelta = first.zOrder - second.zOrder;
    if (zDelta !== 0) return zDelta;
    return 0;
  });

  const layers = layerSummaries(orderedCommands);
  const metrics = renderCommandMetrics(orderedCommands, layers);

  return {
    type: "cityWorldRenderCommandBuffer",
    update: "prealpha-0.27e-render-command-pipeline-layer-budget",
    sceneId: scene.id,
    layerOrder: [...CITY_WORLD_RENDER_LAYER_ORDER],
    commands: orderedCommands,
    layers,
    metrics,
  };
}

export function evaluateCityWorldRenderLayerBudget(
  buffer: CityWorldRenderCommandBuffer,
  budgetOrProfileId: CityWorldRenderLayerBudget | CityWorldRenderBudgetProfileId = "engine_beta_public",
  scene?: CityWorldScene,
): CityWorldRenderLayerBudgetResult {
  const budget = typeof budgetOrProfileId === "string" ? CITY_WORLD_RENDER_LAYER_BUDGETS[budgetOrProfileId] : budgetOrProfileId;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const { metrics } = buffer;

  requireAtMost(blockers, metrics.totalBudgetWeight, budget.maxTotalBudgetWeight, "totalBudgetWeight");
  requireAtMost(blockers, metrics.publicClutterCommandCount, budget.maxPublicClutterCommands, "publicClutterCommandCount");
  requireAtMost(blockers, metrics.debugCommandCount, budget.maxDebugCommands, "debugCommandCount");
  requireAtMost(blockers, metrics.labelCommandCount, budget.maxLabelCommands, "labelCommandCount");
  requireAtMost(blockers, metrics.propCommandCount, budget.maxPropCommands, "propCommandCount");
  requireAtMost(blockers, metrics.actorCommandCount, budget.maxActorCommands, "actorCommandCount");
  requireAtMost(blockers, metrics.markerCommandCount, budget.maxMarkerCommands, "markerCommandCount");
  requireAtLeast(blockers, metrics.terrainCommandCount, budget.minTerrainCommands, "terrainCommandCount");
  requireAtLeast(blockers, metrics.roadCommandCount, budget.minRoadCommands, "roadCommandCount");
  requireAtLeast(blockers, metrics.lotCommandCount, budget.minLotCommands, "lotCommandCount");
  requireAtLeast(blockers, metrics.buildingCommandCount, budget.minBuildingCommands, "buildingCommandCount");
  requireAtLeast(blockers, metrics.markerCommandCount, budget.minMarkerCommands, "markerCommandCount");

  if (scene) {
    if (budget.requiredPlayable === true && scene.coverage?.playable === false) {
      blockers.push(`${budget.profileId} cannot be applied to an explicitly non-playable scene.`);
    }
    if (budget.requiredPlayable === false && scene.coverage?.playable === true) {
      blockers.push(`${budget.profileId} must not be applied to a playable scene.`);
    }
    if (budget.forbidPins === true && scene.pins.length > 0) {
      blockers.push(`${budget.profileId} forbids pins; got ${scene.pins.length}.`);
    }
    if (budget.forbidActors === true && scene.actors.length > 0) {
      blockers.push(`${budget.profileId} forbids actors; got ${scene.actors.length}.`);
    }
  } else {
    warnings.push("Scene was not provided, so playable and pin/actor boundary checks were skipped.");
  }

  const observedLayerOrder = unique(buffer.commands.map((command) => command.layerId));
  if (observedLayerOrder.some((layerId, index) => layerRank(layerId) < layerRank(observedLayerOrder[index - 1] ?? layerId))) {
    blockers.push("Render command buffer layer order is not monotonic.");
  }

  return {
    type: "cityWorldRenderLayerBudgetResult",
    profileId: budget.profileId,
    passed: blockers.length === 0,
    blockers,
    warnings,
    metrics,
    layerSummaries: CITY_WORLD_RENDER_LAYER_ORDER.map((layerId) => buffer.layers[layerId]),
  };
}

// 0.74F clutter-contract revision (user-approved): the curated prop kit
// (bench, streetlight, fountain, sign, dock, boat, water tower) graduates to
// public scenes — density is gated by the scene-window maxPropCommands cap
// instead of a blanket kind ban. Cars and clouds stay forbidden.
const forbiddenPublicPropKinds = new Set<CityWorldProp["kind"]>(["parked_car", "cloud"]);

function renderCommand(
  layerId: CityWorldRenderLayerId,
  kind: CityWorldRenderCommandKind,
  source: CityWorldTerrainTile | CityWorldRoadSegment | CityWorldLot | CityWorldBuilding | CityWorldProp | CityWorldActor | CityWorldPlace | CityWorldPin,
  zOrder: number,
  budgetWeight: number,
  flags: Partial<Pick<CityWorldRenderCommand, "interactive" | "animated" | "spriteBacked" | "publicClutterRisk">> = {},
): CityWorldRenderCommand {
  return {
    id: `${layerId}:${kind}:${source.id}`,
    layerId,
    kind,
    sourceId: source.id,
    zOrder,
    budgetWeight,
    interactive: flags.interactive ?? false,
    animated: flags.animated ?? false,
    spriteBacked: flags.spriteBacked ?? Boolean("spriteKey" in source && source.spriteKey),
    publicClutterRisk: flags.publicClutterRisk ?? false,
  };
}

function layerSummaries(commands: CityWorldRenderCommand[]): Record<CityWorldRenderLayerId, CityWorldRenderLayerSummary> {
  const summaries = Object.fromEntries(CITY_WORLD_RENDER_LAYER_ORDER.map((layerId) => [
    layerId,
    {
      layerId,
      commandCount: 0,
      budgetWeight: 0,
      interactiveCommandCount: 0,
      animatedCommandCount: 0,
      spriteBackedCommandCount: 0,
      publicClutterCommandCount: 0,
    },
  ])) as Record<CityWorldRenderLayerId, CityWorldRenderLayerSummary>;

  for (const command of commands) {
    const summary = summaries[command.layerId];
    summary.commandCount += 1;
    summary.budgetWeight += command.budgetWeight;
    if (command.interactive) summary.interactiveCommandCount += 1;
    if (command.animated) summary.animatedCommandCount += 1;
    if (command.spriteBacked) summary.spriteBackedCommandCount += 1;
    if (command.publicClutterRisk) summary.publicClutterCommandCount += 1;
  }

  return summaries;
}

function renderCommandMetrics(
  commands: CityWorldRenderCommand[],
  layers: Record<CityWorldRenderLayerId, CityWorldRenderLayerSummary>,
): CityWorldRenderCommandBuffer["metrics"] {
  const commandCount = (layerId: CityWorldRenderLayerId) => layers[layerId].commandCount;
  return {
    totalCommands: commands.length,
    totalBudgetWeight: commands.reduce((sum, command) => sum + command.budgetWeight, 0),
    publicClutterCommandCount: commands.filter((command) => command.publicClutterRisk).length,
    interactiveCommandCount: commands.filter((command) => command.interactive).length,
    animatedCommandCount: commands.filter((command) => command.animated).length,
    spriteBackedCommandCount: commands.filter((command) => command.spriteBacked).length,
    terrainCommandCount: commandCount("terrain"),
    roadCommandCount: commandCount("roads"),
    lotCommandCount: commandCount("lots"),
    buildingCommandCount: commandCount("buildings"),
    propCommandCount: commandCount("props"),
    actorCommandCount: commandCount("actors"),
    markerCommandCount: commandCount("markers"),
    labelCommandCount: commandCount("labels"),
    debugCommandCount: commandCount("debug"),
    orderedLayerCount: unique(commands.map((command) => command.layerId)).length,
  };
}

function pointZOrder(point: { x: number; y: number }): number {
  return point.x + point.y;
}

function footprintZOrder(item: CityWorldLot | CityWorldBuilding): number {
  return item.position.x + item.position.y + Math.max(item.width, item.depth) * 0.001;
}

function layerRank(layerId: CityWorldRenderLayerId): number {
  return CITY_WORLD_RENDER_LAYER_ORDER.indexOf(layerId);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function requireAtMost(blockers: string[], value: number, ceiling: number, label: string) {
  if (value > ceiling) blockers.push(`${label} must be <= ${ceiling}; got ${value}.`);
}

function requireAtLeast(blockers: string[], value: number, floor: number, label: string) {
  if (value < floor) blockers.push(`${label} must be >= ${floor}; got ${value}.`);
}
