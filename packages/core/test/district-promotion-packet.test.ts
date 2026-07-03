import { describe, expect, it } from "vitest";
import {
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  createDistrictPromotionPacket,
  DISTRICT_PROMOTION_GATE_ORDER,
} from "../src/index.js";

const ontarioCandidate = CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((candidate) => candidate.districtSlug === "ontario-candidate");

describe("DistrictPromotionPacket", () => {
  it("summarizes Ontario draft readiness without unlocking public playability", () => {
    expect(ontarioCandidate).toBeDefined();
    const packet = createDistrictPromotionPacket({
      candidate: ontarioCandidate!,
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
      ],
      requiredScreenshotPacketPath: "artifacts/second-district/ontario-candidate/visual-packet",
    });

    expect(packet).toMatchObject({
      packetKind: "districtPromotionPacket",
      version: "e13.10",
      districtSlug: "ontario-candidate",
      countySlug: "san-bernardino-ca",
      currentCoverageTier: "L1_COUNTY_SHELL",
      targetCoverageTier: "L2_CURATED_DISTRICT",
      playableNow: false,
      publicSwitcherEligible: false,
      promotionReady: false,
      nextRequiredGate: "desktop_mobile_product_loop_screenshots",
      releaseCutline: {
        mayExposeInPublicSwitcher: false,
        mayCompilePublicScene: false,
        mayClaimProviderNormalized: false,
      },
      reviewPlaceholders: {
        requiredScreenshotPacketPath: "artifacts/second-district/ontario-candidate/visual-packet",
        lumenAcceptance: {
          owner: "Lumen",
          status: "missing",
          required: true,
        },
        miraAcceptance: {
          owner: "Mira",
          status: "missing",
          required: true,
        },
        forgeSplitGuard: {
          owner: "Forge",
          status: "missing",
          required: true,
        },
      },
    });
    expect(packet.gateSummary.satisfied).toEqual([
      "candidate_contract",
      "place_anchors_with_source_notes",
      "curated_district_pack",
      "bounded_scene_compiler_proof",
    ]);
    expect(packet.evidence).toMatchObject({
      candidateContract: true,
      sourceNotedAnchors: true,
      draftOnlyCuratedPack: true,
      boundedSceneCompilerProof: true,
      desktopMobileScreenshots: false,
      lumenAcceptance: false,
      miraAcceptance: false,
      forgeSplitGuard: false,
    });
    expect(Object.values(packet.noFakePlayability).every((value) => value === true || value === false)).toBe(true);
    expect(packet.noFakePlayability).toMatchObject({
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

  it("uses the same ordered gate list expected by California district candidates", () => {
    expect(DISTRICT_PROMOTION_GATE_ORDER.slice(0, 3)).toEqual([
      "candidate_contract",
      "place_anchors_with_source_notes",
      "curated_district_pack",
    ]);
    expect(DISTRICT_PROMOTION_GATE_ORDER).toEqual(expect.arrayContaining(ontarioCandidate?.requiredBeforePlayable ?? []));
  });
});
