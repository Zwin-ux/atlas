# Atlas product lane (Geo + Clay)

**Authority:** Same rank as `NORTH_FACE.md` for scope control.  
**North star:** *Riverside is the clay jewel. Every other county is a real Census board with notes. Everything else is parked.*

## Modes

| Mode | Default? | Surface |
|------|----------|---------|
| A Clay | Riverside only | Playable Eastvale |
| B Census board | **Yes, national** | Boundary + water + towns + notes |
| B′ Study | Never default | `includeGeneratedDraft=true` only |
| C Lookup | Tool only | Nearby places, no geometry |

## Must-pass (R1–R8)

See session plan / dogfood: Riverside clay; national board; honesty; notes on towns; Q&A stays on board; quiet chrome; ship-check; 3222 packs.

## Stop signs (crazy)

- National clay massing as main work  
- Clawd/scout hero  
- Mapbox / new engines  
- New MCP tools without product need  
- “Make every county Eastvale”  

## Scale ladder (Mode B)

1. **Fit county** — full outline (center control) ✅  
2. **Tap town** — camera focuses real Census place (zoom 1.62 → NEAR band) ✅  
3. **More towns** — up to **12** Census places/county (18,447 national) ✅  
4. **Zoom-aware labels** — more names when zoomed in ✅  
5. **Roads at near zoom** — TIGER road-chunks for dogfood set ✅  
6. **National scale path** — boards nationwide; roads progressive + origin/CDN ✅ law  

### Road packs (NEAR band, progressive)

**Millions-scale law:** `docs/NATIONAL_SCALE.md`. Mode B works for all 3,222 counties without roads. Streets are progressive enhancement (~25–50 GB national — **not** in the app image).

| Layer | Where |
|-------|--------|
| Dogfood packs | `data/road-chunks/<slug>/` in deploy (small set) |
| National packs | Object store / CDN via `ATLAS_ROAD_CHUNKS_ORIGIN` + optional `ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN` |
| Coverage index | `data/road-chunks/_coverage.json` → `GET /road-coverage`, `GET /map-config` |
| Bake order | `data/road-chunks/_priority-metros.json` |

| County | Notes |
|--------|--------|
| miami-dade-fl, cook-il | Dogfood metros |
| apache-az, loving-tx, orleans-parish-la, sedgwick-ks, suffolk-ma | Earlier bakes |
| adams-co, benton-ar, linn-ia | Mid-size dogfood |
| maricopa-az | Bake fixed; 4,145 chunks round-tripped with no ceiling violations |

Honesty: band-aware banner + `roadStatus` (ready / sparse / loading / unavailable). No fake buildings.

## Next (quest: `national-roads-origin-live`)

Full plan: session plan + `docs/NATIONAL_SCALE.md`. Agent law: `AGENTS.md` § National scale.

1. **Phase 0** — AGENTS / BUILD_LOG / NEXT_QUESTS lock ✅
2. **Phase 1–2** — Dogfood packs synced to private S3; signed server fallback live ✅
3. **Phase 3** — Windowed NEAR fetch, capped at 48 chunks ✅
4. **Phase 4** — Maricopa large-county bake stability ✅
5. Human ChatGPT dogfood R1–R8
6. Wave-1 metros → origin only (not multi-GB Git)
7. Optional public CDN; never restart national clay massing
