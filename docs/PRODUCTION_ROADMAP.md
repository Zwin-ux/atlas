# Atlas — Production Roadmap (THE mandatory queue)

Status: ACTIVE master queue as of 2026-07-15. Supersedes COUNCIL_VERDICT.md
(closed) as the work thread. Any driver (Fable, Opus, Codex) boots here
after `docs/NORTH_STARS.md` (NS-0 + Spend rules govern every packet).

## Owner decisions (updated 2026-07-15, binding)

1. **Submit Atlas County Scout, not the whole Atlas vision**: the review
   candidate is the focused ChatGPT county-scout product and its seven-tool
   read-only loop.
2. **Real town anchors everywhere**: all 3,222 supported counties must expose
   at least one real U.S. Census place anchor. Generated streets and buildings
   stay plainly labeled as generated.
3. **Session-only submission**: no auth, saved-account work, or billing in this
   submission. Hosted Clawd remains closed.
4. **Human gates remain human**: the portal/domain-token flow, real-ChatGPT G8,
   owner screenshots, submission click, and production deploy are not replaced
   by local automation.
5. **Codex-driver human gates**: visual/band changes and production deploys
   need human eyes. Everything else self-certifies through the gate ladder.
6. Current deployed build is the approved **pre-alpha**; the national-anchor
   submission candidate is local until a clean release is committed/deployed.

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
- [x] P0.1b Deploy the certified 0.78-1V county board envelope — LIVE
      `7016735` 2026-07-15, release gate 14/14 + public sanity 3/3. Worker
      remained skipped behind its healthcheck safety guard.
- [ ] P0.2 G8 round 3: fullscreen expand, exploration feel, copy audit,
      cold-call timing, dark mode — findings to G8 doc. HUMAN: phone pass.
- [x] P0.3 Emulator fidelity packet — LOCAL GREEN 2026-07-15. Every audit
      now loads component CSS/JS and lazy chunks from a second loopback origin,
      preflights `ACAO: *` + `CORP: cross-origin`, mirrors the sandbox
      `connect-src` / `img-src data:` split, and proves non-gesture `undefined`
      plus gesture-driven displayMode globals. Full audit: 182 pass / 0 warn /
      0 fail across 19 cells. Perf: 14 cells, max 829 Graphics and 30.5ms
      rebuild, 0 warnings/failures. Real-host confirmation remains P0.2.
- [x] P0.4a Worker code hardening: lazy Redis reconnects after `maxclients`,
      one adapter is reused across polls, transient poll failures recover, and
      worker readiness has a bounded health surface. Local regression tests
      and server build are green.
- [ ] P0.4b Worker production enablement: clear Healthcheck Path in Railway
      dashboard (HUMAN), deploy with `ATLAS_DEPLOY_WORKER=1`, and verify the
      live worker health/readiness surface before removing the guard.

## P1 — Interactive Everywhere (core program; NS-1/NS-5/NS-6)

Reality: generated scenes already carry places (labels/kinds/anchors).
Missing: interaction wiring + honest place identity + map-first answers.

- [x] P1.1 LIVE 3b6d28d - Renderer/state interactivity in generated mode: enable place
      taps (`onSelectPlace`), selection ring, place labels; widgetState
      selection/pins/notes keyed by generated scene id. Fence: renderer,
      App/View state, types. Kill: Graphics ceiling or tap-select audit red.
- [x] P1.2 LIVE 3b6d28d - Honest place identity: county seat name (Census, staged
      inventory) anchors the district name; place labels stay archetype-
      descriptive (no invented proper names). Tray copy for generated
      places generated from spec facts (tier, water, archetype).
- [x] P1.3 Map-first questions everywhere: ask_county_question routes
      through the generated spec's own places client-compiled; camera
      intents computed widget-side for generated scenes (server can't see
      the compiled scene anymore). Closed-world honesty unchanged.
- [x] P1.4 Inspector extension: audit gains generated-interaction cells
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

Current 0.78 status (2026-07-15): 0.78-1V is production-green behind
`?atlasGeoBoard=1`. The 16 challenge packs include real Census boundary and
water; the certified browser matrix covers Miami-Dade, Loving, and Kalawao at
desktop/mobile and light/dark with 138/138 checks green, including full county
terrain/water framing in all 12 first frames, max Graphics 40/1600, and max
rebuild 6.2ms/350ms. The flag remains dark. Owner screenshot review passed on
2026-07-13. Exact SHA `7016735` is deployed with 14/14 release gates and 3/3
public sanity checks green. Real-host G8 proof remains pending. A local
`0.78-2A` candidate now covers all 3,222 supported counties with 13,797 real
2024 Census place anchors, locates them through `ask_county_question`, renders
them on generated previews, and attaches them to the 16 exact county boards.
Its offline contract and worker regression gates are green. This does not
claim a national boundary/road bake, county-seat styling, town drill-down,
default-on exact county boards, deployment, or G8 completion; those are longer
0.78 program items, not blockers for the focused session-only submission.

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

## P4 — Submission (NS-7; scope = owner decisions #1-4)

- [x] P4.0 Local product contract: all 3,222 county entries have real Census
      town anchors; generated-layout boundaries are explicit; Redis worker
      failure recovery is release-gated; auth/save/billing remain closed.
- [ ] P4.1 Rotating challenge sweep as a standing gate: 16 random counties
      weekly through the emulator audit (slugs: parishes/boroughs quirks
      documented in 0.77 doc).
- [ ] P4.2 Art tail: prairie row contrast, signage 32px read, coastal
      first-frame composition polish. Crop test per change. HUMAN: visuals.
- [ ] P4.3 Confirm the existing hosted `/preview`, support, privacy, and terms
      against the committed candidate; no separate generic marketing homepage
      is required for this focused submission.
- [ ] P4.4 HUMAN/PORTAL: deploy the clean candidate, run G8 on web/mobile,
      obtain and publish the domain token, scan tools/CSP, verify publisher
      identity and permissions, then submit.

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

## P1.6 - 0.79 VISUAL GUARANTEE (approved 2026-07-12; docs/0.79_VISUAL_GUARANTEE.md)
Per-county visual score + worst-50 report (floor gates), challenge-set pixel snapshots, stratified weekly sampler (P4.1 retargets here). 0.79-1/-3 run parallel with 0.78-R; 0.79-2 after it lands.

### 0.78-R status (2026-07-12): REVERTED after 2 rounds - chunked renderer held 2321->3972 Graphics mid-zoom-transition (its own probe caught it); work preserved in git stash '078R chunked renderer'. Lesson: blind codex renderer surgery does not converge; 0.78-R is a REVIEWER-lane browser-in-the-loop task (Spend rule 3). jefferson-al canvas_single load-flake under multi-agent churn: re-verify on quiet box.

### 0.78-R hands-on design (reviewer session, from stash forensics): root flaw = retainedChunkMatches includes lodTier, so tier crossings invalidate ALL chunks at once (old+new coexist mid-rebuild -> 2321-3972 Graphics). Correct design: per-chunk PER-TIER sub-containers, zoom transitions flip .visible only (zero rebuild); gate evolution required: QA counter splits visibleGraphics (draw ceiling 1600) vs totalGraphics (memory ceiling, higher). Geometry-changing refreshes swap per-chunk atomically (destroy old before add new within the same pass). Start from git stash '078R chunked renderer'.

## P6 - ATLAS COMMONS (vision approved 2026-07-12; docs/ATLAS_COMMONS_VISION.md)
Personal Atlas vs Global Atlas layer architecture (census/generated/global/personal provenance stack; git-for-worlds promotion; moderation only at the promotion boundary; 0.79 floors gate merges). Prerequisite: P2 auth+persistence. Sequencing: personal layer ships WITH P2; global commons post-submission.
