# Atlas Packet Brand Iteration 2 Result

## Iteration Log

Loop 1:
- Replaced the rejected three-building slab with one chunky voxel house, an orange two-tone roof, sand walls, one tree, and a clipped road strip.
- Render gate passed with spawned Chrome PID `28048`.
- 32px read: the icon read as an orange-roof house on a green block. The road was still too quiet.

Loop 2:
- Widened and raised the road band, shortened the house walls, and switched the shared dark back to Atlas ink `#26332C`.
- Render gate passed with spawned Chrome PID `2900`.
- 32px read: the house read clearly, but the larger check showed the road was still collapsing into the foreground cliff value.

Loop 3:
- Moved the house slightly up and left, narrowed the house footprint, and moved the road out from under the main body.
- Render gate passed with spawned Chrome PID `7412`.
- 32px read: the orange-roof house still read immediately. The 512px output showed the road, but it remained too small and partly hidden.

Loop 4:
- Drew the road as a foreground top-plane band after the house so it stays continuous instead of being occluded by the body.
- Render gate passed with spawned Chrome PID `26128`.
- 32px read: pass. I can name "house with orange roof on a green block" without squinting. At 512px and 64px, the road is one continuous strip with a single center-line dash.

## Final Palette

The icon source SVG uses seven flat fill colors:

| Token | Hex |
| --- | --- |
| Terrain top | `#A3B877` |
| Deep ink | `#26332C` |
| Tree green | `#3E8C4E` |
| Roof sun | `#D8743F` |
| Roof shade | `#AD5137` |
| Wall sun | `#F1D7A6` |
| Wall shade | `#BE8E62` |

The wordmark was kept because the terrain accent remains `#A3B877`.

## Render Gate

`node scripts/render-brand-assets.mjs` exit `0`.

Final generated PNG byte sizes:

```text
assets\brand\atlas-icon-512.png 512x512 12596 bytes
assets\brand\atlas-icon-256.png 256x256 6514 bytes
assets\brand\atlas-icon-128.png 128x128 3750 bytes
assets\brand\atlas-icon-64.png 64x64 2065 bytes
assets\brand\atlas-icon-32.png 32x32 978 bytes
```

## Files

- `assets/brand/atlas-icon.svg`
- `assets/brand/atlas-icon-512.png`
- `assets/brand/atlas-icon-256.png`
- `assets/brand/atlas-icon-128.png`
- `assets/brand/atlas-icon-64.png`
- `assets/brand/atlas-icon-32.png`
- `assets/brand/BRAND.md`
- `artifacts/council/CODEX_RESULT_BRAND2.md`

`scripts/render-brand-assets.mjs` and `assets/brand/atlas-wordmark.svg` were not changed.

## Risks

- The road shares `#26332C` with the slab cliff faces to keep the source SVG at seven colors. It is now a continuous foreground band, but it will still be subordinate to the house at 32px.
- The tree is intentionally simple; at favicon size it reads mainly as a second green mass beside the house.
- The viewer may show transparent PNGs on black, but the files themselves keep a transparent background.

## Process Safety

No `git add`, commit, or push was run. No `Stop-Process` or `taskkill` command was run. The only spawned PIDs were the Chrome processes reported by `scripts/render-brand-assets.mjs`, and the script used its own cleanup path.
