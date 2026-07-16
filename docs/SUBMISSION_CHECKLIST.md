# Atlas County Scout — Plugin Submission Checklist

Current requirements were rechecked on July 15, 2026 against OpenAI's official [Submit plugins](https://developers.openai.com/codex/submit-plugins), [app guidelines](https://developers.openai.com/apps-sdk/app-submission-guidelines), and [app submission preparation](https://developers.openai.com/apps-sdk/deploy/submission) pages.

Apps are now submitted as MCP-backed plugins. There is no separate App Directory submission flow.

Legend: ✅ verified or implemented · 🚢 implemented but not deployed · 🧪 real ChatGPT proof still required · ⬜ human/portal step

## Requirement Matrix

| Review area | Atlas evidence | Status | Finish line |
| --- | --- | --- | --- |
| Distinct product name | Listing name is **Atlas County Scout**, not the generic single word “Atlas.” | ✅ | Keep the product brand Atlas; use the specific listing name in the portal. |
| Short description | “Explore voxel county maps” is 25 characters; schema maximum is 30. | ✅ | Copy exactly from `chatgpt-app-submission.json`. |
| Complete-product framing | Listing describes the current interactive map, Scout Drop, manual plan, generated district studies, and deliberate read-only boundary without demo/trial/alpha/beta/coming-soon language. | ✅ | Do not reintroduce unfinished-product framing in portal copy. |
| Logo | `assets/brand/atlas-icon-512.png` is the submission asset; verifier enforces PNG and 512×512 IHDR dimensions. | ✅ | Upload this file. |
| Website | Production `/preview` is public and rendered the Atlas map during the July 15 browser check. | ✅ | Recheck immediately before submission. |
| Support | Dedicated `/support` page and monitored email are implemented. | 🚢 | Deploy, then confirm `https://atlas-backend-production-e6fc.up.railway.app/support` returns 200. |
| Privacy policy | Policy now lists processed categories, purposes, recipients, 24-hour lookup-cache retention, and user controls. | 🚢 | Deploy `/privacy`, reread the live copy, and make sure it matches production behavior. |
| Terms | Terms frame Scout Drop/manual plans as the complete read-only product and disclose the 24-hour lookup cache. | 🚢 | Deploy `/terms` and verify live. |
| Public MCP server | Production URL is `https://atlas-backend-production-e6fc.up.railway.app/mcp`; no login is required. | ✅ | Re-run live MCP and submission verification after deploy. |
| Domain verification | `/.well-known/openai-apps-challenge` returns the exact `ATLAS_OPENAI_APPS_CHALLENGE_TOKEN` as plain text when configured. | 🚢/⬜ | Get the token from the portal, set the Railway variable, deploy/restart, and verify the exact response body. |
| Content security policy | App resource CSP is scoped to the domains the component uses; emulator CSP and cross-origin asset loading are locally audited. | ✅/🧪 | Confirm the portal scan imports the intended CSP and complete the real-host G8 pass. |
| Tool metadata | Seven unique tools have output schemas and explicit `readOnlyHint`, `openWorldHint`, and `destructiveHint` values with justifications. | ✅ | Select **Scan Tools** after the production deploy and compare every imported value. |
| Minimal location input | `lookup_world_places` now accepts Atlas-owned `countySlug` and `placeId`; it no longer requests a raw city, address, coordinates, or conversation text. | 🚢 | Deploy and confirm the scanned input schema. |
| Response minimization | The MCP lookup result omits coordinates, raw query, provider mode, cache keys, TTL fields, cache-hit flags, timestamps, field-mask diagnostics, and provider-readiness internals. | 🚢 | Deploy and inspect real ChatGPT tool output. Internal REST diagnostics remain outside the app tool response. |
| Starter prompts | Four focused prompts cover map opening, grounded questions, nearby-place lookup, and the Scout Drop → manual plan loop. | ✅ | Enter them in the Prompts tab. |
| Positive tests | Exactly five reviewer-ready cases collectively cover all seven tools and name fixture data. | ✅ | Run all five on ChatGPT web and mobile after deploy. |
| Negative tests | Exactly three cases cover unrelated travel, provider scraping/mass outreach, and payment/account requests; each explains why Atlas must not complete the action. | ✅ | Confirm routing and refusals in real ChatGPT. |
| Availability | Initial submission is US-only because the current product and support/legal scope are US county maps. | ✅/⬜ | Select United States in the Global tab. |
| Release notes | Initial-submission notes are included in the local package. | ✅ | Paste into the Submit tab. |
| Identity | Verified individual or business identity must match the listing, website, support, privacy, and terms. | ⬜ | Complete verification in the publishing organization. |
| Portal permission | Submitter needs **Apps Management: Write**; owners already have app-management permissions. | ⬜ | Confirm the role before opening the draft. |
| Data residency | Projects with EU data residency currently cannot submit MCP-backed plugins. | ⬜ | Use a global-data-residency project. |
| Real-host quality | Local emulator fidelity, desktop/mobile map behavior, performance, and MCP gates are green. Real ChatGPT G8 is not complete. | 🧪 | Finish the visible ChatGPT web + mobile run; do not claim host approval from emulator evidence. |

## Portal Packet

Use `chatgpt-app-submission.json` as the copy-and-evidence source. The portal currently expects:

- listing name, short and long descriptions, logo, category, website, support, privacy, and terms;
- production MCP URL, authentication choice, CSP, domain verification, scanned tools, annotations, and justifications;
- starter prompts;
- exactly five positive and three negative test cases;
- country availability;
- release notes and policy attestations.

## Ordered Finish Line

1. Commit and push this isolated submission-hardening packet without staging unrelated worker/artifact changes.
2. Deploy the committed server contract, including `/support`, updated legal pages, minimized lookup inputs/outputs, and the domain-challenge route.
3. Verify production `/support`, `/privacy`, `/terms`, `/preview`, `/mcp`, and the challenge route's unconfigured 404 behavior.
4. In the plugin portal, create a **With MCP** draft, set the portal challenge token in Railway, and verify the exact plain-text challenge response.
5. Select **Scan Tools** and compare all seven tools, schemas, annotations, resource metadata, and CSP against the committed package.
6. Run the five positive and three negative cases in ChatGPT web and mobile. Complete the open G8 real-host evidence packet.
7. Confirm verified publisher identity, Apps Management write access, global data residency, US availability, public URLs, and support ownership.
8. Submit for review. Approval is not publication; publish the approved version from the portal.

## Do Not Claim Yet

- Atlas County Scout is not submission-ready until the code-ready routes and MCP schema are deployed and rescanned.
- G8 is not passed until the real ChatGPT web/mobile run is recorded.
- Domain ownership is not verified until the portal-issued token is live at the exact well-known path.
- Directory prominence is not guaranteed. Publishing makes the plugin searchable; enhanced placement is selective.
