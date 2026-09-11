# Atlas design system

Atlas is a playable maproom: a conversational United States atlas that a
person and an agent can operate together. The map is the answer. Interface
chrome explains state and offers control, but never becomes the product.

This document owns the durable visual and interaction direction. Product
priority remains in `docs/brain/PROJECT_PLAN.md`; executable behavior remains
in code and verifiers.

## Design principles

1. **Map first.** The map occupies the screen, not a card inside a dashboard.
2. **Every action is visible.** Agent and human actions resolve into the same
   camera, selection, and focus state.
3. **One signal at a time.** Use one clear accent for the current target; do
   not decorate every landmark.
4. **Human control persists.** After an agent acts, touch, pointer, keyboard,
   and screen-reader navigation still work.
5. **Truth beats delight.** Ambiguity and refusal are designed states. Atlas
   never hides uncertainty behind confident animation.
6. **Print character, digital precision.** The visual voice can feel like a
   well-used field atlas, while geometry, hit areas, type, and motion remain
   exact.

## Visual identity

The primary direction is **analog field atlas with arcade responsiveness**.
Warm paper, deep ink, water blue, sand land, and the brand's roof orange create
the maproom character. Hairlines, sparse survey marks, compact labels, and one
responsive focus signal provide the digital layer.

Use texture as material, not decoration: a barely visible paper grain on the
canvas and no noise over labels or geometry. Corners are square or lightly
eased at 4–8px. Avoid glossy cards, glass panels, gradients, glows, map pins,
floating badges, and generic icon libraries. Controls should resemble precise
survey instruments, not app-store stickers.

The existing isometric county-house mark remains the brand silhouette. Do not
turn it into a mascot or replace it with a globe, pin, or letterform.

## Inline answer vs fullscreen maproom

This is the AT-006 product decision. It does not add a second app.

**Inline** is the ChatGPT message result. It must be useful without expansion:
legible plate, requested-place identity and type, a discreet source/vintage
affordance, and one primary “Explore map” action when the host can enlarge.
No second chat composer, onboarding wall, analytics dashboard, or landing
page. Named follow-up (“Ask about [place]”) appears only when a real
selection exists and the host can hand the question back.

**Fullscreen** deepens the same map: pan, zoom, fit, selection, parent, back.
The host composer is part of the layout and must not be covered. Phone
layouts keep one compact inspector or candidate sheet at a time. If the host
does not advertise a larger mode, inline stays the complete human map.

Entering or exiting fullscreen must not refetch a place solely because the
component remounted. Restoration is per widget instance, never a saved
account. Comparison views, extra geodata providers, and the frozen WebMCP
challenge remain out of this surface.

## Host-native chrome, cartographic plate

Keep analog-field-atlas character on the **map**: land, water, hairlines,
labels, one orange focus. Align **chrome** (buttons, status, candidate list,
titles around the plate) with current ChatGPT Apps / widget guidance: system
sizing, 44px targets, IBM Plex Sans for interface. Do not set every control
in display serif or a custom all-height face. Cartographic labels may keep
Georgia metrics until Newsreader passes the existing collision tests.

If host guidance and this atlas character conflict, keep the plate; restyle
the furniture. Do not flatten the map into a generic SaaS card.

## Color

Brand colors remain sourced from `assets/brand/BRAND.md`. Product tokens extend
them without changing the mark. The brand's terrain green remains inside the
county-house mark; it is not a second map-land or selection color. This keeps
the plate's sand/blue hierarchy and the single orange focus signal legible.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Canvas | `#F3EBD8` | `#14212A` | Page and quiet water context |
| Land | `#DCC88F` | `#303B35` | Primary geography |
| Context land | `#D9DDD5` | `#26322F` | Geography outside the active place |
| Water | `#9FC4D7` | `#234054` | Rivers, lakes, and ocean |
| Water edge | `#6D9DB7` | `#557B92` | Water definition |
| Ink | `#26332C` | `#E8E0CE` | Labels and boundaries |
| Secondary ink | `#625A49` | `#B8B09F` | Supporting labels |
| Hairline | `#8B8069` | `#788174` | Rules and quiet controls |
| Chrome | `rgba(248,243,230,.94)` | `rgba(20,33,42,.94)` | Minimal map furniture |
| Signal | `#D8743F` | `#F07A4C` | Current agent or human focus |
| Signal wash | `#F1D7A6` | `#5A3028` | Brief focus pulse and selection fill |

When a feature is focused, signal orange appears exactly once and is attached
to that feature. Ready, loading, ambiguity, and refusal states may show no focus
signal. Orange inside the fixed brand mark does not count as an interaction
signal. Error and refusal states use language and icons before introducing
another saturated color. Color never carries meaning alone.

## Typography

- **Display and mark:** self-hosted Newsreader, used sparingly for the Atlas
  name and large place titles.
- **Cartographic labels:** retain Georgia metrics until Newsreader passes
  collision, truncation, and small-size legibility tests across the national,
  state, and county plates.
- **Interface:** self-hosted IBM Plex Sans.
- **Scale, coordinates, and development diagnostics:** self-hosted IBM Plex
  Mono.

Ship WOFF2 assets with the widget; no runtime font host. Place hierarchy comes
from scale and weight, not all-caps labels. Small map text never drops below
the tested readable size merely to fit more names.

## Layout and spacing

Use a 4px spacing base. Interactive targets are at least 44px in both axes.
Desktop furniture sits 16px from the viewport edge. Phone furniture sits 8px
plus the relevant safe-area inset.

The product surface fills `100dvh`. The map should visually occupy at least
90% of a desktop view and 88% of a phone view. Header, breadcrumb, scale,
legend, and status belong to one furniture system around the map, not separate
panels. On narrow screens, breadcrumbs collapse to a short place path; do not
add a hamburger unless it reveals real navigation.

No fixed-height desktop canvas may leave a white tail on mobile. Controls must
move around protected label and landmark zones, rather than covering them.

### Phone furniture states

- **Ready:** one compact place path at the top; scale at lower left; fit and
  zoom as one 44px-target group at lower right.
- **Loading:** a one-line progress strip attaches below the place path while
  the prior plate stays visible.
- **Ambiguous:** a bottom candidate sheet uses no more than 44dvh; the map
  remains visible and the list scrolls independently.
- **Focused:** one feature label attaches to the real reticle. Furniture moves
  if it would cover either the reticle or label.
- **Reduced viewport or software keyboard:** use the visual viewport and safe
  areas; shorten copy and scroll the candidate sheet rather than shrinking the
  map into a fixed-height box.

## Interaction states

- **Ready:** stable plate, short place path, scale, and no unnecessary status.
- **Resolving or loading:** preserve the prior plate and show a small inline
  progress state. Never replace the map with an empty screen.
- **Focused:** attach one reticle or outline to the real selected feature,
  announce it, then settle to a persistent low-key selection.
- **Ambiguous:** keep the map stable and present a short, keyboard-accessible
  candidate choice near the initiating control.
- **Unsupported or refused:** explain the boundary in one sentence and leave
  the current map usable.
- **Retryable error:** keep context, explain what failed, and offer one retry.
- **Unsupported host:** Atlas remains a complete human-operated map. Agent
  affordances simply stay unavailable.

Human movement changes the same observable view state used by agent actions.
No second, hidden agent-only map exists.

## Motion

Use three timings: 90ms for press response, 180ms for small interface changes,
and 280–360ms for camera or focus transitions. One focus pulse is enough. Do
not draw decorative travel trails when Atlas has no route data. Respect
`prefers-reduced-motion` by replacing camera tweening and pulses with immediate
state changes.

## Accessibility

Map features that can be focused by an agent are also reachable through a
roving keyboard focus model and exposed as named controls in the SVG or its
synchronized semantic feature rail. Arrow keys move between visible features;
Enter selects or drills; Escape returns to the map region; `+`, `-`, and Home
zoom in, zoom out, and fit. Pointer hit areas and keyboard targets are at least
44px even when the drawn town mark is smaller.

After an async plate change, focus moves to the newly named map region only
when the person initiated the open action; agent-initiated changes announce
without stealing keyboard focus. Ambiguous candidates are ordinary buttons in
a labelled list. The first receives focus for a human-initiated search, Escape
closes the list, and focus returns to the initiating control. Announce
resolution, ambiguity, focus, cancellation, and errors through a restrained
live region. The accessible view includes the current geographic level, place,
selected feature, and visible-feature count. Raw host globals, URLs, stack
traces, and development diagnostics are never part of the production
interface.

## Concept art

- [Survey Relay desktop — recommended light direction](docs/designs/concept-art/playable-maproom-survey-relay-desktop-v2.png)
- [Midnight Signal desktop — dark-mode study](docs/designs/concept-art/playable-maproom-midnight-signal-desktop-v1.png)
- [Survey Plate mobile — four-state storyboard](docs/designs/concept-art/playable-maproom-mobile-state-board-v2.png)
- [Earlier desktop exploration](docs/designs/concept-art/playable-maproom-desktop-v1.png)
- [Earlier phone exploration](docs/designs/concept-art/playable-maproom-mobile-v1.png)

These images set composition, restraint, material, and focus behavior. They
are not geographic source data. The dotted trace in the desktop image is mood
only and must not ship without actual route data. The phone menu glyph is not
approved navigation. Production labels, borders, reticles, and geometry come
from Atlas data and interaction state.

Both PNGs were generated for this project with OpenAI image generation on
2026-08-26. They are directional-only review artifacts, not production assets.
No raster fragment should ship in the widget; implement the approved character
with Atlas geometry, type, CSS, and hand-authored interface shapes.

Repository classification: public design documentation only. They may remain
under `docs/designs/concept-art/`, must be labelled directional in the public
README or design link that exposes them, and must never be imported by the web
bundle or counted as a runtime dependency.

The recommended synthesis is Survey Relay for the production light surface,
the mobile storyboard for state behavior, and Midnight Signal only as a later
dark-mode contrast study. Do not average their palettes into one muddy theme.

## Visual QA checklist

- The map is the dominant silhouette at desktop and 390x844 phone size.
- A focused view has exactly one orange signal attached to the selected
  feature; an unfocused view has none outside the fixed brand mark.
- Labels remain readable and do not collide with controls or the view edge.
- Loading, ambiguity, and error states preserve the last good plate.
- The phone view has no white tail under the map, including a reduced visual
  viewport.
- All agent-focusable features have a visible pointer target and a named
  keyboard path.
- Removing labels still leaves a coherent geographic composition; adding
  labels does not become a text wall.

## Anti-patterns

- A landing-page hero, feature grid, analytics dashboard, or chat transcript
  wall around the map.
- A blank replacement screen while data loads.
- Always-visible debug panels or protocol-inspector styling.
- Multiple simultaneous pulses, colored outlines, or competing focal points.
- Tiny pointer-only town targets, inaccessible SVG labels, or controls that
  cover the geography.
- Gamification pasted on as points, badges, streaks, or trivia chrome.
- Visualized comparison, routing, or certainty that the underlying data does
  not support.

## Decision log

- **2026-08-26:** Adopt the playable maproom as the product and visual thesis.
- **2026-08-26:** Keep the existing county-house mark and use its roof orange
  as the single focus signal.
- **2026-08-26:** Treat generated concept art as directional reference, never
  as geographic truth.
- **2026-09-10:** AT-006 — inline ChatGPT result vs same-map fullscreen;
  host-native chrome; cartographic plate wins on conflict. Comparison, extra
  geodata, and the WebMCP challenge stay deferred.
