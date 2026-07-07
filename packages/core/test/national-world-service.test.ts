import { describe, expect, it } from "vitest";
import {
  CALIFORNIA_COUNTY_INDEX,
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  FIRST_CALIFORNIA_SECOND_DISTRICT_CANDIDATE,
  US_COUNTY_INDEX,
  createNationalWorldService,
  futureHostedClawdBoundaryDto,
  hiddenDraftEvidenceBoundaryDto,
  normalizeWorldPlaceCategory,
  publicCoverageBoundaryDto,
  riversideDemoVoxelScene,
} from "../src/index.js";

describe("NationalWorldService", () => {
  const service = createNationalWorldService([riversideDemoVoxelScene]);

  it("lists supported US states without renderer data", () => {
    const country = service.listCountry();

    expect(country.type).toBe("usWorldCountry");
    expect(country.country).toMatchObject({ id: "us", scope: "country" });
    expect(country.states).toHaveLength(52);
    expect(country.states.find((state) => state.stateCode === "CA")).toMatchObject({
      label: "California",
      indexedCountyCount: 58,
      supportedCountyCount: 58,
      playableCountyCount: 1,
    });
    expect(country.states.find((state) => state.stateCode === "IL")).toMatchObject({
      label: "Illinois",
      indexedCountyCount: 102,
      supportedCountyCount: 102,
      playableCountyCount: 0,
    });
    expect(country.cache.sourceNotes[0]?.source).toBe("census");
  });

  it("lists the California county coverage index", () => {
    const state = service.listStateCounties("CA");

    expect(state.type).toBe("usWorldStateCounties");
    expect(state.state.stateCode).toBe("CA");
    expect(state.counties).toHaveLength(58);
    expect(state.counties.map((county) => county.countySlug)).toContain("riverside-ca");
    expect(state.counties.find((county) => county.countySlug === "riverside-ca")).toMatchObject({
      geoid: "06065",
      coverageTier: "L2_CURATED_DISTRICT",
      playableDistrictCount: 1,
    });
    expect(state.counties.find((county) => county.countySlug === "los-angeles-ca")).toMatchObject({
      geoid: "06037",
      coverageTier: "L1_COUNTY_SHELL",
      playableDistrictCount: 0,
    });
    expect(state.counties.find((county) => county.countySlug === "orange-ca")).toMatchObject({
      geoid: "06059",
      coverageTier: "L1_COUNTY_SHELL",
      playableDistrictCount: 0,
    });
    expect(state.cache.sourceNotes[0]?.source).toBe("census");
  });

  it("summarizes USA coverage readiness without implying fake playable counties", () => {
    const directory = service.listCoverageDirectory();

    expect(directory.type).toBe("usWorldCoverageDirectory");
    expect(directory.totals).toMatchObject({
      stateCount: 52,
      indexedCountyCount: 3222,
      supportedCountyCount: 3222,
      playableCountyCount: 1,
      shellCountyCount: 3221,
      providerNormalizedCountyCount: 0,
      publicQualityCountyCount: 0,
      indexedUnsupportedCountyCount: 0,
    });
    expect(directory.tiers.find((tier) => tier.coverageTier === "L1_COUNTY_SHELL")).toMatchObject({ countyCount: 3221 });
    expect(directory.tiers.find((tier) => tier.coverageTier === "L2_CURATED_DISTRICT")).toMatchObject({ countyCount: 1 });
    expect(directory.playableCounties.map((county) => county.countySlug)).toEqual(["riverside-ca"]);
    expect(directory.suggestedNextCountySlug).toBe("riverside-ca");
    expect(directory.limitations.join(" ")).toContain("Non-Riverside counties are browse-only shells");
    expect(directory.cache.sourceNotes[0]?.source).toBe("census");
  });

  it("returns county and district world contracts", () => {
    const county = service.getCounty("riverside-ca");
    const district = service.getDistrict("riverside-ca", "eastvale-city-slice");

    expect(county.type).toBe("usWorldCounty");
    expect(county.county).toMatchObject({
      scope: "county",
      stateCode: "CA",
      geoid: "06065",
      supported: true,
      coverageTier: "L2_CURATED_DISTRICT",
    });
    expect(county.districts.map((item) => item.districtSlug)).toContain("eastvale-city-slice");
    expect(district.type).toBe("usWorldDistrict");
    expect(district.district).toMatchObject({
      scope: "district",
      countySlug: "riverside-ca",
      playable: true,
      geoid: "0621230",
      coverageTier: "L2_CURATED_DISTRICT",
    });
    expect(district.places.map((place) => place.label)).toEqual(expect.arrayContaining(["Eastvale Core", "Gym", "Community Park"]));
  });

  it("returns shell counties without pretending they are playable", () => {
    const orange = service.getCounty("orange-ca");

    expect(orange.type).toBe("usWorldCounty");
    expect(orange.county).toMatchObject({
      countySlug: "orange-ca",
      geoid: "06059",
      coverageTier: "L1_COUNTY_SHELL",
      playableDistrictCount: 0,
      placeCount: 0,
    });
    expect(orange.districts).toEqual([
      expect.objectContaining({
        countySlug: "orange-ca",
        districtSlug: "anaheim-candidate",
        geoid: "0602000",
        playable: false,
        coverageTier: "L1_COUNTY_SHELL",
        placeCount: 0,
        readiness: expect.objectContaining({
          status: "candidate_only",
          sourceBasis: "census_identity",
          promotionBlocked: true,
          requiredBeforePlayable: expect.arrayContaining(["curated_district_pack", "place_anchors_with_source_notes"]),
          knownGaps: expect.arrayContaining(["no_curated_places", "no_local_scene"]),
        }),
      }),
    ]);
    expect(orange.cache.sourceNotes[0]?.source).toBe("census");
  });

  it("returns national shell counties without Riverside data bleed", () => {
    const samples = [
      service.getCounty("cook-il"),
      service.getCounty("miami-dade-fl"),
      service.getCounty("maricopa-az"),
    ];

    for (const county of samples) {
      expect(county.type).toBe("usWorldCounty");
      expect(county.county).toMatchObject({
        supported: true,
        coverageTier: "L1_COUNTY_SHELL",
        playableDistrictCount: 0,
        placeCount: 0,
      });
      expect(county.districts).toEqual([]);
      expect(county.cache.sourceNotes[0]?.source).toBe("census");
    }
    expect(samples.map((county) => county.county.countySlug)).toEqual(["cook-il", "miami-dade-fl", "maricopa-az"]);
  });

  it("keeps California candidate districts non-playable until curated", () => {
    const candidates = [
      service.getCounty("orange-ca").districts.find((district) => district.districtSlug === "anaheim-candidate"),
      service.getCounty("san-bernardino-ca").districts.find((district) => district.districtSlug === "ontario-candidate"),
    ];

    expect(candidates).toHaveLength(2);
    for (const candidate of candidates) {
      expect(candidate).toMatchObject({
        playable: false,
        coverageTier: "L1_COUNTY_SHELL",
        placeCount: 0,
        readiness: {
          status: "candidate_only",
          sourceBasis: "census_identity",
          promotionBlocked: true,
        },
      });
      expect(candidate?.readiness?.requiredBeforePlayable).toEqual(
        expect.arrayContaining([
          "curated_district_pack",
          "place_anchors_with_source_notes",
          "bounded_scene_compiler_proof",
          "desktop_mobile_product_loop_screenshots",
          "lumen_visual_acceptance",
          "mira_readiness_acceptance",
          "forge_split_guard",
        ]),
      );
      expect(candidate?.readiness?.knownGaps).toEqual(
        expect.arrayContaining(["no_curated_places", "no_local_scene", "no_provider_normalized_categories", "not_public_quality"]),
      );
    }
    expect(service.listCoverageDirectory().playableCounties.map((county) => county.countySlug)).toEqual(["riverside-ca"]);
  });

  it("allows playable tools only for L2 counties with playable districts", () => {
    const riverside = publicCoverageBoundaryDto(service.getCounty("riverside-ca").county);
    const orange = publicCoverageBoundaryDto(service.getCounty("orange-ca").county);
    const unsupported = publicCoverageBoundaryDto({
      countySlug: "made-up-ca",
      coverageTier: "L0_UNSUPPORTED",
      playableDistrictCount: 0,
      placeCount: 0,
    });

    expect(riverside).toMatchObject({
      dtoKind: "public_coverage",
      countySlug: "riverside-ca",
      coverageTier: "L2_CURATED_DISTRICT",
      playableDistrictCount: 1,
      playableToolsEnabled: true,
    });
    expect(riverside.allowedPlayableTools).toEqual(
      expect.arrayContaining(["selected_place_tray", "sticker_tools", "note_input", "scout_drop", "campaign_preview"]),
    );

    for (const boundary of [orange, unsupported]) {
      expect(boundary.playableToolsEnabled).toBe(false);
      expect(boundary.allowedPlayableTools).toEqual([]);
      expect(boundary.blockedToolReason).toContain("L2_CURATED_DISTRICT");
    }
  });

  it("keeps public coverage, hidden draft evidence, and future Hosted Clawd DTOs separate", () => {
    const publicCoverage = publicCoverageBoundaryDto(service.getCounty("orange-ca").county);
    const hiddenDraft = hiddenDraftEvidenceBoundaryDto({
      countySlug: "orange-ca",
      districtSlug: "anaheim-candidate",
    });
    const hostedClawd = futureHostedClawdBoundaryDto();

    expect(publicCoverage).toMatchObject({
      dtoKind: "public_coverage",
      coverageTier: "L1_COUNTY_SHELL",
      playableToolsEnabled: false,
    });
    expect(hiddenDraft).toEqual({
      dtoKind: "hidden_draft_evidence",
      countySlug: "orange-ca",
      districtSlug: "anaheim-candidate",
      coverageTier: "L1_COUNTY_SHELL",
      playable: false,
      publicRoute: false,
      evidenceOnly: true,
      allowedPlayableTools: [],
    });
    expect(hostedClawd).toMatchObject({
      dtoKind: "future_hosted_clawd",
      implemented: false,
      requiresExplicitApproval: true,
      blockedScopes: expect.arrayContaining(["persistence", "database", "hosted_clawd", "stripe", "xp_evidence"]),
    });
  });

  it("defines the California second-district candidate pack without playable claims", () => {
    expect(CALIFORNIA_DISTRICT_CANDIDATE_PACK.map((candidate) => candidate.priority)).toEqual([1, 2]);
    expect(FIRST_CALIFORNIA_SECOND_DISTRICT_CANDIDATE).toMatchObject({
      countySlug: "orange-ca",
      countyGeoid: "06059",
      districtSlug: "anaheim-candidate",
      districtGeoid: "0602000",
      currentCoverageTier: "L1_COUNTY_SHELL",
      targetCoverageTier: "L2_CURATED_DISTRICT",
      playableNow: false,
      archetype: "dense_suburban_commerce",
    });

    for (const candidate of CALIFORNIA_DISTRICT_CANDIDATE_PACK) {
      const county = service.getCounty(candidate.countySlug);
      const district = county.districts.find((item) => item.districtSlug === candidate.districtSlug);

      expect(county.county).toMatchObject({
        countySlug: candidate.countySlug,
        geoid: candidate.countyGeoid,
        coverageTier: candidate.currentCoverageTier,
        playableDistrictCount: 0,
        placeCount: 0,
      });
      expect(district).toMatchObject({
        districtSlug: candidate.districtSlug,
        geoid: candidate.districtGeoid,
        playable: false,
        coverageTier: candidate.currentCoverageTier,
        placeCount: 0,
      });
      expect(candidate.requiredPlaceCategories).toContain("home_area");
      expect(candidate.requiredBeforePlayable).toEqual(
        expect.arrayContaining([
          "curated_district_pack",
          "place_anchors_with_source_notes",
          "bounded_scene_compiler_proof",
          "desktop_mobile_product_loop_screenshots",
          "lumen_visual_acceptance",
          "mira_readiness_acceptance",
          "forge_split_guard",
        ]),
      );
    }
  });

  it("rejects unknown counties and unavailable districts clearly", () => {
    expect(service.getUnsupportedCounty("missing-county")).toMatchObject({
      type: "usWorldUnsupported",
      countySlug: "missing-county",
      coverageTier: "L0_UNSUPPORTED",
      suggestedNextCountySlug: "riverside-ca",
    });
    expect(() => service.getCounty("missing-county")).toThrow(/Unknown county/);
    expect(() => service.getDistrict("orange-ca", "missing-district")).toThrow(/no playable district scene/);
    expect(() => service.getDistrict("riverside-ca", "missing-district")).toThrow(/Unknown district/);
  });

  it("keeps the checked California fixture complete", () => {
    expect(CALIFORNIA_COUNTY_INDEX).toHaveLength(58);
    expect(new Set(CALIFORNIA_COUNTY_INDEX.map((county) => county.geoid)).size).toBe(58);
    expect(CALIFORNIA_COUNTY_INDEX.every((county) => county.stateCode === "CA")).toBe(true);
    expect(US_COUNTY_INDEX).toHaveLength(3222);
    expect(new Set(US_COUNTY_INDEX.map((county) => county.geoid)).size).toBe(3222);
    expect(new Set(US_COUNTY_INDEX.map((county) => county.stateCode)).size).toBe(52);
    expect(US_COUNTY_INDEX.find((county) => county.countySlug === "riverside-ca")).toMatchObject({
      coverageTier: "L2_CURATED_DISTRICT",
    });
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
      },
      places: [
        {
          atlasLookupId: "lookup-park-1-community-park",
          label: "Community Park",
          category: "park",
          coordinates: { latitude: 33.9485, longitude: -117.5864 },
          address: "Eastvale, CA",
          source: "mock",
          attribution: "Atlas mock data",
          ttlSeconds: 300,
        },
        {
          atlasLookupId: "lookup-unknown-2-unmapped-provider-place",
          label: "Unmapped provider place",
          category: "provider_specific_type",
          source: "mock",
          attribution: "Atlas mock data",
          ttlSeconds: 300,
        },
      ],
    });

    expect(lookup.type).toBe("worldPlaceLookup");
    expect("placeId" in lookup.resolvedLocation).toBe(false);
    expect(lookup.places.map((place) => place.id)).toEqual([
      "lookup-park-1-community-park",
      "lookup-unknown-2-unmapped-provider-place",
    ]);
    expect(lookup.places.map((place) => place.category)).toEqual(["park", "unknown"]);
    expect(lookup.cache).toMatchObject({ key: "lookup:eastvale-ca:3500:mock", ttlSeconds: 300 });
    expect(lookup.cache.sourceNotes[0]).toMatchObject({ source: "mock", attribution: "Atlas mock data" });
    expect(lookup.places[0]?.sourceNotes[0]?.ttlSeconds).toBe(300);
    expect(lookup.providerReadiness).toMatchObject({
      status: "lookup_only",
      sources: ["mock"],
      mode: "mock",
      cache: { key: "lookup:eastvale-ca:3500:mock", ttlSeconds: 300 },
      normalizedCategoryStatus: "contains_unknown_category",
      normalizedCategoryConfidence: "mock_verified",
      coveragePromotion: false,
      sceneEligible: false,
      publicQuality: false,
      sceneGeometry: false,
      rawProviderPayloadExposed: false,
      structuredContentPolicy: "atlas_normalized_only",
      fieldMaskPolicy: {
        mode: "allowlist",
        wildcardAllowed: false,
        allowedFieldCount: 0,
      },
    });
    expect(lookup.providerReadiness.limitations.join(" ")).toContain("does not promote county coverage");
    expect(lookup.providerReadiness.limitations.join(" ")).toContain("Provider identifiers");
  });
});
