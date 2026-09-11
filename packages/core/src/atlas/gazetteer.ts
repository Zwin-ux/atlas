/**
 * The atlas index.
 *
 * A book of maps is only usable because of the index at the back: you look up
 * a name and it tells you which plate to turn to. This is that index over
 * 21,155 Census places and 3,222 counties.
 *
 * It is also the product's quality gate. The standing requirement is that a
 * location ask resolves to the right place or says honestly that it cannot —
 * never confidently wrong. So resolution returns one of exactly three shapes:
 *
 *   resolved              one place, and we are confident it is the one meant
 *   resolved_geography    the query named the nation or a whole state
 *   ambiguous             several real candidates; the caller must ask which
 *   unresolved            nothing matched well enough to name
 *
 * "I don't know" is a first-class answer here, not an error path. The
 * expensive failure for a geography product is confidently naming the wrong
 * county, so every scoring decision below is biased toward admitting doubt.
 * Over-refusal is still a failure, though — an index that shrugs at "Fresno"
 * is useless — so the battery that guards this checks both directions.
 */

export type GazetteerPlace = {
  /** Display name as the Census records it. */
  readonly name: string;
  /** Canonical Atlas county slug this place belongs to. */
  readonly countySlug: string;
  /** County display name. */
  readonly countyName: string;
  /** Two-letter state code, lowercase. */
  readonly state: string;
  readonly lon: number;
  readonly lat: number;
  readonly population: number;
  /** "place" for towns and cities, "county" for the county itself. */
  readonly kind: "place" | "county";
};

export type Resolution =
  | { readonly status: "resolved"; readonly place: GazetteerPlace; readonly confidence: number; readonly matchedOn: string }
  | {
      readonly status: "resolved_geography";
      readonly level: "nation" | "state";
      readonly title: string;
      readonly query: string;
      readonly state?: string;
    }
  | { readonly status: "ambiguous"; readonly candidates: readonly GazetteerPlace[]; readonly query: string }
  | { readonly status: "unresolved"; readonly query: string; readonly nearest?: readonly GazetteerPlace[] };

const NATION_QUERIES = new Set([
  "us",
  "usa",
  "u s",
  "united states",
  "the united states",
  "united states of america",
  "america",
]);

/** Display title for a two-letter state code ("ca" → "California"). */
export function stateTitle(code: string): string {
  const name = STATE_NAMES[code.toLowerCase()];
  if (!name) return code.toUpperCase();
  return name
    .split(" ")
    .map((word) => (word === "of" ? word : `${word[0]!.toUpperCase()}${word.slice(1)}`))
    .join(" ");
}

function matchBareStateCode(folded: string): string | undefined {
  const fromName = NAME_TO_STATE[folded];
  if (fromName) return fromName;
  if (folded.length === 2 && STATE_NAMES[folded]) return folded;
  return undefined;
}

/** US state codes and their names, for parsing "Springfield, Illinois". */
const STATE_NAMES: Record<string, string> = {
  al: "alabama", ak: "alaska", az: "arizona", ar: "arkansas", ca: "california",
  co: "colorado", ct: "connecticut", de: "delaware", dc: "district of columbia",
  fl: "florida", ga: "georgia", hi: "hawaii", id: "idaho", il: "illinois",
  in: "indiana", ia: "iowa", ks: "kansas", ky: "kentucky", la: "louisiana",
  me: "maine", md: "maryland", ma: "massachusetts", mi: "michigan",
  mn: "minnesota", ms: "mississippi", mo: "missouri", mt: "montana",
  ne: "nebraska", nv: "nevada", nh: "new hampshire", nj: "new jersey",
  nm: "new mexico", ny: "new york", nc: "north carolina", nd: "north dakota",
  oh: "ohio", ok: "oklahoma", or: "oregon", pa: "pennsylvania", pr: "puerto rico",
  ri: "rhode island", sc: "south carolina", sd: "south dakota", tn: "tennessee",
  tx: "texas", ut: "utah", vt: "vermont", va: "virginia", wa: "washington",
  wv: "west virginia", wi: "wisconsin", wy: "wyoming",
};

const NAME_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name, code]),
);

/**
 * Thresholds for answering a shared name without a state qualifier.
 * See the "dominant" branch in resolve() for why these are set this high.
 */
const DOMINANT_MIN_POPULATION = 250_000;
const DOMINANT_MIN_RATIO = 20;

/**
 * Fold a name to a comparison key.
 *
 * Strips diacritics (so "Toa Baja" matches a query typed without accents and
 * "Española" matches "Espanola"), lowercases, drops punctuation, and collapses
 * whitespace. Census names also carry parentheticals such as
 * "El Paso de Robles (Paso Robles)" — both halves are indexed separately by
 * the caller, so this only has to normalise one form at a time.
 */
export function foldName(value: string): string {
  return value
    .normalize("NFD")
    // Strip combining marks by Unicode category rather than by a literal
    // character range: the range would be invisible characters in source, which
    // any editor or encoding step can silently corrupt.
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[.'`’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Generic suffixes that carry no identifying information for a place name. */
const PLACE_SUFFIXES = [
  "city",
  "town",
  "village",
  "borough",
  "municipality",
  "cdp",
  "census designated place",
];

const COUNTY_SUFFIXES = ["county", "parish", "borough", "census area", "municipio", "city and borough"];

function stripSuffixes(folded: string, suffixes: readonly string[]): string {
  let result = folded;
  for (const suffix of suffixes) {
    if (result.endsWith(` ${suffix}`)) result = result.slice(0, -(suffix.length + 1)).trim();
  }
  return result;
}

/**
 * Damerau-Levenshtein distance, capped.
 *
 * Capping matters: most comparisons are against names that are nothing like
 * the query, and abandoning those early is what keeps a scan over 18,000
 * entries fast enough to run per keystroke. Transpositions are included
 * because they are the most common typing error ("Riverisde").
 */
export function editDistance(a: string, b: string, cap = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  let beforePrevious = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0]!;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(current[j - 1]! + 1, previous[j]! + 1, previous[j - 1]! + cost);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, beforePrevious[j - 2]! + 1);
      }

      current[j] = value;
      if (value < rowMin) rowMin = value;
    }

    if (rowMin > cap) return cap + 1;

    beforePrevious = previous.slice();
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j]!;
  }

  return previous[b.length]!;
}

type IndexEntry = {
  readonly key: string;
  readonly place: GazetteerPlace;
};

export type Gazetteer = {
  resolve: (query: string) => Resolution;
  search: (query: string, limit?: number) => GazetteerPlace[];
  size: () => { places: number; counties: number; keys: number };
};

export type GazetteerInput = {
  readonly places: readonly GazetteerPlace[];
};

/**
 * Parse a trailing state qualifier: "Springfield, IL", "Springfield Illinois".
 * Returns the bare name and the state code when one was found.
 */
function splitStateQualifier(folded: string): { name: string; state?: string } {
  // Two-letter code at the end.
  const codeMatch = /^(.*?)\s+([a-z]{2})$/.exec(folded);
  if (codeMatch && STATE_NAMES[codeMatch[2]!]) {
    return { name: codeMatch[1]!.trim(), state: codeMatch[2]! };
  }

  // Full state name at the end, longest first so "west virginia" beats "virginia".
  const names = Object.keys(NAME_TO_STATE).sort((a, b) => b.length - a.length);
  for (const stateName of names) {
    if (folded.endsWith(` ${stateName}`)) {
      return { name: folded.slice(0, -(stateName.length + 1)).trim(), state: NAME_TO_STATE[stateName]! };
    }
  }

  return { name: folded };
}

export function createGazetteer(input: GazetteerInput): Gazetteer {
  const byKey = new Map<string, IndexEntry[]>();
  const entries: IndexEntry[] = [];

  function addKey(key: string, place: GazetteerPlace) {
    if (!key) return;
    const entry = { key, place };
    entries.push(entry);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(entry);
    else byKey.set(key, [entry]);
  }

  for (const place of input.places) {
    const folded = foldName(place.name);
    addKey(folded, place);

    // Census names carry alternates in parentheses; index both halves so the
    // shorter everyday name ("Paso Robles") resolves as readily as the formal
    // one ("El Paso de Robles").
    const parenthetical = /^(.*?)\s*\((.*?)\)\s*$/.exec(place.name);
    if (parenthetical) {
      addKey(foldName(parenthetical[1]!), place);
      addKey(foldName(parenthetical[2]!), place);
    }

    const suffixes = place.kind === "county" ? COUNTY_SUFFIXES : PLACE_SUFFIXES;
    const stripped = stripSuffixes(folded, suffixes);
    if (stripped !== folded) addKey(stripped, place);
  }

  /** Prefer the larger place when several share a name within one state. */
  function byPopulation(a: GazetteerPlace, b: GazetteerPlace): number {
    return b.population - a.population || a.name.localeCompare(b.name);
  }

  /**
   * Several hits that all sit in the same county are one location, not a
   * choice. "Riverside" matches both the city and Riverside County; asking the
   * reader which they meant is over-refusal, because both turn to the same
   * plate. Returns the settlement when there is one — a bare place name
   * usually means the town — otherwise the county.
   */
  function collapseSameLocation(hits: readonly GazetteerPlace[]): GazetteerPlace | undefined {
    if (hits.length < 2) return undefined;
    const slug = hits[0]!.countySlug;
    if (!hits.every((hit) => hit.countySlug === slug)) return undefined;
    return hits.find((hit) => hit.kind === "place") ?? hits[0];
  }

  function lookupExact(key: string, state?: string): GazetteerPlace[] {
    const bucket = byKey.get(key) ?? [];
    const places = bucket.map((entry) => entry.place);
    const filtered = state ? places.filter((place) => place.state === state) : places;
    // The same place can be indexed under several keys; de-duplicate.
    const seen = new Set<string>();
    const unique: GazetteerPlace[] = [];
    for (const place of filtered) {
      const id = `${place.kind}:${place.countySlug}:${place.name}`;
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(place);
    }
    return unique.sort(byPopulation);
  }

  function resolve(query: string): Resolution {
    const raw = (query ?? "").trim();
    if (!raw) return { status: "unresolved", query: raw };

    const folded = foldName(raw);
    if (!folded) return { status: "unresolved", query: raw };

    if (NATION_QUERIES.has(folded)) {
      return { status: "resolved_geography", level: "nation", title: "United States", query: raw };
    }

    const { name, state } = splitStateQualifier(folded);

    const bareState = matchBareStateCode(folded);
    if (bareState) {
      const stateNameHits = lookupExact(folded);
      const hitStates = new Set(stateNameHits.map((hit) => hit.state));
      // A lone namesake (Indiana, PA) must not beat the state. A name used as
      // many real cities across states (Washington) stays a choice.
      if (hitStates.size <= 1) {
        return {
          status: "resolved_geography",
          level: "state",
          state: bareState,
          title: stateTitle(bareState),
          query: raw,
        };
      }
    }

    // 1. Exact match on the full string, then on the state-stripped name.
    for (const [key, stateFilter] of [
      [folded, undefined],
      [name, state],
    ] as const) {
      const hits = lookupExact(key, stateFilter);
      if (hits.length === 1) {
        return { status: "resolved", place: hits[0]!, confidence: 1, matchedOn: "exact" };
      }
      if (hits.length > 1) {
        const collapsed = collapseSameLocation(hits);
        if (collapsed) {
          return { status: "resolved", place: collapsed, confidence: 0.95, matchedOn: "same-location" };
        }
        // A county's population is the sum of its town anchors, so ranking a
        // county against a town inside the same state is not a comparison
        // between peers — it is an aggregate against one of its own members,
        // and the aggregate always wins. "Kane, IL" would answer Kane County
        // over the village of Kane every time, on arithmetic alone. When a
        // state was named and the largest hit is a county sitting above a real
        // settlement, the size gap carries no information about which one was
        // meant, so ask.
        if (stateFilter && hits[0]!.kind === "county" && hits.some((hit) => hit.kind === "place")) {
          return { status: "ambiguous", candidates: hits.slice(0, 8), query: raw };
        }
        // A name shared by several places is ambiguous, and the honest answer
        // is to ask which one. The single exception is a city so large that
        // the bare name has one meaning in practice: nobody typing "Chicago"
        // means Chicago, Maine.
        //
        // The bar is deliberately high — 250,000 people and 20x the runner-up.
        // An earlier, looser rule (50,000 and 8x) turned "Sherman" into Sherman,
        // Texas and "Elgin" into Elgin, Illinois, producing confidently wrong
        // answers for every other Sherman and Elgin in the country. Being
        // occasionally unhelpful is recoverable; being confidently wrong about
        // where a place is is not.
        const [first, second] = hits;
        if (
          first &&
          second &&
          first.population >= DOMINANT_MIN_POPULATION &&
          first.population >= second.population * DOMINANT_MIN_RATIO
        ) {
          return { status: "resolved", place: first, confidence: 0.8, matchedOn: "dominant" };
        }
        return { status: "ambiguous", candidates: hits.slice(0, 8), query: raw };
      }
    }

    // 2. Near match, for misspellings.
    //
    //    The cap scales with name length, and short names get no fuzzy match
    //    at all. One edit inside a three-letter name is not a typo, it is a
    //    different place: "Ida" must never come back as "Ada", "Erie" must
    //    never come back as "Eric". Long names carry enough signal that a
    //    one- or two-character fix is safe.
    const target = name || folded;
    const cap = target.length <= 4 ? 0 : target.length <= 7 ? 1 : 2;
    if (cap === 0) {
      return { status: "unresolved", query: raw, nearest: search(raw, 3) };
    }

    let best: { distance: number; places: GazetteerPlace[] } | undefined;

    for (const key of byKey.keys()) {
      const distance = editDistance(target, key, cap);
      if (distance > cap) continue;
      if (!best || distance < best.distance) {
        best = { distance, places: lookupExact(key, state) };
      } else if (distance === best.distance) {
        best.places.push(...lookupExact(key, state));
      }
    }

    if (best && best.places.length > 0) {
      const unique = best.places
        .filter((place, index, all) => all.findIndex((other) => other.countySlug === place.countySlug && other.name === place.name) === index)
        .sort(byPopulation);

      if (unique.length === 1) {
        // Confidence falls with edit distance: a one-character fix is close to
        // certain, two characters is a guess worth flagging.
        return {
          status: "resolved",
          place: unique[0]!,
          confidence: best.distance === 1 ? 0.9 : 0.75,
          matchedOn: `near:${best.distance}`,
        };
      }
      const collapsed = collapseSameLocation(unique);
      if (collapsed) {
        return { status: "resolved", place: collapsed, confidence: 0.85, matchedOn: `near:${best.distance}` };
      }
      return { status: "ambiguous", candidates: unique.slice(0, 8), query: raw };
    }

    // 3. Nothing close enough. Offer the least-bad options as suggestions, but
    //    do not claim any of them — this is the honest-refusal path.
    return { status: "unresolved", query: raw, nearest: search(raw, 3) };
  }

  /** Prefix/substring search for suggestions. Never used to claim a match. */
  function search(query: string, limit = 8): GazetteerPlace[] {
    const folded = foldName(query);
    if (!folded) return [];
    const { name, state } = splitStateQualifier(folded);
    const needle = name || folded;

    const scored: Array<{ place: GazetteerPlace; score: number }> = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      if (state && entry.place.state !== state) continue;
      let score = -1;
      if (entry.key === needle) score = 3;
      else if (entry.key.startsWith(needle)) score = 2;
      else if (entry.key.includes(needle)) score = 1;
      if (score < 0) continue;

      const id = `${entry.place.kind}:${entry.place.countySlug}:${entry.place.name}`;
      if (seen.has(id)) continue;
      seen.add(id);
      scored.push({ place: entry.place, score });
    }

    return scored
      .sort((a, b) => b.score - a.score || byPopulation(a.place, b.place))
      .slice(0, limit)
      .map((item) => item.place);
  }

  return {
    resolve,
    search,
    size: () => ({
      places: input.places.filter((place) => place.kind === "place").length,
      counties: input.places.filter((place) => place.kind === "county").length,
      keys: byKey.size,
    }),
  };
}
