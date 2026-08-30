import { readFileSync } from "node:fs";

import { createGazetteer, type Gazetteer, type GazetteerPlace } from "./gazetteer.js";

type AnchorRecord = {
  label: string;
  latitude: number;
  longitude: number;
  population2024?: number;
  censusPlaceGeoid?: string;
};

type CountyRecord = {
  stateCode: string;
  countyName: string;
  anchors?: AnchorRecord[];
};

type AnchorFile = {
  counties?: Record<string, CountyRecord>;
};

export type AtlasIndex = {
  gazetteer: Gazetteer;
  anchorsFor: (slug: string) => AnchorRecord[];
  identityFor: (slug: string) => { name: string; state: string } | undefined;
  stats: () => { counties: number; places: number };
};

export function loadAtlasIndex(anchorsPath: string): AtlasIndex {
  const parsed = JSON.parse(readFileSync(anchorsPath, "utf8")) as AnchorFile;
  const anchorsBySlug = new Map<string, AnchorRecord[]>();
  const identityBySlug = new Map<string, { name: string; state: string }>();
  const places: GazetteerPlace[] = [];

  for (const [slug, county] of Object.entries(parsed.counties ?? {})) {
    const state = county.stateCode?.toLowerCase() ?? "";
    const countyName = county.countyName ?? slug;
    const anchors = [...(county.anchors ?? [])].sort(
      (left, right) => (right.population2024 ?? 0) - (left.population2024 ?? 0),
    );

    identityBySlug.set(slug, { name: countyName, state });
    anchorsBySlug.set(slug, anchors);
    places.push({
      name: countyName,
      countySlug: slug,
      countyName,
      state,
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
