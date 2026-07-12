import type {
  CityWorldBounds,
  CityWorldBuilding,
  CityWorldLot,
  CityWorldPlace,
  CityWorldPoint,
  CityWorldProp,
  CityWorldRoadSegment,
  CityWorldScene,
  CityWorldTerrainKind,
  CityWorldTerrainTile,
  CityWorldTileEdge,
  CityWorldTileElevationGrammar,
  CityWorldVisualGrammar,
} from "./cityWorldTypes.js";
import {
  withGeneratedBuildingAttachmentGeometry,
  withBuildingMetadata,
  withCityWorldTerrainContactMetadata,
  withLotMetadata,
  withPropMetadata,
  withRoadMetadata,
} from "./cityWorldCompiler.js";
import {
  CITY_WORLD_TILE_BASIS,
  cityWorldClamp,
  cityWorldPointInsideFootprint,
  cityWorldPointInsideFrame,
  cityWorldSegmentTouchesFrame,
  cityWorldViewportFrameForCameraPreset,
} from "./cityWorldBasis.js";
import { resolveRegionalBuildingPalette, regionalTerrainPaletteKey, type RegionalPalette } from "./cityWorldRegionalPalettes.js";
import type { CountyGenerationParameters, NameSignal } from "./cityWorldCountyParameters.js";
import type { GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";

/**
 * Parametric scene-generator seam.
 *
 * This is the reusable primitive that makes arbitrary locations voxelizable: a
 * compact, provider-free spec (an elevation/height grid, road seeds, and
 * land-use zones) is expanded into a fully enriched {@link CityWorldScene} by
 * running bare positioned primitives through the SAME generator-agnostic
 * enrichment decorators the hand-authored Eastvale path uses
 * ({@link withBuildingMetadata}, {@link withLotMetadata}, {@link withRoadMetadata},
 * {@link withPropMetadata}). Only terrain visual-grammar is computed here,
 * because the hand-authored terrain grammar is bound to the fixed Eastvale
 * field predicates; everything downstream of a positioned primitive is shared.
 *
 * The spec consumes curated/synthetic input only — it never touches provider
 * geometry.
 */

export type CityWorldZoneKind =
  | "residential"
  | "commercial"
  | "civic"
  | "apartments"
  | "gym"
  | "park"
  | "water"
  | "plaza"
  | "farm_field"
  | "plaza_paving"
  | "civic_forecourt"
  | "dry_wash"
  | "meadow"
  | "scree"
  | "shore_bank"
  | "green_common";

export type CityWorldZoneSpec = {
  id: string;
  kind: CityWorldZoneKind;
  /** Zone rectangle in tile coordinates (inclusive). */
  rect: { minX: number; minY: number; maxX: number; maxY: number };
  label?: string;
  /** Optional local elevation bump applied to buildings/lots in this zone. */
  elevationBoost?: number;
  /** Density hint (0..1) controlling how many parcels are packed into the zone. */
  density?: number;
};

export type CityWorldRoadSeed = {
  id: string;
  kind: CityWorldRoadSegment["kind"];
  from: { x: number; y: number };
  to: { x: number; y: number };
  width?: number;
};

export type CityWorldParametricSpec = {
  id: string;
  label: string;
  region: { country: string; state: string; county: string; district: string };
  /** Grid size in tiles. */
  size: { width: number; height: number };
  /**
   * Optional coarse height grid (row-major, indexed [y][x] in cells of
   * `heightGrid.cellSize` tiles). Values are relative elevation 0..1 and shape
   * terrain shelf/basin massing. When omitted the generator infers relief from
   * zones alone.
   */
  heightGrid?: { cellSize: number; values: number[][] };
  zones: CityWorldZoneSpec[];
  roadSeeds: CityWorldRoadSeed[];
  /**
   * Optional compiler-authored regional palette for generated districts. When
   * absent, the legacy kind-keyed template pools and terrain keys are used.
   */
  regionalPalette?: RegionalPalette;
  /**
   * Optional generated-county parameter spine. When present, signature
   * landmarks are selected from the resolved county parameters instead of
   * re-deriving identity from a flat archetype bucket.
   */
  countyParameters?: CountyGenerationParameters;
  /** Optional deterministic seed for parcel jitter. Defaults to 1. */
  seed?: number;
};

export type CityWorldParametricResult = {
  scene: CityWorldScene;
  stats: {
    terrainTiles: number;
    roads: number;
    lots: number;
    buildings: number;
    props: number;
    zones: number;
  };
};

const ZONE_TO_TERRAIN: Record<CityWorldZoneKind, CityWorldTerrainKind> = {
  residential: "grass",
  commercial: "plaza",
  civic: "grass",
  apartments: "grass",
  gym: "plaza",
  park: "park",
  water: "water",
  plaza: "plaza",
  farm_field: "grass",
  plaza_paving: "plaza",
  civic_forecourt: "plaza",
  dry_wash: "plaza",
  meadow: "park",
  scree: "plaza",
  shore_bank: "plaza",
  green_common: "park",
};

const ZONE_TO_LOT: Record<CityWorldZoneKind, CityWorldLot["kind"] | null> = {
  residential: "home",
  commercial: "shop",
  civic: "civic",
  apartments: "apartments",
  gym: "gym",
  park: "park",
  water: "waterfront",
  plaza: null,
  farm_field: null,
  plaza_paving: null,
  civic_forecourt: null,
  dry_wash: null,
  meadow: null,
  scree: null,
  shore_bank: null,
  green_common: null,
};

export function generateParametricCityWorldScene(spec: CityWorldParametricSpec): CityWorldParametricResult {
  const bounds: CityWorldBounds = { minX: 0, minY: 0, maxX: spec.size.width, maxY: spec.size.height };
  const rng = mulberry32(spec.seed ?? 1);

  const roadSegments = spec.roadSeeds.map((seed) =>
    withRoadMetadata({
      id: seed.id,
      kind: seed.kind,
      from: { x: seed.from.x, y: seed.from.y, z: 0 },
      to: { x: seed.to.x, y: seed.to.y, z: 0 },
      width: seed.width ?? defaultRoadWidth(seed.kind),
    }),
  );
  const elevationModel = createParametricElevationModel(spec, bounds, roadSegments);
  const terrainTiles = createParametricTerrain(spec, bounds, elevationModel);
  // Roads render at the elevation of the ground they cross (corridor rule
  // keeps both endpoints on the same level for grid-aligned seeds).
  for (const road of roadSegments) {
    road.from.z = elevationModel.tileZ(Math.round(road.from.x), Math.round(road.from.y));
    road.to.z = elevationModel.tileZ(Math.round(road.to.x), Math.round(road.to.y));
  }

  const lots: CityWorldLot[] = [];
  const buildings: CityWorldBuilding[] = [];
  const places: CityWorldPlace[] = [];
  const props: CityWorldProp[] = [];

  // Corner stores face the district's central mass.
  const boardCenter = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const appendZoneProps = (zone: CityWorldZoneSpec): void => {
    for (const prop of zonePropsForZone(zone, rng, spec, roadSegments)) {
      if (prop.kind !== "water_shimmer" && prop.kind !== "boat" && prop.kind !== "dock") {
        prop.position.z = elevationModel.tileZ(Math.round(prop.position.x), Math.round(prop.position.y));
      }
      props.push(prop);
    }
  };

  let placeIndex = 0;
  for (const zone of spec.zones) {
    const lotKind = ZONE_TO_LOT[zone.kind];
    if (!lotKind) {
      if (standaloneZonePropsEnabled(zone, spec)) appendZoneProps(zone);
      continue;
    }
    const placeId = `gen-place-${zone.id}`;
    // Safety net for arbitrary specs: a parcel that would put its building in
    // a road corridor is dropped. Soft zones (park/water) may host embedded
    // roads — the renderer draws roads over lot ground.
    const softZone = zone.kind === "park" || zone.kind === "water";
    let parcels = layoutZoneParcels(zone, rng, boardCenter, 0, spec.regionalPalette, spec.countyParameters).filter(
      (parcel) => softZone || parcelClearsRoads(parcel, roadSegments),
    );
    if (parcels.length === 0 && !softZone) {
      // A re-gridded zone can land every parcel inside a road corridor and
      // silently erase the whole zone (lots, buildings, AND its place).
      // Retry once with the grid shifted a quarter cell — deterministic, and
      // only reached when the primary grid produced nothing.
      parcels = layoutZoneParcels(zone, rng, boardCenter, 0.25, spec.regionalPalette, spec.countyParameters).filter((parcel) =>
        parcelClearsRoads(parcel, roadSegments),
      );
    }
    if (parcels.length === 0) continue;

    for (const parcel of parcels) {
      const parcelZ = elevationModel.tileZ(Math.round(parcel.x), Math.round(parcel.y));
      lots.push(
        withLotMetadata(
          {
            id: `gen-lot-${zone.id}-${parcel.index}`,
            kind: parcel.lotKind ?? lotKind,
            label: parcel.spec?.labelOverride ?? zone.label ?? zoneLabel(zone.kind),
            position: { x: parcel.x, y: parcel.y, z: parcelZ },
            width: parcel.width,
            depth: parcel.depth,
            placeId,
          },
          roadSegments,
        ),
      );

      const building = buildingForZone(zone, parcel, placeId, rng, spec.regionalPalette, spec.countyParameters);
      if (building) {
        building.position.z = parcelZ;
        buildings.push(building);
      }
    }

    places.push({
      id: placeId,
      label: zone.label ?? zoneLabel(zone.kind),
      kind: placeKindForZone(zone.kind),
      districtId: spec.region.district,
      nodeId: zone.id,
      anchor: { x: zoneCenter(zone).x, y: zoneCenter(zone).y, z: elevationModel.tileZ(Math.round(zoneCenter(zone).x), Math.round(zoneCenter(zone).y)) },
      hitRadius: zone.kind === "park" ? 3.8 : 2.8,
      description: `Generated ${zoneLabel(zone.kind)} zone.`,
      activity: 0,
      labelPriority: placeIndex < 6 ? 10 - placeIndex : 3,
    });
    placeIndex += 1;

    appendZoneProps(zone);
  }

  const signatureLandmark = createGeneratedLandmark(spec, elevationModel, roadSegments);
  if (signatureLandmark) {
    lots.push(signatureLandmark.lot);
    buildings.push(signatureLandmark.building);
    places.push(signatureLandmark.place);
    props.push(...signatureLandmark.props);
  }
  const buildingsWithAttachments = withGeneratedBuildingAttachmentGeometry(buildings);

  const scene: CityWorldScene = {
    type: "cityWorldScene",
    id: spec.id,
    sourceSceneId: `parametric-${spec.id}`,
    label: spec.label,
    region: spec.region,
    bounds,
    cameraPresets: parametricCameraPresets(
      bounds,
      spec.zones,
      { bounds, terrainTiles, waterTiles: terrainTiles.filter((tile) => tile.kind === "water"), roadSegments, lots, buildings: buildingsWithAttachments },
      spec.countyParameters,
    ),
    terrainTiles,
    roadSegments,
    lots,
    buildings: buildingsWithAttachments,
    props,
    places,
    pins: [],
    actors: [],
    ambient: {
      timeOfDay: "midday",
      activity: "calm",
      traffic: 0,
      residents: 0,
      clouds: 0,
      waterShimmer: spec.zones.some((zone) => zone.kind === "water") ? 0.6 : 0,
    },
    hudDefaults: {
      locationLabel: spec.region.county,
      districtLabel: spec.region.district,
      // 0.57E parity — default the selection to the landmark (like curated
      // Eastvale Core), not the first residential zone: selecting a
      // many-building home_area place rings every house on first paint.
      selectedPlaceId: signatureLandmark?.place.id ?? (places.find((place) => place.kind === "landmark") ?? places[0])?.id ?? "",
    },
  };

  return {
    scene,
    stats: {
      terrainTiles: terrainTiles.length,
      roads: roadSegments.length,
      lots: lots.length,
      buildings: buildingsWithAttachments.length,
      props: props.length,
      zones: spec.zones.length,
    },
  };
}

/** Buildings may not stand in a road corridor (road half-width + margin). */
const ROAD_CLEARANCE_MARGIN = 0.35;

function parcelClearsRoads(parcel: ParcelLayout, roads: CityWorldRoadSegment[]): boolean {
  const halfW = parcel.width / 2;
  const halfD = parcel.depth / 2;
  for (const road of roads) {
    if (road.kind === "crosswalk") continue; // painted on the road surface, not a corridor
    const halfCorridor = road.width / 2 + ROAD_CLEARANCE_MARGIN;
    const minX = Math.min(road.from.x, road.to.x) - halfCorridor;
    const maxX = Math.max(road.from.x, road.to.x) + halfCorridor;
    const minY = Math.min(road.from.y, road.to.y) - halfCorridor;
    const maxY = Math.max(road.from.y, road.to.y) + halfCorridor;
    if (parcel.x + halfW > minX && parcel.x - halfW < maxX && parcel.y + halfD > minY && parcel.y - halfD < maxY) {
      return false;
    }
  }
  return true;
}

type ParcelLayout = {
  index: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  elevationBoost: number;
  // 0.57E parity — the building spec is chosen FIRST and the parcel is sized
  // around it. Sizing parcels before specs crushed every wide template (ranch,
  // rowhome, strip) to the narrow default footprint, destroying the pool's
  // silhouette variety and leaving oversized pads that read as empty lots.
  spec?: ZoneBuildingSpec;
  /** Optional role override for authored fabric lots. */
  lotKind?: CityWorldLot["kind"];
};

function createParametricTerrain(spec: CityWorldParametricSpec, bounds: CityWorldBounds, elevationModel: ParametricElevationModel): CityWorldTerrainTile[] {
  const tiles: CityWorldTerrainTile[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const point: CityWorldPoint = { x, y, z: elevationModel.tileZ(x, y) };
      const zone = zoneAt(spec.zones, x, y);
      const kind: CityWorldTerrainKind = zone ? ZONE_TO_TERRAIN[zone.kind] : "grass";
      const variant = terrainVariantForZone(zone, x, y);
      const relief = reliefAt(spec, x, y);
      const grammar = parametricTerrainGrammar(spec, zone, point, bounds, relief);
      const elevation = tileElevationGrammar(elevationModel, x, y);
      tiles.push({
        id: `gen-terrain-${x}-${y}`,
        kind,
        position: point,
        width: 1,
        depth: 1,
        variant,
        spriteKey: `tile.${kind}.${variant}`,
        paletteKey: regionalTerrainKeyForKind(kind, spec.regionalPalette),
        detailLevel: kind === "water" || kind === "park" || kind === "plaza" ? "medium" : "low",
        visualGrammar: elevation ? { ...grammar, elevation } : grammar,
      });
    }
  }
  return withCityWorldTerrainContactMetadata(tiles, "public");
}

function parametricTerrainGrammar(
  spec: CityWorldParametricSpec,
  zone: CityWorldZoneSpec | undefined,
  point: CityWorldPoint,
  bounds: CityWorldBounds,
  relief: number,
): CityWorldVisualGrammar {
  const nearWorldEdge = isNearBounds(point, bounds, 3);
  const onZoneEdge = zone ? isOnZoneEdge(zone, point) : false;

  if (zone && isFillZoneKind(zone.kind)) {
    return fillZoneTerrainGrammar(zone, nearWorldEdge, onZoneEdge, relief);
  }

  const composition: NonNullable<CityWorldVisualGrammar["terrainComposition"]> = !zone
    ? "quiet_field"
    : zone.kind === "water"
      ? "waterfront_edge_strata"
      : zone.kind === "park"
        ? "park_basin"
        : zone.kind === "commercial" || zone.kind === "plaza" || zone.kind === "gym"
          ? "commercial_apron_field"
          : zone.kind === "civic"
            ? "civic_focus_field"
            : "neighborhood_yard_fabric";

  const elevation: NonNullable<CityWorldVisualGrammar["terrainElevation"]> = nearWorldEdge
    ? "raised_parcel_shelf"
    : !zone
      ? relief > 0.38
        ? "raised_parcel_shelf"
        : "flat_field"
      : zone.kind === "water"
        ? "water_edge_cut"
        : zone.kind === "park"
          ? "park_basin_shelf"
          : zone.kind === "civic"
            ? "civic_plinth_shelf"
            : zone.kind === "commercial" || zone.kind === "plaza" || zone.kind === "gym"
              ? "commercial_slab_field"
              : "raised_parcel_shelf";

  const chunkEdge: NonNullable<CityWorldVisualGrammar["chunkEdge"]> = nearWorldEdge
    ? "world_edge"
    : zone?.kind === "water"
      ? "waterfront_bank_edge"
      : zone?.kind === "park" && onZoneEdge
        ? "park_basin_edge"
        : onZoneEdge && zone && zone.kind !== "residential"
          ? "parcel_cluster_edge"
          : "none";

  const massing: NonNullable<CityWorldVisualGrammar["terrainChunkMassing"]> = nearWorldEdge
    ? "outer_world_edge_mass"
    : !zone
      ? relief > 0.4
        ? "residential_shelf_mass"
        : "none"
      : zone.kind === "water"
        ? "waterfront_bank_cut_mass"
        : zone.kind === "park"
          ? "park_basin_cut_mass"
          : zone.kind === "civic"
            ? "civic_plinth_mass"
            : zone.kind === "commercial" || zone.kind === "plaza" || zone.kind === "gym"
              ? "commercial_slab_mass"
              : "residential_shelf_mass";

  const terrainProfile: NonNullable<CityWorldVisualGrammar["terrainProfile"]> =
    zone?.kind === "park"
      ? "civic_green"
      : zone?.kind === "water"
        ? "water_edge"
        : zone?.kind === "commercial" || zone?.kind === "plaza" || zone?.kind === "gym"
          ? "commercial_plaza"
          : zone?.kind === "civic"
            ? "landmark_civic_ground"
            : zone?.kind === "residential" || zone?.kind === "apartments"
              ? "neighborhood_parcel_field"
              : "quiet_socal_grass";

  const contactProfile: CityWorldVisualGrammar["contactProfile"] =
    zone?.kind === "civic"
      ? "landmark_base_shadow"
      : zone?.kind === "commercial" || zone?.kind === "plaza" || zone?.kind === "gym"
        ? "parcel_pad_shadow"
        : "soft_ground_shadow";

  return { terrainProfile, terrainComposition: composition, terrainElevation: elevation, chunkEdge, terrainChunkMassing: massing, contactProfile };
}

function terrainVariantForZone(zone: CityWorldZoneSpec | undefined, x: number, y: number): number {
  if (!zone) return (x * 17 + y * 11) % 5;
  const localX = x - zone.rect.minX;
  const localY = y - zone.rect.minY;
  if (zone.kind === "farm_field") return localY % 2 === 0 ? 0 : 4;
  if (zone.kind === "dry_wash") return (Math.floor((localX + localY * 2) / 3) + zone.id.length) % 2 === 0 ? 1 : 3;
  if (zone.kind === "scree") return Math.abs(localX * 2 + localY * 3) % 5;
  if (zone.kind === "shore_bank") return localY % 3 === 0 ? 0 : localX % 2 === 0 ? 2 : 4;
  if (zone.kind === "plaza_paving" || zone.kind === "civic_forecourt") return (localX + localY) % 2 === 0 ? 0 : 2;
  if (zone.kind === "meadow" || zone.kind === "green_common") return Math.abs(localX * 3 + localY * 2) % 5;
  return (x * 17 + y * 11) % 5;
}

function isFillZoneKind(kind: CityWorldZoneKind): boolean {
  return (
    kind === "farm_field" ||
    kind === "plaza_paving" ||
    kind === "civic_forecourt" ||
    kind === "dry_wash" ||
    kind === "meadow" ||
    kind === "scree" ||
    kind === "shore_bank" ||
    kind === "green_common"
  );
}

function fillZoneTerrainGrammar(
  zone: CityWorldZoneSpec,
  nearWorldEdge: boolean,
  onZoneEdge: boolean,
  relief: number,
): CityWorldVisualGrammar {
  const worldOrZoneEdge = nearWorldEdge ? "world_edge" : onZoneEdge ? "parcel_cluster_edge" : "none";
  const worldOrNoneMassing = nearWorldEdge ? "outer_world_edge_mass" : "none";

  if (zone.kind === "farm_field") {
    return {
      terrainProfile: "quiet_socal_grass",
      terrainComposition: "neighborhood_yard_fabric",
      terrainElevation: nearWorldEdge ? "raised_parcel_shelf" : "flat_field",
      chunkEdge: worldOrZoneEdge,
      terrainChunkMassing: worldOrNoneMassing,
      contactProfile: "soft_ground_shadow",
    };
  }

  if (zone.kind === "plaza_paving") {
    return {
      terrainProfile: "commercial_plaza",
      terrainComposition: "commercial_apron_field",
      terrainElevation: "commercial_slab_field",
      chunkEdge: worldOrZoneEdge,
      terrainChunkMassing: nearWorldEdge || onZoneEdge ? "commercial_slab_mass" : "none",
      contactProfile: "parcel_pad_shadow",
    };
  }

  if (zone.kind === "civic_forecourt") {
    return {
      terrainProfile: "landmark_civic_ground",
      terrainComposition: "civic_focus_field",
      terrainElevation: "civic_plinth_shelf",
      chunkEdge: worldOrZoneEdge,
      terrainChunkMassing: nearWorldEdge || onZoneEdge ? "civic_plinth_mass" : "commercial_slab_mass",
      contactProfile: "landmark_base_shadow",
    };
  }

  if (zone.kind === "dry_wash") {
    return {
      terrainProfile: "quiet_socal_grass",
      terrainComposition: "quiet_field",
      terrainElevation: relief > 0.42 || nearWorldEdge ? "raised_parcel_shelf" : "flat_field",
      chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge && relief > 0.36 ? "parcel_cluster_edge" : "none",
      terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : relief > 0.42 ? "residential_shelf_mass" : "none",
      contactProfile: "soft_ground_shadow",
    };
  }

  if (zone.kind === "scree") {
    return {
      terrainProfile: "quiet_socal_grass",
      terrainComposition: "quiet_field",
      terrainElevation: "raised_parcel_shelf",
      chunkEdge: worldOrZoneEdge,
      terrainChunkMassing: nearWorldEdge || onZoneEdge || relief > 0.5 ? "residential_shelf_mass" : "none",
      contactProfile: "soft_ground_shadow",
    };
  }

  if (zone.kind === "shore_bank") {
    return {
      terrainProfile: "water_edge",
      terrainComposition: "waterfront_edge_strata",
      terrainElevation: "water_edge_cut",
      chunkEdge: nearWorldEdge ? "world_edge" : "waterfront_bank_edge",
      terrainChunkMassing: "waterfront_bank_cut_mass",
      contactProfile: "soft_ground_shadow",
    };
  }

  if (zone.kind === "meadow") {
    return {
      terrainProfile: "civic_green",
      terrainComposition: "park_basin",
      terrainElevation: relief > 0.18 || nearWorldEdge ? "raised_parcel_shelf" : "park_basin_shelf",
      chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge ? "park_basin_edge" : "none",
      terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : relief > 0.18 ? "residential_shelf_mass" : onZoneEdge ? "park_basin_cut_mass" : "none",
      contactProfile: "soft_ground_shadow",
    };
  }

  return {
    terrainProfile: "civic_green",
    terrainComposition: "park_basin",
    terrainElevation: nearWorldEdge ? "raised_parcel_shelf" : "park_basin_shelf",
    chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge ? "park_basin_edge" : "none",
    terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : onZoneEdge ? "park_basin_cut_mass" : "none",
    contactProfile: "soft_ground_shadow",
  };
}

function layoutZoneParcels(
  zone: CityWorldZoneSpec,
  rng: () => number,
  boardCenter?: { x: number; y: number },
  gridOffset = 0,
  regionalPalette?: RegionalPalette,
  countyParameters?: CountyGenerationParameters,
): ParcelLayout[] {
  const { rect } = zone;
  const zoneWidth = rect.maxX - rect.minX;
  const zoneHeight = rect.maxY - rect.minY;
  if (zoneWidth <= 0 || zoneHeight <= 0) return [];
  const massingProfile = generatedMassingProfileFor(countyParameters);

  // Park/water are single soft parcels.
  if (zone.kind === "park" || zone.kind === "water") {
    return [
      {
        index: 0,
        x: rect.minX + zoneWidth / 2,
        y: rect.minY + zoneHeight / 2,
        width: Math.max(3, zoneWidth * 0.9),
        depth: Math.max(3, zoneHeight * 0.9),
        elevationBoost: zone.elevationBoost ?? 0,
      },
    ];
  }

  // Civic and gym are single broad anchor parcels (one strong silhouette each).
  // The plinth pad hugs the anchor (≤1.3× its footprint) instead of stretching
  // to the zone — a zone-wide pad under a fixed-size anchor reads as an empty
  // apron and fails the pad-fill parity floor on wide blocks.
  if (zone.kind === "civic" || zone.kind === "gym") {
    const anchor = zone.kind === "civic" ? { width: 3.4, depth: 2.5 } : { width: 4.0, depth: 2.6 };
    return [
      {
        index: 0,
        x: rect.minX + zoneWidth / 2,
        y: rect.minY + zoneHeight / 2,
        width: Math.max(anchor.width, Math.min(zoneWidth * 0.72, anchor.width * 1.3)),
        depth: Math.max(anchor.depth, Math.min(zoneHeight * 0.68, anchor.depth * 1.3)),
        elevationBoost: zone.elevationBoost ?? 0,
      },
    ];
  }

  // 0.57E parity — commerce authors road-facing STRIP ROWS the way curated
  // Plaza Row does: one wide elastic storefront strip per row segment (bays
  // repeat, so the template stretches to fill it), never a grid of small
  // shops scattered across aprons — that grid read as toy boxes on podiums.
  if (zone.kind === "commercial") {
    // 0.58E parity — ceil, not round: a 7-tile zone deserves two strip
    // segments; rounding down left small commercial zones as one lonely slab
    // and starved the lower frame.
    const cols = Math.max(1, Math.ceil(zoneWidth / massingProfile.commercialCellWidth));
    const rows = Math.max(1, Math.floor(zoneHeight / massingProfile.commercialRowDepth));
    const stripCellWidth = zoneWidth / cols;
    const stripCellHeight = zoneHeight / rows;
    const stripDensity = Math.max(zone.density ?? massingProfile.commercialDensityFloor, massingProfile.commercialDensityFloor);
    const strips: ParcelLayout[] = [];
    let stripIndex = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (rng() > stripDensity) continue;
        const template = buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
        if (!template) continue;
        const spec: ZoneBuildingSpec = {
          ...template,
          // Stretch to the row segment, capped near the hero strip's 6.1 tiles.
          width: Math.min(Math.max(template.width, stripCellWidth * massingProfile.commercialStripFill), massingProfile.commercialMaxWidth),
          depth: Math.min(Math.max(template.depth, 1.4), Math.max(1.4, stripCellHeight * 0.52)),
        };
        const stripJitter = (rng() - 0.5) * 0.2;
        strips.push({
          index: stripIndex++,
          x: rect.minX + (col + 0.5) * stripCellWidth + stripJitter,
          y: rect.minY + (row + 0.5) * stripCellHeight + stripJitter,
          width: Math.min(spec.width * 1.1, stripCellWidth * 1.04),
          depth: Math.min(spec.depth * 1.35, stripCellHeight * 0.9),
          elevationBoost: zone.elevationBoost ?? 0,
          spec,
        });
      }
    }
    if (strips.length === 0) {
      const template = buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
      const spec: ZoneBuildingSpec | undefined = template
        ? { ...template, width: Math.min(Math.max(template.width, zoneWidth * 0.6), massingProfile.commercialMaxWidth) }
        : undefined;
      strips.push({
        index: 0,
        x: rect.minX + zoneWidth / 2,
        y: rect.minY + zoneHeight / 2,
        width: spec ? spec.width * 1.1 : parcelFootprint(zone.kind).width,
        depth: spec ? spec.depth * 1.35 : parcelFootprint(zone.kind).depth,
        elevationBoost: zone.elevationBoost ?? 0,
        ...(spec ? { spec } : {}),
      });
    }
    // Generated commerce strips render through the vector facade path. The
    // authored commerce sprites assume curated Eastvale footprints; on
    // parametric widths they collapsed into misregistered sprite wrecks.
    return strips;
  }

  // 0.57E parity — denser defaults: generated districts read as sparse fields
  // next to curated Eastvale at the old fill rates.
  // 0.58E parity — apartment courts pack tighter (curated Eastvale's court is
  // a dense block, not scattered towers); they usually sit in the lower frame.
  // 0.75C fabric floor — residential/apartment zones clamp UP to these
  // minimums; zone.density can only densify them further, never thin the
  // small-house fabric below the north-star read.
  const density =
    zone.kind === "residential"
      ? Math.max(zone.density ?? massingProfile.residentialDensityFloor, massingProfile.residentialDensityFloor)
      : zone.kind === "apartments"
        ? Math.max(zone.density ?? massingProfile.apartmentDensityFloor, massingProfile.apartmentDensityFloor)
        : zone.density ?? 0.62;
  const cell = zone.kind === "residential" ? massingProfile.residentialCell : zone.kind === "apartments" ? massingProfile.apartmentCell : 3.4;
  const cols = Math.max(1, Math.floor(zoneWidth / cell));
  const rows = Math.max(1, Math.floor(zoneHeight / cell));
  const cellWidth = zoneWidth / cols;
  const cellHeight = zoneHeight / rows;
  const parcels: ParcelLayout[] = [];
  const footprint = parcelFootprint(zone.kind);
  let index = 0;

  const parcelForSpec = (spec: ZoneBuildingSpec): { width: number; depth: number } => ({
    // The lot pad hugs the chosen building (small margin) instead of imposing
    // a fixed footprint, clamped to the grid pitch so neighbours stay parcels.
    width: Math.max(footprint.width * 0.7, Math.min(spec.width * 1.16, cellWidth * 1.15)),
    depth: Math.max(footprint.depth * 0.7, Math.min(spec.depth * 1.22, cellHeight * 1.15)),
  });

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (rng() > density) continue;
      const cx = rect.minX + (col + 0.5 + (col < cols - 1 ? gridOffset : 0)) * cellWidth;
      const cy = rect.minY + (row + 0.5 + (row < rows - 1 ? gridOffset : 0)) * cellHeight;
      const jitter = (rng() - 0.5) * 0.3;
      // Rotate apartment massing so court parcels step instead of cloning one slab.
      const spec =
        zone.kind === "apartments"
          ? apartmentSpecForOrdinal(index, rng, regionalPalette, countyParameters)
          : buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
      const pad = spec ? parcelForSpec(spec) : footprint;
      parcels.push({
        index: index++,
        x: cx + jitter,
        y: cy + jitter,
        width: pad.width,
        depth: pad.depth,
        elevationBoost: zone.elevationBoost ?? 0,
        ...(spec ? { spec } : {}),
      });
    }
  }

  // Never leave a zoned block empty — guarantee at least one anchor parcel.
  if (parcels.length === 0) {
    const spec =
      zone.kind === "apartments"
        ? apartmentSpecForOrdinal(0, rng, regionalPalette, countyParameters)
        : buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
    const pad = spec ? parcelForSpec(spec) : footprint;
    parcels.push({
      index: 0,
      x: rect.minX + zoneWidth / 2,
      y: rect.minY + zoneHeight / 2,
      width: pad.width,
      depth: pad.depth,
      elevationBoost: zone.elevationBoost ?? 0,
      ...(spec ? { spec } : {}),
    });
  }

  // Large neighborhoods get one downtown-facing corner market.
  if (zone.kind === "residential" && parcels.length >= massingProfile.cornerStoreMinParcels && boardCenter) {
    const cornerTargetX = boardCenter.x >= (rect.minX + rect.maxX) / 2 ? rect.maxX : rect.minX;
    const cornerTargetY = boardCenter.y >= (rect.minY + rect.maxY) / 2 ? rect.maxY : rect.minY;
    const cornerParcel = parcels.reduce((closest, parcel) => {
      const parcelDistance = Math.hypot(parcel.x - cornerTargetX, parcel.y - cornerTargetY);
      const closestDistance = Math.hypot(closest.x - cornerTargetX, closest.y - cornerTargetY);
      return parcelDistance < closestDistance ? parcel : closest;
    }, parcels[0] as ParcelLayout);
    const cornerSpec = applyDimensionJitter(CORNER_STORE_TEMPLATE, rng, regionalPalette, countyParameters);
    cornerSpec.labelOverride = "Corner market";
    cornerParcel.spec = cornerSpec;
    cornerParcel.lotKind = "shop";
    cornerParcel.width = Math.min(cornerSpec.width * 1.18, cellWidth * 1.15);
    cornerParcel.depth = Math.min(cornerSpec.depth * 1.3, cellHeight * 1.15);
  }

  return parcels;
}

function buildingForZone(
  zone: CityWorldZoneSpec,
  parcel: ParcelLayout,
  placeId: string,
  rng: () => number,
  regionalPalette?: RegionalPalette,
  countyParameters?: CountyGenerationParameters,
): CityWorldBuilding | null {
  const spec = parcel.spec ?? buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
  if (!spec) return null;
  return {
    id: `gen-building-${zone.id}-${parcel.index}`,
    kind: spec.kind,
    label: spec.labelOverride ?? zone.label ?? zoneLabel(zone.kind),
    // Pin generated buildings to a manifest-allowed primitive key so
    // withBuildingMetadata cannot route them to the texture-backed sprite art:
    // authored sprites assume curated Eastvale footprints and collapse into
    // misregistered wrecks on jittered parametric widths.
    spriteKey: `building.${spec.kind}.generated.v1`,
    position: { x: parcel.x, y: parcel.y, z: 0 },
    // The parcel was sized around this spec, so the template's silhouette
    // survives; the gentle clamp only guards grid-pitch overflow.
    width: Math.min(parcel.width * 0.95, spec.width),
    depth: Math.min(parcel.depth * 0.95, spec.depth),
    height: spec.height + parcel.elevationBoost,
    bodyColor: spec.bodyColor,
    roofColor: spec.roofColor,
    ...(spec.paletteKey ? { paletteKey: spec.paletteKey } : {}),
    placeId,
    roofShape: spec.roofShape,
    facadeStyle: spec.facadeStyle,
    detailLevel: spec.kind === "home" ? "medium" : "high",
  };
}

type ZoneBuildingSpec = {
  kind: CityWorldBuilding["kind"];
  width: number;
  depth: number;
  height: number;
  bodyColor: string;
  roofColor: string;
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
  /** Optional sprite role override for commerce strips. */
  spriteKey?: string;
  /** Label override for authored fabric roles (e.g. neighborhood corner market). */
  labelOverride?: string;
  /** Optional regional manifest palette key for generated districts. */
  paletteKey?: string;
};

export type CityWorldGeneratedLandmarkKind =
  | "coastal_pier_hall"
  | "river_boathouse"
  | "desert_mesa_tower"
  | "mountain_ridge_lodge"
  | "prairie_grain_elevator"
  | "metro_civic_tower";

export type CityWorldGeneratedLandmarkHostCell = "water_edge" | "highest_block_corner" | "ridge" | "ag_block" | "civic_core";

export type CityWorldGeneratedLandmarkSignature = {
  kind: CityWorldGeneratedLandmarkKind;
  archetype: GeneratedDistrictArchetype;
  hostCell: CityWorldGeneratedLandmarkHostCell;
  buildingKind: CityWorldBuilding["kind"];
  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
  expectedAccentProps: readonly CityWorldProp["kind"][];
};

export type CityWorldGeneratedLandmarkReadout = CityWorldGeneratedLandmarkSignature & {
  buildingId: string;
  placeId: string;
  width: number;
  depth: number;
  height: number;
  silhouetteKey: string;
  accentProps: CityWorldProp["kind"][];
};

export const GENERATED_LANDMARK_SIGNATURES: Record<CityWorldGeneratedLandmarkKind, CityWorldGeneratedLandmarkSignature> = {
  coastal_pier_hall: {
    kind: "coastal_pier_hall",
    archetype: "coastal_grid",
    hostCell: "water_edge",
    buildingKind: "shop",
    roofShape: "hip",
    facadeStyle: "strip_store",
    expectedAccentProps: ["dock", "boat"],
  },
  river_boathouse: {
    kind: "river_boathouse",
    archetype: "river_town",
    hostCell: "water_edge",
    buildingKind: "shop",
    roofShape: "gable",
    facadeStyle: "storefront",
    expectedAccentProps: ["dock", "boat"],
  },
  desert_mesa_tower: {
    kind: "desert_mesa_tower",
    archetype: "desert_basin",
    hostCell: "highest_block_corner",
    buildingKind: "gym",
    roofShape: "tower",
    facadeStyle: "fitness",
    expectedAccentProps: ["water_tower"],
  },
  mountain_ridge_lodge: {
    kind: "mountain_ridge_lodge",
    archetype: "mountain_valley",
    hostCell: "ridge",
    buildingKind: "civic",
    roofShape: "gable",
    facadeStyle: "civic",
    expectedAccentProps: ["tree"],
  },
  prairie_grain_elevator: {
    kind: "prairie_grain_elevator",
    archetype: "prairie_town",
    hostCell: "ag_block",
    buildingKind: "gym",
    roofShape: "tower",
    facadeStyle: "fitness",
    expectedAccentProps: ["water_tower"],
  },
  metro_civic_tower: {
    kind: "metro_civic_tower",
    archetype: "metro_grid",
    hostCell: "civic_core",
    buildingKind: "civic",
    roofShape: "tower",
    facadeStyle: "civic",
    expectedAccentProps: [],
  },
};

export function expectedGeneratedLandmarkKind(parameters: CountyGenerationParameters): CityWorldGeneratedLandmarkKind {
  return LANDMARK_KIND_BY_ARCHETYPE[parameters.archetype];
}

export function analyzeGeneratedLandmark(scene: CityWorldScene): CityWorldGeneratedLandmarkReadout | null {
  const building = scene.buildings.find((candidate) => candidate.id.startsWith("gen-landmark-"));
  if (!building?.placeId) return null;
  const kind = landmarkKindFromBuildingId(building.id);
  if (!kind) return null;
  const signature = GENERATED_LANDMARK_SIGNATURES[kind];
  const place = scene.places.find((candidate) => candidate.id === building.placeId);
  const accentProps = scene.props
    .filter((prop) => prop.placeId === building.placeId || signature.expectedAccentProps.includes(prop.kind))
    .map((prop) => prop.kind);
  const width = roundDimension(building.width);
  const depth = roundDimension(building.depth);
  const height = roundDimension(building.height);
  const readout: CityWorldGeneratedLandmarkReadout = {
    ...signature,
    buildingId: building.id,
    placeId: building.placeId,
    hostCell: (place?.nodeId as CityWorldGeneratedLandmarkHostCell | undefined) ?? signature.hostCell,
    buildingKind: building.kind,
    roofShape: building.roofShape ?? signature.roofShape,
    facadeStyle: building.facadeStyle ?? signature.facadeStyle,
    width,
    depth,
    height,
    silhouetteKey: generatedLandmarkSilhouetteKey({
      ...signature,
      buildingKind: building.kind,
      roofShape: building.roofShape ?? signature.roofShape,
      facadeStyle: building.facadeStyle ?? signature.facadeStyle,
      hostCell: (place?.nodeId as CityWorldGeneratedLandmarkHostCell | undefined) ?? signature.hostCell,
      width,
      depth,
      height,
    }),
    accentProps,
  };
  return readout;
}

export function generatedLandmarkSilhouetteKey(
  signature: Pick<CityWorldGeneratedLandmarkReadout, "buildingKind" | "roofShape" | "facadeStyle" | "hostCell" | "width" | "depth" | "height">,
): string {
  return [
    signature.hostCell,
    signature.buildingKind,
    signature.facadeStyle,
    signature.roofShape,
    signature.width.toFixed(1),
    signature.depth.toFixed(1),
    signature.height.toFixed(1),
  ].join(":");
}

function isGeneratedAttachmentBuilding(building: CityWorldBuilding): boolean {
  return building.id.startsWith("gen-attachment-") || Boolean(building.visualGrammar?.buildingAttachment);
}

export const GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR = 0.15;

export type CityWorldGeneratedMassingSignature = {
  sceneId: string;
  buildingCount: number;
  lotCount: number;
  roadCount: number;
  roadLength: number;
  meanRoadLength: number;
  meanBuildingHeight: number;
  maxBuildingHeight: number;
  meanFootprintArea: number;
  footprintAreaStdDev: number;
  highRiseRatio: number;
  apartmentRatio: number;
  shopRatio: number;
  civicRatio: number;
  waterLotRatio: number;
  builtSpanX: number;
  builtSpanY: number;
  linearityRatio: number;
  elevationSpread: number;
};

export function analyzeGeneratedDistrictMassingSignature(scene: CityWorldScene): CityWorldGeneratedMassingSignature {
  const buildings = scene.buildings.filter((building) => !building.id.startsWith("gen-landmark-") && !isGeneratedAttachmentBuilding(building));
  const lots = scene.lots.filter((lot) => !lot.id.startsWith("gen-landmark-lot-"));
  const roadLengths = scene.roadSegments.map((road) => Math.hypot(road.to.x - road.from.x, road.to.y - road.from.y));
  const roadLength = roadLengths.reduce((sum, value) => sum + value, 0);
  const footprintAreas = buildings.map((building) => building.width * building.depth);
  const heights = buildings.map((building) => building.height);
  const xs = buildings.map((building) => building.position.x);
  const ys = buildings.map((building) => building.position.y);
  const zs = buildings.map((building) => building.position.z);
  const spanX = xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0;
  const spanY = ys.length > 0 ? Math.max(...ys) - Math.min(...ys) : 0;
  const normalizedSpanX = spanX / Math.max(1, scene.bounds.maxX - scene.bounds.minX);
  const normalizedSpanY = spanY / Math.max(1, scene.bounds.maxY - scene.bounds.minY);
  const minSpan = Math.max(0.01, Math.min(normalizedSpanX, normalizedSpanY));
  const maxSpan = Math.max(normalizedSpanX, normalizedSpanY);

  return {
    sceneId: scene.id,
    buildingCount: buildings.length,
    lotCount: lots.length,
    roadCount: scene.roadSegments.length,
    roadLength: roundDimension(roadLength),
    meanRoadLength: roundDimension(safeRatio(roadLength, scene.roadSegments.length)),
    meanBuildingHeight: roundDimension(mean(heights)),
    maxBuildingHeight: roundDimension(Math.max(0, ...heights)),
    meanFootprintArea: roundDimension(mean(footprintAreas)),
    footprintAreaStdDev: roundDimension(stddev(footprintAreas)),
    highRiseRatio: roundDimension(safeRatio(buildings.filter((building) => building.height >= 2.2).length, buildings.length)),
    apartmentRatio: roundDimension(safeRatio(buildings.filter((building) => building.kind === "apartment").length, buildings.length)),
    shopRatio: roundDimension(safeRatio(buildings.filter((building) => building.kind === "shop").length, buildings.length)),
    civicRatio: roundDimension(safeRatio(buildings.filter((building) => building.kind === "civic").length, buildings.length)),
    waterLotRatio: roundDimension(safeRatio(lots.filter((lot) => lot.kind === "waterfront").length, lots.length)),
    builtSpanX: roundDimension(normalizedSpanX),
    builtSpanY: roundDimension(normalizedSpanY),
    linearityRatio: roundDimension(Math.min(4, maxSpan / minSpan)),
    elevationSpread: roundDimension(zs.length > 0 ? Math.max(...zs) - Math.min(...zs) : 0),
  };
}

export function generatedDistrictMassingSignatureDistance(
  first: CityWorldGeneratedMassingSignature,
  second: CityWorldGeneratedMassingSignature,
): number {
  const weighted =
    normalizedDelta(first.meanBuildingHeight, second.meanBuildingHeight, 2.6, 0.14) +
    normalizedDelta(first.maxBuildingHeight, second.maxBuildingHeight, 4.4, 0.1) +
    normalizedDelta(first.meanFootprintArea, second.meanFootprintArea, 4, 0.12) +
    normalizedDelta(first.footprintAreaStdDev, second.footprintAreaStdDev, 2.6, 0.07) +
    normalizedDelta(first.buildingCount, second.buildingCount, 34, 0.1) +
    normalizedDelta(first.lotCount, second.lotCount, 34, 0.08) +
    normalizedDelta(first.roadCount, second.roadCount, 5, 0.05) +
    normalizedDelta(first.roadLength, second.roadLength, 150, 0.09) +
    normalizedDelta(first.meanRoadLength, second.meanRoadLength, 28, 0.06) +
    normalizedDelta(first.apartmentRatio, second.apartmentRatio, 0.45, 0.1) +
    normalizedDelta(first.shopRatio, second.shopRatio, 0.45, 0.08) +
    normalizedDelta(first.highRiseRatio, second.highRiseRatio, 0.45, 0.11) +
    normalizedDelta(first.waterLotRatio, second.waterLotRatio, 0.2, 0.06) +
    normalizedDelta(first.linearityRatio, second.linearityRatio, 2.8, 0.1) +
    normalizedDelta(first.elevationSpread, second.elevationSpread, 1.2, 0.07);
  return roundDimension(Math.min(1, weighted));
}

const LANDMARK_KIND_BY_ARCHETYPE: Record<GeneratedDistrictArchetype, CityWorldGeneratedLandmarkKind> = {
  coastal_grid: "coastal_pier_hall",
  river_town: "river_boathouse",
  desert_basin: "desert_mesa_tower",
  mountain_valley: "mountain_ridge_lodge",
  prairie_town: "prairie_grain_elevator",
  metro_grid: "metro_civic_tower",
};

type GeneratedLandmarkAssembly = {
  lot: CityWorldLot;
  building: CityWorldBuilding;
  place: CityWorldPlace;
  props: CityWorldProp[];
};

type GeneratedLandmarkMassing = {
  label: string;
  buildingKind: CityWorldBuilding["kind"];
  lotKind: CityWorldLot["kind"];
  width: number;
  depth: number;
  height: number;
  bodyColor: string;
  roofColor: string;
  paletteKey?: string;
  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
};

type GeneratedLandmarkHost = {
  point: CityWorldPoint;
  zone: CityWorldZoneSpec;
};

function createGeneratedLandmark(
  spec: CityWorldParametricSpec,
  elevationModel: ParametricElevationModel,
  roadSegments: CityWorldRoadSegment[],
): GeneratedLandmarkAssembly | null {
  const parameters = spec.countyParameters;
  if (!parameters) return null;

  const kind = expectedGeneratedLandmarkKind(parameters);
  const signature = GENERATED_LANDMARK_SIGNATURES[kind];
  const massing = generatedLandmarkMassing(parameters, signature);
  const host = generatedLandmarkHost(signature, massing, spec.zones, elevationModel);
  if (!host) return null;

  const placeId = `gen-place-landmark-${kind}`;
  const lot = withLotMetadata(
    {
      id: `gen-landmark-lot-${kind}`,
      kind: massing.lotKind,
      label: massing.label,
      position: host.point,
      width: Math.max(massing.width * 1.12, massing.width + 0.28),
      depth: Math.max(massing.depth * 1.18, massing.depth + 0.28),
      placeId,
    },
    roadSegments,
  );
  const building = withBuildingMetadata({
    id: `gen-landmark-${kind}`,
    kind: massing.buildingKind,
    label: massing.label,
    spriteKey: `building.${massing.buildingKind}.generated.landmark.v1`,
    position: host.point,
    width: massing.width,
    depth: massing.depth,
    height: massing.height,
    bodyColor: massing.bodyColor,
    roofColor: massing.roofColor,
    ...(massing.paletteKey ? { paletteKey: massing.paletteKey } : {}),
    placeId,
    roofShape: massing.roofShape,
    facadeStyle: massing.facadeStyle,
    detailLevel: "high",
  });
  const place: CityWorldPlace = {
    id: placeId,
    label: massing.label,
    kind: "landmark",
    districtId: spec.region.district,
    nodeId: signature.hostCell,
    anchor: host.point,
    hitRadius: Math.max(3.1, Math.max(massing.width, massing.depth) * 0.88),
    description: `Generated ${massing.label.toLowerCase()} landmark.`,
    activity: 0,
    labelPriority: 10,
  };

  return {
    lot,
    building,
    place,
    props: generatedLandmarkAccentProps(signature, host.point, placeId, elevationModel),
  };
}

function generatedLandmarkMassing(
  parameters: CountyGenerationParameters,
  signature: CityWorldGeneratedLandmarkSignature,
): GeneratedLandmarkMassing {
  const waterSignal = hasNameSignal(parameters, ["port", "harbor", "lake", "bay", "beach"]);
  const workingWaterfrontSignal = hasNameSignal(parameters, ["port", "harbor"]);
  const riverSignal = hasNameSignal(parameters, ["falls", "river"]);
  const mesaSignal = hasNameSignal(parameters, ["mesa", "desert"]);
  const ridgeSignal = hasNameSignal(parameters, ["mount", "mountain"]);
  const snowPitchLift = parameters.climate.snowRoofAllowed ? 0.22 : 0;
  const roofPitchLift = Math.max(0, parameters.regionProfile.roofPitchBias) * 0.55;
  const colors = landmarkPalette(parameters, signature.kind);

  if (signature.kind === "coastal_pier_hall") {
    return {
      label: workingWaterfrontSignal ? "Working pier hall" : waterSignal ? "Waterfront pier hall" : "Pier hall",
      buildingKind: "shop",
      lotKind: "waterfront",
      width: roundDimension(4.7 + (workingWaterfrontSignal ? 0.48 : waterSignal ? 0.26 : 0)),
      depth: 1.34,
      height: roundDimension(1.08 + (parameters.climate.coastalProximity === "coastal" ? 0 : 0.06)),
      ...colors,
      facadeStyle: "strip_store",
      roofShape: "hip",
    };
  }
  if (signature.kind === "river_boathouse") {
    return {
      label: riverSignal ? "River boathouse" : "Bank boathouse",
      buildingKind: "shop",
      lotKind: "waterfront",
      width: roundDimension(3.25 + (riverSignal ? 0.34 : 0)),
      depth: 1.58,
      height: roundDimension(1.34 + (parameters.nameSignal.includes("falls") ? 0.16 : 0)),
      ...colors,
      facadeStyle: "storefront",
      roofShape: "gable",
    };
  }
  if (signature.kind === "desert_mesa_tower") {
    return {
      label: mesaSignal ? "Mesa water tower" : "Desert water tower",
      buildingKind: "gym",
      lotKind: "civic",
      width: 1.16,
      depth: 1.18,
      height: roundDimension(3.68 + (mesaSignal ? 0.28 : 0) + (parameters.climate.aridity === "arid" ? 0.16 : 0)),
      ...colors,
      facadeStyle: "fitness",
      roofShape: "tower",
    };
  }
  if (signature.kind === "mountain_ridge_lodge") {
    return {
      label: ridgeSignal ? "Ridge lodge" : "Mountain lodge",
      buildingKind: "civic",
      lotKind: "civic",
      width: 4.18,
      depth: 2.24,
      height: roundDimension(2.02 + snowPitchLift + roofPitchLift),
      ...colors,
      facadeStyle: "civic",
      roofShape: "gable",
    };
  }
  if (signature.kind === "prairie_grain_elevator") {
    return {
      label: "Grain elevator",
      buildingKind: "gym",
      lotKind: "shop",
      width: 1.18,
      depth: 1.76,
      height: roundDimension(3.38 + (parameters.region === "west_north_central" ? 0.18 : 0) + (parameters.climate.aridity === "dry" ? 0.08 : 0)),
      ...colors,
      facadeStyle: "fitness",
      roofShape: "tower",
    };
  }

  return {
    label: "Civic tower",
    buildingKind: "civic",
    lotKind: "civic",
    width: 2.28,
    depth: 2.04,
    height: roundDimension(4.12 + Math.max(0, parameters.modulation.heightBias) * 3),
    ...colors,
    facadeStyle: "civic",
    roofShape: "tower",
  };
}

function landmarkPalette(
  parameters: CountyGenerationParameters,
  kind: CityWorldGeneratedLandmarkKind,
): { bodyColor: string; roofColor: string; paletteKey?: string } {
  const pick: Record<CityWorldGeneratedLandmarkKind, { bodyIndex: number; roofIndex: number }> = {
    coastal_pier_hall: { bodyIndex: 0, roofIndex: 1 },
    river_boathouse: { bodyIndex: 2, roofIndex: 0 },
    desert_mesa_tower: { bodyIndex: 1, roofIndex: 0 },
    mountain_ridge_lodge: { bodyIndex: 0, roofIndex: 1 },
    prairie_grain_elevator: { bodyIndex: 2, roofIndex: 1 },
    metro_civic_tower: { bodyIndex: 1, roofIndex: 1 },
  };
  const regional = resolveRegionalBuildingPalette(parameters.palette, pick[kind].bodyIndex, pick[kind].roofIndex);
  return {
    bodyColor: regional.bodyColor,
    roofColor: regional.roofColor,
    paletteKey: regional.paletteKey,
  };
}

function generatedLandmarkHost(
  signature: CityWorldGeneratedLandmarkSignature,
  massing: GeneratedLandmarkMassing,
  zones: CityWorldZoneSpec[],
  elevationModel: ParametricElevationModel,
): GeneratedLandmarkHost | null {
  if (signature.hostCell === "water_edge") {
    const zone = zones.find((candidate) => candidate.kind === "water") ?? zones.find((candidate) => candidate.id === "water-edge");
    if (!zone) return null;
    const point = waterEdgeHostPoint(zone, massing);
    return hostInsideZone(zone, point.x, point.y, massing, elevationModel);
  }
  if (signature.hostCell === "civic_core") {
    const zone = zones.find((candidate) => candidate.id === "civic-core" || candidate.kind === "civic");
    return zone ? hostInsideZone(zone, zoneCenter(zone).x + 0.85, zoneCenter(zone).y - 0.2, massing, elevationModel) : null;
  }
  if (signature.hostCell === "ag_block") {
    const zone =
      zones.find((candidate) => candidate.id === "east-commons") ??
      zones.find((candidate) => candidate.id === "south-commerce") ??
      zones.find((candidate) => candidate.kind === "commercial");
    return zone ? hostInsideZone(zone, zoneCenter(zone).x, zoneCenter(zone).y, massing, elevationModel) : null;
  }
  if (signature.hostCell === "ridge" || signature.hostCell === "highest_block_corner") {
    const ranked = zones
      .filter((zone) => zone.kind !== "water" && zone.kind !== "park")
      .flatMap((zone) =>
        [
          { x: zone.rect.minX + massing.width / 2 + 0.25, y: zone.rect.minY + massing.depth / 2 + 0.25 },
          { x: zone.rect.maxX - massing.width / 2 - 0.25, y: zone.rect.minY + massing.depth / 2 + 0.25 },
          { x: zone.rect.maxX - massing.width / 2 - 0.25, y: zone.rect.maxY - massing.depth / 2 - 0.25 },
          { x: zone.rect.minX + massing.width / 2 + 0.25, y: zone.rect.maxY - massing.depth / 2 - 0.25 },
        ].map((point) => ({ zone, point, z: elevationModel.tileZ(Math.round(point.x), Math.round(point.y)) })),
      )
      .sort((first, second) => second.z - first.z || first.point.x + first.point.y - (second.point.x + second.point.y));
    const top = ranked[0];
    return top ? hostInsideZone(top.zone, top.point.x, top.point.y, massing, elevationModel) : null;
  }
  return null;
}

function hostInsideZone(
  zone: CityWorldZoneSpec,
  preferredX: number,
  preferredY: number,
  massing: GeneratedLandmarkMassing,
  elevationModel: ParametricElevationModel,
): GeneratedLandmarkHost {
  const halfW = massing.width / 2 + 0.14;
  const halfD = massing.depth / 2 + 0.14;
  const minX = zone.rect.minX + halfW;
  const maxX = zone.rect.maxX - halfW;
  const minY = zone.rect.minY + halfD;
  const maxY = zone.rect.maxY - halfD;
  const x = minX <= maxX ? cityWorldClamp(preferredX, minX, maxX) : zoneCenter(zone).x;
  const y = minY <= maxY ? cityWorldClamp(preferredY, minY, maxY) : zoneCenter(zone).y;
  return {
    zone,
    point: { x: roundDimension(x), y: roundDimension(y), z: elevationModel.tileZ(Math.round(x), Math.round(y)) },
  };
}

function waterEdgeHostPoint(zone: CityWorldZoneSpec, massing: GeneratedLandmarkMassing): { x: number; y: number } {
  const wideBand = zone.rect.maxX - zone.rect.minX > (zone.rect.maxY - zone.rect.minY) * 1.6;
  if (wideBand) {
    return {
      x: zoneCenter(zone).x,
      y: zone.rect.minY + massing.depth / 2 + 0.18,
    };
  }
  return {
    x: zone.rect.minX + massing.width / 2 + 0.18,
    y: zoneCenter(zone).y,
  };
}

function generatedLandmarkAccentProps(
  signature: CityWorldGeneratedLandmarkSignature,
  anchor: CityWorldPoint,
  placeId: string,
  elevationModel: ParametricElevationModel,
): CityWorldProp[] {
  const props: CityWorldProp[] = [];
  const point = (id: string, kind: CityWorldProp["kind"], dx: number, dy: number, variant: number) =>
    withPropMetadata({
      id: `gen-landmark-prop-${signature.kind}-${id}`,
      kind,
      position: {
        x: roundDimension(anchor.x + dx),
        y: roundDimension(anchor.y + dy),
        z: elevationModel.tileZ(Math.round(anchor.x + dx), Math.round(anchor.y + dy)),
      },
      variant,
      placeId,
    });

  if (signature.kind === "desert_mesa_tower") {
    props.push(point("tank", "water_tower", 0.72, -0.2, 0));
  } else if (signature.kind === "mountain_ridge_lodge") {
    props.push(point("pine-0", "tree", -2.05, -0.9, 2), point("pine-1", "tree", 2.1, -0.72, 3), point("pine-2", "tree", -1.35, 1.18, 4));
  } else if (signature.kind === "prairie_grain_elevator") {
    props.push(point("drum", "water_tower", 0.78, -0.08, 1));
  }

  return props;
}

function hasNameSignal(parameters: CountyGenerationParameters, names: readonly NameSignal[]): boolean {
  return names.some((name) => parameters.nameSignal.includes(name));
}

function landmarkKindFromBuildingId(id: string): CityWorldGeneratedLandmarkKind | null {
  const raw = id.replace(/^gen-landmark-/, "");
  return raw in GENERATED_LANDMARK_SIGNATURES ? (raw as CityWorldGeneratedLandmarkKind) : null;
}

function roundDimension(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A dimension-jittered spec POOL. Each generated building draws from a pool of
 * archetype templates and applies a deterministic ±15% jitter to width/depth/
 * height, so buildings within a family cross half-tile silhouette buckets
 * instead of being byte-identical clones. Roof shape is mixed per archetype.
 * Body/roof colors are muted placeholders only — the effective on-screen color
 * resolves through the hash-assigned palette variant in withBuildingMetadata.
 */
type ZoneBuildingTemplate = Omit<ZoneBuildingSpec, "bodyColor" | "roofColor"> & {
  bodyColors: string[];
  roofColors: string[];
};

const RESIDENTIAL_TEMPLATE_POOL: Array<{ weight: number; template: ZoneBuildingTemplate }> = [
  { weight: 0.5, template: { kind: "home", width: 1.28, depth: 1.08, height: 1.02, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f2dfc4", "#ead4b6", "#f6e7cf"], roofColors: ["#b86f4c", "#8a6a52", "#b99358"] } },
  { weight: 0.48, template: { kind: "home", width: 1.52, depth: 1.12, height: 1.08, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f0dcc4", "#ecdcc0", "#e7d4b8"], roofColors: ["#a9704f", "#7d9a86", "#5f7f8e"] } },
  { weight: 0.52, template: { kind: "home", width: 2.0, depth: 1.18, height: 0.98, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#7f9b6e", "#5f7f8e", "#a76f4e"] } },
  { weight: 0.52, template: { kind: "home", width: 2.18, depth: 1.28, height: 1.04, facadeStyle: "ranch", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#a9704f", "#5f7f8e", "#8a6a52"] } },
  { weight: 0.68, template: { kind: "home", width: 2.56, depth: 1.08, height: 1.26, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#f2dfc2", "#eed9c0", "#ead2b4"], roofColors: ["#607d84", "#6f9ca7", "#7f9b6e"] } },
  { weight: 0.46, template: { kind: "home", width: 1.72, depth: 1.06, height: 1.18, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#eed8bd", "#f3e1c6"], roofColors: ["#587a8e", "#8a6a52"] } },
];

const RIVER_TOWN_RESIDENTIAL_TEMPLATE_POOL: Array<{ weight: number; template: ZoneBuildingTemplate }> = [
  { weight: 0.18, template: { kind: "home", width: 1.84, depth: 1.34, height: 1.04, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#2f5d8a", "#577747", "#9a927d"] } },
  { weight: 0.16, template: { kind: "home", width: 2.34, depth: 1.42, height: 1.0, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#577747", "#9a927d", "#2f5d8a"] } },
];

// Strip templates stay flat/parapet; hip roofs make rows read as houses.
const COMMERCIAL_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "shop", width: 3.0, depth: 1.7, height: 1.4, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efd8b6", "#eedcc4"], roofColors: ["#3f8b8c", "#6f9a86"] },
  { kind: "shop", width: 3.6, depth: 1.5, height: 1.1, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efdcc0", "#f2dfc2"], roofColors: ["#c48a5a", "#82a4c4"] },
  { kind: "shop", width: 2.6, depth: 1.95, height: 1.6, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#eedcc4", "#efd8b6"], roofColors: ["#6f9a86", "#c48a5a"] },
];

/** Small storefront module placed inside large residential zones. */
const CORNER_STORE_TEMPLATE: ZoneBuildingTemplate = {
  kind: "shop",
  width: 2.1,
  depth: 1.25,
  height: 1.1,
  facadeStyle: "storefront",
  roofShape: "flat",
  bodyColors: ["#eed7b2", "#f0dcbb"],
  roofColors: ["#437085", "#6f9a86", "#a9704f"],
};
const CORNER_STORE_MIN_PARCELS = 6;

/** Tower, mid-court, and low-court apartment silhouettes. */
const APARTMENT_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "apartment", width: 2.35, depth: 2.9, height: 3.25, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#ead7bb", "#e3cfae"], roofColors: ["#6d8f6f", "#587a8e"] },
  { kind: "apartment", width: 3.0, depth: 1.7, height: 2.3, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e7c9a8", "#e3d0b4"], roofColors: ["#416f82", "#8a6f95"] },
  { kind: "apartment", width: 2.6, depth: 1.95, height: 2.05, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e3d0b4", "#ead7bb"], roofColors: ["#587a8e", "#6d8f6f"] },
];

/** Keep apartment window columns above the projected eave drop. */
function apartmentClearanceSafeMinHeight(width: number, depth: number): number {
  const projectedFootprintDepth = ((width + depth) * CITY_WORLD_TILE_BASIS.tileHeight) / 2;
  const eaveDrop = (projectedFootprintDepth / 2) * (1 - APARTMENT_INNER_COLUMN_OFFSET_RATIO * 2);
  const safety = 1.04;
  return Math.round(((eaveDrop * 1.35 * safety) / CITY_WORLD_TILE_BASIS.tileDepth) * 100) / 100;
}

/** Rotate the court pool per parcel ordinal so silhouettes step deterministically. */
function apartmentSpecForOrdinal(
  ordinal: number,
  rng: () => number,
  regionalPalette?: RegionalPalette,
  countyParameters?: CountyGenerationParameters,
): ZoneBuildingSpec {
  const template = APARTMENT_TEMPLATE_POOL[ordinal % APARTMENT_TEMPLATE_POOL.length] as ZoneBuildingTemplate;
  const spec = applyDimensionJitter(template, rng, regionalPalette, countyParameters);
  spec.height = Math.max(spec.height, apartmentClearanceSafeMinHeight(spec.width, spec.depth));
  return spec;
}

const GYM_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "gym", width: 4.0, depth: 2.6, height: 2.0, facadeStyle: "fitness", roofShape: "sawtooth", bodyColors: ["#d7e7ef", "#d3e2ea"], roofColors: ["#a76f4e", "#5f8fa6"] },
];

function applyDimensionJitter(
  template: ZoneBuildingTemplate,
  rng: () => number,
  regionalPalette?: RegionalPalette,
  countyParameters?: CountyGenerationParameters,
): ZoneBuildingSpec {
  const home = template.kind === "home";
  const riverTownHome = home && countyParameters?.archetypeProfile.archetype === "river_town";
  const jitter = (value: number, spread = 0.3) => Math.round(value * (1 + (rng() - 0.5) * spread) * 100) / 100;
  const width = jitter(template.width, riverTownHome ? 0.2 : home ? 0.14 : 0.3);
  const depth = jitter(template.depth, riverTownHome ? 0.18 : home ? 0.12 : 0.3);
  const height = jitter(template.height, home ? 0.08 : 0.3);
  const bodyPick = pickIndexed(rng, regionalPalette?.body ?? template.bodyColors);
  const roofPick = pickIndexed(rng, regionalPalette?.roof ?? template.roofColors);
  const paletteIndex = generatedTemplatePaletteIndex(bodyPick.index, roofPick.index, template, countyParameters);
  const regional = regionalPalette ? resolveRegionalBuildingPalette(regionalPalette, paletteIndex.body, paletteIndex.roof) : undefined;
  return applyCountyMassingModulation(
    {
      kind: template.kind,
      width,
      depth,
      height,
      bodyColor: regional?.bodyColor ?? bodyPick.value,
      roofColor: regional?.roofColor ?? roofPick.value,
      ...(regional ? { paletteKey: regional.paletteKey } : {}),
      facadeStyle: template.facadeStyle,
      roofShape: template.roofShape,
    },
    countyParameters,
  );
}

function generatedTemplatePaletteIndex(
  bodyIndex: number,
  roofIndex: number,
  template: ZoneBuildingTemplate,
  countyParameters?: CountyGenerationParameters,
): { body: number; roof: number } {
  if (
    countyParameters?.archetypeProfile.archetype === "metro_grid" &&
    (template.facadeStyle === "rowhome" || template.kind === "apartment")
  ) {
    return { body: bodyIndex + 1, roof: roofIndex + 1 };
  }
  return { body: bodyIndex, roof: roofIndex };
}

function applyCountyMassingModulation(
  spec: ZoneBuildingSpec,
  countyParameters: CountyGenerationParameters | undefined,
): ZoneBuildingSpec {
  if (!countyParameters) return spec;
  const profile = generatedMassingProfileFor(countyParameters);
  const modulation = countyParameters.modulation;
  const reliefLift = Math.max(0, modulation.reliefScale - 1);
  const heightBiasLift = modulation.heightBias * profile.heightBiasMultiplier;
  const baseHeightScale =
    profile.heightScale +
    heightBiasLift +
    (countyParameters.archetypeProfile.archetype === "mountain_valley" ? reliefLift * 0.7 : 0) +
    (countyParameters.archetypeProfile.archetype === "metro_grid" ? Math.max(0, modulation.densityScale - 1) * 0.8 : 0);
  const footprintScale =
    profile.footprintScale +
    (countyParameters.archetypeProfile.archetype === "desert_basin" ? Math.max(0, 0.5 - modulation.vegetationDensity) * 0.12 : 0) +
    (countyParameters.archetypeProfile.archetype === "prairie_town" ? Math.max(0, 0.54 - modulation.vegetationDensity) * 0.08 : 0);

  const width = roundDimension(spec.width * footprintScale);
  const depth = roundDimension(spec.depth * footprintScale);
  let height = roundDimension(spec.height * baseHeightScale);

  if (spec.kind === "home") {
    const footprintMin = Math.max(0.1, Math.min(width, depth));
    if (spec.facadeStyle === "rowhome") height = Math.min(height, 1.48);
    else if (spec.facadeStyle === "cottage") height = Math.min(height, 1.26, footprintMin * 1.12);
    else if (spec.facadeStyle === "ranch") height = Math.min(height, 1.18, footprintMin * 0.94);
  }

  return {
    ...spec,
    width,
    depth,
    height,
  };
}

function weightedResidentialTemplate(rng: () => number, countyParameters?: CountyGenerationParameters): ZoneBuildingTemplate | null {
  const profile = generatedMassingProfileFor(countyParameters);
  const pool =
    countyParameters?.archetypeProfile.archetype === "river_town"
      ? [...RESIDENTIAL_TEMPLATE_POOL, ...RIVER_TOWN_RESIDENTIAL_TEMPLATE_POOL]
      : RESIDENTIAL_TEMPLATE_POOL;
  const weighted = pool.map((entry) => ({
    template: entry.template,
    weight: entry.weight * residentialTemplateMultiplier(entry.template, profile),
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * totalWeight;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) return entry.template;
  }
  return weighted[weighted.length - 1]?.template ?? null;
}

function residentialTemplateMultiplier(template: ZoneBuildingTemplate, profile: GeneratedDistrictMassingProfile): number {
  if (template.facadeStyle === "rowhome") return profile.rowhomeWeight;
  if (template.facadeStyle === "ranch") return profile.ranchWeight;
  return profile.cottageWeight;
}

type GeneratedDistrictMassingProfile = {
  residentialDensityFloor: number;
  apartmentDensityFloor: number;
  commercialDensityFloor: number;
  residentialCell: number;
  apartmentCell: number;
  commercialCellWidth: number;
  commercialRowDepth: number;
  commercialStripFill: number;
  commercialMaxWidth: number;
  footprintScale: number;
  heightScale: number;
  heightBiasMultiplier: number;
  cottageWeight: number;
  ranchWeight: number;
  rowhomeWeight: number;
  cornerStoreMinParcels: number;
};

function generatedMassingProfileFor(countyParameters?: CountyGenerationParameters): GeneratedDistrictMassingProfile {
  if (!countyParameters) {
    return {
      residentialDensityFloor: 0.9,
      apartmentDensityFloor: 0.78,
      commercialDensityFloor: 0.85,
      residentialCell: 1.95,
      apartmentCell: 2.75,
      commercialCellWidth: 5.4,
      commercialRowDepth: 3.6,
      commercialStripFill: 0.84,
      commercialMaxWidth: 6.2,
      footprintScale: 1,
      heightScale: 1,
      heightBiasMultiplier: 3,
      cottageWeight: 1,
      ranchWeight: 1,
      rowhomeWeight: 1,
      cornerStoreMinParcels: CORNER_STORE_MIN_PARCELS,
    };
  }

  const archetype = countyParameters.archetypeProfile.archetype;
  const tierProfile = (profile: GeneratedDistrictMassingProfile): GeneratedDistrictMassingProfile =>
    applyUrbanizationTierMassingProfile(profile, countyParameters.urbanizationTier);
  if (archetype === "metro_grid") {
    return tierProfile({
      residentialDensityFloor: 0.91,
      apartmentDensityFloor: 0.86,
      commercialDensityFloor: 0.88,
      residentialCell: 1.7,
      apartmentCell: 2.35,
      commercialCellWidth: 4.7,
      commercialRowDepth: 3.25,
      commercialStripFill: 0.88,
      commercialMaxWidth: 5.8,
      footprintScale: 0.96,
      heightScale: 1.16,
      heightBiasMultiplier: 4.4,
      cottageWeight: 0.72,
      ranchWeight: 0.74,
      rowhomeWeight: 2.05,
      cornerStoreMinParcels: 7,
    });
  }
  if (archetype === "desert_basin") {
    return tierProfile({
      residentialDensityFloor: 0.62,
      apartmentDensityFloor: 0.48,
      commercialDensityFloor: 0.5,
      residentialCell: 2.32,
      apartmentCell: 3.55,
      commercialCellWidth: 7.2,
      commercialRowDepth: 4.2,
      commercialStripFill: 0.8,
      commercialMaxWidth: 6.8,
      footprintScale: 1.14,
      heightScale: 0.88,
      heightBiasMultiplier: 2.2,
      cottageWeight: 0.74,
      ranchWeight: 2.18,
      rowhomeWeight: 0.28,
      cornerStoreMinParcels: 9,
    });
  }
  if (archetype === "coastal_grid") {
    return tierProfile({
      residentialDensityFloor: 0.7,
      apartmentDensityFloor: 0.66,
      commercialDensityFloor: 0.74,
      residentialCell: 2.15,
      apartmentCell: 2.85,
      commercialCellWidth: 5.2,
      commercialRowDepth: 3.45,
      commercialStripFill: 0.9,
      commercialMaxWidth: 6.2,
      footprintScale: 1.02,
      heightScale: 1.02,
      heightBiasMultiplier: 3.1,
      cottageWeight: 1.18,
      ranchWeight: 1.08,
      rowhomeWeight: 0.58,
      cornerStoreMinParcels: 8,
    });
  }
  if (archetype === "mountain_valley") {
    return tierProfile({
      residentialDensityFloor: 0.64,
      apartmentDensityFloor: 0.52,
      commercialDensityFloor: 0.6,
      residentialCell: 2.35,
      apartmentCell: 3.25,
      commercialCellWidth: 6.25,
      commercialRowDepth: 3.9,
      commercialStripFill: 0.84,
      commercialMaxWidth: 6.4,
      footprintScale: 1.07,
      heightScale: 1.06,
      heightBiasMultiplier: 3.6,
      cottageWeight: 1.5,
      ranchWeight: 1.08,
      rowhomeWeight: 0.34,
      cornerStoreMinParcels: 8,
    });
  }
  if (archetype === "prairie_town") {
    return tierProfile({
      residentialDensityFloor: 0.6,
      apartmentDensityFloor: 0.45,
      commercialDensityFloor: 0.56,
      residentialCell: 2.45,
      apartmentCell: 3.45,
      commercialCellWidth: 6.4,
      commercialRowDepth: 4,
      commercialStripFill: 0.84,
      commercialMaxWidth: 6.6,
      footprintScale: 1.16,
      heightScale: 0.92,
      heightBiasMultiplier: 2.4,
      cottageWeight: 0.5,
      ranchWeight: 2.1,
      rowhomeWeight: 0.28,
      cornerStoreMinParcels: 9,
    });
  }

  return tierProfile({
    residentialDensityFloor: 0.66,
    apartmentDensityFloor: 0.6,
    commercialDensityFloor: 0.68,
    residentialCell: 2.3,
    apartmentCell: 2.95,
    commercialCellWidth: 5.7,
    commercialRowDepth: 3.55,
    commercialStripFill: 0.86,
    commercialMaxWidth: 6.2,
    footprintScale: 1.04,
    heightScale: 1,
    heightBiasMultiplier: 3,
    cottageWeight: 1.24,
    ranchWeight: 1.02,
    rowhomeWeight: 0.74,
    cornerStoreMinParcels: 8,
  });
}

function applyUrbanizationTierMassingProfile(
  profile: GeneratedDistrictMassingProfile,
  urbanizationTier: CountyGenerationParameters["urbanizationTier"],
): GeneratedDistrictMassingProfile {
  if (urbanizationTier === "urban_core") {
    return {
      ...profile,
      residentialDensityFloor: Math.min(0.96, profile.residentialDensityFloor + 0.04),
      apartmentDensityFloor: Math.min(0.92, profile.apartmentDensityFloor + 0.05),
      commercialDensityFloor: Math.min(0.94, profile.commercialDensityFloor + 0.04),
      residentialCell: profile.residentialCell * 0.94,
      apartmentCell: profile.apartmentCell * 0.94,
      commercialCellWidth: profile.commercialCellWidth * 0.94,
      heightScale: profile.heightScale + 0.04,
      rowhomeWeight: profile.rowhomeWeight * 1.25,
    };
  }
  if (urbanizationTier === "suburban") return profile;
  if (urbanizationTier === "town") {
    return {
      ...profile,
      residentialDensityFloor: profile.residentialDensityFloor * 0.88,
      apartmentDensityFloor: profile.apartmentDensityFloor * 0.78,
      commercialDensityFloor: profile.commercialDensityFloor * 0.86,
      residentialCell: profile.residentialCell * 1.08,
      apartmentCell: profile.apartmentCell * 1.08,
      commercialCellWidth: profile.commercialCellWidth * 1.06,
      rowhomeWeight: profile.rowhomeWeight * 0.72,
    };
  }
  if (urbanizationTier === "rural") {
    return {
      ...profile,
      residentialDensityFloor: Math.max(0.34, profile.residentialDensityFloor * 0.68),
      apartmentDensityFloor: Math.max(0.28, profile.apartmentDensityFloor * 0.5),
      commercialDensityFloor: Math.max(0.34, profile.commercialDensityFloor * 0.68),
      residentialCell: profile.residentialCell * 1.22,
      apartmentCell: profile.apartmentCell * 1.2,
      commercialCellWidth: profile.commercialCellWidth * 1.16,
      commercialStripFill: profile.commercialStripFill * 0.9,
      heightScale: profile.heightScale * 0.94,
      ranchWeight: profile.ranchWeight * 1.2,
      rowhomeWeight: profile.rowhomeWeight * 0.38,
      cornerStoreMinParcels: Math.max(profile.cornerStoreMinParcels, 12),
    };
  }
  return {
    ...profile,
    residentialDensityFloor: Math.max(0.22, profile.residentialDensityFloor * 0.42),
    apartmentDensityFloor: Math.max(0.18, profile.apartmentDensityFloor * 0.3),
    commercialDensityFloor: Math.max(0.22, profile.commercialDensityFloor * 0.45),
    residentialCell: profile.residentialCell * 1.48,
    apartmentCell: profile.apartmentCell * 1.35,
    commercialCellWidth: profile.commercialCellWidth * 1.32,
    commercialRowDepth: profile.commercialRowDepth * 1.1,
    commercialStripFill: profile.commercialStripFill * 0.82,
    commercialMaxWidth: Math.min(profile.commercialMaxWidth, 5.8),
    footprintScale: profile.footprintScale * 0.96,
    heightScale: profile.heightScale * 0.9,
    ranchWeight: profile.ranchWeight * 1.45,
    rowhomeWeight: profile.rowhomeWeight * 0.16,
    cornerStoreMinParcels: 99,
  };
}

function buildingSpecForZone(
  kind: CityWorldZoneKind,
  rng: () => number,
  regionalPalette?: RegionalPalette,
  countyParameters?: CountyGenerationParameters,
): ZoneBuildingSpec | null {
  if (kind === "residential") {
    const template = weightedResidentialTemplate(rng, countyParameters);
    return template ? applyDimensionJitter(template, rng, regionalPalette, countyParameters) : null;
  }
  if (kind === "commercial") {
    return applyDimensionJitter(pick(rng, COMMERCIAL_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
  }
  if (kind === "apartments") {
    return applyDimensionJitter(pick(rng, APARTMENT_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
  }
  if (kind === "gym") {
    return applyDimensionJitter(pick(rng, GYM_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
  }
  if (kind === "civic") {
    const regional = regionalPalette ? resolveRegionalBuildingPalette(regionalPalette, 0, 0) : undefined;
    const archetype = countyParameters?.archetypeProfile.archetype;
    const metroTower = archetype === "metro_grid";
    const mountainRidge = archetype === "mountain_valley";
    const heightBias = countyParameters?.modulation.heightBias ?? 0;
    const reliefLift = Math.max(0, (countyParameters?.modulation.reliefScale ?? 1) - 1);
    return {
      kind: "civic",
      width: metroTower ? 2.4 : mountainRidge ? 3.65 : 3.4,
      depth: metroTower ? 2.0 : mountainRidge ? 2.55 : 2.45,
      height: roundDimension((metroTower ? 3.35 : mountainRidge ? 1.9 : 1.65) + heightBias * 4 + (mountainRidge ? reliefLift * 1.4 : 0)),
      bodyColor: regional?.bodyColor ?? "#f3dfbd",
      roofColor: regional?.roofColor ?? "#5d8fa8",
      ...(regional ? { paletteKey: regional.paletteKey } : {}),
      facadeStyle: "civic",
      roofShape: metroTower ? "tower" : "hip",
    };
  }
  return null;
}

function regionalTerrainKeyForKind(kind: CityWorldTerrainKind, regionalPalette: RegionalPalette | undefined): string {
  if (!regionalPalette || kind === "water") return `terrain.${kind}`;
  return regionalTerrainPaletteKey(regionalPalette.archetype);
}

function pickIndexed<T>(rng: () => number, values: readonly T[]): { value: T; index: number } {
  const index = Math.floor(rng() * values.length) % values.length;
  return { value: values[index] as T, index };
}

function parcelFootprint(kind: CityWorldZoneKind): { width: number; depth: number } {
  if (kind === "residential") return { width: 1.7, depth: 1.45 };
  if (kind === "commercial") return { width: 3.6, depth: 2.1 };
  if (kind === "apartments") return { width: 3.0, depth: 2.3 };
  if (kind === "gym") return { width: 4.6, depth: 3.2 };
  return { width: 3.4, depth: 2.6 };
}

// 0.74F full prop kit + E2c vegetation grammar. Placement is deterministic and
// authored from zone edges, road frontages, water edges, and terrain relief.
// No cars, no humans; generated draft windows still own the visible prop cap.
type ZonePropSpec = { kind: CityWorldProp["kind"]; point: CityWorldPoint; variant?: number };

type PropPlacementContext = {
  spec: CityWorldParametricSpec;
  roadSegments: CityWorldRoadSegment[];
  archetype: GeneratedDistrictArchetype | undefined;
  vegetationDensity: number;
};

function zonePropsForZone(
  zone: CityWorldZoneSpec,
  rng: () => number,
  spec: CityWorldParametricSpec,
  roadSegments: CityWorldRoadSegment[],
): CityWorldProp[] {
  const context = propPlacementContext(spec, roadSegments);
  const { rect } = zone;
  const at = (fx: number, fy: number): CityWorldPoint => ({
    x: rect.minX + (rect.maxX - rect.minX) * fx,
    y: rect.minY + (rect.maxY - rect.minY) * fy,
    z: 0,
  });
  const specs: ZonePropSpec[] = [];
  const desert = context.archetype === "desert_basin";
  const vegetationRng = propZoneRng(spec, zone);

  if (zone.kind === "residential") {
    if (desert) {
      addDesertScrub(specs, zone, context, 2, vegetationRng);
    } else {
      addStreetTreeRhythm(specs, zone, context, vegetationRng, residentialStreetTreeCap(context.archetype));
      addVegetationSpec(specs, context, "bush", at(0.1, 0.9), 0);
      if (context.archetype === "prairie_town") addPrairieShelterRow(specs, zone, context, vegetationRng, 4);
      if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
    }
    specs.push({ kind: "streetlight", point: at(0.94, 0.08) });
  } else if (zone.kind === "commercial") {
    specs.push(
      { kind: "sign", point: at(0.08, 0.9), variant: Math.floor(rng() * 3) },
      { kind: "streetlight", point: at(0.5, 0.94) },
      { kind: "streetlight", point: at(0.92, 0.1) },
      { kind: "bench", point: at(0.3, 0.08) },
      { kind: "bench", point: at(0.7, 0.08) },
    );
    if (context.archetype === "prairie_town") {
      addPrairieShelterRow(specs, zone, context, vegetationRng, 2);
      addPrairieFieldCorners(specs, zone, context, vegetationRng, 2);
    } else if (context.archetype === "metro_grid" || context.archetype === "river_town") {
      addStreetTreeRhythm(specs, zone, context, vegetationRng, 2);
    } else if (context.archetype === "coastal_grid") {
      addStreetTreeRhythm(specs, zone, context, vegetationRng, 1);
    }
  } else if (zone.kind === "civic") {
    specs.push(
      { kind: "fountain", point: at(0.5, 0.86) },
      { kind: "bench", point: at(0.3, 0.9) },
      { kind: "bench", point: at(0.7, 0.9) },
    );
    if (desert) {
      addDesertScrub(specs, zone, context, 1, vegetationRng);
    } else {
      addVegetationSpec(specs, context, "tree", at(0.06, 0.5), 3);
      if (context.archetype !== "coastal_grid") addVegetationSpec(specs, context, "tree", at(0.94, 0.5), 4);
      if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
    }
  } else if (zone.kind === "gym") {
    specs.push({ kind: "sign", point: at(0.9, 0.88), variant: 1 }, { kind: "streetlight", point: at(0.08, 0.1) });
    if (desert) addDesertScrub(specs, zone, context, 1, vegetationRng);
  } else if (zone.kind === "apartments") {
    specs.push(
      { kind: "bench", point: at(0.5, 0.06) },
      { kind: "streetlight", point: at(0.08, 0.92) },
    );
    if (desert) {
      addDesertScrub(specs, zone, context, 1, vegetationRng);
    } else {
      addVegetationSpec(specs, context, "bush", at(0.1, 0.08), 0);
      addVegetationSpec(specs, context, "bush", at(0.9, 0.92), 1);
      addStreetTreeRhythm(specs, zone, context, vegetationRng, apartmentStreetTreeCap(context.archetype));
      if (context.archetype === "prairie_town") addPrairieFieldCorners(specs, zone, context, vegetationRng, 2);
      if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
    }
  } else if (zone.kind === "park") {
    const area = (rect.maxX - rect.minX) * (rect.maxY - rect.minY);
    if (desert) {
      addDesertScrub(specs, zone, context, 2, vegetationRng);
    } else if (context.archetype === "prairie_town") {
      addPrairieShelterRow(specs, zone, context, vegetationRng, vegetationBand(7, 9, context.vegetationDensity));
      addParkTreeCluster(specs, zone, context, vegetationRng, vegetationBand(7, 9, context.vegetationDensity));
      addPrairieFieldCorners(specs, zone, context, vegetationRng, 4);
      addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
    } else {
      const parkTreeCount = context.archetype === "coastal_grid" || context.archetype === "mountain_valley"
        ? vegetationBand(7, 9, context.vegetationDensity)
        : vegetationBand(5, 9, context.vegetationDensity);
      addParkTreeCluster(specs, zone, context, vegetationRng, parkTreeCount);
      addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
      if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
    }
    specs.push({ kind: "bench", point: at(0.16, 0.46) }, { kind: "bench", point: at(0.62, 0.16) });
    if (area >= 40) specs.push({ kind: "fountain", point: at(0.5, 0.5) });
  } else if (zone.kind === "water") {
    specs.push(...waterAccentProps(zone, rng));
    addShorelineCluster(specs, zone, context, vegetationRng);
  } else if (zone.kind === "plaza" && context.archetype === "metro_grid") {
    addParkTreeCluster(specs, zone, context, vegetationRng, vegetationBand(7, 9, context.vegetationDensity));
    addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
  } else if (zone.kind === "plaza" && desert) {
    addDesertScrub(specs, zone, context, 2, vegetationRng);
  }

  return specs.map((entry, index) =>
    withPropMetadata({
      id: `gen-prop-${zone.id}-${index}`,
      kind: entry.kind,
      position: entry.point,
      variant: entry.variant ?? index % 5,
    }),
  );
}

function propPlacementContext(spec: CityWorldParametricSpec, roadSegments: CityWorldRoadSegment[]): PropPlacementContext {
  return {
    spec,
    roadSegments,
    archetype: spec.countyParameters?.archetype ?? spec.regionalPalette?.archetype,
    vegetationDensity: spec.countyParameters?.modulation.vegetationDensity ?? 0.5,
  };
}

function standaloneZonePropsEnabled(zone: CityWorldZoneSpec, spec: CityWorldParametricSpec): boolean {
  const archetype = spec.countyParameters?.archetype ?? spec.regionalPalette?.archetype;
  return zone.kind === "plaza" && archetype === "metro_grid";
}

function propZoneRng(spec: CityWorldParametricSpec, zone: CityWorldZoneSpec): () => number {
  let seed = (spec.seed ?? 1) >>> 0;
  const key = `${spec.id}:${zone.id}:e2-vegetation`;
  for (let index = 0; index < key.length; index += 1) {
    seed = Math.imul(seed ^ key.charCodeAt(index), 16777619) >>> 0;
  }
  return mulberry32(seed);
}

function waterAccentProps(zone: CityWorldZoneSpec, rng: () => number): ZonePropSpec[] {
  const wideBand = zone.rect.maxX - zone.rect.minX > (zone.rect.maxY - zone.rect.minY) * 1.6;
  const at = (fx: number, fy: number): CityWorldPoint => zonePoint(zone, fx, fy);
  if (wideBand) {
    return [
      { kind: "water_shimmer", point: at(0.22, 0.34) },
      { kind: "water_shimmer", point: at(0.52, 0.58) },
      { kind: "water_shimmer", point: at(0.78, 0.42) },
      { kind: "dock", point: at(0.66, 0.08) },
      { kind: "boat", point: at(0.66, 0.36), variant: Math.floor(rng() * 2) },
    ];
  }

  return [
    { kind: "water_shimmer", point: at(0.3, 0.24) },
    { kind: "water_shimmer", point: at(0.6, 0.56) },
    { kind: "water_shimmer", point: at(0.45, 0.82) },
    { kind: "dock", point: at(0.08, 0.42) },
    { kind: "boat", point: at(0.38, 0.56), variant: Math.floor(rng() * 2) },
  ];
}

function residentialStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
  if (archetype === "metro_grid" || archetype === "coastal_grid" || archetype === "river_town") return 5;
  if (archetype === "mountain_valley" || archetype === "prairie_town") return 4;
  return 4;
}

function apartmentStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
  if (archetype === "metro_grid" || archetype === "coastal_grid" || archetype === "river_town") return 3;
  return 2;
}

function mountainPineClusterCount(context: PropPlacementContext): number {
  return vegetationBand(4, 6, context.vegetationDensity);
}

function addStreetTreeRhythm(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
  maxTrees: number,
): void {
  let added = 0;
  for (const frontage of roadFrontagesForZone(zone, context.roadSegments)) {
    if (added >= maxTrees) return;
    const available = Math.max(0, maxTrees - added);
    const length = frontage.end - frontage.start;
    const spacing = streetTreeSpacing(context);
    const count = Math.min(available, Math.max(1, Math.floor(length / spacing)));
    for (let index = 0; index < count; index += 1) {
      const t = (index + 1) / (count + 1);
      const wobble = (rng() - 0.5) * 0.35;
      const point =
        frontage.axis === "x"
          ? { x: frontage.start + length * t, y: frontage.offset + wobble, z: 0 }
          : { x: frontage.offset + wobble, y: frontage.start + length * t, z: 0 };
      if (addVegetationSpec(specs, context, "tree", point, added + index)) added += 1;
    }
  }
}

function streetTreeSpacing(context: PropPlacementContext): number {
  if (context.archetype === "metro_grid") return 3.1;
  if (context.archetype === "coastal_grid" || context.archetype === "river_town") return 3.5;
  if (context.archetype === "prairie_town") return 3.8;
  if (context.archetype === "mountain_valley") return 4.0;
  return 4.8 + (1 - context.vegetationDensity) * 1.2;
}

function addParkTreeCluster(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
  count: number,
): void {
  const cluster = [
    [0.3, 0.72],
    [0.55, 0.74],
    [0.42, 0.86],
    [0.7, 0.88],
    [0.24, 0.9],
    [0.18, 0.64],
    [0.82, 0.7],
    [0.63, 0.58],
    [0.48, 0.95],
  ] as const;
  for (let index = 0; index < Math.min(count, cluster.length); index += 1) {
    const [fx, fy] = cluster[index]!;
    addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index);
  }
}

function addPrairieShelterRow(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
  count: number,
): void {
  const vertical = zone.rect.maxY - zone.rect.minY >= zone.rect.maxX - zone.rect.minX;
  for (let index = 0; index < count; index += 1) {
    const t = (index + 1) / (count + 1);
    const wobble = (rng() - 0.5) * 0.22;
    const point = vertical
      ? { x: zone.rect.maxX - 0.85 + wobble, y: zone.rect.minY + (zone.rect.maxY - zone.rect.minY) * t, z: 0 }
      : { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * t, y: zone.rect.maxY - 0.85 + wobble, z: 0 };
    addVegetationSpec(specs, context, "tree", point, index + 2);
  }
}

function addPrairieFieldCorners(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
  count: number,
): void {
  const corners = [
    [0.12, 0.16],
    [0.88, 0.16],
    [0.12, 0.84],
    [0.88, 0.84],
  ] as const;
  for (let index = 0; index < Math.min(count, corners.length); index += 1) {
    const [fx, fy] = corners[index]!;
    addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index + 5);
  }
}

function addMountainPineCluster(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
  count: number,
): void {
  const candidates = ([
    [0.18, 0.18],
    [0.82, 0.18],
    [0.18, 0.82],
    [0.82, 0.82],
    [0.5, 0.22],
    [0.5, 0.78],
  ] as const).map(([fx, fy]) => {
    const point = zonePoint(zone, fx, fy);
    return { point, relief: reliefAtBilinear(context.spec, point.x, point.y) };
  }).sort((a, b) => b.relief - a.relief);

  for (let index = 0; index < Math.min(count, candidates.length); index += 1) {
    const base = candidates[index]!.point;
    addVegetationSpec(
      specs,
      context,
      "tree",
      { x: base.x + (rng() - 0.5) * 0.28, y: base.y + (rng() - 0.5) * 0.28, z: 0 },
      index + 3,
    );
  }
}

function addShorelineCluster(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
): void {
  if (context.archetype !== "coastal_grid" && context.archetype !== "river_town") return;
  const wideBand = zone.rect.maxX - zone.rect.minX > (zone.rect.maxY - zone.rect.minY) * 1.6;
  const count = wideBand ? vegetationBand(4, 5, context.vegetationDensity) : vegetationBand(4, 6, context.vegetationDensity);
  if (wideBand) {
    addHorizontalShorelineCluster(specs, zone, context, rng, count);
    return;
  }
  const banks = context.archetype === "river_town" ? shorelineBankXs(zone, context.roadSegments) : [shorelineLandwardXs(zone, context.roadSegments)];
  const fractions = [0.18, 0.34, 0.52, 0.68, 0.84, 0.92];
  for (let bankIndex = 0; bankIndex < banks.length; bankIndex += 1) {
    const bankXs = banks[bankIndex]!;
    let added = 0;
    for (const fy of fractions) {
      if (added >= count) break;
      for (const x of bankXs) {
        const point = { x: x + (rng() - 0.5) * 0.18, y: zone.rect.minY + (zone.rect.maxY - zone.rect.minY) * fy, z: 0 };
        if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
          added += 1;
          break;
        }
      }
    }
  }
}

function addHorizontalShorelineCluster(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  rng: () => number,
  count: number,
): void {
  const banks = shorelineBankYs(zone, context.roadSegments);
  const fractions = [0.14, 0.26, 0.38, 0.52, 0.66, 0.8, 0.9];
  for (let bankIndex = 0; bankIndex < banks.length; bankIndex += 1) {
    const bankYs = banks[bankIndex]!;
    let added = 0;
    for (const fx of fractions) {
      if (added >= count) break;
      for (const y of bankYs) {
        const point = { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * fx + (rng() - 0.5) * 0.24, y: y + (rng() - 0.5) * 0.12, z: 0 };
        if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
          added += 1;
          break;
        }
      }
    }

    const bushFx = bankIndex === 0 ? 0.08 : 0.92;
    for (const y of bankYs) {
      if (addVegetationSpec(specs, context, "bush", { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * bushFx, y, z: 0 }, bankIndex + 1)) break;
    }
  }
}

function addDesertScrub(
  specs: ZonePropSpec[],
  zone: CityWorldZoneSpec,
  context: PropPlacementContext,
  count: number,
  rng: () => number,
): void {
  const points = [
    [0.16, 0.2],
    [0.82, 0.74],
    [0.28, 0.82],
    [0.68, 0.22],
  ] as const;
  for (let index = 0; index < count && index < points.length; index += 1) {
    const [fx, fy] = points[index]!;
    addVegetationSpec(specs, context, "bush", jitteredZonePoint(zone, fx, fy, rng, 0.2), index);
  }
}

function addVegetationSpec(
  specs: ZonePropSpec[],
  context: PropPlacementContext,
  kind: "tree" | "bush",
  rawPoint: CityWorldPoint,
  variant = specs.length,
): boolean {
  const point = { x: roundDimension(rawPoint.x), y: roundDimension(rawPoint.y), z: 0 };
  if (!pointInsideGeneratedBounds(point, context.spec)) return false;
  if (!pointClearsRoads(point, context.roadSegments)) return false;
  if (pointInsideWaterZone(point, context.spec)) return false;
  if (specs.some((entry) => (entry.kind === "tree" || entry.kind === "bush") && distance2(entry.point, point) < 0.72)) return false;
  specs.push({ kind, point, variant });
  return true;
}

function roadFrontagesForZone(
  zone: CityWorldZoneSpec,
  roads: CityWorldRoadSegment[],
): Array<{ axis: "x" | "y"; start: number; end: number; offset: number; roadId: string }> {
  const frontages: Array<{ axis: "x" | "y"; start: number; end: number; offset: number; roadId: string }> = [];
  const center = zoneCenter(zone);
  for (const road of roads) {
    if (road.kind === "crosswalk") continue;
    const horizontal = road.from.y === road.to.y;
    const vertical = road.from.x === road.to.x;
    const half = road.width / 2 + ROAD_CLEARANCE_MARGIN + 0.72;
    if (horizontal) {
      const roadY = road.from.y;
      const roadMinX = Math.min(road.from.x, road.to.x);
      const roadMaxX = Math.max(road.from.x, road.to.x);
      if (roadY < zone.rect.minY - 2.6 || roadY > zone.rect.maxY + 2.6) continue;
      const start = Math.max(zone.rect.minX + 1, roadMinX + 1);
      const end = Math.min(zone.rect.maxX - 1, roadMaxX - 1);
      if (end - start < 2.2) continue;
      frontages.push({
        axis: "x",
        start,
        end,
        offset: cityWorldClamp(roadY <= center.y ? roadY + half : roadY - half, zone.rect.minY + 0.85, zone.rect.maxY - 0.85),
        roadId: road.id,
      });
    } else if (vertical) {
      const roadX = road.from.x;
      const roadMinY = Math.min(road.from.y, road.to.y);
      const roadMaxY = Math.max(road.from.y, road.to.y);
      if (roadX < zone.rect.minX - 2.6 || roadX > zone.rect.maxX + 2.6) continue;
      const start = Math.max(zone.rect.minY + 1, roadMinY + 1);
      const end = Math.min(zone.rect.maxY - 1, roadMaxY - 1);
      if (end - start < 2.2) continue;
      frontages.push({
        axis: "y",
        start,
        end,
        offset: cityWorldClamp(roadX <= center.x ? roadX + half : roadX - half, zone.rect.minX + 0.85, zone.rect.maxX - 0.85),
        roadId: road.id,
      });
    }
  }
  return frontages.sort((a, b) => a.roadId.localeCompare(b.roadId));
}

function shorelineLandwardXs(zone: CityWorldZoneSpec, roads: CityWorldRoadSegment[]): number[] {
  const verticalRoad = roads
    .filter((road) => road.kind !== "crosswalk" && road.from.x === road.to.x)
    .filter((road) => Math.abs(road.from.x - zone.rect.minX) <= 3.4)
    .sort((a, b) => Math.abs(a.from.x - zone.rect.minX) - Math.abs(b.from.x - zone.rect.minX))[0];
  const roadWestX = verticalRoad ? verticalRoad.from.x - verticalRoad.width / 2 - ROAD_CLEARANCE_MARGIN - 0.85 : Number.NaN;
  return [zone.rect.minX - 0.38, zone.rect.minX - 0.72, zone.rect.minX - 1.28, roadWestX].filter(Number.isFinite);
}

function shorelineBankXs(zone: CityWorldZoneSpec, roads: CityWorldRoadSegment[]): number[][] {
  const west = shorelineLandwardXs(zone, roads);
  const verticalRoad = roads
    .filter((road) => road.kind !== "crosswalk" && road.from.x === road.to.x)
    .filter((road) => Math.abs(road.from.x - zone.rect.maxX) <= 3.4)
    .sort((a, b) => Math.abs(a.from.x - zone.rect.maxX) - Math.abs(b.from.x - zone.rect.maxX))[0];
  const roadEastX = verticalRoad ? verticalRoad.from.x + verticalRoad.width / 2 + ROAD_CLEARANCE_MARGIN + 0.85 : Number.NaN;
  const east = [zone.rect.maxX + 0.38, zone.rect.maxX + 0.72, zone.rect.maxX + 1.18, roadEastX].filter(Number.isFinite);
  return [west, east];
}

function shorelineBankYs(zone: CityWorldZoneSpec, roads: CityWorldRoadSegment[]): number[][] {
  const horizontalRoadNorth = roads
    .filter((road) => road.kind !== "crosswalk" && road.from.y === road.to.y)
    .filter((road) => Math.abs(road.from.y - zone.rect.minY) <= 3.4)
    .sort((a, b) => Math.abs(a.from.y - zone.rect.minY) - Math.abs(b.from.y - zone.rect.minY))[0];
  const roadNorthY = horizontalRoadNorth ? horizontalRoadNorth.from.y - horizontalRoadNorth.width / 2 - ROAD_CLEARANCE_MARGIN - 0.85 : Number.NaN;
  const north = [zone.rect.minY - 0.38, zone.rect.minY - 0.72, zone.rect.minY - 1.18, roadNorthY].filter(Number.isFinite);

  const horizontalRoadSouth = roads
    .filter((road) => road.kind !== "crosswalk" && road.from.y === road.to.y)
    .filter((road) => Math.abs(road.from.y - zone.rect.maxY) <= 3.4)
    .sort((a, b) => Math.abs(a.from.y - zone.rect.maxY) - Math.abs(b.from.y - zone.rect.maxY))[0];
  const roadSouthY = horizontalRoadSouth ? horizontalRoadSouth.from.y + horizontalRoadSouth.width / 2 + ROAD_CLEARANCE_MARGIN + 0.85 : Number.NaN;
  const south = [zone.rect.maxY + 0.38, zone.rect.maxY + 0.72, zone.rect.maxY + 1.18, roadSouthY].filter(Number.isFinite);
  return [north, south];
}

function vegetationBand(min: number, max: number, vegetationDensity: number): number {
  return Math.max(min, Math.min(max, Math.round(min + (max - min) * clamp01(vegetationDensity))));
}

function jitteredZonePoint(zone: CityWorldZoneSpec, fx: number, fy: number, rng: () => number, amount: number): CityWorldPoint {
  const point = zonePoint(zone, fx, fy);
  return {
    x: point.x + (rng() - 0.5) * amount,
    y: point.y + (rng() - 0.5) * amount,
    z: 0,
  };
}

function zonePoint(zone: CityWorldZoneSpec, fx: number, fy: number): CityWorldPoint {
  return {
    x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * fx,
    y: zone.rect.minY + (zone.rect.maxY - zone.rect.minY) * fy,
    z: 0,
  };
}

function pointClearsRoads(point: CityWorldPoint, roads: CityWorldRoadSegment[]): boolean {
  for (const road of roads) {
    if (road.kind === "crosswalk") continue;
    const halfCorridor = road.width / 2 + ROAD_CLEARANCE_MARGIN;
    const minX = Math.min(road.from.x, road.to.x) - halfCorridor;
    const maxX = Math.max(road.from.x, road.to.x) + halfCorridor;
    const minY = Math.min(road.from.y, road.to.y) - halfCorridor;
    const maxY = Math.max(road.from.y, road.to.y) + halfCorridor;
    if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) return false;
  }
  return true;
}

function pointInsideGeneratedBounds(point: CityWorldPoint, spec: CityWorldParametricSpec): boolean {
  return point.x >= 0 && point.x <= spec.size.width && point.y >= 0 && point.y <= spec.size.height;
}

function pointInsideWaterZone(point: CityWorldPoint, spec: CityWorldParametricSpec): boolean {
  return spec.zones.some((zone) => zone.kind === "water" && point.x >= zone.rect.minX && point.x <= zone.rect.maxX && point.y >= zone.rect.minY && point.y <= zone.rect.maxY);
}

function distance2(first: CityWorldPoint, second: CityWorldPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

type ParametricCameraScenery = {
  bounds: CityWorldBounds;
  terrainTiles: CityWorldTerrainTile[];
  waterTiles: CityWorldTerrainTile[];
  roadSegments: CityWorldRoadSegment[];
  lots: CityWorldLot[];
  buildings: CityWorldBuilding[];
};

const WATER_AWARE_FRAME_TILE_FLOOR = 18;
const WATER_AWARE_FRAME_BONUS_WEIGHT = 0.08;
const WATER_AWARE_DESKTOP_LOWER_OCCUPANCY_FLOOR = 0.18;
const WATER_AWARE_MOBILE_LOWER_OCCUPANCY_FLOOR = 0.1;

// Mirrors the diagnostics viewport-composition formula (massing 0.25 +
// feature density 0.45 + object-family variety 0.3) over the REAL projected
// frame, so the chosen commerce camera provably clears the composition floor.
function commerceFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
  const frame = cityWorldViewportFrameForCameraPreset({ id: "commerce_detail", center, zoom: 1.58 });
  const tiles = scenery.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
  const lots = scenery.lots.filter((lot) => cityWorldPointInsideFrame(lot.position, frame));
  const roads = scenery.roadSegments.filter((road) => cityWorldSegmentTouchesFrame(road.from, road.to, frame));
  const buildings = scenery.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));
  const massing = tiles.length > 0 ? tiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length / tiles.length : 0;
  const featureDensity = cityWorldClamp((lots.length + roads.length * 2 + buildings.length * 3) / Math.max(1, tiles.length * 0.26), 0, 1);
  const families = new Set(buildings.map((building) => building.visualGrammar?.objectFamily).filter(Boolean)).size;
  return massing * 0.25 + featureDensity * 0.45 + cityWorldClamp(families / 4, 0, 1) * 0.3;
}

function overviewFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
  const frame = cityWorldViewportFrameForCameraPreset({ id: "desktop", center, zoom: 1.32 });
  const tiles = scenery.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
  const lots = scenery.lots.filter((lot) => cityWorldPointInsideFrame(lot.position, frame));
  const roads = scenery.roadSegments.filter((road) => cityWorldSegmentTouchesFrame(road.from, road.to, frame));
  const buildings = scenery.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));
  const massing = tiles.length > 0 ? tiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length / tiles.length : 0;
  const featureDensity = cityWorldClamp((lots.length + roads.length * 2 + buildings.length * 3) / Math.max(1, tiles.length * 0.26), 0, 1);
  const families = new Set(buildings.map((building) => building.visualGrammar?.objectFamily).filter(Boolean)).size;
  return massing * 0.25 + featureDensity * 0.45 + cityWorldClamp(families / 4, 0, 1) * 0.3;
}

function waterAwareOverviewFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
  return overviewFrameCompositionScore(center, scenery) + waterPresenceFrameBonus(center, scenery, "desktop", 1.32);
}

function waterPresenceFrameBonus(
  center: CityWorldPoint,
  scenery: ParametricCameraScenery,
  presetId: "desktop" | "mobile",
  zoom: number,
): number {
  const rawFrame = cityWorldViewportFrameForCameraPreset({ id: presetId, center, zoom });
  const frame = {
    minX: Math.max(rawFrame.minX, scenery.bounds.minX),
    maxX: Math.min(rawFrame.maxX, scenery.bounds.maxX),
    minY: Math.max(rawFrame.minY, scenery.bounds.minY),
    maxY: Math.min(rawFrame.maxY, scenery.bounds.maxY),
  };
  const waterTiles = scenery.waterTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame)).length;
  if (waterTiles < WATER_AWARE_FRAME_TILE_FLOOR) return 0;

  const buildings = scenery.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));
  if (buildings.length === 0) return 0;

  const lowerOccupancy = frameLowerBuildingOccupancy(frame, buildings);
  const lowerFloor = presetId === "mobile" ? WATER_AWARE_MOBILE_LOWER_OCCUPANCY_FLOOR : WATER_AWARE_DESKTOP_LOWER_OCCUPANCY_FLOOR;
  if (lowerOccupancy < lowerFloor) return 0;

  const waterPresence = cityWorldClamp(waterTiles / WATER_AWARE_FRAME_TILE_FLOOR, 0, 1);
  const builtPresence = cityWorldClamp(buildings.length / 4, 0, 1);
  return waterPresence * builtPresence * WATER_AWARE_FRAME_BONUS_WEIGHT;
}

function frameLowerBuildingOccupancy(
  frame: { minX: number; maxX: number; minY: number; maxY: number },
  buildings: CityWorldBuilding[],
): number {
  const midScreenY = (frame.minX + frame.maxX + frame.minY + frame.maxY) / 2;
  const bandArea = Math.max(0.0001, (frame.maxX - frame.minX) * (frame.maxY - frame.minY) * 0.5);
  const lowerArea = buildings
    .filter((building) => building.position.x + building.position.y >= midScreenY)
    .reduce((sum, building) => sum + building.width * building.depth, 0);
  return cityWorldClamp(lowerArea / bandArea, 0, 1);
}

function generatedOverviewFocus(
  builtZones: CityWorldZoneSpec[],
  fallback: { x: number; y: number },
  scenery: ParametricCameraScenery,
  scorer: (center: CityWorldPoint, scenery: ParametricCameraScenery) => number = overviewFrameCompositionScore,
): { x: number; y: number } {
  return bestGeneratedFocus(builtZones, fallback, scenery, scorer).focus;
}

function bestGeneratedFocus(
  zones: CityWorldZoneSpec[],
  fallback: { x: number; y: number },
  scenery: ParametricCameraScenery,
  scorer: (center: CityWorldPoint, scenery: ParametricCameraScenery) => number,
): { focus: { x: number; y: number }; score: number } {
  const offsets = [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: -2 },
    { x: 0, y: 2 },
  ];
  const anchors = zones.flatMap((zone) => {
    const center = zoneCenter(zone);
    return offsets.map((offset) => ({ x: center.x + offset.x, y: center.y + offset.y }));
  });
  for (let a = 0; a < zones.length; a += 1) {
    for (let b = a + 1; b < zones.length; b += 1) {
      const zoneA = zones[a];
      const zoneB = zones[b];
      if (zoneA && zoneB) {
        const midpoint = averagePoint([zoneCenter(zoneA), zoneCenter(zoneB)]);
        for (const offset of offsets) anchors.push({ x: midpoint.x + offset.x, y: midpoint.y + offset.y });
      }
    }
  }
  if (anchors.length === 0) anchors.push(fallback);

  let focus = anchors[0] ?? fallback;
  let score = -1;
  for (const candidate of anchors) {
    const candidateScore = scorer({ x: candidate.x, y: candidate.y, z: 0 }, scenery);
    if (candidateScore > score) {
      score = candidateScore;
      focus = candidate;
    }
  }
  return { focus, score };
}

function mobileOverviewFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
  const frame = cityWorldViewportFrameForCameraPreset({ id: "mobile", center, zoom: 0.92 });
  const tiles = scenery.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
  const lots = scenery.lots.filter((lot) => cityWorldPointInsideFrame(lot.position, frame));
  const roads = scenery.roadSegments.filter((road) => cityWorldSegmentTouchesFrame(road.from, road.to, frame));
  const buildings = scenery.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));
  const massing = tiles.length > 0 ? tiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length / tiles.length : 0;
  const featureDensity = cityWorldClamp((lots.length + roads.length * 2 + buildings.length * 3) / Math.max(1, tiles.length * 0.26), 0, 1);
  const families = new Set(buildings.map((building) => building.visualGrammar?.objectFamily).filter(Boolean)).size;
  return massing * 0.25 + featureDensity * 0.45 + cityWorldClamp(families / 4, 0, 1) * 0.3;
}

function waterAwareMobileOverviewFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
  return mobileOverviewFrameCompositionScore(center, scenery) + waterPresenceFrameBonus(center, scenery, "mobile", 0.92);
}

function parametricCameraPresets(
  bounds: CityWorldBounds,
  zones: CityWorldZoneSpec[],
  scenery: ParametricCameraScenery,
  countyParameters?: CountyGenerationParameters,
): CityWorldScene["cameraPresets"] {
  // Center the primary cameras on the built-up mass (centroid of buildable
  // zones) rather than the raw grid center, so the first viewport is dense.
  const built = zones.filter((zone) => ZONE_TO_LOT[zone.kind] && zone.kind !== "water");
  const focus = built.length > 0 ? averagePoint(built.map(zoneCenter)) : { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const waterAware = isWaterGeneratedArchetype(countyParameters?.archetypeProfile.archetype);
  const openingFocus = countyParameters
    ? generatedOverviewFocus(built, focus, scenery, waterAware ? waterAwareOverviewFrameCompositionScore : overviewFrameCompositionScore)
    : focus;
  const mobileFocus = countyParameters
    ? generatedOverviewFocus(
        built,
        { x: openingFocus.x, y: openingFocus.y + 3 },
        scenery,
        waterAware ? waterAwareMobileOverviewFrameCompositionScore : mobileOverviewFrameCompositionScore,
      )
    : { x: openingFocus.x, y: openingFocus.y + 4 };
  const center = { x: openingFocus.x, y: openingFocus.y, z: 0 };
  const residentialZone = zones.find((zone) => zone.kind === "residential");
  // Frame the "downtown mass" (mixed non-residential families) for the commerce
  // detail camera so it reads more than one object family.
  const downtownZones = zones.filter((zone) => zone.kind === "commercial" || zone.kind === "civic" || zone.kind === "gym" || zone.kind === "apartments");
  const residentialFocus = residentialZone ? zoneCenter(residentialZone) : focus;
  // The commerce camera FINDS the densest mixed downtown frame instead of
  // guessing from zone geometry: averaging dispersed zone centers lands the
  // frame in the road gap between blocks, where it reads as empty field.
  // Candidates are zone centers plus pairwise midpoints; each is scored by
  // building mass and distinct object families inside an approximate frame.
  const downtownFocus = bestGeneratedFocus(downtownZones, focus, scenery, commerceFrameCompositionScore);
  const fabricFocus = bestGeneratedFocus(built, focus, scenery, commerceFrameCompositionScore);
  const commercialFocus = downtownFocus.score >= 0.6 || downtownFocus.score >= fabricFocus.score ? downtownFocus.focus : fabricFocus.focus;

  return [
    // Legacy parametric demos still need the southward bias. Generated
    // districts use scored centers, so adding the bias can move sparse
    // archetypes off their strongest overview fabric.
    { id: "desktop", center: countyParameters ? center : { ...center, y: center.y + 1.5 }, zoom: 1.32, minZoom: 0.6, maxZoom: 1.9 },
    { id: "mobile", center: { x: mobileFocus.x, y: mobileFocus.y, z: 0 }, zoom: 0.92, minZoom: 0.5, maxZoom: 1.5 },
    { id: "residential_detail", center: { x: residentialFocus.x, y: residentialFocus.y, z: 0 }, zoom: 1.62, minZoom: 0.7, maxZoom: 1.9 },
    { id: "commerce_detail", center: { x: commercialFocus.x, y: commercialFocus.y, z: 0 }, zoom: 1.58, minZoom: 0.7, maxZoom: 1.95 },
  ];
}

function averagePoint(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function placeKindForZone(kind: CityWorldZoneKind): CityWorldPlace["kind"] {
  if (kind === "residential") return "home_area";
  if (kind === "park") return "park";
  if (kind === "civic") return "landmark";
  if (kind === "gym") return "shop";
  if (kind === "apartments") return "home_area";
  return "shop";
}

function isWaterGeneratedArchetype(archetype: GeneratedDistrictArchetype | undefined): boolean {
  return archetype === "coastal_grid" || archetype === "river_town";
}

function zoneLabel(kind: CityWorldZoneKind): string {
  const labels: Record<CityWorldZoneKind, string> = {
    residential: "Neighborhood",
    commercial: "Commercial row",
    civic: "Civic core",
    apartments: "Apartment court",
    gym: "Service block",
    park: "Community park",
    water: "Waterfront",
    plaza: "Plaza",
    farm_field: "Crop rows",
    plaza_paving: "Plaza paving",
    civic_forecourt: "Civic forecourt",
    dry_wash: "Dry wash",
    meadow: "Meadow",
    scree: "Scree",
    shore_bank: "Bank edge",
    green_common: "Green commons",
  };
  return labels[kind];
}

function zoneCenter(zone: CityWorldZoneSpec): { x: number; y: number } {
  return { x: (zone.rect.minX + zone.rect.maxX) / 2, y: (zone.rect.minY + zone.rect.maxY) / 2 };
}

function zoneAt(zones: CityWorldZoneSpec[], x: number, y: number): CityWorldZoneSpec | undefined {
  // last matching zone wins (later zones override earlier ones)
  let match: CityWorldZoneSpec | undefined;
  for (const zone of zones) {
    if (x >= zone.rect.minX && x <= zone.rect.maxX && y >= zone.rect.minY && y <= zone.rect.maxY) match = zone;
  }
  return match;
}

function isOnZoneEdge(zone: CityWorldZoneSpec, point: CityWorldPoint): boolean {
  const { rect } = zone;
  return point.x === rect.minX || point.x === rect.maxX || point.y === rect.minY || point.y === rect.maxY;
}

function isNearBounds(point: CityWorldPoint, bounds: CityWorldBounds, distance: number): boolean {
  return (
    point.x <= bounds.minX + distance ||
    point.x >= bounds.maxX - distance ||
    point.y <= bounds.minY + distance ||
    point.y >= bounds.maxY - distance
  );
}

// ---- Terrain relief (0.74F) -------------------------------------------------
// Continuous heightGrid relief quantized to BLOCK granularity: the road grid
// partitions the board into blocks; every tile in a block (and its lots,
// buildings, props, and place anchors) shares one z level, so streets and
// parcels stay flat while the district steps up plateaus. Water and its
// one-tile shore ring force z = 0; road corridors take the LOWER of the
// blocks they border so asphalt never climbs a cliff.
const ELEVATION_Z_LEVELS = [0, 0.5, 1] as const;

type ParametricElevationModel = {
  tileZ: (x: number, y: number) => number;
};

function reliefAtBilinear(spec: CityWorldParametricSpec, x: number, y: number): number {
  const grid = spec.heightGrid;
  if (!grid || grid.values.length === 0) return 0;
  const rows = grid.values.length;
  const cols = Math.max(...grid.values.map((row) => row.length), 1);
  const sample = (gx: number, gy: number) => clamp01(grid.values[Math.min(rows - 1, Math.max(0, gy))]?.[Math.min(cols - 1, Math.max(0, gx))] ?? 0);
  // Grid values sample cell centers.
  const fx = x / grid.cellSize - 0.5;
  const fy = y / grid.cellSize - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = clamp01(fx - x0);
  const ty = clamp01(fy - y0);
  const top = sample(x0, y0) * (1 - tx) + sample(x0 + 1, y0) * tx;
  const bottom = sample(x0, y0 + 1) * (1 - tx) + sample(x0 + 1, y0 + 1) * tx;
  return top * (1 - ty) + bottom * ty;
}

function quantizeElevation(value: number): number {
  if (value < 0.45) return ELEVATION_Z_LEVELS[0];
  if (value < 0.7) return ELEVATION_Z_LEVELS[1];
  return ELEVATION_Z_LEVELS[2];
}

function createParametricElevationModel(
  spec: CityWorldParametricSpec,
  bounds: CityWorldBounds,
  roads: CityWorldRoadSegment[],
): ParametricElevationModel {
  const noRelief = !spec.heightGrid || spec.heightGrid.values.length === 0;
  if (noRelief) return { tileZ: () => 0 };

  const waterZones = spec.zones.filter((zone) => zone.kind === "water");
  const nearWater = (x: number, y: number) =>
    waterZones.some(
      (zone) => x >= zone.rect.minX - 1 && x <= zone.rect.maxX + 1 && y >= zone.rect.minY - 1 && y <= zone.rect.maxY + 1,
    );

  // Corridor roads: axis-aligned embedded streets/avenues (driveways and
  // crosswalks ride whatever ground they sit on).
  const corridorRoads = roads.filter((road) => road.kind === "avenue" || road.kind === "street");
  const verticalLines = corridorRoads.filter((road) => road.from.x === road.to.x);
  const horizontalLines = corridorRoads.filter((road) => road.from.y === road.to.y);

  const blockZ = (x: number, y: number): number => {
    const xLines = verticalLines.map((road) => road.from.x).sort((a, b) => a - b);
    const yLines = horizontalLines.map((road) => road.from.y).sort((a, b) => a - b);
    const minX = Math.max(bounds.minX, ...xLines.filter((line) => line <= x));
    const maxX = Math.min(bounds.maxX, ...xLines.filter((line) => line > x));
    const minY = Math.max(bounds.minY, ...yLines.filter((line) => line <= y));
    const maxY = Math.min(bounds.maxY, ...yLines.filter((line) => line > y));
    return quantizeElevation(reliefAtBilinear(spec, (minX + maxX) / 2, (minY + maxY) / 2));
  };

  const cache = new Map<string, number>();
  const tileZ = (x: number, y: number): number => {
    const key = `${x}:${y}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    let z: number;
    if (nearWater(x, y)) {
      z = 0;
    } else {
      z = blockZ(x, y);
      // Road corridor: take the lower of the two bordering blocks.
      for (const road of verticalLines) {
        const half = road.width / 2 + 0.55;
        if (Math.abs(x - road.from.x) <= half && y >= Math.min(road.from.y, road.to.y) - half && y <= Math.max(road.from.y, road.to.y) + half) {
          z = Math.min(z, blockZ(road.from.x - half - 0.5, y), blockZ(road.from.x + half + 0.5, y));
        }
      }
      for (const road of horizontalLines) {
        const half = road.width / 2 + 0.55;
        if (Math.abs(y - road.from.y) <= half && x >= Math.min(road.from.x, road.to.x) - half && x <= Math.max(road.from.x, road.to.x) + half) {
          z = Math.min(z, blockZ(x, road.from.y - half - 0.5), blockZ(x, road.from.y + half + 0.5));
        }
      }
    }
    cache.set(key, z);
    return z;
  };

  return { tileZ };
}

function tileElevationGrammar(model: ParametricElevationModel, x: number, y: number): CityWorldTileElevationGrammar | undefined {
  const z = model.tileZ(x, y);
  const neighbors: Array<{ side: CityWorldTileEdge; z: number }> = [
    { side: "north", z: model.tileZ(x, y - 1) },
    { side: "east", z: model.tileZ(x + 1, y) },
    { side: "south", z: model.tileZ(x, y + 1) },
    { side: "west", z: model.tileZ(x - 1, y) },
  ];
  const dropSides = neighbors.filter((neighbor) => neighbor.z < z).map((neighbor) => neighbor.side);
  if (z === 0 && dropSides.length === 0) return undefined;
  const dropDepth = dropSides.length > 0 ? z - Math.min(...neighbors.filter((n) => n.z < z).map((n) => n.z)) : 0;
  return { z, dropSides, dropDepth };
}

function reliefAt(spec: CityWorldParametricSpec, x: number, y: number): number {
  const grid = spec.heightGrid;
  if (!grid || grid.values.length === 0) return 0;
  const gy = Math.min(grid.values.length - 1, Math.floor(y / grid.cellSize));
  const row = grid.values[gy] ?? [];
  const gx = Math.min(row.length - 1, Math.floor(x / grid.cellSize));
  return clamp01(row[gx] ?? 0);
}

function defaultRoadWidth(kind: CityWorldRoadSegment["kind"]): number {
  if (kind === "avenue") return 2.05;
  if (kind === "street") return 1.5;
  if (kind === "driveway") return 0.75;
  return 0.45;
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length) % items.length] as T;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Deterministic PRNG so generated scenes are reproducible for the diagnostics gate.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 0.58E Generated District Parity — numeric structural diagnostics at the
 * generator seam.
 *
 * These are the measurable versions of the 0.57E screenshot findings, so
 * generated-district quality can FAIL a gate instead of failing only an
 * eyeball review:
 *
 * - pad honesty: buildable lot pads must carry a building whose footprint
 *   actually fills the pad (empty rings / toy-on-apron read as fake);
 * - roof/eave registration: building footprints must register inside their
 *   lot pad bounds (the shared bound the renderer draws roof planes from);
 * - facade element bounds: apartment window columns must clear the eave line
 *   above the wall base — computed scale-free from the shared iso basis
 *   ({@link CITY_WORLD_TILE_BASIS}) and the renderer's proportional column
 *   layout (columns at -0.34/-0.21/-0.08 of footprint width, eave drop
 *   `wallHalfDepth * (1 - |dx|/wallHalfWidth)`);
 * - commerce strip grammar: generated shops must route through the
 *   commerce_strip family as wide elastic strips, not toy slabs;
 * - frame density: the desktop/mobile first viewport must be built in the
 *   LOWER band too, not only around the camera focus.
 *
 * The report carries numbers only; pass/fail thresholds live in
 * `scripts/verify-generated-district-parity.mjs` so gates stay reviewable.
 */

export type CityWorldGeneratedPadMetric = {
  lotId: string;
  lotKind: CityWorldLot["kind"];
  buildingId: string | null;
  footprintFillRatio: number;
  overhangTiles: number;
};

export type CityWorldGeneratedFrameBandDensity = {
  cameraPresetId: string;
  buildingsInFrame: number;
  buildingsInLowerBand: number;
  lowerFrameOccupancyRatio: number;
  upperFrameOccupancyRatio: number;
  /** lower occupancy / upper occupancy, clamped to [0, 3]. */
  lowerFrameBalance: number;
};

export type CityWorldGeneratedDistrictParityReport = {
  type: "cityWorldGeneratedDistrictParityReport";
  update: "0.58e-generated-district-parity-numeric-proof";
  sceneId: string;
  counts: {
    buildableLots: number;
    softLots: number;
    buildings: number;
    emptyPadCount: number;
    shopCount: number;
    apartmentCount: number;
  };
  padMetrics: {
    lotBuildingFillRatio: number;
    padFootprintFillFloor: number;
    padFootprintFillMean: number;
    emptyPadLotIds: string[];
  };
  registrationMetrics: {
    buildingWithinLotRatio: number;
    roofOverhangCount: number;
    maxOverhangTiles: number;
    overhangBuildingIds: string[];
  };
  facadeMetrics: {
    apartmentColumnClearanceFloor: number;
    apartmentColumnUnsafeCount: number;
    minApartmentWidth: number;
    unsafeApartmentIds: string[];
  };
  commerceMetrics: {
    /** strips / strip-row shops; corner storefronts are excluded from the denominator. */
    stripStoreRatio: number;
    commerceStripMinWidth: number;
    commerceStripMeanWidth: number;
    toyCommerceCount: number;
    commerceBayFloor: number;
    toyCommerceIds: string[];
    cornerMarketCount: number;
    cornerMarketMinWidth: number;
    heroStripCount: number;
    stripZoneCount: number;
    heroCrownDuplicateZones: number;
    heroCrownMissingZones: number;
  };
  residentialRoofMetrics: {
    homeCount: number;
    pitchedHomeCount: number;
    flatRowhomeCount: number;
    unsafeRoofCount: number;
    maxHeightToFootprintRatio: number;
    unsafeRoofIds: string[];
  };
  frameDensity: Record<string, CityWorldGeneratedFrameBandDensity>;
  pads: CityWorldGeneratedPadMetric[];
};

/** Strip-row shops narrower than this read as toy boxes next to curated Plaza Row. */
const TOY_COMMERCE_WIDTH_TILES = 2.2;
/** Corner storefronts are small on purpose (curated market is 2.0w) — but never below this. */
const CORNER_STORE_MIN_WIDTH_TILES = 1.7;

/**
 * Renderer window-column proportions from `drawApartmentDetails`: three
 * columns at horizontal offsets -0.34/-0.21/-0.08 of footprint width. The
 * innermost column (|dx| = 0.08w) suffers the deepest eave drop.
 */
const APARTMENT_INNER_COLUMN_OFFSET_RATIO = 0.08;

export function analyzeGeneratedDistrictParity(scene: CityWorldScene): CityWorldGeneratedDistrictParityReport {
  const softLotKinds = new Set<CityWorldLot["kind"]>(["park", "waterfront"]);
  const buildableLots = scene.lots.filter((lot) => !softLotKinds.has(lot.kind));
  const softLots = scene.lots.length - buildableLots.length;
  const primaryBuildings = scene.buildings.filter((building) => !isGeneratedAttachmentBuilding(building));

  const pads: CityWorldGeneratedPadMetric[] = buildableLots.map((lot) => {
    const residents = primaryBuildings.filter((building) =>
      cityWorldPointInsideFootprint(building.position, lot.position, lot.width, lot.depth),
    );
    const primary = residents.reduce<CityWorldBuilding | null>(
      (largest, building) =>
        !largest || building.width * building.depth > largest.width * largest.depth ? building : largest,
      null,
    );
    if (!primary) {
      return { lotId: lot.id, lotKind: lot.kind, buildingId: null, footprintFillRatio: 0, overhangTiles: 0 };
    }
    const lotArea = Math.max(0.0001, lot.width * lot.depth);
    const overhangX = Math.abs(primary.position.x - lot.position.x) + primary.width / 2 - lot.width / 2;
    const overhangY = Math.abs(primary.position.y - lot.position.y) + primary.depth / 2 - lot.depth / 2;
    return {
      lotId: lot.id,
      lotKind: lot.kind,
      buildingId: primary.id,
      footprintFillRatio: roundParityMetric((primary.width * primary.depth) / lotArea),
      overhangTiles: roundParityMetric(Math.max(0, overhangX, overhangY)),
    };
  });

  const filledPads = pads.filter((pad) => pad.buildingId !== null);
  const emptyPads = pads.filter((pad) => pad.buildingId === null);
  const overhangTolerance = 0.02;
  const overhangPads = filledPads.filter((pad) => pad.overhangTiles > overhangTolerance);

  const shops = primaryBuildings.filter((building) => building.kind === "shop");
  // Strip rows and corner storefronts have separate size floors.
  const cornerShops = shops.filter((building) => building.facadeStyle === "storefront");
  const rowShops = shops.filter((building) => building.facadeStyle !== "storefront");
  const stripShops = rowShops.filter(
    (building) => building.facadeStyle === "strip_store" && building.objectKit?.prefabFamily === "commerce_strip",
  );
  const toyShops = shops.filter((building) =>
    building.facadeStyle === "storefront"
      ? building.width < CORNER_STORE_MIN_WIDTH_TILES
      : building.width < TOY_COMMERCE_WIDTH_TILES,
  );
  const shopBayCounts = stripShops.map((building) => building.objectKit?.commerceGeometry?.bayCount ?? 0);
  // Hero sprite strips are retired: every generated strip renders through the
  // vector facade system, so the crown-duplicate/missing checks are always 0.
  const heroCrownDuplicateZones = 0;
  const heroCrownMissingZones = 0;

  const apartments = primaryBuildings.filter((building) => building.kind === "apartment");
  const apartmentClearances = apartments.map((building) => ({
    id: building.id,
    clearance: apartmentColumnClearance(building),
  }));
  const unsafeApartments = apartmentClearances.filter((entry) => entry.clearance < 1);
  const homes = primaryBuildings.filter((building) => building.kind === "home");
  const homeRoofSafety = homes.map((building) => generatedHomeRoofSafety(building));
  const unsafeHomeRoofs = homeRoofSafety.filter((entry) => !entry.safe);

  const frameDensity: Record<string, CityWorldGeneratedFrameBandDensity> = {};
  for (const preset of scene.cameraPresets) {
    if (preset.id !== "desktop" && preset.id !== "mobile") continue;
    frameDensity[preset.id] = frameBandDensity(scene, preset);
  }

  return {
    type: "cityWorldGeneratedDistrictParityReport",
    update: "0.58e-generated-district-parity-numeric-proof",
    sceneId: scene.id,
    counts: {
      buildableLots: buildableLots.length,
      softLots,
      buildings: scene.buildings.length,
      emptyPadCount: emptyPads.length,
      shopCount: shops.length,
      apartmentCount: apartments.length,
    },
    padMetrics: {
      lotBuildingFillRatio: roundParityMetric(safeRatio(filledPads.length, buildableLots.length)),
      padFootprintFillFloor: roundParityMetric(
        filledPads.length > 0 ? Math.min(...filledPads.map((pad) => pad.footprintFillRatio)) : 0,
      ),
      padFootprintFillMean: roundParityMetric(
        safeRatio(filledPads.reduce((sum, pad) => sum + pad.footprintFillRatio, 0), filledPads.length),
      ),
      emptyPadLotIds: emptyPads.map((pad) => pad.lotId),
    },
    registrationMetrics: {
      buildingWithinLotRatio: roundParityMetric(
        safeRatio(filledPads.length - overhangPads.length, Math.max(1, filledPads.length)),
      ),
      roofOverhangCount: overhangPads.length,
      maxOverhangTiles: roundParityMetric(Math.max(0, ...filledPads.map((pad) => pad.overhangTiles))),
      overhangBuildingIds: overhangPads.map((pad) => pad.buildingId ?? pad.lotId),
    },
    facadeMetrics: {
      apartmentColumnClearanceFloor: roundParityMetric(
        apartmentClearances.length > 0 ? Math.min(...apartmentClearances.map((entry) => entry.clearance)) : 1,
      ),
      apartmentColumnUnsafeCount: unsafeApartments.length,
      minApartmentWidth: roundParityMetric(
        apartments.length > 0 ? Math.min(...apartments.map((building) => building.width)) : 0,
      ),
      unsafeApartmentIds: unsafeApartments.map((entry) => entry.id),
    },
    commerceMetrics: {
      // Ratio over strip ROWS only; corner storefronts are their own role.
      stripStoreRatio: roundParityMetric(safeRatio(stripShops.length, rowShops.length)),
      commerceStripMinWidth: roundParityMetric(
        rowShops.length > 0 ? Math.min(...rowShops.map((building) => building.width)) : 0,
      ),
      commerceStripMeanWidth: roundParityMetric(
        safeRatio(rowShops.reduce((sum, building) => sum + building.width, 0), rowShops.length),
      ),
      toyCommerceCount: toyShops.length,
      commerceBayFloor: shopBayCounts.length > 0 ? Math.min(...shopBayCounts) : 0,
      toyCommerceIds: toyShops.map((building) => building.id),
      cornerMarketCount: cornerShops.length,
      cornerMarketMinWidth: roundParityMetric(
        cornerShops.length > 0 ? Math.min(...cornerShops.map((building) => building.width)) : 0,
      ),
      heroStripCount: 0,
      stripZoneCount: [...new Set(stripShops.map((building) => building.placeId ?? ""))].length,
      heroCrownDuplicateZones,
      heroCrownMissingZones,
    },
    residentialRoofMetrics: {
      homeCount: homes.length,
      pitchedHomeCount: homes.filter((building) => building.roofShape === "gable" || building.roofShape === "hip").length,
      flatRowhomeCount: homes.filter((building) => building.facadeStyle === "rowhome" && building.roofShape === "flat").length,
      unsafeRoofCount: unsafeHomeRoofs.length,
      maxHeightToFootprintRatio: roundParityMetric(Math.max(0, ...homeRoofSafety.map((entry) => entry.heightToFootprintRatio))),
      unsafeRoofIds: unsafeHomeRoofs.map((entry) => entry.id),
    },
    frameDensity,
    pads,
  };
}

function generatedHomeRoofSafety(building: CityWorldBuilding): {
  id: string;
  safe: boolean;
  heightToFootprintRatio: number;
} {
  const roofShape = building.roofShape ?? "flat";
  const style = building.facadeStyle ?? "cottage";
  const heightToFootprintRatio = roundParityMetric(building.height / Math.max(0.1, Math.min(building.width, building.depth)));
  let safe = true;

  if (style === "rowhome") safe = roofShape === "flat" && building.height <= 1.52;
  else if (style === "cottage") safe = roofShape === "gable" && building.height <= 1.28 && heightToFootprintRatio <= 1.14;
  else if (style === "ranch") safe = (roofShape === "gable" || roofShape === "hip") && building.width >= 1.8 && building.height <= 1.22 && heightToFootprintRatio <= 0.96;
  else safe = roofShape !== "tower";

  return { id: building.id, safe, heightToFootprintRatio };
}

/**
 * Scale-free window-column clearance: the wall (projected height
 * `height * tileDepth`) must be tall enough that the innermost column's eave
 * drop (`~0.92 * halfFootprintDepth`, where the projected footprint depth of a
 * w×d box is `(w + d) * tileHeight / 2`) still leaves room for a two-row
 * window block. Values >= 1 are safe; below 1 the columns start at or below
 * the wall base — the pre-0.57E floating-window failure.
 */
function apartmentColumnClearance(building: CityWorldBuilding): number {
  const projectedFootprintDepth = ((building.width + building.depth) * CITY_WORLD_TILE_BASIS.tileHeight) / 2;
  const innerEaveDropRatio = 1 - APARTMENT_INNER_COLUMN_OFFSET_RATIO * 2;
  const eaveDrop = (projectedFootprintDepth / 2) * innerEaveDropRatio;
  const wallHeight = building.height * CITY_WORLD_TILE_BASIS.tileDepth;
  // Reserve ~35% of the wall below the eave drop for the window block itself.
  const required = eaveDrop * 1.35;
  return roundParityMetric(required > 0 ? wallHeight / required : 1);
}

function frameBandDensity(
  scene: CityWorldScene,
  preset: CityWorldScene["cameraPresets"][number],
): CityWorldGeneratedFrameBandDensity {
  const rawFrame = cityWorldViewportFrameForCameraPreset(preset);
  // Clip to the world: a tall mobile frame hangs past the board edge, and
  // off-world area must not dilute the occupancy denominator.
  const frame = {
    minX: Math.max(rawFrame.minX, scene.bounds.minX),
    maxX: Math.min(rawFrame.maxX, scene.bounds.maxX),
    minY: Math.max(rawFrame.minY, scene.bounds.minY),
    maxY: Math.min(rawFrame.maxY, scene.bounds.maxY),
  };
  // "Lower frame" is the SCREEN-lower half: projected screen-y grows with
  // board (x + y), so the split runs across the frame's x+y midline. The two
  // bands halve the board-rect area by symmetry.
  const midScreenY = (frame.minX + frame.maxX + frame.minY + frame.maxY) / 2;
  const bandArea = Math.max(0.0001, (frame.maxX - frame.minX) * (frame.maxY - frame.minY) * 0.5);
  const inFrame = scene.buildings.filter(
    (building) =>
      building.position.x >= frame.minX &&
      building.position.x <= frame.maxX &&
      building.position.y >= frame.minY &&
      building.position.y <= frame.maxY,
  );
  const lower = inFrame.filter((building) => building.position.x + building.position.y >= midScreenY);
  const upper = inFrame.filter((building) => building.position.x + building.position.y < midScreenY);
  const areaOf = (buildings: CityWorldBuilding[]) => buildings.reduce((sum, b) => sum + b.width * b.depth, 0);
  const lowerOccupancy = clamp01(areaOf(lower) / bandArea);
  const upperOccupancy = clamp01(areaOf(upper) / bandArea);
  return {
    cameraPresetId: preset.id,
    buildingsInFrame: inFrame.length,
    buildingsInLowerBand: lower.length,
    lowerFrameOccupancyRatio: roundParityMetric(lowerOccupancy),
    upperFrameOccupancyRatio: roundParityMetric(upperOccupancy),
    lowerFrameBalance: roundParityMetric(Math.min(3, lowerOccupancy / Math.max(0.001, upperOccupancy))),
  };
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function normalizedDelta(first: number, second: number, scale: number, weight: number): number {
  return Math.min(1, Math.abs(first - second) / Math.max(0.0001, scale)) * weight;
}

function roundParityMetric(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0;
}

/**
 * A small, credible reference spec (a compact synthetic district) used to prove
 * the generator end to end. Represents a generic inland Southern-California
 * district: a residential west, a civic core, a commercial spine, an apartment
 * cluster, a park, and a waterfront edge.
 */
export function exampleParametricDistrictSpec(): CityWorldParametricSpec {
  return {
    id: "city-world-parametric-sample-district",
    label: "Parametric Sample District",
    region: { country: "United States", state: "CA", county: "Sample County", district: "Sample District" },
    size: { width: 40, height: 28 },
    heightGrid: {
      cellSize: 8,
      values: [
        [0.2, 0.3, 0.4, 0.5, 0.6],
        [0.3, 0.4, 0.5, 0.6, 0.7],
        [0.4, 0.5, 0.5, 0.6, 0.8],
        [0.3, 0.4, 0.5, 0.7, 0.9],
      ],
    },
    // Zone blocks pack BETWEEN the road grid lines (x=16, x=28, y=13) with a
    // full tile of clearance, so no road ever slices a buildable zone and no
    // building can straddle a corridor. Roads bound blocks; they do not cross them.
    zones: [
      { id: "west-neighborhood", kind: "residential", rect: { minX: 2, minY: 3, maxX: 14, maxY: 11 }, density: 0.8 },
      { id: "south-court", kind: "residential", rect: { minX: 2, minY: 15, maxX: 9, maxY: 26 }, density: 0.82 },
      { id: "community-park", kind: "park", rect: { minX: 10, minY: 15, maxX: 14, maxY: 26 } },
      { id: "civic-core", kind: "civic", rect: { minX: 18, minY: 5, maxX: 26, maxY: 11 } },
      { id: "service-block", kind: "gym", rect: { minX: 18, minY: 15, maxX: 26, maxY: 20 } },
      { id: "south-commons", kind: "commercial", rect: { minX: 18, minY: 21, maxX: 26, maxY: 26 }, density: 0.85 },
      { id: "commercial-spine", kind: "commercial", rect: { minX: 30, minY: 3, maxX: 38, maxY: 11 }, density: 0.82 },
      { id: "apartment-cluster", kind: "apartments", rect: { minX: 30, minY: 15, maxX: 34, maxY: 25 }, density: 0.8 },
      { id: "east-neighborhood", kind: "residential", rect: { minX: 36, minY: 14, maxX: 39, maxY: 19 }, density: 0.78 },
      { id: "waterfront", kind: "water", rect: { minX: 35, minY: 20, maxX: 39, maxY: 27 } },
    ],
    roadSeeds: [
      { id: "gen-road-main", kind: "avenue", from: { x: 2, y: 13 }, to: { x: 38, y: 13 } },
      { id: "gen-road-cross", kind: "avenue", from: { x: 16, y: 3 }, to: { x: 16, y: 26 } },
      { id: "gen-road-commerce", kind: "street", from: { x: 28, y: 3 }, to: { x: 28, y: 26 } },
      { id: "gen-road-park-loop", kind: "driveway", from: { x: 10, y: 26 }, to: { x: 14, y: 26 } },
    ],
    seed: 7,
  };
}
