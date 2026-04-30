const DEFAULT_MAX_EVENTS = 180;
const DEFAULT_REPORT_INTERVAL_MS = 500;

function nowMs() {
  return performance.now();
}

function round(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const scale = 10 ** digits;
  return Math.round(n * scale) / scale;
}

function createMetric() {
  return {
    count: 0,
    total: 0,
    max: 0,
    last: 0,
    slow: 0,
  };
}

function recordMetric(metrics, name, durationMs, slowMs = 8) {
  const metric = metrics.get(name) || createMetric();
  const duration = Math.max(0, Number(durationMs) || 0);
  metric.count += 1;
  metric.total += duration;
  metric.last = duration;
  if (duration > metric.max) metric.max = duration;
  if (duration >= slowMs) metric.slow += 1;
  metrics.set(name, metric);
  return metric;
}

function sortedMetricRows(metrics) {
  return Array.from(metrics.entries())
    .map(([name, metric]) => ({
      name,
      count: metric.count,
      avgMs: round(metric.total / Math.max(1, metric.count)),
      lastMs: round(metric.last),
      maxMs: round(metric.max),
      slow: metric.slow,
    }))
    .sort((a, b) => b.maxMs - a.maxMs);
}

export function createPerfTrace({
  maxEvents = DEFAULT_MAX_EVENTS,
  reportIntervalMs = DEFAULT_REPORT_INTERVAL_MS,
  slowFrameMs = 24,
  slowStepMs = 8,
} = {}) {
  const metrics = new Map();
  const events = [];
  let longTaskObserver = null;
  let enabled = true;
  let frameIndex = 0;
  let lastReportAtMs = 0;
  let lastFrameAtMs = 0;
  let latestFrame = null;

  function pushEvent(event) {
    if (!enabled) return;
    events.push({
      atMs: round(nowMs(), 1),
      frame: frameIndex,
      ...event,
    });
    while (events.length > maxEvents) events.shift();
  }

  function measure(name, fn) {
    if (!enabled || typeof fn !== "function") return typeof fn === "function" ? fn() : undefined;
    const start = nowMs();
    try {
      return fn();
    } finally {
      const duration = nowMs() - start;
      recordMetric(metrics, name, duration, slowStepMs);
      if (duration >= slowStepMs) {
        pushEvent({ kind: "slow-step", name, ms: round(duration) });
      }
    }
  }

  function record(name, valueMs = 0, slowMs = slowStepMs, { event = true } = {}) {
    if (!enabled) return null;
    const duration = Math.max(0, Number(valueMs) || 0);
    const metric = recordMetric(metrics, name, duration, slowMs);
    if (event && duration >= slowMs) {
      pushEvent({ kind: "slow-metric", name, ms: round(duration) });
    }
    return metric;
  }

  function frameStart({ ts = nowMs(), xW = 0, yW = 0, camLeft = 0, camTop = 0 } = {}) {
    if (!enabled) return;
    frameIndex += 1;
    const deltaMs = lastFrameAtMs ? Math.max(0, Number(ts) - lastFrameAtMs) : 0;
    lastFrameAtMs = Number(ts) || nowMs();
    if (deltaMs > 0) {
      recordMetric(metrics, "frame.rafDelta", deltaMs, 40);
      if (deltaMs >= 40) {
        pushEvent({ kind: "raf-gap", ms: round(deltaMs), xW: round(xW, 1), yW: round(yW, 1) });
      }
    }
    latestFrame = {
      frame: frameIndex,
      startedAtMs: nowMs(),
      dtMs: round(deltaMs),
      xW: round(xW, 1),
      yW: round(yW, 1),
      camLeft: round(camLeft, 1),
      camTop: round(camTop, 1),
    };
  }

  function frameEnd(extra = {}) {
    if (!enabled || !latestFrame) return;
    const duration = nowMs() - latestFrame.startedAtMs;
    recordMetric(metrics, "frame.total", duration, slowFrameMs);
    latestFrame = {
      ...latestFrame,
      ...extra,
      totalMs: round(duration),
    };
    if (duration >= slowFrameMs) {
      pushEvent({
        kind: "slow-frame",
        ms: round(duration),
        xW: latestFrame.xW,
        yW: latestFrame.yW,
        camLeft: latestFrame.camLeft,
        camTop: latestFrame.camTop,
      });
    }
  }

  function mark(name, value = "") {
    pushEvent({ kind: "mark", name, value });
  }

  function shouldReport() {
    const t = nowMs();
    if (t - lastReportAtMs < reportIntervalMs) return false;
    lastReportAtMs = t;
    return true;
  }

  function snapshot() {
    return {
      enabled,
      frameIndex,
      latestFrame,
      metrics: sortedMetricRows(metrics),
      events: events.slice(),
    };
  }

  function reset() {
    metrics.clear();
    events.length = 0;
    frameIndex = 0;
    lastReportAtMs = 0;
    lastFrameAtMs = 0;
    latestFrame = null;
  }

  function summaryLine() {
    const snap = snapshot();
    const top = snap.metrics.slice(0, 6)
      .map((row) => `${row.name} avg ${row.avgMs} max ${row.maxMs}`)
      .join(" | ");
    const frame = snap.latestFrame
      ? `frame ${snap.latestFrame.totalMs || 0}ms @ ${snap.latestFrame.xW},${snap.latestFrame.yW}`
      : "frame pending";
    return `perf ${frame}${top ? ` | ${top}` : ""}`;
  }

  function installGlobal(rootWindow = window) {
    if (!rootWindow) return;
    if (
      !longTaskObserver &&
      typeof rootWindow.PerformanceObserver === "function"
    ) {
      try {
        longTaskObserver = new rootWindow.PerformanceObserver((list) => {
          const entries = typeof list.getEntries === "function" ? list.getEntries() : [];
          for (const entry of entries) {
            const duration = Number(entry && entry.duration) || 0;
            recordMetric(metrics, "browser.longtask", duration, 50);
            pushEvent({
              kind: "longtask",
              ms: round(duration),
              name: String(entry && entry.name || "longtask"),
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch (_) {
        longTaskObserver = null;
      }
    }
    rootWindow.__orbisPerfTrace = {
      snapshot,
      reset,
      enable: () => { enabled = true; },
      disable: () => { enabled = false; },
      copy: async () => {
        const text = JSON.stringify(snapshot(), null, 2);
        if (rootWindow.navigator && rootWindow.navigator.clipboard) {
          await rootWindow.navigator.clipboard.writeText(text);
        }
        return text;
      },
      table: () => {
        const rows = snapshot().metrics;
        try { rootWindow.console.table(rows); } catch (_) {}
        return rows;
      },
    };
  }

  return Object.freeze({
    measure,
    record,
    frameStart,
    frameEnd,
    mark,
    shouldReport,
    snapshot,
    reset,
    summaryLine,
    installGlobal,
  });
}
