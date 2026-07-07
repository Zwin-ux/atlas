#!/usr/bin/env node
import process from "node:process";
import {
  analyzeCityWorldScene,
  analyzeGeneratedDistrictParity,
  compileCityWorldScene,
  exampleParametricDistrictSpec,
  generateParametricCityWorldScene,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

// 0.58E Generated District Parity + Numeric Proof.
//
// The 0.57E screenshot findings (toy commercial rows, empty pads/rings,
// lower-frame sparsity, roof/eave footprint drift, apartment facade/window
// drift) each get a NUMERIC gate here, computed at the generator seam from
// the generated scene's shared footprint bounds — no screenshot OCR. The
// verifier also proves its own teeth: for every known failure mode it
// degrades a healthy scene the way the old generator failed and asserts the
// matching gate FIRES. A verifier that cannot fail is not proof.

const jsonOnly = process.argv.includes("--json-only");

// ---------------------------------------------------------------------------
// Numeric gates. Thresholds are the reviewable contract of this verifier:
// each is set between the current healthy value and the pre-0.57E failure
// value, so regressions fail loudly instead of drifting.
// ---------------------------------------------------------------------------
const GATES = [
  {
    id: "empty_pads",
    label: "no buildable lot pad is an empty ring (emptyPadCount == 0)",
    finding: "empty lot rings / foundation pads with no building",
    check: (parity) => parity.counts.emptyPadCount === 0,
    value: (parity) => parity.counts.emptyPadCount,
  },
  {
    id: "pad_fill_floor",
    label: "weakest pad footprint fill >= 0.40",
    finding: "tiny building on an oversized pad reads as an empty ring",
    check: (parity) => parity.padMetrics.padFootprintFillFloor >= 0.4,
    value: (parity) => parity.padMetrics.padFootprintFillFloor,
  },
  {
    id: "pad_fill_mean",
    label: "mean pad footprint fill >= 0.60",
    finding: "parcels read as aprons, not building lots",
    check: (parity) => parity.padMetrics.padFootprintFillMean >= 0.6,
    value: (parity) => parity.padMetrics.padFootprintFillMean,
  },
  {
    id: "roof_registration",
    label: "every building registers inside its lot pad (roofOverhangCount == 0)",
    finding: "roof/eave plane bleeds past the shared footprint bounds",
    check: (parity) => parity.registrationMetrics.roofOverhangCount === 0,
    value: (parity) => parity.registrationMetrics.roofOverhangCount,
  },
  {
    id: "facade_bounds",
    label: "apartment window columns clear the eave above the wall base (clearance floor >= 1)",
    finding: "apartment facade/window columns float off the wall face",
    check: (parity) =>
      parity.facadeMetrics.apartmentColumnUnsafeCount === 0 &&
      parity.facadeMetrics.apartmentColumnClearanceFloor >= 1,
    value: (parity) => parity.facadeMetrics.apartmentColumnClearanceFloor,
  },
  {
    id: "commerce_strip_routing",
    label: "every generated shop routes through the commerce_strip grammar (stripStoreRatio == 1)",
    finding: "commercial rows bypass the strongest commerce/strip grammar",
    check: (parity) => parity.commerceMetrics.stripStoreRatio === 1,
    value: (parity) => parity.commerceMetrics.stripStoreRatio,
  },
  {
    id: "commerce_toy_massing",
    label: "no toy commerce slabs (min strip width >= 2.4 tiles, bay floor >= 4)",
    finding: "toy commercial rows: small saturated slabs instead of storefront strips",
    check: (parity) =>
      parity.commerceMetrics.toyCommerceCount === 0 &&
      parity.commerceMetrics.commerceStripMinWidth >= 2.4 &&
      parity.commerceMetrics.commerceBayFloor >= 4,
    value: (parity) => parity.commerceMetrics.commerceStripMinWidth,
  },
  {
    id: "residential_roof_safety",
    label: "generated homes use roof-safe proportions (unsafeRoofCount == 0)",
    finding: "tiny/tall houses create skewed gable or hip roof reads",
    check: (parity) => parity.residentialRoofMetrics.unsafeRoofCount === 0,
    value: (parity) => parity.residentialRoofMetrics.unsafeRoofCount,
  },
  {
    id: "desktop_lower_frame",
    label: "desktop lower-frame occupancy >= 0.18 and balance >= 0.9",
    finding: "lower-frame sparsity: bottom of the first viewport is empty field",
    check: (parity) =>
      (parity.frameDensity.desktop?.lowerFrameOccupancyRatio ?? 0) >= 0.18 &&
      (parity.frameDensity.desktop?.lowerFrameBalance ?? 0) >= 0.9,
    value: (parity) => parity.frameDensity.desktop?.lowerFrameOccupancyRatio ?? 0,
  },
  {
    id: "mobile_lower_frame",
    label: "mobile lower-frame occupancy >= 0.10 and balance >= 0.6",
    finding: "lower-frame sparsity on the 390x844 first viewport",
    check: (parity) =>
      (parity.frameDensity.mobile?.lowerFrameOccupancyRatio ?? 0) >= 0.1 &&
      (parity.frameDensity.mobile?.lowerFrameBalance ?? 0) >= 0.6,
    value: (parity) => parity.frameDensity.mobile?.lowerFrameOccupancyRatio ?? 0,
  },
];

// Scene-level floors from the shared diagnostics (same API the curated scene
// must clear) — parity means the generated district passes the same bar.
const SCENE_FLOORS = [
  ["first-viewport composition >= 0.60", (m) => m.firstViewportCompositionScore >= 0.6, (m) => m.firstViewportCompositionScore],
  ["empty board ratio <= 0.10", (m) => m.emptyBoardRatio <= 0.1, (m) => m.emptyBoardRatio],
  ["home clone pressure <= 0.30", (m) => m.homeClonePressure <= 0.3, (m) => m.homeClonePressure],
  ["building/lot contact >= 0.95", (m) => m.buildingLotContactRatio >= 0.95, (m) => m.buildingLotContactRatio],
];

// ---------------------------------------------------------------------------
// 1) Gate the healthy generated district.
// ---------------------------------------------------------------------------
const { scene, stats } = generateParametricCityWorldScene(exampleParametricDistrictSpec());
const parity = analyzeGeneratedDistrictParity(scene);
const diagnostics = analyzeCityWorldScene(scene, "playable");

const gateResults = GATES.map((gate) => ({
  id: gate.id,
  label: gate.label,
  finding: gate.finding,
  value: gate.value(parity),
  passed: gate.check(parity),
}));
const floorResults = SCENE_FLOORS.map(([label, check, value]) => ({
  label,
  value: value(diagnostics.metrics),
  passed: check(diagnostics.metrics),
}));
const hardBlockerFree = diagnostics.hardBlockers.length === 0;

// ---------------------------------------------------------------------------
// 2) Prove the verifier can FAIL: degrade the healthy scene the way the old
// generator failed and assert the matching gate fires. structuredClone keeps
// each degradation independent.
// ---------------------------------------------------------------------------
function degradeEmptyPads(input) {
  // Strip buildings off six screen-lower buildable lots -> empty rings.
  const degraded = structuredClone(input);
  const soft = new Set(["park", "waterfront"]);
  const lowerLots = degraded.lots
    .filter((lot) => !soft.has(lot.kind))
    .sort((a, b) => b.position.x + b.position.y - (a.position.x + a.position.y))
    .slice(0, 6);
  const victims = new Set(lowerLots.map((lot) => lot.id));
  degraded.buildings = degraded.buildings.filter(
    (building) =>
      !degraded.lots.some(
        (lot) =>
          victims.has(lot.id) &&
          Math.abs(building.position.x - lot.position.x) <= lot.width / 2 &&
          Math.abs(building.position.y - lot.position.y) <= lot.depth / 2,
      ),
  );
  return degraded;
}

function degradeToyCommerce(input) {
  // Shrink every strip back to the pre-0.57E toy slab footprint.
  const degraded = structuredClone(input);
  for (const building of degraded.buildings) {
    if (building.kind === "shop") {
      building.width = 1.3;
      building.depth = 0.9;
    }
  }
  return degraded;
}

function degradeRoofRegistration(input) {
  // Push one building's footprint past its pad -> roof plane overhang.
  const degraded = structuredClone(input);
  const pad = analyzeGeneratedDistrictParity(degraded).pads.find((entry) => entry.buildingId);
  const building = degraded.buildings.find((entry) => entry.id === pad.buildingId);
  const lot = degraded.lots.find((entry) => entry.id === pad.lotId);
  building.width = lot.width + 1.4;
  return degraded;
}

function degradeResidentialRoofSafety(input) {
  const degraded = structuredClone(input);
  const cottage = degraded.buildings.find((building) => building.kind === "home" && building.facadeStyle === "cottage");
  if (cottage) {
    cottage.roofShape = "hip";
    cottage.height = 1.72;
    cottage.width = 1.34;
    cottage.depth = 1.08;
  }
  return degraded;
}

function degradeApartmentFacade(input) {
  // Deep flat court: eave drop swallows the wall -> columns float off face.
  const degraded = structuredClone(input);
  for (const building of degraded.buildings) {
    if (building.kind === "apartment") {
      building.depth = building.height * 2.4;
    }
  }
  return degraded;
}

function degradeLowerFrame(input) {
  // Empty the screen-lower half of the district -> pre-0.57E bottom sparsity.
  const degraded = structuredClone(input);
  const mid = (degraded.bounds.minX + degraded.bounds.maxX + degraded.bounds.minY + degraded.bounds.maxY) / 2;
  degraded.buildings = degraded.buildings.filter((building) => building.position.x + building.position.y < mid);
  return degraded;
}

const DETECTION_CASES = [
  { gateId: "empty_pads", degrade: degradeEmptyPads },
  { gateId: "commerce_toy_massing", degrade: degradeToyCommerce },
  { gateId: "roof_registration", degrade: degradeRoofRegistration },
  { gateId: "residential_roof_safety", degrade: degradeResidentialRoofSafety },
  { gateId: "facade_bounds", degrade: degradeApartmentFacade },
  { gateId: "mobile_lower_frame", degrade: degradeLowerFrame },
];

const detectionProof = DETECTION_CASES.map(({ gateId, degrade }) => {
  const gate = GATES.find((entry) => entry.id === gateId);
  const degradedParity = analyzeGeneratedDistrictParity(degrade(scene));
  return { gateId, fires: !gate.check(degradedParity), degradedValue: gate.value(degradedParity) };
});
const detectionProven = detectionProof.every((entry) => entry.fires);

// ---------------------------------------------------------------------------
// 3) Curated Riverside reference readout (NOT gated — curated pads/overhangs
// are authored). This is the parity target the generated numbers sit next to.
// ---------------------------------------------------------------------------
const curated = analyzeGeneratedDistrictParity(compileCityWorldScene(riversideDemoVoxelScene));

const failures = [
  ...gateResults.filter((gate) => !gate.passed).map((gate) => `gate:${gate.id}`),
  ...floorResults.filter((floor) => !floor.passed).map((floor) => `floor:${floor.label}`),
  ...(hardBlockerFree ? [] : ["scene hard blockers present"]),
  ...(detectionProven ? [] : ["detection proof failed: a degraded scene did not trip its gate"]),
];
const passed = failures.length === 0;

const report = {
  ok: passed,
  sceneId: scene.id,
  stats,
  gates: gateResults,
  sceneFloors: floorResults,
  hardBlockers: diagnostics.hardBlockers,
  detectionProof,
  generated: {
    counts: parity.counts,
    padMetrics: parity.padMetrics,
    registrationMetrics: parity.registrationMetrics,
    facadeMetrics: parity.facadeMetrics,
    commerceMetrics: parity.commerceMetrics,
    residentialRoofMetrics: parity.residentialRoofMetrics,
    frameDensity: parity.frameDensity,
  },
  curatedReference: {
    sceneId: curated.sceneId,
    padMetrics: curated.padMetrics,
    commerceMetrics: curated.commerceMetrics,
    frameDensity: curated.frameDensity,
  },
  failures,
};

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Generated district parity: ${passed ? "OK" : "FAIL"}`);
  console.log(`  scene ${scene.id}`);
  for (const gate of gateResults) console.log(`  ${gate.passed ? "PASS" : "FAIL"}  ${gate.label} (${gate.value})`);
  for (const floor of floorResults) console.log(`  ${floor.passed ? "PASS" : "FAIL"}  ${floor.label} (${floor.value})`);
  console.log(`  ${hardBlockerFree ? "PASS" : "FAIL"}  no scene hard blockers`);
  for (const proof of detectionProof) console.log(`  ${proof.fires ? "PASS" : "FAIL"}  detection: degraded scene trips gate ${proof.gateId} (${proof.degradedValue})`);
  console.log(`  curated Riverside reference: pad fill mean ${curated.padMetrics.padFootprintFillMean}, desktop lower frame ${curated.frameDensity.desktop?.lowerFrameOccupancyRatio ?? "n/a"}`);
  if (!passed) console.log(`  failures: ${failures.join(", ")}`);
}

process.exit(passed ? 0 : 1);
