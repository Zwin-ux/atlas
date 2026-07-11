import { describe, expect, it } from "vitest";
import { previewCampaignFromScout, previewCampaignFromScoutRequest } from "../src/scout/CampaignPreviewService.js";
import { previewScoutDrop } from "../src/scout/ScoutDropService.js";

describe("CampaignPreviewService", () => {
  it("builds a manual seven-day campaign preview from an existing Scout Drop", () => {
    const scoutPreview = previewScoutDrop({
      countySlug: "riverside-ca",
      nodeId: "eastvale",
      businessType: "mobile detailing",
    });
    const campaignPreview = previewCampaignFromScout(scoutPreview);

    expect(campaignPreview.type).toBe("campaignPreview");
    expect(campaignPreview.scoutPreviewId).toBe(scoutPreview.id);
    expect(campaignPreview.days).toHaveLength(7);
    expect(campaignPreview.assetPlaceholders.map((asset) => asset.format)).toContain("qr_flyer");
    expect(campaignPreview.guardrails.join(" ")).toMatch(/no posts, DMs, paid ads/i);
    expect(scoutPreview.alphaBoundary).toMatchObject({
      mode: "session_only_alpha",
      savesState: false,
      executesActions: false,
      grantsXp: false,
      requiresHostedClawdForSave: true,
      nextTool: "preview_campaign_engine",
    });
    expect(campaignPreview.alphaBoundary).toMatchObject({
      mode: "session_only_alpha",
      savesState: false,
      executesActions: false,
      grantsXp: false,
      requiresHostedClawdForSave: true,
      nextTool: "get_upgrade_options",
    });
    expect(campaignPreview.scene.panel.type).toBe("campaign_preview");
    expect(campaignPreview.scene.flow.at(-1)?.status).toBe("active");
  });

  it("rebuilds a campaign from supplied Scout args when the Scout id is stale", () => {
    const { campaignPreview, rebuiltScoutPreview } = previewCampaignFromScoutRequest({
      scoutPreviewId: "scout-stale-id",
      countySlug: "orange-ca",
      locationLabel: "Anaheim Stadium",
      businessType: "roofing",
      goal: "Find a manual first route for a roofing inspection offer.",
    });

    expect(rebuiltScoutPreview).toBe(true);
    expect(campaignPreview.continuityNote).toBe("rebuilt scout preview");
    expect(campaignPreview.type).toBe("campaignPreview");
    expect(campaignPreview.summary).toContain("Anaheim Stadium");
    expect(campaignPreview.summary).toContain("Orange County");
    expect(campaignPreview.businessType).toBe("roofing");
  });

  it("uses requested place, county, and business copy instead of Eastvale demo copy", () => {
    const scoutPreview = previewScoutDrop({
      countySlug: "orange-ca",
      locationLabel: "Anaheim Stadium",
      businessType: "roofing",
      goal: "Find a manual first route for a roofing inspection offer.",
    });
    const campaignPreview = previewCampaignFromScout(scoutPreview);
    const scoutCopy = [
      scoutPreview.summary,
      scoutPreview.bestOffer,
      ...scoutPreview.signals.map((signal) => `${signal.label} ${signal.detail}`),
      ...scoutPreview.route.map((stop) => `${stop.label} ${stop.reason}`),
      ...scoutPreview.nextActions,
      ...scoutPreview.limitations,
    ].join(" ");
    const campaignCopy = [
      campaignPreview.summary,
      campaignPreview.offer,
      ...campaignPreview.days.flatMap((day) => [day.focus, ...day.steps]),
      ...campaignPreview.assetPlaceholders.map((asset) => `${asset.label} ${asset.copyIntent}`),
    ].join(" ");

    expect(scoutPreview.countySlug).toBe("orange-ca");
    expect(scoutPreview.scene.county.name).toBe("Orange County");
    expect(scoutCopy).toContain("Anaheim Stadium");
    expect(scoutCopy).toContain("Orange County");
    expect(scoutCopy).toContain("roofing");
    expect(scoutCopy).not.toMatch(/\bEastvale\b/);
    expect(campaignCopy).toContain("Anaheim Stadium");
    expect(campaignCopy).toContain("Orange County");
    expect(campaignCopy).toContain("roofing");
    expect(campaignCopy).not.toMatch(/\bEastvale\b/);
  });
});
