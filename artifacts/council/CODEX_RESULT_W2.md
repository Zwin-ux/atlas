# CODEX RESULT W2 - Return Loop

Status: implementation complete, uncommitted.

## Resume Mechanism

- `WidgetState` already had `stickers`, `notes`, and `scoutPreviewId`; W2 now writes `scoutPreviewId` when a Scout or Campaign preview reaches the widget.
- `App.tsx` derives a quiet session resume summary from host-backed widget state. If state is non-empty, `CityWorldView.tsx` renders one tray line with `data-qa="session-resume"`, e.g. `3 pins · 1 note · Scout Drop in this chat`.
- `App.tsx` calls `updateModelContext` once per widget mount when a non-empty resume summary is observed, including host globals that arrive after first render.
- The existing boundary line remains: `Pins and notes stay in this chat.`

## Copy Strings Changed

- `Nothing is saved.` -> `Preview stays in this chat.`
- `Saving is not live yet. This business stays in this chat.` -> `This business stays in this chat.`
- `Saved` in Scout report save preview -> `In this chat`
- `Saved` in Campaign draft save preview -> `In this chat`
- `This chat is temporary.` -> `Lives in this chat.`
- `Join the waitlist to save this setup later.` -> `Use this setup in this chat.`
- `Stickers and notes stay temporary until you choose what to save.` -> `Stickers and notes live in this chat.`
- `This map, pins, notes, Scout Drop, and campaign preview remain temporary.` -> `This map, pins, notes, Scout Drop, and campaign preview live in this chat.`
- `Save this route with ChatGPT when saving opens.` -> `This Scout Drop stays in this chat.`
- `Save this Scout Drop with ChatGPT when saving opens.` -> `This Scout Drop stays in this chat.`
- `Save this campaign with ChatGPT when saving opens.` -> `This campaign preview stays in this chat.`
- `Save this campaign with ChatGPT` -> `Review Alpha limits`
- `Temporary Alpha preview...` -> `Session-only Alpha preview...`
- Scout/campaign Eastvale-specific copy is now place/county/business-based: summary, best offer, route steps, route extension copy, QR flyer label, first-route stat, and campaign scene id.
- Server `preview_scout_drop` description now says `session-only Scout Drop preview` and no longer says Alpha is curated Riverside demo data only.
- Server `preview_campaign_engine` description now states stale ids rebuild the Scout preview and continue.
- Widget campaign advance prompt changed from a generic sentence to a tool-specific handoff that includes `scoutPreviewId`, `countySlug`, `nodeId`, `locationLabel`, `businessType`, and `goal`.

## Continuity Design

- The widget stores the current Scout id in `widgetState.scoutPreviewId`.
- The Scout preview CTA sends a user message instructing the model to call `preview_campaign_engine` with the exact Scout id and source args.
- `CampaignPreviewService.previewCampaignFromScoutRequest` rebuilds a Scout preview from supplied args and returns `{ rebuiltScoutPreview, campaignPreview }`.
- On stale id mismatch, server HTTP and MCP handlers no longer throw. They return a campaign preview with `continuityNote: "rebuilt scout preview"` in structured content and text that begins `Rebuilt scout preview from the supplied args.`

## Scout De-Faking

- `ScoutDropService` now builds a `ScoutSceneContext` from actual input: `countySlug`, `nodeId`, `locationLabel`, `businessType`, and scene places when Riverside curated scene data is reachable.
- Riverside still uses the curated demo scene, but signals/routes copy comes from selected place labels and place kinds/activity.
- Non-Riverside counties get a clearly synthetic, non-playable Scout preview scene based on the requested county/place labels. This avoids borrowing Eastvale while preserving honesty that it is not live coverage or market proof.
- Campaign copy now consumes the Scout route instead of hardcoded Eastvale/Norco/Corona stops.

## Sample Outputs

Curated Riverside / mobile detailing:

```json
{
  "id": "scout-riverside-ca-eastvale-mobile-detailing",
  "summary": "Eastvale in Riverside County is the first Scout Drop for mobile detailing: use the visible place mix, route friction, and manual outreach surfaces as a session-only planning preview.",
  "bestOffer": "Mobile detailing starter offer for Eastvale: one clear service window, owner-approved copy, and a manual route note for Riverside County.",
  "firstRoute": "Eastvale -> Neighborhood Blocks -> Plaza Row"
}
```

Orange County / roofing:

```json
{
  "id": "scout-orange-ca-anaheim-stadium-roofing",
  "summary": "Anaheim Stadium in Orange County is the first Scout Drop for roofing: use the visible place mix, route friction, and manual outreach surfaces as a session-only planning preview.",
  "bestOffer": "Roofing starter offer for Anaheim Stadium: one clear service window, owner-approved copy, and a manual route note for Orange County.",
  "firstRoute": "Anaheim Stadium -> Anaheim Stadium home-area blocks -> Anaheim Stadium plaza surface",
  "limitation": "Session-only Alpha preview using requested Orange County and Anaheim Stadium labels with synthetic template signals, not live coverage or market proof."
}
```

Stale campaign id:

```json
{
  "rebuiltScoutPreview": true,
  "continuityNote": "rebuilt scout preview",
  "summary": "Seven-day manual campaign preview for roofing: start with Anaheim Stadium in Orange County, test QR and partner surfaces, then extend only where the route stays tight."
}
```

## Gate Tails

- `pnpm typecheck:starter` -> pass.
- `pnpm test:core` -> pass, 22 files / 129 tests.
- `node scripts/verify-tool-result-shape.mjs` -> pass, `blockerCount: 0`.
- `node scripts/verify-mcp-flow.mjs` against local server on port 8793 with `GEO_DATA_ADAPTER=mock` -> pass; 7 tools, lookup cache hit, Scout id `scout-riverside-ca-eastvale-mobile-detailing`, campaign id `campaign-riverside-ca-eastvale-mobile-detailing`.
- `node scripts/verify-submission.mjs` against local server on port 8794 with `GEO_DATA_ADAPTER=mock` -> pass; wrapper timed out during Windows shell cleanup after verifier exit 0, no port remained open.
- `node scripts/verify-save-surface-flag.mjs` -> pass; save surface on/off gates green.
- `node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8793/preview` -> not green locally; failed before app assertions with Node `Warning: Detected unsettled top-level await` in the CDP connect path. Separate CDP probe could not open a Chrome remote debugging port on this host. Reviewer/browser audit remains required.
- `node scripts/verify-hosted-clawd-save-ux.mjs` -> not applicable to this branch; it is pinned to the old 0.61H current-update/doc tokens and failed on current 0.72B source-of-truth drift, not on W2 code.

## Risks

- Non-Riverside Scout previews are synthetic label-based planning previews, not real local data. Copy and limitations state that, but reviewer should verify the UI does not visually imply public playable coverage.
- The resume chip is intentionally one text line in the existing tray; browser audit should confirm it stays achromatic and does not crowd 390x844.
- The widget handoff still depends on the model honoring the `sendUserMessage` instruction. Server-side stale-id rebuild is the fallback when it does not.
