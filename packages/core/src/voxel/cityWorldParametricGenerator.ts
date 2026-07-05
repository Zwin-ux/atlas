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

  let placeIndex = 0;
  for (const zone of spec.zones) {
    const lotKind = ZONE_TO_LOT[zone.kind];
    if (!lotKind) continue;
    const placeId = `gen-place-${zone.id}`;
    const parcels = layoutZoneParcels(zone, rng);
    if (parcels.length === 0) continue;

    for (const parcel of parcels) {
      lots.push(
        withLotMetadata(
          {
            id: `gen-lot-${zone.id}-${parcel.index}`,
            kind: lotKind,
            label: zone.label ?? zoneLabel(zone.kind),
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
    cameraPresets: parametricCameraPresets(bounds, spec.zones),
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
      selectedPlaceId: places[0]?.id ?? "",
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

type ParcelLayout = {
  index: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  elevationBoost: number;
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

function layoutZoneParcels(zone: CityWorldZoneSpec, rng: () => number): ParcelLayout[] {
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
  if (zone.kind === "civic" || zone.kind === "gym") {
    return [
      {
        index: 0,
        x: rect.minX + zoneWidth / 2,
        y: rect.minY + zoneHeight / 2,
        width: Math.max(3.4, zoneWidth * 0.72),
        depth: Math.max(2.6, zoneHeight * 0.68),
        elevationBoost: zone.elevationBoost ?? 0,
      },
    ];
  }

  const density = zone.density ?? (zone.kind === "residential" ? 0.62 : 0.5);
  const cell = zone.kind === "residential" ? 2.4 : 3.4;
  const cols = Math.max(1, Math.floor(zoneWidth / cell));
  const rows = Math.max(1, Math.floor(zoneHeight / cell));
  const parcels: ParcelLayout[] = [];
  const footprint = parcelFootprint(zone.kind);
  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (rng() > density) continue;
      const cx = rect.minX + (col + 0.5) * (zoneWidth / cols);
      const cy = rect.minY + (row + 0.5) * (zoneHeight / rows);
      const jitter = (rng() - 0.5) * 0.3;
      parcels.push({
        index: index++,
        x: cx + jitter,
        y: cy + jitter,
        width: footprint.width,
        depth: footprint.depth,
        elevationBoost: zone.elevationBoost ?? 0,
      });
    }
  }

  // Never leave a zoned block empty — guarantee at least one anchor parcel.
  if (parcels.length === 0) {
    parcels.push({
      index: 0,
      x: rect.minX + zoneWidth / 2,
      y: rect.minY + zoneHeight / 2,
      width: footprint.width,
      depth: footprint.depth,
      elevationBoost: zone.elevationBoost ?? 0,
    });
  }

  return parcels;
}

function buildingForZone(zone: CityWorldZoneSpec, parcel: ParcelLayout, placeId: string, rng: () => number): CityWorldBuilding | null {
  const spec = buildingSpecForZone(zone.kind, rng);
  if (!spec) return null;
  return {
    id: `gen-building-${zone.id}-${parcel.index}`,
    kind: spec.kind,
    label: zone.label ?? zoneLabel(zone.kind),
    position: { x: parcel.x, y: parcel.y, z: 0 },
    width: Math.min(parcel.width * 0.82, spec.width),
    depth: Math.min(parcel.depth * 0.82, spec.depth),
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
  { weight: 0.4, template: { kind: "home", width: 1.35, depth: 1.1, height: 1.22, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f2dfc4", "#ead4b6", "#f6e7cf"], roofColors: ["#b86f4c", "#8a6a52", "#b99358"] } },
  { weight: 0.4, template: { kind: "home", width: 1.42, depth: 1.14, height: 1.72, facadeStyle: "cottage", roofShape: "hip", bodyColors: ["#f0dcc4", "#ecdcc0"], roofColors: ["#6f8fa8", "#7d9a86"] } },
  { weight: 0.75, template: { kind: "home", width: 1.95, depth: 1.15, height: 1.06, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0"], roofColors: ["#7f9b6e", "#5f7f8e", "#a76f4e"] } },
  { weight: 0.75, template: { kind: "home", width: 2.4, depth: 1.45, height: 1.12, facadeStyle: "ranch", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad"], roofColors: ["#a9704f", "#5f7f8e"] } },
  { weight: 1, template: { kind: "home", width: 3.1, depth: 1.2, height: 1.5, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#f2dfc2", "#eed9c0"], roofColors: ["#607d84", "#6f9ca7"] } },
];

const COMMERCIAL_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "shop", width: 3.0, depth: 1.7, height: 1.4, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efd8b6", "#eedcc4"], roofColors: ["#3f8b8c", "#6f9a86"] },
  { kind: "shop", width: 3.6, depth: 1.5, height: 1.1, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efdcc0", "#f2dfc2"], roofColors: ["#c48a5a", "#82a4c4"] },
  { kind: "shop", width: 2.6, depth: 1.95, height: 1.6, facadeStyle: "strip_store", roofShape: "hip", bodyColors: ["#eedcc4", "#efd8b6"], roofColors: ["#6f9a86", "#c48a5a"] },
];

const APARTMENT_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "apartment", width: 2.4, depth: 1.9, height: 2.8, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#ead7bb", "#e3cfae"], roofColors: ["#6d8f6f", "#587a8e"] },
  { kind: "apartment", width: 3.0, depth: 1.7, height: 2.2, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e7c9a8", "#e3d0b4"], roofColors: ["#416f82", "#8a6f95"] },
];

const GYM_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
  { kind: "gym", width: 4.0, depth: 2.6, height: 2.0, facadeStyle: "fitness", roofShape: "sawtooth", bodyColors: ["#d7e7ef", "#d3e2ea"], roofColors: ["#a76f4e", "#5f8fa6"] },
];

function applyDimensionJitter(template: ZoneBuildingTemplate, rng: () => number): ZoneBuildingSpec {
  const jitter = (value: number) => Math.round(value * (1 + (rng() - 0.5) * 0.3) * 100) / 100;
  return {
    kind: template.kind,
    width: jitter(template.width),
    depth: jitter(template.depth),
    height: jitter(template.height),
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

function parametricCameraPresets(bounds: CityWorldBounds, zones: CityWorldZoneSpec[]): CityWorldScene["cameraPresets"] {
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
  const commercialFocus = downtownZones.length > 0 ? averagePoint(downtownZones.map(zoneCenter)) : focus;

  return [
    { id: "desktop", center, zoom: 1.32, minZoom: 0.6, maxZoom: 1.9 },
    { id: "mobile", center: { ...center, y: center.y + 1 }, zoom: 0.86, minZoom: 0.5, maxZoom: 1.5 },
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
    zones: [
      { id: "west-neighborhood", kind: "residential", rect: { minX: 3, minY: 4, maxX: 15, maxY: 18 }, density: 0.6 },
      { id: "civic-core", kind: "civic", rect: { minX: 17, minY: 8, maxX: 23, maxY: 14 } },
      { id: "commercial-spine", kind: "commercial", rect: { minX: 24, minY: 8, maxX: 34, maxY: 16 }, density: 0.8 },
      { id: "apartment-cluster", kind: "apartments", rect: { minX: 26, minY: 18, maxX: 34, maxY: 24 }, density: 0.7 },
      { id: "service-block", kind: "gym", rect: { minX: 18, minY: 16, maxX: 23, maxY: 21 } },
      { id: "community-park", kind: "park", rect: { minX: 8, minY: 20, maxX: 17, maxY: 26 } },
      { id: "waterfront", kind: "water", rect: { minX: 35, minY: 20, maxX: 39, maxY: 27 } },
    ],
    roadSeeds: [
      { id: "gen-road-main", kind: "avenue", from: { x: 3, y: 13 }, to: { x: 37, y: 13 } },
      { id: "gen-road-cross", kind: "avenue", from: { x: 20, y: 4 }, to: { x: 20, y: 25 } },
      { id: "gen-road-commerce", kind: "street", from: { x: 29, y: 6 }, to: { x: 29, y: 24 } },
      { id: "gen-road-west", kind: "street", from: { x: 9, y: 4 }, to: { x: 9, y: 26 } },
      { id: "gen-road-park-loop", kind: "driveway", from: { x: 9, y: 22 }, to: { x: 16, y: 22 } },
      { id: "gen-cross-civic", kind: "crosswalk", from: { x: 18, y: 13 }, to: { x: 22, y: 13 } },
    ],
    seed: 7,
  };
}
