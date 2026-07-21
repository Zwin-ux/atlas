import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const UPDATE_ID = "postalpha-0.81c-atlas-all-public-notes-foundation";
const blockers = [];

const requiredFiles = [
  "docs/ATLAS_ALL_PUBLIC_NOTES_SPEC.md",
  "docs/ATLAS_ALL_PUBLIC_NOTES_ARCHITECTURE.md",
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
const migration = read("migrations/hosted-clawd/003_atlas_commons_public_notes.sql");
const app = read("web/src/App.tsx");
const view = read("web/src/CityWorldView.tsx");
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

for (const token of [
  "validateBody",
  "resolveAnchor",
  "requireScope",
  "createHmac",
  "countRecentActions",
  "publicNote(",
]) assertIncludes(service, token, `Commons service boundary missing ${token}.`);

for (const token of [
  "atlas_public_notes",
  "atlas_note_reactions",
  "atlas_note_reports",
  "atlas_note_moderation_events",
  "atlas_commons_actions",
  "UNIQUE (owner_user_id, client_request_id)",
]) assertIncludes(migration, token, `Commons migration missing ${token}.`);

for (const token of ["callAtlasTool", "postPublicNote", "reactToPublicNote", "reportPublicNote", "commonsMode"]) {
  assertIncludes(app, token, `Widget controller missing ${token}.`);
}
for (const token of ['["all", "nearby", "mine"]', "mode.toUpperCase()", "Review public post", "Post publicly", "Private notes stay in this chat"]) {
  assertIncludes(view, token, `Map-native Commons UI missing ${token}.`);
}
for (const token of [".city-world-commons-mode", ".city-world-public-note-list", "min-height: 44px"]) {
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

    const enabled = await probeRuntime(true);
    const expectedEnabled = [...expectedFrozen, "list_atlas_notes", "write_atlas_note"].sort();
    if (JSON.stringify(enabled.tools) !== JSON.stringify(expectedEnabled)) {
      blockers.push(`Enabled runtime tool surface mismatch; got ${enabled.tools.join(", ")}.`);
    }
    if (enabled.commonsError !== "COMMONS_UNAVAILABLE") {
      blockers.push(`Enabled-without-DB read must fail narrowly with COMMONS_UNAVAILABLE; got ${enabled.commonsError ?? "none"}.`);
    }
    if (enabled.mapMeta?.enabled !== true || enabled.mapMeta?.available !== false) {
      blockers.push("Enabled-without-DB map metadata must say enabled=true and available=false.");
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
      ATLAS_COMMONS_OPS_TOKEN: "",
      ATLAS_HOSTED_CLAWD_PERSISTENCE_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_MONEY_ENABLED: "false",
      ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED: "false",
      ATLAS_OIDC_ISSUER: "",
      ATLAS_OIDC_AUDIENCE: "",
      ATLAS_OIDC_JWKS_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  child.stdout?.on("data", (chunk) => { output = `${output}${chunk}`.slice(-8000); });
  child.stderr?.on("data", (chunk) => { output = `${output}${chunk}`.slice(-8000); });

  try {
    await waitForHealth(`${baseUrl}/health`, child, () => output);
    const client = new Client({ name: "atlas-commons-verifier", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);
    try {
      const tools = (await client.listTools()).tools.map((tool) => tool.name).sort();
      if (!enabled) return { tools };
      const list = await client.callTool({ name: "list_atlas_notes", arguments: { countySlug: "riverside-ca" } });
      const selected = await client.callTool({ name: "select_county", arguments: { countySlug: "riverside-ca" } });
      return {
        tools,
        commonsError: list?._meta?.atlasCommonsError?.code,
        mapMeta: selected?._meta?.atlasCommons,
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
