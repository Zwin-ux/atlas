# Case classes (AT-004-AC3)

None of these kit QA cases are marked passed. `atlas-execution-kit/qa/cases.json`
status remains `SPEC_NOT_RUN` until a resolver/widget/host procedure actually
runs.

| ID | Class | Fixture | Executable now |
|---|---|---|---|
| ID-01 | source observation + later resolver test | Eastvale CA | source check in `fixture-source.test.mjs` |
| ID-02 | source observation | California is not a county slug | documented; resolver later |
| ID-05 | source observation | Springfield in ≥2 counties | source check |
| ID-06 | source observation | case/punctuation variants of ID-01 | documented |
| ID-07 | source observation | Cañon City / Canon City | source check |
| ID-08 | source observation | Kane IL town vs Kane County | source check |
| ID-09 | synthetic | Zzyzxqqq | not in Census file by construction |
| ID-10 | source observation | London UK / Paris FR must not become a US substitute | source check |
| ID-11 | source observation | Española in two NM counties | source check |
| NULL-01 | source observation | missing population is not zero | source check |
| GEO-01 | source observation | Kalawao HI sparse island county | source check |
| COUNTY-01 | source observation | Riverside County CA | source check |

Human-host procedures (real ChatGPT): see `atlas-execution-kit/qa/REAL_HOST_CHECKLIST.md`. Not run.
