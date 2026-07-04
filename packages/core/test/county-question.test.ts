import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CountyPackService, CountyQuestionService } from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const countyPackDir = resolve(testDir, "../../../data/county_packs");

describe("CountyQuestionService", () => {
  const service = new CountyQuestionService(new CountyPackService(countyPackDir));

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
});
