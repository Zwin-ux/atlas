import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  classifyRoadRouteStatus,
  createFilesystemRoadChunkStore,
  createRoadChunkRouteMetrics,
  isValidChunkId,
  isValidPackHash,
  isValidRoadBand,
  roadChunkErrorResponse,
  serveRoadCatalog,
  serveRoadChunk,
  serveRoadManifest,
  type AcceptEncoding,
} from "../src/roadChunkStore.js";

// ---------------------------------------------------------------------------
// Real baked fixture (committed at data/road-chunks/miami-dade-fl).
// ---------------------------------------------------------------------------

const testDir = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = resolve(testDir, "../../data/road-chunks");
const SLUG = "miami-dade-fl";

const catalog = JSON.parse(readFileSync(resolve(FIXTURE_ROOT, SLUG, "catalog.json"), "utf8"));
const PACK_HASH: string = catalog.packHash;
const SCHEMA_VERSION: string = catalog.schemaVersion; // "roadchunk/1"
const EPOCH_DIR = resolve(FIXTURE_ROOT, SLUG, SCHEMA_VERSION, PACK_HASH);
const manifest = JSON.parse(readFileSync(resolve(EPOCH_DIR, "manifest.json"), "utf8"));

// Pull a real present chunkId from the manifest (robust to fixture regen).
function firstPresentChunkId(): string {
  const cells = manifest.bands.near.cells as Record<string, { state: string; chunks: { chunkId: string; state: string }[] }>;
  for (const cell of Object.values(cells)) {
    if (cell.state === "present" && cell.chunks[0]?.state === "present") return cell.chunks[0].chunkId;
  }
  throw new Error("fixture has no present chunk");
}
const PRESENT_CHUNK = firstPresentChunkId();

const store = createFilesystemRoadChunkStore(FIXTURE_ROOT);

type Captured = { status: number; headers: Record<string, string>; body: Buffer | string };
function mockResponse(): { res: ServerResponse; captured: Captured } {
  const captured: Captured = { status: 0, headers: {}, body: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>): ServerResponse {
      captured.status = status;
      if (headers) for (const [k, v] of Object.entries(headers)) captured.headers[k.toLowerCase()] = v;
      return res;
    },
    end(body?: Buffer | string): ServerResponse {
      if (body !== undefined) captured.body = body;
      return res;
    },
  } as unknown as ServerResponse;
  return { res, captured };
}
function bodyJson(captured: Captured): any {
  return JSON.parse(captured.body.toString());
}

// ---------------------------------------------------------------------------
// Store — real fixture
// ---------------------------------------------------------------------------

test("resolveCurrentEpoch returns the catalog pointer for a baked county", async () => {
  const result = await store.resolveCurrentEpoch(SLUG);
  assert.ok(result.ok);
  assert.equal(result.value.packHash, PACK_HASH);
  assert.equal(result.value.schemaVersion, "roadchunk/1");
  assert.equal(result.value.basisId, "atlas-county-equirect-v1");
  assert.ok(result.value.manifestUri.length > 0);
});

test("resolveCurrentEpoch reports `missing` (absent pack) for an unbaked county", async () => {
  // A valid slug with no bake dir (must NOT be any county the bake produces).
  const result = await store.resolveCurrentEpoch("nonexistent-county-zz");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "missing");
});

test("getManifest negotiates encoding and serves the precompressed bytes directly", async () => {
  const br = await store.getManifest(SLUG, SCHEMA_VERSION, PACK_HASH, "br");
  const gz = await store.getManifest(SLUG, SCHEMA_VERSION, PACK_HASH, "gzip");
  const id = await store.getManifest(SLUG, SCHEMA_VERSION, PACK_HASH, null);
  assert.ok(br.ok && gz.ok && id.ok);
  if (br.ok && gz.ok && id.ok) {
    assert.equal(br.value.encoding, "br");
    assert.equal(gz.value.encoding, "gzip");
    assert.equal(id.value.encoding, "identity");
    // Precompressed bytes are the real .br/.gz — smaller than identity, not equal.
    assert.ok(br.value.bytes.length < id.value.bytes.length);
    assert.ok(br.value.bytes.equals(readFileSync(resolve(EPOCH_DIR, "manifest.json.br"))));
  }
});

test("getChunk serves a present chunk in the negotiated encoding", async () => {
  const br = await store.getChunk(SLUG, SCHEMA_VERSION, PACK_HASH, "near", PRESENT_CHUNK, "br");
  const id = await store.getChunk(SLUG, SCHEMA_VERSION, PACK_HASH, "near", PRESENT_CHUNK, null);
  assert.ok(br.ok && id.ok);
  if (br.ok && id.ok) {
    assert.equal(br.value.encoding, "br");
    assert.equal(id.value.encoding, "identity");
    assert.ok(br.value.bytes.length < id.value.bytes.length);
    assert.ok(br.value.bytes.equals(readFileSync(resolve(EPOCH_DIR, "near", `${PRESENT_CHUNK}.json.br`))));
  }
});

test("getChunk reports `missing` for a well-formed chunkId absent on disk", async () => {
  const result = await store.getChunk(SLUG, SCHEMA_VERSION, PACK_HASH, "near", "c9999_9999", null);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "missing");
});

test("getChunk / getManifest report `retired` for an unknown packHash", async () => {
  const chunk = await store.getChunk(SLUG, SCHEMA_VERSION, "sha256-deadbeef", "near", PRESENT_CHUNK, null);
  const man = await store.getManifest(SLUG, SCHEMA_VERSION, "sha256-deadbeef", null);
  assert.equal(chunk.ok, false);
  assert.equal(man.ok, false);
  if (!chunk.ok) assert.equal(chunk.reason, "retired");
  if (!man.ok) assert.equal(man.reason, "retired");
});

// ---------------------------------------------------------------------------
// Pure reason -> HTTP mapping
// ---------------------------------------------------------------------------

test("roadChunkErrorResponse maps the four distinguished states", () => {
  assert.deepEqual(roadChunkErrorResponse("catalog", "missing"), { status: 404, body: { ok: false, state: "absent" } });
  assert.deepEqual(roadChunkErrorResponse("chunk", "missing", "c1_1"), {
    status: 404,
    body: { ok: false, state: "missing-expected", chunkId: "c1_1" },
  });
  assert.deepEqual(roadChunkErrorResponse("manifest", "retired"), { status: 410, body: { ok: false, state: "retired" } });
  assert.deepEqual(roadChunkErrorResponse("chunk", "unavailable"), {
    status: 503,
    body: { ok: false, state: "storage-unavailable" },
  });
});

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

test("guards accept valid tokens and reject traversal / malformed input", () => {
  assert.equal(isValidRoadBand("near"), true);
  assert.equal(isValidRoadBand("mid"), true);
  assert.equal(isValidRoadBand("lod0"), true);
  assert.equal(isValidRoadBand("far"), false);
  assert.equal(isValidRoadBand("NEAR"), false);

  assert.equal(isValidChunkId("c10_13"), true);
  assert.equal(isValidChunkId("c-3_5"), true);
  assert.equal(isValidChunkId("c12_7_31"), true);
  assert.equal(isValidChunkId("10_13"), false);
  assert.equal(isValidChunkId("c1"), false);
  assert.equal(isValidChunkId("../c1_1"), false);
  assert.equal(isValidChunkId("c1_1.json"), false);

  assert.equal(isValidPackHash("sha256-f13c422b08e794fc"), true);
  assert.equal(isValidPackHash("SHA256"), false);
  assert.equal(isValidPackHash("a/b"), false);
  assert.equal(isValidPackHash("a.b"), false);
  assert.equal(isValidPackHash("../x"), false);
});

// ---------------------------------------------------------------------------
// Serve helpers — real fixture (headers, caching, CORS, encoding)
// ---------------------------------------------------------------------------

test("serveRoadCatalog: 200 no-cache pointer with CORS", async () => {
  const { res, captured } = mockResponse();
  const status = await serveRoadCatalog(res, store, SLUG);
  assert.equal(status, 200);
  assert.equal(captured.headers["cache-control"], "no-cache");
  assert.equal(captured.headers["access-control-allow-origin"], "*");
  assert.equal(captured.headers["cross-origin-resource-policy"], "cross-origin");
  assert.equal(bodyJson(captured).packHash, PACK_HASH);
});

test("serveRoadCatalog: 400 on a bad slug, 404 absent on an unbaked county", async () => {
  const bad = mockResponse();
  assert.equal(await serveRoadCatalog(bad.res, store, "Miami!"), 400);
  assert.equal(bodyJson(bad.captured).state, "bad-request");

  const absent = mockResponse();
  assert.equal(await serveRoadCatalog(absent.res, store, "nonexistent-county-zz"), 404);
  assert.equal(bodyJson(absent.captured).state, "absent");
  assert.equal(absent.captured.headers["cache-control"], "no-cache");
});

test("serveRoadManifest: 200 immutable + precompressed with vary + content-encoding", async () => {
  const { res, captured } = mockResponse();
  const status = await serveRoadManifest(res, store, SLUG, SCHEMA_VERSION, PACK_HASH, "br");
  assert.equal(status, 200);
  assert.equal(captured.headers["cache-control"], "public, max-age=31536000, immutable");
  assert.equal(captured.headers["vary"], "Accept-Encoding");
  assert.equal(captured.headers["content-encoding"], "br");
  assert.equal(captured.headers["access-control-allow-origin"], "*");
  assert.ok(Buffer.isBuffer(captured.body));
});

test("serveRoadChunk: 200 present, 404 missing-expected, 410 retired, 400 bad params", async () => {
  const ok = mockResponse();
  assert.equal(await serveRoadChunk(ok.res, store, SLUG, SCHEMA_VERSION, PACK_HASH, "near", PRESENT_CHUNK, "br"), 200);
  assert.equal(ok.captured.headers["content-encoding"], "br");
  assert.equal(ok.captured.headers["cache-control"], "public, max-age=31536000, immutable");

  const missing = mockResponse();
  assert.equal(await serveRoadChunk(missing.res, store, SLUG, SCHEMA_VERSION, PACK_HASH, "near", "c9999_9999", null), 404);
  assert.equal(bodyJson(missing.captured).state, "missing-expected");
  assert.equal(bodyJson(missing.captured).chunkId, "c9999_9999");

  const retired = mockResponse();
  assert.equal(await serveRoadChunk(retired.res, store, SLUG, SCHEMA_VERSION, "sha256-deadbeef", "near", PRESENT_CHUNK, null), 410);
  assert.equal(bodyJson(retired.captured).state, "retired");

  for (const [band, chunk, pack] of [
    ["sky", PRESENT_CHUNK, PACK_HASH],
    ["near", "not-a-chunk", PACK_HASH],
    ["near", PRESENT_CHUNK, "BAD/HASH"],
  ] as const) {
    const bad = mockResponse();
    assert.equal(await serveRoadChunk(bad.res, store, SLUG, SCHEMA_VERSION, pack, band, chunk, null), 400);
  }
});

test("serve helpers reject a traversal slug with 400 before any read", async () => {
  const { res, captured } = mockResponse();
  assert.equal(await serveRoadChunk(res, store, "../secret", SCHEMA_VERSION, PACK_HASH, "near", PRESENT_CHUNK, null), 400);
  assert.equal(captured.status, 400);
});

// ---------------------------------------------------------------------------
// Observability counters (task E)
// ---------------------------------------------------------------------------

test("classifyRoadRouteStatus maps served status to an outcome", () => {
  assert.equal(classifyRoadRouteStatus(200), "hit");
  assert.equal(classifyRoadRouteStatus(404), "miss");
  assert.equal(classifyRoadRouteStatus(410), "retired");
  assert.equal(classifyRoadRouteStatus(503), "unavailable");
  assert.equal(classifyRoadRouteStatus(400), "bad-request");
});

test("createRoadChunkRouteMetrics counts outcomes + latency per route; snapshot is a copy", () => {
  const m = createRoadChunkRouteMetrics();
  m.record("chunk", 200, 5);
  m.record("chunk", 200, 15);
  m.record("chunk", 404, 3);
  m.record("catalog", 503, 20);
  m.record("manifest", 410, 8);

  const snap = m.snapshot();
  assert.equal(snap.chunk.hits, 2);
  assert.equal(snap.chunk.misses, 1);
  assert.equal(snap.chunk.latency.count, 3);
  assert.equal(snap.chunk.latency.totalMs, 23);
  assert.equal(snap.chunk.latency.maxMs, 15);
  assert.equal(snap.catalog.unavailable, 1);
  assert.equal(snap.manifest.retired, 1);
  assert.equal(snap.manifest.hits, 0);

  // Negative/NaN durations are floored to 0, never corrupting the totals.
  m.record("chunk", 400, -100);
  assert.equal(m.snapshot().chunk.badRequests, 1);
  assert.equal(m.snapshot().chunk.latency.totalMs, 23);

  // Snapshot is a deep copy — mutating it must not leak back into the counters.
  snap.chunk.hits = 999;
  snap.chunk.latency.maxMs = 999;
  assert.equal(m.snapshot().chunk.hits, 2);
  assert.equal(m.snapshot().chunk.latency.maxMs, 15);
});

// ---------------------------------------------------------------------------
// Synthetic temp-dir fixture — the failure states the real one can't express.
// ---------------------------------------------------------------------------

const SYNTH_HASH = "sha256-synth";
const tmpRoot = mkdtempSync(join(tmpdir(), "atlas-road-chunks-"));

function seedSynth(): void {
  // synth-fl: a valid epoch with one present chunk (c0_0) and a deliberately
  // absent one (c1_1) that the manifest would claim present (mid-seed partial).
  const epoch = join(tmpRoot, "synth-fl", "roadchunk", "1", SYNTH_HASH);
  mkdirSync(join(epoch, "near"), { recursive: true });
  writeFileSync(join(tmpRoot, "synth-fl", "catalog.json"), JSON.stringify({
    basisId: "atlas-county-equirect-v1",
    schemaVersion: "roadchunk/1",
    packHash: SYNTH_HASH,
    manifestUri: `roadchunk/1/${SYNTH_HASH}/manifest.json`,
  }));
  writeFileSync(join(epoch, "manifest.json"), JSON.stringify({ schemaVersion: "roadchunk/1", packHash: SYNTH_HASH }));
  writeFileSync(join(epoch, "near", "c0_0.json"), JSON.stringify({ chunkId: "c0_0", features: [] }));

  // broken-fl: a catalog that is not valid JSON -> storage failure (503).
  mkdirSync(join(tmpRoot, "broken-fl"), { recursive: true });
  writeFileSync(join(tmpRoot, "broken-fl", "catalog.json"), "{ this is not json");

  // noman-fl: an epoch DIR that exists but has no manifest.json -> 503, not 404/410.
  mkdirSync(join(tmpRoot, "noman-fl", "roadchunk", "1", "sha256-noman"), { recursive: true });
}
seedSynth();
const synthStore = createFilesystemRoadChunkStore(tmpRoot);

test.after(() => rmSync(tmpRoot, { recursive: true, force: true }));

test("synthetic: present vs missing-expected vs retired chunk states", async () => {
  const present = await synthStore.getChunk("synth-fl", "roadchunk/1", SYNTH_HASH, "near", "c0_0", null);
  assert.ok(present.ok);

  const missing = await synthStore.getChunk("synth-fl", "roadchunk/1", SYNTH_HASH, "near", "c1_1", null);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, "missing"); // -> 404 missing-expected

  const retired = await synthStore.getChunk("synth-fl", "roadchunk/1", "sha256-gone", "near", "c0_0", null);
  assert.equal(retired.ok, false);
  if (!retired.ok) assert.equal(retired.reason, "retired"); // -> 410
});

test("synthetic: storage-unavailable on corrupt catalog and manifestless epoch", async () => {
  const corrupt = await synthStore.resolveCurrentEpoch("broken-fl");
  assert.equal(corrupt.ok, false);
  if (!corrupt.ok) assert.equal(corrupt.reason, "unavailable");

  const noManifest = await synthStore.getManifest("noman-fl", "roadchunk/1", "sha256-noman", null);
  assert.equal(noManifest.ok, false);
  if (!noManifest.ok) assert.equal(noManifest.reason, "unavailable");

  // And the serve wrappers turn those into 503s.
  const cat = mockResponse();
  assert.equal(await serveRoadCatalog(cat.res, synthStore, "broken-fl"), 503);
  assert.equal(bodyJson(cat.captured).state, "storage-unavailable");

  const man = mockResponse();
  assert.equal(
    await serveRoadManifest(man.res, synthStore, "noman-fl", "roadchunk/1", "sha256-noman", null as AcceptEncoding),
    503,
  );
});
