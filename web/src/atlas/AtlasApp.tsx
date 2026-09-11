/**
 * Atlas widget shell.
 *
 * Reads the plate the MCP tool opened, through the view-contract status
 * first. Idle and refusals do not fetch a map. Successful opens fetch
 * that plate over HTTP, and the renderer draws it. Plates travel over HTTP
 * rather than inside the tool payload because the national plate is ~550 KB
 * and this project has already crashed a ChatGPT session by pushing large
 * geometry through connector storage (finding G8-2).
 *
 * The shell also owns navigation: clicking a county on the nation or state
 * plate drills in, and a breadcrumb walks back out. That happens entirely in
 * the widget — no tool round-trip — so exploring the map is instant.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  isAtlasRefusalStatus,
  type AtlasPublicPlace,
  type WidgetViewStatus,
} from "../../../packages/core/src/atlas/viewContract.js";

import { AtlasPlate } from "./AtlasPlate";
import type { Plate } from "./plateGeometry";
import type { PlateFocus } from "./useToolPlate";
import { reportWidgetDebug } from "./widgetDebug";
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

type FetchTrace = {
  url: string;
  status?: number;
  error?: string;
};

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
  /** Plate the tool successfully opened. Empty first-load is idle, not the nation. */
  initialRef?: PlateRef | undefined;
  /**
   * Place the tool resolved inside the county (town/city). Only applied while
   * the trail is still on the tool's initial plate — user drill-down clears it.
   */
  focus?: PlateFocus | undefined;
  /** Base URL for plate fetches; the widget runs on a sandbox origin. */
  apiBase?: string | undefined;
  /** Discriminated host result. Missing output is idle. */
  viewStatus?: WidgetViewStatus | undefined;
  candidates?: readonly AtlasPublicPlace[] | undefined;
  refusalTitle?: string | undefined;
  refusalQuery?: string | undefined;
};

function hostDebugLines(
  apiBase: string,
  initialRef: PlateRef | undefined,
  viewStatus: WidgetViewStatus,
  trace: FetchTrace | null,
): string[] {
  const host = typeof window !== "undefined" ? window.openai : undefined;
  const meta = host?.toolResponseMetadata as { atlasPlate?: { level?: string; countySlug?: string } } | undefined;
  const output = host?.toolOutput as { type?: string; status?: string; level?: string; countySlug?: string } | undefined;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const href = typeof window !== "undefined" ? window.location.href : "";
  return [
    `origin ${origin || "(none)"}`,
    `host ${typeof window !== "undefined" ? window.location.hostname || "(empty)" : ""}`,
    `href ${href.slice(0, 160) || "(none)"}`,
    `apiBase ${apiBase || "(relative)"}`,
    `openai ${host ? "yes" : "missing"}`,
    `viewStatus ${viewStatus}`,
    `metaPlate ${meta?.atlasPlate?.level ?? "none"}${meta?.atlasPlate?.countySlug ? ` ${meta.atlasPlate.countySlug}` : ""}`,
    `output ${output?.type ?? "none"} ${output?.status ?? ""} ${output?.level ?? ""} ${output?.countySlug ?? ""}`.trim(),
    `initialRef ${initialRef ? `${initialRef.level}${initialRef.level === "county" ? ` ${initialRef.countySlug}` : initialRef.level === "state" ? ` ${initialRef.state}` : ""}` : "none — idle, not nation"}`,
    trace
      ? `fetch ${trace.url} ${trace.status != null ? `HTTP ${trace.status}` : trace.error ?? "pending"}`
      : "fetch (none yet)",
  ];
}

function viewCopy(
  status: WidgetViewStatus,
  title: string | undefined,
  query: string | undefined,
): { heading: string; body?: string } {
  if (status === "unresolved") {
    return {
      heading: title?.trim() || "Atlas does not carry that name.",
      ...(query ? { body: `No Census place matched “${query}”.` } : {}),
    };
  }
  if (status === "ambiguous") {
    return {
      heading: title?.trim() || "That name matches more than one place.",
      ...(query ? { body: `“${query}” is used in more than one county.` } : {}),
    };
  }
  if (status === "transport_error") {
    return {
      heading: title?.trim() || "Atlas could not complete that request.",
      body: "The last correct map, if any, stays on screen.",
    };
  }
  return { heading: "Ask Atlas for a US county, state, or town." };
}

export function AtlasApp({
  initialRef,
  focus,
  apiBase = "",
  viewStatus = "idle",
  candidates,
  refusalTitle,
  refusalQuery,
}: AtlasAppProps) {
  const [trail, setTrail] = useState<PlateRef[]>(() => (initialRef ? [initialRef] : []));
  const [load, setLoad] = useState<LoadState>({ status: "idle" });
  const [trace, setTrace] = useState<FetchTrace | null>(null);
  const requestId = useRef(0);

  const current = trail[trail.length - 1];
  const copy = viewCopy(viewStatus, refusalTitle, refusalQuery);

  useEffect(() => {
    document.getElementById("atlas-boot")?.setAttribute("hidden", "");
    reportWidgetDebug(apiBase, "react-mount", initialRef ? `${initialRef.level}` : "no-initial-ref", {
      slug: initialRef && "countySlug" in initialRef ? (initialRef.countySlug ?? "") : "",
    });
  }, []);

  // Follow the tool: when a new plate reference arrives, reset the trail to it.
  useEffect(() => {
    if (!initialRef) return;
    setTrail([initialRef]);
  }, [initialRef?.level, (initialRef as { countySlug?: string })?.countySlug, (initialRef as { state?: string })?.state]);

  useEffect(() => {
    // Fetch the trail plate only. Idle/first-load refusal keep an empty trail,
    // so this cannot silently load the United States. User drill-down still
    // fetches during a later refusal because the last good map stays in trail.
    if (!current) {
      setLoad({ status: "idle" });
      return;
    }
    const target = current;
    const id = ++requestId.current;
    let cancelled = false;
    const url = `${apiBase}${plateUrl(target)}`;
    setLoad({ status: "loading", ref: target });
    setTrace({ url });

    fetch(url, { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          const message = body.error ?? `Atlas could not load that map (HTTP ${response.status}).`;
          throw Object.assign(new Error(message), { status: response.status });
        }
        setTrace({ url, status: response.status });
        return (await response.json()) as Plate;
      })
      .then((plate) => {
        // A slow plate must not overwrite a newer one the reader already moved to.
        if (cancelled || id !== requestId.current) return;
        setLoad({ status: "ready", ref: target, plate });
        reportWidgetDebug(apiBase, "plate-ok", url, { status: "200" });
      })
      .catch((error: unknown) => {
        if (cancelled || id !== requestId.current) return;
        const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : undefined;
        const message = error instanceof Error ? error.message : "Atlas could not load that map.";
        const enriched =
          status != null
            ? `${message} (${url})`
            : `${message} fetching ${url} from ${typeof window !== "undefined" ? window.location.origin : "?"}`;
        setTrace({ url, ...(status != null ? { status } : {}), error: enriched });
        setLoad({ status: "error", ref: target, message: enriched });
        reportWidgetDebug(apiBase, "plate-error", enriched, { url });
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

  // Focus applies only while the reader is still on the plate the tool opened.
  // Clicking into another county or walking the breadcrumb clears it so we do
  // not zoom into an unrelated place on a different plate.
  const activeFocus =
    focus &&
    current &&
    trail.length === 1 &&
    current.level === "county" &&
    initialRef?.level === "county" &&
    current.countySlug === initialRef.countySlug
      ? focus
      : undefined;

  const debugLines = hostDebugLines(apiBase, initialRef, viewStatus, trace);
  const debugFailed = load.status === "error" || viewStatus === "transport_error";
  const showRefusalSheet = isAtlasRefusalStatus(viewStatus);
  const showIdleStage = viewStatus === "idle" && load.status !== "ready";
  const debugHeading =
    load.status === "error"
      ? "Atlas map failed"
      : viewStatus === "idle"
        ? "Atlas waiting"
        : viewStatus === "ambiguous"
          ? "Atlas needs a more specific name"
          : viewStatus === "unresolved"
            ? "Atlas does not carry that name"
            : viewStatus === "transport_error"
              ? "Atlas could not complete that request"
              : load.status === "ready"
                ? "Atlas debug"
                : "Atlas loading";

  return (
    <div className="atlas-app">
      {trail.length > 0 ? (
        <nav className="atlas-app__crumbs" aria-label="Atlas location">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb.ref.level}-${i}`}>
              {i > 0 ? <span className="atlas-app__sep" aria-hidden="true">›</span> : null}
              {i === crumbs.length - 1 ? (
                <span className="atlas-app__crumb is-current" aria-current="page">
                  {crumb.label}
                  {activeFocus?.name ? ` · ${activeFocus.name}` : ""}
                </span>
              ) : (
                <button type="button" className="atlas-app__crumb" onClick={() => goTo(crumb.depth)}>
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="atlas-app__stage">
        {load.status === "ready" && current ? (
          <AtlasPlate
            plate={load.plate}
            focusSlug={current.level === "county" ? current.countySlug : undefined}
            focus={activeFocus}
            onOpenCounty={openCounty}
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
        ) : showIdleStage || (showRefusalSheet && load.status !== "ready") ? (
          <div className="atlas-app__message" role="status" aria-live="polite">
            <p>{copy.heading}</p>
            {copy.body ? <p>{copy.body}</p> : null}
            {viewStatus === "ambiguous" && candidates && candidates.length > 0 ? (
              <CandidateList candidates={candidates} />
            ) : null}
          </div>
        ) : current ? (
          <div className="atlas-app__message" aria-live="polite">
            <p>Drawing {plateTitle(current)}…</p>
          </div>
        ) : (
          <div className="atlas-app__message" aria-live="polite">
            <p>{copy.heading}</p>
          </div>
        )}
      </div>

      {showRefusalSheet && load.status === "ready" ? (
        <div className="atlas-app__sheet" role="status" aria-live="polite">
          <p className="atlas-app__sheet-title">{copy.heading}</p>
          {copy.body ? <p>{copy.body}</p> : null}
          {viewStatus === "ambiguous" && candidates && candidates.length > 0 ? (
            <CandidateList candidates={candidates} />
          ) : null}
        </div>
      ) : null}

      <aside className={`atlas-debug${debugFailed ? " is-error" : ""}`} role={debugFailed ? "alert" : "status"}>
        <strong>{debugHeading}</strong>
        {debugLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </aside>
    </div>
  );
}

function CandidateList({ candidates }: { candidates: readonly AtlasPublicPlace[] }) {
  return (
    <ul className="atlas-app__candidates">
      {candidates.map((place) => (
        <li key={`${place.kind}:${place.countySlug}:${place.name}`}>
          {place.name}
          <span className="atlas-app__candidate-meta">
            {place.kind === "county" ? place.state : `${place.county}, ${place.state}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
