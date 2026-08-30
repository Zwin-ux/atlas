# Atlas WebMCP Owner-Gated Release Packet

## Current verdict

The standalone challenge repository is locally reproducible and green. Its GitHub remote remains private. The historical Atlas repository and its Git history are still **not safe to publish**.

Do not change the historical repository's visibility. Do not publish the sanitized repository, create a Railway service, configure secrets, or submit Devpost without the matching owner gate.

## Sanitized candidate

- Local repository: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release`
- Branch: `main`
- Candidate SHA: `049ec222a1a0fce1f1a17103e179c787a9d0df9a`
- Final clean clone: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-049ec22`
- Challenge baseline disclosed in the public repo: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Owner-selected license: Apache-2.0
- Public tools: exactly `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail`

The repository contains one challenge-only React entry, one small no-login Node server, the exact-five controller/tool/eval path, focused tests, public submission documents, a Railway config, selected map proof, 3,222 runtime county packs, and 52 state plates. It has no dependency on the historical `@atlas/*` workspaces.

## Final local proof

The candidate was cloned with `git clone --no-local` into an empty directory. At exact SHA `049ec222a1a0fce1f1a17103e179c787a9d0df9a`:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile policy green, 135 packages installed |
| `pnpm typecheck` | PASS; standalone web and server contracts |
| `pnpm build` | PASS; challenge client and server built |
| `pnpm verify:webmcp` | PASS; 32/32 focused tests plus runtime and judge-copy guards |
| `pnpm eval:webmcp:smoke` | PASS; Chrome 152, 9/9 official steps, 13 deeper tool executions |
| `ATLAS_CHATGPT_URL=http://127.0.0.1:8898/explore pnpm e2e:chatgpt` | PASS for automated page/protocol proof; readiness, origin headers, exact-five metadata, place resolution, and Chrome execution passed. `releaseReady` remains false until a real ChatGPT transcript and Grok threshold run exist. |
| `pnpm audit:release` | PASS; 3,336 files, 88,167,598 bytes, ten commits, clean Git state, no audit failures |
| `git diff --check` and `git status --short --branch` | PASS; no whitespace errors and clean exact-SHA clone |

The release-facing trail proof now includes the refined national overlay, explicit session-only context, numbered rail markers, a non-color `Current` state, 32px desktop edit floors, 44px mobile controls, and the real Chrome WebMCP activity rail. ChatGPT-facing Site Tools also have plain-language titles, natural-intent descriptions, and bounded visible/unchanged result signals.

The release assembler was also run into a separate directory and compared byte-for-byte to the committed sanitized repository: 3,336 expected files, 3,336 generated files, zero missing, zero extra, and zero SHA-256 mismatches.

## Scope, secret, size, and provenance audit

The sanitized repository audit reports:

- 3,336 tracked files;
- 88,167,598 audited source/data bytes in the final clean clone;
- 3,222 county geo packs and 52 state plates;
- no tracked build output, eval output, `node_modules`, `.env`, historical apps, or historical workspace packages;
- no file larger than 5 MiB;
- no common private-key, AWS, GitHub, OpenAI, Slack, or local-user-path pattern in audited text;
- no retired product term in the standalone `server/` or `web/` runtime;
- only `react` and `react-dom` as runtime dependencies;
- a full Apache-2.0 license, Census attribution, and frozen dependency-license inventory.

`gitleaks` is not installed on this host, so the in-repo scanner is a bounded common-pattern scan rather than a third-party entropy verdict. Before public visibility, require one additional GitHub secret-scan or owner-approved entropy scanner over the new repository's complete history. Because the new history contains only ten challenge commits and matches the audited tree, this is a narrow remaining publication check, not evidence that the historical repository is safe.

The selected README image was visually inspected: it contains only the Atlas national trail overview and no terminal, local path, account, or credential surface.

## Historical repository boundary

The historical repository remains excluded because it contains tens of thousands of unrelated files, old product/submission material, local/session artifacts, and uncleared visual references. The sanitized repository does not copy its `.git` directory or broad history. It imports only a reviewed allowlist.

Two internal geo-pack build reports (`_manifest.json` and `_failures.json`) were deliberately excluded because the runtime never reads them. They remain recoverable from the private source checkout.

## Owner gates

### Gate 1 — create the private remote and push the candidate — COMPLETE

Completed August 30, 2026: created private repository `Zwin-ux/atlas-webmcp-challenge` and pushed local candidate `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c` as its initial `main` history.

Evidence: GitHub reports `PRIVATE`, the default branch is `main`, and `refs/heads/main` resolves to `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c`. The clean-clone gates, exact generator match, Apache-2.0 license, and no-historical-objects boundary remain recorded in the prior ledger entry.

Risk: creates an external copy and associates the challenge source with the owner's GitHub account. It remains non-public.

Rollback: delete the still-private repository or remove its contents before visibility changes; the local candidate remains intact.

### Gate 1b - fast-forward the private remote to the ChatGPT-first candidate - COMPLETE

Completed August 30, 2026: pushed sanitized `main` from `ad0d5ab` to `04aa4aaa58d1eda8cfa5cf4294d74810c8151a20` in the existing private GitHub repository. A fresh `git ls-remote` check confirms that exact remote head. Visibility remains private.

Evidence: the generated tree matches the reviewed assembler output across all 3,330 tracked files; a no-local clean clone at the exact candidate SHA passes frozen install, typecheck, build, 32 focused WebMCP tests, Chrome 152 smoke (9/9 official steps and 13 deeper executions), and the release audit with zero failures.

Risk: the private remote now contains the ChatGPT-first descriptors, result contract, evaluation set, and acceptance document. No public visibility or deployment changed.

Rollback: move the private branch back to `ad0d5ab` only with a separate explicit destructive-history approval, or revert the one new commit with a normal follow-up commit.

### Gate 1c - fast-forward the private remote to the live E2E candidate - READY, OWNER APPROVAL REQUIRED

Proposed action: push local `main` from `C:\Users\mzwin\Documents\Atlas-WebMCP-Release` to the existing private GitHub repository. This is a one-commit fast-forward from remote `04aa4aaa` to exact locally verified candidate `049ec222a1a0fce1f1a17103e179c787a9d0df9a`; visibility remains private and no deployment is created.

Evidence: the generated tree matches the reviewed assembler output across all 3,336 files; a no-local clone at the exact candidate passes frozen install, typecheck, build, 32/32 WebMCP verification, Chrome 152 smoke (9/9 official steps and 13 deeper executions), the composed ChatGPT E2E automated lane, and the release audit with zero failures. The E2E report deliberately remains `releaseReady: false` because real ChatGPT and Grok evidence are not fabricated.

Risk: the private remote gains the live-URL preflight, transcript validator, Grok 4.6 adapter, and supporting documentation. No visibility, deployment, authentication, or persistent storage changes.

Rollback: revert this single commit with a normal follow-up commit. Moving the branch backward requires a separate destructive-history approval.

### Gate 2 — public visibility

Required before changing visibility:

- owner reviews the private GitHub tree and About panel;
- GitHub or an owner-approved scanner reports no secrets across the complete ten-commit history;
- license is detected as Apache-2.0;
- README image and attribution render correctly;
- GitHub Actions or a fresh remote clone repeats install, typecheck, build, verify, and smoke as applicable;
- candidate SHA still matches `049ec222a1a0fce1f1a17103e179c787a9d0df9a` or a new SHA is fully re-verified.

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
2. ~~Approve the one-commit private fast-forward to the ChatGPT-first candidate.~~ Complete at `04aa4aaa`.
3. Approve the one-commit private fast-forward to live-E2E candidate `049ec222`.
4. Review the private tree, secret scan, license detection, and clean remote clone.
5. Approve the new Railway service and deployment while keeping the repository private.
6. Run public Chrome, ChatGPT built-in-browser, and Grok 4.6 acceptance using `docs/CHATGPT_E2E.md`.
7. Approve public visibility only after the remote evidence is green.
8. Record and upload the demo.
9. Review the final Devpost fields and approve submission.

Each gate names an exact action, evidence, risk, and rollback. None is implied by local green tests.
