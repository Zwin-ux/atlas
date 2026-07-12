# Atlas Brand Assets

Atlas uses a compact isometric voxel house on a county block. The mark should feel like a cropped piece of the product map: orange roof, sand walls, green terrain, one road, one tree. It is not a mascot, globe, pin, badge, or letterform.

## Palette

The icon source SVG uses exactly seven flat fill colors.

| Token | Hex | Use |
| --- | --- | --- |
| Terrain top | `#A3B877` | sunlit county slab and wordmark accent |
| Deep ink | `#26332C` | slab cliff faces, road, trunk, door, and wordmark text |
| Tree green | `#3E8C4E` | round voxel tree canopy |
| Roof sun | `#D8743F` | warm roof face |
| Roof shade | `#AD5137` | shaded roof face |
| Wall sun | `#F1D7A6` | light sand wall face and road dash |
| Wall shade | `#BE8E62` | shaded sand wall face |

## Clear Space

Keep the icon content inside the central 80% of the square canvas. Use at least one terrain-slab side height as clear space around the wordmark glyph and at least the width of the small glyph between glyph and text.

## Do

- Use the hand-authored SVG as the source of truth.
- Keep the house as the hero silhouette.
- Preserve the orange roof as the strongest accent.
- Keep the road as one continuous strip, not separate dashes.
- Render PNGs with `node scripts/render-brand-assets.mjs`.

## Don't

- Do not add gradients, glows, drop shadows, rounded blob containers, badges, labels, humans, cars, or mascots.
- Do not use map pins, globes, sparkles, neural motifs, or an `A` monogram as the primary mark.
- Do not add extra detail that disappears at 32px.
