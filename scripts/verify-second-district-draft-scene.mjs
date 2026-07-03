#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compileDistrictPlaceAnchorDraftCityWorldScene, parseDistrictPlaceAnchorPack } from "../packages/core/dist/index.js";

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json-only");
const anchorPackPath = getOptionValue(args, "--anchor-pack");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/verify-second-district-draft-scene.mjs --anchor-pack <path> [--json-only]

Verifies that a hidden second-district draft scene is useful for visual review
without becoming public/playable. This does not inspect pixels; it validates
scene shape, hidden-state flags, draft grammar markers, and screenshot packet
guidance for Lumen/Mira review.`);
  process.exit(0);
}

if (!anchorPackPath) {
  throw new Error("Missing required --anchor-pack <path>");
}

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--anchor-pack") {
    index += 1;
    continue;
  }
  if (!["--json-only"].includes(arg)) {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const resolvedAnchorPackPath = resolve(anchorPackPath);
const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(resolvedAnchorPackPath, "utf8")), resolvedAnchorPackPath);
const scene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });
const districtBaseSlug = anchorPack.districtSlug.replace(/-candidate$/, "");
const anchors = anchorPack.placeAnchors.filter((anchor) => anchor.anchorRole !== "district_identity");
const cameraIds = scene.cameraPresets.map((camera) => camera.id);
const buildingIds = scene.buildings.map((building) => building.id);
const roadIds = scene.roadSegments.map((road) => road.id);
const buildingKinds = uniqueSorted(scene.buildings.map((building) => building.kind));
const facadeStyles = uniqueSorted(scene.buildings.map((building) => building.facadeStyle).filter(Boolean));
const roofShapes = uniqueSorted(scene.buildings.map((building) => building.roofShape).filter(Boolean));
const grammarFamilies = uniqueSorted(scene.buildings.map((building) => draftVoxelGrammarFamily(building.id)));
const expected = expectedDistrictMarkers(anchorPack.districtSlug);
const failures = [];

expect(scene.coverage.coverageTier === "L1_COUNTY_SHELL", "draft scene must stay L1_COUNTY_SHELL");
expect(scene.coverage.playable === false, "draft scene must stay non-playable");
expect(scene.actors.length === 0, "draft scene must not emit actors");
expect(scene.pins.length === 0, "draft scene must not emit pins");
expect(scene.props.length === 0, "draft scene must not emit props");
expect(scene.hudDefaults.selectedPlaceId === "", "draft scene must not preselect a place");
expect(cameraIds.includes("desktop") && cameraIds.includes("mobile") && cameraIds.includes("residential_detail"), "draft scene must include desktop, mobile, and residential_detail cameras");
expect(scene.places.length === anchors.length, "draft scene places must match non-identity anchors");
expect(scene.lots.length === anchors.length, "draft scene lots must match non-identity anchors");
expect(scene.terrainTiles.length > 800, "draft scene must include terrain tiles for screenshot review");
expect(scene.roadSegments.length >= expected.minimumRoads, `${anchorPack.districtSlug} must include enough road/contact grammar`);
expect(scene.buildings.length >= expected.minimumBuildings, `${anchorPack.districtSlug} must include enough object grammar`);

for (const id of expected.requiredBuildingIds) {
  expect(buildingIds.includes(id), `${anchorPack.districtSlug} missing required building ${id}`);
}
for (const id of expected.requiredRoadIds) {
  expect(roadIds.includes(id), `${anchorPack.districtSlug} missing required road ${id}`);
}
for (const id of expected.forbiddenBuildingIds) {
  expect(!buildingIds.includes(id), `${anchorPack.districtSlug} leaked foreign building ${id}`);
}
for (const id of expected.forbiddenRoadIds) {
  expect(!roadIds.includes(id), `${anchorPack.districtSlug} leaked foreign road ${id}`);
}
for (const family of expected.requiredGrammarFamilies) {
  expect(grammarFamilies.includes(family), `${anchorPack.districtSlug} missing required grammar family ${family}`);
}

const summary = {
  ok: failures.length === 0,
  anchorPackPath: resolvedAnchorPackPath,
  districtSlug: anchorPack.districtSlug,
  countySlug: anchorPack.countySlug,
  sceneId: scene.id,
  countyLabel: scene.region.county,
  districtLabel: scene.hudDefaults.districtLabel,
  coverage: scene.coverage,
  counts: {
    terrainTiles: scene.terrainTiles.length,
    roadSegments: scene.roadSegments.length,
    lots: scene.lots.length,
    buildings: scene.buildings.length,
    places: scene.places.length,
    props: scene.props.length,
    pins: scene.pins.length,
    actors: scene.actors.length,
  },
  cameraPresets: cameraIds,
  buildingKinds,
  facadeStyles,
  roofShapes,
  grammarFamilies,
  noLabelAnchorRecognitionRequired: true,
  visualReadiness: "requires-screenshot-review",
  requiredBuildingIdsPresent: expected.requiredBuildingIds,
  requiredRoadIdsPresent: expected.requiredRoadIds,
  requiredGrammarFamiliesPresent: expected.requiredGrammarFamilies,
  sampleBuildingIds: buildingIds.slice(0, 18),
  sampleRoadIds: roadIds,
  visualPacketGuidance: {
    district: districtBaseSlug,
    targetAnchors: expected.targetAnchors,
    expectedScreenshotNames: [
      "riverside-baseline-desktop-1280x720.png",
      "riverside-baseline-mobile-390x844.png",
      `${districtBaseSlug}-desktop-1280x720.png`,
      `${districtBaseSlug}-mobile-390x844.png`,
      `${districtBaseSlug}-detail-desktop-1280x720.png`,
      `${districtBaseSlug}-detail-mobile-390x844.png`,
      `${districtBaseSlug}-no-label-anchor-1.png`,
      `${districtBaseSlug}-no-label-anchor-2.png`,
      "shell-state-desktop-1280x720.png",
      "shell-state-mobile-390x844.png",
      "visual-review.json",
    ],
    templateCommand: `node scripts\\verify-second-district-visual-packet.mjs --district ${districtBaseSlug} --print-template ${expected.targetAnchors.map((anchor) => `--target-anchor "${anchor}"`).join(" ")}`,
    verifyCommand: `node scripts\\verify-second-district-visual-packet.mjs --district ${districtBaseSlug} --screenshots <packet-dir> --json-only`,
  },
  failures,
};

if (jsonOnly) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`${summary.ok ? "PASS" : "FAIL"} ${anchorPack.districtSlug} hidden draft scene`);
  console.log(JSON.stringify(summary, null, 2));
}

if (!summary.ok) {
  process.exit(1);
}

function getOptionValue(values, optionName) {
  const index = values.indexOf(optionName);
  if (index === -1) return undefined;
  return values[index + 1];
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function expectedDistrictMarkers(districtSlug) {
  if (districtSlug === "ontario-candidate") {
    return {
      minimumBuildings: 14,
      minimumRoads: 7,
      targetAnchors: ["Ontario International Airport", "Ontario Mills / commerce core"],
      requiredGrammarFamilies: ["airport_logistics_edge", "commercial_edge", "residential_variety", "civic_core"],
      requiredBuildingIds: [
        "draft-building-ontario-international-airport-terminal-hall",
        "draft-building-ontario-international-airport-control-tower",
        "draft-building-ontario-mills-commercial-anchor-retail-hall-west",
        "draft-building-ontario-inland-residential-variety-rowhome-street",
      ],
      requiredRoadIds: ["draft-road-airport-edge", "draft-road-ontario-commerce-spine", "draft-drive-airport", "draft-drive-mills"],
      forbiddenBuildingIds: ["draft-building-anaheim-convention-center-entry-spine", "draft-building-artic-transit-center-terminal-shed"],
      forbiddenRoadIds: ["draft-drive-convention", "draft-drive-stadium"],
    };
  }

  return {
    minimumBuildings: 17,
    minimumRoads: 6,
    targetAnchors: ["Anaheim Convention Center", "ARTIC / Angel Stadium area"],
    requiredGrammarFamilies: ["large_venue_hall", "transit_hub", "stadium_bowl", "mixed_use_edge"],
    requiredBuildingIds: [
      "draft-building-anaheim-convention-center-entry-spine",
      "draft-building-artic-transit-center-terminal-shed",
      "draft-building-angel-stadium-venue-bowl-west",
      "draft-building-platinum-triangle-area-rowhome-street",
    ],
    requiredRoadIds: ["draft-road-katella", "draft-road-harbor", "draft-drive-convention", "draft-drive-stadium"],
    forbiddenBuildingIds: ["draft-building-ontario-international-airport-terminal-hall", "draft-building-ontario-mills-commercial-anchor-retail-hall-west"],
    forbiddenRoadIds: ["draft-road-airport-edge", "draft-drive-airport", "draft-drive-mills"],
  };
}

function draftVoxelGrammarFamily(id) {
  if (id.includes("anaheim-convention-center")) return "large_venue_hall";
  if (id.includes("artic-transit-center")) return "transit_hub";
  if (id.includes("angel-stadium")) return "stadium_bowl";
  if (id.includes("platinum-triangle")) return "mixed_use_edge";
  if (id.includes("ontario-international-airport")) return "airport_logistics_edge";
  if (id.includes("ontario-mills") || id.includes("downtown-service")) return "commercial_edge";
  if (id.includes("ontario-civic") || id.includes("downtown-anaheim-community")) return "civic_core";
  if (id.includes("ontario-inland-residential")) return "residential_variety";
  return "generic_draft";
}
