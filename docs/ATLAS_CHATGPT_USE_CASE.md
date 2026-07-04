# Atlas — The Use Case for a ChatGPT App

Why Atlas deserves to live inside ChatGPT, who it's for, and the copy that says so.
Feeds `0.50P` submission and replaces the placeholder positioning in
`chatgpt-app-submission.json` (current subtitle "Explore a voxel city map" undersells it
as a toy). Written with office-hours rigor: painkiller not vitamin, honest about limits.

---

## 1. The case in one sentence

**You're already asking ChatGPT "where should I start my local business and what's my first
move?" — Atlas turns that abstract question into a concrete, explorable voxel map of your
actual county, drops an agent (Clawd) onto the streets to scout the opportunity, and hands
you a 7-day launch plan — without leaving the chat, nothing to install.**

## 2. The core insight — why this only works *in* ChatGPT

This is not a website that happens to embed in ChatGPT. The chat is load-bearing:

- **Intent is already in the conversation.** Atlas doesn't have to acquire a user or get an
  app installed — ChatGPT already has them, mid-question, at the exact moment of intent. It's
  demand *capture*, not demand *generation*. That is the whole wedge.
- **ChatGPT is the reasoning; Atlas is the world.** The model can talk about local business
  forever but can't *show* you a place or send an agent to walk it. Atlas gives the model a
  body: a spatial world to reason *over*, an agent to drop *into* it, and a map to answer
  *with*. Neither half is the product alone — the pairing is.
- **The follow-up loop is native.** "What about a denser neighborhood?" "Make the campaign
  cheaper." "Who are the competitors on that route?" — the map re-answers in place while the
  conversation continues. A standalone app would make you restate context; ChatGPT keeps it.
- **Session-only is a feature, not a limitation.** No account, no download, nothing saved is
  the right default for an ambient in-chat tool — low commitment, privacy-safe — and it sets
  up the paid upgrade (Hosted Clawd) precisely when the user *wants* to keep and track it.

## 3. Who it's for (jobs-to-be-done)

**Primary wedge — the aspiring / early local-service operator.** Mobile detailing, cleaning,
lawn care, tutoring, food cart, handyman. High-intent, desperately specific, and *already
typing the question into ChatGPT*. Job: "Tell me where the demand is near me and give me a
concrete first move I can act on this week." This persona anchors the killer demo and the
paid conversion. **Decision (owner, 2026-07-04): position broad — serve all three personas as
a general local-scouting tool — but keep this operator demo as the flagship concrete example so
the broad pitch stays vivid, not mushy.**

Secondary — the **curious local explorer.** "Show me my town as a voxel world; what's here?"
Top-of-funnel and shareable (the map is a delight object); a slice converts into the primary
persona once they see Clawd scout something.

Tertiary — the **local-market researcher / SMB marketer.** Validate a location, sanity-check
a route, sketch outreach. Overlaps the primary wedge, skews more B2B; a later expansion, not
the launch story.

## 4. The killer demo — the 30-second moment of magic

Already wired as the `preview_scout_drop` → `preview_campaign_engine` flow. The arc:

```
"Drop Clawd in Eastvale for a mobile detailing business."
   → a voxel Eastvale materializes in the chat
   → Clawd walks a route, drops pins
   → "3 strong signals: dense apartment blocks with no nearby detailer · weekend
      foot traffic at Plaza Row · an underserved gym crowd. 1 watch-out: permit rules."
   → "Here's your 7-day launch campaign" (days · channels · assets · guardrails)
   → "Want to save this and track results? → Hosted Clawd"
```

One question in, a spatial answer + an agent's scouting + an actionable plan out — in the
conversation the user was already having. That is the screenshot that sells the app.

## 5. What it beats (status quo)

- **Plain ChatGPT text** — reasons but can't show a place, can't scout, can't hand you a
  grounded plan tied to real streets.
- **Google/Apple Maps** — shows places but does no reasoning, has no scouting agent, produces
  no opportunity signals or campaign.
- **A consultant / a weekend of Reddit + spreadsheets** — slow, expensive, fragmented. Atlas
  is 30 seconds inside a chat.

The gap Atlas owns: *spatial ground truth + an agent + a plan, delivered conversationally.*

## 6. The free → paid arc

- **Free (Clawd Companion, session-only):** explore counties, ask local questions, scout
  previews, campaign previews. Must deliver real one-shot value — the scout report and 7-day
  plan have to be genuinely useful even if nothing is saved.
- **Paid (Hosted Clawd Daemon):** memory, saved campaigns, evidence, quests, XP, weekly
  reports, exports. The pitch: *turn a one-shot insight into an operating system for your
  local hustle.* Upgrade is offered exactly at the moment the user asks "can I save this?"

## 7. Honest weaknesses (name them, don't hide them)

- **Coverage is Riverside/Eastvale only today.** "Voxel the US" is the north star, not the
  current reality. The app already stays honest (playable / shell / unsupported states) —
  keep it that way; over-promising coverage is the fastest way to fail review and trust.
- **Session-only means fleeting value until Hosted Clawd.** The free loop must stand on its
  own or the paid tease feels hollow. Gate: is the scout report worth screenshotting?
- **The map must be substrate, not decoration.** If the voxels are just pretty, that's a
  weakness. They earn their place because Clawd's route, pins, places, and signals live *on*
  them — the map is how spatial reasoning is shown and manipulated. Keep tying map to signal.
- **Discovery depends on ChatGPT routing the intent to Atlas.** The trigger prompts and the
  "do NOT trigger" negatives (travel planning, spam, checkout) matter as much as the UI.

## 8. Why it's a *great ChatGPT app* specifically

- Map-first, ambient, content-first — fits OpenAI's app model (a tool that appears in service
  of a question, not a SaaS shell parked in a tab).
- Bounded, honest, session-only, no auto-messaging / no checkout in-app — clean on the safety
  and trust dimensions reviewers weigh.
- Uses the model for exactly what it's good at (open-ended local reasoning + dialogue) and the
  app for exactly what the model can't do (show a place, drop an agent, produce a plan).

## 9. Submission-ready positioning (replace the placeholders)

**APPLIED to `chatgpt-app-submission.json` `app_info` (2026-07-04)** — broad framing, and
keeps the `verify-submission.mjs`-required literals ("voxel city map", "session-only", "do not
save state"):

- **display_name:** Atlas
- **subtitle:** `Explore your county as a voxel city and scout it with an AI agent`
- **category:** BUSINESS
- **description:**
  `Atlas opens your county inside ChatGPT as an explorable voxel city map. Browse the streets,
  ask closed-world local questions, and drop Clawd — an AI companion — onto a place to scout
  opportunity signals, risks, and a route, then generate a manual 7-day campaign preview.
  Whether you're sizing up a local business, exploring your town, or researching a market, it
  all happens in the chat and is session-only: do not save state … Riverside/Eastvale is the
  playable Alpha; other California counties show honest coverage status. Google Maps read-only
  for lookups; Hosted Clawd persistence is planned, not live.`
- **Three hero prompts** (keep the existing tool examples as the long tail):
  1. `Drop Clawd in Eastvale for a mobile detailing business.` (the killer demo)
  2. `Open Atlas for Riverside County and show me Eastvale.` (the map hook)
  3. `Draft the first 7-day campaign from that scout drop.` (the payoff)

Keep the existing honesty guardrails and the "do NOT trigger" negatives (travel planning,
spam/DMs, checkout) verbatim — they are part of why this is a trustworthy ChatGPT app.
