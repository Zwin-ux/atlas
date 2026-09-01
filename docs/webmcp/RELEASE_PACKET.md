# Atlas WebMCP Owner-Gated Release Packet

## Current verdict

The standalone challenge repository is reproducible, privately mirrored, and live on an isolated Railway service. A newer, fully verified local candidate is ready for an owner-approved private fast-forward and isolated Railway update. Its GitHub remote remains private. The historical Atlas repository and its Git history are still **not safe to publish**.

Do not change the historical repository's visibility. Do not publish the sanitized repository, configure secrets, or submit Devpost without the matching owner gate.

## Sanitized candidate

- Local repository: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release`
- Branch: `codex/release-design-pass`
- Pending candidate SHA: `110fd05f9fb4a78f66954ea3b0c952012b512e9a`
- Source provenance SHA: `abfe898a4793f60b803b2c2ce108ecea75f8cb7f`
- Final clean clone: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-110fd05`
- Current private remote and deployed SHA: `986cf864927219f5f269a04b21a96f8440988cba`
- Live route: `https://atlas-webmcp-production.up.railway.app/explore`
- Railway project/service: `5c0ac24b-b588-4ba2-8d04-5118103b2999` / `807e65dc-37bd-43ae-8059-a05c4da62893`
- Active deployment: `5ce284dc-4fd1-43ab-ad5a-5f63b8ec0c82`
- Challenge baseline disclosed in the public repo: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Owner-selected license: Apache-2.0
- Public tools: exactly `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail`

The repository contains one challenge-only React entry, one small no-login Node server, the exact-five controller/tool/eval path, focused tests, public submission documents, a Railway config, selected map proof, 3,222 runtime county packs, and 52 state plates. It has no dependency on the historical `@atlas/*` workspaces.

## Final local proof

The pending candidate was cloned with `git clone --no-local` into an empty directory. At exact SHA `110fd05f9fb4a78f66954ea3b0c952012b512e9a`:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile policy green, 135 packages installed |
| `pnpm typecheck` | PASS; standalone web and server contracts |
| `pnpm build` | PASS; challenge client and server built |
| `pnpm verify:webmcp` | PASS; 37/37 focused tests plus runtime and judge-copy guards |
| `pnpm eval:webmcp:smoke` | PASS; Chrome 152, 9/9 official steps, 15 deeper tool executions, immediate route/marker visibility, usable 390x844 map area, 44px visible controls, and reduced-motion suppression |
| `pnpm audit:release` | PASS; 3,339 files, 88,220,753 bytes, 13 commits, clean Git state, no oversized files, no audit failures |
| `git diff --check` and `git status --short --branch` | PASS; no whitespace errors and clean exact-SHA clone |

The release-facing trail proof now includes a complete route and readable numbered markers before tool success, restrained continuity motion, explicit session-only context, a non-color `Current` state, usable mobile map area, 44px visible mobile controls, and the real Chrome WebMCP activity rail. ChatGPT-facing Site Tools also have plain-language titles, natural-intent descriptions, bounded visible/unchanged result signals, and a tamper-resistant capture workflow requiring unique call IDs, timestamps, real PNG evidence, and independent post-failure state reads.

The pending candidate is verified locally and from its no-local clone. The private remote and active Railway deployment deliberately remain on `986cf864927219f5f269a04b21a96f8440988cba` until the owner approves the exact update below.

## Scope, secret, size, and provenance audit

The sanitized repository audit reports:

- 3,339 tracked files;
- 88,220,753 audited source/data bytes in the final clean clone;
- 3,222 county geo packs and 52 state plates;
- no tracked build output, eval output, `node_modules`, `.env`, historical apps, or historical workspace packages;
- no file larger than 5 MiB;
- no common private-key, AWS, GitHub, OpenAI, Slack, or local-user-path pattern in audited text;
- no retired product term in the standalone `server/` or `web/` runtime;
- only `react` and `react-dom` as runtime dependencies;
- a full Apache-2.0 license, Census attribution, and frozen dependency-license inventory.

`gitleaks` is not installed on this host, so the in-repo scanner is a bounded common-pattern scan rather than a third-party entropy verdict. Before public visibility, require one additional GitHub secret-scan or owner-approved entropy scanner over the new repository's complete history. Because the pending history contains only 13 challenge commits and matches the audited tree, this is a narrow remaining publication check, not evidence that the historical repository is safe.

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

### Gate 1c - fast-forward the private remote to the live E2E candidate - COMPLETE

Completed August 30, 2026: owner activated release mode and sanitized `main` was pushed normally from remote `04aa4aaa` to exact candidate `049ec222a1a0fce1f1a17103e179c787a9d0df9a`. Post-push checks confirm `refs/heads/main` at that SHA, local and remote at `0 0`, default branch `main`, and repository visibility still `PRIVATE`. No deployment was created.

Evidence: the generated tree matches the reviewed assembler output across all 3,336 files; a no-local clone at the exact candidate passes frozen install, typecheck, build, 32/32 WebMCP verification, Chrome 152 smoke (9/9 official steps and 13 deeper executions), the composed ChatGPT E2E automated lane, and the release audit with zero failures. The E2E report deliberately remains `releaseReady: false` because real ChatGPT and Grok evidence are not fabricated.

Risk: the private remote now contains the live-URL preflight, transcript validator, Grok 4.6 adapter, and supporting documentation. No visibility, deployment, authentication, or persistent storage changed.

Rollback: revert this single commit with a normal follow-up commit. Moving the branch backward requires a separate destructive-history approval.

### Gate 1d - deployable config fix and verified live-URL documentation - COMPLETE

Completed August 30, 2026: fixed the invalid unquoted Railway `$schema` key, added regression coverage in both source and sanitized verification, fast-forwarded the private remote normally through `cc45be38d2bb9d48ca3eb498bf6671b025f226ff`, and published the verified URL in candidate `986cf864927219f5f269a04b21a96f8440988cba`.

Evidence: exact `986cf864` passes the full no-local clean-clone stack and equals private remote `main`. The repository remains `PRIVATE`.

Risk: only the private challenge repository changed; no visibility, credential, persistence, or tool-surface change occurred.

Rollback: revert the two narrow commits with normal follow-up commits. Moving the branch backward remains a separate destructive-history gate.

### Gate 1e — human-agent design proof private fast-forward — PENDING OWNER APPROVAL

Proposed action: fast-forward the still-private `Zwin-ux/atlas-webmcp-challenge` `main` branch from `986cf864927219f5f269a04b21a96f8440988cba` to exact candidate `110fd05f9fb4a78f66954ea3b0c952012b512e9a`. Do not force-push and do not change repository visibility.

Evidence: source provenance `abfe898a4793f60b803b2c2ce108ecea75f8cb7f`; 3,339 projected files with zero byte mismatches; no-local clone green for frozen install, typecheck, build, 37/37 verification, Chrome 152 smoke with 9/9 official steps and 15 deeper executions, release audit, diff check, and clean status. Three read-only review lanes found and the implementation fixed immediate-visibility, mobile-map/target, transcript-integrity, and evidence-path issues.

Risk: the private remote will contain the new HCI manual, refined interaction/motion layer, and stricter ChatGPT evidence tooling. Source remains private, but a regression in this commit would become the input to the next deployment.

Rollback: create a normal revert commit in the private repository. Do not rewrite history or force the branch backward.

### Gate 2 — public visibility

Required before changing visibility:

- owner reviews the private GitHub tree and About panel;
- GitHub or an owner-approved scanner reports no secrets across the complete 13-commit history;
- license is detected as Apache-2.0;
- README image and attribution render correctly;
- GitHub Actions or a fresh remote clone repeats install, typecheck, build, verify, and smoke as applicable;
- candidate SHA still matches `110fd05f9fb4a78f66954ea3b0c952012b512e9a` or a newer SHA is fully re-verified.

Rollback: return the repository to private immediately. Do not attempt to repair an exposure by rewriting the historical Atlas repository.

### Gate 3 — isolated Railway deployment — COMPLETE

Completed August 30, 2026: created isolated Railway project `atlas-webmcp-challenge` and service `atlas-webmcp`, deployed exact private candidate `986cf864927219f5f269a04b21a96f8440988cba`, and kept GitHub visibility private. The historical `atlas-chatgpt-app` project and its backend, worker, Postgres, and Redis services were not reused.

Verified evidence:

- exact candidate SHA and service/project identifier;
- `/ready`, `/`, and `/explore` return healthy responses over HTTPS;
- `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` are present;
- same-origin place and plate APIs work;
- normal-browser fallback works;
- the deterministic smoke suite passes against the public URL;
- rollback is recorded as prior successful deployment `020fa669-f926-47e6-9a15-0030d79863d7` or removal of the isolated challenge service.

The active deployment is `5ce284dc-4fd1-43ab-ad5a-5f63b8ec0c82` in project `5c0ac24b-b588-4ba2-8d04-5118103b2999`, service `807e65dc-37bd-43ae-8059-a05c4da62893`. The live judge route is `https://atlas-webmcp-production.up.railway.app/explore`.

Risk: this is a public, no-login Atlas runtime and consumes Railway resources. A bad runtime would be reachable by URL even though the source repository remains private.

Rollback: remove the isolated service or roll it back to successful deployment `020fa669-f926-47e6-9a15-0030d79863d7`.

Railway's current config-as-code documentation says `railway.toml` remains supported for legacy services until December 1, 2026, although Railway now prefers its Infrastructure as Code path. That does not block the September 3 challenge deployment, but the owner should not treat this file as a long-term platform contract.

### Gate 3b — deploy the human-agent design proof — PENDING OWNER APPROVAL

Proposed action: after Gate 1e succeeds and the private remote identifies exact candidate `110fd05f9fb4a78f66954ea3b0c952012b512e9a`, update only Railway project `5c0ac24b-b588-4ba2-8d04-5118103b2999`, service `807e65dc-37bd-43ae-8059-a05c4da62893`, then verify `/ready`, `/explore`, the exact-five registry, no-login fallback, and the Chrome smoke lane against the public URL.

Risk: the public no-login runtime changes immediately and consumes Railway resources. A visual, browser, or resource regression would be reachable at the judge URL even though the source repository stays private.

Rollback: restore successful deployment `5ce284dc-4fd1-43ab-ad5a-5f63b8ec0c82`, which serves exact candidate `986cf864927219f5f269a04b21a96f8440988cba`, then rerun `/ready` and `/explore` checks.

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

Chrome 152 now proves this behavior against the deployed HTTPS URL: all five tools registered, all nine official smoke steps and thirteen deeper executions passed, writes completed visibly, ambiguity and failed trails remained mutation-safe, and refresh/route checks found no duplicates. A headed ChatGPT window is open, but it is signed out; the real ChatGPT built-in-browser transcript remains a credential-safe human gate.

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
3. ~~Approve the one-commit private fast-forward to live-E2E candidate.~~ Complete at `049ec222`.
4. ~~Approve the isolated Railway service and deployment while keeping the repository private.~~ Complete at deployment `5ce284dc` from exact candidate `986cf864`.
5. Approve the exact private fast-forward to `110fd05f` and the isolated Railway update, with immediate post-deploy checks and rollback to `5ce284dc` if any gate fails.
6. Sign in to the already-open headed ChatGPT window and capture the real built-in-browser five-tool transcript using `docs/CHATGPT_E2E.md`.
7. Provide `XAI_API_KEY` only in the local environment and run the exact `xai:grok-4.6` three-run/90% lane without recording the credential.
8. Review the private tree, run one additional full-history secret scan, confirm Apache-2.0 detection, and approve public visibility.
9. Record and upload the demo.
10. Review the final Devpost fields and approve submission.

Each gate names an exact action, evidence, risk, and rollback. None is implied by local green tests.
