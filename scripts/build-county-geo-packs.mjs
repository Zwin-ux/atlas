#!/usr/bin/env node
// 0.78-D — bake real county geography into compact geo packs (AAA pipeline:
// bake -> version -> serve). Source: Census TIGERweb REST (public domain),
// GeoJSON straight from the service — no shapefile deps.
//
// v1 scope (LOD0 seed): county boundary rings, simplified to a vertex
// budget, plus identity attributes. Water/roads/places layers extend this
// script next (endpoints documented below).
//
//   node scripts/build-county-geo-packs.mjs --county miami-dade-fl ...
//   node scripts/build-county-geo-packs.mjs --challenge   (16-county set)
//
// Validated endpoint (2026-07-12):
//   County polygons: TIGERweb/State_County/MapServer/11/query
//     ?where=GEOID='12086'&returnGeometry=true&geometryPrecision=4
//     &outSR=4326&f=geojson
// To extend (layer discovery via <service>/MapServer?f=json):
//   Places:   TIGERweb/Places_CouSub/MapServer (incorporated places layer)
//   Water:    TIGERweb/Hydro (area/linear water, filter by county envelope)
//   Roads:    TIGERweb/Transportation (primary/secondary/local class filter)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { US_COUNTY_INDEX } from "../packages/core/dist/index.js";

const COUNTY_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/11/query";
const WATER_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Hydro/MapServer/1/query"; // Areal Hydrography
const OUT_DIR = "data/geo-packs";
// 0.78-D2 density budgets: 3x the seed values so the finer board lattice has
// real geometry to trace. Pack sizes roughly double (~30KB max) — still cheap
// on the wire and in git.
const VERTEX_BUDGET = 1440; // per county, post-simplification (LOD0 silhouette)
const WATER_FEATURE_CAP = 28; // rank the county's water bodies by area, keep the biggest N
const WATER_VERTEX_BUDGET = 840; // total water vertices in LOD0 (bay/ocean/big lakes, not every canal)
const WATER_MAX_RINGS = 18; // distinct water polygons kept after simplification
const CHALLENGE = [
  "riverside-ca", "miami-dade-fl", "mobile-al", "loving-tx", "kalawao-hi",
  "summit-co", "cook-il", "sedgwick-ks", "honolulu-hi", "king-wa",
  "maricopa-az", "teton-wy", "orleans-parish-la", "suffolk-ma",
  "aleutians-east-borough-ak", "apache-az",
];

function parseArgs(argv) {
  const counties = [];
  let challenge = false;
  let all = false;
  let skipExisting = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--county") counties.push(argv[++i]);
    else if (argv[i] === "--challenge") challenge = true;
    else if (argv[i] === "--all") all = true;
    else if (argv[i] === "--skip-existing") skipExisting = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  const selected = all
    ? US_COUNTY_INDEX.map((entry) => entry.countySlug)
    : challenge
      ? CHALLENGE
      : counties;
  return { counties: selected, skipExisting };
}

// A pack counts as already-baked only if it parses and carries the current
// shape; anything else gets re-baked so a resumed national run self-heals.
function hasValidPack(slug) {
  const path = `${OUT_DIR}/${slug}.json`;
  if (!existsSync(path)) return false;
  try {
    const pack = JSON.parse(readFileSync(path, "utf8"));
    return (
      pack?.packVersion === 2 &&
      Array.isArray(pack?.lod0?.boundaryRings) &&
      pack.lod0.boundaryRings.length > 0 &&
      typeof pack?.areaLand === "number"
    );
  } catch {
    return false;
  }
}

// TIGERweb is a shared public service: bounded retry with backoff, then give
// up on that request. Callers decide whether the county fails or degrades.
async function fetchWithRetry(url, label) {
  const delays = [0, 1_000, 4_000];
  let lastError;
  for (const delay of delays) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error(`${label} failed`);
}

function countyBySlug(slug) {
  const row = US_COUNTY_INDEX.find((entry) => entry.countySlug === slug);
  if (!row) throw new Error(`County not indexed: ${slug}`);
  return row;
}

async function fetchBoundary(geoid) {
  const url = `${COUNTY_LAYER}?where=GEOID%3D%27${geoid}%27&outFields=GEOID,NAME,AREALAND,AREAWATER&returnGeometry=true&geometryPrecision=4&outSR=4326&f=geojson`;
  const geo = await fetchWithRetry(url, `boundary ${geoid}`);
  const feature = geo.features?.[0];
  if (!feature?.geometry) throw new Error(`No boundary geometry for ${geoid}`);
  return feature;
}

// Douglas-Peucker on a lonlat ring (planar approximation is fine at county
// scale for a stylized silhouette).
function simplifyRing(ring, epsilon) {
  if (ring.length <= 4) return ring;
  const keep = new Array(ring.length).fill(false);
  keep[0] = keep[ring.length - 1] = true;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxDist = 0;
    let maxIdx = -1;
    for (let i = a + 1; i < b; i += 1) {
      const d = pointSegDist(ring[i], ring[a], ring[b]);
      if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon && maxIdx > 0) {
      keep[maxIdx] = true;
      stack.push([a, maxIdx], [maxIdx, b]);
    }
  }
  return ring.filter((_, i) => keep[i]);
}

function pointSegDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function ringsOf(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  throw new Error(`Unexpected geometry type ${geometry.type}`);
}

function simplifyRingsToBudget(rings, budget, maxRings) {
  // Keep the largest rings (main landmass + big islands, or bay + ocean +
  // lakes for water), binary-search epsilon until the total vertex count
  // fits the budget. Deterministic — same input, same output.
  const byArea = [...rings].sort((r1, r2) => Math.abs(ringArea(r2)) - Math.abs(ringArea(r1))).slice(0, maxRings);
  if (byArea.length === 0) return [];
  let lo = 0.0001, hi = 0.2, best = byArea.map((r) => simplifyRing(r, hi));
  for (let iter = 0; iter < 24; iter += 1) {
    const mid = (lo + hi) / 2;
    const simplified = byArea.map((r) => simplifyRing(r, mid));
    const count = simplified.reduce((sum, r) => sum + r.length, 0);
    if (count > budget) lo = mid;
    else { best = simplified; hi = mid; }
  }
  // A sliver ring can collapse below a closed triangle (first==last, so <4
  // points is degenerate). Drop those — they carry no silhouette.
  return best.filter((r) => r.length >= 4);
}

function simplifyToBudget(rings) {
  return simplifyRingsToBudget(rings, VERTEX_BUDGET, 10);
}

function bboxOfRings(rings) {
  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < xmin) xmin = x;
      if (x > xmax) xmax = x;
      if (y < ymin) ymin = y;
      if (y > ymax) ymax = y;
    }
  }
  return [xmin, ymin, xmax, ymax];
}

// Coastal boards need the surrounding sea, which sits just OUTSIDE the land
// boundary. Clipping water to a margin-expanded bbox keeps that offshore band
// so the compiler can render a peninsula/island framed by ocean, not a bare
// green cutout. Margin is a fraction of the county span on each side.
function expandBbox([xmin, ymin, xmax, ymax], frac) {
  const dx = (xmax - xmin) * frac;
  const dy = (ymax - ymin) * frac;
  return [xmin - dx, ymin - dy, xmax + dx, ymax + dy];
}
const WATER_CLIP_MARGIN = 0.12;

// Sutherland-Hodgman clip of a closed ring against an axis-aligned bbox.
// Water polygons (esp. the ocean) can span far past the county; clipping to
// the county envelope bounds pack size and keeps the coastline edge intact.
function clipRingToBbox(ring, [xmin, ymin, xmax, ymax]) {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const clipEdge = (pts, inside, intersect) => {
    const out = [];
    for (let i = 0; i < pts.length; i += 1) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) out.push(intersect(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(intersect(prev, cur));
      }
    }
    return out;
  };
  let pts = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1)
    : ring.slice();
  pts = clipEdge(pts, (p) => p[0] >= xmin, (a, b) => lerp(a, b, (xmin - a[0]) / (b[0] - a[0])));
  if (pts.length === 0) return [];
  pts = clipEdge(pts, (p) => p[0] <= xmax, (a, b) => lerp(a, b, (xmax - a[0]) / (b[0] - a[0])));
  if (pts.length === 0) return [];
  pts = clipEdge(pts, (p) => p[1] >= ymin, (a, b) => lerp(a, b, (ymin - a[1]) / (b[1] - a[1])));
  if (pts.length === 0) return [];
  pts = clipEdge(pts, (p) => p[1] <= ymax, (a, b) => lerp(a, b, (ymax - a[1]) / (b[1] - a[1])));
  if (pts.length === 0) return [];
  pts.push(pts[0]);
  return pts;
}

async function fetchWater(bbox) {
  const env = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  // Step 1 — attributes only (no geometry, cheap): rank every intersecting
  // water body by AREAWATER, keep the largest N. Skips the thousand canals.
  const attrUrl = `${WATER_LAYER}?where=1%3D1&geometry=${encodeURIComponent(env)}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,NAME,AREAWATER&returnGeometry=false&f=json`;
  const attrs = (await fetchWithRetry(attrUrl, "water attrs")).features ?? [];
  if (attrs.length === 0) return { rings: [], names: [] };
  const ranked = attrs
    .map((f) => ({ id: f.attributes.OBJECTID, name: f.attributes.NAME || null, area: parseFloat(f.attributes.AREAWATER) || 0 }))
    .filter((r) => r.id != null && r.area > 0)
    .sort((a, b) => b.area - a.area)
    .slice(0, WATER_FEATURE_CAP);
  if (ranked.length === 0) return { rings: [], names: [] };
  // Step 2 — geometry for just those top bodies, clipped to the county bbox.
  const ids = ranked.map((r) => r.id).join(",");
  const geoUrl = `${WATER_LAYER}?where=OBJECTID%20IN%20(${ids})&returnGeometry=true&geometryPrecision=4&outSR=4326&f=geojson`;
  const feats = (await fetchWithRetry(geoUrl, "water geom")).features ?? [];
  const rings = [];
  const names = new Set();
  for (const feat of feats) {
    if (!feat.geometry) continue;
    for (const ring of ringsOf(feat.geometry)) {
      const clipped = clipRingToBbox(ring, bbox);
      if (clipped.length >= 4) rings.push(clipped);
    }
    if (feat.properties?.NAME) names.add(feat.properties.NAME);
  }
  return { rings, names: [...names] };
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return area / 2;
}

async function bakeCounty(slug) {
  const county = countyBySlug(slug);
  const feature = await fetchBoundary(county.geoid);
  const rings = simplifyToBudget(ringsOf(feature.geometry));
  const bbox = bboxOfRings(rings);
  const waterBbox = expandBbox(bbox, WATER_CLIP_MARGIN);
  let water = { rings: [], names: [] };
  try {
    await new Promise((resolve) => setTimeout(resolve, 200)); // be polite between the boundary + water calls
    water = await fetchWater(waterBbox);
  } catch (error) {
    console.log(`    water fetch failed for ${slug}: ${error.message}`);
  }
  const waterRings = simplifyRingsToBudget(water.rings, WATER_VERTEX_BUDGET, WATER_MAX_RINGS);
  const pack = {
    packVersion: 2,
    geoid: county.geoid,
    countySlug: slug,
    name: feature.properties?.NAME ?? county.name,
    source: "US Census TIGERweb (public domain), geometryPrecision=4",
    // Official TIGER land/water areas (m^2) — integrity gates compare the
    // simplified ring area against these to catch corrupt geometry.
    areaLand: parseFloat(feature.properties?.AREALAND) || 0,
    areaWater: parseFloat(feature.properties?.AREAWATER) || 0,
    lod0: {
      boundaryRings: rings,
      vertexCount: rings.reduce((sum, r) => sum + r.length, 0),
      waterRings,
      waterVertexCount: waterRings.reduce((sum, r) => sum + r.length, 0),
      waterNames: water.names.slice(0, WATER_MAX_RINGS),
    },
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const path = `${OUT_DIR}/${slug}.json`;
  writeFileSync(path, JSON.stringify(pack));
  return {
    slug,
    vertices: pack.lod0.vertexCount,
    rings: rings.length,
    waterRings: waterRings.length,
    waterVertices: pack.lod0.waterVertexCount,
    bytes: JSON.stringify(pack).length,
  };
}

const { counties, skipExisting } = parseArgs(process.argv.slice(2));
if (counties.length === 0) {
  console.error("Pass --county <slug> (repeatable), --challenge, or --all [--skip-existing]");
  process.exit(1);
}
const FAILURES_PATH = `${OUT_DIR}/_failures.json`;
mkdirSync(OUT_DIR, { recursive: true });
const results = [];
const failures = [];
let skipped = 0;
let processed = 0;
const startedAt = Date.now();
for (const slug of counties) {
  processed += 1;
  if (skipExisting && hasValidPack(slug)) {
    skipped += 1;
    continue;
  }
  try {
    const r = await bakeCounty(slug);
    results.push(r);
    if (counties.length <= 32) {
      console.log(`OK  ${r.slug} rings=${r.rings} vertices=${r.vertices} water=${r.waterRings}/${r.waterVertices}v bytes=${r.bytes}`);
    }
  } catch (error) {
    failures.push({ slug, message: String(error?.message ?? error) });
    console.log(`ERR ${slug} ${error.message}`);
    writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2));
  }
  if (processed % 50 === 0) {
    const elapsedMin = ((Date.now() - startedAt) / 60_000).toFixed(1);
    console.log(`... ${processed}/${counties.length} (baked ${results.length}, skipped ${skipped}, failed ${failures.length}) ${elapsedMin}min`);
  }
  await new Promise((resolve) => setTimeout(resolve, 350)); // be polite to TIGERweb
}
writeFileSync(FAILURES_PATH, JSON.stringify(failures, null, 2));
console.log(`baked ${results.length}, skipped ${skipped}, failed ${failures.length} of ${counties.length} into ${OUT_DIR}/`);
if (failures.length > 0) {
  console.log(`failures recorded in ${FAILURES_PATH} — re-run with --all --skip-existing to retry them`);
  process.exitCode = 1;
}
