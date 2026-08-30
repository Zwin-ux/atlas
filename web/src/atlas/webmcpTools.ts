/// <reference types="webmcp-types" />

import type { AtlasMapController } from "./AtlasMapController";

export const ATLAS_CORE_WEBMCP_TOOL_NAMES = ["get_map_state", "search_places", "open_place"] as const;

const QUERY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: {
      type: "string",
      minLength: 1,
      maxLength: 120,
      description: "A U.S. place, county, or place plus state, such as Riverside, CA.",
    },
  },
  required: ["query"],
} as const;

function readBoundedString(input: Record<string, unknown>, key: string, maxLength: number): string | undefined {
  const value = input[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : undefined;
}

function invalidInput(message: string) {
  return { ok: false, error: { code: "INVALID_INPUT", message } };
}

export function createAtlasCoreWebMcpTools(controller: AtlasMapController): WebMCP.ModelContextTool[] {
  return [
    {
      name: "get_map_state",
      title: "Read Atlas map state",
      description: "Read the location and visible selection on the live Atlas map. This does not change the map.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => {
        const snapshot = controller.getSnapshot();
        return {
          ok: true,
          revision: snapshot.revision,
          visibleRevision: snapshot.visibleRevision,
          current: snapshot.current,
          selectedPlace: snapshot.selectedPlace ?? null,
        };
      },
    },
    {
      name: "search_places",
      title: "Search Atlas places",
      description: "Search the Census-backed Atlas index for U.S. places and counties. This does not change the map.",
      inputSchema: QUERY_SCHEMA,
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async (input, { signal }) => {
        const query = readBoundedString(input, "query", 120);
        if (!query) return invalidInput("query must contain 1 to 120 characters");
        return controller.searchPlaces(query, signal);
      },
    },
    {
      name: "open_place",
      title: "Open a place on Atlas",
      description: "Resolve one U.S. place or county and open it on the visible Atlas map. Ambiguous names return candidates without changing the map.",
      inputSchema: {
        ...QUERY_SCHEMA,
        properties: {
          place: {
            type: "string",
            minLength: 1,
            maxLength: 120,
            description: "The U.S. place or county to open, preferably including its state.",
          },
        },
        required: ["place"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input, { signal }) => {
        const place = readBoundedString(input, "place", 120);
        if (!place) return invalidInput("place must contain 1 to 120 characters");
        return controller.openPlace({ place }, signal);
      },
    },
  ];
}
