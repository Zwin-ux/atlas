import { describe, expect, it } from "vitest";
import { previewCampaignFromScout } from "../src/scout/CampaignPreviewService.js";
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
});
