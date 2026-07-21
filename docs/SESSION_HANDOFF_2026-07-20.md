# Session handoff — 2026-07-20 (going home)

**Branch:** `codex/integrate-hosted-clawd-fable-058e`  
**Latest commits:** `097a7b0f` (docs), `8680ded1` (scale S3 + windowed NEAR)  
**Prod:** https://atlas-backend-production-e6fc.up.railway.app  
**Quest:** `national-roads-origin-live` (see `AGENTS.md` § National scale)

## What shipped this session

1. **Mode B scale ladder** — fit county, zoom-to-town (1.62), 12 Census towns, honesty copy.
2. **Dogfood TIGER roads** — 10 counties under `data/road-chunks/` (Miami, Cook, …).
3. **National scale foundation**
   - Railway bucket `atlas-road-chunks` / `atlas-road-chunks-ol0rl4v` (iad) — **synced**.
   - S3-signed store: `ATLAS_ROAD_CHUNKS_S3_*` on atlas-backend.
   - Prod `/ready`: `s3BucketConfigured: true`, `originConfigured: true`.
   - Windowed NEAR: max **48** chunks (`selectNearChunkWindow`).
   - `/map-config`, `/road-coverage`, `_coverage.json`, `_priority-metros.json`.
4. **Agent law** — `AGENTS.md`, `docs/NATIONAL_SCALE.md`, `NEXT_QUESTS.md`, BUILD_LOG 227.

## Prod posture (do not re-prove)

```text
GET /ready     → ok, s3BucketConfigured true
GET /map-config → coverageCount 10, publicOrigin null (bucket private)
GET /road-catalog/miami-dade-fl/current → 200
GET /road-catalog/cook-il/current → 200
```

## Next when back (order)

1. ChatGPT dogfood: Miami + Cook streets + honesty.
2. Wave-1 metro bakes → **S3 only** (LA, Harris, Dallas, …) — not multi-GB git.
3. Optional public CDN + `ATLAS_ROAD_CHUNKS_PUBLIC_ORIGIN` (browser skip Node).
4. Town-centered window (not only cell median).

## Windows continuation

- `pnpm ship:check:local` now runs cross-platform and passes 8/8 gates.
- Maricopa's stack overflow was the bulk spread at the layer accumulator, not
  quadtree recursion. Bounded iteration fixed it.
- A fresh Maricopa bake fetched 155,251 parts and round-tripped 4,145 chunks
  with no compression ceiling violations.
- Real ChatGPT Miami/Cook dogfood is still pending; headless ChatGPT hit
  Cloudflare verification and installed-Chrome cookie import failed DPAPI
  decryption on this machine.

## Stop signs

National clay massing, Mapbox default, fake buildings, Clawd hero, multi-GB roads in git.

## Key env (Railway atlas-backend)

- `ATLAS_ROAD_CHUNKS_S3_BUCKET`
- `ATLAS_ROAD_CHUNKS_S3_ENDPOINT` (= https://t3.storageapi.dev)
- `ATLAS_ROAD_CHUNKS_S3_ACCESS_KEY_ID` / `…_SECRET_ACCESS_KEY`
- `ATLAS_ROAD_CHUNKS_S3_REGION=auto`

## Commands

```bash
# Sync local road packs → bucket
aws s3 sync data/road-chunks/ s3://$BUCKET/ --endpoint-url https://t3.storageapi.dev

# Bake one county
node scripts/build-county-road-chunks.mjs --county miami-dade-fl --band near
node scripts/build-road-coverage.mjs

# Ship gate
pnpm ship:check:local
railway up -d -y -s atlas-backend
```
