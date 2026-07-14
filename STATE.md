# Atlas Loop State

Last run: 2026-07-13 - 0.78-1V Census County Board Product + Certification Gate
Loop level: L2 assisted
Kill switch: active only if `loop-constraints.md` says `pause: true`

## Current Repository Harness

Local canonical candidate:
`C:/Users/mzwin/Documents/Atlas` on `codex/integrate-hosted-clawd-fable-058e`.

Deploy status:
The committed 0.78-1 board wire is pushed through `0e94a6c`. The 0.78-1V
certification packet is local-green but not deployed. Production deploy remains
an explicit owner action through `scripts/release-deploy.ps1`, followed by
post-deploy and real-ChatGPT proof.

Merge status (0.75R, 2026-07-06):
`fable/0.58e-prop-cleanup` (0.57E parity + 0.72H-b/0.73F engine clarity +
0.74F perf/voxel superpass) is merged into this branch. The engine history
lives in BUILD_LOG (fable entries) and artifacts/0.73f-*/0.74f-*.

## Current Slice

`0.78-1V Census County Board Product + Certification Gate` is local green and
owner-approved. Release preparation is authorized; the coherent commit,
production deploy, and real-host G8 proof remain incomplete.

Decision:
`CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE`.

Selected axis:
`real_geography_promotion_readiness`.

Scope:
Atlas can now render a baked U.S. Census county boundary and water pack as the
primary widget scene when `?atlasGeoBoard=1` is explicitly requested. County
land uses a dedicated readable palette, the banner names the Census source and
unmapped streets/places, and unavailable place/pin/note/save controls stay
hidden. The feature-on audit covers Miami-Dade FL, Loving TX, and Kalawao HI at
desktop/mobile and light/dark: 138 checks passed, 0 warned, 0 failed; all 12
first frames keep the full projected county terrain/water footprint inside the
viewport; max Graphics 40/1600 and max rebuild 6.2ms/350ms. The separate flag-off audit
passed 162 checks with 0 warnings and 0 failures. The seven public MCP tools
remain unchanged. This is not a national bake, default-on promotion, public
playable-county claim, provider geometry path, or production deploy.

Next quest:
Build and certify one coherent release commit, deploy it through the explicit
release gate, and record real-host G8. After those gates, the next code slice
is `0.78-2 Real Town Anchors`.
`0.80-2` remains parallel queued graphics work.

Release governance:
The source-of-truth and loop-readiness verifiers now validate this 0.78-1V
packet instead of the retired 0.72B current-update assumption. Both are green;
loop readiness is `L2_ASSISTED` and reads the staged 46-file release envelope
without claiming unrelated working-tree artifacts as part of this packet.

Public tool truth:
The seven-tool surface remains unchanged. The save surface now defaults closed;
when it is closed, `get_upgrade_options` omits owner-gated persistence and
checkout capabilities instead of contradicting its Atlas V1 copy. Overlapping
"what data makes Eastvale playable" questions resolve to the playable-loop
answer, and hotel-family provider types outrank mixed spa/fitness amenities in
lookup-only normalization. These are local contract corrections, not a deploy
or a commerce continuation.

## Branch Map

- `codex/integrate-hosted-clawd-fable-058e` - local canonical candidate.
- `codex/hosted-clawd-service` - Hosted Clawd scaffold source branch.
- `fable/0.58e-prop-cleanup` - Fable cleanup source branch and secondary worktree.
- `fable/0.57e-generated-parity`, `fable/0.56e-label-layout`,
  `fable/0.55e-decal-discipline`, `fable/0.54e-grade-contrast` - Fable visual
  chain ancestors.
- Earlier Codex and Fable branches are history. Do not reopen them unless a
  verifier names an exact blocker.

## Gates

- Keep seven public MCP tools.
- Keep live money, public paid claims, and public launch flags closed.
- Stripe/money is open only for test-mode billing behind webhook-confirmed state.
- DB/Auth persistence is local-green only for owner-protected rows.
- Keep Anaheim/Ontario hidden and non-public.
- No provider-created geometry.
- No public deploy/promotion without live proof and human visual/deploy
  approval.
- Use `national-generation-contract` for strict split checks on this branch.

## Watch List

- Mobile `390x844` product comprehension.
- Hosted Clawd billing UX must stay as a compact tray rail over the Fable map;
  no dashboard, pricing page, plan comparison, or geometry change.
- Dirty tree size: strict split guard must stay `0 blockers / 0 unknowns` for
  the selected release envelope.
- Public URL baseline: `https://atlas-backend-production-e6fc.up.railway.app/preview`.

## Recent Proof

- 0.58J desktop setup-console screenshot:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-058j-setup-desktop.png`
- 0.58J mobile setup-console screenshot:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-058j-setup-mobile.png`
- Browser metrics:
  desktop `1280x800` and mobile `390x844` both had setupConsole=`grey`,
  active step=`Target`, duplicate step list=`false`, no horizontal overflow, and
  no console errors.
- Fable final design QA:
  `PASS` for 0.58K human visual gate, with only non-blocking nits.
- 0.59H DB/Auth decision packet:
  `docs/HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md`
- 0.60H persistence foundation:
  `artifacts/hosted-clawd/postalpha-0.60h-persistence-foundation.json`
- 0.61H save UX proof:
  `artifacts/hosted-clawd/postalpha-0.61h-save-ux.json`
- 0.62H Stripe test billing proof:
  `artifacts/hosted-clawd/postalpha-0.62h-stripe-test-billing.json`
- 0.63H protected tool gate proof:
  `artifacts/hosted-clawd/postalpha-0.63h-protected-tool-gate.json`
- 0.64H saved read surface proof:
  `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface.json`
- 0.64H saved shelf browser proof:
  `scripts/verify-hosted-clawd-saved-read-browser.mjs`
- 0.64H stub audit:
  `docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md`
- 0.65H Hosted Clawd browser proof:
  `artifacts/hosted-clawd/postalpha-0.65h-browser-proof.json`
- 0.65H browser proof verifier:
  `scripts/verify-hosted-clawd-browser-proof.mjs`
- 0.65H desktop browser screenshot:
  `artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-desktop-1280x720.png`
- 0.70H generated district proof:
  `artifacts/national-generation/0.70h/generated-district-specs.json`
- 0.70H delivery architecture:
  `docs/VOXEL_ENGINE_DELIVERY_ARCHITECTURE_0.70H.md`
- 0.71H generated draft scene packet proof:
  `artifacts/national-generation/0.71h/generated-draft-scene-packet.json`
- 0.71H scene packet service boundary:
  `docs/SCENE_PACKET_SERVICE_BOUNDARY_0.71H.md`
- 0.72B Redis scene packet backend proof:
  `artifacts/national-generation/0.72b/production-backend-spine.json`
- 0.72B Redis scene packet backend doc:
  `docs/REDIS_SCENE_PACKET_BACKEND_0.72B.md`
- 0.65H mobile browser screenshot:
  `artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-mobile-390x844.png`
- 0.66H mobile interaction hardening proof:
  `artifacts/product-quality-audit/0.66h/mobile-interaction-hardening.json`
- 0.66H metrics:
  `artifacts/product-quality-audit/0.66h/metrics.json`
- 0.66H desktop browser screenshot:
  `artifacts/product-quality-audit/0.66h/screens/mobile-hardening-desktop-1280x720.png`
- 0.66H mobile browser screenshot:
  `artifacts/product-quality-audit/0.66h/screens/mobile-hardening-mobile-390x844.png`
- 0.67H graphics cleanup proof:
  `artifacts/product-quality-audit/0.67h/graphics-cleanup.json`
- 0.67H desktop graphics screenshot:
  `artifacts/product-quality-audit/0.67h/screens/graphics-cleanup-desktop-1280x720.png`
- 0.67H mobile graphics screenshot:
  `artifacts/product-quality-audit/0.67h/screens/graphics-cleanup-mobile-390x844.png`
- 0.68H national generation production contract:
  `docs/NATIONAL_ENGINE_PRODUCTION_CONTRACT.md`
- 0.68H national generation proof:
  `artifacts/national-generation/0.68h/production-contract.json`
- 0.69H nationwide shell proof:
  `artifacts/national-generation/0.69h/nationwide-shells.json`
- 0.69H production readiness proof:
  `artifacts/national-generation/0.69h/production-contract.json`
- Local preview when the server is running:
  `http://127.0.0.1:8787/preview`
