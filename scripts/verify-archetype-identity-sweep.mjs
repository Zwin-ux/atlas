#!/usr/bin/env node
import process from "node:process";
import {
  ARCHETYPES,
  ATTACHMENT_PRESENCE_BANDS,
  COASTAL_OPENING_WATER_TILE_FLOOR,
  DEFAULT_MATERIAL_PROFILE,
  DEFAULT_ROOF_PROFILE,
  E5_FILL_BANDS,
  GENERATED_ATTACHMENT_KINDS,
  GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
  GENERATED_PROFILE_RATE_FLOOR,
  LAYOUT_GRAMMAR_PATTERNS,
  MAX_PAIR_JACCARD,
  MEAN_GEN_MS_CEILING,
  MOUNTAIN_OPENING_DROP_TILE_FLOOR,
  P12_PLACE_IDENTITY_SAMPLE_COUNTIES,
  RELIEF_BANDS,
  TROPICAL_LUSH_TERRAIN_PALETTE,
  TROPICAL_PALM_RATE_FLOOR,
  VEGETATION_BANDS,
  WATER_TILE_FLOORS,
  attachmentPresenceFingerprint,
  buildVisualScoreReport,
  anchorTruthReadouts,
  coastalOpeningWaterReadouts,
  coverageDistribution,
  createDeterministicGeneratedDistrictScene,
  distinctnessMatrix,
  landmarkFingerprint,
  layoutGrammarFingerprint,
  massingDistinctnessMatrix,
  massingFingerprint,
  mountainOpeningReliefReadouts,
  openBlockFillFingerprint,
  paletteFingerprint,
  perfProbe,
  placeIdentitySweep,
  profileGrammarFingerprint,
  representativeCountiesByArchetype,
  resolveCountyParameters,
  terrainFeatureFingerprint,
  tierHistogram,
  tropicalTruthReadouts,
  vegetationFingerprint,
  jaccard,
} from "./lib/visual-score.mjs";

const jsonOnly = process.argv.includes("--json-only");

function log(...args) {
  if (!jsonOnly) console.log(...args);
}
// ---------------------------------------------------------------------------
// Run.
// ---------------------------------------------------------------------------
log("Atlas 0.77-2 - Archetype Identity Sweep (NS-6 + Census density tiers + regional truth visuals)\n");

const { counts, firstCountyByArchetype, structural } = coverageDistribution();
const present = ARCHETYPES.filter((a) => (counts[a] ?? 0) > 0);
const totalClassified = Object.values(counts).reduce((s, n) => s + n, 0);
const representativeCountyByArchetype = representativeCountiesByArchetype();
const tierHistogramReadout = tierHistogram();
const anchorReadouts = anchorTruthReadouts();
const anchorFailures = anchorReadouts.flatMap((entry) => entry.failures.map((failure) => `${entry.countySlug}: ${failure}`));
const placeIdentity = placeIdentitySweep();

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

log("\nUrbanization tier histogram - full index:");
for (const [tier, count] of Object.entries(tierHistogramReadout.counts)) {
  const band = tierHistogramReadout.bands[tier];
  log("  " + tier.padEnd(11) + String(count).padStart(5) + "  (gate: " + band.min + "-" + band.max + ")");
}

log("\n0.77-1 anchor truths - Census density routing:");
for (const entry of anchorReadouts) {
  log(
    "  " +
      entry.countySlug.padEnd(18) +
      entry.tier.padEnd(11) +
      entry.archetype.padEnd(16) +
      `pop ${entry.population2024}`.padEnd(14) +
      `area ${entry.landAreaSqMi}`.padEnd(13) +
      `density ${entry.densityPerSqMi}`.padEnd(16) +
      `buildings ${entry.buildingCount}`.padEnd(14) +
      `roads ${entry.roadKinds.join(",")}`,
  );
}

log("\nP1.2 honest place identity - full-index deterministic label sweep:");
log(
  "  checked " +
    placeIdentity.checked +
    " counties; failures " +
    placeIdentity.failures.length +
    "; banned words " +
    placeIdentity.bannedWords.join(", "),
);
for (const countySlug of P12_PLACE_IDENTITY_SAMPLE_COUNTIES) {
  const sample = placeIdentity.samples[countySlug];
  if (!sample) continue;
  log(
    "  " +
      countySlug.padEnd(18) +
      sample.archetype.padEnd(16) +
      sample.tier.padEnd(11) +
      `water ${sample.waterFactBand}`.padEnd(18) +
      `district ${sample.districtLabel}`.padEnd(24) +
      `labels ${sample.labels.slice(0, 4).join(" | ")}`,
  );
}

log("\nRepresentative counties for archetype visual bands:");
for (const a of present) {
  const sample = representativeCountyByArchetype[a];
  const { generated } = createDeterministicGeneratedDistrictScene({ county: sample });
  const parameters = resolveCountyParameters(sample, generated.seed);
  log("  " + a.padEnd(16) + sample.countySlug.padEnd(34) + parameters.urbanizationTier);
}

const fingerprintByArchetype = {};
for (const a of present) {
  fingerprintByArchetype[a] = paletteFingerprint(representativeCountyByArchetype[a]);
}

const { pairs, worst } = distinctnessMatrix(fingerprintByArchetype, present);
log("\nPalette distinctness — body+roof color fingerprints (Jaccard overlap):");
log("  fingerprint sizes: " + present.map((a) => a + "=" + fingerprintByArchetype[a].all.size).join("  "));
log("  worst pair: " + (worst.pair ? worst.pair.join(" ~ ") : "n/a") + " = " + worst.jaccard +
    "  (gate: <= " + MAX_PAIR_JACCARD + ")");

const landmarkByArchetype = {};
for (const a of present) {
  landmarkByArchetype[a] = landmarkFingerprint(representativeCountyByArchetype[a]);
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

const profileGrammarByArchetype = {};
for (const a of present) {
  profileGrammarByArchetype[a] = profileGrammarFingerprint(representativeCountyByArchetype[a]);
}
const profileGrammarFailures = Object.entries(profileGrammarByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
log("\nMaterial/roof grammar - representative E6/E7 profile readouts:");
for (const a of present) {
  const entry = profileGrammarByArchetype[a];
  log(
    "  " +
      a.padEnd(16) +
      `material ${entry.materialRichCount}/${entry.buildingCount} ${entry.materialRate}`.padEnd(23) +
      `roof ${entry.roofRichCount}/${entry.buildingCount} ${entry.roofRate}`.padEnd(19) +
      `landmark ${entry.landmark ? `${entry.landmark.kind}:${entry.landmark.buildingKind}/${entry.landmark.facadeStyle}/${entry.landmark.roofProfile}` : "missing"}`,
  );
}

const massingByArchetype = {};
for (const a of present) {
  massingByArchetype[a] = massingFingerprint(representativeCountyByArchetype[a]);
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

const layoutGrammarByArchetype = {};
for (const a of present) {
  layoutGrammarByArchetype[a] = layoutGrammarFingerprint(representativeCountyByArchetype[a]);
}
const layoutGrammarFailures = Object.entries(layoutGrammarByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
log("\nOrganic layout grammar - representative W4.4 road seeds:");
for (const a of present) {
  const entry = layoutGrammarByArchetype[a];
  log(
    "  " +
      a.padEnd(16) +
      entry.pattern.padEnd(23) +
      `roads ${entry.roadCount}`.padEnd(11) +
      `axis ${entry.axisRoads}`.padEnd(9) +
      `nonAxis ${entry.nonAxisRoads}`.padEnd(13) +
      `bridges ${entry.bridgeRoads}/${entry.bridgeCrosswalks}`.padEnd(14) +
      `shore ${entry.shoreMainSegments}`.padEnd(10) +
      `highway ${entry.highwaySegments}`.padEnd(12) +
      `curve ${entry.creekCurveSegments}`,
  );
}

const vegetationByArchetype = {};
for (const a of present) {
  vegetationByArchetype[a] = vegetationFingerprint(representativeCountyByArchetype[a]);
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
  terrainFeaturesByArchetype[a] = terrainFeatureFingerprint(representativeCountyByArchetype[a]);
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

const coastalOpeningWater = coastalOpeningWaterReadouts();
const coastalOpeningWaterFailures = coastalOpeningWater.flatMap((entry) =>
  entry.failures.map((failure) => `${entry.countySlug}: ${failure}`),
);
log("\n0.77-2 coastal opening water - desktop first-frame anchors:");
for (const entry of coastalOpeningWater) {
  log(
    "  " +
      entry.countySlug.padEnd(18) +
      entry.archetype.padEnd(16) +
      entry.tier.padEnd(11) +
      `water ${String(entry.frame.waterTiles).padStart(3)} [${COASTAL_OPENING_WATER_TILE_FLOOR}+]`.padEnd(18) +
      `buildings ${entry.frame.buildings}`,
  );
}

const tropicalTruth = tropicalTruthReadouts();
const tropicalTruthFailures = tropicalTruth.flatMap((entry) =>
  entry.failures.map((failure) => `${entry.countySlug}: ${failure}`),
);
log("\n0.77-2 tropical truth - climate, ground, palms:");
for (const entry of tropicalTruth) {
  log(
    "  " +
      entry.countySlug.padEnd(24) +
      entry.archetype.padEnd(16) +
      entry.latitudeBand.padEnd(14) +
      entry.aridity.padEnd(9) +
      `palms ${entry.palmCount}/${entry.treeCount} ${entry.palmRate}`.padEnd(20) +
      `terrain ${entry.terrainPaletteKeys.join(",")}`,
  );
}

const mountainOpeningRelief = mountainOpeningReliefReadouts();
const mountainOpeningReliefFailures = mountainOpeningRelief.flatMap((entry) =>
  entry.failures.map((failure) => `${entry.countySlug}: ${failure}`),
);
log("\n0.77-2 mountain opening relief - desktop first-frame anchors:");
for (const entry of mountainOpeningRelief) {
  log(
    "  " +
      entry.countySlug.padEnd(18) +
      entry.archetype.padEnd(16) +
      `spread ${entry.frame.elevationSpread}`.padEnd(13) +
      `drops ${String(entry.frame.dropTileCount).padStart(2)} [${MOUNTAIN_OPENING_DROP_TILE_FLOOR}+]`.padEnd(17) +
      `buildings ${entry.frame.buildings}`,
  );
}

const openBlockFillByArchetype = {};
for (const a of present) {
  openBlockFillByArchetype[a] = openBlockFillFingerprint(representativeCountyByArchetype[a]);
}
const openBlockFillFailures = Object.entries(openBlockFillByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
log("\nOpen-block fills - representative E5 bands:");
for (const a of present) {
  const entry = openBlockFillByArchetype[a];
  const band = entry.band;
  log(
    "  " +
      a.padEnd(16) +
      `coverage ${entry.fillCoverageRatio} [${band.minCoverage}-1]`.padEnd(24) +
      `tiles ${String(entry.fillTileCount).padStart(3)}/${String(entry.openGroundTiles).padEnd(3)}`.padEnd(16) +
      `kinds ${entry.fillKinds.join(",")}`,
  );
}

const attachmentPresenceByArchetype = {};
for (const a of present) {
  attachmentPresenceByArchetype[a] = attachmentPresenceFingerprint(representativeCountyByArchetype[a]);
}
const attachmentPresenceFailures = Object.entries(attachmentPresenceByArchetype).flatMap(([archetype, entry]) =>
  entry.failures.map((failure) => `${archetype}: ${failure}`),
);
log("\nBuilding attachments - representative W4.1 bands:");
for (const a of present) {
  const entry = attachmentPresenceByArchetype[a];
  const band = entry.band;
  log(
    "  " +
      a.padEnd(16) +
      `parents ${String(entry.attachedParentCount).padStart(2)}/${String(entry.eligibleParentCount).padEnd(2)}`.padEnd(18) +
      `rate ${entry.parentRate} [${band.minRate}-${band.maxRate}]`.padEnd(23) +
      `attachments ${String(entry.attachmentCount).padStart(2)}`.padEnd(17) +
      `kinds ${Object.entries(entry.countsByKind).filter(([, count]) => count > 0).map(([kind, count]) => `${kind}:${count}`).join(",")}`,
  );
}

const perf = perfProbe(firstCountyByArchetype);
log("\nPerf at scale - " + perf.sampled + " counties: mean " + perf.meanMs.toFixed(2) +
    "ms/county, " + perf.failures + " budget failures (gate: mean <= " + MEAN_GEN_MS_CEILING + "ms, 0 failures)");

const visualScoreReport = buildVisualScoreReport();
log("\n0.79-1 visual score - full-index per-county quality floor:");
log(
  "  counties " +
    visualScoreReport.countyCount +
    "/" +
    visualScoreReport.expectedCountyCount +
    ", median " +
    visualScoreReport.distribution.median +
    " (floor " +
    visualScoreReport.floors.median +
    "), min " +
    visualScoreReport.distribution.min +
    " (hard floor " +
    visualScoreReport.floors.hard +
    "), worst " +
    (visualScoreReport.worst50[0] ? `${visualScoreReport.worst50[0].countySlug}:${visualScoreReport.worst50[0].score}` : "none"),
);

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
    id: "urbanization_tier_histogram",
    label: "full-index Census density tiers stay inside deliberate 0.77-1 bands",
    pass: tierHistogramReadout.failures.length === 0,
    detail: tierHistogramReadout.failures.length === 0 ? JSON.stringify(tierHistogramReadout.counts) : tierHistogramReadout.failures.join("; "),
  },
  {
    id: "urbanization_anchor_truths",
    label: "0.77-1 anchor counties route to reality-backed density tiers and legal archetypes",
    pass: anchorFailures.length === 0,
    detail: anchorFailures.length === 0 ? "all anchors pass" : anchorFailures.join("; "),
  },
  {
    id: "p12_place_identity_labels",
    label: "P1.2 generated place labels are deterministic full-index and free of banned jargon",
    pass: placeIdentity.failures.length === 0,
    detail: placeIdentity.failures.length === 0 ? `${placeIdentity.checked} counties pass` : placeIdentity.failures.slice(0, 12).join("; "),
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
    id: "material_roof_profile_routing",
    label: "generated buildings route non-default material/roof profiles from authored grammar (rate >= " + GENERATED_PROFILE_RATE_FLOOR + ")",
    pass: profileGrammarFailures.length === 0,
    detail: profileGrammarFailures.length === 0 ? "all representative E6/E7 profile bands pass" : profileGrammarFailures.join("; "),
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
    id: "organic_layout_grammar",
    label: "W4.4 generated road seeds follow deterministic per-archetype organic layout grammar",
    pass: layoutGrammarFailures.length === 0,
    detail: layoutGrammarFailures.length === 0 ? "all representative W4.4 layout grammars pass" : layoutGrammarFailures.join("; "),
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
    id: "coastal_opening_water_visibility",
    label: "coastal generated desktop opening frames include visible sea tiles (water >= " + COASTAL_OPENING_WATER_TILE_FLOOR + ")",
    pass: coastalOpeningWaterFailures.length === 0,
    detail:
      coastalOpeningWaterFailures.length === 0
        ? coastalOpeningWater.map((entry) => `${entry.countySlug}:${entry.frame.waterTiles}`).join(", ")
        : coastalOpeningWaterFailures.join("; "),
  },
  {
    id: "tropical_humid_visual_truth",
    label: "HI/PR/south-FL tropical-humid generated scenes use lush ground, palms, and no dry washes",
    pass: tropicalTruthFailures.length === 0,
    detail:
      tropicalTruthFailures.length === 0
        ? tropicalTruth.map((entry) => `${entry.countySlug}:palms ${entry.palmRate}`).join(", ")
        : tropicalTruthFailures.join("; "),
  },
  {
    id: "mountain_opening_relief_visibility",
    label: "mountain-valley desktop opening frames show stacked cliff-course drops",
    pass: mountainOpeningReliefFailures.length === 0,
    detail:
      mountainOpeningReliefFailures.length === 0
        ? mountainOpeningRelief.map((entry) => `${entry.countySlug}:drops ${entry.frame.dropTileCount}`).join(", ")
        : mountainOpeningReliefFailures.join("; "),
  },
  {
    id: "open_block_fill_coverage",
    label: "representative generated archetypes fill open non-building blocks with E5 terrain treatments",
    pass: openBlockFillFailures.length === 0,
    detail: openBlockFillFailures.length === 0 ? "all representative E5 fill bands pass" : openBlockFillFailures.join("; "),
  },
  {
    id: "building_attachment_presence",
    label: "representative generated buildings carry W4.1 attachments within archetype bands",
    pass: attachmentPresenceFailures.length === 0,
    detail: attachmentPresenceFailures.length === 0 ? "all representative W4.1 attachment bands pass" : attachmentPresenceFailures.join("; "),
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
    id: "visual_score_floor_0791",
    label: "0.79-1 all-county visual scores meet median and hard floors",
    pass: visualScoreReport.gates.pass,
    detail:
      "count " +
      visualScoreReport.countyCount +
      "/" +
      visualScoreReport.expectedCountyCount +
      "; median " +
      visualScoreReport.distribution.median +
      " >= " +
      visualScoreReport.floors.median +
      "; min " +
      visualScoreReport.distribution.min +
      " >= " +
      visualScoreReport.floors.hard,
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
      urbanization: {
        histogram: tierHistogramReadout.counts,
        bands: tierHistogramReadout.bands,
        failures: tierHistogramReadout.failures,
        anchors: anchorReadouts,
        anchorFailures,
        representatives: Object.fromEntries(
          Object.entries(representativeCountyByArchetype).map(([archetype, county]) => [archetype, county.countySlug]),
        ),
      },
      placeIdentityP12: placeIdentity,
      distinctness: { worst, pairs },
      landmarks: {
        byArchetype: landmarkByArchetype,
        failures: landmarkFailures,
        duplicateSilhouettes: landmarkSilhouettePairs,
      },
      profileGrammar: {
        floor: GENERATED_PROFILE_RATE_FLOOR,
        defaults: {
          material: DEFAULT_MATERIAL_PROFILE,
          roof: DEFAULT_ROOF_PROFILE,
        },
        byArchetype: profileGrammarByArchetype,
        failures: profileGrammarFailures,
      },
      massing: {
        floor: GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR,
        byArchetype: massingByArchetype,
        closest: massingDistinctness.closest,
        pairs: massingDistinctness.pairs,
        failures: massingFailures,
      },
      organicLayoutGrammar: {
        patterns: LAYOUT_GRAMMAR_PATTERNS,
        byArchetype: layoutGrammarByArchetype,
        failures: layoutGrammarFailures,
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
      regionalTruth0772: {
        coastalOpeningWater: {
          floor: COASTAL_OPENING_WATER_TILE_FLOOR,
          anchors: coastalOpeningWater,
          failures: coastalOpeningWaterFailures,
        },
        tropicalTruth: {
          palmRateFloor: TROPICAL_PALM_RATE_FLOOR,
          lushTerrainPalette: TROPICAL_LUSH_TERRAIN_PALETTE,
          anchors: tropicalTruth,
          failures: tropicalTruthFailures,
        },
        mountainOpeningRelief: {
          dropTileFloor: MOUNTAIN_OPENING_DROP_TILE_FLOOR,
          anchors: mountainOpeningRelief,
          failures: mountainOpeningReliefFailures,
        },
      },
      openBlockFills: {
        bands: E5_FILL_BANDS,
        byArchetype: openBlockFillByArchetype,
        failures: openBlockFillFailures,
      },
      buildingAttachments: {
        bands: ATTACHMENT_PRESENCE_BANDS,
        kinds: GENERATED_ATTACHMENT_KINDS,
        byArchetype: attachmentPresenceByArchetype,
        failures: attachmentPresenceFailures,
      },
      structural: {
        checked: structural.checked,
        elapsedMs: Number(structural.elapsedMs.toFixed(2)),
        meanMs: Number(structural.meanMs.toFixed(2)),
        failures: structural.failures,
      },
      perf,
      visualScore0791: {
        countyCount: visualScoreReport.countyCount,
        expectedCountyCount: visualScoreReport.expectedCountyCount,
        weights: visualScoreReport.weights,
        floors: visualScoreReport.floors,
        distribution: visualScoreReport.distribution,
        gates: visualScoreReport.gates,
        worst50: visualScoreReport.worst50,
      },
      gates: GATES.map(({ id, pass, detail }) => ({ id, pass, detail })),
      failed,
  }, null, 2));
}

log("\n" + (failed === 0 ? "ALL GATES PASS" : failed + " GATE(S) FAILED"));

// The palette_distinctness gate is EXPECTED to fail before the 0.76-1 regional
// palette packet lands — that failing baseline is the objective "before"
// number. After Codex's palette work + a core rebuild, it must go green.
process.exit(failed === 0 ? 0 : 1);
