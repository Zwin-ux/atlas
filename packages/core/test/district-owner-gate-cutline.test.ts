import { describe, expect, it } from "vitest";
import {
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  createDistrictOwnerGateCutline,
  createDistrictPromotionPacket,
  createDistrictReadinessAggregate,
} from "../src/index.js";

const anaheimCandidate = CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((candidate) => candidate.districtSlug === "anaheim-candidate");

describe("DistrictOwnerGateCutline", () => {
  it("blocks Anaheim promotion when evidence exists but owner gates are not accepted", () => {
    expect(anaheimCandidate).toBeDefined();
    const promotionPacket = createDistrictPromotionPacket({
      candidate: anaheimCandidate!,
      filePresence: {
        candidatePack: true,
        anchorPack: true,
        curatedPack: true,
      },
      countyState: {
        coverageTier: "L1_COUNTY_SHELL",
        playableDistrictCount: 0,
        placeCount: 0,
        districtPlayable: false,
        districtPlaceCount: 0,
      },
      draftScene: {
        playable: false,
        buildingCount: 8,
        lotCount: 8,
        roadSegmentCount: 9,
        actorCount: 0,
        pinCount: 0,
        selectedPlaceId: "",
        cameraPresets: ["desktop", "mobile", "residential_detail"],
      },
      satisfiedGates: [
        "candidate_contract",
        "place_anchors_with_source_notes",
        "curated_district_pack",
        "bounded_scene_compiler_proof",
      ],
      missingGates: [
        "desktop_mobile_product_loop_screenshots",
        "lumen_visual_acceptance",
        "mira_readiness_acceptance",
        "forge_split_guard",
      ],
      promotionBlockers: [
        "Missing promotion gate: desktop_mobile_product_loop_screenshots.",
        "Missing promotion gate: lumen_visual_acceptance.",
        "Missing promotion gate: mira_readiness_acceptance.",
        "Missing promotion gate: forge_split_guard.",
      ],
    });
    const aggregate = createDistrictReadinessAggregate({
      promotionPacket,
      sourceVerifier: {
        status: "passed",
        verified: true,
        source: "county-index-source",
        blockerCount: 0,
      },
      visualPacket: {
        status: "passed",
        packetPath: "C:/tmp/visual-packet",
        outcome: "HIDDEN_DRAFT_ONLY",
        promotionReady: false,
        publicPlayable: false,
        failureCount: 0,
      },
      productProof: {
        status: "passed",
        proofPath: "C:/tmp/product-proof.json",
        proofStatus: "passed",
        promotionReady: false,
        publicPlayable: false,
        miraAcceptance: false,
        scenarioCount: 5,
        failureCount: 0,
      },
      splitGuard: {
        status: "passed",
        mode: "engine-beta-data",
        blockerCount: 0,
        unknownCount: 0,
      },
    });

    const cutline = createDistrictOwnerGateCutline({ aggregate });

    expect(cutline.outcome).toBe("BLOCK_PROMOTION");
    expect(cutline.nextSlice).toBe("Public Engine Beta Quality Or Focused Hidden Source-Art Blocker");
    expect(cutline.ownerGates.lumen.status).toBe("blocked");
    expect(cutline.ownerGates.mira.status).toBe("blocked");
    expect(cutline.ownerGates.forge.status).toBe("blocked");
    expect(cutline.ownerGates.axiom.status).toBe("blocked");
    expect(cutline.cutlineBlockers).toEqual(
      expect.arrayContaining([
        "visual:visual_packet_not_promotion_ready",
        "product:product_proof_not_promotion_ready",
        "release:forge_split_guard_acceptance_missing",
        "owner:axiom:blocked:Readiness aggregate is not promotion-ready.",
      ]),
    );
  });

  it("approves only when aggregate readiness and all owner gates are accepted", () => {
    expect(anaheimCandidate).toBeDefined();
    const promotionPacket = createDistrictPromotionPacket({
      candidate: anaheimCandidate!,
      filePresence: {
        candidatePack: true,
        anchorPack: true,
        curatedPack: true,
      },
      countyState: {
        coverageTier: "L1_COUNTY_SHELL",
        playableDistrictCount: 0,
        placeCount: 0,
        districtPlayable: false,
        districtPlaceCount: 0,
      },
      draftScene: {
        playable: false,
        buildingCount: 8,
        lotCount: 8,
        roadSegmentCount: 9,
        actorCount: 0,
        pinCount: 0,
        selectedPlaceId: "",
        cameraPresets: ["desktop", "mobile", "residential_detail"],
      },
      satisfiedGates: [
        "candidate_contract",
        "place_anchors_with_source_notes",
        "curated_district_pack",
        "bounded_scene_compiler_proof",
        "desktop_mobile_product_loop_screenshots",
        "lumen_visual_acceptance",
        "mira_readiness_acceptance",
        "forge_split_guard",
      ],
      missingGates: [],
      promotionBlockers: [],
    });
    const aggregate = createDistrictReadinessAggregate({
      promotionPacket,
      sourceVerifier: {
        status: "passed",
        verified: true,
        source: "county-index-source",
        blockerCount: 0,
      },
      visualPacket: {
        status: "passed",
        packetPath: "C:/tmp/visual-packet",
        outcome: "PASS_FOR_PUBLIC_PROMOTION",
        promotionReady: true,
        publicPlayable: true,
        failureCount: 0,
      },
      productProof: {
        status: "passed",
        proofPath: "C:/tmp/product-proof.json",
        proofStatus: "passed",
        promotionReady: true,
        publicPlayable: true,
        miraAcceptance: true,
        scenarioCount: 5,
        failureCount: 0,
      },
      splitGuard: {
        status: "passed",
        mode: "engine-beta-data",
        blockerCount: 0,
        unknownCount: 0,
      },
    });

    const cutline = createDistrictOwnerGateCutline({
      aggregate,
      ownerDecisions: {
        lumen: { owner: "lumen", status: "accepted", evidencePath: "C:/tmp/visual-packet" },
        mira: { owner: "mira", status: "accepted", evidencePath: "C:/tmp/product-proof.json" },
        forge: { owner: "forge", status: "accepted", evidencePath: "C:/tmp/split-guard.json" },
        axiom: { owner: "axiom", status: "accepted", reason: "Approved controlled spike." },
      },
    });

    expect(cutline.outcome).toBe("APPROVE_CONTROLLED_PUBLIC_SPIKE");
    expect(cutline.nextSlice).toBe("0.26E Controlled Anaheim Public Playable Spike");
    expect(cutline.cutlineBlockers).toEqual([]);
  });
});
