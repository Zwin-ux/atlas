# Atlas HCI operating manual

This is the working interaction manual for the Atlas judge route. It installs a small, enforceable set of rules in the repository. It links to authoritative manuals instead of copying them.

## Standards boundary

There is no general HCI or accessibility standard named **ASD-100** in the authoritative sources reviewed for this slice. The closest relevant name is **ASD-STE100 Simplified Technical English**, a controlled language for technical documentation.

Atlas uses a small ASD-STE100-inspired plain-language profile. Atlas does not claim ASD-STE100 conformance, certification, or vocabulary compliance. Full conformance requires the official specification and a dedicated language review.

Interface accessibility is based on WCAG 2.2 and W3C Cognitive Accessibility guidance. Human-centred design process guidance comes from ISO 9241-210. These sources have different scopes and must not be presented as interchangeable certifications.

## The human-agent loop

1. A person or ChatGPT asks Atlas to find, open, note, or connect places.
2. Atlas resolves ambiguity before it changes the map.
3. The result appears on the same map the person can use.
4. Atlas reports completion only after the visible state is ready.
5. The person can open a marker, edit a note, edit a trail prompt, or remove an item.
6. ChatGPT reads the updated shared state on its next turn.

The map is the source of truth. Chat text must not become a detached second workspace.

## Human-agent contract

Atlas applies Microsoft Research's human-AI guidance as a four-phase contract. The contract describes what the person must be able to understand and control. It does not add another Site Tool.

### Before an action

- Say what the agent can do in concrete map terms: find a place, open a county, add a note, or build a trail.
- Give one useful example when the session is empty: **Agent tools ready. Try: build a 3-stop civic trail.**
- State the important limit at the point of use: notes and trails are session-only.
- Do not expose raw tool names as the primary explanation.

### During an action

- Show a short status that names the object and action: **Searching Atlas** or **Building a 3-stop trail**.
- Keep keyboard focus where the person left it. Announce important status changes through a programmatic status message instead of moving focus.
- Keep the map, breadcrumb, trail rail, and agent activity consistent during the transition.
- Return write success only after the visible state has rendered.

### When Atlas is uncertain or wrong

- Scope the action instead of guessing. An ambiguous place returns candidates and does not change the map.
- Say what happened, what stayed unchanged, and what the person can do next: **8 matches. Choose a state. Map unchanged.**
- Resolve every trail stop before the single commit. One unresolved stop leaves the previous map and trail intact.
- Keep correction efficient. A person can open another marker, edit note or trail text, remove an item, or dismiss the candidates.

### After an action

- Make the consequence visible and specific: **Agent created a 3-stop trail** or **Agent added a note to Riverside County**.
- Let the person edit the result in place. Agent output is a shared draft on the map, not a locked transcript artifact.
- Read the person's latest manual change on the next `get_map_state` call.
- Keep agent origin and session scope visible without turning the rail into a diagnostic dashboard.

## HCI release rubric

| Contract | Atlas proof | Release failure signal |
| --- | --- | --- |
| Capability is clear | The empty state gives one concrete trail example and the five human titles describe map outcomes. | A judge must read documentation or learn a raw tool name before trying the core action. |
| Status is visible | Pending, success, ambiguity, and failure name the affected map object. | The map changes silently, status is clipped, or success appears before rendering. |
| State is shared | Marker, breadcrumb, active trail row, and `get_map_state` agree. | Human and agent actions produce separate or stale selections. |
| Uncertainty is safe | Ambiguity returns candidates and states that the map is unchanged. | Atlas guesses, partially mutates, or reports success on an unresolved place. |
| Correction is efficient | Notes, title, prompts, stops, and active place remain manually editable. | The person needs a new tool or a reset to correct agent output. |
| Consequences are legible | Agent origin, stop count, active stop, and session-only scope are visible. | A person cannot tell what changed, whether it persisted, or which stop is current. |
| Operation is inclusive | Focus stays visible, mobile controls are at least 44px, map targets have rail equivalents, status is announced without focus theft, and reduced motion preserves the final state. | Keyboard order is unclear, a control is too small, focus disappears, status is only visual, or motion is required to understand the result. |

## Interaction laws

- Keep the map as the largest region on desktop and mobile.
- Use the same controller for human actions and Site Tools.
- Keep read actions and write actions distinct.
- Resolve every trail stop before one atomic write.
- Show ambiguity choices near the search control. Do not mutate first.
- State that notes and trails are session-only where they are edited.
- Use a text cue, shape, or position in addition to color for active state.
- Keep all primary targets at least 44 by 44 CSS pixels on mobile.
- Preserve keyboard order, focus visibility, names, roles, and values.
- Do not require the person to remember a hidden prior state.

## Plain-language profile

- Use one term for one action. Use **Open** for opening a place and **Remove** for removing an item.
- Put the action first. Write **Searching Atlas** instead of **Wait**.
- Use active voice. Write **Agent added a note** instead of **A note was added by the tool**.
- Keep one instruction or result in each sentence.
- Prefer common words. Keep raw tool names in diagnostics, not in the primary status line.
- Name the object that changed: map, place, note, trail, or stop.
- Say what the person can do next when recovery is required.
- Do not use a success message until the map has visibly completed the action.

## Cognitive-accessibility profile

- Keep purpose and current location visible.
- Keep controls close to the content they affect.
- Present no more than one active trail editor on a narrow screen. Keep the other stops visible with their place and prompt context.
- Use familiar buttons, text labels, and native form controls.
- Make errors specific and recoverable. Preserve the prior map on ambiguity or failure.
- Avoid distracting motion, automatic cycling, time limits, or content that moves without user intent.
- Repeat important scope at the point of action, including **session only**.

## Motion vocabulary and limits

Atlas motion explains a state change. It is not ambient decoration.

- **Continuity transition:** draw the completed trail route once, in 440 milliseconds.
- **Stagger:** introduce numbered stops in route order, 70 milliseconds apart.
- **State feedback:** give buttons a one-pixel press response.
- **Result transition:** introduce ambiguity candidates with a short ease-out.
- **Active state:** show the new current-stop ring once.
- **Reduced motion:** `prefers-reduced-motion: reduce` removes every non-essential animation and keeps the final state visible.

Do not add pulsing markers, floating panels, looping routes, parallax, confetti, or animation that delays tool success.

## Release review checklist

- [ ] The main flow works without WebMCP.
- [ ] Exactly five Site Tools register on the top-level page.
- [ ] Visible activity uses plain language; raw tool names are secondary diagnostics.
- [ ] Springfield returns candidates and leaves the map unchanged.
- [ ] A failed trail leaves the prior map and trail unchanged.
- [ ] The mobile map remains larger than the research editor.
- [ ] Only the current mobile trail stop exposes its editor and removal action.
- [ ] Every hidden mobile editor becomes available when its stop is opened.
- [ ] Keyboard focus remains visible and unobscured.
- [ ] Target sizes and contrast meet the project checks.
- [ ] Motion is brief, purposeful, and absent under reduced motion.
- [ ] Copy review makes no unsupported standards or conformance claim.
- [ ] The first useful agent action is understandable without exposing raw tool names.
- [ ] Pending, success, ambiguity, and failure messages are programmatically available without moving focus.
- [ ] Dense map markers have an equivalent control in the research rail.
- [ ] Agent-created content remains visibly editable by the person.

## Authoritative references

- [Microsoft Research Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction-design/)
- [Microsoft Research CHI 2019 publication](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/)
- [Nielsen Norman Group: 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [W3C Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C Understanding Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [W3C Understanding Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [W3C Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [W3C Cognitive Accessibility: Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/)
- [W3C Cognitive Accessibility overview](https://www.w3.org/WAI/cognitive/)
- [ISO 9241-210:2019 overview](https://www.iso.org/standard/77520.html)
- [ASD-STE100 official overview](https://www.asd-ste100.org/about_STE.html)
- [ASD-STE100 official downloads](https://www.asd-ste100.org/STE_downloads.html)
