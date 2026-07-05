# Atlas — CTO Roadmap & Org

Owner: Opus 4.8 (floor manager / acting CTO). Last cut: 2026-07-05.
Purpose: one page that says where Atlas actually is, the critical path to a
shipped ChatGPT app, what is blocked on a human decision vs. executable now, and
how the Fable/Codex factory maps to the work.

---

## 1. The one-sentence status

**The engine works and the API is connected — G1–G5 pass green right now on
`fable/0.52e-diorama-engine`. Atlas is far closer to shipping than it looks; the
value is stranded on an unmerged branch behind an old live build, not missing.**

The last stretch produced massive engine strides (0.51E art → 0.52E ground +
lighting) and a working 7-tool MCP app surface — but every pass stacks another
`fable/0.5xe` branch, nothing has been merged to a release line, and the live
Railway URL still serves a pre-0.51E build. The bottleneck is **integration +
deploy**, not more engineering.

## 2. Gate board (measured today, on this branch)

Gates from `docs/PRODUCT_SPEC_AND_GATES.md` (G1–G7 = submittable ChatGPT app).

| Gate | Proves | Status | Evidence |
|------|--------|--------|----------|
| **G1** Build & typecheck | Workspace compiles + bundles | ✅ GREEN | `pnpm typecheck:starter` + `build:web` clean |
| **G2** MCP contract | Exactly 7 tools, valid schema | ✅ GREEN | `verify-submission.mjs` ok:true; live `tools/list` = 7 tools |
| **G3** Widget quality | Map + panels render desktop + 390×844, no overflow/console errors | ✅ GREEN | `verify-alpha-product-loop.mjs` ok:true (desktop+mobile) |
| **G4** Reliability | All 7 tools drive end-to-end | ✅ GREEN | `verify-mcp-flow.mjs` ok:true |
| **G5** Honesty & safety | Session-only, no persistence/paid, provider boundary, shells honest | ✅ GREEN | `verify-submission.mjs`; split guard 0/0; shells verified honest |
| **G6** Submission manifest | Manifest + **app icon** + **privacy/legal URLs** | 🟡 PARTIAL | manifest + 7 test cases done; **icon, privacy URL, terms URL MISSING from `app_info`** |
| **G7** Deployed & verified | Live on Railway serving THIS build; public verifiers green vs prod | ❌ RED | prod `/preview` 200 but serves **old build**; this branch never deployed |

**Read:** 5 of 7 gates are green today. Only G6 (two missing directory assets)
and G7 (deploy) block submission — and both are gated on human decisions, not
engineering.

## 3. Critical path to "submitted ChatGPT app"

```
[NOW: G1–G5 green on fable/0.52e-diorama-engine]
   │
   ├─(HUMAN GATE A: review + merge)──► establish a release line (main / release)
   │        merge 0.52e engine strides in; tag it
   │
   ├─(HUMAN GATE B: G6 assets)───────► app icon + privacy policy URL + terms URL
   │        (icon exists as placeholder; legal URLs need a hosted page + a call)
   │
   ├─(HUMAN GATE C: deploy)──────────► deploy release build to Railway  ⇒ G7
   │        then run public verifiers vs prod URL
   │
   ▼
[SUBMITTABLE: G1–G7 green together on one committed, deployed build]
   │
   └─► ChatGPT App Store submission packet (0.50P)
```

Everything on the critical path is a **human gate**. There is no missing
engineering between here and submission — the app is functionally done.

## 4. Decisions I need from you (blocked-on-human)

1. **Merge gate.** Approve merging `fable/0.52e-diorama-engine` → a release line.
   Today there is no `main`/release branch; every pass just stacks. Say "cut a
   release line and merge" and I'll do it (conflict-checked, reversible).
2. **G6 directory assets.**
   - **App icon:** a placeholder exists (`assets/generated/placeholders/png/atlas-icon.png`).
     Ship placeholder for now, or commission a real one? (I can wire the
     placeholder into the manifest immediately.)
   - **Privacy policy + Terms URLs:** ChatGPT directory requires real hosted
     URLs. These need a hosted page and a legal call — the one thing that can't
     be faked. Decide where they live (a static page on the Railway app is
     simplest).
3. **Deploy gate (G7).** Approve deploying the release build to Railway. This is
   the single highest-leverage action — it turns 5 green gates into a live,
   current app. Irreversible-ish; no rollback ceremony documented, so I'll
   confirm once more before pushing.
4. **Engine polish depth.** How much further to push the engine before/after
   ship? The 0.53E "Hero Silhouette" Fable prompt is written and loaded
   (`docs/design/fable-prompts/BUILDING_FIDELITY_SUPERPASS.md`). It is NOT on the
   critical path — ship can happen first and 0.53E lands as an update. Your call:
   ship-then-polish, or one more polish pass first.

## 5. What I can execute now (no human gate)

- **Run the full G1–G6 sweep** and produce a single committed green/red board
  artifact (the app's health snapshot).
- **Wire the placeholder icon** into `app_info` so G6 is one-asset closer.
- **Prep the merge** — dry-run conflict check against a fresh release branch so
  Gate A is one click.
- **Draft the privacy/terms static pages** (content + a route on the server) so
  Gate B just needs your sign-off, not authoring.
- **Continue 0.53E engine polish** on its own branch in parallel (does not block
  ship).

## 6. Org / factory model (who does what)

```
Opus 4.8 (acting CTO / floor manager)
  ── holds this roadmap, integrates, runs the gate proofs, owns taste + the
     ship/deploy sequencing. Fires nothing behind a human gate without approval.
  │
  ├──► Fable (the rare super-move) ── ONE elite hard-SWE pass at a time, spent on
  │      engine quality where it compounds. Done: 0.48P design, 0.52E ground +
  │      lighting. Loaded next: 0.53E Hero Silhouette. Never spent on ops/deploy
  │      or decision-blocked work (feedback_fable_allocation).
  │
  └──► Codex (GPT-5.5) ── the line: mechanical/bulk work — verifiers, the
         privacy/terms static pages, submission-manifest plumbing, build loops.
         Sandboxed; Claude runs the browser/deploy proofs (feedback_codex_delegation).
```

**Two tracks, kept distinct so neither blocks the other:**
- **Ship track (critical path):** merge → G6 assets → deploy → submit. Human-gated.
  Owned by CTO + Codex for the mechanical pieces.
- **Engine-polish track (parallel, compounding):** 0.53E Hero Silhouette and
  beyond, on `fable/0.5xe` branches. Owned by Fable super-moves. Ships as updates
  after the first submission — it must never hold the store submission hostage.

## 7. Permanent invariants (unchanged — the prod SLA)

Map-first; session-only honesty; provider boundary (no provider→geometry); 7-tool
MCP surface stable; no crutch props; 390×844 mobile proof required; Anaheim/
Ontario hidden (`BLOCK_PROMOTION`); Hosted Clawd / Stripe / DB / OAuth / XP parked
until explicitly reopened after the engine is submitted and credible;
**no deploy without a human gate.**

## 8. Recommended next move (my CTO call)

**Ship the engine you already built before polishing it further.** Five gates are
green; the strides are real; the only thing keeping Atlas from being a live,
current ChatGPT app is a merge + two assets + a deploy — all yours to authorize.
Sequence I'd run the moment you say go:

1. Cut a release line, merge 0.52e (Gate A).
2. Wire the icon + stand up privacy/terms pages (Gate B — I draft, you sign off).
3. Deploy to Railway, run public verifiers vs prod (Gate C ⇒ G7).
4. Assemble the 0.50P submission packet; submit.
5. In parallel from step 1: run the 0.53E Hero Silhouette Fable pass as the first
   post-launch update.

Say the word on the merge + deploy gates and I'll execute the parts that aren't
behind your signature.
