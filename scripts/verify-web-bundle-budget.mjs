#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import { join } from "node:path";
import process from "node:process";

/**
 * Preview-bundle budget guard.
 *
 * The ChatGPT widget shell loads `web/dist/component.js` eagerly and defers the
 * Pixi renderer into `/web/dist/chunks/*`. The eager bundle is the first parse
 * cost every iframe pays; total JS still matters, but it can arrive after the
 * fallback map paints.
 */

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");

const EAGER_JS_CEILING_BYTES = 400_000;
const TOTAL_JS_CEILING_BYTES = 1_150_000;
const EAGER_BROTLI_CEILING_BYTES = 130_000;

const bundlePath = join(root, "web/dist/component.js");
const cssPath = join(root, "web/dist/component.css");
const blockers = [];

if (!existsSync(bundlePath)) {
  blockers.push("web/dist/component.js is missing. Run `pnpm build:web` before this guard.");
}

let summary = null;
if (blockers.length === 0) {
  const js = readFileSync(bundlePath);
  const css = existsSync(cssPath) ? readFileSync(cssPath) : Buffer.alloc(0);
  const eagerCombined = Buffer.concat([js, css]);
  const chunkFiles = listJsFiles(join(root, "web/dist/chunks"));
  const chunkBytes = chunkFiles.reduce((sum, path) => sum + readFileSync(path).length, 0);
  const totalJsBytes = js.length + chunkBytes;
  const brotli = brotliCompressSync(eagerCombined, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: eagerCombined.length,
    },
  });
  const gzip = gzipSync(eagerCombined, { level: 9 });

  summary = {
    eagerJsBytes: js.length,
    rawCssBytes: css.length,
    eagerRawBytes: eagerCombined.length,
    deferredChunkCount: chunkFiles.length,
    deferredJsBytes: chunkBytes,
    totalJsBytes,
    eagerBrotliBytes: brotli.length,
    gzipBytes: gzip.length,
    eagerJsCeilingBytes: EAGER_JS_CEILING_BYTES,
    totalJsCeilingBytes: TOTAL_JS_CEILING_BYTES,
    eagerBrotliCeilingBytes: EAGER_BROTLI_CEILING_BYTES,
    brotliSavingsPct: Number((100 * (1 - brotli.length / eagerCombined.length)).toFixed(1)),
  };

  if (js.length > EAGER_JS_CEILING_BYTES) {
    blockers.push(`component.js eager size ${js.length} exceeds ceiling ${EAGER_JS_CEILING_BYTES}. Keep Pixi/renderer code lazy-loaded.`);
  }
  if (totalJsBytes > TOTAL_JS_CEILING_BYTES) {
    blockers.push(`total JS size ${totalJsBytes} exceeds ceiling ${TOTAL_JS_CEILING_BYTES}.`);
  }
  if (brotli.length > EAGER_BROTLI_CEILING_BYTES) {
    blockers.push(`eager JS+CSS brotli size ${brotli.length} exceeds on-the-wire ceiling ${EAGER_BROTLI_CEILING_BYTES}.`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.51e-web-bundle-budget",
  summary,
  blockerCount: blockers.length,
  blockers,
};

if (jsonOnly) {
  console.log(JSON.stringify(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (!result.ok) {
  process.exitCode = 1;
}

function listJsFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(path);
    return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
  });
}
