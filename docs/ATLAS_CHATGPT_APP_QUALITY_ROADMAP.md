# Atlas ChatGPT App — Quality Roadmap

Owner-directed working roadmap for making Atlas the highest-quality ChatGPT app we
can ship. Grounded in the live backend (Railway `atlas-chatgpt-app / production /
atlas-backend`) and the current codebase as of 0.51E.

Status legend: ☐ todo · ◐ in progress · ☑ done
Priority: **P0** ship-blocking / trust · **P1** quality bar · **P2** polish / stretch

---

## 0. Ship the work already staged (P0)

- ◐ **Deploy 0.51E to production.** All four build targets typecheck clean
  (core/web/geo/server = 0 errors); 7 verifiers + 85/85 core tests green. Live
  Railway deploy still runs the pre-0.51E build (`version 0.1.0`). Deploy is
  `railway up` (Railway runs `pnpm build:starter`, health-gated on `/health`,
  old build stays up until the new one is healthy).
  **Blocked on:** owner-approved production deploy (auto-mode guard correctly
  holds production mutations).
- ☐ **Post-deploy verification.** Re-hit `/health`, `/preview`, and an MCP
  `initialize` + `tools/list`; confirm the 0.51E residential variety renders at
  `/preview` on desktop + mobile, light + dark. Roll back via Railway if
  `/health` or the browser proof regresses.

---

## 1. Coverage & product depth — the real value driver (P0/P1)

The pitch is "explore *your* county." Today only **Riverside / Eastvale** is
playable; Anaheim + Ontario are hidden non-public drafts. One county is a demo,
not a product.

- ☐ **P0 — Second playable county.** Take one hidden draft through the owner-gate
  promotion ceremony to `playableNow: true`. This is the single biggest quality
  lever: it turns a demo into a map you can actually pick your city on.
- ☐ **P1 — County promotion pipeline.** Formalize draft → curated anchor pack →
  owner review → playable. Document the cutline and the checklist so promoting
  county N+1 is repeatable, not bespoke.
- ☐ **P1 — Graceful coverage tiers.** Make L0 (unsupported) and L1 (county shell)
  states feel intentional, not broken: honest "indexed, not playable yet" copy,
  a way to request/queue a county, no invented places.
- ☐ **P2 — "Nearest playable county" fallback** when a user asks for an
  unsupported place, so the app always has a satisfying next action.

## 2. Render / art quality continuation (P1)

0.51E fixed residential honest-color identity + variety. Next weakest axes from
the diagnostic are terrain massing and commerce/civic silhouettes.

- ☐ **P1 — Terrain massing pass.** `nextWeakestAxis` = `terrain_massing`. Raise
  chunk-edge readability and massing variety without repainting green terrain.
- ☐ **P1 — Commerce + civic object-kit polish.** Apply the same honest-palette +
  silhouette-variety treatment to strip/commerce and civic/venue families that
  0.51E gave homes (commerce within-family clone is 0.5 generated; push lower).
- ☐ **P1 — Mobile readability.** Keep the `residential_detail` / mobile occlusion
  tray gates green as scenes get denser; validate first-viewport composition on
  small screens.
- ☐ **P2 — Time-of-day / ambient variety** (sunset, overcast) as a low-cost way
  to make repeat sessions feel alive — parameters only, no new prop pipeline.
- ☐ **P2 — Landmark hero moments** for playable-county anchors (a recognizable
  silhouette per city) so the map has a "that's my town" beat.

## 3. Performance — ChatGPT iframe budget (P1)

- ◐ **P1 — Shrink the preview bundle.** `web/dist/component.js` is ~970 KB,
  inlined whole into `/preview` (the ChatGPT widget sandbox forbids sibling-chunk
  fetches, so code-splitting/lazy Pixi is NOT viable there).
  **Done:** `/preview` now serves brotli/gzip via `node:zlib` (no new dep),
  pre-compressed + cached once at startup — **1,010,079 → 242,251 bytes on the
  wire (-76%)** (BUILD_LOG Entry 191). Added `scripts/verify-web-bundle-budget.mjs`
  (raw ≤ 1.15 MB, brotli ≤ 320 KB) so it can't regress.
  **Still open:** raw parse/execute time (the browser still parses ~948 KB once
  decompressed) — explore trimming the Pixi surface / a lighter renderer path.
- ☐ **P1 — Cold-start / TTFB.** Measure Railway cold start and `/preview` TTFB;
  keep the container warm or trim boot work if the first render is slow.
- ☐ **P2 — Texture/atlas optimization** for the voxel sprites (only 2 SVG
  textures today; keep it lean as art grows).

## 4. MCP tool surface quality (P0/P1)

Current tools: `select_county`, `render_voxel_county`, `ask_county_question`,
`light_county`.

- ☐ **P0 — Tool descriptions & affordances.** Every tool needs a crisp,
  model-legible description + examples so ChatGPT picks the right one. Verify the
  `initialize` instructions string reads well to the model.
- ☐ **P0 — Closed-world honesty on `ask_county_question`.** Guarantee it only
  answers from curated data and refuses/deflects out-of-world questions — no
  hallucinated places, hours, or facts. Add negative test cases.
- ☐ **P1 — Structured content + error UX.** Consistent, typed tool results;
  friendly, actionable errors (unsupported county, shell county, rate limit)
  instead of raw 4xx/5xx.
- ☐ **P1 — Latency budget per tool.** Define and measure p50/p95; the render/
  select loop should feel instant in chat.
- ☐ **P2 — Idempotency & session hygiene.** Session-only state stays session-only;
  repeated calls are safe and cheap.

## 5. Reliability & observability (P1)

- ☐ **P1 — Wire `verify-engine-beta-coverage` into CI** against an ephemeral live
  server (it needs `/preview` + MCP running). This is the browser/screenshot gate
  that structural verifiers can't cover.
- ☐ **P1 — Structured logging + error tracking.** The current Railway logs show
  only startup lines. Add request/error logging and an alert on 5xx / crash-loop.
- ☐ **P1 — Post-deploy canary.** Automated `/health` + `/preview` + MCP smoke
  after every deploy (the `/canary` skill pattern).
- ☐ **P2 — Uptime + latency dashboards** from Railway metrics.

## 6. Google Places pipeline hardening (P1)

Places is consumed server-side via `@atlas/geo` (`GEO_DATA_ADAPTER` +
`GOOGLE_MAPS_API_KEY`/language/region), upstream of the provider-free render
path. Keep it that way — and make it safe + cheap.

- ☐ **P1 — Cost & rate controls.** Enforce `ProviderUsagePolicy` limits, minimize
  the Nearby Search field mask (already have `ATLAS_GOOGLE_NEARBY_SEARCH_FIELD_MASK`),
  and cache aggressively so anchor-pack generation doesn't burn quota.
- ☐ **P1 — Attribution & ToS compliance.** Ensure Google attribution + data-use
  rules are honored wherever provider-derived data surfaces; no forbidden fields
  leak into scene data (`PROVIDER_STRUCTURED_CONTENT_FORBIDDEN_FIELDS`).
- ☐ **P1 — Key hygiene.** `GOOGLE_MAPS_API_KEY` server-only, never shipped to the
  client bundle; restrict the key (API + referrer/IP) in Google Cloud; rotation
  plan.
- ☐ **P2 — Offline anchor-pack generation job** so Places is called at ingest
  time, not on the request hot path.

## 7. Submission polish — App Store readiness (P0)

- ☐ **P0 — `chatgpt-app-submission.json` complete & valid.** app_info, tools,
  test_cases, negative_test_cases; keep `verify:submission` green (7-tool surface
  + honesty literals: "voxel city map", "session-only", "do not save state").
- ☐ **P0 — Icon + screenshots + category + subtitle** that sell the
  "explore your county as a voxel city" wedge.
- ☐ **P1 — Privacy & data statement** (session-only, provider attribution, what's
  stored — `DATABASE_URL` scope).
- ☐ **P1 — First-run script / demo path** the reviewer can follow to a wow moment
  in under a minute (select Riverside → render → ask a question).

## 8. Security & safety (P1 — permanent gates)

- ☐ **Keep the provider boundary green.** `web/src` + `packages/core` import zero
  `@atlas/geo`; no `google.maps` / `places.googleapis.com` tokens in scene data
  (diagnostics `PROVIDER_PAYLOAD_LEAK` hard-blocker). This is what keeps the app
  honest and the render gates green — do not regress it.
- ☐ **Secrets discipline.** `DATABASE_URL`, `HOSTED_CLAWD_INVITE_TOKEN`,
  `GOOGLE_MAPS_API_KEY` server-only; verify none reach the client or logs.
- ☐ **P1 — iframe CSP / embedding** review for the ChatGPT widget context.
- ☐ **P1 — Input validation** on all tool params (county slugs, free-text
  questions) against injection / abuse.

## 9. QA & accessibility (P1/P2)

- ☐ **P1 — Screenshot regression** across desktop/mobile × light/dark for
  `/preview`, county switcher, shell, unsupported states.
- ☐ **P2 — Accessibility** of the widget chrome (contrast, focus, reduced-motion,
  keyboard) — the map is canvas, but the surrounding UI should pass.

---

## Suggested next 3 (highest leverage)

1. **Deploy 0.51E** (P0, staged) → then post-deploy verify.
2. **Second playable county** (P0) — turns the demo into a product.
3. **Preview bundle diet + cold-start** (P1) — the first thing every user feels.
