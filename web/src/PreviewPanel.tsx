import { Children, Fragment, type ReactNode } from "react";
import { Collapsible, ScrollArea, Separator } from "radix-ui";
import type {
  CampaignPreviewState,
  ScoutPreviewState,
  ScoutRisk,
  ScoutSignal,
} from "@atlas/core/scout";

export type PreviewPanelProps = {
  scoutPreview?: ScoutPreviewState | null;
  campaignPreview?: CampaignPreviewState | null;
  onAdvance?: () => void;
};

/**
 * Result surface for the Scout Drop and Campaign previews.
 *
 * The MCP tools already return route, signals, risks, channels, a 7-day plan,
 * and asset placeholders in `_meta`. Before this panel the widget dropped all of
 * it and only re-rendered the map, so the scouting result showed up only as a
 * plaintext chat bubble. This renders it inside the app as a bounded, map-first
 * overlay. It stays honest: nothing here is saved, sent, or scheduled.
 */
export function PreviewPanel({ scoutPreview, campaignPreview, onAdvance }: PreviewPanelProps) {
  if (campaignPreview) return <CampaignPanel preview={campaignPreview} {...(onAdvance ? { onAdvance } : {})} />;
  if (scoutPreview) return <ScoutPanel preview={scoutPreview} {...(onAdvance ? { onAdvance } : {})} />;
  return null;
}

function ScoutPanel({ preview, onAdvance }: { preview: ScoutPreviewState; onAdvance?: () => void }) {
  return (
    <section
      className="city-world-preview"
      aria-label="Scout drop result"
      data-qa="preview-panel"
      data-qa-preview-kind="scout"
      data-qa-signal-count={preview.signals.length}
    >
      <header className="city-world-preview-head">
        <span className="city-world-preview-kicker">Scout drop · {preview.businessType}</span>
        <strong data-qa="preview-title">{preview.summary}</strong>
      </header>

      <PreviewBody>
        <PreviewSections>
          {preview.bestOffer ? (
            <div className="city-world-preview-offer" data-qa="preview-best-offer">
              <span>Best offer</span>
              <p>{preview.bestOffer}</p>
            </div>
          ) : null}

          {preview.signals.length > 0 ? (
            <SectionBlock title="Signals" count={preview.signals.length}>
              <ul className="city-world-preview-signals" data-qa="preview-signals">
                {preview.signals.map((signal) => (
                  <SignalRow key={signal.id} signal={signal} />
                ))}
              </ul>
            </SectionBlock>
          ) : null}

          {preview.route.length > 0 ? (
            <CollapsibleSection title="Route" count={preview.route.length}>
              <ol className="city-world-preview-route">
                {preview.route.map((stop) => (
                  <li key={stop.nodeId}>
                    <strong>{stop.label}</strong>
                    <span>{stop.reason}</span>
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
          ) : null}

          {preview.risks.length > 0 ? (
            <SectionBlock title="Watch-outs" count={preview.risks.length}>
              <ul className="city-world-preview-risks">
                {preview.risks.map((risk) => (
                  <RiskRow key={risk.id} risk={risk} />
                ))}
              </ul>
            </SectionBlock>
          ) : null}

          {preview.channels.length > 0 ? (
            <SectionBlock title="Channels" count={preview.channels.length}>
              <ul className="city-world-preview-token-list" aria-label="Scout channels">
                {preview.channels.map((channel) => (
                  <li key={channel}>
                    <span className="city-world-preview-token">{formatLabel(channel)}</span>
                  </li>
                ))}
              </ul>
            </SectionBlock>
          ) : null}

          {preview.nextActions.length > 0 ? (
            <SectionBlock title="Next moves" count={preview.nextActions.length}>
              <ul className="city-world-preview-list">
                {preview.nextActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </SectionBlock>
          ) : null}
        </PreviewSections>
      </PreviewBody>

      <SessionFooter note={preview.upgradePrompt} advanceLabel="Preview 7-day campaign" {...(onAdvance ? { onAdvance } : {})} />
    </section>
  );
}

function CampaignPanel({ preview, onAdvance }: { preview: CampaignPreviewState; onAdvance?: () => void }) {
  return (
    <section
      className="city-world-preview"
      aria-label="Campaign preview"
      data-qa="preview-panel"
      data-qa-preview-kind="campaign"
      data-qa-day-count={preview.days.length}
    >
      <header className="city-world-preview-head">
        <span className="city-world-preview-kicker">7-day campaign · {preview.businessType}</span>
        <strong data-qa="preview-title">{preview.summary}</strong>
      </header>

      <PreviewBody>
        <PreviewSections>
          {preview.offer ? (
            <div className="city-world-preview-offer" data-qa="preview-best-offer">
              <span>Offer</span>
              <p>{preview.offer}</p>
            </div>
          ) : null}

          {preview.days.length > 0 ? (
            <CollapsibleSection title="7-day plan" count={preview.days.length}>
              <ol className="city-world-preview-days" data-qa="preview-days">
                {preview.days.map((day) => (
                  <li key={day.day}>
                    <span className="city-world-preview-day-num">{day.day}</span>
                    <div className="city-world-preview-day-body">
                      <strong>{day.label}</strong>
                      <p>{day.focus}</p>
                      <div className="city-world-preview-day-meta">
                        <span className="city-world-preview-token">{formatLabel(day.channel)}</span>
                        {day.proof ? <small>Proof: {day.proof}</small> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </CollapsibleSection>
          ) : null}

          {preview.assetPlaceholders.length > 0 ? (
            <CollapsibleSection title="Assets" count={preview.assetPlaceholders.length}>
              <ul className="city-world-preview-assets">
                {preview.assetPlaceholders.map((asset) => (
                  <li key={asset.id}>
                    <strong>{asset.label}</strong>
                    <span>
                      {formatLabel(asset.format)} · {asset.copyIntent}
                    </span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          ) : null}

          {preview.guardrails.length > 0 ? (
            <SectionBlock title="Guardrails" count={preview.guardrails.length}>
              <ul className="city-world-preview-list">
                {preview.guardrails.map((rail, index) => (
                  <li key={index}>{rail}</li>
                ))}
              </ul>
            </SectionBlock>
          ) : null}
        </PreviewSections>
      </PreviewBody>

      <SessionFooter advanceLabel="See hosting options" {...(onAdvance ? { onAdvance } : {})} />
    </section>
  );
}

function PreviewBody({ children }: { children: ReactNode }) {
  return (
    <ScrollArea.Root className="city-world-preview-scroll" type="auto" scrollHideDelay={260}>
      <ScrollArea.Viewport className="city-world-preview-viewport">
        <div className="city-world-preview-content">{children}</div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="city-world-preview-scrollbar" orientation="vertical">
        <ScrollArea.Thumb className="city-world-preview-thumb" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className="city-world-preview-corner" />
    </ScrollArea.Root>
  );
}

function PreviewSections({ children }: { children: ReactNode }) {
  const sections = Children.toArray(children).filter(Boolean);

  return (
    <>
      {sections.map((section, index) => (
        <Fragment key={index}>
          {index > 0 ? <Separator.Root className="city-world-preview-separator" decorative /> : null}
          {section}
        </Fragment>
      ))}
    </>
  );
}

function SectionBlock({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="city-world-preview-block">
      <div className="city-world-preview-section-head">
        <h3>{title}</h3>
        <span>{count}</span>
      </div>
      {children}
    </section>
  );
}

function CollapsibleSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Collapsible.Root className="city-world-preview-block city-world-preview-collapsible" defaultOpen>
      <Collapsible.Trigger type="button" className="city-world-preview-section-trigger">
        <span>{title}</span>
        <b>{count}</b>
        <i aria-hidden="true" />
      </Collapsible.Trigger>
      <Collapsible.Content className="city-world-preview-collapsible-content">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}

function SignalRow({ signal }: { signal: ScoutSignal }) {
  const score = Math.round(signal.score);

  return (
    <li>
      <div className="city-world-preview-signal-head">
        <span className={`city-world-preview-dot tone-${signal.tone}`} aria-hidden="true" />
        <strong>{signal.label}</strong>
        <span className={`city-world-preview-score tone-${signal.tone}`} aria-label={`Score ${score}`}>
          {score}
        </span>
      </div>
      <p className="city-world-preview-detail">{signal.detail}</p>
    </li>
  );
}

function RiskRow({ risk }: { risk: ScoutRisk }) {
  return (
    <li>
      <div className="city-world-preview-signal-head">
        <span className={`city-world-preview-dot severity-${risk.severity}`} aria-hidden="true" />
        <strong>{risk.label}</strong>
        <span className={`city-world-preview-severity severity-${risk.severity}`}>{formatLabel(risk.severity)}</span>
      </div>
      <p className="city-world-preview-detail">{risk.mitigation}</p>
    </li>
  );
}

function SessionFooter({ note, advanceLabel, onAdvance }: { note?: string; advanceLabel?: string; onAdvance?: () => void }) {
  return (
    <footer className="city-world-preview-foot">
      <div className="city-world-preview-boundary" data-qa="preview-session-boundary">
        Session preview. Nothing is saved, sent, or scheduled.
      </div>
      {note ? <p className="city-world-preview-upgrade">{note}</p> : null}
      {onAdvance && advanceLabel ? (
        <button
          type="button"
          className="city-world-recovery-action city-world-preview-advance"
          data-qa="preview-advance"
          onClick={onAdvance}
        >
          {advanceLabel}
        </button>
      ) : null}
    </footer>
  );
}

function formatLabel(value: string): string {
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === "qr_flyer") return "QR flyer";

  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word, index) => {
      if (word.toLowerCase() === "qr") return "QR";
      return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    })
    .join(" ");
}
