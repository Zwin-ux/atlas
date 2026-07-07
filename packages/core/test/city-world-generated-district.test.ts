import { describe, expect, it } from "vitest";
import {
  compileCityWorldSceneWindow,
  createDeterministicGeneratedDistrictScene,
  createDeterministicGeneratedDistrictSpec,
  evaluateCityWorldSceneWindowBudget,
  US_COUNTY_INDEX,
} from "../src/index.js";

describe("deterministic generated district specs", () => {
  it("compiles repeatable provider-free district specs from Census county identity", () => {
    const cook = county("cook-il");
    const first = createDeterministicGeneratedDistrictSpec({ county: cook });
    const second = createDeterministicGeneratedDistrictSpec({ county: cook });
    const maricopa = createDeterministicGeneratedDistrictSpec({ county: county("maricopa-az") });

    expect(first).toEqual(second);
    expect(first.seed).not.toBe(maricopa.seed);
    expect(first.sourceBasis).toBe("census_identity_only");
    expect(first.providerGeometry).toBe(false);
    expect(first.publicPlayable).toBe(false);
    expect(first.promotionBlocked).toBe(true);
    expect(first.spec.roadSeeds.length).toBeGreaterThanOrEqual(6);
    expect(first.spec.zones.length).toBeGreaterThanOrEqual(9);
  });

  it("produces bounded non-playable scenes that pass generated draft window budgets", () => {
    for (const countySlug of ["cook-il", "miami-dade-fl", "maricopa-az", "riverside-ca"]) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: county(countySlug) });
      const { scene } = result;

      expect(generated.publicPlayable).toBe(false);
      expect(scene.coverage).toMatchObject({
        countySlug,
        coverageTier: "L1_COUNTY_SHELL",
        playable: false,
      });
      expect(scene.terrainTiles.length).toBeGreaterThan(1_200);
      expect(scene.roadSegments.length).toBeGreaterThanOrEqual(6);
      expect(scene.lots.length).toBeGreaterThan(40);
      expect(scene.buildings.length).toBeGreaterThan(35);
      expect(scene.places.length).toBeGreaterThanOrEqual(8);
      expect(scene.pins).toHaveLength(0);
      expect(scene.actors).toHaveLength(0);
      expect(scene.cameraPresets.map((preset) => preset.id)).toEqual(
        expect.arrayContaining(["desktop", "mobile", "residential_detail", "commerce_detail"]),
      );

      for (const cameraId of ["desktop", "mobile"] as const) {
        const window = compileCityWorldSceneWindow(scene, cameraId);
        const budget = evaluateCityWorldSceneWindowBudget(window, "generated_draft_window", scene);
        expect(budget.blockers).toEqual([]);
        expect(budget.passed).toBe(true);
      }
    }
  });
});

function county(countySlug: string) {
  const entry = US_COUNTY_INDEX.find((candidate) => candidate.countySlug === countySlug);
  if (!entry) throw new Error(`Missing test county ${countySlug}`);
  return entry;
}
