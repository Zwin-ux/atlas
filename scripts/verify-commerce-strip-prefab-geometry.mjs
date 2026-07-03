import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const UPDATE = "postalpha-0.36e-commerce-strip-prefab-geometry-plaza-row-focus";
const blockers = [];
const warnings = [];

const files = {
  types: "packages/core/src/voxel/cityWorldTypes.ts",
  objectKit: "packages/core/src/voxel/cityWorldObjectKit.ts",
  compiler: "packages/core/src/voxel/cityWorldCompiler.ts",
  compilerTest: "packages/core/test/city-world-compiler.test.ts",
  renderer: "web/src/CityWorldRenderer.tsx",
  objectKitVerifier: "scripts/verify-object-kit-renderer-consumption.mjs",
  publicObjectKitVerifier: "scripts/verify-public-object-kit-prefab-palette.mjs",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
  switcher: "web/src/CountySwitcher.tsx",
  coverageView: "web/src/CountyCoverageView.tsx",
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

requireText("types", "CityWorldCommerceStripPrefabGeometry", "Core types must define the commerce-strip prefab geometry contract.");
requireText("types", "commerceGeometry?: CityWorldCommerceStripPrefabGeometry", "Object-kit metadata must carry optional commerceGeometry.");
requireText("objectKit", "function commerceStripPrefabGeometry", "Object-kit core must assign commerce-strip prefab geometry.");
requireText("objectKit", "focusTarget: \"plaza_row\"", "Plaza Row must be identified as the focused commerce strip target.");
requireText("objectKit", "deep-storefront-apron", "Plaza Row object-kit tags must include deep-storefront-apron.");
requireText("objectKit", "continuous-parapet", "Plaza Row object-kit tags must include continuous-parapet.");
requireText("compilerTest", "commerceGeometry", "Core tests must assert the Plaza Row commerce geometry contract.");
requireText("renderer", "building.objectKit?.commerceGeometry", "Renderer must consume objectKit commerceGeometry.");
requireText("renderer", "plazaRowFrontageDepth", "Renderer must draw a focused Plaza Row frontage-depth plane.");
requireText("renderer", "bayPilasters", "Renderer must draw bay pilasters for commerce-strip geometry.");
requireText("renderer", "signMountCount", "Renderer must consume signMountCount from commerceGeometry.");
requireText("renderer", "parapetWeight", "Renderer must consume parapetWeight from commerceGeometry.");
requireText("renderer", "glassRecessDepth", "Renderer must consume glassRecessDepth from commerceGeometry.");
requireText("splitGuard", "scripts/verify-commerce-strip-prefab-geometry.mjs", "Split guard must allow the 0.36E commerce prefab verifier.");

for (const forbidden of ["@atlas/geo", "GeoDataAdapter", "google.maps", "GoogleMaps", "maps.googleapis"]) {
  rejectText("renderer", forbidden, `Renderer must not reference provider boundary ${forbidden}.`);
  rejectText("objectKit", forbidden, `Object-kit core must not reference provider boundary ${forbidden}.`);
}

for (const forbidden of [/from ["'](?:pg|postgres|@prisma|drizzle-orm|knex|typeorm|sequelize|@supabase)/i, /DATABASE_URL|new PrismaClient|createPool|drizzle\(/i]) {
  rejectText("renderer", forbidden, "0.36E renderer slice must not include DB implementation tokens.");
  rejectText("objectKit", forbidden, "0.36E object-kit slice must not include DB implementation tokens.");
  rejectText("compiler", forbidden, "0.36E compiler slice must not include DB implementation tokens.");
}

for (const publicPromotionNeedle of ["Anaheim / Playable", "Ontario / Playable", "anaheim-candidate playable", "ontario-candidate playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose ${publicPromotionNeedle}.`);
}

const metricResult = await evaluateCommerceGeometry();
blockers.push(...metricResult.blockers);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  checkedFiles: files,
  plazaRowGeometry: metricResult.summary,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

async function evaluateCommerceGeometry() {
  const localBlockers = [];
  let summary = null;
  try {
    const { analyzeCityWorldObjectKit, compileCityWorldScene, riversideDemoVoxelScene } = await import("../packages/core/dist/index.js");
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const plazaRow = scene.buildings.find((building) => building.id === "building-plaza-strip");
    if (!plazaRow) {
      localBlockers.push("Missing public Riverside building-plaza-strip.");
      return { blockers: localBlockers, summary };
    }

    const commerceGeometry = plazaRow.objectKit?.commerceGeometry;
    if (!commerceGeometry) localBlockers.push("Plaza Row must carry objectKit.commerceGeometry.");
    if (plazaRow.objectKit?.prefabFamily !== "commerce_strip") localBlockers.push("Plaza Row must remain prefabFamily commerce_strip.");
    if (plazaRow.objectKit?.commerceGeometry?.focusTarget !== "plaza_row") localBlockers.push("Plaza Row commerceGeometry must identify focusTarget plaza_row.");
    requireAtLeast(localBlockers, commerceGeometry?.bayCount, 7, "Plaza Row bayCount");
    requireAtLeast(localBlockers, commerceGeometry?.signMountCount, 5, "Plaza Row signMountCount");
    requireAtLeast(localBlockers, commerceGeometry?.apronDepth, 0.38, "Plaza Row apronDepth");
    requireAtLeast(localBlockers, commerceGeometry?.glassRecessDepth, 0.4, "Plaza Row glassRecessDepth");
    requireAtLeast(localBlockers, commerceGeometry?.parapetWeight, 1.15, "Plaza Row parapetWeight");
    if (!plazaRow.objectKit?.signatureTags.includes("deep-storefront-apron")) localBlockers.push("Plaza Row must carry deep-storefront-apron signature tag.");
    if (!plazaRow.objectKit?.signatureTags.includes("continuous-parapet")) localBlockers.push("Plaza Row must carry continuous-parapet signature tag.");

    const objectKit = analyzeCityWorldObjectKit(scene);
    if (objectKit.blockers.length > 0) localBlockers.push(...objectKit.blockers);
    requireAtMost(localBlockers, objectKit.metrics.clonePressureRatio, 0.2, "clonePressureRatio");
    requireAtLeast(localBlockers, objectKit.metrics.terrainMassingCoverageRatio, 0.72, "terrainMassingCoverageRatio");
    requireAtMost(localBlockers, objectKit.metrics.emptyBoardRatio, 0.18, "emptyBoardRatio");
    requireAtLeast(localBlockers, objectKit.metrics.firstViewportCompositionScore, 0.75, "firstViewportCompositionScore");
    requireAtLeast(localBlockers, objectKit.metrics.buildingLotContactRatio, 0.98, "buildingLotContactRatio");
    requireAtLeast(localBlockers, objectKit.metrics.lotRoadContactRatio, 0.78, "lotRoadContactRatio");

    summary = {
      buildingId: plazaRow.id,
      prefabFamily: plazaRow.objectKit?.prefabFamily ?? null,
      bayCount: commerceGeometry?.bayCount ?? null,
      signMountCount: commerceGeometry?.signMountCount ?? null,
      apronDepth: formatMetric(commerceGeometry?.apronDepth),
      glassRecessDepth: formatMetric(commerceGeometry?.glassRecessDepth),
      parapetWeight: formatMetric(commerceGeometry?.parapetWeight),
      focusTarget: commerceGeometry?.focusTarget ?? null,
      signatureTags: plazaRow.objectKit?.signatureTags ?? [],
      clonePressureRatio: formatMetric(objectKit.metrics.clonePressureRatio),
      terrainMassingCoverageRatio: formatMetric(objectKit.metrics.terrainMassingCoverageRatio),
      emptyBoardRatio: formatMetric(objectKit.metrics.emptyBoardRatio),
      firstViewportCompositionScore: formatMetric(objectKit.metrics.firstViewportCompositionScore),
    };
  } catch (error) {
    localBlockers.push(`Unable to evaluate built commerce strip geometry. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
  }
  return { blockers: localBlockers, summary };
}

function requireAtLeast(localBlockers, value, floor, label) {
  if (!Number.isFinite(value) || value < floor) {
    localBlockers.push(`${label} must be >= ${floor}; got ${formatMetric(value)}.`);
  }
}

function requireAtMost(localBlockers, value, ceiling, label) {
  if (!Number.isFinite(value) || value > ceiling) {
    localBlockers.push(`${label} must be <= ${ceiling}; got ${formatMetric(value)}.`);
  }
}

function formatMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
