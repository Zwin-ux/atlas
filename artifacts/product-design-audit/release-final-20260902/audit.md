# Atlas release-final combined product-design audit

## Audit scope

- Run date: September 2, 2026 Pacific / September 3 UTC.
- Source branch and head: `webmcp-challenge` at `bd1102352cdd5986fb25a1b7af5c89a8cf4342f7`.
- Runtime source boundary: no `web/`, `server/`, or tool-contract file differs from the last green product content commit `52b42b1899209de0cc38e11ea27e913d974d0129`; later commits are challenge planning, evidence, and release documentation.
- Live judge route: `https://atlas-webmcp-production.up.railway.app/explore`.
- Live sanitized candidate: `39d1e1413e72ea050845ffbaa6323fffeb8c28f1`.
- Surfaces inspected: quiet national entry, Springfield ambiguity, dark theme, keyboard focus, exact `390x844` ambiguity recovery, WebMCP-created three-stop trail with visible note, and the human-selected Miami-Dade stop at exact `390x844`.
- Audit mode: combined UX and accessibility audit. Screenshots were captured in this run and opened at original size before disposition.

## User goal and accessibility target

A person should be able to open Atlas, understand that the map is the workspace, ask ChatGPT to find or connect U.S. places, and continue by clicking, editing, zooming, or writing on the same visible state. The target is a keyboard- and touch-usable judge path with clear non-destructive recovery, no horizontal overflow at `390x844`, a visible focus state, and motion that disappears under reduced-motion preference.

## Strengths

- The national plate owns almost the entire first viewport. The finder and three map controls are subordinate to the geography instead of becoming a dashboard.
- The paper, ink, water, and green route palette reads as a field atlas in light mode. Dark mode preserves land/water figure-ground and label contrast without a generic glowing AI aesthetic.
- Springfield returns eight state/county choices and says `Map unchanged.` before the list. This makes ambiguity recovery explicit and protects trust.
- The WebMCP trail is the single focal event: one line, three numbered markers, one `Current` cue, and a matching editable notebook rail. No labels or decorative panels compete with it.
- The desktop trail screenshot includes the visible agent outcome, full route, three markers, editable prompts, and a place-bound session note in one frame.
- The mobile shared-control screenshot shows the result of a human opening stop 2: the map is Miami-Dade, the breadcrumb agrees, the rail marks stop 2 `Current`, and the agent activity remains concise.
- The normal-browser entry remains fully usable and honestly reports that Site Tools were not detected.

## UX risks

- P0: none observed.
- P1: none observed.
- P2: none observed.
- The Springfield results temporarily cover part of the northeast on desktop and move above the plate on mobile. This is intentional task focus, not a persistent obstruction: the map remains visible, the copy names the unchanged state, and every candidate is a direct recovery action.

## Accessibility risks

- P0: none observed.
- P1: none observed.
- P2: none observed in the tested path.
- The accessibility snapshot exposed one page heading, a named United States map, a named scale bar, and named zoom controls.
- At `390x844`, `scrollWidth` and `clientWidth` were both `390`. Every visible button in the ambiguity state measured at least `44x44` CSS pixels; result rows were `349x44`.
- Keyboard Tab placed focus in the finder and produced a clearly visible green group outline in dark mode. The Chrome harness separately used keyboard Enter on trail stop 2 and verified the shared state moved to Miami-Dade with `activeIndex: 1`.
- Reduced-motion emulation produced computed `animation-name: none` for the trail route, markers, pins, active ring, and activity event.

## Opportunity areas

- Keep the national trail overview as the video opening frame. It explains the product faster than a separate tutorial can.
- Use the human stop selection plus the next agent state read as the core proof. It is the clearest difference between Atlas and a chatbot that merely returns a map image.
- Preserve the quiet entry. Adding another prompt, badge, card, or animation would weaken the map-first hierarchy.

## Evidence limits and verification gaps

- The normal-browser captures cannot prove ChatGPT Site Tools discovery. Chrome `152.0.7977.66` supplied the current page-native WebMCP execution evidence; a captured real ChatGPT conversation remains a separate checklist gate.
- Screenshot inspection can identify visible contrast risk but is not a full WCAG contrast certification. No screen-reader session or 200% zoom pass was performed in this audit.
- The normal browser emitted the expected warning that the experimental `tools` origin-trial feature was not enabled. There were no application console errors, and the separate WebMCP-capable Chrome run registered exactly five tools.
- The xAI credential was absent, so the three-run `xai:grok-4.6` trajectory threshold remains unexecuted and must not be claimed.

## Recommendations

1. Select no product mutation for checklist item 3. There is no current P1/P2 defect worth risking the exact-five runtime or the calm map hierarchy.
2. Promote this current-run trail, human-handoff, ambiguity, dark, focus, reduced-motion, and mobile evidence into the release proof manifest.
3. Continue to the real ChatGPT transcript, fresh sanitized clean clone, narrated video, and owner-gated publication packet. Keep those evidence lanes distinct.

## Evidence index

- `01-entry-desktop.png`: live quiet national entry, `1440x1000`.
- `02-springfield-ambiguity-desktop.png`: live eight-candidate unchanged-state recovery, `1440x1000`.
- `03-springfield-ambiguity-mobile-390x844.png`: live mobile recovery with zero horizontal overflow and 44px controls.
- `04-entry-desktop-dark.png`: live dark field-atlas palette, `1440x1000`.
- `05-keyboard-focus-desktop-dark.png`: visible finder focus treatment in dark mode.
- `06-webmcp-trail-shared-state-desktop.png`: local committed-source Chrome trail, note, and activity proof, `1280x720`.
- `07-webmcp-human-stop-mobile-390x844.png`: local committed-source human marker/rail handoff, `390x844`.
- `browser-smoke.json`: exact-five tool transcript, mutation-safety checks, zero console errors, visible-completion state, and reduced-motion computation from Chrome `152.0.7977.66`.
