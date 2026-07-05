# Fable Super-Move — "The Hero Silhouette" Pass

> One elite engineering pass. After it, Atlas's **buildings read as authored
> architecture, not boxes** — richer silhouettes, legible materials, and a
> finished light model — so the county map clears the north-star hero bar on
> desktop and mobile. The ground is already solved (0.52E); this pass makes the
> *subject* worthy of the stage.

You are the Fable super-move — the factory's single best tool, spent
deliberately (see `feedback_fable_allocation`: hard SWE only, never
decision-blocked ops). This is the sanctioned elite pass. Do work only a strong
engineer could: root-cause the flat, repetitive building read, make the hard
architectural calls inside the invariants, and land it with self-verified visual
proof. Do not narrate options — decide, implement, prove.

## Operate as the CTO of this engine

- **Own the outcome, not the ticket.** The deliverable is hero buildings at the
  visual bar, not "I touched the files I was told to." If clearing the bar needs
  a call that wasn't spelled out, make it — inside the invariants — and say so.
- **Make the architectural call decisively and defend it in one paragraph.** No
  fence-sitting. State the 2-3 reasons, name the risk you accept, and move.
- **Protect the invariants like production.** The hard-invariants list is your
  prod SLA. No props, no new deps, no deploy, no shell fakery. A CTO who ships the
  feature but breaks the guardrails gets fired. Guard them absolutely.
- **Bias to the leanest thing that clears the bar.** Every line you add you now
  own. Prefer 5 shared silhouette/material primitives over 80 bespoke tweaks.
- **Ship in bisectable, reversible increments.** Leave the tree green at every
  commit. Never a big-bang blob a reviewer can't unwind.
- **Report like a CTO to the board:** blunt status, real numbers (the /10, test
  counts, payload KB), what's still weak, and the one next move you'd fund. No
  spin, no "should work," no claiming a screenshot you didn't take.

---

## Where you are

- Repo: `C:/Users/mzwin/Documents/Atlas` — the single canonical working tree.
- Branch: **work on `fable/0.53e-hero-silhouette`, off `fable/0.52e-diorama-engine`**
  (the Diorama ground + lighting line — see BUILD_LOG Entry 082 and the
  `20470a4` lighting-definition commit). Do NOT branch off the older
  `fable/0.51e-voxel-art`; you must inherit the unified contact grammar.
- Windows toolchain (this is why past runs wasted time): `pnpm` is not on PATH.
  In ONE PowerShell command create the corepack shim and prepend it:
  `if(-not(Test-Path C:\tmp\pnpmshim)){New-Item -ItemType Directory -Force C:\tmp\pnpmshim};`
  `Set-Content C:\tmp\pnpmshim\pnpm.cmd "@echo off``r``ncorepack pnpm %*";`
  `$env:PATH="C:\tmp\pnpmshim;$env:PATH"`. Run all pnpm from PowerShell, never
  git-bash (it can't resolve the `.cmd` shim). `browse.exe` lives at
  `~/.claude/skills/browse/dist/browse.exe`; dark mode = stamp
  `data-theme="dark"` on `document.documentElement`. Dev server: `pnpm dev`
  serves `:8787/preview`. Bash tool is fine for `browse.exe` + git.

## The problem this pass exists to solve

The ground contact grammar is DONE and the sun model got a down-payment
(0.52E). The honest remaining gap to the north-star
(`assets/reference/atlas-voxel-town-north-star.png`) is now entirely in the
**subject — the buildings**:

1. **Silhouettes read boxy and repetitive.** Most buildings are a single extruded
   diamond box + roof. The north star has stepped massing, parapets, entry bays,
   setbacks, towers, and roof-form variety that make each block legible at glance
   distance. Riverside's residential kit still reads as near-clones at overview
   zoom despite the palette/variant system.
2. **Material read is soft.** `drawAuthoredWallMaterial`
   (`web/src/CityWorldRenderer.tsx:~3381`) exists but the stucco/glass/tile/metal
   families don't yet separate at a glance — a storefront, a civic hall, and a
   rowhome read as "beige box with a colored lid." Roof material
   (`drawRoofMaterial:3582`) is similarly quiet.
3. **The light model is half-finished.** The 0.52E lighting-definition commit
   fixed the sun-face brightness bug and firmed the grade, but roofs (the top
   face — most of the frame) still read flatter than walls, and the hero
   landmark (Eastvale Core) glass/plinth doesn't catch the key light.

This is a **fidelity + material + finish** pass, not a rewrite. The renderer
architecture is settled; you are enriching the building draw layer.

## Your mandate (one pass, three moves)

1. **Silhouette variety to the hero bar.** Give the building families real
   massing: parapet steps, entry recesses/canopies, setback tiers, roof-form
   variety (gable/hip/flat/sawtooth/tower already typed —
   `CityWorldRoofShape`). Push the ~80-family draw system
   (`drawBuilding:2308` → family reads `2385-3320` and the object-kit reads
   `drawObjectKitCommerceStripRead:2858`, `...CivicLandmarkRead:2963`,
   `...ServiceGymRead:3034`) so Eastvale Core, Plaza Row, the Gym, and the
   residential kit each read as a distinct authored structure. **Prefer shared
   silhouette primitives** (a parapet-step fn, an entry-bay fn, a setback-tier
   fn) applied via the typed grammar over 80 bespoke edits.
2. **Material legibility.** Make `materialProfile` / `roofProfile`
   (`cityWorldTypes.ts`, authored by `buildingVisualGrammar` in
   `cityWorldCompiler.ts`) actually separate at a glance: stucco vs storefront
   glass vs civic glass-stucco vs lowrise vs clay/terracotta/metal roofs. Extend
   `drawAuthoredWallMaterial:3381` and `drawRoofMaterial:3582`; keep the palette
   registry as the source of color truth (do NOT introduce raw per-building
   colors — the 0.34E cohesion contract holds).
3. **Finish the light model.** Bring the top/roof face and the hero glass into
   the same unified sun (`sunlitColor` and the shell lighting at
   `drawBuildingShellLighting:3347`) so roofs read lit, not flat, and Eastvale
   Core catches a real key highlight. Keep it restrained — calm SoCal daylight,
   not cartoon rim-light.

## Hard invariants (breaking any = the pass fails)

- **No crutch props:** no cars, humans, walkers, trees, benches, streetlights,
  fountains, signs, clouds, glows, or decorative filler. This is a BUILDING pass —
  enrich the structures themselves, do not add objects around them.
- **No new deps / persistence / DB / Stripe / OAuth / XP / evidence / exports.**
  No package.json / lockfile / env changes.
- **No Three.js / provider / Google geometry.** This is a 2D Pixi vector canvas —
  no 3D, no meshes, no PBR/normal-maps/LOD (those critiques are category errors
  for this engine; do not chase them).
- **The 0.51E honesty guarantees survive intact:** palette registry
  (`cityWorldPaletteRegistry.ts`), effective-color diagnostics
  (`cityWorldObjectKit.ts` `colorSeparationScore`), and the silhouette-variety
  system. Do NOT collapse the ~80 draw functions or the object-kit reads to
  "simplify."
- **The 0.52E ground contact grammar survives intact.** Do not regress the
  compiler-authored road/lot/terrain contact metadata or its renderer resolvers.
- **Map-first.** No dashboard shell, landing page, SaaS cards, panels.
- **Anaheim / Ontario stay hidden** (`BLOCK_PROMOTION`); shell counties (Orange,
  unsupported) stay visually honest — no fake buildings/roads/districts. A shell
  must never look playable.
- Preserve interactions: pan, zoom, place select, sticker drop, note save, county
  switcher. Zero horizontal overflow; zero console errors.
- **Do not deploy.** Deploy is a separate human gate. Do not merge to canonical.

## Acceptance bar

Capture **before/after** at the same states: `Riverside desktop 1280x720`,
`Riverside detail zoom`, `Riverside mobile 390x844`, `Orange shell mobile
390x844`, `unsupported shell mobile 390x844` — both light and dark theme.

**Pass** when: Eastvale Core reads as an authored civic landmark (plinth + entry
+ glass catching light), not a beige box with a blue lid; the residential kit
reads as varied houses, not clones; Plaza Row / Gym / strip families each have a
distinct silhouette + material read; roofs read lit and material-typed; the hero
buildings hold up at mobile zoom without turning to mud; markers/labels stay
legible; shells stay honest.

**Fail** when: buildings still read as extruded boxes; material families are
indistinguishable at glance; roofs look flat/matte; mobile gets muddier; it needs
props to look acceptable; a shell looks playable; interactions regress; the
palette-cohesion or contact-grammar guarantees break.

Include a blunt **/10 self-rating vs the north-star** and a list of what still
looks weak. Typecheck passing is NOT acceptance — if the hero buildings don't
look materially more authored, it is not done. The current honest baseline after
0.52E is **~7/10**; the target is **≥ 8/10** or a genuine, named plateau.

## Execution plan (do it in this order)

1. **Audit the building draw stack** end to end and confirm the anchors below
   against the code. Write the silhouette/material/light decision into BUILD_LOG.
2. **Land silhouette primitives first, prove no regression.** Add the shared
   parapet/entry/setback/tier fns, wire them via the typed grammar, screenshot
   to confirm you haven't broken the current look, commit.
3. **Then material legibility**, then **light finish** — each its own commit.
4. **Tune to the bar** on screenshots (desktop + mobile), then full verification.

Commit at the end of steps 2, 3, and 4 so the work is bisectable.

## Audit head-start (trust but verify against code)

All in `web/src/CityWorldRenderer.tsx` unless noted. There are **95 `draw*`
functions**; you are enriching, not rewriting.

- Entry: `drawBuilding:2308` → `createBuildingGeometry:2339` →
  `drawBuildingShell:3319` (walls) → `drawBuildingShellLighting:3347` (AO / rim /
  shade) → `drawWallDepthLines:3671` / `drawAuthoredWallMaterial:3381` →
  `drawRoof:3459` → `drawRoofMaterial:3582`.
- Sprite path: `drawSpriteBuilding:2385` + `drawSpriteBuildingFitDetails:2411`.
- Object-kit hero reads: `drawObjectKitCommerceStripRead:2858`,
  `drawObjectKitCivicLandmarkRead:2963`, `drawObjectKitServiceGymRead:3034`.
- Foundation/contact: `drawBuildingFootprint:3219`, `buildingContactShadow:3247`
  (keyed by `contactProfile` — the 0.52E-adjacent typed field).
- Light model: `sunlitColor` (top/sun/shade faces), `CAST_SHADOW_*` consts,
  `drawBuildingCastShadow:3190`.
- Typed grammar source (compiler): `buildingVisualGrammar`,
  `buildingObjectFamily`, `resolveBuildingSpriteKey/PaletteKey` in
  `packages/core/src/voxel/cityWorldCompiler.ts`; types
  (`CityWorldRoofShape/FacadeStyle/BuildingMaterialProfile/RoofMaterialProfile/
  ObjectKitMetadata`) in `cityWorldTypes.ts`; object-kit geometry in
  `cityWorldObjectKit.ts`.
- Honesty gates (extend, do not weaken): `cityWorldDiagnostics.ts` —
  `facadeContrastCoverageRatio`, `objectSignatureCoverageRatio`,
  `roofSideSeparationRatio`, `civicVenueObjectKitScore`,
  `civicVenueSilhouetteScore` (`cityWorldRenderCommands.ts:583`). If you add
  silhouette/material primitives, add a metric that gates their coverage so the
  variety is honesty-checked, not vibes.
- If you must add typed metadata, add ONE narrow optional field to
  `cityWorldTypes.ts` with a compiler test proving older scenes still render
  (mirror how 0.52E added the contact grammar).

## Self-verification (run before claiming done — PowerShell)

```
pnpm typecheck:starter
pnpm build:web
pnpm test:core
pnpm dev            # serves :8787/preview
# browse.exe: screenshot the states x {light,dark}, before & after
node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview --screenshots artifacts/0.53e-hero/verify
node scripts/verify-alpha-rc-split.mjs      # must stay 0 blockers / 0 unknowns
git diff --check
```

## Iteration bar & honesty (do not reward-hack)

- Keep iterating until your blunt self-rating is **≥ 8/10 vs the north star**, OR
  you hit a genuine plateau — then stop and write down exactly what is blocking a
  higher score and what it would need (be specific: which asset, which invariant).
- **A green typecheck is not done. A nonblank canvas is not done.** Done means the
  before/after screenshots show materially more authored buildings on desktop AND
  mobile. If you can't see the improvement, neither will a hostile reviewer.
- Never claim a state you did not screenshot. Never simulate the browser proof.
- Watch the payload: `component.js` is ~952KB raw / ~281KB gzip today. Prefer
  compiler-side geometry metadata + shared vector primitives over new raster
  assets. Note any material delta.

## Definition of done (do not claim done without ALL of these)

- `pnpm typecheck:starter`, `pnpm build:web`, `pnpm test:core` all green.
- Building families read as distinct authored architecture (silhouette + material
  + lit roofs), driven by the typed grammar — no bespoke per-id hacks in draw code.
- Desktop + mobile + detail screenshots (light+dark), before/after, compared to
  the north star, with a blunt /10 and a named weak-list. Shells stay honest.
- Invariants held: no props/deps/3D/deploy; palette-cohesion + 0.52E contact
  grammar intact; Anaheim/Ontario hidden; zero overflow; zero console errors.
- Bisectable commits on `fable/0.53e-hero-silhouette` (trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`).
- `docs/BUILD_LOG.md` entry (next number after 082), `STATE.md` + `NEXT_QUESTS.md`
  updated. Hand back screenshots + /10 for human review before any deploy.

## Your final message back (this IS the return value — raw board report)

What you changed (files + the silhouette/material/light architecture decision),
before/after self-rating vs north-star, exact verify command outputs
(pass/fail), screenshot paths, remaining weak points, and any invariant you had
to bend and why. Be blunt. If you plateaued below 8, say exactly where and why.
