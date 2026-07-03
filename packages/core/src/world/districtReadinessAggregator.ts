import type { DistrictPromotionPacket } from "./districtPromotionPacket.js";

export type DistrictReadinessEvidenceState = "present" | "missing" | "passed" | "failed";

export type DistrictVisualPacketState = {
  status: DistrictReadinessEvidenceState;
  packetPath: string;
  outcome?: string | null;
  promotionReady?: boolean | null;
  publicPlayable?: boolean | null;
  failureCount?: number;
};

export type DistrictProductProofState = {
  status: DistrictReadinessEvidenceState;
  proofPath: string;
  proofStatus?: string | null;
  promotionReady?: boolean | null;
  publicPlayable?: boolean | null;
  miraAcceptance?: boolean | null;
  scenarioCount?: number;
  failureCount?: number;
};

export type DistrictSourceVerifierState = {
  status: DistrictReadinessEvidenceState;
  verified: boolean;
  source: "county-index-source" | "not-run" | "fixture";
  blockerCount: number;
};

export type DistrictSplitGuardState = {
  status: DistrictReadinessEvidenceState;
  mode: "engine-beta-data";
  blockerCount: number;
  unknownCount: number;
};

export type DistrictReadinessAggregatorInput = {
  promotionPacket: DistrictPromotionPacket;
  sourceVerifier: DistrictSourceVerifierState;
  visualPacket: DistrictVisualPacketState;
  productProof: DistrictProductProofState;
  splitGuard: DistrictSplitGuardState;
};

export type DistrictReadinessBlockerGroups = {
  data: string[];
  visual: string[];
  product: string[];
  release: string[];
};

export type DistrictSourceToSceneTrace = {
  candidatePack: {
    present: boolean;
    gateSatisfied: boolean;
  };
  anchorPack: {
    present: boolean;
    gateSatisfied: boolean;
  };
  curatedPack: {
    present: boolean;
    gateSatisfied: boolean;
  };
  draftCompilerProof: {
    present: boolean;
    gateSatisfied: boolean;
  };
  visualPacket: DistrictVisualPacketState;
  productProof: DistrictProductProofState;
  splitGuard: DistrictSplitGuardState;
};

export type DistrictReadinessAggregate = {
  packetKind: "secondDistrictReadinessAggregate";
  version: "e24.0";
  readyForPlayablePromotion: boolean;
  candidateSlug: string;
  countySlug: string;
  districtSlug: string;
  promotionReadyFromPacket: boolean;
  blockerGroups: DistrictReadinessBlockerGroups;
  sourceToSceneTrace: DistrictSourceToSceneTrace;
  noFakePlayability: DistrictPromotionPacket["noFakePlayability"];
  releaseCutline: DistrictPromotionPacket["releaseCutline"];
};

export function createDistrictReadinessAggregate(input: DistrictReadinessAggregatorInput): DistrictReadinessAggregate {
  const packet = input.promotionPacket;
  const blockerGroups: DistrictReadinessBlockerGroups = {
    data: [],
    visual: [],
    product: [],
    release: [],
  };

  if (!packet.evidence.candidateContract) blockerGroups.data.push("candidate_contract_missing");
  if (!packet.evidence.sourceNotedAnchors) blockerGroups.data.push("source_noted_anchor_pack_missing");
  if (!packet.evidence.draftOnlyCuratedPack) blockerGroups.data.push("draft_only_curated_pack_missing");
  if (!packet.evidence.boundedSceneCompilerProof) blockerGroups.data.push("bounded_scene_compiler_proof_missing");
  if (!input.sourceVerifier.verified || input.sourceVerifier.status !== "passed") blockerGroups.data.push("source_verifier_not_green");
  if (Object.entries(packet.noFakePlayability).some(([, value]) => value !== true && value !== false)) {
    blockerGroups.data.push("no_fake_playability_flags_invalid");
  }
  if (
    !packet.noFakePlayability.countyRemainsShell ||
    !packet.noFakePlayability.zeroPlayableDistricts ||
    !packet.noFakePlayability.zeroPublicPlaces ||
    !packet.noFakePlayability.districtNotPlayable ||
    !packet.noFakePlayability.draftSceneNotPlayable ||
    !packet.noFakePlayability.noActorsPinsOrSelectedPlace ||
    packet.noFakePlayability.providerPromotion !== false ||
    packet.noFakePlayability.publicQuality !== false
  ) {
    blockerGroups.data.push("fake_playability_boundary_failed");
  }

  if (input.visualPacket.status !== "passed") blockerGroups.visual.push("visual_packet_missing_or_failed");
  if (input.visualPacket.promotionReady !== true) blockerGroups.visual.push("visual_packet_not_promotion_ready");
  if (input.visualPacket.publicPlayable !== true) blockerGroups.visual.push("visual_packet_not_public_playable");
  if (!packet.evidence.lumenAcceptance) blockerGroups.visual.push("lumen_acceptance_missing");

  if (input.productProof.status !== "passed") blockerGroups.product.push("product_proof_missing_or_failed");
  if (input.productProof.promotionReady !== true) blockerGroups.product.push("product_proof_not_promotion_ready");
  if (input.productProof.publicPlayable !== true) blockerGroups.product.push("product_proof_not_public_playable");
  if (input.productProof.miraAcceptance !== true) blockerGroups.product.push("product_proof_mira_acceptance_missing");
  if (!packet.evidence.miraAcceptance) blockerGroups.product.push("mira_acceptance_missing");

  if (input.splitGuard.status !== "passed" || input.splitGuard.blockerCount !== 0 || input.splitGuard.unknownCount !== 0) {
    blockerGroups.release.push("split_guard_not_green");
  }
  if (!packet.evidence.forgeSplitGuard) blockerGroups.release.push("forge_split_guard_acceptance_missing");
  if (!packet.promotionReady) blockerGroups.release.push("promotion_packet_not_ready");

  const readyForPlayablePromotion =
    packet.promotionReady &&
    Object.values(blockerGroups).every((items) => items.length === 0) &&
    input.visualPacket.status === "passed" &&
    input.productProof.status === "passed" &&
    input.splitGuard.status === "passed";

  return {
    packetKind: "secondDistrictReadinessAggregate",
    version: "e24.0",
    readyForPlayablePromotion,
    candidateSlug: packet.districtSlug,
    countySlug: packet.countySlug,
    districtSlug: packet.districtSlug,
    promotionReadyFromPacket: packet.promotionReady,
    blockerGroups,
    sourceToSceneTrace: {
      candidatePack: {
        present: packet.evidence.candidateContract,
        gateSatisfied: packet.gateSummary.satisfied.includes("candidate_contract"),
      },
      anchorPack: {
        present: packet.evidence.sourceNotedAnchors,
        gateSatisfied: packet.gateSummary.satisfied.includes("place_anchors_with_source_notes"),
      },
      curatedPack: {
        present: packet.evidence.draftOnlyCuratedPack,
        gateSatisfied: packet.gateSummary.satisfied.includes("curated_district_pack"),
      },
      draftCompilerProof: {
        present: packet.evidence.boundedSceneCompilerProof,
        gateSatisfied: packet.gateSummary.satisfied.includes("bounded_scene_compiler_proof"),
      },
      visualPacket: input.visualPacket,
      productProof: input.productProof,
      splitGuard: input.splitGuard,
    },
    noFakePlayability: packet.noFakePlayability,
    releaseCutline: packet.releaseCutline,
  };
}
