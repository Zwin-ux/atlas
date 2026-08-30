import type { GazetteerPlace, Resolution } from "./gazetteer.js";
import type { AtlasIndex } from "./atlasIndex.js";

export const ATLAS_PLACE_QUERY_MAX = 120;
export const ATLAS_PLACE_CANDIDATE_MAX = 8;

export type AtlasPlaceCandidate = {
  name: string;
  countySlug: string;
  countyName: string;
  state: string;
  kind: "place" | "county";
};

export type AtlasPlaceResolution =
  | { status: "resolved"; place: AtlasPlaceCandidate }
  | { status: "ambiguous"; query: string; candidates: AtlasPlaceCandidate[] }
  | { status: "unresolved"; query: string; candidates: AtlasPlaceCandidate[] };

function publicCandidate(place: GazetteerPlace): AtlasPlaceCandidate {
  return {
    name: place.name,
    countySlug: place.countySlug,
    countyName: place.countyName,
    state: place.state,
    kind: place.kind,
  };
}

function normalizeResolution(resolution: Resolution): AtlasPlaceResolution {
  if (resolution.status === "resolved") {
    return { status: "resolved", place: publicCandidate(resolution.place) };
  }
  if (resolution.status === "ambiguous") {
    return {
      status: "ambiguous",
      query: resolution.query,
      candidates: resolution.candidates.slice(0, ATLAS_PLACE_CANDIDATE_MAX).map(publicCandidate),
    };
  }
  return {
    status: "unresolved",
    query: resolution.query,
    candidates: (resolution.nearest ?? []).slice(0, ATLAS_PLACE_CANDIDATE_MAX).map(publicCandidate),
  };
}

export function validateAtlasPlaceQuery(input: string | null): string | undefined {
  const query = input?.trim() ?? "";
  if (!query || query.length > ATLAS_PLACE_QUERY_MAX) return undefined;
  return query;
}

export function createAtlasPlaceSearch(index: AtlasIndex) {
  return {
    search(query: string, limit = ATLAS_PLACE_CANDIDATE_MAX): AtlasPlaceCandidate[] {
      const safeLimit = Math.min(ATLAS_PLACE_CANDIDATE_MAX, Math.max(1, Math.trunc(limit)));
      return index.gazetteer.search(query, safeLimit).map(publicCandidate);
    },
    resolve(query: string): AtlasPlaceResolution {
      return normalizeResolution(index.gazetteer.resolve(query));
    },
  };
}
