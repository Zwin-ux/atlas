# Atlas County Scout Privacy Policy

Last updated: July 15, 2026

Atlas County Scout is a ChatGPT app for exploring voxel county maps, finding nearby places, and building local planning briefs. The production surface is currently read-only. A moderated public-notes feature may be enabled only in an approved release environment.

## Data Atlas Processes

Atlas processes only the information needed for the requested tool call:

- Atlas-owned county and place ids, business type, goal, and other scoped planning inputs;
- map interactions such as pins and private notes, which remain in the current ChatGPT conversation and are not written to an Atlas account;
- when the moderated public-notes feature is enabled, the public note text, its place id, a pseudonymous author label, moderation status, reactions, reports, and moderation-event records needed to operate that feature; and
- a nearby-place lookup and normalized results when the user requests live place information.

Atlas does not request passwords, API keys, payment-card data, government identifiers, health information, raw chat histories, GPS coordinates, or street addresses.

## How Atlas Uses Data

Atlas uses the scoped inputs to return the requested map, place summary, Scout Drop, or manual campaign plan; keep the service reliable; and prevent abuse.

Atlas does not sell personal data, serve advertisements, build user profiles, or use cross-site tracking.

## Recipients

- OpenAI processes the conversation and tool call as the ChatGPT host.
- When a user requests nearby places, Atlas sends an Atlas-derived area label and radius to Google Maps Platform. Atlas returns normalized Atlas categories and attribution, not raw provider payloads.
- The production hosting provider processes the network request needed to run the service.

Atlas does not send tool inputs to advertisers or data brokers.

## Retention

- Atlas has no public user accounts. Pins, private notes, Scout Drops, and campaign plans are not persisted in an Atlas database.
- When public notes are enabled, Atlas retains public-note and moderation records for the approved retention period so it can display moderated notes, handle reports, enforce removals, and preserve moderation evidence. The approved period and deletion process must be published before public production enablement.
- Nearby-place lookups and normalized results may remain in an in-memory provider cache for up to 24 hours, then expire. The cache is not tied to an account and is cleared when the server process restarts.
- Atlas does not copy conversation content into a separate analytics store. ChatGPT and infrastructure-provider retention follow their own published policies and service settings.

## User Controls

Users can avoid the optional nearby-place lookup, stop using Atlas, and manage or delete the ChatGPT conversation through ChatGPT controls. Because Atlas has no public account database, there is no Atlas profile to delete. If public notes are enabled, the public launch policy will explain how to request removal of a public note or report content.

## Children

Atlas is not directed to children under 13.

## Contact

Privacy questions: mzwin3545@gmail.com
