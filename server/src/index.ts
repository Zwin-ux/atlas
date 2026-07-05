import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { brotliCompressSync, gzipSync, constants as zlibConstants } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  previewCampaignFromScout,
  previewScoutDrop,
  type CampaignPreviewState,
  type ScoutPreviewState,
} from "@atlas/core/scout";
import {
  CountyPackService,
  CountyQuestionService,
  compileCountyShellCityWorldScene,
  compileVoxelSceneFromCountyPack,
  createNationalWorldService,
  type UsCountyWorldResponse,
  type UsUnsupportedWorldResponse,
  type CityWorldScene,
  type WorldLookupPlaceInput,
  type WorldPlaceLookupResponse,
  type WorldSourceKind,
  type WorldSourceNote,
} from "@atlas/core";
import { riversideDemoVoxelScene } from "@atlas/core/voxel";
import { createGeoDataAdapter, isGoogleMapsConfigured, readGeoAdapterConfig } from "@atlas/geo";
import { z } from "zod";
import {
  createScenePacketMemoryAdapter,
  SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
  type ScenePacketMemorySummary,
} from "./scenePacketMemoryAdapter.js";

const SERVER_VERSION = "0.1.0";
const WIDGET_URI = "ui://widget/atlas-city-world-v1.html";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const MAX_WORLD_LOOKUP_CACHE_ENTRIES = 100;
const MAX_SCENE_PACKET_MEMORY_ENTRIES = 32;
const PLAYABLE_ENGINE_BETA_COUNTY_SLUG = "riverside-ca";

loadLocalEnv();

const WEB_DIST = resolve(ROOT_DIR, "web/dist");
const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = process.env.MCP_PATH ?? "/mcp";
const countyPackService = new CountyPackService(resolve(ROOT_DIR, "data", "county_packs"));
const countyQuestionService = new CountyQuestionService(countyPackService);
const worldService = createNationalWorldService([riversideDemoVoxelScene]);
const scenePacketMemory = createScenePacketMemoryAdapter<ScoutPreviewState["scene"]>({
  maxEntries: MAX_SCENE_PACKET_MEMORY_ENTRIES,
});

type WorldLookupCacheEntry = {
  response: WorldPlaceLookupResponse;
  expiresAtMs: number;
};

const worldLookupCache = new Map<string, WorldLookupCacheEntry>();

type ScoutPreviewStructuredContent = Omit<ScoutPreviewState, "scene"> & {
  sceneId: string;
  flow: ScoutPreviewState["scene"]["flow"];
};

type CampaignPreviewStructuredContent = Omit<CampaignPreviewState, "scene"> & {
  sceneId: string;
  flow: CampaignPreviewState["scene"]["flow"];
};

type VoxelSceneStructuredContent = {
  type: "voxelSceneSummary";
  sceneId: string;
  county: ScoutPreviewState["scene"]["county"];
  selectedNodeId: string;
  selectedDistrictId?: string;
  activeScale?: string;
  nodeCount: number;
  districtCount: number;
  placeCount: number;
  stickerCount: number;
  noteCount: number;
  routeNodeIds: string[];
  flow: ScoutPreviewState["scene"]["flow"];
};

type CountyCoverageStructuredContent = {
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

const voxelPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const voxelTileSchema = z.object({
  id: z.string(),
  position: voxelPointSchema,
  kind: z.enum(["open", "residential", "commercial", "route", "risk", "scouted"]),
  elevation: z.number(),
  label: z.string().optional(),
});

const atlasNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["city", "residential_cluster", "commercial_plaza", "apartment_cluster", "regional_center"]),
  position: voxelPointSchema,
  score: z.number(),
  signals: z.array(z.string()),
  campaignSuggestion: z.string(),
});

const atlasEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  kind: z.enum(["signal", "route", "regional_route"]),
});

const atlasMarkerSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  kind: z.enum(["opportunity", "risk", "scouted", "drop"]),
  label: z.string(),
});

const voxelObjectSchema = z.object({
  id: z.string(),
  kind: z.enum(["home", "plaza", "park", "landmark", "road", "freeway", "warehouse", "qr_surface", "risk_gate", "drop_zone", "scout_marker"]),
  position: voxelPointSchema,
  label: z.string(),
  nodeId: z.string().optional(),
  layerId: z.string().optional(),
  intensity: z.number().optional(),
});

const voxelCameraSchema = z.object({
  focusNodeId: z.string(),
  initialZoom: z.number(),
  minZoom: z.number(),
  maxZoom: z.number(),
});

const voxelLayerSchema = z.object({
  id: z.string(),
  label: z.string(),
  visible: z.boolean(),
});

const voxelWorldScaleSchema = z.enum(["country", "state", "county", "district", "place"]);
const voxelPlaceKindSchema = z.enum(["home_area", "shop", "plaza", "park", "road", "landmark"]);
const voxelStickerKindSchema = z.enum(["home", "shop", "park", "favorite", "idea", "question"]);

const voxelWorldNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  scale: voxelWorldScaleSchema,
  parentId: z.string().optional(),
  slug: z.string().optional(),
  position: voxelPointSchema.optional(),
});

const voxelDistrictSchema = z.object({
  id: z.string(),
  label: z.string(),
  countySlug: z.string(),
  worldNodeId: z.string(),
  summary: z.string(),
  playable: z.boolean(),
  focusNodeIds: z.array(z.string()),
  position: voxelPointSchema,
});

const voxelPlaceSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: voxelPlaceKindSchema,
  districtId: z.string(),
  nodeId: z.string(),
  position: voxelPointSchema,
  description: z.string(),
  activity: z.number(),
});

const voxelStickerSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  kind: voxelStickerKindSchema,
  label: z.string(),
  noteId: z.string().optional(),
});

const voxelNoteSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  body: z.string(),
  stickerId: z.string().optional(),
});

const voxelAmbientStateSchema = z.object({
  timeOfDay: z.enum(["morning", "midday", "evening"]),
  activity: z.enum(["calm", "busy", "closing"]),
  traffic: z.number(),
  residents: z.number(),
});

const voxelWorldSchema = z.object({
  activeScale: voxelWorldScaleSchema,
  selectedDistrictId: z.string(),
  nodes: z.array(voxelWorldNodeSchema),
  districts: z.array(voxelDistrictSchema),
  places: z.array(voxelPlaceSchema),
  ambient: voxelAmbientStateSchema,
  stickers: z.array(voxelStickerSchema).optional(),
  notes: z.array(voxelNoteSchema).optional(),
});

const clawdStateSchema = z.object({
  nodeId: z.string(),
  routeNodeIds: z.array(z.string()),
  label: z.string(),
  status: z.enum(["ready", "scouting", "reporting"]),
  mood: z.enum(["idle", "scanning", "reporting"]).optional(),
  pulse: z.boolean().optional(),
});

const panelStatSchema = z.object({
  label: z.string(),
  value: z.string(),
  tone: z.enum(["good", "watch", "neutral"]),
});

const scoutReportPanelSchema = z.object({
  type: z.literal("scout_report"),
  title: z.string(),
  focusNodeId: z.string(),
  summary: z.string(),
  bestOffer: z.string().optional(),
  channels: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  nextActions: z.array(z.string()).optional(),
  upgradePrompt: z.string().optional(),
  signals: z
    .array(
      z.object({
        label: z.string(),
        detail: z.string(),
        score: z.number(),
      }),
    )
    .optional(),
  stats: z.array(panelStatSchema),
});

const campaignChannelSchema = z.enum(["qr_flyer", "local_group", "property_manager", "partner", "google_profile"]);

const campaignDaySchema = z.object({
  day: z.number(),
  label: z.string(),
  focus: z.string(),
  channel: campaignChannelSchema,
  routeNodeIds: z.array(z.string()),
  steps: z.array(z.string()),
  proof: z.string(),
});

const campaignRoutePrioritySchema = z.object({
  nodeId: z.string(),
  label: z.string(),
  priority: z.number(),
  reason: z.string(),
});

const campaignAssetPlaceholderSchema = z.object({
  id: z.string(),
  label: z.string(),
  channel: campaignChannelSchema,
  format: z.enum(["qr_flyer", "post_draft", "outreach_script", "checklist", "profile_update"]),
  copyIntent: z.string(),
});

const alphaPreviewBoundarySchema = z.object({
  mode: z.literal("session_only_alpha"),
  savesState: z.literal(false),
  executesActions: z.literal(false),
  grantsXp: z.literal(false),
  requiresHostedClawdForSave: z.literal(true),
  nextTool: z.enum(["preview_campaign_engine", "get_upgrade_options"]),
  userActionLabel: z.string(),
});

const campaignPreviewPanelSchema = z.object({
  type: z.literal("campaign_preview"),
  title: z.string(),
  focusNodeId: z.string(),
  summary: z.string(),
  offer: z.string(),
  days: z.array(campaignDaySchema),
  routePriorities: z.array(campaignRoutePrioritySchema),
  assetPlaceholders: z.array(campaignAssetPlaceholderSchema),
  guardrails: z.array(z.string()),
  stats: z.array(panelStatSchema),
  upgradePrompt: z.string().optional(),
});

const upgradePanelSchema = z.object({
  type: z.literal("upgrade"),
  title: z.string(),
  summary: z.string(),
});

const flowStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["done", "active", "next"]),
});

const voxelSceneOutputSchema = {
  type: z.literal("voxelScene"),
  id: z.string(),
  county: z.object({
    name: z.string(),
    state: z.string(),
    slug: z.string(),
  }),
  theme: z.literal("light_county"),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
    originX: z.number(),
    originY: z.number(),
    tileWidth: z.number(),
    tileHeight: z.number(),
    tileDepth: z.number(),
  }),
  tiles: z.array(voxelTileSchema),
  nodes: z.array(atlasNodeSchema),
  edges: z.array(atlasEdgeSchema),
  markers: z.array(atlasMarkerSchema),
  objects: z.array(voxelObjectSchema).optional(),
  camera: voxelCameraSchema.optional(),
  layers: z.array(voxelLayerSchema).optional(),
  world: voxelWorldSchema.optional(),
  clawd: clawdStateSchema,
  panel: z.union([scoutReportPanelSchema, campaignPreviewPanelSchema, upgradePanelSchema]),
  flow: z.array(flowStepSchema),
  selectedNodeId: z.string(),
};

const voxelSceneSummaryOutputSchema = {
  type: z.literal("voxelSceneSummary"),
  sceneId: z.string(),
  county: z.object({
    name: z.string(),
    state: z.string(),
    slug: z.string(),
  }),
  selectedNodeId: z.string(),
  selectedDistrictId: z.string().optional(),
  activeScale: z.string().optional(),
  nodeCount: z.number(),
  districtCount: z.number(),
  placeCount: z.number(),
  stickerCount: z.number(),
  noteCount: z.number(),
  routeNodeIds: z.array(z.string()),
  flow: z.array(flowStepSchema),
};

const countyCoverageTierSchema = z.enum([
  "L0_UNSUPPORTED",
  "L1_COUNTY_SHELL",
  "L2_CURATED_DISTRICT",
  "L3_PROVIDER_NORMALIZED",
  "L4_PUBLIC_QUALITY",
]);

const countyCoverageSummaryOutputSchema = {
  type: z.literal("countyCoverageSummary"),
  countySlug: z.string(),
  countyLabel: z.string().optional(),
  supported: z.boolean(),
  coverageTier: countyCoverageTierSchema,
  coverageLabel: z.string(),
  message: z.string(),
  stateCode: z.string().optional(),
  geoid: z.string().optional(),
  playableDistrictCount: z.number(),
  placeCount: z.number(),
  districts: z.array(
    z.object({
      label: z.string(),
      districtSlug: z.string(),
      playable: z.boolean(),
      geoid: z.string().optional(),
      coverageTier: countyCoverageTierSchema.optional(),
    }),
  ),
  sourceNotes: z.array(
    z.object({
      source: z.string(),
      label: z.string(),
      attribution: z.string(),
      ttlSeconds: z.number(),
    }),
  ),
  limitations: z.array(z.string()),
  suggestedNextCountySlug: z.string(),
};

const countySelectionOutputSchema = {
  type: z.enum(["voxelSceneSummary", "countyCoverageSummary"]),
  sceneId: z.string().optional(),
  county: z
    .object({
      name: z.string(),
      state: z.string(),
      slug: z.string(),
    })
    .optional(),
  selectedNodeId: z.string().optional(),
  selectedDistrictId: z.string().optional(),
  activeScale: z.string().optional(),
  nodeCount: z.number().optional(),
  districtCount: z.number().optional(),
  countySlug: z.string().optional(),
  countyLabel: z.string().optional(),
  supported: z.boolean().optional(),
  coverageTier: countyCoverageTierSchema.optional(),
  coverageLabel: z.string().optional(),
  message: z.string().optional(),
  stateCode: z.string().optional(),
  geoid: z.string().optional(),
  playableDistrictCount: z.number().optional(),
  placeCount: z.number(),
  stickerCount: z.number().optional(),
  noteCount: z.number().optional(),
  routeNodeIds: z.array(z.string()).optional(),
  flow: z.array(flowStepSchema).optional(),
  districts: countyCoverageSummaryOutputSchema.districts.optional(),
  sourceNotes: countyCoverageSummaryOutputSchema.sourceNotes.optional(),
  limitations: z.array(z.string()).optional(),
  suggestedNextCountySlug: z.string().optional(),
};

const scoutPreviewOutputSchema = {
  type: z.literal("scoutPreview"),
  id: z.string(),
  countySlug: z.string(),
  selectedNodeId: z.string(),
  businessType: z.string(),
  goal: z.string(),
  summary: z.string(),
  bestOffer: z.string(),
  route: z.array(
    z.object({
      nodeId: z.string(),
      label: z.string(),
      reason: z.string(),
    }),
  ),
  signals: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      detail: z.string(),
      score: z.number(),
      tone: z.enum(["high", "medium", "watch"]),
      sourceNodeIds: z.array(z.string()),
    }),
  ),
  risks: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      mitigation: z.string(),
    }),
  ),
  channels: z.array(z.string()),
  nextActions: z.array(z.string()),
  upgradePrompt: z.string(),
  limitations: z.array(z.string()),
  alphaBoundary: alphaPreviewBoundarySchema,
  sceneId: z.string(),
  flow: z.array(flowStepSchema),
};

const campaignPreviewOutputSchema = {
  type: z.literal("campaignPreview"),
  id: z.string(),
  scoutPreviewId: z.string(),
  countySlug: z.string(),
  selectedNodeId: z.string(),
  businessType: z.string(),
  summary: z.string(),
  offer: z.string(),
  days: z.array(campaignDaySchema),
  routePriorities: z.array(campaignRoutePrioritySchema),
  assetPlaceholders: z.array(campaignAssetPlaceholderSchema),
  guardrails: z.array(z.string()),
  alphaBoundary: alphaPreviewBoundarySchema,
  sceneId: z.string(),
  flow: z.array(flowStepSchema),
};

const upgradeOptionsOutputSchema = {
  type: z.literal("upgradeOptions"),
  trigger: z.string().optional(),
  free: z.object({
    label: z.string(),
    included: z.array(z.string()),
    limits: z.array(z.string()),
  }),
  hosted: z.object({
    label: z.string(),
    status: z.literal("planned_beta"),
    included: z.array(z.string()),
  }),
  unavailableActions: z.array(z.string()),
  nextStep: z.string(),
};

const worldSourceNoteSchema = z.object({
  source: z.enum(["mock", "curated", "google", "census", "osm", "local-open-data"]),
  label: z.string(),
  attribution: z.string(),
  ttlSeconds: z.number(),
});

const worldPlaceCategorySchema = z.enum([
  "home_area",
  "food_drink",
  "shop",
  "service",
  "park",
  "school",
  "civic",
  "health",
  "fitness",
  "entertainment",
  "transit",
  "landmark",
  "unknown",
]);

const worldPlaceLookupOutputSchema = {
  type: z.literal("worldPlaceLookup"),
  query: z.string(),
  radiusMeters: z.number(),
  mode: z.enum(["mock", "google"]),
  resolvedLocation: z.object({
    id: z.string(),
    label: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    formattedAddress: z.string().optional(),
  }),
  places: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      category: worldPlaceCategorySchema,
      coordinates: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
      address: z.string().optional(),
      sourceNotes: z.array(worldSourceNoteSchema),
    }),
  ),
  cache: z.object({
    key: z.string(),
    ttlSeconds: z.number(),
    sourceNotes: z.array(worldSourceNoteSchema),
  }),
  providerReadiness: z.object({
    status: z.literal("lookup_only"),
    sources: z.array(z.enum(["mock", "curated", "google", "census", "osm", "local-open-data"])),
    mode: z.enum(["mock", "google"]),
    cache: z.object({
      key: z.string(),
      ttlSeconds: z.number(),
    }),
    normalizedCategoryStatus: z.enum(["bounded_atlas_categories", "contains_unknown_category"]),
    normalizedCategoryConfidence: z.enum(["mock_verified", "provider_mapped"]),
    coveragePromotion: z.literal(false),
    sceneEligible: z.literal(false),
    publicQuality: z.literal(false),
    sceneGeometry: z.literal(false),
    rawProviderPayloadExposed: z.literal(false),
    structuredContentPolicy: z.literal("atlas_normalized_only"),
    fieldMaskPolicy: z.object({
      mode: z.literal("allowlist"),
      wildcardAllowed: z.literal(false),
      allowedFieldCount: z.number(),
    }),
    limitations: z.array(z.string()),
  }),
  runtime: z
    .object({
      cacheHit: z.boolean(),
      cachedAt: z.string(),
      expiresAt: z.string(),
    })
    .optional(),
};

const countyQuestionAnswerOutputSchema = {
  type: z.literal("countyQuestionAnswer"),
  countySlug: z.string(),
  question: z.string(),
  supported: z.boolean(),
  topic: z.enum(["eastvale_first_slice", "business_signals", "county_summary", "source_limits", "unsupported"]),
  answer: z.string(),
  facts: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      sourceNodeIds: z.array(z.string()).optional(),
    }),
  ),
  sourceNotes: z.array(
    z.object({
      name: z.string(),
      sourceType: z.string(),
      confidenceScore: z.number(),
    }),
  ),
  limitations: z.array(z.string()),
  suggestedNextTool: z.enum(["select_county", "preview_scout_drop", "lookup_world_places"]).optional(),
};

function scoutPreviewStructuredContent(preview: ScoutPreviewState): ScoutPreviewStructuredContent {
  const { scene, ...content } = preview;
  return {
    ...content,
    sceneId: scene.id,
    flow: scene.flow,
  };
}

function campaignPreviewStructuredContent(preview: CampaignPreviewState): CampaignPreviewStructuredContent {
  const { scene, ...content } = preview;
  return {
    ...content,
    sceneId: scene.id,
    flow: scene.flow,
  };
}

function voxelSceneStructuredContent(scene: ScoutPreviewState["scene"]): VoxelSceneStructuredContent {
  return {
    type: "voxelSceneSummary",
    sceneId: scene.id,
    county: scene.county,
    selectedNodeId: scene.selectedNodeId,
    ...(scene.world?.selectedDistrictId ? { selectedDistrictId: scene.world.selectedDistrictId } : {}),
    ...(scene.world?.activeScale ? { activeScale: scene.world.activeScale } : {}),
    nodeCount: scene.nodes.length,
    districtCount: scene.world?.districts.length ?? 0,
    placeCount: scene.world?.places.length ?? 0,
    stickerCount: scene.world?.stickers?.length ?? 0,
    noteCount: scene.world?.notes?.length ?? 0,
    routeNodeIds: scene.clawd.routeNodeIds,
    flow: scene.flow,
  };
}

function countyCoverageStructuredContent(
  response: UsCountyWorldResponse | UsUnsupportedWorldResponse,
): CountyCoverageStructuredContent {
  if (response.type === "usWorldUnsupported") {
    return {
      type: "countyCoverageSummary",
      countySlug: response.countySlug,
      supported: false,
      coverageTier: response.coverageTier,
      coverageLabel: "Unsupported",
      message: response.message,
      playableDistrictCount: 0,
      placeCount: 0,
      districts: [],
      sourceNotes: response.cache.sourceNotes,
      limitations: [
        "Atlas only has a playable map for Riverside/Eastvale right now.",
        "Unsupported counties do not use Riverside data as a stand-in.",
      ],
      suggestedNextCountySlug: response.suggestedNextCountySlug,
    };
  }

  return {
    type: "countyCoverageSummary",
    countySlug: response.county.countySlug,
    countyLabel: response.county.label,
    supported: response.county.supported,
    coverageTier: response.county.coverageTier,
    coverageLabel: response.county.coverageLabel,
    message: response.county.coverageMessage,
    stateCode: response.county.stateCode,
    ...(response.county.geoid ? { geoid: response.county.geoid } : {}),
    playableDistrictCount: response.county.playableDistrictCount,
    placeCount: response.county.placeCount,
    districts: response.districts.map((district) => ({
      label: district.label,
      districtSlug: district.districtSlug,
      playable: district.playable,
      ...(district.geoid ? { geoid: district.geoid } : {}),
      ...(district.coverageTier ? { coverageTier: district.coverageTier } : {}),
    })),
    sourceNotes: response.cache.sourceNotes,
    limitations: [
      "County shells are browse-only until a curated playable district exists.",
      "Atlas does not invent local places, saves, XP, evidence, outreach, or automation for shells.",
    ],
    suggestedNextCountySlug: PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
  };
}

function countyCoverageForSlug(countySlug: string): CountyCoverageStructuredContent {
  try {
    return countyCoverageStructuredContent(worldService.getCounty(countySlug));
  } catch {
    return countyCoverageStructuredContent(worldService.getUnsupportedCounty(countySlug));
  }
}

function coverageShellSceneForSummary(coverage: CountyCoverageStructuredContent): CityWorldScene | undefined {
  if (coverage.coverageTier !== "L1_COUNTY_SHELL" || !coverage.stateCode) {
    return undefined;
  }
  return compileCountyShellCityWorldScene({
    countySlug: coverage.countySlug,
    countyName: coverage.countyLabel ?? coverage.countySlug,
    stateCode: coverage.stateCode,
    coverage: {
      countySlug: coverage.countySlug,
      coverageTier: coverage.coverageTier,
      coverageLabel: coverage.coverageLabel,
      coverageMessage: coverage.message,
      playable: false,
    },
  });
}

function isPlayableEngineBetaCounty(countySlug: string | undefined): boolean {
  return (countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG) === PLAYABLE_ENGINE_BETA_COUNTY_SLUG;
}

function compileCountyScene(countySlug = PLAYABLE_ENGINE_BETA_COUNTY_SLUG, selectedNodeId?: string): ScoutPreviewState["scene"] {
  if (countySlug !== PLAYABLE_ENGINE_BETA_COUNTY_SLUG) {
    throw new Error(`Atlas Engine Beta only renders a playable scene for ${PLAYABLE_ENGINE_BETA_COUNTY_SLUG}.`);
  }
  const pack = countyPackService.loadCountyPack(countySlug);
  return compileVoxelSceneFromCountyPack(pack, { selectedNodeId });
}

function getOrCreatePlayableScenePacket(
  countySlug = PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
  selectedNodeId = "eastvale",
): { scene: ScoutPreviewState["scene"]; scenePacket: ScenePacketMemorySummary } {
  const packet = scenePacketMemory.getOrCreatePlayableScenePacket({
    stateCode: "CA",
    countySlug,
    districtSlug: "eastvale",
    selectedNodeId,
    cameraPresetId: "mcp-default",
    sceneSchemaVersion: "voxel-scene-v1",
    createScene: () => compileCountyScene(countySlug, selectedNodeId),
    sceneIdForPayload: (scene) => scene.id,
  });

  if (!packet.payload) {
    throw new Error(`Scene packet cache did not return a playable scene for ${countySlug}.`);
  }

  return {
    scene: packet.payload,
    scenePacket: packet.summary,
  };
}

function scenePacketStatusForCoverage(coverage: CountyCoverageStructuredContent): ScenePacketMemorySummary {
  return scenePacketMemory.describeCoverageStatus({
    stateCode: coverage.stateCode ?? "CA",
    countySlug: coverage.countySlug,
    coverageTier: coverage.coverageTier,
    sourceNotes: coverage.sourceNotes.map(toWorldSourceNote),
  });
}

function toWorldSourceNote(note: CountyCoverageStructuredContent["sourceNotes"][number]): WorldSourceNote {
  return {
    source: isWorldSourceKind(note.source) ? note.source : "curated",
    label: note.label,
    attribution: note.attribution,
    ttlSeconds: note.ttlSeconds,
  };
}

function isWorldSourceKind(value: string): value is WorldSourceKind {
  return value === "mock" || value === "curated" || value === "google" || value === "census" || value === "osm" || value === "local-open-data";
}

function upgradeOptionsStructuredContent(trigger?: string) {
  return {
    type: "upgradeOptions" as const,
    ...(trigger ? { trigger } : {}),
    free: {
      label: "Clawd Companion",
      included: [
        "Explore the Riverside city map.",
        "Run temporary Scout Drop previews.",
        "Draft manual campaign previews from a Scout Drop.",
      ],
      limits: [
        "No saved business memory.",
        "No saved campaigns, quests, evidence, or XP.",
        "No posting, messaging, ad buying, or automated outreach.",
      ],
    },
    hosted: {
      label: "Hosted Clawd Daemon",
      status: "planned_beta" as const,
      included: [
        "Saved business profile and Scout Drop history.",
        "Persistent campaigns, quest tracking, evidence, and XP.",
        "Weekly progress summaries and exports after Beta storage is live.",
      ],
    },
    unavailableActions: [
      "Stripe checkout is not available in Alpha.",
      "Atlas cannot create an account or persist campaign history yet.",
      "Atlas will not auto-post, auto-DM, buy ads, or scrape private people.",
    ],
    nextStep: "Use the free Alpha preview now; Hosted Clawd becomes the persistence layer in Beta.",
  };
}

// The built widget inlines the whole ~1MB JS/CSS bundle into a single HTML
// document (self-contained for the ChatGPT widget sandbox, which forbids
// sibling chunk fetches). The bundle is immutable for the life of the process,
// so read + build it exactly once.
let builtWidgetCache: string | null = null;

function readBuiltWidget(): string {
  if (builtWidgetCache !== null) return builtWidgetCache;

  const jsPath = resolve(WEB_DIST, "component.js");
  const cssPath = resolve(WEB_DIST, "component.css");

  if (!existsSync(jsPath) || !existsSync(cssPath)) {
    throw new Error("Widget bundle not found. Run `pnpm build:web` before starting the MCP server.");
  }

  const js = readFileSync(jsPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  builtWidgetCache = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Atlas City Map</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">${js}</script>
  </body>
</html>`;
  return builtWidgetCache;
}

// Pre-compressed variants of the preview HTML. The inlined bundle is highly
// compressible (~1MB -> ~250KB brotli), and it never changes at runtime, so we
// pay the (high-quality) compression cost once and serve the buffer directly.
type WidgetPayload = { html: string; brotli: Buffer; gzip: Buffer };
let widgetPayloadCache: WidgetPayload | null = null;

function getWidgetPayload(): WidgetPayload {
  if (widgetPayloadCache !== null) return widgetPayloadCache;
  const html = readBuiltWidget();
  const buffer = Buffer.from(html, "utf8");
  widgetPayloadCache = {
    html,
    brotli: brotliCompressSync(buffer, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
        [zlibConstants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
      },
    }),
    gzip: gzipSync(buffer, { level: 9 }),
  };
  return widgetPayloadCache;
}

function negotiatePreviewEncoding(req: IncomingMessage): "br" | "gzip" | null {
  const accept = String(req.headers["accept-encoding"] ?? "").toLowerCase();
  if (accept.includes("br")) return "br";
  if (accept.includes("gzip")) return "gzip";
  return null;
}

function sendPreviewResponse(req: IncomingMessage, res: ServerResponse): void {
  const payload = getWidgetPayload();
  const encoding = negotiatePreviewEncoding(req);
  const headers: Record<string, string> = {
    "content-type": "text/html; charset=utf-8",
    vary: "Accept-Encoding",
  };

  if (encoding === "br") {
    headers["content-encoding"] = "br";
    res.writeHead(200, headers);
    res.end(payload.brotli);
    return;
  }
  if (encoding === "gzip") {
    headers["content-encoding"] = "gzip";
    res.writeHead(200, headers);
    res.end(payload.gzip);
    return;
  }

  res.writeHead(200, headers);
  res.end(payload.html);
}

function textResponse(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

function htmlResponse(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

// ---- Legal / directory pages (ChatGPT App Store G6 requirement) -------------
// Atlas is session-only: it persists nothing, has no accounts, and sells no
// data. These pages state exactly that — they are honest to the app's actual
// behavior (verified by verify-submission.mjs / verify-provider-boundaries.mjs),
// not boilerplate. Owner contact is overridable via ATLAS_CONTACT_EMAIL.
const ATLAS_CONTACT_EMAIL = process.env.ATLAS_CONTACT_EMAIL ?? "mzwin3545@gmail.com";
const LEGAL_LAST_UPDATED = "2026-07-05";

function legalPageShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Atlas — ${title}</title>
    <style>
      :root { color-scheme: light dark; }
      body { max-width: 46rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #1c2530; background: #fbfaf6; }
      @media (prefers-color-scheme: dark) { body { color: #e7ecf2; background: #12161b; } }
      h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
      h2 { font-size: 1.1rem; margin: 1.8rem 0 .4rem; }
      .meta { opacity: .6; font-size: .85rem; margin-bottom: 1.5rem; }
      a { color: #2f6fb0; }
      ul { padding-left: 1.2rem; }
      li { margin: .3rem 0; }
    </style>
  </head>
  <body>
    <h1>Atlas — ${title}</h1>
    <p class="meta">Last updated ${LEGAL_LAST_UPDATED}. Atlas is an Alpha ChatGPT app.</p>
    ${bodyHtml}
    <p style="margin-top:2.5rem"><a href="/preview">Open Atlas</a></p>
  </body>
</html>`;
}

function privacyPageHtml(): string {
  return legalPageShell(
    "Privacy Policy",
    `<p>Atlas is a ChatGPT app that renders a voxel county map and session-only
      previews. It is built to store as little as possible about you.</p>
    <h2>What Atlas does not collect</h2>
    <ul>
      <li>No accounts, no sign-in, no user profiles.</li>
      <li>No persistent storage of your activity. Pins, notes, scout drops, and
        campaign previews exist only for the current session and are discarded
        when it ends. Nothing is saved to a database.</li>
      <li>No advertising identifiers, no cross-site tracking, no data sales.</li>
    </ul>
    <h2>Location lookups</h2>
    <p>When you ask Atlas to look up a place, the location text you provide may be
      sent to Google Maps Platform to resolve it into map results. This is
      read-only and used solely to answer that request; Atlas does not store the
      query or the result beyond the session. Google's handling of that request
      is governed by Google's own privacy terms.</p>
    <h2>Data shared with OpenAI / ChatGPT</h2>
    <p>Atlas runs inside ChatGPT via the Apps SDK. Your interaction with the
      ChatGPT surface is governed by OpenAI's privacy policy. Atlas itself
      receives only the tool inputs needed to render the map and previews.</p>
    <h2>Children</h2>
    <p>Atlas is not directed to children under 13.</p>
    <h2>Contact</h2>
    <p>Questions about this policy: <a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>.</p>`,
  );
}

function termsPageHtml(): string {
  return legalPageShell(
    "Terms of Service",
    `<p>By using Atlas you agree to these terms. Atlas is Alpha software provided
      as-is, for exploration and preview only.</p>
    <h2>What Atlas is</h2>
    <p>A session-only voxel map and business-scouting preview tool inside ChatGPT.
      Scout Drop and campaign previews are illustrative planning aids — they are
      not guarantees of results, and they do not post, message, advertise, or take
      any action on your behalf.</p>
    <h2>What Atlas is not (yet)</h2>
    <ul>
      <li>It does not save data, run automations, or process payments.</li>
      <li>Coverage is honest: only counties marked playable are interactive; shell
        and unsupported counties are clearly labeled and are not real playable
        worlds.</li>
    </ul>
    <h2>Acceptable use</h2>
    <p>Do not use Atlas to attempt to extract provider data, to misrepresent its
      previews as commitments, or in violation of OpenAI's usage policies.</p>
    <h2>No warranty</h2>
    <p>Atlas is provided "as is" without warranties of any kind. To the maximum
      extent permitted by law, the operator is not liable for any damages arising
      from its use.</p>
    <h2>Contact</h2>
    <p><a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>.</p>`,
  );
}

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function loadLocalEnv(): void {
  const localEnvPath = resolve(ROOT_DIR, ".env.local");
  if (!existsSync(localEnvPath)) return;

  const lines = readFileSync(localEnvPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (process.env[key] !== undefined) continue;
    process.env[key] = unquoteEnvValue(rawValue);
  }
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function geoStatusPayload(): unknown {
  const config = readGeoAdapterConfig(process.env);
  return {
    mode: config.mode,
    googleMapsConfigured: isGoogleMapsConfigured(process.env),
    liveApiCallsEnabled: config.mode === "google" && isGoogleMapsConfigured(process.env),
    selectedApis: ["Geocoding API", "Places API (New)", "Places Aggregate API"],
  };
}

function handleWorldRoute(url: URL, res: ServerResponse): boolean {
  if (url.pathname === "/api/world/us/coverage") {
    jsonResponse(res, 200, worldService.listCoverageDirectory());
    return true;
  }

  if (url.pathname === "/api/world/us/states") {
    jsonResponse(res, 200, worldService.listCountry());
    return true;
  }

  const stateCountiesMatch = url.pathname.match(/^\/api\/world\/us\/states\/([a-zA-Z]{2})\/counties$/);
  if (stateCountiesMatch) {
    const stateCode = stateCountiesMatch[1];
    if (!stateCode) {
      jsonResponse(res, 400, { ok: false, error: "Missing state code." });
      return true;
    }
    jsonResponse(res, 200, worldService.listStateCounties(stateCode));
    return true;
  }

  const countyMatch = url.pathname.match(/^\/api\/world\/counties\/([a-z0-9-]+)$/);
  if (countyMatch) {
    const countySlug = countyMatch[1];
    if (!countySlug) {
      jsonResponse(res, 400, { ok: false, error: "Missing county slug." });
      return true;
    }
    try {
      jsonResponse(res, 200, worldService.getCounty(countySlug));
    } catch (error) {
      jsonResponse(res, 404, {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown county.",
        coverage: worldService.getUnsupportedCounty(countySlug),
      });
    }
    return true;
  }

  const districtMatch = url.pathname.match(/^\/api\/world\/counties\/([a-z0-9-]+)\/districts\/([a-z0-9-]+)$/);
  if (districtMatch) {
    const countySlug = districtMatch[1];
    const districtSlug = districtMatch[2];
    if (!countySlug || !districtSlug) {
      jsonResponse(res, 400, { ok: false, error: "Missing county or district slug." });
      return true;
    }
    try {
      jsonResponse(res, 200, worldService.getDistrict(countySlug, districtSlug));
    } catch (error) {
      jsonResponse(res, 404, { ok: false, error: error instanceof Error ? error.message : "Unknown district." });
    }
    return true;
  }

  return false;
}

async function handleWorldLookup(url: URL, res: ServerResponse): Promise<void> {
  const query = url.searchParams.get("query")?.trim();
  if (!query) {
    jsonResponse(res, 400, { ok: false, error: "Missing query." });
    return;
  }

  const radiusMeters = parseRadiusMeters(url.searchParams.get("radiusMeters"));
  if (!radiusMeters) {
    jsonResponse(res, 400, { ok: false, error: "radiusMeters must be between 100 and 50000." });
    return;
  }

  try {
    jsonResponse(res, 200, await performWorldLookup(query, radiusMeters));
  } catch (error) {
    jsonResponse(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "World lookup failed.",
    });
  }
}

async function handleGeoGeocode(url: URL, res: ServerResponse): Promise<void> {
  const query = url.searchParams.get("query")?.trim();
  if (!query) {
    jsonResponse(res, 400, { ok: false, error: "Missing query." });
    return;
  }

  try {
    const adapter = createGeoDataAdapter(readGeoAdapterConfig(process.env));
    const location = await adapter.geocode({ query });
    jsonResponse(res, 200, { ok: true, mode: adapter.mode, location });
  } catch (error) {
    jsonResponse(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "Geocode failed.",
    });
  }
}

function parseRadiusMeters(value: string | null): number | undefined {
  const radius = value ? Number.parseInt(value, 10) : 3500;
  if (!Number.isFinite(radius) || radius < 100 || radius > 50_000) {
    return undefined;
  }
  return radius;
}

async function performWorldLookup(query: string, radiusMeters: number): Promise<WorldPlaceLookupResponse> {
  const config = readGeoAdapterConfig(process.env);
  const cacheKey = worldLookupCacheKey(query, radiusMeters, config.mode);
  const cached = getWorldLookupCache(cacheKey);
  if (cached) {
    return withLookupRuntime(cached.response, true, cached.expiresAtMs);
  }

  const adapter = createGeoDataAdapter(config);
  const resolvedLocation = await adapter.geocode({ query });
  const places = await adapter.nearbySearch({
    center: resolvedLocation.coordinates,
    radiusMeters,
    maxResultCount: 20,
    rankPreference: "POPULARITY",
  });

  const response = worldService.lookupPlaces({
    query,
    radiusMeters,
    mode: adapter.mode,
    resolvedLocation: {
      id: resolvedLocation.id,
      label: resolvedLocation.label,
      coordinates: resolvedLocation.coordinates,
      ...(resolvedLocation.formattedAddress ? { formattedAddress: resolvedLocation.formattedAddress } : {}),
    },
    places: places.map(
      (place, index): WorldLookupPlaceInput => ({
        atlasLookupId: atlasLookupPlaceId(place.category, place.label, index),
        label: place.label,
        category: place.category,
        ...(place.coordinates ? { coordinates: place.coordinates } : {}),
        ...(place.address ? { address: place.address } : {}),
        source: place.source,
        attribution: place.attribution,
        ttlSeconds: place.ttlSeconds,
      }),
    ),
  });
  const expiresAtMs = Date.now() + response.cache.ttlSeconds * 1000;
  setWorldLookupCache(cacheKey, response, expiresAtMs);
  return withLookupRuntime(response, false, expiresAtMs);
}

function atlasLookupPlaceId(category: string, label: string, index: number): string {
  const safeCategory = slugifyLookupToken(category || "unknown");
  const safeLabel = slugifyLookupToken(label || `place-${index + 1}`).slice(0, 36);
  return `lookup-${safeCategory}-${index + 1}-${safeLabel}`;
}

function slugifyLookupToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

function worldLookupCacheKey(query: string, radiusMeters: number, mode: "mock" | "google"): string {
  return `world-lookup:${mode}:${radiusMeters}:${query.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

function getWorldLookupCache(cacheKey: string): WorldLookupCacheEntry | undefined {
  const entry = worldLookupCache.get(cacheKey);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAtMs) {
    worldLookupCache.delete(cacheKey);
    return undefined;
  }
  return entry;
}

function setWorldLookupCache(cacheKey: string, response: WorldPlaceLookupResponse, expiresAtMs: number): void {
  if (worldLookupCache.size >= MAX_WORLD_LOOKUP_CACHE_ENTRIES) {
    const oldestKey = worldLookupCache.keys().next().value;
    if (oldestKey) {
      worldLookupCache.delete(oldestKey);
    }
  }
  worldLookupCache.set(cacheKey, { response, expiresAtMs });
}

function withLookupRuntime(
  response: WorldPlaceLookupResponse,
  cacheHit: boolean,
  expiresAtMs: number,
): WorldPlaceLookupResponse {
  const cachedAt = new Date().toISOString();
  return {
    ...response,
    runtime: {
      cacheHit,
      cachedAt,
      expiresAt: new Date(expiresAtMs).toISOString(),
    },
  };
}

function handleScoutDrop(url: URL, res: ServerResponse): void {
  try {
    const preview = previewScoutDrop({
      countySlug: url.searchParams.get("countySlug") ?? "riverside-ca",
      nodeId: url.searchParams.get("nodeId") ?? undefined,
      locationLabel: url.searchParams.get("locationLabel") ?? "Eastvale",
      businessType: url.searchParams.get("businessType") ?? "mobile detailing",
      goal: url.searchParams.get("goal") ?? "Find the strongest first drop for a local mobile detailing offer.",
      budget: url.searchParams.get("budget") ?? undefined,
      serviceRadius: url.searchParams.get("serviceRadius") ?? undefined,
    });
    jsonResponse(res, 200, { ok: true, preview });
  } catch (error) {
    jsonResponse(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Scout Drop failed.",
    });
  }
}

function handleCampaignPreview(url: URL, res: ServerResponse): void {
  const scoutPreviewId = url.searchParams.get("scoutPreviewId")?.trim();
  if (!scoutPreviewId) {
    jsonResponse(res, 400, { ok: false, error: "Missing scoutPreviewId from preview_scout_drop." });
    return;
  }

  try {
    const scoutPreview = previewScoutDrop({
      countySlug: url.searchParams.get("countySlug") ?? "riverside-ca",
      nodeId: url.searchParams.get("nodeId") ?? undefined,
      locationLabel: url.searchParams.get("locationLabel") ?? "Eastvale",
      businessType: url.searchParams.get("businessType") ?? "mobile detailing",
      goal: url.searchParams.get("goal") ?? "Find the strongest first drop for a local mobile detailing offer.",
      budget: url.searchParams.get("budget") ?? undefined,
      serviceRadius: url.searchParams.get("serviceRadius") ?? undefined,
    });

    if (scoutPreview.id !== scoutPreviewId) {
      jsonResponse(res, 400, {
        ok: false,
        error: `Scout preview mismatch. Expected ${scoutPreview.id} for the supplied Alpha inputs.`,
      });
      return;
    }

    jsonResponse(res, 200, { ok: true, preview: previewCampaignFromScout(scoutPreview) });
  } catch (error) {
    jsonResponse(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Campaign preview failed.",
    });
  }
}

function createAtlasServer(): McpServer {
  const server = new McpServer(
    { name: "atlas-chatgpt-app", version: SERVER_VERSION },
    {
      instructions:
        "Use select_county to open Riverside/Eastvale, the playable Atlas map right now. Use render_voxel_county when the user asks to refresh or focus that map. Shell counties are browse-only and must not invent places or tools. Use ask_county_question for closed-world questions answered from the curated Riverside/Eastvale Alpha pack. Use lookup_world_places for lookup-only nearby places; lookup results are not saved and are not coverage proof. Use preview_scout_drop when the user asks to drop Clawd or scout. Use preview_campaign_engine only after a Scout Drop exists. Use get_upgrade_options for Hosted Clawd limits. Keep structuredContent concise. Do not claim persistence, XP grants, posting, DMs, paid ads, automation, or live campaign execution in Alpha.",
    },
  );

  registerAppResource(server, "atlas-city-world-widget", WIDGET_URI, {}, async () => ({
    contents: [
      {
        uri: WIDGET_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: readBuiltWidget(),
        _meta: {
          ui: {
            prefersBorder: false,
            ...(process.env.WIDGET_DOMAIN ? { domain: process.env.WIDGET_DOMAIN } : {}),
            csp: {
              connectDomains: [],
              resourceDomains: [],
            },
          },
          "openai/widgetDescription": "Shows the Atlas Riverside voxel city map with places, stickers, notes, and temporary Alpha planning previews.",
        },
      },
    ],
  }));

  registerAppTool(
    server,
    "lookup_world_places",
    {
      title: "Lookup world places",
      description:
        "Resolve a location and return nearby places normalized into Atlas-owned place categories. This is read-only and may use Google Maps Platform when configured.",
      inputSchema: {
        query: z.string().min(1).describe("Location query, such as Eastvale, CA."),
        radiusMeters: z
          .number()
          .int()
          .min(100)
          .max(50_000)
          .optional()
          .describe("Lookup radius in meters. Defaults to 3500."),
      },
      outputSchema: worldPlaceLookupOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
        destructiveHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Looking up nearby places...",
        "openai/toolInvocation/invoked": "Nearby places ready.",
      },
    },
    async ({ query, radiusMeters }) => {
      const lookup = await performWorldLookup(query, radiusMeters ?? 3500);
      const categories = [...new Set(lookup.places.map((place) => place.category))].sort();
      const categoryText = categories.length > 0 ? categories.join(", ") : "none";
      return {
        structuredContent: lookup,
        content: [
          {
            type: "text" as const,
            text: `Found ${lookup.places.length} lookup-only places around ${lookup.resolvedLocation.label}. Categories: ${categoryText}. Results are normalized into Atlas categories, not saved, and not coverage proof. This does not unlock a playable county map.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "select_county",
    {
      title: "Select county",
      description:
        "Select a California county coverage contract. Riverside returns the playable Eastvale scene; shell counties return honest coverage state only.",
      inputSchema: {
        countySlug: z.string().optional().describe("County slug. Engine Beta renders riverside-ca and shells indexed California counties."),
      },
      outputSchema: countySelectionOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Loading Riverside County...",
        "openai/toolInvocation/invoked": "Riverside County ready.",
      },
    },
    async ({ countySlug }) => {
      if (!isPlayableEngineBetaCounty(countySlug)) {
        const coverage = countyCoverageForSlug(countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG);
        const coverageShellScene = coverageShellSceneForSummary(coverage);
        const scenePacket = scenePacketStatusForCoverage(coverage);
        return {
          structuredContent: coverage,
          _meta: {
            scenePacket,
            ...(coverageShellScene ? { coverageShellScene } : {}),
          },
          content: [
            {
              type: "text" as const,
              text: `${coverage.message} ${coverage.countyLabel ?? "This county"} is browse-only in Atlas right now. Riverside/Eastvale is playable now. Atlas does not invent local places, saves, XP, evidence, or automation for shell counties.`,
            },
          ],
        };
      }

      const { scene, scenePacket } = getOrCreatePlayableScenePacket(countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG, "eastvale");
      return {
        structuredContent: voxelSceneStructuredContent(scene),
        _meta: {
          scene,
          scenePacket,
        },
        content: [
          {
            type: "text" as const,
            text: `Selected ${scene.county.name}. Eastvale is the playable district in this county. Use the map for places, pins, and session-only notes.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "ask_county_question",
    {
      title: "Ask county question",
      description:
        "Answer a small set of Riverside/Eastvale county and business questions from the curated Atlas Alpha pack only. Closed-world and read-only.",
      inputSchema: {
        question: z.string().min(1).describe("County or business question to answer from curated Atlas data."),
        countySlug: z.string().optional().describe("County slug. Alpha supports riverside-ca."),
        businessType: z
          .string()
          .optional()
          .describe("Optional supported business lane, such as mobile detailing, cleaning, or local event."),
      },
      outputSchema: countyQuestionAnswerOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Checking curated county data...",
        "openai/toolInvocation/invoked": "County answer ready.",
      },
    },
    async ({ question, countySlug, businessType }) => {
      const answer = countyQuestionService.answer({ question, countySlug, businessType });
      const answerPrefix = answer.supported
        ? "Curated Riverside/Eastvale answer."
        : "Atlas can only answer curated Riverside/Eastvale county questions right now.";
      return {
        structuredContent: answer,
        content: [
          {
            type: "text" as const,
            text: `${answerPrefix} ${answer.answer}\n\nLimits: ${answer.limitations.join(" ")} No saves, XP, evidence, or automation are created by this answer.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "render_voxel_county",
    {
      title: "Render voxel county",
      description: "Render the Riverside County voxel city map, or return honest coverage state for non-playable counties.",
      inputSchema: {
        countySlug: z.string().optional(),
        selectedNodeId: z.string().optional(),
      },
      outputSchema: countySelectionOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Opening city map...",
        "openai/toolInvocation/invoked": "City map ready.",
      },
    },
    async ({ countySlug, selectedNodeId }) => {
      if (!isPlayableEngineBetaCounty(countySlug)) {
        const coverage = countyCoverageForSlug(countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG);
        const coverageShellScene = coverageShellSceneForSummary(coverage);
        const scenePacket = scenePacketStatusForCoverage(coverage);
        return {
          structuredContent: coverage,
          _meta: {
            scenePacket,
            ...(coverageShellScene ? { coverageShellScene } : {}),
          },
          content: [
            {
              type: "text" as const,
              text: `${coverage.message} ${coverage.countyLabel ?? "This county"} is browse-only in Atlas right now. Atlas only draws a local world after a curated playable district exists. Open Riverside/Eastvale for the playable map.`,
            },
          ],
        };
      }

      const { scene, scenePacket } = getOrCreatePlayableScenePacket(
        countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
        selectedNodeId ?? "eastvale",
      );
      return {
        structuredContent: voxelSceneStructuredContent(scene),
        _meta: {
          scene,
          scenePacket,
        },
        content: [
          {
            type: "text" as const,
            text: `Showing the Riverside/Eastvale playable map. Pins and notes stay in this chat.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "preview_scout_drop",
    {
      title: "Preview Scout Drop",
      description:
        "Drop Clawd into a Riverside node and return a temporary Scout Drop preview with route, signals, risks, channels, and next actions. Alpha is curated demo data only.",
      inputSchema: {
        countySlug: z.string().optional().describe("County slug. Alpha supports riverside-ca."),
        nodeId: z.string().optional().describe("Atlas node id, such as eastvale."),
        locationLabel: z.string().optional().describe("Fallback location label, such as Eastvale."),
        businessType: z.string().optional().describe("Business type to scout, such as mobile detailing."),
        goal: z.string().optional().describe("Scout goal."),
        budget: z.string().optional().describe("Optional plain-language budget note."),
        serviceRadius: z.string().optional().describe("Optional service radius note."),
      },
      outputSchema: scoutPreviewOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Dropping Clawd...",
        "openai/toolInvocation/invoked": "Scout Drop ready.",
      },
    },
    async ({ countySlug, nodeId, locationLabel, businessType, goal, budget, serviceRadius }) => {
      const preview = previewScoutDrop({
        countySlug: countySlug ?? "riverside-ca",
        nodeId,
        locationLabel: locationLabel ?? "Eastvale",
        businessType: businessType ?? "mobile detailing",
        goal: goal ?? "Find the strongest first drop for a local mobile detailing offer.",
        budget,
        serviceRadius,
      });
      const structuredContent = scoutPreviewStructuredContent(preview);

      return {
        structuredContent,
        _meta: {
          scoutPreview: preview,
          scene: preview.scene,
        },
        content: [
          {
            type: "text" as const,
            text: `${preview.summary} Best offer: ${preview.bestOffer}. This is a session-only Alpha preview; it does not save, post, message, spend, grant XP, or execute outreach. Next: ${preview.alphaBoundary.userActionLabel}.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "preview_campaign_engine",
    {
      title: "Preview Campaign Engine",
      description:
        "Create a manual 7-day campaign preview from an existing Atlas Scout Drop. Requires the scoutPreviewId returned by preview_scout_drop. Alpha does not post, DM, buy ads, persist state, or perform live campaign execution.",
      inputSchema: {
        scoutPreviewId: z.string().describe("Scout Drop id returned by preview_scout_drop."),
        countySlug: z.string().optional().describe("County slug from the Scout Drop. Alpha supports riverside-ca."),
        nodeId: z.string().optional().describe("Atlas node id from the Scout Drop, such as eastvale."),
        locationLabel: z.string().optional().describe("Fallback location label from the Scout Drop, such as Eastvale."),
        businessType: z.string().optional().describe("Business type from the Scout Drop, such as mobile detailing."),
        goal: z.string().optional().describe("Scout goal from the Scout Drop."),
        budget: z.string().optional().describe("Optional plain-language budget note from the Scout Drop."),
        serviceRadius: z.string().optional().describe("Optional service radius note from the Scout Drop."),
      },
      outputSchema: campaignPreviewOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Drafting manual campaign...",
        "openai/toolInvocation/invoked": "Campaign preview ready.",
      },
    },
    async ({ scoutPreviewId, countySlug, nodeId, locationLabel, businessType, goal, budget, serviceRadius }) => {
      const scoutPreview = previewScoutDrop({
        countySlug: countySlug ?? "riverside-ca",
        nodeId,
        locationLabel: locationLabel ?? "Eastvale",
        businessType: businessType ?? "mobile detailing",
        goal: goal ?? "Find the strongest first drop for a local mobile detailing offer.",
        budget,
        serviceRadius,
      });

      if (scoutPreview.id !== scoutPreviewId) {
        throw new Error(`Scout preview mismatch. Expected ${scoutPreview.id} for the supplied Alpha inputs.`);
      }

      const campaignPreview = previewCampaignFromScout(scoutPreview);

      return {
        structuredContent: campaignPreviewStructuredContent(campaignPreview),
        _meta: {
          campaignPreview,
          scene: campaignPreview.scene,
        },
        content: [
          {
            type: "text" as const,
            text: `${campaignPreview.summary} This is a session-only manual preview; no posting, messaging, ad spend, persistence, evidence, or XP is performed. Next: ${campaignPreview.alphaBoundary.userActionLabel}.`,
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "get_upgrade_options",
    {
      title: "Get Hosted Clawd options",
      description:
        "Explain the free Alpha limits and planned Hosted Clawd Beta persistence options. Does not start checkout, create an account, post, message, buy ads, or save campaign state.",
      inputSchema: {
        trigger: z
          .enum(["save_scout_drop", "save_campaign", "track_evidence", "pricing", "general"])
          .optional()
          .describe("Why the user is asking about Hosted Clawd."),
      },
      outputSchema: upgradeOptionsOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Checking Hosted Clawd options...",
        "openai/toolInvocation/invoked": "Hosted Clawd options ready.",
      },
    },
    async ({ trigger }) => {
      const options = upgradeOptionsStructuredContent(trigger);
      return {
        structuredContent: options,
        content: [
          {
            type: "text" as const,
            text: `${options.hosted.label} is planned for Beta. Alpha supports temporary previews only; it does not save campaigns, track evidence, or start checkout.`,
          },
        ],
      };
    },
  );

  return server;
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const mcpServer = createAtlasServer();
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void mcpServer.close();
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("MCP request failed:", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Internal server error");
    }
  }
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    textResponse(res, 400, "Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? `localhost:${PORT}`}`);

  if (url.pathname === "/" && req.method === "GET") {
    textResponse(res, 200, `Atlas MCP server\nMCP: http://localhost:${PORT}${MCP_PATH}\nPreview: http://localhost:${PORT}/preview\n`);
    return;
  }

  if (url.pathname === "/health" && req.method === "GET") {
    jsonResponse(res, 200, { ok: true, version: SERVER_VERSION });
    return;
  }

  if (url.pathname === "/favicon.ico" && req.method === "GET") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/api/geo/status" && req.method === "GET") {
    jsonResponse(res, 200, geoStatusPayload());
    return;
  }

  if (url.pathname === "/api/geo/geocode" && req.method === "GET") {
    await handleGeoGeocode(url, res);
    return;
  }

  if (url.pathname === "/api/world/lookup" && req.method === "GET") {
    await handleWorldLookup(url, res);
    return;
  }

  if (url.pathname === "/api/engine/scene-packets/status" && req.method === "GET") {
    jsonResponse(res, 200, {
      ok: true,
      update: SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
      cache: scenePacketMemory.status(),
    });
    return;
  }

  if (req.method === "GET" && handleWorldRoute(url, res)) {
    return;
  }

  if (url.pathname === "/api/scout/drop" && req.method === "GET") {
    handleScoutDrop(url, res);
    return;
  }

  if (url.pathname === "/api/campaign/preview" && req.method === "GET") {
    handleCampaignPreview(url, res);
    return;
  }

  if (url.pathname === "/privacy" && req.method === "GET") {
    htmlResponse(res, 200, privacyPageHtml());
    return;
  }

  if (url.pathname === "/terms" && req.method === "GET") {
    htmlResponse(res, 200, termsPageHtml());
    return;
  }

  if (url.pathname === "/preview" && req.method === "GET") {
    try {
      sendPreviewResponse(req, res);
    } catch (error) {
      textResponse(res, 500, error instanceof Error ? error.message : "Preview failed");
    }
    return;
  }

  if (url.pathname === MCP_PATH && req.method && ["POST", "GET", "DELETE", "OPTIONS"].includes(req.method)) {
    await handleMcp(req, res);
    return;
  }

  textResponse(res, 404, "Not Found");
});

httpServer.listen(PORT, () => {
  console.log(`Atlas MCP server listening on http://localhost:${PORT}${MCP_PATH}`);
});
