# Atlas Apps SDK / MCP Tool Contracts

## Exposed Alpha tools

The current MCP server exposes only the tools below. Future county-question, free
Clawd state, and saved Hosted Clawd tools remain out of scope until their service
layers exist.

### render_voxel_county
Use when the user wants to see the voxel map.

Inputs:
- countySlug
- selectedNodeId optional

Model-visible output:
- compact scene summary
- selected node id
- route node ids
- flow state

Widget-only `_meta`:
- full `VoxelScene`

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

Apps SDK shape:
- `structuredContent` stays concise and excludes the full renderer scene.
- `_meta.scoutPreview` carries the widget-only scene and report panel data.

### preview_campaign_engine
Use when user wants a basic campaign preview from a scout report.

Inputs:
- scoutPreviewId from `preview_scout_drop`
- countySlug optional
- nodeId or locationLabel optional
- businessType optional
- goal optional
- budget optional
- serviceRadius optional

Output:
- campaign preview
- 7-day plan preview
- asset previews
- route priorities
- manual guardrails

### get_upgrade_options
Use when user asks about hosting Clawd or hits persistence/action limits.

Inputs:
- trigger optional

Output:
- free Alpha limits
- planned Hosted Clawd Beta capabilities
- unavailable Alpha actions
- next step

## Future paid/hosted tools

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
- Alpha tools do not auto-post, auto-DM, execute advertising, create accounts, run checkout, or persist campaigns.
- Paid tools must check plan server-side.
- Free tools must not pretend temporary state is permanent.
