export * from "./county/CountyPackService.js";
export * from "./county/schema.js";
export * from "./county/types.js";
export { CampaignPreviewService, ScoutDropService, previewCampaignFromScout, previewScoutDrop } from "./scout/index.js";
export type {
  CampaignAssetPlaceholder,
  CampaignChannel,
  CampaignDayPlan,
  CampaignPreviewState,
  CampaignRoutePriority,
  ScoutDropInput,
  ScoutPreviewState,
  ScoutRisk,
  ScoutRouteStop,
  ScoutSignal,
} from "./scout/index.js";
export { riversideDemoVoxelScene } from "./voxel/riversideDemoScene.js";
export type {
  AtlasEdge,
  AtlasEdgeKind,
  AtlasMarker,
  AtlasMarkerKind,
  AtlasNode,
  AtlasNodeKind,
  CampaignPreviewPanel,
  CampaignAssetPanelItem,
  CampaignDayPanelItem,
  CampaignRoutePriorityPanelItem,
  ClawdRenderState,
  ScoutReportPanel,
  UpgradePanel,
  VoxelFlowStep,
  VoxelPoint as VoxelScenePoint,
  VoxelScene,
  VoxelTheme,
  VoxelTile,
  VoxelTileKind,
} from "./voxel/types.js";

export type AtlasPhase = "skeleton" | "county-pack" | "renderer" | "scout-drop" | "campaign" | "mcp-tools";

export type AtlasPackageStatus = {
  packageName: string;
  phase: AtlasPhase;
  readyForProductLogic: boolean;
};

export const CORE_PACKAGE_STATUS: AtlasPackageStatus = {
  packageName: "@atlas/core",
  phase: "campaign",
  readyForProductLogic: true,
};
