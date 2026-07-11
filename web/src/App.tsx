import { useEffect, useMemo, useRef, useState } from "react";
import type { CampaignPreviewState, ScoutPreviewState } from "@atlas/core/scout";
import {
  compileCountyShellCityWorldScene,
  createVoxelNote,
  createVoxelSticker,
  riversideDemoVoxelScene,
  type CityWorldScene,
  type VoxelNote,
  type VoxelScene,
  type VoxelSticker,
  type VoxelStickerKind,
} from "@atlas/core/voxel";
import { sendUserMessage, updateModelContext, useToolResult, useWidgetState } from "./bridge";
import { CountyCoverageView } from "./CountyCoverageView";
import { CountySwitcher, type CountySwitchSlug } from "./CountySwitcher";
import { CityWorldView } from "./CityWorldView";
import type { HostedClawdActionKind, HostedClawdContext, HostedClawdScreenState, WidgetState } from "./types";

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
  cameraIntent?: CameraIntent;
};

type CameraIntent = {
  type: "focus_place" | "focus_district" | "focus_water_edge" | "focus_landmark";
  targetNodeId?: string;
  targetLabel?: string;
};

export type CameraFocus = {
  sourceSceneId: string;
  preset: CityWorldScene["cameraPresets"][number];
};

export type CountyCoverageStructuredContent = {
  type: "countyCoverageSummary";
  countySlug: string;
  countyLabel?: string;
  supported: boolean;
  coverageTier: "L0_UNSUPPORTED" | "L1_COUNTY_SHELL" | "L2_CURATED_DISTRICT" | "L3_PROVIDER_NORMALIZED" | "L4_PUBLIC_QUALITY";
  coverageLabel: string;
  message: string;
  stateCode?: string;
  geoid?: string;
  playableDistrictCount: number;
  placeCount: number;
  districts: Array<{
    label: string;
    districtSlug: string;
    playable: boolean;
    geoid?: string;
    coverageTier?: string;
  }>;
  sourceNotes: Array<{
    source: string;
    label: string;
    attribution: string;
    ttlSeconds: number;
  }>;
  limitations: string[];
  suggestedNextCountySlug: string;
};

type CampaignPreviewStructuredContent = Omit<CampaignPreviewState, "scene"> & {
  sceneId: string;
  flow: VoxelScene["flow"];
};

type CountyQuestionStructuredContent = {
  type: "countyQuestionAnswer";
  supported: boolean;
  cameraIntent?: CameraIntent;
};

type ToolStructuredContent =
  | CampaignPreviewState
  | CampaignPreviewStructuredContent
  | CountyQuestionStructuredContent
  | ScoutPreviewState
  | ScoutPreviewStructuredContent
  | VoxelScene
  | VoxelSceneStructuredContent
  | CountyCoverageStructuredContent
  | null;

const coverageSourceNote = {
  source: "census",
  label: "2024 Census county gazetteer",
  attribution: "U.S. Census Bureau Gazetteer Files, 2024 county national file",
  ttlSeconds: 60 * 60 * 24 * 365,
};

const orangeCoverageSummary: CountyCoverageStructuredContent = {
  type: "countyCoverageSummary",
  countySlug: "orange-ca",
  countyLabel: "Orange County",
  supported: true,
  coverageTier: "L1_COUNTY_SHELL",
  coverageLabel: "County shell",
  message: "Orange County is indexed from Census county identity data, but Atlas has not built a playable local scene for it yet.",
  stateCode: "CA",
  geoid: "06059",
  playableDistrictCount: 0,
  placeCount: 0,
  districts: [],
  sourceNotes: [coverageSourceNote],
  limitations: [
    "County shells are identity coverage only until a curated playable district exists.",
    "Atlas does not claim live local data, saved state, XP, evidence, outreach, or automation from coverage shells.",
  ],
  suggestedNextCountySlug: "riverside-ca",
};

const unsupportedCoverageSummary: CountyCoverageStructuredContent = {
  type: "countyCoverageSummary",
  countySlug: "made-up-ca",
  supported: false,
  coverageTier: "L0_UNSUPPORTED",
  coverageLabel: "Unsupported",
  message:
    "Atlas does not have an indexed or curated county contract for this slug yet. Use Riverside County for the playable Engine Beta slice.",
  playableDistrictCount: 0,
  placeCount: 0,
  districts: [],
  sourceNotes: [
    {
      source: "curated",
      label: "Atlas curated Alpha world data",
      attribution: "Atlas curated demo data",
      ttlSeconds: 60 * 60 * 24,
    },
  ],
  limitations: [
    "Atlas only renders a playable scene for Riverside County in this Engine Beta slice.",
    "Unsupported counties do not use Riverside data as a stand-in.",
  ],
  suggestedNextCountySlug: "riverside-ca",
};

const orangeShellScene = compileCountyShellCityWorldScene({
  countySlug: orangeCoverageSummary.countySlug,
  countyName: orangeCoverageSummary.countyLabel ?? "Orange County",
  stateCode: "CA",
  coverage: {
    countySlug: orangeCoverageSummary.countySlug,
    coverageTier: orangeCoverageSummary.coverageTier,
    coverageLabel: orangeCoverageSummary.coverageLabel,
    coverageMessage: orangeCoverageSummary.message,
    playable: false,
  },
});

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

function isCountyCoverageStructuredContent(value: unknown): value is CountyCoverageStructuredContent {
  return Boolean(
    isRecord(value) &&
      value.type === "countyCoverageSummary" &&
      hasString(value, "countySlug") &&
      typeof value.supported === "boolean" &&
      hasString(value, "coverageTier") &&
      hasString(value, "coverageLabel") &&
      hasString(value, "message") &&
      typeof value.playableDistrictCount === "number" &&
      typeof value.placeCount === "number" &&
      Array.isArray(value.districts) &&
      Array.isArray(value.limitations),
  );
}

function isHostedClawdSavedState(value: unknown): value is NonNullable<HostedClawdContext["savedState"]> {
  return Boolean(
    isRecord(value) &&
      value.type === "hostedClawdSavedState" &&
      Array.isArray(value.scoutDrops) &&
      Array.isArray(value.campaignDrafts) &&
      hasString(value, "subscriptionStatus") &&
      hasString(value, "paidWrites") &&
      hasString(value, "readOnlyReason"),
  );
}

function isHostedClawdContext(value: unknown): value is HostedClawdContext {
  return Boolean(
    isRecord(value) &&
      value.type === "hostedClawdContext" &&
      hasString(value, "screenState") &&
      hasString(value, "statusLabel") &&
      hasString(value, "contextLabel") &&
      hasString(value, "primaryCopy") &&
      isRecord(value.billing) &&
      hasString(value.billing, "state") &&
      hasString(value.billing, "confirmationSource") &&
      value.billing.returnUrlGrantsAccess === false &&
      isRecord(value.primaryAction) &&
      hasString(value.primaryAction, "kind") &&
      hasString(value.primaryAction, "label") &&
      typeof value.primaryAction.enabled === "boolean" &&
      Array.isArray(value.savePreview) &&
      (value.savedState === undefined || isHostedClawdSavedState(value.savedState)) &&
      isRecord(value.flags) &&
      typeof value.flags.persistenceEnabled === "boolean" &&
      typeof value.flags.moneyEnabled === "boolean" &&
      typeof value.flags.publicClaimEnabled === "boolean" &&
      Array.isArray(value.gates),
  );
}

function isCityWorldScene(value: unknown): value is CityWorldScene {
  return Boolean(
    isRecord(value) &&
      value.type === "cityWorldScene" &&
      hasString(value, "id") &&
      isRecord(value.region) &&
      Array.isArray(value.cameraPresets) &&
      Array.isArray(value.terrainTiles) &&
      Array.isArray(value.roadSegments) &&
      Array.isArray(value.lots) &&
      Array.isArray(value.buildings) &&
      Array.isArray(value.props) &&
      Array.isArray(value.places) &&
      Array.isArray(value.pins) &&
      Array.isArray(value.actors) &&
      isRecord(value.hudDefaults),
  );
}

function isCameraFocus(value: unknown): value is CameraFocus {
  if (!isRecord(value) || typeof value.sourceSceneId !== "string" || !isRecord(value.preset)) return false;
  const preset = value.preset;
  return (
    typeof preset.id === "string" &&
    isRecord(preset.center) &&
    typeof preset.center.x === "number" &&
    typeof preset.center.y === "number" &&
    typeof preset.zoom === "number" &&
    typeof preset.minZoom === "number" &&
    typeof preset.maxZoom === "number"
  );
}

function isCameraIntent(value: unknown): value is CameraIntent {
  return Boolean(
    isRecord(value) &&
      (value.type === "focus_place" || value.type === "focus_district" || value.type === "focus_water_edge" || value.type === "focus_landmark") &&
      (value.targetNodeId === undefined || typeof value.targetNodeId === "string") &&
      (value.targetLabel === undefined || typeof value.targetLabel === "string"),
  );
}

function cameraIntentFromStructuredContent(value: unknown): CameraIntent | null {
  if (!isRecord(value) || !isCameraIntent(value.cameraIntent)) return null;
  return value.cameraIntent;
}

function placeForCameraIntent(scene: VoxelScene, cameraIntent: CameraIntent | null): NonNullable<VoxelScene["world"]>["places"][number] | null {
  if (!cameraIntent || (cameraIntent.type !== "focus_place" && cameraIntent.type !== "focus_landmark")) return null;
  const places = scene.world?.places ?? [];
  return (
    places.find((place) => cameraIntent.targetLabel && place.label === cameraIntent.targetLabel) ??
    places.find((place) => cameraIntent.targetNodeId && place.nodeId === cameraIntent.targetNodeId) ??
    null
  );
}

export function App() {
  const result = useToolResult<ToolStructuredContent>(null);
  const [localCountySlug, setLocalCountySlug] = useState<CountySwitchSlug | null>(null);
  const [generatedScene, setGeneratedScene] = useState<CityWorldScene | null>(null);
  const [dismissedGeneratedDraftSceneId, setDismissedGeneratedDraftSceneId] = useState<string | null>(null);
  const hasToolResult = result !== null;
  const structuredContent = result?.structuredContent;
  const meta = result?._meta;
  const metaCampaignPreview = isCampaignPreview(meta?.campaignPreview) ? meta.campaignPreview : null;
  const metaScoutPreview = isScoutPreview(meta?.scoutPreview) ? meta.scoutPreview : null;
  const metaScene = isVoxelScene(meta?.scene) ? meta.scene : null;
  const metaCameraFocus = isCameraFocus(meta?.cameraFocus) ? meta.cameraFocus : null;
  const metaHostedClawd = isHostedClawdContext(meta?.hostedClawd) ? meta.hostedClawd : null;
  const coverageSummary = isCountyCoverageStructuredContent(structuredContent) ? structuredContent : null;
  const coverageShellScene = isCityWorldScene(meta?.coverageShellScene) ? meta.coverageShellScene : null;
  const rawGeneratedDraftScene = isCityWorldScene(meta?.generatedDraftScene) ? meta.generatedDraftScene : null;
  const generatedDraftScene = rawGeneratedDraftScene?.id === dismissedGeneratedDraftSceneId ? null : rawGeneratedDraftScene;
  const activeGeneratedScene = generatedScene ?? generatedDraftScene;
  const forcedPlayableCounty = localCountySlug === "riverside-ca";
  const localCoverageState = localCountySlug === "orange-ca"
    ? { coverage: orangeCoverageSummary, shellScene: orangeShellScene }
    : localCountySlug === "made-up-ca"
      ? { coverage: unsupportedCoverageSummary, shellScene: null }
      : null;
  const activeCoverageSummary = forcedPlayableCounty ? null : localCoverageState?.coverage ?? coverageSummary;
  const activeCoverageShellScene = forcedPlayableCounty ? null : localCoverageState?.shellScene ?? coverageShellScene;
  const activeCountySlug = localCountySlug ?? switchSlugFromCoverage(coverageSummary);
  const campaignPreviewSummary = isCampaignPreviewStructuredContent(structuredContent) ? structuredContent : null;
  const scoutPreviewSummary = isScoutPreviewStructuredContent(structuredContent) ? structuredContent : null;
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
  const scene = toolScene ?? campaignPreview?.scene ?? scoutPreview?.scene ?? metaScene ?? riversideDemoVoxelScene;
  const [widgetState, setWidgetState] = useWidgetState<WidgetState>(defaultWidgetState);
  const sessionResumeContextSentRef = useRef(false);
  const sessionResume = sessionResumeForWidgetState(widgetState);
  const currentScoutPreviewId = scoutPreview?.id ?? campaignPreview?.scoutPreviewId;
  const toolCameraIntent = cameraIntentFromStructuredContent(structuredContent);

  useEffect(() => {
    if (!sessionResume || sessionResumeContextSentRef.current) return;
    sessionResumeContextSentRef.current = true;
    void updateModelContext(sessionResume.modelContext);
  }, [sessionResume]);

  useEffect(() => {
    if (!currentScoutPreviewId || widgetState.scoutPreviewId === currentScoutPreviewId) return;
    setWidgetState((current) => (
      current.scoutPreviewId === currentScoutPreviewId
        ? current
        : { ...current, scoutPreviewId: currentScoutPreviewId }
    ));
  }, [currentScoutPreviewId, widgetState.scoutPreviewId]);

  // Apply a tool-carried camera intent ONCE per tool result — later user taps
  // must not be stomped by effect re-runs (audit: touch_tap_select).
  const appliedCameraIntentForRef = useRef<unknown>(null);
  useEffect(() => {
    if (!toolCameraIntent || appliedCameraIntentForRef.current === structuredContent) return;
    const place = placeForCameraIntent(scene, toolCameraIntent);
    if (!place) return;
    appliedCameraIntentForRef.current = structuredContent;
    setWidgetState((current) => {
      if (current.activeSceneId === scene.id && current.selectedPlaceId === place.id && current.selectedNodeId === place.nodeId) {
        return current;
      }
      return {
        ...current,
        activeSceneId: scene.id,
        selectedDistrictId: place.districtId,
        selectedPlaceId: place.id,
        selectedNodeId: place.nodeId,
        activeStepId: "place",
        noteDraft: "",
      };
    });
  }, [scene, setWidgetState, structuredContent, toolCameraIntent]);

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
  const storedHostedClawdContext = activeSceneMatches && isHostedClawdContext(widgetState.hostedClawdContext)
    ? widgetState.hostedClawdContext
    : null;
  const hostedClawdReturnStatus = hostedClawdSubscriptionStatusFromUrl();
  const hostedClawdContext =
    metaHostedClawd
      ? storedHostedClawdContext ?? metaHostedClawd
      : !hasToolResult
        ? storedHostedClawdContext ??
          defaultHostedClawdContext({
            scene,
            selectedPlaceLabel: selectedPlace?.label,
            scoutPreview,
            campaignPreview,
            selectedNoteCount: notes.length,
            ...(hostedClawdReturnStatus ? { subscriptionStatus: hostedClawdReturnStatus } : {}),
          })
        : null;
  const hostedClawdOpen = activeSceneMatches && hostedClawdContext ? widgetState.hostedClawdOpen ?? false : false;
  const hostedClawdActionMessage = activeSceneMatches && hostedClawdContext ? widgetState.hostedClawdActionMessage : undefined;

  const selectCountyFromSwitcher = (countySlug: CountySwitchSlug) => {
    setGeneratedScene(null);
    setDismissedGeneratedDraftSceneId(null);
    setLocalCountySlug(countySlug);
    if (countySlug === "riverside-ca") {
      const firstPlace = riversideDemoVoxelScene.world?.places[0];
      setWidgetState((current) => ({
        ...current,
        activeSceneId: riversideDemoVoxelScene.id,
        selectedDistrictId: riversideDemoVoxelScene.world?.selectedDistrictId,
        selectedPlaceId: firstPlace?.id,
        selectedNodeId: firstPlace?.nodeId ?? riversideDemoVoxelScene.selectedNodeId,
        activeStepId: "county",
        noteDraft: "",
      }));
    }
    void updateModelContext(`Atlas county switcher selected ${countyLabelForSwitch(countySlug)}.`);
  };

  const openGeneratedPreview = () => {
    const draftCountySlug = activeCoverageSummary?.countySlug ?? "orange-ca";
    setGeneratedScene(null);
    setDismissedGeneratedDraftSceneId(null);
    void updateModelContext(
      `Atlas requested a generated draft scene packet for ${draftCountySlug}. The draft must stay session-only, non-playable, provider-free, and widget-meta only.`,
    );
    void sendUserMessage(
      `Open an Atlas generated draft for ${draftCountySlug}. Use render_voxel_county with countySlug "${draftCountySlug}" and includeGeneratedDraft true. Keep structuredContent as the county coverage summary and put the generated scene only in _meta.`,
    );
  };

  const exitGeneratedPreview = () => {
    const firstPlace = riversideDemoVoxelScene.world?.places[0];
    if (activeGeneratedScene) {
      setDismissedGeneratedDraftSceneId(activeGeneratedScene.id);
    }
    setGeneratedScene(null);
    setLocalCountySlug("riverside-ca");
    setWidgetState((current) => ({
      ...current,
      activeSceneId: riversideDemoVoxelScene.id,
      selectedDistrictId: riversideDemoVoxelScene.world?.selectedDistrictId,
      selectedPlaceId: firstPlace?.id,
      selectedNodeId: firstPlace?.nodeId ?? riversideDemoVoxelScene.selectedNodeId,
      activeStepId: "county",
      noteDraft: "",
    }));
    void updateModelContext("Atlas exited the generated synthetic preview and returned to Riverside/Eastvale.");
  };

  const countySwitcher = (
    <>
      <CountySwitcher activeCountySlug={activeCountySlug} onSelectCounty={selectCountyFromSwitcher} />
      <button type="button" className="city-world-generate-district" data-qa="generate-district-button" onClick={openGeneratedPreview}>
        <strong>Generate a district</strong>
        <span>generated · session-only</span>
      </button>
    </>
  );

  if (!activeGeneratedScene && activeCoverageSummary) {
    return <CountyCoverageView coverage={activeCoverageSummary} shellScene={activeCoverageShellScene} countySwitcher={countySwitcher} />;
  }

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

  const openHostedClawd = () => {
    const context = hostedClawdContext;
    if (!context) return;
    setWidgetState((current) => ({
      ...current,
      activeSceneId: scene.id,
      hostedClawdOpen: true,
      hostedClawdActionMessage: undefined,
    }));
    void updateModelContext(`User opened Atlas save for ${context.contextLabel}.`);
  };

  const closeHostedClawd = () => {
    setWidgetState((current) => ({
      ...current,
      activeSceneId: scene.id,
      hostedClawdOpen: false,
    }));
  };

  const handleHostedClawdPrimaryAction = () => {
    const context = hostedClawdContext;
    if (!context) return;
    const payload = hostedClawdPayload({
      context,
      scene,
      selectedPlaceLabel: selectedPlace?.label,
      scoutPreview,
      campaignPreview,
      selectedNoteCount: notes.length,
    });

    if (context.primaryAction.kind === "open_saved_campaign" || context.primaryAction.kind === "refresh_status") {
      void fetch(savedStateEndpointForHostedClawd(payload), { method: "GET" })
        .then((response) => response.json() as Promise<{ ok?: boolean; result?: { reason?: string; message?: string; context?: unknown }; hostedClawd?: unknown; error?: string }>)
        .then((body) => {
          const isAuthBoundary =
            isRecord(body.result) && (body.result.reason === "auth_required" || body.result.reason === "read_scope_required");
          const nextContext =
            isHostedClawdContext(body.hostedClawd) ? body.hostedClawd : isHostedClawdContext(body.result?.context) ? body.result.context : null;
          setWidgetState((current) => ({
            ...current,
            activeSceneId: scene.id,
            hostedClawdOpen: true,
            hostedClawdActionMessage: body.result?.message ?? body.error ?? "Saved state is not available yet.",
            ...(nextContext && !isAuthBoundary ? { hostedClawdContext: nextContext } : {}),
          }));
        })
        .catch(() => {
          setWidgetState((current) => ({
            ...current,
            activeSceneId: scene.id,
            hostedClawdActionMessage: "Connect ChatGPT to load saved items.",
          }));
        });
      return;
    }

    const endpoint = endpointForHostedClawdAction(context.primaryAction.kind);

    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json() as Promise<{ result?: { message?: string; redirectUrl?: string } }>)
      .then((body) => {
        const message = body.result?.message ?? context.primaryCopy;
        setWidgetState((current) => ({
          ...current,
          activeSceneId: scene.id,
          hostedClawdActionMessage: message,
        }));
        if (body.result?.redirectUrl) {
          window.open(body.result.redirectUrl, "_blank", "noopener,noreferrer");
        }
      })
      .catch(() => {
        setWidgetState((current) => ({
          ...current,
          activeSceneId: scene.id,
          hostedClawdActionMessage: "This business stays in this chat.",
        }));
      });
  };

  const advancePreview = () => {
    if (campaignPreview) {
      if (hostedClawdContext) openHostedClawd();
      return;
    }

    if (scoutPreview) {
      void sendUserMessage(campaignAdvancePrompt(scoutPreview));
    }
  };

  return (
    <CityWorldView
      scene={scene}
      cameraFocus={metaCameraFocus}
      showFirstRunHint={!widgetState.firstRunHintDismissed}
      onDismissFirstRunHint={() => setWidgetState((current) => ({ ...current, firstRunHintDismissed: true }))}
      selectedDistrictId={selectedDistrictId}
      selectedPlaceId={selectedPlaceId}
      stickers={stickers}
      notes={notes}
      stickerMode={stickerMode}
      noteDraft={noteDraft}
      scoutPreview={scoutPreview}
      campaignPreview={campaignPreview}
      sessionResumeLabel={sessionResume?.label}
      hostedClawdContext={hostedClawdContext}
      hostedClawdOpen={hostedClawdOpen}
      hostedClawdActionMessage={hostedClawdActionMessage}
      {...(scoutPreview || (campaignPreview && hostedClawdContext) ? { onAdvancePreview: advancePreview } : {})}
      countySwitcher={countySwitcher}
      generatedScene={activeGeneratedScene}
      {...(hostedClawdContext
        ? {
            onOpenHostedClawd: openHostedClawd,
            onCloseHostedClawd: closeHostedClawd,
            onHostedClawdPrimaryAction: handleHostedClawdPrimaryAction,
          }
        : {})}
      onExitGeneratedPreview={exitGeneratedPreview}
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

function endpointForHostedClawdAction(action: HostedClawdActionKind): string {
  switch (action) {
    case "continue_to_stripe":
      return "/api/hosted-clawd/checkout";
    case "open_billing_portal":
      return "/api/hosted-clawd/billing-portal";
    case "open_saved_campaign":
    case "refresh_status":
      return "/api/hosted-clawd/saved";
    case "create_hosted_clawd":
    case "join_waitlist":
      return "/api/hosted-clawd/create-or-attach";
  }
}

function savedStateEndpointForHostedClawd(payload: ReturnType<typeof hostedClawdPayload>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || Array.isArray(value)) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/api/hosted-clawd/saved?${query}` : "/api/hosted-clawd/saved";
}

function hostedClawdPayload({
  context,
  scene,
  selectedPlaceLabel,
  scoutPreview,
  campaignPreview,
  selectedNoteCount,
}: {
  context: HostedClawdContext;
  scene: VoxelScene;
  selectedPlaceLabel?: string | undefined;
  scoutPreview?: ScoutPreviewState | null;
  campaignPreview?: CampaignPreviewState | null;
  selectedNoteCount: number;
}) {
  return {
    trigger: context.trigger,
    businessType: campaignPreview?.businessType ?? scoutPreview?.businessType ?? "local business",
    primaryGoal: scoutPreview?.goal,
    countySlug: scene.county.slug,
    countyLabel: scene.county.name,
    placeLabel: selectedPlaceLabel ?? "Eastvale",
    scoutPreviewId: campaignPreview?.scoutPreviewId ?? scoutPreview?.id,
    campaignPreviewId: campaignPreview?.id,
    campaignSummary: campaignPreview?.summary,
    selectedNoteCount,
    clientRequestId: `hosted-clawd-${scene.id}-${campaignPreview?.id ?? scoutPreview?.id ?? context.trigger}`,
  };
}

function defaultHostedClawdContext({
  scene,
  selectedPlaceLabel,
  scoutPreview,
  campaignPreview,
  selectedNoteCount,
  subscriptionStatus,
}: {
  scene: VoxelScene;
  selectedPlaceLabel?: string | undefined;
  scoutPreview?: ScoutPreviewState | null;
  campaignPreview?: CampaignPreviewState | null;
  selectedNoteCount: number;
  subscriptionStatus?: HostedClawdContext["billing"]["subscriptionStatus"];
}): HostedClawdContext {
  const businessType = campaignPreview?.businessType ?? scoutPreview?.businessType ?? "this business";
  const trigger = campaignPreview ? "campaign_preview" : scoutPreview ? "scout_drop" : "map_tray";
  const screenState = screenStateFromSubscription(subscriptionStatus ?? "none");
  const savePreview: HostedClawdContext["savePreview"] = [
    {
      label: "Business",
      value: businessType,
      status: businessType === "this business" ? "needs_confirmation" : "ready",
    },
    {
      label: "Location",
      value: selectedPlaceLabel ?? scene.county.name,
      status: "ready",
    },
    {
      label: "Scout report",
      value: scoutPreview || campaignPreview ? "In this chat" : "Run Scout first",
      status: scoutPreview || campaignPreview ? "ready" : "planned",
    },
    {
      label: "Campaign draft",
      value: campaignPreview ? "In this chat" : "Preview campaign first",
      status: campaignPreview ? "ready" : "planned",
    },
  ];

  if (selectedNoteCount > 0) {
    savePreview.push({
      label: "Notes",
      value: `${selectedNoteCount} selected note${selectedNoteCount === 1 ? "" : "s"}`,
      status: "needs_confirmation",
    });
  }

  return {
    type: "hostedClawdContext",
    mode: screenState === "waitlist" ? "alpha_free" : "beta_paid",
    screenState,
    trigger,
    statusLabel: statusLabelForHostedClawdScreen(screenState),
    contextLabel: `${businessType} at ${selectedPlaceLabel ?? scene.county.name}`,
    primaryCopy: primaryCopyForHostedClawdScreen(screenState),
    secondaryCopy: secondaryCopyForHostedClawdScreen(screenState),
    sessionBoundary: screenState === "active" ? "Saved state on." : screenState === "inactive_payment_failed" ? "Saved items are read only." : "Lives in this chat.",
    paymentCopy: screenState === "waitlist" ? "Billing is off in Alpha." : "Atlas checks billing before saving.",
    billing: billingSummaryForHostedClawdScreen(screenState),
    primaryAction: {
      kind:
        screenState === "checkout_pending"
          ? "continue_to_stripe"
          : screenState === "inactive_payment_failed"
            ? "open_billing_portal"
            : screenState === "active"
              ? "open_saved_campaign"
              : screenState === "activating"
                ? "refresh_status"
                : "join_waitlist",
      label:
        screenState === "checkout_pending"
          ? "Open test Checkout"
          : screenState === "inactive_payment_failed"
            ? "Fix billing"
            : screenState === "active"
              ? "Open saved state"
              : screenState === "activating"
                ? "Check status"
                : "Join waitlist",
      enabled: true,
    },
    savePreview,
    flags: {
      persistenceEnabled: screenState !== "waitlist",
      moneyEnabled: screenState !== "waitlist",
      publicClaimEnabled: false,
    },
    gates: [
      {
        gate: "HUMAN_APPROVAL_BEFORE_PERSISTENCE",
        flag: "ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED",
        approved: screenState !== "waitlist",
        requiredFor: "accounts, business memory, Scout Drop saves, campaign saves, evidence, XP, reports, exports, and database migrations",
      },
      {
        gate: "HUMAN_APPROVAL_BEFORE_MONEY",
        flag: "ATLAS_HOSTED_CLAWD_MONEY_ENABLED",
        approved: screenState !== "waitlist",
        requiredFor: "Stripe Checkout, Billing Portal, paid limits, and subscription-gated writes",
      },
      {
        gate: "HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM",
        flag: "ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED",
        approved: false,
        requiredFor: "public pricing copy, saved-state launch claims, and external Beta promotion",
      },
    ],
    canPersist: screenState !== "waitlist",
    canStartCheckout: screenState === "checkout_pending",
    canUsePaidWrites: screenState === "active",
  };
}

function hostedClawdSubscriptionStatusFromUrl(): HostedClawdContext["billing"]["subscriptionStatus"] | undefined {
  if (typeof window === "undefined") return undefined;
  const value = new URLSearchParams(window.location.search).get("hosted_clawd");
  if (value === "checkout_return" || value === "portal_return") return "activating";
  return undefined;
}

function screenStateFromSubscription(status: HostedClawdContext["billing"]["subscriptionStatus"]): HostedClawdScreenState {
  switch (status) {
    case "active":
      return "active";
    case "activating":
      return "activating";
    case "inactive":
    case "payment_failed":
      return "inactive_payment_failed";
    case "none":
    default:
      return "waitlist";
  }
}

function statusLabelForHostedClawdScreen(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "waitlist":
      return "Alpha Free";
    case "confirm_save":
      return "Beta Invite";
    case "checkout_pending":
      return "Test billing";
    case "activating":
      return "Activating";
    case "active":
      return "Active";
    case "inactive_payment_failed":
      return "Billing issue";
  }
}

function primaryCopyForHostedClawdScreen(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "checkout_pending":
      return "Test Checkout can open after setup is confirmed.";
    case "activating":
      return "Return received. Checking billing.";
    case "active":
      return "Saved state is active.";
    case "inactive_payment_failed":
      return "Billing needs attention. Saved items stay readable.";
    case "confirm_save":
      return "Save this business, scout report, and campaign draft.";
    case "waitlist":
    default:
      return "Use this setup in this chat.";
  }
}

function secondaryCopyForHostedClawdScreen(screenState: HostedClawdScreenState): string {
  switch (screenState) {
    case "checkout_pending":
      return "A browser return does not turn on saving.";
    case "activating":
      return "Keep working in the map while Atlas checks the server event.";
    case "active":
      return "Saves are tied to this business profile.";
    case "inactive_payment_failed":
      return "New saves are paused until billing is fixed.";
    case "confirm_save":
      return "Stickers and notes live in this chat.";
    case "waitlist":
    default:
      return "This map, pins, notes, Scout Drop, and campaign preview live in this chat.";
  }
}

function billingSummaryForHostedClawdScreen(screenState: HostedClawdScreenState): HostedClawdContext["billing"] {
  if (screenState === "active") {
    return {
      state: "webhook_confirmed",
      subscriptionStatus: "active",
      confirmationSource: "webhook",
      returnUrlGrantsAccess: false,
      paidWrites: "enabled",
      title: "Confirmed",
      detail: "Saving is on for this state.",
      checkoutLabel: "Checkout done",
      webhookLabel: "Confirmed",
      returnLabel: "Checked",
      portalLabel: "Billing portal",
    };
  }
  if (screenState === "activating") {
    return {
      state: "return_pending",
      subscriptionStatus: "activating",
      confirmationSource: "none",
      returnUrlGrantsAccess: false,
      paidWrites: "read_only",
      title: "Return received",
      detail: "Waiting for server confirmation. New saves stay paused.",
      checkoutLabel: "Checkout started",
      webhookLabel: "Pending",
      returnLabel: "Pending",
      portalLabel: "Portal waits",
    };
  }
  if (screenState === "inactive_payment_failed") {
    return {
      state: "payment_attention",
      subscriptionStatus: "payment_failed",
      confirmationSource: "none",
      returnUrlGrantsAccess: false,
      paidWrites: "read_only",
      title: "Billing issue",
      detail: "Saved items are readable. New saves are paused.",
      checkoutLabel: "Checkout paused",
      webhookLabel: "Not active",
      returnLabel: "Not confirmed",
      portalLabel: "Billing portal",
    };
  }
  return {
    state: screenState === "checkout_pending" ? "test_ready" : "off",
    subscriptionStatus: "none",
    confirmationSource: "none",
    returnUrlGrantsAccess: false,
    paidWrites: "read_only",
    title: screenState === "checkout_pending" ? "Test billing ready" : "Billing off",
    detail: screenState === "checkout_pending" ? "Checkout opens only after setup is confirmed. Stripe test mode." : "Billing is not live in Alpha.",
    checkoutLabel: screenState === "checkout_pending" ? "Test Checkout" : "Checkout off",
    webhookLabel: screenState === "checkout_pending" ? "Confirmation required" : "Idle",
    returnLabel: screenState === "checkout_pending" ? "Not confirmed" : "No return",
    portalLabel: screenState === "checkout_pending" ? "Portal checked" : "Portal off",
  };
}

function switchSlugFromCoverage(coverage: CountyCoverageStructuredContent | null): CountySwitchSlug {
  if (!coverage) return "riverside-ca";
  if (coverage.countySlug === "orange-ca") return "orange-ca";
  if (coverage.coverageTier === "L0_UNSUPPORTED") return "made-up-ca";
  return "riverside-ca";
}

function sessionResumeForWidgetState(state: WidgetState): { label: string; modelContext: string } | null {
  const pinCount = state.stickers?.length ?? 0;
  const noteCount = state.notes?.length ?? 0;
  const scoutPreviewId = state.scoutPreviewId?.trim();
  if (pinCount === 0 && noteCount === 0 && !scoutPreviewId) return null;

  const labelParts = [
    ...(pinCount > 0 ? [`${pinCount} ${pinCount === 1 ? "pin" : "pins"}`] : []),
    ...(noteCount > 0 ? [`${noteCount} ${noteCount === 1 ? "note" : "notes"}`] : []),
    ...(scoutPreviewId ? ["Scout Drop"] : []),
  ];
  const contextParts = [
    ...(pinCount > 0 ? [`${pinCount} ${pinCount === 1 ? "pin" : "pins"}`] : []),
    ...(noteCount > 0 ? [`${noteCount} ${noteCount === 1 ? "note" : "notes"}`] : []),
    ...(scoutPreviewId ? [`Scout Drop ${scoutPreviewId}`] : []),
  ];

  return {
    label: `${labelParts.join(" · ")} in this chat`,
    modelContext: `Atlas resumed this chat with ${contextParts.join(", ")}. Treat these as in-chat session state only.`,
  };
}

function campaignAdvancePrompt(preview: ScoutPreviewState): string {
  const locationLabel =
    preview.scene.world?.places.find((place) => place.nodeId === preview.selectedNodeId)?.label ??
    preview.scene.nodes.find((node) => node.id === preview.selectedNodeId)?.label ??
    preview.selectedNodeId;

  return [
    "Preview the 7-day campaign for this Scout Drop.",
    `Call preview_campaign_engine with scoutPreviewId ${JSON.stringify(preview.id)}, countySlug ${JSON.stringify(preview.countySlug)}, nodeId ${JSON.stringify(preview.selectedNodeId)}, locationLabel ${JSON.stringify(locationLabel)}, businessType ${JSON.stringify(preview.businessType)}, and goal ${JSON.stringify(preview.goal)}.`,
  ].join(" ");
}

function countyLabelForSwitch(countySlug: CountySwitchSlug): string {
  switch (countySlug) {
    case "riverside-ca":
      return "Riverside playable";
    case "orange-ca":
      return "Orange indexed shell";
    case "made-up-ca":
      return "unsupported county state";
  }
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
