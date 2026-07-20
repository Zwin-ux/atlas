import { existsSync, readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { relative, resolve } from "node:path";
import { isValidCountySlug } from "./countyGeoPack.js";

// Road-chunk serving layer (0.78-R2). Backs the three read-only routes the band
// controller drives — catalog pointer, manifest, chunk — behind a thin
// CDN-swappable store interface (wire contract §3.4). Today the only backing is
// the filesystem (Railway volume / repo fixture); an object-store/CDN backing
// later implements the same interface. The route handlers talk ONLY to this
// interface and never touch fs directly.
//
// Alignment with docs/0.78R_WIRE_CONTRACT.md, with two DEVIATIONS noted inline:
//   D1. Routes are addressed by county SLUG, not GEOID. The contract addresses
//       by GEOID; the baked fixture (data/road-chunks/<slug>/) and the sibling
//       /geo-pack/<slug> route are slug-keyed, and the contract itself states
//       "the slug maps to [geoid] deterministically" and permits a slug route in
//       D2-0 §6. The geoid stays available inside the manifest for the client.
//   D2. resolveCurrentEpoch returns StoreResult (not `CatalogPointer | null`) so
//       a real fs error on the catalog maps to 503 storage-unavailable, which
//       §2.4 requires but the `| null` signature could not express.

export type RoadBand = "lod0" | "mid" | "near";
const ROAD_BANDS: readonly RoadBand[] = ["lod0", "mid", "near"];

export function isValidRoadBand(band: string): band is RoadBand {
  return (ROAD_BANDS as readonly string[]).includes(band);
}

// chunkId: `c<cellX>_<cellY>[_<quadpath>]`, signed ints (§1.4). e.g. c-3_5, c12_7_31.
const CHUNK_ID_GUARD = /^c-?\d+_-?\d+(_[0-3]+)?$/;
export function isValidChunkId(chunkId: string): boolean {
  return CHUNK_ID_GUARD.test(chunkId);
}

// packHash arrives as one path segment (the fixture uses "sha256-<hex>"). Restrict
// to a safe token charset so it can never carry a slash/dot/traversal.
const PACK_HASH_GUARD = /^[a-z0-9-]+$/;
export function isValidPackHash(packHash: string): boolean {
  return PACK_HASH_GUARD.test(packHash);
}

export type CatalogPointer = {
  basisId: string;
  schemaVersion: string;
  packHash: string;
  manifestUri: string;
};

/** Negotiated request encoding (null = identity requested). */
export type AcceptEncoding = "br" | "gzip" | null;
export type ResolvedEncoding = "br" | "gzip" | "identity";
export type EncodedBytes = { bytes: Buffer; encoding: ResolvedEncoding };

export type StoreErrorReason = "missing" | "retired" | "unavailable";
export type StoreResult<T> = { ok: true; value: T } | { ok: false; reason: StoreErrorReason };

/**
 * CDN-swappable store contract. Async so an object-store/CDN backing can
 * implement it unchanged (the filesystem backing resolves synchronously inside).
 */
export interface RoadChunkStore {
  /** Atomic epoch pointer. `missing` -> absent pack (404); `unavailable` -> 503. */
  resolveCurrentEpoch(slug: string): Promise<StoreResult<CatalogPointer>>;
  /** Manifest for a pinned epoch. `retired` -> 410; `unavailable` -> 503. */
  getManifest(slug: string, schemaVersion: string, packHash: string, accept: AcceptEncoding): Promise<StoreResult<EncodedBytes>>;
  /**
   * One precompressed chunk for a pinned epoch + band. `missing` -> 404
   * missing-expected; `retired` -> 410; `unavailable` -> 503.
   */
  getChunk(
    slug: string,
    schemaVersion: string,
    packHash: string,
    band: RoadBand,
    chunkId: string,
    accept: AcceptEncoding,
  ): Promise<StoreResult<EncodedBytes>>;
}

/**
 * HTTP origin store — same path layout as the filesystem tree under
 * data/road-chunks (see docs/NATIONAL_SCALE.md). Used as national fallback so
 * multi-GB packs live on a bucket/CDN, not in the Railway image.
 */
export function createHttpRoadChunkStore(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): RoadChunkStore {
  const root = String(baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!root) {
    throw new Error("createHttpRoadChunkStore requires a non-empty baseUrl");
  }

  async function readEncodedHttp(path: string, accept: AcceptEncoding): Promise<StoreResult<EncodedBytes>> {
    try {
      const headers: Record<string, string> = {
        accept: "application/json, */*",
      };
      // Prefer precompressed siblings when the origin serves them as separate keys
      // (our bake writes .json.br / .json.gz). Fall back to identity .json.
      const candidates: Array<{ suffix: string; encoding: ResolvedEncoding }> = [];
      if (accept === "br") candidates.push({ suffix: ".br", encoding: "br" });
      if (accept === "gzip" || accept === "br") candidates.push({ suffix: ".gz", encoding: "gzip" });
      candidates.push({ suffix: "", encoding: "identity" });

      for (const candidate of candidates) {
        const url = `${root}/${path}${candidate.suffix}`;
        const res = await fetchImpl(url, { headers, redirect: "follow" });
        if (res.status === 404) continue;
        if (res.status === 410) return { ok: false, reason: "retired" };
        if (!res.ok) return { ok: false, reason: "unavailable" };
        const bytes = Buffer.from(await res.arrayBuffer());
        return { ok: true, value: { bytes, encoding: candidate.encoding } };
      }
      return { ok: false, reason: "missing" };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }

  return {
    async resolveCurrentEpoch(slug: string): Promise<StoreResult<CatalogPointer>> {
      if (!isValidCountySlug(slug)) return { ok: false, reason: "missing" };
      try {
        const res = await fetchImpl(`${root}/${slug}/catalog.json`, {
          headers: { accept: "application/json", "accept-encoding": "identity" },
          redirect: "follow",
        });
        if (res.status === 404) return { ok: false, reason: "missing" };
        if (!res.ok) return { ok: false, reason: "unavailable" };
        const parsed = (await res.json()) as Partial<CatalogPointer>;
        if (!parsed || typeof parsed.packHash !== "string" || typeof parsed.schemaVersion !== "string") {
          return { ok: false, reason: "unavailable" };
        }
        return {
          ok: true,
          value: {
            basisId: typeof parsed.basisId === "string" ? parsed.basisId : "",
            schemaVersion: parsed.schemaVersion,
            packHash: parsed.packHash,
            manifestUri: typeof parsed.manifestUri === "string" ? parsed.manifestUri : "",
          },
        };
      } catch {
        return { ok: false, reason: "unavailable" };
      }
    },

    async getManifest(slug, schemaVersion, packHash, accept): Promise<StoreResult<EncodedBytes>> {
      if (!isValidCountySlug(slug) || !isValidPackHash(packHash)) return { ok: false, reason: "missing" };
      const result = await readEncodedHttp(`${slug}/${schemaVersion}/${packHash}/manifest.json`, accept);
      if (!result.ok && result.reason === "missing") return { ok: false, reason: "retired" };
      return result;
    },

    async getChunk(slug, schemaVersion, packHash, band, chunkId, accept): Promise<StoreResult<EncodedBytes>> {
      if (
        !isValidCountySlug(slug) ||
        !isValidPackHash(packHash) ||
        !isValidRoadBand(band) ||
        !isValidChunkId(chunkId)
      ) {
        return { ok: false, reason: "missing" };
      }
      // Missing under a published epoch → missing-expected (caller maps 404).
      // Entire epoch gone on origin → try path; 404 on identity → missing.
      return readEncodedHttp(`${slug}/${schemaVersion}/${packHash}/${band}/${chunkId}.json`, accept);
    },
  };
}

/**
 * FS (or local) first, then remote origin. Lets dogfood stay in the image while
 * national packs live only on the bucket.
 */
export function createFallbackRoadChunkStore(primary: RoadChunkStore, secondary: RoadChunkStore): RoadChunkStore {
  async function prefer(
    first: Promise<StoreResult<CatalogPointer | EncodedBytes>>,
    second: () => Promise<StoreResult<CatalogPointer | EncodedBytes>>,
  ): Promise<StoreResult<CatalogPointer | EncodedBytes>> {
    const a = await first;
    if (a.ok) return a;
    // Real storage faults on primary should surface; don't mask with secondary.
    if (a.reason === "unavailable") return a;
    return second();
  }

  return {
    resolveCurrentEpoch(slug) {
      return prefer(primary.resolveCurrentEpoch(slug), () => secondary.resolveCurrentEpoch(slug)) as Promise<
        StoreResult<CatalogPointer>
      >;
    },
    getManifest(slug, schemaVersion, packHash, accept) {
      return prefer(primary.getManifest(slug, schemaVersion, packHash, accept), () =>
        secondary.getManifest(slug, schemaVersion, packHash, accept),
      ) as Promise<StoreResult<EncodedBytes>>;
    },
    getChunk(slug, schemaVersion, packHash, band, chunkId, accept) {
      return prefer(primary.getChunk(slug, schemaVersion, packHash, band, chunkId, accept), () =>
        secondary.getChunk(slug, schemaVersion, packHash, band, chunkId, accept),
      ) as Promise<StoreResult<EncodedBytes>>;
    },
  };
}

/** Build the process-wide road store from env (testable pure helper). */
export function createRoadChunkStoreFromEnv(
  env: NodeJS.ProcessEnv,
  options: { filesystemRoot: string; fetchImpl?: typeof fetch } = { filesystemRoot: "" },
): { store: RoadChunkStore; origin: string | null; publicOrigin: string | null } {
  const filesystemRoot = options.filesystemRoot;
  const fetchImpl = options.fetchImpl ?? fetch;
  const origin = (env.ATLAS_ROAD_CHUNKS_ORIGIN ?? "").trim().replace(/\/+$/, "") || null;
  // Client-direct CDN URL only when explicitly advertised (must allow CORS *).
  // Server-side ORIGIN can be private; do not leak it as publicOrigin by default.
  const publicOrigin = (env.ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN ?? "").trim().replace(/\/+$/, "") || null;
  const fsStore = createFilesystemRoadChunkStore(filesystemRoot);
  if (!origin) {
    return { store: fsStore, origin: null, publicOrigin };
  }
  const httpStore = createHttpRoadChunkStore(origin, fetchImpl);
  return {
    store: createFallbackRoadChunkStore(fsStore, httpStore),
    origin,
    publicOrigin,
  };
}

export function createFilesystemRoadChunkStore(rootDir: string): RoadChunkStore {
  const root = resolve(rootDir);

  // Defense-in-depth beyond the regex guards: resolve the path and confirm it
  // stays inside root before any read (mirrors sendWidgetAssetResponse).
  function within(...parts: string[]): string | null {
    const abs = resolve(root, ...parts);
    const rel = relative(root, abs);
    if (rel.startsWith("..") || resolve(root, rel) !== abs) return null;
    return abs;
  }

  // `baseAbs` is the identity `.json` path — the canonical existence check. When
  // it exists, serve the negotiated precompressed sibling (.br/.gz) if present,
  // else identity. Missing identity -> `missing`; any read error -> `unavailable`.
  function readEncoded(baseAbs: string, accept: AcceptEncoding): StoreResult<EncodedBytes> {
    if (!existsSync(baseAbs)) return { ok: false, reason: "missing" };
    try {
      if (accept === "br" && existsSync(`${baseAbs}.br`)) {
        return { ok: true, value: { bytes: readFileSync(`${baseAbs}.br`), encoding: "br" } };
      }
      if (accept === "gzip" && existsSync(`${baseAbs}.gz`)) {
        return { ok: true, value: { bytes: readFileSync(`${baseAbs}.gz`), encoding: "gzip" } };
      }
      return { ok: true, value: { bytes: readFileSync(baseAbs), encoding: "identity" } };
    } catch {
      return { ok: false, reason: "unavailable" };
    }
  }

  return {
    async resolveCurrentEpoch(slug: string): Promise<StoreResult<CatalogPointer>> {
      if (!isValidCountySlug(slug)) return { ok: false, reason: "missing" };
      const abs = within(slug, "catalog.json");
      if (!abs || !existsSync(abs)) return { ok: false, reason: "missing" }; // absent pack
      try {
        const parsed = JSON.parse(readFileSync(abs, "utf8")) as Partial<CatalogPointer>;
        if (!parsed || typeof parsed.packHash !== "string" || typeof parsed.schemaVersion !== "string") {
          return { ok: false, reason: "unavailable" }; // corrupt catalog
        }
        return {
          ok: true,
          value: {
            basisId: typeof parsed.basisId === "string" ? parsed.basisId : "",
            schemaVersion: parsed.schemaVersion,
            packHash: parsed.packHash,
            manifestUri: typeof parsed.manifestUri === "string" ? parsed.manifestUri : "",
          },
        };
      } catch {
        return { ok: false, reason: "unavailable" };
      }
    },

    async getManifest(slug, schemaVersion, packHash, accept): Promise<StoreResult<EncodedBytes>> {
      const epochDir = within(slug, schemaVersion, packHash);
      if (!epochDir || !existsSync(epochDir)) return { ok: false, reason: "retired" }; // packHash GC'd
      const base = within(slug, schemaVersion, packHash, "manifest.json");
      if (!base) return { ok: false, reason: "retired" };
      const result = readEncoded(base, accept);
      // A manifest absent under an existing epoch dir is a broken epoch, not a
      // routine miss -> storage failure (503), never 404.
      if (!result.ok && result.reason === "missing") return { ok: false, reason: "unavailable" };
      return result;
    },

    async getChunk(slug, schemaVersion, packHash, band, chunkId, accept): Promise<StoreResult<EncodedBytes>> {
      const epochDir = within(slug, schemaVersion, packHash);
      if (!epochDir || !existsSync(epochDir)) return { ok: false, reason: "retired" }; // whole epoch gone -> 410
      const base = within(slug, schemaVersion, packHash, band, `${chunkId}.json`);
      if (!base) return { ok: false, reason: "retired" };
      // Missing identity here means the manifest claimed present but the chunk is
      // absent (mid-seed partial) -> `missing` -> 404 missing-expected.
      return readEncoded(base, accept);
    },
  };
}

// ---------------------------------------------------------------------------
// Pure reason -> HTTP mapping (route-kind aware). The single place the four
// distinguished states (§2.4) are turned into status + body.
// ---------------------------------------------------------------------------

export type RoadRouteKind = "catalog" | "manifest" | "chunk";

export function roadChunkErrorResponse(
  kind: RoadRouteKind,
  reason: StoreErrorReason,
  chunkId?: string,
): { status: number; body: Record<string, unknown> } {
  if (reason === "unavailable") return { status: 503, body: { ok: false, state: "storage-unavailable" } };
  if (reason === "retired") return { status: 410, body: { ok: false, state: "retired" } };
  // reason === "missing": same 404, different body per route context.
  if (kind === "chunk") {
    return { status: 404, body: chunkId ? { ok: false, state: "missing-expected", chunkId } : { ok: false, state: "missing-expected" } };
  }
  return { status: 404, body: { ok: false, state: "absent" } }; // catalog (+ manifest fallback)
}

// ---------------------------------------------------------------------------
// HTTP glue. Reuses the widget-asset header discipline (immutable caching +
// wildcard CORS + cross-origin-resource-policy) so the web-sandbox origin can
// fetch cross-origin (§3.3/§5.2). Precompressed bytes are served directly with
// `content-encoding` + `vary: accept-encoding` — never recompressed per request.
// ---------------------------------------------------------------------------

const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const CATALOG_CACHE_CONTROL = "no-cache"; // mutable pointer: a re-bake flips it (§3.3)
const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "cross-origin-resource-policy": "cross-origin",
};

function writeRoadJson(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}): number {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra });
  res.end(JSON.stringify(body));
  return status;
}

function writeRoadBytes(res: ServerResponse, bytes: Buffer, encoding: ResolvedEncoding, cacheControl: string): number {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": cacheControl,
    vary: "Accept-Encoding",
    ...CORS_HEADERS,
  };
  if (encoding !== "identity") headers["content-encoding"] = encoding;
  res.writeHead(200, headers);
  res.end(bytes);
  return 200;
}

function badRoadRequest(res: ServerResponse): number {
  return writeRoadJson(res, 400, { ok: false, state: "bad-request" }, { "cache-control": "no-store" });
}

/** GET /road-catalog/<slug>/current — mutable pointer (no-cache). Returns status. */
export async function serveRoadCatalog(res: ServerResponse, store: RoadChunkStore, slug: string | undefined): Promise<number> {
  if (!isValidCountySlug(slug)) return badRoadRequest(res);
  const result = await store.resolveCurrentEpoch(slug);
  if (!result.ok) {
    const mapped = roadChunkErrorResponse("catalog", result.reason);
    return writeRoadJson(res, mapped.status, mapped.body, { "cache-control": CATALOG_CACHE_CONTROL });
  }
  return writeRoadJson(res, 200, result.value, { "cache-control": CATALOG_CACHE_CONTROL });
}

/** GET manifest.json — immutable, precompressed. Returns status. */
export async function serveRoadManifest(
  res: ServerResponse,
  store: RoadChunkStore,
  slug: string | undefined,
  schemaVersion: string,
  packHash: string | undefined,
  accept: AcceptEncoding,
): Promise<number> {
  if (!isValidCountySlug(slug) || !packHash || !isValidPackHash(packHash)) return badRoadRequest(res);
  const result = await store.getManifest(slug, schemaVersion, packHash, accept);
  if (!result.ok) {
    const mapped = roadChunkErrorResponse("manifest", result.reason);
    return writeRoadJson(res, mapped.status, mapped.body);
  }
  return writeRoadBytes(res, result.value.bytes, result.value.encoding, IMMUTABLE_CACHE_CONTROL);
}

/** GET one chunk — immutable, precompressed. Returns status. */
export async function serveRoadChunk(
  res: ServerResponse,
  store: RoadChunkStore,
  slug: string | undefined,
  schemaVersion: string,
  packHash: string | undefined,
  band: string | undefined,
  chunkId: string | undefined,
  accept: AcceptEncoding,
): Promise<number> {
  if (
    !isValidCountySlug(slug) ||
    !packHash || !isValidPackHash(packHash) ||
    !band || !isValidRoadBand(band) ||
    !chunkId || !isValidChunkId(chunkId)
  ) {
    return badRoadRequest(res);
  }
  const result = await store.getChunk(slug, schemaVersion, packHash, band, chunkId, accept);
  if (!result.ok) {
    const mapped = roadChunkErrorResponse("chunk", result.reason, chunkId);
    return writeRoadJson(res, mapped.status, mapped.body);
  }
  return writeRoadBytes(res, result.value.bytes, result.value.encoding, IMMUTABLE_CACHE_CONTROL);
}

// ---------------------------------------------------------------------------
// Observability (0.78-R2). Hit/miss/latency counters for the road routes, fed
// into the token-gated ops-stats surface. The counting logic lives HERE (not in
// index.ts) so it is unit-testable without importing the server entrypoint; it
// mirrors the McpToolMetric latency shape (count / totalMs / maxMs).
// ---------------------------------------------------------------------------

export type RoadRouteOutcome = "hit" | "miss" | "retired" | "unavailable" | "bad-request";

/** Pure: served HTTP status -> observability outcome. */
export function classifyRoadRouteStatus(status: number): RoadRouteOutcome {
  if (status === 200) return "hit";
  if (status === 404) return "miss"; // absent pack / missing-expected chunk
  if (status === 410) return "retired";
  if (status === 503) return "unavailable";
  return "bad-request"; // 400 guard (or any unexpected status)
}

export type RoadRouteLatency = { count: number; totalMs: number; maxMs: number };
export type RoadRouteMetric = {
  hits: number;
  misses: number;
  retired: number;
  unavailable: number;
  badRequests: number;
  latency: RoadRouteLatency;
};

export type RoadChunkRouteMetrics = {
  record(kind: RoadRouteKind, status: number, durationMs: number): void;
  snapshot(): Record<RoadRouteKind, RoadRouteMetric>;
};

function emptyRoadRouteMetric(): RoadRouteMetric {
  return { hits: 0, misses: 0, retired: 0, unavailable: 0, badRequests: 0, latency: { count: 0, totalMs: 0, maxMs: 0 } };
}

function cloneRoadRouteMetric(metric: RoadRouteMetric): RoadRouteMetric {
  return {
    hits: metric.hits,
    misses: metric.misses,
    retired: metric.retired,
    unavailable: metric.unavailable,
    badRequests: metric.badRequests,
    latency: { ...metric.latency },
  };
}

export function createRoadChunkRouteMetrics(): RoadChunkRouteMetrics {
  const metrics: Record<RoadRouteKind, RoadRouteMetric> = {
    catalog: emptyRoadRouteMetric(),
    manifest: emptyRoadRouteMetric(),
    chunk: emptyRoadRouteMetric(),
  };
  return {
    record(kind, status, durationMs) {
      const metric = metrics[kind];
      switch (classifyRoadRouteStatus(status)) {
        case "hit": metric.hits += 1; break;
        case "miss": metric.misses += 1; break;
        case "retired": metric.retired += 1; break;
        case "unavailable": metric.unavailable += 1; break;
        case "bad-request": metric.badRequests += 1; break;
      }
      const ms = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : 0;
      metric.latency.count += 1;
      metric.latency.totalMs += ms;
      metric.latency.maxMs = Math.max(metric.latency.maxMs, ms);
    },
    snapshot() {
      return {
        catalog: cloneRoadRouteMetric(metrics.catalog),
        manifest: cloneRoadRouteMetric(metrics.manifest),
        chunk: cloneRoadRouteMetric(metrics.chunk),
      };
    },
  };
}
