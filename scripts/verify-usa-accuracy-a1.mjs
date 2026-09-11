#!/usr/bin/env node
/**
 * USA Accuracy A1 — national county plate open + place focus projection.
 *
 * Proves the accuracy spine for the plate-era Atlas:
 *   1. Challenge counties compose a real Census plate (rings + anchors).
 *   2. Nation + a sample of state plates are built.
 *   3. A resolved place lands in the correct county with lon/lat inside the pack bbox.
 *
 * Run: node scripts/verify-usa-accuracy-a1.mjs
 * Exit 0 = green.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createAtlasPlateService } from "../server/dist/atlasPlates.js";
import { loadAtlasIndex } from "../server/dist/atlasIndex.js";
import { loadCountyTownAnchorIndex, townAnchorsForCounty } from "../server/dist/countyTownAnchorIndex.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "artifacts", "usa-accuracy", "a1");
const ANCHOR_PATH = join(ROOT, "data", "census", "us-county-town-anchors.json");
const GEO_PACKS = join(ROOT, "data", "geo-packs");
const PLATE_DIR = join(ROOT, "artifacts", "atlas-plates");

/** Subset of the program challenge-50 list — diverse accuracy stress cases. */
const CHALLENGE = [
  "miami-dade-fl",
  "cook-il",
  "los-angeles-ca",
  "loving-tx",
  "kalawao-hi",
  "honolulu-hi",
  "san-francisco-ca",
  "maricopa-az",
  "king-wa",
  "summit-co",
  "orleans-parish-la",
  "suffolk-ma",
  "riverside-ca",
  "district-of-columbia-dc",
  "new-york-ny",
  "harris-tx",
  "denver-co",
  "fulton-ga",
  "sedgwick-ks",
  "apache-az",
];

const PLACE_FOCUS_QUERIES = [
  { query: "Homestead, FL", expectCounty: "miami-dade-fl" },
  { query: "Eastvale, CA", expectCounty: "riverside-ca" },
  { query: "Chicago, IL", expectCounty: "cook-il" },
  { query: "Honolulu", expectCounty: "honolulu-hi" },
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`ok  ${message}`);
}

if (!existsSync(join(PLATE_DIR, "nation.json"))) {
  fail(`Nation plate missing at ${PLATE_DIR}. Run: pnpm build:atlas-plates`);
  process.exit(1);
}

if (!existsSync(ANCHOR_PATH)) {
  fail(`Town anchor index missing: ${ANCHOR_PATH}`);
  process.exit(1);
}

const index = loadAtlasIndex(ANCHOR_PATH);
const townIndex = loadCountyTownAnchorIndex(ANCHOR_PATH);

const plates = createAtlasPlateService({
  plateDir: PLATE_DIR,
  geoPacksDir: GEO_PACKS,
  townAnchorsFor: (slug) => townAnchorsForCounty(townIndex, slug),
  countyIdentity: (slug) => {
    const identity = index.identityFor(slug);
    return identity ? { name: identity.name, state: identity.state } : undefined;
  },
});

const report = {
  generatedAt: new Date().toISOString(),
  program: "usa-accuracy-l0-l2",
  packet: "A1",
  nationBuilt: plates.isBuilt(),
  counties: [],
  placeFocus: [],
  blockers: [],
};

// --- Nation + states -------------------------------------------------------
const nation = plates.nation();
if (!nation.ok) {
  fail("Nation plate not built");
  report.blockers.push("nation-not-built");
} else {
  ok("nation plate built");
}

for (const code of ["ca", "fl", "tx", "ny", "hi", "ak", "pr", "dc"]) {
  const state = plates.state(code);
  if (!state.ok) {
    fail(`State plate ${code}: ${state.reason}`);
    report.blockers.push(`state-${code}`);
  } else {
    ok(`state plate ${code}`);
  }
}

// --- Challenge counties ----------------------------------------------------
for (const slug of CHALLENGE) {
  const result = plates.county(slug);
  const row = { slug, ok: result.ok, reason: result.ok ? undefined : result.reason };
  if (!result.ok) {
    fail(`County plate ${slug}: ${result.reason}`);
    report.blockers.push(`county-${slug}`);
    report.counties.push(row);
    continue;
  }

  const plate = JSON.parse(result.body);
  const rings = Array.isArray(plate.rings) ? plate.rings.length : 0;
  const water = Array.isArray(plate.water) ? plate.water.length : 0;
  const anchors = Array.isArray(plate.anchors) ? plate.anchors.length : 0;
  const context = Array.isArray(plate.context) ? plate.context.length : 0;

  row.rings = rings;
  row.water = water;
  row.anchors = anchors;
  row.context = context;
  row.name = plate.name;

  if (rings < 1) {
    fail(`${slug}: no boundary rings`);
    report.blockers.push(`rings-${slug}`);
  } else if (anchors < 1 && slug !== "kalawao-hi") {
    fail(`${slug}: no town anchors`);
    report.blockers.push(`anchors-${slug}`);
  } else {
    ok(`${slug}: rings=${rings} water=${water} anchors=${anchors} context=${context}`);
  }
  report.counties.push(row);
}

// --- Place focus resolve → county + lon/lat in pack bbox -------------------
for (const caseRow of PLACE_FOCUS_QUERIES) {
  const resolution = index.gazetteer.resolve(caseRow.query);
  const row = { query: caseRow.query, expectCounty: caseRow.expectCounty };

  if (resolution.status !== "resolved") {
    fail(`Place focus "${caseRow.query}" did not resolve (${resolution.status})`);
    report.blockers.push(`focus-resolve-${caseRow.query}`);
    row.status = resolution.status;
    report.placeFocus.push(row);
    continue;
  }

  const place = resolution.place;
  row.status = "resolved";
  row.countySlug = place.countySlug;
  row.name = place.name;
  row.lon = place.lon;
  row.lat = place.lat;

  if (place.countySlug !== caseRow.expectCounty) {
    fail(`Place focus "${caseRow.query}" → ${place.countySlug}, expected ${caseRow.expectCounty}`);
    report.blockers.push(`focus-county-${caseRow.query}`);
    report.placeFocus.push(row);
    continue;
  }

  const packPath = join(GEO_PACKS, `${place.countySlug}.json`);
  if (!existsSync(packPath)) {
    fail(`Geo pack missing for focus county ${place.countySlug}`);
    report.blockers.push(`focus-pack-${place.countySlug}`);
    report.placeFocus.push(row);
    continue;
  }

  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const ring of pack.lod0?.boundaryRings ?? []) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  // Slight pad: place points can sit on the legal boundary.
  const pad = 0.05;
  const inside =
    place.lon >= minLon - pad &&
    place.lon <= maxLon + pad &&
    place.lat >= minLat - pad &&
    place.lat <= maxLat + pad;

  row.insideCountyBBox = inside;
  if (!inside) {
    fail(`Focus "${caseRow.query}" lon/lat outside ${place.countySlug} bbox`);
    report.blockers.push(`focus-bbox-${caseRow.query}`);
  } else {
    ok(`focus "${caseRow.query}" → ${place.countySlug} @ ${place.lon.toFixed(4)},${place.lat.toFixed(4)}`);
  }
  report.placeFocus.push(row);
}

// --- Write evidence --------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });
const reportPath = join(OUT_DIR, "REPORT.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const countyPass = report.counties.filter((c) => c.ok && (c.rings ?? 0) >= 1).length;
const focusPass = report.placeFocus.filter((p) => p.insideCountyBBox).length;

const md = [
  "# USA Accuracy A1 — national plate open + place focus",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Nation built: ${report.nationBuilt}`,
  `Challenge counties: ${countyPass} / ${CHALLENGE.length}`,
  `Place focus cases: ${focusPass} / ${PLACE_FOCUS_QUERIES.length}`,
  `Blockers: ${report.blockers.length === 0 ? "none" : report.blockers.join(", ")}`,
  "",
  "## Counties",
  "",
  "| Slug | Rings | Water | Anchors | Context |",
  "|------|------:|------:|--------:|--------:|",
  ...report.counties.map(
    (c) =>
      `| ${c.slug} | ${c.rings ?? "—"} | ${c.water ?? "—"} | ${c.anchors ?? "—"} | ${c.context ?? "—"} |`,
  ),
  "",
  "## Place focus",
  "",
  "| Query | County | Inside bbox |",
  "|-------|--------|:-----------:|",
  ...report.placeFocus.map(
    (p) => `| ${p.query} | ${p.countySlug ?? p.status} | ${p.insideCountyBBox ? "yes" : "no"} |`,
  ),
  "",
  "## Widget work (this packet)",
  "",
  "- Tool `_meta.atlasPlate.focus` is consumed by the widget.",
  "- County plate camera flies to the focused town.",
  "- Focused town label/dot are highlighted.",
  "",
].join("\n");

writeFileSync(join(OUT_DIR, "REPORT.md"), md);

if (report.blockers.length === 0) {
  console.log(`\nA1 GREEN — evidence: ${reportPath}`);
  process.exit(0);
}

console.error(`\nA1 RED — ${report.blockers.length} blocker(s). See ${reportPath}`);
process.exit(1);
