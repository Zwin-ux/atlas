/**
 * County-versus-town ambiguity, against the real Census anchor file.
 *
 * A county entry's population is the SUM of its town anchors, so ranking a
 * county against a settlement inside the same state compares an aggregate to
 * one of its own members. The aggregate always wins on arithmetic, which used
 * to make "Kane, IL" answer Kane County over the village of Kane with 0.8
 * confidence — the confidently-wrong failure the product forbids.
 *
 * These run on the shipped data rather than a fixture: the bug was a property
 * of real population sums, and a hand-built fixture would only prove the
 * fixture. The sibling atlas-gazetteer.test.ts covers resolver mechanics.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createGazetteer, type GazetteerPlace } from "../src/atlas/gazetteer.js";

type AnchorRecord = { label: string; latitude: number; longitude: number; population2024?: number };
type CountyRecord = { stateCode?: string; countyName?: string; anchors?: AnchorRecord[] };

const here = dirname(fileURLToPath(import.meta.url));
const anchorPath = resolvePath(here, "../../../data/census/us-county-town-anchors.json");

/** Mirrors server/src/atlasIndex.ts so this tests the index the product ships. */
function buildPlaces(): GazetteerPlace[] {
  const parsed = JSON.parse(readFileSync(anchorPath, "utf8")) as {
    counties?: Record<string, CountyRecord>;
  };
  const places: GazetteerPlace[] = [];

  for (const [slug, county] of Object.entries(parsed.counties ?? {})) {
    const state = county.stateCode?.toLowerCase() ?? "";
    const countyName = county.countyName ?? slug;
    const anchors = [...(county.anchors ?? [])].sort(
      (a, b) => (b.population2024 ?? 0) - (a.population2024 ?? 0),
    );

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

  return places;
}

const gazetteer = createGazetteer({ places: buildPlaces() });

describe("a county must not outrank a town inside its own state", () => {
  it.each([
    ["Kane, IL", "kane-il", "greene-il"],
    ["Maricopa, AZ", "maricopa-az", "pinal-az"],
    ["Pima, AZ", "pima-az", "graham-az"],
    ["Nassau, NY", "nassau-ny", "rensselaer-ny"],
    ["Hamilton, IN", "hamilton-in", "steuben-in"],
  ])("refuses to guess %s", (query, countySlug, townSlug) => {
    const result = gazetteer.resolve(query);
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") return;

    // The county is still the largest hit and still leads the list — the fix
    // is that leading no longer means winning.
    expect(result.candidates[0]?.kind).toBe("county");
    expect(result.candidates[0]?.countySlug).toBe(countySlug);

    // The settlement that the aggregate used to bury must be offered too,
    // otherwise the refusal is a dead end rather than a question.
    const town = result.candidates.find((candidate) => candidate.kind === "place");
    expect(town?.countySlug).toBe(townSlug);
  });

  it("still spells the state out as well as abbreviating it", () => {
    expect(gazetteer.resolve("Kane, Illinois").status).toBe("ambiguous");
  });
});

describe("the fix must not silence places that legitimately resolve", () => {
  it("keeps Houston, Texas on Harris County", () => {
    // A literal reading of the rule — refuse whenever a county shares the name —
    // broke this. Houston, TX outranks Houston County, TX by three orders of
    // magnitude, so the town leads the list and the dominance rule still applies.
    const result = gazetteer.resolve("Houston, Texas");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("harris-tx");
    expect(result.place.kind).toBe("place");
  });

  it("keeps a city and its like-named county collapsing to one answer", () => {
    // Riverside the city and Riverside County are the same plate, so asking
    // which was meant would be over-refusal, not honesty.
    const result = gazetteer.resolve("Riverside, CA");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("riverside-ca");
    expect(result.matchedOn).toBe("same-location");
  });

  it.each([
    ["Cook County, Illinois", "cook-il"],
    ["Miami-Dade County", "miami-dade-fl"],
    ["Sedgwick County", "sedgwick-ks"],
    ["Orleans Parish", "orleans-parish-la"],
  ])("keeps the county lookup %s working", (query, countySlug) => {
    const result = gazetteer.resolve(query);
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe(countySlug);
  });
});

describe("the denser anchor file must not be fuzzy-matched away", () => {
  it.each([
    ["Dana Point", "orange-ca"],
    ["Covina", "los-angeles-ca"],
    ["La Habra", "orange-ca"],
  ])("resolves %s exactly rather than reaching for a similar name", (query, countySlug) => {
    // Before the 21,155-anchor rebuild these fell through to the fuzzy path and
    // came back as Sand Point ALASKA, Bovina TEXAS and La Jara COLORADO — all at
    // 0.8 confidence. They are exact hits now and must stay exact.
    const result = gazetteer.resolve(query);
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe(countySlug);
    expect(result.matchedOn).toBe("exact");
  });
});

describe("the dominance thresholds are load-bearing", () => {
  it.each([
    ["Monmouth", "monmouth-nj"],
    ["Summit", "summit-oh"],
    ["Ramsey", "ramsey-mn"],
  ])("does not let a county aggregate win the bare name %s", (query, countySlug) => {
    // These are the same county-beats-town arithmetic on an unqualified query,
    // where the state-filtered guard above cannot reach. They are held off only
    // by DOMINANT_MIN_POPULATION (250,000) and DOMINANT_MIN_RATIO (20).
    // Measured: dropping the ratio to 15 answers Summit and Ramsey with the
    // county; dropping the floor to 230,000 answers Monmouth with the county.
    const result = gazetteer.resolve(query);
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") return;
    expect(result.candidates[0]?.countySlug).toBe(countySlug);
    expect(result.candidates[0]?.kind).toBe("county");
  });

  it.each(["Sherman", "Elgin", "Springfield"])(
    "still refuses the shared name %s that a looser bar used to guess",
    (query) => {
      expect(gazetteer.resolve(query).status).toBe("ambiguous");
    },
  );

  it("still answers a name one city genuinely owns", () => {
    const result = gazetteer.resolve("Chicago");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("cook-il");
  });
});

describe("Eastvale — the submission starter prompt", () => {
  it("resolves when the state is given", () => {
    const result = gazetteer.resolve("Eastvale, CA");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("riverside-ca");
  });

  it("is never confidently wrong about the bare name", () => {
    // OPEN DECISION, not a settled behaviour. The 21,155-anchor rebuild added
    // Eastvale, PA (175 people) alongside Eastvale, CA (70,751), so the bare
    // name is now ambiguous where it used to resolve. No dominance threshold
    // recovers it without pushing confidently-wrong above the accepted 20:
    // the bar would have to drop to 70,751, and the cheapest such setting
    // scores 24 and fails five battery classes. The options are to qualify the
    // starter prompt as "Eastvale, CA" or to drop the anchor rebuild.
    //
    // What this test pins is the part that is not negotiable: whichever way
    // that goes, the bare name must never name the wrong county.
    const result = gazetteer.resolve("Eastvale");
    if (result.status === "resolved") {
      expect(result.place.countySlug).toBe("riverside-ca");
      return;
    }
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") return;
    expect(result.candidates[0]?.countySlug).toBe("riverside-ca");
  });
});
