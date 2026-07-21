# Atlas Commons Connector Handoff

Status: staging connector points at staging MCP; OAuth and enabled refresh pending

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

The connector currently uses No Auth and sees the disabled seven-tool surface.
Do not refresh it to the enabled surface until staging issuer, audience, JWKS,
and the two exact scopes are configured.

## Owner-authenticated setup

1. Configure the staging authorization server/client with the two exact Commons
   scopes. Do not add Hosted Clawd scopes.
2. Set the staging OIDC issuer, MCP audience, and JWKS URL in Railway while
   Commons remains off.
3. Refresh/reconnect `Atlas Staging`; verify the server still exposes seven
   tools while disabled.
4. Enable Commons in staging and refresh once more. The connector must show
   exactly nine tools and the versioned `081d` widget resource.
5. Run the prompt above on desktop and mobile. Sign in when ChatGPT presents the
   OAuth challenge; passwords, passkeys, and one-time codes remain owner-entered.
6. Confirm a post becomes `Pending review`, stays absent from anonymous ALL,
   appears in the operator queue, becomes public only after approval, accepts a
   useful mark and a distinct-user report, then disappears after removal.
7. Prove flag rollback to seven tools and re-enable to nine tools in staging.

Production connector and production environment remain unchanged/off.
