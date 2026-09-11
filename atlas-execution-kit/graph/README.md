# Use the graph without creating a second project tracker

`release-graph.json` is a proposed task DAG. `requirements.json` and `../qa/cases.json` define traceability. `release-graph.mmd` is generated and can be rendered by a Mermaid-capable viewer; it is not a live progress image. The helper is a read-only convenience, not the Grok runtime or an automatic scheduler.

## Commands

```powershell
node tools/atlas-plan.mjs validate
node tools/atlas-plan.mjs next
node tools/atlas-plan.mjs task AT-001
node tools/atlas-plan.mjs receipt-template AT-001
node tools/atlas-plan.mjs impact AT-021
node tools/atlas-plan.mjs mermaid
```

These examples run from this kit's root. From the Atlas root, prefix `atlas-execution-kit/` to the tool path. The default graph resolves relative to the script, not the current directory.

For a continuing run:

```text
node tools/atlas-plan.mjs next --receipts <evidence-directory> --repo <actual-atlas-root> --active AT-010,AT-020 --blocked AT-005 --invalidate AT-021
```

Use only actual active/blocked/invalidated task IDs from the existing checkpoint, not the illustrative IDs above. Missing prerequisites, duplicate assignments or conflicting roles/locks force reconciliation. No receipt directory is required for the initial queue. `--scope all` includes publication/advisory lanes; human gates still never auto-dispatch.

## Evidence layout

Choose an existing policy-approved location or a local scratch directory outside tracked source during initial work:

```text
<evidence-directory>/
  AT-001.json
  AT-003.json
  logs/
    AT-001/...
    AT-003/...
  archive/                 # previous receipts, not loaded as current
```

Only immediate `.json` files in that directory are treated as current task receipts. Put unrelated JSON logs in subfolders. One current receipt per task; duplicates are rejected rather than guessing which is newest. Templates and sample files do not belong among accepted receipts.

Generate a template for the assigned node with `receipt-template`. It starts NOT_RUN. Fill it only after actual checks, independent review and integrated verification. Every acceptance criterion needs check coverage, and each check needs a real artifact. Use full Git commit IDs and forward-slash evidence paths within the evidence directory. File traversal and symlink escape are rejected.

The `file-hash <path>` command hashes artifact bytes. `receipt-hash <path>` hashes canonical JSON for dependency references, independent of JSON property order. Use the latter—not a raw file checksum—for `depends_on_receipts`. `task <id>` shows the current definition fingerprint. This fingerprint includes that node's related requirement and test definitions.

Run `check-receipts --receipts <directory> --repo <root>` before accepting the next batch. It reports malformed/stale evidence and returns nonzero for receipt problems. A successful integrity check does **not** mean every task or the app is complete; read the milestone and accepted-node fields.

## Applicability and invalidation

Without `--repo`, receipts cannot unlock tasks because Git ancestry is not verified. Implementation receipts can apply to ancestor commits, but the lead must review semantic impact after every change. Final gates require the exact current HEAD and clean **tracked** state. The helper does not audit untracked build inputs; the clean-checkout acceptance gate covers those.

`impact AT-021` returns that task and dependent nodes to review. `--invalidate` treats that set as unaccepted for the current invocation. `--blocked` additionally prevents those root nodes being re-dispatched until the lead clears the real blocker. Persist the reasons/IDs in the existing checkpoint and reapply them on resume; these flags do not secretly edit any state file.

To accept a new result after a regression, archive the superseded current receipt, run the affected checks, obtain review, then issue a fresh receipt. Downstream dependency hashes must match the newly accepted evidence; do not mechanically update hashes without reviewing/rerunning relevant behavior.

## What the tool does not do

It does not verify that a reported observer truly saw the app, authenticate reviewer identities, execute recorded shell commands, prove semantic correctness, enforce OS locks, infer every code dependency, grant permission, or run background workers. The lead/native Grok workflow handles task execution within normal security controls. Logs, direct observation, real tests, and independent review remain necessary.

The graph/receipts are technical artifacts; they do not replace `docs/STATUS.md`, current `AGENTS.md`, or the repository's planning and authority registry. Do not add a new status database around this helper.
