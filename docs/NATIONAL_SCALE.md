# National scale (millions of Americans)

**Authority:** Same rank as `PRODUCT_LANE.md` for infrastructure.  
**User truth:** Every U.S. county must open. Streets are progressive enhancement — never block the board on roads.

## What “millions” means here

| Layer | Product reality | Infra reality |
|-------|-----------------|---------------|
| **Mode B board** | National **today** (3,222 Census geo packs) | ~83 MB in app image — OK |
| **Towns / notes** | National **today** (18,447 anchors) | Small index files — OK |
| **NEAR roads** | Progressive (metros first → all counties) | **~25–50 GB** national — **never** in the app image |
| **Clay (Mode A)** | Riverside jewel only | Stay small |

A person in rural Wyoming and a person in Chicago both get a **real county board** on first open. Streets appear when that county is baked and they zoom in. Honesty never fakes buildings.

## Hard numbers (from current dogfood bakes)

- ~10 baked counties ≈ **~90 MB** identity JSON (+ precompressed siblings on disk)
- Average ≈ **8–9 MB / county** (identity tree; multiplies with `.br`/`.gz`)
- Full nation @ same density ≈ **~27–50 GB**
- Top **100 metros** ≈ **~2–3 GB** — first national road target
- App deploy image today with dogfood roads ≈ hundreds of MB — **cannot** grow with 3,222 road packs

## Traffic shape

Roads only load at **NEAR** (zoom past ~1.48). Most sessions stay FAR/MID → board only.

| Concurrent NEAR pans | Catalog RPS (order) | Chunk RPS (order) |
|----------------------|---------------------|-------------------|
| 100 | ~5 | ~200 |
| 1,000 | ~50 | ~2,000 |
| 10,000 | ~500 | ~20,000 |

**Node must not be the bit-pipe** for immutable chunk bytes. Catalog (mutable pointer) can stay on the API; **manifest + chunks** go to object storage + CDN (or public bucket URL).

Wire contract already requires this: `RoadChunkStore` is CDN-swappable (`docs/0.78R_WIRE_CONTRACT.md` §3.4).

## Architecture (target)

```
ChatGPT widget / browser
        │
        ├─ MCP + Mode B scene (boundary, water, towns, notes) ──► atlas-backend
        │                                                         (Railway)
        ├─ GET /road-catalog/<slug>/current  (mutable, no-cache) ──► backend store
        │
        └─ GET manifest + chunks (immutable, long-cache) ──► public origin
                                                              S3 / R2 / Railway bucket
                                                              (+ CDN if available)
```

### Stores (config-selected)

| Env | Meaning |
|-----|---------|
| *(unset)* | Filesystem only — `data/road-chunks` (local + dogfood deploys) |
| `ATLAS_ROAD_CHUNKS_ORIGIN` | HTTP origin root with **filesystem layout** (`/<slug>/catalog.json`, …). Backend store falls back: **FS first, then origin**. |
| `ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN` | Same layout, **advertised to the client** so browsers fetch immutable bytes **directly** (skips Node egress). |

Both origins use the on-disk layout under `data/road-chunks/<slug>/` — no rewrite of routes.

### Progressive bake (product order)

1. **Dogfood metros** — Miami-Dade, Cook, … (done)  
2. **Priority metros** — `data/road-chunks/_priority-metros.json` (top population / demand)  
3. **All remaining counties** — offline bake farm → upload to origin  
4. **Maricopa-class failures** — fix bake; until then honesty = unavailable  

Never block Mode B on (2)–(4).

### Client rules at scale

1. Board always works from geo pack alone.  
2. Catalog 404 → `roadStatus=unavailable` only after NEAR intent (quiet at FAR).  
3. Prefer public origin for immutable assets when advertised.  
4. **Future P0:** fetch only **window** chunks, not entire county (today dogfood prefetches full NEAR set — fine for small packs, not for national pan).  

### App image rules

| In deploy image | Out of deploy image |
|-----------------|---------------------|
| Geo packs (3,222) | Full national road trees |
| Town anchors | Bulk road `.br`/`.gz` history |
| Tiny dogfood road sample (optional) | Old packHash epochs (GC on origin) |
| `_coverage.json` | Multi-GB bake intermediates |

## Ops checklist

1. Create object bucket (Railway bucket / R2 / S3).  
   - **Done (prod):** Railway bucket `atlas-road-chunks` (iad), project `atlas-chatgpt-app`.  
2. Install AWS CLI v2; sync with bucket credentials:  
   `railway bucket credentials -b atlas-road-chunks`  
   `ATLAS_ROAD_SYNC_URI=s3://<bucketName> AWS_ENDPOINT_URL=https://t3.storageapi.dev node scripts/sync-road-chunks-to-origin.mjs`  
3. Make object tree **public-read** (or put a CDN in front) so browsers can GET immutable chunks.  
4. Set on atlas-backend:  
   - `ATLAS_ROAD_CHUNKS_ORIGIN` = server-reachable base URL for the tree  
   - `ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN` = same base if CORS-open for the widget  
5. Confirm `GET /map-config` shows `coverageCount` + origins.  
6. Confirm Miami + an **origin-only** slug catalogs 200.  
7. Wave-1 priority metros → bake offline → sync origin only (not git).

## What we will not do for scale

- National clay massing as the default map  
- Mapbox as the product default  
- Fake buildings when roads appear  
- Stuffing all 3,222 road packs into git / Railway image  
- Letting a single Node process stream every NEAR pan for the nation  

## Success definition

A user in any supported county:

1. Opens a **real** board in seconds (outline, water, towns, notes).  
2. Zooms to a town; if roads are published, streets appear with honest TIGER copy.  
3. If roads are not published yet, the board stays useful — no crash, no fake city.
