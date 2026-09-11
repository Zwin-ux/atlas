# Atlas / Grok execution kit

**Purpose:** finish the current read-only Census-backed Atlas ChatGPT app through small, verified product slices. This is a planning and execution-support package, not a new Atlas codebase or a claim that the product has passed its tests.

## Start

1. Extract the ZIP so this folder sits at `<your-current-Atlas-checkout>/atlas-execution-kit/`. Nothing in the ZIP replaces a root file, `.grok/` configuration, `AGENTS.md`, or an existing product module.
2. Open Grok Build in the **current `Zwin-ux/atlas` checkout**, not the voxel checkpoint or the frozen WebMCP candidate. Use your normal permission mode.
3. Paste the contents of `01_PASTE_IN_GROK.md`. Grok should reconcile the package with live repository instructions, establish a baseline, and begin the first safe, bounded implementation slice.
4. For another session, use your installed Grok's resume feature, then paste `02_CONTINUE.md`. It must re-check Git and evidence before resuming work.

The first slice is not a new dashboard: correct place → useful inline map → exploration → clear selection → named follow-up → honest ambiguity/recovery.

## What is here

- `product/`: consolidated product specification, state/interaction behavior, copy, and a formative usability plan.
- `graph/release-graph.json`: dependency graph with acceptance criteria, ownership, resource locks, and explicit external gates.
- `graph/requirements.json` and `qa/cases.json`: product-to-task-to-test traceability. Tests are **specifications to implement/run**, not pre-passed results.
- `agents/`: bounded lead, data/MCP, widget/product, independent reviewer, and release roles. These are prompts, not automatically installed native agent definitions.
- `engineering/`: architecture decisions, context selection, parallel-work rules, and release/security discipline.
- `grok/`: an adoption guide for the existing workflows and a prompt for authoring a version-compatible native workflow.
- `tools/atlas-plan.mjs`: a dependency-free, read-only graph/evidence planner. It does not spawn agents, execute supplied commands, edit Atlas, install packages, or deploy.
- `templates/`: task assignment, review, checkpoint, and evidence formats.
- `references/`: both earlier briefs **unchanged**, current source observations, and research links.
- `validation/`: checks run on **this kit**, not on the Atlas application.

## Quick kit checks

From this kit directory, using the existing Node installation:

```powershell
node tools/atlas-plan.mjs validate
node --test tests/planner.test.mjs
node tools/atlas-plan.mjs next
node tools/atlas-plan.mjs task AT-001
```

The planner was tested with the Node version recorded in `validation/KIT_VALIDATION.json`. No `npm install` is needed for the kit. The actual Atlas app still uses its own pinned package manager and lockfile.

## Scope and authority

Current repository instructions, executable public contracts, and new explicit owner decisions outrank this package. The v2 material is a proposed implementation brief that consolidates this conversation; it is not permission to resurrect retired features or ignore repository policy. Reconcile compact inline/fullscreen behavior and host-compatible typography into `DESIGN.md` through the existing decision process.

`docs/STATUS.md` remains the one mutable human-readable project status. The graph holds task definitions, not a second status narrative. Run receipts are technical evidence; they belong in an approved execution-evidence location, not in old status packets. Start with local scratch evidence outside tracked docs until the repository's document policy classifies the intended paths. Do not import all this Markdown into every agent context.

The repository already contains a context registry and Grok workflows. Reuse them. Repair stale authority references before invoking existing workflows. Do not build a new memory product, graph database, orchestration service, or wiki compiler.

## Continuation and permissions

The kit gives Grok a persistent task plan and a resume protocol. It cannot keep a closed session running, override rate limits, approve credentials, or guarantee uninterrupted completion. Continue independent local work when an external gate is blocked; report that gate truthfully.

One coordinator owns assignments and integration. Default to two implementation agents plus one independent reviewer, at most three children active at once. Smaller is appropriate when files overlap or resources are tight. Never enable blanket approval, secret access, paid provisioning, or production deployment merely to keep the loop moving.

Read `validation/KIT_VALIDATION.json` for what was and was not exercised here.
