# ChatGPT end-to-end environment

Atlas's primary ChatGPT surface is page-native WebMCP on the live `/explore` route. This is intentional: the person and ChatGPT act on the same browser-owned controller, map, notes, and trail. No separate chat panel or server-side shadow session is involved.

OpenAI distinguishes this from a plugin MCP server. Site Tools belong to the open page; remote MCP tools can run without a page. Atlas should not expose a second `/mcp` mutation path until it can prove that the connector and the visible page are bound to the same user session and controller. A detached note or trail that the person cannot see would weaken the product and the challenge claim.

## One-command live proof

Set the exact HTTPS judge route, then run:

```powershell
$env:ATLAS_CHATGPT_URL = "https://DEPLOYED_HOST/explore"
pnpm e2e:chatgpt
```

The command performs two automated layers against that exact URL:

1. Deployment preflight checks `/ready`, the no-login `/explore` route, WebMCP response headers, the deployed bundle's exact five names and human titles, Springfield ambiguity, and Riverside resolution.
2. Chrome WebMCP smoke opens fresh pages, discovers exactly five top-level tools, executes all five through the real protocol, verifies visible note/trail completion, tests a manual marker-to-state handoff, and proves ambiguous/failed writes do not mutate state.

The consolidated report is written to `.evals/chatgpt-e2e/report.json`. The deployment-only record is `.evals/chatgpt-e2e/preflight.json`. Neither file is committed by default. `ok` means the automated page and Chrome protocol layers passed. `releaseReady` remains false until a captured real-ChatGPT transcript and a passing model-threshold run are both present.

Loopback HTTP is accepted for local work. Any non-loopback target must use HTTPS.

## Prepare an isolated acceptance session

Create one ignored, timestamped evidence pack before opening the conversation:

```powershell
pnpm e2e:chatgpt:session
```

The command defaults to the verified live Atlas route and GPT-5.6 Sol. Override them only when intentionally testing another deployed candidate or GPT-5.6 Terra:

```powershell
$env:ATLAS_CHATGPT_URL = "https://atlas-webmcp-production.up.railway.app/explore"
$env:ATLAS_CHATGPT_MODEL = "GPT-5.6 Terra"
pnpm e2e:chatgpt:session
```

Each run creates `.evals/chatgpt-e2e/sessions/<timestamp>/` with:

- `RUNBOOK.md`: the exact conversation, human marker action, evidence names, and final commands;
- `transcript.json`: the exact-five template with URL, timestamp, model, and portable relative evidence paths already filled;
- `evidence/`: an empty destination for `evidence/available-site-tools.png`, `evidence/recently-used.png`, `evidence/trail.png`, and `evidence/console-or-notes.txt`.

The command never overwrites an existing session. The whole folder remains ignored and can be moved or zipped because the validator resolves relative evidence paths from `transcript.json`, not from the repository working directory.

## Real ChatGPT acceptance

Automated Chrome proof does not prove ChatGPT discovery. In the latest ChatGPT desktop app:

1. Use GPT-5.6 Sol or GPT-5.6 Terra.
2. Open the deployed `/explore` route in the built-in browser.
3. Inspect **Site tools → Available site tools** and confirm the exact five names and titles.
4. Run the prompts in `CHATGPT_ACCEPTANCE.md`.
5. Review **Recently used** / Sources and capture the requested screenshots.
6. Open the generated session's `transcript.json`, replace every `RECORD_ME` value and every sample argument/result with observed evidence, set each completed step's `observed` field to `true`, then set `status` to `captured`.
7. Save the four named evidence files in that session's `evidence/` folder.
8. Validate the record:

```powershell
$env:ATLAS_CHATGPT_TRANSCRIPT = "C:\path\to\session\transcript.json"
pnpm e2e:chatgpt:transcript
```

To include the transcript in the consolidated run, keep `ATLAS_CHATGPT_TRANSCRIPT` set and rerun `pnpm e2e:chatgpt`.

The validator requires every step to be explicitly marked observed, every public tool, visible success for open/note/trail, marker 2 followed by a Miami-Dade/active-stop state read, Springfield ambiguity without mutation, an atomic failed trail, the deployed HTTPS URL, the ChatGPT/client version, and four non-empty local evidence files. It prints each evidence file's SHA-256 digest so the acceptance packet can bind the transcript to the exact captures. A copied template, sample result, or placeholder cannot pass as captured proof.

## Grok 4.6 adversarial evaluation

The deterministic smoke remains the non-model release gate. Grok 4.6 is the chosen independent model-selection challenge against the same 12 natural-language trajectories; it does not replace real ChatGPT acceptance.

```powershell
$env:XAI_API_KEY = "..."
$env:ATLAS_WEBMCP_URL = "https://DEPLOYED_HOST/explore"
pnpm eval:webmcp:grok
```

The runner maps `xai:grok-4.6` to xAI's OpenAI-compatible endpoint without printing the key. It runs each case at least three times, requires at least 90% correct tool/argument trajectories, and fails on any critical wrong-write or atomicity case.

To add the Grok run to the consolidated report:

```powershell
$env:ATLAS_CHATGPT_RUN_GROK = "1"
pnpm e2e:chatgpt
```

No xAI key is bundled with Atlas. This remains a credentialed gate until the tester supplies one through the process environment or secret manager.

## Evidence boundary

A release-ready run requires:

- automated preflight: pass;
- Chrome WebMCP smoke: pass;
- real ChatGPT transcript: pass;
- Grok 4.6 model threshold: pass;
- no public `/mcp` claim;
- no API key, token, local transcript, or screenshot with account data committed to the repository.

Official references:

- [OpenAI Site Tools / WebMCP](https://learn.chatgpt.com/docs/webmcp)
- [Connect and test a ChatGPT plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt)
- [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server)
- [xAI Grok 4.6 models](https://docs.x.ai/developers/models)
- [xAI API quickstart](https://docs.x.ai/developers/quickstart)
