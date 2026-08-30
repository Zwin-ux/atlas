/**
 * Atlas widget shell.
 *
 * Reads the plate reference the MCP tool put in `_meta.atlasPlate`, fetches
 * that plate over HTTP, and hands it to the renderer. Plates travel over HTTP
 * rather than inside the tool payload because the national plate is ~550 KB
 * and this project has already crashed a ChatGPT session by pushing large
 * geometry through connector storage (finding G8-2).
 *
 * The shell also owns navigation: clicking a county on the nation or state
 * plate drills in, and a breadcrumb walks back out. That happens entirely in
 * the widget — no tool round-trip — so exploring the map is instant.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { AtlasPlate } from "./AtlasPlate";
import { AtlasMapController, type PlateRef } from "./AtlasMapController";
import type { Plate } from "./plateGeometry";
import "./atlas.css";

export type { PlateRef } from "./AtlasMapController";

type LoadState =
  | { status: "idle" }
  | { status: "loading"; ref: PlateRef; revision: number }
  | { status: "ready"; ref: PlateRef; plate: Plate; revision: number }
  | { status: "error"; ref: PlateRef; message: string; revision: number };

const STATE_NAMES: Record<string, string> = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", dc: "District of Columbia",
  fl: "Florida", ga: "Georgia", hi: "Hawaii", id: "Idaho", il: "Illinois",
  in: "Indiana", ia: "Iowa", ks: "Kansas", ky: "Kentucky", la: "Louisiana",
  me: "Maine", md: "Maryland", ma: "Massachusetts", mi: "Michigan",
  mn: "Minnesota", ms: "Mississippi", mo: "Missouri", mt: "Montana",
  ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey",
  nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota",
  oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania", pr: "Puerto Rico",
  ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee",
  tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington",
  wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming",
};

function plateUrl(ref: PlateRef): string {
  if (ref.level === "nation") return "/api/atlas/nation";
  if (ref.level === "state") return `/api/atlas/state/${encodeURIComponent(ref.state)}`;
  return `/api/atlas/county/${encodeURIComponent(ref.countySlug)}`;
}

function plateTitle(ref: PlateRef, plate?: Plate): string {
  if (ref.level === "nation") return "United States";
  if (ref.level === "state") return plate?.stateName ?? STATE_NAMES[ref.state] ?? ref.state.toUpperCase();
  return plate?.name ?? ref.name ?? ref.countySlug;
}

export type AtlasAppProps = {
  /** Plate the tool asked for. Defaults to the nation. */
  initialRef?: PlateRef | undefined;
  /** Coverage sentence from the tool response, shown verbatim. */
  coverage?: string | undefined;
  /** Base URL for plate fetches; the widget runs on a sandbox origin. */
  apiBase?: string | undefined;
  /** Optional shared controller, primarily for browser-tool registration. */
  controller?: AtlasMapController | undefined;
};

export function AtlasApp({ initialRef, coverage, apiBase = "", controller: externalController }: AtlasAppProps) {
  const ownedController = useRef<AtlasMapController | null>(null);
  if (!ownedController.current) ownedController.current = new AtlasMapController(initialRef, apiBase);
  const controller = externalController ?? ownedController.current;
  const map = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const requestId = useRef(0);

  const current = map.current;

  // The legacy Apps SDK preview can still supply a new plate. Challenge routes
  // do not mount that host subscription, so browser tools remain the only agent
  // writer there.
  useEffect(() => {
    if (!initialRef) return;
    controller.replaceNavigation(initialRef).catch(() => undefined);
  }, [controller, initialRef?.level, (initialRef as { countySlug?: string })?.countySlug, (initialRef as { state?: string })?.state]);

  useEffect(() => {
    const id = ++requestId.current;
    const request = new AbortController();
    setLoad({ status: "loading", ref: current, revision: map.revision });

    fetch(`${apiBase}${plateUrl(current)}`, {
      headers: { accept: "application/json" },
      signal: request.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Atlas could not load that map (HTTP ${response.status}).`);
        }
        return (await response.json()) as Plate;
      })
      .then((plate) => {
        // A slow plate must not overwrite a newer one the reader already moved to.
        if (request.signal.aborted || id !== requestId.current) return;
        setLoad({ status: "ready", ref: current, plate, revision: map.revision });
      })
      .catch((error: unknown) => {
        if (request.signal.aborted || id !== requestId.current) return;
        const failure = error instanceof Error ? error : new Error("Atlas could not load that map.");
        setLoad({
          status: "error",
          ref: current,
          revision: map.revision,
          message: failure.message,
        });
        controller.rejectVisible(map.revision, failure);
      });

    return () => {
      request.abort();
    };
  }, [current, map.revision, apiBase, controller]);

  useLayoutEffect(() => {
    if (load.status === "ready" && load.revision === map.revision) {
      controller.acknowledgeVisible(map.revision);
    }
  }, [controller, load, map.revision]);

  const openCounty = useCallback((slug: string, name: string) => {
    controller.openCounty(slug, name).catch(() => undefined);
  }, [controller]);

  const goTo = useCallback((depth: number) => {
    controller.goToDepth(depth).catch(() => undefined);
  }, [controller]);

  const crumbs = useMemo(
    () => map.navigationStack.map((ref, depth) => ({
      ref,
      depth,
      label: plateTitle(ref, load.status === "ready" && depth === map.navigationStack.length - 1 ? load.plate : undefined),
    })),
    [map.navigationStack, load],
  );

  return (
    <div className="atlas-app">
      <nav className="atlas-app__crumbs" aria-label="Atlas location">
        {crumbs.map((crumb, i) => (
          <span key={`${crumb.ref.level}-${i}`}>
            {i > 0 ? <span className="atlas-app__sep" aria-hidden="true">›</span> : null}
            {i === crumbs.length - 1 ? (
              <span className="atlas-app__crumb is-current" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <button type="button" className="atlas-app__crumb" onClick={() => goTo(crumb.depth)}>
                {crumb.label}
              </button>
            )}
          </span>
        ))}
      </nav>

      {map.selectedPlace ? (
        <div className="atlas-app__selection" role="status" aria-live="polite">
          <strong>{map.selectedPlace.name}</strong>
          <span>
            {map.selectedPlace.kind === "county" ? map.selectedPlace.state.toUpperCase() : `${map.selectedPlace.countyName}, ${map.selectedPlace.state.toUpperCase()}`}
          </span>
        </div>
      ) : null}

      <div className="atlas-app__stage">
        {load.status === "ready" ? (
          <AtlasPlate
            plate={load.plate}
            focusSlug={current.level === "county" ? current.countySlug : undefined}
            onOpenCounty={openCounty}
            coverage={map.navigationStack.length === 1 ? coverage : undefined}
          />
        ) : load.status === "error" ? (
          <div className="atlas-app__message" role="alert">
            <p>{load.message}</p>
            {map.navigationStack.length > 1 ? (
              <button type="button" onClick={() => goTo(map.navigationStack.length - 2)}>
                Go back
              </button>
            ) : null}
          </div>
        ) : (
          <div className="atlas-app__message" aria-live="polite">
            <p>Drawing {plateTitle(current)}…</p>
          </div>
        )}
      </div>
    </div>
  );
}
