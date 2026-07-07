import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  compileCityWorldScene,
  compileCityWorldSceneChunkIndex,
  compileCityWorldSceneWindow,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  createCityWorldSceneWindowCompiler,
  evaluateCityWorldSceneWindowBudget,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const anaheimAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/ontario-anchors.json");

describe("CityWorld scene windows", () => {
  it("chunks the Riverside scene without loading every command into the mobile window", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const chunkIndex = compileCityWorldSceneChunkIndex(scene);
    const desktop = compileCityWorldSceneWindow(scene, "desktop");
    const mobile = compileCityWorldSceneWindow(scene, "mobile");
    const residentialDetail = compileCityWorldSceneWindow(scene, "residential_detail");
    const commerceDetail = compileCityWorldSceneWindow(scene, "commerce_detail");

    expect(chunkIndex.type).toBe("cityWorldSceneChunkIndex");
    expect(chunkIndex.chunkSize).toBe(8);
    expect(chunkIndex.chunkCount).toBeGreaterThan(12);
    expect(chunkIndex.totalCommandCount).toBeGreaterThan(1000);

    for (const window of [desktop, mobile, residentialDetail, commerceDetail]) {
      const budget = evaluateCityWorldSceneWindowBudget(window, "public_playable_window", scene);
      expect(window.type).toBe("cityWorldSceneWindow");
      expect(window.update).toBe("prealpha-0.28e-tile-chunk-scene-window-compiler");
      expect(window.chunkIds.length).toBeGreaterThan(0);
      expect(window.metrics.visibleCommandCount).toBeLessThan(window.metrics.totalSceneCommandCount);
      expect(window.metrics.terrainCommandCount).toBeGreaterThan(40);
      expect(window.metrics.publicClutterCommandCount).toBe(0);
      expect(budget.passed).toBe(true);
    }

    expect(desktop.metrics.commandVisibilityRatio).toBeLessThan(0.4);
    expect(mobile.metrics.commandVisibilityRatio).toBeLessThan(0.55);
    expect(residentialDetail.metrics.commandVisibilityRatio).toBeLessThan(mobile.metrics.commandVisibilityRatio);
    expect(commerceDetail.visibleCommands.some((command) => command.sourceId === "building-plaza-strip")).toBe(true);
    expect(commerceDetail.visibleCommands.some((command) => command.sourceId === "place-plaza-row")).toBe(true);
  });

  it("can compile a larger screen-derived window after pan without falling back to the full scene", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const presetWindow = compileCityWorldSceneWindow(scene, "desktop");
    const pannedWindow = compileCityWorldSceneWindow(scene, "desktop", {
      viewportFrame: {
        minX: 0,
        maxX: 36,
        minY: 0,
        maxY: 30,
      },
    });

    expect(pannedWindow.frame).toEqual({ minX: 0, maxX: 36, minY: 0, maxY: 30 });
    expect(pannedWindow.metrics.visibleCommandCount).toBeGreaterThan(presetWindow.metrics.visibleCommandCount);
    expect(pannedWindow.metrics.visibleCommandCount).toBeLessThan(pannedWindow.metrics.totalSceneCommandCount);
    expect(pannedWindow.metrics.publicClutterCommandCount).toBe(0);
  });

  it("cached compiler produces windows identical to direct compiles across frames", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const compiler = createCityWorldSceneWindowCompiler(scene);
    const frames = [
      undefined,
      { minX: 0, maxX: 36, minY: 0, maxY: 30 },
      { minX: 8, maxX: 24, minY: 4, maxY: 18 },
    ] as const;

    for (const frame of frames) {
      const direct = frame
        ? compileCityWorldSceneWindow(scene, "desktop", { viewportFrame: frame })
        : compileCityWorldSceneWindow(scene, "desktop");
      const cached = compiler.windowFor("desktop", frame ? { ...frame } : undefined);
      expect(cached.frame).toEqual(direct.frame);
      expect(cached.chunkIds).toEqual(direct.chunkIds);
      expect(cached.metrics).toEqual(direct.metrics);
      expect(cached.visibleCommands.map((command) => command.id)).toEqual(direct.visibleCommands.map((command) => command.id));
    }

    // The item index is shared and id-complete.
    expect(compiler.itemIndex.buildings.size).toBe(scene.buildings.length);
    expect(compiler.itemIndex.terrainTiles.size).toBe(scene.terrainTiles.length);
  });

  it("keeps shell windows terrain-only and non-playable", () => {
    const shell = compileCountyShellCityWorldScene({
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
    const window = compileCityWorldSceneWindow(shell, "mobile", { includeLabels: false });
    const budget = evaluateCityWorldSceneWindowBudget(window, "shell_empty_window", shell);

    expect(window.metrics.terrainCommandCount).toBeGreaterThan(24);
    expect(window.metrics.roadCommandCount).toBe(0);
    expect(window.metrics.lotCommandCount).toBe(0);
    expect(window.metrics.buildingCommandCount).toBe(0);
    expect(window.metrics.markerCommandCount).toBe(0);
    expect(window.metrics.actorCommandCount).toBe(0);
    expect(budget.passed).toBe(true);
  });

  it("compiles hidden Anaheim and Ontario windows without public playable state", () => {
    const anaheimPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const ontarioPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath);
    const anaheim = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimPack });
    const ontario = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: ontarioPack });

    for (const draft of [anaheim, ontario]) {
      const window = compileCityWorldSceneWindow(draft, "mobile", { includeLabels: false });
      const budget = evaluateCityWorldSceneWindowBudget(window, "hidden_draft_window", draft);

      expect(draft.coverage?.playable).toBe(false);
      expect(window.metrics.terrainCommandCount).toBeGreaterThan(40);
      expect(window.metrics.roadCommandCount).toBeGreaterThanOrEqual(1);
      expect(window.metrics.lotCommandCount).toBeGreaterThanOrEqual(1);
      expect(window.metrics.buildingCommandCount).toBeGreaterThanOrEqual(1);
      expect(window.metrics.actorCommandCount).toBe(0);
      expect(window.metrics.publicClutterCommandCount).toBe(0);
      expect(budget.passed).toBe(true);
    }
  });
});
