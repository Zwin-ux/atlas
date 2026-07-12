# CODEX RESULT P1.1 - Generated District Interactivity

## Scope

North stars moved: NS-1 and NS-5. Before: generated districts rendered as preview-only maps with all place interaction disabled. After: generated places use the same tap, select, pin, and note grammar as Riverside while the PREVIEW ONLY boundary remains unchanged.

Fence held: `web/src/CityWorldView.tsx`, `web/src/App.tsx`, `web/src/types.ts`, `scripts/verify-emulator-audit.mjs`, and this result note only. No server, packages, emulator host files, docs, git add, commit, or push work was performed.

## Interaction Parity

| Surface | Riverside | Generated district |
| --- | --- | --- |
| Place labels | Visible | Visible |
| Tap place | Selects place and updates tray | Selects place and updates tray |
| Selection ring | Renderer focus overlay | Same renderer focus overlay |
| Tray | Kind, label, session line, note input, Save | Same minimal tray |
| Sticker row | Mode buttons plus Pin | Same controls |
| Pins/notes | Session-only widget state | Session-only widget state keyed to generated scene id |
| Honesty boundary | Session line | Session line plus unchanged PREVIEW ONLY strip |

Deliberately out: Hosted Clawd save, persistence, Scout/Campaign panels, camera/gesture/draw changes, and any generated public-coverage claim.

## State-Keying Proof

- `WidgetState.sceneSessions[sceneId]` now stores selected place, sticker mode, stickers, notes, and draft text per scene.
- `App` resolves the active interaction scene as `activeGeneratedScene?.id ?? scene.id`, so generated taps/pins/notes write to the generated `CityWorldScene.id`, not Riverside.
- `CityWorldView` projects generated-session stickers/notes into `CityWorldPin[]` for the generated scene and excludes curated `scene.world` stickers/notes from generated counts.
- The resume line now sums scene sessions, so generated-scene pins/notes count as chat work without becoming Riverside active-place counts.

## Audit Additions

`scripts/verify-emulator-audit.mjs` now marks one generated mobile anchor cell and runs:

- `touch_tap_select`
- `generated_pin_drop`
- `generated_note_save`
- `generated_state_isolation`

The isolation check exits generated mode and expects Riverside active pin/note counts to stay `0/0` while the chat resume line still reports the generated pin/note.

## Gates

- `pnpm typecheck:starter`: pass
- `pnpm test:core`: pass, 23 files / 148 tests
- `node --check scripts/verify-emulator-audit.mjs`: pass
- `git diff --check -- web/src/CityWorldView.tsx web/src/App.tsx web/src/types.ts scripts/verify-emulator-audit.mjs`: pass, line-ending warnings only

## Risks / Skipped

- `build:web` and full browser/emulator audit are reviewer-run per packet instruction and were not run here.
- Generated interaction now exposes existing generated labels directly. This is intentional for P1.1 and still bounded by the unchanged preview strip.
