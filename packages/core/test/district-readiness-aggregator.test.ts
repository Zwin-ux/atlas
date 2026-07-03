import { describe, expect, it } from "vitest";
import {
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  createDistrictPromotionPacket,
  createDistrictReadinessAggregate,
} from "../src/index.js";

const anaheimCandidate = CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((candidate) => candidate.districtSlug === "anaheim-candidate");
const ontarioCandidate = CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((candidate) => candidate.districtSlug === "ontario-candidate");

describe("DistrictReadinessAggregator", () => {
  it.each([
    ["anaheim-candidate", anaheimCandidate],
    ["ontario-candidate", ontarioCandidate],
  ])("keeps %s non-promotable when visual product and release evidence is missing", (_districtSlug, candidate) => {
    expect(candidate).toBeDefined();
    const promotionPacket = createDistrictPromotionPacket({
      candidate: candidate!,
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
        buildingCount: 5,
        lotCount: 5,
        roadSegmentCount: 6,
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
        status: "missing",
        packetPath: promotionPacket.reviewPlaceholders.requiredScreenshotPacketPath,
        promotionReady: false,
        publicPlayable: false,
        failureCount: 1,
      },
      productProof: {
        status: "missing",
        proofPath: "artifacts/second-district/product-proof.json",
        promotionReady: false,
        failureCount: 1,
      },
      splitGuard: {
        status: "missing",
        mode: "engine-beta-data",
        blockerCount: 0,
        unknownCount: 0,
      },
    });

    expect(aggregate.readyForPlayablePromotion).toBe(false);
    expect(aggregate.sourceToSceneTrace.candidatePack.gateSatisfied).toBe(true);
    expect(aggregate.sourceToSceneTrace.anchorPack.gateSatisfied).toBe(true);
    expect(aggregate.sourceToSceneTrace.curatedPack.gateSatisfied).toBe(true);
    expect(aggregate.sourceToSceneTrace.draftCompilerProof.gateSatisfied).toBe(true);
    expect(aggregate.blockerGroups.data).toEqual([]);
    expect(aggregate.blockerGroups.visual).toEqual(
      expect.arrayContaining(["visual_packet_missing_or_failed", "lumen_acceptance_missing"]),
    );
    expect(aggregate.blockerGroups.product).toEqual(
      expect.arrayContaining(["product_proof_missing_or_failed", "mira_acceptance_missing"]),
    );
    expect(aggregate.blockerGroups.release).toEqual(
      expect.arrayContaining(["forge_split_guard_acceptance_missing", "promotion_packet_not_ready"]),
    );
    expect(aggregate.version).toBe("e24.0");
    expect(aggregate.noFakePlayability).toMatchObject({
      countyRemainsShell: true,
      zeroPlayableDistricts: true,
      zeroPublicPlaces: true,
      districtNotPlayable: true,
      draftSceneNotPlayable: true,
      noActorsPinsOrSelectedPlace: true,
      providerPromotion: false,
      publicQuality: false,
    });
  });

  it("treats a passing ChatGPT product proof as evidence while keeping promotion blocked", () => {
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
        packetPath: "C:/tmp/anaheim-visual-packet",
        outcome: "HIDDEN_DRAFT_ONLY",
        promotionReady: false,
        publicPlayable: false,
        failureCount: 0,
      },
      productProof: {
        status: "passed",
        proofPath: "C:/tmp/anaheim-product-proof.json",
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

    expect(aggregate.readyForPlayablePromotion).toBe(false);
    expect(aggregate.blockerGroups.product).not.toContain("product_proof_missing_or_failed");
    expect(aggregate.blockerGroups.product).toEqual(
      expect.arrayContaining([
        "product_proof_not_promotion_ready",
        "product_proof_not_public_playable",
        "product_proof_mira_acceptance_missing",
        "mira_acceptance_missing",
      ]),
    );
    expect(aggregate.blockerGroups.visual).toEqual(
      expect.arrayContaining([
        "visual_packet_not_promotion_ready",
        "visual_packet_not_public_playable",
        "lumen_acceptance_missing",
      ]),
    );
    expect(aggregate.blockerGroups.release).toEqual(
      expect.arrayContaining(["forge_split_guard_acceptance_missing", "promotion_packet_not_ready"]),
    );
  });
});
