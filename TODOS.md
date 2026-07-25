# TODOS

## 1. Billing flip runbook (post-evidence-bar)

- **What:** The exact sequence for turning revenue on once the beta evidence
  bar is hit: (1) confirm OpenAI policy on post-review monetization changes
  (design doc Open Q2 — default assumption: requires v-next resubmission);
  (2) wire live Stripe keys onto the existing hostedClawd test-billing
  foundation (`server/src/hostedClawd/billing.ts`, `verify:hosted-clawd-stripe-billing`);
  (3) staging flip-test with `ATLAS_HOSTED_CLAWD_MONEY_ENABLED=on`;
  (4) prod flip via flag or v-next resubmission per (1).
- **Why:** The revenue moment. The dark-billing architecture exists so this
  flip is fast; without the runbook the sequence lives only in the design doc.
- **Pros:** Zero-scramble monetization when evidence arrives.
- **Cons:** None — documentation of an already-designed path.
- **Context:** Community Atlas Launch design (2026-07-21, approved):
  billing ships dark; bar = ~100 activated/10 counties, 25% D7, cross-user
  reads (invite-token/OAuth-identified sessions only; min valid cohort 60/6).
  `HUMAN_APPROVAL_BEFORE_MONEY` gate stays honored.
- **Depends on / blocked by:** Beta evidence bar; OpenAI policy answer (Open Q2).

## 2. Moderation scaling plan (before strangers can write)

- **What:** Trigger + mechanics for opening note-writes beyond the beta
  allowlist. Launch config = instant publish + reportThreshold 3 auto-hide,
  writes allowlist-gated. Before public writes: flip atlasCommons to
  two-tier (pre-publication for unknown authors, instant for proven ones —
  service config supports both modes today) and/or add a second moderator.
  Define "proven author" (e.g., N published notes, 0 upheld reports).
- **Why:** Founder chose maximum aliveness for launch (correct for the
  r/place thesis while authors are invited). The moment write access opens
  to strangers, one moderator absorbs all post-hoc abuse risk and the store
  listing is the asset exposed.
- **Pros:** Cheapest insurance on the store listing; decision recorded
  before it's urgent.
- **Cons:** None now; slight config complexity when enacted.
- **Context:** `server/src/atlasCommons/service.ts` (codex branch) has
  moderation modes, report reasons, threshold auto-hide, moderation queue.
  Design doc Lane 2.3: public-read / invite-write GA posture, 24h SLA.
- **Depends on / blocked by:** Decision to open public writes (post-launch);
  Commons governance checklist items (named owner, policies) staying current.
