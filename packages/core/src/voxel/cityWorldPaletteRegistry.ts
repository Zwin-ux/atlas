import type { CityWorldBuilding } from "./cityWorldTypes.js";
import { REGIONAL_BUILDING_PALETTES } from "./cityWorldRegionalPalettes.js";

/**
 * Effective building palette registry.
 *
 * The renderer resolves every building's body/roof color through the shared
 * atlas manifest (`packages/assets/city-world/atlas.manifest.json`): the
 * manifest palette WINS and the authored per-building scene-data color is only
 * a fallback for keys the manifest does not know. Honest clone/variant
 * diagnostics therefore have to key on the SAME resolution, or they measure
 * data the player never sees.
 *
 * This table is a core-side mirror of every `building.*` palette in the atlas
 * manifest. `scripts/verify-public-object-kit-prefab-palette.mjs` asserts the
 * two stay byte-identical, so the registry cannot silently drift from what the
 * renderer draws.
 */

export type CityWorldBuildingPaletteColors = {
  base: string;
  shade: string;
  highlight: string;
  accent?: string;
  roof?: string;
  trim?: string;
};

export const CITY_WORLD_BUILDING_PALETTES: Record<string, CityWorldBuildingPaletteColors> = {
  "building.apartment.4": { base: "#ead7bb", shade: "#c7aa8a", highlight: "#fff4d8", roof: "#6d8f6f", trim: "#26332c" },
  "building.apartment.5": { base: "#e7c9a8", shade: "#bd9871", highlight: "#fff4d8", roof: "#567d8c", trim: "#26332c" },
  "building.civic.1": { base: "#f3dfbd", shade: "#cdb283", highlight: "#fff2d2", roof: "#628fa3", trim: "#f0c451" },
  "building.gym.2": { base: "#d7e7ef", shade: "#a8c5d3", highlight: "#ffffff", roof: "#c26a52", trim: "#26332c" },
  "building.home.0": { base: "#f5e6ca", shade: "#d6bd98", highlight: "#fff1b5", roof: "#c26a52", trim: "#7e5b3b" },
  "building.home.1": { base: "#f1dcb9", shade: "#cba981", highlight: "#fff1b5", roof: "#6b91a8", trim: "#7e5b3b" },
  "building.home.2": { base: "#ecd1ae", shade: "#c49d75", highlight: "#fff1b5", roof: "#7da172", trim: "#7e5b3b" },
  "building.home.3": { base: "#fff0cf", shade: "#d6bd98", highlight: "#fff8da", roof: "#cfae62", trim: "#7e5b3b" },
  "building.home.4": { base: "#f5e6ca", shade: "#d6bd98", highlight: "#fff1b5", roof: "#b98352", trim: "#7e5b3b" },
  "building.home.5": { base: "#f1dcb9", shade: "#cba981", highlight: "#fff1b5", roof: "#8b7295", trim: "#7e5b3b" },
  "building.house.cottage.v1": { base: "#f5e6ca", shade: "#d6bd98", highlight: "#fff8da", roof: "#c26a52", trim: "#7e5b3b" },
  "building.house.cottage.v2": { base: "#efd9b8", shade: "#cdb489", highlight: "#fff2d6", roof: "#7d9a86", trim: "#7e5b3b" },
  "building.house.cottage.v3": { base: "#f0dcc4", shade: "#ccb489", highlight: "#fff4da", roof: "#6f8fa8", trim: "#7e5b3b" },
  "building.house.cottage.v4": { base: "#ecdcc0", shade: "#c9b58c", highlight: "#fff3d4", roof: "#b08a5a", trim: "#7e5b3b" },
  "building.house.ranch.v1": { base: "#ecd1ae", shade: "#c49d75", highlight: "#fff1b5", roof: "#7da172", trim: "#7e5b3b" },
  "building.house.ranch.v2": { base: "#e8cfad", shade: "#c09a73", highlight: "#fff0b8", roof: "#a9704f", trim: "#7e5b3b" },
  "building.house.ranch.v3": { base: "#ecd6b6", shade: "#c3a37b", highlight: "#fff3c2", roof: "#5f7f8e", trim: "#7e5b3b" },
  "building.house.rowhome.flat_parapet.v1": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#8ab0c5", trim: "#3f7596" },
  "building.house.rowhome.flat_parapet.v2": { base: "#eed9c0", shade: "#c9ac88", highlight: "#fff2d4", roof: "#6f7d8f", trim: "#3f5566" },
  "building.apartment.lowrise.stepped.v1": { base: "#ead7bb", shade: "#c7aa8a", highlight: "#fff4d8", roof: "#6d8f6f", trim: "#26332c" },
  "building.apartment.lowrise.stepped.v2": { base: "#e7cfae", shade: "#c3a37c", highlight: "#fff1d0", roof: "#587a8e", trim: "#26332c" },
  "building.apartment.lowrise.stepped.v3": { base: "#e3d0b4", shade: "#bfa47e", highlight: "#fff1d2", roof: "#8a6f95", trim: "#26332c" },
  "building.store.strip.three_bay.v1": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#82a4c4", trim: "#5b9fcb" },
  "building.store.strip.three_bay.v2": { base: "#efdcc0", shade: "#c9ac88", highlight: "#fff2d4", roof: "#c48a5a", trim: "#a8703f" },
  "building.store.strip.three_bay.v3": { base: "#eedcc4", shade: "#c8b189", highlight: "#fff3d6", roof: "#6f9a86", trim: "#4f7d6a" },
  "building.gym.sawtooth.v1": { base: "#d7e7ef", shade: "#a8c5d3", highlight: "#ffffff", roof: "#c26a52", trim: "#26332c" },
  "building.gym.sawtooth.v2": { base: "#d3e2ea", shade: "#a3c0cf", highlight: "#fbffff", roof: "#5f8fa6", trim: "#26332c" },
  "building.venue.anaheim_convention_center.v1": { base: "#f0d9ab", shade: "#c8ae7c", highlight: "#fff0c8", roof: "#97bcc9", trim: "#4e8298" },
  "building.shop.1": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#cfa057", trim: "#5b9fcb" },
  "building.shop.2": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#c37481", trim: "#cfa057" },
  ...REGIONAL_BUILDING_PALETTES,
};

/** Mirror of the renderer's `FALLBACK_PALETTES.building` (no roof entry). */
export const CITY_WORLD_FALLBACK_BUILDING_PALETTE: CityWorldBuildingPaletteColors = {
  base: "#f2dfc2",
  shade: "#cdb18c",
  highlight: "#fff4d8",
  accent: "#fff4d8",
  trim: "#cdb18c",
};

/** Mirror of the renderer's hard default roof for draft buildings without palette roof. */
const DRAFT_DEFAULT_ROOF = "#8c9b75";

export type CityWorldEffectiveBuildingColors = {
  bodyColor: string;
  roofColor: string;
};

/**
 * Resolve the colors a building actually renders with, mirroring
 * `createBuildingGeometry` in `web/src/CityWorldRenderer.tsx`:
 * - hidden-draft buildings (`draft-building-*`) keep their authored colors;
 * - every other building resolves through the manifest palette first and only
 *   falls back to the authored scene-data color when the palette has no entry.
 */
export function resolveEffectiveBuildingColors(building: CityWorldBuilding): CityWorldEffectiveBuildingColors {
  const palette = building.paletteKey ? CITY_WORLD_BUILDING_PALETTES[building.paletteKey] : undefined;

  if (building.id.startsWith("draft-building-")) {
    return {
      bodyColor: (building.bodyColor ?? palette?.base ?? CITY_WORLD_FALLBACK_BUILDING_PALETTE.base).toLowerCase(),
      roofColor: (building.roofColor ?? palette?.roof ?? DRAFT_DEFAULT_ROOF).toLowerCase(),
    };
  }

  const resolved = palette ?? CITY_WORLD_FALLBACK_BUILDING_PALETTE;
  return {
    bodyColor: (resolved.base ?? building.bodyColor).toLowerCase(),
    roofColor: (resolved.roof ?? building.roofColor).toLowerCase(),
  };
}
