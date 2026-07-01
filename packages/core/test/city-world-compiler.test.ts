import { describe, expect, it } from "vitest";
import {
  compileCityWorldScene,
  createVoxelNote,
  createVoxelSticker,
  riversideDemoVoxelScene,
} from "../src/index.js";

describe("CityWorld compiler", () => {
  it("compiles the Riverside scene into all required city layers", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);

    expect(city.type).toBe("cityWorldScene");
    expect(city.terrainTiles.length).toBeGreaterThan(700);
    expect(city.roadSegments.map((road) => road.kind)).toEqual(expect.arrayContaining(["avenue", "street", "driveway", "crosswalk"]));
    expect(city.lots.map((lot) => lot.kind)).toEqual(expect.arrayContaining(["home", "shop", "park", "gym", "apartments", "civic", "waterfront"]));
    expect(city.buildings.map((building) => building.kind)).toEqual(expect.arrayContaining(["home", "shop", "gym", "apartment", "civic"]));
    const propKinds = city.props.map((prop) => prop.kind);
    const actorKinds = city.actors.map((actor) => actor.kind);

    expect(propKinds).toEqual(expect.arrayContaining(["tree", "bush", "water_shimmer"]));
    expect(propKinds).not.toEqual(expect.arrayContaining(["bench", "streetlight", "parked_car", "fountain", "sign", "cloud"]));
    expect(actorKinds).toEqual(["clawd"]);
    expect(actorKinds).not.toEqual(expect.arrayContaining(["car", "walker"]));
  });

  it("adds atlas-ready metadata to city world objects", () => {
    const sticker = createVoxelSticker(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      kind: "favorite",
      label: "Start",
    });
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-eastvale-core",
      body: "Remember this spot.",
    });
    const city = compileCityWorldScene(riversideDemoVoxelScene, {
      stickers: [sticker],
      notes: [note],
    });
    const authoredObjects = [
      ...city.terrainTiles.slice(0, 12),
      ...city.roadSegments,
      ...city.lots,
      ...city.buildings,
      ...city.props,
      ...city.actors,
      ...city.pins,
    ];

    for (const object of authoredObjects) {
      expect(object.spriteKey).toMatch(/[a-z]+\./);
      expect(object.paletteKey).toMatch(/[a-z]+\./);
      expect(object.detailLevel).toBeDefined();
    }

    expect(city.buildings.map((building) => building.roofShape)).toEqual(expect.arrayContaining(["gable", "hip", "flat", "sawtooth", "tower"]));
    expect(city.buildings.map((building) => building.facadeStyle)).toEqual(expect.arrayContaining(["suburban", "storefront", "fitness", "apartment", "civic"]));
  });

  it("gives every clickable place a valid city anchor", () => {
    const city = compileCityWorldScene(riversideDemoVoxelScene);

    expect(city.places.map((place) => place.label)).toEqual(expect.arrayContaining(["Eastvale Core", "Gym", "Apartments", "Community Park"]));
    for (const place of city.places) {
      expect(Number.isFinite(place.anchor.x)).toBe(true);
      expect(Number.isFinite(place.anchor.y)).toBe(true);
      expect(place.hitRadius).toBeGreaterThan(1);
    }
  });

  it("places session stickers and notes as pins and rejects missing references", () => {
    const sticker = createVoxelSticker(riversideDemoVoxelScene, {
      placeId: "place-eastvale-gym",
      kind: "favorite",
      label: "Gym check",
    });
    const note = createVoxelNote(riversideDemoVoxelScene, {
      placeId: "place-eastvale-gym",
      stickerId: sticker.id,
      body: "Try this stop.",
    });
    const city = compileCityWorldScene(riversideDemoVoxelScene, {
      selectedPlaceId: "place-eastvale-gym",
      stickers: [sticker],
      notes: [note],
    });

    expect(city.pins.map((pin) => pin.kind)).toEqual(expect.arrayContaining(["favorite", "note"]));
    expect(city.hudDefaults.selectedPlaceId).toBe("place-eastvale-gym");
    expect(() =>
      compileCityWorldScene(riversideDemoVoxelScene, {
        stickers: [{ ...sticker, id: "bad-sticker", placeId: "missing-place" }],
      }),
    ).toThrow(/missing place/);
  });
});
