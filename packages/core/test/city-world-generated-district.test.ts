import { describe, expect, it } from "vitest";
import {
  GENERATED_DISTRICT_ARCHETYPES,
  REGIONAL_PALETTES,
  compileCityWorldSceneWindow,
  createDeterministicGeneratedDistrictScene,
  createDeterministicGeneratedDistrictSpec,
  evaluateCityWorldSceneWindowBudget,
  resolveEffectiveBuildingColors,
  US_COUNTY_INDEX,
} from "../src/index.js";
import type { CityWorldScene, GeneratedDistrictArchetype } from "../src/index.js";

const PALETTE_DISTINCTNESS_FLOOR = 0.16;

describe("deterministic generated district specs", () => {
  it("compiles repeatable provider-free district specs from Census county identity", () => {
    const cook = county("cook-il");
    const first = createDeterministicGeneratedDistrictSpec({ county: cook });
    const second = createDeterministicGeneratedDistrictSpec({ county: cook });
    const maricopa = createDeterministicGeneratedDistrictSpec({ county: county("maricopa-az") });

    expect(first).toEqual(second);
    expect(first.seed).not.toBe(maricopa.seed);
    expect(first.sourceBasis).toBe("census_identity_only");
    expect(first.providerGeometry).toBe(false);
    expect(first.publicPlayable).toBe(false);
    expect(first.promotionBlocked).toBe(true);
    expect(first.spec.roadSeeds.length).toBeGreaterThanOrEqual(6);
    expect(first.spec.zones.length).toBeGreaterThanOrEqual(9);
  });

  it("produces bounded non-playable scenes that pass generated draft window budgets", () => {
    for (const countySlug of ["cook-il", "miami-dade-fl", "maricopa-az", "riverside-ca"]) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: county(countySlug) });
      const { scene } = result;

      expect(generated.publicPlayable).toBe(false);
      expect(scene.coverage).toMatchObject({
        countySlug,
        coverageTier: "L1_COUNTY_SHELL",
        playable: false,
      });
      expect(scene.terrainTiles.length).toBeGreaterThan(1_200);
      expect(scene.roadSegments.length).toBeGreaterThanOrEqual(6);
      // 0.75R: floors rebased on the fable parametric generator (fewer,
      // larger authored-mass lots: 18-21 lots / 17-19 buildings observed).
      expect(scene.lots.length).toBeGreaterThan(15);
      expect(scene.buildings.length).toBeGreaterThan(15);
      expect(scene.places.length).toBeGreaterThanOrEqual(6);
      expect(scene.pins).toHaveLength(0);
      expect(scene.actors).toHaveLength(0);
      expect(scene.cameraPresets.map((preset) => preset.id)).toEqual(
        expect.arrayContaining(["desktop", "mobile", "residential_detail", "commerce_detail"]),
      );

      for (const cameraId of ["desktop", "mobile"] as const) {
        const window = compileCityWorldSceneWindow(scene, cameraId);
        const budget = evaluateCityWorldSceneWindowBudget(window, "generated_draft_window", scene);
        expect(budget.blockers).toEqual([]);
        expect(budget.passed).toBe(true);
      }
    }
  });

  it("resolves measurably distinct regional palettes for every generated archetype (0.76-1)", () => {
    const signatures = new Map<GeneratedDistrictArchetype, RegionalPaletteSignature>();

    for (const archetype of GENERATED_DISTRICT_ARCHETYPES) {
      const { generated, result } = createDeterministicGeneratedDistrictScene({ county: countyForArchetype(archetype) });
      expect(generated.archetype).toBe(archetype);
      expect(generated.spec.regionalPalette).toEqual(REGIONAL_PALETTES[archetype]);

      const signature = dominantRegionalPaletteSignature(result.scene, archetype);
      expect(signature.terrainPaletteKey).toBe(REGIONAL_PALETTES[archetype].terrainTone.paletteKey);
      expect(signature.bodyColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(signature.roofColor).toMatch(/^#[0-9a-f]{6}$/);
      signatures.set(archetype, signature);
    }

    for (let firstIndex = 0; firstIndex < GENERATED_DISTRICT_ARCHETYPES.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < GENERATED_DISTRICT_ARCHETYPES.length; secondIndex += 1) {
        const first = GENERATED_DISTRICT_ARCHETYPES[firstIndex] as GeneratedDistrictArchetype;
        const second = GENERATED_DISTRICT_ARCHETYPES[secondIndex] as GeneratedDistrictArchetype;
        const distance = regionalPaletteDistance(signatures.get(first)!, signatures.get(second)!);
        expect(distance).toBeGreaterThanOrEqual(PALETTE_DISTINCTNESS_FLOOR);
      }
    }
  });
});

function county(countySlug: string) {
  const entry = US_COUNTY_INDEX.find((candidate) => candidate.countySlug === countySlug);
  if (!entry) throw new Error(`Missing test county ${countySlug}`);
  return entry;
}

function countyForArchetype(archetype: GeneratedDistrictArchetype) {
  const entry = US_COUNTY_INDEX.find(
    (candidate) => createDeterministicGeneratedDistrictSpec({ county: candidate }).archetype === archetype,
  );
  if (!entry) throw new Error(`Missing county fixture for generated archetype ${archetype}`);
  return entry;
}

type RegionalPaletteSignature = {
  archetype: GeneratedDistrictArchetype;
  bodyColor: string;
  roofColor: string;
  terrainColor: string;
  terrainPaletteKey: string;
};

function dominantRegionalPaletteSignature(scene: CityWorldScene, archetype: GeneratedDistrictArchetype): RegionalPaletteSignature {
  const effectiveBuildingColors = scene.buildings.map((building) => resolveEffectiveBuildingColors(building));
  const terrainPaletteKey = dominant(
    scene.terrainTiles.filter((tile) => tile.kind !== "water").map((tile) => tile.paletteKey ?? ""),
  );

  return {
    archetype,
    bodyColor: dominant(effectiveBuildingColors.map((colors) => colors.bodyColor)),
    roofColor: dominant(effectiveBuildingColors.map((colors) => colors.roofColor)),
    terrainColor: REGIONAL_PALETTES[archetype].terrainTone.base.toLowerCase(),
    terrainPaletteKey,
  };
}

function regionalPaletteDistance(first: RegionalPaletteSignature, second: RegionalPaletteSignature): number {
  return roundMetric(
    (colorDistance(first.bodyColor, second.bodyColor) +
      colorDistance(first.roofColor, second.roofColor) +
      colorDistance(first.terrainColor, second.terrainColor)) /
      3,
  );
}

function colorDistance(first: string, second: string): number {
  const a = parseHexColor(first);
  const b = parseHexColor(second);
  return Math.sqrt(((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / (3 * 255 ** 2));
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.toLowerCase().replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function dominant(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const winner = [...counts.entries()].sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))[0];
  if (!winner) throw new Error("Cannot resolve dominant palette from an empty list");
  return winner[0];
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
