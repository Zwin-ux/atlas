import type {
  AtlasMarker,
  CampaignPreviewPanel,
  VoxelFlowStep,
  VoxelScene,
} from "../voxel/types.js";
import type {
  CampaignAssetPlaceholder,
  CampaignDayPlan,
  CampaignPreviewState,
  CampaignRoutePriority,
  ScoutDropInput,
  ScoutPreviewState,
  ScoutRouteStop,
} from "./types.js";
import { previewScoutDrop } from "./ScoutDropService.js";

export class CampaignPreviewService {
  previewCampaignFromScout(preview: ScoutPreviewState): CampaignPreviewState {
    const routePriorities = buildRoutePriorities(preview);
    const days = buildSevenDayPlan(preview);
    const assetPlaceholders = buildAssetPlaceholders(preview);
    const guardrails = [
      "Manual preview only: no posts, DMs, paid ads, or outreach are sent.",
      "Use local rules and group guidelines before sharing any post draft.",
      "Confirm property manager permission before promising apartment service days.",
      "Treat budget and radius notes as planning context, not spend instructions.",
    ];
    const firstRouteLabel = firstRouteStop(preview).label;
    const countyLabel = preview.scene.county.name;
    const summary =
      `Seven-day manual campaign preview for ${preview.businessType}: start with ${firstRouteLabel} in ${countyLabel}, test QR and partner surfaces, then extend only where the route stays tight.`;
    const offer = preview.bestOffer;
    const scene = buildCampaignScene(preview, summary, offer, days, routePriorities, assetPlaceholders, guardrails);

    return {
      type: "campaignPreview",
      id: `campaign-${preview.id.replace(/^scout-/, "")}`,
      scoutPreviewId: preview.id,
      countySlug: preview.countySlug,
      selectedNodeId: preview.selectedNodeId,
      businessType: preview.businessType,
      summary,
      offer,
      days,
      routePriorities,
      assetPlaceholders,
      guardrails,
      alphaBoundary: {
        mode: "session_only_alpha",
        savesState: false,
        executesActions: false,
        grantsXp: false,
        requiresHostedClawdForSave: true,
        nextTool: "get_upgrade_options",
        userActionLabel: "Review Alpha limits",
      },
      scene,
    };
  }
}

export function previewCampaignFromScout(preview: ScoutPreviewState): CampaignPreviewState {
  return new CampaignPreviewService().previewCampaignFromScout(preview);
}

export type CampaignPreviewRequest = Partial<ScoutDropInput> & {
  scoutPreviewId?: string;
};

export function previewCampaignFromScoutRequest(input: CampaignPreviewRequest): {
  scoutPreview: ScoutPreviewState;
  campaignPreview: CampaignPreviewState;
  rebuiltScoutPreview: boolean;
} {
  const scoutPreview = previewScoutDrop(input);
  const campaignPreview = previewCampaignFromScout(scoutPreview);
  const rebuiltScoutPreview = Boolean(input.scoutPreviewId && input.scoutPreviewId !== scoutPreview.id);

  return {
    scoutPreview,
    campaignPreview: rebuiltScoutPreview ? { ...campaignPreview, continuityNote: "rebuilt scout preview" } : campaignPreview,
    rebuiltScoutPreview,
  };
}

function buildRoutePriorities(preview: ScoutPreviewState): CampaignRoutePriority[] {
  return preview.route.map((stop, index) => ({
    nodeId: stop.nodeId,
    label: stop.label,
    priority: index + 1,
    reason:
      index === 0
        ? "Primary drop zone: use this as the first proof point before expanding."
        : stop.reason,
  }));
}

function buildSevenDayPlan(preview: ScoutPreviewState): CampaignDayPlan[] {
  const route = preview.route;
  const first = firstRouteStop(preview);
  const residential = route.find((stop, index) => index > 0 && /resident|home|density|neighborhood/i.test(`${stop.label} ${stop.reason}`)) ?? first;
  const plaza = route.find((stop, index) => index > 0 && /plaza|partner|qr|surface|gym/i.test(`${stop.label} ${stop.reason}`)) ?? first;
  const apartment = route.find((stop, index) => index > 0 && /access|property|apartment|permission/i.test(`${stop.label} ${stop.reason}`)) ?? residential;
  const extension = route
    .filter((stop, index) => index > 0 && /extension|route|edge|corridor/i.test(`${stop.label} ${stop.reason}`))
    .map((stop) => stop.nodeId);

  return [
    {
      day: 1,
      label: "Route proof",
      focus: `Lock the ${first.label} offer and route window.`,
      channel: "qr_flyer",
      routeNodeIds: [first.nodeId, residential.nodeId],
      steps: [
        `Print a small QR flyer batch tied to the ${preview.businessType} offer.`,
        `Walk ${residential.label} and mark usable route-density blocks.`,
        "Capture proof notes: visible parking density, route friction, and any gated access.",
      ],
      proof: "Route notes plus one photo of the QR flyer in context.",
    },
    {
      day: 2,
      label: "Residential ask",
      focus: "Test the neighborhood message before spending.",
      channel: "local_group",
      routeNodeIds: [first.nodeId, residential.nodeId],
      steps: [
        "Draft one local group post that names the offer, route window, and booking limit.",
        "Ask for permission where group rules require it; do not auto-post.",
        "Track comments and questions manually in the campaign notes.",
      ],
      proof: "Approved post draft or moderation note.",
    },
    {
      day: 3,
      label: "Plaza surface",
      focus: "Ask for one physical partner surface.",
      channel: "partner",
      routeNodeIds: [plaza.nodeId],
      steps: [
        `Visit ${plaza.label} and ask one manager for a QR flyer surface.`,
        "Use the same intro offer; do not create a separate discount.",
        "Log the contact name, permission status, and preferred follow-up day.",
      ],
      proof: "Partner ask outcome and flyer surface status.",
    },
    {
      day: 4,
      label: "Apartment gate",
      focus: "Validate property manager access before promising volume.",
      channel: "property_manager",
      routeNodeIds: [apartment.nodeId],
      steps: [
        "Send or hand-deliver a short resident service-day ask to one property manager.",
        "Ask about gate rules, water/power constraints, and resident communication limits.",
        "Stop if permission is unclear; keep the route focused on residential and plaza surfaces.",
      ],
      proof: "Property manager checklist with approval, decline, or follow-up date.",
    },
    {
      day: 5,
      label: "Profile tune-up",
      focus: "Make the Google profile support the manual route.",
      channel: "google_profile",
      routeNodeIds: [first.nodeId],
      steps: [
        `Update service wording to match the ${first.label} route and intro offer.`,
        "Add a short booking note that explains the route window.",
        "Do not claim reviews, rankings, or availability the business cannot support.",
      ],
      proof: "Profile copy checklist ready for owner approval.",
    },
    {
      day: 6,
      label: "Route extension",
      focus: `Use nearby route extensions only if ${first.label} response is real.`,
      channel: "qr_flyer",
      routeNodeIds: extension.length > 0 ? extension : [first.nodeId],
      steps: [
        `Review ${first.label} responses before extending the route.`,
        `If response is weak, tighten the ${first.label} offer instead of adding territory.`,
        "If response is strong, scout one nearby extension route manually.",
      ],
      proof: "Go/no-go note for route extension.",
    },
    {
      day: 7,
      label: "Review and next drop",
      focus: "Decide whether the first drop earned a second week.",
      channel: "property_manager",
      routeNodeIds: route.slice(0, 4).map((stop) => stop.nodeId),
      steps: [
        "Review QR scans, direct replies, partner response, and property manager outcome.",
        "Pick one channel to repeat and one channel to pause.",
        "Write the next Scout Drop question before changing the offer.",
      ],
      proof: "Manual scorecard with repeat, pause, and next-drop decisions.",
    },
  ];
}

function buildAssetPlaceholders(preview: ScoutPreviewState): CampaignAssetPlaceholder[] {
  const first = firstRouteStop(preview).label;
  return [
    {
      id: `qr-flyer-${slugify(first)}`,
      label: `${first} QR flyer`,
      channel: "qr_flyer",
      format: "qr_flyer",
      copyIntent: `One-page flyer for ${preview.bestOffer}`,
    },
    {
      id: "local-group-post",
      label: "Local group post draft",
      channel: "local_group",
      format: "post_draft",
      copyIntent: "Short permission-safe post with route window and booking limit.",
    },
    {
      id: "property-manager-script",
      label: "Property manager ask",
      channel: "property_manager",
      format: "outreach_script",
      copyIntent: "Resident service-day ask that checks access rules first.",
    },
    {
      id: "partner-checklist",
      label: "Gym/plaza partner checklist",
      channel: "partner",
      format: "checklist",
      copyIntent: "In-person ask checklist for QR flyer surface approval.",
    },
    {
      id: "gbp-copy-checklist",
      label: "Google profile tune-up",
      channel: "google_profile",
      format: "profile_update",
      copyIntent: "Owner-approved service wording that matches the manual route.",
    },
  ];
}

function buildCampaignScene(
  preview: ScoutPreviewState,
  summary: string,
  offer: string,
  days: CampaignDayPlan[],
  routePriorities: CampaignRoutePriority[],
  assetPlaceholders: CampaignAssetPlaceholder[],
  guardrails: string[],
): VoxelScene {
  const routeNodeIds = routePriorities.map((priority) => priority.nodeId);
  const first = firstRouteStop(preview).label;
  const campaignMarkers: AtlasMarker[] = [
    ...preview.scene.markers,
    { id: `campaign-${slugify(first)}`, nodeId: preview.selectedNodeId, kind: "drop", label: "Campaign launch" },
  ];
  const flow: VoxelFlowStep[] = [
    { id: "county", label: "County", status: "done" },
    { id: "drop", label: "Scout drop", status: "done" },
    { id: "report", label: "Report", status: "done" },
    { id: "campaign", label: "Campaign", status: "active" },
  ];
  const panel: CampaignPreviewPanel = {
    type: "campaign_preview",
    title: "Manual Campaign Preview",
    focusNodeId: preview.selectedNodeId,
    summary,
    offer,
    days,
    routePriorities,
    assetPlaceholders,
    guardrails,
    stats: [
      { label: "Plan length", value: "7 days", tone: "good" },
      { label: "Automation", value: "None", tone: "good" },
      { label: "First route", value: first, tone: "neutral" },
    ],
    upgradePrompt: "This campaign preview stays in this chat.",
  };

  return {
    ...preview.scene,
    id: campaignSceneId(preview),
    selectedNodeId: preview.selectedNodeId,
    markers: campaignMarkers,
    clawd: {
      nodeId: preview.selectedNodeId,
      routeNodeIds,
      label: "Campaign Route",
      status: "reporting",
      mood: "reporting",
      pulse: true,
    },
    panel,
    flow,
  };
}

function firstRouteStop(preview: ScoutPreviewState): ScoutRouteStop {
  return preview.route[0] ?? { nodeId: preview.selectedNodeId, label: preview.selectedNodeId, reason: "Primary Scout Drop." };
}

function campaignSceneId(preview: ScoutPreviewState): string {
  if (preview.countySlug === "riverside-ca" && preview.selectedNodeId === "eastvale") {
    return "voxel-riverside-eastvale-campaign-preview";
  }
  return `voxel-${preview.countySlug}-${slugify(firstRouteStop(preview).label)}-campaign-preview`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
