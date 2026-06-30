# Apps SDK / MCP Spec

## Architecture

The MCP server owns tools. The widget renders the result.

Tools return:
- structuredContent: concise model-visible state
- content: short narration if needed
- _meta/widget state: UI-only detail, never secrets

## Exposed Alpha tools

- render_voxel_county
- preview_scout_drop
- preview_campaign_engine
- get_upgrade_options

These tools are read-only, non-destructive, and closed-world. They compute
temporary Alpha previews from curated Riverside data and do not persist campaign
state, create accounts, run checkout, post, message, buy ads, or claim live
market research.

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
