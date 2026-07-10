// Real-touch drivers for the production emulator (ChatGPT-on-iPhone fidelity).
//
// These dispatch browser-level touches via CDP Input.dispatchTouchEvent, NOT
// synthetic PointerEvent constructors: the events enter the real input
// pipeline (hit-testing through the emulator iframe, touch -> pointer
// translation with pointerType "touch", gesture semantics) — exactly what the
// widget receives from a finger inside the ChatGPT iOS app. Requires the
// target to be emulated mobile (Emulation.setDeviceMetricsOverride mobile:true).
//
// Coordinates are MAIN-FRAME viewport CSS px; use innerCanvasCenter() to
// resolve the widget canvas through the [data-qa='emulator-frame'] iframe.
import { evaluate } from "./cdp.mjs";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Main-frame coords of the widget canvas center (+ its main-frame rect). */
export async function innerCanvasCenter(client) {
  const rect = await evaluate(client, `(() => {
    const frame = document.querySelector("[data-qa='emulator-frame']");
    const inner = frame?.contentWindow;
    const canvas = inner?.document?.querySelector("canvas");
    if (!frame || !canvas) throw new Error("missing emulator frame or inner canvas");
    const frameRect = frame.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    return {
      x: frameRect.left + canvasRect.left,
      y: frameRect.top + canvasRect.top,
      width: canvasRect.width,
      height: canvasRect.height,
    };
  })()`);
  return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2, rect };
}

async function touch(client, type, touchPoints) {
  await client.send("Input.dispatchTouchEvent", { type, touchPoints });
}

/** One-finger drag: touchStart -> N coalesced moves -> touchEnd. */
export async function touchPan(client, { from, to, steps = 12, stepDelayMs = 16 }) {
  await touch(client, "touchStart", [{ x: from.x, y: from.y, id: 1 }]);
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    await touch(client, "touchMove", [{ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, id: 1 }]);
    await delay(stepDelayMs);
  }
  await touch(client, "touchEnd", []);
}

/** Two-finger pinch around a center. scale > 1 spreads (zoom in), < 1 squeezes. */
export async function touchPinch(client, { center, startSpread = 60, scale = 1.8, steps = 12, stepDelayMs = 16 }) {
  const endSpread = startSpread * scale;
  const points = (spread) => [
    { x: center.x - spread / 2, y: center.y, id: 1 },
    { x: center.x + spread / 2, y: center.y, id: 2 },
  ];
  await touch(client, "touchStart", points(startSpread));
  for (let step = 1; step <= steps; step += 1) {
    const spread = startSpread + (endSpread - startSpread) * (step / steps);
    await touch(client, "touchMove", points(spread));
    await delay(stepDelayMs);
  }
  await touch(client, "touchEnd", []);
}

/** Finger tap (start+end in place — the widget's tap-vs-drag detector sees no movement). */
export async function touchTap(client, { x, y }) {
  await touch(client, "touchStart", [{ x, y, id: 1 }]);
  await delay(60);
  await touch(client, "touchEnd", []);
}
