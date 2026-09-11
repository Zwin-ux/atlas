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
  anchors?: Array<{
    name: string;
    lon: number;
    lat: number;
    population: number;
    tier?: "seat" | "primary" | "secondary";
  }>;
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
  anchors?: Array<{
    name: string;
    lon: number;
    lat: number;
    population: number;
    tier?: "seat" | "primary" | "secondary";
    seatSource?: "name" | "largest" | "only";
  }>;
  stateOutlines?: Record<string, number[][]>;
  /** Postal code to state name, used to label the national plate. */
  states?: Record<string, string>;
  context?: Array<{ slug: string; name: string; state: string; rings: number[][] }>;
  contextEncoding?: { rings: string; decimals?: number };
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
  context: ShapePath[];
  water: ShapePath[];
  borders: ShapePath[];
  labels: Array<{
    text: string;
    x: number;
    y: number;
    importance: number;
    tier?: "seat" | "primary" | "secondary";
  }>;
  /** Plate-space viewBox the geometry was laid out in. */
  viewBox: { width: number; height: number };
  /** Convert a plate-space distance to kilometres, for the scale bar. */
  kmPerUnit: number;
  /** Whether the scale bar describes the whole plate or only the mainland. */
  scaleAppliesTo: "all" | "contiguous";
  attribution: string;
  /**
   * Project a WGS84 lon/lat into plate space using the same transform as the
   * drawn paths. Used to fly the camera to a town the tool resolved.
   */
  toPlatePoint: (lon: number, lat: number) => { x: number; y: number } | null;
};

const PLATE_WIDTH = 1000;
const DEFAULT_PLATE_HEIGHT = 700;

/**
 * Build every path for a plate in a fixed 1000x700 coordinate space.
 *
 * Laying out once in plate space and letting SVG's viewBox handle zoom means
 * pan and zoom cost nothing at runtime — no reprojection, no re-layout, no
 * dropped frames on a gesture. It is also why this renderer needs no WebGL.
 */
export function buildPlateGeometry(plate: Plate, aspectRatio = PLATE_WIDTH / DEFAULT_PLATE_HEIGHT): PlateGeometry {
  // Lay out to the container's shape, not a fixed landscape box. A wide county
  // fitted into a tall phone viewport letterboxed into a thin sliver with most
  // of the widget left empty; matching the aspect ratio means the subject fills
  // whatever space it is actually given.
  const PLATE_HEIGHT = Math.round(PLATE_WIDTH / Math.max(aspectRatio, 0.2));
  const land: ShapePath[] = [];
  const context: ShapePath[] = [];
  const water: ShapePath[] = [];
  const borders: ShapePath[] = [];
  const labelSeeds: Array<{
    text: string;
    lonLat: LonLat;
    importance: number;
    state: string;
    tier?: "seat" | "primary" | "secondary";
  }> = [];

  // Gather every ring in lon/lat first so the projection can be chosen from
  // the real extent rather than guessed.
  type Gathered = {
    rings: LonLat[][];
    state: string;
    id?: string | undefined;
    label?: string | undefined;
    kind: "land" | "water" | "context";
  };
  const gathered: Gathered[] = [];

  if (plate.plate === "county") {
    const state = plate.state ?? "";

    // Neighbours first, so the subject county draws on top of them. Without
    // this layer a county is a die-cut floating on water and you cannot tell
    // where you are looking; with it, the surrounding country runs off the
    // edge of the plate the way it does in a printed atlas.
    for (const neighbor of plate.context ?? []) {
      gathered.push({
        rings: (neighbor.rings ?? []).map((ring) => toLonLat(ring as number[], plate.contextEncoding)),
        state: neighbor.state,
        id: neighbor.slug,
        label: neighbor.name,
        kind: "context",
      });
    }

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
      // Prefer server-assigned tier weights (A2); fall back to raw population.
      const importance =
        typeof anchor.population === "number" && anchor.tier
          ? anchor.tier === "seat"
            ? 1_000_000_000_000 + anchor.population
            : anchor.tier === "primary"
              ? 1_000_000_000 + anchor.population
              : anchor.population
          : anchor.population;
      labelSeeds.push({
        text: anchor.name,
        lonLat: [anchor.lon, anchor.lat],
        importance,
        state,
        ...(anchor.tier ? { tier: anchor.tier } : {}),
      });
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

  // Fit to the subject, not to the neighbours. Including context geometry in
  // the extent would shrink the county the reader actually asked for; the
  // neighbours are meant to run off the edge, which is the point of them.
  const fitSource = gathered.some((entry) => entry.kind === "land")
    ? gathered.filter((entry) => entry.kind !== "context")
    : gathered;
  const projectedAll: Point[] = [];
  for (const entry of fitSource) {
    for (const ring of entry.rings) {
      for (const point of ring) projectedAll.push(project(point, entry.state));
    }
  }

  const subjectExtent = extentOf(projectedAll);
  const spanX = Math.max(subjectExtent.maxX - subjectExtent.minX, 1e-9);
  const spanY = Math.max(subjectExtent.maxY - subjectExtent.minY, 1e-9);
  // County and state plates are the page. Match the subject's shape so a wide
  // county is not a strip of sea on a tall phone; the SVG letterboxes. The
  // national plate still follows the widget so the whole country stays in view.
  const fittedHeight =
    plate.plate === "nation"
      ? PLATE_HEIGHT
      : Math.round(PLATE_WIDTH / Math.min(Math.max(spanX / spanY, 0.35), 2.8));
  const fit = fitToBox(subjectExtent, {
    width: PLATE_WIDTH,
    height: fittedHeight,
    padding: 16,
  });
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
      else if (entry.kind === "context") context.push(shape);
      else water.push(shape);
    }
  }

  // State names on the national plate.
  //
  // Without these the nation is 3,222 unlabelled shapes — recognisable as the
  // United States, but useless for finding anything. A national plate labels
  // its states; that is the level of detail the scale supports. The anchor is
  // the centroid of the state's largest ring, which for all but a handful of
  // states sits inside the state.
  if (plate.plate === "nation" && plate.states) {
    const decimals = plate.encoding?.decimals ?? 3;
    for (const [code, rings] of Object.entries(plate.stateOutlines ?? {})) {
      const name = plate.states[code];
      if (!name) continue;

      // Largest ring by vertex count stands in for the mainland; islands and
      // slivers must not steal the label.
      const largest = rings.reduce<number[] | undefined>(
        (best, ring) => (!best || ring.length > best.length ? ring : best),
        undefined,
      );
      if (!largest) continue;

      const points = toLonLat(largest, { rings: "delta-fixed-point", decimals });
      if (points.length === 0) continue;

      let sumLon = 0;
      let sumLat = 0;
      for (const [lon, lat] of points) {
        sumLon += lon;
        sumLat += lat;
      }
      labelSeeds.push({
        text: name,
        lonLat: [sumLon / points.length, sumLat / points.length],
        // Rank by area so a crowded northeast drops Rhode Island before Texas.
        importance: points.length,
        state: code,
      });
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
    return {
      text: displayName(seed.text),
      x,
      y,
      importance: seed.importance,
      ...(seed.tier ? { tier: seed.tier } : {}),
    };
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

  // County/state plates project focus towns through the subject state code.
  // National focus is rare; fall back to a mid-continent state so the call
  // still returns a finite point rather than throwing.
  const focusState = plate.state ?? gathered.find((entry) => entry.kind === "land")?.state ?? "ks";

  return {
    land,
    context,
    water,
    borders,
    labels,
    scaleAppliesTo: useNational ? ("contiguous" as const) : ("all" as const),
    viewBox: { width: PLATE_WIDTH, height: fittedHeight },
    kmPerUnit: groundKm / projectedSpan,
    attribution: plate.source,
    toPlatePoint: (lon, lat) => {
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
      const [x, y] = toScreen([lon, lat], focusState);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    },
  };
}

/**
 * The name as it should appear on the map face.
 *
 * The Census records some places with a formal name and a common one in
 * brackets — "El Paso de Robles (Paso Robles)". That is right for an index and
 * wrong for a label: it is the longest name on the California plate and reads
 * as a data artefact. The map prints the name people use; the index still
 * matches both, so searching either one still works.
 */
function displayName(name: string): string {
  const parenthetical = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(name);
  if (!parenthetical) return name;
  const [, formal, common] = parenthetical;
  // Prefer whichever form is shorter — the bracketed part is usually the
  // everyday name, but not always.
  return (common!.length <= formal!.length ? common! : formal!).trim();
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
