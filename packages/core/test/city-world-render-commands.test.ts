import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildCityWorldRenderCommandBuffer,
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  evaluateCityWorldRenderLayerBudget,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
  type CityWorldActor,
  type CityWorldProp,
} from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const anaheimAnchorPackPath = resolve(testDir, "../../../data/district_place_anchor_packs/anaheim-anchors.json");

describe("CityWorld render commands", () => {
  it("builds an ordered render command buffer for the public Riverside scene", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const buffer = buildCityWorldRenderCommandBuffer(scene);
    const budget = evaluateCityWorldRenderLayerBudget(buffer, "engine_beta_public", scene);

    expect(buffer.type).toBe("cityWorldRenderCommandBuffer");
    expect(buffer.update).toBe("prealpha-0.27e-render-command-pipeline-layer-budget");
    expect(buffer.metrics.terrainCommandCount).toBe(scene.terrainTiles.length);
    expect(buffer.metrics.roadCommandCount).toBe(scene.roadSegments.length);
    expect(buffer.metrics.lotCommandCount).toBe(scene.lots.length);
    expect(buffer.metrics.buildingCommandCount).toBe(scene.buildings.length);
    expect(buffer.metrics.actorCommandCount).toBe(scene.actors.length);
    expect(buffer.metrics.markerCommandCount).toBe(scene.places.length + scene.pins.length);
    expect(buffer.metrics.publicClutterCommandCount).toBe(0);
    expect(buffer.commands.map((command) => command.layerId).indexOf("buildings")).toBeGreaterThan(buffer.commands.map((command) => command.layerId).indexOf("lots"));
    expect(budget.passed).toBe(true);
    expect(budget.blockers).toEqual([]);
  });

  it("keeps shell counties empty of fake renderable object layers", () => {
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
    const buffer = buildCityWorldRenderCommandBuffer(shell, { includeLabels: false });
    const budget = evaluateCityWorldRenderLayerBudget(buffer, "shell_empty_state", shell);

    expect(buffer.metrics.buildingCommandCount).toBe(0);
    expect(buffer.metrics.actorCommandCount).toBe(0);
    expect(buffer.metrics.markerCommandCount).toBe(0);
    expect(buffer.metrics.publicClutterCommandCount).toBe(0);
    expect(budget.passed).toBe(true);
  });

  it("allows hidden draft proof scenes while preserving non-public boundaries", () => {
    const anchorPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath);
    const draft = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack });
    const buffer = buildCityWorldRenderCommandBuffer(draft, { includeLabels: false });
    const budget = evaluateCityWorldRenderLayerBudget(buffer, "hidden_draft_probe", draft);

    expect(draft.coverage?.playable).toBe(false);
    expect(buffer.metrics.buildingCommandCount).toBeGreaterThanOrEqual(4);
    expect(buffer.metrics.actorCommandCount).toBe(0);
    expect(buffer.metrics.publicClutterCommandCount).toBe(0);
    expect(budget.passed).toBe(true);
  });

  it("blocks public clutter commands before they reach a public renderer slice", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const parkedCar: CityWorldProp = {
      id: "test-parked-car",
      kind: "parked_car",
      position: { x: 10, y: 10, z: 0 },
      variant: 0,
    };
    const walker: CityWorldActor = {
      id: "test-walker",
      kind: "walker",
      color: "#d94c42",
      position: { x: 11, y: 10, z: 0 },
      path: [],
      speed: 0,
      phase: 0,
    };
    const cluttered = {
      ...scene,
      props: [...scene.props, parkedCar],
      actors: [...scene.actors, walker],
    };
    const buffer = buildCityWorldRenderCommandBuffer(cluttered);
    const budget = evaluateCityWorldRenderLayerBudget(buffer, "engine_beta_public", cluttered);

    expect(buffer.metrics.publicClutterCommandCount).toBe(2);
    expect(budget.passed).toBe(false);
    expect(budget.blockers.join("\n")).toContain("publicClutterCommandCount");
  });
});
