# Owner Finish Runbook — Atlas County Scout submission

Written 2026-07-17 after the 0.78-2A production release (`89f7230` live,
release gate 14/14, public sanity 3/3, live routes verified). Everything
below is human-gated; each step says exactly what to do and what proof to
expect. Copy sources: `chatgpt-app-submission.json` + `docs/SUBMISSION_CHECKLIST.md`.

## 1. Worker deploy (5 min, certified ready)

The hardened worker answers `/health` and `/ready` on `$PORT` itself, so the
old healthcheck crash-loop cannot recur. Run:

```
powershell -ExecutionPolicy Bypass -Command "Set-Location 'C:/Users/mzwin/Documents/atlas-deploy-worktree'; $env:ATLAS_DEPLOY_WORKER='1'; ./scripts/release-deploy.ps1 -ExpectedSha (git rev-parse HEAD) -ExpectedUpdateId postalpha-0.78-1v-chatgpt-plugin-submission-rc"
```

The worktree is kept at the certified release head (the SHA is computed
inline). This deploy also ships the mobile place-sheet tap fix and the
public ops-surface trim alongside the worker.

Before running it, set the ops token (new, required for the release gate's
stats check against the trimmed prod):

```
railway variables --set ATLAS_OPS_TOKEN=<generate a long random string> --service atlas-backend --skip-deploys
$env:ATLAS_OPS_TOKEN='<same string>'   # in the shell that runs release-deploy
```

Rollback, if a deploy ever goes wrong: `git -C C:/Users/mzwin/Documents/atlas-deploy-worktree checkout --detach <last-good-sha>` then re-run the deploy command (Railway redeploys that SHA).

Expect: backend redeploy SUCCESS (same SHA), worker deploy SUCCESS, release
gate 14/14, sanity 3/3. Then confirm worker readiness in Railway logs
(`scene_packet_worker_health_started`).

## 2. Portal draft + domain verification

1. Open the plugin portal with an account that has **Apps Management: Write**
   in a **global data residency** project.
2. Create a **With MCP** draft named **Atlas County Scout** (subtitle
   "Explore voxel county maps", category Business). Paste description, URLs,
   and support email from `chatgpt-app-submission.json` `app_info`.
3. Upload `assets/brand/atlas-icon-512.png`.
4. Copy the portal-issued domain challenge token, then:
   `railway variables --set ATLAS_OPENAI_APPS_CHALLENGE_TOKEN=<token>` on
   `atlas-backend` and redeploy/restart. Verify
   `https://atlas-backend-production-e6fc.up.railway.app/.well-known/openai-apps-challenge`
   returns exactly the token as plain text (it 404s until configured).
5. MCP URL `https://atlas-backend-production-e6fc.up.railway.app/mcp`,
   authentication **NONE**, availability **United States**.
6. **Scan Tools** — expect exactly seven tools with schemas, annotations,
   and the widget resource `ui://widget/atlas-city-world-0781v.html`.
7. Enter the four starter prompts and the release notes from
   `plugin_submission`.

## 3. G8 battery in real ChatGPT (web AND mobile)

Five positive (from `test_cases`):

1. "Open Atlas for Riverside County and show Eastvale." → interactive map.
2. "Refresh the Atlas board for Riverside County and keep focus on Eastvale."
3. "Find real nearby service businesses around Eastvale and group them into
   Atlas categories." → normalized places, no raw provider fields.
4. "Where is Homestead on the Miami-Dade County Atlas preview?" → real
   Census anchor + map focus + generated-layout boundary statement.
5. "Drop Clawd in Eastvale for a mobile detailing business, build the first
   7-day manual plan, and tell me whether this work is saved." → scout +
   plan + honest not-saved answer, no checkout.

Three negative (must NOT trigger / must refuse): Palm Springs trip planning;
scrape-and-DM every place; charge-my-card checkout.

National-anchor spot checks: Jefferson County AL (Birmingham/Hoover),
Loving County TX (Mentone), Toa Baja Municipio PR (diacritics), Kalawao HI.

Also recheck the four OPEN real-host findings from
`docs/G8_REAL_CHATGPT_FINDINGS.md` during the same session:

- **G8-4**: tap the expand button — does fullscreen/expanded mode work from
  a real gesture? Does map drag fight chat scroll?
- **G8-5**: time the FIRST tool call of the session (was 31s of model
  deliberation on 07-11 — note whether it improved).
- **G8-6**: watch whether the model narrates internal tier codes or slugs
  in its prose (it should speak product language only).
- **G8-7**: confirm the icon/SVG assets render in the sandbox (CSP recheck).

Note: G8 does NOT need the portal — connect the prod MCP as a dev-mode app
in ChatGPT settings first (same mechanism as the 07-11 session) and run the
battery before the portal draft exists.

Capture: screenshot each result on desktop + 390x844 mobile. Claude can
live-tail Railway logs during the run and assemble the G8 evidence packet.

## 4. Submit

Identity verified, permissions confirmed, then Submit. Approval is not
publication — publish the approved version from the portal afterward.

## Filed polish (not blockers)

- Town-anchor labels can land on water when the Census centroid is coastal
  (seen: Mansión del Mar, toa-baja-municipio-pr). Follow-up: clamp anchor
  label placement to the nearest land tile. Honest today — the limitation
  copy already discloses approximate placement.
