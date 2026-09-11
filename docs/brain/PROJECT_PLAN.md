# Atlas project plan

This is the local planning authority for Atlas. It is intentionally usable
without Notion, MCP, a browser session, or any global agent-memory service.

Repository code and verifiers still own machine-checkable facts. `AGENTS.md`
owns permanent boundaries. `docs/STATUS.md` owns current evidence and blockers.

## Current objective

Enter the WebMCP challenge through one focused extension of the read-only
cartographic Atlas. The challenge work must improve how a person and an agent
use the same live map. It must not restart the retired voxel, Commons, Hosted
Clawd, Google lookup, persistence, or commerce lanes. The approved product
direction is the **Playable Maproom**: a curious person and an agent opening,
observing, and focusing the same map state. The reviewable design is in
`docs/superpowers/specs/2026-08-26-atlas-playable-maproom-design.md`; the visual
system is in `DESIGN.md`.

## P0 — WebMCP product spike

- [ ] Inspect the current public preview and identify the smallest page-tool
  boundary.
- [ ] Define no more than three page tools around visible map actions.
- [ ] Keep every action read-only and backed by Atlas-owned Census data.
- [ ] Keep person and agent on the same visible map state.
- [ ] Preserve structured ambiguity, unsupported-place, and out-of-country
  refusals.
- [ ] Prove one desktop and one phone flow.

## P0 — Challenge proof

- [ ] Produce a working public URL for the challenge candidate.
- [ ] Test the candidate in the required WebMCP-capable hosts.
- [ ] Record a clear public demo under three minutes with audio.
- [ ] Prepare the public repository, license, setup instructions, and direct
  submission copy.

## P0 — Context control

- [x] Establish one local document authority policy.
- [x] Inventory every repository-visible document and selected executable
  knowledge source.
- [x] Add local build, query, and drift-verification commands.
- [x] Route agents through current authority before archive material.
- [x] Make the planning path independent from MCP and remote connectors.

## P1 — Cleanup after the spike

- [ ] Split the existing dirty working tree into reviewable commits.
- [ ] Rewrite or explicitly retire the stale public README.
- [ ] Reconcile the mixed legacy TODO file without deleting provenance.
- [ ] Decide the static-site README classification.
- [ ] Re-run current release and location-truth gates before any release claim.

## WebMCP shape

At the design stage, require exactly three narrow browser-local capabilities
registered on `document.modelContext`, rather than a broad page-tool surface.
They do not change the existing server MCP tool surface:

1. Open a place on the current atlas page. Resolve it or return candidates,
   then update the visible plate.
2. Focus a visible feature using an Atlas-owned identifier from current page
   state.
3. Read a bounded, structured snapshot of the current view so human changes are
   observable without DOM scraping.

The WebMCP page layer and the existing Atlas service layer must share business
logic. Do not build a disconnected challenge-only implementation. Place
comparison is deferred until the shared-state loop is proven.

The browser page surface gets its own executable contract and verifier. Never
add these page capabilities to `scripts/lib/atlas-tool-surface.mjs`, which
continues to own the existing server MCP surface. Once that browser contract
exists, replace the numbered design-stage list above with a link to it so prose
does not duplicate machine-checkable names, counts, schemas, or caps.

Use the reviewed `GoogleChromeLabs/use-webmcp-tool` package as the minimal React
registration seam. Prepare its asynchronous registration-rejection fix
upstream; until a release exists, any local patch must be pinned, documented,
tested, and carry an explicit removal condition. Development inspection may use
`GoogleChromeLabs/webmcp-tools`, but production must not depend on a polyfill.

## Acceptance criteria

- The demo feels like one coherent consumer experience, not a protocol
  inspector.
- Every agent action produces a legible map change.
- A person can continue interacting after the agent acts.
- Desktop and phone layouts keep the map dominant.
- No dashboard, text-results wall, accounts, writes, commerce, persistence, or
  unrelated visual-engine work.
- Local build and verification do not require an MCP connector.

## Decision log

- **2026-08-26:** Use the repository-local GBrain as the required planning and
  context system.
- **2026-08-26:** Treat Notion as an optional human mirror only. Agents do not
  fetch it automatically and work does not block when it is unavailable.
- **2026-08-26:** Pursue the WebMCP challenge only through a product-aligned map
  collaboration slice.
- **2026-08-26:** Select the Playable Maproom for broad, curious ChatGPT users;
  do not narrow v1 to school use or add generic gamification.
- **2026-08-26:** Make bounded view observation the third page capability and
  defer comparison. This is required for real human-agent shared state.
- **2026-08-26:** Reuse the small GoogleChromeLabs React hook and contribute the
  asynchronous registration fix rather than building a new integration layer.
