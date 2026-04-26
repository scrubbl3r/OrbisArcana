function roundMetric(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return String(Math.round(numeric * 10) / 10);
}

export function formatWorldWorkshopMeta(surface = null) {
  if (!surface) return "";
  return `${String(surface.kind || "")} / ${String(surface.category || "")} / ${String(surface.status || "draft")}`;
}

export function formatWorldWorkshopGeometryReadout(surface = null, metrics = null) {
  if (!surface || !metrics) return "Pending";
  switch (String(surface.generator || "")) {
    case "orb":
      return `BO ${roundMetric(metrics.bo)}px / translucent sphere diameter ${roundMetric(metrics.diameter)}px / radius ${roundMetric(metrics.radius)}px / shader shell`;
    case "orb-spawn-assembly":
      return `BO ${roundMetric(metrics.bo)}px / orb ${roundMetric(metrics.orbDiameter)}px / clearance ${roundMetric(metrics.orbClearance)}px / ground ${roundMetric(metrics.groundPlaneSize)}px / plinth scale ${roundMetric((metrics.assemblyScale || 1) * 100)}% / lit assembly`;
    case "orb-spawn-plinth":
      return `BO ${roundMetric(metrics.bo)}px / nonagon column ${roundMetric(metrics.columnWidth)}px x ${roundMetric(metrics.columnDepth)}px x ${roundMetric(metrics.columnHeight)}px / cap ${roundMetric(metrics.capitalWidth)}px / base ${roundMetric(metrics.baseWidth)}px`;
    default:
      return "No geometry readout available.";
  }
}

export function formatWorldWorkshopMaterialReadout(surface = null) {
  if (!surface) return "Pending";
  switch (String(surface.preview || "")) {
    case "world-object-inspector":
      if (String(surface.generator || "") === "orb") {
        return "World object inspector / translucent opalescent shell / additive emissive glow / saturated pastel drift";
      }
      if (String(surface.generator || "") === "orb-spawn-assembly") {
        return "Shadowed opalescent orb point light / additive emissive glow / graphite plinth faces / layered faux-glow Line2 edges";
      }
      return "World object inspector / opaque black faces / 2px white Line2 edges";
    default:
      return "No material readout available.";
  }
}
