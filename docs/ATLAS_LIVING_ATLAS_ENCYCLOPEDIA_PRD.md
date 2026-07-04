# Atlas — The Living Voxel Atlas-Encyclopedia (Product Vision & PRD)

Status: **VISION / PRD — owner-approved direction** (2026-07-04). Expands the
existing product track. Extends — does not replace — `PRODUCT_NORTH_STAR.md`,
`PRODUCT_SPEC_AND_GATES.md`, `ATLAS_CHATGPT_USE_CASE.md`, and the quality path in
`ATLAS_CHATGPT_APP_QUALITY_ROADMAP.md`. Where this doc and the older business-scout
framing differ, this doc wins; the scout loop moves to a **paid** lens (§5, §8).

### Owner decisions locked (2026-07-04)
1. **Explore is the free front door.** Writing notes/pins is free (session-only).
   **Clawd scouting is the paid service** (the agent, not the encyclopedia).
2. Paid tier is named **"Your Atlas."**
3. Notes stay **session-only** (honest default; not brought forward to persistence).
4. Knowledge is **lighter cards across many, many places** (breadth over depth).
5. Encyclopedia content is **broad and not rigid or sales-focused** — real
   wonder (geography, history, landmarks, civic + cultural facts), NOT business
   pitches. Business signals live only inside the paid scout lens.

---

## 1. The vision in one sentence

**Atlas is the world's first living atlas-encyclopedia — a beautiful voxel world
you explore, an honest AI that tells you what's really there, and a personal
layer of notes and pins that makes the world yours — all inside ChatGPT.**

## 2. The insight — bring back the wonder, honestly

Two things used to make knowledge *magical*, and both are gone:

- **The Encarta / illustrated-atlas feeling.** You opened it to look up one
  thing and fell into an hour of wandering — spinning the globe, zooming a map,
  chasing cross-links, reading "did you know" sidebars. It made the whole world
  feel **catalogued, browsable, and yours to explore.**
- **The atlas as an object.** A place you *returned to*, annotated, dog-eared —
  a personal relationship with a catalogued world.

What replaced them is *useful but joyless*: Wikipedia is comprehensive but not
delightful to wander; Google Maps is powerful but it's directions, not
knowledge; and now AI chat answers everything but **hallucinates**, so you can't
trust the wonder.

**Atlas revives that magic in a form only possible now, and only inside ChatGPT:**

| Old magic | Atlas revival |
|---|---|
| The spinnable Encarta globe | A **living voxel world** you zoom into, beautiful and toy-like |
| Encyclopedia articles | **Closed-world, source-noted knowledge** about real places |
| Following cross-links, serendipity | **ChatGPT as your reading companion** — ask anything, wander by conversation |
| Marginalia, dog-ears, your copy | **Notes, pins, stickers, collections** — your personal atlas you return to |
| "Did you know?" sidebars | **Curated facts surfaced as you explore** |

The differentiator that ties it together: **it never lies.** In a world drowning
in AI slop, Atlas is the encyclopedia that says *"I don't have that"* rather than
inventing it (the honesty guard is already shipped — §7). **The atlas you can
trust** is the whole moat.

## 3. Why this can only be a ChatGPT app

- **The conversation is the cross-link engine.** Encyclopedias needed you to
  click blue links; Atlas lets you *wander by asking* — "what's near here?",
  "why is this the busy part?", "show me a quieter county" — and the world
  re-answers in place. That serendipity loop is native to chat and clumsy
  anywhere else.
- **ChatGPT is the reasoning; Atlas is the world.** The model can describe a
  place forever but can't *show* it or let you *annotate* it. Atlas gives the
  model a body: a voxel world to reason over and a personal layer to write on.
- **Zero-friction wonder.** No install, no account, mid-curiosity — ChatGPT
  already has the user at the moment they wonder about a place.
- **Session-only is the honest default; the personal atlas is the upgrade.**
  Nothing saved by default (privacy-safe, low-commitment) — and the exact moment
  you *want* to keep your annotated world is the paid arc (§8).

## 4. Who it's for (jobs-to-be-done)

Broader than the original entrepreneur wedge — wonder is universal:

1. **The curious wanderer** — "I want to explore/understand a place" (the Encarta
   kid, grown up). The front door. Retention via delight + collection.
2. **The local / newcomer** — "I just moved here / I'm visiting — show me my
   county and let me make it mine" (notes, favorites, a personal map).
3. **The planner / entrepreneur** (the original wedge) — "where's the
   opportunity here?" — served by the **Opportunity lens** (Clawd scout /
   campaign), now a *mode within* Atlas, not the whole app.
4. **The learner / educator** — an honest, explorable, annotatable geography +
   local-knowledge tool that doesn't hallucinate.

## 5. The reframed product — one world, multiple lenses

Don't discard the scout loop — **move it behind the paywall.** The same curated
closed-world lights up different lenses depending on what you ask:

- **Explore lens — FREE, the default front door:** wander the voxel world, read
  broad curated place knowledge, follow serendipity ("did you know", nearby,
  "take me somewhere interesting"). Pure wonder — no sales angle.
- **Collection lens — FREE (session-only):** your notes / pins / stickers /
  favorites overlaid on the world while you explore. Nothing saved by default.
- **Opportunity lens — PAID ("Your Atlas"):** "where's the business
  opportunity?" → the **Clawd scouting agent** goes to work (signals, campaign
  previews, quests). This is the paid service; it never intrudes on free
  exploration.

The free core loop is about wonder, not conversion:

```
Explore a place (voxel world)
   → Ask (honest closed-world answers)
   → Learn (broad curated knowledge + "did you know")
   → Jot a note / drop a pin (session-only, free)
   → Wander onward (cross-links by conversation)
   ↺ Keep exploring — the world is the reward
```

Clawd scouting is a deliberate, opt-in *upgrade* a curious user grows into — it
is never the thing shoved in front of a first-time explorer.

## 6. Content model — how it composes

The engine has the seams; this names them as an atlas-encyclopedia. Note the
**two distinct knowledge layers** (per owner decision #5):

- **Broad knowledge layer — FREE, the encyclopedia.** A **light knowledge card**
  per place: a sentence or two of real, broad, source-noted context —
  geography, history, landmarks, civic + cultural facts. **Not business scores,
  not pitches.** Optimized for **breadth across many, many places** rather than
  depth in a few. This is a *new* content surface distinct from the current
  business-signal fields.
- **Opportunity layer — PAID.** The existing business `scores` / `signals` /
  `campaignSuggestion` fields move under the **Clawd scout lens**. They are not
  shown in free exploration.
- **Place** = voxel scene cell + light knowledge card + **sources** + user-notes
  overlay.
- **Volume** (`data/county_packs/*.json` today) = one published area of the
  atlas. **Lighter, broader, many** — the goal is wide honest coverage, not a
  few deep sales packs.
- **Cross-links** = map edges (routes/relationships) → the **wander** mechanic.
- **"Did you know"** = a broad curated fact surfaced serendipitously.
- **Coverage tiers** (L0 unsupported → L1 shell → L2 curated → L3
  provider-normalized) = **how much of a place is "published."** Honest, never
  faked.
- **Personal layer** = notes / pins / stickers (session-only, free marginalia).

**Growing coverage = publishing the atlas, place by place.** The content
pipeline (manual + 5.5/codex-assisted authoring from real open data — Census
gazetteer, city open-data, OSM, Wikipedia-as-source-note) is the engine of the
product: provider-free, honest by construction, and aimed at **many many light
broad volumes** rather than few deep ones. The schema needs a new broad
`knowledgeCard` field (light, source-noted) alongside — and separable from — the
paid business-signal fields.

## 7. The trust doctrine (the moat) — already partly shipped

Atlas is **the atlas that doesn't lie.** This is non-negotiable and it's what
makes an AI-era encyclopedia credible:

- **Closed-world only.** Answers come from curated, source-noted data — never
  invented. `ask_county_question` now **refuses** out-of-world asks (hours,
  prices, phone, population, weather, exhaustive listings) instead of bluffing
  (shipped: BUILD_LOG Entry 192).
- **Honest coverage.** Users always know what's playable vs. shell vs.
  unsupported. No fake national playability.
- **Provider boundary.** The render path is provider-free; any Google Places use
  stays server-side/upstream in `@atlas/geo`, normalized behind honest contracts.
- **Session-only by default, explicit about it.** Nothing saved until the user
  opts into their personal atlas.

## 8. Tiers & monetization (reframed around the collection)

The split (per owner decisions #1–#3): **wonder is free; the working agent is
paid.**

- **Free — Explore, Learn & Note (everyone, forever):**
  - Open any published place, wander the voxel world.
  - Ask honest closed-world questions.
  - Read the broad light knowledge cards ("did you know", wander).
  - Write notes / drop pins / stickers — **session-only** (nothing saved; the
    honest default).
- **Paid — "Your Atlas" (the Clawd scouting agent):**
  - **Clawd goes to work** — scouts a place for opportunity signals, previews a
    campaign, runs quests. The agent doing real work is the paid value.
  - (Persistence — saved notes/collections/exports — is a *possible* later paid
    add, but per decision #3 notes stay session-only for now; the Clawd agent is
    the headline paid service.)

The paywall sits on **the agent that does work for you**, never on curiosity.
A first-time explorer should be able to wander, learn, and jot notes about their
whole county without ever hitting a wall or a sales pitch.

## 9. What makes it "the best ChatGPT app ever"

1. **Native to the medium** — conversation IS the browse/cross-link/serendipity
   engine; it genuinely can't be the same as a website.
2. **Emotionally resonant** — wonder, curiosity, and collection, not just
   utility. People *love* atlases and encyclopedias; nobody loves a dashboard.
3. **Honest by construction** — the anti-slop encyclopedia; trust is the moat.
4. **Visually stunning + game-like** — the voxel world (0.51E art) is a toy you
   want to touch.
5. **Infinite depth, and personal** — every place has knowledge; your notes make
   it yours.
6. **A collection you return to** — retention and a paid arc that feels earned.

## 10. Roadmap (phased, tied to existing gates + quality roadmap)

- **Phase 0 — Proof cell (done / shipping).** Eastvale playable, honest engine,
  0.51E art, `/preview` compression, `ask_county_question` honesty guard.
- **Phase 1 — The Living Volume.** Make Eastvale the first *full* atlas-encyclopedia
  volume: **Explore lens as the front door** (scout becomes a mode), **place
  knowledge cards**, **"did you know" serendipity**, **wander-by-conversation**,
  and **generalize `ask_county_question` beyond one county**. Fix the mobile
  first-paint framing (roadmap §3) so wandering feels good on a phone.
- **Phase 2 — Publish the Atlas.** Stand up the **curated-pack content pipeline**
  (manual + 5.5/codex-assisted, source-noted from open data) → multiple counties
  as browse/ask volumes; honest coverage tiers; a per-pack validation gate.
- **Phase 3 — Your Atlas.** **Persistence** (Hosted Clawd) = saved personal
  annotated atlas, collections, exports; the return loop; paid.
- **Phase 4 — The World.** Scale county → state → country → Earth from the one
  world model; playable promotions via the owner gates; provider-normalized (L3)
  only where honest.

## 11. Immediate next moves (Phase 1 concrete)

Ordered for the owner-approved direction (broad free encyclopedia; Clawd = paid):

1. **Add a broad `knowledgeCard` layer** to the pack schema — a light,
   source-noted, non-sales fact per place (geography/history/landmark/civic).
   Separable from the paid business-signal fields. The single most important
   move: it turns the map into an actual *encyclopedia*.
2. **Surface knowledge cards in the free Explore HUD** — extend the place/tray
   from "session pin + note" to "light knowledge card + source + your note."
3. **Generalize `ask_county_question`** beyond `riverside-ca` to any published
   place (keep refusing slugs with no data), and have it answer from the broad
   knowledge layer, not the business fields, in free mode.
4. **"Did you know" + wander** — one broad curated fact per place + a "take me
   somewhere interesting" cross-link affordance.
5. **Explore-first HUD** — exploration + notes are the landing; the Clawd scout
   is an opt-in paid lens, never in the first-run face.
6. **Content pipeline v1** — prove **many many light broad volumes** end-to-end:
   a source-noted authoring flow (manual + 5.5/codex) producing light knowledge
   cards across places. (5.5 research bot in progress — will be re-aimed at the
   broad knowledge layer, not business packs.)
7. **Mobile framing fix** (quality roadmap §3) so wandering reads well on 390×844.

## 12. Decisions — RESOLVED (owner, 2026-07-04)

1. ✅ **Explore is the free front door**; notes/pins are free (session). **Clawd
   scouting is the paid service.**
2. ✅ Paid tier is **"Your Atlas."**
3. ✅ Notes stay **session-only** (not brought forward to persistence now).
4. ✅ **Lighter cards across many, many places** (breadth over depth).
5. ✅ **Broad, not rigid or sales-focused** — real encyclopedia wonder; business
   signals live only in the paid scout lens.

Remaining smaller calls (non-blocking): exact free knowledge-card length/voice;
whether persistence ever becomes a second paid add later; how "wander" picks its
next place.
