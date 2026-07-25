/**
 * Builds the atlas index from the Census datasets on disk.
 *
 * One loader, used by both the running server and the Location Truth battery,
 * so the gate tests exactly the index the product ships. A verifier that built
 * its own index would be certifying something nobody uses.
 */

import { readFileSync } from "node:fs";

import { createGazetteer, type Gazetteer, type GazetteerPlace } from "@atlas/core/atlas";

type AnchorRecord = {
  label: string;
  latitude: number;
  longitude: number;
  population2024?: number;
  kind?: string;
};

type CountyRecord = {
  geoid: string;
  stateCode: string;
  countyName: string;
  anchors?: AnchorRecord[];
};

type AnchorFile = {
  counties?: Record<string, CountyRecord>;
};

/**
 * Derive the Atlas county slug used everywhere else from the anchor file key.
 * The anchor file is already keyed by slug, so this is identity — but stating
 * it keeps the assumption visible if the file format ever changes.
 */
function slugOf(key: string): string {
  return key;
}

export type AtlasIndex = {
  gazetteer: Gazetteer;
  /** Town anchors for one county, largest first. */
  anchorsFor: (slug: string) => AnchorRecord[];
  identityFor: (slug: string) => { name: string; state: string } | undefined;
  stats: () => { counties: number; places: number };
};

export function loadAtlasIndex(anchorsPath: string): AtlasIndex {
  const parsed = JSON.parse(readFileSync(anchorsPath, "utf8")) as AnchorFile;
  const counties = parsed.counties ?? {};

  const anchorsBySlug = new Map<string, AnchorRecord[]>();
  const identityBySlug = new Map<string, { name: string; state: string }>();
  const places: GazetteerPlace[] = [];

  for (const [key, county] of Object.entries(counties)) {
    const slug = slugOf(key);
    const state = county.stateCode?.toLowerCase() ?? "";
    const countyName = county.countyName ?? slug;

    identityBySlug.set(slug, { name: countyName, state });

    const anchors = [...(county.anchors ?? [])].sort(
      (a, b) => (b.population2024 ?? 0) - (a.population2024 ?? 0),
    );
    anchorsBySlug.set(slug, anchors);

    // The county itself is an index entry: readers look up "Riverside County"
    // as readily as they look up a town in it.
    places.push({
      name: countyName,
      countySlug: slug,
      countyName,
      state,
      // A county's own coordinates are taken from its largest place, which is
      // close enough to centre a plate on and avoids shipping centroids.
      lon: anchors[0]?.longitude ?? 0,
      lat: anchors[0]?.latitude ?? 0,
      population: anchors.reduce((total, anchor) => total + (anchor.population2024 ?? 0), 0),
      kind: "county",
    });

    for (const anchor of anchors) {
      places.push({
        name: anchor.label,
        countySlug: slug,
        countyName,
        state,
        lon: anchor.longitude,
        lat: anchor.latitude,
        population: anchor.population2024 ?? 0,
        kind: "place",
      });
    }
  }

  return {
    gazetteer: createGazetteer({ places }),
    anchorsFor: (slug) => anchorsBySlug.get(slug) ?? [],
    identityFor: (slug) => identityBySlug.get(slug),
    stats: () => ({
      counties: identityBySlug.size,
      places: places.filter((place) => place.kind === "place").length,
    }),
  };
}
