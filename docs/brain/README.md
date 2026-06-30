# Atlas Brain

This folder is the project-local brain for Atlas product and renderer thinking.

Use it before major map work. The goal is to keep learning, critique, references,
and implementation direction in one durable place instead of scattering it across
chat turns.

## Current Brain Files

- `VOXEL_ENVIRONMENT_COURSE.md` - study notes and execution rules for rebuilding
  the Atlas map as a high-quality full-screen voxel city map.
- `USA_ENGINE_THINKING.md` - current product/engineering brain for growing Atlas
  from the Riverside/Eastvale proof into a USA-scale world engine.
- `SPRITE_ATLAS_READINESS.md` - E7.2 brain for moving the Pixi city renderer from
  code-generated primitives toward manifest-driven tile and sprite art while
  preserving primitive fallback.
- `../PRODUCTION_EVOLUTION_GATES.md` - maturity and human-approval gates for
  promoting Atlas work from mock to curated Alpha to live read-only to persisted
  production.
- `../agent-prompts/ATLAS_EXECUTION_PROMPTS.md` - durable execution prompts for
  E7.2 audit, E7.3 browser QA, E7.4 sprite proof, E8.5 tool hardening, E8.6
  county question slice, and E9 Hosted Clawd planning.

## Working Rule

Before the next voxel-map implementation pass, read:

1. `docs/brain/VOXEL_ENVIRONMENT_COURSE.md`
2. `docs/brain/USA_ENGINE_THINKING.md`
3. `docs/brain/SPRITE_ATLAS_READINESS.md`
4. `docs/VOXEL_MAP_SPEC.md`
5. `docs/VOXEL_RENDERER_SPEC.md`
6. `docs/NEXT_QUESTS.md`
7. `docs/PRODUCTION_EVOLUTION_GATES.md`

Then state the target user experience, current and target maturity level,
anti-scope, human approval gate, and QA gates before editing.
