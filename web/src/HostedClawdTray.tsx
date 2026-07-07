import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { HostedClawdContext } from "./types";

export type HostedClawdTrayProps = {
  context: HostedClawdContext;
  actionMessage?: string | undefined;
  onClose: () => void;
  onPrimaryAction: () => void;
};

export function HostedClawdTray({ context, actionMessage, onClose, onPrimaryAction }: HostedClawdTrayProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const expandButtonRef = useRef<HTMLButtonElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const closedGateCount = context.gates.filter((gate) => !gate.approved).length;
  const setupSteps = setupStepsForContext(context, closedGateCount);
  const activeSetupStepId = setupSteps.find((step) => step.status !== "ready")?.id ?? setupSteps[setupSteps.length - 1]?.id;
  const saveReadiness = saveReadinessForContext(context, closedGateCount);
  const savedShelf = savedShelfForContext(context);
  const visibleSetupSteps = setupSteps.filter((step) => ["wake", "target", "scout", "campaign"].includes(step.id));

  useEffect(() => {
    if (expanded) closeButtonRef.current?.focus();
  }, [expanded]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (expanded) {
      setExpanded(false);
      window.requestAnimationFrame(() => expandButtonRef.current?.focus());
      return;
    }
    onClose();
  };

  return (
    <section
      className={expanded ? "city-world-hosted-clawd is-expanded" : "city-world-hosted-clawd is-collapsed"}
      role={expanded ? "dialog" : "region"}
      aria-modal={expanded ? "true" : undefined}
      aria-labelledby="hosted-clawd-title"
      aria-describedby="hosted-clawd-summary"
      data-qa="hosted-clawd-tray"
      data-qa-sheet-state={expanded ? "expanded" : "collapsed"}
      data-qa-hosted-state={context.screenState}
      data-qa-hosted-mode={context.mode}
      data-qa-no-pricing-page="true"
      data-qa-dashboard-shell="false"
      data-qa-save-surface-count="1"
      data-qa-paid-writes={context.canUsePaidWrites ? "enabled" : "read-only"}
      data-qa-return-url-access="false"
      onKeyDown={handleKeyDown}
    >
      <div className="city-world-hosted-clawd-peek" data-qa="hosted-clawd-bottom-sheet-peek">
        <button
          ref={expandButtonRef}
          type="button"
          className="city-world-hosted-clawd-peek-copy"
          aria-expanded={expanded}
          aria-controls="hosted-clawd-sheet-body"
          onClick={() => setExpanded((value) => !value)}
        >
          <span id="hosted-clawd-title">Atlas save</span>
          <strong>Status: {saveReadiness.readyCount}/{saveReadiness.slots.length} ready</strong>
          <small id="hosted-clawd-summary">{context.contextLabel}</small>
        </button>
        <button
          type="button"
          className="city-world-recovery-action city-world-hosted-clawd-primary"
          data-qa="hosted-clawd-primary-action"
          disabled={!context.primaryAction.enabled}
          onClick={onPrimaryAction}
        >
          {context.primaryAction.label}
        </button>
        <button type="button" className="city-world-hosted-clawd-close" aria-label="Close Atlas save panel" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {expanded ? (
        <div id="hosted-clawd-sheet-body" className="city-world-hosted-clawd-body" data-qa="hosted-clawd-sheet-body">
          <header className="city-world-hosted-clawd-head">
            <div>
              <strong>Save with ChatGPT</strong>
              <p>{saveReadiness.detail}</p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              className="city-world-hosted-clawd-collapse"
              aria-label="Collapse Atlas save panel"
              onClick={() => {
                setExpanded(false);
                window.requestAnimationFrame(() => expandButtonRef.current?.focus());
              }}
            >
              Collapse
            </button>
          </header>

          <div className="city-world-hosted-clawd-state" role="status" aria-live="polite" data-qa="hosted-clawd-session-state">
            <span>{saveReadiness.title}</span>
          </div>

          <section
            className="city-world-hosted-clawd-save-strip"
            aria-label="Saved workflow items"
            data-qa="hosted-clawd-save-strip"
            data-qa-save-readiness={saveReadiness.status}
            data-qa-save-ready-count={saveReadiness.readyCount}
          >
            <ol className="city-world-hosted-clawd-save-slots" aria-label="Saved items">
              {saveReadiness.slots.map((slot, index) => (
                <li key={`${slot.id}-${index}`} aria-label={`${slot.label}: ${saveSlotValue(slot)}`} data-status={slot.status} data-qa={`hosted-clawd-save-slot-${slot.id}`}>
                  <span aria-hidden="true" />
                  <div>
                    <strong title={slot.label}>{slot.label}</strong>
                    <p title={saveSlotValue(slot)}>{saveSlotValue(slot)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {savedShelf ? (
            <section
              className="city-world-hosted-clawd-saved-shelf"
              aria-label="Saved Atlas state"
              data-qa="hosted-clawd-saved-shelf"
              data-qa-saved-read-only={savedShelf.readOnly ? "true" : "false"}
              data-qa-saved-record-count={savedShelf.recordCount}
            >
              <div className="city-world-hosted-clawd-saved-head">
                <span>Saved items</span>
                <strong>{savedShelf.title}</strong>
                <p>{savedShelf.detail}</p>
              </div>
              <ul className="city-world-hosted-clawd-saved-list">
                {savedShelf.rows.map((row) => (
                  <li key={row.id} data-kind={row.kind}>
                    <span aria-hidden="true" />
                    <div>
                      <strong>{row.label}</strong>
                      <p>{row.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="city-world-hosted-clawd-setup" aria-label="Atlas workflow steps" data-qa="hosted-clawd-setup-rail" data-qa-setup-console="grey">
            <ol className="city-world-hosted-clawd-stage-buttons" aria-label="Workflow steps">
              {visibleSetupSteps.map((step, index) => (
                <li
                  key={step.id}
                  className="city-world-hosted-clawd-stage-button"
                  aria-current={step.id === activeSetupStepId ? "step" : undefined}
                  aria-label={`${step.label}: ${step.statusLabel}. ${step.detail}`}
                  data-status={step.status}
                  data-qa={`hosted-clawd-setup-${step.id}`}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  {step.label}
                </li>
              ))}
            </ol>
          </section>

          {actionMessage ? (
            <p className="city-world-hosted-clawd-action-message" role="status" aria-live="polite" data-qa="hosted-clawd-action-message">
              {actionMessage}
            </p>
          ) : null}
        </div>
      ) : actionMessage ? (
        <p className="city-world-hosted-clawd-action-message" role="status" aria-live="polite" data-qa="hosted-clawd-action-message">
          {actionMessage}
        </p>
      ) : null}
    </section>
  );
}

type HostedClawdSaveSlot = {
  id: string;
  label: string;
  detail: string;
  status: "ready" | "pending" | "locked";
};

type HostedClawdSaveReadiness = {
  status: "session" | "needs_account" | "ready";
  kicker: string;
  title: string;
  detail: string;
  readyCount: number;
  slots: HostedClawdSaveSlot[];
};

function saveReadinessForContext(context: HostedClawdContext, closedGateCount: number): HostedClawdSaveReadiness {
  const slots = context.savePreview.map((item): HostedClawdSaveSlot => ({
    id: saveSlotId(item.label),
    label: item.label,
    detail: item.value,
    status: item.status === "ready" ? "ready" : item.status === "needs_confirmation" ? "pending" : "locked",
  }));
  const readyCount = slots.filter((slot) => slot.status === "ready").length;
  const status = context.canPersist ? "ready" : closedGateCount > 0 ? "session" : "needs_account";

  if (context.canPersist) {
    return {
      status,
      kicker: "Saved setup",
      title: `${readyCount}/${slots.length} ready`,
      detail: "Save confirmed business, map, Scout Drop, and campaign draft.",
      readyCount,
      slots,
    };
  }

  return {
    status,
    kicker: "Local view",
    title: `${readyCount}/${slots.length} ready in this chat`,
    detail:
      closedGateCount > 0
        ? "This chat is temporary. Connect an account before anything can be saved."
        : "Connect an account to save this setup.",
    readyCount,
    slots,
  };
}

function saveSlotId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "slot";
}

function saveSlotValue(slot: HostedClawdSaveSlot): string {
  if (slot.status === "locked") return "Not ready";
  if (slot.status === "pending") return slot.detail;
  if (slot.label === "Scout report" || slot.label === "Campaign draft") return "Saved";
  return slot.detail;
}

type HostedClawdSavedShelfRow = {
  id: string;
  kind: "clawd" | "business" | "scout" | "campaign" | "empty";
  label: string;
  detail: string;
};

type HostedClawdSavedShelf = {
  title: string;
  detail: string;
  recordCount: number;
  readOnly: boolean;
  rows: HostedClawdSavedShelfRow[];
};

function savedShelfForContext(context: HostedClawdContext): HostedClawdSavedShelf | null {
  const savedState = context.savedState;
  if (!savedState) return null;

  const rows: HostedClawdSavedShelfRow[] = [];
  if (savedState.clawd) {
    rows.push({
      id: `clawd-${savedState.clawd.id}`,
      kind: "clawd",
      label: savedState.clawd.name,
      detail: "Saved assistant",
    });
  }
  if (savedState.businessProfile) {
    const place = savedState.businessProfile.placeLabel ?? savedState.businessProfile.countyLabel ?? savedState.businessProfile.countySlug;
    rows.push({
      id: `business-${savedState.businessProfile.id}`,
      kind: "business",
      label: savedState.businessProfile.name,
      detail: `${savedState.businessProfile.businessType ?? "Business profile"} - ${place}`,
    });
  }
  if (savedState.scoutDrops.length > 0) {
    const latest = savedState.scoutDrops[0];
    if (latest) {
      rows.push({
        id: `scout-${latest.id}`,
        kind: "scout",
        label: `${savedState.scoutDrops.length} saved Scout Drop${savedState.scoutDrops.length === 1 ? "" : "s"}`,
        detail: `Latest preview ${latest.scoutPreviewId}`,
      });
    }
  }
  if (savedState.campaignDrafts.length > 0) {
    const latest = savedState.campaignDrafts[0];
    if (latest) {
      rows.push({
        id: `campaign-${latest.id}`,
        kind: "campaign",
        label: `${savedState.campaignDrafts.length} campaign draft${savedState.campaignDrafts.length === 1 ? "" : "s"}`,
        detail: latest.summary ?? `Preview ${latest.campaignPreviewId}`,
      });
    }
  }

  const recordCount =
    (savedState.clawd ? 1 : 0) +
    (savedState.businessProfile ? 1 : 0) +
    savedState.scoutDrops.length +
    savedState.campaignDrafts.length;

  if (rows.length === 0) {
    rows.push({
      id: "empty",
      kind: "empty",
      label: "Nothing saved yet",
      detail: "Start from this map.",
    });
  }

  return {
    title: recordCount === 0 ? "No saved state yet" : `${recordCount} saved in ChatGPT`,
    detail:
      savedState.readOnlyReason === "billing_attention"
        ? "Saved history is readable. New saves are paused."
        : savedState.paidWrites === "enabled"
          ? "Saved history is loaded. New saves are on."
          : "Saved history is readable. New saves are locked.",
    recordCount,
    readOnly: savedState.paidWrites === "read_only",
    rows,
  };
}

function CloseIcon() {
  return (
    <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
    </svg>
  );
}

type HostedClawdSetupStep = {
  id: string;
  label: string;
  detail: string;
  status: "ready" | "needs_confirmation" | "planned" | "blocked";
  statusLabel: string;
};

function setupStepsForContext(context: HostedClawdContext, closedGateCount: number): HostedClawdSetupStep[] {
  const business = findSavePreviewItem(context, "Business");
  const scout = findSavePreviewItem(context, "Scout report");
  const campaign = findSavePreviewItem(context, "Campaign draft");

  return [
    {
      id: "wake",
      label: "Open",
      detail: "Open setup on this map",
      status: "ready",
      statusLabel: "Ready",
    },
    setupStepFromPreview("target", "Target", business, "Pick a business from the map"),
    setupStepFromPreview("scout", "Scout", scout, "Run a Scout Drop"),
    setupStepFromPreview("campaign", "Campaign", campaign, "Preview the first campaign"),
    {
      id: "gate",
      label: "Account",
      detail: closedGateCount > 0 ? `${formatCount(closedGateCount, "setup step")} locked` : "Account ready",
      status: closedGateCount > 0 ? "blocked" : "ready",
      statusLabel: closedGateCount > 0 ? "Locked" : "Ready",
    },
    {
      id: "proof",
      label: "Save",
      detail: context.canPersist ? "Confirm before saving" : "Saving is not live yet",
      status: context.canPersist ? "ready" : "blocked",
      statusLabel: context.canPersist ? "Ready" : "Locked",
    },
  ];
}

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function findSavePreviewItem(context: HostedClawdContext, label: string) {
  return context.savePreview.find((item) => item.label === label);
}

function setupStepFromPreview(
  id: string,
  label: string,
  item: HostedClawdContext["savePreview"][number] | undefined,
  fallback: string,
): HostedClawdSetupStep {
  const status = item?.status ?? "needs_confirmation";
  return {
    id,
    label,
    detail: item?.value ?? fallback,
    status,
    statusLabel: setupStatusLabel(status),
  };
}

function setupStatusLabel(status: HostedClawdSetupStep["status"]): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "needs_confirmation":
      return "Check";
    case "planned":
      return "Next";
    case "blocked":
      return "Locked";
  }
}
