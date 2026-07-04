export const ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.types",
] as const;

export const ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK_HEADER = ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK.join(",");

export const PROVIDER_STRUCTURED_CONTENT_FORBIDDEN_FIELDS = [
  "placeId",
  "primaryType",
  "types",
  "rawProviderPayload",
  "providerPayload",
  "providerPlaceId",
  "photos",
  "phone",
  "website",
  "rating",
  "reviews",
  "priceLevel",
  "openingHours",
] as const;

export type GoogleNearbySearchFieldMask = (typeof ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK)[number];

export type ProviderNormalizationPreflightPolicy = {
  readonly fieldMaskMode: "allowlist";
  readonly wildcardAllowed: false;
  readonly allowedGoogleNearbyFields: readonly GoogleNearbySearchFieldMask[];
  readonly structuredContentForbiddenFields: readonly (typeof PROVIDER_STRUCTURED_CONTENT_FORBIDDEN_FIELDS)[number][];
  readonly providerLookupMayCreateSceneGeometry: false;
  readonly providerLookupMayPromoteReadiness: false;
};

export const ATLAS_PROVIDER_NORMALIZATION_PREFLIGHT_POLICY: ProviderNormalizationPreflightPolicy = {
  fieldMaskMode: "allowlist",
  wildcardAllowed: false,
  allowedGoogleNearbyFields: ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK,
  structuredContentForbiddenFields: PROVIDER_STRUCTURED_CONTENT_FORBIDDEN_FIELDS,
  providerLookupMayCreateSceneGeometry: false,
  providerLookupMayPromoteReadiness: false,
};

export function assertGoogleNearbyFieldMaskAllowed(fieldMask: string): void {
  const fields = fieldMask
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  if (fields.length === 0) {
    throw new Error("Google Nearby Search field mask cannot be empty.");
  }

  if (fields.includes("*")) {
    throw new Error("Google Nearby Search wildcard field mask is forbidden for Atlas.");
  }

  const allowed = new Set<string>(ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK);
  const blocked = fields.filter((field) => !allowed.has(field));
  if (blocked.length > 0) {
    throw new Error(`Google Nearby Search field mask includes non-Atlas fields: ${blocked.join(", ")}`);
  }
}
