# Atlas — Product Spec & Submission Gates

Status: **ACTIVE product track** (human-directed, 2026-07-03). This is the live track.
The owner-gate / second-district promotion ceremony (0.44E-0.47E) is **parked**:
its selector artifacts stay anchored at `0.45E`, the source-of-truth drift
checker stays green, and Anaheim/Ontario stay hidden and non-public. The active
manifest is now the 0.72B Redis Scene Packet Cache / Job Spine proof, using
the 0.71H Scene Packet Service Boundary proof as its input.
We are shipping a fully high-quality,
submittable ChatGPT app.

Current backend production note (2026-07-06):
`0.72B Redis Scene Packet Cache / Job Spine`.

0.72B keeps the 0.71H `_meta` generated draft delivery path but moves the
backend toward production: memory-or-Redis cache store, Redis compile locks,
Redis-backed job queue readiness, a separate scene packet worker, safe
`/api/engine/scene-packets/status`, `/ready`, request IDs, structured logs, and
first-pass rate limits. Local/dev defaults to memory when Redis is not
configured. Railway production requires Redis. Browser Pixi pan/zoom remains
local after packet delivery; Railway is not in the frame loop.

Generated draft packets remain non-playable, non-public, provider-free,
DB-unpersisted, and delivered through `_meta.generatedDraftScene` /
`_meta.generatedDraftPacket`, not `structuredContent` or a browser HTTP render
route. The next named slice is `0.72H Fable Generated Draft Visual Quality
Gate`. Provider-normalized local anchors, public playable promotion, all-US
playable claims, new public MCP tools, browser HTTP generated-scene routes,
scene packet DB persistence, public paid claims, and public Anaheim/Ontario
remain closed.

Current integration note (2026-07-05):
`codex/integrate-hosted-clawd-fable-058e` is the local canonical candidate that
combines the Fable visual chain with a gated Hosted Clawd rental scaffold.

Current setup UI note (2026-07-05):
`0.58J Hosted Clawd Setup UI Port` is local-green history.

0.58J ports the Superior grey setup console / setup rail grammar into that
tray as a UI-only, context-only change.

Current DB/Auth note (2026-07-05):
`0.59H Hosted Clawd Storage/Auth Decision Packet`.

The human explicitly reopened DB/Auth preparation. 0.59H chooses Railway
Postgres, committed SQL migrations plus a small Node runner, and OAuth/OIDC
account linking for protected MCP Hosted Clawd actions. The next named build
slice is `0.60H Persistence Foundation`. Stripe/money, public paid claims,
evidence, XP, reports, exports, automation, and public Anaheim/Ontario remain
closed.

Current persistence note (2026-07-05):
`0.60H Persistence Foundation`.

0.60H implements the first owner-protected memory layer for Atlas: Railway
Postgres, SQL migration, OAuth/OIDC bearer verification, protected write
routing, owned Hosted Clawd rows, business profile rows, Scout Drop saves,
campaign draft saves, usage events, and idempotency. This exists because Atlas
is a map/chat app for seeing the local world and keeping local context; Hosted
Clawd / Clawdbot is the paid neighborhood operator that can later act on owned
state. The next named slice is `0.61H Invite Beta Save UX`. Stripe/money,
public paid claims, evidence, XP, reports, exports, automation, and public
Anaheim/Ontario remain closed.

Current save UX note (2026-07-05):
`0.61H Invite Beta Save UX`.

0.61H keeps the Superior grey setup console and adds claymation save slots
inside the map tray so the user can see what Clawdbot could read later:
business/location, local notes, Scout Drop, and campaign draft state. The next
named slice is `0.62H Stripe Test Billing`. Stripe/money, public paid claims,
evidence, XP, reports, exports, automation, provider geometry, renderer
geometry, dashboard shells, and public Anaheim/Ontario remain closed.

Current Stripe test billing note (2026-07-05):
`0.62H Stripe Test Billing`.

0.62H adds server-side Stripe test Checkout, Customer Portal, raw-body Stripe
webhook verification, webhook replay protection, subscription rows, and a
compact billing rail inside the Hosted Clawd map tray. Stripe webhook state is
the only confirmation source for paid writes; success and portal return URLs
grant no access. The next named slice is `0.63H Protected Hosted Clawd Tool
Gate`. Live billing, public paid claims remain closed, pricing pages, plan
comparisons, evidence, XP, reports, exports, automation, provider geometry,
renderer geometry, dashboard shells, and public Anaheim/Ontario remain closed.

Current protected tool gate note (2026-07-05):
`0.63H Protected Hosted Clawd Tool Gate`.

0.63H makes protected Hosted Clawd writes depend on repository webhook state,
not client state. `promote_session` and `save_campaign_artifact` require an
active subscription stored from Stripe webhook events; client-supplied
`subscriptionStatus` is ignored for write authorization. `create_or_attach` and
test Checkout remain available so owners can reach billing. The next named
slice is `0.64H Saved Hosted Clawd Read Surface`. Public paid claims, new
public MCP tools, evidence, XP, reports, exports, automation, provider
geometry, renderer geometry, dashboard shells, and public Anaheim/Ontario
remain closed.

Current saved read surface note (2026-07-05):
`0.64H Saved Hosted Clawd Read Surface`.

0.64H adds an owner-scoped saved state shelf inside the existing Hosted Clawd map
tray. The shelf reads owned Clawd, business, Scout Drop, campaign draft, and
stored subscription state through an HTTP-only route. Reads require verified
account scope, create no rows, and do not require an active subscription;
payment-failed owners can still read saved history while paid writes stay
paused. `refresh_status` is a read action on the saved-state route, not a
create-or-attach write. The next named slice is `0.65H Hosted Clawd Browser
Proof`, which must prove the widget bearer-token/account-link path or the
honest blocked auth state. Public paid claims, new public MCP tools, evidence,
XP, reports, exports, automation, provider geometry, renderer geometry,
dashboard shells, pricing pages, and public Anaheim/Ontario remain closed.

Current browser proof note (2026-07-05):
`0.65H Hosted Clawd Browser Proof`.

0.65H proves the saved read browser path in the ChatGPT-style widget. With no
widget bearer token, `/api/hosted-clawd/saved` returns a `401 OAuth resource
challenge` with `atlas:hosted_clawd.read`, no saved shelf renders before
account linking, and no widget token is exposed. The Hosted Clawd tray keeps
dialog semantics, status semantics, simplified user-facing copy, visible
primary action, and `44px touch targets` on desktop and `390x844` mobile. The
next named slice is `0.66H Mobile Interaction Hardening`. Public paid claims,
new public MCP tools, evidence, XP, reports, exports, automation, provider
geometry, renderer geometry, dashboard shells, pricing pages, and public
Anaheim/Ontario remain closed.

Current mobile hardening note (2026-07-05):
`0.66H Mobile Interaction Hardening`.

0.66H fixes the product-quality defects called out by the Fable professor
audit: pan/zoom no longer rebuilds the retained Pixi scene graph, the saved
state surface is collapsed-first bottom map chrome instead of a modal, and the
widget payload is split so `/preview` serves a small shell with deferred Pixi
chunks. The measured local proof shows zero scene rebuilds during scripted
desktop/mobile pan, collapsed save sheet under 96px, expanded sheet under
45dvh, eager JS under 400KB, and no new MCP tools. The next named slice is
`0.67H Product Feel Cleanup`. Public paid claims, DB/Auth/Stripe expansion,
evidence, XP, reports, exports, automation, provider geometry, new renderer
geometry, dashboard shells, pricing pages, and public Anaheim/Ontario remain
closed.

Current product feel cleanup note (2026-07-05):
`0.67H Product Feel Cleanup`.

0.67H accepts that labels, halos, pins, props, and actors are annotation layers,
not the product identity. The Fable renderer pass demotes ambient labels
(mobile labels are selected/hovered only, desktop gets a two-label cap), quiets
marker rings, moves pins off landmark facades, calms decoration around the
focal anchor, and reduces commerce/gym translucent clutter so building massing
reads first. The next named slice is `0.68H National Generation Production Contract`.
Public paid claims, DB/Auth/Stripe expansion, evidence, XP, reports, exports,
automation, provider geometry, new geography, dashboard shells, pricing pages,
and public Anaheim/Ontario remain closed.

Current national generation contract note (2026-07-05):
`0.68H National Generation Production Contract`.

0.68H records that current Atlas is not production-ready for every US county.
The current fixture is California-only: 1 indexed state, 58 indexed counties,
and 1 playable county. Production US generation requires sourced national county
identity, honest county shells, deterministic generated districts,
provider-normalized local anchors behind policy, and public-quality promotion
gates. The next named slice is `0.69H US County Index Import / Nationwide
Shells`. Public paid claims, DB/Auth/Stripe expansion, evidence, XP, reports,
exports, automation, provider geometry, new geography, dashboard shells, pricing
pages, and public Anaheim/Ontario remain closed.

Current national shell note (2026-07-05):
`0.69H US County Index Import / Nationwide Shells`.

US county identity is now national: `US_COUNTY_INDEX` is generated from the
2024 Census national county gazetteer and covers 3,222 county/equivalent rows
across 52 state/territory codes. Non-Riverside indexed counties return honest
`L1_COUNTY_SHELL` browse states and shell scenes with no invented local places,
roads, lots, buildings, pins, actors, Scout context, campaign context, or
provider geometry. Riverside/Eastvale remains the only public playable proof
cell. The next named slice is `0.70H Deterministic Generated District Specs`.
Public paid claims, DB/Auth/Stripe expansion, evidence, XP, reports, exports,
automation, provider geometry, playable all-US claims, new geography promotion,
dashboard shells, pricing pages, and public Anaheim/Ontario remain closed.

Why this exists: the previous stretch (0.24E→0.46E) was decision machinery circling one blocked
question ("promote hidden Anaheim?"). This spec replaces that with product-quality gates that
actually gate a ChatGPT App Store submission.

---

## 1. What Atlas is

A native **ChatGPT app** (Apps SDK / MCP) that opens a county-scale **voxel world** inside
ChatGPT. The user explores Riverside/Eastvale as a real isometric voxel city, asks location
questions, drops Clawd to scout a local business opportunity, and previews a 7-day campaign —
all **session-only, nothing saved**. Map-first and engine-first; never a dashboard or SaaS
homepage.

North star: voxel the US — county → state → country → Earth — from one scalable world model.
Riverside/Eastvale is the proof cell; the engine and the in-ChatGPT app quality are the product.

## 2. The product loop (what actually ships)

```
open Atlas
  │
  ▼
select_county ─────────► voxel city map (Eastvale)  ◄── map-first surface
  │                         │
  │                         ├─ tap place → session pin / note (nothing saved)
  │                         └─ county switcher → Orange shell / unsupported (honest coverage)
  ▼
preview_scout_drop ──────► in-widget Scout Report   (route · signals · risks · channels)
  │                         └─ [CTA] Preview 7-day campaign
  ▼
preview_campaign_engine ─► in-widget 7-day plan     (days · assets · guardrails)
  │                         └─ [CTA] See hosting options
  ▼
get_upgrade_options ─────► Hosted Clawd = planned (no checkout, no account, no save)

ask_county_question / lookup_world_places available throughout (read-only, curated/normalized)
```

The scout/campaign result surfaces (`0.46P`) are the difference between "decorative map + a
text bubble" and "a real app." They render inside the widget, map-first, session-only.

## 3. Definition of Done — submittable to ChatGPT

The app is submittable when every gate below is green **on the deployed Railway build**.

| # | Gate | What it proves | Proof / verifier |
|---|------|----------------|------------------|
| **G1** | Build & typecheck | The whole workspace compiles and bundles | `tsc` core/geo/server/web + `node scripts/build-web.mjs` |
| **G2** | MCP contract stable | Exactly the 7 Alpha tools; concise `structuredContent`; full scene only in `_meta`; valid `outputSchema` | `verify-submission.mjs`, live `tools/list` |
| **G3** | Widget quality | Map + place tray + scout/campaign panels render on desktop **and** 390×844; no horizontal overflow; no console errors | `verify-alpha-product-loop.mjs`, `verify-scout-campaign-panel.mjs`, `verify-shell-county-widget.mjs` |
| **G4** | Reliability | All 7 tools drive end-to-end on the live server without error; outputs validate against schema | `verify-mcp-flow.mjs`, live tool sweep |
| **G5** | Honesty & safety | Session-only; no persistence/XP/paid claims; no auto-post/DM; coverage honest; no provider→geometry | `verify-submission.mjs`, `verify-provider-boundaries.mjs`, `verify-tool-result-shape.mjs` |
| **G6** | Submission manifest | `chatgpt-app-submission.json` complete **plus** app icon + privacy/legal URLs (directory requirements the repo does not yet self-check) | `verify-submission.mjs` + manual directory checklist |
| **G7** | Deployed & verified | Live on Railway; public verifiers green against the production URL | `verify-engine-beta-coverage.mjs` vs prod |

Submission is blocked until G1–G7 are green together on one coherent, committed build.

## 4. Active product slice ladder

Named, gated slices. `P` = product/app track (distinct from the parked `E` owner-gate ladder).

| Slice | Player-facing promise | Gate it clears | Status |
|-------|----------------------|----------------|--------|
| **0.46P In-Widget Result Surface** | Dropping Clawd shows the scout/campaign result *in the app*, not just a chat bubble | G3 (partial) | ✅ done + proven |
| **0.47P Widget Polish** | Clickable flow (Preview campaign / hosting options), tidy mobile, clean labels | G3 | 🔄 in progress (Codex) |
| **0.48P Design Ultra-Pass (Fable supermove)** | The app looks and feels genuinely native and beautiful — weightless, Metro-clean, anti-slop | G3 | ✅ done + proven (branch `fable/0.48p-design-ultra-pass`; see `docs/0.48P_DESIGN_ULTRA_PASS.md`, BUILD_LOG Entry 080) |
| **0.49P Reliability Sweep** | Every tool works, every time, desktop + mobile | G2, G4 | ⏳ |
| **0.50P Submission Packet** | The app is packaged and accepted: manifest, icon, privacy, deploy | G5, G6, G7 | ⏳ |

Each slice keeps the permanent invariants (§6) and adds screenshot/verifier proof.

## 5. Factory model (how we build it)

```
Opus 4.8 (floor manager) ── holds the plan, integrates, runs proofs, owns taste & architecture
   │
   ├──► Codex (GPT-5.5)  ── the line: bulk implementation, verifiers, build loops (sandboxed, parallel)
   └──► Fable            ── the SUPER MOVE: one elite pass, spent on 0.48P design ultra-pass
```

Codex runs sandboxed (no network) → it writes + typechecks; the manager runs the bundler,
server, and browser proofs. Fable is spent once, on the working UI, where quality compounds most.

## 6. Permanent invariants (unchanged, non-negotiable)

- **Map-first.** No dashboard shell, no SaaS homepage.
- **Honesty.** No fake playable counties; session-only; nothing saved/sent/scheduled; coverage
  states (playable / shell / unsupported) never confused.
- **Provider boundary.** Google/provider lookup stays behind the adapter; provider data never
  becomes scene geometry or readiness.
- **7-tool MCP surface stable.** No new tools casually; concise `structuredContent`; large scenes
  in `_meta`.
- **Visual grammar.** No props, labels, cars, humans, panels, or glows to hide weak art.
- **Mobile.** 390×844 proof required for any product-surface change.

## 7. Parked (explicitly not in the active track)

- **Owner-gate / second-district promotion ceremony (0.44E-0.47E).** Kept honest; Anaheim/Ontario
  remain hidden and non-public; owner-gate selector artifacts stay anchored at `0.45E`; drift
  checker stays green. Re-open only if a human calls for a controlled public second-district spike.
- **Paid / backend.** Hosted Clawd now has a local-green DB/Auth foundation for
  owner-protected rows, 0.61H makes future saved state legible in the map tray,
  0.62H adds test-mode Stripe billing behind webhook-confirmed state, and
  0.63H gates protected writes on repository webhook state. Live billing,
  public paid claims, pricing pages, XP, evidence, automation, reports,
  exports, and public saved-state launch claims stay parked until a later named
  slice opens them. The next backend/product gate is 0.64H: a saved read
  surface inside the map tray.
- **Provider-created geometry, live provider→scene normalization, renderer/UI redesign.**

## 8. What already exists (reused, not rebuilt)

The MCP server + 7 tools (live on Railway, Google mode), the PixiJS voxel renderer, the widget
bridge with a test-injection hook, the CDP screenshot harness, and `verify-submission.mjs`. The
product track polishes and packages these — it does not rebuild them.
