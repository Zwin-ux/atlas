import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const UPDATE = "postalpha-0.34e-public-object-kit-prefab-palette-contract";
const blockers = [];
const warnings = [];

const files = {
  types: "packages/core/src/voxel/cityWorldTypes.ts",
  objectKit: "packages/core/src/voxel/cityWorldObjectKit.ts",
  compiler: "packages/core/src/voxel/cityWorldCompiler.ts",
  tests: "packages/core/test/city-world-compiler.test.ts",
  renderer: "web/src/CityWorldRenderer.tsx",
  switcher: "web/src/CountySwitcher.tsx",
  coverageView: "web/src/CountyCoverageView.tsx",
  persistenceVerifier: "scripts/verify-scene-packet-db-persistence-plan.mjs",
};

const source = {};
for (const [key, path] of Object.entries(files)) {
  const absolute = join(root, path);
  source[key] = existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
  if (!source[key]) blockers.push(`Missing required file ${path}.`);
}

function requireText(fileKey, needle, message) {
  if (!source[fileKey]?.includes(needle)) blockers.push(message);
}

function rejectText(fileKey, pattern, message) {
  const text = source[fileKey] ?? "";
  const matched = pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern);
  if (matched) blockers.push(message);
}

for (const token of [
  "CityWorldObjectKitPrefabFamily",
  "CityWorldObjectKitPaletteRole",
  "CityWorldObjectKitMetadata",
  "objectKit?:",
]) {
  requireText("types", token, `CityWorld types must expose ${token}.`);
}

for (const family of [
  "civic_landmark",
  "residential_cottage",
  "residential_ranch",
  "residential_rowhome",
  "commerce_strip",
  "lowrise_apartment",
  "service_gym",
]) {
  requireText("types", family, `CityWorld object-kit family ${family} must be typed.`);
  requireText("objectKit", family, `Object-kit analyzer must handle family ${family}.`);
}

for (const role of ["stucco", "terracotta", "glass", "asphalt", "curb", "vegetation", "foundation"]) {
  requireText("types", role, `CityWorld palette role ${role} must be typed.`);
}

for (const metric of [
  "prefabCoverageRatio",
  "paletteCohesionRatio",
  "roofBodySeparationRatio",
  "clonePressureRatio",
  "landmarkSignatureScore",
]) {
  requireText("objectKit", metric, `Object-kit report must compute ${metric}.`);
  requireText("tests", metric, `Core tests must protect ${metric}.`);
}

requireText("compiler", "assignCityWorldObjectKit", "Compiler must assign object-kit metadata in the building metadata seam.");

for (const loudColor of ["#e05d45", "#73a7d6", "#d95f45", "#4f92b8", "#6da76f", "#e0bd4e", "#895c9e", "#77b8d5"]) {
  rejectText("compiler", loudColor, `Compiler must not reintroduce old loud/default color token ${loudColor}.`);
}

for (const providerNeedle of ["@atlas/geo", "GeoDataAdapter", "google.maps", "GoogleMaps", "placeId: \"ChI"]) {
  rejectText("objectKit", providerNeedle, `Object-kit core must not reference provider geometry ${providerNeedle}.`);
  rejectText("renderer", providerNeedle, `Renderer must not reference provider geometry ${providerNeedle}.`);
}

for (const driftNeedle of [/from ["'](?:pg|postgres|@prisma|drizzle-orm|knex|typeorm|sequelize|@supabase)/i, /DATABASE_URL|new PrismaClient|createPool|drizzle\(/i]) {
  rejectText("objectKit", driftNeedle, "0.34E object-kit core must not include DB implementation tokens.");
  rejectText("compiler", driftNeedle, "0.34E compiler changes must not include DB implementation tokens.");
}

for (const publicPromotionNeedle of ["Anaheim / Playable", "Ontario / Playable", "anaheim-candidate playable", "ontario-candidate playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose ${publicPromotionNeedle}.`);
}

const metricResult = await evaluateMetrics();
blockers.push(...metricResult.blockers);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  checkedFiles: files,
  metricSummary: metricResult.summary,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

async function evaluateMetrics() {
  const localBlockers = [];
  let summary = null;
  try {
    const {
      analyzeCityWorldObjectKit,
      analyzeCityWorldScene,
      compileCityWorldScene,
      compileDistrictPlaceAnchorDraftCityWorldScene,
      parseDistrictPlaceAnchorPack,
      riversideDemoVoxelScene,
      CITY_WORLD_BUILDING_PALETTES,
    } = await import("../packages/core/dist/index.js");
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const objectKit = analyzeCityWorldObjectKit(scene);
    const diagnostics = analyzeCityWorldScene(scene, "playable");

    // Honest-metric guarantee (0.51E): the core effective-palette registry must
    // mirror the atlas manifest byte-for-byte for every building.* palette, or
    // clone/variant diagnostics would key on colors the renderer never draws.
    const manifest = JSON.parse(readFileSync(join(root, "packages/assets/city-world/atlas.manifest.json"), "utf8"));
    const manifestBuildingPalettes = Object.entries(manifest.palettes ?? {}).filter(([key]) => key.startsWith("building."));
    for (const [key, palette] of manifestBuildingPalettes) {
      const registryColors = CITY_WORLD_BUILDING_PALETTES?.[key];
      if (!registryColors) {
        localBlockers.push(`Effective-palette registry is missing manifest building palette ${key}.`);
        continue;
      }
      for (const channel of ["base", "roof", "shade", "highlight", "trim"]) {
        const manifestValue = palette.colors?.[channel];
        if (manifestValue !== undefined && registryColors[channel]?.toLowerCase() !== manifestValue.toLowerCase()) {
          localBlockers.push(`Effective-palette registry ${key}.${channel} (${registryColors[channel]}) diverges from manifest (${manifestValue}).`);
        }
      }
    }
    for (const key of Object.keys(CITY_WORLD_BUILDING_PALETTES ?? {})) {
      if (!manifest.palettes?.[key]) localBlockers.push(`Effective-palette registry has stale key ${key} absent from the manifest.`);
    }

    requireMetricAtLeast(localBlockers, objectKit.metrics.prefabCoverageRatio, 1, "prefabCoverageRatio");
    requireMetricAtLeast(localBlockers, objectKit.metrics.paletteCohesionRatio, 0.9, "paletteCohesionRatio");
    requireMetricAtLeast(localBlockers, objectKit.metrics.roofBodySeparationRatio, 0.9, "roofBodySeparationRatio");
    requireMetricAtMost(localBlockers, objectKit.metrics.clonePressureRatio, 0.2, "clonePressureRatio");
    requireMetricAtLeast(localBlockers, objectKit.metrics.landmarkSignatureScore, 0.9, "landmarkSignatureScore");
    requireMetricAtLeast(localBlockers, diagnostics.metrics.terrainMassingCoverageRatio, 0.88, "terrainMassingCoverageRatio");
    requireMetricAtMost(localBlockers, diagnostics.metrics.emptyBoardRatio, 0.07, "emptyBoardRatio");
    requireMetricAtLeast(localBlockers, diagnostics.metrics.firstViewportCompositionScore, 0.77, "firstViewportCompositionScore");
    requireMetricAtLeast(localBlockers, diagnostics.metrics.buildingLotContactRatio, 0.98, "buildingLotContactRatio");
    requireMetricAtLeast(localBlockers, diagnostics.metrics.lotRoadContactRatio, 0.78, "lotRoadContactRatio");
    if (diagnostics.hardBlockers.length > 0) {
      localBlockers.push(`Riverside diagnostics must have zero hard blockers; got ${JSON.stringify(diagnostics.hardBlockers)}.`);
    }
    if (objectKit.blockers.length > 0) {
      localBlockers.push(...objectKit.blockers);
    }

    const requiredFamilies = ["civic_landmark", "residential_cottage", "residential_ranch", "residential_rowhome", "commerce_strip", "lowrise_apartment", "service_gym"];
    for (const family of requiredFamilies) {
      if (!objectKit.distributions.prefabFamilies[family]) localBlockers.push(`Missing public prefab family ${family}.`);
    }

    const anaheimPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync("data/district_place_anchor_packs/anaheim-anchors.json", "utf8")));
    const anaheimDraft = compileDistrictPlaceAnchorDraftCityWorldScene({
      countySlug: "orange-ca",
      districtSlug: "anaheim-candidate",
      districtName: "Anaheim Candidate",
      stateCode: "CA",
      anchorPack: anaheimPack,
    });
    if (anaheimDraft.coverage.playable !== false || anaheimDraft.actors.length !== 0 || anaheimDraft.pins.length !== 0) {
      localBlockers.push("Anaheim hidden draft must remain non-playable with no actors or pins.");
    }

    summary = {
      update: objectKit.update,
      sceneId: objectKit.sceneId,
      prefabCoverageRatio: formatMetric(objectKit.metrics.prefabCoverageRatio),
      paletteCohesionRatio: formatMetric(objectKit.metrics.paletteCohesionRatio),
      roofBodySeparationRatio: formatMetric(objectKit.metrics.roofBodySeparationRatio),
      clonePressureRatio: formatMetric(objectKit.metrics.clonePressureRatio),
      landmarkSignatureScore: formatMetric(objectKit.metrics.landmarkSignatureScore),
      weakestPrefabFamily: objectKit.weakestPrefabFamily,
      prefabFamilies: objectKit.distributions.prefabFamilies,
      paletteRoles: objectKit.distributions.paletteRoles,
      terrainMassingCoverageRatio: formatMetric(diagnostics.metrics.terrainMassingCoverageRatio),
      emptyBoardRatio: formatMetric(diagnostics.metrics.emptyBoardRatio),
      firstViewportCompositionScore: formatMetric(diagnostics.metrics.firstViewportCompositionScore),
      buildingLotContactRatio: formatMetric(diagnostics.metrics.buildingLotContactRatio),
      lotRoadContactRatio: formatMetric(diagnostics.metrics.lotRoadContactRatio),
      anaheimPlayable: anaheimDraft.coverage.playable,
    };
  } catch (error) {
    localBlockers.push(`Unable to evaluate built object-kit metrics. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
  }
  return { blockers: localBlockers, summary };
}

function requireMetricAtLeast(localBlockers, value, floor, label) {
  if (!Number.isFinite(value) || value < floor) {
    localBlockers.push(`${label} must be >= ${floor}; got ${formatMetric(value)}.`);
  }
}

function requireMetricAtMost(localBlockers, value, ceiling, label) {
  if (!Number.isFinite(value) || value > ceiling) {
    localBlockers.push(`${label} must be <= ${ceiling}; got ${formatMetric(value)}.`);
  }
}

function formatMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
