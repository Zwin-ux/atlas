#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const args = process.argv.slice(2);
const baseUrl = optionValue("--base", process.env.ATLAS_STAGING_BASE_URL ?? "https://atlas-backend-staging-9d6c.up.railway.app").replace(/\/+$/, "");
const expectedState = optionValue("--expect", "disabled");
const proveModeration = args.includes("--prove-moderation");
const expectedBaseTools = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
].sort();
const expectedEnabledTools = [...expectedBaseTools, "list_atlas_notes", "write_atlas_note"].sort();
const expectedCommonsScopes = ["atlas:commons.read", "atlas:commons.write"];
const expectedWidgetUri = "ui://widget/atlas-city-world-081d.html";
const checks = [];
let proofNoteId;

if (!new Set(["disabled", "enabled"]).has(expectedState)) {
  fail("--expect must be either disabled or enabled");
}
if (proveModeration && expectedState !== "enabled") {
  fail("--prove-moderation requires --expect enabled");
}

try {
  const readyResponse = await fetch(`${baseUrl}/ready`);
  const ready = await readJson(readyResponse, "/ready");
  assert(readyResponse.ok, `/ready returned ${readyResponse.status}`);
  assert(ready?.ok === true, "/ready did not report ok=true");
  checks.push({ name: "map readiness", ok: true });

  const anonymous = await connectClient();
  let selected;
  try {
    const toolDefinitions = (await anonymous.client.listTools()).tools;
    const tools = toolDefinitions.map((tool) => tool.name).sort();
    const expectedTools = expectedState === "enabled" ? expectedEnabledTools : expectedBaseTools;
    assertSame(tools, expectedTools, "MCP tool surface");
    for (const toolName of expectedBaseTools) {
      const tool = toolDefinitions.find((definition) => definition.name === toolName);
      assertSameJson(tool?._meta?.securitySchemes, [{ type: "noauth" }], `${toolName} noauth securitySchemes`);
    }
    const selectCounty = toolDefinitions.find((tool) => tool.name === "select_county");
    assert(selectCounty?._meta?.["openai/outputTemplate"] === expectedWidgetUri, `select_county outputTemplate did not match ${expectedWidgetUri}`);
    assert(selectCounty?._meta?.ui?.resourceUri === expectedWidgetUri, `select_county resourceUri did not match ${expectedWidgetUri}`);
    checks.push({ name: "tool surface and widget URI", ok: true, count: tools.length, widgetUri: expectedWidgetUri });

    selected = structured(await anonymous.client.callTool({
      name: "select_county",
      arguments: { countySlug: "riverside-ca" },
    }), "select_county");
    if (expectedState === "enabled") {
      const listNotes = toolDefinitions.find((tool) => tool.name === "list_atlas_notes");
      const writeNote = toolDefinitions.find((tool) => tool.name === "write_atlas_note");
      assertSameJson(listNotes?._meta?.securitySchemes, [
        { type: "noauth" },
        { type: "oauth2", scopes: ["atlas:commons.read"] },
      ], "list_atlas_notes compatibility securitySchemes");
      assertSameJson(writeNote?._meta?.securitySchemes, [
        { type: "oauth2", scopes: ["atlas:commons.write"] },
      ], "write_atlas_note compatibility securitySchemes");
      checks.push({ name: "tool OAuth security schemes", ok: true });
      const mineChallenge = await anonymous.client.callTool({
        name: "list_atlas_notes",
        arguments: { mode: "mine", limit: 1 },
      });
      assertAuthChallenge(mineChallenge, "atlas:commons.read", "anonymous MINE");
      const anchor = firstCanonicalPlace(selected);
      const writeChallenge = await anonymous.client.callTool({
        name: "write_atlas_note",
        arguments: {
          operation: "post",
          countySlug: "riverside-ca",
          placeId: anchor.id,
          placeLabel: anchor.label,
          body: "This anonymous auth probe must never persist.",
          clientRequestId: `anonymous-auth-probe-${randomUUID()}`,
        },
      });
      assertAuthChallenge(writeChallenge, "atlas:commons.write", "anonymous post");
      checks.push({ name: "anonymous OAuth challenges", ok: true });
    }
  } finally {
    await anonymous.client.close();
  }

  const metadataResponse = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
  const metadata = await readJson(metadataResponse, "OAuth protected-resource metadata");

  if (expectedState === "disabled") {
    assert(ready.atlasCommons === undefined, "disabled staging exposed Atlas Commons readiness");
    if (metadataResponse.ok) {
      const scopes = [...(metadata.scopes_supported ?? [])].sort();
      assert(!scopes.some((scope) => expectedCommonsScopes.includes(scope)), "disabled staging advertised Commons OAuth scopes");
    } else {
      assert(metadataResponse.status === 404, `disabled staging metadata returned ${metadataResponse.status}, expected 404 or 200 without Commons scopes`);
    }
    const queue = await fetch(`${baseUrl}/api/atlas-commons/moderation`, {
      headers: { Authorization: "Bearer disabled-surface-probe" },
    });
    assert(queue.status === 404, `disabled moderation route returned ${queue.status}, expected 404`);
    checks.push({ name: "disabled capability isolation", ok: true });
  } else {
    assert(ready.atlasCommons?.enabled === true, "enabled staging did not report Commons enabled=true");
    assert(ready.atlasCommons?.available === true, "enabled staging did not report Commons available=true");
    assert(ready.atlasCommons?.ready === true, "enabled staging did not report Commons ready=true");
    assert(ready.atlasCommons?.databaseReady === true, "enabled staging did not report Commons databaseReady=true");
    assert(ready.atlasCommons?.authConfigured === true, "enabled staging did not report Commons authConfigured=true");
    assert(ready.atlasCommons?.operatorConfigured === true, "enabled staging did not report Commons operatorConfigured=true");
    assert(metadataResponse.ok, `enabled staging OAuth metadata returned ${metadataResponse.status}`);
    assert(metadata.resource === `${baseUrl}/mcp`, `OAuth resource expected ${baseUrl}/mcp, got ${String(metadata.resource)}`);
    assertSame([...(metadata.scopes_supported ?? [])].sort(), expectedCommonsScopes, "Commons OAuth scopes");
    const invalidTokenResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        Authorization: "Bearer invalid-staging-proof-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "invalid-token-proof",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "atlas-staging-verifier", version: "0.1.0" },
        },
      }),
    });
    const invalidChallenge = invalidTokenResponse.headers.get("www-authenticate") ?? "";
    assert(invalidTokenResponse.status === 401, `invalid bearer returned ${invalidTokenResponse.status}, expected 401`);
    assert(invalidChallenge.includes("resource_metadata="), "invalid bearer challenge omitted resource_metadata");
    assert(invalidChallenge.includes('error="invalid_token"'), "invalid bearer challenge omitted invalid_token");
    assert(/error_description="[^"]+"/.test(invalidChallenge), "invalid bearer challenge omitted error_description");
    checks.push({ name: "enabled readiness, least scopes, and invalid-token relink", ok: true });

    if (proveModeration) {
      const userToken = requiredSecret("ATLAS_COMMONS_USER_TOKEN");
      const reporterToken = requiredSecret("ATLAS_COMMONS_REPORTER_TOKEN");
      const operatorToken = requiredSecret("ATLAS_COMMONS_OPS_TOKEN");
      assert(userToken !== reporterToken, "ATLAS_COMMONS_REPORTER_TOKEN must represent a different user from ATLAS_COMMONS_USER_TOKEN");
      const anchor = firstCanonicalPlace(selected);
      const proofBody = `Staging moderation proof ${new Date().toISOString()}`;
      const authenticated = await connectClient(userToken);
      const reporter = await connectClient(reporterToken);
      const publicReader = await connectClient();
      try {
        const posted = structured(await authenticated.client.callTool({
          name: "write_atlas_note",
          arguments: {
            operation: "post",
            countySlug: "riverside-ca",
            placeId: anchor.id,
            placeLabel: anchor.label,
            body: proofBody,
            clientRequestId: `staging-proof-${randomUUID()}`,
          },
        }), "write_atlas_note post");
        proofNoteId = posted.note?.id;
        assert(typeof proofNoteId === "string" && proofNoteId.length > 0, "post returned no note id");
        assert(posted.note?.status === "pending", `new note status was ${String(posted.note?.status)}, expected pending`);

        const beforeApproval = structured(await publicReader.client.callTool({
          name: "list_atlas_notes",
          arguments: { mode: "all", countySlug: "riverside-ca", placeId: anchor.id, sort: "new", limit: 100 },
        }), "list_atlas_notes before approval");
        assert(!beforeApproval.notes.some((note) => note.id === proofNoteId), "pending note leaked into the public list");

        const pendingQueue = await operatorRequest(operatorToken, "GET", `?status=pending&limit=100`);
        assert(pendingQueue.result?.notes?.some((note) => note.id === proofNoteId), "pending note was absent from the operator queue");
        await operatorRequest(operatorToken, "POST", "", { noteId: proofNoteId, action: "approve" });

        const afterApproval = structured(await publicReader.client.callTool({
          name: "list_atlas_notes",
          arguments: { mode: "all", countySlug: "riverside-ca", placeId: anchor.id, sort: "new", limit: 100 },
        }), "list_atlas_notes after approval");
        assert(afterApproval.notes.some((note) => note.id === proofNoteId), "approved note was absent from the public list");

        const reacted = structured(await authenticated.client.callTool({
          name: "write_atlas_note",
          arguments: { operation: "react", noteId: proofNoteId, active: true },
        }), "write_atlas_note react");
        assert(reacted.operation === "react" && reacted.note?.viewerHasReacted === true, "reaction proof did not stick");

        const reported = structured(await reporter.client.callTool({
          name: "write_atlas_note",
          arguments: { operation: "report", noteId: proofNoteId, reason: "other" },
        }), "write_atlas_note report");
        assert(reported.operation === "report", "report proof failed");

        await operatorRequest(operatorToken, "POST", "", { noteId: proofNoteId, action: "remove" });
        const afterRemoval = structured(await publicReader.client.callTool({
          name: "list_atlas_notes",
          arguments: { mode: "all", countySlug: "riverside-ca", placeId: anchor.id, sort: "new", limit: 100 },
        }), "list_atlas_notes after removal");
        assert(!afterRemoval.notes.some((note) => note.id === proofNoteId), "removed note remained public");
        proofNoteId = undefined;
        checks.push({ name: "moderation lifecycle", ok: true });
      } finally {
        if (proofNoteId) {
          try {
            await operatorRequest(operatorToken, "POST", "", { noteId: proofNoteId, action: "remove" });
          } catch {
            // Preserve the original proof failure; the note remains pending or operator-visible.
          }
        }
        await Promise.allSettled([
          authenticated.client.close(),
          reporter.client.close(),
          publicReader.client.close(),
        ]);
      }
    }
  }

  console.log(JSON.stringify({
    ok: true,
    update: "postalpha-0.81d-atlas-commons-map-radar",
    target: baseUrl,
    expectedState,
    moderationProved: proveModeration,
    checks,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    update: "postalpha-0.81d-atlas-commons-map-radar",
    target: baseUrl,
    expectedState,
    moderationProved: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
}

async function connectClient(token) {
  const client = new Client({ name: "atlas-commons-staging-verifier", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), token
    ? { requestInit: { headers: { Authorization: `Bearer ${token}` } } }
    : undefined);
  await client.connect(transport);
  return { client, transport };
}

async function operatorRequest(token, method, suffix = "", body) {
  const response = await fetch(`${baseUrl}/api/atlas-commons/moderation${suffix}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await readJson(response, `moderation ${method}`);
  assert(response.ok && payload?.ok === true, `moderation ${method} returned ${response.status}: ${payload?.error?.code ?? "unknown error"}`);
  return payload;
}

function firstCanonicalPlace(selected) {
  const place = selected?._meta?.scene?.world?.places?.find((candidate) =>
    typeof candidate?.id === "string" && typeof candidate?.label === "string");
  assert(place, "select_county returned no canonical Riverside place anchor");
  return place;
}

function structured(result, label) {
  assert(result && typeof result === "object", `${label} returned no result`);
  assert(result.isError !== true, `${label} returned ${result?._meta?.atlasCommonsError?.code ?? "an MCP error"}`);
  assert(result.structuredContent && typeof result.structuredContent === "object", `${label} returned no structuredContent`);
  return { ...result.structuredContent, _meta: result._meta };
}

function assertAuthChallenge(result, scope, label) {
  assert(result?.isError === true, `${label} did not fail closed`);
  assert(result?._meta?.atlasCommonsError?.code === "AUTH_REQUIRED", `${label} returned ${String(result?._meta?.atlasCommonsError?.code)}, expected AUTH_REQUIRED`);
  const challenges = result?._meta?.["mcp/www_authenticate"];
  assert(Array.isArray(challenges) && challenges.length > 0, `${label} returned no mcp/www_authenticate challenge`);
  assert(challenges.some((challenge) => typeof challenge === "string" && challenge.includes(`scope="${scope}"`)), `${label} challenge did not request ${scope}`);
  assert(challenges.every((challenge) => String(challenge).includes('error="insufficient_scope"')), `${label} challenge omitted insufficient_scope`);
  assert(challenges.every((challenge) => /error_description="[^"]+"/.test(String(challenge))), `${label} challenge omitted error_description`);
  assert(challenges.every((challenge) => !String(challenge).includes("hosted_clawd")), `${label} challenge leaked a Hosted Clawd scope`);
}

function assertSameJson(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function readJson(response, label) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${label} returned non-JSON (${response.status})`);
  }
}

function requiredSecret(name) {
  const value = process.env[name]?.trim();
  assert(value, `${name} is required for --prove-moderation`);
  return value;
}

function assertSame(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} mismatch: expected [${expected.join(", ")}], got [${actual.join(", ")}]`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

function optionValue(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) fail(`${name} requires a value`);
  return value;
}
