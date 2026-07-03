import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DistrictCuratedPackValidationError,
  parseDistrictCuratedPack,
  parseDistrictPlaceAnchorPack,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const curatedPackPath = resolve(testDir, "../../../data/district_curated_packs/anaheim-curated-district-draft.json");
const anchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioCuratedPackPath = resolve(testDir, "../../../data/district_curated_packs/ontario-curated-district-draft.json");
const ontarioAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/ontario-anchors.json");

describe("DistrictCuratedPack", () => {
  it.each([
    {
      label: "Anaheim",
      curatedPath: curatedPackPath,
      anchorPath: anchorPackPath,
      expected: {
        candidatePackId: "anaheim-candidate-pack",
        countySlug: "orange-ca",
        countyGeoid: "06059",
        districtSlug: "anaheim-candidate",
        districtGeoid: "0602000",
        roles: ["district_identity", "mixed_use_area", "destination_landmark", "transit_anchor", "venue_anchor", "civic_anchor"],
      },
    },
    {
      label: "Ontario",
      curatedPath: ontarioCuratedPackPath,
      anchorPath: ontarioAnchorPackPath,
      expected: {
        candidatePackId: "ontario-candidate-pack",
        countySlug: "san-bernardino-ca",
        countyGeoid: "06071",
        districtSlug: "ontario-candidate",
        districtGeoid: "0653896",
        roles: ["district_identity", "mixed_use_area", "destination_landmark", "transit_anchor", "civic_anchor"],
      },
    },
  ])("validates the draft-only $label curated pack without playable claims", ({ curatedPath, anchorPath, expected }) => {
    const curatedPack = parseDistrictCuratedPack(JSON.parse(readFileSync(curatedPath, "utf8")), curatedPath);
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anchorPath, "utf8")), anchorPath);
    const sourceAnchorIds = new Set(anchorPack.placeAnchors.map((anchor) => anchor.id));

    expect(curatedPack).toMatchObject({
      candidatePackId: expected.candidatePackId,
      anchorPackId: anchorPack.packId,
      countySlug: expected.countySlug,
      countyGeoid: expected.countyGeoid,
      districtSlug: expected.districtSlug,
      districtGeoid: expected.districtGeoid,
      promotionStatus: "draft_only",
      currentCoverageTier: "L1_COUNTY_SHELL",
      targetCoverageTier: "L2_CURATED_DISTRICT",
      playableNow: false,
      publicNow: false,
    });
    expect(curatedPack.curatedAnchors).toHaveLength(6);
    expect(curatedPack.curatedAnchors.every((anchor) => sourceAnchorIds.has(anchor.sourceAnchorId))).toBe(true);
    expect(curatedPack.curatedAnchors.every((anchor) => anchor.publicPlaceClaim === false)).toBe(true);
    expect(curatedPack.curatedAnchors.map((anchor) => anchor.role)).toEqual(expect.arrayContaining(expected.roles));
    expect(curatedPack.requiredBeforeL2).toEqual(
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
    expect(curatedPack.promotionBlockers).toEqual(
      expect.arrayContaining([
        "coordinates_or_bounds_missing",
        "provider_category_confidence_missing",
        "public_product_loop_screenshots_missing",
        "visual_acceptance_missing",
        "product_readiness_missing",
        "split_guard_missing",
      ]),
    );
  });

  it("fails clearly when a curated anchor references a missing source note", () => {
    expect(() =>
      parseDistrictCuratedPack(
        {
          packId: "broken-curated-pack",
          candidatePackId: "anaheim-candidate-pack",
          anchorPackId: "anaheim-source-noted-place-anchors",
          version: "0",
          stateCode: "CA",
          countySlug: "orange-ca",
          countyGeoid: "06059",
          districtSlug: "anaheim-candidate",
          districtGeoid: "0602000",
          promotionStatus: "draft_only",
          currentCoverageTier: "L1_COUNTY_SHELL",
          targetCoverageTier: "L2_CURATED_DISTRICT",
          playableNow: false,
          publicNow: false,
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
          curatedAnchors: [
            {
              id: "broken-anchor",
              sourceAnchorId: "anaheim-city-identity",
              label: "Broken anchor",
              category: "civic",
              role: "civic_anchor",
              sceneRole: "broken source reference",
              sourceNoteIds: ["missing"],
              renderPolicy: "draft_only",
              publicPlaceClaim: false,
              requiredBeforePublic: ["source review"],
              sceneStressors: ["commerce_landmark_read"],
            },
          ],
          requiredBeforeL2: ["curated_district_pack"],
          promotionBlockers: ["coordinates_or_bounds_missing"],
          objectKitRequirements: ["must fail"],
          screenshotRequirements: ["must fail"],
          rejectRules: ["must fail"],
        },
        "broken-curated-pack",
      ),
    ).toThrow(DistrictCuratedPackValidationError);
  });
});
