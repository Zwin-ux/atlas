import { useEffect, useMemo, useState } from "react";
import { previewCampaignFromScout, previewScoutDrop, type CampaignPreviewState, type ScoutPreviewState } from "@atlas/core/scout";
import { riversideDemoVoxelScene, type VoxelScene } from "@atlas/core/voxel";
import { sendUserMessage, updateModelContext, useToolResult, useWidgetState } from "./bridge";
import type { WidgetState } from "./types";
import { VoxelSceneView } from "./VoxelSceneView";

type ScoutPreviewStructuredContent = Omit<ScoutPreviewState, "scene"> & {
  sceneId: string;
  flow: VoxelScene["flow"];
};

type VoxelSceneStructuredContent = {
  type: "voxelSceneSummary";
  sceneId: string;
  county: VoxelScene["county"];
  selectedNodeId: string;
  nodeCount: number;
  routeNodeIds: string[];
  flow: VoxelScene["flow"];
};

type CampaignPreviewStructuredContent = Omit<CampaignPreviewState, "scene"> & {
  sceneId: string;
  flow: VoxelScene["flow"];
};

type ToolStructuredContent =
  | CampaignPreviewState
  | CampaignPreviewStructuredContent
  | ScoutPreviewState
  | ScoutPreviewStructuredContent
  | VoxelScene
  | VoxelSceneStructuredContent
  | null;

const defaultScoutPreview = previewScoutDrop({
  countySlug: "riverside-ca",
  nodeId: "eastvale",
  businessType: "mobile detailing",
});

const defaultWidgetState: WidgetState = {
  selectedNodeId: defaultScoutPreview.selectedNodeId,
  compact: false,
  activeSceneId: defaultScoutPreview.scene.id,
  scoutPreviewId: defaultScoutPreview.id,
  activeStepId: "county",
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object");
}

function hasString(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === "string";
}

function hasNumber(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === "number" && Number.isFinite(record[key]);
}

function isVoxelPointValue(value: unknown): boolean {
  return isRecord(value) && hasNumber(value, "x") && hasNumber(value, "y") && hasNumber(value, "z");
}

function isViewportValue(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasNumber(value, "width") &&
    hasNumber(value, "height") &&
    hasNumber(value, "originX") &&
    hasNumber(value, "originY") &&
    hasNumber(value, "tileWidth") &&
    hasNumber(value, "tileHeight") &&
    hasNumber(value, "tileDepth")
  );
}

function isNodeValue(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "label") &&
    hasNumber(value, "score") &&
    isVoxelPointValue(value.position)
  );
}

function isTileValue(value: unknown): boolean {
  return isRecord(value) && hasString(value, "id") && hasNumber(value, "elevation") && isVoxelPointValue(value.position);
}

function isClawdValue(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "nodeId") &&
    hasString(value, "label") &&
    hasString(value, "status") &&
    Array.isArray(value.routeNodeIds)
  );
}

function isScoutPreview(value: unknown): value is ScoutPreviewState {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { type?: unknown }).type === "scoutPreview" &&
      isVoxelScene((value as { scene?: unknown }).scene),
  );
}

function isCampaignPreview(value: unknown): value is CampaignPreviewState {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { type?: unknown }).type === "campaignPreview" &&
      typeof (value as { id?: unknown }).id === "string" &&
      typeof (value as { scoutPreviewId?: unknown }).scoutPreviewId === "string" &&
      Array.isArray((value as { days?: unknown }).days) &&
      Array.isArray((value as { assetPlaceholders?: unknown }).assetPlaceholders) &&
      isVoxelScene((value as { scene?: unknown }).scene),
  );
}

function isScoutPreviewStructuredContent(value: unknown): value is ScoutPreviewStructuredContent {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { type?: unknown }).type === "scoutPreview" &&
      typeof (value as { id?: unknown }).id === "string" &&
      typeof (value as { sceneId?: unknown }).sceneId === "string" &&
      Array.isArray((value as { route?: unknown }).route) &&
      Array.isArray((value as { signals?: unknown }).signals),
  );
}

function isCampaignPreviewStructuredContent(value: unknown): value is CampaignPreviewStructuredContent {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { type?: unknown }).type === "campaignPreview" &&
      typeof (value as { id?: unknown }).id === "string" &&
      typeof (value as { scoutPreviewId?: unknown }).scoutPreviewId === "string" &&
      typeof (value as { sceneId?: unknown }).sceneId === "string" &&
      Array.isArray((value as { days?: unknown }).days) &&
      Array.isArray((value as { assetPlaceholders?: unknown }).assetPlaceholders),
  );
}

function isVoxelScene(value: unknown): value is VoxelScene {
  if (
    !isRecord(value) ||
    value.type !== "voxelScene" ||
    !hasString(value, "id") ||
    !hasString(value, "selectedNodeId") ||
    !isViewportValue(value.viewport) ||
    !isClawdValue(value.clawd) ||
    !isRecord(value.panel) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.tiles) ||
    !Array.isArray(value.edges) ||
    !Array.isArray(value.markers) ||
    !Array.isArray(value.flow)
  ) {
    return false;
  }

  return (
    value.nodes.length > 0 &&
    value.nodes.every(isNodeValue) &&
    value.tiles.length > 0 &&
    value.tiles.every(isTileValue) &&
    value.nodes.some((node) => isRecord(node) && node.id === value.selectedNodeId) &&
    value.nodes.some((node) => isRecord(node) && node.id === (value.clawd as UnknownRecord).nodeId)
  );
}

function isVoxelSceneStructuredContent(value: unknown): value is VoxelSceneStructuredContent {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { type?: unknown }).type === "voxelSceneSummary" &&
      typeof (value as { sceneId?: unknown }).sceneId === "string" &&
      typeof (value as { selectedNodeId?: unknown }).selectedNodeId === "string" &&
      Array.isArray((value as { routeNodeIds?: unknown }).routeNodeIds),
  );
}

export function App() {
  const result = useToolResult<ToolStructuredContent>(null);
  const [localCampaignPreview, setLocalCampaignPreview] = useState<CampaignPreviewState | null>(null);
  const structuredContent = result?.structuredContent;
  const meta = result?._meta;
  const metaCampaignPreview = isCampaignPreview(meta?.campaignPreview) ? meta.campaignPreview : null;
  const metaScoutPreview = isScoutPreview(meta?.scoutPreview) ? meta.scoutPreview : null;
  const metaScene = isVoxelScene(meta?.scene) ? meta.scene : null;
  const campaignPreviewSummary = isCampaignPreviewStructuredContent(structuredContent) ? structuredContent : null;
  const scoutPreviewSummary = isScoutPreviewStructuredContent(structuredContent) ? structuredContent : null;
  const sceneSummary = isVoxelSceneStructuredContent(structuredContent) ? structuredContent : null;
  const structuredCampaignPreview = isCampaignPreview(structuredContent) ? structuredContent : null;
  const structuredScoutPreview = isScoutPreview(structuredContent) ? structuredContent : null;
  const toolCampaignPreview =
    structuredCampaignPreview ??
    metaCampaignPreview ??
    (campaignPreviewSummary && metaScene ? ({ ...campaignPreviewSummary, scene: metaScene } as CampaignPreviewState) : null);
  const campaignPreview = toolCampaignPreview ?? localCampaignPreview;
  const toolScoutPreview =
    structuredScoutPreview ??
    metaScoutPreview ??
    (scoutPreviewSummary && metaScene ? ({ ...scoutPreviewSummary, scene: metaScene } as ScoutPreviewState) : null);
  const toolScene = isVoxelScene(structuredContent) ? structuredContent : null;
  const shouldUseFallbackScout = !campaignPreview && !toolScene && !sceneSummary && !metaScene && !scoutPreviewSummary;
  const scoutPreview = toolScoutPreview ?? (shouldUseFallbackScout ? defaultScoutPreview : null);
  const scene = toolScene ?? campaignPreview?.scene ?? scoutPreview?.scene ?? metaScene ?? riversideDemoVoxelScene;
  const [widgetState, setWidgetState] = useWidgetState<WidgetState>(defaultWidgetState);
  const selectedNodeId = widgetState.activeSceneId === scene.id ? widgetState.selectedNodeId : scene.selectedNodeId;
  const activeStepId = widgetState.activeSceneId === scene.id ? widgetState.activeStepId : undefined;

  const scoutPreviewId = scoutPreview?.id;
  const scoutSceneId = scoutPreview?.scene.id;
  const scoutSelectedNodeId = scoutPreview?.selectedNodeId;
  const campaignPreviewId = campaignPreview?.id;
  const campaignScoutPreviewId = campaignPreview?.scoutPreviewId;
  const campaignSceneId = campaignPreview?.scene.id;
  const campaignSelectedNodeId = campaignPreview?.selectedNodeId;

  useEffect(() => {
    if (!scoutPreviewId || !scoutSceneId || !scoutSelectedNodeId) return;

    const setStep = (activeStepId: NonNullable<WidgetState["activeStepId"]>) => {
      setWidgetState((current) => {
        if (
          current.scoutPreviewId === scoutPreviewId &&
          current.activeSceneId === scoutSceneId &&
          current.activeStepId === activeStepId
        ) {
          return current;
        }

        return {
          ...current,
          selectedNodeId: scoutSelectedNodeId,
          activeSceneId: scoutSceneId,
          scoutPreviewId,
          activeStepId,
        };
      });
    };

    setStep("county");
    const dropTimer = window.setTimeout(() => setStep("drop"), 180);
    const reportTimer = window.setTimeout(() => setStep("report"), 420);
    return () => {
      window.clearTimeout(dropTimer);
      window.clearTimeout(reportTimer);
    };
  }, [scoutPreviewId, scoutSceneId, scoutSelectedNodeId]);

  useEffect(() => {
    if (!campaignPreviewId || !campaignScoutPreviewId || !campaignSceneId || !campaignSelectedNodeId) return;

    setWidgetState((current) => {
      if (current.activeSceneId === campaignSceneId && current.activeStepId === "campaign") return current;

      return {
        ...current,
        selectedNodeId: campaignSelectedNodeId,
        activeSceneId: campaignSceneId,
        scoutPreviewId: campaignScoutPreviewId,
        activeStepId: "campaign",
      };
    });
  }, [campaignPreviewId, campaignScoutPreviewId, campaignSceneId, campaignSelectedNodeId]);

  const selectedNode = useMemo(() => {
    return (
      scene.nodes.find((node) => node.id === selectedNodeId) ??
      scene.nodes.find((node) => node.id === scene.selectedNodeId)
    );
  }, [scene.nodes, scene.selectedNodeId, selectedNodeId]);

  const selectNode = (nodeId: string) => {
    const node = scene.nodes.find((item) => item.id === nodeId);
    setWidgetState((current) => ({
      ...current,
      selectedNodeId: nodeId,
      activeSceneId: scene.id,
      ...(scoutPreview ? { scoutPreviewId: scoutPreview.id, activeStepId: "report" as const } : {}),
    }));
    if (node) {
      const context = scoutPreview
        ? `User focused ${node.label} inside Scout Drop ${scoutPreview.id}. Score: ${node.score}.`
        : `User focused ${node.label} in the Riverside VoxelScene. Score: ${node.score}.`;
      void updateModelContext(context);
    }
  };

  const askForCampaignPath = () => {
    if (!selectedNode) return;
    if (campaignPreview) {
      void sendUserMessage(
        `Use Campaign Preview ${campaignPreview.id} to draft the first manual asset for ${selectedNode.label}. Keep it non-automated and start with the QR flyer copy plus approval checklist.`,
      );
      return;
    }

    if (scoutPreview) {
      void sendUserMessage(
        `Use Scout Drop ${scoutPreview.id} to draft the next manual campaign preview for ${selectedNode.label}. Keep it non-automated: QR flyer route, local group post draft, property manager outreach checklist, and route plan.`,
      );
      if (window.parent === window) {
        setLocalCampaignPreview(previewCampaignFromScout(scoutPreview));
      }
      return;
    }

    void sendUserMessage(
      `Turn the ${selectedNode.label} scout signal into a mobile detailing campaign path using the Riverside VoxelScene context.`,
    );
  };

  return (
    <VoxelSceneView
      scene={scene}
      selectedNodeId={selectedNodeId}
      {...(activeStepId ? { activeStepId } : {})}
      {...(campaignPreview
        ? { contextTitle: `${campaignPreview.businessType} Campaign Preview` }
        : scoutPreview
          ? { contextTitle: `${scoutPreview.businessType} Scout Drop` }
          : {})}
      compact={widgetState.compact}
      onSelectNode={selectNode}
      onAskCampaign={askForCampaignPath}
    />
  );
}
