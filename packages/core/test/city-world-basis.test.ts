import { describe, expect, it } from "vitest";
import {
  analyzeCityWorldScene,
  cityWorldBuildingTouchesLot,
  cityWorldDiamondPoints,
  cityWorldExpandViewportFrame,
  cityWorldFrameContainsFrame,
  cityWorldLotTouchesRoad,
  cityWorldScreenCenterForCamera,
  cityWorldViewportFrameForScreenCamera,
  cityWorldViewportFrameForPreset,
  compileCityWorldScene,
  projectCityWorldPoint,
  riversideDemoVoxelScene,
  sampleCityWorldViewportForCameraPreset,
  unprojectCityWorldGroundPoint,
} from "../src/index.js";

describe("CityWorld basis and terrain sampler", () => {
  it("projects board points and tile diamonds through a shared 2:1 basis", () => {
    expect(projectCityWorldPoint({ x: 3, y: 1, z: 2 })).toEqual({ x: 44, y: 12 });
    expect(cityWorldDiamondPoints({ x: 0, y: 0 }, 44, 24)).toEqual([0, -12, 22, 0, 0, 12, -22, 0]);
  });

  it("unprojects ground points and builds screen camera frames for pan-safe windows", () => {
    const boardPoint = { x: 6, y: 4, z: 0 };
    const projected = projectCityWorldPoint(boardPoint);
    expect(unprojectCityWorldGroundPoint(projected)).toEqual(boardPoint);

    const frame = cityWorldViewportFrameForScreenCamera({
      x: 640,
      y: 360,
      zoom: 1,
      viewportWidth: 1280,
      viewportHeight: 720,
      paddingPx: 0,
    });
    const bufferedFrame = cityWorldViewportFrameForScreenCamera({
      x: 640,
      y: 360,
      zoom: 1,
      viewportWidth: 1280,
      viewportHeight: 720,
      paddingPx: 220,
    });

    expect(frame).toEqual({ minX: -29.545, maxX: 29.545, minY: -29.545, maxY: 29.545 });
    expect(cityWorldFrameContainsFrame(bufferedFrame, frame)).toBe(true);
    expect(cityWorldFrameContainsFrame(frame, bufferedFrame)).toBe(false);
  });

  it("derives bounded preset frames from a panned screen center", () => {
    const camera = {
      x: 640,
      y: 360,
      zoom: 1,
      viewportWidth: 1280,
      viewportHeight: 720,
    };
    const center = cityWorldScreenCenterForCamera(camera);
    const presetFrame = cityWorldViewportFrameForPreset("desktop", center, camera.zoom);
    const bufferedPresetFrame = cityWorldExpandViewportFrame(presetFrame, 3);

    expect(center).toEqual({ x: 0, y: 0, z: 0 });
    expect(presetFrame).toEqual({ minX: -15, maxX: 15, minY: -10, maxY: 10 });
    expect(bufferedPresetFrame).toEqual({ minX: -18, maxX: 18, minY: -13, maxY: 13 });
    expect(cityWorldFrameContainsFrame(bufferedPresetFrame, presetFrame)).toBe(true);
  });

  it("creates deterministic viewport frames for QA camera presets", () => {
    const center = { x: 10, y: 5, z: 0 };

    expect(cityWorldViewportFrameForPreset("desktop", center, 1)).toEqual({ minX: -5, maxX: 25, minY: -5, maxY: 15 });
    expect(cityWorldViewportFrameForPreset("mobile", center, 1)).toEqual({ minX: 1.5, maxX: 18.5, minY: -8, maxY: 18 });
    expect(cityWorldViewportFrameForPreset("residential_detail", center, 1)).toEqual({ minX: 2.5, maxX: 17.5, minY: -2, maxY: 12 });
  });

  it("samples the same viewport terrain counts that diagnostics report", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const diagnostics = analyzeCityWorldScene(scene);

    for (const preset of scene.cameraPresets) {
      const sample = sampleCityWorldViewportForCameraPreset(scene, preset);
      const metric = diagnostics.metrics.viewportComposition[preset.id];

      expect(metric?.terrainTilesInFrame).toBe(sample.terrainTiles.length);
      expect(metric?.terrainMassingVisibleRatio).toBe(roundMetric(sample.terrainMassingCount / sample.terrainTiles.length));
      expect(metric?.chunkEdgeRatio).toBe(roundMetric(sample.chunkEdgeCount / sample.terrainTiles.length));
      expect(metric?.terrainElevationVisibleRatio).toBe(roundMetric(sample.elevatedTerrainCount / sample.terrainTiles.length));
    }
  });

  it("keeps lot/building and lot/road contact helpers aligned with the playable scene", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);

    expect(scene.buildings.every((building) => scene.lots.some((lot) => cityWorldBuildingTouchesLot(building, lot)))).toBe(true);
    expect(scene.lots.filter((lot) => scene.roadSegments.some((road) => cityWorldLotTouchesRoad(lot, road))).length / scene.lots.length).toBeGreaterThan(0.78);
  });
});

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
