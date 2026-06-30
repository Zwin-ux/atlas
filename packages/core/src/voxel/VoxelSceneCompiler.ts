import type { CountyMapEdge, CountyMapNode, CountyPack } from "../county/types.js";
import type {
  AtlasEdge,
  AtlasEdgeKind,
  AtlasMarker,
  AtlasMarkerKind,
  AtlasNode,
  AtlasNodeKind,
  VoxelObject,
  VoxelObjectKind,
  VoxelScene,
  VoxelTile,
  VoxelTileKind,
  VoxelWorld,
} from "./types.js";

export type CompileVoxelSceneOptions = {
  selectedNodeId?: string | undefined;
};

export function compileVoxelSceneFromCountyPack(
  pack: CountyPack,
  options: CompileVoxelSceneOptions = {},
): VoxelScene {
  const selectedNode = findSelectedNode(pack, options.selectedNodeId);
  const selectedNodeId = selectedNode.id;
  const routeNodeIds = routeFrom(pack, selectedNodeId);

  return {
    type: "voxelScene",
    id: `voxel-${pack.slug}-${selectedNodeId}-alpha`,
    county: {
      name: pack.county,
      state: pack.state,
      slug: pack.slug,
    },
    theme: "light_county",
    viewport: {
      width: 960,
      height: 560,
      originX: 310,
      originY: -545,
      tileWidth: 58,
      tileHeight: 30,
      tileDepth: 8,
    },
    tiles: createTiles(pack),
    nodes: pack.mapNodes.map(compileAtlasNode),
    edges: pack.mapEdges.map(compileAtlasEdge),
    markers: createMarkers(pack, selectedNodeId),
    objects: createObjects(pack),
    camera: {
      focusNodeId: selectedNodeId,
      initialZoom: 1,
      minZoom: 0.82,
      maxZoom: 1.34,
    },
    layers: [
      { id: "terrain", label: "Blocks", visible: true },
      { id: "routes", label: "Roads", visible: true },
      { id: "places", label: "Places", visible: true },
      { id: "stickers", label: "Stickers", visible: true },
    ],
    world: createWorld(pack, selectedNodeId),
    clawd: {
      nodeId: selectedNodeId,
      routeNodeIds,
      label: "Clawd Scout",
      status: "ready",
      mood: "idle",
      pulse: selectedNodeId === "eastvale",
    },
    panel: {
      type: "scout_report",
      title: `${selectedNode.name} County Brief`,
      focusNodeId: selectedNodeId,
      summary: `${pack.county} is loaded from the curated Alpha pack. ${selectedNode.name} is highlighted as the first playable slice.`,
      stats: [
        { label: "Curated nodes", value: String(pack.mapNodes.length), tone: "neutral" },
        { label: "Primary score", value: String(scoreFor(selectedNode)), tone: "good" },
        { label: "Source", value: "Curated", tone: "watch" },
      ],
    },
    flow: [
      { id: "county", label: "County", status: "active" },
      { id: "drop", label: "Scout drop", status: "next" },
      { id: "report", label: "Report", status: "next" },
      { id: "campaign", label: "Campaign", status: "next" },
    ],
    selectedNodeId,
  };
}

function findSelectedNode(pack: CountyPack, selectedNodeId?: string): CountyMapNode {
  const requested = selectedNodeId ? pack.mapNodes.find((node) => node.id === selectedNodeId) : undefined;
  return requested ?? pack.mapNodes.find((node) => node.id === "eastvale") ?? pack.mapNodes[0]!;
}

function compileAtlasNode(node: CountyMapNode): AtlasNode {
  return {
    id: node.id,
    label: labelForNode(node),
    kind: atlasNodeKind(node.type),
    position: { ...node.voxel, z: node.voxel.z + 1 },
    score: scoreFor(node),
    signals: node.signals,
    campaignSuggestion: node.campaignSuggestion,
  };
}

function compileAtlasEdge(edge: CountyMapEdge, index: number): AtlasEdge {
  return {
    id: `${edge.from}-${edge.to}-${index}`,
    from: edge.from,
    to: edge.to,
    kind: atlasEdgeKind(edge.type),
  };
}

function createMarkers(pack: CountyPack, selectedNodeId: string): AtlasMarker[] {
  return pack.mapNodes.map((node): AtlasMarker => ({
    id: `${markerKind(node.id, selectedNodeId)}-${node.id}`,
    nodeId: node.id,
    kind: markerKind(node.id, selectedNodeId),
    label: node.id === selectedNodeId ? "Selected county slice" : node.signals[0] ?? "Curated signal",
  }));
}

function createWorld(pack: CountyPack, selectedNodeId: string): VoxelWorld {
  const selectedNode = findSelectedNode(pack, selectedNodeId);
  const eastvaleFocusNodes = pack.mapNodes
    .filter((node) => node.id.includes("eastvale") || node.id === "apartment-cluster" || node.id === "norco")
    .map((node) => node.id);

  return {
    activeScale: "district",
    selectedDistrictId: "eastvale-district",
    nodes: [
      { id: "us", label: "United States", scale: "country", slug: "us" },
      { id: pack.state.toLowerCase(), label: stateLabel(pack.state), scale: "state", parentId: "us", slug: pack.state.toLowerCase() },
      {
        id: pack.slug,
        label: pack.county,
        scale: "county",
        parentId: pack.state.toLowerCase(),
        slug: pack.slug,
        position: { ...selectedNode.voxel, z: 0 },
      },
      {
        id: "eastvale-district",
        label: "Eastvale",
        scale: "district",
        parentId: pack.slug,
        slug: "eastvale",
        position: positionFor(pack, "eastvale"),
      },
      {
        id: "corona-corridor",
        label: "Corona Corridor",
        scale: "district",
        parentId: pack.slug,
        slug: "corona-corridor",
        position: positionFor(pack, "corona"),
      },
      ...pack.mapNodes.map((node) => ({
        id: `place-${node.id}`,
        label: labelForNode(node),
        scale: "place" as const,
        parentId: node.id === "corona" || node.id === "riverside" ? "corona-corridor" : "eastvale-district",
        position: { ...node.voxel, z: node.voxel.z + 1.3 },
      })),
    ],
    districts: [
      {
        id: "eastvale-district",
        label: "Eastvale City Slice",
        countySlug: pack.slug,
        worldNodeId: "eastvale-district",
        summary: "The playable Alpha district compiled from the Riverside curated pack.",
        playable: true,
        focusNodeIds: eastvaleFocusNodes,
        position: positionFor(pack, "eastvale"),
      },
      {
        id: "corona-corridor",
        label: "Corona Corridor",
        countySlug: pack.slug,
        worldNodeId: "corona-corridor",
        summary: "A locked county corridor preview for later expansion.",
        playable: false,
        focusNodeIds: pack.mapNodes.filter((node) => node.id === "corona" || node.id === "riverside").map((node) => node.id),
        position: positionFor(pack, "corona"),
      },
    ],
    places: pack.mapNodes.map((node) => ({
      id: `place-${node.id}`,
      label: labelForNode(node),
      kind: placeKind(node.type),
      districtId: node.id === "corona" || node.id === "riverside" ? "corona-corridor" : "eastvale-district",
      nodeId: node.id,
      position: { ...node.voxel, z: node.voxel.z + 1.32 },
      description: placeDescription(node),
      activity: Math.max(0.45, Math.min(0.92, scoreFor(node) / 100)),
    })),
    ambient: {
      timeOfDay: "midday",
      activity: "busy",
      traffic: 0.62,
      residents: 0.72,
    },
    stickers: [
      { id: "sticker-place-eastvale-favorite", placeId: "place-eastvale", kind: "favorite", label: "Start" },
    ],
    notes: [],
  };
}

function createTiles(pack: CountyPack): VoxelTile[] {
  const tiles: VoxelTile[] = [];
  const minX = Math.min(...pack.mapNodes.map((node) => node.voxel.x)) - 8;
  const minY = Math.min(...pack.mapNodes.map((node) => node.voxel.y)) - 4;
  const width = 11;
  const height = 10;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sceneX = minX + x * 2;
      const sceneY = minY + y * 2;
      tiles.push({
        id: `tile-${sceneX}-${sceneY}`,
        position: { x: sceneX, y: sceneY, z: 0 },
        kind: tileKindFor(pack, sceneX, sceneY),
        elevation: (x + y) % 4 === 0 ? 1 : 0,
      });
    }
  }

  return tiles;
}

function createObjects(pack: CountyPack): VoxelObject[] {
  return pack.mapNodes.map((node): VoxelObject => ({
    id: `object-${node.id}`,
    kind: objectKind(node.type),
    position: { ...node.voxel, z: node.voxel.z + 1.2 },
    label: labelForNode(node),
    nodeId: node.id,
    layerId: node.type === "city" || node.type === "regional_center" ? "places" : "places",
    intensity: scoreFor(node) / 100,
  }));
}

function routeFrom(pack: CountyPack, selectedNodeId: string): string[] {
  const route = [selectedNodeId];
  for (const edge of pack.mapEdges) {
    if (edge.type !== "route" && edge.type !== "regional_route") continue;
    if (edge.from === route[route.length - 1]) route.push(edge.to);
    if (route.length >= 3) break;
  }
  return route;
}

function positionFor(pack: CountyPack, nodeId: string) {
  const node = pack.mapNodes.find((item) => item.id === nodeId) ?? pack.mapNodes[0]!;
  return { ...node.voxel, z: node.voxel.z + 1 };
}

function labelForNode(node: CountyMapNode): string {
  return node.id === "eastvale" ? "Eastvale" : node.name.replace(/^Eastvale\s+/i, "");
}

function scoreFor(node: CountyMapNode): number {
  return node.scores.mobile_detailing ?? Math.max(...Object.values(node.scores));
}

function markerKind(nodeId: string, selectedNodeId: string): AtlasMarkerKind {
  if (nodeId === selectedNodeId) return "drop";
  if (nodeId === "apartment-cluster") return "risk";
  if (nodeId === "norco") return "scouted";
  return "opportunity";
}

function atlasNodeKind(type: string): AtlasNodeKind {
  if (type === "residential_cluster") return "residential_cluster";
  if (type === "commercial_plaza") return "commercial_plaza";
  if (type === "apartment_cluster") return "apartment_cluster";
  if (type === "regional_center") return "regional_center";
  return "city";
}

function atlasEdgeKind(type: string): AtlasEdgeKind {
  if (type === "regional_route") return "regional_route";
  if (type === "route") return "route";
  return "signal";
}

function placeKind(type: string) {
  if (type === "residential_cluster" || type === "apartment_cluster") return "home_area" as const;
  if (type === "commercial_plaza") return "plaza" as const;
  if (type === "regional_center") return "landmark" as const;
  return "landmark" as const;
}

function objectKind(type: string): VoxelObjectKind {
  if (type === "residential_cluster") return "home";
  if (type === "commercial_plaza") return "plaza";
  if (type === "apartment_cluster") return "warehouse";
  if (type === "regional_center") return "landmark";
  return "landmark";
}

function tileKindFor(pack: CountyPack, x: number, y: number): VoxelTileKind {
  const nearby = pack.mapNodes.find((node) => isNear(x, y, node.voxel.x, node.voxel.y));
  if (!nearby) return "open";
  if (nearby.type === "commercial_plaza" || nearby.type === "regional_center") return "commercial";
  if (nearby.type === "city" || nearby.type === "residential_cluster" || nearby.type === "apartment_cluster") return "residential";
  return "open";
}

function isNear(x: number, y: number, targetX: number, targetY: number): boolean {
  return Math.abs(x - targetX) <= 2 && Math.abs(y - targetY) <= 2;
}

function placeDescription(node: CountyMapNode): string {
  const signals = node.signals.length ? ` Signals: ${node.signals.join(", ")}.` : "";
  return `${node.name} from the curated Riverside pack.${signals}`;
}

function stateLabel(state: string): string {
  return state === "CA" ? "California" : state;
}
