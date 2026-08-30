# Atlas WebMCP Owner-Gated Release Packet

## Current verdict

The standalone challenge repository is locally reproducible and green. It remains private and local. The historical Atlas repository and its Git history are still **not safe to publish**.

Do not change the historical repository's visibility. Do not publish the sanitized repository, create a Railway service, configure secrets, or submit Devpost without the matching owner gate.

## Sanitized candidate

- Local repository: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release`
- Branch: `main`
- Candidate SHA: `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c`
- Final clean clone: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-ad0d5ab`
- Challenge baseline disclosed in the public repo: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Owner-selected license: Apache-2.0
- Public tools: exactly `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail`

The repository contains one challenge-only React entry, one small no-login Node server, the exact-five controller/tool/eval path, focused tests, public submission documents, a Railway config, selected map proof, 3,222 runtime county packs, and 52 state plates. It has no dependency on the historical `@atlas/*` workspaces.

## Final local proof

The candidate was cloned with `git clone --no-local` into an empty directory. At exact SHA `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c`:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile policy green, 135 packages installed |
| `pnpm typecheck` | PASS; standalone web and server contracts |
| `pnpm build` | PASS; challenge client and server built |
| `pnpm verify:webmcp` | PASS; 30/30 focused tests plus runtime and judge-copy guards |
| `pnpm eval:webmcp:smoke` | PASS; Chrome 152, 9/9 official steps, 13 deeper tool executions |
| `pnpm audit:release` | PASS; clean Git state, no audit failures |

The release-facing trail proof now includes the refined national overlay, explicit session-only context, numbered rail markers, a non-color `Current` state, 32px desktop edit floors, 44px mobile controls, and the real Chrome WebMCP activity rail.

The release assembler was also run into a separate directory and compared to the committed sanitized repository: 3,329 expected files, 3,329 generated files, zero missing, zero extra, and zero SHA-256 mismatches.

## Scope, secret, size, and provenance audit

The sanitized repository audit reports:

- 3,329 tracked files;
- 88,114,588 audited source/data bytes in the final clean clone;
- 3,222 county geo packs and 52 state plates;
- no tracked build output, eval output, `node_modules`, `.env`, historical apps, or historical workspace packages;
- no file larger than 5 MiB;
- no common private-key, AWS, GitHub, OpenAI, Slack, or local-user-path pattern in audited text;
- no retired product term in the standalone `server/` or `web/` runtime;
- only `react` and `react-dom` as runtime dependencies;
- a full Apache-2.0 license, Census attribution, and frozen dependency-license inventory.

`gitleaks` is not installed on this host, so the in-repo scanner is a bounded common-pattern scan rather than a third-party entropy verdict. Before public visibility, require one additional GitHub secret-scan or owner-approved entropy scanner over the new repository's complete history. Because the new history contains only six local commits and matches the audited tree, this is a narrow remaining publication check, not evidence that the historical repository is safe.

The selected README image was visually inspected: it contains only the Atlas national trail overview and no terminal, local path, account, or credential surface.

## Historical repository boundary

The historical repository remains excluded because it contains tens of thousands of unrelated files, old product/submission material, local/session artifacts, and uncleared visual references. The sanitized repository does not copy its `.git` directory or broad history. It imports only a reviewed allowlist.

Two internal geo-pack build reports (`_manifest.json` and `_failures.json`) were deliberately excluded because the runtime never reads them. They remain recoverable from the private source checkout.

## Owner gates

### Gate 1 — create the private remote and push the candidate — COMPLETE

Completed August 30, 2026: created private repository `Zwin-ux/atlas-webmcp-challenge` and pushed local candidate `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c` as its initial `main` history.

Evidence: GitHub reports `PRIVATE`, the default branch is `main`, and `refs/heads/main` resolves to the exact audited SHA above. The clean-clone gates, exact generator match, Apache-2.0 license, and no-historical-objects boundary remain recorded above.

Risk: creates an external copy and associates the challenge source with the owner's GitHub account. It remains non-public.

Rollback: delete the still-private repository or remove its contents before visibility changes; the local candidate remains intact.

### Gate 2 — public visibility

Required before changing visibility:

- owner reviews the private GitHub tree and About panel;
- GitHub or an owner-approved scanner reports no secrets across the complete eight-commit history;
- license is detected as Apache-2.0;
- README image and attribution render correctly;
- GitHub Actions or a fresh remote clone repeats install, typecheck, build, verify, and smoke as applicable;
- candidate SHA still matches `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c` or a new SHA is fully re-verified.

Rollback: return the repository to private immediately. Do not attempt to repair an exposure by rewriting the historical Atlas repository.

### Gate 3 — Railway deployment

Proposed action: create a new Railway service from the sanitized repository and publish the candidate with the included `railway.toml` contract.

Required evidence:

- exact candidate SHA and service/project identifier;
- `/ready`, `/`, and `/explore` return healthy responses over HTTPS;
- `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` are present;
- same-origin place and plate APIs work;
- normal-browser fallback works;
- the deterministic smoke suite passes against the public URL;
- rollback is recorded as the prior deployment or service removal.

Railway's current config-as-code documentation says `railway.toml` remains supported for legacy services until December 1, 2026, although Railway now prefers its Infrastructure as Code path. That does not block the September 3 challenge deployment, but the owner should not treat this file as a long-term platform contract.

### Gate 4 — real WebMCP acceptance

Use supported Chrome/WebMCP and ChatGPT built-in-browser environments without injecting a fake API.

Required evidence:

- exactly five tools discovered;
- one real call per tool;
- all write tools visibly complete before success;
- Springfield ambiguity leaves state unchanged;
- one unresolved trail stop preserves the previous map and trail;
- refresh and route transitions do not duplicate tools;
- no raw geometry, secret, or oversized result enters tool output.

Local Chrome 152 already proves this behavior. Repeat it against the deployed URL; ChatGPT built-in-browser acceptance remains separate.

### Gate 5 — video and Devpost

Required evidence:

- approved public deployment URL;
- approved public source URL;
- public YouTube video under three minutes with audible narration;
- final copy reviewed against current official rules;
- challenge-period delta accurately disclosed;
- owner approval to submit.

## Exact owner sequence

1. ~~Approve creation of the new private GitHub repository and initial push.~~ Complete at `ad0d5ab`.
2. Review the next fully verified candidate, secret scan, license detection, tree, and clean remote clone.
3. Approve public visibility.
4. Approve the new Railway service and deployment.
5. Run public Chrome and ChatGPT built-in-browser acceptance using `docs/CHATGPT_ACCEPTANCE.md`.
6. Record and upload the demo.
7. Review the final Devpost fields and approve submission.

Each gate names an exact action, evidence, risk, and rollback. None is implied by local green tests.
