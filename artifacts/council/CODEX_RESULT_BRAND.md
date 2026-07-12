# Atlas Packet Brand Result

## Design Rationale

The icon now treats Atlas as a product crop: a compact isometric county slab with a road crossing and three voxel buildings. The geometry uses the renderer's flat sunlit face language instead of a mascot, pin, globe, sparkle, or monogram. The transparent square keeps the mark quiet in directory chrome while the content stays inside the central safe area.

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| Terrain | `#A3B877` | sunlit county slab and wordmark accent |
| Terrain shade | `#6E8A55` | slab side faces and cool shaded building faces |
| Ink road | `#26332C` | road, wordmark text, structural ink |
| Sun top | `#F0D9AF` | light warm top and sunlit building face |
| Warm wall | `#D6B886` | warm wall planes |
| Clay roof | `#C77652` | single roof accent |

## 32px Legibility Verdict

Pass. I opened `assets/brand/atlas-icon-32.png` after rendering; the road and terrain-block silhouette survive, and the buildings read as a tiny voxel diorama rather than a house-only mark. It is intentionally spare at 32px, with no windows or labels.

## Files

- `assets/brand/atlas-icon.svg`
- `assets/brand/atlas-icon-512.png`
- `assets/brand/atlas-icon-256.png`
- `assets/brand/atlas-icon-128.png`
- `assets/brand/atlas-icon-64.png`
- `assets/brand/atlas-icon-32.png`
- `assets/brand/atlas-wordmark.svg`
- `assets/brand/BRAND.md`
- `scripts/render-brand-assets.mjs`
- `artifacts/council/CODEX_RESULT_BRAND.md`

`chatgpt-app-submission.json` already points at `assets/brand/atlas-icon-512.png`, so it was not changed.

## Gate Tails

`node scripts/render-brand-assets.mjs`

```text
spawnedChromePid=21160
assets\brand\atlas-icon-512.png 512x512 7556 bytes
assets\brand\atlas-icon-256.png 256x256 3958 bytes
assets\brand\atlas-icon-128.png 128x128 2408 bytes
assets\brand\atlas-icon-64.png 64x64 1703 bytes
assets\brand\atlas-icon-32.png 32x32 834 bytes
```

`pnpm typecheck:starter`

```text
$ pnpm build:core && pnpm build:geo && tsc -p server/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
$ pnpm --dir packages/geo build
$ tsc -p tsconfig.json
```

`node scripts/verify-submission.mjs`

```text
Not run for this slice. The verifier does not validate icon path presence; a targeted grep for icon/png/brand terms only found the existing submission JSON icon field.
```

## Process Safety

The renderer script spawned Chrome PID `21160` and stopped it through the script cleanup path. Diagnostic Chrome PIDs spawned during CDP isolation were checked explicitly and were not running: `7640`, `27440`, `12768`, `28888`, `26152`, `15552`.

## Risks

- Transparent PNGs can read quieter on very dark chrome because the road ink is intentionally close to Atlas' renderer ink.
- The wordmark uses a system font fallback stack, so exact text metrics can vary by environment.
