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
  assert.deepEqual(tools.map((candidate) => candidate.title), [
    "What's on the Atlas map",
    "Find U.S. places",
    "Show a place on Atlas",
    "Add a place note",
    "Build a research trail",
  ]);
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
    mapChanged: false,
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
  assert.match(trail.description, /numbered trail on the national map/);
  assert.doesNotMatch(trail.description, /open its first stop/);
});

test("write results tell ChatGPT what became visible and how failed writes recover", async () => {
  const controller = new AtlasMapController();
  const place = {
    name: "Riverside County",
    countyName: "Riverside County",
    countySlug: "riverside-ca",
    state: "ca",
    kind: "county" as const,
  };

  controller.openPlace = async () => ({ ok: true, place, revision: 1 });
  assert.deepEqual(await tool("open_place", controller).execute({ place: "Riverside County, CA" }, {}), {
    ok: true,
    place,
    revision: 1,
    mapChanged: true,
    visible: true,
    view: { level: "county", name: "Riverside County", state: "ca" },
  });

  controller.addMapNote = async () => ({
    ok: true,
    revision: 2,
    note: { id: "note-1", place, body: "Check public-records access." },
  });
  assert.deepEqual(await tool("add_map_note", controller).execute({
    place: "Riverside County, CA",
    body: "Check public-records access.",
  }, {}), {
    ok: true,
    revision: 2,
    note: { id: "note-1", place, body: "Check public-records access." },
    mapChanged: true,
    noteAdded: true,
    visible: true,
    view: { level: "county", name: "Riverside County", state: "ca" },
  });

  controller.createMapTrail = async () => ({
    ok: false,
    error: {
      code: "AMBIGUOUS_PLACE",
      message: "That name matches several indexed places.",
      stopIndex: 1,
      candidates: [place],
    },
  });
  assert.deepEqual(await tool("create_map_trail", controller).execute({
    title: "County access",
    stops: [
      { place: "Riverside County, CA", prompt: "Check records" },
      { place: "Springfield", prompt: "Check notices" },
    ],
  }, {}), {
    ok: false,
    mapChanged: false,
    trailChanged: false,
    stopNumber: 2,
    error: {
      code: "AMBIGUOUS_PLACE",
      message: "That name matches several indexed places.",
      stopIndex: 1,
      candidates: [place],
    },
  });
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

test("write results stay below the tool output budget with maximum text", async () => {
  const controller = new AtlasMapController();
  const place = {
    name: "N".repeat(120),
    countySlug: "long-county-name-ca",
    countyName: "C".repeat(120),
    state: "ca",
    kind: "place" as const,
  };

  controller.openPlace = async () => ({ ok: true, place, revision: 1 });
  const opened = await tool("open_place", controller).execute({ place: "P".repeat(120) }, {});

  controller.addMapNote = async () => ({
    ok: true,
    revision: 2,
    note: { id: "note-999", place, body: "B".repeat(240) },
  });
  const noted = await tool("add_map_note", controller).execute({ place: "P".repeat(120), body: "B".repeat(240) }, {});

  controller.createMapTrail = async () => ({
    ok: true,
    revision: 3,
    trail: {
      title: "T".repeat(60),
      activeIndex: 0,
      stops: Array.from({ length: 5 }, () => ({ place, prompt: "Q".repeat(100) })),
    },
  });
  const trailed = await tool("create_map_trail", controller).execute({
    title: "T".repeat(60),
    stops: Array.from({ length: 5 }, () => ({ place: "P".repeat(120), prompt: "Q".repeat(100) })),
  }, {});

  controller.createMapTrail = async () => ({
    ok: false,
    error: {
      code: "AMBIGUOUS_PLACE",
      message: "That name matches several indexed places. Choose one candidate.",
      stopIndex: 4,
      candidates: Array.from({ length: 8 }, () => place),
    },
  });
  const failedTrail = await tool("create_map_trail", controller).execute({
    title: "T".repeat(60),
    stops: Array.from({ length: 5 }, () => ({ place: "P".repeat(120), prompt: "Q".repeat(100) })),
  }, {});

  for (const result of [opened, noted, trailed, failedTrail]) {
    assert.ok(JSON.stringify(result).length < 1_500);
  }
});
