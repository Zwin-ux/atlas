#!/usr/bin/env node
// Build a compact, national town-anchor index from public U.S. Census data.
//
// Primary coverage comes from the 2024 Subcounty Population Estimates file,
// whose SUMLEV 157 rows connect incorporated places to counties and include
// the population of each county part. TIGERweb supplies official place center
// coordinates. Counties without an incorporated place fall back to a Census
// Designated Place, then an official county subdivision. The build fails if a
// supported county still has no real named anchor.
//
// Usage:
//   node scripts/build-county-town-anchors.mjs
//   node scripts/build-county-town-anchors.mjs --output data/census/us-county-town-anchors.json

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { US_COUNTY_INDEX } from "../packages/core/dist/index.js";

const POPULATION_SOURCE =
  "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv";
const TIGER_SERVICE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer";
const COUNTY_LAYER =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/11/query";
const DEFAULT_OUTPUT = "data/census/us-county-town-anchors.json";
const DEFAULT_MAX_ANCHORS = 6;
const BOUNDARY_CONCURRENCY = 6;

function parseArgs(argv) {
  let output = DEFAULT_OUTPUT;
  let maxAnchors = DEFAULT_MAX_ANCHORS;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--output") output = requireValue(argv, ++index, "--output");
    else if (argv[index] === "--max-anchors") {
      maxAnchors = Number.parseInt(requireValue(argv, ++index, "--max-anchors"), 10);
      if (!Number.isInteger(maxAnchors) || maxAnchors < 1 || maxAnchors > 12) {
        throw new Error("--max-anchors must be an integer from 1 to 12.");
      }
    } else {
      throw new Error(`Unknown argument: ${argv[index]}`);
    }
  }
  return { output, maxAnchors };
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value.`);
  return value;
}

async function fetchWithRetry(url, label, parse = "json") {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Atlas county town anchor builder/0.78-2" },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        throw new Error(`unexpected HTML response: ${(await response.text()).slice(0, 120)}`);
      }
      return parse === "text" ? response.text() : response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await wait(250 * 2 ** (attempt - 1));
    }
  }
  throw new Error(`${label} failed after 4 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

function parsePopulationRows(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() ?? "");
  const column = Object.fromEntries(headers.map((header, index) => [header, index]));
  const required = ["SUMLEV", "STATE", "COUNTY", "PLACE", "FUNCSTAT", "NAME", "POPESTIMATE2024"];
  for (const name of required) {
    if (!Number.isInteger(column[name])) throw new Error(`Population CSV is missing ${name}.`);
  }

  return lines
    .map(parseCsvLine)
    .filter(
      (row) =>
        row[column.SUMLEV] === "157" &&
        row[column.FUNCSTAT] === "A" &&
        row[column.PLACE] !== "99990",
    )
    .map((row) => ({
      countyGeoid: `${row[column.STATE]}${row[column.COUNTY]}`,
      placeGeoid: `${row[column.STATE]}${row[column.PLACE]}`,
      population2024: Number.parseInt(row[column.POPESTIMATE2024] ?? "0", 10) || 0,
      relationshipName: (row[column.NAME] ?? "").replace(/ \(pt\.\)$/i, ""),
    }));
}

async function fetchTigerAttributes(layerId) {
  const fields = "GEOID,NAME,BASENAME,STATE,CENTLAT,CENTLON,AREALAND,FUNCSTAT";
  const url = `${TIGER_SERVICE}/${layerId}/query?where=1%3D1&outFields=${encodeURIComponent(fields)}&returnGeometry=false&f=json`;
  const payload = await fetchWithRetry(url, `TIGERweb layer ${layerId}`);
  if (payload.error) throw new Error(`TIGERweb layer ${layerId}: ${payload.error.message ?? "query failed"}`);
  return (payload.features ?? []).map((feature) => feature.attributes ?? {});
}

function officialAnchor(attributes, kind, population2024, landAreaSquareMeters) {
  const latitude = Number(attributes.CENTLAT);
  const longitude = Number(attributes.CENTLON);
  const label = String(attributes.BASENAME || attributes.NAME || "").trim();
  const censusPlaceGeoid = String(attributes.GEOID || "").trim();
  if (!label || !censusPlaceGeoid || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    censusPlaceGeoid,
    label,
    kind,
    latitude: round6(latitude),
    longitude: round6(longitude),
    ...(Number.isFinite(population2024) ? { population2024 } : {}),
    ...(Number.isFinite(landAreaSquareMeters) ? { landAreaSquareMeters } : {}),
  };
}

function addAnchor(byCounty, countyGeoid, anchor) {
  if (!anchor) return;
  const anchors = byCounty.get(countyGeoid) ?? [];
  const existing = anchors.find((item) => item.censusPlaceGeoid === anchor.censusPlaceGeoid);
  if (!existing) anchors.push(anchor);
  else if ((anchor.population2024 ?? 0) > (existing.population2024 ?? 0)) Object.assign(existing, anchor);
  byCounty.set(countyGeoid, anchors);
}

function rankAnchors(anchors) {
  return [...anchors].sort(
    (first, second) =>
      (second.population2024 ?? 0) - (first.population2024 ?? 0) ||
      (second.landAreaSquareMeters ?? 0) - (first.landAreaSquareMeters ?? 0) ||
      first.label.localeCompare(second.label) ||
      first.censusPlaceGeoid.localeCompare(second.censusPlaceGeoid),
  );
}

async function fetchCountyBoundary(geoid) {
  const url = `${COUNTY_LAYER}?where=GEOID%3D%27${geoid}%27&outFields=GEOID&returnGeometry=true&geometryPrecision=4&outSR=4326&f=geojson`;
  const payload = await fetchWithRetry(url, `county boundary ${geoid}`);
  const feature = payload.features?.[0];
  if (!feature?.geometry) throw new Error(`County ${geoid} returned no boundary geometry.`);
  return feature.geometry;
}

async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await callback(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    if (
      currentPoint &&
      previousPoint &&
      (currentPoint[1] > y) !== (previousPoint[1] > y) &&
      x < ((previousPoint[0] - currentPoint[0]) * (y - currentPoint[1])) / (previousPoint[1] - currentPoint[1]) + currentPoint[0]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, rings) {
  if (!rings?.length || !pointInRing(point, rings[0])) return false;
  for (let index = 1; index < rings.length; index += 1) {
    if (pointInRing(point, rings[index])) return false;
  }
  return true;
}

function pointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  return false;
}

function fallbackCandidates(attributes, county, geometry, kind) {
  return attributes
    .filter((item) => String(item.STATE).padStart(2, "0") === county.geoid.slice(0, 2))
    .map((item) => ({
      item,
      point: [Number(item.CENTLON), Number(item.CENTLAT)],
      area: Number(item.AREALAND) || 0,
    }))
    .filter((candidate) => Number.isFinite(candidate.point[0]) && Number.isFinite(candidate.point[1]))
    .filter((candidate) => pointInGeometry(candidate.point, geometry))
    .sort((first, second) => second.area - first.area || String(first.item.NAME).localeCompare(String(second.item.NAME)))
    .map((candidate) => officialAnchor(candidate.item, kind, undefined, candidate.area));
}

function round6(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

const { output, maxAnchors } = parseArgs(process.argv.slice(2));
const indexedCounties = new Map(US_COUNTY_INDEX.map((county) => [county.geoid, county]));

console.log("Fetching Census population and place coordinates...");
const [populationCsv, incorporatedPlaces, censusDesignatedPlaces, countySubdivisions] = await Promise.all([
  fetchWithRetry(POPULATION_SOURCE, "2024 Subcounty Population Estimates", "text"),
  fetchTigerAttributes(4),
  fetchTigerAttributes(5),
  fetchTigerAttributes(1),
]);

const incorporatedByGeoid = new Map(incorporatedPlaces.map((place) => [String(place.GEOID), place]));
const anchorsByCounty = new Map();
for (const relationship of parsePopulationRows(populationCsv)) {
  if (!indexedCounties.has(relationship.countyGeoid)) continue;
  const place = incorporatedByGeoid.get(relationship.placeGeoid);
  addAnchor(
    anchorsByCounty,
    relationship.countyGeoid,
    officialAnchor(place ?? {}, "incorporated_place", relationship.population2024),
  );
}

const countiesNeedingFallback = US_COUNTY_INDEX.filter((county) => !(anchorsByCounty.get(county.geoid)?.length));
console.log(`Fetching ${countiesNeedingFallback.length} county boundaries for rural fallbacks...`);
const fallbackBoundaries = await mapWithConcurrency(
  countiesNeedingFallback,
  BOUNDARY_CONCURRENCY,
  async (county, index) => {
    const geometry = await fetchCountyBoundary(county.geoid);
    if ((index + 1) % 25 === 0 || index + 1 === countiesNeedingFallback.length) {
      console.log(`  boundaries ${index + 1}/${countiesNeedingFallback.length}`);
    }
    return { county, geometry };
  },
);

for (const { county, geometry } of fallbackBoundaries) {
  const cdpAnchors = fallbackCandidates(censusDesignatedPlaces, county, geometry, "census_designated_place");
  const subdivisionAnchors = cdpAnchors.length > 0
    ? []
    : fallbackCandidates(countySubdivisions, county, geometry, "county_subdivision");
  for (const anchor of [...cdpAnchors, ...subdivisionAnchors]) addAnchor(anchorsByCounty, county.geoid, anchor);
}

const missing = US_COUNTY_INDEX.filter((county) => !(anchorsByCounty.get(county.geoid)?.length));
if (missing.length > 0) {
  throw new Error(
    `National town-anchor contract failed: ${missing.length} supported counties have no real named anchor: ${missing
      .slice(0, 20)
      .map((county) => `${county.countySlug} (${county.geoid})`)
      .join(", ")}`,
  );
}

const counties = Object.fromEntries(
  [...US_COUNTY_INDEX]
    .sort((first, second) => first.geoid.localeCompare(second.geoid))
    .map((county) => [
      county.countySlug,
      {
        geoid: county.geoid,
        stateCode: county.stateCode,
        countyName: county.name,
        anchors: rankAnchors(anchorsByCounty.get(county.geoid) ?? []).slice(0, maxAnchors),
      },
    ]),
);

const allAnchors = Object.values(counties).flatMap((county) => county.anchors);
const kindCounts = allAnchors.reduce((counts, anchor) => {
  counts[anchor.kind] = (counts[anchor.kind] ?? 0) + 1;
  return counts;
}, {});
const result = {
  schemaVersion: 1,
  sourceYear: 2024,
  sources: [
    {
      name: "U.S. Census Bureau 2024 Subcounty Population Estimates",
      url: POPULATION_SOURCE,
      use: "incorporated-place to county relationships and 2024 population ranking",
    },
    {
      name: "U.S. Census Bureau TIGERweb Places and County Subdivisions",
      url: `${TIGER_SERVICE}`,
      use: "official place names and center coordinates; CDP and subdivision rural fallbacks",
    },
  ],
  method: {
    maximumAnchorsPerCounty: maxAnchors,
    primary: "largest incorporated places by 2024 county-part population",
    fallback: "largest Census Designated Places by land area, then official county subdivisions",
    geometry: "fallback centers must fall inside the 2025 TIGERweb county boundary",
  },
  totals: {
    supportedCountyCount: US_COUNTY_INDEX.length,
    coveredCountyCount: Object.keys(counties).length,
    anchorCount: allAnchors.length,
    kindCounts,
  },
  counties,
};

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(result)}\n`);
console.log(
  JSON.stringify(
    {
      ok: true,
      output,
      supportedCountyCount: result.totals.supportedCountyCount,
      coveredCountyCount: result.totals.coveredCountyCount,
      anchorCount: result.totals.anchorCount,
      kindCounts,
      bytes: Buffer.byteLength(JSON.stringify(result)),
    },
    null,
    2,
  ),
);
