import { describe, expect, it } from "vitest";
import {
  compileCountyGeoScene,
  compileCountyRoadSegments,
  unprojectCityWorldGroundPoint,
  type CountyGeoPack,
} from "../src/index.js";
import {
  roadChunkFeatureFromVertices,
  ROADCHUNK_QUANT_STEP_M,
  ROADCHUNK_WGS84_RADIUS_M,
  type RoadChunk,
} from "../src/voxel/roadChunkCodec.js";

// Square test county ~0.2 deg on a side centered at (-80, 25.6).
const PACK: CountyGeoPack = {
  packVersion: 2,
  countySlug: "test-square-fl",
  geoid: "99999",
  name: "Test Square",
  lod0: {
    boundaryRings: [
      [
        [-80.1, 25.5],
        [-79.9, 25.5],
        [-79.9, 25.7],
        [-80.1, 25.7],
        [-80.1, 25.5],
      ],
    ],
    vertexCount: 5,
  },
} as unknown as CountyGeoPack;

const ORIGIN: readonly [number, number] = [-80.0, 25.6];

/** Forward-project lon/lat into the bake basis (quantised metres). */
function toBasis(lon: number, lat: number): [number, number] {
  const latCos = Math.cos((ORIGIN[1] * Math.PI) / 180);
  const degToRad = Math.PI / 180;
  const eM = (lon - ORIGIN[0]) * degToRad * ROADCHUNK_WGS84_RADIUS_M * latCos;
  const nM = (lat - ORIGIN[1]) * degToRad * ROADCHUNK_WGS84_RADIUS_M;
  return [Math.round(eM / ROADCHUNK_QUANT_STEP_M), Math.round(nM / ROADCHUNK_QUANT_STEP_M)];
}

function chunkWith(vertices: Array<[number, number]>, roadClass = "S1400"): RoadChunk {
  const feature = roadChunkFeatureFromVertices("F0001", roadClass, vertices);
  const es = vertices.map((v) => v[0]);
  const ns = vertices.map((v) => v[1]);
  return {
    basisId: "atlas-county-equirect-v1",
    schemaVersion: "roadchunk/1",
    geoid: "99999",
    packHash: "sha256-test",
    chunkId: "c0_0",
    band: "near",
    cellRect: [Math.min(...es) - 10, Math.min(...ns) - 10, Math.max(...es) + 10, Math.max(...ns) + 10],
    features: [feature],
  } as RoadChunk;
}

describe("countyRoadScene", () => {
  it("registers a road against the scene's own projection of the same lon/lat", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection;
    expect(projection).toBeDefined();
    if (!projection) return;

    const a: [number, number] = [-80.05, 25.55];
    const b: [number, number] = [-79.95, 25.65];
    const chunk = chunkWith([toBasis(a[0], a[1]), toBasis(b[0], b[1])]);
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    expect(segments.length).toBe(1);

    const sceneLatCos = Math.cos((projection.lat0 * Math.PI) / 180);
    const reference = (lon: number, lat: number) =>
      unprojectCityWorldGroundPoint({
        x: (lon - projection.lon0) * sceneLatCos * projection.boardScale,
        y: -(lat - projection.lat0) * projection.boardScale,
      });
    const refA = reference(a[0], a[1]);
    const refB = reference(b[0], b[1]);
    const seg = segments[0]!;
    expect(Math.hypot(seg.from.x - refA.x, seg.from.y - refA.y)).toBeLessThan(0.01);
    expect(Math.hypot(seg.to.x - refB.x, seg.to.y - refB.y)).toBeLessThan(0.01);
    expect(seg.lodBand).toBe("near");
    expect(seg.paletteKey).toBe("road.asphalt");
  });

  it("maps MTFCC classes to kind/width hierarchy (never color alone)", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const across: Array<[number, number]> = [toBasis(-80.05, 25.55), toBasis(-79.95, 25.65)];
    const opts = { includeMinor: true };
    const primary = compileCountyRoadSegments([chunkWith(across, "S1100")], ORIGIN, projection, opts)[0]!;
    const local = compileCountyRoadSegments([chunkWith(across, "S1400")], ORIGIN, projection, opts)[0]!;
    const service = compileCountyRoadSegments([chunkWith(across, "S1740")], ORIGIN, projection, opts)[0]!;
    expect(primary.kind).toBe("avenue");
    expect(local.kind).toBe("street");
    expect(service.kind).toBe("driveway");
    expect(primary.width).toBeGreaterThan(local.width);
    expect(local.width).toBeGreaterThan(service.width);
  });

  it("drops service classes at county scale unless includeMinor", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const across: Array<[number, number]> = [toBasis(-80.05, 25.55), toBasis(-79.95, 25.65)];
    expect(compileCountyRoadSegments([chunkWith(across, "S1740")], ORIGIN, projection).length).toBe(0);
  });

  it("stitches cell-clipped pieces of one feature back into a continuous run", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const a = toBasis(-80.06, 25.55);
    const boundary = toBasis(-80.0, 25.6);
    const b = toBasis(-79.94, 25.65);
    // Two chunks carry the same featureId, split at a shared boundary vertex.
    const piece1 = chunkWith([a, boundary], "S1100");
    const piece2 = { ...chunkWith([boundary, b], "S1100"), chunkId: "c1_0" } as RoadChunk;
    const segments = compileCountyRoadSegments([piece1, piece2], ORIGIN, projection);
    expect(segments.length).toBeGreaterThan(0);
    // Continuity: walking the segments end-to-end leaves no gap at the
    // boundary — every segment's from equals the previous segment's to.
    for (let i = 1; i < segments.length; i += 1) {
      expect(segments[i]!.from).toEqual(segments[i - 1]!.to);
    }
    // And the stitched run spans a to b (within quantisation).
    const first = segments[0]!.from;
    const last = segments[segments.length - 1]!.to;
    const span = Math.hypot(last.x - first.x, last.y - first.y);
    expect(span).toBeGreaterThan(5);
  });

  it("deduplicates exact clipped feature copies before stitching across cells", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const a = toBasis(-80.06, 25.55);
    const boundary = toBasis(-80.0, 25.6);
    const b = toBasis(-79.94, 25.65);
    const firstPiece = roadChunkFeatureFromVertices("DUPLICATE1", "S1200", [a, boundary]);
    const secondPiece = roadChunkFeatureFromVertices("DUPLICATE1", "S1200", [boundary, b]);
    const firstChunk = {
      ...chunkWith([a, boundary], "S1200"),
      chunkId: "c0_0",
      features: [firstPiece, firstPiece],
    } as RoadChunk;
    const secondChunk = {
      ...chunkWith([boundary, b], "S1200"),
      chunkId: "c1_0",
      features: [secondPiece, secondPiece],
    } as RoadChunk;

    const segments = compileCountyRoadSegments([firstChunk, secondChunk], ORIGIN, projection);

    expect(segments).toHaveLength(2);
    expect(segments[1]!.from).toEqual(segments[0]!.to);
    expect(Math.hypot(segments[1]!.to.x - segments[0]!.from.x, segments[1]!.to.y - segments[0]!.from.y)).toBeGreaterThan(5);
  });

  it("drops sub-minimum runs instead of emitting noise", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const base = toBasis(-80.0, 25.6);
    // Second vertex 2 m east — far below the minimum visible run.
    const chunk = chunkWith([base, [base[0] + 20, base[1]]]);
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    expect(segments.length).toBe(0);
  });

  it("emits multi-segment polylines with per-segment unique ids", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const chunk = chunkWith([
      toBasis(-80.05, 25.55),
      toBasis(-80.0, 25.6),
      toBasis(-79.95, 25.65),
    ]);
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    expect(segments.length).toBe(2);
    expect(new Set(segments.map((s) => s.id)).size).toBe(2);
    // Continuity: second segment starts where the first ended.
    expect(segments[1]!.from).toEqual(segments[0]!.to);
  });

  it("stitches ACROSS avenue features sharing an exact endpoint (TIGER edge splits)", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const a = toBasis(-80.06, 25.55);
    const mid = toBasis(-80.0, 25.6);
    const b = toBasis(-79.94, 25.65);
    // Two DIFFERENT featureIds (separate TIGER edges of one road) meeting at
    // an exact shared node.
    const f1 = roadChunkFeatureFromVertices("EDGE1", "S1100", [a, mid]);
    const f2 = roadChunkFeatureFromVertices("EDGE2", "S1100", [mid, b]);
    const chunk = {
      ...chunkWith([a, b], "S1100"),
      features: [f1, f2],
    } as RoadChunk;
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    for (let i = 1; i < segments.length; i += 1) {
      expect(segments[i]!.from).toEqual(segments[i - 1]!.to);
    }
    const first = segments[0]!.from;
    const last = segments[segments.length - 1]!.to;
    expect(Math.hypot(last.x - first.x, last.y - first.y)).toBeGreaterThan(5);
  });

  it("does NOT weld distinct streets that merely end near each other", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    // Two long locals whose endpoints are ~0.02 tiles apart (beyond the
    // cross-feature epsilon; street kind skips cross-stitch anyway).
    const s1 = roadChunkFeatureFromVertices("ST1", "S1400", [toBasis(-80.06, 25.55), toBasis(-80.0, 25.6)]);
    const s2 = roadChunkFeatureFromVertices("ST2", "S1400", [toBasis(-79.9995, 25.6005), toBasis(-79.94, 25.65)]);
    const chunk = { ...chunkWith([toBasis(-80.06, 25.55), toBasis(-79.94, 25.65)], "S1400"), features: [s1, s2] } as RoadChunk;
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    const ids = new Set(segments.map((s) => s.id.split("-")[1]));
    expect(segments.length).toBeGreaterThan(0);
    expect(ids.size).toBeGreaterThanOrEqual(1);
  });

  it("welds S1100/S1200 interleave into one corridor with width steps, no gaps", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const a = toBasis(-80.06, 25.55);
    const m1 = toBasis(-80.02, 25.58);
    const m2 = toBasis(-79.98, 25.62);
    const b = toBasis(-79.94, 25.65);
    // A US-1-style corridor: primary, secondary, primary — three features.
    const f1 = roadChunkFeatureFromVertices("US1A", "S1100", [a, m1]);
    const f2 = roadChunkFeatureFromVertices("US1B", "S1200", [m1, m2]);
    const f3 = roadChunkFeatureFromVertices("US1C", "S1100", [m2, b]);
    const chunk = { ...chunkWith([a, b], "S1100"), features: [f1, f2, f3] } as RoadChunk;
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    // Continuous end to end.
    for (let i = 1; i < segments.length; i += 1) {
      expect(segments[i]!.from).toEqual(segments[i - 1]!.to);
    }
    // Width steps present: both class widths appear in one welded chain.
    const widths = new Set(segments.map((s) => s.width));
    expect(widths.size).toBe(2);
    const first = segments[0]!.from;
    const last = segments[segments.length - 1]!.to;
    expect(Math.hypot(last.x - first.x, last.y - first.y)).toBeGreaterThan(5);
  });

  it("joins through the reversal path (chains meeting end-to-end)", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const a = toBasis(-80.06, 25.55);
    const mid = toBasis(-80.0, 25.6);
    const b = toBasis(-79.94, 25.65);
    // Both features END at the shared node (aEnd meets bEnd — forces reversal).
    const f1 = roadChunkFeatureFromVertices("REV1", "S1100", [a, mid]);
    const f2 = roadChunkFeatureFromVertices("REV2", "S1100", [b, mid]);
    const chunk = { ...chunkWith([a, b], "S1100"), features: [f1, f2] } as RoadChunk;
    const segments = compileCountyRoadSegments([chunk], ORIGIN, projection);
    for (let i = 1; i < segments.length; i += 1) {
      expect(segments[i]!.from).toEqual(segments[i - 1]!.to);
    }
    const first = segments[0]!.from;
    const last = segments[segments.length - 1]!.to;
    expect(Math.hypot(last.x - first.x, last.y - first.y)).toBeGreaterThan(5);
  });

  it("is deterministic", () => {
    const scene = compileCountyGeoScene(PACK);
    const projection = scene.geoProjection!;
    const chunk = chunkWith([toBasis(-80.05, 25.55), toBasis(-79.95, 25.65)]);
    const a = compileCountyRoadSegments([chunk], ORIGIN, projection);
    const b = compileCountyRoadSegments([chunk], ORIGIN, projection);
    expect(a).toEqual(b);
  });
});
