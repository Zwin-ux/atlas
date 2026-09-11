/**
 * AT-004: fixture integrity against Census JSON.
 * Does not import the gazetteer. Expected identities must match the file.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(here, "fixtures/identities.json");
const censusPath = resolve(here, "../../data/census/us-county-town-anchors.json");

const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));
const census = JSON.parse(readFileSync(censusPath, "utf8"));

function townInCounty(slug, label) {
  const county = census.counties?.[slug];
  return county?.anchors?.find((a) => a.label === label) ?? null;
}

describe("release fixtures match Census file fields", () => {
  it("uses the 2024 source year recorded in the JSON", () => {
    assert.equal(census.sourceYear, 2024);
  });

  it("ID-01 Eastvale is a Riverside County CA place in the file", () => {
    const row = townInCounty("riverside-ca", "Eastvale");
    assert.ok(row);
    assert.equal(census.counties["riverside-ca"].stateCode, "CA");
    assert.equal(census.counties["riverside-ca"].countyName, "Riverside County");
    assert.equal(row.population2024, 70751);
  });

  it("ID-05 Springfield exists in at least two counties", () => {
    const hits = [];
    for (const [slug, county] of Object.entries(census.counties ?? {})) {
      if (county.anchors?.some((a) => a.label === "Springfield")) hits.push(slug);
    }
    assert.ok(hits.length >= 2);
    assert.ok(hits.includes("sangamon-il"));
    assert.ok(hits.includes("hampden-ma"));
  });

  it("ID-07 Cañon City is in Fremont County CO", () => {
    const row = townInCounty("fremont-co", "Cañon City");
    assert.ok(row);
    assert.equal(census.counties["fremont-co"].stateCode, "CO");
  });

  it("ID-08 Kane the village is in Greene County, not Kane County", () => {
    const village = townInCounty("greene-il", "Kane");
    assert.ok(village);
    assert.equal(census.counties["kane-il"].countyName, "Kane County");
    assert.equal(townInCounty("kane-il", "Kane"), null);
  });

  it("does not treat gazetteer output as the fixture source", () => {
    const src = readFileSync(fixturePath, "utf8");
    assert.equal(src.includes("createGazetteer"), false);
    assert.equal(src.includes(".resolve("), false);
    assert.ok(fixtures.fixtures.map((f) => f.id).includes("ID-01"));
  });
});
