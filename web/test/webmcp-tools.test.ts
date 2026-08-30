/// <reference types="webmcp-types" />

import assert from "node:assert/strict";
import test from "node:test";

import { AtlasMapController } from "../src/atlas/AtlasMapController";
import { ATLAS_CORE_WEBMCP_TOOL_NAMES, createAtlasCoreWebMcpTools } from "../src/atlas/webmcpTools";

function tool(name: string, controller = new AtlasMapController()): WebMCP.ModelContextTool {
  const found = createAtlasCoreWebMcpTools(controller).find((candidate) => candidate.name === name);
  assert.ok(found, `missing ${name}`);
  return found;
}

test("core descriptors have the exact names, narrow schemas, and annotation cut", () => {
  const tools = createAtlasCoreWebMcpTools(new AtlasMapController());
  assert.deepEqual(tools.map((candidate) => candidate.name), [...ATLAS_CORE_WEBMCP_TOOL_NAMES]);
  assert.deepEqual(tools.map((candidate) => candidate.annotations), [
    { readOnlyHint: true, untrustedContentHint: true },
    { readOnlyHint: true, untrustedContentHint: false },
    { readOnlyHint: false, untrustedContentHint: false },
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
      countySlug: "riverside-ca",
      countyName: "Riverside County",
      state: "ca",
      kind: "county",
    },
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

test("open_place returns structured validation errors before mutation", async () => {
  const controller = new AtlasMapController();
  const before = controller.getSnapshot();
  const result = await tool("open_place", controller).execute({ place: "   " }, { signal: new AbortController().signal });

  assert.deepEqual(result, {
    ok: false,
    error: { code: "INVALID_INPUT", message: "place must contain 1 to 120 characters" },
  });
  assert.equal(controller.getSnapshot(), before);
});
