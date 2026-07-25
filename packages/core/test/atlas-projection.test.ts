import { describe, expect, it } from "vitest";
import {
  boundsOf,
  conusProjection,
  fitToBox,
  groundDistanceKm,
  projectionCenteredOn,
  projectNational,
  type LonLat,
} from "../src/atlas/projection.js";

// Real places, real coordinates. If the projection drifts, these move.
const SEATTLE: LonLat = [-122.3321, 47.6062];
const MIAMI: LonLat = [-80.1918, 25.7617];
const SAN_DIEGO: LonLat = [-117.1611, 32.7157];
const PORTLAND_ME: LonLat = [-70.2553, 43.6591];
const KANSAS_CITY: LonLat = [-94.5786, 39.0997];

describe("Albers equal-area conic", () => {
  it("puts the projection origin near the map origin", () => {
    // The origin of USA Contiguous Albers is (-96, 37.5). Projecting it should
    // land at x=0 (it is on the central meridian) and y=0 (it is the origin
    // latitude), which is what makes the rest of the numbers interpretable.
    const [x, y] = conusProjection.project([-96, 37.5]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it("orients the continent correctly", () => {
    const [seattleX, seattleY] = conusProjection.project(SEATTLE);
    const [miamiX, miamiY] = conusProjection.project(MIAMI);

    // Seattle is west and north of Miami. In SVG-style coordinates y grows
    // downward, so "north" means a smaller y.
    expect(seattleX).toBeLessThan(miamiX);
    expect(seattleY).toBeLessThan(miamiY);
  });

  it("round-trips through the inverse", () => {
    for (const point of [SEATTLE, MIAMI, SAN_DIEGO, PORTLAND_ME, KANSAS_CITY]) {
      const [lon, lat] = conusProjection.invert(conusProjection.project(point));
      expect(lon).toBeCloseTo(point[0], 6);
      expect(lat).toBeCloseTo(point[1], 6);
    }
  });

  it("preserves area, which is the entire point of choosing it", () => {
    // Equal-area means projected area is proportional to *ground* area — not
    // that every lon/lat cell projects to the same size. A 1x1 degree cell
    // genuinely covers less ground at 46N than at 26N, because meridians
    // converge. So compare the projected ratio against the true spherical
    // ratio: on a sphere, the area of a lon/lat cell is proportional to
    // (sin lat2 - sin lat1).
    const projectedRatio = projectedCellArea(-100, 46) / projectedCellArea(-100, 26);
    const sphericalRatio =
      (Math.sin(radians(47)) - Math.sin(radians(46))) /
      (Math.sin(radians(27)) - Math.sin(radians(26)));

    expect(projectedRatio / sphericalRatio).toBeGreaterThan(0.999);
    expect(projectedRatio / sphericalRatio).toBeLessThan(1.001);
  });

  it("would not pass this test on a conformal projection", () => {
    // Guard against someone swapping in Mercator later: there, the northern
    // cell is drawn *larger* than the southern one, so the ratio exceeds 1.
    // Albers must put it well below 1.
    const projectedRatio = projectedCellArea(-100, 46) / projectedCellArea(-100, 26);
    expect(projectedRatio).toBeLessThan(0.85);
  });

  it("keeps distortion low across a single county plate", () => {
    // A county-sized window projected with a conic centred on it should be
    // near-conformal: a square of ground should still look square.
    const bounds = { minLon: -117.6, maxLon: -116.6, minLat: 33.6, maxLat: 34.2 };
    const projection = projectionCenteredOn(bounds);
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    const widthKm = groundDistanceKm([bounds.minLon, centerLat], [bounds.maxLon, centerLat]);
    const heightKm = groundDistanceKm([-117.1, bounds.minLat], [-117.1, bounds.maxLat]);

    const [westX] = projection.project([bounds.minLon, centerLat]);
    const [eastX] = projection.project([bounds.maxLon, centerLat]);
    const [, northY] = projection.project([-117.1, bounds.maxLat]);
    const [, southY] = projection.project([-117.1, bounds.minLat]);

    const projectedAspect = Math.abs(eastX - westX) / Math.abs(southY - northY);
    const groundAspect = widthKm / heightKm;

    // Within 1% of true ground aspect ratio.
    expect(projectedAspect / groundAspect).toBeGreaterThan(0.99);
    expect(projectedAspect / groundAspect).toBeLessThan(1.01);
  });
});

describe("national composite", () => {
  it("moves Alaska and Hawaii into their inset positions", () => {
    // Anchorage projected as part of the nation must not land where its raw
    // longitude would put it (far off the west edge of the lower 48).
    const anchorage: LonLat = [-149.9003, 61.2181];
    const [insetX, insetY] = projectNational(anchorage, "ak");
    const [rawX] = conusProjection.project(anchorage);

    expect(insetX).toBeGreaterThan(rawX);
    // Parked below the southwest of the continent.
    expect(insetY).toBeGreaterThan(0.3);

    const honolulu: LonLat = [-157.8583, 21.3069];
    const [hiX, hiY] = projectNational(honolulu, "hi");
    expect(hiX).toBeGreaterThan(-0.4);
    expect(hiY).toBeGreaterThan(0.3);
  });

  it("leaves contiguous states in true position", () => {
    for (const point of [SEATTLE, MIAMI, KANSAS_CITY]) {
      expect(projectNational(point, "wa")).toEqual(conusProjection.project(point));
    }
  });

  it("keeps every inset clear of the contiguous extent", () => {
    // The insets must not overlap the lower 48, or Alaska would be drawn on
    // top of Texas. Compare against the projected southern edge of CONUS.
    const conusSouthY = Math.max(
      conusProjection.project([-97, 25.8])[1], // southern Texas
      conusProjection.project([-80.5, 25.1])[1], // southern Florida
    );

    for (const [point, code] of [
      [[-149.9003, 61.2181], "ak"],
      [[-157.8583, 21.3069], "hi"],
      [[-66.1057, 18.4655], "pr"],
    ] as const) {
      const [, y] = projectNational(point, code);
      expect(y).toBeGreaterThan(conusSouthY);
    }
  });
});

describe("fitToBox", () => {
  it("uses one uniform scale so equal-area survives the fit", () => {
    const extent = { minX: -1, minY: -0.5, maxX: 1, maxY: 0.5 };
    const fit = fitToBox(extent, { width: 800, height: 800, padding: 20 });

    // A 2:1 extent in an 800x800 box is width-constrained.
    expect(fit.scale).toBeCloseTo(760 / 2, 6);

    // Corners land inside the padded viewport, centred on the short axis.
    const left = extent.minX * fit.scale + fit.translateX;
    const right = extent.maxX * fit.scale + fit.translateX;
    const top = extent.minY * fit.scale + fit.translateY;
    const bottom = extent.maxY * fit.scale + fit.translateY;

    expect(left).toBeCloseTo(20, 6);
    expect(right).toBeCloseTo(780, 6);
    expect((top + bottom) / 2).toBeCloseTo(400, 6);
  });
});

describe("ground distance", () => {
  it("matches known city-to-city distances", () => {
    // Seattle to Miami is ~4,400 km great-circle.
    expect(groundDistanceKm(SEATTLE, MIAMI)).toBeGreaterThan(4300);
    expect(groundDistanceKm(SEATTLE, MIAMI)).toBeLessThan(4500);

    // San Diego to Portland, Maine is ~4,150 km.
    expect(groundDistanceKm(SAN_DIEGO, PORTLAND_ME)).toBeGreaterThan(4050);
    expect(groundDistanceKm(SAN_DIEGO, PORTLAND_ME)).toBeLessThan(4250);

    expect(groundDistanceKm(MIAMI, MIAMI)).toBe(0);
  });
});

describe("boundsOf", () => {
  it("covers every supplied point", () => {
    const bounds = boundsOf([SEATTLE, MIAMI, PORTLAND_ME]);
    expect(bounds.minLon).toBeCloseTo(SEATTLE[0], 6);
    expect(bounds.maxLon).toBeCloseTo(PORTLAND_ME[0], 6);
    expect(bounds.minLat).toBeCloseTo(MIAMI[1], 6);
    expect(bounds.maxLat).toBeCloseTo(SEATTLE[1], 6);
  });
});

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Projected area of a 1x1 degree cell with its southwest corner at lon/lat. */
function projectedCellArea(lon: number, lat: number): number {
  const corners = [
    conusProjection.project([lon, lat]),
    conusProjection.project([lon + 1, lat]),
    conusProjection.project([lon + 1, lat + 1]),
    conusProjection.project([lon, lat + 1]),
  ];
  // Shoelace.
  let sum = 0;
  for (let i = 0; i < corners.length; i += 1) {
    const [x1, y1] = corners[i]!;
    const [x2, y2] = corners[(i + 1) % corners.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}
