#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const checks = [];
const metrics = {};

function check(condition, message) {
  checks.push({ passed: Boolean(condition), message });
  if (!condition) blockers.push(message);
}

try {
  const corePath = resolve("packages/core/dist/index.js");
  if (!existsSync(corePath)) throw new Error("packages/core/dist/index.js is missing; run pnpm build:core first");
  const core = await import(`file:///${corePath.replaceAll("\\", "/")}`);
  const raw = JSON.parse(readFileSync(resolve("data/census/us-county-town-anchors.json"), "utf8"));
  const index = core.parseCountyTownAnchorIndex(raw);

  check(index.totals.supportedCountyCount === core.US_COUNTY_INDEX.length, "anchor county count matches Atlas county index");
  check(index.totals.coveredCountyCount === 3_222, "all 3,222 supported counties have anchors");
  check(index.method.maximumAnchorsPerCounty === 12, "anchor budget is 12 towns per county");
  check(index.totals.anchorCount === 18_447, "the certified index contains 18,447 anchors");
  check(Object.values(index.counties).every((county) => county.anchors.length > 0), "no supported county has an empty anchor set");
  check(
    Object.values(index.counties).every((county) => county.anchors.every((anchor) => !/balance of/i.test(anchor.label))),
    "anchor labels exclude balance-of pseudo-geographies",
  );

  let maximumSpecChars = 0;
  let maximumSpecCountySlug = null;
  let sourceBasisFailure = null;
  for (const supportedCounty of core.US_COUNTY_INDEX) {
    const anchored = index.counties[supportedCounty.countySlug];
    const generated = core.createDeterministicGeneratedDistrictSpec({
      county: supportedCounty,
      townAnchors: anchored.anchors,
    });
    const specChars = JSON.stringify(generated).length;
    if (specChars > maximumSpecChars) {
      maximumSpecChars = specChars;
      maximumSpecCountySlug = supportedCounty.countySlug;
    }
    if (generated.sourceBasis !== "census_identity_and_town_anchors") sourceBasisFailure = supportedCounty.countySlug;
  }
  metrics.maximumGeneratedSpecChars = maximumSpecChars;
  metrics.maximumGeneratedSpecCountySlug = maximumSpecCountySlug;
  metrics.generatedSpecCharCeiling = 10_000;
  check(sourceBasisFailure === null, "all 3,222 generated specs retain their town anchors");
  check(maximumSpecChars <= metrics.generatedSpecCharCeiling, "every national town-anchor spec stays inside the 10,000-character wire ceiling");

  const samples = {
    "miami-dade-fl": ["Miami", "Homestead"],
    "loving-tx": ["Mentone"],
    "honolulu-hi": ["Urban Honolulu"],
    "kalawao-hi": ["Kalawao"],
    "district-of-columbia-dc": ["Washington"],
  };
  for (const [countySlug, labels] of Object.entries(samples)) {
    const actual = new Set(index.counties[countySlug]?.anchors.map((anchor) => anchor.label) ?? []);
    check(labels.every((label) => actual.has(label)), `${countySlug} retains certified representative anchors`);
  }

  const county = core.US_COUNTY_INDEX.find((candidate) => candidate.countySlug === "miami-dade-fl");
  if (!county) throw new Error("Miami-Dade is missing from US_COUNTY_INDEX");
  const sceneResult = core.createDeterministicGeneratedDistrictScene({
    county,
    townAnchors: index.counties["miami-dade-fl"].anchors,
  });
  const scene = sceneResult.result.scene;
  check(sceneResult.generated.sourceBasis === "census_identity_and_town_anchors", "generated spec declares Census town-anchor source basis");
  check(sceneResult.generated.townAnchorUpdate === core.COUNTY_TOWN_ANCHOR_UPDATE_ID, "generated spec carries the town-anchor update id");
  check(scene.places.some((place) => place.label === "Homestead" && place.id.startsWith("town-anchor-")), "generated preview exposes Homestead as a town anchor");
  check(scene.coverage.playable === false, "generated preview remains explicitly non-playable coverage");

  const question = new core.CountyQuestionService().answer({
    countySlug: "miami-dade-fl",
    question: "Where is Homestead?",
    generatedScene: scene,
    generatedCountyLabel: scene.region.county,
  });
  check(question.supported && question.targetLabel === "Homestead", "county question service locates the real Homestead anchor");
  check(question.sourceNotes[0]?.sourceType === "us_census_tigerweb", "town answer cites the Census/TIGERweb source class");
  check(/generated, not verified local geography/i.test(question.answer), "town answer preserves the generated-layout boundary");
} catch (error) {
  blockers.push(error instanceof Error ? error.message : String(error));
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.78-2-real-town-anchors",
  checkedAt: new Date().toISOString(),
  metrics,
  checks,
  blockers,
};

if (jsonOnly) process.stdout.write(`${JSON.stringify(result)}\n`);
else {
  console.log(result.ok ? "County town-anchor verification passed." : "County town-anchor verification failed.");
  for (const item of checks) console.log(`${item.passed ? "PASS" : "FAIL"} ${item.message}`);
  for (const blocker of blockers) console.error(`BLOCKER ${blocker}`);
}

if (!result.ok) process.exitCode = 1;
