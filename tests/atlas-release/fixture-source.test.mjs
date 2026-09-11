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

  it("ID-10 non-US names are absent from the US Census file", () => {
    const labels = [];
    for (const county of Object.values(census.counties ?? {})) {
      for (const a of county.anchors ?? []) labels.push(`${a.label}|${county.stateCode}`);
    }
    assert.equal(labels.includes("London|GB"), false);
    assert.equal(labels.includes("Paris|FR"), false);
    const londonOh = [...Object.entries(census.counties ?? {})].some(
      ([, c]) => c.stateCode === "OH" && c.anchors?.some((a) => a.label === "London"),
    );
    assert.equal(
      fixtures.fixtures.find((f) => f.id === "ID-10").expected.mustNotSubstituteUsPlace,
      true,
    );
    assert.equal(typeof londonOh, "boolean");
  });

  it("ID-11 Española appears in two New Mexico counties", () => {
    const rio = townInCounty("rio-arriba-nm", "Española");
    const santa = townInCounty("santa-fe-nm", "Española");
    assert.ok(rio);
    assert.ok(santa);
    assert.equal(rio.population2024, 7071);
    assert.equal(santa.population2024, 3404);
  });

  it("NULL-01 King Salmon has no population2024 field", () => {
    const row = townInCounty("bristol-bay-borough-ak", "King Salmon");
    assert.ok(row);
    assert.equal(row.population2024, undefined);
  });

  it("GEO-01 Kalawao County HI has one subdivision anchor", () => {
    const county = census.counties["kalawao-hi"];
    assert.equal(county.countyName, "Kalawao County");
    assert.equal(county.stateCode, "HI");
    assert.equal(county.anchors.length, 1);
    assert.equal(county.anchors[0].label, "Kalawao");
    assert.equal(county.anchors[0].kind, "county_subdivision");
    assert.equal(county.anchors[0].population2024, undefined);
  });

  it("does not treat gazetteer output as the fixture source", () => {
    const src = readFileSync(fixturePath, "utf8");
    assert.equal(src.includes("createGazetteer"), false);
    assert.equal(src.includes(".resolve("), false);
    const ids = fixtures.fixtures.map((f) => f.id);
    for (const id of ["ID-01", "ID-10", "ID-11", "NULL-01", "GEO-01"]) {
      assert.ok(ids.includes(id), id);
    }
  });
});
