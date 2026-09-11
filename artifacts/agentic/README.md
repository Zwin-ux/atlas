# Agentic run artifacts

Each control-loop packet should leave:

```text
artifacts/agentic/<packet-id>/RESULT.md
```

See `docs/AGENTIC_WORKFLOW.md`. Workflows write scratch reports during the run;
the archive step copies into this tree when the builder succeeds.
