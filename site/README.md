# Atlas Static Landing Page

This folder is a static marketing surface for the ChatGPT directory listing.
`index.html` is self-contained: inline CSS, no JavaScript framework, no external
fonts, and no CDN dependencies. Image assets live in `site/assets`.

## Regenerate Captures

The capture script uses the local production emulator. The Atlas server must be
running before capture.

Default server:

```powershell
$env:PORT = "8787"
node node_modules/tsx/dist/cli.mjs server/src/index.ts
```

Then run:

```powershell
node scripts/capture-marketing-shots.mjs
```

If port `8787` is unavailable or down during an agent run, start the server on a
separate port and point the script at that base URL:

```powershell
$env:PORT = "8788"
node node_modules/tsx/dist/cli.mjs server/src/index.ts
node scripts/capture-marketing-shots.mjs --base http://127.0.0.1:8788
```

The script writes deterministic PNG files to `site/assets` and asserts that each
file is non-empty and has the expected dimensions.

If live CDP capture fails on the local Chromium build, the script falls back to
the latest `artifacts/emulator/audit` PNGs and normalizes them to the marketing
dimensions with the local `ffmpeg` binary. The JSON output names this as
`audit-fallback` and includes the original source path.

## Deploy Notes

Deploy `site/` as a plain static site. No build step is required for the landing
page itself. Keep `/privacy` and `/terms` available on the production domain.

GIF or screen-recording assets are a follow-up. That pipeline should use
`ffmpeg`, but no dependency has been added here.
