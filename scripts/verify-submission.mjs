import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const submissionPath = new URL("../chatgpt-app-submission.json", import.meta.url);
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

function parseSubmission() {
  const submission = JSON.parse(readFileSync(submissionPath, "utf8"));
  assert(submission.schema_version === 1, "Submission schema_version must be 1.");
  assert(submission.app_info?.display_name === "Atlas", "Submission display_name must be Atlas.");
  const subtitle = submission.app_info?.subtitle ?? "";
  const description = submission.app_info?.description ?? "";
  assert(
    typeof subtitle === "string" &&
      /Riverside\/Eastvale/i.test(subtitle) &&
      /generated county districts/i.test(subtitle) &&
      !/your county/i.test(subtitle),
    "Submission subtitle must name Riverside/Eastvale and generated county districts without a your-county promise.",
  );
  assert(
    typeof description === "string" &&
      description.includes("playable voxel town map") &&
      description.includes("generated district previews") &&
      description.includes("Things live in this chat") &&
      description.includes("does not save state") &&
      !/your county|waitlist/i.test(description),
    "Submission description must explain playable Riverside, generated districts, chat-only state, and V1 limits.",
  );

  const submissionTools = Object.keys(submission.tools ?? {}).sort();
  assert(
    JSON.stringify(submissionTools) === JSON.stringify(expectedTools),
    `Submission tools mismatch. Expected ${expectedTools.join(", ")}; got ${submissionTools.join(", ")}.`,
  );

  for (const toolName of expectedTools) {
    const tool = submission.tools[toolName];
    assert(tool?.annotations, `${toolName} is missing submission annotations.`);
    assert(tool.annotations.readOnlyHint === true, `${toolName} must be read-only.`);
    assert(tool.annotations.destructiveHint === false, `${toolName} must be non-destructive.`);
    const expectedOpenWorld = toolName === "lookup_world_places";
    assert(tool.annotations.openWorldHint === expectedOpenWorld, `${toolName} has the wrong openWorldHint.`);
    assert(tool.justifications?.read_only_justification, `${toolName} is missing read-only justification.`);
    assert(tool.justifications?.open_world_justification, `${toolName} is missing open-world justification.`);
    assert(tool.justifications?.destructive_justification, `${toolName} is missing destructive justification.`);
  }

  const negativePrompts = (submission.negative_test_cases ?? []).map((test) => `${test.user_prompt} ${test.expected_output}`);
  assert(negativePrompts.some((text) => /DMs|messaging|spam/i.test(text)), "Submission needs a messaging/spam negative case.");
  assert(negativePrompts.some((text) => /checkout|card|payment/i.test(text)), "Submission needs a payment negative case.");
  assert(
    negativePrompts.some((text) => /Google|scraping|saving|mass outreach/i.test(text)),
    "Submission needs a live lookup boundary negative case.",
  );

  return submission;
}

function structuredContent(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object.`);
  assert(!result.isError, `${toolName} returned an MCP error.`);
  assert(result.structuredContent && typeof result.structuredContent === "object", `${toolName} returned no structuredContent.`);
  return result.structuredContent;
}

function textContent(result) {
  return (result.content ?? [])
    .map((item) => (typeof item.text === "string" ? item.text : ""))
    .filter(Boolean)
    .join("\n");
}

function assertScenePacketMeta(result, expectedReadiness, toolName) {
  const scenePacket = result?._meta?.scenePacket;
  assert(scenePacket && typeof scenePacket === "object", `${toolName} must return safe _meta.scenePacket metadata.`);
  assert(scenePacket.readiness === expectedReadiness, `${toolName} scenePacket readiness must be ${expectedReadiness}.`);
  assert(scenePacket.policy?.canPersist === false, `${toolName} scenePacket must not allow persistence.`);
  assert(scenePacket.policy?.providerGeometryAllowed === false, `${toolName} scenePacket must not allow provider geometry.`);
  assert(scenePacket.policy?.liveProviderAllowed === false, `${toolName} scenePacket must not allow live providers.`);
  assert(scenePacket.safety?.passed === true, `${toolName} scenePacket safety must pass.`);
  assert(!result.structuredContent?.scenePacket, `${toolName} must not expose scenePacket in structuredContent.`);
  return scenePacket;
}

const submission = parseSubmission();
const client = new Client({ name: "atlas-submission-verifier", version: "0.1.0" });
const transport = new StreamableHTTPClientTransport(mcpUrl);

try {
  await client.connect(transport);
  const toolList = await client.listTools();
  const tools = toolList.tools ?? [];
  const actualTools = tools.map((tool) => tool.name).sort();
  assert(
    JSON.stringify(actualTools) === JSON.stringify(expectedTools),
    `MCP tools mismatch. Expected ${expectedTools.join(", ")}; got ${actualTools.join(", ")}.`,
  );

  for (const tool of tools) {
    const submissionTool = submission.tools[tool.name];
    assert(tool.outputSchema, `${tool.name} is missing outputSchema.`);
    assert(tool.annotations, `${tool.name} is missing annotations.`);
    assert(tool.annotations.readOnlyHint === submissionTool.annotations.readOnlyHint, `${tool.name} readOnlyHint mismatch.`);
    assert(tool.annotations.openWorldHint === submissionTool.annotations.openWorldHint, `${tool.name} openWorldHint mismatch.`);
    assert(tool.annotations.destructiveHint === submissionTool.annotations.destructiveHint, `${tool.name} destructiveHint mismatch.`);
  }

  const selectCountyResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "riverside-ca" },
  });
  const selectedCounty = structuredContent(selectCountyResult, "select_county");
  assert(selectedCounty.type === "voxelSceneSummary", "select_county returned wrong type.");
  assert(selectedCounty.selectedNodeId === "eastvale", "select_county must highlight Eastvale.");
  assert(selectCountyResult._meta?.scene?.world?.places?.length > 0, "select_county must keep full scene in _meta.scene.");
  assert(
    selectCountyResult._meta?.scene?.nodes?.some((node) => node.id === "eastvale"),
    "select_county must compile Eastvale from built-in map data.",
  );
  const selectCountyPacket = assertScenePacketMeta(selectCountyResult, "public_playable", "select_county");
  assert(selectCountyPacket.packet?.containsScene === true, "select_county scenePacket must describe a scene-bearing packet.");

  const countyQuestionResult = await client.callTool({
    name: "ask_county_question",
    arguments: {
      countySlug: "riverside-ca",
      question: "Why is Eastvale the first slice and what supports mobile detailing?",
      businessType: "mobile detailing",
    },
  });
  const countyQuestion = structuredContent(countyQuestionResult, "ask_county_question");
  const countyQuestionText = textContent(countyQuestionResult);
  assert(countyQuestion.type === "countyQuestionAnswer", "ask_county_question returned wrong type.");
  assert(countyQuestion.supported === true, "Supported county question should be marked supported.");
  assert(/built-in|live market/i.test(countyQuestionText), "County question content must mention built-in data and live-market limits.");
  assert(
    countyQuestion.sourceNotes.every((source) => !("placeId" in source) && !("types" in source)),
    "ask_county_question leaked provider fields in source notes.",
  );

  const unsupportedQuestion = structuredContent(
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
  assert(unsupportedQuestion.type === "countyQuestionAnswer", "Unsupported county question returned wrong type.");
  assert(unsupportedQuestion.supported === false, "Unsupported county/business question must be refused.");
  assert(/Riverside County|Supported score lanes|unsupported/i.test(unsupportedQuestion.answer), "Unsupported answer must narrow scope.");

  const countyResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "riverside-ca", selectedNodeId: "eastvale" },
  });
  const county = structuredContent(countyResult, "render_voxel_county");
  assert(county.type === "voxelSceneSummary", "render_voxel_county returned wrong type.");
  assert(countyResult._meta?.scene?.world?.places?.length > 0, "render_voxel_county must keep full scene in _meta.scene.");
  const renderPacket = assertScenePacketMeta(countyResult, "public_playable", "render_voxel_county");
  assert(renderPacket.packet?.containsScene === true, "render_voxel_county scenePacket must describe a scene-bearing packet.");

  const lookup = structuredContent(
    await client.callTool({ name: "lookup_world_places", arguments: { query: "Eastvale, CA", radiusMeters: lookupRadiusMeters } }),
    "lookup_world_places",
  );
  assert(lookup.type === "worldPlaceLookup", "lookup_world_places returned wrong type.");
  assert(lookup.runtime?.cacheHit === false, "First lookup should miss cache in a fresh verifier session.");
  assert(lookup.runtime?.cachedAt && lookup.runtime?.expiresAt, "lookup_world_places must return cache runtime metadata.");
  assert(
    lookup.places.every((place) => place.category && Array.isArray(place.sourceNotes)),
    "lookup_world_places must return normalized categories and source notes.",
  );
  assert(
    lookup.places.every((place) => !("primaryType" in place) && !("types" in place) && !("placeId" in place)),
    "lookup_world_places leaked raw provider fields.",
  );
  assert(!("placeId" in (lookup.resolvedLocation ?? {})), "lookup_world_places leaked provider placeId in resolvedLocation.");
  assert(
    lookup.places.every((place) => typeof place.id === "string" && place.id.startsWith("lookup-")),
    "lookup_world_places must expose Atlas-owned lookup ids, not provider ids.",
  );
  assert(lookup.providerReadiness?.sceneGeometry === false, "lookup_world_places must block provider-created scene geometry.");
  assert(lookup.providerReadiness?.rawProviderPayloadExposed === false, "lookup_world_places must block raw provider payload exposure.");
  assert(
    lookup.providerReadiness?.structuredContentPolicy === "atlas_normalized_only",
    "lookup_world_places must keep structuredContent Atlas-normalized only.",
  );

  const cachedLookup = structuredContent(
    await client.callTool({ name: "lookup_world_places", arguments: { query: "Eastvale, CA", radiusMeters: lookupRadiusMeters } }),
    "lookup_world_places cached",
  );
  assert(cachedLookup.runtime?.cacheHit === true, "Second lookup should hit cache.");

  const scoutResult = await client.callTool({
    name: "preview_scout_drop",
    arguments: {
      countySlug: "riverside-ca",
      locationLabel: "Eastvale",
      businessType: "mobile detailing",
      goal: "Find the strongest first drop for a local mobile detailing offer.",
    },
  });
  const scout = structuredContent(scoutResult, "preview_scout_drop");
  const scoutText = textContent(scoutResult);
  assert(scout.type === "scoutPreview", "preview_scout_drop returned wrong type.");
  assert(/stays in this chat|does not save/i.test(scoutText), "Scout Drop content must mention chat-only save limits.");
  assert(scout.alphaBoundary?.mode === "session_only_alpha", "Scout Drop must expose chat-only boundary.");
  assert(scout.alphaBoundary?.savesState === false, "Scout Drop must not claim saved state.");
  assert(scout.alphaBoundary?.executesActions === false, "Scout Drop must not claim action execution.");
  assert(scout.alphaBoundary?.nextTool === "preview_campaign_engine", "Scout Drop should point to campaign preview next.");

  const campaignResult = await client.callTool({
    name: "preview_campaign_engine",
    arguments: {
      scoutPreviewId: scout.id,
      countySlug: scout.countySlug,
      locationLabel: "Eastvale",
      businessType: scout.businessType,
      goal: scout.goal,
    },
  });
  const campaign = structuredContent(campaignResult, "preview_campaign_engine");
  const campaignText = textContent(campaignResult);
  assert(campaign.type === "campaignPreview", "preview_campaign_engine returned wrong type.");
  assert(campaign.guardrails.some((guardrail) => /manual|no posts|no DMs|no ad spend/i.test(guardrail)), "Campaign guardrails must stay manual.");
  assert(campaign.alphaBoundary?.mode === "session_only_alpha", "Campaign preview must expose chat-only boundary.");
  assert(campaign.alphaBoundary?.savesState === false, "Campaign preview must not claim saved state.");
  assert(campaign.alphaBoundary?.executesActions === false, "Campaign preview must not execute actions.");
  assert(campaign.alphaBoundary?.nextTool === "get_upgrade_options", "Campaign preview should point to Hosted Clawd options next.");
  assert(/manual|no posting|no messaging|ad spend|persistence/i.test(campaignText), "Campaign content must not imply execution.");

  const upgrade = structuredContent(
    await client.callTool({ name: "get_upgrade_options", arguments: { trigger: "save_campaign" } }),
    "get_upgrade_options",
  );
  assert(upgrade.type === "upgradeOptions", "get_upgrade_options returned wrong type.");
  assert(
    upgrade.hosted?.status === "planned_beta" || upgrade.hosted?.status === "owner_gated_test",
    "Hosted Clawd must remain planned_beta or owner_gated_test.",
  );
  if (upgrade.free?.label === "Atlas V1") {
    // ATLAS_SAVE_SURFACE=off (production V1) — assert its honest boundary.
    assert(
      Array.isArray(upgrade.unavailableActions) &&
        upgrade.unavailableActions.some((item) => /does not start checkout, charge money/i.test(item)),
      "V1 upgrade output must clearly keep checkout and money closed.",
    );
  } else if (upgrade.hosted?.status === "owner_gated_test") {
    assert(
      Array.isArray(upgrade.unavailableActions) &&
        upgrade.unavailableActions.some((item) => /Public paid access is not live/i.test(item)),
      "Owner-gated Hosted Clawd output must clearly keep public paid access closed.",
    );
  }

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
        unsupportedCountyQuestion: unsupportedQuestion.supported,
        sceneMetaPlaces: countyResult._meta.scene.world.places.length,
        hostedClawdStatus: upgrade.hosted.status,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
