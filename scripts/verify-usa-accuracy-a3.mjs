#!/usr/bin/env node
/**
 * USA Accuracy A3 — full 50-county challenge gate + A2 tier contract.
 *
 * Run: node scripts/verify-usa-accuracy-a3.mjs
 * Exit 0 = green.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createAtlasPlateService } from "../server/dist/atlasPlates.js";
import { loadAtlasIndex } from "../server/dist/atlasIndex.js";
import { loadCountyTownAnchorIndex, townAnchorsForCounty } from "../server/dist/countyTownAnchorIndex.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "artifacts", "usa-accuracy", "challenge-50");
const ANCHOR_PATH = join(ROOT, "data", "census", "us-county-town-anchors.json");
const GEO_PACKS = join(ROOT, "data", "geo-packs");
const PLATE_DIR = join(ROOT, "artifacts", "atlas-plates");

/** Full challenge-50 from docs/USA_ACCURACY_PROGRAM.md §8 */
const CHALLENGE = [
  // Group 1 — mega metros
  "los-angeles-ca",
  "cook-il",
  "harris-tx",
  "maricopa-az",
  "king-wa",
  "miami-dade-fl",
  "new-york-ny",
  "philadelphia-pa",
  "fulton-ga",
  "denver-co",
  // Group 2 — coastal / island / water
  "san-francisco-ca",
  "honolulu-hi",
  "kalawao-hi",
  "orleans-parish-la",
  "suffolk-ma",
  "monroe-fl",
  "charleston-sc",
  "mobile-al",
  "san-juan-pr",
  "district-of-columbia-dc",
  // Group 3 — mountain / rural / frontier
  "loving-tx",
  "summit-co",
  "teton-wy",
  "apache-az",
  "coconino-az",
  "inyo-ca",
  "north-slope-borough-ak",
  "yukon-koyukuk-census-area-ak",
  "essex-ny",
  "garfield-ut",
  // Group 4 — heartland / mid-size
  "sedgwick-ks",
  "linn-ia",
  "benton-ar",
  "adams-co",
  "davidson-tn",
  "travis-tx",
  "multnomah-or",
  "hennepin-mn",
  "mecklenburg-nc",
  "milwaukee-wi",
  // Group 5 — edge cases
  "riverside-ca",
  "orange-ca",
  "broward-fl",
  "queens-ny",
  "kings-ny",
  "santa-clara-ca",
  "clark-nv",
  "fairbanks-north-star-borough-ak",
  "maui-hi",
  "st-louis-city-mo",
];

// Slug aliases if the repo uses a different key for independent cities / PR / AK.
const SLUG_ALIASES = {
  "st-louis-city-mo": ["st-louis-city-mo", "st-louis-mo", "saint-louis-city-mo"],
  "san-juan-pr": ["san-juan-pr", "san-juan-municipio-pr"],
  "north-slope-ak": ["north-slope-borough-ak", "north-slope-ak"],
  "yukon-koyukuk-ak": ["yukon-koyukuk-census-area-ak", "yukon-koyukuk-ak"],
  "fairbanks-north-star-ak": ["fairbanks-north-star-borough-ak", "fairbanks-north-star-ak"],
};

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`ok  ${message}`);
}

function resolveSlug(slug, identityFor) {
  if (identityFor(slug)) return slug;
  for (const alt of SLUG_ALIASES[slug] ?? []) {
    if (identityFor(alt)) return alt;
  }
  return slug;
}

if (!existsSync(join(PLATE_DIR, "nation.json"))) {
  fail(`Nation plate missing. Run: pnpm build:atlas-plates`);
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
  packet: "A3",
  counties: [],
  blockers: [],
  tierChecks: [],
};

let passed = 0;

for (const requested of CHALLENGE) {
  const slug = resolveSlug(requested, (s) => index.identityFor(s));
  const row = {
    requested,
    slug,
    open: false,
    rings: 0,
    water: 0,
    towns: 0,
    hasSeat: false,
    seatName: null,
    notes: [],
  };

  const result = plates.county(slug);
  if (!result.ok) {
    row.notes.push(result.reason ?? "missing");
    report.blockers.push(`open:${requested}`);
    fail(`${requested} (${slug}): ${result.reason}`);
    report.counties.push(row);
    continue;
  }

  const plate = JSON.parse(result.body);
  row.open = true;
  row.rings = Array.isArray(plate.rings) ? plate.rings.length : 0;
  row.water = Array.isArray(plate.water) ? plate.water.length : 0;
  row.towns = Array.isArray(plate.anchors) ? plate.anchors.length : 0;
  row.name = plate.name;

  if (row.rings < 1) {
    report.blockers.push(`rings:${requested}`);
    fail(`${slug}: no rings`);
  }

  if (row.towns < 1 && slug !== "kalawao-hi") {
    report.blockers.push(`towns:${requested}`);
    fail(`${slug}: no town anchors`);
  }

  // A2 contract: when anchors exist, exactly one seat and it leads the list.
  if (row.towns >= 1) {
    const seat = plate.anchors.find((a) => a.tier === "seat") ?? plate.anchors[0];
    row.hasSeat = seat?.tier === "seat";
    row.seatName = seat?.name ?? null;
    if (plate.anchors[0]?.tier !== "seat") {
      report.blockers.push(`seat-order:${requested}`);
      fail(`${slug}: seat is not first anchor`);
    } else if (!row.hasSeat) {
      report.blockers.push(`seat-missing:${requested}`);
      fail(`${slug}: no seat tier`);
    } else {
      const primary = plate.anchors.filter((a) => a.tier === "primary").length;
      const secondary = plate.anchors.filter((a) => a.tier === "secondary").length;
      report.tierChecks.push({
        slug,
        seat: seat.name,
        seatSource: seat.seatSource,
        primary,
        secondary,
      });
    }
  }

  if (!report.blockers.some((b) => b.endsWith(`:${requested}`))) {
    passed += 1;
    ok(
      `${slug}: rings=${row.rings} water=${row.water} towns=${row.towns} seat=${row.seatName ?? "—"}`,
    );
  }
  report.counties.push(row);
}

// Spot-check name-match seats on known counties.
for (const { slug, expectSeat } of [
  { slug: "riverside-ca", expectSeat: "Riverside" },
  { slug: "miami-dade-fl", expectSeat: "Miami" },
  { slug: "cook-il", expectSeat: "Chicago" },
]) {
  const result = plates.county(slug);
  if (!result.ok) continue;
  const plate = JSON.parse(result.body);
  const seat = plate.anchors?.[0];
  if (seat?.name !== expectSeat || seat?.tier !== "seat") {
    fail(`tier spot-check ${slug}: expected seat ${expectSeat}, got ${seat?.name}/${seat?.tier}`);
    report.blockers.push(`tier-spot:${slug}`);
  } else {
    ok(`tier spot-check ${slug} → ${expectSeat}`);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

const md = [
  "# USA Accuracy — Challenge-50 gate (A3)",
  "",
  `Generated: ${report.generatedAt}`,
  `Passed: ${passed} / ${CHALLENGE.length}`,
  `Blockers: ${report.blockers.length === 0 ? "none" : report.blockers.join(", ")}`,
  "",
  "## Results",
  "",
  "| # | Slug | Open | Rings | Water | Towns | Seat |",
  "|---|------|:----:|------:|------:|------:|------|",
  ...report.counties.map(
    (c, i) =>
      `| ${i + 1} | ${c.slug}${c.requested !== c.slug ? ` (req ${c.requested})` : ""} | ${c.open ? "yes" : "no"} | ${c.rings} | ${c.water} | ${c.towns} | ${c.seatName ?? "—"} |`,
  ),
  "",
  "## Summary",
  "",
  `- Passed: ${passed} / ${CHALLENGE.length}`,
  `- A2 seat tier present on open counties with towns`,
  `- Blockers: ${report.blockers.length === 0 ? "none" : report.blockers.join(", ")}`,
  "",
].join("\n");

writeFileSync(join(OUT_DIR, "REPORT.md"), md);

if (report.blockers.length === 0 && passed === CHALLENGE.length) {
  console.log(`\nA3 GREEN — ${passed}/${CHALLENGE.length} — ${join(OUT_DIR, "REPORT.md")}`);
  process.exit(0);
}

console.error(`\nA3 RED — passed ${passed}/${CHALLENGE.length}, blockers ${report.blockers.length}`);
process.exit(1);
