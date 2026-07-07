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
  CityWorldVisualGrammar,
} from "./cityWorldTypes.js";
import {
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
  | "plaza";

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
};

export function generateParametricCityWorldScene(spec: CityWorldParametricSpec): CityWorldParametricResult {
  const bounds: CityWorldBounds = { minX: 0, minY: 0, maxX: spec.size.width, maxY: spec.size.height };
  const rng = mulberry32(spec.seed ?? 1);

  const terrainTiles = createParametricTerrain(spec, bounds);
  const roadSegments = spec.roadSeeds.map((seed) =>
    withRoadMetadata({
      id: seed.id,
      kind: seed.kind,
      from: { x: seed.from.x, y: seed.from.y, z: 0 },
      to: { x: seed.to.x, y: seed.to.y, z: 0 },
      width: seed.width ?? defaultRoadWidth(seed.kind),
    }),
  );

  const lots: CityWorldLot[] = [];
  const buildings: CityWorldBuilding[] = [];
  const places: CityWorldPlace[] = [];
  const props: CityWorldProp[] = [];

  // Corner stores face the district's central mass.
  const boardCenter = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };

  let placeIndex = 0;
  for (const zone of spec.zones) {
    const lotKind = ZONE_TO_LOT[zone.kind];
    if (!lotKind) continue;
    const placeId = `gen-place-${zone.id}`;
    // Safety net for arbitrary specs: a parcel that would put its building in
    // a road corridor is dropped. Soft zones (park/water) may host embedded
    // roads — the renderer draws roads over lot ground.
    const softZone = zone.kind === "park" || zone.kind === "water";
    const parcels = layoutZoneParcels(zone, rng, boardCenter).filter(
      (parcel) => softZone || parcelClearsRoads(parcel, roadSegments),
    );
    if (parcels.length === 0) continue;

    for (const parcel of parcels) {
      lots.push(
        withLotMetadata(
          {
            id: `gen-lot-${zone.id}-${parcel.index}`,
            kind: parcel.lotKind ?? lotKind,
            label: parcel.spec?.labelOverride ?? zone.label ?? zoneLabel(zone.kind),
            position: { x: parcel.x, y: parcel.y, z: 0 },
            width: parcel.width,
            depth: parcel.depth,
            placeId,
          },
          roadSegments,
        ),
      );

      const building = buildingForZone(zone, parcel, placeId, rng);
      if (building) buildings.push(withBuildingMetadata(building));
    }

    places.push({
      id: placeId,
      label: zone.label ?? zoneLabel(zone.kind),
      kind: placeKindForZone(zone.kind),
      districtId: spec.region.district,
      nodeId: zone.id,
      anchor: { x: zoneCenter(zone).x, y: zoneCenter(zone).y, z: 0 },
      hitRadius: zone.kind === "park" ? 3.8 : 2.8,
      description: `Generated ${zoneLabel(zone.kind)} zone.`,
      activity: 0,
      labelPriority: placeIndex < 6 ? 10 - placeIndex : 3,
    });
    placeIndex += 1;

    if (zone.kind === "park" || zone.kind === "water") {
      props.push(...zoneNatureProps(zone, rng));
    }
  }

  const scene: CityWorldScene = {
    type: "cityWorldScene",
    id: spec.id,
    sourceSceneId: `parametric-${spec.id}`,
    label: spec.label,
    region: spec.region,
    bounds,
    cameraPresets: parametricCameraPresets(bounds, spec.zones, { terrainTiles, roadSegments, lots, buildings }),
    terrainTiles,
    roadSegments,
    lots,
    buildings,
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
      selectedPlaceId: (places.find((place) => place.kind === "landmark") ?? places[0])?.id ?? "",
    },
  };

  return {
    scene,
    stats: {
      terrainTiles: terrainTiles.length,
      roads: roadSegments.length,
      lots: lots.length,
      buildings: buildings.length,
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

function createParametricTerrain(spec: CityWorldParametricSpec, bounds: CityWorldBounds): CityWorldTerrainTile[] {
  const tiles: CityWorldTerrainTile[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const point: CityWorldPoint = { x, y, z: 0 };
      const zone = zoneAt(spec.zones, x, y);
      const kind: CityWorldTerrainKind = zone ? ZONE_TO_TERRAIN[zone.kind] : "grass";
      const variant = (x * 17 + y * 11) % 5;
      const relief = reliefAt(spec, x, y);
      tiles.push({
        id: `gen-terrain-${x}-${y}`,
        kind,
        position: point,
        width: 1,
        depth: 1,
        variant,
        spriteKey: `tile.${kind}.${variant}`,
        paletteKey: `terrain.${kind}`,
        detailLevel: kind === "water" || kind === "park" || kind === "plaza" ? "medium" : "low",
        visualGrammar: parametricTerrainGrammar(spec, zone, point, bounds, relief),
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

function layoutZoneParcels(zone: CityWorldZoneSpec, rng: () => number, boardCenter?: { x: number; y: number }): ParcelLayout[] {
  const { rect } = zone;
  const zoneWidth = rect.maxX - rect.minX;
  const zoneHeight = rect.maxY - rect.minY;
  if (zoneWidth <= 0 || zoneHeight <= 0) return [];

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
    const cols = Math.max(1, Math.ceil(zoneWidth / 5.4));
    const rows = Math.max(1, Math.floor(zoneHeight / 3.6));
    const stripCellWidth = zoneWidth / cols;
    const stripCellHeight = zoneHeight / rows;
    const stripDensity = zone.density ?? 0.85;
    const strips: ParcelLayout[] = [];
    let stripIndex = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (rng() > stripDensity) continue;
        const template = buildingSpecForZone(zone.kind, rng);
        if (!template) continue;
        const spec: ZoneBuildingSpec = {
          ...template,
          // Stretch to the row segment, capped near the hero strip's 6.1 tiles.
          width: Math.min(Math.max(template.width, stripCellWidth * 0.84), 6.2),
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
      const template = buildingSpecForZone(zone.kind, rng);
      const spec: ZoneBuildingSpec | undefined = template
        ? { ...template, width: Math.min(Math.max(template.width, zoneWidth * 0.6), 6.2) }
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
  const density = zone.density ?? (zone.kind === "residential" ? 0.78 : zone.kind === "apartments" ? 0.74 : 0.62);
  const cell = zone.kind === "residential" ? 2.4 : zone.kind === "apartments" ? 2.9 : 3.4;
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
      const cx = rect.minX + (col + 0.5) * cellWidth;
      const cy = rect.minY + (row + 0.5) * cellHeight;
      const jitter = (rng() - 0.5) * 0.3;
      // Rotate apartment massing so court parcels step instead of cloning one slab.
      const spec = zone.kind === "apartments" ? apartmentSpecForOrdinal(index, rng) : buildingSpecForZone(zone.kind, rng);
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
    const spec = zone.kind === "apartments" ? apartmentSpecForOrdinal(0, rng) : buildingSpecForZone(zone.kind, rng);
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
  if (zone.kind === "residential" && parcels.length >= CORNER_STORE_MIN_PARCELS && boardCenter) {
    const cornerTargetX = boardCenter.x >= (rect.minX + rect.maxX) / 2 ? rect.maxX : rect.minX;
    const cornerTargetY = boardCenter.y >= (rect.minY + rect.maxY) / 2 ? rect.maxY : rect.minY;
    const cornerParcel = parcels.reduce((closest, parcel) => {
      const parcelDistance = Math.hypot(parcel.x - cornerTargetX, parcel.y - cornerTargetY);
      const closestDistance = Math.hypot(closest.x - cornerTargetX, closest.y - cornerTargetY);
      return parcelDistance < closestDistance ? parcel : closest;
    }, parcels[0] as ParcelLayout);
    const cornerSpec = applyDimensionJitter(CORNER_STORE_TEMPLATE, rng);
    cornerSpec.labelOverride = "Corner market";
    cornerParcel.spec = cornerSpec;
    cornerParcel.lotKind = "shop";
    cornerParcel.width = Math.min(cornerSpec.width * 1.18, cellWidth * 1.15);
    cornerParcel.depth = Math.min(cornerSpec.depth * 1.3, cellHeight * 1.15);
  }

  return parcels;
}

function buildingForZone(zone: CityWorldZoneSpec, parcel: ParcelLayout, placeId: string, rng: () => number): CityWorldBuilding | null {
  const spec = parcel.spec ?? buildingSpecForZone(zone.kind, rng);
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
};

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
  { weight: 0.55, template: { kind: "home", width: 1.36, depth: 1.12, height: 1.12, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f2dfc4", "#ead4b6", "#f6e7cf"], roofColors: ["#b86f4c", "#8a6a52", "#b99358"] } },
  { weight: 0.35, template: { kind: "home", width: 1.48, depth: 1.16, height: 1.16, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f0dcc4", "#ecdcc0"], roofColors: ["#a9704f", "#7d9a86"] } },
  { weight: 0.7, template: { kind: "home", width: 2.05, depth: 1.26, height: 1.02, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0"], roofColors: ["#7f9b6e", "#5f7f8e", "#a76f4e"] } },
  { weight: 0.75, template: { kind: "home", width: 2.45, depth: 1.42, height: 1.08, facadeStyle: "ranch", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad"], roofColors: ["#a9704f", "#5f7f8e"] } },
  { weight: 1, template: { kind: "home", width: 3.18, depth: 1.18, height: 1.36, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#f2dfc2", "#eed9c0"], roofColors: ["#607d84", "#6f9ca7"] } },
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
function apartmentSpecForOrdinal(ordinal: number, rng: () => number): ZoneBuildingSpec {
  const template = APARTMENT_TEMPLATE_POOL[ordinal % APARTMENT_TEMPLATE_POOL.length] as ZoneBuildingTemplate;
  const spec = applyDimensionJitter(template, rng);
  spec.height = Math.max(spec.height, apartmentClearanceSafeMinHeight(spec.width, spec.depth));
  return spec;
}

const GYM_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "gym", width: 4.0, depth: 2.6, height: 2.0, facadeStyle: "fitness", roofShape: "sawtooth", bodyColors: ["#d7e7ef", "#d3e2ea"], roofColors: ["#a76f4e", "#5f8fa6"] },
];

function applyDimensionJitter(template: ZoneBuildingTemplate, rng: () => number): ZoneBuildingSpec {
  const home = template.kind === "home";
  const jitter = (value: number, spread = 0.3) => Math.round(value * (1 + (rng() - 0.5) * spread) * 100) / 100;
  return {
    kind: template.kind,
    width: jitter(template.width, home ? 0.14 : 0.3),
    depth: jitter(template.depth, home ? 0.12 : 0.3),
    height: jitter(template.height, home ? 0.08 : 0.3),
    bodyColor: pick(rng, template.bodyColors),
    roofColor: pick(rng, template.roofColors),
    facadeStyle: template.facadeStyle,
    roofShape: template.roofShape,
  };
}

function buildingSpecForZone(kind: CityWorldZoneKind, rng: () => number): ZoneBuildingSpec | null {
  if (kind === "residential") {
    const totalWeight = RESIDENTIAL_TEMPLATE_POOL.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng() * totalWeight;
    for (const entry of RESIDENTIAL_TEMPLATE_POOL) {
      roll -= entry.weight;
      if (roll <= 0) return applyDimensionJitter(entry.template, rng);
    }
    const last = RESIDENTIAL_TEMPLATE_POOL[RESIDENTIAL_TEMPLATE_POOL.length - 1];
    return last ? applyDimensionJitter(last.template, rng) : null;
  }
  if (kind === "commercial") {
    return applyDimensionJitter(pick(rng, COMMERCIAL_TEMPLATE_POOL), rng);
  }
  if (kind === "apartments") {
    return applyDimensionJitter(pick(rng, APARTMENT_TEMPLATE_POOL), rng);
  }
  if (kind === "gym") {
    return applyDimensionJitter(pick(rng, GYM_TEMPLATE_POOL), rng);
  }
  if (kind === "civic") {
    return { kind: "civic", width: 3.4, depth: 2.5, height: 2.8, bodyColor: "#f3dfbd", roofColor: "#5d8fa8", facadeStyle: "civic", roofShape: "tower" };
  }
  return null;
}

function parcelFootprint(kind: CityWorldZoneKind): { width: number; depth: number } {
  if (kind === "residential") return { width: 1.7, depth: 1.45 };
  if (kind === "commercial") return { width: 3.6, depth: 2.1 };
  if (kind === "apartments") return { width: 3.0, depth: 2.3 };
  if (kind === "gym") return { width: 4.6, depth: 3.2 };
  return { width: 3.4, depth: 2.6 };
}

function zoneNatureProps(zone: CityWorldZoneSpec, rng: () => number): CityWorldProp[] {
  const props: CityWorldProp[] = [];
  const center = zoneCenter(zone);
  const count = zone.kind === "water" ? 3 : 4;
  for (let index = 0; index < count; index += 1) {
    const px = zone.rect.minX + rng() * (zone.rect.maxX - zone.rect.minX);
    const py = zone.rect.minY + rng() * (zone.rect.maxY - zone.rect.minY);
    props.push(
      withPropMetadata({
        id: `gen-prop-${zone.id}-${index}`,
        kind: zone.kind === "water" ? "water_shimmer" : index % 3 === 0 ? "bush" : "tree",
        position: { x: px, y: py, z: 0 },
        variant: index % 5,
      }),
    );
  }
  // keep center referenced so tree clusters lean inward
  if (props[0]) props[0].position = { x: center.x, y: center.y, z: 0 };
  return props;
}

type ParametricCameraScenery = {
  terrainTiles: CityWorldTerrainTile[];
  roadSegments: CityWorldRoadSegment[];
  lots: CityWorldLot[];
  buildings: CityWorldBuilding[];
};

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

function parametricCameraPresets(bounds: CityWorldBounds, zones: CityWorldZoneSpec[], scenery: ParametricCameraScenery): CityWorldScene["cameraPresets"] {
  // Center the primary cameras on the built-up mass (centroid of buildable
  // zones) rather than the raw grid center, so the first viewport is dense.
  const built = zones.filter((zone) => ZONE_TO_LOT[zone.kind] && zone.kind !== "water");
  const focus = built.length > 0 ? averagePoint(built.map(zoneCenter)) : { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const center = { x: focus.x, y: focus.y, z: 0 };
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
  const candidates = downtownZones.map(zoneCenter);
  for (let a = 0; a < downtownZones.length; a += 1) {
    for (let b = a + 1; b < downtownZones.length; b += 1) {
      const zoneA = downtownZones[a];
      const zoneB = downtownZones[b];
      if (zoneA && zoneB) candidates.push(averagePoint([zoneCenter(zoneA), zoneCenter(zoneB)]));
    }
  }
  let commercialFocus = downtownZones.length > 0 ? candidates[0] ?? focus : focus;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = commerceFrameCompositionScore({ x: candidate.x, y: candidate.y, z: 0 }, scenery);
    if (score > bestScore) {
      bestScore = score;
      commercialFocus = candidate;
    }
  }

  return [
    // Bias the first frame south of the built centroid: the lower band of the
    // opening viewport must hold built mass, not open field.
    { id: "desktop", center: { ...center, y: center.y + 1.5 }, zoom: 1.32, minZoom: 0.6, maxZoom: 1.9 },
    { id: "mobile", center: { ...center, y: center.y + 4 }, zoom: 0.92, minZoom: 0.5, maxZoom: 1.5 },
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

  const pads: CityWorldGeneratedPadMetric[] = buildableLots.map((lot) => {
    const residents = scene.buildings.filter((building) =>
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

  const shops = scene.buildings.filter((building) => building.kind === "shop");
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

  const apartments = scene.buildings.filter((building) => building.kind === "apartment");
  const apartmentClearances = apartments.map((building) => ({
    id: building.id,
    clearance: apartmentColumnClearance(building),
  }));
  const unsafeApartments = apartmentClearances.filter((entry) => entry.clearance < 1);
  const homes = scene.buildings.filter((building) => building.kind === "home");
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
