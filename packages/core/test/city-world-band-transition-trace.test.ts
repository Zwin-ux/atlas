import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRANSITION_CEILINGS,
  TRANSITION_GRAPHICS_CEILING,
  TRANSITION_POST_SWAP_STALL_BUDGET_MS,
  TRANSITION_TOTAL_LATENCY_CEILING_MS,
  abortTransitionInSession,
  abortTransitionTrace,
  analyzeTransitionTrace,
  beginTransitionInSession,
  beginTransitionTrace,
  computeTransitionMetrics,
  createTransitionTraceSession,
  recordTransitionEvent,
  recordTransitionPhase,
  recordTransitionPhaseInSession,
  runTransitionTrace,
  serializeTransitionEvidence,
  serializeTransitionEvidenceString,
  serializeTransitionTrace,
  serializeTransitionTraceString,
  sessionTransitionTraces,
  supersedeTransitionTrace,
  type ManifestEpoch,
  type TransitionMetricsInput,
  type TransitionTraceEvent,
  type TransitionTraceMeta,
  type TransitionViolationCode,
} from "../src/index.js";

const EPOCH_A: ManifestEpoch = { schemaVersion: "roadchunk/1", packHash: "b3-aaaa" };

const HAPPY_META: TransitionTraceMeta = { intentId: 1, fromBand: "far", targetBand: "near", epoch: EPOCH_A };

/** Terse metrics-snapshot builder (exactOptionalPropertyTypes-safe). */
function m(graphicsCount: number, transient?: number, heap?: number): TransitionMetricsInput {
  const out: TransitionMetricsInput = { graphicsCount };
  if (transient !== undefined) out.transientGraphicsPeak = transient;
  if (heap !== undefined) out.heapEstimate = heap;
  return out;
}

/**
 * The canonical GOOD transition: off-stage build (old 400 stays shown while the new
 * layer is staged), a single swap at t=300 (<=350), a cheap next-frame at t=305
 * (5ms stall), and a DEFERRED release at t=360 (after next-frame — the fix for the
 * destroy-after-build stall). Transient peak 1300 (old 400 + new ~900) stays under 1600.
 */
function happyEvents(): TransitionTraceEvent[] {
  return [
    { kind: "intent-start", time: 0, metrics: m(400, 400, 5_000) },
    { kind: "fetch-start", time: 10, metrics: m(400) },
    { kind: "fetch-end", time: 120, metrics: m(400) },
    { kind: "decode-end", time: 160, metrics: m(400) },
    { kind: "build-start", time: 170, metrics: m(400, 400) },
    { kind: "build-end", time: 280, metrics: m(400, 1_300, 9_000) },
    { kind: "swap", time: 300, metrics: m(900, 1_300) },
    { kind: "next-frame", time: 305, metrics: m(900, 1_300) },
    { kind: "release-end", time: 360, metrics: m(900, 900, 6_000) },
  ];
}

/** Collect the violation codes from a verdict for terse assertions. */
function codes(violations: { code: TransitionViolationCode }[]): TransitionViolationCode[] {
  return violations.map((v) => v.code);
}

describe("band transition trace — happy path verdict", () => {
  it("passes a complete, spike-free transition against the default ceilings", () => {
    const trace = runTransitionTrace(HAPPY_META, happyEvents());
    expect(trace.status).toBe("committed");

    const verdict = analyzeTransitionTrace(trace);
    expect(verdict.pass).toBe(true);
    expect(verdict.violations).toEqual([]);

    // Headline metrics the renderer/telemetry consume.
    expect(verdict.metrics.durations.totalIntentToSwapMs).toBe(300);
    expect(verdict.metrics.durations.postSwapStallMs).toBe(5);
    expect(verdict.metrics.committedAtMs).toBe(300);
    expect(verdict.metrics.residency.peakGraphicsCount).toBe(900);
    expect(verdict.metrics.residency.peakTransientGraphics).toBe(1_300);
    expect(verdict.metrics.residency.peakResidency).toBe(1_300);
    // Deferred release (after next-frame) — the good pattern.
    expect(verdict.metrics.releaseOnSwapFrame).toBe(false);
  });

  it("computes phase durations across per-chunk (repeated) fetch spans", () => {
    // Two fetch spans (per chunk): fetchMs spans first fetch-start -> last fetch-end.
    const events: TransitionTraceEvent[] = [
      { kind: "intent-start", time: 0, metrics: m(400) },
      { kind: "fetch-start", time: 10, label: "cell-0-0", metrics: m(400) },
      { kind: "fetch-end", time: 60, label: "cell-0-0", metrics: m(400) },
      { kind: "fetch-start", time: 60, label: "cell-0-1", metrics: m(400) },
      { kind: "fetch-end", time: 130, label: "cell-0-1", metrics: m(400) },
      { kind: "decode-end", time: 150, metrics: m(400) },
      { kind: "build-start", time: 160, metrics: m(400, 400) },
      { kind: "build-end", time: 270, metrics: m(400, 1_200) },
      { kind: "swap", time: 300, metrics: m(900, 1_200) },
      { kind: "next-frame", time: 306, metrics: m(900) },
      { kind: "release-end", time: 350, metrics: m(900, 900) },
    ];
    const metrics = computeTransitionMetrics(runTransitionTrace(HAPPY_META, events));
    expect(metrics.durations.fetchMs).toBe(120); // 130 - 10
    expect(metrics.durations.decodeMs).toBe(20); // 150 - 130
    expect(metrics.durations.buildMs).toBe(110); // 270 - 160
    expect(metrics.durations.buildToSwapMs).toBe(30); // 300 - 270
    expect(metrics.durations.transientOverlapMs).toBe(190); // 350 - 160
    expect(analyzeTransitionTrace(runTransitionTrace(HAPPY_META, events)).pass).toBe(true);
  });
});

describe("band transition trace — historical failure signatures", () => {
  it("flags the transient double-residency spike (signature a) without a steady-graphics violation", () => {
    // Steady graphics stay well under ceiling; the build/swap overlap peaks at 1800.
    const events = happyEvents().map((e) =>
      e.kind === "build-end" ? { ...e, metrics: m(400, 1_800, 9_000) } : e,
    );
    const verdict = analyzeTransitionTrace(runTransitionTrace(HAPPY_META, events));
    expect(verdict.pass).toBe(false);
    expect(codes(verdict.violations)).toEqual(["transient-residency-exceeded"]);
    const violation = verdict.violations[0]!;
    expect(violation.observed).toBe(1_800);
    expect(violation.ceiling).toBe(TRANSITION_GRAPHICS_CEILING);
    expect(violation.phase).toBe("build-end");
    // The settled scene itself is fine — no steady graphics violation.
    expect(verdict.metrics.residency.peakGraphicsCount).toBe(900);
  });

  it("flags a post-swap stall (signature b) when work between swap and next-frame blows the frame budget", () => {
    // next-frame lands 40ms after swap (dropped frames); everything else is in budget.
    const events = happyEvents().map((e) => {
      if (e.kind === "next-frame") return { ...e, time: 340 };
      return e;
    });
    const verdict = analyzeTransitionTrace(runTransitionTrace(HAPPY_META, events));
    expect(verdict.pass).toBe(false);
    expect(codes(verdict.violations)).toEqual(["post-swap-stall"]);
    expect(verdict.violations[0]!.observed).toBe(40);
    expect(verdict.violations[0]!.ceiling).toBe(TRANSITION_POST_SWAP_STALL_BUDGET_MS);
  });

  it("flags BOTH signatures for the old renderer's destroy-after-build pattern", () => {
    // Destroy-after-build: old+new fully resident during build (transient 1900), then
    // the old tree is destroyed synchronously between swap and the next present, so the
    // next frame is delayed (stall) and release lands ON the swap frame.
    const events: TransitionTraceEvent[] = [
      { kind: "intent-start", time: 0, metrics: m(400, 400) },
      { kind: "fetch-start", time: 10, metrics: m(400) },
      { kind: "fetch-end", time: 120, metrics: m(400) },
      { kind: "decode-end", time: 150, metrics: m(400) },
      { kind: "build-start", time: 160, metrics: m(400, 900) },
      { kind: "build-end", time: 260, metrics: m(1_500, 1_900) }, // both trees resident as Graphics
      { kind: "swap", time: 280, metrics: m(1_500, 1_900) },
      { kind: "release-end", time: 320, metrics: m(900, 1_900) }, // synchronous destroy, on-frame
      { kind: "next-frame", time: 330, metrics: m(900, 900) }, // next present delayed by the destroy
    ];
    const verdict = analyzeTransitionTrace(runTransitionTrace(HAPPY_META, events));
    expect(verdict.pass).toBe(false);
    const found = codes(verdict.violations);
    expect(found).toContain("transient-residency-exceeded");
    expect(found).toContain("post-swap-stall");
    expect(verdict.metrics.releaseOnSwapFrame).toBe(true); // release landed on the swap frame
  });

  it("flags a slow total intent->swap latency over 350ms", () => {
    // Swap pushed out to 400ms; residency + stall stay in budget.
    const events = happyEvents().map((e) => {
      if (e.kind === "swap") return { ...e, time: 400 };
      if (e.kind === "next-frame") return { ...e, time: 405 };
      if (e.kind === "release-end") return { ...e, time: 460 };
      return e;
    });
    const verdict = analyzeTransitionTrace(runTransitionTrace(HAPPY_META, events));
    expect(verdict.pass).toBe(false);
    expect(codes(verdict.violations)).toEqual(["total-latency-exceeded"]);
    expect(verdict.violations[0]!.observed).toBe(400);
    expect(verdict.violations[0]!.ceiling).toBe(TRANSITION_TOTAL_LATENCY_CEILING_MS);
  });

  it("flags a genuinely over-dense settled scene as a steady graphics violation, not a transient one", () => {
    const events = happyEvents().map((e) => {
      if (e.kind === "swap") return { ...e, metrics: m(1_700, 1_700) };
      if (e.kind === "next-frame") return { ...e, metrics: m(1_700, 1_700) };
      if (e.kind === "release-end") return { ...e, metrics: m(1_700, 1_700) };
      return e;
    });
    const verdict = analyzeTransitionTrace(runTransitionTrace(HAPPY_META, events));
    expect(codes(verdict.violations)).toEqual(["graphics-ceiling-exceeded"]);
    expect(verdict.violations[0]!.observed).toBe(1_700);
  });
});

describe("band transition trace — ceiling injection", () => {
  it("passes a fast transition under defaults but fails a tightened total-latency ceiling", () => {
    const trace = runTransitionTrace(HAPPY_META, happyEvents());
    expect(analyzeTransitionTrace(trace).pass).toBe(true);
    const tightened = analyzeTransitionTrace(trace, { totalLatencyMs: 250 });
    expect(tightened.pass).toBe(false);
    expect(codes(tightened.violations)).toEqual(["total-latency-exceeded"]);
    expect(tightened.ceilings.totalLatencyMs).toBe(250);
    // Un-injected ceilings retain their defaults.
    expect(tightened.ceilings.graphicsPeak).toBe(DEFAULT_TRANSITION_CEILINGS.graphicsPeak);
  });

  it("fails the happy transient peak (1300) against a lowered graphics ceiling", () => {
    const trace = runTransitionTrace(HAPPY_META, happyEvents());
    const verdict = analyzeTransitionTrace(trace, { graphicsPeak: 1_000 });
    expect(verdict.pass).toBe(false);
    expect(codes(verdict.violations)).toContain("transient-residency-exceeded");
  });

  it("relaxes a failing trace to a pass when ceilings are widened", () => {
    const events = happyEvents().map((e) => (e.kind === "build-end" ? { ...e, metrics: m(400, 1_800) } : e));
    const trace = runTransitionTrace(HAPPY_META, events);
    expect(analyzeTransitionTrace(trace).pass).toBe(false);
    expect(analyzeTransitionTrace(trace, { graphicsPeak: 2_000 }).pass).toBe(true);
  });
});

describe("band transition trace — abort (decision #59 cancellation cleanup)", () => {
  it("marks the trace aborted and records the cleanup duration, passing when the peak is in budget", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    trace = recordTransitionPhase(trace, "intent-start", 0, m(400, 400));
    trace = recordTransitionPhase(trace, "fetch-start", 10, m(400));
    trace = recordTransitionPhase(trace, "build-start", 60, m(400, 900));
    // Gesture cancelled mid-build; partial incoming layer resident.
    trace = abortTransitionTrace(trace, "gesture-cancel", 200, m(400, 900));
    // Cleanup frees the partial layer.
    trace = recordTransitionPhase(trace, "release-end", 230, m(0, 0));

    expect(trace.status).toBe("aborted");
    expect(trace.abort).toEqual({ reason: "gesture-cancel", time: 200 });

    const verdict = analyzeTransitionTrace(trace);
    expect(verdict.metrics.durations.cleanupMs).toBe(30); // 230 - 200
    expect(verdict.pass).toBe(true); // 900 < ceiling; cleanup not gated by default
  });

  it("flags a residency spike that occurs during an aborted transition (signature a still applies)", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    trace = recordTransitionPhase(trace, "intent-start", 0, m(400));
    trace = recordTransitionPhase(trace, "build-start", 60, m(400, 900));
    trace = abortTransitionTrace(trace, "epoch-retired", 150, m(400, 1_900));
    const verdict = analyzeTransitionTrace(trace);
    expect(verdict.pass).toBe(false);
    expect(codes(verdict.violations)).toContain("transient-residency-exceeded");
  });

  it("gates the cleanup duration only when an abortCleanupMs ceiling is injected", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    trace = recordTransitionPhase(trace, "intent-start", 0, m(400));
    trace = abortTransitionTrace(trace, "unmount", 100, m(400));
    trace = recordTransitionPhase(trace, "release-end", 160, m(0));
    expect(analyzeTransitionTrace(trace).pass).toBe(true); // recorded, not gated
    const gated = analyzeTransitionTrace(trace, { abortCleanupMs: 20 });
    expect(gated.pass).toBe(false);
    expect(codes(gated.violations)).toEqual(["abort-cleanup-exceeded"]);
    expect(gated.violations[0]!.observed).toBe(60);
  });

  it("ignores a second abort and any late non-cleanup phase (inert, same reference)", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    trace = recordTransitionPhase(trace, "intent-start", 0, m(400));
    const aborted = abortTransitionTrace(trace, "gesture-cancel", 100, m(400));
    // A second abort is inert.
    expect(abortTransitionTrace(aborted, "unmount", 120, m(400))).toBe(aborted);
    // A non-cleanup phase after a terminal state is inert.
    expect(recordTransitionPhase(aborted, "build-start", 130, m(400))).toBe(aborted);
    // But a cleanup release-end is accepted.
    const cleaned = recordTransitionPhase(aborted, "release-end", 140, m(0));
    expect(cleaned).not.toBe(aborted);
    expect(cleaned.status).toBe("aborted");
  });
});

describe("band transition trace — supersede (latest-wins, never lost)", () => {
  it("marks an open trace superseded and preserves its samples", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    trace = recordTransitionPhase(trace, "intent-start", 0, m(400));
    trace = recordTransitionPhase(trace, "fetch-start", 10, m(400));
    const superseded = supersedeTransitionTrace(trace, 50);
    expect(superseded.status).toBe("superseded");
    // Prior samples are intact; a superseded marker is appended (never lost).
    expect(superseded.samples.length).toBe(3);
    expect(superseded.samples[0]!.phase).toBe("intent-start");
    expect(superseded.samples[2]!.phase).toBe("abort");
    expect(superseded.samples[2]!.label).toBe("superseded");
    // A superseded trace is terminal: further events are inert.
    expect(recordTransitionPhase(superseded, "swap", 60, m(900))).toBe(superseded);
    // Verdict is residency-only; a clean (in-budget) superseded trace passes.
    expect(analyzeTransitionTrace(superseded).pass).toBe(true);
  });

  it("supersedes the open trace when a new transition starts in a session (history keeps both)", () => {
    let session = createTransitionTraceSession();
    session = beginTransitionInSession(session, HAPPY_META, 0);
    session = recordTransitionPhaseInSession(session, { kind: "intent-start", time: 0, metrics: m(400) });
    session = recordTransitionPhaseInSession(session, { kind: "fetch-start", time: 10, metrics: m(400) });

    // A new transition starts while #1 is still open -> #1 superseded, archived.
    const meta2: TransitionTraceMeta = { intentId: 2, fromBand: "far", targetBand: "mid", epoch: EPOCH_A };
    session = beginTransitionInSession(session, meta2, 30);

    expect(session.history.length).toBe(1);
    expect(session.history[0]!.status).toBe("superseded");
    expect(session.history[0]!.intentId).toBe(1);
    expect(session.current?.intentId).toBe(2);
    expect(session.current?.status).toBe("open");

    // Both traces are enumerable (nothing lost).
    const all = sessionTransitionTraces(session);
    expect(all.map((t) => t.intentId)).toEqual([1, 2]);
  });

  it("archives a committed trace intact (not superseded) when the next transition begins", () => {
    let session = createTransitionTraceSession();
    session = beginTransitionInSession(session, HAPPY_META, 0);
    for (const event of happyEvents()) {
      session = recordTransitionPhaseInSession(session, event);
    }
    expect(session.current?.status).toBe("committed");

    const meta2: TransitionTraceMeta = { intentId: 2, fromBand: "near", targetBand: "far", epoch: EPOCH_A };
    session = beginTransitionInSession(session, meta2, 1_000);
    expect(session.history.length).toBe(1);
    expect(session.history[0]!.status).toBe("committed"); // committed, NOT superseded
    expect(analyzeTransitionTrace(session.history[0]!).pass).toBe(true);
  });

  it("aborts the session's current trace via the session helper", () => {
    let session = createTransitionTraceSession();
    session = beginTransitionInSession(session, HAPPY_META, 0);
    session = recordTransitionPhaseInSession(session, { kind: "intent-start", time: 0, metrics: m(400) });
    session = abortTransitionInSession(session, "navigate-away", 80, m(400));
    expect(session.current?.status).toBe("aborted");
    expect(session.current?.abort?.reason).toBe("navigate-away");
  });
});

describe("band transition trace — determinism & purity", () => {
  it("produces an identical serialized trace + evidence for the same event sequence", () => {
    const events = happyEvents();
    const traceA = runTransitionTrace(HAPPY_META, events);
    const traceB = runTransitionTrace(HAPPY_META, events);

    expect(serializeTransitionTraceString(traceA)).toBe(serializeTransitionTraceString(traceB));
    expect(serializeTransitionEvidenceString(traceA)).toBe(serializeTransitionEvidenceString(traceB));
    expect(serializeTransitionTrace(traceA)).toEqual(serializeTransitionTrace(traceB));
    expect(computeTransitionMetrics(traceA)).toEqual(computeTransitionMetrics(traceB));
  });

  it("never mutates the input trace (recorder is pure)", () => {
    const trace = beginTransitionTrace(HAPPY_META);
    const snapshot = structuredClone(trace);
    recordTransitionEvent(trace, { kind: "intent-start", time: 0, metrics: m(400) });
    recordTransitionEvent(trace, { kind: "swap", time: 300, metrics: m(900) });
    expect(trace).toEqual(snapshot);
  });

  it("keeps the input event's metrics object unmodified (defensive normalization)", () => {
    const input = m(400); // no transientGraphicsPeak
    const trace = recordTransitionPhase(beginTransitionTrace(HAPPY_META), "intent-start", 0, input);
    // The stored sample defaulted the transient peak, but the caller's object is untouched.
    expect(input.transientGraphicsPeak).toBeUndefined();
    expect(trace.samples[0]!.metrics.transientGraphicsPeak).toBe(400);
  });
});

describe("band transition trace — metrics normalization & serialization shape", () => {
  it("defaults and clamps the transient peak, and floors hostile residency inputs", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    // transient omitted -> defaults to graphicsCount.
    trace = recordTransitionPhase(trace, "intent-start", 0, m(500));
    // transient below graphicsCount -> clamped up to graphicsCount.
    trace = recordTransitionPhase(trace, "build-start", 10, m(500, 100));
    // hostile inputs -> floored to a finite non-negative integer.
    trace = recordTransitionPhase(trace, "build-end", 20, { graphicsCount: -5, transientGraphicsPeak: Number.NaN });

    expect(trace.samples[0]!.metrics.transientGraphicsPeak).toBe(500);
    expect(trace.samples[1]!.metrics.transientGraphicsPeak).toBe(500);
    expect(trace.samples[2]!.metrics.graphicsCount).toBe(0);
    expect(trace.samples[2]!.metrics.transientGraphicsPeak).toBe(0);
  });

  it("serializes a stable, JSON-safe shape (null for absent label/heap/epoch)", () => {
    const trace = runTransitionTrace(
      { intentId: 7, fromBand: "far", targetBand: "near" },
      [{ kind: "intent-start", time: 0, metrics: m(400) }],
    );
    const serialized = serializeTransitionTrace(trace);
    expect(serialized.epoch).toBeNull();
    expect(serialized.abort).toBeNull();
    expect(serialized.samples[0]).toEqual({
      phase: "intent-start",
      time: 0,
      label: null,
      graphicsCount: 400,
      transientGraphicsPeak: 400,
      heapEstimate: null,
    });
    // Round-trips through JSON unchanged.
    expect(JSON.parse(serializeTransitionTraceString(trace))).toEqual(serialized);
  });

  it("embeds verdict + resolved ceilings (abortCleanupMs normalized to null) in the evidence artifact", () => {
    const evidence = serializeTransitionEvidence(runTransitionTrace(HAPPY_META, happyEvents()));
    expect(evidence.verdict.pass).toBe(true);
    expect(evidence.verdict.ceilings.abortCleanupMs).toBeNull();
    expect(evidence.verdict.ceilings.totalLatencyMs).toBe(TRANSITION_TOTAL_LATENCY_CEILING_MS);
    expect(evidence.metrics.committedAtMs).toBe(300);
  });

  it("marks an analyzed open trace incomplete (cannot be finalized as evidence)", () => {
    let trace = beginTransitionTrace(HAPPY_META);
    trace = recordTransitionPhase(trace, "intent-start", 0, m(400));
    trace = recordTransitionPhase(trace, "fetch-start", 10, m(400));
    const verdict = analyzeTransitionTrace(trace);
    expect(verdict.pass).toBe(false);
    expect(codes(verdict.violations)).toEqual(["incomplete-trace"]);
  });
});
