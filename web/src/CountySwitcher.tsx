import { sendUserMessage } from "./bridge";

export type CountySwitchSlug = "riverside-ca" | "orange-ca" | "made-up-ca";

type CountySwitchOption = {
  slug: CountySwitchSlug;
  label: string;
  status: string;
};

const COUNTY_SWITCH_OPTIONS: CountySwitchOption[] = [
  { slug: "riverside-ca", label: "Riverside", status: "Playable" },
  { slug: "orange-ca", label: "Orange", status: "Shell" },
  { slug: "made-up-ca", label: "Unknown", status: "Not indexed" },
];

const PRODUCT_PATH_STEPS: Array<{
  label: string;
  detail: string;
  action: "play" | "browse" | "lookup";
  countySlug?: CountySwitchSlug;
}> = [
  { label: "Play", detail: "Riverside now", action: "play", countySlug: "riverside-ca" },
  { label: "Browse", detail: "browse-only", action: "browse", countySlug: "orange-ca" },
  { label: "Lookup", detail: "not saved", action: "lookup" },
];

type CountySwitcherProps = {
  activeCountySlug: CountySwitchSlug;
  onSelectCounty: (countySlug: CountySwitchSlug) => void;
};

export function CountySwitcher({ activeCountySlug, onSelectCounty }: CountySwitcherProps) {
  const runProductPathAction = (step: (typeof PRODUCT_PATH_STEPS)[number]) => {
    if (step.countySlug) {
      onSelectCounty(step.countySlug);
      return;
    }

    void sendUserMessage("Lookup places near Eastvale, CA in Atlas. Keep results lookup-only, not saved, and not coverage proof.");
  };

  return (
    <nav className="city-world-county-switcher" aria-label="Atlas county coverage switcher" data-qa="county-switcher">
      <div className="city-world-county-switcher-options">
        {COUNTY_SWITCH_OPTIONS.map((option) => (
          <button
            key={option.slug}
            type="button"
            className={option.slug === activeCountySlug ? "is-active" : ""}
            aria-pressed={option.slug === activeCountySlug}
            data-qa={`county-switch-${option.slug}`}
            data-qa-county-slug={option.slug}
            onClick={() => onSelectCounty(option.slug)}
          >
            <span>{option.label}</span>
            <strong>{option.status}</strong>
          </button>
        ))}
      </div>
      <p data-qa="county-switcher-summary">Riverside is playable. Orange is browse-only. Lookups stay temporary.</p>
      <div
        className="city-world-product-path"
        aria-label="Riverside is playable. Orange is browse-only. Lookup places without saving."
        data-qa="public-product-path"
      >
        {PRODUCT_PATH_STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            data-qa={`public-product-path-${step.action}`}
            data-qa-public-path-action={step.action}
            onClick={() => runProductPathAction(step)}
          >
            <b>{step.label}</b>
            <em>{step.detail}</em>
          </button>
        ))}
      </div>
    </nav>
  );
}
