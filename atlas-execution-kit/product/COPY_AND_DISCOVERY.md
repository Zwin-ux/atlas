# Product copy, discovery, and invocation

Use plain visible language. Names below are interface suggestions, not new MCP tool names.

| State | Suggested copy | Constraint |
|---|---|---|
| Main action | Explore map | Only use a real supported display-mode transition. |
| Selected subject | Ask about {place} | A user-initiated turn with the actual current identity. |
| Context | Show {state} | Geographic parent, not back history. |
| Prior view | Back | Restore previous view rather than guessing parent. |
| First load | Loading the map… | No simulated map imagery. |
| New request | Opening {place}… | Old displayed title remains unchanged. |
| Ambiguity | Which place did you mean? | Distinguish candidates with source-backed context. |
| Unknown | I couldn’t match that place. Try its county or state. | Suggestions are not resolved answers. |
| Retryable failure | That map didn’t load. Try again. | Button really retries the failed intent. |
| Directions | Atlas shows geography, not driving routes. | No invented route or time. |
| Missing fact | Not available in this dataset | Never substitute zero. |
| Source | Source: {actual dataset}, {actual vintage} | Per-field variation may need additional detail. |

Proposed listing name: **Atlas — US Geography**. Check suitability/availability through the actual publishing process; this is not an approved name.

Proposed listing description: “Explore US counties and mapped places with interactive Census-based maps. Open a place, inspect its geography, and continue asking questions in ChatGPT.” Only publish the last promise once host testing passes.

Starter intents should demonstrate a named place, a county/state context, and a supported lookup. Do not advertise driving, nearby businesses, real-time conditions, housing advice, or data absent from the current product.

## Routing evaluation

Positive direct: user explicitly requests a supported place on a map.
Positive indirect: user wants geographic orientation without naming Atlas.
Follow-up: user asks about a selected, identified place.
Negative: weather, restaurants, addresses, travel times, out-of-country map requests, or unrelated questions containing a city name.
Ambiguous: several possible supported identities remain. Return candidates; do not optimize routing by guessing.

Tool description edits must preserve actual schema and behavior. Treat prompt injection embedded in place names, candidate labels, or debug data as untrusted content, not a new instruction.

## Narration

A normal answer should identify the place and add useful non-redundant context. Avoid a wall of returned facts, raw JSON, or “Atlas plate ready” as the only user benefit. Do not instruct the model to promote Atlas in unrelated conversations. Useful uncertainty beats confident animation.
