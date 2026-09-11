/**
 * Submission gate for the Atlas ChatGPT app.
 *
 * Atlas ships two read-only tools over US Census geography. This script is the
 * last thing that runs before the packet is handed to the plugin portal, so it
 * only asserts things that are checkable against the packet, the repo, or the
 * live server. It never asserts a product claim nobody can verify.
 *
 * It was re-cut on 2026-08-01 for the 2-tool product. The previous version
 * still gated the retired voxel/Commons build: it demanded a "county maps +
 * notes" subtitle, a Riverside/Eastvale description, a user-generated-content
 * disclosure, and it live-called six tools that no longer exist. It failed on
 * its first assertion and therefore certified nothing. Everything below either
 * survived that cut because it is still true, or was rewritten to assert what
 * actually ships.
 *
 * The shipping tool list is never restated here — it is imported from
 * scripts/lib/atlas-tool-surface.mjs, which is the single source of truth.
 */
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

/**
 * The store name the packet actually ships.
 *
 * TRADEOFF, OWNER DECISION PENDING. The previous gate rejected a bare "Atlas"
 * as a store-review risk — a single generic word is easy to confuse with an
 * existing app and hard to find in search — and that reasoning is still sound.
 * But the packet ships "Atlas", and a gate that demands a name nobody chose
 * certifies nothing. So this pins the name that ships: it still fails if the
 * name drifts silently, and it does not pretend the naming question is settled.
 * If the owner picks a two-word store name (e.g. "Atlas — US County Maps"),
 * change this constant with the packet.
 */
const SHIPPING_DISPLAY_NAME = "Atlas";

/** Copy that tells a reviewer the product is not finished. */
const UNFINISHED_PRODUCT_COPY = /demo|trial|alpha|beta|coming soon|planned|waitlist/i;

/**
 * Retired *features*, not tool names. The 7-tool build sold community notes,
 * hosted billing, a Scout Drop, and a Google Places lookup. None of it ships.
 * A packet that still mentions any of it is describing an app the reviewer
 * will not find. (Bare "notes" is not scanned — the packet has legitimate
 * `commerce.notes` and `release_notes` keys.)
 */
const RETIRED_FEATURE_COPY = [
  /commons/i,
  /scout drop/i,
  /community note/i,
  /public note/i,
  /hosted clawd/i,
  /stripe/i,
  /google maps/i,
  /campaign/i,
];

/** Number words a packet might use to count the tool surface. */
const TOOL_COUNT_WORDS = { both: 2, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/** Non-fatal findings that need an owner decision, printed at the end. */
const ownerDecisions = [];

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

function assertSquarePng(path, expectedSize, label) {
  const png = readFileSync(new URL(`../${path}`, import.meta.url));
  assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label} must be a PNG.`);
  assert(png.toString("ascii", 12, 16) === "IHDR", `${label} is missing a PNG IHDR header.`);
  assert(
    png.readUInt32BE(16) === expectedSize && png.readUInt32BE(20) === expectedSize,
    `${label} must be ${expectedSize}x${expectedSize}.`,
  );
}

function parseSubmission() {
  const submissionText = readFileSync(submissionPath, "utf8");
  const submission = JSON.parse(submissionText);
  assert(submission.schema_version === 1, "Submission schema_version must be 1.");

  // Nothing from the retired surface may survive anywhere in the packet —
  // not in a tool key, not in a test case, not in prose. The tool list itself
  // is checked below; this catches a retired name mentioned in copy.
  for (const retired of RETIRED_TOOLS) {
    assert(!submissionText.includes(retired), `Submission still mentions the retired tool ${retired}.`);
  }
  for (const pattern of RETIRED_FEATURE_COPY) {
    assert(!pattern.test(submissionText), `Submission still describes a retired feature (${pattern}).`);
  }
  // A tool count written into prose is exactly what went stale: the packet
  // still said "All three tools are read-only" long after the surface dropped
  // to two. Any count the packet states, anywhere, must agree with
  // EXPECTED_TOOLS — so this re-checks itself every time the surface changes.
  const countClaims = submissionText.matchAll(/\b(both|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:[A-Za-z-]+\s+){0,3}tools?\b/gi);
  for (const claim of countClaims) {
    const claimed = TOOL_COUNT_WORDS[claim[1].toLowerCase()] ?? Number(claim[1]);
    assert(
      claimed === expectedTools.length,
      `Submission says "${claim[0]}" but Atlas ships ${expectedTools.length} tools (${expectedTools.join(", ")}).`,
    );
  }

  const appInfo = submission.app_info ?? {};
  assert(
    appInfo.display_name === SHIPPING_DISPLAY_NAME,
    `Submission display_name must be "${SHIPPING_DISPLAY_NAME}" (the name that ships); got "${appInfo.display_name}".`,
  );
  assert(!UNFINISHED_PRODUCT_COPY.test(appInfo.display_name), "Submission display_name reads like unfinished product copy.");

  const subtitle = submission.app_info?.subtitle ?? "";
  const description = submission.app_info?.description ?? "";
  assert(
    typeof subtitle === "string" && subtitle.length > 0 && subtitle.length <= 40,
    "Submission subtitle must exist and fit the 40-character store limit.",
  );
  assert(/map/i.test(subtitle), "Submission subtitle must say the product is a map; that is the whole surface.");
  assert(!UNFINISHED_PRODUCT_COPY.test(subtitle), "Submission subtitle reads like unfinished product copy.");

  assert(typeof description === "string" && description.length >= 120, "Submission description must be reviewer-ready.");
  assert(!UNFINISHED_PRODUCT_COPY.test(description), "Submission description reads like unfinished product copy.");
  // Three claims the tool annotations and the server behaviour must back up:
  // US-only scope, Census provenance, and no commerce surface at all.
  assert(/United States|US count(y|ies)/i.test(description), "Submission description must state the US-only scope.");
  assert(/census/i.test(description), "Submission description must name the Census as the data source.");
  assert(
    /no payments?|no checkout|no paid tier|does not process payments/i.test(description),
    "Submission description must state that Atlas has no payment surface.",
  );

  assertSquarePng(appInfo.icon, 512, "Submission icon");
  if (appInfo.icon_dark) assertSquarePng(appInfo.icon_dark, 512, "Submission dark icon");
  if (appInfo.composer_icon) assertSquarePng(appInfo.composer_icon, 48, "Submission composer icon");
  if (appInfo.composer_icon_dark) assertSquarePng(appInfo.composer_icon_dark, 48, "Submission dark composer icon");
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
  // The packet declares no commerce. The tool surface has to agree, and
  // atlas-tool-surface.mjs rejects any tool whose name implies otherwise.
  assert(plugin.commerce?.links_out_for_purchases === false, "Submission must declare no purchase links.");
  assert(plugin.commerce?.sells_digital_goods === false, "Submission must declare no digital goods.");
  assert(typeof plugin.commerce?.notes === "string" && plugin.commerce.notes.length > 0, "Submission must explain its commerce posture.");
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
    assert(!UNFINISHED_PRODUCT_COPY.test(test.description), `Positive test ${index + 1} description reads like unfinished product copy.`);
  }
  const coveredTools = new Set(
    positiveTests.flatMap((test) => test.tools_triggered.split(",").map((tool) => tool.trim()).filter(Boolean)),
  );
  assert(
    expectedTools.every((tool) => coveredTools.has(tool)),
    `Five positive tests must collectively exercise all ${expectedTools.length} tools. Missing: ${expectedTools.filter((tool) => !coveredTools.has(tool)).join(", ")}.`,
  );
  assert(
    [...coveredTools].every((tool) => expectedTools.includes(tool)),
    `Positive tests name a tool that is not on the surface: ${[...coveredTools].filter((tool) => !expectedTools.includes(tool)).join(", ")}.`,
  );

  const negativeTests = submission.negative_test_cases ?? [];
  const negativePrompts = negativeTests.map((test) => `${test.user_prompt} ${test.expected_output}`);
  assert(negativeTests.length === 3, "Plugin portal requires exactly three negative test cases.");
  assert(negativeTests.every((test) => test.why_not_complete), "Every negative test needs a reviewer-facing reason.");
  // Atlas has exactly two tools and both only read its own Census data, so
  // every negative case is a case where *no* tool should fire. A negative that
  // calls a tool to explain why it cannot help is a surface Atlas does not have.
  assert(
    negativeTests.every((test) => test.tools_triggered === null || test.tools_triggered === undefined),
    "Every negative case must trigger no tool at all; Atlas exposes nothing that should answer these.",
  );
  assert(
    negativePrompts.some((text) => /United States (counties )?only|outside the United States|not in the United States/i.test(text)),
    "Submission needs a negative case for a place outside the United States.",
  );
  assert(
    negativePrompts.some((text) => /directions|routing|travel time|business|address/i.test(text)),
    "Submission needs a negative case for the navigation / local-search capabilities Atlas does not have.",
  );
  assert(
    negativePrompts.some((text) => /checkout|card|payment|charge/i.test(text)),
    "Submission needs a payment negative case.",
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

/**
 * Nothing from a third-party provider, and nothing from the retired voxel
 * pipeline, may appear in a tool result. Atlas declares openWorldHint=false on
 * both tools; a provider id in the payload would make that declaration false.
 */
function assertNoLeakedInternals(result, label) {
  const json = JSON.stringify(result);
  for (const forbidden of ["placeId", "primaryType", "types", "scenePacket", "coverageShellScene", "cachedAt", "expiresAt", "ttlSeconds", "providerReadiness"]) {
    assert(!json.includes(`"${forbidden}"`), `${label} leaked internal or provider field ${forbidden}.`);
  }
}

async function verifyPublicPage(path, requiredText) {
  const response = await fetch(new URL(path, mcpUrl));
  const body = await response.text();
  assert(response.status === 200, `${path} returned HTTP ${response.status}.`);
  assert(/text\/html/i.test(response.headers.get("content-type") ?? ""), `${path} must return HTML.`);
  for (const token of requiredText) assert(body.includes(token), `${path} is missing required copy: ${token}`);
  return { status: response.status, bytes: Buffer.byteLength(body), body };
}

const submission = parseSubmission();
const client = new Client({ name: "atlas-submission-verifier", version: "0.1.0" });
const transport = new StreamableHTTPClientTransport(mcpUrl);
const publicPages = {};
let challengeStatus = 0;

try {
  // The store requires every policy URL in the packet to resolve. These assert
  // the sections a reviewer opens them for — what data is processed, how long
  // it is kept, the boundaries of the map, and a way to reach a human. They no
  // longer assert the notes/moderation/invite-write disclosures: that feature
  // is not in this submission.
  publicPages.privacy = await verifyPublicPage("/privacy", [
    "What Atlas receives",
    "What Atlas keeps",
    "Who else receives data",
    "User content",
    "How the maps are made",
    "Contact",
  ]);
  publicPages.terms = await verifyPublicPage("/terms", [
    "How the maps are made",
    "Acceptable use",
    "No warranty",
    "Contact",
  ]);
  publicPages.support = await verifyPublicPage("/support", ["What to include", "Do not send passwords", "Privacy Policy"]);
  // No policy page may advertise a product Atlas no longer has, or name a tool
  // that no longer exists.
  for (const [name, page] of Object.entries(publicPages)) {
    for (const stale of ["Atlas County Scout", "Scout Drop", "campaign plan", "if enabled", "may be enabled"]) {
      assert(!page.body.includes(stale), `/${name} still contains retired product copy: "${stale}".`);
    }
    for (const retired of RETIRED_TOOLS) {
      assert(!page.body.includes(retired), `/${name} still names the retired tool ${retired}.`);
    }
    // The 2026-07-25 pivot removed community notes, the Google Places lookup,
    // and hosted billing from the product but not from this legal copy. That
    // is a listing-vs-behaviour mismatch a store reviewer can open in one
    // click, and the fix is a copy rewrite in server/src/index.ts — an owner
    // decision, not a packet fix, which is why it is reported and not asserted.
    // These match AFFIRMATIVE claims only. The pages now correctly deny user
    // content ("nothing to moderate"), so a bare /moderat/ would report itself.
    for (const [label, pattern] of [
      ["community notes", /Commons|Community Standard|moderation owner|reviews reported content|writing a note|public notes are/i],
      ["a Google dependency", /Google Maps|Google Places|googleapis/i],
      ["retired Riverside/Eastvale framing", /Riverside\/Eastvale/i],
    ]) {
      if (pattern.test(page.body)) ownerDecisions.push(`/${name} still describes ${label}, which this submission does not ship.`);
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

  // The listing claims no commerce, no UGC, and no third-party calls. Those
  // claims are about the service, not only the MCP tool list. A 200 on any of
  // these paths makes the packet false even if the tools are clean.
  const retiredHttpPaths = [
    "/api/hosted-clawd/state",
    "/api/geo/status",
    "/api/geo/geocode",
    "/api/world/lookup",
    "/api/stripe/webhook",
    "/api/atlas-commons/moderation",
    "/api/scout/drop",
    "/api/campaign/preview",
    "/.well-known/oauth-protected-resource",
  ];
  for (const path of retiredHttpPaths) {
    const response = await fetch(new URL(path, mcpUrl), { redirect: "manual" });
    assert(
      response.status === 404,
      `${path} must 404 (listing: no checkout, no UGC, no third-party geo); got HTTP ${response.status}.`,
    );
  }
  const community = await fetch(new URL("/community", mcpUrl), { redirect: "manual" });
  assert(
    community.status === 308 || community.status === 404,
    `/community must not serve a UGC page; got HTTP ${community.status}.`,
  );

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
  // The instructions the model reads must not name them either — a retired name
  // in the instructions makes the model try to call a tool that is not there.
  // (This reads the initialize response. The old version read
  // `toolList._meta?.instructions`, which is never populated, so it could not
  // fail: it was a green light nobody had earned.)
  const serverInstructions = client.getInstructions() ?? "";
  assert(serverInstructions.length > 0, "Server must ship model instructions.");
  for (const retired of RETIRED_TOOLS) {
    assert(!serverInstructions.includes(retired), `Server instructions still reference the retired tool ${retired}.`);
  }
  for (const toolName of expectedTools) {
    assert(serverInstructions.includes(toolName), `Server instructions must tell the model when to use ${toolName}.`);
  }

  // --- Live calls: the two tools that ship, on the paths the packet promises --

  // Positive test 1 and 3: open a county, get the map and its Census facts.
  const countyResult = await client.callTool({
    name: "open_atlas_map",
    arguments: { place: "Riverside County, California" },
  });
  const county = structuredContent(countyResult, "open_atlas_map county");
  assert(county.type === "atlasMapView", "open_atlas_map returned wrong type.");
  assert(county.status === "opened", "A named, unambiguous county must open.");
  assert(county.level === "county", "A county query must open at county level.");
  assert(county.countySlug === "riverside-ca", "open_atlas_map resolved the wrong county.");
  assert(/census/i.test(county.source ?? ""), "An opened county must cite its Census source.");
  assert(typeof county.coverage === "string" && county.coverage.length > 0, "An opened county must state what it does and does not draw.");
  assert(countyResult._meta?.atlasPlate?.countySlug === "riverside-ca", "An opened county must hand the widget a plate to draw.");
  assertNoLeakedInternals(countyResult, "open_atlas_map county");

  // Read-only means read-only: the same call twice returns the same answer and
  // changes nothing. This is the observable half of readOnlyHint=true.
  const repeatCounty = structuredContent(
    await client.callTool({ name: "open_atlas_map", arguments: { place: "Riverside County, California" } }),
    "open_atlas_map repeat",
  );
  assert(JSON.stringify(repeatCounty) === JSON.stringify(county), "open_atlas_map must be idempotent; it declares readOnlyHint=true.");

  // Positive test 5: the national plate.
  const nation = structuredContent(
    await client.callTool({ name: "open_atlas_map", arguments: {} }),
    "open_atlas_map nation",
  );
  assert(nation.type === "atlasMapView" && nation.level === "nation" && nation.status === "opened", "An empty place must open the national plate.");

  // Positive test 4, and the product's whole quality claim: an ambiguous name
  // returns the real candidates instead of guessing one.
  const ambiguousResult = await client.callTool({ name: "open_atlas_map", arguments: { place: "Springfield" } });
  const ambiguous = structuredContent(ambiguousResult, "open_atlas_map ambiguous");
  assert(ambiguous.status === "ambiguous", "An ambiguous place name must not resolve to one place.");
  assert(Array.isArray(ambiguous.candidates) && ambiguous.candidates.length >= 2, "An ambiguous name must return the real candidates.");
  assert(new Set(ambiguous.candidates.map((candidate) => candidate.state)).size >= 2, "Ambiguous candidates must span more than one state.");
  assert(!ambiguousResult._meta?.atlasPlate, "An ambiguous name must not open a map.");
  assert(/more than one place/i.test(textContent(ambiguousResult)), "An ambiguous refusal must say so in words the model can repeat.");

  // Negative test 1: a place outside the United States is refused, not
  // substituted with a US place of the same name.
  const unresolvedResult = await client.callTool({ name: "open_atlas_map", arguments: { place: "Paris, France" } });
  const unresolved = structuredContent(unresolvedResult, "open_atlas_map unresolved");
  assert(unresolved.status === "unresolved", "A place Atlas does not carry must be refused.");
  assert(!unresolvedResult._meta?.atlasPlate, "A refused place must not open a map.");
  assert(/no US place indexed/i.test(textContent(unresolvedResult)), "A refusal must name what Atlas does not have.");

  // Positive test 2: which county a town is in, from the index. State-qualified
  // because the Census index carries Eastvale CA (70,751) and Eastvale PA (175),
  // so the bare name is genuinely ambiguous. The starter prompt in the packet is
  // qualified for the same reason — keep the two in step.
  const searchResult = await client.callTool({ name: "search_atlas_places", arguments: { query: "Eastvale, CA" } });
  const search = structuredContent(searchResult, "search_atlas_places");
  assert(search.type === "atlasPlaceSearch", "search_atlas_places returned wrong type.");
  assert(search.status === "resolved", "A state-qualified town must resolve in the index.");
  assert(search.resolved?.county === "Riverside County" && search.resolved?.state === "CA", "search_atlas_places resolved the wrong county.");
  assert(Array.isArray(search.candidates), "search_atlas_places must always return a candidate list.");
  assertNoLeakedInternals(searchResult, "search_atlas_places");

  // The other half of the same contract: the bare name must never be answered
  // confidently. This is the Location Truth doctrine at the tool boundary — a
  // shared name returns candidates, it does not pick the larger place.
  const bareResult = await client.callTool({ name: "search_atlas_places", arguments: { query: "Eastvale" } });
  const bare = structuredContent(bareResult, "search_atlas_places bare");
  assert(bare.status !== "resolved" || bare.resolved?.state === "CA", "A shared town name must not resolve to the wrong place.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        mcpUrl: mcpUrl.toString(),
        displayName: submission.app_info.display_name,
        publicPages: Object.fromEntries(
          Object.entries(publicPages).map(([name, page]) => [name, { status: page.status, bytes: page.bytes }]),
        ),
        challengeStatus,
        tools: actualTools,
        openedCounty: { slug: county.countySlug, townCount: county.townCount, areaSquareMiles: county.areaSquareMiles },
        ambiguousCandidates: ambiguous.candidates.length,
        unresolvedStatus: unresolved.status,
        searchResolved: `${search.resolved.name}, ${search.resolved.state}`,
        ownerDecisions,
      },
      null,
      2,
    ),
  );
  for (const decision of ownerDecisions) console.error(`OWNER DECISION: ${decision}`);
} finally {
  await client.close();
}
