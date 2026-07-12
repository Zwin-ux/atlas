# Atlas Packet Copy-Prod Result

Current quest: `postalpha-0.72b-redis-scene-packet-cache-job-spine`.

Scope held to user-facing copy in the app, server tool output/model descriptions, Scout/Campaign copy, verifier assertion retargets, and submission copy. Logic, schemas, security, emulator host code, and docs were not intentionally changed.

Anti-scope held: no commerce reopen, no live Stripe claims, no new public tools, no provider geometry, no public Anaheim/Ontario promotion, no persistence claims, no renderer/product behavior changes beyond copy presentation.

## Before / After Copy Table

| Area | Before | After |
| --- | --- | --- |
| `web/src/App.tsx` county summary | `County shell` | `Preview available` |
| `web/src/App.tsx` county summary | `Orange County is indexed in Atlas, but its playable map is not built yet.` | `Orange County can be previewed in Atlas, but its full local map is not built yet.` |
| `web/src/App.tsx` county summary | `Atlas has no coverage for ${countyLabel} yet.` | `Atlas cannot preview ${countyLabel} yet.` |
| `web/src/App.tsx` county limitations | `Playable scene is not built yet; browse shell status only.` | `Full map not built yet. Open Riverside/Eastvale for the full map.` |
| `web/src/App.tsx` county limitations | `No local places, saved state, XP, evidence, outreach, or automation unlock from this shell.` | `Atlas does not add local places, saved work, XP, evidence, outreach, or automation here.` |
| `web/src/App.tsx` unsupported county | `Atlas does not have a county shell for ${label} yet. Open Riverside County for playable Eastvale.` | `Atlas cannot preview ${label} yet. Open Riverside County for the full map.` |
| `web/src/App.tsx` source label | `Atlas curated Alpha world` | `Atlas Riverside/Eastvale map data` |
| `web/src/App.tsx` source attribution | `Atlas demo dataset` | `Atlas built-in demo data` |
| `web/src/App.tsx` generated preview request | `Show the generated draft for ${countyLabel}.` | `Show the generated district preview for ${countyLabel}.` |
| `web/src/App.tsx` generated preview context | `The user requested the generated draft scene for ${countyLabel}. It must remain non-playable, provider-free, not real local coverage, and session-only.` | `The user requested the generated district preview for ${countyLabel}. It must stay in this chat, with no playable map, provider data, or real local coverage claims.` |
| `web/src/App.tsx` generated preview loading | `Preparing generated draft window for ${countyLabel}.` | `Preparing a generated district preview for ${countyLabel}.` |
| `web/src/App.tsx` generated preview boundary | `Generated draft prepared for ${countyLabel}. Not real coverage, not playable, and stays in this chat.` | `Generated district preview ready for ${countyLabel}. Not real coverage. Preview stays in this chat.` |
| `web/src/App.tsx` generated preview button subcopy | `generated · session-only` | `Preview only - stays in this chat.` |
| `web/src/App.tsx` Hosted Clawd tier | `Alpha Free` | `Preview` |
| `web/src/App.tsx` Hosted Clawd tier | `Beta Invite` | `Save invite` |
| `web/src/App.tsx` Hosted Clawd tier | `Beta Paid` | `Paid save plan` |
| `web/src/App.tsx` Hosted Clawd billing | `Test billing` | `Billing setup` |
| `web/src/App.tsx` Hosted Clawd billing | `Open test Checkout` | `Open checkout setup` |
| `web/src/App.tsx` Hosted Clawd billing | `Billing is off in Alpha.` | `Billing is not live.` |
| `web/src/App.tsx` Hosted Clawd billing | `Stripe Checkout` | `Checkout` |
| `web/src/App.tsx` Hosted Clawd context | `external Beta promotion` | `public save promotion` |
| `web/src/App.tsx` save action | `Saved Atlas state.` | `Saved Atlas preview.` |
| `web/src/App.tsx` save action | `This Alpha preview is not saved.` | `This preview is not saved.` |
| `web/src/App.tsx` resume model context | `Atlas resumed this chat with ${items}. Treat these as in-chat session state only.` | `Atlas resumed this chat with ${items}. Treat these as work from this chat only.` |
| `web/src/App.tsx` resume label separator | `Scout Drop · Campaign preview` | `Scout Drop / Campaign preview` |
| `web/src/App.tsx` county switch label | `Riverside playable` | `Riverside full map` |
| `web/src/App.tsx` county switch label | `Orange shell` | `Orange preview` |
| `web/src/App.tsx` county switch label | `unsupported county` | `unsupported county` |
| `web/src/App.tsx` generated exit | `Exited synthetic preview for ${label}.` | `Exited generated preview for ${label}.` |
| `web/src/CountyCoverageView.tsx` status | `Indexed shell` | `Preview available` |
| `web/src/CountyCoverageView.tsx` status | `Shell state` | `Map preview` |
| `web/src/CountyCoverageView.tsx` status | `Not indexed` | `Not available yet` |
| `web/src/CountyCoverageView.tsx` source | `Atlas coverage index` | `Atlas county list` |
| `web/src/CountyCoverageView.tsx` boundary | `Browse-only. Nothing is saved.` | `Preview only. Stays in this chat.` |
| `web/src/CountyCoverageView.tsx` boundary | `Not indexed yet. Nothing is saved.` | `Not available yet. Stays in this chat.` |
| `web/src/CountyCoverageView.tsx` aria | `Current county coverage` | `Current county status` |
| `web/src/CountyCoverageView.tsx` aria | `County coverage status` | `County status` |
| `web/src/CountyCoverageView.tsx` label | `Coverage facts` | `Map facts` |
| `web/src/CountyCoverageView.tsx` pulse | `Indexed` | `Preview` |
| `web/src/CountyCoverageView.tsx` pulse | `Unsupported` | `Unavailable` |
| `web/src/CountyCoverageView.tsx` metric | `playable districts` | `full-map areas` |
| `web/src/CountyCoverageView.tsx` recovery | `Open Riverside` | `Open Riverside/Eastvale` |
| `web/src/CountyCoverageView.tsx` footer | `Playable: Riverside/Eastvale.` | `Full map: Riverside/Eastvale.` |
| `web/src/CountySwitcher.tsx` status | `Playable` | `Full map` |
| `web/src/CountySwitcher.tsx` status | `Shell` | `Preview` |
| `web/src/CountySwitcher.tsx` status | `Not indexed` | `Unavailable` |
| `web/src/CountySwitcher.tsx` summary | `Nothing saves between chats.` | `Pins and notes stay in this chat.` |
| `web/src/PreviewPanel.tsx` footer | `Session preview. Nothing is saved, sent, or scheduled.` | `Preview only. Nothing is saved, sent, or scheduled.` |
| `web/src/HostedClawdTray.tsx` title | `Saved Atlas state` | `Saved Atlas items` |
| `web/src/HostedClawdTray.tsx` save readiness | `This chat is temporary. Hosted Clawd keeps saved state once the owner-protected gate is open.` | `This preview stays in this chat. Hosted Clawd keeps saved items once the owner-protected gate is open.` |
| `web/src/HostedClawdTray.tsx` saved shelf | `Latest preview ${id}` | `Latest Scout Drop saved` |
| `web/src/HostedClawdTray.tsx` saved shelf | `Preview ${id}` | `Campaign preview saved` |
| `web/src/HostedClawdTray.tsx` empty shelf | `No saved state yet` | `Nothing saved yet` |
| `web/src/CityWorldView.tsx` boundary kicker | `GENERATED PREVIEW` | `PREVIEW ONLY` |
| `web/src/CityWorldView.tsx` generated boundary | `Generated district. Not real coverage. Preview stays in this chat.` | Unchanged; already plain and correct. |
| `web/src/CityWorldRenderer.tsx` aria | `${district} voxel city map, ${county} coverage shell` | `${county} county preview voxel city map` for preview counties; `${district} voxel city map` for the full map. |
| `packages/core/src/scout/ScoutDropService.ts` summary | `session-only planning preview` | `planning preview that stays in this chat` |
| `packages/core/src/scout/ScoutDropService.ts` limitation | `Session-only Alpha preview using curated ${countyLabel} signals and mock planning logic.` | `Preview only. Uses built-in ${countyLabel} map signals and planning logic, not live market claims.` |
| `packages/core/src/scout/ScoutDropService.ts` limitation | `Session-only Alpha preview for ${selectedLabel} using synthetic template signals.` | `Preview only. Uses requested ${selectedLabel} labels with planning signals, not real coverage or market proof.` |
| `packages/core/src/scout/ScoutDropService.ts` limitation | `Budget, ranking, and service radius are mocked in Alpha.` | `Budget, ranking, and service radius are planning estimates.` |
| `packages/core/src/scout/ScoutDropService.ts` risk | `Live-market boundary` | `Market boundary` |
| `packages/core/src/scout/ScoutDropService.ts` risk mitigation | `Pair with live discovery before action.` | `Check live local conditions before action.` |
| `packages/core/src/scout/ScoutDropService.ts` risk | `Synthetic preview boundary` | `Preview boundary` |
| `packages/core/src/scout/ScoutDropService.ts` risk mitigation | `Treat synthetic labels as planning prompts, not real coverage.` | `Treat preview labels as planning prompts, not real local coverage.` |
| `packages/core/src/scout/ScoutDropService.ts` panel stat | `Live demand` | `Market check` |
| `packages/core/src/scout/ScoutDropService.ts` panel stat | `Synthetic` | `Preview` |
| `packages/core/src/scout/ScoutDropService.ts` scene text | `Synthetic service-route rehearsal` | `Service-route rehearsal` |
| `packages/core/src/scout/ScoutDropService.ts` scene text | `Synthetic offer zone for ${selectedLabel}` | `Offer zone for ${selectedLabel}` |
| `packages/core/src/scout/ScoutDropService.ts` district label | `${selectedLabel} synthetic Scout preview` | `${selectedLabel} Scout preview` |
| `packages/core/src/scout/ScoutDropService.ts` district summary | `Synthetic Scout Drop preview for ${selectedLabel}; session-only and not persisted.` | `Planning preview for ${selectedLabel}. Stays in this chat and is not saved.` |
| `packages/core/src/scout/CampaignPreviewService.ts` next action | `Review Alpha limits` | `Review save limits` |
| `server/src/index.ts` coverage label | `County shell` | `Preview available` |
| `server/src/index.ts` coverage label | `Playable district` | `Full map available` |
| `server/src/index.ts` coverage label | `Unsupported county` | `Not available yet` |
| `server/src/index.ts` coverage message | `${county} is indexed in Atlas, but its playable map is not built yet.` | `${county} can be previewed in Atlas, but its full local map is not built yet.` |
| `server/src/index.ts` coverage message | `Atlas has no county shell for ${county} yet.` | `Atlas cannot preview ${county} yet.` |
| `server/src/index.ts` coverage limitation | `Playable scene is not built yet; browse shell status only.` | `Full map not built yet. Open Riverside/Eastvale for the full map.` |
| `server/src/index.ts` coverage limitation | `No local places, saved state, XP, evidence, outreach, or automation unlock from this shell.` | `Atlas does not add local places, saved work, XP, evidence, outreach, or automation here.` |
| `server/src/index.ts` source notes | `curated Riverside Alpha pack`, `curated pack`, `Riverside Alpha pack`, `curated Alpha data` | `built-in Riverside/Eastvale data`, `built-in map data`, `Riverside/Eastvale map data` |
| `server/src/index.ts` scene error | `Atlas only renders a playable map for Riverside County / Eastvale in Engine Beta.` | `Atlas only renders a full map for Riverside County / Eastvale right now.` |
| `server/src/index.ts` scene error | `Unable to load Riverside/Eastvale scene packet.` | `Atlas could not load the Riverside/Eastvale map.` |
| `server/src/index.ts` question copy | `Alpha`, `Engine Beta`, `session-only`, `curated pack` in generated answer text | `preview`, `in-chat`, `built-in map data` in model/user-visible answer text |
| `server/src/index.ts` upgrade plan | `Campaign drafts after saved state approval.` | `Campaign drafts after saved work is approved.` |
| `server/src/index.ts` upgrade plan | `Stripe Checkout is not live.` | `Checkout is not live.` |
| `server/src/index.ts` upgrade free plan | `Preview generated US county drafts on indexed shells when explicitly requested.` | `Preview generated districts for US counties when requested.` |
| `server/src/index.ts` upgrade current state | `Atlas Free is session-only today.` | `Atlas keeps work in this chat today.` |
| `server/src/index.ts` upgrade next step | `Use Atlas as the session-only map and planning preview; pins, notes, Scout Drops, and campaign previews do not persist yet.` | `Use Atlas as a map and planning preview; pins, notes, Scout Drops, and campaign previews stay in this chat.` |
| `server/src/index.ts` privacy | `Atlas is an Alpha ChatGPT app.` | `Atlas is a ChatGPT app.` |
| `server/src/index.ts` privacy | `session-only previews` | `previews that stay in this chat` |
| `server/src/index.ts` privacy | `Pins, notes, scout drops, and campaign previews are session-only.` | `Pins, notes, scout drops, and campaign previews stay in this chat.` |
| `server/src/index.ts` privacy | `after the session` | `after this chat` |
| `server/src/index.ts` terms | `Alpha software` | `Current limits` |
| `server/src/index.ts` terms | `session-only voxel map` | `voxel map` |
| `server/src/index.ts` terms | `Only Riverside/Eastvale is playable in the current Engine Beta build.` | `Only Riverside/Eastvale has the full map right now.` |
| `server/src/index.ts` terms | `County shells, generated previews, and unsupported counties are marked separately.` | `Counties marked as previews or unavailable do not have the full map.` |
| `server/src/index.ts` lookup result | `does not unlock a playable county map` | `does not unlock a full county map` |
| `server/src/index.ts` tool description | `Select a county shell or the playable Riverside/Eastvale map.` | `Select a county preview or the full Riverside/Eastvale map.` |
| `server/src/index.ts` tool description | `Known non-playable counties return shell status only.` | `Known counties outside Riverside/Eastvale return preview status only.` |
| `server/src/index.ts` tool input | `County slug` | `County id` |
| `server/src/index.ts` tool input | `Request a generated draft scene packet for an indexed shell county.` | `Request a generated district preview for a known county. It is not real coverage and stays in this chat.` |
| `server/src/index.ts` select result | `Eastvale is playable. Pins and notes are session-only.` | `Eastvale is the full map. Pins and notes stay in this chat.` |
| `server/src/index.ts` select preview result | `Orange County shell selected...` | `Orange County is preview only...` |
| `server/src/index.ts` ask description | `Ask questions about the curated Riverside/Eastvale map data.` | `Ask questions about the built-in Riverside/Eastvale map data.` |
| `server/src/index.ts` ask invoking | `Checking Riverside Alpha pack...` | `Checking Riverside map data...` |
| `server/src/index.ts` ask content | `Riverside answer:` | `Riverside/Eastvale answer:` |
| `server/src/index.ts` render description | `Render the playable Riverside/Eastvale voxel county scene or return shell status for a known county.` | `Render the full Riverside/Eastvale voxel map or return preview status for a known county.` |
| `server/src/index.ts` render input | `Render a generated draft scene packet for an indexed shell county.` | `Render a generated district preview for a known county. It is not real coverage and stays in this chat.` |
| `server/src/index.ts` render preview result | `shell preview` / `playable map is built` | `preview only` / `full map is built` |
| `server/src/index.ts` render full map result | `Showing Eastvale... session-only pins and notes are ready.` | `Showing the Riverside/Eastvale full map. Pins and notes stay in this chat.` |
| `server/src/index.ts` Scout description | `Generate a session-only Scout Drop preview...` | `Generate a Scout Drop preview that stays in this chat...` |
| `server/src/index.ts` Scout result | `This is a session-only Alpha preview...` | `This preview stays in this chat...` |
| `server/src/index.ts` Campaign description | `Generate a session-only campaign preview...` | `Generate a campaign preview that stays in this chat...` |
| `server/src/index.ts` Campaign result | `This manual Alpha preview stays in this chat...` | `This manual preview stays in this chat...` |
| `server/src/index.ts` upgrade description | `Return current Alpha limits and planned Hosted Clawd paid options.` | `Return current save limits and planned Hosted Clawd options.` |
| `server/src/index.ts` API error | `Missing county slug` | `Missing county id` |
| `server/src/index.ts` API error | `Missing county or district slug` | `Missing county or district id` |
| `chatgpt-app-submission.json` subtitle | `Explore Riverside/Eastvale and preview generated US county drafts.` | `Explore Riverside/Eastvale and preview generated county districts.` |
| `chatgpt-app-submission.json` description | `indexed county shell`, `curated Riverside/Eastvale pack`, `generated draft previews` | `known US counties`, `built-in Riverside/Eastvale map data`, `generated district previews` |
| `chatgpt-app-submission.json` tests | `scenePacket`, `_meta`, `Alpha`, `curated pack`, `playable county map` in expected prose | `widget-only map data`, `preview`, `built-in map data`, `full county map` |

## Gate Assertion Retargets

| Gate file | Retarget |
| --- | --- |
| `scripts/verify-mcp-flow.mjs` | Select county assertions now expect `Eastvale is the full map` and `notes that stay in this chat`. |
| `scripts/verify-mcp-flow.mjs` | Preview county assertions now expect `preview only`, `Riverside/Eastvale is fully explorable today`, and no added local places, saved work, XP, evidence, outreach, or automation. |
| `scripts/verify-mcp-flow.mjs` | County question assertions now expect `Riverside/Eastvale answer` and built-in/live-market boundary language. |
| `scripts/verify-mcp-flow.mjs` | Unsupported county assertions now expect `only answer Riverside/Eastvale` and no invented local map claims. |
| `scripts/verify-mcp-flow.mjs` | Render assertions now expect `full map`, `preview only`, and `after the full map is built`. |
| `scripts/verify-mcp-flow.mjs` | Lookup assertion now expects `does not unlock a full county map`. |
| `scripts/verify-mcp-flow.mjs` | Scout and campaign assertions now expect chat-only preview language without Alpha wording. |
| `scripts/verify-mcp-flow.mjs` | Upgrade assertion now expects `Checkout is not live`. |
| `scripts/verify-submission.mjs` | Submission subtitle, description, select, ask, Scout, and campaign assertions now expect built-in data, generated district previews, and stays-in-this-chat boundaries. |
| `scripts/verify-chatgpt-entry-surface.mjs` | Product boundary and tool checks now target preview-only counties, full-map wording, and plain chat-only language. |
| `scripts/verify-preview-http.mjs` | Preview panel assertion now expects `Preview only. Nothing is saved, sent, or scheduled.` |
| `scripts/verify-alpha-product-loop.mjs` | User note and boundary assertions now use chat-boundary wording while preserving existing data hooks. |
| `scripts/verify-shell-county-widget.mjs` | Shell widget assertions now expect `Preview only`, `Not available yet`, and `stays in this chat`. |
| `scripts/verify-tool-result-shape.mjs` | Lookup token retargeted from playable county map to full county map. |
| `scripts/verify-save-surface-flag.mjs` | No user-copy assertion retarget was needed. |
| `scripts/verify-emulator-audit.mjs` | No assertion retarget was needed; the honesty banner already targets `Generated district. Not real coverage. Preview stays in this chat.` |
| `packages/core/test/*` | No copy assertion retarget was needed after the Scout/Campaign copy changes. |

## Strings Not Changed

| String or pattern | Why it stayed |
| --- | --- |
| `data-qa="alpha-city-world"` and `data-qa-session-boundary="session-only"` | Explicitly not user-visible; data hooks were required to remain unchanged. |
| `alpha_free`, `beta_invite`, `beta_paid`, `session_only_alpha`, `AlphaPreviewBoundary` | Internal enums/types/schema values. Changing them would be logic/schema work outside this copy fence. |
| `L1_COUNTY_SHELL`, `coverageTier`, `countySlug`, `slug` | Internal API fields and routing identifiers. User-visible labels were changed separately. |
| `scenePacket`, `generatedDraftPacket`, packet cache variable names, and scene packet verifier text | Internal metadata/verifier implementation language. Tool responses keep packet data in `_meta`, not user-visible text. |
| Sanitizer match patterns containing old words such as `Alpha`, `Engine Beta`, `Test Checkout`, and `curated pack` | They are not displayed. They exist only to rewrite old service/context strings before users see them. |
| Renderer/CSS `alpha` values | Graphics opacity terminology, not user-facing copy. |
| `scripts/verify-emulator-audit.mjs` error `County is not indexed` | Verifier/operator error text, not app or model/user-visible copy. |

## Gates

| Gate | Result |
| --- | --- |
| `pnpm typecheck:starter` | Passed after fixing source-note sanitization types. |
| `pnpm test:core` | Passed: 23 test files, 146 tests. |
| `node scripts/verify-tool-result-shape.mjs` | Passed. |
| `node scripts/verify-mcp-flow.mjs` with mock server | Passed against `http://127.0.0.1:8792/mcp`. |
| `node scripts/verify-save-surface-flag.mjs` | Passed. |
| Browser gates | Reviewer-run per directive; not run here. |
