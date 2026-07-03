import type { CaliforniaDistrictCandidatePackEntry } from "./californiaDistrictCandidatePack.js";
import type { DistrictPlayableGate } from "./types.js";

export const DISTRICT_PROMOTION_GATE_ORDER: DistrictPlayableGate[] = [
  "candidate_contract",
  "place_anchors_with_source_notes",
  "curated_district_pack",
  "bounded_scene_compiler_proof",
  "desktop_mobile_product_loop_screenshots",
  "lumen_visual_acceptance",
  "mira_readiness_acceptance",
  "forge_split_guard",
];

export type DistrictPromotionFilePresence = {
  candidatePack: boolean;
  anchorPack: boolean;
  curatedPack: boolean;
};

export type DistrictPromotionCountyState = {
  coverageTier: string;
  playableDistrictCount: number;
  placeCount: number;
  districtPlayable: boolean | null;
  districtPlaceCount: number | null;
};

export type DistrictPromotionDraftSceneSummary = {
  playable: boolean | undefined;
  buildingCount: number;
  lotCount: number;
  roadSegmentCount: number;
  actorCount: number;
  pinCount: number;
  selectedPlaceId: string;
  cameraPresets: string[];
} | null;

export type DistrictPromotionPacketInput = {
  candidate: CaliforniaDistrictCandidatePackEntry;
  filePresence: DistrictPromotionFilePresence;
  countyState: DistrictPromotionCountyState;
  draftScene: DistrictPromotionDraftSceneSummary;
  satisfiedGates: DistrictPlayableGate[];
  missingGates: DistrictPlayableGate[];
  promotionBlockers: string[];
  requiredScreenshotPacketPath?: string;
};

export type DistrictPromotionPacket = {
  packetKind: "districtPromotionPacket";
  version: "e13.10";
  districtSlug: string;
  countySlug: string;
  currentCoverageTier: "L1_COUNTY_SHELL";
  targetCoverageTier: "L2_CURATED_DISTRICT";
  playableNow: false;
  publicSwitcherEligible: false;
  promotionReady: boolean;
  nextRequiredGate: DistrictPlayableGate | null;
  gateSummary: {
    satisfied: DistrictPlayableGate[];
    missing: DistrictPlayableGate[];
  };
  evidence: {
    candidateContract: boolean;
    sourceNotedAnchors: boolean;
    draftOnlyCuratedPack: boolean;
    boundedSceneCompilerProof: boolean;
    desktopMobileScreenshots: boolean;
    lumenAcceptance: boolean;
    miraAcceptance: boolean;
    forgeSplitGuard: boolean;
  };
  reviewPlaceholders: {
    requiredScreenshotPacketPath: string;
    lumenAcceptance: {
      owner: "Lumen";
      status: "missing" | "accepted";
      required: true;
    };
    miraAcceptance: {
      owner: "Mira";
      status: "missing" | "accepted";
      required: true;
    };
    forgeSplitGuard: {
      owner: "Forge";
      status: "missing" | "passed";
      required: true;
    };
  };
  noFakePlayability: {
    countyRemainsShell: boolean;
    zeroPlayableDistricts: boolean;
    zeroPublicPlaces: boolean;
    districtNotPlayable: boolean;
    draftSceneNotPlayable: boolean;
    noActorsPinsOrSelectedPlace: boolean;
    providerPromotion: false;
    publicQuality: false;
  };
  releaseCutline: {
    mayExposeInPublicSwitcher: boolean;
    mayCompilePublicScene: boolean;
    mayClaimProviderNormalized: false;
    requiredOwnersBeforePublic: Array<"Lumen" | "Mira" | "Forge" | "Axiom">;
  };
  blockerSummary: string[];
};

export function createDistrictPromotionPacket(input: DistrictPromotionPacketInput): DistrictPromotionPacket {
  const satisfied = orderedUniqueGates(input.satisfiedGates);
  const missing = DISTRICT_PROMOTION_GATE_ORDER.filter((gate) => !satisfied.includes(gate));
  const promotionReady = missing.length === 0 && input.promotionBlockers.length === 0;
  const draftSceneNotPlayable = input.draftScene ? input.draftScene.playable === false : true;
  const noActorsPinsOrSelectedPlace = input.draftScene
    ? input.draftScene.actorCount === 0 && input.draftScene.pinCount === 0 && input.draftScene.selectedPlaceId === ""
    : true;

  return {
    packetKind: "districtPromotionPacket",
    version: "e13.10",
    districtSlug: input.candidate.districtSlug,
    countySlug: input.candidate.countySlug,
    currentCoverageTier: "L1_COUNTY_SHELL",
    targetCoverageTier: "L2_CURATED_DISTRICT",
    playableNow: false,
    publicSwitcherEligible: false,
    promotionReady,
    nextRequiredGate: missing[0] ?? null,
    gateSummary: {
      satisfied,
      missing,
    },
    evidence: {
      candidateContract: input.filePresence.candidatePack && satisfied.includes("candidate_contract"),
      sourceNotedAnchors: input.filePresence.anchorPack && satisfied.includes("place_anchors_with_source_notes"),
      draftOnlyCuratedPack: input.filePresence.curatedPack && satisfied.includes("curated_district_pack"),
      boundedSceneCompilerProof: satisfied.includes("bounded_scene_compiler_proof"),
      desktopMobileScreenshots: satisfied.includes("desktop_mobile_product_loop_screenshots"),
      lumenAcceptance: satisfied.includes("lumen_visual_acceptance"),
      miraAcceptance: satisfied.includes("mira_readiness_acceptance"),
      forgeSplitGuard: satisfied.includes("forge_split_guard"),
    },
    reviewPlaceholders: {
      requiredScreenshotPacketPath:
        input.requiredScreenshotPacketPath ?? `artifacts/second-district/${input.candidate.districtSlug}/visual-packet`,
      lumenAcceptance: {
        owner: "Lumen",
        status: satisfied.includes("lumen_visual_acceptance") ? "accepted" : "missing",
        required: true,
      },
      miraAcceptance: {
        owner: "Mira",
        status: satisfied.includes("mira_readiness_acceptance") ? "accepted" : "missing",
        required: true,
      },
      forgeSplitGuard: {
        owner: "Forge",
        status: satisfied.includes("forge_split_guard") ? "passed" : "missing",
        required: true,
      },
    },
    noFakePlayability: {
      countyRemainsShell: input.countyState.coverageTier === "L1_COUNTY_SHELL",
      zeroPlayableDistricts: input.countyState.playableDistrictCount === 0,
      zeroPublicPlaces: input.countyState.placeCount === 0 && input.countyState.districtPlaceCount === 0,
      districtNotPlayable: input.countyState.districtPlayable === false,
      draftSceneNotPlayable,
      noActorsPinsOrSelectedPlace,
      providerPromotion: false,
      publicQuality: false,
    },
    releaseCutline: {
      mayExposeInPublicSwitcher: promotionReady,
      mayCompilePublicScene: promotionReady,
      mayClaimProviderNormalized: false,
      requiredOwnersBeforePublic: ["Lumen", "Mira", "Forge", "Axiom"],
    },
    blockerSummary: [...new Set(input.promotionBlockers)],
  };
}

function orderedUniqueGates(gates: DistrictPlayableGate[]): DistrictPlayableGate[] {
  const present = new Set(gates);
  return DISTRICT_PROMOTION_GATE_ORDER.filter((gate) => present.has(gate));
}
