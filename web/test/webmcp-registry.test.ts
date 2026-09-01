/// <reference types="webmcp-types" />

import assert from "node:assert/strict";
import test from "node:test";

import { AtlasMapController } from "../src/atlas/AtlasMapController";
import { registerAtlasWebMcpTools } from "../src/atlas/webmcpRegistry";
import { ATLAS_WEBMCP_TOOL_NAMES } from "../src/atlas/webmcpTools";

test("registration exposes the exact five tools and cleanup aborts their shared lifecycle", async () => {
  const controller = new AtlasMapController();
  const seen: Array<{ name: string; signal?: AbortSignal }> = [];
  const cleanup = registerAtlasWebMcpTools(controller, {
    registerTool: async (tool, options) => {
      seen.push({ name: tool.name, ...(options?.signal ? { signal: options.signal } : {}) });
    },
  });

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.deepEqual(seen.map((entry) => entry.name), [...ATLAS_WEBMCP_TOOL_NAMES]);
  assert.equal(controller.getSnapshot().toolStatus, "available");
  assert.ok(seen.every((entry) => entry.signal === seen[0]?.signal));

  cleanup();
  assert.equal(seen[0]?.signal?.aborted, true);
});

test("one rejected registration aborts successful partial registrations", async () => {
  const controller = new AtlasMapController();
  const signals: AbortSignal[] = [];
  registerAtlasWebMcpTools(controller, {
    registerTool: async (tool, options) => {
      if (options?.signal) signals.push(options.signal);
      if (tool.name === "add_map_note") throw new Error("duplicate tool");
    },
  });

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(controller.getSnapshot().toolStatus, "failed");
  assert.ok(signals.length > 0 && signals.every((signal) => signal.aborted));
});

test("normal lifecycle cleanup cannot be misreported as a registration failure", async () => {
  const controller = new AtlasMapController();
  const cleanup = registerAtlasWebMcpTools(controller, {
    registerTool: (_tool, options) => new Promise<void>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true });
    }),
  });

  cleanup();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(controller.getSnapshot().toolStatus, "registering");

  registerAtlasWebMcpTools(controller, { registerTool: async () => undefined });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(controller.getSnapshot().toolStatus, "available");
});
