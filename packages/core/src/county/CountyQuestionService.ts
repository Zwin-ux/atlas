import type { CountyMapNode, CountyPack, CountySource } from "./types.js";
import { CountyPackService } from "./CountyPackService.js";
import { compileVoxelSceneFromCountyPack } from "../voxel/VoxelSceneCompiler.js";
import type { CityWorldPlace, CityWorldScene } from "../voxel/cityWorldTypes.js";
import type { VoxelDistrict, VoxelPlace, VoxelPlaceKind } from "../voxel/types.js";

export type CountyQuestionTopic =
  | "eastvale_first_slice"
  | "business_signals"
  | "county_summary"
  | "generated_place"
  | "source_limits"
  | "unsupported";

export type CountyQuestionFact = {
  label: string;
  value: string;
  sourceNodeIds?: string[];
};

export type CountyQuestionTargetKind = "place" | "district" | "water_edge" | "landmark";

export type CountyQuestionAnswer = {
  type: "countyQuestionAnswer";
  countySlug: string;
  question: string;
  supported: boolean;
  topic: CountyQuestionTopic;
  answer: string;
  facts: CountyQuestionFact[];
  sourceNotes: CountySource[];
  limitations: string[];
  suggestedNextTool?: "select_county" | "lookup_world_places";
  targetNodeId?: string;
  targetPlaceId?: string;
  targetLabel?: string;
  targetKind?: CountyQuestionTargetKind;
};

export type CountyQuestionInput = {
  countySlug?: string;
  question: string;
  businessType?: string;
  generatedScene?: CityWorldScene;
  generatedCountyLabel?: string;
};

const ALPHA_COUNTY_SLUG = "riverside-ca";
const SUPPORTED_BUSINESS_LABELS: Record<string, string> = {
  mobile_detailing: "mobile detailing",
  cleaning: "cleaning",
  local_event: "local event",
};

export class CountyQuestionService {
  constructor(private readonly countyPacks = new CountyPackService()) {}

  answer(input: CountyQuestionInput): CountyQuestionAnswer {
    const countySlug = input.countySlug ?? ALPHA_COUNTY_SLUG;
    const question = input.question.trim();

    if (countySlug !== ALPHA_COUNTY_SLUG) {
      if (input.generatedScene) {
        return generatedScenePlaceAnswer({
          countySlug,
          question,
          scene: input.generatedScene,
          ...(input.generatedCountyLabel ? { countyLabel: input.generatedCountyLabel } : {}),
          ...(input.businessType ? { businessType: input.businessType } : {}),
        });
      }

      return unsupportedAnswer({
        countySlug,
        question,
        answer: `Atlas can answer county questions from built-in Riverside/Eastvale map data right now. It cannot make claims about ${countySlug} from that map data.`,
        facts: [{ label: "Supported full-map county", value: "Riverside County, CA", sourceNodeIds: ["eastvale"] }],
      });
    }

    const pack = this.countyPacks.loadCountyPack(countySlug);
    const businessKey = normalizeBusinessKey(input.businessType ?? detectBusinessFromQuestion(question));

    if ((input.businessType || businessKey) && !businessKey) {
      return unsupportedBusinessAnswer(pack, question, input.businessType ?? question);
    }

    if (isUnsupportedBusinessQuestion(question, businessKey)) {
      return unsupportedBusinessAnswer(pack, question, input.businessType ?? question);
    }

    // Closed-world honesty guard: the curated pack has no live or real-world
    // data. Questions that ask for facts it cannot hold (hours, contact/PII,
    // prices, demographics, weather, crime, exhaustive listings) must be
    // refused, not deflected into a generic "supported" summary that reads as
    // if Atlas answered them.
    if (!question || isOutOfWorldQuestion(question)) {
      return outOfWorldAnswer(pack, question);
    }

    if (businessKey) {
      return businessSignalsAnswer(pack, question, businessKey);
    }

    const placeTarget = resolveCuratedPlaceTarget(pack, question);
    if (placeTarget) {
      return placeLocationAnswer(pack, question, placeTarget);
    }

    if (isPlaceLocationQuestion(question)) {
      return unsupportedPlaceAnswer(pack, question);
    }

    // A player asking what data makes Eastvale playable is asking why this
    // slice works, not only for a generic source disclaimer. Resolve the
    // product-loop intent before the broader source-keyword fallback.
    if (isFirstSliceQuestion(question)) {
      return eastvaleFirstSliceAnswer(pack, question);
    }

    if (isSourceQuestion(question)) {
      return sourceLimitsAnswer(pack, question);
    }

    return countySummaryAnswer(pack, question);
  }
}

export function answerCountyQuestion(input: CountyQuestionInput, countyPacks?: CountyPackService): CountyQuestionAnswer {
  return new CountyQuestionService(countyPacks).answer(input);
}

function eastvaleFirstSliceAnswer(pack: CountyPack, question: string): CountyQuestionAnswer {
  const eastvale = requireNode(pack, "eastvale");
  const connected = pack.mapEdges
    .filter((edge) => edge.from === "eastvale")
    .map((edge) => requireNode(pack, edge.to));

  return supportedAnswer(pack, {
    question,
    topic: "eastvale_first_slice",
    answer:
      "Eastvale is the first playable Atlas slice because built-in map data gives it a compact county loop: residential demand, short route access, QR flyer surfaces, a gym/plaza partner target, and an apartment/property-manager outreach pocket. That is enough for Explore -> Ask -> Drop Clawd -> Scout -> Campaign without claiming live market coverage.",
    facts: [
      factForNode(eastvale, "Selected start"),
      ...connected.slice(0, 3).map((node) => factForNode(node, "Connected signal")),
      { label: "Product boundary", value: pack.summary, sourceNodeIds: ["eastvale"] },
    ],
    suggestedNextTool: "select_county",
  });
}

function businessSignalsAnswer(pack: CountyPack, question: string, businessKey: string): CountyQuestionAnswer {
  const businessLabel = SUPPORTED_BUSINESS_LABELS[businessKey] ?? businessKey;
  const ranked = pack.mapNodes
    .filter((node) => typeof node.scores[businessKey] === "number")
    .sort((a, b) => (b.scores[businessKey] ?? 0) - (a.scores[businessKey] ?? 0));

  const top = ranked.slice(0, 4);
  const signalList = unique(top.flatMap((node) => node.signals));

  return supportedAnswer(pack, {
    question,
    topic: "business_signals",
    answer: `For ${businessLabel}, built-in Riverside map data supports Eastvale because the strongest nodes cluster around homes, errands, and short routes. Top signals are ${signalList.join(", ")}. Treat these as planning signals, not live demand or ROI proof.`,
    facts: top.map((node) => ({
      label: node.name,
      value: `${node.scores[businessKey]} ${businessLabel} score; ${node.signals.join(", ")}. ${node.campaignSuggestion}`,
      sourceNodeIds: [node.id],
    })),
    suggestedNextTool: "select_county",
  });
}

function countySummaryAnswer(pack: CountyPack, question: string): CountyQuestionAnswer {
  return supportedAnswer(pack, {
    question,
    topic: "county_summary",
    answer:
      "The Riverside/Eastvale map is a focused built-in county model for local planning. It can answer basic questions about supported nodes, routes, signals, and the first business-planning lanes, but it does not claim live market coverage across every street.",
    facts: [
      { label: "County", value: `${pack.county}, ${pack.state}` },
      { label: "Map nodes", value: String(pack.mapNodes.length), sourceNodeIds: pack.mapNodes.map((node) => node.id) },
      { label: "Map routes", value: String(pack.mapEdges.length) },
      { label: "Supported business lanes", value: Object.values(SUPPORTED_BUSINESS_LABELS).join(", ") },
    ],
    suggestedNextTool: "select_county",
  });
}

type CuratedPlaceTarget = {
  nodeId: string;
  placeId?: string;
  label: string;
  kind: CountyQuestionTargetKind;
  aliases: string[];
  sourceNodeIds: string[];
};

function placeLocationAnswer(pack: CountyPack, question: string, target: CuratedPlaceTarget): CountyQuestionAnswer {
  const sourceNodes = target.sourceNodeIds
    .map((nodeId) => pack.mapNodes.find((node) => node.id === nodeId))
    .filter((node): node is CountyMapNode => Boolean(node));
  const anchorNode = sourceNodes[0] ?? pack.mapNodes.find((node) => node.id === target.nodeId) ?? pack.mapNodes[0]!;
  const nearby = nearbyNodes(pack, anchorNode).slice(0, 3);
  const nearbyCopy = nearby.length > 0 ? nearby.map((item) => item.name).join(", ") : "the Eastvale playable district";

  return supportedAnswer(pack, {
    question,
    topic: "county_summary",
    answer: `${target.label} is in the Eastvale playable scene near ${nearbyCopy}. Atlas can focus the map there, but this is built-in map data, not a live place listing.`,
    facts: [
      {
        label: "Map place",
        value: target.placeId ? `${target.label}; scene place ${target.placeId}.` : `${target.label}; map zone.`,
        sourceNodeIds: sourceNodes.map((node) => node.id),
      },
      {
        label: "Nearby map anchors",
        value: nearbyCopy,
        sourceNodeIds: nearby.map((item) => item.id),
      },
      factForNode(anchorNode, "Atlas anchor"),
    ],
    suggestedNextTool: "select_county",
    targetNodeId: target.nodeId,
    ...(target.placeId ? { targetPlaceId: target.placeId } : {}),
    targetLabel: target.label,
    targetKind: target.kind,
  });
}

function unsupportedPlaceAnswer(pack: CountyPack, question: string): CountyQuestionAnswer {
  return unsupportedAnswer({
    countySlug: pack.slug,
    question,
    answer:
      "Atlas can only locate places that exist in the built-in Riverside/Eastvale scene. That place is not in the current map data, so Atlas will not invent a map target for it.",
    facts: [
      {
        label: "Map place boundary",
        value: "Known targets include Eastvale, Neighborhood Blocks, Gym / Plaza, Apartments, Community park, Water edge, Norco, Corona, and Riverside.",
      },
      { label: "Product boundary", value: pack.summary },
    ],
    sourceNotes: pack.sources,
    limitations: alphaLimitations(pack),
    suggestedNextTool: "select_county",
  });
}

type GeneratedScenePlaceAnswerInput = {
  countySlug: string;
  countyLabel?: string;
  question: string;
  businessType?: string;
  scene: CityWorldScene;
};

type GeneratedScenePlaceTarget = {
  place: CityWorldPlace;
  aliases: string[];
};

function generatedScenePlaceAnswer(input: GeneratedScenePlaceAnswerInput): CountyQuestionAnswer {
  if (
    !input.question ||
    input.businessType?.trim() ||
    detectBusinessFromQuestion(input.question) ||
    isUnsupportedBusinessQuestion(input.question, undefined) ||
    isGeneratedPreviewBusinessClaimQuestion(input.question) ||
    isOutOfWorldQuestion(input.question) ||
    isSourceQuestion(input.question)
  ) {
    return unsupportedGeneratedSceneAnswer(input);
  }

  const target = resolveGeneratedScenePlaceTarget(input.scene, input.question);
  if (!target) {
    return unsupportedGeneratedSceneAnswer(input);
  }

  const placeKind = generatedPlaceKindLabel(target.place.kind);
  const isCensusTownAnchor = isCensusTownPlace(target.place);
  return {
    type: "countyQuestionAnswer",
    countySlug: input.countySlug,
    question: input.question,
    supported: true,
    topic: "generated_place",
    answer: isCensusTownAnchor
      ? `${target.place.label} is a real U.S. Census place name on this county preview. Atlas can focus it on the map; the surrounding streets and buildings are generated, not verified local geography.`
      : `In this preview, ${target.place.label} is a ${placeKind} place. Tap it on the map.`,
    facts: [
      {
        label: isCensusTownAnchor ? "Census town anchor" : "Map label",
        value: isCensusTownAnchor ? `${target.place.label}; official Census place center.` : target.place.label,
        sourceNodeIds: [target.place.nodeId],
      },
      {
        label: "Place type",
        value: placeKind,
        sourceNodeIds: [target.place.nodeId],
      },
    ],
    sourceNotes: generatedSceneSourceNotes(input.countyLabel, isCensusTownAnchor),
    limitations: generatedSceneLimitations(isCensusTownAnchor),
    suggestedNextTool: "select_county",
    targetNodeId: target.place.nodeId,
    targetPlaceId: target.place.id,
    targetLabel: target.place.label,
    targetKind: target.place.kind === "landmark" ? "landmark" : "place",
  };
}

function unsupportedGeneratedSceneAnswer(input: GeneratedScenePlaceAnswerInput): CountyQuestionAnswer {
  const hasCensusTownAnchors = input.scene.places.some(isCensusTownPlace);
  return unsupportedAnswer({
    countySlug: input.countySlug,
    question: input.question || "(empty question)",
    answer:
      hasCensusTownAnchors
        ? "Atlas cannot answer that from this preview. It knows the displayed Census place names, but it will not invent streets, businesses, addresses, or local claims around them."
        : "Atlas cannot answer that from this preview. It only has drawn place labels and place types here, so it will not make local facts or business claims.",
    facts: [
      {
        label: "Preview boundary",
        value: hasCensusTownAnchors
          ? "Ask Atlas to locate one of the real town names shown on the county preview."
          : "Ask where a visible map place is, such as a market, homes, civic place, park, riverfront, or tower.",
      },
    ],
    sourceNotes: generatedSceneSourceNotes(input.countyLabel, hasCensusTownAnchors),
    limitations: generatedSceneLimitations(hasCensusTownAnchors),
    suggestedNextTool: "select_county",
  });
}

function resolveGeneratedScenePlaceTarget(scene: CityWorldScene, question: string): GeneratedScenePlaceTarget | undefined {
  if (!isPlaceLocationQuestion(question)) return undefined;
  const lower = normalizeSearchText(question);
  return generatedScenePlaceTargets(scene)
    .map((target) => ({
      target,
      matchedAliasLength: longestMatchedGeneratedAliasLength(target, lower),
    }))
    .filter((match) => match.matchedAliasLength > 0)
    .sort((a, b) => b.matchedAliasLength - a.matchedAliasLength)[0]?.target;
}

function generatedScenePlaceTargets(scene: CityWorldScene): GeneratedScenePlaceTarget[] {
  return scene.places.map((place) => ({
    place,
    aliases: aliasesForGeneratedPlace(place),
  }));
}

function aliasesForGeneratedPlace(place: CityWorldPlace): string[] {
  const raw = [place.id, place.nodeId, place.label, place.kind, ...place.label.split(/\s+/)];
  if (place.kind === "shop") raw.push("shop", "shops", "market", "stores", "service");
  if (place.kind === "home_area") raw.push("homes", "home", "houses", "residential", "neighborhood");
  if (place.kind === "park") raw.push("park", "green", "common", "field");
  if (place.kind === "plaza") raw.push("plaza", "square");
  if (place.kind === "road") raw.push("road", "street", "main street");
  if (place.kind === "landmark") raw.push("landmark", "civic", "tower", "courthouse", "landing");
  return unique(raw.map(normalizeSearchText).filter((alias) => alias.length >= 3));
}

function longestMatchedGeneratedAliasLength(target: GeneratedScenePlaceTarget, normalizedQuestion: string): number {
  return Math.max(0, ...target.aliases.filter((alias) => normalizedQuestion.includes(alias)).map((alias) => alias.length));
}

function generatedPlaceKindLabel(kind: VoxelPlaceKind): string {
  switch (kind) {
    case "home_area":
      return "homes";
    case "shop":
      return "shop";
    case "plaza":
      return "plaza";
    case "park":
      return "park";
    case "road":
      return "street";
    case "landmark":
      return "landmark";
  }
}

function generatedSceneSourceNotes(countyLabel: string | undefined, hasCensusTownAnchors = false): CountySource[] {
  return [
    {
      name: hasCensusTownAnchors
        ? `${countyLabel ?? "Atlas county"} U.S. Census town anchors`
        : countyLabel
          ? `${countyLabel} preview map labels`
          : "Atlas preview map labels",
      sourceType: hasCensusTownAnchors ? "us_census_tigerweb" : "preview_map",
      confidenceScore: hasCensusTownAnchors ? 0.95 : 0.7,
    },
  ];
}

function generatedSceneLimitations(hasCensusTownAnchors = false): string[] {
  return [
    hasCensusTownAnchors
      ? "Town names and centers come from U.S. Census data; their preview placement is approximate and the surrounding layout is generated."
      : "Answers use only place labels and place types drawn in this preview.",
    "No local facts, business claims, addresses, hours, prices, listings, saved state, XP, evidence, outreach, or automation.",
  ];
}

function isCensusTownPlace(place: CityWorldPlace): boolean {
  return place.id.startsWith("town-anchor-") && place.nodeId.startsWith("census-place-");
}

function isGeneratedPreviewBusinessClaimQuestion(question: string): boolean {
  return /\b(should i|will .{0,40} work|demand|customers?|leads?|roi|revenue|competition|competitors?|advertis|paid ads?|best business|launch)\b/i.test(question);
}

function sourceLimitsAnswer(pack: CountyPack, question: string): CountyQuestionAnswer {
  return supportedAnswer(pack, {
    question,
    topic: "source_limits",
    answer:
      "This answer is closed-world. It uses built-in Riverside/Eastvale map data and source notes only. It does not call Google, ingest live county data, save provider results, or claim current market truth.",
    facts: [
      { label: "Pack version", value: pack.version },
      { label: "Last updated", value: pack.lastUpdated },
      ...pack.confidenceNotes.map((note) => ({ label: "Confidence note", value: note })),
    ],
    suggestedNextTool: "lookup_world_places",
  });
}

function outOfWorldAnswer(pack: CountyPack, question: string): CountyQuestionAnswer {
  return unsupportedAnswer({
    countySlug: pack.slug,
    question: question || "(empty question)",
    answer:
      "Atlas answers only from built-in Riverside/Eastvale map data. It has no live or real-world data feed for this path, so it cannot give business hours, phone numbers, addresses, prices, demographics, weather, crime figures, or exhaustive business listings. Ask instead about map nodes, routes, business signal lanes, why Eastvale is the first slice, or source and confidence limits.",
    facts: [
      {
        label: "What Atlas can answer",
        value:
          "Map nodes and routes, mobile detailing / cleaning / local event signal lanes, why Eastvale is first, and source/confidence limits.",
      },
      { label: "Product boundary", value: pack.summary },
    ],
    sourceNotes: pack.sources,
    limitations: alphaLimitations(pack),
    suggestedNextTool: "select_county",
  });
}

function unsupportedBusinessAnswer(pack: CountyPack, question: string, requested: string): CountyQuestionAnswer {
  return unsupportedAnswer({
    countySlug: pack.slug,
    question,
    answer: `Atlas cannot support that business claim from built-in Riverside map data. Requested scope: ${requested}. Supported score lanes are ${Object.values(SUPPORTED_BUSINESS_LABELS).join(", ")}. Narrow this to one of those lanes before using it for a Scout Drop.`,
    facts: [
      { label: "Supported business lanes", value: Object.values(SUPPORTED_BUSINESS_LABELS).join(", ") },
      { label: "Product boundary", value: pack.summary },
    ],
    sourceNotes: pack.sources,
    limitations: alphaLimitations(pack),
    suggestedNextTool: "select_county",
  });
}

function supportedAnswer(
  pack: CountyPack,
  answer: Omit<CountyQuestionAnswer, "type" | "countySlug" | "supported" | "sourceNotes" | "limitations">,
): CountyQuestionAnswer {
  return {
    type: "countyQuestionAnswer",
    countySlug: pack.slug,
    supported: true,
    sourceNotes: pack.sources,
    limitations: alphaLimitations(pack),
    ...answer,
  };
}

function unsupportedAnswer(input: {
  countySlug: string;
  question: string;
  answer: string;
  facts: CountyQuestionFact[];
  sourceNotes?: CountySource[];
  limitations?: string[];
  suggestedNextTool?: CountyQuestionAnswer["suggestedNextTool"];
}): CountyQuestionAnswer {
  return {
    type: "countyQuestionAnswer",
    countySlug: input.countySlug,
    question: input.question,
    supported: false,
    topic: "unsupported",
    answer: input.answer,
    facts: input.facts,
    sourceNotes: input.sourceNotes ?? [],
    limitations: input.limitations ?? [
      "Atlas only answers from built-in supported county map data.",
      "Unsupported counties and unsupported business claims are narrowed or refused.",
    ],
    suggestedNextTool: input.suggestedNextTool ?? "select_county",
  };
}

function factForNode(node: CountyMapNode, label: string): CountyQuestionFact {
  return {
    label: `${label}: ${node.name}`,
    value: `${node.signals.join(", ")}. ${node.campaignSuggestion}`,
    sourceNodeIds: [node.id],
  };
}

function requireNode(pack: CountyPack, nodeId: string): CountyMapNode {
  const node = pack.mapNodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`County pack ${pack.slug} does not include node ${nodeId}.`);
  return node;
}

function alphaLimitations(pack: CountyPack): string[] {
  return [
    ...pack.confidenceNotes,
    "Closed-world answer from built-in Atlas map data only.",
    "No saved state, XP, evidence, outreach, or live market guarantee.",
  ];
}

function normalizeBusinessKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (normalized in SUPPORTED_BUSINESS_LABELS) return normalized;
  if (normalized.includes("detail")) return "mobile_detailing";
  if (normalized.includes("clean")) return "cleaning";
  if (normalized.includes("event")) return "local_event";
  return undefined;
}

function detectBusinessFromQuestion(question: string): string | undefined {
  const lower = question.toLowerCase();
  if (lower.includes("mobile detail") || lower.includes("detailing")) return "mobile_detailing";
  if (lower.includes("cleaning") || lower.includes("cleaner")) return "cleaning";
  if (lower.includes("local event") || lower.includes("event")) return "local_event";
  return undefined;
}

function isUnsupportedBusinessQuestion(question: string, detectedBusinessKey: string | undefined): boolean {
  if (detectedBusinessKey) return false;
  return /\b(roofing|plumb|hvac|restaurant|insurance|real estate|law firm|med spa|landscap)\b/i.test(question);
}

function isFirstSliceQuestion(question: string): boolean {
  const hasExplicitLoopIntent = /\b(first\s+slice|starting\s+slice|playable|product\s+loop|gameplay\s+loop)\b/i.test(question);
  const asksWhyEastvale =
    /\bwhy\b[^?]*\beastvale\b/i.test(question) || /\beastvale\b[^?]*\bwhy\b/i.test(question);
  return hasExplicitLoopIntent || (asksWhyEastvale && !isSourceQuestion(question));
}

function isSourceQuestion(question: string): boolean {
  return /\b(sources?|confidence|live|current|data|providers?|google)\b/i.test(question);
}

function isPlaceLocationQuestion(question: string): boolean {
  return /\b(where|near|nearby|around|next to|close to|show|focus|locate|find|what'?s near|what is near|what are near)\b/i.test(question);
}

function resolveCuratedPlaceTarget(pack: CountyPack, question: string): CuratedPlaceTarget | undefined {
  if (!isPlaceLocationQuestion(question)) return undefined;

  const lower = normalizeSearchText(question);
  const targets = curatedPlaceTargets(pack);
  return targets
    .filter((target) => target.aliases.some((alias) => lower.includes(alias)))
    .sort((a, b) => longestAliasLength(b) - longestAliasLength(a))[0];
}

function curatedPlaceTargets(pack: CountyPack): CuratedPlaceTarget[] {
  const scene = compileVoxelSceneFromCountyPack(pack);
  const nodeById = new Map(pack.mapNodes.map((node) => [node.id, node]));
  const placeTargets = scene.world?.places.map((place): CuratedPlaceTarget => {
    const node = nodeById.get(place.nodeId);
    return {
      nodeId: place.nodeId,
      placeId: place.id,
      label: place.label,
      kind: targetKindForPlace(place),
      aliases: aliasesForPlace(place, node),
      sourceNodeIds: [place.nodeId],
    };
  }) ?? [];
  const districtTargets = scene.world?.districts.map((district): CuratedPlaceTarget => ({
    nodeId: district.worldNodeId,
    label: district.label,
    kind: "district",
    aliases: aliasesForDistrict(district),
    sourceNodeIds: district.focusNodeIds,
  })) ?? [];

  return [
    ...placeTargets,
    ...districtTargets,
    {
      nodeId: "eastvale",
      label: "Community park",
      kind: "place",
      aliases: ["park", "community park"],
      sourceNodeIds: ["eastvale"],
    },
    {
      nodeId: "riverside",
      label: "Water edge",
      kind: "water_edge",
      aliases: ["water edge", "waterfront", "river edge", "river"],
      sourceNodeIds: ["riverside"],
    },
  ];
}

function targetKindForPlace(place: VoxelPlace): CountyQuestionTargetKind {
  return place.kind === "landmark" ? "landmark" : "place";
}

function aliasesForPlace(place: VoxelPlace, node: CountyMapNode | undefined): string[] {
  const raw = [
    place.id,
    place.nodeId,
    place.label,
    place.kind,
    ...place.label.split("/"),
    ...(node ? aliasesForNode(node) : []),
  ];
  return unique(raw.map(normalizeSearchText).filter(Boolean));
}

function aliasesForDistrict(district: VoxelDistrict): string[] {
  return unique(
    [
      district.id,
      district.worldNodeId,
      district.label,
      district.summary,
      district.playable ? "playable district" : "locked district",
      ...district.focusNodeIds,
    ]
      .map(normalizeSearchText)
      .filter(Boolean),
  );
}

function aliasesForNode(node: CountyMapNode): string[] {
  const raw = [node.id, node.name, labelForNode(node), node.type, ...node.name.split("/"), ...node.signals];
  if (node.type === "commercial_plaza") raw.push("plaza", "gym", "shops", "shop row", "plaza row");
  if (node.type === "residential_cluster") raw.push("homes", "home area", "neighborhood", "neighborhood blocks", "residential");
  if (node.type === "apartment_cluster") raw.push("apartments", "apartment", "property manager");
  return raw;
}

function labelForNode(node: CountyMapNode): string {
  if (node.type === "commercial_plaza") return node.name.replace("Eastvale ", "");
  if (node.type === "residential_cluster") return "Neighborhood Blocks";
  return node.name;
}

function nearbyNodes(pack: CountyPack, target: CountyMapNode): CountyMapNode[] {
  const connectedIds = pack.mapEdges
    .filter((edge) => edge.from === target.id || edge.to === target.id)
    .map((edge) => (edge.from === target.id ? edge.to : edge.from));
  const connected = connectedIds
    .map((id) => pack.mapNodes.find((node) => node.id === id))
    .filter((node): node is CountyMapNode => Boolean(node));
  const byDistance = pack.mapNodes
    .filter((node) => node.id !== target.id && !connectedIds.includes(node.id))
    .sort((a, b) => distanceBetweenNodes(a, target) - distanceBetweenNodes(b, target));
  return uniqueNodes([...connected, ...byDistance]);
}

function distanceBetweenNodes(a: CountyMapNode, b: CountyMapNode): number {
  return Math.hypot(a.voxel.x - b.voxel.x, a.voxel.y - b.voxel.y);
}

function uniqueNodes(nodes: CountyMapNode[]): CountyMapNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function longestAliasLength(target: CuratedPlaceTarget): number {
  return Math.max(...target.aliases.map((alias) => alias.length));
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Facts a closed-world curated pack genuinely cannot hold. Kept specific so it
// never swallows supported asks (curated signals, routes, why-Eastvale, source
// limits) — those have no contact/price/stat/real-time/enumeration wording.
function isOutOfWorldQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  const factLookup =
    /\b(phone|telephone|email|e-mail|address|street|zip\s?code|postal|contact|call them|website|url|coordinates|lat\b|latitude|longitude)\b/.test(lower) ||
    /\b(price|prices|pricing|cost|costs|how much|cheap(est)?|rate card|quote|fee|fees)\b/.test(lower) ||
    /\b(population|demographic|demographics|median income|household income|crime|crime rate|school rating|census count|how many (people|residents))\b/.test(lower) ||
    /\b(weather|forecast|temperature|right now|open now|open right now|currently open|open today|is .{0,25}\bopen\b|hours|closing time|closes|when (do|does) .* (open|close))\b/.test(lower) ||
    /\b(list (all|every|each)|every (business|shop|store|place|restaurant|company)|all (the )?(businesses|shops|stores|restaurants|companies)|how many (businesses|shops|stores|restaurants))\b/.test(lower);
  return factLookup;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
