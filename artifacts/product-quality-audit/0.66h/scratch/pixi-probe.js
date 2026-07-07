(() => {
  const out = { pixiGlobals: Object.keys(window).filter(k => /pixi/i.test(k)) };
  const app = window.__PIXI_APP__
    || (window.__PIXI_DEVTOOLS__ && window.__PIXI_DEVTOOLS__.app)
    || (window.__PIXI__ && window.__PIXI__.app);
  if (app && app.stage) {
    let count = 0; const byType = {};
    const walk = (n) => {
      count++;
      const t = (n.constructor && n.constructor.name) || '?';
      byType[t] = (byType[t] || 0) + 1;
      (n.children || []).forEach(walk);
    };
    walk(app.stage);
    out.displayObjects = count;
    out.byType = byType;
    out.stageFilters = (app.stage.filters || []).map(f => f.constructor.name);
    try { out.rendererName = app.renderer.name || String(app.renderer.type); } catch (e) {}
    try { out.tickerStarted = app.ticker.started; out.tickerFPS = Math.round(app.ticker.FPS); } catch (e) {}
  } else {
    out.note = 'no pixi app handle exposed on window';
  }
  const marks = performance.getEntriesByType('mark').map(m => ({ n: m.name, t: Math.round(m.startTime) }));
  const measures = performance.getEntriesByType('measure').map(m => ({ n: m.name, t: Math.round(m.startTime), d: Math.round(m.duration) }));
  out.perfMarks = marks.slice(0, 30);
  out.perfMeasures = measures.slice(0, 30);
  return JSON.stringify(out);
})()
