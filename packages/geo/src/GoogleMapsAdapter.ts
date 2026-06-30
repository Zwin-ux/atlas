import type {
  GeoDataAdapter,
  GeocodeInput,
  NearbyPlaceSignal,
  NearbySearchInput,
  PlaceAggregateSignal,
  PlacesAggregateInput,
  ResolvedLocation,
  RouteHint,
  RouteInput,
} from "./GeoDataAdapter.js";
import {
  extractAggregateSignals,
  extractNearbyPlaceSignals,
  extractResolvedLocation,
  type GoogleAggregateResponse,
  type GoogleGeocodeResult,
  type GooglePlace,
} from "./SignalExtractor.js";

type GoogleGeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: GoogleGeocodeResult[];
};

type GoogleNearbyResponse = {
  places?: GooglePlace[];
  error?: {
    message?: string;
    status?: string;
  };
};

export type GoogleMapsAdapterOptions = {
  apiKey: string;
  languageCode?: string;
  regionCode?: string;
  geocodingEndpoint?: string;
  placesEndpoint?: string;
  aggregateEndpoint?: string;
};

export class GoogleMapsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleMapsConfigurationError";
  }
}

export class GoogleMapsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GoogleMapsApiError";
  }
}

export class GoogleMapsAdapter implements GeoDataAdapter {
  readonly mode = "google";
  private readonly apiKey: string;
  private readonly languageCode: string | undefined;
  private readonly regionCode: string | undefined;
  private readonly geocodingEndpoint: string;
  private readonly placesEndpoint: string;
  private readonly aggregateEndpoint: string;

  constructor(options: GoogleMapsAdapterOptions) {
    if (!options.apiKey.trim()) {
      throw new GoogleMapsConfigurationError("GOOGLE_MAPS_API_KEY is required when GEO_DATA_ADAPTER=google.");
    }

    this.apiKey = options.apiKey;
    this.languageCode = options.languageCode;
    this.regionCode = options.regionCode;
    this.geocodingEndpoint = options.geocodingEndpoint ?? "https://maps.googleapis.com/maps/api/geocode/json";
    this.placesEndpoint = options.placesEndpoint ?? "https://places.googleapis.com/v1/places:searchNearby";
    this.aggregateEndpoint = options.aggregateEndpoint ?? "https://areainsights.googleapis.com/v1:computeInsights";
  }

  async geocode(input: GeocodeInput): Promise<ResolvedLocation> {
    const query = input.query.trim();
    if (!query) {
      throw new GoogleMapsConfigurationError("Geocode query is required.");
    }

    const url = new URL(this.geocodingEndpoint);
    url.searchParams.set("address", query);
    url.searchParams.set("key", this.apiKey);
    this.setOptionalParam(url, "language", input.languageCode ?? this.languageCode);
    this.setOptionalParam(url, "region", input.regionCode ?? this.regionCode);

    const payload = await this.fetchJson<GoogleGeocodeResponse>(url);
    if (payload.status !== "OK") {
      throw new GoogleMapsApiError(payload.error_message ?? `Google geocoding returned ${payload.status ?? "unknown"}.`);
    }

    const firstResult = payload.results?.[0];
    if (!firstResult) {
      throw new GoogleMapsApiError("Google geocoding returned no results.");
    }

    return extractResolvedLocation(query, firstResult);
  }

  async nearbySearch(input: NearbySearchInput): Promise<NearbyPlaceSignal[]> {
    validateRadius(input.radiusMeters, 1, 50_000, "Nearby Search radius");

    const body = removeUndefined({
      includedTypes: normalizeStringList(input.includedTypes),
      excludedTypes: normalizeStringList(input.excludedTypes),
      includedPrimaryTypes: normalizeStringList(input.includedPrimaryTypes),
      excludedPrimaryTypes: normalizeStringList(input.excludedPrimaryTypes),
      maxResultCount: input.maxResultCount ?? 10,
      rankPreference: input.rankPreference,
      languageCode: input.languageCode ?? this.languageCode,
      regionCode: input.regionCode ?? this.regionCode,
      locationRestriction: {
        circle: {
          center: {
            latitude: input.center.latitude,
            longitude: input.center.longitude,
          },
          radius: input.radiusMeters,
        },
      },
    });

    const payload = await this.fetchJson<GoogleNearbyResponse>(this.placesEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types",
      },
      body: JSON.stringify(body),
    });

    if (payload.error?.message) {
      throw new GoogleMapsApiError(payload.error.message);
    }

    return extractNearbyPlaceSignals(payload.places ?? []);
  }

  async aggregatePlaces(input: PlacesAggregateInput): Promise<PlaceAggregateSignal[]> {
    const insights = resolveAggregateInsights(input.insight);
    const body = {
      insights,
      filter: removeUndefined({
        locationFilter: buildAggregateLocationFilter(input),
        typeFilter: buildAggregateTypeFilter(input),
        operatingStatus: normalizeStringList(input.operatingStatus),
        priceLevels: normalizeStringList(input.priceLevels),
        ratingFilter: input.ratingFilter,
      }),
    };

    const payload = await this.fetchJson<GoogleAggregateResponse>(this.aggregateEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    return extractAggregateSignals(input, payload);
  }

  async route(_input: RouteInput): Promise<RouteHint[]> {
    throw new GoogleMapsConfigurationError(
      "Route hints require Google Routes API. Enable Routes API before using GoogleMapsAdapter.route.",
    );
  }

  private setOptionalParam(url: URL, key: string, value: string | undefined): void {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  private async fetchJson<T>(input: string | URL, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init);
    const payload = (await response.json().catch(async () => {
      const text = await response.text();
      return { error: { message: text } };
    })) as T & { error?: { message?: string } };

    if (!response.ok) {
      throw new GoogleMapsApiError(payload.error?.message ?? `Google Maps request failed with HTTP ${response.status}.`, response.status);
    }

    return payload;
  }
}

function validateRadius(radiusMeters: number, min: number, max: number, label: string): void {
  if (!Number.isFinite(radiusMeters) || radiusMeters < min || radiusMeters > max) {
    throw new GoogleMapsConfigurationError(`${label} must be between ${min} and ${max} meters.`);
  }
}

function normalizeStringList(values: readonly string[] | undefined): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  const clean = values.map((value) => value.trim()).filter(Boolean);
  return clean.length > 0 ? clean : undefined;
}

function removeUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function resolveAggregateInsights(insight: PlacesAggregateInput["insight"]): string[] {
  if (insight === "count-and-places") return ["INSIGHT_COUNT", "INSIGHT_PLACES"];
  return insight === "places" ? ["INSIGHT_PLACES"] : ["INSIGHT_COUNT"];
}

function buildAggregateLocationFilter(input: PlacesAggregateInput): Record<string, unknown> {
  if (input.regionPlaceId) {
    return {
      region: {
        place: input.regionPlaceId.startsWith("places/") ? input.regionPlaceId : `places/${input.regionPlaceId}`,
      },
    };
  }

  if (!input.center || !input.radiusMeters) {
    throw new GoogleMapsConfigurationError("Places Aggregate requires either regionPlaceId or center plus radiusMeters.");
  }

  validateRadius(input.radiusMeters, 1, 50_000, "Places Aggregate circle radius");

  return {
    circle: {
      latLng: {
        latitude: input.center.latitude,
        longitude: input.center.longitude,
      },
      radius: input.radiusMeters,
    },
  };
}

function buildAggregateTypeFilter(input: PlacesAggregateInput): Record<string, unknown> {
  const typeFilter = removeUndefined({
    includedTypes: normalizeStringList(input.includedTypes),
    excludedTypes: normalizeStringList(input.excludedTypes),
    includedPrimaryTypes: normalizeStringList(input.includedPrimaryTypes),
    excludedPrimaryTypes: normalizeStringList(input.excludedPrimaryTypes),
  });

  if (Object.keys(typeFilter).length === 0) {
    throw new GoogleMapsConfigurationError("Places Aggregate requires at least one included type or included primary type.");
  }

  return typeFilter;
}
