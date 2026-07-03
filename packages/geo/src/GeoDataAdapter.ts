export type GeoAdapterMode = "mock" | "google";

export type GeoSource = "mock" | "google";

export type ProviderUsagePolicy = {
  mayRenderOnAtlasMap: boolean;
  mayCache: boolean;
  mayUseForReadiness: boolean;
  reason: string;
  sourceConfidence: "mock_verified" | "provider_mapped";
  expiresAt?: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodeInput = {
  query: string;
  languageCode?: string;
  regionCode?: string;
};

export type ResolvedLocation = {
  id: string;
  label: string;
  coordinates: Coordinates;
  formattedAddress?: string;
  placeId?: string;
  source: GeoSource;
  attribution: string;
  ttlSeconds: number;
  usagePolicy: ProviderUsagePolicy;
};

export type NearbySearchInput = {
  center: Coordinates;
  radiusMeters: number;
  includedTypes?: string[];
  excludedTypes?: string[];
  includedPrimaryTypes?: string[];
  excludedPrimaryTypes?: string[];
  maxResultCount?: number;
  rankPreference?: "POPULARITY" | "DISTANCE";
  languageCode?: string;
  regionCode?: string;
};

export type NearbyPlaceSignal = {
  placeId: string;
  label: string;
  coordinates?: Coordinates;
  address?: string;
  primaryType?: string;
  types: string[];
  category: string;
  source: GeoSource;
  attribution: string;
  ttlSeconds: number;
  usagePolicy: ProviderUsagePolicy;
};

export type PlacesAggregateInput = {
  insight: "count" | "places" | "count-and-places";
  center?: Coordinates;
  radiusMeters?: number;
  regionPlaceId?: string;
  includedTypes?: string[];
  excludedTypes?: string[];
  includedPrimaryTypes?: string[];
  excludedPrimaryTypes?: string[];
  operatingStatus?: Array<
    "OPERATING_STATUS_OPERATIONAL" | "OPERATING_STATUS_PERMANENTLY_CLOSED" | "OPERATING_STATUS_TEMPORARILY_CLOSED"
  >;
  priceLevels?: Array<
    | "PRICE_LEVEL_FREE"
    | "PRICE_LEVEL_INEXPENSIVE"
    | "PRICE_LEVEL_MODERATE"
    | "PRICE_LEVEL_EXPENSIVE"
    | "PRICE_LEVEL_VERY_EXPENSIVE"
  >;
  ratingFilter?: {
    minRating?: number;
    maxRating?: number;
  };
};

export type PlaceAggregateSignal = {
  insight: "count" | "places";
  count?: number;
  placeIds?: string[];
  filterSummary: string;
  source: GeoSource;
  attribution: string;
  ttlSeconds: number;
  usagePolicy: ProviderUsagePolicy;
};

export type RouteInput = {
  origin: Coordinates;
  destination: Coordinates;
  mode?: "drive" | "walk" | "bike";
};

export type RouteHint = {
  label: string;
  distanceMeters?: number;
  durationSeconds?: number;
  polyline?: Coordinates[];
  source: GeoSource;
  attribution: string;
  ttlSeconds: number;
  usagePolicy: ProviderUsagePolicy;
};

export interface GeoDataAdapter {
  readonly mode: GeoAdapterMode;
  geocode(input: GeocodeInput): Promise<ResolvedLocation>;
  nearbySearch(input: NearbySearchInput): Promise<NearbyPlaceSignal[]>;
  aggregatePlaces(input: PlacesAggregateInput): Promise<PlaceAggregateSignal[]>;
  route(input: RouteInput): Promise<RouteHint[]>;
}
