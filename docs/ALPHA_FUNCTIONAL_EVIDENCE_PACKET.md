# Atlas Functional Alpha Evidence Packet

Owner: Axiom - Atlas GM / Principal Systems Architect
2IC: Mira - Main Product Software Engineer / Human Experience 2IC
Status: functional evidence green, release candidate still blocked by mixed-tree
split.

Last updated: 2026-07-01.

## Current Verdict

Mira product verdict: Atlas Functional Alpha is human-showable with caveats.
The current screenshots prove a real map-first loop: selected place, visible
tray, sticker/pin increment, session note save, and short session-only boundary
copy.

P0 release verdict: ready for human review, blocked for staging/deploy only by
the mixed-tree split. It is not safe to stage or deploy from the current working
tree.

What is green:

- Public MCP flow passes against Railway.
- Public ChatGPT submission contract verifier passes.
- Public `/preview` HTTP verifier passes.
- Local starter typecheck and build pass.
- Core tests pass.
- Mira's product-surface hardening gives stable browser hooks and visible
  session-only note/pin language.
- Desktop and mobile screenshots prove the map-first loop after real
  interaction.

What is blocked:

- The working tree is still mixed. Visual renderer/lab work, Hosted Clawd
  persistence work, package/lock changes, and shared docs are present together.
- `node scripts/verify-alpha-rc-split.mjs --working-tree --json-only` correctly
  blocks the tree with zero unknown files.
- No staging, deploy, or submission push should happen until the candidate is
  split or rebuilt cleanly.

## Human-Visible Product Evidence

Desktop screenshot:

`C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-product-loop-hardening/alpha-product-loop-desktop-1280x720.png`

Mobile screenshot:

`C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-product-loop-hardening/alpha-product-loop-mobile-390x844.png`

Observed in the screenshots:

- Map-first Eastvale/Riverside world loads.
- Selected place tray is visible for Eastvale Core.
- Pin count is visible.
- Note count is visible.
- Latest saved note is visible.
- Session-only boundary copy is visible: "Pins and notes stay in this chat."
- Mobile `390x844` retains the tray, controls, map canvas, and saved note.

Mira taste notes:

- Desktop is showable: the map remains the main surface, and the tray reads as
  a compact tool layer rather than a dashboard.
- Mobile is showable: the selected place, counts, session boundary, saved note,
  input, and pin controls all fit in the first viewport.
- Caveat: visual polish is functional Alpha level, not final art approval.
  Buildings and tile grammar can improve later, but they do not block this
  functional product packet.
- No additional UI fix is recommended before the release split. More changes
  now would create extra split risk without materially improving the approval
  story.

Lumen visual showability note:

- First 3-second read: this is a map-first Eastvale toy-world with a working
  place tray, session pins, and saved note state. It does not read as a generic
  dashboard or SaaS shell.
- Functional Alpha verdict: showable with caveats. The visual quality supports
  product-function approval, not final art approval.
- Release-blocking visual issues: none in these screenshots. The canvas is
  nonblank, the world remains dominant, the tray is legible on desktop and
  mobile, and session-only note/pin copy is visible.
- Backlog visual issues: building modules still look broad and procedural,
  tile grammar is not yet production-art quality, and the world lacks the
  tactile authored material depth shown in the north-star references.
- Highest-leverage next visual slice after functional readiness: rowhome-only
  production renderer intake spike using
  `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md`, with baseline/after
  desktop and mobile screenshots and primitive fallback proof.
- No-go line: do not start E7.39, broad renderer port, new assets/modules, or
  another art tunnel during Functional Alpha approval.

## Commands Verified

| Command | Result |
| --- | --- |
| `pnpm typecheck:starter` | Passed |
| `pnpm build:starter` | Passed |
| `pnpm test:core` | Passed, 8 files / 26 tests |
| `pnpm verify:preview:http` | Passed locally, city-world markup present |
| `node scripts/verify-alpha-public-sanity.mjs` | Passed public MCP/submission/preview sanity |
| `node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8799/preview --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-rc-path-b-product-loop` | Passed clean RC desktop and mobile product-loop browser proof |
| `node scripts/verify-alpha-rc-split.mjs --json-only` | Passed staged mode with no staged files |
| `node scripts/verify-alpha-rc-split.mjs --working-tree --json-only` | Blocked mixed tree as expected, zero unknown files |

Public sanity details:

- Public base: `https://atlas-backend-production-e6fc.up.railway.app/`
- MCP tools: 7
- Public preview bytes: 825814
- `lookup_world_places` returned 20 places during verification.

Product-loop verifier details:

- Script: `scripts/verify-alpha-product-loop.mjs`
- Default target: `ATLAS_PREVIEW_URL` or `http://127.0.0.1:8787/preview`
- Usage:

```bash
node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8799/preview --screenshots C:\Users\mzwin\AppData\Local\Temp\atlas-alpha-rc-path-b-product-loop
```

- Verifies desktop `1280x720` and mobile `390x844`.
- Checks map shell, selected place tray, zoom clicks, canvas drag, sticker drop,
  pin count increment, note input/save, note count increment, latest note visible
  in viewport, session-only boundary copy, one canvas, no horizontal overflow,
  and clean browser console.
- Screenshot outputs:
  - `C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-rc-path-b-product-loop/alpha-product-loop-desktop-1280x720.png`
  - `C:/Users/mzwin/AppData/Local/Temp/atlas-alpha-rc-path-b-product-loop/alpha-product-loop-mobile-390x844.png`

## Alpha Boundary

Approved Alpha claim:

Atlas opens a map-first Riverside/Eastvale proof slice inside ChatGPT. Users can
inspect the local world, use the tool surface, drop session-only pins, and save
session-only notes during the current chat.

Do not claim:

- durable saved notes or accounts;
- public Hosted Clawd access;
- Stripe, checkout, billing, XP, evidence, reports, exports, OAuth, or
  automation;
- final voxel art quality.

## Release Split Decision

There are two valid next paths.

### Path A - Public-Green Docs-Only Alpha Packet

Use the already-deployed public app as the functional surface. Stage only the
reviewed release-support docs/scripts after hunk review. No deploy is needed if
the public app remains green.

This path is fastest and lowest risk, but it does not ship Mira's new
product-surface QA hooks or visible session-only tray copy.

### Path B - Clean Product-Code RC

Cut a clean candidate that includes only Mira's Alpha Product Loop Hardening
plus the necessary current renderer baseline, excluding visual lab/module atlas,
Hosted Clawd, package/lock, DB env, migrations, and parked backend work.

This path is better for the product because the session-only boundary becomes
visible in the deployed UI, but it needs careful hunk/file splitting before any
deploy.

Axiom recommendation:

Use Path B if we are aiming for a stronger human Alpha approval packet. Use Path
A only if the immediate goal is submission paperwork without changing public
runtime.

Mira recommendation:

Path B is worth the split/deploy work if Forge can isolate it cleanly. The
visible session-only tray copy and stable QA hooks are a real product gain, not
cosmetic churn. If Forge cannot isolate the web files without dragging renderer,
visual-lab, package/lock, or Hosted Clawd changes, fall back to Path A and keep
this product hardening as the first post-Alpha patch.

Forge mechanical read:

Path B is mechanically viable if cut from a clean branch/worktree and limited to
the current `web/src/CityWorldView.tsx` and `web/src/styles.css` hunks. Those
hunks add browser proof hooks, selected-place tray state, visible session-only
copy, latest-note display, pin/note counts, save-note copy, mobile tray
containment, and supporting tray/control styles. They do not require Hosted
Clawd, package/lock/env, migrations, module-atlas files, or core
renderer/schema changes.

Path B is not safe as whole mixed-tree staging. Use:

```bash
node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --strict-selected-rc --json-only
```

Default F2 mode remains conservative and continues to park
`web/src/CityWorldView.tsx` and `web/src/styles.css`.

## Current Blockers

- Exact clean product-code RC source is not isolated yet.
- `web/src/CityWorldView.tsx` and `web/src/styles.css` contain useful product
  hardening but are path-classified as renderer parked by the split guard, so
  they need explicit Axiom/Mira/Forge reclassification or a clean branch.
- Shared docs contain mixed history and need hunk review.
- Hosted Clawd/package/lock/env work remains parked.
- Visual lab/atlas work remains parked.

## Next Owner Actions

Mira:

- Verdict complete: current screenshots are human-showable for Functional Alpha
  with caveats.
- No further UI fix recommended before the split.
- Repeatable browser verifier complete:
  `scripts/verify-alpha-product-loop.mjs`.
- Next Mira-owned product quest: run this verifier against the clean Path B RC
  candidate after Forge isolates it.

Forge:

- Produce the exact clean Product-Code RC plan for Path B, or confirm Path A is
  the only mechanically safe option without a new branch/worktree.
- Keep `scripts/verify-alpha-rc-split.mjs` as the mechanical guard.

Lumen:

- Stay out of Functional Alpha RC unless asked for screenshot critique.
- If visual code reopens later, use
  `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md` and only test rowhome
  first.
