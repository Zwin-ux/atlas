/**
 * Reads the plate the MCP tool published on the host, through the AT-007 view
 * contract. Status is checked before any plate reference. A refusal never
 * replaces the last opened map.
 */

import { useEffect, useRef, useState } from "react";

import {
  fingerprintMapView,
  nextRequestGeneration,
  parseAtlasMapView,
  parseAtlasPlateRef,
  plateFromMapView,
  readHostCapabilities,
  retainDisplayedPlate,
  type AtlasHostCapabilities,
  type AtlasPublicPlace,
  type AtlasViewStatus,
} from "../../../packages/core/src/atlas/viewContract.js";

import type { PlateRef } from "./AtlasApp";

const GLOBALS_EVENTS = ["openai:set_globals", "globals-change", "openai:tool_response"] as const;

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
  status: AtlasViewStatus;
  requestGeneration: number;
  requested?: PlateRef | undefined;
  candidates?: readonly AtlasPublicPlace[] | undefined;
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

function applyHostOutput(
  previous: Displayed,
  generation: number,
  lastFingerprint: string,
): { displayed: Displayed; generation: number; fingerprint: string; status: AtlasViewStatus; requested?: PlateRef | undefined; candidates?: readonly AtlasPublicPlace[] | undefined } {
  const host = typeof window !== "undefined" ? window.openai : undefined;
  const meta = (host as { toolResponseMetadata?: ToolPayload; toolOutput?: unknown } | undefined)
    ?.toolResponseMetadata;
  const structured = (host as { toolOutput?: unknown } | undefined)?.toolOutput;
  const parsed = parseAtlasMapView(structured);
  const preview = readPreviewRef();
  const previewFocus = readPreviewFocus();

  if (parsed) {
    const fingerprint = fingerprintMapView(parsed);
    const generationNext = fingerprint === lastFingerprint ? generation : nextRequestGeneration(generation);
    if (parsed.status === "opened") {
      const plate = asPlateRef(plateFromMapView(parsed));
      return {
        displayed: {
          ref: plate,
          coverage: parsed.coverage,
          focus: readPlateFocus(meta) ?? previewFocus,
        },
        generation: generationNext,
        fingerprint,
        status: "opened",
        requested: plate,
      };
    }
    return {
      displayed: {
        ...previous,
        ref: asPlateRef(retainDisplayedPlate(previous.ref, parsed)),
      },
      generation: generationNext,
      fingerprint,
      status: parsed.status,
      candidates: parsed.candidates,
    };
  }

  const legacyPlate = asPlateRef(parseAtlasPlateRef(meta?.atlasPlate));
  if (legacyPlate) {
    const fingerprint = `legacy:${legacyPlate.level}:${"countySlug" in legacyPlate ? legacyPlate.countySlug : "state" in legacyPlate ? legacyPlate.state : "nation"}`;
    const generationNext = fingerprint === lastFingerprint ? generation : nextRequestGeneration(generation);
    return {
      displayed: {
        ref: legacyPlate,
        coverage: typeof structured === "object" && structured && "coverage" in structured && typeof structured.coverage === "string"
          ? structured.coverage
          : undefined,
        focus: readPlateFocus(meta) ?? previewFocus,
      },
      generation: generationNext,
      fingerprint,
      status: "opened",
      requested: legacyPlate,
    };
  }

  if (preview) {
    return {
      displayed: { ref: preview, focus: previewFocus },
      generation,
      fingerprint: lastFingerprint,
      status: "opened",
      requested: preview,
    };
  }

  return {
    displayed: previous,
    generation,
    fingerprint: lastFingerprint,
    status: "opened",
    requested: previous.ref,
  };
}

export function useToolPlate(): ToolPlate {
  const displayedRef = useRef<Displayed>({});
  const generationRef = useRef(0);
  const fingerprintRef = useRef("");
  const [plate, setPlate] = useState<ToolPlate>(() => {
    const applied = applyHostOutput({}, 0, "");
    displayedRef.current = applied.displayed;
    generationRef.current = applied.generation;
    fingerprintRef.current = applied.fingerprint;
    const host = typeof window !== "undefined" ? window.openai : undefined;
    return {
      ref: applied.displayed.ref,
      coverage: applied.displayed.coverage,
      focus: applied.displayed.focus,
      status: applied.status,
      requestGeneration: applied.generation,
      requested: applied.requested,
      candidates: applied.candidates,
      hostCapabilities: readHostCapabilities(host),
    };
  });

  useEffect(() => {
    const update = () => {
      const applied = applyHostOutput(displayedRef.current, generationRef.current, fingerprintRef.current);
      displayedRef.current = applied.displayed;
      generationRef.current = applied.generation;
      fingerprintRef.current = applied.fingerprint;
      const host = window.openai;
      setPlate({
        ref: applied.displayed.ref,
        coverage: applied.displayed.coverage,
        focus: applied.displayed.focus,
        status: applied.status,
        requestGeneration: applied.generation,
        requested: applied.requested,
        candidates: applied.candidates,
        hostCapabilities: readHostCapabilities(host),
      });
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
export function interpretToolPlate(
  previous: Displayed,
  generation: number,
  lastFingerprint: string,
): ReturnType<typeof applyHostOutput> {
  return applyHostOutput(previous, generation, lastFingerprint);
}
