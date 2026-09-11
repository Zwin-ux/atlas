# Task index

> Generated from `release-graph.json`. Definitions, dependencies and acceptance there remain authoritative. This table is not live execution status.

| Task | Outcome | Role | Prerequisites | Scope / gate |
|---|---|---|---|---|
| AT-001 | Orient to the real checkout and authoritative plan | lead | Start | release |
| AT-002 | Repair stale Grok workflow routing minimally | lead | AT-001 | release |
| AT-003 | Establish reproducible baseline and failure inventory | lead | AT-001 | release |
| AT-004 | Create independent identity fixtures and product test plan | qa | AT-001 | release |
| AT-005 | Prove installed host capabilities in a narrow spike | lead | AT-003 | release |
| AT-006 | Reconcile scope, inline/fullscreen and native UI decisions | lead | AT-001 | release |
| AT-007 | Settle typed result and interaction contracts | lead | AT-003, AT-004, AT-006 | release |
| AT-010 | Correct resolver and geographic-level behavior | data | AT-007, AT-004 | release |
| AT-011 | Correct identity facts, missing values and provenance | data | AT-007, AT-004 | release |
| AT-012 | Fix resource delivery and host bridge compatibility | data | AT-007, AT-005 | release |
| AT-020 | Fix refusal and stale-metadata interpretation | widget | AT-007, AT-004 | release |
| AT-021 | Stabilize requested/displayed state and async lifecycle | widget | AT-020, AT-007 | release |
| AT-022 | Complete compact inline answer | widget | AT-021, AT-006 | release |
| AT-023 | Implement fullscreen transition and restoration | widget | AT-022, AT-012 | release |
| AT-024 | Finish supported feature selection and inspector | widget | AT-021, AT-011, AT-007 | release |
| AT-025 | Connect selection to intentional named follow-up | widget | AT-024, AT-012, AT-007 | release |
| AT-026 | Separate parent geography from back history | widget | AT-024, AT-010, AT-007 | release |
| AT-027 | Complete candidate-choice and refusal interaction | widget | AT-020, AT-010, AT-022 | release |
| AT-028 | Complete keyboard and assistive navigation | widget | AT-023, AT-024, AT-026, AT-027 | release |
| AT-029 | Refine phone layout, targets and cartographic labels | widget | AT-023, AT-024, AT-027 | release |
| AT-030 | Align invocation metadata, state copy and truthful listing | data | AT-010, AT-011, AT-025 | release |
| AT-031 | Harden read-only surface and remove proven risky dead paths | data | AT-012, AT-021 | release |
| AT-032 | Verify clean packaging and CI reproducibility | lead | AT-002, AT-031 | release |
| AT-033 | Verify integrated point-and-ask journey locally | qa | AT-010, AT-011, AT-012, AT-025, AT-026, AT-027 | release |
| AT-034 | Verify visual and accessibility acceptance | qa | AT-028, AT-029, AT-033 | release |
| AT-035 | Measure responsiveness and resource behavior | qa | AT-032, AT-033 | release |
| AT-036 | Finish source-aligned README and reviewer packet | lead | AT-030, AT-032, AT-034, AT-035 | release |
| AT-037 | Independent release-candidate adversarial review | qa | AT-033, AT-034, AT-035, AT-031 | release |
| AT-040 | Freeze clean candidate and rerun required gates | lead | AT-036, AT-037 | release |
| AT-041 | Verify the actual refreshed ChatGPT client | qa | AT-040 | release / actual-chatgpt-access |
| AT-042 | Observe real formative usability sessions | qa | AT-041 | advisory / consenting-participants |
| AT-043 | Issue evidence-backed candidate readiness report | lead | AT-040, AT-041 | release |
| AT-050 | Obtain scoped deployment authorization | release | AT-043 | publish / production-deploy-authorization |
| AT-051 | Deploy authorized candidate and smoke the actual target | release | AT-050 | publish / authorized-deployment-capability |
| AT-052 | Complete authorized portal/domain verification | release | AT-051 | publish / portal-owner-access |
| AT-054 | Recheck ChatGPT against the deployed build | qa | AT-051, AT-041 | publish / actual-chatgpt-access |
| AT-053 | Submit authorized current packet and record outcome | release | AT-052, AT-054 | publish / directory-submission-authorization |

Use `node tools/atlas-plan.mjs task <task-id>` from the kit root for the focused node and its current fingerprint. Use `next` with accepted receipts and actual Git state for scheduling. Do not dispatch all rows at once.
