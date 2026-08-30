import assert from "node:assert/strict";
import test from "node:test";

import { createGazetteer, type GazetteerPlace } from "../src/gazetteer.js";
import type { AtlasIndex } from "../src/atlasIndex.js";
import { ATLAS_PLACE_CANDIDATE_MAX, createAtlasPlaceSearch, validateAtlasPlaceQuery } from "../src/atlasPlaceSearch.js";

const places: GazetteerPlace[] = [
  { name: "Springfield", countySlug: "sangamon-il", countyName: "Sangamon County", state: "il", lon: 0, lat: 0, population: 114000, kind: "place" },
  { name: "Springfield", countySlug: "greene-mo", countyName: "Greene County", state: "mo", lon: 0, lat: 0, population: 170000, kind: "place" },
  { name: "Riverside", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", lon: 0, lat: 0, population: 314000, kind: "place" },
  { name: "Riverside County", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", lon: 0, lat: 0, population: 2400000, kind: "county" },
];

const index: AtlasIndex = {
  gazetteer: createGazetteer({ places }),
  anchorsFor: () => [],
  identityFor: () => undefined,
  stats: () => ({ counties: 2, places: 3 }),
};

test("search returns bounded public candidates without coordinates", () => {
  const result = createAtlasPlaceSearch(index).search("Riverside", 99);
  assert.ok(result.length <= ATLAS_PLACE_CANDIDATE_MAX);
  assert.equal(result[0]?.countySlug, "riverside-ca");
  assert.equal("lon" in result[0]!, false);
  assert.equal("population" in result[0]!, false);
});

test("resolution preserves Springfield ambiguity", () => {
  const result = createAtlasPlaceSearch(index).resolve("Springfield");
  assert.equal(result.status, "ambiguous");
  if (result.status === "ambiguous") assert.equal(result.candidates.length, 2);
});

test("resolution honestly rejects an unknown query", () => {
  const result = createAtlasPlaceSearch(index).resolve("Atlantis-by-the-Pacific");
  assert.equal(result.status, "unresolved");
});

test("query validation trims input and rejects empty or oversized values", () => {
  assert.equal(validateAtlasPlaceQuery("  Riverside, CA  "), "Riverside, CA");
  assert.equal(validateAtlasPlaceQuery("   "), undefined);
  assert.equal(validateAtlasPlaceQuery("x".repeat(121)), undefined);
});
