# Hosted Clawd PRD

Status:
Product PRD for the Hosted Clawd paid Beta path. The current implementation
slice is a safe scaffold only.

## Problem

A local business owner can get a useful Atlas Scout Drop and campaign preview,
but Alpha forgets the work when the chat context ends. That makes Atlas feel
interesting but temporary. The paid product needs to preserve a real business
thread: what Clawd learned, what campaign was drafted, which manual actions are
next, and what progress the owner has made.

## Target User

Primary user:
A local owner-operator or small team selling services in a specific area.

Initial wedge:
Mobile detailing in Riverside/Eastvale.

User traits:
- knows the service area better than generic software does
- wants concrete local actions, not a dashboard to configure
- needs help staying consistent
- does not want Atlas to post, DM, buy ads, or make private-contact decisions
  for them

## Core Value

Hosted Clawd preserves momentum.

The owner can:
- confirm one business profile
- save a Scout Drop
- save a campaign draft
- turn campaign work into manual quests later
- return to the map and continue from the same business context

The free product stays useful. The paid product makes the work durable.

## Wedge

First paid Beta wedge:
`Drop Clawd in Eastvale for a mobile detailing business`, then save the business
profile and campaign preview.

Why this wedge works:
- one clear local business
- one visible map context
- one useful Scout Drop
- one manual campaign
- a natural reason to save progress

## Rental Model

Product language:
`Host Clawd for this business`

Meaning:
The user rents a persistent Clawd daemon tied to a business context inside
Atlas. The subscription is for saved memory, saved campaign work, progress
tracking, and later reports. It is not a generic SaaS seat and not an automated
marketing worker.

Free:
Clawd Companion, session-only.

Paid:
Hosted Clawd Daemon, persistent after approval.

## Pricing Placeholder

Planning placeholder:
`$20/month`

Rules:
- Keep this internal/planning-only until `HUMAN_APPROVAL_BEFORE_PUBLIC_CLAIM`
  and `HUMAN_APPROVAL_BEFORE_MONEY` are approved.
- Do not show live checkout before business context is confirmed.
- Do not grant paid access from Stripe redirect alone.

## First Paid Beta Scope

In:
- account-owned Hosted Clawd
- saved business profile
- saved Scout Drop summary and route
- saved campaign preview draft
- server-side ownership checks
- idempotent save requests
- usage-limit checks
- Stripe-hosted Checkout after persistence is working and the money gate opens
- inactive/payment-failed read-only state

Out:
- public pricing launch page
- full dashboard shell
- team accounts
- agencies or shared workspaces
- evidence upload
- real XP grants
- weekly report generation
- exports
- automated posting, DMs, ads, scraping, or scheduled outreach
- saved raw provider payloads
- new public MCP tools in the scaffold slice

## User Journey

1. User opens the Atlas map.
2. User selects a place or runs a Scout Drop.
3. User previews a campaign.
4. Atlas marks the work as session-only.
5. User opens the Hosted Clawd tray.
6. Atlas shows what would be saved before asking for account or payment.
7. If gates are closed, user sees waitlist state.
8. After persistence approval, user confirms business and save context.
9. After money approval, user continues to Stripe-hosted Checkout.
10. Atlas returns to the map and shows active, activating, or read-only status.

## Screen States

Waitlist:
`Hosted Clawd is not live yet. Join the waitlist to save this business when Beta opens.`

Confirm Save:
`Save this business, scout report, and campaign draft to Hosted Clawd.`

Checkout Pending:
`Hosted Clawd needs an active subscription before it can save new campaign work.`

Activating:
`Activating Hosted Clawd. Saved writes unlock after billing is confirmed.`

Active:
`Hosted Clawd is saving this business.`

Inactive or Payment Failed:
`Hosted Clawd is read-only until billing is fixed.`

## Success Metrics

Activation:
- percentage of Scout Drop users who open the Hosted Clawd tray
- percentage who confirm business context after persistence opens
- percentage who save the first campaign draft

Retention:
- users returning to a saved business within 7 days
- saved campaigns with at least one manual quest started later
- weekly active Hosted Clawd businesses

Quality:
- fewer confused save/payment questions in chat
- zero cases where Alpha copy implies saved state is live
- zero cases where paid access is granted without server-confirmed subscription

Safety:
- no automated outreach events
- no raw provider payloads in saved rows
- no cross-user read/write failures in ownership tests

## Copy Rules

Use:
- `Host Clawd for this business`
- `Save this scout report`
- `Turn this campaign into quests`
- `Session-only until Hosted Clawd is live`
- `Payment is not live in Alpha`

Avoid:
- `unlimited`
- `autopilot`
- `guaranteed leads`
- `AI employee`
- `hands-free`
- `seamless`
- `revolutionary`

## Release Criteria

Before paid Beta:
- human approves persistence gate
- storage provider and migration tool are chosen
- account identity path is chosen
- ownership and idempotency tests pass
- first saved business plus campaign draft survives reload
- human approves money gate
- Stripe test-mode checkout and webhook sync pass
- inactive subscription states block paid writes
- map-first mobile UI passes `390x844` proof
