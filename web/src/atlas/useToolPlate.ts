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
  };
};

export type ToolPlate = {
  ref?: PlateRef | undefined;
  coverage?: string | undefined;
};

function readPlateRef(meta: ToolPayload | undefined): PlateRef | undefined {
  const plate = meta?.atlasPlate;
  if (!plate?.level) return undefined;
  if (plate.level === "nation") return { level: "nation" };
  if (plate.level === "state" && plate.state) return { level: "state", state: plate.state };
  if (plate.level === "county" && plate.countySlug) {
    return {
      level: "county",
      countySlug: plate.countySlug,
      ...(plate.state ? { state: plate.state } : {}),
      ...(plate.name ? { name: plate.name } : {}),
    };
  }
  return undefined;
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

function currentToolPlate(): ToolPlate {
  const host = typeof window !== "undefined" ? window.openai : undefined;
  const meta = (host as { toolResponseMetadata?: ToolPayload; toolOutput?: unknown } | undefined)
    ?.toolResponseMetadata;
  const structured = (host as { toolOutput?: { coverage?: string } } | undefined)?.toolOutput;

  return {
    ref: readPlateRef(meta) ?? readPreviewRef(),
    coverage: typeof structured?.coverage === "string" ? structured.coverage : undefined,
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
