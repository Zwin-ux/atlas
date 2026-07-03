import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const UPDATE = "postalpha-0.35e-object-kit-renderer-consumption-commerce-strip-fix";
const blockers = [];
const warnings = [];

const files = {
  renderer: "web/src/CityWorldRenderer.tsx",
  objectKit: "packages/core/src/voxel/cityWorldObjectKit.ts",
  types: "packages/core/src/voxel/cityWorldTypes.ts",
  compiler: "packages/core/src/voxel/cityWorldCompiler.ts",
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

requireText("renderer", "building.objectKit?.prefabFamily === \"commerce_strip\"", "Renderer must key commerce-strip read from building.objectKit prefab metadata.");
requireText("renderer", "function drawObjectKitCommerceStripRead", "Renderer must expose focused drawObjectKitCommerceStripRead helper.");
requireText("renderer", "drawObjectKitCommerceStripRead(layer, geometry, building)", "Renderer must call drawObjectKitCommerceStripRead.");
requireText("renderer", "sharedStorefrontApron", "Commerce helper must draw a shared storefront apron.");
requireText("renderer", "glassRecesses", "Commerce helper must draw recessed storefront glass.");
requireText("renderer", "signMounts", "Commerce helper must draw non-text sign-mount geometry.");
requireText("renderer", "parapetCap", "Commerce helper must draw a thicker parapet/eave read.");
requireText("renderer", "foundationShadow", "Commerce helper must ground the storefront with foundation/contact shadow.");

const helperCallCount = (source.renderer.match(/drawObjectKitCommerceStripRead\(layer, geometry, building\)/g) ?? []).length;
if (helperCallCount < 2) {
  blockers.push(`drawObjectKitCommerceStripRead must be used in sprite-backed and primitive paths; found ${helperCallCount} call(s).`);
}

requireText("objectKit", "weakestPrefabFamily", "Object-kit analyzer must still report weakest prefab family.");
requireText("publicObjectKitVerifier", "weakestPrefabFamily", "0.34E verifier must still report weakest prefab family.");
requireText("splitGuard", "scripts/verify-object-kit-renderer-consumption.mjs", "Split guard must allow the 0.35E renderer-consumption verifier.");

for (const forbidden of ["@atlas/geo", "GeoDataAdapter", "google.maps", "GoogleMaps", "maps.googleapis"]) {
  rejectText("renderer", forbidden, `Renderer must not reference provider boundary ${forbidden}.`);
}

for (const forbidden of [/from ["'](?:pg|postgres|@prisma|drizzle-orm|knex|typeorm|sequelize|@supabase)/i, /DATABASE_URL|new PrismaClient|createPool|drizzle\(/i]) {
  rejectText("renderer", forbidden, "0.35E renderer slice must not include DB implementation tokens.");
  rejectText("objectKit", forbidden, "0.35E object-kit slice must not include DB implementation tokens.");
}

for (const publicPromotionNeedle of ["Anaheim / Playable", "Ontario / Playable", "anaheim-candidate playable", "ontario-candidate playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose ${publicPromotionNeedle}.`);
}

const metricResult = await evaluatePublicObjectKitMetrics();
blockers.push(...metricResult.blockers);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  checkedFiles: files,
  rendererConsumption: {
    helperCallCount,
    usesObjectKitPrefab: source.renderer.includes("building.objectKit?.prefabFamily === \"commerce_strip\""),
    hasStructuralCommerceHelper: source.renderer.includes("function drawObjectKitCommerceStripRead"),
  },
  metricSummary: metricResult.summary,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

async function evaluatePublicObjectKitMetrics() {
  const localBlockers = [];
  let summary = null;
  try {
    const { analyzeCityWorldObjectKit, compileCityWorldScene, riversideDemoVoxelScene } = await import("../packages/core/dist/index.js");
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const report = analyzeCityWorldObjectKit(scene);
    if (report.blockers.length > 0) localBlockers.push(...report.blockers);
    requireMetricAtLeast(localBlockers, report.metrics.prefabCoverageRatio, 1, "prefabCoverageRatio");
    requireMetricAtLeast(localBlockers, report.metrics.paletteCohesionRatio, 0.9, "paletteCohesionRatio");
    requireMetricAtLeast(localBlockers, report.metrics.roofBodySeparationRatio, 0.9, "roofBodySeparationRatio");
    requireMetricAtMost(localBlockers, report.metrics.clonePressureRatio, 0.2, "clonePressureRatio");
    requireMetricAtLeast(localBlockers, report.metrics.landmarkSignatureScore, 0.9, "landmarkSignatureScore");
    if (!report.distributions.prefabFamilies.commerce_strip) {
      localBlockers.push("Public Riverside must still include commerce_strip prefab family.");
    }
    summary = {
      update: report.update,
      prefabCoverageRatio: formatMetric(report.metrics.prefabCoverageRatio),
      paletteCohesionRatio: formatMetric(report.metrics.paletteCohesionRatio),
      roofBodySeparationRatio: formatMetric(report.metrics.roofBodySeparationRatio),
      clonePressureRatio: formatMetric(report.metrics.clonePressureRatio),
      landmarkSignatureScore: formatMetric(report.metrics.landmarkSignatureScore),
      weakestPrefabFamily: report.weakestPrefabFamily,
      commerceStripCount: report.distributions.prefabFamilies.commerce_strip ?? 0,
    };
  } catch (error) {
    localBlockers.push(`Unable to evaluate built public object-kit metrics. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
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
