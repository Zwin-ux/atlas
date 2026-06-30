# Apps SDK / MCP Spec

## Architecture

The MCP server owns tools. The widget renders the result.

Tools return:
- structuredContent: concise model-visible state
- content: short narration if needed
- _meta/widget state: UI-only detail, never secrets

## Exposed Alpha tools

- select_county
- ask_county_question
- render_voxel_county
- lookup_world_places
- preview_scout_drop
- preview_campaign_engine
- get_upgrade_options

These tools are read-only and non-destructive. `lookup_world_places` is
open-world because it can use Google Maps Platform when configured; the other
Alpha tools are closed-world curated/demo flows. `select_county` compiles the
Riverside `VoxelScene` from the curated county pack and sends the full scene to
the widget through `_meta.scene`. `ask_county_question` answers only from curated
Riverside pack facts and narrows unsupported counties or business lanes. Alpha tools do not persist
campaign state, save evidence, grant XP, create accounts, run checkout, post,
message, buy ads, or execute campaigns.

## Future paid Beta tools

- host_clawd
- get_hosted_clawd_state
- create_business_profile
- drop_scout
- save_campaign
- create_campaign_quests
- submit_campaign_evidence
- verify_campaign_progress
- export_campaign

## Widget

The widget should be separate from server logic:
- apps/widget
- packages/mcp
- packages/core

## Auth

Anonymous/free tools should work without account.
Hosted/persistent tools require OAuth/account linking in Beta.
