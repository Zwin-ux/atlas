/**
 * Compact wire encoding for atlas rings.
 *
 * A ring of lon/lat pairs written as plain JSON floats costs roughly 23 bytes
 * per vertex (`[-80.092,25.721],`). The national plate has ~45,000 vertices
 * after simplification, so plain JSON lands near a megabyte — enough to matter
 * inside a ChatGPT widget, where an oversized payload has already crashed a
 * session once in this project's history.
 *
 * Two observations make it much smaller:
 *
 *  1. Coordinates only need fixed precision. At national scale, 3 decimals
 *     (~110 m) is finer than a pixel, so they can be integers.
 *  2. Adjacent vertices in a ring are close together. Their differences are
 *     small integers, and small integers are short in JSON.
 *
 * So a ring becomes a flat array of integers: the first pair absolute, every
 * later pair a delta from the previous. `[-80092,25721,54,41,36,34]` instead of
 * three float pairs. Typical saving is 3-4x before transport compression, and
 * it stays plain JSON — no binary blob, no custom parser, still debuggable by
 * reading it.
 */

import type { LonLat } from "./projection.js";

/** A ring encoded as [lon0, lat0, dLon1, dLat1, dLon2, dLat2, ...] fixed-point. */
export type EncodedRing = number[];

export type RingPrecision = {
  /** Decimal places retained; the scale factor is 10 ** decimals. */
  readonly decimals: number;
};

export function encodeRing(ring: readonly LonLat[], precision: RingPrecision): EncodedRing {
  const factor = 10 ** precision.decimals;
  const encoded: EncodedRing = [];

  let previousLon = 0;
  let previousLat = 0;

  for (let i = 0; i < ring.length; i += 1) {
    const [lon, lat] = ring[i]!;
    const quantizedLon = Math.round(lon * factor);
    const quantizedLat = Math.round(lat * factor);

    if (i === 0) {
      encoded.push(quantizedLon, quantizedLat);
    } else {
      encoded.push(quantizedLon - previousLon, quantizedLat - previousLat);
    }

    previousLon = quantizedLon;
    previousLat = quantizedLat;
  }

  return encoded;
}

export function decodeRing(encoded: readonly number[], precision: RingPrecision): LonLat[] {
  const factor = 10 ** precision.decimals;
  const ring: LonLat[] = [];

  let lon = 0;
  let lat = 0;

  for (let i = 0; i + 1 < encoded.length; i += 2) {
    if (i === 0) {
      lon = encoded[0]!;
      lat = encoded[1]!;
    } else {
      lon += encoded[i]!;
      lat += encoded[i + 1]!;
    }
    ring.push([lon / factor, lat / factor]);
  }

  return ring;
}

/** Total vertex count across encoded rings, without decoding them. */
export function encodedVertexCount(rings: readonly EncodedRing[]): number {
  return rings.reduce((total, ring) => total + ring.length / 2, 0);
}
