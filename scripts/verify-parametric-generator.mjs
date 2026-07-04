#!/usr/bin/env node
import process from "node:process";
import {
  analyzeCityWorldScene,
  generateParametricCityWorldScene,
  exampleParametricDistrictSpec,
} from "../packages/core/dist/index.js";

const jsonOnly = process.argv.includes("--json-only");

// Prove the parametric generator seam: a compact provider-free spec produces a
// credible, fully enriched CityWorldScene through the shared enrichment
// decorators. We assert the same structural floors a hand-authored playable
// scene must clear.
const spec = exampleParametricDistrictSpec();
const { scene, stats } = generateParametricCityWorldScene(spec);
const diagnostics = analyzeCityWorldScene(scene, "playable");

const m = diagnostics.metrics;
const checks = [
  ["buildings present", stats.buildings >= 12],
  ["lots present", stats.lots >= 14],
  ["roads present", stats.roads >= 4],
  ["terrain massing coverage >= 0.30", m.terrainMassingCoverageRatio >= 0.3],
  ["object family coverage >= 0.8", m.objectFamilyCoverageRatio >= 0.8],
  ["building/lot contact >= 0.85", m.buildingLotContactRatio >= 0.85],
  ["first-viewport composition >= 0.55", m.firstViewportCompositionScore >= 0.55],
  ["home clone pressure <= 0.35", m.homeClonePressure <= 0.35],
  ["every building carries visual grammar", scene.buildings.every((b) => b.visualGrammar?.objectFamily && b.visualGrammar?.materialProfile && b.visualGrammar?.roofProfile)],
  ["every building carries object kit", scene.buildings.every((b) => b.objectKit?.prefabFamily)],
  ["every lot carries parcel grammar", scene.lots.every((l) => l.visualGrammar?.parcelComposition && l.visualGrammar?.contactProfile)],
  ["every terrain tile carries grammar", scene.terrainTiles.every((t) => t.visualGrammar?.terrainComposition && t.visualGrammar?.contactProfile)],
  ["no provider tokens / no hard blockers", diagnostics.hardBlockers.length === 0],
];

const failures = checks.filter(([, ok]) => !ok).map(([label]) => label);
const passed = failures.length === 0;

const report = {
  ok: passed,
  sceneId: scene.id,
  stats,
  metrics: {
    firstViewportCompositionScore: m.firstViewportCompositionScore,
    terrainMassingCoverageRatio: m.terrainMassingCoverageRatio,
    objectFamilyCoverageRatio: m.objectFamilyCoverageRatio,
    buildingLotContactRatio: m.buildingLotContactRatio,
    lotRoadContactRatio: m.lotRoadContactRatio,
    objectSignatureCoverageRatio: m.objectSignatureCoverageRatio,
    homeClonePressure: m.homeClonePressure,
    emptyBoardRatio: m.emptyBoardRatio,
  },
  objectFamilies: diagnostics.distributions.objectFamilies,
  hardBlockers: diagnostics.hardBlockers,
  warnings: diagnostics.warnings.map((w) => w.code),
  failures,
};

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Parametric generator: ${passed ? "OK" : "FAIL"}`);
  console.log(`  scene ${scene.id}`);
  console.log(`  stats`, stats);
  console.log(`  metrics`, report.metrics);
  console.log(`  object families`, report.objectFamilies);
  if (report.warnings.length) console.log(`  diagnostic warnings`, report.warnings);
  for (const [label, ok] of checks) console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

process.exit(passed ? 0 : 1);
