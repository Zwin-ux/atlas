# Atlas Alpha Command Center

Owner: Axiom - Atlas GM / Principal Systems Architect
2IC: Mira - Main Product Software Engineer / Human Experience 2IC
Glue support: Forge - Glue Engineer / Backend Apprentice
Voxel-engine captain: Lumen - Art Captain Specialist

Status: active manager plan.

Mode: full-power engineering wake. Mira, Forge, and Lumen are expected to edit
owned artifacts in their lanes, verify the work, and report evidence. They are
not advisory-only.

## Alpha Objective

Ship Atlas as a ChatGPT app that opens into a map-first Riverside/Eastvale proof
slice, lets the user inspect the local world, ask Atlas county/place questions,
drop a session-only marker/sticker, save a session-only note, and pass ChatGPT
app review without claiming gated Beta features.

Alpha is complete when the deployed app is:

- functionally green in MCP, submission, preview HTTP, and browser QA;
- honest about session-only notes/markers;
- cleanly split from parked visual experiments and persistence work;
- captured in a human approval packet with desktop/mobile screenshots;
- ready to show without apologizing for broken interactions.

Alpha is not complete because the art is final. Lumen currently rates the visual
system around 6-7/10. That is acceptable for functional Alpha evidence only,
not a public claim that the voxel style is solved.

## Current Blocker

F2 Clean Functional Alpha RC Split is the release blocker.

Source of truth: `docs/F2_CLEAN_ALPHA_RC_SPLIT.md`.
Current evidence packet: `docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md`.

No staging, deploy, or submission push happens from the current mixed tree.

Current public sanity, last checked by Axiom:

- `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed.
- `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:submission` passed.
- `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview pnpm verify:preview:http` passed.

This proves the deployed public loop is alive. It does not prove the current
dirty repo state is safe to stage or deploy.

## Work Lanes

| Lane | Owner | Status | Current target |
| --- | --- | --- | --- |
| Product software / release readiness | Mira | active | user-facing app loop, interaction quality, exact proof packet |
| Repo split / backend hygiene | Forge | active | mechanical split map for dirty files |
| Voxel engine / art system | Lumen | active | next visual-engine slices after F2 |
| Comms relay | Echo | local to Axiom | ack tracking and prompt drafting only |
| Final arbitration | Axiom | active | scope, order, staging/deploy readiness |

## Immediate Execution Order

1. Active worker implementation loops
   - Mira implements Alpha Product Loop Hardening in the map-first app surface.
   - Forge implements no-dependency RC split tooling and staged/parked reports.
   - Lumen implements or specifies the next bounded voxel-engine intake step.
   - Axiom integrates the reports, resolves conflicts, and blocks mixed-tree
     release attempts.

2. Alpha RC path decision
   - Path A: public-green docs-only packet, no deploy if public stays green.
   - Path B: clean product-code RC that includes Mira's visible session-only
     tray hardening.
   - Axiom currently prefers Path B for a stronger human Alpha approval packet,
     but Forge must prove the split mechanics before deploy discussion.

3. F2 split spec
   - Keep `docs/F2_CLEAN_ALPHA_RC_SPLIT.md` current.
   - Use Forge's split tooling as the mechanical guard.
   - Send the final staged/parked list to Mira for product-readiness challenge.

4. Clean Alpha RC proof
   - Run local clean-RC verifiers only after the candidate is isolated.
   - Run public sanity verifiers against Railway.
   - Capture desktop and mobile browser evidence through Mira/Lens.

5. Human approval packet
   - Include screenshots, proof table, Alpha boundary, and weak spots.
   - Ask Lumen for visual critique if the packet makes any visual claim.
   - Ask the human for taste approval only when evidence is concrete.

6. Deploy/submission decision
   - If the RC is docs-only and public remains green, no deploy may be needed.
   - If a code RC is accepted, deploy only that clean candidate.
   - Re-run public checks after deploy.

7. Post-F2 visual-engine slice
   - Lumen completed the standalone lab Three-Asset Fit / Anchor / Base /
     Material Integration pass.
   - Keep it parked out of Functional Alpha RC.
   - Use Mira/Lumen screenshot critique before any production renderer intake.

## Lumen Voxel-Engine Plan

Lumen is not idle. Lumen can edit owned visual-engine specs and approved lab
slices. During F2, Lumen should not edit functional RC product code or sneak
visual experiments into release staging, but Lumen owns the engine grammar and
visual critique.

After F2 is green, Lumen's recommended visual-engine order is:

1. Three-Asset Fit / Anchor / Base / Material Integration
   - Scope: rowhome, strip store, road corner only.
   - Goal: reduce pasted-on/float read, strengthen base contact, reduce blank
     top planes, and keep the road corner subordinate.
   - No new modules, props, cars, humans, trees, water, panels, or product copy.
   - Status: implemented in standalone lab, accepted as a lab improvement only.

2. Tile Grammar Contract For Production Intake
   - Define anchors, footprints, layer order, contact shadows, top/side face
     contrast, and mobile-read constraints.
   - A new worker should be able to create one conforming tile from the spec.

3. One Production Renderer Intake Spike
   - Import exactly one accepted lab asset or derived primitive into the real
     renderer behind fallback.
   - Preserve place select, pan/zoom, sticker/pin, and note save.
   - Reject if the production screenshot does not materially improve.

## Mira Approval Packet

Mira's packet must include:

- exact staged file list;
- exact parked file list;
- desktop screenshot after tray, sticker/pin, and saved note;
- mobile `390x844` screenshot after comparable interaction;
- browser proof table;
- local clean-RC verifier results;
- public sanity verifier results;
- Alpha boundary proof;
- weak-spots note.

Mira owns main product software for the ChatGPT app surface. Mira may edit
product-surface code, QA helpers, readiness-owned docs, and approval packet
artifacts when the slice is declared and scoped. Mira must not change
backend/storage/money/gated systems, stage, or deploy without Axiom approval.

If visuals are discussed, Mira asks Lumen for:

- first 3-second read;
- slop flags;
- authored strengths;
- mobile read;
- one highest-leverage fix;
- parked vs release-blocking verdict;
- reference rating against both visual references;
- public-showability verdict.

## Forge Split Questions

Forge must answer:

- Can the Functional Alpha RC be clean baseline plus docs only?
- Which dirty files are must-not-stage?
- Which shared docs need hunk-level split?
- Is any product-code hunk required to preserve the public-green function loop?
- Which Hosted Clawd/package/lock/env files must be isolated into a later lane?

Forge may edit split-map docs, backend/env maps, and release-hygiene runbooks.
Forge does not need Axiom permission for docs that reduce merge risk. Any code
or package/lock change still needs a scoped implementation slice.

## Hard Gates

- No Stripe, checkout, billing portal, or webhooks.
- No XP, evidence, quest creation, reports, exports, or automation.
- No OAuth/account linking.
- No durable public saved-state claim.
- No production renderer port from lab without screenshot proof and Axiom
  approval.
- No hiding weak voxel art with extra props, cars, humans, panels, labels, or
  glows.
- No whole mixed-tree staging.

## Big 4 Edit Authority

The Big 4 are not advisory-only.

- Axiom can edit manager specs, release order docs, architecture docs, and
  tightly scoped implementation work when it directly unblocks release.
- Mira can edit product-surface code, QA helpers, readiness packets, evidence
  docs, and human-approval copy.
- Forge can edit split maps, backend/env route maps, command runbooks, and
  scoped glue helpers after declaring anti-scope.
- Lumen can edit visual-engine specs, critique docs, asset workflow docs, and
  approved standalone lab slices.

The rule is not "no edits." The rule is "owned lane, explicit anti-scope,
verification, no mixed staging."

## Definition Of Done For Alpha

Atlas Alpha is done when:

1. F2 split is accepted by Axiom, challenged by Mira, and mechanically checked by
   Forge.
2. The candidate excludes parked visual and persistence lanes.
3. Verifiers pass locally for the candidate or public checks prove no deploy is
   needed.
4. Public MCP, submission, and preview checks pass.
5. Desktop and mobile browser evidence show the app loop working.
6. The human sees the screenshot packet and approves the visible Alpha as
   showable.

Until then, the correct manager status is: Alpha function is close, release
candidate is blocked by split hygiene.
