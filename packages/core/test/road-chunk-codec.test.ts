import { describe, expect, it } from "vitest";
import {
  ROADCHUNK_BASIS_ID,
  ROADCHUNK_MAX_DECODED_BYTES,
  ROADCHUNK_MAX_FEATURE_COUNT,
  ROADCHUNK_SCHEMA_VERSION,
  RoadChunkCoordinateError,
  RoadChunkDecodeError,
  RoadChunkEncodeError,
  RoadChunkMalformedError,
  RoadChunkOversizedError,
  RoadChunkSchemaError,
  decodeRoadChunk,
  encodeRoadChunk,
  roadChunkFeatureFromVertices,
  roadChunkFeatureToVertices,
  roadChunkZigZagDecode,
  roadChunkZigZagEncode,
  type RoadChunk,
} from "../src/voxel/roadChunkCodec.js";

// Base cell c12_7 rect in quantised metres (cell edge 2048 m / 0.1 m = 20480 q).
const CELL = 20480;
const MIN_EI = 12 * CELL; // 245760
const MIN_NI = 7 * CELL; //  143360
const MAX_EI = MIN_EI + CELL - 1; // 266239 (inclusive)
const MAX_NI = MIN_NI + CELL - 1; // 163839 (inclusive)

// A road that crosses the whole cell diagonally — the clipped portion of a
// feature that also lives in neighbouring chunks under the SAME stable id.
const CROSSING_VERTICES: Array<[number, number]> = [
  [MIN_EI, MIN_NI],
  [MIN_EI + 240, MIN_NI + 140],
  [MIN_EI + 5000, MIN_NI + 6000],
  [MAX_EI, MAX_NI],
];

function buildFixtureChunk(): RoadChunk {
  return {
    basisId: ROADCHUNK_BASIS_ID,
    schemaVersion: ROADCHUNK_SCHEMA_VERSION,
    geoid: "12086",
    packHash: "b3-9f2c1a",
    chunkId: "c12_7",
    band: "mid",
    cellRect: [MIN_EI, MIN_NI, MAX_EI, MAX_NI],
    features: [
      roadChunkFeatureFromVertices("1104755807", "S1100", CROSSING_VERTICES),
      roadChunkFeatureFromVertices("1104755808", "S1400", [
        [MIN_EI + 10000, MIN_NI + 8000],
        [MIN_EI + 10100, MIN_NI + 8050],
        [MIN_EI + 10090, MIN_NI + 8200],
      ]),
    ],
  };
}

describe("roadchunk/1 codec — zig-zag", () => {
  it("round-trips signed integers through arithmetic zig-zag", () => {
    for (const value of [0, 1, -1, 2, -2, 12345, -12345, MAX_EI, -MAX_NI]) {
      const code = roadChunkZigZagEncode(value);
      expect(code).toBeGreaterThanOrEqual(0);
      expect(roadChunkZigZagDecode(code)).toBe(value);
    }
  });
});

describe("roadchunk/1 codec — golden round-trip", () => {
  it("re-decodes a hand-built fixture chunk to a deep-equal value", () => {
    const fixture = buildFixtureChunk();
    const bytes = encodeRoadChunk(fixture);
    const decoded = decodeRoadChunk(bytes);

    expect(decoded).toEqual(fixture);
    // stable featureId survives the round-trip on the multi-cell-crossing road.
    expect(decoded.features[0]?.featureId).toBe("1104755807");
    expect(decoded.features[0]?.roadClass).toBe("S1100");
    // and the delta expansion reproduces the original absolute polyline.
    expect(roadChunkFeatureToVertices(decoded.features[0]!)).toEqual(CROSSING_VERTICES);
  });

  it("emits the frozen wire keys and re-encodes decoded output identically", () => {
    const fixture = buildFixtureChunk();
    const bytes = encodeRoadChunk(fixture);
    const parsed = JSON.parse(bytes) as Record<string, unknown>;

    expect(parsed.basisId).toBe(ROADCHUNK_BASIS_ID);
    expect(parsed.schemaVersion).toBe(ROADCHUNK_SCHEMA_VERSION);
    expect(parsed.chunkId).toBe("c12_7");
    expect(parsed.cellRect).toEqual([MIN_EI, MIN_NI, MAX_EI, MAX_NI]);
    // idempotent: encode(decode(bytes)) === bytes
    expect(encodeRoadChunk(decodeRoadChunk(bytes))).toBe(bytes);
  });

  it("accepts UTF-8 byte input as well as strings", () => {
    const fixture = buildFixtureChunk();
    const bytes = new TextEncoder().encode(encodeRoadChunk(fixture));
    expect(decodeRoadChunk(bytes)).toEqual(fixture);
  });
});

describe("roadchunk/1 codec — determinism", () => {
  it("encodes the same chunk to identical bytes across two calls", () => {
    const fixture = buildFixtureChunk();
    expect(encodeRoadChunk(fixture)).toBe(encodeRoadChunk(fixture));
  });

  it("canonicalises field order so shuffled inputs encode identically", () => {
    const canonical = encodeRoadChunk(buildFixtureChunk());
    const shuffled: RoadChunk = {
      // deliberately different key order and feature key order
      features: buildFixtureChunk().features.map((feature) => ({
        delta: feature.delta,
        start: feature.start,
        roadClass: feature.roadClass,
        featureId: feature.featureId,
      })),
      cellRect: [MIN_EI, MIN_NI, MAX_EI, MAX_NI],
      band: "mid",
      chunkId: "c12_7",
      packHash: "b3-9f2c1a",
      geoid: "12086",
      schemaVersion: ROADCHUNK_SCHEMA_VERSION,
      basisId: ROADCHUNK_BASIS_ID,
    };
    expect(encodeRoadChunk(shuffled)).toBe(canonical);
  });
});

describe("roadchunk/1 codec — empty (declared-empty) chunk", () => {
  it("round-trips a present-but-empty chunk with zero features", () => {
    const empty: RoadChunk = {
      basisId: ROADCHUNK_BASIS_ID,
      schemaVersion: ROADCHUNK_SCHEMA_VERSION,
      geoid: "12086",
      packHash: "b3-000000",
      chunkId: "c-3_5",
      band: "lod0",
      cellRect: [-3 * CELL, 5 * CELL, -3 * CELL + CELL - 1, 5 * CELL + CELL - 1],
      features: [],
    };
    const decoded = decodeRoadChunk(encodeRoadChunk(empty));
    expect(decoded).toEqual(empty);
    expect(decoded.features).toHaveLength(0);
  });
});

describe("roadchunk/1 codec — hostile decodes (typed rejection)", () => {
  function validJson(): Record<string, unknown> {
    return JSON.parse(encodeRoadChunk(buildFixtureChunk())) as Record<string, unknown>;
  }

  it("rejects an oversized feature count with a feature-count oversized error", () => {
    const many: RoadChunk = {
      basisId: ROADCHUNK_BASIS_ID,
      schemaVersion: ROADCHUNK_SCHEMA_VERSION,
      geoid: "12086",
      packHash: "b3-9f2c1a",
      chunkId: "c12_7",
      band: "mid",
      cellRect: [MIN_EI, MIN_NI, MAX_EI, MAX_NI],
      features: Array.from({ length: ROADCHUNK_MAX_FEATURE_COUNT + 1 }, (_unused, i) => ({
        featureId: `f${i}`,
        roadClass: "S1400",
        start: [MIN_EI, MIN_NI] as [number, number],
        delta: [],
      })),
    };
    const bytes = encodeRoadChunk(many); // encode does not cap (D10)
    try {
      decodeRoadChunk(bytes);
      throw new Error("expected decode to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RoadChunkOversizedError);
      expect(error).toBeInstanceOf(RoadChunkDecodeError);
      expect((error as RoadChunkOversizedError).limit).toBe("feature-count");
      expect((error as RoadChunkOversizedError).observed).toBe(ROADCHUNK_MAX_FEATURE_COUNT + 1);
    }
  });

  it("rejects an oversized decoded payload before parsing", () => {
    const huge = "x".repeat(ROADCHUNK_MAX_DECODED_BYTES + 1);
    try {
      decodeRoadChunk(huge);
      throw new Error("expected decode to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RoadChunkOversizedError);
      expect((error as RoadChunkOversizedError).limit).toBe("decoded-bytes");
      expect((error as RoadChunkOversizedError).observed).toBe(ROADCHUNK_MAX_DECODED_BYTES + 1);
    }
  });

  it("rejects a wrong schemaVersion with a schema error", () => {
    const doc = validJson();
    doc.schemaVersion = "roadchunk/2";
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkSchemaError);
  });

  it("rejects a wrong basisId with a schema error", () => {
    const doc = validJson();
    doc.basisId = "some-other-basis-v9";
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkSchemaError);
  });

  it("rejects unknown top-level keys with a schema error", () => {
    const doc = validJson();
    (doc as Record<string, unknown>).smuggled = true;
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkSchemaError);
  });

  it("rejects an out-of-range coordinate with a coordinate error", () => {
    const doc = validJson();
    const features = doc.features as Array<Record<string, unknown>>;
    features[0]!.start = [MAX_EI + 5000, MIN_NI]; // east of the cell rect
    features[0]!.delta = [];
    try {
      decodeRoadChunk(JSON.stringify(doc));
      throw new Error("expected decode to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RoadChunkCoordinateError);
      expect(error).toBeInstanceOf(RoadChunkDecodeError);
    }
  });

  it("rejects a non-integer (NaN-surrogate) coordinate with a coordinate error", () => {
    const doc = validJson();
    const features = doc.features as Array<Record<string, unknown>>;
    features[0]!.start = [MIN_EI + 1.5, MIN_NI]; // fractional quantum
    features[0]!.delta = [];
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkCoordinateError);
  });

  it("rejects a negative (invalid zig-zag) delta with a coordinate error", () => {
    const doc = validJson();
    const features = doc.features as Array<Record<string, unknown>>;
    features[0]!.start = [MIN_EI, MIN_NI];
    features[0]!.delta = [-2, 4];
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkCoordinateError);
  });

  it("rejects an odd-length delta array with a coordinate error", () => {
    const doc = validJson();
    const features = doc.features as Array<Record<string, unknown>>;
    features[0]!.start = [MIN_EI, MIN_NI];
    features[0]!.delta = [2];
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkCoordinateError);
  });

  it("rejects an inverted cellRect with a coordinate error", () => {
    const doc = validJson();
    doc.cellRect = [MAX_EI, MIN_NI, MIN_EI, MAX_NI]; // minEi > maxEi
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkCoordinateError);
  });

  it("rejects a truncated payload with a malformed error", () => {
    const bytes = encodeRoadChunk(buildFixtureChunk());
    const truncated = bytes.slice(0, Math.floor(bytes.length / 2));
    expect(() => decodeRoadChunk(truncated)).toThrow(RoadChunkMalformedError);
  });

  it("rejects empty and non-JSON input with a malformed error", () => {
    expect(() => decodeRoadChunk("")).toThrow(RoadChunkMalformedError);
    expect(() => decodeRoadChunk("not json at all")).toThrow(RoadChunkMalformedError);
  });

  it("rejects a wrong-typed field (start not a number pair) with a schema error", () => {
    const doc = validJson();
    const features = doc.features as Array<Record<string, unknown>>;
    features[0]!.start = ["0", "0"];
    expect(() => decodeRoadChunk(JSON.stringify(doc))).toThrow(RoadChunkSchemaError);
  });
});

describe("roadchunk/1 codec — encode guardrails", () => {
  it("throws a typed encode error on a non-finite (NaN) coordinate", () => {
    const fixture = buildFixtureChunk();
    const broken: RoadChunk = {
      ...fixture,
      features: [{ featureId: "1104755807", roadClass: "S1100", start: [Number.NaN, MIN_NI], delta: [] }],
    };
    expect(() => encodeRoadChunk(broken)).toThrow(RoadChunkEncodeError);
  });

  it("throws a typed encode error on a coordinate outside cellRect", () => {
    const fixture = buildFixtureChunk();
    const broken: RoadChunk = {
      ...fixture,
      features: [{ featureId: "1104755807", roadClass: "S1100", start: [MAX_EI + 1, MIN_NI], delta: [] }],
    };
    expect(() => encodeRoadChunk(broken)).toThrow(RoadChunkEncodeError);
  });

  it("throws a typed encode error on a malformed featureId", () => {
    const fixture = buildFixtureChunk();
    const broken: RoadChunk = {
      ...fixture,
      features: [{ featureId: "bad id!", roadClass: "S1100", start: [MIN_EI, MIN_NI], delta: [] }],
    };
    expect(() => encodeRoadChunk(broken)).toThrow(RoadChunkEncodeError);
  });
});
