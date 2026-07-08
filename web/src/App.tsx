import { useMemo, useState } from "react";
import type { CampaignPreviewState, ScoutPreviewState } from "@atlas/core/scout";
import {
  compileCountyShellCityWorldScene,
  createVoxelNote,
  createVoxelSticker,
  exampleParametricDistrictSpec,
  generateParametricCityWorldScene,
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

type ToolStructuredContent =
  | CampaignPreviewState
  | CampaignPreviewStructuredContent
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

export function App() {
  const result = useToolResult<ToolStructuredContent>(null);
  const [localCountySlug, setLocalCountySlug] = useState<CountySwitchSlug | null>(null);
  const [generatedScene, setGeneratedScene] = useState<CityWorldScene | null>(null);
  const structuredContent = result?.structuredContent;
  const meta = result?._meta;
  const metaCampaignPreview = isCampaignPreview(meta?.campaignPreview) ? meta.campaignPreview : null;
  const metaScoutPreview = isScoutPreview(meta?.scoutPreview) ? meta.scoutPreview : null;
  const metaScene = isVoxelScene(meta?.scene) ? meta.scene : null;
  const coverageSummary = isCountyCoverageStructuredContent(structuredContent) ? structuredContent : null;
  const coverageShellScene = isCityWorldScene(meta?.coverageShellScene) ? meta.coverageShellScene : null;
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

  const selectCountyFromSwitcher = (countySlug: CountySwitchSlug) => {
    setGeneratedScene(null);
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
    const generatedResult = generateParametricCityWorldScene(exampleParametricDistrictSpec());
    setGeneratedScene(generatedResult.scene);
    void updateModelContext(
      "Atlas opened a generated synthetic district preview. It is not a real place, not real coverage, and session-only.",
    );
  };

  const exitGeneratedPreview = () => {
    const firstPlace = riversideDemoVoxelScene.world?.places[0];
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

  if (!generatedScene && activeCoverageSummary) {
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

  const advancePreview = () => {
    if (campaignPreview) {
      void sendUserMessage("What are the Hosted Clawd hosting options?");
      return;
    }

    if (scoutPreview) {
      void sendUserMessage("Preview the 7-day campaign for this Scout Drop.");
    }
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
      scoutPreview={scoutPreview}
      campaignPreview={campaignPreview}
      {...(campaignPreview || scoutPreview ? { onAdvancePreview: advancePreview } : {})}
      countySwitcher={countySwitcher}
      generatedScene={generatedScene}
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

function switchSlugFromCoverage(coverage: CountyCoverageStructuredContent | null): CountySwitchSlug {
  if (!coverage) return "riverside-ca";
  if (coverage.countySlug === "orange-ca") return "orange-ca";
  if (coverage.coverageTier === "L0_UNSUPPORTED") return "made-up-ca";
  return "riverside-ca";
}

function countyLabelForSwitch(countySlug: CountySwitchSlug): string {
  switch (countySlug) {
    case "riverside-ca":
      return "Riverside playable Alpha";
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
