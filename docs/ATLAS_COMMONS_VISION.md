# Atlas Commons — community-built, evolving counties (P6 vision)

## THE ARCHITECTURE: Personal Atlas vs Global Atlas (owner, 2026-07-12)

Atlas is a stack of provenance LAYERS; every product question reduces to
"which layers are visible":
1. CENSUS — immutable truth (0.78 geometry/names/water). Nobody edits it.
2. GENERATED — the deterministic engine fabric. Identical for everyone.
3. GLOBAL ATLAS — the shared commons. Moderated once, quality-gated,
   attributed. Everyone's world.
4. PERSONAL ATLAS — yours. Private by default, unmoderated, kit-bounded
   creative freedom. Grows across every county you touch. THE retention
   loop and the reason P2 accounts exist.

**Git-for-worlds:** Global is `main`; every Personal Atlas is a branch.
Build freely in yours; PROMOTE the best (propose -> moderate at the
boundary -> merge into global, attributed). Moderation only happens at
promotion — personal freedom is total, the firehose problem disappears,
and global only accretes vetted quality. Data model: one contributions
table, `scope: personal|global`, promotion is a state change.

Immediate consequences:
- Shareable read-only personal county views ("come see my Riverside"),
  framed as "<name>'s Atlas" — social without moderation debt.
- Promotion passes the 0.79 visual-score floors: a build that would drop a
  county below floor CANNOT merge. The commons has a math-enforced
  constitution.
- Middle tier later: team/family/org atlases (shared-with-few) — same
  layers, new scope value. Classrooms, businesses, local groups.
- UI: one quiet toggle — "My Atlas / Everyone's Atlas" — plus per-layer
  provenance glyphs; census/generated honesty strip unchanged.

Owner intent (2026-07-12): "a feature where people can community-wise add
things to the atlas — this type of evolving software is what I really wanna
build." This doc is the standing design; P2 (auth + persistence) is the
technical prerequisite.

## The provenance triad (the honesty rule that makes UGC safe)

Every visible thing in Atlas belongs to exactly one class, always visually
and semantically distinct, never confusable:
1. CENSUS-REAL — geometry, names, water, roads (0.78). Authoritative.
2. GENERATED-PREVIEW — building fabric, labeled preview (existing strip).
3. COMMUNITY-ADDED — attributed human contributions, own glyph language,
   provenance shown on tap. Never rendered as official geography.

## Contribution ladder (each shippable)

1. **P2 core**: durable PERSONAL pins/notes (already launch-required).
2. **Commons v1 — shared knowledge**: opt-in PUBLIC pins/notes per county,
   attached to real places/towns. County payload gains a capped
   community layer (server-composed, Redis-cached, size-budgeted like
   every other wire object). Tap shows author + date.
3. **Commons v2 — voxel placements**: place structures from the EXISTING
   voxel kit on the county board. Kit-only (no free geometry), tile-grid,
   per-county contribution budget ENFORCED BY the 0.79 visual-score gates
   (a community addition that drops the county below its visual floor is
   rejected at submit time — quality is structural, not moderated after
   the fact). LOD tier assigned so county boards stay in budget.
4. **Commons v3 — stewardship**: county caretakers, weekly "this week in
   your county" changelog (ties to the sampler cadence), contribution
   history per county.

## Moderation & safety (design constraints, not afterthoughts)

- Visible-to-author immediately; public after moderation (queue server-side;
  model-assisted screening + human review to start; report/flag from day 1).
- Per-account rate limits (reuse the W6.4 shared ledger), PII/profanity
  screening, no external links in v1.
- UGC terms + privacy updates BEFORE Commons v1 ships (legal human gate).
- OpenAI app review: UGC changes the review posture — submission copy and
  data-controls disclosure updated accordingly.

## Decision points for the owner (when P6 starts)

- Openness: public-to-all vs invite/county-caretaker beta first.
- Timing: Commons v1 pre- or post-directory-submission (recommendation:
  post — launch clean, then evolve loudly).
- Identity display: pseudonymous handles vs ChatGPT-derived names.

## Why Atlas can do this cheaply

The contribution UI already exists (pins/notes/sticker kit = the grammar);
P2 brings auth + storage; the wire/caching pattern exists (spec + packs);
and the 0.79 gate system means community content can NEVER degrade visual
quality or perf — the budget is enforced by the same floors that guard the
generated engine. Evolving software with a constitution.
