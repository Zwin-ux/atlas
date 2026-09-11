# Architecture / improve the existing system

## Shape

Keep the current TypeScript server + widget architecture. A typed Census index/resolver supplies identity and supported facts; a plate service supplies geometry through Atlas-owned delivery; a thin host adapter interprets tool/UI events; a stateful map view renders the current authoritative plate with temporary human interaction state.

Do not replace the renderer, add an autonomous agent to the app itself, add a graph database, or rebuild the application around a new framework. The multiple agents in this kit are development workers, not product architecture.

## Contract-first slices

Before parallel module edits, agree on a narrow result union: success with a validated plate reference; ambiguity with explicit candidate identities; unresolved/unsupported; operational error. Distinguish domain refusal from transport failure. Update only existing contracts and their consumers; do not widen the public tool surface.

A typed place reference must express its actual geographic kind. A missing field is not a number/default. Data vintage and identity should travel with the facts they qualify. Use an existing runtime validator at trust boundaries rather than broad unchecked casts.

Separate these concepts internally:
- Displayed plate and pending plate request.
- Source-backed geographic parent and navigation history.
- Selected feature and camera.
- Tool event identity and local request generation.
- Native host capability and preview emulation.

This does not imply many new services/files. A small state reducer and an existing adapter may be sufficient.

## Suggested source map to verify

- Public tool authority: `scripts/lib/atlas-tool-surface.mjs`.
- Tool implementation: `server/src/atlasTools.ts`.
- Resolver: `packages/core/src/atlas/gazetteer.ts`.
- Plate service/index: inspect `server/src/atlasPlates.ts` and actual index files.
- Widget source: `web/src/atlas/`, including existing app, plate, tool adapter, geometry, CSS, and diagnostics.
- Resource/delivery: server registration and current build output.
- Canonical state: `docs/STATUS.md`; planning: `docs/brain/PROJECT_PLAN.md`.

Paths are reviewed entry points, not a promise that the next checkout has identical layout. Task assignments must narrow to paths actually present. Do not copy large geometry into model-visible output to make integration easier.

## Independent correctness oracle

Test expected identities and parent relationships against a small reviewed source fixture, not by invoking the same resolver to generate its own expected answers. Record fixture provenance and source version. Generated permutations can exercise casing/punctuation around that independent oracle.

Keep positive coverage, ambiguity, and out-of-scope cases. “Refuse everything” is not a correct resolver. Fail on one confidently wrong resolved identity; never lower that bar to hide a defect.

Population completeness, ordering, and unknown values must be verified upstream before “largest” labels. A displayed centroid/anchor must not be described as a boundary. Inspect cases with broad, multipart, coastal, or otherwise challenging geometry within claimed coverage without adding new geographic promises.

## Model-to-widget consistency

An end-to-end assertion should compare the named answer, structured identity, plate geometry identifier, displayed title, selected feature, and subsequent named follow-up. Passing individual modules is insufficient when identifiers disagree at their boundaries.

Host notifications may be repeated or delayed. Dedupe appropriately; refuse stale metadata from another result. Preserve requested/displayed separation under cancellation and retry. A component returning from fullscreen must not replay a conversation action.

## Host capability spike

Early in the graph, verify the supported APIs/resources/metadata for the installed versions against current official OpenAI guidance. A read-only feasibility spike should settle whether the intended handshake and mode/context features exist; actual authenticated ChatGPT proof remains a separate gate.

Prefer the existing bridge if correct. No speculative SDK migration; no permanent CSP wildcard; no fictional message type copied from an outdated example. If official docs conflict with old repository workarounds, reproduce the problem and choose the narrow compatible fix with a regression test.

## Artifact and run identity

Functional task receipts refer to integrated commits and checked artifacts. Final-candidate proof refers to the exact frozen revision/build, host client and configured target. Changes to source/config/data invalidate relevant proof even when the API names stay the same.

The graph planner checks basic evidence integrity and dependency links. It is not a CI runner or a security boundary. Reviewer inspection, actual tests, and final clean-checkout verification remain necessary.
