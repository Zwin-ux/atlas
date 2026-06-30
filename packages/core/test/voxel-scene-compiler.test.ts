import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CountyPackService, compileVoxelSceneFromCountyPack } from "../src/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const countyPackDir = resolve(testDir, "../../../data/county_packs");

describe("VoxelScene compiler", () => {
  it("compiles the curated Riverside pack and highlights Eastvale", () => {
    const pack = new CountyPackService(countyPackDir).loadCountyPack("riverside-ca");
    const scene = compileVoxelSceneFromCountyPack(pack, { selectedNodeId: "eastvale" });

    expect(scene.type).toBe("voxelScene");
    expect(scene.county.slug).toBe("riverside-ca");
    expect(scene.selectedNodeId).toBe("eastvale");
    expect(scene.camera?.focusNodeId).toBe("eastvale");
    expect(scene.clawd.nodeId).toBe("eastvale");
    expect(scene.nodes.map((node) => node.id)).toEqual(expect.arrayContaining(["eastvale", "gym-plaza-eastvale"]));
    expect(scene.world?.selectedDistrictId).toBe("eastvale-district");
    expect(scene.world?.places.map((place) => place.id)).toContain("place-eastvale");
    expect(scene.markers.find((marker) => marker.nodeId === "eastvale")?.kind).toBe("drop");
  });

  it("falls back to Eastvale when an unsupported selected node is requested", () => {
    const pack = new CountyPackService(countyPackDir).loadCountyPack("riverside-ca");
    const scene = compileVoxelSceneFromCountyPack(pack, { selectedNodeId: "missing-node" });

    expect(scene.selectedNodeId).toBe("eastvale");
    expect(scene.panel.summary).toContain("Eastvale");
  });
});
