/**
 * Turning a fetched plate into screen paths.
 *
 * Kept apart from the React component so the projection and path building can
 * be reasoned about (and tested) without a DOM. The component's job is pan,
 * zoom, and events; this file's job is geometry.
 */

import {
  boundsOf,
  decodeRing,
  extentOf,
  fitToBox,
  groundDistanceKm,
  INSET_STATE_CODES,
  projectionCenteredOn,
  projectNational,
  type LonLat,
  type Point,
} from "@atlas/core/atlas";

export type PlateKind = "nation" | "state" | "county";

export type PlateCounty = {
  slug: string;
  geoid?: string;
  name: string;
  state: string;
  rings: number[][] | LonLat[][];
  water?: number[][] | LonLat[][];
  waterNames?: (string | null)[];
  anchors?: Array<{ name: string; lon: number; lat: number; population: number }>;
  population?: number;
};

export type Plate = {
  plate: PlateKind;
  state?: string;
  stateName?: string;
  slug?: string;
  name?: string;
  source: string;
  encoding?: { rings: string; decimals?: number };
  counties?: PlateCounty[];
  /** County plates carry their own geometry rather than a county list. */
  rings?: number[][] | LonLat[][];
  water?: number[][] | LonLat[][];
  waterNames?: (string | null)[];
  anchors?: Array<{ name: string; lon: number; lat: number; population: number }>;
  stateOutlines?: Record<string, number[][]>;
  outline?: number[][];
  areaLandMeters?: number;
};

/** Decode a ring that may be delta-encoded integers or raw lon/lat pairs. */
function toLonLat(ring: number[] | LonLat[] | number[][], encoding: Plate["encoding"]): LonLat[] {
  if (ring.length === 0) return [];
  // Raw form is an array of [lon, lat] pairs.
  if (Array.isArray(ring[0])) return ring as LonLat[];
  const decimals = encoding?.decimals ?? 4;
  return decodeRing(ring as number[], { decimals });
}

export type ShapePath = {
  /** SVG path data in plate coordinates. */
  d: string;
  /** Identifier for hit-testing and drill-down. */
  id?: string | undefined;
  label?: string | undefined;
};

export type PlateGeometry = {
  land: ShapePath[];
  water: ShapePath[];
  borders: ShapePath[];
  labels: Array<{ text: string; x: number; y: number; importance: number }>;
  /** Plate-space viewBox the geometry was laid out in. */
  viewBox: { width: number; height: number };
  /** Convert a plate-space distance to kilometres, for the scale bar. */
  kmPerUnit: number;
  /** Whether the scale bar describes the whole plate or only the mainland. */
  scaleAppliesTo: "all" | "contiguous";
  attribution: string;
};

const PLATE_WIDTH = 1000;
const PLATE_HEIGHT = 700;

/**
 * Build every path for a plate in a fixed 1000x700 coordinate space.
 *
 * Laying out once in plate space and letting SVG's viewBox handle zoom means
 * pan and zoom cost nothing at runtime — no reprojection, no re-layout, no
 * dropped frames on a gesture. It is also why this renderer needs no WebGL.
 */
export function buildPlateGeometry(plate: Plate): PlateGeometry {
  const land: ShapePath[] = [];
  const water: ShapePath[] = [];
  const borders: ShapePath[] = [];
  const labelSeeds: Array<{ text: string; lonLat: LonLat; importance: number; state: string }> = [];

  // Gather every ring in lon/lat first so the projection can be chosen from
  // the real extent rather than guessed.
  type Gathered = {
    rings: LonLat[][];
    state: string;
    id?: string | undefined;
    label?: string | undefined;
    kind: "land" | "water";
  };
  const gathered: Gathered[] = [];

  if (plate.plate === "county") {
    const state = plate.state ?? "";
    gathered.push({
      rings: (plate.rings ?? []).map((ring) => toLonLat(ring as number[], plate.encoding)),
      state,
      id: plate.slug,
      label: plate.name,
      kind: "land",
    });
    gathered.push({
      rings: (plate.water ?? []).map((ring) => toLonLat(ring as number[], plate.encoding)),
      state,
      kind: "water",
    });
    for (const anchor of plate.anchors ?? []) {
      labelSeeds.push({ text: anchor.name, lonLat: [anchor.lon, anchor.lat], importance: anchor.population, state });
    }
  } else {
    for (const county of plate.counties ?? []) {
      gathered.push({
        rings: (county.rings ?? []).map((ring) => toLonLat(ring as number[], plate.encoding)),
        state: county.state,
        id: county.slug,
        label: county.name,
        kind: "land",
      });
      if (county.water?.length) {
        gathered.push({
          rings: county.water.map((ring) => toLonLat(ring as number[], plate.encoding)),
          state: county.state,
          kind: "water",
        });
      }
      // Only state plates print town names; the nation plate would be a wall
      // of 3,222 labels.
      if (plate.plate === "state") {
        for (const anchor of county.anchors ?? []) {
          labelSeeds.push({
            text: anchor.name,
            lonLat: [anchor.lon, anchor.lat],
            importance: anchor.population,
            state: county.state,
          });
        }
      }
    }
  }

  // Choose the projection. The national composite keeps Alaska and Hawaii in
  // their inset band; a single state or county gets a conic centred on itself,
  // which keeps its outline true to shape.
  const allPoints = gathered.flatMap((entry) => entry.rings.flat());
  const useNational = plate.plate === "nation";
  const centered = useNational ? undefined : projectionCenteredOn(boundsOf(allPoints));
  const project = (point: LonLat, state: string): Point =>
    useNational ? projectNational(point, state) : centered!.project(point);

  const projectedAll: Point[] = [];
  for (const entry of gathered) {
    for (const ring of entry.rings) {
      for (const point of ring) projectedAll.push(project(point, entry.state));
    }
  }

  const fit = fitToBox(extentOf(projectedAll), { width: PLATE_WIDTH, height: PLATE_HEIGHT, padding: 12 });
  const toScreen = (point: LonLat, state: string): Point => {
    const [x, y] = project(point, state);
    return [x * fit.scale + fit.translateX, y * fit.scale + fit.translateY];
  };

  for (const entry of gathered) {
    for (const ring of entry.rings) {
      const d = pathFrom(ring.map((point) => toScreen(point, entry.state)));
      if (!d) continue;
      const shape: ShapePath = { d, id: entry.id, label: entry.label };
      if (entry.kind === "land") land.push(shape);
      else water.push(shape);
    }
  }

  // Administrative borders drawn heavier than county lines.
  const outlineSource =
    plate.plate === "nation"
      ? plate.stateOutlines ?? {}
      : plate.plate === "state" && plate.outline
        ? { [plate.state ?? ""]: plate.outline }
        : {};
  for (const [state, rings] of Object.entries(outlineSource)) {
    for (const ring of rings) {
      const d = pathFrom(toLonLat(ring, plate.encoding).map((point) => toScreen(point, state)));
      if (d) borders.push({ d, id: state });
    }
  }

  const labels = labelSeeds.map((seed) => {
    const [x, y] = toScreen(seed.lonLat, seed.state);
    return { text: seed.text, x, y, importance: seed.importance };
  });

  // Ground scale: measure a known lon/lat span against its projected length.
  //
  // On the national composite this must be measured across the contiguous
  // states only. Alaska, Hawaii, and Puerto Rico are drawn at their own
  // reduced scales, so a bar derived from the full lon/lat extent — which
  // reaches to Alaska at -180 — describes no part of the plate correctly. It
  // read "50 km" across the continent before this was fixed. One bar cannot
  // serve several scales, so the renderer labels it as contiguous-states only.
  const scalePoints = useNational
    ? gathered.filter((entry) => !INSET_STATE_CODES.has(entry.state)).flatMap((entry) => entry.rings.flat())
    : allPoints;
  const scaleBounds = boundsOf(scalePoints.length > 0 ? scalePoints : allPoints);
  const midLat = (scaleBounds.minLat + scaleBounds.maxLat) / 2;
  const west: LonLat = [scaleBounds.minLon, midLat];
  const east: LonLat = [scaleBounds.maxLon, midLat];
  const groundKm = groundDistanceKm(west, east);
  // Project the sample span through a non-inset state so the measurement uses
  // the same scale it is describing.
  const sampleState = useNational ? "ks" : (gathered[0]?.state ?? "");
  const projectedSpan = Math.abs(toScreen(east, sampleState)[0] - toScreen(west, sampleState)[0]) || 1;

  return {
    land,
    water,
    borders,
    labels,
    scaleAppliesTo: useNational ? ("contiguous" as const) : ("all" as const),
    viewBox: { width: PLATE_WIDTH, height: PLATE_HEIGHT },
    kmPerUnit: groundKm / projectedSpan,
    attribution: plate.source,
  };
}

function pathFrom(points: Point[]): string {
  if (points.length < 3) return "";
  let d = `M${points[0]![0].toFixed(1)} ${points[0]![1].toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += `L${points[i]![0].toFixed(1)} ${points[i]![1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * A round number of kilometres that fills roughly a fifth of the plate.
 *
 * Scale bars read as 10/25/50/100, never 37. Picking from a fixed ladder is
 * what makes the bar glanceable instead of arithmetic.
 */
export function niceScaleDistance(targetKm: number): number {
  const ladder = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2000];
  for (const step of ladder) {
    if (step >= targetKm) return step;
  }
  return ladder[ladder.length - 1]!;
}
