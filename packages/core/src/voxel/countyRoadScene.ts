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
// Cross-feature joins demand near-exact node identity: at county scale 0.05
// tiles is ~90 m, enough to wrongly weld two DIFFERENT roads. Shared TIGER
// nodes project to identical points (quantisation error ~0.0001 tiles).
const CROSS_FEATURE_EPSILON_TILES = 0.008;

function chainEndpointsMatch(a: TilePoint, b: TilePoint, epsilon: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= epsilon;
}

/**
 * Stitch cell-clipped pieces of one feature back into continuous polylines.
 * The 2048 m bake cells are ~1 tile wide at county-board scale, so without
 * stitching every road fragments into confetti (A1 eyes-on finding). Pieces
 * share the feature's stable featureId; clipped neighbours share a boundary
 * vertex (§1.5 boundary de-dup), which is the join point.
 */
function stitchChains(pieces: TilePoint[][], epsilon: number = STITCH_EPSILON_TILES): TilePoint[][] {
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
        if (chainEndpointsMatch(aEnd, bStart, epsilon)) merged = [...a, ...b.slice(1)];
        else if (chainEndpointsMatch(bEnd, aStart, epsilon)) merged = [...b, ...a.slice(1)];
        else if (chainEndpointsMatch(aEnd, bEnd, epsilon)) merged = [...a, ...b.slice(0, -1).reverse()];
        else if (chainEndpointsMatch(aStart, bStart, epsilon)) merged = [...a.slice(1).reverse(), ...b];
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

/** A stitched run of vertices carrying its class style (S2 provenance). */
type StyledPiece = { points: TilePoint[]; style: { kind: CityWorldRoadKind; width: number } };

function firstPoint(list: StyledPiece[]): TilePoint {
  return list[0]!.points[0]!;
}

function lastPoint(list: StyledPiece[]): TilePoint {
  const piece = list[list.length - 1]!;
  return piece.points[piece.points.length - 1]!;
}

/** Reverse a piece LIST: order of pieces AND each piece's points. */
function reverseStyled(list: StyledPiece[]): StyledPiece[] {
  return [...list].reverse().map((piece) => ({ points: [...piece.points].reverse(), style: piece.style }));
}

/**
 * Endpoint-bucket joining over styled piece LISTS: O(n) expected, so it can
 * pool every class county-wide. Same-key endpoints join; each endpoint key
 * holds at most one open chain end, so distinct roads meeting at an
 * intersection (3+ ends on one node) never weld into a false through-route —
 * the first pair joins, the rest keep their identity. Class provenance
 * survives the merge as per-piece styles (corridor width steps, not gaps).
 */
function hashJoinStyledChains(pieces: StyledPiece[][], epsilon: number): StyledPiece[][] {
  const chains: (StyledPiece[] | null)[] = pieces.filter((list) => list.length > 0 && list[0]!.points.length >= 2);
  const keyOf = (p: TilePoint) => `${Math.round(p.x / epsilon)}:${Math.round(p.y / epsilon)}`;
  const openEnds = new Map<string, { index: number; end: "start" | "end" }>();

  const tryJoin = (index: number): void => {
    const chain = chains[index];
    if (!chain) return;
    for (const end of ["start", "end"] as const) {
      const point = end === "start" ? firstPoint(chain) : lastPoint(chain);
      const key = keyOf(point);
      const other = openEnds.get(key);
      if (other && other.index !== index && chains[other.index]) {
        const otherChain = chains[other.index]!;
        const otherPoint = other.end === "start" ? firstPoint(otherChain) : lastPoint(otherChain);
        if (Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y) <= epsilon) {
          // Orient both so they concatenate other -> this.
          const left = other.end === "end" ? otherChain : reverseStyled(otherChain);
          const right = end === "start" ? chain : reverseStyled(chain);
          const merged = [...left, ...right];
          openEnds.delete(key);
          openEnds.delete(keyOf(other.end === "end" ? firstPoint(otherChain) : lastPoint(otherChain)));
          chains[index] = null;
          chains[other.index] = merged;
          tryJoin(other.index); // merged chain may join again at its new ends
          return;
        }
      }
    }
    openEnds.set(keyOf(firstPoint(chain)), { index, end: "start" });
    openEnds.set(keyOf(lastPoint(chain)), { index, end: "end" });
  };

  for (let i = 0; i < chains.length; i += 1) tryJoin(i);
  return chains.filter((c): c is StyledPiece[] => c !== null);
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

  // Pass 1: per-feature stitching (cell splits share a boundary vertex).
  // Each stitched chain becomes a single styled PIECE — pass 2 joins piece
  // LISTS so class provenance survives the merge (S2: corridor continuity).
  const poolMap = new Map<string, { pieces: StyledPiece[][]; allStreet: boolean }>();
  for (const [featureId, entry] of byFeature) {
    void featureId;
    const style = roadStyle(entry.roadClass);
    // County-board class rules (contract: minor roads DISAPPEAR at this
    // scale rather than collapsing into noise).
    if (!includeMinor && style.kind === "driveway") continue;
    // US-1-style corridors alternate S1100/S1200 — and their overpass/ramp
    // sections are classed S1630 — mid-road. Pool all three TOGETHER so the
    // interleave welds; per-piece styles make class changes render as width
    // steps, never gaps. Other street classes stay per-class pooled.
    const poolKey = style.kind === "avenue" || entry.roadClass === "S1630" ? "avenue-corridor" : entry.roadClass;
    const pool = poolMap.get(poolKey) ?? { pieces: [], allStreet: style.kind === "street" };
    for (const chain of stitchChains(entry.pieces)) {
      pool.pieces.push([{ points: chain, style }]);
    }
    pool.allStreet = pool.allStreet && style.kind === "street";
    poolMap.set(poolKey, pool);
  }

  const segments: CityWorldRoadSegment[] = [];
  for (const [poolKey, pool] of poolMap) {
    const joined = hashJoinStyledChains(pool.pieces, CROSS_FEATURE_EPSILON_TILES);
    joined.forEach((pieceList, chainIndex) => {
      const total = pieceList.reduce((sum, piece) => sum + chainLength(piece.points), 0);
      // Drop rules (contract: disappear, never collapse into noise):
      // ALL-street chains below the street minimum vanish; and EVERY pool
      // drops isolated sub-tile fragments (standalone ramp stubs at
      // interchanges that welded to nothing).
      if (pool.allStreet && total < minStreetChain) return;
      if (total < 0.8) return;
      let emitted = 0;
      // Forward-accumulate per same-style RUN: the anchor resets at style
      // boundaries so class changes emit as width steps; the half-run tail
      // rule applies per run (else short interleave pieces reopen gaps).
      for (const piece of pieceList) {
        let anchor = piece.points[0];
        for (let i = 1; i < piece.points.length; i += 1) {
          const point = piece.points[i];
          if (!anchor || !point) continue;
          const isLast = i === piece.points.length - 1;
          const length = Math.hypot(point.x - anchor.x, point.y - anchor.y);
          if (length < minRun && !(isLast && length >= minRun / 2)) continue;
          segments.push({
            id: `road-${poolKey}-x${chainIndex}-${emitted}`,
            kind: piece.style.kind,
            from: { x: anchor.x, y: anchor.y, z: 0 },
            to: { x: point.x, y: point.y, z: 0 },
            width: piece.style.width,
            paletteKey: "road.asphalt",
            lodBand,
          });
          emitted += 1;
          anchor = point;
        }
      }
    });
  }
  return segments;
}
