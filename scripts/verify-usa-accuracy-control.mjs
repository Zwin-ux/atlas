#!/usr/bin/env node
/**
 * USA Accuracy — CONTROL ENVIRONMENT harness
 *
 * Reproducible local gate that does not need ChatGPT Pro. Three layers:
 *
 *   L1  Plate HTTP API     — county/state/nation compose (server)
 *   L2  MCP open_atlas_map — tool resolve + atlasPlate meta (host contract)
 *   L3  /preview shell     — widget HTML + optional browser screenshots
 *
 * Control env defaults: http://127.0.0.1:8787
 *
 *   node scripts/verify-usa-accuracy-control.mjs
 *   ATLAS_CONTROL_BASE=http://127.0.0.1:8787 node scripts/verify-usa-accuracy-control.mjs
 *   ATLAS_CONTROL_SCREENSHOTS=1 node scripts/verify-usa-accuracy-control.mjs   # if browse available
 *
 * Exit 0 = control green. Evidence: artifacts/usa-accuracy/control/
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "artifacts", "usa-accuracy", "control");
const BASE = (process.env.ATLAS_CONTROL_BASE ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const WANT_SHOTS = process.env.ATLAS_CONTROL_SCREENSHOTS === "1";

/** Fixed matrix — never random. Same set every run. */
const MATRIX = {
  counties: [
    "miami-dade-fl",
    "loving-tx",
    "kalawao-hi",
    "cook-il",
    "riverside-ca",
    "san-francisco-ca",
    "district-of-columbia-dc",
    "honolulu-hi",
    "maricopa-az",
    "summit-co",
  ],
  focus: [
    { place: "Homestead, FL", expectCounty: "miami-dade-fl", expectFocus: true },
    { place: "Eastvale, CA", expectCounty: "riverside-ca", expectFocus: true },
    { place: "Chicago, IL", expectCounty: "cook-il", expectFocus: true },
    { place: "Key West", expectCounty: "monroe-fl", expectFocus: true },
    { place: "Loving County, TX", expectCounty: "loving-tx", expectFocus: false },
  ],
  ambiguous: [{ place: "Springfield", expectStatus: "ambiguous" }],
  previews: [
    { path: "/preview?county=miami-dade-fl", label: "miami-county" },
    {
      path: "/preview?county=miami-dade-fl&focusLon=-80.4472&focusLat=25.4664&focusName=Homestead",
      label: "miami-homestead-focus",
    },
    { path: "/preview?county=loving-tx", label: "loving" },
    { path: "/preview?county=riverside-ca", label: "riverside" },
    { path: "/preview?nation=1", label: "nation" },
  ],
};

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  layers: { l1: [], l2: [], l3: [], shots: [] },
  blockers: [],
};

function fail(layer, id, message) {
  report.blockers.push(`${layer}:${id}:${message}`);
  console.error(`FAIL [${layer}] ${id}: ${message}`);
}

function ok(layer, id, detail = "") {
  console.log(`ok  [${layer}] ${id}${detail ? ` — ${detail}` : ""}`);
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body, headers: Object.fromEntries(res.headers) };
}

async function getText(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, text: await res.text() };
}

/** Minimal streamable HTTP MCP: initialize + tools/call */
async function mcpCallTool(name, args) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };

  const initRes = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "atlas-control-env", version: "1.0.0" },
      },
    }),
  });

  const sessionId = initRes.headers.get("mcp-session-id") ?? initRes.headers.get("Mcp-Session-Id");
  if (sessionId) headers["mcp-session-id"] = sessionId;

  // Drain body
  await initRes.text();

  // notifications/initialized
  await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });

  const callRes = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  const raw = await callRes.text();
  // SSE or JSON
  let payload;
  if (raw.includes("data:")) {
    const lines = raw.split("\n").filter((l) => l.startsWith("data:"));
    const last = lines[lines.length - 1]?.replace(/^data:\s*/, "") ?? "{}";
    payload = JSON.parse(last);
  } else {
    payload = JSON.parse(raw);
  }
  return { status: callRes.status, payload };
}

// ---- L0: control server up -------------------------------------------------
{
  try {
    const ready = await getJson("/ready");
    if (ready.status !== 200 || ready.body?.ok !== true) {
      fail("L0", "ready", `control server not ready at ${BASE} (HTTP ${ready.status})`);
      console.error("\nStart control env:  pnpm build:web ; pnpm build:server ; pnpm dev");
      console.error("Or:                 node server/dist/index.js  (PORT=8787)");
      writeReport();
      process.exit(1);
    }
    ok("L0", "ready", `version=${ready.body.version ?? "?"}`);
  } catch (error) {
    fail("L0", "ready", error instanceof Error ? error.message : String(error));
    console.error(`\nControl server not reachable at ${BASE}`);
    console.error("Start it first, then re-run this script.");
    writeReport();
    process.exit(1);
  }
}

// ---- L1: plate HTTP --------------------------------------------------------
for (const slug of MATRIX.counties) {
  const row = { slug };
  try {
    const { status, body } = await getJson(`/api/atlas/county/${slug}`);
    row.status = status;
    if (status !== 200) {
      fail("L1", slug, `HTTP ${status}`);
    } else if (body.plate !== "county") {
      fail("L1", slug, `plate=${body.plate}`);
    } else if (!Array.isArray(body.rings) || body.rings.length < 1) {
      fail("L1", slug, "no rings");
    } else if (!Array.isArray(body.anchors) || body.anchors.length < 1) {
      if (slug !== "kalawao-hi") fail("L1", slug, "no anchors");
      else ok("L1", slug, "sparse ok");
    } else if (body.anchors[0]?.tier !== "seat") {
      fail("L1", slug, `seat tier missing (got ${body.anchors[0]?.tier})`);
    } else {
      row.seat = body.anchors[0].name;
      row.towns = body.anchors.length;
      row.water = Array.isArray(body.water) ? body.water.length : 0;
      ok("L1", slug, `seat=${row.seat} towns=${row.towns} water=${row.water}`);
    }
  } catch (error) {
    fail("L1", slug, error instanceof Error ? error.message : String(error));
  }
  report.layers.l1.push(row);
}

// Nation plate
{
  const { status, body } = await getJson("/api/atlas/nation");
  if (status !== 200 || body.plate !== "nation") fail("L1", "nation", `HTTP ${status}`);
  else ok("L1", "nation", "built");
}

// ---- L2: MCP open_atlas_map ------------------------------------------------
for (const caseRow of MATRIX.focus) {
  const row = { ...caseRow };
  try {
    const { payload } = await mcpCallTool("open_atlas_map", { place: caseRow.place });
    const result = payload?.result ?? payload;
    const structured = result?.structuredContent ?? result;
    const meta = result?._meta ?? {};
    const plate = meta.atlasPlate ?? {};

    row.status = structured?.status;
    row.countySlug = structured?.countySlug ?? plate.countySlug;
    row.hasFocus = Boolean(plate.focus?.lon != null && plate.focus?.lat != null);
    row.focusName = plate.focus?.name;

    if (structured?.status !== "opened") {
      fail("L2", caseRow.place, `status=${structured?.status}`);
    } else if (row.countySlug !== caseRow.expectCounty) {
      fail("L2", caseRow.place, `county ${row.countySlug} expected ${caseRow.expectCounty}`);
    } else if (caseRow.expectFocus && !row.hasFocus) {
      fail("L2", caseRow.place, "missing atlasPlate.focus");
    } else if (!caseRow.expectFocus && plate.level !== "county") {
      fail("L2", caseRow.place, `level=${plate.level}`);
    } else {
      ok(
        "L2",
        caseRow.place,
        `→ ${row.countySlug}${row.hasFocus ? ` focus=${row.focusName ?? "yes"}` : ""}`,
      );
    }
  } catch (error) {
    fail("L2", caseRow.place, error instanceof Error ? error.message : String(error));
  }
  report.layers.l2.push(row);
}

for (const caseRow of MATRIX.ambiguous) {
  try {
    const { payload } = await mcpCallTool("open_atlas_map", { place: caseRow.place });
    const result = payload?.result ?? payload;
    const structured = result?.structuredContent ?? result;
    if (structured?.status !== caseRow.expectStatus) {
      fail("L2", caseRow.place, `expected ${caseRow.expectStatus}, got ${structured?.status}`);
    } else {
      ok("L2", caseRow.place, "ambiguous honest");
    }
    report.layers.l2.push({ ...caseRow, status: structured?.status });
  } catch (error) {
    fail("L2", caseRow.place, error instanceof Error ? error.message : String(error));
  }
}

// Tool surface must not re-expose retired tools
{
  try {
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    };
    const initRes = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "atlas-control-env", version: "1.0.0" },
        },
      }),
    });
    const sessionId = initRes.headers.get("mcp-session-id") ?? initRes.headers.get("Mcp-Session-Id");
    if (sessionId) headers["mcp-session-id"] = sessionId;
    await initRes.text();
    await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
    const listRes = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list", params: {} }),
    });
    const raw = await listRes.text();
    let payload;
    if (raw.includes("data:")) {
      const lines = raw.split("\n").filter((l) => l.startsWith("data:"));
      payload = JSON.parse(lines[lines.length - 1].replace(/^data:\s*/, ""));
    } else {
      payload = JSON.parse(raw);
    }
    const tools = (payload?.result?.tools ?? []).map((t) => t.name).sort();
    const expected = ["open_atlas_map", "search_atlas_places"];
    const retired = ["select_county", "lookup_world_places", "preview_scout_drop"];
    if (JSON.stringify(tools) !== JSON.stringify(expected)) {
      fail("L2", "tools", `got [${tools.join(", ")}]`);
    } else if (tools.some((t) => retired.includes(t))) {
      fail("L2", "tools", "retired tool present");
    } else {
      ok("L2", "tools", tools.join(", "));
    }
  } catch (error) {
    fail("L2", "tools", error instanceof Error ? error.message : String(error));
  }
}

// ---- L3: preview shell -----------------------------------------------------
for (const prev of MATRIX.previews) {
  try {
    const { status, text } = await getText(prev.path);
    if (status !== 200) {
      fail("L3", prev.label, `HTTP ${status}`);
    } else if (!text.includes("/widget/component.js") && !text.includes("component.js")) {
      fail("L3", prev.label, "missing widget script");
    } else {
      ok("L3", prev.label, `${text.length} bytes`);
      report.layers.l3.push({ ...prev, status, bytes: text.length });
    }
  } catch (error) {
    fail("L3", prev.label, error instanceof Error ? error.message : String(error));
  }
}

// Emulator shell (ChatGPT-fidelity host page)
{
  try {
    const { status, text } = await getText("/emulator?county=miami-dade-fl");
    if (status !== 200) fail("L3", "emulator", `HTTP ${status}`);
    else if (!/emulator|Atlas/i.test(text)) fail("L3", "emulator", "unexpected shell");
    else ok("L3", "emulator", "shell ok");
  } catch (error) {
    fail("L3", "emulator", error instanceof Error ? error.message : String(error));
  }
}

// ---- Optional screenshots via gstack browse --------------------------------
if (WANT_SHOTS) {
  const browseCandidates = [
    join(ROOT, ".claude/skills/gstack/browse/dist/browse"),
    join(process.env.USERPROFILE ?? "", ".claude/skills/gstack/browse/dist/browse"),
    join(process.env.HOME ?? "", ".claude/skills/gstack/browse/dist/browse"),
  ];
  const browse = browseCandidates.find((p) => existsSync(p));
  if (!browse) {
    console.log("skip shots — gstack browse not built");
  } else {
    mkdirSync(join(OUT, "shots"), { recursive: true });
    for (const prev of MATRIX.previews.slice(0, 4)) {
      const shot = join(OUT, "shots", `${prev.label}.png`);
      const url = `${BASE}${prev.path}`;
      const r = spawnSync(browse, ["goto", url], { encoding: "utf8" });
      if (r.status !== 0) {
        fail("SHOT", prev.label, r.stderr || r.stdout || "goto failed");
        continue;
      }
      // wait for SVG plate
      spawnSync(browse, ["wait", "--networkidle"], { encoding: "utf8" });
      const s = spawnSync(browse, ["screenshot", shot], { encoding: "utf8" });
      if (s.status !== 0 || !existsSync(shot)) {
        fail("SHOT", prev.label, "screenshot failed");
      } else {
        ok("SHOT", prev.label, shot);
        report.layers.shots.push({ label: prev.label, path: shot });
      }
    }
  }
}

writeReport();

if (report.blockers.length === 0) {
  console.log(`\nCONTROL GREEN — ${OUT}/REPORT.md`);
  process.exit(0);
}
console.error(`\nCONTROL RED — ${report.blockers.length} blocker(s)`);
process.exit(1);

function writeReport() {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const md = [
    "# USA Accuracy — Control Environment",
    "",
    `Generated: ${report.generatedAt}`,
    `Base: ${report.base}`,
    `Blockers: ${report.blockers.length === 0 ? "none" : report.blockers.join(", ")}`,
    "",
    "## How to run",
    "",
    "```powershell",
    "# Terminal A — control server",
    "pnpm build:web",
    "pnpm build:server",
    "pnpm dev",
    "",
    "# Terminal B — matrix",
    "pnpm verify:usa-accuracy-control",
    "```",
    "",
    "## Layers",
    "",
    "| Layer | What |",
    "|-------|------|",
    "| L0 | `/ready` control server |",
    "| L1 | `/api/atlas/county/*` plate compose + seat tier |",
    "| L2 | MCP `open_atlas_map` resolve + focus meta |",
    "| L3 | `/preview` + `/emulator` shells |",
    "",
    `L1 rows: ${report.layers.l1.length}`,
    `L2 rows: ${report.layers.l2.length}`,
    `L3 rows: ${report.layers.l3.length}`,
    "",
    "## ChatGPT Pro mapping",
    "",
    "| Control | Your Pro plugin |",
    "|---------|-----------------|",
    "| L1+L2 local | Atlas (prod) tool+plate |",
    "| L3 /emulator | Closest host fidelity without ChatGPT |",
    "| Staging plugin | Atlas Staging only for Commons |",
    "",
    "Deploy A1–A3 before expecting focus fly-to / seat diamonds in ChatGPT.",
    "",
  ].join("\n");
  writeFileSync(join(OUT, "REPORT.md"), md);
}
