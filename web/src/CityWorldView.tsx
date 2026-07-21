import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import type { CampaignPreviewState, ScoutPreviewState } from "@atlas/core/scout";
import {
  CITY_WORLD_TILE_BASIS,
  compileCityWorldScene,
  cityWorldDiamondPoints,
  projectCityWorldPoint,
  type CityWorldPin,
  type CityWorldPlace,
  type CityWorldScene,
  type VoxelNote,
  type VoxelScene,
  type VoxelSticker,
  type VoxelStickerKind,
} from "@atlas/core/voxel";
import type { CityWorldRendererHandle } from "./CityWorldRenderer";
import { useOpenAiDisplayMode } from "./bridge";
import { HostedClawdTray } from "./HostedClawdTray";
import { MapChrome, readRequestedCameraPreset, readRequestedDebugMode } from "./MapChrome";
import { PreviewPanel } from "./PreviewPanel";
import type { AtlasCommonsMode, AtlasCommonsPublicMeta, AtlasCommonsSort, AtlasPublicNote, HostedClawdContext } from "./types";

const CityWorldRenderer = lazy(async () => {
  const module = await import("./CityWorldRenderer");
  return { default: module.CityWorldRenderer };
});

export type CityWorldViewProps = {
  scene: VoxelScene;
  cameraFocus?: { sourceSceneId: string; preset: CityWorldScene["cameraPresets"][number] } | null;
  generatedScene?: CityWorldScene | null;
  /** True when generatedScene is a REAL Census geo board (boundary + water),
   *  not a synthetic generated district — flips the boundary chrome from the
   *  "generated, not real coverage" banner to honest census-shape copy. */
  realCountyBoard?: boolean;
  /** 0.78-R zoom-band overlay: zoom notifications + committed band/epoch. */
  onCameraZoom?: ((zoom: number) => void) | undefined;
  bandOptions?: { committedBand?: "far" | "mid" | "near"; chunkEpoch?: { schemaVersion: string; packHash: string } } | undefined;
  /** S4a: road overlay status ("idle"|"loading"|"ready"|"sparse"|"unavailable"). */
  roadStatus?: string | undefined;
  selectedDistrictId?: string | undefined;
  selectedPlaceId?: string | undefined;
  stickers?: VoxelSticker[];
  notes?: VoxelNote[];
  atlasCommons?: AtlasCommonsPublicMeta | null;
  commonsMode?: AtlasCommonsMode;
  commonsSort?: AtlasCommonsSort;
  publicNotes?: AtlasPublicNote[];
  publicNotesLoading?: boolean;
  publicNotesMessage?: string;
  stickerMode?: VoxelStickerKind;
  noteDraft?: string;
  scoutPreview?: ScoutPreviewState | null;
  campaignPreview?: CampaignPreviewState | null;
  sessionResumeLabel?: string | undefined;
  hostedClawdContext?: HostedClawdContext | null;
  hostedClawdOpen?: boolean;
  hostedClawdActionMessage?: string | undefined;
  onAdvancePreview?: () => void;
  onOpenHostedClawd?: () => void;
  onCloseHostedClawd?: () => void;
  onHostedClawdPrimaryAction?: () => void;
  onExitGeneratedPreview?: () => void;
  countySwitcher?: ReactNode;
  showFirstRunHint?: boolean;
  onDismissFirstRunHint?: () => void;
  onSelectPlace: (placeId: string) => void;
  onSelectStickerMode: (kind: VoxelStickerKind) => void;
  onPlaceSticker: (placeId: string, kind: VoxelStickerKind) => void;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: (placeId: string, body: string) => void;
  onSelectCommonsMode?: (mode: AtlasCommonsMode) => void;
  onSelectCommonsSort?: (sort: AtlasCommonsSort) => void;
  onPostPublicNote?: (placeId: string, body: string) => Promise<boolean>;
  onReactPublicNote?: (noteId: string, active: boolean) => Promise<void>;
  onReportPublicNote?: (noteId: string) => Promise<void>;
};

// Quiet chrome: one pin mode by default (favorite). Debug/extra modes stay in type system.
const STICKER_ORDER: VoxelStickerKind[] = ["favorite"];
const MODAL_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getModalFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.dataset.focusSentinel === "true") return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    if (element.tabIndex < 0) return false;
    return element.offsetParent !== null || element.getClientRects().length > 0;
  });
}

function focusModalElement(container: HTMLElement | null, edge: "first" | "last" = "first") {
  if (!container) return;
  const focusable = getModalFocusableElements(container);
  const target = edge === "first" ? (focusable[0] ?? container) : (focusable[focusable.length - 1] ?? container);
  target.focus({ preventScroll: true });
}

export function CityWorldView({
  scene,
  cameraFocus = null,
  generatedScene = null,
  realCountyBoard = false,
  selectedDistrictId,
  selectedPlaceId,
  stickers = [],
  notes = [],
  atlasCommons = null,
  commonsMode = "mine",
  commonsSort = "hot",
  publicNotes = [],
  publicNotesLoading = false,
  publicNotesMessage = "",
  stickerMode = "favorite",
  noteDraft = "",
  scoutPreview = null,
  campaignPreview = null,
  sessionResumeLabel,
  hostedClawdContext = null,
  hostedClawdOpen = false,
  hostedClawdActionMessage,
  onAdvancePreview,
  onOpenHostedClawd,
  onCloseHostedClawd,
  onHostedClawdPrimaryAction,
  onExitGeneratedPreview,
  countySwitcher,
  showFirstRunHint = false,
  onDismissFirstRunHint,
  onSelectPlace,
  onSelectStickerMode,
  onPlaceSticker,
  onNoteDraftChange,
  onSaveNote,
  onSelectCommonsMode,
  onSelectCommonsSort,
  onPostPublicNote,
  onReactPublicNote,
  onReportPublicNote,
  onCameraZoom,
  bandOptions,
  roadStatus,
}: CityWorldViewProps) {
  const isGeneratedMode = Boolean(generatedScene);
  const isCountyBoardMode = isGeneratedMode && realCountyBoard;
  const hasPreview = !isGeneratedMode && Boolean(scoutPreview || campaignPreview);
  const hasHostedClawdTray = !isGeneratedMode && hostedClawdOpen && Boolean(hostedClawdContext);
  const rendererRef = useRef<CityWorldRendererHandle | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const modalSheetRef = useRef<HTMLDivElement | null>(null);
  const hostedClawdOpenerRef = useRef<HTMLElement | null>(null);
  const wasModalOpenRef = useRef(false);
  const placeNavigatorRef = useRef<HTMLDivElement | null>(null);
  const idPrefix = useId();
  const mapSummaryId = `${idPrefix}-map-summary`;
  const placeNavigatorId = `${idPrefix}-place-navigator`;
  const [placeNavigatorExpanded, setPlaceNavigatorExpanded] = useState(false);
  const [navigatorActivePlaceId, setNavigatorActivePlaceId] = useState<string | null>(null);
  const [publicDraft, setPublicDraft] = useState("");
  const [publicComposerOpen, setPublicComposerOpen] = useState(false);
  const [publicConfirming, setPublicConfirming] = useState(false);
  const [selectedPublicNoteId, setSelectedPublicNoteId] = useState<string | null>(null);
  const commonsActive = Boolean(atlasCommons?.enabled);
  const activeMapPlaceIds = useMemo(
    () => new Set((generatedScene?.places ?? scene.world?.places ?? []).map((place) => place.id)),
    [generatedScene, scene.world?.places],
  );
  const publicNotesInScene = useMemo(
    () => publicNotes
      .filter((note) => activeMapPlaceIds.has(note.placeId)),
    [activeMapPlaceIds, publicNotes],
  );
  const publicNoteCountByPlaceId = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const note of publicNotesInScene) counts[note.placeId] = (counts[note.placeId] ?? 0) + 1;
    return counts;
  }, [publicNotesInScene]);
  const visibleMapNotes = useMemo(
    () => commonsActive && commonsMode !== "mine" ? [] : notes,
    [commonsActive, commonsMode, notes],
  );
  const cityScene = useMemo<CityWorldScene>(
    () => {
      if (generatedScene) return withGeneratedSessionPins(generatedScene, stickers, visibleMapNotes);
      const compiled = compileCityWorldScene(scene, {
        selectedDistrictId,
        selectedPlaceId,
        stickers,
        notes: visibleMapNotes,
      });
      const focusPreset =
        cameraFocus?.sourceSceneId === scene.id && cameraFocus.preset.id === "focus"
          ? cameraFocus.preset
          : undefined;
      if (!focusPreset) return compiled;
      return {
        ...compiled,
        cameraPresets: [...compiled.cameraPresets.filter((preset) => preset.id !== "focus"), focusPreset],
      };
    },
    [cameraFocus, generatedScene, scene, selectedDistrictId, selectedPlaceId, stickers, visibleMapNotes],
  );
  // 0.57E parity — resolve selection against places that exist in THIS scene:
  // in generated mode the widget-state place id belongs to the county scene,
  // and falling through to places[0] selected a many-building home_area that
  // ringed every house on first paint. The authored HUD default (the landmark)
  // is the scene's own first-paint choice.
  const requestedPlace = cityScene.places.find((place) => place.id === selectedPlaceId);
  const hudDefaultPlace = cityScene.places.find((place) => place.id === cityScene.hudDefaults.selectedPlaceId);
  const activePlace = requestedPlace ?? hudDefaultPlace ?? cityScene.places[0];
  const placePins = activePlace ? cityScene.pins.filter((pin) => pin.placeId === activePlace.id) : [];
  const worldStickers = isGeneratedMode ? [] : scene.world?.stickers ?? [];
  const worldNotes = isGeneratedMode ? [] : scene.world?.notes ?? [];
  const stickerCount = stickers.length + worldStickers.length;
  const privatePlaceNotes = activePlace ? [...worldNotes, ...notes].filter((note) => note.placeId === activePlace.id) : [];
  const placePublicNotes = useMemo(
    () => activePlace ? publicNotesInScene.filter((note) => note.placeId === activePlace.id) : [],
    [activePlace, publicNotesInScene],
  );
  const selectedPublicNoteIndex = Math.max(0, placePublicNotes.findIndex((note) => note.id === selectedPublicNoteId));
  const selectedPublicNote = placePublicNotes[selectedPublicNoteIndex] ?? null;
  const visiblePlaceNoteCount = commonsActive && commonsMode !== "mine" ? placePublicNotes.length : privatePlaceNotes.length + placePublicNotes.length;
  const noteCount = commonsActive
    ? commonsMode === "mine"
      ? visibleMapNotes.length + worldNotes.length
      : publicNotesInScene.length
    : notes.length + worldNotes.length;
  const latestNoteBody = commonsActive && commonsMode !== "mine"
    ? selectedPublicNote?.body ?? ""
    : privatePlaceNotes.at(-1)?.body ?? placePublicNotes.at(-1)?.body ?? "";
  const cameraPresetId = readRequestedCameraPreset(cityScene);
  const debugMode = readRequestedDebugMode();
  const displayMode = useOpenAiDisplayMode();
  const canNavigatePlaces = cityScene.places.length > 0;
  const renderedDistrictCount = cityScene.region.district ? 1 : 0;
  const mapSummary = `Voxel map of ${cityScene.region.county}: ${cityScene.places.length} ${cityScene.places.length === 1 ? "place" : "places"}, ${renderedDistrictCount} ${renderedDistrictCount === 1 ? "district" : "districts"}.`;
  const navigatorActiveIndex = cityScene.places.findIndex((place) => place.id === navigatorActivePlaceId);
  const navigatorActiveOptionId = navigatorActiveIndex >= 0 ? `${idPrefix}-place-option-${navigatorActiveIndex}` : undefined;

  useEffect(() => {
    setNavigatorActivePlaceId(activePlace?.id ?? cityScene.places[0]?.id ?? null);
  }, [activePlace?.id, cityScene.places]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const background = backgroundRef.current;

    if (hasHostedClawdTray) {
      wasModalOpenRef.current = true;
      if (!hostedClawdOpenerRef.current && document.activeElement instanceof HTMLElement) {
        hostedClawdOpenerRef.current = document.activeElement;
      }

      const focusSheet = () => focusModalElement(modalSheetRef.current);
      const enterModal = () => {
        focusSheet();
        background?.setAttribute("inert", "");
        background?.setAttribute("aria-hidden", "true");
      };
      if (typeof window === "undefined") {
        enterModal();
      } else {
        window.requestAnimationFrame(enterModal);
      }
      return () => {
        background?.removeAttribute("inert");
        background?.removeAttribute("aria-hidden");
      };
    }

    background?.removeAttribute("inert");
    background?.removeAttribute("aria-hidden");
    if (!wasModalOpenRef.current) return;
    wasModalOpenRef.current = false;
    const opener = hostedClawdOpenerRef.current;
    hostedClawdOpenerRef.current = null;

    if (!opener || !document.contains(opener)) return;
    const focusOpener = () => opener.focus({ preventScroll: true });
    if (typeof window === "undefined") {
      focusOpener();
    } else {
      window.requestAnimationFrame(focusOpener);
    }
  }, [hasHostedClawdTray]);

  // First-run gesture hint: one quiet line, gone on first interaction or
  // after a short dwell — never persistent chrome.
  const hintVisible = showFirstRunHint && !isGeneratedMode && !hasPreview && !hasHostedClawdTray;
  useEffect(() => {
    if (!hintVisible || !onDismissFirstRunHint) return;
    const timer = window.setTimeout(() => onDismissFirstRunHint(), 8000);
    return () => window.clearTimeout(timer);
  }, [hintVisible, onDismissFirstRunHint]);

  const [noteStatus, setNoteStatus] = useState("");

  const saveNote = () => {
    if (!activePlace || !noteDraft.trim()) return;
    onSaveNote(activePlace.id, noteDraft);
    setNoteStatus("Note saved.");
    if (typeof window !== "undefined") {
      window.setTimeout(() => setNoteStatus(""), 2000);
    }
  };

  useEffect(() => {
    setPublicConfirming(false);
    setPublicComposerOpen(false);
    setPublicDraft("");
  }, [activePlace?.id, commonsMode]);

  useEffect(() => {
    if (placePublicNotes.length === 0) {
      setSelectedPublicNoteId(null);
      return;
    }
    if (!selectedPublicNoteId || !placePublicNotes.some((note) => note.id === selectedPublicNoteId)) {
      setSelectedPublicNoteId(placePublicNotes[0]?.id ?? null);
    }
  }, [commonsMode, commonsSort, placePublicNotes, selectedPublicNoteId]);

  const postPublicNote = async () => {
    if (!activePlace || !publicDraft.trim() || !onPostPublicNote) return;
    const posted = await onPostPublicNote(activePlace.id, publicDraft);
    if (posted) {
      setPublicDraft("");
      setPublicConfirming(false);
      setPublicComposerOpen(false);
    }
  };

  const cycleSelectedPublicNote = (direction: -1 | 1) => {
    if (placePublicNotes.length < 2) return;
    const nextIndex = (selectedPublicNoteIndex + direction + placePublicNotes.length) % placePublicNotes.length;
    setSelectedPublicNoteId(placePublicNotes[nextIndex]?.id ?? null);
  };

  const dropSticker = () => {
    if (!activePlace) return;
    onSelectStickerMode(stickerMode);
    onPlaceSticker(activePlace.id, stickerMode);
  };

  // Free map loop: do not show Hosted Clawd / save chrome (Clawd later).
  const showHostedClawdCta = Boolean(hasHostedClawdTray === false && hostedClawdContext?.canPersist && onOpenHostedClawd);

  const focusPlaceOnBoard = (placeId: string) => {
    if (!isCountyBoardMode) return;
    const place = cityScene.places.find((item) => item.id === placeId);
    if (!place) return;
    // Census towns: pull past NEAR band threshold (~1.48) so road overlay can commit.
    rendererRef.current?.focusPoint(place.anchor, 1.62);
  };

  const selectPlaceFromNavigator = (placeId: string) => {
    if (!canNavigatePlaces) return;
    setNavigatorActivePlaceId(placeId);
    onSelectPlace(placeId);
    focusPlaceOnBoard(placeId);
  };

  const handleSelectPlace = (placeId: string) => {
    setNavigatorActivePlaceId(placeId);
    onSelectPlace(placeId);
    focusPlaceOnBoard(placeId);
  };

  const handlePlaceNavigatorToggle = () => {
    setPlaceNavigatorExpanded((expanded) => {
      const nextExpanded = !expanded;
      if (nextExpanded && typeof window !== "undefined") {
        window.requestAnimationFrame(() => placeNavigatorRef.current?.focus({ preventScroll: true }));
      }
      return nextExpanded;
    });
  };

  const handlePlaceNavigatorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigatePlaces) return;

    const placeCount = cityScene.places.length;
    const currentIndex = navigatorActiveIndex >= 0 ? navigatorActiveIndex : 0;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = Math.min(placeCount - 1, currentIndex + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = placeCount - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectPlaceFromNavigator(cityScene.places[currentIndex]?.id ?? cityScene.places[0]?.id ?? "");
        return;
      default:
        return;
    }

    event.preventDefault();
    if (nextIndex === null) return;
    const nextPlace = cityScene.places[nextIndex];
    if (nextPlace) setNavigatorActivePlaceId(nextPlace.id);
  };

  const handleHostedClawdOpen = (event: MouseEvent<HTMLButtonElement>) => {
    hostedClawdOpenerRef.current = event.currentTarget;
    onOpenHostedClawd?.();
  };

  const handleModalSheetKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCloseHostedClawd?.();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getModalFocusableElements(modalSheetRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      modalSheetRef.current?.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = typeof document === "undefined" ? null : document.activeElement;

    if (event.shiftKey && (!activeElement || activeElement === first || !modalSheetRef.current?.contains(activeElement))) {
      event.preventDefault();
      last?.focus({ preventScroll: true });
      return;
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first?.focus({ preventScroll: true });
    }
  };

  const handleShellKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !publicComposerOpen) return;
    event.preventDefault();
    setPublicConfirming(false);
    setPublicComposerOpen(false);
  };

  const shellClassName = [
    "city-world-shell",
    hasPreview ? "has-preview" : "",
    hasHostedClawdTray ? "has-save-sheet" : "",
    commonsActive && commonsMode !== "mine" && !hasPreview && !hasHostedClawdTray ? "has-commons-strip" : "",
  ].filter(Boolean).join(" ");

  return (
    <main
      className={shellClassName}
      data-qa="alpha-city-world"
      data-qa-selected-place={activePlace?.id ?? ""}
      data-qa-pin-count={stickerCount}
      data-qa-note-count={noteCount}
      data-qa-latest-note={latestNoteBody}
      data-qa-session-boundary="session-only"
      data-qa-camera-preset={cameraPresetId ?? ""}
      data-qa-display-mode={displayMode}
      data-display-mode={displayMode}
      data-qa-generated={isGeneratedMode && !isCountyBoardMode ? "true" : undefined}
      data-qa-census-board={isCountyBoardMode ? "true" : undefined}
      onPointerDownCapture={hintVisible ? onDismissFirstRunHint : undefined}
      onKeyDown={handleShellKeyDown}
    >
      <span className="city-world-sr-only" data-qa="display-mode" data-display-mode={displayMode}>
        {displayMode}
      </span>
      <div ref={backgroundRef} className="city-world-stage">
      <section
        className="city-world-map-surface"
        role="img"
        aria-label={`${cityScene.region.district} voxel map`}
        aria-describedby={mapSummaryId}
      >
        <p id={mapSummaryId} className="city-world-sr-only">
          {mapSummary}
        </p>
        <Suspense fallback={<CityWorldSceneFallback scene={cityScene} selectedPlaceId={activePlace?.id} />}>
          <CityWorldRenderer
            ref={rendererRef}
            scene={cityScene}
            selectedPlaceId={activePlace?.id}
            cameraPresetId={cameraPresetId}
            debugMode={debugMode}
            onSelectPlace={handleSelectPlace}
            onCameraZoom={onCameraZoom}
            bandOptions={bandOptions}
            publicNoteCountByPlaceId={publicNoteCountByPlaceId}
            publicNoteLayerActive={commonsActive && commonsMode !== "mine"}
            selectedPublicNotePreview={selectedPublicNote ? {
              placeId: selectedPublicNote.placeId,
              body: selectedPublicNote.body,
              byline: `${selectedPublicNote.authorHandle} · ${relativeNoteTime(selectedPublicNote.publishedAt ?? selectedPublicNote.createdAt)}`,
            } : undefined}
          />
        </Suspense>
      </section>

      {isGeneratedMode && realCountyBoard ? (
        <div className="city-world-generated-boundary" data-qa="census-boundary">
          <div>
            <span>U.S. CENSUS · {cityScene.region.county}</span>
            {/* S4a (F-007): the honesty line is BAND-AWARE — once real streets
                commit at NEAR, saying they aren't mapped would be false. */}
            <strong>
              {bandOptions?.committedBand === "near" && (roadStatus === "ready" || roadStatus === "sparse")
                ? "Real boundary, water, town names, and streets from Census TIGER. Buildings aren't mapped yet. Tap a town to zoom in. Fit county to zoom out."
                : "Real boundary, water, and town names. Streets and buildings aren't mapped yet. Tap a town to zoom in. Fit county to zoom out."}
            </strong>
            {/* S4a status: NEAR-band honesty — loading / ready / sparse / unavailable.
                Ready+sparse also flip the strong line above so we never claim streets
                are unmapped once TIGER is on screen. */}
            {roadStatus === "loading" || roadStatus === "unavailable" || roadStatus === "ready" || roadStatus === "sparse" ? (
              <em aria-live="polite" data-qa="road-status">
                {roadStatus === "loading"
                  ? "Street detail loading…"
                  : roadStatus === "ready"
                    ? "Street detail on — from Census TIGER. Buildings are not mapped."
                    : roadStatus === "sparse"
                      ? "Limited street detail from Census TIGER. Buildings are not mapped."
                      : "Street detail unavailable for this county yet. Zoom out with Fit county."}
              </em>
            ) : null}
          </div>
          <button type="button" data-qa="exit-census-board" onClick={onExitGeneratedPreview}>
            Open Riverside
          </button>
        </div>
      ) : isGeneratedMode ? (
        <div className="city-world-generated-boundary" data-qa="generated-boundary">
          <div>
            <span>GENERATED MAP</span>
            <strong>
              {cityScene.places.some((place) => place.id.startsWith("town-anchor-"))
                ? "This map is generated. Town names are from the Census."
                : "This map is generated. It is not verified street coverage."}
            </strong>
          </div>
          <button type="button" data-qa="exit-generated" onClick={onExitGeneratedPreview}>
            Open Riverside map
          </button>
        </div>
      ) : (
        <div className="city-world-left-rail">
          <div className="city-world-location" aria-label="Current city map" data-qa="current-city-map">
            <span>{cityScene.region.county}</span>
            <strong>{cityScene.region.district.replace(" City Slice", "")}</strong>
          </div>
          {countySwitcher}
        </div>
      )}

      <MapChrome
        rendererRef={rendererRef}
        centerLabel={isCountyBoardMode ? "Fit county" : undefined}
      />

      {commonsActive && !hasPreview && !hasHostedClawdTray ? (
        <div className="city-world-commons-controls" data-qa="commons-controls">
          <div className="city-world-commons-mode" role="group" aria-label="Atlas note layer" data-qa="commons-mode">
            {(["all", "nearby", "mine"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={commonsMode === mode}
                className={commonsMode === mode ? "is-active" : ""}
                data-qa={`commons-mode-${mode}`}
                onClick={() => onSelectCommonsMode?.(mode)}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          {commonsMode !== "mine" ? (
            <div className="city-world-commons-sort" role="group" aria-label="Public note order" data-qa="commons-sort">
              {(["hot", "new"] as const).map((sort) => (
                <button
                  key={sort}
                  type="button"
                  aria-pressed={commonsSort === sort}
                  className={commonsSort === sort ? "is-active" : ""}
                  data-qa={`commons-sort-${sort}`}
                  onClick={() => onSelectCommonsSort?.(sort)}
                >
                  {sort.toUpperCase()}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {canNavigatePlaces ? (
        <div className={placeNavigatorExpanded ? "city-world-place-navigator is-expanded" : "city-world-place-navigator"}>
          <button
            type="button"
            className="city-world-place-navigator-toggle"
            aria-expanded={placeNavigatorExpanded}
            aria-controls={placeNavigatorId}
            data-qa="place-navigator-toggle"
            onClick={handlePlaceNavigatorToggle}
          >
            {commonsActive && commonsMode !== "mine" ? "Find place" : "Places"}
          </button>
          <div
            ref={placeNavigatorRef}
            id={placeNavigatorId}
            className="city-world-place-navigator-list"
            role="listbox"
            tabIndex={0}
            aria-label={`${cityScene.region.district} places`}
            aria-describedby={mapSummaryId}
            aria-activedescendant={navigatorActiveOptionId}
            data-qa="place-navigator"
            onKeyDown={handlePlaceNavigatorKeyDown}
          >
            {cityScene.places.map((place, index) => {
              const selected = place.id === activePlace?.id;
              const active = place.id === navigatorActivePlaceId;
              const placeNoteCount = commonsActive && commonsMode !== "mine"
                ? publicNoteCountByPlaceId[place.id] ?? 0
                : [...(commonsMode === "mine" ? worldNotes : []), ...visibleMapNotes]
                  .filter((note) => note.placeId === place.id).length;
              return (
                <div
                  key={place.id}
                  id={`${idPrefix}-place-option-${index}`}
                  className="city-world-place-navigator-option"
                  role="option"
                  aria-selected={selected}
                  data-active={active ? "true" : undefined}
                  data-kind={place.kind}
                  data-has-notes={placeNoteCount > 0 ? "true" : undefined}
                  onClick={() => selectPlaceFromNavigator(place.id)}
                >
                  <span>
                    {place.label}
                    {placeNoteCount > 0 ? (
                      <em className="city-world-place-note-badge" data-qa="navigator-note-badge" aria-label={`${placeNoteCount} notes`}>
                        {placeNoteCount}
                      </em>
                    ) : null}
                  </span>
                  <b>{placeKindLabel(place.kind)}</b>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {hintVisible ? (
        <div className="city-world-first-run-hint" role="note" data-qa="first-run-hint">
          Drag the map. Pinch to zoom. Tap a place.
        </div>
      ) : null}

      {/* National Census board + Riverside: notes/pins are the product loop. */}
      {!hasPreview && !hasHostedClawdTray && (!commonsActive || commonsMode === "mine") ? (
      <div className="city-world-stickers" aria-label="Pin tools" data-qa="sticker-tools" data-qa-sticker-mode={stickerMode}>
        {STICKER_ORDER.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-label={`Use ${stickerLabel(kind)} pin`}
            aria-pressed={kind === stickerMode}
            data-qa={`sticker-mode-${kind}`}
            className={kind === stickerMode ? "is-active" : ""}
            onClick={() => onSelectStickerMode(kind)}
          >
            <span aria-hidden="true">
              <StickerGlyph kind={kind} />
            </span>
          </button>
        ))}
        <button
          type="button"
          aria-label="Pin place"
          className="city-world-drop"
          data-qa="drop-sticker-button"
          disabled={!activePlace}
          onClick={dropSticker}
        >
          <PinIcon />
          <span>Pin place</span>
        </button>
      </div>
      ) : null}

      {hasHostedClawdTray ? null : hasPreview && !isCountyBoardMode ? (
        <PreviewPanel scoutPreview={scoutPreview} campaignPreview={campaignPreview} {...(onAdvancePreview ? { onAdvance: onAdvancePreview } : {})} />
      ) : hasPreview && isCountyBoardMode ? null : (
      <section
        className={commonsActive && commonsMode !== "mine" ? "city-world-tray is-commons-strip" : "city-world-tray"}
        aria-label="Selected place"
        aria-busy={publicNotesLoading || undefined}
        data-qa="selected-place-tray"
        data-qa-selected-place={activePlace?.id ?? ""}
        data-qa-selected-place-label={activePlace?.label ?? ""}
        data-qa-pin-count={stickerCount}
        data-qa-note-count={noteCount}
        data-qa-latest-note={latestNoteBody}
      >
        <div className="city-world-tray-head">
          <div className="city-world-place-copy">
            <span className="city-world-place-type">{activePlace ? placeKindLabel(activePlace.kind) : "Place"}</span>
            <strong data-qa="selected-place-label">{activePlace?.label ?? "Select a place."}</strong>
          </div>
          {visiblePlaceNoteCount > 0 ? (
            <span className="city-world-place-pulse" data-qa="place-note-count" aria-label={`${visiblePlaceNoteCount} notes`}>
              {visiblePlaceNoteCount} note{visiblePlaceNoteCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        {sessionResumeLabel ? (
          <div className="city-world-session-boundary" data-qa="session-resume">
            {sessionResumeLabel}
          </div>
        ) : null}
        <div className="city-world-session-boundary" data-qa="session-only-boundary">
          {commonsActive
            ? commonsMode === "mine"
              ? "Private notes stay in this chat. Public submissions are labeled."
              : "Public notes are moderated. Posting is always explicit."
            : "Pins and notes stay in this chat only."}
        </div>
        {showHostedClawdCta && (!commonsActive || commonsMode === "mine") ? (
          <button type="button" className="city-world-hosted-clawd-open" data-qa="hosted-clawd-open" onClick={handleHostedClawdOpen}>
            Save with ChatGPT
            <span>{hostedClawdContext?.sessionBoundary}</span>
          </button>
        ) : null}
        {!commonsActive || commonsMode === "mine" ? (
          <>
            {privatePlaceNotes.length > 0 ? (
              <ul className="city-world-note-list" data-qa="place-note-list" aria-label="Private notes for selected place">
                {privatePlaceNotes.slice(-5).map((note) => (
                  <li key={note.id} className="city-world-latest-note" data-qa="latest-note">
                    {note.body}
                  </li>
                ))}
              </ul>
            ) : activePlace ? (
              <div className="city-world-latest-note city-world-note-empty" data-qa="note-empty">
                No private notes for this place.
              </div>
            ) : null}
            {commonsActive && placePublicNotes.length > 0 ? (
              <ul className="city-world-public-note-list" aria-label="Your public-note submissions for selected place">
                {placePublicNotes.map((note) => (
                  <li key={note.id}>
                    <div>
                      <b>{note.status === "pending" ? "Pending review" : "Public"}</b>
                      <span>{note.authorHandle}</span>
                    </div>
                    <p>{note.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="city-world-note">
              <input
                value={noteDraft}
                maxLength={120}
                disabled={!activePlace}
                data-qa="note-input"
                onChange={(event) => onNoteDraftChange(event.currentTarget.value)}
                placeholder={activePlace ? `Private note for ${activePlace.label}` : "Select a place first."}
                aria-label={activePlace ? `Write a private note for ${activePlace.label}` : "Select a place first"}
              />
              <button type="button" aria-label="Save private note" data-qa="save-note-button" disabled={!activePlace || !noteDraft.trim()} onClick={saveNote}>
                Save private
              </button>
            </div>
          </>
        ) : (
          <>
            {publicNotesLoading ? (
              <div className="city-world-public-note-state" role="status">Reading public notes…</div>
            ) : selectedPublicNote ? (
              <article className="city-world-public-note-selected" data-qa="public-note-selected" aria-label="Selected public note">
                <header>
                  <b>{selectedPublicNote.authorHandle}</b>
                  <span>{relativeNoteTime(selectedPublicNote.publishedAt ?? selectedPublicNote.createdAt)}</span>
                </header>
                <p>{selectedPublicNote.body}</p>
                <div className="city-world-public-note-foot">
                  {placePublicNotes.length > 1 ? (
                    <div className="city-world-public-note-pager" aria-label="Public note navigation">
                      <button type="button" data-qa="public-note-prev" onClick={() => cycleSelectedPublicNote(-1)}>Prev</button>
                      <span>{selectedPublicNoteIndex + 1} of {placePublicNotes.length}</span>
                      <button type="button" data-qa="public-note-next" onClick={() => cycleSelectedPublicNote(1)}>Next</button>
                    </div>
                  ) : <span />}
                  <div className="city-world-public-note-actions">
                    <button
                      type="button"
                      aria-pressed={selectedPublicNote.viewerHasReacted === true}
                      onClick={() => void onReactPublicNote?.(selectedPublicNote.id, selectedPublicNote.viewerHasReacted !== true)}
                    >
                      Useful {selectedPublicNote.reactionCount > 0 ? selectedPublicNote.reactionCount : ""}
                    </button>
                    {selectedPublicNote.viewerCanReport ? (
                      <button type="button" onClick={() => void onReportPublicNote?.(selectedPublicNote.id)}>Report</button>
                    ) : null}
                  </div>
                </div>
              </article>
            ) : activePlace ? (
              <div className="city-world-latest-note city-world-note-empty" data-qa="public-note-empty">
                No moderated public notes pinned here yet.
              </div>
            ) : null}
            <div className={publicComposerOpen ? "city-world-public-compose is-open" : "city-world-public-compose"}>
              {!publicComposerOpen ? (
                <button
                  type="button"
                  data-qa="open-public-note-composer"
                  disabled={!activePlace || publicNotesLoading || !atlasCommons?.available}
                  onClick={() => setPublicComposerOpen(true)}
                >
                  Leave public note
                </button>
              ) : (
                <>
                  <input
                    value={publicDraft}
                    maxLength={240}
                    disabled={!activePlace || publicNotesLoading || !atlasCommons?.available}
                    data-qa="public-note-input"
                    onChange={(event) => {
                      setPublicDraft(event.currentTarget.value);
                      setPublicConfirming(false);
                    }}
                    placeholder={activePlace ? `Public note at ${activePlace.label}` : "Select a place first."}
                    aria-label={activePlace ? `Write a public note for ${activePlace.label}` : "Select a place first"}
                    autoFocus
                  />
                  {!publicConfirming ? (
                    <div className="city-world-public-compose-actions">
                      <button
                        type="button"
                        data-qa="review-public-note"
                        disabled={!activePlace || !publicDraft.trim() || publicNotesLoading || !atlasCommons?.available}
                        onClick={() => setPublicConfirming(true)}
                      >
                        Review public post
                      </button>
                      <button type="button" onClick={() => setPublicComposerOpen(false)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="city-world-public-confirm" role="group" aria-label="Confirm public post">
                      <span>Everyone can read this after moderation.</span>
                      <button type="button" data-qa="post-public-note" disabled={publicNotesLoading} onClick={() => void postPublicNote()}>
                        Post publicly
                      </button>
                      <button type="button" onClick={() => setPublicConfirming(false)}>Back</button>
                    </div>
                  )}
                </>
              )}
              <small>Public notes are visible to everyone after moderation. Private notes stay in this chat.</small>
            </div>
          </>
        )}
        <span className="city-world-sr-only" role="status" aria-live="polite" data-qa="note-status">
          {noteStatus}
        </span>
        {commonsActive && publicNotesMessage ? (
          <div className="city-world-public-note-state" role="status" data-qa="public-note-status">{publicNotesMessage}</div>
        ) : null}
        {placePins.length > 0 ? (
          <div className="city-world-pin-row" aria-label="Pins on selected place" data-qa="selected-place-pins">
            {placePins.slice(-4).map((pin) => (
              <span key={pin.id}>{pin.kind === "note" ? "N" : <StickerGlyph kind={pin.kind} />}</span>
            ))}
          </div>
        ) : null}
      </section>
      )}
      </div>

      {hasHostedClawdTray && hostedClawdContext && onCloseHostedClawd && onHostedClawdPrimaryAction ? (
        <div
          ref={modalSheetRef}
          className="city-world-modal-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Atlas save panel"
          tabIndex={-1}
          data-qa="modal-sheet"
          onKeyDown={handleModalSheetKeyDown}
        >
          <span className="city-world-focus-sentinel" tabIndex={0} data-focus-sentinel="true" onFocus={() => focusModalElement(modalSheetRef.current, "last")} />
          <HostedClawdTray
            context={hostedClawdContext}
            actionMessage={hostedClawdActionMessage}
            onClose={onCloseHostedClawd}
            onPrimaryAction={onHostedClawdPrimaryAction}
          />
          <span className="city-world-focus-sentinel" tabIndex={0} data-focus-sentinel="true" onFocus={() => focusModalElement(modalSheetRef.current)} />
        </div>
      ) : null}
    </main>
  );
}

function withGeneratedSessionPins(scene: CityWorldScene, stickers: VoxelSticker[], notes: VoxelNote[]): CityWorldScene {
  const sessionPins = createSessionPins(scene.places, stickers, notes);
  if (sessionPins.length === 0) return scene;
  const sessionPinIds = new Set(sessionPins.map((pin) => pin.id));
  return {
    ...scene,
    pins: [...scene.pins.filter((pin) => !sessionPinIds.has(pin.id)), ...sessionPins],
  };
}

function createSessionPins(places: CityWorldPlace[], stickers: VoxelSticker[], notes: VoxelNote[]): CityWorldPin[] {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const pins: CityWorldPin[] = [];

  for (const sticker of stickers) {
    const place = placeById.get(sticker.placeId);
    if (!place) continue;
    pins.push({
      id: sticker.id,
      placeId: sticker.placeId,
      kind: sticker.kind,
      label: sticker.label,
      anchor: { x: place.anchor.x + 0.7, y: place.anchor.y - 0.6, z: 1.8 },
      ...(sticker.noteId ? { noteId: sticker.noteId } : {}),
      spriteKey: `pin.sticker.${sticker.kind}`,
      paletteKey: `pin.${sticker.kind}`,
      detailLevel: "high",
    });
  }

  // Aggregate notes into one map badge per place so the map stays readable.
  const notesByPlace = new Map<string, VoxelNote[]>();
  for (const note of notes) {
    const list = notesByPlace.get(note.placeId) ?? [];
    list.push(note);
    notesByPlace.set(note.placeId, list);
  }
  for (const [placeId, placeNotes] of notesByPlace) {
    const place = placeById.get(placeId);
    if (!place) continue;
    const count = placeNotes.length;
    const latest = placeNotes[placeNotes.length - 1]!;
    pins.push({
      id: `pin-notes-${placeId}`,
      placeId,
      kind: "note",
      label: count > 1 ? `${count} notes` : latest.body,
      anchor: { x: place.anchor.x - 0.75, y: place.anchor.y - 0.5, z: 1.6 },
      noteId: latest.id,
      spriteKey: "pin.note.default",
      paletteKey: "pin.note",
      detailLevel: "high",
    });
  }

  return pins;
}

function PinIcon() {
  return (
    <svg className="city-world-pin-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5c-2.7 0-4.8 2-4.8 4.6 0 3.4 4.8 8.4 4.8 8.4s4.8-5 4.8-8.4c0-2.6-2.1-4.6-4.8-4.6Z" />
      <circle cx="10" cy="8.1" r="1.6" />
    </svg>
  );
}

function CityWorldSceneFallback({ scene, selectedPlaceId }: { scene: CityWorldScene; selectedPlaceId?: string | undefined }) {
  const terrainTiles = scene.terrainTiles.slice(0, 260);
  const lots = scene.lots.slice(0, 80);
  const projected = [
    ...terrainTiles.map((tile) => projectCityWorldPoint(tile.position)),
    ...lots.map((lot) => projectCityWorldPoint(lot.position)),
    ...scene.places.map((place) => projectCityWorldPoint(place.anchor)),
  ];
  const bounds = projected.reduce(
    (box, point) => ({
      minX: Math.min(box.minX, point.x),
      minY: Math.min(box.minY, point.y),
      maxX: Math.max(box.maxX, point.x),
      maxY: Math.max(box.maxY, point.y),
    }),
    { minX: 0, minY: 0, maxX: 1, maxY: 1 },
  );
  const pad = 96;
  const viewBox = `${bounds.minX - pad} ${bounds.minY - pad} ${Math.max(320, bounds.maxX - bounds.minX + pad * 2)} ${Math.max(260, bounds.maxY - bounds.minY + pad * 2)}`;

  return (
    <svg
      className="city-world-renderer city-world-renderer-fallback"
      viewBox={viewBox}
      role="img"
      aria-label={`${scene.region.district} voxel city map loading`}
      data-qa="city-world-renderer-fallback"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect className="city-world-renderer-fallback-bg" x={bounds.minX - pad} y={bounds.minY - pad} width={bounds.maxX - bounds.minX + pad * 2} height={bounds.maxY - bounds.minY + pad * 2} />
      <g>
        {terrainTiles.map((tile) => {
          const point = projectCityWorldPoint(tile.position);
          return (
            <polygon
              key={tile.id}
              className={`city-world-renderer-fallback-tile terrain-${tile.kind}`}
              points={cityWorldDiamondPoints(point, tile.width * CITY_WORLD_TILE_BASIS.tileWidth, tile.depth * CITY_WORLD_TILE_BASIS.tileHeight).join(" ")}
            />
          );
        })}
      </g>
      <g>
        {lots.map((lot) => {
          const point = projectCityWorldPoint(lot.position);
          return (
            <polygon
              key={lot.id}
              className={`city-world-renderer-fallback-lot lot-${lot.kind}`}
              points={cityWorldDiamondPoints(point, lot.width * CITY_WORLD_TILE_BASIS.tileWidth, lot.depth * CITY_WORLD_TILE_BASIS.tileHeight).join(" ")}
            />
          );
        })}
      </g>
      <g>
        {scene.places.map((place) => {
          const point = projectCityWorldPoint(place.anchor);
          const selected = place.id === selectedPlaceId;
          return <circle key={place.id} className={selected ? "city-world-renderer-fallback-place is-selected" : "city-world-renderer-fallback-place"} cx={point.x} cy={point.y} r={selected ? 13 : 9} />;
        })}
      </g>
    </svg>
  );
}

/**
 * Six stroke-SVG sticker glyphs in the city-world-icon language:
 * house, heart, tag, tree, bolt, question.
 */
function StickerGlyph({ kind }: { kind: VoxelStickerKind }) {
  switch (kind) {
    case "home":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 9.5 10 4.5l6 5" />
          <path d="M5.8 8.4v7.1h8.4V8.4" />
        </svg>
      );
    case "favorite":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 15.6S4.6 12 4.6 8.5C4.6 6.6 6 5.1 7.8 5.1c.9 0 1.7.4 2.2 1.1.5-.7 1.3-1.1 2.2-1.1 1.8 0 3.2 1.5 3.2 3.4 0 3.5-5.4 7.1-5.4 7.1Z" />
        </svg>
      );
    case "shop":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4.5 4.5h5.2l5.8 5.8-5.2 5.2-5.8-5.8V4.5Z" />
          <circle cx="7.7" cy="7.7" r="1.1" />
        </svg>
      );
    case "park":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 3.8 5.6 9.8h1.9L4.8 13.4h10.4L12.5 9.8h1.9L10 3.8Z" />
          <path d="M10 13.4v2.8" />
        </svg>
      );
    case "idea":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M11.2 3.6 5.6 11h3.6l-1 5.4L13.9 9h-3.5l.8-5.4Z" />
        </svg>
      );
    case "question":
      return (
        <svg className="city-world-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M7.3 7.3c.2-1.6 1.3-2.7 2.8-2.7 1.6 0 2.8 1.1 2.8 2.6 0 2-2.7 2.2-2.7 4.2" />
          <path d="M10.2 14.5v.3" />
        </svg>
      );
  }
}

function stickerLabel(kind: VoxelStickerKind): string {
  const labels: Record<VoxelStickerKind, string> = {
    home: "Home",
    shop: "Shop",
    park: "Park",
    favorite: "Favorite",
    idea: "Idea",
    question: "Question",
  };
  return labels[kind];
}

function relativeNoteTime(value: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function placeKindLabel(kind: CityWorldScene["places"][number]["kind"]): string {
  const labels: Record<CityWorldScene["places"][number]["kind"], string> = {
    home_area: "Home area",
    shop: "Shop",
    plaza: "Plaza",
    park: "Park",
    road: "Road",
    landmark: "Landmark",
  };
  return labels[kind];
}
