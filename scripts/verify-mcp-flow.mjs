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

function getTextContent(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object.`);
  assert(Array.isArray(result.content), `${toolName} returned no content array.`);
  return result.content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("\n");
}

function assertNoForbiddenProductClaims(text, label) {
  assert(!/saved campaign|saved to your account|XP granted|evidence submitted|automation started|paid ads launched/i.test(text), `${label} makes a forbidden product claim.`);
}

function assertNoInternalLanguage(text, label) {
  assert(!/\b(compiler|GEOID|packet|verifier|structuredContent|_meta)\b/i.test(text), `${label} leaked internal implementation language.`);
}

function assertNoGeneratedPlaceJargon(text, label) {
  assert(!/\b(alpha|tier|spec|generated|draft|archetype)\b/i.test(text), `${label} leaked generated-place jargon.`);
}

function assertLookupBoundaryText(text, label) {
  assert(/lookup-only/i.test(text), `${label} must say lookup-only.`);
  assert(/not saved/i.test(text), `${label} must say lookup results are not saved.`);
  assert(/not coverage proof/i.test(text), `${label} must say lookup is not coverage proof.`);
  assert(/does not unlock a full county map/i.test(text), `${label} must block full-map promotion.`);
}

function assertScenePacketMeta(result, expectedReadiness, label) {
  const scenePacket = result?._meta?.scenePacket;
  assert(scenePacket && typeof scenePacket === "object", `${label} must return safe _meta.scenePacket metadata.`);
  assert(scenePacket.readiness === expectedReadiness, `${label} scenePacket readiness must be ${expectedReadiness}.`);
  assert(scenePacket.policy?.canPersist === false, `${label} scenePacket must not allow persistence.`);
  assert(scenePacket.policy?.providerGeometryAllowed === false, `${label} scenePacket must not allow provider geometry.`);
  assert(scenePacket.policy?.liveProviderAllowed === false, `${label} scenePacket must not allow live providers.`);
  assert(scenePacket.safety?.passed === true, `${label} scenePacket safety must pass.`);
  assert(!result.structuredContent?.scenePacket, `${label} must not expose scenePacket in structuredContent.`);
  return scenePacket;
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
  const selectCountyText = getTextContent(selectCountyResult, "select_county");
  const selectedCounty = getStructuredContent(selectCountyResult, "select_county");
  assert(selectedCounty.type === "voxelSceneSummary", "select_county returned the wrong structured type.");
  assert(selectedCounty.selectedNodeId === "eastvale", "select_county must highlight Eastvale.");
  assert(/Eastvale is the full map/i.test(selectCountyText), "select_county text must describe Eastvale as the full map.");
  assert(/notes that stay in this chat/i.test(selectCountyText), "select_county text must explain notes stay in this chat.");
  assertNoForbiddenProductClaims(selectCountyText, "select_county");
  assertNoInternalLanguage(selectCountyText, "select_county");
  assert(selectCountyResult._meta?.scene?.world?.places?.length > 0, "select_county must return full scene in _meta.scene.");
  assert(
    selectCountyResult._meta?.scene?.nodes?.some((node) => node.id === "eastvale"),
    "select_county compiled scene must include the curated Eastvale node.",
  );
  const selectCountyPacket = assertScenePacketMeta(selectCountyResult, "public_playable", "select_county");
  assert(selectCountyPacket.packet?.containsScene === true, "select_county scenePacket must describe a scene-bearing packet.");
  assert(typeof selectCountyPacket.cacheHit === "boolean", "select_county scenePacket must report cacheHit.");

  const shellCountyResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "orange-ca" },
  });
  const shellCountyText = getTextContent(shellCountyResult, "select_county shell county");
  const shellCounty = getStructuredContent(shellCountyResult, "select_county shell county");
  assert(shellCounty.type === "countyCoverageSummary", "Shell county selection must return coverage summary.");
  assert(shellCounty.countySlug === "orange-ca", "Preview county selection must preserve county id.");
  assert(shellCounty.coverageTier === "L1_COUNTY_SHELL", "Orange County should be an L1 county shell.");
  assert(shellCounty.playableDistrictCount === 0, "Shell counties must not claim playable districts.");
  assert(/preview only/i.test(shellCountyText), "Preview county text must say preview only.");
  assert(/Riverside\/Eastvale is fully explorable today/i.test(shellCountyText), "Preview county text must point to the full map.");
  assert(/does not add local places/i.test(shellCountyText), "Preview county text must block fake local places.");
  assert(/saved work, XP, evidence, outreach, or automation/i.test(shellCountyText), "Preview county text must block saved/progression/outreach/automation claims.");
  assertNoForbiddenProductClaims(shellCountyText, "select_county shell county");
  assertNoInternalLanguage(shellCountyText, "select_county shell county");
  assert(!shellCountyResult._meta?.scene, "Shell county selection must not return a fake scene.");
  assert(!("coverageShellScene" in (shellCountyResult._meta ?? {})), "Shell county selection must not ship _meta.coverageShellScene.");
  assert(typeof shellCounty.stateCode === "string" && shellCounty.stateCode.length === 2, "Shell county summary must include stateCode for widget-side shell compile.");
  const shellCountyPacket = assertScenePacketMeta(shellCountyResult, "shell_only", "select_county shell county");
  assert(shellCountyPacket.packet?.containsScene === false, "Shell county scenePacket must not contain scene payload.");

  const countyQuestionResult = await client.callTool({
      name: "ask_county_question",
      arguments: {
        countySlug: "riverside-ca",
        question: "Which map signals support mobile detailing in Eastvale?",
        businessType: "mobile detailing",
      },
    });
  const countyQuestionText = getTextContent(countyQuestionResult, "ask_county_question");
  const countyQuestion = getStructuredContent(countyQuestionResult, "ask_county_question");
  assert(/Riverside\/Eastvale answer/i.test(countyQuestionText), "ask_county_question text must name the Riverside/Eastvale answer boundary.");
  assert(/No saves, XP, evidence, or automation/i.test(countyQuestionText), "ask_county_question text must block saved/progression/automation claims.");
  assertNoForbiddenProductClaims(countyQuestionText, "ask_county_question");
  assertNoInternalLanguage(countyQuestionText, "ask_county_question");
  assert(countyQuestion.type === "countyQuestionAnswer", "ask_county_question returned the wrong structured type.");
  assert(countyQuestion.supported === true, "Supported county question should be marked supported.");
  assert(countyQuestion.topic === "business_signals", "Supported mobile detailing question should use business_signals topic.");
  assert(
    /Residential Demand|QR Flyer Opportunity|Partnership Target/i.test(countyQuestion.answer),
    "ask_county_question did not cite expected mobile detailing signals.",
  );
  assert(
    countyQuestion.limitations.some((limitation) => /built-in|live market/i.test(limitation)),
    "ask_county_question must expose built-in data and live-market limitations.",
  );

  const generatedPlaceQuestions = [
    {
      countySlug: "mobile-al",
      question: "Where is the riverfront landing?",
      expectedLabel: "Riverfront landing",
    },
    {
      countySlug: "loving-tx",
      question: "Where is the market?",
      expectedLabel: "Desert market row",
    },
    {
      countySlug: "miami-dade-fl",
      question: "Where is the civic square?",
      expectedLabel: "Civic square",
    },
  ];
  const generatedQuestionSummaries = [];
  for (const sample of generatedPlaceQuestions) {
    const generatedQuestionResult = await client.callTool({
      name: "ask_county_question",
      arguments: {
        countySlug: sample.countySlug,
        question: sample.question,
      },
    });
    const label = `ask_county_question generated ${sample.countySlug}`;
    const generatedQuestionText = getTextContent(generatedQuestionResult, label);
    const generatedQuestion = getStructuredContent(generatedQuestionResult, label);
    assert(generatedQuestion.type === "countyQuestionAnswer", `${label} returned wrong type.`);
    assert(generatedQuestion.supported === true, `${label} should answer drawn-place questions.`);
    assert(generatedQuestion.topic === "generated_place", `${label} should use generated_place topic.`);
    assert(generatedQuestion.targetLabel === sample.expectedLabel, `${label} target label changed.`);
    assert(generatedQuestion.targetNodeId, `${label} must include a target node id.`);
    assert(generatedQuestion.targetPlaceId, `${label} must include a target place id.`);
    assert(generatedQuestion.cameraIntent?.targetLabel === sample.expectedLabel, `${label} must attach a camera intent for the place.`);
    assert(
      generatedQuestion.cameraIntent?.type === "focus_place" || generatedQuestion.cameraIntent?.type === "focus_landmark",
      `${label} camera intent must focus a place or landmark.`,
    );
    assert(/Preview map answer/i.test(generatedQuestionText), `${label} text must identify preview map answer.`);
    assert(/Tap it on the map/i.test(generatedQuestionText), `${label} text must tell the user to use the map.`);
    assert(!generatedQuestionResult._meta?.scene, `${label} must not return a fake playable VoxelScene.`);
    assert(generatedQuestionResult._meta?.generatedDraftSpec, `${label} should carry the widget spec for the active preview scene.`);
    assert(generatedQuestionResult._meta?.generatedDraftPacket, `${label} should carry generated draft packet metadata.`);
    assertNoForbiddenProductClaims(generatedQuestionText, label);
    assertNoInternalLanguage(generatedQuestionText, label);
    assertNoGeneratedPlaceJargon(generatedQuestionText, label);
    generatedQuestionSummaries.push({
      countySlug: sample.countySlug,
      question: sample.question,
      answer: generatedQuestion.answer,
      targetLabel: generatedQuestion.targetLabel,
      cameraIntent: generatedQuestion.cameraIntent?.type,
    });
  }

  const unsupportedCountyQuestionResult = await client.callTool({
      name: "ask_county_question",
      arguments: {
        countySlug: "orange-ca",
        question: "Will roofing work in Orange County?",
        businessType: "roofing",
      },
    });
  const unsupportedCountyQuestionText = getTextContent(unsupportedCountyQuestionResult, "ask_county_question unsupported");
  const unsupportedCountyQuestion = getStructuredContent(unsupportedCountyQuestionResult, "ask_county_question unsupported");
  assert(unsupportedCountyQuestion.type === "countyQuestionAnswer", "Unsupported county question returned wrong type.");
  assert(unsupportedCountyQuestion.supported === false, "Unsupported county/business question should be refused.");
  assert(/Preview boundary/i.test(unsupportedCountyQuestionText), "Unsupported generated county answer must identify the preview boundary.");
  assert(/will not make local facts or business claims/i.test(unsupportedCountyQuestionText), "Unsupported generated county answer must refuse local/business claims.");
  assertNoForbiddenProductClaims(unsupportedCountyQuestionText, "ask_county_question unsupported");
  assertNoInternalLanguage(unsupportedCountyQuestionText, "ask_county_question unsupported");
  assertNoGeneratedPlaceJargon(unsupportedCountyQuestionText, "ask_county_question unsupported");
  assert(
    /drawn place labels|business claims|unsupported/i.test(unsupportedCountyQuestion.answer),
    "Unsupported generated county/business answer should narrow scope clearly.",
  );

  const countyResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "riverside-ca", selectedNodeId: "eastvale" },
  });
  const countyText = getTextContent(countyResult, "render_voxel_county");
  const county = getStructuredContent(countyResult, "render_voxel_county");
  assert(county.type === "voxelSceneSummary", "render_voxel_county returned the wrong structured type.");
  assert(county.selectedNodeId === "eastvale", "render_voxel_county did not preserve selectedNodeId.");
  assert(/Riverside\/Eastvale full map/i.test(countyText), "render_voxel_county text must name the full map.");
  assert(/Pins and notes stay in this chat/i.test(countyText), "render_voxel_county text must preserve chat boundary.");
  assertNoForbiddenProductClaims(countyText, "render_voxel_county");
  assertNoInternalLanguage(countyText, "render_voxel_county");
  assert(countyResult._meta?.scene?.world?.places?.length > 0, "render_voxel_county must return full scene in _meta.scene.");
  const renderPacket = assertScenePacketMeta(countyResult, "public_playable", "render_voxel_county");
  assert(renderPacket.packet?.containsScene === true, "render_voxel_county scenePacket must describe a scene-bearing packet.");
  assert(renderPacket.cacheHit === true, "render_voxel_county should hit scene packet memory after select_county.");

  const shellRenderResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "orange-ca" },
  });
  const shellRenderText = getTextContent(shellRenderResult, "render_voxel_county shell county");
  const shellRender = getStructuredContent(shellRenderResult, "render_voxel_county shell county");
  assert(shellRender.type === "countyCoverageSummary", "Shell county render must return coverage summary.");
  assert(shellRender.coverageTier === "L1_COUNTY_SHELL", "Shell county render should identify L1 coverage.");
  assert(/preview only/i.test(shellRenderText), "Preview render text must identify preview-only state.");
  assert(/after the full map is built/i.test(shellRenderText), "Preview render text must require the full map.");
  assert(/Open Riverside\/Eastvale/i.test(shellRenderText), "Shell render text must give the recovery path.");
  assertNoForbiddenProductClaims(shellRenderText, "render_voxel_county shell county");
  assertNoInternalLanguage(shellRenderText, "render_voxel_county shell county");
  assert(!shellRenderResult._meta?.scene, "Shell county render must not return a fake scene.");
  assert(!("coverageShellScene" in (shellRenderResult._meta ?? {})), "Shell county render must not ship _meta.coverageShellScene.");
  assert(typeof shellRender.stateCode === "string" && shellRender.stateCode.length === 2, "Shell render summary must include stateCode for widget-side shell compile.");
  const shellRenderPacket = assertScenePacketMeta(shellRenderResult, "shell_only", "render_voxel_county shell county");
  assert(shellRenderPacket.packet?.containsScene === false, "Shell county render scenePacket must not contain scene payload.");

  const lookupResult = await client.callTool({
      name: "lookup_world_places",
      arguments: { query: "Eastvale, CA", radiusMeters: lookupRadiusMeters },
    });
  const lookupText = getTextContent(lookupResult, "lookup_world_places");
  assertLookupBoundaryText(lookupText, "lookup_world_places");
  assertNoForbiddenProductClaims(lookupText, "lookup_world_places");
  assertNoInternalLanguage(lookupText, "lookup_world_places");
  const lookup = getStructuredContent(lookupResult, "lookup_world_places");
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
  assert(typeof lookup.runtime?.cacheHit === "boolean", "lookup_world_places must report whether the cache was used.");
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
    Array.isArray(scout.limitations) && scout.limitations.some((limitation) => /Preview only|manual|stays in this chat/i.test(limitation)),
    "preview_scout_drop must keep preview/manual limitations visible.",
  );
  assert(scout.alphaBoundary?.mode === "session_only_alpha", "preview_scout_drop must expose chat-only boundary.");
  assert(scout.alphaBoundary?.savesState === false, "preview_scout_drop must not claim saved state.");
  assert(scout.alphaBoundary?.executesActions === false, "preview_scout_drop must not execute actions.");
  assert(scout.alphaBoundary?.grantsXp === false, "preview_scout_drop must not grant XP.");
  assert(scout.alphaBoundary?.nextTool === "preview_campaign_engine", "preview_scout_drop should point to campaign preview next.");

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
  assert(campaign.alphaBoundary?.mode === "session_only_alpha", "preview_campaign_engine must expose chat-only boundary.");
  assert(campaign.alphaBoundary?.savesState === false, "preview_campaign_engine must not claim saved state.");
  assert(campaign.alphaBoundary?.executesActions === false, "preview_campaign_engine must not execute actions.");
  assert(campaign.alphaBoundary?.grantsXp === false, "preview_campaign_engine must not grant XP.");
  assert(campaign.alphaBoundary?.nextTool === "get_upgrade_options", "preview_campaign_engine should point to Hosted Clawd options next.");

  const upgrade = getStructuredContent(
    await client.callTool({
      name: "get_upgrade_options",
      arguments: { trigger: "save_campaign" },
    }),
    "get_upgrade_options",
  );
  assert(upgrade.type === "upgradeOptions", "get_upgrade_options returned the wrong structured type.");
  assert(
    upgrade.hosted?.status === "planned_beta" || upgrade.hosted?.status === "owner_gated_test",
    "Hosted Clawd status must be planned_beta or owner_gated_test.",
  );
  const saveSurfaceOff = upgrade.free?.label === "Atlas V1";
  if (saveSurfaceOff) {
    // ATLAS_SAVE_SURFACE=off (production V1): the honest boundary line is
    // the no-checkout/no-money sentence in the V1 payload.
    assert(
      Array.isArray(upgrade.unavailableActions) &&
        upgrade.unavailableActions.some((item) => /does not start checkout, charge money/i.test(item)),
      "V1 upgrade output must clearly keep checkout and money closed.",
    );
    assert(!("hostedClawd" in upgrade), "V1 upgrade output must not expose owner-gated Hosted Clawd capabilities.");
  } else if (upgrade.hosted?.status === "planned_beta") {
    assert(
      Array.isArray(upgrade.unavailableActions) &&
        upgrade.unavailableActions.some((item) => item.includes("Checkout is not live")),
      "Upgrade options must clearly say checkout is not live.",
    );
  } else {
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
        shellCountyTier: shellCounty.coverageTier,
        countyQuestionTopic: countyQuestion.topic,
        generatedQuestionSummaries,
        unsupportedCountyQuestion: unsupportedCountyQuestion.supported,
        scoutPreviewId: scout.id,
        campaignPreviewId: campaign.id,
        hostedClawdStatus: upgrade.hosted.status,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
