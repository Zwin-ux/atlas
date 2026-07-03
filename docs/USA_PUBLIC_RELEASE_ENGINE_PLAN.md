# Atlas USA Public Release Engine Plan

## Goal

Atlas should become a high-quality ChatGPT app for exploring the United States
as voxel county worlds. The release path is not "make Eastvale bigger" and it
is not a national canvas. The release path is a disciplined engine that can
compile bounded county and district scenes from normalized data, show honest
coverage state, and preserve the map-first product loop everywhere.

Eastvale/Riverside is the proof cell. Public release requires the same quality
rules to work for California, then the rest of the USA, without falling into
generic dashboards, raw provider maps, or decorative clutter.

## Current Status

Atlas is past Alpha Path B and is in Engine Beta. Riverside/Eastvale is the
only playable county slice. California has 58 indexed counties, with Riverside
at `L2_CURATED_DISTRICT` and the other 57 counties at `L1_COUNTY_SHELL`.
Unknown counties return `L0_UNSUPPORTED`. Shell and unsupported states must
stay honest and recover to the playable Riverside/Eastvale proof instead of
pretending to have local worlds.

The current product surface is map-first: full-screen Pixi city map, compact
county switcher, coverage truth line, selected-place tray, map controls,
session-only pins/stickers, and session-only notes. This remains the product
spine until a second playable district proves the engine can generalize.

## Product Bar

Public Atlas must open directly into an explorable world:

- full-screen voxel map, small HUD/tray, no landing page or dashboard shell;
- county and district selection inside the map-first flow;
- selected-place tray, pan/zoom, sticker/pin, and session note loop intact;
- clear unsupported-state behavior when a county is not ready;
- no cars, walkers, filler signs, glows, panels, or labels used to hide weak
  object quality;
- no persistence, Stripe, XP, evidence, OAuth, automation, reports, or exports
  unless those gates are explicitly reopened.

The first three seconds must read as a toy-like county map with real local
identity, not a prototype board or a generic data app.

## Architecture Principle

USA scale is a coverage and compilation problem. The renderer never receives
raw provider payloads and never attempts to render the whole country.

```txt
Provider APIs / curated packs
  -> GeoDataAdapter
  -> NationalGeoIndex
  -> CountyQualityTier
  -> CountyWorldBuilder
  -> DistrictSceneCompiler
  -> CityWorldScene
  -> Pixi CityWorldRenderer
```

The backend owns provider credentials, normalized identity, source notes,
confidence, cache keys, TTLs, category mapping, and future saved state. The
frontend owns bounded scene rendering, camera feel, local session stickers and
notes, and the ChatGPT widget interaction surface.

## Coverage Tiers

Coverage must be explicit. Atlas should never pretend every county is equally
ready.

| Tier | Name | User Meaning | Engine Requirement |
| --- | --- | --- | --- |
| L0 | Unsupported | Atlas knows the county is not ready. | Return a clear unsupported response and safe next action. |
| L1 | County Shell | County exists in the national index. | State/county identity, bounds metadata, empty-safe map shell. |
| L2 | Curated Playable District | At least one district is hand-curated enough to explore. | District pack, places, starter scene, source notes, confidence notes. |
| L3 | Provider-Normalized County | Provider data can fill categories and place density. | Adapter normalization, TTL/cache/source notes, no raw payload leakage. |
| L4 | Public-Quality County | County can be shown without apology. | Visual QA, mobile QA, stable product loop, honest data copy, rollback path. |

Public release can include mixed tiers. The UI and tools must say what is ready
instead of hallucinating high-confidence coverage.

## Engine Pillars

### 1. National Identity

Add stable IDs before broad data:

- country: `us`
- state: USPS code plus slug
- county: normalized county slug, FIPS when available
- district: Atlas-authored playable district slug
- place: provider-independent place ID with source references

Every object in a compiled scene should trace back to county/district/place
identity or to a renderer-only support role.

### 2. County Data Packs

Curated packs remain valid, but they must evolve into a consistent shape:

- `county`, `state`, `slug`, `version`, `lastUpdated`;
- cities/districts/corridors;
- place summaries and category tags;
- map nodes/edges;
- source notes and confidence notes;
- coverage tier and known gaps.

The pack is not final truth. It is the controlled input to a compiler.

### 3. Provider Normalization

Google, Census, OpenStreetMap-derived sources, and open city/county datasets
are provider inputs, not renderer contracts. Every provider result must become
Atlas-shaped data before it can influence the scene.

Required normalized concepts:

- `WorldPlaceCategory`;
- source and attribution note;
- freshness / TTL;
- confidence level;
- privacy-safe public/business-oriented description;
- category density signal, not individual targeting.

### 4. Scene Compiler

The compiler turns county/district data into bounded `CityWorldScene` slices.
It should decide:

- district camera presets;
- terrain and water/support modules;
- road/lane/lot grammar;
- building family selection;
- place anchors;
- marker and selected-place metadata;
- primitive fallback keys for every sprite-backed object.

The renderer should draw the scene. It should not invent data, provider logic,
or product state.

### 5. Object Kit

USA scale needs a repeatable object kit, not random one-off sprites.

First durable families:

- residential: cottage, ranch, rowhome, lowrise apartment;
- local commerce: strip store, corner store, cafe/service;
- road/lots: straight, corner, cross/T, driveway join, sidewalk, parcel pad;
- civic/landmark later, only after residential and commerce feel credible.

Rules:

- every asset-backed object has primitive fallback;
- every building has footprint, foundation/contact, roof massing, side-face
  separation, and mobile-readable entry/window rhythm;
- no cars, humans, trees, water, signs, panels, glows, or labels as
  compensation for weak object design;
- expansion is allowed only when the existing kit passes desktop and 390x844
  screenshots.

### 6. Camera And Performance

Every supported district needs deterministic QA cameras:

- desktop core;
- mobile core;
- residential/detail crop;
- rollback-safe default.

Performance targets for public release:

- one nonblank Pixi canvas;
- no horizontal overflow;
- clean console;
- bounded object count per scene;
- progressive loading by county/district, never national full-canvas loading.

### 7. ChatGPT Tool Surface

The MCP surface should stay stable while the engine grows:

- tools return concise `structuredContent`;
- large scene data stays in `_meta`;
- unsupported counties return clear, useful responses;
- session-only state remains explicit until persistence is reopened;
- no tool claims saved memory, paid features, XP, evidence, reports, or
  automation before those gates are real.

## Release Roadmap

### Engine Beta 1: Eastvale Quality Cell

Status: deployed baseline.

Goal:
Ship a cleaner Eastvale/Riverside map with controlled residential grammar,
asset-backed building intake, quieter terrain, better camera framing, and the
Alpha ChatGPT loop preserved.

Done when:

- no cars/walkers/filler props;
- rowhome/strip-store path works with fallback;
- repeated generic homes are reduced;
- desktop and mobile screenshots are showable;
- MCP/submission/product-loop verification passes.

### Engine Beta 2: California Coverage Contract

Status: deployed baseline.

Goal:
Define the data and tool contract for California-scale expansion before adding
many counties.

Deliverables:

- county coverage tier schema;
- California county index contract;
- unsupported county response contract;
- district selection model;
- QA fixture for Riverside, Orange shell, and unknown L0 behavior.

### Engine Beta 3: Production Voxel Map Upgrade

Goal:
Make Riverside/Eastvale feel public-grade before adding more playable districts.

Deliverables:

- road module geometry for straight, corner, cross/T, driveway join, and lot
  pads;
- controlled residential variety: cottage, ranch, rowhome, lowrise apartment;
- quieter terrain density through parcel shadows, chunk edges, and field
  variation, not filler props;
- deterministic QA cameras for desktop core, mobile core, and residential
  detail;
- desktop and `390x844` mobile screenshots that improve or at least hold the
  current public loop.

### Engine Beta 4: Generic County Shell Compiler

Goal:
Every indexed county can compile an honest shell scene without pretending it is
fully authored.

Deliverables:

- state/county selector flow;
- `CountyWorldBuilder` shell output;
- empty-safe terrain/camera;
- clear "coverage not ready" tray copy;
- no fake business/place detail.

### Engine Beta 5: California Playable Districts

Goal:
Move from one proof district to a small California set that proves repeatable
quality.

Candidate set:

- Riverside/Eastvale as the quality anchor;
- one coastal county/district;
- one dense urban county/district;
- one rural/inland county/district.

The point is variety pressure: the engine must handle different county shapes
without becoming generic.

### Engine Beta 6: Provider-Normalized Places

Goal:
Introduce live or cached provider-derived place categories behind adapters.

Requirements:

- no provider payloads in renderer;
- source notes and TTL visible where needed;
- category map tests;
- quota/rate-limit behavior;
- public/business-safe language.

## Immediate E11 Chain

1. `E11.1 Road Module Geometry`
   - Make roads/lots physically coherent under buildings.
   - No cars, humans, decorative signs, filler props, dashboard panels, or
     product-state changes.
2. `E11.2 Residential Variety In Production`
   - Replace cloned red-roof repetition with a small controlled residential kit.
   - Families: cottage/front-gable, ranch/low-gable, rowhome strip, lowrise
     apartment.
3. `E11.3 Camera And Visual Density`
   - Reduce empty-board first read while keeping mobile usable and map-first.
   - Add deterministic QA cameras instead of manual screenshot hunting.
4. `E11.4 California District Candidate Pack`
   - Pick California district candidates and write L2-ready contracts.
   - Do not claim provider-normalized or public-quality coverage yet.
   - Current candidate-only anchors: Anaheim in Orange County and Ontario in
     San Bernardino County. They remain non-playable L1 shell metadata until
     curated packs and proof exist.
5. `E11.5 Second Playable District`
   - Implement one non-Riverside playable district end to end.
   - If the engine does not generalize cleanly, stop expansion and fix the
     compiler/object kit first.

### Public Beta: California

Goal:
Ship California with honest coverage tiers.

Public Beta can launch with some counties at L1/L2 and a smaller number at
L4. The product must make readiness visible instead of implying full parity.

### Public Release: USA

Goal:
Ship national Atlas access with clear county readiness, strong visual engine
rules, and stable ChatGPT behavior.

Minimum release conditions:

- every US county has normalized identity and an L0/L1 response;
- supported counties compile bounded scenes;
- public-quality counties meet screenshot and product-loop gates;
- unsupported/low-tier counties do not hallucinate places or local claims;
- provider-derived data has source, TTL, and confidence;
- map-first UI survives desktop/mobile QA;
- paid/persistence/automation features remain absent unless implemented and
  approved through separate gates.

## Team Operating Model

### Axiom

Owns architecture, release authority, scope arbitration, rollback decisions,
and the USA engine roadmap.

### Lumen

Owns voxel engine taste and object-kit quality. Rejects slop, pasted-on assets,
prop compensation, generic cuboids, and module sprawl.

### Mira

Owns product engineering quality: ChatGPT interaction, browser verifier,
desktop/mobile evidence, session-state copy, and human approval packet.

### Forge

Owns clean worktrees, split guards, deploy mechanics, backend-risk isolation,
and provider/storage readiness when those lanes reopen.

## Verification Gates

Every engine code slice:

- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `node scripts/verify-alpha-product-loop.mjs --url <preview> --screenshots <dir>`

Every coverage/data slice:

- schema tests for county/world data;
- unsupported county test;
- source/confidence note test;
- no raw provider payload reaches renderer contracts.

Every public release candidate:

- desktop 1280x720 screenshot after place select, sticker, and note;
- mobile 390x844 screenshot after place select, sticker, and note;
- Lumen visual P0/P1 audit;
- Mira product/readiness packet;
- Forge staged-file/deploy audit;
- public MCP/submission/preview/product-loop verification after deploy.

## Hard Rejections

- rendering the whole USA as one canvas;
- raw Google/provider payloads in Pixi or React;
- unsupported counties pretending to have real local data;
- decorative cars/humans/props used to make weak maps look busy;
- generic SaaS dashboard shells;
- broad persistence, Stripe, XP, evidence, OAuth, automation, reports, or
  exports before Engine Beta quality is credible and explicitly approved;
- module expansion before the current object kit passes desktop/mobile
  screenshots.

## Next Execution Chain

1. Finish and decide the current Eastvale Engine Beta renderer upgrade.
2. Add a county coverage tier schema and California county index contract.
3. Build a generic county shell compiler with honest unsupported/low-tier UI.
4. Add two to three California pilot counties as curated L1/L2 fixtures.
5. Expand the object kit only after rowhome/strip-store/residential foundations
   stop reading as prototype art.
6. Introduce provider-normalized places behind adapters after the shell compiler
   is stable.
7. Promote California to Public Beta before claiming USA public release.
