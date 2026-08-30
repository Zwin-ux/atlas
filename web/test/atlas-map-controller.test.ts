import assert from "node:assert/strict";
import test from "node:test";

import { AtlasMapController } from "../src/atlas/AtlasMapController";

test("controller owns navigation and resolves only after the matching revision is visible", async () => {
  const controller = new AtlasMapController();
  const transition = controller.openCounty("abbeville-sc", "Abbeville County");
  let resolved = false;
  void transition.then(() => {
    resolved = true;
  });

  const pending = controller.getSnapshot();
  assert.equal(pending.revision, 1);
  assert.equal(pending.visibleRevision, -1);
  assert.deepEqual(pending.navigationStack, [
    { level: "nation" },
    { level: "county", countySlug: "abbeville-sc", name: "Abbeville County" },
  ]);

  await Promise.resolve();
  assert.equal(resolved, false);

  controller.acknowledgeVisible(1);
  await transition;
  assert.equal(resolved, true);
  assert.equal(controller.getSnapshot().visibleRevision, 1);
});

test("breadcrumb navigation uses the same revision path as county opening", async () => {
  const controller = new AtlasMapController({ level: "state", state: "ca", stateName: "California" });
  const open = controller.openCounty("alameda-ca", "Alameda County", "ca");
  controller.acknowledgeVisible(1);
  await open;

  const back = controller.goToDepth(0);
  assert.deepEqual(controller.getSnapshot().current, { level: "state", state: "ca", stateName: "California" });
  assert.equal(controller.getSnapshot().revision, 2);
  controller.acknowledgeVisible(2);
  await back;
});

test("a failed visible transition rejects without falsifying the visible revision", async () => {
  const controller = new AtlasMapController();
  const transition = controller.openState("tx", "Texas");
  controller.rejectVisible(1, new Error("plate failed"));

  await assert.rejects(transition, /plate failed/);
  assert.equal(controller.getSnapshot().revision, 1);
  assert.equal(controller.getSnapshot().visibleRevision, -1);
});

test("a failed newer transition rejects both the superseded and current transitions", async () => {
  const controller = new AtlasMapController();
  const first = controller.openState("tx", "Texas");
  const firstRejection = assert.rejects(first, /newer Atlas transition/);
  const second = controller.openCounty("travis-tx", "Travis County", "tx");
  const secondRejection = assert.rejects(second, /latest plate failed/);

  controller.rejectVisible(2, new Error("latest plate failed"));

  await Promise.all([firstRejection, secondRejection]);
  assert.equal(controller.getSnapshot().visibleRevision, -1);
});

test("a newer transition rejects an older pending success claim", async () => {
  const controller = new AtlasMapController();
  const first = controller.openState("tx", "Texas");
  const second = controller.openState("ca", "California");

  await assert.rejects(first, /newer Atlas transition/);
  controller.acknowledgeVisible(2);
  await second;
  assert.equal(controller.getSnapshot().visibleRevision, 2);
  assert.deepEqual(controller.getSnapshot().current, { level: "state", state: "ca", stateName: "California" });
});

test("canceling a committed transition prevents a false success result", async () => {
  const controller = new AtlasMapController();
  const execution = new AbortController();
  const transition = controller.openCandidate({
    name: "Riverside",
    countySlug: "riverside-ca",
    countyName: "Riverside County",
    state: "ca",
    kind: "place",
  }, execution.signal);

  execution.abort(new Error("search canceled"));
  await assert.rejects(transition, /search canceled/);
  assert.equal(controller.getSnapshot().revision, 1);
  assert.equal(controller.getSnapshot().visibleRevision, -1);
});

test("invalid breadcrumb depth does not mutate state", async () => {
  const controller = new AtlasMapController();
  const before = controller.getSnapshot();

  await assert.rejects(controller.goToDepth(2), /out of range/);
  assert.equal(controller.getSnapshot(), before);
});

test("openPlace resolves every name before one visible controller mutation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    status: "resolved",
    place: {
      name: "Riverside",
      countySlug: "riverside-ca",
      countyName: "Riverside County",
      state: "ca",
      kind: "place",
    },
  }), { status: 200, headers: { "content-type": "application/json" } });

  try {
    const transition = controllerOpenPlace();
    await new Promise<void>((resolve) => setImmediate(resolve));
    const pending = transition.controller.getSnapshot();
    assert.equal(pending.revision, 1);
    assert.equal(pending.current.level, "county");
    assert.equal(pending.selectedPlace?.name, "Riverside");

    transition.controller.acknowledgeVisible(1);
    assert.deepEqual(await transition.result, {
      ok: true,
      place: pending.selectedPlace,
      revision: 1,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ambiguous openPlace results leave the complete map snapshot unchanged", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    status: "ambiguous",
    query: "Springfield",
    candidates: [{
      name: "Springfield",
      countySlug: "sangamon-il",
      countyName: "Sangamon County",
      state: "il",
      kind: "place",
    }],
  }), { status: 200, headers: { "content-type": "application/json" } });

  try {
    const controller = new AtlasMapController();
    const before = controller.getSnapshot();
    const result = await controller.openPlace({ place: "Springfield" });
    assert.equal(result.ok, false);
    assert.equal(controller.getSnapshot(), before);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid resolution payloads fail before mutation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    status: "resolved",
    place: { name: "Riverside", countySlug: "../../escape", countyName: "Riverside County", state: "ca", kind: "place" },
  }), { status: 200, headers: { "content-type": "application/json" } });

  try {
    const controller = new AtlasMapController();
    const before = controller.getSnapshot();
    await assert.rejects(controller.openPlace({ place: "Riverside" }), /invalid resolved place/);
    assert.equal(controller.getSnapshot(), before);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("createMapTrail resolves every stop before one atomic mutation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const query = new URL(String(input), "http://atlas.test").searchParams.get("query")!;
    const byQuery = {
      "Eastvale, CA": { name: "Eastvale", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", kind: "place" },
      "Norco, CA": { name: "Norco", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", kind: "place" },
    } as const;
    return new Response(JSON.stringify({ ok: true, status: "resolved", place: byQuery[query as keyof typeof byQuery] }), { status: 200 });
  };

  try {
    const controller = new AtlasMapController();
    const resultPromise = controller.createMapTrail({ title: "River corridor", stops: [
      { place: "Eastvale, CA", prompt: "Check flood sources" },
      { place: "Norco, CA", prompt: "Compare river access" },
    ] });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(controller.getSnapshot().revision, 1);
    assert.equal(controller.getSnapshot().trail?.stops.length, 2);
    assert.deepEqual(controller.getSnapshot().current, { level: "nation" });
    assert.deepEqual(controller.getSnapshot().navigationStack, [{ level: "nation" }]);
    assert.equal(controller.getSnapshot().selectedPlace?.name, "Eastvale");
    controller.acknowledgeVisible(1);
    const result = await resultPromise;
    assert.equal(result.ok, true);
    assert.equal(controller.getSnapshot().visibleRevision, 1);

    const openStop = controller.openTrailStop(1);
    assert.equal(controller.getSnapshot().trail?.activeIndex, 1);
    assert.deepEqual(controller.getSnapshot().current, {
      level: "county",
      countySlug: "riverside-ca",
      state: "ca",
      name: "Riverside County",
    });
    controller.acknowledgeVisible(2);
    await openStop;
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("one ambiguous trail stop leaves the complete workspace unchanged", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const query = new URL(String(input), "http://atlas.test").searchParams.get("query")!;
    const body = query === "Springfield"
      ? { ok: true, status: "ambiguous", query, candidates: [{ name: "Springfield", countySlug: "sangamon-il", countyName: "Sangamon County", state: "il", kind: "place" }] }
      : { ok: true, status: "resolved", place: { name: "Eastvale", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", kind: "place" } };
    return new Response(JSON.stringify(body), { status: 200 });
  };

  try {
    const controller = new AtlasMapController();
    const before = controller.getSnapshot();
    const result = await controller.createMapTrail({ title: "Ambiguous trail", stops: [
      { place: "Eastvale, CA", prompt: "Start here" },
      { place: "Springfield", prompt: "Needs a state" },
    ] });
    assert.equal(result.ok, false);
    assert.equal(controller.getSnapshot(), before);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("removing a stop before the active stop keeps the same active place after renumbering", async () => {
  const originalFetch = globalThis.fetch;
  const places = {
    Riverside: { name: "Riverside County", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", kind: "county" },
    Travis: { name: "Travis County", countySlug: "travis-tx", countyName: "Travis County", state: "tx", kind: "county" },
    Miami: { name: "Miami-Dade County", countySlug: "miami-dade-fl", countyName: "Miami-Dade County", state: "fl", kind: "county" },
  } as const;
  globalThis.fetch = async (input) => {
    const query = new URL(String(input), "http://atlas.test").searchParams.get("query")!;
    return new Response(JSON.stringify({ ok: true, status: "resolved", place: places[query as keyof typeof places] }), { status: 200 });
  };

  try {
    const controller = new AtlasMapController();
    const create = controller.createMapTrail({ title: "County trail", stops: [
      { place: "Riverside", prompt: "Start" },
      { place: "Travis", prompt: "Compare" },
      { place: "Miami", prompt: "Finish" },
    ] });
    await new Promise<void>((resolve) => setImmediate(resolve));
    controller.acknowledgeVisible(1);
    await create;

    const open = controller.openTrailStop(2);
    controller.acknowledgeVisible(2);
    await open;

    const remove = controller.removeTrailStop(0);
    const pending = controller.getSnapshot();
    assert.equal(pending.trail?.activeIndex, 1);
    assert.equal(pending.trail?.stops[pending.trail.activeIndex]?.place.name, "Miami-Dade County");
    controller.acknowledgeVisible(3);
    await remove;
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("addMapNote resolves the place and displays the note before success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    status: "resolved",
    place: { name: "Eastvale", countySlug: "riverside-ca", countyName: "Riverside County", state: "ca", kind: "place" },
  }), { status: 200 });

  try {
    const controller = new AtlasMapController();
    const resultPromise = controller.addMapNote({ place: "Eastvale, CA", body: "Verify coastal flooding sources." });
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(controller.getSnapshot().notes[0]?.body, "Verify coastal flooding sources.");
    assert.equal(controller.getSnapshot().revision, 1);
    controller.acknowledgeVisible(1);
    const result = await resultPromise;
    assert.equal(result.ok, true);
    assert.equal(controller.getSnapshot().visibleRevision, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("execution cancellation during resolution leaves map state untouched", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
  });

  try {
    const controller = new AtlasMapController();
    const before = controller.getSnapshot();
    const execution = new AbortController();
    const result = controller.openPlace({ place: "Riverside, CA" }, execution.signal);
    execution.abort(new Error("canceled"));
    await assert.rejects(result, /canceled/);
    assert.equal(controller.getSnapshot(), before);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function controllerOpenPlace() {
  const controller = new AtlasMapController();
  return { controller, result: controller.openPlace({ place: "Riverside, CA" }) };
}
