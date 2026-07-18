#!/usr/bin/env node
// Release gate: validates a freshly deployed Atlas production backend end to
// end — readiness, prod guards, W6 ops surfaces, and the V1 wire contract
// (camera focus, spec-not-scene drafts, save surface hidden).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = (process.env.ATLAS_PUBLIC_BASE_URL ?? "https://atlas-backend-production-e6fc.up.railway.app").replace(/\/+$/, "");
const gates = [];
const blockers = [];
const approvedPublicTools = [
  "select_county",
  "ask_county_question",
  "render_voxel_county",
  "lookup_world_places",
  "preview_scout_drop",
  "preview_campaign_engine",
  "get_upgrade_options",
];
const expectedWidgetUri = "ui://widget/atlas-city-world-0781v.html";
const widgetTools = new Set([
  "select_county",
  "ask_county_question",
  "render_voxel_county",
  "preview_scout_drop",
  "preview_campaign_engine",
]);

async function gate(name, fn) {
  try {
    const detail = await fn();
    gates.push({ name, ok: true, ...(detail ? { detail } : {}) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    gates.push({ name, ok: false, message });
    blockers.push(`${name}: ${message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertExactApprovedToolSet(tools) {
  assert(Array.isArray(tools), "MCP tools response must contain a tools array");
  const names = tools.map((tool, index) => {
    const name = tool?.name;
    assert(typeof name === "string" && name.length > 0, `MCP tool at index ${index} has no valid name`);
    return name;
  });
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);

  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name, count]) => `${name} (${count}x)`)
    .sort();
  const approvedSet = new Set(approvedPublicTools);
  const actualSet = new Set(names);
  const missing = approvedPublicTools.filter((name) => !actualSet.has(name));
  const extras = [...actualSet].filter((name) => !approvedSet.has(name)).sort();

  assert(
    duplicates.length === 0 && missing.length === 0 && extras.length === 0 && names.length === approvedPublicTools.length,
    [
      `public MCP tool contract mismatch: expected exactly ${approvedPublicTools.length} approved tools`,
      `missing=[${missing.join(", ")}]`,
      `extra=[${extras.join(", ")}]`,
      `duplicates=[${duplicates.join(", ")}]`,
      `actual=[${names.slice().sort().join(", ")}]`,
    ].join("; "),
  );

  return names.slice().sort();
}

function assertWidgetToolResources(tools) {
  for (const tool of tools) {
    const template = tool?._meta?.["openai/outputTemplate"];
    const resourceUri = tool?._meta?.ui?.resourceUri;
    if (widgetTools.has(tool.name)) {
      assert(template === expectedWidgetUri, `${tool.name} outputTemplate expected ${expectedWidgetUri}, got ${template ?? "missing"}`);
      assert(resourceUri === expectedWidgetUri, `${tool.name} resourceUri expected ${expectedWidgetUri}, got ${resourceUri ?? "missing"}`);
    } else {
      assert(template === undefined && resourceUri === undefined, `${tool.name} must not claim a widget resource`);
    }
  }
}

function structuredContent(result, toolName) {
  assert(result && typeof result === "object", `${toolName} returned no result object`);
  assert(!result.isError, `${toolName} returned an MCP error`);
  assert(result.structuredContent && typeof result.structuredContent === "object", `${toolName} returned no structuredContent`);
  return result.structuredContent;
}

function runContractSelfTest() {
  const tool = (name) => ({
    name,
    ...(widgetTools.has(name)
      ? { _meta: { "openai/outputTemplate": expectedWidgetUri, ui: { resourceUri: expectedWidgetUri } } }
      : {}),
  });
  const fixtures = [
    {
      name: "accepts_exact_approved_set_in_any_order",
      tools: approvedPublicTools.slice().reverse().map(tool),
      expectedOk: true,
    },
    {
      name: "rejects_missing_tool",
      tools: approvedPublicTools.slice(0, -1).map(tool),
      expectedOk: false,
      expectedMessage: "missing=[get_upgrade_options]",
    },
    {
      name: "rejects_extra_tool",
      tools: [...approvedPublicTools, "unapproved_release_tool"].map(tool),
      expectedOk: false,
      expectedMessage: "extra=[unapproved_release_tool]",
    },
    {
      name: "rejects_duplicate_tool",
      tools: [...approvedPublicTools, "select_county"].map(tool),
      expectedOk: false,
      expectedMessage: "duplicates=[select_county (2x)]",
    },
    {
      name: "rejects_stale_widget_uri",
      tools: approvedPublicTools.map(tool).map((candidate) =>
        candidate.name === "select_county"
          ? { ...candidate, _meta: { "openai/outputTemplate": "ui://widget/atlas-city-world-v1.html", ui: { resourceUri: "ui://widget/atlas-city-world-v1.html" } } }
          : candidate,
      ),
      expectedOk: false,
      expectedMessage: `select_county outputTemplate expected ${expectedWidgetUri}`,
    },
    {
      name: "rejects_widget_claim_on_non_widget_tool",
      tools: approvedPublicTools.map(tool).map((candidate) =>
        candidate.name === "lookup_world_places"
          ? { ...candidate, _meta: { "openai/outputTemplate": expectedWidgetUri, ui: { resourceUri: expectedWidgetUri } } }
          : candidate,
      ),
      expectedOk: false,
      expectedMessage: "lookup_world_places must not claim a widget resource",
    },
  ];

  const results = fixtures.map((fixture) => {
    try {
      assertExactApprovedToolSet(fixture.tools);
      assertWidgetToolResources(fixture.tools);
      assert(fixture.expectedOk, `${fixture.name} unexpectedly passed`);
      return { name: fixture.name, ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      assert(!fixture.expectedOk, `${fixture.name} unexpectedly failed: ${message}`);
      assert(message.includes(fixture.expectedMessage), `${fixture.name} returned the wrong failure: ${message}`);
      return { name: fixture.name, ok: true, rejectedAsExpected: true };
    }
  });

  return {
    ok: true,
    mode: "self-test",
    networkCalls: 0,
    approvedPublicTools,
    fixtures: results,
  };
}

if (process.argv.includes("--self-test")) {
  console.log(JSON.stringify(runContractSelfTest(), null, 2));
  process.exit(0);
}

const opsToken = process.env.ATLAS_OPS_TOKEN?.trim();

async function getJson(path) {
  // Ops endpoints require the operator token in production when configured.
  const headers = opsToken && path.startsWith("/api/ops/") ? { "x-atlas-ops-token": opsToken } : undefined;
  const response = await fetch(`${baseUrl}${path}`, headers ? { headers } : undefined);
  return { status: response.status, body: response.status === 404 ? null : await response.json().catch(() => null) };
}

// Cold-start protocol: first requests after a deploy can flake — retry.
await gate("ready_deep", async () => {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const { status, body } = await getJson("/ready");
      last = `status ${status}`;
      if (status === 200 && body?.ok === true) {
        assert(body.scenePacketCache?.cacheBackend === "redis", `cacheBackend expected redis, got ${body.scenePacketCache?.cacheBackend}`);
        assert(body.scenePacketCache?.redisReachable === true, "redis not reachable");
        assert("claimedCount" in (body.scenePacketCache ?? {}), "W6 claimedCount missing from /ready");
        assert(body.configBlockerCount === 0, `configBlockers: ${JSON.stringify(body.configBlockers)}`);
        return `redis ok, queueDepth ${body.scenePacketCache.queueDepth}, claimed ${body.scenePacketCache.claimedCount}`;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  throw new Error(`/ready not green after 4 attempts (${last})`);
});

await gate("widget_assets_cross_origin", async () => {
  // Real ChatGPT sandboxed iframes fetch widget assets cross-origin — the
  // first G8 session found a blank widget because ACAO was missing.
  const response = await fetch(`${baseUrl}/widget/component.js`, {
    headers: { Origin: "https://example.web-sandbox.oaiusercontent.com" },
  });
  assert(response.status === 200, `component.js expected 200, got ${response.status}`);
  const acao = response.headers.get("access-control-allow-origin");
  assert(acao === "*", `component.js ACAO expected *, got ${acao}`);
});

await gate("emulator_404_in_prod", async () => {
  const response = await fetch(`${baseUrl}/emulator?county=orange-ca`);
  assert(response.status === 404, `/emulator expected 404 in production, got ${response.status}`);
});

await gate("mcp_stats_endpoint", async () => {
  const { status, body } = await getJson("/api/ops/mcp-stats");
  assert(status === 200 && body?.ok === true && body?.mcp?.tools, `mcp-stats bad response (${status})`);
  return `tools tracked: ${Object.keys(body.mcp.tools).length}`;
});

const client = new Client({ name: "atlas-release-gate", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)));

await gate("mcp_tools_list", async () => {
  const { tools } = await client.listTools();
  const toolNames = assertExactApprovedToolSet(tools);
  assertWidgetToolResources(tools);
  return `exact approved set; widget ${expectedWidgetUri}: ${toolNames.join(", ")}`;
});

await gate("mcp_widget_resource", async () => {
  const { resources } = await client.listResources();
  const matches = resources.filter((resource) => resource.uri === expectedWidgetUri);
  assert(matches.length === 1, `expected one registered ${expectedWidgetUri} resource, got ${matches.length}`);
  const resource = await client.readResource({ uri: expectedWidgetUri });
  assert(Array.isArray(resource.contents) && resource.contents.length > 0, `${expectedWidgetUri} returned no contents`);
  assert(resource.contents.every((content) => content.uri === expectedWidgetUri), `${expectedWidgetUri} returned mismatched content URIs`);
  return `${resource.contents.length} resource content block(s)`;
});

await gate("select_county_contract", async () => {
  const result = await client.callTool({ name: "select_county", arguments: { countySlug: "riverside-ca" } });
  const meta = result._meta ?? {};
  assert(result.structuredContent?.type === "voxelSceneSummary", "not a voxelSceneSummary");
  assert(result.structuredContent?.cameraIntent?.type, "cameraIntent missing (W3)");
  assert(meta.scene, "_meta.scene missing");
  assert(meta.cameraFocus?.preset?.id === "focus", "_meta.cameraFocus missing (W3 trim)");
  assert(!("cityWorldScene" in meta), "_meta.cityWorldScene must not ship (payload)");
  assert(!("hostedClawd" in meta), "_meta.hostedClawd must be absent with ATLAS_SAVE_SURFACE=off");
  return `cameraIntent ${result.structuredContent.cameraIntent.type}`;
});

await gate("generated_draft_spec_contract", async () => {
  let lastState = "never-called";
  for (let attempt = 1; attempt <= 12; attempt++) {
    const result = await client.callTool({
      name: "render_voxel_county",
      arguments: { countySlug: "apache-az", includeGeneratedDraft: true },
    });
    const meta = result._meta ?? {};
    assert(!("generatedDraftScene" in meta), "_meta.generatedDraftScene must not ship (0.76-T)");
    assert(!("hostedClawd" in meta), "_meta.hostedClawd must be absent with ATLAS_SAVE_SURFACE=off");
    if (meta.generatedDraftSpec) {
      const specChars = JSON.stringify(meta.generatedDraftSpec).length;
      assert(specChars < 10000, `generatedDraftSpec ${specChars} chars >= 10KB ceiling`);
      return `spec ${specChars} chars after ${attempt} attempt(s)`;
    }
    lastState = meta.generatedDraftPacket?.state ?? "no-packet-meta";
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`generatedDraftSpec never landed (last packet state: ${lastState})`);
});

await gate("county_question_map_first", async () => {
  const result = await client.callTool({
    name: "ask_county_question",
    arguments: { question: "Where is the park?", countySlug: "riverside-ca" },
  });
  const meta = result._meta ?? {};
  assert(result.structuredContent?.type === "countyQuestionAnswer", "not a countyQuestionAnswer");
  assert(meta.scene, "ask_county_question must attach _meta.scene (W3.2)");
  if (result.structuredContent.supported) {
    assert(result.structuredContent.cameraIntent, "supported place answer should carry cameraIntent (W3.4)");
  }
  return `supported=${result.structuredContent.supported}, intent=${result.structuredContent.cameraIntent?.type ?? "none"}`;
});

await gate("world_lookup_boundary", async () => {
  const result = await client.callTool({
    name: "lookup_world_places",
    arguments: { countySlug: "riverside-ca", placeId: "eastvale", radiusMeters: 3000 },
  });
  const lookup = structuredContent(result, "lookup_world_places");
  assert(lookup.type === "worldPlaceLookup", "lookup_world_places returned the wrong structured type");
  assert(Array.isArray(lookup.places), "lookup_world_places places must be an array");
  const lookupJson = JSON.stringify(lookup);
  for (const forbidden of ["coordinates", "cache", "providerReadiness", "runtime", "ttlSeconds", "cachedAt", "expiresAt"]) {
    assert(!lookupJson.includes(`\"${forbidden}\"`), `lookup_world_places must not expose internal ${forbidden} metadata`);
  }
  assert(!("hostedClawd" in (result._meta ?? {})), "lookup_world_places must not expose Hosted Clawd with ATLAS_SAVE_SURFACE=off");
  return `${lookup.places.length} normalized places, public metadata minimized`;
});

let releaseScoutPreview = null;
await gate("scout_preview_contract", async () => {
  const result = await client.callTool({
    name: "preview_scout_drop",
    arguments: {
      countySlug: "riverside-ca",
      nodeId: "eastvale",
      locationLabel: "Eastvale",
      businessType: "mobile detailing",
      goal: "Find the strongest first drop for a local mobile detailing offer.",
    },
  });
  const scout = structuredContent(result, "preview_scout_drop");
  assert(scout.type === "scoutPreview", "preview_scout_drop returned the wrong structured type");
  assert(typeof scout.id === "string" && scout.id.length > 0, "preview_scout_drop returned no preview id");
  assert(scout.alphaBoundary?.mode === "session_only_alpha", "Scout preview must remain session-only");
  assert(scout.alphaBoundary?.savesState === false, "Scout preview must not claim saved state");
  assert(scout.alphaBoundary?.executesActions === false, "Scout preview must not execute actions");
  assert(!("hostedClawd" in (result._meta ?? {})), "preview_scout_drop must not expose Hosted Clawd with ATLAS_SAVE_SURFACE=off");
  releaseScoutPreview = scout;
  return `preview ${scout.id}, session-only`;
});

await gate("campaign_preview_contract", async () => {
  const result = await client.callTool({
    name: "preview_campaign_engine",
    arguments: {
      scoutPreviewId: releaseScoutPreview?.id ?? "release-gate-stale-scout-preview",
      countySlug: releaseScoutPreview?.countySlug ?? "riverside-ca",
      nodeId: "eastvale",
      locationLabel: "Eastvale",
      businessType: releaseScoutPreview?.businessType ?? "mobile detailing",
      goal: releaseScoutPreview?.goal ?? "Find the strongest first drop for a local mobile detailing offer.",
    },
  });
  const campaign = structuredContent(result, "preview_campaign_engine");
  assert(campaign.type === "campaignPreview", "preview_campaign_engine returned the wrong structured type");
  assert(campaign.alphaBoundary?.mode === "session_only_alpha", "Campaign preview must remain session-only");
  assert(campaign.alphaBoundary?.savesState === false, "Campaign preview must not claim saved state");
  assert(campaign.alphaBoundary?.executesActions === false, "Campaign preview must not execute actions");
  assert(
    Array.isArray(campaign.guardrails) && campaign.guardrails.some((guardrail) => /manual|no posts|no DMs|no ad spend/i.test(guardrail)),
    "Campaign preview must keep manual-execution guardrails visible",
  );
  assert(!("hostedClawd" in (result._meta ?? {})), "preview_campaign_engine must not expose Hosted Clawd with ATLAS_SAVE_SURFACE=off");
  return `campaign ${campaign.id ?? "ready"}, session-only`;
});

await gate("upgrade_options_closed_contract", async () => {
  const result = await client.callTool({ name: "get_upgrade_options", arguments: { trigger: "save_campaign" } });
  const upgrade = structuredContent(result, "get_upgrade_options");
  assert(upgrade.type === "upgradeOptions", "get_upgrade_options returned the wrong structured type");
  assert(upgrade.free?.label === "Atlas V1", "production save surface must return the Atlas V1 boundary");
  assert(!("hostedClawd" in upgrade), "get_upgrade_options must not expose owner-gated Hosted Clawd capabilities");
  assert(!("hostedClawd" in (result._meta ?? {})), "get_upgrade_options metadata must not expose Hosted Clawd");
  assert(
    Array.isArray(upgrade.unavailableActions) &&
      upgrade.unavailableActions.some((item) => /does not start checkout, charge money/i.test(item)),
    "get_upgrade_options must state that checkout and money remain closed",
  );
  return "Atlas V1 boundary; checkout and money closed";
});

await gate("stats_counted_all_seven_tool_calls", async () => {
  const { body } = await getJson("/api/ops/mcp-stats");
  const callCounts = Object.fromEntries(
    approvedPublicTools.map((toolName) => [toolName, body?.mcp?.tools?.[toolName]?.calls ?? 0]),
  );
  const uncounted = approvedPublicTools.filter((toolName) => callCounts[toolName] < 1);
  assert(uncounted.length === 0, `W6.5 instrumentation did not count release-gate calls for: ${uncounted.join(", ")}`);
  return approvedPublicTools.map((toolName) => `${toolName}=${callCounts[toolName]}`).join(", ");
});

await client.close();

const summary = {
  ok: blockers.length === 0,
  update: "release-gate-v1",
  baseUrl,
  gates,
  blockerCount: blockers.length,
  blockers,
};
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exitCode = 1;
