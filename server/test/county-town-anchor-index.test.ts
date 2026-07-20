import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { loadCountyTownAnchorIndex, townAnchorsForCounty } from "../src/countyTownAnchorIndex.js";

test("server loads the national town-anchor index and returns defensive copies", () => {
  const index = loadCountyTownAnchorIndex(resolve("data/census/us-county-town-anchors.json"));
  assert.equal(index.totals.supportedCountyCount, 3_222);
  assert.equal(index.totals.coveredCountyCount, 3_222);
  assert.equal(index.totals.anchorCount, 18_447);
  assert.equal(index.method.maximumAnchorsPerCounty, 12);

  const first = townAnchorsForCounty(index, "miami-dade-fl");
  assert.ok(first.some((anchor) => anchor.label === "Homestead"));
  first[0]!.label = "mutated test value";

  const second = townAnchorsForCounty(index, "miami-dade-fl");
  assert.notEqual(second[0]!.label, "mutated test value");
  assert.deepEqual(townAnchorsForCounty(index, "not-a-county"), []);
});
