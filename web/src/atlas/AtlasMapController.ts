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

export type OpenPlaceResult =
  | { ok: true; place: AtlasPlaceCandidate; revision: number }
  | {
      ok: false;
      error: {
        code: "AMBIGUOUS_PLACE" | "UNKNOWN_PLACE";
        message: string;
        candidates: AtlasPlaceCandidate[];
      };
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

  constructor(initialRef: PlateRef = { level: "nation" }, apiBase = "") {
    this.apiBase = apiBase.replace(/\/+$/, "");
    this.viewSnapshot = {
      revision: 0,
      visibleRevision: -1,
      navigationStack: [initialRef],
      current: initialRef,
    };
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): AtlasMapViewSnapshot => this.viewSnapshot;

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
    const request: RequestInit = { headers: { accept: "application/json" } };
    if (signal) request.signal = signal;
    const response = await fetch(`${this.apiBase}/api/atlas/resolve?query=${encodeURIComponent(input.place)}`, {
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

    signal?.throwIfAborted();
    const place = parseCandidate(resolution.place);
    if (!place) throw new Error("Atlas returned an invalid resolved place.");
    const navigation: PlateRef[] = [
      { level: "nation" },
      { level: "state", state: place.state },
      { level: "county", countySlug: place.countySlug, state: place.state, name: place.countyName },
    ];
    await this.commitNavigation(navigation, place);
    return { ok: true, place, revision: this.viewSnapshot.revision };
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

  private commitNavigation(navigationStack: readonly PlateRef[], selectedPlace?: AtlasPlaceCandidate): Promise<void> {
    const revision = this.viewSnapshot.revision + 1;
    const current = navigationStack[navigationStack.length - 1];
    if (!current) return Promise.reject(new Error("Atlas navigation cannot be empty."));

    const visible = new Promise<void>((resolve, reject) => {
      this.visibleWaiters.set(revision, { resolve, reject });
    });

    const { selectedPlace: _previousSelection, ...previous } = this.viewSnapshot;
    this.viewSnapshot = {
      ...previous,
      revision,
      navigationStack: [...navigationStack],
      current,
      ...(selectedPlace ? { selectedPlace } : {}),
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
