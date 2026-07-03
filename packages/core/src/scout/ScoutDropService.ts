import { riversideDemoVoxelScene } from "../voxel/riversideDemoScene.js";
import type { AtlasMarker, ScoutReportPanel, VoxelFlowStep, VoxelScene } from "../voxel/types.js";
import type { ScoutDropInput, ScoutPreviewState, ScoutRisk, ScoutRouteStop, ScoutSignal } from "./types.js";

const DEFAULT_GOAL = "Find the strongest first drop for a local mobile detailing offer.";

export class ScoutDropService {
  previewScoutDrop(input: Partial<ScoutDropInput> = {}): ScoutPreviewState {
    const countySlug = input.countySlug ?? "riverside-ca";
    if (countySlug !== "riverside-ca") {
      throw new Error(`Scout Drop Alpha only supports riverside-ca, received ${countySlug}.`);
    }

    const selectedNodeId = input.nodeId ?? resolveNodeId(input.locationLabel);
    const selectedNode = riversideDemoVoxelScene.nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) {
      throw new Error(`Scout Drop Alpha does not include node ${selectedNodeId}.`);
    }

    const businessType = normalizeBusinessType(input.businessType);
    const goal = input.goal?.trim() || DEFAULT_GOAL;
    const signals = buildSignals();
    const risks = buildRisks();
    const route = buildRoute();
    const budgetNote = input.budget?.trim();
    const radiusNote = input.serviceRadius?.trim();
    const bestOffer =
      "Intro mobile detail package: exterior wash, interior quick reset, and neighborhood route window.";
    const channels = [
      "QR flyer route",
      "Local Facebook group post",
      "Property manager outreach",
      "Gym/plaza partner ask",
      "Google Business Profile tune-up",
    ];
    const nextActions = [
      "Start with the Eastvale residential cluster and keep the route tight.",
      "Ask one gym/plaza partner for a QR flyer surface before running paid spend.",
      "Manually contact property managers with a resident service offer.",
      "Use Norco and Corona as the first route extension, not as separate campaigns.",
    ];
    const summary =
      `Eastvale is the best first Scout Drop for ${businessType}: strong residential demand, fast route access, and enough local surfaces for QR plus partner outreach.`;

    return {
      type: "scoutPreview",
      id: `scout-${countySlug}-${selectedNode.id}-${slugify(businessType)}`,
      countySlug,
      selectedNodeId: selectedNode.id,
      businessType,
      goal,
      summary,
      bestOffer,
      route,
      signals,
      risks,
      channels,
      nextActions,
      upgradePrompt: "Host Clawd to save the route, track follow-ups, and attach proof when the campaign starts.",
      limitations: [
        "Alpha uses curated Riverside demo signals, not live market claims.",
        "No posting, DM automation, or ad execution is performed.",
        budgetNote ? `Budget note is treated as planning context only: ${budgetNote}.` : "Budget is not spent or optimized in Alpha.",
        radiusNote ? `Service radius note is treated as planning context only: ${radiusNote}.` : "Service radius is not routed with live traffic in Alpha.",
      ],
      alphaBoundary: {
        mode: "session_only_alpha",
        savesState: false,
        executesActions: false,
        grantsXp: false,
        requiresHostedClawdForSave: true,
        nextTool: "preview_campaign_engine",
        userActionLabel: "Preview the manual campaign plan",
      },
      scene: buildScoutScene(selectedNode.id, summary, bestOffer, route, signals, risks, channels, nextActions),
    };
  }
}

export function previewScoutDrop(input: Partial<ScoutDropInput> = {}): ScoutPreviewState {
  return new ScoutDropService().previewScoutDrop(input);
}

function resolveNodeId(locationLabel: string | undefined): string {
  const normalized = locationLabel?.trim().toLowerCase() ?? "";
  if (!normalized || normalized.includes("eastvale")) return "eastvale";

  const match = riversideDemoVoxelScene.nodes.find((node) => node.label.toLowerCase() === normalized);
  return match?.id ?? "eastvale";
}

function normalizeBusinessType(value: string | undefined): string {
  const businessType = value?.trim();
  return businessType ? businessType : "mobile detailing";
}

function buildSignals(): ScoutSignal[] {
  const score = (sourceNodeIds: string[], adjustment: number) => scoreFromSceneNodes(sourceNodeIds, adjustment);

  return [
    {
      id: "residential-demand",
      label: "Residential Demand",
      detail: "Eastvale and the nearby residential cluster create enough driveway density for tight route windows.",
      score: score(["eastvale", "residential-eastvale"], 6),
      tone: "high",
      sourceNodeIds: ["eastvale", "residential-eastvale"],
    },
    {
      id: "fast-route-access",
      label: "Fast Route Access",
      detail: "Norco and Corona sit close enough to extend the first route without splitting the campaign.",
      score: score(["eastvale", "norco", "corona"], 7),
      tone: "high",
      sourceNodeIds: ["eastvale", "norco", "corona"],
    },
    {
      id: "qr-flyer-opportunity",
      label: "QR Flyer Opportunity",
      detail: "Gym and plaza traffic give the offer a physical surface before paid spend.",
      score: score(["eastvale", "gym-plaza-eastvale"], 2),
      tone: "high",
      sourceNodeIds: ["eastvale", "gym-plaza-eastvale"],
    },
    {
      id: "property-manager-outreach",
      label: "Property Manager Outreach",
      detail: "Apartment clusters support a manual property manager ask, especially for resident service days.",
      score: score(["apartment-cluster"], 4),
      tone: "medium",
      sourceNodeIds: ["apartment-cluster"],
    },
    {
      id: "partnership-target",
      label: "Partnership Target",
      detail: "The plaza can be tested as a partner channel before the route expands.",
      score: score(["gym-plaza-eastvale"], -10),
      tone: "medium",
      sourceNodeIds: ["gym-plaza-eastvale"],
    },
  ];
}

function scoreFromSceneNodes(sourceNodeIds: string[], adjustment: number): number {
  const scores = sourceNodeIds
    .map((nodeId) => riversideDemoVoxelScene.nodes.find((node) => node.id === nodeId)?.score)
    .filter((score): score is number => typeof score === "number");
  const average = scores.length > 0 ? scores.reduce((total, value) => total + value, 0) / scores.length : 70;
  return Math.max(1, Math.min(99, Math.round(average + adjustment)));
}

function buildRisks(): ScoutRisk[] {
  return [
    {
      id: "plaza-competition",
      label: "Plaza competition stack",
      severity: "medium",
      mitigation: "Lead with route convenience and neighborhood scheduling instead of generic discounting.",
    },
    {
      id: "apartment-access",
      label: "Apartment access gates",
      severity: "medium",
      mitigation: "Use property manager approval before promising apartment-day volume.",
    },
  ];
}

function buildRoute(): ScoutRouteStop[] {
  return [
    { nodeId: "eastvale", label: "Eastvale", reason: "Drop Clawd on the core residential demand node." },
    { nodeId: "residential-eastvale", label: "Residential Cluster", reason: "Qualify driveway density and willingness to pay." },
    { nodeId: "gym-plaza-eastvale", label: "Gym / Plaza", reason: "Check QR flyer and partner surface potential." },
    { nodeId: "apartment-cluster", label: "Apartment Cluster", reason: "Flag property manager outreach." },
    { nodeId: "norco", label: "Norco", reason: "Scout first route extension." },
    { nodeId: "corona", label: "Corona", reason: "Keep a second route option close, not separate." },
  ];
}

function buildScoutScene(
  selectedNodeId: string,
  summary: string,
  bestOffer: string,
  route: ScoutRouteStop[],
  signals: ScoutSignal[],
  risks: ScoutRisk[],
  channels: string[],
  nextActions: string[],
): VoxelScene {
  const routeNodeIds = route.map((stop) => stop.nodeId);
  const signalNodeIds = new Set(signals.flatMap((signal) => signal.sourceNodeIds));
  const markers: AtlasMarker[] = [
    { id: `drop-${selectedNodeId}`, nodeId: selectedNodeId, kind: "drop", label: "Scout Drop" },
    ...Array.from(signalNodeIds)
      .filter((nodeId) => nodeId !== selectedNodeId)
      .map((nodeId) => ({
        id: `signal-${nodeId}`,
        nodeId,
        kind: nodeId === "apartment-cluster" ? "risk" : "opportunity",
        label: nodeId === "apartment-cluster" ? "Access risk" : "Opportunity",
      }) satisfies AtlasMarker),
  ];

  const flow: VoxelFlowStep[] = [
    { id: "county", label: "County", status: "done" },
    { id: "drop", label: "Scout drop", status: "done" },
    { id: "report", label: "Report", status: "active" },
    { id: "campaign", label: "Campaign", status: "next" },
  ];

  const panel: ScoutReportPanel = {
    type: "scout_report",
    title: "Scout Drop Report",
    focusNodeId: selectedNodeId,
    summary,
    bestOffer,
    channels,
    risks: risks.map((risk) => `${risk.label}: ${risk.mitigation}`),
    nextActions,
    signals: signals.slice(0, 4).map((signal) => ({
      label: signal.label,
      detail: signal.detail,
      score: signal.score,
    })),
    stats: [
      { label: "Top signal", value: "Residential", tone: "good" },
      { label: "Route drag", value: "Low", tone: "good" },
      { label: "Watch", value: "Access gates", tone: "watch" },
    ],
    upgradePrompt: "Host Clawd to save this Scout Drop and track follow-ups.",
  };

  return {
    ...riversideDemoVoxelScene,
    id: "voxel-riverside-eastvale-scout-drop",
    selectedNodeId,
    markers,
    clawd: {
      nodeId: selectedNodeId,
      routeNodeIds,
      label: "Scout Drop",
      status: "reporting",
      mood: "reporting",
      pulse: true,
    },
    panel,
    flow,
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
