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

### Road packs (NEAR band, opt-in by county)

Baked under `data/road-chunks/<slug>/` and served at `/road-catalog` + `/road-chunks/…`:

| County | Notes |
|--------|--------|
| miami-dade-fl | Dogfood metro |
| cook-il | Dogfood metro |
| apache-az, loving-tx, orleans-parish-la, sedgwick-ks, suffolk-ma | Earlier bakes |
| adams-co, benton-ar, linn-ia | Mid-size dogfood |
| maricopa-az | **Not baked** — bake stack overflow; honesty shows unavailable |

Honesty: band-aware banner + `roadStatus` (ready / sparse / loading / unavailable). No fake buildings.

## Next

1. Human ChatGPT dogfood: Miami + Cook — tap town → streets appear; honesty line correct  
2. Optional: fix maricopa bake (stack overflow in `build-county-road-chunks.mjs`)  
3. National road expand is later — do not restart national clay massing
