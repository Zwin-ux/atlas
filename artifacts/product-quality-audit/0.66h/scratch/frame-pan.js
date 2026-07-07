(async () => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return JSON.stringify({ error: 'no canvas' });
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const frames = [];
  let raf = true;
  let last = performance.now();
  const tick = (t) => { frames.push(t - last); last = t; if (raf) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const fire = (type, x, y) => {
    canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch',
      clientX: x, clientY: y, buttons: 1, isPrimary: true
    }));
  };
  fire('pointerdown', cx, cy);
  const steps = 120;
  for (let i = 0; i < steps; i++) {
    const x = cx + Math.sin(i / 10) * 150 - i;
    const y = cy + Math.cos(i / 10) * 80;
    fire('pointermove', x, y);
    await new Promise(r => setTimeout(r, 16));
  }
  fire('pointerup', cx - steps, cy);
  await new Promise(r => setTimeout(r, 100));
  raf = false;
  const samples = frames.slice(2);
  const sorted = samples.slice().sort((a, b) => a - b);
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const max = sorted[sorted.length - 1];
  return JSON.stringify({
    kind: 'pan-drag', frames: samples.length,
    avgMs: +avg.toFixed(1), p95Ms: +p95.toFixed(1), maxMs: +max.toFixed(1),
    over16_8: samples.filter(f => f > 16.8).length,
    over33_4: samples.filter(f => f > 33.4).length
  });
})()
