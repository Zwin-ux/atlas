# Verification boundary

Run the public candidate from a clean clone:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm verify:webmcp
pnpm eval:webmcp:smoke
pnpm audit:release
```

The deterministic suite proves exact-five registration, narrow schemas, shared-controller mutations, visible completion, ambiguity safety, atomic trail failure, normal-browser fallback, national trail rendering, refresh/route lifecycle, and real Chrome protocol execution without a model key.

Model-selection commands are separate credentialed gates:

```powershell
$env:ATLAS_WEBMCP_EVAL_MODEL = "openai:gpt-5-mini"
$env:OPENAI_API_KEY = "..."
pnpm eval:webmcp:static
pnpm eval:webmcp:browser
```

Each model case runs at least three trajectories, requires at least 90% correct tool/argument steps, and rejects every critical write-selection or atomicity failure. A missing credential or unavailable model backend is blocked evidence, not a pass.

For the public judge route, run the complete page and Chrome protocol proof against one exact HTTPS URL:

```powershell
$env:ATLAS_CHATGPT_URL = "https://atlas-webmcp-production.up.railway.app/explore"
pnpm e2e:chatgpt:session
pnpm e2e:chatgpt
```

The session command creates an ignored runbook, prefilled transcript, and portable evidence folder. Capture and validate the real ChatGPT record described in `docs/CHATGPT_E2E.md`. For the independent model threshold:

```powershell
$env:XAI_API_KEY = "..."
$env:ATLAS_WEBMCP_URL = $env:ATLAS_CHATGPT_URL
pnpm eval:webmcp:grok
```

The consolidated report separates automated success from `releaseReady`; it cannot label missing ChatGPT or model evidence as complete.

Before release, record the immutable candidate with `git rev-parse HEAD`. Public deployment, real ChatGPT built-in-browser acceptance, video upload, and Devpost submission require their own URLs and owner approval.

For a local narrated timing cut made from the SHA-bound product captures:

```powershell
pnpm demo:webmcp:assemble -- --audio C:\absolute\path\to\voiceover.wav --candidate <candidate-sha> --out .evals\webmcp-demo\review
```

The command requires audio and rejects a missing audio stream, wrong output resolution, or a runtime of three minutes or longer. Its manifest makes clear that verified still-frame editorial motion is not a substitute for the required real ChatGPT conversation footage.
