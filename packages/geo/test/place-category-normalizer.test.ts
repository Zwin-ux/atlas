import { describe, expect, it } from "vitest";
import {
  ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER,
  assertGoogleNearbyFieldMaskAllowed,
  normalizeProviderPlaceCategory,
} from "../src/index.js";
import { MockGeoDataAdapter } from "../src/MockGeoDataAdapter.js";

describe("normalizeProviderPlaceCategory", () => {
  it("maps Google primary types into Atlas categories", () => {
    expect(normalizeProviderPlaceCategory({ primaryType: "restaurant", types: [] })).toBe("food_drink");
    expect(normalizeProviderPlaceCategory({ primaryType: "gym", types: [] })).toBe("fitness");
    expect(normalizeProviderPlaceCategory({ primaryType: "city_hall", types: [] })).toBe("civic");
  });

  it("uses secondary Google types when primary type is absent", () => {
    expect(normalizeProviderPlaceCategory({ types: ["point_of_interest", "park"] })).toBe("park");
  });

  it("falls back to unknown for unsupported provider types", () => {
    expect(normalizeProviderPlaceCategory({ primaryType: "very_specific_new_google_type", types: [] })).toBe("unknown");
  });

  it("returns deterministic normalized mock nearby places", async () => {
    const adapter = new MockGeoDataAdapter();
    const places = await adapter.nearbySearch({
      center: { latitude: 33.9525, longitude: -117.5848 },
      radiusMeters: 3500,
    });

    expect(places.map((place) => place.category)).toEqual(expect.arrayContaining(["service", "shop", "park", "fitness", "civic"]));
  });

  it("keeps Google nearby field masks on a small Atlas allowlist", () => {
    expect(() => assertGoogleNearbyFieldMaskAllowed(ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER)).not.toThrow();
    expect(ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER).not.toContain("*");
    expect(() => assertGoogleNearbyFieldMaskAllowed("places.id,places.rating")).toThrow(/non-Atlas fields/);
    expect(() => assertGoogleNearbyFieldMaskAllowed("*")).toThrow(/wildcard/);
  });
});
