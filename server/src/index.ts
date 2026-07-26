import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID, timingSafeEqual } from "node:crypto";
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
import { loadAtlasIndex } from "./atlasIndex.js";
import { createAtlasPlateService, plateHttpStatus } from "./atlasPlates.js";
import { ATLAS_TOOL_NAMES, registerAtlasTools } from "./atlasTools.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
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
  COUNTY_TOWN_ANCHOR_UPDATE_ID,
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
import { compileCountyGeoScene, riversideDemoVoxelScene, type CountyGeoPack } from "@atlas/core/voxel";
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
  ATLAS_COMMONS_READ_SCOPE,
  ATLAS_COMMONS_WRITE_SCOPE,
  AtlasCommonsError,
  AtlasCommonsService,
  createPostgresAtlasCommonsRepository,
  readAtlasCommonsConfig,
  type AtlasCommonsAuthContext,
  type AtlasCommonsAnchor,
} from "./atlasCommons/index.js";
import {
  isLoopbackAddress,
  isPrivateOrLoopbackAddress,
  readServerSecurityConfig,
  setCorsHeaders,
  validateHostHeader,
  validateOriginHeader,
} from "./security.js";
import { loadCountyTownAnchorIndex, townAnchorsForCounty } from "./countyTownAnchorIndex.js";
import { createCountyGeoPackLoader, serveCountyGeoPack } from "./countyGeoPack.js";
import {
  createRoadChunkRouteMetrics,
  createRoadChunkStoreFromEnv,
  serveRoadCatalog,
  serveRoadChunk,
  serveRoadManifest,
  type RoadBand,
} from "./roadChunkStore.js";

const SERVER_VERSION = "0.1.0";
const WIDGET_URI = "ui://widget/atlas-city-world-081d.html";
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
const countyTownAnchorIndex = loadCountyTownAnchorIndex(
  resolve(ROOT_DIR, "data", "census", "us-county-town-anchors.json"),
);

// Real-geography county boards: TIGER geo packs (boundary + water) baked to
// data/geo-packs (full national index). Primary national map surface.
// The slug guard + negative-cache live in the shared countyGeoPack helper so
// the read-only /geo-pack route reuses the exact same loading path (D2-0).
const GEO_PACKS_DIR = resolve(ROOT_DIR, "data", "geo-packs");
const loadCountyGeoPack = createCountyGeoPackLoader(GEO_PACKS_DIR);

// The atlas: the place index and the plate serving layer. The index is built
// once at boot from the Census anchor file (~18,400 places); it is the same
// index the Location Truth gate certifies, so the product and the gate can
// never disagree about what Atlas knows.
const ATLAS_PLATE_DIR = resolve(ROOT_DIR, "artifacts", "atlas-plates");
const atlasIndex = loadAtlasIndex(resolve(ROOT_DIR, "data", "census", "us-county-town-anchors.json"));
const atlasPlateService = createAtlasPlateService({
  plateDir: ATLAS_PLATE_DIR,
  geoPacksDir: GEO_PACKS_DIR,
  townAnchorsFor: (slug) => atlasIndex.anchorsFor(slug),
  countyIdentity: (slug) => atlasIndex.identityFor(slug),
});

// Counties with real baked TIGER street geometry. Everywhere else Atlas draws
// boundary, water, and town positions only — and says so rather than implying
// street-level detail it does not have.
const COUNTIES_WITH_STREETS: ReadonlySet<string> = new Set(
  (() => {
    try {
      const coverage = JSON.parse(
        readFileSync(resolve(ROOT_DIR, "data", "road-chunks", "_coverage.json"), "utf8"),
      ) as { counties?: Array<{ slug?: string } | string> };
      return (coverage.counties ?? [])
        .map((entry) => (typeof entry === "string" ? entry : entry.slug))
        .filter((slug): slug is string => typeof slug === "string");
    } catch {
      return [];
    }
  })(),
);

/** National open: geo board + town anchors; generated clay only when explicitly requested. */
async function nationalCountyMapMeta(
  coverage: CountyCoverageStructuredContent,
  options: { includeGeneratedDraft?: boolean } = {},
): Promise<{
  scenePacket: Awaited<ReturnType<typeof scenePacketStatusForCoverage>>;
  countyGeoPack: unknown | null;
  townAnchors: ReturnType<typeof townAnchorsForCounty>;
  generatedDraft?: Awaited<ReturnType<typeof getOrCreateGeneratedDraftScenePacket>>;
  userFacingCopy: string;
}> {
  const scenePacket = await scenePacketStatusForCoverage(coverage);
  const countyGeoPack = loadCountyGeoPack(coverage.countySlug);
  const townAnchors = townAnchorsForCounty(countyTownAnchorIndex, coverage.countySlug);
  const wantStudy = options.includeGeneratedDraft === true;
  const generatedDraft = wantStudy ? await getOrCreateGeneratedDraftScenePacket(coverage) : undefined;
  const geoLine = countyGeoPack
    ? " Atlas shows the real Census county outline, water, and town names. Streets and buildings are not mapped yet."
    : " Atlas could not load the county outline pack for this open; try again or open Riverside/Eastvale.";
  const studyLine = generatedDraft?.generatedDraftSpec
    ? " An illustrative layout study is also attached; it is not verified street coverage."
    : wantStudy
      ? " The layout study is preparing."
      : "";
  const noteBoundary = atlasCommonsConfig.enabled
    ? " Private notes stay in this chat; explicit public posts wait for moderation."
    : " Pins and notes stay in this chat.";
  const userFacingCopy = `${coverage.message} Preview only. ${coverage.countyLabel ?? "This county"} is a national Census board in Atlas.${geoLine}${studyLine} Real Census town names are attached. Atlas does not add verified streets, buildings, businesses, saved work, XP, evidence, outreach, or automation here. Riverside/Eastvale is fully explorable today.${noteBoundary}`;
  return { scenePacket, countyGeoPack, townAnchors, ...(generatedDraft ? { generatedDraft } : {}), userFacingCopy };
}

// Road-chunk serving (0.78-R2): catalog + manifest + chunk over a CDN-swappable
// store. Filesystem dogfood packs stay under data/road-chunks; national packs
// live on ATLAS_ROAD_CHUNKS_ORIGIN (bucket). Client may fetch immutable bytes
// from ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN (docs/NATIONAL_SCALE.md).
const ROAD_CHUNKS_DIR = resolve(ROOT_DIR, "data", "road-chunks");
const roadChunkStoreBundle = createRoadChunkStoreFromEnv(process.env, { filesystemRoot: ROAD_CHUNKS_DIR });
const roadChunkStore = roadChunkStoreBundle.store;
const roadChunksOrigin = roadChunkStoreBundle.origin;
const roadChunksPublicOrigin = roadChunkStoreBundle.publicOrigin;
const roadChunksS3Bucket = roadChunkStoreBundle.s3Bucket;
// Hit/miss/latency counters for the road routes, surfaced in the token-gated
// ops-stats payload (counting logic is unit-tested in roadChunkStore).
const roadChunkRouteMetrics = createRoadChunkRouteMetrics();
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
const atlasCommonsConfig = readAtlasCommonsConfig(process.env);
const hostedClawdAuthConfig = readHostedClawdAuthConfig(process.env);
const hostedClawdAuthenticator = hostedClawdAuthConfig
  ? new HostedClawdAuthenticator(hostedClawdAuthConfig)
  : undefined;
const hostedClawdDatabaseUrl = process.env.DATABASE_URL?.trim() || undefined;
const atlasDatabasePool =
  (hostedClawdFlags.persistenceEnabled || atlasCommonsConfig.enabled) && hostedClawdDatabaseUrl
    ? createHostedClawdPool(hostedClawdDatabaseUrl)
    : undefined;
const hostedClawdPool = hostedClawdFlags.persistenceEnabled ? atlasDatabasePool : undefined;
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
const atlasSaveSurfaceEnabled = (process.env.ATLAS_SAVE_SURFACE ?? "off").trim().toLowerCase() === "on";
const atlasCommonsRepository =
  atlasCommonsConfig.enabled && atlasDatabasePool
    ? createPostgresAtlasCommonsRepository(atlasDatabasePool)
    : undefined;
const atlasCommonsService = new AtlasCommonsService({
  config: atlasCommonsConfig,
  repository: atlasCommonsRepository,
  resolveAnchor: resolveAtlasCommonsAnchor,
  authConfigured: Boolean(hostedClawdAuthenticator),
});

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
// Own bucket for the read-only /geo-pack route. This is a direct static route
// that bypasses the MCP tool-call limiter, so it needs its own throttle to keep
// a scraper from enumerating counties and pulling the whole baked set (plan
// decision #46). Generous enough for a widget fetching a handful of packs.
const GEO_PACK_RATE_LIMIT = 120;
// Own bucket for the read-only /road-catalog + /road-chunks routes. Static routes
// bypass the MCP limiter, and a single NEAR pan legitimately fetches many chunks,
// so this sits above the MCP-expensive bucket (120) while still bounding a
// county×band×chunk enumeration scrape of the national bake (wire contract §3.5 /
// plan decision #46). 240/min is calibration-pending against a measured
// NEAR-pan burst on miami-dade-fl before it is frozen.
const ROAD_CHUNKS_RATE_LIMIT = 240;
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

// The public tool surface: three read-only tools over US Census geography.
// Atlas is an atlas. It has no accounts, no commerce, no third-party calls, and
// no tool the model is told to avoid using. Definitions live in atlasTools.ts;
// scripts/lib/atlas-tool-surface.mjs holds the same list for the verifiers.
const MCP_TOOL_NAMES = ATLAS_TOOL_NAMES;

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

const atlasPublicNoteSchema = z.object({
  id: z.string(),
  countySlug: z.string(),
  placeId: z.string(),
  placeLabel: z.string(),
  body: z.string().min(1).max(240),
  authorHandle: z.string(),
  status: z.enum(["pending", "visible", "removed"]).optional(),
  reactionCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
  viewerHasReacted: z.boolean().optional(),
  viewerCanReport: z.boolean(),
});

const atlasPublicNoteListOutputSchema = {
  type: z.literal("atlasPublicNoteList"),
  notes: z.array(atlasPublicNoteSchema),
  nextCursor: z.string().optional(),
  scope: z.object({
    mode: z.enum(["all", "mine"]),
    sort: z.enum(["hot", "new"]),
    countySlug: z.string().optional(),
    placeId: z.string().optional(),
  }),
};

const atlasPublicNoteWriteOutputSchema = {
  type: z.literal("atlasPublicNoteWrite"),
  operation: z.enum(["post", "react", "report"]),
  status: z.enum(["accepted", "unchanged"]),
  note: atlasPublicNoteSchema,
  message: z.string(),
};

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
  hostedClawd: hostedClawdContextSchema.optional(),
};

const worldSourceNoteSchema = z.object({
  source: z.enum(["mock", "curated", "google", "census", "osm", "local-open-data"]),
  label: z.string(),
  attribution: z.string(),
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
  radiusMeters: z.number(),
  resolvedLocation: z.object({
    label: z.string(),
    formattedAddress: z.string().optional(),
  }),
  places: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      category: worldPlaceCategorySchema,
      address: z.string().optional(),
      sourceNotes: z.array(worldSourceNoteSchema),
    }),
  ),
};

const countyQuestionAnswerOutputSchema = {
  type: z.literal("countyQuestionAnswer"),
  countySlug: z.string(),
  question: z.string(),
  supported: z.boolean(),
  topic: z.enum(["eastvale_first_slice", "business_signals", "county_summary", "generated_place", "source_limits", "unsupported"]),
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
  suggestedNextTool: z.enum(["select_county", "lookup_world_places"]).optional(),
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
      message: "Atlas cannot preview this county yet. Open Riverside County for the full map.",
      playableDistrictCount: 0,
      placeCount: 0,
      districts: [],
      sourceNotes: response.cache.sourceNotes.map(publicSourceNote),
      limitations: [
        "Riverside County is fully explorable today.",
        "Atlas does not use Riverside data as a stand-in.",
      ],
      suggestedNextCountySlug: response.suggestedNextCountySlug,
    };
  }

  const isPreviewOnlyCounty = response.county.coverageTier === "L1_COUNTY_SHELL";
  return {
    type: "countyCoverageSummary",
    countySlug: response.county.countySlug,
    countyLabel: response.county.label,
    supported: response.county.supported,
    coverageTier: response.county.coverageTier,
    coverageLabel: isPreviewOnlyCounty ? "Preview available" : "Full map available",
    message: isPreviewOnlyCounty
      ? `${response.county.label} opens as a Census geography board with real boundary, water, and town names. Streets and buildings are not mapped yet.`
      : response.county.coverageMessage,
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
    sourceNotes: response.cache.sourceNotes.map(publicSourceNote),
    limitations: [
      "Interactive full clay map is Riverside/Eastvale; other counties open as Census geography boards.",
      "Atlas does not add local places, saved work, XP, evidence, outreach, or automation here.",
    ],
    suggestedNextCountySlug: PLAYABLE_ENGINE_BETA_COUNTY_SLUG,
  };
}

function publicSourceNote(note: CountyCoverageStructuredContent["sourceNotes"][number]): CountyCoverageStructuredContent["sourceNotes"][number] {
  if (note.source !== "curated" || !/alpha|curated|demo/i.test(`${note.label} ${note.attribution}`)) return note;
  return {
    ...note,
    label: "Atlas Riverside/Eastvale map data",
    attribution: "Atlas built-in map data",
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
    throw new Error(`Atlas only renders a full map for ${PLAYABLE_ENGINE_BETA_COUNTY_SLUG} right now.`);
  }
  const pack = countyPackService.loadCountyPack(countySlug);
  return compileVoxelSceneFromCountyPack(pack, { selectedNodeId });
}

function resolveAtlasCommonsAnchor(countySlug: string, requestedPlaceId: string): AtlasCommonsAnchor | undefined {
  const anchoredCounty = countyTownAnchorIndex.counties[countySlug];
  if (anchoredCounty) {
    const requestedGeoid = requestedPlaceId
      .replace(/^town-anchor-/, "")
      .replace(/^census-place-/, "");
    const town = anchoredCounty.anchors.find((anchor) => anchor.censusPlaceGeoid === requestedGeoid);
    if (town) {
      return {
        countySlug,
        placeId: `town-anchor-${town.censusPlaceGeoid}`,
        placeLabel: town.label,
      };
    }
  }

  if (countySlug !== PLAYABLE_ENGINE_BETA_COUNTY_SLUG) return undefined;
  try {
    const scene = compileCountyScene(countySlug, requestedPlaceId);
    const place = scene.world?.places.find(
      (candidate) => candidate.id === requestedPlaceId || candidate.nodeId === requestedPlaceId,
    );
    return place
      ? { countySlug, placeId: place.id, placeLabel: place.label }
      : undefined;
  } catch {
    return undefined;
  }
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
    throw new Error(`Atlas could not load the Riverside/Eastvale map for ${countySlug}.`);
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

function cameraIntentForGeneratedCountyAnswer(cityScene: CityWorldScene | undefined, answer: CountyQuestionAnswer): CameraIntent | undefined {
  if (!cityScene || !answer.supported || !answer.targetNodeId) return undefined;
  const targetPlace =
    cityScene.places.find((place) => place.nodeId === answer.targetNodeId && (!answer.targetLabel || place.label === answer.targetLabel)) ??
    cityScene.places.find((place) => place.nodeId === answer.targetNodeId) ??
    cityScene.places.find((place) => normalizedLabel(place.label) === normalizedLabel(answer.targetLabel));
  if (!targetPlace) return undefined;

  return {
    type: targetPlace.kind === "landmark" ? "focus_landmark" : "focus_place",
    targetNodeId: targetPlace.nodeId,
    targetLabel: targetPlace.label,
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

function publicCountyQuestionAnswer(answer: CountyQuestionAnswer): CountyQuestionAnswer {
  return {
    ...answer,
    answer: publicAtlasCopy(answer.answer),
    facts: answer.facts.map((fact) => ({
      ...fact,
      label: publicAtlasCopy(fact.label),
      value: publicAtlasCopy(fact.value),
    })),
    sourceNotes: answer.sourceNotes.map((note) => ({
      ...note,
      name: publicAtlasCopy(note.name),
    })),
    limitations: answer.limitations.map(publicAtlasCopy),
  };
}

function publicAtlasCopy(value: string): string {
  return value
    .replace(/\bcurated Riverside Alpha pack\b/gi, "built-in Riverside/Eastvale data")
    .replace(/\bcurated Atlas data\b/gi, "built-in Atlas data")
    .replace(/\bcurated pack\b/gi, "built-in map data")
    .replace(/\bcurated supported county packs\b/gi, "built-in supported county data")
    .replace(/\bcurated Riverside pack\b/gi, "built-in Riverside/Eastvale data")
    .replace(/\bRiverside Alpha pack\b/gi, "Riverside/Eastvale map data")
    .replace(/\bAtlas curated Riverside preview data\b/gi, "Atlas Riverside/Eastvale map data")
    .replace(/\bcurated Riverside\/Eastvale pack\b/gi, "built-in Riverside/Eastvale data")
    .replace(/\bcurated Alpha data\b/gi, "built-in map data")
    .replace(/\bAtlas Alpha curated demo pack\b/gi, "Atlas Riverside/Eastvale map data")
    .replace(/\bAtlas Alpha\b/g, "Atlas")
    .replace(/\bAlpha boundary\b/gi, "Product boundary")
    .replace(/\bAlpha planning signals\b/gi, "planning signals")
    .replace(/\bSupported Alpha county\b/gi, "Supported full-map county")
    .replace(/\bAlpha Free\b/g, "Session-only map")
    .replace(/\bSession-only free map planner\b/g, "Session-only map")
    .replace(/\bfree map planner\b/gi, "session-only map")
    .replace(/\bAlpha\b/g, "session")
    .replace(/\bEngine Beta\b/g, "map")
    .replace(/\bclosed-world demo data\b/gi, "built-in map data")
    .replace(/\bcurated demo pack\b/gi, "built-in map data")
    .replace(/\bdemo pack\b/gi, "map data")
    .replace(/\bdemo data\b/gi, "map data")
    .replace(/\bEastvale demo\b/gi, "Eastvale full map")
    .replace(/\bPrototype data only\.[^.]*\./gi, "Built-in map data for planning only.")
    .replace(/\bcoming soon\b/gi, "not included in this session-only map")
    .replace(/\btrial\b/gi, "session")
    .replace(/\bcurated map zone\b/gi, "map zone")
    .replace(/\bcurated map place\b/gi, "map place")
    .replace(/\bcurated nodes\b/gi, "map nodes")
    .replace(/\bcurated edges\b/gi, "map routes")
    .replace(/\bcurated signals\b/gi, "map signals")
    .replace(/\bcurated\b/gi, "built-in");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function getOrCreateGeneratedDraftScenePacket(
  coverage: CountyCoverageStructuredContent,
  options: { includeScenePayload?: boolean } = {},
): Promise<{
  generatedDraftSpec?: DeterministicGeneratedDistrictSpec;
  generatedDraftScene?: CityWorldScene;
  generatedDraftPacket: ScenePacketMemorySummary;
} | undefined> {
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
  const townAnchors = townAnchorsForCounty(countyTownAnchorIndex, county.countySlug);
  const generated = createDeterministicGeneratedDistrictSpec({ county, townAnchors });
  const engineUpdateId = townAnchors.length > 0
    ? COUNTY_TOWN_ANCHOR_UPDATE_ID
    : DETERMINISTIC_GENERATED_DISTRICT_UPDATE_ID;
  const job: ScenePacketGeneratedDraftJob = {
    id: `${coverage.countySlug}:${generated.districtSlug}:generated-initial-window:${engineUpdateId}`,
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
    engineUpdateId,
    sourceNotes: coverage.sourceNotes.map(toWorldSourceNote),
  };
  const packet = await scenePacketMemory.getOrCreateGeneratedDraftScenePacket({
    stateCode: county.stateCode,
    countySlug: county.countySlug,
    districtSlug: generated.districtSlug,
    cameraPresetId: "generated-draft",
    windowHash: "generated-initial-window",
    sceneSchemaVersion: "city-world-v1",
    engineUpdateId,
    sourceNotes: coverage.sourceNotes.map(toWorldSourceNote),
    createScene: () => createDeterministicGeneratedDistrictScene({ county, townAnchors }).result.scene,
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
    ...(options.includeScenePayload && packet.payload ? { generatedDraftScene: packet.payload as CityWorldScene } : {}),
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
        "Campaign drafts after saved work is approved.",
        "New saves after account and billing approval.",
      ];
  const unavailableActions = ownerGatedTest
    ? [
        "Public paid access is not live.",
        "Returning from Checkout does not turn on saving by itself.",
        "Atlas will not auto-post, auto-DM, buy ads, or scrape private people.",
      ]
    : [
        "Checkout is not live.",
        "Atlas cannot create an account or persist campaign history yet.",
        "Atlas will not auto-post, auto-DM, buy ads, or scrape private people.",
      ];
  const nextStep = ownerGatedTest
    ? "Use Hosted Clawd as a closed test surface only; public paid access stays closed and checkout is not started here."
    : "Use the session-only map now; Hosted Clawd saving is not live and does not start checkout.";

  if (!atlasSaveSurfaceEnabled) {
    return {
      type: "upgradeOptions" as const,
      ...(trigger ? { trigger } : {}),
      free: {
        label: "Atlas V1",
        included: [
          "Explore the Riverside/Eastvale playable map.",
          "Open generated county maps for US counties when requested.",
          "Keep pins and notes in this chat.",
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
          "Saved business memory and campaign history are not live in this free loop.",
          "Pins and notes stay in this chat only.",
        ],
      },
      unavailableActions: [
        "Atlas does not create an account or save progress across chats in V1.",
        "Atlas does not start checkout, charge money, grant XP, collect evidence, post, message, buy ads, or run automated outreach.",
        "Lookup results are for manual review; they are not saved state, scene geometry, or coverage proof.",
      ],
      nextStep: "Use Atlas as a complete session-only map; pins and notes stay in this chat.",
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
    hostedClawd: publicHostedClawdContext(hostedClawd),
  };
}

function hostedClawdMeta(hostedClawd: HostedClawdContext): { hostedClawd: HostedClawdContext } | Record<string, never> {
  return atlasSaveSurfaceEnabled ? { hostedClawd: publicHostedClawdContext(hostedClawd) } : {};
}

function publicHostedClawdContext(context: HostedClawdContext): HostedClawdContext {
  return {
    ...context,
    statusLabel: publicHostedClawdCopy(context.statusLabel),
    primaryCopy: publicHostedClawdCopy(context.primaryCopy),
    secondaryCopy: publicHostedClawdCopy(context.secondaryCopy),
    sessionBoundary: publicHostedClawdCopy(context.sessionBoundary),
    paymentCopy: publicHostedClawdCopy(context.paymentCopy),
    billing: {
      ...context.billing,
      title: publicHostedClawdCopy(context.billing.title),
      detail: publicHostedClawdCopy(context.billing.detail),
      checkoutLabel: publicHostedClawdCopy(context.billing.checkoutLabel),
      webhookLabel: publicHostedClawdCopy(context.billing.webhookLabel),
      returnLabel: publicHostedClawdCopy(context.billing.returnLabel),
      portalLabel: publicHostedClawdCopy(context.billing.portalLabel),
    },
    primaryAction: {
      ...context.primaryAction,
      label: publicHostedClawdCopy(context.primaryAction.label),
    },
    savePreview: context.savePreview.map((item) => ({
      ...item,
      label: publicHostedClawdCopy(item.label),
      value: publicHostedClawdCopy(item.value),
    })),
    gates: context.gates.map((gate) => ({
      ...gate,
      requiredFor: publicHostedClawdCopy(gate.requiredFor),
    })),
  };
}

function publicHostedClawdCopy(value: string): string {
  return publicAtlasCopy(value)
    .replace(/\bsession Free\b/g, "Session-only map")
    .replace(/\bpreview Free\b/g, "Session-only map")
    .replace(/\bsession Invite\b/g, "Save invite")
    .replace(/\bpreview Invite\b/g, "Save invite")
    .replace(/\bsession paid\b/gi, "Paid saves")
    .replace(/\bpreview paid\b/gi, "Paid saves")
    .replace(/\bTest billing\b/g, "Billing setup")
    .replace(/\bTest-mode Checkout\b/g, "Checkout setup")
    .replace(/\bTest Checkout\b/g, "Checkout setup")
    .replace(/\btest Checkout\b/g, "checkout setup")
    .replace(/\bStripe Checkout\b/g, "Checkout")
    .replace(/\bStripe test Checkout\b/g, "checkout setup")
    .replace(/\bBilling is off in preview\./g, "Billing is not live.")
    .replace(/billing is off in session\./gi, "Billing is not live.")
    .replace(/\bexternal session promotion\b/gi, "public save promotion")
    .replace(/\bexternal preview promotion\b/gi, "public save promotion");
}

function atlasCommonsMeta(): { atlasCommons: ReturnType<AtlasCommonsService["publicMeta"]> } | Record<string, never> {
  return atlasCommonsConfig.enabled ? { atlasCommons: atlasCommonsService.publicMeta() } : {};
}

function atlasCommonsAuthFromInfo(authInfo: AuthInfo | undefined): AtlasCommonsAuthContext | undefined {
  if (!authInfo) return undefined;
  const subject = authInfo?.extra?.subject;
  if (typeof subject !== "string" || !subject.trim()) return undefined;
  const email = authInfo?.extra?.email;
  return {
    subject: subject.trim(),
    ...(typeof email === "string" && email.trim() ? { email: email.trim() } : {}),
    scopes: [...authInfo.scopes],
  };
}

function atlasCommonsMetadataUrl(): string {
  const base = process.env.APP_BASE_URL?.trim() || `http://localhost:${PORT}`;
  return new URL("/.well-known/oauth-protected-resource", base).toString();
}

function atlasCommonsToolError(error: unknown, requiredScope: string = ATLAS_COMMONS_WRITE_SCOPE) {
  const known = error instanceof AtlasCommonsError
    ? error
    : new AtlasCommonsError("COMMONS_UNAVAILABLE", "Public notes are temporarily unavailable. Private notes still work.");
  const authenticationError = known.code === "AUTH_REQUIRED" || known.code === "FORBIDDEN";
  return {
    isError: true,
    content: [{ type: "text" as const, text: known.message }],
    _meta: {
      atlasCommons: atlasCommonsService.publicMeta(),
      atlasCommonsError: { code: known.code },
      ...(authenticationError
        ? {
            "mcp/www_authenticate": [buildAuthChallengeHeader(
              atlasCommonsMetadataUrl(),
              requiredScope,
              {
                error: "insufficient_scope",
                errorDescription: "Sign in and grant the required Atlas Commons permission.",
              },
            )],
          }
        : {}),
    },
  };
}

function requiredCommonsToolString(value: string | undefined, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AtlasCommonsError("INVALID_NOTE", `${label} is required for this public-note action.`);
  }
  return value.trim();
}

function hostedClawdContextForScene(scene: ScoutPreviewState["scene"], trigger: HostedClawdContextInput["trigger"]): HostedClawdContext {
  const selectedPlace = scene.world?.places.find((place) => place.nodeId === scene.selectedNodeId) ?? scene.world?.places[0];
  return publicHostedClawdContext(hostedClawdService.getContext({
    trigger,
    countySlug: scene.county.slug,
    countyLabel: scene.county.name,
    placeLabel: selectedPlace?.label ?? scene.county.name,
  }));
}

function hostedClawdContextForScout(preview: ScoutPreviewState): HostedClawdContext {
  const selectedPlace = preview.scene.world?.places.find((place) => place.nodeId === preview.selectedNodeId) ?? preview.scene.world?.places[0];
  return publicHostedClawdContext(hostedClawdService.getContext({
    trigger: "scout_drop",
    businessType: preview.businessType,
    primaryGoal: preview.goal,
    countySlug: preview.countySlug,
    countyLabel: preview.scene.county.name,
    placeLabel: selectedPlace?.label ?? "Eastvale",
    scoutPreviewId: preview.id,
  }));
}

function hostedClawdContextForCampaign(preview: CampaignPreviewState): HostedClawdContext {
  const selectedPlace = preview.scene.world?.places.find((place) => place.nodeId === preview.selectedNodeId) ?? preview.scene.world?.places[0];
  return publicHostedClawdContext(hostedClawdService.getContext({
    trigger: "campaign_preview",
    businessType: preview.businessType,
    countySlug: preview.countySlug,
    countyLabel: preview.scene.county.name,
    placeLabel: selectedPlace?.label ?? "Eastvale",
    scoutPreviewId: preview.scoutPreviewId,
    campaignPreviewId: preview.id,
  }));
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
    // Read-only road-chunk serving routes (0.78-R2): hit/miss/latency per route.
    roadChunks: {
      ...roadChunkRouteMetrics.snapshot(),
      originConfigured: Boolean(roadChunksOrigin),
      publicOriginConfigured: Boolean(roadChunksPublicOrigin),
      localCoverageCount: loadRoadCoverageSummary().count,
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
const LEGAL_LAST_UPDATED = "2026-07-15";

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
    <p class="meta">Last updated ${LEGAL_LAST_UPDATED}. Atlas is a ChatGPT app.</p>
    ${bodyHtml}
    <p style="margin-top:2.5rem"><a href="/preview">Open Atlas</a></p>
  </body>
</html>`;
}

function privacyPageHtml(): string {
  return legalPageShell(
    "Privacy Policy",
    `<p>Atlas County Maps is a ChatGPT app for exploring U.S. county maps,
      looking up nearby places, and reading and writing short public notes about
      the places on those maps. Reading notes is open to everyone. Writing a
      note requires an Atlas identity and is currently limited to invited
      contributors.</p>
    <h2>Data Atlas processes</h2>
    <ul>
      <li>The county, Atlas place id, question text, and other tool inputs
        needed to answer your request.</li>
      <li>Map interactions such as pins and private notes. These remain in the
        current ChatGPT conversation and are never written to Atlas storage
        unless you explicitly choose to post a note publicly.</li>
      <li>For a public note you choose to post: the note text, the Atlas place
        it is attached to, a pseudonymous author label derived from your Atlas
        identity, its moderation status, reactions, reports, and the moderation
        events recorded against it.</li>
      <li>A nearby-place lookup and its normalized results when you request live
        place information.</li>
      <li>Service logs needed to run the app and prevent abuse, including
        request timing, rate-limit counters, and error records.</li>
    </ul>
    <h2>How the data is used</h2>
    <p>Atlas uses these inputs to return the requested map, place summary, or
      answer; to display and moderate public notes; to keep the service
      reliable; and to prevent abuse. Atlas does not sell personal data, serve
      ads, build advertising profiles, or use cross-site tracking.</p>
    <h2>Public notes are public</h2>
    <p>A note you post publicly is visible to anyone using Atlas, is attributed
      to your pseudonymous author label, and can be reported by other people.
      Do not put personal information, contact details, or anything you would
      not want read by a stranger into a public note.</p>
    <h2>Recipients</h2>
    <p>OpenAI processes the conversation and tool call as the ChatGPT host. When
      you request nearby places, Atlas sends the Atlas-derived area label and
      radius to Google Maps Platform. The production hosting provider processes
      the network request and stores the note database needed to run the
      service. Atlas does not send these requests to advertisers or data
      brokers.</p>
    <h2>Retention</h2>
    <ul>
      <li>Atlas has no public user accounts and no password database. Pins and
        private notes are not persisted in Atlas storage.</li>
      <li>A published public note is retained until you or a moderator remove
        it. A removed note is deleted from the readable store within 30 days.</li>
      <li>Moderation records — the note id, the action taken, the reason, and
        the timestamp — are retained for 12 months after the action so Atlas can
        handle repeat abuse and appeals. These records do not contain the note
        body after removal.</li>
      <li>Nearby-place lookups and normalized results may remain in an in-memory
        provider cache for up to 24 hours, then expire. The cache is not tied to
        an identity and is cleared when the server process restarts.</li>
      <li>Atlas does not copy conversation content into a separate analytics
        store. ChatGPT and infrastructure-provider retention follow their own
        published policies and service settings.</li>
    </ul>
    <h2>Your controls</h2>
    <p>You can use Atlas without ever posting a note, avoid the optional
      nearby-place lookup, and manage or delete the ChatGPT conversation through
      ChatGPT controls. To remove a public note you wrote, or to request
      deletion of every note tied to your Atlas identity, email the address
      below with the place and approximate posting time; Atlas removes it within
      30 days and confirms by reply. To report someone else's note, use the
      report action in the app or email the same address.</p>
    <h2>Children</h2>
    <p>Atlas is not directed to children under 13.</p>
    <h2 id="contact">Contact</h2>
    <p>Questions about this policy: <a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>.</p>`,
  );
}

function termsPageHtml(): string {
  return legalPageShell(
    "Terms of Service",
    `<p>By using Atlas County Maps you agree to these terms.</p>
    <h2>What Atlas is</h2>
    <p>Atlas is a U.S. county map inside ChatGPT with a public community-notes
      layer. Riverside/Eastvale is the interactive map. Other supported counties
      open on a real Census county outline with real town names, and their
      streets and buildings are generated illustrations rather than verified
      local coverage. Public notes are written by other people, moderated, and
      governed by the <a href="/community">Commons Community Standard</a>.</p>
    <h2>Boundaries</h2>
    <ul>
      <li>Map content outside Riverside/Eastvale is a labeled illustration. Do
        not rely on Atlas for navigation, emergency response, property
        boundaries, or any decision that needs surveyed geography.</li>
      <li>Public notes are opinions of the people who wrote them. Atlas does not
        verify them and does not endorse them.</li>
      <li>Atlas does not post on your behalf, message anyone, advertise, submit
        forms, or process payments. Atlas has no paid tier and no checkout.</li>
      <li>Private notes stay in the ChatGPT conversation. Nothing publishes
        without you explicitly choosing to post it.</li>
      <li>Nearby-place results are lookup-only and may be cached for up to 24
        hours; they do not prove map coverage.</li>
    </ul>
    <h2>Posting rules</h2>
    <ul>
      <li>Writing a public note requires an Atlas identity. Invites are issued
        by the operator and may be revoked.</li>
      <li>You keep ownership of what you write and grant Atlas the right to
        display, moderate, and remove it within the service.</li>
      <li>You are responsible for what you post. Do not post anything you do not
        have the right to share.</li>
      <li>A note that receives three reports is hidden automatically pending
        review. Moderation decisions are reviewed within 24 hours.</li>
    </ul>
    <h2>Acceptable use</h2>
    <p>Do not use Atlas for spam, scraping, harassment, doxxing, sensitive-trait
      targeting, regulated outreach, provider-data extraction, or activity that
      violates OpenAI's usage policies. The operator may remove content, revoke
      an invite, or block access to enforce these terms.</p>
    <h2>Ownership</h2>
    <p>Atlas, its map interface, and app content belong to the Atlas project or
      its licensors. You remain responsible for the ideas and materials you
      provide.</p>
    <h2>No warranty</h2>
    <p>Atlas is provided "as is" without warranties of any kind. To the maximum
      extent permitted by law, the operator is not liable for any damages arising
      from its use.</p>
    <h2 id="contact">Contact</h2>
    <p><a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>.</p>`,
  );
}

function communityPageHtml(): string {
  return legalPageShell(
    "Commons Community Standard",
    `<p>This standard governs every public note in Atlas. Anyone can read notes.
      Writing one requires an Atlas identity and an invite from the operator.
      The named moderation owner for Atlas is the operator reachable at
      <a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>, who
      reviews reported content within 24 hours.</p>
    <h2>Keep notes useful</h2>
    <p>Write short, place-specific observations that help someone understand a
      location: access, timing, wayfinding, atmosphere, or a practical local
      detail. Treat every public note as public.</p>
    <h2>Do not post</h2>
    <ul>
      <li>Personal contact details, precise routines, credentials, financial
        details, or other sensitive personal information.</li>
      <li>Hate, threats, harassment, sexual content, false accusations,
        doxxing, impersonation, or content that could put someone at risk.</li>
      <li>Spam, advertising, referral links, scams, malware, copied provider
        data, or copyrighted material you do not have permission to share.</li>
      <li>Emergency requests. Atlas Commons is not an emergency service.</li>
    </ul>
    <h2>Reports and removals</h2>
    <p>Anyone can report a visible note. Three reports hide a note automatically
      while it waits for review, so a harmful note stops being visible before a
      human sees it. Moderators may reject, hide, remove, restore, or limit
      content to enforce this standard or protect the service, and may revoke an
      author's invite. Reported content is reviewed within 24 hours.</p>
    <p>For a removal request, contact <a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>
      with the selected place and approximate posting time. Removed notes leave
      the readable store within 30 days; a moderation record without the note
      body is kept for 12 months. Do not send sensitive information by email.</p>
    <p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/support">Support</a></p>`,
  );
}

function supportPageHtml(): string {
  return legalPageShell(
    "Support",
    `<p>For help with Atlas County Maps, email
      <a href="mailto:${ATLAS_CONTACT_EMAIL}">${ATLAS_CONTACT_EMAIL}</a>.</p>
    <h2>What to include</h2>
    <ul>
      <li>The prompt or Atlas action that did not work.</li>
      <li>Whether you were using ChatGPT on web or mobile.</li>
      <li>A screenshot with private conversation details removed, if useful.</li>
    </ul>
    <p>Do not send passwords, API keys, payment details, government identifiers,
      health information, or other sensitive personal data.</p>
    <h2>Common requests</h2>
    <ul>
      <li><strong>Remove a note I wrote.</strong> Email the place and the
        approximate posting time. Removal happens within 30 days.</li>
      <li><strong>Report someone else's note.</strong> Use the report action in
        the app, or email the same details. Reports are reviewed within 24
        hours, and three reports hide a note automatically in the meantime.</li>
      <li><strong>Request an invite to post.</strong> Reading notes needs no
        account. Posting is invite-only while a single person moderates.</li>
    </ul>
    <h2>Product boundaries</h2>
    <p>Atlas has no paid tier, no checkout, and no automated outreach. Nearby-place
      lookups are read-only and may use Google Maps Platform. Map detail outside
      Riverside/Eastvale is a labeled illustration, not surveyed geography.</p>
    <p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/community">Community Standard</a></p>`,
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
  const atlasCommonsReady = await atlasCommonsReadyPayload();
  const atlasCommonsDatabaseReady = await atlasCommonsDatabaseReadyPayload();
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
    // Internal capability posture stays off the public readiness surface
    // while the save surface is closed (the submission story is session-only;
    // readiness still fails closed on DB health via `ok` above).
    ...(atlasSaveSurfaceEnabled
      ? {
          hostedClawd: {
            persistenceEnabled: hostedClawdFlags.persistenceEnabled,
            databaseConfigured: Boolean(hostedClawdDatabaseUrl),
            databaseReachable: hostedClawdDatabaseReachable,
            authConfigured: Boolean(hostedClawdAuthenticator),
            moneyEnabled: hostedClawdFlags.moneyEnabled,
            stripeConfigured: Boolean(hostedClawdBillingConfig),
          },
        }
      : {}),
    ...(atlasCommonsConfig.enabled
      ? {
          atlasCommons: {
            ...atlasCommonsService.publicMeta(),
            databaseConfigured: Boolean(hostedClawdDatabaseUrl),
            databaseReady: atlasCommonsDatabaseReady,
            ready: atlasCommonsReady,
            authConfigured: Boolean(hostedClawdAuthenticator),
            operatorConfigured: Boolean(atlasCommonsConfig.operatorToken),
          },
        }
      : {}),
    providerLookup: {
      mode: geoStatus.mode,
      googleMapsConfigured: geoStatus.googleMapsConfigured,
      liveApiCallsEnabled: geoStatus.liveApiCallsEnabled,
    },
    // National scale posture (docs/NATIONAL_SCALE.md) — boards are national;
    // roads are progressive + origin-backed when configured.
    roadChunks: {
      localCoverageCount: loadRoadCoverageSummary().count,
      originConfigured: Boolean(roadChunksOrigin),
      publicOriginConfigured: Boolean(roadChunksPublicOrigin),
      s3BucketConfigured: Boolean(roadChunksS3Bucket),
    },
    configBlockerCount: scenePacketRuntimeConfig.blockers.length,
    configBlockers: scenePacketRuntimeConfig.blockers,
  };
}

type RoadCoverageSummary = {
  version: number;
  generatedAt: string | null;
  count: number;
  counties: Array<{ slug: string; chunkCount?: number | null; band?: string | null }>;
};

function loadRoadCoverageSummary(): RoadCoverageSummary {
  const empty: RoadCoverageSummary = { version: 1, generatedAt: null, count: 0, counties: [] };
  try {
    const raw = readFileSync(resolve(ROAD_CHUNKS_DIR, "_coverage.json"), "utf8");
    const parsed = JSON.parse(raw) as Partial<RoadCoverageSummary>;
    const counties = Array.isArray(parsed.counties)
      ? parsed.counties.flatMap((raw) => {
          if (!raw || typeof raw !== "object") return [];
          const row = raw as { slug?: unknown; chunkCount?: unknown; band?: unknown };
          if (typeof row.slug !== "string") return [];
          return [
            {
              slug: row.slug,
              chunkCount: typeof row.chunkCount === "number" ? row.chunkCount : null,
              band: typeof row.band === "string" ? row.band : null,
            },
          ];
        })
      : [];
    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
      count: typeof parsed.count === "number" ? parsed.count : counties.length,
      counties,
    };
  } catch {
    return empty;
  }
}

/** Public map bootstrap — client uses publicOrigin for immutable road bytes. */
function mapConfigPayload(): Record<string, unknown> {
  const coverage = loadRoadCoverageSummary();
  return {
    ok: true,
    version: SERVER_VERSION,
    modeB: {
      nationalGeoPacks: true,
      note: "Every supported county opens as a Census board (outline, water, towns, notes).",
    },
    roadChunks: {
      publicOrigin: roadChunksPublicOrigin,
      originConfigured: Boolean(roadChunksOrigin),
      s3BucketConfigured: Boolean(roadChunksS3Bucket),
      coverageCount: coverage.count,
      coverageGeneratedAt: coverage.generatedAt,
      // Slug set only — clients skip NEAR thrash when county is absent.
      bakedSlugs: coverage.counties.map((c) => c.slug),
      progressive: true,
      honesty: "Streets are Census TIGER when baked; buildings are never claimed.",
    },
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
      jsonResponse(res, 400, { ok: false, error: "Missing county id." });
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
      jsonResponse(res, 400, { ok: false, error: "Missing county or district id." });
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

function lookupQueryForAtlasContext(countySlug = PLAYABLE_ENGINE_BETA_COUNTY_SLUG, placeId?: string): string {
  const coverage = countyCoverageForSlug(countySlug);
  if (!coverage.countyLabel || !coverage.stateCode || coverage.coverageTier === "L0_UNSUPPORTED") {
    throw new Error("Choose a county returned by Atlas before looking up nearby places.");
  }

  if (!placeId) {
    return `${coverage.countyLabel}, ${coverage.stateCode}`;
  }

  const district = coverage.districts.find((candidate) => candidate.districtSlug === placeId);
  const mapPlace =
    countySlug === PLAYABLE_ENGINE_BETA_COUNTY_SLUG
      ? compileCountyScene(countySlug, placeId).nodes.find((candidate) => candidate.id === placeId)
      : undefined;
  const placeLabel = district?.label ?? mapPlace?.label;
  if (!placeLabel) {
    throw new Error(`Choose an Atlas place id from ${coverage.countyLabel} before looking up nearby places.`);
  }

  return `${placeLabel}, ${coverage.stateCode}`;
}

function publicWorldPlaceLookup(response: WorldPlaceLookupResponse) {
  return {
    type: response.type,
    radiusMeters: response.radiusMeters,
    resolvedLocation: {
      label: response.resolvedLocation.label,
      ...(response.resolvedLocation.formattedAddress
        ? { formattedAddress: response.resolvedLocation.formattedAddress }
        : {}),
    },
    places: response.places.map((place) => ({
      id: place.id,
      label: place.label,
      category: place.category,
      ...(place.address ? { address: place.address } : {}),
      sourceNotes: place.sourceNotes.map(({ source, label, attribution }) => ({ source, label, attribution })),
    })),
  };
}

// handleScoutDrop and handleCampaignPreview were removed with their routes on
// 2026-07-25. Atlas is a map; it has no scouting or campaign product.

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
    buildAuthChallengeHeader(hostedClawdResourceMetadataUrl(req), requiredScope, {
      error: "invalid_token",
      errorDescription: "The access token is invalid or expired.",
    }),
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
        `Atlas is an atlas of the United States inside ChatGPT. It draws real US Census geography: county and state boundaries, named water, and the position of every Census town. Use open_atlas_map to show a place, search_atlas_places to find which county and state a town is in, and describe_atlas_place to answer a factual question from Census data.

Atlas covers the United States only, at the level of counties and towns. It does not do directions, travel times, businesses, addresses, postcodes, weather, or history. When someone asks for those, say Atlas does not carry that rather than answering from memory as though the map showed it.

Two honesty rules matter more than being helpful:

First, never guess a location. When a tool reports a name as ambiguous it will list the real candidates — ask which one is meant and call again with the state, rather than picking the biggest. When a tool reports a name as unresolved, say plainly that Atlas does not have that place. A confidently wrong county is the worst answer this app can give.

Second, only claim what the map draws. Most counties have real boundaries, water, and town positions but no street data; the tools say so per county. Do not describe individual roads, buildings, or businesses for a county whose streets are not mapped.

Speak in plain words. Never repeat internal codes, slugs, or field names in your prose — say "from the 2024 Census" rather than naming a data tier. Atlas has no accounts, payments, checkout, ads, messaging, or saved state; do not offer any.`,
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
          "openai/widgetDescription": atlasCommonsConfig.enabled
            ? "Shows Atlas county maps with moderated public place notes plus private notes that stay in this chat."
            : "Shows Atlas county maps: Riverside/Eastvale full clay map, plus U.S. Census geography boards (real outline, water, town names). Pins and notes stay in this chat.",
        },
      },
    ],
  }));

  // The Atlas tool surface lives in atlasTools.ts: three read-only tools over
  // Census geography, no auth and no third-party calls. The voxel-era scout,
  // campaign, upgrade, and public-note tools were retired with the 2D atlas.
  registerAtlasTools(server, {
    index: atlasIndex,
    plates: atlasPlateService,
    widgetUri: WIDGET_URI,
    countiesWithStreets: COUNTIES_WITH_STREETS,
    instrument: (tool, run) => instrumentMcpTool(tool, run),
  });

  return server;
}

function secureBearerMatches(header: string | undefined, expected: string): boolean {
  const supplied = /^Bearer\s+(.+)$/i.exec(header?.trim() ?? "")?.[1]?.trim();
  if (!supplied) return false;
  const suppliedBytes = Buffer.from(supplied, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

async function handleAtlasCommonsModeration(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!authorizeAtlasCommonsOperator(req, res)) return;

  try {
    const body = await readJsonObjectBody(req);
    const noteId = typeof body.noteId === "string" ? body.noteId.trim() : "";
    const action = body.action === "approve" || body.action === "remove" ? body.action : undefined;
    if (!noteId || !action) {
      jsonResponse(res, 422, { ok: false, error: { code: "INVALID_REQUEST", message: "noteId and approve/remove action are required." } });
      return;
    }
    const result = await atlasCommonsService.moderate(noteId, action, "atlas-operator");
    logBackendEvent("atlas_commons_moderated", {
      requestId: String(res.getHeader("x-request-id") ?? ""),
      noteId: result.noteId,
      previousStatus: result.previousStatus,
      status: result.status,
    });
    jsonResponse(res, 200, { ok: true, result });
  } catch (error) {
    const known = error instanceof AtlasCommonsError ? error : undefined;
    jsonResponse(res, known?.code === "NOTE_NOT_FOUND" ? 404 : known?.code === "INVALID_TRANSITION" ? 409 : 500, {
      ok: false,
      error: {
        code: known?.code ?? "COMMONS_UNAVAILABLE",
        message: known?.message ?? "Public-note moderation is temporarily unavailable.",
      },
    });
  }
}

async function handleAtlasCommonsModerationQueue(req: IncomingMessage, url: URL, res: ServerResponse): Promise<void> {
  if (!authorizeAtlasCommonsOperator(req, res)) return;
  const status = url.searchParams.get("status") === "removed" ? "removed" : "pending";
  const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 50;
  try {
    const result = await atlasCommonsService.listModerationQueue(status, limit);
    jsonResponse(res, 200, { ok: true, result });
  } catch (error) {
    const known = error instanceof AtlasCommonsError ? error : undefined;
    jsonResponse(res, 500, {
      ok: false,
      error: {
        code: known?.code ?? "COMMONS_UNAVAILABLE",
        message: known?.message ?? "Public-note moderation is temporarily unavailable.",
      },
    });
  }
}

function authorizeAtlasCommonsOperator(req: IncomingMessage, res: ServerResponse): boolean {
  if (!atlasCommonsConfig.enabled || !atlasCommonsConfig.operatorToken || !atlasCommonsRepository || !hostedClawdAuthenticator) {
    textResponse(res, 404, "Not Found");
    return false;
  }
  if (!secureBearerMatches(req.headers.authorization, atlasCommonsConfig.operatorToken)) {
    logBackendEvent("atlas_commons_moderation_denied", {
      requestId: String(res.getHeader("x-request-id") ?? ""),
    });
    jsonResponse(res, 401, { ok: false, error: { code: "AUTH_REQUIRED", message: "Operator credential required." } });
    return false;
  }
  return true;
}

async function atlasCommonsDatabaseReadyPayload(): Promise<boolean | null> {
  if (!atlasCommonsConfig.enabled) return null;
  if (!atlasCommonsRepository) return false;
  try {
    return await atlasCommonsRepository.health();
  } catch {
    return false;
  }
}

async function atlasCommonsReadyPayload(): Promise<boolean | null> {
  if (!atlasCommonsConfig.enabled) return null;
  try {
    return await atlasCommonsService.health();
  } catch (error) {
    logBackendEvent("atlas_commons_ready_failed", {
      message: error instanceof Error ? error.name : "unknown",
    });
    return false;
  }
}

async function attachVerifiedMcpAuth(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const header = req.headers.authorization;
  if (!header) return true;
  if (!hostedClawdAuthenticator) {
    setHostedClawdAuthChallenge(req, res, ATLAS_COMMONS_WRITE_SCOPE);
    mcpJsonRpcError(res, 401, -32001, "Bearer authentication is not configured on this Atlas server");
    return false;
  }

  const verdict = await hostedClawdAuthenticator.verifyAuthorizationHeader(header);
  if (!verdict.ok) {
    logBackendEvent("mcp_auth_denied", {
      requestId: String(res.getHeader("x-request-id") ?? ""),
      reason: verdict.reason,
    });
    setHostedClawdAuthChallenge(req, res, ATLAS_COMMONS_WRITE_SCOPE);
    mcpJsonRpcError(res, 401, -32001, "Bearer token could not be verified");
    return false;
  }

  const token = /^Bearer\s+(.+)$/i.exec(header.trim())?.[1]?.trim();
  if (!token) {
    setHostedClawdAuthChallenge(req, res, ATLAS_COMMONS_WRITE_SCOPE);
    mcpJsonRpcError(res, 401, -32001, "Bearer token is missing");
    return false;
  }

  (req as IncomingMessage & { auth?: AuthInfo }).auth = {
    token,
    clientId: "atlas-chatgpt-app",
    scopes: [...verdict.auth.scopes],
    resource: new URL(hostedClawdProtectedResourceUrl(req)),
    extra: {
      subject: verdict.auth.subject,
      ...(verdict.auth.email ? { email: verdict.auth.email } : {}),
    },
  };
  return true;
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

  if (!(await attachVerifiedMcpAuth(req, res))) return;

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
    try {
      const payload = await readyPayload();
      const status = typeof payload === "object" && payload !== null && "ok" in payload && payload.ok === true ? 200 : 503;
      jsonResponse(res, status, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logBackendEvent("ready_probe_failed", { requestId, message: message.slice(0, 160) });
      jsonResponse(res, 503, {
        ok: false,
        version: SERVER_VERSION,
        serverUp: true,
        reason: "dependency_probe_failed",
      });
    }
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

  if (url.pathname === "/.well-known/openai-apps-challenge" && req.method === "GET") {
    // OpenAI plugin domain verification: set ATLAS_OPENAI_APPS_CHALLENGE_TOKEN
    // on Railway to the portal-provided token. Response body is the token alone.
    const challengeToken = process.env.ATLAS_OPENAI_APPS_CHALLENGE_TOKEN?.trim();
    if (!challengeToken) {
      textResponse(res, 404, "Not Found");
      return;
    }
    textResponse(res, 200, challengeToken);
    return;
  }

  // Atlas plates. The widget fetches these directly rather than receiving them
  // through the MCP payload: the national plate is ~550 KB, and this project
  // has already crashed a ChatGPT session once by routing large geometry
  // through connector storage (finding G8-2). Plates are immutable per build,
  // so they carry a long cache lifetime and an ETag.
  if (url.pathname.startsWith("/api/atlas/") && (req.method === "GET" || req.method === "OPTIONS")) {
    // Inside real ChatGPT the widget runs on a per-app sandbox origin and
    // fetches these plates CROSS-ORIGIN. Without ACAO the browser discards
    // every response and the map renders as an error — the exact failure that
    // made the widget a blank screen in the first G8 session (finding G8-1),
    // reproduced here because the plate routes were added after that fix and
    // never inherited it. It does not reproduce on /preview, where the widget
    // is same-origin.
    //
    // Plates are public-domain Census geography with no user data in them, so
    // a wildcard is correct. /mcp CORS stays allowlisted.
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("cross-origin-resource-policy", "cross-origin");

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "content-type, if-none-match",
        "access-control-max-age": "86400",
      });
      res.end();
      return;
    }

    const rest = url.pathname.slice("/api/atlas/".length);
    const [kind, id] = rest.split("/");

    const result =
      kind === "nation" && !id
        ? atlasPlateService.nation()
        : kind === "state" && id
          ? atlasPlateService.state(id)
          : kind === "county" && id
            ? atlasPlateService.county(id)
            : undefined;

    if (!result) {
      jsonResponse(res, 404, { error: "Unknown atlas plate." });
      return;
    }

    const status = plateHttpStatus(result);
    if (!result.ok) {
      jsonResponse(res, status, {
        error:
          result.reason === "invalid"
            ? "That is not a valid atlas plate id."
            : result.reason === "missing"
              ? "Atlas has no plate for that place."
              : "The atlas plates have not been built on this server.",
      });
      return;
    }

    if (req.headers["if-none-match"] === result.etag) {
      res.writeHead(304, { ETag: result.etag });
      res.end();
      return;
    }

    res.setHeader("ETag", result.etag);
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    jsonResponse(res, 200, JSON.parse(result.body));
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
    // Ops stats are operator-facing. When ATLAS_OPS_TOKEN is set (production),
    // require it; when unset (local/dev), keep the endpoint open.
    const opsToken = process.env.ATLAS_OPS_TOKEN?.trim();
    if (opsToken && req.headers["x-atlas-ops-token"] !== opsToken) {
      jsonResponse(res, 401, { ok: false, error: "ops token required" });
      return;
    }
    jsonResponse(res, 200, mcpStatsPayload());
    return;
  }

  if (url.pathname === "/api/atlas-commons/moderation" && req.method === "POST") {
    await handleAtlasCommonsModeration(req, res);
    return;
  }

  if (url.pathname === "/api/atlas-commons/moderation" && req.method === "GET") {
    await handleAtlasCommonsModerationQueue(req, url, res);
    return;
  }

  // OAuth protected-resource metadata (RFC 9728) for enabled protected Atlas
  // capabilities. Commons-only staging must not request Hosted Clawd scopes.
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
      buildOAuthProtectedResourceMetadata(
        hostedClawdAuthConfig,
        hostedClawdProtectedResourceUrl(req),
        atlasCommonsConfig.enabled ? [ATLAS_COMMONS_READ_SCOPE, ATLAS_COMMONS_WRITE_SCOPE] : [],
        atlasSaveSurfaceEnabled || hostedClawdFlags.persistenceEnabled,
      ),
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

  // National map bootstrap (docs/NATIONAL_SCALE.md): publicOrigin + baked slug set.
  if (url.pathname === "/map-config" && req.method === "GET") {
    if (!(await enforceRateLimit(req, res, "road_chunks", ROAD_CHUNKS_RATE_LIMIT))) return;
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
      "cross-origin-resource-policy": "cross-origin",
    });
    res.end(JSON.stringify(mapConfigPayload()));
    return;
  }

  // Lightweight coverage index (which counties have NEAR roads published).
  if (url.pathname === "/road-coverage" && req.method === "GET") {
    if (!(await enforceRateLimit(req, res, "road_chunks", ROAD_CHUNKS_RATE_LIMIT))) return;
    const coverage = loadRoadCoverageSummary();
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
      "cross-origin-resource-policy": "cross-origin",
    });
    res.end(JSON.stringify({ ok: true, ...coverage, publicOrigin: roadChunksPublicOrigin }));
    return;
  }

  // Read-only geo-pack route (D2-0): serves the same baked pack that
  // select_county attaches inline via _meta.countyGeoPack, but as a real
  // fetchable resource so packs travel off the widget wire format. Public,
  // no auth (same class of read-only geographic data as the packs themselves);
  // slug reuses the shared guard and gets its own rate-limit bucket.
  const geoPackMatch = url.pathname.match(/^\/geo-pack\/([^/]+)$/);
  if (geoPackMatch && req.method === "GET") {
    if (!(await enforceRateLimit(req, res, "geo_pack", GEO_PACK_RATE_LIMIT))) return;
    const slug = geoPackMatch[1];
    const status = serveCountyGeoPack(res, slug, loadCountyGeoPack);
    if (status === 400) {
      // A slug reaching this route that fails the guard is a client bug or a
      // traversal probe, never a normal miss — loud-log it.
      logBackendEvent("geo_pack_route_bad_slug", { requestId, slug: String(slug).slice(0, 64) });
    }
    return;
  }

  // Road-chunk serving (0.78-R2): the atomic catalog pointer + the immutable
  // manifest and chunk resources the band controller drives. Slug-addressed to
  // match the baked fixture and the /geo-pack sibling (contract addresses by
  // geoid — deviation noted in roadChunkStore.ts). Own rate-limit bucket; the
  // four distinguished states + 400 guards live in the store's serve helpers.
  const roadCatalogMatch = url.pathname.match(/^\/road-catalog\/([^/]+)\/current$/);
  if (roadCatalogMatch && req.method === "GET") {
    if (!(await enforceRateLimit(req, res, "road_chunks", ROAD_CHUNKS_RATE_LIMIT))) return;
    const slug = roadCatalogMatch[1];
    const startedAt = Date.now();
    const status = await serveRoadCatalog(res, roadChunkStore, slug);
    roadChunkRouteMetrics.record("catalog", status, Date.now() - startedAt);
    if (status === 400) logBackendEvent("road_catalog_bad_slug", { requestId, slug: String(slug).slice(0, 64) });
    return;
  }

  // /road-chunks/<slug>/<schemaFamily>/<schemaMajor>/<packHash>/manifest.json
  const roadManifestMatch = url.pathname.match(/^\/road-chunks\/([^/]+)\/([a-z]+)\/(\d+)\/([^/]+)\/manifest\.json$/);
  if (roadManifestMatch && req.method === "GET") {
    if (!(await enforceRateLimit(req, res, "road_chunks", ROAD_CHUNKS_RATE_LIMIT))) return;
    const [, slug, schemaFamily, schemaMajor, packHash] = roadManifestMatch;
    const startedAt = Date.now();
    const status = await serveRoadManifest(res, roadChunkStore, slug, `${schemaFamily}/${schemaMajor}`, packHash, negotiatePreviewEncoding(req));
    roadChunkRouteMetrics.record("manifest", status, Date.now() - startedAt);
    if (status === 400) logBackendEvent("road_manifest_bad_param", { requestId, slug: String(slug).slice(0, 64) });
    return;
  }

  // /road-chunks/<slug>/<schemaFamily>/<schemaMajor>/<packHash>/<band>/<chunkId>.json
  const roadChunkMatch = url.pathname.match(/^\/road-chunks\/([^/]+)\/([a-z]+)\/(\d+)\/([^/]+)\/(lod0|mid|near)\/(c-?\d+_-?\d+(?:_[0-3]+)?)\.json$/);
  if (roadChunkMatch && req.method === "GET") {
    if (!(await enforceRateLimit(req, res, "road_chunks", ROAD_CHUNKS_RATE_LIMIT))) return;
    const [, slug, schemaFamily, schemaMajor, packHash, band, chunkId] = roadChunkMatch;
    const startedAt = Date.now();
    const status = await serveRoadChunk(res, roadChunkStore, slug, `${schemaFamily}/${schemaMajor}`, packHash, band as RoadBand, chunkId, negotiatePreviewEncoding(req));
    roadChunkRouteMetrics.record("chunk", status, Date.now() - startedAt);
    if (status === 400) logBackendEvent("road_chunk_bad_param", { requestId, slug: String(slug).slice(0, 64) });
    return;
  }

  // /api/scout/drop and /api/campaign/preview were removed on 2026-07-25.
  //
  // Retiring the scout and campaign MCP tools left their HTTP routes serving
  // 200 in production — a live lead-generation endpoint on a product whose
  // listing states it has no campaign features. A tool scan would not have
  // caught it, because it was never on the MCP surface. Found by QA against
  // the deployed build, which is the only place it was visible.
  if (url.pathname === "/privacy" && req.method === "GET") {
    htmlResponse(res, 200, privacyPageHtml());
    return;
  }

  if (url.pathname === "/terms" && req.method === "GET") {
    htmlResponse(res, 200, termsPageHtml());
    return;
  }

  if (url.pathname === "/community" && req.method === "GET") {
    htmlResponse(res, 200, communityPageHtml());
    return;
  }

  if (url.pathname === "/support" && req.method === "GET") {
    htmlResponse(res, 200, supportPageHtml());
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
