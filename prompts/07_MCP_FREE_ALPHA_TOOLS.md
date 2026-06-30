# Prompt 07 — MCP free Alpha tools

Implement Apps SDK/MCP tool layer for Alpha.

Tools:
- select_county
- render_voxel_county
- get_free_clawd
- preview_scout_drop
- preview_campaign
- get_upgrade_options

Use Zod schemas.
Return structuredContent.
Never expose secrets.

Acceptance:
- local harness can call tools
- preview_scout_drop returns VoxelScene + ScoutReport
- preview_campaign returns CampaignPreview
- BUILD_LOG.md updated
