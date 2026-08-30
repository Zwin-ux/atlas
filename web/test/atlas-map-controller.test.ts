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

test("a failed newer transition rejects superseded transitions that can no longer render", async () => {
  const controller = new AtlasMapController();
  const first = controller.openState("tx", "Texas");
  const second = controller.openCounty("travis-tx", "Travis County", "tx");

  controller.rejectVisible(2, new Error("latest plate failed"));

  await assert.rejects(first, /latest plate failed/);
  await assert.rejects(second, /latest plate failed/);
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

function controllerOpenPlace() {
  const controller = new AtlasMapController();
  return { controller, result: controller.openPlace({ place: "Riverside, CA" }) };
}
