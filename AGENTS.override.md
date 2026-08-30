# Atlas WebMCP Challenge Execution Law

This file intentionally overrides the repository's existing root `AGENTS.md` while the `webmcp-challenge` branch is active. The old file contains valid Atlas history but currently points Codex toward retired plugin, road-infrastructure, Scout, Hosted Clawd, and other non-challenge work.

Remove or rename this override after the WebMCP submission is frozen.

## Authority

For WebMCP Challenge work, use this order:

1. `AGENTS.override.md`
2. `WEBMCP_STATE.md`
3. `ATLAS_WEBMCP_CODEX_MASTER_PROMPT.md`
4. `ATLAS_WEBMCP_WIN_PLAN.md`
5. `CHALLENGE_DELTA.md`
6. Current official challenge rules and current OpenAI/Chrome/WebMCP documentation for API details
7. Existing Atlas source and docs as implementation context only

Current official documentation overrides stale API syntax. Product scope and safety gates remain binding unless a technical impossibility is demonstrated.

## Mission

Ship a focused, no-login Atlas WebMCP challenge candidate by September 3, 2026 at 1:00 PM Pacific.

Product sentence:

> Atlas is a shared geographic canvas where a person explores U.S. counties visually while an agent reads and changes the same live map through browser-native WebMCP tools.

Primary audience:

> Students, local journalists, civic researchers, and community organizers investigating an unfamiliar U.S. county.

## Branch and ownership

- Work on `webmcp-challenge`, based on the latest local `main`.
- The existing source checkout at `C:\\Users\\mzwin\\Documents\\Atlas` is heavily dirty. Leave it untouched.
- Use the clean sibling worktree at `C:\\Users\\mzwin\\Documents\\Atlas-WebMCP` and perform challenge work there. The provided installer creates it.
- If already running in that worktree on `webmcp-challenge`, proceed. Otherwise inspect/create it safely. Never overwrite an existing worktree.
- Confirm the five challenge authority files are present in the challenge worktree before implementation.
- Use one main writer checkout.
- Use separate worktrees for parallel writers.
- Subagents may do read-only exploration, specification checks, release audits, or reviews.
- Never allow two agents to edit overlapping files.
- Preserve unrelated user changes.
- Do not reset, clean, force-push, rewrite history, delete branches, merge to `main`, change visibility, choose a license, deploy publicly, or submit Devpost without explicit owner approval.
- One coherent green commit per slice. Do not commit knowingly failing work.

## Challenge product law

Keep:

- Existing nationwide Census-backed place and county resolution.
- The strongest stable map renderer.
- Normal human map navigation and editing.
- Session-only notes and research trails.
- One restrained site-tool activity rail.
- A graceful normal-browser fallback.

Hide from the judge route, README, video, and Devpost story:

- Scout Drop and campaign planning.
- Hosted Clawd.
- Auth0/login/accounts.
- Persistence, public posting, Atlas Commons, subscriptions, checkout, billing, pricing, or waitlists.
- Internal quality dashboards and old release ceremony.
- Old Apps SDK/plugin submission language.
- Unverified claims about generated streets or buildings.
- Unrelated national-road, map-engine, or visual-rewrite work.

Do not delete reusable systems solely to hide them. Fence them away from the challenge entry.

## Required WebMCP tools

Expose exactly these five tools first:

1. `get_map_state`
2. `search_places`
3. `open_place`
4. `add_map_note`
5. `create_map_trail`

Do not add another tool until all five pass automated tests, browser tests, and real built-in-browser testing, and a sixth tool has a specific judging benefit.

Tool rules:

- Register imperatively from the top-level page. Do not register challenge tools inside an iframe.
- Feature-detect `document.modelContext?.registerTool`.
- Reuse the application's existing controller and permissions.
- Keep input schemas narrow and descriptions explicit about side effects.
- Preserve the normal interface when WebMCP is unavailable.
- `get_map_state` and `search_places` are read-only.
- `open_place`, `add_map_note`, and `create_map_trail` mutate visible session state.
- User/agent-authored note or trail text is untrusted content.
- Never return raw geometry, giant scene objects, secrets, credentials, or third-party payloads.
- Write tools must visibly complete before returning success.
- Ambiguous places return candidates. Unknown places fail honestly.
- `create_map_trail` must resolve every stop before one atomic mutation.
- Manual controls and tool callbacks must use the same live state/controller.
- Avoid stale React closures; execute against current state.

## Required architecture

Create one shared controller, conceptually:

```ts
export interface AtlasMapController {
  getSnapshot(): AtlasMapSnapshot;
  searchPlaces(query: string): Promise<PlaceSearchResult>;
  openPlace(input: OpenPlaceInput): Promise<OpenPlaceResult>;
  addMapNote(input: AddMapNoteInput): Promise<MapNote>;
  createMapTrail(input: CreateMapTrailInput): Promise<MapTrail>;
}
```

The exact location may change after source inspection, but the semantic rule may not: human controls and WebMCP tools share one state transition path.

## Durable state ledger

`WEBMCP_STATE.md` is required. Create it if missing.

It must include:

- branch and baseline SHA;
- current slice and status;
- player-visible promise;
- acceptance checks;
- files changed;
- exact commands and results;
- browser proof;
- unresolved risks;
- exact next action;
- last green commit SHA.

At the start of every run and after compaction, read this file before editing. Never ask which task is next when it contains an unblocked next action.

## Execution loop

For each slice:

### 1. Orient

- Run `git status --short --branch`.
- Run `git log -5 --oneline`.
- Read this file, `WEBMCP_STATE.md`, and the challenge plans.
- Identify the current slice and anti-scope.

### 2. Define

Before substantial edits, state:

- the player-visible result;
- the smallest complete implementation boundary;
- likely files;
- exact acceptance checks.

Mark the slice `IN_PROGRESS`.

### 3. Implement

- Deliver one complete vertical slice.
- Prefer narrow typed changes.
- Reuse existing behavior.
- Do not build speculative abstraction beyond the five-tool goal.
- Do not mix unrelated cleanup into the slice.

### 4. Verify

Run the smallest relevant check first, then applicable gates:

- focused unit or contract tests;
- `pnpm typecheck` when TypeScript contracts/runtime changed;
- `pnpm build` when build/runtime assets changed;
- `pnpm verify:webmcp` once created;
- browser proof for UI changes;
- desktop and `390x844` mobile checks for judge-path UI changes;
- fallback test with WebMCP absent.

Record commands and pass/fail results. Do not claim a skipped check passed.

### 5. Review

Run `/review` or a read-only reviewer against the complete slice. Priorities:

- current WebMCP compatibility;
- top-level registration;
- stale state;
- separate human/agent state paths;
- partial mutation;
- side-effect accuracy;
- injection and output size;
- normal-browser fallback;
- mobile/accessibility;
- challenge scope leakage.

Fix valid high and medium findings and rerun affected gates.

### 6. Commit and record

- Commit coherent green work.
- Suggested format:
  - `webmcp(route): expose the no-login map workspace`
  - `webmcp(controller): unify human and agent map actions`
  - `webmcp(tools): register live map tools`
  - `test(webmcp): verify state, mutation, and fallback`
- Update `WEBMCP_STATE.md`.
- Update `CHALLENGE_DELTA.md` when challenge-period capability changes.
- Record the exact green SHA.

### 7. Continue

Immediately begin the next unblocked slice after a green commit. A recap is not a stopping condition.

Stop only for:

- an explicit human gate;
- a true safety boundary;
- no remaining unblocked work;
- verified completion of the entire local definition of done.

## Failure policy

- Reproduce first.
- Do not retry the same approach more than twice.
- After two failed attempts, state the failed assumption and choose a materially different approach.
- Separate pre-existing failures from new regressions with evidence.
- Never weaken, delete, or bypass a gate just to turn it green.
- If one slice is externally blocked, mark it `BLOCKED` and continue another independent slice.
- Do not invent test results, screenshots, browser behavior, deployments, or commit state.

## Implementation order

1. No-login challenge route and baseline.
2. Shared live map controller.
3. `get_map_state`, `search_places`, `open_place`.
4. Agent activity rail.
5. `add_map_note`.
6. Atomic `create_map_trail` and editable trail rail.
7. Automated WebMCP verifier and negative cases.
8. Judge-path UX, accessibility, desktop/mobile proof.
9. Challenge-first README, delta, submission copy, and video script.
10. Clean-clone/public-release audit and owner-gated deployment packet.

## Practical baseline

Do not run every historical Atlas verifier by default. Choose checks based on changed files.

Minimum before declaring the local candidate ready:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm verify:webmcp
```

Also run focused tests and browser checks added for the challenge. Historical infrastructure, billing, Commons, Scout, and road gates are out of scope unless the challenge changes touch them.

## Human gates

Ask before:

- making the repository public;
- selecting or changing a license;
- publishing or changing a live deployment;
- pushing/configuring secrets;
- enabling auth, persistence, public posting, or money;
- destructive Git operations;
- changing the five-tool cut;
- submitting Devpost.

A gate request must include the candidate SHA, exact proposed action, evidence, risk, and rollback. Ask one narrow decision.

## Proof standard

“Done” requires evidence.

For every completed slice return and record:

- user-visible behavior;
- files changed;
- commands run;
- test results;
- review findings and dispositions;
- browser proof when applicable;
- commit SHA;
- next slice.

For final readiness also prove:

- no-login top-level page;
- exactly five registered tools;
- shared human/agent state path;
- visible completion before write-tool success;
- ambiguity-safe resolution;
- atomic trails;
- normal-browser fallback;
- mobile and accessibility checks;
- accurate challenge-period documentation;
- public-release safety inventory;
- exact remaining owner actions.

## Communication

Use brief progress updates, then keep working.

Do not stop after:

- reading files;
- writing a plan;
- creating scaffolding;
- passing only one targeted test;
- giving a status recap.

Do not ask broad questions. Make conservative implementation decisions inside the approved product cut. Ask only at a human gate or when every unblocked path is exhausted.
