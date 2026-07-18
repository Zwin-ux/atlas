import { describe, expect, it } from "vitest";
import {
  cityWorldLodBandRank,
  compileCityWorldScene,
  compileCityWorldSceneWindow,
  createCityWorldSceneWindowCompiler,
  riversideDemoVoxelScene,
  type CityWorldChunkEpoch,
  type CityWorldLodBand,
  type CityWorldScene,
  type CityWorldViewportFrame,
} from "../src/index.js";

const EPOCH: CityWorldChunkEpoch = { schemaVersion: "roadchunk/1", packHash: "b3-test-epoch" };

/** Deterministic band tag by index: 0 -> untagged(FAR), 1 -> MID, 2 -> NEAR. */
function tagForIndex(index: number): CityWorldLodBand | undefined {
  const m = index % 3;
  return m === 1 ? "mid" : m === 2 ? "near" : undefined;
}

/** Riverside compiled with a deterministic band tag on every road + every prop. */
function taggedRiverside(): CityWorldScene {
  const base = compileCityWorldScene(riversideDemoVoxelScene);
  return {
    ...base,
    roadSegments: base.roadSegments.map((road, i) => {
      const band = tagForIndex(i);
      return band ? { ...road, lodBand: band } : road;
    }),
    props: base.props.map((prop, i) => (i % 2 === 0 ? { ...prop, lodBand: "near" as const } : prop)),
  };
}

/** A frame that covers the whole scene (band filter isolated from frame culling). */
function fullFrame(scene: CityWorldScene): CityWorldViewportFrame {
  return {
    minX: scene.bounds.minX - 50,
    maxX: scene.bounds.maxX + 50,
    minY: scene.bounds.minY - 50,
    maxY: scene.bounds.maxY + 50,
  };
}

describe("cityWorldLodBandRank", () => {
  it("ranks far<mid<near and treats untagged as FAR", () => {
    expect(cityWorldLodBandRank("far")).toBe(0);
    expect(cityWorldLodBandRank("mid")).toBe(1);
    expect(cityWorldLodBandRank("near")).toBe(2);
    expect(cityWorldLodBandRank(undefined)).toBe(0);
  });
});

describe("scene-window band filter", () => {
  it("renders a band's own layer plus everything below it (far ⊆ mid ⊆ near)", () => {
    const scene = taggedRiverside();
    const frame = fullFrame(scene);

    const untaggedRoads = scene.roadSegments.filter((r) => r.lodBand === undefined).length;
    const midRoads = scene.roadSegments.filter((r) => r.lodBand === "mid").length;
    const nearRoads = scene.roadSegments.filter((r) => r.lodBand === "near").length;
    const totalRoads = scene.roadSegments.length;
    // Guard the assumptions the strict inequalities below rely on.
    expect(untaggedRoads).toBeGreaterThan(0);
    expect(midRoads).toBeGreaterThan(0);
    expect(nearRoads).toBeGreaterThan(0);

    const far = compileCityWorldSceneWindow(scene, "desktop", { viewportFrame: frame, committedBand: "far" });
    const mid = compileCityWorldSceneWindow(scene, "desktop", { viewportFrame: frame, committedBand: "mid" });
    const near = compileCityWorldSceneWindow(scene, "desktop", { viewportFrame: frame, committedBand: "near" });

    // FAR shows only untagged (FAR) roads; MID adds MID; NEAR adds everything.
    expect(far.layerCommandCounts.roads).toBe(untaggedRoads);
    expect(mid.layerCommandCounts.roads).toBe(untaggedRoads + midRoads);
    expect(near.layerCommandCounts.roads).toBe(totalRoads);
    expect(far.layerCommandCounts.roads).toBeLessThan(mid.layerCommandCounts.roads);
    expect(mid.layerCommandCounts.roads).toBeLessThan(near.layerCommandCounts.roads);

    // Nested sets: every FAR road command also appears in MID and NEAR.
    const roadIds = (w: typeof far) =>
      new Set(w.visibleCommands.filter((c) => c.layerId === "roads").map((c) => c.id));
    const farIds = roadIds(far);
    const midIds = roadIds(mid);
    const nearIds = roadIds(near);
    for (const id of farIds) expect(midIds.has(id)).toBe(true);
    for (const id of midIds) expect(nearIds.has(id)).toBe(true);

    // A second tagged layer (props) filters the same way.
    if (near.layerCommandCounts.props > 0) {
      expect(far.layerCommandCounts.props).toBeLessThan(near.layerCommandCounts.props);
    }
  });

  it("keeps untagged content (terrain / places) constant across every band", () => {
    const scene = taggedRiverside();
    const frame = fullFrame(scene);
    const far = compileCityWorldSceneWindow(scene, "desktop", { viewportFrame: frame, committedBand: "far" });
    const near = compileCityWorldSceneWindow(scene, "desktop", { viewportFrame: frame, committedBand: "near" });
    // Terrain and markers carry no band tag -> FAR -> present at every band.
    expect(far.layerCommandCounts.terrain).toBe(near.layerCommandCounts.terrain);
    expect(far.layerCommandCounts.terrain).toBeGreaterThan(0);
    expect(far.layerCommandCounts.markers).toBe(near.layerCommandCounts.markers);
  });

  it("threads committedBand and chunkEpoch onto the window result verbatim", () => {
    const scene = taggedRiverside();
    const window = compileCityWorldSceneWindow(scene, "desktop", {
      viewportFrame: fullFrame(scene),
      committedBand: "mid",
      chunkEpoch: EPOCH,
    });
    expect(window.committedBand).toBe("mid");
    expect(window.chunkEpoch).toEqual(EPOCH);
  });
});

describe("scene-window band filter — omitted-input byte-identical regression", () => {
  it("adds no band keys and removes nothing when committedBand is omitted", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene); // untagged (all FAR)
    const omitted = compileCityWorldSceneWindow(scene, "desktop");

    // No band plumbing leaks into the legacy result shape.
    expect("committedBand" in omitted).toBe(false);
    expect("chunkEpoch" in omitted).toBe(false);
    expect(JSON.stringify(omitted)).not.toContain("committedBand");
    expect(JSON.stringify(omitted)).not.toContain("chunkEpoch");

    // Untagged content is FAR, so filtering at ANY band removes nothing: the
    // visible set is identical to the omitted (legacy) set.
    const commandIds = (w: typeof omitted) => w.visibleCommands.map((c) => c.id);
    const withFar = compileCityWorldSceneWindow(scene, "desktop", { committedBand: "far" });
    const withNear = compileCityWorldSceneWindow(scene, "desktop", { committedBand: "near" });
    expect(commandIds(withFar)).toEqual(commandIds(omitted));
    expect(commandIds(withNear)).toEqual(commandIds(omitted));
    expect(withFar.metrics).toEqual(omitted.metrics);
    expect(withNear.metrics).toEqual(omitted.metrics);
  });

  it("emits render commands with no lodBand key for untagged sources", () => {
    const scene = compileCityWorldScene(riversideDemoVoxelScene);
    const window = compileCityWorldSceneWindow(scene, "desktop");
    for (const command of window.visibleCommands) {
      expect("lodBand" in command).toBe(false);
    }
  });
});

describe("scene-window band filter — memoized compiler correctness across bands", () => {
  it("re-filters per call so a later band is never a stale cache hit", () => {
    const scene = taggedRiverside();
    const frame = fullFrame(scene);
    const compiler = createCityWorldSceneWindowCompiler(scene);

    const far = compiler.windowFor("desktop", frame, { committedBand: "far" });
    const near = compiler.windowFor("desktop", frame, { committedBand: "near" });
    const farAgain = compiler.windowFor("desktop", frame, { committedBand: "far" });

    // Same memoized artifacts, different bands -> different, correct results.
    expect(near.layerCommandCounts.roads).toBeGreaterThan(far.layerCommandCounts.roads);
    // Re-asking for FAR after NEAR yields the FAR result again (no cross-band bleed).
    expect(farAgain.layerCommandCounts.roads).toBe(far.layerCommandCounts.roads);
    expect(far.committedBand).toBe("far");
    expect(near.committedBand).toBe("near");

    // The item index is still shared and complete (memoization intact).
    expect(compiler.itemIndex.roadSegments.size).toBe(scene.roadSegments.length);
  });

  it("matches the one-shot compile for the same band + frame", () => {
    const scene = taggedRiverside();
    const frame = fullFrame(scene);
    const compiler = createCityWorldSceneWindowCompiler(scene);
    const cached = compiler.windowFor("desktop", frame, { committedBand: "mid", chunkEpoch: EPOCH });
    const direct = compileCityWorldSceneWindow(scene, "desktop", {
      viewportFrame: frame,
      committedBand: "mid",
      chunkEpoch: EPOCH,
    });
    expect(cached.visibleCommands.map((c) => c.id)).toEqual(direct.visibleCommands.map((c) => c.id));
    expect(cached.metrics).toEqual(direct.metrics);
    expect(cached.committedBand).toBe("mid");
    expect(cached.chunkEpoch).toEqual(EPOCH);
  });
});
