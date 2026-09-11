# Atlas Fieldbook design specification

**Status:** Proposed for user review  
**Date:** 2026-08-27  
**Parent direction:** `docs/superpowers/specs/2026-08-26-atlas-playable-maproom-design.md`  
**Planning authority:** `docs/brain/PROJECT_PLAN.md`  
**Visual authority:** `DESIGN.md`

This specification records an approved product foundation for review. It does
not authorize implementation yet and does not silently replace the current
read-only rules in `AGENTS.md` or `docs/brain/PROJECT_PLAN.md`.

## Product sentence

**One map, one mark, one note.**

A person focuses a real Atlas feature, writes one short private note, and sees
that place acquire a quiet ink mark. After Save, ChatGPT can use the saved note
inside that conversation. The map remains the product.

## Why this exists

The Playable Maproom lets a person and an agent operate the same live map, but
the relationship ends when the view changes. A private margin note gives the
map one piece of memory without turning Atlas into a dashboard, document tool,
or public social layer.

The user-facing test is simple: can someone mark a real place, close the note,
keep exploring, and later ask ChatGPT what they marked?

## Product-law boundary

The current canonical Atlas plan prohibits notes, writes, and persistence.
This proposal introduces one narrow exception only after explicit approval:

- private state owned by the current rendered ChatGPT widget/conversation;
- no Atlas account, database, public endpoint, or public note surface;
- no new WebMCP page tool and no change to the three read-only map tools;
- no promise of cross-chat, cross-device, or long-term durability in v1.

Before implementation, approval requires a deliberate reconciliation pass over
`AGENTS.md`, `docs/brain/PROJECT_PLAN.md`, public privacy/terms copy, and any
README claim that says Atlas never stores notes. Public Commons and its server
write paths remain retired and prohibited.

## Visible product contract

### The whole interaction

1. Focus a real county or place already represented by an Atlas feature ID.
2. Activate the small **Add note** action attached to the focus label.
3. Write 1–280 Unicode code points in one plain-text field.
4. Choose **Save** or **Cancel**.
5. Save closes the composer and leaves a quiet ink mark on the feature.
6. Focusing that marked feature reveals the note and **Edit** / **Delete**.

That is the complete v1 interface.

### What the user sees first, second, and third

```text
1. MAP
   └── 2. one focused real feature
       └── 3. one contextual action or one note composer
```

There is no notebook screen, toolbar, layer panel, folder tree, activity feed,
tag editor, collaboration UI, or Figma-style free canvas.

### Visual behavior

- The existing orange reticle remains the only active signal.
- An unfocused saved note becomes a neutral dark-ink tick or ring, never a
  second orange focus signal.
- Note marks have no permanent text label and do not compete with place names.
- The composer looks like a narrow paper margin slip, not a card or modal.
- Texture, type, spacing, and controls follow `DESIGN.md` and the Survey Relay
  concept art.
- Adding or reading a note never replaces, dims, or shrinks the map.

### Desktop

The composer attaches to the safest nearby viewport margin with a 280–320px
measure. It may use a hairline leader to the focused feature. It avoids labels,
the scale, and zoom controls. The map remains interactive outside the composer,
but changing focus with an unsaved draft invokes the draft rule below.

### Phone

The composer is a bottom sheet no taller than 36dvh before the software
keyboard appears. With a reduced visual viewport, the sheet uses available
height and scrolls internally; it never creates a white tail below the map.
The text field, Save, Cancel, Edit, and Delete targets are at least 44px.

## Interaction state model

```text
UNMARKED + focused
    |
    +-- Add note --> DRAFTING -- Save --> SAVED + focused
                         |                    |
                         +-- Cancel ----------+-- unfocus --> MARKED
                                              |
MARKED + focused --> READING -- Edit --> DRAFTING_EXISTING
                              -- Delete --> CONFIRM_DELETE --> UNMARKED
```

Only one composer or reader is open at a time. Only one feature is actively
focused. Multiple saved marks may exist, but none use the orange active color
unless focused.

### State coverage

| State | What the person sees | Recovery |
| --- | --- | --- |
| No note | Focus label plus `Add note` | Continue using the map |
| Drafting | One field, character count near the limit, Save, Cancel | Cancel returns to focused map |
| Saving | Save disables for one short commit; map stays visible | Inline retry if host-state commit fails |
| Saved | Composer closes; focused reticle remains; note is readable | Edit or continue exploring |
| Marked, unfocused | One neutral ink mark with an accessible name | Focus the feature to read |
| Invalid draft | Save remains disabled; short direct message | Enter 1–280 characters |
| Unsaved focus change | Small discard/keep-editing choice | No silent draft loss |
| Delete | Compact confirmation beside the note | Cancel keeps the note |
| Host state unavailable | `Notes are unavailable here`; map remains usable | Continue without notes |
| Corrupt stored state | Ignore invalid note records; map remains usable | Development log records schema error |

## Draft rule

Draft text remains private UI state. It is never placed in model-readable
context. If the person changes focus or closes the composer with a non-empty
draft, Atlas asks once whether to discard it or keep editing. Empty drafts close
without confirmation.

The host-state adapter may preserve the active draft across a widget rerender,
but v1 does not promise restoration after the conversation or rendered widget
instance is gone.

## Saved-note data contract

The product model stays smaller than the future scrapbook model. Do not add
unused attachment, folder, canvas-position, or user-tag fields to v1.

```ts
type AtlasFieldbookNoteV1 = {
  schemaVersion: 1;
  id: string;
  anchor: {
    featureId: string;
    kind: "county" | "place";
    label: string;
    level: "nation" | "state" | "county";
    state?: string;
    countySlug?: string;
  };
  body: string;
  visibility: "chat_private";
  revision: number;
  createdAt: string;
  updatedAt: string;
};

type AtlasFieldbookStateV1 = {
  schemaVersion: 1;
  notes: AtlasFieldbookNoteV1[];
  draft: {
    featureId: string;
    body: string;
    editingNoteId?: string;
  } | null;
};
```

Rules:

- `featureId` uses the stable Atlas feature namespace from the Playable Maproom.
- One feature owns at most one v1 note. Saving again edits that note.
- IDs are generated locally and are opaque outside the widget state.
- Revisions increase on each saved edit. Draft changes do not increment them.
- Timestamps are metadata, not user-facing chrome.
- The body is plain text. No Markdown rendering, links, mentions, or HTML.
- The state decoder rejects unknown versions and invalid records without
  breaking the map.

## ChatGPT context boundary

Atlas keeps two projections of the same state:

```text
private widget state                     model-readable saved context
--------------------                     ----------------------------
full saved notes ----------------------> bounded saved-note projection
active draft --------------------------> never included
composer/read UI state ----------------> never included
development events --------------------> never included
```

Drafts remain private. Explicit Save is the privacy boundary. After Save, the
model-readable projection includes only note ID, stable place anchor, body,
visibility, and revision. This lets a person ask questions such as “what did I
mark near Riverside?” without exposing transient UI state.

The model projection is deterministic, schema-versioned, and bounded. If the
host cannot accept model-readable state, the note may remain UI-private but the
interface must say so rather than imply ChatGPT can recall it.

Host widget state is convenience state for one rendered UI instance, not an
Atlas database. Durable business storage remains a future phase that requires
Atlas-controlled authentication, storage, export, and deletion.

## Logging and tagging contract

“Log and tag each thing” is implemented as typed metadata and decision records,
not visible analytics furniture.

### Note metadata

Every note carries a stable note ID, feature ID, anchor kind, visibility,
revision, and timestamps. V1 has no user-facing tags. Geographic metadata is
the tag system; duplicating it in a free-form tag array would create drift.

### Development events

The implementation emits a small typed event vocabulary to the existing
development-only widget diagnostics seam:

```ts
type AtlasFieldbookEventV1 = {
  type:
    | "fieldbook_opened"
    | "note_draft_started"
    | "note_saved"
    | "note_edited"
    | "note_deleted"
    | "note_opened"
    | "note_commit_failed";
  noteId?: string;
  featureId: string;
  revision?: number;
  source: "pointer" | "keyboard" | "touch" | "agent";
  occurredAt: string;
};
```

Events never contain the note body. They are not sent to an analytics service
in v1 and are absent from production UI. Their purpose is deterministic tests,
debugging, and later instrumentation without retrofitting unnamed events.

### Requirement IDs

Implementation tasks and acceptance tests reference stable requirement IDs:

| ID | Requirement |
| --- | --- |
| `FB-UX-01` | Focused real feature exposes one contextual `Add note` action |
| `FB-UX-02` | Composer never replaces or shrinks the map |
| `FB-UX-03` | Saved inactive marks use neutral ink; only focus uses orange |
| `FB-STATE-01` | Draft stays private until explicit Save |
| `FB-STATE-02` | One note per stable feature ID with monotonic revisions |
| `FB-STATE-03` | Invalid or corrupt state cannot break map interaction |
| `FB-CTX-01` | Saved note projection is bounded and model-readable |
| `FB-PRIV-01` | No raw note body enters events, logs, URLs, or server requests |
| `FB-A11Y-01` | Full flow works by keyboard and named controls |
| `FB-MOB-01` | Phone composer survives the reduced visual viewport |

## What already exists

- `web/src/atlas/AtlasApp.tsx` and `AtlasPlate.tsx` own the current map-first
  surface. Fieldbook extends this surface rather than reviving the retired app.
- The Playable Maproom spec already defines stable feature IDs, shared focus,
  controlled viewport state, and human/agent parity. Fieldbook depends on that
  foundation.
- The host bridge and emulator already provide the correct seam for a small
  widget-state adapter and deterministic host-unavailable tests.
- Retired `web/src/App.tsx` contains useful historical examples of chat-scoped
  widget state. Reuse only the verified state-management lesson, not its UI or
  Commons behavior.
- `server/src/atlasCommons/` contains retired public-note infrastructure. It is
  explicitly excluded and must not be imported, reactivated, or used as a
  shortcut.

## Architecture boundary

Fieldbook v1 belongs entirely in the current Atlas web/widget layer:

```text
real Atlas feature
       |
       v
fieldbook reducer <---- pointer / touch / keyboard
       |
       +----> note mark + composer in current map renderer
       |
       +----> host widget-state adapter
                    |
                    +---- private full state
                    +---- model-readable saved projection

No Atlas server route. No database. No MCP tool. No public write.
```

Use one pure fieldbook reducer plus one host adapter. Do not put note rules into
map geometry, plate fetching, or server resolution. Do not create a generic
plugin system or storage abstraction for the future scrapbook.

## Failure modes

| Failure | User impact | Required behavior |
| --- | --- | --- |
| Host commit rejects | Note could appear saved but disappear | Keep composer open, show retry, do not announce success |
| Widget rerenders during draft | Draft could disappear | Restore valid private draft for that rendered instance |
| Feature ID becomes stale after a plate change | Mark could attach to the wrong place | Match only exact stable ID; keep unmatched note stored but unrendered |
| Duplicate Save gesture | Duplicate notes or revisions | Serialize commit; one feature still has one note |
| Invalid stored body or schema | Map could crash on load | Decode defensively and ignore invalid records |
| Development event captures body | Private text leaks into logs | Event type structurally has no body field; test serialized events |
| Keyboard focus enters closing composer | Person becomes stranded | Return focus to the anchored feature |
| Phone keyboard reduces viewport | Composer or Save disappears | Use visual viewport; sheet scrolls internally |

## Verification plan

### Unit

- Reducer transitions for create, edit, cancel, save, delete, duplicate Save,
  one-note-per-feature, revisions, and invalid input.
- Decoder behavior for missing, corrupt, oversized, and unknown-version state.
- Model projection excludes drafts and UI state and includes saved-note fields
  only.
- Event serialization proves no event can contain a note body.

### Component and integration

- Focused county/place exposes Add note; an unfocused feature does not.
- Save, retry, edit, delete, unsaved-focus-change, and host-unavailable states.
- Host adapter failure never produces a false saved state.
- A human-created note becomes model-readable only after Save.
- Existing focus, pan, drill, loading, ambiguity, and map controls still work.
- Orange-signal count remains exactly one in a focused view.
- Keyboard focus return, live-region announcements, 44px targets, and reduced
  motion behavior.

### End to end

1. Focus Riverside, add “Meet near the museum,” Save, keep exploring, and ask
   ChatGPT what was marked.
2. Begin a draft, change focus, keep editing, then Cancel without losing map
   position.
3. Reload the same rendered widget state and confirm the saved mark restores;
   do not claim cross-chat restoration.
4. Repeat create, read, edit, and delete at 390x844 and a reduced 390x520
   visual viewport.
5. Run the same map in a host without widget state; notes are unavailable but
   the Playable Maproom remains complete.

## NOT in scope

- Cross-chat or cross-device storage. This is phase B and needs auth plus an
  Atlas-owned notebook service.
- Photos, attachments, stickers, freehand drawing, spatial canvas objects, or
  Figma-like collaboration.
- User-facing tags, folders, collections, search, or a notebook index.
- Public notes, shared maps, moderation, reactions, or the retired Commons.
- New server endpoints, databases, accounts, or an MCP write tool.
- Analytics transport or storage of note bodies.
- Multiple notes on one feature.

## Phase B compatibility, without phase B code

The v1 contract preserves only the fields future storage actually needs:
stable note ID, stable place anchor, visibility, revision, and timestamps.
Phase B may migrate these records into an authenticated Atlas notebook and add
photos, tags, collections, export, deletion, and cross-chat lookup.

Do not add those services or fields now. The production seam is the explicit
state decoder and model projection, not a speculative storage framework.

## Production sequence after approval

1. Reconcile product law and public privacy copy before behavior changes.
2. Implement the pure reducer, decoder, model projection, and tests.
3. Implement the host adapter and emulator failure cases.
4. Add the restrained desktop and phone interaction to the current Atlas map.
5. Run design review, engineering review, visual QA, real-host verification,
   and the existing Brain/location/submission gates.

Production begins only after the user approves this specification. At that
point Luna agents may work in isolated lanes from the same frozen contracts;
no agent may revive Commons or independently redesign the visible interaction.

## Decision log

- **FB-D01, 2026-08-27:** Choose margin notes before scrapbook/canvas features.
- **FB-D02, 2026-08-27:** Keep the map dominant: one map, one mark, one note.
- **FB-D03, 2026-08-27:** Drafts are private; explicit Save makes a bounded
  saved projection readable by ChatGPT in that conversation.
- **FB-D04, 2026-08-27:** V1 uses widget-owned state only and makes no durable
  cross-chat or cross-device promise.
- **FB-D05, 2026-08-27:** V1 has no visible tags or notebook chrome; structured
  metadata, requirement IDs, and body-free development events provide the
  requested logging and traceability.

