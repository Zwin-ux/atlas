# Atlas Commons Connector Handoff

Status: staging connector connected through OAuth; nine-action refresh verified

Slice: `postalpha-0.81d-atlas-commons-map-radar`

## Paste this into ChatGPT after the connector shows nine tools

```text
Open Atlas on Riverside County and show the shared map on ALL, sorted HOT.
Keep the map full-screen and let me switch between ALL, NEARBY, and MINE.

ALL shows approved public notes as place activity on the map. NEARBY narrows to
the place I select. MINE shows my public submissions and their review status;
my private notes must stay only in this chat.

Never publish or convert a private note. If I ask to share something publicly,
show me Review public post first and call Post publicly only after I explicitly
confirm it. Public notes are plain text, 240 characters maximum, no links, and
must wait for moderation before anyone else sees them.
```

## Staging connector contract

- Name: `Atlas Staging`
- MCP endpoint: `https://atlas-backend-staging-9d6c.up.railway.app/mcp`
- Protected-resource metadata:
  `https://atlas-backend-staging-9d6c.up.railway.app/.well-known/oauth-protected-resource`
- Public read: `list_atlas_notes`
- Explicit authenticated mutation: `write_atlas_note`
- Exact scopes: `atlas:commons.read`, `atlas:commons.write`
- Widget resource: `ui://widget/atlas-city-world-081d.html`

The `Atlas Staging` connector is connected through OAuth and exposes exactly
nine actions. ChatGPT displays `atlas:commons.read` on `list_atlas_notes`,
`atlas:commons.write` on `write_atlas_note`, and widget resource `081d` on the
map actions. The seven pre-existing map actions remain explicit `noauth`.

## Verified setup

1. The isolated Auth0 tenant advertises the staging MCP resource and exactly
   the two Commons scopes. No Hosted Clawd scope was added.
2. ChatGPT registered through Client Identifier Metadata Document discovery;
   its callback, authorization, token, issuer, resource, and OIDC endpoints
   were discovered from the live staging server.
3. The imported ChatGPT client has user-delegated access to both Commons scopes
   and no client-credentials grant to the Commons API.
4. OAuth sign-in and consent completed in ChatGPT. After connector propagation,
   reopening Settings and refreshing exposed all nine actions and `081d`.
5. Two distinct staging identities plus the operator credential proved pending
   isolation, approval, anonymous read, reaction, report, removal, and cleanup.
6. Flag rollback removed the Commons surface to seven tools; re-enable restored
   nine. Production remained on its original seven-tool deployment.

Use the prompt above for ongoing desktop/mobile acceptance. Keep explicit
`Review public post` -> `Post publicly` confirmation; connector authorization
does not authorize Atlas to publish a private note implicitly.

Production connector and production environment remain unchanged/off.
