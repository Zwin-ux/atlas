import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { previewCampaignFromScout, previewScoutDrop, type CampaignPreviewState, type ScoutPreviewState } from "@atlas/core/scout";
import { riversideDemoVoxelScene } from "@atlas/core/voxel";
import { createGeoDataAdapter, isGoogleMapsConfigured, readGeoAdapterConfig } from "@atlas/geo";
import { z } from "zod";

const SERVER_VERSION = "0.1.0";
const WIDGET_URI = "ui://widget/atlas-board-v2.html";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");

loadLocalEnv();

const WEB_DIST = resolve(ROOT_DIR, "web/dist");
const PORT = Number(process.env.PORT ?? 8787);
const MCP_PATH = process.env.MCP_PATH ?? "/mcp";

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
  nodeCount: number;
  routeNodeIds: string[];
  flow: ScoutPreviewState["scene"]["flow"];
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
  kind: z.enum(["home", "plaza", "road", "freeway", "warehouse", "qr_surface", "risk_gate", "drop_zone", "scout_marker"]),
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
  nodeCount: z.number(),
  routeNodeIds: z.array(z.string()),
  flow: z.array(flowStepSchema),
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
    nodeCount: scene.nodes.length,
    routeNodeIds: scene.clawd.routeNodeIds,
    flow: scene.flow,
  };
}

function upgradeOptionsStructuredContent(trigger?: string) {
  return {
    type: "upgradeOptions" as const,
    ...(trigger ? { trigger } : {}),
    free: {
      label: "Clawd Companion",
      included: [
        "Explore the Riverside voxel board.",
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

function readBuiltWidget(): string {
  const jsPath = resolve(WEB_DIST, "component.js");
  const cssPath = resolve(WEB_DIST, "component.css");

  if (!existsSync(jsPath) || !existsSync(cssPath)) {
    throw new Error("Widget bundle not found. Run `pnpm build:web` before starting the MCP server.");
  }

  const js = readFileSync(jsPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  return `
<div id="root"></div>
<style>${css}</style>
<script type="module">${js}</script>
`.trim();
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
        "Use render_voxel_county to show the Atlas board. Use preview_scout_drop when the user asks to drop Clawd or scout a local business opportunity. Use preview_campaign_engine only after a Scout Drop exists and the user asks for a manual campaign preview. Use get_upgrade_options for Hosted Clawd limits. Keep structuredContent concise. Do not claim persistence, posting, DMs, paid ads, automation, or live market research in Alpha.",
    },
  );

  registerAppResource(server, "atlas-board-widget", WIDGET_URI, {}, async () => ({
    contents: [
      {
        uri: WIDGET_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: readBuiltWidget(),
        _meta: {
          ui: {
            prefersBorder: true,
            ...(process.env.WIDGET_DOMAIN ? { domain: process.env.WIDGET_DOMAIN } : {}),
            csp: {
              connectDomains: [],
              resourceDomains: [],
            },
          },
          "openai/widgetDescription": "Shows the Atlas Riverside voxel county board with Eastvale scout signals and campaign flow.",
        },
      },
    ],
  }));

  registerAppTool(
    server,
    "render_voxel_county",
    {
      title: "Render voxel county",
      description: "Render the Riverside County voxel board for the Atlas Alpha demo.",
      inputSchema: {
        countySlug: z.string().optional(),
        selectedNodeId: z.string().optional(),
      },
      outputSchema: voxelSceneSummaryOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI },
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Opening county board...",
        "openai/toolInvocation/invoked": "County board ready.",
      },
    },
    async ({ countySlug, selectedNodeId }) => {
      const scene = {
        ...riversideDemoVoxelScene,
        selectedNodeId: selectedNodeId ?? riversideDemoVoxelScene.selectedNodeId,
      };
      return {
        structuredContent: voxelSceneStructuredContent(scene),
        _meta: {
          scene,
        },
        content: [
          {
            type: "text" as const,
            text: `Showing ${countySlug ?? scene.county.slug} voxel county board.`,
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
            text: `${preview.summary} Best offer: ${preview.bestOffer}`,
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
            text: `${campaignPreview.summary} This is a manual preview only; no posting, messaging, ad spend, or persistence is performed.`,
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

  if (url.pathname === "/api/geo/status" && req.method === "GET") {
    jsonResponse(res, 200, geoStatusPayload());
    return;
  }

  if (url.pathname === "/api/geo/geocode" && req.method === "GET") {
    await handleGeoGeocode(url, res);
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

  if (url.pathname === "/preview" && req.method === "GET") {
    try {
      htmlResponse(res, 200, readBuiltWidget());
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
