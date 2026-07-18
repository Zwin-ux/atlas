import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CITY_WORLD_TILE_BASIS } from "../src/voxel/cityWorldBasis.js";
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

function projectedTerrainFootprint(scene: ReturnType<typeof compileCountyGeoScene>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  const bounds = scene.terrainTiles.reduce(
    (box, tile) => {
      const width = tile.width ?? 1;
      const depth = tile.depth ?? 1;
      const sx = (tile.position.x - tile.position.y) * (CITY_WORLD_TILE_BASIS.tileWidth / 2);
      const sy = (tile.position.x + tile.position.y) * (CITY_WORLD_TILE_BASIS.tileHeight / 2);
      const halfWidth = ((width + depth) * CITY_WORLD_TILE_BASIS.tileWidth) / 4;
      const halfHeight = ((width + depth) * CITY_WORLD_TILE_BASIS.tileHeight) / 4;
      return {
        minX: Math.min(box.minX, sx - halfWidth),
        maxX: Math.max(box.maxX, sx + halfWidth),
        minY: Math.min(box.minY, sy - halfHeight),
        maxY: Math.max(box.maxY, sy + halfHeight),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  return { ...bounds, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY };
}

describe("compileCountyGeoScene", () => {
  it("produces a substantial land board from a real county pack", () => {
    const scene = compileCountyGeoScene(loadPack("miami-dade-fl"));
    expect(scene.type).toBe("cityWorldScene");
    expect(scene.terrainTiles.length).toBeGreaterThan(200);
    expect(scene.label).toBe("Miami-Dade — county map");
    expect(scene.region.state).toBe("FL");
    expect(scene.region.county).toBe("Miami-Dade County");
    expect(scene.terrainTiles.filter((tile) => tile.kind === "grass").every((tile) => tile.paletteKey === "terrain.region.county_map")).toBe(true);
    expect(scene.terrainTiles.filter((tile) => tile.kind === "water").every((tile) => tile.paletteKey !== "terrain.region.county_map")).toBe(true);
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

  it("fits the full projected county footprint in certified desktop and mobile frames", () => {
    for (const slug of ["miami-dade-fl", "loving-tx", "kalawao-hi"]) {
      const scene = compileCountyGeoScene(loadPack(slug));
      const footprint = projectedTerrainFootprint(scene);
      const desktop = scene.cameraPresets.find((preset) => preset.id === "desktop")!;
      const mobile = scene.cameraPresets.find((preset) => preset.id === "mobile")!;
      const desktopCenterX = (desktop.center.x - desktop.center.y) * (CITY_WORLD_TILE_BASIS.tileWidth / 2);
      const desktopCenterY = (desktop.center.x + desktop.center.y) * (CITY_WORLD_TILE_BASIS.tileHeight / 2);
      const footprintCenterX = (footprint.minX + footprint.maxX) / 2;
      const footprintCenterY = (footprint.minY + footprint.maxY) / 2;

      expect(footprint.width * desktop.zoom).toBeLessThanOrEqual(1120.5);
      expect(footprint.height * desktop.zoom).toBeLessThanOrEqual(620.5);
      expect(footprint.width * mobile.zoom).toBeLessThanOrEqual(340.5);
      expect(footprint.height * mobile.zoom).toBeLessThanOrEqual(560.5);
      expect(desktopCenterX).toBeCloseTo(footprintCenterX, 1);
      expect(desktopCenterY).toBeCloseTo(footprintCenterY, 1);
      expect(mobile.center).toEqual(desktop.center);
    }
  });

  it("re-frames water-dominant legal polygons on the land (San Francisco)", () => {
    // SF's legal county boundary extends miles into the Pacific/Bay, so a
    // single-pass board rendered the city as a dot lost in legal-boundary
    // water. The land-normalized second pass must make dry land carry the
    // board: the grass extent spans a healthy fraction of the terrain
    // footprint and the lattice is fine enough to read as a real place.
    const scene = compileCountyGeoScene(loadPack("san-francisco-ca"));
    const counts = tileKindCounts(scene);
    expect(counts.grass).toBeGreaterThan(120);
    expect(counts.water).toBeGreaterThan(40);

    const grassTiles = scene.terrainTiles.filter((tile) => tile.kind === "grass");
    const span = (tiles: typeof grassTiles) => {
      const xs = tiles.map((tile) => (tile.position.x - tile.position.y) * (CITY_WORLD_TILE_BASIS.tileWidth / 2));
      const ys = tiles.map((tile) => (tile.position.x + tile.position.y) * (CITY_WORLD_TILE_BASIS.tileHeight / 2));
      return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    };
    const grassSpan = span(grassTiles);
    const boardSpan = span(scene.terrainTiles);
    expect(grassSpan / boardSpan).toBeGreaterThan(0.45);
  });
});
