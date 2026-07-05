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
  | "cottage"
  | "ranch"
  | "rowhome"
  | "storefront"
  | "strip_store"
  | "fitness"
  | "apartment"
  | "lowrise"
  | "civic"
  | "park"
  | "waterfront";

export type CityWorldAtlasMetadata = {
  spriteKey?: string;
  paletteKey?: string;
  detailLevel?: CityWorldDetailLevel;
};

export type CityWorldTerrainProfile =
  | "quiet_socal_grass"
  | "neighborhood_parcel_field"
  | "landmark_civic_ground"
  | "civic_green"
  | "commercial_plaza"
  | "water_edge"
  | "shell_grid";

export type CityWorldTerrainCompositionProfile =
  | "quiet_field"
  | "neighborhood_yard_fabric"
  | "civic_focus_field"
  | "commercial_apron_field"
  | "park_basin"
  | "waterfront_edge_strata"
  | "shell_boundary"
  | "hidden_draft_field";

export type CityWorldTerrainElevationProfile =
  | "flat_field"
  | "raised_parcel_shelf"
  | "civic_plinth_shelf"
  | "commercial_slab_field"
  | "park_basin_shelf"
  | "water_edge_cut"
  | "shell_flat"
  | "hidden_draft_shelf";

export type CityWorldChunkEdgeProfile =
  | "none"
  | "world_edge"
  | "parcel_cluster_edge"
  | "waterfront_bank_edge"
  | "park_basin_edge"
  | "hidden_draft_boundary";

export type CityWorldTerrainChunkMassingProfile =
  | "none"
  | "outer_world_edge_mass"
  | "civic_plinth_mass"
  | "residential_shelf_mass"
  | "commercial_slab_mass"
  | "park_basin_cut_mass"
  | "waterfront_bank_cut_mass"
  | "shell_boundary_mass"
  | "hidden_draft_mass";

export type CityWorldRoadProfile = "embedded_asphalt_slab" | "driveway_cut" | "paver_crosswalk";

export type CityWorldLotProfile =
  | "home_parcel_pad"
  | "residential_yard_grid"
  | "commercial_forecourt"
  | "landmark_civic_ground"
  | "civic_plaza_pad"
  | "apartment_court"
  | "park_soft_edge"
  | "waterfront_edge";

export type CityWorldParcelCompositionProfile =
  | "home_yard_grid"
  | "commercial_apron"
  | "civic_landmark_plinth"
  | "apartment_court_grid"
  | "park_path_basin"
  | "waterfront_bank"
  | "hidden_draft_anchor_pad";

export type CityWorldParcelElevationProfile =
  | "thin_pad_lip"
  | "raised_home_shelf"
  | "commercial_slab_lip"
  | "civic_plinth_stack"
  | "apartment_court_lip"
  | "park_basin_lip"
  | "waterfront_bank_cut"
  | "hidden_anchor_shelf";

export type CityWorldBuildingMaterialProfile =
  | "socal_stucco_warm"
  | "socal_stucco_light"
  | "socal_cool_stucco"
  | "socal_storefront"
  | "socal_lowrise"
  | "civic_glass_stucco";

export type CityWorldRoofMaterialProfile =
  | "terracotta_barrel_tile"
  | "cool_clay_tile"
  | "sage_tile"
  | "flat_parapet_cap"
  | "blue_metal_utility"
  | "civic_glass_cap";

export type CityWorldContactProfile = "soft_ground_shadow" | "parcel_pad_shadow" | "curb_shadow" | "landmark_base_shadow";

// ---- Unified ground contact grammar (0.52E Diorama Engine) -----------------
// Contact treatment is authored by the COMPILER as typed metadata and consumed
// uniformly by the renderer. Draw-time `kind` branching and id-prefix sniffing
// ("draft-", "shell-") are legacy fallbacks that live only in the resolver
// functions, never in draw code.

export type CityWorldTileEdge = "north" | "east" | "south" | "west";

export type CityWorldGroundTone = "public" | "draft" | "shell";

export type CityWorldRoadContactProfile = "embedded" | "apron" | "painted";

export type CityWorldRoadLaneMarking = "avenue_dash" | "street_dash" | "apron_dash" | "none";

export type CityWorldRoadContactGrammar = {
  profile: CityWorldRoadContactProfile;
  tone: CityWorldGroundTone;
  laneMarking: CityWorldRoadLaneMarking;
};

export type CityWorldLotContactProfile = "foundation" | "apron" | "green" | "shore";

export type CityWorldLotContactGrammar = {
  profile: CityWorldLotContactProfile;
  tone: CityWorldGroundTone;
  /** Which lot edge carries the curb-cut / walk join toward the serving road. */
  curbCutEdge?: CityWorldTileEdge;
};

export type CityWorldTerrainContactGrammar = {
  tone: CityWorldGroundTone;
  /** Tile sits at a material boundary and casts a soft contact drop. */
  contactShadow: boolean;
  /** Edges where the tile kind changes (parcel/plaza/park seams). */
  edgeSides?: CityWorldTileEdge[];
  /** Edges that border water (bank/strand treatment). */
  waterEdgeSides?: CityWorldTileEdge[];
};

export type CityWorldObjectFamily =
  | "residential_kit"
  | "commerce_strip"
  | "civic_landmark"
  | "lowrise_cluster"
  | "service_block"
  | "venue_anchor"
  | "transit_anchor";

export type CityWorldClusterRole = "anchor" | "support" | "fabric" | "edge";

export type CityWorldNoLabelPriority = "none" | "supporting" | "primary_anchor";

export type CityWorldObjectKitPrefabFamily =
  | "civic_landmark"
  | "residential_cottage"
  | "residential_ranch"
  | "residential_rowhome"
  | "commerce_strip"
  | "lowrise_apartment"
  | "service_gym";

export type CityWorldObjectKitPaletteRole =
  | "stucco"
  | "terracotta"
  | "glass"
  | "asphalt"
  | "curb"
  | "vegetation"
  | "foundation";

export type CityWorldCommerceStripPrefabGeometry = {
  bayCount: number;
  signMountCount: number;
  apronDepth: number;
  glassRecessDepth: number;
  parapetWeight: number;
  focusTarget?: "plaza_row";
};

export type CityWorldCivicLandmarkPrefabGeometry = {
  plinthTierCount: number;
  entryBayCount: number;
  facadePierCount: number;
  glassBandCount: number;
  roofCapWeight: number;
  civicCanopyDepth: number;
  focusTarget?: "eastvale_core";
};

export type CityWorldServiceGymPrefabGeometry = {
  serviceBayCount: number;
  sawtoothCount: number;
  entryRecessDepth: number;
  utilityApronDepth: number;
  roofMonitorWeight: number;
  focusTarget?: "eastvale_gym";
};

export type CityWorldObjectKitMetadata = {
  prefabFamily: CityWorldObjectKitPrefabFamily;
  paletteRoles: CityWorldObjectKitPaletteRole[];
  cloneGroupKey: string;
  signatureTags: string[];
  roofBodySeparationScore: number;
  landmarkSignatureScore?: number;
  commerceGeometry?: CityWorldCommerceStripPrefabGeometry;
  civicGeometry?: CityWorldCivicLandmarkPrefabGeometry;
  serviceGeometry?: CityWorldServiceGymPrefabGeometry;
};

export type CityWorldVisualGrammar = {
  terrainProfile?: CityWorldTerrainProfile;
  terrainComposition?: CityWorldTerrainCompositionProfile;
  terrainElevation?: CityWorldTerrainElevationProfile;
  chunkEdge?: CityWorldChunkEdgeProfile;
  terrainChunkMassing?: CityWorldTerrainChunkMassingProfile;
  roadProfile?: CityWorldRoadProfile;
  lotProfile?: CityWorldLotProfile;
  parcelComposition?: CityWorldParcelCompositionProfile;
  parcelElevation?: CityWorldParcelElevationProfile;
  materialProfile?: CityWorldBuildingMaterialProfile;
  roofProfile?: CityWorldRoofMaterialProfile;
  objectFamily?: CityWorldObjectFamily;
  clusterRole?: CityWorldClusterRole;
  noLabelPriority?: CityWorldNoLabelPriority;
  contactProfile: CityWorldContactProfile;
  roadContact?: CityWorldRoadContactGrammar;
  lotContact?: CityWorldLotContactGrammar;
  terrainContact?: CityWorldTerrainContactGrammar;
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
  id: "desktop" | "mobile" | "residential_detail" | "commerce_detail";
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
  visualGrammar?: CityWorldVisualGrammar;
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
  visualGrammar?: CityWorldVisualGrammar;
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
  visualGrammar?: CityWorldVisualGrammar;
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
  visualGrammar?: CityWorldVisualGrammar;
  objectKit?: CityWorldObjectKitMetadata;
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

export type CityWorldCoverage = {
  countySlug: string;
  coverageTier: "L0_UNSUPPORTED" | "L1_COUNTY_SHELL" | "L2_CURATED_DISTRICT" | "L3_PROVIDER_NORMALIZED" | "L4_PUBLIC_QUALITY";
  coverageLabel: string;
  coverageMessage: string;
  playable: boolean;
};

export type CityWorldScene = {
  type: "cityWorldScene";
  id: string;
  sourceSceneId: VoxelScene["id"];
  label: string;
  coverage?: CityWorldCoverage;
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
