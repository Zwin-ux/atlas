// 0.78-R Lane A1 — compile baked road chunks into county-board road segments.
//
// Chunks arrive in the frozen bake basis (atlas-county-equirect-v1: quantised
// metres from the manifest's bbox-centre origin). The county board was
// projected from lon/lat with its OWN vertex-mean origin and board scale
// (scene.geoProjection). The two origins never need to agree: each chunk
// vertex is inverse-projected to lon/lat with the BAKE origin, then forward-
// projected with the SCENE transform, so roads register against the exact
// tile lattice the silhouette rasterized into.
//
// Road Art Contract discipline (docs/0.78R_ROAD_ART_CONTRACT.md): output is
// CityWorldRoadSegment (the house road grammar the renderer already draws) —
// never raw polylines; class hierarchy is expressed through width and kind;
// sub-minimum runs are DROPPED, not collapsed into noise.
import { unprojectCityWorldGroundPoint } from "./cityWorldBasis.js";
import {
  ROADCHUNK_QUANT_STEP_M,
  ROADCHUNK_WGS84_RADIUS_M,
  roadChunkFeatureToVertices,
  type RoadChunk,
} from "./roadChunkCodec.js";
import type { CityWorldLodBand, CityWorldRoadKind, CityWorldRoadSegment } from "./cityWorldTypes.js";

/** Scene-side projection descriptor exported by compileCountyGeoScene. */
export type CountyGeoProjection = {
  /** Vertex-mean projection origin (degrees) the board was built around. */
  lon0: number;
  lat0: number;
  /** Final board scale (after any land-normalization boost). */
  boardScale: number;
};

export type CompileCountyRoadSegmentsOptions = {
  /** Segments with projected length below this (tile units) are dropped. */
  minRunTiles?: number;
  /** LOD band stamped on every emitted segment. */
  lodBand?: CityWorldLodBand;
  /** Include service/alley/trail classes (off at county-board scale). */
  includeMinor?: boolean;
  /** Street (local) chains shorter than this total length are dropped. */
  minStreetChainTiles?: number;
};

// MTFCC -> house road grammar. Hierarchy carried by kind + width (never
// color alone, per the a11y contract). Values are the A1 starting point and
// calibrate eyes-on against the adversarial-6 (contract acceptance).
function roadStyle(roadClass: string): { kind: CityWorldRoadKind; width: number } {
  // County-board scale: the whole county spans ~50 tiles, so widths are
  // FRACTIONS of a tile — the neighborhood road art's 1-2-tile widths read
  // as road soup at this lattice (A1 eyes-on finding, 2026-07-18).
  switch (roadClass) {
    case "S1100":
      return { kind: "avenue", width: 0.5 }; // primary / interstate
    case "S1200":
      return { kind: "avenue", width: 0.35 }; // secondary
    case "S1630":
      return { kind: "street", width: 0.25 }; // ramp
    case "S1400":
      return { kind: "street", width: 0.22 }; // local
    case "S1740":
    case "S1780":
    case "S1710":
    case "S1730":
    case "S1750":
    case "S1820":
    case "S1830":
      return { kind: "driveway", width: 0.18 }; // service / alley / trail
    case "S1500":
      return { kind: "driveway", width: 0.18 }; // 4WD
    default:
      return { kind: "street", width: 0.22 };
  }
}

/**
 * Compile decoded road chunks into road segments in the county board's tile
 * space. Deterministic; pure. `origin` is the manifest's spatialBasis origin
 * ([lonDeg, latDeg], bbox-centre, stamped at bake).
 */
type TilePoint = { x: number; y: number };

const STITCH_EPSILON_TILES = 0.05;

function chainEndpointsMatch(a: TilePoint, b: TilePoint): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= STITCH_EPSILON_TILES;
}

/**
 * Stitch cell-clipped pieces of one feature back into continuous polylines.
 * The 2048 m bake cells are ~1 tile wide at county-board scale, so without
 * stitching every road fragments into confetti (A1 eyes-on finding). Pieces
 * share the feature's stable featureId; clipped neighbours share a boundary
 * vertex (§1.5 boundary de-dup), which is the join point.
 */
function stitchChains(pieces: TilePoint[][]): TilePoint[][] {
  const chains = pieces.filter((p) => p.length >= 2).map((p) => [...p]);
  let joined = true;
  while (joined) {
    joined = false;
    outer: for (let i = 0; i < chains.length; i += 1) {
      for (let j = i + 1; j < chains.length; j += 1) {
        const a = chains[i]!;
        const b = chains[j]!;
        const aStart = a[0]!;
        const aEnd = a[a.length - 1]!;
        const bStart = b[0]!;
        const bEnd = b[b.length - 1]!;
        let merged: TilePoint[] | null = null;
        if (chainEndpointsMatch(aEnd, bStart)) merged = [...a, ...b.slice(1)];
        else if (chainEndpointsMatch(bEnd, aStart)) merged = [...b, ...a.slice(1)];
        else if (chainEndpointsMatch(aEnd, bEnd)) merged = [...a, ...b.slice(0, -1).reverse()];
        else if (chainEndpointsMatch(aStart, bStart)) merged = [...a.slice(1).reverse(), ...b];
        if (merged) {
          chains[i] = merged;
          chains.splice(j, 1);
          joined = true;
          break outer;
        }
      }
    }
  }
  return chains;
}

function chainLength(chain: TilePoint[]): number {
  let total = 0;
  for (let i = 1; i < chain.length; i += 1) {
    total += Math.hypot(chain[i]!.x - chain[i - 1]!.x, chain[i]!.y - chain[i - 1]!.y);
  }
  return total;
}

export function compileCountyRoadSegments(
  chunks: readonly RoadChunk[],
  origin: readonly [number, number],
  projection: CountyGeoProjection,
  options: CompileCountyRoadSegmentsOptions = {},
): CityWorldRoadSegment[] {
  const minRun = options.minRunTiles ?? 0.35;
  const lodBand = options.lodBand ?? "near";
  const includeMinor = options.includeMinor ?? false;
  const minStreetChain = options.minStreetChainTiles ?? 2.0;
  const originLon = origin[0];
  const originLat = origin[1];
  const originLatCos = Math.cos((originLat * Math.PI) / 180);
  const sceneLatCos = Math.cos((projection.lat0 * Math.PI) / 180);
  const radToDeg = 180 / Math.PI;

  const project = ([eQ, nQ]: readonly [number, number]): TilePoint => {
    const eM = eQ * ROADCHUNK_QUANT_STEP_M;
    const nM = nQ * ROADCHUNK_QUANT_STEP_M;
    const lon = originLon + (eM / (ROADCHUNK_WGS84_RADIUS_M * originLatCos)) * radToDeg;
    const lat = originLat + (nM / ROADCHUNK_WGS84_RADIUS_M) * radToDeg;
    return unprojectCityWorldGroundPoint({
      x: (lon - projection.lon0) * sceneLatCos * projection.boardScale,
      y: -(lat - projection.lat0) * projection.boardScale,
    });
  };

  // Group cell-clipped pieces by stable featureId (sorted for determinism).
  const byFeature = new Map<string, { roadClass: string; pieces: TilePoint[][] }>();
  for (const chunk of [...chunks].sort((a, b) => a.chunkId.localeCompare(b.chunkId))) {
    for (const feature of chunk.features) {
      const entry = byFeature.get(feature.featureId) ?? { roadClass: feature.roadClass, pieces: [] };
      entry.pieces.push(roadChunkFeatureToVertices(feature).map(project));
      byFeature.set(feature.featureId, entry);
    }
  }

  const segments: CityWorldRoadSegment[] = [];
  for (const [featureId, entry] of byFeature) {
    const style = roadStyle(entry.roadClass);
    // County-board class rules (contract: minor roads DISAPPEAR at this
    // scale rather than collapsing into noise).
    if (!includeMinor && style.kind === "driveway") continue;
    const chains = stitchChains(entry.pieces);
    let emitted = 0;
    for (const chain of chains) {
      if (style.kind === "street" && chainLength(chain) < minStreetChain) continue;
      // Forward-accumulate simplifier over the STITCHED chain: emit a segment
      // once at least `minRun` tiles accumulate; sub-minimum tails drop.
      let anchor = chain[0];
      for (let i = 1; i < chain.length; i += 1) {
        const point = chain[i];
        if (!anchor || !point) continue;
        const isLast = i === chain.length - 1;
        const length = Math.hypot(point.x - anchor.x, point.y - anchor.y);
        // The final leg keeps continuity if it is at least half a run long —
        // dropping every tail re-opens micro-gaps at cell boundaries.
        if (length < minRun && !(isLast && length >= minRun / 2)) continue;
        segments.push({
          id: `road-${featureId}-${emitted}`,
          kind: style.kind,
          from: { x: anchor.x, y: anchor.y, z: 0 },
          to: { x: point.x, y: point.y, z: 0 },
          width: style.width,
          paletteKey: "road.asphalt",
          lodBand,
        });
        emitted += 1;
        anchor = point;
      }
    }
  }
  return segments;
}
