import { describe, expect, it } from "vitest";
import {
  analyzeGeneratedDistrictParity,
  exampleParametricDistrictSpec,
  generateParametricCityWorldScene,
} from "../src/index.js";
import type { CityWorldScene } from "../src/index.js";

function generatedScene(): CityWorldScene {
  return generateParametricCityWorldScene(exampleParametricDistrictSpec()).scene;
}

describe("generated district parity diagnostics (0.58E)", () => {
  it("reports a healthy example district with no empty pads, overhangs, or toy commerce", () => {
    const report = analyzeGeneratedDistrictParity(generatedScene());

    expect(report.counts.emptyPadCount).toBe(0);
    expect(report.padMetrics.lotBuildingFillRatio).toBe(1);
    expect(report.padMetrics.padFootprintFillFloor).toBeGreaterThanOrEqual(0.4);
    expect(report.registrationMetrics.roofOverhangCount).toBe(0);
    expect(report.facadeMetrics.apartmentColumnClearanceFloor).toBeGreaterThanOrEqual(1);
    expect(report.commerceMetrics.stripStoreRatio).toBe(1);
    expect(report.commerceMetrics.toyCommerceCount).toBe(0);
    expect(report.commerceMetrics.commerceStripMinWidth).toBeGreaterThanOrEqual(2.4);
  });

  it("measures screen-lower frame density for the desktop and mobile presets", () => {
    const report = analyzeGeneratedDistrictParity(generatedScene());

    for (const presetId of ["desktop", "mobile"] as const) {
      const band = report.frameDensity[presetId];
      expect(band).toBeDefined();
      expect(band!.buildingsInFrame).toBeGreaterThan(0);
      expect(band!.lowerFrameOccupancyRatio).toBeGreaterThan(0);
      expect(band!.lowerFrameOccupancyRatio).toBeLessThanOrEqual(1);
    }
  });

  it("flags empty pad rings when buildings are stripped from buildable lots", () => {
    const scene = generatedScene();
    const victim = scene.lots.find((lot) => lot.kind === "home");
    expect(victim).toBeDefined();
    scene.buildings = scene.buildings.filter(
      (building) =>
        Math.abs(building.position.x - victim!.position.x) > victim!.width / 2 ||
        Math.abs(building.position.y - victim!.position.y) > victim!.depth / 2,
    );

    const report = analyzeGeneratedDistrictParity(scene);
    expect(report.counts.emptyPadCount).toBeGreaterThan(0);
    expect(report.padMetrics.emptyPadLotIds).toContain(victim!.id);
  });

  it("flags roof/eave drift when a building footprint escapes its lot pad", () => {
    const scene = generatedScene();
    const healthy = analyzeGeneratedDistrictParity(scene);
    const pad = healthy.pads.find((entry) => entry.buildingId);
    const building = scene.buildings.find((entry) => entry.id === pad!.buildingId);
    const lot = scene.lots.find((entry) => entry.id === pad!.lotId);
    building!.width = lot!.width + 1;

    const report = analyzeGeneratedDistrictParity(scene);
    expect(report.registrationMetrics.roofOverhangCount).toBeGreaterThan(0);
    expect(report.registrationMetrics.maxOverhangTiles).toBeGreaterThan(0.4);
  });

  it("flags apartment window columns that would sink below the wall base", () => {
    const scene = generatedScene();
    for (const building of scene.buildings) {
      if (building.kind === "apartment") building.depth = building.height * 2.4;
    }

    const report = analyzeGeneratedDistrictParity(scene);
    expect(report.facadeMetrics.apartmentColumnUnsafeCount).toBeGreaterThan(0);
    expect(report.facadeMetrics.apartmentColumnClearanceFloor).toBeLessThan(1);
  });

  it("flags toy commerce slabs that bypass the strip grammar bar", () => {
    const scene = generatedScene();
    for (const building of scene.buildings) {
      if (building.kind === "shop") building.width = 1.2;
    }

    const report = analyzeGeneratedDistrictParity(scene);
    expect(report.commerceMetrics.toyCommerceCount).toBeGreaterThan(0);
    expect(report.commerceMetrics.commerceStripMinWidth).toBeLessThan(2.4);
  });
});
