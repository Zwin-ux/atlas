import { describe, expect, it } from "vitest";
import { createNationalWorldService, normalizeWorldPlaceCategory, riversideDemoVoxelScene } from "../src/index.js";

describe("NationalWorldService", () => {
  const service = createNationalWorldService([riversideDemoVoxelScene]);

  it("lists supported US states without renderer data", () => {
    const country = service.listCountry();

    expect(country.type).toBe("usWorldCountry");
    expect(country.country).toMatchObject({ id: "us", scope: "country" });
    expect(country.states).toHaveLength(1);
    expect(country.states[0]).toMatchObject({ stateCode: "CA", supportedCountyCount: 1 });
    expect(country.cache.sourceNotes[0]?.source).toBe("curated");
  });

  it("lists supported counties for a state", () => {
    const state = service.listStateCounties("CA");

    expect(state.type).toBe("usWorldStateCounties");
    expect(state.state.stateCode).toBe("CA");
    expect(state.counties.map((county) => county.countySlug)).toContain("riverside-ca");
    expect(state.counties[0]?.playableDistrictCount).toBeGreaterThan(0);
  });

  it("returns county and district world contracts", () => {
    const county = service.getCounty("riverside-ca");
    const district = service.getDistrict("riverside-ca", "eastvale-city-slice");

    expect(county.type).toBe("usWorldCounty");
    expect(county.county).toMatchObject({ scope: "county", stateCode: "CA", supported: true });
    expect(county.districts.map((item) => item.districtSlug)).toContain("eastvale-city-slice");
    expect(district.type).toBe("usWorldDistrict");
    expect(district.district).toMatchObject({ scope: "district", countySlug: "riverside-ca", playable: true });
    expect(district.places.map((place) => place.label)).toEqual(expect.arrayContaining(["Eastvale Core", "Gym", "Community Park"]));
  });

  it("rejects unknown counties and districts clearly", () => {
    expect(() => service.getCounty("missing-county")).toThrow(/Unknown county/);
    expect(() => service.getDistrict("riverside-ca", "missing-district")).toThrow(/Unknown district/);
  });

  it("normalizes curated and unknown place categories safely", () => {
    const district = service.getDistrict("riverside-ca", "eastvale-city-slice");

    expect(district.places.map((place) => place.placeKind)).toEqual(
      expect.arrayContaining(["home_area", "shop", "park", "landmark"]),
    );
    expect(normalizeWorldPlaceCategory("plaza")).toBe("shop");
    expect(normalizeWorldPlaceCategory("google_type_we_do_not_support")).toBe("unknown");
  });

  it("creates provider-safe lookup responses with cache and source notes", () => {
    const lookup = service.lookupPlaces({
      query: "Eastvale, CA",
      radiusMeters: 3500,
      mode: "mock",
      resolvedLocation: {
        id: "mock:eastvale-ca",
        label: "Eastvale, CA",
        coordinates: { latitude: 33.9525, longitude: -117.5848 },
        formattedAddress: "Eastvale, CA, USA",
        placeId: "mock-eastvale-ca",
      },
      places: [
        {
          placeId: "mock-park",
          label: "Community Park",
          category: "park",
          coordinates: { latitude: 33.9485, longitude: -117.5864 },
          address: "Eastvale, CA",
          source: "mock",
          attribution: "Atlas mock data",
          ttlSeconds: 300,
        },
        {
          placeId: "mock-unknown",
          label: "Unmapped provider place",
          category: "provider_specific_type",
          source: "mock",
          attribution: "Atlas mock data",
          ttlSeconds: 300,
        },
      ],
    });

    expect(lookup.type).toBe("worldPlaceLookup");
    expect(lookup.places.map((place) => place.category)).toEqual(["park", "unknown"]);
    expect(lookup.cache).toMatchObject({ key: "lookup:eastvale-ca:3500:mock", ttlSeconds: 300 });
    expect(lookup.cache.sourceNotes[0]).toMatchObject({ source: "mock", attribution: "Atlas mock data" });
    expect(lookup.places[0]?.sourceNotes[0]?.ttlSeconds).toBe(300);
  });
});
