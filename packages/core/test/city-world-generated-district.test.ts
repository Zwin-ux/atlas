import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_PROFILES,
  GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
  GENERATED_LANDMARK_SIGNATURES,
  GENERATED_DISTRICT_ARCHETYPES,
  REGION_PROFILES,
  REGIONAL_PALETTES,
  STATE_TO_DIVISION,
  analyzeCityWorldScene,
  analyzeGeneratedDistrictMassingSignature,
  analyzeGeneratedDistrictParity,
  analyzeGeneratedLandmark,
  compileCityWorldScene,
  compileCityWorldSceneWindow,
  createDeterministicGeneratedDistrictScene,
  createDeterministicGeneratedDistrictSpec,
  deterministicGeneratedDistrictSeedForCounty,
  evaluateCityWorldSceneWindowBudget,
  expectedGeneratedLandmarkKind,
  generatedDistrictMassingSignatureDistance,
  resolveCountyParameters,
  resolveEffectiveBuildingColors,
  riversideDemoVoxelScene,
  sampleCityWorldViewportForCameraPreset,
  US_COUNTY_INDEX,
} from "../src/index.js";
import { GENERATED_ART_PROFILES, generatedArtProfileForId } from "../src/voxel/cityWorldCountyParameters.js";
import type { CensusDivision, CityWorldProp, CityWorldScene, CountyGenerationParameters, GeneratedDistrictArchetype } from "../src/index.js";
import type { CityWorldBuilding, CityWorldRoadSegment, CityWorldTerrainTile, CityWorldZoneKind, CityWorldZoneSpec } from "../src/index.js";

const PALETTE_DISTINCTNESS_FLOOR = 0.145;
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
  metro_grid: { trees: 24, bushes: 6, minVegetation: 26, maxVegetation: 34 },
  coastal_grid: { trees: 27, bushes: 2, minVegetation: 26, maxVegetation: 34, minParkVegetation: 7 },
  desert_basin: { trees: 0, bushes: 6, minVegetation: 5, maxVegetation: 8, desertScrubOnly: true },
  mountain_valley: { trees: 32, bushes: 4, minVegetation: 28, maxVegetation: 38, minParkVegetation: 7 },
  prairie_town: { trees: 32, bushes: 4, minVegetation: 32, maxVegetation: 44, minParkVegetation: 7 },
  river_town: { trees: 25, bushes: 6, minVegetation: 26, maxVegetation: 34 },
};
const E5_FILL_ZONE_KINDS = new Set<CityWorldZoneKind>([
  "farm_field",
  "plaza_paving",
  "civic_forecourt",
  "dry_wash",
  "meadow",
  "scree",
  "shore_bank",
  "green_common",
]);
const E5_FILL_EXPECTATIONS: Record<GeneratedDistrictArchetype, { minCoverage: number; kinds: CityWorldZoneKind[] }> = {
  metro_grid: { minCoverage: 0.6, kinds: ["plaza_paving", "civic_forecourt"] },
  coastal_grid: { minCoverage: 0.6, kinds: ["shore_bank", "green_common"] },
  desert_basin: { minCoverage: 0.6, kinds: ["dry_wash"] },
  mountain_valley: { minCoverage: 0.6, kinds: ["meadow", "scree"] },
  prairie_town: { minCoverage: 0.6, kinds: ["farm_field"] },
  river_town: { minCoverage: 0.6, kinds: ["shore_bank", "green_common"] },
};
const DEFAULT_MATERIAL_PROFILE = "socal_stucco_warm";
const DEFAULT_ROOF_PROFILE = "terracotta_barrel_tile";
const GENERATED_PROFILE_RATE_FLOOR = 0.6;
const ATTACHMENT_RATE_FLOOR = 0.4;
const ATTACHMENT_RATE_CEILING = 0.7;
const GENERATED_ATTACHMENT_KINDS = [
  "chimney",
  "porch_step",
  "porch_canopy",
  "dormer",
  "awning",
  "roof_ac",
  "parapet_vent",
  "entry_canopy",
] as const;

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

  it("routes generated material and roof grammar from authored properties (E6/E7)", () => {
    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const { result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const buildings = result.scene.buildings.filter((building) => !isAttachmentBuilding(building));
      const materialRich = buildings.filter((building) => building.visualGrammar?.materialProfile !== DEFAULT_MATERIAL_PROFILE);
      const roofRich = buildings.filter((building) => building.visualGrammar?.roofProfile !== DEFAULT_ROOF_PROFILE);
      const missingProfiles = buildings.filter((building) => !building.visualGrammar?.materialProfile || !building.visualGrammar.roofProfile);

      expect(missingProfiles).toEqual([]);
      expect(materialRich.length / buildings.length).toBeGreaterThanOrEqual(GENERATED_PROFILE_RATE_FLOOR);
      expect(roofRich.length / buildings.length).toBeGreaterThanOrEqual(GENERATED_PROFILE_RATE_FLOOR);
    }

    for (const archetype of ["desert_basin", "prairie_town"] as const) {
      const testCounty = countyForArchetype(archetype);
      const { result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const landmark = analyzeGeneratedLandmark(result.scene);
      const landmarkBuilding = result.scene.buildings.find((building) => building.id === landmark?.buildingId);

      expect(landmark?.kind).toMatch(/desert_mesa_tower|prairie_grain_elevator/);
      expect(landmarkBuilding?.kind).toBe("gym");
      expect(landmarkBuilding?.facadeStyle).toBe("fitness");
      expect(landmarkBuilding?.roofShape).toBe("tower");
      expect(landmarkBuilding?.visualGrammar?.objectFamily).toBe("service_block");
      expect(landmarkBuilding?.visualGrammar?.roofProfile).toBe("blue_metal_utility");
      expect(landmarkBuilding?.visualGrammar?.noLabelPriority).toBe("supporting");
    }
  });

  it("authors deterministic generated building attachments within the W4.1 rate band", () => {
    const aggregateCounts = Object.fromEntries(GENERATED_ATTACHMENT_KINDS.map((kind) => [kind, 0]));

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const first = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const second = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const firstReadout = attachmentReadout(first.result.scene);
      const secondReadout = attachmentReadout(second.result.scene);

      expect(first.generated.archetype).toBe(archetype);
      expect(firstReadout.countsByKind).toEqual(secondReadout.countsByKind);
      expect(firstReadout.parentIds).toEqual(secondReadout.parentIds);
      expect(firstReadout.eligibleParentCount).toBeGreaterThan(0);
      expect(firstReadout.parentRate).toBeGreaterThanOrEqual(ATTACHMENT_RATE_FLOOR);
      expect(firstReadout.parentRate).toBeLessThanOrEqual(ATTACHMENT_RATE_CEILING);
      expect(firstReadout.attachmentCount).toBeGreaterThan(0);

      for (const [kind, count] of Object.entries(firstReadout.countsByKind)) {
        aggregateCounts[kind as keyof typeof aggregateCounts] += count;
      }
      for (const attachment of firstReadout.attachments) {
        const metadata = attachment.visualGrammar?.buildingAttachment;
        const parent = first.result.scene.buildings.find((building) => building.id === metadata?.parentBuildingId);
        expect(metadata).toBeTruthy();
        expect(parent?.visualGrammar?.buildingAttachments).toContain(metadata?.kind);
        expect(attachment.detailLevel).toBe("low");
      }
    }

    for (const kind of GENERATED_ATTACHMENT_KINDS) {
      expect(aggregateCounts[kind]).toBeGreaterThan(0);
    }
  });

  it("leaves curated Riverside compile output byte-identical while generated attachments are active", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const hash = createHash("sha256").update(JSON.stringify(city)).digest("hex");
    const baseline = readFileSync(new URL("../../../artifacts/engine-todo/curated-compile-baseline.txt", import.meta.url), "utf8").trim();

    expect(hash).toBe(baseline);
    expect(city.buildings.some(isAttachmentBuilding)).toBe(false);
    expect(city.buildings.some((building) => (building.visualGrammar?.buildingAttachments?.length ?? 0) > 0)).toBe(false);
  });

  it("routes W4.2 generated road widths and lane markings through the county art profile", () => {
    const curated = compileCityWorldScene(riversideDemoVoxelScene);
    const curatedHash = createHash("sha256").update(JSON.stringify(curated)).digest("hex");
    const curatedBaseline = readFileSync(new URL("../../../artifacts/engine-todo/curated-compile-baseline.txt", import.meta.url), "utf8").trim();
    expect(curatedHash).toBe(curatedBaseline);

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const profile = GENERATED_ART_PROFILES[archetype];
      const generatedRoads = result.scene.roadSegments.filter((road) => road.id.startsWith("gen-road-"));

      expect(generated.archetype).toBe(archetype);
      expect(generated.spec.countyParameters?.artProfile).toEqual(profile);
      expect(generatedRoads.length).toBeGreaterThan(0);

      for (const road of generatedRoads) {
        expect(generatedArtProfileForId(road.id)).toEqual(profile);
        if (road.kind === "avenue") {
          expect(road.width).toBe(profile.arterialWidth);
          expect(road.visualGrammar?.roadContact?.laneMarking).toBe("avenue_dash");
        } else if (road.kind === "street") {
          expect(road.width).toBe(profile.residentialLaneWidth);
          expect(road.visualGrammar?.roadContact?.laneMarking).toBe(profile.roadTone === "metro_asphalt" ? "street_dash" : "none");
        } else if (road.kind === "driveway") {
          expect(road.width).toBe(profile.drivewayWidth);
          expect(road.visualGrammar?.roadContact?.laneMarking).toBe("none");
        }
      }
    }
  });

  it("routes W4.5 generated tree species deterministically by archetype", () => {
    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const first = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const second = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const expectedSpecies = new Set(GENERATED_ART_PROFILES[archetype].treeSpecies);
      const firstTrees = generatedTreeReadout(first.result.scene);
      const secondTrees = generatedTreeReadout(second.result.scene);

      expect(first.generated.archetype).toBe(archetype);
      expect(firstTrees).toEqual(secondTrees);
      for (const tree of firstTrees) {
        expect(expectedSpecies.has(tree.species)).toBe(true);
      }
      if (firstTrees.length > 1 && expectedSpecies.size > 1) {
        expect(new Set(firstTrees.map((tree) => tree.species)).size).toBeGreaterThanOrEqual(2);
      }
    }
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

  it("authors overview-readable water bands and relief strata for generated terrain (E3/E4)", () => {
    const coastal = createDeterministicGeneratedDistrictScene({ county: countyForArchetype("coastal_grid") });
    const horizontalRiver = createDeterministicGeneratedDistrictScene({ county: county("butler-al") });
    const verticalRiver = createDeterministicGeneratedDistrictScene({ county: riverCountyForAxis("vertical") });
    const mountain = createDeterministicGeneratedDistrictScene({ county: countyForArchetype("mountain_valley") });
    const desert = createDeterministicGeneratedDistrictScene({ county: countyForArchetype("desert_basin") });

    const coastalWater = waterBandMetrics(coastal.result.scene);
    expect(coastalWater.count).toBeGreaterThanOrEqual(250);
    expect(coastalWater.maxX).toBe(coastal.result.scene.bounds.maxX);
    expect(coastalWater.yCoverage).toBe(coastal.result.scene.bounds.maxY - coastal.result.scene.bounds.minY + 1);
    expect(waterAccentMetrics(coastal.result.scene).dockEdgeDistance).toBeLessThanOrEqual(1);
    expect(waterAccentMetrics(coastal.result.scene).boatEdgeDistance).toBeLessThanOrEqual(4);

    for (const river of [horizontalRiver, verticalRiver]) {
      const riverWater = waterBandMetrics(river.result.scene);
      expect(river.generated.archetype).toBe("river_town");
      expect(riverWater.count).toBeGreaterThanOrEqual(150);
      expect(riverWater.crossesBoardX || riverWater.crossesBoardY).toBe(true);
      expect(terrainElevationSpread(river.result.scene).spread).toBeGreaterThanOrEqual(0.5);
      expect(river.result.scene.buildings.length).toBeGreaterThan(15);
      expect(waterAccentMetrics(river.result.scene).dockEdgeDistance).toBeLessThanOrEqual(1);
      expect(waterAccentMetrics(river.result.scene).boatEdgeDistance).toBeLessThanOrEqual(4);
    }

    const mountainRelief = terrainElevationSpread(mountain.result.scene);
    expect(mountainRelief.spread).toBeGreaterThanOrEqual(1);
    expect(mountainRelief.dropTileCount).toBeGreaterThanOrEqual(80);

    const desertRelief = terrainElevationSpread(desert.result.scene);
    expect(desertRelief.spread).toBeGreaterThanOrEqual(0.5);
    expect(desertRelief.dropTileCount).toBeGreaterThanOrEqual(40);
  });

  it("fills open generated blocks with deterministic archetype-specific ground treatments (E5)", () => {
    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const first = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const second = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const expected = E5_FILL_EXPECTATIONS[archetype];
      const firstCoverage = openBlockFillCoverage(first.generated.spec.zones, first.result.scene);
      const secondCoverage = openBlockFillCoverage(second.generated.spec.zones, second.result.scene);

      expect(first.generated.archetype).toBe(archetype);
      expect(firstCoverage).toEqual(secondCoverage);
      expect(firstCoverage.openGroundTiles).toBeGreaterThan(0);
      expect(firstCoverage.fillCoverageRatio).toBeGreaterThanOrEqual(expected.minCoverage);
      expect(firstCoverage.fillTileCount).toBeGreaterThan(20);
      for (const kind of expected.kinds) {
        expect(firstCoverage.fillKinds).toContain(kind);
      }

      if (archetype === "prairie_town") {
        expect(firstCoverage.fillZoneCounts.farm_field).toBeGreaterThanOrEqual(2);
        expect(firstCoverage.fillZoneCounts.farm_field).toBeLessThanOrEqual(4);
        expect(firstCoverage.fillVariantCount).toBeGreaterThanOrEqual(2);
      }
      if (archetype === "coastal_grid" || archetype === "river_town") {
        expect(firstCoverage.waterEdgeFillTiles).toBeGreaterThan(0);
      }
    }
  });

  it("keeps river-town residential clone pressure below the tail-packet headroom target (E8)", () => {
    const pressures = new Map<GeneratedDistrictArchetype, number>();

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const testCounty = countyForArchetype(archetype);
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const diagnostics = analyzeCityWorldScene(result.scene, "playable");
      const pressure = roundMetric(diagnostics.metrics.homeClonePressure);

      expect(generated.archetype).toBe(archetype);
      expect(pressure).toBeLessThanOrEqual(0.3);
      pressures.set(archetype, pressure);
    }

    expect(pressures.get("river_town")).toBeLessThanOrEqual(0.25);
  });

  it("keeps water-aware river-town opening frames built while bringing water into view (E10)", () => {
    for (const testCounty of [county("butler-al"), county("talladega-al")]) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: testCounty });
      const parity = analyzeGeneratedDistrictParity(result.scene);

      expect(generated.archetype).toBe("river_town");
      for (const cameraId of ["desktop", "mobile"] as const) {
        const frame = openingFrameReadout(result.scene, cameraId);
        expect(frame.waterTiles).toBeGreaterThanOrEqual(18);
        expect(frame.buildings).toBeGreaterThan(0);
        expect(parity.frameDensity[cameraId]?.lowerFrameOccupancyRatio ?? 0).toBeGreaterThanOrEqual(cameraId === "desktop" ? 0.18 : 0.1);
      }
    }
  });

  it("uses the stronger in-palette prairie crop-row tone alternation (tail contrast)", () => {
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county: countyForArchetype("prairie_town") });
    const variants = prairieFarmFieldVariants(generated.spec.zones, result.scene);
    const toneOffsets = variants.map(prairieGrassVariantToneOffset);

    expect(generated.archetype).toBe("prairie_town");
    expect(variants).toEqual([0, 4]);
    expect(toneOffsets).toEqual([-2.4, 2.4]);
    expect(roundMetric(toneOffsets[1]! - toneOffsets[0]!)).toBe(4.8);
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

function riverCountyForAxis(axis: "horizontal" | "vertical") {
  const entry = US_COUNTY_INDEX.find((candidate) => {
    const generated = createDeterministicGeneratedDistrictSpec({ county: candidate });
    if (generated.archetype !== "river_town") return false;
    return axis === "horizontal" ? generated.seed % 2 === 0 : generated.seed % 2 === 1;
  });
  if (!entry) throw new Error(`Missing ${axis} river-town fixture`);
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

function generatedTreeReadout(scene: CityWorldScene): Array<{ id: string; variant: number; species: "round_canopy" | "conifer" | "palm" }> {
  return scene.props
    .filter((prop) => prop.kind === "tree" && prop.id.startsWith("gen-"))
    .map((prop) => ({
      id: prop.id,
      variant: prop.variant,
      species: generatedTreeSpeciesFromCompiledVariant(prop.variant),
    }))
    .sort((first, second) => first.id.localeCompare(second.id));
}

function generatedTreeSpeciesFromCompiledVariant(variant: number): "round_canopy" | "conifer" | "palm" {
  if (variant >= 40) return "palm";
  if (variant >= 20) return "conifer";
  return "round_canopy";
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

function waterBandMetrics(scene: CityWorldScene) {
  const waterTiles = scene.terrainTiles.filter((tile) => tile.kind === "water");
  if (waterTiles.length === 0) {
    return {
      count: 0,
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      xCoverage: 0,
      yCoverage: 0,
      crossesBoardX: false,
      crossesBoardY: false,
    };
  }
  const xs = waterTiles.map((tile) => tile.position.x);
  const ys = waterTiles.map((tile) => tile.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xCoverage = new Set(xs).size;
  const yCoverage = new Set(ys).size;
  return {
    count: waterTiles.length,
    minX,
    maxX,
    minY,
    maxY,
    xCoverage,
    yCoverage,
    crossesBoardX: minX === scene.bounds.minX && maxX === scene.bounds.maxX,
    crossesBoardY: minY === scene.bounds.minY && maxY === scene.bounds.maxY,
  };
}

function waterAccentMetrics(scene: CityWorldScene): { dockEdgeDistance: number; boatEdgeDistance: number } {
  const water = waterBandMetrics(scene);
  const distanceToEdge = (prop: CityWorldProp | undefined) => {
    if (!prop || water.count === 0) return Number.POSITIVE_INFINITY;
    return Math.min(
      Math.abs(prop.position.x - water.minX),
      Math.abs(water.maxX - prop.position.x),
      Math.abs(prop.position.y - water.minY),
      Math.abs(water.maxY - prop.position.y),
    );
  };
  return {
    dockEdgeDistance: distanceToEdge(scene.props.find((prop) => prop.kind === "dock")),
    boatEdgeDistance: distanceToEdge(scene.props.find((prop) => prop.kind === "boat")),
  };
}

function openingFrameReadout(scene: CityWorldScene, cameraId: "desktop" | "mobile"): { waterTiles: number; buildings: number } {
  const preset = scene.cameraPresets.find((candidate) => candidate.id === cameraId);
  if (!preset) throw new Error(`Missing ${cameraId} camera preset`);
  const sample = sampleCityWorldViewportForCameraPreset(scene, preset);
  return {
    waterTiles: sample.terrainTiles.filter((tile) => tile.kind === "water").length,
    buildings: sample.buildings.length,
  };
}

function terrainElevationSpread(scene: CityWorldScene): { min: number; max: number; spread: number; dropTileCount: number } {
  const zValues = scene.terrainTiles.map((tile) => tile.position.z ?? 0);
  const min = Math.min(...zValues);
  const max = Math.max(...zValues);
  return {
    min,
    max,
    spread: max - min,
    dropTileCount: scene.terrainTiles.filter((tile) => (tile.visualGrammar?.elevation?.dropDepth ?? 0) > 0).length,
  };
}

function prairieFarmFieldVariants(zones: CityWorldZoneSpec[], scene: CityWorldScene): number[] {
  const variants = new Set<number>();
  for (const tile of scene.terrainTiles) {
    const zone = winningZoneAt(zones, tile.position.x, tile.position.y);
    if (zone?.kind === "farm_field") variants.add(tile.variant);
  }
  return [...variants].sort((first, second) => first - second);
}

function prairieGrassVariantToneOffset(variant: number): number {
  return roundMetric((variant - 2) * 1.2);
}

function openBlockFillCoverage(zones: CityWorldZoneSpec[], scene: CityWorldScene) {
  let openGroundTiles = 0;
  let fillTileCount = 0;
  let waterEdgeFillTiles = 0;
  const fillKinds = new Set<CityWorldZoneKind>();
  const fillVariants = new Set<number>();
  const fillZoneIds = new Set<string>();
  const fillZoneCounts = Object.fromEntries([...E5_FILL_ZONE_KINDS].map((kind) => [kind, 0])) as Record<CityWorldZoneKind, number>;

  for (const zone of zones) {
    if (E5_FILL_ZONE_KINDS.has(zone.kind)) fillZoneCounts[zone.kind] += 1;
  }

  for (const tile of scene.terrainTiles) {
    if (pointInRoadCorridor(tile.position, scene.roadSegments)) continue;
    const zone = winningZoneAt(zones, tile.position.x, tile.position.y);
    if (zone && !E5_FILL_ZONE_KINDS.has(zone.kind)) continue;
    openGroundTiles += 1;
    if (zone && E5_FILL_ZONE_KINDS.has(zone.kind)) {
      fillTileCount += 1;
      fillKinds.add(zone.kind);
      fillVariants.add(tile.variant);
      fillZoneIds.add(zone.id);
      if ((tile.visualGrammar?.terrainContact?.waterEdgeSides?.length ?? 0) > 0) waterEdgeFillTiles += 1;
      expect(fillTileMatchesZone(tile, zone.kind)).toBe(true);
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

function fillTileMatchesZone(tile: CityWorldTerrainTile, kind: CityWorldZoneKind): boolean {
  if (kind === "farm_field") return tile.kind === "grass" && tile.visualGrammar?.terrainComposition === "neighborhood_yard_fabric";
  if (kind === "dry_wash" || kind === "scree") return tile.kind === "plaza" && tile.visualGrammar?.terrainComposition === "quiet_field";
  if (kind === "shore_bank") return tile.kind === "plaza" && tile.visualGrammar?.terrainComposition === "waterfront_edge_strata";
  if (kind === "meadow" || kind === "green_common") return tile.kind === "park" && tile.visualGrammar?.terrainComposition === "park_basin";
  if (kind === "civic_forecourt") return tile.kind === "plaza" && tile.visualGrammar?.terrainComposition === "civic_focus_field";
  if (kind === "plaza_paving") return tile.kind === "plaza" && tile.visualGrammar?.terrainComposition === "commercial_apron_field";
  return false;
}

function winningZoneAt(zones: CityWorldZoneSpec[], x: number, y: number): CityWorldZoneSpec | undefined {
  let match: CityWorldZoneSpec | undefined;
  for (const zone of zones) {
    if (x >= zone.rect.minX && x <= zone.rect.maxX && y >= zone.rect.minY && y <= zone.rect.maxY) match = zone;
  }
  return match;
}

function pointInRoadCorridor(point: { x: number; y: number }, roads: CityWorldRoadSegment[]): boolean {
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
  const effectiveBuildingColors = scene.buildings.filter((building) => !isAttachmentBuilding(building)).map((building) => resolveEffectiveBuildingColors(building));
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

function attachmentReadout(scene: CityWorldScene) {
  const attachments = scene.buildings.filter(isAttachmentBuilding);
  const eligibleParents = scene.buildings.filter(isEligibleAttachmentParent);
  const parentIds = [
    ...new Set(attachments.map((building) => building.visualGrammar?.buildingAttachment?.parentBuildingId).filter((id): id is string => Boolean(id))),
  ].sort();
  const countsByKind = Object.fromEntries(GENERATED_ATTACHMENT_KINDS.map((kind) => [kind, 0]));

  for (const attachment of attachments) {
    const kind = attachment.visualGrammar?.buildingAttachment?.kind;
    if (kind && kind in countsByKind) countsByKind[kind] += 1;
  }

  return {
    attachments,
    attachmentCount: attachments.length,
    eligibleParentCount: eligibleParents.length,
    parentIds,
    parentRate: roundMetric(parentIds.length / Math.max(1, eligibleParents.length)),
    countsByKind,
  };
}

function isAttachmentBuilding(building: CityWorldBuilding): boolean {
  return building.id.startsWith("gen-attachment-") || Boolean(building.visualGrammar?.buildingAttachment);
}

function isEligibleAttachmentParent(building: CityWorldBuilding): boolean {
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

function roundMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
