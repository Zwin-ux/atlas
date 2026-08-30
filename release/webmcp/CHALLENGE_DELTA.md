# Challenge work statement

Atlas existed before the WebMCP Challenge submission period opened on August 25, 2026. The private project records baseline commit `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`. That pre-existing baseline supplied the nationwide Census-backed map renderer, place and county resolution, and normal human navigation.

The challenge edition adds:

- a no-login top-level `/` and `/explore` experience;
- one live `AtlasMapController` shared by human controls and browser tools;
- exact-five imperative `document.modelContext.registerTool` integration;
- bounded state reads and place search;
- visible place opening and session-only map notes;
- an atomic editable research trail with numbered national markers and route;
- an activity record, ambiguity handling, cancellation, and normal-browser fallback;
- deterministic unit, contract, route, and real Chrome WebMCP smoke proof;
- model-eval fixtures projected from the production tool descriptors;
- one live-URL ChatGPT preflight, real-transcript validator, and Grok 4.6 adversarial model lane;
- desktop, mobile, keyboard, and reduced-motion treatment.

The challenge edition intentionally contains no account system, persistence, public posting, payment flow, or sixth tool. It includes only the runtime and evidence needed to reproduce the submitted experience.
