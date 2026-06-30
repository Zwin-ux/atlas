# Atlas Apps SDK / MCP Tool Contracts

## Free-compatible tools

### select_county
Use when the user wants to select a county/city region.

Inputs:
- countySlug
- state optional

Output:
- county profile
- available layers
- available demo business templates

### ask_county
Use when the user asks a basic county/local business data question.

Inputs:
- countySlug
- question
- businessType optional

Output:
- answer
- caveats
- source notes
- recommended map layer

### render_voxel_county
Use when the user wants to see the voxel map.

Inputs:
- countySlug
- selectedLayer optional
- highlightedNodeIds optional

Output:
- VoxelMapState

### get_free_clawd
Use when the free user needs a temporary companion state.

Inputs:
- sessionId optional
- preferredStyle optional

Output:
- ClawdCompanionState

### preview_scout_drop
Use when free user drops Clawd into a location.

Inputs:
- countySlug
- nodeId or locationLabel
- businessType
- goal

Output:
- ScoutPreviewState
- signals
- route
- limitations
- upgrade prompt if relevant

### preview_campaign
Use when user wants a basic campaign preview from a scout report.

Inputs:
- scoutSessionId or scoutPreview object
- businessType
- campaignGoal

Output:
- campaign preview
- 7-day plan preview
- asset previews
- quest previews

### get_upgrade_options
Use when user asks about hosting Clawd or hits persistence/action limits.

Inputs:
- trigger optional

Output:
- free vs hosted comparison
- checkout URL placeholder or real URL in Beta

## Paid/hosted tools

### host_clawd
Creates or activates Hosted Clawd Daemon.

### get_hosted_clawd_state
Loads persistent Clawd state.

### create_business_profile
Saves business context.

### drop_scout
Creates saved Scout Drop.

### generate_local_campaign
Creates full campaign from scout report.

### save_campaign
Persists campaign.

### create_campaign_quests
Turns campaign into quests.

### submit_campaign_evidence
Submits proof of campaign work.

### verify_campaign_progress
Verifies evidence and grants XP.

### export_campaign
Exports campaign to Markdown/PDF/CSV.

## Tool design rules

- Tools should return concise structuredContent.
- Widget-only display data goes into metadata/state, but never secrets.
- No tool should auto-post, auto-DM, or execute advertising without explicit user confirmation.
- Paid tools must check plan server-side.
- Free tools must not pretend temporary state is permanent.
