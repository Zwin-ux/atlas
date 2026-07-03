#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import {
  analyzeCityWorldScene,
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const args = process.argv.slice(2);
const jsonOnly = args.includes("--json-only");
const outDir = getOptionValue(args, "--out");

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/debug-city-world-engine.mjs [--json-only] [--out <dir>]

Builds a structural diagnostics report for the Atlas city-world engine. This is
not a screenshot taste gate. It checks scene grammar, density, contact,
fallback, no-label readiness, hidden-draft safety, and provider isolation.`);
  process.exit(0);
}

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--out") {
    index += 1;
    continue;
  }
  if (!["--json-only"].includes(arg)) {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const anaheimAnchorPackPath = resolve("data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve("data/district_place_anchor_packs/ontario-anchors.json");
const riversideScene = compileCityWorldScene(riversideDemoVoxelScene);
const orangeShellScene = compileCountyShellCityWorldScene({
  countySlug: "orange-ca",
  countyName: "Orange County",
  stateCode: "CA",
  coverage: {
    countySlug: "orange-ca",
    coverageTier: "L1_COUNTY_SHELL",
    coverageLabel: "County shell",
    coverageMessage: "Orange County is indexed, but not playable yet.",
    playable: false,
  },
});
const anaheimAnchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
const ontarioAnchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath);
const anaheimDraftScene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimAnchorPack });
const ontarioDraftScene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: ontarioAnchorPack });

const sceneReports = [
  analyzeCityWorldScene(riversideScene, "playable"),
  analyzeCityWorldScene(orangeShellScene, "shell"),
  analyzeCityWorldScene(anaheimDraftScene, "hidden_draft"),
  analyzeCityWorldScene(ontarioDraftScene, "hidden_draft"),
];
const unsupportedReport = {
  type: "cityWorldUnsupportedDiagnostics",
  countySlug: "made-up-ca",
  coverageTier: "L0_UNSUPPORTED",
  sceneCompiled: false,
  hardBlockers: [],
  message: "Unsupported counties intentionally produce no CityWorldScene and no canvas.",
};
const sourceBoundary = inspectSourceBoundary();
const allHardBlockers = [
  ...sceneReports.flatMap((report) => report.hardBlockers.map((issue) => `${report.sceneId}: ${issue.code} - ${issue.message}`)),
  ...sourceBoundary.blockers,
];
const result = {
  ok: allHardBlockers.length === 0,
  update: "prealpha-0.6f-engine-diagnostics",
  generatedAt: new Date().toISOString(),
  scenarios: {
    riversidePlayable: sceneReports[0],
    orangeShell: sceneReports[1],
    unsupported: unsupportedReport,
    anaheimHiddenDraft: sceneReports[2],
    ontarioHiddenDraft: sceneReports[3],
  },
  sourceBoundary,
  summary: summarize(sceneReports),
  hardBlockers: allHardBlockers,
};

if (outDir) {
  const resolvedOutDir = resolve(outDir);
  mkdirSync(resolvedOutDir, { recursive: true });
  writeFileSync(join(resolvedOutDir, "city-world-engine-diagnostics.json"), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(join(resolvedOutDir, "city-world-engine-diagnostics.md"), renderMarkdown(result));
}

if (jsonOnly) {
  console.log(JSON.stringify(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (!result.ok) {
  process.exitCode = 1;
}

function summarize(reports) {
  const playable = reports[0];
  const hiddenDrafts = reports.filter((report) => report.scenario === "hidden_draft");
  return {
    weakestPlayableAxis: playable?.nextWeakestAxis ?? "density",
    warningCount: reports.reduce((sum, report) => sum + report.warnings.length, 0),
    hardBlockerCount: reports.reduce((sum, report) => sum + report.hardBlockers.length, 0),
    riverside: playable
      ? {
          terrainMassingCoverageRatio: playable.metrics.terrainMassingCoverageRatio,
          emptyBoardRatio: playable.metrics.emptyBoardRatio,
          buildingLotContactRatio: playable.metrics.buildingLotContactRatio,
          lotRoadContactRatio: playable.metrics.lotRoadContactRatio,
          homeClonePressure: playable.metrics.homeClonePressure,
          firstViewportCompositionScore: playable.metrics.firstViewportCompositionScore,
          chunkEdgeReadabilityFloorScore: playable.metrics.chunkEdgeReadabilityFloorScore,
          viewportComposition: playable.metrics.viewportComposition,
          nextWeakestAxis: playable.nextWeakestAxis,
        }
      : null,
    hiddenDrafts: hiddenDrafts.map((report) => ({
      sceneId: report.sceneId,
      noLabelPrimaryAnchorCount: report.metrics.noLabelPrimaryAnchorCount,
      noLabelTargetFamilyCoverageRatio: report.metrics.noLabelTargetFamilyCoverageRatio,
      noLabelAnchorSeparationScore: report.metrics.noLabelAnchorSeparationScore,
      noLabelRecognitionProxyScore: report.metrics.noLabelRecognitionProxyScore,
      objectFamilyCoverageRatio: report.metrics.objectFamilyCoverageRatio,
      nextWeakestAxis: report.nextWeakestAxis,
    })),
  };
}

function renderMarkdown(result) {
  const lines = [
    "# City World Engine Diagnostics",
    "",
    `Update: ${result.update}`,
    `Status: ${result.ok ? "PASS" : "BLOCK"}`,
    `Generated: ${result.generatedAt}`,
    "",
    "## Riverside Playable",
    renderSceneSummary(result.scenarios.riversidePlayable),
    "",
    "## Orange Shell",
    renderSceneSummary(result.scenarios.orangeShell),
    "",
    "## Unsupported",
    `- ${result.scenarios.unsupported.countySlug}: no scene compiled (${result.scenarios.unsupported.coverageTier})`,
    "",
    "## Hidden Drafts",
    renderSceneSummary(result.scenarios.anaheimHiddenDraft),
    renderSceneSummary(result.scenarios.ontarioHiddenDraft),
    "",
    "## Source Boundary",
    `- renderer/provider blockers: ${result.sourceBoundary.blockers.length}`,
    `- checked files: ${result.sourceBoundary.checkedFiles.length}`,
    "",
    "## Hard Blockers",
    ...(result.hardBlockers.length ? result.hardBlockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderSceneSummary(report) {
  return [
    `- ${report.sceneId}: ${report.hardBlockers.length === 0 ? "no hard blockers" : `${report.hardBlockers.length} blockers`}`,
    `  - terrain massing: ${formatPercent(report.metrics.terrainMassingCoverageRatio)}`,
    `  - empty board: ${formatPercent(report.metrics.emptyBoardRatio)}`,
    `  - building-lot contact: ${formatPercent(report.metrics.buildingLotContactRatio)}`,
    `  - lot-road contact: ${formatPercent(report.metrics.lotRoadContactRatio)}`,
    `  - clone pressure: ${formatPercent(report.metrics.homeClonePressure)}`,
    `  - first viewport composition: ${formatPercent(report.metrics.firstViewportCompositionScore)}`,
    `  - chunk-edge readability floor: ${formatPercent(report.metrics.chunkEdgeReadabilityFloorScore)}`,
    report.scenario === "hidden_draft" ? `  - no-label recognition proxy: ${formatPercent(report.metrics.noLabelRecognitionProxyScore)}` : "",
    `  - next weakest axis: ${report.nextWeakestAxis}`,
  ].filter(Boolean).join("\n");
}

function inspectSourceBoundary() {
  const roots = ["web/src"];
  const forbidden = [
    /@googlemaps\//i,
    /google\.maps/i,
    /maps\.googleapis\.com/i,
    /places\.googleapis\.com/i,
    /\bGoogleMapsAdapter\b/,
    /\bGeoDataAdapter\b/,
    /@atlas\/geo\b/,
    /packages\/geo/i,
  ];
  const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
  const checkedFiles = [];
  const blockers = [];

  for (const root of roots) {
    for (const file of walk(root, extensions)) {
      checkedFiles.push(normalize(file));
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        if (pattern.test(source)) {
          blockers.push(`${normalize(file)} contains provider boundary token ${pattern.toString()}`);
        }
      }
    }
  }

  return {
    rendererProviderImportsBlocked: blockers.length === 0,
    checkedRoots: roots,
    checkedFiles,
    blockers,
  };
}

function* walk(dir, extensions) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      yield* walk(path, extensions);
      continue;
    }
    const extension = path.slice(path.lastIndexOf("."));
    if (extensions.has(extension)) {
      yield path;
    }
  }
}

function normalize(path) {
  return relative(process.cwd(), path).replaceAll("\\", "/");
}

function formatPercent(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function getOptionValue(values, name) {
  const index = values.indexOf(name);
  if (index === -1) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}
