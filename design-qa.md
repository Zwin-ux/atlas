# Atlas WebMCP human-agent handoff — design QA

## Comparison target

- Source visual truth: `artifacts/product-design-audit/implementation-20260831/02-current-springfield-ambiguity-desktop.png`
- Browser-rendered implementation: `artifacts/product-design-audit/implementation-20260831/08-implemented-human-ambiguity-desktop.png`
- Additional WebMCP implementation states:
  - `artifacts/product-design-audit/implementation-20260831/04-implemented-ambiguity-safe-desktop.png`
  - `artifacts/product-design-audit/implementation-20260831/05-implemented-trail-shared-state-desktop.png`
  - `artifacts/product-design-audit/implementation-20260831/06-implemented-mobile-390x844.png`
  - `artifacts/product-design-audit/implementation-20260831/07-implemented-ready-mobile-390x844.png`
- Route: `/explore`
- Theme and state: light Atlas map; normal-browser Springfield ambiguity for the matched comparison; WebMCP ready, ambiguity, trail, note, and shared-state transitions for additional acceptance.

## Capture normalization

- Matched source pixels: 1280 × 720.
- Matched implementation pixels: 1280 × 720.
- CSS viewport: 1280 × 720; default density; no scaling or density normalization required.
- Mobile CSS viewport: 390 × 844. Browser capture pixels are 390 × 843 because the host reserves one pixel at the viewport boundary; no horizontal overflow was present.
- Full-view comparison evidence: the source and implementation ambiguity captures were opened together in one comparison pass at their original resolution.
- Focused-region evidence: a separate crop was not needed. The only matched-state change is the two-line finder feedback at the top right, which is legible at original resolution; browser DOM evidence also confirmed the exact post-change text: `8 matches in Atlas. Choose a state or county. Map unchanged.`

## Required fidelity surfaces

- Fonts and typography: Atlas's existing serif map labels and monospaced interface hierarchy are unchanged. The new ready cue and mutation-safety copy reuse the current activity and finder styles, preserve line height and weight, and do not introduce truncation on desktop or mobile.
- Spacing and layout rhythm: the map remains the dominant canvas. The matched before/after ambiguity state keeps the same finder geometry, two-line feedback height, map crop, margins, radii, and control placement. No new panel or competing card was added.
- Colors and visual tokens: all new text uses existing Atlas foreground, quiet, success, and activity tokens. No gradient, glow, or new decorative color was introduced. Active trail stops retain a ring, index, `CURRENT` text, and semantic current-step state.
- Image quality and asset fidelity: the existing Census-derived vector county plate remains sharp at desktop and mobile sizes. No map asset, icon, logo, or image was replaced with placeholder or handcrafted decorative art.
- Copy and content: the ready state suggests one outcome instead of exposing a raw tool name. Ambiguous opens and failed trails now say that the map/trail stayed unchanged. Activity copy consistently uses `Agent` for the person-facing actor while raw tool diagnostics remain in the title attribute.
- Responsiveness: at 390 × 844 the map remains usable above the editable research rail, the activity line prioritizes the agent outcome, and measured horizontal overflow is false. Visible Open, zoom, fit, trail, and remove controls meet the 44 px target floor.
- Accessibility and interaction: the finder, map controls, breadcrumb, trail rail, trail markers, title/prompt fields, and note field were exercised. Marker and rail actions update `aria-current`; trail markers have accessible stop names and keyboard activation. Existing reduced-motion and focus-visible rules remain in place.

## Findings

- No actionable P0/P1/P2 visual or interaction findings remain.
- [P3] A WebMCP-capable client uses `Site tools on` on desktop and the shorter `Agent tools on` on mobile, while a normal browser says `Site tools not detected`. This is intentional client-context copy, not visual drift.
- [P3] Chrome logs one expected warning when its experimental `tools` Permissions-Policy feature is unavailable. The normal-browser map, search, candidate selection, zoom, and fit controls remain functional; no application console errors were observed.

## Interaction evidence

- Refresh registered exactly `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail` once.
- `open_place({ place: "Springfield" })` returned eight candidates with `mapChanged: false`; revision and visible revision stayed at zero.
- `create_map_trail` returned only after the three numbered markers, connecting route, and editable trail rail were visible on the national map.
- A human rail click opened Miami-Dade County; a human map-marker click opened Travis County; the next `get_map_state` read the corresponding active stop and county.
- Human edits to the trail title, Miami-Dade prompt, and Travis note were visible in the next WebMCP state read.
- Normal-browser candidate selection opened Greene County, and zoom in, zoom out, and fit changed/restored the SVG view box.

## Comparison history

1. Initial audit found no useful agent-action cue in the WebMCP-ready state. The existing activity line now suggests `Build a 3-stop civic trail` without adding a panel; post-fix mobile evidence is `07-implemented-ready-mobile-390x844.png`.
2. Initial audit found that ambiguity and failed-write activity did not explicitly reassure the person that no partial mutation occurred. Finder and tool activity copy now say `Map unchanged` or `Trail and map unchanged`; post-fix matched evidence is `08-implemented-human-ambiguity-desktop.png`, with WebMCP evidence in `04-implemented-ambiguity-safe-desktop.png`.
3. Initial mobile audit found that low-value status text could crowd the agent outcome. Once activity exists, mobile now hides the redundant status segment and preserves the complete agent summary; post-fix evidence is `06-implemented-mobile-390x844.png`.
4. The post-fix comparison found no new P0/P1/P2 issue, so no additional visual iteration was required.

## Implementation checklist

- [x] Preserve the exact-five public tool surface.
- [x] Keep the map as the primary visual surface.
- [x] Teach one useful ChatGPT action in the ready state.
- [x] Make ambiguity and atomic failure legible without raw tool names.
- [x] Prove human marker, rail, field, note, finder, zoom, and fit controls.
- [x] Prove shared human/agent state in the live WebMCP-capable browser.
- [x] Pass desktop, 390 × 844 mobile, normal-browser fallback, and console checks.

final result: passed
