import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  createVoxelNote,
  createVoxelSticker,
  analyzeCityWorldScene,
  analyzeCityWorldObjectKit,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const anaheimAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/ontario-anchors.json");

describe("CityWorld compiler", () => {
  it("compiles the Riverside scene into all required city layers", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);

    expect(city.type).toBe("cityWorldScene");
    expect(city.terrainTiles.length).toBeGreaterThan(700);
    expect(city.roadSegments.map((road) => road.kind)).toEqual(expect.arrayContaining(["avenue", "street", "driveway", "crosswalk"]));
    expect(city.lots.map((lot) => lot.kind)).toEqual(expect.arrayContaining(["home", "shop", "park", "gym", "apartments", "civic", "waterfront"]));
    expect(city.buildings.map((building) => building.kind)).toEqual(expect.arrayContaining(["home", "shop", "gym", "apartment", "civic"]));
    const propKinds = city.props.map((prop) => prop.kind);
    const actorKinds = city.actors.map((actor) => actor.kind);

    expect(propKinds).toEqual(expect.arrayContaining(["tree", "bush", "water_shimmer"]));
    expect(propKinds).not.toEqual(expect.arrayContaining(["bench", "streetlight", "parked_car", "fountain", "sign", "cloud"]));
    expect(actorKinds).toEqual(["clawd"]);
    expect(actorKinds).not.toEqual(expect.arrayContaining(["car", "walker"]));
  });

  it("exposes deterministic QA camera presets for core and residential-detail screenshots", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const cameraIds = city.cameraPresets.map((camera) => camera.id);
    const desktop = city.cameraPresets.find((camera) => camera.id === "desktop");
    const mobile = city.cameraPresets.find((camera) => camera.id === "mobile");
    const residentialDetail = city.cameraPresets.find((camera) => camera.id === "residential_detail");
    const commerceDetail = city.cameraPresets.find((camera) => camera.id === "commerce_detail");

    expect(cameraIds).toEqual(expect.arrayContaining(["desktop", "mobile", "residential_detail", "commerce_detail"]));
    expect(desktop?.zoom).toBeGreaterThan(1.4);
    expect(mobile?.zoom).toBeLessThan(1);
    expect(residentialDetail?.center).toMatchObject({ x: 13.7, y: 9.3, z: 0 });
    expect(residentialDetail?.zoom).toBeGreaterThan(desktop?.zoom ?? 0);
    expect(commerceDetail?.center).toMatchObject({ x: 29.2, y: 12.1, z: 0 });
    expect(commerceDetail?.zoom).toBeGreaterThan(desktop?.zoom ?? 0);
  });

  it("adds atlas-ready metadata to city world objects", () => {
    const sticker = createVoxelSticker(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      kind: "favorite",
      label: "Start",
    });
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      body: "Remember this spot.",
    });
    const city = compileCityWorldScene(riversideDemoVoxelScene, {
      stickers: [sticker],
      notes: [note],
    });
    const authoredObjects = [
      ...city.terrainTiles.slice(0, 12),
      ...city.roadSegments,
      ...city.lots,
      ...city.buildings,
      ...city.props,
      ...city.actors,
      ...city.pins,
    ];

    for (const object of authoredObjects) {
      expect(object.spriteKey).toMatch(/[a-z]+\./);
      expect(object.paletteKey).toMatch(/[a-z]+\./);
      expect(object.detailLevel).toBeDefined();
    }

    expect(city.buildings.map((building) => building.roofShape)).toEqual(expect.arrayContaining(["gable", "hip", "flat", "sawtooth", "tower"]));
    expect(city.buildings.map((building) => building.facadeStyle)).toEqual(expect.arrayContaining(["cottage", "ranch", "rowhome", "strip_store", "lowrise", "fitness", "civic"]));
    expect(city.buildings.map((building) => building.spriteKey)).toEqual(
      expect.arrayContaining([
        "building.house.cottage.front_gable.v1",
        "building.house.ranch.low_gable.v1",
        "building.house.rowhome.flat_parapet.v1",
        "building.store.strip.three_bay.v1",
        "building.apartment.lowrise.stepped.v1",
      ]),
    );
  });

  it("keeps residential buildings as a controlled variety set instead of cloned homes", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const homes = city.buildings.filter((building) => building.kind === "home");
    const homeStyles = new Set(homes.map((building) => building.facadeStyle));
    const homeRoofShapes = new Set(homes.map((building) => building.roofShape));
    const homeFootprints = new Set(homes.map((building) => `${building.width.toFixed(1)}x${building.depth.toFixed(1)}`));
    const homeRoofColors = new Set(homes.map((building) => building.roofColor));

    expect(homes.length).toBeGreaterThanOrEqual(12);
    expect([...homeStyles]).toEqual(expect.arrayContaining(["cottage", "ranch", "rowhome"]));
    expect([...homeRoofShapes]).toEqual(expect.arrayContaining(["gable", "hip", "flat"]));
    expect(homeFootprints.size).toBeGreaterThanOrEqual(6);
    expect(homeRoofColors.size).toBeGreaterThanOrEqual(5);
    for (const oldLoudRoofColor of ["#d95f45", "#4f92b8", "#6da76f", "#e0bd4e", "#b98352", "#895c9e", "#77b8d5"]) {
      expect(homeRoofColors.has(oldLoudRoofColor)).toBe(false);
    }
    expect(homes.filter((building) => building.spriteKey === "building.house.rowhome.flat_parapet.v1").length).toBeGreaterThanOrEqual(2);
  });

  it("attaches Roads & Roofs visual grammar to the production scene compiler output", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const roadProfiles = new Set(city.roadSegments.map((road) => road.visualGrammar?.roadProfile));
    const lotProfiles = new Set(city.lots.map((lot) => lot.visualGrammar?.lotProfile));
    const terrainProfiles = new Set(city.terrainTiles.map((tile) => tile.visualGrammar?.terrainProfile));
    const materialProfiles = new Set(city.buildings.map((building) => building.visualGrammar?.materialProfile));
    const roofProfiles = new Set(city.buildings.map((building) => building.visualGrammar?.roofProfile));
    const contactProfiles = new Set([
      ...city.roadSegments.map((road) => road.visualGrammar?.contactProfile),
      ...city.lots.map((lot) => lot.visualGrammar?.contactProfile),
      ...city.buildings.map((building) => building.visualGrammar?.contactProfile),
    ]);

    expect([...roadProfiles]).toEqual(expect.arrayContaining(["embedded_asphalt_slab", "driveway_cut", "paver_crosswalk"]));
    expect([...lotProfiles]).toEqual(expect.arrayContaining(["residential_yard_grid", "commercial_forecourt", "landmark_civic_ground", "apartment_court"]));
    expect([...terrainProfiles]).toEqual(expect.arrayContaining(["quiet_socal_grass", "neighborhood_parcel_field", "landmark_civic_ground", "commercial_plaza", "civic_green", "water_edge"]));
    expect([...materialProfiles]).toEqual(expect.arrayContaining(["socal_stucco_warm", "socal_cool_stucco", "socal_stucco_light", "socal_storefront", "socal_lowrise", "civic_glass_stucco"]));
    expect([...roofProfiles]).toEqual(expect.arrayContaining(["terracotta_barrel_tile", "cool_clay_tile", "sage_tile", "flat_parapet_cap", "blue_metal_utility"]));
    expect([...contactProfiles]).toEqual(expect.arrayContaining(["parcel_pad_shadow", "curb_shadow", "landmark_base_shadow"]));
    expect(city.buildings.every((building) => building.visualGrammar?.roofProfile)).toBe(true);
    expect(city.roadSegments.every((road) => road.visualGrammar?.roadProfile)).toBe(true);
    expect(city.buildings.map((building) => building.roofColor)).not.toEqual(expect.arrayContaining(["#e05d45", "#73a7d6"]));
  });

  it("assigns public object-kit prefab and palette metadata to Riverside buildings", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const report = analyzeCityWorldObjectKit(city);
    const prefabFamilies = new Set(city.buildings.map((building) => building.objectKit?.prefabFamily));
    const paletteRoles = new Set(city.buildings.flatMap((building) => building.objectKit?.paletteRoles ?? []));

    expect([...prefabFamilies]).toEqual(
      expect.arrayContaining([
        "civic_landmark",
        "residential_cottage",
        "residential_ranch",
        "residential_rowhome",
        "commerce_strip",
        "lowrise_apartment",
        "service_gym",
      ]),
    );
    expect([...paletteRoles]).toEqual(expect.arrayContaining(["stucco", "terracotta", "glass", "foundation"]));
    expect(city.buildings.every((building) => building.objectKit?.cloneGroupKey)).toBe(true);
    expect(city.buildings.every((building) => building.objectKit?.roofBodySeparationScore !== undefined)).toBe(true);
    expect(report.blockers).toEqual([]);
    expect(report.metrics.prefabCoverageRatio).toBe(1);
    expect(report.metrics.paletteCohesionRatio).toBeGreaterThanOrEqual(0.9);
    expect(report.metrics.roofBodySeparationRatio).toBeGreaterThanOrEqual(0.9);
    expect(report.metrics.clonePressureRatio).toBeLessThanOrEqual(0.2);
    expect(report.metrics.landmarkSignatureScore).toBeGreaterThanOrEqual(0.9);
    expect(report.metrics.terrainMassingCoverageRatio).toBeGreaterThanOrEqual(0.88);
    expect(report.metrics.buildingLotContactRatio).toBeGreaterThanOrEqual(0.98);
    expect(report.weakestPrefabFamily).not.toBe("none");
  });

  it("attaches terrain and parcel composition grammar without changing playable boundaries", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const shell = compileCountyShellCityWorldScene({
      countySlug: "orange-ca",
      countyName: "Orange County",
      stateCode: "CA",
      coverage: {
        countySlug: "orange-ca",
        coverageTier: "L1_COUNTY_SHELL",
        coverageLabel: "County shell",
        coverageMessage: "Orange County is indexed, but not playable yet.",
        playable: false,
      },
    });
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const draft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });

    const terrainCompositions = new Set(city.terrainTiles.map((tile) => tile.visualGrammar?.terrainComposition));
    const terrainElevations = new Set(city.terrainTiles.map((tile) => tile.visualGrammar?.terrainElevation));
    const parcelCompositions = new Set(city.lots.map((lot) => lot.visualGrammar?.parcelComposition));
    const parcelElevations = new Set(city.lots.map((lot) => lot.visualGrammar?.parcelElevation));

    expect([...terrainCompositions]).toEqual(
      expect.arrayContaining([
        "quiet_field",
        "neighborhood_yard_fabric",
        "civic_focus_field",
        "commercial_apron_field",
        "park_basin",
        "waterfront_edge_strata",
      ]),
    );
    expect([...parcelCompositions]).toEqual(
      expect.arrayContaining([
        "home_yard_grid",
        "commercial_apron",
        "civic_landmark_plinth",
        "apartment_court_grid",
        "park_path_basin",
        "waterfront_bank",
      ]),
    );
    expect([...terrainElevations]).toEqual(
      expect.arrayContaining([
        "flat_field",
        "raised_parcel_shelf",
        "civic_plinth_shelf",
        "park_basin_shelf",
        "water_edge_cut",
      ]),
    );
    expect([...parcelElevations]).toEqual(
      expect.arrayContaining([
        "raised_home_shelf",
        "commercial_slab_lip",
        "civic_plinth_stack",
        "apartment_court_lip",
        "park_basin_lip",
        "waterfront_bank_cut",
      ]),
    );
    expect(city.terrainTiles.every((tile) => tile.visualGrammar?.terrainComposition)).toBe(true);
    expect(city.terrainTiles.every((tile) => tile.visualGrammar?.terrainElevation)).toBe(true);
    expect(city.lots.every((lot) => lot.visualGrammar?.parcelComposition)).toBe(true);
    expect(city.lots.every((lot) => lot.visualGrammar?.parcelElevation)).toBe(true);
    expect(new Set(shell.terrainTiles.map((tile) => tile.visualGrammar?.terrainComposition))).toEqual(new Set(["shell_boundary"]));
    expect(new Set(shell.terrainTiles.map((tile) => tile.visualGrammar?.terrainElevation))).toEqual(new Set(["shell_flat"]));
    expect(new Set(draft.terrainTiles.map((tile) => tile.visualGrammar?.terrainComposition))).toEqual(new Set(["hidden_draft_field"]));
    expect(new Set(draft.terrainTiles.map((tile) => tile.visualGrammar?.terrainElevation))).toEqual(new Set(["hidden_draft_shelf"]));
    expect(new Set(draft.lots.map((lot) => lot.visualGrammar?.parcelComposition))).toEqual(new Set(["hidden_draft_anchor_pad"]));
    expect(new Set(draft.lots.map((lot) => lot.visualGrammar?.parcelElevation))).toEqual(new Set(["hidden_anchor_shelf"]));
    expect(draft.coverage.playable).toBe(false);
    expect(draft.actors).toEqual([]);
    expect(draft.pins).toEqual([]);
  });

  it("attaches terrain elevation and chunk-edge grammar without exposing hidden drafts", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const shell = compileCountyShellCityWorldScene({
      countySlug: "orange-ca",
      countyName: "Orange County",
      stateCode: "CA",
      coverage: {
        countySlug: "orange-ca",
        coverageTier: "L1_COUNTY_SHELL",
        coverageLabel: "County shell",
        coverageMessage: "Orange County is indexed, but not playable yet.",
        playable: false,
      },
    });
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const draft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });

    const terrainElevations = new Set(city.terrainTiles.map((tile) => tile.visualGrammar?.terrainElevation));
    const chunkEdges = new Set(city.terrainTiles.map((tile) => tile.visualGrammar?.chunkEdge));
    const terrainChunkMassings = new Set(city.terrainTiles.map((tile) => tile.visualGrammar?.terrainChunkMassing));
    const parcelElevations = new Set(city.lots.map((lot) => lot.visualGrammar?.parcelElevation));

    expect([...terrainElevations]).toEqual(
      expect.arrayContaining([
        "flat_field",
        "raised_parcel_shelf",
        "civic_plinth_shelf",
        "commercial_slab_field",
        "park_basin_shelf",
        "water_edge_cut",
      ]),
    );
    expect([...chunkEdges]).toEqual(
      expect.arrayContaining(["none", "world_edge", "parcel_cluster_edge", "waterfront_bank_edge", "park_basin_edge"]),
    );
    expect([...terrainChunkMassings]).toEqual(
      expect.arrayContaining([
        "none",
        "outer_world_edge_mass",
        "civic_plinth_mass",
        "residential_shelf_mass",
        "commercial_slab_mass",
        "park_basin_cut_mass",
        "waterfront_bank_cut_mass",
      ]),
    );
    expect([...parcelElevations]).toEqual(
      expect.arrayContaining([
        "raised_home_shelf",
        "commercial_slab_lip",
        "civic_plinth_stack",
        "apartment_court_lip",
        "park_basin_lip",
        "waterfront_bank_cut",
      ]),
    );
    expect(city.terrainTiles.every((tile) => tile.visualGrammar?.terrainElevation)).toBe(true);
    expect(city.terrainTiles.every((tile) => tile.visualGrammar?.chunkEdge)).toBe(true);
    expect(city.terrainTiles.every((tile) => tile.visualGrammar?.terrainChunkMassing)).toBe(true);
    expect(city.lots.every((lot) => lot.visualGrammar?.parcelElevation)).toBe(true);
    expect(new Set(shell.terrainTiles.map((tile) => tile.visualGrammar?.terrainElevation))).toEqual(new Set(["shell_flat"]));
    expect(new Set(shell.terrainTiles.map((tile) => tile.visualGrammar?.chunkEdge))).toEqual(new Set(["world_edge", "none"]));
    expect(new Set(shell.terrainTiles.map((tile) => tile.visualGrammar?.terrainChunkMassing))).toEqual(new Set(["shell_boundary_mass", "none"]));
    expect(new Set(draft.terrainTiles.map((tile) => tile.visualGrammar?.terrainElevation))).toEqual(new Set(["hidden_draft_shelf"]));
    expect(new Set(draft.terrainTiles.map((tile) => tile.visualGrammar?.chunkEdge))).toEqual(new Set(["hidden_draft_boundary", "none"]));
    expect(new Set(draft.terrainTiles.map((tile) => tile.visualGrammar?.terrainChunkMassing))).toEqual(new Set(["hidden_draft_mass", "none"]));
    expect(new Set(draft.lots.map((lot) => lot.visualGrammar?.parcelElevation))).toEqual(new Set(["hidden_anchor_shelf"]));
    expect(draft.coverage.playable).toBe(false);
    expect(draft.actors).toEqual([]);
    expect(draft.pins).toEqual([]);
  });

  it("reports structural engine diagnostics for the playable Riverside scene", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const report = analyzeCityWorldScene(city, "playable");

    expect(report.type).toBe("cityWorldEngineDiagnostics");
    expect(report.update).toBe("prealpha-0.6f-engine-diagnostics");
    expect(report.hardBlockers).toEqual([]);
    expect(report.metrics.terrainMassingCoverageRatio).toBeGreaterThanOrEqual(0.88);
    expect(report.metrics.terrainAuthoredCoverageRatio).toBeGreaterThan(0.2);
    expect(report.metrics.emptyBoardRatio).toBeLessThanOrEqual(0.07);
    expect(report.metrics.buildingLotContactRatio).toBeGreaterThanOrEqual(0.98);
    expect(report.metrics.lotRoadContactRatio).toBeGreaterThanOrEqual(0.78);
    expect(report.metrics.objectFamilyCoverageRatio).toBe(1);
    expect(report.metrics.homeVariantCount).toBeGreaterThanOrEqual(8);
    expect(report.metrics.homeClonePressure).toBeLessThanOrEqual(0.2);
    expect(report.metrics.faceOrientationCoverageRatio).toBeGreaterThanOrEqual(0.9);
    expect(report.metrics.roofSideSeparationRatio).toBeGreaterThanOrEqual(0.85);
    expect(report.metrics.facadeContrastCoverageRatio).toBeGreaterThanOrEqual(0.75);
    expect(report.metrics.objectSignatureCoverageRatio).toBeGreaterThanOrEqual(0.7);
    expect(report.metrics.weakestObjectFamily).not.toBe("none");
    expect(report.metrics.civicVenueObjectKitScore).toBeGreaterThanOrEqual(0.9);
    expect(report.metrics.weakestCivicVenueStressCell).toBe("eastvale-core-civic-landmark");
    expect(report.metrics.civicVenueStressCells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "eastvale-core-civic-landmark",
          kind: "public_civic_landmark",
          objectFamily: "civic_landmark",
          buildingCount: 1,
        }),
      ]),
    );
    expect(report.metrics.firstViewportCompositionScore).toBeGreaterThanOrEqual(0.77);
    expect(report.metrics.chunkEdgeReadabilityFloorScore).toBeGreaterThanOrEqual(0.74);
    expect(Object.keys(report.metrics.viewportComposition)).toEqual(expect.arrayContaining(["desktop", "mobile", "residential_detail"]));
    expect(report.metrics.viewportComposition.desktop?.score).toBeGreaterThanOrEqual(0.84);
    expect(report.metrics.viewportComposition.desktop?.objectFamilyCount).toBeGreaterThanOrEqual(4);
    expect(report.metrics.viewportComposition.desktop?.chunkEdgeRatio).toBeGreaterThanOrEqual(0.69);
    expect(report.metrics.viewportComposition.desktop?.chunkEdgeReadabilityScore).toBeGreaterThanOrEqual(0.7);
    expect(report.metrics.viewportComposition.mobile?.score).toBeGreaterThanOrEqual(0.77);
    expect(report.metrics.viewportComposition.mobile?.objectFamilyCount).toBeGreaterThanOrEqual(5);
    expect(report.metrics.viewportComposition.mobile?.chunkEdgeRatio).toBeGreaterThanOrEqual(0.64);
    expect(report.metrics.viewportComposition.mobile?.terrainElevationVisibleRatio).toBeGreaterThanOrEqual(0.9);
    expect(report.metrics.viewportComposition.mobile?.chunkEdgeReadabilityScore).toBeGreaterThanOrEqual(0.76);
    expect(report.metrics.viewportComposition.residential_detail?.objectFamilyCount).toBeGreaterThanOrEqual(1);
    expect(report.metrics.viewportComposition.residential_detail?.chunkEdgeReadabilityScore).toBeGreaterThanOrEqual(0.74);
    expect(report.distributions.objectFamilies).toMatchObject({
      residential_kit: expect.any(Number),
      commerce_strip: expect.any(Number),
      civic_landmark: expect.any(Number),
      lowrise_cluster: expect.any(Number),
      service_block: expect.any(Number),
    });
  });

  it("keeps shell and hidden-draft diagnostics honest without playable leakage", () => {
    const shell = compileCountyShellCityWorldScene({
      countySlug: "orange-ca",
      countyName: "Orange County",
      stateCode: "CA",
      coverage: {
        countySlug: "orange-ca",
        coverageTier: "L1_COUNTY_SHELL",
        coverageLabel: "County shell",
        coverageMessage: "Orange County is indexed, but not playable yet.",
        playable: false,
      },
    });
    const anaheimAnchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const ontarioAnchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath);
    const anaheim = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimAnchorPack });
    const ontario = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: ontarioAnchorPack });

    const shellReport = analyzeCityWorldScene(shell, "shell");
    const anaheimReport = analyzeCityWorldScene(anaheim, "hidden_draft");
    const ontarioReport = analyzeCityWorldScene(ontario, "hidden_draft");

    expect(shellReport.hardBlockers).toEqual([]);
    expect(shellReport.counts.places).toBe(0);
    expect(shellReport.metrics.primitiveFallbackEligibleRatio).toBe(1);
    for (const report of [anaheimReport, ontarioReport]) {
      expect(report.hardBlockers).toEqual([]);
      expect(report.playable).toBe(false);
      expect(report.metrics.noLabelPrimaryAnchorCount).toBeGreaterThanOrEqual(2);
      expect(report.metrics.noLabelTargetFamilyCoverageRatio).toBe(1);
      expect(report.metrics.noLabelAnchorSeparationScore).toBeGreaterThanOrEqual(0.82);
      expect(report.metrics.noLabelRecognitionProxyScore).toBeGreaterThanOrEqual(0.93);
      expect(report.metrics.objectFamilyCoverageRatio).toBeGreaterThanOrEqual(0.75);
      expect(report.metrics.hiddenAnchorContrastScore).toBeGreaterThanOrEqual(0.68);
      expect(report.metrics.weakestHiddenAnchor).not.toBe("none");
      expect(report.counts.actors).toBe(0);
      expect(report.counts.pins).toBe(0);
    }
    expect(anaheimReport.metrics.civicVenueObjectKitScore).toBeGreaterThanOrEqual(0.9);
    expect(anaheimReport.metrics.civicVenueStressCells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "anaheim-convention-center-venue-anchor",
          kind: "hidden_venue_anchor",
          objectFamily: "venue_anchor",
          buildingCount: 5,
          noLabelReadinessScore: 1,
        }),
        expect.objectContaining({
          id: "artic-transit-anchor",
          kind: "hidden_venue_anchor",
          objectFamily: "transit_anchor",
          buildingCount: 4,
          noLabelReadinessScore: 1,
        }),
        expect.objectContaining({
          id: "angel-stadium-venue-anchor",
          kind: "hidden_venue_anchor",
          objectFamily: "venue_anchor",
          buildingCount: 4,
        }),
      ]),
    );
    expect(ontarioReport.metrics.civicVenueStressCells).toEqual([]);
  });

  it("attaches object-authorship grammar to public Riverside buildings", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const objectFamilies = new Set(city.buildings.map((building) => building.visualGrammar?.objectFamily));
    const clusterRoles = new Set(city.buildings.map((building) => building.visualGrammar?.clusterRole));
    const civic = city.buildings.find((building) => building.id === "building-civic");
    const rowhome = city.buildings.find((building) => building.id === "building-rowhome-west-a");
    const stripStore = city.buildings.find((building) => building.id === "building-plaza-strip");
    const gym = city.buildings.find((building) => building.id === "building-gym");
    const apartments = city.buildings.find((building) => building.id === "building-apartments-a");

    expect([...objectFamilies]).toEqual(expect.arrayContaining(["residential_kit", "commerce_strip", "civic_landmark", "lowrise_cluster", "service_block"]));
    expect([...clusterRoles]).toEqual(expect.arrayContaining(["anchor", "support", "fabric", "edge"]));
    expect(civic?.visualGrammar).toMatchObject({
      objectFamily: "civic_landmark",
      clusterRole: "anchor",
      noLabelPriority: "supporting",
    });
    expect(rowhome?.visualGrammar).toMatchObject({ objectFamily: "residential_kit", clusterRole: "edge" });
    expect(stripStore?.visualGrammar).toMatchObject({ objectFamily: "commerce_strip", clusterRole: "edge" });
    expect(stripStore?.objectKit).toMatchObject({
      prefabFamily: "commerce_strip",
      commerceGeometry: {
        bayCount: 7,
        signMountCount: 5,
        focusTarget: "plaza_row",
      },
    });
    expect(stripStore?.objectKit?.signatureTags).toEqual(expect.arrayContaining(["deep-storefront-apron", "continuous-parapet"]));
    expect(gym?.visualGrammar).toMatchObject({ objectFamily: "service_block", clusterRole: "support" });
    expect(apartments?.visualGrammar).toMatchObject({ objectFamily: "lowrise_cluster", clusterRole: "support" });
    expect(city.buildings.every((building) => building.visualGrammar?.objectFamily)).toBe(true);
  });

  it("gives every clickable place a valid city anchor", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);

    expect(city.places.map((place) => place.label)).toEqual(expect.arrayContaining(["Eastvale Core", "Gym", "Apartments", "Community Park"]));
    for (const place of city.places) {
      expect(Number.isFinite(place.anchor.x)).toBe(true);
      expect(Number.isFinite(place.anchor.y)).toBe(true);
      expect(place.hitRadius).toBeGreaterThan(1);
    }
  });

  it("places session stickers and notes as pins and rejects missing references", () => {
    const sticker = createVoxelSticker(riversideDemoVoxelScene, {
      placeId: "place-eastvale-gym",
      kind: "favorite",
      label: "Gym check",
    });
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-eastvale-gym",
      stickerId: sticker.id,
      body: "Try this stop.",
    });
    const city = compileCityWorldScene(riversideDemoVoxelScene, {
      selectedPlaceId: "place-eastvale-gym",
      stickers: [sticker],
      notes: [note],
    });

    expect(city.pins.map((pin) => pin.kind)).toEqual(expect.arrayContaining(["favorite", "note"]));
    expect(city.hudDefaults.selectedPlaceId).toBe("place-eastvale-gym");
    expect(() =>
      compileCityWorldScene(riversideDemoVoxelScene, {
        stickers: [{ ...sticker, id: "bad-sticker", placeId: "missing-place" }],
      }),
    ).toThrow(/missing place/);
  });

  it("compiles an honest county shell scene without fake places or actors", () => {
    const shell = compileCountyShellCityWorldScene({
      countySlug: "orange-ca",
      countyName: "Orange County",
      stateCode: "CA",
      coverage: {
        countySlug: "orange-ca",
        coverageTier: "L1_COUNTY_SHELL",
        coverageLabel: "County shell",
        coverageMessage: "Orange County is indexed, but not playable yet.",
        playable: false,
      },
    });

    expect(shell.type).toBe("cityWorldScene");
    expect(shell.id).toBe("city-world-shell-orange-ca");
    expect(shell.coverage).toMatchObject({ coverageTier: "L1_COUNTY_SHELL", playable: false });
    expect(shell.region).toMatchObject({ county: "Orange County", district: "Coverage Shell" });
    expect(shell.terrainTiles.length).toBeGreaterThan(200);
    expect(shell.cameraPresets.map((camera) => camera.id)).toEqual(["desktop", "mobile"]);
    expect(shell.roadSegments).toEqual([]);
    expect(shell.lots).toEqual([]);
    expect(shell.buildings).toEqual([]);
    expect(shell.places).toEqual([]);
    expect(shell.pins).toEqual([]);
    expect(shell.actors).toEqual([]);
  });

  it("compiles a non-public Anaheim draft scene from source-noted anchors without playable claims", () => {
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const draft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });

    expect(draft.id).toBe("city-world-draft-orange-ca-anaheim-candidate");
    expect(draft.coverage).toMatchObject({
      countySlug: "orange-ca",
      coverageTier: "L1_COUNTY_SHELL",
      playable: false,
    });
    expect(draft.region).toMatchObject({ county: "Orange County", district: "anaheim-candidate" });
    expect(draft.cameraPresets.map((camera) => camera.id)).toEqual(["desktop", "mobile", "residential_detail"]);
    expect(draft.terrainTiles.length).toBeGreaterThan(800);
    expect(draft.roadSegments.length).toBeGreaterThanOrEqual(4);
    expect(draft.lots.length).toBe(anchorPack.placeAnchors.filter((anchor) => anchor.anchorRole !== "district_identity").length);
    expect(draft.places.map((place) => place.label)).toEqual(
      expect.arrayContaining(["Platinum Triangle mixed-use area", "ARTIC transit center", "Angel Stadium of Anaheim"]),
    );
    expect(draft.buildings.map((building) => building.kind)).toEqual(expect.arrayContaining(["home", "civic", "shop", "apartment", "gym"]));
    expect(draft.buildings.map((building) => building.facadeStyle)).toEqual(
      expect.arrayContaining(["rowhome", "lowrise", "strip_store", "civic", "fitness"]),
    );
    expect(draft.buildings.map((building) => building.roofShape)).toEqual(expect.arrayContaining(["flat", "sawtooth", "tower", "hip"]));
    expect(draft.buildings.length).toBeGreaterThanOrEqual(17);
    expect(draft.roadSegments.map((road) => road.id)).toEqual(expect.arrayContaining(["draft-drive-convention", "draft-drive-stadium"]));
    expect(draft.buildings.map((building) => building.id)).toEqual(
      expect.arrayContaining([
        "draft-building-platinum-triangle-area-lowrise-courtyard",
        "draft-building-anaheim-convention-center-exhibit-hall-west",
        "draft-building-anaheim-convention-center-glass-arcade-front",
        "draft-building-anaheim-convention-center-entry-spine",
        "draft-building-artic-transit-center-terminal-shed",
        "draft-building-artic-transit-center-platform-edge",
        "draft-building-artic-transit-center-clock-tower",
        "draft-building-angel-stadium-venue-bowl-west",
        "draft-building-angel-stadium-homeplate-gate",
        "draft-building-downtown-anaheim-community-center-community-hall",
      ]),
    );
    expect(draft.buildings.find((building) => building.id === "draft-building-artic-transit-center-terminal-shed")).toMatchObject({
      kind: "gym",
      facadeStyle: "fitness",
      roofShape: "sawtooth",
      roofColor: "#86aeb8",
      width: 7.15,
      height: 1.95,
    });
    expect(draft.buildings.find((building) => building.id === "draft-building-artic-transit-center-platform-edge")?.visualGrammar).toMatchObject({
      objectFamily: "transit_anchor",
      clusterRole: "anchor",
      noLabelPriority: "primary_anchor",
    });
    expect(draft.buildings.find((building) => building.id === "draft-building-artic-transit-center-clock-tower")).toMatchObject({
      roofShape: "tower",
      roofColor: "#86aeb8",
    });
    const conventionEntrySpine = draft.buildings.find((building) => building.id === "draft-building-anaheim-convention-center-entry-spine");
    expect(conventionEntrySpine).toMatchObject({
      facadeStyle: "civic",
      roofShape: "hip",
      detailLevel: "high",
    });
    expect(conventionEntrySpine?.spriteKey).not.toBe("building.venue.anaheim_convention_center.v1");
    expect(conventionEntrySpine?.paletteKey).not.toBe("building.venue.anaheim_convention_center.v1");
    expect(conventionEntrySpine?.spriteKey).toMatch(/^building\.civic\./);
    expect(draft.buildings.find((building) => building.id === "draft-building-angel-stadium-venue-bowl-west")).toMatchObject({
      width: 4.9,
      height: 0.84,
      roofShape: "flat",
      roofColor: "#9da776",
    });
    expect(draft.buildings.find((building) => building.id === "draft-building-anaheim-convention-center-exhibit-hall-west")?.visualGrammar).toMatchObject({
      objectFamily: "venue_anchor",
      clusterRole: "anchor",
      noLabelPriority: "primary_anchor",
    });
    expect(draft.buildings.find((building) => building.id === "draft-building-artic-transit-center-terminal-shed")?.visualGrammar).toMatchObject({
      objectFamily: "transit_anchor",
      clusterRole: "anchor",
      noLabelPriority: "primary_anchor",
    });
    expect(draft.buildings.find((building) => building.id === "draft-building-angel-stadium-venue-bowl-west")?.visualGrammar).toMatchObject({
      objectFamily: "venue_anchor",
      clusterRole: "anchor",
      noLabelPriority: "primary_anchor",
    });
    expect(draft.buildings.find((building) => building.id === "draft-building-platinum-triangle-area-lowrise-courtyard")?.visualGrammar).toMatchObject({
      objectFamily: "lowrise_cluster",
      noLabelPriority: "primary_anchor",
    });
    expect(draft.actors).toEqual([]);
    expect(draft.pins).toEqual([]);
    expect(draft.hudDefaults.selectedPlaceId).toBe("");
  });

  it("compiles a distinct non-public Ontario draft scene instead of cloning Anaheim grammar", () => {
    const anaheimAnchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const ontarioAnchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath);
    const anaheimDraft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimAnchorPack });
    const ontarioDraft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: ontarioAnchorPack });

    expect(ontarioDraft.id).toBe("city-world-draft-san-bernardino-ca-ontario-candidate");
    expect(ontarioDraft.coverage).toMatchObject({
      countySlug: "san-bernardino-ca",
      coverageTier: "L1_COUNTY_SHELL",
      playable: false,
    });
    expect(ontarioDraft.region).toMatchObject({ county: "San Bernardino County", district: "ontario-candidate" });
    expect(ontarioDraft.hudDefaults).toMatchObject({
      locationLabel: "San Bernardino County",
      districtLabel: "Ontario candidate draft",
      selectedPlaceId: "",
    });
    expect(ontarioDraft.cameraPresets.map((camera) => camera.id)).toEqual(["desktop", "mobile", "residential_detail"]);
    expect(ontarioDraft.terrainTiles.length).toBeGreaterThan(800);
    expect(ontarioDraft.lots.length).toBe(ontarioAnchorPack.placeAnchors.filter((anchor) => anchor.anchorRole !== "district_identity").length);
    expect(ontarioDraft.places.map((place) => place.label)).toEqual(
      expect.arrayContaining(["Ontario Mills commercial anchor", "Ontario International Airport", "Ontario civic center core"]),
    );
    expect(ontarioDraft.places.every((place) => place.districtId === "ontario-candidate")).toBe(true);
    expect(ontarioDraft.buildings.length).toBeGreaterThanOrEqual(14);
    expect(ontarioDraft.buildings.length).not.toBe(anaheimDraft.buildings.length);
    expect(ontarioDraft.roadSegments.length).not.toBe(anaheimDraft.roadSegments.length);
    expect(ontarioDraft.buildings.map((building) => building.kind)).toEqual(expect.arrayContaining(["home", "shop", "apartment", "civic"]));
    expect(ontarioDraft.buildings.map((building) => building.facadeStyle)).toEqual(
      expect.arrayContaining(["rowhome", "ranch", "lowrise", "strip_store", "storefront", "civic"]),
    );
    expect(ontarioDraft.buildings.map((building) => building.roofShape)).toEqual(expect.arrayContaining(["flat", "hip", "gable", "sawtooth", "tower"]));
    expect(ontarioDraft.roadSegments.map((road) => road.id)).toEqual(
      expect.arrayContaining(["draft-road-airport-edge", "draft-road-ontario-commerce-spine", "draft-drive-airport", "draft-drive-mills"]),
    );
    expect(ontarioDraft.roadSegments.map((road) => road.id)).not.toEqual(expect.arrayContaining(["draft-drive-convention", "draft-drive-stadium"]));
    expect(ontarioDraft.buildings.map((building) => building.id)).toEqual(
      expect.arrayContaining([
        "draft-building-ontario-inland-residential-variety-rowhome-street",
        "draft-building-ontario-mills-commercial-anchor-retail-hall-west",
        "draft-building-ontario-international-airport-terminal-hall",
        "draft-building-ontario-international-airport-control-tower",
        "draft-building-ontario-civic-center-core-civic-hall",
        "draft-building-ontario-downtown-service-core-service-row",
      ]),
    );
    expect(ontarioDraft.buildings.map((building) => building.id)).not.toEqual(
      expect.arrayContaining(["draft-building-anaheim-convention-center-entry-spine", "draft-building-artic-transit-center-terminal-shed"]),
    );
    expect(ontarioDraft.buildings.find((building) => building.id === "draft-building-ontario-international-airport-terminal-hall")?.visualGrammar).toMatchObject({
      objectFamily: "transit_anchor",
      clusterRole: "anchor",
      noLabelPriority: "primary_anchor",
    });
    expect(ontarioDraft.buildings.find((building) => building.id === "draft-building-ontario-mills-commercial-anchor-retail-hall-west")?.visualGrammar).toMatchObject({
      objectFamily: "commerce_strip",
      noLabelPriority: "primary_anchor",
    });
    expect(ontarioDraft.actors).toEqual([]);
    expect(ontarioDraft.pins).toEqual([]);
    expect(ontarioDraft.props).toEqual([]);
  });
});
