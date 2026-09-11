# USA Accuracy — Control Environment

Generated: 2026-07-30T05:39:55.237Z
Base: http://127.0.0.1:8787
Blockers: none

## How to run

```powershell
# Terminal A — control server
pnpm build:web
pnpm build:server
pnpm dev

# Terminal B — matrix
pnpm verify:usa-accuracy-control
```

## Layers

| Layer | What |
|-------|------|
| L0 | `/ready` control server |
| L1 | `/api/atlas/county/*` plate compose + seat tier |
| L2 | MCP `open_atlas_map` resolve + focus meta |
| L3 | `/preview` + `/emulator` shells |

L1 rows: 10
L2 rows: 6
L3 rows: 5

## ChatGPT Pro mapping

| Control | Your Pro plugin |
|---------|-----------------|
| L1+L2 local | Atlas (prod) tool+plate |
| L3 /emulator | Closest host fidelity without ChatGPT |
| Staging plugin | Atlas Staging only for Commons |

Deploy A1–A3 before expecting focus fly-to / seat diamonds in ChatGPT.
