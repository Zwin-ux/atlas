import { useMemo, type KeyboardEvent } from "react";
import type { AtlasNode, VoxelFlowStep, VoxelPoint, VoxelScene, VoxelTile } from "@atlas/core/voxel";
import { PixiVoxelSceneView } from "./PixiVoxelSceneView";

export type VoxelSceneViewProps = {
  scene: VoxelScene;
  selectedNodeId: string;
  activeStepId?: VoxelFlowStep["id"];
  contextTitle?: string;
  compact?: boolean;
  onSelectNode: (nodeId: string) => void;
  onAskCampaign?: () => void;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type DisplaySignal = {
  label: string;
  detail?: string;
  score?: number;
};

export function VoxelSceneView({ scene, selectedNodeId, activeStepId, contextTitle, compact = false, onSelectNode, onAskCampaign }: VoxelSceneViewProps) {
  const nodeById = useMemo(() => new Map(scene.nodes.map((node) => [node.id, node])), [scene.nodes]);
  const selectedNode = nodeById.get(selectedNodeId) ?? nodeById.get(scene.selectedNodeId) ?? scene.nodes[0];
  const clawdNode = nodeById.get(scene.clawd.nodeId) ?? selectedNode;
  const routeNodes = scene.clawd.routeNodeIds
    .map((nodeId) => nodeById.get(nodeId))
    .filter((node): node is AtlasNode => Boolean(node));
  const routePoints = routeNodes.map((node) => project(scene, node.position));
  const scoutPanel = scene.panel.type === "scout_report" ? scene.panel : null;
  const campaignPanel = scene.panel.type === "campaign_preview" ? scene.panel : null;
  const panelFocused = Boolean(scoutPanel && scoutPanel.focusNodeId === selectedNode?.id);
  const campaignFocused = Boolean(campaignPanel && campaignPanel.focusNodeId === selectedNode?.id);
  const panelSignals = panelFocused ? scoutPanel?.signals ?? [] : [];
  const displaySignals: DisplaySignal[] =
    panelSignals.length > 0 ? panelSignals : (selectedNode?.signals ?? []).map((signal) => ({ label: signal }));
  const scoutScore =
    panelSignals.length > 0
      ? Math.round(panelSignals.reduce((total, signal) => total + signal.score, 0) / panelSignals.length)
      : selectedNode?.score ?? 0;
  const reportKicker = contextTitle ?? (campaignFocused && campaignPanel ? campaignPanel.title : panelFocused && scoutPanel ? scoutPanel.title : scene.panel.title);
  const reportHeading =
    campaignFocused && selectedNode
      ? `7-day ${selectedNode.label} launch`
      : panelFocused && selectedNode
        ? `Drop: ${selectedNode.label}`
        : selectedNode?.label ?? scene.panel.title;
  const reportSummary =
    campaignFocused && campaignPanel ? campaignPanel.summary : panelFocused && scoutPanel ? scoutPanel.summary : selectedNode?.campaignSuggestion ?? scene.panel.summary;
  const scoreLabel = panelFocused ? "Scout fit" : "Opportunity";
  const flow = useMemo(() => resolveFlow(scene.flow, activeStepId), [activeStepId, scene.flow]);

  const handleNodeKeyDown = (event: KeyboardEvent<SVGGElement>, nodeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectNode(nodeId);
    }
  };

  return (
    <main className={compact ? "voxel-shell is-compact" : "voxel-shell"}>
      <section className="voxel-stage" aria-label="Riverside VoxelScene">
        <div className="voxel-map-column">
          <div className="voxel-map-frame">
            <header className="voxel-topbar">
              <div>
                <p className="voxel-kicker">ATLAS COUNTY BOARD</p>
                <h1>{scene.county.name}</h1>
              </div>
              <div className="voxel-live-chip">
                <span>Google mode</span>
                <strong>{scene.county.state}</strong>
              </div>
            </header>

            <PixiVoxelSceneView
              scene={scene}
              selectedNodeId={selectedNodeId}
              {...(activeStepId ? { activeStepId } : {})}
              {...(contextTitle ? { contextTitle } : {})}
              compact={compact}
              onSelectNode={onSelectNode}
              {...(onAskCampaign ? { onAskCampaign } : {})}
              fallback={
                <svg
                  className="voxel-map"
                  viewBox={`0 0 ${scene.viewport.width} ${scene.viewport.height}`}
                  role="img"
                  aria-label={`${scene.county.name} light voxel board with Eastvale Scout Drop highlighted`}
                >
              <rect className="voxel-map-bg" width={scene.viewport.width} height={scene.viewport.height} rx="0" />
              <g className="voxel-tiles">
                {scene.tiles.map((tile) => (
                  <TileShape key={tile.id} scene={scene} tile={tile} />
                ))}
              </g>
              <g className="voxel-edges">
                {scene.edges.map((edge) => {
                  const from = nodeById.get(edge.from);
                  const to = nodeById.get(edge.to);
                  if (!from || !to) return null;
                  const start = project(scene, from.position);
                  const end = project(scene, to.position);
                  return (
                    <line
                      key={edge.id}
                      className={`voxel-edge voxel-edge-${edge.kind}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                    />
                  );
                })}
              </g>
              {routePoints.length > 1 ? (
                <polyline className="voxel-route-line" points={routePoints.map((point) => `${point.x},${point.y}`).join(" ")} />
              ) : null}
              <g className="voxel-markers">
                {scene.markers.map((marker) => {
                  const node = nodeById.get(marker.nodeId);
                  if (!node) return null;
                  const point = project(scene, node.position);
                  return (
                    <g key={marker.id} className={`voxel-marker voxel-marker-${marker.kind}`} transform={`translate(${point.x} ${point.y - 28})`}>
                      <path d="M0 -15 L12 0 L0 15 L-12 0 Z" />
                      <circle r="4" />
                    </g>
                  );
                })}
              </g>
              <g className="voxel-nodes">
                {scene.nodes.map((node) => {
                  const point = project(scene, node.position);
                  const selected = node.id === selectedNode?.id;
                  const labelWidth = Math.max(64, node.label.length * 6.5 + 18);
                  return (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${node.label}`}
                      className={selected ? "voxel-node is-selected" : "voxel-node"}
                      transform={`translate(${point.x} ${point.y})`}
                      onClick={() => onSelectNode(node.id)}
                      onKeyDown={(event) => handleNodeKeyDown(event, node.id)}
                    >
                      <circle className="voxel-node-halo" r={selected ? 25 : 18} />
                      <circle className={`voxel-node-dot voxel-node-${node.kind}`} r={selected ? 12 : 9} />
                      <rect className="voxel-node-label-bg" x={-labelWidth / 2} y="18" width={labelWidth} height="22" rx="3" />
                      <text className="voxel-node-label" y="33" textAnchor="middle">
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
              {clawdNode ? (
                <g className="clawd-sprite" transform={`translate(${project(scene, clawdNode.position).x - 34} ${project(scene, clawdNode.position).y - 56})`}>
                  <rect width="48" height="34" rx="6" />
                  <path d="M13 21h22M16 14h4M28 14h4M20 25l4 4 4-4" />
                  <text x="24" y="-7" textAnchor="middle">
                    {scene.clawd.label}
                  </text>
                </g>
              ) : null}
                </svg>
              }
            />
          </div>

          <footer className="voxel-flow" aria-label="Atlas flow">
            {flow.map((step, index) => (
              <div key={step.id} className={`voxel-flow-step is-${step.status}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong>
              </div>
            ))}
          </footer>
        </div>

        <aside className="voxel-report" aria-label="Scout report">
          <p className="voxel-kicker">{reportKicker}</p>
          <h2>{reportHeading}</h2>
          {campaignFocused && campaignPanel ? (
            <p className="voxel-status-line">
              <span>Manual only</span>
              <strong>{campaignPanel.days.length} day plan</strong>
            </p>
          ) : panelFocused ? (
            <p className="voxel-status-line">
              <span>{scene.clawd.status}</span>
              <strong>{routeNodes.length} stop route</strong>
            </p>
          ) : null}
          <p className="voxel-report-copy">{reportSummary}</p>

          {campaignFocused && campaignPanel ? (
            <div className="voxel-best-offer">
              <span>Offer anchor</span>
              <strong>{campaignPanel.offer}</strong>
            </div>
          ) : (
            <div className="voxel-score">
              <span>{scoreLabel}</span>
              <strong>{scoutScore}</strong>
              <div>
                <i style={{ width: `${scoutScore}%` }} />
              </div>
            </div>
          )}

          {panelFocused && scoutPanel?.bestOffer ? (
            <div className="voxel-best-offer">
              <span>Best offer</span>
              <strong>{scoutPanel.bestOffer}</strong>
            </div>
          ) : null}

          {campaignFocused && campaignPanel ? (
            <section className="voxel-panel-section">
              <h3>7-day plan</h3>
              <ol className="voxel-day-list">
                {campaignPanel.days.map((day) => (
                  <li key={day.day}>
                    <span>{String(day.day).padStart(2, "0")}</span>
                    <div>
                      <strong>{day.label}</strong>
                      <p>{day.focus}</p>
                      <small>{channelLabel(day.channel)} / {day.proof}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <ul className="voxel-signal-list">
              {displaySignals.map((signal) => (
                <li key={signal.label}>
                  <strong>
                    <span>{signal.label}</span>
                    {typeof signal.score === "number" ? <b>{signal.score}</b> : null}
                  </strong>
                  {signal.detail ? <small>{signal.detail}</small> : null}
                </li>
              ))}
            </ul>
          )}

          {campaignFocused && campaignPanel?.routePriorities.length ? (
            <section className="voxel-panel-section">
              <h3>Route priorities</h3>
              <ol className="voxel-route-list">
                {campaignPanel.routePriorities.slice(0, 6).map((priority) => (
                  <li key={priority.nodeId}>
                    <span>{String(priority.priority).padStart(2, "0")}</span>
                    <strong>{priority.label}</strong>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {campaignFocused && campaignPanel?.assetPlaceholders.length ? (
            <section className="voxel-panel-section">
              <h3>Assets</h3>
              <ul className="voxel-asset-list">
                {campaignPanel.assetPlaceholders.map((asset) => (
                  <li key={asset.id}>
                    <strong>{asset.label}</strong>
                    <span>{formatLabel(asset.format)} / {channelLabel(asset.channel)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {campaignFocused && campaignPanel?.guardrails.length ? (
            <section className="voxel-panel-section">
              <h3>Guardrails</h3>
              <ul className="voxel-mini-list">
                {campaignPanel.guardrails.slice(0, 3).map((guardrail) => (
                  <li key={guardrail}>{guardrail}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {panelFocused && routeNodes.length > 1 ? (
            <section className="voxel-panel-section">
              <h3>Route</h3>
              <ol className="voxel-route-list">
                {routeNodes.map((node, index) => (
                  <li key={node.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{node.label}</strong>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {panelFocused && scoutPanel?.channels?.length ? (
            <section className="voxel-panel-section">
              <h3>Channels</h3>
              <div className="voxel-channel-list">
                {scoutPanel.channels.map((channel) => (
                  <span key={channel}>{channel}</span>
                ))}
              </div>
            </section>
          ) : null}
          {panelFocused && scoutPanel?.risks?.length ? (
            <section className="voxel-panel-section">
              <h3>Watch</h3>
              <ul className="voxel-mini-list">
                {scoutPanel.risks.slice(0, 2).map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {panelFocused && scoutPanel?.nextActions?.length ? (
            <section className="voxel-panel-section">
              <h3>Next</h3>
              <ul className="voxel-mini-list">
                {scoutPanel.nextActions.slice(0, 3).map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {"stats" in scene.panel ? (
            <div className="voxel-stat-grid">
              {scene.panel.stats.map((stat) => (
                <div key={stat.label} className={`voxel-stat voxel-stat-${stat.tone}`}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {panelFocused && scoutPanel?.upgradePrompt ? <p className="voxel-upgrade-note">{scoutPanel.upgradePrompt}</p> : null}
          {campaignFocused && campaignPanel?.upgradePrompt ? <p className="voxel-upgrade-note">{campaignPanel.upgradePrompt}</p> : null}
          <button type="button" className="voxel-action" onClick={onAskCampaign}>
            {campaignFocused ? "Draft first asset" : panelFocused ? "Draft manual campaign" : "Draft campaign path"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function resolveFlow(flow: VoxelFlowStep[], activeStepId: VoxelFlowStep["id"] | undefined): VoxelFlowStep[] {
  if (!activeStepId) return flow;

  const activeIndex = flow.findIndex((step) => step.id === activeStepId);
  if (activeIndex < 0) return flow;

  return flow.map((step, index) => ({
    ...step,
    status: index < activeIndex ? "done" : index === activeIndex ? "active" : "next",
  }));
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    qr_flyer: "QR flyer",
    local_group: "Local group",
    property_manager: "Property manager",
    partner: "Partner ask",
    google_profile: "Google profile",
  };
  return labels[channel] ?? channel;
}

function formatLabel(format: string): string {
  return format.replace(/_/g, " ");
}

function TileShape({ scene, tile }: { scene: VoxelScene; tile: VoxelTile }) {
  const point = project(scene, tile.position);
  const top = diamondPoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight);
  const left = sidePoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight, scene.viewport.tileDepth + tile.elevation * 2, "left");
  const right = sidePoints(point, scene.viewport.tileWidth, scene.viewport.tileHeight, scene.viewport.tileDepth + tile.elevation * 2, "right");

  return (
    <g className={`voxel-tile voxel-tile-${tile.kind}`}>
      <polygon className="voxel-tile-side voxel-tile-left" points={left} />
      <polygon className="voxel-tile-side voxel-tile-right" points={right} />
      <polygon className="voxel-tile-top" points={top} />
    </g>
  );
}

function project(scene: VoxelScene, point: VoxelPoint): ProjectedPoint {
  return {
    x: scene.viewport.originX + (point.x - point.y) * (scene.viewport.tileWidth / 2),
    y: scene.viewport.originY + (point.x + point.y) * (scene.viewport.tileHeight / 2) - point.z * scene.viewport.tileDepth,
  };
}

function diamondPoints(center: ProjectedPoint, width: number, height: number): string {
  return [
    `${center.x},${center.y - height / 2}`,
    `${center.x + width / 2},${center.y}`,
    `${center.x},${center.y + height / 2}`,
    `${center.x - width / 2},${center.y}`,
  ].join(" ");
}

function sidePoints(center: ProjectedPoint, width: number, height: number, depth: number, side: "left" | "right"): string {
  if (side === "left") {
    return [
      `${center.x - width / 2},${center.y}`,
      `${center.x},${center.y + height / 2}`,
      `${center.x},${center.y + height / 2 + depth}`,
      `${center.x - width / 2},${center.y + depth}`,
    ].join(" ");
  }

  return [
    `${center.x + width / 2},${center.y}`,
    `${center.x},${center.y + height / 2}`,
    `${center.x},${center.y + height / 2 + depth}`,
    `${center.x + width / 2},${center.y + depth}`,
  ].join(" ");
}
