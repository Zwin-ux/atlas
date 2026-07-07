import type { UsCoverageDirectoryResponse } from "./types.js";

export type NationalGenerationProductionStageId =
  | "P0_US_COUNTY_IDENTITY"
  | "P1_HONEST_COUNTY_SHELLS"
  | "P2_DETERMINISTIC_GENERATED_DISTRICTS"
  | "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS"
  | "P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES";

export type NationalGenerationProductionStage = {
  id: NationalGenerationProductionStageId;
  label: string;
  promise: string;
};

export type NationalGenerationProductionInput = {
  coverageDirectory: Pick<UsCoverageDirectoryResponse, "totals">;
  nationalCountyIndexSource: "census_gazetteer" | "partial_fixture" | "unknown";
  shellSceneCompiler: boolean;
  deterministicDistrictGenerator: boolean;
  providerGeometryBlocked: boolean;
  providerNormalizedLocalAnchors: boolean;
  rendererWindowing: boolean;
  desktopMobileProofRequired: boolean;
};

export type NationalGenerationProductionReadiness = {
  type: "nationalGenerationProductionReadiness";
  productionReady: boolean;
  currentStage: NationalGenerationProductionStageId;
  nextStage: NationalGenerationProductionStageId;
  blockers: string[];
  guarantees: string[];
  counts: {
    stateCount: number;
    indexedCountyCount: number;
    shellCountyCount: number;
    playableCountyCount: number;
    publicQualityCountyCount: number;
  };
};

export const NATIONAL_GENERATION_PRODUCTION_STAGES: NationalGenerationProductionStage[] = [
  {
    id: "P0_US_COUNTY_IDENTITY",
    label: "Sourced US county identity",
    promise: "Every county/equivalent comes from a sourceable county index before Atlas says it exists.",
  },
  {
    id: "P1_HONEST_COUNTY_SHELLS",
    label: "Honest shells everywhere",
    promise: "Every indexed county can render a non-playable shell without borrowing Riverside data.",
  },
  {
    id: "P2_DETERMINISTIC_GENERATED_DISTRICTS",
    label: "Deterministic generated districts",
    promise: "Any county can compile a bounded, provider-free generated district spec with roads, zones, lots, and buildings.",
  },
  {
    id: "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS",
    label: "Provider-normalized local anchors",
    promise: "Lookup data may become source-noted anchors only after category, attribution, cache, and policy gates pass.",
  },
  {
    id: "P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES",
    label: "Public-quality playable counties",
    promise: "A county becomes playable only after curated/generated proof, desktop/mobile screenshots, and owner acceptance.",
  },
];

const MINIMUM_NATIONWIDE_STATE_COUNT = 50;
const MINIMUM_NATIONWIDE_COUNTY_EQUIVALENTS = 3_000;

export function evaluateNationalGenerationProductionReadiness(
  input: NationalGenerationProductionInput,
): NationalGenerationProductionReadiness {
  const totals = input.coverageDirectory.totals;
  const blockers: string[] = [];

  const hasNationwideIdentity =
    input.nationalCountyIndexSource === "census_gazetteer" &&
    totals.stateCount >= MINIMUM_NATIONWIDE_STATE_COUNT &&
    totals.indexedCountyCount >= MINIMUM_NATIONWIDE_COUNTY_EQUIVALENTS;
  if (!hasNationwideIdentity) {
    blockers.push(
      `US county identity is not nationwide: ${totals.stateCount} state(s), ${totals.indexedCountyCount} indexed county row(s).`,
    );
  }

  const hasHonestShells = input.shellSceneCompiler && totals.shellCountyCount + totals.playableCountyCount === totals.indexedCountyCount;
  if (!hasHonestShells) {
    blockers.push("Every indexed county must have either an honest shell or a gated playable district; no unknown fallback may borrow Riverside data.");
  }

  if (!input.deterministicDistrictGenerator) {
    blockers.push("A production US engine needs a deterministic generated-district compiler for counties without curated packs.");
  }
  if (!input.providerGeometryBlocked) {
    blockers.push("Provider lookup must stay source-normalized and cannot directly create scene geometry.");
  }
  if (!input.providerNormalizedLocalAnchors) {
    blockers.push("Provider-normalized local anchors need category, attribution, cache, and policy gates before generated districts can be promoted.");
  }
  if (!input.rendererWindowing) {
    blockers.push("Nationwide generation requires windowed scene packets; giant full-county payloads cannot ride in structuredContent.");
  }
  if (!input.desktopMobileProofRequired) {
    blockers.push("Every public-quality promotion needs desktop and 390x844 proof.");
  }

  const currentStage = currentStageFor({
    hasNationwideIdentity,
    hasHonestShells,
    deterministicDistrictGenerator: input.deterministicDistrictGenerator,
    providerGeometryBlocked: input.providerGeometryBlocked,
    providerNormalizedLocalAnchors: input.providerNormalizedLocalAnchors,
    publicQualityCountyCount: totals.publicQualityCountyCount,
  });

  return {
    type: "nationalGenerationProductionReadiness",
    productionReady: blockers.length === 0 && totals.publicQualityCountyCount > 0,
    currentStage,
    nextStage: nextStageAfter(currentStage),
    blockers,
    guarantees: [
      "Playable claims remain gated by coverage tier and proof.",
      "Shell counties are browse-only and do not invent local places.",
      "Provider lookup is not coverage readiness and cannot create renderer geometry.",
      "Generated scenes must use typed specs, deterministic seeds, and windowed renderer packets.",
    ],
    counts: {
      stateCount: totals.stateCount,
      indexedCountyCount: totals.indexedCountyCount,
      shellCountyCount: totals.shellCountyCount,
      playableCountyCount: totals.playableCountyCount,
      publicQualityCountyCount: totals.publicQualityCountyCount,
    },
  };
}

function currentStageFor(input: {
  hasNationwideIdentity: boolean;
  hasHonestShells: boolean;
  deterministicDistrictGenerator: boolean;
  providerGeometryBlocked: boolean;
  providerNormalizedLocalAnchors: boolean;
  publicQualityCountyCount: number;
}): NationalGenerationProductionStageId {
  if (!input.hasNationwideIdentity) return "P0_US_COUNTY_IDENTITY";
  if (!input.hasHonestShells) return "P1_HONEST_COUNTY_SHELLS";
  if (!input.deterministicDistrictGenerator) return "P2_DETERMINISTIC_GENERATED_DISTRICTS";
  if (!input.providerGeometryBlocked || !input.providerNormalizedLocalAnchors) return "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS";
  if (input.publicQualityCountyCount <= 0) return "P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES";
  return "P4_PUBLIC_QUALITY_PLAYABLE_COUNTIES";
}

function nextStageAfter(stage: NationalGenerationProductionStageId): NationalGenerationProductionStageId {
  const index = NATIONAL_GENERATION_PRODUCTION_STAGES.findIndex((item) => item.id === stage);
  return NATIONAL_GENERATION_PRODUCTION_STAGES[Math.min(index + 1, NATIONAL_GENERATION_PRODUCTION_STAGES.length - 1)]?.id ?? stage;
}
