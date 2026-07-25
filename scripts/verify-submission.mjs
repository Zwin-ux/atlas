import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  assertToolSurface,
  EXPECTED_ANNOTATIONS,
  EXPECTED_TOOLS,
  RETIRED_TOOLS,
} from "./lib/atlas-tool-surface.mjs";

const submissionPath = new URL("../chatgpt-app-submission.json", import.meta.url);
const mcpUrl = new URL(process.env.ATLAS_MCP_URL ?? "http://127.0.0.1:8787/mcp");

const expectedTools = [...EXPECTED_TOOLS];
const expectedAnnotations = EXPECTED_ANNOTATIONS;
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
  assert(
    appInfo.display_name === "Atlas County Maps" || appInfo.display_name === "Atlas County Scout",
    "Submission display_name must be Atlas County Maps (preferred) or Atlas County Scout.",
  );
  assert(appInfo.display_name.trim().split(/\s+/).length >= 2, "Submission display_name must not be a generic single word.");
  const subtitle = submission.app_info?.subtitle ?? "";
  const description = submission.app_info?.description ?? "";
  assert(
    typeof subtitle === "string" &&
      subtitle.length <= 40 &&
      /county maps/i.test(subtitle) &&
      /notes/i.test(subtitle) &&
      !/demo|trial|alpha|beta|coming soon|planned|waitlist/i.test(subtitle),
    "Submission subtitle must name both halves of the product (county maps + notes) without unfinished-product language.",
  );
  assert(
    typeof description === "string" &&
      /Riverside\/Eastvale is the (full )?interactive map/i.test(description) &&
      description.includes("up to 24 hours") &&
      !/demo|trial|alpha|beta|coming soon|planned|waitlist|your county/i.test(description),
    "Submission description must frame the product as complete and disclose lookup retention.",
  );
  // UGC honesty: a reviewer reading the listing must learn, from the listing
  // alone, that other people's writing shows up and how it is governed.
  assert(
    /user-generated/i.test(description) &&
      /moderat/i.test(description) &&
      /report/i.test(description) &&
      /visible to other people|other people/i.test(description),
    "Submission description must disclose that notes are user-generated, moderated, reportable, and visible to others.",
  );
  assert(
    /invited contributors|invite/i.test(description) && /reading is open|open to everyone/i.test(description),
    "Submission description must state the public-read / invite-write posture.",
  );
  assert(
    /stay in the chat|stays in the chat|never publish on their own/i.test(description),
    "Submission description must state that private widget notes never publish on their own.",
  );
  assert(
    /does not process payments|no checkout|no paid tier/i.test(description),
    "Submission description must state that Atlas has no payment surface.",
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
    const expected = expectedAnnotations[toolName];
    assert(tool?.annotations, `${toolName} is missing submission annotations.`);
    for (const hint of ["readOnlyHint", "openWorldHint", "destructiveHint"]) {
      assert(
        tool.annotations[hint] === expected[hint],
        `${toolName} ${hint} must be ${expected[hint]}; submission says ${tool.annotations[hint]}.`,
      );
    }
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
  assert(
    expectedTools.every((tool) => coveredTools.has(tool)),
    `Five positive tests must collectively exercise all ${expectedTools.length} tools. Missing: ${expectedTools.filter((tool) => !coveredTools.has(tool)).join(", ")}.`,
  );

  const negativePrompts = (submission.negative_test_cases ?? []).map((test) => `${test.user_prompt} ${test.expected_output}`);
  assert(submission.negative_test_cases?.length === 3, "Plugin portal requires exactly three negative test cases.");
  assert(submission.negative_test_cases.every((test) => test.why_not_complete), "Every negative test needs a reviewer-facing reason.");
  assert(negativePrompts.some((text) => /DMs|messaging|spam/i.test(text)), "Submission needs a messaging/spam negative case.");
  assert(negativePrompts.some((text) => /checkout|card|payment/i.test(text)), "Submission needs a payment negative case.");
  // With no commerce tool on the surface, the payment refusal must be a plain
  // "no tool is called" — not a tool call that explains why it cannot charge.
  const paymentCase = (submission.negative_test_cases ?? []).find((test) => /checkout|card|payment/i.test(`${test.user_prompt} ${test.expected_output}`));
  assert(
    paymentCase?.tools_triggered === null || paymentCase?.tools_triggered === undefined,
    "The payment negative case must trigger no tool at all; Atlas exposes no commerce surface.",
  );
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
  return { status: response.status, bytes: Buffer.byteLength(body), body };
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
  // Every policy route a store reviewer opens must already describe the product
  // that actually ships — including the parts that store user-generated content.
  publicPages.privacy = await verifyPublicPage("/privacy", [
    "Data Atlas processes",
    "Public notes are public",
    "Recipients",
    "up to 24 hours",
    "30 days",
    "12 months",
    "Your controls",
  ]);
  publicPages.terms = await verifyPublicPage("/terms", [
    "Boundaries",
    "Posting rules",
    "up to 24",
    "Acceptable use",
    "three reports",
    "Contact",
  ]);
  publicPages.support = await verifyPublicPage("/support", [
    "Atlas County Maps",
    "What to include",
    "Do not send passwords",
    "Remove a note I wrote",
    "Privacy Policy",
  ]);
  publicPages.community = await verifyPublicPage("/community", [
    "Commons Community Standard",
    "24 hours",
    "Three reports",
    "Reports and removals",
  ]);
  // No policy page may still hedge Commons as a maybe-someday feature, and none
  // may advertise a product Atlas no longer has.
  for (const [name, page] of Object.entries(publicPages)) {
    for (const stale of ["Atlas County Scout", "Scout Drop", "campaign plan", "if enabled", "may be enabled"]) {
      assert(!page.body.includes(stale), `/${name} still contains retired product copy: "${stale}".`);
    }
  }
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
  const actualTools = assertToolSurface(tools.map((tool) => tool.name));

  for (const tool of tools) {
    const submissionTool = submission.tools[tool.name];
    assert(tool.outputSchema, `${tool.name} is missing outputSchema.`);
    assert(tool.annotations, `${tool.name} is missing annotations.`);
    assert(tool.annotations.readOnlyHint === submissionTool.annotations.readOnlyHint, `${tool.name} readOnlyHint mismatch.`);
    assert(tool.annotations.openWorldHint === submissionTool.annotations.openWorldHint, `${tool.name} openWorldHint mismatch.`);
    assert(tool.annotations.destructiveHint === submissionTool.annotations.destructiveHint, `${tool.name} destructiveHint mismatch.`);
  }

  // assertToolSurface already rejected retired and commerce-shaped tool names.
  // The instructions the model reads must not name them either.
  const serverInstructions = toolList._meta?.instructions ?? "";
  for (const retired of RETIRED_TOOLS) {
    assert(!serverInstructions.includes(retired), `Server instructions still reference the retired tool ${retired}.`);
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

  // Public read: anyone, including an unauthenticated reviewer, can read the
  // commons. This is the half of the product that makes the map worth opening
  // twice, so it must work with no credentials at all.
  const notesResult = await client.callTool({
    name: "list_atlas_notes",
    arguments: { countySlug: "riverside-ca", limit: 5 },
  });
  const notes = structuredContent(notesResult, "list_atlas_notes");
  assert(notes.type === "atlasPublicNoteList", "list_atlas_notes returned wrong type.");
  assert(Array.isArray(notes.notes), "list_atlas_notes must return a notes array.");
  assert(
    notes.notes.every((note) => note.status === undefined || note.status === "visible"),
    "list_atlas_notes must only return visible notes; pending or removed notes must never reach a reader.",
  );
  assert(
    notes.notes.every((note) => !("authorEmail" in note) && !("authorId" in note) && !("identity" in note)),
    "list_atlas_notes leaked author identity fields; notes carry a pseudonymous handle only.",
  );

  // Invite-write posture: an unauthenticated post must be refused honestly, not
  // silently accepted and not crashed on. This is the single most important
  // negative on the whole surface — it is what keeps a public app from becoming
  // an open write endpoint.
  const anonymousWrite = await client.callTool({
    name: "write_atlas_note",
    arguments: {
      operation: "post",
      countySlug: "riverside-ca",
      placeId: "eastvale",
      placeLabel: "Eastvale",
      body: "Submission verifier probe: this post must be refused.",
      clientRequestId: `submission-verifier-${lookupRadiusMeters}`,
    },
  });
  const anonymousWriteText = textContent(anonymousWrite);
  assert(
    anonymousWrite.isError === true || /sign in|identity|invite|not authorized|permission|scope/i.test(anonymousWriteText),
    "An unauthenticated write_atlas_note post must be refused with an honest reason.",
  );
  assert(
    !/published|posted|added your note/i.test(anonymousWriteText),
    "An unauthenticated write_atlas_note post must not claim the note was published.",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        mcpUrl: mcpUrl.toString(),
        publicPages: Object.fromEntries(
          Object.entries(publicPages).map(([name, page]) => [name, { status: page.status, bytes: page.bytes }]),
        ),
        challengeStatus,
        tools: actualTools,
        lookupPlaceCount: lookup.places.length,
        lookupPublicFields: Object.keys(lookup).sort(),
        selectedCountySceneId: selectedCounty.sceneId,
        countyQuestionTopic: countyQuestion.topic,
        unsupportedCountyQuestion: unsupportedQuestion.supported,
        sceneMetaPlaces: countyResult._meta.scene.world.places.length,
        publicNotesRead: notes.notes.length,
        anonymousWriteRefused: true,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
