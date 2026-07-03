# Post-Alpha 0.31E - Server Scene Packet Cache Contract

## Player Promise

Atlas can later make county scenes feel instant without changing the public
Alpha loop or pretending provider lookup is playable coverage.

## Engineering Promise

`@atlas/core` now owns the scene packet cache contract future backend work must
obey:

- deterministic packet keys from county, district, camera, viewport, schema,
  and update id;
- readiness-specific runtime cache policies;
- packet payload boundaries that keep large scene data out of
  `structuredContent`;
- future generation states that stay blocked until DB/provider gates reopen;
- safety checks for persistence, provider geometry, live provider use, shell
  metadata, and hidden drafts.

## Boundaries

- Riverside/Eastvale is the only public playable packet shape.
- Orange and other shell counties remain public metadata only.
- Anaheim/Ontario hidden drafts remain non-public and non-playable.
- Provider-normalized and background generation modes are named future states,
  not enabled behavior.

## Verification

- `pnpm --dir packages/core test -- scene-packet-cache`
- `pnpm build:core`
- `node scripts\verify-scene-packet-cache-contract.mjs --json-only`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

## Next

`0.32E Runtime Scene Packet Memory Adapter`: wire the contract into server
runtime memory without DB persistence, live providers, package/env drift, or new
public playability.
