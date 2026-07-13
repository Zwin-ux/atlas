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
// bounding box is LAND (grass). A near-rectangular county (Loving TX) fills
// most of its box; a jagged/peninsular one (Kalawao HI) fills much less. This
// proves the silhouette reflects the REAL shape, not a generic board. Grass
// only — the surrounding sea margin must not inflate the land silhouette.
function fillRatio(scene: ReturnType<typeof compileCountyGeoScene>): number {
  const landTiles = scene.terrainTiles.filter((tile) => tile.kind === "grass");
  const cells = landTiles.map((tile) => ({
    sx: tile.position.x - tile.position.y,
    sy: tile.position.x + tile.position.y,
  }));
  const minX = Math.min(...cells.map((c) => c.sx));
  const maxX = Math.max(...cells.map((c) => c.sx));
  const minY = Math.min(...cells.map((c) => c.sy));
  const maxY = Math.max(...cells.map((c) => c.sy));
  const boxCells = ((maxX - minX) / 2 + 1) * ((maxY - minY) / 2 + 1);
  return landTiles.length / boxCells;
}

function tileKindCounts(scene: ReturnType<typeof compileCountyGeoScene>): { grass: number; water: number; total: number } {
  const grass = scene.terrainTiles.filter((tile) => tile.kind === "grass").length;
  const water = scene.terrainTiles.filter((tile) => tile.kind === "water").length;
  return { grass, water, total: scene.terrainTiles.length };
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

  it("classifies real water — coastal counties have substantial water, dry ones almost none", () => {
    const miami = tileKindCounts(compileCountyGeoScene(loadPack("miami-dade-fl")));
    const cook = tileKindCounts(compileCountyGeoScene(loadPack("cook-il")));
    const loving = tileKindCounts(compileCountyGeoScene(loadPack("loving-tx")));
    // Miami-Dade (Florida Bay + Atlantic) and Cook (Lake Michigan) are heavily coastal.
    expect(miami.water / miami.total).toBeGreaterThan(0.2);
    expect(cook.water / cook.total).toBeGreaterThan(0.3);
    // Loving TX is bone-dry except a thread of the Pecos.
    expect(loving.water / loving.total).toBeLessThan(0.1);
    // Water present => shimmer on; effectively-dry board keeps it modest.
    expect(compileCountyGeoScene(loadPack("miami-dade-fl")).ambient.waterShimmer).toBeGreaterThan(0);
  });

  it("island-in-a-sea reads as land, not flooded — even-odd hole fill (Honolulu regression)", () => {
    // The Pacific polygon punches Oahu out as an interior hole; a naive union
    // fill floods the island. Honolulu must keep a substantial LAND body AND a
    // surrounding sea — not near-100% water.
    const honolulu = tileKindCounts(compileCountyGeoScene(loadPack("honolulu-hi")));
    expect(honolulu.grass).toBeGreaterThan(80);
    expect(honolulu.water).toBeGreaterThan(40);
    expect(honolulu.water / honolulu.total).toBeLessThan(0.85);
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
