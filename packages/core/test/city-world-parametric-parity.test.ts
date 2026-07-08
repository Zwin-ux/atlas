import { describe, expect, it } from "vitest";
import {
  analyzeCityWorldScene,
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

  it("terrain relief keeps water flat, buildings on their block z, and authors drop grammar (0.74F)", () => {
    const scene = generatedScene();
    const tileZ = new Map(scene.terrainTiles.map((tile) => [`${tile.position.x}:${tile.position.y}`, tile.position.z ?? 0]));

    // The sample heightGrid produces real plateaus.
    expect(scene.terrainTiles.some((tile) => (tile.position.z ?? 0) > 0)).toBe(true);
    // Water and its surface never rise.
    for (const tile of scene.terrainTiles.filter((item) => item.kind === "water")) {
      expect(tile.position.z ?? 0).toBe(0);
    }
    // Every building shares its tile's block elevation (no floaters/sinkers).
    for (const building of scene.buildings) {
      const z = tileZ.get(`${Math.round(building.position.x)}:${Math.round(building.position.y)}`);
      expect(building.position.z ?? 0).toBe(z);
    }
    // Drop grammar is consistent with the tile map: a tile claiming a south
    // drop really has a lower south neighbor.
    for (const tile of scene.terrainTiles) {
      const elevation = tile.visualGrammar?.elevation;
      if (!elevation || elevation.dropSides.length === 0) continue;
      for (const side of elevation.dropSides) {
        const dx = side === "east" ? 1 : side === "west" ? -1 : 0;
        const dy = side === "south" ? 1 : side === "north" ? -1 : 0;
        const neighborZ = tileZ.get(`${tile.position.x + dx}:${tile.position.y + dy}`);
        if (neighborZ === undefined) continue;
        expect(neighborZ).toBeLessThan(tile.position.z ?? 0);
      }
    }
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

  it("keeps generated residential zones packed as small-house fabric (0.75C-2)", () => {
    const spec = exampleParametricDistrictSpec();
    const scene = generateParametricCityWorldScene(spec).scene;
    const report = analyzeGeneratedDistrictParity(scene);
    const diagnostics = analyzeCityWorldScene(scene, "playable");
    const residentialArea = spec.zones
      .filter((zone) => zone.kind === "residential")
      .reduce((sum, zone) => sum + (zone.rect.maxX - zone.rect.minX) * (zone.rect.maxY - zone.rect.minY), 0);

    expect(report.residentialRoofMetrics.homeCount).toBeGreaterThanOrEqual(36);
    expect(report.residentialRoofMetrics.homeCount / residentialArea).toBeGreaterThanOrEqual(0.19);
    expect(report.residentialRoofMetrics.unsafeRoofCount).toBe(0);
    expect(diagnostics.metrics.homeClonePressure).toBeLessThanOrEqual(0.3);
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
