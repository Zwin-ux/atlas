import type {
  CityWorldBuilding,
  CityWorldPoint,
  CityWorldScene,
} from "./cityWorldTypes.js";
import { cityWorldClamp, cityWorldPointDistance, cityWorldSegmentLength } from "./cityWorldBasis.js";
import {
  cityWorldBuildingTouchesLot,
  cityWorldLotTouchesRoad,
  isAuthoredCityWorldTerrainTile,
  isEmptyCityWorldBoardTerrainTile,
  sampleCityWorldViewportForCameraPreset,
} from "./cityWorldTerrainSampler.js";

export type CityWorldEngineDiagnosticScenario = "playable" | "shell" | "hidden_draft";

export type CityWorldEngineDiagnosticAxis =
  | "terrain_massing"
  | "density"
  | "contact"
  | "object_authorship"
  | "clone_pressure"
  | "no_label"
  | "source_contrast"
  | "fallback"
  | "boundary";

export type CityWorldEngineDiagnosticIssue = {
  axis: CityWorldEngineDiagnosticAxis;
  code: string;
  message: string;
};

export type CityWorldEngineDiagnosticReport = {
  type: "cityWorldEngineDiagnostics";
  update: "prealpha-0.6f-engine-diagnostics";
  sceneId: string;
  scenario: CityWorldEngineDiagnosticScenario;
  coverageTier: NonNullable<CityWorldScene["coverage"]>["coverageTier"] | "NONE";
  playable: boolean;
  counts: {
    terrainTiles: number;
    roadSegments: number;
    lots: number;
    buildings: number;
    props: number;
    places: number;
    pins: number;
    actors: number;
  };
  distributions: {
    terrainChunkMassing: Record<string, number>;
    terrainComposition: Record<string, number>;
    terrainElevation: Record<string, number>;
    roadProfiles: Record<string, number>;
    lotProfiles: Record<string, number>;
    parcelElevation: Record<string, number>;
    objectFamilies: Record<string, number>;
    clusterRoles: Record<string, number>;
    noLabelPriority: Record<string, number>;
    spriteKeys: Record<string, number>;
  };
  metrics: {
    worldCellCount: number;
    terrainMassingCoverageRatio: number;
    terrainAuthoredCoverageRatio: number;
    emptyBoardRatio: number;
    focalFeatureDensityRatio: number;
    buildingLotContactRatio: number;
    lotRoadContactRatio: number;
    objectFamilyCoverageRatio: number;
    homeClonePressure: number;
    homeVariantCount: number;
    firstViewportCompositionScore: number;
    chunkEdgeReadabilityFloorScore: number;
    viewportComposition: Record<string, CityWorldViewportCompositionMetric>;
    noLabelPrimaryAnchorCount: number;
    noLabelSupportingAnchorCount: number;
    noLabelTargetFamilyCoverageRatio: number;
    noLabelAnchorSeparationScore: number;
    noLabelRecognitionProxyScore: number;
    faceOrientationCoverageRatio: number;
    roofSideSeparationRatio: number;
    facadeContrastCoverageRatio: number;
    objectSignatureCoverageRatio: number;
    weakestObjectFamily: string;
    hiddenAnchorContrastScore: number;
    weakestHiddenAnchor: string;
    civicVenueStressCells: CityWorldCivicVenueStressCellMetric[];
    civicVenueObjectKitScore: number;
    weakestCivicVenueStressCell: string;
    spriteBackedBuildingRatio: number;
    primitiveFallbackEligibleRatio: number;
  };
  hardBlockers: CityWorldEngineDiagnosticIssue[];
  warnings: CityWorldEngineDiagnosticIssue[];
  nextWeakestAxis: CityWorldEngineDiagnosticAxis;
};

export type CityWorldCivicVenueStressCellKind = "public_civic_landmark" | "hidden_venue_anchor";

export type CityWorldCivicVenueStressCellMetric = {
  id: string;
  label: string;
  kind: CityWorldCivicVenueStressCellKind;
  objectFamily: string;
  buildingCount: number;
  silhouetteScore: number;
  hierarchyScore: number;
  mobileReadinessScore: number;
  noLabelReadinessScore: number;
  objectKitScore: number;
};

export type CityWorldViewportCompositionMetric = {
  cameraPresetId: string;
  terrainTilesInFrame: number;
  terrainMassingVisibleRatio: number;
  chunkEdgeRatio: number;
  terrainElevationVisibleRatio: number;
  chunkEdgeReadabilityScore: number;
  featureDensityRatio: number;
  objectFamilyCount: number;
  score: number;
};

export function analyzeCityWorldScene(
  scene: CityWorldScene,
  scenario: CityWorldEngineDiagnosticScenario = inferDiagnosticScenario(scene),
): CityWorldEngineDiagnosticReport {
  const terrainMassing = countBy(scene.terrainTiles, (tile) => tile.visualGrammar?.terrainChunkMassing ?? "none");
  const terrainComposition = countBy(scene.terrainTiles, (tile) => tile.visualGrammar?.terrainComposition ?? "none");
  const terrainElevation = countBy(scene.terrainTiles, (tile) => tile.visualGrammar?.terrainElevation ?? "none");
  const roadProfiles = countBy(scene.roadSegments, (road) => road.visualGrammar?.roadProfile ?? "none");
  const lotProfiles = countBy(scene.lots, (lot) => lot.visualGrammar?.lotProfile ?? "none");
  const parcelElevation = countBy(scene.lots, (lot) => lot.visualGrammar?.parcelElevation ?? "none");
  const objectFamilies = countBy(scene.buildings, (building) => building.visualGrammar?.objectFamily ?? "none");
  const clusterRoles = countBy(scene.buildings, (building) => building.visualGrammar?.clusterRole ?? "none");
  const noLabelPriority = countBy(scene.buildings, (building) => building.visualGrammar?.noLabelPriority ?? "none");
  const spriteKeys = countBy([...scene.terrainTiles, ...scene.roadSegments, ...scene.lots, ...scene.buildings, ...scene.props, ...scene.actors, ...scene.pins], (item) => item.spriteKey ?? "primitive");
  const worldCellCount = Math.max(1, (scene.bounds.maxX - scene.bounds.minX + 1) * (scene.bounds.maxY - scene.bounds.minY + 1));
  const authoredTerrainCount = scene.terrainTiles.filter(isAuthoredCityWorldTerrainTile).length;
  const emptyTerrainCount = scene.terrainTiles.filter((tile) => isEmptyCityWorldBoardTerrainTile(tile, scene)).length;
  const featureArea = scene.lots.reduce((sum, lot) => sum + lot.width * lot.depth, 0) +
    scene.buildings.reduce((sum, building) => sum + building.width * building.depth, 0) +
    scene.roadSegments.reduce((sum, road) => sum + cityWorldSegmentLength(road.from, road.to) * road.width, 0);
  const homes = scene.buildings.filter((building) => building.kind === "home");
  const homeVariantCounts = countBy(homes, (building) => homeVariantKey(building));
  const maxHomeVariantCount = Math.max(0, ...Object.values(homeVariantCounts));
  const buildingLotContacts = scene.buildings.filter((building) => scene.lots.some((lot) => cityWorldBuildingTouchesLot(building, lot))).length;
  const lotRoadContacts = scene.lots.filter((lot) => scene.roadSegments.some((road) => cityWorldLotTouchesRoad(lot, road))).length;
  const spriteBackedBuildings = scene.buildings.filter((building) => Boolean(building.spriteKey)).length;
  const expectedObjectFamilies = scenario === "hidden_draft" ? 4 : scenario === "playable" ? 5 : 1;
  const objectFamilyCount = Object.keys(objectFamilies).filter((family) => family !== "none").length;
  const noLabelPrimaryBuildings = scene.buildings.filter((building) => building.visualGrammar?.noLabelPriority === "primary_anchor");
  const noLabelPrimaryFamilies = new Set<string>();
  for (const building of noLabelPrimaryBuildings) {
    if (building.visualGrammar?.objectFamily) noLabelPrimaryFamilies.add(building.visualGrammar.objectFamily);
  }
  const noLabelTargetFamilies = expectedNoLabelTargetFamilies(scene);
  const noLabelAnchorGroups = expectedNoLabelAnchorGroups(scene);
  const noLabelTargetFamilyCoverageRatio = noLabelTargetFamilies.length > 0
    ? ratio(noLabelTargetFamilies.filter((family) => noLabelPrimaryFamilies.has(family)).length, noLabelTargetFamilies.length)
    : 1;
  const noLabelAnchorSeparationScore = noLabelAnchorGroups.length > 0 ? noLabelGroupSeparationScore(noLabelPrimaryBuildings, noLabelAnchorGroups) : 1;
  const faceContrast = buildingFaceContrastMetrics(scene.buildings, expectedObjectFamilies, noLabelAnchorGroups);
  const civicVenueStressCells = civicVenueStressCellMetrics(scene);
  const weakestCivicVenueStressCell = civicVenueStressCells.sort((a, b) => a.objectKitScore - b.objectKitScore)[0] ?? null;
  const viewportComposition = viewportCompositionMetrics(scene);
  const firstViewportCompositionScore = Math.min(1, ...Object.values(viewportComposition).map((item) => item.score));
  const chunkEdgeReadabilityFloorScore = Math.min(1, ...Object.values(viewportComposition).map((item) => item.chunkEdgeReadabilityScore));
  const hardBlockers: CityWorldEngineDiagnosticIssue[] = [];
  const warnings: CityWorldEngineDiagnosticIssue[] = [];
  const metrics = {
    worldCellCount,
    terrainMassingCoverageRatio: ratio(nonNoneCount(terrainMassing), scene.terrainTiles.length),
    terrainAuthoredCoverageRatio: ratio(authoredTerrainCount, scene.terrainTiles.length),
    emptyBoardRatio: ratio(emptyTerrainCount, scene.terrainTiles.length),
    focalFeatureDensityRatio: cityWorldClamp(featureArea / worldCellCount, 0, 1),
    buildingLotContactRatio: ratio(buildingLotContacts, scene.buildings.length),
    lotRoadContactRatio: ratio(lotRoadContacts, scene.lots.length),
    objectFamilyCoverageRatio: cityWorldClamp(objectFamilyCount / expectedObjectFamilies, 0, 1),
    homeClonePressure: ratio(maxHomeVariantCount, homes.length),
    homeVariantCount: Object.keys(homeVariantCounts).length,
    firstViewportCompositionScore,
    chunkEdgeReadabilityFloorScore,
    viewportComposition,
    noLabelPrimaryAnchorCount: noLabelPriority.primary_anchor ?? 0,
    noLabelSupportingAnchorCount: noLabelPriority.supporting ?? 0,
    noLabelTargetFamilyCoverageRatio,
    noLabelAnchorSeparationScore,
    noLabelRecognitionProxyScore: roundMetric(noLabelTargetFamilyCoverageRatio * 0.62 + noLabelAnchorSeparationScore * 0.38),
    faceOrientationCoverageRatio: faceContrast.faceOrientationCoverageRatio,
    roofSideSeparationRatio: faceContrast.roofSideSeparationRatio,
    facadeContrastCoverageRatio: faceContrast.facadeContrastCoverageRatio,
    objectSignatureCoverageRatio: faceContrast.objectSignatureCoverageRatio,
    weakestObjectFamily: faceContrast.weakestObjectFamily,
    hiddenAnchorContrastScore: faceContrast.hiddenAnchorContrastScore,
    weakestHiddenAnchor: faceContrast.weakestHiddenAnchor,
    civicVenueStressCells,
    civicVenueObjectKitScore: civicVenueStressCells.length > 0 ? civicVenueStressCells.reduce((floor, cell) => Math.min(floor, cell.objectKitScore), 1) : 1,
    weakestCivicVenueStressCell: weakestCivicVenueStressCell?.id ?? "none",
    spriteBackedBuildingRatio: ratio(spriteBackedBuildings, scene.buildings.length),
    primitiveFallbackEligibleRatio: primitiveFallbackEligibleRatio(scene),
  };

  collectHardBoundaryIssues(scene, scenario, hardBlockers);
  collectMetricWarnings(scenario, metrics, warnings);

  return {
    type: "cityWorldEngineDiagnostics",
    update: "prealpha-0.6f-engine-diagnostics",
    sceneId: scene.id,
    scenario,
    coverageTier: scene.coverage?.coverageTier ?? "NONE",
    playable: scene.coverage?.playable ?? scenario === "playable",
    counts: {
      terrainTiles: scene.terrainTiles.length,
      roadSegments: scene.roadSegments.length,
      lots: scene.lots.length,
      buildings: scene.buildings.length,
      props: scene.props.length,
      places: scene.places.length,
      pins: scene.pins.length,
      actors: scene.actors.length,
    },
    distributions: {
      terrainChunkMassing: terrainMassing,
      terrainComposition,
      terrainElevation,
      roadProfiles,
      lotProfiles,
      parcelElevation,
      objectFamilies,
      clusterRoles,
      noLabelPriority,
      spriteKeys,
    },
    metrics,
    hardBlockers,
    warnings,
    nextWeakestAxis: chooseWeakestAxis(metrics, warnings),
  };
}

function inferDiagnosticScenario(scene: CityWorldScene): CityWorldEngineDiagnosticScenario {
  if (scene.id.includes("-draft-")) return "hidden_draft";
  if (scene.coverage?.coverageTier === "L1_COUNTY_SHELL") return "shell";
  return "playable";
}

function collectHardBoundaryIssues(scene: CityWorldScene, scenario: CityWorldEngineDiagnosticScenario, hardBlockers: CityWorldEngineDiagnosticIssue[]) {
  const actorKinds = new Set(scene.actors.map((actor) => actor.kind));
  for (const forbiddenActor of ["car", "walker"] as const) {
    if (actorKinds.has(forbiddenActor)) {
      hardBlockers.push({ axis: "boundary", code: `FORBIDDEN_${forbiddenActor.toUpperCase()}`, message: `Scene emits forbidden actor kind ${forbiddenActor}.` });
    }
  }

  const propKinds = new Set(scene.props.map((prop) => prop.kind));
  for (const forbiddenProp of ["bench", "streetlight", "fountain", "sign", "parked_car", "cloud"] as const) {
    if (propKinds.has(forbiddenProp)) {
      hardBlockers.push({ axis: "boundary", code: `FORBIDDEN_${forbiddenProp.toUpperCase()}`, message: `Scene emits forbidden decorative prop ${forbiddenProp}.` });
    }
  }

  const serializedScene = JSON.stringify(scene).toLowerCase();
  for (const providerToken of ["google.maps", "googlemapsadapter", "geodataadapter", "maps.googleapis.com", "places.googleapis.com"]) {
    if (serializedScene.includes(providerToken)) {
      hardBlockers.push({ axis: "boundary", code: "PROVIDER_PAYLOAD_LEAK", message: `Scene data contains provider token ${providerToken}.` });
    }
  }

  if (scenario === "shell") {
    if (scene.places.length > 0 || scene.lots.length > 0 || scene.buildings.length > 0 || scene.pins.length > 0 || scene.actors.length > 0) {
      hardBlockers.push({ axis: "boundary", code: "SHELL_FAKE_CONTENT", message: "Shell scenes must not emit places, lots, buildings, pins, or actors." });
    }
    if (scene.coverage?.playable) {
      hardBlockers.push({ axis: "boundary", code: "SHELL_PLAYABLE_CLAIM", message: "Shell scene claims playable coverage." });
    }
  }

  if (scenario === "hidden_draft") {
    if (scene.coverage?.playable) {
      hardBlockers.push({ axis: "boundary", code: "DRAFT_PLAYABLE_CLAIM", message: "Hidden draft scene claims playable coverage." });
    }
    if (scene.actors.length > 0 || scene.pins.length > 0 || scene.hudDefaults.selectedPlaceId) {
      hardBlockers.push({ axis: "boundary", code: "DRAFT_PUBLIC_TOOLS", message: "Hidden draft scene emits actors, pins, or selected public-place state." });
    }
  }
}

function collectMetricWarnings(
  scenario: CityWorldEngineDiagnosticScenario,
  metrics: CityWorldEngineDiagnosticReport["metrics"],
  warnings: CityWorldEngineDiagnosticIssue[],
) {
  if (scenario === "playable") {
    warnBelow(warnings, "terrain_massing", "LOW_TERRAIN_MASSING", metrics.terrainMassingCoverageRatio, 0.08, "Playable scene has too little terrain chunk massing.");
    warnAbove(warnings, "density", "HIGH_EMPTY_BOARD", metrics.emptyBoardRatio, 0.42, "Playable scene still has a high empty-board ratio.");
    warnBelow(warnings, "contact", "LOW_BUILDING_LOT_CONTACT", metrics.buildingLotContactRatio, 0.86, "Too many buildings are not grounded by lot contact.");
    warnBelow(warnings, "contact", "LOW_LOT_ROAD_CONTACT", metrics.lotRoadContactRatio, 0.72, "Too many lots lack road/contact access.");
    warnBelow(warnings, "object_authorship", "LOW_OBJECT_FAMILY_COVERAGE", metrics.objectFamilyCoverageRatio, 0.9, "Playable scene does not cover enough object families.");
    warnBelow(warnings, "object_authorship", "LOW_FACE_ORIENTATION_COVERAGE", metrics.faceOrientationCoverageRatio, 0.9, "Playable scene lacks enough front/side/top face orientation cues.");
    warnBelow(warnings, "object_authorship", "LOW_ROOF_SIDE_SEPARATION", metrics.roofSideSeparationRatio, 0.85, "Playable scene lacks enough roof/body separation.");
    warnBelow(warnings, "source_contrast", "LOW_FACADE_CONTRAST", metrics.facadeContrastCoverageRatio, 0.75, "Playable scene lacks enough facade/material contrast.");
    warnBelow(warnings, "source_contrast", "LOW_OBJECT_SIGNATURE_COVERAGE", metrics.objectSignatureCoverageRatio, 0.7, "Playable scene object families are not distinct enough.");
    warnBelow(warnings, "object_authorship", "LOW_CIVIC_VENUE_OBJECT_KIT", metrics.civicVenueObjectKitScore, 0.78, "Playable civic/venue stress cell does not clear the reusable object-kit floor.");
    warnAbove(warnings, "clone_pressure", "HIGH_HOME_CLONE_PRESSURE", metrics.homeClonePressure, 0.24, "Residential kit still has high clone pressure.");
    warnBelow(warnings, "density", "LOW_FIRST_VIEWPORT_COMPOSITION", metrics.firstViewportCompositionScore, 0.55, "Initial camera frames do not contain enough meaningful engine structure.");
  }

  if (scenario === "hidden_draft") {
    warnBelow(warnings, "no_label", "LOW_PRIMARY_ANCHORS", metrics.noLabelPrimaryAnchorCount, 2, "Hidden draft has fewer than two no-label primary anchors.");
    warnBelow(warnings, "no_label", "LOW_TARGET_FAMILY_COVERAGE", metrics.noLabelTargetFamilyCoverageRatio, 1, "Hidden draft no-label targets do not cover the required anchor families.");
    warnBelow(warnings, "no_label", "LOW_ANCHOR_SEPARATION", metrics.noLabelAnchorSeparationScore, 0.72, "Hidden draft no-label anchor families are not structurally separated enough.");
    warnBelow(warnings, "source_contrast", "LOW_HIDDEN_ANCHOR_CONTRAST", metrics.hiddenAnchorContrastScore, 0.68, "Hidden draft no-label anchors do not have enough source-art contrast.");
    warnBelow(warnings, "object_authorship", "LOW_HIDDEN_CIVIC_VENUE_OBJECT_KIT", metrics.civicVenueObjectKitScore, 0.74, "Hidden draft civic/venue stress cell does not clear the reusable object-kit floor.");
    warnBelow(warnings, "object_authorship", "LOW_DRAFT_OBJECT_FAMILIES", metrics.objectFamilyCoverageRatio, 0.75, "Hidden draft lacks enough object-family coverage.");
  }
}

function warnBelow(
  warnings: CityWorldEngineDiagnosticIssue[],
  axis: CityWorldEngineDiagnosticAxis,
  code: string,
  value: number,
  target: number,
  message: string,
) {
  if (value < target) {
    warnings.push({ axis, code, message: `${message} Current ${formatNumber(value)}, target ${formatNumber(target)}.` });
  }
}

function warnAbove(
  warnings: CityWorldEngineDiagnosticIssue[],
  axis: CityWorldEngineDiagnosticAxis,
  code: string,
  value: number,
  target: number,
  message: string,
) {
  if (value > target) {
    warnings.push({ axis, code, message: `${message} Current ${formatNumber(value)}, target ${formatNumber(target)}.` });
  }
}

function chooseWeakestAxis(
  metrics: CityWorldEngineDiagnosticReport["metrics"],
  warnings: CityWorldEngineDiagnosticIssue[],
): CityWorldEngineDiagnosticAxis {
  const warningCounts = countBy(warnings, (warning) => warning.axis);
  const warningLeader = Object.entries(warningCounts).sort((a, b) => b[1] - a[1])[0];
  if (warningLeader?.[0]) return warningLeader[0] as CityWorldEngineDiagnosticAxis;
  const scores: Array<[CityWorldEngineDiagnosticAxis, number]> = [
    ["terrain_massing", metrics.terrainMassingCoverageRatio],
    ["density", 1 - metrics.emptyBoardRatio],
    ["contact", Math.min(metrics.buildingLotContactRatio, metrics.lotRoadContactRatio)],
    ["object_authorship", metrics.objectFamilyCoverageRatio],
    ["object_authorship", metrics.faceOrientationCoverageRatio],
    ["source_contrast", metrics.facadeContrastCoverageRatio],
    ["source_contrast", metrics.objectSignatureCoverageRatio],
    ["object_authorship", metrics.civicVenueObjectKitScore],
    ["clone_pressure", 1 - metrics.homeClonePressure],
    ["no_label", metrics.hiddenAnchorContrastScore],
    ["terrain_massing", metrics.chunkEdgeReadabilityFloorScore],
    ["density", metrics.firstViewportCompositionScore],
    ["fallback", metrics.primitiveFallbackEligibleRatio],
  ];
  return scores.sort((a, b) => a[1] - b[1])[0]?.[0] ?? "density";
}

type BuildingFaceContrastScore = {
  building: CityWorldBuilding;
  family: string;
  faceScore: number;
  roofBodySeparationScore: number;
  grammarRichnessScore: number;
};

function buildingFaceContrastMetrics(buildings: CityWorldBuilding[], expectedObjectFamilyCount: number, hiddenAnchorGroups: string[]) {
  const scores = buildings.map(buildingFaceContrastScore);
  const familyScores = groupBuildingFaceScoresByFamily(scores);
  const familySignatureCoverage = objectSignatureCoverageRatio(familyScores, expectedObjectFamilyCount);
  const weakestObjectFamily = weakestFaceScoreFamily(familyScores);
  const hiddenAnchorScores = hiddenAnchorGroups.map((group) => ({
    group,
    score: hiddenAnchorGroupContrastScore(buildings.filter((building) => building.id.includes(group))),
  }));
  const weakestHiddenAnchor = hiddenAnchorScores.sort((a, b) => a.score - b.score)[0] ?? null;

  return {
    faceOrientationCoverageRatio: ratio(scores.filter((score) => score.faceScore >= 0.88).length, scores.length),
    roofSideSeparationRatio: ratio(scores.filter((score) => hasRoofSideSeparation(score)).length, scores.length),
    facadeContrastCoverageRatio: ratio(scores.filter((score) => hasFacadeContrast(score)).length, scores.length),
    objectSignatureCoverageRatio: familySignatureCoverage,
    weakestObjectFamily: weakestObjectFamily?.family ?? "none",
    hiddenAnchorContrastScore: hiddenAnchorScores.length > 0 ? roundMetric(Math.min(...hiddenAnchorScores.map((item) => item.score))) : 1,
    weakestHiddenAnchor: weakestHiddenAnchor?.group ?? "none",
  };
}

function buildingFaceContrastScore(building: CityWorldBuilding): BuildingFaceContrastScore {
  const grammarFeatures = [
    Boolean(building.facadeStyle),
    Boolean(building.roofShape),
    Boolean(building.visualGrammar?.materialProfile),
    Boolean(building.visualGrammar?.roofProfile),
    Boolean(building.visualGrammar?.objectFamily),
    Boolean(building.visualGrammar?.clusterRole),
    building.width !== building.depth || building.height > 1,
  ];
  const grammarRichnessScore = ratio(grammarFeatures.filter(Boolean).length, grammarFeatures.length);
  const roofBodySeparationScore = colorSeparationScore(building.bodyColor, building.roofColor);

  return {
    building,
    family: building.visualGrammar?.objectFamily ?? "none",
    faceScore: roundMetric(roofBodySeparationScore * 0.4 + grammarRichnessScore * 0.6),
    roofBodySeparationScore,
    grammarRichnessScore,
  };
}

function hasRoofSideSeparation(score: BuildingFaceContrastScore): boolean {
  return Boolean(score.building.roofShape && score.building.visualGrammar?.roofProfile && score.building.visualGrammar?.materialProfile && score.roofBodySeparationScore >= 0.9);
}

function hasFacadeContrast(score: BuildingFaceContrastScore): boolean {
  return Boolean(score.building.facadeStyle && score.building.visualGrammar?.objectFamily && score.grammarRichnessScore >= 0.86 && score.faceScore >= 0.86);
}

function colorSeparationScore(bodyColor: string, roofColor: string): number {
  const body = parseHexColor(bodyColor);
  const roof = parseHexColor(roofColor);
  if (!body || !roof) return 0;
  const distance = Math.sqrt(
    (body.r - roof.r) ** 2 +
    (body.g - roof.g) ** 2 +
    (body.b - roof.b) ** 2,
  );
  return roundMetric(cityWorldClamp(distance / 124, 0, 1));
}

function parseHexColor(value: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value);
  if (!match?.[1]) return null;
  const numeric = Number.parseInt(match[1], 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function groupBuildingFaceScoresByFamily(scores: BuildingFaceContrastScore[]): Record<string, BuildingFaceContrastScore[]> {
  const grouped: Record<string, BuildingFaceContrastScore[]> = {};
  for (const score of scores) {
    grouped[score.family] ??= [];
    grouped[score.family]?.push(score);
  }
  return grouped;
}

function objectSignatureCoverageRatio(groupedScores: Record<string, BuildingFaceContrastScore[]>, expectedObjectFamilyCount: number): number {
  const families = Object.entries(groupedScores).filter(([family]) => family !== "none");
  const passingFamilies = families.filter(([, scores]) => familyHasDistinctSignature(scores)).length;
  return cityWorldClamp(ratio(passingFamilies, expectedObjectFamilyCount), 0, 1);
}

function familyHasDistinctSignature(scores: BuildingFaceContrastScore[]): boolean {
  if (scores.length === 0) return false;
  const averageFaceScore = scores.reduce((sum, score) => sum + score.faceScore, 0) / scores.length;
  if (averageFaceScore < 0.86) return false;
  if (scores.length === 1) return true;
  const uniqueSignatures = new Set(scores.map((score) => buildingSignatureKey(score.building)));
  return uniqueSignatures.size >= Math.min(2, scores.length);
}

function buildingSignatureKey(building: CityWorldBuilding): string {
  return [
    building.facadeStyle ?? "none",
    building.roofShape ?? "none",
    building.visualGrammar?.materialProfile ?? "none",
    building.visualGrammar?.roofProfile ?? "none",
    building.width.toFixed(1),
    building.depth.toFixed(1),
    building.height.toFixed(1),
    building.bodyColor.toLowerCase(),
    building.roofColor.toLowerCase(),
  ].join("|");
}

function weakestFaceScoreFamily(groupedScores: Record<string, BuildingFaceContrastScore[]>): { family: string; score: number } | null {
  const familyAverages = Object.entries(groupedScores)
    .filter(([family]) => family !== "none")
    .map(([family, scores]) => ({
      family,
      score: scores.reduce((sum, item) => sum + item.faceScore, 0) / Math.max(1, scores.length),
    }));
  return familyAverages.sort((a, b) => a.score - b.score)[0] ?? null;
}

function hiddenAnchorGroupContrastScore(buildings: CityWorldBuilding[]): number {
  if (buildings.length === 0) return 0;
  const scores = buildings.map(buildingFaceContrastScore);
  const averageFaceScore = scores.reduce((sum, score) => sum + score.faceScore, 0) / scores.length;
  const primaryAnchorRatio = ratio(buildings.filter((building) => building.visualGrammar?.noLabelPriority === "primary_anchor").length, buildings.length);
  const maxArea = Math.max(...buildings.map((building) => building.width * building.depth));
  const maxHeight = Math.max(...buildings.map((building) => building.height));
  const massingScore = cityWorldClamp((cityWorldClamp(maxArea / 8, 0, 1) + cityWorldClamp(maxHeight / 2.8, 0, 1)) / 2, 0, 1);

  return roundMetric(averageFaceScore * 0.55 + massingScore * 0.25 + primaryAnchorRatio * 0.2);
}

function civicVenueStressCellMetrics(scene: CityWorldScene): CityWorldCivicVenueStressCellMetric[] {
  const cells = [
    civicVenueStressCellMetric(scene, {
      id: "eastvale-core-civic-landmark",
      label: "Eastvale Core civic landmark",
      kind: "public_civic_landmark",
      objectFamily: "civic_landmark",
      buildings: scene.buildings.filter((building) => building.id === "building-civic" || building.placeId === "place-eastvale-core"),
    }),
    civicVenueStressCellMetric(scene, {
      id: "anaheim-convention-center-venue-anchor",
      label: "Anaheim Convention Center venue anchor",
      kind: "hidden_venue_anchor",
      objectFamily: "venue_anchor",
      buildings: scene.buildings.filter((building) => building.id.includes("anaheim-convention-center")),
    }),
    civicVenueStressCellMetric(scene, {
      id: "artic-transit-anchor",
      label: "ARTIC transit anchor",
      kind: "hidden_venue_anchor",
      objectFamily: "transit_anchor",
      buildings: scene.buildings.filter((building) => building.id.includes("artic-transit-center")),
    }),
    civicVenueStressCellMetric(scene, {
      id: "angel-stadium-venue-anchor",
      label: "Angel Stadium venue anchor",
      kind: "hidden_venue_anchor",
      objectFamily: "venue_anchor",
      buildings: scene.buildings.filter((building) => building.id.includes("angel-stadium")),
    }),
  ].filter((cell): cell is CityWorldCivicVenueStressCellMetric => Boolean(cell));

  return cells.sort((a, b) => a.id.localeCompare(b.id));
}

function civicVenueStressCellMetric(
  scene: CityWorldScene,
  input: {
    id: string;
    label: string;
    kind: CityWorldCivicVenueStressCellKind;
    objectFamily: string;
    buildings: CityWorldBuilding[];
  },
): CityWorldCivicVenueStressCellMetric | null {
  if (input.buildings.length === 0) return null;
  const silhouetteScore = civicVenueSilhouetteScore(input.kind, input.buildings);
  const hierarchyScore = civicVenueHierarchyScore(input.buildings);
  const mobileReadinessScore = civicVenueMobileReadinessScore(scene, input.buildings);
  const noLabelReadinessScore = civicVenueNoLabelReadinessScore(input.kind, input.objectFamily, input.buildings);

  return {
    id: input.id,
    label: input.label,
    kind: input.kind,
    objectFamily: input.objectFamily,
    buildingCount: input.buildings.length,
    silhouetteScore,
    hierarchyScore,
    mobileReadinessScore,
    noLabelReadinessScore,
    objectKitScore: roundMetric(silhouetteScore * 0.32 + hierarchyScore * 0.28 + mobileReadinessScore * 0.2 + noLabelReadinessScore * 0.2),
  };
}

function civicVenueSilhouetteScore(kind: CityWorldCivicVenueStressCellKind, buildings: CityWorldBuilding[]): number {
  const totalArea = buildings.reduce((sum, building) => sum + building.width * building.depth, 0);
  const maxArea = Math.max(...buildings.map((building) => building.width * building.depth));
  const maxHeight = Math.max(...buildings.map((building) => building.height));
  const buildingCount = buildings.length;

  if (kind === "hidden_venue_anchor") {
    return roundMetric(
      cityWorldClamp(maxArea / 10, 0, 1) * 0.34 +
      cityWorldClamp(totalArea / 24, 0, 1) * 0.28 +
      cityWorldClamp(buildingCount / 3, 0, 1) * 0.24 +
      cityWorldClamp(maxHeight / 0.9, 0, 1) * 0.14,
    );
  }

  return roundMetric(
    cityWorldClamp(maxHeight / 2.4, 0, 1) * 0.42 +
    cityWorldClamp(maxArea / 7, 0, 1) * 0.26 +
    cityWorldClamp(totalArea / 8, 0, 1) * 0.2 +
    cityWorldClamp(buildingCount, 0, 1) * 0.12,
  );
}

function civicVenueHierarchyScore(buildings: CityWorldBuilding[]): number {
  const scores = buildings.map(buildingFaceContrastScore);
  const averageFaceScore = scores.reduce((sum, score) => sum + score.faceScore, 0) / scores.length;
  const roofShapeVariety = new Set(buildings.map((building) => building.roofShape).filter(Boolean)).size;
  const facadeVariety = new Set(buildings.map((building) => building.facadeStyle).filter(Boolean)).size;
  const hasAnchorRole = buildings.some((building) => building.visualGrammar?.clusterRole === "anchor");
  const hasLandmarkContact = buildings.some((building) => building.visualGrammar?.contactProfile === "landmark_base_shadow");

  return roundMetric(
    averageFaceScore * 0.4 +
    cityWorldClamp(roofShapeVariety / 2, 0, 1) * 0.2 +
    cityWorldClamp(facadeVariety / 2, 0, 1) * 0.12 +
    (hasAnchorRole ? 0.14 : 0) +
    (hasLandmarkContact ? 0.14 : 0),
  );
}

function civicVenueMobileReadinessScore(scene: CityWorldScene, buildings: CityWorldBuilding[]): number {
  const mobilePreset = scene.cameraPresets.find((preset) => preset.id === "mobile");
  if (!mobilePreset) return 1;
  const frameBuildings = sampleCityWorldViewportForCameraPreset(scene, mobilePreset).buildings;
  const frameBuildingIds = new Set(frameBuildings.map((building) => building.id));
  const visibleRatio = ratio(buildings.filter((building) => frameBuildingIds.has(building.id)).length, buildings.length);
  const maxHeight = Math.max(...buildings.map((building) => building.height));
  const verticalPenalty = cityWorldClamp((maxHeight - 3.8) / 3, 0, 0.25);

  return roundMetric(cityWorldClamp(visibleRatio - verticalPenalty, 0, 1));
}

function civicVenueNoLabelReadinessScore(kind: CityWorldCivicVenueStressCellKind, expectedObjectFamily: string, buildings: CityWorldBuilding[]): number {
  const expectedPriority = kind === "hidden_venue_anchor" ? "primary_anchor" : "supporting";
  const priorityRatio = ratio(buildings.filter((building) => building.visualGrammar?.noLabelPriority === expectedPriority).length, buildings.length);
  const familyRatio = ratio(buildings.filter((building) => {
    const family = building.visualGrammar?.objectFamily;
    return family === expectedObjectFamily;
  }).length, buildings.length);
  const labelIndependence = buildings.every((building) => building.facadeStyle && building.roofShape && building.visualGrammar?.materialProfile && building.visualGrammar?.roofProfile) ? 1 : 0;

  return roundMetric(priorityRatio * 0.34 + familyRatio * 0.34 + labelIndependence * 0.32);
}

function viewportCompositionMetrics(scene: CityWorldScene): Record<string, CityWorldViewportCompositionMetric> {
  const metrics: Record<string, CityWorldViewportCompositionMetric> = {};
  for (const preset of scene.cameraPresets) {
    const sample = sampleCityWorldViewportForCameraPreset(scene, preset);
    const terrainInFrame = sample.terrainTiles;
    const lotsInFrame = sample.lots;
    const roadsInFrame = sample.roadSegments;
    const buildingsInFrame = sample.buildings;
    const terrainMassingVisibleRatio = ratio(sample.terrainMassingCount, terrainInFrame.length);
    const chunkEdgeRatio = ratio(sample.chunkEdgeCount, terrainInFrame.length);
    const terrainElevationVisibleRatio = ratio(sample.elevatedTerrainCount, terrainInFrame.length);
    const chunkEdgeReadabilityScore = roundMetric(chunkEdgeRatio * 0.5 + terrainMassingVisibleRatio * 0.3 + terrainElevationVisibleRatio * 0.2);
    const featureDensityRatio = cityWorldClamp((lotsInFrame.length + roadsInFrame.length * 2 + buildingsInFrame.length * 3) / Math.max(1, terrainInFrame.length * 0.26), 0, 1);
    const objectFamilyCount = new Set(buildingsInFrame.map((building) => building.visualGrammar?.objectFamily).filter(Boolean)).size;
    const objectFamilyScore = cityWorldClamp(objectFamilyCount / 4, 0, 1);
    const score = roundMetric(terrainMassingVisibleRatio * 0.25 + featureDensityRatio * 0.45 + objectFamilyScore * 0.3);
    metrics[preset.id] = {
      cameraPresetId: preset.id,
      terrainTilesInFrame: terrainInFrame.length,
      terrainMassingVisibleRatio: roundMetric(terrainMassingVisibleRatio),
      chunkEdgeRatio: roundMetric(chunkEdgeRatio),
      terrainElevationVisibleRatio: roundMetric(terrainElevationVisibleRatio),
      chunkEdgeReadabilityScore,
      featureDensityRatio: roundMetric(featureDensityRatio),
      objectFamilyCount,
      score,
    };
  }
  return sortViewportMetrics(metrics);
}

function expectedNoLabelTargetFamilies(scene: CityWorldScene): string[] {
  if (scene.id.includes("anaheim-candidate")) return ["venue_anchor", "transit_anchor"];
  if (scene.id.includes("ontario-candidate")) return ["transit_anchor", "commerce_strip"];
  return [];
}

function expectedNoLabelAnchorGroups(scene: CityWorldScene): string[] {
  if (scene.id.includes("anaheim-candidate")) return ["anaheim-convention-center", "artic-transit-center", "angel-stadium"];
  if (scene.id.includes("ontario-candidate")) return ["ontario-international-airport", "ontario-mills-commercial-anchor"];
  return [];
}

function noLabelGroupSeparationScore(buildings: CityWorldBuilding[], groups: string[]): number {
  if (groups.length < 2) return 1;
  const centers = groups
    .map((group) => familyCenter(buildings.filter((building) => building.id.includes(group))))
    .filter((center): center is CityWorldPoint => Boolean(center));
  if (centers.length < groups.length) return 0;

  let minDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < centers.length; index += 1) {
    for (let next = index + 1; next < centers.length; next += 1) {
      const currentCenter = centers[index];
      const nextCenter = centers[next];
      if (!currentCenter || !nextCenter) continue;
      minDistance = Math.min(minDistance, cityWorldPointDistance(currentCenter, nextCenter));
    }
  }

  return roundMetric(cityWorldClamp(minDistance / 6, 0, 1));
}

function familyCenter(buildings: CityWorldBuilding[]): CityWorldPoint | null {
  if (buildings.length === 0) return null;
  const center = buildings.reduce(
    (sum, building) => ({
      x: sum.x + building.position.x,
      y: sum.y + building.position.y,
      z: sum.z + building.position.z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  return {
    x: center.x / buildings.length,
    y: center.y / buildings.length,
    z: center.z / buildings.length,
  };
}

function sortViewportMetrics(record: Record<string, CityWorldViewportCompositionMetric>): Record<string, CityWorldViewportCompositionMetric> {
  return Object.fromEntries(Object.entries(record).sort((a, b) => a[0].localeCompare(b[0])));
}

function homeVariantKey(building: CityWorldBuilding): string {
  return [
    building.facadeStyle ?? "none",
    building.roofShape ?? "none",
    building.width.toFixed(1),
    building.depth.toFixed(1),
    building.height.toFixed(1),
    building.roofColor.toLowerCase(),
  ].join("|");
}

function primitiveFallbackEligibleRatio(scene: CityWorldScene): number {
  const objectCount = scene.terrainTiles.length + scene.roadSegments.length + scene.lots.length + scene.buildings.length + scene.props.length + scene.actors.length + scene.pins.length;
  if (objectCount === 0) return 1;
  const renderableCount = objectCount;
  return ratio(renderableCount, objectCount);
}

function countBy<T>(items: readonly T[], keyOf: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return sortRecord(counts);
}

function sortRecord(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(record).sort((a, b) => a[0].localeCompare(b[0])));
}

function nonNoneCount(counts: Record<string, number>): number {
  return Object.entries(counts).reduce((sum, [key, value]) => sum + (key === "none" ? 0 : value), 0);
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 1;
  return cityWorldClamp(numerator / denominator, 0, 1);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
