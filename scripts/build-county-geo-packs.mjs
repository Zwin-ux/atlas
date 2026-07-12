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
import { mkdirSync, writeFileSync } from "node:fs";
import { US_COUNTY_INDEX } from "../packages/core/dist/index.js";

const COUNTY_LAYER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/11/query";
const OUT_DIR = "data/geo-packs";
const VERTEX_BUDGET = 480; // per county, post-simplification (LOD0 silhouette)
const CHALLENGE = [
  "riverside-ca", "miami-dade-fl", "mobile-al", "loving-tx", "kalawao-hi",
  "summit-co", "cook-il", "sedgwick-ks", "honolulu-hi", "king-wa",
  "maricopa-az", "teton-wy", "orleans-parish-la", "suffolk-ma",
  "aleutians-east-borough-ak", "apache-az",
];

function parseArgs(argv) {
  const counties = [];
  let challenge = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--county") counties.push(argv[++i]);
    else if (argv[i] === "--challenge") challenge = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return { counties: challenge ? CHALLENGE : counties };
}

function countyBySlug(slug) {
  const row = US_COUNTY_INDEX.find((entry) => entry.countySlug === slug);
  if (!row) throw new Error(`County not indexed: ${slug}`);
  return row;
}

async function fetchBoundary(geoid) {
  const url = `${COUNTY_LAYER}?where=GEOID%3D%27${geoid}%27&outFields=GEOID,NAME,AREALAND,AREAWATER&returnGeometry=true&geometryPrecision=4&outSR=4326&f=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TIGERweb ${response.status} for ${geoid}`);
  const geo = await response.json();
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

function simplifyToBudget(rings) {
  // Keep the largest rings (main landmass + big islands), binary-search
  // epsilon until the total vertex count fits the budget. Deterministic.
  const byArea = [...rings].sort((r1, r2) => Math.abs(ringArea(r2)) - Math.abs(ringArea(r1))).slice(0, 6);
  let lo = 0.0001, hi = 0.2, best = byArea.map((r) => simplifyRing(r, hi));
  for (let iter = 0; iter < 24; iter += 1) {
    const mid = (lo + hi) / 2;
    const simplified = byArea.map((r) => simplifyRing(r, mid));
    const count = simplified.reduce((sum, r) => sum + r.length, 0);
    if (count > VERTEX_BUDGET) lo = mid;
    else { best = simplified; hi = mid; }
  }
  return best;
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
  const pack = {
    packVersion: 1,
    geoid: county.geoid,
    countySlug: slug,
    name: feature.properties?.NAME ?? county.name,
    source: "US Census TIGERweb (public domain), geometryPrecision=4",
    lod0: {
      boundaryRings: rings,
      vertexCount: rings.reduce((sum, r) => sum + r.length, 0),
    },
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const path = `${OUT_DIR}/${slug}.json`;
  writeFileSync(path, JSON.stringify(pack));
  return { slug, vertices: pack.lod0.vertexCount, rings: rings.length, bytes: JSON.stringify(pack).length };
}

const { counties } = parseArgs(process.argv.slice(2));
if (counties.length === 0) {
  console.error("Pass --county <slug> (repeatable) or --challenge");
  process.exit(1);
}
const results = [];
for (const slug of counties) {
  try {
    const r = await bakeCounty(slug);
    results.push(r);
    console.log(`OK  ${r.slug} rings=${r.rings} vertices=${r.vertices} bytes=${r.bytes}`);
  } catch (error) {
    console.log(`ERR ${slug} ${error.message}`);
    process.exitCode = 1;
  }
  await new Promise((resolve) => setTimeout(resolve, 350)); // be polite to TIGERweb
}
console.log(`baked ${results.length}/${counties.length} packs into ${OUT_DIR}/`);
