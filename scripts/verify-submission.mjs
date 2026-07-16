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

function requireHttpsUrl(value, label, expectedPath) {
  assert(typeof value === "string" && value.length > 0, `${label} is required.`);
  const url = new URL(value);
  assert(url.protocol === "https:", `${label} must use HTTPS.`);
  if (expectedPath) assert(url.pathname === expectedPath, `${label} must use ${expectedPath}.`);
  return url;
}

function assertSquarePng(path, expectedSize) {
  const png = readFileSync(new URL(`../${path}`, import.meta.url));
  assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "Submission icon must be a PNG.");
  assert(png.toString("ascii", 12, 16) === "IHDR", "Submission icon is missing a PNG IHDR header.");
  assert(
    png.readUInt32BE(16) === expectedSize && png.readUInt32BE(20) === expectedSize,
    `Submission icon must be ${expectedSize}x${expectedSize}.`,
  );
}

function parseSubmission() {
  const submission = JSON.parse(readFileSync(submissionPath, "utf8"));
  assert(submission.schema_version === 1, "Submission schema_version must be 1.");
  const appInfo = submission.app_info ?? {};
  assert(appInfo.display_name === "Atlas County Scout", "Submission display_name must be Atlas County Scout.");
  assert(appInfo.display_name.trim().split(/\s+/).length >= 2, "Submission display_name must not be a generic single word.");
  const subtitle = submission.app_info?.subtitle ?? "";
  const description = submission.app_info?.description ?? "";
  assert(
    typeof subtitle === "string" &&
      subtitle.length <= 30 &&
      /voxel county maps/i.test(subtitle) &&
      !/demo|trial|alpha|beta|coming soon|planned|waitlist/i.test(subtitle),
    "Submission subtitle must fit the 30-character schema limit and describe voxel county maps without unfinished-product language.",
  );
  assert(
    typeof description === "string" &&
      description.includes("Riverside/Eastvale is the interactive map") &&
      description.includes("Scout Drop") &&
      description.includes("intentionally read-only") &&
      description.includes("up to 24 hours") &&
      !/demo|trial|alpha|beta|coming soon|planned|waitlist|your county/i.test(description),
    "Submission description must frame the current product as complete, explain its read-only boundary, and disclose lookup retention.",
  );

  assertSquarePng(appInfo.icon, 512);
  requireHttpsUrl(appInfo.website_url, "Submission website_url", "/preview");
  requireHttpsUrl(appInfo.support_url, "Submission support_url", "/support");
  requireHttpsUrl(appInfo.privacy_policy_url, "Submission privacy_policy_url", "/privacy");
  requireHttpsUrl(appInfo.terms_of_service_url, "Submission terms_of_service_url", "/terms");
  assert(/^\S+@\S+\.\S+$/.test(appInfo.support_email ?? ""), "Submission support_email must be valid.");

  const plugin = submission.plugin_submission ?? {};
  assert(plugin.submission_type === "WITH_MCP", "Submission type must be WITH_MCP.");
  requireHttpsUrl(plugin.mcp_server_url, "Submission MCP URL", "/mcp");
  assert(plugin.authentication === "NONE", "Public Atlas submission must not require reviewer credentials.");
  assert(plugin.availability?.countries?.length === 1 && plugin.availability.countries[0] === "US", "Initial availability must be US-only.");
  assert(
    Array.isArray(plugin.starter_prompts) && plugin.starter_prompts.length >= 3 && new Set(plugin.starter_prompts).size === plugin.starter_prompts.length,
    "Submission needs at least three unique starter prompts.",
  );
  assert(typeof plugin.release_notes === "string" && plugin.release_notes.length >= 80, "Submission release_notes must be reviewer-ready.");
  assert(
    plugin.domain_verification?.challenge_path === "/.well-known/openai-apps-challenge" &&
      plugin.domain_verification?.status === "ROUTE_READY_PORTAL_TOKEN_REQUIRED" &&
      plugin.domain_verification?.token_environment_variable === "ATLAS_OPENAI_APPS_CHALLENGE_TOKEN",
    "Submission must record the portal-token domain verification step without inventing a token.",
  );
  const serverSource = readFileSync(new URL("../server/src/index.ts", import.meta.url), "utf8");
  assert(
    serverSource.includes('url.pathname === "/.well-known/openai-apps-challenge"') &&
      serverSource.includes("ATLAS_OPENAI_APPS_CHALLENGE_TOKEN") &&
      serverSource.includes("textResponse(res, 200, challengeToken)"),
    "Production server must expose the exact portal challenge token as plain text when configured.",
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

  const positiveTests = submission.test_cases ?? [];
  assert(positiveTests.length === 5, "Plugin portal requires exactly five positive test cases.");
  for (const [index, test] of positiveTests.entries()) {
    assert(test.description && test.user_prompt && test.tools_triggered && test.expected_output, `Positive test ${index + 1} is incomplete.`);
    assert(test.fixture_data, `Positive test ${index + 1} is missing reviewer fixture data.`);
    assert(!/demo|trial|alpha|beta|coming soon|planned|waitlist/i.test(test.description), `Positive test ${index + 1} description reads like unfinished product copy.`);
  }
  const coveredTools = new Set(
    positiveTests.flatMap((test) => test.tools_triggered.split(",").map((tool) => tool.trim()).filter(Boolean)),
  );
  assert(expectedTools.every((tool) => coveredTools.has(tool)), "Five positive tests must collectively exercise all seven tools.");

  const negativePrompts = (submission.negative_test_cases ?? []).map((test) => `${test.user_prompt} ${test.expected_output}`);
  assert(submission.negative_test_cases?.length === 3, "Plugin portal requires exactly three negative test cases.");
  assert(submission.negative_test_cases.every((test) => test.why_not_complete), "Every negative test needs a reviewer-facing reason.");
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

async function verifyPublicPage(path, requiredText) {
  const response = await fetch(new URL(path, mcpUrl));
  const body = await response.text();
  assert(response.status === 200, `${path} returned HTTP ${response.status}.`);
  assert(/text\/html/i.test(response.headers.get("content-type") ?? ""), `${path} must return HTML.`);
  for (const token of requiredText) assert(body.includes(token), `${path} is missing required copy: ${token}`);
  return { status: response.status, bytes: Buffer.byteLength(body) };
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
const publicPages = {};
let challengeStatus = 0;

try {
  publicPages.privacy = await verifyPublicPage("/privacy", ["Data Atlas processes", "Recipients", "up to 24 hours", "Your controls"]);
  publicPages.terms = await verifyPublicPage("/terms", ["Planning boundaries", "up to 24", "Acceptable use", "Contact"]);
  publicPages.support = await verifyPublicPage("/support", ["Atlas County Scout", "What to include", "Do not send passwords", "Privacy Policy"]);
  const challengeResponse = await fetch(new URL("/.well-known/openai-apps-challenge", mcpUrl));
  const challengeBody = await challengeResponse.text();
  challengeStatus = challengeResponse.status;
  assert([200, 404].includes(challengeStatus), `Domain challenge route returned HTTP ${challengeStatus}.`);
  if (challengeStatus === 200) {
    assert(/text\/plain/i.test(challengeResponse.headers.get("content-type") ?? ""), "Domain challenge must return plain text.");
    assert(challengeBody.trim() === challengeBody && challengeBody.length > 0, "Domain challenge must return only the exact non-empty token.");
  } else {
    assert(challengeBody === "Not Found", "Unconfigured domain challenge must fail closed with Not Found.");
  }

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
  const lookupTool = tools.find((tool) => tool.name === "lookup_world_places");
  const lookupInputs = lookupTool?.inputSchema?.properties ?? {};
  assert("countySlug" in lookupInputs && "placeId" in lookupInputs, "lookup_world_places must accept Atlas-owned county and place ids.");
  assert(!("query" in lookupInputs), "lookup_world_places must not request a raw city, address, or location query.");

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
  assert(
    /Riverside County|Supported score lanes|cannot answer.*preview|unsupported/i.test(unsupportedQuestion.answer),
    "Unsupported answer must narrow scope to the playable county, supported lanes, or preview-only facts.",
  );

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
    await client.callTool({
      name: "lookup_world_places",
      arguments: { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: lookupRadiusMeters },
    }),
    "lookup_world_places",
  );
  assert(lookup.type === "worldPlaceLookup", "lookup_world_places returned wrong type.");
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
  const publicLookupJson = JSON.stringify(lookup);
  for (const forbidden of ["query", "mode", "coordinates", "cache", "providerReadiness", "runtime", "ttlSeconds", "cachedAt", "expiresAt"]) {
    assert(!publicLookupJson.includes(`\"${forbidden}\"`), `lookup_world_places must not expose internal ${forbidden} metadata.`);
  }

  const cachedLookup = structuredContent(
    await client.callTool({
      name: "lookup_world_places",
      arguments: { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: lookupRadiusMeters },
    }),
    "lookup_world_places cached",
  );
  assert(JSON.stringify(cachedLookup) === JSON.stringify(lookup), "Cached lookup must preserve the same minimized public result shape.");

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
    assert(!("hostedClawd" in upgrade), "V1 upgrade output must not expose owner-gated Hosted Clawd capabilities.");
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
        publicPages,
        challengeStatus,
        tools: actualTools,
        lookupPlaceCount: lookup.places.length,
        lookupPublicFields: Object.keys(lookup).sort(),
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
