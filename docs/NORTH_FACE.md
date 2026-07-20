# Atlas North Face

**Authority:** This file is the product law for ship work. If `NEXT_QUESTS.md`,
slice ladders, or Hosted Clawd notes conflict, **this wins** until a human
rewrites it.

**Directory name (preferred):** Atlas County Scout  
**MCP URL (prod):** `https://atlas-backend-production-e6fc.up.railway.app/mcp`  
**Branch:** `codex/integrate-hosted-clawd-fable-058e`

Grounded in OpenAI Apps SDK: apps ship as **plugins**, MCP tools + optional
widget, [UX principles](https://developers.openai.com/apps-sdk/concepts/ux-principles),
[app guidelines](https://developers.openai.com/apps-sdk/app-guidelines).

---

## One sentence

Atlas County Scout is a ChatGPT plugin that opens a **map-first voxel county
world**, lets users **inspect places**, **scout a local business**, and
**preview a 7-day plan** — with **one fully playable proof city
(Riverside/Eastvale)** and **honest generated previews for every US county**.

## The only loop that matters

```text
chat intent
  → select_county          (map mounts)
  → ask / lookup / pin / note (session only)
  → preview_scout_drop
  → preview_campaign_engine
  → get_upgrade_options    (informational; no checkout claim)
```

If work does not make this loop faster, clearer, prettier, or more trustworthy,
it is **not North Face**.

## Three honest modes

| Mode | What | Bar |
|------|------|-----|
| **A Signature** | Riverside/Eastvale playable | Beautiful map, mobile 390×844, scout/campaign in-widget |
| **B National preview** | Other US counties | Real Census town names + generated layout; never claim verified streets |
| **C Lookup & plan** | Nearby places + scout/plan | Google lookup normalized; session-only |

Never blur B into A. Never claim all-US public-quality playable coverage.

## Public MCP tools (stable — do not casually add)

1. `select_county`
2. `ask_county_question`
3. `render_voxel_county`
4. `lookup_world_places` (`openWorldHint: true`)
5. `preview_scout_drop`
6. `preview_campaign_engine`
7. `get_upgrade_options` (read-only; no account, no checkout)

## Architecture (mass USA)

```text
US_COUNTY_INDEX + town anchors
  → resolveCountyParameters(seed)
  → deterministic generated district SPEC
  → generateParametricCityWorldScene
  → widget compile/render (prefer SPEC on the wire)
```

Riverside is the curated exception: county pack → voxel → city world.

**Rules**

- Provider lookup never becomes scene geometry.
- Generated districts are non-playable until explicit promotion.
- Ship **parameters/specs**, not giant scenes, in tool results when possible.
- Hosted Clawd / Stripe / saves stay **fenced** off the free public loop
  (`ATLAS_SAVE_SURFACE=off`, no public paid claims).

## Anti-scope (until human reopens)

- New MCP tools
- Public Anaheim/Ontario
- Digital checkout / live Hosted Clawd claims in ChatGPT
- Provider→geometry
- National road-chunk bake as a ship blocker
- Owner-gate ceremony as active track
- Dashboard / SaaS homepage UI

## OpenAI plugin checklist (minimum)

- Complete free product (session-only is a design, not a demo)
- Multi-word directory name (avoid bare “Atlas”)
- Privacy + terms URLs (`/privacy`, `/terms` on Railway)
- Support contact
- Accurate tool annotations + justifications
- No digital-goods monetization in-app
- Real ChatGPT developer-mode proof (web + mobile)

## Ship verification

```bash
pnpm ship:check          # includes live Railway /ready + submission against prod MCP
pnpm ship:check:local    # skip live /ready only; submission still uses prod MCP by default
```

## Railway env for plugin domain verify

```bash
# Paste the token from OpenAI plugin portal when domain verification is requested:
railway variable set ATLAS_OPENAI_APPS_CHALLENGE_TOKEN=<portal-token> -s atlas-backend
```

Then `GET /.well-known/openai-apps-challenge` returns the token body (200).

## Killer demo

> Drop Clawd in Eastvale for a mobile detailing business.

## Production-complete free loop checklist

- [x] 7 MCP tools live on Railway
- [x] Riverside playable + national generatedDraftSpec
- [x] Client compiles generatedDraftSpec in widget (`web/src/App.tsx`)
- [x] Privacy / terms / support routes
- [x] Hosted Clawd fenced while `ATLAS_SAVE_SURFACE=off`
- [x] `pnpm ship:check` suite
- [ ] Set `ATLAS_OPENAI_APPS_CHALLENGE_TOKEN` when submitting plugin
- [ ] Real ChatGPT Developer Mode web + mobile acceptance (human)
- [ ] Deploy this North Face commit to Railway
