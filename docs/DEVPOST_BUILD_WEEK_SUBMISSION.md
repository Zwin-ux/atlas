# Atlas County Scout - OpenAI Build Week submission packet

Use this file as the copy source for the Devpost draft. It is written against
the OpenAI Build Week rules published on July 18, 2026 and the live Atlas repo.

## Project overview

Project name:

> Atlas County Scout

Elevator pitch:

> Voxel county maps inside ChatGPT, grounded by Census places and built to turn local questions into Scout Drops and 7-day plans.

Track:

> Work & Productivity

Thumbnail:

> `artifacts/devpost/atlas-devpost-thumbnail-1200x800.png`

The thumbnail is a 1200x800 PNG, exactly 3:2, captured from the Atlas product.
Do not use the old "A Better Atlas - Map Plugin" name or the repeated
"high quality" pitch. Both make the project sound generic and unfinished.

## Project details

### Inspiration

Local planning usually splits the map, the research, and the plan across
different tabs. The map shows where things are, chat explains them, and a
document holds the next steps. The context gets lost between all three.

Atlas started with a sharper question: what if the conversation and the map
shared the same state? A user should be able to open a county, point at a real
place, ask what matters there, and turn that answer into a small manual plan
without leaving ChatGPT.

### What it does

Atlas County Scout opens inside ChatGPT as an interactive PixiJS voxel map.
Riverside County and Eastvale are the curated playable map. Users can explore
the county, focus places, ask questions grounded in Atlas data, run a bounded
nearby-place lookup, drop Clawd for a local service business, inspect the
resulting Scout Drop, and turn it into a manual 7-day plan.

The national engine is deliberately honest. Every supported U.S. county has
real 2024 U.S. Census town anchors. Outside the curated Riverside map, Atlas
labels streets and buildings as generated instead of presenting them as exact
local coverage. Provider lookup results are normalized for manual review and
never become map geometry.

The public entry is session-only and read-only. It does not create accounts,
save user work, send messages, buy ads, submit forms, or process payments.

### How we built it

Atlas is a TypeScript workspace with a Node.js MCP server, a React widget, and
a PixiJS voxel renderer. Seven typed tools separate model-readable summaries
from the larger widget-only scene data. The renderer consumes compiled
`VoxelScene` and `CityWorldScene` contracts, while geography and provider data
stay behind service boundaries.

The Build Week extension added a deterministic Census pipeline covering all
3,222 supported counties and 13,797 named anchors. We added contract tests,
payload budgets, source classes, and copy that distinguishes real place names
from generated streets and buildings. We also hardened the Redis scene-packet
worker, production health checks, rollback logic, browser audits, and mobile
interaction behavior.

Codex with GPT-5.6 was the main engineering partner. It audited the existing
repo, mapped the finish line, built and tested the national anchor pipeline,
found stale browser evidence, hardened worker failure paths, tightened the MCP
submission contract, and ran the release gates. We used explicit product laws
and machine-readable verifiers so Codex could move quickly without expanding
the scope. The human decisions were the important cutlines: map first,
session-only V1, honest geography, and no commerce or automated outreach.

### Challenges we ran into

The hardest problem was national scale without fake precision. A generated
city can look convincing while still being geographically wrong. We solved
that by separating three kinds of truth: curated playable geometry, real
Census anchors, and clearly labeled generated layout.

The second challenge was host fidelity. A local widget can pass while the real
ChatGPT surface behaves differently, especially on mobile. We strengthened the
emulator, added desktop/mobile audits, and fixed a real tap-order bug where the
Places control could intercept the note field.

The third challenge was release reliability. The background worker had failed
earlier deployments because its health contract did not match Railway. Build
Week work added bounded Redis retry, transient poll recovery, its own health
server, clean shutdown, and release rollback gates. The repaired worker then
deployed successfully.

### Accomplishments that we're proud of

- 3,222 of 3,222 supported counties carry real Census town anchors.
- The anchor index contains 13,797 named places with explicit source classes.
- The public ChatGPT app stays to exactly seven read-only tools.
- Production passed 14 of 14 release gates and 3 of 3 public sanity checks.
- The worker reached its first successful production deployment.
- Browser evidence covers desktop and phone-sized layouts, not desktop alone.
- The product says when geography is generated instead of hiding the limit.

### What we learned

Map products need truth boundaries more than they need extra visual detail.
One honest label can be more valuable than a hundred decorative buildings.

We also learned that Codex is strongest when the product decisions are already
sharp. Named slices, typed contracts, anti-scope rules, and executable gates
turned a large existing codebase into a tractable Build Week extension.

Finally, mobile QA cannot be deferred. A map that looks good at 1280 pixels can
still fail because one control steals a tap on a 390-pixel screen.

### What's next for Atlas County Scout

The immediate finish line is real ChatGPT web/mobile acceptance, the app
portal domain token, and publication of the focused County Scout. After that,
Atlas will deepen real town detail and make Scout and campaign steps focus the
map more directly. Persistence, payments, and automated outreach stay outside
this public V1 until their own product and safety gates are opened.

## Built with

- OpenAI Codex
- GPT-5.6
- OpenAI Apps SDK
- Model Context Protocol
- TypeScript
- React
- PixiJS
- Node.js
- Zod
- Redis
- Railway
- Google Maps Platform
- U.S. Census Gazetteer and TIGERweb data
- pnpm
- Vitest

## Build Week eligibility boundary

Atlas predates the hackathon. Use this exact distinction in the submission:

Before July 13, 2026:

- the core Atlas voxel-map prototype and Riverside/Eastvale product direction
  already existed;
- the project already used a ChatGPT/MCP architecture; and
- earlier visual and product experiments were present in the repo.

Built or meaningfully extended from July 13 through July 18, 2026:

- certified 0.78-1V county-board framing and release integrity;
- hardened ChatGPT emulator fidelity and mobile browser behavior;
- reviewer-ready plugin metadata, test cases, minimized tool results, and
  support/privacy/terms surfaces;
- 3,222-county / 13,797-anchor Census town layer wired through the compiler,
  worker, MCP answers, and widget;
- Redis worker recovery, readiness, shutdown, and release rollback behavior;
- successful production deployment of the national-anchor candidate and
  worker; and
- the national Census LOD0 geography bake and verifier behind a feature flag.

Evidence:

- Build Week base commit: `0e94a6ce9d4ed362c03d2286696919b9cd6836bf`
- Current submission branch: `codex/integrate-hosted-clawd-fable-058e`
- Post-boundary commits: 23 at packet-writing time
- Main Codex/GPT-5.6 session: `019f687a-82d3-7df0-ac27-5b7ca38b099c`
- Key feature commit: `331c8cf` - national Census town anchors and submission candidate
- Key contract commit: `8bf5a4e` - hardened plugin submission contract
- Production release record: `b4eea1c`
- National geography commit: `b724a54`

## Additional info fields

Category:

> Work & Productivity

Code repository:

> https://github.com/Zwin-ux/atlas-alpha-engine-beta-checkpoint/tree/codex/integrate-hosted-clawd-fable-058e

The repository is private. Before submitting, grant repository access to both
`testing@devpost.com` and `build-week-event@openai.com`, as required by the
official rules. Do not make the repo public casually; it currently has no
declared license.

Live visual demo:

> https://atlas-backend-production-e6fc.up.railway.app/preview

Production MCP URL:

> https://atlas-backend-production-e6fc.up.railway.app/mcp

Codex `/feedback` session ID:

> 019f687a-82d3-7df0-ac27-5b7ca38b099c

How Codex and GPT-5.6 were used:

> We used Codex with GPT-5.6 as the main engineering partner for the Build Week extension. It audited the existing Atlas repo, helped define the focused County Scout scope, built and verified the national Census-anchor pipeline, hardened Redis worker failure and release paths, tightened the seven-tool MCP contract, found stale browser evidence, and ran the type, test, browser, and production gates. We kept product decisions human-owned: map-first UX, honest generated geography, a session-only public V1, and no persistence, payments, or automated outreach.

## Judge test instructions

No account or rebuild is required for the visual demo:

1. Open `https://atlas-backend-production-e6fc.up.railway.app/preview`.
2. Confirm the Riverside/Eastvale voxel map renders.
3. Pan, zoom, select Eastvale, and inspect the session-only note surface.

For the full ChatGPT flow:

1. Add an MCP app in ChatGPT developer mode.
2. Use `https://atlas-backend-production-e6fc.up.railway.app/mcp`.
3. Authentication is `NONE`.
4. Run these prompts in order:
   - `Open Atlas for Riverside County and show Eastvale.`
   - `Find real nearby service businesses around Eastvale and group them into Atlas categories.`
   - `Drop Clawd in Eastvale for a mobile detailing business, build the first 7-day manual plan, and tell me whether this work is saved.`
   - `Where is Homestead on the Miami-Dade County Atlas preview?`

Expected boundary: Atlas returns a map, normalized place information, a Scout
Drop, and a manual plan. It states that public work is not saved and that
generated streets/buildings outside Riverside are not verified local coverage.

## Demo video script - target 2:40

The final video must be public on YouTube, under three minutes, and include
spoken audio covering both the product and how Codex/GPT-5.6 was used. Do not
use copyrighted music.

### 0:00-0:12 - The problem

Visual: ChatGPT beside the Atlas county map.

Voiceover:

> Local planning usually breaks the map, the research, and the action plan into separate tabs. Atlas keeps them in one shared spatial conversation.

### 0:12-0:38 - Open the product

Visual: Run `Open Atlas for Riverside County and show Eastvale.` Pan and zoom
the voxel map, then select Eastvale.

Voiceover:

> Atlas County Scout is a seven-tool ChatGPT app with an interactive voxel county map. Riverside and Eastvale are the curated playable proof.

### 0:38-1:05 - Grounded local lookup

Visual: Run the nearby-service-business prompt and show the normalized results.

Voiceover:

> I can ask what is nearby without turning provider data into fake map geometry. Atlas returns bounded, normalized place information for manual review.

### 1:05-1:35 - The core loop

Visual: Run the mobile-detailing prompt. Show the Scout Drop signals, then the
manual 7-day plan.

Voiceover:

> The core loop is explore, ask, drop Clawd, scout, then build a manual plan. Atlas stays read-only: it does not message leads, buy ads, save an account, or charge a card.

### 1:35-1:58 - National honesty

Visual: Ask for Homestead in Miami-Dade and show its map focus/source note.

Voiceover:

> During Build Week we added 13,797 real Census town anchors across all 3,222 supported counties. Outside Riverside, Atlas clearly labels streets and buildings as generated.

### 1:58-2:28 - Codex and GPT-5.6

Visual: Show the Build Week commit log, the passing verifier output, and the
README Build Week section.

Voiceover:

> Codex with GPT-5.6 helped turn the existing prototype into this submission candidate. It built and tested the national anchor pipeline, hardened the Redis worker and release rollback paths, tightened the MCP contract, found stale browser evidence, and ran the desktop, mobile, and production gates. I kept the product cutlines human-owned: map first, honest geography, and no fake automation.

### 2:28-2:40 - Close

Visual: Return to the Eastvale map.

Voiceover:

> Atlas turns a ChatGPT answer into a place you can inspect and a plan you can act on. This is Atlas County Scout.

## Final submission checklist

- [ ] Replace the Devpost name with `Atlas County Scout`.
- [ ] Paste the elevator pitch from this packet.
- [ ] Upload `artifacts/devpost/atlas-devpost-thumbnail-1200x800.png`.
- [ ] Select `Work & Productivity`.
- [ ] Paste the project-details sections without adding generic marketing copy.
- [ ] Add the built-with tags.
- [ ] Record the demo script and upload it as a public, sub-three-minute YouTube video.
- [ ] Add the production preview as the try-it link.
- [ ] Add the active submission-branch repository URL.
- [ ] Share the private repo with both judging addresses.
- [ ] Enter the Codex session ID exactly.
- [ ] Confirm the five positive and three negative flows in real ChatGPT web and mobile.
- [ ] Save the draft, preview the public page, then submit before July 21, 2026 at 5:00 PM PDT.

Do not claim domain verification, real-host G8, public app approval, persistence,
payments, automated outreach, or exact streets/buildings outside Riverside until
those separate gates are actually complete.
