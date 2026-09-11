/**
 * Live MCP smoke for the shipping atlas.
 *
 * Recut 2026-08-22. The previous version still called the retired voxel tools
 * (select_county, lookup_world_places, ask_county_question) and would have
 * instructed an agent to restore Google lookup to go green. Tool names come
 * from scripts/lib/atlas-tool-surface.mjs. Deeper listing checks live in
 * scripts/verify-submission.mjs.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { assertToolSurface, EXPECTED_ANNOTATIONS, EXPECTED_TOOLS } from "./lib/atlas-tool-surface.mjs";

const mcpUrl = new URL(process.env.ATLAS_MCP_URL ?? "http://127.0.0.1:8787/mcp");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function structured(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object.`);
  assert(!result.isError, `${toolName} returned an MCP error.`);
  assert(result.structuredContent && typeof result.structuredContent === "object", `${toolName} returned no structuredContent.`);
  return result.structuredContent;
}

const client = new Client({ name: "atlas-mcp-flow-verifier", version: "0.1.0" });
const transport = new StreamableHTTPClientTransport(mcpUrl);

try {
  await client.connect(transport);
  const tools = (await client.listTools()).tools ?? [];
  const actualTools = assertToolSurface(tools.map((tool) => tool.name));

  for (const tool of tools) {
    const expected = EXPECTED_ANNOTATIONS[tool.name];
    assert(tool.outputSchema, `${tool.name} is missing outputSchema.`);
    assert(tool.annotations?.readOnlyHint === expected.readOnlyHint, `${tool.name} readOnlyHint mismatch.`);
    assert(tool.annotations?.openWorldHint === expected.openWorldHint, `${tool.name} openWorldHint mismatch.`);
    assert(tool.annotations?.destructiveHint === expected.destructiveHint, `${tool.name} destructiveHint mismatch.`);
  }

  const county = structured(
    await client.callTool({ name: EXPECTED_TOOLS[0], arguments: { place: "Riverside County, California" } }),
    EXPECTED_TOOLS[0],
  );
  assert(county.status === "opened" && county.countySlug === "riverside-ca", "A named county must open.");

  const search = structured(
    await client.callTool({ name: EXPECTED_TOOLS[1], arguments: { query: "Eastvale, CA" } }),
    EXPECTED_TOOLS[1],
  );
  assert(search.status === "resolved" && search.resolved?.county === "Riverside County", "A state-qualified town must resolve.");

  const ambiguous = structured(
    await client.callTool({ name: EXPECTED_TOOLS[0], arguments: { place: "Springfield" } }),
    `${EXPECTED_TOOLS[0]} ambiguous`,
  );
  assert(ambiguous.status === "ambiguous", "A shared name must not pick a county.");

  console.log(JSON.stringify({ ok: true, mcpUrl: mcpUrl.toString(), tools: actualTools, opened: county.countySlug, search: search.resolved?.name }, null, 2));
} finally {
  await client.close();
}
