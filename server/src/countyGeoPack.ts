import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ServerResponse } from "node:http";

// Shared county-slug guard + geo-pack loading used by BOTH the inline
// `_meta.countyGeoPack` delivery (select_county) and the read-only
// `/geo-pack/<slug>` route (D2-0). Extracting it keeps the slug-regex guard and
// the negative-cache behavior in exactly one place (plan decisions #10 / S5-a)
// so the route can never drift from the delivery path it mirrors.

// A county slug is lowercase alphanumerics + hyphens only. Anything else
// (path separators, dots, uppercase, `_manifest`/`_failures` internals) is
// rejected so a slug can never escape the geo-packs directory.
const COUNTY_SLUG_GUARD = /^[a-z0-9-]+$/;

export function isValidCountySlug(slug: string | undefined): slug is string {
  return typeof slug === "string" && COUNTY_SLUG_GUARD.test(slug);
}

export type CountyGeoPackLoader = (slug: string | undefined) => unknown | null;

// Builds a loader over a geo-packs directory with a per-instance cache that
// remembers misses too (negatives cached as null): most counties aren't baked,
// so a miss returns null once and never re-reads the disk. Behavior is
// byte-identical to the former inline `loadCountyGeoPack` in index.ts.
export function createCountyGeoPackLoader(geoPacksDir: string): CountyGeoPackLoader {
  const cache = new Map<string, unknown | null>();
  return function loadCountyGeoPack(slug: string | undefined): unknown | null {
    if (!isValidCountySlug(slug)) return null; // guard path traversal
    const cached = cache.get(slug);
    if (cached !== undefined) return cached;
    let pack: unknown | null = null;
    try {
      const packPath = resolve(geoPacksDir, `${slug}.json`);
      if (existsSync(packPath)) {
        const parsed = JSON.parse(readFileSync(packPath, "utf8")) as { lod0?: { boundaryRings?: unknown } };
        if (parsed?.lod0 && Array.isArray(parsed.lod0.boundaryRings) && parsed.lod0.boundaryRings.length > 0) {
          pack = parsed;
        }
      }
    } catch {
      pack = null;
    }
    cache.set(slug, pack);
    return pack;
  };
}

export type GeoPackRouteStatus = 200 | 400 | 404;

// Cache the served pack aggressively: packs are immutable baked assets keyed by
// slug; a new bake publishes under the same slug only on a full re-bake, which
// is an operator event, not a live-traffic concern.
const GEO_PACK_CACHE_CONTROL = "public, max-age=3600, immutable";

// Writes the HTTP response for `/geo-pack/<slug>` and returns the status it
// chose so the caller can loud-log the 400 (guard failure) case. Returns:
//   400 - slug fails the guard (client bug or traversal probe; caller logs)
//   404 - valid slug, but no baked pack for that county
//   200 - valid slug with a baked pack (JSON body + caching headers)
export function serveCountyGeoPack(
  res: ServerResponse,
  slug: string | undefined,
  load: CountyGeoPackLoader,
): GeoPackRouteStatus {
  if (!isValidCountySlug(slug)) {
    res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "Invalid county slug." }));
    return 400;
  }

  const pack = load(slug);
  if (!pack) {
    res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "No geo pack for this county." }));
    return 404;
  }

  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": GEO_PACK_CACHE_CONTROL,
  });
  res.end(JSON.stringify(pack));
  return 200;
}
