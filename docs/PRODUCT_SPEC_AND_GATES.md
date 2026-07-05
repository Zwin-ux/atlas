# Atlas — Product Spec & Submission Gates

Status: **ACTIVE product track** (human-directed, 2026-07-03). This is the live track.
The owner-gate / second-district promotion ceremony (0.44E-0.47E) is **parked**:
its selector artifacts stay anchored at `0.45E`, the source-of-truth drift
checker stays green, and Anaheim/Ontario stay hidden and non-public. The active
manifest is now the 0.58I integration packet. We are shipping a fully
high-quality, submittable ChatGPT app.

Current integration note (2026-07-05):
`codex/integrate-hosted-clawd-fable-058e` is the local canonical candidate that
combines the Fable visual chain with a gated Hosted Clawd rental scaffold. It is
not deployed. Paid persistence, auth, Stripe, public pricing claims, XP,
evidence, reports, exports, and new MCP tools remain closed. The next gate is
human visual/deploy review, not implementation of persistence.

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
- **Paid / backend.** Hosted Clawd is reopened only as a gated scaffold. Stripe/checkout, DB
  persistence, OAuth, XP, evidence, automation, reports, exports, and public saved-state claims
  stay parked until 0.58J approves the integrated branch and a later 0.59H storage/auth decision
  names the implementation contract.
- **Provider-created geometry, live provider→scene normalization, renderer/UI redesign.**

## 8. What already exists (reused, not rebuilt)

The MCP server + 7 tools (live on Railway, Google mode), the PixiJS voxel renderer, the widget
bridge with a test-injection hook, the CDP screenshot harness, and `verify-submission.mjs`. The
product track polishes and packages these — it does not rebuild them.
