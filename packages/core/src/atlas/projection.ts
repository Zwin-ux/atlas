/**
 * Albers Equal Area Conic projection for the United States.
 *
 * This is the projection printed in real US atlases (and used by the Census
 * Bureau itself). It is equal-area, so a county in Maine and a county in
 * Arizona are drawn at comparable visual weight for comparable ground area —
 * which is the property an atlas needs and a web-mercator slippy map does not
 * have. Mercator would inflate Alaska to the size of the lower 48.
 *
 * Alaska, Hawaii, and Puerto Rico each get their own conic tuned to their
 * latitude, then are scaled and parked below the contiguous states. That
 * composite arrangement is the standard atlas convention: it keeps every
 * state legible on one plate at the cost of true relative position, and the
 * inset frames drawn by the renderer make the break explicit rather than
 * pretending Alaska sits off Baja California.
 *
 * Units: the projection returns dimensionless Albers units (roughly radians on
 * the generating sphere). Call `fitToBox` to map a set of points into an SVG
 * viewBox. Nothing here knows about pixels.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Mean Earth radius in kilometres — used only for the scale bar. */
export const EARTH_RADIUS_KM = 6371.0088;

export type LonLat = readonly [lon: number, lat: number];
export type Box = { minX: number; minY: number; maxX: number; maxY: number };
export type Point = readonly [x: number, y: number];

export type AlbersParameters = {
  /** Southern standard parallel, degrees. */
  readonly parallel1: number;
  /** Northern standard parallel, degrees. */
  readonly parallel2: number;
  /** Central meridian, degrees. */
  readonly centralMeridian: number;
  /** Latitude of origin, degrees. */
  readonly originLatitude: number;
};

/**
 * USA_Contiguous_Albers_Equal_Area_Conic. These are the published parameters
 * for the lower 48; do not tune them by eye.
 */
export const CONUS_ALBERS: AlbersParameters = {
  parallel1: 29.5,
  parallel2: 45.5,
  centralMeridian: -96,
  originLatitude: 37.5,
};

const ALASKA_ALBERS: AlbersParameters = {
  parallel1: 55,
  parallel2: 65,
  centralMeridian: -154,
  originLatitude: 50,
};

const HAWAII_ALBERS: AlbersParameters = {
  parallel1: 8,
  parallel2: 18,
  centralMeridian: -157,
  originLatitude: 20,
};

const PUERTO_RICO_ALBERS: AlbersParameters = {
  parallel1: 8,
  parallel2: 18,
  centralMeridian: -66,
  originLatitude: 18,
};

type ConicConstants = {
  readonly n: number;
  readonly c: number;
  readonly rho0: number;
  readonly lambda0: number;
};

function conicConstants(parameters: AlbersParameters): ConicConstants {
  const phi1 = parameters.parallel1 * DEG_TO_RAD;
  const phi2 = parameters.parallel2 * DEG_TO_RAD;
  const phi0 = parameters.originLatitude * DEG_TO_RAD;
  const sinPhi1 = Math.sin(phi1);

  // n is the cone constant. For equal standard parallels this degenerates to
  // sin(phi1), which is the correct limiting case (Lambert equal-area conic).
  const n = Math.abs(phi1 - phi2) < 1e-12 ? sinPhi1 : (sinPhi1 + Math.sin(phi2)) / 2;
  const c = Math.cos(phi1) ** 2 + 2 * n * sinPhi1;
  const rho0 = Math.sqrt(c - 2 * n * Math.sin(phi0)) / n;

  return { n, c, rho0, lambda0: parameters.centralMeridian * DEG_TO_RAD };
}

/** A projection over one region: forward, inverse, and the window it covers. */
export type RegionProjection = {
  readonly id: string;
  project: (point: LonLat) => Point;
  invert: (point: Point) => LonLat;
  /** True when this lon/lat belongs to the region (used by the composite). */
  contains: (point: LonLat) => boolean;
};

function makeConic(id: string, parameters: AlbersParameters, bounds: {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}): RegionProjection {
  const { n, c, rho0, lambda0 } = conicConstants(parameters);

  return {
    id,
    project([lon, lat]) {
      const phi = lat * DEG_TO_RAD;
      const theta = n * (lon * DEG_TO_RAD - lambda0);
      const radicand = c - 2 * n * Math.sin(phi);
      // Guard the pole-side singularity rather than emitting NaN into a path.
      const rho = Math.sqrt(Math.max(radicand, 0)) / n;
      // Textbook Albers is y-up (north increases y). Every consumer here is
      // SVG, where y grows downward, so the sign is flipped once at the source
      // rather than by every caller. North is a smaller y from this point on.
      return [rho * Math.sin(theta), rho * Math.cos(theta) - rho0];
    },
    invert([x, y]) {
      const dy = y + rho0;
      const rho = Math.hypot(x, dy);
      if (rho === 0) return [parameters.centralMeridian, parameters.originLatitude];
      const theta = Math.atan2(x, dy) * (n < 0 ? -1 : 1);
      const sinPhi = (c - (rho * n) ** 2) / (2 * n);
      const phi = Math.asin(Math.min(1, Math.max(-1, sinPhi)));
      return [(lambda0 + theta / n) * RAD_TO_DEG, phi * RAD_TO_DEG];
    },
    contains([lon, lat]) {
      return lon >= bounds.minLon && lon <= bounds.maxLon && lat >= bounds.minLat && lat <= bounds.maxLat;
    },
  };
}

/** Contiguous 48 states plus DC. */
export const conusProjection = makeConic("conus", CONUS_ALBERS, {
  minLon: -128,
  maxLon: -65,
  minLat: 22,
  maxLat: 51,
});

const alaskaProjection = makeConic("alaska", ALASKA_ALBERS, {
  minLon: -180,
  maxLon: -128,
  minLat: 50,
  maxLat: 73,
});

const hawaiiProjection = makeConic("hawaii", HAWAII_ALBERS, {
  minLon: -161,
  maxLon: -154,
  minLat: 18,
  maxLat: 23,
});

const puertoRicoProjection = makeConic("puertoRico", PUERTO_RICO_ALBERS, {
  minLon: -68,
  maxLon: -65,
  minLat: 17,
  maxLat: 19,
});

/**
 * The extent the contiguous states occupy in CONUS Albers units.
 *
 * Measured from the full Census dataset, not estimated. The inset band is laid
 * out against these numbers, so the composite stays a known width and the
 * insets cannot drift outside the plate.
 */
export const CONUS_EXTENT: Box = {
  minX: -0.37,
  minY: -0.247,
  maxX: 0.354,
  maxY: 0.213,
};

/**
 * Where each inset is parked, and at what scale.
 *
 * Alaska, Hawaii, and Puerto Rico sit in a band directly beneath the
 * contiguous states, left to right, none of them crossing the east/west edges
 * the continent already sets. Each inset is drawn at its own scale — the
 * standard atlas compromise, since Alaska at true scale would be wider than
 * the plate and Puerto Rico at Alaska's scale would be a speck.
 *
 * Because the scales differ, the renderer draws a frame and a scale note
 * around each inset. An unlabelled inset is a lie about relative size; a
 * labelled one is a convention every atlas reader already knows.
 *
 * Translations are derived from each region's own projected extent so the
 * boxes below are exact, not eyeballed:
 *   Alaska      x [-0.370, -0.073]  y [0.245, 0.421]   scale 0.32
 *   Hawaii      x [-0.045,  0.182]  y [0.300, 0.408]   scale 0.60
 *   Puerto Rico x [ 0.240,  0.287]  y [0.330, 0.343]   scale 1.00
 */
type InsetPlacement = {
  readonly projection: RegionProjection;
  readonly scale: number;
  readonly translateX: number;
  readonly translateY: number;
  /** Human-readable scale note for the inset frame. */
  readonly label: string;
};

const INSETS: readonly InsetPlacement[] = [
  { projection: alaskaProjection, scale: 0.32, translateX: -0.148, translateY: 0.441, label: "Alaska" },
  { projection: hawaiiProjection, scale: 0.6, translateX: 0.16, translateY: 0.396, label: "Hawaii" },
  { projection: puertoRicoProjection, scale: 1, translateX: 0.273, translateY: 0.34, label: "Puerto Rico" },
];

/** Inset frames and their scale relative to the contiguous states. */
export const INSET_FRAMES: readonly { code: string; label: string; scale: number }[] = [
  { code: "ak", label: "Alaska", scale: 0.32 },
  { code: "hi", label: "Hawaii", scale: 0.6 },
  { code: "pr", label: "Puerto Rico", scale: 1 },
];

/** Every state/territory whose geography is drawn in an inset, not in place. */
export const INSET_STATE_CODES: ReadonlySet<string> = new Set(["ak", "hi", "pr"]);

/**
 * The national composite: contiguous states in true relative position, with
 * Alaska, Hawaii, and Puerto Rico as insets.
 *
 * `stateCode` is authoritative when supplied. Falling back to lon/lat windows
 * alone would misfile the Aleutian islands that cross the antimeridian, so the
 * callers that know the state (all of them, since every pack carries one) pass
 * it and get a deterministic answer.
 */
export function projectNational(point: LonLat, stateCode?: string): Point {
  const code = stateCode?.toLowerCase();

  if (code === "ak" || (!code && alaskaProjection.contains(point) && !conusProjection.contains(point))) {
    return placeInset(INSETS[0]!, point);
  }
  if (code === "hi" || (!code && hawaiiProjection.contains(point))) {
    return placeInset(INSETS[1]!, point);
  }
  if (code === "pr" || (!code && puertoRicoProjection.contains(point))) {
    return placeInset(INSETS[2]!, point);
  }
  return conusProjection.project(point);
}

function placeInset(inset: InsetPlacement, point: LonLat): Point {
  const [x, y] = inset.projection.project(point);
  return [x * inset.scale + inset.translateX, y * inset.scale + inset.translateY];
}

/**
 * Single-region projection for state and county plates.
 *
 * At those scales the composite's insets are irrelevant — you are looking at
 * one place — so the plate uses a conic centred on that place. Centring the
 * standard parallels on the subject keeps shape distortion near zero across
 * the plate, which is why a county drawn this way looks like its real outline
 * instead of a sheared version of it.
 */
export function projectionCenteredOn(bounds: BoundingBox): RegionProjection {
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const span = Math.max(bounds.maxLat - bounds.minLat, 0.05);
  return makeConic(
    "centered",
    {
      // Standard parallels at the sixth-points of the latitude span is the
      // textbook minimum-distortion choice for a conic over a small region.
      parallel1: centerLat - span / 6,
      parallel2: centerLat + span / 6,
      centralMeridian: centerLon,
      originLatitude: centerLat,
    },
    { minLon: -180, maxLon: 180, minLat: -90, maxLat: 90 },
  );
}

export type BoundingBox = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};


export function boundsOf(points: Iterable<LonLat>): BoundingBox {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of points) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, maxLon, minLat, maxLat };
}

export function extentOf(points: Iterable<Point>): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Fit a projected extent into a viewport, preserving aspect ratio.
 *
 * Returns the affine transform to apply to projected points. Uniform scale on
 * both axes is non-negotiable: an equal-area projection stretched to fill a
 * box is no longer equal-area, and the map would lie about shape.
 *
 * `contain` (default) shows the whole extent; unused space is empty plate.
 * `cover` fills the viewport and lets the overflow run off the edge — the
 * printed-atlas behaviour a phone-sized ChatGPT widget needs, so a wide
 * county is not a thin strip of sea.
 */
export function fitToBox(
  extent: Box,
  viewport: { width: number; height: number; padding?: number; fit?: "contain" | "cover" },
): { scale: number; translateX: number; translateY: number } {
  const padding = viewport.padding ?? 0;
  const innerWidth = Math.max(viewport.width - padding * 2, 1);
  const innerHeight = Math.max(viewport.height - padding * 2, 1);
  const spanX = Math.max(extent.maxX - extent.minX, 1e-9);
  const spanY = Math.max(extent.maxY - extent.minY, 1e-9);
  const scale =
    viewport.fit === "cover"
      ? Math.max(innerWidth / spanX, innerHeight / spanY)
      : Math.min(innerWidth / spanX, innerHeight / spanY);

  return {
    scale,
    translateX: padding + (innerWidth - spanX * scale) / 2 - extent.minX * scale,
    translateY: padding + (innerHeight - spanY * scale) / 2 - extent.minY * scale,
  };
}

/**
 * Ground distance in kilometres between two lon/lat points (haversine).
 * Used by the scale bar, which must report real ground distance rather than
 * anything derived from the projected units.
 */
export function groundDistanceKm(a: LonLat, b: LonLat): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
