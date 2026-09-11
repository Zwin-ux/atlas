# Atlas WebMCP — Codex Activation and Execution Loop

Use this with the two files you already downloaded:

- `ATLAS_WEBMCP_WIN_PLAN.md`
- `ATLAS_WEBMCP_CODEX_MASTER_PROMPT.md`

Also place the companion `AGENTS.override.md` from this package in the repository root.

---

## 1. Recommended setup

1. Copy all three files into the Atlas repository root—the folder containing `package.json`.
2. Open that folder as a project in the Codex desktop app or launch Codex CLI from the repository root.
3. Start a **fresh challenge chat**, not an old Atlas thread carrying the retired Scout/Hosted Clawd direction.
4. Select **GPT-5.6 Sol, Extra High** when available.
5. Use a single main writer chat on one challenge branch/worktree.
6. Because the current Atlas checkout is heavily dirty, do **not** switch branches or implement inside it. Create a clean sibling worktree at `C:\\Users\\mzwin\\Documents\\Atlas-WebMCP` from the latest local `main` SHA on branch `webmcp-challenge`. Preserve `C:\\Users\\mzwin\\Documents\\Atlas` untouched.
7. Run independent audits or reviews in subagents/worktrees, but never let two agents edit the same files.
8. Type `/goal`, then paste the activation prompt below.

The root `AGENTS.override.md` is intentional. It temporarily supersedes the old Atlas `AGENTS.md`, whose current quest and product assumptions conflict with this hackathon.

---

## 2. Copy-paste activation prompt

```text
Own the Atlas WebMCP Challenge build from repository audit through a locally release-ready, judge-ready candidate.

Repository:
Zwin-ux/atlas-alpha-engine-beta-checkpoint

Hard deadline:
September 3, 2026 at 1:00 PM Pacific.

Read these authority files before making substantive edits:
- @AGENTS.override.md
- @ATLAS_WEBMCP_WIN_PLAN.md
- @ATLAS_WEBMCP_CODEX_MASTER_PROMPT.md
- @package.json
- @README.md
- @server/src/atlasTools.ts
- @web/src/atlas/AtlasApp.tsx
- @web/src/atlas/AtlasPlate.tsx
- @web/src/atlas/useToolPlate.ts
- the current official OpenAI Site Tools/WebMCP documentation and current WebMCP specification

Authority rule:
Current official challenge rules and current OpenAI/Chrome/WebMCP documentation override implementation details in the planning files if the standard has changed. The product thesis, scope limits, judging strategy, and safety gates in the planning files remain binding unless technically impossible.

OUTCOME

Build a public-facing, no-login Atlas challenge experience where a human and an agent share the same live U.S. map workspace. The human can navigate and edit normally. Through browser-native WebMCP, the agent can:

1. read the current map state;
2. search Atlas’s existing Census place index;
3. open and visibly focus a U.S. place;
4. add a session-only research note;
5. create an editable two-to-five-stop research trail.

The WebMCP extension must reuse Atlas’s real application logic and visible state. It must not be a disconnected demo, backend-only MCP integration, fake success layer, or second state store.

NON-NEGOTIABLE PRODUCT CUT

Keep:
- nationwide Census-grounded map opening and ambiguity handling;
- the strongest stable Atlas renderer;
- normal human pan, zoom, navigation, selection, notes, and editing;
- a restrained site-tool activity rail;
- session-only research trails and notes;
- a normal-browser fallback.

Hide from the judge path and challenge story:
- Scout Drop and campaign planning;
- Hosted Clawd;
- Auth0, login, accounts, persistence, subscriptions, checkout, billing, pricing, or waitlists;
- Atlas Commons/public posting;
- internal engine dashboards;
- old plugin-submission language;
- claims that generated streets or buildings are verified geography.

EXACT WEBMCP TOOL SURFACE

Implement and expose exactly these five challenge tools before considering anything else:
- get_map_state
- search_places
- open_place
- add_map_note
- create_map_trail

Do not add a sixth tool unless all five are green in automated tests, browser tests, and a real ChatGPT site-tools run, and the additional tool clearly improves a judging criterion.

EXECUTION MODEL

You are the single implementation owner and main writer.

Use subagents only for bounded independent work such as:
- read-only architecture mapping;
- current WebMCP API/spec verification;
- release/security/license inventory;
- post-slice review.

Do not allow parallel agents to write the same checkout or overlapping files. Use separate worktrees for any parallel writer.

Create or switch to a branch named webmcp-challenge based on the latest local main. Preserve unrelated user changes. Do not reset, clean, rewrite history, force-push, merge to main, publish the repository, select a license, or deploy publicly without explicit owner approval.

DURABLE STATE

Create `WEBMCP_STATE.md` immediately and treat it as the restart ledger. It must always contain:
- branch and baseline SHA;
- current slice;
- current status: READY, IN_PROGRESS, BLOCKED, or GREEN;
- player-visible promise;
- exact acceptance checks;
- files changed;
- commands run with pass/fail results;
- browser proof produced;
- unresolved risks;
- exact next action;
- last green commit SHA.

At the start of every run or after context compaction, re-read:
1. AGENTS.override.md
2. WEBMCP_STATE.md
3. CHALLENGE_DELTA.md if present
4. the two challenge planning files

Never ask me “what should I do next?” when `WEBMCP_STATE.md` identifies an unblocked next action.

LOOP

For every slice:

1. ORIENT
   - Run `git status --short --branch`.
   - Run `git log -5 --oneline`.
   - Read the authority files and current state.
   - Confirm the current slice and its anti-scope.

2. DEFINE
   - State the player-visible result in one sentence.
   - State the smallest testable implementation boundary.
   - List likely files and exact acceptance checks.
   - Mark the slice IN_PROGRESS in `WEBMCP_STATE.md`.

3. IMPLEMENT
   - Build one complete vertical slice, not a pile of scaffolding.
   - Reuse existing app/controller logic.
   - Keep changes narrow and typed.
   - Do not duplicate map state inside WebMCP callbacks.
   - Make page changes visible before a write tool returns success.
   - Handle ambiguity and errors honestly.

4. VERIFY
   - Run the smallest relevant tests first.
   - Run typecheck/build when contracts or runtime code changed.
   - Run `pnpm verify:webmcp` once available.
   - For UI changes, test desktop and 390x844 mobile behavior and capture proof.
   - Test with WebMCP unavailable so the normal human interface still works.
   - Record exact commands and results in `WEBMCP_STATE.md`.

5. REVIEW
   - Inspect the complete diff against the slice contract.
   - Run `/review` or delegate one read-only reviewer focused on:
     WebMCP correctness, stale-state bugs, hidden partial mutations,
     accessibility, security, mobile behavior, and scope drift.
   - Fix all high/medium findings or record a precise justified exception.
   - Rerun affected verification.

6. COMMIT
   - Commit only coherent green work.
   - Use `webmcp(<slice>): <user-visible result>` or
     `test(webmcp): <verified behavior>`.
   - Update `CHALLENGE_DELTA.md` and `WEBMCP_STATE.md`.
   - Record the commit SHA and mark the slice GREEN.

7. CONTINUE
   - Immediately select and begin the next unblocked slice.
   - Do not stop merely to provide a recap.
   - Give short progress updates while continuing.
   - Stop only at a defined human gate, a true safety boundary, or when the full definition of done is verified.

FAILURE BEHAVIOR

- Reproduce failures before changing code.
- Do not repeat the same failed approach more than twice.
- After two failed attempts, identify the root assumption, choose a materially different approach, and record the decision.
- Distinguish new regressions from pre-existing failures with evidence.
- Never hide, delete, or weaken a failing test merely to make the gate green.
- If one slice is externally blocked, mark it BLOCKED and continue another independent slice.
- Ask me only when every useful unblocked action is exhausted or a human gate is reached.

FIRST RUN

Perform these actions now:

1. Confirm the source repository root, current branch, dirty files, Node/pnpm versions, and latest local `main` SHA.
2. Confirm whether the session is already rooted at `C:\\Users\\mzwin\\Documents\\Atlas-WebMCP` on `webmcp-challenge`. If yes, use it. If not, leave the dirty source checkout untouched and create or safely reuse that clean sibling worktree based on the recorded `main` SHA.
3. Confirm the five authority files and `WEBMCP_STATE.md` exist in the clean worktree. Copy/create them only if missing.
4. Re-anchor all subsequent commands and edits in the clean worktree.
5. Read and reconcile the authority files.
6. Verify the current official WebMCP API supported by ChatGPT’s built-in browser. In particular:
   - tools must register from the top-level page, not an iframe;
   - use the imperative JavaScript API;
   - feature-detect `document.modelContext`;
   - preserve the normal interface without WebMCP;
   - keep schemas narrow and side effects explicit.
7. Delegate up to three read-only subagents:
   A. architecture/state-flow mapper;
   B. WebMCP implementation/spec reviewer;
   C. public-release and repository-safety auditor.
8. Run a practical baseline, not every historical Atlas verifier.
9. Create `CHALLENGE_DELTA.md` and initialize the copied `WEBMCP_STATE.md`.
10. Produce a concise implementation map of no more than 15 lines.
11. Begin Slice 1 immediately. Do not stop after planning.

IMPLEMENTATION ORDER

Slice 1 — clean no-login challenge route and baseline proof.
Slice 2 — shared AtlasMapController using live application state.
Slice 3 — get_map_state, search_places, and open_place.
Slice 4 — visible AgentActivityRail.
Slice 5 — add_map_note with validation and visible completion.
Slice 6 — atomic create_map_trail plus editable MapTrailRail.
Slice 7 — WebMCP verifier, negative cases, cancellation/lifecycle, fallback.
Slice 8 — judge-path UX polish, desktop/mobile proof, accessibility.
Slice 9 — challenge-first README, CHALLENGE_DELTA, SUBMISSION, video script.
Slice 10 — clean-clone/release audit and owner-gated deployment packet.

DEFINITION OF DONE

Do not claim the candidate is ready until all applicable conditions are proven:

- A no-login top-level judge route loads immediately.
- The visible page—not an iframe—registers exactly five browser-native WebMCP tools.
- Both manual controls and WebMCP tools use the same live controller/state.
- Human changes are visible to get_map_state.
- Agent write calls update the map before returning success.
- Ambiguous place names return candidates instead of guessing.
- create_map_trail validates all stops before mutating anything.
- Normal browsers retain full manual functionality.
- Targeted tests, typecheck, build, and verify:webmcp pass.
- Desktop and 390x844 mobile proof exists.
- No Auth0, Scout, campaign, billing, Commons, or stale plugin copy appears in the judge path.
- Challenge-period work is honestly separated from pre-existing Atlas work.
- The public-release inventory identifies secrets, asset rights, large files, and license blockers.
- README, test prompts, Devpost copy, test instructions, and sub-three-minute video script match what actually runs.
- `WEBMCP_STATE.md` contains the final green SHA, exact remaining human gates, and no hidden technical blocker.

When the local candidate reaches this bar, stop before any owner-gated external action and return:
- final branch and SHA;
- exact commands and results;
- screenshots/proof locations;
- remaining human actions in order;
- the one recommended deployment path;
- any uncertainty that could affect eligibility.

Start now.
```

---

## 3. The continuation prompt

Use this only when Codex completes a turn but has not reached a human gate:

```text
Continue the active goal from @WEBMCP_STATE.md.

Complete the exact next unblocked slice. Use the full loop:
orient → define → implement → verify → review → fix → commit → update state.

After the slice is green, immediately start the next unblocked slice. Do not stop for a recap, do not reopen settled product decisions, and do not ask me what to do next. Pause only at a documented human gate or a genuine blocker with no useful independent work remaining.
```

---

## 4. The anti-drift prompt

Use this when Codex starts working on old Atlas features, broad redesigns, or unrelated infrastructure:

```text
Stop scope expansion and re-anchor.

Re-read @AGENTS.override.md, @WEBMCP_STATE.md,
@ATLAS_WEBMCP_WIN_PLAN.md, and
@ATLAS_WEBMCP_CODEX_MASTER_PROMPT.md.

The challenge product is the shared live map workspace with exactly five WebMCP tools. Scout, campaigns, Hosted Clawd, Auth0, billing, Commons, public-note infrastructure, new map engines, and unrelated national-road work are outside this goal.

Revert only the uncommitted out-of-scope edits you introduced, preserve unrelated user changes, update WEBMCP_STATE.md with the drift correction, and resume the current challenge slice.
```

---

## 5. The stuck/recovery prompt

Use this when Codex is looping on the same error:

```text
You are repeating an approach without producing new evidence.

Pause implementation and perform a root-cause pass:
1. reproduce the failure with the smallest command or test;
2. state the failed assumption;
3. distinguish code failure, environment failure, test failure, and stale evidence;
4. propose two materially different fixes;
5. choose the lower-risk fix that preserves the slice contract;
6. implement it;
7. rerun the reproduction and required gates;
8. record the evidence and decision in WEBMCP_STATE.md.

Do not weaken tests, fake a success state, or silently reduce the acceptance criteria.
```

---

## 6. The reviewer prompt

Run `/review`, then add:

```text
Review the webmcp-challenge diff against main.

Prioritize only actionable findings that could cost judging points or break the live demo:
- WebMCP tools registered anywhere other than the top-level page;
- incorrect or stale API usage;
- callbacks reading stale React state;
- manual UI and agent tools using different state paths;
- write tools returning before visible completion;
- partial mutation on create_map_trail failure;
- ambiguous-place guessing;
- oversized or injection-prone tool results;
- missing normal-browser fallback;
- keyboard, screen-reader, reduced-motion, or 390x844 mobile failures;
- Auth0, Scout, campaign, billing, Commons, or old plugin copy leaking into the judge path;
- claims not supported by tests or challenge-period commits.

Do not make edits during this review. Rank findings high, medium, or low and cite exact files/lines. If no high or medium findings remain, say so explicitly.
```

Then send this to the main writer:

```text
Apply every valid high and medium review finding. Preserve the product cut and avoid unrelated cleanup. Rerun the affected tests plus verify:webmcp, update WEBMCP_STATE.md, and commit the corrected slice before continuing.
```

---

## 7. The session-resume prompt

Use this in a new Codex chat after a crash, compaction, or handoff:

```text
Resume ownership of the Atlas WebMCP Challenge build.

Read @AGENTS.override.md and @WEBMCP_STATE.md first, then the two challenge planning files. Verify the branch and current SHA against the state ledger. Do not reconstruct progress from memory and do not redo green slices.

Run the smallest check needed to confirm the recorded state, continue the exact next action, and use the normal execution loop until the next human gate.
```

---

## 8. Human gates

Codex must stop and ask for a direct decision before:

- making any repository public;
- choosing or changing the open-source license;
- publishing a live deployment or changing production;
- pushing secrets or configuring credentials;
- enabling Auth0, persistence, public posting, billing, or payments;
- deleting branches, force-pushing, rewriting history, or discarding user changes;
- submitting Devpost;
- changing the five-tool product cut after implementation is underway.

A proper human-gate question is narrow:

```text
HUMAN GATE — Public deployment

Local candidate SHA: <sha>
All local gates: green
Proposed host/URL: <value>
Exact action requiring approval: <action>
Rollback: <method>

Approve or reject this action?
```

It should not ask a broad “what do you want to do?” question.

---

## 9. How you should operate as the owner

Your job is not to micromanage code. Your job is to protect four decisions:

1. Keep the challenge product narrow.
2. Never accept “done” without visible and automated proof.
3. Do not let Codex publish, license, or deploy without an explicit gate.
4. Keep using the same main goal thread; use separate worktrees only for independent reviews or audits.

The most useful owner message is usually the continuation prompt, not a new feature idea.
