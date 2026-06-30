# Decisions

## Decision 001: Mock-first

Build against curated Riverside data and MockGeoDataAdapter before real Google APIs.

## Decision 002: PixiJS first renderer

Use PixiJS for Alpha if clean. Use SVG/Canvas fallback if it slows the build.

## Decision 003: Google Maps is signal input, not visual identity

Google data helps resolve places and counts. Atlas renders its own voxel world.

## Decision 004: Apps SDK tools stay focused

Free Alpha tools are only county, Clawd, Scout Drop, campaign preview, upgrade prompt.

## Decision 005: Hosted Clawd is Beta

Do not build payments/auth until the Eastvale demo works.
