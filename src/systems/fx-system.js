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

    const cellById = new Map(cells.map((c) => [c.id, c]));
    const adjacency = new Map();
    for (const c of cells) adjacency.set(c.id, []);
    for (const e of edges) {
      if (e.cells.length === 2) {
        const [c1, c2] = e.cells;
        adjacency.get(c1).push({ to: c2, edgeId: e.id });
        adjacency.get(c2).push({ to: c1, edgeId: e.id });
      }
    }

    let startCell = cells[0] || null;
    let maxR = -1;
    for (const c of cells) {
      const r = Math.hypot(c.center.x, c.center.y);
      if (r > maxR) { maxR = r; startCell = c; }
    }

    const crackOrder = [];
    const seenEdges = new Set();

    if (startCell) {
      // Start crack on a boundary edge of the outer cell.
      const boundaryEdges = edges.filter((e) => e.boundary && e.cells[0] === startCell.id);
      if (boundaryEdges.length) {
        const be = boundaryEdges[Math.floor(rand(rng, 0, boundaryEdges.length))];
        crackOrder.push(be.id);
        seenEdges.add(be.id);
      }

      // Build inward branch via BFS tree.
      const q = [startCell.id];
      const visited = new Set([startCell.id]);
      while (q.length) {
        const cId = q.shift();
        const nbrs = (adjacency.get(cId) || []).slice().sort((a, b) => a.to - b.to);
        for (const n of nbrs) {
          if (visited.has(n.to)) continue;
          visited.add(n.to);
          q.push(n.to);
          if (!seenEdges.has(n.edgeId)) {
            crackOrder.push(n.edgeId);
            seenEdges.add(n.edgeId);
          }
        }
      }

      // Add a few local branch edges around the first ring.
      const firstRing = (adjacency.get(startCell.id) || []).slice(0, 5);
      for (const n of firstRing) {
        const cell = cellById.get(n.to);
        if (!cell) continue;
        for (const e of edges) {
          if (e.cells.includes(cell.id) && !seenEdges.has(e.id)) {
            crackOrder.push(e.id);
            seenEdges.add(e.id);
            if (crackOrder.length >= 18) break;
          }
        }
        if (crackOrder.length >= 18) break;
      }
    }

    return { seed, cells, edges, crackOrder };
  }

  function getRevealedSegments(layout, hitsTaken) {
    if (!layout || !Array.isArray(layout.edges)) return [];
    if (hitsTaken <= 0) return [];
    const revealCount = hitsTaken >= 2 ? 14 : 6;
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
        vx: nx * rand(rng, 90, 260) + rand(rng, -30, 30),
        vy: ny * rand(rng, 90, 220) + rand(rng, -220, -70),
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
