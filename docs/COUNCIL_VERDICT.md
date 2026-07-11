# Council Verdict — 11-seat critical review, synthesized

Status: ACTIVE master work thread (2026-07-10; progress 2026-07-11 — W1+W2
complete and committed, W4.1+W5.3/5.4 shipped, W3+W4.2/4.3/4.5 in flight;
production deploy staged: worktree at Documents/atlas-deploy-worktree linked
to atlas-backend, ATLAS_SAVE_SURFACE=off set, awaiting human `railway up`). Sources: ten parallel Codex
seats (`artifacts/council/*.md` — cold-user, directory-reviewer, art-director,
perf-engineer, SRE, security, product-PM, a11y, HN-cynic, conversation-
designer) + the reviewer's visual seat (screenshots vs the north-star art).
~56 findings, deduped and ranked by (ship impact × evidence strength).

## The consensus, in one paragraph

The engine is no longer the weakest link — **the product truth is.** Four
seats independently converged on the same critique: the app promises "your
county," durable value, and a business agent, while delivering one playable
county, session-disposable state that the UI actively teases saving, and a
hardcoded Eastvale demo behind a generic input form. Security and SRE found
real exposure (one reflected XSS — fixed same-day), the conversation seat
showed NS-5 is still a slogan (answers don't drive the camera), and the
art/perf seats agree the next engine level is organic layouts + building
attachments, not more bands and floors.

## Wave 1 — TRUTH & SAFETY (ship-blocking; smallest diffs)
- [x] **W1.1 XSS**: `/emulator` reflected XSS via `?county=` → slug-sanitized
  (fixed with this doc's commit).
- [x] **W1.2 `/emulator` prod exposure**: 404 when NODE_ENV=production (same).
- [x] **W1.3 Railway healthcheck** `/health` → `/ready` (deep readiness; same).
- [x] **W1.4 MCP endpoint hardening**: Origin/Host allowlist + DNS-rebinding
  defense on `/mcp`; CORS `*` → explicit hosts. (security #1, directory #2)
- [x] **W1.5 Copy truth pass**: submission subtitle "your county" +
  session-only claims vs the hosted-clawd billing surfaces in prod. Per the
  user's standing V1 decision: HIDE the save/billing surface (the 7-verifier
  gated slice) and align `chatgpt-app-submission.json` copy with reality —
  "Explore Riverside as a voxel town; preview any US county as a generated
  draft." (directory #1, hn #1/#4, cold-user #1)
- [x] **W1.6 Rate limits**: key by client+county, cover expensive MCP tool
  paths, stop trusting spoofable headers. (security #3, sre #4)
- [x] **W1.7 Hosted-clawd write routes**: hard router gate (404 at the router
  when persistence env is off), not late service denial. (security #4)

## Wave 2 — THE RETURN LOOP (the #1 product gap; every product seat)
- [x] **W2.1 Durable-in-conversation state**: pins/notes/scout already live in
  widgetState (host-persisted per conversation) — make the TOOLS read it back:
  select_county/render answers should summarize "your 3 pins, 1 note, last
  scout" so returning to the chat RESUMES instead of resets. No new
  persistence, no gate conflicts — pure honesty about what already survives.
- [x] **W2.2 Stop teasing the save** (part of W1.5's hide) and reframe the
  boundary copy from apology to feature: "lives in this chat."
- [x] **W2.3 Campaign continuity**: preview_campaign_engine reconstructs the
  scout instead of remembering it and hard-throws on id drift → carry
  scoutPreviewId through widgetState + degrade to graceful re-scout.
  (pm #3, cold-user #4)
- [x] **W2.4 Scout de-faking**: parameterize ScoutDropService by the ACTUAL
  scene (selected place, county label, archetype signals) instead of
  hardcoded Eastvale/mobile-detailing strings — template-based is fine;
  place-blind is not. (pm #2, hn #3)

## Wave 3 — NS-5 FOR REAL (conversation-designer, full seat)
- [x] **W3.1 Camera intents in tool results**: structuredContent gains
  `cameraIntent` (focus place / district / water-edge / landmark) the widget
  applies — the model can finally SHOW its answer.
- [x] **W3.2 ask_county_question renders map-first**: attach the scene +
  focus intent so answers stop being transcript-only.
- [ ] **W3.3 Compare intent**: two-place selection/focus (biggest new
  conversational surface; scope carefully).
- [x] **W3.4 Question-service breadth**: beyond 5 topics/3 lanes/regex — route
  through place/zone data so "where's the park?" works everywhere.

## Wave 4 — ART: THE HAND-BUILT LEVEL (art-director + visual seat)
- [x] **W4.1 Building attachments kit**: porches, awnings, chimneys, AC
  units, dormers as compiler-authored building sub-geometry — the single
  biggest procedural-vs-hand-built tell.
- [x] **W4.2 Road tone rebalance**: narrower/lighter residential lanes,
  sidewalk strips — roads currently dominate every frame like highways.
- [x] **W4.3 Board edge treatment**: resolve the diorama edge (shore fade /
  pedestal) instead of the abrupt olive cut.
- [ ] **W4.4 Organic layouts**: break the rectilinear template read —
  curved/diagonal road seeds per archetype (art seat's #1; largest scope).
- [x] **W4.5 Tree variety + signage-as-geometry** (2-3 tree species; storefront
  lettering blocks like the reference's PLAZA/GYM).

## Wave 5 — A11Y (a11y seat; directory review risk too)
- [ ] **W5.1 Keyboard/SR place navigator** bound to onSelectPlace + DOM map
  summary (canvas is currently invisible to AT — critical).
- [ ] **W5.2 Real modal for the sheet** (focus trap, inert background).
- [x] **W5.3 Pixi reduced-motion**: disable inertia/pulse/ambient when
  prefers-reduced-motion.
- [x] **W5.4 AA contrast**: --ink-3 and yellow status dot fail on translucent
  panels — retune tokens.

## Wave 6 — PERF/SRE ARCHITECTURE (bigger; schedule deliberately)
- [ ] **W6.1 Real streaming windows**: chunk-based visibility instead of
  whole-scene scans (perf #1).
- [ ] **W6.2 Incremental rebuilds**: stop full teardown on window/texture-gate
  crossings (perf #2).
- [ ] **W6.3 Worker job durability** (claim/ack semantics) + **W6.4 shared
  rate limiting** + **W6.5 MCP handling instrumentation** (sre #1/#4/#5).

## Payload watch (2026-07-11, post-W4-art)
Generated draft `_meta` payloads now run 818-877KB against the 900KB watch
ceiling (worst: butler-al 877KB) — W4's art metadata consumed most of the
remaining headroom. **0.76-T ship-params-not-scenes is now URGENT**: ship the
compact spec, compile client-side (core is already in the widget bundle),
collapse `_meta` ~100×. Schedule it with or before W6.

## Standing note
The engine-quality program (0.76 + E1–E10) is DONE and gated; council seats
confirmed its floors hold. The next sessions work THIS list, top down, same
rhythm: Codex builds, the emulator certifies, the reviewer judges, the gates
remember.
