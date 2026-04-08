function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function vDot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vCross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function vNorm(v) {
  const magnitude = Math.hypot(v.x, v.y, v.z);
  if (!(magnitude > 1e-6)) return { x: 0, y: 0, z: 0, mag: 0 };
  return { x: v.x / magnitude, y: v.y / magnitude, z: v.z / magnitude, mag: magnitude };
}

function vScale(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function basisFromGravity(gHat) {
  const zAxis = { x: -gHat.x, y: -gHat.y, z: -gHat.z };
  let ref = { x: 0, y: 1, z: 0 };
  if (Math.abs(vDot(ref, zAxis)) > 0.95) ref = { x: 1, y: 0, z: 0 };
  const xAxis = vNorm(vCross(ref, zAxis));
  const yAxis = vCross(zAxis, xAxis);
  return { xAxis, yAxis, zAxis };
}

function trimByImpulse(samples, gHat, startThreshold) {
  let i0 = -1;
  let i1 = -1;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i];
    const aRaw = { x: sample.ax, y: sample.ay, z: sample.az };
    const aLin = vSub(aRaw, vScale(gHat, vDot(aRaw, gHat)));
    const magnitude = Math.hypot(aLin.x, aLin.y, aLin.z);
    if (magnitude > startThreshold) {
      if (i0 === -1) i0 = i;
      i1 = i;
    }
  }
  if (i0 === -1 || i1 === -1 || i1 <= i0) return null;
  return { i0, i1 };
}

function resampleSamples(samples, t0, t1, n) {
  const out = [];
  const duration = Math.max(1e-3, t1 - t0);
  let i = 0;
  for (let k = 0; k < n; k += 1) {
    const tk = t0 + (duration * k) / (n - 1);
    while (i < samples.length - 1 && samples[i + 1].t < tk) i += 1;
    const s0 = samples[i];
    const s1 = samples[Math.min(i + 1, samples.length - 1)];
    const dt = s1.t - s0.t;
    const u = dt > 1e-6 ? (tk - s0.t) / dt : 0;
    out.push({
      t: tk,
      ax: lerp(s0.ax, s1.ax, u),
      ay: lerp(s0.ay, s1.ay, u),
      az: lerp(s0.az, s1.az, u),
    });
  }
  return out;
}

function buildTemplateFromSamples(samples, gHat, options = {}) {
  const startThreshold = options.startThreshold ?? 0.35;
  const minRecordMs = options.minRecordMs ?? 180;
  const resampleN = options.resampleN ?? 32;
  if (!samples || samples.length < 4) return null;
  const trim = trimByImpulse(samples, gHat, startThreshold);
  if (!trim) return null;

  const s0 = samples[trim.i0];
  const s1 = samples[trim.i1];
  const t0 = s0.t;
  const t1 = s1.t;
  const duration = t1 - t0;
  if (duration < minRecordMs) return null;

  const window = samples.slice(trim.i0, trim.i1 + 1);
  const resampled = resampleSamples(window, t0, t1, resampleN);
  const basis = basisFromGravity(gHat);

  const seq = [];
  let peak = 0;
  for (const sample of resampled) {
    const aRaw = { x: sample.ax, y: sample.ay, z: sample.az };
    const aLin = vSub(aRaw, vScale(gHat, vDot(aRaw, gHat)));
    const vx = vDot(aLin, basis.xAxis);
    const vy = vDot(aLin, basis.yAxis);
    const vz = vDot(aRaw, basis.zAxis);
    const magnitude = Math.hypot(vx, vy, vz);
    if (magnitude > peak) peak = magnitude;
    seq.push([vx, vy, vz]);
  }

  let sumSq = 0;
  for (const v of seq) sumSq += v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  const rms = Math.sqrt(sumSq / Math.max(1, seq.length * 3));
  const eps = 1e-6;
  const norm = rms + eps;
  const shape = seq.map((v) => [v[0] / norm, v[1] / norm, v[2] / norm]);
  const quality = clamp01(peak / (rms * 3 + eps));

  return { shape, power: peak, rms, quality, dur: duration };
}

function matchGestureTemplates(candidate, templates, mastery) {
  if (!candidate || !candidate.shape || !candidate.shape.length) return null;
  const cand = candidate.shape;
  let candNorm = 0;
  for (const v of cand) candNorm += v * v;
  candNorm = Math.sqrt(Math.max(1e-6, candNorm));

  let best = null;
  let bestScore = -1;
  const powerMinFrac = lerp(0.5, 0.78, clamp01(mastery));

  for (const label of Object.keys(templates || {})) {
    const template = templates[label];
    if (!template || !Array.isArray(template.shape) || !isFinite(template.power)) continue;
    if (template.shape.length !== cand.length) continue;
    let dot = 0;
    let templateNorm = 0;
    for (let i = 0; i < cand.length; i += 1) {
      dot += cand[i] * template.shape[i];
      templateNorm += template.shape[i] * template.shape[i];
    }
    templateNorm = Math.sqrt(Math.max(1e-6, templateNorm));
    const similarity = dot / (candNorm * templateNorm);
    const powerOk = candidate.power >= template.power * powerMinFrac;
    const powerScale = clamp01(candidate.power / (template.power + 1e-6));
    const finalScore = similarity * powerScale;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      best = { label, score: finalScore, similarity, powerOk };
    }
  }

  if (!best) return null;
  const scoreThreshold = lerp(0.68, 0.82, clamp01(mastery));
  if (!best.powerOk || best.score < scoreThreshold) return null;
  return best;
}

export function createTransmitterGestureLabLogic() {
  return {
    basisFromGravity,
    buildTemplateFromSamples,
    matchGestureTemplates,
  };
}
