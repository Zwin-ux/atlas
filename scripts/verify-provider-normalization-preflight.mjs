#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const jsonOnly = args.has("--json-only");
const blockers = [];
const checks = [];

const files = {
  providerNormalization: "packages/geo/src/ProviderNormalization.ts",
  googleAdapter: "packages/geo/src/GoogleMapsAdapter.ts",
  geoIndex: "packages/geo/src/index.ts",
  worldTypes: "packages/core/src/world/types.ts",
  worldService: "packages/core/src/world/NationalWorldService.ts",
  server: "server/src/index.ts",
  toolShapeVerifier: "scripts/verify-tool-result-shape.mjs",
  worldLookupBoundaryVerifier: "scripts/verify-world-lookup-boundary.mjs",
};

for (const [label, file] of Object.entries(files)) {
  check(`file:${label}`, exists(file), `${file} exists`);
}

const providerNormalization = read(files.providerNormalization);
const googleAdapter = read(files.googleAdapter);
const geoIndex = read(files.geoIndex);
const worldTypes = read(files.worldTypes);
const worldService = read(files.worldService);
const server = read(files.server);
const toolShapeVerifier = read(files.toolShapeVerifier);
const worldLookupBoundaryVerifier = read(files.worldLookupBoundaryVerifier);
const lookupOutputSchema = sliceBetween(server, "const worldPlaceLookupOutputSchema", "const countyQuestionAnswerOutputSchema");
const performWorldLookup = sliceBetween(server, "async function performWorldLookup", "function worldLookupCacheKey");

check(
  "field-mask-contract",
  providerNormalization.includes("ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK") &&
    providerNormalization.includes("ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER") &&
    providerNormalization.includes("assertGoogleNearbyFieldMaskAllowed"),
  "ProviderNormalization defines field-mask allowlist contract.",
);
check("field-mask-no-wildcard", !providerNormalization.includes("\"*\" as const") && providerNormalization.includes("wildcardAllowed: false"), "Provider field-mask contract forbids wildcard masks.");

for (const forbidden of ["places.photos", "places.nationalPhoneNumber", "places.websiteUri", "places.rating", "places.reviews", "places.priceLevel", "places.regularOpeningHours"]) {
  check(`field-mask-blocks:${forbidden}`, !providerNormalization.includes(forbidden), `Provider field mask excludes ${forbidden}.`);
}

check(
  "google-adapter-uses-central-mask",
  googleAdapter.includes("ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER") &&
    googleAdapter.includes("assertGoogleNearbyFieldMaskAllowed(ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER)") &&
    !googleAdapter.includes("places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types"),
  "Google adapter uses central allowlisted field mask.",
);
check("geo-index-exports-contract", geoIndex.includes("ATLAS_PROVIDER_NORMALIZATION_PREFLIGHT_POLICY"), "Geo package exports provider preflight policy.");

check("world-types-no-visible-resolved-place-id", !/export type WorldLookupResolvedLocation[\s\S]*?placeId\??:/.test(worldTypes), "WorldLookupResolvedLocation does not expose provider placeId.");
check("world-types-atlas-owned-input-id", worldTypes.includes("atlasLookupId: string") && !/export type WorldLookupPlaceInput[\s\S]*?placeId: string/.test(worldTypes), "WorldLookupPlaceInput requires Atlas-owned lookup ids.");
for (const token of ["coveragePromotion: false", "sceneEligible: false", "publicQuality: false", "sceneGeometry: false", "rawProviderPayloadExposed: false", "structuredContentPolicy: \"atlas_normalized_only\""]) {
  check(`provider-readiness:${token}`, worldTypes.includes(token) && worldService.includes(token), `Provider readiness preserves ${token}.`);
}

for (const forbidden of ["query:", "mode:", "coordinates:", "cache:", "providerReadiness:", "runtime:", "ttlSeconds:", "cachedAt:", "expiresAt:", "placeId:", "primaryType:", "types:", "photos:", "phone:", "website:", "rating:", "reviews:", "priceLevel:", "openingHours:"]) {
  check(`structured-content-no:${forbidden}`, !lookupOutputSchema.includes(forbidden), `lookup_world_places output schema omits ${forbidden}.`);
}
check("server-removes-resolved-place-id", !performWorldLookup.includes("resolvedLocation.placeId") && !performWorldLookup.includes("{ placeId:"), "performWorldLookup omits provider placeId from structured response.");
check("server-atlas-lookup-id", performWorldLookup.includes("atlasLookupId: atlasLookupPlaceId") && server.includes("function atlasLookupPlaceId"), "performWorldLookup creates Atlas-owned lookup ids.");
check("server-no-scene-compile-in-lookup", !/compile(?:CityWorld|County|District).*Scene/.test(performWorldLookup), "performWorldLookup does not compile scene geometry.");

for (const token of ["placeId\" in (lookup.resolvedLocation", "place.id.startsWith(\"lookup-\")", "sceneGeometry === false", "rawProviderPayloadExposed === false"]) {
  check(`runtime-verifier:${token}`, worldLookupBoundaryVerifier.includes(token), `World lookup boundary verifier checks ${token}.`);
}
for (const token of ["lookupOutputSchema", "atlasLookupPlaceId", "publicWorldPlaceLookup", "up to 24 hours"]) {
  check(`tool-shape-verifier:${token}`, toolShapeVerifier.includes(token), `Tool shape verifier checks ${token}.`);
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.41e-provider-normalization-preflight",
  checkCount: checks.length,
  blockerCount: blockers.length,
  blockers,
  checks,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function check(id, condition, message) {
  checks.push({ id, passed: Boolean(condition), message });
  if (!condition) blockers.push(message);
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

function sliceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    blockers.push(`Could not locate slice ${start} -> ${end}.`);
    return "";
  }
  return source.slice(startIndex, endIndex);
}
