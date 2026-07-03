import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  createDistrictPromotionPacket,
  createNationalWorldService,
  parseDistrictCandidatePack,
  parseDistrictCuratedPack,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const REQUIRED_PROMOTION_GATES = [
  "candidate_contract",
  "place_anchors_with_source_notes",
  "curated_district_pack",
  "bounded_scene_compiler_proof",
  "desktop_mobile_product_loop_screenshots",
  "lumen_visual_acceptance",
  "mira_readiness_acceptance",
  "forge_split_guard",
];

const args = parseArgs(process.argv.slice(2));
const service = createNationalWorldService([riversideDemoVoxelScene]);
const coverage = service.listCoverageDirectory();
const boundaryFailures = [];

assertBoundary(coverage.totals.playableCountyCount === 1, "California pipeline must keep exactly one playable county.");
assertBoundary(
  coverage.playableCounties.map((county) => county.countySlug).join(",") === "riverside-ca",
  "Riverside must remain the only playable county.",
);
assertBoundary(coverage.totals.providerNormalizedCountyCount === 0, "Pipeline must not claim provider-normalized counties.");
assertBoundary(coverage.totals.publicQualityCountyCount === 0, "Pipeline must not claim public-quality counties.");

const candidates = [];
for (const candidate of CALIFORNIA_DISTRICT_CANDIDATE_PACK) {
  candidates.push(await inspectCandidate(candidate));
}

const summary = {
  ok: boundaryFailures.length === 0,
  promotionReady: candidates.some((candidate) => candidate.promotionReady),
  coverage: {
    playableCountyCount: coverage.totals.playableCountyCount,
    playableCountySlugs: coverage.playableCounties.map((county) => county.countySlug),
    providerNormalizedCountyCount: coverage.totals.providerNormalizedCountyCount,
    publicQualityCountyCount: coverage.totals.publicQualityCountyCount,
  },
  candidates,
  boundaryFailures,
};

console.log(JSON.stringify(summary, null, 2));

if (boundaryFailures.length > 0) {
  process.exitCode = 1;
}

async function inspectCandidate(candidate) {
  const baseName = candidate.districtSlug.replace(/-candidate$/, "");
  const defaultCandidatePath = `data/district_candidate_packs/${candidate.districtSlug}.json`;
  const defaultAnchorPath = `data/district_place_anchor_packs/${baseName}-anchors.json`;
  const defaultCuratedPath = `data/district_curated_packs/${baseName}-curated-district-draft.json`;
  const candidatePackPath = args.candidatePacks[candidate.districtSlug] ?? defaultCandidatePath;
  const anchorPackPath = args.anchorPacks[candidate.districtSlug] ?? defaultAnchorPath;
  const curatedPackPath = args.curatedPacks[candidate.districtSlug] ?? defaultCuratedPath;
  const satisfiedGates = [];
  const missingGates = [];
  const promotionBlockers = [];
  const files = {
    candidatePack: candidatePackPath,
    anchorPack: anchorPackPath,
    curatedPack: curatedPackPath,
  };

  const county = service.getCounty(candidate.countySlug);
  const district = county.districts.find((item) => item.districtSlug === candidate.districtSlug);

  assertBoundary(county.county.coverageTier === "L1_COUNTY_SHELL", `${candidate.districtSlug} county must remain L1 shell.`);
  assertBoundary(county.county.playableDistrictCount === 0, `${candidate.districtSlug} county must have zero playable districts.`);
  assertBoundary(county.county.placeCount === 0, `${candidate.districtSlug} county must not expose public places.`);
  assertBoundary(Boolean(district), `${candidate.districtSlug} must remain present in county candidate metadata.`);
  assertBoundary(district?.playable === false, `${candidate.districtSlug} must not be playable.`);
  assertBoundary(district?.placeCount === 0, `${candidate.districtSlug} must have zero public places.`);

  const candidatePack = await loadOptionalJson(candidatePackPath, (json) => parseDistrictCandidatePack(json, candidatePackPath));
  if (candidatePack.value) {
    const pack = candidatePack.value;
    assertBoundary(pack.countySlug === candidate.countySlug, `${candidate.districtSlug} candidate pack county mismatch.`);
    assertBoundary(pack.districtSlug === candidate.districtSlug, `${candidate.districtSlug} candidate pack district mismatch.`);
    assertBoundary(pack.currentCoverageTier === "L1_COUNTY_SHELL", `${candidate.districtSlug} candidate pack must remain L1.`);
    assertBoundary(pack.targetCoverageTier === "L2_CURATED_DISTRICT", `${candidate.districtSlug} candidate pack target must remain L2.`);
    assertBoundary(pack.playableNow === false, `${candidate.districtSlug} candidate pack must not claim playableNow.`);
    assertBoundary(pack.promotionBlocked === true, `${candidate.districtSlug} candidate pack must keep promotionBlocked.`);
    satisfiedGates.push("candidate_contract");
  } else {
    promotionBlockers.push(`Missing candidate contract: ${candidatePackPath}.`);
  }

  const anchorPack = await loadOptionalJson(anchorPackPath, (json) => parseDistrictPlaceAnchorPack(json, anchorPackPath));
  if (anchorPack.value) {
    const pack = anchorPack.value;
    assertBoundary(pack.countySlug === candidate.countySlug, `${candidate.districtSlug} anchor pack county mismatch.`);
    assertBoundary(pack.districtSlug === candidate.districtSlug, `${candidate.districtSlug} anchor pack district mismatch.`);
    assertBoundary(pack.playableNow === false, `${candidate.districtSlug} anchor pack must not claim playableNow.`);
    assertBoundary(pack.renderableNow === false, `${candidate.districtSlug} anchor pack must not claim renderableNow.`);
    assertBoundary(
      pack.placeAnchors.every((anchor) => anchor.providerNormalized === false),
      `${candidate.districtSlug} anchors must not claim provider normalization.`,
    );
    assertBoundary(
      pack.placeAnchors.every((anchor) => anchor.renderableNow === false && anchor.sceneEligible === false),
      `${candidate.districtSlug} anchors must remain non-renderable and non-scene-eligible.`,
    );
    if (pack.sourceNotes.length > 0 && pack.placeAnchors.length > 0) {
      satisfiedGates.push("place_anchors_with_source_notes");
    }
  } else {
    promotionBlockers.push(`Missing source-noted anchor pack: ${anchorPackPath}.`);
  }

  const curatedPack = await loadOptionalJson(curatedPackPath, (json) => parseDistrictCuratedPack(json, curatedPackPath));
  if (curatedPack.value) {
    const pack = curatedPack.value;
    assertBoundary(pack.countySlug === candidate.countySlug, `${candidate.districtSlug} curated pack county mismatch.`);
    assertBoundary(pack.districtSlug === candidate.districtSlug, `${candidate.districtSlug} curated pack district mismatch.`);
    assertBoundary(pack.promotionStatus === "draft_only", `${candidate.districtSlug} curated pack must remain draft-only.`);
    assertBoundary(pack.playableNow === false, `${candidate.districtSlug} curated pack must not claim playableNow.`);
    assertBoundary(pack.publicNow === false, `${candidate.districtSlug} curated pack must not claim publicNow.`);
    assertBoundary(
      pack.curatedAnchors.every((anchor) => anchor.publicPlaceClaim === false),
      `${candidate.districtSlug} curated anchors must not claim public places.`,
    );
    satisfiedGates.push("curated_district_pack");
  } else {
    promotionBlockers.push(`Missing draft-only curated pack: ${curatedPackPath}.`);
  }

  let draftScene;
  if (anchorPack.value && curatedPack.value) {
    draftScene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anchorPack.value });
    assertBoundary(draftScene.coverage?.coverageTier === "L1_COUNTY_SHELL", `${candidate.districtSlug} draft scene must remain L1 shell.`);
    assertBoundary(draftScene.coverage?.playable === false, `${candidate.districtSlug} draft scene must not be playable.`);
    assertBoundary(draftScene.actors.length === 0, `${candidate.districtSlug} draft scene must not include actors.`);
    assertBoundary(draftScene.pins.length === 0, `${candidate.districtSlug} draft scene must not include pins.`);
    assertBoundary(draftScene.hudDefaults.selectedPlaceId === "", `${candidate.districtSlug} draft scene must not select a public place.`);
    if (
      draftScene.buildings.length > 0 &&
      draftScene.lots.length > 0 &&
      draftScene.roadSegments.length > 0 &&
      ["desktop", "mobile", "residential_detail"].every((cameraId) => draftScene.cameraPresets.some((preset) => preset.id === cameraId))
    ) {
      satisfiedGates.push("bounded_scene_compiler_proof");
    } else {
      promotionBlockers.push(`${candidate.districtSlug} draft scene lacks buildings, lots, roads, or QA camera presets.`);
    }
  }

  for (const gate of REQUIRED_PROMOTION_GATES) {
    if (!satisfiedGates.includes(gate)) {
      missingGates.push(gate);
    }
  }

  for (const gate of missingGates) {
    if (!promotionBlockers.some((blocker) => blocker.includes(gate))) {
      promotionBlockers.push(`Missing promotion gate: ${gate}.`);
    }
  }

  const countyState = {
    coverageTier: county.county.coverageTier,
    playableDistrictCount: county.county.playableDistrictCount,
    placeCount: county.county.placeCount,
    districtPlayable: district?.playable ?? null,
    districtPlaceCount: district?.placeCount ?? null,
  };
  const filePresence = {
    candidatePack: Boolean(candidatePack.value),
    anchorPack: Boolean(anchorPack.value),
    curatedPack: Boolean(curatedPack.value),
  };
  const draftSceneSummary = draftScene
    ? {
        playable: draftScene.coverage?.playable,
        buildingCount: draftScene.buildings.length,
        lotCount: draftScene.lots.length,
        roadSegmentCount: draftScene.roadSegments.length,
        actorCount: draftScene.actors.length,
        pinCount: draftScene.pins.length,
        selectedPlaceId: draftScene.hudDefaults.selectedPlaceId,
        cameraPresets: draftScene.cameraPresets.map((preset) => preset.id),
      }
    : null;
  const promotionPacket = createDistrictPromotionPacket({
    candidate,
    filePresence,
    countyState,
    draftScene: draftSceneSummary,
    satisfiedGates,
    missingGates,
    promotionBlockers: [...new Set(promotionBlockers)],
  });

  return {
    priority: candidate.priority,
    countySlug: candidate.countySlug,
    countyGeoid: candidate.countyGeoid,
    districtSlug: candidate.districtSlug,
    districtGeoid: candidate.districtGeoid,
    currentCoverageTier: candidate.currentCoverageTier,
    targetCoverageTier: candidate.targetCoverageTier,
    playableNow: candidate.playableNow,
    publicSwitcherEligible: false,
    promotionReady: missingGates.length === 0,
    files,
    filePresence,
    countyState,
    draftScene: draftSceneSummary,
    satisfiedGates,
    missingGates,
    promotionBlockers: [...new Set(promotionBlockers)],
    promotionPacket,
  };
}

async function loadOptionalJson(path, parser) {
  try {
    return { value: parser(JSON.parse(await readFile(resolve(path), "utf8"))) };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { value: null };
    }
    throw error;
  }
}

function assertBoundary(condition, message) {
  if (!condition) {
    boundaryFailures.push(message);
  }
}

function parseArgs(argv) {
  const parsed = {
    candidatePacks: {},
    anchorPacks: {},
    curatedPacks: {},
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--candidate-pack") {
      setPathOverride(parsed.candidatePacks, argv[++index], value);
    } else if (value === "--anchor-pack") {
      setPathOverride(parsed.anchorPacks, argv[++index], value);
    } else if (value === "--curated-pack") {
      setPathOverride(parsed.curatedPacks, argv[++index], value);
    } else if (value === "--json-only") {
      // JSON is the only output format; keep this flag for parity with other verifiers.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return parsed;
}

function setPathOverride(target, value, flag) {
  if (!value || !value.includes("=")) {
    throw new Error(`${flag} expects districtSlug=path.`);
  }
  const [districtSlug, ...pathParts] = value.split("=");
  const path = pathParts.join("=");
  if (!districtSlug || !path) {
    throw new Error(`${flag} expects districtSlug=path.`);
  }
  target[districtSlug] = path;
}
