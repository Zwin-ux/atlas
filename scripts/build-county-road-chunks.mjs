#!/usr/bin/env node
// 0.78-R (decision #51, "one real county encoder") — bake a county's TIGER road
// network into roadchunk/1 chunks on the frozen spatial basis.
//
//   node scripts/build-county-road-chunks.mjs                       (miami-dade-fl)
//   node scripts/build-county-road-chunks.mjs --county miami-dade-fl --band near
//   node scripts/build-county-road-chunks.mjs --county miami-dade-fl --skip-existing
//
// Normative spec: docs/0.78R_WIRE_CONTRACT.md. Codec: packages/core (imported
// from dist — run `pnpm build:core` first if the dist is stale). This script is
// the D1 bake; it NEVER re-implements the codec (uses encodeRoadChunk /
// decodeRoadChunk / roadChunkFeatureFromVertices) and NEVER touches
// data/geo-packs/ (it may READ a geo pack for the frozen origin, never write).
//
// -----------------------------------------------------------------------------
// Bake decisions (where the contract underspecified an operational detail, the
// polite/simple option was chosen and is noted here + surfaced in the summary).
// -----------------------------------------------------------------------------
// B1. featureId source. This TIGERweb Transportation service exposes NO LINEARID
//     (fields: OBJECTID, MTFCC, NAME + name parts). §1.5 fallback therefore
//     applies: a stable 64-bit hash of the source geometry. Pinned input
//     (Appendix B #5): sha256 of `MTFCC | Ei,Ni;…` over the FULL (un-clipped)
//     quantised-metre polyline, truncated to 16 hex chars. Computed ONCE per
//     source polyline so every cross-cell clip shares one featureId (§1.5), and
//     stable across re-bakes because the basis (origin, Q) is frozen.
// B2. Band. The full network (primary+secondary+local, MTFCC S-class) is baked
//     into ONE band, default `near` — miami-dade-fl full roads is the NEAR
//     proving ground (§3.1, §3.5). Railroads (layer 9, R-class) are excluded:
//     the task is the road network. A per-band MTFCC split (highways→lod0,
//     arterials→mid, locals→near) is a later refinement, not this slice.
// B3. Spatial selection. Roads are pulled by the county bbox envelope (the
//     service carries no county attribute), then restricted to the county CELL
//     FOOTPRINT (base cells whose center is inside the boundary polygon, plus
//     cells the boundary traverses). Road portions outside the footprint are
//     dropped, so the baked extent is grid-aligned to 2048 m (decision #34's
//     NEAR hard-edge) and neighbouring-county roads in bbox corners are excluded.
//     The footprint is also what makes expected-empty declarations well defined
//     (§2.4): a footprint base cell with zero roads is expected-empty.
// B4. Clipping / cross-cell (§1.5). Every source polyline is assigned to EVERY
//     footprint cell its geometry intersects and clipped (Liang-Barsky) to that
//     cell's inclusive rect; a polyline that re-enters a cell yields multiple
//     pieces (all sharing the featureId — codec D8 allows the repeat). Boundary
//     de-dup (§1.5) is realized by the stable featureId (render-time de-dup of
//     authored modules) plus dropping degenerate single-point clips; a doubled
//     original vertex exactly on a 2048 m grid line to decimetre precision is
//     de-duped by featureId, not by geometric ownership.
// B5. Metro splitter (§1.4). A base cell whose Brotli-q11 chunk would exceed the
//     64 KB FAIL ceiling (§3.1) is subdivided into quadtree leaves
//     `c<x>_<y>_<quadpath>` (quad digits 0=SW 1=SE 2=NW 3=NE), re-clipping the
//     cell's own features into each sub-rect, recursing until every leaf is under
//     ceiling (MAX_DEPTH guard). Empty sub-quadrants are not emitted; the base
//     grid stays fixed. Split decisions size a placeholder-packHash encode; the
//     final gate re-measures the real bytes and FAILS the bake (non-zero exit +
//     failure manifest) if any real leaf exceeds FAIL.
// B6. packHash. §2.1 names BLAKE3; Node has no stdlib BLAKE3 and this script adds
//     no deps, so packHash = `sha256-<hex>` of the sorted per-chunk STRUCTURAL
//     hashes (each = sha256 of the packHash-independent chunk content). Same
//     immutability/content-addressing property; matches PACK_HASH_RE. The
//     structural hash excludes packHash to break the self-reference.
// B7. Manifest content hash = sha256 of the canonical identity JSON (the logical
//     content, compression-independent); the size ledger records the .br / .gz /
//     .json byte lengths (the .br is the §3.1 ceiling metric — the egress bytes).
// B8. Precompressed serving (§3.2): each chunk + the manifest are written as
//     identity `.json`, Brotli-q11 `.json.br`, and gzip-9 `.json.gz`.
// B9. Resumable (§ task): a per-county `_baked.json` marker records the last
//     packHash; `--skip-existing` skips a county whose marker + manifest already
//     exist (no re-fetch). Content-addressed packHash dirs are immutable, so a
//     changed source bakes a new epoch beside the old.
// =============================================================================

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import {
  brotliCompressSync,
  gzipSync,
  brotliDecompressSync,
  constants as zlibConstants,
} from "node:zlib";
import { createHash } from "node:crypto";
import { US_COUNTY_INDEX } from "../packages/core/dist/index.js";
import {
  encodeRoadChunk,
  decodeRoadChunk,
  roadChunkFeatureFromVertices,
  ROADCHUNK_BASIS_ID,
  ROADCHUNK_SCHEMA_VERSION,
  ROADCHUNK_QUANT_STEP_M,
  ROADCHUNK_CELL_EDGE_M,
  ROADCHUNK_WGS84_RADIUS_M,
} from "../packages/core/dist/voxel/roadChunkCodec.js";

// ---- Frozen constants (docs/0.78R_WIRE_CONTRACT.md §1) ----------------------

const Q = ROADCHUNK_QUANT_STEP_M; // 0.1 m per quantum
const CELL_M = ROADCHUNK_CELL_EDGE_M; // 2048 m grid cell edge
const R = ROADCHUNK_WGS84_RADIUS_M; // 6378137 m
const CQ = Math.round(CELL_M / Q); // 20480 quanta per cell edge
const DEG2RAD = Math.PI / 180;

const WARN_CEILING = 32 * 1024; // §3.1 warn (size-ledger signal)
const DEFAULT_FAIL_CEILING = 64 * 1024; // §3.1 fail (bake gate)
let FAIL_CEILING = DEFAULT_FAIL_CEILING; // overridable via --fail-ceiling (frozen-pending-calibration, Appendix B #1)
const MAX_SPLIT_DEPTH = 8; // 2048 / 2^8 = 8 m leaf floor (never reached in practice)

// ---- TIGERweb Transportation (Roads and Railroads), validated 2026-07-18 ----
const TRANSPORT_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer";
const COUNTY_LAYER =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/11/query";
// Finest-scale complete road layers: Primary(2) + Secondary(6) + Local(8).
const ROAD_LAYERS = [2, 6, 8];
const GEO_PACKS_DIR = "data/geo-packs"; // READ-ONLY (frozen origin source, B1/§1.2)
let OUT_ROOT = "data/road-chunks"; // overridable via --out-dir
const PAGE_SIZE = 4000; // resultRecordCount — bounded page, well under maxRecordCount(100000)
const GEOMETRY_PRECISION = 6; // ~0.1 m at 25.5°N — matches decimetre quantisation
const POLITE_PAGE_MS = 350; // between paginated pages (house pattern)
const POLITE_LAYER_MS = 250; // between road layers
const REQUEST_TIMEOUT_MS = 30_000; // per request (house pattern)
const RETRY_DELAYS = [0, 1_000, 4_000]; // bounded retry with backoff (house pattern)

// =============================================================================
// CLI
// =============================================================================

function parseArgs(argv) {
  let county = "miami-dade-fl";
  let band = "near";
  let skipExisting = false;
  let pageSize = PAGE_SIZE;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--county") county = argv[++i];
    else if (argv[i] === "--band") band = argv[++i];
    else if (argv[i] === "--skip-existing") skipExisting = true;
    else if (argv[i] === "--page-size") pageSize = Number(argv[++i]);
    else if (argv[i] === "--fail-ceiling") FAIL_CEILING = Number(argv[++i]); // calibration / splitter proof
    else if (argv[i] === "--out-dir") OUT_ROOT = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!["lod0", "mid", "near"].includes(band)) {
    throw new Error(`--band must be lod0|mid|near (got ${band})`);
  }
  return { county, band, skipExisting, pageSize };
}

function countyBySlug(slug) {
  const row = US_COUNTY_INDEX.find((entry) => entry.countySlug === slug);
  if (!row) throw new Error(`County not indexed: ${slug}`);
  return row;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =============================================================================
// Fetch (bounded retry + backoff, matching scripts/build-county-geo-packs.mjs)
// =============================================================================

async function fetchJsonWithRetry(url, label) {
  let lastError;
  for (const delay of RETRY_DELAYS) {
    if (delay > 0) await sleep(delay);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`${label} failed`);
}

async function fetchServiceVintage() {
  const meta = await fetchJsonWithRetry(`${TRANSPORT_BASE}?f=json`, "service metadata");
  return {
    source: "US Census TIGERweb — Transportation (Roads and Railroads)",
    serviceUrl: TRANSPORT_BASE,
    copyrightText: meta?.copyrightText ?? "Source: U.S. Census Bureau",
    serviceCurrentVersion: meta?.currentVersion ?? null,
    documentVersion: meta?.documentInfo?.Version ?? null,
    layers: ROAD_LAYERS,
    // TIGERweb "Current" tracks the latest published TIGER/Line vintage.
    vintage: "TIGERweb Current (Census TIGER/Line)",
    gazetteerYear: 2024,
    geometryPrecision: GEOMETRY_PRECISION,
    fetchedAt: new Date().toISOString(),
  };
}

// County boundary rings in lon/lat — for the frozen origin (§1.2) + footprint.
async function loadBoundaryRings(slug, geoid) {
  const packPath = `${GEO_PACKS_DIR}/${slug}.json`;
  if (existsSync(packPath)) {
    try {
      const pack = JSON.parse(readFileSync(packPath, "utf8"));
      const rings = pack?.lod0?.boundaryRings;
      if (Array.isArray(rings) && rings.length > 0) {
        return { rings, originSource: `geo-pack ${packPath} (LOD0 boundaryRings, §1.2)` };
      }
    } catch {
      /* fall through to a fresh fetch */
    }
  }
  const url =
    `${COUNTY_LAYER}?where=GEOID%3D%27${geoid}%27&outFields=GEOID,NAME` +
    `&returnGeometry=true&geometryPrecision=4&outSR=4326&f=geojson`;
  const geo = await fetchJsonWithRetry(url, `boundary ${geoid}`);
  const feature = geo?.features?.[0];
  if (!feature?.geometry) throw new Error(`No boundary geometry for ${geoid}`);
  const rings = ringsOfGeoJson(feature.geometry);
  return { rings, originSource: "TIGERweb State_County/11 (fresh fetch, full geometry)" };
}

function ringsOfGeoJson(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  throw new Error(`Unexpected boundary geometry type ${geometry.type}`);
}

// One road layer, fully paginated with resultOffset + exceededTransferLimit.
async function fetchRoadLayer(layer, envelope, pageSize, onPage) {
  const parts = []; // { mtfcc, coords: [[lon,lat],…] }  (one entry per LineString part)
  let offset = 0;
  let page = 0;
  for (;;) {
    const url =
      `${TRANSPORT_BASE}/${layer}/query?where=1%3D1` +
      `&geometry=${encodeURIComponent(envelope)}&geometryType=esriGeometryEnvelope` +
      `&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=MTFCC` +
      `&returnGeometry=true&geometryPrecision=${GEOMETRY_PRECISION}&outSR=4326` +
      `&orderByFields=OBJECTID&resultOffset=${offset}&resultRecordCount=${pageSize}&f=geojson`;
    const geo = await fetchJsonWithRetry(url, `layer ${layer} offset ${offset}`);
    const features = geo?.features ?? [];
    for (const feat of features) {
      const mtfcc = feat?.properties?.MTFCC;
      if (!mtfcc || !feat.geometry) continue;
      for (const coords of lineStringsOf(feat.geometry)) {
        if (coords.length >= 2) parts.push({ mtfcc, coords });
      }
    }
    page += 1;
    offset += features.length;
    onPage(layer, page, offset, parts.length);
    const more = geo?.exceededTransferLimit === true || features.length === pageSize;
    if (!more || features.length === 0) break;
    await sleep(POLITE_PAGE_MS);
  }
  return parts;
}

function lineStringsOf(geometry) {
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  return [];
}

// =============================================================================
// Projection + geometry (frozen basis §1.3, quanta grid §1.4)
// =============================================================================

function makeProjector(lon0, lat0) {
  const cosLat0 = Math.cos(lat0 * DEG2RAD);
  return function project(lon, lat) {
    const E = (lon - lon0) * cosLat0 * R * DEG2RAD;
    const N = (lat - lat0) * R * DEG2RAD;
    return [Math.round(E / Q), Math.round(N / Q)];
  };
}

function bboxCentre(rings) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { lon0: (minLon + maxLon) / 2, lat0: (minLat + maxLat) / 2, bbox: [minLon, minLat, maxLon, maxLat] };
}

const cellOf = (q) => Math.floor(q / CQ);
const cellRectQuanta = (cx, cy) => [cx * CQ, cy * CQ, (cx + 1) * CQ, (cy + 1) * CQ];

// Even-odd ray cast over all boundary rings (handles islands + holes, §B3).
function pointInPolygon(px, py, ringsQ) {
  let inside = false;
  for (const ring of ringsQ) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

// County cell footprint: interior-fill cells (center inside polygon) ∪ cells the
// boundary traverses (densified so a straight county line ≥ cell size is covered).
function buildFootprint(ringsQ) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of ringsQ) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const footprint = new Set();
  const cx0 = cellOf(minX), cx1 = cellOf(maxX), cy0 = cellOf(minY), cy1 = cellOf(maxY);
  for (let cy = cy0; cy <= cy1; cy += 1) {
    const centerN = cy * CQ + CQ / 2;
    for (let cx = cx0; cx <= cx1; cx += 1) {
      const centerE = cx * CQ + CQ / 2;
      if (pointInPolygon(centerE, centerN, ringsQ)) footprint.add(`${cx},${cy}`);
    }
  }
  const step = CQ / 2; // densify boundary to half a cell
  for (const ring of ringsQ) {
    for (let i = 0; i + 1 < ring.length; i += 1) {
      const a = ring[i], b = ring[i + 1];
      const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.ceil(dist / step));
      for (let k = 0; k <= n; k += 1) {
        const t = k / n;
        const px = a[0] + (b[0] - a[0]) * t;
        const py = a[1] + (b[1] - a[1]) * t;
        footprint.add(`${cellOf(px)},${cellOf(py)}`);
      }
    }
  }
  return { footprint, cellBox: { cx0, cx1, cy0, cy1 } };
}

// Liang-Barsky clip of one segment to an inclusive rect; rounds + clamps the
// clipped endpoints to integer quanta inside the rect. Returns [[x,y],[x,y]] or null.
function clipSegment(p0, p1, minX, minY, maxX, maxY) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  let t0 = 0, t1 = 1;
  const edges = [
    [-dx, p0[0] - minX],
    [dx, maxX - p0[0]],
    [-dy, p0[1] - minY],
    [dy, maxY - p0[1]],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null; // parallel and outside
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  if (t1 < t0) return null;
  const clampRound = (v, lo, hi) => {
    const rv = Math.round(v);
    return rv < lo ? lo : rv > hi ? hi : rv;
  };
  const ax = clampRound(p0[0] + t0 * dx, minX, maxX);
  const ay = clampRound(p0[1] + t0 * dy, minY, maxY);
  const bx = clampRound(p0[0] + t1 * dx, minX, maxX);
  const by = clampRound(p0[1] + t1 * dy, minY, maxY);
  if (ax === bx && ay === by) return null; // degenerate touch
  return [[ax, ay], [bx, by]];
}

// Clip a polyline to a rect → array of pieces (a re-entering line yields several).
function clipPolylineToRect(pts, rect) {
  const [minX, minY, maxX, maxY] = rect;
  const pieces = [];
  let cur = null;
  let lastKey = null;
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const seg = clipSegment(pts[i], pts[i + 1], minX, minY, maxX, maxY);
    if (!seg) {
      if (cur && cur.length >= 2) pieces.push(cur);
      cur = null;
      lastKey = null;
      continue;
    }
    const [a, b] = seg;
    const aKey = `${a[0]}:${a[1]}`;
    if (cur === null) cur = [a, b];
    else if (aKey === lastKey) cur.push(b);
    else {
      if (cur.length >= 2) pieces.push(cur);
      cur = [a, b];
    }
    lastKey = `${b[0]}:${b[1]}`;
  }
  if (cur && cur.length >= 2) pieces.push(cur);
  return pieces.map(dedupeConsecutive).filter((p) => p.length >= 2 && polylineLength(p) > 0);
}

function dedupeConsecutive(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i += 1) {
    const prev = out[out.length - 1];
    if (pts[i][0] !== prev[0] || pts[i][1] !== prev[1]) out.push(pts[i]);
  }
  return out;
}

function polylineLength(pts) {
  let len = 0;
  for (let i = 0; i + 1 < pts.length; i += 1) {
    len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  }
  return len;
}

function featureIdFor(mtfcc, pts) {
  const hash = createHash("sha256");
  hash.update(mtfcc);
  hash.update("|");
  hash.update(pts.map((p) => `${p[0]},${p[1]}`).join(";"));
  return hash.digest("hex").slice(0, 16); // 64-bit, matches ^[A-Za-z0-9]{1,64}$
}

// =============================================================================
// Encode / compress / split
// =============================================================================

const brotli = (buf) =>
  brotliCompressSync(buf, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: buf.length,
    },
  });
const gzip = (buf) => gzipSync(buf, { level: 9 });
const sha256Hex = (buf) => createHash("sha256").update(buf).digest("hex");

const PLACEHOLDER_PACKHASH = `sha256-${"0".repeat(64)}`; // same length as the real packHash

function buildChunk(geoid, band, chunkId, cellRect, featuresRaw, packHash) {
  const features = featuresRaw.map((f) =>
    roadChunkFeatureFromVertices(f.featureId, f.roadClass, f.vertices),
  );
  return {
    basisId: ROADCHUNK_BASIS_ID,
    schemaVersion: ROADCHUNK_SCHEMA_VERSION,
    geoid,
    packHash,
    chunkId,
    band,
    cellRect,
    features,
  };
}

// Recursively split a base cell until each leaf's Brotli-q11 chunk is under FAIL.
// Returns leaves: { chunkId, cellRect, featuresRaw }.
function splitCell(geoid, band, baseCellId, rect, featuresRaw, quadpath, depth) {
  const chunkId = quadpath.length ? `${baseCellId}_${quadpath}` : baseCellId;
  const chunk = buildChunk(geoid, band, chunkId, rect, featuresRaw, PLACEHOLDER_PACKHASH);
  const brSize = brotli(Buffer.from(encodeRoadChunk(chunk))).length;
  if (brSize <= FAIL_CEILING || depth >= MAX_SPLIT_DEPTH) {
    return [{ chunkId, cellRect: rect, featuresRaw }];
  }
  const [minX, minY, maxX, maxY] = rect;
  const midX = minX + Math.floor((maxX - minX) / 2);
  const midY = minY + Math.floor((maxY - minY) / 2);
  const quads = [
    [minX, minY, midX, midY], // 0 SW
    [midX, minY, maxX, midY], // 1 SE
    [minX, midY, midX, maxY], // 2 NW
    [midX, midY, maxX, maxY], // 3 NE
  ];
  const leaves = [];
  quads.forEach((qr, qi) => {
    const subFeatures = [];
    for (const f of featuresRaw) {
      for (const piece of clipPolylineToRect(f.vertices, qr)) {
        subFeatures.push({ featureId: f.featureId, roadClass: f.roadClass, vertices: piece });
      }
    }
    if (subFeatures.length > 0) {
      leaves.push(...splitCell(geoid, band, baseCellId, qr, subFeatures, quadpath + String(qi), depth + 1));
    }
  });
  return leaves;
}

// packHash-independent structural hash (B6) — canonical, deterministic.
function structuralHash(geoid, band, leaf) {
  const chunk = buildChunk(geoid, band, leaf.chunkId, leaf.cellRect, leaf.featuresRaw, PLACEHOLDER_PACKHASH);
  const canonical = {
    geoid,
    band,
    chunkId: chunk.chunkId,
    cellRect: chunk.cellRect,
    features: chunk.features.map((f) => ({
      featureId: f.featureId,
      roadClass: f.roadClass,
      start: f.start,
      delta: f.delta,
    })),
  };
  return sha256Hex(Buffer.from(JSON.stringify(canonical)));
}

// =============================================================================
// Bake
// =============================================================================

function progress(line) {
  process.stdout.write(`\r${line.padEnd(78)}`);
}

async function bakeCounty({ county, band, skipExisting, pageSize }) {
  const startedAt = Date.now();
  const row = countyBySlug(county);
  const { geoid, name } = row;
  const countyDir = `${OUT_ROOT}/${county}`;
  const markerPath = `${countyDir}/_baked.json`;

  if (skipExisting && existsSync(markerPath)) {
    try {
      const marker = JSON.parse(readFileSync(markerPath, "utf8"));
      const manifestPath = `${countyDir}/roadchunk/1/${marker.packHash}/manifest.json`;
      if (marker.band === band && existsSync(manifestPath)) {
        console.log(`skip-existing: ${county} already baked (packHash ${marker.packHash}, band ${band})`);
        return JSON.parse(readFileSync(manifestPath, "utf8")).__summary ?? { skipped: true, county, packHash: marker.packHash };
      }
    } catch {
      /* stale marker — re-bake */
    }
  }

  console.log(`bake ${county} (geoid ${geoid}) band=${band}`);

  // --- 1. Frozen origin + footprint ------------------------------------------
  const tiger = await fetchServiceVintage();
  const { rings, originSource } = await loadBoundaryRings(county, geoid);
  const { lon0, lat0, bbox } = bboxCentre(rings);
  const project = makeProjector(lon0, lat0);
  const ringsQ = rings.map((ring) => ring.map(([lon, lat]) => project(lon, lat)));
  const { footprint } = buildFootprint(ringsQ);
  console.log(
    `  origin lon0=${lon0.toFixed(6)} lat0=${lat0.toFixed(6)} (${originSource}); ` +
      `footprint ${footprint.size} base cells`,
  );

  // --- 2. Fetch roads (paginated, polite) ------------------------------------
  const envelope = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  const allParts = [];
  for (const layer of ROAD_LAYERS) {
    const parts = await fetchRoadLayer(layer, envelope, pageSize, (lyr, page, seen, total) => {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      progress(`  fetch layer ${lyr} page ${page} (seen ${seen}, parts ${total}) ${elapsed}s`);
    });
    allParts.push(...parts);
    await sleep(POLITE_LAYER_MS);
  }
  process.stdout.write("\n");
  console.log(`  fetched ${allParts.length} road parts from layers [${ROAD_LAYERS.join(",")}]`);

  // --- 3. Project + assign to every intersected footprint cell (clip) --------
  const cellFeatures = new Map(); // "cx,cy" -> [{featureId, roadClass, vertices}]
  const mtfccBySource = new Map(); // featureId -> mtfcc (distinct source features)
  for (const { mtfcc, coords } of allParts) {
    const pts = dedupeConsecutive(coords.map(([lon, lat]) => project(lon, lat)));
    if (pts.length < 2) continue;
    const featureId = featureIdFor(mtfcc, pts);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    let placed = false;
    for (let cy = cellOf(minY); cy <= cellOf(maxY); cy += 1) {
      for (let cx = cellOf(minX); cx <= cellOf(maxX); cx += 1) {
        const key = `${cx},${cy}`;
        if (!footprint.has(key)) continue;
        const pieces = clipPolylineToRect(pts, cellRectQuanta(cx, cy));
        if (pieces.length === 0) continue;
        let list = cellFeatures.get(key);
        if (!list) cellFeatures.set(key, (list = []));
        for (const piece of pieces) list.push({ featureId, roadClass: mtfcc, vertices: piece });
        placed = true;
      }
    }
    if (placed) mtfccBySource.set(featureId, mtfcc);
  }

  // --- 4. Split oversized cells → leaves -------------------------------------
  const presentCells = new Map(); // baseCellId -> [leaves]
  for (const [key, featuresRaw] of cellFeatures) {
    const [cx, cy] = key.split(",").map(Number);
    const baseCellId = `c${cx}_${cy}`;
    const leaves = splitCell(geoid, band, baseCellId, cellRectQuanta(cx, cy), featuresRaw, "", 0);
    presentCells.set(baseCellId, leaves);
  }

  // --- 5. packHash from sorted structural hashes -----------------------------
  const allLeaves = [];
  for (const [baseCellId, leaves] of presentCells) {
    for (const leaf of leaves) allLeaves.push({ baseCellId, ...leaf });
  }
  const structuralHashes = allLeaves.map((leaf) => structuralHash(geoid, band, leaf)).sort();
  const packHash = `sha256-${sha256Hex(Buffer.from(structuralHashes.join("")))}`;

  // --- 6. Encode + compress + write each leaf --------------------------------
  const packDir = `${countyDir}/roadchunk/1/${packHash}`;
  const bandDir = `${packDir}/${band}`;
  mkdirSync(bandDir, { recursive: true });

  const manifestCells = {}; // baseCellId -> { state, chunks:[…] }
  const sizeHistogram = { "0-4KB": 0, "4-8KB": 0, "8-16KB": 0, "16-32KB": 0, "32-48KB": 0, "48-64KB": 0, ">64KB(FAIL)": 0 };
  const byteTotals = { json: 0, br: 0, gz: 0 };
  const ceilingViolations = [];
  const warnZone = [];
  let featureEntryCount = 0;
  let maxBr = 0;

  for (const [baseCellId, leaves] of presentCells) {
    const chunks = [];
    for (const leaf of leaves) {
      const chunk = buildChunk(geoid, band, leaf.chunkId, leaf.cellRect, leaf.featuresRaw, packHash);
      const json = encodeRoadChunk(chunk);
      const jsonBuf = Buffer.from(json);
      const brBuf = brotli(jsonBuf);
      const gzBuf = gzip(jsonBuf);
      writeFileSync(`${bandDir}/${leaf.chunkId}.json`, jsonBuf);
      writeFileSync(`${bandDir}/${leaf.chunkId}.json.br`, brBuf);
      writeFileSync(`${bandDir}/${leaf.chunkId}.json.gz`, gzBuf);

      byteTotals.json += jsonBuf.length;
      byteTotals.br += brBuf.length;
      byteTotals.gz += gzBuf.length;
      featureEntryCount += chunk.features.length;
      maxBr = Math.max(maxBr, brBuf.length);
      bucketize(sizeHistogram, brBuf.length);
      if (brBuf.length > FAIL_CEILING) ceilingViolations.push({ chunkId: leaf.chunkId, br: brBuf.length });
      else if (brBuf.length > WARN_CEILING) warnZone.push({ chunkId: leaf.chunkId, br: brBuf.length });

      chunks.push({
        chunkId: leaf.chunkId,
        state: "present",
        cellRect: leaf.cellRect,
        featureCount: chunk.features.length,
        sha256: sha256Hex(jsonBuf),
        bytes: { json: jsonBuf.length, br: brBuf.length, gz: gzBuf.length },
      });
    }
    manifestCells[baseCellId] = { state: "present", chunks };
  }

  // --- 7. Expected-empty cells (footprint base cells with no roads, §2.4) ----
  let emptyCellCount = 0;
  for (const key of footprint) {
    const [cx, cy] = key.split(",").map(Number);
    const baseCellId = `c${cx}_${cy}`;
    if (!presentCells.has(baseCellId)) {
      manifestCells[baseCellId] = { state: "empty", chunks: [] };
      emptyCellCount += 1;
    }
  }

  // --- 8. MTFCC distribution over distinct source features -------------------
  const mtfccDistribution = {};
  for (const mtfcc of mtfccBySource.values()) {
    mtfccDistribution[mtfcc] = (mtfccDistribution[mtfcc] ?? 0) + 1;
  }

  const summary = {
    county,
    geoid,
    name,
    band,
    schemaVersion: ROADCHUNK_SCHEMA_VERSION,
    basisId: ROADCHUNK_BASIS_ID,
    packHash,
    chunkCount: allLeaves.length,
    presentCellCount: presentCells.size,
    emptyCellCount,
    footprintCellCount: footprint.size,
    featureCount: mtfccBySource.size, // distinct source polylines that landed in ≥1 cell
    featureEntryCount, // clipped pieces across all chunks (cross-cell duplication)
    byteTotals,
    sizeHistogram,
    maxChunkBrBytes: maxBr,
    warnZoneChunks: warnZone.length, // 32–64 KB (signal, not a violation)
    failCeilingBytes: FAIL_CEILING, // effective splitter fail gate (default 65536)
    splitCells: allLeaves.filter((l) => l.chunkId.includes("_", l.chunkId.indexOf("_") + 1)).length, // quadtree leaves
    ceilingViolations, // > fail ceiling — MUST be empty
    ceilingsHeld: ceilingViolations.length === 0,
    mtfccDistribution,
    tiger,
    spatialBasis: {
      basisId: ROADCHUNK_BASIS_ID,
      originLonLat: [lon0, lat0],
      originSource,
      quantStepM: Q,
      cellEdgeM: CELL_M,
      wgs84RadiusM: R,
    },
    elapsedSec: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
    bakedAt: new Date().toISOString(),
  };

  // --- 9. Manifest + catalog pointer + marker --------------------------------
  const manifest = {
    __summary: summary,
    basisId: ROADCHUNK_BASIS_ID,
    schemaVersion: ROADCHUNK_SCHEMA_VERSION,
    geoid,
    countySlug: county,
    name,
    packHash,
    spatialBasis: summary.spatialBasis,
    tiger,
    bake: {
      bakedAt: summary.bakedAt,
      band,
      chunkCount: summary.chunkCount,
      presentCellCount: summary.presentCellCount,
      emptyCellCount: summary.emptyCellCount,
      footprintCellCount: summary.footprintCellCount,
      featureCount: summary.featureCount,
      featureEntryCount: summary.featureEntryCount,
      byteTotals,
    },
    bands: { [band]: { cells: manifestCells } },
  };
  writeManifestArtifacts(packDir, manifest);

  // Atomic catalog pointer (§2.3, temp-write + rename).
  const catalog = {
    basisId: ROADCHUNK_BASIS_ID,
    schemaVersion: ROADCHUNK_SCHEMA_VERSION,
    packHash,
    manifestUri: `roadchunk/1/${packHash}/manifest.json`,
    updatedAt: summary.bakedAt,
  };
  const catalogTmp = `${countyDir}/catalog.json.tmp`;
  writeFileSync(catalogTmp, JSON.stringify(catalog, null, 2));
  renameSync(catalogTmp, `${countyDir}/catalog.json`);

  writeFileSync(
    markerPath,
    JSON.stringify(
      { county, geoid, band, packHash, chunkCount: summary.chunkCount, bakedAt: summary.bakedAt },
      null,
      2,
    ),
  );

  return summary;
}

function bucketize(hist, br) {
  if (br <= 4 * 1024) hist["0-4KB"] += 1;
  else if (br <= 8 * 1024) hist["4-8KB"] += 1;
  else if (br <= 16 * 1024) hist["8-16KB"] += 1;
  else if (br <= 32 * 1024) hist["16-32KB"] += 1;
  else if (br <= 48 * 1024) hist["32-48KB"] += 1;
  else if (br <= 64 * 1024) hist["48-64KB"] += 1;
  else hist[">64KB(FAIL)"] += 1;
}

function writeManifestArtifacts(packDir, manifest) {
  const buf = Buffer.from(JSON.stringify(manifest));
  writeFileSync(`${packDir}/manifest.json`, buf);
  writeFileSync(`${packDir}/manifest.json.br`, brotli(buf));
  writeFileSync(`${packDir}/manifest.json.gz`, gzip(buf));
}

// =============================================================================
// Verify — decode every written chunk (identity JSON AND the .br) round-trip.
// =============================================================================

function verifyBake(county, summary) {
  const packDir = `${OUT_ROOT}/${county}/roadchunk/1/${summary.packHash}`;
  const bandDir = `${packDir}/${summary.band}`;
  const manifest = JSON.parse(readFileSync(`${packDir}/manifest.json`, "utf8"));
  const cells = manifest.bands[summary.band].cells;
  let decoded = 0;
  let decodedFeatures = 0;
  for (const cell of Object.values(cells)) {
    for (const entry of cell.chunks) {
      const jsonBuf = readFileSync(`${bandDir}/${entry.chunkId}.json`);
      const brBuf = readFileSync(`${bandDir}/${entry.chunkId}.json.br`);
      const fromJson = decodeRoadChunk(jsonBuf); // throws on any invalid chunk
      const fromBr = decodeRoadChunk(brotliDecompressSync(brBuf));
      if (JSON.stringify(fromJson) !== JSON.stringify(fromBr)) {
        throw new Error(`round-trip mismatch (json vs .br) for ${entry.chunkId}`);
      }
      if (fromJson.features.length !== entry.featureCount) {
        throw new Error(`feature count mismatch for ${entry.chunkId}`);
      }
      if (sha256Hex(jsonBuf) !== entry.sha256) {
        throw new Error(`sha256 mismatch for ${entry.chunkId}`);
      }
      decoded += 1;
      decodedFeatures += fromJson.features.length;
    }
  }
  return { chunksDecoded: decoded, featureEntriesDecoded: decodedFeatures };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(OUT_ROOT, { recursive: true });
  let summary;
  try {
    summary = await bakeCounty(args);
  } catch (error) {
    const failuresPath = `${OUT_ROOT}/_failures.json`;
    const failures = existsSync(failuresPath) ? JSON.parse(readFileSync(failuresPath, "utf8")) : [];
    failures.push({ county: args.county, band: args.band, message: String(error?.stack ?? error), at: new Date().toISOString() });
    writeFileSync(failuresPath, JSON.stringify(failures, null, 2));
    console.error(`\nERR ${args.county}: ${error?.message ?? error}`);
    process.exit(1);
  }

  if (summary.skipped) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`  verifying ${summary.chunkCount} chunks (round-trip decode)…`);
  const verify = verifyBake(args.county, summary);
  const roundTripGreen =
    verify.chunksDecoded === summary.chunkCount && verify.featureEntriesDecoded === summary.featureEntryCount;

  const report = {
    ...summary,
    verify: { ...verify, roundTripGreen },
    files: {
      root: `${OUT_ROOT}/${args.county}`,
      manifest: `${OUT_ROOT}/${args.county}/roadchunk/1/${summary.packHash}/manifest.json`,
      catalog: `${OUT_ROOT}/${args.county}/catalog.json`,
      marker: `${OUT_ROOT}/${args.county}/_baked.json`,
      chunkDir: `${OUT_ROOT}/${args.county}/roadchunk/1/${summary.packHash}/${summary.band}`,
      perChunkArtifacts: "<chunkId>.json, <chunkId>.json.br, <chunkId>.json.gz",
    },
  };
  // Drop the manifest-embedded copy from the printed summary for readability.
  delete report.__summary;
  console.log("\n===== ROAD CHUNK BAKE SUMMARY =====");
  console.log(JSON.stringify(report, null, 2));

  if (!roundTripGreen) {
    console.error("ROUND-TRIP VERIFY FAILED");
    process.exit(1);
  }
  if (!summary.ceilingsHeld) {
    console.error(`FAIL-CEILING VIOLATIONS: ${summary.ceilingViolations.length}`);
    process.exit(1);
  }
}

await main();
