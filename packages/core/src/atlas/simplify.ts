/**
 * Polyline simplification for atlas level-of-detail.
 *
 * The full-resolution Census rings are the right thing to draw for one county
 * on its own plate, but the national plate has 3,224 of them. Drawing every
 * vertex there would ship megabytes to render coastline detail smaller than a
 * pixel. Simplification is what turns one dataset into an atlas with plates at
 * several scales.
 *
 * Douglas–Peucker is the right algorithm here rather than vertex decimation
 * because it is shape-preserving: it keeps the vertices that carry the
 * silhouette (a peninsula, a river bend) and drops the ones that only add
 * smoothness. A coastline simplified this way still reads as that coastline.
 */

import type { LonLat } from "./projection.js";

/**
 * Perpendicular distance from `point` to the segment `start`-`end`, in degrees.
 *
 * Degrees rather than ground distance is deliberate and sufficient: tolerance
 * is chosen per zoom level in the same units, and the error from ignoring
 * meridian convergence is uniform within any single plate.
 */
function perpendicularDistance(point: LonLat, start: LonLat, end: LonLat): number {
  const [px, py] = point;
  const [sx, sy] = start;
  const [ex, ey] = end;

  const dx = ex - sx;
  const dy = ey - sy;

  if (dx === 0 && dy === 0) return Math.hypot(px - sx, py - sy);

  // Project the point onto the segment, clamped to the segment's ends.
  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (sx + t * dx), py - (sy + t * dy));
}

/**
 * Douglas–Peucker, iterative rather than recursive.
 *
 * Some Census rings run to tens of thousands of vertices (the Louisiana and
 * Alaska coastlines especially). A recursive implementation blows the stack on
 * those in the pathological case, so this keeps an explicit work stack.
 */
export function simplifyRing(ring: readonly LonLat[], tolerance: number): LonLat[] {
  if (ring.length <= 2 || tolerance <= 0) return [...ring];

  const keep = new Uint8Array(ring.length);
  keep[0] = 1;
  keep[ring.length - 1] = 1;

  const stack: Array<[number, number]> = [[0, ring.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    if (last <= first + 1) continue;

    let maxDistance = 0;
    let maxIndex = first;

    for (let i = first + 1; i < last; i += 1) {
      const distance = perpendicularDistance(ring[i]!, ring[first]!, ring[last]!);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > tolerance) {
      keep[maxIndex] = 1;
      stack.push([first, maxIndex], [maxIndex, last]);
    }
  }

  const simplified: LonLat[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    if (keep[i]) simplified.push(ring[i]!);
  }
  return simplified;
}

/**
 * Simplify a closed ring while guaranteeing it stays a drawable polygon.
 *
 * Douglas–Peucker on a closed ring can collapse it to two points, which draws
 * as an invisible hairline. A county that exists must not vanish from the
 * national plate, so a ring that collapses is retried at successively looser
 * definitions and ultimately falls back to its bounding triangle. Every county
 * in the dataset renders as *something* at every zoom.
 */
export function simplifyClosedRing(ring: readonly LonLat[], tolerance: number): LonLat[] {
  if (ring.length <= 4) return [...ring];

  let simplified = simplifyRing(ring, tolerance);
  let attempt = tolerance;

  while (simplified.length < 4 && attempt > 1e-6) {
    attempt /= 4;
    simplified = simplifyRing(ring, attempt);
  }

  if (simplified.length < 4) {
    // Degenerate: keep the extreme points so the shape still has area.
    const sorted = [...ring].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const west = sorted[0]!;
    const east = sorted[sorted.length - 1]!;
    const north = [...ring].sort((a, b) => b[1] - a[1])[0]!;
    return [west, north, east, west];
  }

  // Close the ring if simplification dropped the duplicate endpoint.
  const first = simplified[0]!;
  const last = simplified[simplified.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) simplified.push(first);

  return simplified;
}

/**
 * Approximate ring area in square degrees (shoelace).
 *
 * Used to decide whether a ring is worth drawing at a given zoom. A lake that
 * would occupy a quarter of a pixel on the national plate is noise, not
 * information — dropping it is a cartographic decision, not a data loss.
 */
export function ringAreaDegrees(ring: readonly LonLat[]): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % ring.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** Round coordinates to a fixed number of decimals to shrink the payload. */
export function quantizeRing(ring: readonly LonLat[], decimals: number): LonLat[] {
  const factor = 10 ** decimals;
  const out: LonLat[] = [];
  let previous: LonLat | undefined;

  for (const [lon, lat] of ring) {
    const point: LonLat = [Math.round(lon * factor) / factor, Math.round(lat * factor) / factor];
    // Quantization frequently produces runs of identical points; they cost
    // bytes and draw nothing.
    if (previous && previous[0] === point[0] && previous[1] === point[1]) continue;
    out.push(point);
    previous = point;
  }

  return out;
}
