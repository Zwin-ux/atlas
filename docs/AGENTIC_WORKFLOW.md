# Atlas Agentic Workflow

**Purpose:** make every agent (Grok, Codex, Fable, human-driven) work like a high-reliability crew — control-first, evidence-gated, narrow packets, no vibe merges.

**Authority:** Complements `AGENTS.md`, `docs/NORTH_FACE.md`, `docs/USA_ACCURACY_PROGRAM.md`, `docs/USA_ACCURACY_CONTROL_ENV.md`. If product law conflicts, North Face wins for ship surface; this file wins for *how agents work*.

---

## 1. The contract (read this before any multi-step work)

| Rule | Meaning |
|------|---------|
| **Control before ChatGPT** | Prove on `127.0.0.1:8787` + verifiers before claiming Pro-plugin success. |
| **Evidence or it didn’t happen** | Every “done” cites a command, artifact path, or screenshot. Estimates are not proof. |
| **Kill criteria first** | Write what failure looks like *before* coding. Revert is cheap; thrash is expensive. |
| **One packet, one axis** | Name the NS / program packet (A2, population, control). No kitchen-sink PRs. |
| **Fail closed** | Missing evidence = not verified. Optional taste panels may fail open. |
| **No SaaS slop** | Product taste from AGENTS.md. Voxel/plate identity over generic dashboards. |
| **Honesty** | Census / generated / Google / community layers never blur. |

---

## 2. Environments

```
CONTROL (local)          ACCEPTANCE (human)
─────────────────        ──────────────────
pnpm dev :8787           ChatGPT Pro → Atlas (prod)
verify:*-control         ChatGPT Pro → Atlas Staging
/preview /emulator       A4 dogfood rounds
artifacts/usa-accuracy/  G8 findings doc
```

| Env | Use for | Do not use for |
|-----|---------|----------------|
| **Control** | Every code change, population work, seats, focus | Claiming ChatGPT-fixed without deploy |
| **Atlas plugin** | A4 after deploy | Day-to-day iteration |
| **Atlas Staging** | Commons / notes only | Map accuracy truth |

---

## 3. Standard loop (any feature)

```text
1. Name packet + kill criteria + which verifier will green
2. Read control docs + relevant code (no coding from memory)
3. Implement smallest change that moves the packet
4. pnpm build:web / build:server as needed
5. Restart control server if server changed
6. pnpm verify:usa-accuracy-control  (or A1/A3)
7. Eyes-on 2–3 preview URLs if visual
8. Write artifact: artifacts/agentic/<packet>/RESULT.md
9. Only then: deploy → A4 Pro dogfood
```

### Commands (control)

```powershell
cd C:\Users\mzwin\Documents\Atlas
pnpm build:web
pnpm build:server
# Terminal A
$env:PORT="8787"; node server/dist/index.js
# Terminal B
pnpm verify:usa-accuracy-control
pnpm verify:usa-accuracy-a1
pnpm verify:usa-accuracy-a3
```

### Eyes-on URLs

- `http://127.0.0.1:8787/preview?county=miami-dade-fl`
- `http://127.0.0.1:8787/preview?county=miami-dade-fl&focusLon=-80.4472&focusLat=25.4664&focusName=Homestead`
- `http://127.0.0.1:8787/preview?county=loving-tx`
- `http://127.0.0.1:8787/emulator?county=cook-il`

---

## 4. Registered workflows (Grok Build)

Project path: `.grok/workflows/`

| Workflow | When to run | Agents (order) |
|----------|-------------|----------------|
| **`atlas-control-loop`** | Default for map/accuracy/population work | Scout → Implement → Verify (adversarial) → Report |
| **`atlas-map-quality`** | Taste pass on 2D plates (r/place density, hierarchy) | Parallel critics → synthesizer |
| **`atlas-ship-gate`** | Before deploy / Pro dogfood | Gates (control, tools, honesty) fail closed |

### How to run

```text
/workflow atlas-control-loop
  args: { "goal": "populate county plates with denser Census places", "mode": "implement" }

/workflow atlas-map-quality
  args: { "counties": "miami-dade-fl,loving-tx,honolulu-hi" }

/workflow atlas-ship-gate
  args: { "target": "prod" }
```

Or from the agent tool: `workflow` with `name: "atlas-control-loop"` and `args`.

Watch runs in `/workflows`. Budget defaults are conservative; raise `agent_budget` only if a panel is rejected.

---

## 5. Agent roles (mental model)

| Role | Capability | Job |
|------|------------|-----|
| **Scout** | read-only | Map code, name root cause, list files, propose kill criteria |
| **Builder** | read-write / execute | Implement one packet; run builds |
| **Verifier** | read-only or execute | Re-run gates; try to *disprove* “green” |
| **Taste** | read-only | Visual/product judgment; never claims ship alone |
| **Captain** | orchestrator (you) | Sequence packets; refuse scope thrash |

Prompts to subagents must: **command tool use**, require **file paths**, and define **valid empty** (“no issues only after reading X”).

---

## 6. Packet taxonomy (current product)

| Track | Packets | Success signal |
|-------|---------|----------------|
| Accuracy A | A1 focus, A2 seats, A3 50-county | verifiers green |
| Control | control env + emulator on `open_atlas_map` | CONTROL GREEN |
| Population | denser anchors, settlement cells, r/place fabric | more real places visible; control green |
| Ship | deploy + A4 Pro | G8 notes dated |
| Parked | Clawd, national clay default, Mapbox primary | do not open |

---

## 7. Anti-patterns

- Coding against ChatGPT memory of prod without control green  
- “Looks fine” without `verify:usa-accuracy-control`  
- Reopening Clawd/scout as hero while map population is empty  
- Bulk Google geometry bake  
- Parallel agents editing the same file without worktrees  
- Claiming A4 done from emulator alone  

---

## 8. Result artifact template

Write `artifacts/agentic/<packet-id>/RESULT.md`:

```markdown
# Packet: <id>
Goal: …
Kill criteria: …
Commands run: …
Evidence paths: …
Control: GREEN | RED
Known remaining: …
Next packet: …
```

---

## 9. Changelog

| Date | Note |
|------|------|
| 2026-07-30 | Agentic harness created: doctrine + three Grok workflows + control-first loop. |
