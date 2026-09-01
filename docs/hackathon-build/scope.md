# Project Scope

## Project Name

- Atlas

## One-Line Summary

Atlas lets people and ChatGPT investigate U.S. counties together on one shared, visible map.

## Target User

Regular people who are curious about a place in the United States and want to explore it conversationally without leaving the map behind. Students, travelers, local journalists, civic researchers, and community organizers are useful examples, but Atlas is not restricted to specialist research.

## Problem

ChatGPT can discuss places, but the geographic experience is often detached, shallow, or visually passive. A person may receive prose, a generic embed, or a link, then lose the connection between the conversation, the place, and their own observations.

Atlas closes that gap. When the person expresses geographic intent, ChatGPT can find and visibly open the location on a real U.S. atlas. The person and agent then share the same live map, notes, and ordered trail instead of maintaining separate conversational and visual states.

## Core Workflow

1. A person asks ChatGPT to show, explore, compare, or remember a U.S. place.
2. ChatGPT searches Atlas, preserving ambiguity instead of guessing.
3. Atlas visibly opens the chosen county or shows an ordered national trail.
4. The person pans, zooms, opens a county, or selects a trail stop directly on the map.
5. Either side can add or edit a place-bound session note; either side can read the same current state.
6. Failed or ambiguous requests leave the map unchanged and give ChatGPT a clear recovery path.

## What We Are Building

- A top-level, no-login U.S. field atlas designed to work inside ChatGPT's in-app browser and in a normal browser.
- Exactly five browser-native WebMCP tools: `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail`.
- Intent-based conversational geography: explicit requests to show, explore, compare, or note a place can produce a visible map action.
- One shared controller and state path for human and agent actions, with writes resolving only after the matching visual change renders.
- A session notebook: place-bound notes and editable research/travel trails that remain visible beside the map.
- A high-quality field-atlas visual system: warm paper, precise ink, restrained green, selective handwritten cartographic character, legible controls, and map-first composition.
- Tactile, accessible feedback for opening, zooming, trail drawing, and note creation, including reduced-motion behavior.
- One bounded Higgsfield visual-development study for an authored texture, graphic, or motion reference. It must have a declared cost, reference input, intended use, and visual acceptance bar before generation. It cannot supply geographic truth or replace working interaction.
- Release evidence centered on the real top-level ChatGPT/WebMCP route: exact-five discovery, visible shared mutations, ambiguity recovery, normal-browser fallback, desktop/mobile presentation, and a concise demo video.
- A functional, visually coherent legacy iframe preview only as a secondary compatibility surface after the primary release gates are green; no full rewrite.

## What We Are Not Building

- Street-by-street routing, live traffic, navigation instructions, or a Google Maps/Waze data clone. Atlas provides conversational place opening and ordered research/travel trails.
- A sixth WebMCP tool or a parallel remote MCP mutation path.
- Accounts, authentication, persistence, public posting, payments, or cross-session notebooks.
- Voxel, CityWorld, generated-street, Hosted Clawd, Scout, Commons, billing, or historical branch integration.
- A full iframe/widget architecture rewrite before the top-level ChatGPT route, tests, video, and submission are complete.
- A dark AI dashboard, generic SaaS shell, glowing card grid, or decorative panel system that competes with the map.
- Unbounded asset generation, decorative animation, or Higgsfield experiments without a direct judge-facing purpose.

## Inspiration And References

- Google Maps and Waze: immediate spatial response and unmistakable route legibility, without copying their navigation scope or visual language.
- Wanderlog: places, stops, and notes remain connected to a journey.
- National Geographic and printed field atlases: warm materiality, authored hierarchy, geographic confidence, and a feeling of discovery.
- Travel notebooks: observations feel personal and place-bound rather than like generic application records.

## Visual And Interaction Direction

- The map is the dominant surface on desktop and mobile.
- Warm paper and ink carry the base; green communicates the active shared route and current place.
- Handwritten character appears selectively in cartographic or notebook accents, never where it weakens control or body-text legibility.
- Opening a county, drawing a trail, zooming, and adding a note each receive restrained physical feedback from the same motion vocabulary.
- Motion explains continuity and completion; it does not delay work or become a demo reel detached from the product.

## Demo Path

1. Open on the national Atlas and ask ChatGPT for a three-place U.S. exploration trail.
2. Show the numbered route render before the tool reports success.
3. Select a marker manually, then ask ChatGPT to read the same current place.
4. Search for Springfield, show ambiguity without mutation, and resolve one candidate deliberately.
5. Add a place-bound note through ChatGPT, edit it manually, and read the updated shared state.
6. Close with exact-five tool discovery, atomic failure behavior, and normal-browser fallback.

The first fifteen seconds must establish the product without explanation: a high-quality U.S. map, a visible multi-stop route, and clear evidence that ChatGPT caused the same interface the person can manipulate.

## Submission Story

Atlas is not a chatbot next to a map. It is a shared geographic object. WebMCP gives ChatGPT a narrow, typed way to find places, open them, annotate them, and build trails while every action remains visible and editable to the person.

- **WebMCP leverage:** exactly five tools convert conversational geographic intent into bounded, visible map actions.
- **Execution:** one controller, atomic writes, ambiguity-safe recovery, visible completion, accessible interaction, and normal-browser fallback.
- **Potential impact:** regular people can explore unfamiliar U.S. places with ChatGPT without losing spatial context or their own notes.
- **Creativity and ambition:** a field atlas and travel notebook become a shared human-agent canvas rather than another detached assistant response.

## Time Budget And Execution Order

The participant has three days and identifies distraction as a delivery risk. Work proceeds in three completion blocks with no parallel product tracks:

1. **Visual block:** one highest-value field-atlas interaction/polish slice, plus at most one bounded Higgsfield study if it can materially improve the live result or submission framing.
2. **Proof block:** real ChatGPT/WebMCP journey, desktop/mobile and fallback verification, final screenshots, and narrated video capture.
3. **Release block:** sanitized public-repository gate, video publication, Devpost copy/material audit, final URL checks, and explicit owner-approved submission.

## Definition Of Done

- The live top-level route works without login and registers exactly five tools in ChatGPT.
- A clear geographic request opens the intended visible place; ambiguous input does not guess or mutate.
- Notes and trails are shared between human controls and ChatGPT and remain intentionally session-only.
- Every write reports success only after the corresponding map revision is visible.
- Desktop and 390x844 mobile views feel like the same high-quality field atlas.
- Opening, zooming, trail drawing, and note creation are coherent, accessible, and reduced-motion safe.
- The iframe preview remains functional but does not displace the top-level judge surface.
- The final video demonstrates the product loop with audio in under three minutes.
- The public challenge repository, license, live candidate, video, and Devpost description all point to the same immutable release.

## Explicit Scope Rationale

A sharp, high-quality shared atlas is more competitive than a rushed combination of navigation, persistence, voxel rendering, multiple integration architectures, and generated decoration. The cut protects the WebMCP story, the visual bar, and the three-day release window.
