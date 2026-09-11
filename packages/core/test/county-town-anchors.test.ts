import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COUNTY_TOWN_ANCHOR_UPDATE_ID,
  CountyPackService,
  CountyQuestionService,
  US_COUNTY_INDEX,
  compileCountyGeoScene,
  createDeterministicGeneratedDistrictScene,
  parseCountyTownAnchorIndex,
  type CountyGeoPack,
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(here, "../../../data");
const index = parseCountyTownAnchorIndex(
  JSON.parse(readFileSync(resolve(dataRoot, "census/us-county-town-anchors.json"), "utf8")),
);

function county(slug: string) {
  const value = US_COUNTY_INDEX.find((candidate) => candidate.countySlug === slug);
  if (!value) throw new Error(`Missing county fixture ${slug}.`);
  return value;
}

describe("national Census town-anchor contract", () => {
  it("covers every supported county with a real named anchor", () => {
    expect(index.totals.supportedCountyCount).toBe(US_COUNTY_INDEX.length);
    expect(index.totals.coveredCountyCount).toBe(3_222);
    expect(index.totals.anchorCount).toBe(21_155);
    expect(index.method.maximumAnchorsPerCounty).toBe(40);
    expect(Object.keys(index.counties)).toHaveLength(US_COUNTY_INDEX.length);

    for (const supported of US_COUNTY_INDEX) {
      const anchored = index.counties[supported.countySlug];
      expect(anchored, supported.countySlug).toBeDefined();
      expect(anchored?.geoid).toBe(supported.geoid);
      expect(anchored?.anchors.length).toBeGreaterThan(0);
      for (const anchor of anchored?.anchors ?? []) {
        expect(anchor.label).not.toMatch(/balance of/i);
        expect(Number.isFinite(anchor.latitude)).toBe(true);
        expect(Number.isFinite(anchor.longitude)).toBe(true);
      }
    }
  });

  it("holds representative metro, frontier, island, and federal-district anchors", () => {
    expect(index.counties["miami-dade-fl"]?.anchors.map((anchor) => anchor.label)).toEqual(
      expect.arrayContaining(["Miami", "Homestead"]),
    );
    expect(index.counties["loving-tx"]?.anchors[0]?.label).toBe("Mentone");
    expect(index.counties["honolulu-hi"]?.anchors.map((anchor) => anchor.label)).toContain("Urban Honolulu");
    expect(index.counties["kalawao-hi"]?.anchors[0]?.label).toBe("Kalawao");
    expect(index.counties["district-of-columbia-dc"]?.anchors[0]?.label).toBe("Washington");
  });

  it("renders town names on generated previews without claiming local layout truth", () => {
    const anchors = index.counties["miami-dade-fl"]!.anchors;
    const { generated, result } = createDeterministicGeneratedDistrictScene({
      county: county("miami-dade-fl"),
      townAnchors: anchors,
    });

    expect(generated.sourceBasis).toBe("census_identity_and_town_anchors");
    expect(generated.townAnchorUpdate).toBe(COUNTY_TOWN_ANCHOR_UPDATE_ID);
    expect(result.scene.places.map((place) => place.label)).toEqual(expect.arrayContaining(["Miami", "Homestead"]));
    expect(result.scene.places.find((place) => place.label === "Homestead")?.id).toMatch(/^town-anchor-/);
    expect(result.scene.coverage.coverageMessage).toContain("Real Census town names");
    expect(result.scene.coverage.playable).toBe(false);

    const answer = new CountyQuestionService(new CountyPackService(resolve(dataRoot, "county_packs"))).answer({
      countySlug: "miami-dade-fl",
      question: "Where is Homestead?",
      generatedScene: result.scene,
      generatedCountyLabel: result.scene.region.county,
    });
    expect(answer.supported).toBe(true);
    expect(answer.targetLabel).toBe("Homestead");
    expect(answer.sourceNotes[0]?.sourceType).toBe("us_census_tigerweb");
    expect(answer.answer).toContain("real U.S. Census place name");
    expect(answer.answer).toContain("generated, not verified local geography");
  });

  it("places Census anchors on an exact county board when a geo pack exists", () => {
    const pack = JSON.parse(readFileSync(resolve(dataRoot, "geo-packs/miami-dade-fl.json"), "utf8")) as CountyGeoPack;
    const scene = compileCountyGeoScene(pack, { townAnchors: index.counties["miami-dade-fl"]!.anchors });

    expect(scene.places.map((place) => place.label)).toEqual(expect.arrayContaining(["Miami", "Homestead"]));
    expect(scene.places.every((place) => place.id.startsWith("town-anchor-"))).toBe(true);
    expect(scene.hudDefaults.selectedPlaceId).toBe(scene.places[0]?.id);
  });
});
