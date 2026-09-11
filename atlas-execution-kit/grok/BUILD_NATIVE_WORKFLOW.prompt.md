# Author a minimal version-compatible Grok workflow

Read current repo instructions and the execution kit. Inspect `.grok/workflows/` and installed Grok documentation/schema. Prefer adapting the existing control loop over adding another workflow. Do not run stale workflows first.

Build one bounded coordinator workflow that receives a validated graph node/task packet and known repo root, checks accepted dependencies, assigns an isolated implementer, requests an independent review, and returns verified evidence to the lead for integration. The lead alone accepts/records the integrated result and updates current status.

Use supported installed syntax only. Do not assume helper names, capability modes, hooks, or output schemas from another version. Do not hand-wave syntax validity. Native subagent/workflow functionality is optional: a sequential lead using the same task packet must remain a functioning fallback.

Limits: at most the graph-configured active children, no recursive fan-out, finite task/rework budgets, no automatic deployment/publishing, no blanket approval, no secret reads unrelated to the task. A verification role may run tests but must not alter the implementation it certifies. Scope authority and resource ownership are explicit inputs.

On failed/missing child output or unmet gate, return a structured blocked/failed result—not success. Use actual test exit codes and artifact paths; separate local candidate, host-proven candidate, deployed target, submitted packet, and external approval. Do not equate lack of reported issues with proof.

Prepare and execute a harmless local smoke that checks success, failed child, invalid packet, and interrupted resume behavior without touching protected product files or external systems. Only after it passes use the workflow for one real task, inspect the diff, then continue. Keep the status/registry authorities intact.
