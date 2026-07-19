/**
 * R3 band-transition trace harness — pure-logic instrumentation + oracle
 * (0.78-R / Lane D, `.gstack/plan-078R-execution.md`).
 *
 * R3 (off-stage build -> atomic swap -> release the outgoing layer) is the
 * historically-fatal codepath: two prior density attempts died on Graphics-ceiling
 * spikes mid-transition. Per PoR decision #43 the INSTRUMENTED TRACE is the
 * DELIVERABLE, not a debug aid — this module is the oracle that proves a swap is
 * spike-free, and the renderer feeds it real residency samples in A2.
 *
 * This file is a sibling of `cityWorldBandController.ts` and obeys the same house
 * rules (the "band-controller mould"):
 *   - PURE / DETERMINISTIC. NO renderer wiring, NO Pixi, NO network, NO `Date.now`.
 *     Every timestamp is an INPUT (`time` on every event). Same events -> a
 *     byte-identical trace and byte-identical serialization (both are tests).
 *   - The recorder is a pure reducer: `recordTransitionEvent(trace, event)` never
 *     mutates its input; it returns a fresh trace (or the same reference when the
 *     event is inert, mirroring the controller's stale-event handling).
 *
 * WHAT IT MODELS — the lifecycle of ONE band transition as an ordered phase log:
 *
 *   intent-start                         latency clock starts (t0)
 *     -> fetch-start / fetch-end         chunk I/O (per chunk or batched: repeatable)
 *     -> decode-end                      codec decode complete
 *     -> build-start / build-end         OFF-STAGE construction of the incoming layer
 *     -> swap                            the single atomic commit (decision #58) = committedAtMs
 *     -> next-frame                      first frame PRESENTED after the swap
 *     -> release-end                     the OUTGOING layer is freed
 *
 * Every event carries a caller-supplied metrics snapshot (graphicsCount, the
 * transientGraphicsPeak = old+new resident during build/swap per decision #59, and
 * an optional heapEstimate). The analysis (`analyzeTransitionTrace`) computes phase
 * durations, the headline intent->swap latency, and a machine-readable verdict
 * against INJECTABLE ceilings, flagging the two historical failure signatures:
 *   (a) transient residency exceeding the graphics ceiling during build/swap
 *       (the double-residency spike — `transient-residency-exceeded`), and
 *   (b) work between swap and next-frame over budget (`post-swap-stall`) — the
 *       old renderer's destroy-after-build stall.
 *
 * Aborted transitions (decision #59 cancellation cleanup) and superseded
 * transitions (latest-wins, decision #57) are first-class: an abort marks the
 * trace `aborted` and its cleanup duration is recorded; starting a new transition
 * while one is open marks the old one `superseded` and archives it — never lost.
 *
 * Relevant decisions (by reference, PoR `.gstack/plan-zoom-band-lod.md`):
 *   #43 R3 unproven-until-traced — the trace is the proof.
 *   #57 latest-wins selection intent (`intentId` mirrors `BandTransitionIntent.id`).
 *   #58 transactional window commit — ONE atomic swap.
 *   #59 transient-residency gate — the 1600 ceiling INCLUDES the transient peak;
 *       CPU-geometry staging preferred; cancellation cleanup defined.
 *   #60 segment-count benchmarks — heapEstimate/graphicsCount are caller-fed
 *       residency samples; this module is agnostic to what a "unit" is.
 * Doubles as prod telemetry (PoR S8): band-transition timing emitted by the trace.
 */

import type { ManifestEpoch, ZoomBand } from "./cityWorldBandController.js";

// ---------------------------------------------------------------------------
// 1. Metrics snapshot — caller-fed residency at each phase
// ---------------------------------------------------------------------------

/**
 * A residency sample the renderer feeds at each phase. `graphicsCount` is the
 * live Graphics/DisplayObject count; `transientGraphicsPeak` is the peak old+new
 * resident count observed for this sample (decision #59) — during build/swap both
 * the outgoing and incoming layers can be resident, so it is `>= graphicsCount`.
 * `heapEstimate` (bytes) is optional telemetry, never gated by default.
 */
export type TransitionMetricsInput = {
  graphicsCount: number;
  /** Peak old+new resident for this sample (decision #59). Defaults to graphicsCount. */
  transientGraphicsPeak?: number;
  /** Optional heap estimate (bytes) — telemetry only. */
  heapEstimate?: number;
};

/** Normalized, total-for-hostile-input snapshot stored in the trace. */
export type TransitionMetricsSnapshot = {
  graphicsCount: number;
  transientGraphicsPeak: number;
  heapEstimate: number | null;
};

/** Floor a residency count to a finite, non-negative integer (never NaN/Infinity). */
function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** Floor an optional heap estimate to a finite, non-negative number, or null. */
function safeHeap(value: number | undefined): number | null {
  if (value === undefined) return null;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Floor a timestamp input to a finite number (deterministic; never NaN/Infinity). */
function safeTime(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Normalize a caller snapshot. `transientGraphicsPeak` is clamped to at least
 * `graphicsCount` (an overlap peak can never be below the live count) and defaults
 * to `graphicsCount` when omitted (no overlap outside the build/swap window).
 */
function normalizeMetrics(input: TransitionMetricsInput): TransitionMetricsSnapshot {
  const graphicsCount = safeCount(input.graphicsCount);
  const transientGraphicsPeak =
    input.transientGraphicsPeak === undefined
      ? graphicsCount
      : Math.max(graphicsCount, safeCount(input.transientGraphicsPeak));
  return { graphicsCount, transientGraphicsPeak, heapEstimate: safeHeap(input.heapEstimate) };
}

function zeroMetrics(): TransitionMetricsSnapshot {
  return { graphicsCount: 0, transientGraphicsPeak: 0, heapEstimate: null };
}

// ---------------------------------------------------------------------------
// 2. Phase model & events
// ---------------------------------------------------------------------------

/**
 * The explicit phase model for one transition. `fetch-start`/`fetch-end` may
 * repeat (per chunk or batched); the rest are single landmarks. `next-frame` is
 * the first frame PRESENTED after the swap — the instrumentation needed to measure
 * the post-swap stall (signature b); it is optional but required to judge that
 * signature.
 */
export type TransitionPhaseKind =
  | "intent-start"
  | "fetch-start"
  | "fetch-end"
  | "decode-end"
  | "build-start"
  | "build-end"
  | "swap"
  | "next-frame"
  | "release-end";

/** Sample phases include the synthetic `abort` marker (residency at cancellation). */
export type TransitionSamplePhase = TransitionPhaseKind | "abort";

/**
 * Why an in-flight transition was cancelled (decision #59 cancellation cleanup).
 * `superseded` is NOT here — supersession is a distinct terminal state applied by
 * the session (latest-wins), not a mid-trace abort.
 */
export type TransitionAbortReason =
  | "gesture-cancel"
  | "epoch-retired"
  | "unmount"
  | "commit-failed"
  | "navigate-away"
  | "unknown";

/** Terminal disposition of a trace. */
export type TransitionTraceStatus = "open" | "committed" | "aborted" | "superseded";

/** A phase event fed by the renderer; metrics are required (caller-supplied). */
export type TransitionPhaseEvent = {
  kind: TransitionPhaseKind;
  time: number;
  /** Optional label, e.g. a chunk id on a fetch phase. */
  label?: string;
  metrics: TransitionMetricsInput;
};

/** An abort event — cancels the transition mid-flight. Metrics carry forward if omitted. */
export type TransitionAbortEvent = {
  kind: "abort";
  time: number;
  reason: TransitionAbortReason;
  metrics?: TransitionMetricsInput;
};

export type TransitionTraceEvent = TransitionPhaseEvent | TransitionAbortEvent;

/** A recorded phase sample: the phase, its input timestamp, an optional label, and metrics. */
export type TransitionPhaseSample = {
  phase: TransitionSamplePhase;
  time: number;
  label: string | null;
  metrics: TransitionMetricsSnapshot;
};

/** Metadata identifying which transition a trace records (mirrors the controller intent). */
export type TransitionTraceMeta = {
  /** Latest-wins intent id — the same id the band controller assigns (decision #57). */
  intentId: number;
  fromBand: ZoomBand;
  targetBand: ZoomBand;
  /** Pinned manifest epoch for this transition (R2 §2.3), or null if not yet pinned. */
  epoch?: ManifestEpoch | null;
};

/** One transition's full trace — the committed acceptance-evidence unit. */
export type TransitionTrace = {
  intentId: number;
  fromBand: ZoomBand;
  targetBand: ZoomBand;
  epoch: ManifestEpoch | null;
  status: TransitionTraceStatus;
  samples: TransitionPhaseSample[];
  /** Present once aborted (decision #59). Cleanup duration is derived from a later release-end. */
  abort: { reason: TransitionAbortReason; time: number } | null;
};

// ---------------------------------------------------------------------------
// 3. Ceilings (injectable) & named defaults
// ---------------------------------------------------------------------------

/**
 * Total intent->swap rebuild ceiling. PoR: "target <=350 ms rebuild" (Lane A2 /
 * P7). Calibration-pending on the adversarial-6.
 */
export const TRANSITION_TOTAL_LATENCY_CEILING_MS = 350;

/**
 * Graphics ceiling — 1600 per scene, INCLUDING the transient old+new peak during
 * the swap (decision #59). The historically-fatal number.
 */
export const TRANSITION_GRAPHICS_CEILING = 1600;

/**
 * Post-swap stall budget: work between swap and the next presented frame. One
 * 60fps frame (~16.7 ms) is the "no dropped frame" bar; 16 is the integer default.
 * Calibration-pending on the adversarial-6.
 */
export const TRANSITION_POST_SWAP_STALL_BUDGET_MS = 16;

/** Injectable ceilings for the verdict. `abortCleanupMs` is optional (recorded, not gated, by default). */
export type TransitionCeilings = {
  /** Total intent->swap latency ceiling (ms). */
  totalLatencyMs: number;
  /** Graphics ceiling (count) — applies to BOTH steady graphicsCount and the transient peak. */
  graphicsPeak: number;
  /** Post-swap stall budget (ms) — swap -> next-frame. */
  postSwapStallMs: number;
  /** Optional abort cleanup ceiling (ms). Omitted => cleanup recorded but not gated (decision #59). */
  abortCleanupMs?: number;
};

/** The canonical default ceilings (all injectable per call). */
export const DEFAULT_TRANSITION_CEILINGS: TransitionCeilings = {
  totalLatencyMs: TRANSITION_TOTAL_LATENCY_CEILING_MS,
  graphicsPeak: TRANSITION_GRAPHICS_CEILING,
  postSwapStallMs: TRANSITION_POST_SWAP_STALL_BUDGET_MS,
  // abortCleanupMs intentionally omitted (exactOptionalPropertyTypes-safe).
};

// ---------------------------------------------------------------------------
// 4. Construction & the pure recorder
// ---------------------------------------------------------------------------

function cloneEpoch(epoch: ManifestEpoch): ManifestEpoch {
  return { schemaVersion: epoch.schemaVersion, packHash: epoch.packHash };
}

function cloneSample(sample: TransitionPhaseSample): TransitionPhaseSample {
  return {
    phase: sample.phase,
    time: sample.time,
    label: sample.label,
    metrics: { ...sample.metrics },
  };
}

/** Deep clone so the reducer never mutates its input (determinism / snapshot safety). */
function cloneTrace(trace: TransitionTrace): TransitionTrace {
  return {
    intentId: trace.intentId,
    fromBand: trace.fromBand,
    targetBand: trace.targetBand,
    epoch: trace.epoch ? cloneEpoch(trace.epoch) : null,
    status: trace.status,
    samples: trace.samples.map(cloneSample),
    abort: trace.abort ? { reason: trace.abort.reason, time: trace.abort.time } : null,
  };
}

/** Open a fresh trace for one transition. Records NO sample yet — feed `intent-start` first. */
export function beginTransitionTrace(meta: TransitionTraceMeta): TransitionTrace {
  return {
    intentId: meta.intentId,
    fromBand: meta.fromBand,
    targetBand: meta.targetBand,
    epoch: meta.epoch ? cloneEpoch(meta.epoch) : null,
    status: "open",
    samples: [],
    abort: null,
  };
}

/** Phases a trace still accepts once it has left the `open` state (cleanup / present only). */
const POST_TERMINAL_PHASES: ReadonlySet<TransitionSamplePhase> = new Set<TransitionSamplePhase>([
  "next-frame",
  "release-end",
]);

function lastMetrics(trace: TransitionTrace): TransitionMetricsSnapshot {
  const last = trace.samples[trace.samples.length - 1];
  return last ? { ...last.metrics } : zeroMetrics();
}

/**
 * The pure recorder. Appends the event as a sample and advances status:
 *   - `swap` from `open` -> `committed`.
 *   - `abort` from a non-terminal trace -> `aborted` (records the abort + a residency sample).
 * Inert events (an event on a `superseded` trace, a non-cleanup phase after a
 * terminal state, a second abort) return the SAME reference unchanged — mirroring
 * the band controller's stale-event discipline. Never mutates `trace`.
 */
export function recordTransitionEvent(trace: TransitionTrace, event: TransitionTraceEvent): TransitionTrace {
  // Superseded is fully terminal (archived by the session): inert.
  if (trace.status === "superseded") return trace;

  if (event.kind === "abort") {
    // Only a non-terminal trace can be aborted; a second abort / abort-after-commit is inert.
    if (trace.status !== "open") return trace;
    const next = cloneTrace(trace);
    const time = safeTime(event.time);
    const metrics = event.metrics === undefined ? lastMetrics(next) : normalizeMetrics(event.metrics);
    next.samples.push({ phase: "abort", time, label: null, metrics });
    next.abort = { reason: event.reason, time };
    next.status = "aborted";
    return next;
  }

  // Phase event. After a terminal state only cleanup/present phases are accepted.
  if (trace.status !== "open" && !POST_TERMINAL_PHASES.has(event.kind)) {
    return trace;
  }

  const next = cloneTrace(trace);
  next.samples.push({
    phase: event.kind,
    time: safeTime(event.time),
    label: event.label ?? null,
    metrics: normalizeMetrics(event.metrics),
  });
  if (event.kind === "swap" && next.status === "open") {
    next.status = "committed";
  }
  return next;
}

/** Ergonomic wrapper: record a phase with an explicit metrics snapshot. */
export function recordTransitionPhase(
  trace: TransitionTrace,
  phase: TransitionPhaseKind,
  time: number,
  metrics: TransitionMetricsInput,
  label?: string,
): TransitionTrace {
  const event: TransitionPhaseEvent =
    label === undefined ? { kind: phase, time, metrics } : { kind: phase, time, label, metrics };
  return recordTransitionEvent(trace, event);
}

/** Ergonomic wrapper: abort an in-flight transition (decision #59 cancellation). */
export function abortTransitionTrace(
  trace: TransitionTrace,
  reason: TransitionAbortReason,
  time: number,
  metrics?: TransitionMetricsInput,
): TransitionTrace {
  const event: TransitionAbortEvent =
    metrics === undefined ? { kind: "abort", time, reason } : { kind: "abort", time, reason, metrics };
  return recordTransitionEvent(trace, event);
}

/**
 * Mark an OPEN trace superseded (latest-wins, decision #57): a newer transition
 * started while this one was still open. The trace is preserved, never lost. A
 * non-open trace is returned unchanged (already terminal).
 */
export function supersedeTransitionTrace(trace: TransitionTrace, time: number): TransitionTrace {
  if (trace.status !== "open") return trace;
  const next = cloneTrace(trace);
  next.samples.push({ phase: "abort", time: safeTime(time), label: "superseded", metrics: lastMetrics(next) });
  next.status = "superseded";
  return next;
}

/** Fold a full event sequence over the recorder (determinism harness). Pure. */
export function runTransitionTrace(
  meta: TransitionTraceMeta,
  events: readonly TransitionTraceEvent[],
): TransitionTrace {
  let trace = beginTransitionTrace(meta);
  for (const event of events) {
    trace = recordTransitionEvent(trace, event);
  }
  return trace;
}

// ---------------------------------------------------------------------------
// 5. Session — latest-wins across multiple transitions (supersede, never lose)
// ---------------------------------------------------------------------------

/**
 * A session tracks the currently-open transition plus every terminal trace in
 * order. Starting a new transition archives the current one (superseding it if it
 * was still open), so the full history is preserved for acceptance evidence.
 */
export type TransitionTraceSession = {
  /** Terminal traces (committed / aborted / superseded) in chronological order. */
  history: TransitionTrace[];
  /** The trace currently accepting samples, or null. May be open/committed/aborted. */
  current: TransitionTrace | null;
};

export function createTransitionTraceSession(): TransitionTraceSession {
  return { history: [], current: null };
}

/**
 * Begin a new transition. Archives the current trace: if it is still `open` it is
 * marked `superseded` first (latest-wins). The new trace becomes `current`.
 */
export function beginTransitionInSession(
  session: TransitionTraceSession,
  meta: TransitionTraceMeta,
  time: number,
): TransitionTraceSession {
  const history = session.history.map(cloneTrace);
  if (session.current) {
    const archived = session.current.status === "open" ? supersedeTransitionTrace(session.current, time) : cloneTrace(session.current);
    history.push(archived);
  }
  return { history, current: beginTransitionTrace(meta) };
}

/** Apply a phase event to the session's current trace. No current trace => inert. */
export function recordTransitionPhaseInSession(
  session: TransitionTraceSession,
  event: TransitionTraceEvent,
): TransitionTraceSession {
  if (!session.current) return session;
  const current = recordTransitionEvent(session.current, event);
  if (current === session.current) return session;
  return { history: session.history.map(cloneTrace), current };
}

/** Abort the session's current trace (decision #59). No current trace => inert. */
export function abortTransitionInSession(
  session: TransitionTraceSession,
  reason: TransitionAbortReason,
  time: number,
  metrics?: TransitionMetricsInput,
): TransitionTraceSession {
  if (!session.current) return session;
  const current = abortTransitionTrace(session.current, reason, time, metrics);
  if (current === session.current) return session;
  return { history: session.history.map(cloneTrace), current };
}

/** All traces in the session (history + current), oldest first. */
export function sessionTransitionTraces(session: TransitionTraceSession): TransitionTrace[] {
  return session.current ? [...session.history, session.current] : [...session.history];
}

// ---------------------------------------------------------------------------
// 6. Analysis — phase durations, residency peaks, and the machine-readable verdict
// ---------------------------------------------------------------------------

export type TransitionPhaseTimings = {
  intentStart: number | null;
  /** First fetch-start (fetch may repeat per chunk). */
  fetchStart: number | null;
  /** Last fetch-end. */
  fetchEnd: number | null;
  decodeEnd: number | null;
  buildStart: number | null;
  buildEnd: number | null;
  swap: number | null;
  nextFrame: number | null;
  releaseEnd: number | null;
  abort: number | null;
};

export type TransitionDurations = {
  /** fetchEnd - fetchStart (the full fetch span across chunks). */
  fetchMs: number | null;
  /** decodeEnd - fetchEnd. */
  decodeMs: number | null;
  /** buildEnd - buildStart (off-stage construction). */
  buildMs: number | null;
  /** swap - buildEnd (the commit gap). */
  buildToSwapMs: number | null;
  /** swap - intentStart — THE headline latency, gated by totalLatencyMs. */
  totalIntentToSwapMs: number | null;
  /** nextFrame - swap — post-swap stall (signature b), gated by postSwapStallMs. */
  postSwapStallMs: number | null;
  /** releaseEnd - swap — how long after the swap the outgoing layer was freed. */
  releaseMs: number | null;
  /** releaseEnd - buildStart — the window during which old+new coexist (transient overlap). */
  transientOverlapMs: number | null;
  /** releaseEnd - abort — cancellation cleanup duration (decision #59). */
  cleanupMs: number | null;
};

export type TransitionResidency = {
  peakGraphicsCount: number;
  peakTransientGraphics: number;
  /** max(peakGraphicsCount, peakTransientGraphics) — the number gated by the graphics ceiling. */
  peakResidency: number;
  peakHeapEstimate: number | null;
  /** Phase at which the transient peak occurred (first occurrence of the max). */
  peakTransientPhase: TransitionSamplePhase | null;
};

export type TransitionTraceMetrics = {
  status: TransitionTraceStatus;
  intentId: number;
  fromBand: ZoomBand;
  targetBand: ZoomBand;
  timings: TransitionPhaseTimings;
  durations: TransitionDurations;
  residency: TransitionResidency;
  /** Alias of timings.swap — the atomic-commit time (PoR trace field `committedAtMs`). */
  committedAtMs: number | null;
  /**
   * True when the outgoing layer was freed on the swap frame (releaseEnd <= nextFrame):
   * the destroy-after-build structure. null when it cannot be determined (no next-frame).
   */
  releaseOnSwapFrame: boolean | null;
  sampleCount: number;
};

function sub(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : a - b;
}

/** Extract the phase timings + residency peaks in a single ordered pass over the samples. */
function scanTrace(trace: TransitionTrace): { timings: TransitionPhaseTimings; residency: TransitionResidency } {
  const first: Partial<Record<TransitionSamplePhase, number>> = {};
  const last: Partial<Record<TransitionSamplePhase, number>> = {};

  let peakGraphicsCount = 0;
  let peakTransientGraphics = 0;
  let peakHeapEstimate: number | null = null;
  let peakTransientPhase: TransitionSamplePhase | null = null;

  for (const sample of trace.samples) {
    if (first[sample.phase] === undefined) first[sample.phase] = sample.time;
    last[sample.phase] = sample.time;

    if (sample.metrics.graphicsCount > peakGraphicsCount) {
      peakGraphicsCount = sample.metrics.graphicsCount;
    }
    if (sample.metrics.transientGraphicsPeak > peakTransientGraphics) {
      peakTransientGraphics = sample.metrics.transientGraphicsPeak;
      peakTransientPhase = sample.phase;
    }
    if (sample.metrics.heapEstimate !== null) {
      peakHeapEstimate = peakHeapEstimate === null ? sample.metrics.heapEstimate : Math.max(peakHeapEstimate, sample.metrics.heapEstimate);
    }
  }

  const firstOf = (phase: TransitionSamplePhase): number | null => first[phase] ?? null;
  const lastOf = (phase: TransitionSamplePhase): number | null => last[phase] ?? null;

  const timings: TransitionPhaseTimings = {
    intentStart: firstOf("intent-start"),
    fetchStart: firstOf("fetch-start"),
    fetchEnd: lastOf("fetch-end"),
    decodeEnd: lastOf("decode-end"),
    buildStart: firstOf("build-start"),
    buildEnd: lastOf("build-end"),
    swap: firstOf("swap"),
    nextFrame: firstOf("next-frame"),
    releaseEnd: lastOf("release-end"),
    abort: firstOf("abort"),
  };

  const residency: TransitionResidency = {
    peakGraphicsCount,
    peakTransientGraphics,
    peakResidency: Math.max(peakGraphicsCount, peakTransientGraphics),
    peakHeapEstimate,
    peakTransientPhase,
  };

  return { timings, residency };
}

/** Compute phase durations + residency for a trace (pure; the telemetry surface). */
export function computeTransitionMetrics(trace: TransitionTrace): TransitionTraceMetrics {
  const { timings, residency } = scanTrace(trace);
  const durations: TransitionDurations = {
    fetchMs: sub(timings.fetchEnd, timings.fetchStart),
    decodeMs: sub(timings.decodeEnd, timings.fetchEnd),
    buildMs: sub(timings.buildEnd, timings.buildStart),
    buildToSwapMs: sub(timings.swap, timings.buildEnd),
    totalIntentToSwapMs: sub(timings.swap, timings.intentStart),
    postSwapStallMs: sub(timings.nextFrame, timings.swap),
    releaseMs: sub(timings.releaseEnd, timings.swap),
    transientOverlapMs: sub(timings.releaseEnd, timings.buildStart),
    cleanupMs: sub(timings.releaseEnd, timings.abort),
  };
  const releaseOnSwapFrame =
    timings.releaseEnd === null || timings.nextFrame === null ? null : timings.releaseEnd <= timings.nextFrame;

  return {
    status: trace.status,
    intentId: trace.intentId,
    fromBand: trace.fromBand,
    targetBand: trace.targetBand,
    timings,
    durations,
    residency,
    committedAtMs: timings.swap,
    releaseOnSwapFrame,
    sampleCount: trace.samples.length,
  };
}

export type TransitionViolationCode =
  | "total-latency-exceeded"
  | "graphics-ceiling-exceeded"
  | "transient-residency-exceeded"
  | "post-swap-stall"
  | "abort-cleanup-exceeded"
  | "incomplete-trace";

export type TransitionViolation = {
  code: TransitionViolationCode;
  message: string;
  observed: number | null;
  ceiling: number | null;
  phase: TransitionSamplePhase | null;
};

/** The machine-readable verdict: `{ pass, violations }` plus the metrics + resolved ceilings. */
export type TransitionTraceVerdict = {
  pass: boolean;
  violations: TransitionViolation[];
  metrics: TransitionTraceMetrics;
  ceilings: TransitionCeilings;
};

/**
 * Judge a trace against injectable ceilings (partial overrides merge over
 * `DEFAULT_TRANSITION_CEILINGS`). Verdicts are status-aware:
 *
 *   committed  -> total latency, post-swap stall, and BOTH residency signatures.
 *   aborted    -> residency signatures + optional cleanup-duration gate (recorded always).
 *   superseded -> residency signatures only (never committed, so no latency/stall).
 *   open       -> `incomplete-trace` (cannot be finalized as evidence).
 *
 * The two historical failure signatures are always distinct, machine-readable
 * codes: `transient-residency-exceeded` (a — the double-residency spike, fires only
 * when the transient peak clears the ceiling BEYOND the steady graphicsCount, i.e.
 * genuine build/swap overlap) and `post-swap-stall` (b).
 */
export function analyzeTransitionTrace(
  trace: TransitionTrace,
  ceilings?: Partial<TransitionCeilings>,
): TransitionTraceVerdict {
  const resolved: TransitionCeilings = { ...DEFAULT_TRANSITION_CEILINGS, ...ceilings };
  const metrics = computeTransitionMetrics(trace);
  const violations: TransitionViolation[] = [];
  const { residency, durations, status } = metrics;

  // --- Residency (all statuses): steady graphics + the transient double-residency. ---
  if (residency.peakGraphicsCount > resolved.graphicsPeak) {
    violations.push({
      code: "graphics-ceiling-exceeded",
      message: `settled graphics ${residency.peakGraphicsCount} exceeds ceiling ${resolved.graphicsPeak}`,
      observed: residency.peakGraphicsCount,
      ceiling: resolved.graphicsPeak,
      phase: null,
    });
  }
  // Signature (a): fires when the transient old+new peak clears the ceiling AND is
  // above the steady count — i.e. the build/swap overlap is what blew it (decision #59).
  if (
    residency.peakTransientGraphics > resolved.graphicsPeak &&
    residency.peakTransientGraphics > residency.peakGraphicsCount
  ) {
    violations.push({
      code: "transient-residency-exceeded",
      message: `transient old+new residency ${residency.peakTransientGraphics} exceeds ceiling ${resolved.graphicsPeak} during ${residency.peakTransientPhase ?? "build/swap"}`,
      observed: residency.peakTransientGraphics,
      ceiling: resolved.graphicsPeak,
      phase: residency.peakTransientPhase,
    });
  }

  if (status === "committed") {
    if (durations.totalIntentToSwapMs === null) {
      violations.push({
        code: "incomplete-trace",
        message: "committed trace missing intent-start or swap timestamp",
        observed: null,
        ceiling: null,
        phase: null,
      });
    } else if (durations.totalIntentToSwapMs > resolved.totalLatencyMs) {
      violations.push({
        code: "total-latency-exceeded",
        message: `intent->swap latency ${durations.totalIntentToSwapMs}ms exceeds ceiling ${resolved.totalLatencyMs}ms`,
        observed: durations.totalIntentToSwapMs,
        ceiling: resolved.totalLatencyMs,
        phase: null,
      });
    }
    // Signature (b): work between swap and the next presented frame.
    if (durations.postSwapStallMs !== null && durations.postSwapStallMs > resolved.postSwapStallMs) {
      violations.push({
        code: "post-swap-stall",
        message: `post-swap work ${durations.postSwapStallMs}ms (swap->next-frame) exceeds budget ${resolved.postSwapStallMs}ms`,
        observed: durations.postSwapStallMs,
        ceiling: resolved.postSwapStallMs,
        phase: "next-frame",
      });
    }
  } else if (status === "open") {
    violations.push({
      code: "incomplete-trace",
      message: "trace still open (no swap or abort recorded)",
      observed: null,
      ceiling: null,
      phase: null,
    });
  } else if (status === "aborted") {
    // Cleanup duration is always recorded (decision #59); gated only if a ceiling is injected.
    if (resolved.abortCleanupMs !== undefined && durations.cleanupMs !== null && durations.cleanupMs > resolved.abortCleanupMs) {
      violations.push({
        code: "abort-cleanup-exceeded",
        message: `abort cleanup ${durations.cleanupMs}ms exceeds ceiling ${resolved.abortCleanupMs}ms`,
        observed: durations.cleanupMs,
        ceiling: resolved.abortCleanupMs,
        phase: "release-end",
      });
    }
  }
  // superseded: residency-only (already checked above).

  return { pass: violations.length === 0, violations, metrics, ceilings: resolved };
}

// ---------------------------------------------------------------------------
// 7. Serialization — compact, stable JSON for acceptance evidence + telemetry
// ---------------------------------------------------------------------------

export type SerializedTransitionSample = {
  phase: TransitionSamplePhase;
  time: number;
  label: string | null;
  graphicsCount: number;
  transientGraphicsPeak: number;
  heapEstimate: number | null;
};

export type SerializedTransitionTrace = {
  intentId: number;
  fromBand: ZoomBand;
  targetBand: ZoomBand;
  epoch: { schemaVersion: string; packHash: string } | null;
  status: TransitionTraceStatus;
  abort: { reason: TransitionAbortReason; time: number } | null;
  samples: SerializedTransitionSample[];
};

/**
 * Serialize a trace to a plain, JSON-safe object with a FIXED key order, so
 * `JSON.stringify` of two traces built from identical events is byte-identical
 * (a determinism test). This is the committed acceptance-evidence shape.
 */
export function serializeTransitionTrace(trace: TransitionTrace): SerializedTransitionTrace {
  return {
    intentId: trace.intentId,
    fromBand: trace.fromBand,
    targetBand: trace.targetBand,
    epoch: trace.epoch ? { schemaVersion: trace.epoch.schemaVersion, packHash: trace.epoch.packHash } : null,
    status: trace.status,
    abort: trace.abort ? { reason: trace.abort.reason, time: trace.abort.time } : null,
    samples: trace.samples.map((s) => ({
      phase: s.phase,
      time: s.time,
      label: s.label,
      graphicsCount: s.metrics.graphicsCount,
      transientGraphicsPeak: s.metrics.transientGraphicsPeak,
      heapEstimate: s.metrics.heapEstimate,
    })),
  };
}

/** Stable JSON string of a trace (deterministic; same events -> identical string). */
export function serializeTransitionTraceString(trace: TransitionTrace): string {
  return JSON.stringify(serializeTransitionTrace(trace));
}

/** Serialized ceilings with `abortCleanupMs` normalized to null when unset (stable shape). */
export type SerializedTransitionCeilings = {
  totalLatencyMs: number;
  graphicsPeak: number;
  postSwapStallMs: number;
  abortCleanupMs: number | null;
};

export type SerializedTransitionEvidence = {
  trace: SerializedTransitionTrace;
  verdict: {
    pass: boolean;
    violations: TransitionViolation[];
    ceilings: SerializedTransitionCeilings;
  };
  metrics: TransitionTraceMetrics;
};

/**
 * Serialize a trace together with its verdict + computed metrics — the full
 * acceptance-evidence / ops-telemetry artifact (PoR A2 evidence, S8 telemetry).
 * Deterministic and JSON-safe.
 */
export function serializeTransitionEvidence(
  trace: TransitionTrace,
  ceilings?: Partial<TransitionCeilings>,
): SerializedTransitionEvidence {
  const verdict = analyzeTransitionTrace(trace, ceilings);
  return {
    trace: serializeTransitionTrace(trace),
    verdict: {
      pass: verdict.pass,
      violations: verdict.violations,
      ceilings: {
        totalLatencyMs: verdict.ceilings.totalLatencyMs,
        graphicsPeak: verdict.ceilings.graphicsPeak,
        postSwapStallMs: verdict.ceilings.postSwapStallMs,
        abortCleanupMs: verdict.ceilings.abortCleanupMs ?? null,
      },
    },
    metrics: verdict.metrics,
  };
}

/** Stable JSON string of the full evidence artifact. */
export function serializeTransitionEvidenceString(
  trace: TransitionTrace,
  ceilings?: Partial<TransitionCeilings>,
): string {
  return JSON.stringify(serializeTransitionEvidence(trace, ceilings));
}
