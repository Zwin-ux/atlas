#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import { join } from "node:path";
import process from "node:process";

/**
 * Preview-bundle budget guard.
 *
 * The ChatGPT widget bundle (`web/dist/component.js`) is inlined whole into the
 * `/preview` HTML and parsed inside the ChatGPT iframe on first render, so its
 * size is the first thing every user feels. The server serves it brotli/gzip
 * compressed, so the on-the-wire size is what matters most, but the raw size
 * still drives parse/execute time. This guard fails if either regresses past a
 * ceiling with headroom above today's footprint.
 */

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");

// Ceilings: current raw ~948KB / brotli ~242KB. Headroom to catch runaway
// growth (a stray heavy import) without flapping on normal churn.
const RAW_CEILING_BYTES = 1_150_000;
const BROTLI_CEILING_BYTES = 320_000;

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
  const combined = Buffer.concat([js, css]);
  const brotli = brotliCompressSync(combined, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: combined.length,
    },
  });
  const gzip = gzipSync(combined, { level: 9 });

  summary = {
    rawJsBytes: js.length,
    rawCssBytes: css.length,
    rawTotalBytes: combined.length,
    brotliBytes: brotli.length,
    gzipBytes: gzip.length,
    rawCeilingBytes: RAW_CEILING_BYTES,
    brotliCeilingBytes: BROTLI_CEILING_BYTES,
    brotliSavingsPct: Number((100 * (1 - brotli.length / combined.length)).toFixed(1)),
  };

  if (js.length > RAW_CEILING_BYTES) {
    blockers.push(`component.js raw size ${js.length} exceeds ceiling ${RAW_CEILING_BYTES}. Split/lazy-load heavy deps (e.g. pixi.js) before raising the ceiling.`);
  }
  if (brotli.length > BROTLI_CEILING_BYTES) {
    blockers.push(`preview bundle brotli size ${brotli.length} exceeds on-the-wire ceiling ${BROTLI_CEILING_BYTES}.`);
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
