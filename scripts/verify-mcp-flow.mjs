import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { assertToolSurface } from "./lib/atlas-tool-surface.mjs";

const mcpUrl = new URL(process.env.ATLAS_MCP_URL ?? "http://127.0.0.1:8787/mcp");
// A server started without ATLAS_COMMONS_ENABLED serves the map-only surface;
// pass --map-only (or ATLAS_VERIFY_MAP_ONLY=1) to check against that instead.
const commonsEnabled = !(process.argv.includes("--map-only") || process.env.ATLAS_VERIFY_MAP_ONLY === "1");
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
  assert(!/\b(alpha|tier|spec|draft|archetype)\b/i.test(text), `${label} leaked generated-place jargon.`);
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
  const actualTools = assertToolSurface(tools.map((tool) => tool.name), { commonsEnabled });

  for (const tool of tools) {
    assert(tool.outputSchema, `${tool.name} is missing outputSchema.`);
    assert(tool.annotations, `${tool.name} is missing annotations.`);
    assert(typeof tool.annotations.readOnlyHint === "boolean", `${tool.name} missing readOnlyHint.`);
    assert(typeof tool.annotations.openWorldHint === "boolean", `${tool.name} missing openWorldHint.`);
    assert(typeof tool.annotations.destructiveHint === "boolean", `${tool.name} missing destructiveHint.`);
  }

  const lookupTool = tools.find((tool) => tool.name === "lookup_world_places");
  assert(lookupTool?.annotations?.openWorldHint === true, "lookup_world_places must be marked openWorldHint=true.");
  const lookupInputs = lookupTool?.inputSchema?.properties ?? {};
  assert("countySlug" in lookupInputs && "placeId" in lookupInputs, "lookup_world_places must accept Atlas-owned location ids.");
  assert(!("query" in lookupInputs), "lookup_world_places must not request a raw location query.");

  const selectCountyResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "riverside-ca" },
  });
  const selectCountyText = getTextContent(selectCountyResult, "select_county");
  const selectedCounty = getStructuredContent(selectCountyResult, "select_county");
  assert(selectedCounty.type === "voxelSceneSummary", "select_county returned the wrong structured type.");
  assert(selectedCounty.selectedNodeId === "eastvale", "select_county must highlight Eastvale.");
  assert(/Eastvale is the full map/i.test(selectCountyText), "select_county text must describe Eastvale as the full map.");
  assert(/(?:private )?(?:pins and )?notes (?:that )?stay in this chat/i.test(selectCountyText), "select_county text must explain notes stay in this chat.");
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
  assert(/does not add verified streets, buildings, businesses/i.test(shellCountyText), "Preview county text must block fake local coverage.");
  assert(/Real Census town names are attached/i.test(shellCountyText), "Preview county text must disclose real Census town anchors.");
  assert(/saved work, XP, evidence, outreach, or automation/i.test(shellCountyText), "Preview county text must block saved/progression/outreach/automation claims.");
  assertNoForbiddenProductClaims(shellCountyText, "select_county shell county");
  assertNoInternalLanguage(shellCountyText, "select_county shell county");
  assert(!shellCountyResult._meta?.scene, "Shell county selection must not return a fake scene.");
  assert(!("coverageShellScene" in (shellCountyResult._meta ?? {})), "Shell county selection must not ship _meta.coverageShellScene.");
  assert(!shellCountyResult._meta?.generatedDraftSpec, "Shell county must not generate a layout study by default.");
  assert(!shellCountyResult._meta?.generatedDraftPacket, "Shell county must not attach a generated packet by default.");
  assert(shellCountyResult._meta?.townAnchors?.some((anchor) => anchor.label === "Anaheim"), "Orange County board must include a real Anaheim town anchor.");
  assert(typeof shellCounty.stateCode === "string" && shellCounty.stateCode.length === 2, "Shell county summary must include stateCode for widget-side shell compile.");
  const shellCountyPacket = assertScenePacketMeta(shellCountyResult, "shell_only", "select_county shell county");
  assert(shellCountyPacket.packet?.containsScene === false, "Shell county scenePacket must not contain scene payload.");

  const shellStudyResult = await client.callTool({
    name: "select_county",
    arguments: { countySlug: "orange-ca", includeGeneratedDraft: true },
  });
  assert(!shellStudyResult._meta?.scene, "Explicit shell layout study must remain non-playable.");
  assert(shellStudyResult._meta?.generatedDraftSpec?.sourceBasis === "census_identity_and_town_anchors", "Explicit shell layout study must carry the Census town-anchor spec.");
  assert(shellStudyResult._meta?.generatedDraftSpec?.townAnchors?.some((anchor) => anchor.label === "Anaheim"), "Explicit Orange County layout study must include Anaheim.");
  assert(shellStudyResult._meta?.generatedDraftPacket?.packet?.containsScene === true, "Explicit shell layout study must carry its widget-only scene packet.");

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

  const censusTownQuestions = [
    {
      countySlug: "mobile-al",
      question: "Where is Mobile?",
      expectedLabel: "Mobile",
    },
    {
      countySlug: "miami-dade-fl",
      question: "Where is Homestead?",
      expectedLabel: "Homestead",
    },
  ];
  const generatedQuestionSummaries = [];
  for (const sample of censusTownQuestions) {
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
    assert(/Census board answer/i.test(generatedQuestionText), `${label} text must identify the Census board boundary.`);
    assert(/real U\.S\. Census place name/i.test(generatedQuestionText), `${label} must identify the real Census place name.`);
    assert(/generated, not verified local geography/i.test(generatedQuestionText), `${label} must preserve the generated-layout boundary.`);
    assert(generatedQuestion.sourceNotes?.[0]?.sourceType === "us_census_tigerweb", `${label} must expose the Census source class.`);
    assert(!generatedQuestionResult._meta?.scene, `${label} must not return a fake playable VoxelScene.`);
    assert(!generatedQuestionResult._meta?.generatedDraftSpec, `${label} must not generate a layout study for a factual Census-town question.`);
    assert(!generatedQuestionResult._meta?.generatedDraftPacket, `${label} must not attach generated layout metadata.`);
    assert(generatedQuestionResult._meta?.townAnchors?.some((anchor) => anchor.label === sample.expectedLabel), `${label} must carry the matching Census town anchor.`);
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
  assert(/Census board boundary/i.test(unsupportedCountyQuestionText), "Unsupported county answer must identify the Census board boundary.");
  assert(/will not (?:invent streets, businesses, addresses, or local claims|make local facts or business claims)/i.test(unsupportedCountyQuestionText), "Unsupported generated county answer must refuse local/business claims.");
  assertNoForbiddenProductClaims(unsupportedCountyQuestionText, "ask_county_question unsupported");
  assertNoInternalLanguage(unsupportedCountyQuestionText, "ask_county_question unsupported");
  assertNoGeneratedPlaceJargon(unsupportedCountyQuestionText, "ask_county_question unsupported");
  assert(
    /displayed Census place names|drawn place labels|business claims|unsupported/i.test(unsupportedCountyQuestion.answer),
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
  assert(/(?:private )?(?:pins and )?notes (?:that )?stay in this chat/i.test(countyText), "render_voxel_county text must preserve chat boundary.");
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
  assert(/Real Census town names are attached/i.test(shellRenderText), "Preview render text must disclose real Census town anchors.");
  assert(/Riverside\/Eastvale is fully explorable today/i.test(shellRenderText), "Shell render text must give the full-map path.");
  assertNoForbiddenProductClaims(shellRenderText, "render_voxel_county shell county");
  assertNoInternalLanguage(shellRenderText, "render_voxel_county shell county");
  assert(!shellRenderResult._meta?.scene, "Shell county render must not return a fake scene.");
  assert(!("coverageShellScene" in (shellRenderResult._meta ?? {})), "Shell county render must not ship _meta.coverageShellScene.");
  assert(!shellRenderResult._meta?.generatedDraftSpec, "Shell render must not generate a layout study by default.");
  assert(!shellRenderResult._meta?.generatedDraftPacket, "Shell render must not attach a generated packet by default.");
  assert(shellRenderResult._meta?.townAnchors?.some((anchor) => anchor.label === "Anaheim"), "Shell render must keep real Census town anchors.");
  assert(typeof shellRender.stateCode === "string" && shellRender.stateCode.length === 2, "Shell render summary must include stateCode for widget-side shell compile.");
  const shellRenderPacket = assertScenePacketMeta(shellRenderResult, "shell_only", "render_voxel_county shell county");
  assert(shellRenderPacket.packet?.containsScene === false, "Shell county render scenePacket must not contain scene payload.");

  const shellStudyRenderResult = await client.callTool({
    name: "render_voxel_county",
    arguments: { countySlug: "orange-ca", includeGeneratedDraft: true },
  });
  assert(!shellStudyRenderResult._meta?.scene, "Explicit shell render study must remain non-playable.");
  assert(shellStudyRenderResult._meta?.generatedDraftSpec?.sourceBasis === "census_identity_and_town_anchors", "Explicit shell render study must carry the Census town-anchor spec.");
  assert(shellStudyRenderResult._meta?.generatedDraftPacket?.packet?.containsScene === true, "Explicit shell render study must carry its widget-only scene packet.");

  const lookupResult = await client.callTool({
      name: "lookup_world_places",
      arguments: { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: lookupRadiusMeters },
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
  const lookupJson = JSON.stringify(lookup);
  for (const forbidden of ["query", "mode", "coordinates", "cache", "providerReadiness", "runtime", "ttlSeconds", "cachedAt", "expiresAt"]) {
    assert(!lookupJson.includes(`\"${forbidden}\"`), `lookup_world_places leaked internal ${forbidden} metadata.`);
  }

  const cachedLookup = getStructuredContent(
    await client.callTool({
      name: "lookup_world_places",
      arguments: { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: lookupRadiusMeters },
    }),
    "lookup_world_places cached",
  );
  assert(JSON.stringify(cachedLookup) === lookupJson, "Cached lookup must preserve the same minimized public result.");

  // Community notes: reading is public and must work with no credentials, and
  // an unauthenticated post must be refused honestly rather than dropped.
  if (commonsEnabled) {
    const notes = getStructuredContent(
      await client.callTool({ name: "list_atlas_notes", arguments: { countySlug: "riverside-ca", limit: 5 } }),
      "list_atlas_notes",
    );
    assert(notes.type === "atlasPublicNoteList", "list_atlas_notes returned the wrong structured type.");
    assert(Array.isArray(notes.notes), "list_atlas_notes must return a notes array.");
    assert(
      notes.notes.every((note) => note.status === undefined || note.status === "visible"),
      "list_atlas_notes must never return a pending or removed note to a reader.",
    );

    const anonymousWrite = await client.callTool({
      name: "write_atlas_note",
      arguments: {
        operation: "post",
        countySlug: "riverside-ca",
        placeId: "eastvale",
        placeLabel: "Eastvale",
        body: "Flow verifier probe: this post must be refused.",
        clientRequestId: `mcp-flow-${lookupRadiusMeters}`,
      },
    });
    const anonymousWriteText = (anonymousWrite.content ?? [])
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n");
    assert(
      anonymousWrite.isError === true || /sign in|identity|invite|not authorized|permission|scope/i.test(anonymousWriteText),
      "An unauthenticated write_atlas_note post must be refused with an honest reason.",
    );
    assert(
      !/published|posted|added your note/i.test(anonymousWriteText),
      "An unauthenticated write_atlas_note post must not claim the note was published.",
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mcpUrl: mcpUrl.toString(),
        tools: actualTools,
        lookupPlaceCount: lookup.places.length,
        lookupPublicFields: Object.keys(lookup).sort(),
        selectedCountySceneId: selectedCounty.sceneId,
        shellCountyTier: shellCounty.coverageTier,
        countyQuestionTopic: countyQuestion.topic,
        generatedQuestionSummaries,
        unsupportedCountyQuestion: unsupportedCountyQuestion.supported,
        commonsChecked: commonsEnabled,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
