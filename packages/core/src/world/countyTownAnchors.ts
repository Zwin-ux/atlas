export const COUNTY_TOWN_ANCHOR_UPDATE_ID = "postalpha-0.78-2-real-town-anchors";

export type CountyTownAnchorKind =
  | "incorporated_place"
  | "census_designated_place"
  | "county_subdivision";

export type CountyTownAnchor = {
  censusPlaceGeoid: string;
  label: string;
  kind: CountyTownAnchorKind;
  latitude: number;
  longitude: number;
  population2024?: number;
  landAreaSquareMeters?: number;
};

export type CountyTownAnchorCounty = {
  geoid: string;
  stateCode: string;
  countyName: string;
  anchors: CountyTownAnchor[];
};

export type CountyTownAnchorIndex = {
  schemaVersion: 1;
  sourceYear: 2024;
  sources: Array<{
    name: string;
    url: string;
    use: string;
  }>;
  method: {
    maximumAnchorsPerCounty: number;
    primary: string;
    fallback: string;
    geometry: string;
  };
  totals: {
    supportedCountyCount: number;
    coveredCountyCount: number;
    anchorCount: number;
    kindCounts: Partial<Record<CountyTownAnchorKind, number>>;
  };
  counties: Record<string, CountyTownAnchorCounty>;
};

export class CountyTownAnchorIndexValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CountyTownAnchorIndexValidationError";
  }
}

export function parseCountyTownAnchorIndex(value: unknown): CountyTownAnchorIndex {
  if (!isRecord(value)) throw invalid("index must be an object");
  if (value.schemaVersion !== 1) throw invalid("schemaVersion must be 1");
  if (value.sourceYear !== 2024) throw invalid("sourceYear must be 2024");
  if (!Array.isArray(value.sources) || value.sources.length < 2) throw invalid("sources must contain the Census population and TIGERweb sources");
  if (!isRecord(value.method)) throw invalid("method must be an object");
  if (!isRecord(value.totals)) throw invalid("totals must be an object");
  if (!isRecord(value.counties)) throw invalid("counties must be an object");

  const maximumAnchorsPerCounty = finiteInteger(value.method.maximumAnchorsPerCounty, "method.maximumAnchorsPerCounty", 1, 12);
  const counties: Record<string, CountyTownAnchorCounty> = {};
  let anchorCount = 0;
  const kindCounts: Partial<Record<CountyTownAnchorKind, number>> = {};

  for (const [countySlug, rawCounty] of Object.entries(value.counties)) {
    if (!/^[a-z0-9-]+$/.test(countySlug)) throw invalid(`invalid county slug ${countySlug}`);
    if (!isRecord(rawCounty)) throw invalid(`${countySlug} must be an object`);
    const geoid = requiredString(rawCounty.geoid, `${countySlug}.geoid`);
    const stateCode = requiredString(rawCounty.stateCode, `${countySlug}.stateCode`);
    const countyName = requiredString(rawCounty.countyName, `${countySlug}.countyName`);
    if (!/^\d{5}$/.test(geoid)) throw invalid(`${countySlug}.geoid must be a five-digit Census GEOID`);
    if (!/^[A-Z]{2}$/.test(stateCode)) throw invalid(`${countySlug}.stateCode must be a two-letter state code`);
    if (!Array.isArray(rawCounty.anchors) || rawCounty.anchors.length < 1) throw invalid(`${countySlug} must have at least one real anchor`);
    if (rawCounty.anchors.length > maximumAnchorsPerCounty) throw invalid(`${countySlug} exceeds the ${maximumAnchorsPerCounty}-anchor limit`);

    const seenGeoids = new Set<string>();
    const anchors = rawCounty.anchors.map((rawAnchor, index) => {
      const anchor = parseAnchor(rawAnchor, `${countySlug}.anchors[${index}]`);
      if (seenGeoids.has(anchor.censusPlaceGeoid)) throw invalid(`${countySlug} repeats anchor ${anchor.censusPlaceGeoid}`);
      seenGeoids.add(anchor.censusPlaceGeoid);
      anchorCount += 1;
      kindCounts[anchor.kind] = (kindCounts[anchor.kind] ?? 0) + 1;
      return anchor;
    });

    counties[countySlug] = { geoid, stateCode, countyName, anchors };
  }

  const supportedCountyCount = finiteInteger(value.totals.supportedCountyCount, "totals.supportedCountyCount", 1);
  const coveredCountyCount = finiteInteger(value.totals.coveredCountyCount, "totals.coveredCountyCount", 1);
  const recordedAnchorCount = finiteInteger(value.totals.anchorCount, "totals.anchorCount", 1);
  if (coveredCountyCount !== Object.keys(counties).length) throw invalid("totals.coveredCountyCount does not match counties");
  if (supportedCountyCount !== coveredCountyCount) throw invalid("every supported county must be covered");
  if (recordedAnchorCount !== anchorCount) throw invalid("totals.anchorCount does not match the parsed anchors");

  return {
    schemaVersion: 1,
    sourceYear: 2024,
    sources: value.sources.map((source, index) => parseSource(source, index)),
    method: {
      maximumAnchorsPerCounty,
      primary: requiredString(value.method.primary, "method.primary"),
      fallback: requiredString(value.method.fallback, "method.fallback"),
      geometry: requiredString(value.method.geometry, "method.geometry"),
    },
    totals: {
      supportedCountyCount,
      coveredCountyCount,
      anchorCount,
      kindCounts,
    },
    counties,
  };
}

function parseAnchor(value: unknown, path: string): CountyTownAnchor {
  if (!isRecord(value)) throw invalid(`${path} must be an object`);
  const kind = value.kind;
  if (kind !== "incorporated_place" && kind !== "census_designated_place" && kind !== "county_subdivision") {
    throw invalid(`${path}.kind is not supported`);
  }
  const latitude = finiteNumber(value.latitude, `${path}.latitude`);
  const longitude = finiteNumber(value.longitude, `${path}.longitude`);
  if (latitude < -90 || latitude > 90) throw invalid(`${path}.latitude is out of range`);
  if (longitude < -180 || longitude > 180) throw invalid(`${path}.longitude is out of range`);

  return {
    censusPlaceGeoid: requiredString(value.censusPlaceGeoid, `${path}.censusPlaceGeoid`),
    label: requiredString(value.label, `${path}.label`),
    kind,
    latitude,
    longitude,
    ...(value.population2024 !== undefined
      ? { population2024: finiteInteger(value.population2024, `${path}.population2024`, 0) }
      : {}),
    ...(value.landAreaSquareMeters !== undefined
      ? { landAreaSquareMeters: finiteNumber(value.landAreaSquareMeters, `${path}.landAreaSquareMeters`, 0) }
      : {}),
  };
}

function parseSource(value: unknown, index: number) {
  if (!isRecord(value)) throw invalid(`sources[${index}] must be an object`);
  return {
    name: requiredString(value.name, `sources[${index}].name`),
    url: requiredString(value.url, `sources[${index}].url`),
    use: requiredString(value.use, `sources[${index}].use`),
  };
}

function finiteInteger(value: unknown, path: string, minimum: number, maximum = Number.MAX_SAFE_INTEGER): number {
  const parsed = finiteNumber(value, path, minimum);
  if (!Number.isInteger(parsed) || parsed > maximum) throw invalid(`${path} must be an integer from ${minimum} to ${maximum}`);
  return parsed;
}

function finiteNumber(value: unknown, path: string, minimum = -Number.MAX_VALUE): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) throw invalid(`${path} must be a finite number`);
  return value;
}

function requiredString(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) throw invalid(`${path} must be a non-empty string`);
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(message: string): CountyTownAnchorIndexValidationError {
  return new CountyTownAnchorIndexValidationError(`Invalid county town-anchor index: ${message}.`);
}
