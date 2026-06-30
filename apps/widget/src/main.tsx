import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { previewCampaignFromScout, previewScoutDrop } from "@atlas/core/scout";
import type { VoxelFlowStep } from "@atlas/core/voxel";
import { VoxelSceneView } from "./VoxelSceneView";
import "./styles.css";

const defaultScoutPreview = previewScoutDrop({
  countySlug: "riverside-ca",
  nodeId: "eastvale",
  businessType: "mobile detailing",
});

function WidgetShell() {
  const [scene, setScene] = useState(defaultScoutPreview.scene);
  const [selectedNodeId, setSelectedNodeId] = useState(defaultScoutPreview.selectedNodeId);
  const [activeStepId, setActiveStepId] = useState<VoxelFlowStep["id"]>("county");
  const selectedNode = useMemo(() => {
    return scene.nodes.find((node) => node.id === selectedNodeId);
  }, [scene.nodes, selectedNodeId]);

  useEffect(() => {
    setActiveStepId("county");
    const dropTimer = window.setTimeout(() => setActiveStepId("drop"), 180);
    const reportTimer = window.setTimeout(() => setActiveStepId("report"), 420);
    return () => {
      window.clearTimeout(dropTimer);
      window.clearTimeout(reportTimer);
    };
  }, []);

  const askForCampaignPath = () => {
    const campaignPreview = previewCampaignFromScout(defaultScoutPreview);
    setScene(campaignPreview.scene);
    setSelectedNodeId(campaignPreview.selectedNodeId);
    setActiveStepId("campaign");
    window.dispatchEvent(
      new CustomEvent("atlas:campaign-path", {
        detail: {
          scoutPreviewId: defaultScoutPreview.id,
          campaignPreviewId: campaignPreview.id,
          nodeId: selectedNode?.id,
          label: selectedNode?.label,
          route: defaultScoutPreview.route,
        },
      }),
    );
  };

  const contextTitle =
    scene.panel.type === "campaign_preview"
      ? `${defaultScoutPreview.businessType} Campaign Preview`
      : `${defaultScoutPreview.businessType} Scout Drop`;

  return (
    <VoxelSceneView
      scene={scene}
      selectedNodeId={selectedNodeId}
      activeStepId={activeStepId}
      contextTitle={contextTitle}
      onSelectNode={setSelectedNodeId}
      onAskCampaign={askForCampaignPath}
    />
  );
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root element.");
}

createRoot(root).render(<WidgetShell />);
