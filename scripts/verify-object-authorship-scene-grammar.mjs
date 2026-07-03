import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const files = {
  types: join(root, "packages/core/src/voxel/cityWorldTypes.ts"),
  compiler: join(root, "packages/core/src/voxel/cityWorldCompiler.ts"),
  renderer: join(root, "web/src/CityWorldRenderer.tsx"),
  tests: join(root, "packages/core/test/city-world-compiler.test.ts"),
  switcher: join(root, "web/src/CountySwitcher.tsx"),
  coverageView: join(root, "web/src/CountyCoverageView.tsx"),
  faceContrastVerifier: join(root, "scripts/verify-face-orientation-source-contrast.mjs"),
  civicVenueVerifier: join(root, "scripts/verify-civic-venue-object-kit-contract.mjs"),
};

const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")]));
const blockers = [];

function requireText(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) blockers.push(message);
}

function rejectText(fileKey, needle, message) {
  if (source[fileKey].includes(needle)) blockers.push(message);
}

for (const token of ["CityWorldObjectFamily", "CityWorldClusterRole", "CityWorldNoLabelPriority", "objectFamily?:", "clusterRole?:", "noLabelPriority?:"]) {
  requireText("types", token, `CityWorld types must expose object-authorship token ${token}.`);
}

for (const family of ["residential_kit", "commerce_strip", "civic_landmark", "lowrise_cluster", "service_block", "venue_anchor", "transit_anchor"]) {
  requireText("types", family, `CityWorld object family ${family} must be typed.`);
  requireText("compiler", family, `Compiler must assign object family ${family}.`);
}

for (const role of ["anchor", "support", "fabric", "edge"]) {
  requireText("types", role, `CityWorld cluster role ${role} must be typed.`);
  requireText("compiler", role, `Compiler must assign cluster role ${role}.`);
}

for (const priority of ["none", "supporting", "primary_anchor"]) {
  requireText("types", priority, `CityWorld no-label priority ${priority} must be typed.`);
  requireText("compiler", priority, `Compiler must assign no-label priority ${priority}.`);
}

for (const helper of ["buildingObjectFamily", "buildingClusterRole", "buildingNoLabelPriority"]) {
  requireText("compiler", helper, `Compiler must keep ${helper} as the object-authorship assignment seam.`);
}

for (const anchor of [
  "anaheim-convention-center",
  "artic-transit-center",
  "angel-stadium",
  "platinum-triangle",
  "ontario-international-airport",
  "ontario-mills-commercial-anchor",
]) {
  requireText("compiler", anchor, `Compiler must profile hidden draft anchor ${anchor}.`);
}

for (const rendererHook of [
  "drawObjectAuthorshipDetails",
  "drawSpriteObjectAuthorshipBase",
  "drawPublicRiversideObjectAuthorshipPass",
  "drawPublicCivicLandmarkSilhouette",
  "drawPublicResidentialSilhouette",
  "drawAuthoredResidentialKitRhythm",
  "drawAuthoredCommerceStripRhythm",
  "drawAuthoredCivicLandmarkMass",
  "drawAuthoredLowriseClusterRhythm",
  "drawAuthoredServiceBlockRhythm",
  "drawHiddenDraftAnchorAuthorship",
]) {
  requireText("renderer", rendererHook, `Renderer must keep ${rendererHook}.`);
}

for (const testNeedle of [
  "attaches object-authorship grammar to public Riverside buildings",
  "faceOrientationCoverageRatio",
  "roofSideSeparationRatio",
  "facadeContrastCoverageRatio",
  "objectSignatureCoverageRatio",
  "civicVenueObjectKitScore",
  "weakestCivicVenueStressCell",
  "draft-building-anaheim-convention-center-exhibit-hall-west",
  "draft-building-artic-transit-center-terminal-shed",
  "draft-building-angel-stadium-venue-bowl-west",
  "draft-building-platinum-triangle-area-lowrise-courtyard",
  "draft-building-ontario-international-airport-terminal-hall",
]) {
  requireText("tests", testNeedle, `Core tests must protect ${testNeedle}.`);
}

for (const verifierNeedle of [
  "prealpha-0.15e-civic-venue-object-kit-contract",
  "eastvale-core-civic-landmark",
  "angel-stadium-venue-anchor",
  "public_civic_landmark",
  "hidden_venue_anchor",
]) {
  requireText("civicVenueVerifier", verifierNeedle, `Civic/venue object-kit verifier must protect ${verifierNeedle}.`);
}

for (const verifierNeedle of [
  "prealpha-0.14e-face-orientation-source-art-contrast-gate",
  "weakestObjectFamily",
  "weakestHiddenAnchor",
  "hiddenAnchorContrastScore",
]) {
  requireText("faceContrastVerifier", verifierNeedle, `Face/source-art contrast verifier must protect ${verifierNeedle}.`);
}

for (const loudColor of ["#e05d45", "#73a7d6", "#d95f45", "#4f92b8", "#6da76f", "#e0bd4e", "#895c9e", "#77b8d5"]) {
  rejectText("compiler", loudColor, `Compiler must not reintroduce old loud/default color token ${loudColor}.`);
}

for (const providerNeedle of ["google.maps", "@atlas/geo", "GoogleMaps", "GeoDataAdapter"]) {
  rejectText("renderer", providerNeedle, `Renderer must not import or reference provider boundary ${providerNeedle}.`);
}

for (const publicPromotionNeedle of ["anaheim-candidate", "ontario-candidate", "Anaheim / Playable", "Ontario / Playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose hidden candidate ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose hidden candidate ${publicPromotionNeedle}.`);
}

function formatMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

function requireMetricAtLeast(metricBlockers, value, floor, label) {
  if (!Number.isFinite(value) || value < floor) {
    metricBlockers.push(`${label} must be >= ${floor}; got ${formatMetric(value)}.`);
  }
}

function requireMetricAtMost(metricBlockers, value, ceiling, label) {
  if (!Number.isFinite(value) || value > ceiling) {
    metricBlockers.push(`${label} must be <= ${ceiling}; got ${formatMetric(value)}.`);
  }
}

async function evaluateRiversideObjectAuthorshipMetrics() {
  const metricBlockers = [];
  let metricSummary = null;

  try {
    const { analyzeCityWorldScene, compileCityWorldScene, riversideDemoVoxelScene } = await import("../packages/core/dist/index.js");
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const report = analyzeCityWorldScene(scene, "playable");
    const desktop = report.metrics.viewportComposition.desktop;
    const mobile = report.metrics.viewportComposition.mobile;
    const residentialDetail = report.metrics.viewportComposition.residential_detail;

    if (report.hardBlockers.length > 0) {
      metricBlockers.push(`Riverside diagnostics must have zero hard blockers; got ${report.hardBlockers.join(", ")}.`);
    }

    requireMetricAtLeast(metricBlockers, report.metrics.terrainMassingCoverageRatio, 0.72, "terrainMassingCoverageRatio");
    requireMetricAtMost(metricBlockers, report.metrics.emptyBoardRatio, 0.18, "emptyBoardRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.firstViewportCompositionScore, 0.75, "firstViewportCompositionScore");
    requireMetricAtLeast(metricBlockers, report.metrics.chunkEdgeReadabilityFloorScore, 0.56, "chunkEdgeReadabilityFloorScore");
    requireMetricAtLeast(metricBlockers, report.metrics.buildingLotContactRatio, 0.98, "buildingLotContactRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.lotRoadContactRatio, 0.78, "lotRoadContactRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.objectFamilyCoverageRatio, 1, "objectFamilyCoverageRatio");
    requireMetricAtMost(metricBlockers, report.metrics.homeClonePressure, 0.2, "homeClonePressure");
    requireMetricAtLeast(metricBlockers, report.metrics.homeVariantCount, 8, "homeVariantCount");
    requireMetricAtLeast(metricBlockers, report.metrics.faceOrientationCoverageRatio, 0.9, "faceOrientationCoverageRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.roofSideSeparationRatio, 0.85, "roofSideSeparationRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.facadeContrastCoverageRatio, 0.75, "facadeContrastCoverageRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.objectSignatureCoverageRatio, 0.7, "objectSignatureCoverageRatio");
    requireMetricAtLeast(metricBlockers, report.metrics.civicVenueObjectKitScore, 0.9, "civicVenueObjectKitScore");
    requireMetricAtLeast(metricBlockers, desktop?.objectFamilyCount, 4, "desktop objectFamilyCount");
    requireMetricAtLeast(metricBlockers, mobile?.objectFamilyCount, 5, "mobile objectFamilyCount");
    requireMetricAtLeast(metricBlockers, residentialDetail?.objectFamilyCount, 1, "residential_detail objectFamilyCount");

    metricSummary = {
      update: report.update,
      terrainMassingCoverageRatio: formatMetric(report.metrics.terrainMassingCoverageRatio),
      emptyBoardRatio: formatMetric(report.metrics.emptyBoardRatio),
      firstViewportCompositionScore: formatMetric(report.metrics.firstViewportCompositionScore),
      chunkEdgeReadabilityFloorScore: formatMetric(report.metrics.chunkEdgeReadabilityFloorScore),
      buildingLotContactRatio: formatMetric(report.metrics.buildingLotContactRatio),
      lotRoadContactRatio: formatMetric(report.metrics.lotRoadContactRatio),
      objectFamilyCoverageRatio: formatMetric(report.metrics.objectFamilyCoverageRatio),
      homeClonePressure: formatMetric(report.metrics.homeClonePressure),
      homeVariantCount: report.metrics.homeVariantCount,
      faceOrientationCoverageRatio: formatMetric(report.metrics.faceOrientationCoverageRatio),
      roofSideSeparationRatio: formatMetric(report.metrics.roofSideSeparationRatio),
      facadeContrastCoverageRatio: formatMetric(report.metrics.facadeContrastCoverageRatio),
      objectSignatureCoverageRatio: formatMetric(report.metrics.objectSignatureCoverageRatio),
      weakestObjectFamily: report.metrics.weakestObjectFamily,
      civicVenueObjectKitScore: formatMetric(report.metrics.civicVenueObjectKitScore),
      weakestCivicVenueStressCell: report.metrics.weakestCivicVenueStressCell,
      viewportObjectFamilyCounts: {
        desktop: desktop?.objectFamilyCount ?? null,
        mobile: mobile?.objectFamilyCount ?? null,
        residential_detail: residentialDetail?.objectFamilyCount ?? null,
      },
    };
  } catch (error) {
    metricBlockers.push(`Unable to evaluate built Riverside object-authorship diagnostics: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { metricBlockers, metricSummary };
}

const { metricBlockers, metricSummary } = await evaluateRiversideObjectAuthorshipMetrics();
blockers.push(...metricBlockers);

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.11e-public-object-authorship",
  checkedFiles: files,
  metricSummary,
  blockers,
};

if (!jsonOnly) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result));
}

if (!result.ok) {
  process.exitCode = 1;
}
