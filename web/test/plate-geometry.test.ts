import assert from "node:assert/strict";
import test from "node:test";

import type { LonLat } from "@atlas/core/atlas";

import { buildPlateGeometry, type Plate } from "../src/atlas/plateGeometry";

test("national geometry exposes bounded projected county centers by slug", () => {
  const californiaRing: LonLat[] = [
    [-118.7, 33.7],
    [-117.7, 33.7],
    [-117.7, 34.4],
    [-118.7, 34.4],
  ];
  const texasRing: LonLat[] = [
    [-98.2, 29.2],
    [-97.2, 29.2],
    [-97.2, 30.1],
    [-98.2, 30.1],
  ];
  const plate: Plate = {
    plate: "nation",
    source: "Synthetic test geography",
    counties: [
      { slug: "riverside-ca", name: "Riverside County", state: "ca", rings: [californiaRing] },
      { slug: "travis-tx", name: "Travis County", state: "tx", rings: [texasRing] },
    ],
  };

  const geometry = buildPlateGeometry(plate);
  assert.deepEqual(Object.keys(geometry.countyCenters).sort(), ["riverside-ca", "travis-tx"]);

  const riverside = geometry.countyCenters["riverside-ca"]!;
  const travis = geometry.countyCenters["travis-tx"]!;
  for (const center of [riverside, travis]) {
    assert.ok(Number.isFinite(center.x) && Number.isFinite(center.y));
    assert.ok(center.x >= 0 && center.x <= geometry.viewBox.width);
    assert.ok(center.y >= 0 && center.y <= geometry.viewBox.height);
  }
  assert.notDeepEqual(riverside, travis);
});
