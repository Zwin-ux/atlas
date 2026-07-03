# Atlas Real Consumer App Roadmap

## Product Goal

Atlas is a ChatGPT app that lets anyone open a location, explore a high-quality
voxel county world, ask what is around, drop Clawd, and generate useful local
Scout/Campaign previews.

Paid later means Hosted Clawd running on our server with saved memory, saved
campaigns, business context, quests, evidence, XP, reports, and exports. Paid
does not come before the engine feels credible.

## ChatGPT App Barriers

Atlas must stay a ChatGPT app, not a standalone dashboard:

- map-first widget surface;
- concise tool `structuredContent`;
- large scene/debug data only in `_meta`;
- seven-tool Alpha surface stable until there is a real user need;
- no compiler, GEOID, promotion-packet, or verifier jargon in public copy;
- no public debug overlays;
- mobile `390x844` remains usable;
- users always know what is playable, shell-only, or unsupported;
- session-only state stays explicit until Hosted Clawd persistence exists.

## Honest Coverage Model

Atlas does not fake national playability. It uses readiness tiers:

- `L0_UNSUPPORTED`: not indexed or unsupported.
- `L1_COUNTY_SHELL`: indexed county shell, no fake local world.
- `L2_CURATED_DISTRICT`: playable district with curated scene and source notes.
- `L3_PROVIDER_NORMALIZED`: provider-backed data normalized behind backend
  contracts.
- `L4_PUBLIC_QUALITY`: mobile-proof public-quality scene with release evidence.

## July 4 Cutline

Ship a credible public Alpha / Engine Beta proof, not the full company roadmap.

Required:

- Riverside/Eastvale public playable;
- California shell coverage honest;
- Orange shell and Unknown/L0 recovery visible on mobile;
- Scout/Campaign preview loop session-only;
- public preview, MCP, submission, and screenshot proof green;
- no paid, persistence, XP, evidence, OAuth, automation, reports, or exports;
- Anaheim/Ontario hidden until promotion gates pass.

Current risk:

- `0.23E Hidden Venue Authorship Pass` touched real code and must either be
  stabilized quickly or parked from the July 4 release path.

## Implementation Spine

### Milestone 1: Public Alpha Lock

Goal: freeze, verify, and hand off the current public Alpha.

Deliverables:

- local RC proof;
- public proof;
- evidence packet;
- parked scope list;
- known weaknesses;
- next Engine Beta slice.

### Milestone 2: Consumer Entry Upgrade

Goal: make the first 10 seconds feel like a real ChatGPT app.

Deliverables:

- clearer public entry copy;
- compact county switcher;
- session-only Scout/Campaign language;
- shell/L0 recovery that works on mobile.

### Milestone 3: Engine Quality Cell

Goal: Riverside/Eastvale looks and feels like a credible voxel county world.

Deliverables:

- object kit quality;
- road/lot/terrain grammar;
- camera presets;
- diagnostics for density, terrain massing, mobile occlusion, and object
  authorship.

### Milestone 4: Second Playable District

Goal: prove the engine generalizes beyond Riverside.

Default candidate: Anaheim. Backup/control: Ontario.

Deliverables:

- source-noted anchors;
- hidden draft scene;
- no-label recognition proof;
- promotion readiness aggregator;
- public UI expansion only after gates pass.

### Milestone 5: Consumer Save Layer

Goal: useful return behavior before paid.

Deliverables:

- lightweight identity/session model;
- saved Clawd position;
- saved notes;
- saved campaign previews;
- recent counties/districts.

### Milestone 6: Hosted Clawd Beta

Goal: paid feature starts after the save layer is useful.

Deliverables:

- Hosted Clawd persistence;
- business/location memory;
- saved campaigns;
- later: quests, evidence, XP, reports, exports;
- Stripe only after paid state is real and gated.

## Big 4 Ownership

**Axiom**

- release authority;
- architecture and scope arbitration;
- cut fake coverage;
- final pass/block.

**Mira**

- ChatGPT app comprehension;
- mobile density;
- tool language;
- recovery states;
- product proof.

**Lumen**

- voxel object quality;
- terrain/road/lot grammar;
- no-label recognition;
- screenshot gates.

**Forge**

- data/backend contracts;
- provider boundaries;
- source verification;
- split/deploy safety;
- later Hosted Clawd service skeleton.

## Automatic Rejection

Reject any slice that adds:

- fake playable counties;
- public Anaheim/Ontario before promotion gates;
- provider geometry in renderer;
- Google internals in web/widget renderer;
- dashboard creep;
- cars, humans, filler props, panels, or glows;
- paid, persistence, XP, evidence, OAuth, automation, reports, or exports
  without explicit reopen;
- large scenes in `structuredContent`.

## Next Action

Stabilize or park `0.23E`, then run the July 4 public Alpha release chain.
