import { execFileSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { get } from "node:https";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import process from "node:process";

const COUNTY_GAZETTEER_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip";
const PLACE_GAZETTEER_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_06.txt";
const EXPECTED_COUNTY_COUNT = 58;
const EXPECTED_RIVERSIDE_GEOID = "06065";
const EXPECTED_EASTVALE_GEOID = "0621230";
const REQUIRED_CANDIDATE_GATES = [
  "curated_district_pack",
  "place_anchors_with_source_notes",
  "bounded_scene_compiler_proof",
  "desktop_mobile_product_loop_screenshots",
  "lumen_visual_acceptance",
  "mira_readiness_acceptance",
  "forge_split_guard",
];
const REQUIRED_CANDIDATE_GAPS = [
  "no_curated_places",
  "no_local_scene",
  "no_provider_normalized_categories",
  "not_public_quality",
];
const DEFAULT_SOURCE_DIR = join(tmpdir(), "atlas-census-gazetteer-2024");
const COUNTY_INDEX_PATH = "packages/core/src/world/californiaCountyIndex.ts";

const rawArgs = process.argv.slice(2);
const sourceDir = resolve(
  getOptionValue(rawArgs, "--source-dir") ?? process.env.ATLAS_COUNTY_SOURCE_CACHE_DIR ?? DEFAULT_SOURCE_DIR,
);
const offline = rawArgs.includes("--offline");
const jsonOnly = rawArgs.includes("--json-only");

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  if (arg === "--source-dir") {
    index += 1;
    continue;
  }
  if (!["--offline", "--json-only"].includes(arg)) {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const { countySource, placeSource } = await loadSources(sourceDir, offline);
const censusCounties = parseGazetteerTable(await readFile(countySource.path, "utf8"));
const censusPlaces = parseGazetteerTable(await readFile(placeSource.path, "utf8"));
const caCountyRows = censusCounties.filter((row) => row.USPS === "CA");
const countyIndex = parseCountyIndex(await readFile(COUNTY_INDEX_PATH, "utf8"));
const blockers = [];

if (caCountyRows.length !== EXPECTED_COUNTY_COUNT) {
  blockers.push(`Expected ${EXPECTED_COUNTY_COUNT} California county rows in Census source; got ${caCountyRows.length}.`);
}
if (countyIndex.length !== EXPECTED_COUNTY_COUNT) {
  blockers.push(`Expected ${EXPECTED_COUNTY_COUNT} counties in ${COUNTY_INDEX_PATH}; got ${countyIndex.length}.`);
}

const rowsByGeoid = new Map(caCountyRows.map((row) => [row.GEOID, row]));
const indexByGeoid = new Map(countyIndex.map((county) => [county.geoid, county]));

for (const county of countyIndex) {
  const source = rowsByGeoid.get(county.geoid);
  if (!source) {
    blockers.push(`${county.countySlug} has GEOID ${county.geoid}, which is not in the 2024 Census CA county gazetteer.`);
    continue;
  }
  const expectedSlug = slugifyCountyName(source.NAME);
  if (county.stateCode !== "CA") {
    blockers.push(`${county.countySlug} uses state ${county.stateCode}; expected CA.`);
  }
  if (county.name !== source.NAME) {
    blockers.push(`${county.countySlug} name mismatch: index "${county.name}" vs Census "${source.NAME}".`);
  }
  if (county.countySlug !== expectedSlug) {
    blockers.push(`${county.name} slug mismatch: index "${county.countySlug}" vs expected "${expectedSlug}".`);
  }
  assertCoordinate(county, "latitude", Number(source.INTPTLAT), blockers);
  assertCoordinate(county, "longitude", Number(source.INTPTLONG), blockers);
}

for (const source of caCountyRows) {
  if (!indexByGeoid.has(source.GEOID)) {
    blockers.push(`Census CA county ${source.NAME} (${source.GEOID}) is missing from ${COUNTY_INDEX_PATH}.`);
  }
}

const riverside = indexByGeoid.get(EXPECTED_RIVERSIDE_GEOID);
if (!riverside) {
  blockers.push(`Riverside County GEOID ${EXPECTED_RIVERSIDE_GEOID} is missing.`);
} else {
  if (riverside.coverageTier !== "L2_CURATED_DISTRICT") {
    blockers.push(`Riverside County must stay L2_CURATED_DISTRICT; got ${riverside.coverageTier}.`);
  }
  const eastvale = riverside.districts.find((district) => district.districtSlug === "eastvale-city-slice");
  if (!eastvale) {
    blockers.push("Riverside County is missing the Eastvale curated district.");
  } else {
    if (eastvale.geoid !== EXPECTED_EASTVALE_GEOID) {
      blockers.push(`Eastvale district GEOID mismatch: ${eastvale.geoid} vs ${EXPECTED_EASTVALE_GEOID}.`);
    }
    if (!eastvale.playable || eastvale.coverageTier !== "L2_CURATED_DISTRICT") {
      blockers.push("Eastvale district must remain playable L2_CURATED_DISTRICT.");
    }
  }
}

const eastvalePlace = censusPlaces.find((row) => row.GEOID === EXPECTED_EASTVALE_GEOID);
if (!eastvalePlace) {
  blockers.push(`Eastvale place GEOID ${EXPECTED_EASTVALE_GEOID} is missing from the 2024 Census CA place gazetteer.`);
} else if (eastvalePlace.NAME !== "Eastvale city") {
  blockers.push(`Eastvale place name mismatch: expected "Eastvale city"; got "${eastvalePlace.NAME}".`);
}

const districtAnchors = countyIndex.flatMap((county) => county.districts.map((district) => ({ county, district })));
for (const { county, district } of districtAnchors) {
  if (!district.geoid) {
    blockers.push(`${county.countySlug}:${district.districtSlug} is missing a Census place GEOID.`);
    continue;
  }
  const place = censusPlaces.find((row) => row.GEOID === district.geoid);
  if (!place) {
    blockers.push(`${county.countySlug}:${district.districtSlug} GEOID ${district.geoid} is missing from the 2024 Census CA place gazetteer.`);
    continue;
  }
  if (!place.NAME.startsWith(`${district.label} `)) {
    blockers.push(`${county.countySlug}:${district.districtSlug} label mismatch: index "${district.label}" vs Census "${place.NAME}".`);
  }
  if (district.playable && district.coverageTier !== "L2_CURATED_DISTRICT") {
    blockers.push(`${county.countySlug}:${district.districtSlug} is playable but not L2_CURATED_DISTRICT.`);
  }
  if (!district.playable && district.coverageTier !== "L1_COUNTY_SHELL") {
    blockers.push(`${county.countySlug}:${district.districtSlug} is non-playable but not L1_COUNTY_SHELL.`);
  }
  if (!district.playable) {
    assertCandidateReadiness(county, district, blockers);
  }
}

const tierCounts = countTiers(countyIndex);
if (tierCounts.L1_COUNTY_SHELL !== 57 || tierCounts.L2_CURATED_DISTRICT !== 1) {
  blockers.push(`Expected 57 L1 shell counties and 1 L2 county; got ${JSON.stringify(tierCounts)}.`);
}
if ((tierCounts.L3_PROVIDER_NORMALIZED ?? 0) !== 0 || (tierCounts.L4_PUBLIC_QUALITY ?? 0) !== 0) {
  blockers.push("E10 source verification must not claim provider-normalized or public-quality counties.");
}

const summary = {
  ok: blockers.length === 0,
  sourceDir,
  offline,
  sourceDownloaded: countySource.sourceDownloaded || placeSource.sourceDownloaded,
  sources: {
    countyGazetteer: {
      path: countySource.path,
      url: COUNTY_GAZETTEER_URL,
      sourceDownloaded: countySource.sourceDownloaded,
      sourceCached: countySource.sourceCached,
      archivePath: countySource.archivePath,
    },
    placeGazetteer: {
      path: placeSource.path,
      url: PLACE_GAZETTEER_URL,
      sourceDownloaded: placeSource.sourceDownloaded,
      sourceCached: placeSource.sourceCached,
    },
  },
  california: {
    censusCountyRows: caCountyRows.length,
    indexedCountyRows: countyIndex.length,
    tierCounts,
  },
  anchors: {
    riversideGeoid: riverside?.geoid,
    riversideTier: riverside?.coverageTier,
    eastvaleGeoid: riverside?.districts.find((district) => district.districtSlug === "eastvale-city-slice")?.geoid,
    eastvalePlaceName: eastvalePlace?.NAME,
    districtCandidateCount: districtAnchors.filter(({ district }) => !district.playable).length,
    districtAnchorGeoids: districtAnchors.map(({ county, district }) => ({
      countySlug: county.countySlug,
      districtSlug: district.districtSlug,
      geoid: district.geoid,
      playable: district.playable,
    })),
  },
  blockers,
};

console.log(JSON.stringify(summary, null, 2));
if (blockers.length > 0) {
  if (!jsonOnly) {
    console.error("");
    console.error(`County index source verification blocked ${blockers.length} issue(s):`);
    for (const blocker of blockers) {
      console.error(`- ${blocker}`);
    }
  }
  process.exitCode = 1;
} else if (!jsonOnly) {
  console.log("");
  console.log("County index source verification passed.");
}

async function ensureCountyGazetteer(directory, offlineMode) {
  await mkdir(directory, { recursive: true });
  const existing = await findFile(directory, /^2024_Gaz_counties_national\.txt$/u);
  if (existing) {
    return {
      path: existing,
      sourceDownloaded: false,
      sourceCached: true,
    };
  }
  if (offlineMode) {
    throw new Error(
      [
        `Offline source verification requires cached Census county data in ${directory}.`,
        "Expected extracted file: 2024_Gaz_counties_national.txt.",
        "Run `node scripts\\verify-county-index-source.mjs --json-only` once online to populate the temp cache,",
        "or pass `--source-dir <path>` / `ATLAS_COUNTY_SOURCE_CACHE_DIR=<path>` pointing at a prepared cache.",
        "Do not check raw Census downloads into the repo unless Axiom explicitly approves it.",
      ].join(" "),
    );
  }

  const zipPath = join(directory, basename(COUNTY_GAZETTEER_URL));
  await downloadFile(COUNTY_GAZETTEER_URL, zipPath);
  const extractDir = join(directory, "counties");
  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });
  extractZip(zipPath, extractDir);
  const extracted = await findFile(extractDir, /^2024_Gaz_counties_national\.txt$/u);
  if (!extracted) {
    throw new Error(`Downloaded county gazetteer but could not find extracted text file in ${extractDir}.`);
  }
  return {
    path: extracted,
    archivePath: zipPath,
    sourceDownloaded: true,
    sourceCached: false,
  };
}

async function ensurePlaceGazetteer(directory, offlineMode) {
  await mkdir(directory, { recursive: true });
  const placePath = join(directory, "2024_gaz_place_06.txt");
  if (await exists(placePath)) {
    return {
      path: placePath,
      sourceDownloaded: false,
      sourceCached: true,
    };
  }
  if (offlineMode) {
    throw new Error(
      [
        `Offline source verification requires cached Census California place data in ${directory}.`,
        "Expected file: 2024_gaz_place_06.txt.",
        "Run `node scripts\\verify-county-index-source.mjs --json-only` once online to populate the temp cache,",
        "or pass `--source-dir <path>` / `ATLAS_COUNTY_SOURCE_CACHE_DIR=<path>` pointing at a prepared cache.",
        "Do not check raw Census downloads into the repo unless Axiom explicitly approves it.",
      ].join(" "),
    );
  }
  await downloadFile(PLACE_GAZETTEER_URL, placePath);
  return {
    path: placePath,
    sourceDownloaded: true,
    sourceCached: false,
  };
}

async function loadSources(directory, offlineMode) {
  try {
    return {
      countySource: await ensureCountyGazetteer(directory, offlineMode),
      placeSource: await ensurePlaceGazetteer(directory, offlineMode),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failure = {
      ok: false,
      sourceDir: directory,
      offline: offlineMode,
      sourceDownloaded: false,
      blockers: [message],
    };

    console.log(JSON.stringify(failure, null, 2));
    if (!jsonOnly) {
      console.error("");
      console.error("County index source verification could not start:");
      console.error(`- ${message}`);
    }
    process.exit(1);
  }
}

function extractZip(zipPath, extractDir) {
  if (process.platform === "win32") {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "& { param($zipPath, $extractDir) Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force }",
        zipPath,
        extractDir,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return;
  }
  execFileSync("unzip", ["-o", zipPath, "-d", extractDir], {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function downloadFile(url, destination) {
  await new Promise((resolvePromise, reject) => {
    const file = createWriteStream(destination);
    get(url, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        downloadFile(response.headers.location, destination).then(resolvePromise, reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolvePromise);
      });
    }).on("error", (error) => {
      file.close();
      reject(error);
    });
  });
}

async function findFile(directory, pattern) {
  if (!(await exists(directory))) return "";
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFile(path, pattern);
      if (nested) return nested;
      continue;
    }
    if (pattern.test(entry.name)) return path;
  }
  return "";
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function parseGazetteerTable(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/u);
  const headers = headerLine.split("\t").map((header) => header.trim());
  return lines
    .filter(Boolean)
    .map((line) => {
      const columns = line.split("\t");
      return Object.fromEntries(headers.map((header, index) => [header, (columns[index] ?? "").trim()]));
    });
}

function parseCountyIndex(source) {
  const entries = extractTopLevelArrayObjects(source, "CALIFORNIA_COUNTY_INDEX");
  return entries.map((entrySource) => {
    const match =
      /geoid:\s*"(?<geoid>\d+)",\s*stateCode:\s*"(?<stateCode>[^"]+)",\s*name:\s*"(?<name>[^"]+)",\s*countySlug:\s*"(?<countySlug>[^"]+)",\s*coverageTier:\s*"(?<coverageTier>[^"]+)",\s*centroid:\s*\{\s*latitude:\s*(?<latitude>-?\d+(?:\.\d+)?),\s*longitude:\s*(?<longitude>-?\d+(?:\.\d+)?)\s*\}/u.exec(
        entrySource,
      );
    if (!match?.groups) {
      throw new Error(`Could not parse county index entry:\n${entrySource}`);
    }
    const groups = match.groups;
    return {
      geoid: groups.geoid,
      stateCode: groups.stateCode,
      name: groups.name,
      countySlug: groups.countySlug,
      coverageTier: groups.coverageTier,
      centroid: {
        latitude: Number(groups.latitude),
        longitude: Number(groups.longitude),
      },
      districts: parseDistricts(entrySource),
    };
  });
}

function extractTopLevelArrayObjects(source, exportName) {
  const exportIndex = source.indexOf(`export const ${exportName}`);
  if (exportIndex === -1) {
    throw new Error(`Could not find ${exportName}.`);
  }
  const arrayStart = source.indexOf("[", exportIndex);
  const arrayEnd = source.indexOf("\n];", arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error(`Could not find ${exportName} array bounds.`);
  }
  const arraySource = source.slice(arrayStart + 1, arrayEnd);
  const objects = [];
  let depth = 0;
  let start = -1;
  for (let index = 0; index < arraySource.length; index += 1) {
    const char = arraySource[index];
    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(arraySource.slice(start, index + 1));
        start = -1;
      }
    }
  }
  return objects;
}

function parseDistricts(source) {
  const districts = [];
  const districtPattern =
    /geoid:\s*"(?<geoid>\d+)",\s*districtSlug:\s*"(?<districtSlug>[^"]+)",\s*label:\s*"(?<label>[^"]+)",\s*playable:\s*(?<playable>true|false),\s*coverageTier:\s*"(?<coverageTier>[^"]+)"/gu;
  for (const match of source.matchAll(districtPattern)) {
    const districtSource = extractEnclosingObject(source, match.index ?? 0);
    districts.push({
      geoid: match.groups.geoid,
      districtSlug: match.groups.districtSlug,
      label: match.groups.label,
      playable: match.groups.playable === "true",
      coverageTier: match.groups.coverageTier,
      readiness: parseReadiness(districtSource),
    });
  }
  return districts;
}

function extractEnclosingObject(source, index) {
  const start = source.lastIndexOf("{", index);
  if (start === -1) return "";
  let depth = 0;
  for (let cursor = start; cursor < source.length; cursor += 1) {
    const char = source[cursor];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, cursor + 1);
    }
  }
  return source.slice(start);
}

function parseReadiness(source) {
  if (!source.includes("readiness:")) return undefined;
  return {
    status: getStringProperty(source, "status"),
    sourceBasis: getStringProperty(source, "sourceBasis"),
    promotionBlocked: /promotionBlocked:\s*true/u.test(source),
    requiredBeforePlayable: getArrayProperty(source, "requiredBeforePlayable"),
    knownGaps: getArrayProperty(source, "knownGaps"),
  };
}

function getStringProperty(source, propertyName) {
  const pattern = new RegExp(`${propertyName}:\\s*"([^"]+)"`, "u");
  return pattern.exec(source)?.[1] ?? "";
}

function getArrayProperty(source, propertyName) {
  const pattern = new RegExp(`${propertyName}:\\s*\\[([\\s\\S]*?)\\]`, "u");
  const body = pattern.exec(source)?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/gu)].map((match) => match[1]);
}

function assertCandidateReadiness(county, district, blockersList) {
  if (!district.readiness) {
    blockersList.push(`${county.countySlug}:${district.districtSlug} is non-playable but has no readiness metadata.`);
    return;
  }
  if (district.readiness.status !== "candidate_only") {
    blockersList.push(`${county.countySlug}:${district.districtSlug} must stay candidate_only; got ${district.readiness.status}.`);
  }
  if (district.readiness.sourceBasis !== "census_identity") {
    blockersList.push(`${county.countySlug}:${district.districtSlug} must use census_identity source basis.`);
  }
  if (district.readiness.promotionBlocked !== true) {
    blockersList.push(`${county.countySlug}:${district.districtSlug} must have promotionBlocked: true.`);
  }
  for (const gate of REQUIRED_CANDIDATE_GATES) {
    if (!district.readiness.requiredBeforePlayable.includes(gate)) {
      blockersList.push(`${county.countySlug}:${district.districtSlug} is missing required gate ${gate}.`);
    }
  }
  for (const gap of REQUIRED_CANDIDATE_GAPS) {
    if (!district.readiness.knownGaps.includes(gap)) {
      blockersList.push(`${county.countySlug}:${district.districtSlug} is missing known gap ${gap}.`);
    }
  }
}

function assertCoordinate(county, key, expected, blockersList) {
  const actual = county.centroid[key];
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > 0.000001) {
    blockersList.push(`${county.countySlug} ${key} mismatch: index ${actual} vs Census ${expected}.`);
  }
}

function countTiers(counties) {
  return counties.reduce((counts, county) => {
    counts[county.coverageTier] = (counts[county.coverageTier] ?? 0) + 1;
    return counts;
  }, {});
}

function slugifyCountyName(name) {
  return name
    .replace(/\s+County$/u, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "") + "-ca";
}

function getOptionValue(values, name) {
  const index = values.indexOf(name);
  if (index === -1) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}
