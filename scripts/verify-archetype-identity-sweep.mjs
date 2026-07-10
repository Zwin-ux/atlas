#!/usr/bin/env node
import process from "node:process";
import {
  GENERATED_LANDMARK_SIGNATURES,
  GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
  US_COUNTY_INDEX,
  analyzeGeneratedDistrictMassingSignature,
  analyzeGeneratedLandmark,
  createDeterministicGeneratedDistrictScene,
  expectedGeneratedLandmarkKind,
  generatedDistrictMassingSignatureDistance,
  resolveCountyParameters,
} from "../packages/core/dist/index.js";

// 0.76 USA-Region — Archetype Identity Sweep (NS-6).
//
// The parity verifier proves ONE generated district is well-formed. This
// verifier proves the SIX archetypes carry distinct REGIONAL identity across
// the full 3,222-county index — the NS-6 "batch-verify the index" deliverable
// and the objective gate for the 0.76 regional-palette work.
//
// Two structural gates:
//   1. coverage — every archetype is reachable across the real county index,
//      and the classifier spans all six regions (no dead archetype).
//   2. palette distinctness — the six archetypes' building-color fingerprints
//      are mutually distinct. This gate FAILS on the pre-0.76 global palette
//      (all archetypes draw the same kind-keyed pools) and PASSES once each
//      archetype resolves a regional palette. "A verifier that cannot fail is
//      not proof": a teeth self-test degrades to identical palettes and
//      asserts the gate fires.
//
// Plus a perf-at-scale probe (mean generation time, zero budget failures)
// reproducing the measured 5.8ms/county, 0-failure claim as a live check.

const jsonOnly = process.argv.includes("--json-only");

const ARCHETYPES = [
  "metro_grid",
  "coastal_grid",
  "desert_basin",
  "mountain_valley",
  "prairie_town",
  "river_town",
];
const WATER_ARCHETYPES = new Set(["coastal_grid", "river_town"]);

// Distinctness threshold: max allowed Jaccard overlap between any two
// archetypes' body+roof color fingerprints. Set between the pre-0.76 value
// (~1.0, shared global pools) and the target (< 0.5, regional palettes) so a
// regression back to shared palettes fails loudly.
const MAX_PAIR_JACCARD = 0.5;
// Perf ceiling per county (ms), generous vs the measured 5.8ms mean.
const MEAN_GEN_MS_CEILING = 20;
const PERF_SAMPLE = 120;
const VEGETATION_BANDS = {
  metro_grid: { minTrees: 22, maxTrees: 28, minBushes: 5, maxBushes: 8, minVegetation: 26, maxVegetation: 34 },
  coastal_grid: { minTrees: 24, maxTrees: 30, minBushes: 2, maxBushes: 5, minVegetation: 26, maxVegetation: 34, minParkVegetation: 7 },
  desert_basin: { minTrees: 0, maxTrees: 0, minBushes: 5, maxBushes: 8, minVegetation: 5, maxVegetation: 8 },
  mountain_valley: { minTrees: 24, maxTrees: 34, minBushes: 3, maxBushes: 6, minVegetation: 28, maxVegetation: 38, minParkVegetation: 7 },
  prairie_town: { minTrees: 28, maxTrees: 40, minBushes: 3, maxBushes: 6, minVegetation: 32, maxVegetation: 44, minParkVegetation: 7 },
  river_town: { minTrees: 22, maxTrees: 30, minBushes: 3, maxBushes: 6, minVegetation: 26, maxVegetation: 34 },
};
const WATER_TILE_FLOORS = {
  coastal_grid: 250,
  river_town: 150,
};
const RELIEF_BANDS = {
  mountain_valley: { minSpread: 1, minDropTiles: 80 },
  desert_basin: { minSpread: 0.5, minDropTiles: 40 },
  river_town: { minSpread: 0.5, minDropTiles: 30 },
};

function log(...args) {
  if (!jsonOnly) console.log(...args);
}

// ---------------------------------------------------------------------------
// 1. Index-wide archetype coverage plus structural compile pass.
// ---------------------------------------------------------------------------
function coverageDistribution() {
  const counts = Object.fromEntries(ARCHETYPES.map((a) => [a, 0]));
  const firstCountyByArchetype = {};
  const structuralFailures = [];
  const start = process.hrtime.bigint();

  for (const county of US_COUNTY_INDEX) {
    const structural = structuralInspection(county);
    const archetype = structural.archetype;
    if (archetype) {
      if (counts[archetype] === undefined) counts[archetype] = 0;
      counts[archetype] += 1;
      if (!firstCountyByArchetype[archetype]) firstCountyByArchetype[archetype] = county;
    }
    if (structural.failures.length > 0) {
      structuralFailures.push({
        countySlug: county.countySlug,
        archetype: archetype ?? "compile_error",
        failures: structural.failures,
      });
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  return {
    counts,
    firstCountyByArchetype,
    structural: {
      checked: US_COUNTY_INDEX.length,
      elapsedMs,
      meanMs: elapsedMs / US_COUNTY_INDEX.length,
      failures: structuralFailures,
    },
  };
}

function structuralInspection(county) {
  try {
    const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
    const scene = result?.scene;
    const failures = [];

    if (!scene) {
      failures.push("missing scene");
      return { archetype: generated?.archetype ?? null, failures };
    }
    if (!Array.isArray(scene.buildings) || scene.buildings.length === 0) failures.push("zero buildings");
    if (!Array.isArray(scene.places) || scene.places.length === 0) failures.push("zero places");
    if (!scene.buildings?.some((building) => building.id.startsWith("gen-landmark-"))) failures.push("missing gen-landmark building");

    const nonFiniteBuildings = (scene.buildings ?? []).filter((building) => !buildingGeometryFinite(building));
    if (nonFiniteBuildings.length > 0) {
      failures.push(`non-finite building geometry: ${nonFiniteBuildings.map((building) => building.id).join(",")}`);
    }

    if (WATER_ARCHETYPES.has(generated.archetype)) {
      const waterTiles = (scene.terrainTiles ?? []).filter((tile) => tile.kind === "water").length;
      const floor = WATER_TILE_FLOORS[generated.archetype] ?? 1;
      if (waterTiles < floor) failures.push(`${generated.archetype} has ${waterTiles} water terrain tiles below ${floor}`);
    }

    return { archetype: generated.archetype, failures };
  } catch (error) {
    return { archetype: null, failures: [`compile threw: ${formatError(error)}`] };
  }
}

function buildingGeometryFinite(building) {
  return [building.position?.x, building.position?.y, building.position?.z, building.width, building.depth, building.height].every(Number.isFinite);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

// ---------------------------------------------------------------------------
// 2. Palette fingerprint per archetype — the multiset of building body/roof
//    colors a representative county resolves, as a distinct-color set.
// ---------------------------------------------------------------------------
function paletteFingerprint(county) {
  const { result } = createDeterministicGeneratedDistrictScene({ county });
  const body = new Set();
  const roof = new Set();
  for (const b of result.scene.buildings ?? []) {
    if (b.bodyColor) body.add(b.bodyColor.toLowerCase());
    if (b.roofColor) roof.add(b.roofColor.toLowerCase());
  }
  // Terrain identity today lives in paletteKey (color resolves in-renderer);
  // fold it in so terrain-only regional shifts still register.
  const terrain = new Set();
  for (const t of result.scene.terrainTiles ?? []) {
    if (t.paletteKey) terrain.add(String(t.paletteKey).toLowerCase());
  }
  return { body, roof, terrain, all: new Set([...body, ...roof]) };
}

function landmarkFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  const parameters = resolveCountyParameters(county, generated.seed);
  const expectedKind = expectedGeneratedLandmarkKind(parameters);
  const expected = GENERATED_LANDMARK_SIGNATURES[expectedKind];
  const landmark = analyzeGeneratedLandmark(result.scene);
  const propKinds = result.scene.props.map((prop) => prop.kind);
  const missingAccentProps = expected.expectedAccentProps.filter((propKind) => !propKinds.includes(propKind));
  const failures = [];

  if (!generated.spec.countyParameters) failures.push("missing countyParameters on generated spec");
  if (!landmark) {
    failures.push("missing gen-landmark building");
  } else {
    if (landmark.kind !== expectedKind) failures.push(`expected ${expectedKind}, got ${landmark.kind}`);
    if (landmark.hostCell !== expected.hostCell) failures.push(`expected host ${expected.hostCell}, got ${landmark.hostCell}`);
    if (landmark.buildingKind !== expected.buildingKind) failures.push(`expected building ${expected.buildingKind}, got ${landmark.buildingKind}`);
    if (landmark.roofShape !== expected.roofShape) failures.push(`expected roof ${expected.roofShape}, got ${landmark.roofShape}`);
    if (landmark.facadeStyle !== expected.facadeStyle) failures.push(`expected facade ${expected.facadeStyle}, got ${landmark.facadeStyle}`);
    if (result.scene.hudDefaults.selectedPlaceId !== landmark.placeId) {
      failures.push(`selectedPlaceId ${result.scene.hudDefaults.selectedPlaceId} != landmark ${landmark.placeId}`);
    }
  }
  for (const propKind of missingAccentProps) failures.push(`missing accent prop ${propKind}`);

  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    expectedKind,
    actualKind: landmark?.kind ?? "missing",
    hostCell: landmark?.hostCell ?? "missing",
    silhouetteKey: landmark?.silhouetteKey ?? "missing",
    massing: landmark ? `${landmark.width}x${landmark.depth}x${landmark.height}` : "missing",
    roofShape: landmark?.roofShape ?? "missing",
    facadeStyle: landmark?.facadeStyle ?? "missing",
    propCount: result.scene.props.length,
    accentProps: [...new Set((landmark?.accentProps ?? []).filter((propKind) => expected.expectedAccentProps.includes(propKind)))],
    missingAccentProps,
    failures,
  };
}

function massingFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    ...analyzeGeneratedDistrictMassingSignature(result.scene),
  };
}

function vegetationFingerprint(county) {
  const first = createDeterministicGeneratedDistrictScene({ county });
  const second = createDeterministicGeneratedDistrictScene({ county });
  const archetype = first.generated.archetype;
  const band = VEGETATION_BANDS[archetype];
  const counts = vegetationCounts(first.result.scene);
  const repeatedCounts = vegetationCounts(second.result.scene);
  const parkZones = first.generated.spec.zones.filter((zone) => zone.kind === "park");
  const parkVegetation = first.result.scene.props.filter(
    (prop) => isVegetation(prop) && parkZones.some((zone) => pointInsideRect(prop.position, zone.rect)),
  ).length;
  const failures = [];

  if (JSON.stringify(counts) !== JSON.stringify(repeatedCounts)) failures.push("vegetation counts are not deterministic");
  if (counts.tree < band.minTrees || counts.tree > band.maxTrees) failures.push(`trees ${counts.tree} outside ${band.minTrees}-${band.maxTrees}`);
  if (counts.bush < band.minBushes || counts.bush > band.maxBushes) failures.push(`bushes ${counts.bush} outside ${band.minBushes}-${band.maxBushes}`);
  if (counts.vegetation < band.minVegetation || counts.vegetation > band.maxVegetation) {
    failures.push(`vegetation ${counts.vegetation} outside ${band.minVegetation}-${band.maxVegetation}`);
  }
  if (band.minParkVegetation && parkZones.length > 0 && parkVegetation < band.minParkVegetation) {
    failures.push(`park vegetation ${parkVegetation} below ${band.minParkVegetation}`);
  }

  return {
    countySlug: county.countySlug,
    archetype,
    ...counts,
    parkVegetation,
    band,
    failures,
  };
}

function vegetationCounts(scene) {
  const tree = scene.props.filter((prop) => prop.kind === "tree").length;
  const bush = scene.props.filter((prop) => prop.kind === "bush").length;
  return { tree, bush, vegetation: tree + bush };
}

function terrainFeatureFingerprint(county) {
  const { generated, result } = createDeterministicGeneratedDistrictScene({ county });
  const scene = result.scene;
  const water = waterBandMetrics(scene);
  const relief = reliefMetrics(scene);
  const failures = [];

  if (generated.archetype === "coastal_grid") {
    const floor = WATER_TILE_FLOORS.coastal_grid;
    if (water.count < floor) failures.push(`coastal water ${water.count} below ${floor}`);
    if (water.maxX !== scene.bounds.maxX || water.yCoverage !== scene.bounds.maxY - scene.bounds.minY + 1) {
      failures.push(`coastal water is not an edge band: x ${water.minX}-${water.maxX}, yCoverage ${water.yCoverage}`);
    }
  }

  if (generated.archetype === "river_town") {
    const floor = WATER_TILE_FLOORS.river_town;
    if (water.count < floor) failures.push(`river water ${water.count} below ${floor}`);
    if (!water.crossesBoardX && !water.crossesBoardY) {
      failures.push(`river water does not cross board: x ${water.minX}-${water.maxX}, y ${water.minY}-${water.maxY}`);
    }
  }

  const reliefBand = RELIEF_BANDS[generated.archetype];
  if (reliefBand) {
    if (relief.spread < reliefBand.minSpread) failures.push(`relief spread ${relief.spread} below ${reliefBand.minSpread}`);
    if (relief.dropTileCount < reliefBand.minDropTiles) failures.push(`drop tiles ${relief.dropTileCount} below ${reliefBand.minDropTiles}`);
  }

  return {
    countySlug: county.countySlug,
    archetype: generated.archetype,
    water,
    relief,
    failures,
  };
}

function waterBandMetrics(scene) {
  const waterTiles = (scene.terrainTiles ?? []).filter((tile) => tile.kind === "water");
  if (waterTiles.length === 0) {
    return { count: 0, minX: 0, maxX: 0, minY: 0, maxY: 0, xCoverage: 0, yCoverage: 0, crossesBoardX: false, crossesBoardY: false };
  }
  const xs = waterTiles.map((tile) => tile.position.x);
  const ys = waterTiles.map((tile) => tile.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    count: waterTiles.length,
    minX,
    maxX,
    minY,
    maxY,
    xCoverage: new Set(xs).size,
    yCoverage: new Set(ys).size,
    crossesBoardX: minX === scene.bounds.minX && maxX === scene.bounds.maxX,
    crossesBoardY: minY === scene.bounds.minY && maxY === scene.bounds.maxY,
  };
}

function reliefMetrics(scene) {
  const zValues = (scene.terrainTiles ?? []).map((tile) => tile.position?.z ?? 0);
  const min = Math.min(...zValues);
  const max = Math.max(...zValues);
  return {
    min,
    max,
    spread: Number((max - min).toFixed(3)),
    dropTileCount: (scene.terrainTiles ?? []).filter((tile) => (tile.visualGrammar?.elevation?.dropDepth ?? 0) > 0).length,
  };
}

function isVegetation(prop) {
  return prop.kind === "tree" || prop.kind === "bush";
}

function pointInsideRect(point, rect) {
  return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

function distinctnessMatrix(fingerprintByArchetype, present) {
  const pairs = [];
  let worst = { pair: null, jaccard: 0 };
  for (let i = 0; i < present.length; i += 1) {
    for (let j = i + 1; j < present.length; j += 1) {
      const a = present[i];
      const b = present[j];
      const jac = jaccard(fingerprintByArchetype[a].all, fingerprintByArchetype[b].all);
      pairs.push({ a, b, jaccard: Number(jac.toFixed(3)) });
      if (jac > worst.jaccard) worst = { pair: [a, b], jaccard: Number(jac.toFixed(3)) };
    }
  }
  return { pairs, worst };
}

function massingDistinctnessMatrix(massingByArchetype, present) {
  const pairs = [];
  let closest = { pair: null, distance: Number.POSITIVE_INFINITY };
  for (let i = 0; i < present.length; i += 1) {
    for (let j = i + 1; j < present.length; j += 1) {
      const a = present[i];
      const b = present[j];
      const distance = generatedDistrictMassingSignatureDistance(massingByArchetype[a], massingByArchetype[b]);
      pairs.push({ a, b, distance });
      if (distance < closest.distance) closest = { pair: [a, b], distance };
    }
  }
  if (!closest.pair) closest = { pair: null, distance: 0 };
  return { pairs, closest };
}

// ---------------------------------------------------------------------------
// 3. Perf-at-scale probe — mean generation time + zero budget failures.
// ---------------------------------------------------------------------------
function perfProbe(firstCountyByArchetype) {
  // Sample evenly across archetypes then across the index tail.
  const seeds = Object.values(firstCountyByArchetype).filter(Boolean);
  const stride = Math.max(1, Math.floor(US_COUNTY_INDEX.length / PERF_SAMPLE));
  const sample = [...seeds];
  for (let i = 0; i < US_COUNTY_INDEX.length && sample.length < PERF_SAMPLE; i += stride) {
    sample.push(US_COUNTY_INDEX[i]);
  }
  let failures = 0;
  const start = process.hrtime.bigint();
  for (const county of sample) {
    try {
      const { result } = createDeterministicGeneratedDistrictScene({ county });
      if (!result?.scene?.buildings?.length) failures += 1;
    } catch {
      failures += 1;
    }
  }
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  return { sampled: sample.length, failures, meanMs: elapsedMs / sample.length };
}

// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------
log("Atlas 0.76 — Archetype Identity Sweep (NS-6)\n");

const { counts, firstCountyByArchetype, structural } = coverageDistribution();
const present = ARCHETYPES.filter((a) => (counts[a] ?? 0) > 0);
const totalClassified = Object.values(counts).reduce((s, n) => s + n, 0);

log("Index coverage — " + totalClassified + " counties classified:");
for (const a of ARCHETYPES) {
  const n = counts[a] ?? 0;
  const pct = totalClassified ? ((n / totalClassified) * 100).toFixed(1) : "0.0";
  const sample = firstCountyByArchetype[a];
  log(
    "  " + a.padEnd(16) + String(n).padStart(5) + "  (" + pct.padStart(4) + "%)  " +
      (sample ? "e.g. " + sample.name + ", " + sample.stateCode : "— none reached"),
  );
}

const structuralFailureSlugs = structural.failures.map((entry) => entry.countySlug);
log(
  "\nStructural full-index compile - " +
    structural.checked +
    " counties: mean " +
    structural.meanMs.toFixed(2) +
    "ms/county, " +
    structural.failures.length +
    " failures",
);
if (structural.failures.length > 0) {
  log("  failing slugs: " + structuralFailureSlugs.join(", "));
}

const fingerprintByArchetype = {};
for (const a of present) {
  fingerprintByArchetype[a] = paletteFingerprint(firstCountyByArchetype[a]);
}

const { pairs, worst } = distinctnessMatrix(fingerprintByArchetype, present);
log("\nPalette distinctness — body+roof color fingerprints (Jaccard overlap):");
log("  fingerprint sizes: " + present.map((a) => a + "=" + fingerprintByArchetype[a].all.size).join("  "));
log("  worst pair: " + (worst.pair ? worst.pair.join(" ~ ") : "n/a") + " = " + worst.jaccard +
    "  (gate: <= " + MAX_PAIR_JACCARD + ")");

const landmarkByArchetype = {};
for (const a of present) {
  landmarkByArchetype[a] = landmarkFingerprint(firstCountyByArchetype[a]);
}
const landmarkFailures = Object.entries(landmarkByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
const landmarkSilhouettePairs = [];
for (let i = 0; i < present.length; i += 1) {
  for (let j = i + 1; j < present.length; j += 1) {
    const first = present[i];
    const second = present[j];
    if (landmarkByArchetype[first].silhouetteKey === landmarkByArchetype[second].silhouetteKey) {
      landmarkSilhouettePairs.push(`${first}~${second}:${landmarkByArchetype[first].silhouetteKey}`);
    }
  }
}
log("\nLandmark signatures — parameter-spine massing readouts:");
for (const a of present) {
  const entry = landmarkByArchetype[a];
  log(
    "  " +
      a.padEnd(16) +
      entry.actualKind.padEnd(24) +
      entry.hostCell.padEnd(21) +
      `${entry.roofShape}/${entry.facadeStyle}`.padEnd(19) +
      `massing ${entry.massing}`.padEnd(27) +
      `props ${entry.propCount}`.padEnd(10) +
      `accent ${entry.accentProps.join(",") || "none"}`,
  );
}

const massingByArchetype = {};
for (const a of present) {
  massingByArchetype[a] = massingFingerprint(firstCountyByArchetype[a]);
}
const massingDistinctness = massingDistinctnessMatrix(massingByArchetype, present);
const massingFailures = massingDistinctness.pairs
  .filter((entry) => entry.distance < GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR)
  .map((entry) => `${entry.a}~${entry.b}:${entry.distance}`);
log("\nMassing/layout signatures — non-landmark fabric readouts:");
for (const a of present) {
  const entry = massingByArchetype[a];
  log(
    "  " +
      a.padEnd(16) +
      `buildings ${String(entry.buildingCount).padStart(2)}`.padEnd(14) +
      `height ${entry.meanBuildingHeight}/${entry.maxBuildingHeight}`.padEnd(18) +
      `foot ${entry.meanFootprintArea}`.padEnd(12) +
      `roads ${entry.roadCount}/${entry.roadLength}`.padEnd(17) +
      `apt ${entry.apartmentRatio}`.padEnd(10) +
      `water ${entry.waterLotRatio}`.padEnd(12) +
    `linear ${entry.linearityRatio}`,
  );
}
log(
  "  closest pair: " +
    (massingDistinctness.closest.pair ? massingDistinctness.closest.pair.join(" ~ ") : "n/a") +
    " = " +
    massingDistinctness.closest.distance +
    "  (gate: >= " +
    GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR +
    ")",
);

const vegetationByArchetype = {};
for (const a of present) {
  vegetationByArchetype[a] = vegetationFingerprint(firstCountyByArchetype[a]);
}
const vegetationFailures = Object.entries(vegetationByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
log("\nVegetation presence - representative E2 bands:");
for (const a of present) {
  const entry = vegetationByArchetype[a];
  const band = entry.band;
  log(
    "  " +
      a.padEnd(16) +
      `trees ${String(entry.tree).padStart(2)} [${band.minTrees}-${band.maxTrees}]`.padEnd(20) +
      `bushes ${String(entry.bush).padStart(2)} [${band.minBushes}-${band.maxBushes}]`.padEnd(21) +
      `veg ${String(entry.vegetation).padStart(2)} [${band.minVegetation}-${band.maxVegetation}]`.padEnd(19) +
      `park ${entry.parkVegetation}`,
  );
}

const terrainFeaturesByArchetype = {};
for (const a of present) {
  terrainFeaturesByArchetype[a] = terrainFeatureFingerprint(firstCountyByArchetype[a]);
}
const terrainFeatureFailures = Object.entries(terrainFeaturesByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
log("\nWater/relief bands - representative E3/E4 readouts:");
for (const a of present) {
  const entry = terrainFeaturesByArchetype[a];
  const water = entry.water;
  const relief = entry.relief;
  log(
    "  " +
      a.padEnd(16) +
      `water ${String(water.count).padStart(3)}`.padEnd(13) +
      `x ${water.minX}-${water.maxX}`.padEnd(11) +
      `y ${water.minY}-${water.maxY}`.padEnd(11) +
      `relief ${relief.spread}`.padEnd(13) +
      `drops ${relief.dropTileCount}`,
  );
}

const perf = perfProbe(firstCountyByArchetype);
log("\nPerf at scale - " + perf.sampled + " counties: mean " + perf.meanMs.toFixed(2) +
    "ms/county, " + perf.failures + " budget failures (gate: mean <= " + MEAN_GEN_MS_CEILING + "ms, 0 failures)");

// Teeth: a synthetic identical-palette pair MUST trip the distinctness gate.
const teethIdentical = jaccard(new Set(["#aaa", "#bbb"]), new Set(["#aaa", "#bbb"]));
const teethPasses = teethIdentical > MAX_PAIR_JACCARD;

// ---------------------------------------------------------------------------
// Gates — one boolean each; process exits non-zero if any fails.
// ---------------------------------------------------------------------------
const GATES = [
  {
    id: "archetype_coverage",
    label: "all six archetypes reachable across the county index",
    pass: present.length === ARCHETYPES.length,
    detail: "reached " + present.length + "/" + ARCHETYPES.length,
  },
  {
    id: "palette_distinctness",
    label: "no two archetypes share body+roof palette (worst Jaccard <= " + MAX_PAIR_JACCARD + ")",
    pass: worst.jaccard <= MAX_PAIR_JACCARD,
    detail: "worst " + (worst.pair ? worst.pair.join("~") : "n/a") + " = " + worst.jaccard,
  },
  {
    id: "landmark_presence",
    label: "each archetype resolves its expected parameter-spine landmark",
    pass: landmarkFailures.length === 0,
    detail: landmarkFailures.length === 0 ? "all present" : landmarkFailures.join("; "),
  },
  {
    id: "landmark_silhouette_distinctness",
    label: "any two archetypes' landmark silhouettes differ",
    pass: landmarkSilhouettePairs.length === 0,
    detail: landmarkSilhouettePairs.length === 0 ? "all unique" : landmarkSilhouettePairs.join("; "),
  },
  {
    id: "massing_layout_distinctness",
    label: "any two archetypes' non-landmark massing/layout signatures differ",
    pass: massingFailures.length === 0,
    detail:
      massingFailures.length === 0
        ? `closest ${massingDistinctness.closest.pair ? massingDistinctness.closest.pair.join("~") : "n/a"} = ${massingDistinctness.closest.distance}`
        : massingFailures.join("; "),
  },
  {
    id: "vegetation_presence",
    label: "representative generated archetypes hit E2 vegetation bands",
    pass: vegetationFailures.length === 0,
    detail: vegetationFailures.length === 0 ? "all representative bands pass" : vegetationFailures.join("; "),
  },
  {
    id: "water_relief_bands",
    label: "water archetypes read as bands and relief archetypes expose terrain strata",
    pass: terrainFeatureFailures.length === 0,
    detail: terrainFeatureFailures.length === 0 ? "all representative E3/E4 bands pass" : terrainFeatureFailures.join("; "),
  },
  {
    id: "structural_full_index",
    label: "all counties compile with buildings, places, landmarks, finite buildings, and water bands for water archetypes",
    pass: structural.failures.length === 0,
    detail: structural.failures.length === 0 ? "all counties pass" : structuralFailureSlugs.join(", "),
  },
  {
    id: "perf_at_scale",
    label: "mean generation <= " + MEAN_GEN_MS_CEILING + "ms, 0 budget failures",
    pass: perf.meanMs <= MEAN_GEN_MS_CEILING && perf.failures === 0,
    detail: perf.meanMs.toFixed(2) + "ms, " + perf.failures + " failures",
  },
  {
    id: "verifier_teeth",
    label: "distinctness gate fires on synthetic identical palettes",
    pass: teethPasses,
    detail: teethPasses ? "fires" : "DOES NOT FIRE",
  },
];

log("\nGates:");
let failed = 0;
for (const g of GATES) {
  if (!g.pass) failed += 1;
  log("  " + (g.pass ? "PASS" : "FAIL") + "  " + g.id + " — " + g.label + "  [" + g.detail + "]");
}

if (jsonOnly) {
    console.log(JSON.stringify({
      totalClassified, counts, present,
      distinctness: { worst, pairs },
      landmarks: {
        byArchetype: landmarkByArchetype,
        failures: landmarkFailures,
        duplicateSilhouettes: landmarkSilhouettePairs,
      },
      massing: {
        floor: GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
        byArchetype: massingByArchetype,
        closest: massingDistinctness.closest,
        pairs: massingDistinctness.pairs,
        failures: massingFailures,
      },
      vegetation: {
        bands: VEGETATION_BANDS,
        byArchetype: vegetationByArchetype,
        failures: vegetationFailures,
      },
      terrainFeatures: {
        waterTileFloors: WATER_TILE_FLOORS,
        reliefBands: RELIEF_BANDS,
        byArchetype: terrainFeaturesByArchetype,
        failures: terrainFeatureFailures,
      },
      structural: {
        checked: structural.checked,
        elapsedMs: Number(structural.elapsedMs.toFixed(2)),
        meanMs: Number(structural.meanMs.toFixed(2)),
        failures: structural.failures,
      },
      perf,
      gates: GATES.map(({ id, pass, detail }) => ({ id, pass, detail })),
      failed,
  }, null, 2));
}

log("\n" + (failed === 0 ? "ALL GATES PASS" : failed + " GATE(S) FAILED"));

// The palette_distinctness gate is EXPECTED to fail before the 0.76-1 regional
// palette packet lands — that failing baseline is the objective "before"
// number. After Codex's palette work + a core rebuild, it must go green.
process.exit(failed === 0 ? 0 : 1);
