export type PlateRef =
  | { level: "nation" }
  | { level: "state"; state: string; stateName?: string }
  | { level: "county"; countySlug: string; state?: string; name?: string };

export type AtlasMapViewSnapshot = Readonly<{
  revision: number;
  visibleRevision: number;
  navigationStack: readonly PlateRef[];
  current: PlateRef;
  selectedPlace?: AtlasPlaceCandidate;
  notes: readonly MapNote[];
  trail?: MapTrail;
  toolStatus: "unavailable" | "registering" | "available" | "failed";
  lastActivity?: AtlasToolActivity;
}>;

export type AtlasPlaceCandidate = {
  name: string;
  countySlug: string;
  countyName: string;
  state: string;
  kind: "place" | "county";
};

export type PlaceSearchResult = {
  ok: true;
  query: string;
  candidates: AtlasPlaceCandidate[];
};

export type OpenPlaceInput = { place: string };

export type MapNote = {
  id: string;
  place: AtlasPlaceCandidate;
  body: string;
};

export type AddMapNoteInput = { place: string; body: string };
type PlaceResolutionError = {
  code: "AMBIGUOUS_PLACE" | "UNKNOWN_PLACE";
  message: string;
  candidates: AtlasPlaceCandidate[];
};
export type AddMapNoteResult =
  | { ok: true; note: MapNote; revision: number }
  | { ok: false; error: PlaceResolutionError | { code: "INVALID_INPUT"; message: string; candidates: [] } };

export type MapTrailStop = { place: AtlasPlaceCandidate; prompt: string };
export type MapTrail = { title: string; stops: readonly MapTrailStop[]; activeIndex: number };
export type CreateMapTrailInput = { title: string; stops: Array<{ place: string; prompt: string }> };
export type CreateMapTrailResult =
  | { ok: true; trail: MapTrail; revision: number }
  | { ok: false; error: { code: "INVALID_INPUT" | "AMBIGUOUS_PLACE" | "UNKNOWN_PLACE"; message: string; stopIndex?: number; candidates?: AtlasPlaceCandidate[] } };

export type AtlasToolActivity = {
  sequence: number;
  at: string;
  tool: string;
  state: "running" | "completed" | "failed";
  summary: string;
};

export type OpenPlaceResult =
  | { ok: true; place: AtlasPlaceCandidate; revision: number }
  | {
      ok: false;
      error: PlaceResolutionError;
    };

type VisibleWaiter = {
  resolve: () => void;
  reject: (error: Error) => void;
};

function sameRef(left: PlateRef, right: PlateRef): boolean {
  if (left.level !== right.level) return false;
  if (left.level === "nation" || right.level === "nation") return true;
  if (left.level === "state" && right.level === "state") return left.state === right.state;
  return left.level === "county" && right.level === "county" && left.countySlug === right.countySlug;
}

/**
 * Owns the live map navigation shared by human controls and browser tools.
 *
 * A navigation promise resolves only after AtlasApp acknowledges that the
 * matching plate has rendered. Future WebMCP write tools can therefore report
 * success after the person can see the change, not merely after React state was
 * queued.
 */
export class AtlasMapController {
  private listeners = new Set<() => void>();
  private visibleWaiters = new Map<number, VisibleWaiter>();
  private viewSnapshot: AtlasMapViewSnapshot;
  private readonly apiBase: string;
  private noteSequence = 0;
  private activitySequence = 0;

  constructor(initialRef: PlateRef = { level: "nation" }, apiBase = "") {
    this.apiBase = apiBase.replace(/\/+$/, "");
    this.viewSnapshot = {
      revision: 0,
      visibleRevision: -1,
      navigationStack: [initialRef],
      current: initialRef,
      notes: [],
      toolStatus: "unavailable",
    };
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): AtlasMapViewSnapshot => this.viewSnapshot;

  setToolStatus(toolStatus: AtlasMapViewSnapshot["toolStatus"]): void {
    if (toolStatus === this.viewSnapshot.toolStatus) return;
    this.viewSnapshot = { ...this.viewSnapshot, toolStatus };
    this.emit();
  }

  recordToolActivity(tool: string, state: AtlasToolActivity["state"], summary: string): void {
    this.viewSnapshot = {
      ...this.viewSnapshot,
      lastActivity: { sequence: ++this.activitySequence, at: new Date().toISOString(), tool, state, summary },
    };
    this.emit();
  }

  openCounty(countySlug: string, name: string, state?: string): Promise<void> {
    const county: PlateRef = {
      level: "county",
      countySlug,
      name,
      ...(state ? { state } : {}),
    };
    const stateCode = state ?? countySlug.split("-").at(-1) ?? "";
    return this.commitNavigation([...this.viewSnapshot.navigationStack, county], {
      name,
      countySlug,
      countyName: name,
      state: stateCode,
      kind: "county",
    });
  }

  openState(state: string, stateName?: string): Promise<void> {
    const next: PlateRef = {
      level: "state",
      state: state.toLowerCase(),
      ...(stateName ? { stateName } : {}),
    };
    return this.commitNavigation([...this.viewSnapshot.navigationStack, next]);
  }

  goToDepth(depth: number): Promise<void> {
    if (!Number.isInteger(depth) || depth < 0 || depth >= this.viewSnapshot.navigationStack.length) {
      return Promise.reject(new Error(`Atlas navigation depth ${depth} is out of range.`));
    }
    return this.commitNavigation(this.viewSnapshot.navigationStack.slice(0, depth + 1));
  }

  replaceNavigation(ref: PlateRef): Promise<void> {
    const stack = this.viewSnapshot.navigationStack;
    if (stack.length === 1 && sameRef(stack[0]!, ref)) {
      return this.waitUntilVisible(this.viewSnapshot.revision);
    }
    return this.commitNavigation([ref]);
  }

  async searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSearchResult> {
    const request: RequestInit = { headers: { accept: "application/json" } };
    if (signal) request.signal = signal;
    const response = await fetch(`${this.apiBase}/api/atlas/search?query=${encodeURIComponent(query)}`, {
      ...request,
    });
    if (!response.ok) throw new Error(await responseError(response, "Atlas could not search places."));
    const body = await response.json() as unknown;
    if (!isRecord(body) || body.ok !== true || typeof body.query !== "string") {
      throw new Error("Atlas returned an invalid place-search response.");
    }
    return { ok: true, query: body.query, candidates: parseCandidates(body.candidates) };
  }

  async openPlace(input: OpenPlaceInput, signal?: AbortSignal): Promise<OpenPlaceResult> {
    const resolution = await this.resolvePlace(input.place, signal);
    if (!resolution.ok) return resolution;
    signal?.throwIfAborted();
    const place = resolution.place;
    await this.commitNavigation(navigationFor(place), place, signal);
    return { ok: true, place, revision: this.viewSnapshot.revision };
  }

  openCandidate(candidate: AtlasPlaceCandidate, signal?: AbortSignal): Promise<void> {
    const place = parseCandidate(candidate);
    if (!place) return Promise.reject(new Error("Atlas received an invalid place candidate."));
    return this.commitNavigation(navigationFor(place), place, signal);
  }

  async addMapNote(input: AddMapNoteInput, signal?: AbortSignal): Promise<AddMapNoteResult> {
    const body = input.body.trim();
    if (!body || body.length > 240) {
      return { ok: false, error: { code: "INVALID_INPUT", message: "body must contain 1 to 240 characters", candidates: [] } };
    }
    const resolution = await this.resolvePlace(input.place, signal);
    if (!resolution.ok) return resolution;
    signal?.throwIfAborted();

    const note: MapNote = { id: `note-${++this.noteSequence}`, place: resolution.place, body };
    await this.commitWorkspace(navigationFor(resolution.place), resolution.place, {
      notes: [...this.viewSnapshot.notes, note],
    }, signal);
    return { ok: true, note, revision: this.viewSnapshot.revision };
  }

  async createMapTrail(input: CreateMapTrailInput, signal?: AbortSignal): Promise<CreateMapTrailResult> {
    const title = input.title.trim();
    if (!title || title.length > 60 || input.stops.length < 2 || input.stops.length > 5) {
      return { ok: false, error: { code: "INVALID_INPUT", message: "title must be 1 to 60 characters and stops must contain 2 to 5 items" } };
    }
    for (const stop of input.stops) {
      if (!stop.place.trim() || stop.place.trim().length > 120 || !stop.prompt.trim() || stop.prompt.trim().length > 100) {
        return { ok: false, error: { code: "INVALID_INPUT", message: "each stop needs a 1 to 120 character place and 1 to 100 character prompt" } };
      }
    }

    const resolutions = await Promise.all(input.stops.map((stop) => this.resolvePlace(stop.place.trim(), signal)));
    const failedIndex = resolutions.findIndex((resolution) => !resolution.ok);
    if (failedIndex >= 0) {
      const failure = resolutions[failedIndex]!;
      if (failure.ok) throw new Error("Atlas trail resolution state was inconsistent.");
      return { ok: false, error: { ...failure.error, stopIndex: failedIndex } };
    }
    signal?.throwIfAborted();

    const stops: MapTrailStop[] = resolutions.map((resolution, index) => {
      if (!resolution.ok) throw new Error("Atlas trail resolution changed after validation.");
      return { place: resolution.place, prompt: input.stops[index]!.prompt.trim() };
    });
    const trail: MapTrail = { title, stops, activeIndex: 0 };
    await this.commitWorkspace([{ level: "nation" }], stops[0]!.place, { trail }, signal);
    return { ok: true, trail, revision: this.viewSnapshot.revision };
  }

  openTrailStop(index: number): Promise<void> {
    const trail = this.viewSnapshot.trail;
    const stop = trail?.stops[index];
    if (!trail || !stop) return Promise.reject(new Error("Atlas trail stop is out of range."));
    return this.commitWorkspace(navigationFor(stop.place), stop.place, { trail: { ...trail, activeIndex: index } });
  }

  updateTrailPrompt(index: number, prompt: string): Promise<void> {
    const trail = this.viewSnapshot.trail;
    const body = prompt.trim();
    if (!trail?.stops[index] || !body || body.length > 100) return Promise.reject(new Error("Trail prompt must contain 1 to 100 characters."));
    const stops = trail.stops.map((stop, stopIndex) => stopIndex === index ? { ...stop, prompt: body } : stop);
    return this.commitWorkspace(this.viewSnapshot.navigationStack, this.viewSnapshot.selectedPlace, { trail: { ...trail, stops } });
  }

  updateTrailTitle(title: string): Promise<void> {
    const trail = this.viewSnapshot.trail;
    const value = title.trim();
    if (!trail || !value || value.length > 60) return Promise.reject(new Error("Trail title must contain 1 to 60 characters."));
    return this.commitWorkspace(this.viewSnapshot.navigationStack, this.viewSnapshot.selectedPlace, { trail: { ...trail, title: value } });
  }

  removeTrailStop(index: number): Promise<void> {
    const trail = this.viewSnapshot.trail;
    if (!trail?.stops[index]) return Promise.reject(new Error("Atlas trail stop is out of range."));
    const stops = trail.stops.filter((_, stopIndex) => stopIndex !== index);
    const activeIndex = index < trail.activeIndex
      ? trail.activeIndex - 1
      : Math.min(trail.activeIndex, stops.length - 1);
    const nextTrail = stops.length >= 2 ? { ...trail, stops, activeIndex } : null;
    return this.commitWorkspace(this.viewSnapshot.navigationStack, this.viewSnapshot.selectedPlace, { trail: nextTrail });
  }

  removeNote(id: string): Promise<void> {
    const notes = this.viewSnapshot.notes.filter((note) => note.id !== id);
    if (notes.length === this.viewSnapshot.notes.length) return Promise.reject(new Error("Atlas note was not found."));
    return this.commitWorkspace(this.viewSnapshot.navigationStack, this.viewSnapshot.selectedPlace, { notes });
  }

  updateNote(id: string, body: string): Promise<void> {
    const value = body.trim();
    const index = this.viewSnapshot.notes.findIndex((note) => note.id === id);
    if (index < 0 || !value || value.length > 240) return Promise.reject(new Error("Map note must contain 1 to 240 characters."));
    const notes = this.viewSnapshot.notes.map((note, noteIndex) => noteIndex === index ? { ...note, body: value } : note);
    return this.commitWorkspace(this.viewSnapshot.navigationStack, this.viewSnapshot.selectedPlace, { notes });
  }

  private async resolvePlace(query: string, signal?: AbortSignal): Promise<
    | { ok: true; place: AtlasPlaceCandidate }
    | Extract<OpenPlaceResult, { ok: false }>
  > {
    const request: RequestInit = { headers: { accept: "application/json" } };
    if (signal) request.signal = signal;
    const response = await fetch(`${this.apiBase}/api/atlas/resolve?query=${encodeURIComponent(query)}`, {
      ...request,
    });
    if (!response.ok) throw new Error(await responseError(response, "Atlas could not resolve that place."));

    const resolution = await response.json() as unknown;
    if (!isRecord(resolution) || resolution.ok !== true || typeof resolution.status !== "string") {
      throw new Error("Atlas returned an invalid place-resolution response.");
    }

    if (resolution.status !== "resolved") {
      if (resolution.status !== "ambiguous" && resolution.status !== "unresolved") {
        throw new Error("Atlas returned an unknown place-resolution status.");
      }
      const ambiguous = resolution.status === "ambiguous";
      return {
        ok: false,
        error: {
          code: ambiguous ? "AMBIGUOUS_PLACE" : "UNKNOWN_PLACE",
          message: ambiguous
            ? "That name matches several indexed places. Choose a state or county from the candidates."
            : "Atlas could not find that place. Try a nearby candidate or include the state.",
          candidates: parseCandidates(resolution.candidates),
        },
      };
    }

    const place = parseCandidate(resolution.place);
    if (!place) throw new Error("Atlas returned an invalid resolved place.");
    return { ok: true, place };
  }

  acknowledgeVisible(revision: number): void {
    if (revision < this.viewSnapshot.visibleRevision || revision > this.viewSnapshot.revision) return;

    if (revision !== this.viewSnapshot.visibleRevision) {
      this.viewSnapshot = { ...this.viewSnapshot, visibleRevision: revision };
      this.emit();
    }

    for (const [pendingRevision, waiter] of this.visibleWaiters) {
      if (pendingRevision <= revision) {
        this.visibleWaiters.delete(pendingRevision);
        waiter.resolve();
      }
    }
  }

  rejectVisible(revision: number, error: Error): void {
    for (const [pendingRevision, waiter] of this.visibleWaiters) {
      if (pendingRevision <= revision) {
        this.visibleWaiters.delete(pendingRevision);
        waiter.reject(error);
      }
    }
  }

  dispose(): void {
    const error = new Error("Atlas map controller was disposed before the map became visible.");
    for (const waiter of this.visibleWaiters.values()) waiter.reject(error);
    this.visibleWaiters.clear();
    this.listeners.clear();
  }

  private commitNavigation(navigationStack: readonly PlateRef[], selectedPlace?: AtlasPlaceCandidate, signal?: AbortSignal): Promise<void> {
    return this.commitWorkspace(navigationStack, selectedPlace, {}, signal);
  }

  private commitWorkspace(
    navigationStack: readonly PlateRef[],
    selectedPlace: AtlasPlaceCandidate | undefined,
    changes: { notes?: readonly MapNote[]; trail?: MapTrail | null },
    signal?: AbortSignal,
  ): Promise<void> {
    signal?.throwIfAborted();
    const revision = this.viewSnapshot.revision + 1;
    const current = navigationStack[navigationStack.length - 1];
    if (!current) return Promise.reject(new Error("Atlas navigation cannot be empty."));

    for (const [pendingRevision, waiter] of this.visibleWaiters) {
      this.visibleWaiters.delete(pendingRevision);
      waiter.reject(new Error("A newer Atlas transition replaced this one before it became visible."));
    }

    const visible = new Promise<void>((resolve, reject) => {
      const cleanup = () => signal?.removeEventListener("abort", onAbort);
      const waiter: VisibleWaiter = {
        resolve: () => {
          cleanup();
          resolve();
        },
        reject: (error) => {
          cleanup();
          reject(error);
        },
      };
      const onAbort = () => {
        if (this.visibleWaiters.get(revision) !== waiter) return;
        this.visibleWaiters.delete(revision);
        waiter.reject(abortError(signal));
      };
      this.visibleWaiters.set(revision, waiter);
      signal?.addEventListener("abort", onAbort, { once: true });
    });

    const { selectedPlace: _previousSelection, trail: previousTrail, ...previous } = this.viewSnapshot;
    const nextTrail = "trail" in changes ? changes.trail : previousTrail;
    this.viewSnapshot = {
      ...previous,
      revision,
      navigationStack: [...navigationStack],
      current,
      ...(selectedPlace ? { selectedPlace } : {}),
      ...(changes.notes ? { notes: changes.notes } : {}),
      ...(nextTrail ? { trail: nextTrail } : {}),
    };
    this.emit();
    return visible;
  }

  private waitUntilVisible(revision: number): Promise<void> {
    if (this.viewSnapshot.visibleRevision >= revision) return Promise.resolve();
    const existing = this.visibleWaiters.get(revision);
    if (existing) {
      return new Promise<void>((resolve, reject) => {
        const resolveBoth = existing.resolve;
        const rejectBoth = existing.reject;
        this.visibleWaiters.set(revision, {
          resolve: () => {
            resolveBoth();
            resolve();
          },
          reject: (error) => {
            rejectBoth(error);
            reject(error);
          },
        });
      });
    }
    return new Promise<void>((resolve, reject) => {
      this.visibleWaiters.set(revision, { resolve, reject });
    });
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

async function responseError(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => undefined)) as { error?: unknown } | undefined;
  return typeof body?.error === "string" ? body.error : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCandidate(value: unknown): AtlasPlaceCandidate | undefined {
  if (!isRecord(value)) return undefined;
  const { name, countySlug, countyName, state, kind } = value;
  if (
    typeof name !== "string" || !name || name.length > 120 ||
    typeof countySlug !== "string" || !/^[a-z0-9-]+$/.test(countySlug) || countySlug.length > 120 ||
    typeof countyName !== "string" || !countyName || countyName.length > 120 ||
    typeof state !== "string" || !/^[a-z]{2}$/.test(state) ||
    (kind !== "place" && kind !== "county")
  ) return undefined;
  return { name, countySlug, countyName, state, kind };
}

function parseCandidates(value: unknown): AtlasPlaceCandidate[] {
  if (!Array.isArray(value)) throw new Error("Atlas returned invalid place candidates.");
  const parsed = value.slice(0, 8).map(parseCandidate);
  if (parsed.some((candidate) => !candidate)) throw new Error("Atlas returned an invalid place candidate.");
  return parsed as AtlasPlaceCandidate[];
}

function navigationFor(place: AtlasPlaceCandidate): PlateRef[] {
  return [
    { level: "nation" },
    { level: "state", state: place.state },
    { level: "county", countySlug: place.countySlug, state: place.state, name: place.countyName },
  ];
}

function abortError(signal?: AbortSignal): Error {
  return signal?.reason instanceof Error ? signal.reason : new DOMException("The Atlas transition was canceled.", "AbortError");
}
