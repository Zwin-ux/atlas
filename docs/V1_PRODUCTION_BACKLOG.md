# Atlas V1 Production Backlog — the road to the USA-region bar

Status: ACTIVE master plan (2026-07-10). Owner: Fable orchestrator + Codex driver.
Shaped by the user's V1 decisions: **equal-weight desktop/mobile · HOLD directory
submission until generated counties pass the crop test · HIDE the save surface
in V1 · first-run hint overlay for help.** Built from the full-app deep-read
(UI / server / engine maps, 2026-07-10) — every item carries file:line evidence.

## Track A — Touch feel (renderer; ChatGPT-on-phone is a primary surface)
- A1 **Pinch anchors to screen center, not fingers** — zoom math at
  `CityWorldRenderer.tsx:623` scales around the preset center; pinch should
  anchor at the finger midpoint. The single biggest phone-feel defect.
- A2 **No pan inertia** — camera stops dead on release (`:639-641`); add light
  momentum with parked-loop-friendly decay.
- A3 **2px move threshold eats sloppy taps** (`:637`) — a slightly-moving tap
  becomes a pan and loses the selection; raise to ~6-8px with tap-slop logic.
- A4 **Mid-pinch full rebuild at the 1.55 material-texture crossing**
  (`:768-770`, `:1056`) — defer the window-refresh until gesture end.
- A5 Hover work runs on touch pointermove (`:628`) — skip for pointerType touch.

## Track B — UI health (widget)
- B1 **Delete the dead chromatic "maroon console" CSS** (`styles.css:513-822,
  1143-2066`) — violates "map is the only color"; its `data-status` rules
  conflict with the live sheet (`3422-3429`) on save-slot dot colors.
- B2 **Hide the save surface for V1** (user decision): remove/flag the
  `hosted-clawd-open` entry (`CityWorldView.tsx:255-259`) + tray mount; keep
  the session-boundary copy. Purest session-only story for review.
- B3 **First-run hint overlay** (user decision): one-time quiet
  "Drag to explore · Pinch to zoom · Tap places", fades on first interaction.
- B4 **Zoom controls vanish under mobile preview** (`styles.css:786-789`) —
  phone users lose recenter while a scout/campaign panel is open.
- B5 **Generated mode silently noops taps** (`CityWorldView.tsx:154`) — add a
  quiet response (banner pulse) so touch isn't dead air.
- B6 **No in-flight state for model round-trips** (`App.tsx:463,651`) — the
  audit's "CTAs look dead" root cause; show a quiet pending hint.
- B7 Place description `display:none` on mobile (`styles.css:3103`) + `title`-
  only tooltips — key context lost on touch; surface it in the tray.
- B8 Note input maxLength=160 silent truncation (`CityWorldView.tsx:269`).

## Track C — Engine to the USA-region crop-test bar (0.76 continuation)
- C1 **0.76-4 terrain features** (mesa rims, cliff courses, river banks) —
  also lifts the weakest composition tails (prairie 0.631 / river 0.637).
- C2 **Curated-id hardcoding divergence**: `materialProfile`/`roofProfile`/
  anchor treatments key off Eastvale/Anaheim ids (`cityWorldCompiler.ts:1459,
  1533,1560-1566`) — generated districts silently degrade to defaults. Route
  through authored grammar instead of id matches.
- C3 Non-civic towers fall through to terracotta (`cityWorldCompiler.ts:1505`)
  — the prairie grain-elevator/desert mesa tower need tower roof grammar.
- C4 River clone pressure sits at the 0.30 ceiling — add residential template
  variety before any further density.
- C5 0.76-5 gate promotion (floors → curated-equivalence) + full-index sweep.
- C6 Zone-erasure retry is single-shot with no telemetry
  (`cityWorldParametricGenerator.ts:188-196`) — log when it fires/fails.

## Track D — Emulator / product inspector (the instrument)
- D1 Commit the perf harness (gate re-running post reviewer-patch: tabs now
  disposed per cell).
- D2 Product-audit harness (13-check catalog, brief ready) — one command:
  "is the product good right now"; findings-first REPORT.md + screenshots.
- D3 Touch cells (scripts/lib/touch.mjs real CDP touch) wired into the audit —
  pan/pinch/tap-select must respond; 44px target audit.
- D4 0.76-T ship-params-not-scenes: collapse the ~780KB `_meta` transport
  ~100× via client-side compile (arch doc §5) — the scale unlock.

## Track E — Server hardening (pre-deploy; from the server map)
- E1 CORS `*` + no DNS-rebinding/allowedHosts on the MCP transport
  (`server/src/index.ts:1522-1526`) — tighten before public deploy.
- E2 Generated-draft worker is opt-in and forgettable — if
  `ATLAS_SCENE_PACKET_WORKER_ENABLED` is unset, lock-contended drafts stay
  "queued" forever. Document in the deploy runbook or add inline fallback.
- E3 Draft rate limit keyed by county only (`:1033`) — one abuser exhausts a
  county for everyone; key by client+county.
- E4 `preview_campaign_engine` hard-throws on scoutPreviewId drift (`:2621`) —
  degrade to a graceful re-scout.

## Sequencing
1. **D1→D2→D3** (finish the instrument; everything else is judged through it)
2. **A1-A5 + B1-B6** (touch feel + UI health — the native-quality pass, verified
   per-change in the emulator at both viewports)
3. **C1-C4** (engine to the crop-test bar, batch-verified)
4. **D4 + E1-E4** (transport unlock + hardening) → deploy → submit when the
   crop test passes for generated counties.
