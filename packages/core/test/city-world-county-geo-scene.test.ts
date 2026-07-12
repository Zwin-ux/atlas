import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compileCountyGeoScene, type CountyGeoPack } from "../src/voxel/cityWorldCountyGeoScene.js";

const here = dirname(fileURLToPath(import.meta.url));
const geoPacksDir = resolve(here, "../../../data/geo-packs");

function loadPack(slug: string): CountyGeoPack {
  return JSON.parse(readFileSync(resolve(geoPacksDir, `${slug}.json`), "utf8")) as CountyGeoPack;
}

// Bounding-box fill ratio in screen space: how much of the county's projected
// bounding box is land. A near-rectangular county (Loving TX) fills most of
// its box; a jagged/peninsular one (Kalawao HI) fills much less. This proves
// the silhouette reflects the REAL shape, not a generic board.
function fillRatio(scene: ReturnType<typeof compileCountyGeoScene>): number {
  const cells = scene.terrainTiles.map((tile) => ({
    sx: tile.position.x - tile.position.y,
    sy: tile.position.x + tile.position.y,
  }));
  const minX = Math.min(...cells.map((c) => c.sx));
  const maxX = Math.max(...cells.map((c) => c.sx));
  const minY = Math.min(...cells.map((c) => c.sy));
  const maxY = Math.max(...cells.map((c) => c.sy));
  const boxCells = ((maxX - minX) / 2 + 1) * ((maxY - minY) / 2 + 1);
  return scene.terrainTiles.length / boxCells;
}

describe("compileCountyGeoScene", () => {
  it("produces a substantial land board from a real county pack", () => {
    const scene = compileCountyGeoScene(loadPack("miami-dade-fl"));
    expect(scene.type).toBe("cityWorldScene");
    expect(scene.terrainTiles.length).toBeGreaterThan(200);
    expect(scene.label).toBe("Miami-Dade — county map");
    expect(scene.region.state).toBe("FL");
    expect(scene.region.county).toBe("Miami-Dade County");
    // camera fits the whole county within sane zoom bounds
    const desktop = scene.cameraPresets.find((preset) => preset.id === "desktop");
    expect(desktop).toBeDefined();
    expect(desktop!.zoom).toBeGreaterThanOrEqual(desktop!.minZoom);
    expect(desktop!.zoom).toBeLessThanOrEqual(desktop!.maxZoom);
  });

  it("is deterministic — same pack compiles to an identical scene", () => {
    const pack = loadPack("kalawao-hi");
    const a = JSON.stringify(compileCountyGeoScene(pack));
    const b = JSON.stringify(compileCountyGeoScene(pack));
    expect(a).toBe(b);
  });

  it("silhouette reflects the real shape — a rectangular county fills its box more than a peninsular one", () => {
    const loving = fillRatio(compileCountyGeoScene(loadPack("loving-tx"))); // near-rectangle
    const kalawao = fillRatio(compileCountyGeoScene(loadPack("kalawao-hi"))); // peninsula/islands
    expect(loving).toBeGreaterThan(0.7);
    expect(kalawao).toBeLessThan(loving);
  });

  it("handles multi-ring island counties without crashing", () => {
    // Honolulu (6 rings) + Aleutians East Borough (6 rings) are island chains.
    for (const slug of ["honolulu-hi", "aleutians-east-borough-ak"]) {
      const scene = compileCountyGeoScene(loadPack(slug));
      expect(scene.terrainTiles.length).toBeGreaterThan(50);
      expect(Number.isFinite(scene.cameraPresets[0]!.center.x)).toBe(true);
      expect(Number.isFinite(scene.cameraPresets[0]!.center.y)).toBe(true);
    }
  });

  it("frontier and metro counties both produce finite, bounded boards", () => {
    for (const slug of ["loving-tx", "cook-il"]) {
      const scene = compileCountyGeoScene(loadPack(slug));
      expect(scene.bounds.maxX).toBeGreaterThan(scene.bounds.minX);
      expect(scene.bounds.maxY).toBeGreaterThan(scene.bounds.minY);
      for (const tile of scene.terrainTiles) {
        expect(Number.isFinite(tile.position.x)).toBe(true);
        expect(Number.isFinite(tile.position.y)).toBe(true);
      }
    }
  });
});
