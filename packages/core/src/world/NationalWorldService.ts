import type { VoxelScene } from "../voxel/types.js";
import type {
  CountyCoverageDistrictIndexEntry,
  CountyCoverageTier,
  NationalCountyIndexEntry,
  UsCoverageDirectoryResponse,
  UsCountryResponse,
  UsCountySummary,
  UsCountyWorldResponse,
  UsDistrictSummary,
  UsDistrictWorldResponse,
  UsPlaceSummary,
  UsStateCountiesResponse,
  UsStateSummary,
  UsUnsupportedWorldResponse,
  UsWorldIdentity,
  WorldCachePolicy,
  WorldLookupPlaceInput,
  WorldLookupResolvedLocation,
  WorldPlaceCategory,
  WorldPlaceLookupResponse,
  WorldSourceKind,
} from "./types.js";
import { CALIFORNIA_COUNTY_INDEX, californiaCountyIndexSourceNotes } from "./californiaCountyIndex.js";

const USA_ID = "us";
const USA_LABEL = "United States";
const CURATED_TTL_SECONDS = 60 * 60 * 24;

export class NationalWorldService {
  constructor(
    private readonly scenes: VoxelScene[],
    private readonly countyIndex: NationalCountyIndexEntry[] = CALIFORNIA_COUNTY_INDEX,
  ) {}

  listCountry(): UsCountryResponse {
    const states = this.uniqueStates();
    return {
      type: "usWorldCountry",
      country: {
        id: USA_ID,
        scope: "country",
        label: USA_LABEL,
        slug: "united-states",
      },
      states,
      cache: curatedCache("country:us"),
    };
  }

  listStateCounties(stateCode: string): UsStateCountiesResponse {
    const normalizedState = normalizeStateCode(stateCode);
    const state = this.stateSummary(normalizedState);
    const counties = this.countyIndex
      .filter((county) => normalizeStateCode(county.stateCode) === normalizedState)
      .map((county) => this.countySummaryFromIndex(county, state.id));

    return {
      type: "usWorldStateCounties",
      state,
      counties,
      cache: censusCache(`state:${normalizedState}:counties`),
    };
  }

  listCoverageDirectory(): UsCoverageDirectoryResponse {
    const country = {
      id: USA_ID,
      scope: "country" as const,
      label: USA_LABEL,
      slug: "united-states",
    };
    const states = this.uniqueStates();
    const tiers = coverageTierCounts(this.countyIndex);
    const playableCounties = this.countyIndex
      .filter((county) => county.coverageTier !== "L0_UNSUPPORTED" && county.coverageTier !== "L1_COUNTY_SHELL")
      .map((county) => this.countySummaryFromIndex(county, this.stateSummary(normalizeStateCode(county.stateCode)).id));

    return {
      type: "usWorldCoverageDirectory",
      country,
      states,
      totals: {
        stateCount: states.length,
        indexedCountyCount: this.countyIndex.length,
        supportedCountyCount: this.countyIndex.filter((county) => county.coverageTier !== "L0_UNSUPPORTED").length,
        playableCountyCount: playableCounties.length,
        shellCountyCount: countTier(this.countyIndex, "L1_COUNTY_SHELL"),
        providerNormalizedCountyCount: countTier(this.countyIndex, "L3_PROVIDER_NORMALIZED"),
        publicQualityCountyCount: countTier(this.countyIndex, "L4_PUBLIC_QUALITY"),
        indexedUnsupportedCountyCount: countTier(this.countyIndex, "L0_UNSUPPORTED"),
      },
      tiers,
      playableCounties,
      suggestedNextCountySlug: "riverside-ca",
      limitations: [
        "California county identity is indexed from Census gazetteer data.",
        "Only Riverside County has a curated playable district in this Engine Beta slice.",
        "Shell counties are not local playable worlds until a district is curated or provider-normalized.",
      ],
      cache: censusCache("country:us:coverage-directory"),
    };
  }

  getCounty(countySlug: string): UsCountyWorldResponse {
    const indexCounty = this.requireIndexedCounty(countySlug);
    const state = this.stateSummary(normalizeStateCode(indexCounty.stateCode));
    const scene = this.findCountyScene(countySlug);
    const county = this.countySummaryFromIndex(indexCounty, state.id);
    const districts = indexCounty.coverageTier === "L1_COUNTY_SHELL" || !scene
      ? (indexCounty.districts ?? []).map((district) => districtSummaryFromIndex(indexCounty, district, county.id))
      : (scene.world?.districts ?? []).map((district) => districtSummary(scene, district.id, county.id, indexCounty));

    return {
      type: "usWorldCounty",
      county,
      districts,
      cache: worldCache(`county:${county.countySlug}`, indexCounty.coverageTier),
    };
  }

  getDistrict(countySlug: string, districtSlug: string): UsDistrictWorldResponse {
    const indexCounty = this.requireIndexedCounty(countySlug);
    const scene = this.requireCountyScene(countySlug);
    const state = this.stateSummary(normalizeStateCode(scene.county.state));
    const county = this.countySummaryFromIndex(indexCounty, state.id);
    const district = (scene.world?.districts ?? []).find((item) => slugify(item.label) === districtSlug || item.id === districtSlug);

    if (!district) {
      throw new Error(`Unknown district ${districtSlug} for county ${countySlug}.`);
    }

    const summary = districtSummary(scene, district.id, county.id, indexCounty);
    const places = (scene.world?.places ?? [])
      .filter((place) => place.districtId === district.id)
      .map((place): UsPlaceSummary => ({
        id: place.id,
        scope: "place",
        label: place.label,
        slug: slugify(place.label),
        parentId: summary.id,
        stateCode: state.stateCode,
        countySlug: county.countySlug,
        districtSlug: summary.districtSlug,
        placeKind: normalizeWorldPlaceCategory(place.kind),
        activity: place.activity,
      }));

    return {
      type: "usWorldDistrict",
      district: summary,
      places,
      cache: worldCache(`county:${county.countySlug}:district:${summary.districtSlug}`, summary.coverageTier ?? indexCounty.coverageTier),
    };
  }

  getUnsupportedCounty(countySlug: string): UsUnsupportedWorldResponse {
    return {
      type: "usWorldUnsupported",
      countySlug,
      supported: false,
      coverageTier: "L0_UNSUPPORTED",
      message:
        "Atlas does not have an indexed or curated county contract for this slug yet. Use Riverside County for the playable Engine Beta slice.",
      suggestedNextCountySlug: "riverside-ca",
      cache: curatedCache(`county:${countySlug}:unsupported`),
    };
  }

  lookupPlaces(input: {
    query: string;
    radiusMeters: number;
    mode: "mock" | "google";
    resolvedLocation: WorldLookupResolvedLocation;
    places: WorldLookupPlaceInput[];
  }): WorldPlaceLookupResponse {
    const sourceNotes = collectSourceNotes(input.places);
    const cache = {
      key: `lookup:${slugify(input.query)}:${input.radiusMeters}:${input.mode}`,
      ttlSeconds: minTtl(input.places, CURATED_TTL_SECONDS),
      sourceNotes,
    };
    const places = input.places.map((place) => ({
      id: place.placeId,
      label: place.label,
      category: normalizeWorldPlaceCategory(place.category),
      ...(place.coordinates ? { coordinates: place.coordinates } : {}),
      ...(place.address ? { address: place.address } : {}),
      sourceNotes: [
        {
          source: place.source,
          label: `${sourceLabel(place.source)} place lookup`,
          attribution: place.attribution,
          ttlSeconds: place.ttlSeconds,
        },
      ],
    }));

    return {
      type: "worldPlaceLookup",
      query: input.query,
      radiusMeters: input.radiusMeters,
      mode: input.mode,
      resolvedLocation: input.resolvedLocation,
      places,
      cache,
      providerReadiness: providerLookupReadiness(input.mode, places, cache),
    };
  }

  private uniqueStates(): UsStateSummary[] {
    const statesByCode = new Map<string, UsStateSummary>();
    for (const county of this.countyIndex) {
      const stateCode = normalizeStateCode(county.stateCode);
      if (!statesByCode.has(stateCode)) {
        statesByCode.set(stateCode, this.stateSummary(stateCode));
      }
    }
    return [...statesByCode.values()].sort((a, b) => a.stateCode.localeCompare(b.stateCode));
  }

  private stateSummary(stateCode: string): UsStateSummary {
    const counties = this.countyIndex.filter((county) => normalizeStateCode(county.stateCode) === stateCode);
    return {
      id: `us-${stateCode.toLowerCase()}`,
      scope: "state",
      label: stateLabel(stateCode),
      slug: stateCode.toLowerCase(),
      parentId: USA_ID,
      stateCode,
      indexedCountyCount: counties.length,
      supportedCountyCount: counties.length,
      playableCountyCount: counties.filter((county) => county.coverageTier !== "L1_COUNTY_SHELL" && county.coverageTier !== "L0_UNSUPPORTED").length,
    };
  }

  private findCountyScene(countySlug: string): VoxelScene | undefined {
    return this.scenes.find((item) => item.county.slug === countySlug);
  }

  private requireCountyScene(countySlug: string): VoxelScene {
    const scene = this.scenes.find((item) => item.county.slug === countySlug);
    if (!scene) {
      throw new Error(`County ${countySlug} is indexed but has no playable district scene yet.`);
    }
    return scene;
  }

  private requireIndexedCounty(countySlug: string): NationalCountyIndexEntry {
    const county = this.countyIndex.find((item) => item.countySlug === countySlug);
    if (!county) {
      throw new Error(`Unknown county ${countySlug}.`);
    }
    return county;
  }

  private countySummaryFromIndex(county: NationalCountyIndexEntry, parentId: string): UsCountySummary {
    const scene = this.findCountyScene(county.countySlug);
    return {
      id: `us-${normalizeStateCode(county.stateCode).toLowerCase()}-${county.countySlug}`,
      scope: "county",
      label: county.name,
      slug: county.countySlug,
      parentId,
      stateCode: normalizeStateCode(county.stateCode),
      countySlug: county.countySlug,
      geoid: county.geoid,
      supported: county.coverageTier !== "L0_UNSUPPORTED",
      coverageTier: county.coverageTier,
      coverageLabel: coverageLabel(county.coverageTier),
      coverageMessage: coverageMessage(county.coverageTier, county.name),
      playableDistrictCount: (scene?.world?.districts ?? county.districts ?? []).filter((district) => district.playable).length,
      placeCount: scene?.world?.places.length ?? 0,
      ...(county.centroid ? { centroid: county.centroid } : {}),
    };
  }
}

export function createNationalWorldService(scenes: VoxelScene[], countyIndex?: NationalCountyIndexEntry[]): NationalWorldService {
  return new NationalWorldService(scenes, countyIndex);
}

function districtSummary(scene: VoxelScene, districtId: string, parentId: string, indexCounty?: NationalCountyIndexEntry): UsDistrictSummary {
  const district = scene.world?.districts.find((item) => item.id === districtId);
  if (!district) {
    throw new Error(`Unknown district ${districtId} for county ${scene.county.slug}.`);
  }
  const districtSlug = slugify(district.label);
  const indexDistrict = indexCounty?.districts?.find((item) => item.districtSlug === districtSlug || item.label === district.label);

  return {
    id: district.id,
    scope: "district",
    label: district.label,
    slug: slugify(district.label),
    parentId,
    stateCode: normalizeStateCode(scene.county.state),
    countySlug: scene.county.slug,
    districtSlug,
    ...(indexDistrict?.geoid ? { geoid: indexDistrict.geoid } : {}),
    playable: district.playable,
    ...(indexDistrict?.coverageTier ?? indexCounty?.coverageTier
      ? { coverageTier: (indexDistrict?.coverageTier ?? indexCounty?.coverageTier) as CountyCoverageTier }
      : {}),
    placeCount: (scene.world?.places ?? []).filter((place) => place.districtId === district.id).length,
  };
}

function districtSummaryFromIndex(
  county: NationalCountyIndexEntry,
  district: CountyCoverageDistrictIndexEntry,
  parentId: string,
): UsDistrictSummary {
  return {
    id: `${county.countySlug}:${district.districtSlug}`,
    scope: "district",
    label: district.label,
    slug: district.districtSlug,
    parentId,
    stateCode: normalizeStateCode(county.stateCode),
    countySlug: county.countySlug,
    districtSlug: district.districtSlug,
    ...(district.geoid ? { geoid: district.geoid } : {}),
    playable: district.playable,
    coverageTier: district.coverageTier,
    ...(district.readiness ? { readiness: district.readiness } : {}),
    placeCount: 0,
  };
}

export function normalizeWorldPlaceCategory(value: string | undefined): WorldPlaceCategory {
  switch (value) {
    case "home_area":
    case "food_drink":
    case "shop":
    case "service":
    case "park":
    case "school":
    case "civic":
    case "health":
    case "fitness":
    case "entertainment":
    case "transit":
    case "landmark":
      return value;
    case "home":
    case "residential":
      return "home_area";
    case "plaza":
      return "shop";
    default:
      return "unknown";
  }
}

function curatedCache(key: string): WorldCachePolicy {
  return {
    key,
    ttlSeconds: CURATED_TTL_SECONDS,
    sourceNotes: [
      {
        source: "curated",
        label: "Atlas curated Alpha world data",
        attribution: "Atlas curated demo data",
        ttlSeconds: CURATED_TTL_SECONDS,
      },
    ],
  };
}

function censusCache(key: string): WorldCachePolicy {
  return {
    key,
    ttlSeconds: CURATED_TTL_SECONDS,
    sourceNotes: californiaCountyIndexSourceNotes(),
  };
}

function worldCache(key: string, coverageTier: CountyCoverageTier): WorldCachePolicy {
  if (coverageTier === "L1_COUNTY_SHELL") {
    return censusCache(key);
  }
  return {
    key,
    ttlSeconds: CURATED_TTL_SECONDS,
    sourceNotes: [...californiaCountyIndexSourceNotes(), ...curatedCache(key).sourceNotes],
  };
}

function coverageTierCounts(counties: NationalCountyIndexEntry[]) {
  const orderedTiers: CountyCoverageTier[] = [
    "L0_UNSUPPORTED",
    "L1_COUNTY_SHELL",
    "L2_CURATED_DISTRICT",
    "L3_PROVIDER_NORMALIZED",
    "L4_PUBLIC_QUALITY",
  ];
  return orderedTiers.map((coverageTier) => ({
    coverageTier,
    coverageLabel: coverageLabel(coverageTier),
    countyCount: countTier(counties, coverageTier),
  }));
}

function countTier(counties: NationalCountyIndexEntry[], tier: CountyCoverageTier): number {
  return counties.filter((county) => county.coverageTier === tier).length;
}

function coverageLabel(tier: CountyCoverageTier): string {
  switch (tier) {
    case "L0_UNSUPPORTED":
      return "Unsupported";
    case "L1_COUNTY_SHELL":
      return "County shell";
    case "L2_CURATED_DISTRICT":
      return "Curated playable district";
    case "L3_PROVIDER_NORMALIZED":
      return "Provider-normalized county";
    case "L4_PUBLIC_QUALITY":
      return "Public-quality county";
  }
}

function coverageMessage(tier: CountyCoverageTier, countyName: string): string {
  switch (tier) {
    case "L0_UNSUPPORTED":
      return `${countyName} is not indexed in Atlas yet.`;
    case "L1_COUNTY_SHELL":
      return `${countyName} is indexed from Census county identity data, but Atlas has not built a playable local scene for it yet.`;
    case "L2_CURATED_DISTRICT":
      return `${countyName} has at least one curated playable district. Current local claims are limited to that curated slice.`;
    case "L3_PROVIDER_NORMALIZED":
      return `${countyName} has provider-normalized place coverage with source notes and cache limits.`;
    case "L4_PUBLIC_QUALITY":
      return `${countyName} has passed public visual and product-loop QA for supported districts.`;
  }
}

function collectSourceNotes(places: WorldLookupPlaceInput[]) {
  const notesByKey = new Map<string, ReturnType<typeof sourceNote>>();
  for (const place of places) {
    const note = sourceNote(place.source, place.attribution, place.ttlSeconds);
    notesByKey.set(`${note.source}:${note.attribution}:${note.ttlSeconds}`, note);
  }
  if (notesByKey.size === 0) {
    const note = sourceNote("curated", "Atlas curated demo data", CURATED_TTL_SECONDS);
    notesByKey.set(`${note.source}:${note.attribution}:${note.ttlSeconds}`, note);
  }
  return [...notesByKey.values()];
}

function sourceNote(source: WorldSourceKind, attribution: string, ttlSeconds: number) {
  return {
    source,
    label: `${sourceLabel(source)} place lookup`,
    attribution,
    ttlSeconds,
  };
}

function sourceLabel(source: WorldSourceKind): string {
  switch (source) {
    case "google":
      return "Google Maps Platform";
    case "mock":
      return "Atlas mock";
    case "curated":
      return "Atlas curated";
    case "census":
      return "US Census";
    case "osm":
      return "OpenStreetMap";
    case "local-open-data":
      return "Local open data";
  }
}

function providerLookupReadiness(
  mode: "mock" | "google",
  places: WorldPlaceLookupResponse["places"],
  cache: WorldCachePolicy,
): WorldPlaceLookupResponse["providerReadiness"] {
  const sources = [...new Set(cache.sourceNotes.map((note) => note.source))].sort();
  const hasUnknownCategory = places.some((place) => place.category === "unknown");
  return {
    status: "lookup_only",
    sources,
    mode,
    cache: {
      key: cache.key,
      ttlSeconds: cache.ttlSeconds,
    },
    normalizedCategoryStatus: hasUnknownCategory ? "contains_unknown_category" : "bounded_atlas_categories",
    normalizedCategoryConfidence: mode === "google" ? "provider_mapped" : "mock_verified",
    coveragePromotion: false,
    sceneEligible: false,
    publicQuality: false,
    limitations: [
      "Provider lookup is read-only place discovery.",
      "Provider lookup does not promote county coverage readiness.",
      "Provider lookup is not scene compiler input until a separate promotion contract passes.",
    ],
  };
}

function minTtl(places: WorldLookupPlaceInput[], fallback: number): number {
  const ttls = places.map((place) => place.ttlSeconds).filter((ttl) => Number.isFinite(ttl) && ttl > 0);
  return ttls.length > 0 ? Math.min(...ttls) : fallback;
}

function normalizeStateCode(state: string): string {
  const trimmed = state.trim().toUpperCase();
  if (trimmed === "CALIFORNIA") return "CA";
  return trimmed;
}

function stateLabel(stateCode: string): string {
  return stateCode === "CA" ? "California" : stateCode;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
