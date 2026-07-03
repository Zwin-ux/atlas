import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const DEFAULT_CURATED_PACK = "data/district_curated_packs/anaheim-curated-district-draft.json";
const DEFAULT_MANIFEST = "packages/assets/city-world/atlas.manifest.json";
const REQUIRED_PUBLIC_NAMING_REVIEW_ANCHORS = new Set([
  "anaheim-convention-center-landmark",
  "artic-transit-terminal",
  "angel-stadium-venue",
  "downtown-community-civic-anchor",
]);
const REQUIRED_SOURCE_ART_BY_ANCHOR = {
  "platinum-triangle-mixed-use-cluster": "building.house.rowhome.flat_parapet.v1",
  "anaheim-convention-center-landmark": "building.venue.anaheim_convention_center.v1",
  "artic-transit-terminal": "building.venue.artic_terminal.v1",
  "angel-stadium-venue": "building.venue.angel_stadium.v1",
  "downtown-community-civic-anchor": "building.civic.downtown_anaheim_community_center.v1",
};

const args = parseArgs(process.argv.slice(2));
const curatedPack = JSON.parse(await readFile(resolve(args.curatedPackPath), "utf8"));
const manifest = JSON.parse(await readFile(resolve(args.manifestPath), "utf8"));
const manifestSpriteKeys = new Set(Object.keys(manifest.sprites ?? {}));
const manifestPaletteKeys = new Set(Object.keys(manifest.palettes ?? {}));

const boundaryFailures = [];
const objectSourceBlockers = [];
const namingRiskBlockers = [];
const sourceArtCoverage = [];
const namingRiskAnchors = [];

assertBoundary(curatedPack.countySlug === "orange-ca", "Curated draft must stay scoped to orange-ca.");
assertBoundary(curatedPack.districtSlug === "anaheim-candidate", "Curated draft must stay scoped to anaheim-candidate.");
assertBoundary(curatedPack.promotionStatus === "draft_only", "Curated draft must remain draft_only.");
assertBoundary(curatedPack.currentCoverageTier === "L1_COUNTY_SHELL", "Anaheim must remain L1 shell.");
assertBoundary(curatedPack.targetCoverageTier === "L2_CURATED_DISTRICT", "Anaheim target tier must remain L2 curated district.");
assertBoundary(curatedPack.playableNow === false, "Curated draft must not claim playableNow.");
assertBoundary(curatedPack.publicNow === false, "Curated draft must not claim publicNow.");

const sourceNoteIds = new Set((curatedPack.sourceNotes ?? []).map((note) => note.id));

for (const anchor of curatedPack.curatedAnchors ?? []) {
  assertBoundary(anchor.publicPlaceClaim === false, `${anchor.id} must not claim a public place.`);
  assertBoundary(anchor.renderPolicy !== "public", `${anchor.id} must not use a public render policy.`);

  for (const sourceNoteId of anchor.sourceNoteIds ?? []) {
    assertBoundary(sourceNoteIds.has(sourceNoteId), `${anchor.id} references missing source note ${sourceNoteId}.`);
  }

  const requiredSpriteKey = REQUIRED_SOURCE_ART_BY_ANCHOR[anchor.id];
  if (requiredSpriteKey) {
    const hasSprite = manifestSpriteKeys.has(requiredSpriteKey);
    const hasPalette = manifestPaletteKeys.has(requiredSpriteKey);
    sourceArtCoverage.push({
      anchorId: anchor.id,
      label: anchor.label,
      requiredSpriteKey,
      hasSprite,
      hasPalette,
      publicPlaceClaim: anchor.publicPlaceClaim,
    });

    if (!hasSprite || !hasPalette) {
      objectSourceBlockers.push(
        `${anchor.label} needs source-quality object art before public promotion: missing ${[
          hasSprite ? "" : "sprite",
          hasPalette ? "" : "palette",
        ]
          .filter(Boolean)
          .join(" and ")} for ${requiredSpriteKey}.`,
      );
    }
  }

  if (REQUIRED_PUBLIC_NAMING_REVIEW_ANCHORS.has(anchor.id)) {
    namingRiskAnchors.push({
      anchorId: anchor.id,
      label: anchor.label,
      sourceNoteIds: anchor.sourceNoteIds ?? [],
      publicNamingReviewRequired: true,
      publicPlaceClaim: anchor.publicPlaceClaim,
    });
    namingRiskBlockers.push(`${anchor.label} requires public naming/app-review decision before any playable/public claim.`);
  }
}

if ((curatedPack.promotionBlockers ?? []).includes("visual_acceptance_missing")) {
  objectSourceBlockers.push("Curated draft still declares visual_acceptance_missing.");
}

if ((curatedPack.promotionBlockers ?? []).includes("coordinates_or_bounds_missing")) {
  objectSourceBlockers.push("Curated draft still declares coordinates_or_bounds_missing.");
}

if ((curatedPack.promotionBlockers ?? []).includes("public_product_loop_screenshots_missing")) {
  objectSourceBlockers.push("Curated draft still declares public_product_loop_screenshots_missing.");
}

const uniqueObjectSourceBlockers = [...new Set(objectSourceBlockers)];
const uniqueNamingRiskBlockers = [...new Set(namingRiskBlockers)];
const promotionReady = boundaryFailures.length === 0 && uniqueObjectSourceBlockers.length === 0 && uniqueNamingRiskBlockers.length === 0;

const summary = {
  ok: boundaryFailures.length === 0,
  promotionReady,
  countySlug: curatedPack.countySlug,
  districtSlug: curatedPack.districtSlug,
  currentCoverageTier: curatedPack.currentCoverageTier,
  targetCoverageTier: curatedPack.targetCoverageTier,
  playableNow: curatedPack.playableNow,
  publicNow: curatedPack.publicNow,
  sourceArtCoverage,
  namingRiskAnchors,
  objectSourceBlockers: uniqueObjectSourceBlockers,
  namingRiskBlockers: uniqueNamingRiskBlockers,
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
    curatedPackPath: process.env.ATLAS_ANAHEIM_CURATED_PACK ?? DEFAULT_CURATED_PACK,
    manifestPath: process.env.ATLAS_CITY_WORLD_ATLAS_MANIFEST ?? DEFAULT_MANIFEST,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--curated-pack") {
      parsed.curatedPackPath = argv[++index];
    } else if (value === "--manifest") {
      parsed.manifestPath = argv[++index];
    } else if (value === "--json-only") {
      // JSON is the only output format; keep parity with other verifiers.
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return parsed;
}
