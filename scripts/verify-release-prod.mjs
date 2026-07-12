#!/usr/bin/env node
// Release gate: validates a freshly deployed Atlas production backend end to
// end — readiness, prod guards, W6 ops surfaces, and the V1 wire contract
// (camera focus, spec-not-scene drafts, save surface hidden).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = (process.env.ATLAS_PUBLIC_BASE_URL ?? "https://atlas-backend-production-e6fc.up.railway.app").replace(/\/+$/, "");
const gates = [];
const blockers = [];

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

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
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
  assert(tools.length >= 7, `expected >=7 tools, got ${tools.length}`);
  return `${tools.length} tools`;
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

await gate("stats_counted_our_calls", async () => {
  const { body } = await getJson("/api/ops/mcp-stats");
  const calls = body?.mcp?.tools?.select_county?.calls ?? 0;
  assert(calls >= 1, "select_county calls not counted by W6.5 instrumentation");
  return `select_county calls: ${calls}`;
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
