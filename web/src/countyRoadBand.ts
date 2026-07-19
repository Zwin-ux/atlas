// 0.78-R Lane A1 — zoom-band road overlay for the census county board.
//
// Drives the core band controller (decision #56: selection + state semantics
// live in core; this hook is the web-side owner that feeds it events) and, on
// the first NEAR intent, pins the catalog epoch (R2 §2.3), fetches the
// county's baked road chunks from the live /road-chunks routes, validates the
// whole set, and performs ONE transactional commit (decision #58): the road
// segments enter the scene once, tagged lodBand:"near", and band visibility
// after that is pure per-frame windowFor filtering — no scene churn on zoom.
//
// Failure is never silent (T3): any fetch/decode failure marks the overlay
// unavailable, the controller arms its backoff, and the board stays on its
// committed band.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  compileCountyRoadSegments,
  createBandControllerState,
  decodeRoadChunk,
  reduceBandController,
  type BandControllerEvent,
  type BandControllerState,
  type CityWorldLodBand,
  type CityWorldRoadSegment,
  type CityWorldScene,
  type ManifestEpoch,
  type RoadChunk,
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
  /** "idle" | "loading" | "ready" | "unavailable" — for the status surface. */
  roadStatus: string;
};

const TICK_MS = 80; // < WHEEL_IDLE_SETTLE_MS so wheel-idle settles promptly

export function useCountyRoadBand(
  slug: string | null,
  baseScene: CityWorldScene | null,
  enabled: boolean,
): CountyRoadBandResult {
  const stateRef = useRef<BandControllerState>(createBandControllerState());
  const fetchStartedRef = useRef(false);
  const epochRef = useRef<ManifestEpoch | null>(null);
  const [committedBand, setCommittedBand] = useState<CityWorldLodBand>("far");
  const [roads, setRoads] = useState<CityWorldRoadSegment[] | null>(null);
  const [roadStatus, setRoadStatus] = useState("idle");
  const roadsRef = useRef<CityWorldRoadSegment[] | null>(null);
  const active = enabled && Boolean(slug) && Boolean(baseScene?.geoProjection);

  const dispatch = useCallback((event: BandControllerEvent) => {
    stateRef.current = reduceBandController(stateRef.current, event);
  }, []);

  // Fetch catalog -> manifest -> every present chunk; decode; compile; commit.
  const beginFetch = useCallback(async () => {
    const scene = baseScene;
    const projection = scene?.geoProjection;
    const intent = stateRef.current.pendingIntent;
    if (!slug || !scene || !projection || !intent) return;
    setRoadStatus("loading");
    try {
      const catalogRes = await fetch(`/road-catalog/${slug}/current`);
      if (!catalogRes.ok) throw new Error(`catalog ${catalogRes.status}`);
      const catalog = (await catalogRes.json()) as RoadCatalog;
      const epoch: ManifestEpoch = { schemaVersion: catalog.schemaVersion, packHash: catalog.packHash };
      epochRef.current = epoch;
      dispatch({ type: "pin-epoch", epoch });

      const manifestRes = await fetch(`/road-chunks/${slug}/${catalog.manifestUri}`);
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
        const slice = chunkIds.slice(i, i + batch);
        const decoded = await Promise.all(
          slice.map(async (chunkId) => {
            const res = await fetch(`${base}${chunkId}.json`);
            if (!res.ok) throw new Error(`chunk ${chunkId} ${res.status}`);
            return decodeRoadChunk(await res.text());
          }),
        );
        chunks.push(...decoded);
      }
      if (chunks.length !== chunkIds.length) throw new Error("incomplete window");

      const segments = compileCountyRoadSegments(chunks, manifest.spatialBasis.originLonLat, projection, {
        lodBand: "near",
      });
      // The whole required window validated -> single transactional commit.
      roadsRef.current = segments;
      const pending = stateRef.current.pendingIntent;
      if (pending) {
        dispatch({ type: "commit", intentId: pending.id, epoch, time: performance.now() });
      }
      setRoads(segments);
      setRoadStatus("ready");
      setCommittedBand(stateRef.current.committedBand as CityWorldLodBand);
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
      fetchStartedRef.current = false;
    }
  }, [slug, baseScene, dispatch]);

  // After every controller step: resolve pending intents. Roads already local
  // -> commit immediately (window trivially valid); otherwise start the fetch.
  const settlePending = useCallback(() => {
    const state = stateRef.current;
    const pending = state.pendingIntent;
    if (!pending) {
      setCommittedBand(state.committedBand as CityWorldLodBand);
      return;
    }
    if (state.desiredBand !== "near" || roadsRef.current) {
      const epoch = epochRef.current ?? { schemaVersion: "roadchunk/1", packHash: "local" };
      dispatch({ type: "commit", intentId: pending.id, epoch, time: performance.now() });
      setCommittedBand(stateRef.current.committedBand as CityWorldLodBand);
      return;
    }
    if (!fetchStartedRef.current) {
      fetchStartedRef.current = true;
      void beginFetch();
    }
  }, [beginFetch, dispatch]);

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
    return () => {
      window.clearInterval(timer);
      dispatch({ type: "settle", cause: "unmount", time: performance.now() });
    };
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
