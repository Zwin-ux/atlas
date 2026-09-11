# Atlas release fixtures

Expected identities are read from `data/census/us-county-town-anchors.json`
fields (`countyName`, `stateCode`, `anchors[].label`, coordinates, population).
They are **not** produced by `createGazetteer().resolve`.

QA cases in `atlas-execution-kit/qa/cases.json` stay `SPEC_NOT_RUN` until a
resolver/widget test actually executes against these fixtures.

Source year: 2024 Census subcounty estimates, as recorded in the JSON.
