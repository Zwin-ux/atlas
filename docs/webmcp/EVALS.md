# Atlas WebMCP Evaluation Guide

Atlas pins the official experimental `webmcp-evals` package at `0.0.4`. The integration follows the package's three modes: static schema evaluation, live-browser model evaluation, and deterministic browser smoke.

## Drift control

`pnpm eval:webmcp:prepare` generates `.evals/atlas-tools.json` from `createAtlasWebMcpTools()`. Names, descriptions, and input schemas therefore come from the descriptors registered by the product; there is no second hand-maintained schema cut. `pnpm verify:webmcp` fails if the package pin, exact-five coverage, generator path, or critical evaluation cases drift.

## Deterministic release gate

Build first, then run:

```powershell
pnpm eval:webmcp:smoke
```

The command starts the built Atlas server on a temporary local port unless `ATLAS_WEBMCP_URL` is set. It runs the official no-model smoke suite in Chrome with WebMCP enabled, then runs deeper assertions against the same public tools:

- exactly five tools on `/` and `/explore`;
- no duplicate registration after refresh or navigation;
- successful execution of every tool through Chrome's WebMCP protocol;
- visible three-marker national trail before `create_map_trail` completes;
- keyboard marker navigation reflected by `get_map_state`;
- an ambiguous Springfield open does not mutate the map;
- an unresolved trail stop preserves the prior map and trail atomically;
- no console or page errors.

The current recorded run used Chrome `152.0.7977.64`: 9/9 official smoke steps and 13 tool executions with every Atlas browser assertion passing. Its bounded tool transcript is `artifacts/webmcp-proof/webmcp-browser-smoke.json`.

## Model-selection gates

Choose the model explicitly so reports are reproducible. Example:

```powershell
$env:ATLAS_WEBMCP_EVAL_MODEL = "openai:gpt-5-mini"
$env:OPENAI_API_KEY = "..."
pnpm eval:webmcp:static
pnpm eval:webmcp:browser
```

Supported package prefixes are `openai:`, `anthropic:`, `google:`, and `ollama:`. Atlas also provides a narrow `xai:` adapter over xAI's OpenAI-compatible endpoint. Set `ATLAS_WEBMCP_EVAL_BACKEND` only when a non-default official backend is required. For a non-default local Ollama server, `OLLAMA_HOST` may be either its origin or its `/v1` base; the runner normalizes the origin form. `ATLAS_WEBMCP_URL` can point the browser run at an already running judge route; otherwise the command starts the local built server.

The focused adversarial run is:

```powershell
$env:XAI_API_KEY = "..."
$env:ATLAS_WEBMCP_URL = "https://DEPLOYED_HOST/explore"
pnpm eval:webmcp:grok
```

It selects the exact `grok-4.6` model ID, passes the key only to the child evaluation process, and applies the same three-run, 90%, zero-critical-failure threshold. It challenges tool choice and arguments; it does not stand in for real ChatGPT Site Tools discovery.

Both commands default to three runs per case and enforce:

- at least 90% correct scored tool/argument trajectory steps;
- zero failures in cases tagged `[critical]`;
- no wrong write tool, partial-mutation trajectory, or false-success trajectory accepted as green.

Reports are written under `.evals/`. API keys are read from the environment and are never written to schemas, reports, or source. A missing credential is an honest blocked gate, not a skipped pass.

## Suite coverage

The model suite covers direct selection of all five tools, state-search-open chaining, ambiguity-first Springfield search, note-versus-trail discrimination, a three-stop ordered civic trail, a no-tool request, a read-only request that must not mutate, and a failed trail followed by an unchanged state read. The prompts use natural ChatGPT phrasing rather than internal tool names, and include both a Springfield follow-up turn and a state read after the person changes the map manually.

Write-tool mock results mirror the browser contract: successful writes include `visible: true` plus the map effect, while recoverable failures include `mapChanged: false`; a failed trail also identifies the one-based `stopNumber` and confirms `trailChanged: false`. This gives the model enough bounded context to explain what happened without inventing a visible change or making a redundant verification call.

The deterministic browser harness also reads `document.modelContext.getTools()` and checks the five human-facing titles that ChatGPT presents in its Site Tools menu. This catches a class of integration drift that the lower-level Puppeteer tool projection does not expose.

The deterministic suite uses only concrete calls. Failure-state assertions live in the Atlas browser harness because the official `smoke` command executes calls but does not compare returned application state.
