import { describe, expect, it } from "vitest";
import { US_COUNTY_FACTS, US_COUNTY_FACTS_BY_GEOID, US_COUNTY_INDEX } from "../src/world/index.js";

describe("US county facts", () => {
  it("resolves a fact row for every indexed county GEOID", () => {
    expect(US_COUNTY_INDEX).toHaveLength(3222);
    expect(US_COUNTY_FACTS).toHaveLength(3222);

    const indexedGeoids = new Set(US_COUNTY_INDEX.map((county) => county.geoid));
    const factGeoids = new Set(US_COUNTY_FACTS.map(([geoid]) => geoid));

    expect(factGeoids.size).toBe(US_COUNTY_FACTS.length);
    for (const county of US_COUNTY_INDEX) {
      expect(US_COUNTY_FACTS_BY_GEOID.has(county.geoid)).toBe(true);
    }
    for (const [geoid] of US_COUNTY_FACTS) {
      expect(indexedGeoids.has(geoid)).toBe(true);
    }
  });

  it("exposes finite non-negative water fields for every county", () => {
    for (const [geoid, , landAreaSqMi, waterAreaSqMi, waterFraction] of US_COUNTY_FACTS) {
      expect(Number.isFinite(landAreaSqMi), geoid).toBe(true);
      expect(landAreaSqMi, geoid).toBeGreaterThan(0);
      expect(Number.isFinite(waterAreaSqMi), geoid).toBe(true);
      expect(waterAreaSqMi, geoid).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(waterFraction), geoid).toBe(true);
      expect(waterFraction, geoid).toBeGreaterThanOrEqual(0);
      expect(waterFraction, geoid).toBeLessThanOrEqual(1);
    }
  });

  it("keeps staged gazetteer water spot truths honest", () => {
    const kalawao = factForCountySlug("kalawao-hi");
    const loving = factForCountySlug("loving-tx");
    const aleutiansEast = factForCountySlug("aleutians-east-borough-ak");

    expect(kalawao).toEqual(["15005", 81, 12.0, 40.8, 0.773]);
    expect(kalawao[4]).toBeGreaterThan(0.75);

    expect(loving).toEqual(["48301", 48, 668.8, 7.7, 0.011]);
    expect(loving[4]).toBeLessThan(0.02);

    expect(aleutiansEast).toEqual(["02013", 3632, 6986.3, 8029.9, 0.535]);
    expect(aleutiansEast[4]).toBeGreaterThan(0.5);
  });
});

function factForCountySlug(countySlug: string) {
  const county = US_COUNTY_INDEX.find((entry) => entry.countySlug === countySlug);
  if (!county) throw new Error(`Missing indexed county ${countySlug}`);
  const facts = US_COUNTY_FACTS_BY_GEOID.get(county.geoid);
  if (!facts) throw new Error(`Missing facts for ${countySlug}`);
  return facts;
}
