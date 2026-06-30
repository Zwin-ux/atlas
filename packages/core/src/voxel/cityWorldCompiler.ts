import type {
  CityWorldActor,
  CityWorldBuilding,
  CityWorldLot,
  CityWorldPin,
  CityWorldPlace,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldSessionState,
  CityWorldTerrainKind,
  CityWorldTerrainTile,
} from "./cityWorldTypes.js";
import type { VoxelPlace, VoxelScene } from "./types.js";
import { validateVoxelWorld } from "./mapSession.js";

const CITY_BOUNDS = { minX: 0, minY: 0, maxX: 42, maxY: 30 };

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
        center: { x: 21, y: 15, z: 0 },
        zoom: 1.05,
        minZoom: 0.62,
        maxZoom: 1.8,
      },
      {
        id: "mobile",
        center: { x: 22, y: 15, z: 0 },
        zoom: 0.82,
        minZoom: 0.52,
        maxZoom: 1.55,
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
      clouds: 0.34,
      waterShimmer: 0.72,
    },
    hudDefaults: {
      locationLabel: scene.county.name,
      districtLabel,
      selectedPlaceId,
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

function createTerrainTiles(): CityWorldTerrainTile[] {
  const tiles: CityWorldTerrainTile[] = [];

  for (let y = 0; y <= 30; y += 1) {
    for (let x = 0; x <= 42; x += 1) {
      const inPark = x >= 14 && x <= 21 && y >= 17 && y <= 23;
      const inPlaza = x >= 25 && x <= 34 && y >= 11 && y <= 17;
      const inWater = (x >= 34 && y >= 23) || (x >= 37 && y >= 18);
      const kind: CityWorldTerrainKind = inWater ? "water" : inPark ? "park" : inPlaza ? "plaza" : (x + y) % 7 === 0 ? "sidewalk" : "grass";
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
    { id: "cross-eastvale-core", kind: "crosswalk", from: { x: 20, y: 13, z: 0 }, to: { x: 23, y: 13, z: 0 }, width: 0.45 },
    { id: "cross-plaza", kind: "crosswalk", from: { x: 31, y: 13, z: 0 }, to: { x: 31, y: 16, z: 0 }, width: 0.45 },
  ];

  return roads.map((road) => ({
    ...road,
    spriteKey: `road.${road.kind}.${road.width > 1.8 ? "wide" : "standard"}`,
    paletteKey: road.kind === "crosswalk" ? "road.crosswalk" : road.kind === "driveway" ? "road.driveway" : "road.asphalt",
    detailLevel: road.kind === "crosswalk" ? "high" : "medium",
  }));
}

function createLots(): CityWorldLot[] {
  const lots: CityWorldLot[] = [
    { id: "lot-civic", kind: "civic", label: "Civic green", position: { x: 21, y: 10.5, z: 0 }, width: 5.6, depth: 4.2, placeId: "place-eastvale-core" },
    { id: "lot-plaza", kind: "shop", label: "Plaza row", position: { x: 28, y: 12.6, z: 0 }, width: 7.6, depth: 4.4, placeId: "place-plaza-row" },
    { id: "lot-gym", kind: "gym", label: "Gym block", position: { x: 31.4, y: 15.5, z: 0 }, width: 4.2, depth: 3.2, placeId: "place-eastvale-gym" },
    { id: "lot-apartments", kind: "apartments", label: "Apartment courts", position: { x: 32, y: 21.8, z: 0 }, width: 6.4, depth: 4.6, placeId: "place-eastvale-apartments" },
    { id: "lot-park", kind: "park", label: "Community park", position: { x: 18, y: 20, z: 0 }, width: 7.5, depth: 6.4, placeId: "place-community-park" },
    { id: "lot-water", kind: "waterfront", label: "Water edge", position: { x: 37, y: 24, z: 0 }, width: 6, depth: 6 },
  ];

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
      width: 3.8,
      depth: 2.8,
      height: 2.9,
      bodyColor: "#f3dfbd",
      roofColor: "#5d8fa8",
      placeId: "place-eastvale-core",
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
      roofColor: "#e05d45",
      placeId: "place-eastvale-gym",
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
    },
  ];

  const homeRoofs = ["#d95f45", "#4f92b8", "#6da76f", "#e0bd4e", "#b98352", "#895c9e"];
  const homeBodies = ["#f5e6ca", "#f1dcb9", "#ecd1ae", "#fff0cf"];
  let homeIndex = 0;

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      buildings.push({
        id: `building-home-west-${row}-${col}`,
        kind: "home",
        label: "Home",
        position: { x: 6 + col * 2.2, y: 6.5 + row * 2, z: 0 },
        width: 1.25,
        depth: 1.05,
        height: 1.15 + ((row + col) % 2) * 0.25,
        bodyColor: homeBodies[homeIndex % homeBodies.length] ?? "#f5e6ca",
        roofColor: homeRoofs[homeIndex % homeRoofs.length] ?? "#d95f45",
        placeId: "place-neighborhood-blocks",
      });
      homeIndex += 1;
    }
  }

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      buildings.push({
        id: `building-home-north-${row}-${col}`,
        kind: "home",
        label: "Home",
        position: { x: 16 + col * 1.9, y: 5.5 + row * 1.8, z: 0 },
        width: 1.1,
        depth: 1,
        height: 1.05 + ((row + col) % 3) * 0.18,
        bodyColor: homeBodies[homeIndex % homeBodies.length] ?? "#f5e6ca",
        roofColor: homeRoofs[homeIndex % homeRoofs.length] ?? "#4f92b8",
        placeId: "place-neighborhood-blocks",
      });
      homeIndex += 1;
    }
  }

  const shops = [
    { id: "shop-market", label: "Market", x: 26, y: 12.2, roof: "#73a7d6" },
    { id: "shop-cafe", label: "Cafe", x: 28.4, y: 12.2, roof: "#e3a64a" },
    { id: "shop-salon", label: "Shop", x: 30.8, y: 12.2, roof: "#d96b7a" },
    { id: "shop-corner", label: "Corner shop", x: 33, y: 12.2, roof: "#6fb79c" },
  ];

  for (const shop of shops) {
    buildings.push({
      id: `building-${shop.id}`,
      kind: "shop",
      label: shop.label,
      position: { x: shop.x, y: shop.y, z: 0 },
      width: 1.8,
      depth: 1.5,
      height: 1.55,
      bodyColor: "#f2dfc2",
      roofColor: shop.roof,
      placeId: "place-plaza-row",
    });
  }

  return buildings.map(withBuildingMetadata);
}

function createProps(): CityWorldProp[] {
  const props: CityWorldProp[] = [
    { id: "prop-fountain", kind: "fountain", position: { x: 18, y: 20.2, z: 0 }, variant: 0, placeId: "place-community-park" },
    { id: "prop-plaza-sign", kind: "sign", position: { x: 28, y: 14.8, z: 0 }, variant: 1, placeId: "place-plaza-row" },
    { id: "prop-gym-sign", kind: "sign", position: { x: 32.8, y: 15.5, z: 0 }, variant: 2, placeId: "place-eastvale-gym" },
    { id: "prop-civic-sign", kind: "sign", position: { x: 22.8, y: 11.8, z: 0 }, variant: 3, placeId: "place-eastvale-core" },
    { id: "prop-water-shimmer-a", kind: "water_shimmer", position: { x: 36, y: 24, z: 0 }, variant: 0 },
    { id: "prop-water-shimmer-b", kind: "water_shimmer", position: { x: 39, y: 26, z: 0 }, variant: 1 },
    { id: "prop-water-shimmer-c", kind: "water_shimmer", position: { x: 38.5, y: 21.5, z: 0 }, variant: 2 },
    { id: "prop-cloud-a", kind: "cloud", position: { x: 8, y: 2, z: 6 }, variant: 0 },
    { id: "prop-cloud-b", kind: "cloud", position: { x: 30, y: 3, z: 7 }, variant: 1 },
    { id: "prop-bench-park-a", kind: "bench", position: { x: 16, y: 19.2, z: 0 }, variant: 0, placeId: "place-community-park" },
    { id: "prop-bench-park-b", kind: "bench", position: { x: 19.4, y: 21.4, z: 0 }, variant: 1, placeId: "place-community-park" },
    { id: "prop-bench-plaza", kind: "bench", position: { x: 29.5, y: 14.2, z: 0 }, variant: 2, placeId: "place-plaza-row" },
    { id: "prop-parked-car-plaza-red", kind: "parked_car", position: { x: 26.7, y: 15.4, z: 0 }, variant: 0, placeId: "place-plaza-row" },
    { id: "prop-parked-car-plaza-blue", kind: "parked_car", position: { x: 29.8, y: 15.7, z: 0 }, variant: 1, placeId: "place-plaza-row" },
    { id: "prop-parked-car-gym", kind: "parked_car", position: { x: 34, y: 16.5, z: 0 }, variant: 2, placeId: "place-eastvale-gym" },
    { id: "prop-parked-car-civic", kind: "parked_car", position: { x: 19.2, y: 12.2, z: 0 }, variant: 3, placeId: "place-eastvale-core" },
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

  for (let i = 0; i < 9; i += 1) {
    props.push({
      id: `prop-streetlight-${i}`,
      kind: "streetlight",
      position: { x: 8 + i * 3.2, y: i % 2 === 0 ? 13.8 : 12.2, z: 0 },
      variant: i % 3,
    });
  }

  for (let i = 0; i < 7; i += 1) {
    props.push({
      id: `prop-limonite-light-${i}`,
      kind: "streetlight",
      position: { x: 10 + i * 3.6, y: i % 2 === 0 ? 21.8 : 20.2, z: 0 },
      variant: (i + 1) % 3,
    });
  }

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
      id: "actor-car-hamner-red",
      kind: "car",
      color: "#d94c42",
      position: { x: 7, y: 13, z: 0 },
      path: [
        { x: 5, y: 13, z: 0 },
        { x: 37, y: 13, z: 0 },
      ],
      speed: 0.055,
      phase: 0.1,
    },
    {
      id: "actor-car-limonite-blue",
      kind: "car",
      color: "#3c7fb5",
      position: { x: 34, y: 21, z: 0 },
      path: [
        { x: 34, y: 21, z: 0 },
        { x: 8, y: 21, z: 0 },
      ],
      speed: 0.043,
      phase: 0.46,
    },
    {
      id: "actor-car-scholar-yellow",
      kind: "car",
      color: "#e0b84b",
      position: { x: 24, y: 7, z: 0 },
      path: [
        { x: 24, y: 7, z: 0 },
        { x: 24, y: 24, z: 0 },
      ],
      speed: 0.038,
      phase: 0.72,
    },
    {
      id: "actor-car-citrus-green",
      kind: "car",
      color: "#5ca96a",
      position: { x: 13, y: 20, z: 0 },
      path: [
        { x: 13, y: 24, z: 0 },
        { x: 13, y: 6, z: 0 },
      ],
      speed: 0.034,
      phase: 0.29,
    },
    {
      id: "actor-car-sumner-cream",
      kind: "car",
      color: "#f1d36d",
      position: { x: 32, y: 9, z: 0 },
      path: [
        { x: 32, y: 8, z: 0 },
        { x: 32, y: 24, z: 0 },
      ],
      speed: 0.032,
      phase: 0.61,
    },
    {
      id: "actor-walker-park-a",
      kind: "walker",
      color: "#3f7f58",
      position: { x: 17, y: 19, z: 0 },
      path: [
        { x: 15, y: 18, z: 0 },
        { x: 19, y: 18, z: 0 },
        { x: 20, y: 22, z: 0 },
        { x: 16, y: 22, z: 0 },
      ],
      speed: 0.02,
      phase: 0.18,
      placeId: "place-community-park",
    },
    {
      id: "actor-walker-plaza-a",
      kind: "walker",
      color: "#9b5c74",
      position: { x: 28, y: 14, z: 0 },
      path: [
        { x: 26, y: 14, z: 0 },
        { x: 33, y: 14, z: 0 },
      ],
      speed: 0.025,
      phase: 0.52,
      placeId: "place-plaza-row",
    },
    {
      id: "actor-walker-gym-a",
      kind: "walker",
      color: "#426f9f",
      position: { x: 32, y: 16.2, z: 0 },
      path: [
        { x: 30, y: 15.8, z: 0 },
        { x: 34, y: 15.8, z: 0 },
      ],
      speed: 0.021,
      phase: 0.78,
      placeId: "place-eastvale-gym",
    },
    {
      id: "actor-walker-civic-a",
      kind: "walker",
      color: "#8b6542",
      position: { x: 21.8, y: 12.2, z: 0 },
      path: [
        { x: 19.5, y: 12, z: 0 },
        { x: 23.5, y: 12, z: 0 },
      ],
      speed: 0.018,
      phase: 0.34,
      placeId: "place-eastvale-core",
    },
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

function withLotMetadata(lot: CityWorldLot): CityWorldLot {
  return {
    ...lot,
    spriteKey: `lot.${lot.kind}.${lot.width > 4 ? "large" : "small"}`,
    paletteKey: `lot.${lot.kind}`,
    detailLevel: lot.kind === "home" ? "medium" : "high",
  };
}

function withBuildingMetadata(building: CityWorldBuilding): CityWorldBuilding {
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

  return {
    ...building,
    spriteKey: `building.${building.kind}.${roofShape}.${variant % 4}`,
    paletteKey: `building.${building.kind}.${variant % 6}`,
    roofShape,
    facadeStyle,
    detailLevel: building.kind === "home" ? "medium" : "high",
  };
}

function withPropMetadata(prop: CityWorldProp): CityWorldProp {
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
