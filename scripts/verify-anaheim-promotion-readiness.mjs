import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  compileDistrictPlaceAnchorDraftCityWorldScene,
  createNationalWorldService,
  parseDistrictCandidatePack,
  parseDistrictCuratedPack,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const DEFAULT_CANDIDATE_PACK = "data/district_candidate_packs/anaheim-candidate.json";
const DEFAULT_ANCHOR_PACK = "data/district_place_anchor_packs/anaheim-anchors.json";
const DEFAULT_CURATED_PACK = "data/district_curated_packs/anaheim-curated-district-draft.json";
const REQUIRED_PLAYABLE_GATES = [
  "curated_district_pack",
  "place_anchors_with_source_notes",
  "bounded_scene_compiler_proof",
  "desktop_mobile_product_loop_screenshots",
  "lumen_visual_acceptance",
  "mira_readiness_acceptance",
  "forge_split_guard",
];

const args = parseArgs(process.argv.slice(2));
const candidatePack = parseDistrictCandidatePack(
  JSON.parse(await readFile(resolve(args.candidatePackPath), "utf8")),
  args.candidatePackPath,
);
const anchorPack = parseDistrictPlaceAnchorPack(
  JSON.parse(await readFile(resolve(args.anchorPackPath), "utf8")),
  args.anchorPackPath,
);
const curatedPack = await loadOptionalCuratedPack(args.curatedPackPath);
const service = createNationalWorldService([riversideDemoVoxelScene]);
const orangeCounty = service.getCounty("orange-ca");
const directory = service.listCoverageDirectory();
const draftScene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });

const boundaryFailures = [];
const promotionBlockers = [];
const satisfiedGates = [];

assertBoundary(candidatePack.countySlug === "orange-ca", "Candidate pack must stay scoped to orange-ca.");
assertBoundary(candidatePack.districtSlug === "anaheim-candidate", "Candidate pack must stay scoped to anaheim-candidate.");
assertBoundary(candidatePack.currentCoverageTier === "L1_COUNTY_SHELL", "Anaheim candidate must remain L1 shell before promotion.");
assertBoundary(candidatePack.targetCoverageTier === "L2_CURATED_DISTRICT", "Anaheim target tier must be L2 curated district.");
assertBoundary(candidatePack.playableNow === false, "Candidate pack must not claim playableNow.");
assertBoundary(candidatePack.promotionBlocked === true, "Candidate pack must keep promotionBlocked true.");
assertBoundary(anchorPack.candidatePackId === candidatePack.packId, "Anchor pack must point at the Anaheim candidate pack.");
assertBoundary(anchorPack.countySlug === candidatePack.countySlug, "Anchor pack county slug must match candidate pack.");
assertBoundary(anchorPack.districtSlug === candidatePack.districtSlug, "Anchor pack district slug must match candidate pack.");
assertBoundary(anchorPack.playableNow === false, "Anchor pack must not claim playableNow.");
assertBoundary(anchorPack.renderableNow === false, "Anchor pack must not claim renderableNow.");
assertBoundary(
  anchorPack.placeAnchors.every((anchor) => anchor.providerNormalized === false),
  "Place anchors must not claim provider-normalized data.",
);
assertBoundary(
  anchorPack.placeAnchors.every((anchor) => anchor.renderableNow === false && anchor.sceneEligible === false),
  "Place anchors must remain non-renderable and non-scene-eligible before promotion.",
);
assertBoundary(
  orangeCounty.county.coverageTier === "L1_COUNTY_SHELL" && orangeCounty.county.playableDistrictCount === 0,
  "Orange County must remain an L1 shell with zero playable districts.",
);
assertBoundary(
  (orangeCounty.districts ?? []).every((district) => district.playable === false && district.placeCount === 0),
  "Orange County districts must not expose playable places.",
);
assertBoundary(
  directory.playableCounties.map((county) => county.countySlug).join(",") === "riverside-ca",
  "Riverside must remain the only playable county.",
);
assertBoundary(draftScene.coverage?.coverageTier === "L1_COUNTY_SHELL", "Anaheim draft scene must remain L1 shell.");
assertBoundary(draftScene.coverage?.playable === false, "Anaheim draft scene must not be playable.");
assertBoundary(draftScene.actors.length === 0, "Anaheim draft scene must not include actors.");
assertBoundary(draftScene.pins.length === 0, "Anaheim draft scene must not include pins.");
assertBoundary(draftScene.hudDefaults.selectedPlaceId === "", "Anaheim draft scene must not select a public place.");

if (curatedPack) {
  const sourceAnchorIds = new Set(anchorPack.placeAnchors.map((anchor) => anchor.id));
  assertBoundary(curatedPack.candidatePackId === candidatePack.packId, "Curated pack must point at the candidate pack.");
  assertBoundary(curatedPack.anchorPackId === anchorPack.packId, "Curated pack must point at the source-noted anchor pack.");
  assertBoundary(curatedPack.countySlug === candidatePack.countySlug, "Curated pack county slug must match candidate pack.");
  assertBoundary(curatedPack.districtSlug === candidatePack.districtSlug, "Curated pack district slug must match candidate pack.");
  assertBoundary(curatedPack.promotionStatus === "draft_only", "Curated pack must remain draft-only.");
  assertBoundary(curatedPack.playableNow === false, "Curated pack must not claim playableNow.");
  assertBoundary(curatedPack.publicNow === false, "Curated pack must not claim publicNow.");
  assertBoundary(
    curatedPack.curatedAnchors.every((anchor) => sourceAnchorIds.has(anchor.sourceAnchorId)),
    "Every curated anchor must map back to a source-noted place anchor.",
  );
  assertBoundary(
    curatedPack.curatedAnchors.every((anchor) => anchor.publicPlaceClaim === false),
    "Curated anchors must not claim public places yet.",
  );
  satisfiedGates.push("curated_district_pack");
}

if (anchorPack.sourceNotes.length >= 2 && anchorPack.placeAnchors.length >= 6) {
  satisfiedGates.push("place_anchors_with_source_notes");
} else {
  promotionBlockers.push("Place anchor pack needs source-noted anchors before promotion.");
}

if (
  draftScene.buildings.length > 0 &&
  draftScene.lots.length > 0 &&
  draftScene.roadSegments.length > 0 &&
  draftScene.cameraPresets.some((preset) => preset.id === "desktop") &&
  draftScene.cameraPresets.some((preset) => preset.id === "mobile") &&
  draftScene.cameraPresets.some((preset) => preset.id === "residential_detail")
) {
  satisfiedGates.push("bounded_scene_compiler_proof");
} else {
  promotionBlockers.push("Bounded draft scene must include buildings, lots, roads, and all QA camera presets.");
}

for (const gate of REQUIRED_PLAYABLE_GATES) {
  if (!satisfiedGates.includes(gate)) {
    promotionBlockers.push(`Missing promotion gate: ${gate}.`);
  }
}

const promotionReady = boundaryFailures.length === 0 && REQUIRED_PLAYABLE_GATES.every((gate) => satisfiedGates.includes(gate));
const summary = {
  ok: boundaryFailures.length === 0,
  promotionReady,
  countySlug: candidatePack.countySlug,
  districtSlug: candidatePack.districtSlug,
  currentCoverageTier: candidatePack.currentCoverageTier,
  targetCoverageTier: candidatePack.targetCoverageTier,
  playableNow: candidatePack.playableNow,
  curatedPackPresent: Boolean(curatedPack),
  orangePlayableDistrictCount: orangeCounty.county.playableDistrictCount,
  publicPlayableCounties: directory.playableCounties.map((county) => county.countySlug),
  sourceNoteCount: anchorPack.sourceNotes.length,
  placeAnchorCount: anchorPack.placeAnchors.length,
  curatedAnchorCount: curatedPack?.curatedAnchors.length ?? 0,
  draftScene: {
    id: draftScene.id,
    playable: draftScene.coverage?.playable,
    buildingCount: draftScene.buildings.length,
    lotCount: draftScene.lots.length,
    roadSegmentCount: draftScene.roadSegments.length,
    actorCount: draftScene.actors.length,
    pinCount: draftScene.pins.length,
    selectedPlaceId: draftScene.hudDefaults.selectedPlaceId,
    cameraPresets: draftScene.cameraPresets.map((preset) => preset.id),
  },
  satisfiedGates,
  missingGates: REQUIRED_PLAYABLE_GATES.filter((gate) => !satisfiedGates.includes(gate)),
  promotionBlockers: [...new Set(promotionBlockers)],
  boundaryFailures,
};

console.log(JSON.stringify(summary, null, 2));

if (boundaryFailures.length > 0) {
  process.exitCode = 1;
}

function assertBoundary(condition, message) {
  if (!condition) {
    boundaryFailures.push(message);
  }
}

function parseArgs(argv) {
  const parsed = {
    candidatePackPath: process.env.ATLAS_ANAHEIM_CANDIDATE_PACK ?? DEFAULT_CANDIDATE_PACK,
    anchorPackPath: process.env.ATLAS_ANAHEIM_ANCHOR_PACK ?? DEFAULT_ANCHOR_PACK,
    curatedPackPath: process.env.ATLAS_ANAHEIM_CURATED_PACK ?? DEFAULT_CURATED_PACK,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--candidate-pack") {
      parsed.candidatePackPath = argv[++index];
    } else if (value === "--anchor-pack") {
      parsed.anchorPackPath = argv[++index];
    } else if (value === "--curated-pack") {
      parsed.curatedPackPath = argv[++index];
    } else if (value === "--json-only") {
      // JSON is the only output format; keep the flag for consistency with other verifiers.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return parsed;
}

async function loadOptionalCuratedPack(path) {
  try {
    return parseDistrictCuratedPack(JSON.parse(await readFile(resolve(path), "utf8")), path);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
