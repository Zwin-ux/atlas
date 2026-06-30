import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compileCityWorldScene,
  createVoxelNote,
  createVoxelSticker,
  REQUIRED_CITY_WORLD_ATLAS_TAGS,
  riversideDemoVoxelScene,
  validateCityWorldAtlasManifest,
  validateCityWorldSceneAtlasKeys,
} from "../src/index.js";
import type { VoxelStickerKind } from "../src/index.js";

const manifest = JSON.parse(
  readFileSync(new URL("../../../packages/assets/city-world/atlas.manifest.json", import.meta.url), "utf8"),
) as unknown;

describe("CityWorld atlas manifest", () => {
  it("validates the city-world atlas manifest", () => {
    const result = validateCityWorldAtlasManifest(manifest);

    expect(result.errors).toEqual([]);
    expect(result.missingRequiredCategories).toEqual([]);
    expect(result.missingRequiredCategories).not.toEqual(REQUIRED_CITY_WORLD_ATLAS_TAGS);
    expect(result.ok).toBe(true);
  });

  it("validates current Eastvale CityWorldScene atlas keys", () => {
    const stickerKinds: VoxelStickerKind[] = ["home", "shop", "park", "favorite", "idea", "question"];
    const stickers = stickerKinds.map((kind) =>
      createVoxelSticker(riversideDemoVoxelScene, {
        placeId: "place-eastvale-core",
        kind,
        label: kind,
      }),
    );
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      body: "Atlas note.",
    });
    const city = compileCityWorldScene(riversideDemoVoxelScene, {
      stickers,
      notes: [note],
    });

    const result = validateCityWorldSceneAtlasKeys(city, manifest);

    expect(result.errors).toEqual([]);
    expect(result.missingSpriteKeys).toEqual([]);
    expect(result.missingTileKeys).toEqual([]);
    expect(result.missingPaletteKeys).toEqual([]);
    expect(result.missingRequiredCategories).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("reports missing scene keys instead of throwing", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);
    const brokenManifest = {
      ...(manifest as Record<string, unknown>),
      primitiveFallbackPrefixes: [],
      palettes: {},
      sprites: {},
      tiles: {},
    };

    const result = validateCityWorldSceneAtlasKeys(city, brokenManifest);

    expect(result.ok).toBe(false);
    expect(result.missingSpriteKeys.length).toBeGreaterThan(0);
    expect(result.missingTileKeys.length).toBeGreaterThan(0);
    expect(result.missingPaletteKeys.length).toBeGreaterThan(0);
  });
});
