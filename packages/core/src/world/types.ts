export type UsWorldScope = "country" | "state" | "county" | "district" | "place";

export type WorldSourceKind = "mock" | "curated" | "google" | "census" | "osm" | "local-open-data";

export type CountyCoverageTier =
  | "L0_UNSUPPORTED"
  | "L1_COUNTY_SHELL"
  | "L2_CURATED_DISTRICT"
  | "L3_PROVIDER_NORMALIZED"
  | "L4_PUBLIC_QUALITY";

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
  indexedCountyCount: number;
  playableCountyCount: number;
};

export type CountyCoverageTierCount = {
  coverageTier: CountyCoverageTier;
  coverageLabel: string;
  countyCount: number;
};

export type UsCountySummary = UsWorldIdentity & {
  scope: "county";
  stateCode: string;
  countySlug: string;
  geoid?: string;
  supported: boolean;
  coverageTier: CountyCoverageTier;
  coverageLabel: string;
  coverageMessage: string;
  playableDistrictCount: number;
  placeCount: number;
  centroid?: {
    latitude: number;
    longitude: number;
  };
};

export type UsDistrictSummary = UsWorldIdentity & {
  scope: "district";
  stateCode: string;
  countySlug: string;
  districtSlug: string;
  geoid?: string;
  playable: boolean;
  coverageTier?: CountyCoverageTier;
  readiness?: DistrictCandidateReadiness;
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
};

export type WorldLookupPlaceInput = {
  atlasLookupId: string;
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

export type ProviderLookupReadiness = {
  status: "lookup_only";
  sources: WorldSourceKind[];
  mode: "mock" | "google";
  cache: {
    key: string;
    ttlSeconds: number;
  };
  normalizedCategoryStatus: "bounded_atlas_categories" | "contains_unknown_category";
  normalizedCategoryConfidence: "mock_verified" | "provider_mapped";
  coveragePromotion: false;
  sceneEligible: false;
  publicQuality: false;
  sceneGeometry: false;
  rawProviderPayloadExposed: false;
  structuredContentPolicy: "atlas_normalized_only";
  fieldMaskPolicy: {
    mode: "allowlist";
    wildcardAllowed: false;
    allowedFieldCount: number;
  };
  limitations: string[];
};

export type UsCountryResponse = {
  type: "usWorldCountry";
  country: UsWorldIdentity & { scope: "country" };
  states: UsStateSummary[];
  cache: WorldCachePolicy;
};

export type UsCoverageDirectoryResponse = {
  type: "usWorldCoverageDirectory";
  country: UsWorldIdentity & { scope: "country" };
  states: UsStateSummary[];
  totals: {
    stateCount: number;
    indexedCountyCount: number;
    supportedCountyCount: number;
    playableCountyCount: number;
    shellCountyCount: number;
    providerNormalizedCountyCount: number;
    publicQualityCountyCount: number;
    indexedUnsupportedCountyCount: number;
  };
  tiers: CountyCoverageTierCount[];
  playableCounties: UsCountySummary[];
  suggestedNextCountySlug: string;
  limitations: string[];
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

export type UsUnsupportedWorldResponse = {
  type: "usWorldUnsupported";
  countySlug: string;
  supported: false;
  coverageTier: "L0_UNSUPPORTED";
  message: string;
  suggestedNextCountySlug: string;
  cache: WorldCachePolicy;
};

export type CountyCoverageDistrictIndexEntry = {
  geoid?: string;
  districtSlug: string;
  label: string;
  playable: boolean;
  coverageTier: CountyCoverageTier;
  readiness?: DistrictCandidateReadiness;
};

export type DistrictCandidateReadiness = {
  status: "candidate_only" | "curated_playable";
  sourceBasis: "census_identity";
  promotionBlocked: boolean;
  requiredBeforePlayable: DistrictPlayableGate[];
  knownGaps: DistrictCandidateGap[];
};

export type DistrictPlayableGate =
  | "candidate_contract"
  | "curated_district_pack"
  | "place_anchors_with_source_notes"
  | "bounded_scene_compiler_proof"
  | "desktop_mobile_product_loop_screenshots"
  | "lumen_visual_acceptance"
  | "mira_readiness_acceptance"
  | "forge_split_guard";

export type DistrictCandidateGap =
  | "no_curated_places"
  | "no_local_scene"
  | "no_provider_normalized_categories"
  | "not_public_quality";

export type NationalCountyIndexEntry = {
  geoid: string;
  stateCode: string;
  name: string;
  countySlug: string;
  coverageTier: CountyCoverageTier;
  centroid?: {
    latitude: number;
    longitude: number;
  };
  districts?: CountyCoverageDistrictIndexEntry[];
};

export type WorldPlaceLookupResponse = {
  type: "worldPlaceLookup";
  query: string;
  radiusMeters: number;
  mode: "mock" | "google";
  resolvedLocation: WorldLookupResolvedLocation;
  places: WorldLookupPlaceSummary[];
  cache: WorldCachePolicy;
  providerReadiness: ProviderLookupReadiness;
  runtime?: {
    cacheHit: boolean;
    cachedAt: string;
    expiresAt: string;
  };
};
