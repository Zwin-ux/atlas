# Atlas Backend Product Taste Research

Status: E12 product/backend research memo.

Purpose:
Define what "good taste" means for Atlas backend and UI architecture. The goal
is not just more tables or nicer screenshots. The goal is a ChatGPT app that
feels trustworthy because the backend truth, map UI, and user promises line up.

## Research Signals

### OpenAI Apps SDK

Useful pattern:
Tool results split model-visible truth from widget-only richness. Concise
`structuredContent` is for the model and conversation. Larger `_meta` payloads
are for the component.

Atlas translation:

- `structuredContent` should carry county readiness, playable status, source
  notes, counts, and next safe action.
- `_meta` should carry `CityWorldScene`, hidden draft scenes, and renderer-only
  payloads.
- The widget must not infer playability from the existence of a scene. It should
  render only what the server says is allowed.

Source:
https://developers.openai.com/apps-sdk/reference

### Prediction Markets: Kalshi / Polymarket

Useful pattern:
Good prediction-market interfaces make an abstract backend number feel obvious:
event, market, probability, liquidity, and resolution rules. The best lesson is
not trading. It is the ruthless separation between object types and public
claims.

Atlas translation:

- County is not district.
- Candidate is not playable.
- Shell is not provider-normalized.
- Hidden draft is not public UI.
- A readiness tier should be as legible as a probability badge: users should
  instantly understand what is open, what is indexed, and what is not ready.

Sources:
https://docs.kalshi.com/welcome
https://docs.polymarket.com/market-data/overview
https://help.polymarket.com/en/articles/13364060-what-is-polymarket

### Mapbox Vector Tiles

Useful pattern:
Huge geography works because it is tiled, cached, and styled from bounded
geospatial payloads. The client does not render the whole world.

Atlas translation:

- Never compile a national canvas.
- Compile one county/district slice at a time.
- Backend owns identity, bounds, source notes, cache, TTL, and coverage tier.
- Renderer receives a bounded `CityWorldScene` with primitive fallback.

Source:
https://docs.mapbox.com/data/tilesets/guides/vector-tiles-introduction/

### Stripe Idempotency

Useful pattern:
Anything that creates state must survive retries without duplicating side
effects.

Atlas translation:

- Future saves need idempotency keys: Scout Drop save, campaign save, quest
  completion, evidence submission, XP grant, and webhook replay.
- Public session pins/notes do not need DB writes.
- Hosted Clawd writes must never be triggered by silent UI state changes.

Sources:
https://docs.stripe.com/api/idempotent_requests
https://stripe.com/blog/idempotency

### Supabase / Postgres RLS

Useful pattern:
User-owned rows must enforce ownership close to the database, not only in UI.

Atlas translation:

- Every persisted row eventually needs `owner_user_id` or a clear ownership
  chain.
- Public Alpha state remains session-only until this exists.
- No frontend or ChatGPT tool call should be trusted to scope persisted access.

Source:
https://supabase.com/docs/guides/database/postgres/row-level-security

### Linear

Useful pattern:
Linear's taste is speed, low noise, strong object hierarchy, and workflows that
feel built for operators rather than tourists.

Atlas translation:

- The UI should feel like a map console, not a dashboard.
- County state should be one compact control, not a directory app.
- Shell state should say exactly what is true and provide one next action.
- The backend should expose sharp objects and fewer ambiguous strings.

Source:
https://linear.app/

### Notion Relations

Useful pattern:
Database objects become useful when relations are visible and explainable.

Atlas translation:

- County -> district -> candidate pack -> anchor pack -> draft scene -> public
  playable scene should be explicit.
- Future Hosted Clawd state should relate to user, Clawd, business profile,
  scout drop, campaign, quest, evidence, and XP ledger without mixing demo
  session state.

Source:
https://www.notion.com/help/relations-and-rollups

## Product Taste Goals

1. **Truth badges beat apology copy.**
   Use compact states like `Playable`, `Indexed shell`, `Unknown`, `Draft proof`,
   and `Not public` instead of long defensive paragraphs.

2. **Backend owns promotion.**
   The frontend can never make Anaheim playable by finding a scene. Only a
   server-owned readiness contract can expose playable tools.

3. **Evidence is not product.**
   Hidden draft screenshots are useful for the team, but the user should not see
   a second playable district until it passes map quality, mobile quality, and
   product-loop quality.

4. **Session state stays humble.**
   Pins and notes are lightweight local interaction, not saved work. Keep them
   useful, visible, and honest.

5. **Persistence is explicit.**
   Saving a Scout Drop or campaign must be a confirmed user action with
   ownership, plan access, idempotency, and version pinning.

6. **One recovery path.**
   Shell and unsupported states should not branch into menus. They should point
   back to the current playable Riverside/Eastvale loop.

## Backend Shape To Aim For

```txt
ChatGPT tool call
  -> Tool input parser
  -> NationalWorldService
  -> CountyCoverage DTO
  -> Scene policy guard
  -> structuredContent truth
  -> _meta scene only when allowed
  -> Widget renders map-first UI
```

Future persisted path:

```txt
Confirmed user save
  -> Authenticated Hosted Clawd API
  -> Ownership + subscription + usage guard
  -> Idempotency key
  -> Version-pinned county pack reference
  -> Persisted Scout Drop / Campaign / Quest rows
```

## Immediate Forge/Mira Goals

### Forge

- Add typed guard tests that playable tools require both
  `coverageTier === "L2_CURATED_DISTRICT"` and `playableDistrictCount > 0`.
- Split DTO language into public coverage, hidden draft evidence, and future
  persisted Hosted Clawd state.
- Keep no-DB implementation until persistence is explicitly reopened.

### Mira

- Make shell/draft UI feel like a deliberate map state, not test harness output.
- Keep mobile first-screen comprehension strict.
- Reject any Anaheim promotion that needs labels to explain the objects.

### Lumen

- Stop broad polish passes when object identity is the blocker.
- Prioritize source art or authored silhouettes for the few anchor objects that
  must read before labels.

### Axiom

- Keep release order from drifting: backend truth, UI comprehension, visual
  proof, then promotion. Not the reverse.

## Decisions This Memo Supports

- Anaheim stays hidden/non-playable until promotion gates are real.
- Public Alpha/Engine Beta stays session-only.
- Backend readiness contracts matter as much as renderer quality.
- The next backend work should be DTO and guard-test hardening, not database
  migrations.
- The next UI work should compress readiness truth into a map-native control
  without hiding the recovery path.
