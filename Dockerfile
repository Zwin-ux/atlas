# Atlas — reproducible container build.
#
# Why this exists: the previous deploy path uploaded source to a remote builder
# and could not tell you afterwards exactly what was running. A week of
# guardrail scripts was written to compensate for that uncertainty. Building the
# image here makes the artefact itself the identity — you verify a digest
# locally, push that digest, and deploy that digest. Nothing is inferred.
#
# Multi-stage on purpose: the runtime image carries no pnpm, no compiler, and no
# source, so the attack surface is the app and its production dependencies.

# ---- Stage 1: build ---------------------------------------------------------
# Pinned to a digest rather than a tag. `node:22-bookworm-slim` is a moving
# target; a digest is not, which is the whole point of this file.
FROM node:22-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3 AS build

WORKDIR /app

# Corepack ships with Node and installs the exact pnpm the repo pins, so the
# lockfile is resolved by the same version that wrote it.
RUN corepack enable

# Manifests first: this layer only busts when dependencies change, so day-to-day
# code edits reuse the cached install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/geo/package.json packages/geo/
COPY packages/config/package.json packages/config/
COPY packages/assets/package.json packages/assets/
COPY packages/mcp/package.json packages/mcp/
COPY apps/web/package.json apps/web/
COPY apps/widget/package.json apps/widget/

# --frozen-lockfile fails rather than silently resolving something new. A build
# that quietly drifts from the lockfile is exactly the uncertainty this file
# exists to remove.
RUN pnpm install --frozen-lockfile

COPY . .

# Builds the widget bundle, the server, and the atlas plates. The plates are
# generated from data/geo-packs at build time rather than committed, so the
# image cannot ship an atlas that was never generated.
RUN pnpm build:starter

# Drop dev dependencies before they are copied forward. CI=true is required:
# without a TTY pnpm refuses to purge the modules directory and aborts.
RUN CI=true pnpm prune --prod

# ---- Stage 2: runtime -------------------------------------------------------
FROM node:22-bookworm-slim@sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3 AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Run unprivileged. The node image already provides this uid.
USER node

# Only what the server reads at runtime:
#   node_modules  production dependencies
#   server/dist   the MCP server and the scene-packet worker
#   web/dist      the widget bundle and its stylesheet
#   artifacts/atlas-plates  prebuilt nation and state plates
#   data          Census geography, town anchors, road chunks
#   scripts       the start dispatcher
# Notably absent: source, tests, docs, and the toolchain.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages ./packages
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/web/dist ./web/dist
COPY --from=build --chown=node:node /app/artifacts/atlas-plates ./artifacts/atlas-plates
COPY --from=build --chown=node:node /app/data ./data
COPY --from=build --chown=node:node /app/scripts/railway-start.mjs ./scripts/railway-start.mjs
COPY --from=build --chown=node:node /app/package.json ./package.json

EXPOSE 8787

# /ready reports the plate store and the geography adapter, so it fails when the
# atlas is present-but-broken rather than only when the process is dead.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/ready').then(r=>r.json()).then(j=>process.exit(j.ok?0:1)).catch(()=>process.exit(1))"

# Same dispatcher Railway uses, so the container and the platform start the
# process identically — one fewer difference between local and deployed.
CMD ["node", "scripts/railway-start.mjs"]
