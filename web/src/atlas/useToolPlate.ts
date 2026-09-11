/**
 * Reads the plate reference the MCP tool put in `_meta.atlasPlate`.
 *
 * The host delivers tool output on `window.openai` and republishes it on a
 * globals event when the model calls a tool again. Both paths are handled, and
 * every host API result is treated as possibly-undefined: outside a user
 * gesture the real ChatGPT host returns `undefined` where the emulator
 * returned a Promise, which crashed the widget at mount once already
 * (finding G8-3).
 */

import { useEffect, useState } from "react";

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
};

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

function readPlateRef(meta: ToolPayload | undefined): PlateRef | undefined {
  const plate = meta?.atlasPlate;
  if (!plate?.level) return undefined;
  if (plate.level === "nation") return { level: "nation" };
  if (plate.level === "state" && plate.state) return { level: "state", state: plate.state.toLowerCase() };
  if (plate.level === "county" && plate.countySlug) {
    return {
      level: "county",
      countySlug: plate.countySlug,
      ...(plate.state ? { state: plate.state.toLowerCase() } : {}),
      ...(plate.name ? { name: plate.name } : {}),
    };
  }
  return undefined;
}

/** ChatGPT sometimes only hydrates structuredContent onto toolOutput, not _meta. */
function readPlateFromStructured(output: unknown): PlateRef | undefined {
  if (!output || typeof output !== "object") return undefined;
  const plate = output as {
    level?: string;
    countySlug?: string;
    state?: string;
    county?: string;
    title?: string;
  };
  return readPlateRef({
    atlasPlate: {
      ...(typeof plate.level === "string" ? { level: plate.level } : {}),
      ...(typeof plate.state === "string" ? { state: plate.state } : {}),
      ...(typeof plate.countySlug === "string" ? { countySlug: plate.countySlug } : {}),
      ...(typeof plate.county === "string"
        ? { name: plate.county }
        : typeof plate.title === "string"
          ? { name: plate.title }
          : {}),
    },
  });
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

/** Preview helpers: /preview?county=miami-dade-fl&focusLon=-80.48&focusLat=25.47&focusName=Homestead */
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

function currentToolPlate(): ToolPlate {
  const host = typeof window !== "undefined" ? window.openai : undefined;
  const meta = (host as { toolResponseMetadata?: ToolPayload; toolOutput?: unknown } | undefined)
    ?.toolResponseMetadata;
  const structured = (host as { toolOutput?: { coverage?: string } } | undefined)?.toolOutput;

  return {
    ref: readPlateRef(meta) ?? readPlateFromStructured(structured) ?? readPreviewRef(),
    coverage: typeof structured?.coverage === "string" ? structured.coverage : undefined,
    focus: readPlateFocus(meta) ?? readPreviewFocus(),
  };
}

export function useToolPlate(): ToolPlate {
  const [plate, setPlate] = useState<ToolPlate>(() => currentToolPlate());

  useEffect(() => {
    const update = () => setPlate(currentToolPlate());
    for (const type of GLOBALS_EVENTS) {
      window.addEventListener(type, update, { passive: true });
    }
    // The host may populate globals a tick after mount.
    const timer = window.setTimeout(update, 0);
    return () => {
      window.clearTimeout(timer);
      for (const type of GLOBALS_EVENTS) window.removeEventListener(type, update);
    };
  }, []);

  return plate;
}
