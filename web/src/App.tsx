import { useMemo } from "react";
import type { CampaignPreviewState, ScoutPreviewState } from "@atlas/core/scout";
import {
  createVoxelNote,
  createVoxelSticker,
  riversideDemoVoxelScene,
  type VoxelNote,
  type VoxelScene,
  type VoxelSticker,
  type VoxelStickerKind,
} from "@atlas/core/voxel";
import { updateModelContext, useToolResult, useWidgetState } from "./bridge";
import { CityWorldView } from "./CityWorldView";
import type { WidgetState } from "./types";

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

const defaultPlace = riversideDemoVoxelScene.world?.places[0];

const defaultWidgetState: WidgetState = {
  selectedNodeId: defaultPlace?.nodeId ?? riversideDemoVoxelScene.selectedNodeId,
  selectedDistrictId: riversideDemoVoxelScene.world?.selectedDistrictId,
  selectedPlaceId: defaultPlace?.id,
  compact: false,
  activeSceneId: riversideDemoVoxelScene.id,
  activeStepId: "county",
  stickerMode: "favorite",
  stickers: [],
  notes: [],
  noteDraft: "",
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
  return Boolean(value && typeof value === "object" && (value as { type?: unknown }).type === "scoutPreview" && isVoxelScene((value as { scene?: unknown }).scene));
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
      typeof (value as { sceneId?: unknown }).sceneId === "string",
  );
}

function isCampaignPreviewStructuredContent(value: unknown): value is CampaignPreviewStructuredContent {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { type?: unknown }).type === "campaignPreview" &&
      typeof (value as { id?: unknown }).id === "string" &&
      typeof (value as { scoutPreviewId?: unknown }).scoutPreviewId === "string" &&
      typeof (value as { sceneId?: unknown }).sceneId === "string",
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
      typeof (value as { selectedNodeId?: unknown }).selectedNodeId === "string",
  );
}

export function App() {
  const result = useToolResult<ToolStructuredContent>(null);
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
  const campaignPreview =
    structuredCampaignPreview ??
    metaCampaignPreview ??
    (campaignPreviewSummary && metaScene ? ({ ...campaignPreviewSummary, scene: metaScene } as CampaignPreviewState) : null);
  const scoutPreview =
    structuredScoutPreview ??
    metaScoutPreview ??
    (scoutPreviewSummary && metaScene ? ({ ...scoutPreviewSummary, scene: metaScene } as ScoutPreviewState) : null);
  const toolScene = isVoxelScene(structuredContent) ? structuredContent : null;
  const scene = toolScene ?? campaignPreview?.scene ?? scoutPreview?.scene ?? metaScene ?? (sceneSummary ? riversideDemoVoxelScene : riversideDemoVoxelScene);
  const [widgetState, setWidgetState] = useWidgetState<WidgetState>(defaultWidgetState);

  const activeSceneMatches = widgetState.activeSceneId === scene.id;
  const selectedDistrictId = activeSceneMatches ? widgetState.selectedDistrictId ?? scene.world?.selectedDistrictId : scene.world?.selectedDistrictId;
  const selectedPlaceId = activeSceneMatches ? widgetState.selectedPlaceId ?? scene.world?.places[0]?.id : scene.world?.places[0]?.id;
  const selectedPlace = useMemo(() => scene.world?.places.find((place) => place.id === selectedPlaceId), [scene.world?.places, selectedPlaceId]);
  const selectedNodeId = activeSceneMatches
    ? widgetState.selectedNodeId
    : selectedPlace?.nodeId ?? scene.selectedNodeId;
  const stickers = activeSceneMatches ? widgetState.stickers ?? [] : [];
  const notes = activeSceneMatches ? widgetState.notes ?? [] : [];
  const stickerMode = activeSceneMatches ? widgetState.stickerMode ?? "favorite" : "favorite";
  const noteDraft = activeSceneMatches ? widgetState.noteDraft ?? "" : "";

  const selectDistrict = (districtId: string) => {
    const district = scene.world?.districts.find((item) => item.id === districtId);
    const firstPlace = scene.world?.places.find((place) => place.districtId === districtId);
    setWidgetState((current) => ({
      ...current,
      activeSceneId: scene.id,
      selectedDistrictId: districtId,
      selectedPlaceId: firstPlace?.id,
      selectedNodeId: firstPlace?.nodeId ?? current.selectedNodeId,
      activeStepId: district?.playable ? "district" : "county",
      noteDraft: "",
    }));
  };

  const selectPlace = (placeId: string) => {
    const place = scene.world?.places.find((item) => item.id === placeId);
    setWidgetState((current) => ({
      ...current,
      activeSceneId: scene.id,
      selectedDistrictId: place?.districtId ?? current.selectedDistrictId,
      selectedPlaceId: placeId,
      selectedNodeId: place?.nodeId ?? current.selectedNodeId,
      activeStepId: "place",
      noteDraft: "",
    }));
    if (place) {
      void updateModelContext(`User selected ${place.label} in the ${scene.county.name} city map. Place kind: ${place.kind}.`);
    }
  };

  const placeSticker = (placeId: string, kind: VoxelStickerKind) => {
    setWidgetState((current) => {
      const nextCount = (current.stickers ?? []).length + 1;
      const sticker = uniqueSticker(createVoxelSticker(scene, { placeId, kind, label: stickerLabel(kind) }), nextCount);
      return {
        ...current,
        activeSceneId: scene.id,
        selectedPlaceId: placeId,
        selectedNodeId: scene.world?.places.find((place) => place.id === placeId)?.nodeId ?? current.selectedNodeId,
        activeStepId: "collect",
        stickerMode: kind,
        stickers: [...(current.stickers ?? []), sticker],
      };
    });
  };

  const saveNote = (placeId: string, body: string) => {
    setWidgetState((current) => {
      const nextCount = (current.notes ?? []).length + 1;
      const note = uniqueNote(createVoxelNote(scene, { placeId, body }), nextCount);
      return {
        ...current,
        activeSceneId: scene.id,
        selectedPlaceId: placeId,
        notes: [...(current.notes ?? []), note],
        noteDraft: "",
        activeStepId: "collect",
      };
    });
  };

  return (
    <CityWorldView
      scene={scene}
      selectedDistrictId={selectedDistrictId}
      selectedPlaceId={selectedPlaceId}
      stickers={stickers}
      notes={notes}
      stickerMode={stickerMode}
      noteDraft={noteDraft}
      onSelectPlace={selectPlace}
      onSelectStickerMode={(kind) => setWidgetState((current) => ({ ...current, stickerMode: kind }))}
      onPlaceSticker={placeSticker}
      onNoteDraftChange={(value) => setWidgetState((current) => ({ ...current, activeSceneId: scene.id, noteDraft: value }))}
      onSaveNote={saveNote}
    />
  );
}

function uniqueSticker(sticker: VoxelSticker, count: number): VoxelSticker {
  return { ...sticker, id: `${sticker.id}-${count}` };
}

function uniqueNote(note: VoxelNote, count: number): VoxelNote {
  return { ...note, id: `${note.id}-${count}` };
}

function stickerLabel(kind: VoxelStickerKind): string {
  const labels: Record<VoxelStickerKind, string> = {
    home: "Home",
    shop: "Shop",
    park: "Park",
    favorite: "Favorite",
    idea: "Idea",
    question: "Question",
  };
  return labels[kind];
}
