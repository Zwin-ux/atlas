# USA Accuracy — Control Environment

**Purpose:** iterate map accuracy without ChatGPT Pro. ChatGPT is the *acceptance* host (A4); this is the *control* host (every code change).

## Topology

```
┌─────────────────────────────────────────────────────────┐
│  CONTROL ENV (local, fixed, free, deterministic)         │
│                                                          │
│  pnpm dev  →  http://127.0.0.1:8787                       │
│                                                          │
│  L1  GET /api/atlas/county/<slug>   plate JSON           │
│  L2  POST /mcp  open_atlas_map      tool + focus meta    │
│  L3  GET /preview?county=…           widget (no host)     │
│      GET /emulator?county=…         ChatGPT-like host    │
│                                                          │
│  Gate: pnpm verify:usa-accuracy-control                  │
│  Evidence: artifacts/usa-accuracy/control/               │
└─────────────────────────────────────────────────────────┘
              │ deploy when green
              ▼
┌─────────────────────────────────────────────────────────┐
│  ACCEPTANCE (your ChatGPT Pro plugins)                   │
│  Atlas        → production Railway                       │
│  Atlas Staging→ staging Railway (Commons / notes)        │
│  A4 dogfood script (Rounds 1–3)                          │
└─────────────────────────────────────────────────────────┘
```

## Start control env

```powershell
cd C:\Users\mzwin\Documents\Atlas
pnpm build:web
pnpm build:server
pnpm dev
# listens on http://127.0.0.1:8787
```

## Run the matrix

```powershell
pnpm verify:usa-accuracy-control
# optional screenshots if gstack browse is built:
$env:ATLAS_CONTROL_SCREENSHOTS="1"; pnpm verify:usa-accuracy-control
```

Also still valid:

```powershell
pnpm verify:usa-accuracy-a1
pnpm verify:usa-accuracy-a3
```

## Manual eyes-on (control)

| URL | What you should see |
|-----|---------------------|
| http://127.0.0.1:8787/preview?county=miami-dade-fl | County plate, seat Miami (diamond), water |
| http://127.0.0.1:8787/preview?county=miami-dade-fl&focusLon=-80.4472&focusLat=25.4664&focusName=Homestead | Zoomed toward Homestead, gold focus |
| http://127.0.0.1:8787/preview?county=loving-tx | Sparse frontier, Mentone seat |
| http://127.0.0.1:8787/emulator?county=cook-il | Host mock + `open_atlas_map` seed → Chicago plate |
| http://127.0.0.1:8787/preview?nation=1 | National plate |

## Iterate loop

1. Change code  
2. `pnpm build:web` (and `pnpm build:server` if server/plate tiers)  
3. Restart `pnpm dev` if server changed  
4. `pnpm verify:usa-accuracy-control`  
5. Eyes-on the preview URLs that failed  
6. Only then deploy → ChatGPT Pro re-dogfood  

## What control does *not* prove

- Real ChatGPT sandbox CORS / storage (G8 host findings)  
- Model tool-routing quality (which tool the model picks)  
- Mobile ChatGPT app chrome  

Those stay **A4 on your Pro account** after control is green and code is deployed.
