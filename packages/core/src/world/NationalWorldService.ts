import type { VoxelScene } from "../voxel/types.js";
import type {
  UsCountryResponse,
  UsCountySummary,
  UsCountyWorldResponse,
  UsDistrictSummary,
  UsDistrictWorldResponse,
  UsPlaceSummary,
  UsStateCountiesResponse,
  UsStateSummary,
  UsWorldIdentity,
  WorldCachePolicy,
  WorldLookupPlaceInput,
  WorldLookupResolvedLocation,
  WorldPlaceCategory,
  WorldPlaceLookupResponse,
  WorldSourceKind,
} from "./types.js";

const USA_ID = "us";
const USA_LABEL = "United States";
const CURATED_TTL_SECONDS = 60 * 60 * 24;

export class NationalWorldService {
  constructor(private readonly scenes: VoxelScene[]) {}

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
    const counties = this.scenes
      .filter((scene) => normalizeStateCode(scene.county.state) === normalizedState)
      .map((scene) => countySummary(scene, state.id));

    return {
      type: "usWorldStateCounties",
      state,
      counties,
      cache: curatedCache(`state:${normalizedState}:counties`),
    };
  }

  getCounty(countySlug: string): UsCountyWorldResponse {
    const scene = this.requireCounty(countySlug);
    const state = this.stateSummary(normalizeStateCode(scene.county.state));
    const county = countySummary(scene, state.id);
    const districts = (scene.world?.districts ?? []).map((district) => districtSummary(scene, district.id, county.id));

    return {
      type: "usWorldCounty",
      county,
      districts,
      cache: curatedCache(`county:${county.countySlug}`),
    };
  }

  getDistrict(countySlug: string, districtSlug: string): UsDistrictWorldResponse {
    const scene = this.requireCounty(countySlug);
    const state = this.stateSummary(normalizeStateCode(scene.county.state));
    const county = countySummary(scene, state.id);
    const district = (scene.world?.districts ?? []).find((item) => slugify(item.label) === districtSlug || item.id === districtSlug);

    if (!district) {
      throw new Error(`Unknown district ${districtSlug} for county ${countySlug}.`);
    }

    const summary = districtSummary(scene, district.id, county.id);
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
      cache: curatedCache(`county:${county.countySlug}:district:${summary.districtSlug}`),
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
    return {
      type: "worldPlaceLookup",
      query: input.query,
      radiusMeters: input.radiusMeters,
      mode: input.mode,
      resolvedLocation: input.resolvedLocation,
      places: input.places.map((place) => ({
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
      })),
      cache: {
        key: `lookup:${slugify(input.query)}:${input.radiusMeters}:${input.mode}`,
        ttlSeconds: minTtl(input.places, CURATED_TTL_SECONDS),
        sourceNotes,
      },
    };
  }

  private uniqueStates(): UsStateSummary[] {
    const statesByCode = new Map<string, UsStateSummary>();
    for (const scene of this.scenes) {
      const stateCode = normalizeStateCode(scene.county.state);
      if (!statesByCode.has(stateCode)) {
        statesByCode.set(stateCode, this.stateSummary(stateCode));
      }
    }
    return [...statesByCode.values()].sort((a, b) => a.stateCode.localeCompare(b.stateCode));
  }

  private stateSummary(stateCode: string): UsStateSummary {
    const counties = this.scenes.filter((scene) => normalizeStateCode(scene.county.state) === stateCode);
    return {
      id: `us-${stateCode.toLowerCase()}`,
      scope: "state",
      label: stateLabel(stateCode),
      slug: stateCode.toLowerCase(),
      parentId: USA_ID,
      stateCode,
      supportedCountyCount: counties.length,
    };
  }

  private requireCounty(countySlug: string): VoxelScene {
    const scene = this.scenes.find((item) => item.county.slug === countySlug);
    if (!scene) {
      throw new Error(`Unknown county ${countySlug}.`);
    }
    return scene;
  }
}

export function createNationalWorldService(scenes: VoxelScene[]): NationalWorldService {
  return new NationalWorldService(scenes);
}

function countySummary(scene: VoxelScene, parentId: string): UsCountySummary {
  return {
    id: `us-${normalizeStateCode(scene.county.state).toLowerCase()}-${scene.county.slug}`,
    scope: "county",
    label: scene.county.name,
    slug: scene.county.slug,
    parentId,
    stateCode: normalizeStateCode(scene.county.state),
    countySlug: scene.county.slug,
    supported: true,
    playableDistrictCount: (scene.world?.districts ?? []).filter((district) => district.playable).length,
    placeCount: scene.world?.places.length ?? 0,
  };
}

function districtSummary(scene: VoxelScene, districtId: string, parentId: string): UsDistrictSummary {
  const district = scene.world?.districts.find((item) => item.id === districtId);
  if (!district) {
    throw new Error(`Unknown district ${districtId} for county ${scene.county.slug}.`);
  }

  return {
    id: district.id,
    scope: "district",
    label: district.label,
    slug: slugify(district.label),
    parentId,
    stateCode: normalizeStateCode(scene.county.state),
    countySlug: scene.county.slug,
    districtSlug: slugify(district.label),
    playable: district.playable,
    placeCount: (scene.world?.places ?? []).filter((place) => place.districtId === district.id).length,
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
