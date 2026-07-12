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

// QA-only affordance (opt-in via ?atlasCountySwitcher=1, see MapChrome) that
// proves the honest-coverage contract holds. Never shown to real users, so it
// stays terse: the three status labels ARE the information — no narration.
export function CountySwitcher({ activeCountySlug, onSelectCounty }: CountySwitcherProps) {
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
    </nav>
  );
}
