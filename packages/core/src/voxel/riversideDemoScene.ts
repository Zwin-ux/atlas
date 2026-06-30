import type { AtlasEdge, AtlasMarker, AtlasNode, VoxelObject, VoxelScene, VoxelTile, VoxelTileKind } from "./types.js";

const nodeSource = [
  {
    id: "eastvale",
    label: "Eastvale",
    kind: "city",
    position: { x: 32, y: 18, z: 1 },
    score: 78,
    signals: ["Residential demand", "Fast route access", "QR flyer opportunity"],
    campaignSuggestion: "QR flyers, local Facebook posts, property manager outreach.",
  },
  {
    id: "residential-eastvale",
    label: "Residential Cluster",
    kind: "residential_cluster",
    position: { x: 34, y: 17, z: 1 },
    score: 85,
    signals: ["Residential demand", "High willingness to pay"],
    campaignSuggestion: "Promote first-time mobile detail offer.",
  },
  {
    id: "gym-plaza-eastvale",
    label: "Gym / Plaza",
    kind: "commercial_plaza",
    position: { x: 36, y: 20, z: 1 },
    score: 82,
    signals: ["Partnership target", "QR flyer opportunity"],
    campaignSuggestion: "Partner flyer/QR campaign near gym/plaza audience.",
  },
  {
    id: "apartment-cluster",
    label: "Apartment Cluster",
    kind: "apartment_cluster",
    position: { x: 38, y: 23, z: 1 },
    score: 72,
    signals: ["Property manager outreach"],
    campaignSuggestion: "Contact property managers with resident service offer.",
  },
  {
    id: "corona",
    label: "Corona",
    kind: "city",
    position: { x: 26, y: 24, z: 1 },
    score: 74,
    signals: ["Fast route access", "Partnership target"],
    campaignSuggestion: "Use plaza partnerships and neighborhood groups.",
  },
  {
    id: "norco",
    label: "Norco",
    kind: "city",
    position: { x: 28, y: 21, z: 1 },
    score: 68,
    signals: ["Fast route access"],
    campaignSuggestion: "Bundle with Eastvale/Corona route.",
  },
  {
    id: "riverside",
    label: "Riverside",
    kind: "regional_center",
    position: { x: 42, y: 28, z: 1 },
    score: 70,
    signals: ["Commercial foot traffic", "Partnership target"],
    campaignSuggestion: "Use targeted commercial/office outreach.",
  },
] satisfies AtlasNode[];

const edges: AtlasEdge[] = [
  { id: "eastvale-residential", from: "eastvale", to: "residential-eastvale", kind: "signal" },
  { id: "eastvale-plaza", from: "eastvale", to: "gym-plaza-eastvale", kind: "signal" },
  { id: "eastvale-apartment", from: "eastvale", to: "apartment-cluster", kind: "signal" },
  { id: "eastvale-norco", from: "eastvale", to: "norco", kind: "route" },
  { id: "norco-corona", from: "norco", to: "corona", kind: "route" },
  { id: "corona-riverside", from: "corona", to: "riverside", kind: "regional_route" },
];

const markers: AtlasMarker[] = [
  { id: "drop-eastvale", nodeId: "eastvale", kind: "drop", label: "Drop point" },
  { id: "opp-residential", nodeId: "residential-eastvale", kind: "opportunity", label: "High demand" },
  { id: "opp-plaza", nodeId: "gym-plaza-eastvale", kind: "opportunity", label: "Partner route" },
  { id: "risk-apartment", nodeId: "apartment-cluster", kind: "risk", label: "Access gate" },
  { id: "scouted-norco", nodeId: "norco", kind: "scouted", label: "Route scouted" },
];

export const riversideDemoVoxelScene: VoxelScene = {
  type: "voxelScene",
  id: "voxel-riverside-eastvale-alpha",
  county: {
    name: "Riverside County",
    state: "CA",
    slug: "riverside-ca",
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
  tiles: createTiles(),
  nodes: nodeSource,
  edges,
  markers,
  objects: createObjects(),
  camera: {
    focusNodeId: "eastvale",
    initialZoom: 1,
    minZoom: 0.82,
    maxZoom: 1.34,
  },
  layers: [
    { id: "terrain", label: "Terrain", visible: true },
    { id: "routes", label: "Routes", visible: true },
    { id: "signals", label: "Signals", visible: true },
    { id: "scout", label: "Scout", visible: true },
  ],
  clawd: {
    nodeId: "eastvale",
    routeNodeIds: ["eastvale", "norco", "corona"],
    label: "Clawd Scout",
    status: "scouting",
    mood: "scanning",
    pulse: true,
  },
  panel: {
    type: "scout_report",
    title: "Eastvale Scout Report",
    focusNodeId: "eastvale",
    summary: "Mobile detailing has a strong first-drop shape: residential density, short routes, and plaza partner surfaces.",
    stats: [
      { label: "Mobile detail score", value: "78", tone: "good" },
      { label: "Route drag", value: "Low", tone: "good" },
      { label: "Competition watch", value: "Plaza stack", tone: "watch" },
    ],
  },
  flow: [
    { id: "county", label: "County", status: "done" },
    { id: "drop", label: "Scout drop", status: "active" },
    { id: "report", label: "Report", status: "next" },
    { id: "campaign", label: "Campaign", status: "next" },
  ],
  selectedNodeId: "eastvale",
};

function createTiles(): VoxelTile[] {
  const tiles: VoxelTile[] = [];
  const startX = 24;
  const startY = 15;
  const width = 11;
  const height = 10;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sceneX = startX + x * 2;
      const sceneY = startY + y * 2;
      tiles.push({
        id: `tile-${sceneX}-${sceneY}`,
        position: { x: sceneX, y: sceneY, z: 0 },
        kind: tileKindFor(sceneX, sceneY),
        elevation: (x + y) % 4 === 0 ? 1 : 0,
      });
    }
  }

  return tiles;
}

function createObjects(): VoxelObject[] {
  return [
    { id: "home-eastvale-1", kind: "home", position: { x: 31.2, y: 17.2, z: 1.2 }, label: "Driveway density", nodeId: "eastvale", layerId: "signals", intensity: 0.8 },
    { id: "home-eastvale-2", kind: "home", position: { x: 33.2, y: 17.1, z: 1.2 }, label: "Residential block", nodeId: "residential-eastvale", layerId: "signals", intensity: 0.9 },
    { id: "home-eastvale-3", kind: "home", position: { x: 35.1, y: 16.8, z: 1.2 }, label: "Residential block", nodeId: "residential-eastvale", layerId: "signals", intensity: 0.72 },
    { id: "plaza-eastvale", kind: "plaza", position: { x: 36, y: 20, z: 1.2 }, label: "Gym / plaza surface", nodeId: "gym-plaza-eastvale", layerId: "signals", intensity: 0.82 },
    { id: "qr-gym-window", kind: "qr_surface", position: { x: 36.8, y: 19.3, z: 1.4 }, label: "QR flyer surface", nodeId: "gym-plaza-eastvale", layerId: "signals", intensity: 0.78 },
    { id: "gate-apartment", kind: "risk_gate", position: { x: 38, y: 23, z: 1.4 }, label: "Access gate watch", nodeId: "apartment-cluster", layerId: "signals", intensity: 0.72 },
    { id: "drop-zone-eastvale", kind: "drop_zone", position: { x: 32, y: 18, z: 1.35 }, label: "Scout Drop", nodeId: "eastvale", layerId: "scout", intensity: 1 },
    { id: "road-eastvale-norco", kind: "road", position: { x: 30, y: 20, z: 1.05 }, label: "Short route", layerId: "routes", intensity: 0.68 },
    { id: "road-norco-corona", kind: "freeway", position: { x: 27, y: 22.5, z: 1.05 }, label: "Route extension", layerId: "routes", intensity: 0.74 },
    { id: "scout-norco", kind: "scout_marker", position: { x: 28, y: 21, z: 1.3 }, label: "Scouted extension", nodeId: "norco", layerId: "scout", intensity: 0.68 },
  ];
}

function tileKindFor(x: number, y: number): VoxelTileKind {
  if (isNear(x, y, 32, 18) || isNear(x, y, 34, 17)) return "residential";
  if (isNear(x, y, 36, 20) || isNear(x, y, 42, 28)) return "commercial";
  if (isNear(x, y, 38, 23)) return "risk";
  if (isRouteTile(x, y)) return "route";
  if (isNear(x, y, 28, 21)) return "scouted";
  return "open";
}

function isNear(x: number, y: number, targetX: number, targetY: number): boolean {
  return Math.abs(x - targetX) <= 2 && Math.abs(y - targetY) <= 2;
}

function isRouteTile(x: number, y: number): boolean {
  return (
    isNear(x, y, 30, 20) ||
    isNear(x, y, 28, 22) ||
    isNear(x, y, 26, 24) ||
    isNear(x, y, 40, 26)
  );
}
