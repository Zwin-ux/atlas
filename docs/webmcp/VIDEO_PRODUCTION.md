# Atlas WebMCP Demo Production

## Picture lock

The opening and thumbnail are the national three-stop trail in `artifacts/webmcp-release-proof/39d1e141-20260902/06-webmcp-trail-desktop.png`. It is the strongest single frame because it shows the map, ordered route, active stop, editable research rail, session note, and completed agent activity at once.

The final contest cut remains the 2:45 sequence in `VIDEO_SCRIPT.md`. The local 1:14 proof cut is an editorial timing check made only from verified product captures. It deliberately does not fabricate ChatGPT chrome, a tool picker, or a conversation transcript.

## Honest shot boundary

| Beat | Local proof available | Final replacement required |
| --- | --- | --- |
| Trail creation | Real Chrome WebMCP result and visible-completion proof | ChatGPT prompt and returned call in the same continuous recording |
| Human-to-agent handoff | Real human-selected Miami-Dade state and Chrome state-read assertion | ChatGPT response that reads the human-selected county |
| Springfield | Real labeled ambiguity UI and unchanged-state assertion | ChatGPT `search_places` call followed by deliberate `open_place` |
| Place note | Real visible editable note and WebMCP write proof | ChatGPT note call plus the human edit/read-back |
| Atomic failure | Real failed-tool result and independent snapshot equality | ChatGPT failed trail call plus independent state read |
| Exact five | Descriptor fixture and Chrome discovery proof | ChatGPT Site Tools picker showing exactly five names |
| Fallback | Real normal-browser frame | None |

The six ChatGPT replacements must come from one authenticated, user-controlled session prepared by `pnpm e2e:chatgpt:session`. Account chrome, credentials, and unrelated tabs stay out of frame. The transcript and screenshots must pass `pnpm e2e:chatgpt:transcript` before the footage is described as real ChatGPT acceptance.

## Local review cut

Record the narration in `VIDEO_NARRATION.txt` as one natural take, then assemble:

```powershell
pnpm demo:webmcp:assemble -- --audio C:\absolute\path\to\voiceover.wav --candidate 39d1e1413e72ea050845ffbaa6323fffeb8c28f1 --out .evals\webmcp-demo\39d1e141-review
```

The assembler writes `atlas-webmcp-proof-cut.mp4`, a sidecar `.srt`, and `manifest.json`. It rejects a missing audio track, a non-1280x720 render, or a runtime at or above three minutes. The manifest hashes every source frame, the audio, captions, and output video.

This cut uses restrained slow crop motion only. It does not animate map facts, fake cursor actions, or imply that a still frame is a live tool invocation.

## Final edit rules

- Start on the completed route; no title animation before the product.
- Use hard cuts or eight-frame paper dissolves. No generic glow, parallax map distortion, fake loading, or decorative motion graphics.
- Keep the map readable at normal playback. Never zoom past the county labels needed for the claim.
- Use captions as a sidecar or burn them with high-contrast ink text on a warm-paper plate; no karaoke highlighting.
- Keep product audio clean and narration forward. Do not add music unless it remains quiet enough that every word is obvious on laptop speakers.
- End on the trail overview with the live URL. Add a public source URL only after the owner makes the sanitized repository public.
- State `Session-only notes and trails` once. Do not claim turn-by-turn routing, saved notebooks, global geography, or generated city detail.
- Watch the exported MP4 from beginning to end with sound before publication. Check duration, URL, tool names, edit continuity, caption timing, and account-data cropping.

## Publication gate

The local proof cut is not publishable as the final challenge demo. Publication requires all of the following:

1. A captured and validated real ChatGPT Site Tools session.
2. Replacement of every reserved ChatGPT beat in the shot table.
3. Participant-recorded or participant-approved narration.
4. A full-speed watch with sound and caption review.
5. Exact live URL, public source URL, and candidate SHA reconciliation.
6. Separate owner approval to upload or publish the video.
