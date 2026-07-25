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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AtlasPlate } from "./AtlasPlate";
import type { Plate } from "./plateGeometry";
import "./atlas.css";

export type PlateRef =
  | { level: "nation" }
  | { level: "state"; state: string; stateName?: string }
  | { level: "county"; countySlug: string; state?: string; name?: string };

type LoadState =
  | { status: "idle" }
  | { status: "loading"; ref: PlateRef }
  | { status: "ready"; ref: PlateRef; plate: Plate }
  | { status: "error"; ref: PlateRef; message: string };

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
};

export function AtlasApp({ initialRef, coverage, apiBase = "" }: AtlasAppProps) {
  const [trail, setTrail] = useState<PlateRef[]>([initialRef ?? { level: "nation" }]);
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const requestId = useRef(0);

  const current = trail[trail.length - 1]!;

  // Follow the tool: when a new plate reference arrives, reset the trail to it.
  useEffect(() => {
    if (!initialRef) return;
    setTrail([initialRef]);
  }, [initialRef?.level, (initialRef as { countySlug?: string })?.countySlug, (initialRef as { state?: string })?.state]);

  useEffect(() => {
    const id = ++requestId.current;
    let cancelled = false;
    setLoad({ status: "loading", ref: current });

    fetch(`${apiBase}${plateUrl(current)}`, { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Atlas could not load that map (HTTP ${response.status}).`);
        }
        return (await response.json()) as Plate;
      })
      .then((plate) => {
        // A slow plate must not overwrite a newer one the reader already moved to.
        if (cancelled || id !== requestId.current) return;
        setLoad({ status: "ready", ref: current, plate });
      })
      .catch((error: unknown) => {
        if (cancelled || id !== requestId.current) return;
        setLoad({
          status: "error",
          ref: current,
          message: error instanceof Error ? error.message : "Atlas could not load that map.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [current, apiBase]);

  const openCounty = useCallback((slug: string, name: string) => {
    setTrail((previous) => [...previous, { level: "county", countySlug: slug, name }]);
  }, []);

  const goTo = useCallback((depth: number) => {
    setTrail((previous) => previous.slice(0, depth + 1));
  }, []);

  const crumbs = useMemo(
    () => trail.map((ref, depth) => ({ ref, depth, label: plateTitle(ref, load.status === "ready" && depth === trail.length - 1 ? load.plate : undefined) })),
    [trail, load],
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

      <div className="atlas-app__stage">
        {load.status === "ready" ? (
          <AtlasPlate
            plate={load.plate}
            focusSlug={current.level === "county" ? current.countySlug : undefined}
            onOpenCounty={openCounty}
            coverage={trail.length === 1 ? coverage : undefined}
          />
        ) : load.status === "error" ? (
          <div className="atlas-app__message" role="alert">
            <p>{load.message}</p>
            {trail.length > 1 ? (
              <button type="button" onClick={() => goTo(trail.length - 2)}>
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
