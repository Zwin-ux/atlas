#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const INDEX_PATH = path.join(repoRoot, "packages/core/src/world/usCountyIndex.ts");
const POPULATION_PATH = path.join(repoRoot, "data/census/co-est2024-alldata.csv");
const GAZETTEER_PATH = path.join(repoRoot, "data/census/2024_Gaz_counties_national.txt");
const OUTPUT_PATH = path.join(repoRoot, "packages/core/src/world/usCountyFacts.ts");

const TIER_CUTS = {
  urban_core: 1400,
  suburban: 300,
  town: 50,
  rural: 10,
};

// The staged CO-EST2024 county file covers states/DC only. Puerto Rico's 78
// municipios are present in the 2024 gazetteer and Atlas index, but absent from
// the staged population file. Keep the fallback explicit and loud so it can be
// replaced by a staged Puerto Rico 2024 estimate file without changing runtime
// code. Values are legacy Census decennial counts held forward only for those
// missing rows; they are never silently zeroed.
const PR_MUNICIPIO_POPULATION_FALLBACK_BY_GEOID = {
  "72001": 18020,
  "72003": 38136,
  "72005": 55101,
  "72007": 24223,
  "72009": 24637,
  "72011": 25596,
  "72013": 87754,
  "72015": 15843,
  "72017": 22657,
  "72019": 28983,
  "72021": 185187,
  "72023": 47158,
  "72025": 127244,
  "72027": 32827,
  "72029": 43335,
  "72031": 154815,
  "72033": 23155,
  "72035": 41652,
  "72037": 11307,
  "72039": 16984,
  "72041": 39970,
  "72043": 34668,
  "72045": 18883,
  "72047": 34571,
  "72049": 1792,
  "72051": 35879,
  "72053": 32124,
  "72054": 11692,
  "72055": 13787,
  "72057": 35770,
  "72059": 17784,
  "72061": 89780,
  "72063": 40622,
  "72065": 38486,
  "72067": 15654,
  "72069": 50896,
  "72071": 42943,
  "72073": 14779,
  "72075": 46538,
  "72077": 37012,
  "72079": 23334,
  "72081": 23723,
  "72083": 8874,
  "72085": 38675,
  "72087": 23693,
  "72089": 17781,
  "72091": 39492,
  "72093": 4455,
  "72095": 10589,
  "72097": 73077,
  "72099": 37012,
  "72101": 28727,
  "72103": 23386,
  "72105": 29241,
  "72107": 21434,
  "72109": 15985,
  "72111": 20399,
  "72113": 137491,
  "72115": 23638,
  "72117": 15187,
  "72119": 47060,
  "72121": 22729,
  "72123": 26128,
  "72125": 31879,
  "72127": 342259,
  "72129": 37693,
  "72131": 39345,
  "72133": 20281,
  "72135": 74066,
  "72137": 75293,
  "72139": 67740,
  "72141": 28287,
  "72143": 35395,
  "72145": 54414,
  "72147": 8249,
  "72149": 22093,
  "72151": 30426,
  "72153": 34172,
};

function main() {
  const indexRows = readCountyIndexRows();
  const populationByGeoid = readPopulationEstimates();
  const landAreaByGeoid = readCountyLandAreas();

  const missing = [];
  const fallbackRows = [];
  const rows = [];
  const histogram = emptyHistogram();

  for (const [geoid, stateCode, name, countySlug] of indexRows) {
    const landAreaSqMi = roundLandArea(landAreaByGeoid.get(geoid));
    const directPopulation = populationByGeoid.get(geoid);
    const fallbackPopulation = PR_MUNICIPIO_POPULATION_FALLBACK_BY_GEOID[geoid];
    const population2024 = directPopulation ?? fallbackPopulation;

    if (!Number.isFinite(population2024) || !Number.isFinite(landAreaSqMi) || landAreaSqMi <= 0) {
      missing.push({ geoid, stateCode, name, countySlug, population2024, landAreaSqMi });
      continue;
    }

    if (directPopulation === undefined) {
      fallbackRows.push({ geoid, stateCode, name, countySlug, population2024, landAreaSqMi });
    }

    rows.push([geoid, population2024, landAreaSqMi]);
    histogram[tierForDensity(roundDensity(population2024 / landAreaSqMi))] += 1;
  }

  if (missing.length > 0) {
    console.error("Missing unresolved county facts:");
    for (const entry of missing) {
      console.error(
        `  ${entry.geoid} ${entry.countySlug}: population=${String(entry.population2024)} landAreaSqMi=${String(entry.landAreaSqMi)}`,
      );
    }
    process.exit(1);
  }

  writeFileSync(OUTPUT_PATH, renderOutput(rows, fallbackRows, histogram), "utf8");

  console.log("Atlas county facts build");
  console.log(`  index rows: ${indexRows.length}`);
  console.log(`  direct population rows: ${rows.length - fallbackRows.length}`);
  console.log(`  explicit fallback rows: ${fallbackRows.length}`);
  console.log(`  generated rows: ${rows.length}`);
  console.log("  tier cuts:");
  console.log(`    urban_core >= ${TIER_CUTS.urban_core}`);
  console.log(`    suburban   >= ${TIER_CUTS.suburban} and < ${TIER_CUTS.urban_core}`);
  console.log(`    town       >= ${TIER_CUTS.town} and < ${TIER_CUTS.suburban}`);
  console.log(`    rural      >= ${TIER_CUTS.rural} and < ${TIER_CUTS.town}`);
  console.log(`    frontier   <  ${TIER_CUTS.rural}`);
  console.log("  national histogram:");
  for (const [tier, count] of Object.entries(histogram)) console.log(`    ${tier}: ${count}`);
  console.log("  fallback geoids:");
  if (fallbackRows.length === 0) {
    console.log("    none");
  } else {
    for (const entry of fallbackRows) {
      console.log(`    ${entry.geoid} ${entry.countySlug} population=${entry.population2024} landAreaSqMi=${entry.landAreaSqMi}`);
    }
  }
}

function readCountyIndexRows() {
  const source = readFileSync(INDEX_PATH, "utf8");
  const match = source.match(/const US_COUNTY_INDEX_ROWS:[\s\S]*?=\s*(\[[\s\S]*?\n\]);/);
  if (!match) throw new Error(`Unable to locate US_COUNTY_INDEX_ROWS in ${INDEX_PATH}`);
  const rows = Function(`"use strict"; return ${match[1]};`)();
  if (!Array.isArray(rows)) throw new Error("US_COUNTY_INDEX_ROWS did not evaluate to an array");
  return rows;
}

function readPopulationEstimates() {
  const lines = readFileSync(POPULATION_PATH, "utf8").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const indexes = indexesByHeader(header);
  const required = ["STATE", "COUNTY", "POPESTIMATE2024"];
  for (const field of required) {
    if (indexes[field] === undefined) throw new Error(`Missing ${field} in ${POPULATION_PATH}`);
  }

  const byGeoid = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    const state = cells[indexes.STATE];
    const county = cells[indexes.COUNTY];
    if (!state || !county || county === "000") continue;
    const geoid = `${state}${county}`;
    const population = Number(cells[indexes.POPESTIMATE2024]);
    if (!Number.isInteger(population) || population < 0) throw new Error(`Invalid POPESTIMATE2024 for ${geoid}`);
    byGeoid.set(geoid, population);
  }
  return byGeoid;
}

function readCountyLandAreas() {
  const lines = readFileSync(GAZETTEER_PATH, "utf8").trim().split(/\r?\n/);
  const header = lines[0].trim().split(/\t/).map((value) => value.trim());
  const indexes = indexesByHeader(header);
  if (indexes.GEOID === undefined || indexes.ALAND_SQMI === undefined) {
    throw new Error(`Missing GEOID or ALAND_SQMI in ${GAZETTEER_PATH}`);
  }

  const byGeoid = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split(/\t/).map((value) => value.trim());
    const geoid = cells[indexes.GEOID];
    const landArea = Number(cells[indexes.ALAND_SQMI]);
    if (!geoid || !Number.isFinite(landArea) || landArea <= 0) throw new Error(`Invalid ALAND_SQMI for ${geoid || "missing geoid"}`);
    byGeoid.set(geoid, landArea);
  }
  return byGeoid;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function indexesByHeader(header) {
  return Object.fromEntries(header.map((field, index) => [field, index]));
}

function tierForDensity(densityPerSqMi) {
  if (densityPerSqMi >= TIER_CUTS.urban_core) return "urban_core";
  if (densityPerSqMi >= TIER_CUTS.suburban) return "suburban";
  if (densityPerSqMi >= TIER_CUTS.town) return "town";
  if (densityPerSqMi >= TIER_CUTS.rural) return "rural";
  return "frontier";
}

function emptyHistogram() {
  return { urban_core: 0, suburban: 0, town: 0, rural: 0, frontier: 0 };
}

function roundLandArea(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : Number.NaN;
}

function roundDensity(value) {
  return Math.round(value * 10) / 10;
}

function renderOutput(rows, fallbackRows, histogram) {
  const rowLines = rows.map(([geoid, population2024, landAreaSqMi]) => `  ["${geoid}", ${population2024}, ${landAreaSqMi.toFixed(1)}],`);
  const fallbackList = fallbackRows.map((entry) => entry.geoid);
  return `// Generated by scripts/build-county-facts.mjs from staged Census facts.\n` +
    `// Do not edit rows by hand; regenerate after updating data/census inputs.\n` +
    `// Population source: data/census/co-est2024-alldata.csv, POPESTIMATE2024.\n` +
    `// Land area source: data/census/2024_Gaz_counties_national.txt, ALAND_SQMI.\n` +
    `// Explicit fallback rows: ${fallbackRows.length === 0 ? "none" : fallbackList.join(", ")}.\n` +
    `// Build histogram with density cuts urban_core>=${TIER_CUTS.urban_core}, suburban>=${TIER_CUTS.suburban}, town>=${TIER_CUTS.town}, rural>=${TIER_CUTS.rural}: ${JSON.stringify(histogram)}.\n\n` +
    `export type UsCountyFactRow = readonly [geoid: string, population2024: number, landAreaSqMi: number];\n\n` +
    `export const US_COUNTY_FACTS_POPULATION_YEAR = 2024;\n` +
    `export const US_COUNTY_FACTS_LAND_AREA_YEAR = 2024;\n` +
    `export const US_COUNTY_FACTS_FALLBACK_GEOIDS = ${JSON.stringify(fallbackList, null, 2)} as const;\n\n` +
    `export const US_COUNTY_FACTS: UsCountyFactRow[] = [\n${rowLines.join("\n")}\n];\n\n` +
    `export const US_COUNTY_FACTS_BY_GEOID = new Map(US_COUNTY_FACTS.map((row) => [row[0], row]));\n`;
}

main();
