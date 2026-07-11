# CODEX RESULT W5 - A11Y place navigator and modal sheet

## What changed

- Added an in-DOM place navigator in `web/src/CityWorldView.tsx`, backed by the existing compiled `cityScene.places`, `activePlace`, and `onSelectPlace` path.
- Added a hidden map summary tied to the Pixi map wrapper with `aria-describedby`: `Voxel map of <county>: N places, M districts.`
- Wrapped the Pixi mount in a semantic `role="img"` map surface with an explicit `aria-label`.
- Wrapped the Hosted Clawd sheet in a real top-level modal boundary with `data-qa="modal-sheet"`.
- Added CSS in `web/src/styles.css` for the navigator, SR-only summary, modal wrapper, and focus sentinels using existing tokens only.
- W5.3 reduced motion and W5.4 contrast were not touched.

## Accessibility contract

- Map surface: `role="img"`, `aria-label="<district> voxel map"`, `aria-describedby=<map-summary-id>`.
- Place navigator: `role="listbox"`, `tabIndex=0`, `aria-label="<district> places"`, `aria-activedescendant` for the active keyboard row.
- Place rows: `role="option"`, `aria-selected` mirrors `activePlace`, so map taps and navigator selection reflect back into the DOM state.
- Keyboard map: Tab enters the navigator; Arrow Up/Down/Left/Right moves the active row; Home/End jump; Enter/Space selects through `onSelectPlace`.
- Data hooks: `data-qa="place-navigator"`, `data-qa="place-navigator-toggle"`, and `data-qa="modal-sheet"`.

## Focus trap

- Opening Hosted Clawd stores the opener button, moves focus into the modal on the next animation frame, then marks the background stage `inert` and `aria-hidden`.
- Tab and Shift+Tab are trapped inside the modal by checking the focusable elements in the modal wrapper.
- Focus sentinels before and after the tray redirect edge focus back to the last or first modal control.
- Escape closes the sheet through the existing `onCloseHostedClawd`.
- On close, `inert` and `aria-hidden` are removed and focus returns to the stored opener if it is still mounted.

## Mobile behavior

- Desktop shows the quiet listbox as a small achromatic overlay near the right-side map controls.
- At mobile widths, the listbox is collapsed by default behind a 44px `Places` disclosure button in the tray area.
- The mobile list opens only when `aria-expanded=true`, uses bounded height, and keeps 44px option rows.

## Gate tails

`pnpm typecheck:starter` - pass:

```txt
$ pnpm build:core && pnpm build:geo && tsc -p server/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
$ pnpm --dir packages/geo build
$ tsc -p tsconfig.json
```

`pnpm test:core` - pass:

```txt
Test Files  22 passed (22)
Tests       134 passed (134)
Duration    6.17s
```

## Risks

- Browser certification, emulator a11y audit, and keyboard walk are reviewer-run per packet instructions.
- The generated preview path keeps only the map summary, not the place navigator, because the existing renderer intentionally disables generated-place selection.
- `HostedClawdTray` still owns its internal expanded/collapsed semantics, but the new parent wrapper is the real modal boundary and now supplies the missing inert background and focus trap.
