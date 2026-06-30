import type { CityWorldScene } from "./cityWorldTypes.js";

export type CityWorldAtlasKind = "terrain" | "road" | "lot" | "building" | "prop" | "actor" | "marker" | "label";

export type CityWorldAtlasFallbackKind = "terrain" | "road" | "lot" | "building" | "prop" | "actor" | "marker";

export type CityWorldAtlasFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CityWorldAtlasAnchor = {
  x: number;
  y: number;
};

export type CityWorldAtlasPalette = {
  key: string;
  colors: {
    base: string;
    shade: string;
    highlight: string;
    accent?: string;
    roof?: string;
    trim?: string;
  };
};

export type CityWorldAtlasSprite = {
  key: string;
  kind: CityWorldAtlasKind;
  frame?: CityWorldAtlasFrame;
  anchor: CityWorldAtlasAnchor;
  scale?: number;
  tags?: string[];
  fallback: CityWorldAtlasFallbackKind;
};

export type CityWorldAtlasTile = {
  key: string;
  kind: "grass" | "park" | "plaza" | "water" | "sidewalk" | "road";
  variant: number;
  frame?: CityWorldAtlasFrame;
  anchor: CityWorldAtlasAnchor;
  tags?: string[];
};

export type CityWorldAtlasManifest = {
  type: "cityWorldAtlas";
  version: 1;
  id: string;
  label: string;
  textureUrl?: string;
  imageUrl?: string;
  tileSize: {
    width: number;
    height: number;
  };
  primitiveFallbackPrefixes?: string[];
  palettes: Record<string, CityWorldAtlasPalette>;
  sprites: Record<string, CityWorldAtlasSprite>;
  tiles: Record<string, CityWorldAtlasTile>;
};

export type CityWorldAtlasValidationResult = {
  ok: boolean;
  missingSpriteKeys: string[];
  missingPaletteKeys: string[];
  missingTileKeys: string[];
  missingRequiredCategories: string[];
  errors: string[];
  warnings: string[];
};

export const REQUIRED_CITY_WORLD_ATLAS_TAGS = [
  "terrain:grass",
  "terrain:park",
  "terrain:plaza",
  "terrain:water",
  "road:street",
  "road:avenue",
  "road:driveway",
  "road:crosswalk",
  "lot:park",
  "building:home",
  "building:shop",
  "building:gym",
  "building:apartment",
  "building:civic",
  "prop:tree",
  "prop:water",
  "actor:car",
  "actor:walker",
  "actor:clawd",
  "marker:pin",
  "marker:sticker",
] as const;

export function validateCityWorldAtlasManifest(manifest: unknown): CityWorldAtlasValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequiredCategories: string[] = [];

  if (!isRecord(manifest)) {
    return createValidationResult({
      errors: ["Manifest must be an object."],
      warnings,
      missingRequiredCategories,
    });
  }

  if (manifest.type !== "cityWorldAtlas") errors.push("Manifest type must be cityWorldAtlas.");
  if (manifest.version !== 1) errors.push("Manifest version must be 1.");
  if (typeof manifest.id !== "string" || !manifest.id.trim()) errors.push("Manifest id is required.");
  if (typeof manifest.label !== "string" || !manifest.label.trim()) errors.push("Manifest label is required.");
  if (!isRecord(manifest.tileSize)) {
    errors.push("Manifest tileSize is required.");
  } else {
    validatePositiveNumber(manifest.tileSize.width, "tileSize.width", errors);
    validatePositiveNumber(manifest.tileSize.height, "tileSize.height", errors);
  }

  const palettes = readRecord(manifest.palettes, "palettes", errors);
  const sprites = readRecord(manifest.sprites, "sprites", errors);
  const tiles = readRecord(manifest.tiles, "tiles", errors);
  const availableTags = new Set<string>();

  if (manifest.primitiveFallbackPrefixes !== undefined && !isStringArray(manifest.primitiveFallbackPrefixes)) {
    errors.push("primitiveFallbackPrefixes must be an array of strings.");
  }

  for (const [key, value] of Object.entries(palettes)) {
    validatePalette(key, value, errors);
  }

  for (const [key, value] of Object.entries(sprites)) {
    validateSprite(key, value, errors, availableTags);
  }

  for (const [key, value] of Object.entries(tiles)) {
    validateTile(key, value, errors, availableTags);
  }

  for (const tag of REQUIRED_CITY_WORLD_ATLAS_TAGS) {
    if (!availableTags.has(tag)) missingRequiredCategories.push(tag);
  }

  if (Object.keys(sprites).length === 0) warnings.push("Manifest has no sprite entries.");
  if (Object.keys(tiles).length === 0) warnings.push("Manifest has no tile entries.");

  return createValidationResult({
    errors,
    warnings,
    missingRequiredCategories,
  });
}

export function validateCityWorldSceneAtlasKeys(scene: CityWorldScene, manifest: unknown): CityWorldAtlasValidationResult {
  const manifestResult = validateCityWorldAtlasManifest(manifest);
  if (!isCityWorldAtlasManifestShape(manifest)) {
    return manifestResult;
  }

  const spriteKeys = new Set(Object.keys(manifest.sprites));
  const tileKeys = new Set(Object.keys(manifest.tiles));
  const paletteKeys = new Set(Object.keys(manifest.palettes));
  const fallbackPrefixes = manifest.primitiveFallbackPrefixes ?? [];
  const requiredSpriteKeys = new Set<string>();
  const requiredTileKeys = new Set<string>();
  const requiredPaletteKeys = new Set<string>();

  for (const object of [
    ...scene.terrainTiles,
    ...scene.roadSegments,
    ...scene.lots,
    ...scene.buildings,
    ...scene.props,
    ...scene.actors,
    ...scene.pins,
  ]) {
    if (object.spriteKey) {
      if (object.spriteKey.startsWith("tile.")) {
        requiredTileKeys.add(object.spriteKey);
      } else {
        requiredSpriteKeys.add(object.spriteKey);
      }
    }
    if (object.paletteKey) requiredPaletteKeys.add(object.paletteKey);
  }

  const missingSpriteKeys = [...requiredSpriteKeys].filter((key) => !spriteKeys.has(key) && !isAllowedFallbackKey(key, fallbackPrefixes)).sort();
  const missingTileKeys = [...requiredTileKeys].filter((key) => !tileKeys.has(key) && !isAllowedFallbackKey(key, fallbackPrefixes)).sort();
  const missingPaletteKeys = [...requiredPaletteKeys].filter((key) => !paletteKeys.has(key)).sort();

  return createValidationResult({
    errors: manifestResult.errors,
    warnings: manifestResult.warnings,
    missingRequiredCategories: manifestResult.missingRequiredCategories,
    missingSpriteKeys,
    missingPaletteKeys,
    missingTileKeys,
  });
}

function validatePalette(key: string, value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`Palette ${key} must be an object.`);
    return;
  }
  if (value.key !== key) errors.push(`Palette ${key} key must match its record key.`);
  if (!isRecord(value.colors)) {
    errors.push(`Palette ${key} colors are required.`);
    return;
  }
  for (const colorKey of ["base", "shade", "highlight"] as const) {
    if (!isHexColor(value.colors[colorKey])) errors.push(`Palette ${key} colors.${colorKey} must be a hex color.`);
  }
  for (const colorKey of ["accent", "roof", "trim"] as const) {
    const color = value.colors[colorKey];
    if (color !== undefined && !isHexColor(color)) errors.push(`Palette ${key} colors.${colorKey} must be a hex color.`);
  }
}

function validateSprite(key: string, value: unknown, errors: string[], availableTags: Set<string>) {
  if (!isRecord(value)) {
    errors.push(`Sprite ${key} must be an object.`);
    return;
  }
  if (value.key !== key) errors.push(`Sprite ${key} key must match its record key.`);
  if (!isAllowedKind(value.kind, ["terrain", "road", "lot", "building", "prop", "actor", "marker", "label"])) {
    errors.push(`Sprite ${key} has an unsupported kind.`);
  }
  if (!isAllowedKind(value.fallback, ["terrain", "road", "lot", "building", "prop", "actor", "marker"])) {
    errors.push(`Sprite ${key} has an unsupported fallback.`);
  }
  validateAnchor(value.anchor, `Sprite ${key}`, errors);
  validateFrame(value.frame, `Sprite ${key}`, errors);
  if (value.scale !== undefined) validatePositiveNumber(value.scale, `Sprite ${key} scale`, errors);
  collectTags(value.tags, `Sprite ${key}`, errors, availableTags);
}

function validateTile(key: string, value: unknown, errors: string[], availableTags: Set<string>) {
  if (!isRecord(value)) {
    errors.push(`Tile ${key} must be an object.`);
    return;
  }
  if (value.key !== key) errors.push(`Tile ${key} key must match its record key.`);
  if (!isAllowedKind(value.kind, ["grass", "park", "plaza", "water", "sidewalk", "road"])) {
    errors.push(`Tile ${key} has an unsupported kind.`);
  }
  if (!Number.isInteger(value.variant) || Number(value.variant) < 0) errors.push(`Tile ${key} variant must be a non-negative integer.`);
  validateAnchor(value.anchor, `Tile ${key}`, errors);
  validateFrame(value.frame, `Tile ${key}`, errors);
  collectTags(value.tags, `Tile ${key}`, errors, availableTags);
}

function validateAnchor(value: unknown, label: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${label} anchor is required.`);
    return;
  }
  validateFiniteNumber(value.x, `${label} anchor.x`, errors);
  validateFiniteNumber(value.y, `${label} anchor.y`, errors);
}

function validateFrame(value: unknown, label: string, errors: string[]) {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push(`${label} frame must be an object.`);
    return;
  }
  validateFiniteNumber(value.x, `${label} frame.x`, errors);
  validateFiniteNumber(value.y, `${label} frame.y`, errors);
  validatePositiveNumber(value.width, `${label} frame.width`, errors);
  validatePositiveNumber(value.height, `${label} frame.height`, errors);
}

function collectTags(value: unknown, label: string, errors: string[], availableTags: Set<string>) {
  if (value === undefined) return;
  if (!isStringArray(value)) {
    errors.push(`${label} tags must be strings.`);
    return;
  }
  for (const tag of value) availableTags.add(tag);
}

function readRecord(value: unknown, label: string, errors: string[]): Record<string, unknown> {
  if (!isRecord(value)) {
    errors.push(`Manifest ${label} must be an object.`);
    return {};
  }
  return value;
}

function validateFiniteNumber(value: unknown, label: string, errors: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${label} must be a finite number.`);
}

function validatePositiveNumber(value: unknown, label: string, errors: string[]) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) errors.push(`${label} must be a positive number.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function isAllowedKind(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === "string" && allowed.includes(value);
}

function isAllowedFallbackKey(key: string, fallbackPrefixes: readonly string[]): boolean {
  return fallbackPrefixes.some((prefix) => key.startsWith(prefix));
}

function isCityWorldAtlasManifestShape(value: unknown): value is CityWorldAtlasManifest {
  return (
    isRecord(value) &&
    value.type === "cityWorldAtlas" &&
    value.version === 1 &&
    isRecord(value.palettes) &&
    isRecord(value.sprites) &&
    isRecord(value.tiles) &&
    (value.primitiveFallbackPrefixes === undefined || isStringArray(value.primitiveFallbackPrefixes))
  );
}

function createValidationResult(input: {
  errors: string[];
  warnings: string[];
  missingRequiredCategories: string[];
  missingSpriteKeys?: string[];
  missingPaletteKeys?: string[];
  missingTileKeys?: string[];
}): CityWorldAtlasValidationResult {
  const missingSpriteKeys = input.missingSpriteKeys ?? [];
  const missingPaletteKeys = input.missingPaletteKeys ?? [];
  const missingTileKeys = input.missingTileKeys ?? [];
  return {
    ok:
      input.errors.length === 0 &&
      missingSpriteKeys.length === 0 &&
      missingPaletteKeys.length === 0 &&
      missingTileKeys.length === 0 &&
      input.missingRequiredCategories.length === 0,
    missingSpriteKeys,
    missingPaletteKeys,
    missingTileKeys,
    missingRequiredCategories: input.missingRequiredCategories,
    errors: input.errors,
    warnings: input.warnings,
  };
}
