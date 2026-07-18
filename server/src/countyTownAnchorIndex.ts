import { readFileSync } from "node:fs";
import {
  US_COUNTY_INDEX,
  parseCountyTownAnchorIndex,
  type CountyTownAnchor,
  type CountyTownAnchorIndex,
} from "@atlas/core";

export function loadCountyTownAnchorIndex(path: string): CountyTownAnchorIndex {
  const parsed = parseCountyTownAnchorIndex(JSON.parse(readFileSync(path, "utf8")));
  const indexedBySlug = new Map(US_COUNTY_INDEX.map((county) => [county.countySlug, county]));
  if (parsed.totals.supportedCountyCount !== US_COUNTY_INDEX.length) {
    throw new Error(
      `County town-anchor index covers ${parsed.totals.supportedCountyCount} counties; Atlas indexes ${US_COUNTY_INDEX.length}.`,
    );
  }

  for (const county of US_COUNTY_INDEX) {
    const anchored = parsed.counties[county.countySlug];
    if (!anchored) throw new Error(`County town-anchor index is missing ${county.countySlug}.`);
    if (anchored.geoid !== county.geoid || anchored.stateCode !== county.stateCode || anchored.countyName !== county.name) {
      throw new Error(`County town-anchor identity drift for ${county.countySlug}.`);
    }
  }
  for (const countySlug of Object.keys(parsed.counties)) {
    if (!indexedBySlug.has(countySlug)) throw new Error(`County town-anchor index contains unknown county ${countySlug}.`);
  }
  return parsed;
}

export function townAnchorsForCounty(index: CountyTownAnchorIndex, countySlug: string): CountyTownAnchor[] {
  return index.counties[countySlug]?.anchors.map((anchor) => ({ ...anchor })) ?? [];
}
