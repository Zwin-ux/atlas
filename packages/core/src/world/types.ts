export type UsWorldScope = "country" | "state" | "county" | "district" | "place";

export type WorldSourceKind = "mock" | "curated" | "google" | "census" | "osm" | "local-open-data";

export type WorldPlaceCategory =
  | "home_area"
  | "food_drink"
  | "shop"
  | "service"
  | "park"
  | "school"
  | "civic"
  | "health"
  | "fitness"
  | "entertainment"
  | "transit"
  | "landmark"
  | "unknown";

export type WorldSourceNote = {
  source: WorldSourceKind;
  label: string;
  attribution: string;
  ttlSeconds: number;
};

export type WorldCachePolicy = {
  key: string;
  ttlSeconds: number;
  sourceNotes: WorldSourceNote[];
};

export type UsWorldIdentity = {
  id: string;
  scope: UsWorldScope;
  label: string;
  slug: string;
  parentId?: string;
};

export type UsStateSummary = UsWorldIdentity & {
  scope: "state";
  stateCode: string;
  supportedCountyCount: number;
};

export type UsCountySummary = UsWorldIdentity & {
  scope: "county";
  stateCode: string;
  countySlug: string;
  supported: boolean;
  playableDistrictCount: number;
  placeCount: number;
};

export type UsDistrictSummary = UsWorldIdentity & {
  scope: "district";
  stateCode: string;
  countySlug: string;
  districtSlug: string;
  playable: boolean;
  placeCount: number;
};

export type UsPlaceSummary = UsWorldIdentity & {
  scope: "place";
  stateCode: string;
  countySlug: string;
  districtSlug: string;
  placeKind: WorldPlaceCategory;
  activity: number;
};

export type WorldLookupResolvedLocation = {
  id: string;
  label: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  placeId?: string;
};

export type WorldLookupPlaceInput = {
  placeId: string;
  label: string;
  category: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  source: WorldSourceKind;
  attribution: string;
  ttlSeconds: number;
};

export type WorldLookupPlaceSummary = {
  id: string;
  label: string;
  category: WorldPlaceCategory;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  sourceNotes: WorldSourceNote[];
};

export type UsCountryResponse = {
  type: "usWorldCountry";
  country: UsWorldIdentity & { scope: "country" };
  states: UsStateSummary[];
  cache: WorldCachePolicy;
};

export type UsStateCountiesResponse = {
  type: "usWorldStateCounties";
  state: UsStateSummary;
  counties: UsCountySummary[];
  cache: WorldCachePolicy;
};

export type UsCountyWorldResponse = {
  type: "usWorldCounty";
  county: UsCountySummary;
  districts: UsDistrictSummary[];
  cache: WorldCachePolicy;
};

export type UsDistrictWorldResponse = {
  type: "usWorldDistrict";
  district: UsDistrictSummary;
  places: UsPlaceSummary[];
  cache: WorldCachePolicy;
};

export type WorldPlaceLookupResponse = {
  type: "worldPlaceLookup";
  query: string;
  radiusMeters: number;
  mode: "mock" | "google";
  resolvedLocation: WorldLookupResolvedLocation;
  places: WorldLookupPlaceSummary[];
  cache: WorldCachePolicy;
  runtime?: {
    cacheHit: boolean;
    cachedAt: string;
    expiresAt: string;
  };
};
