import { describe, expect, it } from "vitest";
import { dissolveRings } from "../src/atlas/dissolve.js";
import type { LonLat } from "../src/atlas/projection.js";

/** Two unit squares sharing their middle edge, like two adjacent counties. */
const LEFT_SQUARE: LonLat[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
];
const RIGHT_SQUARE: LonLat[] = [
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 0],
];

describe("dissolveRings", () => {
  it("removes the shared border between two adjacent polygons", () => {
    const result = dissolveRings([LEFT_SQUARE, RIGHT_SQUARE]);

    // The shared edge (1,0)-(1,1) appears in both rings and must be dropped.
    expect(result.stats.sharedSegments).toBe(1);
    expect(result.stats.overSharedSegments).toBe(0);
    expect(result.stats.exteriorSegments).toBe(6);
    expect(result.stats.openChains).toBe(0);
    expect(result.rings).toHaveLength(1);

    // The outline is the 2x1 rectangle: no vertex may sit inside it.
    const ring = result.rings[0]!;
    const xs = ring.map((point) => point[0]);
    const ys = ring.map((point) => point[1]);
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(2);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(1);

    // The interior edge's midpoint must not survive as a boundary segment.
    const hasInteriorEdge = ring.some(
      (point, index) =>
        point[0] === 1 && ring[(index + 1) % ring.length]?.[0] === 1,
    );
    expect(hasInteriorEdge).toBe(false);
  });

  it("keeps disjoint polygons as separate rings", () => {
    const island: LonLat[] = [
      [10, 10],
      [11, 10],
      [11, 11],
      [10, 11],
      [10, 10],
    ];
    const result = dissolveRings([LEFT_SQUARE, island]);

    expect(result.stats.sharedSegments).toBe(0);
    expect(result.rings).toHaveLength(2);
    expect(result.stats.openChains).toBe(0);
  });

  it("closes every ring it returns", () => {
    const result = dissolveRings([LEFT_SQUARE, RIGHT_SQUARE]);
    for (const ring of result.rings) {
      expect(ring[0]).toEqual(ring[ring.length - 1]);
      expect(ring.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("ignores zero-length segments instead of breaking the chain", () => {
    const withDuplicate: LonLat[] = [
      [0, 0],
      [1, 0],
      [1, 0], // repeated vertex, common after quantization
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const result = dissolveRings([withDuplicate]);
    expect(result.rings).toHaveLength(1);
    expect(result.stats.openChains).toBe(0);
  });

  it("reports a clean topology for well-formed input", () => {
    const result = dissolveRings([LEFT_SQUARE, RIGHT_SQUARE]);
    // This is the invariant the whole technique rests on.
    expect(result.stats.overSharedSegments).toBe(0);
  });

  it("survives a ring that shares nothing", () => {
    const result = dissolveRings([LEFT_SQUARE]);
    expect(result.rings).toHaveLength(1);
    expect(result.stats.exteriorSegments).toBe(4);
  });
});
