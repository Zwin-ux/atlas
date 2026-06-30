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
import { summarizeAggregateFilter } from "./SignalExtractor.js";

const EASTVALE = {
  latitude: 33.9525,
  longitude: -117.5848,
};

export class MockGeoDataAdapter implements GeoDataAdapter {
  readonly mode = "mock";

  async geocode(input: GeocodeInput): Promise<ResolvedLocation> {
    return {
      id: "mock:eastvale-ca",
      label: input.query || "Eastvale, CA",
      formattedAddress: "Eastvale, CA, USA",
      placeId: "mock-eastvale-ca",
      coordinates: EASTVALE,
      source: "mock",
      attribution: "Atlas mock data",
      ttlSeconds: 300,
    };
  }

  async nearbySearch(_input: NearbySearchInput): Promise<NearbyPlaceSignal[]> {
    return [
      {
        placeId: "mock-scout-yard-001",
        label: "Eastvale mobile detailing cluster",
        coordinates: { latitude: 33.9509, longitude: -117.5841 },
        address: "Eastvale, CA",
        primaryType: "car_wash",
        types: ["car_wash", "point_of_interest", "establishment"],
        source: "mock",
        attribution: "Atlas mock data",
        ttlSeconds: 300,
      },
      {
        placeId: "mock-retail-strip-002",
        label: "Retail strip signal",
        coordinates: { latitude: 33.9562, longitude: -117.5921 },
        address: "Eastvale, CA",
        primaryType: "store",
        types: ["store", "point_of_interest", "establishment"],
        source: "mock",
        attribution: "Atlas mock data",
        ttlSeconds: 300,
      },
    ];
  }

  async aggregatePlaces(input: PlacesAggregateInput): Promise<PlaceAggregateSignal[]> {
    const signals: PlaceAggregateSignal[] = [];
    const filterSummary = summarizeAggregateFilter(input);

    if (input.insight === "count" || input.insight === "count-and-places") {
      signals.push({
        insight: "count",
        count: 12,
        filterSummary,
        source: "mock",
        attribution: "Atlas mock data",
        ttlSeconds: 300,
      });
    }

    if (input.insight === "places" || input.insight === "count-and-places") {
      signals.push({
        insight: "places",
        placeIds: ["mock-scout-yard-001", "mock-retail-strip-002"],
        filterSummary,
        source: "mock",
        attribution: "Atlas mock data",
        ttlSeconds: 300,
      });
    }

    return signals;
  }

  async route(input: RouteInput): Promise<RouteHint[]> {
    const distanceMeters = estimateDistanceMeters(input.origin, input.destination);
    return [
      {
        label: `${input.mode ?? "drive"} route estimate`,
        distanceMeters,
        durationSeconds: Math.round(distanceMeters / 10),
        polyline: [input.origin, input.destination],
        source: "mock",
        attribution: "Atlas mock data",
        ttlSeconds: 300,
      },
    ];
  }
}

function estimateDistanceMeters(origin: RouteInput["origin"], destination: RouteInput["destination"]): number {
  const latitudeMeters = (destination.latitude - origin.latitude) * 111_320;
  const longitudeMeters =
    (destination.longitude - origin.longitude) * 111_320 * Math.cos((origin.latitude * Math.PI) / 180);
  return Math.round(Math.hypot(latitudeMeters, longitudeMeters));
}

