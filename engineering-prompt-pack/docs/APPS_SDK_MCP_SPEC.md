# Apps SDK / MCP Spec

## Architecture

The MCP server owns tools. The widget renders the result.

Tools return:
- structuredContent: concise model-visible state
- content: short narration if needed
- _meta/widget state: UI-only detail, never secrets

## Free Alpha tools

- select_county
- render_voxel_county
- get_free_clawd
- preview_scout_drop
- preview_campaign
- get_upgrade_options

## Paid Beta tools

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
