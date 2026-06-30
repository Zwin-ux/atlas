# Atlas Asset Pack Spec

## Purpose

Atlas needs an original city-map asset system that can replace Pixi primitives
without changing the map-first ChatGPT app experience.

The current visual target is a full-screen isometric city map with tiny HUD
overlays. This spec should support `CityWorldScene` and the E7.2 atlas readiness
lane, not the older report/dashboard surface.

## Asset lanes

### Reference
Mood boards and concept images. These are for inspiration only.

### Original production assets
Assets that Atlas can ship.

## Required Alpha assets

### App identity
- Atlas app icon
- Atlas wordmark placeholder
- Clawd paw/compass mark
- city map pin
- sticker badge set
- note marker

### Clawd states
- idle
- walking
- inspecting
- happy
- waiting
- hosted mode placeholder

### City-world tiles and sprites
- grass, park, plaza, sidewalk, water fill, and water edge tiles
- road straight, intersection, driveway, curb, lane mark, and crosswalk details
- suburban homes
- storefront shops
- gym building
- apartment building
- civic landmark
- trees, bushes, benches, streetlights, shop signs, parked cars, water shimmer
- tiny cars and walkers
- selected ring, hover glow, city pin, sticker badges, note marker

## Style

High-quality isometric voxel/pixel hybrid.
Colorful city map first, not dark dashboard chrome.
Readable silhouettes, warm terrain, bright civic accents, and restrained HUD
materials.
Clawd should feel like a local map companion, not a generic mascot.
Avoid copying OpenAI/Codex/third-party pet assets.

Avoid tactical, campaign, report, or generic SaaS visual language.

## Output formats

For Codex placeholder stage:
- SVG icons
- simple PNG exports optional
- JSON manifest

For final art stage:
- PNG/WebP sprites
- SVG icons
- sprite sheet metadata
- favicon/app icon sizes

For E7.2:
- `packages/assets/city-world/atlas.manifest.json`
- stable `spriteKey` and `paletteKey` coverage for current `CityWorldScene`
- primitive fallback for missing texture art

For E7.4:
- `packages/assets/city-world/textures/pin-sticker-favorite.svg`
- manifest `frame`, `anchor`, and `scale` metadata for `pin.sticker.favorite`
- web bundle inlines SVG textures as data URLs for the ChatGPT widget
- Pixi loads sprite textures through `Assets.load`
- resolver returns sprite mode only after texture load; primitive fallback remains
  the baseline for missing texture art
