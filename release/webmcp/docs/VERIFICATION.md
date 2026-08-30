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

Before release, record the immutable candidate with `git rev-parse HEAD`. Public deployment, real ChatGPT built-in-browser acceptance, video upload, and Devpost submission require their own URLs and owner approval.

