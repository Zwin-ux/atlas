/**
 * Reads the plate the MCP tool published on the host, through the AT-007 view
 * contract. Status is checked before any plate reference. A refusal never
 * replaces the last opened map. First-load absence is idle, not a US map.
 */

import { useEffect, useRef, useState } from "react";

import {
  parseAtlasPlateRef,
  readHostCapabilities,
  resolveWidgetPlate,
  type AtlasHostCapabilities,
  type AtlasPublicPlace,
  type ResolvedWidgetPlate,
  type WidgetViewStatus,
} from "../../../packages/core/src/atlas/viewContract.js";

import type { PlateRef } from "./AtlasApp";

const GLOBALS_EVENTS = ["openai:set_globals", "globals-change", "openai:tool_response"] as const;

const IDLE_RESOLVED: ResolvedWidgetPlate = {
  status: "idle",
  generation: 0,
  fingerprint: "",
};

type ToolPayload = {
  atlasPlate?: {
    level?: string;
    state?: string;
    countySlug?: string;
    name?: string;
    focus?: {
      name?: string;
      lon?: number;
      lat?: number;
    };
  };
};

/** Town/place the tool resolved — fly the camera here on the county plate. */
export type PlateFocus = {
  name?: string | undefined;
  lon: number;
  lat: number;
};

export type ToolPlate = {
  ref?: PlateRef | undefined;
  coverage?: string | undefined;
  focus?: PlateFocus | undefined;
  status: WidgetViewStatus;
  requestGeneration: number;
  requested?: PlateRef | undefined;
  candidates?: readonly AtlasPublicPlace[] | undefined;
  title?: string | undefined;
  query?: string | undefined;
  hostCapabilities: AtlasHostCapabilities;
};

function asPlateRef(value: ReturnType<typeof parseAtlasPlateRef>): PlateRef | undefined {
  return value;
}

function readPlateFocus(meta: ToolPayload | undefined): PlateFocus | undefined {
  const focus = meta?.atlasPlate?.focus;
  if (!focus) return undefined;
  const lon = typeof focus.lon === "number" ? focus.lon : Number.NaN;
  const lat = typeof focus.lat === "number" ? focus.lat : Number.NaN;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return undefined;
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return undefined;
  return {
    lon,
    lat,
    ...(typeof focus.name === "string" && focus.name.trim() ? { name: focus.name.trim() } : {}),
  };
}

/** Query-parameter override, so the plate can be opened directly in /preview. */
function readPreviewRef(): PlateRef | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const county = params.get("county");
  if (county) return { level: "county", countySlug: county };
  const state = params.get("state");
  if (state) return { level: "state", state: state.toLowerCase() };
  if (params.get("nation") === "1") return { level: "nation" };
  return undefined;
}

function readPreviewFocus(): PlateFocus | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const lonRaw = params.get("focusLon");
  const latRaw = params.get("focusLat");
  if (lonRaw == null || latRaw == null || lonRaw === "" || latRaw === "") return undefined;
  const lon = Number(lonRaw);
  const lat = Number(latRaw);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return undefined;
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return undefined;
  const name = params.get("focusName")?.trim();
  return { lon, lat, ...(name ? { name } : {}) };
}

type Displayed = {
  ref?: PlateRef | undefined;
  coverage?: string | undefined;
  focus?: PlateFocus | undefined;
};

type HostInterpretation = {
  displayed: Displayed;
  resolved: ResolvedWidgetPlate;
};

function applyHostOutput(previous: HostInterpretation): HostInterpretation {
  const host = typeof window !== "undefined" ? window.openai : undefined;
  const meta = (host as { toolResponseMetadata?: ToolPayload; toolOutput?: unknown } | undefined)
    ?.toolResponseMetadata;
  const structured = (host as { toolOutput?: unknown } | undefined)?.toolOutput;
  const preview = readPreviewRef();
  const previewFocus = readPreviewFocus();
  const resolved = resolveWidgetPlate({
    structured,
    legacyPlate: asPlateRef(parseAtlasPlateRef(meta?.atlasPlate)),
    preview,
    previous: previous.resolved,
    generation: previous.resolved.generation,
    lastFingerprint: previous.resolved.fingerprint,
  });

  const openedFresh =
    resolved.status === "opened" && resolved.fingerprint !== previous.resolved.fingerprint;
  const focus = openedFresh
    ? (readPlateFocus(meta) ?? previewFocus)
    : previous.displayed.focus ?? (resolved.status === "opened" ? (readPlateFocus(meta) ?? previewFocus) : undefined);

  return {
    displayed: {
      ...(resolved.displayed ? { ref: asPlateRef(resolved.displayed) } : {}),
      ...(resolved.coverage ? { coverage: resolved.coverage } : {}),
      ...(focus ? { focus } : {}),
    },
    resolved,
  };
}

function toToolPlate(applied: HostInterpretation, host: unknown): ToolPlate {
  return {
    ...(applied.displayed.ref ? { ref: applied.displayed.ref } : {}),
    ...(applied.displayed.coverage ? { coverage: applied.displayed.coverage } : {}),
    ...(applied.displayed.focus ? { focus: applied.displayed.focus } : {}),
    status: applied.resolved.status,
    requestGeneration: applied.resolved.generation,
    ...(applied.resolved.requested ? { requested: asPlateRef(applied.resolved.requested) } : {}),
    ...(applied.resolved.candidates ? { candidates: applied.resolved.candidates } : {}),
    ...(applied.resolved.title ? { title: applied.resolved.title } : {}),
    ...(applied.resolved.query ? { query: applied.resolved.query } : {}),
    hostCapabilities: readHostCapabilities(host),
  };
}

export function useToolPlate(): ToolPlate {
  const snapshotRef = useRef<HostInterpretation>({
    displayed: {},
    resolved: IDLE_RESOLVED,
  });
  const [plate, setPlate] = useState<ToolPlate>(() => {
    const applied = applyHostOutput(snapshotRef.current);
    snapshotRef.current = applied;
    const host = typeof window !== "undefined" ? window.openai : undefined;
    return toToolPlate(applied, host);
  });

  useEffect(() => {
    const update = () => {
      const applied = applyHostOutput(snapshotRef.current);
      snapshotRef.current = applied;
      setPlate(toToolPlate(applied, window.openai));
    };
    for (const type of GLOBALS_EVENTS) {
      window.addEventListener(type, update, { passive: true });
    }
    const timer = window.setTimeout(update, 0);
    return () => {
      window.clearTimeout(timer);
      for (const type of GLOBALS_EVENTS) window.removeEventListener(type, update);
    };
  }, []);

  return plate;
}

/** Test helper: apply one host payload the same way the hook does. */
export function interpretToolPlate(previous: HostInterpretation = { displayed: {}, resolved: IDLE_RESOLVED }): HostInterpretation {
  return applyHostOutput(previous);
}
