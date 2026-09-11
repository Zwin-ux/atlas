# USA Accuracy Program — full-nation, knock-it-out-of-the-park

**Status:** PROGRAM OF RECORD (owner-directed 2026-07-29)  
**Authority:** Same rank as `PRODUCT_LANE.md` / `NATIONAL_SCALE.md` for geography accuracy.  
**North Face still wins** for ship chrome and tool surface; this program **reopens Google Maps Platform enrichment** under explicit rules below.  
**Companion docs:** `NATIONAL_SCALE.md`, `GOOGLE_MAPS_ADAPTER_SPEC.md`, `0.78_REAL_GEOGRAPHY.md`, `PRODUCT_LANE.md`, `NORTH_FACE.md`.

---

## 1. One sentence

**Every U.S. county opens as real land (Census). Zoom and look around with real streets where published (TIGER). Ask what's nearby and see real places (Google). Atlas always renders voxels — never a Google map as the main surface.**

---

## 2. Owner decisions (locked for this program)

| # | Decision | Lock |
|---|----------|------|
| D1 | Google Maps Platform **allowed** for accuracy service | Yes |
| D2 | Atlas **voxel widget** remains the only primary map surface | Yes |
| D3 | Census TIGER remains the **national geometry spine** (boundary, water, towns, roads bake) | Yes |
| D4 | Google places may render as **overlay pins** (distinct glyph, attributed) | Yes |
| D5 | **No** bulk national download of Google roads/places into Atlas packs | Yes (ToS + cost) |
| D6 | Mode B Census board is the **national default** product (promote from flag-dark) | Yes — Phase A |
| D7 | Riverside stays Mode A clay jewel; national clay massing stays parked | Yes |
| D8 | Clawd / scout / billing stay parked for this program's hero path | Yes |

If a later packet conflicts with D1–D8, stop and rewrite the packet — do not silently widen scope.

---

## 3. What “accurate for the entire USA” means

Accuracy is **band- and claim-scoped**. Failing to name the band is how teams invent fake streets.

| Band | User feeling | Truth source | National path |
|------|--------------|--------------|---------------|
| **L0 FAR — County** | “This *is* my county” | Census TIGER boundary + water + town/seat anchors | **Already national** (3,222 geo packs) |
| **L1 NEAR — Streets** | Real street fabric | TIGER road-chunks progressive | Bake → object store/CDN (~25–50 GB); never app image |
| **L2 PLACE — Life** | Real schools, parks, shops | Google Places (New) + Geocoding + Aggregates | Live, viewport-scoped, TTL cache |
| **L3 CLAY — Study** | Beautiful neighborhood model | Generated / curated Riverside only | Explicit study; never default national |

### Product definition of done (USA accuracy)

1. Any of **3,222** supported counties opens in seconds with real silhouette, water, and real Census town anchors.
2. Zoom NEAR a town shows **honest** TIGER streets when published; never fake buildings.
3. “What's around here?” returns **real Google places** as Atlas pins with attribution — not invented POIs.
4. Free-text place/address → correct county board + camera focus (geocode join).
5. Honesty UI always distinguishes **Census · TIGER roads · Google places · Generated**.

### Explicit non-goals

- Photoreal Google Map Tiles / Street View as the ChatGPT primary surface.
- Bulk pre-fetch of Google roads/places for all counties into git or CDN as Atlas geometry.
- “Verified buildings nationwide.”
- National clay massing as default.
- Mapbox (or any new engine) as default renderer.
- Clawd/scout as the hero demo for this program.

---

## 4. Architecture (hybrid spine)

```
ChatGPT widget (Pixi VoxelScene)
        │
        ├─ L0 Mode B scene (boundary, water, Census towns, notes)
        │       ← atlas-backend + baked geo packs (public domain)
        │
        ├─ L1 NEAR roads (catalog + windowed chunks)
        │       ← FS dogfood | S3/origin national  (TIGER bake)
        │
        └─ L2 places-near (viewport focus)
                ← GoogleMapsAdapter (Geocoding, Places New, Aggregates)
                ← Redis/in-memory TTL · place_id durable · attribution
```

**Compile rule:** Google returns **signals** (lon/lat, place_id, category, name). Atlas compiles **Atlas-owned pins/overlays**. Google must not become the world mesh.

**Spatial basis:** L0/L1 remain on `atlas-county-equirect-v1` (see `0.78R_WIRE_CONTRACT.md`). Google points project through the same county basis after geocode/nearby.

### ToS / policy (non-negotiable)

| Rule | Practice |
|------|----------|
| No bulk download | Never bake national Google roads/places offline into packs |
| Request scope | One county / one focus / one radius per enrich call |
| Cache | TTL per Maps service terms; **place_id** may be stored indefinitely |
| Field masks | Minimal Places field masks only |
| Attribution | Visible whenever Google place content is shown |
| Fail open | Google down/quota → board still works; places layer `unavailable` |
| Privacy | No individual-level creepy targeting; no permanent full Google payloads |

Update `packages/geo/src/ProviderUsagePolicy.ts` in packet **B0** to match:

- `mayRenderAsOverlayPins: true` (Google)
- `mayBecomeSceneSpine: false`
- `mayCacheTtl: true` (not forever content)
- `mayUseForReadiness: false` (board readiness is Census-only)

---

## 5. Layer contracts

### L0 — Identity board (Census)

| Item | Contract |
|------|----------|
| Coverage | 3,222 counties |
| Content | Boundary, water, town anchors, notes surface |
| Default | **ON** for non-Riverside after A1 |
| Honesty | “Census geography · streets/buildings not verified as map fabric” |
| Perf | First frame full footprint in viewport; Graphics/rebuild ceilings hold |

### L1 — Structure roads (TIGER)

| Item | Contract |
|------|----------|
| When | NEAR zoom only (~1.48+) |
| Source | Baked road-chunks; progressive coverage |
| Missing pack | `roadStatus=unavailable` — quiet, no fake grid |
| Scale | Windowed fetch (≤48 chunks); public origin preferred |
| Bake order | `data/road-chunks/_priority-metros.json` |

### L2 — Live places (Google)

| Item | Contract |
|------|----------|
| When | NEAR focus, lookup tool, or explicit “what's nearby” |
| Cap | ≤40 pins per enrich response (default 24) |
| Wire | New or extended API — see B2 (prefer extend `lookup` + widget enrich) |
| Glyph | Distinct from Census town anchors (never confusable) |
| Card | Name, Atlas category, source note, Google attribution |
| Persist | `place_id` + normalized category only for durable keys; refresh details on TTL |

### L3 — Clay study

| Item | Contract |
|------|----------|
| Default | Off |
| Riverside | Mode A curated jewel |
| Elsewhere | `includeGeneratedDraft=true` only; labeled generated preview |
| Google role | Optional density *bias* for study grammar — never claim verified buildings |

---

## 6. Hero user journeys (acceptance stories)

### J1 — Open any county

```
User: "Open Miami-Dade County"
→ select_county → L0 board mounts (silhouette, bay, towns)
→ honesty strip correct
→ pan/zoom works; notes on town anchors
```

### J2 — Real streets where published

```
User zooms NEAR Homestead (or Chicago loop)
→ if road pack live: TIGER streets appear
→ if not: roadStatus unavailable, board still good
→ never invent buildings
```

### J3 — Real places (Google)

```
User: "What's near Homestead?"
→ geocode/focus + Places nearby
→ Atlas pins for real POIs with attribution
→ tap pin → card; optional session note
```

### J4 — Free-text fly-to

```
User: "Show me Key West" / "1600 Pennsylvania Avenue"
→ Geocode → county resolve → board + camera
→ optional nearby enrich at focus
```

### J5 — Sparse America still works

```
User: "Open Loving County Texas"
→ real empty frontier board, real (few) towns
→ no fake downtown; Google places sparse is honest
```

---

## 7. Phases and packets

**Rule:** Every packet names phase + packet id, kill criteria, and which journey (J1–J5) it moves. No packet without a falsifiable done check.

### Phase A — USA board truth (Census default)

**Goal:** Every American sees their real county first frame.  
**Depends on:** Existing 3,222 geo packs + town anchors.  
**Google:** not required.

| Packet | Work | Done check | Kill / stop |
|--------|------|------------|-------------|
| **A1** National plate open + place focus | Plate-era default: every county is a Census plate; `open_atlas_map` focus flies the camera to the resolved town | `pnpm verify:usa-accuracy-a1` green; widget consumes `_meta.atlasPlate.focus` | Revert if nation plate missing or focus lands outside county |
| **A2** Seat + town hierarchy | `classifyTownAnchors` → seat/primary/secondary on plate anchors; seat diamond + zoom-gated secondary labels | Seat leads wire list; visual tiers in widget; unit tests | Stop if labels crush map |
| **A3** 50-county challenge gate | `pnpm verify:usa-accuracy-a3` over §8 list (real Atlas slugs) | 50/50 + seat tier contract in `artifacts/usa-accuracy/challenge-50/` | Any open fail or missing seat fails program |
| **A4** Real-host G8 open | ChatGPT web: open 8 counties from challenge set | `docs/G8_REAL_CHATGPT_FINDINGS.md` entries dated | Emulator-only claims do not count |

**Phase A exit:** J1 + J5 green nationally; default board is Census.

---

### Phase B — Google as national place service

**Goal:** Live place accuracy anywhere in the USA by demand.  
**Depends on:** A1 (board must exist first).  
**Human gate:** `GOOGLE_MAPS_API_KEY`, billing budget, attribution legal OK.

| Packet | Work | Done check | Kill / stop |
|--------|------|------------|-------------|
| **B0** Policy + adapter law | Update `ProviderUsagePolicy`, `GOOGLE_MAPS_ADAPTER_SPEC.md`; ToS notes | Unit tests for policy flags | Do not ship pins before B0 |
| **B1** Prod adapter | `GEO_DATA_ADAPTER=google` path green in prod with key; mock remains CI default | `/api/world/lookup` live Google path smoke | Cap monthly spend; alert |
| **B2** Enrichment plane | `GET /api/world/places-near?county=&lat=&lng=&radiusMeters=` → normalized places + attribution + cache block | Contract tests; field-mask enforced | Max radius 5000m; max 40 results |
| **B3** Widget pin layer | Google pins layer on Mode B; distinct glyphs; declutter vs Census towns | Emulator: Miami NEAR shows ≥15 pins when Google on | Fail if pins look like Census towns |
| **B4** Tool parity | `lookup_world_places` returns same normalization; optional auto-enrich at NEAR | MCP smoke + widget parity | No new MCP tool unless B2 REST insufficient for ChatGPT |
| **B5** Budgets + cache | Per-session enrich cap; Redis/memory TTL; rate ledger reuse | Cache hit on repeat NEAR; no unbounded loops | Kill if cost > owner budget |
| **B6** Attribution chrome | Required Google attribution whenever L2 visible | Audit check 100% when pins on | Legal block = hide layer |

**Phase B exit:** J3 green on challenge metros; J1 still works with Google off.

---

### Phase C — National road accuracy (TIGER progressive)

**Goal:** Streets for metros first, then nation — public domain spine.  
**Depends on:** `NATIONAL_SCALE.md` infra (bucket exists).  
**Does not block** A or B.

| Packet | Work | Done check | Kill / stop |
|--------|------|------------|-------------|
| **C1** ChatGPT dogfood | Miami + Cook streets + honesty in real host | G8 notes | — |
| **C2** Wave-1 metros origin | Bake `_priority-metros.json` wave-1 → origin only (not git) | Coverage count ↑; catalog 200 from origin | Never commit multi-GB packs |
| **C3** Window discipline | NEAR only windowed chunks; no full-county prefetch | Perf gates hold on Maricopa-class | — |
| **C4** Wave-2+ farm | Remaining counties progressive | `_coverage.json` growth | Sparse = unavailable OK |
| **C5** Optional Roads API | Session-only Google Roads snap for demo gaps | Off by default; ToS review | Never national bake of Google roads |

**Phase C exit:** Top metros J2 green; rest of USA honest without streets.

---

### Phase D — Geocode-first open anywhere

**Goal:** Natural language / address → correct county + camera.  
**Depends on:** B1 (Google geocode) + L0 board.

| Packet | Work | Done check | Kill / stop |
|--------|------|------------|-------------|
| **D1** Geocode → FIPS/slug | Join lon/lat to county GEOID; resolve slug | Key West, DC, PR edge cases | Ambiguous → disambiguate, don't guess wrong state |
| **D2** Free-text select | `select_county` / open path accepts query string | MCP + REST | — |
| **D3** Fly-to camera | Focus geocoded point; optional L2 enrich | J4 acceptance | — |

**Phase D exit:** J4 green for address + place-name corpus (see §9).

---

### Phase E — Knockout quality (parallel)

| Packet | Work | Depends |
|--------|------|---------|
| **E1** Geo-board graphics | Grade/lighting, water material, road recede on L0 | A1 |
| **E2** Tiered labels | Seat / town / minor; Google labels only at NEAR | A2, B3 |
| **E3** Provenance system | Quiet layer legend: Census · Roads · Google · Generated | A1, B3 |
| **E4** Regional truth | Density/coast/climate public facts (0.77); Google aggregates soft-bias study only | A1 |
| **E5** Cost dashboard | Daily Google spend, cache hit %, p95 enrich latency | B5 |

---

## 8. Fifty-county challenge set

Falsifiable visual + open gate for Phase A/B. Prefer real slugs used by Atlas (`kebab` + state).

### Group 1 — Mega metros (10)

| # | Slug | Why |
|---|------|-----|
| 1 | `los-angeles-ca` | Mega basin, complex water edge |
| 2 | `cook-il` | Great Lakes + dense grid |
| 3 | `harris-tx` | Sprawl metro |
| 4 | `maricopa-az` | Large desert metro (bake stress) |
| 5 | `king-wa` | Puget Sound islands/water |
| 6 | `miami-dade-fl` | Tropical peninsula + bay |
| 7 | `new-york-ny` | Island/borough density |
| 8 | `philadelphia-pa` | East Coast river city |
| 9 | `fulton-ga` | Southeast metro core |
| 10 | `denver-co` | Front Range / elevation story |

### Group 2 — Coastal / island / water-dominant (10)

| # | Slug | Why |
|---|------|-----|
| 11 | `san-francisco-ca` | Water-dominant legal polygon |
| 12 | `honolulu-hi` | Island + tropical |
| 13 | `kalawao-hi` | Tiny coastal extreme |
| 14 | `orleans-parish-la` | Parish + river/lake |
| 15 | `suffolk-ma` | Compact NE coastal |
| 16 | `monroe-fl` | Keys / island chain |
| 17 | `charleston-sc` | Lowcountry coast |
| 18 | `mobile-al` | Gulf bay |
| 19 | `san-juan-pr` | Territory / municipio naming |
| 20 | `district-of-columbia-dc` | Single-district capital |

### Group 3 — Mountain / rural / frontier (10)

| # | Slug | Why |
|---|------|-----|
| 21 | `loving-tx` | Emptiest-class frontier |
| 22 | `summit-co` | High Rockies relief |
| 23 | `teton-wy` | Mountain icon |
| 24 | `apache-az` | Large rural Southwest |
| 25 | `coconino-az` | Grand Canyon scale |
| 26 | `inyo-ca` | Desert + Owens valley |
| 27 | `north-slope-borough-ak` | Alaska borough extreme |
| 28 | `yukon-koyukuk-census-area-ak` | Huge sparse AK |
| 29 | `essex-ny` | Adirondack rural |
| 30 | `garfield-ut` | Canyon country |

### Group 4 — Heartland / mid-size (10)

| # | Slug | Why |
|---|------|-----|
| 31 | `sedgwick-ks` | Plains metro (Wichita) |
| 32 | `linn-ia` | Midwest mid-size |
| 33 | `benton-ar` | Growing mid-south |
| 34 | `adams-co` | Front Range suburban |
| 35 | `davidson-tn` | Nashville |
| 36 | `travis-tx` | Austin |
| 37 | `multnomah-or` | Portland |
| 38 | `hennepin-mn` | Twin Cities |
| 39 | `mecklenburg-nc` | Charlotte |
| 40 | `milwaukee-wi` | Great Lakes mid |

### Group 5 — Edge cases / identity stress (10)

| # | Slug | Why |
|---|------|-----|
| 41 | `riverside-ca` | Mode A clay must not regress |
| 42 | `orange-ca` | Adjacent SoCal dense |
| 43 | `broward-fl` | Twin to Miami-Dade |
| 44 | `queens-ny` | Borough complexity |
| 45 | `kings-ny` | Brooklyn density |
| 46 | `santa-clara-ca` | Bay Area tech sprawl |
| 47 | `clark-nv` | Desert + Las Vegas strip density |
| 48 | `fairbanks-north-star-borough-ak` | Interior AK |
| 49 | `maui-hi` | Island multi-town |
| 50 | `st-louis-city-mo` / `st-louis-mo` | Independent city naming (resolve actual Atlas slug in A3) |

**A3 harness:** write results to `artifacts/usa-accuracy/challenge-50/REPORT.md` with pass/fail per slug for:

1. Open succeeds  
2. Full footprint in first frame  
3. Water present when pack has water  
4. ≥1 Census town anchor  
5. Honesty banner correct  
6. (Phase B+) Google pins only when enrich on; attribution visible  

Slug mismatches (PR municipios, independent cities, AK boroughs) are fixed in A3 — do not skip; resolve to the repo's real slug and document aliases.

---

## 9. Free-text fly-to corpus (Phase D)

Minimum acceptance strings (must land correct county + sensible camera):

| Query | Expected land |
|-------|----------------|
| `Key West` | Monroe FL |
| `1600 Pennsylvania Avenue` | District of Columbia |
| `Homestead Florida` | Miami-Dade |
| `Wrigley Field` | Cook IL |
| `Death Valley` | Inyo CA (or correct adjacent) |
| `Honolulu` | Honolulu HI |
| `Eastvale CA` | Riverside CA (clay) |
| `Times Square` | New York NY |
| `Austin TX` | Travis TX |
| `San Juan Puerto Rico` | San Juan PR |

---

## 10. Metrics

| Metric | Target |
|--------|--------|
| County open success (3,222) | ≥99.5% |
| Challenge-50 first frame footprint | 50/50 |
| Time to interactive board (prod p95) | &lt; 3s |
| NEAR Google pins (metros, Google on) | ≥15 in sample town focus |
| False “verified building/street” claims | 0 audit fails |
| Google attribution when L2 on | 100% |
| Repeat NEAR cache hit | ≥40% after warm |
| Google monthly cost | Owner budget + hard alert |

Evidence roots:

- `artifacts/usa-accuracy/` — challenge + enrich audits  
- `docs/G8_REAL_CHATGPT_FINDINGS.md` — real host  
- `data/road-chunks/_coverage.json` — road progressive truth  

---

## 11. Sequencing (30-day default)

```
Week 1:     A1 A2 A3 start
Week 2:     A3 complete · A4 · B0 B1
Week 3:     B2 B3 B4 · C1
Week 4:     B5 B6 · D1–D3 · C2 wave-1 start
Parallel:   E1 E2 on geo boards whenever A1 is green
```

**Do not** start B pins before A default board.  
**Do not** wait for full national roads before shipping Google places.  
**Do not** expand MCP tool count unless ChatGPT cannot drive B2 via existing tools + REST meta.

---

## 12. Critical files

| Area | Paths |
|------|--------|
| Geo packs / L0 | `data/geo-packs/`, `packages/core/.../cityWorldCountyGeoScene.ts` |
| Wire / select | `server/src/index.ts` (`select_county`, `_meta.countyGeoPack`) |
| Widget | `web/src/App.tsx`, city world renderer |
| Roads | `data/road-chunks/`, `docs/NATIONAL_SCALE.md`, road store + `/map-config` |
| Google | `packages/geo/src/GoogleMapsAdapter.ts`, `ProviderUsagePolicy.ts`, `SignalExtractor.ts` |
| Lookup | `/api/world/lookup`, MCP `lookup_world_places` |
| Product law | `docs/NORTH_FACE.md`, `docs/PRODUCT_LANE.md` |

---

## 13. Stop signs (crazy)

- National clay massing as main work  
- Google Map Tiles as primary ChatGPT map  
- Bulk Google geometry bake  
- Multi-GB road packs in git  
- Fake buildings when streets appear  
- Provider data as county **readiness** proof  
- Clawd/scout hero hijacking this program  
- New MCP tools without a failed attempt to use the seven-tool surface  

---

## 14. Relation to prior quests

| Prior quest | Status under this program |
|-------------|---------------------------|
| `national-roads-origin-live` | Becomes **Phase C** (continues; not the only accuracy work) |
| `0.78-1V` flag-dark board | **A1 promotes** to default |
| `0.78-2A` town anchors | Prerequisite for A2; already national |
| Hosted Clawd / Personal Atlas | Later; not required for L0–L2 accuracy hero |
| Commons public notes | Staging exception only; out of this program's critical path |

**Current program quest name:** `usa-accuracy-l0-l2`

**First packet:** **A1 — National plate open + place focus** (implemented 2026-07-29)

### Product form note (2026-07-29)

Atlas shipped a plate-era widget (SVG nation/state/county plates via
`open_atlas_map` / `search_atlas_places`). L0 accuracy is the **Census plate**,
not the older voxel `?atlasGeoBoard=1` flag path. A1 is implemented against
plates; later packets still use the hybrid L1 TIGER / L2 Google plan where it
does not fight the plate product.

---

## 15. Changelog

| Date | Note |
|------|------|
| 2026-07-29 | Program created from Keyhole/Google Earth accuracy framing + owner go-ahead for Google Maps Platform service enrichment. |
| 2026-07-29 | **A1 done (plate era):** focus fly-to wired; `verify:usa-accuracy-a1` gate; challenge county plate open. |
| 2026-07-29 | **A2 done:** seat/primary/secondary town hierarchy + plate styling. **A3 done:** 50/50 challenge green (`verify:usa-accuracy-a3`). |
