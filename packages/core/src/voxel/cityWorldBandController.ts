/**
 * Zoom-band LOD controller — pure-logic state machine (0.78-R / R1).
 *
 * This module is the web-side band CONTROLLER mandated by
 * `.gstack/plan-zoom-band-lod.md` decision #56 ("band controller owns state;
 * windowFor stays pure"): the stateful pieces that cannot live inside the
 * memoized pure `windowFor` filter — hysteresis, desired-vs-committed band,
 * gesture settle, epoch pinning, per-version failure backoff, and the visible
 * degrade latch. `windowFor` still receives only a committed band + immutable
 * epoch; this file owns the transitions that decide them.
 *
 * DESIGN CONSTRAINTS (hard):
 *   - NO renderer wiring, NO Pixi, NO network, NO `Date.now`. Time is always an
 *     input (`time` on every time-bearing event). Given the same event
 *     sequence the state trace is byte-identical (determinism is a test).
 *   - `selectBand` and `deriveBandDensity` are PURE functions. The controller
 *     is a pure reducer: `reduceBandController(state, event) -> nextState` never
 *     mutates its input.
 *
 * Relevant decisions:
 *   #56 band controller owns state; windowFor stays pure
 *   #57 latest-wins selection intent keyed by an intent id + settle definitions
 *       (wheel-idle, inertia end, cancel, lost capture, blur, unmount)
 *   #58 transactional window commit (one atomic commit after the caller has
 *       validated the whole required window); SUPERSEDES visible batching
 *   R1  band from screen-space density with 0.7 / 1.4 calibration points +
 *       hysteresis so threshold-parking cannot thrash
 *   R2 wire contract (docs/0.78R_WIRE_CONTRACT.md): epoch pinning per session,
 *       per-version failure backoff, the four distinguished states, stale
 *       completion discarded.
 *
 * CALIBRATION: every threshold/margin/timeout constant below is a v1 default
 * that is "calibration-pending on the adversarial-6" (miami-dade-fl, loving-tx,
 * apache-az, orleans-parish-la, sedgwick-ks, suffolk-ma). The plan mandates a
 * single calibration pass on the 6-county bake before the numbers are frozen
 * for the packHash lineage. They are named constants precisely so that pass is
 * a one-line edit, never a hunt through logic.
 */

// ---------------------------------------------------------------------------
// 1. Band selection: pure density curve + hysteresis
// ---------------------------------------------------------------------------

export type ZoomBand = "far" | "mid" | "near";

/**
 * Density calibration points, expressed on the density axis. `deriveBandDensity`
 * normalizes screen-space density so that at the reference viewport + reference
 * county scale, `density === zoom`; the plan's 0.7 (FAR->MID) and 1.4
 * (MID->NEAR) zoom calibration points therefore land unchanged on the density
 * axis (R1: "calibrated at 0.7/1.4 defaults ... expressed through the density
 * curve"). Calibration-pending on the adversarial-6.
 */
export const BAND_FAR_MID_DENSITY = 0.7;
export const BAND_MID_NEAR_DENSITY = 1.4;

/**
 * Symmetric hysteresis half-margin around each calibration point. A band is
 * "sticky" inside `threshold ± margin`: to rise past a boundary density must
 * exceed `threshold + margin`; to fall it must drop below `threshold - margin`.
 * This is what makes threshold-parking (wheeling back and forth across a
 * boundary) produce ZERO band thrash. 0.08 keeps the FAR/MID sticky window
 * [0.62, 0.78] and the MID/NEAR window [1.32, 1.48] comfortably non-overlapping
 * (the two calibration points are 0.7 apart). Calibration-pending on the
 * adversarial-6.
 */
export const BAND_HYSTERESIS_MARGIN = 0.08;

/**
 * Integer band codes. Carmack rule: the frame-rate hot path (a band decision per
 * wheel delta / per pointer move) works in ints — no string compares, no branch
 * table on labels, no allocation. `FAR < MID < NEAR`, so a code doubles as its
 * detail ordinal (monotone with density).
 */
export const BAND_CODE_FAR = 0;
export const BAND_CODE_MID = 1;
export const BAND_CODE_NEAR = 2;

const BAND_BY_CODE: readonly ZoomBand[] = ["far", "mid", "near"];

export function bandFromCode(code: number): ZoomBand {
  return BAND_BY_CODE[code] ?? "far";
}

export function bandToCode(band: ZoomBand): number {
  return band === "near" ? BAND_CODE_NEAR : band === "mid" ? BAND_CODE_MID : BAND_CODE_FAR;
}

// Precomputed hysteresis edges — baked once at module load, never recomputed in
// the loop (the reference inlined these four subtractions on every call). The
// sticky window for a band is [lowEdge, highEdge).
const BAND_UP_FAR_MID = BAND_FAR_MID_DENSITY + BAND_HYSTERESIS_MARGIN; // rise FAR->MID
const BAND_DOWN_FAR_MID = BAND_FAR_MID_DENSITY - BAND_HYSTERESIS_MARGIN; // fall MID->FAR
const BAND_UP_MID_NEAR = BAND_MID_NEAR_DENSITY + BAND_HYSTERESIS_MARGIN; // rise MID->NEAR
const BAND_DOWN_MID_NEAR = BAND_MID_NEAR_DENSITY - BAND_HYSTERESIS_MARGIN; // fall NEAR->MID

/**
 * Branch-lean, allocation-free band selection in integer space — the hot path.
 *
 * The band is the classic "sum of comparisons": count how many of two edges the
 * density clears (`0 -> FAR`, `1 -> MID`, `2 -> NEAR`). Which two edges is chosen
 * by the current band, and that is the entire hysteresis — FAR probes the two UP
 * edges, NEAR the two DOWN edges, MID the DOWN_FAR_MID / UP_MID_NEAR pair — so a
 * band only rises past `threshold + margin` and only falls below
 * `threshold - margin`. Multi-band jumps (FAR->NEAR, NEAR->FAR) fall straight out
 * of the count. Pass `currentCode < 0` (default) for the bare classification at
 * the raw calibration points. Proven byte-identical to the reference `selectBand`
 * semantics by the equivalence fuzz.
 */
export function selectBandCode(density: number, currentCode = -1): number {
  let eLow: number;
  let eHigh: number;
  switch (currentCode) {
    case BAND_CODE_FAR:
      eLow = BAND_UP_FAR_MID;
      eHigh = BAND_UP_MID_NEAR;
      break;
    case BAND_CODE_MID:
      eLow = BAND_DOWN_FAR_MID;
      eHigh = BAND_UP_MID_NEAR;
      break;
    case BAND_CODE_NEAR:
      eLow = BAND_DOWN_FAR_MID;
      eHigh = BAND_DOWN_MID_NEAR;
      break;
    default:
      eLow = BAND_FAR_MID_DENSITY;
      eHigh = BAND_MID_NEAR_DENSITY;
      break;
  }
  return (density >= eLow ? 1 : 0) + (density >= eHigh ? 1 : 0);
}

/**
 * Pure band selection (ergonomic string-band wrapper over the integer hot path,
 * `selectBandCode` — single source of truth, so the two cannot diverge).
 *
 * Without `currentBand` it is a bare classification at the calibration points
 * (used for the initial band). With `currentBand` it applies hysteresis
 * relative to the current band, so the result is a deterministic function of
 * `(density, currentBand)` — no hidden state, safe to call from anywhere. The
 * controller feeds `committedBand` as `currentBand` so the sticky window is
 * anchored on what is actually rendered.
 *
 * Handles multi-band jumps (FAR->NEAR, NEAR->FAR) so a fast zoom that crosses
 * both calibration points in one step resolves in a single call.
 */
export function selectBand(density: number, currentBand?: ZoomBand): ZoomBand {
  return bandFromCode(selectBandCode(density, currentBand === undefined ? -1 : bandToCode(currentBand)));
}

// ---------------------------------------------------------------------------
// 2. Density derivation: zoom x viewport x county scale
// ---------------------------------------------------------------------------

/**
 * Reference viewport min-dimension (CSS px) at which the density curve is
 * calibrated. At this viewport (and reference county scale, device scale 1)
 * `deriveBandDensity` returns exactly `zoom`, so 0.7/1.4 line up with the plan's
 * zoom calibration points. Calibration-pending on the adversarial-6 (the real
 * ChatGPT widget viewport is measured there).
 */
export const BAND_DENSITY_REFERENCE_VIEWPORT_PX = 900;

/** Floors that keep the derivation total and finite for hostile inputs. */
const MIN_VIEWPORT_SPAN_PX = 1;
const MIN_COUNTY_SCALE = 1e-6;
const MIN_DEVICE_SCALE = 1e-6;

export type BandDensityInputs = {
  /** Camera zoom multiplier (1 = fit-to-frame baseline). Larger -> more detail. */
  zoom: number;
  /** min(viewport width, height) in CSS px. Larger screen -> more detail. */
  viewportSpanPx: number;
  /**
   * County geographic span normalized to the reference county (dimensionless,
   * 1 = reference). A physically larger county spans more ground, so at a fixed
   * zoom each unit of geography occupies fewer pixels -> LOWER density -> detail
   * needs more zoom. Hence `1 / countyScale`.
   */
  countyScale: number;
  /**
   * Optional device-class factor (R1's "device class" term), default 1. Folded
   * as a plain multiplier; > 1 brings detail sooner on denser displays.
   * Calibration-pending — left inert (1) until measured on real devices.
   */
  deviceScale?: number;
};

/**
 * Derive the screen-space density scalar the band curve consumes.
 *
 *   density = zoom
 *           * (viewportSpanPx / REFERENCE_VIEWPORT_PX)   // bigger screen, denser
 *           * (1 / countyScale)                          // bigger county, sparser
 *           * deviceScale                                // device class
 *
 * Pure and monotonic in every factor. Inputs are floored to small positive
 * values so a degenerate zero/negative never yields NaN/Infinity (the band
 * would silently break); this is a safety net, not a normal operating point.
 */
/**
 * Allocation-free primitive-argument density derivation — the hot path the render
 * loop calls each frame without building an inputs object (no per-frame garbage).
 * Identical float math and clamping to `deriveBandDensity`, and the same
 * left-to-right operation order, so results are bit-identical (proven by fuzz).
 */
export function deriveBandDensityArgs(
  zoom: number,
  viewportSpanPx: number,
  countyScale: number,
  deviceScale = 1,
): number {
  const z = Number.isFinite(zoom) ? Math.max(0, zoom) : 0;
  const v = Math.max(MIN_VIEWPORT_SPAN_PX, viewportSpanPx);
  const c = Math.max(MIN_COUNTY_SCALE, countyScale);
  const d = Math.max(MIN_DEVICE_SCALE, deviceScale);
  const viewportFactor = v / BAND_DENSITY_REFERENCE_VIEWPORT_PX;
  return (z * viewportFactor * d) / c;
}

export function deriveBandDensity(inputs: BandDensityInputs): number {
  return deriveBandDensityArgs(inputs.zoom, inputs.viewportSpanPx, inputs.countyScale, inputs.deviceScale ?? 1);
}

// ---------------------------------------------------------------------------
// 3. Controller state & events
// ---------------------------------------------------------------------------

/** A pinned manifest epoch (R2 §2.1/§2.3): the session-stable addressing key. */
export type ManifestEpoch = {
  schemaVersion: string;
  packHash: string;
};

export type BandGestureSource = "wheel" | "pinch" | "pan";

/**
 * Settle causes (decision #57 / R2 §4.3). Two kinds:
 *   COMPLETION  — the user has settled on a zoom; the pending band is REQUESTED:
 *                 "wheel-idle" (internal, fired by a tick after the idle timeout)
 *                 and "inertia-end" (pointer momentum ended).
 *   ABORT       — the gesture was interrupted; any in-flight intent is cancelled
 *                 and nothing is requested: "cancel", "lost-capture", "blur",
 *                 "unmount" (these are exactly R2 §4.3's abort list). "unmount"
 *                 additionally makes the controller terminal/inert.
 */
export type BandSettleCause =
  | "wheel-idle"
  | "inertia-end"
  | "cancel"
  | "lost-capture"
  | "blur"
  | "unmount";

/** Settle causes a caller dispatches directly; "wheel-idle" is derived on tick. */
export type BandExplicitSettleCause = Exclude<BandSettleCause, "wheel-idle">;

const COMPLETION_SETTLE_CAUSES: ReadonlySet<BandSettleCause> = new Set<BandSettleCause>([
  "wheel-idle",
  "inertia-end",
]);

function isCompletionSettle(cause: BandSettleCause): boolean {
  return COMPLETION_SETTLE_CAUSES.has(cause);
}

/** Reasons a transactional commit failed (R2 §2.4 / §4.3). Surfaced to status UI. */
export type BandDegradeReason =
  | "missing-expected-chunk"
  | "storage-unavailable"
  | "retired-version"
  | "corrupt-chunk"
  | "invalid-schema"
  | "oversized-decode"
  | "aborted"
  | "unknown";

export type BandGestureState =
  | { phase: "settled" }
  | { phase: "active"; source: BandGestureSource; lastActivityTime: number };

/**
 * An in-flight transition request. `id` is the latest-wins key (decision #57):
 * a completion referencing an id that is no longer the pending id is a stale
 * completion and is discarded. `epoch` is a snapshot for the trace; commit
 * validity is checked against the live `pinnedEpoch`.
 */
export type BandTransitionIntent = {
  id: number;
  fromBand: ZoomBand;
  targetBand: ZoomBand;
  epoch: ManifestEpoch | null;
  requestedAt: number;
};

/** Per-version (per-packHash) failure backoff latch (R2 §4.2). */
export type BandBackoffState = {
  epochKey: string;
  failureCount: number;
  nextEligibleTime: number;
};

/**
 * Visible degrade latch (T3 / R2 §4.1). Never silent: exposed in state so the
 * status UI can render the "street detail unavailable" banner. `since` is the
 * time of the last enter/exit so the UI can order events deterministically.
 */
export type BandDegradeState = {
  active: boolean;
  reason: BandDegradeReason | null;
  since: number;
};

export type BandControllerState = {
  /** What the current density wants (after hysteresis vs the committed band). */
  desiredBand: ZoomBand;
  /** What is actually rendered — the only band `windowFor` ever sees. */
  committedBand: ZoomBand;
  density: number;
  gesture: BandGestureState;
  pinnedEpoch: ManifestEpoch | null;
  pendingIntent: BandTransitionIntent | null;
  backoff: BandBackoffState | null;
  degrade: BandDegradeState;
  /** Monotonic source for intent ids (latest-wins). */
  intentCounter: number;
  /** Set by an "unmount" settle; the controller is then inert. */
  unmounted: boolean;
};

export type BandControllerEvent =
  /** A zoom/pan step during a gesture: marks the gesture active, updates density
   *  (and thus desiredBand), but NEVER requests — mid-gesture crossings defer. */
  | { type: "gesture-activity"; source: BandGestureSource; density: number; time: number }
  /** A clock tick. The only thing that can fire a "wheel-idle" settle: if a wheel
   *  gesture has been idle for WHEEL_IDLE_SETTLE_MS the controller settles it. */
  | { type: "tick"; time: number }
  /** An explicit settle (inertia-end / cancel / lost-capture / blur / unmount). */
  | { type: "settle"; cause: BandExplicitSettleCause; time: number }
  /** Pin the session epoch on first chunk need (R2 §2.3). Idempotent. */
  | { type: "pin-epoch"; epoch: ManifestEpoch }
  /** A 410 retired-version (R2 §2.4): drop the pin + backoff so the next
   *  pin-epoch re-resolves; any in-flight intent becomes stale. */
  | { type: "retire-epoch"; time: number }
  /** The caller validated the WHOLE required window and performed the single
   *  atomic swap (decision #58). Accepted only if the id is still current and
   *  the epoch matches the pin. */
  | { type: "commit"; intentId: number; epoch: ManifestEpoch; time: number }
  /** The required window could not be validated (R2 §4.1/§4.2): enter degrade,
   *  arm per-epoch backoff, do NOT immediately re-request. */
  | { type: "commit-failed"; intentId: number; epoch: ManifestEpoch; reason: BandDegradeReason; time: number };

// ---------------------------------------------------------------------------
// 4. Gesture / backoff constants (calibration-pending)
// ---------------------------------------------------------------------------

/**
 * Wheel-idle timeout: a wheel gesture with no wheel activity for this long is
 * considered settled (fires a "wheel-idle" completion settle on the next tick).
 * 140 ms is long enough to bridge the gaps between fast trackpad wheel deltas
 * yet short enough to feel immediate. Calibration-pending on the adversarial-6.
 */
export const WHEEL_IDLE_SETTLE_MS = 140;

/**
 * Per-epoch failure backoff (R2 §4.2): exponential from BASE, capped at MAX.
 * After a failed commit the controller will not re-request the same epoch's
 * window until `nextEligibleTime`, and even then only on the next gesture
 * settle. Calibration-pending on the adversarial-6.
 */
export const BAND_BACKOFF_BASE_MS = 400;
export const BAND_BACKOFF_MAX_MS = 8000;

/** failureCount 1 -> BASE, 2 -> 2*BASE, ... capped at MAX. */
export function bandBackoffDelayMs(failureCount: number): number {
  const n = Math.max(1, Math.floor(failureCount));
  const raw = BAND_BACKOFF_BASE_MS * 2 ** (n - 1);
  return Math.min(BAND_BACKOFF_MAX_MS, raw);
}

// ---------------------------------------------------------------------------
// 5. Construction & helpers
// ---------------------------------------------------------------------------

export type CreateBandControllerOptions = {
  /** Initial density; if omitted, 0 (-> FAR). */
  initialDensity?: number;
  /** Force an initial committed band; if omitted, derived from initialDensity. */
  initialBand?: ZoomBand;
  /** Pre-pin an epoch (rare; usually pinned via pin-epoch). */
  initialEpoch?: ManifestEpoch;
};

export function createBandControllerState(options: CreateBandControllerOptions = {}): BandControllerState {
  const density = options.initialDensity ?? 0;
  const band = options.initialBand ?? selectBand(density);
  return {
    desiredBand: band,
    committedBand: band,
    density,
    gesture: { phase: "settled" },
    pinnedEpoch: options.initialEpoch ? cloneEpoch(options.initialEpoch) : null,
    pendingIntent: null,
    backoff: null,
    degrade: { active: false, reason: null, since: 0 },
    intentCounter: 0,
    unmounted: false,
  };
}

function cloneEpoch(epoch: ManifestEpoch): ManifestEpoch {
  return { schemaVersion: epoch.schemaVersion, packHash: epoch.packHash };
}

function epochEquals(a: ManifestEpoch | null, b: ManifestEpoch | null): boolean {
  if (a === null || b === null) return false;
  return a.schemaVersion === b.schemaVersion && a.packHash === b.packHash;
}

/** Deep clone so the reducer never mutates its input (determinism / trace safety). */
function cloneState(state: BandControllerState): BandControllerState {
  return {
    desiredBand: state.desiredBand,
    committedBand: state.committedBand,
    density: state.density,
    gesture:
      state.gesture.phase === "active"
        ? { phase: "active", source: state.gesture.source, lastActivityTime: state.gesture.lastActivityTime }
        : { phase: "settled" },
    pinnedEpoch: state.pinnedEpoch ? cloneEpoch(state.pinnedEpoch) : null,
    pendingIntent: state.pendingIntent ? { ...state.pendingIntent, epoch: state.pendingIntent.epoch ? cloneEpoch(state.pendingIntent.epoch) : null } : null,
    backoff: state.backoff ? { ...state.backoff } : null,
    degrade: { ...state.degrade },
    intentCounter: state.intentCounter,
    unmounted: state.unmounted,
  };
}

function backoffActive(state: BandControllerState, time: number): boolean {
  if (!state.backoff || !state.pinnedEpoch) return false;
  if (state.backoff.epochKey !== state.pinnedEpoch.packHash) return false;
  return time < state.backoff.nextEligibleTime;
}

/**
 * Reconcile the pending intent against the current desired-vs-committed band.
 * The single point where a transition is REQUESTED (a fresh intent id) or
 * superseded/cancelled. Only ever called from a settled gesture (a completion
 * settle, or a post-commit convergence) — never mid-gesture (that is the
 * deferral guarantee). Mutates `state` in place; caller owns cloning.
 */
function reconcileIntent(state: BandControllerState, time: number): void {
  if (state.unmounted) return;

  if (state.desiredBand === state.committedBand) {
    // No transition needed. Cancel any stale-target pending intent (its later
    // completion becomes stale via id mismatch), and the missing-detail
    // condition is gone -> exit degrade deterministically (never silent).
    state.pendingIntent = null;
    if (state.degrade.active) {
      state.degrade = { active: false, reason: null, since: time };
    }
    return;
  }

  // desired !== committed -> a transition is wanted.
  if (state.pendingIntent && state.pendingIntent.targetBand === state.desiredBand) {
    return; // already heading to the right band; let it complete
  }
  if (backoffActive(state, time)) {
    // Failure backoff latch: no new request until the epoch's window is eligible
    // again (and even then only on a settle). Drop any wrong-target stale intent.
    state.pendingIntent = null;
    return;
  }

  state.intentCounter += 1;
  state.pendingIntent = {
    id: state.intentCounter,
    fromBand: state.committedBand,
    targetBand: state.desiredBand,
    epoch: state.pinnedEpoch ? cloneEpoch(state.pinnedEpoch) : null,
    requestedAt: time,
  };
}

function applySettle(state: BandControllerState, cause: BandSettleCause, time: number): void {
  state.gesture = { phase: "settled" };

  if (cause === "unmount") {
    state.pendingIntent = null;
    state.unmounted = true;
    return;
  }

  if (!isCompletionSettle(cause)) {
    // Abort settle (cancel / lost-capture / blur): cancel any in-flight intent,
    // request nothing. Degrade latch is untouched (the missing-detail condition,
    // if any, has not changed).
    state.pendingIntent = null;
    return;
  }

  // Completion settle (wheel-idle / inertia-end): request the settled band.
  reconcileIntent(state, time);
}

// ---------------------------------------------------------------------------
// 6. Reducer
// ---------------------------------------------------------------------------

/**
 * The transition logic, applied IN PLACE to `state`. Single source of truth for
 * both the pure reducer (which clones first) and the in-place fast path (which
 * does not). Every helper it calls (`applySettle`, `reconcileIntent`) already
 * mutates in place, so this stays a straight-line mutation with no allocation
 * beyond the small records the semantics genuinely create (a new intent, a
 * degrade/backoff record) — and those only on the rare discrete events, never on
 * the frame-frequent `gesture-activity`.
 */
function applyBandEvent(state: BandControllerState, event: BandControllerEvent): void {
  switch (event.type) {
    case "gesture-activity": {
      state.density = event.density;
      state.desiredBand = selectBand(event.density, state.committedBand);
      // Reuse the gesture record when the gesture is already active on the same
      // source (the steady-state wheel/pinch stream) so repeated deltas allocate
      // nothing; otherwise start a fresh active record. Value-identical either way.
      if (state.gesture.phase === "active" && state.gesture.source === event.source) {
        state.gesture.lastActivityTime = event.time;
      } else {
        state.gesture = { phase: "active", source: event.source, lastActivityTime: event.time };
      }
      // Mid-gesture crossing DEFERS: desiredBand moved, but no request/supersede.
      return;
    }

    case "tick": {
      if (
        state.gesture.phase === "active" &&
        state.gesture.source === "wheel" &&
        event.time - state.gesture.lastActivityTime >= WHEEL_IDLE_SETTLE_MS
      ) {
        applySettle(state, "wheel-idle", event.time);
      }
      return;
    }

    case "settle": {
      applySettle(state, event.cause, event.time);
      return;
    }

    case "pin-epoch": {
      // Pin once per session (R2 §2.3). Ignore re-pins of the same/other epoch
      // while a pin stands; a retire-epoch is the only way to change it.
      if (state.pinnedEpoch === null) {
        state.pinnedEpoch = cloneEpoch(event.epoch);
      }
      return;
    }

    case "retire-epoch": {
      // 410 retired: drop pin + backoff; any in-flight intent is now stale.
      state.pinnedEpoch = null;
      state.backoff = null;
      state.pendingIntent = null;
      return;
    }

    case "commit": {
      // Latest-wins: ignore a completion for a superseded/cancelled intent.
      if (!state.pendingIntent || event.intentId !== state.pendingIntent.id) return;
      // Epoch pinning: ignore a completion from the wrong epoch.
      if (!epochEquals(event.epoch, state.pinnedEpoch)) return;

      // Single transactional commit (decision #58).
      state.committedBand = state.pendingIntent.targetBand;
      state.pendingIntent = null;
      state.backoff = null; // success clears the per-epoch failure latch
      if (state.degrade.active) {
        state.degrade = { active: false, reason: null, since: event.time };
      }
      // Converge residual/deferred desire (e.g. a mid-gesture crossing that was
      // deferred while this intent was in flight), but only if already settled —
      // if a new gesture is active, keep deferring.
      if (state.gesture.phase === "settled") {
        reconcileIntent(state, event.time);
      }
      return;
    }

    case "commit-failed": {
      if (!state.pendingIntent || event.intentId !== state.pendingIntent.id) return;
      if (!epochEquals(event.epoch, state.pinnedEpoch)) return;

      // The failed intent is done; do NOT immediately re-request (backoff latch).
      state.pendingIntent = null;
      // Enter degrade — visible, deterministic, never silent.
      state.degrade = { active: true, reason: event.reason, since: event.time };
      // Arm/advance per-epoch backoff keyed by the pinned packHash.
      const packHash = state.pinnedEpoch ? state.pinnedEpoch.packHash : event.epoch.packHash;
      const failureCount = (state.backoff && state.backoff.epochKey === packHash ? state.backoff.failureCount : 0) + 1;
      state.backoff = {
        epochKey: packHash,
        failureCount,
        nextEligibleTime: event.time + bandBackoffDelayMs(failureCount),
      };
      return;
    }
  }
}

/**
 * Pure reducer — returns a NEW state, never mutates its input (the immutable
 * reference path: undo, tracing, snapshots). Clones the whole state up front,
 * then applies the transition to the clone.
 */
export function reduceBandController(state: BandControllerState, event: BandControllerEvent): BandControllerState {
  // Terminal after unmount: inert. (pin/commit/etc. all ignored.)
  if (state.unmounted) return state;
  const next = cloneState(state);
  applyBandEvent(next, event);
  return next;
}

/**
 * In-place fast path — mutates and returns the SAME state object. Skips the
 * per-event `cloneState` (the dominant per-event allocation: a state record plus
 * copies of gesture/epoch/intent/backoff/degrade), so a render loop that owns its
 * state can step it with essentially zero GC pressure. Identical transition
 * semantics to `reduceBandController` — it runs the exact same `applyBandEvent`,
 * proven equivalent across randomized sequences by the equivalence fuzz.
 *
 * Because it mutates, any previously-captured reference to `state` also changes —
 * do not share the object across a boundary that assumes immutability, and do not
 * keep a `state` reference expecting it to be a prior snapshot. Use
 * `reduceBandController` where you need immutable snapshots.
 */
export function stepBandControllerMut(state: BandControllerState, event: BandControllerEvent): BandControllerState {
  if (state.unmounted) return state;
  applyBandEvent(state, event);
  return state;
}

// ---------------------------------------------------------------------------
// 7. Convenience: fold a sequence + capture a trace (determinism harness)
// ---------------------------------------------------------------------------

export type BandControllerRun = {
  state: BandControllerState;
  /** State snapshot AFTER each event (index i is the state after events[i]). */
  trace: BandControllerState[];
};

/**
 * Fold an event sequence over the reducer, capturing the post-event state after
 * each step. Pure: same `(initial, events)` -> identical `state` and `trace`.
 */
export function runBandController(
  initial: BandControllerState,
  events: readonly BandControllerEvent[],
): BandControllerRun {
  let state = initial;
  const trace: BandControllerState[] = [];
  for (const event of events) {
    state = reduceBandController(state, event);
    trace.push(state);
  }
  return { state, trace };
}
