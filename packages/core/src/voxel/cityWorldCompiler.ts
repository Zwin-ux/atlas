import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldBounds,
  CityWorldLot,
  CityWorldPin,
  CityWorldPlace,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldSessionState,
  CityWorldCoverage,
  CityWorldTerrainKind,
  CityWorldTerrainTile,
  CityWorldVisualGrammar,
} from "./cityWorldTypes.js";
import type { DistrictPlaceAnchor, DistrictPlaceAnchorPack } from "../world/index.js";
import type { WorldPlaceCategory } from "../world/types.js";
import type { VoxelPlace, VoxelScene } from "./types.js";
import { validateVoxelWorld } from "./mapSession.js";
import { assignCityWorldObjectKit } from "./cityWorldObjectKit.js";

const CITY_BOUNDS = { minX: 0, minY: 0, maxX: 42, maxY: 30 };
const SHELL_BOUNDS = { minX: 0, minY: 0, maxX: 18, maxY: 14 };
const DRAFT_DISTRICT_BOUNDS = { minX: 0, minY: 0, maxX: 34, maxY: 24 };

const PLACE_ANCHORS: Record<string, CityWorldPoint> = {
  "place-eastvale-core": { x: 21, y: 11, z: 0 },
  "place-neighborhood-blocks": { x: 11, y: 10, z: 0 },
  "place-plaza-row": { x: 28, y: 13, z: 0 },
  "place-community-park": { x: 18, y: 20, z: 0 },
  "place-eastvale-gym": { x: 31, y: 15, z: 0 },
  "place-eastvale-apartments": { x: 32, y: 21, z: 0 },
  "place-norco-route": { x: 6, y: 22, z: 0 },
};

export function compileCityWorldScene(scene: VoxelScene, session: CityWorldSessionState = {}): CityWorldScene {
  const world = validateVoxelWorld(scene);
  const selectedDistrictId = session.selectedDistrictId ?? world.selectedDistrictId;
  const selectedDistrict = world.districts.find((district) => district.id === selectedDistrictId) ?? world.districts[0];
  const districtLabel = selectedDistrict?.label ?? "Eastvale";
  const places = compilePlaces(world.places);
  const selectedPlaceId = session.selectedPlaceId ?? places[0]?.id ?? "";
  const stickers = [...(world.stickers ?? []), ...(session.stickers ?? [])];
  const notes = [...(world.notes ?? []), ...(session.notes ?? [])];

  return {
    type: "cityWorldScene",
    id: `city-world-${scene.county.slug}-eastvale-alpha`,
    sourceSceneId: scene.id,
    label: "Eastvale City Map",
    region: {
      country: "United States",
      state: scene.county.state,
      county: scene.county.name,
      district: districtLabel,
    },
    bounds: CITY_BOUNDS,
    cameraPresets: [
      {
        id: "desktop",
        center: { x: 22.6, y: 13.3, z: 0 },
        zoom: 1.46,
        minZoom: 0.72,
        maxZoom: 1.8,
      },
      {
        id: "mobile",
        center: { x: 22.5, y: 14.6, z: 0 },
        zoom: 0.92,
        minZoom: 0.52,
        maxZoom: 1.55,
      },
      {
        id: "residential_detail",
        center: { x: 13.7, y: 9.3, z: 0 },
        zoom: 1.74,
        minZoom: 0.72,
        maxZoom: 1.92,
      },
      {
        id: "commerce_detail",
        center: { x: 29.2, y: 12.1, z: 0 },
        zoom: 1.62,
        minZoom: 0.72,
        maxZoom: 1.95,
      },
    ],
    terrainTiles: createTerrainTiles(),
    roadSegments: createRoadSegments(),
    lots: createLots(),
    buildings: createBuildings(),
    props: createProps(),
    places,
    pins: createPins(places, stickers, notes),
    actors: createActors(scene),
    ambient: {
      ...world.ambient,
      clouds: 0,
      waterShimmer: 0.72,
    },
    hudDefaults: {
      locationLabel: scene.county.name,
      districtLabel,
      selectedPlaceId,
    },
  };
}

export type CountyShellCityWorldInput = {
  countySlug: string;
  countyName: string;
  stateCode: string;
  coverage: CityWorldCoverage;
};

export function compileCountyShellCityWorldScene(input: CountyShellCityWorldInput): CityWorldScene {
  return {
    type: "cityWorldScene",
    id: `city-world-shell-${input.countySlug}`,
    sourceSceneId: `county-shell-${input.countySlug}`,
    label: `${input.countyName} Coverage Shell`,
    coverage: input.coverage,
    region: {
      country: "United States",
      state: input.stateCode,
      county: input.countyName,
      district: "Coverage Shell",
    },
    bounds: SHELL_BOUNDS,
    cameraPresets: [
      {
        id: "desktop",
        center: { x: 9, y: 7, z: 0 },
        zoom: 1.24,
        minZoom: 0.72,
        maxZoom: 1.55,
      },
      {
        id: "mobile",
        center: { x: 9, y: 7, z: 0 },
        zoom: 0.86,
        minZoom: 0.52,
        maxZoom: 1.3,
      },
    ],
    terrainTiles: createShellTerrainTiles(),
    roadSegments: [],
    lots: [],
    buildings: [],
    props: [],
    places: [],
    pins: [],
    actors: [],
    ambient: {
      timeOfDay: "morning",
      activity: "calm",
      traffic: 0,
      residents: 0,
      clouds: 0,
      waterShimmer: 0,
    },
    hudDefaults: {
      locationLabel: input.countyName,
      districtLabel: "Coverage Shell",
      selectedPlaceId: "",
    },
  };
}

export type DistrictPlaceAnchorDraftCityWorldInput = {
  anchorPack: DistrictPlaceAnchorPack;
};

export function compileDistrictPlaceAnchorDraftCityWorldScene(input: DistrictPlaceAnchorDraftCityWorldInput): CityWorldScene {
  const { anchorPack } = input;
  const anchors = anchorPack.placeAnchors.filter((anchor) => anchor.anchorRole !== "district_identity");
  const profile = createDraftDistrictProfile(anchorPack);
  const anchorPositions = createDraftAnchorPositions(anchors, profile);

  return {
    type: "cityWorldScene",
    id: `city-world-draft-${anchorPack.countySlug}-${anchorPack.districtSlug}`,
    sourceSceneId: `district-anchor-draft-${anchorPack.countySlug}-${anchorPack.districtSlug}`,
    label: `${anchorPack.districtSlug} Draft Scene`,
    coverage: {
      countySlug: anchorPack.countySlug,
      coverageTier: "L1_COUNTY_SHELL",
      coverageLabel: "Non-public draft",
      coverageMessage: "Source-noted anchors exist, but this district is not playable or public-quality yet.",
      playable: false,
    },
    region: {
      country: "United States",
      state: anchorPack.stateCode,
      county: profile.countyLabel,
      district: anchorPack.districtSlug,
    },
    bounds: DRAFT_DISTRICT_BOUNDS,
    cameraPresets: [
      {
        id: "desktop",
        center: { x: 17, y: 12, z: 0 },
        zoom: 1.32,
        minZoom: 0.72,
        maxZoom: 1.72,
      },
      {
        id: "mobile",
        center: { x: 17, y: 13.4, z: 0 },
        zoom: 0.88,
        minZoom: 0.52,
        maxZoom: 1.35,
      },
      {
        id: "residential_detail",
        center: anchorPositions.get(profile.detailCameraAnchorId) ?? { x: 12, y: 9, z: 0 },
        zoom: 1.6,
        minZoom: 0.72,
        maxZoom: 1.85,
      },
    ],
    terrainTiles: createDraftDistrictTerrainTiles(profile),
    roadSegments: createDraftDistrictRoadSegments(profile),
    lots: createDraftDistrictLots(anchors, anchorPositions),
    buildings: createDraftDistrictBuildings(anchors, anchorPositions),
    props: [],
    places: createDraftDistrictPlaces(anchors, anchorPositions, anchorPack.districtSlug),
    pins: [],
    actors: [],
    ambient: {
      timeOfDay: "morning",
      activity: "calm",
      traffic: 0,
      residents: 0,
      clouds: 0,
      waterShimmer: 0,
    },
    hudDefaults: {
      locationLabel: profile.countyLabel,
      districtLabel: profile.districtLabel,
      selectedPlaceId: "",
    },
  };
}

function compilePlaces(places: VoxelPlace[]): CityWorldPlace[] {
  return places.map((place, index) => ({
    id: place.id,
    label: place.label,
    kind: place.kind,
    districtId: place.districtId,
    nodeId: place.nodeId,
    anchor: PLACE_ANCHORS[place.id] ?? { x: 12 + index * 3, y: 12 + index, z: 0 },
    hitRadius: place.kind === "park" ? 3.8 : 2.8,
    description: place.description,
    activity: place.activity,
    labelPriority: index < 6 ? 10 - index : 3,
  }));
}

type DraftDistrictTerrainStyle = "resort-venue" | "inland-logistics";

type DraftDistrictProfile = {
  countyLabel: string;
  districtLabel: string;
  detailCameraAnchorId: string;
  terrainStyle: DraftDistrictTerrainStyle;
  preferredPositions: Record<string, CityWorldPoint>;
  roadSegments: CityWorldRoadSegment[];
};

function createDraftDistrictProfile(anchorPack: DistrictPlaceAnchorPack): DraftDistrictProfile {
  if (anchorPack.districtSlug === "ontario-candidate") {
    return {
      countyLabel: "San Bernardino County",
      districtLabel: "Ontario candidate draft",
      detailCameraAnchorId: "ontario-mills-commercial-anchor",
      terrainStyle: "inland-logistics",
      preferredPositions: {
        "ontario-inland-residential-variety": { x: 9.2, y: 8.7, z: 0 },
        "ontario-mills-commercial-anchor": { x: 18.4, y: 11.4, z: 0 },
        "ontario-international-airport": { x: 26.4, y: 15.4, z: 0 },
        "ontario-civic-center-core": { x: 13.8, y: 16.4, z: 0 },
        "ontario-downtown-service-core": { x: 21.2, y: 17.3, z: 0 },
      },
      roadSegments: [
        { id: "draft-road-ontario-commerce-spine", kind: "avenue", from: { x: 6, y: 13, z: 0 }, to: { x: 30, y: 13, z: 0 }, width: 2.05 },
        { id: "draft-road-airport-edge", kind: "avenue", from: { x: 25, y: 8, z: 0 }, to: { x: 25, y: 21, z: 0 }, width: 2.1 },
        { id: "draft-road-civic-spine", kind: "street", from: { x: 13, y: 7, z: 0 }, to: { x: 13, y: 21, z: 0 }, width: 1.45 },
        { id: "draft-road-residential-grid", kind: "street", from: { x: 5, y: 10, z: 0 }, to: { x: 18, y: 10, z: 0 }, width: 1.35 },
        { id: "draft-cross-commerce", kind: "crosswalk", from: { x: 17, y: 13, z: 0 }, to: { x: 20, y: 13, z: 0 }, width: 0.45 },
        { id: "draft-drive-airport", kind: "driveway", from: { x: 26.4, y: 15.4, z: 0 }, to: { x: 25, y: 15.4, z: 0 }, width: 0.85 },
        { id: "draft-drive-mills", kind: "driveway", from: { x: 18.4, y: 11.4, z: 0 }, to: { x: 18.4, y: 13, z: 0 }, width: 0.78 },
      ],
    };
  }

  return {
    countyLabel: "Orange County",
    districtLabel: "Anaheim candidate draft",
    detailCameraAnchorId: "platinum-triangle-area",
    terrainStyle: "resort-venue",
    preferredPositions: {
      "platinum-triangle-area": { x: 12, y: 8.8, z: 0 },
      "anaheim-convention-center": { x: 18.5, y: 11.2, z: 0 },
      "artic-transit-center": { x: 26.2, y: 12.25, z: 0 },
      "angel-stadium": { x: 20.25, y: 18.35, z: 0 },
      "downtown-anaheim-community-center": { x: 10.8, y: 15.2, z: 0 },
    },
    roadSegments: [
      { id: "draft-road-katella", kind: "avenue", from: { x: 6, y: 14, z: 0 }, to: { x: 30, y: 14, z: 0 }, width: 2 },
      { id: "draft-road-harbor", kind: "avenue", from: { x: 17, y: 5, z: 0 }, to: { x: 17, y: 21, z: 0 }, width: 1.8 },
      { id: "draft-road-transit-edge", kind: "street", from: { x: 24, y: 9, z: 0 }, to: { x: 24, y: 20, z: 0 }, width: 1.45 },
      { id: "draft-cross-core", kind: "crosswalk", from: { x: 16, y: 14, z: 0 }, to: { x: 19, y: 14, z: 0 }, width: 0.45 },
      { id: "draft-drive-convention", kind: "driveway", from: { x: 18.5, y: 11.2, z: 0 }, to: { x: 18.5, y: 14, z: 0 }, width: 0.72 },
      { id: "draft-drive-stadium", kind: "driveway", from: { x: 20.25, y: 18.35, z: 0 }, to: { x: 24, y: 18.35, z: 0 }, width: 0.8 },
    ],
  };
}

function createDraftAnchorPositions(anchors: DistrictPlaceAnchor[], profile: DraftDistrictProfile): Map<string, CityWorldPoint> {
  const fallback: CityWorldPoint[] = [
    { x: 11, y: 8.5, z: 0 },
    { x: 18, y: 10.5, z: 0 },
    { x: 23.5, y: 13.2, z: 0 },
    { x: 20.5, y: 16.2, z: 0 },
    { x: 13.4, y: 15.4, z: 0 },
    { x: 27, y: 9.8, z: 0 },
  ];
  const positions = new Map<string, CityWorldPoint>();

  anchors.forEach((anchor, index) => {
    const fallbackPosition = fallback[index % fallback.length] ?? { x: 11, y: 8.5, z: 0 };
    positions.set(anchor.id, profile.preferredPositions[anchor.id] ?? fallbackPosition);
  });

  return positions;
}

function createDraftDistrictTerrainTiles(profile: DraftDistrictProfile): CityWorldTerrainTile[] {
  const tiles: CityWorldTerrainTile[] = [];

  for (let y = DRAFT_DISTRICT_BOUNDS.minY; y <= DRAFT_DISTRICT_BOUNDS.maxY; y += 1) {
    for (let x = DRAFT_DISTRICT_BOUNDS.minX; x <= DRAFT_DISTRICT_BOUNDS.maxX; x += 1) {
      const inOntarioLogisticsEdge = profile.terrainStyle === "inland-logistics" && x >= 23 && x <= 31 && y >= 11 && y <= 20;
      const inOntarioCommerceCore = profile.terrainStyle === "inland-logistics" && x >= 15 && x <= 23 && y >= 9 && y <= 16;
      const inOntarioResidentialGrid = profile.terrainStyle === "inland-logistics" && x >= 5 && x <= 14 && y >= 6 && y <= 13;
      const inCommerceCore =
        profile.terrainStyle === "resort-venue" ? x >= 15 && x <= 27 && y >= 9 && y <= 18 : inOntarioCommerceCore || inOntarioLogisticsEdge;
      const inResidentialArea = profile.terrainStyle === "resort-venue" ? x >= 6 && x <= 14 && y >= 6 && y <= 12 : inOntarioResidentialGrid;
      const kind: CityWorldTerrainKind = inOntarioLogisticsEdge
        ? "sidewalk"
        : inCommerceCore
          ? "plaza"
          : inResidentialArea
            ? "grass"
            : x % 7 === 0 && y % 5 === 0
              ? "park"
              : "grass";
      const variant = (x * 19 + y * 23) % 5;
      tiles.push({
        id: `draft-terrain-${x}-${y}`,
        kind,
        position: { x, y, z: 0 },
        width: 1,
        depth: 1,
        variant,
        spriteKey: `tile.${kind}.${variant}`,
        paletteKey: `terrain.${kind}`,
        detailLevel: inCommerceCore ? "medium" : "low",
        visualGrammar: terrainVisualGrammar(kind, false, { x, y, z: 0 }, true),
      });
    }
  }

  return tiles;
}

function createDraftDistrictRoadSegments(profile: DraftDistrictProfile): CityWorldRoadSegment[] {
  return profile.roadSegments.map(withRoadMetadata);
}

function createDraftDistrictLots(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>): CityWorldLot[] {
  return anchors.map((anchor) => {
    const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
    const kind = draftLotKind(anchor.category);
    const footprint = draftLotFootprint(anchor);
    return withLotMetadata({
      id: `draft-lot-${anchor.id}`,
      kind,
      label: anchor.label,
      position,
      width: footprint.width,
      depth: footprint.depth,
      placeId: `draft-place-${anchor.id}`,
    });
  });
}

type DraftBuildingSpec = {
  suffix: string;
  offset: { x: number; y: number };
  kind: CityWorldBuilding["kind"];
  width: number;
  depth: number;
  height: number;
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
  detailLevel?: NonNullable<CityWorldBuilding["detailLevel"]>;
};

const DRAFT_ANCHOR_BUILDING_SPECS: Record<string, DraftBuildingSpec[]> = {
  "platinum-triangle-area": [
    { suffix: "rowhome-street", offset: { x: -2.15, y: -0.5 }, kind: "home", width: 3.8, depth: 1.12, height: 1.52, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
    { suffix: "lowrise-courtyard", offset: { x: 1.26, y: -0.38 }, kind: "apartment", width: 2.8, depth: 1.9, height: 2.18, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
    { suffix: "mixed-use-edge", offset: { x: 0.06, y: 1.68 }, kind: "shop", width: 3.15, depth: 1.18, height: 1.08, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
  ],
  "anaheim-convention-center": [
    { suffix: "exhibit-hall-west", offset: { x: -2.55, y: -0.38 }, kind: "civic", width: 5.45, depth: 1.86, height: 1.04, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    { suffix: "exhibit-hall-east", offset: { x: 2.2, y: -0.02 }, kind: "civic", width: 5.35, depth: 1.82, height: 1.1, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    {
      suffix: "entry-spine",
      offset: { x: 0.18, y: 1.58 },
      kind: "civic",
      width: 4.75,
      depth: 0.94,
      height: 0.82,
      facadeStyle: "civic",
      roofShape: "hip",
      detailLevel: "high",
    },
    { suffix: "glass-arcade-front", offset: { x: -2.2, y: 1.48 }, kind: "civic", width: 2.9, depth: 0.72, height: 0.58, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    { suffix: "frontage-wing", offset: { x: 3.22, y: 1.36 }, kind: "civic", width: 2.55, depth: 0.9, height: 0.72, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
  ],
  "artic-transit-center": [
    { suffix: "terminal-shed", offset: { x: -1.32, y: -0.22 }, kind: "gym", width: 7.15, depth: 1.74, height: 1.95, facadeStyle: "fitness", roofShape: "sawtooth", detailLevel: "high" },
    { suffix: "platform-edge", offset: { x: -1.15, y: 1.05 }, kind: "civic", width: 5.85, depth: 0.64, height: 0.42, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    { suffix: "ticket-hall", offset: { x: -0.18, y: 1.18 }, kind: "civic", width: 2.55, depth: 1.02, height: 0.92, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    { suffix: "clock-tower", offset: { x: -0.06, y: -0.62 }, kind: "civic", width: 0.86, depth: 0.86, height: 3.82, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
  ],
  "angel-stadium": [
    { suffix: "venue-bowl-west", offset: { x: -2.02, y: -0.28 }, kind: "civic", width: 4.9, depth: 3.48, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    { suffix: "venue-bowl-east", offset: { x: 1.96, y: -0.02 }, kind: "civic", width: 4.82, depth: 3.36, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
    { suffix: "homeplate-gate", offset: { x: -0.24, y: 1.96 }, kind: "civic", width: 2.45, depth: 1.16, height: 1.0, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
    { suffix: "event-gate-east", offset: { x: 2.68, y: 1.45 }, kind: "civic", width: 1.85, depth: 0.95, height: 0.76, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
  ],
  "downtown-anaheim-community-center": [
    { suffix: "community-hall", offset: { x: -0.72, y: -0.05 }, kind: "civic", width: 3.05, depth: 1.62, height: 1.24, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
    { suffix: "classroom-wing", offset: { x: 1.48, y: 0.82 }, kind: "civic", width: 2.1, depth: 0.98, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
    { suffix: "front-porch", offset: { x: 0.35, y: 1.45 }, kind: "civic", width: 1.55, depth: 0.82, height: 0.66, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
  ],
  "ontario-inland-residential-variety": [
    { suffix: "rowhome-street", offset: { x: -2.25, y: -0.55 }, kind: "home", width: 3.75, depth: 1.08, height: 1.45, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
    { suffix: "ranch-court-west", offset: { x: 0.75, y: -0.72 }, kind: "home", width: 2.15, depth: 1.45, height: 1.05, facadeStyle: "ranch", roofShape: "hip", detailLevel: "medium" },
    { suffix: "ranch-court-east", offset: { x: 2.35, y: 0.65 }, kind: "home", width: 2.05, depth: 1.38, height: 0.96, facadeStyle: "ranch", roofShape: "gable", detailLevel: "medium" },
    { suffix: "cottage-court", offset: { x: -1.05, y: 0.72 }, kind: "home", width: 1.4, depth: 1.15, height: 1.28, facadeStyle: "cottage", roofShape: "gable", detailLevel: "medium" },
    { suffix: "lowrise-edge", offset: { x: -0.35, y: 1.55 }, kind: "apartment", width: 2.65, depth: 1.72, height: 1.88, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
  ],
  "ontario-mills-commercial-anchor": [
    { suffix: "retail-hall-west", offset: { x: -2.15, y: -0.18 }, kind: "shop", width: 4.15, depth: 1.55, height: 1.02, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
    { suffix: "retail-hall-east", offset: { x: 1.9, y: -0.05 }, kind: "shop", width: 4.0, depth: 1.5, height: 1.0, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
    { suffix: "entry-court", offset: { x: 0.15, y: 1.36 }, kind: "shop", width: 2.6, depth: 0.95, height: 0.72, facadeStyle: "storefront", roofShape: "hip", detailLevel: "high" },
  ],
  "ontario-international-airport": [
    { suffix: "terminal-hall", offset: { x: -1.95, y: -0.18 }, kind: "civic", width: 4.75, depth: 1.42, height: 1.2, facadeStyle: "civic", roofShape: "sawtooth", detailLevel: "high" },
    { suffix: "logistics-apron-wing", offset: { x: 1.88, y: 0.1 }, kind: "shop", width: 3.45, depth: 1.36, height: 0.82, facadeStyle: "storefront", roofShape: "flat", detailLevel: "medium" },
    { suffix: "control-tower", offset: { x: 2.35, y: -0.95 }, kind: "civic", width: 0.96, depth: 0.96, height: 2.95, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
  ],
  "ontario-civic-center-core": [
    { suffix: "civic-hall", offset: { x: -1.05, y: -0.18 }, kind: "civic", width: 3.2, depth: 1.7, height: 1.36, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
    { suffix: "office-wing", offset: { x: 1.55, y: 0.8 }, kind: "civic", width: 2.25, depth: 1.1, height: 1.05, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
  ],
  "ontario-downtown-service-core": [
    { suffix: "service-row", offset: { x: -1.2, y: -0.15 }, kind: "shop", width: 3.25, depth: 1.1, height: 0.98, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
    { suffix: "mixed-lowrise", offset: { x: 1.25, y: 0.95 }, kind: "apartment", width: 2.25, depth: 1.45, height: 1.65, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
  ],
};

function createDraftDistrictBuildings(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>): CityWorldBuilding[] {
  const buildings: CityWorldBuilding[] = [];

  for (const anchor of anchors) {
    const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
    const anchorSpecs = DRAFT_ANCHOR_BUILDING_SPECS[anchor.id];
    if (anchorSpecs) {
      buildings.push(...anchorSpecs.map((spec) => createDraftBuildingFromSpec(anchor, position, spec)));
      continue;
    }
    buildings.push(createDraftBuilding(anchor, anchor.id, position, draftBuildingKind(anchor.category), draftBuildingWidth(anchor.category), draftBuildingDepth(anchor.category), draftBuildingHeight(anchor.category), draftFacade(anchor.category), draftRoof(anchor.category)));
  }

  return buildings.map(withBuildingMetadata);
}

function createDraftBuildingFromSpec(anchor: DistrictPlaceAnchor, position: CityWorldPoint, spec: DraftBuildingSpec): CityWorldBuilding {
  const building = createDraftBuilding(
    anchor,
    `${anchor.id}-${spec.suffix}`,
    { x: position.x + spec.offset.x, y: position.y + spec.offset.y, z: position.z },
    spec.kind,
    spec.width,
    spec.depth,
    spec.height,
    spec.facadeStyle,
    spec.roofShape,
    spec.detailLevel,
  );
  return building;
}

function createDraftBuilding(
  anchor: DistrictPlaceAnchor,
  idSuffix: string,
  position: CityWorldPoint,
  kind: CityWorldBuilding["kind"],
  width: number,
  depth: number,
  height: number,
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
  roofShape: NonNullable<CityWorldBuilding["roofShape"]>,
  detailLevel: NonNullable<CityWorldBuilding["detailLevel"]> = "medium",
): CityWorldBuilding {
  const colors = draftBuildingColors(idSuffix, kind, facadeStyle);
  return {
    id: `draft-building-${idSuffix}`,
    kind,
    label: anchor.label,
    position,
    width,
    depth,
    height,
    bodyColor: colors.body,
    roofColor: colors.roof,
    placeId: `draft-place-${anchor.id}`,
    roofShape,
    facadeStyle,
    paletteKey: draftBuildingPaletteKey(kind, facadeStyle),
    detailLevel,
  };
}

function draftBuildingColors(
  idSuffix: string,
  kind: CityWorldBuilding["kind"],
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
): { body: string; roof: string } {
  if (idSuffix.includes("rowhome")) return { body: "#e6c7ad", roof: "#a75f44" };
  if (idSuffix.includes("lowrise")) return { body: "#d6c4aa", roof: "#7f9fa4" };
  if (idSuffix.includes("mixed-use")) return { body: "#ead8bd", roof: "#3f8b8c" };
  if (idSuffix.includes("convention")) return { body: "#ead9bf", roof: "#6f99a5" };
  if (idSuffix.includes("artic")) return { body: "#dce8e1", roof: "#86aeb8" };
  if (idSuffix.includes("stadium")) return { body: "#d7c7ae", roof: "#9da776" };
  if (idSuffix.includes("downtown")) return { body: "#e9d8bb", roof: "#8c9b75" };
  if (idSuffix.includes("ontario-international-airport")) return { body: "#dfe6df", roof: "#6e8e9c" };
  if (idSuffix.includes("ontario-mills")) return { body: "#ead7bb", roof: "#a46f52" };
  if (idSuffix.includes("ontario-civic")) return { body: "#e7dac2", roof: "#7d9274" };
  if (idSuffix.includes("ontario-downtown")) return { body: "#e8d1b4", roof: "#607c83" };
  if (kind === "gym" || facadeStyle === "fitness") return { body: "#dfe8e5", roof: "#5f8fa6" };
  if (kind === "apartment") return { body: "#d8c8af", roof: "#7f9fa4" };
  if (kind === "civic") return { body: "#ead9bf", roof: "#6f99a5" };
  if (kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return { body: "#efd8b6", roof: "#3f8b8c" };
  return { body: "#efd9bc", roof: "#b46c4e" };
}

function draftLotFootprint(anchor: DistrictPlaceAnchor): { width: number; depth: number } {
  if (anchor.id === "platinum-triangle-area") return { width: 7.1, depth: 4.9 };
  if (anchor.id === "anaheim-convention-center") return { width: 7.3, depth: 4.45 };
  if (anchor.id === "artic-transit-center") return { width: 6.25, depth: 3.15 };
  if (anchor.id === "angel-stadium") return { width: 7.6, depth: 5.1 };
  if (anchor.id === "downtown-anaheim-community-center") return { width: 4.8, depth: 3.3 };
  if (anchor.id === "ontario-inland-residential-variety") return { width: 7.0, depth: 4.55 };
  if (anchor.id === "ontario-mills-commercial-anchor") return { width: 7.8, depth: 4.35 };
  if (anchor.id === "ontario-international-airport") return { width: 7.1, depth: 4.05 };
  if (anchor.id === "ontario-civic-center-core") return { width: 5.2, depth: 3.4 };
  if (anchor.id === "ontario-downtown-service-core") return { width: 4.8, depth: 3.25 };

  const large = anchor.category === "entertainment" || anchor.category === "civic" || anchor.category === "transit";
  return {
    width: anchor.category === "entertainment" ? 6.6 : large ? 5.2 : anchor.category === "home_area" ? 6.8 : 3.8,
    depth: anchor.category === "entertainment" ? 4.6 : large ? 3.8 : anchor.category === "home_area" ? 4.8 : 3,
  };
}

function createDraftDistrictPlaces(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>, districtSlug: string): CityWorldPlace[] {
  return anchors.map((anchor, index) => ({
    id: `draft-place-${anchor.id}`,
    label: anchor.label,
    kind: draftPlaceKind(anchor.category),
    districtId: districtSlug,
    nodeId: anchor.id,
    anchor: positions.get(anchor.id) ?? { x: 8 + index * 3, y: 9 + index, z: 0 },
    hitRadius: anchor.category === "home_area" ? 3.8 : 2.8,
    description: `Non-public draft anchor: ${anchor.sourceFact}`,
    activity: 0,
    labelPriority: 8 - index,
  }));
}

function createTerrainTiles(): CityWorldTerrainTile[] {
  const tiles: CityWorldTerrainTile[] = [];

  for (let y = 0; y <= 30; y += 1) {
    for (let x = 0; x <= 42; x += 1) {
      const inPark = x >= 14 && x <= 21 && y >= 17 && y <= 23;
      const inPlaza = x >= 25 && x <= 34 && y >= 11 && y <= 17;
      const inWater = (x >= 34 && y >= 23) || (x >= 37 && y >= 18);
      const kind: CityWorldTerrainKind = inWater ? "water" : inPark ? "park" : inPlaza ? "plaza" : "grass";
      const variant = (x * 17 + y * 11) % 5;
      tiles.push({
        id: `terrain-${x}-${y}`,
        kind,
        position: { x, y, z: 0 },
        width: 1,
        depth: 1,
        variant,
        spriteKey: `tile.${kind}.${variant}`,
        paletteKey: `terrain.${kind}`,
        detailLevel: kind === "water" || kind === "park" || kind === "plaza" ? "medium" : "low",
        visualGrammar: publicTerrainVisualGrammar(kind, x, y),
      });
    }
  }

  return tiles;
}

function createShellTerrainTiles(): CityWorldTerrainTile[] {
  const tiles: CityWorldTerrainTile[] = [];

  for (let y = SHELL_BOUNDS.minY; y <= SHELL_BOUNDS.maxY; y += 1) {
    for (let x = SHELL_BOUNDS.minX; x <= SHELL_BOUNDS.maxX; x += 1) {
      const border = x === SHELL_BOUNDS.minX || y === SHELL_BOUNDS.minY || x === SHELL_BOUNDS.maxX || y === SHELL_BOUNDS.maxY;
      const kind: CityWorldTerrainKind = border ? "sidewalk" : "grass";
      const variant = (x * 13 + y * 7) % 4;
      tiles.push({
        id: `shell-terrain-${x}-${y}`,
        kind,
        position: { x, y, z: 0 },
        width: 1,
        depth: 1,
        variant,
        spriteKey: `tile.${kind}.${variant}`,
        paletteKey: `terrain.${kind}`,
        detailLevel: "low",
        visualGrammar: terrainVisualGrammar(kind, true, { x, y, z: 0 }),
      });
    }
  }

  return tiles;
}

function createRoadSegments(): CityWorldRoadSegment[] {
  const roads: CityWorldRoadSegment[] = [
    { id: "road-hamner", kind: "avenue", from: { x: 4, y: 13, z: 0 }, to: { x: 37, y: 13, z: 0 }, width: 2.1 },
    { id: "road-limonite", kind: "avenue", from: { x: 7, y: 21, z: 0 }, to: { x: 34, y: 21, z: 0 }, width: 2 },
    { id: "road-citrus", kind: "street", from: { x: 13, y: 5, z: 0 }, to: { x: 13, y: 25, z: 0 }, width: 1.55 },
    { id: "road-scholar", kind: "street", from: { x: 24, y: 6, z: 0 }, to: { x: 24, y: 25, z: 0 }, width: 1.55 },
    { id: "road-sumner", kind: "street", from: { x: 32, y: 8, z: 0 }, to: { x: 32, y: 24, z: 0 }, width: 1.5 },
    { id: "road-park-loop-a", kind: "driveway", from: { x: 14, y: 18, z: 0 }, to: { x: 21, y: 18, z: 0 }, width: 0.7 },
    { id: "road-park-loop-b", kind: "driveway", from: { x: 21, y: 18, z: 0 }, to: { x: 20, y: 23, z: 0 }, width: 0.7 },
    { id: "road-plaza-cut", kind: "driveway", from: { x: 26, y: 16, z: 0 }, to: { x: 34, y: 16, z: 0 }, width: 0.85 },
    { id: "road-south-lane", kind: "driveway", from: { x: 23.4, y: 23.8, z: 0 }, to: { x: 27.6, y: 23.8, z: 0 }, width: 0.65 },
    { id: "cross-eastvale-core", kind: "crosswalk", from: { x: 20, y: 13, z: 0 }, to: { x: 23, y: 13, z: 0 }, width: 0.45 },
    { id: "cross-plaza", kind: "crosswalk", from: { x: 31, y: 13, z: 0 }, to: { x: 31, y: 16, z: 0 }, width: 0.45 },
  ];

  return roads.map(withRoadMetadata);
}

function draftLotKind(category: WorldPlaceCategory): CityWorldLot["kind"] {
  if (category === "home_area") return "home";
  if (category === "transit" || category === "entertainment") return "civic";
  if (category === "civic" || category === "landmark") return "civic";
  if (category === "park") return "park";
  return "shop";
}

function draftBuildingKind(category: WorldPlaceCategory): CityWorldBuilding["kind"] {
  if (category === "home_area") return "home";
  if (category === "civic" || category === "transit" || category === "entertainment" || category === "landmark") return "civic";
  if (category === "fitness") return "gym";
  return "shop";
}

function draftPlaceKind(category: WorldPlaceCategory): CityWorldPlace["kind"] {
  if (category === "home_area") return "home_area";
  if (category === "park") return "park";
  if (category === "transit") return "road";
  if (category === "civic" || category === "entertainment" || category === "landmark") return "landmark";
  return "shop";
}

function draftFacade(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["facadeStyle"]> {
  if (category === "home_area") return "rowhome";
  if (category === "transit" || category === "civic" || category === "entertainment" || category === "landmark") return "civic";
  return "strip_store";
}

function draftRoof(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["roofShape"]> {
  if (category === "home_area") return "flat";
  if (category === "transit" || category === "entertainment") return "tower";
  return "flat";
}

function draftBuildingPaletteKey(
  kind: CityWorldBuilding["kind"],
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
): string {
  if (kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
  if (kind === "home" && facadeStyle === "ranch") return "building.house.ranch.v1";
  if (kind === "home" && facadeStyle === "cottage") return "building.house.cottage.v1";
  if (kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
  if (kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
  if (kind === "gym") return "building.gym.2";
  if (kind === "civic") return "building.civic.1";
  return "building.home.0";
}

function draftBuildingWidth(category: WorldPlaceCategory): number {
  if (category === "entertainment") return 5.2;
  if (category === "civic" || category === "transit") return 4.4;
  return 3.2;
}

function draftBuildingDepth(category: WorldPlaceCategory): number {
  if (category === "entertainment") return 3.8;
  if (category === "civic" || category === "transit") return 3.1;
  return 2.2;
}

function draftBuildingHeight(category: WorldPlaceCategory): number {
  if (category === "transit" || category === "entertainment") return 2.6;
  if (category === "civic") return 2.3;
  return 1.6;
}

function createLots(): CityWorldLot[] {
  const lots: CityWorldLot[] = [
    { id: "lot-civic", kind: "civic", label: "Civic green", position: { x: 21, y: 10.5, z: 0 }, width: 5.6, depth: 4.2, placeId: "place-eastvale-core" },
    { id: "lot-plaza", kind: "shop", label: "Plaza row", position: { x: 28, y: 12.6, z: 0 }, width: 7.6, depth: 4.4, placeId: "place-plaza-row" },
    { id: "lot-gym", kind: "gym", label: "Gym block", position: { x: 31.4, y: 15.5, z: 0 }, width: 4.2, depth: 3.2, placeId: "place-eastvale-gym" },
    { id: "lot-apartments", kind: "apartments", label: "Apartment courts", position: { x: 32, y: 21.8, z: 0 }, width: 6.4, depth: 4.6, placeId: "place-eastvale-apartments" },
    { id: "lot-park", kind: "park", label: "Community park", position: { x: 18, y: 20, z: 0 }, width: 7.5, depth: 6.4, placeId: "place-community-park" },
    { id: "lot-water", kind: "waterfront", label: "Water edge", position: { x: 37, y: 24, z: 0 }, width: 6, depth: 6 },
    { id: "lot-corner-market", kind: "shop", label: "Corner market", position: { x: 15.6, y: 11.6, z: 0 }, width: 2.3, depth: 1.7, placeId: "place-neighborhood-blocks" },
    { id: "lot-plaza-lofts", kind: "apartments", label: "Plaza lofts", position: { x: 26.8, y: 10.2, z: 0 }, width: 2.9, depth: 2.1, placeId: "place-plaza-row" },
  ];

  const southCourtLots: Array<{ id: string; x: number; y: number }> = [
    { id: "lot-home-south-0-0", x: 23.9, y: 22.9 },
    { id: "lot-home-south-0-1", x: 26.55, y: 22.9 },
    { id: "lot-home-south-1-0", x: 24.05, y: 24.85 },
    { id: "lot-home-south-1-1", x: 26.7, y: 24.8 },
  ];
  for (const southLot of southCourtLots) {
    lots.push({
      id: southLot.id,
      kind: "home",
      label: "Home lot",
      position: { x: southLot.x, y: southLot.y, z: 0 },
      width: 1.7,
      depth: 1.45,
      placeId: "place-neighborhood-blocks",
    });
  }

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      lots.push({
        id: `lot-home-west-${row}-${col}`,
        kind: "home",
        label: "Home lot",
        position: { x: 6 + col * 2.2, y: 6.5 + row * 2, z: 0 },
        width: 1.6,
        depth: 1.4,
        placeId: "place-neighborhood-blocks",
      });
    }
  }

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      lots.push({
        id: `lot-home-north-${row}-${col}`,
        kind: "home",
        label: "Home lot",
        position: { x: 16 + col * 1.9, y: 5.5 + row * 1.8, z: 0 },
        width: 1.45,
        depth: 1.3,
        placeId: "place-neighborhood-blocks",
      });
    }
  }

  return lots.map(withLotMetadata);
}

function createBuildings(): CityWorldBuilding[] {
  const buildings: CityWorldBuilding[] = [
    {
      id: "building-civic",
      kind: "civic",
      label: "Eastvale Core",
      position: { x: 21, y: 10.5, z: 0 },
      width: 3.45,
      depth: 2.55,
      height: 2.82,
      bodyColor: "#f3dfbd",
      roofColor: "#5d8fa8",
      placeId: "place-eastvale-core",
      roofShape: "tower",
      facadeStyle: "civic",
      detailLevel: "high",
    },
    {
      id: "building-gym",
      kind: "gym",
      label: "Gym",
      position: { x: 31, y: 15.2, z: 0 },
      width: 4.2,
      depth: 2.7,
      height: 2.1,
      bodyColor: "#d7e7ef",
      roofColor: "#a76f4e",
      placeId: "place-eastvale-gym",
      roofShape: "sawtooth",
      facadeStyle: "fitness",
      detailLevel: "high",
    },
    {
      id: "building-apartments-a",
      kind: "apartment",
      label: "Apartments",
      position: { x: 30.2, y: 21.5, z: 0 },
      width: 2.4,
      depth: 3.4,
      height: 3.4,
      bodyColor: "#ead7bb",
      roofColor: "#6d8f6f",
      placeId: "place-eastvale-apartments",
      facadeStyle: "lowrise",
      detailLevel: "high",
    },
    {
      id: "building-apartments-b",
      kind: "apartment",
      label: "Apartments",
      position: { x: 33.6, y: 21.8, z: 0 },
      width: 2.4,
      depth: 3.2,
      height: 3.1,
      bodyColor: "#e7c9a8",
      roofColor: "#416f82",
      placeId: "place-eastvale-apartments",
      facadeStyle: "lowrise",
      detailLevel: "high",
    },
  ];

  // Residential archetype space (0.51E): identity is carried by (facade x roof
  // x silhouette-bucket x hash-assigned palette variant), NOT by the raw
  // authored color the renderer discards. The width/depth/height spread crosses
  // half-tile silhouette buckets (compact one-story, two-story massing, wide
  // footprint) so the homes read as distinct at map zoom. Positions sit on the
  // existing home-lot grids (west/north/south) for lot contact. bodyColor and
  // roofColor here are muted placeholders only; the effective on-screen color
  // resolves through the assigned palette variant.
  // In-frame homes (residential_detail camera, x8.8-18.6 / y4.75-13.85) are
  // kept COMPACT one-story so the mobile-occlusion tray gate stays green; the
  // taller/wider silhouette variants live on the far-west, far-north, and south
  // lots OUTSIDE that tight frame. Every home still lands on an existing
  // home-lot grid cell for lot contact.
  const residentialModules: CityWorldBuilding[] = [
    // --- Compact one-story homes INSIDE the residential_detail frame ---
    createResidentialBuilding("building-cottage-west-a", "Cottage", 10.4, 6.5, 1.35, 1.1, 1.22, "#f2dfc4", "#b86f4c", "cottage", "gable"),
    createResidentialBuilding("building-cottage-west-c", "Cottage", 12.6, 6.5, 1.32, 1.12, 1.24, "#f6e7cf", "#b99358", "cottage", "gable"),
    createResidentialBuilding("building-cottage-west-f", "Cottage", 14.8, 6.5, 1.38, 1.12, 1.28, "#f2dfc4", "#5f8fa0", "cottage", "hip"),
    createResidentialBuilding("building-cottage-north-a", "Cottage", 10.4, 8.5, 1.32, 1.08, 1.12, "#ead4b6", "#b99358", "cottage", "gable"),
    createResidentialBuilding("building-cottage-north-d", "Cottage", 16.0, 5.5, 1.36, 1.12, 1.16, "#f0d6bd", "#8a6a52", "cottage", "gable"),
    createResidentialBuilding("building-ranch-west-a", "Ranch home", 17.9, 5.5, 1.95, 1.15, 1.08, "#e8c9aa", "#7f9b6e", "ranch", "hip"),
    // --- Taller / wider silhouette variants OUTSIDE the tight frame ---
    createResidentialBuilding("building-cottage-west-b", "Cottage", 6.0, 6.5, 1.45, 1.15, 1.75, "#ead4b6", "#5f8fa0", "cottage", "hip"),
    createResidentialBuilding("building-cottage-west-d", "Cottage", 8.2, 6.5, 1.8, 1.3, 1.35, "#f0d6bd", "#8f7568", "cottage", "gable"),
    createResidentialBuilding("building-cottage-west-e", "Cottage", 6.0, 8.5, 1.38, 1.08, 1.72, "#f6e7cf", "#b86f4c", "cottage", "gable"),
    createResidentialBuilding("building-cottage-west-g", "Cottage", 8.2, 8.5, 1.82, 1.28, 1.3, "#ead4b6", "#8a6a52", "cottage", "gable"),
    createResidentialBuilding("building-cottage-west-h", "Cottage", 6.0, 10.5, 1.34, 1.1, 1.68, "#f0dcbe", "#b99358", "cottage", "gable"),
    createResidentialBuilding("building-cottage-west-i", "Cottage", 8.2, 10.5, 1.86, 1.34, 1.32, "#eed4b4", "#7d955f", "cottage", "hip"),
    createResidentialBuilding("building-ranch-west-b", "Ranch home", 6.0, 12.5, 2.42, 1.48, 1.1, "#ead4b6", "#a76f4e", "ranch", "hip"),
    createResidentialBuilding("building-ranch-west-c", "Ranch home", 8.2, 12.5, 2.05, 1.18, 1.62, "#e8c9aa", "#7f9b6e", "ranch", "hip"),
    createResidentialBuilding("building-cottage-north-b", "Cottage", 19.8, 5.5, 1.78, 1.32, 1.34, "#e8c9aa", "#8f7568", "cottage", "gable"),
    createResidentialBuilding("building-cottage-north-c", "Cottage", 21.7, 5.5, 1.42, 1.1, 1.78, "#f2dfc4", "#b86f4c", "cottage", "hip"),
    createResidentialBuilding("building-cottage-north-e", "Cottage", 23.6, 5.5, 1.88, 1.3, 1.7, "#eed4b4", "#7d955f", "cottage", "gable"),
    createResidentialBuilding("building-ranch-west-d", "Ranch home", 19.8, 7.3, 1.98, 1.16, 1.05, "#ecd2b0", "#5f7f8e", "ranch", "gable"),
    createResidentialBuilding("building-ranch-west-e", "Ranch home", 21.7, 7.3, 2.44, 1.46, 1.58, "#f4e2c6", "#5d7f8a", "ranch", "gable"),
    createResidentialBuilding("building-rowhome-west-a", "Rowhomes", 23.6, 7.3, 3.25, 1.25, 1.55, "#f2dfc2", "#607d84", "rowhome", "flat", "building.house.rowhome.flat_parapet.v1"),
    createResidentialBuilding("building-ranch-north-b", "Ranch home", 19.8, 9.1, 2.02, 1.2, 1.58, "#e8c9aa", "#5f7f8e", "ranch", "gable"),
    createResidentialBuilding("building-rowhome-north-a", "Rowhomes", 21.7, 9.1, 3.1, 1.2, 1.5, "#f2dfc2", "#6f9ca7", "rowhome", "flat", "building.house.rowhome.flat_parapet.v1"),
    createResidentialBuilding("building-ranch-south-c", "Ranch home", 23.6, 9.1, 2.06, 1.2, 1.06, "#ecd2b0", "#7f9b6e", "ranch", "gable"),
    createResidentialBuilding("building-cottage-south-a", "Cottage", 23.9, 22.85, 1.36, 1.1, 1.72, "#f0dcbe", "#8a6a52", "cottage", "gable"),
    createResidentialBuilding("building-ranch-south-a", "Ranch home", 26.55, 22.9, 1.98, 1.16, 1.04, "#ecd2b0", "#5f7f8e", "ranch", "hip"),
    createResidentialBuilding("building-cottage-south-b", "Cottage", 24.05, 24.85, 1.84, 1.3, 1.26, "#eed4b4", "#7d955f", "cottage", "gable"),
    createResidentialBuilding("building-ranch-south-b", "Ranch home", 26.7, 24.8, 2.44, 1.46, 1.1, "#f4e2c6", "#5d7f8a", "ranch", "hip"),
  ];
  buildings.push(...residentialModules);

  buildings.push({
    id: "building-corner-market",
    kind: "shop",
    label: "Corner market",
    position: { x: 15.6, y: 11.45, z: 0 },
    width: 2.0,
    depth: 1.15,
    height: 1.12,
    bodyColor: "#eed7b2",
    roofColor: "#437085",
    placeId: "place-neighborhood-blocks",
    roofShape: "flat",
    facadeStyle: "storefront",
    detailLevel: "high",
  });

  buildings.push({
    id: "building-plaza-lofts",
    kind: "apartment",
    label: "Plaza lofts",
    position: { x: 26.8, y: 10.2, z: 0 },
    width: 2.2,
    depth: 1.6,
    height: 2.5,
    bodyColor: "#e3cfae",
    roofColor: "#587a8e",
    placeId: "place-plaza-row",
    roofShape: "flat",
    facadeStyle: "lowrise",
    detailLevel: "high",
  });

  buildings.push({
    id: "building-plaza-strip",
    kind: "shop",
    label: "Plaza Row",
    position: { x: 29.4, y: 12.45, z: 0 },
    width: 6.1,
    depth: 2.05,
    height: 1.78,
    bodyColor: "#f2dfc2",
    roofColor: "#6f9ca7",
    placeId: "place-plaza-row",
    spriteKey: "building.store.strip.three_bay.v1",
    paletteKey: "building.store.strip.three_bay.v1",
    roofShape: "flat",
    facadeStyle: "strip_store",
    detailLevel: "high",
  });

  return buildings.map(withBuildingMetadata);
}

function createResidentialBuilding(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  depth: number,
  height: number,
  bodyColor: string,
  roofColor: string,
  facadeStyle: "cottage" | "ranch" | "rowhome",
  roofShape: "gable" | "hip" | "flat",
  spriteKey?: string,
): CityWorldBuilding {
  return {
    id,
    kind: "home",
    label,
    position: { x, y, z: 0 },
    width,
    depth,
    height,
    bodyColor,
    roofColor,
    placeId: "place-neighborhood-blocks",
    ...(spriteKey ? { spriteKey } : {}),
    // paletteKey intentionally left unset: withBuildingMetadata hash-assigns an
    // authored palette-variant ramp so residential identity comes from the
    // palette system (survives the renderer's manifest resolution) rather than
    // from the raw authored color the renderer discards for non-draft buildings.
    roofShape,
    facadeStyle,
    detailLevel: facadeStyle === "rowhome" ? "high" : "medium",
  };
}

function createProps(): CityWorldProp[] {
  const props: CityWorldProp[] = [
    { id: "prop-water-shimmer-a", kind: "water_shimmer", position: { x: 36, y: 24, z: 0 }, variant: 0 },
    { id: "prop-water-shimmer-b", kind: "water_shimmer", position: { x: 39, y: 26, z: 0 }, variant: 1 },
    { id: "prop-water-shimmer-c", kind: "water_shimmer", position: { x: 38.5, y: 21.5, z: 0 }, variant: 2 },
  ];

  const treePoints: CityWorldPoint[] = [
    { x: 14, y: 17, z: 0 },
    { x: 15.5, y: 19.5, z: 0 },
    { x: 16.5, y: 22, z: 0 },
    { x: 20, y: 18.5, z: 0 },
    { x: 21, y: 21.5, z: 0 },
    { x: 23, y: 10, z: 0 },
    { x: 24, y: 12, z: 0 },
    { x: 34, y: 18.5, z: 0 },
    { x: 36, y: 21.5, z: 0 },
    { x: 9, y: 5, z: 0 },
    { x: 12, y: 5, z: 0 },
    { x: 22.8, y: 22.1, z: 0 },
    { x: 27.9, y: 25.4, z: 0 },
  ];

  treePoints.forEach((position, index) => {
    props.push({
      id: `prop-tree-${index}`,
      kind: index % 4 === 0 ? "bush" : "tree",
      position,
      variant: index % 5,
      ...(index < 5 ? { placeId: "place-community-park" } : {}),
    });
  });

  const shrubPoints: CityWorldPoint[] = [
    { x: 6, y: 5.2, z: 0 },
    { x: 11.2, y: 13.8, z: 0 },
    { x: 16.2, y: 16.6, z: 0 },
    { x: 21.6, y: 23, z: 0 },
    { x: 25.2, y: 11.3, z: 0 },
    { x: 34.2, y: 19.6, z: 0 },
    { x: 35.6, y: 23.4, z: 0 },
  ];

  shrubPoints.forEach((position, index) => {
    props.push({
      id: `prop-shrub-${index}`,
      kind: "bush",
      position,
      variant: (index + 2) % 5,
      ...(index >= 2 && index <= 3 ? { placeId: "place-community-park" } : {}),
    });
  });
  return props.map(withPropMetadata);
}

function createPins(places: CityWorldPlace[], stickers: NonNullable<CityWorldSessionState["stickers"]>, notes: NonNullable<CityWorldSessionState["notes"]>): CityWorldPin[] {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const pins: CityWorldPin[] = [];

  for (const sticker of stickers) {
    const place = placeById.get(sticker.placeId);
    if (!place) {
      throw new Error(`CityWorld sticker ${sticker.id} references missing place ${sticker.placeId}.`);
    }
    pins.push({
      id: sticker.id,
      placeId: sticker.placeId,
      kind: sticker.kind,
      label: sticker.label,
      anchor: { x: place.anchor.x + 0.7, y: place.anchor.y - 0.6, z: 1.8 },
      ...(sticker.noteId ? { noteId: sticker.noteId } : {}),
      spriteKey: `pin.sticker.${sticker.kind}`,
      paletteKey: `pin.${sticker.kind}`,
      detailLevel: "high",
    });
  }

  for (const note of notes) {
    const place = placeById.get(note.placeId);
    if (!place) {
      throw new Error(`CityWorld note ${note.id} references missing place ${note.placeId}.`);
    }
    pins.push({
      id: `pin-${note.id}`,
      placeId: note.placeId,
      kind: "note",
      label: note.body,
      anchor: { x: place.anchor.x - 0.75, y: place.anchor.y - 0.5, z: 1.6 },
      noteId: note.id,
      spriteKey: "pin.note.default",
      paletteKey: "pin.note",
      detailLevel: "high",
    });
  }

  return pins;
}

function createActors(scene: VoxelScene): CityWorldActor[] {
  const actors: CityWorldActor[] = [
    {
      id: "actor-clawd",
      kind: "clawd",
      color: "#15130f",
      position: PLACE_ANCHORS["place-eastvale-core"] ?? { x: 21, y: 11, z: 0 },
      path: scene.clawd.routeNodeIds.length > 1 ? [{ x: 21, y: 11, z: 0 }, { x: 28, y: 13, z: 0 }, { x: 18, y: 20, z: 0 }] : [{ x: 21, y: 11, z: 0 }],
      speed: 0.012,
      phase: 0,
      placeId: "place-eastvale-core",
    },
  ];

  return actors.map(withActorMetadata);
}

function publicTerrainVisualGrammar(kind: CityWorldTerrainKind, x: number, y: number): CityWorldVisualGrammar {
  const terrainComposition = terrainCompositionProfile(kind, false, { x, y, z: 0 });
  const terrainElevation = terrainElevationProfile(kind, false, { x, y, z: 0 });
  const chunkEdge = terrainChunkEdgeProfile(kind, false, { x, y, z: 0 });
  const terrainChunkMassing = terrainChunkMassingProfile(kind, false, { x, y, z: 0 });
  if (kind === "grass") {
    const inNeighborhoodField = (x >= 5 && x <= 24 && y >= 4 && y <= 15) || (x >= 22 && x <= 35 && y >= 10 && y <= 23);
    const inCivicGround = x >= 18 && x <= 25 && y >= 8 && y <= 14;
    if (inCivicGround) return { terrainProfile: "landmark_civic_ground", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "parcel_pad_shadow" };
    if (inNeighborhoodField) return { terrainProfile: "neighborhood_parcel_field", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "parcel_pad_shadow" };
  }

  return terrainVisualGrammar(kind, false, { x, y, z: 0 });
}

function terrainVisualGrammar(kind: CityWorldTerrainKind, shell: boolean, position?: CityWorldPoint, draft = false): CityWorldVisualGrammar {
  const terrainComposition = terrainCompositionProfile(kind, shell, position, draft);
  const terrainElevation = terrainElevationProfile(kind, shell, position, draft);
  const chunkEdge = terrainChunkEdgeProfile(kind, shell, position, draft);
  const terrainChunkMassing = terrainChunkMassingProfile(kind, shell, position, draft);
  if (shell) {
    return { terrainProfile: "shell_grid", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
  }
  if (kind === "park") return { terrainProfile: "civic_green", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
  if (kind === "plaza" || kind === "sidewalk") return { terrainProfile: "commercial_plaza", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "parcel_pad_shadow" };
  if (kind === "water") return { terrainProfile: "water_edge", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
  return { terrainProfile: "quiet_socal_grass", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
}

function terrainCompositionProfile(
  kind: CityWorldTerrainKind,
  shell: boolean,
  position?: CityWorldPoint,
  draft = false,
): NonNullable<CityWorldVisualGrammar["terrainComposition"]> {
  if (shell) return "shell_boundary";
  if (draft) return "hidden_draft_field";
  if (kind === "water") return "waterfront_edge_strata";
  if (kind === "park") return "park_basin";
  if (kind === "plaza" || kind === "sidewalk") return "commercial_apron_field";
  if (!position) return "quiet_field";

  if (inCivicMassingField(position)) return "civic_focus_field";
  if (inCommercialMassingField(position)) return "commercial_apron_field";
  if (inResidentialMassingField(position)) return "neighborhood_yard_fabric";
  return "quiet_field";
}

function terrainElevationProfile(
  kind: CityWorldTerrainKind,
  shell: boolean,
  position?: CityWorldPoint,
  draft = false,
): NonNullable<CityWorldVisualGrammar["terrainElevation"]> {
  if (shell) return "shell_flat";
  if (draft) return "hidden_draft_shelf";
  if (kind === "water") return "water_edge_cut";
  if (kind === "park") return "park_basin_shelf";
  if (kind === "plaza" || kind === "sidewalk") return "commercial_slab_field";
  if (!position) return "flat_field";

  if (isNearBounds(position, CITY_BOUNDS, 3)) return "raised_parcel_shelf";
  if (inCivicMassingField(position)) return "civic_plinth_shelf";
  if (inResidentialMassingField(position) || inCommercialMassingField(position)) return "raised_parcel_shelf";
  return "flat_field";
}

function terrainChunkEdgeProfile(
  kind: CityWorldTerrainKind,
  shell: boolean,
  position?: CityWorldPoint,
  draft = false,
): NonNullable<CityWorldVisualGrammar["chunkEdge"]> {
  if (!position) return "none";
  if (draft) return isOnBounds(position, DRAFT_DISTRICT_BOUNDS) ? "hidden_draft_boundary" : "none";
  if (shell) return isOnBounds(position, SHELL_BOUNDS) ? "world_edge" : "none";
  if (kind === "water") return "waterfront_bank_edge";
  if (isNearBounds(position, CITY_BOUNDS, 3)) return "world_edge";
  if (kind === "park" && position.x >= 14 && position.x <= 21 && position.y >= 17 && position.y <= 23) {
    return position.x === 14 || position.x === 21 || position.y === 17 || position.y === 23 ? "park_basin_edge" : "none";
  }
  if (kind === "plaza" || kind === "sidewalk") return "parcel_cluster_edge";
  if (kind === "grass" && (isCivicShelfEdge(position) || isCommercialShelfEdge(position) || isResidentialShelfEdge(position))) return "parcel_cluster_edge";

  return "none";
}

function terrainChunkMassingProfile(
  kind: CityWorldTerrainKind,
  shell: boolean,
  position?: CityWorldPoint,
  draft = false,
): NonNullable<CityWorldVisualGrammar["terrainChunkMassing"]> {
  if (!position) return "none";
  if (draft) return isOnBounds(position, DRAFT_DISTRICT_BOUNDS) ? "hidden_draft_mass" : "none";
  if (shell) return isOnBounds(position, SHELL_BOUNDS) ? "shell_boundary_mass" : "none";
  if (kind === "water") return "waterfront_bank_cut_mass";
  if (isNearBounds(position, CITY_BOUNDS, 3)) return "outer_world_edge_mass";
  if (kind === "park" && position.x >= 14 && position.x <= 21 && position.y >= 17 && position.y <= 23) {
    return "park_basin_cut_mass";
  }
  if (kind === "plaza" || kind === "sidewalk") return "commercial_slab_mass";
  if (inCivicMassingField(position)) return "civic_plinth_mass";
  if (inResidentialMassingField(position)) return "residential_shelf_mass";
  if (inCommercialMassingField(position)) return "commercial_slab_mass";
  return "none";
}

function isOnBounds(position: CityWorldPoint, bounds: CityWorldBounds) {
  return position.x === bounds.minX || position.x === bounds.maxX || position.y === bounds.minY || position.y === bounds.maxY;
}

function isNearBounds(position: CityWorldPoint, bounds: CityWorldBounds, distance: number) {
  return (
    position.x <= bounds.minX + distance ||
    position.x >= bounds.maxX - distance ||
    position.y <= bounds.minY + distance ||
    position.y >= bounds.maxY - distance
  );
}

function inCivicMassingField(position: CityWorldPoint) {
  return position.x >= 16 && position.x <= 27 && position.y >= 6 && position.y <= 17;
}

function inCommercialMassingField(position: CityWorldPoint) {
  return (
    (position.x >= 23 && position.x <= 37 && position.y >= 9 && position.y <= 22) ||
    (position.x >= 26 && position.x <= 35 && position.y >= 18 && position.y <= 25)
  );
}

function inResidentialMassingField(position: CityWorldPoint) {
  return (
    (position.x >= 2 && position.x <= 22 && position.y >= 2 && position.y <= 17) ||
    (position.x >= 14 && position.x <= 31 && position.y >= 3 && position.y <= 15) ||
    (position.x >= 6 && position.x <= 26 && position.y >= 11 && position.y <= 20) ||
    (position.x >= 9 && position.x <= 18 && position.y >= 18 && position.y <= 24) ||
    (position.x >= 22 && position.x <= 29 && position.y >= 21 && position.y <= 26)
  );
}

function isCivicShelfEdge(position: CityWorldPoint) {
  return (
    ((position.x === 16 || position.x === 27) && position.y >= 6 && position.y <= 17) ||
    ((position.y === 6 || position.y === 17) && position.x >= 16 && position.x <= 27) ||
    (position.x === 21 && position.y >= 7 && position.y <= 16) ||
    (position.y === 12 && position.x >= 17 && position.x <= 26)
  );
}

function isCommercialShelfEdge(position: CityWorldPoint) {
  return (
    ((position.x === 23 || position.x === 37) && position.y >= 9 && position.y <= 22) ||
    ((position.y === 9 || position.y === 22) && position.x >= 23 && position.x <= 37) ||
    ((position.x === 26 || position.x === 35) && position.y >= 18 && position.y <= 25) ||
    ((position.y === 18 || position.y === 25) && position.x >= 26 && position.x <= 35) ||
    (position.x === 31 && position.y >= 10 && position.y <= 22) ||
    (position.y === 15 && position.x >= 24 && position.x <= 36)
  );
}

function isResidentialShelfEdge(position: CityWorldPoint) {
  return (
    ((position.x === 2 || position.x === 22) && position.y >= 2 && position.y <= 17) ||
    ((position.y === 2 || position.y === 17) && position.x >= 2 && position.x <= 22) ||
    ((position.x === 14 || position.x === 31) && position.y >= 3 && position.y <= 15) ||
    ((position.y === 3 || position.y === 15) && position.x >= 14 && position.x <= 31) ||
    ((position.x === 6 || position.x === 26) && position.y >= 11 && position.y <= 20) ||
    ((position.y === 11 || position.y === 20) && position.x >= 6 && position.x <= 26) ||
    ((position.x === 9 || position.x === 18) && position.y >= 18 && position.y <= 24) ||
    ((position.y === 18 || position.y === 24) && position.x >= 9 && position.x <= 18) ||
    ((position.x === 22 || position.x === 29) && position.y >= 21 && position.y <= 26) ||
    ((position.y === 21 || position.y === 26) && position.x >= 22 && position.x <= 29) ||
    (position.x === 11 && position.y >= 3 && position.y <= 17) ||
    (position.y === 9 && position.x >= 3 && position.x <= 22) ||
    (position.x === 21 && position.y >= 4 && position.y <= 15) ||
    (position.y === 13 && position.x >= 14 && position.x <= 31) ||
    (position.x === 17 && position.y >= 11 && position.y <= 20) ||
    (position.y === 16 && position.x >= 6 && position.x <= 26)
  );
}

function roadVisualGrammar(road: CityWorldRoadSegment): CityWorldVisualGrammar {
  if (road.kind === "crosswalk") return { roadProfile: "paver_crosswalk", contactProfile: "curb_shadow" };
  if (road.kind === "driveway") return { roadProfile: "driveway_cut", contactProfile: "curb_shadow" };
  return { roadProfile: "embedded_asphalt_slab", contactProfile: "curb_shadow" };
}

function lotVisualGrammar(lot: CityWorldLot): CityWorldVisualGrammar {
  const parcelComposition = parcelCompositionProfile(lot);
  const parcelElevation = parcelElevationProfile(lot);
  if (lot.kind === "home") return { lotProfile: lot.id.startsWith("lot-home-") ? "residential_yard_grid" : "home_parcel_pad", parcelComposition, parcelElevation, contactProfile: "parcel_pad_shadow" };
  if (lot.kind === "shop" || lot.kind === "gym") return { lotProfile: "commercial_forecourt", parcelComposition, parcelElevation, contactProfile: "parcel_pad_shadow" };
  if (lot.kind === "civic") return { lotProfile: lot.placeId === "place-eastvale-core" ? "landmark_civic_ground" : "civic_plaza_pad", parcelComposition, parcelElevation, contactProfile: "landmark_base_shadow" };
  if (lot.kind === "apartments") return { lotProfile: "apartment_court", parcelComposition, parcelElevation, contactProfile: "parcel_pad_shadow" };
  if (lot.kind === "waterfront") return { lotProfile: "waterfront_edge", parcelComposition, parcelElevation, contactProfile: "soft_ground_shadow" };
  return { lotProfile: "park_soft_edge", parcelComposition, parcelElevation, contactProfile: "soft_ground_shadow" };
}

function parcelCompositionProfile(lot: CityWorldLot): NonNullable<CityWorldVisualGrammar["parcelComposition"]> {
  if (lot.id.startsWith("draft-lot-")) return "hidden_draft_anchor_pad";
  if (lot.kind === "home") return "home_yard_grid";
  if (lot.kind === "shop" || lot.kind === "gym") return "commercial_apron";
  if (lot.kind === "civic") return "civic_landmark_plinth";
  if (lot.kind === "apartments") return "apartment_court_grid";
  if (lot.kind === "waterfront") return "waterfront_bank";
  return "park_path_basin";
}

function parcelElevationProfile(lot: CityWorldLot): NonNullable<CityWorldVisualGrammar["parcelElevation"]> {
  if (lot.id.startsWith("draft-lot-")) return "hidden_anchor_shelf";
  if (lot.kind === "home") return lot.id.startsWith("lot-home-") ? "raised_home_shelf" : "thin_pad_lip";
  if (lot.kind === "shop" || lot.kind === "gym") return "commercial_slab_lip";
  if (lot.kind === "civic") return "civic_plinth_stack";
  if (lot.kind === "apartments") return "apartment_court_lip";
  if (lot.kind === "waterfront") return "waterfront_bank_cut";
  return "park_basin_lip";
}

function buildingVisualGrammar(
  building: CityWorldBuilding,
  roofShape: CityWorldBuilding["roofShape"],
  facadeStyle: CityWorldBuilding["facadeStyle"],
): CityWorldVisualGrammar {
  const objectFamily = buildingObjectFamily(building, facadeStyle);
  const materialProfile =
    building.kind === "civic"
      ? "civic_glass_stucco"
      : building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront"
        ? "socal_storefront"
        : building.kind === "apartment" || facadeStyle === "lowrise"
          ? "socal_lowrise"
          : facadeStyle === "ranch"
            ? "socal_cool_stucco"
            : facadeStyle === "rowhome"
              ? "socal_stucco_light"
              : "socal_stucco_warm";
  const roofProfile =
    building.kind === "civic"
      ? roofShape === "tower"
        ? "civic_glass_cap"
        : "blue_metal_utility"
      : roofShape === "flat"
        ? "flat_parapet_cap"
        : facadeStyle === "ranch"
          ? "sage_tile"
          : roofShape === "hip"
            ? "cool_clay_tile"
            : roofShape === "sawtooth"
              ? "blue_metal_utility"
              : "terracotta_barrel_tile";

  return {
    materialProfile,
    roofProfile,
    objectFamily,
    clusterRole: buildingClusterRole(building, objectFamily, facadeStyle),
    noLabelPriority: buildingNoLabelPriority(building, objectFamily),
    contactProfile: building.kind === "civic" ? "landmark_base_shadow" : "parcel_pad_shadow",
  };
}

function buildingObjectFamily(
  building: CityWorldBuilding,
  facadeStyle: CityWorldBuilding["facadeStyle"],
): NonNullable<CityWorldVisualGrammar["objectFamily"]> {
  const id = building.id;
  if (id.includes("anaheim-convention-center") || id.includes("angel-stadium")) return "venue_anchor";
  if (id.includes("artic-transit-center") || id.includes("ontario-international-airport")) return "transit_anchor";
  if (id.includes("platinum-triangle") || building.kind === "apartment" || facadeStyle === "lowrise") return "lowrise_cluster";
  if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "commerce_strip";
  if (building.kind === "gym" || facadeStyle === "fitness" || id.includes("downtown-service")) return "service_block";
  if (building.kind === "civic" || facadeStyle === "civic") return "civic_landmark";
  return "residential_kit";
}

function buildingClusterRole(
  building: CityWorldBuilding,
  objectFamily: NonNullable<CityWorldVisualGrammar["objectFamily"]>,
  facadeStyle: CityWorldBuilding["facadeStyle"],
): NonNullable<CityWorldVisualGrammar["clusterRole"]> {
  if (objectFamily === "civic_landmark" || objectFamily === "venue_anchor" || objectFamily === "transit_anchor") return "anchor";
  if (objectFamily === "commerce_strip" || facadeStyle === "rowhome") return "edge";
  if (objectFamily === "lowrise_cluster" || objectFamily === "service_block") return "support";
  if (building.id.includes("north") || building.id.includes("west")) return "fabric";
  return "support";
}

function buildingNoLabelPriority(
  building: CityWorldBuilding,
  objectFamily: NonNullable<CityWorldVisualGrammar["objectFamily"]>,
): NonNullable<CityWorldVisualGrammar["noLabelPriority"]> {
  const id = building.id;
  if (
    id.includes("anaheim-convention-center") ||
    id.includes("artic-transit-center") ||
    id.includes("angel-stadium") ||
    id.includes("platinum-triangle") ||
    id.includes("ontario-international-airport") ||
    id.includes("ontario-mills-commercial-anchor") ||
    id.includes("ontario-civic-center-core")
  ) {
    return "primary_anchor";
  }
  if (id.startsWith("draft-building-") && (objectFamily === "civic_landmark" || objectFamily === "commerce_strip" || objectFamily === "lowrise_cluster")) {
    return "supporting";
  }
  if (id === "building-civic") return "supporting";
  return "none";
}

export function withRoadMetadata(road: CityWorldRoadSegment): CityWorldRoadSegment {
  return {
    ...road,
    spriteKey: `road.${road.kind}.${road.width > 1.8 ? "wide" : "standard"}`,
    paletteKey: road.kind === "crosswalk" ? "road.crosswalk" : road.kind === "driveway" ? "road.driveway" : "road.asphalt",
    detailLevel: road.kind === "crosswalk" ? "high" : "medium",
    visualGrammar: roadVisualGrammar(road),
  };
}

export function withLotMetadata(lot: CityWorldLot): CityWorldLot {
  return {
    ...lot,
    spriteKey: `lot.${lot.kind}.${lot.width > 4 ? "large" : "small"}`,
    paletteKey: `lot.${lot.kind}`,
    detailLevel: lot.kind === "home" ? "medium" : "high",
    visualGrammar: lotVisualGrammar(lot),
  };
}

export function withBuildingMetadata(building: CityWorldBuilding): CityWorldBuilding {
  const variant = hashId(building.id);
  const roofShape =
    building.roofShape ??
    (building.kind === "home"
      ? variant % 3 === 0
        ? "hip"
        : "gable"
      : building.kind === "shop"
        ? "flat"
        : building.kind === "gym"
          ? "sawtooth"
          : building.kind === "apartment"
            ? "hip"
            : "tower");
  const facadeStyle =
    building.facadeStyle ??
    (building.kind === "home"
      ? "suburban"
      : building.kind === "shop"
        ? "storefront"
        : building.kind === "gym"
          ? "fitness"
          : building.kind === "apartment"
            ? "apartment"
            : "civic");

  const buildingWithVisualGrammar: CityWorldBuilding = {
    ...building,
    spriteKey: building.spriteKey ?? resolveBuildingSpriteKey(building, roofShape, facadeStyle, variant),
    paletteKey: building.paletteKey ?? resolveBuildingPaletteKey(building, facadeStyle, variant),
    roofShape,
    facadeStyle,
    detailLevel: building.detailLevel ?? (building.kind === "home" ? "medium" : "high"),
    visualGrammar: buildingVisualGrammar(building, roofShape, facadeStyle),
  };

  return {
    ...buildingWithVisualGrammar,
    objectKit: assignCityWorldObjectKit(buildingWithVisualGrammar),
  };
}

function resolveBuildingSpriteKey(building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"], facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
  if (building.kind === "home" && facadeStyle === "cottage") return "building.house.cottage.front_gable.v1";
  if (building.kind === "home" && facadeStyle === "ranch") return "building.house.ranch.low_gable.v1";
  if (building.kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
  if (building.kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
  if (building.kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
  return `building.${building.kind}.${roofShape}.${variant % 4}`;
}

// Number of authored palette-variant ramps available per family in the atlas
// manifest. Identity is assigned from the palette system (hash -> variant) so
// it survives the renderer's manifest-palette resolution — the 0.34e cohesion
// contract stays intact because every ramp is an authored muted SoCal palette,
// not a raw per-building color override.
const BUILDING_PALETTE_VARIANT_COUNTS = {
  cottage: 4,
  ranch: 3,
  rowhome: 2,
  lowrise: 3,
  strip_store: 3,
  gym: 2,
} as const;

function paletteVariantSuffix(variant: number, count: number): string {
  return `v${(variant % count) + 1}`;
}

function resolveBuildingPaletteKey(building: CityWorldBuilding, facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
  if (building.kind === "home" && facadeStyle === "cottage") return `building.house.cottage.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.cottage)}`;
  if (building.kind === "home" && facadeStyle === "ranch") return `building.house.ranch.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.ranch)}`;
  if (building.kind === "home" && facadeStyle === "rowhome") return `building.house.rowhome.flat_parapet.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.rowhome)}`;
  if (building.kind === "home" && facadeStyle) return `building.house.${facadeStyle}.v1`;
  if (building.kind === "shop" && facadeStyle === "strip_store") return `building.store.strip.three_bay.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.strip_store)}`;
  if (building.kind === "apartment" && facadeStyle === "lowrise") return `building.apartment.lowrise.stepped.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.lowrise)}`;
  if (building.kind === "gym") return `building.gym.sawtooth.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.gym)}`;
  return `building.${building.kind}.${variant % 6}`;
}

export function withPropMetadata(prop: CityWorldProp): CityWorldProp {
  return {
    ...prop,
    spriteKey: `prop.${prop.kind}.${prop.variant}`,
    paletteKey: `prop.${prop.kind}`,
    detailLevel: prop.kind === "cloud" ? "low" : prop.kind === "water_shimmer" ? "medium" : "high",
  };
}

function withActorMetadata(actor: CityWorldActor): CityWorldActor {
  return {
    ...actor,
    spriteKey: `actor.${actor.kind}.${actor.id.split("-").slice(1, 3).join("-")}`,
    paletteKey: `actor.${actor.kind}`,
    detailLevel: actor.kind === "clawd" ? "high" : "medium",
  };
}

function hashId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash;
}
