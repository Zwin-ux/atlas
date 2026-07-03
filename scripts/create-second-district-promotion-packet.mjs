#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  CALIFORNIA_DISTRICT_CANDIDATE_PACK,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  createDistrictPromotionPacket,
  createNationalWorldService,
  DISTRICT_PROMOTION_GATE_ORDER,
  parseDistrictCandidatePack,
  parseDistrictCuratedPack,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const args = parseArgs(process.argv.slice(2));
const candidate = CALIFORNIA_DISTRICT_CANDIDATE_PACK.find((item) => item.districtSlug === args.district);

if (!candidate) {
  console.error(`Unknown district: ${args.district}`);
  console.error(`Known districts: ${CALIFORNIA_DISTRICT_CANDIDATE_PACK.map((item) => item.districtSlug).join(", ")}`);
  process.exit(1);
}

const service = createNationalWorldService([riversideDemoVoxelScene]);
const coverage = service.listCoverageDirectory();
const county = service.getCounty(candidate.countySlug);
const district = county.districts.find((item) => item.districtSlug === candidate.districtSlug);
const boundaryFailures = [];

assertBoundary(coverage.totals.playableCountyCount === 1, "Riverside must remain the only playable county.");
assertBoundary(coverage.playableCounties.map((item) => item.countySlug).join(",") === "riverside-ca", "Playable county slug must stay riverside-ca.");
assertBoundary(coverage.totals.providerNormalizedCountyCount === 0, "Provider-normalized county count must stay 0.");
assertBoundary(coverage.totals.publicQualityCountyCount === 0, "Public-quality county count must stay 0.");
assertBoundary(county.county.coverageTier === "L1_COUNTY_SHELL", `${candidate.districtSlug} county must remain L1 shell.`);
assertBoundary(county.county.playableDistrictCount === 0, `${candidate.districtSlug} county must have zero playable districts.`);
assertBoundary(county.county.placeCount === 0, `${candidate.districtSlug} county must have zero public places.`);
assertBoundary(Boolean(district), `${candidate.districtSlug} must exist in candidate metadata.`);
assertBoundary(district?.playable === false, `${candidate.districtSlug} must not be playable.`);
assertBoundary(district?.placeCount === 0, `${candidate.districtSlug} must have zero public places.`);

const baseName = candidate.districtSlug.replace(/-candidate$/, "");
const files = {
  candidatePack: `data/district_candidate_packs/${candidate.districtSlug}.json`,
  anchorPack: `data/district_place_anchor_packs/${baseName}-anchors.json`,
  curatedPack: `data/district_curated_packs/${baseName}-curated-district-draft.json`,
};

const candidatePack = await loadOptionalJson(files.candidatePack, (json) => parseDistrictCandidatePack(json, files.candidatePack));
const anchorPack = await loadOptionalJson(files.anchorPack, (json) => parseDistrictPlaceAnchorPack(json, files.anchorPack));
const curatedPack = await loadOptionalJson(files.curatedPack, (json) => parseDistrictCuratedPack(json, files.curatedPack));
const satisfiedGates = [];
const promotionBlockers = [];

if (candidatePack.value) {
  assertBoundary(candidatePack.value.countySlug === candidate.countySlug, `${candidate.districtSlug} candidate pack county mismatch.`);
  assertBoundary(candidatePack.value.districtSlug === candidate.districtSlug, `${candidate.districtSlug} candidate pack district mismatch.`);
  assertBoundary(candidatePack.value.playableNow === false, `${candidate.districtSlug} candidate pack must not be playable.`);
  satisfiedGates.push("candidate_contract");
} else {
  promotionBlockers.push(`Missing candidate contract: ${files.candidatePack}.`);
}

if (anchorPack.value) {
  assertBoundary(anchorPack.value.playableNow === false, `${candidate.districtSlug} anchor pack must not be playable.`);
  assertBoundary(anchorPack.value.renderableNow === false, `${candidate.districtSlug} anchor pack must not be renderable.`);
  assertBoundary(
    anchorPack.value.placeAnchors.every((anchor) => anchor.providerNormalized === false),
    `${candidate.districtSlug} anchors must not be provider-normalized.`,
  );
  assertBoundary(
    anchorPack.value.placeAnchors.every((anchor) => anchor.renderableNow === false && anchor.sceneEligible === false),
    `${candidate.districtSlug} anchors must remain non-renderable and non-scene-eligible.`,
  );
  if (anchorPack.value.sourceNotes.length > 0 && anchorPack.value.placeAnchors.length > 0) {
    satisfiedGates.push("place_anchors_with_source_notes");
  }
} else {
  promotionBlockers.push(`Missing source-noted anchor pack: ${files.anchorPack}.`);
}

if (curatedPack.value) {
  assertBoundary(curatedPack.value.promotionStatus === "draft_only", `${candidate.districtSlug} curated pack must remain draft-only.`);
  assertBoundary(curatedPack.value.playableNow === false, `${candidate.districtSlug} curated pack must not be playable.`);
  assertBoundary(curatedPack.value.publicNow === false, `${candidate.districtSlug} curated pack must not be public.`);
  assertBoundary(
    curatedPack.value.curatedAnchors.every((anchor) => anchor.publicPlaceClaim === false),
    `${candidate.districtSlug} curated anchors must not claim public places.`,
  );
  satisfiedGates.push("curated_district_pack");
} else {
  promotionBlockers.push(`Missing draft-only curated pack: ${files.curatedPack}.`);
}

let draftScene = null;
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

const missingGates = DISTRICT_PROMOTION_GATE_ORDER.filter((gate) => !satisfiedGates.includes(gate));
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
const packet = createDistrictPromotionPacket({
  candidate,
  filePresence: {
    candidatePack: Boolean(candidatePack.value),
    anchorPack: Boolean(anchorPack.value),
    curatedPack: Boolean(curatedPack.value),
  },
  countyState,
  draftScene: draftSceneSummary,
  satisfiedGates,
  missingGates,
  promotionBlockers: [...new Set(promotionBlockers)],
  requiredScreenshotPacketPath: args.screenshotPacketPath,
});

const summary = {
  ok: boundaryFailures.length === 0,
  district: candidate.districtSlug,
  coverage: {
    playableCountyCount: coverage.totals.playableCountyCount,
    playableCountySlugs: coverage.playableCounties.map((item) => item.countySlug),
    providerNormalizedCountyCount: coverage.totals.providerNormalizedCountyCount,
    publicQualityCountyCount: coverage.totals.publicQualityCountyCount,
  },
  files,
  packet,
  boundaryFailures,
};

console.log(JSON.stringify(summary, null, 2));

if (boundaryFailures.length > 0) {
  process.exitCode = 1;
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
    district: "",
    screenshotPacketPath: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--district") {
      parsed.district = argv[++index] ?? "";
    } else if (value === "--screenshot-packet") {
      parsed.screenshotPacketPath = argv[++index] ?? "";
    } else if (value === "--json-only") {
      // JSON is the only output format; keep this flag for verifier parity.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!parsed.district) {
    throw new Error("--district is required.");
  }

  return parsed;
}
