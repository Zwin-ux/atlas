import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const mcpUrl = new URL(process.env.ATLAS_MCP_URL ?? "http://127.0.0.1:8787/mcp");
const expectedTools = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
];
const lookupRadiusMeters = Number(process.env.ATLAS_VERIFY_RADIUS_METERS ?? 3000 + (Date.now() % 900));

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

  const lookupTool = tools.find((tool) => tool.name === "lookup_world_places");
  assert(lookupTool?.annotations?.openWorldHint === true, "lookup_world_places must be marked openWorldHint=true.");

  const selectCountyResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "riverside-ca" },
  });
  const selectedCounty = getStructuredContent(selectCountyResult, "select_county");
  assert(selectedCounty.type === "voxelSceneSummary", "select_county returned the wrong structured type.");
  assert(selectedCounty.selectedNodeId === "eastvale", "select_county must highlight Eastvale.");
  assert(selectCountyResult._meta?.scene?.world?.places?.length > 0, "select_county must return full scene in _meta.scene.");
  assert(
    selectCountyResult._meta?.scene?.nodes?.some((node) => node.id === "eastvale"),
    "select_county compiled scene must include the curated Eastvale node.",
  );

  const countyQuestion = getStructuredContent(
    await client.callTool({
      name: "ask_county_question",
      arguments: {
        countySlug: "riverside-ca",
        question: "Which curated signals support mobile detailing in Eastvale?",
        businessType: "mobile detailing",
      },
    }),
    "ask_county_question",
  );
  assert(countyQuestion.type === "countyQuestionAnswer", "ask_county_question returned the wrong structured type.");
  assert(countyQuestion.supported === true, "Supported county question should be marked supported.");
  assert(countyQuestion.topic === "business_signals", "Supported mobile detailing question should use business_signals topic.");
  assert(
    /Residential Demand|QR Flyer Opportunity|Partnership Target/i.test(countyQuestion.answer),
    "ask_county_question did not cite expected curated mobile detailing signals.",
  );
  assert(
    countyQuestion.limitations.some((limitation) => /curated|Alpha|live market/i.test(limitation)),
    "ask_county_question must expose curated Alpha limitations.",
  );

  const unsupportedCountyQuestion = getStructuredContent(
    await client.callTool({
      name: "ask_county_question",
      arguments: {
        countySlug: "orange-ca",
        question: "Will roofing work in Orange County?",
        businessType: "roofing",
      },
    }),
    "ask_county_question unsupported",
  );
  assert(unsupportedCountyQuestion.type === "countyQuestionAnswer", "Unsupported county question returned wrong type.");
  assert(unsupportedCountyQuestion.supported === false, "Unsupported county/business question should be refused.");
  assert(
    /Riverside County|Supported score lanes|unsupported/i.test(unsupportedCountyQuestion.answer),
    "Unsupported county/business answer should narrow scope clearly.",
  );

  const countyResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "riverside-ca", selectedNodeId: "eastvale" },
  });
  const county = getStructuredContent(countyResult, "render_voxel_county");
  assert(county.type === "voxelSceneSummary", "render_voxel_county returned the wrong structured type.");
  assert(county.selectedNodeId === "eastvale", "render_voxel_county did not preserve selectedNodeId.");
  assert(countyResult._meta?.scene?.world?.places?.length > 0, "render_voxel_county must return full scene in _meta.scene.");

  const lookup = getStructuredContent(
    await client.callTool({
      name: "lookup_world_places",
      arguments: { query: "Eastvale, CA", radiusMeters: lookupRadiusMeters },
    }),
    "lookup_world_places",
  );
  assert(lookup.type === "worldPlaceLookup", "lookup_world_places returned the wrong structured type.");
  assert(Array.isArray(lookup.places) && lookup.places.length > 0, "lookup_world_places returned no places.");
  assert(
    lookup.places.every((place) => place.category && Array.isArray(place.sourceNotes)),
    "lookup_world_places must return normalized categories and source notes.",
  );
  assert(
    lookup.places.every((place) => !("primaryType" in place) && !("types" in place) && !("placeId" in place)),
    "lookup_world_places leaked raw provider fields.",
  );
  assert(lookup.runtime?.cacheHit === false, "First lookup_world_places call should miss the cache.");
  assert(lookup.runtime?.cachedAt && lookup.runtime?.expiresAt, "lookup_world_places must return cache runtime metadata.");

  const cachedLookup = getStructuredContent(
    await client.callTool({
      name: "lookup_world_places",
      arguments: { query: "Eastvale, CA", radiusMeters: lookupRadiusMeters },
    }),
    "lookup_world_places cached",
  );
  assert(cachedLookup.runtime?.cacheHit === true, "Second lookup_world_places call should hit the cache.");
  assert(cachedLookup.cache?.key === lookup.cache?.key, "Cached lookup should preserve the cache key.");

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
  assert(
    Array.isArray(scout.limitations) && scout.limitations.some((limitation) => /temporary|Alpha|manual/i.test(limitation)),
    "preview_scout_drop must keep temporary Alpha limitations visible.",
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
  assert(
    campaign.guardrails.some((guardrail) => /no DMs|no ad spend|manual/i.test(guardrail)),
    "Campaign preview must keep no-DM/no-ad/manual boundaries visible.",
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
        lookupPlaceCount: lookup.places.length,
        cachedLookup: cachedLookup.runtime.cacheHit,
        selectedCountySceneId: selectedCounty.sceneId,
        countyQuestionTopic: countyQuestion.topic,
        unsupportedCountyQuestion: unsupportedCountyQuestion.supported,
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
