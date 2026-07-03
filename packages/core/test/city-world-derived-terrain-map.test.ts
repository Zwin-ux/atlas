import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  deriveCityWorldMobileOcclusion,
  deriveCityWorldTerrainMap,
  evaluateCityWorldMobileLodBudget,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const anaheimAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/anaheim-anchors.json");

describe("CityWorld derived terrain maps", () => {
  it("derives stable height and color maps from the playable Riverside scene", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const terrainMap = deriveCityWorldTerrainMap(scene);
    const expectedCellCount = terrainMap.width * terrainMap.depth;

    expect(terrainMap.type).toBe("cityWorldDerivedTerrainMap");
    expect(terrainMap.source).toBe("CityWorldScene");
    expect(terrainMap.sceneId).toBe(scene.id);
    expect(terrainMap.heightMap).toHaveLength(expectedCellCount);
    expect(terrainMap.colorMap).toHaveLength(expectedCellCount);
    expect(terrainMap.cells).toHaveLength(expectedCellCount);
    expect(terrainMap.metrics.terrainCellCount).toBe(scene.terrainTiles.length);
    expect(terrainMap.metrics.heightRange).toBeGreaterThanOrEqual(1.4);
    expect(terrainMap.metrics.colorKeyCount).toBeGreaterThanOrEqual(12);
    expect(terrainMap.metrics.nonFlatCellRatio).toBeGreaterThanOrEqual(0.55);
    expect(terrainMap.metrics.occupiedCellRatio).toBeGreaterThanOrEqual(0.15);
    expect(terrainMap.metrics.waterEdgeCutRatio).toBeGreaterThanOrEqual(0.6);
    expect(terrainMap.distributions.terrainKinds).toMatchObject({
      grass: expect.any(Number),
      park: expect.any(Number),
      plaza: expect.any(Number),
      water: expect.any(Number),
    });
  });

  it("measures mobile occlusion without crowding the playable tray path", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const mobile = deriveCityWorldMobileOcclusion(scene, "mobile");
    const residentialDetail = deriveCityWorldMobileOcclusion(scene, "residential_detail");
    const mobileBudget = evaluateCityWorldMobileLodBudget(mobile, "playable_mobile", scene);
    const residentialDetailBudget = evaluateCityWorldMobileLodBudget(residentialDetail, "residential_detail_probe", scene);
    const residentialDetailAsPublicMobile = evaluateCityWorldMobileLodBudget(residentialDetail, "playable_mobile", scene);

    expect(mobile.type).toBe("cityWorldMobileOcclusion");
    expect(mobile.sceneId).toBe(scene.id);
    expect(mobile.cameraPresetId).toBe("mobile");
    expect(mobile.counts.terrainTiles).toBeGreaterThan(400);
    expect(mobile.counts.buildings).toBeGreaterThanOrEqual(8);
    expect(mobile.metrics.mobileOcclusionRiskScore).toBeLessThanOrEqual(0.42);
    expect(mobile.metrics.mobileReadabilityScore).toBeGreaterThanOrEqual(0.58);
    expect(mobile.metrics.traySafeBandPressureRatio).toBeLessThanOrEqual(0.5);
    expect(mobileBudget.profileId).toBe("playable_mobile");
    expect(mobileBudget.passed).toBe(true);
    expect(mobileBudget.blockers).toEqual([]);

    expect(residentialDetail.metrics.mobileOcclusionRiskScore).toBeLessThanOrEqual(0.58);
    expect(residentialDetail.metrics.mobileReadabilityScore).toBeGreaterThanOrEqual(0.42);
    expect(residentialDetailBudget.profileId).toBe("residential_detail_probe");
    expect(residentialDetailBudget.passed).toBe(true);
    expect(residentialDetailAsPublicMobile.passed).toBe(false);
    expect(residentialDetailAsPublicMobile.blockers.length).toBeGreaterThan(0);
  });

  it("keeps shell terrain maps empty of fake playable object occupancy", () => {
    const shell = compileCountyShellCityWorldScene({
      countySlug: "orange-ca",
      countyName: "Orange County",
      stateCode: "CA",
      coverage: {
        countySlug: "orange-ca",
        coverageTier: "L1_COUNTY_SHELL",
        coverageLabel: "County shell",
        coverageMessage: "Orange County is indexed, but not playable yet.",
        playable: false,
      },
    });
    const terrainMap = deriveCityWorldTerrainMap(shell);
    const occlusion = deriveCityWorldMobileOcclusion(shell, "mobile");
    const shellBudget = evaluateCityWorldMobileLodBudget(occlusion, "shell_mobile_empty_state", shell);

    expect(shell.coverage?.playable).toBe(false);
    expect(terrainMap.metrics.terrainCellCount).toBe(shell.terrainTiles.length);
    expect(terrainMap.metrics.objectOccupiedCellCount).toBe(0);
    expect(terrainMap.metrics.occupiedCellRatio).toBe(0);
    expect(terrainMap.metrics.colorKeyCount).toBeGreaterThanOrEqual(2);
    expect(occlusion.counts.buildings).toBe(0);
    expect(occlusion.counts.pins).toBe(0);
    expect(occlusion.metrics.mobileOcclusionRiskScore).toBe(0);
    expect(shellBudget.passed).toBe(true);
    expect(shellBudget.blockers).toEqual([]);
  });

  it("derives hidden draft terrain maps without granting playable state", () => {
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const draft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });
    const terrainMap = deriveCityWorldTerrainMap(draft);
    const occlusion = deriveCityWorldMobileOcclusion(draft, "mobile");
    const hiddenDraftBudget = evaluateCityWorldMobileLodBudget(occlusion, "hidden_draft_mobile_probe", draft);

    expect(draft.coverage?.playable).toBe(false);
    expect(draft.actors).toEqual([]);
    expect(draft.pins).toEqual([]);
    expect(terrainMap.metrics.terrainCellCount).toBe(draft.terrainTiles.length);
    expect(terrainMap.metrics.heightRange).toBeGreaterThanOrEqual(0.7);
    expect(terrainMap.metrics.colorKeyCount).toBeGreaterThanOrEqual(8);
    expect(terrainMap.metrics.objectOccupiedCellCount).toBeGreaterThan(0);
    expect(hiddenDraftBudget.passed).toBe(true);
    expect(hiddenDraftBudget.blockers).toEqual([]);
    expect(JSON.stringify(hiddenDraftBudget).toLowerCase()).not.toMatch(/google|maps\.googleapis|publicplayable|promotionready/);
  });
});
