#!/usr/bin/env node
// READ-ONLY diagnostic: replay the exact command TYPES the W6 queue uses
// against a real Redis to find which one corrupts the @redis/client v6
// connection in production. No writes: reads and a read-only EVAL.
import { createClient } from "redis";

const url = process.env.ATLAS_REPRO_REDIS_URL;
if (!url) throw new Error("set ATLAS_REPRO_REDIS_URL");
const client = createClient({ url });
client.on("error", (e) => console.error("client-error:", e?.message ?? e));

const QK = "atlas:scene-packet-jobs:v2:pending";
const CK = "atlas:scene-packet-jobs:v2:claimed";
const READONLY_EVAL = `
local expired = redis.call('zrangebyscore', KEYS[2], '-inf', tonumber(ARGV[1]))
return { redis.call('zcard', KEYS[1]), #expired }
`;

async function step(name, fn) {
  try {
    const out = await fn();
    console.log("OK ", name, JSON.stringify(out)?.slice(0, 60));
  } catch (error) {
    console.log("ERR", name, (error?.message ?? String(error)).slice(0, 120));
  }
}

await client.connect();
console.log("connected");
await step("ping", () => client.ping());
await step("zCard", () => client.zCard(QK));
await step("zRange", () => client.zRange(QK, 0, 0));
await step("eval-readonly", () => client.eval(READONLY_EVAL, { keys: [QK, CK], arguments: [String(Date.now())] }));
await step("ping-after-eval", () => client.ping());
await client.close();
console.log("done - connection survived");
