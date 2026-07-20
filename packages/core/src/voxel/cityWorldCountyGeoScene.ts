// 0.78-1 — compile a REAL county board from a TIGER/Line geo pack.
//
// The generated-district engine draws a synthetic ~one-neighborhood board;
// this path instead draws the county's OWN shape: the boundary polygon
// (Census public domain) rasterized into the voxel tile grid so the board
// reads as the actual county (Miami-Dade's coast + bay, Kalawao's cliff
// peninsula, Loving's empty rectangle). Honesty: geometry is real Census
// truth; it is a stylized silhouette, not parcel-level coverage.
//
// Projection: county lon/lat -> UPRIGHT screen space (north up, longitude
// latitude-corrected) -> inverse iso projection to tile (x,y), so the
// isometric renderer paints the county in its true orientation. Land tiles
// fill the interior; real TIGER water (bay/lake/river inside the boundary, and
// the ocean/sea in a margin band just outside it) renders as water tiles;
// everything else outside stays void (backdrop).
import { CITY_WORLD_TILE_BASIS, unprojectCityWorldGroundPoint } from "./cityWorldBasis.js";
import type { CountyTownAnchor } from "../world/countyTownAnchors.js";
import type {
  CityWorldAmbient,
  CityWorldBounds,
  CityWorldCameraPreset,
  CityWorldPoint,
  CityWorldScene,
  CityWorldTerrainKind,
  CityWorldTerrainTile,
} from "./cityWorldTypes.js";

export type CountyGeoPackLod0 = {
  boundaryRings: number[][][]; // [ring][vertex][lon, lat]
  vertexCount: number;
  waterRings?: number[][][]; // [ring][vertex][lon, lat] — bay/ocean/lake/river, real TIGER hydro
  waterVertexCount?: number;
  waterNames?: string[]; // "Florida Bay", "Lk Michigan" — for Phase 2 labels
};

export type CountyGeoPack = {
  packVersion: number;
  geoid: string;
  countySlug: string;
  name: string;
  source: string;
  lod0: CountyGeoPackLod0;
};

export type CompileCountyGeoSceneOptions = {
  /** Target on-screen width of the county in projected px; controls board scale. */
  targetSpanPx?: number;
  /** Land-tile sampling stride in projected px (smaller = denser silhouette). */
  samplePx?: number;
  /** Real Census place centers to render as tappable county-board anchors. */
  townAnchors?: CountyTownAnchor[];
};

// The default span stays at the owner-approved presentation (560): density
// experiments at 880/1232 (0.78-D2) bought real coastline fidelity but made
// tiles read fine-grained and dropped the default frame below the label
// zoom-gate — the wrong trade at the DEFAULT view. The density levers stay
// available: packs now carry 3x vertex budgets (rich source geometry for any
// span), zoom floors are unlocked below, and `options.targetSpanPx` lets the
// LOD1 era raise density when real roads/places give the fine tiles meaning.
// Measured headroom for that era: 40/1600 Graphics, 6.2ms/350ms rebuilds.
const DEFAULT_TARGET_SPAN_PX = 560;
const DEFAULT_SAMPLE_PX = CITY_WORLD_TILE_BASIS.tileWidth / 2; // one land tile per iso cell
const DESKTOP_BOARD_TARGET_WIDTH_PX = 1120;
const DESKTOP_BOARD_TARGET_HEIGHT_PX = 620;
const MOBILE_BOARD_TARGET_WIDTH_PX = 340;
const MOBILE_BOARD_TARGET_HEIGHT_PX = 560;

type ScreenPoint = { x: number; y: number };

/** lon/lat -> upright screen space (east +x, north -y), latitude-corrected. */
function toScreen(lon: number, lat: number, lon0: number, lat0: number, scale: number): ScreenPoint {
  const latCos = Math.cos((lat0 * Math.PI) / 180);
  return {
    x: (lon - lon0) * latCos * scale,
    y: -(lat - lat0) * scale,
  };
}

/** Even-odd ray cast against a single ring in screen space. */
function pointInRing(point: ScreenPoint, ring: ScreenPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]!;
    const b = ring[j]!;
    const intersects = a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** County rings are separate landmasses (islands), not holes — inside ANY ring is land. */
function pointInCounty(point: ScreenPoint, rings: ScreenPoint[][]): boolean {
  for (const ring of rings) {
    if (pointInRing(point, ring)) return true;
  }
  return false;
}

/**
 * Even-odd fill across ALL water rings together. Unlike land, a sea polygon
 * punches out the islands it surrounds as interior HOLES (Oahu is a hole in
 * the Pacific, not separate water) — the union rule would flood those islands.
 * Even-odd: inside an odd number of rings = water, so an island-in-a-sea
 * (inside outer + inside hole = 2 = even) correctly reads as land.
 */
function pointInWater(point: ScreenPoint, rings: ScreenPoint[][]): boolean {
  let crossings = 0;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const a = ring[i]!;
      const b = ring[j]!;
      if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) {
        crossings += 1;
      }
    }
  }
  return crossings % 2 === 1;
}

function ringSignedArea(ring: ScreenPoint[]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]!;
    const b = ring[j]!;
    area += b.x * a.y - a.x * b.y;
  }
  return area / 2;
}

function ringCentroid(ring: ScreenPoint[]): ScreenPoint {
  let cx = 0;
  let cy = 0;
  let signed = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i]!;
    const b = ring[j]!;
    const cross = b.x * a.y - a.x * b.y;
    cx += (b.x + a.x) * cross;
    cy += (b.y + a.y) * cross;
    signed += cross;
  }
  if (Math.abs(signed) < 1e-9) {
    // Degenerate ring: fall back to vertex mean.
    const mean = ring.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: mean.x / ring.length, y: mean.y / ring.length };
  }
  return { x: cx / (3 * signed), y: cy / (3 * signed) };
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// FIPS state code (first 2 GEOID digits) -> USPS abbreviation, for the
// region label. Honest: the state a county belongs to is Census identity.
const FIPS_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY", "72": "PR",
};

function stateFromGeoid(geoid: string): string {
  return FIPS_STATE[geoid.slice(0, 2)] ?? "US";
}

/**
 * Compile a county geo pack into a CityWorldScene whose terrain silhouette is
 * the real county shape. Deterministic: same pack -> identical scene.
 */
export function compileCountyGeoScene(pack: CountyGeoPack, options: CompileCountyGeoSceneOptions = {}): CityWorldScene {
  const targetSpanPx = options.targetSpanPx ?? DEFAULT_TARGET_SPAN_PX;
  const samplePx = options.samplePx ?? DEFAULT_SAMPLE_PX;

  const rings = pack.lod0.boundaryRings;
  const allVertices = rings.flat();
  const lon0 = allVertices.reduce((sum, v) => sum + (v[0] ?? 0), 0) / allVertices.length;
  const lat0 = allVertices.reduce((sum, v) => sum + (v[1] ?? 0), 0) / allVertices.length;

  // Project every ring at unit scale.
  const unitRings = rings.map((ring) => ring.map((vertex) => toScreen(vertex[0] ?? 0, vertex[1] ?? 0, lon0, lat0, 1)));

  // Anchor the board on the LARGEST landmass, not the union of all rings:
  // island-chain counties (Honolulu spans the Hawaiian atolls ~2000km;
  // Aleutians span the arc) would otherwise shrink the populous main island
  // to a sub-sample dot and render empty. Scale + window follow the main
  // ring; a far ring is kept only if it sits within ~2.5× the main span of
  // the main centroid (the local cluster), so nearby islands still appear.
  const mainUnitRing = unitRings.reduce<ScreenPoint[]>(
    (largest, ring) => (Math.abs(ringSignedArea(ring)) > Math.abs(ringSignedArea(largest)) ? ring : largest),
    unitRings[0] ?? [],
  );
  const mainCentroidUnit = ringCentroid(mainUnitRing);
  const mainExtent = mainUnitRing.reduce(
    (box, p) => ({
      minX: Math.min(box.minX, p.x),
      maxX: Math.max(box.maxX, p.x),
      minY: Math.min(box.minY, p.y),
      maxY: Math.max(box.maxY, p.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const mainSpan = Math.max(mainExtent.maxX - mainExtent.minX, mainExtent.maxY - mainExtent.minY) || 1;
  const clusterRadius = mainSpan * 2.5;
  const localUnitRings = unitRings.filter((ring) => {
    const c = ringCentroid(ring);
    return Math.hypot(c.x - mainCentroidUnit.x, c.y - mainCentroidUnit.y) <= clusterRadius;
  });

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const ring of localUnitRings) {
    for (const p of ring) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  const unitSpan = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = targetSpanPx / unitSpan;

  // One board build at a given scale: rescale rings, walk the iso tile
  // lattice, classify tiles. Extracted so water-dominant legal polygons (San
  // Francisco extends miles into the Pacific; Nantucket's polygon is mostly
  // sound) can run a SECOND pass normalized to the land extent — otherwise
  // the actual land renders as a dot lost in legal-boundary water.
  const cell = Math.max(1, Math.round(samplePx / (CITY_WORLD_TILE_BASIS.tileWidth / 2))); // tile-units per step
  const buildBoard = (boardScale: number, latticeBoundsPx?: { minX: number; minY: number; maxX: number; maxY: number }) => {
    const screenRings = localUnitRings.map((ring) => ring.map((p) => ({ x: p.x * boardScale, y: p.y * boardScale })));
    // Project the pack's water rings with the SAME transform (same lon0/lat0/
    // scale) so bay/lake/river/ocean polygons register against the exact tile
    // lattice as the land boundary. Water far from the anchored main landmass
    // (island-chain counties) simply projects off-board and is never tested.
    const waterScreenRings = (pack.lod0.waterRings ?? []).map((ring) =>
      ring.map((v) => toScreen(v[0] ?? 0, v[1] ?? 0, lon0, lat0, boardScale)),
    );
    const hasWater = waterScreenRings.length > 0;

    // Iterate the iso TILE lattice directly (one tile per cell — solid fill,
    // no overlap, no aliasing) and keep the tiles whose projected center lands
    // inside the county polygon. `samplePx` controls tile granularity: one iso
    // cell is tileWidth px wide, so a stride of tileWidth ≈ 1 tile per cell.
    const boundsPx = latticeBoundsPx ?? {
      minX: minX * boardScale,
      minY: minY * boardScale,
      maxX: maxX * boardScale,
      maxY: maxY * boardScale,
    };
    const cornerTiles = [
      unprojectCityWorldGroundPoint({ x: boundsPx.minX, y: boundsPx.minY }),
      unprojectCityWorldGroundPoint({ x: boundsPx.maxX, y: boundsPx.minY }),
      unprojectCityWorldGroundPoint({ x: boundsPx.minX, y: boundsPx.maxY }),
      unprojectCityWorldGroundPoint({ x: boundsPx.maxX, y: boundsPx.maxY }),
    ];
    const loTileX = Math.floor(Math.min(...cornerTiles.map((t) => t.x)));
    const hiTileX = Math.ceil(Math.max(...cornerTiles.map((t) => t.x)));
    const loTileY = Math.floor(Math.min(...cornerTiles.map((t) => t.y)));
    const hiTileY = Math.ceil(Math.max(...cornerTiles.map((t) => t.y)));

    // Sea margin: extend the lattice a few tiles past the land bbox so the ocean
    // or bay that FRAMES a coastal county (water baked with a margin-expanded
    // clip) renders as surrounding sea, not a bare green cutout. Inland counties
    // have no water out here, so their board stays tight to the land.
    const seaMargin = hasWater
      ? Math.min(8, Math.max(3, Math.round((((hiTileX - loTileX) + (hiTileY - loTileY)) / 2) * 0.14)))
      : 0;
    const loTileXM = loTileX - seaMargin * cell;
    const hiTileXM = hiTileX + seaMargin * cell;
    const loTileYM = loTileY - seaMargin * cell;
    const hiTileYM = hiTileY + seaMargin * cell;

    const terrainTiles: CityWorldTerrainTile[] = [];
    let tileMinX = Infinity;
    let tileMaxX = -Infinity;
    let tileMinY = Infinity;
    let tileMaxY = -Infinity;
    let variant = 0;
    let waterTileCount = 0;
    let grassCount = 0;
    const grassPx = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (let ty = loTileYM; ty <= hiTileYM; ty += cell) {
      for (let tx = loTileXM; tx <= hiTileXM; tx += cell) {
        // project tile center to screen and classify against the upright polygons
        const sx = (tx - ty) * (CITY_WORLD_TILE_BASIS.tileWidth / 2);
        const sy = (tx + ty) * (CITY_WORLD_TILE_BASIS.tileHeight / 2);
        const inLand = pointInCounty({ x: sx, y: sy }, screenRings);
        const inWater = hasWater && pointInWater({ x: sx, y: sy }, waterScreenRings);
        let kind: CityWorldTerrainKind;
        if (inLand) {
          kind = inWater ? "water" : "grass"; // bay/lake/river inside the county
        } else if (inWater) {
          kind = "water"; // surrounding sea in the margin
        } else {
          continue; // outside both land and water — off-board void backdrop
        }
        if (kind === "water") waterTileCount += 1;
        if (kind === "grass") {
          grassCount += 1;
          // Upright-space bbox of dry land, used to detect water-dominant
          // legal polygons and re-frame the board on the land itself.
          grassPx.minX = Math.min(grassPx.minX, sx);
          grassPx.maxX = Math.max(grassPx.maxX, sx);
          grassPx.minY = Math.min(grassPx.minY, sy);
          grassPx.maxY = Math.max(grassPx.maxY, sy);
        }
        terrainTiles.push({
          id: `county-tile-${terrainTiles.length}`,
          kind,
          position: { x: tx, y: ty, z: 0 },
          width: cell,
          depth: cell,
          variant: variant % 4,
          ...(kind === "grass" ? { paletteKey: "terrain.region.county_map" } : {}),
          // Land reads as a RAISED plateau (cliff faces + drop shadow) so the
          // county silhouette separates from the same-green off-board void; water
          // stays flat at sea level, so the land/water step forms a natural shore.
          ...(kind === "grass"
            ? { visualGrammar: { terrainElevation: "raised_parcel_shelf" as const, contactProfile: "soft_ground_shadow" as const } }
            : {}),
        });
        variant += 1;
        tileMinX = Math.min(tileMinX, tx);
        tileMaxX = Math.max(tileMaxX, tx);
        tileMinY = Math.min(tileMinY, ty);
        tileMaxY = Math.max(tileMaxY, ty);
      }
    }
    return { screenRings, terrainTiles, waterTileCount, grassCount, grassPx, tileMinX, tileMaxX, tileMinY, tileMaxY };
  };

  let boardScale = scale;
  let board = buildBoard(boardScale);
  // Land-normalized second pass: when the dry land occupies a small slice of
  // the legal-boundary board (water-dominant polygons), rebuild the lattice
  // around the land extent so the county's LAND fills the frame with a sea
  // band around it. Deterministic — pure function of the pack.
  const grassSpanPx = Math.max(board.grassPx.maxX - board.grassPx.minX, board.grassPx.maxY - board.grassPx.minY);
  if (board.grassCount > 0 && Number.isFinite(grassSpanPx) && grassSpanPx > 0 && grassSpanPx < targetSpanPx * 0.5) {
    const boost = Math.min(3.5, (targetSpanPx * 0.85) / grassSpanPx);
    boardScale = scale * boost;
    board = buildBoard(boardScale, {
      minX: board.grassPx.minX * boost,
      minY: board.grassPx.minY * boost,
      maxX: board.grassPx.maxX * boost,
      maxY: board.grassPx.maxY * boost,
    });
  }
  const screenRings = board.screenRings;
  const terrainTiles = board.terrainTiles;
  const waterTileCount = board.waterTileCount;
  const tileMinX = board.tileMinX;
  const tileMaxX = board.tileMaxX;
  const tileMinY = board.tileMinY;
  const tileMaxY = board.tileMaxY;

  // Camera fitting must use the actual projected terrain footprint. The old
  // tile-axis span heuristic cropped wide and tall counties on 390px screens.
  const projectedBounds = terrainTiles.reduce(
    (box, tile) => {
      const tileWidth = tile.width ?? 1;
      const tileDepth = tile.depth ?? 1;
      const sx = (tile.position.x - tile.position.y) * (CITY_WORLD_TILE_BASIS.tileWidth / 2);
      const sy = (tile.position.x + tile.position.y) * (CITY_WORLD_TILE_BASIS.tileHeight / 2);
      const halfWidth = ((tileWidth + tileDepth) * CITY_WORLD_TILE_BASIS.tileWidth) / 4;
      const halfHeight = ((tileWidth + tileDepth) * CITY_WORLD_TILE_BASIS.tileHeight) / 4;
      return {
        minX: Math.min(box.minX, sx - halfWidth),
        maxX: Math.max(box.maxX, sx + halfWidth),
        minY: Math.min(box.minY, sy - halfHeight),
        maxY: Math.max(box.maxY, sy + halfHeight),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  const projectedCenter = {
    x: (projectedBounds.minX + projectedBounds.maxX) / 2,
    y: (projectedBounds.minY + projectedBounds.maxY) / 2,
  };
  const centerGround = unprojectCityWorldGroundPoint(projectedCenter);
  const center: CityWorldPoint = { x: round3(centerGround.x), y: round3(centerGround.y), z: 0 };
  // Size both presets from projected pixels rather than tile-space axes.
  // Fill the frame with the county — the real silhouette is jagged and sits in
  // an off-board void, so err toward zooming IN (a small county should not read
  // as a dot lost in green). Clamped so a big county still fits.
  const projectedWidth = Math.max(1, projectedBounds.maxX - projectedBounds.minX);
  const projectedHeight = Math.max(1, projectedBounds.maxY - projectedBounds.minY);
  // Zoom floors dropped with the denser lattice (bigger projected span at
  // the same on-screen size needs smaller zooms to fit the frame).
  const desktopZoom = round3(
    Math.min(1.5, Math.max(0.28, Math.min(DESKTOP_BOARD_TARGET_WIDTH_PX / projectedWidth, DESKTOP_BOARD_TARGET_HEIGHT_PX / projectedHeight))),
  );
  const mobileZoom = round3(
    Math.min(1.3, Math.max(0.24, Math.min(MOBILE_BOARD_TARGET_WIDTH_PX / projectedWidth, MOBILE_BOARD_TARGET_HEIGHT_PX / projectedHeight))),
  );

  // Wider maxZoom so "select town" can pull into detail; minZoom keeps full-county fit.
  const cameraPresets: CityWorldCameraPreset[] = [
    { id: "desktop", center, zoom: desktopZoom, minZoom: 0.26, maxZoom: 2.6 },
    { id: "mobile", center, zoom: mobileZoom, minZoom: 0.22, maxZoom: 2.4 },
  ];

  const bounds: CityWorldBounds = {
    minX: round3(tileMinX),
    maxX: round3(tileMaxX),
    minY: round3(tileMinY),
    maxY: round3(tileMaxY),
  };

  const ambient: CityWorldAmbient = {
    timeOfDay: "midday",
    activity: "calm",
    traffic: 0,
    residents: 0,
    clouds: 0,
    waterShimmer: waterTileCount > 0 ? 0.4 : 0,
  };

  const displayName = pack.name.replace(/\s+(County|Parish|Borough|Municipio|Census Area|City and Borough)$/i, "");
  const sceneId = `county-geo-${pack.countySlug}`;
  const places = compileCountyTownPlaces({
    anchors: options.townAnchors ?? [],
    displayName,
    lon0,
    lat0,
    scale: boardScale,
    screenRings,
    terrainTiles,
  });

  return {
    type: "cityWorldScene",
    id: sceneId,
    sourceSceneId: sceneId,
    label: `${displayName} — county map`,
    region: {
      country: "United States",
      state: stateFromGeoid(pack.geoid),
      county: pack.name,
      district: displayName,
    },
    bounds,
    cameraPresets,
    terrainTiles,
    roadSegments: [],
    lots: [],
    buildings: [],
    props: [],
    places,
    pins: [],
    actors: [],
    ambient,
    hudDefaults: {
      locationLabel: pack.name,
      districtLabel: displayName,
      selectedPlaceId: places[0]?.id ?? "",
    },
    // The census board's land plateau is mid-green; the default light host
    // background is also green, so the silhouette used to melt into the
    // void. A warm parchment table separates it in light theme; dark theme
    // already reads (owner-approved cells) so it keeps the host tone.
    boardBackdrop: { light: "#b3ac93", dark: "#22251f" },
    geoProjection: { lon0, lat0, boardScale },
  };
}

function compileCountyTownPlaces(input: {
  anchors: CountyTownAnchor[];
  displayName: string;
  lon0: number;
  lat0: number;
  scale: number;
  screenRings: ScreenPoint[][];
  terrainTiles: CityWorldTerrainTile[];
}): CityWorldScene["places"] {
  const landTiles = input.terrainTiles.filter((tile) => tile.kind === "grass");
  return input.anchors
    .map((anchor, index) => {
      const screen = toScreen(anchor.longitude, anchor.latitude, input.lon0, input.lat0, input.scale);
      if (!pointInCounty(screen, input.screenRings)) return null;
      const ground = unprojectCityWorldGroundPoint(screen);
      const nearestLand = landTiles.reduce<CityWorldTerrainTile | undefined>((nearest, tile) => {
        if (!nearest) return tile;
        const nearestDistance = Math.hypot(nearest.position.x - ground.x, nearest.position.y - ground.y);
        const tileDistance = Math.hypot(tile.position.x - ground.x, tile.position.y - ground.y);
        return tileDistance < nearestDistance ? tile : nearest;
      }, undefined);
      if (!nearestLand) return null;

      return {
        id: `town-anchor-${anchor.censusPlaceGeoid}`,
        label: anchor.label,
        kind: "landmark" as const,
        districtId: input.displayName,
        nodeId: `census-place-${anchor.censusPlaceGeoid}`,
        anchor: { ...nearestLand.position },
        hitRadius: 3,
        description:
          "Real U.S. Census place name and center on the county board. Streets and buildings are not mapped in this view.",
        activity: 0,
        // Higher priority for larger towns (index 0 first); keeps zoom-label budgets useful past 6 anchors.
        labelPriority: Math.max(1, 24 - index),
      };
    })
    .filter((place): place is NonNullable<typeof place> => Boolean(place));
}
