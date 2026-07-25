#!/usr/bin/env node
/**
 * Location Truth battery — the product's quality gate.
 *
 * The standing requirement: a location ask resolves to the right place, or
 * says honestly that it cannot. Never confidently wrong.
 *
 * That splits every answer into exactly three buckets:
 *
 *   correct            returned county+state match the labelled truth
 *   confidently wrong  returned a place, and it is the wrong one
 *   honest refusal     returned ambiguous or unresolved
 *
 * Zero confidently-wrong is the hard gate. But a gate that only punished wrong
 * answers would be trivially passed by an index that refuses everything, so
 * each class also carries a resolution floor. Over-refusal fails too.
 *
 * Classes are deliberately not all drawn from the resolver's own source:
 * exact-name cases are a floor rather than proof, so the battery also perturbs
 * inputs (misspellings, missing diacritics, case and punctuation noise) and
 * carries a hand-seeded vernacular class the index has never seen.
 *
 * Run: node scripts/verify-location-truth.mjs [--json-only] [--sample N]
 * Exit code 0 = gate green. Any non-zero = do not ship.
 */

import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadAtlasIndex } from "../server/dist/atlasIndex.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const jsonOnly = args.includes("--json-only");
const sampleSize = Number(argValue("--sample") ?? 600);

function argValue(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function log(message) {
  if (!jsonOnly) console.log(message);
}

/**
 * Deterministic pseudo-random generator.
 *
 * The sample must be reproducible: a gate whose population changes every run
 * cannot be compared across builds, and a regression could hide simply by not
 * being sampled twice.
 */
function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const index = loadAtlasIndex(join(ROOT, "data", "census", "us-county-town-anchors.json"));
const gazetteer = index.gazetteer;

/** Every (name, county, state) triple the index should be able to answer. */
const truth = [];
{
  const anchorFile = JSON.parse(
    (await import("node:fs")).readFileSync(join(ROOT, "data", "census", "us-county-town-anchors.json"), "utf8"),
  );
  for (const [slug, county] of Object.entries(anchorFile.counties ?? {})) {
    for (const anchor of county.anchors ?? []) {
      truth.push({
        query: anchor.label,
        countySlug: slug,
        state: (county.stateCode ?? "").toLowerCase(),
        population: anchor.population2024 ?? 0,
      });
    }
  }
}

/** Classify one answer against its label. */
function classify(result, expected) {
  if (result.status === "resolved") {
    const right =
      result.place.countySlug === expected.countySlug &&
      (!expected.state || result.place.state === expected.state);
    return right ? "correct" : "confidently-wrong";
  }
  return "honest-refusal";
}

function runClass(name, cases, thresholds) {
  const counts = { correct: 0, "confidently-wrong": 0, "honest-refusal": 0 };
  const failures = [];

  for (const testCase of cases) {
    const result = gazetteer.resolve(testCase.query);
    const verdict = classify(result, testCase);
    counts[verdict] += 1;

    if (verdict === "confidently-wrong" && failures.length < 25) {
      failures.push({
        query: testCase.query,
        expected: `${testCase.countySlug} (${testCase.state})`,
        got: `${result.place.countySlug} (${result.place.state})`,
        matchedOn: result.matchedOn,
      });
    }
  }

  const total = cases.length || 1;
  const resolutionRate = counts.correct / total;
  const wrongRate = counts["confidently-wrong"] / total;

  const passed =
    counts["confidently-wrong"] <= (thresholds.maxConfidentlyWrong ?? 0) &&
    resolutionRate >= (thresholds.minResolution ?? 0);

  return {
    name,
    cases: cases.length,
    correct: counts.correct,
    confidentlyWrong: counts["confidently-wrong"],
    honestRefusals: counts["honest-refusal"],
    resolutionRate: Number((resolutionRate * 100).toFixed(2)),
    wrongRate: Number((wrongRate * 100).toFixed(2)),
    minResolution: (thresholds.minResolution ?? 0) * 100,
    passed,
    failures,
  };
}

/** Deterministic sample of the truth set. */
function sample(list, count, seed) {
  const random = makeRandom(seed);
  const picked = [];
  const used = new Set();
  const limit = Math.min(count, list.length);
  while (picked.length < limit) {
    const i = Math.floor(random() * list.length);
    if (used.has(i)) continue;
    used.add(i);
    picked.push(list[i]);
  }
  return picked;
}

/** Perturb a name the way a person mistypes one. */
function misspell(name, random) {
  const letters = name.split("");
  const alphaIndices = letters
    .map((char, i) => (/[a-z]/i.test(char) ? i : -1))
    .filter((i) => i >= 0 && i > 0);
  if (alphaIndices.length < 3) return null;

  const mode = Math.floor(random() * 3);
  const at = alphaIndices[Math.floor(random() * alphaIndices.length)];

  if (mode === 0 && at + 1 < letters.length) {
    // transposition
    const swap = letters[at];
    letters[at] = letters[at + 1];
    letters[at + 1] = swap;
  } else if (mode === 1) {
    // dropped character
    letters.splice(at, 1);
  } else {
    // doubled character
    letters.splice(at, 0, letters[at]);
  }

  const result = letters.join("");
  return result === name ? null : result;
}

/**
 * True when a perturbed string is itself a real place name (other than the one
 * being perturbed). Uses the live index so suffix handling matches exactly.
 */
function collidesWithRealPlace(candidate, origin) {
  if (nameCounts.has(candidate.toLowerCase())) return true;
  const result = gazetteer.resolve(candidate);
  if (result.status === "ambiguous") return true;
  if (result.status !== "resolved") return false;
  const exactish = result.matchedOn === "exact" || result.matchedOn === "same-location" || result.matchedOn === "dominant";
  return exactish && result.place.countySlug !== origin.countySlug;
}

log(`Index: ${index.stats().counties} counties, ${index.stats().places} places`);

/**
 * Split the truth set by whether the bare name identifies one place.
 *
 * The gate is ">=95% on *unambiguous* exact names". Roughly a third of US place
 * names are shared — there are dozens of Shermans and Franklins — and for those
 * a bare query has no single right answer. Scoring them against one arbitrary
 * label would be measuring the wrong thing: it would punish the resolver for
 * correctly refusing to guess. They get their own class below, where the
 * required behaviour is to admit the ambiguity.
 */
const nameCounts = new Map();
function countName(value) {
  const key = value.toLowerCase().trim();
  if (key) nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
}
for (const entry of truth) countName(entry.query);

// County names count as collisions too. "Cook" is the only place with that
// name, but it also matches Cook County, Illinois once the suffix is stripped —
// so a bare "Cook" is not unambiguous, and scoring it against the Nebraska
// village would be measuring the wrong thing.
for (const slug of Object.keys(
  JSON.parse(
    (await import("node:fs")).readFileSync(join(ROOT, "data", "census", "us-county-town-anchors.json"), "utf8"),
  ).counties ?? {},
)) {
  const identity = index.identityFor(slug);
  if (!identity) continue;
  countName(identity.name);
  countName(identity.name.replace(/\s+(County|Parish|Borough|Census Area|Municipio|city and borough)$/i, ""));
}
const uniqueTruth = truth.filter((entry) => nameCounts.get(entry.query.toLowerCase()) === 1);
const sharedTruth = truth.filter((entry) => nameCounts.get(entry.query.toLowerCase()) > 1);

log(
  `Truth set: ${truth.length} places — ${uniqueTruth.length} with a unique name, ` +
    `${sharedTruth.length} sharing a name with another place`,
);

const exactCases = sample(uniqueTruth, sampleSize, 20260725);

// --- Class 1: exact names -------------------------------------------------
// A floor, not proof: these come from the resolver's own source. The classes
// below are what break the circularity.
const exactClass = runClass("exact-names", exactCases, {
  minResolution: 0.95,
  maxConfidentlyWrong: 0,
});

// --- Class 2: case and punctuation noise ----------------------------------
const noisyClass = runClass(
  "case-and-punctuation",
  exactCases.slice(0, 300).map((entry) => ({
    ...entry,
    query: entry.query.toUpperCase().replace(/\./g, "").replace(/\s+/g, "  "),
  })),
  { minResolution: 0.9, maxConfidentlyWrong: 0 },
);

// --- Class 3: misspellings ------------------------------------------------
// The honest outcome here is either the right place or a refusal. A wrong
// place is the failure this whole battery exists to catch.
const misspellRandom = makeRandom(80808);
const misspelled = [];
for (const entry of exactCases) {
  const typo = misspell(entry.query, misspellRandom);
  // A perturbation that lands on another real place name is not a typo — it is
  // a different valid query, and answering it correctly would be scored as a
  // wrong answer. Dropping "Pinesdale" -> "Pinedale" (a real Wyoming town) is
  // fixing the measurement, not lowering the bar: those cases are re-checked
  // by the exact-name class under their own label.
  //
  // The index is the authority on what counts as a real name, because it also
  // matches suffix-stripped forms: "Orem" mistyped as "Ore" hits Ore City,
  // Texas, which a raw name comparison would miss.
  if (typo && !collidesWithRealPlace(typo, entry)) {
    misspelled.push({ ...entry, query: typo });
  }
  if (misspelled.length >= 300) break;
}
const misspellClass = runClass("misspellings", misspelled, {
  // Lower floor: some typos are genuinely unrecoverable and refusing is right.
  minResolution: 0.45,
  maxConfidentlyWrong: 0,
});

// --- Class 4: diacritics dropped -----------------------------------------
// Names that genuinely carry a diacritic, are unambiguous on their own, and
// whose unaccented form does not collide with a different real place. Without
// the collision check, "San Jose, PR" becomes "San Jose" — which San Jose,
// California rightly owns — and the resolver gets marked wrong for being right.
const accented = uniqueTruth.filter((entry) => {
  const stripped = entry.query.normalize("NFD").replace(/\p{M}+/gu, "");
  if (stripped === entry.query) return false;
  return !nameCounts.has(stripped.toLowerCase());
});
const strippedAccents = accented.slice(0, 200).map((entry) => ({
  ...entry,
  query: entry.query.normalize("NFD").replace(/\p{M}+/gu, ""),
}));
const diacriticsClass = runClass("diacritics-dropped", strippedAccents, {
  minResolution: 0.9,
  maxConfidentlyWrong: 0,
});

// --- Class 5: edge counties ----------------------------------------------
// The extremes of the dataset: smallest population, largest area, island and
// territory geography. These are where an index quietly falls over.
const edgeQueries = [
  { query: "Kalawao", countySlug: "kalawao-hi", state: "hi" },
  { query: "Loving", countySlug: "loving-tx", state: "tx" },
  { query: "Toa Baja", countySlug: "toa-baja-municipio-pr", state: "pr" },
  { query: "Miami-Dade County", countySlug: "miami-dade-fl", state: "fl" },
  { query: "Riverside County", countySlug: "riverside-ca", state: "ca" },
  { query: "Cook County, Illinois", countySlug: "cook-il", state: "il" },
  { query: "Suffolk County, MA", countySlug: "suffolk-ma", state: "ma" },
  { query: "Apache County", countySlug: "apache-az", state: "az" },
  { query: "Orleans Parish", countySlug: "orleans-parish-la", state: "la" },
  { query: "Sedgwick County", countySlug: "sedgwick-ks", state: "ks" },
].filter((entry) => index.identityFor(entry.countySlug));
const edgeClass = runClass("edge-counties", edgeQueries, {
  minResolution: 0.9,
  maxConfidentlyWrong: 0,
});

// --- Class 6: vernacular --------------------------------------------------
// Hand-seeded, never derived from the index. This is the class that proves the
// battery is not marking its own homework. Every entry is how a person would
// actually type it, not how the Census records it.
const vernacularClass = runClass(
  "vernacular",
  [
    { query: "Los Angeles, California", countySlug: "los-angeles-ca", state: "ca" },
    { query: "NYC", countySlug: "new-york-ny", state: "ny" },
    { query: "New York City", countySlug: "new-york-ny", state: "ny" },
    { query: "Brooklyn", countySlug: "kings-ny", state: "ny" },
    { query: "Manhattan", countySlug: "new-york-ny", state: "ny" },
    { query: "Chicago", countySlug: "cook-il", state: "il" },
    { query: "Houston, Texas", countySlug: "harris-tx", state: "tx" },
    { query: "Philly", countySlug: "philadelphia-pa", state: "pa" },
    { query: "Vegas", countySlug: "clark-nv", state: "nv" },
    { query: "Las Vegas", countySlug: "clark-nv", state: "nv" },
    { query: "New Orleans", countySlug: "orleans-parish-la", state: "la" },
    { query: "Miami", countySlug: "miami-dade-fl", state: "fl" },
    { query: "Boston", countySlug: "suffolk-ma", state: "ma" },
    { query: "Seattle", countySlug: "king-wa", state: "wa" },
    { query: "Portland, Oregon", countySlug: "multnomah-or", state: "or" },
    { query: "Portland, Maine", countySlug: "cumberland-me", state: "me" },
    { query: "Kansas City, Missouri", countySlug: "jackson-mo", state: "mo" },
    { query: "Eastvale", countySlug: "riverside-ca", state: "ca" },
    { query: "san francisco", countySlug: "san-francisco-ca", state: "ca" },
    { query: "ST. LOUIS", countySlug: "st-louis-city-mo", state: "mo" },
  ].filter((entry) => index.identityFor(entry.countySlug)),
  // Vernacular is hard by construction (nicknames, borough names that are not
  // Census places). The gate is that it is never confidently wrong; the
  // resolution floor is deliberately modest.
  { minResolution: 0.5, maxConfidentlyWrong: 0 },
);

// --- Class 6b: shared names must be qualified, not guessed ----------------
// A bare shared name should refuse. The same name *with its state* must then
// resolve exactly — that is what makes the refusal helpful rather than a
// dead end.
const sharedSample = sample(sharedTruth, 250, 4242);
const qualifiedClass = runClass(
  "shared-names-qualified",
  sharedSample.map((entry) => ({ ...entry, query: `${entry.query}, ${entry.state.toUpperCase()}` })),
  { minResolution: 0.75, maxConfidentlyWrong: 0 },
);

const bareSharedRefusals = sharedSample.filter((entry) => {
  const result = gazetteer.resolve(entry.query);
  return result.status !== "resolved" || result.matchedOn === "dominant";
}).length;
const bareSharedRate = bareSharedRefusals / (sharedSample.length || 1);

// --- Class 7: ambiguity must be admitted ----------------------------------
// Not scored like the others: here the *only* right answer is a refusal.
const ambiguousQueries = ["Springfield", "Washington", "Franklin", "Clinton", "Madison", "Jackson", "Lincoln"];
const ambiguityResults = ambiguousQueries.map((query) => {
  const result = gazetteer.resolve(query);
  return {
    query,
    status: result.status,
    candidates: result.status === "ambiguous" ? result.candidates.length : 0,
    // Resolving is acceptable only when one place genuinely dominates.
    acceptable: result.status === "ambiguous" || (result.status === "resolved" && result.matchedOn === "dominant"),
  };
});
const ambiguityPassed = ambiguityResults.every((entry) => entry.acceptable);

// --- Class 8: nonsense must be refused ------------------------------------
const nonsenseQueries = ["Zzyzxqqq", "asdfghjkl", "?????", "12345678", "Lorem ipsum dolor", ""];
const nonsenseResults = nonsenseQueries.map((query) => ({
  query,
  status: gazetteer.resolve(query).status,
}));
const nonsensePassed = nonsenseResults.every((entry) => entry.status !== "resolved");

const classes = [
  exactClass,
  noisyClass,
  misspellClass,
  diacriticsClass,
  edgeClass,
  vernacularClass,
  qualifiedClass,
];
const totalConfidentlyWrong = classes.reduce((sum, entry) => sum + entry.confidentlyWrong, 0);
const allClassesPassed = classes.every((entry) => entry.passed);
// A bare shared name must almost always refuse rather than pick a winner.
const bareSharedPassed = bareSharedRate >= 0.95;
const ok =
  allClassesPassed && ambiguityPassed && nonsensePassed && bareSharedPassed && totalConfidentlyWrong === 0;

const report = {
  ok,
  gate: "location-truth",
  index: index.stats(),
  truthSet: { total: truth.length, uniqueNames: uniqueTruth.length, sharedNames: sharedTruth.length },
  classes: classes.map(({ failures, ...rest }) => ({ ...rest, sampleFailures: failures.slice(0, 5) })),
  bareSharedNames: {
    passed: bareSharedPassed,
    refusedOrDominant: bareSharedRefusals,
    of: sharedSample.length,
    rate: Number((bareSharedRate * 100).toFixed(2)),
  },
  ambiguity: { passed: ambiguityPassed, results: ambiguityResults },
  nonsense: { passed: nonsensePassed, results: nonsenseResults },
  totalConfidentlyWrong,
};

console.log(JSON.stringify(report, null, jsonOnly ? 0 : 2));

if (!ok) {
  if (!jsonOnly) {
    console.error("\nLOCATION TRUTH GATE FAILED");
    for (const entry of classes.filter((c) => !c.passed)) {
      console.error(
        `  ${entry.name}: ${entry.correct}/${entry.cases} correct (floor ${entry.minResolution}%), ` +
          `${entry.confidentlyWrong} confidently wrong`,
      );
    }
    if (!ambiguityPassed) console.error("  ambiguity: an ambiguous name was answered without a dominant match");
    if (!nonsensePassed) console.error("  nonsense: a meaningless query was answered with a place");
  }
  process.exit(1);
}
