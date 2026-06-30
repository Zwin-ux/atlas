# Codex Prompt 03: Create county data pack schema and Riverside demo pack

Build the curated county pack layer.

Read docs/DATA_PACK_SPEC.md, docs/SCOUT_DROP_SPEC.md, docs/VOXEL_MAP_SPEC.md.

Implement:
- Zod schema for county packs
- TypeScript types
- loader function
- validation function
- Riverside demo pack at data/county_packs/riverside-ca.json

The Riverside demo pack should include Eastvale, Corona, Norco, Riverside, Moreno Valley, Jurupa Valley, Temecula/Murrieta comparison node, Ontario/Rancho comparison node, and service-business signal nodes.

Do not claim live data. Label as curated Alpha demo pack.

Acceptance:
- county pack loads
- schema validates
- demo data available to widget/tools
- one small validation test is allowed
- BUILD_LOG.md updated
- NEXT_QUESTS.md moves to Quest A3
