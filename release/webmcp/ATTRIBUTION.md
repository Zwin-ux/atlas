# Attribution and data boundary

## Geographic data

Atlas uses U.S. Census Bureau geography and place records prepared into three local runtime datasets:

- `data/census/us-county-town-anchors.json` — county identity and bounded place anchors;
- `data/geo-packs/` — county boundary and water geometry;
- `data/atlas-plates/` — simplified national and state plates derived from the county geometry.

The runtime plates identify their source as “US Census Bureau TIGERweb (public domain).” Atlas preserves that attribution in the map. The processed files are provided as factual U.S. government geography for reproducibility; no raw geometry is returned through WebMCP tools.

## Third-party software

Direct packages are installed from the lockfile and keep their own license notices in `node_modules`:

- React and React DOM — MIT;
- `webmcp-types` — MIT;
- TypeScript and `webmcp-evals` — Apache-2.0;
- esbuild and tsx — MIT.

Run `pnpm licenses list --json` after installation to inspect the complete transitive dependency inventory.

The frozen lockfile currently resolves 126 licensed package records: 84 MIT, 23 Apache-2.0, 12 BSD-3-Clause, 5 ISC, 1 BSD-2-Clause, and `json-schema@0.4.0` under its `(AFL-2.1 OR BSD-3-Clause)` choice. This is an inventory, not legal advice; rerun the command whenever the lockfile changes.

## Project license

The Atlas challenge-edition source is licensed under Apache-2.0. The Atlas name and visual identity are not granted as trademarks by that license.
