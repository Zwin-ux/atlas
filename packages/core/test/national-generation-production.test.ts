import { describe, expect, it } from "vitest";
import {
  CALIFORNIA_COUNTY_INDEX,
  createNationalWorldService,
  evaluateNationalGenerationProductionReadiness,
  NATIONAL_GENERATION_PRODUCTION_STAGES,
  riversideDemoVoxelScene,
} from "../src/index.js";

describe("national generation production contract", () => {
  it("does not pretend the current California fixture is a production US engine", () => {
    const service = createNationalWorldService([riversideDemoVoxelScene], CALIFORNIA_COUNTY_INDEX);
    const readiness = evaluateNationalGenerationProductionReadiness({
      coverageDirectory: service.listCoverageDirectory(),
      nationalCountyIndexSource: "partial_fixture",
      shellSceneCompiler: true,
      deterministicDistrictGenerator: true,
      providerGeometryBlocked: true,
      providerNormalizedLocalAnchors: false,
      rendererWindowing: true,
      desktopMobileProofRequired: true,
    });

    expect(readiness.productionReady).toBe(false);
    expect(readiness.currentStage).toBe("P0_US_COUNTY_IDENTITY");
    expect(readiness.counts).toMatchObject({ stateCount: 1, indexedCountyCount: 58, playableCountyCount: 1 });
    expect(readiness.blockers.join(" ")).toContain("US county identity is not nationwide");
    expect(readiness.guarantees).toContain("Provider lookup is not coverage readiness and cannot create renderer geometry.");
  });

  it("recognizes nationwide identity and honest shells without claiming public production", () => {
    const service = createNationalWorldService([riversideDemoVoxelScene]);
    const readiness = evaluateNationalGenerationProductionReadiness({
      coverageDirectory: service.listCoverageDirectory(),
      nationalCountyIndexSource: "census_gazetteer",
      shellSceneCompiler: true,
      deterministicDistrictGenerator: false,
      providerGeometryBlocked: true,
      providerNormalizedLocalAnchors: false,
      rendererWindowing: true,
      desktopMobileProofRequired: true,
    });

    expect(readiness.productionReady).toBe(false);
    expect(readiness.currentStage).toBe("P2_DETERMINISTIC_GENERATED_DISTRICTS");
    expect(readiness.counts).toMatchObject({ stateCount: 52, indexedCountyCount: 3222, shellCountyCount: 3221, playableCountyCount: 1 });
    expect(readiness.blockers).toContain("A production US engine needs a deterministic generated-district compiler for counties without curated packs.");
  });

  it("requires deterministic generation, provider boundaries, windowing, and proof after the national index exists", () => {
    const readiness = evaluateNationalGenerationProductionReadiness({
      coverageDirectory: {
        totals: {
          stateCount: 50,
          indexedCountyCount: 3144,
          supportedCountyCount: 3144,
          playableCountyCount: 1,
          shellCountyCount: 3143,
          providerNormalizedCountyCount: 0,
          publicQualityCountyCount: 0,
          indexedUnsupportedCountyCount: 0,
        },
      },
      nationalCountyIndexSource: "census_gazetteer",
      shellSceneCompiler: true,
      deterministicDistrictGenerator: false,
      providerGeometryBlocked: false,
      providerNormalizedLocalAnchors: false,
      rendererWindowing: false,
      desktopMobileProofRequired: false,
    });

    expect(readiness.productionReady).toBe(false);
    expect(readiness.currentStage).toBe("P2_DETERMINISTIC_GENERATED_DISTRICTS");
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        "A production US engine needs a deterministic generated-district compiler for counties without curated packs.",
        "Provider lookup must stay source-normalized and cannot directly create scene geometry.",
        "Provider-normalized local anchors need category, attribution, cache, and policy gates before generated districts can be promoted.",
        "Nationwide generation requires windowed scene packets; giant full-county payloads cannot ride in structuredContent.",
        "Every public-quality promotion needs desktop and 390x844 proof.",
      ]),
    );
  });

  it("moves to provider-normalized local anchors after deterministic generation exists", () => {
    const service = createNationalWorldService([riversideDemoVoxelScene]);
    const readiness = evaluateNationalGenerationProductionReadiness({
      coverageDirectory: service.listCoverageDirectory(),
      nationalCountyIndexSource: "census_gazetteer",
      shellSceneCompiler: true,
      deterministicDistrictGenerator: true,
      providerGeometryBlocked: true,
      providerNormalizedLocalAnchors: false,
      rendererWindowing: true,
      desktopMobileProofRequired: true,
    });

    expect(readiness.productionReady).toBe(false);
    expect(readiness.currentStage).toBe("P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS");
    expect(readiness.nextStage).toBe("P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES");
    expect(readiness.blockers).toContain(
      "Provider-normalized local anchors need category, attribution, cache, and policy gates before generated districts can be promoted.",
    );
  });

  it("keeps the production ladder ordered and explicit", () => {
    expect(NATIONAL_GENERATION_PRODUCTION_STAGES.map((stage) => stage.id)).toEqual([
      "P0_US_COUNTY_IDENTITY",
      "P1_HONEST_COUNTY_SHELLS",
      "P2_DETERMINISTIC_GENERATED_DISTRICTS",
      "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS",
      "P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES",
    ]);
  });
});
