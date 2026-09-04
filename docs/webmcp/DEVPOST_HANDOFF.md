# Atlas Devpost Handoff

## Live status

- Event: **The WebMCP Challenge**
- Live phase fetched at `2026-09-04T00:53Z`: `submissions_open`
- Official extension announcement: **September 4, 2026 at 1:00 AM Pacific**
- Reason stated by the organizer: an ongoing OpenAI outage
- Tracks: none
- Judging criteria, weighted equally: WebMCP Leverage, Execution, Potential Impact, Creativity & Ambition
- Account preflight: no listed project is currently connected to the WebMCP Challenge; nothing has been submitted by this workflow

Do not rely on this file alone at the final click. Re-read the live phase and requirements immediately before any Devpost write.

## Four required deliverables

1. A working live URL accessible in ChatGPT's in-app browser or Chrome with WebMCP enabled.
2. A description that explains the WebMCP fit, user-experience improvement, new human-agent capability, and implementation.
3. A public YouTube demo under three minutes with audio that covers the product and WebMCP use.
4. A public GitHub, GitLab, or Bitbucket repository containing the functional source/assets/instructions and a detectable open-source license.

Atlas has the working no-login URL and complete description draft. Apache-2.0 and clean-clone proof exist in the sanitized repository. The public repository, real ChatGPT demo footage, public YouTube URL, and Devpost record are not complete.

## Judge story

> Atlas is a shared geographic canvas where a person explores U.S. counties while ChatGPT reads and changes the same live map through five browser-native WebMCP tools.

Lead with the national three-stop trail. It proves the map quality, ordered agent action, visible completion, and editable human artifact in one frame. The key demo is the handoff: ChatGPT creates the trail, the person opens Miami-Dade by hand, and ChatGPT's next state read sees that human change.

Avoid the weaker framing “a map plugin.” Atlas is a complete no-login atlas that gains shared-control capabilities when WebMCP is available.

## Known submission fields

- Project name: **Atlas**
- Tagline: **Explore a county with a person and an agent on the same live map.**
- App status: **Existing**
- Live URL: `https://atlas-webmcp-production.up.railway.app/explore`
- License: **Apache-2.0**
- Source target: `https://github.com/Zwin-ux/atlas-webmcp-challenge` — currently private
- Thumbnail: `artifacts/webmcp-release-proof/39d1e141-20260902/06-webmcp-trail-desktop.png`
- Canonical description and field copy: `docs/webmcp/SUBMISSION.md`
- Final video plan: `docs/webmcp/VIDEO_SCRIPT.md`
- Production truth boundary: `docs/webmcp/VIDEO_PRODUCTION.md`
- Challenge-period disclosure: `CHALLENGE_DELTA.md`

Owner-only answers still needed:

- Submitter Type: Individual, Team of Individuals, or Organization
- Country of residence for every submitter
- Learning derived: None, Moderate, or Significant
- Career AI value: Yes or No

Do not infer these answers.

## Candidate identity

- Deployed/private-remote runtime: `39d1e1413e72ea050845ffbaa6323fffeb8c28f1`
- Active Railway deployment: `cd899386-c7b4-4f1c-816d-1bf6e67e20fa`
- Last fully verified unpublished documentation/evidence candidate before this handoff: `14970b815b81b97cae0cb8bc67f87321b38f20b7`
- Source branch: `webmcp-challenge`
- Challenge baseline: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`

Before public visibility, regenerate the sanitized repository from the final source commit and repeat the clean-clone proof. If that produces a new candidate SHA, record it here, in `RELEASE_PACKET.md`, in the public README, and in the video end card. Do not silently present different source/runtime identities as one build.

## Critical path

### 1. Real ChatGPT capture

- Sign in through the user-controlled ChatGPT desktop session.
- Run `pnpm e2e:chatgpt:session` and follow its generated `RUNBOOK.md`.
- Capture the exact-five picker, three-stop trail, human stop-two handoff/read-back, Springfield candidate recovery, note write/edit/read-back, and failed-trail unchanged-state read.
- Keep call IDs, timestamps, bounded inputs/results, and evidence images inside the ignored session folder.
- Run `pnpm e2e:chatgpt:transcript` and `pnpm e2e:chatgpt`.
- Do not export cookies, tokens, or account data.

### 2. Final video

- Replace every reserved ChatGPT beat identified in `VIDEO_PRODUCTION.md`.
- Use the national-trail frame first and as the thumbnail.
- Record or approve the narration; the local draft voice exists only for timing.
- Keep the final under three minutes and public on YouTube.
- Watch the complete upload with sound; verify captions, live URL, public source URL, and no private chrome.

### 3. Public source gate

Proposed action: make only `Zwin-ux/atlas-webmcp-challenge` public after a final sanitized regeneration and remote-tree review.

Evidence required:

- frozen clean-clone install, typecheck, build, 38/38 verifier, Chrome smoke, and release audit;
- Gitleaks full-history zero findings;
- Apache-2.0 detected and visible in the About panel;
- README image, live URL, challenge delta, and run instructions render logged out;
- no historical Atlas repository or unrelated system exposed.

Risk: public disclosure cannot be made retroactively private for anyone who already cloned it.

Rollback: immediately return the sanitized repository to private. Do not rewrite or expose the historical repository.

### 4. Video publication gate

Proposed action: upload the participant-approved final cut to YouTube as a public video.

Evidence required: runtime below three minutes; audible approved narration; real ChatGPT agent action; actual product footage; no setup/dead air/private account data; correct live/source URLs.

Risk: a public video is externally downloadable and must match the submission exactly.

Rollback: remove the upload before submission, produce a corrected final, and update the draft URL. Do not swap the video after the extended deadline.

### 5. Devpost submission gate

Proposed action: create or update the Atlas project with the approved fields, attach the public source and YouTube URLs, then submit it to `webmcp`.

Evidence required: all required owner answers; public logged-out URL checks; unchanged live candidate; submitted project state returned by Devpost; final project page opened and checked.

Risk: after the extended deadline the submission, repo, video, and live site must remain unchanged through judging.

Rollback: before the deadline, correct a saved draft or withdraw an incorrect submission if Devpost permits. After the deadline, do not mutate the submitted materials.

## Final fifteen-minute check

- Live Devpost phase still says submissions open.
- Live Atlas route returns 200 with no login.
- ChatGPT in-app browser discovers exactly five Atlas tools.
- Public repository opens in a logged-out window and visibly identifies Apache-2.0.
- Public YouTube video plays with audio and is under three minutes.
- Description names the existing-project delta and exact-five shared-controller design.
- Thumbnail is the national trail, not the historical voxel city.
- Submitter/country/learning answers are the participant's own.
- Devpost project shows **Submitted**, not draft.
- After submission, preserve repo, video, and live site unchanged through judging.
