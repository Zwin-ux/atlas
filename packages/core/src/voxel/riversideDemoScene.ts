import type { AtlasEdge, AtlasMarker, AtlasNode, VoxelObject, VoxelScene, VoxelTile, VoxelTileKind, VoxelWorld } from "./types.js";

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
    { id: "terrain", label: "Blocks", visible: true },
    { id: "routes", label: "Roads", visible: true },
    { id: "places", label: "Places", visible: true },
    { id: "stickers", label: "Stickers", visible: true },
  ],
  world: createWorld(),
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

function createWorld(): VoxelWorld {
  return {
    activeScale: "district",
    selectedDistrictId: "eastvale-district",
    nodes: [
      { id: "us", label: "United States", scale: "country", slug: "us" },
      { id: "ca", label: "California", scale: "state", parentId: "us", slug: "ca" },
      { id: "riverside-ca", label: "Riverside County", scale: "county", parentId: "ca", slug: "riverside-ca", position: { x: 32, y: 18, z: 0 } },
      { id: "eastvale-district", label: "Eastvale", scale: "district", parentId: "riverside-ca", slug: "eastvale", position: { x: 32, y: 18, z: 1 } },
      { id: "corona-corridor", label: "Corona Corridor", scale: "district", parentId: "riverside-ca", slug: "corona-corridor", position: { x: 26, y: 24, z: 1 } },
      { id: "place-eastvale-core", label: "Eastvale Core", scale: "place", parentId: "eastvale-district", position: { x: 32, y: 18, z: 1.3 } },
      { id: "place-neighborhood-blocks", label: "Neighborhood Blocks", scale: "place", parentId: "eastvale-district", position: { x: 34, y: 17, z: 1.3 } },
      { id: "place-plaza-row", label: "Plaza Row", scale: "place", parentId: "eastvale-district", position: { x: 36, y: 20, z: 1.3 } },
      { id: "place-community-park", label: "Community Park", scale: "place", parentId: "eastvale-district", position: { x: 35, y: 22, z: 1.2 } },
      { id: "place-norco-route", label: "Norco Route", scale: "place", parentId: "corona-corridor", position: { x: 28, y: 21, z: 1.2 } },
    ],
    districts: [
      {
        id: "eastvale-district",
        label: "Eastvale City Slice",
        countySlug: "riverside-ca",
        worldNodeId: "eastvale-district",
        summary: "A playable Eastvale slice with homes, plaza lots, parks, and route edges.",
        playable: true,
        focusNodeIds: ["eastvale", "residential-eastvale", "gym-plaza-eastvale", "apartment-cluster", "norco"],
        position: { x: 32, y: 18, z: 1 },
      },
      {
        id: "corona-corridor",
        label: "Corona Corridor",
        countySlug: "riverside-ca",
        worldNodeId: "corona-corridor",
        summary: "A locked county corridor preview for later expansion.",
        playable: false,
        focusNodeIds: ["corona", "riverside"],
        position: { x: 26, y: 24, z: 1 },
      },
    ],
    places: [
      {
        id: "place-eastvale-core",
        label: "Eastvale Core",
        kind: "landmark",
        districtId: "eastvale-district",
        nodeId: "eastvale",
        position: { x: 32, y: 18, z: 1.32 },
        description: "The starting place for the Riverside city map.",
        activity: 0.76,
      },
      {
        id: "place-neighborhood-blocks",
        label: "Neighborhood Blocks",
        kind: "home_area",
        districtId: "eastvale-district",
        nodeId: "residential-eastvale",
        position: { x: 34, y: 17, z: 1.32 },
        description: "A compact home-area cluster for collecting notes and stickers.",
        activity: 0.88,
      },
      {
        id: "place-plaza-row",
        label: "Plaza Row",
        kind: "plaza",
        districtId: "eastvale-district",
        nodeId: "gym-plaza-eastvale",
        position: { x: 36, y: 20, z: 1.32 },
        description: "A small shop-and-plaza row for place cards and future props.",
        activity: 0.82,
      },
      {
        id: "place-eastvale-gym",
        label: "Gym",
        kind: "landmark",
        districtId: "eastvale-district",
        nodeId: "gym-plaza-eastvale",
        position: { x: 36, y: 20, z: 1.36 },
        description: "A busy local gym block with parking, foot traffic, and errand overlap.",
        activity: 0.84,
      },
      {
        id: "place-eastvale-apartments",
        label: "Apartments",
        kind: "home_area",
        districtId: "eastvale-district",
        nodeId: "apartment-cluster",
        position: { x: 38, y: 23, z: 1.34 },
        description: "A compact apartment pocket for resident notes and collected pins.",
        activity: 0.74,
      },
      {
        id: "place-community-park",
        label: "Community Park",
        kind: "park",
        districtId: "eastvale-district",
        nodeId: "eastvale",
        position: { x: 35, y: 22, z: 1.22 },
        description: "A soft green pocket that makes the district feel lived in.",
        activity: 0.64,
      },
      {
        id: "place-norco-route",
        label: "Norco Route",
        kind: "road",
        districtId: "corona-corridor",
        nodeId: "norco",
        position: { x: 28, y: 21, z: 1.18 },
        description: "A county route marker for later corridor expansion.",
        activity: 0.58,
      },
    ],
    ambient: {
      timeOfDay: "midday",
      activity: "busy",
      traffic: 0.62,
      residents: 0.72,
    },
    stickers: [
      { id: "sticker-place-eastvale-core-favorite", placeId: "place-eastvale-core", kind: "favorite", label: "Start" },
    ],
    notes: [],
  };
}

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
    { id: "home-eastvale-1", kind: "home", position: { x: 31.2, y: 17.2, z: 1.2 }, label: "Cottage row", nodeId: "eastvale", layerId: "places", intensity: 0.8 },
    { id: "home-eastvale-2", kind: "home", position: { x: 33.2, y: 17.1, z: 1.2 }, label: "Garden block", nodeId: "residential-eastvale", layerId: "places", intensity: 0.9 },
    { id: "home-eastvale-3", kind: "home", position: { x: 35.1, y: 16.8, z: 1.2 }, label: "Patio homes", nodeId: "residential-eastvale", layerId: "places", intensity: 0.72 },
    { id: "home-eastvale-4", kind: "home", position: { x: 37.2, y: 22.2, z: 1.16 }, label: "Apartment row", nodeId: "apartment-cluster", layerId: "places", intensity: 0.76 },
    { id: "plaza-eastvale", kind: "plaza", position: { x: 36, y: 20, z: 1.2 }, label: "Main street shops", nodeId: "gym-plaza-eastvale", layerId: "places", intensity: 0.82 },
    { id: "plaza-eastvale-2", kind: "plaza", position: { x: 37.4, y: 19.2, z: 1.18 }, label: "Corner market", nodeId: "gym-plaza-eastvale", layerId: "places", intensity: 0.68 },
    { id: "park-eastvale", kind: "park", position: { x: 35, y: 22, z: 1.16 }, label: "Community park", nodeId: "eastvale", layerId: "places", intensity: 0.68 },
    { id: "park-eastvale-2", kind: "park", position: { x: 33.4, y: 20.4, z: 1.12 }, label: "Pocket green", nodeId: "eastvale", layerId: "places", intensity: 0.58 },
    { id: "landmark-eastvale", kind: "landmark", position: { x: 32, y: 18, z: 1.42 }, label: "Eastvale core", nodeId: "eastvale", layerId: "places", intensity: 0.8 },
    { id: "road-eastvale-norco", kind: "road", position: { x: 30, y: 20, z: 1.05 }, label: "Norco road", layerId: "routes", intensity: 0.68 },
    { id: "road-norco-corona", kind: "freeway", position: { x: 27, y: 22.5, z: 1.05 }, label: "Corona road", layerId: "routes", intensity: 0.74 },
  ];
}

function tileKindFor(x: number, y: number): VoxelTileKind {
  if (isRouteTile(x, y)) return "route";
  if (isNear(x, y, 32, 18) || isNear(x, y, 34, 17) || isNear(x, y, 37, 22)) return "residential";
  if (isNear(x, y, 36, 20) || isNear(x, y, 42, 28)) return "commercial";
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
