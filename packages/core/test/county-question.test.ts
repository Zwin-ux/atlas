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
