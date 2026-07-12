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

## Next session battery (after `ef355f8` deploys)
Riverside render → Miami draft (sea visible per 0.77-2) → "Where is the
park?" camera move → pins/notes + resume → scout→campaign → dark mode →
rate-limit behavior.
