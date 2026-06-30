import type { VoxelScene } from "../voxel/types.js";

export type ScoutDropInput = {
  countySlug: string;
  nodeId?: string;
  locationLabel?: string;
  businessType: string;
  goal: string;
  budget?: string;
  serviceRadius?: string;
};

export type ScoutSignal = {
  id: string;
  label: string;
  detail: string;
  score: number;
  tone: "high" | "medium" | "watch";
  sourceNodeIds: string[];
};

export type ScoutRisk = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  mitigation: string;
};

export type ScoutRouteStop = {
  nodeId: string;
  label: string;
  reason: string;
};

export type ScoutPreviewState = {
  type: "scoutPreview";
  id: string;
  countySlug: string;
  selectedNodeId: string;
  businessType: string;
  goal: string;
  summary: string;
  bestOffer: string;
  route: ScoutRouteStop[];
  signals: ScoutSignal[];
  risks: ScoutRisk[];
  channels: string[];
  nextActions: string[];
  upgradePrompt: string;
  limitations: string[];
  scene: VoxelScene;
};

export type CampaignChannel = "qr_flyer" | "local_group" | "property_manager" | "partner" | "google_profile";

export type CampaignRoutePriority = {
  nodeId: string;
  label: string;
  priority: number;
  reason: string;
};

export type CampaignDayPlan = {
  day: number;
  label: string;
  focus: string;
  channel: CampaignChannel;
  routeNodeIds: string[];
  steps: string[];
  proof: string;
};

export type CampaignAssetPlaceholder = {
  id: string;
  label: string;
  channel: CampaignChannel;
  format: "qr_flyer" | "post_draft" | "outreach_script" | "checklist" | "profile_update";
  copyIntent: string;
};

export type CampaignPreviewState = {
  type: "campaignPreview";
  id: string;
  scoutPreviewId: string;
  countySlug: string;
  selectedNodeId: string;
  businessType: string;
  summary: string;
  offer: string;
  days: CampaignDayPlan[];
  routePriorities: CampaignRoutePriority[];
  assetPlaceholders: CampaignAssetPlaceholder[];
  guardrails: string[];
  scene: VoxelScene;
};
