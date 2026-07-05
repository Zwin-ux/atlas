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

  return (
    <section
      className="city-world-hosted-clawd"
      aria-label="Hosted Clawd upgrade"
      data-qa="hosted-clawd-tray"
      data-qa-hosted-state={context.screenState}
      data-qa-hosted-mode={context.mode}
    >
      <header className="city-world-hosted-clawd-head">
        <img src={hostedClawdBadge} alt="" aria-hidden="true" />
        <div>
          <span>{context.statusLabel}</span>
          <strong>Host Clawd for this business</strong>
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
          <span>{closedGateCount} gates closed</span>
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
