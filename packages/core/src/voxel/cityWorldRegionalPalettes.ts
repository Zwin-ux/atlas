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
  variantOffset?: 0 | 1 | 2;
  terrainTone: {
    paletteKey: string;
    base: string;
    shade: string;
    highlight: string;
    accent: string;
  };
};

// Claymation regional palettes — matte plasticine bodies/roofs toward
// artifacts/claymation-refs (soft chalk walls, chunky roof pigment). Still
// must keep archetype distinctness for palette parity floors.
export const REGIONAL_PALETTES: Record<GeneratedDistrictArchetype, RegionalPalette> = {
  metro_grid: {
    archetype: "metro_grid",
    // Soft concrete clay + cool steel roofs (not plastic grey).
    body: ["#c4bfb4", "#b8c0c4", "#9eb8c0"],
    roof: ["#6a7174", "#3a4550", "#b87a52"],
    terrainTone: {
      paletteKey: "terrain.region.metro_grid",
      base: "#8a928e",
      shade: "#6a726e",
      highlight: "#d0d4cc",
      accent: "#7a807c",
    },
  },
  coastal_grid: {
    archetype: "coastal_grid",
    // Sand-cream stucco clay + blue slate roofs (suburban-clay ref family).
    body: ["#f6edd8", "#e2d0a8", "#eef4ea"],
    roof: ["#3a5f7a", "#4a8a8c", "#6e7a82"],
    terrainTone: {
      paletteKey: "terrain.region.coastal_grid",
      base: "#dccfa4",
      shade: "#b8ac7c",
      highlight: "#f4e8c4",
      accent: "#86aa94",
    },
  },
  desert_basin: {
    archetype: "desert_basin",
    // Warm adobe clay + terracotta roofs (desert-basin-clay ref).
    body: ["#e0bc8a", "#d49a6c", "#f0d8a4"],
    roof: ["#c06840", "#9a5238", "#d08050"],
    terrainTone: {
      paletteKey: "terrain.region.desert_basin",
      base: "#d4c088",
      shade: "#b09462",
      highlight: "#f0e2b4",
      accent: "#96a874",
    },
  },
  mountain_valley: {
    archetype: "mountain_valley",
    // Timber-clay brown + forest moss roofs.
    body: ["#9a7a58", "#7e6a50", "#7e865c"],
    roof: ["#5e6a72", "#2e5840", "#5a5e5c"],
    terrainTone: {
      paletteKey: "terrain.region.mountain_valley",
      base: "#567848",
      shade: "#3a5438",
      highlight: "#b0c098",
      accent: "#868a7e",
    },
  },
  prairie_town: {
    archetype: "prairie_town",
    // Wheat barn clay + barn-red / tin roofs.
    body: ["#e0c46a", "#b85a48", "#f0e2c0"],
    roof: ["#b0483a", "#9a9e96", "#6a8a54"],
    terrainTone: {
      paletteKey: "terrain.region.prairie_town",
      base: "#a8b258",
      shade: "#7e883e",
      highlight: "#e0e690",
      accent: "#947656",
    },
  },
  river_town: {
    archetype: "river_town",
    // Cool river-slate clay body + deep navy roofs + cyan bank terrain.
    // Must stay distinct from metro cool concrete, prairie warm brick, and
    // mountain olive (ship + unit palette-distinctness floors).
    body: ["#7898a2", "#6a8e9a", "#94aea8"],
    roof: ["#1e4264", "#1a3a58", "#2a5640"],
    terrainTone: {
      paletteKey: "terrain.region.river_town",
      base: "#24949e",
      shade: "#1a6870",
      highlight: "#78ccd4",
      accent: "#748a5c",
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
  const variant = (bodyIndex + roofIndex + (palette.variantOffset ?? 0)) % palette.body.length;
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
