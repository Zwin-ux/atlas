# Atlas WebMCP Owner-Gated Release Packet

## Current verdict

The standalone challenge repository is reproducible, privately mirrored at exact presentation candidate `97792d84`, and live through isolated Railway deployment `99367264`. Candidate `97792d84`, projected from source `da0f4eae`, is a normal fast-forward and passes the full no-local clean-clone and post-deploy gates. The GitHub repository remains private. The historical Atlas repository and its Git history are still **not safe to publish**.

The checksum-verified Gitleaks `8.30.1` binary scanned candidate `97792d84`'s complete 16-commit history and about 88.33 MB with zero leaks.

Live Devpost data fetched September 3 reports submissions open and an official twelve-hour extension to **September 4, 2026 at 1:00 AM Pacific**. The remaining external gates are now the critical path: real ChatGPT footage, final narrated video, public sanitized source, owner-only form answers, and submission.

Do not change the historical repository's visibility. Do not publish the sanitized repository, configure secrets, or submit Devpost without the matching owner gate.

## Sanitized candidate

- Local repository: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release`
- Branch: `codex/release-design-pass`
- Private remote candidate SHA: `97792d84d66239745011624690769e99ab25838c`
- Source provenance SHA: `da0f4eae8582a345ada3de891422a21b0ac9c4dd`
- Final clean clone: `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-97792d8`
- Deployed candidate SHA: `97792d84d66239745011624690769e99ab25838c`
- Live route: `https://atlas-webmcp-production.up.railway.app/explore`
- Railway project/service: `5c0ac24b-b588-4ba2-8d04-5118103b2999` / `807e65dc-37bd-43ae-8059-a05c4da62893`
- Active deployment: `99367264-120d-4db4-8a15-2e04bdd73a45`
- Rollback content: exact prior candidate `39d1e1413e72ea050845ffbaa6323fffeb8c28f1` in `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-39d1e14`; superseded deployment `cd899386-c7b4-4f1c-816d-1bf6e67e20fa` is now `REMOVED`
- Challenge baseline disclosed in the public repo: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Owner-selected license: Apache-2.0
- Public tools: exactly `get_map_state`, `search_places`, `open_place`, `add_map_note`, and `create_map_trail`

The repository contains one challenge-only React entry, one small no-login Node server, the exact-five controller/tool/eval path, focused tests, public submission documents, a Railway config, selected map proof, 3,222 runtime county packs, and 52 state plates. It has no dependency on the historical `@atlas/*` workspaces.

## Final local proof

The current private candidate was cloned with `git clone --no-local` into an empty directory. At exact SHA `97792d84d66239745011624690769e99ab25838c`:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; lockfile policy green, 135 packages installed |
| `pnpm typecheck` | PASS; standalone web and server contracts |
| `pnpm build` | PASS; challenge client and server built |
| `pnpm verify:webmcp` | PASS; 39/39 focused tests plus runtime, judge-copy, presentation, and pinned-compatibility guards |
| `pnpm eval:webmcp:smoke` | PASS; Chrome 152, 9/9 official steps, 15 deeper tool executions, immediate route/marker visibility, usable 390x844 map area, 44px visible controls, and reduced-motion suppression |
| `pnpm audit:release` | PASS; 3,355 files, 3,222 county packs, 52 state plates, 16 commits, clean Git state, no oversized files, no audit failures |
| `git diff --check` and `git status --short --branch` | PASS; no whitespace errors and clean exact-SHA clone |

The release-facing trail proof includes a complete route and readable numbered markers before tool success, restrained continuity motion, explicit session-only context, a non-color `Current` state, usable mobile map area, 44px visible mobile controls, and the real Chrome WebMCP activity rail. The idle `Try a 3-stop trail` coaching and its dead responsive CSS are removed, leaving one calm availability signal until a real agent action occurs. ChatGPT-facing Site Tools have plain-language titles, natural-intent descriptions, bounded visible/unchanged result signals, a tamper-resistant capture workflow, and a compatibility record pinned to WebMCP proposal commit `41d12f057167ccf5954dbcf49d99502cb6c84491` plus OpenAI's current Site Tools documentation. Normal registration teardown can no longer be misreported as `Site tools offline`.

Candidate `97792d84` is verified locally, from its no-local clone, on private remote `main`, and through active public Railway deployment `99367264`. GitHub visibility remains `PRIVATE`.

## Scope, secret, size, and provenance audit

The sanitized repository audit reports:

- 3,355 tracked files;
- about 88.33 MB scanned across the complete sanitized history;
- 3,222 county geo packs and 52 state plates;
- no tracked build output, eval output, `node_modules`, `.env`, historical apps, or historical workspace packages;
- no file larger than 5 MiB;
- no common private-key, AWS, GitHub, OpenAI, Slack, or local-user-path pattern in audited text;
- no retired product term in the standalone `server/` or `web/` runtime;
- only `react` and `react-dom` as runtime dependencies;
- a full Apache-2.0 license, Census attribution, and frozen dependency-license inventory.

Official Gitleaks `8.30.1` was downloaded from its GitHub release, its Windows x64 SHA-256 matched the published checksum, and it scanned all 16 sanitized commits plus about 88.33 MB with zero findings. This strengthens only the sanitized repository boundary; it is not evidence that the historical repository is safe. Public visibility still requires the owner's final remote-tree review and explicit approval.

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

### Gate 1e — pinned WebMCP compatibility candidate private fast-forward — COMPLETE

Completed August 31, 2026: after the owner answered the exact gate with "keep going" and asked Codex to verify the result, the still-private `Zwin-ux/atlas-webmcp-challenge` `main` branch was fast-forwarded normally from `986cf864927219f5f269a04b21a96f8440988cba` to exact candidate `39d1e1413e72ea050845ffbaa6323fffeb8c28f1`. No force push or visibility change occurred.

Evidence: `git ls-remote` returns exact `39d1e1413e72ea050845ffbaa6323fffeb8c28f1`; `gh repo view` reports default branch `main` and visibility `PRIVATE`. Source provenance `52b42b18`, clean-clone proof, 38/38 verification, 9/9 official Chrome steps, 15 deeper executions, release audit, and the pinned primary-source review remain green.

Risk: the private remote now contains the HCI/motion work, stricter ChatGPT evidence tooling, current compatibility record, and lifecycle hardening. Source remains private.

Rollback: create a normal revert commit in the private repository. Do not rewrite history or force the branch backward.

### Gate 1f — presentation candidate private fast-forward — COMPLETE

Completed September 3, 2026: after the owner explicitly approved `private push 97792d84`, the still-private `Zwin-ux/atlas-webmcp-challenge` `main` branch was fast-forwarded normally from `39d1e1413e72ea050845ffbaa6323fffeb8c28f1` to exact candidate `97792d84d66239745011624690769e99ab25838c`. No force push or visibility change occurred.

Evidence: `git ls-remote` returns exact `97792d84d66239745011624690769e99ab25838c`; `gh repo view` reports default branch `main` and visibility `PRIVATE`. The candidate and no-local clone passed frozen install, typecheck, build, 39/39 verification, Chrome exact-five smoke, release audit, clean status, and a checksum-verified 16-commit Gitleaks scan with zero findings.

Risk: the private remote now contains the judge-presentation polish and supporting documentation. The public runtime did not change because Railway did not auto-deploy.

Rollback: create a normal revert commit in the private repository. Do not rewrite history or force the branch backward.

### Gate 2 — public visibility

Required before changing visibility:

- owner reviews the private GitHub tree and About panel;
- official Gitleaks `8.30.1` full-history scan reports zero findings across all 16 commits — COMPLETE;
- license is detected as Apache-2.0 — COMPLETE;
- README image and attribution render correctly;
- GitHub Actions or a fresh remote clone repeats install, typecheck, build, verify, and smoke as applicable;
- candidate SHA still matches `97792d84d66239745011624690769e99ab25838c` or a newer SHA is fully re-verified.

Current read-only GitHub preflight: exact remote `main` is `97792d84d66239745011624690769e99ab25838c`; visibility remains `PRIVATE`; default branch is `main`; Apache-2.0 detection passes; the repository is enabled and not archived. The About description and homepage are blank, and there are no GitHub Actions runs. Set judge-facing metadata and choose CI versus the existing exact-SHA clean-clone/browser evidence only with explicit owner approval.

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
- rollback content and service-removal procedures are recorded without depending on Railway retaining a superseded deployment as active.

The initial deployment was `5ce284dc-4fd1-43ab-ad5a-5f63b8ec0c82`; Railway marked it `REMOVED` after Gate 3b and later marked `cd899386-c7b4-4f1c-816d-1bf6e67e20fa` `REMOVED` after Gate 3c. The active deployment is `99367264-120d-4db4-8a15-2e04bdd73a45` in project `5c0ac24b-b588-4ba2-8d04-5118103b2999`, service `807e65dc-37bd-43ae-8059-a05c4da62893`. The live judge route is `https://atlas-webmcp-production.up.railway.app/explore`. Rollback requires redeploying preserved candidate content rather than assuming a superseded deployment remains restorable.

Risk: this is a public, no-login Atlas runtime and consumes Railway resources. A bad runtime would be reachable by URL even though the source repository remains private.

Rollback: remove the isolated service or redeploy the preserved exact prior candidate from its clean clone. Do not rely on Railway retaining a superseded deployment as active.

Railway's current config-as-code documentation says `railway.toml` remains supported for legacy services until December 1, 2026, although Railway now prefers its Infrastructure as Code path. That does not block the September 3 challenge deployment, but the owner should not treat this file as a long-term platform contract.

### Gate 3b — deploy the pinned WebMCP compatibility candidate — COMPLETE

Completed August 31, 2026: exact candidate `39d1e1413e72ea050845ffbaa6323fffeb8c28f1` was uploaded only to Railway project `5c0ac24b-b588-4ba2-8d04-5118103b2999`, service `807e65dc-37bd-43ae-8059-a05c4da62893`. Deployment `cd899386-c7b4-4f1c-816d-1bf6e67e20fa` reported `SUCCESS` with one running instance and no error-level deploy logs before Gate 3c superseded it.

Post-deploy evidence: `/ready` and `/explore` return HTTP 200; the route remains no-login and sends the required origin headers; preflight exposes the exact five human-titled tools and preserves Springfield's eight candidates; Chrome 152 passes 9/9 official steps and 15 deeper executions with visible atomic writes, exact 390x844 coverage, and reduced-motion checks. Fresh desktop/mobile captures were visually inspected and pass the map-first hierarchy. The real Codex in-app browser separately discovered and invoked all five deployed Site Tools, proved ambiguity-safe state, rendered the note/trail, reflected a human marker click in the next agent read, and rediscovered the exact-five surface after refresh with no false offline status or captured warning/error.

Risk: the public no-login runtime now serves the new candidate and consumes Railway resources. Post-deploy automated and visual acceptance found no regression.

Rollback: from `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-986cf86`, redeploy exact candidate `986cf864927219f5f269a04b21a96f8440988cba` only to the isolated challenge service, then rerun `/ready`, `/explore`, and Chrome smoke. Superseded deployment `5ce284dc` is `REMOVED`; no rollback was needed.

### Gate 3c — deploy the presentation candidate — COMPLETE

Completed September 3, 2026: after the owner explicitly approved `Railway deploy 97792d84`, exact candidate `97792d84d66239745011624690769e99ab25838c` was uploaded only from the clean sanitized checkout to project `5c0ac24b-b588-4ba2-8d04-5118103b2999`, production environment `d1025fef-c80b-4972-bd4c-7cb63292a731`, service `807e65dc-37bd-43ae-8059-a05c4da62893`. Deployment `99367264-120d-4db4-8a15-2e04bdd73a45` reports `SUCCESS`, is online, and has image digest `sha256:83c67784def1389f70ef94102a3269ac4725b0b78cf3d830bc1f6328d5473a03`.

Post-deploy evidence: `/ready` and `/explore` return HTTP 200; the route remains no-login and sends the required origin headers; preflight finds 3,222 counties, 18,447 places, eight Springfield candidates, and exactly five human-titled tools. Chrome `152.0.7977.66` passes 9/9 official steps and 15 deeper executions with visible atomic writes, shared human-agent stop handoff, unknown/ambiguous mutation safety, exact 390x844 coverage, and reduced-motion suppression. The focused verifier passes 39/39. Independent desktop/mobile fallback inspection found no horizontal overflow, preserved a 457px mobile map, and measured every visible mobile control at 44px or larger.

Risk: the public no-login runtime serves the presentation candidate and consumes Railway resources. Post-deploy automated and visual acceptance found no regression. The only gstack console message was Chrome's expected non-WebMCP warning that the origin-trial-controlled `tools` Permissions-Policy feature was unavailable; the WebMCP-enabled Chrome suite registered and executed all five tools with zero console errors.

Rollback: redeploy preserved exact candidate `39d1e1413e72ea050845ffbaa6323fffeb8c28f1` from `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-39d1e14`, then repeat `/ready`, `/explore`, exact-five Chrome smoke, and visual checks. Superseded deployment `cd899386` is `REMOVED`, so rollback is a new upload rather than a deployment toggle.

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

Chrome 152 proves this behavior against the deployed HTTPS URL: all five tools registered, all nine official smoke steps and fifteen deeper executions passed, writes completed visibly, ambiguity and failed trails remained mutation-safe, and refresh/route checks found no duplicates. The real Codex in-app browser independently called all five tools, verified human-to-agent state handoff, and passed a refresh lifecycle check. A fresh acceptance session exists at `.evals/chatgpt-e2e/sessions/2026-09-01T03-46-41-354Z`; the real ChatGPT conversation transcript remains a credential-safe human-observation gate.

### Gate 5 — video and Devpost

Required evidence:

- approved public deployment URL;
- approved public source URL;
- public YouTube video under three minutes with audible narration;
- final copy reviewed against current official rules;
- challenge-period delta accurately disclosed;
- owner approval to submit.

Current local video evidence: `.evals/webmcp-demo/39d1e141-review/atlas-webmcp-proof-cut.mp4` is a 74-second 1280x720 H.264/AAC proof cut with normalized narration, sidecar captions, and a manifest hashing every source frame. It opens on the national trail and uses only real release-proof captures. It is intentionally **not publishable yet**: the ChatGPT picker/call shots are reserved, the authenticated transcript remains uncaptured, and participant audio/visual approval is outstanding.

The strongest thumbnail is the unmodified national-trail capture at `artifacts/webmcp-release-proof/39d1e141-20260902/06-webmcp-trail-desktop.png`. Do not use the historical voxel-city thumbnail.

The full deadline-aware field map, judge story, critical path, and separate owner packets are in `docs/webmcp/DEVPOST_HANDOFF.md`.

## Exact owner sequence

1. ~~Approve creation of the new private GitHub repository and initial push.~~ Complete at `ad0d5ab`.
2. ~~Approve the one-commit private fast-forward to the ChatGPT-first candidate.~~ Complete at `04aa4aaa`.
3. ~~Approve the one-commit private fast-forward to live-E2E candidate.~~ Complete at `049ec222`.
4. ~~Approve the isolated Railway service and deployment while keeping the repository private.~~ Complete at deployment `5ce284dc` from exact candidate `986cf864`.
5. ~~Approve the exact private fast-forward to `39d1e141` and the isolated Railway update, with immediate post-deploy checks and rollback to preserved candidate `986cf864` if any gate fails.~~ Complete at deployment `cd899386`; no rollback needed.
6. ~~Approve the exact private fast-forward from `39d1e141` to presentation candidate `97792d84` without deploying it.~~ Complete; the remote remained private and Railway stayed at `cd899386` until the separately approved Gate 3c deployment.
7. ~~Approve deploying exact private candidate `97792d84` to the existing isolated Railway service, with rollback to prior candidate `39d1e141` if post-deploy gates fail.~~ Complete at deployment `99367264`; all post-deploy gates passed and no rollback was needed.
8. Sign in to the already-open headed ChatGPT window and capture the real built-in-browser five-tool transcript using `docs/CHATGPT_E2E.md`.
9. Provide `XAI_API_KEY` only in the local environment and run the exact `xai:grok-4.6` three-run/90% lane without recording the credential.
10. Review the private tree, confirm Apache-2.0 detection, and explicitly approve public visibility.
11. Replace the proof-cut placeholders with validated ChatGPT footage, approve the final narration, then approve a public YouTube upload.
12. Fill the owner-only submitter/country/learning fields, review the final Devpost record, and explicitly approve submission before September 4 at 1:00 AM Pacific.

Each gate names an exact action, evidence, risk, and rollback. None is implied by local green tests.
