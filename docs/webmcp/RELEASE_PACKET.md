# Atlas WebMCP Owner-Gated Release Packet

## Current verdict

The local candidate is green. The existing repository and its history are **not safe to publish**. Public source, license, deployment, built-in-browser acceptance, video upload, and Devpost submission remain owner gates.

Do not change the current repository from private to public.

## Local candidate evidence

- Branch: `webmcp-challenge`
- Challenge baseline: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Latest code/design commit before this packet: `b90182b64fa27b78a8d07738360c1cb842b833b4`
- Required local gates: `pnpm install --frozen-lockfile`, `pnpm verify:webmcp`, `pnpm typecheck`, `pnpm build`
- Browser proof: 1280x720 and 390x844 no-login route, ambiguity recovery, fallback, accessibility tree, zero mobile overflow, and 44px visible controls
- Design review: two medium findings fixed and verified; map remains the single visual anchor

The final documentation commit and final clean verification SHA must be recorded in `WEBMCP_STATE.md` before any owner action.

## Publication-safety audit

Current tracked inventory:

- 37,259 tracked files
- 440.85 MiB packed Git objects
- 33.50 MiB loose objects in the local shared repository
- 410 Markdown files visible to a broad repository audit
- no root `LICENSE`

The tree contains historical product and submission material outside the WebMCP cut, including `chatgpt-app-submission.json`, session handoffs, council/conversation artifacts, Codex/Fable result packets, old billing/Commons/Scout documentation, and files containing local Windows paths or session metadata.

A narrow positive scan found no tracked filename matching common credential extensions and no obvious private-key, `sk-`, `ghp_`, or `AKIA` pattern. That is **not** a secret-safety verdict. The repository has not passed entropy scanning, full history rewriting, provenance review, or a public-fork inspection.

Asset and data provenance is also incomplete. The map UI credits U.S. Census TIGERweb, but the broad repository contains many historical visual/reference assets that have not been cleared for a new open-source release.

## Required public-source boundary

Create a new empty challenge repository from a reviewed allowlist. Do not fork or expose this repository and do not copy its `.git` directory.

The sanitized repository should contain only:

- the no-login challenge server and map client;
- the minimal `@atlas/core/atlas` and geography code required by that client;
- required Census-backed county/place data with a provenance notice;
- the exact-five registry, tools, controller, and focused tests;
- `pnpm verify:webmcp`, typecheck, build, and public smoke scripts;
- this challenge-first README and `docs/webmcp/` packet;
- selected current browser proof with no local paths or private metadata;
- an owner-selected open-source license.

Exclude old Apps SDK/plugin surfaces, Scout, campaigns, Hosted Clawd, Commons, billing, auth, persistence, old submissions, prompt packs, agent transcripts, session handoffs, private review packets, unrelated renderer experiments, deployment credentials, and historical Git objects.

## Owner gates

### Gate 1, license

Owner chooses the license. No agent should infer or add one.

Required evidence:

- license name;
- exact `LICENSE` text in the sanitized repository;
- dependency and data compatibility check;
- README license statement.

### Gate 2, sanitized public source

Proposed action: create a new private empty repository, import the audited challenge allowlist as one clean history, run scans, then approve visibility separately.

Required evidence before visibility changes:

```powershell
pnpm install --frozen-lockfile
pnpm verify:webmcp
pnpm typecheck
pnpm build
pnpm audit:webmcp:release
git status --short --branch
```

Also require:

- tracked-file inventory review;
- secret and entropy scan across the complete new history;
- no local paths, emails, session IDs, transcripts, or retired product copy;
- dependency/data/asset provenance notice;
- owner-selected license present;
- clean clone repeats all four gates.

Rollback: keep the new repository private or delete the unpublished new repository. Never “fix” exposure by rewriting the current Atlas history after publication.

### Gate 3, deployment

Proposed action: publish the candidate SHA to an owner-approved HTTPS host with no login and no secrets in client output.

Required evidence:

- exact candidate SHA and deployment target;
- `/` and `/explore` return 200;
- `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` are present;
- same-origin place APIs work;
- normal-browser fallback works;
- public `pnpm verify:webmcp` equivalent passes;
- rollback command or prior deployment identifier is recorded.

### Gate 4, real WebMCP acceptance

Use a supported Chrome/WebMCP or ChatGPT built-in-browser environment. Do not inject a fake API.

Required evidence:

- exactly five discovered tools;
- one successful call per tool;
- visible completion before all three write successes;
- Springfield ambiguity without mutation;
- one bad trail stop leaves the prior trail/map state intact;
- top-level registration only;
- no raw geometry, secrets, or oversized outputs.

### Gate 5, video and Devpost

Required evidence:

- public deployment URL;
- sanitized public source URL;
- license;
- public YouTube video under three minutes with audio;
- final copy reviewed against current official rules;
- challenge-period delta accurately disclosed;
- owner approval to submit.

## Exact owner decision sequence

1. Choose an open-source license.
2. Approve creation of a new sanitized challenge repository.
3. Review the new repository’s clean-clone, history, secret, and provenance audit.
4. Approve public visibility.
5. Approve and publish the deployment.
6. Run real built-in-browser acceptance.
7. Record and upload the demo.
8. Review final Devpost fields and approve submission.

Each decision should name the candidate SHA, exact action, evidence, risk, and rollback. None is implied by local green tests.
