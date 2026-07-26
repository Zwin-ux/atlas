# Deploying Atlas

Atlas deploys as a container built and verified locally, then promoted by
digest. The image is the identity: you verify a digest here, push that digest,
and deploy that digest. Nothing about what is running is inferred.

This replaces the previous path, where source was uploaded to a remote builder
and a set of guardrail scripts existed to compensate for not knowing exactly
what came out the other side.

## Build and verify locally

```bash
docker build -t atlas:local .

docker network create atlas-net
docker run -d --name atlas-redis --network atlas-net redis:7-alpine

docker run -d --name atlas --network atlas-net -p 8899:8787 \
  -e PORT=8787 \
  -e ATLAS_REDIS_URL=redis://atlas-redis:6379 \
  -e ATLAS_SCENE_PACKET_CACHE_BACKEND=redis \
  -e APP_BASE_URL=http://127.0.0.1:8899 \
  atlas:local
```

Then confirm the container is `healthy` and every route answers:

```bash
docker ps --filter name=atlas --format '{{.Status}}'   # expect: Up ... (healthy)

for p in /health /ready /preview /privacy /terms /support /community \
         /api/atlas/nation /api/atlas/state/ca /api/atlas/county/riverside-ca \
         /widget/component.js /widget/component.css; do
  printf "%-34s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8899$p)"
done
```

All twelve must return 200. Then scan the MCP surface — it must be exactly
`open_atlas_map, search_atlas_places`, matching
`scripts/lib/atlas-tool-surface.mjs`.

## Required environment

Two of these are not optional, and the container will not serve without them.
Both were found by running the image rather than by reading the code.

| Variable | Required | Why |
|---|---|---|
| `ATLAS_REDIS_URL` | **yes in production** | The scene-packet config validator refuses to boot without it. The process exits 1 at startup, not later. |
| `ATLAS_SCENE_PACKET_CACHE_BACKEND` | **yes in production** | Must be `redis`. Same validator. |
| `APP_BASE_URL` | **yes in production** | Sets the host/origin allowlist. Without it every route except `/health` and `/ready` returns 403 — the container looks healthy while serving nothing. `RAILWAY_PUBLIC_DOMAIN` also feeds the allowlist. |
| `PORT` | no | Defaults to 8787. |
| `GEO_DATA_ADAPTER` | no | `mock` avoids provider calls. |
| `ATLAS_OPENAI_APPS_CHALLENGE_TOKEN` | at submission | Served verbatim at `/.well-known/openai-apps-challenge` for portal domain verification. |

The 403 case is the one to watch: the healthcheck polls `/ready`, which is
allowlist-exempt, so a misconfigured `APP_BASE_URL` produces a container that
reports healthy and serves 403 to every real request.

## What the image contains

Multi-stage. The runtime layer carries production dependencies, `server/dist`,
`web/dist`, the prebuilt atlas plates, and `data/`. It has no pnpm, no
compiler, and no source. It runs as the unprivileged `node` user.

Atlas plates are generated during the build from `data/geo-packs`, so the image
cannot ship an atlas that was never generated.

Base image is pinned by digest, not tag.

## Promotion

1. Build locally and run the verify battery above.
2. Record the digest: `docker inspect atlas:local --format '{{index .RepoDigests 0}}'`
3. Push to the registry.
4. Deploy **that digest** to staging; re-run the battery against the staging URL.
5. Promote the **same digest** to production. Human gate stays on this step.

Rollback is redeploying the previous digest.
