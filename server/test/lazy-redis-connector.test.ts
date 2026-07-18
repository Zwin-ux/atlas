import assert from "node:assert/strict";
import { createServer } from "node:net";
import test from "node:test";
import { createLazyRedisConnector } from "../src/scenePacketMemoryAdapter.js";

test("maxclients handshake errors reject cleanly and a later attempt uses a fresh client", async (t) => {
  let connections = 0;
  const server = createServer((socket) => {
    connections += 1;
    socket.write("-ERR max number of clients reached\r\n", () => {
      setTimeout(() => socket.end(), 50);
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => server.close());

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const connector = createLazyRedisConnector(`redis://127.0.0.1:${address.port}`);

  const firstStartedAt = Date.now();
  await assert.rejects(connector.client(), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.doesNotMatch(error.message, /reading ['"]reject['"]/i);
    assert.notEqual(error.name, "TypeError");
    return true;
  });
  assert.ok(Date.now() - firstStartedAt < 3_000, "first failure should be bounded");
  const firstConnectionCount = connections;

  await assert.rejects(connector.client(), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.doesNotMatch(error.message, /reading ['"]reject['"]/i);
    assert.notEqual(error.name, "TypeError");
    return true;
  });
  assert.ok(connections > firstConnectionCount, "second attempt should create a fresh client");
});
