import { describe, expect, it } from "vitest";
import {
  BAND_DENSITY_REFERENCE_VIEWPORT_PX,
  BAND_FAR_MID_DENSITY,
  BAND_HYSTERESIS_MARGIN,
  BAND_MID_NEAR_DENSITY,
  BAND_BACKOFF_BASE_MS,
  WHEEL_IDLE_SETTLE_MS,
  bandBackoffDelayMs,
  createBandControllerState,
  deriveBandDensity,
  reduceBandController,
  runBandController,
  selectBand,
  type BandControllerEvent,
  type BandControllerState,
  type BandExplicitSettleCause,
  type ManifestEpoch,
} from "../src/index.js";

const EPOCH_A: ManifestEpoch = { schemaVersion: "roadchunk/1", packHash: "b3-aaaa" };
const EPOCH_B: ManifestEpoch = { schemaVersion: "roadchunk/1", packHash: "b3-bbbb" };

/** Drive a wheel gesture at a density, then let it settle via the idle timeout. */
function wheelSettle(state: BandControllerState, density: number, startTime: number): BandControllerState {
  let next = reduceBandController(state, { type: "gesture-activity", source: "wheel", density, time: startTime });
  next = reduceBandController(next, { type: "tick", time: startTime + WHEEL_IDLE_SETTLE_MS });
  return next;
}

describe("selectBand — pure density curve + hysteresis", () => {
  it("classifies bare density at the 0.7 / 1.4 calibration points without a current band", () => {
    expect(selectBand(0)).toBe("far");
    expect(selectBand(BAND_FAR_MID_DENSITY - 0.01)).toBe("far");
    expect(selectBand(BAND_FAR_MID_DENSITY)).toBe("mid");
    expect(selectBand(1.0)).toBe("mid");
    expect(selectBand(BAND_MID_NEAR_DENSITY)).toBe("near");
    expect(selectBand(3.0)).toBe("near");
  });

  it("resolves multi-band jumps in one call (FAR->NEAR and NEAR->FAR)", () => {
    expect(selectBand(2.0, "far")).toBe("near");
    expect(selectBand(0.1, "near")).toBe("far");
  });

  it("parks at a boundary with ZERO thrash when density oscillates inside the hysteresis window", () => {
    // Oscillate around the FAR/MID boundary (0.7) inside the sticky window
    // [0.62, 0.78]. Starting FAR, the band must never flip to MID.
    let band = selectBand(0.5, "far");
    expect(band).toBe("far");
    const farMidWobble = [0.66, 0.74, 0.68, 0.72, 0.63, 0.77, 0.7, 0.71, 0.69];
    for (const d of farMidWobble) {
      band = selectBand(d, band);
      expect(band).toBe("far");
    }

    // Cross decisively above the up-edge (0.78) -> MID, then oscillate around the
    // MID/NEAR boundary (1.4) inside [1.32, 1.48]; must stay MID.
    band = selectBand(0.8, band);
    expect(band).toBe("mid");
    const midNearWobble = [1.34, 1.46, 1.38, 1.42, 1.33, 1.47, 1.4, 1.41, 1.39];
    for (const d of midNearWobble) {
      band = selectBand(d, band);
      expect(band).toBe("mid");
    }

    // Cross above 1.48 -> NEAR; oscillating back down inside [1.32, 1.48] stays NEAR.
    band = selectBand(1.5, band);
    expect(band).toBe("near");
    for (const d of midNearWobble) {
      band = selectBand(d, band);
      expect(band).toBe("near");
    }
  });

  it("requires crossing the full margin before flipping (asymmetric up/down edges)", () => {
    // Just above the raw threshold but below the up-edge: FAR stays FAR.
    expect(selectBand(BAND_FAR_MID_DENSITY + BAND_HYSTERESIS_MARGIN / 2, "far")).toBe("far");
    // Above the up-edge: FAR -> MID.
    expect(selectBand(BAND_FAR_MID_DENSITY + BAND_HYSTERESIS_MARGIN + 0.001, "far")).toBe("mid");
    // Just below the raw threshold but above the down-edge: MID stays MID.
    expect(selectBand(BAND_FAR_MID_DENSITY - BAND_HYSTERESIS_MARGIN / 2, "mid")).toBe("mid");
    // Below the down-edge: MID -> FAR.
    expect(selectBand(BAND_FAR_MID_DENSITY - BAND_HYSTERESIS_MARGIN - 0.001, "mid")).toBe("far");
  });
});

describe("deriveBandDensity — zoom x viewport x county scale", () => {
  it("returns exactly zoom at the reference viewport / county scale / device scale", () => {
    for (const zoom of [0.3, 0.7, 1.0, 1.4, 2.5]) {
      const density = deriveBandDensity({ zoom, viewportSpanPx: BAND_DENSITY_REFERENCE_VIEWPORT_PX, countyScale: 1 });
      expect(density).toBeCloseTo(zoom, 10);
    }
  });

  it("is monotonic: denser with more zoom / bigger viewport / higher device scale, sparser with a bigger county", () => {
    const base = deriveBandDensity({ zoom: 1, viewportSpanPx: BAND_DENSITY_REFERENCE_VIEWPORT_PX, countyScale: 1 });
    expect(deriveBandDensity({ zoom: 2, viewportSpanPx: BAND_DENSITY_REFERENCE_VIEWPORT_PX, countyScale: 1 })).toBeGreaterThan(base);
    expect(deriveBandDensity({ zoom: 1, viewportSpanPx: BAND_DENSITY_REFERENCE_VIEWPORT_PX * 2, countyScale: 1 })).toBeGreaterThan(base);
    expect(deriveBandDensity({ zoom: 1, viewportSpanPx: BAND_DENSITY_REFERENCE_VIEWPORT_PX, countyScale: 2 })).toBeLessThan(base);
    expect(deriveBandDensity({ zoom: 1, viewportSpanPx: BAND_DENSITY_REFERENCE_VIEWPORT_PX, countyScale: 1, deviceScale: 2 })).toBeGreaterThan(base);
  });

  it("stays finite for degenerate inputs (zero/negative are floored, never NaN/Infinity)", () => {
    for (const inputs of [
      { zoom: -5, viewportSpanPx: 900, countyScale: 1 },
      { zoom: 1, viewportSpanPx: 0, countyScale: 1 },
      { zoom: 1, viewportSpanPx: 900, countyScale: 0 },
    ]) {
      const d = deriveBandDensity(inputs);
      expect(Number.isFinite(d)).toBe(true);
    }
  });

  it("routes a huge western county to a lower band than a small one at the same zoom", () => {
    const smallCounty = deriveBandDensity({ zoom: 1.5, viewportSpanPx: 900, countyScale: 1 });
    const hugeCounty = deriveBandDensity({ zoom: 1.5, viewportSpanPx: 900, countyScale: 3 });
    expect(selectBand(smallCounty)).toBe("near");
    expect(selectBand(hugeCounty)).toBe("far");
  });
});

describe("band controller — gesture settle & transitions", () => {
  it("defers a mid-gesture band crossing: desired moves, committed does not, nothing is requested until settle", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });

    // Mid-gesture crossing to NEAR.
    state = reduceBandController(state, { type: "gesture-activity", source: "wheel", density: 1.5, time: 0 });
    expect(state.desiredBand).toBe("near");
    expect(state.committedBand).toBe("far");
    expect(state.pendingIntent).toBeNull(); // deferred — no request mid-gesture
    expect(state.gesture.phase).toBe("active");

    // A further mid-gesture wobble still does not request.
    state = reduceBandController(state, { type: "gesture-activity", source: "wheel", density: 1.6, time: 40 });
    expect(state.pendingIntent).toBeNull();

    // A tick before the idle timeout does not settle.
    state = reduceBandController(state, { type: "tick", time: 40 + WHEEL_IDLE_SETTLE_MS - 1 });
    expect(state.gesture.phase).toBe("active");
    expect(state.pendingIntent).toBeNull();

    // Idle timeout reached -> settle -> request.
    state = reduceBandController(state, { type: "tick", time: 40 + WHEEL_IDLE_SETTLE_MS });
    expect(state.gesture.phase).toBe("settled");
    expect(state.pendingIntent?.targetBand).toBe("near");
    expect(state.committedBand).toBe("far"); // not committed until the commit event

    // The single transactional commit moves the committed band.
    const intentId = state.pendingIntent!.id;
    state = reduceBandController(state, { type: "commit", intentId, epoch: EPOCH_A, time: 400 });
    expect(state.committedBand).toBe("near");
    expect(state.pendingIntent).toBeNull();
  });

  it("does not settle a non-wheel gesture on a tick (pinch settles via inertia-end)", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = reduceBandController(state, { type: "gesture-activity", source: "pinch", density: 1.5, time: 0 });
    state = reduceBandController(state, { type: "tick", time: 10_000 });
    expect(state.gesture.phase).toBe("active"); // ticks never settle a pinch
    expect(state.pendingIntent).toBeNull();
    state = reduceBandController(state, { type: "settle", cause: "inertia-end", time: 10_100 });
    expect(state.gesture.phase).toBe("settled");
    expect(state.pendingIntent?.targetBand).toBe("near");
  });

  it("sequences settle-then-request correctly for every settle cause", () => {
    // Completion causes REQUEST; abort causes CANCEL and request nothing.
    const completionByExplicit: BandExplicitSettleCause[] = ["inertia-end"];
    for (const cause of completionByExplicit) {
      let state = createBandControllerState();
      state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
      state = reduceBandController(state, { type: "gesture-activity", source: "pinch", density: 1.5, time: 0 });
      state = reduceBandController(state, { type: "settle", cause, time: 10 });
      expect(state.gesture.phase).toBe("settled");
      expect(state.pendingIntent, `completion cause ${cause} should request`).not.toBeNull();
      expect(state.pendingIntent?.targetBand).toBe("near");
    }

    // wheel-idle (internal completion) requests too.
    {
      let state = createBandControllerState();
      state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
      state = wheelSettle(state, 1.5, 0);
      expect(state.pendingIntent?.targetBand).toBe("near");
    }

    const abortCauses: BandExplicitSettleCause[] = ["cancel", "lost-capture", "blur"];
    for (const cause of abortCauses) {
      let state = createBandControllerState();
      state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
      state = reduceBandController(state, { type: "gesture-activity", source: "pinch", density: 1.5, time: 0 });
      state = reduceBandController(state, { type: "settle", cause, time: 10 });
      expect(state.gesture.phase).toBe("settled");
      expect(state.pendingIntent, `abort cause ${cause} must not request`).toBeNull();
      expect(state.committedBand).toBe("far");
      expect(state.unmounted).toBe(false);
    }

    // unmount is terminal: no request, and the controller is inert afterward.
    {
      let state = createBandControllerState();
      state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
      state = reduceBandController(state, { type: "gesture-activity", source: "pinch", density: 1.5, time: 0 });
      state = reduceBandController(state, { type: "settle", cause: "unmount", time: 10 });
      expect(state.unmounted).toBe(true);
      expect(state.pendingIntent).toBeNull();
      const after = reduceBandController(state, { type: "gesture-activity", source: "wheel", density: 2.0, time: 20 });
      expect(after).toBe(state); // inert: identical reference returned
    }
  });

  it("keeps the committed band stable across parked oscillation at the controller level (no intent churn)", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    let time = 0;
    for (const d of [0.66, 0.74, 0.68, 0.72, 0.63, 0.77, 0.69]) {
      state = wheelSettle(state, d, time);
      time += 1000;
      expect(state.committedBand).toBe("far");
      expect(state.desiredBand).toBe("far");
      expect(state.pendingIntent).toBeNull(); // desired never leaves committed -> never requested
      expect(state.intentCounter).toBe(0);
    }
  });
});

describe("band controller — latest-wins & stale completions", () => {
  it("supersedes a pending intent and ignores the stale completion (latest-wins by intent id)", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });

    // Settle to NEAR -> intent #1.
    state = wheelSettle(state, 1.5, 0);
    const intent1 = state.pendingIntent!.id;
    expect(state.pendingIntent?.targetBand).toBe("near");

    // Zoom back toward MID and settle again -> supersede with intent #2 (target MID).
    state = wheelSettle(state, 1.0, 1000);
    const intent2 = state.pendingIntent!.id;
    expect(intent2).toBeGreaterThan(intent1);
    expect(state.pendingIntent?.targetBand).toBe("mid");

    // The stale completion for intent #1 must be ignored.
    state = reduceBandController(state, { type: "commit", intentId: intent1, epoch: EPOCH_A, time: 1200 });
    expect(state.committedBand).toBe("far");
    expect(state.pendingIntent?.id).toBe(intent2);

    // The current completion commits.
    state = reduceBandController(state, { type: "commit", intentId: intent2, epoch: EPOCH_A, time: 1300 });
    expect(state.committedBand).toBe("mid");
    expect(state.pendingIntent).toBeNull();
  });

  it("cancels a pending intent when the settled band returns to the committed band", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = wheelSettle(state, 1.5, 0);
    expect(state.pendingIntent?.targetBand).toBe("near");
    // Zoom all the way back out and settle -> desired == committed (FAR) -> intent cancelled.
    state = wheelSettle(state, 0.3, 1000);
    expect(state.desiredBand).toBe("far");
    expect(state.committedBand).toBe("far");
    expect(state.pendingIntent).toBeNull();
  });

  it("converges a deferred mid-gesture crossing after the in-flight commit lands", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    // Settle to MID -> intent #1.
    state = wheelSettle(state, 1.0, 0);
    const intent1 = state.pendingIntent!.id;
    expect(state.pendingIntent?.targetBand).toBe("mid");

    // While intent #1 is in flight, a NEW gesture crosses to NEAR and settles.
    // committed is still FAR, so desired = selectBand(1.5, far) = NEAR; the
    // pending target (MID) differs -> supersede with intent #2 (NEAR).
    state = wheelSettle(state, 1.5, 1000);
    const intent2 = state.pendingIntent!.id;
    expect(intent2).toBeGreaterThan(intent1);
    expect(state.pendingIntent?.targetBand).toBe("near");

    // Commit intent #2 -> NEAR, and nothing residual to converge.
    state = reduceBandController(state, { type: "commit", intentId: intent2, epoch: EPOCH_A, time: 1200 });
    expect(state.committedBand).toBe("near");
    expect(state.pendingIntent).toBeNull();
  });
});

describe("band controller — failure backoff & degrade latch", () => {
  it("does not immediately re-request after a failed commit, then retries once backoff expires", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = wheelSettle(state, 1.5, 0);
    const intent1 = state.pendingIntent!.id;

    // Required window failed to validate.
    state = reduceBandController(state, {
      type: "commit-failed",
      intentId: intent1,
      epoch: EPOCH_A,
      reason: "storage-unavailable",
      time: 200,
    });
    expect(state.pendingIntent).toBeNull();
    expect(state.backoff?.failureCount).toBe(1);
    expect(state.backoff?.nextEligibleTime).toBe(200 + bandBackoffDelayMs(1));

    // Settle again while still inside the backoff window -> NO re-request.
    state = wheelSettle(state, 1.5, 250); // settles at 250 + WHEEL_IDLE_SETTLE_MS = 390 < 600
    expect(state.pendingIntent).toBeNull();

    // Settle again after the backoff window expires -> a fresh request.
    const afterBackoff = 200 + bandBackoffDelayMs(1) + 10;
    state = wheelSettle(state, 1.5, afterBackoff);
    expect(state.pendingIntent, "should re-request once backoff has expired").not.toBeNull();
    expect(state.pendingIntent!.id).toBeGreaterThan(intent1);
  });

  it("grows the backoff delay exponentially across consecutive failures", () => {
    expect(bandBackoffDelayMs(1)).toBe(BAND_BACKOFF_BASE_MS);
    expect(bandBackoffDelayMs(2)).toBe(BAND_BACKOFF_BASE_MS * 2);
    expect(bandBackoffDelayMs(3)).toBe(BAND_BACKOFF_BASE_MS * 4);
    // Capped.
    expect(bandBackoffDelayMs(50)).toBeLessThanOrEqual(8000);
  });

  it("enters degrade on failure (visible, with reason) and exits on a later successful commit", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = wheelSettle(state, 1.5, 0);
    const intent1 = state.pendingIntent!.id;

    // Enter degrade.
    state = reduceBandController(state, {
      type: "commit-failed",
      intentId: intent1,
      epoch: EPOCH_A,
      reason: "missing-expected-chunk",
      time: 200,
    });
    expect(state.degrade.active).toBe(true);
    expect(state.degrade.reason).toBe("missing-expected-chunk");
    expect(state.degrade.since).toBe(200);

    // Retry after backoff -> succeed -> degrade exits (deterministically, not silent).
    const afterBackoff = 200 + bandBackoffDelayMs(1) + 10;
    state = wheelSettle(state, 1.5, afterBackoff);
    const intent2 = state.pendingIntent!.id;
    state = reduceBandController(state, { type: "commit", intentId: intent2, epoch: EPOCH_A, time: afterBackoff + 100 });
    expect(state.committedBand).toBe("near");
    expect(state.degrade.active).toBe(false);
    expect(state.degrade.reason).toBeNull();
    expect(state.backoff).toBeNull();
  });

  it("exits degrade when the user zooms back to the committed band (missing-detail condition gone)", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = wheelSettle(state, 1.5, 0);
    state = reduceBandController(state, {
      type: "commit-failed",
      intentId: state.pendingIntent!.id,
      epoch: EPOCH_A,
      reason: "storage-unavailable",
      time: 200,
    });
    expect(state.degrade.active).toBe(true);

    // Zoom back out to FAR (== committed) and settle -> degrade clears.
    state = wheelSettle(state, 0.3, 1000);
    expect(state.desiredBand).toBe("far");
    expect(state.degrade.active).toBe(false);
    expect(state.pendingIntent).toBeNull();
  });
});

describe("band controller — epoch pinning", () => {
  it("pins the epoch once and ignores re-pins while a pin stands", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_B });
    expect(state.pinnedEpoch).toEqual(EPOCH_A);
  });

  it("ignores a completion from the wrong epoch and accepts one from the pinned epoch", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = wheelSettle(state, 1.5, 0);
    const intentId = state.pendingIntent!.id;

    // Wrong epoch -> ignored.
    state = reduceBandController(state, { type: "commit", intentId, epoch: EPOCH_B, time: 400 });
    expect(state.committedBand).toBe("far");
    expect(state.pendingIntent?.id).toBe(intentId);

    // Correct epoch -> accepted.
    state = reduceBandController(state, { type: "commit", intentId, epoch: EPOCH_A, time: 500 });
    expect(state.committedBand).toBe("near");
  });

  it("drops the pin and any in-flight intent on a retired-version (410) event, then re-pins", () => {
    let state = createBandControllerState();
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_A });
    state = wheelSettle(state, 1.5, 0);
    const staleIntentId = state.pendingIntent!.id;

    state = reduceBandController(state, { type: "retire-epoch", time: 300 });
    expect(state.pinnedEpoch).toBeNull();
    expect(state.pendingIntent).toBeNull();
    expect(state.backoff).toBeNull();

    // A completion for the pre-retire intent is now stale.
    state = reduceBandController(state, { type: "commit", intentId: staleIntentId, epoch: EPOCH_A, time: 350 });
    expect(state.committedBand).toBe("far");

    // Re-pin to the new epoch.
    state = reduceBandController(state, { type: "pin-epoch", epoch: EPOCH_B });
    expect(state.pinnedEpoch).toEqual(EPOCH_B);
  });
});

describe("band controller — determinism & purity", () => {
  const script: BandControllerEvent[] = [
    { type: "pin-epoch", epoch: EPOCH_A },
    { type: "gesture-activity", source: "wheel", density: 0.5, time: 0 },
    { type: "tick", time: 50 },
    { type: "gesture-activity", source: "wheel", density: 1.5, time: 100 },
    { type: "tick", time: 100 + WHEEL_IDLE_SETTLE_MS },
    { type: "commit-failed", intentId: 1, epoch: EPOCH_A, reason: "corrupt-chunk", time: 300 },
    { type: "gesture-activity", source: "pinch", density: 1.5, time: 400 },
    { type: "settle", cause: "inertia-end", time: 450 },
    { type: "gesture-activity", source: "wheel", density: 1.5, time: 1000 },
    { type: "tick", time: 1000 + WHEEL_IDLE_SETTLE_MS },
    { type: "commit", intentId: 2, epoch: EPOCH_A, time: 1300 },
    { type: "gesture-activity", source: "wheel", density: 0.4, time: 2000 },
    { type: "tick", time: 2000 + WHEEL_IDLE_SETTLE_MS },
    { type: "commit", intentId: 3, epoch: EPOCH_A, time: 2400 },
  ];

  it("produces an identical state trace for the same input sequence", () => {
    const runA = runBandController(createBandControllerState(), script);
    const runB = runBandController(createBandControllerState(), script);
    expect(runB.trace).toEqual(runA.trace);
    expect(runB.state).toEqual(runA.state);
  });

  it("never mutates the input state (reducer is pure)", () => {
    const initial = createBandControllerState();
    const snapshot = structuredClone(initial);
    reduceBandController(initial, { type: "gesture-activity", source: "wheel", density: 1.5, time: 0 });
    reduceBandController(initial, { type: "pin-epoch", epoch: EPOCH_A });
    expect(initial).toEqual(snapshot);
  });

  it("keeps each trace entry an independent snapshot (no shared mutable references)", () => {
    const { trace } = runBandController(createBandControllerState(), script);
    // The commit at the end must not have retroactively changed an earlier snapshot.
    const afterFirstActivity = trace[1]!;
    expect(afterFirstActivity.committedBand).toBe("far");
    expect(afterFirstActivity.pendingIntent).toBeNull();
  });
});
