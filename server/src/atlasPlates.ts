/**
 * Serving layer for atlas plates.
 *
 * The widget draws one of three plates: the nation, a state, or a county.
 * Nation and state plates are prebuilt by `scripts/build-atlas-plates.mjs`
 * because they aggregate thousands of counties and must not be assembled per
 * request. A county plate is cheap — one geo pack plus its town anchors — so
 * it is composed on demand and cached.
 *
 * Every response is deliberately small. Atlas has already been bitten once by
 * an oversized payload inside a ChatGPT session (finding G8-2), so plate bytes
 * are measured on build and the county plate carries only what is drawn.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { isValidCountySlug } from "./countyGeoPack.js";

/** A state code is exactly two lowercase letters; nothing else can index a file. */
const STATE_CODE_GUARD = /^[a-z]{2}$/;

/**
 * The attribution line is drawn on the map, so it must read as a credit rather
 * than as a build record. The geo packs carry a source string with pipeline
 * detail appended — "…(public domain), geometryPrecision=4" — and that trailing
 * field was rendering under every county plate. Internal parameters in
 * user-facing copy are the same defect class as the model reciting tier codes.
 */
function cleanAttribution(source: string | undefined): string {
  const fallback = "US Census Bureau TIGERweb (public domain)";
  if (!source) return fallback;
  const cleaned = source
    .split(",")
    .filter((part) => !/^\s*[a-z][A-Za-z]*\s*=/.test(part))
    .join(",")
    .trim()
    .replace(/[,;]\s*$/, "");
  return cleaned || fallback;
}

export type PlateResult =
  | { ok: true; body: string; etag: string }
  | { ok: false; reason: "invalid" | "missing" | "not-built" };

export type AtlasPlateService = {
  nation: () => PlateResult;
  state: (code: string | undefined) => PlateResult;
  county: (slug: string | undefined) => PlateResult;
  /** True when the prebuilt plates are present; surfaced on /ready. */
  isBuilt: () => boolean;
  stats: () => { plateDir: string; built: boolean; cachedPlates: number };
};

export type AtlasPlateServiceOptions = {
  /** Directory holding nation.json and state/<code>.json. */
  plateDir: string;
  /** Directory holding the full-resolution county geo packs. */
  geoPacksDir: string;
  /** Resolves town anchors for a county slug. */
  townAnchorsFor: (slug: string) => Array<{
    label: string;
    latitude: number;
    longitude: number;
    population2024?: number;
    censusPlaceGeoid?: string;
  }>;
  /** Optional county metadata lookup (name, state) for the plate header. */
  countyIdentity?: (slug: string) => { name?: string; state?: string } | undefined;
};

/**
 * Weak ETag over the body length and a cheap checksum.
 *
 * Plates are immutable for a given build, so a stable ETag lets the widget skip
 * re-downloading the nation plate on every mount — which matters because it is
 * the largest thing Atlas ships.
 */
function etagFor(body: string): string {
  let hash = 5381;
  for (let i = 0; i < body.length; i += 1) {
    hash = ((hash << 5) + hash + body.charCodeAt(i)) | 0;
  }
  return `W/"${body.length.toString(36)}-${(hash >>> 0).toString(36)}"`;
}

export function createAtlasPlateService(options: AtlasPlateServiceOptions): AtlasPlateService {
  const cache = new Map<string, PlateResult>();

  function readPlateFile(key: string, path: string): PlateResult {
    const cached = cache.get(key);
    if (cached) return cached;

    let result: PlateResult;
    try {
      if (!existsSync(path)) {
        result = { ok: false, reason: "not-built" };
      } else {
        const body = readFileSync(path, "utf8");
        result = { ok: true, body, etag: etagFor(body) };
      }
    } catch {
      result = { ok: false, reason: "not-built" };
    }

    cache.set(key, result);
    return result;
  }

  function nation(): PlateResult {
    return readPlateFile("nation", resolve(options.plateDir, "nation.json"));
  }

  function state(code: string | undefined): PlateResult {
    if (typeof code !== "string" || !STATE_CODE_GUARD.test(code)) {
      return { ok: false, reason: "invalid" };
    }
    const result = readPlateFile(`state:${code}`, resolve(options.plateDir, "state", `${code}.json`));
    // A well-formed code with no file is a missing state, not an unbuilt atlas.
    if (!result.ok && result.reason === "not-built" && nation().ok) {
      return { ok: false, reason: "missing" };
    }
    return result;
  }

  /**
   * Compose a county plate from the full-resolution pack plus its anchors.
   *
   * Unlike the aggregate plates this is not simplified: a single county is the
   * deepest zoom the atlas offers, so it gets the real geometry.
   */
  function county(slug: string | undefined): PlateResult {
    if (!isValidCountySlug(slug)) return { ok: false, reason: "invalid" };

    const cached = cache.get(`county:${slug}`);
    if (cached) return cached;

    let result: PlateResult;
    try {
      const packPath = resolve(options.geoPacksDir, `${slug}.json`);
      if (!existsSync(packPath)) {
        result = { ok: false, reason: "missing" };
      } else {
        const pack = JSON.parse(readFileSync(packPath, "utf8")) as {
          geoid?: string;
          name?: string;
          countySlug?: string;
          source?: string;
          areaLand?: number;
          areaWater?: number;
          lod0?: { boundaryRings?: unknown[]; waterRings?: unknown[]; waterNames?: unknown[] };
        };

        if (!pack?.lod0?.boundaryRings?.length) {
          result = { ok: false, reason: "missing" };
        } else {
          const identity = options.countyIdentity?.(slug);
          const anchors = options
            .townAnchorsFor(slug)
            .slice()
            .sort((a, b) => (b.population2024 ?? 0) - (a.population2024 ?? 0))
            .map((anchor) => ({
              name: anchor.label,
              lon: Number(anchor.longitude.toFixed(5)),
              lat: Number(anchor.latitude.toFixed(5)),
              population: anchor.population2024 ?? 0,
            }));

          const body = JSON.stringify({
            plate: "county",
            slug,
            geoid: pack.geoid,
            name: pack.name ?? identity?.name ?? slug,
            state: identity?.state,
            projection: "albers-centered",
            source: cleanAttribution(pack.source),
            // County plates carry raw lon/lat rather than the delta encoding:
            // one county is small enough that the codec would save little, and
            // raw coordinates keep this route trivially inspectable.
            encoding: { rings: "lonlat" },
            areaLandMeters: pack.areaLand,
            areaWaterMeters: pack.areaWater,
            rings: pack.lod0.boundaryRings,
            water: pack.lod0.waterRings ?? [],
            waterNames: pack.lod0.waterNames ?? [],
            anchors,
          });

          result = { ok: true, body, etag: etagFor(body) };
        }
      }
    } catch {
      result = { ok: false, reason: "missing" };
    }

    cache.set(`county:${slug}`, result);
    return result;
  }

  return {
    nation,
    state,
    county,
    isBuilt: () => nation().ok,
    stats: () => ({
      plateDir: options.plateDir,
      built: nation().ok,
      cachedPlates: cache.size,
    }),
  };
}

/** Map a plate result to an HTTP status, keeping the mapping in one place. */
export function plateHttpStatus(result: PlateResult): 200 | 400 | 404 | 503 {
  if (result.ok) return 200;
  if (result.reason === "invalid") return 400;
  if (result.reason === "missing") return 404;
  // The atlas has not been built — an operational fault, not a client error.
  return 503;
}
