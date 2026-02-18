export function createFxSystem({ eventBus }) {
  if (!eventBus || typeof eventBus.on !== 'function' || typeof eventBus.emit !== 'function') {
    throw new Error('createFxSystem requires eventBus.on and eventBus.emit');
  }

  const unsub = [];
  const pieceTimers = new Set();

  const state = {
    visualState: 'pristine',
    crackSegments: [],
    shatterActive: false,
    shards: [],
    layout: null,
  };

  function rand(rng, a, b) {
    return a + (b - a) * rng();
  }

  function createRng(seed) {
    let t = (seed >>> 0) || 1;
    return function next() {
      t += 0x6D2B79F5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function circlePoly(radius = 50, steps = 28) {
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const t = (Math.PI * 2 * i) / steps;
      pts.push({ x: radius * Math.cos(t), y: radius * Math.sin(t) });
    }
    return pts;
  }

  function clipPolyHalfPlane(poly, a, b, c) {
    if (!poly.length) return [];
    const out = [];
    const eps = 1e-6;

    function inside(p) {
      return (a * p.x + b * p.y + c) <= eps;
    }

    function intersect(p1, p2) {
      const v1 = a * p1.x + b * p1.y + c;
      const v2 = a * p2.x + b * p2.y + c;
      const den = (v1 - v2);
      if (Math.abs(den) < 1e-9) return { x: p2.x, y: p2.y };
      const t = v1 / den;
      return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      };
    }

    let prev = poly[poly.length - 1];
    let prevIn = inside(prev);
    for (const curr of poly) {
      const currIn = inside(curr);
      if (currIn) {
        if (!prevIn) out.push(intersect(prev, curr));
        out.push(curr);
      } else if (prevIn) {
        out.push(intersect(prev, curr));
      }
      prev = curr;
      prevIn = currIn;
    }
    return out;
  }

  function polyArea(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      s += (p.x * q.y - q.x * p.y);
    }
    return Math.abs(s) * 0.5;
  }

  function centroid(poly) {
    if (!poly.length) return { x: 0, y: 0 };
    let area2 = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const cross = p.x * q.y - q.x * p.y;
      area2 += cross;
      cx += (p.x + q.x) * cross;
      cy += (p.y + q.y) * cross;
    }
    if (Math.abs(area2) < 1e-6) return poly[0];
    return { x: cx / (3 * area2), y: cy / (3 * area2) };
  }

  function edgeKey(a, b) {
    const ax = Number(a.x).toFixed(3), ay = Number(a.y).toFixed(3);
    const bx = Number(b.x).toFixed(3), by = Number(b.y).toFixed(3);
    return (ax < bx || (ax === bx && ay <= by))
      ? `${ax},${ay}|${bx},${by}`
      : `${bx},${by}|${ax},${ay}`;
  }

  function pointKey(p) {
    return `${Number(p.x).toFixed(3)},${Number(p.y).toFixed(3)}`;
  }

  function pointRadius(p) {
    return Math.hypot(Number(p.x) || 0, Number(p.y) || 0);
  }

  function makeVoronoiLayout(seed = ((Math.random() * 1e9) | 0), pieceCount = 16) {
    const rng = createRng(seed);
    const bound = circlePoly(50, 30);

    const seeds = [];
    for (let i = 0; i < pieceCount; i++) {
      const r = Math.sqrt(rand(rng, 0.02, 0.95)) * 44;
      const t = rand(rng, -Math.PI, Math.PI);
      seeds.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
    }

    const cells = [];
    for (let i = 0; i < seeds.length; i++) {
      const si = seeds[i];
      let poly = bound.slice();
      for (let j = 0; j < seeds.length; j++) {
        if (i === j || poly.length === 0) continue;
        const sj = seeds[j];
        const a = 2 * (sj.x - si.x);
        const b = 2 * (sj.y - si.y);
        const c = (si.x * si.x + si.y * si.y) - (sj.x * sj.x + sj.y * sj.y);
        poly = clipPolyHalfPlane(poly, a, b, c);
      }
      if (poly.length >= 3 && polyArea(poly) > 8) {
        cells.push({ id: i, poly, center: centroid(poly) });
      }
    }

    const edges = [];
    const edgeMap = new Map();
    for (const cell of cells) {
      for (let i = 0; i < cell.poly.length; i++) {
        const a = cell.poly[i];
        const b = cell.poly[(i + 1) % cell.poly.length];
        const k = edgeKey(a, b);
        let e = edgeMap.get(k);
        if (!e) {
          e = { id: edges.length, a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, cells: [] };
          edges.push(e);
          edgeMap.set(k, e);
        }
        if (!e.cells.includes(cell.id)) e.cells.push(cell.id);
      }
    }
    for (const e of edges) e.boundary = e.cells.length === 1;

    const edgeById = new Map(edges.map((e) => [e.id, e]));
    const vertexEdges = new Map();
    for (const e of edges) {
      const ka = pointKey(e.a);
      const kb = pointKey(e.b);
      if (!vertexEdges.has(ka)) vertexEdges.set(ka, []);
      if (!vertexEdges.has(kb)) vertexEdges.set(kb, []);
      vertexEdges.get(ka).push(e.id);
      vertexEdges.get(kb).push(e.id);
    }

    const crackOrder = [];
    const seenEdges = new Set();
    const visitedVertices = new Set();

    const boundaryEdges = edges.filter((e) => e.boundary);
    if (boundaryEdges.length) {
      let startEdge = boundaryEdges[0];
      let bestR = -1;
      for (const e of boundaryEdges) {
        const mr = pointRadius({ x: (e.a.x + e.b.x) * 0.5, y: (e.a.y + e.b.y) * 0.5 });
        if (mr > bestR) { bestR = mr; startEdge = e; }
      }
      crackOrder.push(startEdge.id);
      seenEdges.add(startEdge.id);
      visitedVertices.add(pointKey(startEdge.a));
      visitedVertices.add(pointKey(startEdge.b));
      const maxLen = Math.min(28, edges.length);
      for (let step = 1; step < maxLen; step++) {
        let best = null;
        let bestScore = -Infinity;
        for (const key of visitedVertices) {
          const ids = (vertexEdges.get(key) || []).filter((id) => !seenEdges.has(id));
          for (const id of ids) {
            const e = edgeById.get(id);
            if (!e) continue;
            const aKey = pointKey(e.a);
            const bKey = pointKey(e.b);
            const aVisited = visitedVertices.has(aKey);
            const bVisited = visitedVertices.has(bKey);
            // Tree-growth rule: contiguous + acyclic. Exactly one endpoint must be new.
            if ((aVisited && bVisited) || (!aVisited && !bVisited)) continue;
            const from = (aVisited ? e.a : e.b);
            const to = (aVisited ? e.b : e.a);
            const inward = pointRadius(from) - pointRadius(to);
            const boundaryPenalty = e.boundary ? -0.35 : 0;
            const branchBias = (vertexEdges.get(key) || []).length > 2 ? 0.06 : 0;
            const jitter = rand(rng, -0.08, 0.08);
            const score = inward + boundaryPenalty + branchBias + jitter;
            if (score > bestScore) {
              bestScore = score;
              best = { edge: e, newVertexKey: aVisited ? bKey : aKey };
            }
          }
        }
        if (!best) break;
        crackOrder.push(best.edge.id);
        seenEdges.add(best.edge.id);
        visitedVertices.add(best.newVertexKey);
      }
    }

    return { seed, cells, edges, crackOrder };
  }

  function getRevealedSegments(layout, hitsTaken) {
    if (!layout || !Array.isArray(layout.edges)) return [];
    if (hitsTaken <= 0) return [];
    const revealCount = hitsTaken >= 2 ? 12 : 5;
    const ids = layout.crackOrder.slice(0, revealCount);
    const set = new Set(ids);
    return layout.edges.filter((e) => set.has(e.id)).map((e) => ({ a: e.a, b: e.b }));
  }

  function clearPieceTimers() {
    for (const t of pieceTimers) clearTimeout(t);
    pieceTimers.clear();
  }

  function rebuildLayout(seed) {
    state.layout = makeVoronoiLayout(seed);
  }

  function startShatter(payload = {}) {
    clearPieceTimers();
    state.shatterActive = true;
    state.shards = [];

    if (!state.layout) rebuildLayout(payload.seed);
    const rng = createRng((state.layout.seed || 1) ^ 0x9e3779b9);

    for (const cell of state.layout.cells) {
      const dirLen = Math.hypot(cell.center.x, cell.center.y) || 1;
      const nx = cell.center.x / dirLen;
      const ny = cell.center.y / dirLen;

      const shard = {
        id: cell.id,
        points: cell.poly,
        center: cell.center,
        vx: nx * rand(rng, 150, 320) + rand(rng, -45, 45),
        vy: ny * rand(rng, 120, 280) + rand(rng, -260, -90),
        angVel: rand(rng, -7, 7),
        ttlMs: Math.floor(rand(rng, 250, 750)),
      };

      state.shards.push(shard);
      eventBus.emit('orb.shatter_piece_spawned', {
        pieceId: shard.id,
        points: shard.points,
        center: shard.center,
        vx: shard.vx,
        vy: shard.vy,
        angVel: shard.angVel,
        ttlMs: shard.ttlMs,
      });

      const to = setTimeout(() => {
        state.shards = state.shards.filter((s) => s.id !== shard.id);
        pieceTimers.delete(to);
        if (state.shards.length === 0 && state.shatterActive) {
          state.shatterActive = false;
          eventBus.emit('orb.shatter_complete', { atMs: Date.now() });
        }
      }, shard.ttlMs);
      pieceTimers.add(to);
    }
  }

  function start() {
    rebuildLayout();

    unsub.push(eventBus.on('orb.damage_applied', (payload = {}) => {
      const hits = Number(payload.hitsTaken) || 0;
      state.crackSegments = getRevealedSegments(state.layout, hits);
    }));

    unsub.push(eventBus.on('orb.visual_state_changed', (payload = {}) => {
      state.visualState = String(payload.to || 'pristine');
      if (state.visualState === 'pristine') state.crackSegments = [];
    }));

    unsub.push(eventBus.on('orb.shatter_started', (payload = {}) => {
      state.visualState = 'shattered';
      state.crackSegments = [];
      startShatter(payload);
    }));

    unsub.push(eventBus.on('orb.revived', () => {
      clearPieceTimers();
      state.shatterActive = false;
      state.shards = [];
      state.visualState = 'pristine';
      state.crackSegments = [];
      rebuildLayout(); // new orb, new fixed Voronoi map
    }));
  }

  function stop() {
    clearPieceTimers();
    state.shatterActive = false;
    state.shards = [];
    while (unsub.length) {
      const fn = unsub.pop();
      try { fn(); } catch (_) {}
    }
  }

  function getState() {
    return {
      visualState: state.visualState,
      crackSegments: state.crackSegments.slice(),
      shatterActive: state.shatterActive,
      shards: state.shards.slice(),
      layoutSeed: state.layout ? state.layout.seed : null,
    };
  }

  return { start, stop, getState };
}
