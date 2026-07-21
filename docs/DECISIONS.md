# Decisions

## Decision 107: Submit the focused session-only County Scout

The first submission target is Atlas County Scout, not every planned Atlas
system. It keeps the seven-tool MCP surface, Riverside/Eastvale as the curated
full map, and session-only Scout/campaign previews. Auth, saved-account work,
billing, and Hosted Clawd are deferred.

Every one of the 3,222 supported counties must still expose real U.S. Census
town anchors. Those names may be placed on deterministic preview layouts, but
streets, buildings, businesses, and local coverage must remain explicitly
generated or unverified. Exact county geometry is used only where a certified
pack exists.

Decision id:
`SUBMIT_FOCUSED_SESSION_ONLY_COUNTY_SCOUT_WITH_NATIONAL_TOWN_ANCHORS`.

Human gates remain: clean deployment, Railway worker healthcheck, real-ChatGPT
G8 on web/mobile, portal domain token, publisher identity/permissions, tool/CSP
scan, and the submission action itself.

## Decision 106: Explore is the face; Clawd is the transformation

Atlas opens as a tactile living atlas, not a business workflow or dashboard.
The free product loop is `Explore -> Ask -> Learn -> Note -> Wander`. Clawd
appears only after explicit opportunity intent and transforms selected
geography into a session-only Scout and Campaign preview.

Notes, pins, and stickers remain session-only. Hosted Clawd persistence,
billing, and public paid claims stay closed until authenticated ownership,
durability, and real-host gates exist. The current Alpha may retain a bounded,
intent-only Scout preview without presenting a paid entitlement that is not
live.

Decision id:
`EXPLORE_FACE_CLAWD_TRANSFORMATION_SESSION_DEFAULT`.

Reason:
This preserves Atlas's strongest identity: ChatGPT grows a map. It also keeps
the Scout payoff without turning the map into wallpaper behind reports,
upgrade chrome, or generic SaaS controls.

## Decision 105A: 0.78-1V owner review passed; release work is authorized

The owner approved the 0.78-1V product backlog and directed the team to
continue on 2026-07-13. The 12-cell screenshot gate is passed and production
release preparation is authorized. Deployment and real-host G8 remain factual
execution gates and cannot be self-attested.

Evidence:
`artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md`.

## Decision 105: Public tool truth outranks owner-gated capability state

`ATLAS_SAVE_SURFACE` is an explicit opt-in and defaults off. When it is off,
`get_upgrade_options` may explain the Atlas V1 session boundary, but it must not
return owner-gated Hosted Clawd persistence, checkout, paid mode, enabled
actions, or billing state in `structuredContent` or `_meta`. Internal flags and
adapters remain available to the fenced owner test surface; they are not public
product truth.

County-question routing resolves an explicit Eastvale playable-loop ask before
the broader source-keyword fallback. Provider normalization gives a bounded
hotel-family type priority over mixed spa or fitness amenities and represents
accommodation as a local service. Neither rule makes provider results geometry,
coverage readiness, persisted state, or a playable claim.

## Decision 104: Loop readiness follows the canonical gated packet

The source-of-truth and loop-readiness verifiers must validate the active
`artifacts/current-update.json` packet, not retain a hard-coded earlier slice.
For 0.78-1V they require the flag-dark Census board contract, passed owner
review, owner-authorized but pending deploy, pending real-host G8, the
seven-tool MCP surface, and the gated 0.78-2 continuation.

The loop split check reads the staged `national-generation-contract` envelope.
That is the releasable packet; unrelated pre-existing working-tree artifacts
must not be silently adopted into it. This changes release governance only. It
does not enable the flag, deploy production, add tools, or begin town detail.

## Decision 103: Census county boards stay dark until product certification and owner review

0.78-1V certifies the first real-geography county boards without promoting
them to the default public experience.

Decision:
County boards compile the baked U.S. Census boundary and water pack in the
widget, use an explicit county-map terrain palette, identify the county in the
honesty banner, and hide place/pin/note controls until real anchors exist. The
browser verifier must exercise `atlasGeoBoard=1` directly across desktop,
mobile, light, and dark while preserving a separate flag-off regression
matrix. County camera presets must center and fit the full projected isometric
terrain/water footprint; tile-axis span is not a valid framing proxy. The
feature audit must fail when any first-frame county silhouette leaves the
certified viewport.

Decision id:
`CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE`.

Reason:
The original wire was technically correct but the land nearly disappeared
against the light surround, the board showed unusable place controls, and the
standard audit did not enter the feature flag. A feature is not promotion-ready
until its copy, first-frame screenshots, interaction surface, Graphics count,
rebuild latency, and complete projected silhouette framing are all measured on
the actual flagged path.

Allowed next:
- Build one coherent certified release commit and run the authorized deploy.
- Record post-deploy G8 in real ChatGPT.
- `0.78-2 Real Town Anchors` after those release gates.

Still blocked:
- Default-on Census boards, national 3,222-pack claims, roads, town detail,
  persistence, new MCP tools, provider geometry, public Anaheim/Ontario,
  public paid claims, reports, exports, evidence, XP, and automation.

## Decision 102: Generated landmarks read county parameters

0.76-2 replaces the universal generated water-tower landmark with
parameter-spine landmarks.

Decision:
Generated USA districts carry the resolved `CountyGenerationParameters` into
the parametric scene generator before landmark selection. The generator may key
the signature landmark primarily from `archetype` and bias massing labels,
proportions, and host reads from `nameSignal`, `regionProfile`, `climate`, and
`modulation`, but it must not re-derive landmark identity from ad hoc
county-name parsing alone.

Decision id:
`GENERATED_LANDMARKS_READ_COUNTY_PARAMETERS`.

Reason:
NS-6 region identity cannot scale if every generated county shares the same
water-tower marker. The landmark must be structural: coastal pier hall, river
boathouse, desert mesa tower, mountain ridge lodge, prairie grain-elevator
tower, and metro civic tower.

Still blocked:
- New prop kinds, new dependencies, Three.js, renderer seam changes, MCP tool
  changes, curated Riverside edits, provider geometry, persistence, money,
  public Anaheim/Ontario promotion, generated public-playable claims, reports,
  exports, evidence, XP, and automation.

## Decision 101: County generation uses a config-driven parameter spine

0.76-P adds a typed county parameter model for deterministic generated
districts.

Decision:
Generated county identity resolves through
`resolveCountyParameters(county, seed)` before spec assembly. The resolver
composes archetype profile, Census division region profile, climate band and
aridity proxy, lexical name signals, bounded palette/density/relief modulators,
and seed into `CountyGenerationParameters`.

Decision id:
`COUNTY_PARAMETER_MODEL_SPINE_CONFIG_DRIVEN`.

Reason:
NS-6 cannot scale from six flat buckets plus jitter. The reviewable surface is
now typed config: `ARCHETYPE_PROFILES`, `STATE_TO_DIVISION`,
`REGION_PROFILES`, and `NAME_SIGNAL_TOKENS`. The generator stays a deterministic
interpreter of parameters, and renderer contracts stay unchanged.

Allowed next:
- `0.76-2 Region-aware landmarks` as the next READY 0.76 packet, using the
  parameter spine instead of reopening classifier or palette plumbing.

Still blocked:
- New dependencies, provider geometry, new MCP tools, persistence, money,
  public Anaheim/Ontario, generated public-playable claims, reports, exports,
  evidence, XP, automation, and renderer seam changes.

## Decision 100: Generated districts carry compiler-authored regional palettes

0.76-1 adds typed regional palette identity for generated district archetypes.

Decision:
Generated district specs carry an optional `regionalPalette` selected from
`REGIONAL_PALETTES`. When present, the parametric compiler authors regional
building palette keys and regional terrain palette keys. When absent, the
legacy kind-keyed building pools and terrain keys remain the path.

Decision id:
`GENERATED_DISTRICTS_USE_COMPILER_AUTHORED_REGIONAL_PALETTES`.

Reason:
The player-facing region read must be authored before rendering, not inferred
from ids in Pixi. Registered regional palette keys also keep atlas validation
strict and keep diagnostics measuring effective rendered colors.

Allowed next:
- `0.76-2 Region-true landmarks` as the next READY 0.76 packet.

Still blocked:
- New geometry from this palette packet, provider-created geometry, public
  playable claims for generated counties, new MCP tools, persistence, money,
  public Anaheim/Ontario, reports, exports, evidence, XP, and automation.

## Decision 099: 0.72H-b fixes generated labels but is still a review candidate

The sibling Fable worktree now has a stronger generated-draft visual candidate:
`artifacts/0.72h-b-roof-label-cleanup/FABLE_RESULT.md`.

Decision:
Treat 0.72H-b as the current review candidate for the generated draft visual
quality gate. It resolves the visible generated-place label blocker by routing
generated preview mode through explicit label suppression and by gating
`data-qa-place-labels="suppressed"` in the browser verifier. It is not merge
acceptance.

Decision id:
`FABLE_072H_B_REVIEW_CANDIDATE_NOT_MERGE_ACCEPTANCE`.

Reason:
The browser proof and screenshots now show a no-label generated district at
desktop and 390x844 mobile sizes, and the parity gate adds residential roof
safety checks. The remaining product-quality weakness is not another backend
service problem: the preview banner still covers part of the scene, and some
residential detail still reads procedural. The next useful visual slice is a
bounded residential object-kit authorship pass, not more labels, scope, or
platform work.

Allowed next:
- File-by-file Codex review of the five 0.72H-b source files in the Fable
  worktree.
- `0.72H-c Residential Object-Kit Authorship Pass` if the 0.72H-b source review
  holds.

Still blocked:
- Blind merge of the sibling worktree, public generated-district playability,
  provider-created geometry, public Anaheim/Ontario, new MCP tools, backend
  service routing changes, DB/Auth/Stripe expansion, public paid claims,
  dashboards, evidence, XP, reports, exports, and automation.

## Decision 098: Production stack is green, Auth remains the launch switch

0.72B now has live Railway production proof in addition to local backend-spine
proof.

Decision:
Atlas may run Redis, Postgres, Stripe test configuration, and the private scene
packet worker in Railway production, but Hosted Clawd is still owner-gated until
OAuth/OIDC account linking is configured and proven. Public paid access remains
off.

Decision id:
`PRODUCTION_STACK_GREEN_AUTH_REMAINS_LAUNCH_SWITCH`.

Reason:
The platform pieces are real now: Redis is reachable, Postgres is reachable,
Stripe test config is present, `/ready` is green, and generated draft packets
hit Redis through `_meta` without putting Railway in the browser pan/zoom loop.
That still is not a public paid launch because saved owner state must derive
from verified OIDC subject identity, not client copy, iframe state, or a Stripe
return URL.

Allowed next:
- `0.72H Fable Generated Draft Visual Quality Gate` in the existing Fable
  worktree.
- Auth/OIDC production wiring with `ATLAS_OIDC_ISSUER`,
  `ATLAS_OIDC_AUDIENCE`, `ATLAS_OIDC_JWKS_URL`, and optional
  `ATLAS_OIDC_RESOURCE` once a real provider is selected/configured.

Still blocked:
- Public paid claims, live billing launch copy, account-less Hosted Clawd
  writes, provider-created geometry, scene packet DB persistence, public
  Anaheim/Ontario, evidence, XP, reports, exports, automation, and any backend
  call in the browser pan/zoom loop.

## Decision 097: Generated drafts travel through meta, not the frame loop

0.71H accepts the generated draft scene packet service boundary as local-green.

Decision:
Generated draft district scenes may be compiled and cached server-side, but they
must be delivered through existing MCP tool `_meta` only when explicitly
requested. They are not public playable coverage, not public HTTP render-route
payloads, not DB-persisted scene packets, and not model-visible
`structuredContent`.

Decision id:
`GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP`.

Reason:
Atlas needs a production path for generated county scenes without making mobile
pan/zoom feel broken. Railway is the right place to compile/cache scene packets,
cache keys, source policy, and future background jobs. The browser is the right
place for retained Pixi pan/zoom after the packet arrives. Putting Railway in
the render loop would make the map feel slow on phones and would blur the
boundary between scene generation and interaction.

Allowed next:
- `0.72H Fable Generated Draft Visual Quality Gate`: use the packet path to
  judge generated draft visuals and add measurable gates for geometry grammar,
  density, silhouettes, contact, material discipline, and desktop/mobile proof.

Still blocked:
- New public MCP tools, browser HTTP generated-scene routes, DB-persisted scene
  packets, provider-created geometry, public all-US playable claims, public
  Anaheim/Ontario, DB/Auth/Stripe expansion, public paid claims, dashboard
  shells, evidence, XP, reports, exports, and automation unless their own gates
  open.

## Decision 096: Deterministic specs are not local promotion

0.70H accepts deterministic generated district specs as local-green.

Decision:
Atlas may generate bounded provider-free district drafts from sourced Census
county identity, but those drafts are not public playable local coverage. They
remain `L1_COUNTY_SHELL`, non-playable, and promotion-blocked until provider-
normalized local anchors, desktop/mobile proof, and owner acceptance pass.
Railway may compile/cache scene packets, but Railway must not be required for
pan/zoom frame-loop interaction.

Decision id:
`DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION`.

Reason:
The user is correct that a production Atlas engine needs to work nationally and
that giant generator files are a real risk. The right move is to split
generation into small pure modules and define a service boundary: backend
compiles/caches scene packets, browser keeps retained rendering local, and
provider lookup never becomes geometry by accident.

Allowed next:
- `0.71H Scene Packet Service Boundary / Railway Cache Plan`: define and
  verify the Railway scene packet service contract without adding public tools
  or network-bound map motion.

Still blocked:
- New public MCP tools, public all-US playable claims, provider-created
  geometry, provider-normalized anchor promotion, public Anaheim/Ontario,
  DB/Auth/Stripe expansion, public paid claims, dashboard shells, evidence, XP,
  reports, exports, and automation unless their own gates open.

## Decision 095: Census-indexed shells do not equal playable coverage

0.69H accepts the US county index import and nationwide shell behavior as
local-green.

Decision:
Atlas can now know and browse every 2024 Census county/equivalent row, but that
identity coverage must not be marketed or routed as playable voxel coverage.
Only counties with curated/generated proof and promotion gates may become
playable. Non-Riverside indexed counties are `L1_COUNTY_SHELL` and cannot
borrow Riverside places, Scout context, campaigns, pins, actors, or local
claims.

Decision id:
`CENSUS_INDEXED_SHELLS_NO_PLAYABLE_CLAIM`.

Reason:
The user is correct that production Atlas needs to work anywhere in the US.
The first production move is not to fake generated cities everywhere; it is to
make national identity complete and prevent the app from lying about coverage.
The verifier proves 3,222 sourced rows, 3,221 shell counties, and only one
playable county.

Allowed next:
- `0.70H Deterministic Generated District Specs`: convert sourced county
  identity into bounded, typed, deterministic generated district specs without
  provider geometry or public playable promotion.

Still blocked:
- New public MCP tools, public all-US playable claims, provider-created
  geometry, public Anaheim/Ontario, DB/Auth/Stripe expansion, public paid
  claims, dashboard shells, evidence, XP, reports, exports, and automation
  unless their own gates open.

## Decision 094: Nationwide generation requires source tiers

0.68H accepts the national generation production contract as local-green.

Decision:
Atlas cannot be called production-ready for every US county until the engine has
sourced national county identity, honest non-playable shells for indexed
counties, deterministic generated district specs, provider-normalized anchors
behind policy, and public-quality promotion gates.

Decision id:
`NATIONWIDE_GENERATION_REQUIRES_SOURCE_TIERS`.

Reason:
The user is correct that production Atlas is not just an Eastvale visual pass.
The current app is still a Riverside/Eastvale public proof cell with a
California-only county index. The product needs a national contract before
agents start claiming "anywhere in the US" or turning provider lookup into
renderer geometry.

Allowed next:
- `0.69H US County Index Import / Nationwide Shells`: import or generate a
  Census-backed national county index and prove non-Riverside indexed counties
  return honest browse-only shells without Riverside data bleed.

Still blocked:
- New public MCP tools, public all-US playable claims, provider-created
  geometry, public Anaheim/Ontario, DB/Auth/Stripe expansion, public paid
  claims, dashboard shells, evidence, XP, reports, exports, and automation
  unless their own gates open.

## Decision 093: Visual chrome yields to object identity

0.67H accepts the product feel cleanup pass as local-green.

Decision:
Labels, halos, pins, props, and actors are annotation layers. They must yield to
building silhouette, face separation, contact shadow, and object-kit grammar.
Mobile labels are selected/hovered only, desktop ambient labels are capped, pins
sit off landmark facades, and near-focal decoration dims before it competes
with the building read.

Decision id:
`GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST`.

Reason:
The 0.66H interaction work made the map usable, but screenshots still read too
busy: labels looked like a debug overlay, marker halos were too loud, stickers
landed on the hero silhouette, and commerce/gym translucent details added haze.
This decision converts that critique into renderer rules Fable can enforce.

Allowed next:
- `0.68H Face Separation / Sprite Tint Pass`: improve actual object read
  through face planes, roof/facade material separation, sprite tint discipline,
  and cleaner massing.

Still blocked:
- New public MCP tools, DB/Auth/Stripe expansion, public paid claims, pricing
  pages, dashboard shells, provider-created geometry, public Anaheim/Ontario,
  evidence, XP, reports, exports, and automation unless their own gates open.

## Decision 092: Map interaction is retained graph, saved state is bottom chrome

0.66H accepts mobile interaction hardening as local-green.

Decision:
Pan and zoom must move retained renderer containers, not rebuild scene graphs.
Saved Hosted Clawd state must sit in native map chrome as a collapsed-first
bottom sheet, not a separate modal product surface. The ChatGPT widget shell may
load small eager JS/CSS and defer Pixi renderer chunks behind a first-paint map
fallback.

Decision id:
`RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD`.

Reason:
Fable's professor audit correctly called the app verifier-green but not
product-green. The biggest felt-quality blockers were interaction rebuild
pressure, a modal save surface that fought the map, and a 1MB inline iframe
payload. This decision turns those into measured product gates: rebuild delta
0 during scripted pan, collapsed sheet under 96px, expanded sheet under 45dvh,
and eager JS under 400KB.

Allowed next:
- `0.67H Product Feel Cleanup`: continue from measured product quality, mainly
  stale CSS deletion, visible map-chrome density, and remaining total-JS diet.

Still blocked:
- New public MCP tools, DB/Auth/Stripe expansion, public paid claims, pricing
  pages, dashboard shells, renderer-geometry expansion, provider-created
  geometry, public Anaheim/Ontario, evidence, XP, reports, exports, and
  automation unless their own gates open.

## Decision 091: Browser proof before saved memory claim

0.65H accepts the Hosted Clawd browser proof as local-green.

Decision:
Do not claim saved Hosted Clawd state is available in the widget until the
browser path proves account-linked read access. When no widget bearer token is
available, Atlas must show the auth-required state, return a scoped OAuth
challenge, render no saved shelf, expose no widget token, and keep the tray
touch-accessible.

Decision id:
`BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN`.

Reason:
The saved read route exists, but the ChatGPT widget must prove how saved state
loads in a real browser before product copy implies saved memory is ready.
This keeps the map honest, protects account boundaries, and turns mobile/touch
accessibility into a verifier contract instead of a design note.

Allowed next:
- `0.66H Mobile Interaction Hardening`: harden the existing map/tray surfaces
  for touch, keyboard, reduced motion, and screen-reader parity.

Still blocked:
- New public MCP tools, public paid claims, pricing pages, dashboard shells,
  renderer geometry, provider-created geometry, public Anaheim/Ontario,
  evidence, XP, reports, exports, automation, and live billing expansion unless
  their own gates open.

## Decision 090: Track screens as map states, not pages

Decision id:
`MAP_STATE_SCREEN_BOARD`.

Decision:
Atlas product planning should track screen completeness as states of the
full-screen map app: playable map, shell state, place tray, Scout preview,
Campaign preview, Hosted Clawd setup, auth-required, saved shelf, billing, and
parked future states. Each state must map to a backend owner, data contract,
proof requirement, and safety boundary. Do not reorganize Atlas into a routed
dashboard or generic SaaS page set.

Reason:
The product is a ChatGPT app and voxel county engine. Treating screens as map
states keeps frontend, backend, Fable visual work, and Hosted Clawd paid work
aligned without drifting into website/product-management clutter.

Allowed next:
- Use `docs/ATLAS_FRONTEND_BACKEND_SCREEN_PLAN.md` as the Scrum board for
  0.65H browser proof, Fable generated-district parity, and app submission
  hardening.

Still blocked:
- Dashboard shells, public pricing pages, new public MCP tools, runtime 3D,
  provider-created geometry, public Anaheim/Ontario, evidence, XP, reports,
  exports, automation, and public paid claims unless their own gates open.

## Decision 089: Visual leaps use owned grammar before decoration

Decision id:
`VOXEL_LEAP_OWNED_GRAMMAR_FIRST`.

Decision:
The next big Atlas voxel quality jump should come from generated district
parity, owned sprite/object-kit intake, material grammar, depth ordering, and
contact shadows. External CC0 asset packs may be used as reference or raw
source, but runtime Atlas output must stay manifest-backed, provenance-tracked,
and visually Atlas-owned. Do not patch generated-district weakness with cars,
humans, labels, panels, glows, stock assets, runtime 3D, or dashboard UI.

Reason:
Curated Riverside/Eastvale has a map-first identity, but generated districts
still expose procedural weakness through sparse frames, empty pads, toy
commercial rows, roof registration drift, and apartment facade drift. The
product thesis depends on generated counties reaching the curated bar.

Allowed next:
- Parallel Fable lane `0.58E Generated District Parity + Asset Intake Plan`
  after the active Hosted Clawd proof is not at risk.

Still blocked:
- Runtime 3D, new renderer dependencies, provider-to-geometry, public
  Anaheim/Ontario, persistence, Stripe, reports, exports, XP, evidence,
  automation, dashboard shells, and new MCP tools unless their own gates open.

## Decision 088: Saved reads stay owner-scoped and HTTP-only

0.64H accepts the saved Hosted Clawd read surface as local-green.

Decision:
Add a compact read-only saved shelf inside the existing Hosted Clawd tray.
Expose it through an internal HTTP route, not a public MCP tool. Saved reads
derive owner from verified OIDC auth, accept read or write scope, and must not
upsert users, save rows, record usage, or trust client `subscriptionStatus`.
`refresh_status` is treated as the same read surface. The 0.64H stub audit is
kept in `docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md`; fixed items stay in this
slice, while widget bearer-token proof moves to 0.65H.

Decision id:
`SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS`.

Reason:
Hosted Clawd needs visible owned memory before the product feels real, but the
map remains the product surface. Reading saved state should be boring,
owner-scoped, and reversible. Payment failure pauses new paid writes; it should
not hide already saved history from the owner.

Allowed next:
- `0.65H Hosted Clawd Browser Proof`: verify the saved shelf inside the
  ChatGPT-style widget surface on desktop and `390x844` mobile.

Still blocked:
- New public MCP tools, live public paid claims, pricing pages, plan
  comparisons, dashboards, reports, exports, evidence, XP, automation,
  provider-created geometry, public Anaheim/Ontario, and renderer geometry
  changes until their own gates open.

## Decision 087: Protected paid writes require stored subscription state

0.63H accepts the protected Hosted Clawd tool gate as local-green.

Decision:
Do not trust client-supplied `subscriptionStatus` for protected Hosted Clawd
writes. `promote_session` and `save_campaign_artifact` can write only after the
repository reports an active subscription from Stripe webhook state. Keep
`create_or_attach_clawd` available before subscription so an owner can create
the Clawd needed to start Checkout.

Decision id:
`PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION`.

Reason:
Stripe return URLs and map-tray state are UI signals, not authorization. Hosted
Clawd is becoming the paid neighborhood operator, so write access must come
from owner auth plus stored subscription truth before any protected behavior
opens.

Allowed next:
- `0.64H Saved Hosted Clawd Read Surface`: show owned saved Clawd state in the
  map tray without adding public tools, reports, evidence, XP, exports, or
  automation.

Still blocked:
- New public MCP tools, live billing, public paid claims, pricing pages, plan
  comparisons, evidence, XP, reports, exports, automation, provider-created
  geometry, public Anaheim/Ontario, and dashboard shells until their own gates
  open.

## Decision 086: Stripe return is not access

0.62H accepts Hosted Clawd Stripe test billing as local-green.

Decision id:
`STRIPE_TEST_BILLING_WEBHOOK_GATED`.

Decision:
Use Stripe only on the server for test-mode Checkout and Customer Portal.
Return URLs can update UI copy, but they do not unlock paid writes. Access comes
from owned subscription rows updated by verified Stripe webhooks with replay
protection.

Reason:
Atlas is still a ChatGPT map app, not a billing dashboard. Hosted Clawd needs a
boring, auditable money boundary before public paid language or protected tool
behavior can be honest. The user should see billing state in the map tray, but
the browser should never become the source of payment truth.

Allowed next:
- `0.63H Protected Hosted Clawd Tool Gate`, only after the seven public MCP
  tools remain stable and protected Hosted Clawd behavior derives ownership from
  auth plus webhook-confirmed state.

Still blocked:
- Live billing, public paid claims, pricing pages, plan comparisons, evidence,
  XP, reports, exports, automation, provider-created geometry, public
  Anaheim/Ontario, dashboard shells, and new public MCP tools until their own
  gates open.

## Decision 085: Keep saved state in the map, not a dashboard

0.61H accepts the Hosted Clawd save UX as local-green.

Decision:
Use the existing map tray as the saved-state surface. Keep the Superior grey
setup console plus claymation save slots so users can understand what Clawdbot
could read later: business/location, local notes, Scout Drop, and campaign
draft state.

Reason:
Atlas is a map/chat voxel app. A separate dashboard, pricing page, or generic
setup wizard would split attention away from the local world. The paid
neighborhood operator should feel like it belongs on top of the map, not beside
it.

Allowed next:
- `0.62H Stripe Test Billing`, but only as a named test-mode billing slice with
  webhook replay protection and no success-URL trust.

Still blocked:
- Public paid claims, live billing, evidence, XP, reports, exports, automation,
  provider-created geometry, public Anaheim/Ontario, dashboard shells, and new
  public MCP tools until their own gates open.

## Decision 084: Persist Hosted Clawd ownership before billing

0.60H implements the first owner-protected Hosted Clawd persistence foundation.

Decision:
Accept `0.60H Persistence Foundation` as local-green with:
- Railway Postgres as the production database path.
- Committed SQL migration plus a small Node runner.
- `pg` as the database client.
- `jose` for OAuth/OIDC bearer verification.
- Protected Hosted Clawd write routes that derive ownership from verified auth
  context, not request bodies.
- Owned Hosted Clawd, business profile, Scout Drop, campaign draft, usage
  event, and idempotency rows.

Reason:
Atlas is a map/chat app and high-quality voxel engine for seeing local areas,
logging local context, and gaining an elevated neighborhood view. Hosted Clawd
/ Clawdbot is the paid neighborhood operator that can later manage local work,
but it needs boring owner-protected memory before pricing, billing, or
automation can be honest.

Allowed next:
- `0.61H Invite Beta Save UX`: make saved state legible in the map-first UI,
  including business/location confirmation, save status, no-auth/inactive
  states, and 390x844 proof.

Still blocked:
- Stripe Checkout, Billing Portal, webhooks, subscriptions, public paid claims,
  evidence, XP, reports, exports, automation, provider-created geometry, public
  Anaheim/Ontario, dashboard shells, and new public MCP tools.

## Decision 083: Open DB/Auth preparation, keep Stripe downstream

The human explicitly reopened DB/Auth preparation on 2026-07-05. The decision
packet is now recorded in `docs/HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md`.

Decision:
Proceed toward `0.60H Persistence Foundation` with:
- Railway Postgres as the first production database path.
- Committed SQL migrations plus a small Node runner.
- `pg` as the 0.60H implementation client, not added in the 0.59H docs-only
  prep slice.
- OAuth/OIDC account linking for protected MCP Hosted Clawd actions.
- Auth0-compatible OIDC provider shape for issuer, audience, JWKS, and scopes.
- `jose` as the likely 0.60H JWT verification library, without adding the
  Auth0 SDK unless the implementation proves it is needed.
- First persisted capability: owned Hosted Clawd, business profile, saved Scout
  Drop summary, and saved campaign preview draft.

Reason:
Hosted Clawd has reached the point where session-only state is the product
ceiling. The correct next layer is owner-protected memory, not a pricing page.
Stripe becomes useful only after saved ownership is boring.

Allowed next:
- 0.60H DB/Auth implementation for owner-protected persistence.
- Auth challenges for protected Hosted Clawd writes.
- Postgres migrations and DB client work inside the 0.60H slice.

Still blocked:
- Stripe Checkout, Billing Portal, webhooks, subscriptions, public paid claims,
  evidence, XP, reports, exports, automation, and public Anaheim/Ontario.

## Decision 082: Full product completion means live reviewability before persistence and billing

The full-stack completion map is now recorded in
`docs/ATLAS_FULL_STACK_PRODUCT_SPEC.md`.

Decision:
Atlas should not leap directly from the local 0.58J setup console into DB or
Stripe implementation. The next big leap is:
1. `0.58K Human Visual Gate / Deploy Readiness Decision`.
2. Canonical deploy and live verification.
3. Submission packet finalization.
4. `0.59H Hosted Clawd Storage/Auth Decision Packet`.
5. First persistence foundation.
6. Stripe billing only after persistence and ownership tests are boring.

Reason:
The product's current risk is not imagination or feature count. It is trust:
live reviewability, honest Alpha boundaries, owner-safe saved state, and
webhook-backed paid access.

Still blocked:
- DB migrations, auth/OAuth, persisted writes, Stripe/money, public paid claims,
  evidence, XP, reports, exports, automation, and public Anaheim/Ontario until
  their named gates open.

## Decision 081: Port Superior grey setup console into Hosted Clawd as UI-only setup

0.58J ports the Superior grey setup console / setup rail grammar into the Atlas
Hosted Clawd tray on `codex/integrate-hosted-clawd-fable-058e`. The input update
is `0.58I Integration Canonicalization / Release Decision Packet` at base commit
`920cf8a`.

Decision:
Accept the setup console port as local-green with decision
`SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED` and selected axis
`hosted_clawd_setup_ui`.

Reason:
The Hosted Clawd tray needed a sharper setup grammar to sit beside the Fable
map without reading like a generic SaaS upgrade card. That product surface can
improve before deploy, but it must not quietly become a persistence, checkout,
auth, or server-state implementation.

Allowed now:
- Superior grey setup console / setup rail UI grammar in the Hosted Clawd tray.
- Desktop and 390x844 mobile visual review in the next gate.
- Existing seven-tool MCP surface and existing widget context only.

Still blocked:
- New MCP tools or new context fields.
- Server state, DB, auth/OAuth, persistence, Stripe/money, public pricing, or
  saved-state claims.
- Deploy without `0.58K Human Visual Gate / Deploy Readiness Decision`.
- Public Anaheim/Ontario promotion.

Next:
Run `0.58K Human Visual Gate / Deploy Readiness Decision`. `0.59H Hosted Clawd
Storage/Auth Decision Packet` remains behind that visual/deploy gate.

## Decision 080: Integrated Hosted Clawd plus Fable branch needs a human visual gate before deploy

Branch `codex/integrate-hosted-clawd-fable-058e` is accepted as the local
canonical candidate. It combines the Hosted Clawd rental scaffold with the
Fable 0.53E-0.58E visual chain and has a strict
`hosted-clawd-fable-integration` split mode.

Decision:
Do not deploy automatically. This decision originally created the visual/deploy
gate. 0.58J has since run as a UI-only setup console port; the current next
gate is `0.58K Human Visual Gate / Deploy Readiness Decision`. `0.59H Hosted
Clawd Storage/Auth Decision Packet` remains behind that visual/deploy gate.

Reason:
The branch is technically green, but it changes both the product upgrade path
and the map renderer. That is exactly the kind of branch that needs human
visual approval before becoming the deploy line. Treating it as Hosted
Clawd-only would hide renderer scope; treating it as an art-only branch would
hide the new paid-product scaffold.

Allowed now:
- Keep the integrated branch as the local canonical candidate.
- Use `hosted-clawd-fable-integration` for strict split checks.
- Review desktop and 390x844 mobile proof for deploy readiness.

Still blocked:
- Deploy without explicit human approval.
- DB, auth, Stripe, persistence, OAuth, XP, evidence, reports, exports, or
  public pricing claims.
- Public Anaheim/Ontario promotion.
- New public MCP tools.

## Decision 079: Hosted Clawd can reopen only as a gated scaffold until storage, auth, and money are chosen

The human reopened Hosted Clawd on 2026-07-05 for the ChatGPT app rental path:
the product should let a business owner host Clawd for a business and preserve
the work later. The accepted implementation step is a safe scaffold, not live
Paid Beta.

Allowed now:
- Hosted Clawd PRD and technical spec.
- Server service interfaces and HTTP routes.
- Widget-only Hosted Clawd state in existing map, Scout Drop, Campaign Preview,
  and upgrade responses.
- A map-first Hosted Clawd tray showing what would be saved.
- OFF-by-default feature flags for persistence, money, and public claims.

Still blocked until explicit follow-up choices:
- Database provider, migrations, auth/account ownership, Stripe Checkout,
  Billing Portal, webhooks, evidence, XP, weekly reports, exports, and public
  pricing claims.
- Any new public MCP tool.
- Any claim that Alpha saves state or accepts payment.

Reason:
Hosted Clawd is the right paid product path, but going live without storage,
auth ownership, idempotency, and webhook-confirmed subscription state would
turn a promising product idea into a fragile backend. The scaffold makes the
map-first upgrade path real while preserving the hard gates.

## Decision 083: Retire the public product-path control (Fable, 0.75C-4)

The coverage card's three-button "product path" strip (Play / Browse / Lookup)
is removed, not restyled. Play and Browse duplicated the county chips directly
above them; Lookup was a demo affordance that injected a canned conversation
message. The coverage explainer is now one plain sentence that doubles as the
mobile expand/collapse chip.

Reason:
NS-3 — the strip was chrome narrating what the chips already afford; NS-5 —
lookups belong to the conversation, and the lookup honesty contract
(lookup-only / not saved / not coverage proof) is asserted at the tool layer by
five verifiers (mcp-flow, provider-boundaries, world-lookup-boundary,
tool-result-shape, chatgpt-entry-surface), which is where it binds.

Accepted consequence:
verify-county-switcher drives county chips directly instead of product-path
clicks and loses the UI-level lookup-boundary state test (the behavior remains
verified at the MCP layer). Provenance note: the workhorse executed this
removal beyond the literal packet spec without declaring the deviation; the
retirement is ratified here as an explicit reviewer decision, and the
undeclared-deviation process failure is logged against the delegation standard.

## Decision 082: Close-zoom material stays vector, seeded, and zoom-gated

0.75C-3 sets the material texture rule for vector buildings: wall and roof
texture may enrich close zoom, but it must stay in deterministic vector
`Graphics`, derive shades from the existing body/roof colors, and emit only
when `camera.zoom >= 1.55`. Wall material must use the wall-plane facade seam
(`wallSurface`, `wallPoint`, `wallQuadPoints`) so it foreshortens with the
building face. Overview cameras must not emit the new texture pass. Future
material work should tune alpha/course cadence before adding new geometry
classes, dependencies, shaders, filters, bitmaps, or data/compiler changes.

## Decision 081: Generated residential fabric uses tighter small-house packing

Generated residential zones now use a tighter parcel rhythm and a higher
density floor, paired with smaller cottages, compact ranches, and narrower
rowhome templates. The goal is continuous small-house frontage along the street
grid, not a sparse field of oversized homes.

Reason:
The generated district was passing basic parity but still read thin at
neighborhood zoom. More houses from the old larger pool would raise clone
pressure and roof-risk, so density had to move together with safer, more varied
small-home templates.

Accepted consequence:
The representative generated sample carries more residential parcels and can
let an additional large residential block qualify for the existing corner-store
rule. The corner-store module itself, prop policy, scene compiler contract, and
renderer contract are unchanged.

Still blocked:
- Authored Riverside scene changes for this generator-only slice.
- Curated prop edits, forbidden prop-kind changes, or `maxPropCommands`
  changes.
- Three.js, new dependencies, scene compiler contract changes, or new MCP
  tools.
- Hosted Clawd, DB persistence, Stripe, OAuth, XP, evidence, automation,
  reports, exports, provider geometry, or public Anaheim/Ontario promotion.

## Decision 080: Buildings and props share one iso depth stack

Buildings and props now render as grouped children of one shared Pixi depth
container. The renderer no longer relies on separate `buildingLayer` then
`propLayer` parent order for visual occlusion.

Reason:
At detail zoom, props behind buildings were drawn above every building because
the whole prop layer sat over the whole building layer. Iso painter order must
compare the actual building footprint key and prop anchor key so a behind prop
is hidden by the building and a front prop remains visible.

Accepted consequence:
The old QA layer labels remain, but they are now visibility proxy handles
rather than the visual parents of the display objects. Browser QA can still find
`buildingLayer` and `propLayer` through `window.__ATLAS_QA__.world.children` and
hide each group independently.

Still blocked:
- New prop kinds, cars, clouds, humans, labels, glows, or decorative clutter.
- Generator or scene compiler contract changes for this renderer-only fix.
- Three.js or new dependencies.
- Hosted Clawd, DB persistence, Stripe, OAuth, XP, evidence, automation,
  reports, exports, provider geometry, or public Anaheim/Ontario promotion.

## Decision 079: Generated visual proof must pass without map labels

Generated district previews now suppress rendered place labels through an
explicit `CityWorldRenderer` prop in generated mode. Public Riverside keeps its
current label behavior, but generated visual proof cannot depend on visible
place names to explain object identity.

Reason:
The 0.72H candidate was numerically better but still showed labels such as
"Neighborhood" and "Commercial row." That makes the art proof too easy to fake:
the scene must read from silhouette, roof/eave grammar, material separation,
lots, roads, and density before text explains it.

Accepted consequence:
Generated widget proof now asserts `data-qa-place-labels="suppressed"` and the
generated parity verifier now includes residential roof safety. Tiny/tall hip
cottages are blocked from the generated template pool because they create
skewed roof reads at mobile scale.

Still blocked:
- Public Anaheim/Ontario promotion.
- Provider-created geometry.
- New MCP tools.
- Hosted Clawd, DB persistence, Stripe, OAuth, XP, evidence, automation,
  reports, or exports.
- Cars, humans, decorative clutter, dashboard UI, or labels as art crutches.
## Decision 078: Clawd is product state, not a map mascot

The Fable visual branch removes the Clawd panda/mascot from rendered map actor
grammar. Clawd can still exist as product language, session state, and future
Hosted Clawd service surface, but the city map should earn quality through
silhouette, terrain, lots, roads, and building grammar.

Reason:
The mascot prop was drawing attention away from weak map composition. It made
the scene feel cute but less like a serious county-to-scene engine. Removing it
forces the renderer to carry identity through massing and material discipline.

Accepted consequence:
Shell/not-indexed areas can be visibly firmer than flat placeholders, but they
must remain muted and non-public. The shell grammar may use facets, seams,
construction marks, and restrained color differences; it must not add public
place props, people, cars, fake labels, or playable claims.

Still blocked:
- Public Anaheim/Ontario promotion.
- Provider-created geometry.
- New MCP tools.
- Hosted Clawd, DB persistence, Stripe, OAuth, XP, evidence, automation,
  reports, or exports.

## Decision 077: Public synthetic generated-district preview is accepted for Engine Beta, with limits

The human accepted the Fable product-submission lane and allowed continuation
despite the art still reading around 6.5/10. Atlas now permits a public
synthetic generated-district preview in Engine Beta, but only as an honest
engine preview.

Allowed:
- Widget-only generated district preview.
- Clear banner: synthetic, not a real place, not real coverage, session-only.
- No new MCP tools.
- No provider-created geometry.
- No coverage or readiness promotion from generated scenes.

Still blocked:
- Anaheim/Ontario public promotion.
- Real provider-to-scene geometry.
- DB persistence, Hosted Clawd implementation, Stripe, OAuth, XP, evidence,
  automation, reports, or exports.
- Claiming generated output is public-quality coverage.

Reason:
The generated preview demonstrates the Atlas engine better than another
decision packet. Public verifiers prove it is labeled honestly, does not expose
collection tools in generated mode, keeps one nonblank canvas, and has no
horizontal overflow. The weakness is visual quality, not product honesty.

Next consequence:
0.50P should finish submission assets and directory readiness. The next engine
art slice should reduce generated-scene clone pressure and improve object
category identity.

## Decision 076: Fable product-submission lane is locally verified, not automatically deploy-approved

The Fable product-submission lane is accepted as a local experiment under
Axiom/Codex control: the live Claude process was stopped, the Fable commit was
preserved as `codex/fable-product-submission-experiment`, and the verifier
cleanup now recognizes the in-widget Scout/Campaign preview panel and
submission checklist as part of the product-submission envelope.

Reason: the lane adds real product value, including in-widget preview results,
submission assets/docs, and a provider-free generated-district proof. It also
expands product scope by exposing a public synthetic generated-district preview
and adding `radix-ui`, so it must not be treated as automatic deploy approval.

Accepted guardrails:
- Generated district remains synthetic, session-only, and not real coverage.
- No new MCP tools are added.
- Anaheim/Ontario remain hidden and non-public.
- Provider lookup still cannot create readiness or map geometry.
- Paid, DB persistence, Hosted Clawd, OAuth, XP, evidence, automation, reports,
  and exports remain parked.

Next decision before deploy:
Run the 0.49P reliability sweep and decide explicitly whether the public
synthetic generated-district preview is accepted product scope.

## Decision 075: Pivot to the product-submission track; owner-gate ceremony parked

Post-Alpha work moves onto a product/app-quality track aimed at a **submittable ChatGPT app**,
specified in `docs/PRODUCT_SPEC_AND_GATES.md`. The owner-gate / second-district promotion
ceremony (0.44E–0.47E) is **parked**: it stays honest (`artifacts/current-update.json` remains
`0.45E`, the source-of-truth drift checker stays green, Anaheim/Ontario stay hidden and
non-public), but it is no longer the active track.

Reason: the 0.24E→0.46E stretch was decision machinery circling one blocked question ("promote
hidden Anaheim?"). The human redirected to shipping a fully high-quality, submittable app. The
new gates (G1–G7) gate a real ChatGPT submission — build/typecheck, MCP contract stability,
widget quality on desktop + 390×844 mobile, reliability across the 7 tools, honesty/safety,
submission manifest + icon + privacy, and deployed+verified — instead of re-asking whether to
promote a hidden district. Named product slices: `0.46P` in-widget result surface (done),
`0.47P` widget polish, `0.48P` design ultra-pass (Fable supermove), `0.49P` reliability sweep,
`0.50P` submission packet. Build capacity: Codex (GPT-5.5) for bulk, one reserved Fable pass for
the design ultra-pass, Opus for orchestration.

Rejected alternatives:
- Advancing the owner-gate ladder to 0.46E — more decision ceremony, no product movement.
- Repointing `current-update.json` / the drift checker to the product track — breaks the guard
  for no gain; the parked ladder is honestly still at 0.45E.
- Paid / DB / Hosted Clawd work — parked until the engine is submitted and credible.

## Decision 074: Public civic/service identity needs typed prefab geometry

Post-Alpha 0.39E adds typed object-kit geometry for public civic landmarks and
service/gym buildings, then makes the renderer consume that metadata directly.
Eastvale Core and the Gym/service block are the current public stress cells,
but the contract is reusable: civic landmarks carry plinth, entry, facade,
glass, canopy, and roof-cap grammar; service/gym buildings carry service-bay,
sawtooth-roof, recessed-entry, utility-apron, and roof-monitor grammar.

Reason: 0.38E/0.38F selected public object identity as the next visible engine
axis. Another commerce, terrain, mobile, hidden-district, DB, provider, or UI
pass would have ignored the selector. The better engine move was to make the
weak public object identities measurable and renderer-consumable without adding
labels, panels, cars, humans, props, or public Anaheim/Ontario scope.

Rejected alternatives:
- A broad renderer polish pass across every object family.
- Another commerce pass without a human-named Plaza Row blocker.
- Terrain or mobile work while current diagnostic floors are green.
- Hidden Anaheim/Ontario promotion before owner-gate blockers clear.
- Provider geometry, DB persistence, paid scope, or new MCP tools as shortcuts.

## Decision 073: 0.38F reconciles source of truth before 0.39E

Post-Alpha 0.38F is a source-of-truth repair slice, not a feature slice. It
locks the repo back to one current doctrine: Engine Beta is active, Riverside
/ Eastvale is the only public playable district, Anaheim/Ontario remain hidden,
and paid/persistence/provider lanes stay parked until explicitly reopened.

The next implementation slice remains `0.39E Public Object Identity /
Civic-Service Read Pass`. Do not continue commerce unless a human names one
exact Plaza Row blocker. Do not continue terrain/mobile unless a verifier shows
a regression. Do not expose Anaheim/Ontario or start DB/persistence work from
this repair.

## Decision 072: 0.39E should target public object identity, not commerce repeat

Post-Alpha 0.38E selects `0.39E Public Object Identity / Civic-Service Read
Pass` as the next code slice. The selector scores public object identity above
terrain, mobile entry density, hidden second-district readiness, and commerce
repeat.

Reason: 0.37E made Plaza Row reviewable and green. Terrain and mobile budgets
are also green. Anaheim hidden-district readiness still has 9 promotion
blockers. The most valuable visible public engine weakness is now object
identity: home clone pressure remains at `0.2`, the weakest public object family
is `civic_landmark`, and the weakest stress cell is
`eastvale-core-civic-landmark`.

Rejected alternatives:
- Another commerce pass without a human-named Plaza Row blocker.
- Terrain/world-edge work while terrain, empty-board, and chunk-edge floors are
  green.
- Mobile entry-density work while the playable mobile budget passes.
- Public Anaheim/Ontario work while owner-gate and promotion blockers remain.
- DB/provider/persistence work before the explicit gate reopens.

## Decision 071: Commerce proof needs a focused camera, not broader art scope

Post-Alpha 0.37E adds a deterministic `commerce_detail` camera and focused
Plaza Row verifier after 0.36E proved the commerce geometry contract. The
commerce prefab also gets one bounded geometry increase: seven storefront bays,
five sign-mount blocks, deeper apron and glass recesses, heavier parapet, and
bay-level storefront thresholds in the renderer.

Reason: the standard Riverside screenshots keep Plaza Row near the frame edge,
so the team could not honestly judge whether the commerce geometry improved.
The better engine move is a repeatable proof camera plus one targeted geometry
step, not a broad pass over every object family.

Rejected alternatives:
- Adding a public selected-place query parameter just to make proof screenshots
  prettier.
- Broad object-family polish before the commerce target is reviewable.
- Cars, humans, props, labels, glows, panels, or dashboard UI as visual
  compensation.
- Public Anaheim/Ontario exposure, provider geometry, DB persistence, or MCP
  tool changes.

## Decision 070: Commerce strips need typed prefab geometry, not ad hoc renderer constants

Post-Alpha 0.36E adds a typed `CityWorldCommerceStripPrefabGeometry` contract
inside object-kit metadata and assigns a focused Plaza Row profile. The renderer
now consumes `commerceGeometry` for bay count, sign mount count, apron depth,
glass recess depth, parapet weight, and focused frontage depth.

Reason: 0.35E proved object-kit metadata can reach the renderer. The next
engine-quality move was to make the weakest public prefab family,
`commerce_strip`, carry its own structural prefab geometry instead of hiding
generic constants in the renderer or broadening the art pass to every building
family.

Rejected alternatives:
- A broad renderer polish pass across all object families.
- More labels, panels, glows, cars, humans, or decorative props to make Plaza
  Row feel busier.
- Public Anaheim/Ontario exposure to show a different commerce scene.
- Provider geometry or DB-backed generation as a shortcut for object quality.

## Decision 069: Renderer must consume object-kit metadata before broad art passes

Post-Alpha 0.35E makes `CityWorldRenderer` consume
`CityWorldBuilding.objectKit` for the `commerce_strip` prefab family. The
commerce strip read now comes from a focused renderer helper shared by
sprite-backed and primitive paths, instead of another broad visual pass or
older facade-style checks alone.

Reason: 0.34E identified `commerce_strip` as the weakest public prefab family.
The right next engine move was to prove object-kit metadata affects rendering
directly. That gives future object-family work a stable path: compiler assigns
object-kit identity, renderer consumes it, verifier proves the path, browser
screenshots prove product safety.

Rejected alternatives:
- Polishing every object family at once.
- Adding cars, humans, props, labels, panels, glows, or dashboard UI to make
  commerce areas feel busier.
- Treating provider lookup, DB cache state, or Anaheim/Ontario candidate data
  as a shortcut to public visual quality.
- Reopening persistence or paid scope before explicit approval.

## Decision 068: Public object-kit metadata comes before more broad art or DB work

Post-Alpha 0.34E returns to engine quality after the 0.33E persistence plan.
Public Riverside/Eastvale buildings now carry an internal object-kit contract:
prefab family, palette roles, clone-group key, signature tags, roof/body
separation score, and civic landmark signature score. The focused verifier
checks prefab coverage, palette cohesion, clone pressure, terrain/contact
floors, provider/DB boundary safety, and hidden-candidate safety.

Reason: Atlas needs a reusable voxel object kit before it can scale into more
counties or reopen persistence. More screenshots without prefab/palette metrics
would keep hiding the same clone and palette drift problems. DB persistence
also remains too risky until the human explicitly approves implementation.

Rejected alternatives:
- Implementing DB persistence from the 0.33E plan without approval.
- Running another broad renderer polish pass without object-kit metrics.
- Adding decorative props, cars, humans, panels, or labels to hide weak object
  identity.
- Exposing Anaheim/Ontario publicly through object-kit or cache metadata.
- Treating provider lookup as object geometry or readiness.

## Decision 067: Scene packet DB persistence requires schema review before code

Post-Alpha 0.33E defines the database persistence plan for scene packets, but
does not implement persistence. The approved work is a machine-readable schema
artifact, a human-readable plan, and a verifier that blocks DB dependencies,
env drift, migrations, and server DB runtime code.

Reason: 0.32E proved runtime scene packet memory. The next risk is not writing
rows; it is accidentally turning cache convenience into durable product state
without schema, rollback, provider-boundary, and product-review discipline.
The persistence plan keeps the rollout order explicit:
`runtime_memory -> db_read_through -> db_write_through`, with
`runtime_memory` as the rollback mode.

Rejected alternatives:
- Adding `DATABASE_URL` or a DB client before human approval.
- Creating migrations before schema review.
- Storing shell counties as fake scene payloads.
- Storing raw Google/provider payloads, user data, Stripe, OAuth, XP, evidence,
  or automation data in scene packet tables.
- Exposing Anaheim/Ontario publicly through persisted packets.

## Decision 066: Runtime scene packet memory is per-process and diagnostic-only

Post-Alpha 0.32E adds a server runtime memory adapter for scene packets, but it
does not create persistence. Public Riverside/Eastvale playable scenes can be
cached in process by the deterministic 0.31E key and returned with safe
metadata in `_meta.scenePacket`; the full scene remains only in `_meta.scene`.
Shell and unsupported counties receive packet status metadata only and must not
receive scene payloads. The diagnostic route
`/api/engine/scene-packets/status` is read-only and returns summaries only.

Reason: Atlas needs a real server-side bridge toward instant scene generation,
but DB persistence, live providers, and background generation require a
separate schema/migration/rollback gate. Runtime memory proves keying, TTL,
cache hits, expiry, eviction, and safety metadata without creating durable
state or a paid/backend commitment.

Rejected alternatives:
- Writing scene packets to a database before schema and rollback review.
- Letting provider lookup produce scene geometry or coverage readiness.
- Returning packet metadata in `structuredContent`.
- Caching shell counties as fake playable scenes.
- Exposing Anaheim/Ontario publicly through the cache layer.

## Decision 065: Scene packet cache contract precedes DB and live providers

Atlas may move toward server-offloaded scene packets, but the first backend
step is a typed cache/generation contract in `@atlas/core`, not a database or
live Google/provider integration. Scene packets need deterministic keys, TTL
policy, source/readiness notes, and packet payload boundaries before any
runtime adapter stores them. Public Riverside/Eastvale can use runtime-memory
scene packets; shell counties remain metadata-only; hidden Anaheim/Ontario
drafts remain non-public; provider-normalized and background-generation modes
must stay blocked until explicit DB/provider gates reopen. DB persistence,
Hosted Clawd, live provider geometry, package/env drift, Stripe, XP, evidence,
OAuth, automation, reports, and exports remain parked.

## Decision 064: Pan-safe scene windows are required before server scene caches

Post-Alpha 0.30E adds current-camera scene-window refresh to the renderer. The
renderer derives a bounded world frame from the current screen center, expands
it by a small tile margin, and refreshes only when pan or zoom leaves the active
buffered frame.

Reason: the server/offload direction is correct, but only after the client has
a stable streaming boundary. Atlas should eventually store normalized location
metadata, source/readiness notes, cached scene packets, and background
generation results server-side. The widget should consume bounded
`CityWorldScene` windows instantly instead of generating a whole county on
demand or reading provider geometry.

Rejected alternatives:
- Raw screen-corner windows for normal rendering, because desktop can collapse
  small scenes back into full-scene drawing.
- Live synchronous provider generation in the widget.
- Treating panning as a reason to abandon scene windows.
- Adding DB persistence, Hosted Clawd, or public Anaheim UI before the engine
  window boundary is stable.

## Decision 063: Renderer consumes bounded scene windows before scaling districts

Post-Alpha 0.29E moves `CityWorldRenderer` onto
`compileCityWorldSceneWindow`. The renderer now chooses the active desktop,
mobile, or residential-detail camera window and draws from
`sceneWindow.visibleCommands` instead of building the full-scene render command
buffer directly.

Reason: the next California/USA engine problem is not another decorative map
pass. Atlas needs the renderer path to respect the same bounded scene-window
contract that diagnostics and verifiers use. This keeps larger counties,
hidden second-district drafts, and future object-kit work measurable before
Pixi drawing.

Rejected alternatives:
- Continuing to draw from the full scene while only diagnostics use windows.
- Treating scene windows as docs/verifier-only machinery.
- Exposing Anaheim publicly to test renderer scaling.
- Adding provider geometry, a new renderer runtime, or public UI copy to hide
  the engine boundary problem.

## Decision 062: Scene windows are the scaling boundary for county rendering

Post-Alpha 0.28E adds a `CityWorldScene` chunk index and camera-specific scene
window compiler on top of render commands. Future larger county/district work
should prove what the active desktop, mobile, or detail camera needs before it
asks Pixi to draw the whole scene.

Reason: Atlas cannot scale toward California or USA coverage by expanding one
monolithic renderer pass. The engine needs a bounded, testable window contract:
what terrain, roads, lots, buildings, markers, actors, and labels are visible
for the current camera, and which chunks own those commands.

Rejected alternatives:
- Rendering every compiled scene command for every camera.
- Using viewport screenshots alone as proof that a larger county scene is safe.
- Adding public Anaheim/Ontario UI to test scene windowing.
- Introducing provider geometry, Three.js, GameBlocks, or another runtime to
  solve what should be an Atlas `CityWorldScene` boundary.

## Decision 059: Render commands are the engine boundary before Pixi drawing

Post-Alpha 0.27E adds a typed render command buffer and layer budget evaluator
between `CityWorldScene` and `CityWorldRenderer`. The Pixi renderer remains the
draw implementation, but future terrain, object-kit, chunking, and second
district work must be measurable as layer commands before it becomes renderer
polish.

Reason: Atlas needs to scale from one proof cell to county/district scenes
without hiding engine risk inside one monolithic draw function. Layer budgets
let the team block cars, walkers, decorative prop clutter, debug overlays,
fake shell objects, and hidden-draft public leakage with code, not taste notes.

Rejected alternatives:
- Continuing to add object or terrain details directly inside Pixi without a
  command/budget layer.
- Replacing Pixi with Three.js, GameBlocks, VoxelSpace, or another runtime.
- Using screenshots alone as proof that a scene is structurally safe.
- Exposing Anaheim/Ontario publicly to test the command pipeline.

## Decision 058: Hidden venue proof is not public district promotion

Post-Alpha 0.23E gives Anaheim a stronger hidden venue authorship proof:
Convention Center, ARTIC, and Angel Stadium are now separate civic/venue stress
cells, and the visual packet can pass as `HIDDEN_DRAFT_ONLY`. This does not
promote Anaheim. Public playability still requires a promotion readiness
aggregator, product proof, visual acceptance, split/provider safety, and Axiom
release approval.

Reason: stronger no-label recognition is necessary for the second district, but
it is not sufficient. Atlas would damage user trust if a hidden draft became a
public switcher state before the ChatGPT app surface, MCP behavior, recovery
states, provider boundary, and release packet all agree.

Rejected alternatives:
- Flipping Anaheim from shell/draft to playable from visual metrics alone.
- Using hidden draft screenshots as public promotion evidence.
- Exposing Anaheim/Ontario in the public switcher before the readiness
  aggregator says the gate is complete.
- Adding labels, cars, humans, props, panels, glows, provider geometry, or paid
  scope to compensate for unfinished district quality.

## Decision 057: Real Consumer App path ships before paid platform scope

Atlas is now framed as a Real Consumer App first: a ChatGPT app where users can
open a location, explore a high-quality voxel county world, ask local questions,
drop Clawd, and run session-only Scout/Campaign previews. Hosted Clawd,
persistence, Stripe, XP, evidence, reports, exports, and automation remain
later paid-beta scope until the engine and public app feel credible.

Reason: the user wants the full Atlas product, but the July 4 cutline cannot be
the full national paid platform without either faking coverage or shipping a
weak app. The release path is therefore: public Alpha proof, consumer entry
quality, engine quality, second playable district, consumer save layer, then
Hosted Clawd Beta.

Rejected alternatives:
- Claiming every county is playable before district readiness gates exist.
- Reopening paid/persistence before the map engine and product loop earn trust.
- Letting hidden Anaheim/Ontario compiler work block the public Alpha release
  if it cannot be stabilized quickly.
- Turning Atlas into a dashboard instead of a map-first ChatGPT app.

## Decision 056: Scout and campaign previews must expose session-only boundaries

Pre-Alpha 0.17E adds a typed `alphaBoundary` to Scout Drop and Campaign Preview
results. The boundary states that Alpha previews are session-only, do not save
state, do not execute actions, do not grant XP, and require Hosted Clawd before
anything can be saved or tracked. Scout Drop points to `preview_campaign_engine`
as the next free action. Campaign Preview points to `get_upgrade_options` for
the future saved workflow.

Reason: the public Alpha loop is not just a map screenshot. A normal ChatGPT
user has to understand what Clawd can do now and what is still blocked. The
boundary belongs in typed tool output and verifiers, not only in explanatory
copy, so app review and future workers cannot accidentally imply persistence,
automation, evidence, or paid execution.

Rejected alternatives:
- Relying on prose-only limitations in tool text.
- Creating new paid or saved tools before Hosted Clawd is reopened.
- Letting campaign preview imply posting, DMs, ad spend, evidence submission,
  XP, reports, exports, or durable storage.

## Decision 055: Public civic landmarks need renderer authorship, not labels

Pre-Alpha 0.16E moves the civic landmark lane from diagnostics into the Pixi
renderer. The public Riverside civic landmark pass adds reusable base
hierarchy, roof hierarchy, facade rhythm, and an Eastvale Core stress-cell
signature. The goal is to make the public map read as an authored county scene
before asking users to care about hidden second-district draft anchors.

Reason: Eastvale Core is the visible proof-cell landmark. If it only reads
because the label, marker, or tray explains it, the engine is still leaning on
UI as a crutch. The renderer pass must improve object identity while keeping the
same product loop, county states, provider boundary, and no-prop discipline.

Rejected alternatives:
- Promoting Anaheim or Ontario before public Riverside landmark quality is
  credible.
- Adding signs, labels, cars, humans, panels, glows, or UI copy to compensate
  for weak landmark form.
- Replacing the Pixi renderer or importing external voxel/game runtimes.

## Decision 054: Specific places are object-kit stress cells, not destination polish

Pre-Alpha 0.15E treats Eastvale Core and Angel Stadium as reusable civic/venue
object-kit stress cells. Eastvale Core represents the public `civic_landmark`
case inside the live Riverside loop. Angel Stadium represents a hidden
`venue_anchor` case for future second-district readiness. Neither target may
justify bespoke destination polish unless the work also improves a reusable
contract: silhouette, hierarchy, mobile readiness, and no-label readiness.

Reason: Atlas is a USA-scale county-to-scene engine. Improving one place only
matters when the improvement generalizes to the object kit that future counties
will reuse. Public Riverside remains the visible product bottleneck, so the
next authorship implementation should target Eastvale Core first unless a
metric or screenshot gate proves hidden Anaheim is the better engine blocker.

Rejected alternatives:
- Eastvale-only renderer sanding without a reusable object-kit contract.
- Angel Stadium source art that does not improve venue-anchor grammar.
- Public Anaheim/Ontario promotion from hidden draft metrics.
- Using labels, panels, cars, humans, props, or provider geometry to compensate
  for weak object identity.

## Decision 053: Mobile LOD budgets are enforceable core contracts

Pre-Alpha 0.13E promotes mobile occlusion from measurement to enforcement.
`@atlas/core` now defines named budgets for playable mobile, residential detail
proof crops, shell empty states, and hidden draft probes. The mobile occlusion
verifier consumes those budgets instead of carrying loose per-target thresholds.

Reason: Atlas is a ChatGPT app, so the normal `390x844` map surface has to stay
readable as the voxel world gets denser. Visual work can be richer, but it must
not crowd the county switcher, selected-place tray, pins, notes, or recovery
states. Residential-detail crops are allowed to be dense only because they are
explicitly classified as proof crops, not the public mobile path.

Rejected alternatives:
- Keeping threshold logic only in verifier scripts.
- Letting renderer or UI code decide mobile readability budgets.
- Adding a public debug overlay or exposing LOD/metric labels in the widget.
- Treating shell counties or hidden drafts as playable because they compile.
- Reopening provider geometry, paid scope, persistence, or public Anaheim/Ontario
  promotion while enforcing this engine gate.

## Decision 052: Derived terrain maps are Atlas-owned engine contracts

Pre-Alpha 0.12E adapts the useful VoxelSpace-style height/color-map idea into
`@atlas/core` as `deriveCityWorldTerrainMap` and
`deriveCityWorldMobileOcclusion`. These reports are derived from compiled
`CityWorldScene`, not external provider geometry, image assets, or a new
runtime renderer. They are diagnostics and verifier inputs for the existing
Pixi map-first app.

Reason: Atlas needs measured engine pressure without drifting into a terrain
demo. Height/color arrays, water-edge signal, object occupancy, and mobile
occlusion budgets give Axiom, Lumen, Forge, and Mira a shared way to judge
terrain composition and mobile readability while preserving the public product
model: play Riverside/Eastvale, browse shells, and lookup places without saved
coverage claims.

Rejected alternatives:
- Vendoring VoxelSpace, VoxCity, Pixels2Voxels, Open3D, Three, or another
  terrain/rendering runtime.
- Letting provider lookup or source imagery become public geometry.
- Replacing the Pixi `CityWorldRenderer` with a height-map renderer.
- Treating derived maps as public UI or a dashboard.
- Promoting Anaheim/Ontario because hidden draft maps compile.

## Decision 051: External voxel references are research adapters

VoxCity, VoxelSpace, and Pixels2Voxels may inform Atlas engine discipline, but
they are not approved runtime dependencies. VoxCity should pressure Atlas
toward stronger grid geometry, source coverage policy, footprint-to-cell
assignment, voxel layer separation, surface metadata, and material/window
grammar. VoxelSpace should pressure terrain height/color diagnostics,
occlusion thinking, and distance LOD. Pixels2Voxels should pressure offline
source-art contrast/channel inspection.

Reason: Atlas needs a reusable ChatGPT voxel county engine, not a Python GIS
pipeline, Open3D viewer, terrain-only renderer, or image-to-voxel toy inside
the public app. Every useful idea must be adapted into Atlas-owned
`@atlas/core`, `@atlas/geo`, `CityWorldScene`, diagnostics, verifiers, and Pixi
renderer contracts.

Rejected alternatives:
- Vendoring VoxCity, VoxelSpace, or Pixels2Voxels.
- Adding Python, Open3D, Three, Rapier, Earth Engine, or terrain-renderer
  runtime dependencies from this research.
- Letting provider/source imagery become public voxel geometry or readiness
  proof.
- Using image/channel visualization as production object art.
- Promoting Anaheim/Ontario because an external reference has a stronger data
  pipeline.

## Decision 041: Public object authorship follows the 0.10E terrain pass

Pre-Alpha 0.11E moves from terrain/world-edge correction to public Riverside
object authorship. The measured 0.10E terrain floors are now high enough to
stop another terrain pass for the moment; the visible first-read weakness is
object identity: Eastvale Core, residential homes, rowhomes, strip-store,
apartments, and service/gym still need stronger authored silhouettes and
category cues.

Reason: Atlas should not keep chasing the same terrain axis after it clears the
diagnostic gate. The default ChatGPT app view is now better served by making
the existing public objects read as a coherent voxel county kit while preserving
the current terrain, provider, shell, and hidden-draft boundaries.

Rejected alternatives:
- Continuing chunk-edge tuning before object identity gets a measured pass.
- Moving to hidden Anaheim/Ontario art before the public Riverside proof cell
  has stronger authored objects.
- Adding labels, panels, glows, cars, humans, signs, or decorative props to
  explain weak buildings.
- Adding a parallel object schema instead of using existing `CityWorldScene`
  object-family grammar.
- Allowing provider lookup, public candidate metadata, or paid/persistence
  scope to influence renderer geometry.

## Decision 040: Terrain corrections must move chunk-edge readability

Pre-Alpha 0.10E adds viewport-level `chunkEdgeReadabilityScore` to City World
diagnostics. Terrain work is no longer accepted on "looks better" alone: it
must move terrain massing coverage, empty-board ratio, first viewport
composition, and chunk-edge readability while preserving product behavior.

Reason: 0.9E centralized coordinate and sampling math, so terrain quality can
now be judged by the same engine contract the renderer consumes. Atlas needs
visible terrain shelves and world-edge structure, not another subjective
surface-stroke pass.

Rejected alternatives:
- Adding decorative props, labels, panels, cars, humans, or glows to hide flat
  terrain.
- Adding new terrain profile names before exhausting the existing massing and
  edge grammar.
- Improving hidden Anaheim draft art while the public Riverside terrain axis is
  still the weakest visible app metric.
- Treating screenshot taste as sufficient when diagnostics do not move.

## Decision 039: Atlas owns WorldBasis and TerrainSampler runtime contracts

Pre-Alpha 0.9E adds `CityWorldBasis` and `CityWorldTerrainSampler` under
`@atlas/core/voxel`. Board-space projection, tile diamond geometry, viewport
frames, frame intersection, terrain sampling, empty-board counts, terrain
massing counts, and road/lot/building contact helpers are now core contracts
instead of private renderer or diagnostics formulas.

Reason: Atlas needs a reusable voxel county engine. Future visual work should
move measured engine axes, not hand-tune scattered coordinate math. GameBlocks
is useful as a reference vocabulary, but Atlas must own the runtime contract.

Rejected alternatives:
- Vendoring GameBlocks or adding Three/Rapier/runtime dependency drift.
- Letting the Pixi renderer keep raw projection and diamond formulas.
- Letting diagnostics maintain separate viewport, terrain, or contact math.
- Treating 0.9E as a screenshot-quality claim instead of infrastructure for
  better measured slices.
- Using provider/Google data to create map geometry or county readiness.

## Decision 038: Terrain chunk massing is a stronger layer than chunk-edge strokes

Pre-Alpha 0.6E adds `terrainChunkMassing` to `CityWorldScene` visual grammar.
The compiler now identifies outer world-edge mass, civic plinth mass,
residential shelf mass, commercial slab mass, park basin cut mass, waterfront
bank cut mass, shell boundary mass, and hidden draft mass.

Reason: 0.5E proved terrain elevation and chunk-edge language, but it remained
too subtle. Atlas needs terrain shelves and world edges to read structurally in
the first three seconds of the screenshot.

Rejected alternatives:
- Treating 0.5E as final terrain depth.
- Adding more small strokes without larger side faces and mass silhouettes.
- Adding cars, humans, labels, panels, or decorative props to make weak terrain
  look busier.
- Exposing Anaheim/Ontario public states because hidden draft terrain has
  richer internal massing.

## Decision 037: Terrain elevation and chunk edges are scene grammar

Pre-Alpha 0.5E adds `terrainElevation`, `parcelElevation`, and `chunkEdge` to
`CityWorldScene` visual grammar. Terrain now distinguishes flat fields, raised
parcel shelves, civic plinth shelves, commercial slab fields, park basin
shelves, water-edge cuts, shell-flat terrain, hidden-draft shelves, and bounded
chunk-edge roles. Lots now distinguish thin pad lips, raised home shelves,
commercial slab lips, civic plinth stacks, apartment court lips, park basin
lips, waterfront bank cuts, and hidden anchor shelves.

Reason: 0.4E improved surface composition, but the world still needed physical
depth. Atlas should read as a voxel county board with shallow terrain thickness,
raised parcel shelves, and cut banks, not painted patterns on a flat grid.

Rejected alternatives:
- Adding more surface strokes without a typed compiler contract.
- Adding cars, humans, signs, glows, or labels to make flat terrain feel busy.
- Letting hidden Anaheim/Ontario draft chunk grammar imply public playability.

## Decision 036: Terrain and parcels use compiler-owned composition grammar

Pre-Alpha 0.4E adds `terrainComposition` and `parcelComposition` to
`CityWorldScene` visual grammar. Terrain now distinguishes quiet fields,
neighborhood yard fabric, civic focus fields, commercial apron fields, park
basins, waterfront strata, shell boundaries, and hidden draft fields. Lots now
distinguish home yard grids, commercial aprons, civic landmark plinths,
apartment courts, park basins, waterfront banks, and hidden draft anchor pads.

Reason: Atlas needs the map base to feel authored before more districts are
promoted. Buildings, roads, and labels cannot carry the entire first read; the
county surface itself must communicate parcel structure, civic focus, and
ground contact.

Rejected alternatives:
- Adding cars, humans, benches, signs, glows, panels, or labels to make empty
  areas feel busy.
- Letting the renderer guess terrain composition from provider or Google
  payloads.
- Exposing Anaheim/Ontario public states because hidden draft terrain has more
  complete internal grammar.

## Decision 035: Object authorship is compiler-owned scene grammar

Pre-Alpha 0.3E adds object-authorship metadata to `CityWorldScene` visual
grammar. Buildings now expose `objectFamily`, `clusterRole`, and
`noLabelPriority` so the compiler, renderer, tests, and visual packet verifiers
can agree on what a building is meant to read as before labels help.

Reason: Atlas needs a reusable voxel county engine, not hand-tuned blocks per
district. Riverside civic, residential, commerce, service, and apartment forms
must share the same engine language that future Anaheim/Ontario hidden drafts
use for venue and transit anchors.

Rejected alternatives:
- Making no-label recognition a public UI label or product claim.
- Letting provider lookup or Google payloads decide map geometry or readiness.
- Hiding generic object art with cars, humans, decorative props, panels, glows,
  or more labels.
- Treating Anaheim/Ontario hidden draft anchors as public/playable because they
  have internal no-label priority.

## Decision 034: Roads and roofs use compiler-owned visual grammar

Pre-Alpha 0.2E makes road, lot, terrain, building material, roof material, and
contact-shadow language part of `CityWorldScene` metadata. The renderer can
improve physical road slabs, roof courses, parcel pads, and foundations from
those profiles, but it must not infer provider readiness or invent product state.

Reason: Atlas needs a reusable voxel county engine, not one-off renderer
patches. Future Riverside, Anaheim, Ontario, and USA county slices should share
style vocabulary such as `embedded_asphalt_slab`, `flat_parapet_cap`, and
`parcel_pad_shadow`.

Rejected alternatives:
- Driving map geometry directly from provider lookup results.
- Hiding weak building/road grammar with cars, humans, decorative props, labels,
  dashboards, or glows.
- Keeping visual style only as undocumented renderer magic.

## Decision 033: Axiom wakeups must read real worker threads

Axiom light/full-power wakeups run from
`C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc` and must read the real Forge,
Lumen, and Mira threads in small chunks before summarizing worker state or
dispatching work. The repo verifies this with
`scripts/verify-big4-wakeup-protocol.mjs`.

Reason: manager memory and stale summaries are not enough for the Big 4 model.
Finished artifacts must be read from the real owner threads before Axiom makes
release or next-slice decisions.

Rejected alternatives:
- Creating local Mira/Forge/Lumen clones in Axiom's thread.
- Mutating Railway or GitHub as a communication shortcut before a local status
  artifact proves the shape.
- Letting light wakeups run from the old mixed Atlas tree.

## Decision 032: Second-district promotion requires aggregate readiness

Anaheim and Ontario cannot become public or playable from candidate metadata,
hidden draft scenes, source notes, visual screenshots, or split guard output in
isolation. Promotion discussion must use the Forge readiness aggregate produced
by `scripts/verify-second-district-readiness.mjs`, which combines data,
source-to-scene trace, visual packet status, product proof status, and release
split guard state. Missing visual, product, or release acceptance keeps
`readyForPlayablePromotion: false`.

## Decision 001: Mock-first

Build against curated Riverside data and MockGeoDataAdapter before real Google APIs.

## Decision 002: PixiJS first renderer

Use PixiJS for Alpha if clean. Use SVG/Canvas fallback if it slows the build.

## Decision 003: Google Maps is signal input, not visual identity

Google data helps resolve places and counts. Atlas renders its own voxel world.

## Decision 004: Apps SDK tools stay focused

Free Alpha tools are only county, Clawd, Scout Drop, campaign preview, upgrade prompt.

## Decision 005: Hosted Clawd is Beta

Do not build payments/auth until the Eastvale demo works.

## Decision 006: Root Apps SDK starter is temporary

The existing root `server/` and `web/` directories remain as a working local Apps SDK sandbox. New Atlas architecture should land in `apps/` and `packages/` and later replace or absorb the starter deliberately.

## Decision 007: County pack validation lives in core

Curated county pack schemas, parsing, and file loading live in `@atlas/core` so MCP tools, renderers, and later services share the same typed source of truth.

## Decision 008: Google geo is opt-in but no longer deferred

The user explicitly wants to leave mock mode quickly. `MockGeoDataAdapter` remains the safe fallback, but Railway and local backend runs should use `GEO_DATA_ADAPTER=google` once `GOOGLE_MAPS_API_KEY` is set. The frontend never receives the API key.

## Decision 009: SVG renderer before PixiJS

Quest E3 uses a code-native SVG isometric renderer instead of adding PixiJS immediately. The renderer consumes `VoxelScene` only, keeps Alpha lean, and leaves PixiJS as an upgrade path if later animation/camera needs justify the dependency.

## Decision 010: Scout Drop Alpha is deterministic preview state

Quest E4 uses curated Riverside `VoxelScene` nodes to score and format the Eastvale mobile-detailing Scout Drop. Apps SDK tools keep model-visible `structuredContent` concise and put renderer-heavy `VoxelScene` data in widget-only `_meta`; they do not geocode live, persist state, post, DM, execute ads, or claim saved Hosted Clawd behavior.

## Decision 011: Pixi tactical renderer is default with SVG fallback

E4.5 promotes PixiJS to the default map-stage renderer for the Atlas board while keeping the existing SVG renderer as the fallback. The renderer still consumes only `VoxelScene`, and richer visual details stay optional so older scene payloads can continue to render.

## Decision 012: Campaign Engine is manual preview state

E5 creates a 7-day manual campaign preview from an existing `ScoutPreviewState`. It can draft planning structure, route priorities, and asset placeholders, but it must not post, DM, execute paid ads, persist state, or imply Hosted Clawd behavior before Beta.

## Decision 013: Submission surface is product-only

E6 removes starter-era brief tools from the exposed MCP surface and keeps the review-facing Alpha tools to `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. All exposed Alpha tools are read-only, non-destructive, closed-world, and return explicit output schemas.

## Decision 014: Map-first city world before Quest Preview

E6.6 parks the partial Quest Preview slice and makes the visible Alpha experience a geo-grounded city/world map. `VoxelScene` now carries optional `VoxelWorld` data for country/state/county/district/place hierarchy, known places, ambient activity, session-only stickers, and session-only notes. Campaign and Scout tools remain available, but the default UI opens on the map.

## Decision 015: Full-screen CityWorldRenderer is the next map target

The current card/panel voxel UI should not be iterated further. E7.0 will replace the visible map UI with a full-screen Pixi `CityWorldRenderer` driven by typed `CityWorldScene` data. React is limited to tiny HUD overlays. Lottie is limited to optional UI-only animation, Rive is deferred for future Clawd state-machine animation, and Three.js remains out of scope.

## Decision 016: Hybrid voxel art before real atlases

E7.1 improves the city map through code-generated Pixi art while adding atlas-ready metadata to `CityWorldScene`. This keeps the Alpha shippable without new dependencies, but gives each building, prop, actor, and terrain object stable keys for future tile and sprite atlas replacement. Pixi remains responsible for map objects and animation; Lottie stays UI-only, Rive stays deferred for Clawd, and no dashboard/card shell returns.

## Decision 017: USA-scale engine through backend world contracts

Atlas V1 should target the entire United States, but not by rendering a giant national canvas. The backend owns national indexing, provider adapters, cache/TTL/source policy, and normalized country/state/county/district/place identity. The renderer consumes bounded `CityWorldScene` slices for the selected county or district. Additional MCP servers or connectors should be added only when they solve a concrete deploy, provider, database, or submission-review bottleneck.

## Decision 018: ChatGPT county selection compiles from curated packs

The first real ChatGPT demo slice starts with `select_county` for Riverside. The server loads the curated Riverside county pack, compiles a typed `VoxelScene`, highlights Eastvale, and sends the full scene to the widget through `_meta.scene`. Renderers consume Atlas scene contracts only; raw Google/provider payloads stay behind backend adapters.

## Decision 019: First real sprite ships as bundled data URL

E7.4 proves the atlas resolver sprite path with `pin-sticker-favorite.svg`. The web build inlines SVG textures as data URLs, and Pixi loads them through `Assets.load` before the resolver returns sprite mode. This keeps the ChatGPT widget self-contained with no broader resource domain while preserving primitive fallback during load failure or missing textures.

## Decision 020: County questions stay closed-world in Alpha

E8.6 adds `ask_county_question` as a read-only curated-data tool, not a broad Q&A engine. It answers Riverside/Eastvale questions from the county pack and source notes only, refuses unsupported counties or business claims, and does not call Google, save state, grant XP, or claim live market truth.

## Decision 021: Production promotion requires explicit gates

Atlas work progresses through named maturity levels: mock scaffold, curated Alpha, verified live read-only, persisted Beta, and production release. Any slice that promotes mocks, curated claims, live provider scope, persistence, money, or automation must name the human approval gate before it crosses that boundary.

## Decision 022: Hosted Clawd contracts precede persistence

E9.0 defines Hosted Clawd Beta entities, tool gates, pricing boundaries, and required tests before any auth, database, Stripe, evidence, or XP code. The next implementation step must first clear `HUMAN_APPROVAL_BEFORE_PERSISTENCE`; checkout or pricing work also requires `HUMAN_APPROVAL_BEFORE_MONEY`.

## Decision 023: Hosted Clawd uses Stripe Billing hosted subscription flow

Hosted Clawd Beta should use Stripe Billing with Stripe-hosted Checkout Sessions in `subscription` mode, recurring Prices, webhook-synced subscription state, and Stripe Customer Portal for billing management. Atlas should not use raw PaymentIntents, success-page redirects, or client-trusted prices to grant Hosted Clawd access. No Stripe mutations or billing code start before `HUMAN_APPROVAL_BEFORE_MONEY` and persistence approval.

## Decision 024: Persistence comes before paid checkout

Hosted Clawd should first prove account ownership and saved business/campaign state before Stripe gates are implemented. The recommended first saved capability is a confirmed business profile plus a saved campaign preview from an existing Scout Drop. Evidence, XP, weekly reports, exports, and Stripe checkout stay behind later gates so the first persisted slice can focus on ownership, idempotency, and session-only versus saved-state clarity.

## Decision 025: Engine Beta precedes Paid Beta

Alpha Path B is accepted, but the next Beta target is the voxel county engine,
not Hosted Clawd monetization. Atlas must first remove decorative scene noise,
tighten building/road/camera quality, and prove the map-first product loop with
desktop and mobile screenshots. Hosted Clawd persistence, Stripe, XP, evidence,
OAuth, automation, reports, and exports remain parked until Engine Beta is
visually credible and the human explicitly reopens those gates.

## Decision 026: Production object intake is fallback-first

Engine Beta can promote vetted object-kit assets from the standalone lab into
the production city-world renderer, but only through atlas manifest metadata,
resolver-loaded bundled textures, and primitive fallback. The renderer may draw
sprite-backed buildings when the texture resolves cleanly, while every asset
must fail back to the existing map object. The first accepted production intake
path is building-focused: rowhome and strip-store assets can render in the
production map. The road-corner asset remains registered but is not drawn in
runtime because repeated road-cap placement reads as pasted-on clutter; future
road work should solve this as road-module geometry, not decorative sprite
stamping.

## Decision 027: Anaheim is the first second-district candidate

The first non-Riverside playable-district candidate is Anaheim in Orange
County, with Ontario in San Bernardino County as the follow-up candidate.
Both remain non-playable `L1_COUNTY_SHELL` metadata until they have curated
district packs, source notes, bounded scene compiler proof, desktop/mobile
product-loop screenshots, Lumen visual acceptance, Mira readiness acceptance,
and Forge split guard. Candidate metadata is not a playable claim and is not a
provider-normalized or public-quality coverage claim.

## Decision 028: District candidate packs are separate from playable county packs

Anaheim candidate preparation uses a dedicated `DistrictCandidatePack` contract
instead of the old Riverside county-pack schema. Candidate packs may describe
source notes, anchor requirements, scene stressors, acceptance criteria, and
reject rules, but they must remain `candidate_only`, `playableNow: false`, and
`renderableNow: false` until source-noted place anchors and bounded compiler
proof exist. This prevents a data-readiness artifact from becoming a fake
playable county by metadata flip.

## Decision 029: Anaheim place anchors are source-noted but non-renderable

Anaheim's first place-anchor artifact may name real local anchors only when
each one has an explicit source note, but the anchors do not become scene
objects yet. Every E12.3 anchor remains `providerNormalized: false`,
`renderableNow: false`, and `sceneEligible: false` until coordinates or bounds,
category confidence, compiler placement, desktop/mobile screenshots, and the
Big 4 release gates pass.

## Decision 037: Anaheim draft scenes are non-public compiler evidence

E12.4 may compile Anaheim's source-noted anchors into a bounded draft
`CityWorldScene`, but that scene is compiler evidence only. It stays
`L1_COUNTY_SHELL`, `playable: false`, outside the public county switcher, and
outside the MCP playable scene path until screenshot review, product readiness,
visual acceptance, and release split gates explicitly promote it. A draft scene
cannot create fake places, public-quality claims, provider-normalized claims,
session tools, actors, pins, or selected-place state.

## Decision 027: USA release scales through coverage tiers

Atlas public release should grow from Eastvale to California to the USA through
explicit county readiness tiers, not by rendering a giant national canvas or
pretending every county has equal data quality. Eastvale/Riverside remains the
proof cell. California is the next coverage layer. The USA engine must support
normalized country/state/county/district/place identity, bounded
`CityWorldScene` compilation, honest unsupported-county responses, source and
confidence notes, and fallback-first object rendering. Provider data stays
behind backend adapters and never becomes a renderer contract.

## Decision 028: California shells are identity coverage, not playable scenes

E10.1 promotes California county identity to a checked world contract using the
Census 2024 county gazetteer. Riverside County is the only playable county in
this slice because it has the curated Eastvale scene. Other California counties
are `L1_COUNTY_SHELL`: Atlas can name and locate them, but it must not compile
fake local scenes, fake place data, or Riverside stand-ins for them. ChatGPT
tools may return `countyCoverageSummary` for shell counties, while full
`_meta.scene` payloads remain limited to `riverside-ca` until another curated
district is approved.

## Decision 029: Shell scenes are separate from playable scenes

E10.2 adds `_meta.coverageShellScene` as the safe scene contract for indexed
but non-playable counties. It is a `CityWorldScene` shell with coverage
metadata and terrain/camera defaults only. It deliberately has no places,
buildings, roads, lots, pins, actors, saved state, or local claims. The
existing `_meta.scene` key remains reserved for playable `VoxelScene` payloads
such as Riverside/Eastvale, so the widget and ChatGPT tools can distinguish a
real playable map from an honest county shell.

## Decision 030: Shell counties get a separate widget surface

E10.3 renders `countyCoverageSummary` results through a dedicated coverage
shell UI instead of falling back to the playable Riverside tray. The shell view
may show `_meta.coverageShellScene`, coverage tier, source notes, and
readiness limitations, but it must not show selected-place tools, sticker
tools, note input, fake places, saved state, XP, evidence, live coverage, or
automation claims. This keeps California-scale coverage visible while
preserving the boundary that only Riverside/Eastvale is playable in the current
Engine Beta slice.

## Decision 031: Unsupported counties use refusal state, not a map stand-in

E10.4 confirms that `L0_UNSUPPORTED` counties share the coverage-status UI
family but do not receive a `coverageShellScene` canvas. Atlas should only show
a shell map when the county is indexed as identity coverage. Unknown counties
must say they are unsupported, show zero playable districts and zero places,
and point users back to the playable Riverside/Eastvale slice without borrowing
Riverside visuals or implying future saved/live coverage.

## Decision 032: Recovery from coverage states points to the proof slice

E10.5 makes the coverage UI actionable without turning shell counties into the
product. Indexed shell counties and unsupported counties get one recovery
action: open Riverside/Eastvale playable Alpha. Atlas should not add disabled
dashboards, fake place lists, or broad county navigation to compensate for
coverage gaps. The fastest honest path is always: show the coverage tier,
explain the boundary, and give the user a route back to the current playable
county world.

## Decision 033: Census identity verification gates county-scale claims

E10.8 adds a source verifier for the California county index. Census gazetteer
identity data is allowed to prove county names, GEOIDs, representative
centroids, and the Eastvale place GEOID anchor, but it does not make a county
playable, provider-normalized, or public-quality. Future state or county index
expansion should pass the same kind of source verification before Atlas makes
coverage claims, and provider/place readiness must remain a separate adapter
and QA gate.

## Decision 034: Census source files stay temp-cached by default

E10.9 keeps raw Census gazetteer downloads out of the repo by default. The
county source verifier may download or reuse the 2024 Census county/place
gazetteers in a temp cache, and release logs must show whether each source was
downloaded or cached. Offline verification is allowed only when that cache is
already present; missing-cache failures should be explicit blockers, not silent
network fallbacks. Checked raw fixtures require a separate Axiom approval
because source identity verification is a release gate, not a broad data
ingestion lane.

## Decision 035: District candidates are not playable coverage

E11.6 introduces candidate-only district metadata for future California
expansion. Anaheim and Ontario can be named as Census-anchored district
candidates, but they remain non-playable `L1_COUNTY_SHELL` metadata with zero
places until a curated district pack, source notes, compiler proof, product
loop screenshots, and release-readiness review exist. Candidate metadata may
describe readiness gaps; it must not create fake scenes, fake local places,
provider-normalized claims, or public-quality claims.

## Decision 036: Big 4 work is artifact-first

Mira, Lumen, and Forge are not approval-only workers during Engine Beta. Each
captain owns bounded build artifacts in their lane before giving final gates:
Lumen owns visual-engine code, Mira owns product-surface code and verifier
quality, and Forge owns data/backend contracts and release safety scripts.
Axiom remains the integration GM and final release authority. Gate-only reports
are valid only after an artifact exists or when Axiom explicitly asks for a
final release verdict.

## Decision 037: Anaheim official venue names require a promotion gate

Anaheim draft anchors may use official source notes and internal labels while
the scene is hidden, non-playable, and non-public. Public promotion requires a
separate naming/app-review decision for official venue labels such as Anaheim
Convention Center, ARTIC, Angel Stadium, and Downtown Anaheim Community Center.
Source notes, procedural silhouettes, and one source-art venue asset are not
enough to claim public-quality coverage.

## Decision 038: Playable tools derive from backend coverage boundary

Selected-place tray, sticker tools, note input, Scout Drop, and campaign preview
are public playable affordances. They may appear only when the public coverage
DTO has `coverageTier === "L2_CURATED_DISTRICT"` and
`playableDistrictCount > 0`. Shell counties, unsupported counties, and hidden
draft evidence must expose separate DTO kinds and an empty playable-tool list.
Future Hosted Clawd state remains a separate explicit DTO until persistence is
approved.

## Decision 039: Provider lookup is not provider readiness

Google Maps-backed `lookup_world_places` may resolve places and return
normalized read-only Atlas categories, but it does not promote a county or
district to `L3_PROVIDER_NORMALIZED`, scene-eligible, public-quality, or
playable. Provider-derived readiness needs its own typed contract with source
notes, cache TTL, confidence/status, category normalization, and raw-payload
leak checks. Until that contract exists and passes verification, provider data
stays a lookup surface behind `GeoDataAdapter`, not a scene compiler input.

## Decision 040: Provider readiness metadata is lookup-only by default

E12.16 adds `providerReadiness` to world lookup responses so Atlas can describe
provider lookup quality without promoting coverage. The contract may expose
sources, adapter mode, cache key/TTL, normalized category status, normalized
category confidence, and limitations, but `coveragePromotion`, `sceneEligible`,
and `publicQuality` must remain false unless a separate promotion slice defines
and verifies stronger evidence. Provider readiness metadata is not persistence,
not a scene compiler input, not public-quality proof, and not a playable county
claim.

## Decision 041: Native voxel grammar outranks pasted source art

Source SVG or PNG assets are useful as inspectable art artifacts and reference
targets, but they are not automatically the production runtime answer. If a
large venue asset reads pasted-on, floats against the lot system, depends on a
label, or fails mobile after two anchor/scale attempts, the renderer should
fall back to native voxel geometry with primitive metadata rather than forcing
the asset. Public promotion requires the runtime scene to read as a coherent
voxel county world before labels, not merely to possess source-art files.

## Decision 042: Public residential palette should be regional and restrained

Riverside/Eastvale common homes should use a warm SoCal-inspired material ramp:
stucco creams, muted terracotta, clay, sage, taupe, and restrained teal/blue
accents. Loud primary roof colors may appear in hidden drafts or experiments,
but they should not drive the public proof cell because they make repeated
houses read like generic default blocks. Future residential art should add
quality through roof massing, eaves, foundation/contact, window rhythm, and
face separation rather than brighter colors, props, labels, cars, or humans.

## Decision 043: Second districts require a promotion gate packet

Anaheim or Ontario may not appear as a public playable switcher option until a
promotion gate packet exists and passes. The packet must include candidate
identity, source-noted anchors, a draft-only curated pack, provider-readiness
hard-false promotion boundaries, bounded compiler proof, desktop/mobile
screenshot proof, Mira readiness acceptance, Lumen visual acceptance, and Forge
split guard. Candidate metadata, hidden draft scenes, lookup results, source
art, and local renderer polish are not sufficient public playability evidence
by themselves.

## Decision 044: Riverside-only polish is no longer the main lane

Riverside/Eastvale remains the playable regression anchor and quality reference,
but it should not consume full artifact cycles for tiny visual deltas. Future
Riverside work must either generalize the renderer/object kit, fix a real
mobile or product-comprehension bug, or directly support second-district proof.
The main expansion lane is now the candidate-to-playable pipeline for a second
California district, with strict no-fake-playability gates before any public UI.

## Decision 045: External references are checklists, not dependencies

The `chatgpt-app-skill` GitHub repository is useful as a ChatGPT app quality
checklist, especially for tool language, response layering, widget/mobile proof,
golden prompts, and submission readiness. Atlas will not install or vendor it
automatically. The same rule applies to voxel/isometric GitHub references: use
them to sharpen engine standards such as face separation, tile grammar,
batchable modules, and no-label object recognition, but do not add runtime
dependencies without a separate implementation decision and verification plan.

## Decision 046: Provider usage policy belongs in `@atlas/geo`

The Axiom handoff pack proposed a standalone `shared/contracts` and
`server/src/geo` provider stack, but the RC already has `@atlas/geo` as the
adapter boundary and `@atlas/core` as the readiness/world contract boundary.
Pre-Alpha 0.1E therefore adapts the provider policy into `packages/geo/src`
instead of creating a disconnected parallel service. Google lookup signals must
carry usage policy flags that default to non-renderable, non-cacheable, and
non-readiness. Mock lookup may remain cacheable for local smoke checks, but it
is still not scene eligibility or playable coverage. Future server `GeoGateway`
work should wrap this package rather than bypass it.

## Decision 047: Engine progress requires diagnostics, not screenshot vibes

Pre-Alpha 0.6F makes `CityWorldScene` diagnostics the proof floor for future
voxel-engine work. Screenshots still matter, but no visual slice may claim
progress unless it names and moves an engine metric such as terrain massing,
empty-board ratio, object-family coverage, road/lot/building contact, clone
pressure, first-viewport composition, no-label readiness, fallback safety, or
provider isolation. The debug overlay is development-only behind
`atlasDebug=engine`; it must never become public product UI. Hard blockers
remain fake playability, provider payloads in scene data, public hidden-draft
exposure, cars/walkers, decorative clutter, and debug leakage into normal
ChatGPT app states.

## Decision 048: Terrain metric lifts must come from structural massing

Pre-Alpha 0.7E raises Riverside terrain and viewport metrics by expanding
structural terrain grammar and renderer shelf treatment, not by adding props,
labels, or fake object density. Future terrain slices must preserve that rule:
metrics may improve through chunk fields, shelves, strata, edge faces, camera
framing, or object-kit structure, but not through cars, humans, filler props,
panels, provider geometry, or public hidden-draft promotion.

## Decision 049: GameBlocks is an adapter reference, not an engine dependency

The `xt4d/GameBlocks` repository may inform Atlas engine discipline for
`WorldBasis`, planar math, terrain sampling, board bounds, diagnostics, and
camera-framing proof. Atlas will not vendor it, install it, or import its
Three/Rapier/gameplay systems into runtime. Any useful pattern must be adapted
into Atlas-owned `@atlas/core`, `CityWorldScene`, diagnostics, or Pixi renderer
contracts with a focused verifier. Actor motion, vehicles, combat, generic HUDs,
and persistent local game settings remain out of scope for Atlas Engine Beta.

## Decision 050: Hidden no-label recognition is not public playability

Pre-Alpha 0.8E lets Anaheim pass a hidden no-label recognition packet for
Anaheim Convention Center and ARTIC / Angel Stadium area, but the only allowed
outcome is `HIDDEN_DRAFT_ONLY`. A hidden draft packet may prove object-family
separation and screenshot readiness for internal review; it may not create a
public switcher state, playable claim, selected-place tray, pins, actors,
session tools, provider-readiness claim, or county promotion. Anaheim remains
blocked from public promotion until source-object art, product proof, visual
review, data readiness, and release gates all pass together.

## Decision 051: Atlas is a county-to-scene engine, not a generic game engine

Atlas should use engine-building references as discipline, not as runtime
identity. The core engine is the source-to-scene pipeline: identity/source data,
provider policy, candidate readiness contracts, scene compiler, basis/sampling
diagnostics, Pixi renderer, Apps SDK tool output, and release guard. Future
engine slices must name the axis, typed contract, metric, verifier,
screenshot/product proof, blocked public claim, and forbidden files. Atlas will
not solve engine gaps by adding generic game systems, public debug UI, cars,
humans, decorative props, provider geometry, or dashboard surfaces.

## Decision 052: Object-art work must name the weakest face/anchor metric

Pre-Alpha 0.14E makes face orientation and source-art contrast part of the
engine diagnostics layer. Future object-art work cannot claim progress from a
general taste pass alone; it must name the metric it is moving and target the
weakest reported object family or hidden anchor. The current public target is
`civic_landmark` / Eastvale Core, and the current hidden Anaheim target is
`angel-stadium`. Anaheim and Ontario remain hidden/non-playable until source
art, product proof, visual review, data readiness, and release gates pass
together.

## Decision 053: Public Alpha proof outranks new feature work after 0.17E

Pre-Alpha 0.17E made the Scout Drop and Campaign Preview loop explicit enough
for Alpha: session-only, no saves, no action execution, no XP, Hosted Clawd
required before saved state, and clear next-tool flow. After the 0.18A local RC
freeze passes, Axiom must deploy and prove the public app before starting more
engine, art, data, or product-surface slices. Public proof must preserve the
seven-tool list, Riverside/Eastvale as the only playable district, California
shell honesty, Orange/L0 recovery, provider isolation, and the no paid /
persistence / automation boundary.

## Decision 054: Railway public Alpha is the post-0.20A baseline

0.19A/0.20A deployed the current Alpha RC to Railway and passed public preview,
MCP, submission, and Engine Beta coverage proof at
`https://atlas-backend-production-e6fc.up.railway.app`. This public deployment
is the baseline for post-Alpha work. New slices must either improve a named
public product blocker or advance hidden second-district readiness without
changing public playability claims. Riverside/Eastvale remains the only public
playable district; Anaheim/Ontario remain hidden/non-public; paid,
persistence, Hosted Clawd, XP, evidence, OAuth, automation, reports, and exports
remain parked until explicitly reopened.

## Decision 055: Post-Alpha work follows the Engine Beta spine

After the 0.21A Alpha Handoff Lock, Atlas moves into Engine Beta rather than
Paid Beta. Public slices must improve the ChatGPT app first-read or the voxel
county engine; hidden slices may advance Anaheim/Ontario readiness only through
source, visual, product, split, and provider gates. Anaheim and Ontario may not
become public switcher states, playable districts, or provider-readiness claims
from metadata flips. Hosted Clawd, DB persistence, Stripe, XP, evidence, OAuth,
automation, reports, exports, and broad provider-backed coverage stay parked
until explicitly reopened.

## Decision 056: Missing worker-thread tools do not create fake worker state

Axiom must read and message the real Forge, Lumen, and Mira threads when the
Codex thread bridge is available. If those tools are absent in a wakeup, Axiom
may continue only with verified local integration artifacts and must report the
thread bridge as a blocker. It must not spawn local role clones, summarize stale
memory as current worker state, or treat a local sentinel/export as Forge,
Lumen, or Mira acceptance. Worker assignments remain unsent until the real
thread bridge is available.

## Decision 057: Hidden Anaheim venue proof is evidence, not promotion

0.23E is deployed and publicly proven, but Anaheim remains hidden and
non-playable. The hidden no-label packet may count as second-district readiness
evidence for Anaheim Convention Center and ARTIC / Angel Stadium area; it does
not create a public switcher state, playable county, selected-place tray, pins,
actors, session tools, provider-readiness claim, or public route. Public
promotion requires the 0.24E readiness aggregator plus explicit visual,
product, data, split, provider, and Axiom release gates. Until then,
Riverside/Eastvale remains the only public playable district.

## Decision 058: 0.24E readiness evidence can pass while promotion stays blocked

The second-district readiness aggregator separates evidence validity from
promotion approval. A visual packet or ChatGPT product proof can pass as
boundary evidence while still reporting `promotionReady: false` and
`publicPlayable: false`. That state is not a failed proof; it is a deliberate
blocker against fake playability. Anaheim may move forward only when the
aggregator reports no data, visual, product, or release blockers and Axiom
accepts the final public UI release cutline.

## Decision 059: 0.25E has only promote or block outcomes

The owner-gate closure slice cannot become another ambiguous planning loop.
0.25E either closes Lumen, Mira, Forge, and Axiom gates with evidence and
authorizes a controlled 0.26E Anaheim public playable spike, or it records the
remaining blockers and keeps Anaheim hidden while work returns to public Engine
Beta quality. Anaheim cannot become public through metadata flips, hidden draft
screenshots alone, provider lookup, or schedule pressure.

## Decision 060: 0.25E blocks Anaheim public promotion

The executed 0.25E owner-gate cutline outcome is `BLOCK_PROMOTION`. Anaheim has
valid source, hidden draft, visual packet, product boundary, and split evidence,
but it is not promotion-ready, public-playable, or owner-accepted. The next
work must not be a public Anaheim spike. Atlas should either improve the public
Riverside/Eastvale Engine Beta experience or run one focused hidden source-art
blocker before asking for another promotion review.

## Decision 061: Atlas loop automation is L2 assisted, not unattended

Atlas may use the loop-engineering pattern as local operating discipline:
`LOOP.md`, `STATE.md`, constraints, budget, run log, readiness verifier, and
scheduled Codex wakeups. It will not vendor `cobusgreyling/loop-engineering` or
add package/runtime dependencies for this. The loop must read real Forge,
Lumen, and Mira threads when thread tools are available; missing thread bridge
access is a blocker, not permission to invent worker acceptance. Deploys,
public second-district release, package/env changes, money, persistence, and
Hosted Clawd remain human-gated.

## Decision 062: 0.40E selects provider normalization preflight before more art

The 0.40E selector blocks another civic/service, terrain, mobile, commerce, or
public entry pass because the current verifiers are green and no exact
human-named blocker exists. Hidden Anaheim/Ontario readiness also remains
blocked because Anaheim is not promotion-ready and still has visual, product,
and release blockers. The next Engine Beta slice is therefore
`0.41E Provider Normalization Preflight / Lookup-to-Scene Boundary Contract`.
That slice may define typed lookup-to-scene boundaries and verifier gates, but
it may not turn provider lookup into scene geometry, coverage readiness, public
playable claims, persistence, paid scope, or new MCP tools.

## Decision 063: Provider lookup is source context, not scene input

0.41E makes provider normalization a hard boundary. Google/mock lookup results
may normalize place categories and source notes, but model-visible
`structuredContent` must use Atlas-owned lookup IDs and must not expose Google
`placeId`, `primaryType`, raw `types`, photos, phone, website, rating, reviews,
price level, opening hours, or raw provider payloads. Provider readiness remains
`lookup_only` with `coveragePromotion`, `sceneEligible`, `sceneGeometry`, and
`publicQuality` all false. Any future provider-normalized scene work needs a
separate gate; lookup alone cannot promote Anaheim/Ontario, any California
shell county, or a district into public playability.

## Decision 064: Runtime lookup proof does not widen provider scope

0.42E proves the 0.41E provider boundary through local REST and MCP runtime
calls. `lookup_world_places` may return Atlas-normalized lookup-only place
summaries and runtime cache metadata, but it still cannot create
`CityWorldScene` geometry, scene packets, county readiness, public-quality
claims, public Anaheim/Ontario exposure, DB persistence, new MCP tools, or paid
scope. Live provider normalization and any provider-to-scene pipeline remain
separate future gates.

## Decision 065: 0.43E selects hidden proof, not public promotion

The 0.43E selector blocks repeat public Riverside object, terrain, mobile,
commerce, provider, and product-entry work because the current verifiers are
green and no exact human-named blocker exists. The next Engine Beta axis is
`hidden_second_district_readiness`, but only as hidden Anaheim visual/product
proof. Anaheim and Ontario remain non-public and non-playable; public exposure
still requires visual, product, release, provider, and Axiom gates.

## Decision 066: 0.44E hidden proof is repo-local evidence, not promotion

0.44E converts hidden Anaheim visual/product proof from temp-path evidence into
a repo-local packet:
`artifacts/second-district-visual-packets/postalpha-0.44e-anaheim-hidden-proof`.
The visual packet, product proof, source-to-scene trace, readiness aggregate,
and split status pass as evidence. That does not authorize public playability:
the readiness aggregate remains `readyForPlayablePromotion: false`, the owner
cutline remains `BLOCK_PROMOTION`, and Anaheim/Ontario stay hidden,
non-public, and non-playable until explicit owner gates change the cutline.

## Decision 067: 0.45E requests owner review, not another hidden art loop

0.45E reads the 0.44E hidden proof packet and selects `owner_gate_review` with
decision `REQUEST_OWNER_REVIEW`. The controlled public Anaheim spike remains
blocked because promotion readiness is false and the owner cutline is still
`BLOCK_PROMOTION`. Since the visual and product proof are already present,
Atlas should not continue hidden art work without an owner-named blocker. The
next step is a 0.46E owner review packet for Lumen, Mira, Forge, and Axiom.

## Decision 068: Redis caches scene packets, not map interaction

`REDIS_PACKET_SPINE_NOT_RENDER_LOOP`: 0.72B introduces Redis as the production
scene packet cache, compile-lock, and job-queue spine. Railway may compile/cache
deterministic generated draft packets and warm them through a worker, but it is
not in the browser pan/zoom render loop. Generated drafts still travel through
`_meta`, remain non-playable, non-public, provider-free, and DB-unpersisted, and
the seven public MCP tools remain unchanged. Production Redis config must be
explicit; local/dev may fall back to memory.

## Decision 069: Ship-review artifacts are selected-RC evidence

The `national-generation-contract` split guard may include current ship-review
and USA-region quality evidence files, including 0.75S screenshot/audit packets,
clay reference-board inputs, 0.75R handoff notes, and 0.76 work packets. These
files are release-safety evidence and reviewer handoff material, not runtime
scope expansion. They do not authorize public Anaheim/Ontario promotion, new MCP
tools, provider geometry, persistence, money, deployment, or submission.

## Decision 070: Public notes are an explicit moderated map layer

Atlas may persist public notes only through the dedicated commons contract and
only after a player explicitly confirms `Post publicly`. Existing
private/session notes remain client-local and never auto-promote. Approved
notes render as restrained anchors in the active map, with ALL scoped to the
active county, NEARBY scoped to the selected place, and MINE preserving the
private flow while exposing only the player's own pending submissions. Public
identity is pseudonymous, new posts are pre-moderated, the feature is
default-off, and disabling `ATLAS_COMMONS_ENABLED` is the first rollback. This
decision authorizes the local foundation and staging preparation only; it does
not authorize production migration, connector changes, Auth0 mutation, public
enablement, or launch.
