/// <reference types="webmcp-types" />

import type {
  AddMapNoteResult,
  AtlasMapController,
  AtlasPlaceCandidate,
  CreateMapTrailResult,
  OpenPlaceResult,
  PlaceSearchResult,
} from "./AtlasMapController";

export const ATLAS_WEBMCP_TOOL_NAMES = [
  "get_map_state",
  "search_places",
  "open_place",
  "add_map_note",
  "create_map_trail",
] as const;

const QUERY_PROPERTY = {
  type: "string",
  minLength: 1,
  maxLength: 120,
  description: "A U.S. place, county, or place plus state, such as Riverside, CA.",
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

function clip(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

async function runTool<T>(controller: AtlasMapController, name: string, runningSummary: string, work: () => Promise<T> | T, completedSummary: (result: T) => string): Promise<T> {
  controller.recordToolActivity(name, "running", runningSummary);
  try {
    const result = await work();
    controller.recordToolActivity(name, "completed", completedSummary(result));
    return result;
  } catch (error) {
    controller.recordToolActivity(name, "failed", "The tool stopped before completing.");
    throw error;
  }
}

function compactCandidates(candidates: AtlasPlaceCandidate[]): AtlasPlaceCandidate[] {
  const compact: AtlasPlaceCandidate[] = [];
  for (const candidate of candidates) {
    const next = [...compact, candidate];
    if (JSON.stringify(next).length > 950) break;
    compact.push(candidate);
  }
  return compact;
}

function compactResolution<T extends OpenPlaceResult | AddMapNoteResult>(result: T): T {
  if (result.ok || !("candidates" in result.error)) return result;
  return { ...result, error: { ...result.error, candidates: compactCandidates(result.error.candidates) } } as T;
}

function compactOpenPlace(result: OpenPlaceResult) {
  const compact = compactResolution(result);
  if (!compact.ok) return { ...compact, mapChanged: false };
  return {
    ...compact,
    mapChanged: true,
    visible: true,
    view: { level: "county", name: clip(compact.place.countyName, 50), state: compact.place.state },
  };
}

function compactMapNote(result: AddMapNoteResult) {
  const compact = compactResolution(result);
  if (!compact.ok) return { ...compact, mapChanged: false, noteAdded: false };
  return {
    ...compact,
    mapChanged: true,
    noteAdded: true,
    visible: true,
    view: { level: "county", name: clip(compact.note.place.countyName, 50), state: compact.note.place.state },
  };
}

function compactSearch(result: PlaceSearchResult): PlaceSearchResult {
  return { ...result, candidates: compactCandidates(result.candidates) };
}

function compactTrail(result: CreateMapTrailResult) {
  if (!result.ok) {
    return {
      ...result,
      mapChanged: false,
      trailChanged: false,
      ...(typeof result.error.stopIndex === "number" ? { stopNumber: result.error.stopIndex + 1 } : {}),
      error: { ...result.error, ...(result.error.candidates ? { candidates: compactCandidates(result.error.candidates) } : {}) },
    };
  }
  return {
    ok: true,
    revision: result.revision,
    mapChanged: true,
    trailChanged: true,
    visible: true,
    view: { level: "nation", overlay: "research_trail" },
    title: result.trail.title,
    stopCount: result.trail.stops.length,
    stops: result.trail.stops.map((stop) => ({ name: stop.place.name, state: stop.place.state })),
  };
}

export function createAtlasWebMcpTools(controller: AtlasMapController): WebMCP.ModelContextTool[] {
  return [
    {
      name: "get_map_state",
      title: "What's on the Atlas map",
      description: "Read what the person can currently see on the live Atlas map: location, selected place, recent session notes, and active research trail. Use this for questions such as 'what am I looking at?' and after the person changes the map manually. The map stays unchanged.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => runTool(controller, "get_map_state", "Reading the live map.", () => {
        const snapshot = controller.getSnapshot();
        return {
          ok: true,
          revision: snapshot.revision,
          visibleRevision: snapshot.visibleRevision,
          current: snapshot.current.level === "county"
            ? { level: "county", countySlug: clip(snapshot.current.countySlug, 80), name: snapshot.current.name ? clip(snapshot.current.name, 50) : undefined, state: snapshot.current.state }
            : snapshot.current,
          selectedPlace: snapshot.selectedPlace ? {
            name: clip(snapshot.selectedPlace.name, 40),
            countyName: clip(snapshot.selectedPlace.countyName, 40),
            state: snapshot.selectedPlace.state,
            kind: snapshot.selectedPlace.kind,
          } : null,
          noteCount: snapshot.notes.length,
          recentNotes: snapshot.notes.slice(-2).map((note) => ({
            id: note.id,
            place: clip(note.place.name, 40),
            state: note.place.state,
            body: clip(note.body, 80),
          })),
          trail: snapshot.trail ? {
            title: snapshot.trail.title,
            activeIndex: snapshot.trail.activeIndex,
            stops: snapshot.trail.stops.map((stop) => ({ name: clip(stop.place.name, 35), state: stop.place.state, prompt: clip(stop.prompt, 40) })),
          } : null,
        };
      }, () => "Read the current map state."),
    },
    {
      name: "search_places",
      title: "Find U.S. places",
      description: "Find matching U.S. places and counties in Atlas's Census-backed index without changing the map. Use this to compare candidates before a write when a name may refer to several places, such as Springfield without a state.",
      inputSchema: { type: "object", additionalProperties: false, properties: { query: QUERY_PROPERTY }, required: ["query"] },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input, context) => runTool(controller, "search_places", "Searching the Census place index.", async () => {
        const query = readBoundedString(input, "query", 120);
        if (!query) return invalidInput("query must contain 1 to 120 characters");
        return compactSearch(await controller.searchPlaces(query, context?.signal));
      }, (result) => result.ok ? `Found ${"candidates" in result ? result.candidates.length : 0} place candidates.` : "Search input was invalid."),
    },
    {
      name: "open_place",
      title: "Show a place on Atlas",
      description: "Show one specific U.S. place or county on the visible Atlas map. Use this when the intended location is clear, such as a county with its state or a candidate chosen from search. Success is returned after the county view is visible; an ambiguous name returns candidates and leaves the map unchanged.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { place: { ...QUERY_PROPERTY, description: "The U.S. place or county to open, preferably including its state." } },
        required: ["place"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input, context) => runTool(controller, "open_place", "Resolving and opening a place.", async () => {
        const place = readBoundedString(input, "place", 120);
        if (!place) return { ...invalidInput("place must contain 1 to 120 characters"), mapChanged: false };
        return compactOpenPlace(await controller.openPlace({ place }, context?.signal));
      }, (result) => result.ok && "place" in result ? `Opened ${result.place.name}.` : "The place needs clarification."),
    },
    {
      name: "add_map_note",
      title: "Add a place note",
      description: "Attach one observation or research reminder to one U.S. place in the shared Atlas session. Atlas resolves and opens the place, then shows the editable note on the map. Success is returned after both are visible; the note remains session-only.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          place: QUERY_PROPERTY,
          body: { type: "string", minLength: 1, maxLength: 240, description: "A session-only research note." },
        },
        required: ["place", "body"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input, context) => runTool(controller, "add_map_note", "Resolving the note location.", async () => {
        const place = readBoundedString(input, "place", 120);
        const body = readBoundedString(input, "body", 240);
        if (!place || !body) return { ...invalidInput("place must be 1 to 120 characters and body must be 1 to 240 characters"), mapChanged: false, noteAdded: false };
        return compactMapNote(await controller.addMapNote({ place, body }, context?.signal));
      }, (result) => result.ok && "note" in result ? `Added a note at ${result.note.place.name}.` : "The note was not added."),
    },
    {
      name: "create_map_trail",
      title: "Build a research trail",
      description: "Build one ordered two-to-five-place investigation on Atlas. Use this for a multi-place route with one research prompt per stop. Atlas resolves every stop before one atomic change, then shows the complete editable numbered trail on the national map; if any stop needs clarification, the prior map and trail stay unchanged.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", minLength: 1, maxLength: 60, description: "A short investigation title." },
          stops: {
            type: "array",
            minItems: 2,
            maxItems: 5,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                place: QUERY_PROPERTY,
                prompt: { type: "string", minLength: 1, maxLength: 100, description: "What to investigate at this stop." },
              },
              required: ["place", "prompt"],
            },
          },
        },
        required: ["title", "stops"],
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input, context) => runTool(controller, "create_map_trail", "Resolving every trail stop.", async () => {
        const title = readBoundedString(input, "title", 60);
        const stops = input.stops;
        if (!title || !Array.isArray(stops) || stops.length < 2 || stops.length > 5) {
          return { ...invalidInput("title must be 1 to 60 characters and stops must contain 2 to 5 items"), mapChanged: false, trailChanged: false };
        }
        const parsedStops = stops.map((stop) => {
          if (typeof stop !== "object" || stop === null || Array.isArray(stop)) return undefined;
          const record = stop as Record<string, unknown>;
          const place = readBoundedString(record, "place", 120);
          const prompt = readBoundedString(record, "prompt", 100);
          return place && prompt ? { place, prompt } : undefined;
        });
        if (parsedStops.some((stop) => !stop)) {
          return { ...invalidInput("each stop needs a valid place and prompt"), mapChanged: false, trailChanged: false };
        }
        return compactTrail(await controller.createMapTrail({ title, stops: parsedStops as Array<{ place: string; prompt: string }> }, context?.signal));
      }, (result) => result.ok ? `Created a ${"stopCount" in result ? result.stopCount : 0}-stop trail.` : "The trail was not created."),
    },
  ];
}
