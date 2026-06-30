# City World Asset Lane

This folder is the durable asset lane for the Atlas full-screen Pixi city map.

E7.2 uses a fallback-first manifest: scene objects resolve through stable
`spriteKey` and `paletteKey` values now, while current Pixi primitive drawing
continues to render the map until real spritesheets land.

Rules:

- Keep keys deterministic and readable.
- Keep anchors bottom-centered for buildings, props, actors, and pins unless the
  asset has a clear reason to differ.
- Do not add dashboard, report, campaign, or tactical markers here.
- Do not place provider-derived data or secrets in asset manifests.
- Texture art should be bundled or same-origin before it is loaded by the
  renderer.

Current files:

- `atlas.manifest.json` - stable manifest for the current Eastvale city slice.
- `textures/pin-sticker-favorite.svg` - E7.4 real sprite proof for the favorite
  sticker pin. The web bundle loads it as a data URL so the ChatGPT widget does
  not need a broader resource domain.
- `source/` - future art direction and export notes.
