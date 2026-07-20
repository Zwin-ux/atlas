# Atlas North Face

**Authority:** This file is the product law for ship work. If `NEXT_QUESTS.md`,
slice ladders, or Hosted Clawd / Scout notes conflict, **this wins** until a
human rewrites it.

**Directory name (preferred):** Atlas County Maps  
**MCP URL (prod):** `https://atlas-backend-production-e6fc.up.railway.app/mcp`  
**Branch:** `codex/integrate-hosted-clawd-fable-058e`

Grounded in OpenAI Apps SDK: apps ship as **plugins**, MCP tools + optional
widget, [UX principles](https://developers.openai.com/apps-sdk/concepts/ux-principles),
[app guidelines](https://developers.openai.com/apps-sdk/app-guidelines).

---

## One sentence

Atlas is a ChatGPT plugin that opens a **high-quality voxel county map**, lets
users **pan/zoom, inspect places, and leave session notes**, with **Riverside/
Eastvale as the full interactive proof** and **honest generated maps for every
US county**.

## The only loop that matters (NOW)

```text
chat intent
  → select_county / render_voxel_county   (map mounts)
  → pan / zoom / select place
  → pin + note (session only, in the widget)
  → ask_county_question / lookup_world_places (optional, read-only)
```

If work does not improve **map quality**, **generation quality**, or **notes/
place inspection**, it is **not North Face**.

## Parked until later (do not drive prompts, demos, or ship copy)

- Clawd / Scout Drop / campaign engine product story  
- Hosted Clawd, Stripe, saves, XP, evidence, automation  
- “Drop Clawd in Eastvale for mobile detailing” as the hero demo  

Those tools may remain on the MCP surface for now, but they are **not** the
product pitch, not the QA focus, and not the ChatGPT connect script.

## Three honest modes

| Mode | What | Bar |
|------|------|-----|
| **A Signature** | Riverside/Eastvale playable | Beautiful voxel map, places, pins, notes, mobile 390×844 |
| **B National map** | Other US counties | High-quality generated layout + real Census town names; never claim verified streets |
| **C Lookup** | Nearby places (optional) | Google lookup normalized; not geometry; not saved lists |

Never blur B into A. Never claim all-US public-quality verified streets.

## Public MCP tools

**Primary (ship focus):**

1. `select_county` — open the map  
2. `render_voxel_county` — refresh / refocus the map  
3. `ask_county_question` — closed-world map Q&A  
4. `lookup_world_places` — nearby place lookup only  

**Parked product surface (keep stable, do not expand or market):**

5. `preview_scout_drop`  
6. `preview_campaign_engine`  
7. `get_upgrade_options`  

Do not add new tools casually.

## Architecture (mass USA generation)

```text
US_COUNTY_INDEX + town anchors
  → resolveCountyParameters(seed)
  → deterministic generated district SPEC
  → generateParametricCityWorldScene
  → widget compile/render (prefer SPEC on the wire)
  → session pins / notes in the widget only
```

Riverside is the curated exception: county pack → voxel → city world.

**Quality bar (generation)**

- Deterministic, beautiful first viewport  
- Clone pressure / roof safety / palette distinctness floors green  
- Honest labels: generated ≠ verified streets  
- Notes and pins stay in-chat (session-only)

**Rules**

- Provider lookup never becomes scene geometry.  
- Generated districts are non-playable until explicit promotion.  
- Ship **parameters/specs**, not giant scenes, when possible.  
- Clawd / Hosted Clawd / Stripe stay **later** and fenced.

## Anti-scope (until human reopens)

- Clawd / scout / campaign as the hero loop  
- New MCP tools  
- Public Anaheim/Ontario  
- Digital checkout / live Hosted Clawd claims  
- Provider→geometry  
- National road-chunk bake as a ship blocker  
- Owner-gate ceremony as active track  
- Dashboard / SaaS homepage UI  

## OpenAI plugin checklist (minimum)

- Complete free product: **explore maps + notes** (session-only is intentional)  
- Multi-word directory name (avoid bare “Atlas”)  
- Privacy + terms URLs (`/privacy`, `/terms` on Railway)  
- Support contact  
- Accurate tool annotations  
- No digital-goods monetization in-app  
- Real ChatGPT developer-mode proof (web + mobile)

## Ship verification

```bash
pnpm ship:check          # includes live Railway /ready + submission against prod MCP
pnpm ship:check:local    # skip live /ready only
```

## Railway env for plugin domain verify

```bash
railway variable set ATLAS_OPENAI_APPS_CHALLENGE_TOKEN=<portal-token> -s atlas-backend
```

## Hero prompts (NOW — map first)

> Open Riverside County on Atlas and show me Eastvale.  

> Show me Miami-Dade as a map.  

> Put a note on this place that parking is tight after 5pm.  

**Not the hero (later):** Drop Clawd / scout detailing / 7-day campaign.

## Production checklist

- [x] Map tools live on Railway  
- [x] Riverside playable + national generatedDraftSpec  
- [x] Client compiles generatedDraftSpec  
- [x] Session pins/notes in widget  
- [x] Privacy / terms / support  
- [x] Clawd/saves fenced from free product story  
- [x] `pnpm ship:check` green  
- [x] Deployed North Face to Railway  
- [ ] Generation quality polish (ongoing ship focus)  
- [x] Quiet chrome (no Generate-district hero; pin shelf collapsed; planner copy killed)  
- [x] Real ChatGPT connect proof (human — widget mounts)  
- [ ] Real ChatGPT map+notes acceptance (human notes + multi-county)  
- [ ] Set challenge token when OpenAI asks  
- [ ] Plugin portal submit  

### Connect in ChatGPT (human)

1. Developer mode on  
2. Plugins → add app  
3. MCP: `https://atlas-backend-production-e6fc.up.railway.app/mcp`  
4. Name: **Atlas County Maps**  
5. Prompt: `Open Riverside County and show the Eastvale map.`  
6. Prompt: `Show me Miami-Dade County.`  
7. On the map: select a place, add a pin and a short note.
