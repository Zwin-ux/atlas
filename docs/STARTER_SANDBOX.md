# Temporary Apps SDK Starter Sandbox

The root `server/` and `web/` folders are a temporary Apps SDK sandbox created before Quest E1.

They are useful for proving the local `/mcp` loop and widget preview, but they are not the final Atlas monorepo shape.

Quest E1 creates the intended workspace skeleton:

- `apps/widget`
- `apps/web`
- `packages/core`
- `packages/geo`
- `packages/mcp`
- `packages/config`
- `packages/assets`

Future quests should move or replace the starter sandbox deliberately instead of letting two app architectures drift.

Do not build new product logic in the temporary sandbox unless the quest explicitly says to.
