import { describe, expect, it } from "vitest";
import { decodeRing, encodedVertexCount, encodeRing } from "../src/atlas/ringCodec.js";
import type { LonLat } from "../src/atlas/projection.js";

// A real fragment of the Miami-Dade boundary.
const MIAMI_FRAGMENT: LonLat[] = [
  [-80.0918, 25.7211],
  [-80.0864, 25.7252],
  [-80.0828, 25.7286],
  [-80.0791, 25.7331],
  [-80.0764, 25.7388],
];

describe("ring codec", () => {
  it("round-trips within the stated precision", () => {
    const encoded = encodeRing(MIAMI_FRAGMENT, { decimals: 4 });
    const decoded = decodeRing(encoded, { decimals: 4 });

    expect(decoded).toHaveLength(MIAMI_FRAGMENT.length);
    for (let i = 0; i < MIAMI_FRAGMENT.length; i += 1) {
      expect(decoded[i]![0]).toBeCloseTo(MIAMI_FRAGMENT[i]![0], 4);
      expect(decoded[i]![1]).toBeCloseTo(MIAMI_FRAGMENT[i]![1], 4);
    }
  });

  it("keeps error below the quantization step", () => {
    // At 3 decimals the step is 0.001 degrees (~110 m), so no decoded point
    // may sit more than half a step from its original.
    const decoded = decodeRing(encodeRing(MIAMI_FRAGMENT, { decimals: 3 }), { decimals: 3 });
    for (let i = 0; i < MIAMI_FRAGMENT.length; i += 1) {
      expect(Math.abs(decoded[i]![0] - MIAMI_FRAGMENT[i]![0])).toBeLessThanOrEqual(0.0005);
      expect(Math.abs(decoded[i]![1] - MIAMI_FRAGMENT[i]![1])).toBeLessThanOrEqual(0.0005);
    }
  });

  it("emits deltas after the first vertex, not absolutes", () => {
    const encoded = encodeRing(MIAMI_FRAGMENT, { decimals: 4 });
    expect(encoded[0]).toBe(-800918);
    expect(encoded[1]).toBe(257211);
    // Every subsequent number is a small delta, which is the whole point.
    for (const value of encoded.slice(2)) {
      expect(Math.abs(value)).toBeLessThan(1000);
    }
  });

  it("is substantially smaller than plain float JSON", () => {
    const plainBytes = JSON.stringify(MIAMI_FRAGMENT).length;
    const encodedBytes = JSON.stringify(encodeRing(MIAMI_FRAGMENT, { decimals: 4 })).length;
    expect(encodedBytes).toBeLessThan(plainBytes * 0.7);
  });

  it("handles degenerate rings without throwing", () => {
    expect(decodeRing(encodeRing([], { decimals: 3 }), { decimals: 3 })).toEqual([]);
    const single: LonLat[] = [[-96, 37.5]];
    expect(decodeRing(encodeRing(single, { decimals: 3 }), { decimals: 3 })).toEqual([[-96, 37.5]]);
  });

  it("counts vertices without decoding", () => {
    const rings = [encodeRing(MIAMI_FRAGMENT, { decimals: 3 }), encodeRing(MIAMI_FRAGMENT, { decimals: 3 })];
    expect(encodedVertexCount(rings)).toBe(MIAMI_FRAGMENT.length * 2);
  });
});
