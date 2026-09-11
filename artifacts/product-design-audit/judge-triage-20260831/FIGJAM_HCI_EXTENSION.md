# FigJam extension packet: Human ↔ Agent Contract

Target board: https://www.figma.com/board/lZBAfZeDClD4PG5KRkCwxa

Target wrapper section: `3:2`

Purpose: add one judge-facing HCI row below the existing seven-state evidence. This is an evaluation rubric for the existing exact-five Atlas surface. It is not a proposal for another tool, panel, tutorial, or detached chatbot workspace.

## Placement

- Keep the current 6400px board width.
- Start the new content at approximately `y = 2500` inside the wrapper.
- Extend the wrapper to approximately 4100px high after reflow.
- Use one row of four phase sections with equal heights, then one full-width release-test strip.
- Preserve left-to-right reading: before, during, when wrong, after.
- Use Inter, Charcoal text, white cards, and restrained FigJam section tints.

## Entry point

Title: `HUMAN ↔ AGENT CONTRACT`

Subtitle: `The agent should feel like a visible collaborator on the map, not a hidden command runner.`

Scope line: `Exact five tools. One shared controller. Session-only notes and trails.`

## Phase 1: BEFORE

Heading: `1 · MAKE THE CAPABILITY CLEAR`

Primary copy:

`Say what the agent can do in map terms. Give one useful example before the judge has to guess.`

Atlas proof:

`Agent tools ready. Try: build a 3-stop civic trail.`

Failure signal:

`A judge must learn raw tool names or read documentation before trying the core action.`

## Phase 2: DURING

Heading: `2 · SHOW THE STATE CHANGE`

Primary copy:

`Name the object and action. Keep focus in place. Return write success only after the map visibly renders.`

Atlas proof:

`Searching Atlas → Building a 3-stop trail → Agent created a 3-stop trail.`

Failure signal:

`The map changes silently, status clips on mobile, or success appears before the route and markers.`

## Phase 3: WHEN WRONG

Heading: `3 · SCOPE, DO NOT GUESS`

Primary copy:

`Ambiguity returns choices and preserves the prior map. Failed trail resolution produces no partial mutation.`

Atlas proof:

`8 matches. Choose a state. Map unchanged.`

Failure signal:

`Atlas guesses, mutates first, or reports success for an unresolved stop.`

## Phase 4: AFTER

Heading: `4 · KEEP THE HUMAN IN CONTROL`

Primary copy:

`Agent output remains editable on the same canvas. The next state read reflects the person's latest change.`

Atlas proof:

`Click marker 2 → Miami-Dade becomes current → ChatGPT reads activeIndex 1.`

Failure signal:

`The person needs a reset or another tool to correct agent output.`

## Release-test strip

Heading: `THE SEVEN TESTS`

Use seven compact cells or one wrapped text block:

1. Capability is clear without raw tool names.
2. Pending, success, ambiguity, and failure are visible and programmatically announced.
3. Marker, breadcrumb, trail rail, and state read agree.
4. Ambiguity and unresolved stops leave the map unchanged.
5. Notes and trails remain editable by the person.
6. Agent origin, current stop, and session-only scope are legible.
7. Focus is visible, mobile targets are usable, map markers have rail equivalents, and reduced motion preserves the final state.

## Source strip

Title: `GROUNDED IN`

- Microsoft Research, Guidelines for Human-AI Interaction, CHI 2019.
- Nielsen Norman Group, 10 Usability Heuristics.
- W3C WCAG 2.2, Status Messages, Focus Visible, and Target Size Minimum.

## Do not add

- No sixth WebMCP tool.
- No onboarding modal.
- No ChatGPT branding inside Atlas.
- No debug dashboard.
- No new app panel for this rubric.
- No looping or decorative animation.

## Visual acceptance

- The title reads at board overview zoom.
- The four phases scan in under 20 seconds.
- Atlas proof is visually stronger than failure copy.
- No text clips or overlaps at the final wrapper size.
- The HCI row supports the existing screenshot story instead of competing with it.
