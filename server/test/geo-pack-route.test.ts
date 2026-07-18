import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  createCountyGeoPackLoader,
  isValidCountySlug,
  serveCountyGeoPack,
} from "../src/countyGeoPack.js";

// A minimal but structurally-valid pack: the loader requires lod0.boundaryRings
// to be a non-empty array (mirrors the real baked shape).
const VALID_PACK = {
  packVersion: 2,
  countySlug: "riverside-ca",
  name: "Riverside County",
  lod0: { boundaryRings: [[[0, 0], [10, 0], [10, 10], [0, 10]]] },
};

// A temp geo-packs dir so tests never touch data/geo-packs (a bake writes there).
const geoPacksDir = mkdtempSync(join(tmpdir(), "atlas-geo-pack-"));
writeFileSync(resolve(geoPacksDir, "riverside-ca.json"), JSON.stringify(VALID_PACK));
// A file with a valid slug but structurally-empty pack — must NOT be served (404).
writeFileSync(resolve(geoPacksDir, "empty-rings.json"), JSON.stringify({ packVersion: 2, lod0: { boundaryRings: [] } }));
// A "secret" one level ABOVE the packs dir — a traversal slug must never reach it.
writeFileSync(resolve(geoPacksDir, "..", "atlas-geo-pack-secret.json"), JSON.stringify({ secret: true }));

const load = createCountyGeoPackLoader(geoPacksDir);

test.after(() => {
  rmSync(geoPacksDir, { recursive: true, force: true });
  rmSync(resolve(geoPacksDir, "..", "atlas-geo-pack-secret.json"), { force: true });
});

type CapturedResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

function mockResponse(): { res: ServerResponse; captured: CapturedResponse } {
  const captured: CapturedResponse = { status: 0, headers: {}, body: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>): ServerResponse {
      captured.status = status;
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          captured.headers[key.toLowerCase()] = value;
        }
      }
      return res;
    },
    end(body?: string): ServerResponse {
      if (typeof body === "string") captured.body = body;
      return res;
    },
  } as unknown as ServerResponse;
  return { res, captured };
}

test("serves 200 with the pack JSON + caching headers for a valid existing slug", () => {
  const { res, captured } = mockResponse();
  const status = serveCountyGeoPack(res, "riverside-ca", load);

  assert.equal(status, 200);
  assert.equal(captured.status, 200);
  assert.equal(captured.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(captured.headers["cache-control"], "public, max-age=3600, immutable");
  assert.deepEqual(JSON.parse(captured.body), VALID_PACK);
});

test("returns 400 for a slug that fails the guard", () => {
  const { res, captured } = mockResponse();
  const status = serveCountyGeoPack(res, "Riverside_CA!", load);

  assert.equal(status, 400);
  assert.equal(captured.status, 400);
  assert.equal(captured.headers["content-type"], "application/json; charset=utf-8");
  assert.deepEqual(JSON.parse(captured.body), { ok: false, error: "Invalid county slug." });
});

test("returns 404 for a valid slug with no baked pack", () => {
  const { res, captured } = mockResponse();
  const status = serveCountyGeoPack(res, "loving-tx", load);

  assert.equal(status, 404);
  assert.equal(captured.status, 404);
  assert.deepEqual(JSON.parse(captured.body), { ok: false, error: "No geo pack for this county." });
});

test("returns 404 (not 200) for a valid slug whose pack has empty boundary rings", () => {
  const { res, captured } = mockResponse();
  const status = serveCountyGeoPack(res, "empty-rings", load);

  assert.equal(status, 404);
  assert.equal(captured.status, 404);
});

test("rejects a path-traversal slug with 400 and never reads outside the packs dir", () => {
  const { res, captured } = mockResponse();
  // Resolving "../atlas-geo-pack-secret" against the packs dir would land on the
  // real secret file — the guard must reject it before any filesystem read.
  const status = serveCountyGeoPack(res, "../atlas-geo-pack-secret", load);

  assert.equal(status, 400);
  assert.equal(captured.status, 400);
  // The loader itself must also refuse the traversal slug (returns null, no read).
  assert.equal(load("../atlas-geo-pack-secret"), null);
  assert.equal(load("../../etc/passwd"), null);
});

test("isValidCountySlug matches the byte-identical guard semantics", () => {
  assert.equal(isValidCountySlug("riverside-ca"), true);
  assert.equal(isValidCountySlug("miami-dade-fl"), true);
  assert.equal(isValidCountySlug("a1"), true);
  assert.equal(isValidCountySlug(undefined), false);
  assert.equal(isValidCountySlug(""), false);
  assert.equal(isValidCountySlug("Riverside"), false); // uppercase
  assert.equal(isValidCountySlug("river_side"), false); // underscore
  assert.equal(isValidCountySlug("river.side"), false); // dot
  assert.equal(isValidCountySlug("../etc"), false); // traversal
  assert.equal(isValidCountySlug("a/b"), false); // slash
  assert.equal(isValidCountySlug("_manifest"), false); // internal file
});

test("negative results are cached and valid packs load byte-identically", () => {
  // Missing slug returns null and is remembered (negative cache).
  assert.equal(load("loving-tx"), null);
  assert.equal(load("loving-tx"), null);
  // Valid pack loads and equals the on-disk content.
  assert.deepEqual(load("riverside-ca"), VALID_PACK);
});
