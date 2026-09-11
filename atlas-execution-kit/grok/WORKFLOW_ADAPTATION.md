# Adapt Grok, do not build another orchestration product

## Verified platform basis

Official Grok documentation describes child agents, isolated worktrees, directory-scoped instructions, and resumable sessions. Official workflow guidance describes saved workflows and native execution. Check the installed CLI and its local schema/help before authoring configuration; a supported feature does not imply identical syntax in every version. Sources X1–X7 are listed in `../references/SOURCES.md`.

Safe starting commands, after confirming the executable is installed:

```powershell
grok version
grok --help
grok inspect
grok
```

Read configuration discovery locally; do not paste secret-bearing configuration into a public report. To continue the latest session for the same directory, current documentation provides `grok -c`; use a specific session ID where directory/session ambiguity exists. A resumed conversation still needs live Git/evidence checks.

No `GROK.md` is supplied or assumed. Do not replace `AGENTS.md`. The `agents/*.md` files in this pack are task-role prompts, not automatically discovered Grok configuration files.

## Existing repo workflows to inspect

The connector inspection found an existing control loop, map-quality workflow, ship gate, and wiki setup under `.grok/workflows/`. The source snapshot is in the references manifest; re-read the actual files.

The inspected control loop has a hard-coded local root, points its scout at retired docs, restates tool names, uses broad child capability, and writes a separate result artifact under an old artifact hierarchy. Its local verifier result is not full public-release proof. The inspected ship gate also uses a fixed root and a local-control verdict. These are specific adaptation targets, not evidence that every workflow is broken at runtime.

## Minimal migration

1. Route every phase through current `AGENTS.md`, status, plan, and registry classification; remove retired product directives.
2. Resolve/validate the actual checkout path from the caller/environment instead of copying a personal absolute path. Constrain node IDs/artifact paths; do not concatenate arbitrary goal text into filesystem paths.
3. Read current tool contracts and check definitions rather than hand-copying tool names or stale commands.
4. Consume one ready task packet from the graph. Use small output schemas with concrete changed-file and check evidence; booleans alone cannot certify work.
5. Keep the useful scout/build/independent-review sequence, but verify accepted prerequisites and allocate isolated write ownership first. Do not give every checker product-write permission by default.
6. Gate on both check outcomes and unresolved acceptance blockers. A local control pass must not produce an unqualified “ship ready” verdict.
7. Persist technical evidence at classified paths and put the human checkpoint only in `docs/STATUS.md`.
8. Reuse the existing wiki/registry. Do not rerun scaffold/ingestion as a prerequisite to each task.

A minimal correction to the existing control loop is preferred to a new workflow suite. If the installed runtime requires a replacement, keep it one bounded workflow and retire the old trigger explicitly. Use `BUILD_NATIVE_WORKFLOW.prompt.md` as authoring input, not an untested Rhai payload.

## Smoke before use

Run the candidate workflow against a harmless task in a disposable fixture/worktree: read one known file, return a small structured result, review it, and stop. Test failed child output and unmet dependencies. Confirm no protected files changed, no publishing action occurred, and resource/child limits held. Mark native runtime compatibility unverified until that smoke succeeds.

Then use the workflow for one real bounded task before allowing subsequent waves. A native workflow may resume or wait according to Grok's capabilities, but this package installs no recurring scheduler, auto-approval, or runaway relaunch.
