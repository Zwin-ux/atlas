import hostedClawdBadge from "../../assets/generated/placeholders/svg/hosted-clawd-badge.svg";
import type { HostedClawdContext } from "./types";

export type HostedClawdTrayProps = {
  context: HostedClawdContext;
  actionMessage?: string | undefined;
  onClose: () => void;
  onPrimaryAction: () => void;
};

export function HostedClawdTray({ context, actionMessage, onClose, onPrimaryAction }: HostedClawdTrayProps) {
  const closedGateCount = context.gates.filter((gate) => !gate.approved).length;
  const setupSteps = setupStepsForContext(context, closedGateCount);
  const activeSetupStepId = setupSteps.find((step) => step.status !== "ready")?.id ?? setupSteps[setupSteps.length - 1]?.id;
  const recoveryCues = recoveryCuesForContext(context, closedGateCount);

  return (
    <section
      className="city-world-hosted-clawd"
      aria-label="Hosted Clawd upgrade"
      data-qa="hosted-clawd-tray"
      data-qa-hosted-state={context.screenState}
      data-qa-hosted-mode={context.mode}
    >
      <div className="city-world-hosted-clawd-windowbar" aria-hidden="true">
        <span>CLAWD SETUP</span>
        <i />
        <i />
      </div>

      <header className="city-world-hosted-clawd-head">
        <img src={hostedClawdBadge} alt="" aria-hidden="true" />
        <div>
          <span>{context.statusLabel}</span>
          <strong>Hosted Clawd bench</strong>
          <p>{context.contextLabel}</p>
        </div>
        <button type="button" className="city-world-hosted-clawd-close" aria-label="Close Hosted Clawd tray" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <div className="city-world-hosted-clawd-state" data-qa="hosted-clawd-session-state">
        <span>{context.sessionBoundary}</span>
        <span>{context.paymentCopy}</span>
      </div>

      <section
        className="city-world-hosted-clawd-setup"
        aria-label="Hosted Clawd setup console"
        data-qa="hosted-clawd-setup-rail"
        data-qa-setup-console="grey"
      >
        <div className="city-world-hosted-clawd-section-head">
          <h3>Setup bench</h3>
          <span>Beta writes locked</span>
        </div>

        <div className="city-world-hosted-clawd-stage-buttons" aria-label="Hosted Clawd setup stages">
          {setupSteps.map((step, index) => (
            <span
              key={step.id}
              className="city-world-hosted-clawd-stage-button"
              aria-current={step.id === activeSetupStepId ? "step" : undefined}
              data-status={step.status}
              data-qa={`hosted-clawd-setup-${step.id}`}
            >
              <span aria-hidden="true">{index + 1}</span>
              {step.label}
            </span>
          ))}
        </div>

        <div className="city-world-hosted-clawd-recovery" data-qa="hosted-clawd-recovery">
          <div>
            <span>RECOVERY</span>
            <strong>{context.canPersist ? "Save adapter ready" : "Session bench only"}</strong>
            <p>{context.canPersist ? "Hosted writes can run after user confirmation." : "No writes leave this chat while the gates are closed."}</p>
          </div>
          <ul>
            {recoveryCues.map((cue) => (
              <li key={cue.label} data-status={cue.status}>
                <span aria-hidden="true" />
                <strong>{cue.label}</strong>
                <p>{cue.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="city-world-hosted-clawd-copy">
        <p>{context.primaryCopy}</p>
        <p>{context.secondaryCopy}</p>
      </div>

      <div className="city-world-hosted-clawd-save" aria-label="Hosted Clawd save preview">
        <div className="city-world-hosted-clawd-section-head">
          <h3>What would be saved</h3>
          <span>{context.savePreview.length}</span>
        </div>
        <ul>
          {context.savePreview.map((item) => (
            <li key={`${item.label}-${item.value}`}>
              <span className={`city-world-hosted-clawd-dot status-${item.status}`} aria-hidden="true" />
              <div>
                <strong>{item.label}</strong>
                <p>{item.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <footer className="city-world-hosted-clawd-foot">
        {actionMessage ? (
          <p className="city-world-hosted-clawd-action-message" data-qa="hosted-clawd-action-message">
            {actionMessage}
          </p>
        ) : null}
        <button
          type="button"
          className="city-world-recovery-action city-world-hosted-clawd-primary"
          data-qa="hosted-clawd-primary-action"
          disabled={!context.primaryAction.enabled}
          onClick={onPrimaryAction}
        >
          {context.primaryAction.label}
        </button>
        <div className="city-world-hosted-clawd-gates" aria-label="Hosted Clawd gates" data-qa="hosted-clawd-gates">
          <span>{formatCount(closedGateCount, "gate")} closed</span>
          <span>{context.canPersist ? "Persistence ready" : "Persistence off"}</span>
          <span>{context.canStartCheckout ? "Checkout ready" : "Checkout off"}</span>
        </div>
      </footer>
    </section>
  );
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
      label: "Wake",
      detail: "Open the Hosted Clawd bench on this map",
      status: "ready",
      statusLabel: "Ready",
    },
    setupStepFromPreview("target", "Target", business, "Pick a business from the map"),
    setupStepFromPreview("scout", "Scout", scout, "Run a Scout Drop"),
    setupStepFromPreview("campaign", "Campaign", campaign, "Preview the first campaign"),
    {
      id: "gate",
      label: "Gate",
      detail: closedGateCount > 0 ? `${formatCount(closedGateCount, "approval gate")} closed` : "Persistence and payment gates are open",
      status: closedGateCount > 0 ? "blocked" : "ready",
      statusLabel: closedGateCount > 0 ? "Locked" : "Ready",
    },
    {
      id: "proof",
      label: "Proof",
      detail: context.canPersist ? "Save after confirmation" : "Proof waits for Hosted Clawd approval",
      status: context.canPersist ? "ready" : "blocked",
      statusLabel: context.canPersist ? "Ready" : "Locked",
    },
  ];
}

type HostedClawdRecoveryCue = {
  label: string;
  detail: string;
  status: "ready" | "missing" | "locked";
};

function recoveryCuesForContext(context: HostedClawdContext, closedGateCount: number): HostedClawdRecoveryCue[] {
  return [
    {
      label: "Power",
      detail: context.mode === "alpha_free" ? "Alpha bench awake" : context.mode.replace("_", " "),
      status: "ready",
    },
    {
      label: "Target",
      detail: context.contextLabel,
      status: findSavePreviewItem(context, "Business")?.status === "ready" ? "ready" : "missing",
    },
    {
      label: "Save",
      detail: context.canPersist ? "adapter ready" : "persistence off",
      status: context.canPersist ? "ready" : "locked",
    },
    {
      label: "Gate",
      detail: closedGateCount > 0 ? `${formatCount(closedGateCount, "approval")} closed` : "approvals open",
      status: closedGateCount > 0 ? "locked" : "ready",
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
