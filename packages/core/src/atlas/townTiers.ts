/**
 * Town label hierarchy for county plates.
 *
 * A county plate with dozens of equal-weight dots is not an atlas — it is a
 * scatter plot. Printed maps always rank: the seat (or dominant city) is
 * heavier, the next towns are medium, and the rest only appear when there
 * is room (or the reader has zoomed in).
 *
 * We do not yet ship an official county-seat table. Seats are inferred:
 *   1. name match against the county stem ("Riverside" in "Riverside County")
 *   2. otherwise the largest place by population
 *
 * That is good enough for orientation and honest when labelled as inferred.
 * When a real seat source lands, swap the resolver without touching the tiers.
 */

import { foldName } from "./gazetteer.js";

export type TownTier = "seat" | "primary" | "secondary";

export type TieredTown = {
  name: string;
  lon: number;
  lat: number;
  population: number;
  tier: TownTier;
  /** Placement weight — higher wins collision. */
  importance: number;
  /** How the seat was chosen when tier is seat. */
  seatSource?: "name" | "largest" | "only";
};

export type TownAnchorInput = {
  name: string;
  lon: number;
  lat: number;
  population?: number;
};

const SEAT_IMPORTANCE = 1_000_000_000_000;
const PRIMARY_IMPORTANCE = 1_000_000_000;
/** How many non-seat towns stay "primary" at county overview. */
const PRIMARY_COUNT = 8;

/**
 * Strip administrative suffixes so "Riverside County" → "riverside",
 * "Orleans Parish" → "orleans", "Juneau City and Borough" → "juneau".
 */
export function countyStem(countyName: string): string {
  return foldName(countyName)
    .replace(
      /\b(county|parish|borough|census area|municipality|city and borough|city|district of)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function nameLooksLikeSeat(placeName: string, stem: string): boolean {
  if (!stem) return false;
  const place = foldName(placeName);
  if (!place) return false;
  if (place === stem) return true;

  // "Miami" in "miami dade", "San Francisco" exact after fold.
  const stemParts = stem.split(" ").filter(Boolean);
  if (stemParts.length > 1 && place === stemParts[0]) return true;

  // Whole-word containment either direction, short enough to avoid
  // "York" matching "New York" incorrectly via partial noise — require
  // the shorter string to be a full token of the longer.
  const placeParts = place.split(" ").filter(Boolean);
  if (stemParts.includes(place)) return true;
  if (placeParts.length === 1 && stemParts.some((part) => part === placeParts[0])) return true;
  if (placeParts.length > 1 && placeParts.every((part) => stemParts.includes(part))) return true;

  // "Urban Honolulu" / "East Honolulu" for Honolulu County — the stem is the
  // final token of the place name. Prefer these over pure population fallback.
  if (placeParts.length > 1 && placeParts[placeParts.length - 1] === stem) return true;
  if (stemParts.length === 1 && placeParts.includes(stemParts[0]!)) return true;

  return false;
}

/**
 * Coarse match quality only — do not encode name length here.
 * Population breaks ties (Urban Honolulu 350k beats East Honolulu CDP).
 */
function seatMatchScore(placeName: string, stem: string): number {
  const place = foldName(placeName);
  if (!place || !stem) return 0;
  if (place === stem) return 3;
  const placeParts = place.split(" ").filter(Boolean);
  if (placeParts.length > 1 && placeParts[placeParts.length - 1] === stem) return 2;
  if (place.startsWith(`${stem} `)) return 2;
  if (nameLooksLikeSeat(placeName, stem)) return 1;
  return 0;
}

/**
 * Rank anchors into seat / primary / secondary for a single county plate.
 *
 * Deterministic: same inputs → same tiers every time.
 */
export function classifyTownAnchors(countyName: string, anchors: readonly TownAnchorInput[]): TieredTown[] {
  if (anchors.length === 0) return [];

  const stem = countyStem(countyName);
  const ranked = anchors
    .map((anchor) => ({
      name: anchor.name,
      lon: anchor.lon,
      lat: anchor.lat,
      population: Math.max(0, Math.floor(anchor.population ?? 0)),
    }))
    .sort((a, b) => b.population - a.population || a.name.localeCompare(b.name));

  let seatIndex = -1;
  let bestWeighted = Number.NEGATIVE_INFINITY;
  ranked.forEach((anchor, index) => {
    const score = seatMatchScore(anchor.name, stem);
    if (score <= 0) return;
    // Name-match first; among matches prefer larger places, then prefer
    // "Urban/City" forms over directional CDPs (East/West Honolulu).
    const first = foldName(anchor.name).split(" ")[0] ?? "";
    const formBonus =
      first === "urban" || first === "city"
        ? 50_000
        : ["east", "west", "north", "south", "upper", "lower"].includes(first)
          ? -50_000
          : 0;
    const weighted = score * 1_000_000_000 + anchor.population + formBonus;
    if (weighted > bestWeighted) {
      bestWeighted = weighted;
      seatIndex = index;
    }
  });
  let seatSource: "name" | "largest" | "only" = "name";
  if (seatIndex < 0 || bestWeighted < 0) {
    seatIndex = 0;
    seatSource = ranked.length === 1 ? "only" : "largest";
  }

  // Guard denser anchor lists: a namesake village ("Sedgwick" in Sedgwick
  // County) must not beat the real lead city (Wichita). If the name match is
  // under 20% of the largest place's population, the largest place is the seat.
  if (seatIndex > 0 && ranked.length > 1) {
    const candidate = ranked[seatIndex]!;
    const largest = ranked[0]!;
    if (largest.population > 0 && candidate.population * 5 < largest.population) {
      seatIndex = 0;
      seatSource = "largest";
    }
  }

  const seat = ranked[seatIndex]!;
  const rest = ranked.filter((_, index) => index !== seatIndex);

  const result: TieredTown[] = [
    {
      ...seat,
      tier: "seat",
      importance: SEAT_IMPORTANCE + seat.population,
      seatSource,
    },
  ];

  rest.forEach((anchor, index) => {
    if (index < PRIMARY_COUNT) {
      result.push({
        ...anchor,
        tier: "primary",
        importance: PRIMARY_IMPORTANCE + anchor.population,
      });
    } else {
      result.push({
        ...anchor,
        tier: "secondary",
        importance: anchor.population,
      });
    }
  });

  // Stable order for the wire: seat first, then primary by pop, then secondary.
  return result.sort((a, b) => {
    const tierRank = { seat: 0, primary: 1, secondary: 2 } as const;
    return tierRank[a.tier] - tierRank[b.tier] || b.population - a.population || a.name.localeCompare(b.name);
  });
}
