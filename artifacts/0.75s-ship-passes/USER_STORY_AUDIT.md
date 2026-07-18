# 0.75S User Story Audit

Scope: cold-user Atlas path against current source. This audits what ships now; it does not assume future Hosted Clawd, public paid access, or generated playable counties.

## Beat 1 - User Finds Atlas In The Directory

Surface + copy:
- Manifest name: `"Atlas"` (`chatgpt-app-submission.json:4-9`).
- Subtitle: `"Explore your county as a voxel city and scout it with an AI agent"` (`chatgpt-app-submission.json:5-7`).
- Icon path: `"assets/brand/atlas-icon-512.png"` (`chatgpt-app-submission.json:9`).
- Description says Atlas is session-only and that `"Hosted Clawd persistence is planned, not live."` (`chatgpt-app-submission.json:7`).

Tools invoked:
- None at directory discovery.

GAP (polish):
The subtitle says "your county," while the actual playable public surface is Riverside/Eastvale only. The long description is honest, but the first line can over-set expectations before the user reaches the limitation copy.

## Beat 2 - User Opens Atlas: First Tool Call + First Paint

Surface + copy:
- Server instructions route opening to `select_county`: `"Use select_county to open Riverside/Eastvale, the playable Atlas map right now."` (`server/src/index.ts:2223-2229`).
- Tool loading copy: `"Loading Riverside County..."` then `"Riverside County ready."` (`server/src/index.ts:2317-2322`).
- Tool answer: `"Selected Riverside County. Eastvale is the playable district in this county. Use the map for places, pins, and session-only notes."` (`server/src/index.ts:2356-2368`).
- Widget first paint shows current city map with county/district (`web/src/CityWorldView.tsx:169-175`), selected tray (`web/src/CityWorldView.tsx:221-239`), and session boundary `"Pins and notes stay in this chat."` (`web/src/CityWorldView.tsx:252-254`).

Tools invoked:
- `select_county` (`server/src/index.ts:2297-2372`).

GAP (polish):
The first paint has no explicit help affordance. It assumes the user will infer that the map can be panned, zoomed, tapped, pinned, and noted.

## Beat 3 - User Asks A Place Question

Surface + copy:
- Closed-world county Q&A tool says answers come only from the curated Riverside/Eastvale pack (`server/src/index.ts:2374-2415`).
- Invocation copy: `"Checking curated county data..."` then `"County answer ready."` (`server/src/index.ts:2395-2398`).
- Supported answer prefix: `"Curated Riverside/Eastvale answer."`; unsupported prefix: `"Atlas can only answer curated Riverside/Eastvale county questions right now."` (`server/src/index.ts:2400-2410`).
- Open-world nearby lookup is separate and says lookup results are `"not saved, and not coverage proof"` (`server/src/index.ts:2253-2294`).

Tools invoked:
- `ask_county_question` for curated Riverside/Eastvale questions (`server/src/index.ts:2374-2415`).
- `lookup_world_places` for real nearby place lookup (`server/src/index.ts:2253-2294`).
- `render_voxel_county` can refresh/focus the map if the answer should show the map again (`server/src/index.ts:2417-2496`).

GAP (polish):
The audit found no in-widget question entry point. The user must ask in ChatGPT; the map does not expose a visible "ask about this place" control after selection.

## Beat 4 - User Explores The Map

Surface + copy:
- Selected tray shows place kind, label, description, activity, counts, and `"Pins and notes stay in this chat."` (`web/src/CityWorldView.tsx:221-254`).
- County switcher copy: `"Riverside is fully explorable. Other counties preview as outlines. Nothing saves between chats."` (`web/src/CountySwitcher.tsx:47-56`).
- Note placeholder changes to `Add note for ${activePlace.label}` when a place is selected (`web/src/CityWorldView.tsx:266-274`).
- Save button copy is `"Save"` for session notes (`web/src/CityWorldView.tsx:275-277`).

Tools invoked:
- None for pan/zoom/hover/tap/pins/notes. These are widget-local.

Actual behavior:
- Place tap updates selected place and posts optional model context (`web/src/App.tsx:515-529`).
- Hover redraws overlay only (`web/src/CityWorldRenderer.tsx:627-632`, `web/src/CityWorldRenderer.tsx:717-755`).
- Pan/pinch/wheel zoom update camera locally (`web/src/CityWorldRenderer.tsx:597-680`).
- Sticker mode and pin drop mutate widget state (`web/src/CityWorldView.tsx:180-208`, `web/src/App.tsx:531-545`).
- Notes mutate widget state and clear the draft (`web/src/App.tsx:547-560`).

GAP (polish):
Exploration has good local feedback, but empty-map taps do nothing and there is no help/gesture hint. The session-only boundary is clear but passive.

## Beat 5 - User Drops Clawd Scout And Reads Report

Surface + copy:
- Tool invocation: `"Dropping Clawd..."` then `"Scout Drop ready."` (`server/src/index.ts:2520-2525`).
- Tool answer says the preview is session-only and `"does not save, post, message, spend, grant XP, or execute outreach"` (`server/src/index.ts:2539-2550`).
- Widget panel kicker starts with `"Scout drop"` and appends the business type (`web/src/PreviewPanel.tsx:31-43`).
- Panel footer: `"Session preview. Nothing is saved, sent, or scheduled."` (`web/src/PreviewPanel.tsx:275-280`).
- CTA: `"Preview 7-day campaign"` (`web/src/PreviewPanel.tsx:111`, `web/src/PreviewPanel.tsx:282-290`).

Tools invoked:
- `preview_scout_drop` (`server/src/index.ts:2498-2554`).

GAP (polish):
The Scout result panel is real once the tool result lands. The CTA to campaign is host-driven; outside ChatGPT it can appear to do nothing because it only sends a user message.

## Beat 6 - User Previews 7-Day Campaign

Surface + copy:
- Tool invocation: `"Drafting manual campaign..."` then `"Campaign preview ready."` (`server/src/index.ts:2579-2584`).
- Tool answer says `"no posting, messaging, ad spend, persistence, evidence, or XP is performed"` (`server/src/index.ts:2603-2614`).
- Widget panel kicker starts with `"7-day campaign"` and appends the business type (`web/src/PreviewPanel.tsx:116-128`).
- Panel sections include `"7-day plan"`, `"Assets"`, and `"Guardrails"` (`web/src/PreviewPanel.tsx:139-181`).
- CTA: `"Save options"` (`web/src/PreviewPanel.tsx:186-187`).

Tools invoked:
- `preview_campaign_engine`, after a valid `scoutPreviewId` from `preview_scout_drop` (`server/src/index.ts:2556-2618`).

GAP (polish):
The tool requires a matching deterministic `scoutPreviewId`; if the model/user loses that context, the server throws a mismatch instead of recovering in-widget (`server/src/index.ts:2597-2599`).

## Beat 7 - User Asks About Another County

Surface + copy:
- Orange shell local copy: `"Orange County is indexed from Census county identity data, but Atlas has not built a playable local scene for it yet."` (`web/src/App.tsx:92-110`).
- Unsupported local copy: `"Atlas does not have an indexed or curated county contract for this slug yet. Use Riverside County for the playable Engine Beta slice."` (`web/src/App.tsx:113-136`).
- Coverage tray boundary: `"Browse-only. Nothing is saved."` or `"Not indexed yet. Nothing is saved."` (`web/src/CountyCoverageView.tsx:23-25`, `web/src/CountyCoverageView.tsx:97-99`).
- Recovery button: `"Open Riverside"` (`web/src/CountyCoverageView.tsx:26-37`, `web/src/CountyCoverageView.tsx:101-103`).
- Server shell answer says non-playable counties are browse-only and Atlas `"does not invent local places, saves, XP, evidence, or automation"` (`server/src/index.ts:2324-2351`).

Tools invoked:
- `select_county` for switching/opening counties (`server/src/index.ts:2297-2372`).
- `render_voxel_county` for refreshing/focusing an already-open map (`server/src/index.ts:2417-2496`).

GAP (polish):
Coverage honesty is strong. The weak point is recovery: `Open Riverside` only sends a host message and has no local fallback in preview/browser capture.

## Beat 8 - User Tries To Save Or Upgrade

Surface + copy:
- Place tray button: `"Save with ChatGPT"` plus session boundary text, usually `"This chat is temporary."` (`web/src/CityWorldView.tsx:255-259`, `web/src/App.tsx:797-807`).
- Hosted sheet title: `"Save with ChatGPT"` (`web/src/HostedClawdTray.tsx:82-88`).
- Waitlist primary action label: `"Join waitlist"` (`web/src/App.tsx:809-831`; server equivalent at `server/src/hostedClawd/service.ts:266-280`).
- Sheet status in closed state: `"Status: {ready}/{slots} ready"` (`web/src/HostedClawdTray.tsx:55-67`).
- Readiness copy when not persistent: `"This chat is temporary. Connect an account before anything can be saved."` (`web/src/HostedClawdTray.tsx:224-231`).
- Upgrade tool hosted status is `"planned_beta"` unless owner-gated test flags are live (`server/src/index.ts:1116-1175`).
- Upgrade next step in planned state: `"Use the free Alpha preview now; Hosted Clawd adds saving after the next approval gate."` (`server/src/index.ts:1147-1149`).

Tools invoked:
- `get_upgrade_options` when the user asks in chat about saving/pricing/Hosted Clawd (`server/src/index.ts:2620-2659`).
- Widget button path is not an MCP tool. It calls `/api/hosted-clawd/create-or-attach` for `join_waitlist` (`web/src/App.tsx:580-641`, `web/src/App.tsx:693-705`).

Exact tap behavior today with Hosted Clawd planned beta:
- `Save with ChatGPT` opens the local Hosted Clawd tray (`web/src/App.tsx:562-570`).
- The primary action is `join_waitlist` in waitlist/planned state (`web/src/App.tsx:809-831`).
- Tapping it POSTs to `/api/hosted-clawd/create-or-attach` (`web/src/App.tsx:616-623`, `web/src/App.tsx:693-705`).
- If persistence is closed, the service returns `"Saving is not live yet. Join the waitlist to save this business later."` (`server/src/hostedClawd/service.ts:80-86`, `server/src/hostedClawd/service.ts:430-443`), and the widget displays that as `hosted-clawd-action-message` (`web/src/App.tsx:623-630`, `web/src/HostedClawdTray.tsx:172-181`).
- If the fetch fails, the widget fallback says `"Saving is not live yet. This business stays in this chat."` (`web/src/App.tsx:635-641`).

GAP (polish):
The label "Save with ChatGPT" is attractive but slightly over-promises before the user opens the sheet. The sheet corrects it, but the first tap sounds like a save action, not save options.

## Beat 9 - Session Ends

Surface + copy:
- Directory description: `"session-only: Atlas saves no state..."` (`chatgpt-app-submission.json:7`).
- Place tray: `"Pins and notes stay in this chat."` (`web/src/CityWorldView.tsx:252-254`).
- Preview panel: `"Session preview. Nothing is saved, sent, or scheduled."` (`web/src/PreviewPanel.tsx:275-280`).
- Hosted Clawd waitlist secondary copy: `"This map, pins, notes, Scout Drop, and campaign preview remain temporary."` (`web/src/App.tsx:921-936`; server equivalent at `server/src/hostedClawd/service.ts:559-563`).
- Coverage chip: `"Nothing saves between chats."` (`web/src/CountySwitcher.tsx:47-56`).

Tools invoked:
- None on session end. State is widget-local unless future Hosted Clawd gates are enabled.

What is lost:
- Local selected place state, pins/stickers, note drafts/saved session notes, Scout preview panel state, campaign preview panel state, and generated draft view state unless ChatGPT/widget state preserves the current conversation session. No durable user account save is claimed in planned beta.

GAP (polish):
The warning is present in multiple places, but there is no final "what will be lost" moment when the user tries to close/end the session. The product relies on passive copy.

## Top 5 Gaps By User Pain

1. **Host-driven CTAs can look dead in local/browser-only review**: `Generate a district`, `Preview 7-day campaign`, and `Open Riverside` depend on ChatGPT host/model/tool callbacks with no local pending state.
2. **"Save with ChatGPT" over-promises on first read**: the actual planned-beta action is waitlist/save-options, not a save.
3. **No help / `?` affordance**: cold users get no compact gesture or loop guidance inside the widget.
4. **No in-widget place-question CTA**: place selection informs ChatGPT context, but the user must know to ask in the chat.
5. **Session-loss copy is passive**: Atlas says state is temporary, but does not summarize what will be lost at the save/end moment.

