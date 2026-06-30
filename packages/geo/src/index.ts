import type { GeoAdapterMode } from "./GeoDataAdapter.js";
import { GoogleMapsAdapter, type GoogleMapsAdapterOptions } from "./GoogleMapsAdapter.js";
import { MockGeoDataAdapter } from "./MockGeoDataAdapter.js";

export type * from "./GeoDataAdapter.js";
export { GoogleMapsAdapter, GoogleMapsApiError, GoogleMapsConfigurationError } from "./GoogleMapsAdapter.js";
export { MockGeoDataAdapter } from "./MockGeoDataAdapter.js";

export type GeoAdapterConfig = {
  mode: GeoAdapterMode;
  google?: GoogleMapsAdapterOptions;
};

export type GeoRuntimeEnv = Record<string, string | undefined>;

export type GeoPackageStatus = {
  mode: GeoAdapterMode;
  realApiCallsEnabled: boolean;
};

export const GEO_PACKAGE_STATUS: GeoPackageStatus = {
  mode: "mock",
  realApiCallsEnabled: false,
};

export function readGeoAdapterConfig(env: GeoRuntimeEnv): GeoAdapterConfig {
  const mode = normalizeMode(env.GEO_DATA_ADAPTER ?? env.GEO_ADAPTER_MODE);

  if (mode === "google") {
    const google: GoogleMapsAdapterOptions = {
      apiKey: env.GOOGLE_MAPS_API_KEY ?? "",
    };

    if (env.GOOGLE_MAPS_LANGUAGE) {
      google.languageCode = env.GOOGLE_MAPS_LANGUAGE;
    }

    if (env.GOOGLE_MAPS_REGION) {
      google.regionCode = env.GOOGLE_MAPS_REGION;
    }

    return {
      mode,
      google,
    };
  }

  return { mode: "mock" };
}

export function createGeoDataAdapter(config: GeoAdapterConfig = { mode: "mock" }) {
  if (config.mode === "google") {
    if (!config.google) {
      throw new Error("Google geo adapter selected without google configuration.");
    }
    return new GoogleMapsAdapter(config.google);
  }

  return new MockGeoDataAdapter();
}

export function isGoogleMapsConfigured(env: GeoRuntimeEnv): boolean {
  return Boolean(env.GOOGLE_MAPS_API_KEY?.trim());
}

function normalizeMode(mode: string | undefined): GeoAdapterMode {
  return mode === "google" || mode === "google-maps" ? "google" : "mock";
}
