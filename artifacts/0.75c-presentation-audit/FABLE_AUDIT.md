# 0.75C-4 — NS-3 ChatGPT-Native Presentation Audit (Fable)

Date: 2026-07-07 · Evidence: `artifacts/0.75c-material-texture/screens/`
(desktop light/dark, mobile light/dark, detail cameras). Bar: NORTH_STARS.md
NS-3 — the crop test, light/dark parity-not-port, quiet directive copy, map is
the only saturated thing.

## Verdict

Chrome fundamentals are strong (hairline cards, quiet grays, honest landmark
panel). Six findings block the first-party read, most of them small. Overall
NS-3 today: **6.5/10**. All findings are CSS/copy — zero engine risk.

## Findings (severity order)

### F1 · Dark mode veils the map — the one thing that must stay alive
`styles.css:139-147` applies `filter: brightness(0.82) saturate(0.9)` to the
whole renderer in dark mode. The chrome correctly goes dark, but the map —
the content, the only saturated thing on screen by doctrine — gets dimmed and
desaturated like a web page behind a modal. First-party dark mode darkens the
frame and lets the content glow.
**Fix:** soften to `brightness(0.94) saturate(1)` (map stays vivid, slight
trim so it doesn't glare against dark chrome). Screenshot both themes after.

### F2 · "Turn to a new district" card breaks dark parity
In dark mode (desktop AND mobile) every card restyles except this one — it
stays a white card with black text. Parity, not port.
**Fix:** dark-mode styles matching the other cards.

### F3 · Copy leaks internal vocabulary
- "Play Riverside now. Browse CA shells. Lookup without saving." — "shells"
  and "Lookup" are internal words; staccato triple-imperative.
- "LOOKUP not saved" — ALL-CAPS internal field style shown to users.
- "Turn to a new district" — "turn to" is not how a person says it.
**Fix (exact strings, Fable-authored):**
- Coverage explainer → `Riverside is fully explorable. Other counties preview as outlines. Nothing saves between chats.`
- Remove the `LOOKUP not saved` chip (covered by the sentence above).
- District button → label `Generate a district`, subline stays
  `synthetic · session-only` (keeps the honesty words verifiers assert).
**Guardrail:** never weaken an NS-4 honesty string. If a widget verifier
asserts one of these strings, update the assertion to the new copy ONLY where
it is button/explainer copy — the generated-scene honesty banner itself is
untouched.

### F4 · Mobile: chrome dominates, map-first violated
At 390×844 the coverage card owns the top third and the landmark panel the
bottom third; the town peeks through a letterbox.
**Fix:** coverage card collapses to a single-line chip by default on narrow
viewports (tap to expand). Landmark panel unchanged.

### F5 · Two button grammars: circles vs rounded squares
Bottom toolbar is circular FABs (reads Google-Maps); the zoom stack top-right
is rounded squares. One surface, one grammar.
**Fix:** unify bottom toolbar to the zoom stack's rounded-square treatment
(same radius/size/border), same icons.

### F6 · "76% active" — unexplained metric
A green dot + percentage with no referent is dashboard noise.
**Fix:** if it maps to real curated data, label it plainly (e.g. tooltip /
`76% of places active`); if not, remove it.

## Not findings (deliberate, keep)
- Black inverted "Riverside / Playable" chip — Instrument doctrine accent.
- Beige map labels (Eastvale Core, Gym) — they belong to the map layer.
- Landmark panel copy ("Pins and notes stay in this chat.") — model honesty copy.
