# CODEX RESULT G8-4

## Quest

G8-4 Unlock Exploration in Real ChatGPT (NS-0/NS-3).

Player-facing promise: a real ChatGPT user has a visible way to expand the Atlas map from inline mode, then pan/zoom without the chat scroll feeling hijacked before engagement.

Engineering promise: move fullscreen requests behind a user gesture, mirror host display-mode globals, keep renderer gesture physics unchanged, and make the emulator reject non-gesture fullscreen calls like the real host.

Anti-scope honored: no server, packages, docs, package metadata, MCP tools, persistence, billing, provider geometry, or camera physics changes.

## Control design

- Added a quiet icon-only `Expand map` button to the existing `MapChrome` zoom/center stack.
- The same button becomes `Collapse map` with `aria-pressed="true"` only after host display mode is `fullscreen`.
- The click handler uses optional chaining, `Promise.resolve(...)`, and `try/catch` around `window.openai.requestDisplayMode`.
- Removed the dead mount-time fullscreen requests from `CityWorldView` and `CountyCoverageView`.

## Display-mode plumbing

- Added `useOpenAiDisplayMode()` in `web/src/bridge.ts`.
- The hook reads `window.openai.displayMode` and updates from `openai:set_globals`.
- `CityWorldView` and `CountyCoverageView` expose `data-display-mode`, `data-qa-display-mode`, and a hidden `data-qa="display-mode"` probe.
- `MapChrome` uses the same hook so button state follows host-granted mode, not local optimism.

## Touch and wheel decision

- Set `touch-action: none` on `.city-world-renderer` and `.city-world-canvas`, plus the Pixi mount/canvas inline style.
- Rationale: once a pointer starts on the canvas, Atlas owns pan/pinch so the browser does not negotiate mid-drag.
- Wheel zoom is gated until the widget receives a pointer or focus event. Fullscreen mode bypasses that gate because fullscreen is explicit engagement.
- No pan, pinch, inertia, camera bounds, or gesture physics changed.

## Emulator parity

- `mockHost.requestDisplayMode` now requires a pointer/key gesture within 200ms.
- Non-gesture calls return `undefined` and issue `console.warn`, matching the real-host G8-3 behavior.
- Gesture-legal calls update emulator `displayMode`, dispatch `openai:set_globals`, and notify the shell.
- The emulator frame wrapper, iframe, and body now carry `data-display-mode`; fullscreen mode visibly toggles the existing fixed fullscreen frame class.

## Audit coverage

- `scripts/verify-emulator-audit.mjs` now folds display-mode coverage into the existing `canvas_single` structural check to avoid increasing the expected check count.
- The probe verifies:
  - expand button exists
  - initial shell/indicator/emulator mode is inline
  - a real CDP pointer/touch click flips inline -> fullscreen
  - the button becomes `Collapse map` / pressed
  - a second click flips fullscreen -> inline

## Gate tails

- `pnpm typecheck:starter`: PASS.
- `git diff --check -- <G8-4 fenced files>`: PASS.
- `pnpm test:core`: FAIL outside this slice. `packages/core/test/city-world-generated-district.test.ts` has 12 failing generated-district expectations; 21 test files passed, 1 failed, 130 tests passed, 12 failed. This slice did not touch `packages/*`.
- `node scripts/verify-emulator-audit.mjs`: FAIL in local runtime harness, not a product assertion. Full matrix against existing `127.0.0.1:8787` produced 1 pass / 1 warn / 19 fail after `CDP socket closed` on the first cell and later `fetch failed` target creation failures.
- Narrow `node scripts/verify-emulator-audit.mjs --county riverside-ca --viewport desktop --theme light`: FAIL with `fetch failed` before widget assertions.
- Narrow Edge run with explicit `--chrome-path`: FAIL with `CDP socket closed` plus screenshot timeout.
- Fresh current-build dev server on `PORT=18787`: BLOCKED. `pnpm dev` fails during `scripts/build-web.mjs` with esbuild `Cannot read directory "../..": Access is denied` and `Could not resolve "...\\web\\src\\main.tsx"` under this sandbox.

## Risks

- Real ChatGPT should be retested because local browser proof is blocked by harness/server state in this session.
- The full emulator 158/0/0 target is not proven here; the audit script was updated, but CDP/server execution failed before reaching the new assertion.
- Core is not untouched-green in this worktree because pre-existing generated-district source/test state is failing outside the G8-4 fence.
