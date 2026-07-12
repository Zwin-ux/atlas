import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { brotliCompressSync, gzipSync, constants as zlibConstants } from "node:zlib";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  previewCampaignFromScoutRequest,
  previewScoutDrop,
  type CampaignPreviewState,
  type ScoutPreviewState,
} from "@atlas/core/scout";
import {
  CountyPackService,
  CountyQuestionService,
  compileCityWorldScene,
  compileVoxelSceneFromCountyPack,
  createDeterministicGeneratedDistrictScene,
  createDeterministicGeneratedDistrictSpec,
  createNationalWorldService,
  DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
  type CountyQuestionAnswer,
  type UsCountyWorldResponse,
  type UsUnsupportedWorldResponse,
  type CityWorldScene,
  type DeterministicGeneratedDistrictSpec,
  type WorldLookupPlaceInput,
  type WorldPlaceLookupResponse,
  type WorldSourceKind,
  type WorldSourceNote,
} from "@atlas/core";
import { riversideDemoVoxelScene } from "@atlas/core/voxel";
import { createGeoDataAdapter, isGoogleMapsConfigured, readGeoAdapterConfig } from "@atlas/geo";
import { z } from "zod";
import {
  createLazyRedisConnector,
  createScenePacketMemoryAdapter,
  readScenePacketRuntimeConfig,
  SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
  type LazyRedisConnector,
  type ScenePacketGeneratedDraftJob,
  type ScenePacketMemorySummary,
} from "./scenePacketMemoryAdapter.js";
import {
  buildAuthChallengeHeader,
  buildOAuthProtectedResourceMetadata,
  constructHostedClawdStripeEvent,
  createHostedClawdPool,
  createHostedClawdRepositoryPersistence,
  createPostgresHostedClawdRepository,
  createStripeHostedClawdBillingPort,
  createStripeHostedClawdClient,
  handleHostedClawdStripeWebhook,
  HOSTED_CLAWD_READ_SCOPE,
  HOSTED_CLAWD_WRITE_SCOPE,
  HostedClawdAuthenticator,
  HostedClawdService,
  readHostedClawdBillingConfig,
  readHostedClawdAuthConfig,
  readHostedClawdFeatureFlags,
  type HostedClawdAuthContext,
  type HostedClawdContext,
  type HostedClawdContextInput,
} from "./hostedClawd/index.js";
import {
  isLoopbackAddress,
  isPrivateOrLoopbackAddress,
  readServerSecurityConfig,
  setCorsHeaders,
  validateHostHeader,
  validateOriginHeader,
} from "./security.js";

const SERVER_VERSION = "0.1.0";
const WIDGET_URI = "ui://widget/atlas-city-world-v1.html";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const MAX_WORLD_LOOKUP_CACHE_ENTRIES = 100;
const MAX_SCENE_PACKET_MEMORY_ENTRIES = 32;
const MAX_MCP_SESSIONS = 100;
const MCP_SESSION_IDLE_TTL_MS = 30 * 60_000;
const PLAYABLE_ENGINE_BETA_COUNTY_SLUG = "riverside-ca";

loadLocalEnv();

const WEB_DIST = resolve(ROOT_DIR, "web/dist");
const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = process.env.MCP_PATH ?? "/mcp";
const serverSecurityConfig = readServerSecurityConfig(process.env);
const countyPackService = new CountyPackService(resolve(ROOT_DIR, "data", "county_packs"));
const countyQuestionService = new CountyQuestionService(countyPackService);
const worldService = createNationalWorldService([riversideDemoVoxelScene]);
const scenePacketRuntimeConfig = readScenePacketRuntimeConfig(process.env);
if (scenePacketRuntimeConfig.production && scenePacketRuntimeConfig.blockers.length > 0) {
  throw new Error(`Atlas production scene packet config is invalid: ${scenePacketRuntimeConfig.blockers.join("; ")}`);
}
const scenePacketMemory = createScenePacketMemoryAdapter<ScoutPreviewState["scene"] | CityWorldScene>({
  maxEntries: MAX_SCENE_PACKET_MEMORY_ENTRIES,
  cacheBackend: scenePacketRuntimeConfig.effectiveBackend,
  redisUrl: scenePacketRuntimeConfig.redisUrl,
  lockTtlSeconds: scenePacketRuntimeConfig.lockTtlSeconds,
  lockWaitMs: scenePacketRuntimeConfig.lockWaitMs,
});
const rateLimitRedisConnector: LazyRedisConnector | undefined = scenePacketRuntimeConfig.redisUrl
  ? createLazyRedisConnector(scenePacketRuntimeConfig.redisUrl)
  : undefined;
// Hosted Clawd persistence foundation (0.60H). Persistence stays OFF unless
// the flag and DATABASE_URL are configured. Protected user writes still require
// OAuth/OIDC bearer tokens; iframe cookies and model text are never identity.
// The repository is intentionally independent from auth so webhooks and
// readiness can use the database before the public account-linking gate opens.
const hostedClawdFlags = readHostedClawdFeatureFlags(process.env);
const hostedClawdAuthConfig = readHostedClawdAuthConfig(process.env);
const hostedClawdAuthenticator = hostedClawdAuthConfig
  ? new HostedClawdAuthenticator(hostedClawdAuthConfig)
  : undefined;
const hostedClawdDatabaseUrl = process.env.DATABASE_URL?.trim() || undefined;
const hostedClawdPool =
  hostedClawdFlags.persistenceEnabled && hostedClawdDatabaseUrl
    ? createHostedClawdPool(hostedClawdDatabaseUrl)
    : undefined;
const hostedClawdRepository =
  hostedClawdPool
    ? createPostgresHostedClawdRepository(hostedClawdPool)
    : undefined;
const hostedClawdPersistence =
  hostedClawdRepository
    ? createHostedClawdRepositoryPersistence(hostedClawdRepository)
    : undefined;
const hostedClawdBillingConfig = hostedClawdFlags.moneyEnabled
  ? readHostedClawdBillingConfig(process.env)
  : undefined;
const hostedClawdBilling =
  hostedClawdFlags.moneyEnabled && hostedClawdRepository && hostedClawdBillingConfig
    ? createStripeHostedClawdBillingPort({
        stripe: createStripeHostedClawdClient(hostedClawdBillingConfig),
        repository: hostedClawdRepository,
        config: hostedClawdBillingConfig,
      })
    : undefined;
const hostedClawdService = new HostedClawdService({
  flags: hostedClawdFlags,
  persistence: hostedClawdPersistence,
  billing: hostedClawdBilling,
});
const hostedClawdWriteRouterMounted = Boolean(hostedClawdPersistence);
const atlasSaveSurfaceEnabled = (process.env.ATLAS_SAVE_SURFACE ?? "on").trim().toLowerCase() !== "off";

type WorldLookupCacheEntry = {
  response: WorldPlaceLookupResponse;
  expiresAtMs: number;
};

const worldLookupCache = new Map<string, WorldLookupCacheEntry>();

type RateLimitBucket = {
  resetAtMs: number;
  count: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const RATE_LIMIT_REDIS_PREFIX = "atlas:rate-limit:";
const RATE_LIMIT_WINDOW_MS = 60_000;
const WORLD_LOOKUP_RATE_LIMIT = 30;
const HOSTED_CLAWD_WRITE_RATE_LIMIT = 20;
const GENERATED_DRAFT_RATE_LIMIT = 20;
const MCP_EXPENSIVE_TOOL_RATE_LIMIT = 120;
const HOSTED_CLAWD_WRITE_PATHS = new Set([
  "/api/hosted-clawd/create-or-attach",
  "/api/hosted-clawd/promote-session",
  "/api/hosted-clawd/saved-artifacts/campaigns",
  "/api/hosted-clawd/checkout",
  "/api/hosted-clawd/billing-portal",
]);

type RequestContext = {
  requestId: string;
  clientAddress: string;
  rateLimitExempt: boolean;
};

const requestContext = new AsyncLocalStorage<RequestContext>();

const MCP_TOOL_NAMES = [
  "lookup_world_places",
  "select_county",
  "ask_county_question",
  "render_voxel_county",
  "preview_scout_drop",
  "preview_campaign_engine",
  "get_upgrade_options",
] as const;

type McpToolName = (typeof MCP_TOOL_NAMES)[number];

type McpToolMetric = {
  calls: number;
  errors: number;
  latency: {
    count: number;
    totalMs: number;
    maxMs: number;
  };
};

type McpSessionEntry = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  sessionId?: string;
  lastSeenAtMs: number;
};

const mcpToolMetrics = new Map<McpToolName, McpToolMetric>(
  MCP_TOOL_NAMES.map((toolName) => [
    toolName,
    {
      calls: 0,
      errors: 0,
      latency: {
        count: 0,
        totalMs: 0,
        maxMs: 0,
      },
    },
  ]),
);
const mcpSessions = new Map<string, McpSessionEntry>();

type CameraIntent = {
  type: "focus_place" | "focus_district" | "focus_water_edge" | "focus_landmark";
  targetNodeId?: string;
  targetLabel?: string;
};

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
  cameraIntent?: CameraIntent;
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

const cameraIntentOutputSchema = z.object({
  type: z.enum(["focus_place", "focus_district", "focus_water_edge", "focus_landmark"]),
  targetNodeId: z.string().optional(),
  targetLabel: z.string().optional(),
});

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
  cameraIntent: cameraIntentOutputSchema.optional(),
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
  continuityNote: z.string().optional(),
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

const hostedClawdScreenStateSchema = z.enum([
  "waitlist",
  "confirm_save",
  "checkout_pending",
  "activating",
  "active",
  "inactive_payment_failed",
]);

const hostedClawdSavedStateSchema = z.object({
  type: z.literal("hostedClawdSavedState"),
  clawd: z
    .object({
      id: z.string(),
      name: z.string(),
      status: z.literal("active"),
    })
    .optional(),
  businessProfile: z
    .object({
      id: z.string(),
      name: z.string(),
      businessType: z.string().optional(),
      countySlug: z.string(),
      countyLabel: z.string().optional(),
      placeLabel: z.string().optional(),
    })
    .optional(),
  scoutDrops: z.array(
    z.object({
      id: z.string(),
      scoutPreviewId: z.string(),
      countySlug: z.string(),
    }),
  ),
  campaignDrafts: z.array(
    z.object({
      id: z.string(),
      campaignPreviewId: z.string(),
      summary: z.string().optional(),
      status: z.literal("draft"),
    }),
  ),
  subscriptionStatus: z.enum(["none", "activating", "active", "inactive", "payment_failed"]),
  paidWrites: z.enum(["enabled", "read_only"]),
  readOnlyReason: z.enum(["none", "no_saved_clawd", "billing_attention", "subscription_inactive"]),
});

const hostedClawdContextSchema = z.object({
  type: z.literal("hostedClawdContext"),
  mode: z.enum(["alpha_free", "beta_invite", "beta_paid"]),
  screenState: hostedClawdScreenStateSchema,
  trigger: z.enum(["map_tray", "scout_drop", "campaign_preview", "upgrade_tool"]),
  statusLabel: z.string(),
  contextLabel: z.string(),
  primaryCopy: z.string(),
  secondaryCopy: z.string(),
  sessionBoundary: z.string(),
  paymentCopy: z.string(),
  billing: z.object({
    state: z.enum(["off", "test_ready", "return_pending", "webhook_confirmed", "payment_attention"]),
    subscriptionStatus: z.enum(["none", "activating", "active", "inactive", "payment_failed"]),
    confirmationSource: z.enum(["none", "webhook"]),
    returnUrlGrantsAccess: z.literal(false),
    paidWrites: z.enum(["enabled", "read_only"]),
    title: z.string(),
    detail: z.string(),
    checkoutLabel: z.string(),
    webhookLabel: z.string(),
    returnLabel: z.string(),
    portalLabel: z.string(),
  }),
  primaryAction: z.object({
    kind: z.enum([
      "join_waitlist",
      "create_hosted_clawd",
      "continue_to_stripe",
      "refresh_status",
      "open_saved_campaign",
      "open_billing_portal",
    ]),
    label: z.string(),
    enabled: z.boolean(),
  }),
  savePreview: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      status: z.enum(["ready", "needs_confirmation", "planned"]),
    }),
  ),
  savedState: hostedClawdSavedStateSchema.optional(),
  flags: z.object({
    persistenceEnabled: z.boolean(),
    moneyEnabled: z.boolean(),
    publicClaimEnabled: z.boolean(),
  }),
  gates: z.array(
    z.object({
      gate: z.enum([
        "HUMAN_APPROVAL_BEFORE_PERSISTENCE",
        "HUMAN_APPROVAL_BEFORE_MONEY",
        "HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM",
      ]),
      flag: z.enum([
        "ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED",
        "ATLAS_HOSTED_CLAWD_MONEY_ENABLED",
        "ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED",
      ]),
      approved: z.boolean(),
      requiredFor: z.string(),
    }),
  ),
  canPersist: z.boolean(),
  canStartCheckout: z.boolean(),
  canUsePaidWrites: z.boolean(),
});

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
    status: z.enum(["planned_beta", "owner_gated_test"]),
    included: z.array(z.string()),
  }),
  unavailableActions: z.array(z.string()),
  nextStep: z.string(),
  hostedClawd: hostedClawdContextSchema,
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
  targetNodeId: z.string().optional(),
  targetPlaceId: z.string().optional(),
  targetLabel: z.string().optional(),
  targetKind: z.enum(["place", "district", "water_edge", "landmark"]).optional(),
  cameraIntent: cameraIntentOutputSchema.optional(),
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

function voxelSceneStructuredContent(scene: ScoutPreviewState["scene"], cameraIntent?: CameraIntent): VoxelSceneStructuredContent {
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
    ...(cameraIntent ? { cameraIntent } : {}),
  };
}

function defaultCameraIntentForScene(scene: ScoutPreviewState["scene"]): CameraIntent | undefined {
  const selectedPlace = scene.world?.places.find((place) => place.nodeId === scene.selectedNodeId);
  if (selectedPlace) {
    return {
      type: selectedPlace.kind === "landmark" ? "focus_landmark" : "focus_place",
      targetNodeId: selectedPlace.nodeId,
      targetLabel: selectedPlace.label,
    };
  }

  const selectedNode = scene.nodes.find((node) => node.id === scene.selectedNodeId);
  if (selectedNode) {
    return {
      type: selectedNode.kind === "regional_center" ? "focus_landmark" : "focus_place",
      targetNodeId: selectedNode.id,
      targetLabel: selectedNode.label,
    };
  }

  const selectedDistrict = scene.world?.districts.find((district) => district.id === scene.world?.selectedDistrictId);
  if (selectedDistrict) {
    return {
      type: "focus_district",
      targetNodeId: selectedDistrict.worldNodeId,
      targetLabel: selectedDistrict.label,
    };
  }

  return undefined;
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

async function getOrCreatePlayableScenePacket(
  countySlug = PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
  selectedNodeId = "eastvale",
): Promise<{ scene: ScoutPreviewState["scene"]; scenePacket: ScenePacketMemorySummary }> {
  const packet = await scenePacketMemory.getOrCreatePlayableScenePacket({
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
    scene: packet.payload as ScoutPreviewState["scene"],
    scenePacket: packet.summary,
  };
}

// The widget only needs the resolved focus preset, not the ~710KB compiled
// scene it was derived from — _meta carries a minimal { sourceSceneId, preset }.
type CameraFocus = {
  sourceSceneId: string;
  preset: CityWorldScene["cameraPresets"][number];
};

function decorateCityWorldSceneWithCameraIntent(
  scene: ScoutPreviewState["scene"],
  cameraIntent: CameraIntent | undefined,
): { cameraIntent: CameraIntent; cameraFocus: CameraFocus } | undefined {
  if (!cameraIntent) return undefined;
  const cityScene = compileCityWorldScene(scene);
  const focusPreset = focusCameraPresetForIntent(scene, cityScene, cameraIntent);
  if (!focusPreset) return undefined;
  return {
    cameraIntent,
    cameraFocus: {
      sourceSceneId: cityScene.sourceSceneId,
      preset: focusPreset,
    },
  };
}

function cameraIntentForCountyAnswer(scene: ScoutPreviewState["scene"], answer: CountyQuestionAnswer): CameraIntent | undefined {
  if (!answer.supported || !answer.targetNodeId) return undefined;

  const targetExists =
    scene.nodes.some((node) => node.id === answer.targetNodeId) ||
    Boolean(scene.world?.nodes.some((node) => node.id === answer.targetNodeId)) ||
    Boolean(scene.world?.places.some((place) => place.nodeId === answer.targetNodeId)) ||
    Boolean(scene.world?.districts.some((district) => district.id === answer.targetNodeId || district.worldNodeId === answer.targetNodeId));

  if (!targetExists) return undefined;

  const type =
    answer.targetKind === "water_edge"
      ? "focus_water_edge"
      : answer.targetKind === "landmark"
        ? "focus_landmark"
        : answer.targetKind === "district"
          ? "focus_district"
          : "focus_place";

  return {
    type,
    targetNodeId: answer.targetNodeId,
    ...(answer.targetLabel ? { targetLabel: answer.targetLabel } : {}),
  };
}

function focusCameraPresetForIntent(
  scene: ScoutPreviewState["scene"],
  cityScene: CityWorldScene,
  cameraIntent: CameraIntent,
): CityWorldScene["cameraPresets"][number] | undefined {
  const center = focusCenterForCameraIntent(scene, cityScene, cameraIntent);
  if (!center) return undefined;

  const basePreset =
    cameraIntent.type === "focus_district"
      ? cityScene.cameraPresets.find((preset) => preset.id === "desktop")
      : cameraIntent.type === "focus_place"
        ? detailPresetForFocusPlace(cityScene, cameraIntent)
        : cityScene.cameraPresets.find((preset) => preset.id === "commerce_detail") ??
          cityScene.cameraPresets.find((preset) => preset.id === "desktop");
  if (!basePreset) return undefined;

  const preferredZoom =
    cameraIntent.type === "focus_district"
      ? basePreset.zoom
      : cameraIntent.type === "focus_water_edge"
        ? Math.min(basePreset.maxZoom, 1.38)
        : Math.min(basePreset.maxZoom, Math.max(basePreset.zoom, 1.52));

  return {
    id: "focus",
    center,
    zoom: clamp(preferredZoom, basePreset.minZoom, basePreset.maxZoom),
    minZoom: basePreset.minZoom,
    maxZoom: basePreset.maxZoom,
  };
}

function detailPresetForFocusPlace(cityScene: CityWorldScene, cameraIntent: CameraIntent): CityWorldScene["cameraPresets"][number] | undefined {
  const targetPlace = cityScene.places.find((place) => place.nodeId === cameraIntent.targetNodeId || place.label === cameraIntent.targetLabel);
  const preferredId = targetPlace?.kind === "home_area" ? "residential_detail" : "commerce_detail";
  return cityScene.cameraPresets.find((preset) => preset.id === preferredId) ?? cityScene.cameraPresets.find((preset) => preset.id === "desktop");
}

function focusCenterForCameraIntent(
  scene: ScoutPreviewState["scene"],
  cityScene: CityWorldScene,
  cameraIntent: CameraIntent,
): CityWorldScene["cameraPresets"][number]["center"] | undefined {
  if (cameraIntent.type === "focus_district") {
    const district = scene.world?.districts.find(
      (item) => item.id === cameraIntent.targetNodeId || item.worldNodeId === cameraIntent.targetNodeId || item.label === cameraIntent.targetLabel,
    );
    const districtPlaces = district ? cityScene.places.filter((place) => place.districtId === district.id) : [];
    return averageCityWorldPoints(districtPlaces.map((place) => place.anchor)) ?? cityScene.cameraPresets.find((preset) => preset.id === "desktop")?.center;
  }

  if (cameraIntent.type === "focus_water_edge") {
    const waterLot = cityScene.lots.find((lot) => lot.kind === "waterfront" || normalizedLabel(lot.label) === normalizedLabel(cameraIntent.targetLabel));
    if (waterLot) return waterLot.position;
  }

  const labeledLot = cityLotForTargetLabel(cityScene, cameraIntent.targetLabel);
  if (labeledLot) return labeledLot.position;

  const byNode = cameraIntent.targetNodeId
    ? cityScene.places.find((place) => place.nodeId === cameraIntent.targetNodeId)
    : undefined;
  if (byNode) return byNode.anchor;

  const byLabel = cameraIntent.targetLabel
    ? cityScene.places.find((place) => normalizedLabel(place.label) === normalizedLabel(cameraIntent.targetLabel))
    : undefined;
  if (byLabel) return byLabel.anchor;

  const fallbackNode = cameraIntent.targetNodeId ? scene.nodes.find((node) => node.id === cameraIntent.targetNodeId) : undefined;
  return fallbackNode?.position ? { ...fallbackNode.position, z: 0 } : undefined;
}

function cityLotForTargetLabel(cityScene: CityWorldScene, targetLabel: string | undefined): CityWorldScene["lots"][number] | undefined {
  const target = normalizedLabel(targetLabel);
  if (!target) return undefined;
  const targetTokens = new Set(target.split(" ").filter((token) => token.length > 2));
  return cityScene.lots.find((lot) => {
    const lotLabel = normalizedLabel(lot.label);
    if (lotLabel === target || lotLabel.includes(target) || target.includes(lotLabel)) return true;
    const lotTokens = lotLabel.split(" ").filter((token) => token.length > 2);
    return lotTokens.some((token) => targetTokens.has(token));
  });
}

function averageCityWorldPoints(points: Array<CityWorldScene["cameraPresets"][number]["center"]>): CityWorldScene["cameraPresets"][number]["center"] | undefined {
  if (points.length === 0) return undefined;
  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y, z: sum.z + point.z }),
    { x: 0, y: 0, z: 0 },
  );
  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length,
  };
}

function normalizedLabel(value: string | undefined): string {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function getOrCreateGeneratedDraftScenePacket(
  coverage: CountyCoverageStructuredContent,
): Promise<{ generatedDraftSpec?: DeterministicGeneratedDistrictSpec; generatedDraftPacket: ScenePacketMemorySummary } | undefined> {
  if (coverage.coverageTier !== "L1_COUNTY_SHELL" || !coverage.stateCode || !coverage.geoid) {
    return undefined;
  }
  const rateLimitContext = currentRateLimitContext();
  const rateLimitKey = `generated_draft:${rateLimitContext.clientAddress}:${coverage.countySlug}`;
  if (!rateLimitContext.rateLimitExempt && !(await consumeRateLimit(rateLimitKey, GENERATED_DRAFT_RATE_LIMIT))) {
    logBackendEvent("generated_draft_rate_limited", {
      requestId: rateLimitContext.requestId,
      countySlug: coverage.countySlug,
      coverageTier: coverage.coverageTier,
    });
    return undefined;
  }

  const countyResponse = worldService.getCounty(coverage.countySlug);
  const county = {
    geoid: countyResponse.county.geoid ?? coverage.geoid,
    stateCode: countyResponse.county.stateCode,
    name: countyResponse.county.label,
    countySlug: countyResponse.county.countySlug,
    ...(countyResponse.county.centroid ? { centroid: countyResponse.county.centroid } : {}),
  };
  const generated = createDeterministicGeneratedDistrictSpec({ county });
  const job: ScenePacketGeneratedDraftJob = {
    id: `${coverage.countySlug}:${generated.districtSlug}:generated-initial-window:${DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID}`,
    kind: "generated_draft_scene",
    enqueuedAtMs: Date.now(),
    stateCode: county.stateCode,
    countySlug: county.countySlug,
    countyName: county.name,
    geoid: county.geoid,
    ...(county.centroid ? { centroid: county.centroid } : {}),
    districtSlug: generated.districtSlug,
    cameraPresetId: "generated-draft",
    windowHash: "generated-initial-window",
    sceneSchemaVersion: "city-world-v1",
    engineUpdateId: DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
    sourceNotes: coverage.sourceNotes.map(toWorldSourceNote),
  };
  const packet = await scenePacketMemory.getOrCreateGeneratedDraftScenePacket({
    stateCode: county.stateCode,
    countySlug: county.countySlug,
    districtSlug: generated.districtSlug,
    cameraPresetId: "generated-draft",
    windowHash: "generated-initial-window",
    sceneSchemaVersion: "city-world-v1",
    engineUpdateId: DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID,
    sourceNotes: coverage.sourceNotes.map(toWorldSourceNote),
    createScene: () => createDeterministicGeneratedDistrictScene({ county }).result.scene,
    sceneIdForPayload: (scene) => scene.id,
    job,
  });
  logBackendEvent("generated_draft_packet_result", {
    countySlug: county.countySlug,
    districtSlug: generated.districtSlug,
    cacheBackend: scenePacketRuntimeConfig.effectiveBackend,
    cacheHit: packet.summary.cacheHit,
    generationStatus: packet.summary.generationStatus,
    specReturned: Boolean(packet.payload),
  });

  return {
    ...(packet.payload ? { generatedDraftSpec: generated } : {}),
    generatedDraftPacket: packet.summary,
  };
}

async function scenePacketStatusForCoverage(coverage: CountyCoverageStructuredContent): Promise<ScenePacketMemorySummary> {
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
  const hostedClawd = hostedClawdService.getContext({
    trigger: "upgrade_tool",
    businessType: trigger === "pricing" || trigger === "general" ? "local business" : undefined,
    countySlug: PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
    countyLabel: "Riverside County",
    placeLabel: "Eastvale",
  });
  const ownerGatedTest = hostedClawd.canPersist || hostedClawd.canStartCheckout;
  const hostedIncluded = ownerGatedTest
    ? [
        "Saved business profile, Scout Drop history, and campaign drafts.",
        "Test-mode Checkout after account linking.",
        "Saved history stays readable when billing needs attention.",
      ]
    : [
        "Saved business profile and Scout Drop history.",
        "Campaign drafts after Beta storage is approved.",
        "New saves after account and billing approval.",
      ];
  const unavailableActions = ownerGatedTest
    ? [
        "Public paid access is not live.",
        "Returning from Checkout does not turn on saving by itself.",
        "Atlas will not auto-post, auto-DM, buy ads, or scrape private people.",
      ]
    : [
        "Stripe checkout is not available in Alpha.",
        "Atlas cannot create an account or persist campaign history yet.",
        "Atlas will not auto-post, auto-DM, buy ads, or scrape private people.",
      ];
  const nextStep = ownerGatedTest
    ? "Use Hosted Clawd as a closed test surface only; public paid access stays closed."
    : "Use the free Alpha preview now; Hosted Clawd adds saving after the next approval gate.";

  if (!atlasSaveSurfaceEnabled) {
    return {
      type: "upgradeOptions" as const,
      ...(trigger ? { trigger } : {}),
      free: {
        label: "Atlas V1",
        included: [
          "Explore the Riverside/Eastvale playable map.",
          "Preview generated draft scenes for indexed US counties when requested.",
          "Keep pins, notes, Scout Drops, and campaign previews in this chat.",
        ],
        limits: [
          "No account or cross-chat memory.",
          "No saved campaigns, quests, evidence, XP, reports, or exports.",
          "No posting, messaging, ad buying, checkout, or automated outreach.",
        ],
      },
      hosted: {
        label: "Hosted Clawd",
        status: ownerGatedTest ? ("owner_gated_test" as const) : ("planned_beta" as const),
        included: [
          "Future saved business memory and campaign history stay behind a later gate.",
          "The V1 app surface stays session-only.",
        ],
      },
      unavailableActions: [
        "Atlas does not create an account or save progress across chats in V1.",
        "Atlas does not start checkout, charge money, grant XP, collect evidence, post, message, buy ads, or run automated outreach.",
        "Lookup results are for manual review; they are not saved state, scene geometry, or coverage proof.",
      ],
      nextStep: "Use Atlas as a session-only map and planning preview; pins, notes, Scout Drops, and campaign previews live in this chat.",
      hostedClawd,
    };
  }

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
      status: ownerGatedTest ? ("owner_gated_test" as const) : ("planned_beta" as const),
      included: hostedIncluded,
    },
    unavailableActions,
    nextStep,
    hostedClawd,
  };
}

function hostedClawdMeta(hostedClawd: HostedClawdContext): { hostedClawd: HostedClawdContext } | Record<string, never> {
  return atlasSaveSurfaceEnabled ? { hostedClawd } : {};
}

function hostedClawdContextForScene(scene: ScoutPreviewState["scene"], trigger: HostedClawdContextInput["trigger"]): HostedClawdContext {
  const selectedPlace = scene.world?.places.find((place) => place.nodeId === scene.selectedNodeId) ?? scene.world?.places[0];
  return hostedClawdService.getContext({
    trigger,
    countySlug: scene.county.slug,
    countyLabel: scene.county.name,
    placeLabel: selectedPlace?.label ?? scene.county.name,
  });
}

function hostedClawdContextForScout(preview: ScoutPreviewState): HostedClawdContext {
  const selectedPlace = preview.scene.world?.places.find((place) => place.nodeId === preview.selectedNodeId) ?? preview.scene.world?.places[0];
  return hostedClawdService.getContext({
    trigger: "scout_drop",
    businessType: preview.businessType,
    primaryGoal: preview.goal,
    countySlug: preview.countySlug,
    countyLabel: preview.scene.county.name,
    placeLabel: selectedPlace?.label ?? "Eastvale",
    scoutPreviewId: preview.id,
  });
}

function hostedClawdContextForCampaign(preview: CampaignPreviewState): HostedClawdContext {
  const selectedPlace = preview.scene.world?.places.find((place) => place.nodeId === preview.selectedNodeId) ?? preview.scene.world?.places[0];
  return hostedClawdService.getContext({
    trigger: "campaign_preview",
    businessType: preview.businessType,
    countySlug: preview.countySlug,
    countyLabel: preview.scene.county.name,
    placeLabel: selectedPlace?.label ?? "Eastvale",
    scoutPreviewId: preview.scoutPreviewId,
    campaignPreviewId: preview.id,
  });
}

// The widget shell is intentionally small; Pixi and renderer code live in lazy
// chunks served from /widget/* so the iframe can paint chrome/fallback first.
let builtWidgetCache: string | null = null;

function readBuiltWidget(): string {
  if (builtWidgetCache !== null) return builtWidgetCache;

  if (!existsSync(resolve(WEB_DIST, "component.js")) || !existsSync(resolve(WEB_DIST, "component.css"))) {
    throw new Error("Widget bundle not found. Run `pnpm build:web` before starting the MCP server.");
  }

  const assetBase = widgetAssetBase();
  builtWidgetCache = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Atlas City Map</title>
    <link rel="stylesheet" href="${assetBase}/component.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${assetBase}/component.js"></script>
  </body>
</html>`;
  return builtWidgetCache;
}

function widgetAssetBase(): string {
  const configuredDomain = process.env.WIDGET_DOMAIN?.replace(/\/+$/, "");
  return configuredDomain ? `${configuredDomain}/widget` : "/widget";
}

// Dev-only production-fidelity host page: parents the /preview widget iframe
// behind a faithful ChatGPT host bridge (see web/src/emulator/mockHost.ts).
// Served WITHOUT a restrictive CSP — the page must iframe /preview and reach
// same-origin /mcp. Not registered as an MCP resource; not part of the
// submitted widget surface.
function emulatorPageHtml(): string {
  if (!existsSync(resolve(WEB_DIST, "emulator.js"))) {
    throw new Error("Emulator bundle not found. Run `pnpm build:web` before opening /emulator.");
  }
  const assetBase = widgetAssetBase();
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Atlas Production Emulator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${assetBase}/emulator.js"></script>
  </body>
</html>`;
}

function widgetResourceDomains(): string[] {
  return process.env.WIDGET_DOMAIN ? [process.env.WIDGET_DOMAIN.replace(/\/+$/, "")] : [];
}

// Pre-compressed variants of the preview HTML. The shell is small now, but it is
// immutable for the process lifetime, so serve the cached compressed buffers.
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

function sendWidgetAssetResponse(res: ServerResponse, assetPath: string): void {
  const normalizedAssetPath = decodeURIComponent(assetPath).replace(/^\/+/, "");
  const absolutePath = resolve(WEB_DIST, normalizedAssetPath);
  const relativePath = relative(WEB_DIST, absolutePath);
  if (relativePath.startsWith("..") || resolve(WEB_DIST, relativePath) !== absolutePath || !existsSync(absolutePath)) {
    textResponse(res, 404, "Not Found");
    return;
  }

  const body = readFileSync(absolutePath);
  const immutable = /\/chunks\//.test(`/${relativePath.replace(/\\/g, "/")}`);
  res.writeHead(200, {
    "content-type": contentTypeForWidgetAsset(absolutePath),
    "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    // Real ChatGPT loads the widget from a per-app sandbox origin
    // (<our-domain-dashed>.web-sandbox.oaiusercontent.com) and fetches these
    // assets CROSS-ORIGIN — without ACAO the widget is a blank screen (found
    // in the first G8 real-host session). Static published bundles carry no
    // user data, so wildcard is correct here; /mcp CORS stays allowlisted.
    "access-control-allow-origin": "*",
    "cross-origin-resource-policy": "cross-origin",
  });
  res.end(body);
}

function contentTypeForWidgetAsset(path: string): string {
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".map")) return "application/json; charset=utf-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function requestIdFor(req: IncomingMessage): string {
  const header = req.headers["x-request-id"];
  const raw = Array.isArray(header) ? header[0] : header;
  const normalized = raw?.trim().replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 96);
  return normalized || randomUUID();
}

function clientAddressFor(req: IncomingMessage): string {
  const directPeer = req.socket.remoteAddress || "unknown";
  // Railway terminates public traffic at its platform proxy before forwarding
  // to this Node process. Trust X-Forwarded-For only in that deployment shape
  // and only when the direct peer is private/loopback; otherwise the socket is
  // the last trustworthy address and client-supplied XFF is ignored.
  if (isTrustedPlatformProxyPeer(directPeer)) {
    const forwardedAddress = lastForwardedForAddress(req);
    if (forwardedAddress) return forwardedAddress;
  }
  return directPeer;
}

function lastForwardedForAddress(req: IncomingMessage): string | undefined {
  const forwardedFor = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const parts = raw
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parts?.at(-1);
}

function isTrustedPlatformProxyPeer(address: string | undefined): boolean {
  const railwayRuntime = Boolean(
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_PUBLIC_DOMAIN,
  );
  return railwayRuntime && isPrivateOrLoopbackAddress(address);
}

function currentRateLimitContext(): RequestContext {
  return requestContext.getStore() ?? {
    requestId: "unknown",
    clientAddress: "unknown",
    rateLimitExempt: false,
  };
}

function requestContextFor(req: IncomingMessage, res: ServerResponse): RequestContext {
  return {
    requestId: String(res.getHeader("x-request-id") ?? ""),
    clientAddress: clientAddressFor(req),
    rateLimitExempt: isRateLimitExempt(req),
  };
}

function logBackendEvent(event: string, fields: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      event,
      ...fields,
    }),
  );
}

async function instrumentMcpTool<T>(toolName: McpToolName, handler: () => Promise<T>): Promise<T> {
  const context = currentRateLimitContext();
  const startedAt = Date.now();
  const metric = mcpToolMetrics.get(toolName);
  if (metric) metric.calls += 1;
  logBackendEvent("mcp_tool_started", {
    requestId: context.requestId,
    toolName,
  });

  try {
    const result = await handler();
    const durationMs = Date.now() - startedAt;
    recordMcpToolLatency(toolName, durationMs);
    logBackendEvent("mcp_tool_finished", {
      requestId: context.requestId,
      toolName,
      durationMs,
      ok: true,
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    if (metric) metric.errors += 1;
    recordMcpToolLatency(toolName, durationMs);
    logBackendEvent("mcp_tool_finished", {
      requestId: context.requestId,
      toolName,
      durationMs,
      ok: false,
      error: error instanceof Error ? error.name : "unknown",
    });
    throw error;
  }
}

function recordMcpToolLatency(toolName: McpToolName, durationMs: number): void {
  const metric = mcpToolMetrics.get(toolName);
  if (!metric) return;
  metric.latency.count += 1;
  metric.latency.totalMs += durationMs;
  metric.latency.maxMs = Math.max(metric.latency.maxMs, durationMs);
}

function mcpStatsPayload(): unknown {
  return {
    ok: true,
    version: SERVER_VERSION,
    mcp: {
      tools: Object.fromEntries(
        MCP_TOOL_NAMES.map((toolName) => {
          const metric = mcpToolMetrics.get(toolName);
          return [
            toolName,
            {
              calls: metric?.calls ?? 0,
              errors: metric?.errors ?? 0,
              latency: {
                count: metric?.latency.count ?? 0,
                totalMs: metric?.latency.totalMs ?? 0,
                maxMs: metric?.latency.maxMs ?? 0,
              },
            },
          ];
        }),
      ),
    },
  };
}

const RATE_LIMIT_REDIS_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local raw = redis.call('get', key)
local reset_at = now + window_ms
local count = 0

if raw then
  local decoded_ok, bucket = pcall(cjson.decode, raw)
  if decoded_ok and bucket and bucket.resetAtMs and bucket.count and tonumber(bucket.resetAtMs) > now then
    reset_at = tonumber(bucket.resetAtMs)
    count = tonumber(bucket.count)
  end
end

if count >= limit then
  return cjson.encode({ allowed = false, count = count, resetAtMs = reset_at })
end

count = count + 1
redis.call('set', key, cjson.encode({ resetAtMs = reset_at, count = count }), 'PX', math.max(1, reset_at - now))
return cjson.encode({ allowed = true, count = count, resetAtMs = reset_at })
`;

type RedisRateLimitResult = {
  allowed: boolean;
  count: number;
  resetAtMs: number;
};

function consumeMemoryRateLimit(key: string, limit: number, now = Date.now()): boolean {
  const current = rateLimitBuckets.get(key);
  if (!current || current.resetAtMs <= now) {
    rateLimitBuckets.set(key, { resetAtMs: now + RATE_LIMIT_WINDOW_MS, count: 1 });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

async function consumeRateLimit(key: string, limit: number, now = Date.now()): Promise<boolean> {
  if (!rateLimitRedisConnector) {
    return consumeMemoryRateLimit(key, limit, now);
  }

  try {
    const client = await rateLimitRedisConnector.client();
    const raw = await client.eval(RATE_LIMIT_REDIS_SCRIPT, {
      keys: [`${RATE_LIMIT_REDIS_PREFIX}${key}`],
      arguments: [String(now), String(RATE_LIMIT_WINDOW_MS), String(limit)],
    });
    if (typeof raw !== "string") {
      throw new Error("Redis rate limit script returned a non-string result.");
    }
    const result = JSON.parse(raw) as RedisRateLimitResult;
    if (typeof result.allowed !== "boolean") {
      throw new Error("Redis rate limit script returned an invalid result.");
    }
    return result.allowed;
  } catch (error) {
    logBackendEvent("rate_limit_redis_fail_open", {
      scope: rateLimitScopeForKey(key),
      error: error instanceof Error ? error.name : "unknown",
    });
    return consumeMemoryRateLimit(key, limit, now);
  }
}

function rateLimitScopeForKey(key: string): string {
  const index = key.indexOf(":");
  return index === -1 ? key : key.slice(0, index);
}

async function enforceRateLimit(
  req: IncomingMessage,
  res: ServerResponse,
  scope: string,
  limit: number,
  discriminator = "",
): Promise<boolean> {
  const requestId = String(res.getHeader("x-request-id") ?? "");
  if (isRateLimitExempt(req)) return true;

  const key = `${scope}:${clientAddressFor(req)}:${discriminator}`;
  if (await consumeRateLimit(key, limit)) return true;

  logBackendEvent("rate_limit_denied", { requestId, scope, discriminator });
  jsonResponse(res, 429, {
    ok: false,
    error: "Too many requests. Try again shortly.",
  });
  return false;
}

function isRateLimitExempt(req: IncomingMessage): boolean {
  if (isLocalRateLimitExemptionDisabled()) return false;
  return !serverSecurityConfig.production && isLoopbackAddress(req.socket.remoteAddress);
}

function isLocalRateLimitExemptionDisabled(): boolean {
  const value = process.env.ATLAS_DISABLE_LOCAL_RATE_LIMIT_EXEMPT?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

async function enforceMcpExpensiveToolRateLimit(toolName: "select_county" | "render_voxel_county"): Promise<void> {
  const context = currentRateLimitContext();
  if (context.rateLimitExempt) return;

  const key = `mcp_expensive_tool:${context.clientAddress}`;
  if (await consumeRateLimit(key, MCP_EXPENSIVE_TOOL_RATE_LIMIT)) return;

  logBackendEvent("rate_limit_denied", {
    requestId: context.requestId,
    scope: "mcp_expensive_tool",
    discriminator: toolName,
  });
  throw new Error("Atlas is receiving too many map render requests from this client. Try again shortly.");
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

function setCors(req: IncomingMessage, res: ServerResponse): void {
  setCorsHeaders(req, res, serverSecurityConfig);
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

async function readyPayload(): Promise<unknown> {
  const scenePacketStatus = await scenePacketMemory.status();
  const geoStatus = geoStatusPayload() as {
    mode: string;
    googleMapsConfigured: boolean;
    liveApiCallsEnabled: boolean;
  };
  const webDistPresent = existsSync(WEB_DIST);
  const redisReady =
    scenePacketStatus.cacheBackend === "memory" || scenePacketStatus.redisReachable === true;
  const hostedClawdDatabaseReachable = await hostedClawdDatabaseReachablePayload();
  const hostedClawdDatabaseReady =
    !hostedClawdFlags.persistenceEnabled || hostedClawdDatabaseReachable === true;
  const ok =
    webDistPresent &&
    redisReady &&
    hostedClawdDatabaseReady &&
    scenePacketRuntimeConfig.blockers.length === 0;

  return {
    ok,
    version: SERVER_VERSION,
    serverUp: true,
    webDistPresent,
    scenePacketCache: {
      cacheBackend: scenePacketStatus.cacheBackend,
      redisConfigured: scenePacketStatus.redisConfigured,
      redisReachable: scenePacketStatus.redisReachable,
      entryCount: scenePacketStatus.entryCount,
      hitRate: scenePacketStatus.hitRate,
      queueDepth: scenePacketStatus.queueDepth,
      claimedCount: scenePacketStatus.claimedCount,
      oldestQueuedMs: scenePacketStatus.oldestQueuedMs,
      oldestClaimedMs: scenePacketStatus.oldestClaimedMs,
    },
    hostedClawd: {
      persistenceEnabled: hostedClawdFlags.persistenceEnabled,
      databaseConfigured: Boolean(hostedClawdDatabaseUrl),
      databaseReachable: hostedClawdDatabaseReachable,
      authConfigured: Boolean(hostedClawdAuthenticator),
      moneyEnabled: hostedClawdFlags.moneyEnabled,
      stripeConfigured: Boolean(hostedClawdBillingConfig),
    },
    providerLookup: {
      mode: geoStatus.mode,
      googleMapsConfigured: geoStatus.googleMapsConfigured,
      liveApiCallsEnabled: geoStatus.liveApiCallsEnabled,
    },
    configBlockerCount: scenePacketRuntimeConfig.blockers.length,
    configBlockers: scenePacketRuntimeConfig.blockers,
  };
}

async function hostedClawdDatabaseReachablePayload(): Promise<boolean | null> {
  if (!hostedClawdFlags.persistenceEnabled) return null;
  if (!hostedClawdPool) return false;
  try {
    await hostedClawdPool.query("SELECT 1");
    return true;
  } catch (error) {
    logBackendEvent("hosted_clawd_database_ready_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
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

async function handleWorldLookup(req: IncomingMessage, url: URL, res: ServerResponse): Promise<void> {
  if (!(await enforceRateLimit(req, res, "world_lookup", WORLD_LOOKUP_RATE_LIMIT))) return;
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
    jsonResponse(res, 200, await performWorldLookup(query, radiusMeters, String(res.getHeader("x-request-id") ?? "")));
  } catch (error) {
    jsonResponse(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : "World lookup failed.",
    });
  }
}

async function handleGeoGeocode(req: IncomingMessage, url: URL, res: ServerResponse): Promise<void> {
  if (!(await enforceRateLimit(req, res, "geo_geocode", WORLD_LOOKUP_RATE_LIMIT))) return;
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

async function performWorldLookup(
  query: string,
  radiusMeters: number,
  requestId?: string,
): Promise<WorldPlaceLookupResponse> {
  const config = readGeoAdapterConfig(process.env);
  const cacheKey = worldLookupCacheKey(query, radiusMeters, config.mode);
  const cached = getWorldLookupCache(cacheKey);
  if (cached) {
    logBackendEvent("provider_lookup_cache_hit", {
      requestId,
      mode: config.mode,
      radiusMeters,
      queryLength: query.length,
    });
    return withLookupRuntime(cached.response, true, cached.expiresAtMs);
  }

  logBackendEvent("provider_lookup_cache_miss", {
    requestId,
    mode: config.mode,
    radiusMeters,
    queryLength: query.length,
  });
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
    const { campaignPreview, rebuiltScoutPreview } = previewCampaignFromScoutRequest({
      scoutPreviewId,
      countySlug: url.searchParams.get("countySlug") ?? "riverside-ca",
      nodeId: url.searchParams.get("nodeId") ?? undefined,
      locationLabel: url.searchParams.get("locationLabel") ?? "Eastvale",
      businessType: url.searchParams.get("businessType") ?? "mobile detailing",
      goal: url.searchParams.get("goal") ?? "Find the strongest first drop for a local mobile detailing offer.",
      budget: url.searchParams.get("budget") ?? undefined,
      serviceRadius: url.searchParams.get("serviceRadius") ?? undefined,
    });

    jsonResponse(res, 200, { ok: true, rebuiltScoutPreview, preview: campaignPreview });
  } catch (error) {
    jsonResponse(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Campaign preview failed.",
    });
  }
}

function hostedClawdInputFromUrl(url: URL): HostedClawdContextInput {
  return {
    trigger: hostedClawdTriggerFromString(url.searchParams.get("trigger")),
    businessName: optionalQuery(url, "businessName"),
    businessType: optionalQuery(url, "businessType"),
    serviceArea: optionalQuery(url, "serviceArea"),
    primaryGoal: optionalQuery(url, "primaryGoal"),
    countySlug: optionalQuery(url, "countySlug") ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
    countyLabel: optionalQuery(url, "countyLabel") ?? "Riverside County",
    placeLabel: optionalQuery(url, "placeLabel") ?? "Eastvale",
    scoutPreviewId: optionalQuery(url, "scoutPreviewId"),
    campaignPreviewId: optionalQuery(url, "campaignPreviewId"),
    selectedNoteCount: optionalNumberQuery(url, "selectedNoteCount"),
  };
}

function hostedClawdResourceMetadataUrl(req: IncomingMessage): string {
  const host = req.headers.host ?? `localhost:${PORT}`;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}/.well-known/oauth-protected-resource`;
}

function hostedClawdProtectedResourceUrl(req: IncomingMessage): string {
  const explicit = process.env.ATLAS_OIDC_RESOURCE?.trim();
  if (explicit) return explicit;
  const host = req.headers.host ?? `localhost:${PORT}`;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}${MCP_PATH}`;
}

function setHostedClawdAuthChallenge(
  req: IncomingMessage,
  res: ServerResponse,
  requiredScope: string = HOSTED_CLAWD_WRITE_SCOPE,
): void {
  res.setHeader(
    "WWW-Authenticate",
    buildAuthChallengeHeader(hostedClawdResourceMetadataUrl(req), requiredScope),
  );
}

// Bearer extraction for protected Hosted Clawd writes. Missing or bad
// credentials produce an auth challenge instead of silently creating state.
async function verifiedHostedClawdAuth(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<{ ok: true; auth?: HostedClawdAuthContext } | { ok: false }> {
  const header = req.headers.authorization;
  if (!hostedClawdAuthenticator || !header) {
    return { ok: true };
  }

  const verdict = await hostedClawdAuthenticator.verifyAuthorizationHeader(header);
  if (!verdict.ok) {
    logBackendEvent("hosted_clawd_auth_denied", {
      requestId: String(res.getHeader("x-request-id") ?? ""),
      reason: verdict.reason,
    });
    setHostedClawdAuthChallenge(req, res);
    jsonResponse(res, 401, { ok: false, reason: verdict.reason, error: verdict.detail });
    return { ok: false };
  }

  return { ok: true, auth: verdict.auth };
}

async function handleHostedClawdAction(
  req: IncomingMessage,
  res: ServerResponse,
  operation: "create_or_attach_clawd" | "promote_session" | "save_campaign_artifact" | "start_checkout" | "open_billing_portal",
): Promise<void> {
  try {
    const requestId = String(res.getHeader("x-request-id") ?? "");
    const verified = await verifiedHostedClawdAuth(req, res);
    if (!verified.ok) return;

    const body = await readJsonObjectBody(req);
    const input = hostedClawdInputFromObject(body);
    const result =
      operation === "create_or_attach_clawd"
        ? await hostedClawdService.createOrAttachClawd(input, verified.auth)
        : operation === "promote_session"
          ? await hostedClawdService.promoteSession(input, verified.auth)
          : operation === "save_campaign_artifact"
            ? await hostedClawdService.saveCampaignArtifact(input, verified.auth)
            : operation === "start_checkout"
              ? await hostedClawdService.startCheckout(input, verified.auth)
              : await hostedClawdService.openBillingPortal(input, verified.auth);
    logBackendEvent("hosted_clawd_write_result", {
      requestId,
      operation,
      reason: result.reason,
      status: result.status,
      persistenceEnabled: hostedClawdFlags.persistenceEnabled,
      moneyEnabled: hostedClawdFlags.moneyEnabled,
    });

    if (result.reason === "auth_required") {
      logBackendEvent("hosted_clawd_auth_denied", { requestId, operation, reason: result.reason });
      setHostedClawdAuthChallenge(req, res);
      jsonResponse(res, 401, { ok: false, result });
      return;
    }

    if (result.reason === "write_scope_required") {
      logBackendEvent("hosted_clawd_auth_denied", { requestId, operation, reason: result.reason });
      setHostedClawdAuthChallenge(req, res);
      jsonResponse(res, 403, { ok: false, result });
      return;
    }

    if (result.reason === "read_scope_required") {
      logBackendEvent("hosted_clawd_auth_denied", { requestId, operation, reason: result.reason });
      setHostedClawdAuthChallenge(req, res, HOSTED_CLAWD_READ_SCOPE);
      jsonResponse(res, 403, { ok: false, result });
      return;
    }

    jsonResponse(res, 200, { ok: true, result });
  } catch (error) {
    jsonResponse(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Hosted Clawd action failed.",
    });
  }
}

async function handleHostedClawdSavedState(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<void> {
  try {
    const input = hostedClawdInputFromUrl(url);
    if (hostedClawdAuthenticator && !req.headers.authorization) {
      const context = hostedClawdService.getContext(input);
      const result = {
        type: "hostedClawdAction" as const,
        operation: "read_saved_state" as const,
        status: "blocked" as const,
        reason: "auth_required" as const,
        screenState: context.screenState,
        message: "Connect ChatGPT to load saved items.",
        nextAction: "create_hosted_clawd" as const,
        context,
      };
      setHostedClawdAuthChallenge(req, res, HOSTED_CLAWD_READ_SCOPE);
      jsonResponse(res, 401, { ok: false, result, hostedClawd: context });
      return;
    }

    const verified = await verifiedHostedClawdAuth(req, res);
    if (!verified.ok) return;

    const result = await hostedClawdService.readSavedState(input, verified.auth);
    if (result.reason === "auth_required") {
      setHostedClawdAuthChallenge(req, res, HOSTED_CLAWD_READ_SCOPE);
      jsonResponse(res, 401, { ok: false, result });
      return;
    }

    if (result.reason === "read_scope_required") {
      setHostedClawdAuthChallenge(req, res, HOSTED_CLAWD_READ_SCOPE);
      jsonResponse(res, 403, { ok: false, result });
      return;
    }

    jsonResponse(res, 200, {
      ok: true,
      result,
      hostedClawd: result.context,
      savedState: result.savedState,
    });
  } catch (error) {
    jsonResponse(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : "Hosted Clawd saved-state read failed.",
    });
  }
}

async function handleHostedClawdStripeWebhookRoute(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestId = String(res.getHeader("x-request-id") ?? "");
  if (!hostedClawdRepository || !hostedClawdBillingConfig) {
    logBackendEvent("stripe_webhook_decision", {
      requestId,
      decision: "blocked",
      reason: "billing_not_configured",
    });
    jsonResponse(res, 503, {
      ok: false,
      error: "Hosted Clawd Stripe billing is not configured on this deployment.",
    });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = Array.isArray(req.headers["stripe-signature"])
      ? req.headers["stripe-signature"][0]
      : req.headers["stripe-signature"];
    const event = constructHostedClawdStripeEvent({
      stripe: createStripeHostedClawdClient(hostedClawdBillingConfig),
      rawBody,
      signature,
      webhookSecret: hostedClawdBillingConfig.webhookSecret,
    });
    const result = await handleHostedClawdStripeWebhook(hostedClawdRepository, event);
    logBackendEvent("stripe_webhook_decision", {
      requestId,
      decision: "accepted",
      eventType: event.type,
      reused: result.reused,
      subscriptionStatus: result.subscriptionStatus ?? null,
    });
    jsonResponse(res, 200, { ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook failed.";
    const signatureFailure = /signature|stripe-signature|webhook payload|constructEvent/i.test(message);
    logBackendEvent("stripe_webhook_decision", {
      requestId,
      decision: "blocked",
      reason: signatureFailure ? "signature_or_payload_failed" : "handler_failed",
    });
    jsonResponse(res, signatureFailure ? 400 : 500, { ok: false, error: message });
  }
}

async function readJsonObjectBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const body = await new Promise<string>((resolveBody, rejectBody) => {
    let text = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      text += chunk;
      if (text.length > 64_000) {
        rejectBody(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolveBody(text));
    req.on("error", rejectBody);
  });

  if (!body.trim()) return {};
  const parsed = JSON.parse(body) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object body.");
  }
  return parsed as Record<string, unknown>;
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return await new Promise<Buffer>((resolveBody, rejectBody) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    req.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;
      if (totalBytes > 256_000) {
        rejectBody(new Error("Request body is too large."));
        return;
      }
      chunks.push(buffer);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", rejectBody);
  });
}

function hostedClawdInputFromObject(value: Record<string, unknown>): HostedClawdContextInput & {
  clientRequestId?: string;
  confirmedFields?: string[];
  campaignSummary?: string;
} {
  return {
    trigger: hostedClawdTriggerFromString(stringFromObject(value, "trigger")),
    businessName: stringFromObject(value, "businessName"),
    businessType: stringFromObject(value, "businessType"),
    serviceArea: stringFromObject(value, "serviceArea"),
    primaryGoal: stringFromObject(value, "primaryGoal"),
    offerNotes: stringFromObject(value, "offerNotes"),
    countySlug: stringFromObject(value, "countySlug") ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
    countyLabel: stringFromObject(value, "countyLabel") ?? "Riverside County",
    placeLabel: stringFromObject(value, "placeLabel") ?? "Eastvale",
    scoutPreviewId: stringFromObject(value, "scoutPreviewId"),
    campaignPreviewId: stringFromObject(value, "campaignPreviewId"),
    selectedNoteCount: numberFromObject(value, "selectedNoteCount"),
    clientRequestId: stringFromObject(value, "clientRequestId"),
    campaignSummary: stringFromObject(value, "campaignSummary"),
    confirmedFields: arrayOfStringsFromObject(value, "confirmedFields"),
  };
}

function hostedClawdTriggerFromString(value: string | null | undefined): HostedClawdContextInput["trigger"] {
  switch (value) {
    case "scout_drop":
    case "campaign_preview":
    case "upgrade_tool":
    case "map_tray":
      return value;
    default:
      return "map_tray";
  }
}

function optionalQuery(url: URL, key: string): string | undefined {
  const value = url.searchParams.get(key)?.trim();
  return value || undefined;
}

function optionalNumberQuery(url: URL, key: string): number | undefined {
  const value = url.searchParams.get(key);
  if (!value) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function stringFromObject(value: Record<string, unknown>, key: string): string | undefined {
  const raw = value[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function numberFromObject(value: Record<string, unknown>, key: string): number | undefined {
  const raw = value[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

function arrayOfStringsFromObject(value: Record<string, unknown>, key: string): string[] | undefined {
  const raw = value[key];
  if (!Array.isArray(raw)) return undefined;
  return raw.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
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
              resourceDomains: widgetResourceDomains(),
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
        "Use this when the user asks to search for real nearby places or place categories around a location. This is lookup-only and may use Google Maps Platform when configured; it does not open, show, refresh, or unlock a county map. Results are read-only, not saved, and not coverage proof.",
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
    async ({ query, radiusMeters }) => instrumentMcpTool("lookup_world_places", async () => {
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
    }),
  );

  registerAppTool(
    server,
    "select_county",
    {
      title: "Select county",
      description:
        "Use this when the user asks to show, open, load, view, map, or switch to a US county in Atlas, including bare requests like \"show me Riverside County.\" This is the entry point for county maps: safe, read-only, and normally instant for open/show requests. Riverside opens the playable Eastvale voxel map; other indexed counties show honest browse-only coverage. For refreshing or focusing an already-open map, use render_voxel_county.",
      inputSchema: {
        countySlug: z.string().optional().describe("County slug. Engine Beta renders riverside-ca and browse-only shells for indexed US counties."),
        includeGeneratedDraft: z
          .boolean()
          .optional()
          .describe("When true for an indexed shell county, attach a non-playable generated draft scene packet in widget-only _meta."),
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
        "openai/toolInvocation/invoking": "Opening Atlas county...",
        "openai/toolInvocation/invoked": "Atlas county ready.",
      },
    },
    async ({ countySlug, includeGeneratedDraft }) => instrumentMcpTool("select_county", async () => {
      await enforceMcpExpensiveToolRateLimit("select_county");
      if (!isPlayableEngineBetaCounty(countySlug)) {
        const coverage = countyCoverageForSlug(countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG);
        const scenePacket = await scenePacketStatusForCoverage(coverage);
        const generatedDraft = includeGeneratedDraft ? await getOrCreateGeneratedDraftScenePacket(coverage) : undefined;
        const generatedDraftCopy = generatedDraft
          ? generatedDraft.generatedDraftSpec
            ? " A generated draft packet is attached for the widget only: session-only, non-playable, provider-free, and not local truth."
            : " The generated draft is preparing; the widget can keep the county shell while the packet cache warms."
          : "";
        return {
          structuredContent: coverage,
          _meta: {
            scenePacket,
            ...hostedClawdMeta(hostedClawdService.getContext({
              trigger: "map_tray",
              countySlug: coverage.countySlug,
              countyLabel: coverage.countyLabel,
            })),
            ...(generatedDraft ?? {}),
          },
          content: [
            {
              type: "text" as const,
              text: `${coverage.message} ${coverage.countyLabel ?? "This county"} is browse-only in Atlas right now. Riverside/Eastvale is playable now. Atlas does not invent local places, saves, XP, evidence, or automation for shell counties.${generatedDraftCopy}`,
            },
          ],
        };
      }

      const { scene, scenePacket } = await getOrCreatePlayableScenePacket(countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG, "eastvale");
      const decoration = decorateCityWorldSceneWithCameraIntent(scene, defaultCameraIntentForScene(scene));
      return {
        structuredContent: voxelSceneStructuredContent(scene, decoration?.cameraIntent),
        _meta: {
          scene,
          scenePacket,
          ...(decoration ? { cameraFocus: decoration.cameraFocus } : {}),
          ...(atlasSaveSurfaceEnabled ? { hostedClawd: hostedClawdContextForScene(scene, "map_tray") } : {}),
        },
        content: [
          {
            type: "text" as const,
            text: `Selected ${scene.county.name}. Eastvale is the playable district in this county. Use the map for places, pins, and session-only notes.`,
          },
        ],
      };
    }),
  );

  registerAppTool(
    server,
    "ask_county_question",
    {
      title: "Ask county question",
      description:
        "Use this when the user asks a factual Riverside/Eastvale county, map, or local-business question. It answers from the curated Atlas Alpha pack only; it does not open or refresh the map and does not search live nearby places. Closed-world and read-only; unsupported questions are refused rather than guessed.",
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
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Checking curated county data...",
        "openai/toolInvocation/invoked": "County answer ready.",
      },
    },
    async ({ question, countySlug, businessType }) => instrumentMcpTool("ask_county_question", async () => {
      const answer = countyQuestionService.answer({ question, countySlug, businessType });
      const requestedNodeId = answer.supported && answer.targetNodeId ? answer.targetNodeId : "eastvale";
      const { scene, scenePacket } = await getOrCreatePlayableScenePacket(PLAYABLE_ENGINE_BETA_COUNTY_SLUG, requestedNodeId);
      const decoration = decorateCityWorldSceneWithCameraIntent(scene, cameraIntentForCountyAnswer(scene, answer));
      const structuredContent = {
        ...answer,
        ...(decoration ? { cameraIntent: decoration.cameraIntent } : {}),
      };
      const answerPrefix = answer.supported
        ? "Curated Riverside/Eastvale answer."
        : "Atlas can only answer curated Riverside/Eastvale county questions right now.";
      return {
        structuredContent,
        _meta: {
          scene,
          scenePacket,
          ...(decoration ? { cameraFocus: decoration.cameraFocus } : {}),
          ...(atlasSaveSurfaceEnabled ? { hostedClawd: hostedClawdContextForScene(scene, "map_tray") } : {}),
        },
        content: [
          {
            type: "text" as const,
            text: `${answerPrefix} ${answer.answer}\n\nLimits: ${answer.limitations.join(" ")} No saves, XP, evidence, or automation are created by this answer.`,
          },
        ],
      };
    }),
  );

  registerAppTool(
    server,
    "render_voxel_county",
    {
      title: "Render voxel county",
      description:
        "Use this when the user asks to refresh, re-render, refocus, or move the Atlas county map that is already open. It updates the widget scene or coverage state for the current county; it is not the entry point for bare \"show me X county\" requests. To show, open, map, or switch counties, use select_county.",
      inputSchema: {
        countySlug: z.string().optional().describe("County slug. Engine Beta renders riverside-ca; other indexed US slugs return honest coverage shells."),
        selectedNodeId: z.string().optional().describe("Atlas node id to focus, such as eastvale."),
        includeGeneratedDraft: z
          .boolean()
          .optional()
          .describe("When true for an indexed shell county, attach a non-playable generated draft scene packet in widget-only _meta."),
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
        "openai/toolInvocation/invoking": "Refreshing Atlas map...",
        "openai/toolInvocation/invoked": "Atlas map refreshed.",
      },
    },
    async ({ countySlug, selectedNodeId, includeGeneratedDraft }) => instrumentMcpTool("render_voxel_county", async () => {
      await enforceMcpExpensiveToolRateLimit("render_voxel_county");
      if (!isPlayableEngineBetaCounty(countySlug)) {
        const coverage = countyCoverageForSlug(countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG);
        const scenePacket = await scenePacketStatusForCoverage(coverage);
        const generatedDraft = includeGeneratedDraft ? await getOrCreateGeneratedDraftScenePacket(coverage) : undefined;
        const generatedDraftCopy = generatedDraft
          ? generatedDraft.generatedDraftSpec
            ? " A generated draft packet is attached for the widget only: session-only, non-playable, provider-free, and not local truth."
            : " The generated draft is preparing; the widget can keep the county shell while the packet cache warms."
          : "";
        return {
          structuredContent: coverage,
          _meta: {
            scenePacket,
            ...hostedClawdMeta(hostedClawdService.getContext({
              trigger: "map_tray",
              countySlug: coverage.countySlug,
              countyLabel: coverage.countyLabel,
            })),
            ...(generatedDraft ?? {}),
          },
          content: [
            {
              type: "text" as const,
              text: `${coverage.message} ${coverage.countyLabel ?? "This county"} is browse-only in Atlas right now. Atlas only draws a local world after a curated playable district exists. Open Riverside/Eastvale for the playable map.${generatedDraftCopy}`,
            },
          ],
        };
      }

      const { scene, scenePacket } = await getOrCreatePlayableScenePacket(
        countySlug ?? PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
        selectedNodeId ?? "eastvale",
      );
      const decoration = decorateCityWorldSceneWithCameraIntent(scene, defaultCameraIntentForScene(scene));
      return {
        structuredContent: voxelSceneStructuredContent(scene, decoration?.cameraIntent),
        _meta: {
          scene,
          scenePacket,
          ...(decoration ? { cameraFocus: decoration.cameraFocus } : {}),
          ...(atlasSaveSurfaceEnabled ? { hostedClawd: hostedClawdContextForScene(scene, "map_tray") } : {}),
        },
        content: [
          {
            type: "text" as const,
            text: `Showing the Riverside/Eastvale playable map. Pins and notes stay in this chat.`,
          },
        ],
      };
    }),
  );

  registerAppTool(
    server,
    "preview_scout_drop",
    {
      title: "Preview Scout Drop",
      description:
        "Use this when the user asks to drop Clawd, scout a chosen location, or find where to launch a local offer. It creates a session-only Scout Drop preview with route, signals, risks, channels, and next actions; it does not open or refresh county maps. Uses curated scene data where available and synthetic session-only template signals elsewhere; nothing is saved, posted, or executed.",
      inputSchema: {
        countySlug: z.string().optional().describe("County slug for the Scout context."),
        nodeId: z.string().optional().describe("Atlas node id when known."),
        locationLabel: z.string().optional().describe("Fallback location label, such as Eastvale or a requested place."),
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
    async ({ countySlug, nodeId, locationLabel, businessType, goal, budget, serviceRadius }) => instrumentMcpTool("preview_scout_drop", async () => {
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
          ...(atlasSaveSurfaceEnabled ? { hostedClawd: hostedClawdContextForScout(preview) } : {}),
        },
        content: [
          {
            type: "text" as const,
            text: `${preview.summary} Best offer: ${preview.bestOffer}. This is a session-only Alpha preview; it does not save, post, message, spend, grant XP, or execute outreach. Next: ${preview.alphaBoundary.userActionLabel}.`,
          },
        ],
      };
    }),
  );

  registerAppTool(
    server,
    "preview_campaign_engine",
    {
      title: "Preview Campaign Engine",
      description:
        "Use this when the user wants a 7-day manual campaign plan after an Atlas Scout Drop exists. Pass the scoutPreviewId returned by preview_scout_drop when available; if the id is stale, Atlas rebuilds the Scout preview from the supplied args and continues. Session-only: Alpha does not post, DM, buy ads, persist state, or perform live campaign execution.",
      inputSchema: {
        scoutPreviewId: z.string().describe("Scout Drop id returned by preview_scout_drop."),
        countySlug: z.string().optional().describe("County slug from the Scout Drop."),
        nodeId: z.string().optional().describe("Atlas node id from the Scout Drop when known."),
        locationLabel: z.string().optional().describe("Fallback location label from the Scout Drop."),
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
    async ({ scoutPreviewId, countySlug, nodeId, locationLabel, businessType, goal, budget, serviceRadius }) => instrumentMcpTool("preview_campaign_engine", async () => {
      const { campaignPreview, rebuiltScoutPreview } = previewCampaignFromScoutRequest({
        scoutPreviewId,
        countySlug: countySlug ?? "riverside-ca",
        nodeId,
        locationLabel: locationLabel ?? "Eastvale",
        businessType: businessType ?? "mobile detailing",
        goal: goal ?? "Find the strongest first drop for a local mobile detailing offer.",
        budget,
        serviceRadius,
      });

      return {
        structuredContent: campaignPreviewStructuredContent(campaignPreview),
        _meta: {
          campaignPreview,
          scene: campaignPreview.scene,
          ...(atlasSaveSurfaceEnabled ? { hostedClawd: hostedClawdContextForCampaign(campaignPreview) } : {}),
        },
        content: [
          {
            type: "text" as const,
            text: `${rebuiltScoutPreview ? "Rebuilt scout preview from the supplied args. " : ""}${campaignPreview.summary} This is a session-only manual preview; no posting, messaging, ad spend, persistence, evidence, or XP is performed. Next: ${campaignPreview.alphaBoundary.userActionLabel}.`,
          },
        ],
      };
    }),
  );

  registerAppTool(
    server,
    "get_upgrade_options",
    {
      title: "Get Hosted Clawd options",
      description:
        "Use this when the user asks to save or persist their work, track evidence, or asks about pricing or Hosted Clawd. Explains the free Alpha limits and planned Hosted Clawd Beta options. Informational only — it does not start checkout, create an account, post, message, buy ads, or save campaign state.",
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
    async ({ trigger }) => instrumentMcpTool("get_upgrade_options", async () => {
      const options = upgradeOptionsStructuredContent(trigger);
      const optionSummaryLabel = atlasSaveSurfaceEnabled ? options.hosted.label : options.free.label;
      return {
        structuredContent: options,
        _meta: {
          ...hostedClawdMeta(options.hostedClawd),
        },
        content: [
          {
            type: "text" as const,
            text: `${optionSummaryLabel}: ${options.nextStep}`,
          },
        ],
      };
    }),
  );

  return server;
}

function mcpSessionIdFor(req: IncomingMessage): string | undefined {
  const raw = req.headers["mcp-session-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function mcpJsonRpcError(res: ServerResponse, status: number, code: number, message: string): void {
  jsonResponse(res, status, {
    jsonrpc: "2.0",
    error: { code, message },
    id: null,
  });
}

function createMcpSessionEntry(): McpSessionEntry {
  let entry: McpSessionEntry;
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      entry.sessionId = sessionId;
      entry.lastSeenAtMs = Date.now();
      mcpSessions.set(sessionId, entry);
      evictMcpSessions(sessionId);
    },
  });
  const server = createAtlasServer();
  entry = {
    server,
    transport,
    lastSeenAtMs: Date.now(),
  };
  transport.onclose = () => {
    const sessionId = entry.sessionId;
    if (sessionId && mcpSessions.get(sessionId) === entry) {
      mcpSessions.delete(sessionId);
    }
  };
  return entry;
}

function evictMcpSessions(preserveSessionId?: string): void {
  const now = Date.now();
  for (const [sessionId, entry] of mcpSessions) {
    if (sessionId !== preserveSessionId && now - entry.lastSeenAtMs > MCP_SESSION_IDLE_TTL_MS) {
      void closeMcpSession(sessionId, "idle_ttl");
    }
  }

  const overflow = mcpSessions.size - MAX_MCP_SESSIONS;
  if (overflow <= 0) return;

  const oldest = [...mcpSessions.entries()]
    .filter(([sessionId]) => sessionId !== preserveSessionId)
    .sort((left, right) => left[1].lastSeenAtMs - right[1].lastSeenAtMs)
    .slice(0, overflow);
  for (const [sessionId] of oldest) {
    void closeMcpSession(sessionId, "max_sessions");
  }
}

async function closeMcpSession(sessionId: string, reason: "idle_ttl" | "max_sessions" | "uninitialized_error"): Promise<void> {
  const entry = mcpSessions.get(sessionId);
  if (!entry) return;
  mcpSessions.delete(sessionId);
  try {
    await entry.server.close();
  } catch (error) {
    logBackendEvent("mcp_session_close_failed", {
      reason,
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  evictMcpSessions();
  const sessionId = mcpSessionIdFor(req);
  const existingEntry = sessionId ? mcpSessions.get(sessionId) : undefined;
  if (sessionId && !existingEntry) {
    mcpJsonRpcError(res, 404, -32001, "Session not found");
    return;
  }
  if (!sessionId && req.method !== "POST") {
    mcpJsonRpcError(res, 400, -32000, "Bad Request: Mcp-Session-Id header is required");
    return;
  }

  const entry = existingEntry ?? createMcpSessionEntry();
  entry.lastSeenAtMs = Date.now();

  await requestContext.run(requestContextFor(req, res), async () => {
    try {
      if (!existingEntry) {
        await entry.server.connect(entry.transport);
      }
      await entry.transport.handleRequest(req, res);
    } catch (error) {
      console.error("MCP request failed:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    } finally {
      if (!entry.sessionId) {
        await entry.server.close();
      }
    }
  });
}

function shouldValidateOrigin(url: URL, method: string | undefined): boolean {
  if (!method) return false;
  if (url.pathname === MCP_PATH && ["POST", "GET", "DELETE", "OPTIONS"].includes(method)) return true;
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function isHostedClawdWriteRoute(url: URL, method: string | undefined): boolean {
  return method === "POST" && HOSTED_CLAWD_WRITE_PATHS.has(url.pathname);
}

// A cache dependency must never kill the API server: @redis/client v6 can
// throw from internal timer/abort callbacks (uncaught, not routed to any
// promise — crashed two production healthchecks). Guard ONLY that class;
// everything else stays fail-fast.
function isRedisInternalError(error: unknown): boolean {
  return error instanceof Error && typeof error.stack === "string" && error.stack.includes("@redis/client");
}
process.on("uncaughtException", (error) => {
  if (isRedisInternalError(error)) {
    logBackendEvent("redis_internal_error_guarded", { message: error.message });
    return;
  }
  console.error(error);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  if (isRedisInternalError(reason)) {
    logBackendEvent("redis_internal_error_guarded", { message: reason instanceof Error ? reason.message : String(reason) });
    return;
  }
  console.error(reason);
  process.exit(1);
});

const httpServer = createServer(async (req, res) => {
  const requestId = requestIdFor(req);
  res.setHeader("x-request-id", requestId);
  const requestStartedAtMs = Date.now();
  const requestPath = req.url?.split("?")[0] ?? "";
  logBackendEvent("http_request_started", {
    requestId,
    method: req.method,
    path: requestPath,
  });
  // One readable line per completed hit — the 360 view of real ChatGPT
  // traffic (G8): status + duration, plus caller identity (origin/UA) for
  // the surfaces ChatGPT touches. No query strings, no bodies, no PII.
  res.on("finish", () => {
    const interesting = requestPath === MCP_PATH || requestPath.startsWith("/widget/") || requestPath === "/ready";
    logBackendEvent("http_request_finished", {
      requestId,
      method: req.method,
      path: requestPath,
      status: res.statusCode,
      durationMs: Date.now() - requestStartedAtMs,
      ...(interesting && req.headers.origin ? { origin: String(req.headers.origin).slice(0, 100) } : {}),
      ...(interesting && req.headers["user-agent"] ? { userAgent: String(req.headers["user-agent"]).slice(0, 80) } : {}),
    });
  });

  if (!req.url) {
    textResponse(res, 400, "Missing URL");
    return;
  }

  // Railway healthchecks hit /ready with an internal Host header; liveness
  // probes carry no session or user data, so they bypass host admission.
  const probePath = req.url.split("?")[0];
  if (req.method === "GET" && (probePath === "/health" || probePath === "/ready")) {
    if (probePath === "/health") {
      jsonResponse(res, 200, { ok: true, version: SERVER_VERSION });
      return;
    }
    const payload = await readyPayload();
    const status = typeof payload === "object" && payload !== null && "ok" in payload && payload.ok === true ? 200 : 503;
    jsonResponse(res, status, payload);
    return;
  }

  const hostAdmission = validateHostHeader(req, serverSecurityConfig);
  if (!hostAdmission.ok) {
    logBackendEvent("request_admission_denied", {
      requestId,
      reason: hostAdmission.reason,
      method: req.method,
      path: req.url?.split("?")[0] ?? "",
    });
    textResponse(res, hostAdmission.status, hostAdmission.status === 400 ? "Bad Request" : "Forbidden");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? `localhost:${PORT}`}`);

  if (shouldValidateOrigin(url, req.method)) {
    const originAdmission = validateOriginHeader(req, serverSecurityConfig);
    if (!originAdmission.ok) {
      logBackendEvent("request_admission_denied", {
        requestId,
        reason: originAdmission.reason,
        method: req.method,
        path: url.pathname,
      });
      textResponse(res, originAdmission.status, "Forbidden");
      return;
    }
  }

  if (url.pathname === "/" && req.method === "GET") {
    textResponse(res, 200, `Atlas MCP server\nMCP: http://localhost:${PORT}${MCP_PATH}\nPreview: http://localhost:${PORT}/preview\n`);
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
    await handleGeoGeocode(req, url, res);
    return;
  }

  if (url.pathname === "/api/world/lookup" && req.method === "GET") {
    await handleWorldLookup(req, url, res);
    return;
  }

  if (url.pathname === "/api/engine/scene-packets/status" && req.method === "GET") {
    jsonResponse(res, 200, {
      ok: true,
      update: SCENE_PACKET_MEMORY_ADAPTER_UPDATE_ID,
      cache: await scenePacketMemory.status(),
    });
    return;
  }

  if (url.pathname === "/api/ops/mcp-stats" && req.method === "GET") {
    jsonResponse(res, 200, mcpStatsPayload());
    return;
  }

  // OAuth protected-resource metadata (RFC 9728) for Hosted Clawd account
  // linking. Only meaningful when the OIDC issuer/audience are configured.
  if (url.pathname === "/.well-known/oauth-protected-resource" && req.method === "GET") {
    setCors(req, res);
    if (!hostedClawdAuthConfig) {
      jsonResponse(res, 404, {
        ok: false,
        error: "OAuth protected-resource metadata is not configured on this deployment.",
      });
      return;
    }
    jsonResponse(
      res,
      200,
      buildOAuthProtectedResourceMetadata(hostedClawdAuthConfig, hostedClawdProtectedResourceUrl(req)),
    );
    return;
  }

  if (url.pathname === "/api/hosted-clawd/state" && req.method === "GET") {
    jsonResponse(res, 200, {
      ok: true,
      hostedClawd: hostedClawdService.getContext(hostedClawdInputFromUrl(url)),
    });
    return;
  }

  if (url.pathname === "/api/hosted-clawd/saved" && req.method === "GET") {
    await handleHostedClawdSavedState(req, res, url);
    return;
  }

  if (url.pathname === "/api/stripe/webhook" && req.method === "POST") {
    await handleHostedClawdStripeWebhookRoute(req, res);
    return;
  }

  if (isHostedClawdWriteRoute(url, req.method) && !hostedClawdWriteRouterMounted) {
    textResponse(res, 404, "Not Found");
    return;
  }

  if (url.pathname === "/api/hosted-clawd/create-or-attach" && req.method === "POST") {
    if (!(await enforceRateLimit(req, res, "hosted_clawd_write", HOSTED_CLAWD_WRITE_RATE_LIMIT, "create_or_attach_clawd"))) return;
    await handleHostedClawdAction(req, res, "create_or_attach_clawd");
    return;
  }

  if (url.pathname === "/api/hosted-clawd/promote-session" && req.method === "POST") {
    if (!(await enforceRateLimit(req, res, "hosted_clawd_write", HOSTED_CLAWD_WRITE_RATE_LIMIT, "promote_session"))) return;
    await handleHostedClawdAction(req, res, "promote_session");
    return;
  }

  if (url.pathname === "/api/hosted-clawd/saved-artifacts/campaigns" && req.method === "POST") {
    if (!(await enforceRateLimit(req, res, "hosted_clawd_write", HOSTED_CLAWD_WRITE_RATE_LIMIT, "save_campaign_artifact"))) return;
    await handleHostedClawdAction(req, res, "save_campaign_artifact");
    return;
  }

  if (url.pathname === "/api/hosted-clawd/checkout" && req.method === "POST") {
    if (!(await enforceRateLimit(req, res, "hosted_clawd_write", HOSTED_CLAWD_WRITE_RATE_LIMIT, "start_checkout"))) return;
    await handleHostedClawdAction(req, res, "start_checkout");
    return;
  }

  if (url.pathname === "/api/hosted-clawd/billing-portal" && req.method === "POST") {
    if (!(await enforceRateLimit(req, res, "hosted_clawd_write", HOSTED_CLAWD_WRITE_RATE_LIMIT, "open_billing_portal"))) return;
    await handleHostedClawdAction(req, res, "open_billing_portal");
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

  if (url.pathname.startsWith("/widget/") && req.method === "GET") {
    sendWidgetAssetResponse(res, url.pathname.slice("/widget/".length));
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

  if (url.pathname === "/emulator" && req.method === "GET") {
    // Dev tooling only — never expose the host harness (and its same-origin
    // MCP access) on production (council security/SRE finding).
    if (process.env.NODE_ENV === "production") {
      textResponse(res, 404, "Not Found");
      return;
    }
    try {
      htmlResponse(res, 200, emulatorPageHtml());
    } catch (error) {
      textResponse(res, 500, error instanceof Error ? error.message : "Emulator failed");
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
  logBackendEvent("hosted_clawd_router_mode", {
    mode: hostedClawdWriteRouterMounted ? "write_routes_mounted" : "write_routes_404",
    persistenceEnabled: hostedClawdFlags.persistenceEnabled,
    persistenceAdapterConfigured: Boolean(hostedClawdPersistence),
    moneyEnabled: hostedClawdFlags.moneyEnabled,
  });
});
