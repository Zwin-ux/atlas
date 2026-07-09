#!/usr/bin/env node
import process from "node:process";
import {
  GENERATED_LANDMARK_SIGNATURES,
  US_COUNTY_INDEX,
  analyzeGeneratedLandmark,
  createDeterministicGeneratedDistrictSpec,
  createDeterministicGeneratedDistrictScene,
  expectedGeneratedLandmarkKind,
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

// Distinctness threshold: max allowed Jaccard overlap between any two
// archetypes' body+roof color fingerprints. Set between the pre-0.76 value
// (~1.0, shared global pools) and the target (< 0.5, regional palettes) so a
// regression back to shared palettes fails loudly.
const MAX_PAIR_JACCARD = 0.5;
// Perf ceiling per county (ms), generous vs the measured 5.8ms mean.
const MEAN_GEN_MS_CEILING = 20;
const PERF_SAMPLE = 120;

function log(...args) {
  if (!jsonOnly) console.log(...args);
}

// ---------------------------------------------------------------------------
// 1. Index-wide archetype coverage — classify every county.
// ---------------------------------------------------------------------------
function archetypeForCounty(county) {
  // createDeterministicGeneratedDistrictSpec is the sanctioned path that also
  // computes the seed + archetype; use it so we test the real selection.
  return createDeterministicGeneratedDistrictSpec({ county }).archetype;
}

function coverageDistribution() {
  const counts = Object.fromEntries(ARCHETYPES.map((a) => [a, 0]));
  const firstCountyByArchetype = {};
  for (const county of US_COUNTY_INDEX) {
    const archetype = archetypeForCounty(county);
    if (counts[archetype] === undefined) counts[archetype] = 0;
    counts[archetype] += 1;
    if (!firstCountyByArchetype[archetype]) firstCountyByArchetype[archetype] = county;
  }
  return { counts, firstCountyByArchetype };
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

const { counts, firstCountyByArchetype } = coverageDistribution();
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

const perf = perfProbe(firstCountyByArchetype);
log("\nPerf at scale — " + perf.sampled + " counties: mean " + perf.meanMs.toFixed(2) +
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
