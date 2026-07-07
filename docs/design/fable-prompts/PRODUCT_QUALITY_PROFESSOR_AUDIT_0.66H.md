# Atlas Product Quality Professor Audit - 0.66H

Date: 2026-07-05. Owner: acting CTO. Status: Fable launch packet for a
neutral product-quality audit and next implementation plan.

## Why this prompt exists

The current Atlas preview is verifier-green but not product-green. A local
browser proof can prove that a modal is accessible, that an auth challenge
exists, and that the public tool surface is stable. It does not prove that the
app feels fast, complete, legible, or worth using on an iPhone.

The human grade is **D+** for current felt quality. Treat that grade seriously.
Do not defend the work because tests passed. Your job is to inspect the running
app like a professor grading a senior project and then translate the critique
into executable engineering slices.

## Current live surface

Repo: `C:/Users/mzwin/Documents/Atlas`

Preview URL:
`http://127.0.0.1:8787/preview`

Current artifact:
`artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-mobile-390x844.png`

Known bundle pressure from the latest inspection:

- `web/dist/component.js`: about 1.0 MB
- `web/dist/component.css`: about 80 KB
- `/preview` HTML payload: about 1.08 MB because the ChatGPT widget is inlined
- Pixi renderer uses pointer/wheel handlers, a post-grade filter, many draw
  paths, and heavy CSS chrome sits above the canvas

Use those as starting clues, not conclusions. Measure before assigning blame.

## Product law

Atlas is a ChatGPT App and voxel county-to-scene engine.

The surface is a full-screen map with small HUD overlays. Do **not** drift into
a dashboard, generic SaaS homepage, card grid, campaign manager, CRM, report
builder, or pricing page.

Do not hide visual weakness with labels, cars, people, random props, glows,
giant panels, or marketing copy. Fix the engine, composition, interaction, and
information hierarchy.

Riverside/Eastvale is the only public playable district. Anaheim/Ontario stay
hidden.

Public MCP tools stay stable:

- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

No new public MCP tools in this audit.

## Your role

Act as three people at once:

1. **Professor**: give a neutral grade with evidence, not encouragement.
2. **Senior product designer**: explain why the app feels unfinished to a
   human touching a phone.
3. **Performance engineer**: identify the likely lag sources and propose
   measurable fixes.

The output must teach the coding agent why the current implementation is not
there yet. Be blunt, but do not be theatrical.

## Required inspection

Do not rely on the screenshot alone.

Run and inspect:

1. Desktop browser at `1280x720`.
2. Mobile browser at `390x844`.
3. First load timing and interaction timing.
4. Visual hierarchy at rest.
5. Touch path: open save panel, close panel, select place, use tray action.
6. Pan/zoom or map gesture feel.
7. Reduced-motion behavior.
8. Console errors and warnings.
9. DOM/CSS pressure: repeated rules, expensive filters, blur/backdrop, shadows,
   oversized overlays.
10. Renderer pressure: draw count, app init timing, filter cost, pointermove
    work, scene redraw cadence.

Measure at least:

- initial HTML transfer size
- JS bundle size
- CSS size
- time to first visible map
- time to interactive controls
- frame timing during pan/zoom or pointer movement
- number of Pixi display objects or render commands if accessible
- JS heap snapshot estimate or memory readout if easy
- mobile screenshot with and without Hosted Clawd open

## Grade rubric

Use this rubric and give a score for each category.

| Category | Weight | What A-level means |
| --- | ---: | --- |
| First impression | 15 | A user immediately understands Atlas is a map-first ChatGPT app, not a prototype. |
| Visual engine quality | 20 | The voxel world has authored composition, readable massing, terrain coherence, and strong silhouettes without labels doing the work. |
| Mobile touch UX | 15 | Core actions fit the thumb path, controls are reachable, no modal fights the map, no accidental dead zones. |
| Performance feel | 20 | Loads quickly enough for a ChatGPT iframe, pans/zooms without obvious hitching, no heavy chrome blocks the world. |
| Product coherence | 15 | Scout, Campaign, save state, and map exploration feel like one flow instead of separate prototypes. |
| Technical readiness | 15 | The implementation has clear contracts, small enough bundles, stable state paths, tests, and no hidden brittle hacks. |

Then give:

- current letter grade
- current percentage complete
- one-sentence reason for the grade
- minimum acceptable grade for the next gate

## Expected honest findings to test

These are hypotheses. Confirm, reject, or refine them.

- The app may be verifier-green but still D+/C- because the proof only checks
  safety/accessibility minima, not product feel.
- The inline ChatGPT widget payload is probably too heavy for a polished first
  impression.
- The map has visual charm, but the world still reads like a small diorama
  rather than a scalable county engine.
- The Hosted Clawd save panel is simpler now, but it still consumes too much of
  the mobile screen and may feel like a modal pasted over the map rather than a
  native ChatGPT app state.
- The UI language has improved, but Scout/Campaign/Save may still feel like
  disconnected concepts.
- The renderer may be doing too much work on pointer movement, first paint, or
  post-processing for the quality it delivers.
- CSS may contain too many overlapping historical layers, expensive visual
  effects, and repeated Hosted Clawd rules.

## Output format

Write a single audit report:

### 1. Grade

Give a neutral grade table with scores and notes.

### 2. What is actually failing

Use concrete language. Explain the human experience:

- what feels slow
- what feels confusing
- what feels visually weak
- what feels overbuilt
- what feels missing for a real ChatGPT app

### 3. Why it is laggy or heavy

Separate proven causes from likely causes.

Use file references where possible:

- `web/src/CityWorldRenderer.tsx`
- `web/src/styles.css`
- `web/src/HostedClawdTray.tsx`
- `web/src/App.tsx`
- `scripts/build-web.mjs`
- `packages/core/src/voxel/*`

### 4. What percentage is real

Break the user's 60% instinct into:

- product concept completeness
- visual engine completeness
- ChatGPT app integration completeness
- mobile UX completeness
- monetized save-state/service completeness
- performance/readiness completeness

### 5. The next three implementation slices

Each slice must include:

- name
- player-facing promise
- engineering promise
- files likely touched
- anti-scope
- metric/verifier
- exact acceptance criteria

Prioritize fixes that move felt quality, not just docs.

### 6. Prompt for the coding agent

End with a concise execution prompt that Codex can run next. It should be
specific enough to implement without rediscovering the critique.

## Strong anti-scope

Do not propose:

- generic landing page
- dashboard shell
- new SaaS layout
- public pricing page
- more copy as the main fix
- random decorative props
- cars/humans as quality cover
- public Anaheim/Ontario
- new public MCP tools
- live Stripe keys
- evidence/XP/reports/exports
- provider-created geometry

## Minimum next gate

The next accepted slice should be `0.66H Mobile Interaction Hardening` unless
the audit proves an even more basic blocker.

Minimum gate for 0.66H:

- mobile first-load and interaction timing measured
- Hosted Clawd panel no longer dominates the map state
- place selection and save-state path work with thumb-first controls
- reduced-motion path verified
- no horizontal overflow or console errors
- at least one browser proof that measures felt performance, not only DOM
  accessibility
- build/typecheck still green

