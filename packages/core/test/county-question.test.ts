import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CountyPackService,
  CountyQuestionService,
  createDeterministicGeneratedDistrictScene,
  createNationalWorldService,
  riversideDemoVoxelScene,
  type CityWorldScene,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const countyPackDir = resolve(testDir, "../../../data/county_packs");
const generatedQuestionBannedWords = /\b(alpha|tier|spec|generated|draft|archetype)\b/i;

describe("CountyQuestionService", () => {
  const service = new CountyQuestionService(new CountyPackService(countyPackDir));
  const worldService = createNationalWorldService([riversideDemoVoxelScene]);

  it("explains why Eastvale is the first slice from curated data", () => {
    const answer = service.answer({
      countySlug: "riverside-ca",
      question: "Why is Eastvale the first slice?",
    });

    expect(answer.type).toBe("countyQuestionAnswer");
    expect(answer.supported).toBe(true);
    expect(answer.topic).toBe("eastvale_first_slice");
    expect(answer.answer).toContain("Eastvale");
    expect(answer.answer).toContain("curated");
    expect(answer.facts.flatMap((fact) => fact.sourceNodeIds ?? [])).toContain("eastvale");
    expect(answer.sourceNotes[0]).toMatchObject({ sourceType: "curated_demo" });
  });

  it("answers mobile detailing signals without claiming live market truth", () => {
    const answer = service.answer({
      countySlug: "riverside-ca",
      question: "Which curated signals support mobile detailing?",
      businessType: "mobile detailing",
    });

    expect(answer.supported).toBe(true);
    expect(answer.topic).toBe("business_signals");
    expect(answer.answer).toContain("Residential Demand");
    expect(answer.answer).toContain("not live demand");
    expect(answer.facts.map((fact) => fact.label)).toContain("Eastvale Residential Cluster");
    expect(answer.facts.some((fact) => fact.value.includes("85 curated mobile detailing score"))).toBe(true);
  });

  it("refuses out-of-world factual asks the curated pack cannot hold", () => {
    const outOfWorld = [
      "What is the phone number for the Eastvale gym?",
      "How much does mobile detailing cost in Eastvale?",
      "What is the population of Eastvale?",
      "Is the plaza open right now?",
      "What are the gym hours?",
      "What is the address of the plaza?",
      "What is the weather in Eastvale?",
      "List every business in Eastvale",
    ];

    for (const question of outOfWorld) {
      const answer = service.answer({ countySlug: "riverside-ca", question });
      expect(answer.supported).toBe(false);
      expect(answer.topic).toBe("unsupported");
      expect(answer.answer).toContain("no live or real-world data");
      expect(answer.limitations.join(" ")).toContain("Closed-world");
    }
  });

  it("still answers supported curated questions after the honesty guard", () => {
    const signals = service.answer({
      countySlug: "riverside-ca",
      question: "Which curated signals support mobile detailing?",
      businessType: "mobile detailing",
    });
    const firstSlice = service.answer({ countySlug: "riverside-ca", question: "Why is Eastvale the first slice?" });
    const sourceLimits = service.answer({ countySlug: "riverside-ca", question: "What are your data sources and confidence?" });

    expect(signals.supported).toBe(true);
    expect(signals.topic).toBe("business_signals");
    expect(firstSlice.topic).toBe("eastvale_first_slice");
    expect(sourceLimits.topic).toBe("source_limits");
  });

  it("keeps playable-slice intent ahead of overlapping source words", () => {
    const answer = service.answer({
      countySlug: "riverside-ca",
      question: "What current data makes Eastvale playable?",
    });

    expect(answer.supported).toBe(true);
    expect(answer.topic).toBe("eastvale_first_slice");
    expect(answer.answer).toContain("Explore -> Ask -> Drop Clawd -> Scout -> Campaign");
  });

  it("keeps ordinary Eastvale data and provider questions on source limits", () => {
    const questions = [
      "What current data is available for Eastvale?",
      "What providers cover Eastvale?",
      "Why is current data for Eastvale limited?",
    ];

    for (const question of questions) {
      const answer = service.answer({ countySlug: "riverside-ca", question });
      expect(answer.supported).toBe(true);
      expect(answer.topic).toBe("source_limits");
    }
  });

  it("resolves curated place questions to map targets", () => {
    const park = service.answer({
      countySlug: "riverside-ca",
      question: "Where is the park?",
    });
    const plaza = service.answer({
      countySlug: "riverside-ca",
      question: "What's near the plaza?",
    });

    expect(park.supported).toBe(true);
    expect(park.targetNodeId).toBe("eastvale");
    expect(park.targetPlaceId).toBeUndefined();
    expect(park.targetLabel).toBe("Community park");
    expect(park.answer).toContain("closed-world demo data");

    expect(plaza.supported).toBe(true);
    expect(plaza.targetNodeId).toBe("gym-plaza-eastvale");
    expect(plaza.targetPlaceId).toBe("place-gym-plaza-eastvale");
    expect(plaza.targetLabel).toContain("Plaza");
    expect(plaza.facts.flatMap((fact) => fact.sourceNodeIds ?? [])).toContain("gym-plaza-eastvale");
  });

  it("refuses unknown place targets instead of inventing map focus", () => {
    const answer = service.answer({
      countySlug: "riverside-ca",
      question: "Where is the beach?",
    });

    expect(answer.supported).toBe(false);
    expect(answer.topic).toBe("unsupported");
    expect(answer.answer).toContain("not in the current pack");
    expect(answer.targetNodeId).toBeUndefined();
    expect(answer.targetLabel).toBeUndefined();
  });

  it("narrows unsupported counties and business claims", () => {
    const unsupportedCounty = service.answer({
      countySlug: "orange-ca",
      question: "Should I launch roofing in Orange County?",
      businessType: "roofing",
    });
    const unsupportedBusiness = service.answer({
      countySlug: "riverside-ca",
      question: "Will roofing work in Eastvale?",
      businessType: "roofing",
    });

    expect(unsupportedCounty.supported).toBe(false);
    expect(unsupportedCounty.answer).toContain("only for Riverside County");
    expect(unsupportedBusiness.supported).toBe(false);
    expect(unsupportedBusiness.answer).toContain("Supported score lanes");
    expect(unsupportedBusiness.limitations.join(" ")).toContain("Closed-world");
  });

  it("answers generated preview place questions on anchor counties with map targets", () => {
    const anchors = [
      {
        countySlug: "mobile-al",
        question: "Where is the riverfront landing?",
        expectedLabel: "Riverfront landing",
      },
      {
        countySlug: "loving-tx",
        question: "Where is the market?",
        expectedLabel: "Desert market row",
      },
      {
        countySlug: "miami-dade-fl",
        question: "Where is the civic square?",
        expectedLabel: "Civic square",
      },
    ];

    for (const anchor of anchors) {
      const scene = generatedSceneForCounty(anchor.countySlug);
      const answer = service.answer({
        countySlug: anchor.countySlug,
        question: anchor.question,
        generatedScene: scene,
        generatedCountyLabel: scene.region.county,
      });

      expect(answer.supported).toBe(true);
      expect(answer.topic).toBe("generated_place");
      expect(answer.answer).toContain(anchor.expectedLabel);
      expect(answer.answer).toContain("Tap it on the map");
      expect(answer.targetNodeId).toBeTruthy();
      expect(answer.targetPlaceId).toBeTruthy();
      expect(answer.targetLabel).toBe(anchor.expectedLabel);
      expect(answer.facts.map((fact) => fact.label)).toContain("Map label");
      expect(`${answer.answer} ${answer.limitations.join(" ")} ${answer.facts.map((fact) => fact.value).join(" ")}`).not.toMatch(
        generatedQuestionBannedWords,
      );
    }
  });

  it("refuses generated preview questions that require facts outside scene labels", () => {
    for (const countySlug of ["mobile-al", "loving-tx", "miami-dade-fl"]) {
      const scene = generatedSceneForCounty(countySlug);
      const answer = service.answer({
        countySlug,
        question: "Will mobile detailing work here?",
        businessType: "mobile detailing",
        generatedScene: scene,
        generatedCountyLabel: scene.region.county,
      });

      expect(answer.supported).toBe(false);
      expect(answer.topic).toBe("unsupported");
      expect(answer.answer).toContain("cannot answer that from this preview");
      expect(answer.answer).toContain("will not make local facts or business claims");
      expect(answer.targetNodeId).toBeUndefined();
      expect(answer.targetLabel).toBeUndefined();
      expect(`${answer.answer} ${answer.limitations.join(" ")} ${answer.facts.map((fact) => fact.value).join(" ")}`).not.toMatch(
        generatedQuestionBannedWords,
      );
    }
  });

  function generatedSceneForCounty(countySlug: string): CityWorldScene {
    const response = worldService.getCounty(countySlug);
    if (!response.county.geoid) throw new Error(`Missing GEOID for ${countySlug}`);
    return createDeterministicGeneratedDistrictScene({
      county: {
        geoid: response.county.geoid,
        stateCode: response.county.stateCode,
        name: response.county.label,
        countySlug: response.county.countySlug,
        ...(response.county.centroid ? { centroid: response.county.centroid } : {}),
      },
    }).result.scene;
  }
});
