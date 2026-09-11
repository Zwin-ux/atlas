# Three linked graphs, not a new infrastructure project

“Graph engineering” in this kit means making dependencies and evidence explicit enough that an agent can safely choose its next task. Use repository JSON, the existing context registry, and reviewed receipts. No Neo4j, vector store, agent database, or global memory service is needed.

## Product traceability graph

Job → requirement → acceptance case → implementation task → verification gate.

Definitions live in `graph/requirements.json`, `qa/cases.json`, and `graph/release-graph.json`. Each release-critical requirement has concrete tests and responsible nodes. The helper detects unknown references, duplicate IDs, malformed nodes, dependency cycles, and missing traceability. A title such as “polish” is not an acceptance criterion.

## Execution DAG

Each node has dependencies, priority, a role, suggested write paths, exclusive resource-lock names, mode, scope, acceptance, and evidence requirements. Edges mean “this predecessor's accepted contract/work is needed,” not “these agents should chat indefinitely.”

Ready = not accepted, all predecessors accepted, no explicit block, and no unmet execution boundary. Proposed batch = ready tasks selected within the configured child limit without resource conflicts, including currently active tasks. This is a conservative greedy scheduling heuristic, not a mathematically optimal scheduler. It does not enforce OS-level file locks or start workers.

The coordinator narrows actual file ownership before dispatch. Two tasks with different lock names can still conflict through a newly discovered shared file; update the assignment or serialize them. Worktrees reduce direct overwrite risk but do not eliminate integration conflicts.

Do contract definition before downstream implementation. Prefer completing an entire user journey to making every subsystem half-complete. Independent QA can design fixtures while the baseline is collected, but cannot certify behavior before the integrated code exists.

## Evidence graph

Acceptance claim → observed check/procedure → hashed artifact → integrated revision → independently reviewed task receipt.

A receipt also binds predecessor receipt hashes. Replacing a prerequisite's accepted result makes downstream evidence stale until revisited. Definition changes alter a task's fingerprint. An explicit invalidation list can reopen a node and dependent work after a discovered regression; see the planner guide.

Final candidate and publication gates need exact-revision proof; ordinary implementation receipts may apply to ancestor commits but can become semantically stale. The helper cannot infer all code-impact relationships. On every merge, the lead reviews changed contracts/files and uses `impact` to identify candidate downstream tasks, then invalidates the affected evidence. Final gates rerun regardless of earlier success.

Technical receipts are not a parallel narrative status system. `docs/STATUS.md` links accepted evidence and contains the compact human checkpoint. Do not revive retired packets or let an old receipt choose product scope.

## Context graph / existing registry

The repository already classifies canonical, active, generated, and historical documents. Before a task, query the existing registry for that task's code paths and acceptance terms. Give the child only:

1. Relevant current hard boundaries and one user-visible goal.
2. The exact node, accepted prerequisite contracts, and base revision.
3. The actual files it may change and focused source excerpts/links.
4. Related acceptance cases and failing evidence.
5. The review/output contract and stop condition.

Historical documents may explain why something was retired; they do not regain authority because retrieval returned them. A large context window is not a reason to paste all briefs, source files, and past sessions into every child.

## Continuation policy

After a verified slice, update the existing status checkpoint and receipt. Before compaction, add unfinished diff, active worktree/session ownership, negative findings, and exact next command. On resume, re-read authority and Git, reconcile live children, then select ready work; do not restart product discovery.

When a task is blocked, record its specific dependency and continue another ready node. When nothing is ready, stop with a concrete blocker. Never hide an external gate with an empty “success” receipt.

## Graph change rule

The lead may split a too-large in-scope node or add a required regression task with justification. Preserve IDs/provenance; validate acyclicity and traceability; re-check changed fingerprints. Product expansion is a separate owner decision, not an agent-generated dependency.
