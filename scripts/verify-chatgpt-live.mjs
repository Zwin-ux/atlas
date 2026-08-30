import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const EXPECTED_TOOLS = [
  ["get_map_state", "What's on the Atlas map"],
  ["search_places", "Find U.S. places"],
  ["open_place", "Show a place on Atlas"],
  ["add_map_note", "Add a place note"],
  ["create_map_trail", "Build a research trail"],
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function challengeUrl() {
  const raw = process.argv[2] ?? process.env.ATLAS_CHATGPT_URL ?? "http://127.0.0.1:8787/explore";
  const url = new URL(raw);
  const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname);
  assert(url.protocol === "https:" || (loopback && url.protocol === "http:"), "Remote ChatGPT preflight requires an HTTPS URL.");
  if (url.pathname === "/") url.pathname = "/explore";
  assert(url.pathname === "/explore", "ATLAS_CHATGPT_URL must target the top-level /explore route.");
  url.search = "";
  url.hash = "";
  return url;
}

async function request(url, init = {}) {
  const startedAt = performance.now();
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  return { response, elapsedMs: Math.round(performance.now() - startedAt) };
}

async function json(url) {
  const { response, elapsedMs } = await request(url, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => undefined);
  assert(response.ok, `${url.pathname} returned HTTP ${response.status}.`);
  assert(body && typeof body === "object", `${url.pathname} did not return JSON.`);
  return { response, body, elapsedMs };
}

function publicCandidate(candidate) {
  return candidate && typeof candidate === "object"
    && typeof candidate.name === "string"
    && typeof candidate.countyName === "string"
    && typeof candidate.countySlug === "string"
    && typeof candidate.state === "string"
    && (candidate.kind === "place" || candidate.kind === "county")
    && !("geometry" in candidate)
    && !("coordinates" in candidate);
}

const url = challengeUrl();
const origin = new URL(url.origin);
const readyUrl = new URL("/ready", origin);
const ambiguousUrl = new URL("/api/atlas/resolve?query=Springfield", origin);
const resolvedUrl = new URL("/api/atlas/resolve?query=Riverside%20County%2C%20CA", origin);

const ready = await json(readyUrl);
assert(ready.body.ok === true, "Atlas readiness reported false.");
assert(Number(ready.body.atlas?.counties ?? 0) >= 3_000, "Atlas readiness did not report the national county index.");

const page = await request(url, { headers: { accept: "text/html" } });
const html = await page.response.text();
assert(page.response.ok, `/explore returned HTTP ${page.response.status}.`);
assert(page.response.headers.get("origin-agent-cluster") === "?1", "/explore is missing Origin-Agent-Cluster: ?1.");
assert(page.response.headers.get("permissions-policy")?.includes("tools=(self)"), "/explore is missing Permissions-Policy: tools=(self).");
assert(/<main\s+id=["']root["']><\/main>/i.test(html), "/explore is not the standalone Atlas page.");
assert(!/type=["']password["']|sign\s?in|log\s?in/i.test(html), "/explore unexpectedly exposes an authentication gate.");

const scriptMatch = /<script[^>]+src=["']([^"']+component\.js)["']/i.exec(html);
assert(scriptMatch, "/explore does not load the Atlas component bundle.");
const bundleUrl = new URL(scriptMatch[1], url);
const bundle = await request(bundleUrl, { headers: { accept: "text/javascript" } });
const bundleSource = await bundle.response.text();
assert(bundle.response.ok, `${bundleUrl.pathname} returned HTTP ${bundle.response.status}.`);
for (const [name, title] of EXPECTED_TOOLS) {
  assert(bundleSource.includes(name), `The deployed bundle is missing ${name}.`);
  assert(bundleSource.includes(title), `The deployed bundle is missing the Site Tools title ${title}.`);
}
assert(!/select_county|scout_drop|campaign|hosted_clawd/i.test(bundleSource), "A retired tool name leaked into the deployed challenge bundle.");

const ambiguous = await json(ambiguousUrl);
assert(ambiguous.body.status === "ambiguous", "Springfield did not remain ambiguous.");
assert(Array.isArray(ambiguous.body.candidates) && ambiguous.body.candidates.length > 1, "Springfield did not return multiple candidates.");
assert(ambiguous.body.candidates.every(publicCandidate), "Springfield candidates contain an invalid or oversized public shape.");

const resolved = await json(resolvedUrl);
assert(resolved.body.status === "resolved", "Riverside County, CA did not resolve.");
assert(publicCandidate(resolved.body.place), "The resolved Riverside candidate has an invalid public shape.");
assert(resolved.body.place.countySlug === "riverside-ca", "Riverside County resolved to the wrong county.");

const report = {
  ok: true,
  checkedAt: new Date().toISOString(),
  url: url.href,
  origin: url.origin,
  transport: url.protocol === "https:" ? "public_https" : "loopback_http",
  ready: {
    elapsedMs: ready.elapsedMs,
    counties: ready.body.atlas.counties,
    places: ready.body.atlas.places,
  },
  page: {
    elapsedMs: page.elapsedMs,
    originAgentCluster: page.response.headers.get("origin-agent-cluster"),
    permissionsPolicy: page.response.headers.get("permissions-policy"),
    noLogin: true,
  },
  bundle: {
    elapsedMs: bundle.elapsedMs,
    bytes: Buffer.byteLength(bundleSource),
    tools: EXPECTED_TOOLS.map(([name, title]) => ({ name, title })),
  },
  resolution: {
    springfieldCandidates: ambiguous.body.candidates.length,
    riversideCountySlug: resolved.body.place.countySlug,
  },
  boundary: "Deployment preflight proves the HTTPS/page contract; Chrome smoke and a real ChatGPT transcript prove tool execution.",
};

const reportPath = process.env.ATLAS_CHATGPT_PREFLIGHT_REPORT;
if (reportPath) {
  const absolute = resolve(reportPath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(report, null, 2));
