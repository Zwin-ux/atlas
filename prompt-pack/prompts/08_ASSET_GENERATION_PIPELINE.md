# Codex Prompt 08: Set up icon and asset generation pipeline

Create the Atlas asset-generation lane.

Read docs/ASSET_PACK_SPEC.md and docs/PRODUCT_NORTH_STAR.md.

Create:
- assets/prompts/ICON_PROMPTS.md
- assets/prompts/CLAWD_CHARACTER_SHEET_PROMPTS.md
- assets/prompts/VOXEL_TILE_PROMPTS.md
- assets/prompts/UI_PANEL_PROMPTS.md
- assets/generated/manifest.json
- assets/generated/placeholders/svg/atlas-icon.svg
- assets/generated/placeholders/svg/clawd-paw-compass.svg
- assets/generated/placeholders/svg/scout-drop-pin.svg
- assets/generated/placeholders/svg/hosted-clawd-badge.svg
- assets/generated/placeholders/svg/campaign-clipboard.svg

Rules:
- All assets must be original.
- Do not copy OpenAI/Codex/third-party pets.
- Use placeholder SVGs until final art is generated/commissioned.
- Keep visual direction: high-quality voxel/pixel hybrid, dark console UI, emerald/blue/purple glow, Clawd as local scout.

Acceptance:
- placeholder SVGs exist
- prompt files exist
- asset manifest exists
- README explains how to replace placeholders with final art
- BUILD_LOG.md updated
