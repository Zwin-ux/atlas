/// <reference types="webmcp-types" />

import assert from "node:assert/strict";
import test from "node:test";

import { AtlasMapController } from "../src/atlas/AtlasMapController";
import { ATLAS_WEBMCP_TOOL_NAMES, createAtlasWebMcpTools } from "../src/atlas/webmcpTools";

function tool(name: string, controller = new AtlasMapController()): WebMCP.ModelContextTool {
  const found = createAtlasWebMcpTools(controller).find((candidate) => candidate.name === name);
  assert.ok(found, `missing ${name}`);
  return found;
}

test("core descriptors have the exact names, narrow schemas, and annotation cut", () => {
  const tools = createAtlasWebMcpTools(new AtlasMapController());
  assert.deepEqual(tools.map((candidate) => candidate.name), [...ATLAS_WEBMCP_TOOL_NAMES]);
  assert.deepEqual(tools.map((candidate) => candidate.annotations), [
    { readOnlyHint: true, untrustedContentHint: true },
    { readOnlyHint: true, untrustedContentHint: false },
    { readOnlyHint: false, untrustedContentHint: false },
    { readOnlyHint: false, untrustedContentHint: true },
    { readOnlyHint: false, untrustedContentHint: true },
  ]);

  for (const candidate of tools) {
    assert.equal((candidate.inputSchema as { additionalProperties?: unknown }).additionalProperties, false);
    assert.equal("outputSchema" in candidate, false);
    assert.equal("_meta" in candidate, false);
  }
});

test("get_map_state reads the controller's current visible state", async () => {
  const controller = new AtlasMapController();
  const transition = controller.openCounty("riverside-ca", "Riverside County", "ca");
  controller.acknowledgeVisible(1);
  await transition;

  const result = await tool("get_map_state", controller).execute({}, { signal: new AbortController().signal });
  assert.deepEqual(result, {
    ok: true,
    revision: 1,
    visibleRevision: 1,
    current: { level: "county", countySlug: "riverside-ca", name: "Riverside County", state: "ca" },
    selectedPlace: {
      name: "Riverside County",
      countyName: "Riverside County",
      state: "ca",
      kind: "county",
    },
    noteCount: 0,
    recentNotes: [],
    trail: null,
  });
});

test("search_places trims valid input and passes the execution signal", async () => {
  const controller = new AtlasMapController();
  const signal = new AbortController().signal;
  let observed: { query?: string; signal?: AbortSignal } = {};
  controller.searchPlaces = async (query, receivedSignal) => {
    observed = { query, ...(receivedSignal ? { signal: receivedSignal } : {}) };
    return { ok: true, query, candidates: [] };
  };

  const result = await tool("search_places", controller).execute({ query: "  Riverside, CA " }, { signal });
  assert.deepEqual(observed, { query: "Riverside, CA", signal });
  assert.deepEqual(result, { ok: true, query: "Riverside, CA", candidates: [] });
});

test("async descriptors tolerate Chrome's one-argument imperative invocation", async () => {
  const controller = new AtlasMapController();
  let observedSignal: AbortSignal | undefined;
  controller.searchPlaces = async (query, signal) => {
    observedSignal = signal;
    return { ok: true, query, candidates: [] };
  };
  const execute = tool("search_places", controller).execute as (input: Record<string, unknown>) => Promise<unknown>;

  assert.deepEqual(await execute({ query: "Riverside County, CA" }), {
    ok: true,
    query: "Riverside County, CA",
    candidates: [],
  });
  assert.equal(observedSignal, undefined);
});

test("open_place returns structured validation errors before mutation", async () => {
  const controller = new AtlasMapController();
  const before = controller.getSnapshot();
  const result = await tool("open_place", controller).execute({ place: "   " }, { signal: new AbortController().signal });

  assert.deepEqual(result, {
    ok: false,
    error: { code: "INVALID_INPUT", message: "place must contain 1 to 120 characters" },
  });
  assert.equal(controller.getSnapshot().revision, before.revision);
  assert.deepEqual(controller.getSnapshot().navigationStack, before.navigationStack);
  assert.deepEqual(controller.getSnapshot().notes, before.notes);
});

test("write descriptors enforce nested schemas and expose untrusted-content annotations", () => {
  const tools = createAtlasWebMcpTools(new AtlasMapController());
  const trail = tools.find((candidate) => candidate.name === "create_map_trail")!;
  const schema = trail.inputSchema as { properties: { stops: { items: { additionalProperties: boolean } } } };
  assert.equal(schema.properties.stops.items.additionalProperties, false);
  assert.deepEqual(trail.annotations, { readOnlyHint: false, untrustedContentHint: true });
  assert.match(trail.description, /numbered stops on the national map/);
  assert.doesNotMatch(trail.description, /open its first stop/);
});

test("get_map_state stays below the tool output budget with maximum session text", async () => {
  const controller = new AtlasMapController();
  const place = { name: "N".repeat(120), countySlug: "long-county-ca", countyName: "C".repeat(120), state: "ca", kind: "place" as const };
  Object.defineProperty(controller, "getSnapshot", { value: () => ({
    revision: 9,
    visibleRevision: 9,
    navigationStack: [{ level: "nation" }],
    current: { level: "county", countySlug: "long-county-ca", name: "C".repeat(120) },
    selectedPlace: place,
    notes: [
      { id: "note-1", place, body: "A".repeat(240) },
      { id: "note-2", place, body: "B".repeat(240) },
    ],
    trail: { title: "T".repeat(60), activeIndex: 0, stops: Array.from({ length: 5 }, () => ({ place, prompt: "P".repeat(100) })) },
    toolStatus: "available",
  }) });

  const result = await tool("get_map_state", controller).execute({}, { signal: new AbortController().signal });
  assert.ok(JSON.stringify(result).length < 1_500);
});
