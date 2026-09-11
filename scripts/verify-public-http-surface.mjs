#!/usr/bin/env node
/**
 * Public HTTP honesty gate.
 *
 * The store listing is a claim about the *service*, not only the MCP tool
 * list. Production shipped checkout, Google geocode, and a Commons page on
 * unauthenticated URLs while the packet said Atlas has none of those. This
 * script fails if the server entrypoint remounts a retired path, and if
 * ATLAS_HTTP_URL is set, it live-probes the same paths.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SERVER_ENTRY = "server/src/index.ts";
const jsonOnly = process.argv.slice(2).includes("--json-only");
const liveBase = process.env.ATLAS_HTTP_URL?.trim() || process.env.ATLAS_MCP_URL?.replace(/\/mcp\/?$/, "") || "";

const FORBIDDEN_MOUNTS = [
  { path: "/api/hosted-clawd/", reason: "commerce / accounts" },
  { path: "/api/geo/status", reason: "third-party geo" },
  { path: "/api/geo/geocode", reason: "third-party geo" },
  { path: "/api/world/lookup", reason: "third-party geo" },
  { path: "/api/stripe/webhook", reason: "commerce" },
  { path: "/api/atlas-commons/moderation", reason: "UGC moderation" },
  { path: "/api/scout/drop", reason: "lead generation" },
  { path: "/api/campaign/preview", reason: "lead generation" },
  { path: "/.well-known/oauth-protected-resource", reason: "OAuth on an auth-none listing" },
];

const REQUIRED_MOUNTS = [
  "/privacy",
  "/terms",
  "/support",
  "/preview",
  "/.well-known/openai-apps-challenge",
];

const RETIRED_LIVE_PATHS = FORBIDDEN_MOUNTS.map((row) =>
  row.path.endsWith("/") ? `${row.path}state` : row.path,
);

const blockers = [];
const warnings = [];
const live = [];

const source = readFileSync(resolve(SERVER_ENTRY), "utf8");

for (const row of FORBIDDEN_MOUNTS) {
  const escaped = row.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quote = row.path.endsWith("/") ? "" : '"';
  const mount = new RegExp(`if\\s*\\(\\s*url\\.pathname\\s*===\\s*"${escaped}${quote}`);
  if (mount.test(source)) {
    blockers.push(`${SERVER_ENTRY} still mounts ${row.path} (${row.reason}). Unmount it; do not restore the retired product.`);
  }
}

for (const path of REQUIRED_MOUNTS) {
  if (!source.includes(`"${path}"`)) {
    blockers.push(`${SERVER_ENTRY} is missing the required public path ${path}.`);
  }
}

if (!source.includes('url.pathname === "/community"')) {
  warnings.push(`${SERVER_ENTRY} no longer mentions /community; a 308 to /terms is the honest redirect for old links.`);
}

if (liveBase) {
  const origin = liveBase.replace(/\/$/, "");
  for (const path of RETIRED_LIVE_PATHS) {
    live.push(await probe(origin, path, [404]));
  }
  live.push(await probe(origin, "/community", [308, 404]));
  for (const path of ["/privacy", "/terms", "/support"]) {
    live.push(await probe(origin, path, [200]));
  }
}

const result = {
  ok: blockers.length === 0 && live.every((row) => row.ok),
  gate: "atlas-public-http-surface",
  blockerCount: blockers.length,
  blockers,
  warnings,
  live,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

async function probe(origin, path, allowed) {
  try {
    const response = await fetch(`${origin}${path}`, { redirect: "manual" });
    const ok = allowed.includes(response.status);
    if (!ok) {
      blockers.push(`Live ${path} returned HTTP ${response.status}; expected ${allowed.join(" or ")}.`);
    }
    return { path, status: response.status, ok };
  } catch (error) {
    blockers.push(`Live ${path} failed: ${error instanceof Error ? error.message : String(error)}`);
    return { path, status: 0, ok: false };
  }
}
