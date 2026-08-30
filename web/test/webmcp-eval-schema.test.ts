import assert from "node:assert/strict";
import test from "node:test";

import { AtlasMapController } from "../src/atlas/AtlasMapController";
import { createAtlasWebMcpEvalSchema } from "../src/atlas/webmcpEvalSchema";
import { ATLAS_WEBMCP_TOOL_NAMES, createAtlasWebMcpTools } from "../src/atlas/webmcpTools";

test("eval schema is projected from the real exact-five descriptors", () => {
  const controller = new AtlasMapController();
  const runtimeTools = createAtlasWebMcpTools(controller);
  const schema = createAtlasWebMcpEvalSchema(controller);

  assert.deepEqual(schema.tools.map((tool) => tool.name), ATLAS_WEBMCP_TOOL_NAMES);
  assert.deepEqual(
    schema.tools,
    runtimeTools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  );
  assert.equal(JSON.stringify(schema).includes("execute"), false);
  assert.equal(JSON.stringify(schema).includes("annotations"), false);
});
