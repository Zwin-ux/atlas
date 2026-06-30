import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const mcpUrl = new URL(process.env.ATLAS_MCP_URL ?? "http://127.0.0.1:8787/mcp");
const expectedTools = [
  "get_upgrade_options",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getStructuredContent(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object.`);
  assert(!result.isError, `${toolName} returned an MCP error result.`);
  const structuredContent = result.structuredContent;
  assert(
    structuredContent && typeof structuredContent === "object",
    `${toolName} returned no structuredContent.`,
  );
  return structuredContent;
}

const client = new Client({
  name: "atlas-mcp-flow-verifier",
  version: "0.1.0",
});

const transport = new StreamableHTTPClientTransport(mcpUrl);

try {
  await client.connect(transport);

  const toolList = await client.listTools();
  const tools = toolList.tools ?? [];
  const actualTools = tools.map((tool) => tool.name).sort();

  assert(
    JSON.stringify(actualTools) === JSON.stringify(expectedTools),
    `Unexpected MCP tools. Expected ${expectedTools.join(", ")}; got ${actualTools.join(", ")}.`,
  );

  for (const tool of tools) {
    assert(tool.outputSchema, `${tool.name} is missing outputSchema.`);
    assert(tool.annotations, `${tool.name} is missing annotations.`);
    assert(typeof tool.annotations.readOnlyHint === "boolean", `${tool.name} missing readOnlyHint.`);
    assert(typeof tool.annotations.openWorldHint === "boolean", `${tool.name} missing openWorldHint.`);
    assert(typeof tool.annotations.destructiveHint === "boolean", `${tool.name} missing destructiveHint.`);
  }

  const county = getStructuredContent(
    await client.callTool({
      name: "render_voxel_county",
      arguments: { countySlug: "riverside-ca", selectedNodeId: "eastvale" },
    }),
    "render_voxel_county",
  );
  assert(county.type === "voxelSceneSummary", "render_voxel_county returned the wrong structured type.");
  assert(county.selectedNodeId === "eastvale", "render_voxel_county did not preserve selectedNodeId.");

  const scout = getStructuredContent(
    await client.callTool({
      name: "preview_scout_drop",
      arguments: {
        countySlug: "riverside-ca",
        locationLabel: "Eastvale",
        businessType: "mobile detailing",
        goal: "Find the strongest first drop for a local mobile detailing offer.",
      },
    }),
    "preview_scout_drop",
  );
  assert(scout.type === "scoutPreview", "preview_scout_drop returned the wrong structured type.");
  assert(typeof scout.id === "string" && scout.id.length > 0, "preview_scout_drop returned no id.");
  assert(
    Array.isArray(scout.signals) && scout.signals.some((signal) => signal.label === "Residential Demand"),
    "preview_scout_drop did not return the expected Eastvale signal.",
  );

  const campaign = getStructuredContent(
    await client.callTool({
      name: "preview_campaign_engine",
      arguments: {
        scoutPreviewId: scout.id,
        countySlug: scout.countySlug,
        locationLabel: "Eastvale",
        businessType: scout.businessType,
        goal: scout.goal,
      },
    }),
    "preview_campaign_engine",
  );
  assert(campaign.type === "campaignPreview", "preview_campaign_engine returned the wrong structured type.");
  assert(campaign.scoutPreviewId === scout.id, "Campaign preview did not preserve scoutPreviewId.");
  assert(Array.isArray(campaign.days) && campaign.days.length === 7, "Campaign preview must return 7 days.");
  assert(
    Array.isArray(campaign.guardrails) &&
      campaign.guardrails.some((guardrail) => guardrail.includes("no posts")),
    "Campaign preview did not return manual-action guardrails.",
  );

  const upgrade = getStructuredContent(
    await client.callTool({
      name: "get_upgrade_options",
      arguments: { trigger: "save_campaign" },
    }),
    "get_upgrade_options",
  );
  assert(upgrade.type === "upgradeOptions", "get_upgrade_options returned the wrong structured type.");
  assert(upgrade.hosted?.status === "planned_beta", "Hosted Clawd status must be planned_beta in Alpha.");
  assert(
    Array.isArray(upgrade.unavailableActions) &&
      upgrade.unavailableActions.some((item) => item.includes("Stripe checkout")),
    "Upgrade options must clearly say checkout is unavailable in Alpha.",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        mcpUrl: mcpUrl.toString(),
        tools: actualTools,
        scoutPreviewId: scout.id,
        campaignPreviewId: campaign.id,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
