# Atlas G6 Submission Checklist

Status: offline G6 packet prepared on July 3, 2026.

## Completed Offline

- Manifest reviewed against `scripts/verify-submission.mjs`.
- `chatgpt-app-submission.json` keeps `schema_version` at `1`.
- App display name is `Atlas`.
- Description includes the required `voxel city map`, `session-only`, and `do not save state` language.
- All seven MCP tools are present: `select_county`, `ask_county_question`, `render_voxel_county`, `lookup_world_places`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`.
- Tool annotations mirror `server/src/index.ts`: every tool is read-only and non-destructive; only `lookup_world_places` has `openWorldHint: true`.
- Negative tests include payment, checkout, card, messaging/spam, live lookup, saving, scraping, and mass outreach boundaries.
- Scene-bearing manifest test cases now call out the expected safe scenePacket policy: `canPersist=false`, `providerGeometryAllowed=false`, and `liveProviderAllowed=false`.
- App icon created at `assets/atlas-app-icon.svg`.
- Privacy policy drafted at `docs/legal/PRIVACY.md`.
- Terms drafted at `docs/legal/TERMS.md`.

## Asset References

- SVG icon: `assets/atlas-app-icon.svg`
- Privacy policy source: `docs/legal/PRIVACY.md`
- Terms source: `docs/legal/TERMS.md`

I did not add icon, privacy URL, or terms URL fields to `chatgpt-app-submission.json` because the current repo only has a remote `$schema` URL and the sandbox has no network. Adding guessed fields could pass the local verifier while failing the real directory schema.

## Human Or Network Follow-Ups

- Host the privacy policy at a public URL.
- Host the terms at a public URL.
- Confirm the current OpenAI Apps directory submission requirements. This sandbox could not fetch current requirements offline.
- Confirm the official schema fields for icon, privacy URL, and terms URL, then wire them into the manifest if the schema requires or allows them.
- Provide a raster icon, likely PNG, if the directory requires it.
- Confirm Google Maps Platform attribution and policy wording on the public listing.
- Run `scripts/verify-submission.mjs` against a live server when server/network access is available.
- Run final human review for product accuracy: Riverside/Eastvale playable, session-only, no accounts, no paid flow, no persistence, and Google Maps used read-only for lookups only.
