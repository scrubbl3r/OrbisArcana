import { resolveBubbleShieldGeometry } from "../../../../src/game-runtime/orb/orb-spell-geometry.js";

export function createShieldPreview({
  els,
  GEOM,
  clamp,
  evenPx,
  setVar,
}) {
  const SHIELD_DECAY_MS = 2000;
  const SHIELD_FADEIN_MS = 750;
  let shieldTO = null;
  let shieldDecayTO = null;
  let shieldFadeTO = null;

  function getOrbDiameterPx() {
    const root = els && els.previewRoot;
    const cssDiameter = root
      ? Number(getComputedStyle(root).getPropertyValue("--orb-d").replace("px", ""))
      : 0;
    return Math.max(2, cssDiameter || Number(GEOM && GEOM.orbD) || 100);
  }

  function applyGeometry() {
    const diameterRatio = clamp(els.shieldDiameterRatio.value, 0.1, 8);
    const strokeWidthRatio = clamp(els.shieldStrokeRatio.value, 0.005, 1);
    const resolved = resolveBubbleShieldGeometry({
      diameterRatio,
      strokeWidthRatio,
    }, {
      orbDiameterPx: getOrbDiameterPx(),
      normalizeStroke: (value) => Math.max(1, Math.round(value)),
    });
    GEOM.shieldD = Math.max(10, Math.round(Number(resolved.diameterPx) || 124));
    GEOM.shieldStroke = Math.max(1, Math.round(Number(resolved.strokeWidthPx) || 4));
    els.shieldDiameterRatio.value = Number(diameterRatio).toFixed(2);
    els.shieldStrokeRatio.value = Number(strokeWidthRatio).toFixed(3);

    setVar("--shield-d", `${Number(resolved.diameterPx).toFixed(2)}px`);
    setVar("--shield-stroke", `${Number(resolved.strokeWidthPx).toFixed(2)}px`);
  }

  function cancelDecay() {
    if (shieldDecayTO) {
      clearTimeout(shieldDecayTO);
      shieldDecayTO = null;
    }
    if (els.shield) els.shield.style.opacity = "";
  }

  function cancelFade() {
    if (shieldFadeTO) {
      clearTimeout(shieldFadeTO);
      shieldFadeTO = null;
    }
  }

  function setFade(v) {
    const val = clamp(v, 0, 1);
    if (els.shield) els.shield.style.setProperty("--shield-fade", String(val));
  }

  function applyColor() {
    const r = Math.max(0, Math.min(255, Math.round(Number(els.shieldR && els.shieldR.value) || 120)));
    const g = Math.max(0, Math.min(255, Math.round(Number(els.shieldG && els.shieldG.value) || 210)));
    const b = Math.max(0, Math.min(255, Math.round(Number(els.shieldB && els.shieldB.value) || 255)));
    if (els.shieldR) els.shieldR.value = String(r);
    if (els.shieldG) els.shieldG.value = String(g);
    if (els.shieldB) els.shieldB.value = String(b);
    setVar("--shield-r", String(r));
    setVar("--shield-g", String(g));
    setVar("--shield-b", String(b));
  }

  function apply() {
    const ms = clamp(els.shieldMs.value, 80, 120000);
    const a = clamp(els.shieldAlpha.value, 0, 1);
    els.shieldMs.value = String(Math.round(ms));
    els.shieldAlpha.value = a.toFixed(2);

    applyColor();
    setVar("--shield-alpha", a.toFixed(2));
    setVar("--shield-pulse-max", a.toFixed(2));
  }

  function applyPulse() {
    const pMs = Math.round(clamp(els.pulseMs.value, 20, 700));
    let pMin = clamp(els.pulseMin.value, 0, 1);
    let pMax = clamp(els.pulseMax.value, 0, 1);

    if (pMin > pMax) {
      const t = pMin; pMin = pMax; pMax = t;
      els.pulseMin.value = pMin.toFixed(2);
      els.pulseMax.value = pMax.toFixed(2);
    }

    const a = clamp(els.shieldAlpha.value, 0, 1);
    const maxClamped = Math.min(pMax, a);

    els.pulseMs.value = String(pMs);
    els.pulseMin.value = pMin.toFixed(2);
    els.pulseMax.value = maxClamped.toFixed(2);

    setVar("--shield-pulse-ms", `${pMs}ms`);
    setVar("--shield-pulse-min", pMin.toFixed(2));
    setVar("--shield-pulse-max", maxClamped.toFixed(2));
  }

  function offNow() {
    cancelDecay();
    cancelFade();
    setFade(1);
    els.shield.classList.remove("on");
    els.shield.style.opacity = "";
    els.shield.style.animation = "";
  }

  function onNow() {
    apply();
    applyPulse();
    cancelDecay();
    cancelFade();

    if (!els.shield.classList.contains("on")) {
      offNow();
      void els.shield.offsetWidth;
      els.shield.classList.add("on");
    }

    els.shield.style.animation = "";
    els.shield.style.transition = `filter ${SHIELD_FADEIN_MS}ms linear`;
    requestAnimationFrame(() => {
      setFade(1);
    });
    shieldFadeTO = setTimeout(() => {
      shieldFadeTO = null;
      els.shield.style.transition = "";
    }, SHIELD_FADEIN_MS);
  }

  function decay() {
    if (shieldDecayTO) return;
    els.shield.style.animation = "";
    els.shield.style.transition = `filter ${SHIELD_DECAY_MS}ms linear`;
    requestAnimationFrame(() => {
      setFade(0);
    });
    shieldDecayTO = setTimeout(() => {
      shieldDecayTO = null;
      els.shield.style.transition = "";
      offNow();
    }, SHIELD_DECAY_MS);
  }

  function play() {
    onNow();

    if (shieldTO) clearTimeout(shieldTO);
    const ms = clamp(els.shieldMs.value, 80, 120000);

    shieldTO = setTimeout(() => {
      decay();
      shieldTO = null;
    }, Math.max(80, ms));
  }

  function wire() {
    els.playShield.addEventListener("click", play);
    [
      els.shieldApplyDurationBtn,
      els.shieldApplyAlphaBtn,
      els.shieldApplyColorBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", () => { apply(); applyPulse(); });
    });
    [
      els.shieldApplyDiameterBtn,
      els.shieldApplyStrokeBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", applyGeometry);
    });
    [
      els.shieldApplyPulseMsBtn,
      els.shieldApplyPulseMinBtn,
      els.shieldApplyPulseMaxBtn,
    ].forEach((btn) => {
      if (btn) btn.addEventListener("click", applyPulse);
    });
    applyGeometry();
    apply();
    applyPulse();
    offNow();
  }

  return {
    apply,
    applyGeometry,
    applyPulse,
    clear: offNow,
    play,
    wire,
  };
}
