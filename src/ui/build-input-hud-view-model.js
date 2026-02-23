function clamp01(n){
  n = Number(n);
  if (!isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function buildInputHudViewModel({
  processed,
  shakeCooldownUntil = 0,
  shakeLampThreshold = 1.65,
} = {}){
  if (!processed) return null;

  const nowMs = Number(processed.nowMs) || 0;
  const shake = Number(processed.shake) || 0;
  const shakeForUI = (nowMs < (Number(shakeCooldownUntil) || 0)) ? 0 : shake;
  const shakeLampThr = Number(shakeLampThreshold) || 1.65;
  const shakeMeter = (shakeLampThr > 1e-6)
    ? clamp01(shakeForUI / shakeLampThr)
    : 0;

  return {
    nowMs,
    lift: Number(processed.lift) || 0,
    groove: Number(processed.groove) || 0,
    smooth: Number(processed.smooth) || 0,
    speed: Number(processed.speed) || 0,
    dynamics: Number(processed.dynamics) || 0,
    shake,
    locked: !!processed.locked,
    energyUI01: Number(processed.energyUI01) || 0,
    liftP: Math.round(clamp01(processed.lift) * 100),
    gP: Math.round(clamp01(processed.groove) * 100),
    sP: Math.round(clamp01(processed.smooth) * 100),
    sp: Math.round(clamp01(processed.speed) * 100),
    dP: Math.round(clamp01(processed.dynamics) * 100),
    shakeMeter,
    sh: (Number(shakeMeter) * shakeLampThr),
    ePts: Math.round(Number(processed.energyBankPts) || 0),
    over: ((Number(processed.energyUI01) || 0) > 1),
    shieldRgb01: processed.shieldRgb01 || null,
  };
}

