#!/usr/bin/env node
import { previewCampaignFromScout, previewScoutDrop } from "../packages/core/dist/index.js";

const scout = previewScoutDrop({
  countySlug: "riverside-ca",
  locationLabel: "Eastvale",
  businessType: "mobile detailing",
  goal: "Find the strongest first drop for a local mobile detailing offer.",
  budget: "$250 test budget",
  serviceRadius: "Eastvale first, nearby route only",
});
const campaign = previewCampaignFromScout(scout);
const blockers = [];

requireBoundary(scout.alphaBoundary, "scout", "preview_campaign_engine");
requireBoundary(campaign.alphaBoundary, "campaign", "get_upgrade_options");

if (scout.scene.id !== "voxel-riverside-eastvale-scout-drop") {
  blockers.push(`scout scene id drifted: ${scout.scene.id}`);
}
if (campaign.scene.id !== "voxel-riverside-eastvale-campaign-preview") {
  blockers.push(`campaign scene id drifted: ${campaign.scene.id}`);
}
if (campaign.scoutPreviewId !== scout.id) {
  blockers.push("campaign preview did not preserve scoutPreviewId.");
}
if (scout.scene.flow.at(-1)?.id !== "campaign" || scout.scene.flow.at(-1)?.status !== "next") {
  blockers.push("scout flow must point to campaign as the next step.");
}
if (campaign.scene.flow.at(-1)?.id !== "campaign" || campaign.scene.flow.at(-1)?.status !== "active") {
  blockers.push("campaign flow must make campaign the active step.");
}
if (!scout.nextActions.some((action) => /property managers|QR flyer|Eastvale/i.test(action))) {
  blockers.push("scout next actions do not read like usable local work.");
}
if (campaign.days.length !== 7) {
  blockers.push(`campaign preview expected 7 days, got ${campaign.days.length}.`);
}
if (!campaign.guardrails.some((guardrail) => /no posts|DMs|paid ads/i.test(guardrail))) {
  blockers.push("campaign guardrails must block posts, DMs, and paid ads.");
}

const forbiddenText = JSON.stringify({ scout, campaign });
for (const pattern of [
  /saved to your account/i,
  /XP granted/i,
  /evidence submitted/i,
  /automation started/i,
  /paid ads launched/i,
  /posted successfully/i,
  /messaged/i,
]) {
  if (pattern.test(forbiddenText)) {
    blockers.push(`forbidden Alpha execution claim matched ${pattern}.`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.17e-scout-drop-alpha-loop-boundary",
  scout: {
    id: scout.id,
    sceneId: scout.scene.id,
    selectedNodeId: scout.selectedNodeId,
    nextTool: scout.alphaBoundary.nextTool,
    userActionLabel: scout.alphaBoundary.userActionLabel,
    signalCount: scout.signals.length,
    routeStopCount: scout.route.length,
  },
  campaign: {
    id: campaign.id,
    sceneId: campaign.scene.id,
    scoutPreviewId: campaign.scoutPreviewId,
    nextTool: campaign.alphaBoundary.nextTool,
    userActionLabel: campaign.alphaBoundary.userActionLabel,
    dayCount: campaign.days.length,
    assetCount: campaign.assetPlaceholders.length,
  },
  blockers,
};

if (process.argv.includes("--json-only")) {
  console.log(JSON.stringify(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (!result.ok) {
  process.exit(1);
}

function requireBoundary(boundary, label, nextTool) {
  if (!boundary) {
    blockers.push(`${label}: missing alphaBoundary.`);
    return;
  }
  if (boundary.mode !== "session_only_alpha") blockers.push(`${label}: boundary mode must be session_only_alpha.`);
  if (boundary.savesState !== false) blockers.push(`${label}: must not save state.`);
  if (boundary.executesActions !== false) blockers.push(`${label}: must not execute actions.`);
  if (boundary.grantsXp !== false) blockers.push(`${label}: must not grant XP.`);
  if (boundary.requiresHostedClawdForSave !== true) blockers.push(`${label}: save must require Hosted Clawd.`);
  if (boundary.nextTool !== nextTool) blockers.push(`${label}: expected nextTool ${nextTool}, got ${boundary.nextTool}.`);
  if (!boundary.userActionLabel || boundary.userActionLabel.length < 8) blockers.push(`${label}: missing userActionLabel.`);
}
