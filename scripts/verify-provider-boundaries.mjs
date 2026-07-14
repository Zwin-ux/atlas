import { readFileSync, statSync } from "node:fs";

const requiredFiles = [
  "packages/geo/src/GeoDataAdapter.ts",
  "packages/geo/src/ProviderNormalization.ts",
  "packages/geo/src/ProviderUsagePolicy.ts",
  "packages/geo/src/SignalExtractor.ts",
  "packages/geo/src/GoogleMapsAdapter.ts",
  "packages/geo/src/MockGeoDataAdapter.ts",
  "packages/core/src/world/NationalWorldService.ts",
  "server/src/index.ts",
  "scripts/verify-no-google-in-renderer.mjs",
  "scripts/verify-tool-result-shape.mjs",
  "scripts/verify-provider-normalization-preflight.mjs",
];

const blockers = [];

for (const file of requiredFiles) {
  if (!exists(file)) {
    blockers.push(`Missing required provider-boundary file: ${file}`);
  }
}

const geoContract = read("packages/geo/src/GeoDataAdapter.ts");
for (const token of ["ProviderUsagePolicy", "usagePolicy", "mayRenderOnAtlasMap", "mayCache", "mayUseForReadiness", "sourceConfidence"]) {
  if (!geoContract.includes(token)) {
    blockers.push(`GeoDataAdapter.ts missing ${token}.`);
  }
}

const policy = read("packages/geo/src/ProviderUsagePolicy.ts");
assertIncludes(policy, "source === \"google\"", "ProviderUsagePolicy must branch on Google source.");
assertIncludes(policy, "mayRenderOnAtlasMap: false", "ProviderUsagePolicy must default lookups to non-renderable.");
assertIncludes(policy, "mayUseForReadiness: false", "ProviderUsagePolicy must block readiness by default.");
assertIncludes(policy, "mayCache: false", "Google provider policy must default to no caching.");
assertIncludes(policy, "mayCache: true", "Mock provider policy should remain cacheable for local smoke checks.");
assertIncludes(policy, "sourceConfidence: \"provider_mapped\"", "Google provider policy must carry provider-mapped confidence.");
assertIncludes(policy, "sourceConfidence: \"mock_verified\"", "Mock provider policy must carry mock-verified confidence.");

const normalization = read("packages/geo/src/ProviderNormalization.ts");
assertIncludes(normalization, "ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK", "Provider normalization must define a Google field-mask allowlist.");
assertIncludes(normalization, "wildcardAllowed: false", "Provider normalization must forbid wildcard field masks.");
assertIncludes(normalization, "providerLookupMayCreateSceneGeometry: false", "Provider normalization must block provider-created scene geometry.");
assertIncludes(normalization, "providerLookupMayPromoteReadiness: false", "Provider normalization must block provider readiness promotion.");

const extractor = read("packages/geo/src/SignalExtractor.ts");
const googlePolicyUses = count(extractor, "createProviderUsagePolicy(\"google\")");
if (googlePolicyUses < 3) {
  blockers.push(`SignalExtractor should attach Google usage policy to geocode, nearby, and aggregate signals; found ${googlePolicyUses}.`);
}

const mockAdapter = read("packages/geo/src/MockGeoDataAdapter.ts");
if (count(mockAdapter, "createProviderUsagePolicy(\"mock\")") < 4) {
  blockers.push("MockGeoDataAdapter should attach mock usage policy to all lookup signal types.");
}

const worldService = read("packages/core/src/world/NationalWorldService.ts");
for (const token of ["coveragePromotion: false", "sceneEligible: false", "publicQuality: false", "sceneGeometry: false", "rawProviderPayloadExposed: false"]) {
  assertIncludes(worldService, token, `World provider readiness must preserve ${token}.`);
}

const server = read("server/src/index.ts");
assertIncludes(server, "lookup-only", "lookup_world_places copy must say lookup-only.");
assertIncludes(server, "not saved", "lookup_world_places copy must say lookup results are not saved.");
assertIncludes(server, "not coverage proof", "lookup_world_places copy must say lookup is not coverage proof.");
assertIncludes(server, "does not open, show, refresh, or unlock a county map", "lookup_world_places copy must block county map claims.");

const summary = {
  ok: blockers.length === 0,
  update: "prealpha-0.1e-provider-boundary",
  requiredFiles,
  blockerCount: blockers.length,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  process.exitCode = 1;
}

function assertIncludes(source, token, message) {
  if (!source.includes(token)) {
    blockers.push(message);
  }
}

function count(source, token) {
  return source.split(token).length - 1;
}

function read(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function exists(file) {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
}
