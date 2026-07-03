import type { GeoSource, ProviderUsagePolicy } from "./GeoDataAdapter.js";

const GOOGLE_LOOKUP_REASON =
  "Google Maps Platform lookup is temporary place-resolution context. It must not become permanent Atlas voxel geometry or county readiness proof.";

const MOCK_LOOKUP_REASON =
  "Atlas mock lookup is development/test context. It may be cached for runtime smoke checks but is not playable coverage readiness.";

export function createProviderUsagePolicy(source: GeoSource): ProviderUsagePolicy {
  if (source === "google") {
    return {
      mayRenderOnAtlasMap: false,
      mayCache: false,
      mayUseForReadiness: false,
      sourceConfidence: "provider_mapped",
      reason: GOOGLE_LOOKUP_REASON,
    };
  }

  return {
    mayRenderOnAtlasMap: false,
    mayCache: true,
    mayUseForReadiness: false,
    sourceConfidence: "mock_verified",
    reason: MOCK_LOOKUP_REASON,
  };
}
