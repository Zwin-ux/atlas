# Hosted Clawd Storage/Auth Decision Packet

Status:
0.59H source of truth. The human explicitly reopened DB/Auth preparation on
2026-07-05. This packet approves the implementation plan for persistence and
auth, but does not approve Stripe checkout, Billing Portal, webhooks, public
paid claims, evidence, XP, reports, exports, automation, or public
Anaheim/Ontario.

Current quest:
`0.59H Hosted Clawd Storage/Auth Decision Packet`.

Recommended next quest:
`0.60H Persistence Foundation`.

## Decision

Atlas should move into DB/Auth now.

Chosen stack for the first implementation:
- Production storage: Railway Postgres.
- Local/test storage: any Postgres reachable through `DATABASE_URL`; Docker
  Postgres is acceptable for local verification.
- Migration strategy: committed SQL migrations plus a small Node runner.
- Database client: `pg` in the 0.60H implementation slice, not in this
  decision-only slice.
- Auth model: OAuth/OIDC account linking for protected Hosted Clawd actions,
  using MCP auth hints for ChatGPT tool calls.
- First auth provider shape: Auth0-compatible OIDC provider with issuer,
  audience, JWKS, and scopes configured through server-only env.
- JWT verification library: likely `jose` in 0.60H; do not add the Auth0 SDK
  unless the implementation proves it is needed.
- First persisted capability: create or attach one owned Hosted Clawd, save one
  business profile, save one Scout Drop summary, and save one campaign preview
  draft from an existing free Alpha preview.
- Stripe timing: 0.62H, after 0.60H ownership, idempotency, usage, and reload
  tests are boring.

## Why This Order

Hosted Clawd is not real until Atlas can remember a business and return to it.
That means DB/Auth is now the product ceiling, not a future luxury.

Stripe is still downstream. Charging before owner-protected persistence would
make access control, support, and refunds harder to reason about. The next code
slice should prove saved ownership first, then Stripe can gate writes through
webhook-backed subscription state.

## Apps SDK Auth Contract

Atlas is a ChatGPT app, so auth must work for MCP tool calls, not just for the
iframe.

Rules:
- ChatGPT model text is never identity.
- Iframe cookies are not the core authorization contract.
- Protected Hosted Clawd actions use OAuth/OIDC account linking.
- Missing credentials should return an MCP auth challenge, not silently create
  session state.
- The server validates bearer tokens against issuer, audience, expiry, and
  signing keys before loading or writing Hosted Clawd state.
- The widget reflects saved state returned by server tools and APIs; it does
  not become the source of truth.

OAuth metadata needed in 0.60H or the auth-enabling slice:
- `/.well-known/oauth-protected-resource`
- protected resource URL matching the deployed `/mcp`
- authorization server issuer
- scopes for Hosted Clawd read/write
- `mcp/www_authenticate` or equivalent MCP auth challenge on protected calls

First scopes:
- `atlas:hosted_clawd.read`
- `atlas:hosted_clawd.write`

## Persistence Contract

0.60H should implement only the narrow saved path.

In:
- authenticated account context
- user row keyed by OIDC subject and email
- owned Clawd row
- owned business profile row
- saved Scout Drop summary/route/signals
- saved campaign preview draft/day rows
- usage event rows
- idempotency keys for create/save operations

Out:
- Stripe
- Customer Portal
- subscription-gated writes
- evidence uploads
- XP ledger
- weekly reports
- exports
- teams/agencies
- public pricing copy
- provider-created geometry

## Schema Envelope For 0.60H

Minimum tables:
- `users`
- `clawds`
- `business_profiles`
- `county_packs`
- `scout_drops`
- `scout_signals`
- `campaigns`
- `campaign_days`
- `usage_events`
- `idempotency_keys`
- `app_events`

Tables deliberately left for later:
- `subscriptions`
- `stripe_webhook_events`
- `quests`
- `evidence`
- `xp_events`
- `weekly_reports`
- `exports`

Core invariants:
- Every saved row has direct or inherited owner.
- Session Clawd ids never resolve as persisted Clawds.
- Saved Scout Drops pin county slug and source/version notes.
- Raw provider payloads are not stored.
- Repeated `client_request_id` returns the original saved object.
- Free Alpha remains session-only when unauthenticated.

## Service Boundary

0.60H should extend the existing `server/src/hostedClawd` port shape instead of
adding public MCP tools first.

Likely implementation files:
- `server/src/hostedClawd/types.ts`
- `server/src/hostedClawd/service.ts`
- `server/src/hostedClawd/auth.ts`
- `server/src/hostedClawd/postgres.ts`
- `server/src/hostedClawd/repository.ts`
- `server/src/hostedClawd/migrations.ts`
- `server/src/index.ts`
- `migrations/hosted-clawd/*.sql`
- focused Hosted Clawd tests
- a persistence verifier script

The public MCP surface remains the existing seven Alpha tools until a later
named slice adds protected Hosted Clawd tools. Existing map, scout, campaign,
and upgrade responses may show server-returned Hosted Clawd state.

## Save UX Contract

The UI should not become a pricing page or account dashboard.

0.61H save UX should show:
- compact saved-state strip over the map or inside the Hosted Clawd tray
- business confirmation
- location/county confirmation
- Scout Drop save status
- Campaign draft save status
- clear unauthenticated and read-only states
- a single primary action at a time

It must not show:
- generic SaaS homepage
- plan comparison cards
- floating mockup grid
- long account wizard
- public price claims
- automation promises
- evidence/XP/report/export claims before implementation

Fable constraint:
The saved-state UI must preserve the current map silhouette. It can add a tight
status rail or tray state, but it cannot cover the map with a dashboard shell.

## Required Tests For 0.60H

Ownership and auth:
- unauthenticated write is denied
- invalid token is denied
- wrong audience is denied
- expired token is denied
- User A cannot read User B's Clawd
- User A cannot write User B's business profile

Persistence:
- migration runs against empty Postgres
- create-or-attach Clawd is idempotent
- saving the same Scout Drop request twice returns one row
- saving the same campaign preview request twice returns one row
- saved campaign references the owned business profile and Scout Drop
- session Clawd id cannot be loaded as persisted Clawd

Product:
- free Alpha still works without auth
- unauthenticated Alpha still says session-only
- saved-state response is visible after reload/load
- no raw provider payload is persisted
- seven public Alpha tools remain stable

## Stripe Gate

0.62H may start only after 0.60H passes.

Stripe remains closed until:
- authenticated user exists
- saved Clawd exists
- saved business exists
- saved campaign preview exists
- usage events exist
- owner checks pass
- idempotency checks pass
- inactive/no-auth/read-only states are defined

Stripe requirements when opened:
- Stripe-hosted Checkout
- server-owned Price id or lookup key
- webhook-backed subscription state
- success URL grants nothing by itself
- Customer Portal requires owned Stripe customer id
- webhook replay table and signature verification

## Final CTO Call

Proceed with DB/Auth. Do not start Stripe in the same slice.

The product move is:
1. 0.59H: lock storage/auth decisions and verifier.
2. 0.60H: implement owner-protected persistence.
3. 0.61H: make saved state feel native in the map.
4. 0.62H: add Stripe test billing.
5. 0.63H: decide whether paid public claims can open.
