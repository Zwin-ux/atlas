import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DistrictPlaceAnchorPackValidationError,
  parseDistrictCandidatePack,
  parseDistrictPlaceAnchorPack,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const candidatePackPath = resolve(testDir, "../../../data/district_candidate_packs/anaheim-candidate.json");
const anchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioCandidatePackPath = resolve(testDir, "../../../data/district_candidate_packs/ontario-candidate.json");
const ontarioAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/ontario-anchors.json");

describe("DistrictPlaceAnchorPack", () => {
  it.each([
    {
      label: "Anaheim",
      candidatePath: candidatePackPath,
      anchorPath: anchorPackPath,
      expected: {
        countySlug: "orange-ca",
        countyGeoid: "06059",
        districtSlug: "anaheim-candidate",
        districtGeoid: "0602000",
        sourceKinds: ["census", "local-open-data"],
        anchorIds: [
          "anaheim-city-identity",
          "platinum-triangle-area",
          "anaheim-convention-center",
          "artic-transit-center",
          "angel-stadium",
          "downtown-anaheim-community-center",
        ],
        categories: ["home_area", "civic", "transit", "entertainment"],
      },
    },
    {
      label: "Ontario",
      candidatePath: ontarioCandidatePackPath,
      anchorPath: ontarioAnchorPackPath,
      expected: {
        countySlug: "san-bernardino-ca",
        countyGeoid: "06071",
        districtSlug: "ontario-candidate",
        districtGeoid: "0653896",
        sourceKinds: ["census", "curated", "local-open-data"],
        anchorIds: [
          "ontario-city-identity",
          "ontario-inland-residential-variety",
          "ontario-mills-commercial-anchor",
          "ontario-international-airport",
          "ontario-civic-center-core",
          "ontario-downtown-service-core",
        ],
        categories: ["unknown", "home_area", "shop", "transit", "civic", "service"],
      },
    },
  ])("validates source-noted $label anchors without renderable or playable claims", ({ candidatePath, anchorPath, expected }) => {
    const candidatePack = parseDistrictCandidatePack(JSON.parse(readFileSync(candidatePath, "utf8")), candidatePath);
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anchorPath, "utf8")), anchorPath);

    expect(anchorPack).toMatchObject({
      candidatePackId: candidatePack.packId,
      countySlug: expected.countySlug,
      countyGeoid: expected.countyGeoid,
      districtSlug: expected.districtSlug,
      districtGeoid: expected.districtGeoid,
      anchorStatus: "source_noted_nonrenderable",
      playableNow: false,
      renderableNow: false,
    });
    expect(anchorPack.sourceNotes.map((note) => note.source)).toEqual(expect.arrayContaining(expected.sourceKinds));
    expect(anchorPack.placeAnchors).toHaveLength(6);
    expect(anchorPack.placeAnchors.every((anchor) => anchor.providerNormalized === false)).toBe(true);
    expect(anchorPack.placeAnchors.every((anchor) => anchor.renderableNow === false)).toBe(true);
    expect(anchorPack.placeAnchors.every((anchor) => anchor.sceneEligible === false)).toBe(true);
    expect(anchorPack.placeAnchors.map((anchor) => anchor.id)).toEqual(expect.arrayContaining(expected.anchorIds));
    expect(anchorPack.placeAnchors.map((anchor) => anchor.category)).toEqual(expect.arrayContaining(expected.categories));
    expect(anchorPack.requiredBeforePlayable).toEqual(
      expect.arrayContaining([
        "curated_district_pack",
        "place_anchors_with_source_notes",
        "bounded_scene_compiler_proof",
        "desktop_mobile_product_loop_screenshots",
        "lumen_visual_acceptance",
        "mira_readiness_acceptance",
        "forge_split_guard",
      ]),
    );
  });

  it("fails clearly when a place anchor references a missing source note", () => {
    expect(() =>
      parseDistrictPlaceAnchorPack(
        {
          packId: "broken",
          candidatePackId: "anaheim-candidate-pack",
          version: "0",
          stateCode: "CA",
          countySlug: "orange-ca",
          countyGeoid: "06059",
          districtSlug: "anaheim-candidate",
          districtGeoid: "0602000",
          anchorStatus: "source_noted_nonrenderable",
          playableNow: false,
          renderableNow: false,
          sourceNotes: [
            {
              id: "known",
              source: "census",
              label: "Known source",
              attribution: "Known source",
              lastChecked: "2026-07-01",
              verifies: ["identity"],
            },
          ],
          placeAnchors: [
            {
              id: "broken-anchor",
              label: "Broken anchor",
              category: "civic",
              anchorRole: "place_anchor",
              sourceNoteIds: ["missing"],
              sourceFact: "Broken source reference.",
              providerNormalized: false,
              renderableNow: false,
              sceneEligible: false,
              sceneStressors: ["commerce_landmark_read"],
              requiredBeforeRenderable: ["place_source_review"],
            },
          ],
          requiredBeforePlayable: ["place_anchors_with_source_notes"],
          rejectRules: ["must fail"],
        },
        "broken-anchor-pack",
      ),
    ).toThrow(DistrictPlaceAnchorPackValidationError);
  });
});
