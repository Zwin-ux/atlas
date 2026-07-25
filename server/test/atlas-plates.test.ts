import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createAtlasPlateService, plateHttpStatus } from "../src/atlasPlates.js";

function fixture(options: { withPlates?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), "atlas-plates-"));
  const plateDir = join(root, "plates");
  const geoPacksDir = join(root, "geo-packs");
  mkdirSync(join(plateDir, "state"), { recursive: true });
  mkdirSync(geoPacksDir, { recursive: true });

  if (options.withPlates !== false) {
    writeFileSync(join(plateDir, "nation.json"), JSON.stringify({ plate: "nation", counties: [] }));
    writeFileSync(join(plateDir, "state", "ca.json"), JSON.stringify({ plate: "state", state: "ca" }));
  }

  writeFileSync(
    join(geoPacksDir, "riverside-ca.json"),
    JSON.stringify({
      geoid: "06065",
      name: "Riverside County",
      countySlug: "riverside-ca",
      source: "US Census Bureau TIGERweb (public domain)",
      areaLand: 18665,
      lod0: {
        boundaryRings: [[[-117.5, 33.7], [-116.5, 33.7], [-116.5, 34.1], [-117.5, 34.1], [-117.5, 33.7]]],
        waterRings: [],
        waterNames: [],
      },
    }),
  );

  const service = createAtlasPlateService({
    plateDir,
    geoPacksDir,
    townAnchorsFor: (slug) =>
      slug === "riverside-ca"
        ? [
            { label: "Riverside", latitude: 33.9533, longitude: -117.3961, population2024: 314998 },
            { label: "Eastvale", latitude: 33.9525, longitude: -117.5848, population2024: 71000 },
          ]
        : [],
    countyIdentity: () => ({ name: "Riverside County", state: "ca" }),
  });

  return { service, plateDir, geoPacksDir };
}

test("serves the prebuilt nation plate with a stable etag", () => {
  const { service } = fixture();
  const first = service.nation();
  const second = service.nation();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.etag, second.etag, "etag must be stable so the widget can cache the largest payload");
  assert.equal(plateHttpStatus(first), 200);
});

test("rejects state codes that could escape the plate directory", () => {
  const { service } = fixture();
  for (const bad of ["../nation", "CA", "c", "cal", "c/", "", undefined]) {
    const result = service.state(bad as string | undefined);
    assert.equal(result.ok, false, `state code ${String(bad)} must be rejected`);
    if (!result.ok) assert.equal(result.reason, "invalid");
    assert.equal(plateHttpStatus(result), 400);
  }
});

test("separates a missing state from an unbuilt atlas", () => {
  const { service } = fixture();
  // Well-formed code, no such plate: that is a 404, not a server fault.
  const missing = service.state("zz");
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, "missing");
  assert.equal(plateHttpStatus(missing), 404);
});

test("reports an unbuilt atlas as an operational fault, not a client error", () => {
  const { service } = fixture({ withPlates: false });
  const nation = service.nation();
  assert.equal(nation.ok, false);
  if (!nation.ok) assert.equal(nation.reason, "not-built");
  assert.equal(plateHttpStatus(nation), 503);
  assert.equal(service.isBuilt(), false);
});

test("composes a county plate with anchors ranked by population", () => {
  const { service } = fixture();
  const result = service.county("riverside-ca");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const plate = JSON.parse(result.body);
  assert.equal(plate.plate, "county");
  assert.equal(plate.slug, "riverside-ca");
  assert.equal(plate.name, "Riverside County");
  assert.equal(plate.rings.length, 1);
  assert.equal(plate.anchors[0].name, "Riverside", "largest place must lead");
  assert.equal(plate.anchors[1].name, "Eastvale");
  assert.ok(plate.source.includes("Census"), "attribution must travel with the plate");
});

test("guards county slugs against path traversal", () => {
  const { service } = fixture();
  for (const bad of ["../../etc/passwd", "Riverside-CA", "riverside_ca", "", undefined]) {
    const result = service.county(bad as string | undefined);
    assert.equal(result.ok, false, `county slug ${String(bad)} must be rejected`);
    if (!result.ok) assert.equal(result.reason, "invalid");
  }
});

test("returns 404 for a well-formed county that is not in the dataset", () => {
  const { service } = fixture();
  const result = service.county("nowhere-zz");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "missing");
  assert.equal(plateHttpStatus(result), 404);
});

test("caches repeated reads", () => {
  const { service } = fixture();
  service.nation();
  service.county("riverside-ca");
  service.state("ca");
  assert.ok(service.stats().cachedPlates >= 3);
  assert.equal(service.stats().built, true);
});
