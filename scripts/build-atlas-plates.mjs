#!/usr/bin/env node
/**
 * Build the atlas plates.
 *
 * Reads every county geo pack (real US Census TIGERweb geometry) and emits the
 * level-of-detail bundles the widget fetches:
 *
 *   artifacts/atlas-plates/nation.json      every county, hard-simplified
 *   artifacts/atlas-plates/state/<code>.json  one state's counties, medium detail
 *
 * The county plate is served from the full-resolution pack at request time, so
 * it is not built here.
 *
 * Run: node scripts/build-atlas-plates.mjs [--out DIR] [--json-only]
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  quantizeRing,
  ringAreaDegrees,
  simplifyClosedRing,
} from "../packages/core/dist/atlas/simplify.js";
import { encodeRing } from "../packages/core/dist/atlas/ringCodec.js";
import { dissolveRings } from "../packages/core/dist/atlas/dissolve.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GEO_PACK_DIR = join(ROOT, "data", "geo-packs");
const ANCHORS_PATH = join(ROOT, "data", "census", "us-county-town-anchors.json");

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json-only");
const outDir = argValue("--out") ?? join(ROOT, "artifacts", "atlas-plates");

function argValue(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function log(message) {
  if (!jsonOnly) console.log(message);
}

/**
 * Tolerances in degrees, chosen against how much ground a pixel covers.
 *
 * The national plate is ~1000px for ~4500km of continent, so one pixel is
 * about 4.5km ≈ 0.04°. A 0.035° tolerance keeps simplification error inside a
 * single pixel — no visible difference — while cutting vertices hard. The
 * state plate zooms roughly 10x, so its tolerance drops by the same factor.
 */
const NATION_TOLERANCE = 0.035;
const STATE_TOLERANCE = 0.0035;

/**
 * Minimum area, in square degrees, for a dissolved state-outline ring to be
 * kept. Roughly 2.5 km² — below any real island, above every sliver.
 */
const STATE_OUTLINE_MIN_AREA = 0.0002;

/** Below this, a water body is sub-pixel on the plate and is not drawn. */
const NATION_MIN_WATER_AREA = 0.05;
const STATE_MIN_WATER_AREA = 0.002;

/** Coordinate decimals. 3 ≈ 110m, plenty for a national plate. */
const NATION_DECIMALS = 3;
const STATE_DECIMALS = 4;

const STATE_NAMES = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California",
  co: "Colorado", ct: "Connecticut", de: "Delaware", dc: "District of Columbia",
  fl: "Florida", ga: "Georgia", hi: "Hawaii", id: "Idaho", il: "Illinois",
  in: "Indiana", ia: "Iowa", ks: "Kansas", ky: "Kentucky", la: "Louisiana",
  me: "Maine", md: "Maryland", ma: "Massachusetts", mi: "Michigan",
  mn: "Minnesota", ms: "Mississippi", mo: "Missouri", mt: "Montana",
  ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey",
  nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota",
  oh: "Ohio", ok: "Oklahoma", or: "Oregon", pa: "Pennsylvania", pr: "Puerto Rico",
  ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee",
  tx: "Texas", ut: "Utah", vt: "Vermont", va: "Virginia", wa: "Washington",
  wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming",
};

/**
 * FIPS state code -> postal code. The pack's `geoid` is authoritative for which
 * state a county belongs to; the slug suffix is not (parish and borough slugs
 * such as `orleans-parish-la` happen to work, but relying on the suffix would
 * be guessing at data we already hold exactly).
 */
const FIPS_TO_STATE = {
  "01": "al", "02": "ak", "04": "az", "05": "ar", "06": "ca", "08": "co",
  "09": "ct", "10": "de", "11": "dc", "12": "fl", "13": "ga", "15": "hi",
  "16": "id", "17": "il", "18": "in", "19": "ia", "20": "ks", "21": "ky",
  "22": "la", "23": "me", "24": "md", "25": "ma", "26": "mi", "27": "mn",
  "28": "ms", "29": "mo", "30": "mt", "31": "ne", "32": "nv", "33": "nh",
  "34": "nj", "35": "nm", "36": "ny", "37": "nc", "38": "nd", "39": "oh",
  "40": "ok", "41": "or", "42": "pa", "44": "ri", "45": "sc", "46": "sd",
  "47": "tn", "48": "tx", "49": "ut", "50": "vt", "51": "va", "53": "wa",
  "54": "wv", "55": "wi", "56": "wy", "72": "pr",
};

function loadAnchors() {
  const raw = JSON.parse(readFileSync(ANCHORS_PATH, "utf8"));
  const byGeoid = new Map();
  for (const county of Object.values(raw.counties ?? {})) {
    byGeoid.set(county.geoid, county.anchors ?? []);
  }
  return byGeoid;
}

/**
 * Reduce one county to what a plate at this tolerance needs.
 *
 * Water rings smaller than the plate can show are dropped, and their names go
 * with them — a label for an invisible lake is worse than no label.
 */
function reduceCounty(pack, { tolerance, minWaterArea, decimals }) {
  const lod = pack.lod0 ?? {};
  const boundary = (lod.boundaryRings ?? [])
    .map((ring) => quantizeRing(simplifyClosedRing(ring, tolerance), decimals))
    .filter((ring) => ring.length >= 4)
    .map((ring) => encodeRing(ring, { decimals }));

  const water = [];
  const waterNames = [];
  const rawWater = lod.waterRings ?? [];
  const rawWaterNames = lod.waterNames ?? [];

  for (let i = 0; i < rawWater.length; i += 1) {
    const ring = rawWater[i];
    if (ringAreaDegrees(ring) < minWaterArea) continue;
    const simplified = quantizeRing(simplifyClosedRing(ring, tolerance), decimals);
    if (simplified.length < 4) continue;
    water.push(encodeRing(simplified, { decimals }));
    waterNames.push(rawWaterNames[i] ?? null);
  }

  return { boundary, water, waterNames };
}

/** Encoded rings hold two numbers per vertex. */
function countVertices(rings) {
  return rings.reduce((total, ring) => total + ring.length / 2, 0);
}

function main() {
  const anchorsByGeoid = loadAnchors();
  const files = readdirSync(GEO_PACK_DIR).filter((name) => name.endsWith(".json"));
  log(`Reading ${files.length} county packs from data/geo-packs`);

  const nationCounties = [];
  const byState = new Map();
  const fullResByState = new Map();
  const skipped = [];

  let sourceVertices = 0;
  let nationVertices = 0;
  let stateVertices = 0;

  for (const file of files) {
    const pack = JSON.parse(readFileSync(join(GEO_PACK_DIR, file), "utf8"));
    const geoid = String(pack.geoid ?? "").padStart(5, "0");
    const stateCode = FIPS_TO_STATE[geoid.slice(0, 2)];

    if (!stateCode || !pack.lod0?.boundaryRings?.length) {
      skipped.push({ file, reason: !stateCode ? "unknown state FIPS" : "no boundary geometry" });
      continue;
    }

    sourceVertices += pack.lod0.boundaryRings.reduce((total, ring) => total + ring.length, 0);

    const anchors = anchorsByGeoid.get(geoid) ?? [];
    // Rank by population so each plate can print the largest places that fit.
    const rankedAnchors = [...anchors]
      .sort((a, b) => (b.population2024 ?? 0) - (a.population2024 ?? 0))
      .map((anchor) => ({
        name: anchor.label,
        lon: Number(anchor.longitude.toFixed(4)),
        lat: Number(anchor.latitude.toFixed(4)),
        population: anchor.population2024 ?? 0,
      }));

    const nation = reduceCounty(pack, {
      tolerance: NATION_TOLERANCE,
      minWaterArea: NATION_MIN_WATER_AREA,
      decimals: NATION_DECIMALS,
    });
    const state = reduceCounty(pack, {
      tolerance: STATE_TOLERANCE,
      minWaterArea: STATE_MIN_WATER_AREA,
      decimals: STATE_DECIMALS,
    });

    nationVertices += countVertices(nation.boundary);
    stateVertices += countVertices(state.boundary);

    // Keep full-resolution rings for the state dissolve. Simplifying first
    // would break the shared-vertex property the dissolve depends on.
    if (!fullResByState.has(stateCode)) fullResByState.set(stateCode, []);
    fullResByState.get(stateCode).push(...pack.lod0.boundaryRings);

    const identity = {
      slug: pack.countySlug,
      geoid,
      name: pack.name,
      state: stateCode,
    };

    // The national plate carries no water and no anchors: at that scale it is
    // a plate of county outlines, and everything else is illegible clutter.
    nationCounties.push({ ...identity, rings: nation.boundary });

    if (!byState.has(stateCode)) byState.set(stateCode, []);
    byState.get(stateCode).push({
      ...identity,
      rings: state.boundary,
      water: state.water,
      waterNames: state.waterNames,
      // Only the largest few places per county survive to the state plate.
      anchors: rankedAnchors.slice(0, 3),
      population: rankedAnchors.reduce((total, anchor) => total + anchor.population, 0),
    });
  }

  // Dissolve each state's counties into its outline. This runs on
  // full-resolution rings (shared vertices intact), then simplifies the result
  // — the reverse order would produce gaps along every shared border.
  log(`Dissolving ${fullResByState.size} state outlines`);
  const stateOutlines = new Map();
  const dissolveDiagnostics = [];

  for (const [code, rings] of fullResByState) {
    const dissolved = dissolveRings(rings);

    // The dissolve returns one substantial ring per landmass plus a tail of
    // zero-area slivers, thrown off by the handful of places where the source
    // topology is not perfectly shared (Virginia's independent cities are
    // nested inside counties, so a few segments legitimately appear three
    // times). Measured on the real data, the real outline carries ~100% of the
    // area and the slivers carry none, so an area filter separates them
    // cleanly. Islands worth drawing — Nantucket, the Keys, the Hawaiian
    // chain — sit far above this threshold.
    const substantial = dissolved.rings
      .map((ring) => ({ ring, area: ringAreaDegrees(ring) }))
      .filter((entry) => entry.area >= STATE_OUTLINE_MIN_AREA)
      .sort((a, b) => b.area - a.area)
      .map((entry) => entry.ring);

    const simplifiedNation = substantial
      .map((ring) => quantizeRing(simplifyClosedRing(ring, NATION_TOLERANCE), NATION_DECIMALS))
      .filter((ring) => ring.length >= 4);
    const simplifiedState = substantial
      .map((ring) => quantizeRing(simplifyClosedRing(ring, STATE_TOLERANCE), STATE_DECIMALS))
      .filter((ring) => ring.length >= 4);

    stateOutlines.set(code, {
      nation: simplifiedNation.map((ring) => encodeRing(ring, { decimals: NATION_DECIMALS })),
      state: simplifiedState.map((ring) => encodeRing(ring, { decimals: STATE_DECIMALS })),
    });

    dissolveDiagnostics.push({
      state: code,
      rawRings: dissolved.rings.length,
      keptRings: substantial.length,
      overShared: dissolved.stats.overSharedSegments,
      openChains: dissolved.stats.openChains,
    });
  }

  // A state that dissolved to nothing is a real failure; over-shared segments
  // alone are expected in a few states and are absorbed by the area filter.
  const emptyOutlines = dissolveDiagnostics.filter((entry) => entry.keptRings === 0);

  mkdirSync(join(outDir, "state"), { recursive: true });

  const nationPlate = {
    plate: "nation",
    projection: "albers-usa-composite",
    source: "US Census Bureau TIGERweb (public domain)",
    // Rings are delta-encoded fixed-point integers; see packages/core ringCodec.
    encoding: { rings: "delta-fixed-point", decimals: NATION_DECIMALS },
    toleranceDegrees: NATION_TOLERANCE,
    countyCount: nationCounties.length,
    states: Object.fromEntries(
      [...byState.keys()].sort().map((code) => [code, STATE_NAMES[code] ?? code.toUpperCase()]),
    ),
    // State outlines are drawn heavier than county lines so the plate has a
    // readable hierarchy instead of 3,222 equal-weight shapes.
    stateOutlines: Object.fromEntries(
      [...stateOutlines.entries()].sort().map(([code, rings]) => [code, rings.nation]),
    ),
    counties: nationCounties,
  };

  const nationPath = join(outDir, "nation.json");
  writeFileSync(nationPath, JSON.stringify(nationPlate));
  const nationBytes = Buffer.byteLength(JSON.stringify(nationPlate));

  const statePlates = [];
  for (const [code, counties] of [...byState.entries()].sort()) {
    const plate = {
      plate: "state",
      state: code,
      stateName: STATE_NAMES[code] ?? code.toUpperCase(),
      projection: "albers-centered",
      source: "US Census Bureau TIGERweb (public domain)",
      encoding: { rings: "delta-fixed-point", decimals: STATE_DECIMALS },
      toleranceDegrees: STATE_TOLERANCE,
      countyCount: counties.length,
      outline: stateOutlines.get(code)?.state ?? [],
      counties: counties.sort((a, b) => a.name.localeCompare(b.name)),
    };
    const body = JSON.stringify(plate);
    writeFileSync(join(outDir, "state", `${code}.json`), body);
    statePlates.push({ state: code, counties: counties.length, bytes: Buffer.byteLength(body) });
  }

  const largestState = [...statePlates].sort((a, b) => b.bytes - a.bytes)[0];

  const summary = {
    ok: true,
    outDir,
    nation: {
      counties: nationCounties.length,
      bytes: nationBytes,
      kb: Math.round(nationBytes / 1024),
    },
    states: {
      count: statePlates.length,
      largest: largestState,
      totalKb: Math.round(statePlates.reduce((sum, s) => sum + s.bytes, 0) / 1024),
    },
    vertices: {
      source: sourceVertices,
      nation: nationVertices,
      state: stateVertices,
      nationReduction: `${(100 - (nationVertices / sourceVertices) * 100).toFixed(1)}%`,
      stateReduction: `${(100 - (stateVertices / sourceVertices) * 100).toFixed(1)}%`,
    },
    dissolve: {
      states: dissolveDiagnostics.length,
      totalKeptRings: dissolveDiagnostics.reduce((sum, entry) => sum + entry.keptRings, 0),
      statesWithOverSharedSegments: dissolveDiagnostics.filter((entry) => entry.overShared > 0).map((entry) => entry.state),
      // Must be empty. A state with no outline would vanish from the plate.
      emptyOutlines,
    },
    skipped,
  };

  console.log(JSON.stringify(summary, null, jsonOnly ? 0 : 2));

  if (skipped.length > 0 && !jsonOnly) {
    console.error(`WARNING: skipped ${skipped.length} packs`);
  }
}

main();
