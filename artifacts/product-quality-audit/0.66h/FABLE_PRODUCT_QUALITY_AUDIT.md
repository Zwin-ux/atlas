# Atlas 0.66H Product Quality Professor Audit

Date: 2026-07-05. Auditor: Fable (professor / senior product designer / performance engineer).
Rubric: `docs/design/fable-prompts/PRODUCT_QUALITY_PROFESSOR_AUDIT_0.66H.md`.

**Evidence limitations, stated up front.** A prior browser-automation pass hung, so
live timing (first paint, time-to-interactive, pan frame timing, console output,
heap, Pixi display-object counts) was **not measured** in this pass. This audit is
built from: the desktop screenshot (`screens/desktop-1280x720-rest.png`), the mobile
Hosted Clawd screenshot (`artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-mobile-390x844.png`),
static source inspection, and the known payload numbers (JS ~1.0 MB, CSS ~80 KB,
`/preview` HTML ~1.08 MB). Where a finding is architectural rather than measured, it
is labeled as such. All unknowns are recorded in `metrics.json`. Verifier-green is
not product-green, and this audit does not treat it as such.

---

## 1. Grade

| Category | Weight | Score | Notes |
| --- | ---: | ---: | --- |
| First impression | 15 | 8 | Desktop at rest is charming but reads as a prototype HUD: three stacked chrome panels in the top-left (county switcher, legend/honesty panel, "Turn to a new district") compete before the world does. The map itself is the best thing on screen and it is partially covered. |
| Visual engine quality | 20 | 9 | Authored diorama charm is real, but massing is undermined by semi-transparent building faces (alpha 0.95 fills plus overlapping ghosted volumes in the desktop shot), and floating text labels ("Neighborhood Blocks", "Plaza Row", "Gym") are doing the compositional work the geometry should do. It reads as a small diorama, not a county engine. |
| Mobile touch UX | 15 | 6 | The Hosted Clawd tray is a wine-dark `aria-modal` dialog that covers roughly the bottom 55–60% of a 390×844 screen, steals focus on mount (`closeButtonRef.current?.focus()` in `HostedClawdTray.tsx:24`), and leaves the map as a backdrop. Zoom controls are hidden whenever a preview is open (`styles.css:3424`). |
| Performance feel | 20 | 7 | Not timed live (automation hung), but the architecture makes hitching near-certain: every pointermove during a pan triggers React state → effect → **full scene-graph teardown and rebuild** (`world.removeChildren()` at `PixiVoxelSceneView.tsx:262`, then every tile, edge, building, label, and ambient object redrawn). A 1.08 MB inline HTML payload is heavy for a ChatGPT iframe first load. |
| Product coherence | 15 | 8 | Scout, Campaign, and Save are three separate overlay prototypes. The save tray's clay/maroon theme directly violates the app's own declared design law (`styles.css:1–11`: chrome is achromatic, world is the only color). The 1–4 OPEN/TARGET/SCOUT/CAMPAIGN wizard strip feels pasted over the map, not native to it. |
| Technical readiness | 15 | 8 | Real strengths: clean Pixi→SVG fallback, stable MCP tool surface, tests and verifiers, QA data attributes. Real debts: ~1.0 MB JS bundle, 3,451-line CSS with three stacked Hosted Clawd styling generations (base, mobile media block ~line 2855, "final cascade layer" at line 3157 that `display:none`s DOM the component still renders), and an immediate-mode redraw architecture. |
| **Total** | **100** | **46** | |

- **Current letter grade: D+** (46/100). This matches the human instinct; the code confirms it rather than contradicting it.
- **Current percentage complete: ~52%** (breakdown in section 4).
- **One-sentence reason:** The world art has genuine charm, but the render path rebuilds the entire scene on every pan event, the payload is too heavy for a ChatGPT iframe, and the save experience is a foreign-looking modal that fights the map instead of belonging to it.
- **Minimum acceptable grade for the next gate: C (60/100)**, driven by measured pan timing and a demoted mobile save panel — not by more documentation or verifiers.

---

## 2. What is actually failing

**What feels slow.** Dragging the map. Every pointermove during a drag calls
`setPan` (`PixiVoxelSceneView.tsx:88`), which re-runs the draw effect
(`PixiVoxelSceneView.tsx:160–185`), which destroys and rebuilds every display
object in the world — tiles, side faces, roads, houses, trees, ambient life,
places, stickers, labels. Pixi `Text` objects rasterize a texture on creation, so
labels are re-rasterized mid-drag. Hovering a place does the same thing
(`hoverPlaceId` is in the effect's dependency list). Separately, first load ships
~2 MB of HTML+JS into an iframe before the map exists. Neither was clock-timed in
this pass, but the first is structural: the cost scales with scene size and will
get worse, not better, as the county grows.

**What feels confusing.** On mobile, opening the save tray transforms the app from
"a map" into "a dark form on top of a map." The tray announces itself as ATLAS with
its own window bar, its own color world, and a 4-step wizard — it looks like a
different product interrupting this one. On desktop, three stacked panels of
meta-commentary (what's playable, what's temporary, what's session-only) front-load
honesty copy before the user has done anything to need it.

**What feels visually weak.** Building faces are drawn at alpha 0.95 with
overlapping ghosted volumes, so massing reads translucent and unfinished — see the
washed-out block cluster in the upper-left of the desktop screenshot. Silhouettes
don't carry the composition; floating pill labels do. The world reads as one cute
diorama block, roughly a screen's worth of content, not a county you could travel.

**What feels overbuilt.** The Hosted Clawd tray renders a window bar, a local-view
block, billing steps, a recovery section, and a motion rail, and then the CSS's
"final cascade layer" (`styles.css:3157–3450`) hides most of them with
`display:none` (`styles.css:3193–3202`). That is three generations of styling
archaeology and dead DOM shipped to every user. The dense `data-qa-*` attribute
surface on the tray (`HostedClawdTray.tsx:40–47`) is markup written for the
verifier, which is exactly the verifier-green trap this audit exists to catch.

**What feels missing for a real ChatGPT app.** A save state that behaves like an
app state instead of a modal: something that can sit collapsed at the edge of the
map, be glanced at, and be thumbed open. A world that responds instantly to touch.
A first load light enough that the widget appears before the user's attention
lapses. Per the product's own audience note, this all matters most on the MCP
widget surface (mobile/panel viewports), which is less forgiving than `/preview`.

---

## 3. Why it is laggy or heavy

**Proven by source inspection:**

1. **Full scene rebuild per interaction event.** `drawScene`
   (`web/src/PixiVoxelSceneView.tsx:222–294`) starts with `world.removeChildren()`
   and reconstructs every Graphics/Text object. Its callers include `pan`, `zoom`,
   and `hoverPlaceId` in the effect deps (`PixiVoxelSceneView.tsx:185`), so panning
   and hovering pay full-scene cost per event. Pan should be
   `world.position.set(...)` on an already-built container; it is currently a
   teardown.
2. **React render in the pointermove path.** `handlePointerMove` →
   `setPan` (`PixiVoxelSceneView.tsx:83–89`) routes every drag sample through a
   React render cycle before the canvas moves. No rAF batching.
3. **Payload weight.** `web/dist/component.js` ~1.0 MB (Pixi.js bundled in),
   `component.css` ~80 KB, and `/preview` inlines the whole widget for a ~1.08 MB
   HTML document. Known numbers, not re-measured here.
4. **CSS layering debt.** `web/src/styles.css` is 3,451 lines; Hosted Clawd is
   styled three times (base rules, the `@media` mobile block near line 2855, and
   the override layer at 3157 with its own nested `@media` at 3423). Overrides
   include hiding rendered DOM and `animation: none` on slots that earlier layers
   animate (`styles.css:3314`), meaning motion rules exist that a later layer
   suppresses rather than removes.
5. **Modal focus capture.** `HostedClawdTray.tsx:23–25` moves focus into the tray
   on mount, so any flow that opens it takes the user's context away from the map
   by design.

**Likely but not measured (needs the timing pass that hung):**

- Actual frame times during pan on a mid-tier phone — expected poor given (1) and
  (2), but unquantified; recorded as unknown in `metrics.json`.
- First visible map and time-to-interactive in a ChatGPT iframe.
- The dark-theme `filter: brightness() saturate()` over the whole renderer
  (`styles.css:139–148`) and the post-grade filter cost — plausible GPU cost,
  unverified.
- `prefers-reduced-motion` behavior — no handling was found in the inspected CSS
  regions or the tray component, but absence was not proven exhaustively; treated
  as unverified and flagged for the next browser pass.
- Console errors/warnings at runtime — unknown.

---

## 4. What percentage is real

The user's 60% instinct, decomposed:

| Dimension | Estimate | Basis |
| --- | ---: | --- |
| Product concept completeness | 75% | The loop (select county → explore → scout → campaign → save) exists end to end and the anti-scope has been held; the concept is the strongest layer. |
| Visual engine completeness | 45% | One authored diorama with charm; translucent massing, label-carried composition, no county-scale coherence yet. |
| ChatGPT app integration completeness | 65% | Seven stable public tools, working preview, auth challenge proven — but a 1.08 MB inline payload and desktop-first chrome are not iframe-native. |
| Mobile UX completeness | 40% | Safe-area and 44px targets exist in CSS, but the save tray dominates the screen, steals focus, and zoom controls vanish under previews; no measured touch timing. |
| Monetized save-state/service completeness | 55% | Persistence foundation, auth gate, and Stripe test billing scaffolding exist; the paid path is read-only-gated and unproven as a felt product flow. |
| Performance/readiness completeness | 35% | The render path is architecturally wrong for interaction (rebuild-per-event), payloads are heavy, and no felt-performance measurement exists yet. |

Weighted roughly by the rubric's priorities, the honest overall figure is **~52%**
— slightly below the 60% instinct, because the two heaviest-weighted rubric
categories (visual engine, performance feel) are the two weakest layers.

---

## 5. The next three implementation slices

### Slice 1 — 0.66H-a: Retained scene graph (pan/zoom must be free)

- **Player-facing promise:** Dragging and zooming the map feels instant on a phone;
  nothing stutters mid-gesture.
- **Engineering promise:** Build the Pixi world once per scene change. Pan/zoom
  apply as container transforms (`world.position` / `world.scale`) inside a rAF
  loop driven by refs, never through React state. Hover changes mutate the two
  affected display objects (alpha/tint), not the world. `world.removeChildren()`
  runs only when `scene` identity changes.
- **Files likely touched:** `web/src/PixiVoxelSceneView.tsx` (primary),
  `web/src/VoxelSceneView.tsx` (shared props/fallback parity).
- **Anti-scope:** No new visual features, no new props/labels, no renderer swap,
  no Anaheim/Ontario.
- **Metric/verifier:** A browser proof that records pointermove-to-frame timing
  during a scripted 2-second pan at 390×844 and 1280×720, writing p50/p95 frame
  times to an artifact JSON.
- **Acceptance criteria:** (1) No `removeChildren`/rebuild in the pan, zoom, or
  hover paths — verifiable by an instrumented rebuild counter that stays at 1
  during a pan; (2) p95 frame time ≤ 16.7 ms desktop and ≤ 33 ms mobile-emulated
  during pan; (3) SVG fallback still renders; (4) build/typecheck/tests green.

### Slice 2 — 0.66H-b: Demote the Hosted Clawd tray to a native bottom sheet

- **Player-facing promise:** Save state is a small sheet at the bottom of the map
  you can glance at, thumb open, and dismiss — the map never disappears behind it.
- **Engineering promise:** The tray becomes a two-state bottom sheet: a collapsed
  peek row (≤ 96 px, shows status "N/4 ready" and the primary action) and an
  expanded state capped at 45dvh. Focus moves into it only on explicit expand.
  Restyle in the app's achromatic chrome grammar (delete the clay background,
  window bar, and maroon theme). Delete DOM that the final cascade layer currently
  hides, then delete the final cascade layer itself, collapsing Hosted Clawd
  styling to one generation. Verify `prefers-reduced-motion` disables slot/rail
  animation.
- **Files likely touched:** `web/src/HostedClawdTray.tsx`, `web/src/styles.css`,
  `web/src/App.tsx` / `web/src/CityWorldView.tsx` (open/close state),
  `scripts/verify-hosted-clawd-save-ux-browser.mjs` (update expectations).
- **Anti-scope:** No new save features, no billing changes, no pricing surface, no
  new copy beyond relabeling, no dashboard shell.
- **Metric/verifier:** Browser proof asserting expanded sheet height ≤ 45% of
  viewport at 390×844, collapsed ≤ 96 px, map pointer events functional while
  collapsed, zero horizontal overflow, reduced-motion media query honored.
- **Acceptance criteria:** (1) Mobile screenshot pair (collapsed/expanded) shows
  the map dominant in both; (2) no `display:none` sections remain in the tray DOM;
  (3) exactly one Hosted Clawd style generation in `styles.css`; (4) `aria-modal`
  and focus trap apply only in the expanded state; (5) existing save/auth
  verifiers still pass.

### Slice 3 — 0.66H-c: Payload diet for the ChatGPT iframe

- **Player-facing promise:** The map appears fast inside ChatGPT — the world is
  visible before the user wonders whether it loaded.
- **Engineering promise:** Split Pixi.js into a lazily loaded chunk; render the
  existing SVG fallback as the immediate first paint and upgrade to Pixi when the
  chunk arrives. Stop inlining the full widget into `/preview` HTML (serve
  script/style by reference with correct caching), or if inlining is an MCP-widget
  constraint, document it and cut the inline body instead. Purge dead CSS layers
  freed by Slice 2.
- **Files likely touched:** `scripts/build-web.mjs`,
  `web/src/PixiVoxelSceneView.tsx` (dynamic import), server preview route
  (`server/src/index.ts`), `web/src/styles.css`.
- **Anti-scope:** No renderer replacement, no feature removal, no visual redesign,
  no service-worker/CDN infrastructure.
- **Metric/verifier:** Artifact JSON recording initial HTML bytes, eagerly loaded
  JS bytes, total JS bytes, CSS bytes, and time-to-first-visible-map from a
  scripted cold load.
- **Acceptance criteria:** (1) Initial HTML ≤ 300 KB; (2) eager JS ≤ 400 KB with
  Pixi deferred; (3) first visible map (SVG acceptable) ≤ 1.5 s on a throttled
  "Fast 3G / 4× CPU" profile; (4) MCP tool surface unchanged; (5) all existing
  verifiers green.

Slices 1 and 2 together constitute the rubric's `0.66H Mobile Interaction
Hardening` gate; the render-path defect in Slice 1 is the more basic blocker the
rubric asked us to check for, so it goes first.

---

## 6. Prompt for the coding agent

> **Task: Atlas 0.66H Mobile Interaction Hardening — slice 1 of 3 (retained scene
> graph), then slice 2 (bottom-sheet save tray).**
>
> Context: `web/src/PixiVoxelSceneView.tsx` currently rebuilds the entire Pixi
> world (`world.removeChildren()` in `drawScene`) on every pan pointermove, zoom
> step, and hover change, because `pan`, `zoom`, and `hoverPlaceId` are React
> state in the draw effect's dependency list. This is the primary lag source.
>
> 1. Refactor `PixiVoxelSceneView.tsx` so the scene graph is constructed once per
>    `scene` change. Move `pan`/`zoom` to refs updated by pointer/wheel handlers
>    and applied as `world.position`/`world.scale` inside a single rAF tick.
>    Handle hover by mutating only the affected place objects. Add a rebuild
>    counter (dev-only) to prove one build per scene. Keep the SVG fallback path
>    working.
> 2. Rework `web/src/HostedClawdTray.tsx` + `web/src/styles.css` into a two-state
>    bottom sheet: collapsed peek ≤ 96 px, expanded ≤ 45dvh, achromatic chrome per
>    the design system header in `styles.css` (delete the clay/maroon theme,
>    window bar, and every DOM section the final cascade layer at
>    `styles.css:3157` hides — then delete that layer). Focus trap and
>    `aria-modal` only when expanded. Honor `prefers-reduced-motion`.
> 3. Add a browser proof script (pattern:
>    `scripts/verify-hosted-clawd-save-ux-browser.mjs`) that measures p50/p95
>    frame time during a scripted 2 s pan at 390×844 and 1280×720 and asserts the
>    sheet geometry above; write results to
>    `artifacts/product-quality-audit/0.66h/` and update `metrics.json` unknowns.
>
> Hard constraints: no new public MCP tools; no changes to the seven public tool
> contracts; Riverside/Eastvale only; no dashboard/landing/pricing surfaces; no
> decorative props as quality cover; build, typecheck, and existing tests must
> stay green. Acceptance = the criteria in section 5 of
> `artifacts/product-quality-audit/0.66h/FABLE_PRODUCT_QUALITY_AUDIT.md`.
