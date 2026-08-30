# Atlas WebMCP release loop

Atlas uses a bounded version of Geoffrey Huntley's [Ralph technique](https://ghuntley.com/ralph/): one priority per loop, durable context reloaded every time, and fast verification as backpressure.

This is an existing, release-sensitive codebase, so Atlas intentionally does not adopt Ralph's destructive or unattended Git examples. The loop may inspect, implement, test, document, and commit coherent local work. It must stop at credentials and owner gates.

## Loop inputs

Read these at the start of every iteration:

1. `AGENTS.override.md`
2. `WEBMCP_STATE.md`
3. `CHALLENGE_DELTA.md`
4. `docs/webmcp/RELEASE_PACKET.md`
5. the latest `.evals/chatgpt-e2e/report.json`, when present

Search before assuming a capability is absent. Do not reopen a green slice unless current evidence contradicts the ledger.

## One-item loop

1. Select the highest-priority unblocked item in `WEBMCP_STATE.md`.
2. State one visible outcome and its smallest complete boundary.
3. Implement only that boundary.
4. Run the narrow test first, then the applicable release gate.
5. Review the result against the exact-five tool cut, shared-controller rule, visible completion, ambiguity safety, mobile behavior, and public-release boundaries.
6. Fix valid findings, rerun the affected gate, and record the evidence.
7. Commit only coherent green work, update the ledger, then begin the next item.

The loop never treats a recap as completion.

## Backpressure

Use the cheapest relevant gate first:

- Tool, controller, schema, or documentation change: `pnpm verify:webmcp`
- TypeScript contract change: `pnpm typecheck`
- Runtime or deployment change: `pnpm build`
- Browser/WebMCP behavior: `pnpm eval:webmcp:smoke`
- Public ChatGPT path: set `ATLAS_CHATGPT_URL`, then run `pnpm e2e:chatgpt`
- Sanitized repository change: repeat the same gates there, then run `pnpm audit:release`

`ok: true` from `pnpm e2e:chatgpt` means the automated HTTPS and Chrome protocol stages passed. Only `releaseReady: true` means the real ChatGPT transcript and model threshold are also present.

## Remaining release priority

1. Keep the deployed HTTPS route and exact-five protocol proof green.
2. Capture and validate the real ChatGPT built-in-browser transcript.
3. Run the three-pass Grok 4.6 adversarial suite when `XAI_API_KEY` is available.
4. Replace only evidence-backed public-source and video placeholders.
5. Request the public-repository owner gate with the exact candidate SHA and rollback.
6. Record the narrated video from the verified flow.
7. Request the Devpost submission gate only after every public link works.

If one item is credential-gated or owner-gated, record the gate and continue the next independent item. Stop only when every remaining item is gated or complete.

## Hard stops

The loop must not:

- add a sixth WebMCP tool;
- create a second remote state path for ChatGPT;
- reset, clean, force-push, rewrite history, or discard user changes;
- use `git add -A` in a dirty worktree;
- push, tag, publish, change visibility, configure secrets, or submit automatically;
- weaken a test or acceptance condition to turn a report green;
- claim real ChatGPT or model evidence from deterministic Chrome proof.

## Continuation prompt

```text
Continue from WEBMCP_STATE.md using one bounded Ralph iteration.

Choose the highest-priority unblocked release item. Search before assuming it is missing. Implement one smallest complete boundary, apply the narrowest backpressure first, run the applicable release gates, review the result, update the durable ledger, and commit only coherent green work.

Preserve exactly five page-native WebMCP tools and one shared visible map controller. Do not auto-push, publish, configure credentials, change visibility, or submit. If the top item is gated, record it and continue the next independent item. Stop only when all remaining work is proven complete or explicitly gated.
```
