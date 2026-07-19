// 0.78-R Lane A — zoom-band road overlay for the census county board.
//
// S1a design (A2-full): road chunks PREFETCH at board mount — catalog fetch,
// epoch pin (legal with no pending intent), manifest, full present-chunk set,
// decode, compile — all in the background while the board stays interactive
// at FAR. The cache is refs only: prefetch NEVER calls setRoads (a scene
// identity change would rebuild mid-audit) and NEVER dispatches commit-failed
// (no pending intent exists; the controller would ignore it and the failure
// would be silent — instead a failed prefetch resets its latch so the NEAR
// intent retries through the intent-time fallback path below).
//
// The single commit point stays the settle path (decision #58): a NEAR intent
// with a warm cache commits instantly — the trace's intent→swap window then
// contains no network and no compile, which is what makes the R3 ceiling
// green. Commits always carry the PINNED epoch: the controller silently drops
// a commit whose epoch mismatches (controller "commit" case), so the old
// "local" fallback is gone.
//
// S1c: trace metrics sample the real renderer residency via
// __ATLAS_QA__.perf.graphicsCount() (the same probe the widget perf gate
// reads); the settled release-end sample waits for the renderer's rebuild
// (sceneRebuilds delta, double-rAF fallback) so it measures the post-swap
// scene, not the pre-rebuild one. Committed segment count rides the
// build-end label (decision #60 evidence).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeTransitionTrace,
  beginTransitionTrace,
  compileCountyRoadSegments,
  createBandControllerState,
  decodeRoadChunk,
  recordTransitionPhase,
  reduceBandController,
  serializeTransitionTraceString,
  type BandControllerEvent,
  type BandControllerState,
  type CityWorldLodBand,
  type CityWorldRoadSegment,
  type CityWorldScene,
  type ManifestEpoch,
  type RoadChunk,
  type TransitionMetricsInput,
  type TransitionTrace,
} from "@atlas/core/voxel";

type RoadCatalog = {
  schemaVersion: string;
  packHash: string;
  manifestUri: string;
};

type RoadManifest = {
  spatialBasis: { originLonLat: [number, number] };
  bands: Record<string, { cells: Record<string, { state: string; chunks?: Array<{ chunkId: string; state: string }> }> }>;
};

export type CountyRoadBandResult = {
  /** Base scene, or the base scene carrying the road overlay once committed. */
  scene: CityWorldScene | null;
  /** Passed through to the renderer's windowFor call. */
  bandOptions: { committedBand: CityWorldLodBand; chunkEpoch?: { schemaVersion: string; packHash: string } } | undefined;
  /** Renderer notifies zoom changes here (gesture activity for the controller). */
  onCameraZoom: ((zoom: number) => void) | undefined;
  /** "idle" | "loading" | "ready" | "sparse" | "unavailable" — status surface.
   *  Semantics: "loading" means a NEAR intent is waiting on a COLD cache; a
   *  background prefetch at FAR reports nothing (stays "idle"). */
  roadStatus: string;
};

const TICK_MS = 80; // < WHEEL_IDLE_SETTLE_MS so wheel-idle settles promptly

type QaPerfProbe = { perf?: { graphicsCount?: () => number; sceneRebuilds?: number } };

function qaProbe(): QaPerfProbe | undefined {
  return (globalThis as unknown as { __ATLAS_QA__?: QaPerfProbe }).__ATLAS_QA__;
}

/** Real renderer residency sample (S1c). Zero before the renderer mounts. */
function sampleMetrics(): TransitionMetricsInput {
  const count = qaProbe()?.perf?.graphicsCount?.() ?? 0;
  return { graphicsCount: count };
}

function publishTrace(trace: TransitionTrace): void {
  const verdict = analyzeTransitionTrace(trace);
  (globalThis as unknown as Record<string, unknown>).__ATLAS_BAND_TRACE__ = {
    verdict,
    trace: serializeTransitionTraceString(trace),
  };
}

/** Wait for the renderer to rebuild after a commit (sceneRebuilds delta),
 *  falling back to a double-rAF when the probe is absent. */
function afterRendererSettles(callback: () => void): void {
  const baseline = qaProbe()?.perf?.sceneRebuilds;
  let frames = 0;
  const step = () => {
    frames += 1;
    const rebuilds = qaProbe()?.perf?.sceneRebuilds;
    const rebuilt = baseline !== undefined && rebuilds !== undefined && rebuilds > baseline;
    if (rebuilt || frames >= 10) {
      callback();
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(() => requestAnimationFrame(step));
}

export function useCountyRoadBand(
  slug: string | null,
  baseScene: CityWorldScene | null,
  enabled: boolean,
): CountyRoadBandResult {
  const stateRef = useRef<BandControllerState>(createBandControllerState());
  const epochRef = useRef<ManifestEpoch | null>(null);
  const roadsRef = useRef<CityWorldRoadSegment[] | null>(null);
  const prefetchRef = useRef<{ generation: number; running: boolean; abort: AbortController | null }>({
    generation: 0,
    running: false,
    abort: null,
  });
  const intentFetchRef = useRef(false);
  const [committedBand, setCommittedBand] = useState<CityWorldLodBand>("far");
  const [roads, setRoads] = useState<CityWorldRoadSegment[] | null>(null);
  const [roadStatus, setRoadStatus] = useState("idle");
  const active = enabled && Boolean(slug) && Boolean(baseScene?.geoProjection);

  const dispatch = useCallback((event: BandControllerEvent) => {
    stateRef.current = reduceBandController(stateRef.current, event);
  }, []);

  // Shared fetch+decode+compile pipeline. Returns null when superseded.
  const loadCounty = useCallback(
    async (
      generation: number,
      signal: AbortSignal,
      onPhase?: (phase: "fetch-start" | "fetch-end" | "build-start" | "build-end", label?: string) => void,
    ): Promise<{ segments: CityWorldRoadSegment[]; epoch: ManifestEpoch } | null> => {
      const scene = baseScene;
      const projection = scene?.geoProjection;
      if (!slug || !scene || !projection) return null;
      const fresh = () => prefetchRef.current.generation === generation && !signal.aborted;

      onPhase?.("fetch-start");
      const catalogRes = await fetch(`/road-catalog/${slug}/current`, { signal });
      if (!catalogRes.ok) throw new Error(`catalog ${catalogRes.status}`);
      const catalog = (await catalogRes.json()) as RoadCatalog;
      const epoch: ManifestEpoch = { schemaVersion: catalog.schemaVersion, packHash: catalog.packHash };
      if (!fresh()) return null;
      epochRef.current = epoch;
      dispatch({ type: "pin-epoch", epoch });

      const manifestRes = await fetch(`/road-chunks/${slug}/${catalog.manifestUri}`, { signal });
      if (!manifestRes.ok) throw new Error(`manifest ${manifestRes.status}`);
      const manifest = (await manifestRes.json()) as RoadManifest;
      const near = manifest.bands["near"];
      if (!near) throw new Error("no near band in manifest");
      const chunkIds: string[] = [];
      for (const cell of Object.values(near.cells)) {
        if (cell.state !== "present") continue;
        for (const chunk of cell.chunks ?? []) {
          if (chunk.state === "present") chunkIds.push(chunk.chunkId);
        }
      }

      const base = `/road-chunks/${slug}/${catalog.schemaVersion}/${catalog.packHash}/near/`;
      const chunks: RoadChunk[] = [];
      const batch = 12;
      for (let i = 0; i < chunkIds.length; i += batch) {
        if (!fresh()) return null;
        const slice = chunkIds.slice(i, i + batch);
        const decoded = await Promise.all(
          slice.map(async (chunkId) => {
            const res = await fetch(`${base}${chunkId}.json`, { signal });
            if (!res.ok) throw new Error(`chunk ${chunkId} ${res.status}`);
            return decodeRoadChunk(await res.text());
          }),
        );
        chunks.push(...decoded);
      }
      if (chunks.length !== chunkIds.length) throw new Error("incomplete window");
      onPhase?.("fetch-end");
      if (!fresh()) return null;

      onPhase?.("build-start");
      const segments = compileCountyRoadSegments(chunks, manifest.spatialBasis.originLonLat, projection, {
        lodBand: "near",
      });
      onPhase?.("build-end", `segments=${segments.length}`);
      if (!fresh()) return null;
      return { segments, epoch };
    },
    [slug, baseScene, dispatch],
  );

  // S1a: mount-time prefetch. Fills the refs only; no setRoads, no controller
  // failure events. A failed prefetch resets its latch so the intent-time
  // path retries; status stays "idle" at FAR either way.
  useEffect(() => {
    if (!active) return;
    // New county: fresh controller, empty cache, new generation.
    prefetchRef.current.abort?.abort();
    const generation = prefetchRef.current.generation + 1;
    const abort = new AbortController();
    prefetchRef.current = { generation, running: true, abort };
    stateRef.current = createBandControllerState();
    epochRef.current = null;
    roadsRef.current = null;
    setRoads(null);
    setRoadStatus("idle");
    setCommittedBand("far");
    void (async () => {
      try {
        const loaded = await loadCounty(generation, abort.signal);
        if (loaded && prefetchRef.current.generation === generation) {
          roadsRef.current = loaded.segments;
          epochRef.current = loaded.epoch;
        }
      } catch {
        // Silent at FAR by design; the NEAR intent path retries and owns
        // the visible failure state.
      } finally {
        if (prefetchRef.current.generation === generation) {
          prefetchRef.current.running = false;
        }
      }
    })();
    return () => {
      abort.abort();
      dispatch({ type: "settle", cause: "unmount", time: performance.now() });
    };
  }, [active, slug, loadCounty, dispatch]);

  // Cache-hit commit: the ONLY commit point once the cache is warm. Records
  // the acceptance trace — intent→swap contains no network and no compile.
  const commitFromCache = useCallback(() => {
    const pending = stateRef.current.pendingIntent;
    const epoch = epochRef.current;
    if (!pending || !epoch) return;
    const cached = roadsRef.current;
    let trace = beginTransitionTrace({
      intentId: pending.id,
      fromBand: stateRef.current.committedBand,
      targetBand: pending.targetBand,
      epoch,
    });
    trace = recordTransitionPhase(trace, "intent-start", pending.requestedAt, sampleMetrics());
    // Destroy-first architecture: the renderer tears down the old scene and
    // builds the new one inside ONE rebuild effect — build and swap are a
    // single act that completes when the rebuild lands. The 350ms transition
    // ceiling governs exactly that rebuild, so "swap" is recorded when the
    // renderer settles, not when setState is called.
    trace = recordTransitionPhase(
      trace,
      "build-start",
      performance.now(),
      sampleMetrics(),
      `segments=${cached?.length ?? 0} (cached)`,
    );
    dispatch({ type: "commit", intentId: pending.id, epoch, time: performance.now() });
    if (pending.targetBand === "near" && cached && !roads) {
      setRoads(cached);
      setRoadStatus(cached.length > 0 ? "ready" : "sparse");
    }
    setCommittedBand(stateRef.current.committedBand as CityWorldLodBand);
    afterRendererSettles(() => {
      // The rebuild effect has run, but the swap is only VISIBLE at the next
      // painted frame — record it there, so the paint cost of the incoming
      // band layer counts toward the 350ms transition (not as a phantom
      // post-swap stall).
      requestAnimationFrame(() => {
        const paintedAt = performance.now();
        trace = recordTransitionPhase(trace, "build-end", paintedAt, sampleMetrics());
        trace = recordTransitionPhase(trace, "swap", paintedAt, sampleMetrics());
        requestAnimationFrame(() => {
          trace = recordTransitionPhase(trace, "next-frame", performance.now(), sampleMetrics());
          trace = recordTransitionPhase(trace, "release-end", performance.now(), sampleMetrics());
          publishTrace(trace);
        });
      });
    });
  }, [dispatch, roads]);

  // Intent-time fallback: NEAR requested while the cache is cold (prefetch
  // failed or still running). Owns the visible loading/unavailable states.
  const fetchForIntent = useCallback(async () => {
    const generation = prefetchRef.current.generation;
    const abort = prefetchRef.current.abort ?? new AbortController();
    setRoadStatus("loading");
    let trace: TransitionTrace | null = null;
    try {
      const intent = stateRef.current.pendingIntent;
      if (intent) {
        trace = beginTransitionTrace({
          intentId: intent.id,
          fromBand: stateRef.current.committedBand,
          targetBand: intent.targetBand,
          epoch: epochRef.current,
        });
        trace = recordTransitionPhase(trace, "intent-start", intent.requestedAt, sampleMetrics());
      }
      const loaded = await loadCounty(generation, abort.signal, (phase, label) => {
        if (trace) trace = recordTransitionPhase(trace, phase, performance.now(), sampleMetrics(), label);
      });
      if (!loaded) return;
      roadsRef.current = loaded.segments;
      epochRef.current = loaded.epoch;
      const pending = stateRef.current.pendingIntent;
      if (pending) {
        dispatch({ type: "commit", intentId: pending.id, epoch: loaded.epoch, time: performance.now() });
      }
      setRoads(loaded.segments);
      setRoadStatus(loaded.segments.length > 0 ? "ready" : "sparse");
      setCommittedBand(stateRef.current.committedBand as CityWorldLodBand);
      if (trace) {
        trace = recordTransitionPhase(trace, "swap", performance.now(), sampleMetrics());
        const settledTrace = trace;
        afterRendererSettles(() => {
          let t = recordTransitionPhase(settledTrace, "next-frame", performance.now(), sampleMetrics());
          t = recordTransitionPhase(t, "release-end", performance.now(), sampleMetrics());
          publishTrace(t);
        });
      }
    } catch {
      const pending = stateRef.current.pendingIntent;
      const epoch = epochRef.current;
      if (pending && epoch) {
        dispatch({
          type: "commit-failed",
          intentId: pending.id,
          epoch,
          reason: "storage-unavailable",
          time: performance.now(),
        });
      }
      setRoadStatus("unavailable");
      setCommittedBand(stateRef.current.committedBand as CityWorldLodBand);
    } finally {
      intentFetchRef.current = false;
    }
  }, [loadCounty, dispatch]);

  // After every controller step: resolve pending intents.
  const settlePending = useCallback(() => {
    const state = stateRef.current;
    const pending = state.pendingIntent;
    if (!pending) {
      setCommittedBand(state.committedBand as CityWorldLodBand);
      return;
    }
    const cacheWarm = Boolean(roadsRef.current && epochRef.current);
    if (pending.targetBand !== "near" || cacheWarm) {
      if (epochRef.current) {
        commitFromCache();
      } else {
        // Impossible in practice (a non-NEAR intent implies a prior NEAR
        // commit, which implies a pinned epoch) — pin deterministically
        // rather than letting the intent wedge.
        const synthetic: ManifestEpoch = { schemaVersion: "roadchunk/1", packHash: "unpinned" };
        dispatch({ type: "pin-epoch", epoch: synthetic });
        epochRef.current = synthetic;
        commitFromCache();
      }
      return;
    }
    if (!intentFetchRef.current) {
      intentFetchRef.current = true;
      void fetchForIntent();
    }
  }, [commitFromCache, fetchForIntent, dispatch]);

  const onCameraZoom = useCallback(
    (zoom: number) => {
      if (!active) return;
      dispatch({ type: "gesture-activity", source: "wheel", density: zoom, time: performance.now() });
      settlePending();
    },
    [active, dispatch, settlePending],
  );

  // Clock ticks give the controller its wheel-idle settle.
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      dispatch({ type: "tick", time: performance.now() });
      settlePending();
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [active, dispatch, settlePending]);

  const scene = useMemo(() => {
    if (!baseScene) return null;
    if (!roads || roads.length === 0) return baseScene;
    return { ...baseScene, roadSegments: [...baseScene.roadSegments, ...roads] };
  }, [baseScene, roads]);

  const bandOptions = useMemo(() => {
    if (!active) return undefined;
    const epoch = epochRef.current;
    return {
      committedBand,
      ...(epoch ? { chunkEpoch: { schemaVersion: epoch.schemaVersion, packHash: epoch.packHash } } : {}),
    };
  }, [active, committedBand]);

  return {
    scene,
    bandOptions,
    onCameraZoom: active ? onCameraZoom : undefined,
    roadStatus,
  };
}
