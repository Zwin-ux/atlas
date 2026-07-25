import { describe, expect, it } from "vitest";
import { createGazetteer, editDistance, foldName, type GazetteerPlace } from "../src/atlas/gazetteer.js";

function place(
  name: string,
  countySlug: string,
  state: string,
  population: number,
  kind: "place" | "county" = "place",
): GazetteerPlace {
  return {
    name,
    countySlug,
    countyName: `${countySlug} County`,
    state,
    lon: -100,
    lat: 40,
    population,
    kind,
  };
}

const FIXTURE: GazetteerPlace[] = [
  place("Riverside", "riverside-ca", "ca", 314_998),
  place("Eastvale", "riverside-ca", "ca", 71_000),
  place("Fresno", "fresno-ca", "ca", 545_000),
  place("Los Angeles", "los-angeles-ca", "ca", 3_900_000),
  // The Springfield problem: many real places, none dominant.
  place("Springfield", "sangamon-il", "il", 114_000),
  place("Springfield", "greene-mo", "mo", 169_000),
  place("Springfield", "hampden-ma", "ma", 155_000),
  place("Springfield", "clark-oh", "oh", 58_000),
  // Diacritics.
  place("Española", "rio-arriba-nm", "nm", 10_000),
  place("Toa Baja", "toa-baja-pr", "pr", 74_000),
  // Census parenthetical alternate name.
  place("El Paso de Robles (Paso Robles)", "san-luis-obispo-ca", "ca", 31_000),
  // Short names that must not collapse into each other.
  place("Ada", "ada-ok", "ok", 16_000),
  place("Ida Grove", "ida-ia", "ia", 2_000),
  // A dominant place sharing a name with a tiny one.
  place("Houston", "harris-tx", "tx", 2_300_000),
  place("Houston", "chickasaw-ms", "ms", 3_500),
  place("Riverside County", "riverside-ca", "ca", 2_400_000, "county"),
  place("Kalawao County", "kalawao-hi", "hi", 82, "county"),
];

const gazetteer = createGazetteer({ places: FIXTURE });

describe("foldName", () => {
  it("strips diacritics so accented names match unaccented queries", () => {
    expect(foldName("Española")).toBe("espanola");
    expect(foldName("Toa Baja")).toBe("toa baja");
  });

  it("normalises punctuation and case", () => {
    expect(foldName("St. Mary's")).toBe("st marys");
    expect(foldName("  LOS   ANGELES  ")).toBe("los angeles");
  });
});

describe("editDistance", () => {
  it("counts substitutions, insertions, and transpositions", () => {
    expect(editDistance("riverside", "riverside")).toBe(0);
    expect(editDistance("riverside", "riverisde")).toBe(1); // transposition
    expect(editDistance("fresno", "fresmo")).toBe(1);
    expect(editDistance("fresno", "freson")).toBe(1);
  });

  it("bails out past the cap instead of computing a large distance", () => {
    expect(editDistance("aaa", "zzzzzzzzzzzz", 3)).toBeGreaterThan(3);
  });
});

describe("resolution — right or honest", () => {
  it("resolves an unambiguous exact name", () => {
    const result = gazetteer.resolve("Fresno");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("fresno-ca");
    expect(result.confidence).toBe(1);
  });

  it("resolves a name typed without its diacritics", () => {
    const result = gazetteer.resolve("Espanola");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("rio-arriba-nm");
  });

  it("resolves a Census parenthetical alternate name", () => {
    const result = gazetteer.resolve("Paso Robles");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("san-luis-obispo-ca");
  });

  it("refuses to guess between equally real candidates", () => {
    const result = gazetteer.resolve("Springfield");
    expect(result.status).toBe("ambiguous");
    if (result.status !== "ambiguous") return;
    expect(result.candidates.length).toBeGreaterThanOrEqual(4);
    // Every candidate must be a real, distinct place — not padding.
    const states = new Set(result.candidates.map((candidate) => candidate.state));
    expect(states.size).toBeGreaterThanOrEqual(4);
  });

  it("disambiguates when the query names a state", () => {
    const result = gazetteer.resolve("Springfield, IL");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.state).toBe("il");

    const spelled = gazetteer.resolve("Springfield Missouri");
    expect(spelled.status).toBe("resolved");
    if (spelled.status !== "resolved") return;
    expect(spelled.place.state).toBe("mo");
  });

  it("takes the dominant place only when it is overwhelmingly larger", () => {
    // Houston TX is ~650x Houston MS: that is not a coin flip.
    const houston = gazetteer.resolve("Houston");
    expect(houston.status).toBe("resolved");
    if (houston.status !== "resolved") return;
    expect(houston.place.state).toBe("tx");

    // The Springfields are within 3x of each other, so it must not pick one.
    expect(gazetteer.resolve("Springfield").status).toBe("ambiguous");
  });

  it("corrects a misspelling of a long name", () => {
    const result = gazetteer.resolve("Riverisde");
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.place.countySlug).toBe("riverside-ca");
    expect(result.confidence).toBeLessThan(1);
  });

  it("does not silently convert one short name into a different one", () => {
    // "Ada" and "Ida" are one edit apart but are different real places. The
    // index must not answer "Ada" when asked for "Ida".
    const result = gazetteer.resolve("Ida");
    if (result.status === "resolved") {
      expect(result.place.name).not.toBe("Ada");
    }
  });

  it("refuses nonsense instead of reaching for the nearest name", () => {
    const result = gazetteer.resolve("Zzyzxqqq");
    expect(result.status).toBe("unresolved");
  });

  it("refuses an empty query", () => {
    expect(gazetteer.resolve("").status).toBe("unresolved");
    expect(gazetteer.resolve("   ").status).toBe("unresolved");
  });

  it("resolves counties, including the smallest in the country", () => {
    const kalawao = gazetteer.resolve("Kalawao County");
    expect(kalawao.status).toBe("resolved");
    if (kalawao.status !== "resolved") return;
    expect(kalawao.place.kind).toBe("county");

    // The bare county name works too.
    expect(gazetteer.resolve("Kalawao").status).toBe("resolved");
  });

  it("never returns a place from the wrong state when one was named", () => {
    const result = gazetteer.resolve("Fresno, TX");
    // There is no Fresno in the fixture's Texas, so it must not hand back the
    // California one. Confidently wrong is the failure mode that matters.
    if (result.status === "resolved") {
      expect(result.place.state).toBe("tx");
    } else {
      expect(["ambiguous", "unresolved"]).toContain(result.status);
    }
  });
});

describe("search", () => {
  it("offers prefix suggestions ranked by size", () => {
    const results = gazetteer.search("River");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.name).toMatch(/Riverside/);
  });

  it("returns nothing for an empty query", () => {
    expect(gazetteer.search("")).toEqual([]);
  });
});

describe("index shape", () => {
  it("counts places and counties separately", () => {
    const size = gazetteer.size();
    expect(size.places).toBe(FIXTURE.filter((p) => p.kind === "place").length);
    expect(size.counties).toBe(FIXTURE.filter((p) => p.kind === "county").length);
    expect(size.keys).toBeGreaterThan(size.places);
  });
});
