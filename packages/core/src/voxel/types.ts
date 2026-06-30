export type VoxelTheme = "light_county";

export type VoxelPoint = {
  x: number;
  y: number;
  z: number;
};

export type VoxelTileKind = "open" | "residential" | "commercial" | "route" | "risk" | "scouted";

export type VoxelTile = {
  id: string;
  position: VoxelPoint;
  kind: VoxelTileKind;
  elevation: number;
  label?: string;
};

export type AtlasNodeKind =
  | "city"
  | "residential_cluster"
  | "commercial_plaza"
  | "apartment_cluster"
  | "regional_center";

export type AtlasNode = {
  id: string;
  label: string;
  kind: AtlasNodeKind;
  position: VoxelPoint;
  score: number;
  signals: string[];
  campaignSuggestion: string;
};

export type AtlasEdgeKind = "signal" | "route" | "regional_route";

export type AtlasEdge = {
  id: string;
  from: string;
  to: string;
  kind: AtlasEdgeKind;
};

export type AtlasMarkerKind = "opportunity" | "risk" | "scouted" | "drop";

export type AtlasMarker = {
  id: string;
  nodeId: string;
  kind: AtlasMarkerKind;
  label: string;
};

export type VoxelObjectKind =
  | "home"
  | "plaza"
  | "road"
  | "freeway"
  | "warehouse"
  | "qr_surface"
  | "risk_gate"
  | "drop_zone"
  | "scout_marker";

export type VoxelObject = {
  id: string;
  kind: VoxelObjectKind;
  position: VoxelPoint;
  label: string;
  nodeId?: string;
  layerId?: string;
  intensity?: number;
};

export type VoxelCamera = {
  focusNodeId: string;
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
};

export type VoxelLayer = {
  id: string;
  label: string;
  visible: boolean;
};

export type ClawdRenderState = {
  nodeId: string;
  routeNodeIds: string[];
  label: string;
  status: "ready" | "scouting" | "reporting";
  mood?: "idle" | "scanning" | "reporting";
  pulse?: boolean;
};

export type ScoutReportPanel = {
  type: "scout_report";
  title: string;
  focusNodeId: string;
  summary: string;
  bestOffer?: string;
  channels?: string[];
  risks?: string[];
  nextActions?: string[];
  upgradePrompt?: string;
  signals?: Array<{
    label: string;
    detail: string;
    score: number;
  }>;
  stats: Array<{
    label: string;
    value: string;
    tone: "good" | "watch" | "neutral";
  }>;
};

export type CampaignChannel = "qr_flyer" | "local_group" | "property_manager" | "partner" | "google_profile";

export type CampaignDayPanelItem = {
  day: number;
  label: string;
  focus: string;
  channel: CampaignChannel;
  routeNodeIds: string[];
  steps: string[];
  proof: string;
};

export type CampaignRoutePriorityPanelItem = {
  nodeId: string;
  label: string;
  priority: number;
  reason: string;
};

export type CampaignAssetPanelItem = {
  id: string;
  label: string;
  channel: CampaignChannel;
  format: "qr_flyer" | "post_draft" | "outreach_script" | "checklist" | "profile_update";
  copyIntent: string;
};

export type CampaignPreviewPanel = {
  type: "campaign_preview";
  title: string;
  focusNodeId: string;
  summary: string;
  offer: string;
  days: CampaignDayPanelItem[];
  routePriorities: CampaignRoutePriorityPanelItem[];
  assetPlaceholders: CampaignAssetPanelItem[];
  guardrails: string[];
  stats: Array<{
    label: string;
    value: string;
    tone: "good" | "watch" | "neutral";
  }>;
  upgradePrompt?: string;
};

export type UpgradePanel = {
  type: "upgrade";
  title: string;
  summary: string;
};

export type VoxelFlowStep = {
  id: string;
  label: string;
  status: "done" | "active" | "next";
};

export type VoxelScene = {
  type: "voxelScene";
  id: string;
  county: {
    name: string;
    state: string;
    slug: string;
  };
  theme: VoxelTheme;
  viewport: {
    width: number;
    height: number;
    originX: number;
    originY: number;
    tileWidth: number;
    tileHeight: number;
    tileDepth: number;
  };
  tiles: VoxelTile[];
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  markers: AtlasMarker[];
  objects?: VoxelObject[];
  camera?: VoxelCamera;
  layers?: VoxelLayer[];
  clawd: ClawdRenderState;
  panel: ScoutReportPanel | CampaignPreviewPanel | UpgradePanel;
  flow: VoxelFlowStep[];
  selectedNodeId: string;
};
