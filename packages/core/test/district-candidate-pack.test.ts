import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  FIRST_CALIFORNIA_SECOND_DISTRICT_CANDIDATE,
  DistrictCandidatePackValidationError,
  parseDistrictCandidatePack,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const anaheimPackPath = resolve(testDir, "../../../data/district_candidate_packs/anaheim-candidate.json");
const ontarioPackPath = resolve(testDir, "../../../data/district_candidate_packs/ontario-candidate.json");

describe("DistrictCandidatePack", () => {
  it("validates the Anaheim candidate without playable or renderable claims", () => {
    const pack = parseDistrictCandidatePack(JSON.parse(readFileSync(anaheimPackPath, "utf8")), anaheimPackPath);
    const indexedCandidate = FIRST_CALIFORNIA_SECOND_DISTRICT_CANDIDATE;

    expect(pack).toMatchObject({
      countySlug: "orange-ca",
      countyGeoid: "06059",
      districtSlug: "anaheim-candidate",
      districtGeoid: "0602000",
      candidateStatus: "candidate_only",
      currentCoverageTier: "L1_COUNTY_SHELL",
      targetCoverageTier: "L2_CURATED_DISTRICT",
      playableNow: false,
      promotionBlocked: true,
    });
    expect(pack).toMatchObject({
      countySlug: indexedCandidate.countySlug,
      countyGeoid: indexedCandidate.countyGeoid,
      districtSlug: indexedCandidate.districtSlug,
      districtGeoid: indexedCandidate.districtGeoid,
    });
    expect(pack.sourceNotes.map((note) => note.source)).toEqual(expect.arrayContaining(["census", "curated"]));
    expect(pack.anchorRequirements.every((anchor) => anchor.renderableNow === false)).toBe(true);
    expect(pack.anchorRequirements.map((anchor) => anchor.category)).toEqual(
      expect.arrayContaining(["home_area", "shop", "food_drink", "landmark", "transit"]),
    );
    expect(pack.requiredBeforePlayable).toEqual(
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
    expect(CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((candidate) => candidate.districtSlug === pack.districtSlug)?.playableNow).toBe(false);
  });

  it("validates the Ontario candidate without playable or renderable claims", () => {
    const pack = parseDistrictCandidatePack(JSON.parse(readFileSync(ontarioPackPath, "utf8")), ontarioPackPath);
    const indexedCandidate = CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((candidate) => candidate.districtSlug === "ontario-candidate");

    expect(indexedCandidate).toBeDefined();
    expect(pack).toMatchObject({
      countySlug: "san-bernardino-ca",
      countyGeoid: "06071",
      districtSlug: "ontario-candidate",
      districtGeoid: "0653896",
      candidateStatus: "candidate_only",
      currentCoverageTier: "L1_COUNTY_SHELL",
      targetCoverageTier: "L2_CURATED_DISTRICT",
      playableNow: false,
      promotionBlocked: true,
    });
    expect(pack).toMatchObject({
      countySlug: indexedCandidate?.countySlug,
      countyGeoid: indexedCandidate?.countyGeoid,
      districtSlug: indexedCandidate?.districtSlug,
      districtGeoid: indexedCandidate?.districtGeoid,
    });
    expect(pack.sourceNotes.map((note) => note.source)).toEqual(expect.arrayContaining(["census", "curated"]));
    expect(pack.anchorRequirements.every((anchor) => anchor.renderableNow === false)).toBe(true);
    expect(pack.anchorRequirements.map((anchor) => anchor.category)).toEqual(
      expect.arrayContaining(["home_area", "service", "food_drink", "fitness", "transit"]),
    );
    expect(pack.requiredBeforePlayable).toEqual(
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
    expect(indexedCandidate?.playableNow).toBe(false);
  });

  it("fails clearly when an anchor references a missing source note", () => {
    expect(() =>
      parseDistrictCandidatePack(
        {
          packId: "broken",
          version: "0",
          stateCode: "CA",
          countySlug: "orange-ca",
          countyGeoid: "06059",
          districtSlug: "anaheim-candidate",
          districtLabel: "Anaheim",
          districtGeoid: "0602000",
          candidateStatus: "candidate_only",
          currentCoverageTier: "L1_COUNTY_SHELL",
          targetCoverageTier: "L2_CURATED_DISTRICT",
          playableNow: false,
          promotionBlocked: true,
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
          anchorRequirements: [
            {
              id: "broken-anchor",
              label: "Broken anchor",
              category: "home_area",
              anchorKind: "area_role",
              sourceNoteIds: ["missing"],
              renderableNow: false,
              requiredForPlayable: true,
              sceneStressors: ["residential_variety"],
            },
          ],
          requiredBeforePlayable: ["curated_district_pack"],
          knownGaps: ["no_curated_places"],
          acceptanceCriteria: ["must pass"],
          rejectRules: ["must fail"],
        },
        "broken-pack",
      ),
    ).toThrow(DistrictCandidatePackValidationError);
  });
});
