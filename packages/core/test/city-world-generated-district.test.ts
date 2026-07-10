import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_PROFILES,
  GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
  GENERATED_LANDMARK_SIGNATURES,
  GENERATED_DISTRICT_ARCHETYPES,
  REGION_PROFILES,
  REGIONAL_PALETTES,
  STATE_TO_DIVISION,
  analyzeGeneratedDistrictMassingSignature,
  analyzeGeneratedLandmark,
  compileCityWorldSceneWindow,
  createDeterministicGeneratedDistrictScene,
  createDeterministicGeneratedDistrictSpec,
  deterministicGeneratedDistrictSeedForCounty,
  evaluateCityWorldSceneWindowBudget,
  expectedGeneratedLandmarkKind,
  generatedDistrictMassingSignatureDistance,
  resolveCountyParameters,
  resolveEffectiveBuildingColors,
  US_COUNTY_INDEX,
} from "../src/index.js";
import type { CensusDivision, CityWorldProp, CityWorldScene, CountyGenerationParameters, GeneratedDistrictArchetype } from "../src/index.js";

const PALETTE_DISTINCTNESS_FLOOR = 0.16;
const FORMERLY_WATERLESS_RIVER_TOWN_SLUGS = [
  "andrews-tx",
  "brewster-tx",
  "gaines-tx",
  "garza-tx",
  "scurry-tx",
  "stonewall-tx",
  "sutton-tx",
] as const;
const WATER_ARCHETYPES: readonly GeneratedDistrictArchetype[] = ["coastal_grid", "river_town"];
const VEGETATION_EXPECTATIONS: Record<
  GeneratedDistrictArchetype,
  { trees: number; bushes: number; minVegetation: number; maxVegetation: number; minParkVegetation?: number; desertScrubOnly?: true }
> = {
  metro_grid: { trees: 23, bushes: 6, minVegetation: 26, maxVegetation: 34 },
  coastal_grid: { trees: 26, bushes: 2, minVegetation: 26, maxVegetation: 34, minParkVegetation: 7 },
  desert_basin: { trees: 0, bushes: 5, minVegetation: 5, maxVegetation: 8, desertScrubOnly: true },
  mountain_valley: { trees: 29, bushes: 4, minVegetation: 28, maxVegetation: 38, minParkVegetation: 7 },
  prairie_town: { trees: 29, bushes: 4, minVegetation: 32, maxVegetation: 44, minParkVegetation: 7 },
  river_town: { trees: 23, bushes: 4, minVegetation: 26, maxVegetation: 34 },
};

describe("deterministic generated district specs", () => {
  it("compiles repeatable provider-free district specs from Census county identity", () => {
    const cook = county("cook-il");
    const first = createDeterministicGeneratedDistrictSpec({ county: cook });
    const second = createDeterministicGeneratedDistrictSpec({ county: cook });
    const maricopa = createDeterministicGeneratedDistrictSpec({ county: county("maricopa-az") });

    expect(first).toEqual(second);
    expect(first.seed).not.toBe(maricopa.seed);
    expect(first.sourceBasis).toBe("census_identity_only");
    expect(first.providerGeometry).toBe(false);
    expect(first.publicPlayable).toBe(false);
    expect(first.promotionBlocked).toBe(true);
    expect(first.spec.roadSeeds.length).toBeGreaterThanOrEqual(6);
    expect(first.spec.zones.length).toBeGreaterThanOrEqual(9);
  });

  it("resolves county parameters deterministically across all Census divisions", () => {
    const sampleByDivision = new Map<CensusDivision, ReturnType<typeof county>>();
    for (const candidate of US_COUNTY_INDEX) {
      const division = STATE_TO_DIVISION[candidate.stateCode];
      if (division && !sampleByDivision.has(division)) sampleByDivision.set(division, candidate);
    }

    expect([...sampleByDivision.keys()].sort()).toEqual(Object.keys(REGION_PROFILES).sort());

    for (const [division, sampleCounty] of sampleByDivision) {
      const seed = deterministicGeneratedDistrictSeedForCounty({ county: sampleCounty });
      const first = resolveCountyParameters(sampleCounty, seed);
      const second = resolveCountyParameters(sampleCounty, seed);

      expect(first).toEqual(second);
      expect(first.seed).toBe(seed);
      expect(first.region).toBe(division);
      expect(first.regionProfile).toEqual(REGION_PROFILES[division]);
      expect(first.archetypeProfile).toEqual(ARCHETYPE_PROFILES[first.archetype]);
      expect(first.palette.archetype).toBe(first.archetype);
    }
  });

  it("produces bounded non-playable scenes that pass generated draft window budgets", () => {
    for (const countySlug of ["cook-il", "miami-dade-fl", "maricopa-az", "riverside-ca"]) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: county(countySlug) });
      const { scene } = result;

      expect(generated.publicPlayable).toBe(false);
      expect(scene.coverage).toMatchObject({
        countySlug,
        coverageTier: "L1_COUNTY_SHELL",
        playable: false,
      });
      expect(scene.terrainTiles.length).toBeGreaterThan(1_200);
      expect(scene.roadSegments.length).toBeGreaterThanOrEqual(6);
      // 0.75R: floors rebased on the fable parametric generator (fewer,
      // larger authored-mass lots: 18-21 lots / 17-19 buildings observed).
      expect(scene.lots.length).toBeGreaterThan(15);
      expect(scene.buildings.length).toBeGreaterThan(15);
      expect(scene.places.length).toBeGreaterThanOrEqual(6);
      expect(scene.pins).toHaveLength(0);
      expect(scene.actors).toHaveLength(0);
      expect(scene.cameraPresets.map((preset) => preset.id)).toEqual(
        expect.arrayContaining(["desktop", "mobile", "residential_detail", "commerce_detail"]),
      );

      for (const cameraId of ["desktop", "mobile"] as const) {
        const window = compileCityWorldSceneWindow(scene, cameraId);
        const budget = evaluateCityWorldSceneWindowBudget(window, "generated_draft_window", scene);
        expect(budget.blockers).toEqual([]);
        expect(budget.passed).toBe(true);
      }
    }
  });

  it("resolves measurably distinct regional palettes for every generated archetype (0.76-1)", () => {
    const signatures = new Map<GeneratedDistrictArchetype, RegionalPaletteSignature>();

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: countyForArchetype(archetype) });
      const parameters = resolveCountyParameters(county(generated.countySlug), generated.seed);
      expect(generated.archetype).toBe(archetype);
      expect(generated.spec.regionalPalette).toEqual(parameters.palette);
      expect(generated.spec.regionalPalette?.archetype).toBe(REGIONAL_PALETTES[archetype].archetype);
      expect(generated.spec.regionalPalette?.body).toEqual(REGIONAL_PALETTES[archetype].body);
      expect(generated.spec.regionalPalette?.roof).toEqual(REGIONAL_PALETTES[archetype].roof);

      const signature = dominantRegionalPaletteSignature(result.scene, archetype);
      expect(signature.terrainPaletteKey).toBe(REGIONAL_PALETTES[archetype].terrainTone.paletteKey);
      expect(signature.bodyColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(signature.roofColor).toMatch(/^#[0-9a-f]{6}$/);
      signatures.set(archetype, signature);
    }

    for (let firstIndex = 0; firstIndex < GENERATED_DISTRICT_ARCHETYPES.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < GENERATED_DISTRICT_ARCHETYPES.length; secondIndex += 1) {
        const first = GENERATED_DISTRICT_ARCHETYPES[firstIndex] as GeneratedDistrictArchetype;
        const second = GENERATED_DISTRICT_ARCHETYPES[secondIndex] as GeneratedDistrictArchetype;
        const distance = regionalPaletteDistance(signatures.get(first)!, signatures.get(second)!);
        expect(distance).toBeGreaterThanOrEqual(PALETTE_DISTINCTNESS_FLOOR);
      }
    }
  });

  it("resolves one distinct parameter-spine landmark per generated archetype (0.76-2)", () => {
    const silhouettes = new Map<GeneratedDistrictArchetype, string>();

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const parameters = resolveCountyParameters(testCounty, generated.seed);
      const expectedKind = expectedGeneratedLandmarkKind(parameters);
      const expected = GENERATED_LANDMARK_SIGNATURES[expectedKind];
      const landmark = analyzeGeneratedLandmark(result.scene);

      expect(generated.spec.countyParameters).toEqual(parameters);
      expect(generated.archetype).toBe(archetype);
      expect(expected.archetype).toBe(archetype);
      expect(landmark).not.toBeNull();
      expect(landmark?.kind).toBe(expectedKind);
      expect(landmark?.hostCell).toBe(expected.hostCell);
      expect(landmark?.buildingKind).toBe(expected.buildingKind);
      expect(landmark?.roofShape).toBe(expected.roofShape);
      expect(landmark?.facadeStyle).toBe(expected.facadeStyle);
      expect(result.scene.hudDefaults.selectedPlaceId).toBe(landmark?.placeId);
      expect(result.scene.buildings.some((building) => building.id === landmark?.buildingId)).toBe(true);
      for (const propKind of expected.expectedAccentProps) {
        expect(result.scene.props.map((prop) => prop.kind)).toContain(propKind);
      }
      silhouettes.set(archetype, landmark?.silhouetteKey ?? "");
    }

    expect(new Set(silhouettes.values()).size).toBe(GENERATED_DISTRICT_ARCHETYPES.length);

    const bayCounty = county("bay-fl");
    const bayGenerated = createDeterministicGeneratedDistrictScene({ county: bayCounty });
    const bayLandmark = analyzeGeneratedLandmark(bayGenerated.result.scene);
    expect(resolveCountyParameters(bayCounty, bayGenerated.generated.seed).nameSignal).toContain("bay");
    expect(bayLandmark?.kind).toBe("coastal_pier_hall");
    expect(bayGenerated.result.scene.buildings.find((building) => building.id === bayLandmark?.buildingId)?.label).toBe(
      "Waterfront pier hall",
    );
  });

  it("resolves distinct massing and street-layout signatures per generated archetype (0.76-3)", () => {
    const signatures = new Map<GeneratedDistrictArchetype, ReturnType<typeof analyzeGeneratedDistrictMassingSignature>>();

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const parameters = resolveCountyParameters(testCounty, generated.seed);
      const signature = analyzeGeneratedDistrictMassingSignature(result.scene);

      expect(generated.archetype).toBe(archetype);
      expect(generated.spec.countyParameters?.modulation).toEqual(parameters.modulation);
      expect(signature.buildingCount).toBeGreaterThan(8);
      expect(signature.roadLength).toBeGreaterThan(80);
      signatures.set(archetype, signature);
    }

    for (let firstIndex = 0; firstIndex < GENERATED_DISTRICT_ARCHETYPES.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < GENERATED_DISTRICT_ARCHETYPES.length; secondIndex += 1) {
        const first = GENERATED_DISTRICT_ARCHETYPES[firstIndex] as GeneratedDistrictArchetype;
        const second = GENERATED_DISTRICT_ARCHETYPES[secondIndex] as GeneratedDistrictArchetype;
        const distance = generatedDistrictMassingSignatureDistance(signatures.get(first)!, signatures.get(second)!);
        expect(distance).toBeGreaterThanOrEqual(GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR);
      }
    }
  });

  it("saturates generated vegetation by archetype without placing trees in road corridors (E2)", () => {
    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const first = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const second = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const expected = VEGETATION_EXPECTATIONS[archetype];
      const counts = vegetationCounts(first.result.scene);
      const repeatedCounts = vegetationCounts(second.result.scene);

      expect(first.generated.archetype).toBe(archetype);
      expect(counts).toEqual(repeatedCounts);
      expect(counts.tree).toBe(expected.trees);
      expect(counts.bush).toBe(expected.bushes);
      expect(counts.vegetation).toBeGreaterThanOrEqual(expected.minVegetation);
      expect(counts.vegetation).toBeLessThanOrEqual(expected.maxVegetation);
      if (expected.desertScrubOnly) {
        expect(counts.tree).toBe(0);
        expect(counts.bush).toBeGreaterThanOrEqual(4);
        expect(counts.bush).toBeLessThanOrEqual(8);
      } else {
        expect(counts.tree).toBeGreaterThanOrEqual(10);
      }

      const parkZones = first.generated.spec.zones.filter((zone) => zone.kind === "park");
      if (parkZones.length > 0) {
        const parkVegetation = first.result.scene.props.filter(
          (prop) => isVegetation(prop) && parkZones.some((zone) => pointInsideRect(prop.position, zone.rect)),
        );
        expect(parkVegetation.length).toBeGreaterThanOrEqual(expected.minParkVegetation ?? 5);
      }

      for (const prop of first.result.scene.props.filter(isVegetation)) {
        expect(propClearsRoadCorridors(prop, first.result.scene)).toBe(true);
      }
    }
  });

  it("keeps coastal California out of the coarse desert box", () => {
    const coastalCalifornia = [
      "los-angeles-ca",
      "monterey-ca",
      "orange-ca",
      "san-diego-ca",
      "san-francisco-ca",
      "san-luis-obispo-ca",
      "san-mateo-ca",
      "santa-barbara-ca",
      "santa-cruz-ca",
      "ventura-ca",
    ];

    for (const countySlug of coastalCalifornia) {
      const parameters = parametersForCounty(countySlug);
      expect(parameters.archetype).toBe("coastal_grid");
      expect(parameters.climate.aridity).not.toBe("arid");
      expect(parameters.climate.inlandAridProxy).toBe(false);
    }

    const californiaDesert = US_COUNTY_INDEX.filter((candidate) => candidate.stateCode === "CA")
      .filter((candidate) => createDeterministicGeneratedDistrictSpec({ county: candidate }).archetype === "desert_basin")
      .map((candidate) => candidate.countySlug)
      .sort();

    expect(californiaDesert).toEqual(["imperial-ca", "inyo-ca", "kern-ca", "riverside-ca", "san-bernardino-ca"]);
    expect(californiaDesert.length).toBeLessThan(28);
  });

  it("resolves measurable diversity within the same archetype across region, climate, and name", () => {
    const bayFlorida = parametersForCounty("bay-fl");
    const kingWashington = parametersForCounty("king-wa");

    expect(bayFlorida.archetype).toBe("coastal_grid");
    expect(kingWashington.archetype).toBe("coastal_grid");
    expect(bayFlorida.region).not.toBe(kingWashington.region);
    expect(bayFlorida.climate.latitudeBand).not.toBe(kingWashington.climate.latitudeBand);
    expect(bayFlorida.nameSignal).toContain("bay");
    expect(kingWashington.nameSignal).not.toContain("bay");
    expect(parameterDiversityScore(bayFlorida, kingWashington)).toBeGreaterThanOrEqual(5);
  });

  it("clamps incoherent parameter envelopes", () => {
    const sample = [
      ...US_COUNTY_INDEX.filter((_, index) => index % 41 === 0),
      ...["orange-ca", "san-diego-ca", "bay-fl", "imperial-ca", "miami-dade-fl", "king-wa"].map(county),
    ];

    for (const sampleCounty of sample) {
      const parameters = parametersForCounty(sampleCounty.countySlug);
      if (parameters.archetype === "coastal_grid" || parameters.climate.coastalProximity !== "inland") {
        expect(parameters.climate.aridity).not.toBe("arid");
        expect(parameters.climate.aridityScore).toBeLessThanOrEqual(0.5);
      }
      if (parameters.climate.latitudeBand === "tropical" || parameters.climate.latitudeBand === "subtropical") {
        expect(parameters.climate.snowRoofAllowed).toBe(false);
        expect(parameters.envelope.snowRoofSuppressed).toBe(true);
      }
    }
  });

  it("reroutes arid seed-fallback river towns to coherent desert landmarks (E1)", () => {
    for (const countySlug of FORMERLY_WATERLESS_RIVER_TOWN_SLUGS) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: county(countySlug) });
      const parameters = resolveCountyParameters(county(countySlug), generated.seed);
      const landmark = analyzeGeneratedLandmark(result.scene);

      expect(parameters.climate.aridity).toBe("arid");
      expect(generated.archetype).toBe("desert_basin");
      expect(parameters.archetype).toBe("desert_basin");
      expect(result.scene.terrainTiles.filter((tile) => tile.kind === "water")).toHaveLength(0);
      expect(landmark).not.toBeNull();
      expect(landmark?.kind).toBe("desert_mesa_tower");
      expect(landmark?.hostCell).toBe("highest_block_corner");
    }
  });

  it("keeps sampled water archetype counties water-backed with landmarks (E1)", () => {
    const sample = sampledWaterArchetypeCounties();

    expect(sample.length).toBeGreaterThanOrEqual(10);
    for (const sampleCounty of sample) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: sampleCounty });
      const waterTiles = result.scene.terrainTiles.filter((tile) => tile.kind === "water");
      const landmark = analyzeGeneratedLandmark(result.scene);

      expect(WATER_ARCHETYPES).toContain(generated.archetype);
      expect(waterTiles.length).toBeGreaterThan(0);
      expect(landmark).not.toBeNull();
      expect(result.scene.buildings.some((building) => building.id === landmark?.buildingId)).toBe(true);
    }
  });
});

function county(countySlug: string) {
  const entry = US_COUNTY_INDEX.find((candidate) => candidate.countySlug === countySlug);
  if (!entry) throw new Error(`Missing test county ${countySlug}`);
  return entry;
}

function countyForArchetype(archetype: GeneratedDistrictArchetype) {
  const entry = US_COUNTY_INDEX.find(
    (candidate) => createDeterministicGeneratedDistrictSpec({ county: candidate }).archetype === archetype,
  );
  if (!entry) throw new Error(`Missing county fixture for generated archetype ${archetype}`);
  return entry;
}

function sampledWaterArchetypeCounties() {
  const sample = new Map<string, ReturnType<typeof county>>();
  const waterCounties = US_COUNTY_INDEX.filter((candidate) =>
    WATER_ARCHETYPES.includes(createDeterministicGeneratedDistrictSpec({ county: candidate }).archetype),
  );

  for (let index = 0; index < waterCounties.length; index += 53) {
    const sampleCounty = waterCounties[index]!;
    sample.set(sampleCounty.countySlug, sampleCounty);
  }
  for (const archetype of WATER_ARCHETYPES) {
    const sampleCounty = countyForArchetype(archetype);
    sample.set(sampleCounty.countySlug, sampleCounty);
  }
  for (const countySlug of ["bay-fl", "king-wa"]) {
    const sampleCounty = county(countySlug);
    if (WATER_ARCHETYPES.includes(createDeterministicGeneratedDistrictSpec({ county: sampleCounty }).archetype)) {
      sample.set(sampleCounty.countySlug, sampleCounty);
    }
  }

  return [...sample.values()];
}

function parametersForCounty(countySlug: string): CountyGenerationParameters {
  const sampleCounty = county(countySlug);
  const seed = deterministicGeneratedDistrictSeedForCounty({ county: sampleCounty });
  return resolveCountyParameters(sampleCounty, seed);
}

function vegetationCounts(scene: CityWorldScene): { tree: number; bush: number; vegetation: number } {
  const tree = scene.props.filter((prop) => prop.kind === "tree").length;
  const bush = scene.props.filter((prop) => prop.kind === "bush").length;
  return { tree, bush, vegetation: tree + bush };
}

function isVegetation(prop: CityWorldProp): boolean {
  return prop.kind === "tree" || prop.kind === "bush";
}

function propClearsRoadCorridors(prop: CityWorldProp, scene: CityWorldScene): boolean {
  for (const road of scene.roadSegments) {
    if (road.kind === "crosswalk") continue;
    const halfCorridor = road.width / 2 + 0.35;
    const minX = Math.min(road.from.x, road.to.x) - halfCorridor;
    const maxX = Math.max(road.from.x, road.to.x) + halfCorridor;
    const minY = Math.min(road.from.y, road.to.y) - halfCorridor;
    const maxY = Math.max(road.from.y, road.to.y) + halfCorridor;
    if (prop.position.x >= minX && prop.position.x <= maxX && prop.position.y >= minY && prop.position.y <= maxY) return false;
  }
  return true;
}

function pointInsideRect(point: { x: number; y: number }, rect: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
  return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
}

function parameterDiversityScore(first: CountyGenerationParameters, second: CountyGenerationParameters): number {
  let score = 0;
  if (first.region !== second.region) score += 1;
  if (first.climate.latitudeBand !== second.climate.latitudeBand) score += 1;
  if (first.climate.aridity !== second.climate.aridity) score += 1;
  if (first.nameSignal.join("|") !== second.nameSignal.join("|")) score += 1;
  if ((first.palette.variantOffset ?? 0) !== (second.palette.variantOffset ?? 0)) score += 1;
  if (Math.abs(first.modulation.densityScale - second.modulation.densityScale) >= 0.01) score += 1;
  if (Math.abs(first.modulation.reliefScale - second.modulation.reliefScale) >= 0.01) score += 1;
  if (Math.abs(first.modulation.waterAffinity - second.modulation.waterAffinity) >= 0.1) score += 1;
  return score;
}

type RegionalPaletteSignature = {
  archetype: GeneratedDistrictArchetype;
  bodyColor: string;
  roofColor: string;
  terrainColor: string;
  terrainPaletteKey: string;
};

function dominantRegionalPaletteSignature(scene: CityWorldScene, archetype: GeneratedDistrictArchetype): RegionalPaletteSignature {
  const effectiveBuildingColors = scene.buildings.map((building) => resolveEffectiveBuildingColors(building));
  const terrainPaletteKey = dominant(
    scene.terrainTiles.filter((tile) => tile.kind !== "water").map((tile) => tile.paletteKey ?? ""),
  );

  return {
    archetype,
    bodyColor: dominant(effectiveBuildingColors.map((colors) => colors.bodyColor)),
    roofColor: dominant(effectiveBuildingColors.map((colors) => colors.roofColor)),
    terrainColor: REGIONAL_PALETTES[archetype].terrainTone.base.toLowerCase(),
    terrainPaletteKey,
  };
}

function regionalPaletteDistance(first: RegionalPaletteSignature, second: RegionalPaletteSignature): number {
  return roundMetric(
    (colorDistance(first.bodyColor, second.bodyColor) +
      colorDistance(first.roofColor, second.roofColor) +
      colorDistance(first.terrainColor, second.terrainColor)) /
      3,
  );
}

function colorDistance(first: string, second: string): number {
  const a = parseHexColor(first);
  const b = parseHexColor(second);
  return Math.sqrt(((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / (3 * 255 ** 2));
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.toLowerCase().replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function dominant(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const winner = [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))[0];
  if (!winner) throw new Error("Cannot resolve dominant palette from an empty list");
  return winner[0];
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
