# Official WebMCP and ChatGPT Compatibility Record

This record pins Atlas's browser-tool implementation to reviewed primary sources. It is an engineering audit, not a claim that a local Chrome run proves acceptance in ChatGPT.

## Reference snapshot

- WebMCP proposal repository: [`webmachinelearning/webmcp`](https://github.com/webmachinelearning/webmcp)
- Reviewed commit: [`41d12f057167ccf5954dbcf49d99502cb6c84491`](https://github.com/webmachinelearning/webmcp/commit/41d12f057167ccf5954dbcf49d99502cb6c84491), dated August 26, 2026
- ChatGPT Site Tools documentation: [OpenAI Site Tools](https://learn.chatgpt.com/docs/webmcp), reviewed August 31, 2026
- Type surface: `webmcp-types@0.1.5`, pinned in `package.json` and the lockfile; it was the current npm release during this review

The upstream source was inspected from a shallow disposable clone. Atlas does not vendor or execute that repository. A future review must update this record only after comparing a new upstream commit and rerunning the complete Atlas gates.

## Architecture decision

Atlas uses page-native WebMCP because the value is shared visible state: a person and ChatGPT inspect and change the same open map. A remote MCP server can operate without the page, but it would create a second mutation path and would not by itself prove that the visible Atlas canvas changed.

For the challenge route, do not add a remote `/mcp` mutation path. The exact five page tools remain the public interface, and every human or agent write continues through `AtlasMapController`.

## Contract mapping

| Current primary-source contract | Atlas implementation | Executable proof |
|---|---|---|
| Feature-detect `document.modelContext.registerTool` | `mountAtlasWebMcp()` checks the function before registration and preserves normal map controls when absent. | `pnpm verify:webmcp`; browser fallback smoke |
| Register imperatively in the top-level page for ChatGPT | `ChallengeAtlas` mounts the registry only on `/` and `/explore`; `window.top === window` rejects iframe registration. | registry/static verifier plus exact-five Chrome discovery |
| Keep names valid, descriptions non-empty, and inputs JSON-serializable | Five descriptors use valid stable names, direct side-effect language, bounded object schemas, and `additionalProperties: false`. | descriptor compatibility test |
| Use `readOnlyHint` only for non-mutating tools | `get_map_state` and `search_places` are read-only; the three visible write tools are not. | exact annotation test and trajectory evals |
| Mark author-untrusted output with `untrustedContentHint` | State reads containing session text and both note/trail writes are marked untrusted; Census-only search and open results are not. | exact annotation test |
| Use a registration `AbortSignal` for tool lifetime | All five registrations share one lifecycle controller; partial registration failure aborts the set. Normal teardown rejection is ignored rather than shown as a false failure. | registry lifecycle and cleanup-race tests |
| Accept the execution `AbortSignal` | Search, open, note, and trail operations forward the browser signal into the shared controller and resolver. | signal-propagation and atomic-cancellation tests |
| Return enough bounded data to verify the result | Writes report visible/unchanged state, revision, and a compact view summary; outputs exclude geometry and stay below 1,500 serialized characters. | descriptor output-budget and browser-visible-revision tests |
| Preserve the normal human interface | Search, navigation, notes, trail editing, markers, keyboard use, and fallback remain available without Site Tools. | desktop, `390x844`, keyboard, reduced-motion, and fallback smoke |

## ChatGPT acceptance boundary

OpenAI documents Site Tools in the ChatGPT desktop app's built-in browser for ChatGPT Work and Codex, subject to app version, model, workspace, and rollout. The current documented model boundary is GPT-5.6 Sol or GPT-5.6 Terra; GPT-5.6 Luna has Site Tools disabled. Enterprise and Edu workspaces are currently excluded.

ChatGPT currently supports a subset of the broader proposal. Atlas stays inside that subset:

- JavaScript imperative registration, not declarative form tools;
- the top-level document, not same-origin or cross-origin iframe discovery;
- page-owned tools that disappear when the page closes or navigates away;
- browser safety review and normal confirmation policy for each invocation.

Local tests can prove descriptors, lifecycle, browser execution, visible completion, fallback, and mutation safety. Only a captured ChatGPT desktop session can prove actual Site Tools discovery and conversation behavior. `docs/webmcp/CHATGPT_ACCEPTANCE.md` and `pnpm e2e:chatgpt:session` define that separate evidence gate.

## Review disposition

The exact-five product cut remains correct. No sixth tool, declarative form layer, iframe bridge, skill manifest, or remote MCP server was added.

One implementation issue was found and fixed: a normal registration-signal abort could reject an in-flight `registerTool()` promise and falsely set Atlas to `Site tools offline`. The registry now distinguishes lifecycle teardown from a real registration failure, with a remount regression test.

Open questions in the upstream proposal, including output schemas, native-agent exposure keywords, streaming, progress, and higher-level skills integration, are intentionally not preimplemented. They are not required for the documented ChatGPT subset and would add speculative surface to the submission.
