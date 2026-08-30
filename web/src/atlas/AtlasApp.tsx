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

  const openTrailStop = useCallback((index: number) => {
    controller.openTrailStop(index).catch(() => undefined);
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
      <h1 className="sr-only">Atlas shared U.S. map</h1>
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

      <div className="atlas-app__activity" data-status={map.toolStatus} aria-live="polite">
        <span className="atlas-app__activity-status">Site tools {map.toolStatus}</span>
        {map.lastActivity ? (
          <span className="atlas-app__activity-event">
            #{map.lastActivity.sequence} <time dateTime={map.lastActivity.at}>{new Date(map.lastActivity.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time> {map.lastActivity.tool}: {map.lastActivity.summary}
          </span>
        ) : null}
      </div>

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

      {map.trail || map.notes.length > 0 ? (
        <aside className="atlas-app__research" aria-label="Session research">
          {map.trail ? (
            <section>
              <p className="atlas-app__eyebrow">Map trail</p>
              <label>
                <span className="sr-only">Trail title</span>
                <input className="atlas-app__trail-title" key={map.trail.title} defaultValue={map.trail.title} maxLength={60} onBlur={(event) => controller.updateTrailTitle(event.currentTarget.value).catch(() => undefined)} />
              </label>
              <ol className="atlas-app__trail">
                {map.trail.stops.map((stop, index) => (
                  <li key={`${stop.place.countySlug}-${index}`} className={index === map.trail?.activeIndex ? "is-active" : undefined}>
                    <button type="button" className="atlas-app__trail-place" onClick={() => openTrailStop(index)}>
                      <span>{index + 1}</span> {stop.place.name}, {stop.place.state.toUpperCase()}
                    </button>
                    <label>
                      <span className="sr-only">Prompt for {stop.place.name}</span>
                      <input key={stop.prompt} defaultValue={stop.prompt} maxLength={100} onBlur={(event) => controller.updateTrailPrompt(index, event.currentTarget.value).catch(() => undefined)} />
                    </label>
                    <button type="button" className="atlas-app__remove" aria-label={`Remove ${stop.place.name} from trail`} onClick={() => controller.removeTrailStop(index).catch(() => undefined)}>×</button>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {map.notes.length > 0 ? (
            <section>
              <p className="atlas-app__eyebrow">Session notes</p>
              <ul className="atlas-app__notes">
                {map.notes.map((note) => (
                  <li key={note.id}>
                    <strong>{note.place.name}</strong>
                    <label>
                      <span className="sr-only">Note at {note.place.name}</span>
                      <textarea key={note.body} defaultValue={note.body} maxLength={240} rows={2} onBlur={(event) => controller.updateNote(note.id, event.currentTarget.value).catch(() => undefined)} />
                    </label>
                    <button type="button" className="atlas-app__remove" aria-label={`Remove note at ${note.place.name}`} onClick={() => controller.removeNote(note.id).catch(() => undefined)}>×</button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
