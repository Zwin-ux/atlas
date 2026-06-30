import { describe, expect, it } from "vitest";
import {
  createVoxelNote,
  createVoxelSticker,
  riversideDemoVoxelScene,
  serializeVoxelMapSession,
  validateVoxelWorld,
} from "../src/index.js";

describe("Voxel map session", () => {
  it("validates the scalable world hierarchy for the Riverside city map", () => {
    const world = validateVoxelWorld(riversideDemoVoxelScene);

    expect(world.nodes.some((node) => node.id === "us" && node.scale === "country")).toBe(true);
    expect(world.nodes.some((node) => node.id === "ca" && node.parentId === "us")).toBe(true);
    expect(world.selectedDistrictId).toBe("eastvale-district");
    expect(world.districts.find((district) => district.id === "eastvale-district")?.playable).toBe(true);
    expect(world.places.map((place) => place.id)).toContain("place-eastvale-core");
  });

  it("creates stickers and session notes only for known places", () => {
    const sticker = createVoxelSticker(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      kind: "favorite",
      label: "Start",
    });
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      stickerId: sticker.id,
      body: "Check this place first.",
    });

    expect(sticker).toMatchObject({ placeId: "place-eastvale-core", kind: "favorite" });
    expect(note).toMatchObject({ placeId: "place-eastvale-core", stickerId: sticker.id });
    expect(() =>
      createVoxelSticker(riversideDemoVoxelScene, {
        placeId: "missing-place",
        kind: "idea",
      }),
    ).toThrow(/Unknown voxel place/);
  });

  it("serializes session-only stickers and notes without persistence claims", () => {
    const sticker = createVoxelSticker(riversideDemoVoxelScene, {
      placeId: "place-plaza-row",
      kind: "idea",
    });
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-plaza-row",
      stickerId: sticker.id,
      body: "Try a shop sticker here.",
    });
    const payload = JSON.parse(
      serializeVoxelMapSession(riversideDemoVoxelScene, {
        selectedPlaceId: "place-plaza-row",
        stickers: [sticker],
        notes: [note],
      }),
    );

    expect(payload.scope).toBe("session");
    expect(payload.sceneId).toBe(riversideDemoVoxelScene.id);
    expect(payload.stickers).toHaveLength(1);
    expect(payload.notes).toHaveLength(1);
  });
});
