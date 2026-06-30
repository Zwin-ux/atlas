# Codex Prompt 05: Build Apps SDK/MCP Alpha tools

Build the MCP tool layer for the free Atlas demo.

Implement tools:
- select_county
- ask_county
- render_voxel_county
- get_free_clawd
- preview_scout_drop
- preview_campaign
- get_upgrade_options

Use Zod schemas. Return structuredContent for model-visible data. Return widget state separately as appropriate. Do not expose secrets. Do not add auth or Stripe.

Acceptance:
- tools can be called from a local harness
- render_voxel_county returns VoxelMapState
- preview_scout_drop returns Eastvale/mobile detailing scout preview
- preview_campaign returns campaign preview
- BUILD_LOG.md updated
