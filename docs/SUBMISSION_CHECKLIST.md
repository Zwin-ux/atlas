# Atlas — ChatGPT App Directory Submission Checklist (G6)

Requirements confirmed against OpenAI's official **App submission guidelines**
(https://developers.openai.com/apps-sdk/app-submission-guidelines) — fetched 2026-07-03.
Submission + review is done in the OpenAI Developer Platform (track status there); the
help-center how-to (https://help.openai.com/en/articles/20001040) is auth-gated.

Legend: ✅ done/verified · ⚠️ risk to resolve · ⬜ human/network step (not code).

## 1. Identity verification (blocking, human)
- ⬜ Complete **identity verification** in the OpenAI Platform Dashboard for the publish name
  (individual verification to publish under your name; business verification for a business name).
- ⬜ Submitter needs **Owner role or `api.apps.write`** permission on the org.

## 2. Directory metadata
- ⚠️ **App name** — "Atlas" is a generic single-word dictionary term; the guidelines explicitly
  say to avoid those. Consider a more specific directory name (e.g. "Atlas — Voxel County Maps"
  or "Atlas Maps"). **Decision needed.**
- ✅ **Description** — accurate; explains the voxel county map + session-only behavior.
- ⬜ **Support contact** — a monitored support email/URL (kept current). Human provides.
- ⬜ **Privacy policy URL** — text drafted (`docs/legal/PRIVACY.md`); must be **hosted at a public URL**.
- ⬜ **Terms URL** — text drafted (`docs/legal/TERMS.md`); must be **hosted at a public URL**.
- ✅/⬜ **Screenshots** — we captured accurate desktop (1280×720) + mobile (390×844) shots this
  session (map, scout panel, campaign panel, generated district). Curate a set; confirm the
  directory's required dimensions and re-export if needed.
- ✅/⬜ **App icon** — `assets/atlas-app-icon.svg` (on-brand, verified). Export **PNG raster** at
  the directory's required size(s) if it doesn't accept SVG.
- ⬜ **Categories** + **country/availability** — chosen in the dashboard at submission.

## 3. Technical / MCP (all ✅, verified live against the deployed server)
- ✅ Unique, human-readable tool names; descriptions match actual behavior.
- ✅ Correct annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`) — mirror the server;
  only `lookup_world_places` is `openWorldHint: true`. (`verify-submission.mjs` passes live.)
- ✅ Minimal, purpose-driven inputs; **no full conversation history**, no raw chat logs.
- ✅ Predictable, auditable, no hidden side effects; session-only, no persistence.
- ✅ **No login** required (session-only) → no test-credential/demo-account barrier (a plus).

## 4. Quality & design
- ✅ Clear purpose **beyond ChatGPT's native chat** (explore a county-scale voxel world, ask
  local questions, scout/campaign planning) — not something plain chat does.
- ✅ Tested, stable, low-latency, errors handled (build + 85/85 core tests + browser gates green;
  deployed + health-checked).
- ⚠️ **"Complete, not a trial/demo" — the main product risk.** Our honest posture (Alpha,
  session-only, "not saved," Hosted Clawd "planned/coming") is great for trust but can read to a
  reviewer as an *incomplete/coming-soon demo* — a listed disqualifier. Mitigation: present the
  app as a **complete product for what it does now** (fully explore Riverside/Eastvale + generated
  districts + scouting previews), and frame session-only/upgrade as a deliberate free-tier design,
  not "unfinished." Audit all user-facing + listing copy for "demo/preview/coming soon" phrasing.
- ✅ Follows map-first UX; no unrelated content; no interaction hijacking.

## 5. Safety, privacy, data (all ✅)
- ✅ No prohibited categories (adult, gambling, drugs, weapons, malware, counterfeit, fraud, etc.).
- ✅ Minimal data; **no restricted data** (no payment cards, PHI, gov IDs, credentials, secrets).
- ✅ Data-minimized responses; no timestamps/IPs/session-IDs leaked; no chat-log reconstruction.
- ✅ No precise-location requests (lookup takes a text query, not GPS).
- ✅ General-audience suitable (13+). No model-manipulation to favor the app; no unauthorized scraping.
- ✅ **No commerce** (no digital goods/subscriptions/in-app checkout; `get_upgrade_options` only
  explains a planned tier — confirm its copy implies no in-app purchase).

## 6. Disqualifiers — our watch-list
- ⚠️ Demo/trial perception (see §4) — the top risk; resolve via copy + completeness framing.
- ⚠️ Generic name (see §2).
- ✅ Not misleading/copycat; correct annotations; no unauthorized 3rd-party APIs (Google Maps used
  read-only behind the adapter, with attribution); not primarily advertising.

## The actual path to submit (ordered)
1. **Human:** identity/business verification + `api.apps.write` on the OpenAI dashboard.
2. **Decide:** directory name (resolve the genericness risk).
3. **Copy audit:** reconcile "honest Alpha" with "complete product, not a demo" across listing + app.
4. **Host** `PRIVACY.md` + `TERMS.md` at public URLs; add a support contact.
5. **Assets:** curate screenshots at required dims; export PNG icon if SVG isn't accepted.
6. **Submit** in the dashboard (MCP URL = the Railway prod `/mcp`; categories; countries) and track review.

Code side is essentially done (manifest compliant + verified live); the remaining work is
human/account/hosting + the two judgment calls (name, demo-perception).
