import { z } from "zod";

// =============================================================================
// roadchunk/1 codec — normative spec: docs/0.78R_WIRE_CONTRACT.md §1.1–§1.7,
// §2.4, §4.3. This module is the deterministic, additive JSON codec for a
// single `roadchunk/1` chunk payload (the decompressed document — the Brotli /
// gzip transport layer of §3.2 lives in the serving layer, not here).
//
// -----------------------------------------------------------------------------
// Codec decisions (where the wire contract underspecified a detail, the simplest
// explicit option was chosen; these feed back into the contract doc later).
// -----------------------------------------------------------------------------
// D1. `delta` values on the wire are ZIG-ZAG-ENCODED UNSIGNED integers. §1.6
//     names "zig-zag deltas" but gives neither the formula nor that it applies
//     at the JSON layer. We use the *arithmetic* zig-zag (n>=0 ? 2n : -2n-1),
//     not the 32-bit bitwise form, so it stays exact across the whole JS
//     safe-integer range (county spans can exceed 2^31 decimetres).
// D2. encode/decode operate on the DECOMPRESSED JSON document (string or bytes).
//     Brotli/gzip (§3.2) and the "corrupt Brotli" failure (§4.3) are the serving
//     layer's job; a decompression bomb is caught here only by the size cap (D3).
// D3. Decoded-size cap = 2 MiB (2*1024*1024 = 2_097_152 bytes), measured as the
//     UTF-8 byte length of the decoded JSON and checked BEFORE JSON.parse so a
//     bomb never gets parsed. §1.7 says "2 MB" without fixing MB-vs-MiB or the
//     measurement point.
// D4. Typed error taxonomy (all extend RoadChunkCodecError):
//       RoadChunkMalformedError   — truncated / non-JSON input.
//       RoadChunkSchemaError      — wrong type/shape/format, bad basisId or
//                                   schemaVersion, unknown keys.
//       RoadChunkCoordinateError  — value/geometry violations (below).
//       RoadChunkOversizedError   — decoded-bytes OR feature-count cap; the cap
//                                   that tripped is on `.limit`.
//       RoadChunkEncodeError      — encode input fails its own re-validation.
//     §4.3 lumps "invalid schema / coords" into one *handling* row (both →
//     degrade); we keep them as two classes under a shared RoadChunkDecodeError
//     base so callers can degrade uniformly (catch the base) while tests assert
//     the precise cause. §1.7 calls both caps "an oversized-decode error", so
//     they are ONE class discriminated by `.limit`.
// D5. schema-vs-coordinate split: type/shape/format → RoadChunkSchemaError;
//     value/geometry (non-integer, non-finite, out-of-cellRect, odd delta
//     length, negative zig-zag value, inverted cellRect) → RoadChunkCoordinate-
//     Error.
// D6. Every vertex — the absolute `start` AND every reconstructed vertex — MUST
//     lie within `cellRect` inclusive. §1.5 mandates the bake clip each feature
//     to the cell rect, so a self-contained chunk cannot carry geometry outside
//     it; decode enforces that invariant. NaN/∞ cannot ride in JSON (JSON.parse
//     rejects the tokens); the finite check still guards the encode path, where
//     a caller can hand us a live JS NaN.
// D7. `cellRect` is NOT cross-checked against `chunkId` grid math. Deriving a
//     base cell / quadtree-leaf rect from the id is the bake's responsibility
//     (§1.4 metro splitter); the codec validates cellRect internal consistency
//     and coordinate containment only, staying self-contained.
// D8. `featureId` is NOT required unique within a chunk. A road clipped into
//     disjoint pieces inside one cell legitimately repeats its stable featureId
//     (§1.5), so uniqueness is not enforced.
// D9. Field/format regexes (the contract gives only examples): geoid `^\d{5}$`;
//     roadClass MTFCC `^[A-Z]\d{4}$`; featureId `^[A-Za-z0-9]{1,64}$`; packHash
//     `^[0-9a-z][0-9a-z-]{0,127}$`; chunkId reuses the §2.4 guard
//     `^c-?\d+_-?\d+(_[0-3]+)?$`. Unknown object keys are rejected (`.strict()`).
// D10. encode is canonical + deterministic: fields emitted in a fixed order as
//     compact JSON (no whitespace) regardless of input key order, and encode
//     re-validates its input (structure + coordinates) so it can never emit a
//     payload decode would reject. encode does NOT apply the feature-count cap —
//     that cap is a client-side decode safety net (§1.7); the bake is trusted
//     not to approach it.
// D11. A structurally valid feature MAY carry an empty `delta` (a degenerate,
//     single-vertex clip); `delta` length MUST be even. `features: []` is a
//     valid declared-empty chunk (the round-trippable payload for a cell the
//     manifest marks present-but-empty).
// =============================================================================

// ---- Frozen constants (docs/0.78R_WIRE_CONTRACT.md §1) ----------------------

/** §1.1 — the one frozen spatial basis id every pack/chunk must carry. */
export const ROADCHUNK_BASIS_ID = "atlas-county-equirect-v1";

/** §1.6 — the wire schema version this codec reads and writes. */
export const ROADCHUNK_SCHEMA_VERSION = "roadchunk/1";

/** §1.3 — quantisation step: one quantum = 0.1 m (a decimetre). Frozen for v1. */
export const ROADCHUNK_QUANT_STEP_M = 0.1;

/** §1.4 — fixed metric grid-cell edge, in metres. Frozen-pending-calibration. */
export const ROADCHUNK_CELL_EDGE_M = 2048;

/** §1.3 — WGS84 equatorial radius, metres. */
export const ROADCHUNK_WGS84_RADIUS_M = 6378137;

/** §1.7 — decoded-size cap (D3: 2 MiB). Reject before parse. */
export const ROADCHUNK_MAX_DECODED_BYTES = 2 * 1024 * 1024;

/** §1.7 — decoded feature-count cap. */
export const ROADCHUNK_MAX_FEATURE_COUNT = 20_000;

/** §1.6 / §2.4 — the three LOD bands. */
export const ROADCHUNK_BANDS = ["lod0", "mid", "near"] as const;

const GEOID_RE = /^\d{5}$/;
const CHUNK_ID_RE = /^c-?\d+_-?\d+(_[0-3]+)?$/;
const ROAD_CLASS_RE = /^[A-Z]\d{4}$/;
const FEATURE_ID_RE = /^[A-Za-z0-9]{1,64}$/;
const PACK_HASH_RE = /^[0-9a-z][0-9a-z-]{0,127}$/;

// ---- Public types (the roadchunk/1 wire shape, §1.6) ------------------------

export type RoadChunkBand = (typeof ROADCHUNK_BANDS)[number];

/** `[minEi, minNi, maxEi, maxNi]`, quantised metres, inclusive (§1.6). */
export type RoadChunkCellRect = readonly [number, number, number, number];

export type RoadChunkFeature = {
  /** Stable across re-bakes; TIGER LINEARID or a bake-assigned hash (§1.5). */
  readonly featureId: string;
  /** TIGER MTFCC class tag, assigned at bake (§1.6). */
  readonly roadClass: string;
  /** Absolute first vertex, quantised metres (§1.6). */
  readonly start: readonly [number, number];
  /** Zig-zag-encoded unsigned deltas from `start`, flat `[dE,dN,dE,dN,…]` (D1). */
  readonly delta: readonly number[];
};

export type RoadChunk = {
  readonly basisId: string;
  readonly schemaVersion: string;
  readonly geoid: string;
  readonly packHash: string;
  readonly chunkId: string;
  readonly band: RoadChunkBand;
  readonly cellRect: RoadChunkCellRect;
  readonly features: readonly RoadChunkFeature[];
};

// ---- Error taxonomy (§4.3; repo convention: named Error subclasses) ---------

export abstract class RoadChunkCodecError extends Error {
  abstract readonly code: string;
}

/** encode input failed its own re-validation (D10). */
export class RoadChunkEncodeError extends RoadChunkCodecError {
  readonly code = "roadchunk-encode";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Cannot encode roadchunk/1 payload: ${issues.join("; ")}`);
    this.name = "RoadChunkEncodeError";
    this.issues = issues;
  }
}

/** Base for every decode-side rejection so callers can degrade uniformly. */
export abstract class RoadChunkDecodeError extends RoadChunkCodecError {}

/** Truncated or non-JSON payload (§4.3 "corrupt … / malformed"). */
export class RoadChunkMalformedError extends RoadChunkDecodeError {
  readonly code = "roadchunk-malformed";

  constructor(message: string, options?: ErrorOptions) {
    super(`Malformed roadchunk/1 payload: ${message}`, options);
    this.name = "RoadChunkMalformedError";
  }
}

/** Wrong type/shape/format, bad basisId/schemaVersion, or unknown keys (§4.3). */
export class RoadChunkSchemaError extends RoadChunkDecodeError {
  readonly code = "roadchunk-invalid-schema";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid roadchunk/1 schema: ${issues.join("; ")}`);
    this.name = "RoadChunkSchemaError";
    this.issues = issues;
  }
}

/** Value/geometry violation — non-integer, non-finite, out-of-cellRect, etc. */
export class RoadChunkCoordinateError extends RoadChunkDecodeError {
  readonly code = "roadchunk-invalid-coordinates";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid roadchunk/1 coordinates: ${issues.join("; ")}`);
    this.name = "RoadChunkCoordinateError";
    this.issues = issues;
  }
}

export type RoadChunkOversizedLimit = "decoded-bytes" | "feature-count";

/** Decoded-size or feature-count cap exceeded (§1.7 / §4.3 "oversized decode"). */
export class RoadChunkOversizedError extends RoadChunkDecodeError {
  readonly code = "roadchunk-oversized-decode";
  readonly limit: RoadChunkOversizedLimit;
  readonly observed: number;
  readonly ceiling: number;

  constructor(limit: RoadChunkOversizedLimit, observed: number, ceiling: number) {
    super(`Oversized roadchunk/1 decode (${limit}): ${observed} exceeds cap ${ceiling}`);
    this.name = "RoadChunkOversizedError";
    this.limit = limit;
    this.observed = observed;
    this.ceiling = ceiling;
  }
}

// ---- Zig-zag (D1) -----------------------------------------------------------

/** Signed integer → non-negative zig-zag code. Arithmetic form (safe-int wide). */
export function roadChunkZigZagEncode(value: number): number {
  return value >= 0 ? value * 2 : value * -2 - 1;
}

/** Non-negative zig-zag code → signed integer. Inverse of the above. */
export function roadChunkZigZagDecode(code: number): number {
  return code % 2 === 0 ? code / 2 : -(code + 1) / 2;
}

// ---- Structural schema (type/shape/format only — §4.3 schema failures) ------

const featureStructureSchema = z
  .object({
    featureId: z.string().regex(FEATURE_ID_RE, "featureId must be 1-64 alphanumeric characters"),
    roadClass: z.string().regex(ROAD_CLASS_RE, "roadClass must be a TIGER MTFCC code (letter + 4 digits)"),
    start: z.tuple([z.number(), z.number()]),
    delta: z.array(z.number()),
  })
  .strict();

const chunkStructureSchema = z
  .object({
    basisId: z.literal(ROADCHUNK_BASIS_ID),
    schemaVersion: z.literal(ROADCHUNK_SCHEMA_VERSION),
    geoid: z.string().regex(GEOID_RE, "geoid must be a 5-digit Census GEOID"),
    packHash: z.string().regex(PACK_HASH_RE, "packHash must be 1-128 chars of [0-9a-z-]"),
    chunkId: z.string().regex(CHUNK_ID_RE, "chunkId must match c<cellX>_<cellY>[_<quadpath>]"),
    band: z.enum(ROADCHUNK_BANDS),
    cellRect: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    features: z.array(featureStructureSchema),
  })
  .strict();

type StructuralChunk = z.infer<typeof chunkStructureSchema>;

function zodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

// ---- Coordinate / geometry validation (§4.3 coord failures; D5, D6) ---------

function isQuantisedInt(value: number): boolean {
  // Safe-integer check rejects NaN, ±∞, non-integers, and precision-lossy ints.
  return Number.isSafeInteger(value);
}

/**
 * Validate every value/geometry constraint on an already-structurally-valid
 * chunk. Returns a list of human-readable issues (empty ⇒ valid). Pure: it does
 * not throw, so both encode and decode can map the issues onto their own error.
 */
function collectCoordinateIssues(chunk: StructuralChunk): string[] {
  const issues: string[] = [];
  const [minEi, minNi, maxEi, maxNi] = chunk.cellRect;

  for (let i = 0; i < 4; i += 1) {
    const component = chunk.cellRect[i];
    if (component === undefined || !isQuantisedInt(component)) {
      issues.push(`cellRect[${i}] must be a safe integer (got ${String(component)})`);
    }
  }
  if (issues.length > 0) {
    // A malformed rect makes containment checks meaningless — stop here.
    return issues;
  }
  if (minEi > maxEi) {
    issues.push(`cellRect east range is inverted: minEi ${minEi} > maxEi ${maxEi}`);
  }
  if (minNi > maxNi) {
    issues.push(`cellRect north range is inverted: minNi ${minNi} > maxNi ${maxNi}`);
  }

  const inRect = (e: number, n: number): boolean => e >= minEi && e <= maxEi && n >= minNi && n <= maxNi;

  chunk.features.forEach((feature, index) => {
    const label = `features[${index}] (${feature.featureId})`;
    const [startE, startN] = feature.start;

    if (!isQuantisedInt(startE) || !isQuantisedInt(startN)) {
      issues.push(`${label}.start must be safe-integer quantised metres (got [${String(startE)}, ${String(startN)}])`);
      return;
    }
    if (!inRect(startE, startN)) {
      issues.push(`${label}.start [${startE}, ${startN}] is outside cellRect`);
      return;
    }

    const { delta } = feature;
    if (delta.length % 2 !== 0) {
      issues.push(`${label}.delta length ${delta.length} is odd (must be [dE,dN] pairs)`);
      return;
    }

    let curE = startE;
    let curN = startN;
    for (let d = 0; d < delta.length; d += 2) {
      const codeE = delta[d];
      const codeN = delta[d + 1];
      if (codeE === undefined || codeN === undefined) {
        issues.push(`${label}.delta pair ${d / 2} is incomplete`);
        return;
      }
      if (!isQuantisedInt(codeE) || codeE < 0 || !isQuantisedInt(codeN) || codeN < 0) {
        issues.push(`${label}.delta pair ${d / 2} must be non-negative zig-zag safe integers (got [${String(codeE)}, ${String(codeN)}])`);
        return;
      }
      curE += roadChunkZigZagDecode(codeE);
      curN += roadChunkZigZagDecode(codeN);
      if (!isQuantisedInt(curE) || !isQuantisedInt(curN)) {
        issues.push(`${label} vertex ${d / 2 + 1} overflows the safe-integer range`);
        return;
      }
      if (!inRect(curE, curN)) {
        issues.push(`${label} vertex ${d / 2 + 1} [${curE}, ${curN}] is outside cellRect`);
        return;
      }
    }
  });

  return issues;
}

/** Build a fresh canonical RoadChunk (fixed field order) from parsed data. */
function buildCanonicalRoadChunk(chunk: StructuralChunk): RoadChunk {
  return {
    basisId: chunk.basisId,
    schemaVersion: chunk.schemaVersion,
    geoid: chunk.geoid,
    packHash: chunk.packHash,
    chunkId: chunk.chunkId,
    band: chunk.band,
    cellRect: [chunk.cellRect[0], chunk.cellRect[1], chunk.cellRect[2], chunk.cellRect[3]],
    features: chunk.features.map((feature) => ({
      featureId: feature.featureId,
      roadClass: feature.roadClass,
      start: [feature.start[0], feature.start[1]] as [number, number],
      delta: feature.delta.slice(),
    })),
  };
}

/** Canonical, whitespace-free serialisation with a fixed field order (D10). */
function serializeCanonical(chunk: RoadChunk): string {
  return JSON.stringify({
    basisId: chunk.basisId,
    schemaVersion: chunk.schemaVersion,
    geoid: chunk.geoid,
    packHash: chunk.packHash,
    chunkId: chunk.chunkId,
    band: chunk.band,
    cellRect: [chunk.cellRect[0], chunk.cellRect[1], chunk.cellRect[2], chunk.cellRect[3]],
    features: chunk.features.map((feature) => ({
      featureId: feature.featureId,
      roadClass: feature.roadClass,
      start: [feature.start[0], feature.start[1]],
      delta: feature.delta.slice(),
    })),
  });
}

// ---- Byte accounting (D3) ---------------------------------------------------

/** UTF-8 byte length without allocating a duplicate buffer (bomb-safe). */
function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      // High surrogate begins a 4-byte astral pair.
      bytes += 4;
      i += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

// ---- Public API -------------------------------------------------------------

/**
 * Serialise a roadchunk/1 chunk to its canonical, deterministic JSON string.
 * Re-validates structure and geometry first (D10); throws RoadChunkEncodeError
 * if the input could not be decoded back, so encode never emits invalid bytes.
 */
export function encodeRoadChunk(chunk: RoadChunk): string {
  const structural = chunkStructureSchema.safeParse(chunk);
  if (!structural.success) {
    throw new RoadChunkEncodeError(zodIssues(structural.error));
  }
  const coordinateIssues = collectCoordinateIssues(structural.data);
  if (coordinateIssues.length > 0) {
    throw new RoadChunkEncodeError(coordinateIssues);
  }
  return serializeCanonical(buildCanonicalRoadChunk(structural.data));
}

/**
 * Decode + validate a roadchunk/1 payload (the decompressed JSON, as a string
 * or UTF-8 bytes). Enforces the §1.7 decode caps and the §4.3 failure taxonomy,
 * rejecting every malformed input with a typed RoadChunkDecodeError subclass.
 */
export function decodeRoadChunk(payload: string | Uint8Array): RoadChunk {
  // 1. Size cap first (D3) — reject a bomb before parsing or decoding to text.
  const byteLength = typeof payload === "string" ? utf8ByteLength(payload) : payload.byteLength;
  if (byteLength > ROADCHUNK_MAX_DECODED_BYTES) {
    throw new RoadChunkOversizedError("decoded-bytes", byteLength, ROADCHUNK_MAX_DECODED_BYTES);
  }

  const text = typeof payload === "string" ? payload : new TextDecoder("utf-8", { fatal: false }).decode(payload);

  // 2. Parse — truncated / non-JSON is a malformed payload.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (cause) {
    throw new RoadChunkMalformedError("payload is not valid JSON", { cause });
  }

  // 3. Feature-count cap (D3) — check on the raw array before full validation so
  //    an over-long chunk is rejected as oversized, not schema-invalid.
  if (isRecord(parsed) && Array.isArray(parsed.features) && parsed.features.length > ROADCHUNK_MAX_FEATURE_COUNT) {
    throw new RoadChunkOversizedError("feature-count", parsed.features.length, ROADCHUNK_MAX_FEATURE_COUNT);
  }

  // 4. Structural validation (type/shape/format/basisId/schemaVersion).
  const structural = chunkStructureSchema.safeParse(parsed);
  if (!structural.success) {
    throw new RoadChunkSchemaError(zodIssues(structural.error));
  }

  // 5. Value/geometry validation (integer, finite, in-cellRect, zig-zag).
  const coordinateIssues = collectCoordinateIssues(structural.data);
  if (coordinateIssues.length > 0) {
    throw new RoadChunkCoordinateError(coordinateIssues);
  }

  return buildCanonicalRoadChunk(structural.data);
}

// ---- Vertex ⇆ wire helpers (renderer convenience + fixture building) --------

/**
 * Expand a feature's `start` + zig-zag `delta` into its absolute quantised-metre
 * polyline. Assumes the feature already passed decode/encode validation.
 */
export function roadChunkFeatureToVertices(feature: RoadChunkFeature): Array<[number, number]> {
  const vertices: Array<[number, number]> = [[feature.start[0], feature.start[1]]];
  let curE = feature.start[0];
  let curN = feature.start[1];
  for (let d = 0; d + 1 < feature.delta.length; d += 2) {
    curE += roadChunkZigZagDecode(feature.delta[d] as number);
    curN += roadChunkZigZagDecode(feature.delta[d + 1] as number);
    vertices.push([curE, curN]);
  }
  return vertices;
}

/**
 * Build a wire feature from an absolute quantised-metre polyline, computing the
 * `start` + zig-zag `delta` array. Throws RoadChunkEncodeError on invalid input.
 */
export function roadChunkFeatureFromVertices(
  featureId: string,
  roadClass: string,
  vertices: ReadonlyArray<readonly [number, number]>,
): RoadChunkFeature {
  const issues: string[] = [];
  if (!FEATURE_ID_RE.test(featureId)) {
    issues.push(`featureId must be 1-64 alphanumeric characters (got ${JSON.stringify(featureId)})`);
  }
  if (!ROAD_CLASS_RE.test(roadClass)) {
    issues.push(`roadClass must be a TIGER MTFCC code (got ${JSON.stringify(roadClass)})`);
  }
  if (vertices.length < 1) {
    issues.push("a feature needs at least one vertex");
  }
  for (const [index, vertex] of vertices.entries()) {
    const e = vertex[0];
    const n = vertex[1];
    if (!isQuantisedInt(e) || !isQuantisedInt(n)) {
      issues.push(`vertex ${index} must be safe-integer quantised metres (got [${String(e)}, ${String(n)}])`);
    }
  }
  if (issues.length > 0) {
    throw new RoadChunkEncodeError(issues);
  }

  const first = vertices[0] as readonly [number, number];
  const delta: number[] = [];
  let prevE = first[0];
  let prevN = first[1];
  for (let i = 1; i < vertices.length; i += 1) {
    const vertex = vertices[i] as readonly [number, number];
    delta.push(roadChunkZigZagEncode(vertex[0] - prevE), roadChunkZigZagEncode(vertex[1] - prevN));
    prevE = vertex[0];
    prevN = vertex[1];
  }

  return { featureId, roadClass, start: [first[0], first[1]], delta };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
