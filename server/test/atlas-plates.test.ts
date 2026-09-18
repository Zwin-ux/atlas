import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
      source: "US Census TIGERweb (public domain), geometryPrecision=4",
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
  assert.equal(plate.anchors[0].name, "Riverside", "seat / dominant town must lead");
  assert.equal(plate.anchors[0].tier, "seat");
  assert.equal(plate.anchors[0].seatSource, "name");
  assert.equal(plate.anchors[1].name, "Eastvale");
  assert.equal(plate.anchors[1].tier, "primary");
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
  const { service, plateDir } = fixture();
  // A transiently empty nation body is served but never cached, so this
  // caching test needs a real plate to assert all three kinds are cached.
  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({
      plate: "nation",
      encoding: { decimals: 3 },
      counties: [
        {
          slug: "san-bernardino-ca",
          name: "San Bernardino County",
          state: "ca",
          rings: [[-117200, 34000, 400, 0, 0, 500, -400, 0, 0, -500]],
        },
      ],
    }),
  );
  service.nation();
  service.county("riverside-ca");
  service.state("ca");
  assert.ok(service.stats().cachedPlates >= 3);
  assert.equal(service.stats().built, true);
});

test("picks up nation plates written after the first miss", () => {
  const { service, plateDir } = fixture({ withPlates: false });
  const before = service.nation();
  assert.equal(before.ok, false);
  if (!before.ok) assert.equal(before.reason, "not-built");

  writeFileSync(join(plateDir, "nation.json"), JSON.stringify({ plate: "nation", counties: [] }));
  const after = service.nation();
  assert.equal(after.ok, true);
  assert.equal(service.isBuilt(), true);
});

test("rebuilds a die-cut county once surrounding plates exist", () => {
  const { service, plateDir } = fixture({ withPlates: false });
  const first = service.county("riverside-ca");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(JSON.parse(first.body).context.length, 0, "no neighbours before the national plate exists");

  // National-plate ring is delta-encoded at decimals=3. First point -117.2,34.0
  // then a box that overlaps the fixture Riverside bounds.
  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({
      plate: "nation",
      encoding: { decimals: 3 },
      counties: [
        {
          slug: "san-bernardino-ca",
          name: "San Bernardino County",
          state: "ca",
          rings: [[-117200, 34000, 400, 0, 0, 500, -400, 0, 0, -500]],
        },
      ],
    }),
  );

  const second = service.county("riverside-ca");
  assert.equal(second.ok, true);
  if (!second.ok) return;
  const plate = JSON.parse(second.body);
  assert.equal(plate.context.length, 1);
  assert.equal(plate.context[0].slug, "san-bernardino-ca");
});

test("retries a die-cut county when the national plate was transiently empty", () => {
  const { service, plateDir } = fixture({ withPlates: false });
  const first = service.county("riverside-ca");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(JSON.parse(first.body).context.length, 0, "no neighbours before the national plate exists");

  // Nation plate transiently written empty (partial write): rebuild must not
  // spend the token, so later requests retry instead of staying die-cut.
  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({ plate: "nation", encoding: { decimals: 3 }, counties: [] }),
  );

  const second = service.county("riverside-ca");
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(JSON.parse(second.body).context.length, 0, "empty nation must keep serving the cached die-cut entry");

  const third = service.county("riverside-ca");
  assert.equal(third.ok, true);
  if (!third.ok) return;
  assert.equal(JSON.parse(third.body).context.length, 0, "token must not be spent on an empty rebuild");

  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({
      plate: "nation",
      encoding: { decimals: 3 },
      counties: [
        {
          slug: "san-bernardino-ca",
          name: "San Bernardino County",
          state: "ca",
          rings: [[-117200, 34000, 400, 0, 0, 500, -400, 0, 0, -500]],
        },
      ],
    }),
  );

  const fourth = service.county("riverside-ca");
  assert.equal(fourth.ok, true);
  if (!fourth.ok) return;
  const plate = JSON.parse(fourth.body);
  assert.equal(plate.context.length, 1, "retry after the real ring lands must rebuild with context");
  assert.equal(plate.context[0].slug, "san-bernardino-ca");
});

test("keeps pipeline parameters out of the on-map attribution", () => {
  const { service } = fixture();
  const result = service.county("riverside-ca");
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const plate = JSON.parse(result.body);
  // The geo packs append build detail to the source string; it is drawn under
  // every county plate, so it must read as a credit and nothing else.
  assert.ok(!/=/.test(plate.source), `attribution leaked a parameter: ${plate.source}`);
  assert.ok(/Census/i.test(plate.source));
  assert.ok(/public domain/i.test(plate.source));
});

test("does not rebuild a die-cut county twice for an unchanged empty nation", () => {
  const { service, plateDir, geoPacksDir } = fixture({ withPlates: false });
  const first = service.county("riverside-ca");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(JSON.parse(first.body).context.length, 0, "no neighbours before the national plate exists");

  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({ plate: "nation", encoding: { decimals: 3 }, counties: [] }),
  );

  // First hit with this nation stat: one recompute attempt, still die-cut.
  const second = service.county("riverside-ca");
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(JSON.parse(second.body).context.length, 0, "empty nation must keep serving the cached die-cut entry");

  // Delete the geo-pack: a second recompute would fail outright, so still
  // serving die-cut proves the unchanged stat signature skipped the rebuild.
  rmSync(join(geoPacksDir, "riverside-ca.json"));
  const third = service.county("riverside-ca");
  assert.equal(third.ok, true, "unchanged nation stat must serve the cached die-cut without recomputing");
  if (!third.ok) return;
  assert.equal(JSON.parse(third.body).context.length, 0);
});

test("propagates a fresh miss instead of restoring a stale die-cut", () => {
  const { service, plateDir, geoPacksDir } = fixture({ withPlates: false });
  const first = service.county("riverside-ca");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(JSON.parse(first.body).context.length, 0, "no neighbours before the national plate exists");

  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({
      plate: "nation",
      encoding: { decimals: 3 },
      counties: [
        {
          slug: "san-bernardino-ca",
          name: "San Bernardino County",
          state: "ca",
          rings: [[-117200, 34000, 400, 0, 0, 500, -400, 0, 0, -500]],
        },
      ],
    }),
  );

  // Geo-pack vanishes mid-retry: the fresh rebuild is !ok, so the stale ok
  // die-cut must not be restored — the miss propagates.
  rmSync(join(geoPacksDir, "riverside-ca.json"));
  const second = service.county("riverside-ca");
  assert.equal(second.ok, false, "fresh rebuild failure must propagate instead of serving stale geography");
  if (second.ok) return;
  assert.equal(second.reason, "missing");
  assert.equal(plateHttpStatus(second), 404);

  // Token must be unspent and the miss uncached: restoring the pack retries
  // the rebuild and lands context.
  writeFileSync(
    join(geoPacksDir, "riverside-ca.json"),
    JSON.stringify({
      geoid: "06065",
      name: "Riverside County",
      countySlug: "riverside-ca",
      source: "US Census TIGERweb (public domain), geometryPrecision=4",
      areaLand: 18665,
      lod0: {
        boundaryRings: [[[-117.5, 33.7], [-116.5, 33.7], [-116.5, 34.1], [-117.5, 34.1], [-117.5, 33.7]]],
        waterRings: [],
        waterNames: [],
      },
    }),
  );
  const third = service.county("riverside-ca");
  assert.equal(third.ok, true);
  if (!third.ok) return;
  const plate = JSON.parse(third.body);
  assert.equal(plate.context.length, 1, "retry after the pack returns must rebuild with context");
  assert.equal(plate.context[0].slug, "san-bernardino-ca");
});

test("does not cache a transiently empty nation plate", () => {
  const { service, plateDir } = fixture({ withPlates: false });
  writeFileSync(join(plateDir, "nation.json"), JSON.stringify({ plate: "nation", counties: [] }));
  const empty = service.nation();
  assert.equal(empty.ok, true, "transiently empty nation is still served");

  writeFileSync(
    join(plateDir, "nation.json"),
    JSON.stringify({
      plate: "nation",
      encoding: { decimals: 3 },
      counties: [
        {
          slug: "san-bernardino-ca",
          name: "San Bernardino County",
          state: "ca",
          rings: [[-117200, 34000, 400, 0, 0, 500, -400, 0, 0, -500]],
        },
      ],
    }),
  );
  const real = service.nation();
  assert.equal(real.ok, true);
  if (!real.ok) return;
  assert.equal(
    JSON.parse(real.body).counties.length,
    1,
    "the real plate build must be picked up, not the stale-empty body",
  );
  assert.equal(service.isBuilt(), true);
});
