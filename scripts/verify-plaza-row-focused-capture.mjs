import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const UPDATE = "postalpha-0.37e-plaza-row-focused-capture-commerce-read-proof";
const blockers = [];
const warnings = [];

const files = {
  types: "packages/core/src/voxel/cityWorldTypes.ts",
  basis: "packages/core/src/voxel/cityWorldBasis.ts",
  compiler: "packages/core/src/voxel/cityWorldCompiler.ts",
  objectKit: "packages/core/src/voxel/cityWorldObjectKit.ts",
  compilerTest: "packages/core/test/city-world-compiler.test.ts",
  sceneWindowTest: "packages/core/test/city-world-scene-window.test.ts",
  renderer: "web/src/CityWorldRenderer.tsx",
  productLoopVerifier: "scripts/verify-alpha-product-loop.mjs",
  commerceVerifier: "scripts/verify-commerce-strip-prefab-geometry.mjs",
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

requireText("types", "\"commerce_detail\"", "Core camera preset type must include commerce_detail.");
requireText("basis", "id === \"commerce_detail\"", "WorldBasis viewport framing must know commerce_detail.");
requireText("compiler", "id: \"commerce_detail\"", "Riverside scene compiler must expose a commerce_detail camera preset.");
requireText("objectKit", "bayCount: isPlazaRow ? 7", "Plaza Row geometry must use seven storefront bays.");
requireText("objectKit", "signMountCount: isPlazaRow ? 5", "Plaza Row geometry must use five sign-mount blocks.");
requireText("objectKit", "apronDepth: isPlazaRow ? 0.4", "Plaza Row geometry must use a deeper storefront apron.");
requireText("objectKit", "glassRecessDepth: isPlazaRow ? 0.42", "Plaza Row geometry must use deeper glass recesses.");
requireText("objectKit", "parapetWeight: isPlazaRow ? 1.18", "Plaza Row geometry must use a heavier parapet.");
requireText("renderer", "storefrontThresholds", "Renderer must draw bay-level storefront thresholds for the focused commerce pass.");
requireText("productLoopVerifier", "--camera-preset", "Product-loop verifier must support focused camera proof.");
requireText("compilerTest", "\"commerce_detail\"", "Core tests must assert the commerce_detail camera.");
requireText("sceneWindowTest", "compileCityWorldSceneWindow(scene, \"commerce_detail\")", "Scene-window tests must assert commerce_detail visibility.");
requireText("splitGuard", "scripts/verify-plaza-row-focused-capture.mjs", "Split guard must allow the 0.37E Plaza Row verifier.");

for (const forbidden of ["@atlas/geo", "GeoDataAdapter", "google.maps", "GoogleMaps", "maps.googleapis"]) {
  rejectText("renderer", forbidden, `Renderer must not reference provider boundary ${forbidden}.`);
  rejectText("objectKit", forbidden, `Object-kit core must not reference provider boundary ${forbidden}.`);
  rejectText("compiler", forbidden, `Compiler must not reference provider boundary ${forbidden}.`);
}

for (const forbidden of [/from ["'](?:pg|postgres|@prisma|drizzle-orm|knex|typeorm|sequelize|@supabase)/i, /DATABASE_URL|new PrismaClient|createPool|drizzle\(/i]) {
  rejectText("renderer", forbidden, "0.37E renderer slice must not include DB implementation tokens.");
  rejectText("objectKit", forbidden, "0.37E object-kit slice must not include DB implementation tokens.");
  rejectText("compiler", forbidden, "0.37E compiler slice must not include DB implementation tokens.");
}

for (const publicPromotionNeedle of ["Anaheim / Playable", "Ontario / Playable", "anaheim-candidate playable", "ontario-candidate playable"]) {
  rejectText("switcher", publicPromotionNeedle, `County switcher must not expose ${publicPromotionNeedle}.`);
  rejectText("coverageView", publicPromotionNeedle, `Coverage view must not expose ${publicPromotionNeedle}.`);
}

const metricResult = await evaluatePlazaRowProof();
blockers.push(...metricResult.blockers);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  checkedFiles: files,
  focusedCapture: metricResult.summary,
  blockerCount: blockers.length,
  blockers,
  warnings,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

async function evaluatePlazaRowProof() {
  const localBlockers = [];
  let summary = null;
  try {
    const {
      analyzeCityWorldObjectKit,
      compileCityWorldScene,
      compileCityWorldSceneWindow,
      riversideDemoVoxelScene,
    } = await import("../packages/core/dist/index.js");
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const plazaRow = scene.buildings.find((building) => building.id === "building-plaza-strip");
    const plazaPlace = scene.places.find((place) => place.id === "place-plaza-row");
    const camera = scene.cameraPresets.find((preset) => preset.id === "commerce_detail");

    if (!plazaRow) localBlockers.push("Missing public Riverside building-plaza-strip.");
    if (!plazaPlace) localBlockers.push("Missing public Riverside place-plaza-row.");
    if (!camera) localBlockers.push("Missing commerce_detail camera preset.");
    if (!plazaRow || !plazaPlace || !camera) return { blockers: localBlockers, summary };

    const commerceGeometry = plazaRow.objectKit?.commerceGeometry;
    if (!commerceGeometry) localBlockers.push("Plaza Row must carry objectKit.commerceGeometry.");
    if (plazaRow.objectKit?.prefabFamily !== "commerce_strip") localBlockers.push("Plaza Row must remain prefabFamily commerce_strip.");
    if (commerceGeometry?.focusTarget !== "plaza_row") localBlockers.push("Plaza Row commerceGeometry must identify focusTarget plaza_row.");

    requireAtLeast(localBlockers, plazaRow.width, 6, "Plaza Row width");
    requireAtLeast(localBlockers, plazaRow.depth, 2, "Plaza Row depth");
    requireAtLeast(localBlockers, plazaRow.height, 1.75, "Plaza Row height");
    requireAtLeast(localBlockers, commerceGeometry?.bayCount, 7, "Plaza Row bayCount");
    requireAtLeast(localBlockers, commerceGeometry?.signMountCount, 5, "Plaza Row signMountCount");
    requireAtLeast(localBlockers, commerceGeometry?.apronDepth, 0.38, "Plaza Row apronDepth");
    requireAtLeast(localBlockers, commerceGeometry?.glassRecessDepth, 0.4, "Plaza Row glassRecessDepth");
    requireAtLeast(localBlockers, commerceGeometry?.parapetWeight, 1.15, "Plaza Row parapetWeight");

    const cameraDistance = distance(camera.center, plazaRow.position);
    requireAtMost(localBlockers, cameraDistance, 1.4, "commerce_detail camera distance from Plaza Row");
    requireAtLeast(localBlockers, camera.zoom, 1.55, "commerce_detail camera zoom");

    const commerceWindow = compileCityWorldSceneWindow(scene, "commerce_detail", { includeLabels: false });
    if (!commerceWindow.visibleCommands.some((command) => command.sourceId === plazaRow.id)) {
      localBlockers.push("commerce_detail scene window must include building-plaza-strip.");
    }
    if (!commerceWindow.visibleCommands.some((command) => command.sourceId === plazaPlace.id)) {
      localBlockers.push("commerce_detail scene window must include place-plaza-row.");
    }
    requireAtLeast(localBlockers, commerceWindow.metrics.buildingCommandCount, 3, "commerce_detail buildingCommandCount");
    requireAtMost(localBlockers, commerceWindow.metrics.publicClutterCommandCount, 0, "commerce_detail publicClutterCommandCount");
    requireAtMost(localBlockers, commerceWindow.metrics.commandVisibilityRatio, 0.48, "commerce_detail commandVisibilityRatio");

    const objectKit = analyzeCityWorldObjectKit(scene);
    if (objectKit.blockers.length > 0) localBlockers.push(...objectKit.blockers);
    requireAtMost(localBlockers, objectKit.metrics.clonePressureRatio, 0.2, "clonePressureRatio");
    requireAtLeast(localBlockers, objectKit.metrics.terrainMassingCoverageRatio, 0.72, "terrainMassingCoverageRatio");
    requireAtMost(localBlockers, objectKit.metrics.emptyBoardRatio, 0.18, "emptyBoardRatio");
    requireAtLeast(localBlockers, objectKit.metrics.firstViewportCompositionScore, 0.75, "firstViewportCompositionScore");
    requireAtLeast(localBlockers, objectKit.metrics.buildingLotContactRatio, 0.98, "buildingLotContactRatio");
    requireAtLeast(localBlockers, objectKit.metrics.lotRoadContactRatio, 0.78, "lotRoadContactRatio");

    summary = {
      cameraPresetId: camera.id,
      cameraCenter: camera.center,
      cameraZoom: formatMetric(camera.zoom),
      cameraDistanceFromPlazaRow: formatMetric(cameraDistance),
      buildingId: plazaRow.id,
      buildingSize: {
        width: formatMetric(plazaRow.width),
        depth: formatMetric(plazaRow.depth),
        height: formatMetric(plazaRow.height),
      },
      bayCount: commerceGeometry?.bayCount ?? null,
      signMountCount: commerceGeometry?.signMountCount ?? null,
      apronDepth: formatMetric(commerceGeometry?.apronDepth),
      glassRecessDepth: formatMetric(commerceGeometry?.glassRecessDepth),
      parapetWeight: formatMetric(commerceGeometry?.parapetWeight),
      focusTarget: commerceGeometry?.focusTarget ?? null,
      commerceWindow: {
        visibleCommandCount: commerceWindow.metrics.visibleCommandCount,
        buildingCommandCount: commerceWindow.metrics.buildingCommandCount,
        commandVisibilityRatio: formatMetric(commerceWindow.metrics.commandVisibilityRatio),
        publicClutterCommandCount: commerceWindow.metrics.publicClutterCommandCount,
      },
      clonePressureRatio: formatMetric(objectKit.metrics.clonePressureRatio),
      terrainMassingCoverageRatio: formatMetric(objectKit.metrics.terrainMassingCoverageRatio),
      emptyBoardRatio: formatMetric(objectKit.metrics.emptyBoardRatio),
      firstViewportCompositionScore: formatMetric(objectKit.metrics.firstViewportCompositionScore),
    };
  } catch (error) {
    localBlockers.push(`Unable to evaluate built Plaza Row focused capture. Run pnpm build:core first. ${error instanceof Error ? error.message : String(error)}`);
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

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z ?? 0) - (b.z ?? 0)) ** 2);
}

function formatMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
