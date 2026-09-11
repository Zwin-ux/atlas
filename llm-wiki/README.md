# Atlas LLM wiki

Karpathy-style compiled knowledge base for Atlas. Wiki root is this folder,
not the repo root.

Session start: read `CLAUDE.md` then `wiki/index.md`.

```powershell
python llm-wiki/scripts/lint_wiki.py llm-wiki
python llm-wiki/scripts/audit_review.py llm-wiki --open
```

Grok workflow: `/atlas-llm-wiki-setup` with optional `mode` =
`setup` | `ingest` | `compile` | `lint` | `full`.
