# Atlas — Production Roadmap (THE mandatory queue)

Status: ACTIVE master queue as of 2026-07-12. Supersedes COUNCIL_VERDICT.md
(closed) as the work thread. Any driver (Fable, Opus, Codex) boots here
after `docs/NORTH_STARS.md` (NS-0 + Spend rules govern every packet).

## Owner decisions (2026-07-12, binding)

1. **Interactive everywhere**: generated counties must be fully interactive
   at launch — tap places, pin, note in ANY county, honestly labeled preview.
2. **Submission trigger**: full G8 real-ChatGPT battery green + owner
   screenshot approval. Nothing else blocks or substitutes.
3. **Persistence is REQUIRED for launch**: the Hosted Clawd save surface
   ships ON and working (accounts + saved state across chats).
4. **Codex-driver human gates**: visual/band changes and production deploys
   need human eyes. Everything else self-certifies through the gate ladder.
5. Current build is the approved **pre-alpha**.

## Packet law (mandatory for every packet)

- Name the North Star moved + expected before/after BEFORE starting.
- Hard file fence + kill-criteria in the brief.
- Certification ladder (all reviewer-runnable):
  `typecheck:starter` → `test:core` (curated byte-identity) →
  `verify-archetype-identity-sweep` (3,222) → `verify-server-hardening` →
  build:web + restart :8787 → `verify-emulator-audit` → `verify-emulator-perf`
  → (post-deploy) `verify-release-prod` + `verify-alpha-public-sanity`.
- Result note in `artifacts/council/` with before/after, band deltas, risks.
- HUMAN GATE: any visual change = screenshots to owner; any deploy = owner
  runs `scripts/release-deploy.ps1`.
- Real-host proof: a packet touching user-visible behavior is DONE only
  after a G8 session confirms it inside actual ChatGPT (NS-0).

## P0 — Pre-alpha close-out (now)

- [x] P0.1 Deploy the UI de-slop build — LIVE `f6a28d9` 2026-07-12,
      release gate 9/9 + public sanity 3/3 in one clean pass.
- [ ] P0.2 G8 round 3: fullscreen expand, exploration feel, copy audit,
      cold-call timing, dark mode — findings to G8 doc. HUMAN: phone pass.
- [ ] P0.3 Emulator fidelity packet: serve widget assets from a second
      origin (catch CORS-class), gesture-gated requestDisplayMode already in;
      add displayMode global parity tests.
- [ ] P0.4 Worker service: clear Healthcheck Path in Railway dashboard
      (HUMAN), redeploy worker at HEAD, remove release-script guard.

## P1 — Interactive Everywhere (core program; NS-1/NS-5/NS-6)

Reality: generated scenes already carry places (labels/kinds/anchors).
Missing: interaction wiring + honest place identity + map-first answers.

- [ ] P1.1 Renderer/state interactivity in generated mode: enable place
      taps (`onSelectPlace`), selection ring, place labels; widgetState
      selection/pins/notes keyed by generated scene id. Fence: renderer,
      App/View state, types. Kill: Graphics ceiling or tap-select audit red.
- [ ] P1.2 Honest place identity: county seat name (Census, staged
      inventory) anchors the district name; place labels stay archetype-
      descriptive (no invented proper names). Tray copy for generated
      places generated from spec facts (tier, water, archetype).
- [ ] P1.3 Map-first questions everywhere: ask_county_question routes
      through the generated spec's own places client-compiled; camera
      intents computed widget-side for generated scenes (server can't see
      the compiled scene anymore). Closed-world honesty unchanged.
- [ ] P1.4 Inspector extension: audit gains generated-interaction cells
      (tap-select, pin, note on 3 anchor counties) — permanent.
- [ ] P1.5 G8 battery re-run on generated interactivity. HUMAN: screenshots.

## P1.5 — 0.78 REAL GEOGRAPHY (owner-approved 2026-07-12; full plan in
## ~/.claude/plans/keep-polishing-have-a-snappy-moore.md — copy into repo
## as docs/0.78_REAL_GEOGRAPHY.md at execution start)

Owner critique: "county isn't accurate, size isn't good" → counties become
REAL: TIGER/Line (public domain, honest) county silhouette boards, real
water, ALL roads via LOD streaming, real town names as tappable anchors,
town-tap → existing district engine re-anchored. Owner decisions: AAA bake→
version→serve pipeline (packs in repo/object storage, served via backend +
Redis cache); max detail via LOD0/1/2 (makes W6.1/6.2 renderer streaming a
REQUIRED phase 0.78-R). Phases: 0.78-R renderer LOD/streaming → 0.78-D TIGER
bake pipeline (reviewer machine, network) → 0.78-1 silhouette board (IoU
gate ≥0.85) → 0.78-2 real town anchors → 0.78-3 town detail → 0.78-4 honesty
copy re-line ("Real county shape, towns, and water from the U.S. Census.
Buildings are a generated preview."). Sequenced after P1.1/P1.2 land.

## P2 — Persistence for launch (NS-7)

Infra exists behind flags (Postgres, persistence adapter, Stripe test,
owner gate, claim/ack worker). Launch = real users can save.

- [ ] P2.1 Auth: MCP OAuth per Apps SDK spec (link ChatGPT user → Atlas
      account). Replaces owner_gated_test. Security review vs council
      security seat notes. Kill: any PII/scope creep.
- [ ] P2.2 Save surface production UX: ATLAS_SAVE_SURFACE=on path
      re-greened (7 hosted-clawd verifiers + new auth E2E gate); tray copy
      already de-jargoned. Saved-state read/write across chats proven in
      real ChatGPT (G8).
- [ ] P2.3 Billing go/no-go: OWNER DECISION packet — launch free-save or
      paid tier (Stripe live keys are a human gate regardless).
- [ ] P2.4 Durability: Postgres backup policy, Redis maxclients alerting
      (the outage class), /ready deep checks already in.

## P3 — Real-host excellence (standing, parallel)

- [ ] P3.1 Cold-call latency: verify G8-5 fixed the 31s deliberation; if
      not, iterate descriptions/annotations only.
- [ ] P3.2 True iPhone pass (owner device) each major deploy.
- [ ] P3.3 ChatGPT storage-quota watch (G8-2): confirm gone post payload
      cuts; if it recurs, spec-compile `_meta.scene` like the others.
- [ ] P3.4 Live-tail protocol: `railway logs` poll monitor during every
      G8 session (recipe in codex adapter).

## P4 — Submission (NS-7; trigger = owner decision #2)

- [ ] P4.1 Rotating challenge sweep as a standing gate: 16 random counties
      weekly through the emulator audit (slugs: parishes/boroughs quirks
      documented in 0.77 doc).
- [ ] P4.2 Art tail: prairie row contrast, signage 32px read, coastal
      first-frame composition polish. Crop test per change. HUMAN: visuals.
- [ ] P4.3 Landing page hosted (static host decision: HUMAN) + deep-link
      slot filled when listed.
- [ ] P4.4 Submission dry-run: verify-submission vs prod, manifest, icon,
      privacy/terms live-check, G6 legal re-confirm. Then submit. HUMAN.

## P5 — Post-submission ops

- [ ] P5.1 mcp-stats dashboard + error budget (p95 tool <150ms, crash-free
      sessions).
- [ ] P5.2 Incident runbook: the three production crash classes from
      2026-07-11 (unhandled redis error events; node-redis connectTimeout
      abort throw; maxclients exhaustion via crash-loop storms) + fixes.
- [ ] P5.3 Google lookup cost watch; cache hit-rate targets.

## Codex takeover protocol

Boot: `AGENTS.md` → `docs/NORTH_STARS.md` (Spend rules) → THIS FILE (queue,
top-down) → `docs/codex/CODEX_DRIVER_ADAPTER.md` (launch recipes, fences,
certification ladder, incident lessons) → `docs/G8_REAL_CHATGPT_FINDINGS.md`.
Work packets top-down; one packet per agent; disjoint fences for parallel
agents; result notes mandatory; STOP at human gates (visuals, deploys,
billing, submission) and report instead of proceeding.
