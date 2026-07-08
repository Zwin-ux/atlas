# Atlas — North Stars

Status: ACTIVE quality track (human-directed, 2026-07-07). Companion to
`PRODUCT_SPEC_AND_GATES.md`: the gates are **floors** (submittable), these are
**ceilings** (what 10/10 means per feature). Every quality pass names the north
star(s) it moves and rates before/after honestly against it.

---

## The idea, fleshed out

**ChatGPT grows a map.** When a conversation touches a place, Atlas opens a
hand-built voxel diorama of that place inline — county-scale, isometric,
explorable. Not a map widget embedded in chat: an **explorable answer**. Ask
about Eastvale and instead of paragraphs you get the town itself — its road
grid, its houses, its river dock — and the conversation keeps going *through*
the map: the model focuses cameras, pins places, drops a scout, previews a
campaign.

Three commitments define the product:

1. **Voxel, deliberately.** The diorama look is an honesty device as much as an
   aesthetic. A voxel town never pretends to be satellite truth — it reads as a
   crafted model of a place, which is exactly what it is. It is also memorable,
   cheap to render, and unlike anything else in the directory.
2. **Native, deliberately.** Atlas behaves like a capability ChatGPT always
   had, not an app that rents space in it. The chrome is ChatGPT's own grammar;
   the map is the only colorful thing on screen.
3. **Scalable, deliberately.** Riverside/Eastvale is the proof cell of one
   world model that ladders county → state → country. Curated and generated
   scenes are held to the same bar — the parity gates exist so "generated"
   never becomes a second-class citizen.

The engine and the in-ChatGPT quality **are** the product. Everything below is
that sentence, made testable.

---

## How to read a north star

Each entry: the one-line ideal → the reference anchor → **"you've hit it
when"** tests (falsifiable, most already verifier-enforced) → honest current
state. Gates keep us shippable; north stars keep us proud.

---

## NS-1 · The Diorama — every scene reads hand-built

**Ideal:** any district, curated or generated, reads as a miniature town
someone assembled by hand, block by block.

**Anchor:** `assets/reference/atlas-voxel-town-north-star.png`.

**You've hit it when:**
- A cold screenshot of a generated district fails the "which one is curated?"
  test against Eastvale.
- No flat color field survives at any supported zoom: overview reads massing
  and palette; detail zoom reads material (courses, seams, texture).
- Occlusion is always correct — props, buildings, terrain interleave by true
  iso depth at every zoom.
- Residential fabric is dense and varied: continuous small-house streets, no
  empty-lot gaps, no visible clones.
- Terrain has relief — plateaus, cliff courses, shore basins — and props feel
  *placed* (a dock where the river is, a water tower on the highest block),
  never sprinkled.

**Enforced by:** `verify-generated-district-parity` (composition ≥0.60, clone
pressure ≤0.30, contact ≥0.95, roof safety), fabric-floor regression test,
depth-interleave ordering test, screenshot evidence per pass.

**Current:** ~7.5/10 after 0.74F; 0.75C series is closing occlusion (s1 ✅),
fabric (s2 ✅), and close-zoom material (s3 in flight).

---

## NS-2 · Weightless — the map costs nothing

**Ideal:** Atlas is indistinguishable from static content until touched — then
it responds within a frame. It never taxes the conversation it lives in.

**You've hit it when:**
- Idle parks at 0fps; ambient animation is wall-clock capped.
- Hover/selection never rebuilds the scene — overlay-only, always.
- Scene rebuild stays ≤25ms typical (gate: 350ms); pan is transform-only.
- The 390×844 phone experience is as smooth as desktop — no tier split.
- World Graphics stay ≤1,600 deterministic worst-window (currently ~844) so
  the merged-architecture can never silently regress.

**Enforced by:** `verify-widget-performance` (hover/idle/pan/rebuild/ceiling
gates + QA-handle bisection gate).

**Current:** green and strong — 10ms rebuilds, 0fps idle. Defend, don't chase.

---

## NS-3 · ChatGPT-native — the chrome disappears

**Ideal:** it looks and feels like OpenAI shipped it. A user should believe
ChatGPT grew a map, not that a web app was embedded in one. *(Standing user
directive, 2026-07-07: highest standards — coding, UI, and presentation all
read first-party.)*

**Anchor:** ChatGPT's own surface grammar + the 0.48P "Instrument" doctrine —
weightless hairline chrome, color only in the map, no pills/glows/hover chrome.

**You've hit it when:**
- **The crop test:** a cropped screenshot of Atlas chrome (tray, labels,
  buttons, empty states) placed beside native ChatGPT UI cannot be told apart
  in typography, spacing rhythm, radii, or motion restraint.
- Light and dark themes are both first-class — parity, not port.
- Copy is directive and quiet: no narrating what's visible, no leaked internal
  field names, no exclamation marks, no SNES-staccato slop.
- Loading, empty, and error states are as designed as the happy path.
- Motion is sub-150ms, purposeful, and never decorative.
- The map remains the only saturated thing on screen — if a screenshot's color
  histogram lights up outside the canvas, something is wrong.
- The code would survive a first-party review: no hacks that need apologizing
  for, deterministic renders, contracts verifier-enforced.

**Enforced by:** widget verifier (console/overflow/both-viewports), 0.48P
doctrine docs, and the **presentation audit** (Fable-owned) after the 0.75C
engine series — findings become specced fix packets.

**Current:** 0.48P landed the doctrine; unaudited against the raised bar.

---

## NS-4 · Honest — the map never lies

**Ideal:** every pixel is either curated truth or clearly declared synthesis.
This is the app's moral spine and its directory-review armor.

**You've hit it when (and must never stop hitting):**
- Generated scenes always carry the synthetic/session-only banner — asserted,
  not intended.
- Coverage is honest: unsupported counties say so; shells render as shells.
- No provider geometry ever reaches the renderer; no persistence, no paid
  claims, no auto-posting — session-only is true, not marketing.
- Diagnostics gate honesty structurally (`authored*ContactRatio`, effective-
  color checks) so the renderer cannot quietly diverge from what the compiler
  authored.

**Enforced by:** `verify-submission`, `verify-provider-boundaries`,
`verify-tool-result-shape`, banner assertions in the widget verifier.

**Current:** green. This north star is different in kind: it is already at 10
and the only move available is regression. Treat any red as a stop-ship.

---

## NS-5 · Conversational — the model drives the camera

**Ideal:** place questions become camera moves. The map is an answer format:
ChatGPT can focus, zoom, pin, and reason about what's on screen through
structured tool state — the user never *has* to touch the map for the
conversation to use it.

**You've hit it when:**
- All 7 Alpha tools drive end-to-end on the live server, every time, and every
  tool answer renders map-first *inside* the widget (0.46P promise).
- Tool results carry concise `structuredContent` the model actually uses to
  continue the conversation (full scene only in `_meta`).
- A cold user can go open → explore → scout → campaign preview without leaving
  the widget or hitting a dead end.
- Camera intents (e.g. `commerce_detail`, `residential_detail`) exist for the
  things people ask about, so the model's answer can *show* instead of tell.

**Enforced by:** `verify-mcp-flow`, `verify-alpha-product-loop`, G2/G4 gates.

**Current:** contract-level green; product loop shipped at 0.46P. The gap is
richness — more camera intents wired to more question shapes.

---

## NS-6 · Scale — one world model, every county

**Ideal:** the ladder county → state → country climbs without a quality cliff.
Adding a county is data, not code — and it opens at NS-1 quality inside NS-2
budgets on day one.

**You've hit it when:**
- Any supported California county opens at parity-gate quality with zero
  county-specific renderer code.
- The Graphics ceiling and rebuild gate hold at the *largest* supported
  county, not the average one.
- Curated Riverside is the reference implementation, not a special case — the
  generated path shares its compiler, grammar, and gates.

**Enforced by:** parity verifier on generated output, deterministic fabric and
diversity tests, the perf ceiling.

**Current:** proof cell + parity-gated generation. The ladder's next rung
(multi-county generated coverage) is product work, not engine work.

---

## NS-7 · Shipped — in the directory

**Ideal:** Atlas is listed in the ChatGPT app directory — G1–G7 green on the
deployed build, submission accepted, real users open it.

**You've hit it when:** G6 (icon, privacy/terms URLs, legal checklist) and G7
(Railway deploy + prod verifiers) join the five already-green gates on one
coherent committed build — and the listing is live.

**Current:** 5/7 gates green (G1–G5). The reds are operational, not
engineering. Salvageable G6 groundwork is parked at origin tag
`phantom-ship-prep-533582d` (privacy/terms routes, manifest icon/legal URLs).
**This is the north star the others exist for — engine quality no longer
blocks it.**

---

## Operating rules

1. **Every pass names its north stars.** A work packet that can't say which
   NS it moves is bureaucracy — don't run it.
2. **Gates are floors, north stars are ceilings.** A pass may never trade a
   green gate for north-star progress; NS-4 in particular is stop-ship on red.
3. **Facts vs taste:** verifiers decide facts; Fable/user decide taste ties.
   Honest scores only — a flattering self-rating poisons the next plan.
4. **Defend the greens.** NS-2 and NS-4 are won; passes touching them budget
   verification, not ambition.
