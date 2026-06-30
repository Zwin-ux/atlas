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
  ScoutPreviewState,
} from "./types.js";

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
    const summary =
      `Seven-day manual campaign preview for ${preview.businessType}: start with Eastvale, test QR and partner surfaces, then extend only where the route stays tight.`;
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
      scene,
    };
  }
}

export function previewCampaignFromScout(preview: ScoutPreviewState): CampaignPreviewState {
  return new CampaignPreviewService().previewCampaignFromScout(preview);
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
  const first = route[0]?.nodeId ?? preview.selectedNodeId;
  const residential = route.find((stop) => stop.nodeId === "residential-eastvale")?.nodeId ?? first;
  const plaza = route.find((stop) => stop.nodeId === "gym-plaza-eastvale")?.nodeId ?? first;
  const apartment = route.find((stop) => stop.nodeId === "apartment-cluster")?.nodeId ?? first;
  const extension = route.filter((stop) => stop.nodeId === "norco" || stop.nodeId === "corona").map((stop) => stop.nodeId);

  return [
    {
      day: 1,
      label: "Route proof",
      focus: "Lock the Eastvale offer and route window.",
      channel: "qr_flyer",
      routeNodeIds: [first, residential],
      steps: [
        "Print a small QR flyer batch tied to the intro mobile detail package.",
        "Walk the Eastvale residential cluster and mark usable driveway-density blocks.",
        "Capture proof notes: visible parking density, route friction, and any gated access.",
      ],
      proof: "Route notes plus one photo of the QR flyer in context.",
    },
    {
      day: 2,
      label: "Residential ask",
      focus: "Test the neighborhood message before spending.",
      channel: "local_group",
      routeNodeIds: [first, residential],
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
      routeNodeIds: [plaza],
      steps: [
        "Visit the gym/plaza and ask one manager for a QR flyer surface.",
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
      routeNodeIds: [apartment],
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
      routeNodeIds: [first],
      steps: [
        "Update service wording to match the Eastvale route and intro offer.",
        "Add a short booking note that explains the route window.",
        "Do not claim reviews, rankings, or availability the business cannot support.",
      ],
      proof: "Profile copy checklist ready for owner approval.",
    },
    {
      day: 6,
      label: "Route extension",
      focus: "Use Norco and Corona only if Eastvale response is real.",
      channel: "qr_flyer",
      routeNodeIds: extension.length > 0 ? extension : [first],
      steps: [
        "Review Eastvale responses before extending the route.",
        "If response is weak, tighten the Eastvale offer instead of adding territory.",
        "If response is strong, scout Norco and Corona as one extension route.",
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
  return [
    {
      id: "qr-flyer-eastvale",
      label: "Eastvale QR flyer",
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
  const campaignMarkers: AtlasMarker[] = [
    ...preview.scene.markers,
    { id: "campaign-eastvale", nodeId: preview.selectedNodeId, kind: "drop", label: "Campaign launch" },
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
      { label: "First route", value: "Eastvale", tone: "neutral" },
    ],
    upgradePrompt: "Host Clawd to save this campaign, attach proof, and track follow-ups.",
  };

  return {
    ...preview.scene,
    id: "voxel-riverside-eastvale-campaign-preview",
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
