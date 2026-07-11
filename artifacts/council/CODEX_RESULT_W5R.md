# CODEX_RESULT_W5R

## Scope

Implemented the W5 renderer/token a11y subset only:

- W5.3 Pixi reduced motion
- W5.4 AA contrast tokens

Not implemented: W5.1 keyboard navigator, W5.2 real modal, server/tool/core changes, or App/View changes.

## Files Changed

- `web/src/CityWorldRenderer.tsx`
- `web/src/styles.css`
- `artifacts/council/CODEX_RESULT_W5R.md`

## W5.3 Pixi Reduced Motion

- Added a single `matchMedia("(prefers-reduced-motion: reduce)")` read in the renderer and a `change` listener.
- Reduced mode now prevents the render-on-demand loop from treating Pixi targets as active animation, so the loop can still park.
- `releaseVelocity()` returns `null` under reduced motion, so pan inertia does not start.
- Existing ambient objects are still drawn, but water/cloud/walker/car targets are settled to their static first frame with no per-frame time advance.
- Selection pulse targets settle to their existing final resting alpha immediately and do not run the pulse timer.
- Camera preset reset already applies directly; reduced mode also cancels any pending coalesced camera rAF before reset applies.
- QA counters and handles were not renamed or removed.

## W5.4 Contrast Tokens

Contrast math uses the current map green set:
`#aad48b`, `#91c37e`, `#82ba87`, `#95c37e`, `#add38f`, `#87bf82`.
Dark mode uses dark `--map-body #779c66` in that set.

Ratios below are min-max over those greens. The `--surface` row is the requested
surface blend. The `--city-panel` row is the stricter effective panel blend from
`color-mix(in srgb, var(--surface) 90%, transparent)`.

| Token | Before | After | `--surface` before | `--surface` after | `--city-panel` before | `--city-panel` after |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| light `--ink-3` | `#757575` | `#6b6b6b` | 4.33-4.44 | 5.01-5.14 | 4.06-4.24 | 4.70-4.91 |
| dark `--ink-3` | `#969696` | `#a8a8a8` | 4.59-4.85 | 5.71-6.03 | 3.63-4.20 | 4.51-5.22 |
| light `--status-yellow` | `#e0b84b` | `#9a7b1f` | 1.78-1.82 | 3.78-3.87 | 1.66-1.74 | 3.54-3.70 |
| dark `--status-yellow` | `#e0b84b` | `#d0a83d` | 7.19-7.60 | 6.04-6.38 | 5.69-6.58 | 4.78-5.53 |

Choice: pure token retune, no new outline styling. Yellow remains a restrained amber and passes the 3:1 UI-graphics threshold in both light and dark themes without adding saturated chrome.

## Verification

Passed:

- `pnpm typecheck:starter`

Reviewer-run, not run here:

- Emulator audit including console and overflow checks.
- Perf gate for non-reduced touch pan, especially `touch_pan` inertia behavior.
- Desktop and 390x844 mobile screenshots in light and dark themes.
