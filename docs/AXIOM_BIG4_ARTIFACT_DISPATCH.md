# Axiom Big 4 Artifact Dispatch

Status: active E15 dispatch.

Purpose:
Keep the Big 4 on build artifacts that move Atlas toward a real voxel county
engine. This is not a meeting log. Each packet below must produce code,
verifiers, data contracts, screenshots, or durable proof.

## Current Cutline

Riverside/Eastvale remains the only public playable district. Anaheim and
Ontario remain hidden candidate/draft lanes until promotion packets pass.

The next work expands scope through systems, not filler:

- bigger voxel-engine grammar;
- stronger hidden-draft district proof;
- machine-readable promotion readiness;
- clearer ChatGPT app language;
- no public playability claim until all owners pass.

## Reference Stack

Use `docs/AXIOM_ENGINE_REFERENCE_STACK.md` before changing E15 scope. The
ChatGPT app skill is adopted as a checklist source only, not installed as an
Atlas dependency. Voxel/isometric GitHub references are used for engine taste
and render-system thinking, not immediate package adoption.

## E15.1 Candidate Readiness Aggregator

Owner: Forge.

Artifact:
Build a candidate-readiness aggregator that turns promotion packet state into a
single machine-readable decision for Anaheim and Ontario.

Required behavior:

- Read promotion packet state for each candidate.
- Report `readyForPlayablePromotion: false | true`.
- Group blockers by `data`, `visual`, `product`, and `release`.
- Include a source-to-scene trace:
  candidate pack -> source anchors -> curated/draft pack -> compiler proof ->
  visual packet -> product proof -> split guard.
- Keep Riverside/Eastvale as the only public playable path.

Expected output:

- script such as `scripts/verify-second-district-readiness.mjs`;
- tests or script fixtures proving Anaheim/Ontario stay non-playable when gates
  are missing;
- docs that make the command obvious for Axiom.

## E15.2 Hidden Draft Voxel Grammar System

Owner: Lumen.

Artifact:
Build actual hidden draft voxel grammar, not a critique note. The first target
is Anaheim. The default two-anchor native pair is Anaheim Convention Center plus
ARTIC/Angel Stadium area.

Required behavior:

- Improve reusable venue/transit/commercial grammar: roof massing, facade
  rhythm, foundations, lot contact, road grounding, top/left/right face
  separation, and restrained SoCal palette.
- Prove hidden draft scenes are non-public and non-playable.
- Make screenshot packet assembly harder to fake.
- Require that at least two anchors are recognizable before labels before any
  promotion discussion.

Expected output:

- compiler/renderer/asset-system changes only if they serve hidden draft grammar;
- draft-scene and visual-packet verifier improvements;
- desktop `1280x720`, mobile `390x844`, and detail-camera evidence when a
  preview path exists;
- visual readiness marked false if labels are still required.

## E15.3 ChatGPT Entry Surface

Owner: Mira.

Artifact:
Build a product-language proof that normal ChatGPT users understand without
reading internal readiness language.

Required public language:

- Play Riverside/Eastvale now.
- Browse California shell counties.
- Lookup places without saving.

Required behavior:

- Tool responses should not mention compiler drafts, promotion packets, GEOID,
  internal verifiers, or fake readiness.
- Lookup remains lookup-only, not saved state or coverage proof.
- Shell and unsupported states recover to Riverside/Eastvale.
- Seven-tool MCP list remains stable.

Expected output:

- tool response copy improvements if needed;
- focused MCP/lookup/county-switcher verifier assertions;
- evidence docs or generated proof showing the protected language.

## Axiom Integration Order

1. Integrate Forge first if the change is pure data/readiness/split guard.
2. Integrate Lumen second if screenshots or hidden draft verifiers show a real
   engine-quality improvement.
3. Integrate Mira third if public copy/tool output becomes clearer or safer.
4. Run combined verification before deploy discussion.

Combined verification:

```powershell
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts\verify-engine-beta-coverage.mjs
node scripts\verify-big4-artifact-packets.mjs --json-only
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

## Rejection Rules

Reject any packet that:

- exposes Anaheim or Ontario as public playable;
- adds cars, humans, decorative clutter, panels, or labels to hide weak art;
- opens DB, Hosted Clawd, persistence, Stripe, XP, evidence, OAuth, automation,
  reports, exports, package drift, or env drift;
- changes the seven-tool list without explicit Axiom approval;
- reports only an opinion when code/verifier/docs evidence was available.

## Next Larger Scope

After E15:

- E16 compares Anaheim versus Ontario with the readiness aggregator.
- E17 builds the first second-district promotion candidate only if one clears
  data, hidden visual, product, release, and screenshot gates.
- E18 expands the same readiness contract toward broader California and then
  USA county identity, still with mixed honest coverage tiers.
