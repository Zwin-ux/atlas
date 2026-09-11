# Sources and evidence boundary

Prepared for the current Atlas execution kit. Repository sources were read through the connected GitHub tool; no Atlas application test or native Grok run was performed in this packaging environment. Re-read the live checkout before implementation. Repository timestamps and old “green” statements are not current runtime evidence.

## Supplied conversation artifacts

- `ORIGINAL_Product_Brief_v1.md`: copied unchanged from the prior deliverable.
- `ORIGINAL_Revival_Agent_Prompt.md`: copied unchanged from the prior deliverable.

They preserve context. The consolidated pack narrows execution and reconciles proposed decisions; it does not silently overwrite current repo law.

## Repository sources

- R1: [Current handoff](https://github.com/Zwin-ux/atlas/blob/main/CHATGPT.md).
- R2: [Agent authority and boundaries](https://github.com/Zwin-ux/atlas/blob/main/AGENTS.md).
- R3: [Design system](https://github.com/Zwin-ux/atlas/blob/main/DESIGN.md).
- R4: [Existing project plan](https://github.com/Zwin-ux/atlas/blob/main/docs/brain/PROJECT_PLAN.md).
- R5: [Current status](https://github.com/Zwin-ux/atlas/blob/main/docs/STATUS.md).
- R6: [Widget shell](https://github.com/Zwin-ux/atlas/blob/main/web/src/atlas/AtlasApp.tsx).
- R7: [Tool implementation](https://github.com/Zwin-ux/atlas/blob/main/server/src/atlasTools.ts).
- R8: [Existing Grok control loop](https://github.com/Zwin-ux/atlas/blob/main/.grok/workflows/atlas-control-loop.rhai).
- R9: [Existing Grok ship gate](https://github.com/Zwin-ux/atlas/blob/main/.grok/workflows/atlas-ship-gate.rhai).

Current-turn source observations and blob IDs are recorded in `REPOSITORY_OBSERVATIONS.json`. Other listed source observations are from the supplied prior briefs and should be rechecked; this package does not claim to have re-audited all source files.

## Official Grok sources

- X1: [CLI reference](https://docs.x.ai/build/cli/reference): installed-command discovery, inspect, resume and related options. Use local help for current exact syntax.
- X2: [Subagents](https://docs.x.ai/build/features/subagents): independent children and differing read/edit capabilities.
- X3: [Worktrees](https://docs.x.ai/build/features/worktrees): isolated checkout behavior and explicit base selection. Verify actual dirty-change inclusion before dispatch.
- X4: [Sessions](https://docs.x.ai/build/features/sessions): local session persistence and resume/compaction. A resumed session still needs source/evidence validation.
- X5: [Project rules](https://docs.x.ai/build/features/project-rules): directory-scoped AGENTS-family rules and configuration inspection.
- X6: [Native workflows](https://x.ai/news/workflows): reusable native workflow mechanism. The kit deliberately supplies authoring/adaptation instructions rather than asserting an untested runtime script is compatible.
- X7: [Agent dashboard](https://x.ai/news/agent-dashboard): supervision of multiple sessions. Optional, not a required dependency.
- X8: [Build changelog](https://x.ai/build/changelog): changing runtime behavior; check before relying on a feature. No fixed upgrade requirement is imposed here.

## Official OpenAI sources

- O1: [UI guidance](https://developers.openai.com/plugins/concepts/ui-guidelines): compact inline versus deeper fullscreen presentation, system-compatible interface styling and accessibility.
- O2: [MCP UI and state](https://developers.openai.com/plugins/build/chatgpt-ui): temporary widget state, supported model-context updates and the separation from durable business state.
- O3: [Connect and test](https://developers.openai.com/plugins/deploy/connect-chatgpt): actual connection/client testing rather than preview-only assumptions.
- O4: [Metadata guidance](https://developers.openai.com/plugins/guides/optimize-metadata): tool discovery/routing behavior. Linked from the supplied brief; recheck before editing metadata.

Earlier Apps SDK links redirected to the current plugin documentation paths during the source review. Follow official redirects and compare against the versions installed in Atlas. A branding/path change is not permission for a speculative architecture migration.

## Claims and limits

The pack's scheduling choices, task scopes, proposed product behavior and review budgets are engineering recommendations—not vendor guarantees or observed product results. Integrity checking cannot prove a receipt's observations true. Test cases start SPEC_NOT_RUN. Native Grok configuration, live ChatGPT behavior, production deployment and portal actions remain to be exercised in their actual environments.
