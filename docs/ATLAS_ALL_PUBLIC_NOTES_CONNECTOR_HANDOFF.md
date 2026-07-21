# Atlas ALL Public Notes Connector Handoff

Status: server contract implemented; production connector unchanged

## Paste this into ChatGPT

```text
Open Atlas on Riverside County and use the public note layer as the main shared
view. Start on ALL. Keep the full map dominant and let me switch between ALL,
NEARBY, and MINE.

ALL shows approved public notes pinned to places in the active county. NEARBY
shows approved notes for the place I selected. MINE keeps my private notes in
this chat and may show my public submissions with Pending review.

Never publish, copy, or convert a private/session note. Only create a public
note after I explicitly choose Review public post and then confirm Post
publicly. Public notes are text-only, 240 characters maximum, no links, and
moderated before other people can read them.
```

## Connector contract

- MCP endpoint: `<atlas-server-origin>/mcp`
- OAuth protected-resource metadata:
  `<atlas-server-origin>/.well-known/oauth-protected-resource`
- Public read tool: `list_atlas_notes`
- Explicit authenticated mutation tool: `write_atlas_note`
- OAuth scopes:
  - `atlas:commons.read`
  - `atlas:commons.write`

The tools are registered only when `ATLAS_COMMONS_ENABLED=true`. Anonymous
approved-note reads remain open. `MINE`, posting, reacting, and reporting use a
verified OIDC identity. Operator moderation is not a ChatGPT tool.

## Setup order after approval

1. Point a staging ChatGPT connector at the staging `/mcp` URL.
2. Configure the staging OAuth issuer, audience, and JWKS URL.
3. Add the two commons scopes to the authorization server/client policy.
4. Run migrations and the Postgres smoke while the commons flag is still off.
5. Enable the flag in staging and reconnect/refresh the connector so the two
   new tools appear.
6. Run the paste-in prompt above on desktop and mobile.
7. Confirm posting challenges for identity, produces `Pending review`, and is
   invisible to anonymous `ALL` until an operator approves it.

The local connector/server path was exercised with real persisted data. No
production connector, Auth0 tenant, Railway environment, or public server was
modified in this slice.
