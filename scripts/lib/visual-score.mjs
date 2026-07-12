import {
  GENERATED_LANDMARK_SIGNATURES,
  GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
  US_COUNTY_INDEX,
  analyzeGeneratedDistrictMassingSignature,
  analyzeGeneratedLandmark,
  createDeterministicGeneratedDistrictScene,
  expectedGeneratedLandmarkKind,
  generatedDistrictMassingSignatureDistance,
  resolveCountyParameters,
  sampleCityWorldViewportForCameraPreset,
} from "../../packages/core/dist/index.js";

export {
  GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
  US_COUNTY_INDEX,
  createDeterministicGeneratedDistrictScene,
  resolveCountyParameters,
};
export const ARCHETYPES = [
  "metro_grid",
  "coastal_grid",
  "desert_basin",
  "mountain_valley",
  "prairie_town",
  "river_town",
];
export const WATER_ARCHETYPES = new Set(["coastal_grid", "river_town"]);
export const REPRESENTATIVE_COUNTY_BY_ARCHETYPE = {
  metro_grid: "alameda-ca",
  coastal_grid: "marin-ca",
  desert_basin: "maricopa-az",
  mountain_valley: "adams-co",
  prairie_town: "linn-ia",
  river_town: "benton-ar",
};
export const TIER_HISTOGRAM_BANDS = {
  urban_core: { min: 127, max: 127 },
  suburban: { min: 378, max: 378 },
  town: { min: 1045, max: 1045 },
  rural: { min: 1097, max: 1097 },
  frontier: { min: 575, max: 575 },
};
export const ANCHOR_TRUTHS = {
  "loving-tx": { tier: "frontier", forbiddenArchetypes: ["metro_grid"], forbidsAvenues: true },
  "kalawao-hi": { tier: "frontier", forbidsAvenues: true },
  "miami-dade-fl": { tier: "urban_core", archetype: "metro_grid", minBuildings: 24 },
  "los-angeles-ca": { tier: "urban_core", archetype: "metro_grid", minBuildings: 24 },
  "cook-il": { tier: "urban_core", archetype: "metro_grid", minBuildings: 24 },
  "fulton-ga": { tier: "urban_core", archetype: "metro_grid", minBuildings: 24 },
};

// Distinctness threshold: max allowed Jaccard overlap between any two
// archetypes' body+roof color fingerprints. Set between the pre-0.76 value
// (~1.0, shared global pools) and the target (< 0.5, regional palettes) so a
// regression back to shared palettes fails loudly.
export const MAX_PAIR_JACCARD = 0.5;
// Perf ceiling per county (ms), generous vs the measured 5.8ms mean.
export const MEAN_GEN_MS_CEILING = 20;
export const PERF_SAMPLE = 120;
export const VEGETATION_BANDS = {
  metro_grid: { minTrees: 22, maxTrees: 28, minBushes: 5, maxBushes: 8, minVegetation: 26, maxVegetation: 34 },
  coastal_grid: { minTrees: 24, maxTrees: 30, minBushes: 1, maxBushes: 4, minVegetation: 26, maxVegetation: 34, minParkVegetation: 7 },
  desert_basin: { minTrees: 0, maxTrees: 0, minBushes: 5, maxBushes: 8, minVegetation: 5, maxVegetation: 8 },
  mountain_valley: { minTrees: 24, maxTrees: 34, minBushes: 3, maxBushes: 6, minVegetation: 28, maxVegetation: 38, minParkVegetation: 7 },
  prairie_town: { minTrees: 28, maxTrees: 40, minBushes: 3, maxBushes: 6, minVegetation: 32, maxVegetation: 44, minParkVegetation: 7 },
  river_town: { minTrees: 22, maxTrees: 30, minBushes: 3, maxBushes: 6, minVegetation: 26, maxVegetation: 34 },
};
export const LAYOUT_GRAMMAR_PATTERNS = {
  metro_grid: "metro_grid_diagonal",
  coastal_grid: "shore_stepback",
  desert_basin: "highway_offsets",
  mountain_valley: "valley_switchback",
  prairie_town: "section_creek_curve",
  river_town: "river_follow",
};
export const WATER_TILE_FLOORS = {
  coastal_grid: 250,
  river_town: 150,
};
export const COASTAL_OPENING_WATER_TILE_FLOOR = 18;
export const COASTAL_OPENING_ANCHORS = ["miami-dade-fl", "honolulu-hi", "kalawao-hi"];
export const TROPICAL_TRUTH_ANCHORS = ["miami-dade-fl", "honolulu-hi", "kalawao-hi", "san-juan-municipio-pr"];
export const TROPICAL_PALM_RATE_FLOOR = 0.7;
export const TROPICAL_LUSH_TERRAIN_PALETTE = "terrain.region.river_town";
export const MOUNTAIN_OPENING_RELIEF_ANCHORS = ["summit-co"];
export const MOUNTAIN_OPENING_DROP_TILE_FLOOR = 48;
export const RELIEF_BANDS = {
  mountain_valley: { minSpread: 1, minDropTiles: 80 },
  desert_basin: { minSpread: 0.5, minDropTiles: 40 },
  river_town: { minSpread: 0.5, minDropTiles: 30 },
};
export const E5_FILL_ZONE_KINDS = new Set([
  "farm_field",
  "plaza_paving",
  "civic_forecourt",
  "dry_wash",
  "meadow",
  "scree",
  "shore_bank",
  "green_common",
]);
export const E5_FILL_BANDS = {
  metro_grid: { minCoverage: 0.6, kinds: ["plaza_paving", "civic_forecourt"] },
  coastal_grid: { minCoverage: 0.6, kinds: ["shore_bank", "green_common"] },
  desert_basin: { minCoverage: 0.6, kinds: ["dry_wash"] },
  mountain_valley: { minCoverage: 0.6, kinds: ["meadow", "scree"] },
  prairie_town: { minCoverage: 0.6, kinds: ["farm_field"], minFarmBlocks: 2, maxFarmBlocks: 4 },
  river_town: { minCoverage: 0.6, kinds: ["shore_bank", "green_common"] },
};
export const ATTACHMENT_PRESENCE_BANDS = Object.fromEntries(ARCHETYPES.map((archetype) => [archetype, { minRate: 0.4, maxRate: 0.7 }]));
export const GENERATED_ATTACHMENT_KINDS = ["chimney", "porch_step", "porch_canopy", "dormer", "awning", "roof_ac", "parapet_vent", "entry_canopy"];
export const DEFAULT_MATERIAL_PROFILE = "socal_stucco_warm";
export const DEFAULT_ROOF_PROFILE = "terracotta_barrel_tile";
export const GENERATED_PROFILE_RATE_FLOOR = 0.6;
export const UTILITY_TOWER_ARCHETYPES = new Set(["desert_basin", "prairie_town"]);
export const P12_PLACE_IDENTITY_SAMPLE_COUNTIES = [
  "mobile-al",
  "miami-dade-fl",
  "loving-tx",
  "kalawao-hi",
  "summit-co",
  "cook-il",
  "sedgwick-ks",
  "honolulu-hi",
];
export const P12_PLACE_IDENTITY_BANNED_WORDS = /\b(alpha|tier|spec|generated|draft|archetype)\b/i;

// ---------------------------------------------------------------------------
// 1. Index-wide archetype coverage plus structural compile pass.
// ---------------------------------------------------------------------------
export function coverageDistribution() {
  const counts = Object.fromEntries(ARCHETYPES.map((a) => [a, 0]));
  const firstCountyByArchetype = {};
  const structuralFailures = [];
  const start = process.hrtime.bigint();

  for (const county of US_COUNTY_INDEX) {
    const structural = structuralInspection(county);
    const archetype = structural.archetype;
    if (archetype) {
      if (counts[archetype] === undefined) counts[archetype] = 0;
      counts[archetype] += 1;
      if (!firstCountyByArchetype[archetype]) firstCountyByArchetype[archetype] = county;
    }
    if (structural.failures.length > 0) {
      structuralFailures.push({
        countySlug: county.countySlug,
        archetype: archetype ?? "compile_error",
        failures: structural.failures,
      });
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  return {
    counts,
    firstCountyByArchetype,
    structural: {
      checked: US_COUNTY_INDEX.length,
      elapsedMs,
      meanMs: elapsedMs / US_COUNTY_INDEX.length,
      failures: structuralFailures,
    },
  };
}

export function representativeCountiesByArchetype() {
  return Object.fromEntries(
    ARCHETYPES.map((archetype) => {
      const county = countyBySlug(REPRESENTATIVE_COUNTY_BY_ARCHETYPE[archetype]);
      const generated = createDeterministicGeneratedDistrictScene({ county }).generated;
      if (generated.archetype !== archetype) {
        throw new Error(`Representative ${county.countySlug} resolved ${generated.archetype}, expected ${archetype}`);
      }
      return [archetype, county];
    }),
  );
}

export function countyBySlug(countySlug) {
  const county = US_COUNTY_INDEX.find((candidate) => candidate.countySlug === countySlug);
  if (!county) throw new Error(`Missing county ${countySlug}`);
  return county;
}

export function tierHistogram() {
  const counts = { urban_core: 0, suburban: 0, town: 0, rural: 0, frontier: 0 };
  for (const county of US_COUNTY_INDEX) {
    const { generated } = createDeterministicGeneratedDistrictScene({ county });
    const tier = generated.spec.countyParameters?.urbanizationTier;
    if (!tier || counts[tier] === undefined) throw new Error(`Missing urbanization tier for ${county.countySlug}`);
    counts[tier] += 1;
  }
  const failures = Object.entries(TIER_HISTOGRAM_BANDS).flatMap(([tier, band]) => {
    const count = counts[tier] ?? 0;
    return count >= band.min && count <= band.max ? [] : [`${tier} ${count} outside ${band.min}-${band.max}`];
  });
  return { counts, bands: TIER_HISTOGRAM_BANDS, failures };
}

export function anchorTruthReadouts() {
  return Object.entries(ANCHOR_TRUTHS).map(([countySlug, expected]) => {
    const county = countyBySlug(countySlug);
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const parameters = resolveCountyParameters(county, generated.seed);
    const massing = analyzeGeneratedDistrictMassingSignature(result.scene);
    const roadKinds = [...new Set(result.scene.roadSegments.filter((road) => road.id.startsWith("gen-road-")).map((road) => road.kind))].sort();
    const failures = [];

    if (parameters.urbanizationTier !== expected.tier) failures.push(`tier ${parameters.urbanizationTier} != ${expected.tier}`);
    if (expected.archetype && generated.archetype !== expected.archetype) failures.push(`archetype ${generated.archetype} != ${expected.archetype}`);
    if (expected.forbiddenArchetypes?.includes(generated.archetype)) failures.push(`forbidden archetype ${generated.archetype}`);
    if (expected.forbidsAvenues && roadKinds.includes("avenue")) failures.push("frontier road seeds include avenue");
    if (expected.minBuildings && massing.buildingCount < expected.minBuildings) {
      failures.push(`buildingCount ${massing.buildingCount} below ${expected.minBuildings}`);
    }

    return {
      countySlug,
      geoid: county.geoid,
      population2024: parameters.population2024,
      landAreaSqMi: parameters.landAreaSqMi,
      densityPerSqMi: parameters.densityPerSqMi,
      tier: parameters.urbanizationTier,
      archetype: generated.archetype,
      buildingCount: massing.buildingCount,
      roadKinds,
      failures,
    };
  });
}

export function placeIdentitySweep() {
  const failures = [];
  const samples = {};

  for (const county of US_COUNTY_INDEX) {
    try {
      const first = createDeterministicGeneratedDistrictScene({ county });
      const second = createDeterministicGeneratedDistrictScene({ county });
      const firstLabels = placeIdentityReadout(first.result.scene);
      const secondLabels = placeIdentityReadout(second.result.scene);
      const firstWire = JSON.stringify(firstLabels);
      const secondWire = JSON.stringify(secondLabels);

      if (firstWire !== secondWire) failures.push(`${county.countySlug}: place labels/descriptions are not deterministic`);
      for (const place of firstLabels) {
        if (P12_PLACE_IDENTITY_BANNED_WORDS.test(place.label)) failures.push(`${county.countySlug}:${place.id}: banned label word in "${place.label}"`);
        if (P12_PLACE_IDENTITY_BANNED_WORDS.test(place.description)) {
          failures.push(`${county.countySlug}:${place.id}: banned description word in "${place.description}"`);
        }
      }
      if (P12_PLACE_IDENTITY_SAMPLE_COUNTIES.includes(county.countySlug)) {
        samples[county.countySlug] = {
          districtLabel: first.result.scene.label,
          archetype: first.generated.archetype,
          tier: first.generated.spec.countyParameters?.urbanizationTier ?? "missing",
          waterFactBand: first.generated.spec.countyParameters?.waterFactBand ?? "missing",
          labels: firstLabels.map((place) => place.label),
          descriptions: firstLabels.slice(0, 3).map((place) => place.description),
        };
      }
    } catch (error) {
      failures.push(`${county.countySlug}: compile threw during P1.2 label sweep: ${formatError(error)}`);
    }
  }

  return {
    checked: US_COUNTY_INDEX.length,
    bannedWords: ["alpha", "tier", "spec", "generated", "draft", "archetype"],
    failures,
    samples,
  };
}

export function placeIdentityReadout(scene) {
  return (scene.places ?? [])
    .filter((place) => place.id?.startsWith("gen-place-"))
    .map((place) => ({
      id: place.id,
      label: place.label ?? "",
      description: place.description ?? "",
    }))
    .sort((first, second) => first.id.localeCompare(second.id));
}

export function structuralInspection(county) {
  try {
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const scene = result?.scene;
    const failures = [];

    if (!scene) {
      failures.push("missing scene");
      return { archetype: generated?.archetype ?? null, failures };
    }
    if (!Array.isArray(scene.buildings) || scene.buildings.length === 0) failures.push("zero buildings");
    if (!Array.isArray(scene.places) || scene.places.length === 0) failures.push("zero places");
    if (!scene.buildings?.some((building) => building.id.startsWith("gen-landmark-"))) failures.push("missing gen-landmark building");

    const nonFiniteBuildings = (scene.buildings ?? []).filter((building) => !buildingGeometryFinite(building));
    if (nonFiniteBuildings.length > 0) {
      failures.push(`non-finite building geometry: ${nonFiniteBuildings.map((building) => building.id).join(",")}`);
    }

    if (WATER_ARCHETYPES.has(generated.archetype)) {
      const waterTiles = (scene.terrainTiles ?? []).filter((tile) => tile.kind === "water").length;
      const floor = WATER_TILE_FLOORS[generated.archetype] ?? 1;
      if (waterTiles < floor) failures.push(`${generated.archetype} has ${waterTiles} water terrain tiles below ${floor}`);
    }

    return { archetype: generated.archetype, failures };
  } catch (error) {
    return { archetype: null, failures: [`compile threw: ${formatError(error)}`] };
  }
}

export function buildingGeometryFinite(building) {
  return [building.position?.x, building.position?.y, building.position?.z, building.width, building.depth, building.height].every(Number.isFinite);
}

export function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

// ---------------------------------------------------------------------------
// 2. Palette fingerprint per archetype — the multiset of building body/roof
//    colors a representative county resolves, as a distinct-color set.
// ---------------------------------------------------------------------------
export function paletteFingerprint(county) {
  const { result } = createDeterministicGeneratedDistrictScene({ county });
  return paletteFingerprintForScene(result.scene);
}

export function paletteFingerprintForScene(scene) {
  const body = new Set();
  const roof = new Set();
  for (const b of scene.buildings ?? []) {
    if (b.bodyColor) body.add(b.bodyColor.toLowerCase());
    if (b.roofColor) roof.add(b.roofColor.toLowerCase());
  }
  // Terrain identity today lives in paletteKey (color resolves in-renderer);
  // fold it in so terrain-only regional shifts still register.
  const terrain = new Set();
  for (const t of scene.terrainTiles ?? []) {
    if (t.paletteKey) terrain.add(String(t.paletteKey).toLowerCase());
  }
  return { body, roof, terrain, all: new Set([...body, ...roof]) };
}

export function landmarkFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  const parameters = resolveCountyParameters(county, generated.seed);
  const expectedKind = expectedGeneratedLandmarkKind(parameters);
  const expected = GENERATED_LANDMARK_SIGNATURES[expectedKind];
  const landmark = analyzeGeneratedLandmark(result.scene);
  const propKinds = result.scene.props.map((prop) => prop.kind);
  const missingAccentProps = expected.expectedAccentProps.filter((propKind) => !propKinds.includes(propKind));
  const failures = [];

  if (!generated.spec.countyParameters) failures.push("missing countyParameters on generated spec");
  if (!landmark) {
    failures.push("missing gen-landmark building");
  } else {
    if (landmark.kind !== expectedKind) failures.push(`expected ${expectedKind}, got ${landmark.kind}`);
    if (landmark.hostCell !== expected.hostCell) failures.push(`expected host ${expected.hostCell}, got ${landmark.hostCell}`);
    if (landmark.buildingKind !== expected.buildingKind) failures.push(`expected building ${expected.buildingKind}, got ${landmark.buildingKind}`);
    if (landmark.roofShape !== expected.roofShape) failures.push(`expected roof ${expected.roofShape}, got ${landmark.roofShape}`);
    if (landmark.facadeStyle !== expected.facadeStyle) failures.push(`expected facade ${expected.facadeStyle}, got ${landmark.facadeStyle}`);
    if (result.scene.hudDefaults.selectedPlaceId !== landmark.placeId) {
      failures.push(`selectedPlaceId ${result.scene.hudDefaults.selectedPlaceId} != landmark ${landmark.placeId}`);
    }
  }
  for (const propKind of missingAccentProps) failures.push(`missing accent prop ${propKind}`);

  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    expectedKind,
    actualKind: landmark?.kind ?? "missing",
    hostCell: landmark?.hostCell ?? "missing",
    silhouetteKey: landmark?.silhouetteKey ?? "missing",
    massing: landmark ? `${landmark.width}x${landmark.depth}x${landmark.height}` : "missing",
    roofShape: landmark?.roofShape ?? "missing",
    facadeStyle: landmark?.facadeStyle ?? "missing",
    propCount: result.scene.props.length,
    accentProps: [...new Set((landmark?.accentProps ?? []).filter((propKind) => expected.expectedAccentProps.includes(propKind)))],
    missingAccentProps,
    failures,
  };
}

export function profileGrammarFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  const buildings = result.scene.buildings ?? [];
  const materialRich = buildings.filter((building) => building.visualGrammar?.materialProfile !== DEFAULT_MATERIAL_PROFILE);
  const roofRich = buildings.filter((building) => building.visualGrammar?.roofProfile !== DEFAULT_ROOF_PROFILE);
  const missingProfiles = buildings.filter((building) => !building.visualGrammar?.materialProfile || !building.visualGrammar.roofProfile);
  const landmark = analyzeGeneratedLandmark(result.scene);
  const landmarkBuilding = buildings.find((building) => building.id === landmark?.buildingId);
  const materialRate = roundMetric(materialRich.length / Math.max(1, buildings.length));
  const roofRate = roundMetric(roofRich.length / Math.max(1, buildings.length));
  const failures = [];

  if (missingProfiles.length > 0) failures.push(`missing profiles ${missingProfiles.map((building) => building.id).join(",")}`);
  if (materialRate < GENERATED_PROFILE_RATE_FLOOR) failures.push(`material non-default rate ${materialRate} below ${GENERATED_PROFILE_RATE_FLOOR}`);
  if (roofRate < GENERATED_PROFILE_RATE_FLOOR) failures.push(`roof non-default rate ${roofRate} below ${GENERATED_PROFILE_RATE_FLOOR}`);
  if (UTILITY_TOWER_ARCHETYPES.has(generated.archetype)) {
    if (landmarkBuilding?.visualGrammar?.roofProfile !== "blue_metal_utility") {
      failures.push(`${landmark?.kind ?? "missing landmark"} roofProfile ${landmarkBuilding?.visualGrammar?.roofProfile ?? "missing"} != blue_metal_utility`);
    }
    if (landmarkBuilding?.visualGrammar?.objectFamily !== "service_block") {
      failures.push(`${landmark?.kind ?? "missing landmark"} objectFamily ${landmarkBuilding?.visualGrammar?.objectFamily ?? "missing"} != service_block`);
    }
  }

  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    buildingCount: buildings.length,
    materialRichCount: materialRich.length,
    roofRichCount: roofRich.length,
    materialRate,
    roofRate,
    materialProfiles: [...new Set(buildings.map((building) => building.visualGrammar?.materialProfile ?? "missing"))].sort(),
    roofProfiles: [...new Set(buildings.map((building) => building.visualGrammar?.roofProfile ?? "missing"))].sort(),
    landmark: landmark
      ? {
          kind: landmark.kind,
          buildingKind: landmarkBuilding?.kind ?? "missing",
          facadeStyle: landmarkBuilding?.facadeStyle ?? "missing",
          roofShape: landmarkBuilding?.roofShape ?? "missing",
          objectFamily: landmarkBuilding?.visualGrammar?.objectFamily ?? "missing",
          roofProfile: landmarkBuilding?.visualGrammar?.roofProfile ?? "missing",
        }
      : null,
    failures,
  };
}

export function massingFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    ...analyzeGeneratedDistrictMassingSignature(result.scene),
  };
}

export function vegetationFingerprint(county) {
  const first = createDeterministicGeneratedDistrictScene({ county });
  const second = createDeterministicGeneratedDistrictScene({ county });
  const archetype = first.generated.archetype;
  const band = VEGETATION_BANDS[archetype];
  const counts = vegetationCounts(first.result.scene);
  const repeatedCounts = vegetationCounts(second.result.scene);
  const parkZones = first.generated.spec.zones.filter((zone) => zone.kind === "park");
  const parkVegetation = first.result.scene.props.filter(
    (prop) => isVegetation(prop) && parkZones.some((zone) => pointInsideRect(prop.position, zone.rect)),
  ).length;
  const failures = [];

  if (JSON.stringify(counts) !== JSON.stringify(repeatedCounts)) failures.push("vegetation counts are not deterministic");
  if (counts.tree < band.minTrees || counts.tree > band.maxTrees) failures.push(`trees ${counts.tree} outside ${band.minTrees}-${band.maxTrees}`);
  if (counts.bush < band.minBushes || counts.bush > band.maxBushes) failures.push(`bushes ${counts.bush} outside ${band.minBushes}-${band.maxBushes}`);
  if (counts.vegetation < band.minVegetation || counts.vegetation > band.maxVegetation) {
    failures.push(`vegetation ${counts.vegetation} outside ${band.minVegetation}-${band.maxVegetation}`);
  }
  if (band.minParkVegetation && parkZones.length > 0 && parkVegetation < band.minParkVegetation) {
    failures.push(`park vegetation ${parkVegetation} below ${band.minParkVegetation}`);
  }

  return {
    countySlug: county.countySlug,
    archetype,
    ...counts,
    parkVegetation,
    band,
    failures,
  };
}

export function vegetationCounts(scene) {
  const tree = scene.props.filter((prop) => prop.kind === "tree").length;
  const bush = scene.props.filter((prop) => prop.kind === "bush").length;
  return { tree, bush, vegetation: tree + bush };
}

export function layoutGrammarFingerprint(county) {
  const first = createDeterministicGeneratedDistrictScene({ county });
  const second = createDeterministicGeneratedDistrictScene({ county });
  const archetype = first.generated.archetype;
  const roads = first.result.scene.roadSegments ?? [];
  const generatedRoads = roads.filter((road) => road.id.startsWith("gen-road-"));
  const crosswalks = roads.filter((road) => road.id.startsWith("gen-cross-"));
  const signature = roadSignature(roads);
  const repeatedSignature = roadSignature(second.result.scene.roadSegments ?? []);
  const metrics = layoutRoadMetrics(archetype, roads);
  const pattern = first.generated.spec.countyParameters?.layoutGrammar?.pattern ?? "missing";
  const failures = roadClassMixFailures(archetype, metrics, pattern);

  if (signature !== repeatedSignature) failures.push("road signature is not deterministic");

  return {
    countySlug: county.countySlug,
    archetype,
    tier: first.generated.spec.countyParameters?.urbanizationTier ?? "missing",
    pattern,
    roadCount: roads.length,
    generatedRoadCount: generatedRoads.length,
    crosswalkCount: crosswalks.length,
    ...metrics,
    failures,
  };
}

export function roadSignature(roads) {
  return roads
    .map((road) =>
      [
        road.id,
        road.kind,
        roadCoord(road.from.x),
        roadCoord(road.from.y),
        roadCoord(road.to.x),
        roadCoord(road.to.y),
      ].join(":"),
    )
    .sort()
    .join("|");
}

export function layoutRoadMetrics(archetype, roads) {
  const generatedRoads = roads.filter((road) => road.id.startsWith("gen-road-"));
  const crosswalks = roads.filter((road) => road.id.startsWith("gen-cross-"));
  const axisRoads = generatedRoads.filter(roadIsAxisAligned).length;
  const nonAxisRoads = generatedRoads.length - axisRoads;
  return {
    axisRoads,
    nonAxisRoads,
    avenues: generatedRoads.filter((road) => road.kind === "avenue").length,
    diagonalAvenues: generatedRoads.filter((road) => road.kind === "avenue" && !roadIsAxisAligned(road)).length,
    shoreMainSegments: generatedRoads.filter((road) => road.id.startsWith("gen-road-coastal-shore-main")).length,
    stepbackLanes: generatedRoads.filter((road) => /gen-road-coastal-(north|market|south)-lane|gen-road-coastal-back-step/.test(road.id)).length,
    highwaySegments: generatedRoads.filter((road) => road.id.startsWith("gen-road-desert-highway")).length,
    offsetRoads: generatedRoads.filter((road) => road.id.includes("offset")).length,
    contourRoads: generatedRoads.filter((road) => road.id.includes("contour")).length,
    valleySpines: generatedRoads.filter((road) => road.id.includes("valley-spine")).length,
    switchbacks: generatedRoads.filter((road) => road.id.includes("switchback") || road.id.includes("terrace-branch")).length,
    sectionGridRoads: generatedRoads.filter((road) => /gen-road-prairie-(grid|main|south|section|east-section)/.test(road.id)).length,
    creekCurveSegments: generatedRoads.filter((road) => road.id.startsWith("gen-road-prairie-creek-rail-curve")).length,
    bankRoadSegments: generatedRoads.filter((road) => /gen-road-river-(west|east|north|south)-bank/.test(road.id)).length,
    bridgeRoads: generatedRoads.filter((road) => road.id.includes("bridge-road")).length,
    bridgeCrosswalks: crosswalks.filter((road) => road.id.includes("river-bridge")).length,
  };
}

export function roadIsAxisAligned(road) {
  return Math.abs(road.from.x - road.to.x) <= 0.001 || Math.abs(road.from.y - road.to.y) <= 0.001;
}

export function roadCoord(value) {
  return Number(value.toFixed(3));
}

export function terrainFeatureFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  const scene = result.scene;
  const water = waterBandMetrics(scene);
  const relief = reliefMetrics(scene);
  const failures = [];

  if (generated.archetype === "coastal_grid") {
    const floor = WATER_TILE_FLOORS.coastal_grid;
    if (water.count < floor) failures.push(`coastal water ${water.count} below ${floor}`);
    if (water.maxX !== scene.bounds.maxX || water.yCoverage !== scene.bounds.maxY - scene.bounds.minY + 1) {
      failures.push(`coastal water is not an edge band: x ${water.minX}-${water.maxX}, yCoverage ${water.yCoverage}`);
    }
  }

  if (generated.archetype === "river_town") {
    const floor = WATER_TILE_FLOORS.river_town;
    if (water.count < floor) failures.push(`river water ${water.count} below ${floor}`);
    if (!water.crossesBoardX && !water.crossesBoardY) {
      failures.push(`river water does not cross board: x ${water.minX}-${water.maxX}, y ${water.minY}-${water.maxY}`);
    }
  }

  const reliefBand = RELIEF_BANDS[generated.archetype];
  if (reliefBand) {
    if (relief.spread < reliefBand.minSpread) failures.push(`relief spread ${relief.spread} below ${reliefBand.minSpread}`);
    if (relief.dropTileCount < reliefBand.minDropTiles) failures.push(`drop tiles ${relief.dropTileCount} below ${reliefBand.minDropTiles}`);
  }

  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    water,
    relief,
    failures,
  };
}

export function coastalOpeningWaterReadouts() {
  return COASTAL_OPENING_ANCHORS.map((countySlug) => {
    const county = countyBySlug(countySlug);
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const frame = openingFrameReadout(result.scene, "desktop");
    const failures = [];

    if (frame.waterTiles < COASTAL_OPENING_WATER_TILE_FLOOR) {
      failures.push(`desktop opening water ${frame.waterTiles} below ${COASTAL_OPENING_WATER_TILE_FLOOR}`);
    }
    if (frame.buildings <= 0) failures.push("desktop opening frame has zero buildings");

    return {
      countySlug,
      archetype: generated.archetype,
      tier: generated.spec.countyParameters?.urbanizationTier ?? "missing",
      frame,
      failures,
    };
  });
}

export function tropicalTruthReadouts() {
  return TROPICAL_TRUTH_ANCHORS.map((countySlug) => {
    const county = countyBySlug(countySlug);
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const parameters = resolveCountyParameters(county, generated.seed);
    const terrainPaletteKeys = landTerrainPaletteKeys(result.scene);
    const treeVariants = result.scene.props.filter((prop) => prop.kind === "tree").map((prop) => prop.variant);
    const palmCount = treeVariants.filter((variant) => variant >= 40).length;
    const palmRate = roundMetric(palmCount / Math.max(1, treeVariants.length));
    const dryWashZones = generated.spec.zones.filter((zone) => zone.kind === "dry_wash").map((zone) => zone.id);
    const failures = [];

    if (!parameters.climate.tropicalHumid) failures.push("climate.tropicalHumid false");
    if (parameters.climate.aridity !== "humid") failures.push(`aridity ${parameters.climate.aridity} != humid`);
    if (dryWashZones.length > 0) failures.push(`dry_wash zones present: ${dryWashZones.join(",")}`);
    if (terrainPaletteKeys.length !== 1 || terrainPaletteKeys[0] !== TROPICAL_LUSH_TERRAIN_PALETTE) {
      failures.push(`land terrain palettes ${terrainPaletteKeys.join(",") || "none"} != ${TROPICAL_LUSH_TERRAIN_PALETTE}`);
    }
    if (palmRate < TROPICAL_PALM_RATE_FLOOR) failures.push(`palm rate ${palmRate} below ${TROPICAL_PALM_RATE_FLOOR}`);

    return {
      countySlug,
      archetype: generated.archetype,
      tier: parameters.urbanizationTier,
      latitudeBand: parameters.climate.latitudeBand,
      aridity: parameters.climate.aridity,
      tropicalHumid: parameters.climate.tropicalHumid,
      terrainPaletteKeys,
      treeCount: treeVariants.length,
      palmCount,
      palmRate,
      dryWashZones,
      failures,
    };
  });
}

export function mountainOpeningReliefReadouts() {
  return MOUNTAIN_OPENING_RELIEF_ANCHORS.map((countySlug) => {
    const county = countyBySlug(countySlug);
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const frame = openingFrameReadout(result.scene, "desktop");
    const failures = [];

    if (generated.archetype !== "mountain_valley") failures.push(`archetype ${generated.archetype} != mountain_valley`);
    if (frame.elevationSpread < 1) failures.push(`desktop opening elevation spread ${frame.elevationSpread} below 1`);
    if (frame.dropTileCount < MOUNTAIN_OPENING_DROP_TILE_FLOOR) {
      failures.push(`desktop opening drop tiles ${frame.dropTileCount} below ${MOUNTAIN_OPENING_DROP_TILE_FLOOR}`);
    }
    if (frame.buildings < 6) failures.push(`desktop opening buildings ${frame.buildings} below 6`);

    return {
      countySlug,
      archetype: generated.archetype,
      frame,
      failures,
    };
  });
}

export function openBlockFillFingerprint(county) {
  const first = createDeterministicGeneratedDistrictScene({ county });
  const second = createDeterministicGeneratedDistrictScene({ county });
  const archetype = first.generated.archetype;
  const band = E5_FILL_BANDS[archetype];
  const coverage = openBlockFillCoverage(first.generated.spec.zones, first.result.scene);
  const repeatedCoverage = openBlockFillCoverage(second.generated.spec.zones, second.result.scene);
  const failures = [];

  if (JSON.stringify(coverage) !== JSON.stringify(repeatedCoverage)) failures.push("fill coverage is not deterministic");
  if (coverage.fillCoverageRatio < band.minCoverage) failures.push(`fill coverage ${coverage.fillCoverageRatio} below ${band.minCoverage}`);
  for (const kind of band.kinds) {
    if (!coverage.fillKinds.includes(kind)) failures.push(`missing fill kind ${kind}`);
  }
  if (archetype === "prairie_town") {
    const farmBlocks = coverage.fillZoneCounts.farm_field ?? 0;
    if (farmBlocks < band.minFarmBlocks || farmBlocks > band.maxFarmBlocks) {
      failures.push(`farm blocks ${farmBlocks} outside ${band.minFarmBlocks}-${band.maxFarmBlocks}`);
    }
    if (coverage.fillVariantCount < 2) failures.push(`farm variants ${coverage.fillVariantCount} below 2`);
  }
  if ((archetype === "coastal_grid" || archetype === "river_town") && coverage.waterEdgeFillTiles <= 0) {
    failures.push("shore/bank fill has no water-edge contact tiles");
  }

  return {
    countySlug: county.countySlug,
    archetype,
    band,
    ...coverage,
    failures,
  };
}

export function attachmentPresenceFingerprint(county) {
  const first = createDeterministicGeneratedDistrictScene({ county });
  const second = createDeterministicGeneratedDistrictScene({ county });
  const archetype = first.generated.archetype;
  const band = ATTACHMENT_PRESENCE_BANDS[archetype];
  const readout = attachmentReadout(first.result.scene);
  const repeatedReadout = attachmentReadout(second.result.scene);
  const failures = [];

  if (JSON.stringify(readout.countsByKind) !== JSON.stringify(repeatedReadout.countsByKind)) failures.push("attachment counts are not deterministic");
  if (JSON.stringify(readout.parentIds) !== JSON.stringify(repeatedReadout.parentIds)) failures.push("attachment parent set is not deterministic");
  if (readout.parentRate < band.minRate || readout.parentRate > band.maxRate) {
    failures.push(`attachment parent rate ${readout.parentRate} outside ${band.minRate}-${band.maxRate}`);
  }
  if (readout.attachmentCount <= 0) failures.push("no generated building attachments");

  return {
    countySlug: county.countySlug,
    archetype,
    band,
    ...readout,
    failures,
  };
}

export function attachmentReadout(scene) {
  const attachments = (scene.buildings ?? []).filter(isAttachmentBuilding);
  const eligibleParents = (scene.buildings ?? []).filter(isEligibleAttachmentParent);
  const parentIds = [...new Set(attachments.map((building) => building.visualGrammar?.buildingAttachment?.parentBuildingId).filter(Boolean))].sort();
  const countsByKind = Object.fromEntries(GENERATED_ATTACHMENT_KINDS.map((kind) => [kind, 0]));

  for (const attachment of attachments) {
    const kind = attachment.visualGrammar?.buildingAttachment?.kind;
    if (kind && kind in countsByKind) countsByKind[kind] += 1;
  }

  return {
    eligibleParentCount: eligibleParents.length,
    attachedParentCount: parentIds.length,
    parentRate: roundMetric(parentIds.length / Math.max(1, eligibleParents.length)),
    attachmentCount: attachments.length,
    parentIds,
    countsByKind,
  };
}

export function isAttachmentBuilding(building) {
  return building.id.startsWith("gen-attachment-") || Boolean(building.visualGrammar?.buildingAttachment);
}

export function isEligibleAttachmentParent(building) {
  if (isAttachmentBuilding(building)) return false;
  if (!building.id.startsWith("gen-building-") && !building.id.startsWith("gen-landmark-")) return false;
  const facadeStyle = building.facadeStyle;
  return (
    (building.kind === "home" && (facadeStyle === "cottage" || facadeStyle === "ranch" || facadeStyle === "rowhome")) ||
    (building.kind === "shop" && (facadeStyle === "strip_store" || facadeStyle === "storefront")) ||
    (building.kind === "apartment" && facadeStyle === "lowrise") ||
    (building.kind === "civic" && facadeStyle === "civic")
  );
}

export function openBlockFillCoverage(zones, scene) {
  let openGroundTiles = 0;
  let fillTileCount = 0;
  let waterEdgeFillTiles = 0;
  const fillKinds = new Set();
  const fillVariants = new Set();
  const fillZoneIds = new Set();
  const fillZoneCounts = Object.fromEntries([...E5_FILL_ZONE_KINDS].map((kind) => [kind, 0]));

  for (const zone of zones) {
    if (E5_FILL_ZONE_KINDS.has(zone.kind)) fillZoneCounts[zone.kind] += 1;
  }

  for (const tile of scene.terrainTiles ?? []) {
    if (pointInRoadCorridor(tile.position, scene.roadSegments ?? [])) continue;
    const zone = winningZoneAt(zones, tile.position.x, tile.position.y);
    if (zone && !E5_FILL_ZONE_KINDS.has(zone.kind)) continue;
    openGroundTiles += 1;
    if (zone && E5_FILL_ZONE_KINDS.has(zone.kind)) {
      fillTileCount += 1;
      fillKinds.add(zone.kind);
      fillVariants.add(tile.variant);
      fillZoneIds.add(zone.id);
      if ((tile.visualGrammar?.terrainContact?.waterEdgeSides?.length ?? 0) > 0) waterEdgeFillTiles += 1;
    }
  }

  return {
    openGroundTiles,
    fillTileCount,
    fillCoverageRatio: roundMetric(fillTileCount / Math.max(1, openGroundTiles)),
    fillKinds: [...fillKinds].sort(),
    fillVariantCount: fillVariants.size,
    fillZoneCount: fillZoneIds.size,
    fillZoneCounts,
    waterEdgeFillTiles,
  };
}

export function winningZoneAt(zones, x, y) {
  let match;
  for (const zone of zones) {
    if (x >= zone.rect.minX && x <= zone.rect.maxX && y >= zone.rect.minY && y <= zone.rect.maxY) match = zone;
  }
  return match;
}

export function pointInRoadCorridor(point, roads) {
  for (const road of roads) {
    if (road.kind === "crosswalk") continue;
    const halfCorridor = road.width / 2 + 0.35;
    const minX = Math.min(road.from.x, road.to.x) - halfCorridor;
    const maxX = Math.max(road.from.x, road.to.x) + halfCorridor;
    const minY = Math.min(road.from.y, road.to.y) - halfCorridor;
    const maxY = Math.max(road.from.y, road.to.y) + halfCorridor;
    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) return true;
  }
  return false;
}

export function roundMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0;
}

export function waterBandMetrics(scene) {
  const waterTiles = (scene.terrainTiles ?? []).filter((tile) => tile.kind === "water");
  if (waterTiles.length === 0) {
    return { count: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, xCoverage: 0, yCoverage: 0, crossesBoardX: false, crossesBoardY: false };
  }
  const xs = waterTiles.map((tile) => tile.position.x);
  const ys = waterTiles.map((tile) => tile.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    count: waterTiles.length,
    minX,
    maxX,
    minY,
    maxY,
    xCoverage: new Set(xs).size,
    yCoverage: new Set(ys).size,
    crossesBoardX: minX === scene.bounds.minX && maxX === scene.bounds.maxX,
    crossesBoardY: minY === scene.bounds.minY && maxY === scene.bounds.maxY,
  };
}

export function reliefMetrics(scene) {
  const zValues = (scene.terrainTiles ?? []).map((tile) => tile.position?.z ?? 0);
  const min = Math.min(...zValues);
  const max = Math.max(...zValues);
  return {
    min,
    max,
    spread: Number((max - min).toFixed(3)),
    dropTileCount: (scene.terrainTiles ?? []).filter((tile) => (tile.visualGrammar?.elevation?.dropDepth ?? 0) > 0).length,
  };
}

export function openingFrameReadout(scene, cameraId) {
  const preset = scene.cameraPresets.find((candidate) => candidate.id === cameraId);
  if (!preset) throw new Error(`Missing ${cameraId} camera preset for ${scene.id}`);
  const sample = sampleCityWorldViewportForCameraPreset(scene, preset);
  const zValues = sample.terrainTiles.map((tile) => tile.position?.z ?? 0);
  const min = zValues.length > 0 ? Math.min(...zValues) : 0;
  const max = zValues.length > 0 ? Math.max(...zValues) : 0;
  return {
    waterTiles: sample.terrainTiles.filter((tile) => tile.kind === "water").length,
    terrainTiles: sample.terrainTiles.length,
    buildings: sample.buildings.length,
    elevationSpread: roundMetric(max - min),
    dropTileCount: sample.terrainTiles.filter((tile) => (tile.visualGrammar?.elevation?.dropDepth ?? 0) > 0).length,
  };
}

export function landTerrainPaletteKeys(scene) {
  return [
    ...new Set(
      (scene.terrainTiles ?? [])
        .filter((tile) => tile.kind !== "water")
        .map((tile) => tile.paletteKey)
        .filter(Boolean),
    ),
  ].sort();
}

export function isVegetation(prop) {
  return prop.kind === "tree" || prop.kind === "bush";
}

export function pointInsideRect(point, rect) {
  return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
}

export function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

export function distinctnessMatrix(fingerprintByArchetype, present) {
  const pairs = [];
  let worst = { pair: null, jaccard: 0 };
  for (let i = 0; i < present.length; i += 1) {
    for (let j = i + 1; j < present.length; j += 1) {
      const a = present[i];
      const b = present[j];
      const jac = jaccard(fingerprintByArchetype[a].all, fingerprintByArchetype[b].all);
      pairs.push({ a, b, jaccard: Number(jac.toFixed(3)) });
      if (jac > worst.jaccard) worst = { pair: [a, b], jaccard: Number(jac.toFixed(3)) };
    }
  }
  return { pairs, worst };
}

export function massingDistinctnessMatrix(massingByArchetype, present) {
  const pairs = [];
  let closest = { pair: null, distance: Number.POSITIVE_INFINITY };
  for (let i = 0; i < present.length; i += 1) {
    for (let j = i + 1; j < present.length; j += 1) {
      const a = present[i];
      const b = present[j];
      const distance = generatedDistrictMassingSignatureDistance(massingByArchetype[a], massingByArchetype[b]);
      pairs.push({ a, b, distance });
      if (distance < closest.distance) closest = { pair: [a, b], distance };
    }
  }
  if (!closest.pair) closest = { pair: null, distance: 0 };
  return { pairs, closest };
}

// ---------------------------------------------------------------------------
// 3. Perf-at-scale probe — mean generation time + zero budget failures.
// ---------------------------------------------------------------------------
export function perfProbe(firstCountyByArchetype) {
  // Sample evenly across archetypes then across the index tail.
  const seeds = Object.values(firstCountyByArchetype).filter(Boolean);
  const stride = Math.max(1, Math.floor(US_COUNTY_INDEX.length / PERF_SAMPLE));
  const sample = [...seeds];
  for (let i = 0; i < US_COUNTY_INDEX.length && sample.length < PERF_SAMPLE; i += stride) {
    sample.push(US_COUNTY_INDEX[i]);
  }
  let failures = 0;
  const start = process.hrtime.bigint();
  for (const county of sample) {
    try {
      const { result } = createDeterministicGeneratedDistrictScene({ county });
      if (!result?.scene?.buildings?.length) failures += 1;
    } catch {
      failures += 1;
    }
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  return { sampled: sample.length, failures, meanMs: elapsedMs / sample.length };
}

// ---------------------------------------------------------------------------
// 4. 0.79-1 per-county visual score.
// ---------------------------------------------------------------------------
export const WEIGHTS = Object.freeze({
  compositionOccupancy: 18,
  waterVisibility: 14,
  vegetationBandFit: 14,
  paletteNeighborDistance: 16,
  massingSignatureDistance: 16,
  roadClassMixSanity: 12,
  labelGrammarCoverage: 10,
});

export const VISUAL_SCORE_MEDIAN_FLOOR = 93.46;
export const VISUAL_SCORE_HARD_FLOOR = 70.9;
export const VISUAL_SCORE_EXPECTED_COUNTY_COUNT = 3222;

const OPENING_BUILDING_TARGET_BY_TIER = {
  urban_core: 12,
  suburban: 10,
  town: 8,
  rural: 6,
  frontier: 4,
};

export function buildVisualScoreReport() {
  const representativeCountyByArchetype = representativeCountiesByArchetype();
  const paletteByArchetype = {};
  const massingByArchetype = {};

  for (const archetype of ARCHETYPES) {
    const county = representativeCountyByArchetype[archetype];
    paletteByArchetype[archetype] = paletteFingerprint(county);
    massingByArchetype[archetype] = massingFingerprint(county);
  }

  const context = { paletteByArchetype, massingByArchetype };
  const counties = US_COUNTY_INDEX.map((county) => scoreCountyVisualSignals(county, context)).sort((a, b) =>
    a.countySlug.localeCompare(b.countySlug),
  );
  const scores = counties.map((county) => county.score);
  const distribution = summarizeVisualScores(scores);
  const worst50 = counties
    .slice()
    .sort((a, b) => a.score - b.score || a.countySlug.localeCompare(b.countySlug))
    .slice(0, 50)
    .map((county, index) => ({
      rank: index + 1,
      countySlug: county.countySlug,
      geoid: county.geoid,
      name: county.name,
      stateCode: county.stateCode,
      archetype: county.archetype,
      tier: county.tier,
      score: county.score,
      failingSignals: county.failingSignals,
    }));

  const gates = {
    expectedCountyCount: {
      floor: VISUAL_SCORE_EXPECTED_COUNTY_COUNT,
      actual: counties.length,
      pass: counties.length === VISUAL_SCORE_EXPECTED_COUNTY_COUNT,
    },
    medianFloor: {
      floor: VISUAL_SCORE_MEDIAN_FLOOR,
      actual: distribution.median,
      pass: distribution.median >= VISUAL_SCORE_MEDIAN_FLOOR,
    },
    hardFloor: {
      floor: VISUAL_SCORE_HARD_FLOOR,
      actual: distribution.min,
      pass: distribution.min >= VISUAL_SCORE_HARD_FLOOR,
    },
  };
  gates.pass = gates.expectedCountyCount.pass && gates.medianFloor.pass && gates.hardFloor.pass;

  return {
    packet: "0.79-1",
    schemaVersion: 1,
    source: "scripts/build-visual-score-report.mjs",
    countyCount: counties.length,
    expectedCountyCount: VISUAL_SCORE_EXPECTED_COUNTY_COUNT,
    weights: WEIGHTS,
    floors: {
      median: VISUAL_SCORE_MEDIAN_FLOOR,
      hard: VISUAL_SCORE_HARD_FLOOR,
    },
    distribution,
    gates,
    worst50,
    counties,
  };
}

export function scoreCountyVisualSignals(county, context) {
  try {
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const scene = result.scene;
    const parameters = resolveCountyParameters(county, generated.seed);
    const archetype = generated.archetype;
    const tier = parameters.urbanizationTier;
    const frame = openingFrameReadout(scene, "desktop");
    const vegetation = vegetationCounts(scene);
    const palette = paletteFingerprintForScene(scene);
    const massing = analyzeGeneratedDistrictMassingSignature(scene);
    const roadMetrics = layoutRoadMetrics(archetype, scene.roadSegments ?? []);
    const pattern = generated.spec.countyParameters?.layoutGrammar?.pattern ?? "missing";
    const labels = placeIdentityReadout(scene);
    const water = waterBandMetrics(scene);

    const signals = {
      compositionOccupancy: compositionOccupancySignal(frame, tier),
      waterVisibility: waterVisibilitySignal(archetype, frame, water),
      vegetationBandFit: vegetationBandFitSignal(archetype, vegetation),
      paletteNeighborDistance: paletteNeighborDistanceSignal(archetype, palette, context.paletteByArchetype),
      massingSignatureDistance: massingSignatureDistanceSignal(archetype, massing, context.massingByArchetype),
      roadClassMixSanity: roadClassMixSignal(archetype, roadMetrics, pattern),
      labelGrammarCoverage: labelGrammarSignal(labels),
    };
    const score = weightedVisualScore(signals);
    const failingSignals = visualFailingSignals(signals);

    return {
      countySlug: county.countySlug,
      geoid: county.geoid,
      name: county.name,
      stateCode: county.stateCode,
      archetype,
      tier,
      score,
      failingSignals,
      signals: compactVisualSignals(signals),
    };
  } catch (error) {
    return {
      countySlug: county.countySlug,
      geoid: county.geoid,
      name: county.name,
      stateCode: county.stateCode,
      archetype: "compile_error",
      tier: "missing",
      score: 0,
      failingSignals: [`compile: ${formatError(error)}`],
      signals: {},
    };
  }
}

export function roadClassMixFailures(archetype, metrics, pattern) {
  const failures = [];

  if (pattern !== LAYOUT_GRAMMAR_PATTERNS[archetype]) failures.push(`pattern ${pattern} != ${LAYOUT_GRAMMAR_PATTERNS[archetype]}`);

  if (archetype === "metro_grid") {
    if (metrics.axisRoads < 5) failures.push(`metro axis roads ${metrics.axisRoads} below 5`);
    if (metrics.diagonalAvenues < 1 || metrics.diagonalAvenues > 2) failures.push(`metro diagonal avenues ${metrics.diagonalAvenues} outside 1-2`);
  } else if (archetype === "coastal_grid") {
    if (metrics.shoreMainSegments < 2) failures.push(`coastal shore-main segments ${metrics.shoreMainSegments} below 2`);
    if (metrics.stepbackLanes < 3) failures.push(`coastal stepback/perpendicular lanes ${metrics.stepbackLanes} below 3`);
    if (metrics.nonAxisRoads < 3) failures.push(`coastal non-axis roads ${metrics.nonAxisRoads} below 3`);
  } else if (archetype === "desert_basin") {
    if (metrics.highwaySegments !== 2) failures.push(`desert highway segments ${metrics.highwaySegments} != 2`);
    if (metrics.offsetRoads < 1 || metrics.offsetRoads > 3) failures.push(`desert sparse offsets ${metrics.offsetRoads} outside 1-3`);
    if (metrics.avenues !== 2) failures.push(`desert avenues ${metrics.avenues} != 2 highway spine segments`);
  } else if (archetype === "mountain_valley") {
    if (metrics.contourRoads < 2) failures.push(`mountain contour roads ${metrics.contourRoads} below 2`);
    if (metrics.valleySpines < 1) failures.push("mountain valley spine missing");
    if (metrics.switchbacks < 2) failures.push(`mountain switchback/terrace branches ${metrics.switchbacks} below 2`);
  } else if (archetype === "prairie_town") {
    if (metrics.sectionGridRoads < 5) failures.push(`prairie section grid roads ${metrics.sectionGridRoads} below 5`);
    if (metrics.creekCurveSegments < 2) failures.push(`prairie creek/rail curve segments ${metrics.creekCurveSegments} below 2`);
    if (metrics.nonAxisRoads < 2) failures.push(`prairie non-axis roads ${metrics.nonAxisRoads} below 2`);
  } else if (archetype === "river_town") {
    if (metrics.bankRoadSegments < 4) failures.push(`river bank road segments ${metrics.bankRoadSegments} below 4`);
    if (metrics.bridgeRoads < 2) failures.push(`river bridge roads ${metrics.bridgeRoads} below 2`);
    if (metrics.bridgeCrosswalks < 2) failures.push(`river bridge crosswalks ${metrics.bridgeCrosswalks} below 2`);
  }

  return failures;
}

function compositionOccupancySignal(frame, tier) {
  const target = OPENING_BUILDING_TARGET_BY_TIER[tier] ?? 6;
  const ratio = frame.buildings / target;
  const score = clamp01(ratio);
  const failures = ratio >= 0.75 ? [] : [`opening buildings ${frame.buildings} below ${Math.ceil(target * 0.75)} for ${tier}`];
  return visualSignal(score, `${frame.buildings}/${target} opening buildings`, {
    buildings: frame.buildings,
    target,
    terrainTiles: frame.terrainTiles,
  }, failures);
}

function waterVisibilitySignal(archetype, frame, water) {
  if (!WATER_ARCHETYPES.has(archetype)) {
    return visualSignal(1, "not a water archetype", { applicable: false }, []);
  }

  const bandFloor = WATER_TILE_FLOORS[archetype] ?? 1;
  const bandRatio = water.count / bandFloor;
  const frameRatio = frame.waterTiles / COASTAL_OPENING_WATER_TILE_FLOOR;
  const score = clamp01(archetype === "coastal_grid" ? Math.min(bandRatio, frameRatio) : Math.max(bandRatio, frameRatio));
  const failures = [];

  if (water.count < bandFloor) failures.push(`water band ${water.count} below ${bandFloor}`);
  if (archetype === "coastal_grid" && frame.waterTiles < COASTAL_OPENING_WATER_TILE_FLOOR) {
    failures.push(`opening water ${frame.waterTiles} below ${COASTAL_OPENING_WATER_TILE_FLOOR}`);
  }

  return visualSignal(score, `${frame.waterTiles} opening / ${water.count} total water tiles`, {
    openingWaterTiles: frame.waterTiles,
    totalWaterTiles: water.count,
    bandFloor,
  }, failures);
}

function vegetationBandFitSignal(archetype, counts) {
  const band = VEGETATION_BANDS[archetype];
  const midpoint = (band.minVegetation + band.maxVegetation) / 2;
  const halfRange = Math.max(1, (band.maxVegetation - band.minVegetation) / 2);
  const distance = Math.abs(counts.vegetation - midpoint);
  const inBand = counts.vegetation >= band.minVegetation && counts.vegetation <= band.maxVegetation;
  const score = inBand ? clamp01(1 - (distance / halfRange) * 0.15) : clamp01(0.85 - (distance - halfRange) / Math.max(1, band.maxVegetation - band.minVegetation));
  const failures = inBand ? [] : [`vegetation ${counts.vegetation} outside ${band.minVegetation}-${band.maxVegetation}`];

  return visualSignal(score, `${counts.vegetation} vegetation vs midpoint ${roundMetric(midpoint)}`, {
    tree: counts.tree,
    bush: counts.bush,
    vegetation: counts.vegetation,
    midpoint: roundMetric(midpoint),
    band: { min: band.minVegetation, max: band.maxVegetation },
  }, failures);
}

function paletteNeighborDistanceSignal(archetype, palette, paletteByArchetype) {
  const targetDistance = 1 - MAX_PAIR_JACCARD;
  const nearest = nearestArchetypeDistance(archetype, ARCHETYPES, (neighbor) => 1 - jaccard(palette.all, paletteByArchetype[neighbor].all));
  const score = clamp01(nearest.distance / targetDistance);
  const failures = nearest.distance >= targetDistance ? [] : [`nearest ${nearest.archetype} distance ${nearest.distance} below ${targetDistance}`];

  return visualSignal(score, `${nearest.archetype} distance ${nearest.distance}`, {
    nearestArchetype: nearest.archetype,
    distance: nearest.distance,
    targetDistance,
    fingerprintSize: palette.all.size,
  }, failures);
}

function massingSignatureDistanceSignal(archetype, massing, massingByArchetype) {
  const targetDistance = GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR;
  const nearest = nearestArchetypeDistance(archetype, ARCHETYPES, (neighbor) =>
    generatedDistrictMassingSignatureDistance(massing, massingByArchetype[neighbor]),
  );
  const score = clamp01(nearest.distance / targetDistance);
  const failures = nearest.distance >= targetDistance ? [] : [`nearest ${nearest.archetype} distance ${nearest.distance} below ${targetDistance}`];

  return visualSignal(score, `${nearest.archetype} distance ${nearest.distance}`, {
    nearestArchetype: nearest.archetype,
    distance: nearest.distance,
    targetDistance,
    buildingCount: massing.buildingCount,
    roadCount: massing.roadCount,
  }, failures);
}

function roadClassMixSignal(archetype, metrics, pattern) {
  const failures = roadClassMixFailures(archetype, metrics, pattern);
  const score = clamp01(1 - failures.length * 0.2);
  return visualSignal(score, failures.length === 0 ? "road grammar passes" : failures.join("; "), {
    pattern,
    generatedRoadCount: metrics.axisRoads + metrics.nonAxisRoads,
    axisRoads: metrics.axisRoads,
    nonAxisRoads: metrics.nonAxisRoads,
    avenues: metrics.avenues,
  }, failures);
}

function labelGrammarSignal(labels) {
  const failures = [];
  const useful = labels.filter((place) => place.label && place.description);

  if (labels.length < 3) failures.push(`only ${labels.length} generated labels`);
  for (const place of labels) {
    if (!place.label) failures.push(`${place.id}: blank label`);
    if (!place.description) failures.push(`${place.id}: blank description`);
    if (P12_PLACE_IDENTITY_BANNED_WORDS.test(place.label)) failures.push(`${place.id}: banned label word`);
    if (P12_PLACE_IDENTITY_BANNED_WORDS.test(place.description)) failures.push(`${place.id}: banned description word`);
  }

  const coverageScore = clamp01(labels.length / 4);
  const usefulScore = labels.length === 0 ? 0 : useful.length / labels.length;
  const score = clamp01(coverageScore * 0.45 + usefulScore * 0.55 - failures.length * 0.1);
  return visualSignal(score, `${useful.length}/${labels.length} useful labels`, {
    labels: labels.length,
    useful: useful.length,
  }, failures);
}

function nearestArchetypeDistance(archetype, archetypes, distanceFn) {
  let nearest = { archetype: "none", distance: Number.POSITIVE_INFINITY };
  for (const candidate of archetypes) {
    if (candidate === archetype) continue;
    const distance = roundMetric(distanceFn(candidate));
    if (distance < nearest.distance || (distance === nearest.distance && candidate.localeCompare(nearest.archetype) < 0)) {
      nearest = { archetype: candidate, distance };
    }
  }
  return nearest.distance === Number.POSITIVE_INFINITY ? { archetype: "none", distance: 0 } : nearest;
}

function visualSignal(score, detail, value, failures) {
  return {
    score: roundScore(score),
    detail,
    value,
    failures,
  };
}

function weightedVisualScore(signals) {
  let total = 0;
  for (const [id, weight] of Object.entries(WEIGHTS)) {
    total += (signals[id]?.score ?? 0) * weight;
  }
  return roundScore(total);
}

function visualFailingSignals(signals) {
  return Object.entries(signals)
    .flatMap(([id, signal]) => {
      if (signal.failures.length > 0) return [`${id}: ${signal.failures.join("; ")}`];
      if (signal.score < 0.8) return [`${id}: score ${signal.score}`];
      return [];
    })
    .sort();
}

function compactVisualSignals(signals) {
  return Object.fromEntries(
    Object.entries(signals).map(([id, signal]) => [
      id,
      {
        score: signal.score,
        detail: signal.detail,
        value: signal.value,
        failures: signal.failures,
      },
    ]),
  );
}

export function summarizeVisualScores(scores) {
  const sorted = scores.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((total, score) => total + score, 0);
  return {
    min: roundScore(sorted[0] ?? 0),
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    max: roundScore(sorted[sorted.length - 1] ?? 0),
    mean: roundScore(sum / Math.max(1, sorted.length)),
    histogram: visualScoreHistogram(sorted),
  };
}

function percentile(sorted, ratio) {
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return roundScore(sorted[lower]);
  const weight = index - lower;
  return roundScore(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

function visualScoreHistogram(scores) {
  const bins = [];
  for (let min = 0; min < 100; min += 10) {
    bins.push({ range: `${min}-${min + 9}`, min, max: min + 9, count: 0 });
  }
  bins.push({ range: "100", min: 100, max: 100, count: 0 });

  for (const score of scores) {
    const index = score >= 100 ? 10 : Math.max(0, Math.min(9, Math.floor(score / 10)));
    bins[index].count += 1;
  }

  return bins;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function roundScore(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export function visualScoreReportMarkdown(report) {
  const lines = [
    "# Atlas 0.79-1 Visual Score Report",
    "",
    `Counties scored: ${report.countyCount}/${report.expectedCountyCount}`,
    `Median floor: ${report.floors.median} (observed ${report.distribution.median})`,
    `Hard floor: ${report.floors.hard} (observed minimum ${report.distribution.min})`,
    "",
    "## Weights",
    "",
    "| Signal | Weight |",
    "| --- | ---: |",
    ...Object.entries(report.weights).map(([signal, weight]) => `| ${signal} | ${weight} |`),
    "",
    "## National Histogram",
    "",
    "| Score range | Counties |",
    "| --- | ---: |",
    ...report.distribution.histogram.map((bin) => `| ${bin.range} | ${bin.count} |`),
    "",
    "## Distribution",
    "",
    `Min ${report.distribution.min}; p10 ${report.distribution.p10}; p25 ${report.distribution.p25}; median ${report.distribution.median}; p75 ${report.distribution.p75}; p90 ${report.distribution.p90}; max ${report.distribution.max}; mean ${report.distribution.mean}.`,
    "",
    "## Worst 50",
    "",
    "| Rank | County | Score | Archetype | Tier | Failing signals |",
    "| ---: | --- | ---: | --- | --- | --- |",
    ...report.worst50.map((county) =>
      `| ${county.rank} | ${county.countySlug} | ${county.score} | ${county.archetype} | ${county.tier} | ${county.failingSignals.join("<br>") || "none"} |`,
    ),
    "",
  ];

  return lines.join("\n");
}
