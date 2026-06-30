import type { VoxelAmbientState, VoxelNote, VoxelPlaceKind, VoxelScene, VoxelSticker, VoxelStickerKind } from "./types.js";

export type CityWorldPoint = {
  x: number;
  y: number;
  z: number;
};

export type CityWorldDetailLevel = "low" | "medium" | "high";

export type CityWorldRoofShape = "gable" | "hip" | "flat" | "sawtooth" | "tower";

export type CityWorldFacadeStyle =
  | "suburban"
  | "storefront"
  | "fitness"
  | "apartment"
  | "civic"
  | "park"
  | "waterfront";

export type CityWorldAtlasMetadata = {
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldRegion = {
  country: string;
  state: string;
  county: string;
  district: string;
};

export type CityWorldBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CityWorldCameraPreset = {
  id: "desktop" | "mobile";
  center: CityWorldPoint;
  zoom: number;
  minZoom: number;
  maxZoom: number;
};

export type CityWorldTerrainKind = "grass" | "park" | "plaza" | "water" | "sidewalk";

export type CityWorldTerrainTile = {
  id: string;
  kind: CityWorldTerrainKind;
  position: CityWorldPoint;
  width: number;
  depth: number;
  variant: number;
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldRoadKind = "street" | "avenue" | "driveway" | "crosswalk";

export type CityWorldRoadSegment = {
  id: string;
  kind: CityWorldRoadKind;
  from: CityWorldPoint;
  to: CityWorldPoint;
  width: number;
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldLotKind = "home" | "shop" | "park" | "gym" | "apartments" | "civic" | "waterfront";

export type CityWorldLot = {
  id: string;
  kind: CityWorldLotKind;
  label: string;
  position: CityWorldPoint;
  width: number;
  depth: number;
  placeId?: string;
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldBuildingKind = "home" | "shop" | "gym" | "apartment" | "civic";

export type CityWorldBuilding = {
  id: string;
  kind: CityWorldBuildingKind;
  label: string;
  position: CityWorldPoint;
  width: number;
  depth: number;
  height: number;
  bodyColor: string;
  roofColor: string;
  placeId?: string;
  spriteKey?: string;
  paletteKey?: string;
  roofShape?: CityWorldRoofShape;
  facadeStyle?: CityWorldFacadeStyle;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldPropKind =
  | "tree"
  | "bush"
  | "bench"
  | "streetlight"
  | "fountain"
  | "sign"
  | "parked_car"
  | "water_shimmer"
  | "cloud";

export type CityWorldProp = {
  id: string;
  kind: CityWorldPropKind;
  position: CityWorldPoint;
  variant: number;
  placeId?: string;
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldPlace = {
  id: string;
  label: string;
  kind: VoxelPlaceKind;
  districtId: string;
  nodeId: string;
  anchor: CityWorldPoint;
  hitRadius: number;
  description: string;
  activity: number;
  labelPriority: number;
};

export type CityWorldPin = {
  id: string;
  placeId: string;
  kind: VoxelStickerKind | "note";
  label: string;
  anchor: CityWorldPoint;
  noteId?: string;
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldActorKind = "car" | "walker" | "clawd";

export type CityWorldActor = {
  id: string;
  kind: CityWorldActorKind;
  color: string;
  position: CityWorldPoint;
  path: CityWorldPoint[];
  speed: number;
  phase: number;
  placeId?: string;
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldAmbient = VoxelAmbientState & {
  clouds: number;
  waterShimmer: number;
};

export type CityWorldHudDefaults = {
  locationLabel: string;
  districtLabel: string;
  selectedPlaceId: string;
};

export type CityWorldScene = {
  type: "cityWorldScene";
  id: string;
  sourceSceneId: VoxelScene["id"];
  label: string;
  region: CityWorldRegion;
  bounds: CityWorldBounds;
  cameraPresets: CityWorldCameraPreset[];
  terrainTiles: CityWorldTerrainTile[];
  roadSegments: CityWorldRoadSegment[];
  lots: CityWorldLot[];
  buildings: CityWorldBuilding[];
  props: CityWorldProp[];
  places: CityWorldPlace[];
  pins: CityWorldPin[];
  actors: CityWorldActor[];
  ambient: CityWorldAmbient;
  hudDefaults: CityWorldHudDefaults;
};

export type CityWorldSessionState = {
  selectedDistrictId?: string | undefined;
  selectedPlaceId?: string | undefined;
  stickers?: VoxelSticker[];
  notes?: VoxelNote[];
};
