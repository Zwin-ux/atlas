import type { GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";

export const GENERATED_DISTRICT_ARCHETYPES: readonly GeneratedDistrictArchetype[] = [
  "metro_grid",
  "coastal_grid",
  "desert_basin",
  "mountain_valley",
  "prairie_town",
  "river_town",
] as const;

export type RegionalPalette = {
  archetype: GeneratedDistrictArchetype;
  body: readonly [string, string, string];
  roof: readonly [string, string, string];
  terrainTone: {
    paletteKey: string;
    base: string;
    shade: string;
    highlight: string;
    accent: string;
  };
};

export const REGIONAL_PALETTES: Record<GeneratedDistrictArchetype, RegionalPalette> = {
  metro_grid: {
    archetype: "metro_grid",
    body: ["#a9aca6", "#aeb8bd", "#8fb7c2"],
    roof: ["#666d70", "#26313a", "#b77a4f"],
    terrainTone: {
      paletteKey: "terrain.region.metro_grid",
      base: "#7f8987",
      shade: "#626b69",
      highlight: "#c5cbc6",
      accent: "#6e7470",
    },
  },
  coastal_grid: {
    archetype: "coastal_grid",
    body: ["#f4ead6", "#d9c69f", "#e8f0e8"],
    roof: ["#2f526d", "#3f7f82", "#66727a"],
    terrainTone: {
      paletteKey: "terrain.region.coastal_grid",
      base: "#d8cfa7",
      shade: "#b8ac81",
      highlight: "#f2e7c3",
      accent: "#7fa58e",
    },
  },
  desert_basin: {
    archetype: "desert_basin",
    body: ["#d9b27c", "#c98f62", "#ead09a"],
    roof: ["#b65f38", "#8f4b32", "#c77a45"],
    terrainTone: {
      paletteKey: "terrain.region.desert_basin",
      base: "#cdbb82",
      shade: "#a78f5e",
      highlight: "#eadcae",
      accent: "#8fa16f",
    },
  },
  mountain_valley: {
    archetype: "mountain_valley",
    body: ["#8a6a4a", "#6f5b42", "#6f7650"],
    roof: ["#56616a", "#244d34", "#4e514f"],
    terrainTone: {
      paletteKey: "terrain.region.mountain_valley",
      base: "#4f6f3f",
      shade: "#334e31",
      highlight: "#a8b990",
      accent: "#7d8174",
    },
  },
  prairie_town: {
    archetype: "prairie_town",
    body: ["#d6b65e", "#a94f3e", "#ead9b5"],
    roof: ["#a43f32", "#8e938b", "#5f7c48"],
    terrainTone: {
      paletteKey: "terrain.region.prairie_town",
      base: "#9fa94d",
      shade: "#747d39",
      highlight: "#d8df88",
      accent: "#8c6f4c",
    },
  },
  river_town: {
    archetype: "river_town",
    body: ["#8b9275", "#c99a55", "#a8563d"],
    roof: ["#2f5d8a", "#577747", "#9a927d"],
    terrainTone: {
      paletteKey: "terrain.region.river_town",
      base: "#4d8f83",
      shade: "#37675e",
      highlight: "#98beb7",
      accent: "#866f4f",
    },
  },
};

export function regionalBuildingPaletteKey(archetype: GeneratedDistrictArchetype, variant: number): string {
  return `building.region.${archetype}.v${variant + 1}`;
}

export function regionalTerrainPaletteKey(archetype: GeneratedDistrictArchetype): string {
  return REGIONAL_PALETTES[archetype].terrainTone.paletteKey;
}

export function resolveRegionalBuildingPalette(
  palette: RegionalPalette,
  bodyIndex: number,
  roofIndex: number,
): { bodyColor: string; roofColor: string; paletteKey: string; variant: number } {
  const variant = (bodyIndex + roofIndex) % palette.body.length;
  return {
    bodyColor: colorAt(palette.body, variant),
    roofColor: colorAt(palette.roof, variant),
    paletteKey: regionalBuildingPaletteKey(palette.archetype, variant),
    variant,
  };
}

export type RegionalBuildingPaletteColors = {
  base: string;
  shade: string;
  highlight: string;
  roof: string;
  trim: string;
};

export const REGIONAL_BUILDING_PALETTES: Record<string, RegionalBuildingPaletteColors> = Object.fromEntries(
  GENERATED_DISTRICT_ARCHETYPES.flatMap((archetype) => {
    const palette = REGIONAL_PALETTES[archetype];
    return palette.body.map((bodyColor, index) => [
      regionalBuildingPaletteKey(archetype, index),
      {
        base: bodyColor,
        shade: shadeHex(bodyColor, -0.18),
        highlight: shadeHex(bodyColor, 0.18),
        roof: colorAt(palette.roof, index),
        trim: shadeHex(colorAt(palette.roof, index), -0.18),
      },
    ]);
  }),
);

function colorAt(colors: readonly [string, string, string], index: number): string {
  return colors[index] ?? colors[0];
}

function shadeHex(hex: string, amount: number): string {
  const color = parseHexColor(hex);
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(amount >= 0 ? value + (255 - value) * amount : value * (1 + amount))));
  return `#${[channel(color.r), channel(color.g), channel(color.b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}
