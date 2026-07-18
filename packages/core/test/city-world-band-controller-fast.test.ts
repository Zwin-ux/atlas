import { describe, expect, it } from "vitest";
import {
  BAND_DENSITY_REFERENCE_VIEWPORT_PX,
  BAND_FAR_MID_DENSITY,
  BAND_HYSTERESIS_MARGIN,
  BAND_MID_NEAR_DENSITY,
  bandFromCode,
  bandToCode,
  createBandControllerState,
  deriveBandDensity,
  deriveBandDensityArgs,
  reduceBandController,
  runBandController,
  selectBand,
  selectBandCode,
  stepBandControllerMut,
  type BandControllerEvent,
  type BandControllerState,
  type BandExplicitSettleCause,
  type BandDegradeReason,
  type BandGestureSource,
  type ManifestEpoch,
  type ZoomBand,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Independent reference semantics (the ORIGINAL branching / expression forms).
// The optimized production code must match these exactly. These deliberately do
// NOT call the production functions — they re-derive the answer the slow way.
// ---------------------------------------------------------------------------

function refSelectBand(density: number, currentBand?: ZoomBand): ZoomBand {
  if (currentBand === undefined) {
    if (density >= BAND_MID_NEAR_DENSITY) return "near";
    if (density >= BAND_FAR_MID_DENSITY) return "mid";
    return "far";
  }
  const upFarMid = BAND_FAR_MID_DENSITY + BAND_HYSTERESIS_MARGIN;
  const downFarMid = BAND_FAR_MID_DENSITY - BAND_HYSTERESIS_MARGIN;
  const upMidNear = BAND_MID_NEAR_DENSITY + BAND_HYSTERESIS_MARGIN;
  const downMidNear = BAND_MID_NEAR_DENSITY - BAND_HYSTERESIS_MARGIN;
  switch (currentBand) {
    case "far":
      if (density >= upMidNear) return "near";
      if (density >= upFarMid) return "mid";
      return "far";
    case "mid":
      if (density >= upMidNear) return "near";
      if (density < downFarMid) return "far";
      return "mid";
    case "near":
      if (density < downFarMid) return "far";
      if (density < downMidNear) return "mid";
      return "near";
  }
}

// Documented clamps (MIN_VIEWPORT_SPAN_PX=1, MIN_COUNTY_SCALE=MIN_DEVICE_SCALE=1e-6).
function refDeriveDensity(zoom: number, viewportSpanPx: number, countyScale: number, deviceScale: number): number {
  const z = Number.isFinite(zoom) ? Math.max(0, zoom) : 0;
  const v = Math.max(1, viewportSpanPx);
  const c = Math.max(1e-6, countyScale);
  const d = Math.max(1e-6, deviceScale);
  const viewportFactor = v / BAND_DENSITY_REFERENCE_VIEWPORT_PX;
  return (z * viewportFactor * d) / c;
}

// ---------------------------------------------------------------------------
// Seeded deterministic PRNG (mulberry32) + helpers.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length] as T;
}

const EPOCHS: readonly ManifestEpoch[] = [
  { schemaVersion: "roadchunk/1", packHash: "b3-A" },
  { schemaVersion: "roadchunk/1", packHash: "b3-B" },
];
const SOURCES: readonly BandGestureSource[] = ["wheel", "pinch", "pan"];
// unmount is excluded here (it makes the controller terminal, truncating
// coverage); its inert-equivalence is covered by a dedicated test below.
const SETTLE_CAUSES: readonly BandExplicitSettleCause[] = ["inertia-end", "cancel", "lost-capture", "blur"];
const REASONS: readonly BandDegradeReason[] = [
  "missing-expected-chunk",
  "storage-unavailable",
  "retired-version",
  "corrupt-chunk",
  "invalid-schema",
  "oversized-decode",
  "aborted",
  "unknown",
];

/**
 * Generate a random-but-realistic event sequence. It folds a scratch state
 * through the pure reducer as it builds, so commit/commit-failed events can
 * target the CURRENT pending intent id and pinned epoch often enough to actually
 * exercise the accept paths (not just the stale/ignored paths).
 */
function generateEvents(rng: () => number, count: number): BandControllerEvent[] {
  const events: BandControllerEvent[] = [];
  let scratch = createBandControllerState();
  let time = 0;
  for (let i = 0; i < count; i++) {
    time += 1 + Math.floor(rng() * 300);
    const roll = rng();
    let event: BandControllerEvent;
    if (roll < 0.35) {
      event = { type: "gesture-activity", source: pick(rng, SOURCES), density: rng() * 3, time };
    } else if (roll < 0.55) {
      event = { type: "tick", time };
    } else if (roll < 0.7) {
      event = { type: "settle", cause: pick(rng, SETTLE_CAUSES), time };
    } else if (roll < 0.78) {
      event = { type: "pin-epoch", epoch: pick(rng, EPOCHS) };
    } else if (roll < 0.83) {
      event = { type: "retire-epoch", time };
    } else if (roll < 0.92) {
      const intentId = scratch.pendingIntent && rng() < 0.6 ? scratch.pendingIntent.id : Math.floor(rng() * 6);
      const epoch = scratch.pinnedEpoch && rng() < 0.7 ? scratch.pinnedEpoch : pick(rng, EPOCHS);
      event = { type: "commit", intentId, epoch, time };
    } else {
      const intentId = scratch.pendingIntent && rng() < 0.6 ? scratch.pendingIntent.id : Math.floor(rng() * 6);
      const epoch = scratch.pinnedEpoch && rng() < 0.7 ? scratch.pinnedEpoch : pick(rng, EPOCHS);
      event = { type: "commit-failed", intentId, epoch, reason: pick(rng, REASONS), time };
    }
    events.push(event);
    scratch = reduceBandController(scratch, event);
  }
  return events;
}

// ---------------------------------------------------------------------------
// Selection & density: optimized production code ≡ independent reference.
// ---------------------------------------------------------------------------

describe("selectBandCode ≡ reference band selection (fuzz)", () => {
  it("matches the branching reference across randomized density × current-band", () => {
    const rng = mulberry32(0xc0ffee);
    const bands: (ZoomBand | undefined)[] = [undefined, "far", "mid", "near"];
    for (let i = 0; i < 8000; i++) {
      const density = rng() * 5 - 1; // covers below-zero, the sticky windows, and above-near
      const band = pick(rng, bands);
      const code = band === undefined ? -1 : bandToCode(band);
      const expected = refSelectBand(density, band);
      expect(bandFromCode(selectBandCode(density, code))).toBe(expected);
      expect(selectBand(density, band)).toBe(expected);
    }
  });

  it("matches the reference exactly on and around every hysteresis edge", () => {
    const edges = [
      BAND_FAR_MID_DENSITY,
      BAND_MID_NEAR_DENSITY,
      BAND_FAR_MID_DENSITY + BAND_HYSTERESIS_MARGIN,
      BAND_FAR_MID_DENSITY - BAND_HYSTERESIS_MARGIN,
      BAND_MID_NEAR_DENSITY + BAND_HYSTERESIS_MARGIN,
      BAND_MID_NEAR_DENSITY - BAND_HYSTERESIS_MARGIN,
    ];
    const bands: (ZoomBand | undefined)[] = [undefined, "far", "mid", "near"];
    for (const edge of edges) {
      for (const delta of [-1e-9, 0, 1e-9]) {
        const density = edge + delta;
        for (const band of bands) {
          expect(selectBand(density, band)).toBe(refSelectBand(density, band));
        }
      }
    }
  });

  it("round-trips band ↔ code", () => {
    for (const band of ["far", "mid", "near"] as const) {
      expect(bandFromCode(bandToCode(band))).toBe(band);
    }
    expect(bandFromCode(-1)).toBe("far"); // out-of-range guards to FAR
    expect(bandFromCode(99)).toBe("far");
  });
});

describe("deriveBandDensityArgs ≡ reference density derivation (fuzz)", () => {
  it("is bit-identical to the reference and to deriveBandDensity across randomized inputs", () => {
    const rng = mulberry32(0x1234abcd);
    for (let i = 0; i < 8000; i++) {
      const zoom = rng() * 12 - 2; // includes negatives
      const viewportSpanPx = rng() * 2200; // includes sub-1 (clamped)
      const countyScale = rng() * 5; // includes ~0 (clamped)
      const deviceScale = rng() < 0.5 ? 1 : rng() * 3;
      const expected = refDeriveDensity(zoom, viewportSpanPx, countyScale, deviceScale);
      expect(deriveBandDensityArgs(zoom, viewportSpanPx, countyScale, deviceScale)).toBe(expected);
      expect(deriveBandDensity({ zoom, viewportSpanPx, countyScale, deviceScale })).toBe(expected);
    }
  });

  it("clamps degenerate inputs identically (NaN / Infinity / zero / negative)", () => {
    const cases: [number, number, number, number][] = [
      [Number.NaN, 900, 1, 1],
      [Number.POSITIVE_INFINITY, 900, 1, 1],
      [-5, 900, 1, 1],
      [1, 0, 1, 1],
      [1, 900, 0, 1],
      [1, 900, 1, 0],
    ];
    for (const [zoom, v, c, d] of cases) {
      const expected = refDeriveDensity(zoom, v, c, d);
      expect(deriveBandDensityArgs(zoom, v, c, d)).toBe(expected);
      expect(Number.isFinite(deriveBandDensityArgs(zoom, v, c, d))).toBe(true);
    }
  });

  it("defaults deviceScale to 1 in the primitive path", () => {
    expect(deriveBandDensityArgs(1.5, BAND_DENSITY_REFERENCE_VIEWPORT_PX, 1)).toBe(
      deriveBandDensityArgs(1.5, BAND_DENSITY_REFERENCE_VIEWPORT_PX, 1, 1),
    );
  });
});

// ---------------------------------------------------------------------------
// In-place fast path ≡ pure reducer (reference semantics), across random traces.
// ---------------------------------------------------------------------------

function snapshot(state: BandControllerState): BandControllerState {
  return structuredClone(state);
}

describe("stepBandControllerMut ≡ reduceBandController (seeded fuzz)", () => {
  it("produces identical per-step state traces across many randomized sequences", () => {
    for (let seed = 1; seed <= 120; seed++) {
      const rng = mulberry32(seed);
      const events = generateEvents(rng, 40);

      // Pure reference trace.
      const pure = runBandController(createBandControllerState(), events);

      // In-place fast-path trace (snapshot after each mutation).
      let mutState = createBandControllerState();
      const mutTrace: BandControllerState[] = [];
      for (const event of events) {
        mutState = stepBandControllerMut(mutState, event);
        mutTrace.push(snapshot(mutState));
      }

      expect(mutTrace.length).toBe(pure.trace.length);
      for (let i = 0; i < mutTrace.length; i++) {
        expect(mutTrace[i]).toEqual(pure.trace[i]);
      }
      expect(snapshot(mutState)).toEqual(pure.state);
    }
  });

  it("mutates in place (same reference) while the pure reducer returns a fresh object", () => {
    const event: BandControllerEvent = { type: "gesture-activity", source: "wheel", density: 1.5, time: 0 };

    const mutState = createBandControllerState();
    const stepped = stepBandControllerMut(mutState, event);
    expect(stepped).toBe(mutState); // in place
    expect(stepped.desiredBand).toBe("near");

    const pureState = createBandControllerState();
    const reduced = reduceBandController(pureState, event);
    expect(reduced).not.toBe(pureState); // fresh object
    expect(pureState.desiredBand).toBe("far"); // input untouched
    expect(reduced.desiredBand).toBe("near");
  });

  it("keeps unmount terminal + inert identically on both paths", () => {
    const events: BandControllerEvent[] = [
      { type: "gesture-activity", source: "wheel", density: 1.5, time: 0 },
      { type: "settle", cause: "unmount", time: 10 },
      { type: "gesture-activity", source: "wheel", density: 2.0, time: 20 },
      { type: "pin-epoch", epoch: EPOCHS[0]! },
    ];
    const pure = runBandController(createBandControllerState(), events);

    let mutState = createBandControllerState();
    for (const event of events) mutState = stepBandControllerMut(mutState, event);

    expect(snapshot(mutState)).toEqual(pure.state);
    expect(mutState.unmounted).toBe(true);
  });

  it("agrees on a hand-built sequence that exercises accept + stale commit + backoff + degrade", () => {
    const epoch = EPOCHS[0]!;
    const events: BandControllerEvent[] = [
      { type: "pin-epoch", epoch },
      { type: "gesture-activity", source: "wheel", density: 1.5, time: 0 },
      { type: "tick", time: 140 },
      { type: "commit-failed", intentId: 1, epoch, reason: "storage-unavailable", time: 200 },
      { type: "gesture-activity", source: "wheel", density: 1.5, time: 1000 },
      { type: "tick", time: 1140 },
      { type: "commit", intentId: 1, epoch: EPOCHS[1]!, time: 1200 }, // wrong epoch -> ignored
      { type: "commit", intentId: 2, epoch, time: 1300 }, // accepted
    ];
    const pure = runBandController(createBandControllerState(), events);
    let mutState = createBandControllerState();
    const mutTrace: BandControllerState[] = [];
    for (const event of events) {
      mutState = stepBandControllerMut(mutState, event);
      mutTrace.push(snapshot(mutState));
    }
    for (let i = 0; i < mutTrace.length; i++) expect(mutTrace[i]).toEqual(pure.trace[i]);
    expect(pure.state.committedBand).toBe("near");
    expect(pure.state.degrade.active).toBe(false);
  });
});
