export type PlateRef =
  | { level: "nation" }
  | { level: "state"; state: string; stateName?: string }
  | { level: "county"; countySlug: string; state?: string; name?: string };

export type AtlasMapViewSnapshot = Readonly<{
  revision: number;
  visibleRevision: number;
  navigationStack: readonly PlateRef[];
  current: PlateRef;
}>;

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

  constructor(initialRef: PlateRef = { level: "nation" }) {
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
    return this.commitNavigation([...this.viewSnapshot.navigationStack, county]);
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

  private commitNavigation(navigationStack: readonly PlateRef[]): Promise<void> {
    const revision = this.viewSnapshot.revision + 1;
    const current = navigationStack[navigationStack.length - 1];
    if (!current) return Promise.reject(new Error("Atlas navigation cannot be empty."));

    const visible = new Promise<void>((resolve, reject) => {
      this.visibleWaiters.set(revision, { resolve, reject });
    });

    this.viewSnapshot = {
      ...this.viewSnapshot,
      revision,
      navigationStack: [...navigationStack],
      current,
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
