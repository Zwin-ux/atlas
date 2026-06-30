import type {
  Coordinates,
  NearbyPlaceSignal,
  PlaceAggregateSignal,
  PlacesAggregateInput,
  ResolvedLocation,
} from "./GeoDataAdapter.js";
import { normalizeProviderPlaceCategory } from "./PlaceCategoryNormalizer.js";

const GOOGLE_ATTRIBUTION = "Google Maps Platform";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24;

export type GoogleGeocodeResult = {
  place_id?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

export type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  primaryType?: string;
  types?: string[];
};

export type GoogleAggregateResponse = {
  count?: string | number;
  placeInsights?: Array<{
    place?: string;
    placeId?: string;
  }>;
};

export function extractResolvedLocation(query: string, result: GoogleGeocodeResult): ResolvedLocation {
  const coordinates = result.geometry?.location;
  if (typeof coordinates?.lat !== "number" || typeof coordinates.lng !== "number") {
    throw new Error("Google geocode response did not include coordinates.");
  }

  return {
    id: result.place_id ? `google:${result.place_id}` : `google:${query.toLowerCase()}`,
    label: result.formatted_address ?? query,
    ...(result.formatted_address ? { formattedAddress: result.formatted_address } : {}),
    ...(result.place_id ? { placeId: result.place_id } : {}),
    coordinates: {
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
    source: "google",
    attribution: GOOGLE_ATTRIBUTION,
    ttlSeconds: DEFAULT_TTL_SECONDS,
  };
}

export function extractNearbyPlaceSignals(places: GooglePlace[]): NearbyPlaceSignal[] {
  return places
    .filter((place): place is GooglePlace & { id: string } => typeof place.id === "string" && place.id.length > 0)
    .map((place) => {
      const coordinates = extractOptionalCoordinates(place.location);
      return {
        placeId: place.id,
        label: place.displayName?.text ?? place.formattedAddress ?? place.id,
        ...(coordinates ? { coordinates } : {}),
        ...(place.formattedAddress ? { address: place.formattedAddress } : {}),
        ...(place.primaryType ? { primaryType: place.primaryType } : {}),
        types: place.types ?? [],
        category: normalizeProviderPlaceCategory({ primaryType: place.primaryType, types: place.types }),
        source: "google",
        attribution: GOOGLE_ATTRIBUTION,
        ttlSeconds: DEFAULT_TTL_SECONDS,
      };
    });
}

export function extractAggregateSignals(
  input: PlacesAggregateInput,
  payload: GoogleAggregateResponse,
): PlaceAggregateSignal[] {
  const signals: PlaceAggregateSignal[] = [];
  const filterSummary = summarizeAggregateFilter(input);

  if (input.insight === "count" || input.insight === "count-and-places") {
    signals.push({
      insight: "count",
      count: normalizeCount(payload.count),
      filterSummary,
      source: "google",
      attribution: GOOGLE_ATTRIBUTION,
      ttlSeconds: DEFAULT_TTL_SECONDS,
    });
  }

  if (input.insight === "places" || input.insight === "count-and-places") {
    signals.push({
      insight: "places",
      placeIds: extractPlaceIds(payload),
      filterSummary,
      source: "google",
      attribution: GOOGLE_ATTRIBUTION,
      ttlSeconds: DEFAULT_TTL_SECONDS,
    });
  }

  return signals;
}

export function summarizeAggregateFilter(input: PlacesAggregateInput): string {
  const types = [
    ...(input.includedTypes ?? []),
    ...(input.includedPrimaryTypes ?? []).map((type) => `primary:${type}`),
  ];
  const typeText = types.length > 0 ? types.join(",") : "all configured types";
  const locationText = input.regionPlaceId
    ? `region:${input.regionPlaceId}`
    : input.center && input.radiusMeters
      ? `circle:${input.center.latitude},${input.center.longitude},${input.radiusMeters}m`
      : "unknown area";
  return `${typeText} in ${locationText}`;
}

function normalizeCount(count: GoogleAggregateResponse["count"]): number {
  if (typeof count === "number") return count;
  if (typeof count === "string") {
    const parsed = Number.parseInt(count, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function extractPlaceIds(payload: GoogleAggregateResponse): string[] {
  return (payload.placeInsights ?? [])
    .map((place) => place.placeId ?? place.place?.replace(/^places\//, ""))
    .filter((placeId): placeId is string => typeof placeId === "string" && placeId.length > 0);
}

function extractOptionalCoordinates(location: GooglePlace["location"]): Coordinates | undefined {
  if (typeof location?.latitude !== "number" || typeof location.longitude !== "number") {
    return undefined;
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
  };
}
