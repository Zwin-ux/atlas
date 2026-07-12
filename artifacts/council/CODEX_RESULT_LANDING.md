# Atlas Packet Landing Result

## Files

- `scripts/capture-marketing-shots.mjs`
- `site/index.html`
- `site/README.md`
- `site/assets/atlas-wordmark.svg` — 834 bytes
- `site/assets/riverside-ca-desktop-light.png` — 1,198,067 bytes, 1440x900
- `site/assets/riverside-ca-desktop-dark.png` — 1,244,345 bytes, 1440x900
- `site/assets/riverside-ca-mobile-light.png` — 308,180 bytes, 390x844
- `site/assets/riverside-ca-mobile-dark.png` — 314,867 bytes, 390x844
- `site/assets/miami-dade-fl-desktop-light.png` — 1,332,170 bytes, 1440x900
- `site/assets/miami-dade-fl-mobile-light.png` — 320,288 bytes, 390x844
- `site/assets/summit-co-desktop-light.png` — 1,306,777 bytes, 1440x900
- `site/assets/summit-co-mobile-light.png` — 275,645 bytes, 390x844
- `site/assets/loving-tx-desktop-light.png` — 1,214,801 bytes, 1440x900
- `site/assets/loving-tx-mobile-light.png` — 304,165 bytes, 390x844
- `site/assets/apache-az-desktop-light.png` — 1,214,738 bytes, 1440x900
- `site/assets/apache-az-mobile-light.png` — 287,762 bytes, 390x844

## Gates

- `node scripts/capture-marketing-shots.mjs` exits `0`.
- All written PNG files are non-empty.
- All marketing PNG files report requested dimensions: desktop `1440x900`, mobile `390x844`.
- Copy scan found no banned marketing phrases: `reimagine`, `unleash`, `supercharge`, `seamless`, `empower`, `leveraging`, `revolutionary`.
- No external fonts, frameworks, or CDNs are used. External links are only footer legal links.

Capture note:
Live CDP capture failed on this host before the first page capture:
`riverside-ca-desktop-light.png failed while enabling CDP domains: CDP request timed out after 30000ms: Page.enable`.
The script fell back to existing emulator audit captures and normalized them with the local `ffmpeg` binary. The JSON output reports `source: "audit-fallback"` and source paths for each PNG.

## Copy Inventory

- `ChatGPT app` — true as the submitted product surface; directory listing launch is still future.
- `Explore Riverside County as a voxel diorama in ChatGPT` — true for the curated Riverside/Eastvale app surface.
- `generated draft previews for indexed US counties` — true as non-playable generated previews for indexed counties, not public-quality coverage.
- `Open in ChatGPT` — present as a disabled future deep-link slot, so it does not claim live click-through.
- `Ask for any US county` — true as a request pattern; the following sentence scopes the response to playable, shell, or unsupported status.
- `Riverside opens as the curated map` — true.
- `Indexed counties can show generated draft previews` — true, with the honesty section limiting them to generated previews.
- `Pins and notes stay in your chat` — true for the V1/session-only surface.
- Regional captions naming Miami-Dade County, Summit County, Loving County, and Apache County — true county names; the draft labels are visual descriptors, not coverage claims.
- `Things live in this chat` — true and copied in tone from `chatgpt-app-submission.json`.
- `Atlas does not save state, provider data, XP, accounts, checkout, posts, messages, ad buys, scraped lists, or live campaign execution` — true for the current public V1 app surface.
- `Generated draft previews are synthetic, session-only, non-playable, provider-free, and not local truth. They are not real coverage.` — true current boundary.
- `Google Maps Platform is used read-only for place lookups only; lookup results are not scene geometry or coverage proof` — true current provider boundary.
- Privacy and Terms links point to the recorded production Railway domain; live HTTP availability was not rechecked in this run.

## Design Decisions

- Static first-party product page: one HTML file, inline CSS, system font stack.
- Neutral chrome only: no gradients, no glow effects, no feature-card grid, no generic SaaS hero.
- Screenshots carry the color; surrounding UI uses quiet spacing, hairlines, and restrained type.
- Dark mode uses `prefers-color-scheme` and switches the Riverside hero capture to the dark screenshot.
- Button is disabled with `data-slot="chatgpt-deep-link"` so the future directory deep link has a stable insertion point.

## Risks

- Live CDP capture is currently blocked by local Chromium behavior. The script has a transparent audit-artifact fallback, but a reviewer should rerun live CDP on a stable browser host before treating the captures as freshly regenerated.
- Fallback mobile images preserve the full audit source inside `390x844`, which creates neutral top/bottom padding because the audit source aspect ratio differs from the requested mobile viewport.
- The hard fence prevented the normal Atlas docs/build-log updates.
