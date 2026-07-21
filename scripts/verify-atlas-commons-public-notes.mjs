import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const UPDATE_ID = "postalpha-0.81d-atlas-commons-map-radar";
const WIDGET_URI = "ui://widget/atlas-city-world-081d.html";
const blockers = [];

const requiredFiles = [
  "docs/ATLAS_ALL_PUBLIC_NOTES_SPEC.md",
  "docs/ATLAS_ALL_PUBLIC_NOTES_ARCHITECTURE.md",
  "docs/legal/ATLAS_COMMONS_COMMUNITY_STANDARD.md",
  "specs/atlas_all_public_notes_design.md",
  "server/src/atlasCommons/types.ts",
  "server/src/atlasCommons/repository.ts",
  "server/src/atlasCommons/postgres.ts",
  "server/src/atlasCommons/service.ts",
  "server/test/atlas-commons-public-notes.test.ts",
  "migrations/hosted-clawd/003_atlas_commons_public_notes.sql",
];

for (const path of requiredFiles) {
  if (!existsSync(path)) blockers.push(`Missing Atlas Commons file: ${path}`);
}

const serverIndex = read("server/src/index.ts");
const service = read("server/src/atlasCommons/service.ts");
const repository = read("server/src/atlasCommons/repository.ts");
const postgres = read("server/src/atlasCommons/postgres.ts");
const migration = read("migrations/hosted-clawd/003_atlas_commons_public_notes.sql");
const app = read("web/src/App.tsx");
const view = read("web/src/CityWorldView.tsx");
const renderer = read("web/src/CityWorldRenderer.tsx");
const styles = read("web/src/styles.css");
const envExample = read(".env.example");

for (const token of [
  "readAtlasCommonsConfig",
  "list_atlas_notes",
  "write_atlas_note",
  "atlasCommonsService.publicMeta()",
  "attachVerifiedMcpAuth",
  '"mcp/www_authenticate"',
  "/api/atlas-commons/moderation",
]) assertIncludes(serverIndex, token, `Server integration missing ${token}.`);
assertIncludes(serverIndex, WIDGET_URI, `Server widget URI must be versioned for ${UPDATE_ID}.`);

for (const token of [
  "validateBody",
  "resolveAnchor",
  "requireScope",
  "createHmac",
  "findNoteByRequest",
  "listModerationQueue",
  "timingSafeEqual",
  "cursorScope",
  "writeQuota",
  "rateLimitError",
  "operatorNote(",
  "publicNote(",
]) assertIncludes(service, token, `Commons service boundary missing ${token}.`);

for (const token of ["findNoteByRequest", "listModerationQueue", "INVALID_TRANSITION"]) {
  assertIncludes(repository, token, `Commons repository contract missing ${token}.`);
}
for (const token of ["BEGIN", "FOR UPDATE", "pg_advisory_xact_lock", "assertWriteQuotaAvailable", "system:report-threshold", "moderation_status = $5", "ROLLBACK"]) {
  assertIncludes(postgres, token, `Commons Postgres safety contract missing ${token}.`);
}

for (const token of [
  "atlas_public_notes",
  "atlas_note_reactions",
  "atlas_note_reports",
  "atlas_note_moderation_events",
  "atlas_commons_actions",
  "UNIQUE (owner_user_id, client_request_id)",
]) assertIncludes(migration, token, `Commons migration missing ${token}.`);

for (const token of ["callAtlasTool", "postPublicNote", "reactToPublicNote", "reportPublicNote", "commonsMode", "commonsSort"]) {
  assertIncludes(app, token, `Widget controller missing ${token}.`);
}
for (const token of ['["all", "nearby", "mine"]', '["hot", "new"]', "public-note-selected", "open-public-note-composer", "Review public post", "Post publicly", "Private notes stay in this chat"]) {
  assertIncludes(view, token, `Map-native Commons UI missing ${token}.`);
}
if (view.includes('data-qa="public-note-list"')) blockers.push("Public Commons mode must render one selected note, not a feed list.");
for (const token of ["drawPublicNoteBeacon", "publicNoteCountByPlaceId", "selectedPublicNotePreview"]) {
  assertIncludes(renderer, token, `Map-native Commons renderer missing ${token}.`);
}
for (const token of [".city-world-commons-controls", ".city-world-commons-sort", ".city-world-tray.is-commons-strip", ".city-world-public-note-selected", "min-height: 44px"]) {
  assertIncludes(styles, token, `Commons styling/mobile contract missing ${token}.`);
}
for (const token of ["ATLAS_COMMONS_ENABLED=false", "ATLAS_COMMONS_PSEUDONYM_SECRET=", "ATLAS_COMMONS_OPS_TOKEN="]) {
  assertIncludes(envExample, token, `.env.example missing safe default ${token}.`);
}

const frozenRegistrations = [...serverIndex.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)].map((match) => match[1]).sort();
const expectedFrozen = [
  "ask_county_question",
  "get_upgrade_options",
  "lookup_world_places",
  "preview_campaign_engine",
  "preview_scout_drop",
  "render_voxel_county",
  "select_county",
].sort();
if (JSON.stringify(frozenRegistrations) !== JSON.stringify(expectedFrozen)) {
  blockers.push(`Frozen registration audit changed: ${frozenRegistrations.join(", ")}.`);
}

if (blockers.length === 0) {
  try {
    const disabled = await probeRuntime(false);
    if (JSON.stringify(disabled.tools) !== JSON.stringify(expectedFrozen)) {
      blockers.push(`Default-off runtime must expose seven tools; got ${disabled.tools.join(", ")}.`);
    }
    for (const toolName of expectedFrozen) {
      if (JSON.stringify(disabled.toolSecuritySchemes?.[toolName]) !== JSON.stringify([{ type: "noauth" }])) {
        blockers.push(`Default-off ${toolName} must declare noauth securitySchemes.`);
      }
    }
    if (disabled.widgetTemplate !== WIDGET_URI) {
      blockers.push(`Default-off select_county widget URI expected ${WIDGET_URI}; got ${String(disabled.widgetTemplate)}.`);
    }
    const expectedPublicPages = ["/privacy", "/terms", "/support", "/community"];
    for (const page of expectedPublicPages) {
      const response = disabled.publicPages?.[page];
      if (response?.status !== 200) blockers.push(`Default-off public page ${page} must return 200; got ${String(response?.status)}.`);
    }
    if (!disabled.publicPages?.["/community"]?.body.includes("Commons Community Standard")) {
      blockers.push("Default-off Community Standard page must remain publicly readable and correctly titled.");
    }

    const enabled = await probeRuntime(true);
    const expectedEnabled = [...expectedFrozen, "list_atlas_notes", "write_atlas_note"].sort();
    if (JSON.stringify(enabled.tools) !== JSON.stringify(expectedEnabled)) {
      blockers.push(`Enabled runtime tool surface mismatch; got ${enabled.tools.join(", ")}.`);
    }
    for (const toolName of expectedFrozen) {
      if (JSON.stringify(enabled.toolSecuritySchemes?.[toolName]) !== JSON.stringify([{ type: "noauth" }])) {
        blockers.push(`Enabled ${toolName} must preserve noauth securitySchemes.`);
      }
    }
    if (enabled.widgetTemplate !== WIDGET_URI) {
      blockers.push(`Enabled select_county widget URI expected ${WIDGET_URI}; got ${String(enabled.widgetTemplate)}.`);
    }
    const expectedListSchemes = [
      { type: "noauth" },
      { type: "oauth2", scopes: ["atlas:commons.read"] },
    ];
    const expectedWriteSchemes = [{ type: "oauth2", scopes: ["atlas:commons.write"] }];
    if (JSON.stringify(enabled.listMetaSecuritySchemes) !== JSON.stringify(expectedListSchemes)
      || JSON.stringify(enabled.writeMetaSecuritySchemes) !== JSON.stringify(expectedWriteSchemes)) {
      blockers.push("Commons tools must mirror securitySchemes in _meta for ChatGPT compatibility.");
    }
    if (enabled.commonsError !== "COMMONS_UNAVAILABLE") {
      blockers.push(`Enabled-without-DB read must fail narrowly with COMMONS_UNAVAILABLE; got ${enabled.commonsError ?? "none"}.`);
    }
    if (enabled.mapMeta?.enabled !== true || enabled.mapMeta?.available !== false) {
      blockers.push("Enabled-without-DB map metadata must say enabled=true and available=false.");
    }
    if (enabled.ready?.ok !== true || enabled.ready?.atlasCommons?.ready !== false || enabled.ready?.atlasCommons?.databaseReady !== false) {
      blockers.push("Commons unavailability must stay isolated from healthy map readiness while reporting Commons ready=false.");
    }
    const scopes = enabled.metadata?.scopes_supported;
    if (JSON.stringify(scopes) !== JSON.stringify(["atlas:commons.read", "atlas:commons.write"])) {
      blockers.push(`Commons-only OAuth metadata advertised unexpected scopes: ${JSON.stringify(scopes)}.`);
    }
    if (enabled.metadata?.resource !== `${baseResource(enabled.baseUrl)}/mcp`) {
      blockers.push(`OAuth resource metadata must identify the MCP endpoint; got ${String(enabled.metadata?.resource)}.`);
    }
    if (enabled.invalidTokenStatus !== 401
      || !enabled.invalidTokenChallenge?.includes("resource_metadata=")
      || !enabled.invalidTokenChallenge?.includes('error="invalid_token"')
      || !/error_description="[^"]+"/.test(enabled.invalidTokenChallenge)) {
      blockers.push("Invalid MCP bearer tokens must return a complete 401 OAuth relink challenge.");
    }
  } catch (error) {
    blockers.push(`Runtime probe failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: UPDATE_ID,
  blockerCount: blockers.length,
  blockers,
};
console.log(JSON.stringify(result, null, 2));
if (blockers.length > 0) process.exitCode = 1;

async function probeRuntime(enabled) {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "server/src/index.ts"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      APP_BASE_URL: baseUrl,
      DATABASE_URL: "",
      ATLAS_COMMONS_ENABLED: enabled ? "true" : "false",
      ATLAS_COMMONS_PSEUDONYM_SECRET: enabled ? "runtime-probe-only-secret" : "",
      ATLAS_COMMONS_OPS_TOKEN: enabled ? "runtime-probe-only-operator" : "",
      ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_MONEY_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED: "false",
      ATLAS_OIDC_ISSUER: enabled ? "https://identity.example.test/" : "",
      ATLAS_OIDC_AUDIENCE: enabled ? `${baseUrl}/mcp` : "",
      ATLAS_OIDC_JWKS_URL: enabled ? "https://identity.example.test/.well-known/jwks.json" : "",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  child.stdout?.on("data", (chunk) => { output = `${output}${chunk}`.slice(-8000); });
  child.stderr?.on("data", (chunk) => { output = `${output}${chunk}`.slice(-8000); });

  try {
    await waitForHealth(`${baseUrl}/health`, child, () => output);
    const ready = await (await fetch(`${baseUrl}/ready`)).json();
    const publicPages = Object.fromEntries(await Promise.all(
      ["/privacy", "/terms", "/support", "/community"].map(async (path) => [path, await readPublicPage(`${baseUrl}${path}`)]),
    ));
    const metadata = enabled ? await (await fetch(`${baseUrl}/.well-known/oauth-protected-resource`)).json() : undefined;
    const invalidTokenResponse = enabled ? await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        Authorization: "Bearer invalid-runtime-probe-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "invalid-token-proof",
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "atlas-commons-verifier", version: "0.1.0" },
        },
      }),
    }) : undefined;
    const client = new Client({ name: "atlas-commons-verifier", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);
    try {
      const toolDefinitions = (await client.listTools()).tools;
      const tools = toolDefinitions.map((tool) => tool.name).sort();
      const toolSecuritySchemes = Object.fromEntries(toolDefinitions.map((tool) => [tool.name, tool?._meta?.securitySchemes]));
      const widgetTemplate = toolDefinitions.find((tool) => tool.name === "select_county")?._meta?.["openai/outputTemplate"];
      if (!enabled) return { tools, ready, baseUrl, widgetTemplate, toolSecuritySchemes, publicPages };
      const list = await client.callTool({ name: "list_atlas_notes", arguments: { countySlug: "riverside-ca" } });
      const selected = await client.callTool({ name: "select_county", arguments: { countySlug: "riverside-ca" } });
      return {
        tools,
        widgetTemplate,
        ready,
        metadata,
        invalidTokenStatus: invalidTokenResponse?.status,
        invalidTokenChallenge: invalidTokenResponse?.headers.get("www-authenticate"),
        baseUrl,
        publicPages,
        commonsError: list?._meta?.atlasCommonsError?.code,
        mapMeta: selected?._meta?.atlasCommons,
        toolSecuritySchemes,
        listMetaSecuritySchemes: toolDefinitions.find((tool) => tool.name === "list_atlas_notes")?._meta?.securitySchemes,
        writeMetaSecuritySchemes: toolDefinitions.find((tool) => tool.name === "write_atlas_note")?._meta?.securitySchemes,
      };
    } finally {
      await client.close();
    }
  } finally {
    child.kill();
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }
}

async function readPublicPage(url) {
  const response = await fetch(url);
  return { status: response.status, body: (await response.text()).slice(0, 20_000) };
}

function baseResource(baseUrl) {
  return baseUrl.replace(/\/$/, "");
}

async function waitForHealth(url, child, output) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited ${child.exitCode}: ${output()}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`server did not become healthy: ${output()}`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function assertIncludes(source, token, message) {
  if (!source.includes(token)) blockers.push(message);
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}
