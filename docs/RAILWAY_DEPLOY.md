# Railway Deploy

Atlas uses Railway as the backend host for the Apps SDK MCP server.

Current production backend:

```txt
https://atlas-backend-production-e6fc.up.railway.app
```

## Required variables

Set these on the Railway service:

```txt
MCP_PATH=/mcp
GEO_DATA_ADAPTER=google
GOOGLE_MAPS_API_KEY=<secret>
GOOGLE_MAPS_REGION=us
GOOGLE_MAPS_LANGUAGE=en
WIDGET_DOMAIN=https://<railway-domain>
```

Railway provides `PORT`; do not hard-code it.

## Secret handling

Do not paste the Google Maps key into chat or commit it to the repo. Use Railway variables.

PowerShell local test path:

```powershell
$key = Get-Clipboard -Raw
@"
GEO_DATA_ADAPTER=google
GOOGLE_MAPS_API_KEY=$key
GOOGLE_MAPS_REGION=us
GOOGLE_MAPS_LANGUAGE=en
"@ | Set-Content -LiteralPath .env.local -NoNewline
```

Railway stdin path:

```powershell
Get-Clipboard -Raw | railway variable set GOOGLE_MAPS_API_KEY --stdin
railway variable set GEO_DATA_ADAPTER=google GOOGLE_MAPS_REGION=us GOOGLE_MAPS_LANGUAGE=en MCP_PATH=/mcp
```

## Probes

After deploy:

```txt
GET /health
GET /api/geo/status
GET /api/geo/geocode?query=Eastvale%2C%20CA
```

`/api/geo/status` should show `mode: "google"` and `liveApiCallsEnabled: true`.
