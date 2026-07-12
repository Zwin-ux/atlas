import { useState } from "react";

export type CountySwitchSlug = "riverside-ca" | "orange-ca" | "made-up-ca";

type CountySwitchOption = {
  slug: CountySwitchSlug;
  label: string;
  status: string;
};

const COUNTY_SWITCH_OPTIONS: CountySwitchOption[] = [
  { slug: "riverside-ca", label: "Riverside", status: "Full map" },
  { slug: "orange-ca", label: "Orange", status: "Preview" },
  { slug: "made-up-ca", label: "Unknown", status: "Unavailable" },
];

type CountySwitcherProps = {
  activeCountySlug: CountySwitchSlug;
  onSelectCounty: (countySlug: CountySwitchSlug) => void;
};

export function CountySwitcher({ activeCountySlug, onSelectCounty }: CountySwitcherProps) {
  const [coverageExpanded, setCoverageExpanded] = useState(false);

  return (
    <nav
      className={coverageExpanded ? "city-world-county-switcher is-expanded" : "city-world-county-switcher"}
      aria-label="Atlas county coverage switcher"
      data-qa="county-switcher"
    >
      <div className="city-world-county-switcher-options" id="city-world-county-switcher-options">
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
      <button
        type="button"
        className="city-world-coverage-chip"
        aria-expanded={coverageExpanded}
        aria-controls="city-world-county-switcher-options"
        data-qa="county-switcher-summary"
        onClick={() => setCoverageExpanded((current) => !current)}
      >
        Riverside is fully explorable. Other counties preview as outlines. Pins and notes stay in this chat.
      </button>
    </nav>
  );
}
