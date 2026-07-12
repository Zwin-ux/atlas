import { Assets, Texture } from "pixi.js";
import {
  validateCityWorldSceneAtlasKeys,
  type CityWorldAtlasFallbackKind,
  type CityWorldAtlasManifest,
  type CityWorldAtlasPalette,
  type CityWorldAtlasValidationResult,
  type CityWorldScene,
} from "@atlas/core/voxel";
import atlasManifestJson from "../../packages/assets/city-world/atlas.manifest.json";
import rowhomeFlatParapetUrl from "../../packages/assets/city-world/textures/building-house-rowhome-flat_parapet.v1.svg";
import stripStoreThreeBayUrl from "../../packages/assets/city-world/textures/building-store-strip-three_bay.v1.svg";
import favoriteStickerPinUrl from "../../packages/assets/city-world/textures/pin-sticker-favorite.svg";
import roadCornerTwoLaneUrl from "../../packages/assets/city-world/textures/road-corner-two_lane.v1.svg";

export type CityWorldTextureMap = Partial<Record<string, Texture>>;

export type ResolvedCityWorldAsset =
  | {
      mode: "sprite";
      key: string;
      texture: Texture;
      anchor: { x: number; y: number };
      scale: number;
      fallback: CityWorldAtlasFallbackKind;
      palette: CityWorldAtlasPalette;
    }
  | {
      mode: "primitive";
      key?: string;
      fallback: CityWorldAtlasFallbackKind;
      palette: CityWorldAtlasPalette;
      missingManifestEntry: boolean;
    };

export type CityWorldAtlasResolver = {
  manifest: CityWorldAtlasManifest;
  validation: CityWorldAtlasValidationResult;
  resolveAsset: (spriteKey: string | undefined, paletteKey: string | undefined, fallback: CityWorldAtlasFallbackKind) => ResolvedCityWorldAsset;
  resolvePalette: (paletteKey: string | undefined, fallback: CityWorldAtlasFallbackKind) => CityWorldAtlasPalette;
};

const CITY_WORLD_ATLAS_MANIFEST = atlasManifestJson as CityWorldAtlasManifest;
const warnedSceneIds = new Set<string>();
const TEXTURE_SOURCES = {
  "building.house.rowhome.flat_parapet.v1": rowhomeFlatParapetUrl,
  "building.store.strip.three_bay.v1": stripStoreThreeBayUrl,
  "pin.sticker.favorite": favoriteStickerPinUrl,
  "road.corner.two_lane.v1": roadCornerTwoLaneUrl,
} as const;

const FALLBACK_PALETTES: Record<CityWorldAtlasFallbackKind, CityWorldAtlasPalette> = {
  terrain: createFallbackPalette("fallback.terrain", "#a3b877", "#6d824f", "#dde5b4"),
  road: createFallbackPalette("fallback.road", "#646f69", "#46534e", "#f8e8a6"),
  lot: createFallbackPalette("fallback.lot", "#bdcd90", "#97a874", "#fff4d8"),
  building: createFallbackPalette("fallback.building", "#f2dfc2", "#cdb18c", "#fff4d8"),
  prop: createFallbackPalette("fallback.prop", "#3d7a49", "#26332c", "#dde5b4"),
  actor: createFallbackPalette("fallback.actor", "#426f9f", "#26332c", "#f7f0df"),
  marker: createFallbackPalette("fallback.marker", "#ffcf56", "#26332c", "#fff3ba"),
};

export function createCityWorldAtlasResolver(scene: CityWorldScene, textures: CityWorldTextureMap = {}): CityWorldAtlasResolver {
  const validation = validateCityWorldSceneAtlasKeys(scene, CITY_WORLD_ATLAS_MANIFEST);

  if (!validation.ok && !warnedSceneIds.has(scene.id)) {
    warnedSceneIds.add(scene.id);
    console.warn("Atlas city-world atlas validation failed.", validation);
  }

  return {
    manifest: CITY_WORLD_ATLAS_MANIFEST,
    validation,
    resolveAsset: (spriteKey, paletteKey, fallback) => {
      const sprite = spriteKey ? CITY_WORLD_ATLAS_MANIFEST.sprites[spriteKey] : undefined;
      const texture = spriteKey ? textures[spriteKey] : undefined;
      const inferredFallback = sprite?.fallback ?? inferFallbackKind(spriteKey) ?? fallback;
      const palette = resolvePalette(paletteKey, inferredFallback);

      if (sprite && texture) {
        return {
          mode: "sprite",
          key: sprite.key,
          texture,
          anchor: sprite.anchor,
          scale: sprite.scale ?? 1,
          fallback: inferredFallback,
          palette,
        };
      }

      return {
        mode: "primitive",
        ...(spriteKey ? { key: spriteKey } : {}),
        fallback: inferredFallback,
        palette,
        missingManifestEntry: Boolean(spriteKey && !sprite && !isAllowedPrimitiveFallback(spriteKey)),
      };
    },
    resolvePalette,
  };
}

// data: URIs must load through an Image element, NOT Assets.load — Pixi's
// loader fetch()es the src, and ChatGPT's sandbox CSP (connect-src) blocks
// data: fetches while img-src allows them (G8-7: three curated textures
// silently failed in real ChatGPT while passing in the emulator).
function loadTextureViaImage(src: string): Promise<Texture> {
  return new Promise((resolvePromise, rejectPromise) => {
    const image = new Image();
    image.onload = () => resolvePromise(Texture.from(image));
    image.onerror = () => rejectPromise(new Error("image decode failed"));
    image.src = src;
  });
}

export async function loadCityWorldAtlasTextures(): Promise<CityWorldTextureMap> {
  const loaded = await Promise.all(
    Object.entries(TEXTURE_SOURCES).map(async ([alias, src]) => {
      try {
        const texture = src.startsWith("data:")
          ? await loadTextureViaImage(src)
          : await Assets.load<Texture>({ alias, src });
        return [alias, texture] as const;
      } catch (error) {
        console.warn(`Atlas city-world texture ${alias} failed to load. Primitive fallback remains active.`, error);
        return undefined;
      }
    }),
  );

  return Object.fromEntries(loaded.filter((entry): entry is readonly [string, Texture] => Boolean(entry))) as CityWorldTextureMap;
}

function resolvePalette(paletteKey: string | undefined, fallback: CityWorldAtlasFallbackKind): CityWorldAtlasPalette {
  if (paletteKey) {
    const palette = CITY_WORLD_ATLAS_MANIFEST.palettes[paletteKey];
    if (palette) return palette;
  }
  return FALLBACK_PALETTES[fallback];
}

function isAllowedPrimitiveFallback(key: string): boolean {
  return (CITY_WORLD_ATLAS_MANIFEST.primitiveFallbackPrefixes ?? []).some((prefix) => key.startsWith(prefix));
}

function inferFallbackKind(key: string | undefined): CityWorldAtlasFallbackKind | undefined {
  if (!key) return undefined;
  if (key.startsWith("tile.")) return "terrain";
  if (key.startsWith("road.")) return "road";
  if (key.startsWith("lot.")) return "lot";
  if (key.startsWith("building.")) return "building";
  if (key.startsWith("prop.")) return "prop";
  if (key.startsWith("actor.")) return "actor";
  if (key.startsWith("pin.") || key.startsWith("marker.")) return "marker";
  return undefined;
}

function createFallbackPalette(key: string, base: string, shade: string, highlight: string): CityWorldAtlasPalette {
  return {
    key,
    colors: {
      base,
      shade,
      highlight,
      accent: highlight,
      trim: shade,
    },
  };
}
