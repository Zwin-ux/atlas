#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import {
  createDeterministicGeneratedDistrictSpec,
  resolveCountyParameters,
} from "../packages/core/dist/index.js";
import { US_COUNTY_FACTS, US_COUNTY_INDEX } from "../packages/core/dist/world/index.js";

const SAMPLE_SIZE = 16;
const LEDGER_PATH = process.env.ATLAS_VISUAL_SAMPLE_LEDGER_PATH || "artifacts/visual-score/sample-ledger.json";
const HARD_CASE_ANCHORS = [
  "kalawao-hi",
  "aleutians-east-borough-ak",
  "loving-tx",
  "orleans-parish-la",
];
const STRATA_FIELDS = ["archetype", "urbanizationTier", "waterFactBand", "censusDivision"];
const STRATA_KEY_EXAMPLE = "archetype=<value>|tier=<value>|water=<value>|division=<value>";

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const week = parseIsoWeek(args.week);
  const countyRecords = buildCountyRecords();
  const ledger = await readLedger(LEDGER_PATH);
  const sample = pickSample({ countyRecords, ledger, week });

  if (!args.dryRun) {
    await writeLedger(LEDGER_PATH, nextLedger({ ledger, sample, week, countyRecords }));
  }

  printSample({ dryRun: args.dryRun, week, sample, countyRecords });
}

function parseArgs(argv) {
  const args = { dryRun: false, week: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--dry-run") args.dryRun = true;
    else if (value === "--week") args.week = requireArgValue(argv, ++index, value);
    else if (value === "--help" || value === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  if (!args.week) throw new Error("--week YYYY-Www is required.");
  return args;
}

function requireArgValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

function printHelp() {
  console.log(`Usage: node scripts/pick-challenge-sample.mjs --week YYYY-Www [--dry-run]

Picks the 0.79-3 deterministic 16-county visual challenge sample.
The week is caller-supplied and must be an ISO week label such as 2026-W28.`);
}

function parseIsoWeek(value) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) throw new Error(`--week must use YYYY-Www, got ${value}`);
  const weekNumber = Number(match[2]);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    throw new Error(`--week must use ISO week 01-53, got ${value}`);
  }
  return value;
}

function buildCountyRecords() {
  const factsByGeoid = new Map(US_COUNTY_FACTS.map((fact) => [fact[0], fact]));
  const records = [];

  for (const county of US_COUNTY_INDEX) {
    const fact = factsByGeoid.get(county.geoid);
    if (!fact) throw new Error(`Missing US_COUNTY_FACTS row for ${county.countySlug} (${county.geoid})`);

    const generated = createDeterministicGeneratedDistrictSpec({ county });
    const parameters = resolveCountyParameters(county, generated.seed);
    if (generated.archetype !== parameters.archetype) {
      throw new Error(
        `Generated archetype drift for ${county.countySlug}: ${generated.archetype} != ${parameters.archetype}`,
      );
    }
    if (!nearlyEqual(fact[4], parameters.waterFraction, 0.001)) {
      throw new Error(
        `Water fact drift for ${county.countySlug}: facts=${fact[4]} parameters=${parameters.waterFraction}`,
      );
    }

    const stratum = {
      archetype: generated.archetype,
      urbanizationTier: parameters.urbanizationTier,
      waterFactBand: parameters.waterFactBand,
      censusDivision: parameters.region,
    };

    records.push({
      county,
      generated,
      parameters,
      fact: {
        geoid: fact[0],
        population2024: fact[1],
        landAreaSqMi: fact[2],
        waterAreaSqMi: fact[3],
        waterFraction: fact[4],
      },
      stratum,
      stratumKey: stratumKey(stratum),
    });
  }

  return records.sort((a, b) => compareStrings(a.county.countySlug, b.county.countySlug));
}

function nearlyEqual(a, b, epsilon) {
  return Math.abs(a - b) <= epsilon;
}

async function readLedger(path) {
  try {
    const raw = await readFile(path, "utf8");
    return normalizeLedger(JSON.parse(raw));
  } catch (error) {
    if (error?.code === "ENOENT") return emptyLedger();
    throw error;
  }
}

function emptyLedger() {
  return normalizeLedger({
    version: 1,
    sampleSize: SAMPLE_SIZE,
    hardCaseAnchors: HARD_CASE_ANCHORS,
    strataDefinition: {
      fields: STRATA_FIELDS,
      key: STRATA_KEY_EXAMPLE,
    },
    strataSeen: {},
    samplesByWeek: {},
  });
}

function normalizeLedger(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${LEDGER_PATH} must contain a JSON object.`);
  }

  const strataSeen = {};
  const rawStrataSeen = input.strataSeen ?? {};
  if (!rawStrataSeen || typeof rawStrataSeen !== "object" || Array.isArray(rawStrataSeen)) {
    throw new Error(`${LEDGER_PATH}.strataSeen must be an object of stratum keys to week arrays.`);
  }
  for (const [key, weeks] of Object.entries(rawStrataSeen)) {
    if (!Array.isArray(weeks)) throw new Error(`${LEDGER_PATH}.strataSeen[${key}] must be an array.`);
    strataSeen[key] = sortWeeks(uniqueStrings(weeks.map(parseIsoWeek)));
  }

  const samplesByWeek = {};
  const rawSamples = input.samplesByWeek ?? {};
  if (!rawSamples || typeof rawSamples !== "object" || Array.isArray(rawSamples)) {
    throw new Error(`${LEDGER_PATH}.samplesByWeek must be an object.`);
  }
  for (const [week, counties] of Object.entries(rawSamples)) {
    samplesByWeek[parseIsoWeek(week)] = Array.isArray(counties) ? counties : [];
  }

  return {
    version: 1,
    sampleSize: SAMPLE_SIZE,
    hardCaseAnchors: HARD_CASE_ANCHORS,
    strataDefinition: {
      fields: STRATA_FIELDS,
      key: STRATA_KEY_EXAMPLE,
    },
    strataSeen,
    samplesByWeek,
  };
}

function uniqueStrings(values) {
  return [...new Set(values)];
}

function pickSample({ countyRecords, ledger, week }) {
  const countyBySlug = new Map(countyRecords.map((record) => [record.county.countySlug, record]));
  const strata = strataMap(countyRecords);
  const selected = [];
  const selectedSlugs = new Set();
  const selectedStrata = new Set();

  for (const countySlug of HARD_CASE_ANCHORS) {
    const record = countyBySlug.get(countySlug);
    if (!record) throw new Error(`Hard-case anchor is not indexed: ${countySlug}`);
    addSelected(selected, selectedSlugs, selectedStrata, record, "hard-case-anchor");
  }

  const rankedStrata = [...strata.values()]
    .filter((entry) => !selectedStrata.has(entry.key))
    .sort((a, b) => compareStrataPriority(a, b, ledger, week));

  for (const entry of rankedStrata) {
    if (selected.length >= SAMPLE_SIZE) break;
    const record = pickCountyFromStratum(entry, selectedSlugs, week);
    if (!record) continue;
    const weeks = ledgerWeeks(ledger, entry.key);
    const reason = weeks.length === 0 ? "never-sampled-stratum" : `oldest-sampled-stratum:${weeks[weeks.length - 1]}`;
    addSelected(selected, selectedSlugs, selectedStrata, record, reason);
  }

  if (selected.length < SAMPLE_SIZE) {
    const fallbackRecords = countyRecords
      .filter((record) => !selectedSlugs.has(record.county.countySlug))
      .sort((a, b) => compareHashThenSlug(a, b, week, "fallback-county"));
    for (const record of fallbackRecords) {
      if (selected.length >= SAMPLE_SIZE) break;
      addSelected(selected, selectedSlugs, selectedStrata, record, "fallback-fill");
    }
  }

  if (selected.length !== SAMPLE_SIZE) {
    throw new Error(`Could not build ${SAMPLE_SIZE}-county sample; picked ${selected.length}`);
  }

  return selected;
}

function addSelected(selected, selectedSlugs, selectedStrata, record, reason) {
  if (selectedSlugs.has(record.county.countySlug)) return;
  selected.push({ ...record, reason });
  selectedSlugs.add(record.county.countySlug);
  selectedStrata.add(record.stratumKey);
}

function strataMap(countyRecords) {
  const strata = new Map();
  for (const record of countyRecords) {
    const existing = strata.get(record.stratumKey);
    if (existing) {
      existing.counties.push(record);
    } else {
      strata.set(record.stratumKey, {
        key: record.stratumKey,
        stratum: record.stratum,
        counties: [record],
      });
    }
  }
  for (const entry of strata.values()) {
    entry.counties.sort((a, b) => compareStrings(a.county.countySlug, b.county.countySlug));
  }
  return strata;
}

function compareStrataPriority(a, b, ledger, week) {
  const aWeeks = ledgerWeeks(ledger, a.key);
  const bWeeks = ledgerWeeks(ledger, b.key);
  const aSeen = aWeeks.length > 0;
  const bSeen = bWeeks.length > 0;
  if (aSeen !== bSeen) return aSeen ? 1 : -1;
  if (aSeen && bSeen) {
    const lastDiff = isoWeekOrdinal(aWeeks[aWeeks.length - 1]) - isoWeekOrdinal(bWeeks[bWeeks.length - 1]);
    if (lastDiff !== 0) return lastDiff;
    const countDiff = aWeeks.length - bWeeks.length;
    if (countDiff !== 0) return countDiff;
  }
  return compareHashStrings(a.key, b.key, week, "stratum-priority");
}

function ledgerWeeks(ledger, stratum) {
  return ledger.strataSeen[stratum] ?? [];
}

function pickCountyFromStratum(entry, selectedSlugs, week) {
  return entry.counties
    .filter((record) => !selectedSlugs.has(record.county.countySlug))
    .sort((a, b) => compareHashThenSlug(a, b, week, `county:${entry.key}`))[0];
}

function compareHashThenSlug(a, b, week, salt) {
  return compareHashStrings(a.county.countySlug, b.county.countySlug, week, salt);
}

function compareHashStrings(a, b, week, salt) {
  const aHash = fnv1a32(`${week}|${salt}|${a}`);
  const bHash = fnv1a32(`${week}|${salt}|${b}`);
  if (aHash !== bHash) return aHash - bHash;
  return compareStrings(a, b);
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function nextLedger({ ledger, sample, week, countyRecords }) {
  const strataSeen = { ...ledger.strataSeen };
  for (const record of sample) {
    strataSeen[record.stratumKey] = sortWeeks(uniqueStrings([...(strataSeen[record.stratumKey] ?? []), week]));
  }

  return {
    version: 1,
    sampleSize: SAMPLE_SIZE,
    generatedBy: "scripts/pick-challenge-sample.mjs",
    hardCaseAnchors: HARD_CASE_ANCHORS,
    strataDefinition: {
      fields: STRATA_FIELDS,
      key: STRATA_KEY_EXAMPLE,
    },
    countyCount: countyRecords.length,
    totalStrata: strataMap(countyRecords).size,
    lastWrittenWeek: week,
    strataSeen: sortObject(strataSeen),
    samplesByWeek: sortObject({
      ...ledger.samplesByWeek,
      [week]: sample.map((record) => ({
        countySlug: record.county.countySlug,
        stratum: record.stratumKey,
        reason: record.reason,
      })),
    }),
  };
}

async function writeLedger(path, ledger) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`);
}

function printSample({ dryRun, week, sample, countyRecords }) {
  const command = [
    "node",
    "scripts/verify-emulator-audit.mjs",
    ...sample.flatMap((record) => ["--county", record.county.countySlug]),
  ].join(" ");

  console.log("0.79-3 stratified rotating visual sampler");
  console.log(`week: ${week}`);
  console.log(`dryRun: ${dryRun}`);
  console.log(`counties: ${sample.length}`);
  console.log(`countyUniverse: ${countyRecords.length}`);
  console.log(`strataDefinition: ${STRATA_FIELDS.join(" x ")}`);
  console.log(`ledger: ${dryRun ? "not written" : "written"} ${LEDGER_PATH}`);
  console.log("");
  for (const [index, record] of sample.entries()) {
    console.log(
      `${String(index + 1).padStart(2, "0")}. ${record.county.countySlug} | ${record.stratumKey} | ${record.reason}`,
    );
  }
  console.log("");
  console.log("command:");
  console.log(command);
}

function stratumKey(stratum) {
  return [
    `archetype=${stratum.archetype}`,
    `tier=${stratum.urbanizationTier}`,
    `water=${stratum.waterFactBand}`,
    `division=${stratum.censusDivision}`,
  ].join("|");
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => compareStrings(a, b)));
}

function sortWeeks(weeks) {
  return [...weeks].sort((a, b) => isoWeekOrdinal(a) - isoWeekOrdinal(b));
}

function isoWeekOrdinal(week) {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) throw new Error(`Invalid ISO week in ledger: ${week}`);
  return Number(match[1]) * 53 + Number(match[2]);
}

function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
