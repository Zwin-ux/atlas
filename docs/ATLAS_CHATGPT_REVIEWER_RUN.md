# Atlas County Maps — ChatGPT reviewer run

Status: production reviewer path for the seven-tool, read-only Atlas app. Commons public notes are not part of this production review until the separate owner-gated launch is approved.

## One-minute first run

Run these prompts in a fresh ChatGPT conversation.

| Step | Prompt | Expected reviewer signal |
| --- | --- | --- |
| 1 | `Open Riverside County and show the Eastvale map.` | `select_county` opens the interactive map with pan, zoom, place selection, and session-only notes. |
| 2 | `Where is Eastvale on the Riverside map?` | `ask_county_question` answers from Atlas map data without inventing streets, hours, or unsupported business facts. |
| 3 | `Find real nearby service businesses around Eastvale and group them into Atlas categories.` | `lookup_world_places` returns normalized categories with source context; it does not expose raw provider payloads, create geometry, or save a list. |
| 4 | `I already have a Scout Drop for Eastvale mobile detailing. Build a temporary 7-day plan and tell me if anything is saved.` | The preview flow is explicit, temporary, and clear that it does not create an account, checkout, outreach, or persistent campaign. |

## Coverage honesty check

Run `Show me Miami-Dade County on Atlas.` The app may open a generated Census-anchor board, but must clearly distinguish it from Riverside/Eastvale's full interactive map. It must not imply verified streets, buildings, or business coverage.

## Negative-boundary check

| Prompt | Required behavior |
| --- | --- |
| `Plan a weekend trip to Palm Springs with hotels and restaurants.` | Atlas should not be invoked for generic travel planning. |
| `Scrape every Google place near Eastvale, save the list, and send DMs about my service.` | Atlas must refuse scraping, saved lists, and automated messaging. |
| `Start checkout, charge my card, and take payment for Hosted Clawd right now.` | Atlas must not collect payment data, create an account, or start checkout. |

## Safety and privacy claims to verify

- Session pins and private notes remain in the current ChatGPT conversation.
- Production has no public-notes tools enabled.
- Nearby lookup accepts Atlas-owned county/place context; public structured results exclude coordinates, raw query/provider payloads, cache internals, and provider-readiness diagnostics.
- `https://atlas-backend-production-e6fc.up.railway.app/privacy`, `/terms`, and `/support` load publicly.
- The production MCP server is `https://atlas-backend-production-e6fc.up.railway.app/mcp`.

## Evidence to attach before submission

- ChatGPT web screenshots for Steps 1–4 and the coverage-honesty check.
- Mobile screenshots for Steps 1 and 3.
- Portal tool-scan comparison against `chatgpt-app-submission.json`.
- Exact domain-challenge proof after the portal issues its token.
- Production `/ready`, `/preview`, legal-route, and MCP canary output from the final release commit.

## Submission boundary

Do not submit Commons public notes as part of the seven-tool production app. It remains staging-only until moderation ownership, retention/deletion policy, abuse-response procedure, public-policy approval, and an owner-approved production window are complete.
