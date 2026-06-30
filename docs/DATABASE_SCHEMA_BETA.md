# Atlas Beta Database Schema

Alpha can work without DB or with local JSON.

Beta needs persistence.

## Tables

users
clawds
business_profiles
county_packs
scout_sessions
scout_signals
campaigns
campaign_assets
quests
evidence
xp_events
subscriptions
usage_events
app_events

## Key invariant

Free Clawd is session/demo state.
Hosted Clawd is persistent account state.

Demo XP and real XP must not mix.
