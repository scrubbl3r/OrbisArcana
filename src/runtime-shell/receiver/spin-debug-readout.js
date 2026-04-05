function formatVec3(value) {
  if (!Array.isArray(value) || value.length < 3) return "—";
  return value.map((v) => Number(v).toFixed(2)).join("/");
}

function deriveIncomingSpinReadout(raw) {
  if (!Array.isArray(raw && raw.spinVector) || raw.spinVector.length < 3) return null;
  const x = Math.max(0, Number(raw.spinVector[0]) || 0);
  const y = Math.max(0, Number(raw.spinVector[1]) || 0);
  const z = Math.max(0, Number(raw.spinVector[2]) || 0);
  const sum = x + y + z;
  if (!(sum > 1e-6)) return null;
  const ranked = [
    { axis: "x", value: x / sum },
    { axis: "y", value: y / sum },
    { axis: "z", value: z / sum },
  ].sort((left, right) => right.value - left.value);
  return {
    axis: ranked[0].axis,
    dominance: ranked[0].value,
    gap: ranked[0].value - (ranked[1] ? ranked[1].value : 0),
  };
}

export function buildReceiverSpinDebugNote({
  raw = null,
  spin = null,
} = {}) {
  const incoming = deriveIncomingSpinReadout(raw);
  const canonicalLabel = spin && spin.label ? String(spin.label) : "—";
  const canonicalDom = spin && Number.isFinite(Number(spin.dominance)) ? Number(spin.dominance).toFixed(2) : "—";
  const canonicalGap = spin && Number.isFinite(Number(spin.gap)) ? Number(spin.gap).toFixed(2) : "—";
  const canonicalDir = spin && spin.direction ? String(spin.direction) : "—";
  const incomingLabel = incoming && incoming.axis ? incoming.axis : "—";
  const incomingDom = incoming && Number.isFinite(Number(incoming.dominance)) ? Number(incoming.dominance).toFixed(2) : "—";
  const incomingGap = incoming && Number.isFinite(Number(incoming.gap)) ? Number(incoming.gap).toFixed(2) : "—";
  const spinVector = raw && raw.spinVector ? raw.spinVector : (spin && spin.vector ? spin.vector : null);
  return `Spin compare: incoming ${incomingLabel} d${incomingDom} g${incomingGap} | canonical ${canonicalLabel} d${canonicalDom} g${canonicalGap} dir:${canonicalDir} vec:${formatVec3(spinVector)}`;
}
