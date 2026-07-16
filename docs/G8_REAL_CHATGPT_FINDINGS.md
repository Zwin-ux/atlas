# G8 — Real-ChatGPT findings (NS-0 acceptance record)

First real-host contact: 2026-07-11 night. Account: user's Pro account,
connector added via developer mode, prod backend commit `89ed443`.

## Session 1 — "Use Atlas to show me Riverside County"

| Step | Verdict | Evidence |
| --- | --- | --- |
| Connector handshake | PASS | 7 tools listed, select_county invoked |
| Tool call + model text | PASS | "Riverside County is open in Atlas, with Eastvale as the currently playable district." — correct, honest |
| Widget render | **FAIL — blank green screen** | CORS: sandbox origin `atlas-backend-production-e6fc-up-railway-app.web-sandbox.oaiusercontent.com` blocked loading `/widget/component.js` (no ACAO header) |
| ChatGPT tab stability | FAIL (crashed after ~30s) | `QuotaExceededError: setItem ... 'system-connectors' exceeded the quota` in ChatGPT's own storage layer |

### Finding G8-1 (FIXED, `ef355f8`): widget assets blocked cross-origin
Real ChatGPT loads widgets from a per-app sandbox origin and fetches our
bundle cross-origin. W1's allowlist CORS blocked it — the old emulator could
not catch this because its assets were same-origin. Fix: `ACAO: *` +
`CORP: cross-origin` on `/widget/*` static assets
only; `/mcp` stays allowlisted. Release gate now asserts ACAO from a
sandbox-style Origin. **P0.3 follow-up complete 2026-07-15:** every emulator
audit now serves the widget bundle and lazy chunks from the alternate loopback
origin and fails preflight unless both cross-origin headers are present.

### Finding G8-2 (WATCH): ChatGPT-side storage quota crash
`system-connectors` cache write exceeded browser storage quota and the tab
crashed. This is ChatGPT's client code, but large connector/tool payloads
plausibly aggravate it. Our payload cuts (draft _meta 877KB→6.8KB live in
`89ed443`; shell 131KB→844B ships with `ef355f8`) reduce exposure. Re-test
after redeploy; if it recurs with our 22KB curated meta, file as host bug and
consider trimming `_meta.scene` (the remaining large object) via spec-compile
like the others.

## Session 2 — retry after `ef355f8` (CORS) + `eb3b6d0` (host-API crash)

| Step | Verdict | Evidence |
| --- | --- | --- |
| Widget renders | **PASS — first successful render in real ChatGPT** (2026-07-11 ~21:06 PT) | User confirmed; backend saw WebGLRenderer + browserAll chunks lazy-load (Pixi canvas up) |
| Honest copy | PASS | Park question on generated Miami refused with correct session-only language |
| Tool latency | PASS | select_county 116ms, render 70ms, questions 9-16ms |

### Finding G8-3 (FIXED, `eb3b6d0`): host APIs return undefined
`requestDisplayMode` outside a user gesture returns undefined in the real
host (emulator always returned a Promise) — `.catch` on it crashed the
widget at mount. All host-API results now Promise.resolve-wrapped.
P0.3 now mirrors both real-host behaviors: cross-origin assets and a
non-gesture `undefined` return with no displayMode global change. A real click
must update the OpenAI global, widget shell, indicator, and emulator frame.

### Finding G8-4 (OPEN, next priority): map exploration feels locked
User report: "riverside just put to eastvale and you can't move around."
Hypotheses to test: (a) inline display-mode height/gesture capture — the
chat scroll may be eating drags; (b) our fullscreen request silently no-ops
(no gesture) so there is NO user-visible way to enter fullscreen — need a
visible expand affordance wired to a real click; (c) pointer-capture
behavior differs inside the sandbox iframe. Investigate with an
instrumented QA overlay + real-host console; fix wants a fullscreen
button in MapChrome (gesture-legal requestDisplayMode) as the likely
first move.

### Finding G8-5 (OPEN): "Worked for 31s" on first call
First select_county took 31s wall-clock in ChatGPT (model deliberation +
connector roundtrip). Subsequent calls fast. Watch whether cold sessions
consistently pay this; consider tool description tuning so the model
calls Atlas without long deliberation.

## Next session battery (after `ef355f8` deploys)
Riverside render → Miami draft (sea visible per 0.77-2) → "Where is the
park?" camera move → pins/notes + resume → scout→campaign → dark mode →
rate-limit behavior.

## Session 3 (2026-07-12, driven by reviewer via cookie session, prod=3b6d28d)
- Widget renders; P1 build live; cold call fast (no 31s deliberation observed).
### Finding G8-6 (OPEN): model narrates internal tier codes
Model text said 'L1 County Shell coverage' - structuredContent coverageTier enum leaks into prose. Fix: tool description instructs plain-words coverage descriptions; never recite internal codes.
### Finding G8-7 (FIXED IN CODE; REAL-HOST RECHECK OPEN): sandbox CSP blocks data: SVG fetch()
connect-src violation x3 (strip store, sticker pin, road corner assets) -
texture loads via fetch(dataUri) failed in real ChatGPT only. The widget now
loads data-URI textures through `Image`, never `fetch()`. P0.3 adds a
browser-enforced sandbox check: `fetch(data:)` must fail under
`connect-src 'self'`, `Image(data:)` must load under `img-src data:`, and the
Pixi canvas must still render. Real-host confirmation stays in the Session 4
battery.

## P0.3 emulator fidelity certification (2026-07-15)

- Host page: `http://127.0.0.1:<port>`; widget assets and every lazy chunk:
  `http://localhost:<port>` (the reverse pairing also stays valid).
- Asset preflight requires `Access-Control-Allow-Origin: *` and
  `Cross-Origin-Resource-Policy: cross-origin` before Chrome launches.
- Sandbox CSP preserves Pixi's host-proven `unsafe-eval` requirement while
  keeping `connect-src 'self'` and `img-src data: blob:` distinct.
- Full emulator audit: 19 cells, 182 pass, 0 warn, 0 fail. This covers all six
  generated archetypes, Riverside, desktop/mobile, light/dark, CTA recovery,
  touch gestures, generated pin/note isolation, CSP, CORS, and displayMode.
- Emulator performance: 14 cells, 0 warnings/failures; max Graphics 829/1600,
  max rebuild 30.5ms/350ms.
- This closes the local fidelity follow-ups from G8-1, G8-3, and G8-7. It does
  not close G8-4 or replace the visible ChatGPT desktop/phone session.

## Session 4 preparation (2026-07-15, prod=`7016735`)

- Railway backend deploy is green: deployment
  `232c69ee-63de-47d0-bb7c-257d9ca0c422`, release gate 14/14, public sanity
  3/3, widget `ui://widget/atlas-city-world-0781v.html`.
- The pre-push audit caught and fixed an Eastvale question-routing regression.
  Live MCP proof now keeps ordinary data/provider asks on `source_limits` while
  the explicit playable overlap stays on `eastvale_first_slice`.
- Automated headless navigation to ChatGPT returned HTTP 403 before login.
  This is a host bot/auth boundary, not an Atlas verdict. A visible Chrome
  handoff is open for the owner's existing Pro session.

### Required G8-4 battery

1. "Use Atlas to show me Miami-Dade County." Confirm the Census county board
   renders with sea/water visible and the exact unmapped-streets/places copy.
2. Expand, pan, and zoom from a real click. Confirm the map no longer feels
   locked and the chat scroll does not steal the gesture.
3. Ask "What current data is available for Eastvale?" Confirm the answer is a
   source/data limitation, not the first-slice explanation.
4. Ask "Where is the park?" Confirm the camera moves to the place.
5. Exercise generated-county place select, pin, note, Scout, and Campaign.
6. Check dark mode, a cold first call, and the ChatGPT storage-quota watch.
7. Repeat the core render/explore check on the owner's phone and capture one
   desktop plus one mobile screenshot.
