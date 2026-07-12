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
bundle cross-origin. W1's allowlist CORS blocked it — the emulator could not
catch this because it is same-origin by design (documented compromise, now
paid for). Fix: `ACAO: *` + `CORP: cross-origin` on `/widget/*` static assets
only; `/mcp` stays allowlisted. Release gate now asserts ACAO from a
sandbox-style Origin. **Emulator follow-up filed: serve the inner widget from
a second localhost origin to make asset cross-origin-ness part of every
certification.**

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
Emulator fidelity packet queued: mockHost must mirror both real-host
behaviors (cross-origin assets, non-gesture undefined returns).

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
