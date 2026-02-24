/**
 * @typedef {Object} OrbShardPalette
 * @property {string} strokeRgb
 * @property {string} fillRgb
 * @property {number} fillAlpha
 */

/**
 * @typedef {Object} CreateOrbShatterRuntimeOptions
 * @property {SVGElement|HTMLElement} layerEl SVG layer element for shard paths.
 * @property {(n:number, min:number, max:number) => number} [clamp]
 * @property {number} [gravityPxS2]
 */

/**
 * Runtime for orb shatter shard DOM pieces + RAF simulation.
 *
 * Palette capture remains receiver-owned; caller passes a frozen palette into `spawnPiece`.
 *
 * @param {CreateOrbShatterRuntimeOptions} options
 */
export function createOrbShatterRuntime({
  layerEl,
  clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0)),
  gravityPxS2 = 980,
} = {}) {
  let raf = 0;
  let lastTs = 0;
  /** @type {Array<Object>} */
  let shards = [];

  function stopSim() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTs = 0;
  }

  function pointsToPath(points) {
    if (!Array.isArray(points) || points.length < 3) return "";
    const first = points[0];
    let d = `M ${Number(first.x).toFixed(2)} ${Number(first.y).toFixed(2)} `;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      d += `L ${Number(p.x).toFixed(2)} ${Number(p.y).toFixed(2)} `;
    }
    d += "Z";
    return d;
  }

  function tick(ts) {
    if (!shards.length) {
      stopSim();
      return;
    }
    if (!lastTs) lastTs = ts;
    const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;
    for (const s of shards) {
      s.vy += gravityPxS2 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.a += s.av * dt;
      const deg = (s.a * 180 / Math.PI);
      s.el.setAttribute(
        "transform",
        `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${deg.toFixed(2)} ${s.cx.toFixed(2)} ${s.cy.toFixed(2)})`
      );
    }
    raf = requestAnimationFrame(tick);
  }

  /**
   * @param {Object} p Orb shatter piece payload from orb-system.
   * @param {OrbShardPalette} palette Frozen palette snapshot.
   */
  function spawnPiece(p, palette) {
    if (!layerEl || !palette) return false;
    const d = pointsToPath(p && p.points);
    if (!d) return false;

    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("class", "orbShard");
    el.setAttribute("d", d);
    el.setAttribute("transform", "translate(0 0)");
    el.setAttribute("fill", palette.fillRgb);
    el.setAttribute("fill-opacity", String(Number(palette.fillAlpha).toFixed(3)));
    el.setAttribute("stroke", palette.strokeRgb);
    el.setAttribute("stroke-width", "1.2");
    el.setAttribute("stroke-linejoin", "round");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("vector-effect", "non-scaling-stroke");
    el.style.fill = palette.fillRgb;
    el.style.fillOpacity = String(Number(palette.fillAlpha).toFixed(3));
    el.style.stroke = palette.strokeRgb;
    layerEl.appendChild(el);

    const center = (p && p.center) || { x: 0, y: 0 };
    const cMag = Math.hypot(Number(center.x) || 0, Number(center.y) || 0) || 1;
    const jx = ((Number(center.x) || 0) / cMag) * 3.0;
    const jy = ((Number(center.y) || 0) / cMag) * 3.0;
    const shard = {
      id: p && p.pieceId,
      el,
      cx: Number(center.x) || 0,
      cy: Number(center.y) || 0,
      x: jx,
      y: jy,
      vx: Number(p && p.vx) || 0,
      vy: Number(p && p.vy) || 0,
      a: 0,
      av: Number(p && p.angVel) || 0,
    };
    shards.push(shard);
    if (!raf) raf = requestAnimationFrame(tick);

    const ttl = Math.max(50, Number(p && p.ttlMs) || 300);
    setTimeout(() => {
      shards = shards.filter((x) => x !== shard);
      try { shard.el.remove(); } catch (_) {}
    }, ttl);

    return true;
  }

  function clear() {
    shards = [];
    stopSim();
    try {
      if (layerEl) layerEl.innerHTML = "";
    } catch (_) {}
  }

  function destroy() {
    clear();
  }

  function getState() {
    return { count: shards.length, running: !!raf };
  }

  return {
    spawnPiece,
    clear,
    destroy,
    getState,
  };
}

