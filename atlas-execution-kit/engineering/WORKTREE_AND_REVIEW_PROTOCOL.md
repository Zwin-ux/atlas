# Small-team execution protocol

## Roles and capacity

One lead is the only integrator. Normally use two implementation children and one independent verifier at most. The graph's limits are authoritative for the plan; available CPU/memory/context may justify less concurrency. No recursive spawning or independent “fix everything” agents.

Data/MCP work and widget work may proceed in parallel only after shared schemas are settled. Two workers touching `AtlasApp.tsx`, its state/adapter contract, a common CSS file, server registration, or the lockfile should be serialized unless the lead has explicitly separated non-overlapping ownership and can verify it.

The reviewer must not certify its own implementation. If the same human/operator must perform both roles, clearly label the missing independent review rather than invent a second identity. Use a fresh reviewer session for final acceptance where available.

## Worktree setup

Inspect current work before creation. Start children from an explicitly recorded base; verify what uncommitted changes, environment files, or ignored generated assets are present. Grok worktree behavior is version-dependent—check the actual installed behavior and diff. Do not copy secrets into child contexts or logs.

Each assignment names: task, base, worktree, branch/session, exact write paths, test target/port, held locks, receipt destination, reviewer. Keep shared mutable runtime services separate. Never have two agents start incompatible servers on the same port and then test whichever one answered.

The lead owns package files, lockfile, CI, contract authority, canonical docs, and status unless it explicitly transfers a narrow change. Dependency updates are not concurrent background chores.

## Lifecycle

Pending → ready → assigned → building → review → integrated verification → accepted.

“Blocked” may occur at any non-accepted stage. “Stale” is derived when definitions/dependencies/revision or artifacts do not support acceptance. Acceptance requires underlying evidence, not a task counter increment. The read-only planner derives accepted/ready state; Grok's native todos and the current status checkpoint can hold active assignments.

Do not maintain three hand-edited copies of task status. If native workflow progress is used, treat it as execution bookkeeping and reconcile it with receipts, not as release truth.

## Handoff

A builder returns its exact changed files and base, a small summary, tests and exit codes with artifacts, acceptance criteria covered, remaining limitations, and risks to downstream contracts. It does not merge its own work or claim release approval.

The reviewer reads the actual diff, runs focused checks in a suitable isolated environment, attempts negative cases, and reports severity/reproduction. Style preferences alone are not release blockers. “Looks fine” is not evidence.

The integrator reviews attribution/scope, lands only intended changes, runs affected integrated checks, and produces the accepted receipt. Cherry-picking/merging is local and reviewable; publication/deployment needs separate permission. Do not force-push, rewrite shared history, or discard another person's changes to resolve conflicts.

## Rework budget

Default: no more than two failed rework attempts on the same hypothesis before narrowing the reproduction or escalating a real blocker. A fresh hypothesis may justify another bounded attempt; do not relabel identical retries as progress. Record known failed approaches in the existing checkpoint.

Scope of fix: the smallest maintainable change that closes the actual acceptance failure. Do not remove tests, expand public tools, add fake success, or wrap every error in an apparently valid result.

## Interrupted work

On cancellation, record which processes/worktrees are still active. Kill only processes the task owns and only after inspecting state. Do not remove worktrees automatically. On resume, reconcile existing children before dispatch; stale lock records must be checked against real ownership. The kit contains no OS-level lock manager, watchdog, or recurring relaunch loop.

## Permission boundary

Local editing/testing is distinct from new spend, production deployment, secret changes, portal actions, public releases, and outgoing communications. Runtime availability does not grant permission. A lead can prepare a deploy artifact while waiting for authorization, but cannot report production live until verified.
