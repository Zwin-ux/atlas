import { riversideDemoVoxelScene } from "../voxel/riversideDemoScene.js";
import type {
  AtlasMarker,
  AtlasNode,
  ScoutReportPanel,
  VoxelFlowStep,
  VoxelPlace,
  VoxelScene,
  VoxelWorldNode,
} from "../voxel/types.js";
import type { ScoutDropInput, ScoutPreviewState, ScoutRisk, ScoutRouteStop, ScoutSignal } from "./types.js";

const DEFAULT_COUNTY_SLUG = "riverside-ca";
const DEFAULT_BUSINESS_TYPE = "mobile detailing";

type ScoutSceneContext = {
  countySlug: string;
  countyLabel: string;
  selectedNodeId: string;
  selectedLabel: string;
  scene: VoxelScene;
  source: "curated" | "synthetic";
  places: VoxelPlace[];
  selectedPlace?: VoxelPlace;
};

export class ScoutDropService {
  previewScoutDrop(input: Partial<ScoutDropInput> = {}): ScoutPreviewState {
    const countySlug = normalizeCountySlug(input.countySlug);
    const businessType = normalizeBusinessType(input.businessType);
    const goal = input.goal?.trim() || defaultGoalForBusiness(businessType);
    const context = buildScoutContext({
      countySlug,
      nodeId: input.nodeId,
      locationLabel: input.locationLabel,
    });
    const signals = buildSignals(context);
    const risks = buildRisks(context);
    const route = buildRoute(context, businessType);
    const budgetNote = input.budget?.trim();
    const radiusNote = input.serviceRadius?.trim();
    const bestOffer =
      `${sentenceCase(businessType)} starter offer for ${context.selectedLabel}: one clear service window, owner-approved copy, and a manual route note for ${context.countyLabel}.`;
    const channels = [
      "QR flyer route",
      "Local group post",
      "Property manager outreach",
      "Partner surface ask",
      "Google profile wording",
    ];
    const nextActions = buildNextActions(context, route, businessType);
    const summary =
      `${context.selectedLabel} in ${context.countyLabel} is the first Scout Drop for ${businessType}: use the visible place mix, route friction, and manual outreach surfaces as a session-only planning preview.`;

    return {
      type: "scoutPreview",
      id: `scout-${countySlug}-${context.selectedNodeId}-${slugify(businessType)}`,
      countySlug,
      selectedNodeId: context.selectedNodeId,
      businessType,
      goal,
      summary,
      bestOffer,
      route,
      signals,
      risks,
      channels,
      nextActions,
      upgradePrompt: "This Scout Drop stays in this chat.",
      limitations: [
        context.source === "curated"
          ? `Session-only Alpha preview using curated ${context.countyLabel} scene signals and template planning logic, not live market claims.`
          : `Session-only Alpha preview using requested ${context.countyLabel} and ${context.selectedLabel} labels with synthetic template signals, not live coverage or market proof.`,
        "No posting, DM automation, ad execution, saved state, evidence, or XP is performed.",
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
      scene: buildScoutScene(context, summary, bestOffer, route, signals, risks, channels, nextActions),
    };
  }
}

export function previewScoutDrop(input: Partial<ScoutDropInput> = {}): ScoutPreviewState {
  return new ScoutDropService().previewScoutDrop(input);
}

function buildScoutContext(input: {
  countySlug: string;
  nodeId?: string | undefined;
  locationLabel?: string | undefined;
}): ScoutSceneContext {
  if (input.countySlug === DEFAULT_COUNTY_SLUG) {
    return buildCuratedRiversideContext(input.nodeId, input.locationLabel);
  }

  const countyLabel = countyLabelFromSlug(input.countySlug);
  const selectedLabel = cleanLabel(input.locationLabel) ?? nodeLabelFromId(input.nodeId) ?? defaultPlaceLabel(countyLabel);
  const selectedNodeId = slugOrFallback(input.nodeId ?? selectedLabel, "requested-place");
  const scene = buildSyntheticScoutScene({
    countySlug: input.countySlug,
    countyLabel,
    selectedNodeId,
    selectedLabel,
  });
  const places = scene.world?.places ?? [];
  const selectedPlace = places.find((place) => place.nodeId === selectedNodeId);

  return {
    countySlug: input.countySlug,
    countyLabel,
    selectedNodeId,
    selectedLabel,
    scene,
    source: "synthetic",
    places,
    ...(selectedPlace ? { selectedPlace } : {}),
  };
}

function buildCuratedRiversideContext(nodeId: string | undefined, locationLabel: string | undefined): ScoutSceneContext {
  const selectedNodeId = resolveRiversideNodeId(nodeId, locationLabel);
  const selectedNode = riversideDemoVoxelScene.nodes.find((node) => node.id === selectedNodeId) ?? riversideDemoVoxelScene.nodes[0];
  const places = riversideDemoVoxelScene.world?.places ?? [];
  const selectedPlace = places.find((place) => place.nodeId === selectedNode?.id);
  const selectedLabel = cleanLabel(locationLabel) ?? selectedNode?.label ?? "Eastvale";

  return {
    countySlug: DEFAULT_COUNTY_SLUG,
    countyLabel: riversideDemoVoxelScene.county.name,
    selectedNodeId: selectedNode?.id ?? "eastvale",
    selectedLabel,
    scene: riversideDemoVoxelScene,
    source: "curated",
    places,
    ...(selectedPlace ? { selectedPlace } : {}),
  };
}

function resolveRiversideNodeId(nodeId: string | undefined, locationLabel: string | undefined): string {
  const explicitNode = nodeId?.trim();
  if (explicitNode && riversideDemoVoxelScene.nodes.some((node) => node.id === explicitNode)) return explicitNode;

  const normalized = locationLabel?.trim().toLowerCase() ?? "";
  if (!normalized || normalized.includes("eastvale")) return "eastvale";

  const placeMatch = riversideDemoVoxelScene.world?.places.find(
    (place) => place.label.toLowerCase() === normalized || place.id.toLowerCase() === normalized,
  );
  if (placeMatch) return placeMatch.nodeId;

  const nodeMatch = riversideDemoVoxelScene.nodes.find(
    (node) => node.label.toLowerCase() === normalized || node.id.toLowerCase() === normalized,
  );
  return nodeMatch?.id ?? "eastvale";
}

function normalizeCountySlug(value: string | undefined): string {
  const countySlug = value?.trim().toLowerCase();
  return countySlug ? countySlug : DEFAULT_COUNTY_SLUG;
}

function normalizeBusinessType(value: string | undefined): string {
  const businessType = value?.trim();
  return businessType ? businessType : DEFAULT_BUSINESS_TYPE;
}

function defaultGoalForBusiness(businessType: string): string {
  return `Find the strongest first drop for a local ${businessType} offer.`;
}

function buildSignals(context: ScoutSceneContext): ScoutSignal[] {
  const selected = context.selectedPlace ? [context.selectedPlace] : [];
  const homePlaces = context.places.filter((place) => place.kind === "home_area");
  const plazaPlaces = context.places.filter((place) => place.kind === "plaza" || place.kind === "shop");
  const routePlaces = context.places.filter((place) => place.kind === "road");
  const partnerPlaces = context.places.filter((place) => place.kind === "plaza" || place.kind === "landmark" || place.kind === "park");

  return [
    {
      id: "residential-demand",
      label: "Residential Demand",
      detail: residentialDemandDetail(context, homePlaces),
      score: scoreFromPlaces([...selected, ...homePlaces], 6),
      tone: toneFromScore(scoreFromPlaces([...selected, ...homePlaces], 6)),
      sourceNodeIds: sourceNodeIds([...selected, ...homePlaces], context.selectedNodeId),
    },
    {
      id: "fast-route-access",
      label: "Fast Route Access",
      detail: `${labelList(routePlaces, context.selectedLabel)} keeps the preview framed as one manual route before any territory expansion.`,
      score: scoreFromPlaces([...selected, ...routePlaces], 7),
      tone: toneFromScore(scoreFromPlaces([...selected, ...routePlaces], 7)),
      sourceNodeIds: sourceNodeIds([...selected, ...routePlaces], context.selectedNodeId),
    },
    {
      id: "qr-flyer-opportunity",
      label: "QR Flyer Opportunity",
      detail: `${labelList(partnerPlaces, context.selectedLabel)} gives the offer a physical surface to test before paid spend.`,
      score: scoreFromPlaces(partnerPlaces.length > 0 ? partnerPlaces : selected, 2),
      tone: toneFromScore(scoreFromPlaces(partnerPlaces.length > 0 ? partnerPlaces : selected, 2)),
      sourceNodeIds: sourceNodeIds(partnerPlaces.length > 0 ? partnerPlaces : selected, context.selectedNodeId),
    },
    {
      id: "property-manager-outreach",
      label: "Property Manager Outreach",
      detail: `${labelList(homePlaces, context.selectedLabel)} supports a manual property or resident-service ask with permission checked first.`,
      score: scoreFromPlaces(homePlaces.length > 0 ? homePlaces : selected, -2),
      tone: "medium",
      sourceNodeIds: sourceNodeIds(homePlaces.length > 0 ? homePlaces : selected, context.selectedNodeId),
    },
    {
      id: "partnership-target",
      label: "Partnership Target",
      detail: `${labelList(plazaPlaces.length > 0 ? plazaPlaces : partnerPlaces, context.selectedLabel)} can be tested as a partner channel before the route expands.`,
      score: scoreFromPlaces(plazaPlaces.length > 0 ? plazaPlaces : partnerPlaces, -8),
      tone: "medium",
      sourceNodeIds: sourceNodeIds(plazaPlaces.length > 0 ? plazaPlaces : partnerPlaces, context.selectedNodeId),
    },
  ];
}

function buildRisks(context: ScoutSceneContext): ScoutRisk[] {
  return [
    {
      id: "permission-check",
      label: "Permission check",
      severity: "medium",
      mitigation: `Use owner, group, and property approval before placing or sending anything around ${context.selectedLabel}.`,
    },
    {
      id: "synthetic-boundary",
      label: context.source === "curated" ? "Live-market boundary" : "Synthetic preview boundary",
      severity: context.source === "curated" ? "medium" : "low",
      mitigation:
        context.source === "curated"
          ? `${context.countyLabel} Scout Drops use curated scene signals and do not prove live demand.`
          : `${context.countyLabel} Scout Drops outside curated Riverside are template previews, not playable local coverage.`,
    },
  ];
}

function buildRoute(context: ScoutSceneContext, businessType: string): ScoutRouteStop[] {
  const route: ScoutRouteStop[] = [
    {
      nodeId: context.selectedNodeId,
      label: context.selectedLabel,
      reason: `Drop Clawd here as the first ${businessType} proof point in ${context.countyLabel}.`,
    },
  ];
  const homePlace = context.places.find((place) => place.kind === "home_area" && place.nodeId !== context.selectedNodeId);
  const plazaPlace = context.places.find((place) => (place.kind === "plaza" || place.kind === "shop") && place.nodeId !== context.selectedNodeId);
  const landmarkPlace = context.places.find((place) => place.kind === "landmark" && place.nodeId !== context.selectedNodeId);
  const roadPlace = context.places.find((place) => place.kind === "road" && place.nodeId !== context.selectedNodeId);
  const parkPlace = context.places.find((place) => place.kind === "park" && place.nodeId !== context.selectedNodeId);

  pushRouteStop(route, homePlace, "Qualify resident-facing density and willingness to respond.");
  pushRouteStop(route, plazaPlace ?? landmarkPlace, "Check QR flyer, partner, or errand-overlap surface potential.");
  pushRouteStop(route, context.places.find((place) => place.kind === "home_area" && place.nodeId !== homePlace?.nodeId), "Flag property or access rules before promising volume.");
  pushRouteStop(route, roadPlace, "Scout the first route extension without splitting the campaign.");
  pushRouteStop(route, parkPlace, "Keep a secondary community surface as a low-pressure manual test.");

  return route.slice(0, 6);
}

function pushRouteStop(route: ScoutRouteStop[], place: VoxelPlace | undefined, reason: string): void {
  if (!place || route.some((stop) => stop.nodeId === place.nodeId)) return;
  route.push({ nodeId: place.nodeId, label: place.label, reason });
}

function buildNextActions(context: ScoutSceneContext, route: ScoutRouteStop[], businessType: string): string[] {
  const secondStop = route[1]?.label ?? context.selectedLabel;
  const partnerStop = route.find((stop) => /plaza|gym|park|partner|surface/i.test(`${stop.label} ${stop.reason}`))?.label ?? context.selectedLabel;
  const extensionStop = route[3]?.label ?? route.at(-1)?.label ?? context.selectedLabel;

  return [
    `Start at ${context.selectedLabel} and keep the first ${businessType} route inside ${context.countyLabel}.`,
    `Use ${secondStop} to collect one manual route note before changing the offer.`,
    `Ask one ${partnerStop} contact for a permission-safe QR or partner surface before paid spend.`,
    `Treat ${extensionStop} as the first extension only after the initial route response is real.`,
  ];
}

function buildScoutScene(
  context: ScoutSceneContext,
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
    { id: `drop-${context.selectedNodeId}`, nodeId: context.selectedNodeId, kind: "drop", label: "Scout Drop" },
    ...Array.from(signalNodeIds)
      .filter((nodeId) => nodeId !== context.selectedNodeId)
      .map((nodeId) => ({
        id: `signal-${nodeId}`,
        nodeId,
        kind: /access|home|apartment/i.test(nodeId) ? "risk" : "opportunity",
        label: /access|home|apartment/i.test(nodeId) ? "Permission check" : "Opportunity",
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
    focusNodeId: context.selectedNodeId,
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
      { label: "Top signal", value: shortStatValue(signals[0]?.label ?? "Route"), tone: "good" },
      { label: "Route drag", value: "Manual", tone: "neutral" },
      { label: "Watch", value: context.source === "curated" ? "Live demand" : "Synthetic", tone: "watch" },
    ],
    upgradePrompt: "This Scout Drop stays in this chat.",
  };

  return {
    ...context.scene,
    id: scoutSceneId(context),
    selectedNodeId: context.selectedNodeId,
    markers,
    camera: {
      focusNodeId: context.selectedNodeId,
      initialZoom: context.scene.camera?.initialZoom ?? 1,
      minZoom: context.scene.camera?.minZoom ?? 0.82,
      maxZoom: context.scene.camera?.maxZoom ?? 1.34,
    },
    clawd: {
      nodeId: context.selectedNodeId,
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

function buildSyntheticScoutScene(input: {
  countySlug: string;
  countyLabel: string;
  selectedNodeId: string;
  selectedLabel: string;
}): VoxelScene {
  const selectedSlug = slugOrFallback(input.selectedLabel, "requested-place");
  const homeNodeId = `${selectedSlug}-home-area`;
  const plazaNodeId = `${selectedSlug}-plaza`;
  const accessNodeId = `${selectedSlug}-access`;
  const routeNodeId = `${selectedSlug}-route`;
  const parkNodeId = `${selectedSlug}-park`;
  const districtId = `${selectedSlug}-district`;
  const stateCode = stateFromCountySlug(input.countySlug);
  const stateNodeId = `us-${stateCode.toLowerCase()}`;

  const nodes: AtlasNode[] = [
    {
      id: input.selectedNodeId,
      label: input.selectedLabel,
      kind: "city",
      position: { x: 32, y: 18, z: 1 },
      score: 76,
      signals: ["requested_place", "manual_route"],
      campaignSuggestion: `Scout ${input.selectedLabel} before expanding the ${input.countyLabel} route.`,
    },
    {
      id: homeNodeId,
      label: `${input.selectedLabel} home-area blocks`,
      kind: "residential_cluster",
      position: { x: 34, y: 17, z: 1 },
      score: 78,
      signals: ["home_area", "route_density"],
      campaignSuggestion: "Use a resident-facing service window.",
    },
    {
      id: plazaNodeId,
      label: `${input.selectedLabel} plaza surface`,
      kind: "commercial_plaza",
      position: { x: 36, y: 20, z: 1 },
      score: 74,
      signals: ["errand_overlap", "qr_surface"],
      campaignSuggestion: "Ask one local surface for permission before paid spend.",
    },
    {
      id: accessNodeId,
      label: `${input.selectedLabel} access check`,
      kind: "apartment_cluster",
      position: { x: 38, y: 23, z: 1 },
      score: 67,
      signals: ["permission_required", "resident_access"],
      campaignSuggestion: "Confirm access rules before promising volume.",
    },
    {
      id: routeNodeId,
      label: `${input.countyLabel} route edge`,
      kind: "regional_center",
      position: { x: 28, y: 21, z: 1 },
      score: 70,
      signals: ["route_extension"],
      campaignSuggestion: "Extend only after the first route proves response.",
    },
    {
      id: parkNodeId,
      label: `${input.selectedLabel} community surface`,
      kind: "commercial_plaza",
      position: { x: 35, y: 22, z: 1 },
      score: 62,
      signals: ["community_surface"],
      campaignSuggestion: "Use as a low-pressure manual test surface.",
    },
  ];

  const places: VoxelPlace[] = [
    {
      id: `place-${selectedSlug}-core`,
      label: input.selectedLabel,
      kind: "landmark",
      districtId,
      nodeId: input.selectedNodeId,
      position: { x: 32, y: 18, z: 1.32 },
      description: `Requested Scout Drop point in ${input.countyLabel}.`,
      activity: 0.74,
    },
    {
      id: `place-${selectedSlug}-homes`,
      label: `${input.selectedLabel} home-area blocks`,
      kind: "home_area",
      districtId,
      nodeId: homeNodeId,
      position: { x: 34, y: 17, z: 1.32 },
      description: "Synthetic home-area proxy for route density.",
      activity: 0.78,
    },
    {
      id: `place-${selectedSlug}-plaza`,
      label: `${input.selectedLabel} plaza surface`,
      kind: "plaza",
      districtId,
      nodeId: plazaNodeId,
      position: { x: 36, y: 20, z: 1.32 },
      description: "Synthetic errand-overlap proxy for a QR or partner test.",
      activity: 0.72,
    },
    {
      id: `place-${selectedSlug}-access`,
      label: `${input.selectedLabel} access check`,
      kind: "home_area",
      districtId,
      nodeId: accessNodeId,
      position: { x: 38, y: 23, z: 1.34 },
      description: "Synthetic permission-check proxy for property or resident access.",
      activity: 0.66,
    },
    {
      id: `place-${selectedSlug}-route`,
      label: `${input.countyLabel} route edge`,
      kind: "road",
      districtId,
      nodeId: routeNodeId,
      position: { x: 28, y: 21, z: 1.18 },
      description: "Synthetic route-edge proxy; not live traffic.",
      activity: 0.6,
    },
    {
      id: `place-${selectedSlug}-community`,
      label: `${input.selectedLabel} community surface`,
      kind: "park",
      districtId,
      nodeId: parkNodeId,
      position: { x: 35, y: 22, z: 1.22 },
      description: "Synthetic community-surface proxy for a low-pressure manual test.",
      activity: 0.58,
    },
  ];

  const worldNodes: VoxelWorldNode[] = [
    { id: "us", label: "United States", scale: "country", slug: "us" },
    { id: stateNodeId, label: stateCode, scale: "state", parentId: "us", slug: stateCode.toLowerCase() },
    { id: input.countySlug, label: input.countyLabel, scale: "county", parentId: stateNodeId, slug: input.countySlug, position: { x: 32, y: 18, z: 0 } },
    { id: districtId, label: `${input.selectedLabel} synthetic Scout preview`, scale: "district", parentId: input.countySlug, slug: selectedSlug, position: { x: 32, y: 18, z: 1 } },
    ...places.map((place) => ({
      id: place.id,
      label: place.label,
      scale: "place" as const,
      parentId: districtId,
      position: place.position,
    })),
  ];

  const nodeMap: Record<string, string> = {
    eastvale: input.selectedNodeId,
    "residential-eastvale": homeNodeId,
    "gym-plaza-eastvale": plazaNodeId,
    "apartment-cluster": accessNodeId,
    norco: routeNodeId,
    corona: routeNodeId,
    riverside: routeNodeId,
  };

  return {
    ...riversideDemoVoxelScene,
    id: `voxel-${input.countySlug}-${selectedSlug}-synthetic-scout-base`,
    county: {
      name: input.countyLabel,
      state: stateCode,
      slug: input.countySlug,
    },
    nodes,
    edges: [
      { id: `${selectedSlug}-homes`, from: input.selectedNodeId, to: homeNodeId, kind: "signal" },
      { id: `${selectedSlug}-plaza`, from: input.selectedNodeId, to: plazaNodeId, kind: "signal" },
      { id: `${selectedSlug}-access`, from: input.selectedNodeId, to: accessNodeId, kind: "signal" },
      { id: `${selectedSlug}-route`, from: input.selectedNodeId, to: routeNodeId, kind: "route" },
      { id: `${selectedSlug}-community`, from: input.selectedNodeId, to: parkNodeId, kind: "route" },
    ],
    markers: [],
    objects: (riversideDemoVoxelScene.objects ?? []).map((object) => {
      const { nodeId: objectNodeId, ...rest } = object;
      const mappedNodeId = objectNodeId ? nodeMap[objectNodeId] ?? input.selectedNodeId : undefined;
      return {
        ...rest,
        id: `${selectedSlug}-${object.id}`,
        label: relabelObject(object.label, input.selectedLabel, input.countyLabel),
        ...(mappedNodeId ? { nodeId: mappedNodeId } : {}),
      };
    }),
    camera: {
      focusNodeId: input.selectedNodeId,
      initialZoom: riversideDemoVoxelScene.camera?.initialZoom ?? 1,
      minZoom: riversideDemoVoxelScene.camera?.minZoom ?? 0.82,
      maxZoom: riversideDemoVoxelScene.camera?.maxZoom ?? 1.34,
    },
    world: {
      activeScale: "district",
      selectedDistrictId: districtId,
      nodes: worldNodes,
      districts: [
        {
          id: districtId,
          label: `${input.selectedLabel} synthetic Scout preview`,
          countySlug: input.countySlug,
          worldNodeId: districtId,
          summary: `Session-only synthetic Scout preview for ${input.selectedLabel} in ${input.countyLabel}.`,
          playable: false,
          focusNodeIds: nodes.map((node) => node.id),
          position: { x: 32, y: 18, z: 1 },
        },
      ],
      places,
      ambient: {
        ...riversideDemoVoxelScene.world!.ambient,
        activity: "busy",
      },
      stickers: [],
      notes: [],
    },
    clawd: {
      nodeId: input.selectedNodeId,
      routeNodeIds: [input.selectedNodeId, homeNodeId, plazaNodeId],
      label: "Clawd Scout",
      status: "scouting",
      mood: "scanning",
      pulse: true,
    },
    selectedNodeId: input.selectedNodeId,
  };
}

function scoreFromPlaces(places: VoxelPlace[], adjustment: number): number {
  const scores = places.map((place) => place.activity * 100).filter((score) => Number.isFinite(score));
  const average = scores.length > 0 ? scores.reduce((total, value) => total + value, 0) / scores.length : 70;
  return Math.max(1, Math.min(99, Math.round(average + adjustment)));
}

function toneFromScore(score: number): ScoutSignal["tone"] {
  if (score >= 78) return "high";
  if (score >= 58) return "medium";
  return "watch";
}

function sourceNodeIds(places: VoxelPlace[], fallbackNodeId: string): string[] {
  const ids = places.map((place) => place.nodeId).filter(Boolean);
  return Array.from(new Set(ids.length > 0 ? ids : [fallbackNodeId]));
}

function labelList(places: VoxelPlace[], fallback: string): string {
  const labels = Array.from(new Set(places.map((place) => place.label).filter(Boolean)));
  if (labels.length === 0) return fallback;
  if (labels.length === 1) return labels[0]!;
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function residentialDemandDetail(context: ScoutSceneContext, homePlaces: VoxelPlace[]): string {
  if (homePlaces.length === 0) {
    return `${context.selectedLabel} in ${context.countyLabel} gives the first route a concrete resident-facing test.`;
  }
  return `${context.selectedLabel}, ${labelList(homePlaces, "nearby home areas")} in ${context.countyLabel} give the first route a concrete resident-facing test.`;
}

function scoutSceneId(context: ScoutSceneContext): string {
  if (context.countySlug === DEFAULT_COUNTY_SLUG && context.selectedNodeId === "eastvale") {
    return "voxel-riverside-eastvale-scout-drop";
  }
  return `voxel-${context.countySlug}-${slugOrFallback(context.selectedLabel, "requested-place")}-scout-drop`;
}

function shortStatValue(label: string): string {
  return label.replace(/\s+(demand|access|opportunity|outreach|target)$/i, "").slice(0, 18) || "Route";
}

function countyLabelFromSlug(countySlug: string): string {
  const withoutState = countySlug.replace(/-[a-z]{2}$/i, "");
  const label = titleCase(withoutState.replace(/-/g, " "));
  return /\bcounty\b/i.test(label) ? label : `${label} County`;
}

function stateFromCountySlug(countySlug: string): string {
  const match = countySlug.match(/-([a-z]{2})$/i);
  return match?.[1]?.toUpperCase() ?? "US";
}

function defaultPlaceLabel(countyLabel: string): string {
  const base = countyLabel.replace(/\s+County$/i, "").trim();
  return base ? `${base} core` : "Requested place";
}

function nodeLabelFromId(nodeId: string | undefined): string | undefined {
  const normalized = nodeId?.trim();
  return normalized ? titleCase(normalized.replace(/[-_]+/g, " ")) : undefined;
}

function cleanLabel(value: string | undefined): string | undefined {
  const label = value?.trim();
  return label ? label : undefined;
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function relabelObject(label: string, selectedLabel: string, countyLabel: string): string {
  return label
    .replace(/Eastvale/gi, selectedLabel)
    .replace(/Norco|Corona|Riverside/gi, countyLabel.replace(/\s+County$/i, ""));
}

function slugOrFallback(value: string | undefined, fallback: string): string {
  return slugify(value ?? "") || fallback;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
